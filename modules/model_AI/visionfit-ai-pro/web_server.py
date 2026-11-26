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
WEB_DIR = ROOT_DIR / 'web'
DATA_DIR = ROOT_DIR / 'data'
MODELS_DIR = ROOT_DIR / 'models'


_POSE_MODEL = None
_ACTION_MODEL = None
_ACTION_META = None


def get_pose_model():
    global _POSE_MODEL
    if _POSE_MODEL is None:
        pose_path = MODELS_DIR / 'pose.pt'
        if not pose_path.exists():
            demo_data = DATA_DIR / 'pose_demo.npz'
            if demo_data.exists():
                import subprocess
                subprocess.run(
                    [sys.executable, str(ROOT_DIR / 'pose_model.py'), 'train', '--data', str(demo_data), '--out', str(pose_path), '--epochs', '5'],
                    cwd=str(ROOT_DIR),
                    timeout=60
                )
        if pose_path.exists():
            try:
                from pose_model import load_pose_model
                _POSE_MODEL = load_pose_model(str(pose_path), device='cpu')
            except Exception as e:
                print(f"[PoseModel Error] Could not load {pose_path}: {e}")
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


class VisionFitWebHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(WEB_DIR), **kwargs)

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

    def do_GET(self):
        # Handle API routes
        if self.path == '/api/status':
            self.handle_api_status()
            return
        elif self.path == '/api/dataset':
            self.handle_api_dataset()
            return
        
        # Default static file serving
        super().do_GET()

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
        
        self.send_error(404, 'API endpoint not found')

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
            'pose_model_ready': (MODELS_DIR / 'pose.pt').exists(),
            'action_model_ready': (MODELS_DIR / 'action.pt').exists() or (MODELS_DIR / 'action_demo.pt').exists()
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
            from pose_detector import estimate_pose_from_bgr

            header, encoded = img_b64.split(',', 1) if ',' in img_b64 else ('', img_b64)
            img_bytes = base64.b64decode(encoded)
            nparr = np.frombuffer(img_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if img is None:
                raise ValueError('Cannot decode image')

            # Use local high-precision Anatomical Pose Estimator (zero external model)
            pts = estimate_pose_from_bgr(img)  # shape: (33, 4)

            landmarks = []
            for i in range(len(pts)):
                landmarks.append({
                    'x': float(pts[i, 0]),
                    'y': float(pts[i, 1]),
                    'z': float(pts[i, 2]),
                    'visibility': float(pts[i, 3])
                })

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'status': 'ok', 'landmarks': landmarks}).encode('utf-8'))
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
