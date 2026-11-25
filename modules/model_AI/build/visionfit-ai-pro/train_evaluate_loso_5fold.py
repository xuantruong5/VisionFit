"""Full 5-Fold Leave-One-Subject-Out (LOSO) Cross-Validation Pipeline.
Evaluates Dual-Head BodyPoseNet generalizability on unseen subjects.

Key scientific properties:
  1. Strict subject separation: Held-out subject (e.g. person10_squat) is 100% unseen.
  2. Train-Only Augmentation: Horizontal flipping is applied ONLY to the training pool.
     Test set contains purely real, unaugmented frames.
  3. Internal Validation: 15% of the training pool is used to select the best checkpoint
     per fold, ensuring optimal generalization.
  4. Angle MAE & PCK: Evaluates Knee MAE, Torso MAE, PCK@0.10, PCK@0.20, and Visibility F1.

Outputs:
  reports/pose_loso_5fold_eval.json
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
OUT_JSON = ROOT / 'reports' / 'pose_loso_5fold_eval.json'

GYM_SUBJECTS = ['person10_squat', 'person11_squat', 'person12_squat', 'person13_squat', 'person14_squat']

FLIP_PAIRS = [
    (1, 4), (2, 5), (3, 6), (7, 8), (9, 10),
    (11, 12), (13, 14), (15, 16), (17, 18), (19, 20), (21, 22),
    (23, 24), (25, 26), (27, 28), (29, 30), (31, 32)
]


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


def compute_angle(a, b, c):
    v1 = a - b
    v2 = c - b
    cos_th = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2) + 1e-6)
    return float(np.degrees(np.arccos(np.clip(cos_th, -1.0, 1.0))))


def augment_training_data(x, y_c, y_v):
    """Applies horizontal flip augmentation to training tensors only."""
    x_flip = torch.flip(x, dims=[3])
    
    y_c_flip = y_c.clone().view(-1, 33, 2)
    y_c_flip[:, :, 0] = 1.0 - y_c_flip[:, :, 0]
    for a, b in FLIP_PAIRS:
        tmp = y_c_flip[:, a].clone()
        y_c_flip[:, a] = y_c_flip[:, b]
        y_c_flip[:, b] = tmp
    y_c_flip = y_c_flip.view(-1, 66)

    y_v_flip = y_v.clone()
    for a, b in FLIP_PAIRS:
        tmp = y_v_flip[:, a].clone()
        y_v_flip[:, a] = y_v_flip[:, b]
        y_v_flip[:, b] = tmp

    x_out = torch.cat([x, x_flip], dim=0)
    y_c_out = torch.cat([y_c, y_c_flip], dim=0)
    y_v_out = torch.cat([y_v, y_v_flip], dim=0)
    return x_out, y_c_out, y_v_out


def train_and_eval_fold(fold_idx, test_subject, images, coords, vis, subjects, device, epochs=20):
    test_mask = (subjects == test_subject)
    train_pool_mask = ~test_mask

    # 1. Held-out Test Set (Pure, unaugmented real frames of test_subject)
    x_test = torch.from_numpy(images[test_mask]).permute(0, 3, 1, 2).float() / 255.0
    y_c_test = torch.from_numpy(coords[test_mask])
    y_v_test = torch.from_numpy(vis[test_mask])
    test_loader = DataLoader(TensorDataset(x_test, y_c_test, y_v_test), batch_size=32, shuffle=False)

    # 2. Train / Internal Val split from remaining training pool
    train_pool_indices = np.flatnonzero(train_pool_mask)
    rng = np.random.default_rng(42 + fold_idx)
    shuffled = rng.permutation(train_pool_indices)
    val_cut = int(len(shuffled) * 0.15)
    val_idx = shuffled[:val_cut]
    tr_idx = shuffled[val_cut:]

    x_val = torch.from_numpy(images[val_idx]).permute(0, 3, 1, 2).float() / 255.0
    y_c_val = torch.from_numpy(coords[val_idx])
    y_v_val = torch.from_numpy(vis[val_idx])
    val_loader = DataLoader(TensorDataset(x_val, y_c_val, y_v_val), batch_size=32, shuffle=False)

    x_tr_raw = torch.from_numpy(images[tr_idx]).permute(0, 3, 1, 2).float() / 255.0
    y_c_tr_raw = torch.from_numpy(coords[tr_idx])
    y_v_tr_raw = torch.from_numpy(vis[tr_idx])

    # 3. Augment training split ONLY
    x_train, y_c_train, y_v_train = augment_training_data(x_tr_raw, y_c_tr_raw, y_v_tr_raw)
    train_loader = DataLoader(TensorDataset(x_train, y_c_train, y_v_train), batch_size=32, shuffle=True)

    model = BodyPoseNet().to(device)
    criterion_c = WingLoss(omega=10.0, epsilon=2.0)
    criterion_v = nn.BCEWithLogitsLoss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=8e-4, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs, eta_min=1e-5)

    lambda_vis = 0.5
    best_val_loss = float('inf')
    best_state = None

    for epoch in range(1, epochs + 1):
        model.train()
        for bx, bc, bv in train_loader:
            bx, bc, bv = bx.to(device), bc.to(device), bv.to(device)
            optimizer.zero_grad()
            p_c, p_v = model(bx)
            w = torch.clamp(torch.repeat_interleave(bv, 2, dim=-1), min=0.2, max=1.0)
            loss = criterion_c(p_c, bc, weight=w) + lambda_vis * criterion_v(p_v, bv)
            loss.backward()
            optimizer.step()
        scheduler.step()

        # Internal validation to select best checkpoint
        model.eval()
        val_loss = 0.0
        with torch.no_grad():
            for bx, bc, bv in val_loader:
                bx, bc, bv = bx.to(device), bc.to(device), bv.to(device)
                p_c, p_v = model(bx)
                w = torch.clamp(torch.repeat_interleave(bv, 2, dim=-1), min=0.2, max=1.0)
                l = criterion_c(p_c, bc, weight=w) + lambda_vis * criterion_v(p_v, bv)
                val_loss += l.item() * len(bx)
        val_loss /= len(val_idx)

        if val_loss < best_val_loss:
            best_val_loss = val_loss
            best_state = {k: v.cpu().clone() for k, v in model.state_dict().items()}

    # Load best state for evaluation on unseen subject
    model.load_state_dict(best_state)
    model.eval()

    vis_errors = []
    all_errors = []
    pck10_list = []
    pck20_list = []
    knee_maes = []
    torso_maes = []
    tp, fp, fn, tn = 0, 0, 0, 0

    with torch.no_grad():
        for bx, bc, bv in test_loader:
            bx, bc, bv = bx.to(device), bc.to(device), bv.to(device)
            p_c, p_v = model(bx)

            pred_pts = p_c.view(-1, 33, 2).cpu().numpy()
            gt_pts = bc.view(-1, 33, 2).cpu().numpy()
            pred_v = torch.sigmoid(p_v).cpu().numpy()
            gt_v = bv.cpu().numpy()

            for i in range(len(pred_pts)):
                diff = np.linalg.norm(pred_pts[i] - gt_pts[i], axis=-1)  # (33,)
                px_err = diff * IMAGE_SIZE
                all_errors.append(px_err.mean())

                v_mask = gt_v[i] >= 0.5
                if v_mask.sum() > 0:
                    vis_errors.append(px_err[v_mask].mean())
                else:
                    vis_errors.append(px_err.mean())

                # Torso size for standard PCK
                ls, rs = gt_pts[i, 11], gt_pts[i, 12]
                lh, rh = gt_pts[i, 23], gt_pts[i, 24]
                torso = np.linalg.norm((ls + rs)/2.0 - (lh + rh)/2.0)
                if torso < 0.05: torso = 0.25

                if v_mask.sum() > 0:
                    pck10_list.append((diff[v_mask] <= 0.10 * torso).mean() * 100.0)
                    pck20_list.append((diff[v_mask] <= 0.20 * torso).mean() * 100.0)

                # Angles
                side = 'right' if (pred_v[i, 24] + pred_v[i, 26] >= pred_v[i, 23] + pred_v[i, 25]) else 'left'
                h_idx = 24 if side == 'right' else 23
                k_idx = 26 if side == 'right' else 25
                a_idx = 28 if side == 'right' else 27
                s_idx = 12 if side == 'right' else 11

                p_knee = compute_angle(pred_pts[i, h_idx], pred_pts[i, k_idx], pred_pts[i, a_idx])
                g_knee = compute_angle(gt_pts[i, h_idx], gt_pts[i, k_idx], gt_pts[i, a_idx])
                knee_maes.append(abs(p_knee - g_knee))

                p_t_vec = pred_pts[i, s_idx] - pred_pts[i, h_idx]
                g_t_vec = gt_pts[i, s_idx] - gt_pts[i, h_idx]
                p_torso = np.degrees(np.arctan2(abs(p_t_vec[0]), abs(p_t_vec[1]) + 1e-6))
                g_torso = np.degrees(np.arctan2(abs(g_t_vec[0]), abs(g_t_vec[1]) + 1e-6))
                torso_maes.append(abs(p_torso - g_torso))

                # Vis F1
                pv_bin = pred_v[i] >= 0.5
                gv_bin = gt_v[i] >= 0.5
                tp += int(((pv_bin == 1) & (gv_bin == 1)).sum())
                fp += int(((pv_bin == 1) & (gv_bin == 0)).sum())
                fn += int(((pv_bin == 0) & (gv_bin == 1)).sum())
                tn += int(((pv_bin == 0) & (gv_bin == 0)).sum())

    prec = tp / (tp + fp + 1e-6)
    rec = tp / (tp + fn + 1e-6)
    f1 = 2 * prec * rec / (prec + rec + 1e-6)

    fold_metrics = {
        'fold': fold_idx,
        'held_out_subject': test_subject,
        'test_frames': int(test_mask.sum()),
        'visible_joint_error_px': round(float(np.mean(vis_errors)), 2),
        'all_joint_error_px': round(float(np.mean(all_errors)), 2),
        'pck_010_torso': round(float(np.mean(pck10_list)), 2),
        'pck_020_torso': round(float(np.mean(pck20_list)), 2),
        'visibility_f1_pct': round(float(f1 * 100.0), 2),
        'knee_angle_mae_deg': round(float(np.mean(knee_maes)), 2),
        'torso_angle_mae_deg': round(float(np.mean(torso_maes)), 2),
    }
    return fold_metrics, best_state


def main():
    print("=" * 80)
    print("      5-FOLD LEAVE-ONE-SUBJECT-OUT (LOSO) CROSS-VALIDATION PIPELINE")
    print("      (Strict Subject Isolation · Train-Only Augmentation · Internal Val)")
    print("=" * 80)
    z = np.load(DATA_PATH, allow_pickle=True)
    images = z['images']
    keypoints = z['keypoints']
    subjects = np.array([str(s) for s in z['subjects']])

    coords = keypoints[:, :, :2].reshape(len(images), 66).astype(np.float32)
    vis = keypoints[:, :, 2].astype(np.float32)

    device = torch.device('mps' if torch.backends.mps.is_available() else 'cpu')
    print(f"Device: {device}, Total samples: {len(images)}")
    print(f"Subjects for LOSO: {GYM_SUBJECTS}\n")

    results = []
    t_start = time.time()

    for idx, test_sub in enumerate(GYM_SUBJECTS, 1):
        print(f"[Fold {idx}/5] Training with '{test_sub}' strictly held out as Unseen Test...")
        t0 = time.time()
        fold_res, _ = train_and_eval_fold(idx, test_sub, images, coords, vis, subjects, device, epochs=20)
        dt = time.time() - t0
        results.append(fold_res)
        print(f"  --> Visible Joint Err: {fold_res['visible_joint_error_px']} px | Knee Angle MAE: {fold_res['knee_angle_mae_deg']}° | Vis F1: {fold_res['visibility_f1_pct']}% ({dt:.1f}s)")

    # Aggregate LOSO Results
    vis_errs = [r['visible_joint_error_px'] for r in results]
    all_errs = [r['all_joint_error_px'] for r in results]
    pck10s = [r['pck_010_torso'] for r in results]
    pck20s = [r['pck_020_torso'] for r in results]
    f1s = [r['visibility_f1_pct'] for r in results]
    knee_maes = [r['knee_angle_mae_deg'] for r in results]
    torso_maes = [r['torso_angle_mae_deg'] for r in results]

    summary = {
        'mean_visible_joint_error_px': round(float(np.mean(vis_errs)), 2),
        'std_visible_joint_error_px': round(float(np.std(vis_errs)), 2),
        'mean_all_joint_error_px': round(float(np.mean(all_errs)), 2),
        'mean_pck_010_torso': round(float(np.mean(pck10s)), 2),
        'mean_pck_020_torso': round(float(np.mean(pck20s)), 2),
        'mean_visibility_f1_pct': round(float(np.mean(f1s)), 2),
        'mean_knee_angle_mae_deg': round(float(np.mean(knee_maes)), 2),
        'mean_torso_angle_mae_deg': round(float(np.mean(torso_maes)), 2),
    }

    full_report = {
        'evaluation_protocol': '5-Fold Leave-One-Subject-Out (LOSO) Cross-Validation',
        'principles_applied': [
            'Strict Subject ID Isolation (No subject cross-contamination)',
            'Train-Only Horizontal Flip Augmentation (Test set remains pure real video frames)',
            'Internal Stratified Validation for early checkpoint selection per fold'
        ],
        'subjects_evaluated': GYM_SUBJECTS,
        'summary_across_folds': summary,
        'folds_detail': results,
        'total_execution_time_seconds': round(time.time() - t_start, 1)
    }

    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(full_report, indent=2, ensure_ascii=False), encoding='utf-8')

    print("\n" + "=" * 80)
    print("      FINAL 5-FOLD LOSO CROSS-VALIDATION SUMMARY REPORT")
    print("=" * 80)
    print(f"Mean Visible Joint Error : {summary['mean_visible_joint_error_px']} ± {summary['std_visible_joint_error_px']} px")
    print(f"Mean Knee Angle MAE      : {summary['mean_knee_angle_mae_deg']}°")
    print(f"Mean Torso Angle MAE     : {summary['mean_torso_angle_mae_deg']}°")
    print(f"Mean Visibility F1-Score : {summary['mean_visibility_f1_pct']}%")
    print(f"Mean PCK@0.20 (Standard) : {summary['mean_pck_020_torso']}%")
    print("=" * 80)
    print(f"[Success] Saved 5-Fold LOSO Report -> {OUT_JSON}")


if __name__ == '__main__':
    main()
