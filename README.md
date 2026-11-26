# 🏋️‍♂️ VisionFit — Hệ Sinh Thái Phân Tích Kỹ Thuật Tập Luyện & Quản Lý Phòng Gym Thông Minh

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/PyTorch-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white" alt="PyTorch" />
  <img src="https://img.shields.io/badge/OpenCV-5C3EE8?style=for-the-badge&logo=opencv&logoColor=white" alt="OpenCV" />
  <img src="https://img.shields.io/badge/Laravel-12.x-FF2D20?style=for-the-badge&logo=laravel&logoColor=white" alt="Laravel" />
  <img src="https://img.shields.io/badge/React_Native-0.87-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React Native" />
  <img src="https://img.shields.io/badge/Vue.js-3.x-4FC08D?style=for-the-badge&logo=vuedotjs&logoColor=white" alt="Vue 3" />
  <img src="https://img.shields.io/badge/Node.js-24+-5FA04E?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
</p>

---

## 📌 Giới Thiệu (Overview)

**VisionFit** là giải pháp công nghệ toàn diện ứng dụng **Thị giác máy tính (Computer Vision)** và **Trí tuệ nhân tạo (AI)** vào việc phân tích kỹ thuật vận động thể hình (gym) qua camera đơn (Single Camera), đồng thời cung cấp nền tảng quản lý phòng gym đa nền tảng kết nối liền mạch giữa **Hội viên (Member)**, **Huấn luyện viên cá nhân (Personal Trainer - PT)** và **Ban quản lý (Admin)**.

Hệ sinh thái giải quyết bài toán:
- **Tự động nhận diện tư thế & đếm số lần lặp (Rep Counting)** trong thời gian thực mà không cần cảm biến đeo trên người.
- **Đánh giá chuẩn xác góc sinh cơ học (Biomechanics)**, cảnh báo sai tư thế ngay cả khi cơ thể bị che khuất một phần (occlusion).
- **Trợ lý AI thể hình (VIF Assistant)** tư vấn giáo án, lịch tập, chế độ dinh dưỡng cá nhân hóa.
- **Nền tảng số hóa quản lý phòng gym**: quản lý hội viên, huấn luyện viên, hợp đồng gói tập, chấm công, doanh thu và mạng xã hội thể hình.

---

## 🏗️ Kiến Trúc Tổng Thể Hệ Thống (Architecture)

VisionFit được thiết kế theo mô hình vi cấu trúc mô-đun hóa (Modular Architecture), bao gồm 4 phân hệ cốt lõi:

```text
                               ┌────────────────────────────────────────────────────────┐
                               │                    NGƯỜI DÙNG CUỐI                     │
                               └───────────┬────────────────────────────────┬───────────┘
                                           │                                │
                       ┌───────────────────▼──────────────┐   ┌─────────────▼───────────────┐
                       │     📱 Ứng dụng Di động          │   │      💻 Web Studio AI       │
                       │   (React Native: Member/PT)      │   │  (HTML5/Canvas Studio &     │
                       └──────────────┬───────────────────┘   │   Phân tích Video Trực tiếp)│
                                      │                       └─────────────┬───────────────┘
                                      │ REST API / WebSocket                │
                                      ▼                                     │
┌────────────────────────────────────────────────────────────────────────┐  │
│                   ⚙️ CỔNG DỊCH VỤ BACKEND (Laravel 12)                 │  │
│  - Authentication (Sanctum)         - Real-time Chat & Noti (Reverb)   │  │
│  - Quản lý Hội viên / PT / Admin    - Đặt lịch, Gói tập & Doanh thu   │  │
│  - Mạng xã hội & Tương tác Gym      - Sổ tay Dinh dưỡng & Bài tập      │  │
└──────────────────┬─────────────────────────────────┬───────────────────┘  │
                   │                                 │                      │
                   ▼ REST API                        ▼ REST API / Bridge    │
┌──────────────────────────────────────┐   ┌────────────────────────────────▼───────────────┐
│        🤖 TRỢ LÝ AI (Chatbox_AI)     │   │         🎯 LÕI THỊ GIÁC MÁY TÍNH & AI          │
│ - Trợ lý thông minh VIF (Node.js 24) │   │              (visionfit-ai-pro)                │
│ - Ngữ cảnh dữ liệu phòng tập thật    │   │ - PoseNet: Trích xuất 33 điểm khớp 2D         │
│ - RAG / LLM Integration (OpenAI API) │   │ - ActionNet: Temporal CNN nhận diện động tác  │
└──────────────────────────────────────┘   │ - Biomechanics & Repetition Counter           │
                                           │ - Offline/Local Web Server Bridge             │
                                           └───────────────────────────────────────────────┘
                                                             ▲
                                                             │ Quản trị & Báo cáo
                                           ┌─────────────────┴──────────────────────────────┐
                                           │          📊 BẢNG ĐIỀU KHIỂN QUẢN TRỊ           │
                                           │         (Vue 3 + Vite Admin Dashboard)         │
                                           └────────────────────────────────────────────────┘
```

---

## 🧩 Chi Tiết Các Phân Hệ (Modules)

### 1. 🎯 Phân Hệ Lõi Trí Tuệ Nhân Tạo & Thị Giác Máy Tính (`modules/model_AI/visionfit-ai-pro`)
Được xây dựng bằng Python và PyTorch, hoạt động hoàn toàn độc lập (Offline-capable) mà không phụ thuộc vào Cloud API.

* **PoseNet (Ước lượng tư thế 33 điểm mốc)**:
  - Input: Khung hình RGB kích thước `128×128`.
  - Cơ chế: Hồi quy bản đồ nhiệt (Heatmap Regression) và trích xuất tọa độ `(x, y)` kết hợp chỉ số tin cậy/che khuất (Visibility/Confidence) theo quy chuẩn 33 landmarks của MediaPipe Pose.
  - Chuẩn hóa: Dịch gốc tọa độ tâm hông (Hip-Centering) và chuẩn hóa tỷ lệ thân người (Torso-Scaling Invariance), giúp nhận diện chính xác bất kể khoảng cách và góc máy.
* **ActionNet (Phân loại bài tập Gym theo thời gian)**:
  - Kiến trúc: Temporal Convolutional Neural Network (Temporal CNN).
  - Input: Chuỗi 32 frame liên tiếp của 33 điểm mốc tọa độ đã chuẩn hóa (`32 × 33 × 4`).
  - Lớp phân loại (`labels.json`): `squat`, `push_up`, `lunge`, `standing`, `unknown`.
* **Bộ Đếm Rep & Phân Tích Động Học Sinh Học (Biomechanics)**:
  - Tính toán góc động học thời gian thực (góc đầu gối, góc khuỷu tay, góc gập hông).
  - Thuật toán Finite State Machine (FSM) lọc rung lắc tín hiệu, nhận diện điểm uốn (Peak/Valley) để ghi nhận hoàn thành một lần lặp (Rep) chuẩn kỹ thuật.
* **Web Studio & Server Bridge (`web_server.py`)**:
  - Giao diện HTML5 Canvas Cyberpunk Dark Mode cho phép soi khớp skeleton trực tiếp từ webcam/video.
  - Cung cấp bộ công cụ gán nhãn thủ công (`pose_annotator.py`), trích xuất clip (`extract_clips.py`) và đánh giá chỉ số (`metrics.py`).

---

### 2. 🤖 Trợ Lý Ảo Thể Hình VIF (`modules/model_AI/Chatbox_AI`)
Ứng dụng trợ lý hội thoại thông minh độc lập chuyên sâu về Fitness:
* **Công nghệ**: Node.js 24+ ES Modules (không cần runtime phụ thuộc nặng).
* **Kết nối Backend**: Tích hợp với Laravel API qua 2 endpoint nghiệp vụ `/assistant/me` và `/assistant/context`.
* **Phân quyền vai trò (Role-based Context)**:
  - **Hội viên**: Tra cứu số buổi tập còn lại, lịch tập sắp tới, tiến độ thể hình, gợi ý thực đơn.
  - **Huấn luyện viên (PT)**: Thống kê học viên phụ trách, lịch dạy hôm nay, doanh thu.
  - **Quản lý (Admin)**: Báo cáo nhanh tình hình phòng gym.
* **Bảo mật & Tối ưu**: Lưu trữ phiên làm việc qua HTTP-Only Cookie, mã hóa token RAM, quản lý lịch sử trò chuyện SQLite tách biệt theo `gym_id + role + user_id`.

---

### 3. ⚙️ Hệ Thống Backend Trung Tâm (`modules/backend/visionfit`)
Nền tảng xử lý dữ liệu và cung cấp API tập trung cho toàn bộ hệ sinh thái:
* **Framework**: Laravel 12.x (PHP 8.2+).
* **Xác thực & Bảo mật**: Laravel Sanctum (Token Auth đa vai trò: Client, Trainer, Admin).
* **Thời gian thực (Real-time)**: Laravel Reverb / Pusher hỗ trợ phòng chat trực tiếp giữa Học viên và PT (`ChatController`, `RoomClient`), thông báo đẩy.
* **Mô-đun chức năng chính**:
  - Quản lý người dùng, huấn luyện viên, hợp đồng và đăng ký gói tập (`GoiTapController`, `MembersController`, `TrainerController`).
  - Quản lý lịch tập, buổi tập, ghi nhận lịch sử hiệp tập và tiến độ tập luyện (`BuoiTapController`, `LichTap`).
  - Mạng xã hội thể hình nội bộ: đăng bài, bình luận, thả tim, chia sẻ kinh nghiệm (`BaiDangController`).
  - Sổ tay bách khoa toàn thư dinh dưỡng, món ăn và thực phẩm bổ sung (`BachKhoaToanThuController`, `DinhDuongTheThaoController`).
  - Tích hợp cổng thanh toán và quản lý hóa đơn (`ThanhToanController`).

---

### 4. 📱 Ứng Dụng Di Động VisionFit (`modules/appmobile/VF`)
Ứng dụng di động đa nền tảng tối ưu cho cả Android và iOS:
* **Công nghệ**: React Native 0.87, React 19, TypeScript.
* **Trải nghiệm Hội Viên (Member Experience)**:
  - Khảo sát thể trạng ban đầu, thiết lập mục tiêu (giảm mỡ, tăng cơ), chọn cấp độ bài tập.
  - Quản lý giáo án tập cá nhân hóa, chuỗi ngày tập liên tiếp (Streak), biểu đồ năng lượng tiêu hao.
  - **Phân tích kỹ thuật video AI**: Tải lên video bài tập để nhận phản hồi phân tích dáng tập từ AI.
  - Chat trực tiếp với Huấn luyện viên cá nhân và tham khảo ý kiến Trợ lý AI VIF.
  - Sổ tay thể hình: Tra cứu thư viện bài tập chuẩn, thực đơn ăn uống và kiến thức dinh dưỡng thể thao.
  - Đăng ký gói tập, quét mã QR điểm danh, thanh toán trực tuyến.
* **Trải nghiệm Huấn Luyện Viên (Personal Trainer)**:
  - Bảng điều khiển hiệu suất: danh sách học viên, lịch dạy trong tuần/tháng, doanh thu cá nhân.
  - Tạo lịch tập, chấm điểm và đánh giá chi tiết từng buổi tập của học viên.
  - Kênh tương tác riêng với học viên được phân công.

---

### 5. 💻 Bảng Điều Khiển Quản Trị Web (`modules/web-app/web-visionfit`)
Dành cho người quản lý và chủ phòng gym để vận hành toàn bộ hoạt động:
* **Công nghệ**: Vue 3 (Composition API), Vite, Bootstrap 5, Chart.js.
* **Chức năng chính**:
  - **Dashboard tổng quan**: Thống kê doanh thu theo ngày/tháng, lượng hội viên mới, tỷ lệ gia hạn gói tập.
  - **Quản lý nghiệp vụ gym**: Quản lý gói tập, bán gói, xuất hóa đơn, quản lý giao dịch.
  - **Quản trị nhân sự & lớp học**: Quản lý huấn luyện viên, đánh giá PT, phân công học viên, quản lý lịch lớp tập.
  - **Phân tích AI & Báo cáo chất lượng**: Giám sát dữ liệu phân tích chuyển động AI, video bài tập, báo cáo sai sót kỹ thuật của hội viên theo thời gian.
  - **Phân quyền bảo mật**: Quản trị vai trò quản trị viên (Admin/Manager/Staff).

---

## 📁 Cấu Trúc Thư Mục Dự Án (Directory Structure)

```text
VisionFit/
├── modules/
│   ├── model_AI/                         # 🧠 Phân hệ Trí tuệ Nhân tạo & Xử lý Thị giác
│   │   ├── visionfit-ai-pro/             # Lõi PyTorch PoseNet, ActionNet & Web Studio
│   │   │   ├── data/                     # Dữ liệu tập mẫu (.npz, .npy)
│   │   │   ├── models/                   # Trọng số mô hình đã huấn luyện (.pt)
│   │   │   ├── web/                      # Giao diện Web Studio (HTML5/Canvas)
│   │   │   ├── visionfit.py              # Huấn luyện & suy luận ActionNet
│   │   │   ├── pose_model.py             # Kiến trúc & huấn luyện PoseNet 33 điểm
│   │   │   ├── pose_detector.py          # Bộ bóc tách khớp và hình học giải phẫu
│   │   │   ├── repetition.py             # Đếm rep cho Squat, Push-up, Lunge
│   │   │   ├── web_server.py             # Máy chủ tích hợp cục bộ
│   │   │   └── requirements-camera.txt   # Thư viện Python phụ thuộc
│   │   └── Chatbox_AI/                   # 🤖 Trợ lý ảo VIF Assistant (Node.js)
│   │       ├── apps/api/                 # API Server trung gian kết nối LLM
│   │       ├── integrations/visionfit/   # Adapter tích hợp API với Laravel
│   │       └── package.json              # Cấu hình dự án trợ lý
│   │
│   ├── backend/                          # ⚙️ Phân hệ Máy chủ Dịch vụ & Dữ liệu
│   │   └── visionfit/                    # Dự án Laravel 12
│   │       ├── app/                      # Models, Controllers, Middleware
│   │       │   ├── Http/Controllers/    # Bộ điều khiển API (Members, Trainer, Assistant...)
│   │       │   └── Models/               # Eloquent ORM (Client, Trainer, BaiTap...)
│   │       ├── database/                 # Migrations & Seeders CSDL
│   │       ├── routes/                   # Định tuyến API (api.php, assistant.php)
│   │       └── composer.json             # Danh sách gói PHP phụ thuộc
│   │
│   ├── appmobile/                        # 📱 Phân hệ Ứng dụng Di động
│   │   └── VF/                           # Ứng dụng React Native
│   │       ├── src/
│   │       │   ├── page/member/          # Màn hình chức năng dành cho Hội viên
│   │       │   ├── page/trainners/       # Màn hình chức năng dành cho Huấn luyện viên
│   │       │   ├── page/chat/            # Giao diện phòng chat thời gian thực
│   │       │   └── components/           # Các UI Component dùng chung
│   │       └── package.json              # Cấu hình gói React Native
│   │
│   └── web-app/                          # 💻 Phân hệ Quản trị Web Admin
│       └── web-visionfit/                # Ứng dụng Vue 3 + Vite
│           ├── src/
│           │   ├── components/Admin/     # Màn hình quản trị (dashboard, báo cáo AI, PT...)
│           │   ├── router/               # Điều hướng Vue Router & xác thực quyền Admin
│           │   └── layout/               # Giao diện khung chuẩn (Sidebar, Header)
│           └── package.json              # Cấu hình gói Vue 3
│
├── LICENSE                               # Giấy phép mã nguồn
└── README.md                             # Tài liệu hướng dẫn dự án tổng thể
```

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy (Getting Started)

### Yêu Cầu Môi Trường (Prerequisites)
* **Python**: `3.10` trở lên (Khuyến nghị dùng GPU CUDA nếu muốn huấn luyện lại mô hình).
* **Node.js**: `22.x` hoặc `24.x` trở lên & `npm` / `yarn`.
* **PHP**: `8.2` trở lên & **Composer**.
* **Hệ điều hành**: Windows 10/11, macOS hoặc Linux.
* **Môi trường di động**: Android Studio (Android SDK) hoặc Xcode (đối với macOS).

---

### 1. Khởi chạy Lõi AI & Thị giác Máy tính (`visionfit-ai-pro`)

```bash
cd modules/model_AI/visionfit-ai-pro

# Khởi tạo và kích hoạt môi trường ảo Python
python -m venv .venv
# Trên Windows:
.venv\Scripts\activate
# Trên macOS/Linux:
# source .venv/bin/activate

# Cài đặt các thư viện cần thiết
pip install -r requirements-camera.txt

# Khởi động Web Studio phân tích cử động thời gian thực (Port 8080)
python web_server.py
# Hoặc trên Windows: chạy file run_web.bat
```

> **Kiểm thử mô hình ActionNet với dữ liệu mẫu:**
> ```bash
> python visionfit.py predict --model models/action_demo.pt --input data/example.npy
> ```

---

### 2. Khởi chạy Trợ lý AI VIF (`Chatbox_AI`)

```bash
cd modules/model_AI/Chatbox_AI

# Cài đặt thư viện Node.js
npm install

# Tạo file cấu hình môi trường
copy .env.example .env

# Chạy ở chế độ phát triển (Port 3000)
npm run dev
```

---

### 3. Khởi chạy Backend Laravel (`backend/visionfit`)

```bash
cd modules/backend/visionfit

# Cài đặt thư viện PHP
composer install

# Cài đặt thư viện JavaScript
npm install

# Thiết lập file môi trường
copy .env.example .env
php artisan key:generate

# Cấu hình kết nối Database trong .env, sau đó chạy migration:
php artisan migrate

# Khởi chạy server Laravel API (Port 8000)
php artisan serve
```

---

### 4. Khởi chạy Bảng Quản Trị Web Admin (`web-app/web-visionfit`)

```bash
cd modules/web-app/web-visionfit

# Cài đặt các phụ thuộc
npm install

# Khởi động máy chủ phát triển Vite (Mặc định Port 5173)
npm run dev
```

---

### 5. Khởi chạy Ứng Dụng Di Động React Native (`appmobile/VF`)

```bash
cd modules/appmobile/VF

# Cài đặt dependencies
npm install

# Chạy máy chủ đóng gói Metro
npm run start

# Mở một terminal mới để chạy ứng dụng trên thiết bị Android:
npm run android
# Hoặc chạy trên thiết bị iOS (trên macOS):
# npm run ios
```

---

## 🔬 Quy Trình Huấn Luyện AI Mới (Training Pipeline)

Để tự tạo và huấn luyện mô hình nhận diện tư thế từ tập dữ liệu riêng:

1. **Trích xuất khung hình từ video quay thật**:
   ```bash
   python extract_frames.py --video videos/squat_01.mp4 --out data/frames/person01 --every 10
   ```
2. **Gán nhãn 33 điểm mốc xương khớp bằng công cụ đồ họa**:
   ```bash
   python pose_annotator.py --images data/frames/person01 --subject person01 --out data/pose_real.npz
   ```
3. **Huấn luyện mô hình PoseNet**:
   ```bash
   python pose_model.py train --data data/pose_real.npz --out models/pose.pt --epochs 50 --batch 8
   ```
4. **Cắt clip động tác & chuẩn bị chuỗi cử động (Action Sequences)**:
   ```bash
   python extract_clips.py --source videos/squat_01.mp4 --pose-model models/pose.pt --label squat --subject person01
   ```
5. **Huấn luyện mô hình phân loại động tác ActionNet**:
   ```bash
   python visionfit.py train --data data/gym_actions.npz --labels labels.json --out models/action.pt --epochs 40
   ```

---

## 🛡️ Đóng Góp & Bản Quyền (License)

Dự án được phân phối dưới giấy phép **MIT License**. Mọi chi tiết xin vui lòng xem tệp [LICENSE](file:///e:/VisionFit/LICENSE).

---

<p align="center">
  <b>VisionFit Team</b> • Nâng tầm trải nghiệm luyện tập bằng công nghệ thị giác máy tính tiên tiến.
</p>
