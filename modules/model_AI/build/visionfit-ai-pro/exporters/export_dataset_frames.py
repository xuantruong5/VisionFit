import sys
from pathlib import Path
_ROOT = Path(__file__).resolve().parent.parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

"""VisionFit Frame Comparison Exporter.
Exports ALL 3,059 annotated frames from data/pose_multiview_squat.npz
as side-by-side comparison images:
  Left Pane  (Green): GROUND TRUTH (MediaPipe Auto-Annotator)
  Right Pane (Orange): POSENET CUSTOM (100% SELF-TRAINED)

Format matches reports/pose_multiview_eval exactly:
  - 800 x 400 px split image
  - 'GROUND TRUTH' text in bright green
  - 'POSENET CUSTOM (100% SELF-TRAINED)' in orange
  - 'Subject: {subject}' in white
"""

import sys, os, argparse, json, time
from pathlib import Path
import numpy as np
import cv2
import torch

ROOT = Path(__file__).resolve().parent
sys.path.append(str(ROOT))

from core.pose_model import load_pose_model, IMAGE_SIZE

DATA_PATH = ROOT / 'data' / 'pose_multiview_squat.npz'
MODEL_PATH = ROOT / 'models' / 'pose_custom.pt'
DEFAULT_OUT_DIR = ROOT / 'reports' / 'pose_comparison_frames'

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
        if vis_a >= 0.35 and vis_b >= 0.35:
            cv2.line(img, xy(pts[a]), xy(pts[b]), color, 2, cv2.LINE_AA)
    for p in pts:
        vis = p[-1] if len(p) >= 3 else 1.0
        if vis >= 0.35:
            cv2.circle(img, xy(p), 4, color, -1, cv2.LINE_AA)
    return img


def export_all_comparisons(out_dir=None, batch_size=64, sample_step=1):
    if out_dir is None:
        out_dir = DEFAULT_OUT_DIR
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    print("=" * 65)
    print(f"[VisionFit Exporter] Bat dau xuat anh so sanh song song")
    print(f"  Source dataset : {DATA_PATH}")
    print(f"  Model custom   : {MODEL_PATH}")
    print(f"  Thu muc dich   : {out_dir}")
    print("=" * 65)

    # 1. Load Data
    z = np.load(DATA_PATH, allow_pickle=True)
    images = z['images']       # (N, 128, 128, 3) uint8 RGB
    keypoints = z['keypoints'] # (N, 33, 3) or (N, 33, 4)
    subjects = z['subjects']   # (N,) str
    N = len(images)
    print(f"[1/3] Da doc xong dataset: tong cong {N} frames")

    # 2. Load PoseNet Model
    print(f"[2/3] Dang nap mo hinh BodyPoseNet tu {MODEL_PATH}...")
    model = load_pose_model(MODEL_PATH, device="cpu")
    model.eval()

    # 3. Batch Inference for Speed
    print(f"[3/3] Dang chay du doan batch va xuat {N // sample_step} anh so sanh...")
    t0 = time.time()

    indices = list(range(0, N, sample_step))
    total_to_export = len(indices)
    exported = 0

    per_subject_counts = {}

    for b_start in range(0, total_to_export, batch_size):
        b_indices = indices[b_start : b_start + batch_size]
        batch_rgb = images[b_indices] # (B, 128, 128, 3)

        # PyTorch batch forward
        inp = torch.from_numpy(batch_rgb.transpose(0, 3, 1, 2)).to(device='cpu', dtype=torch.float32) / 255.0
        with torch.no_grad():
            out = model(inp)
            if isinstance(out, tuple):
                coords, vis_logits = out
                coords = coords.view(-1, 33, 2).cpu().numpy()
                vis = torch.sigmoid(vis_logits).view(-1, 33, 1).cpu().numpy()
                preds = np.concatenate([coords, np.zeros_like(vis), vis], axis=-1)
            else:
                coords = out.view(-1, 33, 2).cpu().numpy()
                vis = np.ones((len(b_indices), 33, 1), dtype=np.float32)
                preds = np.concatenate([coords, np.zeros_like(vis), vis], axis=-1)

        # Render & Save Each Comparison Frame
        for local_idx, global_idx in enumerate(b_indices):
            rgb = batch_rgb[local_idx]
            gt = keypoints[global_idx]
            pred = preds[local_idx]
            sub = str(subjects[global_idx])

            # Prepare side-by-side canvas: 400x400 each side -> 800x400
            orig_bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
            canvas = cv2.resize(orig_bgr, (400, 400), interpolation=cv2.INTER_LINEAR)

            left = draw_skeleton(canvas.copy(), gt, (0, 255, 0))
            right = draw_skeleton(canvas.copy(), pred, (0, 165, 255))
            split = np.hstack([left, right])

            # Overlay Exact Titles
            cv2.putText(split, "GROUND TRUTH", (15, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2, cv2.LINE_AA)
            cv2.putText(split, "POSENET CUSTOM (100% SELF-TRAINED)", (415, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 165, 255), 2, cv2.LINE_AA)
            cv2.putText(split, f"Subject: {sub}", (15, 385), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1, cv2.LINE_AA)

            # Sub-folder per subject
            sub_dir = out_dir / sub
            sub_dir.mkdir(parents=True, exist_ok=True)

            out_file = sub_dir / f"compare_{global_idx:04d}_{sub}.jpg"
            cv2.imwrite(str(out_file), split, [cv2.IMWRITE_JPEG_QUALITY, 90])

            exported += 1
            per_subject_counts[sub] = per_subject_counts.get(sub, 0) + 1

        elapsed = time.time() - t0
        rate = exported / max(0.1, elapsed)
        if exported % 250 == 0 or exported == total_to_export:
            print(f"  -> Da xuat: {exported}/{total_to_export} anh ({rate:.1f} frames/giay)...")

    total_time = time.time() - t0
    print("\n" + "=" * 65)
    print(f"[HOAN TAT] Da xuat thanh cong {exported} anh so sanh song song!")
    print(f"Tong thoi gian: {total_time:.2f} giay ({exported / total_time:.1f} fps)")
    print(f"Thu muc luu: {out_dir}")
    print("\nChi tiet theo tung nguoi:")
    for s, c in sorted(per_subject_counts.items()):
        print(f"  - {s:12s}: {c:4d} anh so sanh tai {out_dir / s}")
    print("=" * 65)

    # Save summary metadata
    summary = {
        "total_frames": exported,
        "execution_time_seconds": round(total_time, 2),
        "fps": round(exported / total_time, 1),
        "output_directory": str(out_dir),
        "subjects": per_subject_counts
    }
    (out_dir / "summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description="Export side-by-side comparison images for all frames in pose_multiview_squat.npz")
    parser.add_argument("--out", type=str, default=None, help="Output directory (default: reports/pose_comparison_frames)")
    parser.add_argument("--batch", type=int, default=64, help="Batch size for model inference (default: 64)")
    parser.add_argument("--step", type=int, default=1, help="Sampling step (1 = all 3059 frames)")
    args = parser.parse_args()

    export_all_comparisons(out_dir=args.out, batch_size=args.batch, sample_step=args.step)


if __name__ == '__main__':
    main()
