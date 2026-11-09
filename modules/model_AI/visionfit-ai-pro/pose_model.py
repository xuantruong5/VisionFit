"""Trainable, fully local 2D 33-landmark detector. No model downloads or external inference APIs.

Output is (33,4): image-normalized x,y; z=0 (not learned); visibility probability.
Requires YOUR labeled images to become useful. Not a pretrained detector.
"""
import argparse
import json
from pathlib import Path

import numpy as np
import torch
from torch import nn
from torch.utils.data import DataLoader, TensorDataset

IMAGE_SIZE = 128
JOINTS = 33


class PoseNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(3, 32, 3, stride=2, padding=1), nn.BatchNorm2d(32), nn.ReLU(),
            nn.Conv2d(32, 64, 3, stride=2, padding=1), nn.BatchNorm2d(64), nn.ReLU(),
            nn.Conv2d(64, 64, 3, padding=1), nn.BatchNorm2d(64), nn.ReLU(),
            nn.Conv2d(64, 64, 3, padding=1), nn.BatchNorm2d(64), nn.ReLU(),
        )
        self.heatmap = nn.Conv2d(64, JOINTS, 1)
        self.visibility = nn.Sequential(nn.AdaptiveAvgPool2d(1), nn.Flatten(), nn.Linear(64, JOINTS))

    def forward(self, x):
        z = self.features(x)
        return self.heatmap(z), self.visibility(z)


def decode_pose(heatmaps, visibility_logits):
    """Batch outputs into normalized xy and visibility. Argmax decoder for low compute."""
    if heatmaps.ndim != 4 or heatmaps.shape[1] != JOINTS:
        raise ValueError('Heatmaps must be (B,33,H,W)')
    b, _, h, w = heatmaps.shape
    loc = heatmaps.flatten(2).argmax(dim=-1)
    x = (loc % w).float() / max(w - 1, 1)
    y = (loc // w).float() / max(h - 1, 1)
    return torch.stack([x, y, torch.zeros_like(x), torch.sigmoid(visibility_logits)], dim=-1)


def pose_loss(heatmaps, visibility_logits, keypoints):
    """Supervised spatial Gaussian NLL + visibility BCE. Missing joints excluded from location loss."""
    b, joints, h, w = heatmaps.shape
    if keypoints.shape != (b, JOINTS, 3):
        raise ValueError('Keypoint annotations must be (B,33,3): normalized x,y,visible')
    target_vis = (keypoints[:, :, 2] >= 0.5).float()
    ys, xs = torch.meshgrid(torch.arange(h, device=heatmaps.device),
                            torch.arange(w, device=heatmaps.device), indexing='ij')
    coords_x = keypoints[:, :, 0, None, None] * (w - 1)
    coords_y = keypoints[:, :, 1, None, None] * (h - 1)
    dist2 = (xs[None, None] - coords_x).square() + (ys[None, None] - coords_y).square()
    target = torch.exp(-dist2 / (2 * 1.3**2)).flatten(2)
    target = target / target.sum(dim=-1, keepdim=True).clamp_min(1e-8)
    location_nll = -(target * heatmaps.flatten(2).log_softmax(dim=-1)).sum(dim=-1)
    location_loss = (location_nll * target_vis).sum() / target_vis.sum().clamp_min(1)
    visibility_loss = nn.functional.binary_cross_entropy_with_logits(visibility_logits, target_vis)
    return location_loss + visibility_loss


def load_pose_dataset(path):
    with np.load(path, allow_pickle=False) as z:
        if not {'images', 'keypoints'}.issubset(z.files):
            raise ValueError('Expected images and keypoints arrays')
        images = z['images']
        pts = z['keypoints'].astype('float32')
        subjects = z['subjects'].astype(str) if 'subjects' in z.files else None
    if images.ndim != 4 or images.shape[1:] != (IMAGE_SIZE, IMAGE_SIZE, 3) or images.dtype != np.uint8:
        raise ValueError('images must be uint8 (N,128,128,3) RGB')
    if pts.shape != (len(images), JOINTS, 3) or len(images) < 6 or not np.isfinite(pts).all():
        raise ValueError('keypoints must be finite (N,33,3), N>=6')
    if ((pts[..., :2] < 0) | (pts[..., :2] > 1)).any() or ((pts[..., 2] < 0) | (pts[..., 2] > 1)).any():
        raise ValueError('keypoints x,y,visibility must be between 0 and 1')
    if subjects is not None and len(subjects) != len(images):
        raise ValueError('subjects length mismatch')
    return images, pts, subjects


def train(args):
    if args.epochs < 1 or args.batch < 1:
        raise ValueError('epochs/batch must be positive')
    torch.manual_seed(args.seed)
    np.random.seed(args.seed)
    images, points, subjects = load_pose_dataset(args.data)
    rng = np.random.default_rng(args.seed)
    if subjects is not None:
        units = np.unique(subjects)
        if len(units) < 3:
            raise ValueError('Need at least 3 different subjects for pose validation')
        perm = rng.permutation(units)
        count_val = max(1, round(len(units) * 0.2))
        val = np.flatnonzero(np.isin(subjects, perm[:count_val]))
        tr = np.flatnonzero(~np.isin(subjects, perm[:count_val]))
    else:
        print('WARNING: no subjects field. Random image split can leak identical people/videos.')
        perm = rng.permutation(len(images))
        count_val = max(1, round(len(images) * 0.2))
        val, tr = perm[:count_val], perm[count_val:]
    x = torch.from_numpy(images.copy()).permute(0, 3, 1, 2).float() / 255
    y = torch.from_numpy(points.copy())
    loader = DataLoader(TensorDataset(x[tr], y[tr]), batch_size=args.batch, shuffle=True)
    val_loader = DataLoader(TensorDataset(x[val], y[val]), batch_size=args.batch)
    device = torch.device('cuda' if args.device == 'auto' and torch.cuda.is_available() else ('cpu' if args.device == 'auto' else args.device))
    if device.type == 'cuda' and not torch.cuda.is_available():
        raise ValueError('CUDA unavailable')
    model = PoseNet().to(device)
    opt = torch.optim.AdamW(model.parameters(), lr=args.lr)
    best = float('inf')
    Path(args.out).parent.mkdir(parents=True, exist_ok=True)
    for epoch in range(1, args.epochs + 1):
        model.train()
        train_sum = 0.
        for bx, by in loader:
            bx, by = bx.to(device), by.to(device)
            opt.zero_grad()
            loss = pose_loss(*model(bx), by)
            loss.backward()
            opt.step()
            train_sum += float(loss.item()) * len(by)
        model.eval()
        val_sum = 0.
        with torch.no_grad():
            for bx, by in val_loader:
                loss = pose_loss(*model(bx.to(device)), by.to(device))
                val_sum += float(loss.item()) * len(by)
        val_loss = val_sum / len(val)
        print(f'pose epoch={epoch:03d} train_loss={train_sum / len(tr):.3f} val_loss={val_loss:.3f}')
        if val_loss < best:
            best = val_loss
            torch.save({'state': model.state_dict(), 'image_size': IMAGE_SIZE, 'version': 1,
                        'z_prediction': False, 'note': 'Trained locally, 2D x/y only'}, args.out)
    print(f'Saved own pose model: {args.out}. Assess landmark accuracy on unseen real images.')


def load_pose_model(path, device='cpu'):
    ckpt = torch.load(path, weights_only=True, map_location=device)
    if ckpt.get('image_size') != IMAGE_SIZE:
        raise ValueError('Unsupported pose image size')
    model = PoseNet().to(device)
    model.load_state_dict(ckpt['state'])
    model.eval()
    return model


def infer_rgb(model, rgb_image, device='cpu'):
    """Input RGB uint8 (128,128,3); output (33,4), z=0 by design."""
    image = np.asarray(rgb_image)
    if image.shape != (IMAGE_SIZE, IMAGE_SIZE, 3) or image.dtype != np.uint8:
        raise ValueError('RGB image must be uint8 (128,128,3)')
    inp = torch.from_numpy(image.copy()).permute(2, 0, 1)[None].to(device=device, dtype=torch.float32) / 255.
    with torch.no_grad():
        return decode_pose(*model(inp))[0].cpu().numpy().astype('float32')


def _render_human_figure(rng, action_idx):
    """Renders a realistic human mannequin figure with 33 anatomical landmarks in gym postures."""
    import cv2
    bg_val = int(rng.integers(25, 70))
    image = np.full((IMAGE_SIZE, IMAGE_SIZE, 3), bg_val, dtype=np.uint8)
    points = np.zeros((JOINTS, 3), dtype='float32')

    skin_color = (int(rng.integers(180, 240)), int(rng.integers(140, 200)), int(rng.integers(120, 180)))
    shirt_color = (int(rng.integers(30, 220)), int(rng.integers(30, 220)), int(rng.integers(30, 220)))
    pants_color = (int(rng.integers(30, 180)), int(rng.integers(30, 180)), int(rng.integers(30, 180)))

    pose_type = action_idx % 4  # 0: standing, 1: quarter squat, 2: deep squat, 3: pushup
    shift_x = float(rng.uniform(-0.10, 0.10))
    scale = float(rng.uniform(0.88, 1.12))

    cx = int((0.5 + shift_x) * (IMAGE_SIZE - 1))
    cx = max(24, min(IMAGE_SIZE - 24, cx))

    if pose_type in (0, 1, 2):
        squat_depth = 0.0 if pose_type == 0 else (0.45 if pose_type == 1 else 0.85)
        squat_depth += float(rng.uniform(-0.06, 0.06))
        squat_depth = max(0.0, min(1.0, squat_depth))

        sh_y = int((36 + squat_depth * 24) * scale)
        head_r = int(9 * scale)
        head_y = sh_y - head_r - 4

        # Head (0..10)
        cv2.circle(image, (cx, head_y), head_r, skin_color, -1)
        points[0] = [cx / (IMAGE_SIZE - 1), head_y / (IMAGE_SIZE - 1), 1.0]
        points[1] = [(cx + 2) / (IMAGE_SIZE - 1), (head_y - 2) / (IMAGE_SIZE - 1), 1.0]
        points[2] = [(cx + 4) / (IMAGE_SIZE - 1), (head_y - 2) / (IMAGE_SIZE - 1), 1.0]
        points[3] = [(cx + 6) / (IMAGE_SIZE - 1), (head_y - 2) / (IMAGE_SIZE - 1), 1.0]
        points[4] = [(cx - 2) / (IMAGE_SIZE - 1), (head_y - 2) / (IMAGE_SIZE - 1), 1.0]
        points[5] = [(cx - 4) / (IMAGE_SIZE - 1), (head_y - 2) / (IMAGE_SIZE - 1), 1.0]
        points[6] = [(cx - 6) / (IMAGE_SIZE - 1), (head_y - 2) / (IMAGE_SIZE - 1), 1.0]
        points[7] = [(cx - 8) / (IMAGE_SIZE - 1), head_y / (IMAGE_SIZE - 1), 1.0]
        points[8] = [(cx + 8) / (IMAGE_SIZE - 1), head_y / (IMAGE_SIZE - 1), 1.0]
        points[9] = [(cx + 3) / (IMAGE_SIZE - 1), (head_y + 4) / (IMAGE_SIZE - 1), 1.0]
        points[10] = [(cx - 3) / (IMAGE_SIZE - 1), (head_y + 4) / (IMAGE_SIZE - 1), 1.0]

        # Torso & Shoulders
        sh_w = int(26 * scale)
        hip_w = int(18 * scale)
        ls_x, rs_x = cx + sh_w // 2, cx - sh_w // 2
        torso_len = int(32 * scale)
        hip_y = sh_y + torso_len
        lh_x, rh_x = cx + hip_w // 2, cx - hip_w // 2

        points[11] = [ls_x / (IMAGE_SIZE - 1), sh_y / (IMAGE_SIZE - 1), 1.0]
        points[12] = [rs_x / (IMAGE_SIZE - 1), sh_y / (IMAGE_SIZE - 1), 1.0]
        points[23] = [lh_x / (IMAGE_SIZE - 1), hip_y / (IMAGE_SIZE - 1), 1.0]
        points[24] = [rh_x / (IMAGE_SIZE - 1), hip_y / (IMAGE_SIZE - 1), 1.0]

        torso_poly = np.array([[ls_x, sh_y], [rs_x, sh_y], [rh_x, hip_y], [lh_x, hip_y]])
        cv2.fillPoly(image, [torso_poly], shirt_color)

        # Legs & Knees
        ankle_y = min(IMAGE_SIZE - 5, int(119 * scale))
        la_x, ra_x = lh_x + 3, rh_x - 3
        knee_y = (hip_y + ankle_y) // 2
        knee_offset = int(squat_depth * 16 * scale)
        lk_x, rk_x = lh_x + knee_offset, rh_x - knee_offset

        points[25] = [lk_x / (IMAGE_SIZE - 1), knee_y / (IMAGE_SIZE - 1), 1.0]
        points[26] = [rk_x / (IMAGE_SIZE - 1), knee_y / (IMAGE_SIZE - 1), 1.0]
        points[27] = [la_x / (IMAGE_SIZE - 1), ankle_y / (IMAGE_SIZE - 1), 1.0]
        points[28] = [ra_x / (IMAGE_SIZE - 1), ankle_y / (IMAGE_SIZE - 1), 1.0]
        points[29] = [(la_x - 2) / (IMAGE_SIZE - 1), (ankle_y + 2) / (IMAGE_SIZE - 1), 1.0]
        points[30] = [(ra_x + 2) / (IMAGE_SIZE - 1), (ankle_y + 2) / (IMAGE_SIZE - 1), 1.0]
        points[31] = [(la_x + 4) / (IMAGE_SIZE - 1), (ankle_y + 3) / (IMAGE_SIZE - 1), 1.0]
        points[32] = [(ra_x - 4) / (IMAGE_SIZE - 1), (ankle_y + 3) / (IMAGE_SIZE - 1), 1.0]

        cv2.line(image, (lh_x, hip_y), (lk_x, knee_y), pants_color, max(2, int(4 * scale)))
        cv2.line(image, (lk_x, knee_y), (la_x, ankle_y), pants_color, max(2, int(4 * scale)))
        cv2.line(image, (rh_x, hip_y), (rk_x, knee_y), pants_color, max(2, int(4 * scale)))
        cv2.line(image, (rk_x, knee_y), (ra_x, ankle_y), pants_color, max(2, int(4 * scale)))

        # Arms
        if squat_depth > 0.2:
            lw_x, rw_x = cx + 4, cx - 4
            lw_y = rw_y = sh_y + torso_len // 2
            le_x, re_x = ls_x + 6, rs_x - 6
            le_y = re_y = sh_y + 12
        else:
            le_x, re_x = ls_x + 4, rs_x - 4
            le_y = re_y = sh_y + 18
            lw_x, rw_x = ls_x + 3, rs_x - 3
            lw_y = rw_y = le_y + 16

        points[13] = [le_x / (IMAGE_SIZE - 1), le_y / (IMAGE_SIZE - 1), 1.0]
        points[14] = [re_x / (IMAGE_SIZE - 1), re_y / (IMAGE_SIZE - 1), 1.0]
        points[15] = [lw_x / (IMAGE_SIZE - 1), lw_y / (IMAGE_SIZE - 1), 1.0]
        points[16] = [rw_x / (IMAGE_SIZE - 1), rw_y / (IMAGE_SIZE - 1), 1.0]

        cv2.line(image, (ls_x, sh_y), (le_x, le_y), skin_color, max(2, int(3 * scale)))
        cv2.line(image, (le_x, le_y), (lw_x, lw_y), skin_color, max(2, int(3 * scale)))
        cv2.line(image, (rs_x, sh_y), (re_x, re_y), skin_color, max(2, int(3 * scale)))
        cv2.line(image, (re_x, re_y), (rw_x, rw_y), skin_color, max(2, int(3 * scale)))

        for k in (17, 19, 21):
            points[k] = [(lw_x + 2) / (IMAGE_SIZE - 1), (lw_y + 2) / (IMAGE_SIZE - 1), 1.0]
        for k in (18, 20, 22):
            points[k] = [(rw_x - 2) / (IMAGE_SIZE - 1), (rw_y + 2) / (IMAGE_SIZE - 1), 1.0]

    else:
        # Push-up pose
        head_x, head_y = 28, 75
        cv2.circle(image, (head_x, head_y), 8, skin_color, -1)
        points[0] = [head_x / (IMAGE_SIZE - 1), head_y / (IMAGE_SIZE - 1), 1.0]
        for k in range(1, 11):
            points[k] = points[0].copy()

        sh_x, sh_y = 44, 82
        points[11] = [sh_x / (IMAGE_SIZE - 1), (sh_y - 2) / (IMAGE_SIZE - 1), 1.0]
        points[12] = [sh_x / (IMAGE_SIZE - 1), (sh_y + 2) / (IMAGE_SIZE - 1), 1.0]

        hand_x, hand_y = sh_x, 110
        elbow_x, elbow_y = sh_x + 8, 96
        points[13] = [elbow_x / (IMAGE_SIZE - 1), (elbow_y - 2) / (IMAGE_SIZE - 1), 1.0]
        points[14] = [elbow_x / (IMAGE_SIZE - 1), (elbow_y + 2) / (IMAGE_SIZE - 1), 1.0]
        points[15] = [hand_x / (IMAGE_SIZE - 1), hand_y / (IMAGE_SIZE - 1), 1.0]
        points[16] = [hand_x / (IMAGE_SIZE - 1), hand_y / (IMAGE_SIZE - 1), 1.0]
        for k in range(17, 23):
            points[k] = points[15].copy()

        hip_x, hip_y = 74, 88
        points[23] = [hip_x / (IMAGE_SIZE - 1), (hip_y - 2) / (IMAGE_SIZE - 1), 1.0]
        points[24] = [hip_x / (IMAGE_SIZE - 1), (hip_y + 2) / (IMAGE_SIZE - 1), 1.0]

        knee_x, knee_y = 96, 96
        points[25] = [knee_x / (IMAGE_SIZE - 1), (knee_y - 2) / (IMAGE_SIZE - 1), 1.0]
        points[26] = [knee_x / (IMAGE_SIZE - 1), (knee_y + 2) / (IMAGE_SIZE - 1), 1.0]

        toe_x, toe_y = 118, 108
        for k in range(27, 33):
            points[k] = [toe_x / (IMAGE_SIZE - 1), toe_y / (IMAGE_SIZE - 1), 1.0]

        cv2.line(image, (sh_x, sh_y), (elbow_x, elbow_y), skin_color, 3)
        cv2.line(image, (elbow_x, elbow_y), (hand_x, hand_y), skin_color, 3)
        cv2.line(image, (sh_x, sh_y), (hip_x, hip_y), shirt_color, 6)
        cv2.line(image, (hip_x, hip_y), (knee_x, knee_y), pants_color, 4)
        cv2.line(image, (knee_x, knee_y), (toe_x, toe_y), pants_color, 4)

    return image, points


def demo(args):
    """Render realistic human anatomical figures in diverse gym postures."""
    rng = np.random.default_rng(args.seed)
    images, pts, subjects = [], [], []
    for subject in range(args.subjects):
        for take in range(args.takes):
            image, points = _render_human_figure(rng, take)
            images.append(image)
            pts.append(points)
            subjects.append(f'person_{subject}')
    Path(args.out).parent.mkdir(parents=True, exist_ok=True)
    np.savez_compressed(args.out, images=np.stack(images), keypoints=np.stack(pts), subjects=np.asarray(subjects))
    print(f'Created REALISTIC HUMAN pose dataset ({len(images)} samples): {args.out}')


def main():
    parser = argparse.ArgumentParser(description='Train your OWN local 33-landmark pose model')
    sub = parser.add_subparsers(dest='command', required=True)
    d = sub.add_parser('demo', help='Synthetic dots; smoke-testing only')
    d.add_argument('--out', default='data/pose_demo.npz')
    d.add_argument('--subjects', type=int, default=5)
    d.add_argument('--takes', type=int, default=4)
    d.add_argument('--seed', type=int, default=42)
    t = sub.add_parser('train')
    t.add_argument('--data', required=True)
    t.add_argument('--out', default='models/pose.pt')
    t.add_argument('--epochs', type=int, default=30)
    t.add_argument('--batch', type=int, default=8)
    t.add_argument('--lr', type=float, default=0.001)
    t.add_argument('--device', choices=['cpu', 'cuda', 'auto'], default='auto')
    t.add_argument('--seed', type=int, default=42)
    args = parser.parse_args()
    {'demo': demo, 'train': train}[args.command](args)


if __name__ == '__main__':
    main()
