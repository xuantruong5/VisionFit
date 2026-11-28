"""VisionFit AI Biomechanical Push-up Analyzer.
Complies with official standards by Coach Truong Thai Luu (Poliquin CPT).
Standards applied from thongsobaitap_VisionFit_da_dien.docx (video_4.mov):
  - Elbow Angle Bottom (Góc khuỷu tay ở đáy): 70°-90° (Chấp nhận: 65°-95°)
  - Elbow Angle Top (Góc khuỷu tay khi đẩy thẳng - Lockout): 165°-178° (Chấp nhận: >= 155°)
  - Spine / Plank Alignment (Góc thân/hông: Vai - Hông - Cổ chân): 170°-180° (Chấp nhận: 165°-185°)
  - Arm - Torso Angle (Góc cánh tay - Thân: Hông - Vai - Khuỷu): 30°-45° (Chấp nhận: 25°-60°)
  - Form Warnings & Errors:
      * Hạ ngực chưa đủ sâu (Shallow Depth): Khuỷu đáy > 95° (Chưa kích hoạt tối ưu cơ ngực)
      * Nhô mông quá cao (Pike Hips): Thân/hông < 160° (Giảm áp lực ngực, phân tán lực sang vai/cổ)
      * Võng lưng (Sagging Hips): Thân/hông > 185° (Nguy cơ áp lực cột sống thắt lưng L4-L5)
      * Đẩy chưa hết biên độ (Incomplete Lockout): Khuỷu đỉnh < 155° (Half rep)
"""

import sys
import math
from pathlib import Path
import numpy as np

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))


FULL_SKELETON_CONNECTIONS = [
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


class BiomechanicalPushUpAnalyzer:
    """Push-up form analyzer and rep counter implementing VisionFit AI standards."""

    def __init__(self, elbow_bottom_max=95.0, spine_min=165.0, spine_max=180.0):
        self.elbow_bottom_max = elbow_bottom_max
        self.spine_min = spine_min
        self.spine_max = spine_max

        # 4-Phase State Machine: READY -> DESCENDING -> BOTTOM -> ASCENDING -> READY
        self.state = "READY"
        self.completed_reps = 0
        self.good_reps = 0
        self.bad_reps = 0
        self.reps_data = []

        self.current_rep = self._new_rep(0.0)

        # Thresholds
        self.LOCKOUT_THRESHOLD = 152.0    # Soft lockout at top
        self.DESCENDING_THRESHOLD = 135.0 # Begins descent
        self.BOTTOM_THRESHOLD = 95.0      # Reaches bottom depth

        # Temporal filtering
        self.history_window = 7
        self.elbow_history = []
        self.spine_history = []
        self.arm_torso_history = []
        self.ready_frames = 0
        self.bottom_frames = 0

    def _new_rep(self, sec):
        return {
            "rep_number": 0,
            "exercise": "push_up",
            "start_time": round(sec, 2),
            "bottom_time": 0.0,
            "end_time": 0.0,
            "min_elbow_angle": 180.0,
            "max_elbow_angle": 0.0,
            "min_spine_angle": 180.0,
            "max_spine_angle": 0.0,
            "max_hip_sag": 0.0,
            "arm_torso_angle": 0.0,
            "status": "PENDING",
            "feedback": "",
            "correction_tip": "",
            "errors": [],
        }

    @staticmethod
    def calculate_angle_3pts(a, b, c):
        """Angle at joint b (a-b-c) in degrees."""
        v1 = a[:2] - b[:2]
        v2 = c[:2] - b[:2]
        norm = np.linalg.norm(v1) * np.linalg.norm(v2)
        if norm < 1e-6:
            return 180.0
        cos_th = np.clip(np.dot(v1, v2) / norm, -1.0, 1.0)
        return float(np.degrees(np.arccos(cos_th)))

    def process_frame(self, pts, sec=0.0):
        """Processes 1 frame of 33 landmarks [x, y, z, vis]."""
        # Active side determination (Left: 11, 13, 15, 23, 27 vs Right: 12, 14, 16, 24, 28)
        l_vis = pts[11, 3] + pts[13, 3] + pts[15, 3] + pts[23, 3] + pts[27, 3]
        r_vis = pts[12, 3] + pts[14, 3] + pts[16, 3] + pts[24, 3] + pts[28, 3]
        side = "left" if l_vis >= r_vis else "right"

        s_idx = 11 if side == "left" else 12
        e_idx = 13 if side == "left" else 14
        w_idx = 15 if side == "left" else 16
        h_idx = 23 if side == "left" else 24
        a_idx = 27 if side == "left" else 28

        shoulder = pts[s_idx]
        elbow = pts[e_idx]
        wrist = pts[w_idx]
        hip = pts[h_idx]
        ankle = pts[a_idx]

        # 1. Elbow angle (Shoulder - Elbow - Wrist)
        raw_elbow = self.calculate_angle_3pts(shoulder, elbow, wrist)
        self.elbow_history.append(raw_elbow)
        if len(self.elbow_history) > self.history_window:
            self.elbow_history.pop(0)
        elbow_angle = float(np.median(self.elbow_history))

        # 2. Spine / Plank angle (Shoulder - Hip - Ankle)
        raw_spine = self.calculate_angle_3pts(shoulder, hip, ankle)
        self.spine_history.append(raw_spine)
        if len(self.spine_history) > self.history_window:
            self.spine_history.pop(0)
        spine_angle = float(np.median(self.spine_history))

        # Check vertical deflection of hip from straight shoulder-ankle line (Sagging / Pike)
        dx_sa = ankle[0] - shoulder[0]
        if abs(dx_sa) > 1e-4:
            t = (hip[0] - shoulder[0]) / dx_sa
            expected_hip_y = shoulder[1] + t * (ankle[1] - shoulder[1])
            body_len = np.linalg.norm(shoulder[:2] - ankle[:2]) + 1e-7
            norm_hip_sag = float((hip[1] - expected_hip_y) / body_len)
        else:
            norm_hip_sag = 0.0

        # 3. Arm-Torso angle (Hip - Shoulder - Elbow)
        raw_arm_torso = self.calculate_angle_3pts(hip, shoulder, elbow)
        self.arm_torso_history.append(raw_arm_torso)
        if len(self.arm_torso_history) > self.history_window:
            self.arm_torso_history.pop(0)
        arm_torso_angle = float(np.median(self.arm_torso_history))

        feedback_event = None

        # Readiness tracking
        if elbow_angle >= self.LOCKOUT_THRESHOLD:
            self.ready_frames += 1

        # State Machine Transitions
        if self.state == "READY":
            if self.ready_frames >= 4 and elbow_angle < self.DESCENDING_THRESHOLD:
                self.state = "DESCENDING"
                self.bottom_frames = 0
                self.current_rep = self._new_rep(sec)
                self.current_rep["rep_number"] = self.completed_reps + 1
                self.current_rep["min_elbow_angle"] = elbow_angle
                self.current_rep["max_elbow_angle"] = elbow_angle
                self.current_rep["min_spine_angle"] = spine_angle
                self.current_rep["max_spine_angle"] = spine_angle
                self.current_rep["max_hip_sag"] = max(0.0, norm_hip_sag)
                self.current_rep["arm_torso_angle"] = arm_torso_angle

        elif self.state == "DESCENDING":
            if elbow_angle < self.current_rep["min_elbow_angle"]:
                self.current_rep["min_elbow_angle"] = elbow_angle
            if spine_angle < self.current_rep["min_spine_angle"]:
                self.current_rep["min_spine_angle"] = spine_angle
            if spine_angle > self.current_rep["max_spine_angle"]:
                self.current_rep["max_spine_angle"] = spine_angle
            if norm_hip_sag > self.current_rep.get("max_hip_sag", 0.0):
                self.current_rep["max_hip_sag"] = norm_hip_sag

            if elbow_angle <= self.BOTTOM_THRESHOLD:
                self.bottom_frames += 1
                if self.bottom_frames >= 2:
                    self.state = "BOTTOM"
                    self.current_rep["bottom_time"] = round(sec, 2)
            else:
                self.bottom_frames = 0

            if elbow_angle > self.DESCENDING_THRESHOLD + 15.0:
                # Aborted rep
                self.state = "READY"
                self.bottom_frames = 0

        elif self.state == "BOTTOM":
            if elbow_angle < self.current_rep["min_elbow_angle"]:
                self.current_rep["min_elbow_angle"] = elbow_angle
            if spine_angle < self.current_rep["min_spine_angle"]:
                self.current_rep["min_spine_angle"] = spine_angle
            if spine_angle > self.current_rep["max_spine_angle"]:
                self.current_rep["max_spine_angle"] = spine_angle
            if norm_hip_sag > self.current_rep.get("max_hip_sag", 0.0):
                self.current_rep["max_hip_sag"] = norm_hip_sag

            if elbow_angle > self.BOTTOM_THRESHOLD + 12.0:
                self.state = "ASCENDING"

        elif self.state == "ASCENDING":
            if elbow_angle > self.current_rep["max_elbow_angle"]:
                self.current_rep["max_elbow_angle"] = elbow_angle
            if spine_angle < self.current_rep["min_spine_angle"]:
                self.current_rep["min_spine_angle"] = spine_angle
            if spine_angle > self.current_rep["max_spine_angle"]:
                self.current_rep["max_spine_angle"] = spine_angle
            if norm_hip_sag > self.current_rep.get("max_hip_sag", 0.0):
                self.current_rep["max_hip_sag"] = norm_hip_sag

            if elbow_angle >= self.LOCKOUT_THRESHOLD:
                duration = round(sec - self.current_rep["start_time"], 2)
                self.state = "READY"
                self.ready_frames = 4
                self.bottom_frames = 0

                if duration >= 0.5:
                    self.completed_reps += 1
                    self.current_rep["end_time"] = round(sec, 2)
                    self.current_rep["rep_number"] = self.completed_reps

                    min_e = self.current_rep["min_elbow_angle"]
                    max_e = self.current_rep["max_elbow_angle"]
                    min_s = self.current_rep["min_spine_angle"]
                    max_s = self.current_rep["max_spine_angle"]

                    errors = []
                    tips = []

                    # 1. Depth check
                    if min_e > self.elbow_bottom_max:
                        errors.append(f"Hạ ngực chưa đủ sâu ({min_e:.1f}° > {self.elbow_bottom_max:.0f}°)")
                        tips.append("Hạ ngực xuống sâu hơn, ngực cách sàn 3-5cm để kích hoạt tối đa cơ ngực")

                    # 2. Spine / Pike / Sagging check (PT Trương Thái Lưu standards: straight plank 165°-180°)
                    max_sag = self.current_rep.get("max_hip_sag", 0.0)
                    if min_s < self.spine_min:
                        if max_sag > 0.020:
                            errors.append(f"Võng lưng / Xệ mông ({min_s:.1f}° < {self.spine_min:.0f}°: Thân người lỏng lẽo)")
                            tips.append("Siết chặt cơ mông và gồng chặt cơ bụng (core), giữ thân mình thẳng tắp chuẩn plank, tránh để võng thắt lưng!")
                        else:
                            errors.append(f"Nhô mông quá cao ({min_s:.1f}° < {self.spine_min:.0f}°: Lỗi Pike Hips)")
                            tips.append("Hạ hông xuống thẳng hàng với vai và gót chân, siết core để tạo thành mặt phẳng nghiêng chuẩn plank!")
                    elif max_sag > 0.038:
                        errors.append(f"Võng lưng / Lỏng core ({min_s:.1f}°: Thân người không khóa thẳng)")
                        tips.append("Gồng chặt cơ bụng và siết cơ mông để tránh võng thắt lưng gây áp lực cột sống!")

                    # 3. Lockout check
                    if max_e < 150.0:
                        errors.append(f"Đẩy chưa hết biên độ ({max_e:.1f}° < 150°: Half rep)")
                        tips.append("Đẩy thẳng tay ở đỉnh động tác (soft lockout) để hoàn thành trọn vẹn 1 rep")

                    if len(errors) == 0:
                        self.good_reps += 1
                        self.current_rep["status"] = "GOOD_FORM"
                        self.current_rep["feedback"] = f"Chuẩn form PT Trương Thái Lưu (Khuỷu đáy {min_e:.0f}°, Thân plank {min_s:.0f}°)"
                        self.current_rep["correction_tip"] = "Duy trì nhịp thở đều: hít vào khi hạ, thở ra dứt khoát khi đẩy lên."
                        feedback_event = {
                            "text": f"REP {self.completed_reps}: FORM CHUẨN (Khuỷu {min_e:.0f}°)",
                            "color": (0, 255, 0),
                        }
                    else:
                        self.bad_reps += 1
                        self.current_rep["status"] = "BAD_FORM"
                        self.current_rep["feedback"] = " | ".join(errors)
                        self.current_rep["correction_tip"] = " ".join(tips)
                        feedback_event = {
                            "text": f"REP {self.completed_reps}: " + errors[0],
                            "color": (0, 0, 255),
                        }

                    self.current_rep["errors"] = errors
                    self.reps_data.append(dict(self.current_rep))

        return {
            "state": self.state,
            "elbow_angle": round(elbow_angle, 1),
            "spine_angle": round(spine_angle, 1),
            "arm_torso_angle": round(arm_torso_angle, 1),
            "completed_reps": self.completed_reps,
            "good_reps": self.good_reps,
            "bad_reps": self.bad_reps,
            "feedback_event": feedback_event,
            "active_side": side,
        }

    def finalize(self, sec=0.0):
        """Flushes rep in progress when video ends."""
        if self.state in ["ASCENDING", "BOTTOM"] and self.current_rep.get("min_elbow_angle", 180.0) <= 95.0:
            duration = round(sec - self.current_rep["start_time"], 2)
            if duration >= 0.5 and self.current_rep.get("max_elbow_angle", 0.0) >= 120.0:
                self.completed_reps += 1
                self.current_rep["end_time"] = round(sec, 2)
                self.current_rep["rep_number"] = self.completed_reps
                min_e = self.current_rep["min_elbow_angle"]
                max_e = self.current_rep["max_elbow_angle"]
                min_s = self.current_rep["min_spine_angle"]
                max_s = self.current_rep["max_spine_angle"]

                errors = []
                tips = []
                if min_e > self.elbow_bottom_max:
                    errors.append(f"Hạ ngực chưa đủ sâu ({min_e:.1f}° > {self.elbow_bottom_max:.0f}°)")
                    tips.append("Hạ ngực sâu hơn để kích hoạt cơ ngực.")
                max_sag = self.current_rep.get("max_hip_sag", 0.0)
                if min_s < self.spine_min:
                    if max_sag > 0.020:
                        errors.append(f"Võng lưng / Xệ mông ({min_s:.1f}° < {self.spine_min:.0f}°: Thân người lỏng lẽo)")
                        tips.append("Siết chặt cơ mông và gồng cơ bụng (core), giữ thân mình thẳng tắp chuẩn plank, tránh để võng thắt lưng!")
                    else:
                        errors.append(f"Nhô mông quá cao ({min_s:.1f}° < {self.spine_min:.0f}°: Lỗi Pike Hips)")
                        tips.append("Hạ mông xuống thẳng hàng với vai và gót chân, siết core để giữ trục thẳng.")
                elif max_sag > 0.038:
                    errors.append(f"Võng lưng / Lỏng core ({min_s:.1f}°: Thân người không khóa thẳng)")
                    tips.append("Gồng chặt bụng tránh võng thắt lưng.")

                if max_e < 150.0:
                    errors.append(f"Đẩy chưa hết biên độ ({max_e:.1f}° < 150°: Half rep)")
                    tips.append("Đẩy thẳng tay ở đỉnh động tác (soft lockout) để hoàn thành trọn vẹn 1 rep")

                if len(errors) == 0:
                    self.good_reps += 1
                    self.current_rep["status"] = "GOOD_FORM"
                    self.current_rep["feedback"] = f"Chuẩn form PT Trương Thái Lưu (Khuỷu đáy {min_e:.0f}°, Thân plank {min_s:.0f}°)"
                    self.current_rep["correction_tip"] = "Duy trì nhịp độ ổn định."
                else:
                    self.bad_reps += 1
                    self.current_rep["status"] = "BAD_FORM"
                    self.current_rep["feedback"] = " | ".join(errors)
                    self.current_rep["correction_tip"] = " ".join(tips)

                self.current_rep["errors"] = errors
                self.reps_data.append(dict(self.current_rep))
                self.state = "READY"


def analyze_push_up_video(video_path, out_video_path=None, report_path=None, engine="mediapipe", model_asset_path=None):
    """Analyzes a Push-up video using VisionFit AI.
    engine: 'posenet' (100% self-trained PyTorch BodyPoseNet) or 'mediapipe'
    Outputs full 33-landmark skeleton HUD and returns detailed JSON report.
    """
    import cv2
    import json

    video_path = Path(video_path)
    if not video_path.is_file():
        # Check standard locations
        base_dir = ROOT_DIR
        for cand in [
            base_dir / "videos" / "push_up" / video_path.name,
            base_dir / "videos" / "push_up" / "dung" / video_path.name,
            base_dir / "videos" / "push_up" / "sai" / video_path.name,
            base_dir / "videos" / video_path.name,
            base_dir / video_path,
        ]:
            if cand.is_file():
                video_path = cand
                break

    if not video_path.is_file():
        raise FileNotFoundError(f"Push-up video not found: {video_path}")

    if out_video_path is None:
        out_video_path = ROOT_DIR / "reports" / "push_up" / f"{video_path.stem}_annotated.mp4"
    if report_path is None:
        report_path = ROOT_DIR / "reports" / "push_up" / f"{video_path.stem}_report.json"

    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise IOError(f"Cannot open video: {video_path}")

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

    analyzer = BiomechanicalPushUpAnalyzer()
    feedback_display = {"text": "", "color": (0, 255, 0), "timer": 0}

    # Setup inference engine
    posenet_model = None
    mp_detector = None

    if engine == "posenet":
        from core.pose_model import load_pose_model, infer_rgb, IMAGE_SIZE
        custom_model_path = ROOT_DIR / "models" / "pose_custom.pt"
        if not custom_model_path.is_file():
            raise FileNotFoundError(f"PoseNet model not found: {custom_model_path}")
        posenet_model = load_pose_model(str(custom_model_path), device="cpu")
    else:
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
    try:
        while True:
            ok, frame = cap.read()
            if not ok:
                break

            sec = frame_idx / fps
            ts = int(round(frame_idx * 1000.0 / fps))
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

            pts = None
            if engine == "posenet":
                from core.pose_model import infer_rgb, IMAGE_SIZE
                scale = min(IMAGE_SIZE / h, IMAGE_SIZE / w)
                nh, nw = max(1, int(h * scale)), max(1, int(w * scale))
                resized = cv2.resize(rgb, (nw, nh), interpolation=cv2.INTER_AREA)
                canvas = np.zeros((IMAGE_SIZE, IMAGE_SIZE, 3), dtype=np.uint8)
                top = (IMAGE_SIZE - nh) // 2
                left = (IMAGE_SIZE - nw) // 2
                canvas[top:top+nh, left:left+nw] = resized

                raw_pts = infer_rgb(posenet_model, canvas, device="cpu")
                pts = np.zeros((33, 4), dtype=np.float32)
                for i in range(33):
                    lx = (raw_pts[i, 0] * IMAGE_SIZE - left) / nw
                    ly = (raw_pts[i, 1] * IMAGE_SIZE - top) / nh
                    pts[i] = [lx * w, ly * h, raw_pts[i, 2], raw_pts[i, 3]]
            else:
                import mediapipe as mp
                mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
                res = mp_detector.detect_for_video(mp_img, ts)
                if res.pose_landmarks and len(res.pose_landmarks) > 0:
                    lm = res.pose_landmarks[0]
                    pts = np.zeros((33, 4), dtype=np.float32)
                    for i in range(33):
                        p = lm[i]
                        vis = float(p.visibility) if p.visibility is not None else 1.0
                        pts[i] = [p.x * w, p.y * h, p.z * w if hasattr(p, 'z') and p.z is not None else 0.0, vis]

            if pts is not None:
                step = analyzer.process_frame(pts, sec=sec)
                cur_elbow = step["elbow_angle"]
                cur_spine = step["spine_angle"]

                if step["feedback_event"]:
                    feedback_display = {
                        "text": step["feedback_event"]["text"],
                        "color": step["feedback_event"]["color"],
                        "timer": int(fps * 2.0),
                    }

                if writer:
                    def to_px(idx):
                        return int(round(pts[idx, 0])), int(round(pts[idx, 1]))

                    # 1. Full Skeleton Connections (subtle cyan)
                    for a, b in FULL_SKELETON_CONNECTIONS:
                        if pts[a, 3] >= 0.4 and pts[b, 3] >= 0.4:
                            cv2.line(frame, to_px(a), to_px(b), (0, 220, 255), 2, cv2.LINE_AA)

                    # 2. Highlight Biomechanical Joint Chains
                    side = step["active_side"]
                    s_idx = 11 if side == "left" else 12
                    e_idx = 13 if side == "left" else 14
                    w_idx = 15 if side == "left" else 16
                    h_idx = 23 if side == "left" else 24
                    a_idx = 27 if side == "left" else 28

                    # Arm Chain (Vai -> Khuỷu -> Cổ tay)
                    elbow_col = (0, 255, 0) if cur_elbow <= 95.0 else (0, 165, 255)
                    cv2.line(frame, to_px(s_idx), to_px(e_idx), elbow_col, 4, cv2.LINE_AA)
                    cv2.line(frame, to_px(e_idx), to_px(w_idx), elbow_col, 4, cv2.LINE_AA)

                    # Spine / Plank Chain (Vai -> Hông -> Cổ chân)
                    spine_col = (0, 255, 0) if (165.0 <= cur_spine <= 185.0) else (0, 0, 255)
                    cv2.line(frame, to_px(s_idx), to_px(h_idx), spine_col, 4, cv2.LINE_AA)
                    cv2.line(frame, to_px(h_idx), to_px(a_idx), spine_col, 4, cv2.LINE_AA)

                    # Draw key joint points
                    for j_idx in [s_idx, e_idx, w_idx, h_idx, a_idx]:
                        cv2.circle(frame, to_px(j_idx), 6, (255, 255, 255), -1, cv2.LINE_AA)
                        cv2.circle(frame, to_px(j_idx), 7, (0, 200, 255), 2, cv2.LINE_AA)

                    # 3. Angle Callouts at Joint
                    e_pt = to_px(e_idx)
                    cv2.putText(frame, f"Khuya: {cur_elbow:.0f} deg", (e_pt[0] - 40, e_pt[1] - 15),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.55, elbow_col, 2, cv2.LINE_AA)

                    h_pt = to_px(h_idx)
                    cv2.putText(frame, f"Than: {cur_spine:.0f} deg", (h_pt[0] - 40, h_pt[1] - 15),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.55, spine_col, 2, cv2.LINE_AA)

                    # 4. Professional HUD Top Bar & Cards
                    overlay = frame.copy()
                    cv2.rectangle(overlay, (15, 15), (420, 195), (15, 23, 42), -1)
                    cv2.addWeighted(overlay, 0.75, frame, 0.25, 0, frame)
                    cv2.rectangle(frame, (15, 15), (420, 195), (56, 189, 248), 2)

                    # Header
                    cv2.putText(frame, "VISIONFIT AI -- HIT DAT (PUSH-UP)", (30, 42),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.65, (56, 189, 248), 2, cv2.LINE_AA)
                    cv2.putText(frame, f"Tieu chuan PT Truong Thai Luu (video_4.mov)", (30, 62),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.45, (148, 163, 184), 1, cv2.LINE_AA)

                    # Reps & Phase
                    phase_str = f"PHASE: {step['state']}"
                    cv2.putText(frame, phase_str, (30, 95),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2, cv2.LINE_AA)
                    cv2.putText(frame, f"REPS: {step['completed_reps']}  (Chuan: {step['good_reps']} | Loi: {step['bad_reps']})", (30, 125),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (16, 185, 129), 2, cv2.LINE_AA)

                    # Angles row
                    cv2.putText(frame, f"Khuyu: {cur_elbow:.1f} deg  |  Plank Than: {cur_spine:.1f} deg", (30, 155),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.52, (226, 232, 240), 1, cv2.LINE_AA)

                    # Engine badge
                    cv2.putText(frame, f"Engine: {engine.upper()} (33 landmarks)", (30, 180),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.45, (148, 163, 184), 1, cv2.LINE_AA)

                    # 5. Bottom Feedback Banner
                    if feedback_display["timer"] > 0:
                        fb_overlay = frame.copy()
                        cv2.rectangle(fb_overlay, (15, h - 65), (w - 15, h - 15), (15, 23, 42), -1)
                        cv2.addWeighted(fb_overlay, 0.85, frame, 0.15, 0, frame)
                        border_col = feedback_display["color"]
                        cv2.rectangle(frame, (15, h - 65), (w - 15, h - 15), border_col, 2)
                        cv2.putText(frame, feedback_display["text"], (35, h - 32),
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, border_col, 2, cv2.LINE_AA)
                        feedback_display["timer"] -= 1

            if writer:
                writer.write(frame)

            frame_idx += 1

    finally:
        cap.release()
        if writer:
            writer.release()

    analyzer.finalize(frame_idx / fps)

    # Compute aggregate stats
    tot = analyzer.completed_reps
    good = analyzer.good_reps
    bad = analyzer.bad_reps
    score_pct = int(round((good / tot) * 100)) if tot > 0 else 0

    report = {
        "status": "ok",
        "exercise": "push_up",
        "video": video_path.name,
        "video_duration_sec": round(frame_idx / fps, 2),
        "total_frames": frame_idx,
        "total_reps_counted": tot,
        "good_reps_count": good,
        "bad_reps_count": bad,
        "form_score_pct": score_pct,
        "evaluation": "Form rất tốt" if score_pct >= 80 else ("Cần cải thiện" if score_pct >= 50 else "Form chưa chuẩn"),
        "reps_detail": analyzer.reps_data,
        "standards": {
            "elbow_bottom_ideal": "70°-90°",
            "elbow_bottom_acceptable": "65°-95°",
            "elbow_top_lockout": "165°-178° (>=155°)",
            "spine_plank_ideal": "170°-180°",
            "spine_plank_acceptable": "165°-185°",
            "arm_torso_ideal": "30°-45°",
            "source": "HLV Trương Thái Lưu (NSCA / NASM-CPT / Poliquin Principles / video_4.mov)",
        }
    }

    if report_path:
        report_path = Path(report_path)
        report_path.parent.mkdir(parents=True, exist_ok=True)
        with open(report_path, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2, ensure_ascii=False)

    return report


if __name__ == "__main__":
    import sys
    vpath = sys.argv[1] if len(sys.argv) > 1 else "videos/push_up/dung/push_up_dung_chuan.mp4"
    rep = analyze_push_up_video(vpath)
    print(f"Push-up Analysis complete for {vpath}:")
    print(f"Total Reps: {rep['total_reps_counted']} (Good: {rep['good_reps_count']} | Bad: {rep['bad_reps_count']})")
    for r in rep["reps_detail"]:
        print(f"  Rep {r['rep_number']}: {r['status']} | {r['feedback']}")
