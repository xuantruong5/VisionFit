import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { CONTRACT_VERSION, MASCOT_STATES, isMascotState } from '../../packages/contracts/assistant.js';
import { createApp } from '../../apps/api/app.js';
import { config } from '../../apps/api/config.js';
test('shared states are stable and unique', () => {
  assert.equal(CONTRACT_VERSION, 1);
  assert.equal(new Set(MASCOT_STATES).size, MASCOT_STATES.length);
  assert.ok(isMascotState('thinking'));
  assert.equal(isMascotState('unknown'), false);
});
test('moved frontend modules and mascot lab are served with correct MIME', async t => {
  const { server } = createApp({ ...config({}), dbPath: ':memory:' }, { logger() {} });
  server.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  for (const [url, path, type] of [
    ['/', 'apps/web/index.html', 'text/html'],
    ['/app.js', 'apps/web/app.js', 'text/javascript'],
    ['/services/api.js', 'apps/web/services/api.js', 'text/javascript'],
    ['/mascot-lab', 'apps/web/mascot/lab.html', 'text/html'],
    ['/mascot/lab.js', 'apps/web/mascot/lab.js', 'text/javascript'],
    ['/mascot/mascot.css', 'apps/web/mascot/mascot.css', 'text/css'],
    ['/contracts/assistant.js', 'packages/contracts/assistant.js', 'text/javascript']
  ]) {
    const res = await fetch(base + url); assert.equal(res.status, 200, url);
    assert.ok(res.headers.get('content-type').startsWith(type));
    assert.equal(await res.text(), await readFile(path, 'utf8'));
  }
  assert.equal((await fetch(base + '/contracts/../../.env')).status, 404);
});
