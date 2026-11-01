/**
 * VisionFit Mascot Renderer Engine
 * Quản lý vòng đời hiển thị linh vật, chuyển đổi trạng thái,
 * animation hữu hạn, tạm dừng khi ẩn tab và hỗ trợ giảm chuyển động.
 */

export const MASCOT_STATES = Object.freeze(['idle', 'greeting', 'thinking', 'speaking', 'training', 'celebrating', 'error']);
export const MASCOT_SPECIES = Object.freeze(['bear', 'cat']);
export const EVOLUTION_STAGES = Object.freeze(['starter', 'active', 'strong', 'champion']);
export function isMascotState(value) { return MASCOT_STATES.includes(value); }
import { renderBearSVG } from './bear.js';
import { renderCatSVG } from './cat.js';

export class MascotRenderer {
  /**
   * @param {HTMLElement} container - Nơi mount linh vật
   * @param {Object} options
   */
  constructor(container, options = {}) {
    if (!container) throw new Error('MascotRenderer: Container element is required.');
    this.container = container;
    this.species = MASCOT_SPECIES.includes(options.species) ? options.species : 'bear';
    this.stage = EVOLUTION_STAGES.includes(options.stage) ? options.stage : 'starter';
    this.state = isMascotState(options.state) ? options.state : 'idle';
    this.baselineState = options.workoutActive ? 'training' : 'idle';
    this.isWorkoutActive = Boolean(options.workoutActive);
    this.reducedMotion = Boolean(options.reducedMotion);

    this.timer = null;
    this.onStateChange = options.onStateChange || null;

    // Lắng nghe thay đổi tab ẩn/hiện để tạm dừng animation
    this._handleVisibility = this._handleVisibility.bind(this);
    document.addEventListener('visibilitychange', this._handleVisibility);

    // Lắng nghe tùy chọn hệ thống prefers-reduced-motion
    this._mediaQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    this._handleMotionPreference = (e) => {
      this.reducedMotion = e.matches;
      this._updateMotionClass();
    };
    if (this._mediaQuery?.addEventListener) {
      this._mediaQuery.addEventListener('change', this._handleMotionPreference);
    }

    this.mount();
  }

  mount() {
    this.container.classList.add('vif-mascot-container');
    this._updateMotionClass();
    this.render();
  }

  _updateMotionClass() {
    if (this.reducedMotion || (this._mediaQuery && this._mediaQuery.matches)) {
      this.container.classList.add('reduced-motion');
    } else {
      this.container.classList.remove('reduced-motion');
    }
  }

  _handleVisibility() {
    if (document.hidden) {
      this.container.classList.add('tab-hidden');
    } else {
      this.container.classList.remove('tab-hidden');
    }
  }

  setSpecies(species) {
    if (!MASCOT_SPECIES.includes(species)) return;
    if (this.species !== species) {
      this.species = species;
      this.render();
    }
  }

  setStage(stage) {
    if (!EVOLUTION_STAGES.includes(stage)) return;
    if (this.stage !== stage) {
      this.stage = stage;
      this.render();
    }
  }

  /**
   * Thiết lập trạng thái animation
   * @param {string} state - Một trong các giá trị MASCOT_STATES
   * @param {number} [durationMs=0] - Nếu > 0, sau thời gian này sẽ quay về baseline
   */
  setState(state, durationMs = 0) {
    if (!isMascotState(state)) return;
    this._clearTimer();
    this.state = state;
    this.render();
    if (this.onStateChange) this.onStateChange(this.state);

    // Xử lý các trạng thái chạy hữu hạn
    if (durationMs > 0 || state === 'greeting' || state === 'celebrating') {
      const wait = durationMs > 0 ? durationMs : state === 'greeting' ? 2400 : 3200;
      this.timer = setTimeout(() => {
        this.state = this.baselineState;
        this.render();
        if (this.onStateChange) this.onStateChange(this.state);
        this.timer = null;
      }, wait);
    }
  }

  /**
   * Cập nhật trạng thái buổi tập
   */
  setWorkoutActive(active) {
    this.isWorkoutActive = Boolean(active);
    this.baselineState = this.isWorkoutActive ? 'training' : 'idle';
    // Nếu đang ở trạng thái nền cũ, chuyển sang trạng thái nền mới
    if (this.state === 'idle' || this.state === 'training') {
      this.setState(this.baselineState);
    }
  }

  setReducedMotion(reduced) {
    this.reducedMotion = Boolean(reduced);
    this._updateMotionClass();
  }

  _clearTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  render() {
    try {
      const svgHTML = this.species === 'cat'
        ? renderCatSVG(this.stage, this.state)
        : renderBearSVG(this.stage, this.state);
      this.container.innerHTML = svgHTML;
    } catch (err) {
      // Fallback an toàn khi có lỗi render
      this.container.innerHTML = `
        <div class="vif-mascot-fallback" role="img" aria-label="Linh vật VisionFit">
          <svg viewBox="0 0 100 100" width="100%" height="100%">
            <circle cx="50" cy="50" r="45" fill="#1b8a5a"/>
            <text x="50" y="58" font-size="28" fill="#ffffff" text-anchor="middle" font-family="sans-serif" font-weight="bold">VIF</text>
          </svg>
        </div>
      `;
    }
  }

  destroy() {
    this._clearTimer();
    document.removeEventListener('visibilitychange', this._handleVisibility);
    if (this._mediaQuery?.removeEventListener) {
      this._mediaQuery.removeEventListener('change', this._handleMotionPreference);
    }
    this.container.innerHTML = '';
    this.container.classList.remove('vif-mascot-container', 'reduced-motion', 'tab-hidden');
  }
}
