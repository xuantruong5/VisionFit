# Hai người phát triển VisionFit Assistant

## Phân chia thư mục

| Người | Sở hữu chính | Công việc |
|---|---|---|
| Anh — giao diện & linh vật | `apps/web/`, `tests/web/`, `docs/frontend/` | Chọn thú, animation, cấp ngoại hình, bong bóng và khung chat, responsive |
| Người còn lại — backend & AI | `apps/api/`, `tests/api/`, `integrations/`, `docs/backend/` | Xác thực, API VisionFit, AI, lưu tiến độ/linh vật theo user, lịch sử, phân quyền |
| Cùng thống nhất trước khi sửa | `packages/contracts/`, `tests/contracts/`, `scripts/`, `.github/`, `package*.json`, cấu hình gốc | Dữ liệu trao đổi, công cụ chạy, phụ thuộc, CI |

`apps/web/services/api.js` là ranh giới gọi API phía trình duyệt; frontend sở hữu file này, backend đề xuất thay đổi qua PR. `packages/contracts/assistant.js` quy định các trạng thái linh vật. Không nhập code backend vào frontend, không đặt secret ở web hoặc contract.

## Bắt đầu sau lần tổ chức lại này

Nếu có thay đổi chưa commit: commit vào nhánh riêng trước. Không dùng reset --hard để cập nhật.

```bash
git switch main
git pull --ff-only origin main
npm ci
npm run dev
```

Mở http://localhost:3000 để thử luồng chat. Mở http://localhost:3000/mascot-lab để phát triển nhân vật mà không cần đăng nhập hoặc API VisionFit thật. API demo chạy cùng một lệnh, không cần tải VisionFit. Chế độ demo dùng cấu hình mặc định; không thay `.env` đang dùng live của đồng đội.

Hai người tạo nhánh riêng từ main mới nhất:

```bash
# Người làm giao diện
git switch -c feature/mascot-widget
```

```bash
# Người làm backend
git switch -c feature/backend-ai
```

Mỗi đầu việc nên có một nhánh ngắn. Trước khi bắt đầu, báo nhau các file dự định sửa; tránh cùng chỉnh một file, đặc biệt app.js, index.html và styles.css.

## Ghép thay đổi

```bash
git add apps/web
git commit -m "feat(web): add mascot animation"
git fetch origin
git rebase origin/main
npm run check
npm test
git push -u origin feature/mascot-widget
```

Lệnh add/commit/push trên là ví dụ cho frontend; backend chọn đúng các file đã sửa và tên nhánh của mình. Mở Pull Request vào main, người còn lại xem thay đổi trước khi merge. Sau merge, cập nhật main rồi tạo nhánh cho việc tiếp theo.

Nếu rebase báo conflict: mở từng file được liệt kê bởi `git status`, thống nhất phần giữ lại, `git add <file>`, rồi `git rebase --continue`. Có thể dùng `git rebase --abort` để trở về trước rebase. Nếu nhánh đã chia sẻ cho người khác, dùng merge `origin/main` thay cho rebase; không force push nhánh người khác đang dùng.

Cấu trúc thư mục giúp giảm conflict, không bảo đảm loại bỏ hoàn toàn. Tài liệu này là quy ước, chưa bật branch protection hoặc bắt buộc reviewer trên GitHub. Có thể cấu hình sau khi biết tài khoản cả hai người.

## Chia module tiếp khi giao diện lớn hơn

- `apps/web/mascot/`: hình và animation, bộ render nhân vật.
- `apps/web/widget/`: bong bóng, đóng/mở panel; tạo khi bắt đầu triển khai widget.
- `apps/web/services/`: HTTP client.
- `apps/web/app.js`: ghép màn hình hiện tại; hạn chế thêm logic linh vật trực tiếp vào đây.

## Mốc phát triển

1. Frontend: một con vật, trạng thái chờ/chào/suy nghĩ/tập/chúc mừng trong lab.
2. Backend: API chọn linh vật và tiến độ, xác thực theo user/phòng; bổ sung contract và fixture trước khi frontend nối.
3. Frontend: chọn thú, widget nổi, giao tiếp với host VisionFit.
4. Backend: tính cấp bằng buổi tập được server xác minh và thời gian; frontend chỉ hiển thị cấp server trả về.
5. Cả hai: tích hợp, thử mobile, đổi tài khoản, giảm chuyển động, lỗi API.

Hiện lab là bản mẫu UI; chưa có lưu thú, hệ thống tiến hóa, widget nhúng hoặc đồng bộ tập luyện thật. Không dùng sự kiện JavaScript làm bằng chứng tăng cấp. Điều hướng chỉ nhận target định sẵn, host kiểm tra quyền và tự ánh xạ route.
