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

// Trạng thái hiện tại của phòng thử
let currentSpecies = 'bear';
let currentStage = 'starter';
let currentState = 'idle';
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

// Khởi tạo MascotRenderer chính cho khung preview
const previewContainer = $('lab-mascot-preview');
let mainRenderer = null;

function initMainRenderer() {
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
  $('lbl-species').textContent = currentSpecies === 'bear' ? 'Gấu VIF' : 'Mèo VIF';
  $('lbl-stage').textContent = currentStage;
  $('lbl-state').textContent = currentState;
  $('lbl-workout-status').textContent = currentWorkout === 'training'
    ? 'Đang tập (Training)'
    : currentWorkout === 'paused'
    ? 'Tạm dừng (Paused)'
    : currentWorkout === 'completed'
    ? 'Đã xong buổi tập!'
    : 'Nghỉ ngơi';
}

function updateButtonStates() {
  // Cập nhật nút chọn loài
  $('btn-species-bear').setAttribute('aria-pressed', String(currentSpecies === 'bear'));
  $('btn-species-cat').setAttribute('aria-pressed', String(currentSpecies === 'cat'));

  // Cập nhật nút chọn cấp
  for (const stage of EVOLUTION_STAGES) {
    const btn = $(`btn-stage-${stage}`);
    if (btn) btn.setAttribute('aria-pressed', String(currentStage === stage));
  }

  // Cập nhật 7 nút trạng thái
  const statesGrid = $('states-grid');
  for (const child of statesGrid.children) {
    const isMatched = child.getAttribute('data-state') === currentState;
    child.setAttribute('aria-pressed', String(isMatched));
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
      currentState = state;
      if (mainRenderer) mainRenderer.setState(state);
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
$('btn-species-bear').onclick = () => {
  if (currentSpecies === 'bear') return;
  currentSpecies = 'bear';
  clearAllLabTimers();
  if (mainRenderer) mainRenderer.setSpecies('bear');
  renderStagesComparison();
  updateStatusLabels();
  updateButtonStates();
};

$('btn-species-cat').onclick = () => {
  if (currentSpecies === 'cat') return;
  currentSpecies = 'cat';
  clearAllLabTimers();
  if (mainRenderer) mainRenderer.setSpecies('cat');
  renderStagesComparison();
  updateStatusLabels();
  updateButtonStates();
};

// Bắt sự kiện chọn Cấp
for (const stage of EVOLUTION_STAGES) {
  const btn = $(`btn-stage-${stage}`);
  if (btn) {
    btn.onclick = () => {
      currentStage = stage;
      clearAllLabTimers();
      if (mainRenderer) mainRenderer.setStage(stage);
      updateStatusLabels();
      updateButtonStates();
    };
  }
}

// Tín hiệu buổi tập (Host Workout Signal)
$('btn-workout-start').onclick = () => {
  clearAllLabTimers();
  currentWorkout = 'training';
  if (mainRenderer) mainRenderer.setWorkoutActive(true);
  updateStatusLabels();
};

$('btn-workout-pause').onclick = () => {
  clearAllLabTimers();
  currentWorkout = 'paused';
  if (mainRenderer) {
    mainRenderer.setWorkoutActive(false);
    mainRenderer.setState('idle');
  }
  updateStatusLabels();
};

$('btn-workout-complete').onclick = () => {
  clearAllLabTimers();
  currentWorkout = 'completed';
  if (mainRenderer) {
    mainRenderer.setWorkoutActive(false);
    mainRenderer.setState('celebrating', 4000);
  }
  updateStatusLabels();
};

$('btn-workout-stop').onclick = () => {
  clearAllLabTimers();
  currentWorkout = 'idle';
  if (mainRenderer) {
    mainRenderer.setWorkoutActive(false);
    mainRenderer.setState('idle');
  }
  updateStatusLabels();
};

// Kịch bản mô phỏng phản hồi API có hủy timer an toàn
$('btn-scenario-chat').onclick = () => {
  clearAllLabTimers();
  if (!mainRenderer) return;

  // Bước 1: Suy nghĩ
  mainRenderer.setState('thinking');
  updateStatusLabels();

  // Bước 2: Trả lời sau 1.2s
  scheduleLabTimer(() => {
    if (!mainRenderer) return;
    mainRenderer.setState('speaking');
    updateStatusLabels();

    // Bước 3: Hoàn tất sau 2.5s quay về baseline
    scheduleLabTimer(() => {
      if (!mainRenderer) return;
      mainRenderer.setState(mainRenderer.baselineState);
      updateStatusLabels();
    }, 2500);
  }, 1200);
};

$('btn-scenario-celebrate').onclick = () => {
  clearAllLabTimers();
  if (mainRenderer) mainRenderer.setState('celebrating', 3200);
};

$('btn-scenario-error').onclick = () => {
  clearAllLabTimers();
  if (mainRenderer) {
    mainRenderer.setState('error');
    scheduleLabTimer(() => {
      if (mainRenderer) mainRenderer.setState(mainRenderer.baselineState);
    }, 3000);
  }
};

$('btn-reset-all').onclick = () => {
  clearAllLabTimers();
  currentSpecies = 'bear';
  currentStage = 'starter';
  currentState = 'idle';
  currentWorkout = 'idle';
  document.body.className = 'lab-bg-light';
  previewContainer.classList.remove('speed-slow', 'speed-paused', 'debug-joints');
  $('btn-bg-light').setAttribute('aria-pressed', 'true');
  $('btn-bg-dark').setAttribute('aria-pressed', 'false');
  $('btn-bg-grid').setAttribute('aria-pressed', 'false');
  $('btn-speed-normal').setAttribute('aria-pressed', 'true');
  $('btn-speed-slow').setAttribute('aria-pressed', 'false');
  $('btn-speed-pause').setAttribute('aria-pressed', 'false');
  $('btn-toggle-motion').setAttribute('aria-pressed', 'false');

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
};

// Đổi màu nền xem trước
$('btn-bg-light').onclick = () => {
  document.body.className = 'lab-bg-light';
  $('btn-bg-light').setAttribute('aria-pressed', 'true');
  $('btn-bg-dark').setAttribute('aria-pressed', 'false');
  $('btn-bg-grid').setAttribute('aria-pressed', 'false');
};

$('btn-bg-dark').onclick = () => {
  document.body.className = 'lab-bg-dark';
  $('btn-bg-light').setAttribute('aria-pressed', 'false');
  $('btn-bg-dark').setAttribute('aria-pressed', 'true');
  $('btn-bg-grid').setAttribute('aria-pressed', 'false');
};

$('btn-bg-grid').onclick = () => {
  document.body.className = 'lab-bg-grid';
  $('btn-bg-light').setAttribute('aria-pressed', 'false');
  $('btn-bg-dark').setAttribute('aria-pressed', 'false');
  $('btn-bg-grid').setAttribute('aria-pressed', 'true');
};

// Điều khiển tốc độ
$('btn-speed-normal').onclick = () => {
  previewContainer.classList.remove('speed-slow', 'speed-paused');
  $('btn-speed-normal').setAttribute('aria-pressed', 'true');
  $('btn-speed-slow').setAttribute('aria-pressed', 'false');
  $('btn-speed-pause').setAttribute('aria-pressed', 'false');
};

$('btn-speed-slow').onclick = () => {
  previewContainer.classList.remove('speed-paused');
  previewContainer.classList.add('speed-slow');
  $('btn-speed-normal').setAttribute('aria-pressed', 'false');
  $('btn-speed-slow').setAttribute('aria-pressed', 'true');
  $('btn-speed-pause').setAttribute('aria-pressed', 'false');
};

$('btn-speed-pause').onclick = () => {
  previewContainer.classList.add('speed-paused');
  $('btn-speed-normal').setAttribute('aria-pressed', 'false');
  $('btn-speed-slow').setAttribute('aria-pressed', 'false');
  $('btn-speed-pause').setAttribute('aria-pressed', 'true');
};

// Giảm chuyển động
let isReducedMotion = false;
$('btn-toggle-motion').onclick = () => {
  isReducedMotion = !isReducedMotion;
  $('btn-toggle-motion').setAttribute('aria-pressed', String(isReducedMotion));
  if (mainRenderer) mainRenderer.setReducedMotion(isReducedMotion);
};

// Hiển thị khớp (Debug Joints)
let isDebugJoints = false;
const btnToggleJoints = $('btn-toggle-joints');
if (btnToggleJoints) {
  btnToggleJoints.onclick = () => {
    isDebugJoints = !isDebugJoints;
    btnToggleJoints.setAttribute('aria-pressed', String(isDebugJoints));
    if (isDebugJoints) {
      previewContainer.classList.add('debug-joints');
    } else {
      previewContainer.classList.remove('debug-joints');
    }
  };
}

// Khởi chạy phòng thử
setupStatesButtons();
initMainRenderer();
renderStagesComparison();
updateStatusLabels();
updateButtonStates();
