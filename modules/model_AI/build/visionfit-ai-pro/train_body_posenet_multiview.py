"""Train BodyPoseNet (ResBlock CNN with WingLoss) on real multi-view squat dataset.
Saves to models/pose_custom.pt.
"""

import sys, os, time
from pathlib import Path
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import TensorDataset, DataLoader

ROOT = Path(__file__).resolve().parent
sys.path.append(str(ROOT))

from train_pose_model import BodyPoseNet, WingLoss

DATA_PATH = ROOT / 'data' / 'pose_multiview_squat.npz'
OUT_MODEL = ROOT / 'models' / 'pose_custom.pt'

def main():
    print(f"[BodyPoseNet Trainer] Loading dataset from {DATA_PATH}...")
    z = np.load(DATA_PATH, allow_pickle=True)
    images = z['images']       # (N, 128, 128, 3) uint8 RGB
    keypoints = z['keypoints'] # (N, 33, 3) float32 (x, y, vis)
    subjects = z['subjects']

    N = len(images)
    print(f"[BodyPoseNet Trainer] Total samples: {N}")

    # Prepare labels: flatten (33, 2) to (66,)
    labels = keypoints[:, :, :2].reshape(N, 66).astype(np.float32)

    # Train / Val split (85% / 15%)
    rng = np.random.default_rng(42)
    train_idx = []
    val_idx = []
    for s in np.unique(subjects):
        idxs = np.flatnonzero(subjects == s)
        shuffled = rng.permutation(idxs)
        sp = int(len(shuffled) * 0.85)
        train_idx.extend(shuffled[:sp])
        val_idx.extend(shuffled[sp:])

    train_idx = np.array(train_idx)
    val_idx = np.array(val_idx)
    print(f"  Train: {len(train_idx)}, Val: {len(val_idx)}")

    x_train = torch.from_numpy(images[train_idx]).permute(0, 3, 1, 2).float() / 255.0
    y_train = torch.from_numpy(labels[train_idx])

    x_val = torch.from_numpy(images[val_idx]).permute(0, 3, 1, 2).float() / 255.0
    y_val = torch.from_numpy(labels[val_idx])

    batch_size = 32
    train_loader = DataLoader(TensorDataset(x_train, y_train), batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(TensorDataset(x_val, y_val), batch_size=batch_size, shuffle=False)

    device = torch.device('mps' if torch.backends.mps.is_available() else 'cpu')
    print(f"  Device: {device}")

    model = BodyPoseNet().to(device)
    print(f"  Model parameters: {sum(p.numel() for p in model.parameters()):,}")

    criterion = WingLoss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-4)
    epochs = 30
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs, eta_min=1e-5)

    best_val = float('inf')
    best_state = None

    print(f"\n{'Epoch':^7} | {'Train WingLoss':^16} | {'Val WingLoss':^14} | {'LR':^10} | {'Time':^7}")
    print("-" * 62)

    for epoch in range(1, epochs + 1):
        t0 = time.time()
        model.train()
        train_loss = 0.0
        for bx, by in train_loader:
            bx, by = bx.to(device), by.to(device)
            optimizer.zero_grad()
            preds = model(bx)
            loss = criterion(preds, by)
            loss.backward()
            optimizer.step()
            train_loss += loss.item() * len(bx)

        scheduler.step()
        train_loss /= len(train_idx)

        model.eval()
        val_loss = 0.0
        with torch.no_grad():
            for bx, by in val_loader:
                bx, by = bx.to(device), by.to(device)
                preds = model(bx)
                loss = criterion(preds, by)
                val_loss += loss.item() * len(bx)

        val_loss /= len(val_idx)
        dt = time.time() - t0
        lr = scheduler.get_last_lr()[0]

        is_best = val_loss < best_val
        if is_best:
            best_val = val_loss
            best_state = {k: v.cpu().clone() for k, v in model.state_dict().items()}
        marker = " ★ (Best)" if is_best else ""
        print(f"{epoch:^7d} | {train_loss:^16.4f} | {val_loss:^14.4f} | {lr:^10.6f} | {dt:^6.1f}s{marker}")

    # Save best checkpoint
    OUT_MODEL.parent.mkdir(parents=True, exist_ok=True)
    torch.save({
        'architecture': 'BodyPoseNet',
        'type': 'ResBlock_CNN',
        'state': best_state,
        'image_size': 128,
        'num_joints': 33,
        'best_val_wingloss': best_val,
        'trained_samples': N,
        'trained_subjects': list(np.unique(subjects)),
        'note': 'Multi-View ResBlock CNN trained with WingLoss (100% PyTorch Local)'
    }, OUT_MODEL)
    print(f"\n[Success] Best checkpoint saved to {OUT_MODEL} ({OUT_MODEL.stat().st_size / 1024:.1f} KB)")
    print(f"Best Val WingLoss: {best_val:.4f} pixels")

if __name__ == '__main__':
    main()
