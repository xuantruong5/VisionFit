import test from 'node:test';
import assert from 'node:assert/strict';
import { ChatboxCore, DEMO_FIXTURES } from '../../apps/web/services/chatboxCore.js';

test('ChatboxCore initializes with default state and snapshot', () => {
  const core = new ChatboxCore({ species: 'cat', stage: 'active' });
  const snapshot = core.getSnapshot();
  assert.equal(snapshot.species, 'cat');
  assert.equal(snapshot.stage, 'active');
  assert.equal(snapshot.state, 'idle');
  assert.equal(snapshot.baselineState, 'idle');
  assert.equal(snapshot.isWorkoutActive, false);
  assert.equal(snapshot.isBusy, false);
  assert.equal(snapshot.messages.length, 0);
  core.destroy();
});

test('ChatboxCore switches workout state and updates baselineState to training', () => {
  const core = new ChatboxCore();
  core.setWorkoutActive(true);
  assert.equal(core.isWorkoutActive, true);
  assert.equal(core.baselineState, 'training');
  assert.equal(core.state, 'training');

  core.setWorkoutActive(false);
  assert.equal(core.isWorkoutActive, false);
  assert.equal(core.baselineState, 'idle');
  assert.equal(core.state, 'idle');
  core.destroy();
});

test('ChatboxCore sendMessage with forceDemo returns explicit [DEMO] fixtures', async () => {
  const core = new ChatboxCore({ forceDemo: true });
  
  const reply1 = await core.sendMessage('Lịch tập hôm nay của mình là gì?');
  assert.ok(reply1.content.startsWith('[DEMO]'));
  assert.equal(reply1.isDemo, true);
  assert.ok(reply1.content.includes('Lịch tập hôm nay'));
  assert.equal(core.messages.length, 2); // 1 user + 1 assistant

  const reply2 = await core.sendMessage('Gói tập còn bao nhiêu buổi?');
  assert.ok(reply2.content.startsWith('[DEMO]'));
  assert.ok(reply2.content.includes('Gói tập'));
  assert.equal(core.messages.length, 4);

  core.destroy();
});

test('ChatboxCore retains pendingInput on error and sets mascot state to error', async () => {
  const failingFetch = async () => {
    return {
      ok: false,
      status: 500,
      json: async () => ({ error: 'Máy chủ quá tải.' })
    };
  };

  const core = new ChatboxCore({ forceDemo: false, apiFetch: failingFetch });

  await assert.rejects(
    async () => {
      await core.sendMessage('Câu hỏi này sẽ bị lỗi mạng');
    },
    /Máy chủ quá tải/
  );

  assert.equal(core.pendingInput, 'Câu hỏi này sẽ bị lỗi mạng');
  assert.equal(core.lastError, 'Máy chủ quá tải.');
  assert.equal(core.state, 'error');
  assert.equal(core.isBusy, false);

  core.destroy();
});

test('ChatboxCore notifies subscribers and clearSession cleans up completely', () => {
  const core = new ChatboxCore();
  let callCount = 0;
  const unsubscribe = core.subscribe(() => {
    callCount++;
  });

  assert.equal(callCount, 1); // initial snapshot
  core.setSpecies('cat');
  assert.equal(callCount, 2);

  core.clearSession();
  assert.equal(callCount, 3);
  assert.equal(core.messages.length, 0);

  unsubscribe();
  core.setSpecies('bear');
  assert.equal(callCount, 3); // no longer called
  core.destroy();
});
