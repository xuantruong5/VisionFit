"""Train Dual-Head BodyPoseNet (Coordinates + Visibility) with LOSO Validation.
- Shared Backbone: 4-stage Residual CNN
- Coordinate Head: 66 outputs (WingLoss weighted by visibility)
- Visibility Head: 33 outputs (BCEWithLogitsLoss)
- LOSO Protocol: Holds out an entire unseen subject (person14) for true generalization test.
- Saves best checkpoint to models/pose_custom.pt.
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

DATA_PATH = ROOT / 'data' / 'pose_multiview_squat.npz'
OUT_MODEL = ROOT / 'models' / 'pose_custom.pt'
OUT_REPORT = ROOT / 'reports' / 'pose_loso_eval.json'


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
    print(f"[DualHead PoseNet Trainer] Loading dataset from {DATA_PATH}...")
    z = np.load(DATA_PATH, allow_pickle=True)
    images = z['images']          # (N, 128, 128, 3) uint8 RGB
    keypoints = z['keypoints']    # (N, 33, 3) float32 (x, y, vis)
    subjects = np.array([str(s) for s in z['subjects']])

    N = len(images)
    print(f"Total samples: {N}, Subjects: {np.unique(subjects)}")

    # Target tensors:
    # Coords: (N, 66) in [0, 1]
    # Vis:    (N, 33) in [0, 1]
    coords = keypoints[:, :, :2].reshape(N, 66).astype(np.float32)
    vis = keypoints[:, :, 2].astype(np.float32)

    # LOSO Split:
    # Unseen Subject Test Set: 'person14_squat' (all frames held out completely)
    test_subject = 'person14_squat'
    test_mask = (subjects == test_subject)
    train_val_mask = ~test_mask

    print(f"\n[LOSO Split Configuration]")
    print(f"  Held-out Unseen Subject: {test_subject} ({test_mask.sum()} frames)")
    print(f"  Training + Validation Pool: {train_val_mask.sum()} frames across {len(np.unique(subjects[train_val_mask]))} subjects")

    # Split train/val among remaining subjects (85% train, 15% val stratified)
    rng = np.random.default_rng(42)
    train_idx = []
    val_idx = []
    for s in np.unique(subjects[train_val_mask]):
        idxs = np.flatnonzero(subjects == s)
        shuffled = rng.permutation(idxs)
        sp = int(len(shuffled) * 0.85)
        train_idx.extend(shuffled[:sp])
        val_idx.extend(shuffled[sp:])

    train_idx = np.array(train_idx)
    val_idx = np.array(val_idx)
    test_idx = np.flatnonzero(test_mask)

    print(f"  Final Split: Train={len(train_idx)}, Val={len(val_idx)}, Unseen Test={len(test_idx)}")

    # Prepare PyTorch Tensors
    x_train = torch.from_numpy(images[train_idx]).permute(0, 3, 1, 2).float() / 255.0
    y_coord_train = torch.from_numpy(coords[train_idx])
    y_vis_train = torch.from_numpy(vis[train_idx])

    x_val = torch.from_numpy(images[val_idx]).permute(0, 3, 1, 2).float() / 255.0
    y_coord_val = torch.from_numpy(coords[val_idx])
    y_vis_val = torch.from_numpy(vis[val_idx])

    x_test = torch.from_numpy(images[test_idx]).permute(0, 3, 1, 2).float() / 255.0
    y_coord_test = torch.from_numpy(coords[test_idx])
    y_vis_test = torch.from_numpy(vis[test_idx])

    batch_size = 32
    train_loader = DataLoader(TensorDataset(x_train, y_coord_train, y_vis_train), batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(TensorDataset(x_val, y_coord_val, y_vis_val), batch_size=batch_size, shuffle=False)
    test_loader = DataLoader(TensorDataset(x_test, y_coord_test, y_vis_test), batch_size=batch_size, shuffle=False)

    device = torch.device('mps' if torch.backends.mps.is_available() else 'cpu')
    print(f"  Training Device: {device}")

    model = BodyPoseNet().to(device)
    total_params = sum(p.numel() for p in model.parameters())
    print(f"  Model Architecture: Dual-Head BodyPoseNet ({total_params:,} parameters)")

    criterion_coord = WingLoss(omega=10.0, epsilon=2.0)
    criterion_vis = nn.BCEWithLogitsLoss()

    optimizer = torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-4)
    epochs = 30
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs, eta_min=1e-5)

    lambda_vis = 0.5  # balancing coefficient for visibility loss
    best_val_loss = float('inf')
    best_state = None

    print(f"\n{'Epoch':^7} | {'Train Loss':^14} | {'Val Coord (px)':^16} | {'Val Vis Bce':^12} | {'LR':^10} | {'Time':^7}")
    print("-" * 75)

    for epoch in range(1, epochs + 1):
        t0 = time.time()
        model.train()
        train_loss = 0.0

        for bx, b_coord, b_vis in train_loader:
            bx, b_coord, b_vis = bx.to(device), b_coord.to(device), b_vis.to(device)
            optimizer.zero_grad()

            pred_coord, pred_vis_logits = model(bx)

            # Weight coordinate loss by joint visibility
            coord_weight = torch.repeat_interleave(b_vis, 2, dim=-1)
            # Clip weight to minimum 0.2 so occluded joints still get guidance
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

                # Mean pixel error
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
            best_state = {k: v.cpu().clone() for k, v in model.state_dict().items()}
        marker = " ★ (Best)" if is_best else ""
        print(f"{epoch:^7d} | {train_loss:^14.4f} | {val_coord_err:^16.2f} | {val_vis_loss:^12.4f} | {lr:^10.6f} | {dt:^6.1f}s{marker}")

    # Load best state for evaluation
    model.load_state_dict(best_state)
    model.eval()

    # Save Checkpoint
    OUT_MODEL.parent.mkdir(parents=True, exist_ok=True)
    torch.save({
        'architecture': 'BodyPoseNet',
        'type': 'DualHead_ResBlock_CNN',
        'state': best_state,
        'image_size': 128,
        'num_joints': 33,
        'heads': {'coords': 66, 'visibility': 33},
        'best_val_coord_px': val_coord_err,
        'held_out_test_subject': test_subject,
        'trained_samples': len(train_idx),
        'note': 'Dual-Head BodyPoseNet (66 Coords + 33 Visibility) with Leave-One-Subject-Out (100% PyTorch Local)'
    }, OUT_MODEL)
    print(f"\n[Checkpoint Saved] -> {OUT_MODEL} ({OUT_MODEL.stat().st_size / (1024*1024):.2f} MB)")

    # Comprehensive Scientific Evaluation on Held-Out Test Set (person14)
    print(f"\n" + "=" * 75)
    print(f"      SCIENTIFIC EVALUATION ON HELD-OUT UNSEEN SUBJECT ({test_subject.upper()})")
    print("=" * 75)

    test_pixel_errors = []
    test_pck05 = []
    test_pck10 = []
    test_pck20 = []
    vis_true_pos = 0
    vis_false_pos = 0
    vis_false_neg = 0
    vis_true_neg = 0

    with torch.no_grad():
        for bx, b_coord, b_vis in test_loader:
            bx, b_coord, b_vis = bx.to(device), b_coord.to(device), b_vis.to(device)
            pred_coord, pred_vis_logits = model(bx)

            pred_pts = pred_coord.view(-1, 33, 2).cpu().numpy()
            gt_pts = b_coord.view(-1, 33, 2).cpu().numpy()
            pred_v = torch.sigmoid(pred_vis_logits).cpu().numpy()
            gt_v = b_vis.cpu().numpy()

            for i in range(len(pred_pts)):
                diff = np.linalg.norm(pred_pts[i] - gt_pts[i], axis=-1)  # (33,)
                px_err = diff * IMAGE_SIZE
                test_pixel_errors.append(px_err.mean())

                # Torso size for standard PCK
                ls, rs = gt_pts[i, 11], gt_pts[i, 12]
                lh, rh = gt_pts[i, 23], gt_pts[i, 24]
                torso = np.linalg.norm((ls + rs)/2.0 - (lh + rh)/2.0)
                if torso < 0.05: torso = 0.25

                # Filter by visible joints (visibility >= 0.5)
                vis_mask = gt_v[i] >= 0.5
                if vis_mask.sum() > 0:
                    test_pck05.append((diff[vis_mask] <= 0.05 * torso).mean() * 100.0)
                    test_pck10.append((diff[vis_mask] <= 0.10 * torso).mean() * 100.0)
                    test_pck20.append((diff[vis_mask] <= 0.20 * torso).mean() * 100.0)

                # Visibility classification (threshold 0.5)
                pv_bin = pred_v[i] >= 0.5
                gv_bin = gt_v[i] >= 0.5
                vis_true_pos += ((pv_bin == 1) & (gv_bin == 1)).sum()
                vis_false_pos += ((pv_bin == 1) & (gv_bin == 0)).sum()
                vis_false_neg += ((pv_bin == 0) & (gv_bin == 1)).sum()
                vis_true_neg += ((pv_bin == 0) & (gv_bin == 0)).sum()

    mean_err_unseen = float(np.mean(test_pixel_errors))
    pck10_unseen = float(np.mean(test_pck10))
    pck20_unseen = float(np.mean(test_pck20))

    precision = vis_true_pos / (vis_true_pos + vis_false_pos + 1e-6)
    recall = vis_true_pos / (vis_true_pos + vis_false_neg + 1e-6)
    f1_score = 2 * precision * recall / (precision + recall + 1e-6)

    print(f"Mean Joint Pixel Error on UNSEEN Person : {mean_err_unseen:.2f} px (128x128)")
    print(f"PCK@0.10 (Strict Torso Normalization)   : {pck10_unseen:.2f}%")
    print(f"PCK@0.20 (Standard Academic Benchmark)  : {pck20_unseen:.2f}%")
    print(f"Visibility Head Precision               : {precision * 100.0:.2f}%")
    print(f"Visibility Head Recall                  : {recall * 100.0:.2f}%")
    print(f"Visibility Head F1-Score                : {f1_score * 100.0:.2f}%")
    print("=" * 75)

    # Save scientific report
    report = {
        "model": "models/pose_custom.pt",
        "architecture": "DualHead_BodyPoseNet",
        "protocol": "Leave-One-Subject-Out (LOSO)",
        "held_out_unseen_subject": test_subject,
        "metrics_on_unseen_subject": {
            "mean_joint_error_pixels_128": round(mean_err_unseen, 2),
            "pck_010_torso": round(pck10_unseen, 2),
            "pck_020_torso_standard": round(pck20_unseen, 2),
            "visibility_precision_pct": round(precision * 100.0, 2),
            "visibility_recall_pct": round(recall * 100.0, 2),
            "visibility_f1_pct": round(f1_score * 100.0, 2),
        },
        "model_parameters": total_params,
        "input_resolution": "128x128x3",
        "outputs": {
            "coordinate_head": "33 joints x (x, y) normalized [0, 1]",
            "visibility_head": "33 joints visibility probability [0, 1]"
        }
    }
    OUT_REPORT.parent.mkdir(parents=True, exist_ok=True)
    OUT_REPORT.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding='utf-8')
    print(f"[Report Saved] -> {OUT_REPORT}")


if __name__ == '__main__':
    main()
