# Hướng dẫn đóng góp

Đọc [quy trình hai người](docs/TEAM_WORKFLOW.md) và [giao ước tích hợp](docs/ASSISTANT_CONTRACT.md) trước khi sửa.

- Frontend/linh vật: `apps/web/`.
- Backend/AI: `apps/api/`, `integrations/`.
- File dùng chung: thống nhất trước, PR nhỏ, không tự đổi dữ liệu API làm hỏng giao diện.
- Nhánh riêng cho từng việc, PR vào main, người còn lại review.
- Chạy `npm run check` và `npm test`.
- Không commit `.env`, database, token, node_modules hoặc file nguồn thiết kế quá lớn.
- Không đổi lockfile nếu không thay dependency; thêm thư viện cần thống nhất trước.
