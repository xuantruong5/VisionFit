"""Full 5-Fold Leave-One-Subject-Out (LOSO) Cross-Validation Pipeline.
Evaluates Dual-Head BodyPoseNet generalizability on unseen subjects.

Folds:
  Fold 1: Test = person10_squat, Train = person11-14 + multiview
  Fold 2: Test = person11_squat, Train = person10, 12-14 + multiview
  Fold 3: Test = person12_squat, Train = person10-11, 13-14 + multiview
  Fold 4: Test = person13_squat, Train = person10-12, 14 + multiview
  Fold 5: Test = person14_squat, Train = person10-13 + multiview

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
OUT_FINAL_MODEL = ROOT / 'models' / 'pose_custom.pt'

GYM_SUBJECTS = ['person10_squat', 'person11_squat', 'person12_squat', 'person13_squat', 'person14_squat']


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
    return np.degrees(np.arccos(np.clip(cos_th, -1.0, 1.0)))


def train_and_eval_fold(fold_idx, test_subject, images, coords, vis, subjects, device, epochs=18):
    test_mask = (subjects == test_subject)
    train_mask = ~test_mask

    x_train = torch.from_numpy(images[train_mask]).permute(0, 3, 1, 2).float() / 255.0
    y_c_train = torch.from_numpy(coords[train_mask])
    y_v_train = torch.from_numpy(vis[train_mask])

    x_test = torch.from_numpy(images[test_mask]).permute(0, 3, 1, 2).float() / 255.0
    y_c_test = torch.from_numpy(coords[test_mask])
    y_v_test = torch.from_numpy(vis[test_mask])

    train_loader = DataLoader(TensorDataset(x_train, y_c_train, y_v_train), batch_size=32, shuffle=True)
    test_loader = DataLoader(TensorDataset(x_test, y_c_test, y_v_test), batch_size=32, shuffle=False)

    model = BodyPoseNet().to(device)
    criterion_c = WingLoss(omega=10.0, epsilon=2.0)
    criterion_v = nn.BCEWithLogitsLoss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs, eta_min=1e-5)

    lambda_vis = 0.5
    for epoch in range(epochs):
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

    # Evaluation on Held-Out Subject
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
                tp += ((pv_bin == 1) & (gv_bin == 1)).sum()
                fp += ((pv_bin == 1) & (gv_bin == 0)).sum()
                fn += ((pv_bin == 0) & (gv_bin == 1)).sum()
                tn += ((pv_bin == 0) & (gv_bin == 0)).sum()

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
    return fold_metrics, model.state_dict()


def main():
    print("=" * 80)
    print("      5-FOLD LEAVE-ONE-SUBJECT-OUT (LOSO) CROSS-VALIDATION PIPELINE")
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
        fold_res, _ = train_and_eval_fold(idx, test_sub, images, coords, vis, subjects, device, epochs=18)
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
