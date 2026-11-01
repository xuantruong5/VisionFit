import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderBearSVG } from '../../apps/web/mascot/bear.js';
import { renderCatSVG } from '../../apps/web/mascot/cat.js';
import { MascotRenderer } from '../../apps/web/mascot/renderer.js';
import { MASCOT_STATES, EVOLUTION_STAGES, MASCOT_SPECIES } from '../../packages/contracts/assistant.js';

test('Bear SVG generator renders all stages and states with semantic layers and joint hierarchy', () => {
  for (const stage of EVOLUTION_STAGES) {
    for (const state of MASCOT_STATES) {
      const svg = renderBearSVG(stage, state);
      assert.ok(svg.includes('species-bear'), `Missing species-bear in stage ${stage} state ${state}`);
      assert.ok(svg.includes(`stage-${stage}`), `Missing stage-${stage}`);
      assert.ok(svg.includes(`state-${state}`), `Missing state-${state}`);
      assert.ok(svg.includes('layer-shadow'), 'Missing layer-shadow');
      assert.ok(svg.includes('character-root'), 'Missing character-root');
      assert.ok(svg.includes('torso-rig'), 'Missing torso-rig');
      assert.ok(svg.includes('layer-legs'), 'Missing layer-legs');
      assert.ok(svg.includes('layer-body'), 'Missing layer-body');
      assert.ok(svg.includes('layer-arms'), 'Missing layer-arms');
      assert.ok(svg.includes('layer-head-group'), 'Missing layer-head-group');
      assert.ok(svg.includes('layer-eyes'), 'Missing layer-eyes');
      assert.ok(svg.includes('layer-mouth'), 'Missing layer-mouth');

      // Shadow phải nằm trước character-root (ngoài nhóm nhân vật)
      const shadowIndex = svg.indexOf('class="layer-shadow"');
      const rootIndex = svg.indexOf('class="character-root"');
      assert.ok(shadowIndex !== -1 && rootIndex !== -1 && shadowIndex < rootIndex, 'layer-shadow must precede character-root');

      // Khớp cẳng tay (forearm) và bàn tay (paw) gập khuỷu
      assert.ok(svg.includes('forearm-left') && svg.includes('forearm-right'), 'Missing 2-segment forearm rig');
      assert.ok(svg.includes('paw-left') && svg.includes('paw-right'), 'Missing paws in forearm');
      assert.ok(svg.includes('joint-marker'), 'Missing SVG joint markers');

      // Tạ phải là con của nhóm cẳng tay
      const forearmLeftIdx = svg.indexOf('class="forearm forearm-left"');
      const dumbbellLeftIdx = svg.indexOf('class="prop-dumbbell-left"');
      assert.ok(forearmLeftIdx !== -1 && dumbbellLeftIdx !== -1 && forearmLeftIdx < dumbbellLeftIdx, 'Dumbbell must belong to forearm group');

      // Không dùng rx trên thẻ path
      assert.equal(/<path[^>]*\brx=/i.test(svg), false, 'SVG path must not contain invalid rx attribute');
    }
  }
});

test('Bear Champion stage contains medal attached to torso-rig (not head group)', () => {
  const championSvg = renderBearSVG('champion', 'idle');
  assert.ok(championSvg.includes('acc-medal'), 'Champion stage must include acc-medal');
  assert.ok(championSvg.includes('body-pecs'), 'Champion stage must include muscular pecs layer');

  // Kiểm tra vị trí của acc-medal: phải nằm TRƯỚC layer-head-group để không lắc theo đầu
  const medalIndex = championSvg.indexOf('class="acc-medal"');
  const headIndex = championSvg.indexOf('class="layer-head-group"');
  assert.ok(medalIndex !== -1 && headIndex !== -1 && medalIndex < headIndex, 'acc-medal must belong to torso-rig and be separate from head-group');

  const starterSvg = renderBearSVG('starter', 'idle');
  assert.equal(starterSvg.includes('acc-medal'), false, 'Starter stage should not have medal');
});

test('Cat SVG generator renders all stages with whiskers, tail and joint hierarchy', () => {
  for (const stage of EVOLUTION_STAGES) {
    for (const state of MASCOT_STATES) {
      const svg = renderCatSVG(stage, state);
      assert.ok(svg.includes('species-cat'), `Missing species-cat in stage ${stage}`);
      assert.ok(svg.includes('character-root'), 'Missing character-root in cat');
      assert.ok(svg.includes('torso-rig'), 'Missing torso-rig in cat');
      assert.ok(svg.includes('forearm-left') && svg.includes('forearm-right'), 'Cat missing 2-segment forearms');
      assert.ok(svg.includes('paw-left') && svg.includes('paw-right'), 'Cat missing paws');
      assert.ok(svg.includes('layer-whiskers'), 'Cat must have whiskers layer');
      assert.ok(svg.includes('layer-tail'), 'Cat must have tail layer');
      assert.equal(/<path[^>]*\brx=/i.test(svg), false, 'Cat SVG path must not contain invalid rx attribute');
    }
  }
});

test('Multiple instances have unique gradient IDs preventing collision', () => {
  const svg1 = renderBearSVG('active', 'idle', { idPrefix: 'inst-1' });
  const svg2 = renderBearSVG('active', 'idle', { idPrefix: 'inst-2' });

  assert.ok(svg1.includes('id="inst-1-fabric"') || svg1.includes('id="inst-1-shadow"'));
  assert.ok(svg1.includes('url(#inst-1-shadow)'));
  assert.ok(svg2.includes('id="inst-2-fabric"') || svg2.includes('id="inst-2-shadow"'));
  assert.ok(svg2.includes('url(#inst-2-shadow)'));
  assert.equal(svg1.includes('id="inst-2-shadow"'), false);
});

test('mascot.css keyframes eliminate limb detachment and enforce proper physics', async () => {
  const css = await readFile('apps/web/mascot/mascot.css', 'utf8');

  // 1. Không dùng translateY trong các keyframe cử tạ (gây kéo rời vai)
  const curlLeftMatch = css.match(/@keyframes\s+vif-curl-left\s*\{([^}]+)\}/);
  assert.ok(curlLeftMatch, 'Missing vif-curl-left keyframe');
  assert.equal(curlLeftMatch[1].includes('translateY'), false, 'vif-curl-left must not use translateY');

  const curlRightMatch = css.match(/@keyframes\s+vif-curl-right\s*\{([^}]+)\}/);
  assert.ok(curlRightMatch, 'Missing vif-curl-right keyframe');
  assert.equal(curlRightMatch[1].includes('translateY'), false, 'vif-curl-right must not use translateY');

  // 2. Không dùng translateY trong chin-touch và gesture-left
  const chinMatch = css.match(/@keyframes\s+vif-chin-touch\s*\{([^}]+)\}/);
  assert.ok(chinMatch, 'Missing vif-chin-touch keyframe');
  assert.equal(chinMatch[1].includes('translateY'), false, 'vif-chin-touch must not use translateY');

  const gestureMatch = css.match(/@keyframes\s+vif-gesture-left\s*\{([^}]+)\}/);
  assert.ok(gestureMatch, 'Missing vif-gesture-left keyframe');
  assert.equal(gestureMatch[1].includes('translateY'), false, 'vif-gesture-left must not use translateY');

  // 3. Celebrating cheer arms: tay trái góc âm, tay phải góc dương
  const cheerLeftMatch = css.match(/@keyframes\s+vif-arm-cheer-left\s*\{([\s\S]*?)\n\}/);
  assert.ok(cheerLeftMatch, 'Missing vif-arm-cheer-left keyframe');
  assert.ok(cheerLeftMatch[1].includes('-120deg') && cheerLeftMatch[1].includes('-145deg'), 'vif-arm-cheer-left must use negative degrees');

  const cheerRightMatch = css.match(/@keyframes\s+vif-arm-cheer-right\s*\{([\s\S]*?)\n\}/);
  assert.ok(cheerRightMatch, 'Missing vif-arm-cheer-right keyframe');
  assert.ok(cheerRightMatch[1].includes('120deg') && cheerRightMatch[1].includes('145deg'), 'vif-arm-cheer-right must use positive degrees');

  // 4. Tab-hidden pauses root SVG and descendants
  assert.ok(css.includes('.tab-hidden .vif-mascot-svg,') || css.includes('.tab-hidden .vif-mascot-svg'), 'tab-hidden must pause root SVG');
  assert.ok(css.includes('animation-play-state: paused !important'));

  // 5. CSS animation-duration hợp lệ (không dùng 400%)
  assert.equal(css.includes('animation-duration: 400%'), false, 'animation-duration must not be 400%');
});

test('MascotRenderer updates DOM state attributes without innerHTML thrashing', () => {
  // Tạo giả lập DOM container đơn giản
  const classList = new Set();
  const attributes = new Map();
  let innerHTMLValue = '';

  const mockSvg = {
    classList: {
      add: (cls) => classList.add(cls),
      remove: (cls) => classList.delete(cls),
      contains: (cls) => classList.has(cls)
    },
    setAttribute: (name, val) => attributes.set(name, val),
    getAttribute: (name) => attributes.get(name) || null,
    offsetWidth: 200
  };

  const container = {
    classList: {
      add: (cls) => classList.add(cls),
      remove: (cls) => classList.delete(cls),
      contains: (cls) => classList.has(cls)
    },
    get innerHTML() { return innerHTMLValue; },
    set innerHTML(val) {
      innerHTMLValue = val;
    },
    querySelector: (sel) => {
      if (sel === '.vif-mascot-svg') return mockSvg;
      return null;
    }
  };

  const renderer = new MascotRenderer(container, { species: 'bear', stage: 'active', state: 'idle' });
  assert.equal(renderer.state, 'idle');
  assert.equal(renderer.species, 'bear');

  // Thay đổi state: kiểm tra không gọi lại innerHTML setter
  const initialHTML = container.innerHTML;
  renderer.setState('speaking');
  assert.equal(renderer.state, 'speaking');
  assert.equal(attributes.get('data-state'), 'speaking');
  assert.ok(classList.has('state-speaking'));
  assert.equal(classList.has('state-idle'), false);
  // innerHTML vẫn giữ nguyên bản ban đầu, không bị rebuild lại toàn bộ DOM
  assert.equal(container.innerHTML, initialHTML);

  // Khi đang ở idle, kích hoạt workoutActive sẽ tự động chuyển sang training
  renderer.setState('idle');
  assert.equal(renderer.state, 'idle');

  renderer.setWorkoutActive(true);
  assert.equal(renderer.isWorkoutActive, true);
  assert.equal(renderer.baselineState, 'training');
  assert.equal(renderer.state, 'training');
  assert.equal(attributes.get('data-state'), 'training');

  // Dọn dẹp
  renderer.destroy();
  assert.equal(renderer.timer, null);
});
