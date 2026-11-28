import sys
from pathlib import Path
_ROOT = Path(__file__).resolve().parent.parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

"""Evaluation of Multi-View PoseNet Model.
Computes PCK@0.05, PCK@0.10, Mean Error (pixels), and generates
side-by-side comparison images across all squat videos.
"""

import sys, os, json
from pathlib import Path
import numpy as np
import cv2
import torch

ROOT = Path(__file__).resolve().parent
sys.path.append(str(ROOT))

from core.pose_model import load_pose_model, infer_rgb, IMAGE_SIZE

DATA_PATH = ROOT / 'data' / 'pose_multiview_squat.npz'
MODEL_PATH = ROOT / 'models' / 'pose_custom.pt'
OUT_DIR = ROOT / 'reports' / 'pose_multiview_eval'
OUT_JSON = ROOT / 'reports' / 'pose_multiview_eval.json'

EDGES = [
    (11, 12),
    (11, 13), (13, 15),
    (12, 14), (14, 16),
    (11, 23), (12, 24),
    (23, 24),
    (23, 25), (25, 27),
    (24, 26), (26, 28),
    (27, 29), (29, 31),
    (28, 30), (30, 32)
]

def draw_skeleton(img, pts, color):
    h, w = img.shape[:2]
    def xy(p):
        return (int(round(p[0] * (w - 1))), int(round(p[1] * (h - 1))))

    for a, b in EDGES:
        if pts[a, -1] >= 0.4 and pts[b, -1] >= 0.4:
            cv2.line(img, xy(pts[a]), xy(pts[b]), color, 2, cv2.LINE_AA)
    for p in pts:
        if p[-1] >= 0.4:
            cv2.circle(img, xy(p), 4, color, -1)
    return img

def main():
    print(f"[Eval] Loading model from {MODEL_PATH}...")
    model = load_pose_model(MODEL_PATH, device='cpu')

    print(f"[Eval] Loading data from {DATA_PATH}...")
    z = np.load(DATA_PATH, allow_pickle=True)
    images = z['images']
    keypoints = z['keypoints']
    subjects = z['subjects']

    N = len(images)
    print(f"[Eval] Total samples: {N}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    # Compute metrics
    # Torso diameter (shoulder to hip) for PCK thresholding
    per_subject_stats = {}
    all_errors = []
    all_pck05 = []
    all_pck10 = []

    # Sample comparison frames per subject
    sample_stride = max(1, N // 40)
    saved_images = 0

    for i in range(N):
        rgb = images[i]
        gt = keypoints[i]
        sub = str(subjects[i])

        pred = infer_rgb(model, rgb, device='cpu')

        # Torso diameter
        ls, rs = gt[11, :2], gt[12, :2]
        lh, rh = gt[23, :2], gt[24, :2]
        shoulder_center = (ls + rs) / 2.0
        hip_center = (lh + rh) / 2.0
        torso_size = np.linalg.norm(shoulder_center - hip_center)
        if torso_size < 0.05:
            torso_size = 0.25  # fallback reasonable torso size

        diff = np.linalg.norm(pred[:, :2] - gt[:, :2], axis=-1)  # (33,)
        pixel_error = diff * IMAGE_SIZE

        pck05 = (diff <= 0.05 * torso_size).mean() * 100.0
        pck10 = (diff <= 0.10 * torso_size).mean() * 100.0

        all_errors.append(pixel_error.mean())
        all_pck05.append(pck05)
        all_pck10.append(pck10)

        if sub not in per_subject_stats:
            per_subject_stats[sub] = {'errors': [], 'pck05': [], 'pck10': [], 'count': 0}
        per_subject_stats[sub]['errors'].append(pixel_error.mean())
        per_subject_stats[sub]['pck05'].append(pck05)
        per_subject_stats[sub]['pck10'].append(pck10)
        per_subject_stats[sub]['count'] += 1

        # Save visual comparison images periodically
        if i % sample_stride == 0 and saved_images < 35:
            orig = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
            canvas = cv2.resize(orig, (400, 400), interpolation=cv2.INTER_LINEAR)

            left = draw_skeleton(canvas.copy(), gt, (0, 255, 0))
            right = draw_skeleton(canvas.copy(), pred, (0, 165, 255))
            split = np.hstack([left, right])

            cv2.putText(split, "GROUND TRUTH", (15, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            cv2.putText(split, "POSENET CUSTOM (100% SELF-TRAINED)", (415, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 165, 255), 2)
            cv2.putText(split, f"Subject: {sub}", (15, 385), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

            out_img = OUT_DIR / f"compare_{saved_images:02d}_{sub}.jpg"
            cv2.imwrite(str(out_img), split)
            saved_images += 1

    overall_pck05 = float(np.mean(all_pck05))
    overall_pck10 = float(np.mean(all_pck10))
    overall_err = float(np.mean(all_errors))

    report = {
        'model': 'models/pose_custom.pt',
        'architecture': 'VisionFit ResBlock CNN PoseNet (100% Local Self-Trained)',
        'total_eval_frames': N,
        'overall': {
            'pck_05': round(overall_pck05, 2),
            'pck_10': round(overall_pck10, 2),
            'mean_error_pixels_128': round(overall_err, 2),
        },
        'per_subject': {}
    }

    print("\n" + "=" * 65)
    print("           VISIONFIT POSENET MULTI-VIEW EVALUATION REPORT")
    print("=" * 65)
    print(f"Overall PCK@0.05: {overall_pck05:.2f}% | PCK@0.10: {overall_pck10:.2f}% | Mean Error: {overall_err:.2f} px")
    print("-" * 65)

    for sub, stats in sorted(per_subject_stats.items()):
        sub_pck05 = round(float(np.mean(stats['pck05'])), 2)
        sub_pck10 = round(float(np.mean(stats['pck10'])), 2)
        sub_err = round(float(np.mean(stats['errors'])), 2)
        report['per_subject'][sub] = {
            'frames': stats['count'],
            'pck_05': sub_pck05,
            'pck_10': sub_pck10,
            'mean_error_pixels': sub_err
        }
        print(f"  {sub:<20}: {stats['count']:>4} frames | PCK@0.05: {sub_pck05:>6.2f}% | Error: {sub_err:>5.2f} px")

    OUT_JSON.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding='utf-8')
    print(f"\n[Success] Saved report to {OUT_JSON}")
    print(f"Saved {saved_images} comparison images to {OUT_DIR}")

if __name__ == '__main__':
    main()
