"""VisionFit AI Pipeline: Push-up Auto-Annotation, Dataset Merging & PoseNet Training.
1. Auto-Annotates 3 Push-up videos using MediaPipe teacher (offline).
2. Generates horizontal flip augmentations.
3. Merges Squat (3,059) + Push-up (2,688) -> data/pose_multi_exercise.npz (5,747 frames).
4. Trains Dual-Head BodyPoseNet (PyTorch) using Apple Silicon GPU (MPS) with WingLoss.
5. Saves updated weights to models/pose_custom.pt.
6. Re-exports all Push-up comparison frames in reports/pose_comparison_frames/push_up/.
"""

import sys
import os
import time
import json
from pathlib import Path
import numpy as np
import cv2
import torch
import torch.nn as nn
from torch.utils.data import TensorDataset, DataLoader
import mediapipe as mp

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from core.pose_model import BodyPoseNet, IMAGE_SIZE, JOINTS

FLIP_MAP = {
    1: 4, 2: 5, 3: 6, 4: 1, 5: 2, 6: 3,
    7: 8, 8: 7,
    9: 10, 10: 9,
    11: 12, 12: 11,
    13: 14, 14: 13,
    15: 16, 16: 15,
    17: 18, 18: 17,
    19: 20, 20: 19,
    21: 22, 22: 21,
    23: 24, 24: 23,
    25: 26, 26: 25,
    27: 28, 28: 27,
    29: 30, 30: 29,
    31: 32, 32: 31,
}

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

PUSHUP_VIDEOS = [
    ("push_up_dung_chuan", "dung", ROOT / "videos" / "push_up" / "dung" / "push_up_dung_chuan.mp4"),
    ("pushup_nu_dung_chuan", "dung", ROOT / "videos" / "push_up" / "dung" / "pushup_nu_dung_chuan.mp4"),
    ("pushup_nam_dung_chuan_1", "dung", ROOT / "videos" / "push_up" / "dung" / "pushup_nam_dung_chuan_1.mp4"),
    ("pushup_nam_dung_chuan_2", "dung", ROOT / "videos" / "push_up" / "dung" / "pushup_nam_dung_chuan_2.mp4"),
    ("pushup_nam_dung_chuan_3", "dung", ROOT / "videos" / "push_up" / "dung" / "pushup_nam_dung_chuan_3.mp4"),
    ("pushup_sai_ha_nong", "sai", ROOT / "videos" / "push_up" / "sai" / "pushup_sai_ha_nong.mp4"),
    ("pushup_sai_nho_mong", "sai", ROOT / "videos" / "push_up" / "sai" / "pushup_sai_nho_mong.mp4"),
    ("pushup_sai_nho_mong_huongdan", "sai", ROOT / "videos" / "push_up" / "sai" / "pushup_sai_nho_mong_huongdan.mp4"),
    ("pushup_sai_user_1", "sai", ROOT / "videos" / "push_up" / "hít đất sai.mp4"),
    ("pushup_sai_user_2", "sai", ROOT / "videos" / "push_up" / "hít đất sai 2.mp4"),
]


def letterbox_image(bgr, size=IMAGE_SIZE):
    h, w = bgr.shape[:2]
    scale = min(size / h, size / w)
    nh, nw = max(1, int(round(h * scale))), max(1, int(round(w * scale)))
    resized = cv2.resize(bgr, (nw, nh), interpolation=cv2.INTER_AREA)
    canvas = np.zeros((size, size, 3), dtype=np.uint8)
    top = (size - nh) // 2
    left = (size - nw) // 2
    canvas[top:top+nh, left:left+nw] = resized
    return canvas, scale, top, left, nw, nh


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


def step1_auto_annotate_pushup():
    print("=" * 70)
    print("[BƯỚC 1/4] MediaPipe Auto-Annotator: Trích xuất nhãn chuẩn 3 video Push-up")
    print("=" * 70)

    task_path = ROOT / "models" / "mediapipe" / "pose_landmarker_full.task"
    if not task_path.is_file():
        raise FileNotFoundError(f"Missing MediaPipe model: {task_path}")

    all_images = []
    all_keypoints = []
    all_subjects = []

    options = mp.tasks.vision.PoseLandmarkerOptions(
        base_options=mp.tasks.BaseOptions(model_asset_path=str(task_path)),
        running_mode=mp.tasks.vision.RunningMode.VIDEO,
        num_poses=1,
    )

    for sub_name, cat, v_path in PUSHUP_VIDEOS:
        if not v_path.is_file():
            print(f"Warning: Cannot find {v_path}")
            continue

        cap = cv2.VideoCapture(str(v_path))
        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        n_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        print(f"  -> Đang gắn nhãn {sub_name} ({n_frames} frames)...")

        f_idx = 0
        extracted = 0

        with mp.tasks.vision.PoseLandmarker.create_from_options(options) as detector:
            while True:
                ok, frame = cap.read()
                if not ok:
                    break

                ts_ms = int(round(f_idx * 1000.0 / fps))
                h, w = frame.shape[:2]
                rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
                res = detector.detect_for_video(mp_img, ts_ms)

                if res.pose_landmarks and len(res.pose_landmarks) > 0:
                    lm = res.pose_landmarks[0]
                    canvas_bgr, scale, top, left, nw, nh = letterbox_image(frame, size=IMAGE_SIZE)
                    canvas_rgb = cv2.cvtColor(canvas_bgr, cv2.COLOR_BGR2RGB)

                    kp = np.zeros((33, 3), dtype=np.float32)
                    for i in range(33):
                        p = lm[i]
                        vis = float(p.visibility) if p.visibility is not None else 1.0
                        cx = np.clip((left + p.x * nw) / float(IMAGE_SIZE), 0.0, 1.0)
                        cy = np.clip((top + p.y * nh) / float(IMAGE_SIZE), 0.0, 1.0)
                        kp[i] = [cx, cy, vis]

                    # 1. Original sample
                    all_images.append(canvas_rgb)
                    all_keypoints.append(kp)
                    all_subjects.append(sub_name)

                    # 2. Horizontal Flip Augmentation
                    flipped_bgr = cv2.flip(canvas_bgr, 1)
                    flipped_rgb = cv2.cvtColor(flipped_bgr, cv2.COLOR_BGR2RGB)
                    flipped_kp = np.zeros((33, 3), dtype=np.float32)
                    for i in range(33):
                        t_idx = FLIP_MAP.get(i, i)
                        flipped_kp[t_idx] = [1.0 - kp[i, 0], kp[i, 1], kp[i, 2]]

                    all_images.append(flipped_rgb)
                    all_keypoints.append(flipped_kp)
                    all_subjects.append(f"{sub_name}_flip")
                    extracted += 1

                f_idx += 1
        cap.release()
        print(f"     Xong {extracted} frames gốc + {extracted} frames lật = {extracted * 2} mẫu")

    out_npz = ROOT / "data" / "pose_pushup.npz"
    np.savez_compressed(
        out_npz,
        images=np.array(all_images, dtype=np.uint8),
        keypoints=np.array(all_keypoints, dtype=np.float32),
        subjects=np.array(all_subjects, dtype=object),
    )
    print(f"[THÀNH CÔNG] Đã lưu {len(all_images)} mẫu Push-up vào {out_npz}\n")
    return out_npz


def step2_merge_datasets(pushup_npz):
    print("=" * 70)
    print("[BƯỚC 2/4] Hợp nhất dữ liệu Squat (3.059) + Push-up (~2.688)")
    print("=" * 70)

    squat_npz = ROOT / "data" / "pose_multiview_squat.npz"
    z_sq = np.load(squat_npz, allow_pickle=True)
    z_pu = np.load(pushup_npz, allow_pickle=True)

    comb_img = np.concatenate([z_sq["images"], z_pu["images"]], axis=0)
    comb_kp = np.concatenate([z_sq["keypoints"], z_pu["keypoints"]], axis=0)
    comb_sub = np.concatenate([z_sq["subjects"], z_pu["subjects"]], axis=0)

    out_merged = ROOT / "data" / "pose_multi_exercise.npz"
    np.savez_compressed(
        out_merged,
        images=comb_img,
        keypoints=comb_kp,
        subjects=comb_sub,
    )
    print(f"Tổng số mẫu hợp nhất: {len(comb_img)} frames")
    print(f"  - Squat: {len(z_sq['images'])} frames")
    print(f"  - Push-up: {len(z_pu['images'])} frames")
    print(f"[THÀNH CÔNG] Đã lưu vào {out_merged}\n")
    return out_merged


def step3_train_posenet(dataset_path, epochs=30, batch_size=64, lr=1e-3):
    print("=" * 70)
    print("[BƯỚC 3/4] Huấn luyện Dual-Head BodyPoseNet với WingLoss (Đa bài tập)")
    print("=" * 70)

    device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
    print(f"Thiết bị tính toán: {device.type.upper()}")

    z = np.load(dataset_path, allow_pickle=True)
    images = z["images"]          # (N, 128, 128, 3)
    keypoints = z["keypoints"]    # (N, 33, 3)
    subjects = np.array([str(s) for s in z["subjects"]])
    N = len(images)

    coords = keypoints[:, :, :2].reshape(N, 66).astype(np.float32)
    vis = keypoints[:, :, 2].astype(np.float32)

    # 85/15 train/val split
    rng = np.random.default_rng(42)
    indices = np.arange(N)
    rng.shuffle(indices)
    sp = int(N * 0.85)
    train_idx = indices[:sp]
    val_idx = indices[sp:]

    x_train = torch.from_numpy(images[train_idx]).permute(0, 3, 1, 2).float() / 255.0
    y_coord_train = torch.from_numpy(coords[train_idx])
    y_vis_train = torch.from_numpy(vis[train_idx])

    x_val = torch.from_numpy(images[val_idx]).permute(0, 3, 1, 2).float() / 255.0
    y_coord_val = torch.from_numpy(coords[val_idx])
    y_vis_val = torch.from_numpy(vis[val_idx])

    train_ds = TensorDataset(x_train, y_coord_train, y_vis_train)
    val_ds = TensorDataset(x_val, y_coord_val, y_vis_val)

    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False)

    model = BodyPoseNet().to(device)

    # Load existing weights as warm-start if available
    old_ckpt_path = ROOT / "models" / "pose_custom.pt"
    if old_ckpt_path.is_file():
        try:
            ckpt = torch.load(old_ckpt_path, map_location=device, weights_only=False)
            st = ckpt.get("state", ckpt.get("state_dict", {}))
            model.load_state_dict(st, strict=False)
            print("  -> Đã nạp pre-trained weights từ pose_custom.pt (Warm-start transfer learning)")
        except Exception as e:
            print(f"  -> Khởi tạo ngẫu nhiên ({e})")

    criterion_coord = WingLoss(omega=10.0, epsilon=2.0)
    criterion_vis = nn.BCEWithLogitsLoss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs, eta_min=1e-5)

    best_val_loss = float("inf")
    best_state = None

    print(f"\n{'Epoch':^7} | {'Train Loss':^14} | {'Val Pixel Error (px)':^22} | {'Time':^7}")
    print("-" * 60)

    for epoch in range(1, epochs + 1):
        t0 = time.time()
        model.train()
        train_loss = 0.0

        for bx, b_coord, b_vis in train_loader:
            bx, b_coord, b_vis = bx.to(device), b_coord.to(device), b_vis.to(device)
            optimizer.zero_grad()

            pred_coord, pred_vis_logits = model(bx)
            coord_weight = torch.repeat_interleave(b_vis, 2, dim=-1).clamp(min=0.2, max=1.0)

            l_coord = criterion_coord(pred_coord, b_coord, weight=coord_weight)
            l_vis = criterion_vis(pred_vis_logits, b_vis)
            loss = l_coord + 0.5 * l_vis

            loss.backward()
            optimizer.step()
            train_loss += loss.item() * len(bx)

        scheduler.step()
        train_loss /= len(train_idx)

        # Validation
        model.eval()
        val_px_err = 0.0
        with torch.no_grad():
            for bx, b_coord, b_vis in val_loader:
                bx, b_coord = bx.to(device), b_coord.to(device)
                pred_coord, _ = model(bx)
                p_pts = pred_coord.view(-1, 33, 2)
                g_pts = b_coord.view(-1, 33, 2)
                diff_px = torch.norm(p_pts - g_pts, dim=-1) * IMAGE_SIZE
                val_px_err += diff_px.mean().item() * len(bx)

        val_px_err /= len(val_idx)
        dt = time.time() - t0

        is_best = val_px_err < best_val_loss
        if is_best:
            best_val_loss = val_px_err
            best_state = {k: v.cpu().clone() for k, v in model.state_dict().items()}

        marker = " ★ (Best)" if is_best else ""
        print(f"{epoch:^7d} | {train_loss:^14.4f} | {val_px_err:^22.2f} px | {dt:^5.1f}s{marker}")

    # Save to models/pose_custom.pt
    out_model = ROOT / "models" / "pose_custom.pt"
    torch.save({
        "state": best_state,
        "image_size": IMAGE_SIZE,
        "architecture": "BodyPoseNet",
        "type": "ResBlock_CNN_DualHead",
        "num_joints": 33,
        "best_val_pixel_error": best_val_loss,
        "trained_samples": N,
        "note": "Multi-Exercise PoseNet trained on Squat + Push-up with WingLoss"
    }, out_model)

    print(f"\n[THÀNH CÔNG] Đã lưu model tốt nhất vào {out_model} ({out_model.stat().st_size / 1024:.1f} KB)")
    print(f"Sai số trung bình: {best_val_loss:.2f} pixels trên ảnh 128x128!")
    return out_model


def step4_reexport_pushup_comparisons():
    print("=" * 70)
    print("[BƯỚC 4/4] Xuất lại 1.344 ảnh đối sánh Push-up bằng mô hình PoseNet mới")
    print("=" * 70)

    task_path = ROOT / "models" / "mediapipe" / "pose_landmarker_full.task"
    model_path = ROOT / "models" / "pose_custom.pt"

    from core.pose_model import load_pose_model
    posenet = load_pose_model(model_path, device="cpu")
    posenet.eval()

    out_base = ROOT / "reports" / "pose_comparison_frames" / "push_up"

    options = mp.tasks.vision.PoseLandmarkerOptions(
        base_options=mp.tasks.BaseOptions(model_asset_path=str(task_path)),
        running_mode=mp.tasks.vision.RunningMode.VIDEO,
        num_poses=1,
    )

    total_exported = 0
    t0 = time.time()

    for sub_name, cat, v_path in PUSHUP_VIDEOS:
        if not v_path.is_file():
            continue

        cap = cv2.VideoCapture(str(v_path))
        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        n_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

        sub_dir = out_base / cat / sub_name
        sub_dir.mkdir(parents=True, exist_ok=True)

        print(f"  -> Đang xuất {sub_name} ({n_frames} frames)...")
        f_idx = 0

        with mp.tasks.vision.PoseLandmarker.create_from_options(options) as detector:
            while True:
                ok, frame = cap.read()
                if not ok:
                    break

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
                    coords, vis_logits = out
                    coords = coords.view(33, 2).cpu().numpy()
                    vis = torch.sigmoid(vis_logits).view(33, 1).cpu().numpy()

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

                gt_sq = gt_pts.copy()
                gt_sq[:, 0] = (gt_pts[:, 0] * nw_disp + x_off) / 400.0
                gt_sq[:, 1] = (gt_pts[:, 1] * nh_disp + y_off) / 400.0

                pred_sq = pred_pts.copy()
                pred_sq[:, 0] = (pred_pts[:, 0] * nw_disp + x_off) / 400.0
                pred_sq[:, 1] = (pred_pts[:, 1] * nh_disp + y_off) / 400.0

                left_pane = draw_skeleton(sq_canvas.copy(), gt_sq, (0, 255, 0))
                right_pane = draw_skeleton(sq_canvas.copy(), pred_sq, (0, 165, 255))
                split = np.hstack([left_pane, right_pane])

                cv2.putText(split, "GROUND TRUTH", (15, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 255, 0), 2, cv2.LINE_AA)
                cv2.putText(split, "VISIONFIT AI (CUSTOM ENGINE)", (415, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 165, 255), 2, cv2.LINE_AA)
                cv2.putText(split, f"Subject: {sub_name} | Frame {f_idx + 1}/{n_frames}", (15, 385), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1, cv2.LINE_AA)

                out_file = sub_dir / f"compare_{f_idx:04d}_{sub_name}.jpg"
                cv2.imwrite(str(out_file), split, [cv2.IMWRITE_JPEG_QUALITY, 90])

                f_idx += 1
                total_exported += 1

                if f_idx % 100 == 0 or f_idx == n_frames:
                    elapsed = time.time() - t0
                    print(f"     {sub_name}: {f_idx}/{n_frames} ({total_exported / max(0.1, elapsed):.1f} fps)")

        cap.release()

    print(f"\n[THÀNH CÔNG] Đã xuất lại toàn bộ {total_exported} ảnh so sánh Push-up mới!")


def main():
    t_start = time.time()
    pushup_npz = step1_auto_annotate_pushup()
    merged_npz = step2_merge_datasets(pushup_npz)
    step3_train_posenet(merged_npz, epochs=30, batch_size=64, lr=1e-3)
    step4_reexport_pushup_comparisons()
    print("=" * 70)
    print(f"[HOÀN TẤT TOÀN BỘ QUY TRÌNH] Tổng thời gian: {time.time() - t_start:.1f} giây")
    print("=" * 70)


if __name__ == "__main__":
    main()
