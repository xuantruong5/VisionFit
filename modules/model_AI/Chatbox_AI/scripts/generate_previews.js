import { writeFileSync, mkdirSync } from 'node:fs';
import { renderBearSVG } from '../apps/web/mascot/bear.js';
import { renderCatSVG } from '../apps/web/mascot/cat.js';
import { EVOLUTION_STAGES, MASCOT_STATES } from '../packages/contracts/assistant.js';

const outDir = 'docs/frontend/previews';
mkdirSync(outDir, { recursive: true });

// 1. Tạo bảng so sánh 2 loài x 4 cấp (mascot_evolution_grid.html / svg)
let evoCells = '';
let xOffset = 0;
let yOffset = 0;

const stages = ['starter', 'active', 'strong', 'champion'];
let col = 0;
for (const stg of stages) {
  const bearSvg = renderBearSVG(stg, 'idle', { idPrefix: `evo-b-${stg}` });
  evoCells += `
    <g transform="translate(${col * 220 + 20}, 50)">
      <text x="100" y="-15" text-anchor="middle" font-family="system-ui, sans-serif" font-size="14" font-weight="bold" fill="#123326">Gấu - ${stg.toUpperCase()}</text>
      ${bearSvg}
    </g>
  `;
  col++;
}

col = 0;
for (const stg of stages) {
  const catSvg = renderCatSVG(stg, 'idle', { idPrefix: `evo-c-${stg}` });
  evoCells += `
    <g transform="translate(${col * 220 + 20}, 340)">
      <text x="100" y="-15" text-anchor="middle" font-family="system-ui, sans-serif" font-size="14" font-weight="bold" fill="#123326">Mèo - ${stg.toUpperCase()}</text>
      ${catSvg}
    </g>
  `;
  col++;
}

const evoComposite = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 920 620" width="920" height="620" style="background:#edf5ef;">
  <text x="460" y="28" text-anchor="middle" font-family="system-ui, sans-serif" font-size="18" font-weight="bold" fill="#1b8a5a">BẢNG TIẾN HÓA 4 CẤP ĐỘ — GẤU VÀ MÈO VISIONFIT</text>
  ${evoCells}
</svg>
`;

writeFileSync(`${outDir}/mascot_evolution_grid.svg`, evoComposite, 'utf8');

// 2. Tạo bảng tư thế chuyển động cực trị (mascot_poses_grid.svg)
const keyStates = ['idle', 'greeting', 'thinking', 'speaking', 'training', 'celebrating', 'error'];
let poseCells = '';
let pCol = 0;
let pRow = 0;

for (const st of keyStates) {
  const bearSvg = renderBearSVG('champion', st, { idPrefix: `pose-b-${st}` });
  const x = (pCol % 4) * 220 + 20;
  const y = Math.floor(pCol / 4) * 290 + 50;

  poseCells += `
    <g transform="translate(${x}, ${y})">
      <text x="100" y="-12" text-anchor="middle" font-family="system-ui, sans-serif" font-size="13" font-weight="bold" fill="#1b8a5a">Trạng thái: ${st.toUpperCase()}</text>
      ${bearSvg}
    </g>
  `;
  pCol++;
}

const posesComposite = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 920 640" width="920" height="640" style="background:#edf5ef;">
  <text x="460" y="28" text-anchor="middle" font-family="system-ui, sans-serif" font-size="18" font-weight="bold" fill="#1b8a5a">BẢNG TƯ THẾ CHUYỂN ĐỘNG & BIỂU CẢM (7 STATES)</text>
  ${poseCells}
</svg>
`;

writeFileSync(`${outDir}/mascot_poses_grid.svg`, posesComposite, 'utf8');
console.log('Generated preview SVGs successfully!');
