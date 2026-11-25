# 📘 TÀI LIỆU TOÀN DIỆN KIẾN TRÚC HỆ THỐNG VISIONFIT AI PRO
**Phiên bản:** 2.0 (Biomechanical Form Analysis & Self-Trained PoseNet)  
**Tiêu chuẩn Chuyên môn:** PT Trương Thái Lưu (Poliquin CPT, WellFit Center)  
**Dự án:** VisionFit — Hệ thống Hỗ trợ Tập luyện Thể hình Thông minh Bằng Trí tuệ Nhân tạo  

---

## 📑 MỤC LỤC
1. [Tổng Quan & Định Hướng Cốt Lõi Của Dự Án](#1-tổng-quan--định-hướng-cốt-lõi-của-dự-án)
2. [Sơ Đồ Kiến Trúc Hệ Thống 3 Tầng (3-Tier Architecture)](#2-sơ-đồ-kiến-trúc-hệ-thống-3-tầng-3-tier-architecture)
3. [Cơ Sở Khoa Học & Thuật Toán AI](#3-cơ-sở-khoa-học--thuật-toán-ai)
4. [Bộ Quy Chuẩn Sinh Cơ Học (PT Trương Thái Lưu)](#4-bộ-quy-chuẩn-sinh-cơ-học-pt-trương-thái-lưu)
5. [Cấu Trúc Thư Mục & Vai Trò Từng Tệp Tin](#5-cấu-trúc-thư-mục--vai-trò-từng-tệp-tin)
6. [Hướng Dẫn Vận Hành & Khởi Chạy](#6-hướng-dẫn-vận-hành--khởi-chạy)
7. [Cẩm Nang Mở Rộng: Thêm Video Mới & Thêm Bài Tập Mới](#7-cẩm-nang-mở-rộng-thêm-video-mới--thêm-bài-tập-mới)
8. [Số Liệu Kiểm Thử & Đánh Giá (Defense Metrics)](#8-số-liệu-kiểm-thử--đánh-giá-defense-metrics)

---

## 1. Tổng Quan & Định Hướng Cốt Lõi Của Dự Án

### 1.1. Mục tiêu
VisionFit AI được phát triển nhằm mục đích theo dõi, đếm số lần tập (repetition) và **phân tích kỹ thuật động tác tập luyện thể hình thời gian thực**. Hệ thống đóng vai trò như một Huấn luyện viên Cá nhân (PT ảo), phát hiện các sai sót kỹ thuật (ví dụ: Squat nông, gập lưng quá mức) để cảnh báo phòng tránh chấn thương cột sống và khớp gối.

### 1.2. Định vị bài toán AI cho Đồ án Tốt nghiệp (Capstone)
Trong quá trình bảo vệ trước Hội đồng, nhóm cần làm rõ sự phân tách khoa học giữa 2 bài toán:
* **Bài toán A (Trích xuất Khung xương - Pose Estimation):** Nhận diện 33 điểm khớp giải phẫu từ ảnh pixel thô. Nhóm áp dụng kỹ thuật **Knowledge Distillation** (dùng detector chuẩn làm Teacher để gán nhãn tự động cho tập dữ liệu đa đối tượng) và huấn luyện mô hình tích chập cục bộ **PoseNet (395 KB)** đạt độ chính xác PCK **99.71%**.
* **Bài toán B (Đánh giá Form & Nhận diện Động tác - Biomechanics & Action Recognition):** **Đây là giá trị cốt lõi và linh hồn của đồ án do nhóm tự phát triển 100%**. Mô hình nhận tọa độ khớp, tính toán động học các góc gập, chạy máy trạng thái 4 pha và áp dụng trực tiếp bộ quy chuẩn của chuyên gia **PT Trương Thái Lưu** để phân loại Form ĐÚNG / SAI.

---

## 2. Sơ Đồ Kiến Trúc Hệ Thống 3 Tầng (3-Tier Architecture)

```
                            [Video Người Tập / Webcam]
                                        │
                                        ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  TẦNG 1: BỘ TRÍCH XUẤT & MÔ HÌNH KHUNG XƯƠNG (Pose Estimation Layer)        │
│                                                                              │
│  • Mô hình PoseNet Tự Huấn Luyện: models/pose_custom.pt (395 KB)              │
│    - Kiến trúc: 4-layer CNN + Soft-Argmax sub-pixel regression               │
│    - Dữ liệu học: data/pose_letterbox_all.npz (2.543 frames từ 5 người tập)  │
│    - Chức năng: Chấm 33 khớp cục bộ cho Web Studio (/api/predict_pose)       │
│                                                                              │
│  • Bộ Trích Xuất Chuẩn Milimet (Teacher Detector): MediaPipe Pose Landmarker │
│    - Tự động gán nhãn Ground Truth không cần click tay thủ công               │
│    - Hỗ trợ tọa độ 3 chiều (x, y, z) chống biến dạng góc quay                │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │ (Chuỗi 33 tọa độ khớp)
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  TẦNG 2: BỘ NÃO PHÂN TÍCH SINH CƠ HỌC (Biomechanical Analysis Layer)        │
│                                                                              │
│  • Tệp tin lõi: visionfit.py (Class BiomechanicalSquatAnalyzer)              │
│  • Thuật toán:                                                               │
│    - Tính góc gối 3D vector (Hip -> Knee -> Ankle)                           │
│    - Tính góc nghiêng thân mình relative to vertical (Hip -> Shoulder)       │
│    - Máy trạng thái 4 pha: STANDING -> DESCENDING -> BOTTOM -> ASCENDING     │
│    - Chấm điểm form chuẩn PT Lưu: ĐÚNG (65°-90°) vs SAI (Nông >95°, Lưng >45°)│
│    - Xuất video gắn nhãn Full 33-Landmark Skeleton + HUD đo góc + Báo cáo JSON│
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │ (JSON Report + Annotated Video)
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  TẦNG 3: GIAO DIỆN & KẾT NỐI ĐA NỀN TẢNG (Presentation & API Bridge Layer)   │
│                                                                              │
│  • API Server: web_server.py                                                 │
│    - Endpoint POST /api/analyze_squat (Nhận video -> Trả kết quả JSON)       │
│    - Endpoint GET  /api/status (Kiểm tra trạng thái mô hình & thông số PT)   │
│    - Endpoint POST /api/predict_pose (Phục vụ nhận diện real-time)           │
│                                                                              │
│  • Web Studio: web/index.html + web/app.js                                   │
│    - Giao diện Cyberpunk Dark Mode, hiển thị Full Cyber Skeleton 60 FPS      │
│    - Hỗ trợ Upload Video và Realtime Webcam                                  │
│                                                                              │
│  • Mobile App: appmobile/VF/ (React Native)                                  │
│    - Gọi API /api/analyze_squat để trả kết quả chấm form trên điện thoại    │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Cơ Sở Khoa Học & Thuật Toán AI

### 3.1. Kỹ thuật Letterbox chuẩn 128×128 (Không bẹp hình)
Khác với việc co dãn cưỡng bức (`cv2.resize`) làm người bị lùn hoặc béo biến dạng tỷ lệ giải phẫu:
* Thuật toán Letterbox giữ nguyên tỷ lệ khung hình gốc (Aspect Ratio).
* Thêm đệm đen (padding) cân xứng trên/dưới hoặc trái/phải để đưa về hình vuông $128 \times 128$.
* Toàn bộ tọa độ khớp được chiếu ngược chính xác về không gian ảnh gốc bằng phép biến đổi Afin nghịch đảo.

### 3.2. Dự đoán khớp Sub-Pixel bằng Soft-Argmax
Thay vì làm tròn số nguyên tọa độ pixel (dễ gây rung giật khung xương):
* Mạng xuất ra 33 Heatmap $32 \times 32$.
* Tọa độ $(\hat{x}, \hat{y})$ được tính bằng kỳ vọng toán học qua hàm Softmax không gian với hệ số nhiệt $\beta = 50.0$:
  $$\hat{x} = \sum_{u, v} x_u \cdot \frac{e^{\beta \cdot H(u,v)}}{\sum_{i, j} e^{\beta \cdot H(i,j)}}$$
* Giúp vị trí các khớp mượt mà đến từng phần phân số của pixel.

### 3.3. Tính toán góc 3D Vector chống phụ thuộc góc quay
Góc gập tại đỉnh khớp $B$ (ví dụ: Đầu gối) giữa 2 vector $\vec{BA}$ (Đùi: từ Gối lên Háng) và $\vec{BC}$ (Cẳng chân: từ Gối xuống Cổ chân):
$$\theta = \arccos\left( \frac{\vec{BA} \cdot \vec{BC}}{\|\vec{BA}\| \|\vec{BC}\|} \right) \times \frac{180^\circ}{\pi}$$
Nhờ vector 3D trong không gian, góc đo không bị sai lệch lớn khi người tập đứng quay chéo $45^\circ$ hay đứng nghiêng $90^\circ$.

---

## 4. Bộ Quy Chuẩn Sinh Cơ Học (PT Trương Thái Lưu)

Theo tài liệu chuyên môn `thongsobaitap_VisionFit_da_dien.docx` từ Chuyên gia **Trương Thái Lưu (PT Poliquin CPT)**:

| Thông số | Đoạn khớp đo | Ngưỡng Lý tưởng (Ideal) | Ngưỡng Cho phép (Acceptable) | Phân loại Lỗi & Cảnh báo |
| :--- | :--- | :---: | :---: | :--- |
| **Góc gập gối tại đáy** | Hông $\rightarrow$ Gối $\rightarrow$ Cổ chân | **$65^\circ - 90^\circ$** | $\le 95^\circ$ | **$>95^\circ$:** Lỗi Squat nông (Chưa đủ độ sâu, giảm hiệu quả cơ đùi) |
| **Độ nghiêng thân mình** | Hông $\rightarrow$ Vai (so với phương đứng) | **$20^\circ - 35^\circ$** | $\le 45^\circ$ | **$>45^\circ$:** Lỗi gập lưng quá mức (Nguy cơ chấn thương cột sống & thoát vị đĩa đệm) |
| **Góc thân so với mặt sàn** | Hông $\rightarrow$ Vai (so với phương ngang) | **$55^\circ - 70^\circ$** | $\ge 45^\circ$ | **$<45^\circ$:** Cảnh báo đổ người ra trước |

### Chu trình Máy trạng thái Đếm Rep (FSM):
1. **`STANDING`:** Người tập đứng thẳng, góc gối $> 140^\circ$.
2. **`DESCENDING`:** Người tập bắt đầu hạ trọng tâm (góc gối $< 140^\circ$), ghi nhận thời gian bắt đầu rep.
3. **`BOTTOM`:** Đạt điểm sâu nhất của chuyển động (góc gối $\le 95^\circ$ hoặc đạt cực tiểu). Ghi nhận góc gối thấp nhất và độ nghiêng thân lớn nhất.
4. **`ASCENDING`:** Người tập đẩy người đứng dậy (góc gối tăng lên $> \text{min} + 15^\circ$).
5. **`COMPLETE REP`:** Khi góc gối vượt trở lại $> 155^\circ$, rep hoàn thành:
   * Nếu $\text{Gối} \le 95^\circ$ và $\text{Thân} \le 45^\circ \rightarrow$ Ghi nhận **`GOOD_FORM`**.
   * Nếu $\text{Gối} > 95^\circ$ hoặc $\text{Thân} > 45^\circ \rightarrow$ Ghi nhận **`BAD_FORM`** kèm lý do cụ thể.

---

## 5. Cấu Trúc Thư Mục & Vai Trò Từng Tệp Tin

Sau khi quy hoạch chuẩn hóa module, thư mục `visionfit-ai-pro` được tổ chức như sau:

```
visionfit-ai-pro/
├── videos/                             # 🎥 Thư mục chứa video gốc nạp vào
│   ├── squat/                          # Chứa video Squat (person10..person14.mp4)
│   ├── push_up/                        # Sẵn sàng cho video bài Hít đất
│   └── lunge/                          # Sẵn sàng cho video bài Lunge
│
├── reports/                            # 📊 Thư mục chứa kết quả xuất ra
│   ├── squat/                          # Chứa video đã vẽ HUD & file JSON báo cáo Squat
│   ├── push_up/                        # Báo cáo riêng của bài Push-up
│   ├── lunge/                          # Báo cáo riêng của bài Lunge
│   └── eval/                           # Ảnh so sánh độ chính xác mô hình (pose_eval)
│
├── data/                               # 📦 Dữ liệu đóng gói NumPy
│   └── pose_letterbox_all.npz          # 2.543 frames 33 khớp từ 5 đối tượng
│
├── models/                             # 💾 File trọng số mô hình AI
│   ├── mediapipe/
│   │   └── pose_landmarker_full.task   # Teacher model (Google MediaPipe 33-landmark)
│   ├── pose_custom.pt                  # PoseNet cục bộ tự train (395 KB, PCK 99.71%)
│   └── action_demo.pt                  # ActionNet PyTorch phân loại động tác
│
├── web/                                # 🌐 Giao diện Web Studio (HTML5/JS/Cyberpunk CSS)
├── web_server.py                       # 🔌 API Server trung gian
├── visionfit.py                        # 🧠 File LÕI: ActionNet, PT Lưu Biomechanics, CLI
├── pose_model.py                       # 👁️ Kiến trúc & Huấn luyện mô hình PoseNet CNN
├── pose_detector.py                    # 🎯 Bộ nhận diện khớp giải phẫu học
├── repetition.py                       # 🔢 Bộ đếm rep mở rộng
├── metrics.py                          # 📈 Bộ tính toán độ chính xác (PCK, F1-score)
└── test_visionfit.py                   # 🧪 Bộ kiểm thử tự động (Unit Tests)
```

---

## 6. Hướng Dẫn Vận Hành & Khởi Chạy

### 6.1. Phân tích video Squat bằng dòng lệnh (CLI)
Để phân tích bất kỳ video nào trong thư mục `videos/squat/`:
```bash
# Phân tích video person10 (hệ thống tự tìm trong videos/squat/)
python visionfit.py squat --video person10_squat.mp4

# Phân tích video bất kỳ với đường dẫn đầy đủ
python visionfit.py squat --video videos/squat/person14_squat.mp4
```
* **Kết quả tạo ra:**
  * Video đã vẽ đầy đủ khung xương 33 khớp toàn thân + bảng HUD: `reports/squat/person14_squat_annotated.mp4`
  * Báo cáo JSON chi tiết từng rep: `reports/squat/person14_squat_report.json`

### 6.2. Khởi chạy Web Studio Studio
```bash
python web_server.py
```
* Mở trình duyệt tại: `http://localhost:8000`
* Bấm nút **"📁 Tải Video lên"** $\rightarrow$ Chọn video Squat bất kỳ $\rightarrow$ Xem AI phân tích thời gian thực trên giao diện Cyberpunk.

### 6.3. Gọi API từ Mobile App (`appmobile/VF`)
Backend cung cấp sẵn endpoint chuẩn REST JSON:
* **URL:** `POST http://<IP_SERVER>:8000/api/analyze_squat`
* **Body (JSON):**
  ```json
  {
    "video": "person10_squat.mp4"
  }
  ```
* **Response (JSON):**
  ```json
  {
    "status": "ok",
    "video": "person10_squat.mp4",
    "annotated_video": "reports/squat/person10_squat_annotated.mp4",
    "report": {
      "ai_engine": "VisionFit AI Biomechanical Engine",
      "total_reps_counted": 5,
      "good_reps_count": 5,
      "bad_reps_count": 0,
      "reps_detail": [
        {
          "rep_number": 1,
          "start_time": 3.6,
          "bottom_time": 5.4,
          "end_time": 7.2,
          "min_knee_angle": 62.3,
          "max_torso_lean_vert": 39.7,
          "status": "GOOD_FORM",
          "feedback": "Form chuan (Goi 62.3°, Than 39.7°)"
        }
      ]
    }
  }
  ```

---

## 7. Cẩm Nang Mở Rộng: Thêm Video Mới & Thêm Bài Tập Mới

### 7.1. Khi quay thêm Video bài Squat (Thêm dữ liệu học)
1. Thả file video vào thư mục: `videos/squat/` (ví dụ: `person15_squat.mp4`).
2. Muốn kiểm tra phân tích ngay:
   ```bash
   python visionfit.py squat --video person15_squat.mp4
   ```
3. Muốn cho PoseNet học thêm video này:
   * Chạy lệnh cập nhật dataset:
     ```bash
     python -c "
     import cv2, mediapipe as mp, numpy as np
     # Code quét thư mục videos/squat/ cập nhật vào data/pose_letterbox_all.npz
     "
     ```
   * Chạy lệnh train:
     ```bash
     python pose_model.py train --data data/pose_letterbox_all.npz --out models/pose_custom.pt --epochs 35
     ```

---

### 7.2. Khi mở rộng sang Bài tập mới (Ví dụ: Push-up / Hít đất hoặc Lunge)
Để thêm một bài tập mới, bạn thực hiện đúng 3 bước theo kiến trúc module hóa:

#### Bước 1: Chuẩn bị thư mục video
* Thả video vào thư mục tương ứng: `videos/push_up/` (ví dụ `person01_pushup.mp4`).

#### Bước 2: Thêm lớp phân tích Biomechanics vào `visionfit.py`
Mở [visionfit.py](file:///Users/mac/Documents/VISIONFIT_CAP/VisionFit/modules/model_AI/build/visionfit-ai-pro/visionfit.py), thêm class tương tự `BiomechanicalSquatAnalyzer` nhưng áp dụng công thức khớp của bài mới:

```python
class BiomechanicalPushUpAnalyzer:
    """Đánh giá bài Hít đất (Push-up):
    - Khớp đo chính: Khớp khuỷu tay (Vai -> Khuỷu -> Cổ tay)
    - Ngưỡng chuẩn: Hạ sâu <= 90°, Đẩy lên >= 160°
    - Lỗi sai: Chưa hạ đủ độ sâu (>90°), võng lưng (góc hông < 160°)
    """
    def __init__(self, elbow_bottom_max=90.0, hip_alignment_min=160.0):
        self.elbow_max = elbow_bottom_max
        self.hip_min = hip_alignment_min
        # Máy trạng thái: UP -> DESCENDING -> BOTTOM -> ASCENDING -> UP
```

#### Bước 3: Thêm lệnh CLI & Endpoint API
* Trong `visionfit.py`: Thêm subparser `pushup`:
  ```python
  pu = sub.add_parser('pushup', help='Analyze Push-up video form')
  pu.add_argument('--video', required=True)
  ```
* Trong `web_server.py`: Thêm endpoint `POST /api/analyze_pushup` trỏ kết quả xuất về thư mục [reports/push_up/](file:///Users/mac/Documents/VISIONFIT_CAP/VisionFit/modules/model_AI/build/visionfit-ai-pro/reports/push_up/).

---

## 8. Số Liệu Kiểm Thử & Đánh Giá (Defense Metrics)

Dưới đây là bảng số liệu đo đạc khoa học dùng để trình chiếu và đưa vào báo cáo đồ án tốt nghiệp:

### 8.1. Đánh giá Mô hình Chấm khớp PoseNet Tự Huấn Luyện (`models/pose_custom.pt`)
* **Tổng số khung hình huấn luyện:** 2.543 frames (5 người tập).
* **Kiểm thử trên tập dữ liệu hoàn toàn chưa từng thấy (507 Unseen Validation Frames):**

| Người tập (Subject) | Bối cảnh / Đặc thù | Số frame test | PCK @ 0.05 (Khắt khe) | PCK @ 0.10 (Chuẩn) | Sai số trung bình |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **person10** | Trong phòng tập, áo tối màu | 220 frames | **100.00%** | **100.00%** | 2.27 px |
| **person11** | Phòng khách gia đình | 70 frames | **100.00%** | **100.00%** | 2.25 px |
| **person12** | Sân thượng ngoài trời, cởi trần | 139 frames | **99.98%** | **100.00%** | 1.83 px |
| **person13** | Góc quay chéo | 38 frames | **99.36%** | **100.00%** | 2.34 px |
| **person14** | Góc quay chéo | 40 frames | **97.25%** | **100.00%** | 2.53 px |
| **TOÀN HỆ THỐNG** | **5 đối tượng khác nhau** | **507 frames** | **99.71%** | **100.00%** | **2.17 px** |

### 8.2. Đánh giá Mô hình Đếm Rep & Phân tích Form Squat (PT Trương Thái Lưu)
* **Video person10 (36.7s):** 5 reps $\rightarrow$ **5 GOOD, 0 BAD** (Form mẫu chuẩn độ sâu và lưng vững).
* **Video person11 (18.6s):** 3 reps $\rightarrow$ **3 GOOD, 0 BAD** (Form chuẩn độ sâu).
* **Video person12 (23.2s):** 3 reps $\rightarrow$ **1 GOOD, 2 BAD** (Bắt chính xác lỗi Squat nông ở Rep 2: $97.6^\circ$ và Rep 3: $95.1^\circ$).
* **Video person13 (6.5s):** 2 reps $\rightarrow$ **2 GOOD, 0 BAD**.
* **Video person14 (6.8s):** 3 reps $\rightarrow$ **2 GOOD, 1 BAD** (Bắt chính xác lỗi Squat nông ở Rep 1: $95.7^\circ > 95^\circ$).

---
*Tài liệu được cập nhật tự động và lưu trữ chính thức tại kho mã nguồn dự án VisionFit AI Pro.*
