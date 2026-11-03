/**
 * VisionFit Mascot Renderer Engine
 * Quản lý vòng đời hiển thị linh vật, chuyển đổi trạng thái hiệu năng cao
 * (chỉ đổi class/data attribute, không tái tạo SVG liên tục),
 * xử lý animation hữu hạn, tạm dừng khi ẩn tab và hỗ trợ giảm chuyển động.
 */

import { MASCOT_STATES, MASCOT_SPECIES, EVOLUTION_STAGES, isMascotState } from '../../../packages/contracts/assistant.js';
import { renderBearSVG } from './bear.js';
import { renderCatSVG } from './cat.js';

export { MASCOT_STATES, MASCOT_SPECIES, EVOLUTION_STAGES, isMascotState };

const LEGACY_STATE_MAP = {
  talking: 'speaking',
  confused: 'error',
  motivating: 'training',
  resting: 'idle',
  listening: 'idle'
};

export class MascotRenderer {
  /**
   * @param {HTMLElement} container - Nơi mount linh vật
   * @param {Object} options
   */
  constructor(container, options = {}) {
    if (!container) throw new Error('MascotRenderer: Container element is required.');
    this.container = container;
    this.instanceId = options.instanceId || ('vif-m-' + Math.random().toString(36).slice(2, 8));
    this.species = MASCOT_SPECIES.includes(options.species) ? options.species : 'bear';
    this.stage = EVOLUTION_STAGES.includes(options.stage) ? options.stage : 'starter';
    const normalizedInitialState = LEGACY_STATE_MAP[options.state] || options.state;
    this.state = isMascotState(normalizedInitialState) ? normalizedInitialState : 'idle';
    this.isWorkoutActive = Boolean(options.workoutActive);
    this.baselineState = this.isWorkoutActive ? 'training' : 'idle';

    // Tách biệt tùy chọn người dùng với media query hệ điều hành
    this.userReducedMotion = typeof options.reducedMotion === 'boolean' ? options.reducedMotion : null;
    this.systemReducedMotion = false;

    this.timer = null;
    this.onStateChange = options.onStateChange || null;
    this._svgEl = null;

    // Lắng nghe thay đổi tab ẩn/hiện để tạm dừng animation
    this._handleVisibility = this._handleVisibility.bind(this);
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this._handleVisibility);
    }

    // Lắng nghe tùy chọn hệ thống prefers-reduced-motion
    this._mediaQuery = typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)')
      : null;
    this._handleMotionPreference = (e) => {
      this.systemReducedMotion = e.matches;
      this._updateMotionClass();
    };
    if (this._mediaQuery) {
      this.systemReducedMotion = this._mediaQuery.matches;
      if (this._mediaQuery.addEventListener) {
        this._mediaQuery.addEventListener('change', this._handleMotionPreference);
      }
    }

    this.mount();
  }

  mount() {
    this.container.classList.add('vif-mascot-container');
    this._updateMotionClass();

    // Nếu lúc mount tab đã ẩn thì lập tức áp dụng trạng thái tab-hidden
    if (typeof document !== 'undefined' && document.hidden) {
      this.container.classList.add('tab-hidden');
    }

    this._mountSVG();
  }

  _updateMotionClass() {
    const isReduced = this.userReducedMotion !== null
      ? this.userReducedMotion
      : this.systemReducedMotion;

    if (isReduced) {
      this.container.classList.add('reduced-motion');
    } else {
      this.container.classList.remove('reduced-motion');
    }
  }

  _handleVisibility() {
    if (typeof document === 'undefined') return;
    if (document.hidden) {
      this.container.classList.add('tab-hidden');
    } else {
      this.container.classList.remove('tab-hidden');
    }
  }

  /**
   * Tạo khung SVG lần đầu hoặc khi đổi loài / cấp độ
   */
  _mountSVG() {
    try {
      const renderFn = this.species === 'cat' ? renderCatSVG : renderBearSVG;
      const svgHTML = renderFn(this.stage, this.state, { idPrefix: this.instanceId });
      this.container.innerHTML = svgHTML;
      this._svgEl = this.container.querySelector('.vif-mascot-svg');
    } catch {
      this.container.innerHTML = `
        <div class="vif-mascot-fallback" role="img" aria-label="Linh vật VisionFit">
          <svg viewBox="0 0 100 100" width="100%" height="100%">
            <circle cx="50" cy="50" r="45" fill="#1b8a5a"/>
            <text x="50" y="58" font-size="28" fill="#ffffff" text-anchor="middle" font-family="sans-serif" font-weight="bold">VIF</text>
          </svg>
        </div>
      `;
      this._svgEl = null;
    }
  }

  setSpecies(species) {
    if (!MASCOT_SPECIES.includes(species)) return;
    if (this.species !== species) {
      this.species = species;
      this._mountSVG();
    }
  }

  setStage(stage) {
    if (!EVOLUTION_STAGES.includes(stage)) return;
    if (this.stage !== stage) {
      this.stage = stage;
      this._mountSVG();
    }
  }

  /**
   * Thiết lập trạng thái animation
   * Không dựng lại SVG; chỉ cập nhật class và data attribute trên DOM hiện có
   * @param {string} rawState - Một trong các giá trị MASCOT_STATES (hoặc alias legacy)
   * @param {number} [durationMs=0] - Nếu > 0, sau thời gian này sẽ quay về baseline
   * @param {boolean} [forceReplay=false] - Buộc chạy lại animation nếu cùng state
   */
  setState(rawState, durationMs = 0, forceReplay = false) {
    const state = LEGACY_STATE_MAP[rawState] || rawState;
    if (!isMascotState(state)) return;
    if (this.state === state && !forceReplay) return;

    this._clearTimer();
    this.state = state;

    if (this._svgEl) {
      for (const s of MASCOT_STATES) {
        this._svgEl.classList.remove(`state-${s}`);
      }
      this._svgEl.classList.add(`state-${state}`);
      this._svgEl.setAttribute('data-state', state);
      this._svgEl.setAttribute('aria-label', `Linh vật ${this.species === 'bear' ? 'Gấu' : 'Mèo'} VisionFit cấp độ ${this.stage} trạng thái ${state}`);

      if (forceReplay) {
        // Trigger reflow để kích hoạt lại animation cùng loại
        void this._svgEl.offsetWidth;
      }
    } else {
      this._mountSVG();
    }

    if (this.onStateChange) this.onStateChange(this.state);

    // Xử lý các animation hữu hạn (greeting, celebrating hoặc durationMs > 0)
    // Khi kết thúc sẽ quay về baselineState (training nếu đang tập, idle nếu nghỉ)
    if (durationMs > 0 || state === 'greeting' || state === 'celebrating') {
      const wait = durationMs > 0 ? durationMs : state === 'greeting' ? 2200 : 3000;
      this.timer = setTimeout(() => {
        this.timer = null;
        this.setState(this.baselineState);
      }, wait);
    }
  }

  /**
   * Kích hoạt animation hữu hạn rồi tự động quay về baselineState
   * (Hỗ trợ đầy đủ cho các kịch bản trong lab.js)
   * @param {string} state
   * @param {number} [durationMs=3000]
   */
  triggerFiniteAnimation(state, durationMs = 3000) {
    this.setState(state, durationMs, true);
  }

  /**
   * Cập nhật trạng thái buổi tập
   */
  setWorkoutActive(active) {
    this.isWorkoutActive = Boolean(active);
    this.baselineState = this.isWorkoutActive ? 'training' : 'idle';
    // Nếu đang ở trạng thái nền cũ thì cập nhật ngay sang nền mới
    if (this.state === 'idle' || this.state === 'training') {
      this.setState(this.baselineState);
    }
  }

  setReducedMotion(reduced) {
    this.userReducedMotion = typeof reduced === 'boolean' ? reduced : null;
    this._updateMotionClass();
  }

  _clearTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  destroy() {
    this._clearTimer();
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this._handleVisibility);
    }
    if (this._mediaQuery?.removeEventListener) {
      this._mediaQuery.removeEventListener('change', this._handleMotionPreference);
    }
    this.container.innerHTML = '';
    this.container.classList.remove('vif-mascot-container', 'reduced-motion', 'tab-hidden');
    this._svgEl = null;
  }
}
