/**
 * VisionFit Mascot Floating Widget
 * Linh vật đồng hành tập luyện nổi góc dưới màn hình thay thế nút chat tròn.
 * Tích hợp đầy đủ: Launcher nổi, Panel chat chuẩn kích thước, Lời chào đón,
 * Phản xạ cử động linh vật khi chat/tập luyện, Màn hình đổi thú, Phím tắt Escape.
 */

import { MascotRenderer } from '../mascot/renderer.js';
import { MascotSelector } from '../mascot/selector.js';
import { renderSafeMessage } from './sanitizer.js';
import { HostAdapter } from './adapter.js';

export class MascotWidget {
  /**
   * @param {Object} options
   * @param {string} [options.species='bear']
   * @param {string} [options.stage='starter']
   * @param {string} [options.userName='']
   * @param {string} [options.userRole='member']
   * @param {string} [options.userId='']
   * @param {Function} [options.onSendMessage] - Hàm gửi tin nhắn (hoặc gọi API)
   * @param {Function} [options.onNavigate] - Callback điều hướng an toàn
   */
  constructor(options = {}) {
    this.species = options.species || 'bear';
    this.stage = options.stage || 'starter';
    this.userName = options.userName || '';
    this.userRole = options.userRole || 'member';
    this.userId = options.userId || 'guest';
    this.onSendMessage = options.onSendMessage || null;
    this.onNavigate = options.onNavigate || null;

    this.isOpen = false;
    this.isBusy = false;
    this.isWorkoutActive = false;
    this.messages = [];

    this.launcherEl = null;
    this.panelEl = null;
    this.launcherMascot = null;
    this.headerMascot = null;
    this.greetingBubble = null;

    // Khởi tạo host adapter
    this.hostAdapter = new HostAdapter({
      onNavigate: this.onNavigate,
      onWorkoutStateChange: (state) => this.handleWorkoutState(state)
    });

    this._boundKeydown = this._handleKeydown.bind(this);
    this.mount();
  }

  mount() {
    this._createLauncher();
    this._createPanel();
    this._checkGreeting();
    this._applyTheme();
    window.addEventListener('keydown', this._boundKeydown);
  }

  _applyTheme() {
    const species = this.species === 'cat' ? 'cat' : 'bear';
    const currentTheme = `vif-theme-${species}`;
    const otherTheme = species === 'cat' ? 'vif-theme-bear' : 'vif-theme-cat';

    if (this.launcherEl) {
      this.launcherEl.classList.remove(otherTheme);
      this.launcherEl.classList.add(currentTheme);
    }
    if (this.panelEl) {
      this.panelEl.classList.remove(otherTheme);
      this.panelEl.classList.add(currentTheme);
    }
    if (this.greetingBubble) {
      this.greetingBubble.classList.remove(otherTheme);
      this.greetingBubble.classList.add(currentTheme);
    }
  }

  _createLauncher() {
    this.launcherEl = document.createElement('div');
    const themeClass = this.species === 'cat' ? 'vif-theme-cat' : 'vif-theme-bear';
    this.launcherEl.className = `vif-widget-launcher ${themeClass}`;
    this.launcherEl.setAttribute('role', 'button');
    this.launcherEl.setAttribute('tabindex', '0');
    this.launcherEl.setAttribute('aria-label', `Trợ lý VIF (${this.species === 'bear' ? 'Gấu' : 'Mèo'}). Bấm để mở trò chuyện`);

    const mascotBox = document.createElement('div');
    mascotBox.className = 'vif-launcher-mascot';
    this.launcherEl.appendChild(mascotBox);

    document.body.appendChild(this.launcherEl);

    this.launcherMascot = new MascotRenderer(mascotBox, {
      species: this.species,
      stage: this.stage,
      state: 'idle',
      workoutActive: this.isWorkoutActive
    });

    this.launcherEl.addEventListener('click', () => this.toggle());
    this.launcherEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.toggle();
      }
    });
  }

  _createPanel() {
    this.panelEl = document.createElement('div');
    const themeClass = this.species === 'cat' ? 'vif-theme-cat' : 'vif-theme-bear';
    this.panelEl.className = `vif-widget-panel ${themeClass}`;
    this.panelEl.setAttribute('role', 'dialog');
    this.panelEl.setAttribute('aria-label', 'Khung trò chuyện trợ lý VisionFit');
    this.panelEl.hidden = true;

    this.panelEl.innerHTML = `
      <header class="vif-panel-header">
        <div class="vif-header-left">
          <div class="vif-header-mascot-box" id="widget-header-mascot" title="Xem linh vật"></div>
          <div class="vif-header-info">
            <h3>VIF Assistant <span class="vif-status-badge"></span></h3>
            <p id="widget-mascot-status">${this.species === 'bear' ? 'Gấu VIF' : 'Mèo VIF'} · Cấp: ${this.stage}</p>
          </div>
        </div>
        <div class="vif-header-actions">
          <button type="button" class="vif-header-btn" id="widget-change-mascot" title="Đổi linh vật">🐾 Đổi thú</button>
          <button type="button" class="vif-header-btn" id="widget-close" aria-label="Thu gọn trợ lý">✕</button>
        </div>
      </header>

      <div class="vif-panel-messages" id="widget-messages" role="log" aria-live="polite">
        <!-- Tin nhắn ban đầu -->
        <div class="vif-msg-bubble vif-msg-assistant">
          <p>Xin chào ${this.userName ? `<strong>${this.userName}</strong>` : 'bạn'}! Tôi là người bạn đồng hành của bạn tại VisionFit. Hôm nay bạn muốn tìm hiểu về lịch tập, gói tập hay bắt đầu rèn luyện?</p>
        </div>
      </div>

      <div class="vif-typing-indicator" id="widget-typing" hidden style="display: none;">
        <span>VIF đang suy nghĩ</span>
        <div class="vif-typing-dots"><span></span><span></span><span></span></div>
      </div>

      <div class="vif-suggestions">
        <button class="vif-suggest-btn" data-query="Lịch tập hôm nay của tôi">📅 Lịch tập</button>
        <button class="vif-suggest-btn" data-query="Gói tập của tôi còn bao nhiêu buổi?">🎟 Gói tập</button>
        <button class="vif-suggest-btn" data-query="Gợi ý bài tập khởi động">💪 Khởi động</button>
      </div>

      <div class="vif-composer">
        <textarea class="vif-composer-input" id="widget-input" rows="1" maxlength="2000" placeholder="Hỏi VIF điều bạn đang quan tâm…" aria-label="Nội dung câu hỏi"></textarea>
        <button type="button" class="vif-send-btn" id="widget-send" aria-label="Gửi tin nhắn">↑</button>
      </div>
    `;

    document.body.appendChild(this.panelEl);

    // Render linh vật thu nhỏ trên Header
    const headerMascotBox = this.panelEl.querySelector('#widget-header-mascot');
    this.headerMascot = new MascotRenderer(headerMascotBox, {
      species: this.species,
      stage: this.stage,
      state: 'idle'
    });

    // Sự kiện nút đóng & đổi thú
    this.panelEl.querySelector('#widget-close').addEventListener('click', () => this.close());
    this.panelEl.querySelector('#widget-change-mascot').addEventListener('click', () => this.openSelector());

    // Sự kiện gửi tin nhắn
    const inputEl = this.panelEl.querySelector('#widget-input');
    const sendBtn = this.panelEl.querySelector('#widget-send');

    const handleSend = () => {
      const text = inputEl.value.trim();
      if (text) this.sendMessage(text);
    };

    sendBtn.addEventListener('click', handleSend);
    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });

    // Câu hỏi gợi ý nhanh
    this.panelEl.querySelectorAll('.vif-suggest-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.sendMessage(btn.dataset.query);
      });
    });
  }

  _checkGreeting() {
    // Chào tối đa một lần mỗi phiên đăng nhập
    const sessionKey = `vif_greeted_${this.userId || 'guest'}`;
    let alreadyGreeted = false;
    try {
      alreadyGreeted = sessionStorage.getItem(sessionKey) === 'true';
    } catch (_) {}

    if (!alreadyGreeted && !this.isOpen) {
      this.greetingBubble = document.createElement('div');
      const themeClass = this.species === 'cat' ? 'vif-theme-cat' : 'vif-theme-bear';
      this.greetingBubble.className = `vif-greeting-bubble ${themeClass}`;
      const greetingName = this.userName ? `, ${this.userName}` : '';
      this.greetingBubble.innerHTML = `
        <button type="button" class="vif-bubble-close" aria-label="Đóng lời chào">✕</button>
        <div>Chào bạn${greetingName}! 👋<br>Hôm nay mình cùng tập luyện thật sung nhé!</div>
      `;

      this.launcherEl.appendChild(this.greetingBubble);

      // Chạy animation chào mừng 2.4 giây
      this.launcherMascot.setState('greeting', 2400);

      this.greetingBubble.querySelector('.vif-bubble-close').addEventListener('click', (e) => {
        e.stopPropagation();
        this._dismissGreeting();
      });

      try {
        sessionStorage.setItem(sessionKey, 'true');
      } catch (_) {}

      // Tự động ẩn lời chào sau 7 giây
      setTimeout(() => this._dismissGreeting(), 7000);
    }
  }

  _dismissGreeting() {
    if (this.greetingBubble && this.greetingBubble.parentNode) {
      this.greetingBubble.parentNode.removeChild(this.greetingBubble);
      this.greetingBubble = null;
    }
  }

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }

  open() {
    this.isOpen = true;
    this.panelEl.hidden = false;
    this.launcherEl.classList.add('vif-launcher-open');
    this._dismissGreeting();

    // Focus vào ô nhập liệu
    setTimeout(() => {
      const input = this.panelEl.querySelector('#widget-input');
      if (input) input.focus();
    }, 50);

    // Kích hoạt nhẹ linh vật
    if (this.launcherMascot) this.launcherMascot.setState('speaking', 1200);
    if (this.headerMascot) this.headerMascot.setState('speaking', 1200);
  }

  close() {
    this.isOpen = false;
    this.panelEl.hidden = true;
    this.launcherEl.classList.remove('vif-launcher-open');
    // Trả lại focus cho launcher
    this.launcherEl.focus();
  }

  _handleKeydown(e) {
    if (e.key === 'Escape' && this.isOpen) {
      this.close();
    }
  }

  openSelector() {
    new MascotSelector({
      currentSpecies: this.species,
      currentStage: this.stage,
      userKey: this.userId,
      onSelect: (newSpecies) => {
        this.species = newSpecies;
        this.launcherMascot.setSpecies(newSpecies);
        this.headerMascot.setSpecies(newSpecies);
        this._applyTheme();
        const statusEl = this.panelEl.querySelector('#widget-mascot-status');
        if (statusEl) {
          statusEl.textContent = `${newSpecies === 'bear' ? 'Gấu VIF' : 'Mèo VIF'} · Cấp: ${this.stage}`;
        }
      }
    }).show();
  }

  /**
   * Cập nhật thông tin phiên người dùng khi đăng nhập / đổi user
   */
  updateSession(sessionData = {}) {
    this.userName = sessionData.name || '';
    this.userRole = sessionData.role || 'member';
    this.userId = sessionData.id || 'guest';
    if (sessionData.species) {
      this.species = sessionData.species;
      this.launcherMascot.setSpecies(this.species);
      this.headerMascot.setSpecies(this.species);
      this._applyTheme();
    }
    // Đặt cấp độ từ backend xác thực
    if (sessionData.stage) {
      this.stage = sessionData.stage;
      this.launcherMascot.setStage(this.stage);
      this.headerMascot.setStage(this.stage);
    }
    const statusEl = this.panelEl.querySelector('#widget-mascot-status');
    if (statusEl) {
      statusEl.textContent = `${this.species === 'bear' ? 'Gấu VIF' : 'Mèo VIF'} · Cấp: ${this.stage}`;
    }
  }

  /**
   * Điều khiển phản xạ tập luyện
   */
  handleWorkoutState(workoutState) {
    if (workoutState === 'training') {
      this.isWorkoutActive = true;
      this.launcherMascot.setWorkoutActive(true);
      this.headerMascot.setWorkoutActive(true);
    } else if (workoutState === 'paused') {
      this.isWorkoutActive = false;
      this.launcherMascot.setWorkoutActive(false);
      this.headerMascot.setWorkoutActive(false);
      this.launcherMascot.setState('idle');
    } else if (workoutState === 'completed') {
      this.isWorkoutActive = false;
      this.launcherMascot.setWorkoutActive(false);
      this.headerMascot.setWorkoutActive(false);
      // Chúc mừng chiến thắng
      this.launcherMascot.setState('celebrating', 4000);
      this.headerMascot.setState('celebrating', 4000);
    }
  }

  /**
   * Gửi tin nhắn và cập nhật trạng thái linh vật
   */
  async sendMessage(text) {
    if (this.isBusy || !text || !text.trim()) return;
    const query = text.trim();
    this.isBusy = true;

    const input = this.panelEl.querySelector('#widget-input');
    const sendBtn = this.panelEl.querySelector('#widget-send');
    const typing = this.panelEl.querySelector('#widget-typing');
    const msgContainer = this.panelEl.querySelector('#widget-messages');

    input.value = '';
    sendBtn.disabled = true;
    typing.hidden = false;
    typing.style.display = 'flex';

    // 1. Bật thinking state ngay lập tức!
    this.headerMascot.setState('thinking');
    this.launcherMascot.setState('thinking');

    // Thêm tin nhắn của User vào giao diện
    const userMsg = document.createElement('div');
    userMsg.className = 'vif-msg-bubble vif-msg-user';
    userMsg.appendChild(renderSafeMessage(query));
    msgContainer.appendChild(userMsg);
    msgContainer.scrollTop = msgContainer.scrollHeight;

    try {
      let replyText = '';
      if (this.onSendMessage) {
        replyText = await this.onSendMessage(query);
      } else {
        // Fallback gọi trực tiếp backend nếu không truyền onSendMessage
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: query })
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Lỗi gửi tin nhắn.');
        }
        const data = await res.json();
        replyText = data.content || (data.messages && data.messages[data.messages.length - 1]?.content) || 'Đã nhận được thông tin.';
      }

      // Thêm phản hồi của Assistant an toàn (không dùng innerHTML trực tiếp)
      const assistantMsg = document.createElement('div');
      assistantMsg.className = 'vif-msg-bubble vif-msg-assistant';
      assistantMsg.appendChild(renderSafeMessage(replyText));
      msgContainer.appendChild(assistantMsg);
      msgContainer.scrollTop = msgContainer.scrollHeight;

      // Linh vật chuyển sang chuyển động phản hồi speaking / celebrating
      if (replyText.includes('Chúc mừng') || replyText.includes('xuất sắc') || replyText.includes('hoàn thành')) {
        this.headerMascot.setState('celebrating', 3000);
        this.launcherMascot.setState('celebrating', 3000);
      } else {
        this.headerMascot.setState('speaking', 2200);
        this.launcherMascot.setState('speaking', 2200);
      }
    } catch (err) {
      // Giữ lại nội dung câu hỏi vào input để người dùng không bị mất
      input.value = '';

      // Linh vật biểu cảm bối rối nhẹ
      this.headerMascot.setState('error', 2500);
      this.launcherMascot.setState('error', 2500);

      const errorMsg = document.createElement('div');
      errorMsg.className = 'vif-msg-bubble vif-msg-assistant';
      errorMsg.style.borderColor = '#ff8c8c';
      errorMsg.innerHTML = `<p style="color:#c92a2a">⚠️ ${err.message || 'Không thể kết nối tới trợ lý.'}</p>`;
      msgContainer.appendChild(errorMsg);
      msgContainer.scrollTop = msgContainer.scrollHeight;
    } finally {
      this.isBusy = false;
      sendBtn.disabled = false;
      typing.hidden = true;
      typing.style.display = 'none';
      input.focus();
    }
  }

  destroy() {
    window.removeEventListener('keydown', this._boundKeydown);
    if (this.hostAdapter) this.hostAdapter.destroy();
    if (this.launcherMascot) this.launcherMascot.destroy();
    if (this.headerMascot) this.headerMascot.destroy();
    if (this.launcherEl && this.launcherEl.parentNode) {
      this.launcherEl.parentNode.removeChild(this.launcherEl);
    }
    if (this.panelEl && this.panelEl.parentNode) {
      this.panelEl.parentNode.removeChild(this.panelEl);
    }
  }
}
