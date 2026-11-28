"""Prepare REAL 32-frame VisionFit action clips from extracted MediaPipe sequences.

Run in visionfit-ai-pro root: python prepare_visionfit_clips.py
Preserves form labels in a manifest; does NOT pretend videos are different subjects.
"""
from pathlib import Path
import csv
import numpy as np

ROOT = Path('datasets/keypoints')
OUT = Path('data/action_clips')
FRAMES = 32
HOP = 16
MIN_VALID = 0.95
MIN_CORE_VISIBLE = 0.80

# IMPORTANT: all clips default to ONE unknown subject. Change only after
# verifying actual distinct individuals; do not invent IDs per video.
SUBJECT_BY_VIDEO = {
    'squat_đúng': 'subject_unknown',
    'squat_sai': 'subject_unknown',
    'push_up_đúng': 'subject_unknown',
    'pushup_sai': 'subject_unknown',
    'pushup_sai1': 'subject_unknown',
}


def main():
    files = sorted(ROOT.glob('*.npz'))
    if not files:
        raise SystemExit('No .npz files found under datasets/keypoints')
    manifest = []
    for path in files:
        with np.load(path, allow_pickle=False) as data:
            x = data['keypoints'].astype(np.float32)
            valid = data['valid'].astype(bool)
            action = str(data['action'])
            form = str(data['form'])
        if x.ndim != 3 or x.shape[1:] != (33, 4) or len(x) != len(valid):
            raise ValueError(f'Invalid data shape: {path}')
        if action not in ('squat', 'push_up') or form not in ('good', 'bad'):
            raise ValueError(f'Unexpected label in {path}: {action}, {form}')
        if path.stem not in SUBJECT_BY_VIDEO:
            raise ValueError(f'Missing subject mapping for {path.stem}')
        subject = SUBJECT_BY_VIDEO[path.stem]
        target = OUT / action / subject
        target.mkdir(parents=True, exist_ok=True)
        # Require at least one FULL right- or left-side chain in each frame.
        sides = ([12, 24, 26, 28], [11, 23, 25, 27]) if action == 'squat' else ([12, 14, 16, 24, 28], [11, 13, 15, 23, 27])
        side_visible = np.logical_or(*[(x[:, joint_ids, 3] >= .5).all(axis=1) for joint_ids in sides])
        kept = skipped = 0
        for start in range(0, len(x) - FRAMES + 1, HOP):
            end = start + FRAMES
            if valid[start:end].mean() < MIN_VALID or side_visible[start:end].mean() < MIN_CORE_VISIBLE:
                skipped += 1
                continue
            # Do not mutate keypoints; preserve exact temporal order.
            clip_name = f'{path.stem}__{form}__{start:06d}.npy'
            output = target / clip_name
            np.save(output, x[start:end])
            manifest.append(dict(file=str(output), source_video=path.stem, subject=subject,
                                 action=action, form=form, start_frame=start, end_frame=end - 1))
            kept += 1
        print(f'{path.name}: kept={kept}, skipped={skipped}; action={action}, form={form}, subject={subject}')
    OUT.mkdir(parents=True, exist_ok=True)
    with (OUT / 'manifest.csv').open('w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['file','source_video','subject','action','form','start_frame','end_frame'])
        writer.writeheader()
        writer.writerows(manifest)
    print(f'\nPrepared {len(manifest)} clips; manifest: {OUT / "manifest.csv"}')
    print('NOT TRAINED. Training requires real distinct subjects and subject-disjoint evaluation.')


if __name__ == '__main__':
    main()
