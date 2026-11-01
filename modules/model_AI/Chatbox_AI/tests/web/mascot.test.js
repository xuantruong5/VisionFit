import test from 'node:test';
import assert from 'node:assert/strict';
import { renderBearSVG } from '../../apps/web/mascot/bear.js';
import { renderCatSVG } from '../../apps/web/mascot/cat.js';
import { MASCOT_STATES, EVOLUTION_STAGES } from '../../packages/contracts/assistant.js';

test('Bear SVG generator renders all stages and states with semantic layers', () => {
  for (const stage of EVOLUTION_STAGES) {
    for (const state of MASCOT_STATES) {
      const svg = renderBearSVG(stage, state);
      assert.ok(svg.includes('species-bear'), `Missing species-bear in stage ${stage} state ${state}`);
      assert.ok(svg.includes(`stage-${stage}`), `Missing stage-${stage}`);
      assert.ok(svg.includes(`state-${state}`), `Missing state-${state}`);
      assert.ok(svg.includes('layer-shadow'), 'Missing layer-shadow');
      assert.ok(svg.includes('layer-legs'), 'Missing layer-legs');
      assert.ok(svg.includes('layer-body'), 'Missing layer-body');
      assert.ok(svg.includes('layer-arms'), 'Missing layer-arms');
      assert.ok(svg.includes('layer-head-group'), 'Missing layer-head-group');
      assert.ok(svg.includes('layer-eyes'), 'Missing layer-eyes');
      assert.ok(svg.includes('layer-mouth'), 'Missing layer-mouth');
    }
  }
});

test('Bear Champion stage contains medal and championship styling', () => {
  const championSvg = renderBearSVG('champion', 'idle');
  assert.ok(championSvg.includes('acc-medal'), 'Champion stage must include acc-medal');
  assert.ok(championSvg.includes('body-pecs'), 'Champion stage must include muscular pecs layer');

  const starterSvg = renderBearSVG('starter', 'idle');
  assert.equal(starterSvg.includes('acc-medal'), false, 'Starter stage should not have medal');
});

test('Cat SVG generator renders all stages and includes whiskers and tail', () => {
  for (const stage of EVOLUTION_STAGES) {
    const svg = renderCatSVG(stage, 'idle');
    assert.ok(svg.includes('species-cat'), `Missing species-cat in stage ${stage}`);
    assert.ok(svg.includes('layer-whiskers'), 'Cat must have whiskers layer');
    assert.ok(svg.includes('layer-tail'), 'Cat must have tail layer');
  }
});
