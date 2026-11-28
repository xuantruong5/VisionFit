import sys
from pathlib import Path
_ROOT = Path(__file__).resolve().parent.parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

"""VisionFit Self-Trained Pose & Hand Landmark Model.
100% local. Zero external models. Zero internet downloads.

Generates diverse synthetic training data and trains:
  - BodyPoseNet: 33-landmark full body pose estimator (ResBlock CNN)
  - HandPoseNet: 21-landmark hand joint estimator (compact CNN)

Usage:
  python train_pose_model.py              # Generate data + train both models
  python train_pose_model.py --epochs 40  # Custom epoch count
"""

import os, sys, math, random, argparse, time
from pathlib import Path
import numpy as np
import cv2
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader

# ═══════════════════════════════════════════════
# CONSTANTS
# ═══════════════════════════════════════════════
BODY_IMG_SIZE = 128
HAND_IMG_SIZE = 64
BODY_JOINTS = 33
HAND_JOINTS = 21

MODELS_DIR = Path(__file__).resolve().parent.parent / 'models'

# Joint indices
NOSE = 0
L_EYE_IN, L_EYE, L_EYE_OUT = 1, 2, 3
R_EYE_IN, R_EYE, R_EYE_OUT = 4, 5, 6
R_EAR, L_EAR = 7, 8
MOUTH_L, MOUTH_R = 9, 10
L_SHOULDER, R_SHOULDER = 11, 12
L_ELBOW, R_ELBOW = 13, 14
L_WRIST, R_WRIST = 15, 16
L_PINKY, R_PINKY = 17, 18
L_INDEX, R_INDEX = 19, 20
L_THUMB, R_THUMB = 21, 22
L_HIP, R_HIP = 23, 24
L_KNEE, R_KNEE = 25, 26
L_ANKLE, R_ANKLE = 27, 28
L_HEEL, R_HEEL = 29, 30
L_FOOT_IDX, R_FOOT_IDX = 31, 32


# ═══════════════════════════════════════════════
# 1. SYNTHETIC BODY POSE DATASET
# ═══════════════════════════════════════════════
def _rand_color(rng, lo=30, hi=220):
    return tuple(int(rng.integers(lo, hi)) for _ in range(3))


def _skin_color(rng):
    """Random realistic skin tone in BGR."""
    tones = [
        (140, 170, 210), (120, 150, 195), (100, 130, 175),
        (80, 110, 155), (60, 85, 120), (50, 70, 100),
        (160, 185, 225), (130, 160, 200), (90, 120, 160),
    ]
    base = tones[int(rng.integers(0, len(tones)))]
    noise = tuple(int(rng.integers(-15, 15)) for _ in range(3))
    return tuple(max(0, min(255, b + n)) for b, n in zip(base, noise))


def _jitter(rng, val, amt):
    return val + float(rng.uniform(-amt, amt))


def _clamp(v, lo=0.0, hi=1.0):
    return max(lo, min(hi, v))


def _derive_face_joints(cx, cy, head_r, s):
    """Derive 11 face joints from head center and radius."""
    pts = np.zeros((11, 2), dtype=np.float32)
    pts[NOSE] = [cx, cy]
    # Eyes
    pts[L_EYE_IN] = [cx + head_r * 0.15, cy - head_r * 0.25]
    pts[L_EYE] = [cx + head_r * 0.35, cy - head_r * 0.25]
    pts[L_EYE_OUT] = [cx + head_r * 0.55, cy - head_r * 0.20]
    pts[R_EYE_IN] = [cx - head_r * 0.15, cy - head_r * 0.25]
    pts[R_EYE] = [cx - head_r * 0.35, cy - head_r * 0.25]
    pts[R_EYE_OUT] = [cx - head_r * 0.55, cy - head_r * 0.20]
    # Ears
    pts[L_EAR] = [cx + head_r * 0.85, cy + head_r * 0.05]
    pts[R_EAR] = [cx - head_r * 0.85, cy + head_r * 0.05]
    # Mouth
    pts[MOUTH_L] = [cx + head_r * 0.25, cy + head_r * 0.35]
    pts[MOUTH_R] = [cx - head_r * 0.25, cy + head_r * 0.35]
    return pts


def _derive_finger_joints(wrist_x, wrist_y, dx, dy):
    """Derive 3 finger endpoints (pinky, index, thumb) from wrist."""
    pts = np.zeros((3, 2), dtype=np.float32)
    pts[0] = [wrist_x + dx - dy * 0.3, wrist_y + dy + dx * 0.3]  # pinky
    pts[1] = [wrist_x + dx + dy * 0.15, wrist_y + dy - dx * 0.15]  # index
    pts[2] = [wrist_x + dx * 0.5 + dy * 0.4, wrist_y + dy * 0.5 - dx * 0.4]  # thumb
    return pts


def _derive_foot_joints(ankle_x, ankle_y, side, s):
    """Derive heel and foot-index from ankle. side: +1 left, -1 right."""
    heel = [ankle_x - s * 0.012 * side, ankle_y + s * 0.015]
    toe = [ankle_x + s * 0.025 * side, ankle_y + s * 0.020]
    return np.array([heel, toe], dtype=np.float32)


def generate_standing(rng, s=1.0):
    """Generate a standing pose. Returns (33, 2) normalized coords."""
    joints = np.zeros((BODY_JOINTS, 2), dtype=np.float32)
    cx = _jitter(rng, 0.50, 0.06) * s
    head_y = _jitter(rng, 0.10, 0.02) * s
    head_r = _jitter(rng, 0.055, 0.008) * s
    sh_y = head_y + head_r + _jitter(rng, 0.08, 0.01)
    sh_half = _jitter(rng, 0.12, 0.02)

    joints[:11] = _derive_face_joints(cx, head_y, head_r, s)
    joints[L_SHOULDER] = [cx + sh_half, sh_y]
    joints[R_SHOULDER] = [cx - sh_half, sh_y]

    hip_y = sh_y + _jitter(rng, 0.28, 0.03)
    hip_half = sh_half * _jitter(rng, 0.72, 0.06)
    joints[L_HIP] = [cx + hip_half, hip_y]
    joints[R_HIP] = [cx - hip_half, hip_y]

    ankle_y = hip_y + _jitter(rng, 0.36, 0.04)
    foot_half = hip_half * _jitter(rng, 1.05, 0.10)
    joints[L_ANKLE] = [cx + foot_half, ankle_y]
    joints[R_ANKLE] = [cx - foot_half, ankle_y]

    knee_y = (hip_y + ankle_y) * 0.5
    joints[L_KNEE] = [cx + hip_half + _jitter(rng, 0.005, 0.008), knee_y]
    joints[R_KNEE] = [cx - hip_half - _jitter(rng, 0.005, 0.008), knee_y]

    arm_len = _jitter(rng, 0.18, 0.02)
    elbow_y = sh_y + arm_len * 0.5
    wrist_y = sh_y + arm_len
    joints[L_ELBOW] = [cx + sh_half + _jitter(rng, 0.02, 0.015), elbow_y]
    joints[R_ELBOW] = [cx - sh_half - _jitter(rng, 0.02, 0.015), elbow_y]
    joints[L_WRIST] = [cx + sh_half + _jitter(rng, 0.01, 0.015), wrist_y]
    joints[R_WRIST] = [cx - sh_half - _jitter(rng, 0.01, 0.015), wrist_y]

    dx, dy = 0.0, 0.015
    joints[[L_PINKY, L_INDEX, L_THUMB]] = _derive_finger_joints(joints[L_WRIST][0], joints[L_WRIST][1], dx, dy)
    joints[[R_PINKY, R_INDEX, R_THUMB]] = _derive_finger_joints(joints[R_WRIST][0], joints[R_WRIST][1], -dx, dy)
    joints[[L_HEEL, L_FOOT_IDX]] = _derive_foot_joints(joints[L_ANKLE][0], joints[L_ANKLE][1], 1, s)
    joints[[R_HEEL, R_FOOT_IDX]] = _derive_foot_joints(joints[R_ANKLE][0], joints[R_ANKLE][1], -1, s)
    return joints


def generate_squat(rng, depth=None, s=1.0):
    """Squat with variable depth 0.0-1.0. Returns (33, 2)."""
    if depth is None:
        depth = float(rng.uniform(0.2, 1.0))
    joints = generate_standing(rng, s)

    drop = depth * _jitter(rng, 0.18, 0.03)
    joints[L_HIP][1] += drop
    joints[R_HIP][1] += drop
    joints[:11, 1] += drop * 0.3

    knee_out = depth * _jitter(rng, 0.08, 0.02)
    joints[L_KNEE][0] += knee_out
    joints[R_KNEE][0] -= knee_out
    joints[L_KNEE][1] = (joints[L_HIP][1] + joints[L_ANKLE][1]) * 0.5 + _jitter(rng, 0, 0.01)
    joints[R_KNEE][1] = (joints[R_HIP][1] + joints[R_ANKLE][1]) * 0.5 + _jitter(rng, 0, 0.01)

    if depth > 0.3:
        cx = (joints[L_SHOULDER][0] + joints[R_SHOULDER][0]) * 0.5
        sh_y = joints[L_SHOULDER][1]
        hip_y = joints[L_HIP][1]
        joints[L_ELBOW] = [joints[L_SHOULDER][0] + 0.04, sh_y + 0.06]
        joints[R_ELBOW] = [joints[R_SHOULDER][0] - 0.04, sh_y + 0.06]
        joints[L_WRIST] = [cx + 0.02, (sh_y + hip_y) * 0.5]
        joints[R_WRIST] = [cx - 0.02, (sh_y + hip_y) * 0.5]
        joints[[L_PINKY, L_INDEX, L_THUMB]] = _derive_finger_joints(joints[L_WRIST][0], joints[L_WRIST][1], 0, 0.012)
        joints[[R_PINKY, R_INDEX, R_THUMB]] = _derive_finger_joints(joints[R_WRIST][0], joints[R_WRIST][1], 0, 0.012)
    return joints


def generate_pushup(rng, s=1.0, head_left=True):
    """Push-up / plank (horizontal body). Returns (33, 2)."""
    joints = np.zeros((BODY_JOINTS, 2), dtype=np.float32)
    body_y = _jitter(rng, 0.42, 0.06)
    head_r = _jitter(rng, 0.04, 0.006)
    depth = float(rng.uniform(0.0, 1.0))

    if head_left:
        head_x = _jitter(rng, 0.12, 0.03)
        sh_x = head_x + _jitter(rng, 0.12, 0.02)
        hip_x = sh_x + _jitter(rng, 0.26, 0.03)
        knee_x = hip_x + _jitter(rng, 0.18, 0.02)
        ankle_x = knee_x + _jitter(rng, 0.18, 0.02)
        d = 1.0
    else:
        head_x = _jitter(rng, 0.88, 0.03)
        sh_x = head_x - _jitter(rng, 0.12, 0.02)
        hip_x = sh_x - _jitter(rng, 0.26, 0.03)
        knee_x = hip_x - _jitter(rng, 0.18, 0.02)
        ankle_x = knee_x - _jitter(rng, 0.18, 0.02)
        d = -1.0

    hand_y = body_y + _jitter(rng, 0.30, 0.04)
    hand_x = sh_x + d * _jitter(rng, -0.02, 0.02)
    sh_spread = _jitter(rng, 0.025, 0.008)

    joints[:11] = _derive_face_joints(head_x, body_y + _jitter(rng, 0.02, 0.01), head_r, s)
    joints[L_SHOULDER] = [sh_x, body_y - sh_spread]
    joints[R_SHOULDER] = [sh_x, body_y + sh_spread]

    elbow_drop = depth * _jitter(rng, 0.06, 0.015)
    elbow_x = (sh_x + hand_x) * 0.5 + d * elbow_drop
    elbow_y = (body_y + hand_y) * 0.5
    joints[L_ELBOW] = [elbow_x, elbow_y - 0.02]
    joints[R_ELBOW] = [elbow_x, elbow_y + 0.02]
    joints[L_WRIST] = [hand_x, hand_y]
    joints[R_WRIST] = [hand_x, hand_y]

    joints[[L_PINKY, L_INDEX, L_THUMB]] = _derive_finger_joints(hand_x, hand_y, 0, 0.015)
    joints[[R_PINKY, R_INDEX, R_THUMB]] = _derive_finger_joints(hand_x, hand_y, 0, 0.015)

    hip_spread = sh_spread * 0.8
    spine_drop = _jitter(rng, -0.02, 0.015)
    joints[L_HIP] = [hip_x, body_y + spine_drop - hip_spread]
    joints[R_HIP] = [hip_x, body_y + spine_drop + hip_spread]

    knee_drop = _jitter(rng, 0.04, 0.02)
    joints[L_KNEE] = [knee_x, body_y + knee_drop - 0.02]
    joints[R_KNEE] = [knee_x, body_y + knee_drop + 0.02]

    ankle_drop = _jitter(rng, 0.06, 0.03)
    joints[L_ANKLE] = [ankle_x, body_y + ankle_drop - 0.02]
    joints[R_ANKLE] = [ankle_x, body_y + ankle_drop + 0.02]

    joints[[L_HEEL, L_FOOT_IDX]] = _derive_foot_joints(joints[L_ANKLE][0], joints[L_ANKLE][1], 1, s)
    joints[[R_HEEL, R_FOOT_IDX]] = _derive_foot_joints(joints[R_ANKLE][0], joints[R_ANKLE][1], -1, s)
    return joints


def generate_lunge(rng, s=1.0):
    """Lunge pose. Returns (33, 2)."""
    joints = generate_standing(rng, s)
    depth = float(rng.uniform(0.3, 1.0))

    drop = depth * _jitter(rng, 0.14, 0.03)
    joints[L_HIP][1] += drop
    joints[R_HIP][1] += drop
    joints[:11, 1] += drop * 0.3
    joints[L_SHOULDER][1] += drop * 0.3
    joints[R_SHOULDER][1] += drop * 0.3

    front = int(rng.integers(0, 2))  # 0=left front, 1=right front
    if front == 0:
        joints[L_KNEE][0] -= _jitter(rng, 0.03, 0.01)
        joints[L_KNEE][1] = (joints[L_HIP][1] + joints[L_ANKLE][1]) * 0.5 + depth * 0.04
        joints[R_KNEE][0] += _jitter(rng, 0.04, 0.02)
        joints[R_KNEE][1] = (joints[R_HIP][1] + joints[R_ANKLE][1]) * 0.5 + depth * 0.02
        joints[R_ANKLE][0] += _jitter(rng, 0.06, 0.02)
    else:
        joints[R_KNEE][0] += _jitter(rng, 0.03, 0.01)
        joints[R_KNEE][1] = (joints[R_HIP][1] + joints[R_ANKLE][1]) * 0.5 + depth * 0.04
        joints[L_KNEE][0] -= _jitter(rng, 0.04, 0.02)
        joints[L_KNEE][1] = (joints[L_HIP][1] + joints[L_ANKLE][1]) * 0.5 + depth * 0.02
        joints[L_ANKLE][0] -= _jitter(rng, 0.06, 0.02)
    return joints


def generate_arms_up(rng, s=1.0):
    """Standing with arms raised overhead. Returns (33, 2)."""
    joints = generate_standing(rng, s)
    sh_y = joints[L_SHOULDER][1]
    cx = (joints[L_SHOULDER][0] + joints[R_SHOULDER][0]) * 0.5

    joints[L_ELBOW] = [cx + _jitter(rng, 0.10, 0.02), sh_y - _jitter(rng, 0.10, 0.02)]
    joints[R_ELBOW] = [cx - _jitter(rng, 0.10, 0.02), sh_y - _jitter(rng, 0.10, 0.02)]
    joints[L_WRIST] = [cx + _jitter(rng, 0.06, 0.03), sh_y - _jitter(rng, 0.20, 0.03)]
    joints[R_WRIST] = [cx - _jitter(rng, 0.06, 0.03), sh_y - _jitter(rng, 0.20, 0.03)]
    joints[[L_PINKY, L_INDEX, L_THUMB]] = _derive_finger_joints(joints[L_WRIST][0], joints[L_WRIST][1], 0, -0.012)
    joints[[R_PINKY, R_INDEX, R_THUMB]] = _derive_finger_joints(joints[R_WRIST][0], joints[R_WRIST][1], 0, -0.012)
    return joints


POSE_GENERATORS = {
    'standing': generate_standing,
    'squat_shallow': lambda rng, s=1.0: generate_squat(rng, depth=float(rng.uniform(0.15, 0.45)), s=s),
    'squat_deep': lambda rng, s=1.0: generate_squat(rng, depth=float(rng.uniform(0.55, 1.0)), s=s),
    'pushup_left': lambda rng, s=1.0: generate_pushup(rng, s=s, head_left=True),
    'pushup_right': lambda rng, s=1.0: generate_pushup(rng, s=s, head_left=False),
    'lunge': generate_lunge,
    'arms_up': generate_arms_up,
}


def render_body_image(joints, rng, img_size=BODY_IMG_SIZE):
    """Render a colored mannequin from joint positions onto a random background."""
    img = np.zeros((img_size, img_size, 3), dtype=np.uint8)
    bg_type = int(rng.integers(0, 4))
    if bg_type == 0:
        img[:] = _rand_color(rng, 40, 200)
    elif bg_type == 1:
        for y in range(img_size):
            ratio = y / float(img_size)
            c1 = np.array(_rand_color(rng, 50, 180), dtype=np.float32)
            c2 = np.array(_rand_color(rng, 50, 180), dtype=np.float32)
            img[y, :] = (c1 * (1 - ratio) + c2 * ratio).astype(np.uint8)
    elif bg_type == 2:
        floor_y = int(img_size * rng.uniform(0.6, 0.85))
        img[:floor_y] = _rand_color(rng, 80, 200)
        img[floor_y:] = _rand_color(rng, 40, 160)
    else:
        img[:] = _rand_color(rng, 20, 80)
        noise = rng.integers(0, 30, size=(img_size, img_size, 3), dtype=np.uint8)
        img = np.clip(img.astype(np.int16) + noise.astype(np.int16), 0, 255).astype(np.uint8)

    s = img_size
    pts = (joints * s).astype(np.int32)
    skin = _skin_color(rng)
    shirt = _rand_color(rng, 20, 200)
    pants = _rand_color(rng, 20, 180)
    shoe = _rand_color(rng, 10, 60)
    limb_w = max(2, int(s * rng.uniform(0.025, 0.04)))
    torso_w = max(3, int(s * rng.uniform(0.035, 0.055)))

    # Torso polygon
    torso_pts = np.array([pts[L_SHOULDER], pts[R_SHOULDER], pts[R_HIP], pts[L_HIP]])
    cv2.fillPoly(img, [torso_pts], shirt)

    # Legs
    for (h_idx, k_idx, a_idx) in [(L_HIP, L_KNEE, L_ANKLE), (R_HIP, R_KNEE, R_ANKLE)]:
        cv2.line(img, tuple(pts[h_idx]), tuple(pts[k_idx]), pants, limb_w + 1)
        cv2.line(img, tuple(pts[k_idx]), tuple(pts[a_idx]), pants, limb_w)

    # Feet
    for a_idx in [L_ANKLE, R_ANKLE]:
        cv2.circle(img, tuple(pts[a_idx]), max(2, limb_w // 2), shoe, -1)

    # Arms
    for (s_idx, e_idx, w_idx) in [(L_SHOULDER, L_ELBOW, L_WRIST), (R_SHOULDER, R_ELBOW, R_WRIST)]:
        cv2.line(img, tuple(pts[s_idx]), tuple(pts[e_idx]), skin, limb_w)
        cv2.line(img, tuple(pts[e_idx]), tuple(pts[w_idx]), skin, limb_w)

    # Head
    head_center = pts[NOSE].copy()
    head_r = max(3, int(s * rng.uniform(0.035, 0.055)))
    cv2.circle(img, tuple(head_center), head_r, skin, -1)

    # Hands
    for w_idx in [L_WRIST, R_WRIST]:
        cv2.circle(img, tuple(pts[w_idx]), max(2, limb_w // 2 + 1), skin, -1)

    return img


class BodyPoseDataset(Dataset):
    """Generates synthetic body pose images on-the-fly."""

    def __init__(self, num_samples, img_size=BODY_IMG_SIZE, seed=42):
        self.num_samples = num_samples
        self.img_size = img_size
        self.rng = np.random.default_rng(seed)
        self.pose_names = list(POSE_GENERATORS.keys())
        self._cache = []
        self._generate_all()

    def _generate_all(self):
        for i in range(self.num_samples):
            pose_name = self.pose_names[i % len(self.pose_names)]
            gen = POSE_GENERATORS[pose_name]
            joints = gen(self.rng)
            joints = np.clip(joints, 0.02, 0.98)
            img = render_body_image(joints, self.rng, self.img_size)

            # Augmentation
            if self.rng.random() < 0.5:
                img = np.fliplr(img).copy()
                joints[:, 0] = 1.0 - joints[:, 0]
                swap = [(L_EYE_IN, R_EYE_IN), (L_EYE, R_EYE), (L_EYE_OUT, R_EYE_OUT),
                        (L_EAR, R_EAR), (MOUTH_L, MOUTH_R),
                        (L_SHOULDER, R_SHOULDER), (L_ELBOW, R_ELBOW), (L_WRIST, R_WRIST),
                        (L_PINKY, R_PINKY), (L_INDEX, R_INDEX), (L_THUMB, R_THUMB),
                        (L_HIP, R_HIP), (L_KNEE, R_KNEE), (L_ANKLE, R_ANKLE),
                        (L_HEEL, R_HEEL), (L_FOOT_IDX, R_FOOT_IDX)]
                for a, b in swap:
                    joints[a], joints[b] = joints[b].copy(), joints[a].copy()

            # Color jitter
            if self.rng.random() < 0.4:
                hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
                hsv[:, :, 0] = (hsv[:, :, 0].astype(int) + int(self.rng.integers(-15, 15))) % 180
                hsv[:, :, 1] = np.clip(hsv[:, :, 1].astype(int) + int(self.rng.integers(-30, 30)), 0, 255)
                hsv[:, :, 2] = np.clip(hsv[:, :, 2].astype(int) + int(self.rng.integers(-30, 30)), 0, 255)
                img = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)

            # Gaussian blur
            if self.rng.random() < 0.3:
                ksize = int(self.rng.choice([3, 5]))
                img = cv2.GaussianBlur(img, (ksize, ksize), 0)

            # Noise
            if self.rng.random() < 0.3:
                noise = self.rng.integers(-12, 12, size=img.shape, dtype=np.int16)
                img = np.clip(img.astype(np.int16) + noise, 0, 255).astype(np.uint8)

            self._cache.append((img, joints.flatten().astype(np.float32)))

    def __len__(self):
        return self.num_samples

    def __getitem__(self, idx):
        img, label = self._cache[idx]
        img_t = torch.from_numpy(img.transpose(2, 0, 1).copy()).float() / 255.0
        label_t = torch.from_numpy(label.copy())
        return img_t, label_t


# ═══════════════════════════════════════════════
# 2. SYNTHETIC HAND LANDMARK DATASET
# ═══════════════════════════════════════════════
def generate_hand_joints(rng):
    """Generate 21 hand landmarks in normalized [0,1] space."""
    joints = np.zeros((HAND_JOINTS, 2), dtype=np.float32)
    wrist = np.array([_jitter(rng, 0.50, 0.08), _jitter(rng, 0.85, 0.06)])
    joints[0] = wrist

    palm_w = _jitter(rng, 0.25, 0.04)
    finger_base_y = wrist[1] - _jitter(rng, 0.35, 0.05)

    for finger_idx in range(5):
        base_idx = 1 + finger_idx * 4
        if finger_idx == 0:
            base_x = wrist[0] + palm_w * 0.6
            base_y = wrist[1] - _jitter(rng, 0.15, 0.03)
            angle = _jitter(rng, -0.8, 0.3)
        else:
            x_frac = (finger_idx - 1) / 3.0
            base_x = wrist[0] - palm_w * 0.4 + palm_w * x_frac
            base_y = finger_base_y + _jitter(rng, 0.0, 0.02)
            angle = _jitter(rng, -1.57, 0.2)

        seg_len = _jitter(rng, 0.08, 0.015) if finger_idx == 0 else _jitter(rng, 0.07, 0.012)
        curl = float(rng.uniform(0.0, 1.0))

        px, py = base_x, base_y
        for seg in range(4):
            a = angle + curl * _jitter(rng, 0.3, 0.1) * seg
            px = px + seg_len * math.cos(a)
            py = py + seg_len * math.sin(a)
            joints[base_idx + seg] = [_clamp(px), _clamp(py)]

    joints = np.clip(joints, 0.02, 0.98)
    return joints


def render_hand_image(joints, rng, img_size=HAND_IMG_SIZE):
    """Render synthetic hand image from 21 joint positions."""
    img = np.zeros((img_size, img_size, 3), dtype=np.uint8)
    img[:] = _rand_color(rng, 30, 200)
    skin = _skin_color(rng)
    s = img_size
    pts = (joints * s).astype(np.int32)

    # Palm polygon
    palm_pts = []
    for finger_start in [1, 5, 9, 13, 17]:
        palm_pts.append(tuple(pts[finger_start]))
    palm_pts.append(tuple(pts[0]))
    if len(palm_pts) >= 3:
        cv2.fillPoly(img, [np.array(palm_pts)], skin)

    # Fingers
    for finger_idx in range(5):
        base = 1 + finger_idx * 4
        for seg in range(3):
            p1 = tuple(pts[base + seg])
            p2 = tuple(pts[base + seg + 1])
            cv2.line(img, p1, p2, skin, max(1, int(s * 0.03)))

    # Joints
    for i in range(HAND_JOINTS):
        cv2.circle(img, tuple(pts[i]), max(1, int(s * 0.02)), (255, 255, 255), -1)

    return img


class HandPoseDataset(Dataset):
    """Generates synthetic hand pose images on-the-fly."""

    def __init__(self, num_samples, img_size=HAND_IMG_SIZE, seed=123):
        self.num_samples = num_samples
        self.img_size = img_size
        self.rng = np.random.default_rng(seed)
        self._cache = []
        self._generate_all()

    def _generate_all(self):
        for i in range(self.num_samples):
            joints = generate_hand_joints(self.rng)
            img = render_hand_image(joints, self.rng, self.img_size)
            if self.rng.random() < 0.5:
                img = np.fliplr(img).copy()
                joints[:, 0] = 1.0 - joints[:, 0]
            if self.rng.random() < 0.4:
                ksize = int(self.rng.choice([3, 5]))
                img = cv2.GaussianBlur(img, (ksize, ksize), 0)
            self._cache.append((img, joints.flatten().astype(np.float32)))

    def __len__(self):
        return self.num_samples

    def __getitem__(self, idx):
        img, label = self._cache[idx]
        img_t = torch.from_numpy(img.transpose(2, 0, 1).copy()).float() / 255.0
        label_t = torch.from_numpy(label.copy())
        return img_t, label_t


# ═══════════════════════════════════════════════
# 3. MODEL ARCHITECTURES
# ═══════════════════════════════════════════════
class ResBlock(nn.Module):
    """Residual block with skip connection."""
    def __init__(self, channels):
        super().__init__()
        self.conv1 = nn.Conv2d(channels, channels, 3, padding=1, bias=False)
        self.bn1 = nn.BatchNorm2d(channels)
        self.conv2 = nn.Conv2d(channels, channels, 3, padding=1, bias=False)
        self.bn2 = nn.BatchNorm2d(channels)

    def forward(self, x):
        residual = x
        out = F.relu(self.bn1(self.conv1(x)), inplace=True)
        out = self.bn2(self.conv2(out))
        return F.relu(out + residual, inplace=True)


class BodyPoseNet(nn.Module):
    """ResNet-based 33-landmark body pose regressor.
    Input: (B, 3, 128, 128)
    Output: (B, 66) — 33 joints × (x, y) normalized [0, 1]
    """
    def __init__(self):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(3, 32, 7, stride=2, padding=3, bias=False),
            nn.BatchNorm2d(32), nn.ReLU(inplace=True),
            nn.MaxPool2d(2),

            nn.Conv2d(32, 64, 3, padding=1, bias=False),
            nn.BatchNorm2d(64), nn.ReLU(inplace=True),
            ResBlock(64),
            nn.MaxPool2d(2),

            nn.Conv2d(64, 128, 3, padding=1, bias=False),
            nn.BatchNorm2d(128), nn.ReLU(inplace=True),
            ResBlock(128),
            nn.MaxPool2d(2),

            nn.Conv2d(128, 256, 3, padding=1, bias=False),
            nn.BatchNorm2d(256), nn.ReLU(inplace=True),
            ResBlock(256),
            nn.AdaptiveAvgPool2d(4),
        )
        self.regressor = nn.Sequential(
            nn.Flatten(),
            nn.Linear(256 * 4 * 4, 512),
            nn.ReLU(inplace=True),
            nn.Dropout(0.25),
            nn.Linear(512, 256),
            nn.ReLU(inplace=True),
            nn.Dropout(0.15),
            nn.Linear(256, BODY_JOINTS * 2),
            nn.Sigmoid(),
        )

    def forward(self, x):
        return self.regressor(self.features(x))


class HandPoseNet(nn.Module):
    """Compact 21-landmark hand pose regressor.
    Input: (B, 3, 64, 64)
    Output: (B, 42) — 21 joints × (x, y) normalized [0, 1]
    """
    def __init__(self):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(3, 32, 5, stride=2, padding=2, bias=False),
            nn.BatchNorm2d(32), nn.ReLU(inplace=True),

            nn.Conv2d(32, 64, 3, stride=2, padding=1, bias=False),
            nn.BatchNorm2d(64), nn.ReLU(inplace=True),
            ResBlock(64),

            nn.Conv2d(64, 128, 3, stride=2, padding=1, bias=False),
            nn.BatchNorm2d(128), nn.ReLU(inplace=True),
            ResBlock(128),

            nn.AdaptiveAvgPool2d(2),
        )
        self.regressor = nn.Sequential(
            nn.Flatten(),
            nn.Linear(128 * 2 * 2, 256),
            nn.ReLU(inplace=True),
            nn.Dropout(0.2),
            nn.Linear(256, HAND_JOINTS * 2),
            nn.Sigmoid(),
        )

    def forward(self, x):
        return self.regressor(self.features(x))


# ═══════════════════════════════════════════════
# 4. TRAINING
# ═══════════════════════════════════════════════
class WingLoss(nn.Module):
    """Wing Loss for accurate landmark regression (Feng et al. 2018)."""
    def __init__(self, width=10.0, curvature=2.0):
        super().__init__()
        self.width = width
        self.curvature = curvature
        self.C = self.width - self.width * math.log(1.0 + self.width / self.curvature)

    def forward(self, pred, target):
        diff = torch.abs(pred - target) * 128.0  # scale to pixel space
        small = self.width * torch.log(1.0 + diff / self.curvature)
        large = diff - self.C
        loss = torch.where(diff < self.width, small, large)
        return loss.mean()


def train_body_model(num_samples=4200, epochs=35, batch_size=32, lr=1e-3):
    """Generate synthetic body data and train BodyPoseNet."""
    print("═" * 60)
    print(" [1/4] Generating synthetic BODY training data...")
    print("═" * 60)

    train_n = int(num_samples * 0.85)
    val_n = num_samples - train_n
    train_ds = BodyPoseDataset(train_n, seed=42)
    val_ds = BodyPoseDataset(val_n, seed=9999)
    print(f"  Train samples: {train_n}, Val samples: {val_n}")

    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False, num_workers=0)

    print("\n [2/4] Training BodyPoseNet (ResBlock CNN, 33 landmarks)...")
    model = BodyPoseNet()
    total_params = sum(p.numel() for p in model.parameters())
    print(f"  Architecture: ResBlock CNN | Parameters: {total_params:,}")

    criterion = WingLoss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)

    best_val = float('inf')
    best_state = None
    t0 = time.time()

    for epoch in range(1, epochs + 1):
        model.train()
        train_loss = 0.0
        for imgs, labels in train_loader:
            optimizer.zero_grad()
            preds = model(imgs)
            loss = criterion(preds, labels)
            loss.backward()
            optimizer.step()
            train_loss += loss.item() * imgs.size(0)
        scheduler.step()

        model.eval()
        val_loss = 0.0
        with torch.no_grad():
            for imgs, labels in val_loader:
                preds = model(imgs)
                val_loss += criterion(preds, labels).item() * imgs.size(0)

        tl = train_loss / train_n
        vl = val_loss / val_n
        elapsed = time.time() - t0
        eta = elapsed / epoch * (epochs - epoch)
        marker = ""
        if vl < best_val:
            best_val = vl
            best_state = {k: v.clone() for k, v in model.state_dict().items()}
            marker = " ← BEST"

        if epoch % 5 == 0 or epoch == 1 or marker:
            print(f"  Epoch {epoch:3d}/{epochs} | train_loss={tl:.4f} val_loss={vl:.4f} | "
                  f"elapsed={elapsed:.0f}s ETA={eta:.0f}s{marker}")

    save_path = MODELS_DIR / 'body_pose.pt'
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    torch.save({
        'state_dict': best_state,
        'img_size': BODY_IMG_SIZE,
        'joints': BODY_JOINTS,
        'version': 2,
        'type': 'body_pose_resnet',
        'note': 'Self-trained from synthetic data. 100% local.',
    }, save_path)
    print(f"\n  ✅ BodyPoseNet saved → {save_path} (val_loss={best_val:.4f})")
    return model


def train_hand_model(num_samples=2800, epochs=30, batch_size=32, lr=1e-3):
    """Generate synthetic hand data and train HandPoseNet."""
    print("\n" + "═" * 60)
    print(" [3/4] Generating synthetic HAND training data...")
    print("═" * 60)

    train_n = int(num_samples * 0.85)
    val_n = num_samples - train_n
    train_ds = HandPoseDataset(train_n, seed=77)
    val_ds = HandPoseDataset(val_n, seed=8888)
    print(f"  Train samples: {train_n}, Val samples: {val_n}")

    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False, num_workers=0)

    print("\n [4/4] Training HandPoseNet (21 landmarks)...")
    model = HandPoseNet()
    total_params = sum(p.numel() for p in model.parameters())
    print(f"  Architecture: Compact ResBlock CNN | Parameters: {total_params:,}")

    criterion = WingLoss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)

    best_val = float('inf')
    best_state = None
    t0 = time.time()

    for epoch in range(1, epochs + 1):
        model.train()
        train_loss = 0.0
        for imgs, labels in train_loader:
            optimizer.zero_grad()
            preds = model(imgs)
            loss = criterion(preds, labels)
            loss.backward()
            optimizer.step()
            train_loss += loss.item() * imgs.size(0)
        scheduler.step()

        model.eval()
        val_loss = 0.0
        with torch.no_grad():
            for imgs, labels in val_loader:
                preds = model(imgs)
                val_loss += criterion(preds, labels).item() * imgs.size(0)

        tl = train_loss / train_n
        vl = val_loss / val_n
        elapsed = time.time() - t0
        eta = elapsed / epoch * (epochs - epoch)
        marker = ""
        if vl < best_val:
            best_val = vl
            best_state = {k: v.clone() for k, v in model.state_dict().items()}
            marker = " ← BEST"

        if epoch % 5 == 0 or epoch == 1 or marker:
            print(f"  Epoch {epoch:3d}/{epochs} | train_loss={tl:.4f} val_loss={vl:.4f} | "
                  f"elapsed={elapsed:.0f}s ETA={eta:.0f}s{marker}")

    save_path = MODELS_DIR / 'hand_pose.pt'
    torch.save({
        'state_dict': best_state,
        'img_size': HAND_IMG_SIZE,
        'joints': HAND_JOINTS,
        'version': 2,
        'type': 'hand_pose_resnet',
        'note': 'Self-trained from synthetic data. 100% local.',
    }, save_path)
    print(f"\n  ✅ HandPoseNet saved → {save_path} (val_loss={best_val:.4f})")
    return model


def main():
    parser = argparse.ArgumentParser(description="VisionFit Self-Trained Pose Model Generator")
    parser.add_argument('--body-samples', type=int, default=4200, help='Number of body training samples')
    parser.add_argument('--hand-samples', type=int, default=2800, help='Number of hand training samples')
    parser.add_argument('--body-epochs', type=int, default=35, help='Body model training epochs')
    parser.add_argument('--hand-epochs', type=int, default=30, help='Hand model training epochs')
    parser.add_argument('--batch', type=int, default=32, help='Batch size')
    parser.add_argument('--lr', type=float, default=1e-3, help='Learning rate')
    parser.add_argument('--skip-hand', action='store_true', help='Skip hand model training')
    args = parser.parse_args()

    print("╔════════════════════════════════════════════════════════╗")
    print("║  VisionFit Self-Trained Pose Estimation Model         ║")
    print("║  100% Local • Zero External Models • Zero Downloads   ║")
    print("╚════════════════════════════════════════════════════════╝")
    print()

    t_start = time.time()
    train_body_model(args.body_samples, args.body_epochs, args.batch, args.lr)

    if not args.skip_hand:
        train_hand_model(args.hand_samples, args.hand_epochs, args.batch, args.lr)

    total = time.time() - t_start
    print("\n" + "═" * 60)
    print(f" ALL DONE! Total time: {total:.0f}s ({total / 60:.1f} minutes)")
    print(f" Models saved to: {MODELS_DIR}")
    print("═" * 60)


if __name__ == '__main__':
    main()
