# Chạy backend VisionFit cho nhiều người dùng

`php artisan serve` **chỉ xử lý 1 request mỗi lúc**. Khi 5 người hỏi chatbot cùng lúc,
người thứ 5 phải chờ 4 người trước (đo thực tế: ~14 giây). Dùng Apache hoặc Nginx + PHP-FPM
để xử lý song song.

| Môi trường | Dùng | Số request song song |
|---|---|---|
| Dev nhanh, 1 người | `php artisan serve` | 1 |
| **Windows / demo / cả nhóm cùng thử** | **XAMPP Apache** (`apache/visionfit-xampp.conf`) | 150 |
| **Server thật (Linux)** | **Nginx + PHP-FPM** (`nginx/`, `php-fpm/`) | tùy `pm.max_children` (mặc định 50) |

---

## 1. Windows — XAMPP Apache (cổng 8000, app mobile không cần đổi gì)

1. Mở `C:\xampp\apache\conf\extra\httpd-vhosts.conf`, thêm vào **cuối file** (đổi đường dẫn theo máy, dùng dấu `/`):
   ```apache
   Define VISIONFIT_BACKEND "D:/NCKH/VisionFit/modules/backend/visionfit"
   Include "${VISIONFIT_BACKEND}/deploy/apache/visionfit-xampp.conf"
   ```
2. Kiểm tra cấu hình: `C:\xampp\apache\bin\httpd.exe -t` → phải ra `Syntax OK`.
3. Bật **Apache** và **MySQL** trong XAMPP Control Panel (không chạy `php artisan serve` nữa).
4. Thử: mở `http://127.0.0.1:8000` → thấy trang Laravel là được.
   Điện thoại thật: đặt `VISIONFIT_API_BASE_URL=http://<IP-LAN-của-máy>:8000` cho app.

Gỡ bỏ: xóa 2 dòng ở bước 1 rồi khởi động lại Apache.

> Lần đầu Windows có thể hỏi quyền tường lửa cho Apache → chọn **Allow** để điện thoại trong cùng mạng truy cập được.

## 2. Linux — Nginx + PHP-FPM

```bash
sudo cp deploy/php-fpm/visionfit-pool.conf /etc/php/8.2/fpm/pool.d/visionfit.conf
sudo cp deploy/nginx/visionfit.conf /etc/nginx/sites-available/visionfit.conf
sudo ln -s /etc/nginx/sites-available/visionfit.conf /etc/nginx/sites-enabled/
# Sửa `root` trong nginx/visionfit.conf cho đúng thư mục dự án, rồi:
sudo nginx -t && sudo systemctl reload php8.2-fpm nginx
sudo chown -R www-data:www-data storage bootstrap/cache
```

Chọn `pm.max_children` theo tải (mỗi câu hỏi chatbot giữ 1 worker ~3 giây, mỗi worker ~40 MB RAM):

| Tải | Câu/giây | `pm.max_children` | RAM |
|---|---|---|---|
| 1.000 người × 10 câu rải trong 1 giờ | ~3 | 10 | ~400 MB |
| Cả lớp hỏi dồn trong 10 phút | ~17 | 50 | ~2 GB |

Trên PHP-FPM, việc **tự cập nhật chỉ mục kho kiến thức** chạy *sau khi* đã gửi câu trả lời,
nên người dùng không phải chờ.

## 3. Giới hạn thật sự: Gemini

Server xử lý song song được, nhưng **Gemini bản miễn phí** chỉ cho vài chục lượt gọi/phút
(mỗi câu hỏi chatbot dùng 2–3 lượt). Khi vượt hạn mức, chatbot trả lời
"đang tạm gián đoạn… thử lại" (không lỗi app). Chạy thật cho nhiều người cần **Gemini trả phí**
và đặt hạn mức chi tiêu trong Google Cloud.

Để giảm số lượt gọi Gemini, chatbot **cache câu trả lời kiến thức chung** (vd: "kỹ thuật squat")
dùng chung giữa nhiều người — tách theo hồ sơ dị ứng, không cache câu hỏi dữ liệu cá nhân,
tự hết hiệu lực khi kho kiến thức thay đổi. Cấu hình: `ASSISTANT_ANSWER_CACHE_TTL` (giây, mặc định 6 giờ, `0` = tắt).
