# Hướng dẫn cho AI làm việc trong repo

Đọc docs/TEAM_WORKFLOW.md và docs/ASSISTANT_CONTRACT.md. Chỉ sửa trong phạm vi đầu việc được giao. Frontend và linh vật ở apps/web; backend và AI ở apps/api. Giữ nguyên JavaScript cho ứng dụng này, không thêm framework/build system nếu chưa cần. Các file PHP trong integrations chỉ là bộ cài cho Laravel VisionFit.

Giữ npm run dev chạy được từ gốc. Không thay API hoặc packages/contracts mà không cập nhật tài liệu, consumer và kiểm thử liên quan. Không lấy identity từ dữ liệu client, không dùng admin token chung. Không coi event frontend là bằng chứng hoàn thành tập luyện. Không commit bí mật hoặc dữ liệu hội viên.

Trước bàn giao: npm run check và npm test. Nêu rõ phần còn là mẫu; không nói đã hoàn thiện tiến hóa/widget nếu chỉ mới có cấu trúc. Không force push main hoặc ghi đè thay đổi đồng đội.
