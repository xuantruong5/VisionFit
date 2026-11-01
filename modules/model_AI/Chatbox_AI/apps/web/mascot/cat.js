/**
 * VisionFit Mascot - Cat (Mèo VIF)
 * Nhanh nhẹn, tinh nghịch, lanh lợi.
 * Cùng một hệ thiết kế nhất quán với Gấu VIF, cấu trúc SVG tách lớp.
 * 4 cấp độ: starter, active, strong, champion.
 */

export function renderCatSVG(stage = 'starter', state = 'idle') {
  // Bảng màu cho Mèo VIF (Cam gừng ấm áp + Trắng kem năng động)
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

  return `
<svg class="vif-mascot-svg species-cat stage-${stage} state-${state}" viewBox="0 0 200 240" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Linh vật Mèo VisionFit cấp độ ${stage} trạng thái ${state}">
  <defs>
    <!-- Đổ bóng mặt đất -->
    <radialGradient id="cat-shadow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#000" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0"/>
    </radialGradient>
    <!-- Gradient lông mèo -->
    <linearGradient id="cat-fur" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${colors.furLight}"/>
      <stop offset="100%" stop-color="${colors.furMain}"/>
    </linearGradient>
    <linearGradient id="cat-fur-body" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${colors.furLight}"/>
      <stop offset="100%" stop-color="${colors.furDark}"/>
    </linearGradient>
    <!-- Gradient trang phục VisionFit -->
    <linearGradient id="cat-vif-fabric" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${colors.brandLight}"/>
      <stop offset="100%" stop-color="${colors.brandGreen}"/>
    </linearGradient>
    <!-- Huy chương Champion -->
    <linearGradient id="cat-gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${colors.goldLight}"/>
      <stop offset="100%" stop-color="${colors.gold}"/>
    </linearGradient>
  </defs>

  <!-- Lớp 1: Đổ bóng dưới chân -->
  <g class="layer-shadow">
    <ellipse cx="100" cy="224" rx="52" ry="11" fill="url(#cat-shadow)"/>
  </g>

  <!-- Lớp 1.5: Đuôi mèo ngoe nguẩy -->
  <g class="layer-tail">
    <path class="part-tail" d="M 135 195 Q 175 190 178 155 Q 180 135 168 128 Q 160 132 166 148 Q 168 172 135 185 Z" fill="url(#cat-fur)"/>
    <!-- Chóp đuôi trắng -->
    <path d="M 178 155 Q 180 135 168 128 Q 160 132 166 148 Z" fill="${colors.furWhite}"/>
  </g>

  <!-- Lớp 2: Chân trái & Chân phải -->
  <g class="layer-legs">
    <!-- Chân trái -->
    <g class="part-leg leg-left">
      <ellipse cx="79" cy="212" rx="14" ry="12" fill="${colors.furDark}"/>
      <ellipse cx="79" cy="214" rx="10" ry="7" fill="${colors.furWhite}"/>
    </g>
    <!-- Chân phải -->
    <g class="part-leg leg-right">
      <ellipse cx="121" cy="212" rx="14" ry="12" fill="${colors.furDark}"/>
      <ellipse cx="121" cy="214" rx="10" ry="7" fill="${colors.furWhite}"/>
    </g>
  </g>

  <!-- Lớp 3: Thân & Trang phục -->
  <g class="layer-body">
    <!-- Thân mèo thon gọn nhanh nhẹn -->
    <path class="body-torso" d="M 68 126 Q 54 168 64 205 Q 100 214 136 205 Q 146 168 132 126 Z" fill="url(#cat-fur-body)"/>

    ${isStarter ? `
      <!-- Ngực yếm lông trắng tự nhiên -->
      <path class="body-belly" d="M 85 128 Q 100 145 115 128 Q 125 170 100 195 Q 75 170 85 128 Z" fill="${colors.furCream}"/>
    ` : isActive ? `
      <!-- Áo thể thao năng động VIF -->
      <path class="body-jersey" d="M 72 130 L 128 130 L 132 195 L 68 195 Z" fill="url(#cat-vif-fabric)" rx="6"/>
      <path d="M 86 130 Q 100 144 114 130" stroke="${colors.brandDark}" stroke-width="3" fill="none"/>
      <text x="100" y="165" font-size="13" font-weight="900" fill="#ffffff" text-anchor="middle" font-family="system-ui">VIF</text>
    ` : isStrong ? `
      <!-- Trang phục Pro Gym cho mèo -->
      <path class="body-jersey" d="M 70 128 L 130 128 L 134 190 L 66 190 Z" fill="url(#cat-vif-fabric)"/>
      <path d="M 84 128 Q 100 145 116 128" stroke="${colors.brandDark}" stroke-width="3.5" fill="none"/>
      <!-- Sọc thể thao -->
      <line x1="74" y1="135" x2="70" y2="188" stroke="${colors.brandLight}" stroke-width="3"/>
      <line x1="126" y1="135" x2="130" y2="188" stroke="${colors.brandLight}" stroke-width="3"/>
      <text x="100" y="162" font-size="12" font-weight="900" fill="#ffffff" text-anchor="middle" font-family="system-ui">SPEED</text>
      <!-- Đai tập thon gọn -->
      <rect x="64" y="188" width="72" height="14" rx="3" fill="${colors.beltBlack}"/>
      <rect x="94" y="189" width="12" height="12" rx="2" fill="${colors.gold}"/>
    ` : `
      <!-- Champion: Bộ giáp thể thao vô địch + Vòng hào quang -->
      <path class="body-torso-champion" d="M 66 126 Q 52 168 62 205 Q 100 215 138 205 Q 148 168 134 126 Z" fill="url(#cat-fur-body)"/>
      <path class="body-pecs" d="M 75 138 Q 100 148 100 160 Q 75 160 74 142 Z" fill="${colors.furCream}" opacity="0.9"/>
      <path class="body-pecs" d="M 125 138 Q 100 148 100 160 Q 125 160 126 142 Z" fill="${colors.furCream}" opacity="0.9"/>
      <rect x="82" y="165" width="16" height="9" rx="3" fill="${colors.furCream}" opacity="0.85"/>
      <rect x="102" y="165" width="16" height="9" rx="3" fill="${colors.furCream}" opacity="0.85"/>
      <rect x="84" y="177" width="14" height="8" rx="3" fill="${colors.furCream}" opacity="0.8"/>
      <rect x="102" y="177" width="14" height="8" rx="3" fill="${colors.furCream}" opacity="0.8"/>
      <!-- Đai vô địch Champion Gold Belt -->
      <path d="M 60 190 Q 100 195 140 190 L 138 205 Q 100 211 62 205 Z" fill="${colors.beltBlack}"/>
      <circle cx="100" cy="198" r="9" fill="url(#cat-gold-grad)"/>
      <text x="100" y="202" font-size="8" font-weight="900" fill="#2c1e18" text-anchor="middle">★</text>
    `}
  </g>

  <!-- Lớp 4: Cánh tay & Dụng cụ thể thao -->
  <g class="layer-arms">
    <!-- Cánh tay trái -->
    <g class="part-arm arm-left">
      <path class="arm-shape" d="M 68 132 C 50 135 38 154 42 173 C 46 185 58 187 63 176 C 68 166 70 152 72 138 Z" fill="url(#cat-fur)"/>
      <ellipse cx="46" cy="176" rx="6" ry="5" fill="${colors.furWhite}"/>
      ${isActive || isStrong || isChampion ? `
        <rect x="42" y="165" width="16" height="7" rx="2" fill="${colors.brandGreen}" transform="rotate(-15 50 168)"/>
      ` : ''}
      <!-- Tạ ấm / tạ đơn tay trái -->
      <g class="prop-dumbbell-left">
        <circle cx="36" cy="180" r="8" fill="#333"/>
        <path d="M 32 172 Q 36 166 40 172" stroke="#aaa" stroke-width="2.5" fill="none"/>
      </g>
    </g>

    <!-- Cánh tay phải -->
    <g class="part-arm arm-right">
      <path class="arm-shape" d="M 132 132 C 150 135 162 154 158 173 C 154 185 142 187 137 176 C 132 166 130 152 128 138 Z" fill="url(#cat-fur)"/>
      <ellipse cx="154" cy="176" rx="6" ry="5" fill="${colors.furWhite}"/>
      ${isActive || isStrong || isChampion ? `
        <rect x="142" y="165" width="16" height="7" rx="2" fill="${colors.brandGreen}" transform="rotate(15 150 168)"/>
      ` : ''}
      <!-- Tạ ấm / tạ đơn tay phải -->
      <g class="prop-dumbbell-right">
        <circle cx="164" cy="180" r="8" fill="#333"/>
        <path d="M 160 172 Q 164 166 168 172" stroke="#aaa" stroke-width="2.5" fill="none"/>
      </g>
    </g>
  </g>

  <!-- Lớp 5: Đầu, Tai, Mặt & Biểu cảm Mèo -->
  <g class="layer-head-group">
    <!-- Hai tai mèo nhọn tinh nghịch -->
    <g class="layer-ears">
      <!-- Tai trái -->
      <g class="ear-left">
        <polygon points="50,75 58,26 88,58" fill="url(#cat-fur)"/>
        <polygon points="55,70 61,35 82,58" fill="${colors.earInner}"/>
      </g>
      <!-- Tai phải -->
      <g class="ear-right">
        <polygon points="150,75 142,26 112,58" fill="url(#cat-fur)"/>
        <polygon points="145,70 139,35 118,58" fill="${colors.earInner}"/>
      </g>
    </g>

    <!-- Khối đầu mèo bầu bĩnh đáng yêu -->
    <ellipse class="part-head" cx="100" cy="80" rx="52" ry="46" fill="url(#cat-fur)"/>

    <!-- Băng đô trán VisionFit -->
    <g class="head-headband">
      <path d="M 52 64 Q 100 55 148 64 L 147 75 Q 100 67 53 75 Z" fill="${colors.brandGreen}"/>
      <line x1="54" y1="69" x2="146" y2="69" stroke="${colors.brandLight}" stroke-width="1.8"/>
      <circle cx="100" cy="67" r="3.5" fill="#ffffff"/>
      <circle cx="100" cy="67" r="1.8" fill="${colors.brandGreen}"/>
    </g>

    <!-- Mõm mèo trắng -->
    <ellipse class="part-snout" cx="90" cy="94" rx="14" ry="11" fill="${colors.snout}"/>
    <ellipse class="part-snout" cx="110" cy="94" rx="14" ry="11" fill="${colors.snout}"/>

    <!-- Mũi mèo hồng hình tam giác bo tròn -->
    <polygon class="part-nose" points="95,86 105,86 100,92" fill="${colors.nose}"/>

    <!-- Ria mép mèo linh hoạt -->
    <g class="layer-whiskers">
      <line x1="68" y1="91" x2="42" y2="88" stroke="${colors.whiskers}" stroke-width="1.8" stroke-linecap="round"/>
      <line x1="68" y1="96" x2="40" y2="98" stroke="${colors.whiskers}" stroke-width="1.8" stroke-linecap="round"/>
      <line x1="132" y1="91" x2="158" y2="88" stroke="${colors.whiskers}" stroke-width="1.8" stroke-linecap="round"/>
      <line x1="132" y1="96" x2="160" y2="98" stroke="${colors.whiskers}" stroke-width="1.8" stroke-linecap="round"/>
    </g>

    <!-- Mắt mèo to tròn lanh lợi -->
    <g class="layer-eyes">
      <!-- Mắt trái -->
      <g class="eye-left">
        <ellipse class="eye-ball" cx="80" cy="74" rx="8" ry="9.5" fill="${colors.eyes}"/>
        <!-- Đồng tử mèo có chiều sâu -->
        <ellipse cx="80.5" cy="74" rx="5" ry="8.5" fill="#0d2b1f"/>
        <circle class="eye-glint" cx="77.5" cy="70" r="3.2" fill="${colors.eyeHighlight}"/>
        <circle class="eye-glint-small" cx="82.5" cy="76" r="1.5" fill="${colors.eyeHighlight}"/>
        <path class="eye-brow" d="M 72 62 Q 80 58 88 63" stroke="${colors.furDark}" stroke-width="2.8" stroke-linecap="round" fill="none"/>
      </g>
      <!-- Mắt phải -->
      <g class="eye-right">
        <ellipse class="eye-ball" cx="120" cy="74" rx="8" ry="9.5" fill="${colors.eyes}"/>
        <ellipse cx="119.5" cy="74" rx="5" ry="8.5" fill="#0d2b1f"/>
        <circle class="eye-glint" cx="117.5" cy="70" r="3.2" fill="${colors.eyeHighlight}"/>
        <circle class="eye-glint-small" cx="122.5" cy="76" r="1.5" fill="${colors.eyeHighlight}"/>
        <path class="eye-brow" d="M 112 63 Q 120 58 128 62" stroke="${colors.furDark}" stroke-width="2.8" stroke-linecap="round" fill="none"/>
      </g>
      <!-- Má hồng nhẹ -->
      <ellipse cx="68" cy="88" rx="6" ry="3.5" fill="#ff7070" opacity="0.32"/>
      <ellipse cx="132" cy="88" rx="6" ry="3.5" fill="#ff7070" opacity="0.32"/>
    </g>

    <!-- Miệng mèo hình chữ W -->
    <g class="layer-mouth">
      <path class="mouth-line" d="M 92 95 Q 100 101 100 95 Q 100 101 108 95" stroke="${colors.nose}" stroke-width="2.2" stroke-linecap="round" fill="none"/>
      <path class="mouth-open" d="M 94 96 Q 100 110 106 96 Z" fill="#d14242"/>
      <path class="mouth-tongue" d="M 96 102 Q 100 106 104 102 Q 100 110 96 102 Z" fill="#ff8c8c"/>
    </g>

    <!-- Huy chương Champion cho mèo -->
    ${isChampion ? `
      <g class="acc-medal">
        <path d="M 86 124 L 97 146 L 100 146 L 114 124" stroke="${colors.brandGreen}" stroke-width="3" fill="none"/>
        <circle cx="100" cy="154" r="11" fill="url(#cat-gold-grad)" stroke="#d49419" stroke-width="1.5"/>
        <text x="100" y="158" font-size="9" font-weight="900" fill="#2c1e18" text-anchor="middle">V</text>
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
