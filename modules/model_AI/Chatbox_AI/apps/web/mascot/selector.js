/**
 * VisionFit Mascot Selector Modal
 * Cho phép người dùng xem trước linh vật Gấu và Mèo với animation chào thực tế,
 * hỗ trợ lưu tùy chọn (hoặc chế độ demo tách biệt rõ ràng).
 */

import { MascotRenderer } from './renderer.js';

export class MascotSelector {
  /**
   * @param {Object} options
   * @param {string} options.currentSpecies - 'bear' | 'cat'
   * @param {string} options.currentStage - 'starter' | 'active' | 'strong' | 'champion'
   * @param {string} options.userKey - Mã người dùng để lưu tùy chọn giao diện
   * @param {Function} options.onSelect - Callback khi người dùng xác nhận chọn thú
   * @param {Function} options.onClose - Callback khi đóng modal
   */
  constructor(options = {}) {
    this.currentSpecies = options.currentSpecies || 'bear';
    this.selectedSpecies = this.currentSpecies;
    this.currentStage = options.currentStage || 'starter';
    this.userKey = options.userKey || 'guest';
    this.onSelect = options.onSelect || null;
    this.onClose = options.onClose || null;

    this.overlay = null;
    this.bearPreview = null;
    this.catPreview = null;
    this.isSaving = false;
  }

  show() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'vif-selector-overlay';
    this.overlay.setAttribute('role', 'dialog');
    this.overlay.setAttribute('aria-modal', 'true');
    this.overlay.setAttribute('aria-labelledby', 'selector-title');

    this.overlay.innerHTML = `
      <div class="vif-selector-modal">
        <header class="vif-selector-header">
          <div>
            <span class="vif-tag">BẠN ĐỒNG HÀNH VISIONFIT</span>
            <h2 id="selector-title">Chọn Linh Vật Của Bạn</h2>
            <p>Chọn người bạn đồng hành cùng bạn trên từng buổi tập luyện.</p>
          </div>
          <button type="button" class="vif-close-btn" id="selector-close" aria-label="Đóng bảng chọn">✕</button>
        </header>

        <div class="vif-species-cards">
          <!-- Thẻ Gấu VIF -->
          <div class="vif-card ${this.selectedSpecies === 'bear' ? 'selected' : ''}" id="card-bear" tabindex="0" role="button" aria-pressed="${this.selectedSpecies === 'bear'}">
            <div class="vif-card-preview" id="preview-bear"></div>
            <div class="vif-card-info">
              <h3>Gấu VIF</h3>
              <p class="tagline">Khỏe khoắn · Vui vẻ · Bền bỉ</p>
              <p class="desc">Đại diện cho sức mạnh và sự kiên trì. Luôn cổ vũ bạn hoàn thành từng set tập nặng nhất!</p>
            </div>
            <div class="vif-badge-check">✓ Đang chọn</div>
          </div>

          <!-- Thẻ Mèo VIF -->
          <div class="vif-card ${this.selectedSpecies === 'cat' ? 'selected' : ''}" id="card-cat" tabindex="0" role="button" aria-pressed="${this.selectedSpecies === 'cat'}">
            <div class="vif-card-preview" id="preview-cat"></div>
            <div class="vif-card-info">
              <h3>Mèo VIF</h3>
              <p class="tagline">Nhanh nhẹn · Tinh nghịch · Linh hoạt</p>
              <p class="desc">Tượng trưng cho sự linh hoạt và phản xạ nhanh. Giúp các buổi cardio và yoga thêm hào hứng!</p>
            </div>
            <div class="vif-badge-check">✓ Đang chọn</div>
          </div>
        </div>

        <div class="vif-selector-notice">
          <span class="notice-icon">ℹ</span>
          <span>Đổi linh vật không làm mất tiến độ hoặc cấp độ đạt được. Cấp độ hiện tại: <strong>${this.currentStage}</strong> (do backend cấp).</span>
        </div>

        <div class="vif-selector-error" id="selector-error" role="alert" hidden></div>

        <footer class="vif-selector-footer">
          <small class="demo-badge">Giao diện độc lập · Lưu tùy chọn cục bộ theo phiên</small>
          <div class="footer-actions">
            <button type="button" class="vif-btn-secondary" id="btn-cancel">Giữ nguyên</button>
            <button type="button" class="vif-btn-primary" id="btn-confirm">
              <span id="btn-text">Xác nhận đồng hành</span>
              <span id="btn-spinner" class="spinner" hidden></span>
            </button>
          </div>
        </footer>
      </div>
    `;

    document.body.appendChild(this.overlay);

    // Khởi tạo preview SVG động cho cả 2 thẻ
    const bearEl = this.overlay.querySelector('#preview-bear');
    const catEl = this.overlay.querySelector('#preview-cat');

    this.bearPreview = new MascotRenderer(bearEl, {
      species: 'bear',
      stage: this.currentStage,
      state: this.selectedSpecies === 'bear' ? 'greeting' : 'idle'
    });

    this.catPreview = new MascotRenderer(catEl, {
      species: 'cat',
      stage: this.currentStage,
      state: this.selectedSpecies === 'cat' ? 'greeting' : 'idle'
    });

    this._bindEvents();
    this.overlay.querySelector('#btn-confirm').focus();
  }

  _bindEvents() {
    const cardBear = this.overlay.querySelector('#card-bear');
    const cardCat = this.overlay.querySelector('#card-cat');
    const btnConfirm = this.overlay.querySelector('#btn-confirm');
    const btnCancel = this.overlay.querySelector('#btn-cancel');
    const btnClose = this.overlay.querySelector('#selector-close');

    const select = (species) => {
      this.selectedSpecies = species;
      cardBear.classList.toggle('selected', species === 'bear');
      cardBear.setAttribute('aria-pressed', String(species === 'bear'));
      cardCat.classList.toggle('selected', species === 'cat');
      cardCat.setAttribute('aria-pressed', String(species === 'cat'));

      // Chạy animation chào mừng khi được chọn
      if (species === 'bear') {
        this.bearPreview.setState('greeting', 2000);
      } else {
        this.catPreview.setState('greeting', 2000);
      }
    };

    cardBear.addEventListener('click', () => select('bear'));
    cardBear.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') select('bear'); });

    cardCat.addEventListener('click', () => select('cat'));
    cardCat.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') select('cat'); });

    btnClose.addEventListener('click', () => this.close());
    btnCancel.addEventListener('click', () => this.close());

    // Đóng bằng phím Escape
    this._handleKeyDown = (e) => {
      if (e.key === 'Escape') this.close();
    };
    window.addEventListener('keydown', this._handleKeyDown);

    btnConfirm.addEventListener('click', async () => {
      if (this.isSaving) return;
      this.isSaving = true;
      const btnText = this.overlay.querySelector('#btn-text');
      const btnSpinner = this.overlay.querySelector('#btn-spinner');
      const errorEl = this.overlay.querySelector('#selector-error');

      btnText.textContent = 'Đang lưu…';
      btnSpinner.hidden = false;
      errorEl.hidden = true;

      try {
        // Lưu preference vào memory / localStorage phân tách theo userKey
        if (this.userKey) {
          try {
            sessionStorage.setItem(`vif_mascot_${this.userKey}`, this.selectedSpecies);
          } catch (_) { /* ignore */ }
        }

        // Chạy animation chúc mừng ngắn
        if (this.selectedSpecies === 'bear') this.bearPreview.setState('celebrating', 1500);
        else this.catPreview.setState('celebrating', 1500);

        await new Promise(r => setTimeout(r, 600));

        if (this.onSelect) {
          this.onSelect(this.selectedSpecies);
        }
        this.close();
      } catch (err) {
        errorEl.textContent = 'Chưa thể lưu linh vật lên tài khoản. ' + (err.message || 'Vui lòng thử lại.');
        errorEl.hidden = false;
        btnText.textContent = 'Thử lại';
        btnSpinner.hidden = true;
        this.isSaving = false;
      }
    });
  }

  close() {
    window.removeEventListener('keydown', this._handleKeyDown);
    if (this.bearPreview) this.bearPreview.destroy();
    if (this.catPreview) this.catPreview.destroy();
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
    if (this.onClose) this.onClose();
  }
}
