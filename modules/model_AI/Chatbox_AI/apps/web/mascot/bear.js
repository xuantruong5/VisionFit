/**
 * VisionFit Mascot - Bear (Gấu VIF)
 * Khỏe khoắn, vui vẻ, thân thiện.
 * Hệ thống SVG tách lớp theo chuẩn semantic cho 4 cấp độ ngoại hình:
 * starter, active, strong, champion.
 */

export function renderBearSVG(stage = 'starter', state = 'idle') {
  // Bảng màu chuẩn thương hiệu VisionFit cho Gấu
  const colors = {
    furMain: '#96633b',
    furDark: '#754b29',
    furLight: '#c48f60',
    furBelly: '#f5d5b0',
    earInner: '#f3b090',
    snout: '#fae3cb',
    nose: '#2c1e18',
    eyes: '#1e140f',
    eyeHighlight: '#ffffff',
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

  // Điều chỉnh cơ bắp và tỷ lệ theo cấp độ
  const bodyWidth = isChampion ? 94 : isStrong ? 88 : isActive ? 82 : 76;
  const armWidth = isChampion ? 26 : isStrong ? 24 : 18;

  return `
<svg class="vif-mascot-svg species-bear stage-${stage} state-${state}" viewBox="0 0 200 240" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Linh vật Gấu VisionFit cấp độ ${stage} trạng thái ${state}">
  <defs>
    <!-- Đổ bóng mặt đất -->
    <radialGradient id="bear-shadow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#000" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0"/>
    </radialGradient>
    <!-- Gradient lông gấu -->
    <linearGradient id="bear-fur" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${colors.furLight}"/>
      <stop offset="100%" stop-color="${colors.furMain}"/>
    </linearGradient>
    <linearGradient id="bear-fur-body" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${colors.furLight}"/>
      <stop offset="100%" stop-color="${colors.furDark}"/>
    </linearGradient>
    <!-- Gradient trang phục VisionFit -->
    <linearGradient id="vif-fabric" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${colors.brandLight}"/>
      <stop offset="100%" stop-color="${colors.brandGreen}"/>
    </linearGradient>
    <!-- Huy chương vàng Champion -->
    <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${colors.goldLight}"/>
      <stop offset="100%" stop-color="${colors.gold}"/>
    </linearGradient>
  </defs>

  <!-- Lớp 1: Đổ bóng dưới chân -->
  <g class="layer-shadow">
    <ellipse cx="100" cy="224" rx="55" ry="12" fill="url(#bear-shadow)"/>
  </g>

  <!-- Lớp 2: Chân trái & Chân phải -->
  <g class="layer-legs">
    <!-- Chân trái -->
    <g class="part-leg leg-left">
      <ellipse cx="78" cy="210" rx="16" ry="14" fill="${colors.furDark}"/>
      <ellipse cx="77" cy="212" rx="11" ry="8" fill="${colors.furBelly}"/>
    </g>
    <!-- Chân phải -->
    <g class="part-leg leg-right">
      <ellipse cx="122" cy="210" rx="16" ry="14" fill="${colors.furDark}"/>
      <ellipse cx="123" cy="212" rx="11" ry="8" fill="${colors.furBelly}"/>
    </g>
  </g>

  <!-- Lớp 3: Thân & Cơ bắp/Bụng -->
  <g class="layer-body">
    <!-- Khối thân chính -->
    <path class="body-torso" d="M 64 125 Q 50 170 60 205 Q 100 215 140 205 Q 150 170 136 125 Z" fill="url(#bear-fur-body)"/>

    <!-- Cơ bụng / đốm bụng sáng -->
    ${isStarter ? `
      <ellipse class="body-belly" cx="100" cy="168" rx="28" ry="32" fill="${colors.furBelly}"/>
    ` : isActive ? `
      <!-- Áo ba lỗ thể thao Active -->
      <path class="body-jersey" d="M 70 130 L 130 130 L 134 195 L 66 195 Z" fill="url(#vif-fabric)" rx="6"/>
      <path d="M 85 130 Q 100 145 115 130" stroke="${colors.brandDark}" stroke-width="3" fill="none"/>
      <text x="100" y="165" font-size="14" font-weight="900" fill="#ffffff" text-anchor="middle" font-family="system-ui, sans-serif">VIF</text>
    ` : isStrong ? `
      <!-- Áo tập Pro Fit + Cơ bắp Strong -->
      <path class="body-jersey" d="M 68 128 L 132 128 L 136 190 L 64 190 Z" fill="url(#vif-fabric)"/>
      <path d="M 82 128 Q 100 146 118 128" stroke="${colors.brandDark}" stroke-width="4" fill="none"/>
      <!-- Sọc thể thao sườn áo -->
      <line x1="72" y1="135" x2="68" y2="188" stroke="${colors.brandLight}" stroke-width="3"/>
      <line x1="128" y1="135" x2="132" y2="188" stroke="${colors.brandLight}" stroke-width="3"/>
      <text x="100" y="162" font-size="13" font-weight="900" fill="#ffffff" text-anchor="middle" font-family="system-ui">PRO</text>
      <!-- Đai lưng nâng tạ -->
      <rect x="62" y="188" width="76" height="15" rx="3" fill="${colors.beltBlack}"/>
      <rect x="94" y="189" width="12" height="13" rx="2" fill="${colors.gold}"/>
    ` : `
      <!-- Champion: Cơ bắp 6 múi cách điệu + Đai vô địch VIF -->
      <path class="body-torso-champion" d="M 62 125 Q 46 168 58 205 Q 100 216 142 205 Q 154 168 138 125 Z" fill="url(#bear-fur-body)"/>
      <path class="body-pecs" d="M 72 138 Q 100 148 100 162 Q 72 162 70 142 Z" fill="${colors.furBelly}" opacity="0.9"/>
      <path class="body-pecs" d="M 128 138 Q 100 148 100 162 Q 128 162 130 142 Z" fill="${colors.furBelly}" opacity="0.9"/>
      <!-- Múi bụng cách điệu -->
      <rect x="80" y="166" width="18" height="10" rx="3" fill="${colors.furBelly}" opacity="0.85"/>
      <rect x="102" y="166" width="18" height="10" rx="3" fill="${colors.furBelly}" opacity="0.85"/>
      <rect x="82" y="179" width="16" height="9" rx="3" fill="${colors.furBelly}" opacity="0.8"/>
      <rect x="102" y="179" width="16" height="9" rx="3" fill="${colors.furBelly}" opacity="0.8"/>
      <!-- Đai vô địch Champion Gold Belt -->
      <path d="M 58 190 Q 100 196 142 190 L 140 206 Q 100 212 60 206 Z" fill="${colors.beltBlack}"/>
      <circle cx="100" cy="198" r="10" fill="url(#gold-grad)"/>
      <text x="100" y="202" font-size="9" font-weight="900" fill="#2c1e18" text-anchor="middle">★</text>
    `}
  </g>

  <!-- Lớp 4: Cánh tay & Dụng cụ tập luyện -->
  <g class="layer-arms">
    <!-- Cánh tay trái -->
    <g class="part-arm arm-left">
      <path class="arm-shape" d="M 65 132 C 45 135 32 155 36 175 C 40 188 54 190 60 178 C 65 168 68 152 70 138 Z" fill="url(#bear-fur)"/>
      <!-- Băng quấn tay nếu active/strong/champion -->
      ${isActive || isStrong || isChampion ? `
        <rect x="36" y="166" width="18" height="8" rx="2" fill="${colors.brandGreen}" transform="rotate(-15 45 170)"/>
      ` : ''}
      <!-- Tạ đơn tay trái khi training -->
      <g class="prop-dumbbell-left">
        <rect x="24" y="170" width="8" height="16" rx="2" fill="#333"/>
        <rect x="42" y="170" width="8" height="16" rx="2" fill="#333"/>
        <rect x="28" y="176" width="18" height="4" fill="#aaa"/>
      </g>
    </g>

    <!-- Cánh tay phải -->
    <g class="part-arm arm-right">
      <path class="arm-shape" d="M 135 132 C 155 135 168 155 164 175 C 160 188 146 190 140 178 C 135 168 132 152 130 138 Z" fill="url(#bear-fur)"/>
      <!-- Băng quấn tay -->
      ${isActive || isStrong || isChampion ? `
        <rect x="146" y="166" width="18" height="8" rx="2" fill="${colors.brandGreen}" transform="rotate(15 155 170)"/>
      ` : ''}
      <!-- Tạ đơn tay phải khi training -->
      <g class="prop-dumbbell-right">
        <rect x="150" y="170" width="8" height="16" rx="2" fill="#333"/>
        <rect x="168" y="170" width="8" height="16" rx="2" fill="#333"/>
        <rect x="154" y="176" width="18" height="4" fill="#aaa"/>
      </g>
    </g>
  </g>

  <!-- Lớp 5: Đầu, Tai, Mặt & Biểu cảm -->
  <g class="layer-head-group">
    <!-- Hai tai -->
    <g class="layer-ears">
      <!-- Tai trái -->
      <g class="ear-left">
        <circle cx="56" cy="46" r="22" fill="url(#bear-fur)"/>
        <circle cx="56" cy="46" r="14" fill="${colors.earInner}"/>
      </g>
      <!-- Tai phải -->
      <g class="ear-right">
        <circle cx="144" cy="46" r="22" fill="url(#bear-fur)"/>
        <circle cx="144" cy="46" r="14" fill="${colors.earInner}"/>
      </g>
    </g>

    <!-- Khối đầu gấu tròn thân thiện -->
    <ellipse class="part-head" cx="100" cy="80" rx="54" ry="48" fill="url(#bear-fur)"/>

    <!-- Lớp phụ kiện đầu: Băng đô trán VisionFit -->
    <g class="head-headband">
      <path d="M 48 65 Q 100 55 152 65 L 151 77 Q 100 68 49 77 Z" fill="${colors.brandGreen}"/>
      <!-- Điểm nhấn sọc hoặc logo trên băng đô -->
      <line x1="50" y1="71" x2="150" y2="71" stroke="${colors.brandLight}" stroke-width="2"/>
      <circle cx="100" cy="68" r="4" fill="#ffffff"/>
      <circle cx="100" cy="68" r="2" fill="${colors.brandGreen}"/>
    </g>

    <!-- Mõm gấu -->
    <ellipse class="part-snout" cx="100" cy="94" rx="25" ry="19" fill="${colors.snout}"/>

    <!-- Mũi gấu -->
    <path class="part-nose" d="M 94 85 Q 100 81 106 85 Q 107 92 100 95 Q 93 92 94 85 Z" fill="${colors.nose}"/>
    <ellipse cx="98" cy="86" rx="2" ry="1.2" fill="#ffffff" opacity="0.7"/>

    <!-- Mắt gấu (hỗ trợ chớp mắt / biểu cảm) -->
    <g class="layer-eyes">
      <!-- Mắt trái -->
      <g class="eye-left">
        <ellipse class="eye-ball" cx="80" cy="74" rx="7.5" ry="9" fill="${colors.eyes}"/>
        <circle class="eye-glint" cx="77.5" cy="71" r="3" fill="${colors.eyeHighlight}"/>
        <circle class="eye-glint-small" cx="81.5" cy="76" r="1.5" fill="${colors.eyeHighlight}"/>
        <path class="eye-brow" d="M 72 63 Q 80 60 88 64" stroke="${colors.furDark}" stroke-width="3" stroke-linecap="round" fill="none"/>
      </g>
      <!-- Mắt phải -->
      <g class="eye-right">
        <ellipse class="eye-ball" cx="120" cy="74" rx="7.5" ry="9" fill="${colors.eyes}"/>
        <circle class="eye-glint" cx="117.5" cy="71" r="3" fill="${colors.eyeHighlight}"/>
        <circle class="eye-glint-small" cx="121.5" cy="76" r="1.5" fill="${colors.eyeHighlight}"/>
        <path class="eye-brow" d="M 112 64 Q 120 60 128 63" stroke="${colors.furDark}" stroke-width="3" stroke-linecap="round" fill="none"/>
      </g>
      <!-- Má hồng thể thao -->
      <ellipse cx="68" cy="86" rx="7" ry="4" fill="#ff7070" opacity="0.3"/>
      <ellipse cx="132" cy="86" rx="7" ry="4" fill="#ff7070" opacity="0.3"/>
    </g>

    <!-- Miệng gấu -->
    <g class="layer-mouth">
      <!-- Miệng chuẩn tươi cười -->
      <path class="mouth-line" d="M 93 98 Q 100 105 107 98" stroke="${colors.nose}" stroke-width="2.5" stroke-linecap="round" fill="none"/>
      <!-- Vòm cười hé răng vui mừng khi greeting/celebrating -->
      <path class="mouth-open" d="M 92 98 Q 100 114 108 98 Z" fill="#d14242"/>
      <path class="mouth-tongue" d="M 95 104 Q 100 108 105 104 Q 100 114 95 104 Z" fill="#ff8c8c"/>
    </g>

    <!-- Phụ kiện bổ sung cho Champion: Huy chương vàng VisionFit -->
    ${isChampion ? `
      <g class="acc-medal">
        <path d="M 85 124 L 97 146 L 100 146 L 115 124" stroke="${colors.brandGreen}" stroke-width="3.5" fill="none"/>
        <circle cx="100" cy="154" r="12" fill="url(#gold-grad)" stroke="#d49419" stroke-width="1.5"/>
        <text x="100" y="158" font-size="10" font-weight="900" fill="#2c1e18" text-anchor="middle">V</text>
      </g>
    ` : ''}

    <!-- Bong bóng suy nghĩ (Thinking state) -->
    <g class="acc-thinking-bubbles">
      <circle cx="148" cy="38" r="4" fill="#ffffff" stroke="${colors.brandGreen}" stroke-width="1.5"/>
      <circle cx="158" cy="26" r="6" fill="#ffffff" stroke="${colors.brandGreen}" stroke-width="1.5"/>
      <circle cx="174" cy="18" r="10" fill="#ffffff" stroke="${colors.brandGreen}" stroke-width="1.5"/>
      <text x="174" y="21" font-size="9" font-weight="bold" fill="${colors.brandDark}" text-anchor="middle">···</text>
    </g>
  </g>
</svg>
`;
}
