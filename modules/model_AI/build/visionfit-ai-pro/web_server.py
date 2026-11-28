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
from http.server import HTTPServer, SimpleHTTPRequestHandler

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
        from pose_model import load_pose_model
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
                from visionfit import load_model
                _ACTION_MODEL, _ACTION_META = load_model(str(action_path), device='cpu')
            except Exception as e:
                print(f"[ActionModel Error] Could not load {action_path}: {e}")
    return _ACTION_MODEL, _ACTION_META


_ANNOTATIONS_CACHE = None

def get_annotations():
    """Cached accessor for ground truth annotations of extracted frames."""
    global _ANNOTATIONS_CACHE
    if _ANNOTATIONS_CACHE is None:
        anno_file = ROOT_DIR / 'data' / 'extracted_frames' / 'annotations.json'
        if anno_file.is_file():
            try:
                _ANNOTATIONS_CACHE = json.loads(anno_file.read_text(encoding='utf-8'))
            except Exception as e:
                print(f"[Warn] Failed to load annotations.json: {e}", flush=True)
                _ANNOTATIONS_CACHE = {}
        else:
            _ANNOTATIONS_CACHE = {}
    return _ANNOTATIONS_CACHE


def calc_angle_3pts(a, b, c):
    """Calculates 2D angle ABC in degrees (vertex at B)."""
    import numpy as np
    ba = np.asarray(a[:2], dtype=float) - np.asarray(b[:2], dtype=float)
    bc = np.asarray(c[:2], dtype=float) - np.asarray(b[:2], dtype=float)
    norm = np.linalg.norm(ba) * np.linalg.norm(bc)
    if norm < 1e-6:
        return None
    cos_ang = np.clip(np.dot(ba, bc) / norm, -1.0, 1.0)
    return float(np.degrees(np.arccos(cos_ang)))


def calc_torso_lean(hip, shoulder):
    """Calculates torso inclination angle relative to vertical in degrees."""
    import numpy as np
    dx = shoulder[0] - hip[0]
    dy = shoulder[1] - hip[1]
    return float(np.degrees(np.arctan2(abs(dx), max(1e-6, -dy))))


def evaluate_biomechanics(pts_dict_or_list):
    """Dynamically calculates squat angles and form evaluation from landmarks."""
    if not pts_dict_or_list:
        return None
    pts = {}
    if isinstance(pts_dict_or_list, list):
        for idx, p in enumerate(pts_dict_or_list):
            if isinstance(p, dict):
                pts[idx] = [p.get('x', 0), p.get('y', 0)]
            elif isinstance(p, (list, tuple)):
                pts[idx] = [p[0], p[1]]
    elif isinstance(pts_dict_or_list, dict):
        for k, v in pts_dict_or_list.items():
            idx = int(k) if str(k).isdigit() else k
            if isinstance(v, dict):
                pts[idx] = [v.get('x', 0), v.get('y', 0)]
            elif isinstance(v, (list, tuple)):
                pts[idx] = [v[0], v[1]]

    res = {
        'left_knee_angle': None,
        'right_knee_angle': None,
        'knee_angle': None,
        'torso_lean': None,
        'hip_angle': None,
        'knee_valgus_ratio': None,
        'squat_depth': 'UNKNOWN',
        'verdict': 'INCOMPLETE',
        'feedback': []
    }

    # Left Knee: Hip(23) - Knee(25) - Ankle(27)
    if 23 in pts and 25 in pts and 27 in pts:
        ang = calc_angle_3pts(pts[23], pts[25], pts[27])
        if ang is not None:
            res['left_knee_angle'] = round(ang, 1)

    # Right Knee: Hip(24) - Knee(26) - Ankle(28)
    if 24 in pts and 26 in pts and 28 in pts:
        ang = calc_angle_3pts(pts[24], pts[26], pts[28])
        if ang is not None:
            res['right_knee_angle'] = round(ang, 1)

    # Active knee angle
    if res['right_knee_angle'] is not None and res['left_knee_angle'] is not None:
        res['knee_angle'] = min(res['left_knee_angle'], res['right_knee_angle'])
    elif res['right_knee_angle'] is not None:
        res['knee_angle'] = res['right_knee_angle']
    elif res['left_knee_angle'] is not None:
        res['knee_angle'] = res['left_knee_angle']

    # Torso Lean: Shoulder(11/12) - Hip(23/24)
    sh = pts.get(12) or pts.get(11)
    hp = pts.get(24) or pts.get(23)
    if sh and hp:
        res['torso_lean'] = round(calc_torso_lean(hp, sh), 1)

    # Hip Angle: Shoulder - Hip - Knee
    if sh and hp and (pts.get(26) or pts.get(25)):
        kn = pts.get(26) or pts.get(25)
        hang = calc_angle_3pts(sh, hp, kn)
        if hang is not None:
            res['hip_angle'] = round(hang, 1)

    # Knee Valgus: (Left Knee - Right Knee) / (Left Ankle - Right Ankle)
    if 25 in pts and 26 in pts and 27 in pts and 28 in pts:
        knee_dist = abs(pts[25][0] - pts[26][0])
        ankle_dist = abs(pts[27][0] - pts[28][0])
        if ankle_dist > 1e-4:
            res['knee_valgus_ratio'] = round(knee_dist / ankle_dist, 2)

    # Evaluation
    is_good = True
    if res['knee_angle'] is not None:
        if res['knee_angle'] <= 80.0:
            res['squat_depth'] = 'DEEP_SQUAT'
            res['feedback'].append(f"Góc gối {res['knee_angle']}°: Squat sâu (Deep Squat - Đùi dưới song song mặt đất)")
        elif res['knee_angle'] <= 100.0:
            res['squat_depth'] = 'PARALLEL_SQUAT'
            res['feedback'].append(f"Góc gối {res['knee_angle']}°: Squat song song (Parallel Squat - Đạt chuẩn PT)")
        elif res['knee_angle'] <= 135.0:
            res['squat_depth'] = 'PARTIAL_SQUAT'
            res['feedback'].append(f"Góc gối {res['knee_angle']}°: Squat nông (Chưa hạ đủ độ sâu, cần hạ hông thấp hơn)")
            is_good = False
        else:
            res['squat_depth'] = 'STANDING'
            res['feedback'].append(f"Góc gối {res['knee_angle']}°: Tư thế đứng thẳng / Bắt đầu")

    if res['torso_lean'] is not None:
        if res['torso_lean'] > 45.0:
            res['feedback'].append(f"Cảnh báo: Thân trên gập về trước quá mức ({res['torso_lean']}° > 45°), dễ đau lưng dưới!")
            is_good = False
        else:
            res['feedback'].append(f"Độ nghiêng lưng chuẩn ({res['torso_lean']}°)")

    if res['knee_valgus_ratio'] is not None:
        if res['knee_valgus_ratio'] < 0.70:
            res['feedback'].append(f"Cảnh báo: Sụp gối vào trong (Tỷ lệ {res['knee_valgus_ratio']}), cần mở rộng gối theo hướng mũi chân!")
            is_good = False
        else:
            res['feedback'].append(f"Khớp gối thẳng hàng với cổ chân ({res['knee_valgus_ratio']})")

    if res['knee_angle'] is not None:
        res['verdict'] = 'GOOD_FORM' if is_good and res['squat_depth'] in ('DEEP_SQUAT', 'PARALLEL_SQUAT') else ('STANDING' if res['squat_depth'] == 'STANDING' else 'BAD_FORM')

    return res


class VisionFitWebHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(WEB_DIR), **kwargs)

    def translate_path(self, path):
        clean_path = path.split('?', 1)[0].split('#', 1)[0]
        if clean_path.startswith('/reports/') or clean_path.startswith('/videos/') or clean_path.startswith('/data/'):
            return str(ROOT_DIR / clean_path.lstrip('/'))
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
        elif self.path == '/api/extracted_frames':
            self.handle_api_extracted_frames()
            return
        elif self.path.startswith('/api/frame_details'):
            self.handle_api_frame_details()
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
        elif self.path == '/api/analyze_incline_press':
            self.handle_api_analyze_incline_press()
            return
        elif self.path == '/api/analyze_manual_landmarks':
            self.handle_api_analyze_manual_landmarks()
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

            from urllib.parse import urlparse, parse_qs
            parsed = urlparse(self.path)
            qs = parse_qs(parsed.query)
            filename = qs.get('filename', ['uploaded_video.mp4'])[0]
            safe_name = Path(filename).name
            if not safe_name.lower().endswith(('.mp4', '.mov', '.avi', '.webm', '.mkv')):
                safe_name += '.mp4'

            dest_dir = ROOT_DIR / 'videos' / 'squat'
            dest_dir.mkdir(parents=True, exist_ok=True)
            dest_file = dest_dir / safe_name

            bytes_left = content_length
            with open(dest_file, 'wb') as f:
                while bytes_left > 0:
                    chunk = self.rfile.read(min(bytes_left, 65536))
                    if not chunk:
                        break
                    f.write(chunk)
                    bytes_left -= len(chunk)

            from visionfit import analyze_squat_video
            out_video = ROOT_DIR / 'reports' / 'squat' / f'{dest_file.stem}_annotated.mp4'
            out_report = ROOT_DIR / 'reports' / 'squat' / f'{dest_file.stem}_report.json'

            report = analyze_squat_video(
                dest_file,
                out_video_path=out_video,
                report_path=out_report,
            )

            payload = {
                'status': 'ok',
                'video': dest_file.name,
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

            video_file = ROOT_DIR / video_input
            if not video_file.is_file():
                video_file = ROOT_DIR / 'videos' / 'squat' / Path(video_input).name
            if not video_file.is_file():
                video_file = ROOT_DIR / 'videos' / video_input
            if not video_file.is_file():
                raise FileNotFoundError(f'Video file not found: {video_input}')

            from visionfit import analyze_squat_video
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

            from visionfit import analyze_incline_press_video
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

    def handle_api_list_videos(self):
        squat_dir = ROOT_DIR / 'videos' / 'squat'
        incline_dir = ROOT_DIR / 'videos' / 'incline_press'
        squat_videos = []
        incline_videos = []
        if squat_dir.is_dir():
            squat_videos = sorted([f.name for f in squat_dir.glob('*.mp4')])
        if incline_dir.is_dir():
            incline_videos = sorted([f.name for f in incline_dir.glob('*.mp4')])
        payload = {
            'status': 'ok',
            'squat_videos': squat_videos,
            'incline_press_videos': incline_videos,
            'push_up_videos': [],
            'lunge_videos': [],
        }
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(payload, ensure_ascii=False).encode('utf-8'))

    def handle_api_extracted_frames(self):
        frames_dir = ROOT_DIR / 'data' / 'extracted_frames'
        subjects = {}
        total = 0
        if frames_dir.is_dir():
            for sub_dir in sorted(frames_dir.iterdir()):
                if sub_dir.is_dir() and not sub_dir.name.startswith('.'):
                    f_list = sorted([f.name for f in sub_dir.glob('*.jpg')])
                    if f_list:
                        subjects[sub_dir.name] = f_list
                        total += len(f_list)
        payload = {
            'status': 'ok',
            'subjects': subjects,
            'total_frames': total
        }
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(payload, ensure_ascii=False).encode('utf-8'))

    def handle_api_frame_details(self):
        try:
            from urllib.parse import urlparse, parse_qs
            import cv2
            import numpy as np
            from pose_model import IMAGE_SIZE, infer_rgb

            parsed = urlparse(self.path)
            qs = parse_qs(parsed.query)
            rel_path = qs.get('path', [''])[0].strip().lstrip('/')
            if not rel_path:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Missing path parameter'}).encode('utf-8'))
                return

            full_img_path = ROOT_DIR / 'data' / 'extracted_frames' / rel_path
            if not full_img_path.is_file():
                self.send_response(404)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': f'Image file not found: {rel_path}'}).encode('utf-8'))
                return

            bgr = cv2.imread(str(full_img_path))
            if bgr is None:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Failed to read image'}).encode('utf-8'))
                return

            orig_h, orig_w = bgr.shape[:2]
            rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
            rgb_128 = cv2.resize(rgb, (IMAGE_SIZE, IMAGE_SIZE), interpolation=cv2.INTER_AREA)

            # Ground truth
            anno = get_annotations()
            gt_info = anno.get(rel_path, {})
            gt_kpts = gt_info.get('keypoints_33', None)

            # PoseNet Prediction
            pose_model = get_pose_model()
            pred_kpts = infer_rgb(pose_model, rgb_128, device='cpu').tolist()

            gt_biomech = evaluate_biomechanics(gt_kpts) if gt_kpts else None
            pred_biomech = evaluate_biomechanics(pred_kpts)

            metrics = {}
            if gt_kpts and len(gt_kpts) == 33:
                gt_arr = np.asarray(gt_kpts)[:, :2]
                pred_arr = np.asarray(pred_kpts)[:, :2]
                diff = np.linalg.norm(pred_arr - gt_arr, axis=-1)
                metrics['pixel_mae_128'] = round(float(np.mean(diff) * IMAGE_SIZE), 2)
                metrics['pixel_mae_orig'] = round(float(np.mean(diff) * max(orig_w, orig_h)), 2)

                shoulder_c = (gt_arr[11] + gt_arr[12]) / 2.0
                hip_c = (gt_arr[23] + gt_arr[24]) / 2.0
                torso = float(np.linalg.norm(shoulder_c - hip_c))
                if torso < 0.05:
                    torso = 0.25

                metrics['pck05'] = round(float((diff <= 0.05 * torso).mean() * 100.0), 1)
                metrics['pck10'] = round(float((diff <= 0.10 * torso).mean() * 100.0), 1)
                metrics['pck20'] = round(float((diff <= 0.20 * torso).mean() * 100.0), 1)

                if gt_biomech and gt_biomech.get('knee_angle') is not None and pred_biomech.get('knee_angle') is not None:
                    metrics['knee_angle_diff'] = round(abs(pred_biomech['knee_angle'] - gt_biomech['knee_angle']), 1)
                if gt_biomech and gt_biomech.get('torso_lean') is not None and pred_biomech.get('torso_lean') is not None:
                    metrics['torso_lean_diff'] = round(abs(pred_biomech['torso_lean'] - gt_biomech['torso_lean']), 1)

            res = {
                'status': 'ok',
                'path': rel_path,
                'image_url': f'/data/extracted_frames/{rel_path}',
                'image_size': [orig_w, orig_h],
                'gt': {
                    'keypoints': gt_kpts,
                    'biomechanics': gt_biomech
                },
                'pred': {
                    'keypoints': pred_kpts,
                    'biomechanics': pred_biomech
                },
                'metrics': metrics
            }
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(res, ensure_ascii=False).encode('utf-8'))
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))

    def handle_api_analyze_manual_landmarks(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8')
            data = json.loads(body)

            points = data.get('points', {})
            quick_points = data.get('quick_points', [])

            manual_biomech = evaluate_biomechanics(points)
            if manual_biomech is None:
                manual_biomech = {
                    'left_knee_angle': None,
                    'right_knee_angle': None,
                    'knee_angle': None,
                    'torso_lean': None,
                    'hip_angle': None,
                    'knee_valgus_ratio': None,
                    'squat_depth': 'UNKNOWN',
                    'verdict': 'INCOMPLETE',
                    'feedback': []
                }

            if quick_points and len(quick_points) >= 3:
                p0 = [quick_points[0]['x'], quick_points[0]['y']] if isinstance(quick_points[0], dict) else quick_points[0]
                p1 = [quick_points[1]['x'], quick_points[1]['y']] if isinstance(quick_points[1], dict) else quick_points[1]
                p2 = [quick_points[2]['x'], quick_points[2]['y']] if isinstance(quick_points[2], dict) else quick_points[2]
                knee_ang = calc_angle_3pts(p0, p1, p2)
                if knee_ang is not None:
                    manual_biomech['knee_angle'] = round(knee_ang, 1)
                    if knee_ang <= 80:
                        manual_biomech['squat_depth'] = 'DEEP_SQUAT'
                        manual_biomech['feedback'].append(f"Góc gối tự chấm {manual_biomech['knee_angle']}°: Squat sâu (Deep Squat - Đạt chuẩn PT)")
                        manual_biomech['verdict'] = 'GOOD_FORM'
                    elif knee_ang <= 100:
                        manual_biomech['squat_depth'] = 'PARALLEL_SQUAT'
                        manual_biomech['feedback'].append(f"Góc gối tự chấm {manual_biomech['knee_angle']}°: Squat song song (Parallel Squat)")
                        manual_biomech['verdict'] = 'GOOD_FORM'
                    elif knee_ang <= 135:
                        manual_biomech['squat_depth'] = 'PARTIAL_SQUAT'
                        manual_biomech['feedback'].append(f"Góc gối tự chấm {manual_biomech['knee_angle']}°: Squat nông (Chưa hạ đủ độ sâu)")
                        manual_biomech['verdict'] = 'BAD_FORM'
                    else:
                        manual_biomech['squat_depth'] = 'STANDING'
                        manual_biomech['feedback'].append(f"Góc gối tự chấm {manual_biomech['knee_angle']}°: Tư thế đứng thẳng")
                        manual_biomech['verdict'] = 'STANDING'

            if quick_points and len(quick_points) == 2:
                p0 = [quick_points[0]['x'], quick_points[0]['y']] if isinstance(quick_points[0], dict) else quick_points[0]
                p1 = [quick_points[1]['x'], quick_points[1]['y']] if isinstance(quick_points[1], dict) else quick_points[1]
                lean = calc_torso_lean(p1, p0)
                manual_biomech['torso_lean'] = round(lean, 1)
                if lean > 45:
                    manual_biomech['feedback'].append(f"Góc lưng tự chấm {manual_biomech['torso_lean']}°: Cảnh báo gập lưng quá mức (> 45°)")
                else:
                    manual_biomech['feedback'].append(f"Góc lưng tự chấm {manual_biomech['torso_lean']}°: Độ nghiêng thân chuẩn")

            res = {
                'status': 'ok',
                'manual_biomechanics': manual_biomech
            }
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(res, ensure_ascii=False).encode('utf-8'))
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

            # 100% Self-Trained VisionFit PoseNet (Dual-Head BodyPoseNet 5.25M params)
            from pose_model import IMAGE_SIZE, infer_rgb
            h, w = rgb.shape[:2]
            scale = min(IMAGE_SIZE / h, IMAGE_SIZE / w)
            nh, nw = max(1, int(h * scale)), max(1, int(w * scale))
            resized = cv2.resize(rgb, (nw, nh), interpolation=cv2.INTER_AREA)
            canvas = np.zeros((IMAGE_SIZE, IMAGE_SIZE, 3), dtype=np.uint8)
            top = (IMAGE_SIZE - nh) // 2
            left = (IMAGE_SIZE - nw) // 2
            canvas[top:top+nh, left:left+nw] = resized

            pose_net = get_pose_model()
            if pose_net is None:
                raise RuntimeError('PoseNet model (models/pose_custom.pt) is not loaded')

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
            self.wfile.write(json.dumps({'status': 'ok', 'engine': 'VisionFit_PoseNet_DualHead', 'landmarks': landmarks}).encode('utf-8'))
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
            from visionfit import normalize, resample

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


class ReusableHTTPServer(HTTPServer):
    allow_reuse_address = True


def run_server(port=8000, open_browser=True):
    if hasattr(sys.stdout, 'reconfigure'):
        try:
            sys.stdout.reconfigure(encoding='utf-8')
        except Exception:
            pass

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
