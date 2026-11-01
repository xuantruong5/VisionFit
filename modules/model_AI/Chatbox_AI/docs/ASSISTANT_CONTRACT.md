# Giao ước frontend ↔ backend

## API đang chạy

Giữ nguyên các endpoint hiện tại: GET /api/config; POST /api/auth/login; GET /api/auth/me; POST /api/auth/logout; GET /api/context; GET/DELETE /api/messages; POST /api/chat. Chi tiết dữ liệu VisionFit: VISIONFIT_API.md.

POST /api/chat chỉ nhận `{ "message": "..." }`. Giao diện đọc `messages` của phản hồi để vẽ hội thoại. Phiên đăng nhập dùng cookie HttpOnly; không cho frontend giữ token AI hoặc chọn user ID. HTTP client được tách tại apps/web/services/api.js; sự kiện vif:session-expired yêu cầu UI quay về đăng nhập.

## Linh vật — nền tảng, chưa có API lưu tiến độ

packages/contracts/assistant.js là nguồn duy nhất cho tên trạng thái, loài mẫu và cấp ngoại hình. Lab dùng cùng module thông qua URL /contracts/assistant.js. Backend có thể import module này bằng đường dẫn tương đối.

Trạng thái suy nghĩ do frontend bật khi gửi yêu cầu, không cần chờ AI trả về. Lỗi/hoàn tất yêu cầu phải kết thúc trạng thái chờ. Cấp ngoại hình do backend quyết định từ buổi tập đã xác minh; AI không được tự cấp thưởng. Tên loài/cấp hiện là gợi ý để triển khai và phải thống nhất trước khi lưu DB thật.

Các sự kiện host vif:workout-start/pause/complete được khai báo để chuẩn bị tích hợp; chưa nối với VisionFit. Giao diện không được tự phát event complete rồi tăng cấp. Cần backend xác minh phiên tập.

## Thay đổi tương lai

Trước khi thêm API chọn thú, tiến hóa hoặc action navigate: thống nhất ví dụ JSON, lỗi, quyền truy cập và fixture với đồng đội. Bổ sung trường mới nên là tùy chọn để consumer cũ vẫn chạy; thay đổi phá vỡ tương thích phải cập nhật cả hai bên trong cùng PR. Chưa tự động điều hướng hoặc tải URL do AI cung cấp.
