"""VisionFit local skeleton action classifier. No HTTP/API calls."""
import sys
import argparse
import csv
import json
import random
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

import numpy as np
import torch
from torch import nn
from torch.utils.data import DataLoader, TensorDataset, Dataset

from core.metrics import classification_report

JOINTS = 33
FEATURES = 4
LABELS = ['squat', 'push_up', 'lunge', 'standing']
LEFT_HIP, RIGHT_HIP, LEFT_SHOULDER, RIGHT_SHOULDER = 23, 24, 11, 12


def normalize(sequence):
    """Input (T,33,4): normalized image x/y, relative z, visibility in [0,1]."""
    x = np.asarray(sequence, dtype=np.float32).copy()
    if x.ndim != 3 or x.shape[1:] != (JOINTS, FEATURES):
        raise ValueError(f'Expected (T,33,4), got {x.shape}')
    if not np.isfinite(x).all():
        raise ValueError('Coordinates must be finite')
    if x.shape[0] < 2:
        raise ValueError('Need at least two frames')
    x[:, :, 3] = np.clip(x[:, :, 3], 0.0, 1.0)
    # Translation invariance using hip center, scale from shoulder width or torso length.
    hip = (x[:, LEFT_HIP, :3] + x[:, RIGHT_HIP, :3]) / 2
    shoulders = (x[:, LEFT_SHOULDER, :3] + x[:, RIGHT_SHOULDER, :3]) / 2
    shoulder_width = np.linalg.norm(x[:, LEFT_SHOULDER, :2] - x[:, RIGHT_SHOULDER, :2], axis=-1)
    torso = np.linalg.norm((shoulders - hip)[:, :2], axis=-1)
    scale = np.maximum(np.maximum(shoulder_width, torso), 0.05)
    x[:, :, :3] = np.clip((x[:, :, :3] - hip[:, None, :]) / scale[:, None, None], -8, 8)
    # Missing/low confidence landmarks become zero instead of introducing spurious motion.
    x[:, :, :3] *= (x[:, :, 3:4] >= 0.35)
    return x


def resample(seq, length=32):
    """Linear interpolation along time to fixed length."""
    seq = np.asarray(seq, dtype=np.float32)
    if seq.ndim != 3 or seq.shape[1:] != (33, 4) or len(seq) < 2:
        raise ValueError('Expected >=2 frames, shape (T,33,4)')
    old = np.linspace(0, 1, len(seq))
    new = np.linspace(0, 1, length)
    out = np.stack([np.interp(new, old, seq[:, j, k]) for j in range(33) for k in range(4)], axis=1)
    return out.reshape(length, 33, 4).astype(np.float32)


class ActionNet(nn.Module):
    def __init__(self, n_classes):
        super().__init__()
        self.encoder = nn.Sequential(
            nn.Conv1d(132, 128, kernel_size=5, padding=2), nn.BatchNorm1d(128), nn.ReLU(),
            nn.Conv1d(128, 128, kernel_size=5, padding=2), nn.BatchNorm1d(128), nn.ReLU(),
            nn.MaxPool1d(2),
            nn.Conv1d(128, 256, kernel_size=3, padding=1), nn.BatchNorm1d(256), nn.ReLU(),
            nn.AdaptiveAvgPool1d(1), nn.Flatten(),
            nn.Dropout(0.25), nn.Linear(256, n_classes),
        )

    def forward(self, x):
        # x: (B,T,33,4) -> (B,132,T)
        return self.encoder(x.flatten(2).transpose(1, 2))


def load_data(path, seq_len):
    with np.load(path, allow_pickle=False) as data:
        if not {'X', 'y'}.issubset(data.files):
            raise ValueError('Dataset .npz must have X and y')
        X = data['X'].astype(np.float32)
        y = data['y'].astype(np.int64)
        groups = data['subjects'].astype(str) if 'subjects' in data.files else None
    if X.ndim != 4 or X.shape[2:] != (33, 4) or len(X) != len(y) or len(X) < 8:
        raise ValueError('Expected X (N,T,33,4), y (N,), N>=8')
    if len(np.unique(y)) < 2 or min(y) < 0:
        raise ValueError('At least 2 classes; integer labels >=0')
    if groups is not None and len(groups) != len(y):
        raise ValueError('subjects length must match X')
    return np.stack([normalize(resample(seq, seq_len)) for seq in X]), y, groups


def split_data(y, groups, seed):
    rng = np.random.default_rng(seed)
    if groups is not None:
        unique = np.unique(groups)
        if len(unique) < 3:
            raise ValueError('Need >=3 subjects for subject-disjoint split')
        rng.shuffle(unique)
        n_val = max(1, round(len(unique) * 0.2))
        val_mask = np.isin(groups, unique[:n_val])
        train_ids, val_ids = np.where(~val_mask)[0], np.where(val_mask)[0]
    else:
        print('WARNING: no subjects field; random window split risks data leakage. Record subject IDs.')
        ids = rng.permutation(len(y))
        cut = max(1, round(0.2 * len(y)))
        train_ids, val_ids = ids[cut:], ids[:cut]
    if len(np.unique(y[train_ids])) < len(np.unique(y)):
        raise ValueError('Some classes missing from training set; gather more subjects/clips')
    if not len(val_ids):
        raise ValueError('Empty validation set')
    return train_ids, val_ids


def split_train_val_test(y, groups, seed=42, val_fraction=0.2, test_fraction=0.2):
    """Disjoint subject split. Without IDs, warn that random clip split can leak."""
    if val_fraction <= 0 or test_fraction <= 0 or val_fraction + test_fraction >= 1:
        raise ValueError('val_fraction and test_fraction must be positive, sum < 1')
    rng = np.random.default_rng(seed)
    if groups is not None:
        unique = np.unique(groups)
        if len(unique) < 5:
            raise ValueError('Need >=5 different subjects for train/val/test disjoint split')
        units = unique
    else:
        print('WARNING: subject IDs missing: clip split may leak people/videos. Do not report benchmark results.')
        units = np.arange(len(y))
    n_val = max(1, round(len(units) * val_fraction))
    n_test = max(1, round(len(units) * test_fraction))
    if n_val + n_test >= len(units):
        raise ValueError('Not enough samples/subjects for three splits')
    all_classes = set(np.unique(y).tolist())
    for _ in range(200):
        perm = rng.permutation(units)
        val_units = perm[:n_val]
        test_units = perm[n_val:n_val + n_test]
        train_units = perm[n_val + n_test:]
        if groups is not None:
            a = np.where(np.isin(groups, train_units))[0]
            b = np.where(np.isin(groups, val_units))[0]
            c = np.where(np.isin(groups, test_units))[0]
        else:
            a, b, c = train_units, val_units, test_units
        if all_classes.issubset(set(y[a])) and len(b) and len(c):
            return a, b, c
    raise ValueError('Cannot place all classes in train with subject-disjoint splits. Collect more subjects per class.')


class TrainingDataset(Dataset):
    def __init__(self, x, y, augment=False):
        self.x, self.y, self.augment = x, y, augment

    def __len__(self):
        return len(self.y)

    def __getitem__(self, i):
        x = self.x[i].copy()
        if self.augment:
            # Noise only on reliable joints; visibility remains unmodified.
            valid = (x[:, :, 3:4] >= 0.35).astype(np.float32)
            x[:, :, :3] += np.random.normal(0, 0.012, x[:, :, :3].shape).astype(np.float32) * valid
            if np.random.random() < 0.20:
                x[:, :, :3] *= np.float32(np.random.uniform(0.95, 1.05))
        return torch.from_numpy(x), torch.tensor(int(self.y[i]), dtype=torch.long)


def evaluate(model, loader, labels, device):
    model.eval()
    truths, predictions, loss_total, count = [], [], 0.0, 0
    with torch.no_grad():
        for batch_x, batch_y in loader:
            logits = model(batch_x.to(device))
            loss_total += float(nn.functional.cross_entropy(logits, batch_y.to(device), reduction='sum').item())
            truths.extend(batch_y.tolist())
            predictions.extend(logits.argmax(dim=1).cpu().tolist())
            count += len(batch_y)
    report = classification_report(truths, predictions, labels)
    report['loss'] = round(loss_total / count, 5) if count else None
    return report


def train(args):
    if args.epochs < 1 or args.batch < 1 or args.frames < 2 or args.patience < 1:
        raise ValueError('epochs/batch/patience must >=1; frames >=2')
    torch.manual_seed(args.seed)
    np.random.seed(args.seed)
    random.seed(args.seed)
    X, y, subjects = load_data(args.data, args.frames)
    labels = json.loads(Path(args.labels).read_text(encoding='utf-8')) if args.labels else LABELS
    if not isinstance(labels, list) or len(set(labels)) != len(labels) or any(not isinstance(v, str) or not v for v in labels):
        raise ValueError('Labels must be distinct nonempty strings in a JSON array')
    if sorted(np.unique(y).tolist()) != list(range(len(labels))):
        raise ValueError('Dataset label IDs must match 0..number_of_classes-1')
    train_ids, val_ids, test_ids = split_train_val_test(y, subjects, args.seed, args.val_fraction, args.test_fraction)
    if args.device == 'cuda' and not torch.cuda.is_available():
        raise ValueError('CUDA requested but not available')
    device = torch.device('cuda' if args.device == 'auto' and torch.cuda.is_available() else ('cpu' if args.device == 'auto' else args.device))
    model = ActionNet(len(labels)).to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.lr, weight_decay=1e-3)
    counts = np.bincount(y[train_ids], minlength=len(labels))
    weights = len(train_ids) / (len(labels) * np.maximum(counts, 1))
    loss_fn = nn.CrossEntropyLoss(weight=torch.tensor(weights, dtype=torch.float32, device=device)) if args.class_weights else nn.CrossEntropyLoss()
    train_dl = DataLoader(TrainingDataset(X[train_ids], y[train_ids], augment=args.augment), batch_size=args.batch, shuffle=True)
    val_dl = DataLoader(TensorDataset(torch.from_numpy(X[val_ids]), torch.from_numpy(y[val_ids])), batch_size=args.batch)
    test_dl = DataLoader(TensorDataset(torch.from_numpy(X[test_ids]), torch.from_numpy(y[test_ids])), batch_size=args.batch)
    best, stale = -1.0, 0
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    report_dir = Path(args.report_dir)
    report_dir.mkdir(parents=True, exist_ok=True)
    history = []
    for epoch in range(1, args.epochs + 1):
        model.train()
        loss_sum, seen = 0.0, 0
        for bx, by in train_dl:
            bx, by = bx.to(device), by.to(device)
            optimizer.zero_grad()
            loss = loss_fn(model(bx), by)
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            loss_sum += float(loss.item()) * len(by)
            seen += len(by)
        val_report = evaluate(model, val_dl, labels, device)
        row = {'epoch': epoch, 'train_loss': round(loss_sum / seen, 5),
               'val_loss': val_report['loss'], 'val_accuracy': val_report['accuracy'],
               'val_macro_f1': val_report['macro_f1']}
        history.append(row)
        print('epoch={epoch:03d} train_loss={train_loss:.4f} val_acc={val_accuracy:.3f} val_macro_f1={val_macro_f1:.3f}'.format(**row))
        if val_report['macro_f1'] > best + 1e-8:
            best = val_report['macro_f1']
            stale = 0
            torch.save({'model_state': model.state_dict(), 'labels': labels,
                        'frames': args.frames, 'version': 2,
                        'feature_spec': '33 MediaPipe-order x,y,z,visibility; hip-centered'}, out)
        else:
            stale += 1
        if stale >= args.patience:
            print(f'Early stopping at epoch {epoch}.')
            break
    with (report_dir / 'history.csv').open('w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=list(history[0]))
        w.writeheader(); w.writerows(history)
    best_model, _ = load_model(out, device)
    report = {'validation': evaluate(best_model, val_dl, labels, device),
              'test': evaluate(best_model, test_dl, labels, device),
              'split': {'train': len(train_ids), 'validation': len(val_ids), 'test': len(test_ids),
                        'subject_disjoint': subjects is not None,
                        'train_subjects': int(len(np.unique(subjects[train_ids]))) if subjects is not None else None,
                        'validation_subjects': int(len(np.unique(subjects[val_ids]))) if subjects is not None else None,
                        'test_subjects': int(len(np.unique(subjects[test_ids]))) if subjects is not None else None},
              'note': 'Demo/synthetic measurements are NOT estimates of real-world performance.'}
    (report_dir / 'evaluation.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'Best model: {out}; evaluation: {report_dir / "evaluation.json"}; held-out test macro F1={report["test"]["macro_f1"]:.3f}')
    print('Measure real-world accuracy on unseen real people before deploying.')


def load_model(path, device='cpu'):
    # Only load checkpoints you created/trust; weights_only avoids arbitrary pickle objects.
    ckpt = torch.load(path, map_location=device, weights_only=True)
    model = ActionNet(len(ckpt['labels'])).to(device)
    model.load_state_dict(ckpt['model_state'])
    model.eval()
    return model, ckpt


def predict(args):
    if not 0 <= args.threshold <= 1:
        raise ValueError('threshold must be between 0 and 1')
    model, meta = load_model(args.model)
    raw = np.load(args.input, allow_pickle=False)
    seq = raw['landmarks'] if isinstance(raw, np.lib.npyio.NpzFile) else raw
    if isinstance(raw, np.lib.npyio.NpzFile):
        raw.close()
    if seq.ndim == 4 and len(seq) == 1:
        seq = seq[0]
    seq = normalize(resample(seq, meta['frames']))
    with torch.no_grad():
        probabilities = torch.softmax(model(torch.from_numpy(seq[None])), dim=1)[0].numpy()
    i = int(probabilities.argmax())
    result = {'action': meta['labels'][i] if float(probabilities[i]) >= args.threshold else 'unknown', 'confidence': round(float(probabilities[i]), 4),
              'probabilities': {k: round(float(v), 4) for k, v in zip(meta['labels'], probabilities)}}
    print(json.dumps(result, ensure_ascii=False, indent=2))


def demo(args):
    """Synthetic landmarks for pipeline smoke-testing only; not physiologically realistic."""
    rng = np.random.default_rng(args.seed)
    base = rng.uniform(0.35, 0.65, size=(33, 4)).astype('float32')
    base[:, 2] = 0
    base[:, 3] = 1
    base[[23, 24], :2] = [[0.47, 0.52], [0.53, 0.52]]
    base[[11, 12], :2] = [[0.45, 0.32], [0.55, 0.32]]
    X, y, subjects = [], [], []
    for subject in range(args.subjects):
        for cls in range(len(LABELS)):
            for take in range(args.takes):
                seq = np.repeat(base[None], args.frames, axis=0)
                phase = np.linspace(0, 2 * np.pi, args.frames) + rng.uniform(-0.25, 0.25)
                pulse = (1 - np.cos(phase)) * 0.5
                if cls == 0:
                    seq[:, [23, 24, 25, 26], 1] += pulse[:, None] * .20
                elif cls == 1:
                    seq[:, [11, 12, 13, 14], 1] += pulse[:, None] * .16
                elif cls == 2:
                    seq[:, [25, 27], 0] += pulse[:, None] * .20
                else:
                    seq[:, :, 1] += np.sin(phase)[:, None] * .003
                seq[:, :, :3] += rng.normal(0, 0.003, seq[:, :, :3].shape)
                seq[:, :, :2] += rng.normal(0, 0.01, (1, 1, 2))
                X.append(seq)
                y.append(cls)
                subjects.append(str(subject))
    Path(args.out).parent.mkdir(parents=True, exist_ok=True)
    np.savez_compressed(args.out, X=np.stack(X), y=np.array(y), subjects=np.array(subjects))
    print(f'Created SYNTHETIC demo dataset: {args.out}; samples={len(y)}; subjects={args.subjects}')


def angle(a, b, c):
    a, b, c = np.asarray(a)[:2], np.asarray(b)[:2], np.asarray(c)[:2]
    v1, v2 = a - b, c - b
    norm = np.linalg.norm(v1) * np.linalg.norm(v2)
    return None if norm < 1e-8 else float(np.degrees(np.arccos(np.clip(v1 @ v2 / norm, -1, 1))))


class SquatCounter:
    """Example 2D knee-angle state machine; tune thresholds from real camera setup."""
    def __init__(self, down=100, up=160):
        if down >= up:
            raise ValueError('down must be less than up')
        self.down, self.up, self.state, self.reps = down, up, 'up', 0

    def reset_phase(self):
        self.state = 'up'

    def update(self, landmarks):
        p = np.asarray(landmarks)
        if p.shape != (33, 4):
            raise ValueError('One frame must be (33,4)')
        if min(p[[23, 25, 27, 24, 26, 28], 3]) < .5:
            return {'reps': self.reps, 'state': self.state, 'angle': None, 'status': 'low_visibility'}
        angles = [angle(p[h], p[k], p[a]) for h, k, a in [(23, 25, 27), (24, 26, 28)]]
        if None in angles:
            return {'reps': self.reps, 'state': self.state, 'angle': None, 'status': 'invalid_geometry'}
        knee = float(np.mean(angles))
        if self.state == 'up' and knee <= self.down:
            self.state = 'down'
        elif self.state == 'down' and knee >= self.up:
            self.state = 'up'
            self.reps += 1
        return {'reps': self.reps, 'state': self.state, 'angle': round(knee, 1), 'status': 'ok'}


# =====================================================================
# VISIONFIT AI BIOMECHANICAL SQUAT ANALYZER
# =====================================================================

FULL_SKELETON_CONNECTIONS = [
    # Head & Face
    (0, 1), (1, 2), (2, 3), (3, 7),
    (0, 4), (4, 5), (5, 6), (6, 8),
    (9, 10),
    # Torso & Shoulders
    (11, 12), (11, 23), (12, 24), (23, 24),
    # Arms
    (11, 13), (13, 15), (15, 17), (15, 19), (15, 21), (17, 19),
    (12, 14), (14, 16), (16, 18), (16, 20), (16, 22), (18, 20),
    # Legs & Feet
    (23, 25), (25, 27), (27, 29), (29, 31), (27, 31),
    (24, 26), (26, 28), (28, 30), (30, 32), (28, 32),
]


class BiomechanicalSquatAnalyzer:
    """Squat form analyzer and rep counter implementing VisionFit AI Biomechanical standards:
    - Supports BOTH Front View (chính diện: tracks hip descent dynamics & knee valgus)
      and Side View (nghiêng/ngang: tracks knee flexion 65°-90° & torso lean 20°-35°).
    - Automatically classifies GOOD_FORM vs BAD_FORM and outputs detailed corrective feedback.
    """
    def __init__(self, knee_bottom_max=95.0, torso_lean_max=45.0):
        self.knee_bottom_max = knee_bottom_max
        self.torso_lean_max = torso_lean_max
        self.state = "STANDING"
        self.completed_reps = 0
        self.reps_data = []
        self.current_rep = self._new_rep(0.0)
        self.standing_hip_y = None
        self.standing_leg_len = None
        self.baseline_samples = []
        self.view_mode = None
        self.active_side = None
        self.side_switch_counter = 0
        self.prev_landmarks = None
        self.min_vis_threshold = 0.40
        self.max_jump_displacement = 60.0

    def _new_rep(self, sec):
        return {
            "rep_number": 0,
            "start_time": round(sec, 2),
            "bottom_time": 0.0,
            "end_time": 0.0,
            "min_knee_angle": 180.0,
            "max_torso_lean_vert": 0.0,
            "torso_angle_horiz": 90.0,
            "bottom_hip_angle": 180.0,
            "max_descent": 0.0,
            "min_valgus_ratio": 1.0,
            "low_conf_frames": 0,
            "total_frames": 0,
            "status": "GOOD_FORM",
            "feedback": "",
            "correction_tip": "",
            "view_mode": "side",
        }

    @staticmethod
    def calc_angle_3pts(a, b, c):
        ba = np.asarray(a) - np.asarray(b)
        bc = np.asarray(c) - np.asarray(b)
        norm = np.linalg.norm(ba) * np.linalg.norm(bc)
        if norm < 1e-6:
            return None
        cos_ang = np.clip(np.dot(ba, bc) / norm, -1.0, 1.0)
        return float(np.degrees(np.arccos(cos_ang)))

    @staticmethod
    def calc_torso_lean(hip, shoulder):
        dx = shoulder[0] - hip[0]
        dy = shoulder[1] - hip[1]
        angle_vert = float(np.degrees(np.arctan2(abs(dx), max(1e-6, -dy))))
        angle_horiz = float(np.degrees(np.arctan2(max(1e-6, -dy), abs(dx) + 1e-6)))
        return angle_vert, angle_horiz

    def process_frame(self, pts_2d, sec=0.0):
        """Processes 2D/3D landmarks of 1 frame and updates squat state machine.
        pts_2d: (33, 2) or (33, 3) or (33, 4) array.
        """
        w_span = max(1.0, float(np.max(pts_2d[:, 0]) - np.min(pts_2d[:, 0])))
        sh_w = abs(float(pts_2d[11, 0] - pts_2d[12, 0]))
        hp_w = abs(float(pts_2d[23, 0] - pts_2d[24, 0]))
        is_front_view = (sh_w > 0.10 * w_span) and (hp_w > 0.045 * w_span)

        # Baseline calibration from standing frames
        hip_y = float(pts_2d[23, 1] + pts_2d[24, 1]) / 2.0
        ank_y = float(pts_2d[27, 1] + pts_2d[28, 1]) / 2.0
        leg_len = max(10.0, ank_y - hip_y)

        if len(self.baseline_samples) < 20:
            self.baseline_samples.append((hip_y, leg_len, is_front_view))
            self.standing_hip_y = float(np.median([s[0] for s in self.baseline_samples]))
            self.standing_leg_len = float(np.median([s[1] for s in self.baseline_samples]))

        if self.view_mode is None and len(self.baseline_samples) >= 10:
            front_votes = sum(1 for s in self.baseline_samples if s[2])
            self.view_mode = "front" if front_votes >= 5 else "side"

        base_h = self.standing_hip_y if self.standing_hip_y else hip_y
        base_l = self.standing_leg_len if self.standing_leg_len else leg_len
        descent = (hip_y - base_h) / max(1.0, base_l)

        knee_w = abs(float(pts_2d[25, 0] - pts_2d[26, 0]))
        ank_w = abs(float(pts_2d[27, 0] - pts_2d[28, 0]))
        valgus_ratio = knee_w / max(1.0, ank_w)

        # Determine more visible side (right vs left) with temporal locking (hysteresis)
        r_vis = float(pts_2d[12, 3] + pts_2d[24, 3] + pts_2d[26, 3]) if pts_2d.shape[-1] >= 4 else 1.0
        l_vis = float(pts_2d[11, 3] + pts_2d[23, 3] + pts_2d[25, 3]) if pts_2d.shape[-1] >= 4 else 1.0
        favored_side = "right" if r_vis >= l_vis else "left"

        if self.active_side is None:
            self.active_side = favored_side
            self.side_switch_counter = 0
        elif favored_side != self.active_side:
            self.side_switch_counter += 1
            if self.side_switch_counter >= 15:
                self.active_side = favored_side
                self.side_switch_counter = 0
        else:
            self.side_switch_counter = 0

        s_idx, h_idx, k_idx, a_idx = (12, 24, 26, 28) if self.active_side == "right" else (11, 23, 25, 27)

        sh = pts_2d[s_idx, :2]
        hip = pts_2d[h_idx, :2]
        knee = pts_2d[k_idx, :2]
        ank = pts_2d[a_idx, :2]

        knee_ang = self.calc_angle_3pts(hip, knee, ank)
        hip_ang = self.calc_angle_3pts(sh, hip, knee)
        torso_vert, torso_horiz = self.calc_torso_lean(hip, sh)

        effective_front = (self.view_mode == "front") if self.view_mode else is_front_view
        feedback_event = None

        # Robust Landmark Quality Gate: Visibility, Geometry, and Temporal Jump
        quality_status = "OK"
        quality_reason = None

        # 1. Keypoint Visibility Check
        k_vis = float(pts_2d[k_idx, 3]) if pts_2d.shape[-1] >= 4 else 1.0
        h_vis = float(pts_2d[h_idx, 3]) if pts_2d.shape[-1] >= 4 else 1.0
        a_vis = float(pts_2d[a_idx, 3]) if pts_2d.shape[-1] >= 4 else 1.0
        if min(k_vis, h_vis, a_vis) < self.min_vis_threshold:
            quality_status = "LOW_CONFIDENCE"
            quality_reason = "Khớp quan trọng bị che khuất (Low Visibility)"

        # 2. Anatomical Geometry Plausibility (Segment lengths & ratios)
        l_femur = float(np.linalg.norm(hip - knee))
        l_tibia = float(np.linalg.norm(knee - ank))
        l_torso = float(np.linalg.norm(sh - hip))
        if l_femur < 8.0 or l_tibia < 8.0 or l_torso < 10.0:
            quality_status = "LOW_CONFIDENCE"
            quality_reason = "Khung xương bị suy biến kích thước (Collapsed Bone)"
        elif (l_femur / max(1.0, l_tibia) < 0.35) or (l_femur / max(1.0, l_tibia) > 2.8):
            quality_status = "LOW_CONFIDENCE"
            quality_reason = "Tỷ lệ giải phẫu bất thường (Abnormal Segment Ratio)"

        # 3. Temporal Motion Continuity & Jump Filter
        if self.prev_landmarks is not None:
            prev_k = self.prev_landmarks[k_idx, :2]
            prev_a = self.prev_landmarks[a_idx, :2]
            disp_k = float(np.linalg.norm(knee - prev_k))
            disp_a = float(np.linalg.norm(ank - prev_a))
            if max(disp_k, disp_a) > self.max_jump_displacement:
                quality_status = "LOW_CONFIDENCE"
                quality_reason = "Khớp bị nhảy vị trí đột ngột (Temporal Jump)"
                knee = 0.6 * prev_k + 0.4 * knee
                ank = 0.6 * prev_a + 0.4 * ank

        self.prev_landmarks = pts_2d.copy()

        # 4. Angle Degeneracy Check
        if knee_ang is None or hip_ang is None:
            quality_status = "LOW_CONFIDENCE"
            quality_reason = "Không tính được góc vector (Degenerate Vectors)"

        # If quality failed, track degraded frame and protect state machine
        if quality_status == "LOW_CONFIDENCE":
            if self.state != "STANDING":
                self.current_rep["low_conf_frames"] += 1
            return {
                "knee_angle": self.current_rep.get("min_knee_angle", 180.0),
                "torso_lean": 0.0,
                "state": self.state,
                "status": "LOW_CONFIDENCE",
                "reason": quality_reason,
                "completed_reps": self.completed_reps,
                "feedback_event": None,
                "active_side": self.active_side,
                "is_front_view": effective_front,
            }

        if self.state != "STANDING":
            self.current_rep["total_frames"] += 1

        if effective_front:
            # Front View State Machine based on Hip Descent and Valgus Ratio
            if self.state == "STANDING":
                if descent > 0.18:
                    self.state = "DESCENDING"
                    self.current_rep["start_time"] = round(sec, 2)
                    self.current_rep["max_descent"] = max(0.0, descent)
                    self.current_rep["min_valgus_ratio"] = valgus_ratio
                    self.current_rep["min_knee_angle"] = knee_ang
                    self.current_rep["view_mode"] = "front"
            elif self.state == "DESCENDING":
                if descent > self.current_rep["max_descent"]:
                    self.current_rep["max_descent"] = descent
                if valgus_ratio < self.current_rep["min_valgus_ratio"]:
                    self.current_rep["min_valgus_ratio"] = valgus_ratio
                if knee_ang < self.current_rep["min_knee_angle"]:
                    self.current_rep["min_knee_angle"] = knee_ang
                if descent > 0.38 or (descent > 0.28 and descent < self.current_rep["max_descent"] - 0.05):
                    self.state = "BOTTOM"
                    self.current_rep["bottom_time"] = round(sec, 2)
            elif self.state == "BOTTOM":
                if descent > self.current_rep["max_descent"]:
                    self.current_rep["max_descent"] = descent
                if valgus_ratio < self.current_rep["min_valgus_ratio"]:
                    self.current_rep["min_valgus_ratio"] = valgus_ratio
                if knee_ang < self.current_rep["min_knee_angle"]:
                    self.current_rep["min_knee_angle"] = knee_ang
                if descent < self.current_rep["max_descent"] - 0.12:
                    self.state = "ASCENDING"
            elif self.state == "ASCENDING":
                if descent < 0.14:
                    self.completed_reps += 1
                    self.current_rep["end_time"] = round(sec, 2)
                    self.current_rep["rep_number"] = self.completed_reps
                    max_d = self.current_rep["max_descent"]
                    min_v = self.current_rep["min_valgus_ratio"]
                    min_k = self.current_rep["min_knee_angle"]

                    is_good = True
                    reasons = []
                    tips = []
                    if min_v < 0.88:
                        is_good = False
                        reasons.append(f"Lỗi chụm đầu gối (Knee Valgus: {min_v*100:.0f}% < 88%)")
                        tips.append("Mở rộng khớp gối hướng theo mũi chân khi hạ người, siết cơ mông nhỡ và cơ đùi ngoài.")
                    if max_d < 0.30 and min_k > 115.0:
                        is_good = False
                        reasons.append(f"Lỗi chưa đủ độ sâu (Hạ hông mới đạt {max_d*100:.0f}% độ dài chân)")
                        tips.append("Hạ hông sâu hơn sao cho đùi song song với mặt sàn.")
                    if self.current_rep.get("low_conf_frames", 0) > 15:
                        is_good = False
                        reasons.append("Chất lượng theo dõi kém / Mất dấu khớp trong rep (Tracking degraded)")
                        tips.append("Điều chỉnh camera góc rộng hơn và đảm bảo ánh sáng thấy rõ toàn bộ cơ thể.")

                    if is_good:
                        self.current_rep["status"] = "GOOD_FORM"
                        self.current_rep["feedback"] = f"Form chuẩn (Độ sâu {max_d*100:.0f}%, Trục gối chuẩn)"
                        feedback_event = {
                            "text": f"REP {self.completed_reps}: FORM CHUAN",
                            "color": (0, 255, 0),
                            "status": "GOOD_FORM",
                        }
                    else:
                        self.current_rep["status"] = "BAD_FORM"
                        self.current_rep["feedback"] = "; ".join(reasons)
                        self.current_rep["correction_tip"] = " | ".join(tips)
                        feedback_event = {
                            "text": f"REP {self.completed_reps}: " + reasons[0],
                            "color": (0, 0, 255),
                            "status": "BAD_FORM",
                        }

                    self.reps_data.append(dict(self.current_rep))
                    self.current_rep = self._new_rep(sec)
                    self.state = "STANDING"
        else:
            # Side View State Machine based on Knee Flexion Angle
            if self.state == "STANDING":
                if knee_ang < 140.0:
                    self.state = "DESCENDING"
                    self.current_rep["start_time"] = round(sec, 2)
                    self.current_rep["min_knee_angle"] = knee_ang
                    self.current_rep["max_torso_lean_vert"] = torso_vert
                    self.current_rep["torso_angle_horiz"] = torso_horiz
                    self.current_rep["view_mode"] = "side"
            elif self.state == "DESCENDING":
                if knee_ang < self.current_rep["min_knee_angle"]:
                    self.current_rep["min_knee_angle"] = knee_ang
                    self.current_rep["bottom_time"] = round(sec, 2)
                    self.current_rep["bottom_hip_angle"] = hip_ang
                    self.current_rep["torso_angle_horiz"] = torso_horiz
                if torso_vert > self.current_rep["max_torso_lean_vert"]:
                    self.current_rep["max_torso_lean_vert"] = torso_vert
                if knee_ang <= 95.0 or (knee_ang < 110.0 and (knee_ang - self.current_rep["min_knee_angle"] > 10.0)):
                    self.state = "BOTTOM"
            elif self.state == "BOTTOM":
                if knee_ang < self.current_rep["min_knee_angle"]:
                    self.current_rep["min_knee_angle"] = knee_ang
                    self.current_rep["bottom_time"] = round(sec, 2)
                    self.current_rep["bottom_hip_angle"] = hip_ang
                    self.current_rep["torso_angle_horiz"] = torso_horiz
                if torso_vert > self.current_rep["max_torso_lean_vert"]:
                    self.current_rep["max_torso_lean_vert"] = torso_vert
                if knee_ang > self.current_rep["min_knee_angle"] + 15.0:
                    self.state = "ASCENDING"
            elif self.state == "ASCENDING":
                if torso_vert > self.current_rep["max_torso_lean_vert"]:
                    self.current_rep["max_torso_lean_vert"] = torso_vert
                if knee_ang > 155.0:
                    self.completed_reps += 1
                    self.current_rep["end_time"] = round(sec, 2)
                    self.current_rep["rep_number"] = self.completed_reps

                    min_k = self.current_rep["min_knee_angle"]
                    max_t = self.current_rep["max_torso_lean_vert"]

                    is_good = True
                    reasons = []
                    tips = []

                    if min_k > self.knee_bottom_max:
                        is_good = False
                        reasons.append(f"Lỗi chưa đủ độ sâu ({min_k:.1f}° > 95°)")
                        tips.append("Hạ người sâu hơn để đạt góc gối 65°-90°.")
                    if max_t > self.torso_lean_max:
                        is_good = False
                        reasons.append(f"Lỗi gập lưng quá mức ({max_t:.1f}° > 45°)")
                        tips.append("Giữ ngực mở, siết cơ lõi bụng để lưng nghiêng trong khoảng 20°-35°.")
                    if self.current_rep.get("low_conf_frames", 0) > 15:
                        is_good = False
                        reasons.append("Chất lượng theo dõi kém / Mất dấu khớp trong rep (Tracking degraded)")
                        tips.append("Điều chỉnh camera góc rộng hơn và đảm bảo ánh sáng thấy rõ toàn bộ cơ thể.")

                    if is_good:
                        self.current_rep["status"] = "GOOD_FORM"
                        self.current_rep["feedback"] = f"Form chuẩn (Gối {min_k:.1f}°, Thân {max_t:.1f}°)"
                        feedback_event = {
                            "text": f"REP {self.completed_reps}: FORM CHUAN",
                            "color": (0, 255, 0),
                            "status": "GOOD_FORM",
                        }
                    else:
                        self.current_rep["status"] = "BAD_FORM"
                        self.current_rep["feedback"] = "; ".join(reasons)
                        self.current_rep["correction_tip"] = " | ".join(tips)
                        feedback_event = {
                            "text": f"REP {self.completed_reps}: " + reasons[0],
                            "color": (0, 0, 255),
                            "status": "BAD_FORM",
                        }

                    self.reps_data.append(dict(self.current_rep))
                    self.current_rep = self._new_rep(sec)
                    self.state = "STANDING"

        return {
            "state": self.state,
            "knee_angle": round(knee_ang, 1),
            "torso_lean": round(torso_vert, 1),
            "completed_reps": self.completed_reps,
            "feedback_event": feedback_event,
            "active_side": "right" if r_vis >= l_vis else "left",
            "valgus_ratio": round(valgus_ratio, 2),
            "descent": round(descent, 2),
            "is_front_view": effective_front,
        }

    def finalize(self, sec=0.0):
        """Flushes any rep in progress when the video ended prematurely."""
        if self.state in ["ASCENDING", "BOTTOM"]:
            start_t = self.current_rep.get("start_time")
            if start_t is not None and (sec - start_t >= 0.8):
                self.completed_reps += 1
                self.current_rep["end_time"] = round(sec, 2)
                self.current_rep["rep_number"] = self.completed_reps
                min_k = self.current_rep.get("min_knee_angle", 180.0)
                max_t = self.current_rep.get("max_torso_lean_vert", 0.0)
                max_d = self.current_rep.get("max_descent", 0.0)
                min_v = self.current_rep.get("min_valgus_ratio", 1.0)

                reasons = []
                tips = []
                if self.current_rep.get("view_mode") == "front":
                    if min_v < 0.88:
                        reasons.append(f"Lỗi chụm đầu gối (Knee Valgus: {min_v*100:.0f}% < 88%)")
                        tips.append("Mở rộng khớp gối hướng theo mũi chân khi hạ người.")
                    if max_d < 0.30:
                        reasons.append(f"Lỗi chưa đủ độ sâu (Hạ hông mới đạt {max_d*100:.0f}%)")
                        tips.append("Hạ hông sâu hơn sao cho đùi song song với mặt sàn.")
                    reasons.append("Chưa đứng thẳng hết biên độ / Video kết thúc sớm")
                    tips.append("Đứng thẳng hoàn toàn để hoàn thành rep trọn vẹn.")
                else:
                    if min_k > self.knee_bottom_max:
                        reasons.append(f"Lỗi chưa đủ độ sâu ({min_k:.1f}° > 95°)")
                        tips.append("Hạ người sâu hơn để đạt góc gối 65°-90°.")
                    if max_t > self.torso_lean_max:
                        reasons.append(f"Lỗi gập lưng quá mức ({max_t:.1f}° > 45°)")
                        tips.append("Giữ ngực mở, siết cơ lõi bụng để lưng nghiêng 20°-35°.")
                    reasons.append(f"Chưa đứng thẳng hết biên độ / Video kết thúc sớm (Gối đang ở {min_k:.1f}°)")
                    tips.append("Đứng thẳng hết biên độ (góc gối > 155°) trước khi kết thúc bài tập.")

                self.current_rep["status"] = "BAD_FORM"
                self.current_rep["feedback"] = "; ".join(reasons)
                self.current_rep["correction_tip"] = " | ".join(tips)
                self.reps_data.append(dict(self.current_rep))
                self.state = "STANDING"


def analyze_squat_video(video_path, out_video_path=None, report_path=None, engine="posenet", model_asset_path=None):
    """Analyzes a squat video using VisionFit AI.
    engine: "posenet" (100% self-trained PyTorch BodyPoseNet) or "mediapipe" (baseline)
    Renders full 33-landmark skeleton HUD if out_video_path is specified.
    Returns complete report dict.
    """
    import cv2
    import numpy as np

    video_path = Path(video_path)
    if not video_path.is_file():
        # Check standard locations: videos/squat/dung, videos/squat/sai, videos/squat, videos
        base_dir = ROOT_DIR
        for cand in [
            base_dir / "videos" / "squat" / "dung" / video_path.name,
            base_dir / "videos" / "squat" / "sai" / video_path.name,
            base_dir / "videos" / "squat" / video_path.name,
            base_dir / "videos" / video_path.name,
            base_dir / video_path,
        ]:
            if cand.is_file():
                video_path = cand
                break
    if not video_path.is_file():
        raise FileNotFoundError(f"Video file not found: {video_path}")

    if out_video_path is None:
        out_video_path = ROOT_DIR / "reports" / "squat" / f"{video_path.stem}_annotated.mp4"
    if report_path is None:
        report_path = ROOT_DIR / "reports" / "squat" / f"{video_path.stem}_report.json"

    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise IOError(f"Cannot open video: {video_path}")

    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    writer = None
    if out_video_path:
        out_video_path = Path(out_video_path)
        out_video_path.parent.mkdir(parents=True, exist_ok=True)
        # Prefer avc1 (H.264) for native HTML5 browser playback, fallback to mp4v
        fourcc = cv2.VideoWriter_fourcc(*"avc1")
        writer = cv2.VideoWriter(str(out_video_path), fourcc, fps, (w, h))
        if not writer.isOpened():
            fourcc = cv2.VideoWriter_fourcc(*"mp4v")
            writer = cv2.VideoWriter(str(out_video_path), fourcc, fps, (w, h))

    analyzer = BiomechanicalSquatAnalyzer()
    feedback_display = {"text": "", "color": (0, 255, 0), "timer": 0}

    # Setup inference engine
    posenet_model = None
    mp_detector = None

    if engine == "posenet":
        from core.pose_model import load_pose_model, infer_rgb, IMAGE_SIZE
        custom_model_path = ROOT_DIR / "models" / "pose_custom.pt"
        if not custom_model_path.is_file():
            raise FileNotFoundError(f"PoseNet model not found: {custom_model_path}")
        posenet_model = load_pose_model(str(custom_model_path), device="cpu")
    else:
        import mediapipe as mp
        if model_asset_path is None:
            model_asset_path = ROOT_DIR / "models" / "mediapipe" / "pose_landmarker_full.task"
        if not Path(model_asset_path).is_file():
            raise FileNotFoundError(f"MediaPipe task file not found: {model_asset_path}")
        options = mp.tasks.vision.PoseLandmarkerOptions(
            base_options=mp.tasks.BaseOptions(model_asset_path=str(model_asset_path)),
            running_mode=mp.tasks.vision.RunningMode.VIDEO,
            num_poses=1,
        )
        mp_detector = mp.tasks.vision.PoseLandmarker.create_from_options(options)

    frame_idx = 0
    try:
        while True:
            ok, frame = cap.read()
            if not ok:
                break

            sec = frame_idx / fps
            ts = int(round(frame_idx * 1000.0 / fps))
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

            current_knee = 180.0
            current_torso = 0.0
            step_res = {}
            pts = None

            if engine == "posenet":
                from core.pose_model import infer_rgb, IMAGE_SIZE
                scale = min(IMAGE_SIZE / h, IMAGE_SIZE / w)
                nh, nw = max(1, int(h * scale)), max(1, int(w * scale))
                resized = cv2.resize(rgb, (nw, nh), interpolation=cv2.INTER_AREA)
                canvas = np.zeros((IMAGE_SIZE, IMAGE_SIZE, 3), dtype=np.uint8)
                top = (IMAGE_SIZE - nh) // 2
                left = (IMAGE_SIZE - nw) // 2
                canvas[top:top+nh, left:left+nw] = resized

                raw_pts = infer_rgb(posenet_model, canvas, device="cpu")  # (33, 4) in [0, 1] relative to canvas
                pts = np.zeros((33, 4), dtype=np.float32)
                for i in range(33):
                    lx = (raw_pts[i, 0] * IMAGE_SIZE - left) / nw
                    ly = (raw_pts[i, 1] * IMAGE_SIZE - top) / nh
                    pts[i] = [lx * w, ly * h, raw_pts[i, 2], raw_pts[i, 3]]
            else:
                import mediapipe as mp
                mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
                res = mp_detector.detect_for_video(mp_img, ts)
                if res.pose_landmarks and len(res.pose_landmarks) > 0:
                    lm = res.pose_landmarks[0]
                    pts = np.zeros((33, 4), dtype=np.float32)
                    for i in range(33):
                        p = lm[i]
                        vis = float(p.visibility) if p.visibility is not None else 1.0
                        pts[i] = [p.x * w, p.y * h, p.z * w if hasattr(p, 'z') and p.z is not None else 0.0, vis]

            if pts is not None:
                step_res = analyzer.process_frame(pts, sec=sec)
                current_knee = step_res["knee_angle"]
                current_torso = step_res["torso_lean"]

                if step_res["feedback_event"]:
                    feedback_display = {
                        "text": step_res["feedback_event"]["text"],
                        "color": step_res["feedback_event"]["color"],
                        "timer": int(fps * 2.0),
                    }

                if writer:
                    # Draw Full 33-Landmark Skeleton
                    def to_px(idx):
                        return int(round(pts[idx, 0])), int(round(pts[idx, 1]))

                    # Draw connections
                    for a, b in FULL_SKELETON_CONNECTIONS:
                        if pts[a, 3] >= 0.4 and pts[b, 3] >= 0.4:
                            cv2.line(frame, to_px(a), to_px(b), (0, 220, 255), 2, cv2.LINE_AA)

                    # Highlight active squat side (Vai -> Hong -> Goi -> Co chan)
                    side_color = (0, 255, 0) if current_knee <= 95.0 else (0, 165, 255)
                    s_idx = 12 if step_res["active_side"] == "right" else 11
                    h_idx = 24 if step_res["active_side"] == "right" else 23
                    k_idx = 26 if step_res["active_side"] == "right" else 25
                    a_idx = 28 if step_res["active_side"] == "right" else 27

                    cv2.line(frame, to_px(s_idx), to_px(h_idx), (0, 255, 255), 4, cv2.LINE_AA)
                    cv2.line(frame, to_px(h_idx), to_px(k_idx), side_color, 5, cv2.LINE_AA)
                    cv2.line(frame, to_px(k_idx), to_px(a_idx), side_color, 5, cv2.LINE_AA)

                    # Draw keypoint dots
                    for j in range(33):
                        if pts[j, 3] >= 0.4:
                            radius = 5 if j in [s_idx, h_idx, k_idx, a_idx] else 3
                            dot_color = (0, 0, 255) if j in [s_idx, h_idx, k_idx, a_idx] else (0, 255, 0)
                            cv2.circle(frame, to_px(j), radius, dot_color, -1, cv2.LINE_AA)
                            cv2.circle(frame, to_px(j), radius + 2, (255, 255, 255), 1, cv2.LINE_AA)

            if writer:
                # Top HUD Banner
                cv2.rectangle(frame, (20, 20), (min(w - 20, 520), 160), (15, 15, 15), -1)
                cv2.rectangle(frame, (20, 20), (min(w - 20, 520), 160), (0, 200, 255), 2)
                engine_label = "100% POSENET (SELF-TRAINED)" if engine == "posenet" else "MEDIAPIPE BASELINE"
                cv2.putText(frame, f"VISIONFIT AI - {engine_label}", (35, 48), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 200, 255), 2, cv2.LINE_AA)

                # State & Reps
                state_color = (0, 255, 0) if analyzer.state == "BOTTOM" else (0, 200, 255)
                cv2.putText(frame, f"REPS: {analyzer.completed_reps}", (35, 88), cv2.FONT_HERSHEY_SIMPLEX, 1.1, (255, 255, 255), 3, cv2.LINE_AA)
                cv2.putText(frame, f"PHA: {analyzer.state}", (230, 85), cv2.FONT_HERSHEY_SIMPLEX, 0.7, state_color, 2, cv2.LINE_AA)

                # Angle readouts / Biomechanical metrics
                if step_res.get("is_front_view"):
                    valgus_pct = int(round(step_res.get("valgus_ratio", 1.0) * 100))
                    v_col = (0, 0, 255) if valgus_pct < 85 else (0, 255, 0)
                    descent_pct = int(round(step_res.get("descent", 0.0) * 100))
                    cv2.putText(frame, f"Truc goi: {valgus_pct}% (chuan: >=85%)", (35, 118), cv2.FONT_HERSHEY_SIMPLEX, 0.55, v_col, 2, cv2.LINE_AA)
                    cv2.putText(frame, f"Do ha hong: {descent_pct}% (chuan: >=35%)", (35, 145), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 200, 255), 2, cv2.LINE_AA)
                    if valgus_pct < 85 and analyzer.state in ["DESCENDING", "BOTTOM"]:
                        cv2.putText(frame, "CANH BAO: CHUM DAU GOI (KNEE VALGUS)!", (35, 175), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2, cv2.LINE_AA)
                else:
                    k_col = (0, 255, 0) if (65.0 <= current_knee <= 95.0) else ((0, 165, 255) if current_knee > 95.0 else (0, 255, 255))
                    t_col = (0, 0, 255) if current_torso > 45.0 else (0, 255, 0)
                    cv2.putText(frame, f"Goc goi: {current_knee:.1f}° (chuan: 65°-90°)", (35, 118), cv2.FONT_HERSHEY_SIMPLEX, 0.55, k_col, 2, cv2.LINE_AA)
                    cv2.putText(frame, f"Goc than: {current_torso:.1f}° (chuan: 20°-35°)", (35, 145), cv2.FONT_HERSHEY_SIMPLEX, 0.55, t_col, 2, cv2.LINE_AA)

                # Completed feedback banner
                if feedback_display["timer"] > 0:
                    banner_top = max(180, h - 140)
                    cv2.rectangle(frame, (30, banner_top), (w - 30, banner_top + 60), (10, 10, 10), -1)
                    cv2.rectangle(frame, (30, banner_top), (w - 30, banner_top + 60), feedback_display["color"], 3)
                    cv2.putText(frame, feedback_display["text"], (45, banner_top + 40), cv2.FONT_HERSHEY_SIMPLEX, 0.68, feedback_display["color"], 2, cv2.LINE_AA)
                    feedback_display["timer"] -= 1

                writer.write(frame)
            frame_idx += 1

    finally:
        cap.release()
        if hasattr(analyzer, 'finalize'):
            analyzer.finalize(sec=frame_idx / fps)
        if mp_detector is not None:
            try:
                mp_detector.close()
            except Exception:
                pass
        if writer:
            writer.release()

    report = {
        "video": video_path.name,
        "ai_engine": "VisionFit PoseNet (100% Local Self-Trained PyTorch)" if engine == "posenet" else "MediaPipe Pose Landmarker (Baseline)",
        "engine_type": engine,
        "total_reps_counted": analyzer.completed_reps,
        "good_reps_count": sum(1 for r in analyzer.reps_data if r["status"] == "GOOD_FORM"),
        "bad_reps_count": sum(1 for r in analyzer.reps_data if r["status"] == "BAD_FORM"),
        "reps_detail": analyzer.reps_data,
        "thresholds_applied": {
            "knee_angle_bottom_ideal": "65°-90°",
            "knee_angle_bottom_max_acceptable": "95°",
            "torso_lean_bottom_ideal": "20°-35°",
            "torso_lean_bottom_max_acceptable": "45°",
            "valgus_ratio_min_acceptable": "88%",
        },
    }

    if report_path:
        report_path = Path(report_path)
        report_path.parent.mkdir(parents=True, exist_ok=True)
        report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    return report


def squat_cli(args):
    video_path = Path(args.video)
    if not video_path.is_file():
        cand = ROOT_DIR / "videos" / "squat" / video_path.name
        if cand.is_file():
            video_path = cand
    out_video = args.out or f"reports/squat/{video_path.stem}_annotated.mp4"
    report_file = args.report or f"reports/squat/{video_path.stem}_report.json"
    print(f"[VisionFit Core] Analyzing Squat video: {video_path}")
    print(f"Applying VisionFit AI Biomechanical Standards...")
    report = analyze_squat_video(video_path, out_video_path=out_video, report_path=report_file)
    print("\n" + "=" * 55)
    print(f"  ANALYSIS SUMMARY: {video_path.name}")
    print("=" * 55)
    print(f"Total Reps Counted : {report['total_reps_counted']}")
    print(f"Good Reps          : {report['good_reps_count']}")
    print(f"Bad Reps           : {report['bad_reps_count']}")
    for r in report["reps_detail"]:
        print(f"  Rep {r['rep_number']:02d} ({r['start_time']}s - {r['end_time']}s): [{r['status']}] {r['feedback']}")
    print("=" * 55)
    print(f"Saved annotated video: {out_video}")
    print(f"Saved JSON report    : {report_file}")


def analyze_incline_press_video(video_path, out_video_path=None, report_path=None, engine="posenet", model_asset_path=None):
    """Analyzes an Incline Dumbbell Press video using VisionFit AI.
    engine: "posenet" (100% self-trained PyTorch BodyPoseNet) or "mediapipe" (baseline)
    Renders full 33-landmark skeleton HUD if out_video_path is specified.
    Returns complete report dict.
    """
    import cv2
    import numpy as np
    from incline_press_analyzer import BiomechanicalInclinePressAnalyzer

    video_path = Path(video_path)
    if not video_path.is_file():
        cand = ROOT_DIR / "videos" / "incline_press" / video_path.name
        if cand.is_file():
            video_path = cand
        else:
            cand = ROOT_DIR / "videos" / video_path.name
            if cand.is_file():
                video_path = cand
    if not video_path.is_file():
        raise FileNotFoundError(f"Video file not found: {video_path}")

    if out_video_path is None:
        out_video_path = ROOT_DIR / "reports" / "incline_press" / f"{video_path.stem}_annotated.mp4"
    if report_path is None:
        report_path = ROOT_DIR / "reports" / "incline_press" / f"{video_path.stem}_report.json"

    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise IOError(f"Cannot open video: {video_path}")

    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    writer = None
    if out_video_path:
        out_video_path = Path(out_video_path)
        out_video_path.parent.mkdir(parents=True, exist_ok=True)
        fourcc = cv2.VideoWriter_fourcc(*"avc1")
        writer = cv2.VideoWriter(str(out_video_path), fourcc, fps, (w, h))
        if not writer.isOpened():
            fourcc = cv2.VideoWriter_fourcc(*"mp4v")
            writer = cv2.VideoWriter(str(out_video_path), fourcc, fps, (w, h))

    analyzer = BiomechanicalInclinePressAnalyzer()
    feedback_display = {"text": "", "color": (0, 255, 0), "timer": 0}

    posenet_model = None
    mp_detector = None

    if engine == "posenet":
        from core.pose_model import load_pose_model, infer_rgb, IMAGE_SIZE
        custom_model_path = ROOT_DIR / "models" / "pose_custom.pt"
        if not custom_model_path.is_file():
            raise FileNotFoundError(f"PoseNet model not found: {custom_model_path}")
        posenet_model = load_pose_model(str(custom_model_path), device="cpu")
    else:
        import mediapipe as mp
        if model_asset_path is None:
            model_asset_path = ROOT_DIR / "models" / "mediapipe" / "pose_landmarker_full.task"
        if not Path(model_asset_path).is_file():
            raise FileNotFoundError(f"MediaPipe task file not found: {model_asset_path}")
        options = mp.tasks.vision.PoseLandmarkerOptions(
            base_options=mp.tasks.BaseOptions(model_asset_path=str(model_asset_path)),
            running_mode=mp.tasks.vision.RunningMode.VIDEO,
            num_poses=1,
        )
        mp_detector = mp.tasks.vision.PoseLandmarker.create_from_options(options)

    frame_idx = 0
    try:
        while True:
            ok, frame = cap.read()
            if not ok:
                break

            sec = frame_idx / fps
            ts = int(round(frame_idx * 1000.0 / fps))
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

            pts = None
            current_elbow = 180.0
            current_bench = 0.0

            if engine == "posenet":
                from core.pose_model import infer_rgb, IMAGE_SIZE
                scale = min(IMAGE_SIZE / h, IMAGE_SIZE / w)
                nh, nw = max(1, int(h * scale)), max(1, int(w * scale))
                resized = cv2.resize(rgb, (nw, nh), interpolation=cv2.INTER_AREA)
                canvas = np.zeros((IMAGE_SIZE, IMAGE_SIZE, 3), dtype=np.uint8)
                top = (IMAGE_SIZE - nh) // 2
                left = (IMAGE_SIZE - nw) // 2
                canvas[top:top+nh, left:left+nw] = resized

                raw_pts = infer_rgb(posenet_model, canvas, device="cpu")
                pts = np.zeros((33, 4), dtype=np.float32)
                for i in range(33):
                    lx = (raw_pts[i, 0] * IMAGE_SIZE - left) / nw
                    ly = (raw_pts[i, 1] * IMAGE_SIZE - top) / nh
                    pts[i] = [lx * w, ly * h, raw_pts[i, 2], raw_pts[i, 3]]
            else:
                import mediapipe as mp
                mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
                res = mp_detector.detect_for_video(mp_img, ts)
                if res.pose_landmarks and len(res.pose_landmarks) > 0:
                    lm = res.pose_landmarks[0]
                    pts = np.zeros((33, 4), dtype=np.float32)
                    for i in range(33):
                        p = lm[i]
                        vis = float(p.visibility) if p.visibility is not None else 1.0
                        pts[i] = [p.x * w, p.y * h, p.z * w if hasattr(p, 'z') and p.z is not None else 0.0, vis]

            if pts is not None:
                step_res = analyzer.process_frame(pts, sec=sec)
                current_elbow = step_res["elbow_angle"]
                current_bench = step_res["bench_incline"]

                if step_res["feedback_event"]:
                    feedback_display = {
                        "text": step_res["feedback_event"]["text"],
                        "color": step_res["feedback_event"]["color"],
                        "timer": int(fps * 2.5),
                    }

                if writer:
                    def to_px(idx):
                        return int(round(pts[idx, 0])), int(round(pts[idx, 1]))

                    # Draw skeleton
                    for a, b in FULL_SKELETON_CONNECTIONS:
                        if pts[a, 3] >= 0.35 and pts[b, 3] >= 0.35:
                            cv2.line(frame, to_px(a), to_px(b), (0, 200, 255), 2, cv2.LINE_AA)

                    # Highlight active arm: Shoulder -> Elbow -> Wrist
                    side = step_res["active_side"]
                    s_idx = 11 if side == "left" else 12
                    e_idx = 13 if side == "left" else 14
                    w_idx = 15 if side == "left" else 16
                    h_idx = 23 if side == "left" else 24

                    arm_color = (0, 255, 0) if (75.0 <= current_elbow <= 95.0 or current_elbow >= 155.0) else ((0, 0, 255) if current_elbow < 70.0 else (0, 165, 255))
                    cv2.line(frame, to_px(s_idx), to_px(e_idx), arm_color, 4, cv2.LINE_AA)
                    cv2.line(frame, to_px(e_idx), to_px(w_idx), arm_color, 4, cv2.LINE_AA)

                    # Bench Incline Line: Hip -> Shoulder
                    cv2.line(frame, to_px(h_idx), to_px(s_idx), (255, 100, 0), 3, cv2.LINE_AA)

                    # Joint dots
                    for j in range(33):
                        if pts[j, 3] >= 0.35:
                            radius = 5 if j in [s_idx, e_idx, w_idx, h_idx] else 3
                            dot_color = (0, 0, 255) if j in [s_idx, e_idx, w_idx, h_idx] else (0, 255, 0)
                            cv2.circle(frame, to_px(j), radius, dot_color, -1, cv2.LINE_AA)
                            cv2.circle(frame, to_px(j), radius + 2, (255, 255, 255), 1, cv2.LINE_AA)

            if writer:
                # Top HUD Banner
                cv2.rectangle(frame, (20, 20), (min(w - 20, 560), 160), (15, 15, 15), -1)
                cv2.rectangle(frame, (20, 20), (min(w - 20, 560), 160), (0, 200, 255), 2)
                engine_label = "100% POSENET (SELF-TRAINED)" if engine == "posenet" else "MEDIAPIPE BASELINE"
                cv2.putText(frame, f"VISIONFIT AI - {engine_label}", (35, 48), cv2.FONT_HERSHEY_SIMPLEX, 0.52, (0, 200, 255), 2, cv2.LINE_AA)

                state_color = (0, 255, 0) if analyzer.state == "BOTTOM" else (0, 200, 255)
                cv2.putText(frame, f"REPS: {analyzer.completed_reps}", (35, 88), cv2.FONT_HERSHEY_SIMPLEX, 1.1, (255, 255, 255), 3, cv2.LINE_AA)
                cv2.putText(frame, f"PHA: {analyzer.state}", (230, 85), cv2.FONT_HERSHEY_SIMPLEX, 0.7, state_color, 2, cv2.LINE_AA)

                e_col = (0, 255, 0) if (75.0 <= current_elbow <= 95.0 or current_elbow >= 155.0) else ((0, 0, 255) if current_elbow < 70.0 else (0, 165, 255))
                b_col = (0, 255, 0) if (15.0 <= current_bench <= 30.0) else ((0, 165, 255) if current_bench <= 45.0 else (0, 0, 255))

                cv2.putText(frame, f"Goc khuyu: {current_elbow:.1f}° (day 75°-95°, dinh >145°)", (35, 118), cv2.FONT_HERSHEY_SIMPLEX, 0.52, e_col, 2, cv2.LINE_AA)
                cv2.putText(frame, f"Do doc ghe: {current_bench:.1f}° (chuan: 15°-30°)", (35, 145), cv2.FONT_HERSHEY_SIMPLEX, 0.52, b_col, 2, cv2.LINE_AA)

                # Real-time warning if descent too deep
                if current_elbow < 70.0 and analyzer.state in ["LOWERING", "BOTTOM"]:
                    cv2.putText(frame, "CANH BAO: HA TA QUA SAU (< 70°)!", (35, 185), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 0, 255), 2, cv2.LINE_AA)

                # Completed feedback banner
                if feedback_display["timer"] > 0:
                    banner_top = max(200, h - 140)
                    cv2.rectangle(frame, (30, banner_top), (w - 30, banner_top + 60), (10, 10, 10), -1)
                    cv2.rectangle(frame, (30, banner_top), (w - 30, banner_top + 60), feedback_display["color"], 3)
                    cv2.putText(frame, feedback_display["text"], (45, banner_top + 40), cv2.FONT_HERSHEY_SIMPLEX, 0.65, feedback_display["color"], 2, cv2.LINE_AA)
                    feedback_display["timer"] -= 1

                writer.write(frame)
            frame_idx += 1

    finally:
        cap.release()
        if hasattr(analyzer, 'finalize'):
            analyzer.finalize(sec=frame_idx / fps)
        if mp_detector is not None:
            try:
                mp_detector.close()
            except Exception:
                pass
        if writer:
            writer.release()

    report = {
        "video": video_path.name,
        "exercise": "incline_dumbbell_press",
        "exercise_vn": "Nằm ghế dốc đẩy tạ đôi (Ngực trên)",
        "ai_engine": "VisionFit PoseNet (100% Local Self-Trained PyTorch)" if engine == "posenet" else "MediaPipe Pose Landmarker (Baseline)",
        "engine_type": engine,
        "total_reps_counted": analyzer.completed_reps,
        "good_reps_count": sum(1 for r in analyzer.reps_data if r["status"] == "GOOD_FORM"),
        "bad_reps_count": sum(1 for r in analyzer.reps_data if r["status"] == "BAD_FORM"),
        "reps_detail": analyzer.reps_data,
        "standards_applied": {
            "elbow_angle_lockout_ideal": "160°-175°",
            "elbow_angle_lockout_min_acceptable": "145°",
            "elbow_angle_bottom_ideal": "75°-95°",
            "elbow_angle_bottom_acceptable": "70°-100°",
            "elbow_angle_bottom_danger_too_deep": "<70° (Nguy cơ chấn thương bao khớp vai)",
            "bench_incline_ideal": "15°-30°",
            "bench_incline_max_acceptable": "45°",
        },
    }

    if report_path:
        report_path = Path(report_path)
        report_path.parent.mkdir(parents=True, exist_ok=True)
        report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    return report


def incline_press_cli(args):
    video_path = Path(args.video)
    if not video_path.is_file():
        cand = ROOT_DIR / "videos" / "incline_press" / video_path.name
        if cand.is_file():
            video_path = cand
    out_video = args.out or f"reports/incline_press/{video_path.stem}_annotated.mp4"
    report_file = args.report or f"reports/incline_press/{video_path.stem}_report.json"
    print(f"[VisionFit Core] Analyzing Incline Dumbbell Press video: {video_path}")
    print(f"Applying Coach Truong Thai Luu Biomechanical Standards...")
    report = analyze_incline_press_video(video_path, out_video_path=out_video, report_path=report_file)
    print("\n" + "=" * 60)
    print(f"  ANALYSIS SUMMARY: {video_path.name} (Incline Dumbbell Press)")
    print("=" * 60)
    print(f"Total Reps Counted : {report['total_reps_counted']}")
    print(f"Good Reps          : {report['good_reps_count']}")
    print(f"Bad Reps           : {report['bad_reps_count']}")
    for r in report["reps_detail"]:
        print(f"  Rep {r['rep_number']:02d} ({r['start_time']}s - {r['end_time']}s): [{r['status']}] {r['feedback']}")
    print("=" * 60)
    print(f"Saved annotated video: {out_video}")
    print(f"Saved JSON report    : {report_file}")


def main():
    p = argparse.ArgumentParser(description='VisionFit local AI: keypoints -> action')
    sub = p.add_subparsers(dest='cmd', required=True)
    d = sub.add_parser('demo', help='Make fake data for code smoke test only')
    d.add_argument('--out', default='data/demo.npz')
    d.add_argument('--subjects', type=int, default=8)
    d.add_argument('--takes', type=int, default=8)
    d.add_argument('--frames', type=int, default=32)
    d.add_argument('--seed', type=int, default=42)
    t = sub.add_parser('train')
    t.add_argument('--data', required=True)
    t.add_argument('--labels', help='JSON file containing ordered class names')
    t.add_argument('--out', default='models/action.pt')
    t.add_argument('--frames', type=int, default=32)
    t.add_argument('--epochs', type=int, default=15)
    t.add_argument('--batch', type=int, default=32)
    t.add_argument('--lr', type=float, default=0.001)
    t.add_argument('--device', choices=['auto', 'cpu', 'cuda'], default='auto')
    t.add_argument('--seed', type=int, default=42)
    t.add_argument('--augment', action='store_true', help='Add small train-only landmark noise')
    t.add_argument('--class-weights', action='store_true', help='Weight rarer classes')
    t.add_argument('--patience', type=int, default=8, help='Early stopping epochs')
    t.add_argument('--val-fraction', type=float, default=0.2)
    t.add_argument('--test-fraction', type=float, default=0.2)
    t.add_argument('--report-dir', default='reports')
    q = sub.add_parser('predict')
    q.add_argument('--model', required=True)
    q.add_argument('--input', required=True, help='.npy (T,33,4) or .npz with landmarks')
    q.add_argument('--threshold', type=float, default=0.65, help='Below threshold -> unknown')
    sq = sub.add_parser('squat', help='Analyze Squat video form and count reps with VisionFit AI')
    sq.add_argument('--video', required=True, help='Path to squat video file')
    sq.add_argument('--out', help='Path to output annotated video (optional)')
    sq.add_argument('--report', help='Path to output JSON report (optional)')
    inc = sub.add_parser('incline-press', help='Analyze Incline Dumbbell Press video form and count reps with VisionFit AI')
    inc.add_argument('--video', required=True, help='Path to incline press video file')
    inc.add_argument('--out', help='Path to output annotated video (optional)')
    inc.add_argument('--report', help='Path to output JSON report (optional)')
    args = p.parse_args()
    {'demo': demo, 'train': train, 'predict': predict, 'squat': squat_cli, 'incline-press': incline_press_cli}[args.cmd](args)


if __name__ == '__main__':
    main()
