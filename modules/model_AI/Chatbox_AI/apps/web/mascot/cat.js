/**
 * VisionFit Mascot - Cat (Mèo VIF)
 * Nhanh nhẹn, tinh nghịch, lanh lợi.
 * Hệ thống SVG phân cấp khớp động học (kinematic joint hierarchy):
 * - layer-shadow: bóng mặt đất cố định
 * - character-root: gốc chuyển động toàn thân (nhảy, đáp đất)
 *   - layer-legs: chân & bàn chân mèo
 *   - layer-tail: đuôi mèo gắn gốc vào thân
 *   - torso-rig: thân, cổ, tay và đầu
 *     - layer-body: thân, cơ ngực/yếm, áo thể thao theo cấp
 *     - acc-medal: huy chương Champion gắn vào torso-rig
 *     - layer-arms: cánh tay trái/phải với pivot vai chuẩn xác
 *     - layer-head-group: nhóm đầu, tai, mắt xanh ngọc, râu mèo, mũi miệng
 */

export function renderCatSVG(stage = 'starter', state = 'idle', options = {}) {
  const prefix = options.idPrefix || ('vif-c-' + Math.random().toString(36).slice(2, 8));

  // Bảng màu cho Mèo VIF (Cam gừng ấm áp + Trắng kem thể thao)
  const colors = {
    furMain: '#e77c38',
    furDark: '#c25816',
    furLight: '#fca867',
    furWhite: '#ffffff',
    furCream: '#fff4ea',
    earInner: '#ffafaf',
    snout: '#ffffff',
    nose: '#ff6b81',
    eyes: '#154e38', // Mắt xanh ngọc bích sắc sảo
    eyeHighlight: '#ffffff',
    whiskers: '#8a4b24',
    brandGreen: '#1b8a5a',
    brandLight: '#3dd68c',
    brandDark: '#125e3c',
    gold: '#f9b233',
    goldLight: '#ffe072',
    beltBlack: '#21262d'
  };

  const isStarter = stage === 'starter';
  const isActive = stage === 'active';
  const isStrong = stage === 'strong';
  const isChampion = stage === 'champion';

  const torsoWidthOffset = isChampion ? 5 : isStrong ? 3 : isActive ? 1 : 0;
  const armThickness = isChampion ? 2.5 : isStrong ? 1.8 : isActive ? 1 : 0;

  return `
<svg class="vif-mascot-svg species-cat stage-${stage} state-${state}" viewBox="0 0 200 240" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Linh vật Mèo VisionFit cấp độ ${stage} trạng thái ${state}" data-species="cat" data-stage="${stage}" data-state="${state}">
  <defs>
    <!-- Đổ bóng mặt đất độc lập -->
    <radialGradient id="${prefix}-shadow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#0b2417" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="#0b2417" stop-opacity="0"/>
    </radialGradient>
    <!-- Gradient lông mèo ấm áp -->
    <linearGradient id="${prefix}-fur" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${colors.furLight}"/>
      <stop offset="100%" stop-color="${colors.furMain}"/>
    </linearGradient>
    <linearGradient id="${prefix}-fur-body" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${colors.furLight}"/>
      <stop offset="60%" stop-color="${colors.furMain}"/>
      <stop offset="100%" stop-color="${colors.furDark}"/>
    </linearGradient>
    <!-- Gradient vải thể thao VisionFit -->
    <linearGradient id="${prefix}-fabric" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${colors.brandLight}"/>
      <stop offset="100%" stop-color="${colors.brandGreen}"/>
    </linearGradient>
    <!-- Gradient vàng kim Champion -->
    <linearGradient id="${prefix}-gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${colors.goldLight}"/>
      <stop offset="100%" stop-color="${colors.gold}"/>
    </linearGradient>
  </defs>

  <!-- BÓNG MẶT ĐẤT: Nằm ngoài character-root -->
  <g class="layer-shadow">
    <ellipse cx="100" cy="225" rx="52" ry="11" fill="url(#${prefix}-shadow)"/>
  </g>

  <!-- GỐC NHÂN VẬT: Nhận các animation toàn thân như nhảy, bật nảy -->
  <g class="character-root">

    <!-- ĐUÔI MÈO: Gốc đuôi gắn tại (135, 195) nối vào thân -->
    <g class="layer-tail">
      <path class="part-tail" d="M 135 195 C 170 190 178 165 178 152 C 178 135 166 128 162 136 C 166 148 168 170 135 186 Z" fill="url(#${prefix}-fur)"/>
      <!-- Chóp đuôi trắng tinh nghịch -->
      <path d="M 178 152 C 178 135 166 128 162 136 C 165 146 172 150 178 152 Z" fill="${colors.furWhite}"/>
    </g>

    <!-- CHÂN & MÓNG MÈO -->
    <g class="layer-legs">
      <!-- Chân trái -->
      <g class="part-leg leg-left">
        <ellipse cx="78" cy="212" rx="15" ry="13" fill="${colors.furDark}"/>
        <ellipse cx="78" cy="214" rx="10" ry="7" fill="${colors.furWhite}"/>
      </g>
      <!-- Chân phải -->
      <g class="part-leg leg-right">
        <ellipse cx="122" cy="212" rx="15" ry="13" fill="${colors.furDark}"/>
        <ellipse cx="122" cy="214" rx="10" ry="7" fill="${colors.furWhite}"/>
      </g>
    </g>

    <!-- HỆ KHUNG THÂN (TORSO RIG): Chứa thân, vai, tay, cổ và đầu -->
    <g class="torso-rig">

      <!-- KHỐI THÂN & TRANG PHỤC: Bắt đầu từ cổ y=114 chồng lấp giải phẫu với đầu y=124 -->
      <g class="layer-body">
        <!-- Khối thân chính: bắt đầu từ cổ y=114, mở rộng sang vai y=128 và hông y=205 -->
        <path class="body-torso" d="M ${68 - torsoWidthOffset} 128 C 76 114 124 114 ${132 + torsoWidthOffset} 128 C ${148 + torsoWidthOffset} 165 ${144 + torsoWidthOffset} 198 136 206 C 100 215 100 215 64 206 C 56 198 ${52 - torsoWidthOffset} 165 ${68 - torsoWidthOffset} 128 Z" fill="url(#${prefix}-fur-body)"/>

        <!-- Yếm lông / Trang phục theo cấp tiến hóa thực tế -->
        ${isStarter ? `
          <!-- Starter: Yếm lông ngực trắng kem thon gọn -->
          <path class="body-belly" d="M 85 128 C 94 142 106 142 115 128 C 124 165 116 194 100 196 C 84 194 76 165 85 128 Z" fill="${colors.furCream}"/>
        ` : isActive ? `
          <!-- Active: Áo thể thao năng động VIF bo cong -->
          <path class="body-jersey" d="M 74 128 C 84 135 116 135 126 128 L 130 194 C 112 197 88 197 70 194 Z" fill="url(#${prefix}-fabric)"/>
          <path d="M 86 128 C 93 139 107 139 114 128" stroke="${colors.brandDark}" stroke-width="2.8" stroke-linecap="round" fill="none"/>
          <text x="100" y="165" font-size="13" font-weight="900" fill="#ffffff" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">VIF</text>
        ` : isStrong ? `
          <!-- Strong: Áo tập Speed Gym + Đai thể thao vàng kim -->
          <path class="body-jersey" d="M 72 126 C 82 134 118 134 128 126 L 133 190 C 112 194 88 194 67 190 Z" fill="url(#${prefix}-fabric)"/>
          <path d="M 85 126 C 92 138 108 138 115 126" stroke="${colors.brandDark}" stroke-width="3.2" stroke-linecap="round" fill="none"/>
          <path d="M 75 132 L 71 188" stroke="${colors.brandLight}" stroke-width="2.5" stroke-linecap="round"/>
          <path d="M 125 132 L 129 188" stroke="${colors.brandLight}" stroke-width="2.5" stroke-linecap="round"/>
          <text x="100" y="162" font-size="11" font-weight="900" fill="#ffffff" text-anchor="middle" font-family="system-ui, sans-serif">SPEED</text>
          <!-- Đai tập gọn gàng -->
          <path d="M 64 188 C 100 193 100 193 136 188 L 135 202 C 100 207 100 207 65 202 Z" fill="${colors.beltBlack}"/>
          <rect x="94" y="190" width="12" height="12" rx="2" fill="${colors.gold}"/>
        ` : `
          <!-- Champion: Giáp cơ bắp điêu khắc + Đai vô địch ngôi sao -->
          <path class="body-pecs" d="M 74 138 C 88 144 98 150 98 160 C 80 161 74 150 72 142 Z" fill="${colors.furCream}" opacity="0.92"/>
          <path class="body-pecs" d="M 126 138 C 112 144 102 150 102 160 C 120 161 126 150 128 142 Z" fill="${colors.furCream}" opacity="0.92"/>
          <!-- Múi cơ bụng thể thao -->
          <rect x="81" y="165" width="16" height="9" rx="3" fill="${colors.furCream}" opacity="0.85"/>
          <rect x="103" y="165" width="16" height="9" rx="3" fill="${colors.furCream}" opacity="0.85"/>
          <rect x="83" y="177" width="14" height="8" rx="3" fill="${colors.furCream}" opacity="0.8"/>
          <rect x="103" y="177" width="14" height="8" rx="3" fill="${colors.furCream}" opacity="0.8"/>
          <!-- Đai vô địch Champion Gold Belt -->
          <path d="M 60 190 C 100 195 100 195 140 190 L 138 205 C 100 211 100 211 62 205 Z" fill="${colors.beltBlack}"/>
          <circle cx="100" cy="198" r="9" fill="url(#${prefix}-gold)"/>
          <text x="100" y="202" font-size="8" font-weight="900" fill="#2c1e18" text-anchor="middle">★</text>
        `}
      </g>

      <!-- HUY CHƯƠNG VÔ ĐỊCH: Gắn vào torso-rig quanh cổ -->
      ${isChampion ? `
        <g class="acc-medal">
          <path d="M 86 122 L 98 148 L 100 148 L 114 122" stroke="${colors.brandGreen}" stroke-width="3" stroke-linecap="round" fill="none"/>
          <circle cx="100" cy="154" r="10.5" fill="url(#${prefix}-gold)" stroke="#d49419" stroke-width="1.5"/>
          <text x="100" y="158" font-size="9" font-weight="900" fill="#2c1e18" text-anchor="middle">V</text>
        </g>
      ` : ''}

      <!-- HỆ CÁNH TAY (ARMS RIG): Pivot vai tại (66, 132) và (134, 132) -->
      <g class="layer-arms">
        <!-- Cánh tay trái -->
        <g class="part-arm arm-left">
          <path class="arm-shape" d="M 68 130 C 48 134 ${38 - armThickness} 153 42 173 C 46 184 56 186 62 176 C 67 166 69 151 71 138 Z" fill="url(#${prefix}-fur)"/>
          <ellipse cx="46" cy="176" rx="6" ry="5" fill="${colors.furWhite}"/>
          ${isActive || isStrong || isChampion ? `
            <rect x="42" y="165" width="16" height="7" rx="2" fill="${colors.brandGreen}" transform="rotate(-15 50 168)"/>
          ` : ''}
          <!-- Tạ ấm / tạ đơn tay trái -->
          <g class="prop-dumbbell-left">
            <circle cx="36" cy="180" r="8" fill="#2d3748"/>
            <path d="M 32 172 C 34 167 38 167 40 172" stroke="#a0aec0" stroke-width="2.5" fill="none"/>
          </g>
        </g>

        <!-- Cánh tay phải -->
        <g class="part-arm arm-right">
          <path class="arm-shape" d="M 132 130 C 152 134 ${162 + armThickness} 153 158 173 C 154 184 144 186 138 176 C 133 166 131 151 129 138 Z" fill="url(#${prefix}-fur)"/>
          <ellipse cx="154" cy="176" rx="6" ry="5" fill="${colors.furWhite}"/>
          ${isActive || isStrong || isChampion ? `
            <rect x="142" y="165" width="16" height="7" rx="2" fill="${colors.brandGreen}" transform="rotate(15 150 168)"/>
          ` : ''}
          <!-- Tạ ấm / tạ đơn tay phải -->
          <g class="prop-dumbbell-right">
            <circle cx="164" cy="180" r="8" fill="#2d3748"/>
            <path d="M 160 172 C 162 167 166 167 168 172" stroke="#a0aec0" stroke-width="2.5" fill="none"/>
          </g>
        </g>
      </g>

      <!-- HỆ ĐẦU & KHUÔN MẶT (HEAD GROUP): Pivot cổ tại (100, 120), gối lên phần thân -->
      <g class="layer-head-group">
        <!-- Tai mèo nhọn lanh lợi -->
        <g class="layer-ears">
          <g class="ear-left">
            <polygon points="50,75 58,26 88,58" fill="url(#${prefix}-fur)"/>
            <polygon points="55,70 61,35 82,58" fill="${colors.earInner}"/>
          </g>
          <g class="ear-right">
            <polygon points="150,75 142,26 112,58" fill="url(#${prefix}-fur)"/>
            <polygon points="145,70 139,35 118,58" fill="${colors.earInner}"/>
          </g>
        </g>

        <!-- Khối đầu mèo bầu bĩnh -->
        <ellipse class="part-head" cx="100" cy="80" rx="52" ry="44" fill="url(#${prefix}-fur)"/>

        <!-- Băng đô thể thao VisionFit -->
        <g class="head-headband">
          <path d="M 52 64 C 75 55 125 55 148 64 L 147 75 C 125 67 75 67 53 75 Z" fill="${colors.brandGreen}"/>
          <path d="M 54 69 C 76 61 124 61 146 69" stroke="${colors.brandLight}" stroke-width="1.8" fill="none"/>
          <circle cx="100" cy="67" r="3.5" fill="#ffffff"/>
          <circle cx="100" cy="67" r="1.8" fill="${colors.brandGreen}"/>
        </g>

        <!-- Mõm mèo trắng -->
        <ellipse class="part-snout" cx="91" cy="94" rx="13" ry="10" fill="${colors.snout}"/>
        <ellipse class="part-snout" cx="109" cy="94" rx="13" ry="10" fill="${colors.snout}"/>
        <!-- Mũi mèo hồng nhỏ -->
        <polygon class="part-nose" points="96,86 104,86 100,91" fill="${colors.nose}"/>

        <!-- Râu mèo tinh nghịch -->
        <g class="layer-whiskers">
          <line x1="68" y1="91" x2="42" y2="88" stroke="${colors.whiskers}" stroke-width="1.8" stroke-linecap="round"/>
          <line x1="68" y1="96" x2="40" y2="98" stroke="${colors.whiskers}" stroke-width="1.8" stroke-linecap="round"/>
          <line x1="132" y1="91" x2="158" y2="88" stroke="${colors.whiskers}" stroke-width="1.8" stroke-linecap="round"/>
          <line x1="132" y1="96" x2="160" y2="98" stroke="${colors.whiskers}" stroke-width="1.8" stroke-linecap="round"/>
        </g>

        <!-- Mắt mèo: Mắt xanh ngọc sắc sảo, chớp mắt đồng bộ tâm -->
        <g class="layer-eyes">
          <g class="part-eye eye-left">
            <ellipse class="eye-ball" cx="80" cy="74" rx="8" ry="9.5" fill="${colors.eyes}"/>
            <ellipse cx="80.5" cy="74" rx="5" ry="8.5" fill="#0d2b1f"/>
            <circle class="eye-glint" cx="77.5" cy="70" r="3.2" fill="${colors.eyeHighlight}"/>
            <circle class="eye-glint-small" cx="82.5" cy="76" r="1.5" fill="${colors.eyeHighlight}"/>
            <path class="eye-brow" d="M 72 62 C 76 58 84 58 88 63" stroke="${colors.furDark}" stroke-width="2.8" stroke-linecap="round" fill="none"/>
          </g>
          <g class="part-eye eye-right">
            <ellipse class="eye-ball" cx="120" cy="74" rx="8" ry="9.5" fill="${colors.eyes}"/>
            <ellipse cx="119.5" cy="74" rx="5" ry="8.5" fill="#0d2b1f"/>
            <circle class="eye-glint" cx="117.5" cy="70" r="3.2" fill="${colors.eyeHighlight}"/>
            <circle class="eye-glint-small" cx="122.5" cy="76" r="1.5" fill="${colors.eyeHighlight}"/>
            <path class="eye-brow" d="M 112 63 C 116 58 124 58 128 62" stroke="${colors.furDark}" stroke-width="2.8" stroke-linecap="round" fill="none"/>
          </g>
          <!-- Má hồng phấn -->
          <ellipse cx="68" cy="88" rx="6" ry="3.5" fill="#ff7070" opacity="0.32"/>
          <ellipse cx="132" cy="88" rx="6" ry="3.5" fill="#ff7070" opacity="0.32"/>
        </g>

        <!-- Miệng mèo -->
        <g class="layer-mouth">
          <!-- Đường miệng cười chúm chím -->
          <path class="mouth-line" d="M 92 95 C 96 99 99 99 100 95 C 101 99 104 99 108 95" stroke="${colors.nose}" stroke-width="2.2" stroke-linecap="round" fill="none"/>
          <!-- Vòm miệng mở cười nói khi greeting / speaking / celebrating -->
          <path class="mouth-open" d="M 94 95 C 94 109 106 109 106 95 Z" fill="#d14242"/>
          <path class="mouth-tongue" d="M 96 101 C 98 105 102 105 104 101 C 104 108 96 108 96 101 Z" fill="#ff8c8c"/>
        </g>

        <!-- Bong bóng suy nghĩ (Thinking state) -->
        <g class="acc-thinking-bubbles">
          <circle cx="148" cy="38" r="4" fill="#ffffff" stroke="${colors.brandGreen}" stroke-width="1.5"/>
          <circle cx="158" cy="26" r="6" fill="#ffffff" stroke="${colors.brandGreen}" stroke-width="1.5"/>
          <circle cx="174" cy="18" r="10" fill="#ffffff" stroke="${colors.brandGreen}" stroke-width="1.5"/>
          <text x="174" y="21" font-size="9" font-weight="bold" fill="${colors.brandDark}" text-anchor="middle">···</text>
        </g>
      </g>
    </g>
  </g>
</svg>
`;
}
