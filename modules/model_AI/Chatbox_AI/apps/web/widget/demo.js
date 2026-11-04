/**
 * VisionFit Widget Demo Controller
 * Kết nối MascotWidget với màn hình mô phỏng ứng dụng chủ (Host Mockup).
 */

import { MascotWidget } from './widget.js';

let isWorkoutRunning = false;
let forceDemo = false;

// Khởi tạo Widget linh vật đồng hành
const widget = new MascotWidget({
  species: 'bear',
  stage: 'starter',
  userName: 'Hội viên VisionFit',
  userRole: 'member',
  userId: 'demo_user',
  onSendMessage: async (message) => {
    if (forceDemo) {
      await new Promise(r => setTimeout(r, 600));
      const lower = message.toLowerCase();
      if (lower.includes('lịch') || lower.includes('hôm nay')) {
        return '[DEMO] Lịch tập hôm nay: Buổi Cardio & Core HIIT lúc 18:00 cùng HLV Nam Hùng tại Phòng số 2.';
      }
      if (lower.includes('gói') || lower.includes('buổi')) {
        return '[DEMO] Gói Cá Nhân Platinum của bạn còn 18 buổi, hạn dùng đến 15/12/2026.';
      }
      if (lower.includes('khởi động')) {
        return '[DEMO] Gợi ý khởi động: 5 phút xoay khớp cổ tay, cổ chân, vai; 3 phút chạy bước nhỏ tại chỗ; 2 phút kéo giãn động cơ đùi.';
      }
      return `[DEMO] Trợ lý đã nhận câu hỏi: "${message}". Bạn có thể hỏi về bài tập, dinh dưỡng hoặc lịch tập.`;
    }

    // Gọi backend thật
    let res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
    if (res.status === 401) {
      await autoAuth();
      res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message }) });
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Lỗi máy chủ (${res.status}).`);
    }
    const data = await res.json();
    return data.content || (data.messages && data.messages[data.messages.length - 1]?.content) || 'Đã nhận được thông tin.';
  },
  onNavigate: (target) => {
    alert(`[Host Adapter] Nhận yêu cầu điều hướng an toàn tới mục: "${target}" (Nằm trong danh sách Allowlist của ứng dụng chủ).`);
  }
});

async function autoAuth() {
  try {
    const meRes = await fetch('/api/auth/me');
    if (meRes.ok) {
      const data = await meRes.json();
      if (data?.user?.name) {
        widget.updateSession({ name: data.user.name, role: data.user.role, id: data.user.id || data.user.email });
        const nameEl = document.getElementById('mock-username'); const avatarEl = document.getElementById('mock-avatar');
        if (nameEl) nameEl.textContent = data.user.name; if (avatarEl) avatarEl.textContent = data.user.name.slice(0, 1).toUpperCase();
        return data.user;
      }
    }
    const cfgRes = await fetch('/api/config');
    const cfg = cfgRes.ok ? await cfgRes.json() : {};
    const creds = cfg.dataMode === 'demo'
      ? { role: 'member', email: 'member@demo.visionfit.local', password: 'Demo123!' }
      : { role: 'member', email: 'client1@gmail.com', password: '123456' };
    const loginRes = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(creds) });
    if (loginRes.ok) {
      const auth = await loginRes.json();
      if (auth?.user) {
        widget.updateSession({ name: auth.user.name, role: auth.user.role, id: auth.user.id });
        const nameEl = document.getElementById('mock-username'); const avatarEl = document.getElementById('mock-avatar');
        if (nameEl) nameEl.textContent = auth.user.name; if (avatarEl) avatarEl.textContent = auth.user.name.slice(0, 1).toUpperCase();
        return auth.user;
      }
    }
  } catch (_) {}
  return null;
}
autoAuth();


// Bắt sự kiện Toggle Buổi tập
const workoutBtn = document.getElementById('btn-mock-workout-toggle');
if (workoutBtn) {
  workoutBtn.addEventListener('click', () => {
    isWorkoutRunning = !isWorkoutRunning;
    if (isWorkoutRunning) {
      workoutBtn.textContent = '⏸ Tạm dừng buổi tập';
      workoutBtn.style.background = '#e67700';
      workoutBtn.style.color = '#ffffff';
      widget.handleWorkoutState('training');
    } else {
      workoutBtn.textContent = '🎉 Hoàn thành buổi tập';
      workoutBtn.style.background = '#1b8a5a';
      workoutBtn.style.color = '#ffffff';
      widget.handleWorkoutState('completed');
      setTimeout(() => {
        workoutBtn.textContent = '▶ Bắt đầu buổi tập';
        workoutBtn.style.background = '#ffffff';
        workoutBtn.style.color = '#1b8a5a';
      }, 3500);
    }
  });
}

// Bắt sự kiện Toggle DEMO
const chkDemo = document.getElementById('chk-force-demo');
if (chkDemo) {
  chkDemo.addEventListener('change', (e) => {
    forceDemo = e.target.checked;
  });
}
