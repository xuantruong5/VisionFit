/**
 * VisionFit Manual Pose & Biomechanics Lab
 * Interactive landmarking, live biomechanics calculation, and 3-way validation.
 */

// Landmark connectivity standard (MediaPipe / PoseNet 33 joints)
const SKELETON_EDGES = [
  [11, 12], // Shoulders
  [11, 13], [13, 15], // Left Arm
  [12, 14], [14, 16], // Right Arm
  [11, 23], [12, 24], // Torso sides
  [23, 24], // Hips
  [23, 25], [25, 27], // Left Leg
  [24, 26], [26, 28], // Right Leg
  [27, 29], [29, 31], // Left Foot
  [28, 30], [30, 32]  // Right Foot
];

const JOINT_NAMES = {
  11: "Vai Trái", 12: "Vai Phải",
  13: "Khuỷu Trái", 14: "Khuỷu Phải",
  15: "Cổ Tay Trái", 16: "Cổ Tay Phải",
  23: "Hông Trái", 24: "Hông Phải",
  25: "Gối Trái", 26: "Gối Phải",
  27: "Cổ Chân Trái", 28: "Cổ Chân Phải",
  29: "Gót Trái", 30: "Gót Phải",
  31: "Mũi Chân Trái", 32: "Mũi Chân Phải"
};

// Application State
const state = {
  subjects: {},
  currentSubject: 'person_12',
  currentFrames: [],
  currentFrameIdx: 0,
  currentRelPath: '',
  
  // Image & Canvas
  image: null,
  isSplitView: false,
  
  // Layers Data
  gtData: null,
  predData: null,
  manualPoints: {}, // joint_idx or 'q0', 'q1' -> {x, y, name, color}
  
  // Mode: 'knee_3pts', 'torso_2pts', 'valgus_4pts', 'free'
  activeMode: 'knee_3pts',
  modeStep: 0,
  
  // Interaction
  draggingPointKey: null,
  hoverPointKey: null,
  
  // Layer Toggles
  showManual: true,
  showPred: true,
  showGT: true,
  showLines: true,
};

// DOM Elements
const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d');
const subjectSelect = document.getElementById('subjectSelect');
const frameSlider = document.getElementById('frameSlider');
const frameIndexLabel = document.getElementById('frameIndexLabel');
const btnPrevFrame = document.getElementById('btnPrevFrame');
const btnNextFrame = document.getElementById('btnNextFrame');
const imageUploadInput = document.getElementById('imageUploadInput');
const btnExportCompare = document.getElementById('btnExportCompare');
const btnToggleSplit = document.getElementById('btnToggleSplit');
const viewModeBadge = document.getElementById('viewModeBadge');
const instructionText = document.getElementById('instructionText');

const chkManual = document.getElementById('chkManual');
const chkPred = document.getElementById('chkPred');
const chkGT = document.getElementById('chkGT');
const chkLines = document.getElementById('chkLines');

const btnCopyGT = document.getElementById('btnCopyGT');
const btnCopyPred = document.getElementById('btnCopyPred');
const btnClearManual = document.getElementById('btnClearManual');
const btnUndoPoint = document.getElementById('btnUndoPoint');

// Dashboard Elements
const ptsCountBadge = document.getElementById('ptsCountBadge');
const manualKneeVal = document.getElementById('manualKneeVal');
const manualDepthSub = document.getElementById('manualDepthSub');
const manualTorsoVal = document.getElementById('manualTorsoVal');
const manualTorsoSub = document.getElementById('manualTorsoSub');
const manualVerdictBox = document.getElementById('manualVerdictBox');
const manualVerdictTitle = document.getElementById('manualVerdictTitle');
const manualVerdictDesc = document.getElementById('manualVerdictDesc');
const pointsListContainer = document.getElementById('pointsListContainer');

const tblKneeManual = document.getElementById('tblKneeManual');
const tblKneePred = document.getElementById('tblKneePred');
const tblKneeGT = document.getElementById('tblKneeGT');
const tblKneeDiff = document.getElementById('tblKneeDiff');

const tblTorsoManual = document.getElementById('tblTorsoManual');
const tblTorsoPred = document.getElementById('tblTorsoPred');
const tblTorsoGT = document.getElementById('tblTorsoGT');
const tblTorsoDiff = document.getElementById('tblTorsoDiff');

const tblDepthManual = document.getElementById('tblDepthManual');
const tblDepthPred = document.getElementById('tblDepthPred');
const tblDepthGT = document.getElementById('tblDepthGT');

const tblMaePred = document.getElementById('tblMaePred');
const tblMaeGT = document.getElementById('tblMaeGT');
const pckBadge = document.getElementById('pckBadge');


// --- Initial Setup ---
async function init() {
  setupEventListeners();
  updateModeInstructions();
  await loadExtractedFramesList();
}

// --- Fetch Frame List ---
async function loadExtractedFramesList() {
  try {
    const res = await fetch('/api/extracted_frames');
    const data = await res.json();
    if (data.status === 'ok') {
      state.subjects = data.subjects;
      
      // Populate subject dropdown
      subjectSelect.innerHTML = '';
      const subjKeys = Object.keys(data.subjects);
      subjKeys.forEach(sub => {
        const opt = document.createElement('option');
        opt.value = sub;
        const count = data.subjects[sub].length;
        opt.textContent = `${sub} (${count} frames)`;
        subjectSelect.appendChild(opt);
      });

      // Default to person_12 if present, else first
      if (data.subjects['person_12']) {
        subjectSelect.value = 'person_12';
      } else if (subjKeys.length > 0) {
        subjectSelect.value = subjKeys[0];
      }

      onSubjectChanged();
    }
  } catch (err) {
    console.error("Failed to load extracted frames:", err);
    // Fallback: load demo frame
    loadFrameByPath('person_12/frame_1452.jpg');
  }
}

function onSubjectChanged() {
  state.currentSubject = subjectSelect.value;
  state.currentFrames = state.subjects[state.currentSubject] || [];
  frameSlider.max = Math.max(0, state.currentFrames.length - 1);
  state.currentFrameIdx = 0;
  frameSlider.value = 0;
  loadCurrentFrame();
}

function loadCurrentFrame() {
  if (!state.currentFrames.length) return;
  const fname = state.currentFrames[state.currentFrameIdx];
  frameIndexLabel.textContent = `${state.currentFrameIdx + 1} / ${state.currentFrames.length}`;
  const relPath = `${state.currentSubject}/${fname}`;
  loadFrameByPath(relPath);
}

// --- Load Frame & Model Data ---
async function loadFrameByPath(relPath) {
  state.currentRelPath = relPath;
  try {
    const res = await fetch(`/api/frame_details?path=${encodeURIComponent(relPath)}`);
    const data = await res.json();
    if (data.status === 'ok') {
      state.gtData = data.gt;
      state.predData = data.pred;
      
      // Load Image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        state.image = img;
        renderCanvas();
        updateDashboard();
      };
      img.src = data.image_url;

      // Update validation metrics
      if (data.metrics) {
        if (data.metrics.pck20 !== undefined) {
          pckBadge.textContent = `PCK@0.20: ${data.metrics.pck20}%`;
        }
        if (data.metrics.pixel_mae_128 !== undefined) {
          tblMaePred.textContent = `${data.metrics.pixel_mae_128} px`;
        }
      }
    }
  } catch (err) {
    console.error("Error loading frame details:", err);
  }
}

// --- Canvas Rendering Engine ---
function renderCanvas() {
  if (!state.image) return;

  const imgW = state.image.naturalWidth || 400;
  const imgH = state.image.naturalHeight || 400;

  if (state.isSplitView) {
    // Side-by-side mode: Left GT, Right Pred + Manual
    const targetW = 800;
    const targetH = 400;
    canvas.width = targetW;
    canvas.height = targetH;

    ctx.clearRect(0, 0, targetW, targetH);

    // Left Half: Ground Truth
    ctx.drawImage(state.image, 0, 0, targetW / 2, targetH);
    // Draw GT Skeleton
    if (state.showGT && state.gtData && state.gtData.keypoints) {
      drawSkeletonLayer(ctx, state.gtData.keypoints, '#10b981', 0, 0, targetW / 2, targetH, true);
    }
    // Left Label
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 15px Outfit, sans-serif';
    ctx.fillText("GROUND TRUTH (MediaPipe)", 16, 28);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '12px Outfit, sans-serif';
    ctx.fillText(`Subject: ${state.currentSubject}`, 16, targetH - 14);

    // Divider
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(targetW / 2, 0);
    ctx.lineTo(targetW / 2, targetH);
    ctx.stroke();

    // Right Half: PoseNet AI + Manual
    ctx.drawImage(state.image, targetW / 2, 0, targetW / 2, targetH);
    if (state.showPred && state.predData && state.predData.keypoints) {
      drawSkeletonLayer(ctx, state.predData.keypoints, '#f59e0b', targetW / 2, 0, targetW / 2, targetH, false);
    }
    if (state.showManual) {
      drawManualLayer(ctx, targetW / 2, 0, targetW / 2, targetH);
    }
    // Right Label
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 14px Outfit, sans-serif';
    ctx.fillText("POSENET CUSTOM (100% SELF-TRAINED)", targetW / 2 + 16, 28);

  } else {
    // Single High-Precision Canvas
    const displayW = 600;
    const displayH = Math.round(displayW * (imgH / imgW));
    canvas.width = displayW;
    canvas.height = displayH;

    ctx.clearRect(0, 0, displayW, displayH);
    ctx.drawImage(state.image, 0, 0, displayW, displayH);

    // Overlay GT if enabled
    if (state.showGT && state.gtData && state.gtData.keypoints) {
      drawSkeletonLayer(ctx, state.gtData.keypoints, 'rgba(16, 185, 129, 0.75)', 0, 0, displayW, displayH, false);
    }

    // Overlay PoseNet AI if enabled
    if (state.showPred && state.predData && state.predData.keypoints) {
      drawSkeletonLayer(ctx, state.predData.keypoints, 'rgba(245, 158, 11, 0.85)', 0, 0, displayW, displayH, false);
    }

    // Overlay Manual Landmarking
    if (state.showManual) {
      drawManualLayer(ctx, 0, 0, displayW, displayH);
    }
  }
}

// Draw a 33-landmark skeleton layer
function drawSkeletonLayer(context, keypoints, color, offsetX, offsetY, w, h, showLabels) {
  if (!keypoints || !keypoints.length) return;

  const toXY = (pt) => ({
    x: offsetX + (pt[0] * w),
    y: offsetY + (pt[1] * h)
  });

  // Bones
  if (state.showLines) {
    context.strokeStyle = color;
    context.lineWidth = 2.5;
    for (const [a, b] of SKELETON_EDGES) {
      if (a < keypoints.length && b < keypoints.length) {
        const p1 = keypoints[a];
        const p2 = keypoints[b];
        const v1 = p1.length > 3 ? p1[3] : (p1.length > 2 ? p1[2] : 1.0);
        const v2 = p2.length > 3 ? p2[3] : (p2.length > 2 ? p2[2] : 1.0);
        if (v1 >= 0.35 && v2 >= 0.35) {
          const c1 = toXY(p1);
          const c2 = toXY(p2);
          context.beginPath();
          context.moveTo(c1.x, c1.y);
          context.lineTo(c2.x, c2.y);
          context.stroke();
        }
      }
    }
  }

  // Joints
  for (let i = 0; i < keypoints.length; i++) {
    const pt = keypoints[i];
    const vis = pt.length > 3 ? pt[3] : (pt.length > 2 ? pt[2] : 1.0);
    if (vis >= 0.35) {
      const coord = toXY(pt);
      context.fillStyle = color;
      context.beginPath();
      context.arc(coord.x, coord.y, 4, 0, Math.PI * 2);
      context.fill();
    }
  }
}

// Draw user's manual points & angles
function drawManualLayer(context, offsetX, offsetY, w, h) {
  const ptsKeys = Object.keys(state.manualPoints);
  if (!ptsKeys.length) return;

  const coords = {};
  ptsKeys.forEach(k => {
    const p = state.manualPoints[k];
    coords[k] = {
      x: offsetX + (p.x * w),
      y: offsetY + (p.y * h),
      name: p.name || k
    };
  });

  // Connect manual bones based on mode
  if (state.showLines) {
    context.strokeStyle = '#06b6d4';
    context.lineWidth = 3.5;

    if (coords['hip'] && coords['knee']) {
      context.beginPath();
      context.moveTo(coords['hip'].x, coords['hip'].y);
      context.lineTo(coords['knee'].x, coords['knee'].y);
      context.stroke();
    }
    if (coords['knee'] && coords['ankle']) {
      context.beginPath();
      context.moveTo(coords['knee'].x, coords['knee'].y);
      context.lineTo(coords['ankle'].x, coords['ankle'].y);
      context.stroke();
    }
    if (coords['shoulder'] && coords['hip']) {
      context.strokeStyle = '#f59e0b';
      context.beginPath();
      context.moveTo(coords['shoulder'].x, coords['shoulder'].y);
      context.lineTo(coords['hip'].x, coords['hip'].y);
      context.stroke();
    }
    
    // Skeleton edges for 33-point mode
    for (const [a, b] of SKELETON_EDGES) {
      if (coords[a] && coords[b]) {
        context.beginPath();
        context.moveTo(coords[a].x, coords[a].y);
        context.lineTo(coords[b].x, coords[b].y);
        context.stroke();
      }
    }
  }

  // Draw angle arc if knee is complete
  if (coords['hip'] && coords['knee'] && coords['ankle']) {
    drawAngleArc(context, coords['hip'], coords['knee'], coords['ankle']);
  }

  // Draw manual dots
  ptsKeys.forEach(k => {
    const c = coords[k];
    const isHover = (state.hoverPointKey === k);

    // Outer glow
    context.fillStyle = isHover ? 'rgba(6, 182, 212, 0.5)' : 'rgba(6, 182, 212, 0.3)';
    context.beginPath();
    context.arc(c.x, c.y, isHover ? 10 : 8, 0, Math.PI * 2);
    context.fill();

    // Inner point
    context.fillStyle = '#06b6d4';
    context.beginPath();
    context.arc(c.x, c.y, 5, 0, Math.PI * 2);
    context.fill();

    // White center
    context.fillStyle = '#ffffff';
    context.beginPath();
    context.arc(c.x, c.y, 2, 0, Math.PI * 2);
    context.fill();

    // Label tag
    context.fillStyle = '#f8fafc';
    context.font = 'bold 11px Outfit, sans-serif';
    context.fillText(c.name, c.x + 8, c.y - 6);
  });
}

// Draw dynamic angle arc at knee joint
function drawAngleArc(context, a, b, c) {
  const ba = { x: a.x - b.x, y: a.y - b.y };
  const bc = { x: c.x - b.x, y: c.y - b.y };
  const angleRad = Math.acos(
    Math.max(-1, Math.min(1, (ba.x * bc.x + ba.y * bc.y) / (Math.hypot(ba.x, ba.y) * Math.hypot(bc.x, bc.y))))
  );
  const angleDeg = Math.round((angleRad * 180) / Math.PI);

  const startAngle = Math.atan2(ba.y, ba.x);
  const endAngle = Math.atan2(bc.y, bc.x);

  context.strokeStyle = angleDeg <= 80 ? '#10b981' : (angleDeg <= 100 ? '#06b6d4' : '#ef4444');
  context.lineWidth = 3;
  context.beginPath();
  context.arc(b.x, b.y, 24, startAngle, endAngle);
  context.stroke();

  // Angle Badge Text
  context.fillStyle = 'rgba(10, 13, 20, 0.85)';
  context.fillRect(b.x + 16, b.y + 6, 52, 22);
  context.strokeStyle = context.strokeStyle;
  context.strokeRect(b.x + 16, b.y + 6, 52, 22);

  context.fillStyle = '#f8fafc';
  context.font = 'bold 12px JetBrains Mono, monospace';
  context.fillText(`${angleDeg}°`, b.x + 22, b.y + 22);
}


// --- Biomechanics Calculation & Live Analytics ---
function calculateManualBiomechanics() {
  const pts = state.manualPoints;
  const res = {
    kneeAngle: null,
    torsoLean: null,
    depth: 'UNKNOWN',
    verdict: 'INCOMPLETE',
    feedback: []
  };

  // Check Knee Angle: Hip, Knee, Ankle
  const hip = pts['hip'] || pts[24] || pts[23];
  const knee = pts['knee'] || pts[26] || pts[25];
  const ankle = pts['ankle'] || pts[28] || pts[27];

  if (hip && knee && ankle) {
    const ba = [hip.x - knee.x, hip.y - knee.y];
    const bc = [ankle.x - knee.x, ankle.y - knee.y];
    const norm = Math.hypot(ba[0], ba[1]) * Math.hypot(bc[0], bc[1]);
    if (norm > 1e-6) {
      const cosA = Math.max(-1, Math.min(1, (ba[0] * bc[0] + ba[1] * bc[1]) / norm));
      res.kneeAngle = Math.round((Math.acos(cosA) * 180) / Math.PI);
      
      if (res.kneeAngle <= 80) {
        res.depth = 'DEEP_SQUAT';
        res.feedback.push("Squat sâu (Deep Squat - Đùi dưới song song mặt đất)");
      } else if (res.kneeAngle <= 100) {
        res.depth = 'PARALLEL_SQUAT';
        res.feedback.push("Squat song song (Parallel Squat - Đạt chuẩn PT)");
      } else if (res.kneeAngle <= 135) {
        res.depth = 'PARTIAL_SQUAT';
        res.feedback.push("Squat nông (Chưa hạ đủ độ sâu)");
      } else {
        res.depth = 'STANDING';
        res.feedback.push("Tư thế đứng thẳng");
      }
    }
  }

  // Check Torso Lean: Shoulder, Hip
  const sh = pts['shoulder'] || pts[12] || pts[11];
  if (sh && hip) {
    const dx = sh.x - hip.x;
    const dy = sh.y - hip.y;
    res.torsoLean = Math.round((Math.atan2(Math.abs(dx), Math.max(1e-6, -dy)) * 180) / Math.PI);
    if (res.torsoLean > 45) {
      res.feedback.push(`Cảnh báo: Thân trên gập quá mức (${res.torsoLean}° > 45°)`);
    } else {
      res.feedback.push(`Độ nghiêng thân chuẩn (${res.torsoLean}°)`);
    }
  }

  if (res.kneeAngle !== null) {
    const isGoodDepth = (res.depth === 'DEEP_SQUAT' || res.depth === 'PARALLEL_SQUAT');
    const isGoodTorso = (res.torsoLean === null || res.torsoLean <= 45);
    res.verdict = (isGoodDepth && isGoodTorso) ? 'GOOD_FORM' : (res.depth === 'STANDING' ? 'STANDING' : 'BAD_FORM');
  }

  return res;
}

// Update UI Dashboard
function updateDashboard() {
  const ptsCount = Object.keys(state.manualPoints).length;
  ptsCountBadge.textContent = `${ptsCount} Điểm`;

  const bio = calculateManualBiomechanics();

  // Manual Angle Cards
  if (bio.kneeAngle !== null) {
    manualKneeVal.innerHTML = `${bio.kneeAngle} <span class="metric-unit">°</span>`;
    manualDepthSub.textContent = bio.depth.replace('_', ' ');
  } else {
    manualKneeVal.innerHTML = `-- <span class="metric-unit">°</span>`;
    manualDepthSub.textContent = "Chưa đủ 3 điểm (Hông, Gối, Cổ chân)";
  }

  if (bio.torsoLean !== null) {
    manualTorsoVal.innerHTML = `${bio.torsoLean} <span class="metric-unit">°</span>`;
    manualTorsoSub.textContent = bio.torsoLean > 45 ? "Cảnh báo gập lưng" : "Đạt chuẩn an toàn";
  } else {
    manualTorsoVal.innerHTML = `-- <span class="metric-unit">°</span>`;
    manualTorsoSub.textContent = "Chưa có Vai & Hông";
  }

  // Verdict Box
  if (bio.verdict === 'GOOD_FORM') {
    manualVerdictBox.className = 'verdict-box';
    manualVerdictTitle.innerHTML = '<span>✅</span> FORM ĐẠT CHUẨN (PT Trương Thái Lưu)';
    manualVerdictDesc.textContent = bio.feedback.join(' · ');
  } else if (bio.verdict === 'BAD_FORM') {
    manualVerdictBox.className = 'verdict-box bad';
    manualVerdictTitle.innerHTML = '<span>⚠️</span> PHÁT HIỆN LỖI KỸ THUẬT';
    manualVerdictDesc.textContent = bio.feedback.join(' · ');
  } else if (bio.verdict === 'STANDING') {
    manualVerdictBox.className = 'verdict-box';
    manualVerdictTitle.innerHTML = '<span>🧍</span> TƯ THẾ ĐỨNG THẲNG';
    manualVerdictDesc.textContent = "Đang ở pha bắt đầu hoặc kết thúc rep.";
  } else {
    manualVerdictBox.className = 'verdict-box';
    manualVerdictTitle.innerHTML = '<span>⏳</span> Đang đợi bạn chấm điểm...';
    manualVerdictDesc.textContent = 'Hãy click chuột lên ảnh để chấm khớp theo hướng dẫn bên trên.';
  }

  // Update 3-Way Comparison Table
  tblKneeManual.textContent = bio.kneeAngle !== null ? `${bio.kneeAngle}°` : '--';
  tblTorsoManual.textContent = bio.torsoLean !== null ? `${bio.torsoLean}°` : '--';
  tblDepthManual.textContent = bio.depth !== 'UNKNOWN' ? bio.depth : '--';

  // Ground Truth row
  const gtBio = state.gtData ? state.gtData.biomechanics : null;
  if (gtBio) {
    tblKneeGT.textContent = gtBio.knee_angle ? `${gtBio.knee_angle}°` : '--';
    tblTorsoGT.textContent = gtBio.torso_lean ? `${gtBio.torso_lean}°` : '--';
    tblDepthGT.textContent = gtBio.squat_depth || '--';
  }

  // PoseNet AI row
  const predBio = state.predData ? state.predData.biomechanics : null;
  if (predBio) {
    tblKneePred.textContent = predBio.knee_angle ? `${predBio.knee_angle}°` : '--';
    tblTorsoPred.textContent = predBio.torso_lean ? `${predBio.torso_lean}°` : '--';
    tblDepthPred.textContent = predBio.squat_depth || '--';
  }

  // Diff Tay vs AI
  if (bio.kneeAngle !== null && predBio && predBio.knee_angle) {
    const diff = Math.abs(bio.kneeAngle - predBio.knee_angle).toFixed(1);
    tblKneeDiff.textContent = `Δ ${diff}°`;
    tblKneeDiff.style.color = diff <= 5.0 ? '#10b981' : '#f59e0b';
  } else {
    tblKneeDiff.textContent = '--';
  }

  if (bio.torsoLean !== null && predBio && predBio.torso_lean) {
    const diff = Math.abs(bio.torsoLean - predBio.torso_lean).toFixed(1);
    tblTorsoDiff.textContent = `Δ ${diff}°`;
    tblTorsoDiff.style.color = diff <= 5.0 ? '#10b981' : '#f59e0b';
  } else {
    tblTorsoDiff.textContent = '--';
  }

  // Render Points List
  renderPointsList();
}

function renderPointsList() {
  const keys = Object.keys(state.manualPoints);
  if (!keys.length) {
    pointsListContainer.innerHTML = `<div style="color: var(--text-dim); font-size: 0.82rem; text-align: center; padding: 12px;">Chưa có điểm nào được chấm</div>`;
    return;
  }

  pointsListContainer.innerHTML = '';
  keys.forEach(k => {
    const p = state.manualPoints[k];
    const row = document.createElement('div');
    row.className = 'point-item';
    row.innerHTML = `
      <div>
        <span class="point-badge" style="background: #06b6d4;">${k.substring(0,2).toUpperCase()}</span>
        <b>${p.name || k}</b>: (${(p.x * 100).toFixed(1)}%, ${(p.y * 100).toFixed(1)}%)
      </div>
      <button style="background:none; border:none; color: #ef4444; cursor:pointer; font-size: 0.8rem;" data-del="${k}" title="Xóa điểm này">✖</button>
    `;
    row.querySelector('[data-del]').addEventListener('click', (e) => {
      e.stopPropagation();
      delete state.manualPoints[k];
      renderCanvas();
      updateDashboard();
    });
    pointsListContainer.appendChild(row);
  });
}


// --- Mode Instructions ---
function updateModeInstructions() {
  if (state.activeMode === 'knee_3pts') {
    const steps = [
      "Click chuột vào KHỚP HÔNG (Hip) trên cơ thể",
      "Click chuột vào KHỚP GỐI (Knee) trên cơ thể",
      "Click chuột vào KHỚP CỔ CHÂN (Ankle) trên cơ thể"
    ];
    instructionText.textContent = steps[Math.min(state.modeStep, steps.length - 1)];
  } else if (state.activeMode === 'torso_2pts') {
    const steps = [
      "Click chuột vào KHỚP VAI (Shoulder)",
      "Click chuột vào KHỚP HÔNG (Hip)"
    ];
    instructionText.textContent = steps[Math.min(state.modeStep, steps.length - 1)];
  } else if (state.activeMode === 'valgus_4pts') {
    const steps = [
      "Click GỐI TRÁI",
      "Click GỐI PHẢI",
      "Click CỔ CHÂN TRÁI",
      "Click CỔ CHÂN PHẢI"
    ];
    instructionText.textContent = steps[Math.min(state.modeStep, steps.length - 1)];
  } else {
    instructionText.textContent = "Click bất kỳ vị trí nào để thêm điểm, hoặc kéo thả điểm đã chấm";
  }
}


// --- Mouse Event Handlers ---
function setupEventListeners() {
  
  // Mode selection buttons
  document.querySelectorAll('.tool-mode-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.tool-mode-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.activeMode = pill.getAttribute('data-mode');
      state.modeStep = 0;
      updateModeInstructions();
    });
  });

  // Split View Toggle
  btnToggleSplit.addEventListener('click', () => {
    state.isSplitView = !state.isSplitView;
    viewModeBadge.textContent = state.isSplitView ? "CHIA ĐÔI SONG SONG" : "CANVAS ĐƠN";
    btnToggleSplit.textContent = state.isSplitView ? "Canvas Đơn 🔳" : "Chia Đôi Song Song 🔲";
    renderCanvas();
  });

  // Layer toggles
  chkManual.addEventListener('change', () => { state.showManual = chkManual.checked; renderCanvas(); });
  chkPred.addEventListener('change', () => { state.showPred = chkPred.checked; renderCanvas(); });
  chkGT.addEventListener('change', () => { state.showGT = chkGT.checked; renderCanvas(); });
  chkLines.addEventListener('change', () => { state.showLines = chkLines.checked; renderCanvas(); });

  // Subject and Frame controls
  subjectSelect.addEventListener('change', onSubjectChanged);
  frameSlider.addEventListener('input', () => {
    state.currentFrameIdx = parseInt(frameSlider.value, 10);
    loadCurrentFrame();
  });
  btnPrevFrame.addEventListener('click', () => {
    if (state.currentFrameIdx > 0) {
      state.currentFrameIdx--;
      frameSlider.value = state.currentFrameIdx;
      loadCurrentFrame();
    }
  });
  btnNextFrame.addEventListener('click', () => {
    if (state.currentFrameIdx < state.currentFrames.length - 1) {
      state.currentFrameIdx++;
      frameSlider.value = state.currentFrameIdx;
      loadCurrentFrame();
    }
  });

  // Custom Image Upload
  imageUploadInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        state.image = img;
        state.gtData = null;
        state.predData = null;
        state.currentSubject = file.name;
        renderCanvas();
        updateDashboard();
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });

  // Copy Ground Truth into Manual
  btnCopyGT.addEventListener('click', () => {
    if (!state.gtData || !state.gtData.keypoints) return;
    state.manualPoints = {};
    const kpts = state.gtData.keypoints;
    if (kpts[24] && kpts[26] && kpts[28]) {
      state.manualPoints['hip'] = { x: kpts[24][0], y: kpts[24][1], name: "Hông" };
      state.manualPoints['knee'] = { x: kpts[26][0], y: kpts[26][1], name: "Gối" };
      state.manualPoints['ankle'] = { x: kpts[28][0], y: kpts[28][1], name: "Cổ chân" };
    }
    if (kpts[12]) {
      state.manualPoints['shoulder'] = { x: kpts[12][0], y: kpts[12][1], name: "Vai" };
    }
    renderCanvas();
    updateDashboard();
  });

  // Copy AI Prediction into Manual
  btnCopyPred.addEventListener('click', () => {
    if (!state.predData || !state.predData.keypoints) return;
    state.manualPoints = {};
    const kpts = state.predData.keypoints;
    if (kpts[24] && kpts[26] && kpts[28]) {
      state.manualPoints['hip'] = { x: kpts[24][0], y: kpts[24][1], name: "Hông" };
      state.manualPoints['knee'] = { x: kpts[26][0], y: kpts[26][1], name: "Gối" };
      state.manualPoints['ankle'] = { x: kpts[28][0], y: kpts[28][1], name: "Cổ chân" };
    }
    if (kpts[12]) {
      state.manualPoints['shoulder'] = { x: kpts[12][0], y: kpts[12][1], name: "Vai" };
    }
    renderCanvas();
    updateDashboard();
  });

  // Clear & Undo
  btnClearManual.addEventListener('click', () => {
    state.manualPoints = {};
    state.modeStep = 0;
    updateModeInstructions();
    renderCanvas();
    updateDashboard();
  });

  btnUndoPoint.addEventListener('click', () => {
    const keys = Object.keys(state.manualPoints);
    if (keys.length > 0) {
      delete state.manualPoints[keys[keys.length - 1]];
      if (state.modeStep > 0) state.modeStep--;
      updateModeInstructions();
      renderCanvas();
      updateDashboard();
    }
  });

  // Export Comparison Image
  btnExportCompare.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = `visionfit_eval_${state.currentSubject}_frame${state.currentFrameIdx}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  });

  // Canvas Mouse Interactions
  canvas.addEventListener('mousedown', onCanvasMouseDown);
  canvas.addEventListener('mousemove', onCanvasMouseMove);
  window.addEventListener('mouseup', onCanvasMouseUp);
}

// Convert canvas click to normalized coordinates [0, 1]
function getCanvasNormalizedCoord(e) {
  const rect = canvas.getBoundingClientRect();
  const rawX = e.clientX - rect.left;
  const rawY = e.clientY - rect.top;

  let normX, normY;
  if (state.isSplitView) {
    // In split view, clicks on right half represent [0, 1] of the frame
    const halfW = canvas.width / 2;
    normX = (rawX - halfW) / halfW;
    normY = rawY / canvas.height;
  } else {
    normX = rawX / canvas.width;
    normY = rawY / canvas.height;
  }

  return {
    x: Math.max(0, Math.min(1, normX)),
    y: Math.max(0, Math.min(1, normY)),
    rawX, rawY
  };
}

function onCanvasMouseDown(e) {
  if (e.button !== 0) return; // Only left click
  const { x, y, rawX, rawY } = getCanvasNormalizedCoord(e);

  // Check if clicked close to an existing point to start dragging
  const threshold = 18; // px
  for (const k of Object.keys(state.manualPoints)) {
    const p = state.manualPoints[k];
    let ptScreenX, ptScreenY;
    if (state.isSplitView) {
      ptScreenX = (canvas.width / 2) + p.x * (canvas.width / 2);
      ptScreenY = p.y * canvas.height;
    } else {
      ptScreenX = p.x * canvas.width;
      ptScreenY = p.y * canvas.height;
    }

    if (Math.hypot(rawX - ptScreenX, rawY - ptScreenY) <= threshold) {
      state.draggingPointKey = k;
      return;
    }
  }

  // Otherwise, place new point based on active mode
  if (state.activeMode === 'knee_3pts') {
    const keys = ['hip', 'knee', 'ankle'];
    const names = ['Hông', 'Gối', 'Cổ chân'];
    const k = keys[state.modeStep % 3];
    const n = names[state.modeStep % 3];
    state.manualPoints[k] = { x, y, name: n };
    state.modeStep = (state.modeStep + 1) % 3;
  } else if (state.activeMode === 'torso_2pts') {
    const keys = ['shoulder', 'hip'];
    const names = ['Vai', 'Hông'];
    const k = keys[state.modeStep % 2];
    const n = names[state.modeStep % 2];
    state.manualPoints[k] = { x, y, name: n };
    state.modeStep = (state.modeStep + 1) % 2;
  } else if (state.activeMode === 'valgus_4pts') {
    const keys = [25, 26, 27, 28];
    const names = ['Gối T', 'Gối P', 'Cổ chân T', 'Cổ chân P'];
    const k = keys[state.modeStep % 4];
    const n = names[state.modeStep % 4];
    state.manualPoints[k] = { x, y, name: n };
    state.modeStep = (state.modeStep + 1) % 4;
  } else {
    // Free mode
    const count = Object.keys(state.manualPoints).length;
    state.manualPoints[`p${count + 1}`] = { x, y, name: `Điểm ${count + 1}` };
  }

  updateModeInstructions();
  renderCanvas();
  updateDashboard();
}

function onCanvasMouseMove(e) {
  const { x, y, rawX, rawY } = getCanvasNormalizedCoord(e);

  if (state.draggingPointKey) {
    state.manualPoints[state.draggingPointKey].x = x;
    state.manualPoints[state.draggingPointKey].y = y;
    renderCanvas();
    updateDashboard();
    return;
  }

  // Hover detection
  const threshold = 16;
  let hovered = null;
  for (const k of Object.keys(state.manualPoints)) {
    const p = state.manualPoints[k];
    let ptScreenX, ptScreenY;
    if (state.isSplitView) {
      ptScreenX = (canvas.width / 2) + p.x * (canvas.width / 2);
      ptScreenY = p.y * canvas.height;
    } else {
      ptScreenX = p.x * canvas.width;
      ptScreenY = p.y * canvas.height;
    }

    if (Math.hypot(rawX - ptScreenX, rawY - ptScreenY) <= threshold) {
      hovered = k;
      break;
    }
  }

  state.hoverPointKey = hovered;
  canvas.style.cursor = hovered ? 'grab' : 'crosshair';
  if (hovered) renderCanvas();
}

function onCanvasMouseUp() {
  if (state.draggingPointKey) {
    state.draggingPointKey = null;
    canvas.style.cursor = 'crosshair';
    renderCanvas();
    updateDashboard();
  }
}

// Start app
window.addEventListener('DOMContentLoaded', init);
