# Hợp đồng tích hợp VisionFit

## Những gì đã kiểm tra

Nguồn: `xuantruong5/VisionFit`, nhánh `develop`, `modules/backend/visionfit/routes/api.php`, `MembersController.php`, `ClientMiddleware.php`.

- Login hội viên: `POST /api/client/login`, input `{email,password}`, output `{status:true,token,client}`.
- Có đường dẫn login PT và admin. Cần xác nhận response tương ứng tuân thủ `{status:true,token}` khi tích hợp; nếu khác, sửa duy nhất `createVisionFit().login()`.
- `/api/ho-so` chưa đủ làm nguồn danh tính: controller nhận `id_nguoi_dung`, mặc định 1 và fallback user đầu tiên; một số giá trị gói tập đang cố định.
- `ClientMiddleware` có cơ chế lấy client đầu tiên trong local nếu không xác thực được.

Vì vậy **không dùng `/ho-so` hoặc fallback local để xác định user**. Bản trợ lý dùng endpoint chuyên biệt trong `integrations/visionfit/`. Cài theo README của thư mục đó; hợp đồng dưới đây mô tả response và từ chối nếu sai danh tính.

## 1. Danh tính: GET /api/assistant/me

Header: `Authorization: Bearer <token của chính user>`. Middleware phải xác thực token thật, không chọn user mặc định và không nhận ID từ client.

```json
{
  "data": {
    "id": "101",
    "gym_id": "10",
    "role": "member",
    "name": "Tên hiển thị"
  }
}
```

`role`: `member`, `trainer`, hoặc `admin`. `gym_id` là phạm vi phòng đang hoạt động, được backend xác minh. Nếu quản lý nhiều phòng, backend cần cơ chế chọn/phê duyệt phạm vi; không mặc định truy cập mọi phòng. Một tài khoản chưa gắn phòng cần được gán workspace hợp lệ rõ ràng, không dùng chuỗi mặc định chung cho toàn bộ khách hàng.

Danh tính được kiểm tra sau login và trước mọi request dữ liệu/lịch sử/chat. Thay role, user hoặc gym trong phiên sẽ yêu cầu đăng nhập lại. Token và các trường hồ sơ đầy đủ không bao giờ trả xuống giao diện chatbot.

## 2. Ngữ cảnh: GET /api/assistant/context

Cùng token, không có query ID. Backend suy ra chủ thể từ token, kiểm tra vai trò, phạm vi phòng và quan hệ PT/học viên **trước khi truy vấn**.

```json
{
  "data": {
    "subject": { "id": "101", "gym_id": "10", "role": "member" },
    "profile": { "goal": "Duy trì tập luyện", "level": "Cơ bản" },
    "packages": [
      { "name": "Gói 24 buổi", "expires_at": "2026-12-31", "remaining_sessions": 12 }
    ],
    "schedule": [
      { "name": "Toàn thân", "starts_at": "2026-11-02T18:00:00+07:00", "trainer": "HLV Nam" }
    ],
    "progress": { "sessions_this_week": 2, "completion_percent": 65 },
    "summary": null
  }
}
```

- Danh tính `subject` phải khớp hoàn toàn `/assistant/me`.
- `schedule`: backend chỉ trả lịch liên quan và sắp xếp tăng dần thời gian. Cần trả timezone ISO 8601 rõ ràng.
- Dữ liệu thiếu: `null` hoặc `[]`. Không điền dữ liệu minh họa hoặc số giả.
- PT: `summary.assigned_members` là số hội viên được phân công, trong phòng đã xác minh.
- Admin: có thể thêm `summary.expiring_members` trong phòng. Đơn vị vận hành cần thống nhất ngưỡng “sắp hết hạn” ở backend.
- Bản đầu không hỗ trợ tra cứu cá nhân khác hoặc danh sách hội viên chi tiết; không trả danh sách này trong ngữ cảnh.
- Không trả mật khẩu, hash, token, email, số điện thoại, thanh toán, dữ liệu y tế hoặc toàn bộ model ORM.
- Server trợ lý chỉ nhận tối đa 20 gói/lịch để giới hạn ngữ cảnh; cần API tổng hợp nếu sau này có dữ liệu lớn.

## 3. Mã lỗi

| HTTP | Ý nghĩa |
|---|---|
| 401 | Token thiếu/hết hạn/đã thu hồi |
| 403 | Không có quyền hoặc không thuộc phạm vi |
| 422 | Input không hợp lệ |
| 5xx | Lỗi dịch vụ |

Endpoint cần trả JSON. Không redirect sang trang login. Logout chatbot hiện xóa phiên và token khỏi RAM trợ lý; chưa gọi revoke token trên VisionFit. Nếu cần revoke, bổ sung adapter logout đúng từng vai trò.

## Kiểm tra bắt buộc trước khi bật dữ liệu thật

1. Token thiếu hoặc token rác không được trả user mặc định, kể cả môi trường local.
2. Hội viên A chỉ nhận dữ liệu A; yêu cầu gắn ID B không mở rộng phạm vi.
3. PT chỉ nhận tổng hợp thuộc danh sách được phân công.
4. Chủ phòng A không xem phòng B.
5. Revoke token khiến lần gọi tiếp theo trả 401.
6. Không có secret/PII ngoài hợp đồng trong response hoặc log.
7. Kiểm thử bằng tối thiểu hai hội viên khác nhau và hai phòng; test giả lập trong repo không thay thế kiểm thử backend thật.

## Bộ triển khai đi kèm

`npm run setup:visionfit -- "DUONG_DAN_BACKEND"` cài implementation theo schema thật. `packages` bổ sung `total_sessions` là số buổi mua, luôn tách với `remaining_sessions` chưa có ledger xác thực (null). `schedule` bổ sung `scheduled_date` để không bịa giờ khi `starts_at` thiếu. `progress.completion_percent` là trung bình các buổi trạng thái 2/3 từ đầu tuần đến hiện tại. `summary.expiring_members` đếm hội viên duy nhất có gói hết hạn trong 7 ngày. Admin cần map ID/phòng trong config vì schema hiện chưa có liên kết phòng cho admins.
