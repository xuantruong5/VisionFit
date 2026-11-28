"""VisionFit Frame Exporter.
Exports 3,059 annotated frames from data/pose_multiview_squat.npz.

Supports 2 modes:
  1. 'raw': Exports pure RGB images categorized by subject folder + annotations.json.
  2. 'compare': Exports side-by-side Ground Truth vs PoseNet Custom skeleton images
               (matching the evaluation report view).
"""

import sys, os, argparse, json
from pathlib import Path
import numpy as np
import cv2
import torch

ROOT = Path(__file__).resolve().parent
sys.path.append(str(ROOT))

from pose_model import load_pose_model, infer_rgb, IMAGE_SIZE

DATA_PATH = ROOT / 'data' / 'pose_multiview_squat.npz'
MODEL_PATH = ROOT / 'models' / 'pose_custom.pt'

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
        vis_a = pts[a, -1] if pts.shape[-1] >= 3 else 1.0
        vis_b = pts[b, -1] if pts.shape[-1] >= 3 else 1.0
        if vis_a >= 0.4 and vis_b >= 0.4:
            cv2.line(img, xy(pts[a]), xy(pts[b]), color, 2, cv2.LINE_AA)
    for p in pts:
        vis = p[-1] if len(p) >= 3 else 1.0
        if vis >= 0.4:
            cv2.circle(img, xy(p), 4, color, -1)
    return img


def export_frames(mode="raw", out_dir=None, sample_step=1):
    z = np.load(DATA_PATH, allow_pickle=True)
    images = z['images']
    keypoints = z['keypoints']
    subjects = z['subjects']
    total = len(images)

    if out_dir is None:
        if mode == "raw":
            out_dir = ROOT / 'data' / 'extracted_frames'
        else:
            out_dir = ROOT / 'reports' / 'pose_comparison_frames'
    else:
        out_dir = Path(out_dir)

    out_dir.mkdir(parents=True, exist_ok=True)
    print(f"[Exporter] Mode: {mode.upper()}")
    print(f"[Exporter] Source: {DATA_PATH} ({total} frames)")
    print(f"[Exporter] Destination: {out_dir}")
    print(f"[Exporter] Step: {sample_step} (Processing {total // sample_step} frames)\n")

    model = None
    if mode == "compare":
        print(f"[Exporter] Loading PoseNet model from {MODEL_PATH}...")
        model = load_pose_model(MODEL_PATH, device="cpu")

    annotations = {}
    exported_count = 0

    for i in range(0, total, sample_step):
        rgb = images[i]
        gt_kp = keypoints[i]
        sub = str(subjects[i])

        sub_dir = out_dir / sub
        sub_dir.mkdir(parents=True, exist_ok=True)

        if mode == "raw":
            filename = f"frame_{i:04d}.jpg"
            img_path = sub_dir / filename
            bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
            cv2.imwrite(str(img_path), bgr, [cv2.IMWRITE_JPEG_QUALITY, 95])

            annotations[f"{sub}/{filename}"] = {
                "frame_idx": i,
                "subject": sub,
                "keypoints_33": gt_kp.tolist()
            }
        elif mode == "compare":
            pred = infer_rgb(model, rgb, device="cpu")
            orig = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
            canvas = cv2.resize(orig, (400, 400), interpolation=cv2.INTER_LINEAR)

            left = draw_skeleton(canvas.copy(), gt_kp, (0, 255, 0))
            right = draw_skeleton(canvas.copy(), pred, (0, 165, 255))
            split = np.hstack([left, right])

            # Black header bar
            header = np.zeros((45, split.shape[1], 3), dtype=np.uint8)
            cv2.putText(header, "GROUND TRUTH", (15, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2, cv2.LINE_AA)
            cv2.putText(header, "POSENET CUSTOM (100% SELF-TRAINED)", (415, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 165, 255), 2, cv2.LINE_AA)

            final_img = np.vstack([header, split])
            cv2.putText(final_img, f"Subject: {sub} | Frame: #{i:04d}", (15, final_img.shape[0] - 15), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1, cv2.LINE_AA)

            filename = f"compare_{i:04d}_{sub}.jpg"
            img_path = sub_dir / filename
            cv2.imwrite(str(img_path), final_img, [cv2.IMWRITE_JPEG_QUALITY, 90])

        exported_count += 1
        if exported_count % 250 == 0 or i == total - 1:
            print(f"  -> Exported {exported_count} frames...")

    if mode == "raw":
        ann_path = out_dir / "annotations.json"
        ann_path.write_text(json.dumps(annotations, indent=2), encoding="utf-8")
        print(f"\n[Success] Saved annotations to: {ann_path}")

    print(f"[Success] Exported total {exported_count} frames to {out_dir}\n")


def main():
    parser = argparse.ArgumentParser(description="Export frames from pose_multiview_squat.npz")
    parser.add_argument("--mode", choices=["raw", "compare"], default="raw",
                        help="'raw': export original RGB images; 'compare': export side-by-side GT vs PoseNet images")
    parser.add_argument("--out", type=str, default=None, help="Custom output directory")
    parser.add_argument("--step", type=int, default=1, help="Sampling step (1 = all 3059 frames, 10 = every 10th frame)")
    args = parser.parse_args()

    export_frames(mode=args.mode, out_dir=args.out, sample_step=args.step)


if __name__ == '__main__':
    main()
