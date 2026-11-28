"""VisionFit Manual Pose & Biomechanics Lab (Desktop OpenCV CLI).
Allows interactive keypoint landmarking directly on frames with mouse clicks,
progressive biomechanics angle calculation, and side-by-side validation against
PoseNet Custom (100% Self-Trained) and Ground Truth (MediaPipe).

Usage:
    python manual_pose_lab.py
    python manual_pose_lab.py --subject person_12
    python manual_pose_lab.py --frame data/extracted_frames/person_12/frame_1452.jpg
"""

import argparse
import json
import os
from pathlib import Path
import sys
import cv2
import numpy as np

ROOT = Path(__file__).resolve().parent
sys.path.append(str(ROOT))

from pose_model import load_pose_model, infer_rgb, IMAGE_SIZE

OUT_REPORTS_DIR = ROOT / 'reports' / 'manual_eval'

EDGES = [
    (11, 12), (11, 13), (13, 15), (12, 14), (14, 16),
    (11, 23), (12, 24), (23, 24),
    (23, 25), (25, 27), (24, 26), (26, 28),
    (27, 29), (29, 31), (28, 30), (30, 32)
]

def calc_angle_3pts(a, b, c):
    ba = np.asarray(a[:2], dtype=float) - np.asarray(b[:2], dtype=float)
    bc = np.asarray(c[:2], dtype=float) - np.asarray(b[:2], dtype=float)
    norm = np.linalg.norm(ba) * np.linalg.norm(bc)
    if norm < 1e-6:
        return None
    cos_ang = np.clip(np.dot(ba, bc) / norm, -1.0, 1.0)
    return float(np.degrees(np.arccos(cos_ang)))

def calc_torso_lean(hip, shoulder):
    dx = shoulder[0] - hip[0]
    dy = shoulder[1] - hip[1]
    return float(np.degrees(np.arctan2(abs(dx), max(1e-6, -dy))))


class ManualPoseLab:
    def __init__(self, frame_path, model_path='models/pose_custom.pt'):
        self.frame_path = Path(frame_path)
        self.model_path = Path(model_path)
        self.window_name = "VisionFit Manual Pose & Biomechanics Lab"
        
        # Load Model
        print(f"[Lab] Loading PoseNet model from {self.model_path}...")
        self.model = load_pose_model(str(self.model_path), device='cpu')
        
        # Load Annotations Cache
        self.annotations = {}
        anno_file = ROOT / 'data' / 'extracted_frames' / 'annotations.json'
        if anno_file.is_file():
            try:
                self.annotations = json.loads(anno_file.read_text(encoding='utf-8'))
            except Exception as e:
                print(f"[Warn] Could not load annotations.json: {e}")

        # State
        self.manual_points = [] # list of (x_norm, y_norm, name)
        self.show_gt = True
        self.show_pred = True
        self.show_manual = True
        self.show_split = True
        
        # Load Frame
        self.load_frame(self.frame_path)

    def load_frame(self, path):
        self.frame_path = Path(path)
        self.orig_bgr = cv2.imread(str(self.frame_path))
        if self.orig_bgr is None:
            raise FileNotFoundError(f"Cannot read image: {self.frame_path}")

        self.h, self.w = self.orig_bgr.shape[:2]
        self.display_h = 500
        self.display_w = int(round(self.display_h * (self.w / self.h)))
        self.canvas_bgr = cv2.resize(self.orig_bgr, (self.display_w, self.display_h), interpolation=cv2.INTER_LINEAR)

        # Infer with PoseNet Custom
        rgb_128 = cv2.resize(cv2.cvtColor(self.orig_bgr, cv2.COLOR_BGR2RGB), (IMAGE_SIZE, IMAGE_SIZE), interpolation=cv2.INTER_AREA)
        self.pred_kpts = infer_rgb(self.model, rgb_128, device='cpu')

        # Find Ground Truth
        # check relative path like person_12/frame_xxxx.jpg
        rel_key = None
        for k in self.annotations.keys():
            if k in str(self.frame_path) or self.frame_path.name in k:
                rel_key = k
                break
        self.gt_kpts = np.asarray(self.annotations[rel_key]['keypoints_33']) if rel_key else None

        # Reset manual points for new frame
        self.manual_points = []
        print(f"[Lab] Loaded {self.frame_path.name} ({self.w}x{self.h}) - GT: {'Yes' if self.gt_kpts is not None else 'No'}")

    def on_mouse(self, event, x, y, flags, param):
        if event == cv2.EVENT_LBUTTONDOWN:
            # If split view, click is on right pane
            if self.show_split:
                pane_w = self.display_w
                if x < pane_w:
                    return # Left pane is GT reference
                click_x = (x - pane_w) / float(pane_w)
                click_y = y / float(self.display_h)
            else:
                click_x = x / float(self.display_w)
                click_y = y / float(self.display_h)

            click_x = float(np.clip(click_x, 0.0, 1.0))
            click_y = float(np.clip(click_y, 0.0, 1.0))

            step = len(self.manual_points)
            names = ["Hong (Hip)", "Goi (Knee)", "Co chan (Ankle)", "Vai (Shoulder)"]
            name = names[step] if step < len(names) else f"Diem {step+1}"
            self.manual_points.append((click_x, click_y, name))
            print(f"[Click {step+1}] Dat diem {name}: ({click_x:.3f}, {click_y:.3f})")

    def draw_skeleton(self, img, pts, color, thickness=2):
        h, w = img.shape[:2]
        def xy(p):
            return (int(round(p[0] * (w - 1))), int(round(p[1] * (h - 1))))

        for a, b in EDGES:
            if a < len(pts) and b < len(pts):
                v1 = pts[a, -1] if pts.shape[-1] > 2 else 1.0
                v2 = pts[b, -1] if pts.shape[-1] > 2 else 1.0
                if v1 >= 0.35 and v2 >= 0.35:
                    cv2.line(img, xy(pts[a]), xy(pts[b]), color, thickness, cv2.LINE_AA)
        for p in pts:
            v = p[-1] if len(p) > 2 else 1.0
            if v >= 0.35:
                cv2.circle(img, xy(p), 4, color, -1, cv2.LINE_AA)
        return img

    def render(self):
        pane_left = self.canvas_bgr.copy()
        pane_right = self.canvas_bgr.copy()

        # Left Pane: Ground Truth
        if self.show_gt and self.gt_kpts is not None:
            self.draw_skeleton(pane_left, self.gt_kpts, (0, 255, 0), thickness=2)
            cv2.putText(pane_left, "GROUND TRUTH (MediaPipe)", (14, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
        else:
            cv2.putText(pane_left, "ORIGINAL IMAGE", (14, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 200, 200), 2)

        # Right Pane: PoseNet Custom (Orange)
        if self.show_pred and self.pred_kpts is not None:
            self.draw_skeleton(pane_right, self.pred_kpts, (0, 165, 255), thickness=2)
            cv2.putText(pane_right, "POSENET CUSTOM (100% SELF-TRAINED)", (14, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 165, 255), 2)

        # Draw Manual Points (Cyan) on Right Pane
        h, w = self.display_h, self.display_w
        if self.show_manual and len(self.manual_points) > 0:
            coords = [(int(p[0] * (w - 1)), int(p[1] * (h - 1))) for p in self.manual_points]
            
            # Connect manual bones
            if len(coords) >= 2:
                # Hip to Knee
                cv2.line(pane_right, coords[0], coords[1], (255, 255, 0), 3, cv2.LINE_AA)
            if len(coords) >= 3:
                # Knee to Ankle
                cv2.line(pane_right, coords[1], coords[2], (255, 255, 0), 3, cv2.LINE_AA)
            if len(coords) >= 4:
                # Shoulder to Hip
                cv2.line(pane_right, coords[3], coords[0], (0, 200, 255), 3, cv2.LINE_AA)

            # Draw dots & labels
            for i, (cx, cy) in enumerate(coords):
                name = self.manual_points[i][2]
                cv2.circle(pane_right, (cx, cy), 6, (255, 255, 0), -1, cv2.LINE_AA)
                cv2.circle(pane_right, (cx, cy), 8, (0, 200, 255), 2, cv2.LINE_AA)
                cv2.putText(pane_right, f"{i+1}.{name}", (cx + 8, cy - 6), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1, cv2.LINE_AA)

        # Biomechanics Calculation & Angle Overlays
        knee_angle = None
        torso_lean = None
        if len(self.manual_points) >= 3:
            p_hip = self.manual_points[0][:2]
            p_knee = self.manual_points[1][:2]
            p_ankle = self.manual_points[2][:2]
            knee_angle = calc_angle_3pts(p_hip, p_knee, p_ankle)

        if len(self.manual_points) >= 4:
            p_sh = self.manual_points[3][:2]
            p_hip = self.manual_points[0][:2]
            torso_lean = calc_torso_lean(p_hip, p_sh)

        # HUD Text on Right Pane
        y_text = 65
        if knee_angle is not None:
            depth_str = "SQUAT SAU (DEEP)" if knee_angle <= 80 else ("SONG SONG (PARALLEL)" if knee_angle <= 100 else "SQUAT NONG (SHALLOW)")
            col = (0, 255, 0) if knee_angle <= 100 else (0, 0, 255)
            cv2.putText(pane_right, f"Goc Goi: {knee_angle:.1f} deg - {depth_str}", (14, y_text), cv2.FONT_HERSHEY_SIMPLEX, 0.5, col, 2)
            y_text += 25

        if torso_lean is not None:
            col = (0, 255, 0) if torso_lean <= 45 else (0, 0, 255)
            cv2.putText(pane_right, f"Nghieng Than: {torso_lean:.1f} deg", (14, y_text), cv2.FONT_HERSHEY_SIMPLEX, 0.5, col, 2)
            y_text += 25

        # Instruction HUD
        step = len(self.manual_points)
        prompts = [
            "1. Click KHOP HONG (Hip)",
            "2. Click KHOP GOI (Knee)",
            "3. Click CO CHAN (Ankle)",
            "4. Click VAI (Shoulder)",
            "Da cham du 4 diem! Bam R de reset"
        ]
        prompt = prompts[min(step, len(prompts)-1)]
        cv2.putText(pane_right, f">> {prompt}", (14, h - 16), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 2)

        # Combine
        if self.show_split:
            # Add thin separator
            cv2.line(pane_left, (w - 1, 0), (w - 1, h), (50, 50, 50), 2)
            combined = np.hstack([pane_left, pane_right])
        else:
            combined = pane_right

        # Footer Help Bar
        footer = np.full((36, combined.shape[1], 3), 20, dtype=np.uint8)
        help_text = "[Click]: Cham khop | [R]: Reset | [G]: Toggle GT | [T]: Toggle AI | [S]: Save PNG | [Q]: Quit"
        cv2.putText(footer, help_text, (14, 24), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (180, 180, 180), 1, cv2.LINE_AA)
        
        return np.vstack([combined, footer])

    def save_comparison(self):
        OUT_REPORTS_DIR.mkdir(parents=True, exist_ok=True)
        out_name = f"manual_eval_{self.frame_path.stem}_{len(self.manual_points)}pts.png"
        out_path = OUT_REPORTS_DIR / out_name
        vis = self.render()
        cv2.imwrite(str(out_path), vis)
        print(f"[Lab] Da xuat anh doi chieu: {out_path}")

    def run(self):
        cv2.namedWindow(self.window_name, cv2.WINDOW_AUTOSIZE)
        cv2.setMouseCallback(self.window_name, self.on_mouse)

        print("\n=== VisionFit Manual Pose & Biomechanics Lab ===")
        print("Click chuot trai de cham lan luot:")
        print("  1. Khop Hong (Hip)")
        print("  2. Khop Goi (Knee)")
        print("  3. Co chan (Ankle)")
        print("  4. Khop Vai (Shoulder)")
        print("He thong se tu dong tinh toan goc do va so sanh voi AI PoseNet.")
        print("Phim tat: [R] Reset | [S] Save | [G] Toggle GT | [T] Toggle AI | [Q] Thoat\n")

        while True:
            display = self.render()
            cv2.imshow(self.window_name, display)
            key = cv2.waitKey(30) & 0xFF

            if key in (ord('q'), 27):
                break
            elif key in (ord('r'), ord('c')):
                self.manual_points = []
                print("[Lab] Da reset cac diem cham.")
            elif key == ord('s'):
                self.save_comparison()
            elif key == ord('g'):
                self.show_gt = not self.show_gt
            elif key == ord('t'):
                self.show_pred = not self.show_pred
            elif key == ord('m'):
                self.show_manual = not self.show_manual

        cv2.destroyAllWindows()


def main():
    parser = argparse.ArgumentParser(description="VisionFit Manual Pose & Biomechanics Lab")
    parser.add_argument('--frame', default='data/extracted_frames/person_12/frame_1452.jpg', help='Path to image frame')
    parser.add_argument('--model', default='models/pose_custom.pt', help='PoseNet model checkpoint')
    args = parser.parse_args()

    frame_path = ROOT / args.frame
    if not frame_path.is_file():
        # Fallback to first available frame in extracted_frames
        frames_dir = ROOT / 'data' / 'extracted_frames'
        any_frames = list(frames_dir.glob('*/*.jpg'))
        if any_frames:
            frame_path = any_frames[0]
        else:
            print(f"[Error] No frames found in {frames_dir}")
            sys.exit(1)

    lab = ManualPoseLab(frame_path=frame_path, model_path=ROOT / args.model)
    lab.run()


if __name__ == '__main__':
    main()
