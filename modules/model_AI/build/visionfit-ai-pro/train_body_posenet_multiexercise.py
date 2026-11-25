"""Train & Fine-tune Dual-Head BodyPoseNet on Multi-Exercise Dataset.
Exercises included:
  1. Squat (Person 10-14, Multi-view, Front/Side, Correct/Incorrect)
  2. Incline Dumbbell Press (Person 1 + Symmetrically flipped)
Total samples: 4,499 frames (128x128x3 RGB).
Target outputs:
  - 66 Coordinates (x, y) for 33 joints
  - 33 Visibility logits for 33 joints
Saves checkpoint to models/pose_custom.pt.
"""

import sys, os, time, json
from pathlib import Path
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import TensorDataset, DataLoader

ROOT = Path(__file__).resolve().parent
sys.path.append(str(ROOT))

from pose_model import BodyPoseNet, IMAGE_SIZE

DATA_PATH = ROOT / 'data' / 'pose_multi_exercise.npz'
OUT_MODEL = ROOT / 'models' / 'pose_custom.pt'
OUT_REPORT = ROOT / 'reports' / 'pose_multiexercise_eval.json'


class WingLoss(nn.Module):
    def __init__(self, omega=10.0, epsilon=2.0):
        super().__init__()
        self.omega = omega
        self.epsilon = epsilon
        self.c = omega - omega * np.log(1.0 + omega / epsilon)

    def forward(self, pred, target, weight=None):
        delta = (pred - target).abs()
        loss = torch.where(delta < self.omega,
                           self.omega * torch.log(1.0 + delta / self.epsilon),
                           delta - self.c)
        if weight is not None:
            loss = loss * weight
        return loss.mean()


def main():
    print(f"[Multi-Exercise PoseNet Trainer] Loading dataset from {DATA_PATH}...")
    z = np.load(DATA_PATH, allow_pickle=True)
    images = z['images']          # (N, 128, 128, 3) uint8 RGB
    keypoints = z['keypoints']    # (N, 33, 3) float32 (x, y, vis)
    subjects = np.array([str(s) for s in z['subjects']])

    N = len(images)
    print(f"Total samples: {N}, Subjects: {len(np.unique(subjects))}")

    coords = keypoints[:, :, :2].reshape(N, 66).astype(np.float32)
    vis = keypoints[:, :, 2].astype(np.float32)

    # Stratified Train/Val split (85% train, 15% val per subject group)
    rng = np.random.default_rng(42)
    train_idx = []
    val_idx = []
    for s in np.unique(subjects):
        idxs = np.flatnonzero(subjects == s)
        shuffled = rng.permutation(idxs)
        sp = int(len(shuffled) * 0.85)
        train_idx.extend(shuffled[:sp])
        val_idx.extend(shuffled[sp:])

    train_idx = np.array(train_idx)
    val_idx = np.array(val_idx)

    print(f"Dataset Split: Train={len(train_idx)}, Val={len(val_idx)}")

    # Balanced Sampler: Equalize weight between Squat and Incline Press
    train_subs = subjects[train_idx]
    is_incline = np.array(['incline' in s for s in train_subs])
    n_inc = is_incline.sum()
    n_sq = len(train_idx) - n_inc
    w_inc = 1.0 / max(1, n_inc)
    w_sq = 1.0 / max(1, n_sq)
    sample_weights = torch.tensor([w_inc if inc else w_sq for inc in is_incline], dtype=torch.double)
    sampler = torch.utils.data.WeightedRandomSampler(sample_weights, num_samples=len(train_idx), replacement=True)

    x_train = torch.from_numpy(images[train_idx]).permute(0, 3, 1, 2).float() / 255.0
    y_coord_train = torch.from_numpy(coords[train_idx])
    y_vis_train = torch.from_numpy(vis[train_idx])

    x_val = torch.from_numpy(images[val_idx]).permute(0, 3, 1, 2).float() / 255.0
    y_coord_val = torch.from_numpy(coords[val_idx])
    y_vis_val = torch.from_numpy(vis[val_idx])

    batch_size = 32
    train_loader = DataLoader(TensorDataset(x_train, y_coord_train, y_vis_train), batch_size=batch_size, sampler=sampler)
    val_loader = DataLoader(TensorDataset(x_val, y_coord_val, y_vis_val), batch_size=batch_size, shuffle=False)

    device = torch.device('mps' if torch.backends.mps.is_available() else 'cpu')
    print(f"Training Device: {device}")

    model = BodyPoseNet().to(device)

    # Warm start from existing checkpoint if available
    if OUT_MODEL.is_file():
        try:
            ckpt = torch.load(OUT_MODEL, map_location='cpu')
            if isinstance(ckpt, dict) and 'state' in ckpt:
                model.load_state_dict(ckpt['state'])
                print(f"[Warm Start] Loaded weights from {OUT_MODEL}")
        except Exception as e:
            print(f"[Warm Start Warning] Could not load prior weights: {e}")

    total_params = sum(p.numel() for p in model.parameters())
    print(f"Model Architecture: Dual-Head BodyPoseNet ({total_params:,} parameters)")

    criterion_coord = WingLoss(omega=10.0, epsilon=2.0)
    criterion_vis = nn.BCEWithLogitsLoss()

    optimizer = torch.optim.AdamW(model.parameters(), lr=5e-4, weight_decay=1e-4)
    epochs = 20
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs, eta_min=1e-5)
    lambda_vis = 0.5

    best_val_loss = float('inf')
    best_state = None
    best_val_px = 0.0

    print(f"\n{'Epoch':^7} | {'Train Loss':^14} | {'Val Coord (px)':^16} | {'Val Vis Loss':^14} | {'LR':^10} | {'Time':^7}")
    print("-" * 78)

    for epoch in range(1, epochs + 1):
        t0 = time.time()
        model.train()
        train_loss = 0.0

        for bx, b_coord, b_vis in train_loader:
            bx, b_coord, b_vis = bx.to(device), b_coord.to(device), b_vis.to(device)
            optimizer.zero_grad()

            pred_coord, pred_vis_logits = model(bx)

            # Weight coordinates by visibility (minimum 0.2)
            coord_weight = torch.repeat_interleave(b_vis, 2, dim=-1)
            coord_weight = torch.clamp(coord_weight, min=0.2, max=1.0)

            l_coord = criterion_coord(pred_coord, b_coord, weight=coord_weight)
            l_vis = criterion_vis(pred_vis_logits, b_vis)

            loss = l_coord + lambda_vis * l_vis
            loss.backward()
            optimizer.step()
            train_loss += loss.item() * len(bx)

        scheduler.step()
        train_loss /= len(train_idx)

        # Validation
        model.eval()
        val_coord_err = 0.0
        val_vis_loss = 0.0

        with torch.no_grad():
            for bx, b_coord, b_vis in val_loader:
                bx, b_coord, b_vis = bx.to(device), b_coord.to(device), b_vis.to(device)
                pred_coord, pred_vis_logits = model(bx)

                p_pts = pred_coord.view(-1, 33, 2)
                g_pts = b_coord.view(-1, 33, 2)
                diff_px = torch.norm(p_pts - g_pts, dim=-1) * IMAGE_SIZE
                val_coord_err += diff_px.mean().item() * len(bx)

                l_v = criterion_vis(pred_vis_logits, b_vis)
                val_vis_loss += l_v.item() * len(bx)

        val_coord_err /= len(val_idx)
        val_vis_loss /= len(val_idx)
        val_total = val_coord_err + lambda_vis * val_vis_loss

        dt = time.time() - t0
        lr = scheduler.get_last_lr()[0]

        is_best = val_total < best_val_loss
        if is_best:
            best_val_loss = val_total
            best_val_px = val_coord_err
            best_state = {k: v.cpu().clone() for k, v in model.state_dict().items()}

        marker = " ★ (Best)" if is_best else ""
        print(f"{epoch:^7d} | {train_loss:^14.4f} | {val_coord_err:^16.2f} | {val_vis_loss:^14.4f} | {lr:^10.6f} | {dt:^6.1f}s{marker}")

    # Load best state and save checkpoint
    model.load_state_dict(best_state)
    model.eval()

    OUT_MODEL.parent.mkdir(parents=True, exist_ok=True)
    torch.save({
        'architecture': 'BodyPoseNet',
        'type': 'DualHead_ResBlock_CNN',
        'state': best_state,
        'image_size': 128,
        'num_joints': 33,
        'heads': {'coords': 66, 'visibility': 33},
        'best_val_coord_px': best_val_px,
        'trained_samples': len(train_idx),
        'exercises': ['squat', 'incline_dumbbell_press'],
        'note': 'Dual-Head BodyPoseNet Multi-Exercise Checkpoint (Squat + Incline Dumbbell Press, 100% PyTorch Local)'
    }, OUT_MODEL)

    print(f"\n[Checkpoint Saved] -> {OUT_MODEL} ({OUT_MODEL.stat().st_size / (1024*1024):.2f} MB)")

    # Compute detailed evaluation on validation set
    val_pixel_errors = []
    val_pck05 = []
    val_pck10 = []
    val_pck20 = []
    vis_tp, vis_fp, vis_fn, vis_tn = 0, 0, 0, 0

    with torch.no_grad():
        for bx, b_coord, b_vis in val_loader:
            bx, b_coord, b_vis = bx.to(device), b_coord.to(device), b_vis.to(device)
            pred_coord, pred_vis_logits = model(bx)

            pred_pts = pred_coord.view(-1, 33, 2).cpu().numpy()
            gt_pts = b_coord.view(-1, 33, 2).cpu().numpy()
            pred_v = torch.sigmoid(pred_vis_logits).cpu().numpy()
            gt_v = b_vis.cpu().numpy()

            for i in range(len(pred_pts)):
                diff = np.linalg.norm(pred_pts[i] - gt_pts[i], axis=-1)
                val_pixel_errors.append(diff.mean() * IMAGE_SIZE)

                ls, rs = gt_pts[i, 11], gt_pts[i, 12]
                lh, rh = gt_pts[i, 23], gt_pts[i, 24]
                torso = np.linalg.norm((ls + rs)/2.0 - (lh + rh)/2.0)
                if torso < 0.05: torso = 0.25

                vis_mask = gt_v[i] >= 0.5
                if vis_mask.sum() > 0:
                    val_pck05.append((diff[vis_mask] <= 0.05 * torso).mean() * 100.0)
                    val_pck10.append((diff[vis_mask] <= 0.10 * torso).mean() * 100.0)
                    val_pck20.append((diff[vis_mask] <= 0.20 * torso).mean() * 100.0)

                pv_bin = pred_v[i] >= 0.5
                gv_bin = gt_v[i] >= 0.5
                vis_tp += int(((pv_bin == 1) & (gv_bin == 1)).sum())
                vis_fp += int(((pv_bin == 1) & (gv_bin == 0)).sum())
                vis_fn += int(((pv_bin == 0) & (gv_bin == 1)).sum())
                vis_tn += int(((pv_bin == 0) & (gv_bin == 0)).sum())

    prec = vis_tp / (vis_tp + vis_fp + 1e-6)
    rec = vis_tp / (vis_tp + vis_fn + 1e-6)
    f1 = 2 * prec * rec / (prec + rec + 1e-6)
    acc = (vis_tp + vis_tn) / (vis_tp + vis_tn + vis_fp + vis_fn + 1e-6)

    report = {
        "dataset": "pose_multi_exercise.npz",
        "total_samples": N,
        "train_samples": len(train_idx),
        "val_samples": len(val_idx),
        "exercises": ["squat", "incline_dumbbell_press"],
        "val_mean_pixel_error": round(float(np.mean(val_pixel_errors)), 2),
        "val_pck05": round(float(np.mean(val_pck05)), 2),
        "val_pck10": round(float(np.mean(val_pck10)), 2),
        "val_pck20": round(float(np.mean(val_pck20)), 2),
        "visibility_classification": {
            "accuracy": round(float(acc * 100.0), 2),
            "precision": round(float(prec * 100.0), 2),
            "recall": round(float(rec * 100.0), 2),
            "f1_score": round(float(f1 * 100.0), 2),
        }
    }

    OUT_REPORT.parent.mkdir(parents=True, exist_ok=True)
    OUT_REPORT.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding='utf-8')
    print(f"\n[Validation Report Saved] -> {OUT_REPORT}")
    print(f"  Mean Pixel Error: {report['val_mean_pixel_error']} px")
    print(f"  PCK@0.05: {report['val_pck05']}% | PCK@0.10: {report['val_pck10']}% | PCK@0.20: {report['val_pck20']}%")
    print(f"  Visibility F1-Score: {report['visibility_classification']['f1_score']}% (Accuracy: {report['visibility_classification']['accuracy']}%)")


if __name__ == '__main__':
    main()
