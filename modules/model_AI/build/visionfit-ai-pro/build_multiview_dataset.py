"""VisionFit Multi-View Auto-Annotation Pipeline.
Uses MediaPipe as Offline Auto-Annotator to label all 8 squat videos
(Side view gym, Side view female, Front view male, Front view knee valgus).
Saves diverse dataset for training 100% independent PoseNet.
"""

import sys, os
from pathlib import Path
import cv2
import numpy as np
import mediapipe as mp

IMAGE_SIZE = 128
ROOT = Path(__file__).resolve().parent
VIDEOS_DIR = ROOT / 'videos' / 'squat'
MODEL_ASSET = ROOT / 'models' / 'mediapipe' / 'pose_landmarker_full.task'
OUT_NPZ = ROOT / 'data' / 'pose_multiview_squat.npz'

# Left / Right joint flip pairs for horizontal flip augmentation
FLIP_MAP = {
    1: 4, 2: 5, 3: 6, 4: 1, 5: 2, 6: 3,  # Eyes
    7: 8, 8: 7,                          # Ears
    9: 10, 10: 9,                        # Mouth
    11: 12, 12: 11,                      # Shoulders
    13: 14, 14: 13,                      # Elbows
    15: 16, 16: 15,                      # Wrists
    17: 18, 18: 17,                      # Pinky
    19: 20, 20: 19,                      # Index
    21: 22, 22: 21,                      # Thumb
    23: 24, 24: 23,                      # Hips
    25: 26, 26: 25,                      # Knees
    27: 28, 28: 27,                      # Ankles
    29: 30, 30: 29,                      # Heels
    31: 32, 32: 31,                      # Foot index
}

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

def main():
    print(f"[Auto-Annotator] Loading MediaPipe teacher from {MODEL_ASSET}...")
    options = mp.tasks.vision.PoseLandmarkerOptions(
        base_options=mp.tasks.BaseOptions(model_asset_path=str(MODEL_ASSET)),
        running_mode=mp.tasks.vision.RunningMode.VIDEO,
        num_poses=1,
    )

    all_images = []
    all_keypoints = []
    all_subjects = []

    videos = sorted(VIDEOS_DIR.glob('*.mp4'))
    print(f"[Auto-Annotator] Found {len(videos)} videos to process.")

    for vf in videos:
        subject_name = vf.stem
        is_front = 'suqtan' in vf.stem or 'squatsai' in vf.stem
        is_female = 'squatnuw' in vf.stem

        cap = cv2.VideoCapture(str(vf))
        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        print(f"  -> Processing {vf.name} ({total_frames} frames, front={is_front})...")

        frame_idx = 0
        extracted = 0

        with mp.tasks.vision.PoseLandmarker.create_from_options(options) as detector:
            while True:
                ret, frame = cap.read()
                if not ret:
                    break

                ts_ms = int(round(frame_idx * 1000.0 / fps))
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

                    # Standard sample
                    all_images.append(canvas_rgb)
                    all_keypoints.append(kp)
                    all_subjects.append(subject_name)
                    extracted += 1

                    # For front view & female video, also add horizontally flipped augmentation to balance dataset
                    if is_front or is_female:
                        flip_canvas = cv2.flip(canvas_rgb, 1)
                        flip_kp = np.zeros((33, 3), dtype=np.float32)
                        for i in range(33):
                            mapped_i = FLIP_MAP.get(i, i)
                            flip_kp[mapped_i, 0] = 1.0 - kp[i, 0]
                            flip_kp[mapped_i, 1] = kp[i, 1]
                            flip_kp[mapped_i, 2] = kp[i, 2]
                        all_images.append(flip_canvas)
                        all_keypoints.append(flip_kp)
                        all_subjects.append(f"{subject_name}_flip")
                        extracted += 1

                frame_idx += 1
        cap.release()
        print(f"     Extracted {extracted} annotated frames from {vf.name}")

    images_arr = np.array(all_images, dtype=np.uint8)
    kp_arr = np.array(all_keypoints, dtype=np.float32)
    sub_arr = np.array(all_subjects, dtype=object)

    OUT_NPZ.parent.mkdir(parents=True, exist_ok=True)
    np.savez_compressed(OUT_NPZ, images=images_arr, keypoints=kp_arr, subjects=sub_arr)
    print(f"\n[Success] Generated {OUT_NPZ}")
    print(f"  Total frames: {len(images_arr)}")
    print(f"  Images shape: {images_arr.shape}")
    print(f"  Keypoints shape: {kp_arr.shape}")
    print(f"  Unique subjects: {np.unique(sub_arr)}")

if __name__ == '__main__':
    main()
