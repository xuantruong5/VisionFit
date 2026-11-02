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
let currentState = 'idle';
let currentWorkout = 'idle'; // 'idle' | 'training' | 'paused' | 'completed'
let activeScenario = null; // null | 'chat' | 'celebrate' | 'error'

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

  // Cập nhật 4 nút tín hiệu buổi tập
  setAttr('btn-workout-start', 'aria-pressed', String(currentWorkout === 'training'));
  setAttr('btn-workout-pause', 'aria-pressed', String(currentWorkout === 'paused'));
  setAttr('btn-workout-complete', 'aria-pressed', String(currentWorkout === 'completed'));
  setAttr('btn-workout-stop', 'aria-pressed', String(currentWorkout === 'idle'));

  // Cập nhật 4 nút kịch bản phản hồi API
  setAttr('btn-scenario-chat', 'aria-pressed', String(activeScenario === 'chat'));
  setAttr('btn-scenario-celebrate', 'aria-pressed', String(activeScenario === 'celebrate'));
  setAttr('btn-scenario-error', 'aria-pressed', String(activeScenario === 'error'));

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
  for (const state of MASCOT_STATES) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'lab-btn';
    btn.textContent = state;
    btn.setAttribute('data-state', state);
    btn.setAttribute('aria-pressed', String(state === currentState));
    btn.onclick = () => {
      clearAllLabTimers();
      activeScenario = null;
      currentState = state;
      if (mainRenderer) mainRenderer.setState(state);
      updateStatusLabels();
      updateButtonStates();
    };
    statesGrid.appendChild(btn);
  }
}

// Dựng lưới so sánh 4 cấp độ tiến hóa dùng chung bộ generator
function renderStagesComparison() {
  const grid = $('stages-comparison-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const renderFn = currentSpecies === 'cat' ? renderCatSVG : renderBearSVG;

  for (const stg of EVOLUTION_STAGES) {
    const box = document.createElement('div');
    box.className = `stage-compare-box ${stg === currentStage ? 'active' : ''}`;
    box.setAttribute('data-stage', stg);

    const previewDiv = document.createElement('div');
    previewDiv.className = 'stage-compare-preview vif-mascot-container';
    previewDiv.innerHTML = renderFn(stg, 'idle', { idPrefix: `comp-${currentSpecies}-${stg}` });

    const lbl = document.createElement('div');
    lbl.className = 'stage-compare-label';
    lbl.textContent = stg;

    box.appendChild(previewDiv);
    box.appendChild(lbl);

    box.onclick = () => {
      currentStage = stg;
      if (mainRenderer) mainRenderer.setStage(stg);
      updateStatusLabels();
      updateButtonStates();
    };

    grid.appendChild(box);
  }
}

// Bắt sự kiện chọn Loài
bindClick('btn-species-bear', () => {
  if (currentSpecies === 'bear') return;
  currentSpecies = 'bear';
  clearAllLabTimers();
  activeScenario = null;
  if (mainRenderer) mainRenderer.setSpecies('bear');
  renderStagesComparison();
  updateStatusLabels();
  updateButtonStates();
});

bindClick('btn-species-cat', () => {
  if (currentSpecies === 'cat') return;
  currentSpecies = 'cat';
  clearAllLabTimers();
  activeScenario = null;
  if (mainRenderer) mainRenderer.setSpecies('cat');
  renderStagesComparison();
  updateStatusLabels();
  updateButtonStates();
});

// Bắt sự kiện chọn Cấp
for (const stage of EVOLUTION_STAGES) {
  bindClick(`btn-stage-${stage}`, () => {
    currentStage = stage;
    clearAllLabTimers();
    activeScenario = null;
    if (mainRenderer) mainRenderer.setStage(stage);
    updateStatusLabels();
    updateButtonStates();
  });
}

// Tín hiệu buổi tập (Host Workout Signal)
bindClick('btn-workout-start', () => {
  clearAllLabTimers();
  activeScenario = null;
  currentWorkout = 'training';
  if (mainRenderer) mainRenderer.setWorkoutActive(true);
  updateStatusLabels();
  updateButtonStates();
});

bindClick('btn-workout-pause', () => {
  clearAllLabTimers();
  activeScenario = null;
  currentWorkout = 'paused';
  if (mainRenderer) {
    mainRenderer.setWorkoutActive(false);
    mainRenderer.setState('idle');
  }
  updateStatusLabels();
  updateButtonStates();
});

bindClick('btn-workout-complete', () => {
  clearAllLabTimers();
  activeScenario = null;
  currentWorkout = 'completed';
  if (mainRenderer) {
    mainRenderer.setWorkoutActive(false);
    mainRenderer.setState('celebrating', 4000);
  }
  updateStatusLabels();
  updateButtonStates();
  scheduleLabTimer(() => {
    if (currentWorkout === 'completed') {
      currentWorkout = 'idle';
      updateStatusLabels();
      updateButtonStates();
    }
  }, 4000);
});

bindClick('btn-workout-stop', () => {
  clearAllLabTimers();
  activeScenario = null;
  currentWorkout = 'idle';
  if (mainRenderer) {
    mainRenderer.setWorkoutActive(false);
    mainRenderer.setState('idle');
  }
  updateStatusLabels();
  updateButtonStates();
});

// Kịch bản mô phỏng phản hồi API có hủy timer an toàn
bindClick('btn-scenario-chat', () => {
  clearAllLabTimers();
  activeScenario = 'chat';
  if (!mainRenderer) return;

  // Bước 1: Suy nghĩ
  mainRenderer.setState('thinking');
  updateStatusLabels();
  updateButtonStates();

  // Bước 2: Trả lời sau 1.2s
  scheduleLabTimer(() => {
    if (!mainRenderer) return;
    mainRenderer.setState('speaking');
    updateStatusLabels();
    updateButtonStates();

    // Bước 3: Hoàn tất sau 2.5s quay về baseline
    scheduleLabTimer(() => {
      activeScenario = null;
      if (!mainRenderer) return;
      mainRenderer.setState(mainRenderer.baselineState);
      updateStatusLabels();
      updateButtonStates();
    }, 2500);
  }, 1200);
});

bindClick('btn-scenario-celebrate', () => {
  clearAllLabTimers();
  activeScenario = 'celebrate';
  if (mainRenderer) {
    mainRenderer.setState('celebrating', 3200);
    updateStatusLabels();
    updateButtonStates();
    scheduleLabTimer(() => {
      activeScenario = null;
      updateStatusLabels();
      updateButtonStates();
    }, 3200);
  }
});

bindClick('btn-scenario-error', () => {
  clearAllLabTimers();
  activeScenario = 'error';
  if (mainRenderer) {
    mainRenderer.setState('error');
    updateStatusLabels();
    updateButtonStates();
    scheduleLabTimer(() => {
      activeScenario = null;
      if (mainRenderer) mainRenderer.setState(mainRenderer.baselineState);
      updateStatusLabels();
      updateButtonStates();
    }, 3000);
  }
});

bindClick('btn-reset-all', () => {
  clearAllLabTimers();
  activeScenario = null;
  currentSpecies = 'bear';
  currentStage = 'starter';
  currentState = 'idle';
  currentWorkout = 'idle';
  document.body.className = 'lab-bg-light';
  const previewContainer = $('lab-mascot-preview');
  if (previewContainer) {
    previewContainer.classList.remove('speed-slow', 'speed-paused', 'debug-joints');
  }
  setAttr('btn-bg-light', 'aria-pressed', 'true');
  setAttr('btn-bg-dark', 'aria-pressed', 'false');
  setAttr('btn-bg-grid', 'aria-pressed', 'false');
  setAttr('btn-speed-normal', 'aria-pressed', 'true');
  setAttr('btn-speed-slow', 'aria-pressed', 'false');
  setAttr('btn-speed-pause', 'aria-pressed', 'false');
  setAttr('btn-toggle-motion', 'aria-pressed', 'false');
  setAttr('btn-toggle-joints', 'aria-pressed', 'false');

  if (mainRenderer) {
    mainRenderer.setReducedMotion(false);
    mainRenderer.setWorkoutActive(false);
    mainRenderer.setSpecies('bear');
    mainRenderer.setStage('starter');
    mainRenderer.setState('idle');
  }
  renderStagesComparison();
  updateStatusLabels();
  updateButtonStates();
});

// Đổi màu nền xem trước
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
