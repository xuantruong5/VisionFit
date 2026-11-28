
import argparse
import hashlib
import os
from pathlib import Path

import cv2
import numpy as np

IMAGE_SIZE = 128

JOINT_NAMES = [
    "NOSE", "LEFT_EYE_INNER", "LEFT_EYE", "LEFT_EYE_OUTER",
    "RIGHT_EYE_INNER", "RIGHT_EYE", "RIGHT_EYE_OUTER",
    "LEFT_EAR", "RIGHT_EAR", "MOUTH_LEFT", "MOUTH_RIGHT",
    "LEFT_SHOULDER", "RIGHT_SHOULDER",
    "LEFT_ELBOW", "RIGHT_ELBOW",
    "LEFT_WRIST", "RIGHT_WRIST",
    "LEFT_PINKY", "RIGHT_PINKY",
    "LEFT_INDEX", "RIGHT_INDEX",
    "LEFT_THUMB", "RIGHT_THUMB",
    "LEFT_HIP", "RIGHT_HIP",
    "LEFT_KNEE", "RIGHT_KNEE",
    "LEFT_ANKLE", "RIGHT_ANKLE",
    "LEFT_HEEL", "RIGHT_HEEL",
    "LEFT_FOOT_INDEX", "RIGHT_FOOT_INDEX",
]

SKELETON = [
    (0, 1), (1, 2), (2, 3),
    (0, 4), (4, 5), (5, 6),
    (3, 7), (6, 8),
    (9, 10),
    (11, 12),
    (11, 13), (13, 15),
    (12, 14), (14, 16),
    (15, 17), (15, 19), (15, 21),
    (16, 18), (16, 20), (16, 22),
    (11, 23), (12, 24), (23, 24),
    (23, 25), (25, 27),
    (24, 26), (26, 28),
    (27, 29), (29, 31),
    (28, 30), (30, 32),
]


def model_image(image):
    return cv2.resize(
        image, (IMAGE_SIZE, IMAGE_SIZE),
        interpolation=cv2.INTER_AREA
    )[:, :, ::-1].copy()


def image_hash(image):
    return hashlib.sha256(image.tobytes()).hexdigest()


def load_dataset(path):
    images, points, subjects = [], [], []
    if path.exists():
        with np.load(path, allow_pickle=False) as data:
            images = list(data["images"])
            points = list(data["keypoints"])
            subjects = list(data["subjects"].astype(str))
    return images, points, subjects


def save_dataset(path, images, points, subjects):
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(".tmp")
    with open(temp, "wb") as f:
        np.savez_compressed(
            f,
            images=np.asarray(images, dtype=np.uint8),
            keypoints=np.asarray(points, dtype=np.float32),
            subjects=np.asarray(subjects, dtype=str),
        )
    os.replace(temp, path)


class Annotator:
    def __init__(self, image):
        self.image = image
        self.h, self.w = image.shape[:2]
        self.points = [None] * 33
        self.current = 0

        self.zoom = 1.0
        self.center_x = self.w / 2
        self.center_y = self.h / 2

        self.display_w = min(1200, max(600, self.w))
        self.display_h = max(
            1, round(self.display_w * self.h / self.w)
        )

        if self.display_h > 800:
            self.display_h = 800
            self.display_w = max(
                1, round(self.display_h * self.w / self.h)
            )

        self.crop = (0, 0, self.w, self.h)
        self.window = "VisionFit Pose Annotator"
        cv2.namedWindow(self.window, cv2.WINDOW_NORMAL)
        cv2.setMouseCallback(self.window, self.on_mouse)

    def select_next(self):
        for i in range(self.current + 1, 33):
            if self.points[i] is None:
                self.current = i
                return
        for i in range(33):
            if self.points[i] is None:
                self.current = i
                return

    def on_mouse(self, event, x, y, flags, userdata):
        if y >= self.display_h:
            return

        left, top, right, bottom = self.crop

        px = left + (x / self.display_w) * (right - left)
        py = top + (y / self.display_h) * (bottom - top)

        px = float(np.clip(px, 0, self.w - 1))
        py = float(np.clip(py, 0, self.h - 1))

        if event == cv2.EVENT_LBUTTONDOWN:
            self.points[self.current] = [
                px / max(1, self.w - 1),
                py / max(1, self.h - 1),
                1.0,
            ]
            self.select_next()

        elif event == cv2.EVENT_RBUTTONDOWN:
            self.center_x, self.center_y = px, py

        elif event == cv2.EVENT_MOUSEWHEEL:
            if flags > 0:
                self.zoom = min(8.0, self.zoom * 1.25)
            else:
                self.zoom = max(1.0, self.zoom / 1.25)
            self.center_x, self.center_y = px, py

    def get_crop(self):
        cw = max(1, int(self.w / self.zoom))
        ch = max(1, int(self.h / self.zoom))

        left = int(self.center_x - cw / 2)
        top = int(self.center_y - ch / 2)

        left = max(0, min(left, self.w - cw))
        top = max(0, min(top, self.h - ch))

        self.crop = (left, top, left + cw, top + ch)
        return self.crop

    def to_screen(self, point):
        left, top, right, bottom = self.crop
        px = point[0] * max(1, self.w - 1)
        py = point[1] * max(1, self.h - 1)

        x = (px - left) * self.display_w / (right - left)
        y = (py - top) * self.display_h / (bottom - top)
        return int(round(x)), int(round(y))

    def visible(self, index):
        p = self.points[index]
        return p is not None and p[2] >= 0.5

    def render(self):
        left, top, right, bottom = self.get_crop()
        cropped = self.image[top:bottom, left:right]

        canvas = cv2.resize(
            cropped, (self.display_w, self.display_h),
            interpolation=cv2.INTER_LINEAR
        )

        for a, b in SKELETON:
            if self.visible(a) and self.visible(b):
                p1 = self.to_screen(self.points[a])
                p2 = self.to_screen(self.points[b])

                cv2.line(
                    canvas, p1, p2,
                    (0, 255, 255), 2, cv2.LINE_AA
                )

        for i, point in enumerate(self.points):
            if not self.visible(i):
                continue

            x, y = self.to_screen(point)

            if 0 <= x < self.display_w and 0 <= y < self.display_h:
                color = (0, 255, 0)
                if i == self.current:
                    color = (0, 0, 255)

                cv2.circle(
                    canvas, (x, y), 5, color, -1,
                    cv2.LINE_AA
                )
                cv2.putText(
                    canvas, str(i), (x + 7, y - 7),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45,
                    (255, 255, 255), 2, cv2.LINE_AA
                )

        footer = np.full(
            (118, self.display_w, 3), 30,
            dtype=np.uint8
        )

        done = sum(p is not None for p in self.points)

        lines = [
            f"Joint {self.current:02d}: {JOINT_NAMES[self.current]}",
            f"Progress: {done}/33  |  Zoom: {self.zoom:.2f}x",
            "Left click: set  |  Right click: center  |  Wheel: zoom",
            "A/D: previous/next  |  X: invisible  |  U: clear",
            "S: save image  |  Q: quit",
        ]

        for i, line in enumerate(lines):
            cv2.putText(
                footer, line, (12, 22 + i * 22),
                cv2.FONT_HERSHEY_SIMPLEX, 0.53,
                (0, 240, 255), 1, cv2.LINE_AA
            )

        return np.vstack([canvas, footer])

    def run(self):
        while True:
            cv2.imshow(self.window, self.render())
            key = cv2.waitKeyEx(30)

            if key in (ord("q"), 27):
                cv2.destroyWindow(self.window)
                return None

            elif key == ord("a"):
                self.current = (self.current - 1) % 33

            elif key == ord("d"):
                self.current = (self.current + 1) % 33

            elif key == ord("x"):
                self.points[self.current] = [0.0, 0.0, 0.0]
                self.select_next()

            elif key == ord("u"):
                self.points[self.current] = None

            elif key in (ord("+"), ord("=")):
                self.zoom = min(8.0, self.zoom * 1.25)

            elif key == ord("-"):
                self.zoom = max(1.0, self.zoom / 1.25)

            elif key == ord("0"):
                self.zoom = 1.0
                self.center_x = self.w / 2
                self.center_y = self.h / 2

            elif key == ord("s"):
                if any(p is None for p in self.points):
                    print("Chua du 33 khop. Hay cham hoac nhan X.")
                    continue

                result = np.asarray(
                    self.points, dtype=np.float32
                )
                cv2.destroyWindow(self.window)
                return result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--images", required=True)
    parser.add_argument("--out", required=True)
    parser.add_argument("--subject", required=True)
    parser.add_argument("--append", action="store_true")
    parser.add_argument("--review", action="store_true")
    args = parser.parse_args()

    image_dir = Path(args.images)
    output = Path(args.out)

    files = sorted(
        p for p in image_dir.iterdir()
        if p.suffix.lower() in
        (".jpg", ".jpeg", ".png", ".bmp")
    )

    if not files:
        raise RuntimeError("Khong tim thay anh.")

    # Always preserve existing samples.
    images, points, subjects = load_dataset(output)

    hashes = {
        image_hash(img): i
        for i, img in enumerate(images)
    }

    print(f"Existing labeled images: {len(images)}")
    print(f"Source images: {len(files)}")

    for path in files:
        image = cv2.imread(str(path))
        if image is None:
            print("Khong doc duoc:", path)
            continue

        small = model_image(image)
        key = image_hash(small)

        if key in hashes and not args.review:
            print("SKIP already labeled:", path.name)
            continue

        print("Annotating:", path.name)
        annotator = Annotator(image)

        if key in hashes:
            annotator.points = [
                list(p) for p in points[hashes[key]]
            ]

        result = annotator.run()

        if result is None:
            print("Stopped. Previous data preserved.")
            break

        if key in hashes:
            idx = hashes[key]
            points[idx] = result
            print("Updated:", path.name)
        else:
            idx = len(images)
            images.append(small)
            points.append(result)
            subjects.append(args.subject)
            hashes[key] = idx
            print("Saved:", path.name)

        save_dataset(
            output, images, points, subjects
        )

        print("Total labeled:", len(images))

    print("Dataset:", output)
    print("Final samples:", len(images))


if __name__ == "__main__":
    main()
