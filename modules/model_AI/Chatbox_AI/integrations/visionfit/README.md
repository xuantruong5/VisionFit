# Bộ tích hợp database VisionFit

Đã viết theo schema tại `xuantruong5/VisionFit`, nhánh `develop`, commit `f9f349ced2cf79be07e0a325ccc5b416238bea28`. Chạy trong Laravel hiện có và dùng DB connection của Laravel. Không sao chép DB, không cần đưa mật khẩu DB cho chatbot.

## Cài đặt trên máy có backend VisionFit

Trong thư mục **Chatbox_AI**:

```bash
npm run setup:visionfit -- "D:/VisionFit/modules/backend/visionfit" --dry-run
npm run setup:visionfit -- "D:/VisionFit/modules/backend/visionfit"
```

Thay đường dẫn bằng thư mục Laravel có `artisan`, `composer.json` và `routes/api.php`. Không trỏ vào thư mục app mobile hoặc thư mục gốc monorepo.

Script thêm 5 file PHP, thêm một dòng require vào `routes/api.php`, và sao lưu route cũ thành `routes/api.php.before-assistant.bak`. Chạy lại với cùng nội dung không tạo route trùng. Nếu có file tùy chỉnh khác, script dừng trước khi ghi để không ghi đè.

Trong thư mục **backend VisionFit**:

```bash
php artisan optimize:clear
php artisan test --filter=AssistantApiTest
php artisan serve --host=127.0.0.1 --port=8000
```

Lệnh test dùng SQLite `:memory:` và các migration thật liên quan; không dùng database khách hàng. Cần PHP/Composer/vendor của backend hiện có. Nếu backend đã chạy ở server, triển khai 5 file và dòng require theo quy trình của nhóm thay vì `artisan serve`.

Trong **Chatbox_AI**:

```powershell
# Windows PowerShell
Copy-Item .env.visionfit.example .env
npm run dev
```

macOS/Linux: dùng `cp .env.visionfit.example .env`. Nếu đã có `.env` chứa khóa/cấu hình riêng, chỉnh `DATA_MODE=live` và URL API trong file đó, không ghi đè.

Mặc định mẫu trỏ `http://127.0.0.1:8000/api`. Mở chatbot `http://localhost:3000`, đăng nhập tài khoản VisionFit. Nếu backend ở địa chỉ khác, sửa `VISIONFIT_API_URL`. Không dùng tài khoản demo khi `DATA_MODE=live`.

## Dữ liệu đọc trực tiếp

| Nội dung | Bảng/nguồn |
|---|---|
| Danh tính, mục tiêu, cấp độ | clients / trainers / admins + personal_access_tokens |
| Gói đã đăng ký, hạn, số buổi mua | dang_ky_goi + chi_tiet_dang_ky_goi + goi_tap |
| Lịch sắp tới | lich_tap + dang_ky_chuong_trinh + chuong_trinh_tap + trainers |
| Số buổi kết thúc trong tuần và % hoàn thành trung bình | buoi_tap, trạng thái 2/3, từ đầu tuần đến hiện tại |
| PT: số hội viên được phân công | clients cùng phòng + lich_tap.id_trainner, bỏ lịch hủy |
| Quản lý: số hội viên / số hội viên có gói hết hạn trong 7 ngày | clients và đăng ký gói trong phòng đã được gán |

`so_buoi` của chi tiết gói là số buổi đăng ký. Chưa có ledger tiêu hao gói rõ ràng trong schema đã xem, nên **remaining_sessions=null**, không lấy số buổi đăng ký làm số buổi còn lại. Lịch thiếu giờ trả ngày riêng, không tự tạo giờ. Chương trình chưa có đăng ký/lịch/gói sẽ trả rỗng, không dựng dữ liệu giả.

## Phân quyền

- Token Sanctum thật, kiểm tra hết hạn/thu hồi, trạng thái hoạt động và khóa; token có `*` hoặc `assistant:read`.
- Không đi qua ClientMiddleware bypass local. Không có token thì trả 401, kể cả local.
- Hội viên chỉ đọc chính mình; gói còn phải thuộc phòng của hội viên.
- PT chỉ có số liệu tổng hợp học viên được phân công qua lịch cùng phòng, không có danh sách hồ sơ chi tiết.
- Bảng admins chưa có cột sở hữu phòng. Mặc định admin bị 403. Người vận hành phải xác minh rồi gán `admin_id => id_phong_tap` trong `config/assistant.php`; không gán theo lựa chọn gửi từ trình duyệt.
- Không nhận query chọn user/phòng. Không sửa các API cũ hoặc khẳng định các API đó đã an toàn.
- Thời gian theo `config('app.timezone')`; cấu hình backend theo timezone lưu lịch thực tế (thường Asia/Ho_Chi_Minh). Không tự thay timezone DB hiện có.

## Mô hình AI

Mẫu live dùng `AI_MODE=demo`: câu trả lời theo từ khóa nhưng lấy dữ liệu thật, không cần khóa AI để kiểm tra kết nối. Bật AI thật theo README gốc sau khi kiểm tra API và phê duyệt dữ liệu gửi nhà cung cấp.

## Kiểm thử

7 test Laravel dùng migrations thật kiểm tra: token local, scope hội viên/phòng, scope PT, admin mapping, hết hạn/thu hồi/abilities, user selector/tài khoản khóa, dữ liệu thiếu. Workflow `VisionFit database integration` tự checkout commit nguồn đã ghim và chạy bộ test. Test này không kết nối DB sản xuất.

## Gỡ tích hợp

Xóa dòng `require __DIR__ . '/assistant.php';` khỏi routes/api.php, rồi xóa 5 file PHP trong danh sách installer. Chỉ phục hồi toàn bộ file backup nếu chắc chắn route chưa có chỉnh sửa mới sau lúc cài. Chạy `php artisan optimize:clear`.
