# Báo Cáo Tiến Độ Frontend & Linh Vật (VisionFit Assistant)

**Ngày cập nhật:** 01/11/2026  
**Nhánh:** `feature/mascot-widget`  
**Phụ trách:** Lập trình viên Frontend & Linh vật  

---

## 1. Tổng Quan Công Việc Đã Hoàn Thành

Đã hoàn thiện toàn bộ hệ thống linh vật và widget đồng hành theo hợp đồng giao ước:

1. **Bộ đôi linh vật SVG tách lớp (Semantic Layers):**
   - **Gấu VIF (`bear.js`):** Khỏe khoắn, vui vẻ, mang trang phục thể thao thương hiệu VisionFit.
   - **Mèo VIF (`cat.js`):** Nhanh nhẹn, tinh nghịch, lanh lợi, đồng bộ về ngôn ngữ thiết kế, tỷ lệ đầu/thân và bảng màu.
   - Tách lớp rõ ràng: `<g class="layer-shadow">`, `<g class="layer-legs">`, `<g class="layer-body">`, `<g class="layer-arms">`, `<g class="layer-head-group">`, `<g class="layer-ears">`, `<g class="layer-eyes">`, `<g class="layer-mouth">`, `<g class="layer-whiskers">`, `<g class="layer-tail">`, `<g class="acc-medal">`.

2. **Hệ thống 4 cấp độ ngoại hình (`EVOLUTION_STAGES`):**
   - `starter`: Nhỏ nhắn, mới bắt đầu, băng đô thể thao VisionFit cơ bản.
   - `active`: Khỏe khoắn, áo tập ba lỗ VIF, băng quấn cổ tay thể thao.
   - `strong`: Thân hình nở nang săn chắc, tạ đơn/tạ ấm, đai lưng nâng tạ Pro.
   - `champion`: Phiên bản vô địch với 6 múi cách điệu, đai vàng ngôi sao và huy chương vàng danh dự VisionFit.

3. **Bộ chuyển động hoạt họa 7 trạng thái (`MASCOT_STATES`):**
   - `idle`: Thở nhấp nhô nhẹ nhàng, chớp mắt tự nhiên theo chu kỳ, đuôi khẽ đung đưa.
   - `greeting`: Vẫy tay chào vui tươi, nhún người nhảy nhẹ, biểu cảm mở miệng tươi cười (chạy 2.4s rồi trở về trạng thái nền).
   - `thinking`: Nghiêng đầu nhẹ nhàng 8–10 độ, mắt nhìn lên suy ngẫm, dấu ba chấm nảy trong bong bóng (không xoay cả người).
   - `speaking`: Cử động miệng và tay nhịp nhàng theo chu kỳ phản hồi ngắn.
   - `training`: Động tác nâng tạ và squat gập gối thể thao nhịp nhàng.
   - `celebrating`: Nhảy mừng chiến thắng, giơ hai tay lên cao, nụ cười rạng rỡ (chạy 3–4s rồi trở về trạng thái nền).
   - `error`: Biểu cảm bối rối nhẹ, ân cần, đầu hơi nghiêng, không làm người dùng cảm thấy bị trách móc.

4. **Tối ưu kỹ thuật & Khả năng tiếp cận (A11y):**
   - Tự động dừng animation khi tab trình duyệt bị ẩn (`document.hidden` -> thêm class `.tab-hidden` và `animation-play-state: paused`).
   - Hỗ trợ toàn diện `prefers-reduced-motion` và nút toggle tắt chuyển động.
   - Quản lý timer và listener chặt chẽ, dọn dẹp sạch sẽ khi `destroy()`.

5. **Phòng thử nghiệm Mascot Lab (`/mascot-lab`):**
   - Chuyển đổi qua lại giữa Gấu và Mèo.
   - Xem trực quan từng cấp độ và bảng so sánh 4 cấp song song.
   - Nút bấm kích hoạt tức thì cả 7 trạng thái chuyển động.
   - Giả lập vòng đời tập luyện (`start`, `pause`, `complete`).
   - Giả lập các kịch bản mạng và API (chậm 3s, lỗi 500, hết phiên 401).

6. **Màn hình chọn linh vật (`selector.js`):**
   - Thẻ hiển thị xem trước trực tiếp Gấu và Mèo với animation vẫy chào sống động khi chọn.
   - Trạng thái loading đang lưu, thông báo lỗi nếu thất bại, nút xác nhận đồng hành.
   - Lưu trữ tùy chọn tách biệt theo danh tính người dùng vào `sessionStorage` (không lưu dữ liệu nhạy cảm hay chat history vào localStorage).

7. **Floating Widget (`widget.js`, `widget.css`) & Host Adapter (`adapter.js`):**
   - **Thu gọn (Launcher):** Linh vật đứng nổi trực tiếp trên nền trong suốt góc dưới bên phải, kích thước chuẩn 88x104px (desktop) / 68x80px (mobile), kèm bong bóng chào mừng (tối đa 1 lần/phiên).
   - **Mở rộng (Panel):** Chiều rộng 390px chuẩn mobile/desktop, hiển thị lịch sử chat, gợi ý câu hỏi nhanh, ô nhập liệu, phím tắt Escape để thu gọn mà không làm mất lịch sử trò chuyện.
   - **Host Adapter:** Quản lý điều hướng an toàn qua danh sách trắng (`ALLOWED_NAVIGATION_TARGETS`: `workout`, `schedule`, `packages`, `profile`, `dashboard`, `chat`). Bỏ qua mọi target URL tùy ý.

8. **Hiển thị tin nhắn an toàn (`sanitizer.js`):**
   - Khắc phục hoàn toàn lỗi hiển thị Markdown thô như `**`.
   - Định dạng an toàn: `**bold**`, `*italic*`, `` `code` ``, danh sách `ul`/`ol`, liên kết `[link](url)` (chỉ chấp nhận `http/https`, chặn hoàn toàn `javascript:`, `data:`).
   - Tuyệt đối không dùng `innerHTML` thô với nội dung AI; mọi ký tự HTML đều được escape ngăn ngừa tấn công XSS.

---

## 2. Danh Sách Tệp Đã Tạo & Sửa

| Tệp | Thao tác | Mô tả |
|---|---|---|
| `apps/web/mascot/bear.js` | Tạo mới | Generator SVG tách lớp cho Gấu VIF qua 4 cấp độ |
| `apps/web/mascot/cat.js` | Tạo mới | Generator SVG tách lớp cho Mèo VIF qua 4 cấp độ |
| `apps/web/mascot/renderer.js` | Tạo mới | Engine quản lý vòng đời, chuyển đổi trạng thái, visibility |
| `apps/web/mascot/selector.js` | Tạo mới | Modal chọn linh vật với live preview và demo storage |
| `apps/web/mascot/mascot.css` | Cập nhật | Hệ thống CSS keyframes 7 trạng thái, reduced motion |
| `apps/web/mascot/lab.html` | Cập nhật | Giao diện phòng thử nghiệm linh vật chuyên sâu |
| `apps/web/mascot/lab.js` | Cập nhật | Logic điều khiển lab, so sánh 4 cấp, mô phỏng workout & API |
| `apps/web/widget/sanitizer.js` | Tạo mới | Bộ lọc và định dạng tin nhắn an toàn chống XSS |
| `apps/web/widget/adapter.js` | Tạo mới | Host adapter và navigation allowlist |
| `apps/web/widget/widget.js` | Tạo mới | Component Floating Widget (launcher + chat panel) |
| `apps/web/widget/widget.css` | Tạo mới | Styles cho floating widget, responsive mobile/desktop |
| `apps/web/app.js` | Cập nhật | Định dạng an toàn tin nhắn trong chat app chính, lời chào cá nhân hóa |
| `apps/web/styles.css` | Cập nhật | Bổ sung class cho danh sách, code, link an toàn |
| `tests/web/mascot.test.js` | Tạo mới | Unit test cho SVG generation, semantic layers, props |
| `tests/web/widget.test.js` | Tạo mới | Unit test cho sanitizer, markdown format, XSS protection, allowlist |
| `package.json` | Cập nhật | Bổ sung script `test:web` và tích hợp `tests/web/` vào `npm test` |
| `docs/frontend/STATUS.md` | Tạo mới | Báo cáo tiến độ và bàn giao công việc |
| `docs/frontend/INTEGRATION.md` | Tạo mới | Tài liệu tích hợp widget vào Vue/React Native host |

---

## 3. Kết Quả Kiểm Thử (Verification)

1. **Cú pháp (`npm run check`):**
   ```bash
   node scripts/check.js
   # Pass 100% không có lỗi cú pháp
   ```

2. **Kiểm thử tự động (`npm test`):**
   - Tổng cộng **19/19 tests** đạt (100% pass):
     - 10 tests API & Installer
     - 2 tests Contracts
     - 7 tests Frontend Mascot & Widget
   - Thời gian chạy: ~584ms.

3. **Kiểm thử trực quan trên trình duyệt (Browser Subagent):**
   - Đã kiểm tra trực quan tại `http://localhost:3000/mascot-lab` và `http://localhost:3000/`.
   - Responsive hoàn chỉnh tại: **1440px**, **768px**, **390px**, và **360px**.
   - Mọi hoạt họa chạy mượt mà, không giật lag, không lỗi layout.

---

## 4. Bàn Giao Cho Đồng Đội Phụ Trách Backend & AI

Để hoàn thiện tích hợp sản phẩm khi chuyển từ chế độ Demo sang Live, phía Backend cần hỗ trợ các hạng mục sau:

1. **Đăng ký định tuyến phục vụ asset tĩnh mới (Whitelist Routes):**
   Nếu đồng đội muốn các trang tải trực tiếp từng module rời thay vì qua bundle, vui lòng thêm các đường dẫn tĩnh an toàn vào từ điển `files` trong `apps/api/app.js`:
   ```javascript
   '/mascot/bear.js': ['mascot/bear.js', 'text/javascript'],
   '/mascot/cat.js': ['mascot/cat.js', 'text/javascript'],
   '/mascot/renderer.js': ['mascot/renderer.js', 'text/javascript'],
   '/mascot/selector.js': ['mascot/selector.js', 'text/javascript'],
   '/widget/widget.js': ['widget/widget.js', 'text/javascript'],
   '/widget/widget.css': ['widget/widget.css', 'text/css'],
   '/widget/adapter.js': ['widget/adapter.js', 'text/javascript'],
   '/widget/sanitizer.js': ['widget/sanitizer.js', 'text/javascript'],
   ```

2. **API lưu chọn lựa linh vật theo người dùng:**
   - Đề xuất endpoint: `POST /api/user/mascot` với body `{ "species": "bear" | "cat" }`.
   - Cung cấp trường `mascot_species` trong phản hồi `GET /api/auth/me`.

3. **Cấp độ ngoại hình thật dựa trên dữ liệu buổi tập đã xác thực:**
   - Cung cấp trường `mascot_stage` (`starter` | `active` | `strong` | `champion`) từ backend dựa trên số buổi tập thật trong cơ sở dữ liệu (không để frontend tự tính toán).
