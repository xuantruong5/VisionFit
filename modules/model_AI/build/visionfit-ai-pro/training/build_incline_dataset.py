import sys
from pathlib import Path
_ROOT = Path(__file__).resolve().parent.parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

"""Extract frames and 33-landmark pose ground truth from Incline Press videos
using MediaPipe VIDEO Mode as an offline Teacher annotator with temporal tracking.
Augments with horizontal flipping.
Saves to data/pose_incline_press.npz and combines into data/pose_multi_exercise.npz.
"""

import sys, os
from pathlib import Path
import cv2
import numpy as np
import mediapipe as mp

ROOT = Path(__file__).resolve().parent
sys.path.append(str(ROOT))

VIDEO_PATH = ROOT / 'videos' / 'incline_press' / 'incline_press_1.mp4'
MP_TASK = ROOT / 'models' / 'mediapipe' / 'pose_landmarker_full.task'
OUT_NPZ = ROOT / 'data' / 'pose_incline_press.npz'
COMBINED_NPZ = ROOT / 'data' / 'pose_multi_exercise.npz'
SQUAT_NPZ = ROOT / 'data' / 'pose_multiview_squat.npz'

IMAGE_SIZE = 128


def letterbox(img, target_size=128):
    h, w = img.shape[:2]
    scale = min(target_size / h, target_size / w)
    nh, nw = max(1, int(round(h * scale))), max(1, int(round(w * scale)))
    resized = cv2.resize(img, (nw, nh), interpolation=cv2.INTER_AREA)
    canvas = np.zeros((target_size, target_size, 3), dtype=np.uint8)
    top = (target_size - nh) // 2
    left = (target_size - nw) // 2
    canvas[top:top+nh, left:left+nw] = resized
    return canvas, scale, top, left, nw, nh


def main():
    print(f"[Incline Dataset Builder] Processing video with VIDEO mode tracking: {VIDEO_PATH}...")
    if not VIDEO_PATH.is_file():
        raise FileNotFoundError(f"Video not found: {VIDEO_PATH}")

    cap = cv2.VideoCapture(str(VIDEO_PATH))
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    options = mp.tasks.vision.PoseLandmarkerOptions(
        base_options=mp.tasks.BaseOptions(model_asset_path=str(MP_TASK)),
        running_mode=mp.tasks.vision.RunningMode.VIDEO,
        num_poses=1,
    )

    all_images = []
    all_kps = []
    all_subjects = []

    with mp.tasks.vision.PoseLandmarker.create_from_options(options) as detector:
        for idx in range(total_frames):
            ok, frame = cap.read()
            if not ok: break

            ts = int(round(idx * 1000.0 / fps))
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            canvas, scale, top, left, nw, nh = letterbox(rgb, IMAGE_SIZE)

            # Detect on full-resolution RGB using VIDEO tracking for smooth joint continuity
            mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
            res = detector.detect_for_video(mp_img, ts)

            if res.pose_landmarks and len(res.pose_landmarks) > 0:
                lm = res.pose_landmarks[0]
                pts = np.zeros((33, 3), dtype=np.float32)
                for j in range(33):
                    p = lm[j]
                    vis = float(p.visibility) if p.visibility is not None else 1.0
                    # Map full-resolution normalized (x, y) into letterbox canvas [0, 1]
                    lx = (p.x * w * scale + left) / float(IMAGE_SIZE)
                    ly = (p.y * h * scale + top) / float(IMAGE_SIZE)
                    pts[j] = [np.clip(lx, 0.0, 1.0), np.clip(ly, 0.0, 1.0), vis]

                # Original frame
                all_images.append(canvas)
                all_kps.append(pts)
                all_subjects.append('incline_press_1')

                # Flip augmentation (horizontal)
                canvas_flip = np.ascontiguousarray(canvas[:, ::-1, :])
                pts_flip = pts.copy()
                pts_flip[:, 0] = 1.0 - pts_flip[:, 0]
                # Swap left and right body joints
                pairs = [(11, 12), (13, 14), (15, 16), (23, 24), (25, 26), (27, 28), (29, 30), (31, 32)]
                for a, b in pairs:
                    pts_flip[[a, b]] = pts_flip[[b, a]]

                all_images.append(canvas_flip)
                all_kps.append(pts_flip)
                all_subjects.append('incline_press_1_flip')

    all_images = np.array(all_images, dtype=np.uint8)
    all_kps = np.array(all_kps, dtype=np.float32)
    all_subjects = np.array(all_subjects)

    print(f"Extracted Incline Press dataset: {len(all_images)} samples")
    OUT_NPZ.parent.mkdir(parents=True, exist_ok=True)
    np.savez_compressed(OUT_NPZ, images=all_images, keypoints=all_kps, subjects=all_subjects)
    print(f"Saved -> {OUT_NPZ} ({OUT_NPZ.stat().st_size / (1024*1024):.1f} MB)")

    # Combine with Squat dataset
    if SQUAT_NPZ.is_file():
        z_squat = np.load(SQUAT_NPZ, allow_pickle=True)
        sq_images = z_squat['images']
        sq_kps = z_squat['keypoints']
        sq_subs = z_squat['subjects']

        comb_images = np.concatenate([sq_images, all_images], axis=0)
        comb_kps = np.concatenate([sq_kps, all_kps], axis=0)
        comb_subs = np.concatenate([sq_subs, all_subjects], axis=0)

        np.savez_compressed(COMBINED_NPZ, images=comb_images, keypoints=comb_kps, subjects=comb_subs)
        print(f"Created Combined Multi-Exercise Dataset -> {COMBINED_NPZ}: {len(comb_images)} total samples ({COMBINED_NPZ.stat().st_size / (1024*1024):.1f} MB)")


if __name__ == '__main__':
    main()
