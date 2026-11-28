import sys
from pathlib import Path
_ROOT = Path(__file__).resolve().parent.parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

"""Calculate Biomechanical Angle MAE (Knee Angle & Torso Angle) between
VisionFit Dual-Head PoseNet and Ground Truth across real exercise videos.
"""
import sys
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parent
sys.path.append(str(ROOT))

from core.pose_model import load_pose_model, infer_rgb, IMAGE_SIZE

def compute_angle(a, b, c):
    # Angle at vertex b (a - b - c)
    v1 = a - b
    v2 = c - b
    cos_th = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2) + 1e-6)
    return np.degrees(np.arccos(np.clip(cos_th, -1.0, 1.0)))

def main():
    model_path = ROOT / 'models' / 'pose_custom.pt'
    data_path = ROOT / 'data' / 'pose_multiview_squat.npz'
    
    print(f"[Angle MAE Eval] Loading model {model_path}...")
    model = load_pose_model(model_path, device='cpu')
    
    print(f"[Angle MAE Eval] Loading dataset {data_path}...")
    z = np.load(data_path, allow_pickle=True)
    imgs = z['images']
    kps = z['keypoints']
    subs = np.array([str(s) for s in z['subjects']])
    
    knee_errors = []
    torso_errors = []
    
    for i in range(len(imgs)):
        pred = infer_rgb(model, imgs[i])
        gt = kps[i]
        
        # Determine dominant side from visibility
        r_vis = pred[24, 3] + pred[26, 3] + pred[28, 3]
        l_vis = pred[23, 3] + pred[25, 3] + pred[27, 3]
        side = 'right' if r_vis >= l_vis else 'left'
        
        h_idx = 24 if side == 'right' else 23
        k_idx = 26 if side == 'right' else 25
        a_idx = 28 if side == 'right' else 27
        s_idx = 12 if side == 'right' else 11
        
        # Knee angle: Hip -> Knee -> Ankle
        p_knee = compute_angle(pred[h_idx, :2], pred[k_idx, :2], pred[a_idx, :2])
        g_knee = compute_angle(gt[h_idx, :2], gt[k_idx, :2], gt[a_idx, :2])
        knee_errors.append(abs(p_knee - g_knee))
        
        # Torso angle: Shoulder -> Hip vector relative to vertical
        p_t_vec = pred[s_idx, :2] - pred[h_idx, :2]
        g_t_vec = gt[s_idx, :2] - gt[h_idx, :2]
        p_torso = np.degrees(np.arctan2(abs(p_t_vec[0]), abs(p_t_vec[1]) + 1e-6))
        g_torso = np.degrees(np.arctan2(abs(g_t_vec[0]), abs(g_t_vec[1]) + 1e-6))
        torso_errors.append(abs(p_torso - g_torso))
        
    print("\n" + "=" * 65)
    print("      BIOMECHANICAL ANGLE ACCURACY EVALUATION (3,575 FRAMES)")
    print("=" * 65)
    print(f"Knee Angle MAE   : {np.mean(knee_errors):.2f}°  (Median: {np.median(knee_errors):.2f}°)")
    print(f"Torso Angle MAE  : {np.mean(torso_errors):.2f}°  (Median: {np.median(torso_errors):.2f}°)")
    print(f"% Frames with Knee Error < 5.0° : {(np.array(knee_errors) < 5.0).mean() * 100:.1f}%")
    print(f"% Frames with Knee Error < 8.0° : {(np.array(knee_errors) < 8.0).mean() * 100:.1f}%")
    print("=" * 65)

if __name__ == '__main__':
    main()
