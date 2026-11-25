"""VisionFit Biomechanical Incline Dumbbell Press Analyzer.
Complies with official standards by Coach Truong Thai Luu (Poliquin CPT).
Standards applied from thongsobaitap_VisionFit_da_dien.docx:
  - Elbow Angle Top (Lockout): 160°-175° (Acceptable: 145°-175°)
  - Elbow Angle Bottom: 75°-95° (Acceptable: 70°-100°)
  - Bench Incline Angle: 15°-30° (Acceptable: 15°-45°)
  - Shoulder Abduction: 45°-60° (Acceptable: 35°-65°)
  - Form Warnings:
      * Over-extension / Deep descent: Elbow bottom < 70° (Risk of shoulder impingement)
      * Shallow descent: Elbow bottom > 100° (Insufficient upper chest activation)
      * Incomplete lockout: Elbow top < 145° (Half rep)
      * Excessive bench incline: Bench angle > 45°
"""

import numpy as np


class BiomechanicalInclinePressAnalyzer:
    def __init__(self):
        # 4-Phase State Machine: READY -> LOWERING -> BOTTOM -> PRESSING -> READY
        self.state = "READY"
        self.completed_reps = 0
        self.reps_data = []

        self.current_rep = {
            "start_time": 0.0,
            "bottom_time": 0.0,
            "end_time": 0.0,
            "min_elbow_angle": 180.0,
            "max_elbow_angle": 0.0,
            "bench_incline_angle": 0.0,
            "shoulder_angle": 0.0,
            "status": "PENDING",
            "feedback": "",
            "errors": [],
        }

        # Angle thresholds
        self.LOCKOUT_THRESHOLD = 142.0   # Rep finishes when elbow extends above this
        self.LOWERING_THRESHOLD = 120.0  # Rep starts when elbow drops below this
        self.BOTTOM_THRESHOLD = 95.0     # Reaches bottom phase

        # Filtering & Temporal Debounce
        self.history_window = 9
        self.elbow_history = []
        self.bench_history = []
        self.ready_frames = 0
        self.bottom_frames = 0

    @staticmethod
    def calculate_angle_3pts(a, b, c):
        """Angle at joint b (a-b-c) in degrees."""
        v1 = a[:2] - b[:2]
        v2 = c[:2] - b[:2]
        cos_th = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2) + 1e-6)
        return float(np.degrees(np.arccos(np.clip(cos_th, -1.0, 1.0))))

    def process_frame(self, pts, sec=0.0):
        """Processes 1 frame of 33 landmarks (x, y, z, vis).
        Returns dict with current biomechanical angles and feedback.
        """
        # Select active side (Left side 11, 13, 15, 23 vs Right side 12, 14, 16, 24)
        l_vis = pts[11, 3] + pts[13, 3] + pts[15, 3] + pts[23, 3]
        r_vis = pts[12, 3] + pts[14, 3] + pts[16, 3] + pts[24, 3]
        side = "left" if l_vis >= r_vis else "right"

        s_idx = 11 if side == "left" else 12
        e_idx = 13 if side == "left" else 14
        w_idx = 15 if side == "left" else 16
        h_idx = 23 if side == "left" else 24

        shoulder = pts[s_idx]
        elbow = pts[e_idx]
        wrist = pts[w_idx]
        hip = pts[h_idx]

        # 1. Elbow angle (Shoulder - Elbow - Wrist) with moving median window
        raw_elbow = self.calculate_angle_3pts(shoulder, elbow, wrist)
        self.elbow_history.append(raw_elbow)
        if len(self.elbow_history) > self.history_window:
            self.elbow_history.pop(0)
        elbow_angle = float(np.median(self.elbow_history))

        # 2. Bench incline angle (Hip -> Shoulder vector relative to horizontal)
        dx = abs(shoulder[0] - hip[0])
        dy = hip[1] - shoulder[1]  # positive when shoulder is above hip
        bench_incline = float(np.degrees(np.arctan2(dy, dx + 1e-6)))
        self.bench_history.append(bench_incline)
        if len(self.bench_history) > self.history_window:
            self.bench_history.pop(0)
        bench_incline = float(np.median(self.bench_history))

        # 3. Shoulder angle (Hip - Shoulder - Elbow)
        shoulder_angle = self.calculate_angle_3pts(hip, shoulder, elbow)

        feedback_event = None

        # Readiness tracking (ensure athlete is at starting lockout before triggering rep)
        if elbow_angle >= self.LOCKOUT_THRESHOLD:
            self.ready_frames += 1

        # State Machine Transitions
        if self.state == "READY":
            if self.ready_frames >= 5 and elbow_angle < self.LOWERING_THRESHOLD:
                self.state = "LOWERING"
                self.bottom_frames = 0
                self.current_rep = {
                    "rep_number": self.completed_reps + 1,
                    "start_time": round(sec, 2),
                    "min_elbow_angle": elbow_angle,
                    "max_elbow_angle": elbow_angle,
                    "bench_incline_angle": bench_incline,
                    "shoulder_angle": shoulder_angle,
                    "errors": [],
                    "status": "IN_PROGRESS",
                    "feedback": "",
                }

        elif self.state == "LOWERING":
            if elbow_angle < self.current_rep["min_elbow_angle"]:
                self.current_rep["min_elbow_angle"] = elbow_angle

            if elbow_angle <= self.BOTTOM_THRESHOLD:
                self.bottom_frames += 1
                if self.bottom_frames >= 3:
                    self.state = "BOTTOM"
                    self.current_rep["bottom_time"] = round(sec, 2)
            else:
                self.bottom_frames = 0

            if elbow_angle > self.LOWERING_THRESHOLD + 15.0:
                # Aborted rep
                self.state = "READY"
                self.bottom_frames = 0

        elif self.state == "BOTTOM":
            if elbow_angle < self.current_rep["min_elbow_angle"]:
                self.current_rep["min_elbow_angle"] = elbow_angle

            if elbow_angle > self.BOTTOM_THRESHOLD + 12.0:
                self.state = "PRESSING"

        elif self.state == "PRESSING":
            if elbow_angle > self.current_rep["max_elbow_angle"]:
                self.current_rep["max_elbow_angle"] = elbow_angle

            if elbow_angle >= self.LOCKOUT_THRESHOLD:
                duration = round(sec - self.current_rep["start_time"], 2)
                self.state = "READY"
                self.ready_frames = 5
                self.bottom_frames = 0

                # Validate minimum repetition duration (ignore transient occlusions < 1.0s)
                if duration >= 1.0:
                    self.completed_reps += 1
                    self.current_rep["end_time"] = round(sec, 2)
                    self.current_rep["rep_number"] = self.completed_reps

                    min_e = self.current_rep["min_elbow_angle"]
                    max_e = self.current_rep["max_elbow_angle"]
                    b_inc = self.current_rep["bench_incline_angle"]

                    errors = []
                    # Criteria from Coach Truong Thai Luu
                    if min_e < 70.0:
                        errors.append(f"Hạ tạ quá sâu ({min_e:.1f}° < 70°: Nguy cơ chấn thương bao khớp vai)")
                    elif min_e > 100.0:
                        errors.append(f"Hạ tạ chưa đủ độ sâu ({min_e:.1f}° > 100°: Chưa kích hoạt tối ưu cơ ngực trên)")

                    if max_e < 145.0:
                        errors.append(f"Đẩy chưa hết biên độ ({max_e:.1f}° < 145°: Half rep)")

                    if b_inc > 45.0:
                        errors.append(f"Độ dốc ghế quá cao ({b_inc:.1f}° > 45°: Chuyển nhiều lực vào vai trước)")

                    if len(errors) == 0:
                        self.current_rep["status"] = "GOOD_FORM"
                        self.current_rep["feedback"] = f"Form chuẩn (Khuỷu đáy {min_e:.0f}°, Đỉnh {max_e:.0f}°, Ghế {b_inc:.0f}°)"
                        feedback_event = {
                            "text": f"REP {self.completed_reps}: FORM CHUAN",
                            "color": (0, 255, 0),
                        }
                    else:
                        self.current_rep["status"] = "BAD_FORM"
                        self.current_rep["feedback"] = " | ".join(errors)
                        feedback_event = {
                            "text": f"REP {self.completed_reps}: " + errors[0],
                            "color": (0, 0, 255),
                        }

                    self.current_rep["errors"] = errors
                    self.reps_data.append(dict(self.current_rep))

        return {
            "state": self.state,
            "elbow_angle": round(elbow_angle, 1),
            "bench_incline": round(bench_incline, 1),
            "shoulder_angle": round(shoulder_angle, 1),
            "completed_reps": self.completed_reps,
            "feedback_event": feedback_event,
            "active_side": side,
        }

    def finalize(self, sec=0.0):
        """Flushes any rep in progress when the video ended."""
        if self.state == "PRESSING" and self.current_rep.get("max_elbow_angle", 0.0) >= 130.0:
            duration = round(sec - self.current_rep["start_time"], 2)
            if duration >= 1.0:
                self.completed_reps += 1
                self.current_rep["end_time"] = round(sec, 2)
                self.current_rep["rep_number"] = self.completed_reps
                min_e = self.current_rep["min_elbow_angle"]
                max_e = self.current_rep["max_elbow_angle"]
                b_inc = self.current_rep["bench_incline_angle"]

                errors = []
                if min_e < 70.0:
                    errors.append(f"Hạ tạ quá sâu ({min_e:.1f}° < 70°: Nguy cơ chấn thương bao khớp vai)")
                elif min_e > 100.0:
                    errors.append(f"Hạ tạ chưa đủ độ sâu ({min_e:.1f}° > 100°: Chưa kích hoạt tối ưu cơ ngực trên)")

                if max_e < 145.0:
                    errors.append(f"Đẩy chưa hết biên độ / Video kết thúc sớm ({max_e:.1f}° < 145°: Half rep)")

                if b_inc > 45.0:
                    errors.append(f"Độ dốc ghế quá cao ({b_inc:.1f}° > 45°: Chuyển nhiều lực vào vai trước)")

                self.current_rep["status"] = "BAD_FORM" if len(errors) > 0 else "GOOD_FORM"
                self.current_rep["feedback"] = " | ".join(errors) if len(errors) > 0 else "Form chuẩn"
                self.current_rep["errors"] = errors
                self.reps_data.append(dict(self.current_rep))
                self.state = "READY"

