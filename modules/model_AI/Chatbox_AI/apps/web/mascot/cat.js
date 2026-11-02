/**
 * VisionFit Mascot - Cat (Mèo VIF)
 * Kawaii style: nhanh nhẹn, tinh nghịch, mắt nhỏ dễ thương, headband mỏng trên trán.
 * Hệ thống phân cấp khớp động học với cẳng tay (forearm) gập khuỷu tự nhiên.
 * Màu lông cam gừng nền phẳng đồng nhất, vân tabby nhẹ trên trán.
 */

import { MASCOT_IMAGES } from './mascotImages.js';

export function renderCatSVG(stage = 'starter', state = 'idle', options = {}) {
  const prefix = options.idPrefix || ('vif-c-' + Math.random().toString(36).slice(2, 8));
  const imgSrc = (typeof MASCOT_IMAGES !== 'undefined' && MASCOT_IMAGES[`cat_${stage}`]) || `/mascot/assets/cat_${stage}.png`;

  // Bảng màu chuẩn theo yêu cầu thiết kế VisionFit cho Mèo VIF
  const colors = {
    furMain: '#ED9859',    // Lông cam gừng đồng nhất toàn thân (đầu, cổ, vai, tay, chân, đuôi)
    furDark: '#C25816',    // Nét viền chi tiết, vân tabby, bóng nhẹ
    furBelly: '#FFF4DF',   // Yếm ngực & bụng kem sáng mềm mại
    furWhite: '#FFF4DF',   // Chóp đuôi & mõm trắng kem
    earInner: '#FFAFAF',   // Lòng tai hồng đào
    snout: '#FFF4DF',      // Mõm mèo
    nose: '#FF6B81',       // Mũi tam giác hồng nhỏ xinh
    eyes: '#2A1810',       // Mắt hạt nhãn đen láy kawaii
    eyeHighlight: '#FFFFFF',
    whiskers: '#A95231',   // Râu mèo nâu ấm
    blush: '#FF758F',      // Má hồng phấn
    brandGreen: '#198D69', // Xanh thể thao VisionFit
    brandDark: '#0F6F52',
    brandLight: '#73DFAC',
    gold: '#F5C65C',       // Vàng thành tựu / Đai vô địch
    goldLight: '#FFE899',
    beltBlack: '#21262D'
  };

  const isStarter = stage === 'starter';
  const isActive = stage === 'active';
  const isStrong = stage === 'strong';
  const isChampion = stage === 'champion';

  // Điều chỉnh tỷ lệ vóc dáng theo cấp độ
  const shoulderOffset = isChampion ? 5 : isStrong ? 3 : isActive ? 1 : 0;
  const torsoWidth = isChampion ? 4 : isStrong ? 2.5 : isActive ? 1 : 0;

  return `
<svg class="vif-mascot-svg species-cat stage-${stage} state-${state}" viewBox="0 0 200 240" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Linh vật Mèo VisionFit cấp độ ${stage} trạng thái ${state}" data-species="cat" data-stage="${stage}" data-state="${state}">
  <defs>
    <!-- Đổ bóng mặt đất độc lập theo instance -->
    <radialGradient id="${prefix}-shadow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#0F2D1F" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="#0F2D1F" stop-opacity="0"/>
    </radialGradient>
    <!-- Vàng kim cho đai & huy chương Champion -->
    <linearGradient id="${prefix}-gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${colors.goldLight}"/>
      <stop offset="100%" stop-color="${colors.gold}"/>
    </linearGradient>
    <!-- Clip-paths tách các phần chi để cử động tay chân tự nhiên theo mẫu ảnh 3 -->
    <clipPath id="${prefix}-clip-head">
      <rect x="0" y="0" width="200" height="118"/>
    </clipPath>
    <clipPath id="${prefix}-clip-body">
      <rect x="44" y="114" width="112" height="80"/>
    </clipPath>
    <clipPath id="${prefix}-clip-arm-l">
      <rect x="0" y="114" width="68" height="92"/>
    </clipPath>
    <clipPath id="${prefix}-clip-arm-r">
      <rect x="132" y="114" width="68" height="92"/>
    </clipPath>
    <clipPath id="${prefix}-clip-leg-l">
      <rect x="16" y="188" width="84" height="52"/>
    </clipPath>
    <clipPath id="${prefix}-clip-leg-r">
      <rect x="100" y="188" width="84" height="52"/>
    </clipPath>
    <clipPath id="${prefix}-clip-tail">
      <rect x="134" y="125" width="66" height="85"/>
    </clipPath>
    <!-- Vải thể thao VisionFit -->
    <linearGradient id="${prefix}-fabric" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${colors.brandLight}"/>
      <stop offset="100%" stop-color="${colors.brandGreen}"/>
    </linearGradient>
  </defs>

  <!-- BÓNG MẶT ĐẤT: Nằm ngoài character-root -->
  <g class="layer-shadow">
    <ellipse cx="100" cy="225" rx="52" ry="11" fill="url(#${prefix}-shadow)"/>
  </g>

  <!-- GỐC NHÂN VẬT: Nhận các animation toàn thân (nhảy, tiếp đất) -->
  <g class="character-root">

    <!-- ĐUÔI MÈO: Gốc đuôi nối liền vào hông (135, 195) -->
    <g class="layer-tail">
      <path class="part-tail" d="M 135 195 C 168 190 178 165 178 152 C 178 135 166 128 162 136 C 166 148 168 170 135 186 Z" fill="${colors.furMain}"/>
      <!-- Chóp đuôi trắng kem tinh nghịch -->
      <path d="M 178 152 C 178 135 166 128 162 136 C 165 146 172 150 178 152 Z" fill="${colors.furWhite}"/>
      <!-- Đuôi mèo nguyên bản từ artwork chuẩn ảnh 3 -->
      <image class="mascot-part-tail" href="${imgSrc}" x="12" y="10" width="176" height="216" clip-path="url(#${prefix}-clip-tail)" preserveAspectRatio="xMidYMid meet"/>
    </g>

    <!-- CHÂN & BÀN CHÂN: Cùng màu lông cam nền, liền khối với hông -->
    <g class="layer-legs">
      <!-- Chân trái -->
      <g class="part-leg leg-left">
        <path d="M 66 195 C 66 195 64 216 77 216 C 89 216 88 197 88 197 Z" fill="${colors.furMain}"/>
        <!-- Bàn chân trái bo tròn mềm mại -->
        <ellipse cx="77" cy="214" rx="13.5" ry="8.5" fill="${colors.furMain}"/>
        <!-- Ngón chân nhỏ -->
        <path d="M 73 216 L 73 219 M 77 216 L 77 220 M 81 216 L 81 219" stroke="${colors.furDark}" stroke-width="1.3" stroke-linecap="round"/>
        <image class="mascot-part-leg-l" href="${imgSrc}" x="12" y="10" width="176" height="216" clip-path="url(#${prefix}-clip-leg-l)" preserveAspectRatio="xMidYMid meet"/>
      </g>

      <!-- Chân phải -->
      <g class="part-leg leg-right">
        <path d="M 112 197 C 112 197 111 216 123 216 C 136 216 134 195 134 195 Z" fill="${colors.furMain}"/>
        <!-- Bàn chân phải -->
        <ellipse cx="123" cy="214" rx="13.5" ry="8.5" fill="${colors.furMain}"/>
        <!-- Ngón chân nhỏ -->
        <path d="M 119 216 L 119 219 M 123 216 L 123 220 M 127 216 L 127 219" stroke="${colors.furDark}" stroke-width="1.3" stroke-linecap="round"/>
        <image class="mascot-part-leg-r" href="${imgSrc}" x="12" y="10" width="176" height="216" clip-path="url(#${prefix}-clip-leg-r)" preserveAspectRatio="xMidYMid meet"/>
      </g>
    </g>

    <!-- HỆ KHUNG THÂN (TORSO RIG): Chứa thân, vai, tay, cổ và đầu -->
    <g class="torso-rig">

      <!-- KHỐI THÂN & CỔ CHỒNG LẤP -->
      <g class="layer-body">
        <!-- Khối thân chính: Màu lông đồng nhất, bo cong mềm mại thon gọn -->
        <path class="body-torso" d="M ${66 - shoulderOffset} 126 C 74 108 126 108 ${134 + shoulderOffset} 126 C ${148 + torsoWidth} 165 ${144 + torsoWidth} 198 136 206 C 100 214 100 214 64 206 C 56 198 ${52 - torsoWidth} 165 ${66 - shoulderOffset} 126 Z" fill="${colors.furMain}"/>

        <!-- Vùng cổ mềm gối sâu dưới cằm -->
        <path class="body-neck" d="M 78 124 C 88 114 112 114 122 124 Z" fill="${colors.furMain}"/>

        <!-- Yếm ngực / Trang phục thể thao theo cấp tiến hóa -->
        ${isStarter ? `
          <!-- Starter: Yếm lông ngực trắng kem thon gọn -->
          <path class="body-belly" d="M 85 126 C 94 140 106 140 115 126 C 124 165 116 194 100 196 C 84 194 76 165 85 126 Z" fill="${colors.furBelly}"/>
        ` : isActive ? `
          <!-- Active: Áo thể thao năng động VIF bo cong -->
          <path class="body-jersey" d="M 74 126 C 84 133 116 133 126 126 L 130 194 C 112 197 88 197 70 194 Z" fill="url(#${prefix}-fabric)"/>
          <path d="M 86 126 C 93 138 107 138 114 126" stroke="${colors.brandDark}" stroke-width="2.5" stroke-linecap="round" fill="none"/>
          <text x="100" y="165" font-size="13" font-weight="900" fill="#FFFFFF" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">VIF</text>
        ` : isStrong ? `
          <!-- Strong: Áo tập Speed Gym + Đai tập thể thao -->
          <path class="body-jersey" d="M 72 125 C 82 132 118 132 128 125 L 133 190 C 112 194 88 194 67 190 Z" fill="url(#${prefix}-fabric)"/>
          <path d="M 85 125 C 92 136 108 136 115 125" stroke="${colors.brandDark}" stroke-width="2.8" stroke-linecap="round" fill="none"/>
          <path d="M 75 132 L 71 188" stroke="${colors.brandLight}" stroke-width="2" stroke-linecap="round"/>
          <path d="M 125 132 L 129 188" stroke="${colors.brandLight}" stroke-width="2" stroke-linecap="round"/>
          <text x="100" y="162" font-size="11" font-weight="900" fill="#FFFFFF" text-anchor="middle" font-family="system-ui, sans-serif">SPEED</text>
          <!-- Đai tập gọn gàng -->
          <path d="M 64 188 C 100 193 100 193 136 188 L 135 202 C 100 207 100 207 65 202 Z" fill="${colors.beltBlack}"/>
          <rect x="94" y="190" width="12" height="12" rx="2" fill="${colors.gold}"/>
        ` : `
          <!-- Champion: Giáp cơ bắp điêu khắc + Đai vô địch ngôi sao -->
          <path class="body-pecs" d="M 74 138 C 88 143 98 150 98 160 C 80 161 74 150 72 141 Z" fill="${colors.furBelly}" opacity="0.9"/>
          <path class="body-pecs" d="M 126 138 C 112 143 102 150 102 160 C 120 161 126 150 128 141 Z" fill="${colors.furBelly}" opacity="0.9"/>
          <!-- Múi cơ bụng thể thao -->
          <rect x="81" y="165" width="16" height="9" rx="3" fill="${colors.furBelly}" opacity="0.85"/>
          <rect x="103" y="165" width="16" height="9" rx="3" fill="${colors.furBelly}" opacity="0.85"/>
          <rect x="83" y="177" width="14" height="8" rx="3" fill="${colors.furBelly}" opacity="0.8"/>
          <rect x="103" y="177" width="14" height="8" rx="3" fill="${colors.furBelly}" opacity="0.8"/>
          <!-- Đai vô địch Champion Gold Belt -->
          <path d="M 60 190 C 100 195 100 195 140 190 L 138 205 C 100 211 100 211 62 205 Z" fill="${colors.beltBlack}"/>
          <circle cx="100" cy="198" r="9" fill="url(#${prefix}-gold)"/>
          <text x="100" y="202" font-size="8" font-weight="900" fill="#2C1E18" text-anchor="middle">★</text>
        `}

        <!-- Thân hình nguyên bản từ artwork chuẩn ảnh 3 -->
        <image class="mascot-part-body" href="${imgSrc}" x="12" y="14" width="176" height="212" clip-path="url(#${prefix}-clip-body)" preserveAspectRatio="xMidYMid meet"/>
      </g>

      <!-- HUY CHƯƠNG VÔ ĐỊCH: Gắn vào torso-rig quanh cổ -->
      ${isChampion ? `
        <g class="acc-medal">
          <path d="M 86 122 L 98 146 L 100 146 L 114 122" stroke="${colors.brandGreen}" stroke-width="3" stroke-linecap="round" fill="none"/>
          <circle cx="100" cy="153" r="10.5" fill="url(#${prefix}-gold)" stroke="#D49419" stroke-width="1.5"/>
          <text x="100" y="157" font-size="9" font-weight="900" fill="#2C1E18" text-anchor="middle">V</text>
        </g>
      ` : ''}

      <!-- HỆ CÁNH TAY 2 ĐOẠN (BẮP TAY + CẲNG TAY GẬP KHUỶU): Nằm trước thân -->
      <g class="layer-arms">
        <!-- Cánh tay trái: Pivot vai tại (66, 126) -->
        <g class="part-arm arm-left">
          <!-- Bắp tay trên (Upper Arm) -->
          <path class="upper-arm" d="M 66 126 C 56 128 48 138 50 152 C 52 156 58 156 60 150 C 64 142 68 134 68 128 Z" fill="${colors.furMain}"/>

          <!-- Cẳng tay trái (Forearm): Pivot khuỷu tại (52, 152), chứa bàn tay -->
          <g class="forearm forearm-left">
            <path class="forearm-shape" d="M 52 150 C 46 156 40 166 44 176 C 47 183 56 182 58 174 C 59 166 60 156 54 150 Z" fill="${colors.furMain}"/>
            <!-- Bàn tay mèo trắng kem xinh xắn -->
            <ellipse class="paw paw-left" cx="46" cy="176" rx="7" ry="6" fill="${colors.furWhite}"/>
            <path d="M 43 176 L 43 179 M 46 177 L 46 180 M 49 176 L 49 179" stroke="${colors.furDark}" stroke-width="1.1" stroke-linecap="round"/>

            ${isActive || isStrong || isChampion ? `
              <rect x="41" y="167" width="12" height="6" rx="2" fill="${colors.brandGreen}" transform="rotate(-15 47 170)"/>
            ` : ''}

            <!-- Tạ ấm tay trái: Chỉ hiện từ Active trở lên -->
            ${isActive || isStrong || isChampion ? `
              <g class="prop-dumbbell-left">
                <circle cx="36" cy="179" r="7.5" fill="#2D3748"/>
                <path d="M 32 172 C 34 167 38 167 40 172" stroke="#A0AEC0" stroke-width="2.2" fill="none"/>
              </g>
            ` : `
              <g class="prop-dumbbell-left" style="display:none"></g>
            `}
          </g>

          <!-- Cánh tay trái nguyên bản từ artwork chuẩn ảnh 3 -->
          <image class="mascot-part-arm-l" href="${imgSrc}" x="12" y="14" width="176" height="212" clip-path="url(#${prefix}-clip-arm-l)" preserveAspectRatio="xMidYMid meet"/>
        </g>

        <!-- Cánh tay phải: Pivot vai tại (134, 126) -->
        <g class="part-arm arm-right">
          <!-- Bắp tay trên (Upper Arm) -->
          <path class="upper-arm" d="M 134 126 C 144 128 152 138 150 152 C 148 156 142 156 140 150 C 136 142 132 134 132 128 Z" fill="${colors.furMain}"/>

          <!-- Cẳng tay phải (Forearm): Pivot khuỷu tại (148, 152), chứa bàn tay -->
          <g class="forearm forearm-right">
            <path class="forearm-shape" d="M 148 150 C 154 156 160 166 156 176 C 153 183 144 182 142 174 C 141 166 140 156 146 150 Z" fill="${colors.furMain}"/>
            <!-- Bàn tay mèo trắng kem xinh xắn -->
            <ellipse class="paw paw-right" cx="154" cy="176" rx="7" ry="6" fill="${colors.furWhite}"/>
            <path d="M 151 176 L 151 179 M 154 177 L 154 180 M 157 176 L 157 179" stroke="${colors.furDark}" stroke-width="1.1" stroke-linecap="round"/>

            ${isActive || isStrong || isChampion ? `
              <rect x="147" y="167" width="12" height="6" rx="2" fill="${colors.brandGreen}" transform="rotate(15 153 170)"/>
            ` : ''}

            <!-- Tạ ấm tay phải: Chỉ hiện từ Active trở lên -->
            ${isActive || isStrong || isChampion ? `
              <g class="prop-dumbbell-right">
                <circle cx="164" cy="179" r="7.5" fill="#2D3748"/>
                <path d="M 160 172 C 162 167 166 167 168 172" stroke="#A0AEC0" stroke-width="2.2" fill="none"/>
              </g>
            ` : `
              <g class="prop-dumbbell-right" style="display:none"></g>
            `}
          </g>

          <!-- Cánh tay phải nguyên bản từ artwork chuẩn ảnh 3 -->
          <image class="mascot-part-arm-r" href="${imgSrc}" x="12" y="14" width="176" height="212" clip-path="url(#${prefix}-clip-arm-r)" preserveAspectRatio="xMidYMid meet"/>
        </g>
      </g>

      <!-- HỆ ĐẦU & KHUÔN MẶT (HEAD GROUP): Pivot cổ tại (100, 118), gối sâu lên thân -->
      <g class="layer-head-group">
        <!-- Tai mèo nhọn lanh lợi -->
        <g class="layer-ears">
          <g class="ear-left">
            <polygon points="50,75 58,26 88,58" fill="${colors.furMain}"/>
            <polygon points="55,70 61,35 82,58" fill="${colors.earInner}"/>
          </g>
          <g class="ear-right">
            <polygon points="150,75 142,26 112,58" fill="${colors.furMain}"/>
            <polygon points="145,70 139,35 118,58" fill="${colors.earInner}"/>
          </g>
        </g>

        <!-- Khối đầu mèo bầu bĩnh, cùng màu lông cam nền -->
        <ellipse class="part-head" cx="100" cy="78" rx="51" ry="44" fill="${colors.furMain}"/>

        <!-- Vân tabby trên trán: 3 nét dọc nhỏ trên đỉnh đầu -->
        <g class="head-stripes">
          <path d="M 93 40 L 95 48" stroke="${colors.furDark}" stroke-width="2.2" stroke-linecap="round" opacity="0.6"/>
          <path d="M 100 38 L 100 47" stroke="${colors.furDark}" stroke-width="2.5" stroke-linecap="round" opacity="0.6"/>
          <path d="M 107 40 L 105 48" stroke="${colors.furDark}" stroke-width="2.2" stroke-linecap="round" opacity="0.6"/>
        </g>

        <!-- Băng đô thể thao VisionFit — mỏng, nằm trên trán KHÔNG chồng lên mắt -->
        <g class="head-headband">
          <path d="M 53 52 C 75 44 125 44 147 52 L 146 62 C 124 55 76 55 54 62 Z" fill="${colors.brandGreen}"/>
          <!-- Đường chỉ trang trí -->
          <path d="M 55 56 C 76 50 124 50 145 56" stroke="${colors.brandLight}" stroke-width="1.5" fill="none"/>
          <!-- Nút tròn trung tâm -->
          <circle cx="100" cy="55" r="3.2" fill="#FFFFFF"/>
          <circle cx="100" cy="55" r="1.6" fill="${colors.brandGreen}"/>
          ${isChampion ? `
            <!-- Dải băng bay Champion -->
            <path d="M 147 52 C 155 50 163 54 165 48 C 167 42 161 40 157 46 C 153 50 149 52 147 55" fill="${colors.brandGreen}" opacity="0.85"/>
          ` : ''}
        </g>

        <!-- Mõm mèo trắng tròn đôi -->
        <ellipse class="part-snout" cx="91" cy="93" rx="13" ry="10" fill="${colors.snout}"/>
        <ellipse class="part-snout" cx="109" cy="93" rx="13" ry="10" fill="${colors.snout}"/>
        <!-- Mũi mèo hồng nhỏ -->
        <polygon class="part-nose" points="96,87 104,87 100,92" fill="${colors.nose}"/>

        <!-- Râu mèo tinh nghịch — mảnh và nhẹ nhàng -->
        <g class="layer-whiskers">
          <line x1="72" y1="92" x2="46" y2="89" stroke="${colors.whiskers}" stroke-width="1.2" stroke-linecap="round"/>
          <line x1="72" y1="96" x2="44" y2="99" stroke="${colors.whiskers}" stroke-width="1.2" stroke-linecap="round"/>
          <line x1="128" y1="92" x2="154" y2="89" stroke="${colors.whiskers}" stroke-width="1.2" stroke-linecap="round"/>
          <line x1="128" y1="96" x2="156" y2="99" stroke="${colors.whiskers}" stroke-width="1.2" stroke-linecap="round"/>
        </g>

        <!-- Vân tabby nhẹ trên má -->
        <g class="head-cheek-stripes" opacity="0.3">
          <path d="M 60 82 L 52 80" stroke="${colors.furDark}" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M 61 86 L 51 85" stroke="${colors.furDark}" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M 140 82 L 148 80" stroke="${colors.furDark}" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M 139 86 L 149 85" stroke="${colors.furDark}" stroke-width="1.5" stroke-linecap="round"/>
        </g>

        <!-- Lông mày — chỉ hiện cho Strong & Champion -->
        ${isStrong || isChampion ? `
          <path class="brow-left" d="M 74 66 C 77 64 83 64 86 66" stroke="${colors.furDark}" stroke-width="2" stroke-linecap="round" fill="none"/>
          <path class="brow-right" d="M 114 66 C 117 64 123 64 126 66" stroke="${colors.furDark}" stroke-width="2" stroke-linecap="round" fill="none"/>
        ` : `
          <path class="brow-left" d="M 74 66 C 77 64 83 64 86 66" stroke="${colors.furDark}" stroke-width="0" fill="none"/>
          <path class="brow-right" d="M 114 66 C 117 64 123 64 126 66" stroke="${colors.furDark}" stroke-width="0" fill="none"/>
        `}

        <!-- Mắt mèo: Nhỏ gọn kawaii, nằm DƯỚI headband với khoảng cách rõ -->
        <g class="layer-eyes">
          <g class="part-eye eye-left">
            <ellipse class="eye-ball" cx="82" cy="78" rx="5" ry="6" fill="${colors.eyes}"/>
            <circle class="eye-glint" cx="80" cy="76" r="2" fill="${colors.eyeHighlight}"/>
            <circle class="eye-glint-small" cx="83.5" cy="80" r="1" fill="${colors.eyeHighlight}"/>
          </g>
          <g class="part-eye eye-right">
            <ellipse class="eye-ball" cx="118" cy="78" rx="5" ry="6" fill="${colors.eyes}"/>
            <circle class="eye-glint" cx="116" cy="76" r="2" fill="${colors.eyeHighlight}"/>
            <circle class="eye-glint-small" cx="119.5" cy="80" r="1" fill="${colors.eyeHighlight}"/>
          </g>
          <!-- Má hồng phấn — to & mềm -->
          <ellipse cx="68" cy="88" rx="8" ry="4.5" fill="${colors.blush}" opacity="0.35"/>
          <ellipse cx="132" cy="88" rx="8" ry="4.5" fill="${colors.blush}" opacity="0.35"/>
        </g>

        <!-- Miệng mèo -->
        <g class="layer-mouth">
          <!-- Đường miệng cười chúm chím kiểu mèo (W-shape) -->
          <path class="mouth-line" d="M 92 96 C 96 100 99 98 100 95 C 101 98 104 100 108 96" stroke="${colors.nose}" stroke-width="1.8" stroke-linecap="round" fill="none"/>
          <!-- Vòm miệng mở cười nói khi greeting / speaking / celebrating -->
          <path class="mouth-open" d="M 94 95 C 94 109 106 109 106 95 Z" fill="#C53030"/>
          <path class="mouth-tongue" d="M 96 101 C 98 105 102 105 104 101 C 104 107 96 107 96 101 Z" fill="#FF8C8C"/>
        </g>

        <!-- Bong bóng suy nghĩ (Thinking state) -->
        <g class="acc-thinking-bubbles">
          <circle cx="146" cy="38" r="4" fill="#FFFFFF" stroke="${colors.brandGreen}" stroke-width="1.5"/>
          <circle cx="156" cy="26" r="6" fill="#FFFFFF" stroke="${colors.brandGreen}" stroke-width="1.5"/>
          <circle cx="172" cy="18" r="9.5" fill="#FFFFFF" stroke="${colors.brandGreen}" stroke-width="1.5"/>
          <text x="172" y="21" font-size="9" font-weight="bold" fill="${colors.brandDark}" text-anchor="middle">···</text>
        </g>

        <!-- Khối đầu nguyên bản từ artwork chuẩn ảnh 3 -->
        <image class="mascot-part-head" href="${imgSrc}" x="12" y="14" width="176" height="212" clip-path="url(#${prefix}-clip-head)" preserveAspectRatio="xMidYMid meet"/>
      </g>

      <!-- SVG DEBUG JOINT MARKERS -->
      <g class="joint-markers">
        <circle class="joint-marker" cx="66" cy="126" r="3.5" title="Shoulder Left"/>
        <circle class="joint-marker" cx="52" cy="152" r="3" title="Elbow Left"/>
        <circle class="joint-marker" cx="134" cy="126" r="3.5" title="Shoulder Right"/>
        <circle class="joint-marker" cx="148" cy="152" r="3" title="Elbow Right"/>
        <circle class="joint-marker" cx="100" cy="118" r="3.5" title="Neck"/>
        <circle class="joint-marker" cx="77" cy="196" r="3" title="Hip Left"/>
        <circle class="joint-marker" cx="123" cy="196" r="3" title="Hip Right"/>
      </g>
    </g>
  </g>
</svg>
`;
}
