
import cv2
import numpy as np
from pathlib import Path
from pose_model import load_pose_model, infer_rgb

DATA = "data/pose_debug_91.npz"
# MODEL = "models/pose_debug_91.pt"
MODEL = "models/pose_debug_91.pt"
# OUT = Path("reports/pose_debug")
OUT = Path("reports/pose_v2")
OUT.mkdir(parents=True, exist_ok=True)

EDGES = [
    (11, 12),
    (11, 13), (13, 15),
    (12, 14), (14, 16),
    (11, 23), (12, 24),
    (23, 24),
    (23, 25), (25, 27),
    (24, 26), (26, 28),
    (27, 29), (29, 31),
    (28, 30), (30, 32)
]

def draw_pose(image, pts, color):
    h, w = image.shape[:2]

    def xy(p):
        return (
            int(p[0] * (w - 1)),
            int(p[1] * (h - 1))
        )

    for a, b in EDGES:
        if pts[a, -1] >= 0.5 and pts[b, -1] >= 0.5:
            cv2.line(
                image, xy(pts[a]), xy(pts[b]),
                color, 2, cv2.LINE_AA
            )

    for p in pts:
        if p[-1] >= 0.5:
            cv2.circle(
                image, xy(p), 3, color, -1
            )

    return image

data = np.load(DATA)
model = load_pose_model(MODEL, device="cpu")

for i, (rgb, truth) in enumerate(
    zip(data["images"], data["keypoints"])
):
    predicted = infer_rgb(model, rgb, device="cpu")

    original = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
    original = cv2.resize(
        original, (512, 512),
        interpolation=cv2.INTER_NEAREST
    )

    left = draw_pose(
        original.copy(), truth, (0, 255, 0)
    )

    right = draw_pose(
        original.copy(), predicted, (0, 0, 255)
    )

    result = np.hstack([left, right])

    cv2.putText(
        result, "GROUND TRUTH",
        (10, 30), cv2.FONT_HERSHEY_SIMPLEX,
        0.8, (0, 255, 0), 2
    )

    cv2.putText(
        result, "AI PREDICTION",
        (522, 30), cv2.FONT_HERSHEY_SIMPLEX,
        0.8, (0, 0, 255), 2
    )

    path = OUT / f"test_{i:03d}.jpg"
    cv2.imwrite(str(path), result)

print(f"Saved {len(data['images'])} comparisons to {OUT}")
