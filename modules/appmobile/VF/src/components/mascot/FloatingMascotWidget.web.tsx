// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';

// Error Boundary bảo vệ app không bao giờ bị crash
class MascotErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err: any) { console.warn('[Mascot Error Handled Safely]', err); }
  render() { return this.state.hasError ? null : this.props.children; }
}

export type MascotMotionMode = 'roaming' | 'bouncing' | 'static';

interface FloatingMascotProps {
  species?: 'cat' | 'bear';
  stage?: 'starter' | 'active' | 'strong' | 'champion';
  showChatboxSettings?: boolean;
}

export const FloatingMascotWidget: React.FC<FloatingMascotProps> = (props) => {
  return (
    <MascotErrorBoundary>
      <MascotCore {...props}/>
    </MascotErrorBoundary>
  );
};

const MascotCore: React.FC<FloatingMascotProps> = ({
  species = 'cat',
  stage = 'starter',
  showChatboxSettings = true
}) => {
  // Chế độ chuyển động lấy từ localStorage: 'roaming' (đi lại) | 'bouncing' (nhún nhảy) | 'static' (đứng yên)
  const [motionMode, setMotionMode] = useState<MascotMotionMode>(() => {
    if (typeof localStorage !== 'undefined') {
      return (localStorage.getItem('vif_mascot_mode') as MascotMotionMode) || 'bouncing';
    }
    return 'bouncing';
  });

  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [posX, setPosX] = useState(60);
  const [posY, setPosY] = useState(85); // Cách đáy màn hình trên thanh Bottom Nav
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isWalking, setIsWalking] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const WIDGET_W = 100;
  const WIDGET_H = 120;

  // 1. Tự động tránh bàn phím ảo trên điện thoại (Visual Viewport)
  useEffect(() => {
    const handleViewportResize = () => {
      if (typeof window !== 'undefined' && window.visualViewport) {
        const offset = window.innerHeight - window.visualViewport.height;
        setKeyboardOffset(offset > 50 ? offset + 14 : 0); // Cách bàn phím 14px
      }
    };
    if (typeof window !== 'undefined') {
      window.visualViewport?.addEventListener('resize', handleViewportResize);
      window.visualViewport?.addEventListener('scroll', handleViewportResize);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.visualViewport?.removeEventListener('resize', handleViewportResize);
        window.visualViewport?.removeEventListener('scroll', handleViewportResize);
      }
    };
  }, []);

  // 2. Logic điều khiển theo chế độ Motion Mode
  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('vif_mascot_mode', motionMode);
    }

    if (motionMode === 'static' || isDragging) {
      setIsWalking(false);
      return;
    }

    if (motionMode === 'bouncing') {
      setIsWalking(false);
      return;
    }

    // Chế độ 'roaming' (Đi qua đi lại đáy màn hình)
    let moveTimer: any;
    let stepInterval: any;

    const startWalkingLoop = () => {
      setIsWalking(true);
      stepInterval = setInterval(() => {
        setPosX((prev) => {
          const screenW = typeof window !== 'undefined' ? window.innerWidth || 360 : 360;
          const next = prev + 1.4 * direction;
          if (next > screenW - WIDGET_W - 12) {
            setDirection(-1);
            return screenW - WIDGET_W - 12;
          }
          if (next < 12) {
            setDirection(1);
            return 12;
          }
          return next;
        });
      }, 40);

      moveTimer = setTimeout(() => {
        clearInterval(stepInterval);
        setIsWalking(false); // Dừng lại nghỉ 3 giây
        setTimeout(() => {
          if (motionMode === 'roaming') startWalkingLoop();
        }, 3000);
      }, 5000);
    };

    startWalkingLoop();

    return () => {
      clearInterval(stepInterval);
      clearTimeout(moveTimer);
    };
  }, [motionMode, direction, isDragging]);

  // 3. Cơ chế Kéo thả bám chặt cử chỉ tay 1:1 (Direct Touch Anchor)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!e.touches || e.touches.length === 0) return;
    const touch = e.touches[0];
    setIsDragging(true);
    const winH = typeof window !== 'undefined' ? window.innerHeight : 800;
    dragOffsetRef.current = {
      x: touch.clientX - posX,
      y: (winH - touch.clientY) - posY
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !e.touches || e.touches.length === 0) return;
    const touch = e.touches[0];
    const winW = typeof window !== 'undefined' ? window.innerWidth : 360;
    const winH = typeof window !== 'undefined' ? window.innerHeight : 800;
    const newX = touch.clientX - dragOffsetRef.current.x;
    const newY = (winH - touch.clientY) - dragOffsetRef.current.y;

    const maxW = winW - WIDGET_W - 8;
    const maxH = winH - WIDGET_H - 20;

    setPosX(Math.max(8, Math.min(maxW, newX)));
    setPosY(Math.max(75, Math.min(maxH, newY))); // Luôn nằm trên thanh Bottom Nav (min 75px)
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  return (
    <>
      {/* 1. Nút cài đặt chuyển động tích hợp trên thanh Chatbox */}
      {showChatboxSettings && (
        <div
          style={{
            position: 'fixed',
            bottom: `${keyboardOffset + 14}px`, // Cách bàn phím đúng 14px
            right: '16px',
            zIndex: 99998,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '8px'
          }}
        >
          {showSettingsMenu && (
            <div
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                padding: '10px 14px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '13px',
                border: '1px solid #E2E8F0',
                minWidth: '150px'
              }}
            >
              <div style={{ fontWeight: 'bold', color: '#1E293B', marginBottom: '2px' }}>⚙️ Chế độ Mascot</div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="mascot_mode"
                  checked={motionMode === 'roaming'}
                  onChange={() => setMotionMode('roaming')}
                />
                🚶 Đi lại tự do
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="mascot_mode"
                  checked={motionMode === 'bouncing'}
                  onChange={() => setMotionMode('bouncing')}
                />
                🤸 Nhún nhảy
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="mascot_mode"
                  checked={motionMode === 'static'}
                  onChange={() => setMotionMode('static')}
                />
                🧘 Đứng yên
              </label>
            </div>
          )}

          <button
            onClick={() => setShowSettingsMenu(!showSettingsMenu)}
            style={{
              background: '#0F766E',
              color: '#ffffff',
              border: 'none',
              borderRadius: '50%',
              width: '38px',
              height: '38px',
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(15,118,110,0.35)',
              cursor: 'pointer'
            }}
            title="Cài đặt hiệu ứng Mascot"
          >
            ⚙️
          </button>
        </div>
      )}

      {/* 2. Khung Mascot bám ngón tay, không bị xiêu vẹo */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          position: 'fixed',
          left: `${posX}px`,
          bottom: `${posY + keyboardOffset}px`,
          width: `${WIDGET_W}px`,
          height: `${WIDGET_H}px`,
          zIndex: 99999,
          touchAction: 'none',
          userSelect: 'none',
          cursor: isDragging ? 'grabbing' : 'grab',
          transform: `scaleX(${direction})`,
          transition: isDragging ? 'none' : 'transform 0.25s ease-out',
          filter: isDragging
            ? 'drop-shadow(0 14px 20px rgba(0,0,0,0.25)) scale(1.08)'
            : 'drop-shadow(0 4px 10px rgba(0,0,0,0.12))'
        }}
      >
        <svg
          viewBox="0 0 200 240"
          width="100%"
          height="100%"
          className={`vif-mascot-svg species-${species} stage-${stage} mode-${motionMode} ${isWalking ? 'is-walking' : ''}`}
        >
          <defs>
            <style>{`
              .vif-mascot-svg { overflow: visible; }
              .part-leg.leg-left { transform-origin: 76px 190px; }
              .part-leg.leg-right { transform-origin: 124px 190px; }
              .arm-left { transform-origin: 64px 126px; }
              .arm-right { transform-origin: 136px 126px; }

              /* Chế độ nhún nhảy tại chỗ (Bouncing) */
              .mode-bouncing .character-root {
                animation: vif-subtle-bounce 1.6s ease-in-out infinite;
              }
              .mode-bouncing .arm-left {
                animation: vif-arm-sway-l 1.6s ease-in-out infinite;
              }
              .mode-bouncing .arm-right {
                animation: vif-arm-sway-r 1.6s ease-in-out infinite;
              }

              /* Chế độ đi bước nhẹ nhàng, thân thẳng đứng không bị xiêu vẹo */
              .is-walking .character-root {
                animation: vif-walk-bob 0.4s ease-in-out infinite alternate;
              }
              .is-walking .part-leg.leg-left {
                animation: vif-leg-swing-l 0.5s ease-in-out infinite alternate;
              }
              .is-walking .part-leg.leg-right {
                animation: vif-leg-swing-r 0.5s ease-in-out infinite alternate;
              }
              .is-walking .arm-left {
                animation: vif-arm-swing-l 0.5s ease-in-out infinite alternate;
              }
              .is-walking .arm-right {
                animation: vif-arm-swing-r 0.5s ease-in-out infinite alternate;
              }

              @keyframes vif-subtle-bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-4px); }
              }
              @keyframes vif-arm-sway-l {
                0%, 100% { transform: rotate(0deg); }
                50% { transform: rotate(-8deg); }
              }
              @keyframes vif-arm-sway-r {
                0%, 100% { transform: rotate(0deg); }
                50% { transform: rotate(8deg); }
              }
              @keyframes vif-walk-bob {
                0% { transform: translateY(0); }
                100% { transform: translateY(-3px); }
              }
              @keyframes vif-leg-swing-l {
                0% { transform: rotate(-14deg); }
                100% { transform: rotate(14deg); }
              }
              @keyframes vif-leg-swing-r {
                0% { transform: rotate(14deg); }
                100% { transform: rotate(-14deg); }
              }
              @keyframes vif-arm-swing-l {
                0% { transform: rotate(12deg); }
                100% { transform: rotate(-12deg); }
              }
              @keyframes vif-arm-swing-r {
                0% { transform: rotate(-12deg); }
                100% { transform: rotate(12deg); }
              }
            `}</style>
          </defs>

          <g className="character-root">
            {/* Chân */}
            <g className="layer-legs">
              <g className="part-leg leg-left">
                <path d="M 68 186 C 67 198 66 208 65 214 C 63 220 69 223 78 223 C 88 223 91 220 90 214 C 89 208 89 198 88 186 Z" fill="#F97316" stroke="#1E293B" strokeWidth="3.2"/>
              </g>
              <g className="part-leg leg-right">
                <path d="M 112 186 C 111 198 111 208 110 214 C 109 220 112 223 122 223 C 131 223 137 220 135 214 C 134 208 133 198 132 186 Z" fill="#F97316" stroke="#1E293B" strokeWidth="3.2"/>
              </g>
            </g>

            {/* Đuôi */}
            <path d="M 130 194 C 156 196 174 176 174 150 C 174 134 162 132 161 144 C 160 162 148 182 128 184 Z" fill="#F97316" stroke="#1E293B" strokeWidth="3.2"/>

            {/* Thân */}
            <g className="torso-rig">
              <path d="M 66 123 C 75 113 125 113 134 123 C 143 148 141 186 132 197 C 116 205 84 205 68 197 C 59 186 57 148 66 123 Z" fill="#F97316" stroke="#1E293B" strokeWidth="3.2"/>
              <ellipse cx="100" cy="165" rx="23" ry="27" fill="#FEF3C7"/>
              <path d="M 73 121 C 86 128 114 128 127 121 L 129 127 C 114 135 86 135 71 127 Z" fill="#10B981" stroke="#1E293B" strokeWidth="2.8"/>

              {/* Tay trái */}
              <g className="arm-left">
                <path d="M 67 122 C 52 125 45 138 44.5 152 A 6.8 6.8 0 0 0 58 152 C 58 142 61 134 69 128 Z" fill="#F97316" stroke="#1E293B" strokeWidth="3.2"/>
              </g>

              {/* Tay phải */}
              <g className="arm-right">
                <path d="M 133 122 C 148 125 155 138 155.5 152 A 6.8 6.8 0 0 1 142 152 C 142 142 139 134 131 128 Z" fill="#F97316" stroke="#1E293B" strokeWidth="3.2"/>
              </g>
            </g>

            {/* Đầu */}
            <g className="layer-head-group">
              <path d="M 52 42 L 67 18 L 84 32 Z" fill="#F97316" stroke="#1E293B" strokeWidth="3.2"/>
              <path d="M 148 42 L 133 18 L 116 32 Z" fill="#F97316" stroke="#1E293B" strokeWidth="3.2"/>
              <ellipse cx="100" cy="74" rx="46" ry="38" fill="#F97316" stroke="#1E293B" strokeWidth="3.2"/>
              <ellipse cx="80" cy="74" rx="5" ry="6" fill="#1E293B"/>
              <ellipse cx="120" cy="74" rx="5" ry="6" fill="#1E293B"/>
              <polygon points="100,82 96,78 104,78" fill="#FB7185"/>
              <path d="M 96 86 Q 100 89 104 86" fill="none" stroke="#1E293B" strokeWidth="2.4" strokeLinecap="round"/>
            </g>
          </g>
        </svg>
      </div>
    </>
  );
};

export default FloatingMascotWidget;
