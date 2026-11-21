"""Extract ordered MediaPipe 33-landmark sequences from VisionFit's raw videos.

Requires: mediapipe>=1.2, opencv-python, numpy
Run from visionfit-ai-pro root: python extract_visionfit_keypoints.py
"""
from pathlib import Path
import json
import cv2
import mediapipe as mp
import numpy as np

ROOT = Path('datasets/raw')
OUT = Path('datasets/keypoints')
MODEL = Path('models/mediapipe/pose_landmarker_full.task')
SOURCES = [
    ('squat', 'good', ROOT/'squat'/'squat_đúng.mp4'),
    ('squat', 'bad', ROOT/'squat'/'squat_sai.mp4'),
    ('push_up', 'good', ROOT/'push_up'/'push_up_đúng.mp4'),
    ('push_up', 'bad', ROOT/'push_up'/'pushup_sai.mp4'),
    ('push_up', 'bad', ROOT/'push_up'/'pushup_sai1.mp4'),
]

def main():
    if not MODEL.is_file():
        raise SystemExit(f'Missing pose landmarker model: {MODEL}')
    OUT.mkdir(parents=True, exist_ok=True)
    options = mp.tasks.vision.PoseLandmarkerOptions(
        base_options=mp.tasks.BaseOptions(model_asset_path=str(MODEL)),
        running_mode=mp.tasks.vision.RunningMode.VIDEO,
        num_poses=1,
    )
    manifest=[]
    timestamp_offset = 0
    with mp.tasks.vision.PoseLandmarker.create_from_options(options) as detector:
        for action, form, source in SOURCES:
            if not source.is_file():
                print(f'MISSING: {source}')
                continue
            cap=cv2.VideoCapture(str(source))
            if not cap.isOpened():
                print(f'FAILED TO OPEN: {source}')
                continue
            fps=cap.get(cv2.CAP_PROP_FPS)
            if not np.isfinite(fps) or fps<=0: fps=30.0
            seq=[]
            valid=[]
            frame_idx=0
            try:
                while True:
                    ok, bgr=cap.read()
                    if not ok: break
                    rgb=cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
                    ts=timestamp_offset + int(round(frame_idx*1000.0/fps))
                    frame_idx+=1
                    # Ensure strictly increasing timestamps even with unusual FPS.
                    if seq:
                        ts=max(ts, previous_ts+1)
                    previous_ts=ts
                    image=mp.Image(image_format=mp.ImageFormat.SRGB, data=np.ascontiguousarray(rgb))
                    result=detector.detect_for_video(image, ts)
                    if result.pose_landmarks:
                        lm=result.pose_landmarks[0]
                        points=np.asarray([[p.x,p.y,p.z,p.visibility if p.visibility is not None else 0.0] for p in lm],dtype=np.float32)
                        is_valid=(points.shape==(33,4)) and bool(np.isfinite(points).all())
                        if not is_valid: points=np.zeros((33,4),dtype=np.float32)
                    else:
                        points=np.zeros((33,4),dtype=np.float32)
                        is_valid=False
                    seq.append(points)
                    valid.append(is_valid)
            finally:
                cap.release()
            if not seq:
                print(f'EMPTY VIDEO: {source}')
                continue
            timestamp_offset = previous_ts + 1
            arr=np.stack(seq)
            mask=np.asarray(valid,dtype=bool)
            dest=OUT/(source.stem+'.npz')
            np.savez_compressed(dest, keypoints=arr, valid=mask, fps=np.float32(fps), action=action, form=form, source=str(source))
            coverage=100*mask.mean()
            print(f'{source.name}: {len(arr)} frames, detected {mask.sum()} ({coverage:.1f}%), shape={arr.shape} -> {dest}')
            manifest.append({'source':str(source),'file':str(dest),'action':action,'form':form,'frames':len(arr),'detected_frames':int(mask.sum()),'coverage_percent':round(coverage,1)})
    (OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
    print(f'\nSaved {len(manifest)} video sequences to {OUT}')
    print('NOTE: Not yet a VisionFit training dataset; inspect coverage, labels, subjects and class requirements before training.')

if __name__=='__main__':
    main()
