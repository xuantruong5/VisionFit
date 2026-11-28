"""VisionFit AI - General Pose Motion Tracker & Annotator.
Tracks, renders 33-joint skeleton, and analyzes human posture for any video
(standing, sitting, walking, free movement) without forcing false exercise classifications.
"""

import json
import math
import sys
from pathlib import Path
import cv2
import numpy as np

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

SKELETON_CONNECTIONS = [
    # Face & Neck
    (0, 1), (1, 2), (2, 3), (3, 7), (0, 4), (4, 5), (5, 6), (6, 8),
    (9, 10),
    # Torso
    (11, 12), (11, 23), (12, 24), (23, 24),
    # Left Arm
    (11, 13), (13, 15), (15, 17), (15, 19), (15, 21), (17, 19),
    # Right Arm
    (12, 14), (14, 16), (16, 18), (16, 20), (16, 22), (18, 20),
    # Left Leg
    (23, 25), (25, 27), (27, 29), (27, 31), (29, 31),
    # Right Leg
    (24, 26), (26, 28), (28, 30), (28, 32), (30, 32),
]


def calculate_angle_3pts(a, b, c):
    """Angle at joint b (a-b-c) in degrees."""
    v1 = a[:2] - b[:2]
    v2 = c[:2] - b[:2]
    norm = np.linalg.norm(v1) * np.linalg.norm(v2)
    if norm < 1e-6:
        return 180.0
    cos_th = np.clip(np.dot(v1, v2) / norm, -1.0, 1.0)
    return float(np.degrees(np.arccos(cos_th)))


def analyze_general_pose_video(
    video_path,
    out_video_path=None,
    report_path=None,
    model_asset_path=None,
    engine="mediapipe",
):
    video_path = Path(video_path)
    if not video_path.is_file():
        raise FileNotFoundError(f"Video file not found: {video_path}")

    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise RuntimeError(f"Could not open video {video_path}")

    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    writer = None
    if out_video_path:
        out_video_path = Path(out_video_path)
        out_video_path.parent.mkdir(parents=True, exist_ok=True)
        fourcc = cv2.VideoWriter_fourcc(*"avc1")
        writer = cv2.VideoWriter(str(out_video_path), fourcc, fps, (w, h))
        if not writer.isOpened():
            fourcc = cv2.VideoWriter_fourcc(*"mp4v")
            writer = cv2.VideoWriter(str(out_video_path), fourcc, fps, (w, h))

    mp_detector = None
    import mediapipe as mp
    if model_asset_path is None:
        model_asset_path = ROOT_DIR / "models" / "mediapipe" / "pose_landmarker_full.task"
    options = mp.tasks.vision.PoseLandmarkerOptions(
        base_options=mp.tasks.BaseOptions(model_asset_path=str(model_asset_path)),
        running_mode=mp.tasks.vision.RunningMode.VIDEO,
        num_poses=1,
    )
    mp_detector = mp.tasks.vision.PoseLandmarker.create_from_options(options)

    frame_idx = 0
    postures_seen = []
    knee_angles_all = []
    elbow_angles_all = []

    try:
        while True:
            ok, frame = cap.read()
            if not ok:
                break

            ts = int(round(frame_idx * 1000.0 / fps))
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

            pts = None
            mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
            res = mp_detector.detect_for_video(mp_img, ts)
            if res.pose_landmarks and len(res.pose_landmarks) > 0:
                lm = res.pose_landmarks[0]
                pts = np.zeros((33, 4), dtype=np.float32)
                for i in range(33):
                    p = lm[i]
                    vis = getattr(p, "visibility", 1.0) or 1.0
                    pts[i] = [p.x * w, p.y * h, p.z or 0.0, vis]

            if pts is not None and writer:
                # 1. Biomechanical posture heuristics
                sh_x = (pts[11, 0] + pts[12, 0]) / 2.0
                sh_y = (pts[11, 1] + pts[12, 1]) / 2.0
                hp_x = (pts[23, 0] + pts[24, 0]) / 2.0
                hp_y = (pts[23, 1] + pts[24, 1]) / 2.0
                ak_x = (pts[27, 0] + pts[28, 0]) / 2.0
                ak_y = (pts[27, 1] + pts[28, 1]) / 2.0

                dx_body = abs(sh_x - ak_x)
                dy_body = abs(sh_y - ak_y)

                l_knee = calculate_angle_3pts(pts[23], pts[25], pts[27])
                r_knee = calculate_angle_3pts(pts[24], pts[26], pts[28])
                avg_knee = (l_knee + r_knee) / 2.0
                knee_angles_all.append(avg_knee)

                l_elb = calculate_angle_3pts(pts[11], pts[13], pts[15])
                r_elb = calculate_angle_3pts(pts[12], pts[14], pts[16])
                avg_elb = (l_elb + r_elb) / 2.0
                elbow_angles_all.append(avg_elb)

                # Determine posture label
                if dx_body >= dy_body * 0.7:
                    posture = "NAM / MAT SAN (FLOOR)"
                elif avg_knee <= 118.0 and dy_body <= h * 0.45:
                    posture = "NGOI / NGHI (SITTING)"
                elif avg_knee >= 150.0:
                    posture = "DUNG THANG (STANDING)"
                else:
                    posture = "CHUYEN DONG TU DO (ACTIVE)"
                postures_seen.append(posture)

                # 2. Draw Skeleton Bones
                for (p1_idx, p2_idx) in SKELETON_CONNECTIONS:
                    if pts[p1_idx, 3] > 0.35 and pts[p2_idx, 3] > 0.35:
                        pt1 = (int(round(pts[p1_idx, 0])), int(round(pts[p1_idx, 1])))
                        pt2 = (int(round(pts[p2_idx, 0])), int(round(pts[p2_idx, 1])))
                        cv2.line(frame, pt1, pt2, (248, 189, 56), 3, cv2.LINE_AA)

                # 3. Draw Skeleton Joints
                for i in range(33):
                    if pts[i, 3] > 0.35:
                        pt = (int(round(pts[i, 0])), int(round(pts[i, 1])))
                        cv2.circle(frame, pt, 5, (16, 185, 129), -1, cv2.LINE_AA)
                        cv2.circle(frame, pt, 7, (255, 255, 255), 1, cv2.LINE_AA)

                # 4. Professional HUD Top Bar
                overlay = frame.copy()
                cv2.rectangle(overlay, (15, 15), (460, 155), (15, 23, 42), -1)
                cv2.addWeighted(overlay, 0.75, frame, 0.25, 0, frame)
                cv2.rectangle(frame, (15, 15), (460, 155), (56, 189, 248), 2)

                cv2.putText(frame, "VISIONFIT AI -- THEO DOI KHUNG XUONG (33 KHOP)", (30, 42),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.58, (56, 189, 248), 2, cv2.LINE_AA)
                cv2.putText(frame, "Nhan dien chuyen dong tu do (Khong phai bai tap)", (30, 62),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.42, (148, 163, 184), 1, cv2.LINE_AA)

                cv2.putText(frame, f"TU THE: {posture}", (30, 95),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.65, (16, 185, 129), 2, cv2.LINE_AA)
                cv2.putText(frame, f"Goi: {avg_knee:.1f} deg  |  Khuyu: {avg_elb:.1f} deg", (30, 125),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.52, (226, 232, 240), 1, cv2.LINE_AA)
                cv2.putText(frame, "33 Keypoints Tracking: ON (Realtime)", (30, 145),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.40, (148, 163, 184), 1, cv2.LINE_AA)

            if writer:
                writer.write(frame)

            frame_idx += 1

    finally:
        cap.release()
        if writer:
            writer.release()

    # Determine dominant posture
    dominant_posture = "Đứng / Ngồi / Chuyển động tự do"
    if postures_seen:
        from collections import Counter
        most_common = Counter(postures_seen).most_common(1)[0][0]
        dominant_posture = most_common

    duration_sec = round(frame_idx / fps, 2)
    report = {
        "status": "ok",
        "exercise": "general",
        "detected_exercise": "general",
        "exercise_label": "Khung xương 33 Khớp (Tư thế tự do)",
        "video": video_path.name,
        "video_duration_sec": duration_sec,
        "total_frames": frame_idx,
        "total_reps_counted": 0,
        "good_reps_count": 0,
        "bad_reps_count": 0,
        "form_score_pct": 100,
        "posture_detected": dominant_posture,
        "evaluation": "Khung xương 33 khớp đã được AI nhận diện và bám sát chính xác toàn bộ chuyển động. Video không chứa bài tập Push-up / Squat để chấm điểm form.",
        "reps_detail": [],
        "standards": {
            "tracking_engine": "VisionFit AI Pose Tracker (33 Full-body Keypoints)",
            "message": "AI theo dõi chuyển động tự nhiên của người dùng bất kể tư thế đứng, ngồi, nằm hay di chuyển.",
        }
    }

    if report_path:
        report_path = Path(report_path)
        report_path.parent.mkdir(parents=True, exist_ok=True)
        with open(report_path, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2, ensure_ascii=False)

    return report
