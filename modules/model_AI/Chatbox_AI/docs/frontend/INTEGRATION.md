# Hướng Dẫn Tích Hợp Linh Vật & Widget Vào VisionFit Host

Tài liệu này hướng dẫn cách nhúng Widget Linh vật đồng hành của VisionFit Assistant vào các ứng dụng chủ (Host Application), bao gồm Web Admin (Vue 3) và App Mobile (React Native).

---

## 1. Kiến Trúc Widget & Host Adapter

Widget được thiết kế độc lập, không xâm lấn kiến trúc của ứng dụng chủ:
- **Renderer (`MascotRenderer`):** Điều khiển chuyển động và trạng thái hiển thị của linh vật.
- **Widget (`MascotWidget`):** Cung cấp nút nổi thu gọn (Launcher) và khung chat mở rộng (Panel).
- **Host Adapter (`HostAdapter`):** Cầu nối giao tiếp hai chiều giữa Widget và Host Application.

---

## 2. Các Sự Kiện Đồng Bộ Buổi Tập (Workout Events)

Để linh vật có thể tập cùng người dùng và chúc mừng khi hoàn thành, Host chỉ cần phát các sự kiện CustomEvent chuẩn từ window (hoặc gọi qua HostAdapter):

| Sự kiện | Chi tiết | Phản ứng của linh vật |
|---|---|---|
| `vif:workout-start` | Bắt đầu buổi tập | Linh vật chuyển sang động tác nâng tạ / squat nhịp nhàng (`training`) |
| `vif:workout-pause` | Tạm dừng buổi tập | Linh vật chuyển sang tư thế nghỉ ngơi (`idle`) |
| `vif:workout-complete` | Hoàn thành buổi tập | Linh vật giơ tay ăn mừng chiến thắng (`celebrating`) trong 4 giây rồi về trạng thái nền |

### Ví dụ phát sự kiện từ Vue 3 hoặc Vanilla JS:
```javascript
// Bắt đầu buổi tập
window.dispatchEvent(new CustomEvent('vif:workout-start', {
  detail: { planId: 'cardio-hiit-1' }
}));

// Hoàn thành buổi tập
window.dispatchEvent(new CustomEvent('vif:workout-complete', {
  detail: { planId: 'cardio-hiit-1', calories: 250 }
}));
```

> **Lưu ý quan trọng:** Sự kiện frontend chỉ điều khiển hiệu ứng thị giác cho linh vật; tuyệt đối không dùng sự kiện frontend làm bằng chứng xác thực hoàn thành hoặc tự tăng cấp độ trên server.

---

## 3. Điều Hướng An Toàn (Navigation Allowlist)

Khi trợ lý AI đưa ra gợi ý hành động, HostAdapter chỉ tiếp nhận các target nằm trong danh sách trắng (`ALLOWED_NAVIGATION_TARGETS`):

- `workout`: Điều hướng đến màn hình bài tập (`WorkoutPlanScreen` / `/admin/lich-lop`).
- `schedule`: Điều hướng đến lịch tập (`Schedule` / `/admin/lich-lop`).
- `packages`: Điều hướng đến gói tập (`MyPackagesScreen` / `/admin/goi-tap`).
- `profile`: Điều hướng đến hồ sơ cá nhân (`MemberProfile` / `/admin/trainer`).
- `dashboard`: Điều hướng đến bảng tin tổng quan (`DashboardScreen` / `/admin/dashboard`).

Mọi URL lạ hoặc target không thuộc danh sách trên sẽ bị bỏ qua để bảo vệ an toàn cho ứng dụng chủ.

---

## 4. Cách Nhúng Vào Web Admin VisionFit (Vue 3)

Trong `modules/web-app/web-visionfit/`:

```javascript
import { MascotWidget } from './path-to-assistant/widget/widget.js';

let widgetInstance = null;

export function mountAssistant(user) {
  if (widgetInstance) return widgetInstance;

  widgetInstance = new MascotWidget({
    species: user.mascot_species || 'bear',
    stage: user.mascot_stage || 'starter',
    userName: user.name,
    userRole: user.role,
    userId: user.id,
    onNavigate: (target, params) => {
      // Ánh xạ sang Vue Router của Host
      const routeMap = {
        workout: '/admin/lich-lop',
        schedule: '/admin/lich-lop',
        packages: '/admin/goi-tap',
        dashboard: '/admin/dashboard'
      };
      if (routeMap[target]) {
        router.push(routeMap[target]);
      }
    }
  });

  return widgetInstance;
}

export function unmountAssistant() {
  if (widgetInstance) {
    widgetInstance.destroy();
    widgetInstance = null;
  }
}
```
