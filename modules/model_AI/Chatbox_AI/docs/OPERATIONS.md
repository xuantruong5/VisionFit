# Vận hành và phát triển

## Môi trường

- JavaScript ES modules cho cả frontend/backend; HTML và CSS cho giao diện. Không có framework UI hoặc package runtime bên ngoài.
- Node.js >=24, SQLite tích hợp Node (`node:sqlite`). Dữ liệu lịch sử nằm tại `DB_PATH`, không được commit.
- Thay đổi biến môi trường: dừng/chạy lại server. `APP_ORIGIN` phải khớp URL mở trong trình duyệt (khác biệt localhost/127.0.0.1 hoặc port sẽ chặn request ghi).
- `HOST` mặc định `127.0.0.1`. Không mở demo ra internet.

## Chuyển môi trường thật

1. Thực hiện đầy đủ hợp đồng API và kiểm thử quyền trong `VISIONFIT_API.md`.
2. Cấu hình `DATA_MODE=live`, `AI_MODE=live`, khóa/model AI, phê duyệt dữ liệu gửi AI.
3. Reverse proxy HTTPS, `NODE_ENV=production`, `APP_ORIGIN=https://your-host.example`, hai upstream HTTPS. Cấu hình proxy chỉ cho phép Host/domain đã định trước, không cache `/api/*`, giới hạn body và request timeout hợp lý.
4. Mặc định chỉ một tiến trình; session/rate-limit ở RAM, lịch sử SQLite. Khởi động lại sẽ logout tất cả. Không dùng nhiều replica trước khi chuyển session/rate-limit sang kho chung và cân nhắc PostgreSQL.
5. Mặc định giới hạn đăng nhập theo địa chỉ socket, không tin `X-Forwarded-For`. Sau proxy có thể tất cả user chung một bucket; cần cấu hình trusted proxy/rate limit tại gateway trước khi tăng quy mô.
6. Bảo vệ thư mục SQLite và volume/backup bằng quyền filesystem và mã hóa ổ đĩa; app hiện không tự mã hóa database. Hạn lưu trữ 30 ngày, dọn lúc khởi động và mỗi phút. Xóa trong ứng dụng không tự xóa các bản backup; chính sách backup phải xử lý riêng.
7. Log chỉ có request ID, status, thời gian, mode và token usage. Token usage không phải số tiền; muốn tính phí cần bảng giá model và báo cáo chi phí riêng.

## API của trợ lý

Mọi request ghi cần `Origin` trùng `APP_ORIGIN`, JSON và cookie phiên cùng origin. Không dùng localStorage để lưu token. Không gửi khóa AI lên frontend.

| Method | Path | Nội dung |
|---|---|---|
| GET | /api/config | Chế độ dữ liệu và AI công khai |
| POST | /api/auth/login | `{role,email,password}` |
| GET | /api/auth/me | Danh tính đã xác thực |
| POST | /api/auth/logout | Xóa phiên chatbot |
| GET | /api/context | Dữ liệu thu gọn cho thẻ thông tin |
| GET | /api/messages | Tối đa 100 tin nhắn riêng |
| DELETE | /api/messages | Xóa toàn bộ lịch sử của chủ thể hiện tại |
| POST | /api/chat | Chỉ nhận `{message}` tối đa 2.000 ký tự |

Hiện một lịch sử hội thoại/tài khoản/phòng, chưa hỗ trợ nhiều thread. Tin nhắn và câu trả lời lưu theo cặp sau khi AI thành công. Lỗi không lưu cặp dở dang. Ngăn chat đồng thời của cùng chủ thể và không cho xóa khi câu trả lời đang tạo.

## Nhúng vào web/app

Bản đầu phục vụ UI và API cùng origin. CSP `frame-ancestors 'self'` và `X-Frame-Options SAMEORIGIN` chặn iframe khác domain theo mặc định. Không tắt tùy tiện các lớp này để nhúng.

Phương án ưu tiên: tích hợp component UI vào FE chính và đặt BFF trợ lý sau proxy cùng origin. Native app cần thiết kế SSO/code exchange một lần và xác thực API phù hợp; không truyền mật khẩu, session hoặc token dài hạn trong URL/WebView query. Chưa có SSO trong bản này.

## Mở rộng

- Đổi cách lấy dữ liệu: `server/visionfit.js`; giữ xác thực và thu gọn trường.
- Đổi nhà cung cấp AI: `server/assistant.js`; không cho mô hình tự chọn URL hoặc SQL.
- Thêm kho tài liệu: có thể tạo adapter retrieval theo phòng; vẫn kiểm tra tenant trước retrieval.
- Thêm hành động: endpoint whitelist, kiểm tra quyền trên backend thật và xác nhận của user trước khi ghi.
- Thêm nhân vật nhiều trạng thái: thay CSS mascot bằng tài sản có quyền sử dụng; không sao chép linh vật Duolingo.

## Kiểm chứng

`npm test` kiểm thử local bằng mock upstream, không tiêu thụ API trả phí. Muốn xác nhận VisionFit/AI thật phải cung cấp cấu hình và chạy thử tích hợp trên staging. Không xem test giả lập là chứng nhận toàn bộ backend VisionFit đã hết lỗi.
