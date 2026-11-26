/**
 * VisionFit Mascot Lab - Controller
 * Quản lý phòng thử nghiệm linh vật, sử dụng chung MascotRenderer và các bộ sinh SVG
 * (renderBearSVG, renderCatSVG), hủy timer sạch sẽ, không trùng lặp mã nguồn SVG.
 */

import { MASCOT_STATES, MASCOT_SPECIES, EVOLUTION_STAGES } from '../../../packages/contracts/assistant.js';
import { MascotRenderer } from './renderer.js';
import { renderBearSVG } from './bear.js';
import { renderCatSVG } from './cat.js';

const $ = (id) => document.getElementById(id);
const bindClick = (id, fn) => { const el = $(id); if (el) el.onclick = fn; };
const setAttr = (id, attr, val) => { const el = $(id); if (el) el.setAttribute(attr, val); };

// Trạng thái hiện tại của phòng thử
let currentSpecies = 'bear';
let currentStage = 'starter';
let currentState = 'stretching';
let currentWorkout = 'idle'; // 'idle' | 'training' | 'paused' | 'completed'

// Bộ quản lý timer kịch bản để hủy triệt để khi đổi trạng thái
const activeTimers = new Set();
function scheduleLabTimer(fn, delayMs) {
  const tid = setTimeout(() => {
    activeTimers.delete(tid);
    fn();
  }, delayMs);
  activeTimers.add(tid);
  return tid;
}

function clearAllLabTimers() {
  for (const tid of activeTimers) {
    clearTimeout(tid);
  }
  activeTimers.clear();
}

let mainRenderer = null;

function initMainRenderer() {
  const previewContainer = $('lab-mascot-preview');
  if (!previewContainer) return;

  if (mainRenderer) {
    mainRenderer.destroy();
    mainRenderer = null;
  }

  mainRenderer = new MascotRenderer(previewContainer, {
    instanceId: 'lab-main-mascot',
    species: currentSpecies,
    stage: currentStage,
    state: currentState,
    workoutActive: currentWorkout === 'training',
    onStateChange: (newState) => {
      currentState = newState;
      updateStatusLabels();
      updateButtonStates();
    }
  });
}

function updateStatusLabels() {
  const lblSpecies = $('lbl-species');
  if (lblSpecies) lblSpecies.textContent = currentSpecies === 'bear' ? 'Gấu VIF' : 'Mèo VIF';
  const lblStage = $('lbl-stage');
  if (lblStage) lblStage.textContent = currentStage;
  const lblState = $('lbl-state');
  if (lblState) lblState.textContent = currentState;
  const lblWorkout = $('lbl-workout-status');
  if (lblWorkout) {
    lblWorkout.textContent = currentWorkout === 'training'
      ? 'Đang tập (Training)'
      : currentWorkout === 'paused'
      ? 'Tạm dừng (Paused)'
      : currentWorkout === 'completed'
      ? 'Đã xong buổi tập!'
      : 'Nghỉ ngơi';
  }
}

function updateButtonStates() {
  // Cập nhật nút chọn loài
  setAttr('btn-species-bear', 'aria-pressed', String(currentSpecies === 'bear'));
  setAttr('btn-species-cat', 'aria-pressed', String(currentSpecies === 'cat'));

  // Cập nhật nút chọn cấp
  for (const stage of EVOLUTION_STAGES) {
    setAttr(`btn-stage-${stage}`, 'aria-pressed', String(currentStage === stage));
  }

  // Cập nhật 7 nút trạng thái
  const statesGrid = $('states-grid');
  if (statesGrid) {
    for (const child of statesGrid.children) {
      const isMatched = child.getAttribute('data-state') === currentState;
      child.setAttribute('aria-pressed', String(isMatched));
    }
  }

  // Cập nhật lưới so sánh 4 cấp
  const compareBoxes = document.querySelectorAll('.stage-compare-box');
  compareBoxes.forEach((box) => {
    if (box.getAttribute('data-stage') === currentStage) box.classList.add('active');
    else box.classList.remove('active');
  });
}

// Dựng 7 nút trạng thái cảm xúc từ contract chung
function setupStatesButtons() {
  const statesGrid = $('states-grid');
  if (!statesGrid) return;
  statesGrid.innerHTML = '';

  for (const stateKey of MASCOT_STATES) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'lab-btn';
    btn.setAttribute('data-state', stateKey);
    btn.textContent = stateKey;
    btn.onclick = () => {
      clearAllLabTimers();
      currentState = stateKey;
      if (mainRenderer) mainRenderer.setState(stateKey);
      updateStatusLabels();
      updateButtonStates();
    };
    statesGrid.appendChild(btn);
  }
}

// Hiển thị 4 cấp tiến hóa so sánh cùng lúc
function renderStagesComparison() {
  const container = $('stages-comparison-grid');
  if (!container) return;
  container.innerHTML = '';

  for (const stageKey of EVOLUTION_STAGES) {
    const box = document.createElement('div');
    box.className = `stage-compare-box ${stageKey === currentStage ? 'active' : ''}`;
    box.setAttribute('data-stage', stageKey);

    const title = document.createElement('div');
    title.className = 'stage-title';
    title.textContent = stageKey;

    const svgWrapper = document.createElement('div');
    svgWrapper.className = 'stage-svg-wrap';

    const renderFn = currentSpecies === 'bear' ? renderBearSVG : renderCatSVG;
    svgWrapper.innerHTML = renderFn(stageKey, 'idle', {
      idPrefix: `compare-${currentSpecies}-${stageKey}`
    });

    box.appendChild(title);
    box.appendChild(svgWrapper);

    box.onclick = () => {
      clearAllLabTimers();
      currentStage = stageKey;
      if (mainRenderer) mainRenderer.setStage(stageKey);
      updateStatusLabels();
      updateButtonStates();
    };

    container.appendChild(box);
  }
}

// Xử lý chuyển Loài
bindClick('btn-species-bear', () => {
  clearAllLabTimers();
  currentSpecies = 'bear';
  initMainRenderer();
  renderStagesComparison();
  updateStatusLabels();
  updateButtonStates();
});

bindClick('btn-species-cat', () => {
  clearAllLabTimers();
  currentSpecies = 'cat';
  initMainRenderer();
  renderStagesComparison();
  updateStatusLabels();
  updateButtonStates();
});

// Xử lý chuyển Cấp tiến hóa
for (const stageKey of EVOLUTION_STAGES) {
  bindClick(`btn-stage-${stageKey}`, () => {
    clearAllLabTimers();
    currentStage = stageKey;
    if (mainRenderer) mainRenderer.setStage(stageKey);
    updateStatusLabels();
    updateButtonStates();
  });
}

// Xử lý Buổi tập
bindClick('btn-workout-start', () => {
  clearAllLabTimers();
  currentWorkout = 'training';
  if (mainRenderer) mainRenderer.setWorkoutActive(true);
  updateStatusLabels();
});

bindClick('btn-workout-pause', () => {
  clearAllLabTimers();
  currentWorkout = 'paused';
  if (mainRenderer) mainRenderer.setWorkoutActive(false);
  updateStatusLabels();
});

bindClick('btn-drink-water', () => {
  clearAllLabTimers();
  if (mainRenderer) mainRenderer.triggerFiniteAnimation('drinking', 5000);
  updateStatusLabels();
  updateButtonStates();
});

bindClick('btn-scenario-stretch', () => {
  clearAllLabTimers();
  if (mainRenderer) mainRenderer.triggerFiniteAnimation('stretching', 4500);
  updateStatusLabels();
  updateButtonStates();
});

bindClick('btn-workout-complete', () => {
  clearAllLabTimers();
  currentWorkout = 'completed';
  if (mainRenderer) mainRenderer.setWorkoutActive(false);
  if (mainRenderer) mainRenderer.triggerFiniteAnimation('celebrating', 3000);
  updateStatusLabels();
});

bindClick('btn-workout-stop', () => {
  clearAllLabTimers();
  currentWorkout = 'idle';
  if (mainRenderer) mainRenderer.setWorkoutActive(false);
  if (mainRenderer) mainRenderer.setState('idle');
  updateStatusLabels();
});

// Kịch bản thử nghiệm API
bindClick('btn-scenario-chat', () => {
  clearAllLabTimers();
  if (mainRenderer) mainRenderer.setState('thinking');
  updateStatusLabels();
  updateButtonStates();

  scheduleLabTimer(() => {
    if (mainRenderer) mainRenderer.triggerFiniteAnimation('speaking', 3500);
    updateStatusLabels();
    updateButtonStates();
  }, 1500);
});

bindClick('btn-scenario-celebrate', () => {
  clearAllLabTimers();
  if (mainRenderer) mainRenderer.triggerFiniteAnimation('celebrating', 4000);
  updateStatusLabels();
  updateButtonStates();
});

bindClick('btn-scenario-error', () => {
  clearAllLabTimers();
  if (mainRenderer) mainRenderer.triggerFiniteAnimation('error', 3500);
  updateStatusLabels();
  updateButtonStates();
});

bindClick('btn-reset-all', () => {
  clearAllLabTimers();
  currentSpecies = 'bear';
  currentStage = 'starter';
  currentState = 'idle';
  currentWorkout = 'idle';

  const previewContainer = $('lab-mascot-preview');
  if (previewContainer) {
    previewContainer.className = 'lab-preview-box';
  }
  document.body.className = 'lab-bg-light';

  initMainRenderer();
  renderStagesComparison();
  updateStatusLabels();
  updateButtonStates();
});

// Điều khiển Giao diện Nền
bindClick('btn-bg-light', () => {
  document.body.className = 'lab-bg-light';
  setAttr('btn-bg-light', 'aria-pressed', 'true');
  setAttr('btn-bg-dark', 'aria-pressed', 'false');
  setAttr('btn-bg-grid', 'aria-pressed', 'false');
});

bindClick('btn-bg-dark', () => {
  document.body.className = 'lab-bg-dark';
  setAttr('btn-bg-light', 'aria-pressed', 'false');
  setAttr('btn-bg-dark', 'aria-pressed', 'true');
  setAttr('btn-bg-grid', 'aria-pressed', 'false');
});

bindClick('btn-bg-grid', () => {
  document.body.className = 'lab-bg-grid';
  setAttr('btn-bg-light', 'aria-pressed', 'false');
  setAttr('btn-bg-dark', 'aria-pressed', 'false');
  setAttr('btn-bg-grid', 'aria-pressed', 'true');
});

// Điều khiển tốc độ
bindClick('btn-speed-normal', () => {
  const previewContainer = $('lab-mascot-preview');
  if (previewContainer) previewContainer.classList.remove('speed-slow', 'speed-paused');
  setAttr('btn-speed-normal', 'aria-pressed', 'true');
  setAttr('btn-speed-slow', 'aria-pressed', 'false');
  setAttr('btn-speed-pause', 'aria-pressed', 'false');
});

bindClick('btn-speed-slow', () => {
  const previewContainer = $('lab-mascot-preview');
  if (previewContainer) {
    previewContainer.classList.remove('speed-paused');
    previewContainer.classList.add('speed-slow');
  }
  setAttr('btn-speed-normal', 'aria-pressed', 'false');
  setAttr('btn-speed-slow', 'aria-pressed', 'true');
  setAttr('btn-speed-pause', 'aria-pressed', 'false');
});

bindClick('btn-speed-pause', () => {
  const previewContainer = $('lab-mascot-preview');
  if (previewContainer) previewContainer.classList.add('speed-paused');
  setAttr('btn-speed-normal', 'aria-pressed', 'false');
  setAttr('btn-speed-slow', 'aria-pressed', 'false');
  setAttr('btn-speed-pause', 'aria-pressed', 'true');
});

// Giảm chuyển động
let isReducedMotion = false;
bindClick('btn-toggle-motion', () => {
  isReducedMotion = !isReducedMotion;
  setAttr('btn-toggle-motion', 'aria-pressed', String(isReducedMotion));
  if (mainRenderer) mainRenderer.setReducedMotion(isReducedMotion);
});

// Hiển thị khớp (Debug Joints)
let isDebugJoints = false;
bindClick('btn-toggle-joints', () => {
  const previewContainer = $('lab-mascot-preview');
  isDebugJoints = !isDebugJoints;
  setAttr('btn-toggle-joints', 'aria-pressed', String(isDebugJoints));
  if (previewContainer) {
    if (isDebugJoints) {
      previewContainer.classList.add('debug-joints');
    } else {
      previewContainer.classList.remove('debug-joints');
    }
  }
});

// Khởi chạy phòng thử khi DOM sẵn sàng
function boot() {
  setupStatesButtons();
  initMainRenderer();
  renderStagesComparison();
  updateStatusLabels();
  updateButtonStates();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
