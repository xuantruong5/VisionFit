import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pathToFileURL } from 'node:url';
export const FILES = [
  'app/Http/Controllers/AssistantController.php',
  'app/Http/Middleware/AssistantToken.php',
  'config/assistant.php', 'routes/assistant.php', 'tests/Feature/AssistantApiTest.php',
];
export const HOOK = "\n\n// VisionFit Assistant integration\nrequire __DIR__ . '/assistant.php';\n";
const root = fileURLToPath(new URL('../', import.meta.url));
const source = resolve(root, 'integrations/visionfit');
export function install(target, { dryRun = false } = {}) {
  if (!target) throw new Error('Cần đường dẫn thư mục Laravel, ví dụ: npm run setup:visionfit -- "D:/VisionFit/modules/backend/visionfit"');
  const dest = resolve(target);
  const composer = JSON.parse(readFileSync(resolve(dest,'composer.json'),'utf8'));
  if (!composer.require?.['laravel/framework']) throw new Error('Thư mục đích không phải backend Laravel.');
  const routes = resolve(dest, 'routes/api.php');
  const current = readFileSync(routes, 'utf8');
  if (!current.trimStart().startsWith('<?php') || current.includes('?>')) throw new Error('routes/api.php cần kiểm tra thủ công trước khi thêm route.');
  const installed = current.includes("require __DIR__ . '/assistant.php';");
  if (!installed && (/prefix\s*\(\s*['"]assistant['"]/.test(current) || /AssistantController/.test(current))) throw new Error('Đã có route assistant khác. Dừng để tránh xung đột; cần hợp nhất thủ công.');
  // Validate every destination before any write. Never overwrite customized PHP files.
  const pending = [];
  for (const file of FILES) {
    const content = readFileSync(resolve(source, file), 'utf8');
    const path = resolve(dest, file);
    if (existsSync(path)) {
      if (readFileSync(path,'utf8') !== content) throw new Error(`File đã tồn tại và khác bản tích hợp: ${file}. Cần hợp nhất thủ công.`);
    } else pending.push({ path, content, file });
  }
  if (dryRun) return { dryRun:true, files:pending.map(p=>p.file), routes:!installed };
  if (!installed) {
    const backup = routes + '.before-assistant.bak';
    if (!existsSync(backup)) copyFileSync(routes, backup);
  }
  for (const {path, content} of pending) { mkdirSync(dirname(path), {recursive:true}); writeFileSync(path, content, {flag:'wx'}); }
  if (!installed) writeFileSync(routes, current + HOOK);
  return { installed:true, files:pending.map(p=>p.file), routes:!installed };
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const dryRun = process.argv.includes('--dry-run');
    const target = process.argv.slice(2).find(arg=>arg!=='--dry-run');
    const result = install(target,{dryRun});
    console.info(JSON.stringify(result,null,2));
    if (!dryRun) console.info('Đã cài file tích hợp. Trong backend chạy: php artisan optimize:clear\nSau đó: php artisan test --filter=AssistantApiTest\nTrong chatbot: sao chép .env.visionfit.example thành .env và kiểm tra VISIONFIT_API_URL.');
  } catch(e) { console.error(e.message); process.exitCode=1; }
}
