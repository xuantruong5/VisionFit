"""VisionFit Squat GOOD/BAD pilot: training-only, one subject, no validation claims.
Place next to visionfit.py; run: python train_squat_pilot.py
Uses the existing 32-frame clips and original ActionNet architecture.
"""
import csv
import json
import random
from collections import Counter
from pathlib import Path

import numpy as np
import torch
from torch import nn
from torch.utils.data import DataLoader, TensorDataset
from visionfit import ActionNet, normalize

ROOT = Path(__file__).resolve().parent
MANIFEST = ROOT / 'data/action_clips/manifest.csv'
OUT = ROOT / 'models/squat_form_pilot.pt'
REPORT = ROOT / 'reports/squat_form_pilot_training.json'
LABELS = ['bad', 'good']
FRAMES = 32
EPOCHS = 12
SEED = 42


def main():
    if not MANIFEST.is_file():
        raise SystemExit(f'Missing manifest: {MANIFEST}')
    torch.manual_seed(SEED)
    np.random.seed(SEED)
    random.seed(SEED)

    with MANIFEST.open(newline='', encoding='utf-8') as file:
        all_rows = list(csv.DictReader(file))
    rows = [r for r in all_rows if r['action'] == 'squat' and r['form'] in LABELS]
    if not rows:
        raise SystemExit('No squat clips in manifest')
    counts = Counter(r['form'] for r in rows)
    if any(counts[label] == 0 for label in LABELS):
        raise SystemExit(f'Both good and bad squat clips needed, got {counts}')

    clips, y = [], []
    videos = set()
    for row in rows:
        file = ROOT / row['file']
        raw = np.load(file, allow_pickle=False)
        if raw.shape != (FRAMES, 33, 4) or not np.isfinite(raw).all():
            raise ValueError(f'Invalid clip: {file}, shape={raw.shape}')
        clips.append(normalize(raw))
        y.append(LABELS.index(row['form']))
        videos.add(row['source_video'])

    X = np.stack(clips).astype(np.float32)
    Y = np.asarray(y, dtype=np.int64)
    device = torch.device('mps' if torch.backends.mps.is_available() else 'cpu')
    model = ActionNet(len(LABELS)).to(device)
    loader = DataLoader(TensorDataset(torch.from_numpy(X), torch.from_numpy(Y)),
                        batch_size=16, shuffle=True)
    optimizer = torch.optim.AdamW(model.parameters(), lr=0.0005, weight_decay=0.001)
    weights = len(Y) / (len(LABELS) * np.maximum(np.bincount(Y, minlength=2), 1))
    criterion = nn.CrossEntropyLoss(weight=torch.tensor(weights, dtype=torch.float32, device=device))
    print(f'PILOT ONLY: {len(X)} overlapping clips; videos={len(videos)}; one person')
    print(f'Classes: {dict(counts)}; device={device}; NO held-out validation/test')
    history = []
    for epoch in range(1, EPOCHS + 1):
        model.train()
        total_loss = 0.0
        for bx, by in loader:
            bx, by = bx.to(device), by.to(device)
            optimizer.zero_grad()
            loss = criterion(model(bx), by)
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            total_loss += loss.item() * len(by)
        # Training-set accuracy ONLY, intentionally not validation accuracy.
        model.eval()
        correct = 0
        with torch.no_grad():
            for start in range(0, len(X), 32):
                pred = model(torch.from_numpy(X[start:start + 32]).to(device)).argmax(dim=1)
                correct += (pred.cpu().numpy() == Y[start:start + 32]).sum().item()
        train_acc = correct / len(Y)
        train_loss = total_loss / len(Y)
        history.append(dict(epoch=epoch, train_loss=round(train_loss, 5), training_accuracy=round(train_acc, 5)))
        print(f'epoch={epoch:02d} train_loss={train_loss:.4f} TRAIN_acc={train_acc:.3f} (not validation)')

    OUT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    torch.save({
        'model_state': model.cpu().state_dict(), 'labels': LABELS, 'frames': FRAMES,
        'version': 2, 'feature_spec': '33 MediaPipe-order x,y,z,visibility; hip-centered',
        'experiment': 'squat_form_pilot_single_subject_training_only',
    }, OUT)
    REPORT.write_text(json.dumps({
        'experiment': 'Single-subject, training only; no validation/test.',
        'sources': sorted(videos), 'training_clips': len(Y), 'labels': LABELS,
        'training_counts': dict(counts), 'history': history,
        'warning': 'Training accuracy is not generalization or form scoring accuracy. Clips overlap and come from one person.'
    }, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'\nSaved: {OUT.relative_to(ROOT)}')
    print(f'Report: {REPORT.relative_to(ROOT)}')
    print('NOT READY FOR DEPLOYMENT: collect independent subjects and expert-reviewed form labels.')


if __name__ == '__main__':
    main()
