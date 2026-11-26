import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { install, FILES } from '../../scripts/install-visionfit.js';
import { basicReply } from '../../apps/api/assistant.js';
function target(t) {
  const root=mkdtempSync(join(tmpdir(),'vif-install-'));
  t.after(()=>rmSync(root,{recursive:true,force:true}));
  mkdirSync(join(root,'routes'));
  writeFileSync(join(root,'composer.json'), JSON.stringify({require:{'laravel/framework':'^12.0'}}));
  writeFileSync(join(root,'routes/api.php'),'<?php\n// existing route\n');
  return root;
}
test('installer dry-run is read-only, installs once, preserves original routes and makes backup',t=>{
  const root=target(t);
  const preview=install(root,{dryRun:true});assert.equal(preview.files.length,FILES.length);assert.ok(!existsSync(join(root,FILES[0])));
  const first=install(root);assert.ok(first.installed);assert.ok(first.routes);
  assert.equal(readFileSync(join(root,'routes/api.php.before-assistant.bak'),'utf8'),'<?php\n// existing route\n');
  const second=install(root);assert.equal(second.files.length,0);assert.equal(second.routes,false);
  assert.equal(readFileSync(join(root,'routes/api.php'),'utf8').split("require __DIR__ . '/assistant.php';").length,2);
});
test('installer fails before any writes if custom files conflict',t=>{
  const root=target(t);
  mkdirSync(join(root,'config'));writeFileSync(join(root,'config/assistant.php'),'custom');
  assert.throws(()=>install(root),/khác bản tích hợp/);
  assert.ok(!existsSync(join(root,FILES[0])));
  assert.equal(readFileSync(join(root,'routes/api.php'),'utf8'),'<?php\n// existing route\n');
});
test('real-data basic replies never confuse purchased sessions with remaining sessions',()=>{
  const c={packages:[{name:'Real package',total_sessions:24,remaining_sessions:null,expires_at:null}],schedule:[],progress:{sessions_this_week:0,completion_percent:null},profile:{},summary:null};
  const r=basicReply('Còn bao nhiêu buổi?',c,{name:'A',role:'member'});
  assert.match(r,/24 \(không phải số buổi còn lại\)/);assert.match(r,/chưa có dữ liệu xác nhận/);assert.ok(!r.includes('DEMO'));
  assert.match(basicReply('tiến độ tuần này',c,{name:'A'}),/chưa có dữ liệu/);
});
