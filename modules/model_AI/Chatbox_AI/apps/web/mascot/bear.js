/**
 * VisionFit Mascot - Bear (Gấu VIF)
 * Kawaii style: thân thiện, khỏe khoắn, mắt nhỏ dễ thương, headband mỏng trên trán.
 * Hệ thống phân cấp khớp động học với cẳng tay (forearm) gập khuỷu tự nhiên.
 * Màu lông nền phẳng đồng nhất, không chênh lệch gradient giữa các bộ phận.
 */

import { MASCOT_IMAGES } from './mascotImages.js';

export function renderBearSVG(stage = 'starter', state = 'idle', options = {}) {
  const prefix = options.idPrefix || ('vif-b-' + Math.random().toString(36).slice(2, 8));
  const imgSrc = (typeof MASCOT_IMAGES !== 'undefined' && MASCOT_IMAGES[`bear_${stage}`]) || `/mascot/assets/bear_${stage}.png`;

  // Bảng màu chuẩn theo yêu cầu thiết kế VisionFit
  const colors = {
    furMain: '#BA875A',    // Lông nền đồng nhất toàn thân (đầu, cổ, vai, tay, chân)
    furDark: '#8F5C34',    // Nét viền chi tiết, tai trong, bóng nhẹ
    furBelly: '#FFE6C7',   // Bụng & mõm sáng mềm mại
    earInner: '#E8B690',   // Lòng tai hồng ấm
    snout: '#FFE6C7',      // Mõm gấu
    nose: '#4A2E1B',       // Mũi nâu đậm tròn
    eyes: '#2A1810',       // Mắt hạt nhãn đen láy
    eyeHighlight: '#FFFFFF',
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

  // Điều chỉnh vóc dáng cơ bắp thực sự theo cấp độ
  const shoulderOffset = isChampion ? 6 : isStrong ? 4 : isActive ? 2 : 0;
  const torsoWidth = isChampion ? 5 : isStrong ? 3 : isActive ? 1 : 0;

  return `
<svg class="vif-mascot-svg species-bear stage-${stage} state-${state}" viewBox="0 0 200 240" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Linh vật Gấu VisionFit cấp độ ${stage} trạng thái ${state}" data-species="bear" data-stage="${stage}" data-state="${state}">
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
    <!-- Vải thể thao VisionFit -->
    <linearGradient id="${prefix}-fabric" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${colors.brandLight}"/>
      <stop offset="100%" stop-color="${colors.brandGreen}"/>
    </linearGradient>
  </defs>

  <!-- BÓNG MẶT ĐẤT: Tách ngoài character-root, cố định khi nhân vật nhảy -->
  <g class="layer-shadow">
    <ellipse cx="100" cy="225" rx="55" ry="11" fill="url(#${prefix}-shadow)"/>
  </g>

  <!-- GỐC NHÂN VẬT: Nhận các animation toàn thân (nhảy, tiếp đất) -->
  <g class="character-root">

    <!-- CHÂN & BÀN CHÂN: Cùng màu lông nền cơ thể, gắn liền khối vào hông -->
    <g class="layer-legs">
      <!-- Chân trái -->
      <g class="part-leg leg-left">
        <path d="M 64 194 C 64 194 62 216 76 216 C 90 216 88 196 88 196 Z" fill="${colors.furMain}"/>
        <!-- Bàn chân trái bo tròn mềm mại cùng màu lông -->
        <ellipse cx="76" cy="214" rx="14" ry="9" fill="${colors.furMain}"/>
        <!-- Ngón chân nhỏ dễ thương -->
        <path d="M 72 216 L 72 219 M 76 216 L 76 220 M 80 216 L 80 219" stroke="${colors.furDark}" stroke-width="1.5" stroke-linecap="round"/>
        <image class="mascot-part-leg-l" href="${imgSrc}" x="12" y="10" width="176" height="216" clip-path="url(#${prefix}-clip-leg-l)" preserveAspectRatio="xMidYMid meet"/>
      </g>

      <!-- Chân phải -->
      <g class="part-leg leg-right">
        <path d="M 112 196 C 112 196 110 216 124 216 C 138 216 136 194 136 194 Z" fill="${colors.furMain}"/>
        <!-- Bàn chân phải -->
        <ellipse cx="124" cy="214" rx="14" ry="9" fill="${colors.furMain}"/>
        <!-- Ngón chân nhỏ -->
        <path d="M 120 216 L 120 219 M 124 216 L 124 220 M 128 216 L 128 219" stroke="${colors.furDark}" stroke-width="1.5" stroke-linecap="round"/>
        <image class="mascot-part-leg-r" href="${imgSrc}" x="12" y="10" width="176" height="216" clip-path="url(#${prefix}-clip-leg-r)" preserveAspectRatio="xMidYMid meet"/>
      </g>
    </g>

    <!-- HỆ KHUNG THÂN (TORSO RIG): Chứa thân, vai, tay, cổ và đầu -->
    <g class="torso-rig">

      <!-- KHỐI THÂN & CỔ CHỒNG LẤP -->
      <g class="layer-body">
        <!-- Khối thân chính: Màu lông đồng nhất, bo cong mềm mại -->
        <path class="body-torso" d="M ${64 - shoulderOffset} 126 C 72 108 128 108 ${136 + shoulderOffset} 126 C ${150 + torsoWidth} 165 ${146 + torsoWidth} 198 138 206 C 100 214 100 214 62 206 C 54 198 ${50 - torsoWidth} 165 ${64 - shoulderOffset} 126 Z" fill="${colors.furMain}"/>

        <!-- Vùng cổ mềm gối sâu dưới cằm -->
        <path class="body-neck" d="M 78 124 C 88 114 112 114 122 124 Z" fill="${colors.furMain}"/>

        <!-- Họa tiết lông bụng mềm mại / Trang phục theo cấp tiến hóa -->
        ${isStarter ? `
          <!-- Starter: Bụng kem tròn trĩnh dễ thương -->
          <ellipse class="body-belly" cx="100" cy="168" rx="27" ry="30" fill="${colors.furBelly}"/>
        ` : isActive ? `
          <!-- Active: Áo thể thao năng động VisionFit ôm dáng theo đường cong thân -->
          <path class="body-jersey" d="M 72 126 C 84 132 116 132 128 126 L 132 195 C 112 198 88 198 68 195 Z" fill="url(#${prefix}-fabric)"/>
          <path d="M 86 126 C 93 138 107 138 114 126" stroke="${colors.brandDark}" stroke-width="2.5" stroke-linecap="round" fill="none"/>
          <text x="100" y="165" font-size="13" font-weight="900" fill="#FFFFFF" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">VIF</text>
        ` : isStrong ? `
          <!-- Strong: Áo gym VIF PRO + Đai tập tạ gọn gàng -->
          <path class="body-jersey" d="M 70 125 C 82 132 118 132 130 125 L 135 190 C 112 194 88 194 65 190 Z" fill="url(#${prefix}-fabric)"/>
          <path d="M 84 125 C 92 136 108 136 116 125" stroke="${colors.brandDark}" stroke-width="2.8" stroke-linecap="round" fill="none"/>
          <path d="M 74 132 L 69 188" stroke="${colors.brandLight}" stroke-width="2" stroke-linecap="round"/>
          <path d="M 126 132 L 131 188" stroke="${colors.brandLight}" stroke-width="2" stroke-linecap="round"/>
          <text x="100" y="162" font-size="11" font-weight="900" fill="#FFFFFF" text-anchor="middle" font-family="system-ui, sans-serif">PRO</text>
          <!-- Đai cử tạ thể hình -->
          <path d="M 62 188 C 100 193 100 193 138 188 L 137 202 C 100 207 100 207 63 202 Z" fill="${colors.beltBlack}"/>
          <rect x="94" y="190" width="12" height="12" rx="2" fill="${colors.gold}"/>
        ` : `
          <!-- Champion: Thể hình 6 múi bo cong tinh tế + Đai vàng vô địch -->
          <path class="body-pecs" d="M 72 138 C 88 143 98 150 98 160 C 78 161 72 150 70 141 Z" fill="${colors.furBelly}" opacity="0.9"/>
          <path class="body-pecs" d="M 128 138 C 112 143 102 150 102 160 C 122 161 128 150 130 141 Z" fill="${colors.furBelly}" opacity="0.9"/>
          <!-- Múi cơ bụng thể thao -->
          <rect x="80" y="165" width="17" height="9" rx="3" fill="${colors.furBelly}" opacity="0.85"/>
          <rect x="103" y="165" width="17" height="9" rx="3" fill="${colors.furBelly}" opacity="0.85"/>
          <rect x="82" y="177" width="15" height="8" rx="3" fill="${colors.furBelly}" opacity="0.8"/>
          <rect x="103" y="177" width="15" height="8" rx="3" fill="${colors.furBelly}" opacity="0.8"/>
          <!-- Đai vô địch Gold Champion Belt -->
          <path d="M 58 190 C 100 196 100 196 142 190 L 140 206 C 100 212 100 212 60 206 Z" fill="${colors.beltBlack}"/>
          <circle cx="100" cy="198" r="9.5" fill="url(#${prefix}-gold)"/>
          <text x="100" y="202" font-size="9" font-weight="900" fill="#2C1E18" text-anchor="middle">★</text>
        `}

        <!-- Thân hình nguyên bản từ artwork chuẩn ảnh 3 -->
        <image class="mascot-part-body" href="${imgSrc}" x="12" y="10" width="176" height="216" clip-path="url(#${prefix}-clip-body)" preserveAspectRatio="xMidYMid meet"/>
      </g>

      <!-- HUY CHƯƠNG VÔ ĐỊCH: Gắn vào torso-rig quanh cổ, không lắc theo mặt -->
      ${isChampion ? `
        <g class="acc-medal">
          <path d="M 86 122 L 98 146 L 100 146 L 114 122" stroke="${colors.brandGreen}" stroke-width="3.5" stroke-linecap="round" fill="none"/>
          <circle cx="100" cy="153" r="11" fill="url(#${prefix}-gold)" stroke="#D49419" stroke-width="1.5"/>
          <text x="100" y="157" font-size="9.5" font-weight="900" fill="#2C1E18" text-anchor="middle">V</text>
        </g>
      ` : ''}

      <!-- HỆ CÁNH TAY 2 ĐOẠN (BẮP TAY + CẲNG TAY GẬP KHUỶU): Nằm trước thân -->
      <g class="layer-arms">
        <!-- Cánh tay trái: Pivot vai tại (64, 126) -->
        <g class="part-arm arm-left">
          <!-- Bắp tay trên (Upper Arm) -->
          <path class="upper-arm" d="M 64 126 C 54 128 46 138 48 152 C 50 156 56 156 58 150 C 62 142 66 134 66 128 Z" fill="${colors.furMain}"/>
          
          <!-- Cẳng tay trái (Forearm): Pivot khuỷu tại (50, 152), chứa bàn tay & tạ -->
          <g class="forearm forearm-left">
            <!-- Khối cẳng tay xuống bàn tay -->
            <path class="forearm-shape" d="M 50 150 C 44 156 38 166 42 176 C 45 183 54 182 56 174 C 57 166 58 156 52 150 Z" fill="${colors.furMain}"/>
            <!-- Bàn tay tròn cùng màu lông -->
            <ellipse class="paw paw-left" cx="44" cy="176" rx="7.5" ry="6.5" fill="${colors.furMain}"/>
            <path d="M 40 176 L 41 180 M 44 177 L 44 181 M 47 176 L 47 180" stroke="${colors.furDark}" stroke-width="1.2" stroke-linecap="round"/>

            ${isActive || isStrong || isChampion ? `
              <!-- Băng cổ tay thể thao -->
              <rect x="39" y="167" width="13" height="6" rx="2" fill="${colors.brandGreen}" transform="rotate(-15 45 170)"/>
            ` : ''}

            <!-- Tạ tay trái (Dumbbell): Chỉ hiện từ Active trở lên -->
            ${isActive || isStrong || isChampion ? `
              <g class="prop-dumbbell-left">
                <rect x="25" y="170" width="7" height="15" rx="2" fill="#2D3748"/>
                <rect x="45" y="170" width="7" height="15" rx="2" fill="#2D3748"/>
                <rect x="29" y="176" width="19" height="3.5" fill="#A0AEC0"/>
              </g>
            ` : `
              <g class="prop-dumbbell-left" style="display:none"></g>
            `}
          </g>

          <!-- Cánh tay trái nguyên bản từ artwork chuẩn ảnh 3 -->
          <image class="mascot-part-arm-l" href="${imgSrc}" x="12" y="10" width="176" height="216" clip-path="url(#${prefix}-clip-arm-l)" preserveAspectRatio="xMidYMid meet"/>
        </g>

        <!-- Cánh tay phải: Pivot vai tại (136, 126) -->
        <g class="part-arm arm-right">
          <!-- Bắp tay trên (Upper Arm) -->
          <path class="upper-arm" d="M 136 126 C 146 128 154 138 152 152 C 150 156 144 156 142 150 C 138 142 134 134 134 128 Z" fill="${colors.furMain}"/>

          <!-- Cẳng tay phải (Forearm): Pivot khuỷu tại (150, 152), chứa bàn tay & tạ -->
          <g class="forearm forearm-right">
            <!-- Khối cẳng tay xuống bàn tay -->
            <path class="forearm-shape" d="M 150 150 C 156 156 162 166 158 176 C 155 183 146 182 144 174 C 143 166 142 156 148 150 Z" fill="${colors.furMain}"/>
            <!-- Bàn tay tròn cùng màu lông -->
            <ellipse class="paw paw-right" cx="156" cy="176" rx="7.5" ry="6.5" fill="${colors.furMain}"/>
            <path d="M 153 176 L 153 180 M 156 177 L 156 181 M 159 176 L 159 180" stroke="${colors.furDark}" stroke-width="1.2" stroke-linecap="round"/>

            ${isActive || isStrong || isChampion ? `
              <!-- Băng cổ tay thể thao -->
              <rect x="148" y="167" width="13" height="6" rx="2" fill="${colors.brandGreen}" transform="rotate(15 155 170)"/>
            ` : ''}

            <!-- Tạ tay phải (Dumbbell): Chỉ hiện từ Active trở lên -->
            ${isActive || isStrong || isChampion ? `
              <g class="prop-dumbbell-right">
                <rect x="148" y="170" width="7" height="15" rx="2" fill="#2D3748"/>
                <rect x="168" y="170" width="7" height="15" rx="2" fill="#2D3748"/>
                <rect x="152" y="176" width="19" height="3.5" fill="#A0AEC0"/>
              </g>
            ` : `
              <g class="prop-dumbbell-right" style="display:none"></g>
            `}
          </g>

          <!-- Cánh tay phải nguyên bản từ artwork chuẩn ảnh 3 -->
          <image class="mascot-part-arm-r" href="${imgSrc}" x="12" y="10" width="176" height="216" clip-path="url(#${prefix}-clip-arm-r)" preserveAspectRatio="xMidYMid meet"/>
        </g>
      </g>

      <!-- HỆ ĐẦU & KHUÔN MẶT (HEAD GROUP): Pivot cổ tại (100, 118), gối sâu lên thân -->
      <g class="layer-head-group">
        <!-- Tai gấu tròn hiền lành -->
        <g class="layer-ears">
          <g class="ear-left">
            <circle cx="56" cy="46" r="21" fill="${colors.furMain}"/>
            <circle cx="56" cy="46" r="13" fill="${colors.earInner}"/>
          </g>
          <g class="ear-right">
            <circle cx="144" cy="46" r="21" fill="${colors.furMain}"/>
            <circle cx="144" cy="46" r="13" fill="${colors.earInner}"/>
          </g>
        </g>

        <!-- Khối đầu gấu tròn bo cong mềm mại, cùng màu lông nền -->
        <ellipse class="part-head" cx="100" cy="78" rx="52" ry="45" fill="${colors.furMain}"/>

        <!-- Băng đô trán thể thao VisionFit — mỏng, nằm trên trán KHÔNG chồng lên mắt -->
        <g class="head-headband">
          <path d="M 50 52 C 74 44 126 44 150 52 L 149 62 C 126 55 74 55 51 62 Z" fill="${colors.brandGreen}"/>
          <!-- Đường chỉ trang trí trên headband -->
          <path d="M 52 56 C 75 50 125 50 148 56" stroke="${colors.brandLight}" stroke-width="1.5" fill="none"/>
          <!-- Nút tròn trung tâm -->
          <circle cx="100" cy="55" r="3.5" fill="#FFFFFF"/>
          <circle cx="100" cy="55" r="1.8" fill="${colors.brandGreen}"/>
          ${isChampion ? `
            <!-- Dải băng bay Champion -->
            <path d="M 150 52 C 158 50 166 54 168 48 C 170 42 164 40 160 46 C 156 50 152 52 150 55" fill="${colors.brandGreen}" opacity="0.85"/>
          ` : ''}
        </g>

        <!-- Mõm gấu kem mềm -->
        <ellipse class="part-snout" cx="100" cy="93" rx="24" ry="18" fill="${colors.snout}"/>

        <!-- Mũi gấu bo tròn dễ thương -->
        <path class="part-nose" d="M 94 85 C 98 81 102 81 106 85 C 108 91 104 94 100 94 C 96 94 92 91 94 85 Z" fill="${colors.nose}"/>
        <ellipse cx="98" cy="86" rx="2" ry="1.2" fill="#FFFFFF" opacity="0.75"/>

        <!-- Lông mày nhẹ — chỉ hiện cho Strong & Champion để thể hiện sự quyết tâm -->
        ${isStrong || isChampion ? `
          <path class="brow-left" d="M 74 66 C 77 64 83 64 86 66" stroke="${colors.furDark}" stroke-width="2" stroke-linecap="round" fill="none"/>
          <path class="brow-right" d="M 114 66 C 117 64 123 64 126 66" stroke="${colors.furDark}" stroke-width="2" stroke-linecap="round" fill="none"/>
        ` : `
          <path class="brow-left" d="M 74 66 C 77 64 83 64 86 66" stroke="${colors.furDark}" stroke-width="0" fill="none"/>
          <path class="brow-right" d="M 114 66 C 117 64 123 64 126 66" stroke="${colors.furDark}" stroke-width="0" fill="none"/>
        `}

        <!-- Mắt gấu: Nhỏ gọn kawaii, nằm DƯỚI headband với khoảng cách rõ -->
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
          <!-- Má hồng phấn thể thao — to & mềm -->
          <ellipse cx="68" cy="88" rx="8" ry="4.5" fill="${colors.blush}" opacity="0.35"/>
          <ellipse cx="132" cy="88" rx="8" ry="4.5" fill="${colors.blush}" opacity="0.35"/>
        </g>

        <!-- Miệng gấu -->
        <g class="layer-mouth">
          <!-- Miệng mỉm cười nhẹ -->
          <path class="mouth-line" d="M 94 97 C 97 103 103 103 106 97" stroke="${colors.nose}" stroke-width="2.4" stroke-linecap="round" fill="none"/>
          <!-- Vòm miệng cười nói khi greeting / speaking / celebrating -->
          <path class="mouth-open" d="M 94 97 C 94 111 106 111 106 97 Z" fill="#C53030"/>
          <path class="mouth-tongue" d="M 96 103 C 98 106 102 106 104 103 C 104 109 96 109 96 103 Z" fill="#FF8C8C"/>
        </g>

        <!-- Bong bóng suy nghĩ (Thinking State) -->
        <g class="acc-thinking-bubbles">
          <circle cx="146" cy="38" r="4" fill="#FFFFFF" stroke="${colors.brandGreen}" stroke-width="1.5"/>
          <circle cx="156" cy="26" r="6" fill="#FFFFFF" stroke="${colors.brandGreen}" stroke-width="1.5"/>
          <circle cx="172" cy="18" r="9.5" fill="#FFFFFF" stroke="${colors.brandGreen}" stroke-width="1.5"/>
          <text x="172" y="21" font-size="9" font-weight="bold" fill="${colors.brandDark}" text-anchor="middle">···</text>
        </g>

        <!-- Khối đầu nguyên bản từ artwork chuẩn ảnh 3 -->
        <image class="mascot-part-head" href="${imgSrc}" x="12" y="10" width="176" height="216" clip-path="url(#${prefix}-clip-head)" preserveAspectRatio="xMidYMid meet"/>
      </g>

      <!-- SVG DEBUG JOINT MARKERS: Hiển thị thật khi bật chế độ debug-joints -->
      <g class="joint-markers">
        <circle class="joint-marker" cx="64" cy="126" r="3.5" title="Shoulder Left"/>
        <circle class="joint-marker" cx="50" cy="152" r="3" title="Elbow Left"/>
        <circle class="joint-marker" cx="136" cy="126" r="3.5" title="Shoulder Right"/>
        <circle class="joint-marker" cx="150" cy="152" r="3" title="Elbow Right"/>
        <circle class="joint-marker" cx="100" cy="118" r="3.5" title="Neck"/>
        <circle class="joint-marker" cx="76" cy="196" r="3" title="Hip Left"/>
        <circle class="joint-marker" cx="124" cy="196" r="3" title="Hip Right"/>
      </g>
    </g>
  </g>
</svg>
`;
}
