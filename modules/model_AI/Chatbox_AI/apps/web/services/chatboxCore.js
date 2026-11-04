/**
 * VisionFit Chatbox Core (Headless Controller)
 * 
 * Tách biệt hoàn toàn logic trạng thái mascot, dữ liệu hội thoại và API client
 * khỏi giao diện DOM/HTML để thuận tiện tái sử dụng (Web, Widget, Lab, hoặc Native Adapter).
 * 
 * Lưu ý: Module này là Pure JavaScript, không phụ thuộc DOM document/window.
 */

export const MASCOT_STATES = Object.freeze(['idle', 'greeting', 'thinking', 'speaking', 'training', 'celebrating', 'error']);
export const MASCOT_SPECIES = Object.freeze(['bear', 'cat']);
export const EVOLUTION_STAGES = Object.freeze(['starter', 'active', 'strong', 'champion']);
export function isMascotState(value) { return MASCOT_STATES.includes(value); }

// Các câu trả lời kịch bản mẫu có nhãn DEMO rõ ràng
export const DEMO_FIXTURES = {
  greeting: '[DEMO] Xin chào bạn! Mình là trợ lý VisionFit. Hôm nay bạn muốn kiểm tra lịch tập, gói tập hay tìm hiểu động tác nào?',
  workout: '[DEMO] Lịch tập hôm nay của bạn: Buổi Cardio HIIT & Core lúc 18:00 cùng HLV Nam Hùng tại Phòng tập số 2.',
  package: '[DEMO] Gói tập "Hội viên Kim Cương 6 tháng" của bạn còn 18/24 buổi, hạn sử dụng đến ngày 15/12/2026.',
  progress: '[DEMO] Tuần này bạn đã hoàn thành 3/4 buổi tập mục tiêu, tiêu hao khoảng 1.250 kcal. Rất xuất sắc!',
  fallback: '[DEMO] Mình đã ghi nhận câu hỏi của bạn. Ở chế độ DEMO, mình có thể gợi ý thông tin về lịch tập, gói tập và hướng dẫn kỹ thuật cơ bản.'
};

export class ChatboxCore {
  /**
   * @param {Object} [config={}]
   * @param {string} [config.species='bear']
   * @param {string} [config.stage='starter']
   * @param {boolean} [config.forceDemo=false] - Buộc dùng fixture DEMO thay vì gọi API thật
   * @param {Function} [config.apiFetch] - Custom fetch implementation (cho native hoặc test)
   */
  constructor(config = {}) {
    this.species = MASCOT_SPECIES.includes(config.species) ? config.species : 'bear';
    this.stage = EVOLUTION_STAGES.includes(config.stage) ? config.stage : 'starter';
    this.state = 'idle';
    this.baselineState = 'idle';
    this.isWorkoutActive = false;

    this.forceDemo = Boolean(config.forceDemo);
    this.apiFetch = config.apiFetch || (typeof fetch !== 'undefined' ? fetch.bind(globalThis) : null);

    this.user = null;
    this.messages = [];
    this.isBusy = false;
    this.lastError = null;
    this.pendingInput = '';

    this._subscribers = new Set();
    this._transientTimer = null;
  }

  // ==========================================
  // Quản lý trạng thái linh vật (Headless)
  // ==========================================

  setSpecies(species) {
    if (!MASCOT_SPECIES.includes(species)) return;
    this.species = species;
    this._notify();
  }

  setStage(stage) {
    if (!EVOLUTION_STAGES.includes(stage)) return;
    this.stage = stage;
    this._notify();
  }

  setState(state, durationMs = 0) {
    if (!isMascotState(state)) return;
    this._clearTransientTimer();
    this.state = state;
    this._notify();

    if (durationMs > 0 || state === 'greeting' || state === 'celebrating' || state === 'speaking') {
      const wait = durationMs > 0 ? durationMs : state === 'greeting' ? 2400 : state === 'celebrating' ? 3200 : 2000;
      this._transientTimer = setTimeout(() => {
        this.state = this.baselineState;
        this._notify();
        this._transientTimer = null;
      }, wait);
    }
  }

  setWorkoutActive(active) {
    this.isWorkoutActive = Boolean(active);
    this.baselineState = this.isWorkoutActive ? 'training' : 'idle';
    if (this.state === 'idle' || this.state === 'training') {
      this.setState(this.baselineState);
    }
  }

  _clearTransientTimer() {
    if (this._transientTimer) {
      clearTimeout(this._transientTimer);
      this._transientTimer = null;
    }
  }

  // ==========================================
  // Quản lý dữ liệu người dùng & phiên
  // ==========================================

  setUser(user) {
    this.user = user;
    if (user?.mascot_species && MASCOT_SPECIES.includes(user.mascot_species)) {
      this.species = user.mascot_species;
    }
    if (user?.mascot_stage && EVOLUTION_STAGES.includes(user.mascot_stage)) {
      this.stage = user.mascot_stage;
    }
    this._notify();
  }

  clearSession() {
    this._clearTransientTimer();
    this.user = null;
    this.messages = [];
    this.isBusy = false;
    this.lastError = null;
    this.pendingInput = '';
    this.state = 'idle';
    this.baselineState = 'idle';
    this.isWorkoutActive = false;
    this._notify();
  }

  // ==========================================
  // Xử lý gửi nhận tin nhắn
  // ==========================================

  /**
   * Gửi tin nhắn đến Trợ lý
   * @param {string} text
   * @returns {Promise<{ content: string, role: string, isDemo: boolean }>}
   */
  async sendMessage(text) {
    const query = typeof text === 'string' ? text.trim() : '';
    if (!query || this.isBusy) return null;

    this.isBusy = true;
    this.lastError = null;
    this.pendingInput = '';

    // Thêm tin nhắn của User
    const userMsg = {
      id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      role: 'user',
      content: query,
      timestamp: Date.now()
    };
    this.messages.push(userMsg);

    // Kích hoạt ngay trạng thái suy nghĩ
    this.setState('thinking');
    this._notify();

    try {
      let replyContent = '';
      let isDemoResponse = false;

      if (this.forceDemo) {
        // Chế độ mô phỏng DEMO có nhãn rõ ràng
        await new Promise(r => setTimeout(r, 650));
        replyContent = this._getDemoReply(query);
        isDemoResponse = true;
      } else {
        // Gọi backend thật
        if (!this.apiFetch) throw new Error('Không tìm thấy HTTP client.');
        const res = await this.apiFetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: query })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Lỗi máy chủ (${res.status}). Vui lòng thử lại.`);
        }

        const data = await res.json();
        replyContent = data.content || (data.messages && data.messages[data.messages.length - 1]?.content) || 'Đã nhận được thông tin.';
        isDemoResponse = Boolean(data.dataMode === 'demo');
      }

      // Thêm phản hồi của Assistant
      const assistantMsg = {
        id: `ast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        role: 'assistant',
        content: replyContent,
        timestamp: Date.now(),
        isDemo: isDemoResponse
      };
      this.messages.push(assistantMsg);

      // Chuyển sang phản hồi cử động speaking hoặc celebrating
      if (replyContent.includes('xuất sắc') || replyContent.includes('hoàn thành') || replyContent.includes('Chúc mừng')) {
        this.setState('celebrating', 3200);
      } else {
        this.setState('speaking', 2200);
      }

      return assistantMsg;
    } catch (err) {
      // Giữ lại nội dung câu hỏi để người dùng không mất công gõ lại
      this.pendingInput = query;
      this.lastError = err.message || 'Lỗi gửi tin nhắn.';
      this.setState('error', 3000);
      throw err;
    } finally {
      this.isBusy = false;
      this._notify();
    }
  }

  _getDemoReply(query) {
    const lower = query.toLowerCase();
    if (lower.includes('lịch') || lower.includes('hôm nay') || lower.includes('giờ')) return DEMO_FIXTURES.workout;
    if (lower.includes('gói') || lower.includes('buổi') || lower.includes('hạn')) return DEMO_FIXTURES.package;
    if (lower.includes('tiến độ') || lower.includes('calo') || lower.includes('tuần')) return DEMO_FIXTURES.progress;
    if (lower.includes('chào') || lower.includes('hi') || lower.includes('hello')) return DEMO_FIXTURES.greeting;
    return DEMO_FIXTURES.fallback;
  }

  // ==========================================
  // Observer Subscriptions
  // ==========================================

  subscribe(listener) {
    if (typeof listener !== 'function') return () => {};
    this._subscribers.add(listener);
    // Bắn trạng thái khởi tạo
    listener(this.getSnapshot());
    return () => {
      this._subscribers.delete(listener);
    };
  }

  _notify() {
    const snapshot = this.getSnapshot();
    for (const listener of this._subscribers) {
      try {
        listener(snapshot);
      } catch (e) {
        console.error('[ChatboxCore] Listener error:', e);
      }
    }
  }

  getSnapshot() {
    return {
      species: this.species,
      stage: this.stage,
      state: this.state,
      baselineState: this.baselineState,
      isWorkoutActive: this.isWorkoutActive,
      isBusy: this.isBusy,
      user: this.user,
      messages: [...this.messages],
      lastError: this.lastError,
      pendingInput: this.pendingInput,
      forceDemo: this.forceDemo
    };
  }

  destroy() {
    this._clearTransientTimer();
    this._subscribers.clear();
  }
}
