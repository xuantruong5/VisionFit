"""VisionFit Push-up Comparison Frames Exporter.
Exports side-by-side comparison images for all 8 Push-up videos:
  Left Pane  (Green): GROUND TRUTH (MediaPipe Auto-Annotator)
  Right Pane (Orange): VISIONFIT AI (100% Custom PoseNet)

Output directories:
  reports/pose_comparison_frames/push_up/dung/ (5 subjects)
  reports/pose_comparison_frames/push_up/sai/ (3 subjects)
"""

import sys
import json
import time
from pathlib import Path
import numpy as np
import cv2
import torch
import mediapipe as mp

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from core.pose_model import load_pose_model, IMAGE_SIZE

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

VIDEOS = [
    ("push_up_dung_chuan", "dung", ROOT / "videos" / "push_up" / "dung" / "push_up_dung_chuan.mp4"),
    ("pushup_nu_dung_chuan", "dung", ROOT / "videos" / "push_up" / "dung" / "pushup_nu_dung_chuan.mp4"),
    ("pushup_nam_dung_chuan_1", "dung", ROOT / "videos" / "push_up" / "dung" / "pushup_nam_dung_chuan_1.mp4"),
    ("pushup_nam_dung_chuan_2", "dung", ROOT / "videos" / "push_up" / "dung" / "pushup_nam_dung_chuan_2.mp4"),
    ("pushup_nam_dung_chuan_3", "dung", ROOT / "videos" / "push_up" / "dung" / "pushup_nam_dung_chuan_3.mp4"),
    ("pushup_sai_ha_nong", "sai", ROOT / "videos" / "push_up" / "sai" / "pushup_sai_ha_nong.mp4"),
    ("pushup_sai_nho_mong", "sai", ROOT / "videos" / "push_up" / "sai" / "pushup_sai_nho_mong.mp4"),
    ("pushup_sai_nho_mong_huongdan", "sai", ROOT / "videos" / "push_up" / "sai" / "pushup_sai_nho_mong_huongdan.mp4"),
]


def draw_skeleton(img, pts, color):
    h, w = img.shape[:2]

    def xy(p):
        return (int(round(p[0] * (w - 1))), int(round(p[1] * (h - 1))))

    for a, b in EDGES:
        vis_a = pts[a, 3] if pts.shape[-1] >= 4 else 1.0
        vis_b = pts[b, 3] if pts.shape[-1] >= 4 else 1.0
        if vis_a >= 0.35 and vis_b >= 0.35:
            cv2.line(img, xy(pts[a]), xy(pts[b]), color, 2, cv2.LINE_AA)
    for p in pts:
        vis = p[3] if len(p) >= 4 else 1.0
        if vis >= 0.35:
            cv2.circle(img, xy(p), 4, color, -1, cv2.LINE_AA)
    return img


def export_pushup_frames(out_dir=None, overwrite=False):
    if out_dir is None:
        out_dir = ROOT / "reports" / "pose_comparison_frames"
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    print("=" * 65)
    print("[VisionFit Exporter] Bat dau xuat anh so sanh song song cho 8 video Push-up")
    print(f"  Thu muc dich: {out_dir}")
    print("=" * 65)

    # 1. Setup MediaPipe task path
    task_path = ROOT / "models" / "mediapipe" / "pose_landmarker_full.task"
    if not task_path.is_file():
        raise FileNotFoundError(f"Missing MediaPipe model: {task_path}")

    # 2. Setup PoseNet model
    model_path = ROOT / "models" / "pose_custom.pt"
    posenet = load_pose_model(model_path, device="cpu")
    posenet.eval()

    total_exported = 0
    t0 = time.time()
    subject_counts = {}

    options = mp.tasks.vision.PoseLandmarkerOptions(
        base_options=mp.tasks.BaseOptions(model_asset_path=str(task_path)),
        running_mode=mp.tasks.vision.RunningMode.VIDEO,
        num_poses=1,
    )

    for sub_name, cat, v_path in VIDEOS:
        if not v_path.is_file():
            print(f"Khong tim thay video: {v_path}")
            continue

        cap = cv2.VideoCapture(str(v_path))
        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        n_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

        sub_dir = out_dir / "push_up" / cat / sub_name
        sub_dir.mkdir(parents=True, exist_ok=True)

        print(f"\nDang xuat: {sub_name} ({n_frames} frames, {fps:.1f} fps)...")
        f_idx = 0

        with mp.tasks.vision.PoseLandmarker.create_from_options(options) as detector:
            while True:
                ok, frame = cap.read()
                if not ok:
                    break

                out_file = sub_dir / f"compare_{f_idx:04d}_{sub_name}.jpg"
                if not overwrite and out_file.exists() and out_file.stat().st_size > 1000:
                    f_idx += 1
                    total_exported += 1
                    continue

                rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                ts = int(round(f_idx * 1000.0 / fps))

                # A. Ground Truth (MediaPipe)
                mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
                res = detector.detect_for_video(mp_img, ts)
                gt_pts = np.zeros((33, 4), dtype=np.float32)
                if res.pose_landmarks and len(res.pose_landmarks) > 0:
                    for i, p in enumerate(res.pose_landmarks[0]):
                        gt_pts[i] = [p.x, p.y, p.z or 0.0, p.visibility or 1.0]

                # B. PoseNet Custom Inference
                scale = min(IMAGE_SIZE / h, IMAGE_SIZE / w)
                nh, nw = max(1, int(h * scale)), max(1, int(w * scale))
                resized = cv2.resize(rgb, (nw, nh), interpolation=cv2.INTER_AREA)
                canvas = np.zeros((IMAGE_SIZE, IMAGE_SIZE, 3), dtype=np.uint8)
                top = (IMAGE_SIZE - nh) // 2
                left = (IMAGE_SIZE - nw) // 2
                canvas[top:top+nh, left:left+nw] = resized

                inp = torch.from_numpy(canvas.transpose(2, 0, 1)).unsqueeze(0).to(device="cpu", dtype=torch.float32) / 255.0
                with torch.no_grad():
                    out = posenet(inp)
                    if isinstance(out, tuple):
                        coords, vis_logits = out
                        coords = coords.view(33, 2).cpu().numpy()
                        vis = torch.sigmoid(vis_logits).view(33, 1).cpu().numpy()
                    else:
                        coords = out.view(33, 2).cpu().numpy()
                        vis = np.ones((33, 1), dtype=np.float32)

                # Map coordinates back to original frame [0, 1]
                pred_pts = np.zeros((33, 4), dtype=np.float32)
                for i in range(33):
                    px = (coords[i, 0] * IMAGE_SIZE - left) / nw
                    py = (coords[i, 1] * IMAGE_SIZE - top) / nh
                    pred_pts[i] = [np.clip(px, 0.0, 1.0), np.clip(py, 0.0, 1.0), 0.0, vis[i, 0]]

                # C. Render 800x400 split image (supports both portrait and landscape)
                scale_disp = min(400.0 / h, 400.0 / w)
                nw_disp = max(1, int(round(w * scale_disp)))
                nh_disp = max(1, int(round(h * scale_disp)))
                bgr_resized = cv2.resize(frame, (nw_disp, nh_disp))

                sq_canvas = np.zeros((400, 400, 3), dtype=np.uint8)
                x_off = (400 - nw_disp) // 2
                y_off = (400 - nh_disp) // 2
                sq_canvas[y_off:y_off+nh_disp, x_off:x_off+nw_disp] = bgr_resized

                # Scale landmarks to square canvas
                gt_sq = gt_pts.copy()
                gt_sq[:, 0] = (gt_pts[:, 0] * nw_disp + x_off) / 400.0
                gt_sq[:, 1] = (gt_pts[:, 1] * nh_disp + y_off) / 400.0

                pred_sq = pred_pts.copy()
                pred_sq[:, 0] = (pred_pts[:, 0] * nw_disp + x_off) / 400.0
                pred_sq[:, 1] = (pred_pts[:, 1] * nh_disp + y_off) / 400.0

                left_pane = draw_skeleton(sq_canvas.copy(), gt_sq, (0, 255, 0))
                right_pane = draw_skeleton(sq_canvas.copy(), pred_sq, (0, 165, 255))
                split = np.hstack([left_pane, right_pane])

                # Overlay Titles
                cv2.putText(split, "GROUND TRUTH", (15, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 255, 0), 2, cv2.LINE_AA)
                cv2.putText(split, "VISIONFIT AI (CUSTOM ENGINE)", (415, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 165, 255), 2, cv2.LINE_AA)
                cv2.putText(split, f"Subject: {sub_name} | Frame {f_idx + 1}/{n_frames}", (15, 385), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1, cv2.LINE_AA)

                cv2.imwrite(str(out_file), split, [cv2.IMWRITE_JPEG_QUALITY, 90])

                f_idx += 1
                total_exported += 1

                if f_idx % 50 == 0 or f_idx == n_frames:
                    elapsed = time.time() - t0
                    print(f"  -> {sub_name}: {f_idx}/{n_frames} frames ({total_exported / max(0.1, elapsed):.1f} fps)...")

        cap.release()
        subject_counts[sub_name] = f_idx

    total_time = time.time() - t0

    # 3. Update summary.json
    summary_file = out_dir / "summary.json"
    if summary_file.exists():
        try:
            summary = json.loads(summary_file.read_text(encoding="utf-8"))
        except Exception:
            summary = {"total_frames": 0, "subjects": {}, "categories": {}}
    else:
        summary = {"total_frames": 0, "subjects": {}, "categories": {}}

    if "categories" not in summary:
        summary["categories"] = {}
    if "push_up" not in summary["categories"]:
        summary["categories"]["push_up"] = {"dung": {}, "sai": {}}

    for sub_name, cat, _ in VIDEOS:
        if sub_name in subject_counts:
            count = subject_counts[sub_name]
            summary["subjects"][sub_name] = count
            if cat not in summary["categories"]["push_up"]:
                summary["categories"]["push_up"][cat] = {}
            summary["categories"]["push_up"][cat][sub_name] = count

    summary["total_frames"] = sum(summary["subjects"].values())
    summary["last_updated"] = time.strftime("%Y-%m-%d %H:%M:%S")

    summary_file.write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")

    print("\n" + "=" * 65)
    print(f"[HOAN TAT] Da xuat thanh cong {total_exported} anh so sanh Push-up!")
    print(f"Tong so frames tat ca cac bai tap trong gallery: {summary['total_frames']}")
    print(f"Thoi gian thuc thi: {total_time:.2f}s ({total_exported / total_time:.1f} fps)")
    print("=" * 65)


if __name__ == "__main__":
    overwrite = "--overwrite" in sys.argv
    export_pushup_frames(overwrite=overwrite)
