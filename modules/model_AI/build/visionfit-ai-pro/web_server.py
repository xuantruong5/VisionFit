"""VisionFit AI Studio - Local Web Server & API Bridge
Serves the web UI and provides endpoints to bridge web data with PyTorch training.
Zero heavy server framework dependencies (uses standard library http.server).
"""

import argparse
import json
import os
from pathlib import Path
import sys
import webbrowser
from http.server import HTTPServer, SimpleHTTPRequestHandler, ThreadingHTTPServer

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

ROOT_DIR = Path(__file__).resolve().parent
VENV_DIR = ROOT_DIR / '.venv'
if VENV_DIR.is_dir() and Path(sys.prefix).resolve() != VENV_DIR.resolve():
    venv_python = VENV_DIR / 'bin' / 'python'
    if venv_python.is_file():
        os.execv(str(venv_python), [str(venv_python)] + sys.argv)

WEB_DIR = ROOT_DIR / 'web'
DATA_DIR = ROOT_DIR / 'data'
MODELS_DIR = ROOT_DIR / 'models'


_POSE_MODEL = None
_MP_DETECTOR = None
_ACTION_MODEL = None
_ACTION_META = None


def get_mp_detector():
    """High-precision MediaPipe PoseLandmarker for real-time accurate pose tracking."""
    global _MP_DETECTOR
    if _MP_DETECTOR is None:
        task_path = MODELS_DIR / 'mediapipe' / 'pose_landmarker_full.task'
        if task_path.is_file():
            try:
                import mediapipe as mp
                options = mp.tasks.vision.PoseLandmarkerOptions(
                    base_options=mp.tasks.BaseOptions(model_asset_path=str(task_path)),
                    running_mode=mp.tasks.vision.RunningMode.IMAGE,
                    num_poses=1,
                )
                _MP_DETECTOR = mp.tasks.vision.PoseLandmarker.create_from_options(options)
                print(f'[VisionFit] Initialized MediaPipe PoseLandmarker from {task_path}', flush=True)
            except Exception as e:
                print(f'[VisionFit] Could not init MediaPipe Pose Landmarker: {e}', flush=True)
    return _MP_DETECTOR


def get_pose_model():
    """Load the locally trained PoseNet. Falls back gracefully across available checkpoints."""
    global _POSE_MODEL
    if _POSE_MODEL is None:
        pose_path = MODELS_DIR / 'pose_custom.pt'
        if not pose_path.is_file():
            for alt in ['pose_v2.pt', 'pose_debug.pt', 'pose_debug_91.pt']:
                if (MODELS_DIR / alt).is_file():
                    pose_path = MODELS_DIR / alt
                    break
        if not pose_path.is_file():
            raise FileNotFoundError(f'PoseNet model not found in {MODELS_DIR}')
        from core.pose_model import load_pose_model
        _POSE_MODEL = load_pose_model(str(pose_path), device='cpu')
        print(f'[VisionFit] Using trained PoseNet: {pose_path}', flush=True)
    return _POSE_MODEL


def get_action_model():
    global _ACTION_MODEL, _ACTION_META
    if _ACTION_MODEL is None:
        action_path = MODELS_DIR / 'action.pt'
        if not action_path.exists():
            action_path = MODELS_DIR / 'action_demo.pt'
        if action_path.exists():
            try:
                from analyzers.visionfit import load_model
                _ACTION_MODEL, _ACTION_META = load_model(str(action_path), device='cpu')
            except Exception as e:
                print(f"[ActionModel Error] Could not load {action_path}: {e}")
    return _ACTION_MODEL, _ACTION_META


def auto_detect_exercise_type(video_path):
    """Accurately detect whether video is push-up, squat, incline press, or general posture."""
    try:
        import cv2
        import numpy as np
        import mediapipe as mp
        import unicodedata

        v_name = Path(video_path).name.lower()
        norm_name = unicodedata.normalize('NFKD', v_name).encode('ascii', 'ignore').decode('utf-8')
        if any(w in norm_name for w in ['squat', 'suqta', 'ganh', 'dui']):
            return "squat"
        if any(w in norm_name for w in ['push', 'hit', 'dat', 'chong']):
            return "push_up"
        if any(w in norm_name for w in ['incline', 'nguc']):
            return "incline_press"

        detector = get_mp_detector()
        if detector is None:
            return "general"

        cap = cv2.VideoCapture(str(video_path))
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        if total_frames <= 0:
            cap.release()
            return "general"

        num_samples = min(20, total_frames)
        sample_indices = np.linspace(2, total_frames - 2, num_samples, dtype=int)
        horiz_count = 0
        vert_count = 0
        knee_angles = []
        hip_y_list = []

        for idx in sample_indices:
            cap.set(cv2.CAP_PROP_POS_FRAMES, int(idx))
            ret, frame = cap.read()
            if not ret:
                continue
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
            res = detector.detect(mp_img)
            if res.pose_landmarks and len(res.pose_landmarks) > 0:
                lm = res.pose_landmarks[0]
                sh_x = (lm[11].x + lm[12].x) / 2.0
                sh_y = (lm[11].y + lm[12].y) / 2.0
                ank_x = (lm[27].x + lm[28].x) / 2.0
                ank_y = (lm[27].y + lm[28].y) / 2.0
                hip_y = (lm[23].y + lm[24].y) / 2.0
                dx = abs(sh_x - ank_x)
                dy = abs(sh_y - ank_y)

                if dx >= dy * 0.65:
                    horiz_count += 1
                else:
                    vert_count += 1
                    hip_y_list.append(hip_y)
                    for (h_i, k_i, a_i) in [(23, 25, 27), (24, 26, 28)]:
                        h_pt = np.array([lm[h_i].x, lm[h_i].y])
                        k_pt = np.array([lm[k_i].x, lm[k_i].y])
                        a_pt = np.array([lm[a_i].x, lm[a_i].y])
                        v1 = h_pt - k_pt
                        v2 = a_pt - k_pt
                        norm = np.linalg.norm(v1) * np.linalg.norm(v2)
                        if norm > 1e-6:
                            ang = np.degrees(np.arccos(np.clip(np.dot(v1, v2) / norm, -1.0, 1.0)))
                            knee_angles.append(ang)
        cap.release()

        total_valid = horiz_count + vert_count
        if total_valid == 0:
            return "general"

        if horiz_count >= 3 and horiz_count / total_valid >= 0.35:
            return "push_up"

        if vert_count >= 3:
            hip_rom = (max(hip_y_list) - min(hip_y_list)) if hip_y_list else 0.0
            if len(knee_angles) >= 4:
                min_k = float(np.percentile(knee_angles, 10))
                max_k = float(np.percentile(knee_angles, 90))
                rom = max_k - min_k
                if (min_k <= 135.0 and rom >= 18.0) or (hip_rom >= 0.08):
                    return "squat"
            elif hip_rom >= 0.08:
                return "squat"

        return "general"
    except Exception as e:
        print(f"[AutoDetect Error] {e}", flush=True)
        return "general"


class VisionFitWebHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(WEB_DIR), **kwargs)

    def translate_path(self, path):
        import urllib.parse
        import unicodedata
        clean_path = urllib.parse.unquote(path.split('?', 1)[0].split('#', 1)[0])
        if clean_path.startswith('/reports/') or clean_path.startswith('/videos/'):
            cand = ROOT_DIR / clean_path.lstrip('/')
            if not cand.exists():
                cand_nfd = ROOT_DIR / unicodedata.normalize('NFD', clean_path).lstrip('/')
                if cand_nfd.exists():
                    return str(cand_nfd)
                cand_nfc = ROOT_DIR / unicodedata.normalize('NFC', clean_path).lstrip('/')
                if cand_nfc.exists():
                    return str(cand_nfc)
            return str(cand)
        return super().translate_path(path)

    def end_headers(self):
        # Enable CORS and disable aggressive caching for local development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_HEAD(self):
        self.do_GET()

    def do_GET(self):
        # Handle API routes
        if self.path == '/api/status':
            self.handle_api_status()
            return
        elif self.path == '/api/dataset':
            self.handle_api_dataset()
            return
        elif self.path == '/api/list_videos':
            self.handle_api_list_videos()
            return
        elif self.path.startswith('/api/comparison_frames'):
            self.handle_api_comparison_frames()
            return
        
        # Range handling for video streaming (.mp4)
        clean_path = self.path.split('?', 1)[0].split('#', 1)[0]
        if clean_path.endswith('.mp4'):
            fpath = Path(self.translate_path(self.path))
            if fpath.is_file():
                self.handle_video_stream(fpath)
                return

        # Default static file serving
        super().do_GET()

    def handle_video_stream(self, file_path):
        file_size = file_path.stat().st_size
        range_header = self.headers.get('Range', None)
        if not range_header or not range_header.startswith('bytes='):
            self.send_response(200)
            self.send_header('Content-Type', 'video/mp4')
            self.send_header('Content-Length', str(file_size))
            self.send_header('Accept-Ranges', 'bytes')
            self.end_headers()
            if self.command == 'HEAD':
                return
            with open(file_path, 'rb') as f:
                self.copyfile(f, self.wfile)
            return

        range_val = range_header.strip().replace('bytes=', '')
        parts = range_val.split('-')
        start = int(parts[0]) if parts[0] else 0
        end = int(parts[1]) if len(parts) > 1 and parts[1] else file_size - 1
        end = min(end, file_size - 1)
        length = end - start + 1

        self.send_response(206)
        self.send_header('Content-Type', 'video/mp4')
        self.send_header('Content-Range', f'bytes {start}-{end}/{file_size}')
        self.send_header('Content-Length', str(length))
        self.send_header('Accept-Ranges', 'bytes')
        self.end_headers()

        if self.command == 'HEAD':
            return

        with open(file_path, 'rb') as f:
            f.seek(start)
            bytes_left = length
            while bytes_left > 0:
                chunk = f.read(min(bytes_left, 65536))
                if not chunk:
                    break
                self.wfile.write(chunk)
                bytes_left -= len(chunk)

    def do_POST(self):
        if self.path == '/api/predict_pose':
            self.handle_api_predict_pose()
            return
        elif self.path == '/api/predict_action':
            self.handle_api_predict_action()
            return
        elif self.path == '/api/save_npz':
            self.handle_api_save_npz()
            return
        elif self.path == '/api/train_pytorch':
            self.handle_api_train_pytorch()
            return
        elif self.path == '/api/train_pose_pytorch':
            self.handle_api_train_pose_pytorch()
            return
        elif self.path == '/api/analyze_squat':
            self.handle_api_analyze_squat()
            return
        elif self.path == '/api/analyze_push_up':
            self.handle_api_analyze_push_up()
            return
        elif self.path == '/api/analyze_incline_press':
            self.handle_api_analyze_incline_press()
            return
        elif self.path.startswith('/api/upload_and_analyze'):
            self.handle_api_upload_and_analyze()
            return
        
        self.send_error(404, 'API endpoint not found')

    def handle_api_upload_and_analyze(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length <= 0:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Empty upload'}).encode('utf-8'))
                return

            # Max upload limit: 100MB to prevent Denial-of-Service / Memory exhaustion
            MAX_UPLOAD_BYTES = 100 * 1024 * 1024
            if content_length > MAX_UPLOAD_BYTES:
                self.send_response(413)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Video payload exceeds maximum 100MB limit'}).encode('utf-8'))
                return

            from urllib.parse import urlparse, parse_qs
            import time
            parsed = urlparse(self.path)
            qs = parse_qs(parsed.query)
            filename = qs.get('filename', ['uploaded_video.mp4'])[0]
            exercise = qs.get('exercise', [None])[0]
            raw_safe_name = Path(filename).name
            if not raw_safe_name.lower().endswith(('.mp4', '.mov', '.avi', '.webm', '.mkv')):
                raw_safe_name += '.mp4'

            # Avoid file collision / overwrite by appending timestamp if exists
            staging_dir = ROOT_DIR / 'videos' / 'uploads'
            staging_dir.mkdir(parents=True, exist_ok=True)
            dest_file = staging_dir / raw_safe_name
            if dest_file.exists():
                safe_stem = dest_file.stem
                safe_ext = dest_file.suffix
                raw_safe_name = f"{safe_stem}_{int(time.time())}{safe_ext}"
                dest_file = staging_dir / raw_safe_name

            bytes_left = content_length
            with open(dest_file, 'wb') as f:
                while bytes_left > 0:
                    chunk = self.rfile.read(min(bytes_left, 65536))
                    if not chunk:
                        break
                    f.write(chunk)
                    bytes_left -= len(chunk)

            # Validate video integrity with OpenCV
            import cv2
            cap_val = cv2.VideoCapture(str(dest_file))
            is_valid_video = cap_val.isOpened() and (int(cap_val.get(cv2.CAP_PROP_FRAME_COUNT)) > 0)
            cap_val.release()
            if not is_valid_video:
                dest_file.unlink(missing_ok=True)
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Invalid or corrupted video file format'}).encode('utf-8'))
                return

            safe_name = raw_safe_name

            # Exercise auto-detection or user explicit choice
            if exercise in ('push_up', 'squat', 'incline_press', 'general'):
                fname_lower = safe_name.lower()
                is_explicit_conflict = (
                    ('squat' in fname_lower or 'suqta' in fname_lower) and exercise == 'push_up'
                ) or (
                    ('push' in fname_lower or 'hit' in fname_lower or 'dat' in fname_lower) and exercise == 'squat'
                )
                if is_explicit_conflict:
                    detected_exercise = auto_detect_exercise_type(dest_file)
                else:
                    detected_exercise = exercise
            else:
                detected_exercise = auto_detect_exercise_type(dest_file)
            print(f"[VisionFit AI] Auto-detected exercise: {detected_exercise} for video {safe_name}", flush=True)

            final_dir = ROOT_DIR / 'videos' / detected_exercise
            final_dir.mkdir(parents=True, exist_ok=True)
            final_file = final_dir / safe_name
            import shutil
            shutil.move(str(dest_file), str(final_file))
            dest_file = final_file

            import re
            slug = re.sub(r'[^a-zA-Z0-9_\-]', '_', dest_file.stem)
            while '__' in slug:
                slug = slug.replace('__', '_')
            slug = slug.strip('_') or 'video'

            if detected_exercise == 'push_up':
                from analyzers.push_up_analyzer import analyze_push_up_video
                out_video = ROOT_DIR / 'reports' / 'push_up' / f'{slug}_annotated.mp4'
                out_report = ROOT_DIR / 'reports' / 'push_up' / f'{slug}_report.json'
                report = analyze_push_up_video(
                    dest_file,
                    out_video_path=out_video,
                    report_path=out_report,
                    engine="mediapipe",
                )
                payload = {
                    'status': 'ok',
                    'detected_exercise': 'push_up',
                    'exercise_label': 'Hít đất (Push-up)',
                    'video': dest_file.name,
                    'annotated_video': f'/reports/push_up/{out_video.name}',
                    'report': report,
                }
            elif detected_exercise == 'incline_press':
                from analyzers.incline_press_analyzer import analyze_incline_press_video
                out_video = ROOT_DIR / 'reports' / 'incline_press' / f'{slug}_annotated.mp4'
                out_report = ROOT_DIR / 'reports' / 'incline_press' / f'{slug}_report.json'
                report = analyze_incline_press_video(
                    dest_file,
                    out_video_path=out_video,
                    report_path=out_report,
                )
                payload = {
                    'status': 'ok',
                    'detected_exercise': 'incline_press',
                    'exercise_label': 'Đẩy ngực dốc (Incline Press)',
                    'video': dest_file.name,
                    'annotated_video': f'/reports/incline_press/{out_video.name}',
                    'report': report,
                }
            elif detected_exercise == 'squat':
                from analyzers.visionfit import analyze_squat_video
                out_video = ROOT_DIR / 'reports' / 'squat' / f'{slug}_annotated.mp4'
                out_report = ROOT_DIR / 'reports' / 'squat' / f'{slug}_report.json'
                report = analyze_squat_video(
                    dest_file,
                    out_video_path=out_video,
                    report_path=out_report,
                )
                payload = {
                    'status': 'ok',
                    'detected_exercise': 'squat',
                    'exercise_label': 'Gánh đùi (Squat)',
                    'video': dest_file.name,
                    'annotated_video': f'/reports/squat/{out_video.name}',
                    'report': report,
                }
            else:
                from analyzers.general_pose_analyzer import analyze_general_pose_video
                out_video = ROOT_DIR / 'reports' / 'general' / f'{slug}_annotated.mp4'
                out_report = ROOT_DIR / 'reports' / 'general' / f'{slug}_report.json'
                report = analyze_general_pose_video(
                    dest_file,
                    out_video_path=out_video,
                    report_path=out_report,
                )
                payload = {
                    'status': 'ok',
                    'detected_exercise': 'general',
                    'exercise_label': 'Khung xương 33 Khớp (Tư thế tự do)',
                    'video': dest_file.name,
                    'annotated_video': f'/reports/general/{out_video.name}',
                    'report': report,
                }

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(payload, ensure_ascii=False).encode('utf-8'))
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))

    def handle_api_analyze_squat(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8')
            data = json.loads(body)
            video_input = data.get('video', '') or data.get('video_path', '')
            if not video_input:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'No video specified'}).encode('utf-8'))
                return

            video_file = ROOT_DIR / video_input.lstrip('/')
            if not video_file.is_file():
                for cand in [
                    ROOT_DIR / 'videos' / 'squat' / Path(video_input).name,
                    ROOT_DIR / 'videos' / 'squat' / 'dung' / Path(video_input).name,
                    ROOT_DIR / 'videos' / 'squat' / 'sai' / Path(video_input).name,
                    ROOT_DIR / 'videos' / video_input.lstrip('/'),
                ]:
                    if cand.is_file():
                        video_file = cand
                        break
            if not video_file.is_file():
                raise FileNotFoundError(f'Video file not found: {video_input}')

            from analyzers.visionfit import analyze_squat_video
            out_video = ROOT_DIR / 'reports' / 'squat' / f'{video_file.stem}_annotated.mp4'
            out_report = ROOT_DIR / 'reports' / 'squat' / f'{video_file.stem}_report.json'

            report = analyze_squat_video(
                video_file,
                out_video_path=out_video,
                report_path=out_report,
            )

            payload = {
                'status': 'ok',
                'video': video_file.name,
                'annotated_video': f'/reports/squat/{out_video.name}',
                'report': report,
            }

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(payload, ensure_ascii=False).encode('utf-8'))
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))

    def handle_api_analyze_incline_press(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8')
            data = json.loads(body)
            video_input = data.get('video', '') or data.get('video_path', '')
            if not video_input:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'No video specified'}).encode('utf-8'))
                return

            video_file = ROOT_DIR / video_input
            if not video_file.is_file():
                video_file = ROOT_DIR / 'videos' / 'incline_press' / Path(video_input).name
            if not video_file.is_file():
                video_file = ROOT_DIR / 'videos' / video_input
            if not video_file.is_file():
                raise FileNotFoundError(f'Video file not found: {video_input}')

            from analyzers.visionfit import analyze_incline_press_video
            out_video = ROOT_DIR / 'reports' / 'incline_press' / f'{video_file.stem}_annotated.mp4'
            out_report = ROOT_DIR / 'reports' / 'incline_press' / f'{video_file.stem}_report.json'

            report = analyze_incline_press_video(
                video_file,
                out_video_path=out_video,
                report_path=out_report,
            )

            payload = {
                'status': 'ok',
                'video': video_file.name,
                'annotated_video': f'/reports/incline_press/{out_video.name}',
                'report': report,
            }

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(payload, ensure_ascii=False).encode('utf-8'))
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))

    def handle_api_analyze_push_up(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8')
            data = json.loads(body)
            video_input = data.get('video', '') or data.get('video_path', '')
            if not video_input:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'No video specified'}).encode('utf-8'))
                return

            video_file = ROOT_DIR / video_input.lstrip('/')
            if not video_file.is_file():
                for cand in [
                    ROOT_DIR / 'videos' / 'push_up' / Path(video_input).name,
                    ROOT_DIR / 'videos' / 'push_up' / 'dung' / Path(video_input).name,
                    ROOT_DIR / 'videos' / 'push_up' / 'sai' / Path(video_input).name,
                    ROOT_DIR / 'videos' / video_input.lstrip('/'),
                ]:
                    if cand.is_file():
                        video_file = cand
                        break
            if not video_file.is_file():
                raise FileNotFoundError(f'Video file not found: {video_input}')

            from analyzers.push_up_analyzer import analyze_push_up_video
            out_video = ROOT_DIR / 'reports' / 'push_up' / f'{video_file.stem}_annotated.mp4'
            out_report = ROOT_DIR / 'reports' / 'push_up' / f'{video_file.stem}_report.json'

            report = analyze_push_up_video(
                video_file,
                out_video_path=out_video,
                report_path=out_report,
                engine="mediapipe",
            )

            payload = {
                'status': 'ok',
                'video': video_file.name,
                'annotated_video': f'/reports/push_up/{out_video.name}',
                'report': report,
            }

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(payload, ensure_ascii=False).encode('utf-8'))
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))

    def handle_api_list_videos(self):
        squat_dir = ROOT_DIR / 'videos' / 'squat'
        incline_dir = ROOT_DIR / 'videos' / 'incline_press'
        push_up_dir = ROOT_DIR / 'videos' / 'push_up'
        squat_videos = []
        incline_videos = []
        push_up_videos = []
        if squat_dir.is_dir():
            squat_videos = sorted([str(f.relative_to(squat_dir)) for f in squat_dir.rglob('*.mp4')])
        if incline_dir.is_dir():
            incline_videos = sorted([str(f.relative_to(incline_dir)) for f in incline_dir.rglob('*.mp4')])
        if push_up_dir.is_dir():
            push_up_videos = sorted([str(f.relative_to(push_up_dir)) for f in push_up_dir.rglob('*.mp4')])
        payload = {
            'status': 'ok',
            'squat_videos': squat_videos,
            'incline_press_videos': incline_videos,
            'push_up_videos': push_up_videos,
            'lunge_videos': [],
        }
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(payload, ensure_ascii=False).encode('utf-8'))

    def handle_api_comparison_frames(self):
        try:
            from urllib.parse import urlparse, parse_qs
            parsed = urlparse(self.path)
            params = parse_qs(parsed.query)
            subject = params.get('subject', [None])[0]

            comp_dir = ROOT_DIR / 'reports' / 'pose_comparison_frames'
            if not comp_dir.exists():
                self.send_response(404)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Thư mục reports/pose_comparison_frames chưa tồn tại'}).encode('utf-8'))
                return

            if subject:
                sub_dir = comp_dir / subject
                if not sub_dir.exists():
                    matches = [p for p in comp_dir.rglob(subject) if p.is_dir()]
                    if matches:
                        sub_dir = matches[0]
                    else:
                        self.send_response(404)
                        self.send_header('Content-Type', 'application/json')
                        self.end_headers()
                        self.wfile.write(json.dumps({'error': f'Không tìm thấy subject {subject}'}).encode('utf-8'))
                        return

                files = sorted(sub_dir.glob('compare_*.jpg'))
                rel_dir = sub_dir.relative_to(ROOT_DIR)
                file_urls = [f'/{rel_dir}/{f.name}' for f in files]
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'status': 'ok',
                    'subject': subject,
                    'count': len(file_urls),
                    'frames': file_urls
                }).encode('utf-8'))
            else:
                summary_file = comp_dir / 'summary.json'
                if summary_file.exists():
                    data = json.loads(summary_file.read_text(encoding='utf-8'))
                else:
                    data = {'total_frames': 3059, 'subjects': {}}
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'ok', 'summary': data}).encode('utf-8'))
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))

    def handle_api_status(self):
        labels_file = ROOT_DIR / 'labels.json'
        labels = []
        if labels_file.exists():
            try:
                labels = json.loads(labels_file.read_text(encoding='utf-8'))
            except Exception:
                labels = ['squat', 'push_up', 'lunge', 'standing']
        
        models_found = [f.name for f in MODELS_DIR.glob('*.pt')] if MODELS_DIR.exists() else []
        datasets_found = [f.name for f in DATA_DIR.glob('*.npz')] if DATA_DIR.exists() else []

        payload = {
            'status': 'ok',
            'version': '2.0-100percent-local',
            'pure_local_ai': True,
            'labels': labels,
            'models_found': len(models_found),
            'models': models_found,
            'datasets': datasets_found,
            'pose_model_ready': (MODELS_DIR / 'pose_custom.pt').exists() or (MODELS_DIR / 'pose_v2.pt').exists(),
            'pose_model_file': 'pose_custom.pt' if (MODELS_DIR / 'pose_custom.pt').exists() else 'pose_v2.pt',
            'action_model_ready': (MODELS_DIR / 'action.pt').exists() or (MODELS_DIR / 'action_demo.pt').exists(),
            'squat_analyzer_ready': True,
            'squat_standards': {
                'ai_engine': 'VisionFit AI Biomechanical Engine',
                'knee_angle_ideal': '65°-90°',
                'knee_angle_max_acceptable': '95°',
                'torso_lean_ideal': '20°-35°',
                'torso_lean_max_acceptable': '45°'
            }
        }

        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(payload).encode('utf-8'))

    def handle_api_predict_pose(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8')
            data = json.loads(body)
            img_b64 = data.get('image', '')
            if not img_b64:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'No image provided'}).encode('utf-8'))
                return

            import base64
            import cv2
            import numpy as np

            header, encoded = img_b64.split(',', 1) if ',' in img_b64 else ('', img_b64)
            img_bytes = base64.b64decode(encoded)
            nparr = np.frombuffer(img_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if img is None:
                raise ValueError('Cannot decode image')

            rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            landmarks = []
            engine_name = 'VisionFit_Pose_Engine'

            # 1. Primary High-Precision Engine: MediaPipe Pose Landmarker
            mp_det = get_mp_detector()
            if mp_det is not None:
                try:
                    import mediapipe as mp
                    mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
                    mp_res = mp_det.detect(mp_img)
                    if mp_res and mp_res.pose_landmarks and len(mp_res.pose_landmarks) > 0:
                        for p in mp_res.pose_landmarks[0]:
                            landmarks.append({
                                'x': float(np.clip(p.x, 0.0, 1.0)),
                                'y': float(np.clip(p.y, 0.0, 1.0)),
                                'z': float(p.z) if p.z is not None else 0.0,
                                'visibility': float(p.visibility) if (hasattr(p, 'visibility') and p.visibility is not None) else 1.0
                            })
                except Exception as mp_err:
                    pass

            # 2. Local Fallback Engine: Self-Trained VisionFit PoseNet (Dual-Head BodyPoseNet)
            if not landmarks:
                engine_name = 'VisionFit_PoseNet_DualHead'
                from core.pose_model import IMAGE_SIZE, infer_rgb
                h, w = rgb.shape[:2]
                scale = min(IMAGE_SIZE / h, IMAGE_SIZE / w)
                nh, nw = max(1, int(h * scale)), max(1, int(w * scale))
                resized = cv2.resize(rgb, (nw, nh), interpolation=cv2.INTER_AREA)
                canvas = np.zeros((IMAGE_SIZE, IMAGE_SIZE, 3), dtype=np.uint8)
                top = (IMAGE_SIZE - nh) // 2
                left = (IMAGE_SIZE - nw) // 2
                canvas[top:top+nh, left:left+nw] = resized

                pose_net = get_pose_model()
                if pose_net is not None:
                    pts = infer_rgb(pose_net, canvas, device='cpu')
                    for i in range(len(pts)):
                        lx = (pts[i, 0] * IMAGE_SIZE - left) / nw
                        ly = (pts[i, 1] * IMAGE_SIZE - top) / nh
                        landmarks.append({
                            'x': float(np.clip(lx, 0.0, 1.0)),
                            'y': float(np.clip(ly, 0.0, 1.0)),
                            'z': float(pts[i, 2]),
                            'visibility': float(pts[i, 3])
                        })

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'status': 'ok', 'engine': engine_name, 'landmarks': landmarks}).encode('utf-8'))
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))

    def handle_api_predict_action(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8')
            data = json.loads(body)
            raw_frames = data.get('frames', [])
            if len(raw_frames) < 2:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Need >= 2 frames'}).encode('utf-8'))
                return

            import numpy as np
            import torch
            from analyzers.visionfit import normalize, resample

            model, meta = get_action_model()
            if model is None or meta is None:
                raise RuntimeError('Action model not loaded')

            seq = []
            for f in raw_frames:
                pts = []
                for p in f[:33]:
                    pts.append([
                        float(p.get('x', 0)),
                        float(p.get('y', 0)),
                        float(p.get('z', 0)),
                        float(p.get('visibility', 1.0))
                    ])
                while len(pts) < 33:
                    pts.append([0.0, 0.0, 0.0, 0.0])
                seq.append(pts)

            seq_arr = np.array(seq, dtype=np.float32)
            norm_seq = normalize(resample(seq_arr, int(meta.get('frames', 32))))
            inp = torch.from_numpy(norm_seq).unsqueeze(0).to('cpu')

            with torch.no_grad():
                logits = model(inp)
                probs = torch.softmax(logits, dim=-1)[0].cpu().numpy()

            labels = meta.get('labels', ['squat', 'push_up', 'lunge', 'standing'])
            best_idx = int(np.argmax(probs))
            pred_label = labels[best_idx]
            confidence = float(probs[best_idx])
            prob_dict = {lbl: float(probs[i]) for i, lbl in enumerate(labels)}

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                'status': 'ok',
                'action': pred_label,
                'confidence': confidence,
                'probabilities': prob_dict
            }).encode('utf-8'))
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))

    def handle_api_dataset(self):
        dataset_file = WEB_DIR / 'dataset_demo.json'
        if not dataset_file.exists():
            self.send_response(404)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': 'dataset_demo.json not found'}).encode('utf-8'))
            return
        
        data_bytes = dataset_file.read_bytes()
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(data_bytes)))
        self.end_headers()
        self.wfile.write(data_bytes)

    def handle_api_train_pose_pytorch(self):
        import subprocess
        try:
            global _POSE_MODEL
            pose_data = DATA_DIR / 'pose_real.npz'
            if not pose_data.exists():
                pose_data = DATA_DIR / 'pose_demo.npz'
            cmd = [
                sys.executable,
                str(ROOT_DIR / 'pose_model.py'),
                'train',
                '--data', str(pose_data),
                '--out', str(MODELS_DIR / 'pose.pt'),
                '--epochs', '15'
            ]
            result = subprocess.run(cmd, capture_output=True, text=True, cwd=str(ROOT_DIR), timeout=120)
            _POSE_MODEL = None  # Reload next time
            success = result.returncode == 0
            res = {
                'status': 'ok' if success else 'error',
                'stdout': result.stdout[-500:] if result.stdout else '',
                'stderr': result.stderr[-300:] if result.stderr else ''
            }
            self.send_response(200 if success else 500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(res).encode('utf-8'))
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))

    def handle_api_train_pytorch(self):
        import subprocess
        try:
            global _ACTION_MODEL
            data_file = DATA_DIR / 'action_real.npz'
            if not data_file.exists():
                data_file = DATA_DIR / 'demo.npz'
            cmd = [
                sys.executable,
                str(ROOT_DIR / 'visionfit.py'),
                'train',
                '--data', str(data_file),
                '--labels', str(ROOT_DIR / 'labels.json'),
                '--out', str(MODELS_DIR / 'action.pt'),
                '--epochs', '15'
            ]
            result = subprocess.run(cmd, capture_output=True, text=True, cwd=str(ROOT_DIR), timeout=120)
            _ACTION_MODEL = None  # Reload next time
            success = result.returncode == 0
            res = {
                'status': 'ok' if success else 'error',
                'stdout': result.stdout[-500:] if result.stdout else '',
                'stderr': result.stderr[-300:] if result.stderr else ''
            }
            self.send_response(200 if success else 500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(res).encode('utf-8'))
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))

    def handle_api_save_npz(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8')
            data = json.loads(body)
            samples = data.get('samples', [])

            if not samples:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'No samples provided'}).encode('utf-8'))
                return

            import numpy as np

            # Labels mapping
            labels_file = ROOT_DIR / 'labels.json'
            if labels_file.exists():
                labels = json.loads(labels_file.read_text(encoding='utf-8'))
            else:
                labels = ['squat', 'push_up', 'lunge', 'standing']

            label_to_idx = {lbl: idx for idx, lbl in enumerate(labels)}

            X_list, y_list, subjects_list = [], [], []

            for s in samples:
                lbl = s.get('label')
                if lbl not in label_to_idx:
                    continue
                y_list.append(label_to_idx[lbl])
                subjects_list.append(s.get('subject', 'web_user'))

                # Landmarks: 32 frames of 33 points
                raw_frames = s.get('landmarks', [])
                frame_arr = []
                for f in raw_frames[:32]:
                    pts = []
                    for pt in f[:33]:
                        pts.append([
                            float(pt.get('x', 0)),
                            float(pt.get('y', 0)),
                            float(pt.get('z', 0)),
                            float(pt.get('visibility', 1.0))
                        ])
                    # Pad to 33 points if needed
                    while len(pts) < 33:
                        pts.append([0.0, 0.0, 0.0, 0.0])
                    frame_arr.append(pts)

                # Pad to 32 frames if needed
                while len(frame_arr) < 32:
                    frame_arr.append(frame_arr[-1] if frame_arr else [[0.0]*4]*33)

                X_list.append(frame_arr[:32])

            DATA_DIR.mkdir(parents=True, exist_ok=True)
            out_file = DATA_DIR / 'web_recorded.npz'

            np.savez_compressed(
                str(out_file),
                X=np.array(X_list, dtype=np.float32),
                y=np.array(y_list, dtype=np.int64),
                subjects=np.array(subjects_list, dtype=str)
            )

            response_data = {
                'status': 'ok',
                'file': str(out_file.relative_to(ROOT_DIR)),
                'samples_count': len(y_list),
                'classes': list(set(y_list))
            }

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(response_data).encode('utf-8'))
            print(f"[VisionFit Bridge] Saved {len(y_list)} samples to {out_file}")

        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))


class ReusableHTTPServer(ThreadingHTTPServer):
    allow_reuse_address = True
    daemon_threads = True


def run_server(port=8000, open_browser=True):
    if hasattr(sys.stdout, 'reconfigure'):
        try:
            sys.stdout.reconfigure(encoding='utf-8')
        except Exception:
            pass

    print("[VisionFit] Pre-warming AI engines for instant real-time response...", flush=True)
    try:
        get_mp_detector()
        get_pose_model()
        print("[VisionFit] AI engines ready! 0ms latency on first frame.", flush=True)
    except Exception as pre_err:
        print(f"[VisionFit Pre-warm Note] {pre_err}", flush=True)

    httpd = None
    target_port = port
    candidate_ports = [port] + list(range(port + 1, port + 10)) + [8080, 8081, 8888]

    for p in candidate_ports:
        try:
            server_address = ('', p)
            httpd = ReusableHTTPServer(server_address, VisionFitWebHandler)
            target_port = p
            break
        except (PermissionError, OSError):
            continue

    if httpd is None:
        print(f"[LỖI] Không thể mở cổng mạng trong dải từ {port} đến {port + 10}.")
        return

    if target_port != port:
        print(f"[LƯU Ý] Cổng {port} đang bận bởi ứng dụng khác. Đã tự động chuyển sang cổng: {target_port}")

    url = f"http://localhost:{target_port}/index.html"
    print("=" * 60)
    print(f"[VisionFit AI Studio] Web Server dang chay tai:")
    print(f"-> {url}")
    print("=" * 60)
    print("Nhan Ctrl+C de dung server.")

    if open_browser:
        webbrowser.open(url)

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nĐang tắt web server...")
        httpd.server_close()


def main():
    parser = argparse.ArgumentParser(description="VisionFit AI Studio Web Server")
    parser.add_argument('--port', type=int, default=8000, help='Port to run web server (default: 8000)')
    parser.add_argument('--no-browser', action='store_true', help='Do not open browser automatically')
    args = parser.parse_args()

    run_server(port=args.port, open_browser=not args.no_browser)


if __name__ == '__main__':
    main()
