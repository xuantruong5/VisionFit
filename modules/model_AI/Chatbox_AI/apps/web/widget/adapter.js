/**
 * VisionFit Host Adapter
 * Cung cấp giao diện chuẩn để tích hợp Widget vào Host Application (Web Vue / Mobile React Native WebView)
 * Lắng nghe các sự kiện host: vif:workout-start, vif:workout-pause, vif:workout-complete.
 * Quản lý điều hướng an toàn theo danh sách allowlist đã thống nhất.
 */

// Host events contract
export const HOST_EVENTS = Object.freeze({
  start: 'vif:workout-start',
  pause: 'vif:workout-pause',
  complete: 'vif:workout-complete'
});

// Danh sách các mục tiêu điều hướng được phép (Allowlist)
export const ALLOWED_NAVIGATION_TARGETS = Object.freeze([
  'workout',    // Màn hình tập luyện
  'schedule',   // Lịch tập
  'packages',   // Gói tập
  'profile',    // Trang cá nhân
  'dashboard',  // Tổng quan tiến độ
  'chat'        // Cuộc trò chuyện
]);

export class HostAdapter {
  /**
   * @param {Object} options
   * @param {Function} [options.onNavigate] - Callback điều hướng an toàn cho Host
   * @param {Function} [options.onWorkoutStateChange] - Callback khi trạng thái tập thay đổi
   */
  constructor(options = {}) {
    this.onNavigate = options.onNavigate || null;
    this.onWorkoutStateChange = options.onWorkoutStateChange || null;
    this.currentWorkoutState = 'idle'; // 'idle' | 'training' | 'paused' | 'completed'

    this._boundStart = this._handleWorkoutStart.bind(this);
    this._boundPause = this._handleWorkoutPause.bind(this);
    this._boundComplete = this._handleWorkoutComplete.bind(this);

    this._bindHostEvents();
  }

  _bindHostEvents() {
    window.addEventListener(HOST_EVENTS.start, this._boundStart);
    window.addEventListener(HOST_EVENTS.pause, this._boundPause);
    window.addEventListener(HOST_EVENTS.complete, this._boundComplete);
  }

  _unbindHostEvents() {
    window.removeEventListener(HOST_EVENTS.start, this._boundStart);
    window.removeEventListener(HOST_EVENTS.pause, this._boundPause);
    window.removeEventListener(HOST_EVENTS.complete, this._boundComplete);
  }

  _handleWorkoutStart(e) {
    this.currentWorkoutState = 'training';
    if (this.onWorkoutStateChange) {
      this.onWorkoutStateChange('training', e?.detail || {});
    }
  }

  _handleWorkoutPause(e) {
    this.currentWorkoutState = 'paused';
    if (this.onWorkoutStateChange) {
      this.onWorkoutStateChange('paused', e?.detail || {});
    }
  }

  _handleWorkoutComplete(e) {
    this.currentWorkoutState = 'completed';
    if (this.onWorkoutStateChange) {
      this.onWorkoutStateChange('completed', e?.detail || {});
    }
  }

  /**
   * Kích hoạt điều hướng an toàn theo target
   * @param {string} target - Phải thuộc ALLOWED_NAVIGATION_TARGETS
   * @param {Object} [params={}] - Tham số bổ sung
   * @returns {boolean} - true nếu target hợp lệ và đã gọi host
   */
  navigate(target, params = {}) {
    if (!ALLOWED_NAVIGATION_TARGETS.includes(target)) {
      console.warn(`[HostAdapter] Bỏ qua yêu cầu điều hướng không an toàn tới target: "${target}"`);
      return false;
    }
    if (this.onNavigate) {
      this.onNavigate(target, params);
      return true;
    }
    return false;
  }

  /**
   * Thiết lập thủ công trạng thái tập luyện từ host
   * @param {'idle' | 'training' | 'paused' | 'completed'} state
   */
  setWorkoutState(state) {
    if (!['idle', 'training', 'paused', 'completed'].includes(state)) return;
    this.currentWorkoutState = state;
    if (this.onWorkoutStateChange) {
      this.onWorkoutStateChange(state, { manual: true });
    }
  }

  destroy() {
    this._unbindHostEvents();
  }
}
