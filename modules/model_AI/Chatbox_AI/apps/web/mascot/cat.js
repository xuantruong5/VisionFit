/**
 * VisionFit Mascot - Cat (Mèo VIF)
 * Nhanh nhẹn, tinh nghịch, lanh lợi, cơ thể liền khối mềm mại.
 * Hệ thống phân cấp khớp động học với cẳng tay (forearm) gập khuỷu tự nhiên.
 * Màu lông cam gừng nền phẳng đồng nhất, không chênh lệch gradient giữa các bộ phận.
 */

export function renderCatSVG(stage = 'starter', state = 'idle', options = {}) {
  const prefix = options.idPrefix || ('vif-c-' + Math.random().toString(36).slice(2, 8));

  // Bảng màu chuẩn theo yêu cầu thiết kế VisionFit cho Mèo VIF
  const colors = {
    furMain: '#ED9859',    // Lông cam gừng đồng nhất toàn thân (đầu, cổ, vai, tay, chân, đuôi)
    furDark: '#C25816',    // Nét viền chi tiết, râu mèo, bóng nhẹ
    furBelly: '#FFF4DF',   // Yếm ngực & bụng kem sáng mềm mại
    furWhite: '#FFF4DF',   // Chóp đuôi & mõm trắng kem
    earInner: '#FFAFAF',   // Lòng tai hồng đào
    snout: '#FFF4DF',      // Mõm mèo
    nose: '#FF6B81',       // Mũi tam giác hồng nhỏ xinh
    eyes: '#154E38',       // Mắt xanh ngọc bích sắc sảo
    eyeHighlight: '#FFFFFF',
    whiskers: '#A95231',   // Râu mèo nâu ấm
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
      </g>

      <!-- Chân phải -->
      <g class="part-leg leg-right">
        <path d="M 112 197 C 112 197 111 216 123 216 C 136 216 134 195 134 195 Z" fill="${colors.furMain}"/>
        <!-- Bàn chân phải -->
        <ellipse cx="123" cy="214" rx="13.5" ry="8.5" fill="${colors.furMain}"/>
        <!-- Ngón chân nhỏ -->
        <path d="M 119 216 L 119 219 M 123 216 L 123 220 M 127 216 L 127 219" stroke="${colors.furDark}" stroke-width="1.3" stroke-linecap="round"/>
      </g>
    </g>

    <!-- HỆ KHUNG THÂN (TORSO RIG): Chứa thân, vai, tay, cổ và đầu -->
    <g class="torso-rig">

      <!-- KHỐI THÂN & CỔ CHỒNG LẤP: Cổ bắt đầu từ y=108, gối sâu dưới cằm y=123 -->
      <g class="layer-body">
        <!-- Khối thân chính: Màu lông đồng nhất, bo cong mềm mại thon gọn -->
        <path class="body-torso" d="M ${66 - shoulderOffset} 126 C 74 108 126 108 ${134 + shoulderOffset} 126 C ${148 + torsoWidth} 165 ${144 + torsoWidth} 198 136 206 C 100 214 100 214 64 206 C 56 198 ${52 - torsoWidth} 165 ${66 - shoulderOffset} 126 Z" fill="${colors.furMain}"/>

        <!-- Vùng cổ mềm gối sâu dưới cằm -->
        <path class="body-neck" d="M 78 124 C 88 114 112 114 122 124 Z" fill="${colors.furMain}"/>

        <!-- Yếm ngực / Trang phục thể thao theo cấp tiến hóa -->
        ${isStarter ? `
          <!-- Starter: Yếm lông ngực trắng kem thon gọn -->
          <path class="body-belly" d="M 85 126 C 94 140 106 140 115 126 C 124 165 116 194 100 196 C 84 194 76 165 85 126 Z" fill="${colors.furCream}"/>
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
          <path class="body-pecs" d="M 74 138 C 88 143 98 150 98 160 C 80 161 74 150 72 141 Z" fill="${colors.furCream}" opacity="0.9"/>
          <path class="body-pecs" d="M 126 138 C 112 143 102 150 102 160 C 120 161 126 150 128 141 Z" fill="${colors.furCream}" opacity="0.9"/>
          <!-- Múi cơ bụng thể thao -->
          <rect x="81" y="165" width="16" height="9" rx="3" fill="${colors.furCream}" opacity="0.85"/>
          <rect x="103" y="165" width="16" height="9" rx="3" fill="${colors.furCream}" opacity="0.85"/>
          <rect x="83" y="177" width="14" height="8" rx="3" fill="${colors.furCream}" opacity="0.8"/>
          <rect x="103" y="177" width="14" height="8" rx="3" fill="${colors.furCream}" opacity="0.8"/>
          <!-- Đai vô địch Champion Gold Belt -->
          <path d="M 60 190 C 100 195 100 195 140 190 L 138 205 C 100 211 100 211 62 205 Z" fill="${colors.beltBlack}"/>
          <circle cx="100" cy="198" r="9" fill="url(#${prefix}-gold)"/>
          <text x="100" y="202" font-size="8" font-weight="900" fill="#2C1E18" text-anchor="middle">★</text>
        `}
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

          <!-- Cẳng tay trái (Forearm): Pivot khuỷu tại (52, 152), chứa bàn tay & tạ -->
          <g class="forearm forearm-left">
            <path class="forearm-shape" d="M 52 150 C 46 156 40 166 44 176 C 47 183 56 182 58 174 C 59 166 60 156 54 150 Z" fill="${colors.furMain}"/>
            <!-- Bàn tay mèo trắng kem xinh xắn -->
            <ellipse class="paw paw-left" cx="46" cy="176" rx="7" ry="6" fill="${colors.furWhite}"/>
            <path d="M 43 176 L 43 179 M 46 177 L 46 180 M 49 176 L 49 179" stroke="${colors.furDark}" stroke-width="1.1" stroke-linecap="round"/>

            ${isActive || isStrong || isChampion ? `
              <rect x="41" y="167" width="12" height="6" rx="2" fill="${colors.brandGreen}" transform="rotate(-15 47 170)"/>
            ` : ''}

            <!-- Tạ ấm / tạ đơn tay trái -->
            <g class="prop-dumbbell-left">
              <circle cx="36" cy="179" r="7.5" fill="#2D3748"/>
              <path d="M 32 172 C 34 167 38 167 40 172" stroke="#A0AEC0" stroke-width="2.2" fill="none"/>
            </g>
          </g>
        </g>

        <!-- Cánh tay phải: Pivot vai tại (134, 126) -->
        <g class="part-arm arm-right">
          <!-- Bắp tay trên (Upper Arm) -->
          <path class="upper-arm" d="M 134 126 C 144 128 152 138 150 152 C 148 156 142 156 140 150 C 136 142 132 134 132 128 Z" fill="${colors.furMain}"/>

          <!-- Cẳng tay phải (Forearm): Pivot khuỷu tại (148, 152), chứa bàn tay & tạ -->
          <g class="forearm forearm-right">
            <path class="forearm-shape" d="M 148 150 C 154 156 160 166 156 176 C 153 183 144 182 142 174 C 141 166 140 156 146 150 Z" fill="${colors.furMain}"/>
            <!-- Bàn tay mèo trắng kem xinh xắn -->
            <ellipse class="paw paw-right" cx="154" cy="176" rx="7" ry="6" fill="${colors.furWhite}"/>
            <path d="M 151 176 L 151 179 M 154 177 L 154 180 M 157 176 L 157 179" stroke="${colors.furDark}" stroke-width="1.1" stroke-linecap="round"/>

            ${isActive || isStrong || isChampion ? `
              <rect x="147" y="167" width="12" height="6" rx="2" fill="${colors.brandGreen}" transform="rotate(15 153 170)"/>
            ` : ''}

            <!-- Tạ ấm / tạ đơn tay phải -->
            <g class="prop-dumbbell-right">
              <circle cx="164" cy="179" r="7.5" fill="#2D3748"/>
              <path d="M 160 172 C 162 167 166 167 168 172" stroke="#A0AEC0" stroke-width="2.2" fill="none"/>
            </g>
          </g>
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

        <!-- Băng đô thể thao VisionFit -->
        <g class="head-headband">
          <path d="M 52 64 C 75 55 125 55 148 64 L 147 75 C 125 67 75 67 53 75 Z" fill="${colors.brandGreen}"/>
          <path d="M 54 69 C 76 61 124 61 146 69" stroke="${colors.brandLight}" stroke-width="1.8" fill="none"/>
          <circle cx="100" cy="67" r="3.5" fill="#FFFFFF"/>
          <circle cx="100" cy="67" r="1.8" fill="${colors.brandGreen}"/>
        </g>

        <!-- Mõm mèo trắng tròn đôi -->
        <ellipse class="part-snout" cx="91" cy="93" rx="13" ry="10" fill="${colors.snout}"/>
        <ellipse class="part-snout" cx="109" cy="93" rx="13" ry="10" fill="${colors.snout}"/>
        <!-- Mũi mèo hồng nhỏ -->
        <polygon class="part-nose" points="96,86 104,86 100,91" fill="${colors.nose}"/>

        <!-- Râu mèo tinh nghịch -->
        <g class="layer-whiskers">
          <line x1="68" y1="91" x2="42" y2="88" stroke="${colors.whiskers}" stroke-width="1.8" stroke-linecap="round"/>
          <line x1="68" y1="96" x2="40" y2="98" stroke="${colors.whiskers}" stroke-width="1.8" stroke-linecap="round"/>
          <line x1="132" y1="91" x2="158" y2="88" stroke="${colors.whiskers}" stroke-width="1.8" stroke-linecap="round"/>
          <line x1="132" y1="96" x2="160" y2="98" stroke="${colors.whiskers}" stroke-width="1.8" stroke-linecap="round"/>
        </g>

        <!-- Lông mày đặt ngoài cụm mắt -->
        <path class="brow-left" d="M 72 62 C 76 58 84 58 88 63" stroke="${colors.furDark}" stroke-width="2.6" stroke-linecap="round" fill="none"/>
        <path class="brow-right" d="M 112 63 C 116 58 124 58 128 62" stroke="${colors.furDark}" stroke-width="2.6" stroke-linecap="round" fill="none"/>

        <!-- Mắt mèo: Mắt xanh ngọc sắc sảo, chớp mắt đồng bộ tâm -->
        <g class="layer-eyes">
          <g class="part-eye eye-left">
            <ellipse class="eye-ball" cx="80" cy="74" rx="8" ry="9.5" fill="${colors.eyes}"/>
            <ellipse cx="80.5" cy="74" rx="5" ry="8.5" fill="#0D2B1F"/>
            <circle class="eye-glint" cx="77.5" cy="70" r="3" fill="${colors.eyeHighlight}"/>
            <circle class="eye-glint-small" cx="82.5" cy="76" r="1.4" fill="${colors.eyeHighlight}"/>
          </g>
          <g class="part-eye eye-right">
            <ellipse class="eye-ball" cx="120" cy="74" rx="8" ry="9.5" fill="${colors.eyes}"/>
            <ellipse cx="119.5" cy="74" rx="5" ry="8.5" fill="#0D2B1F"/>
            <circle class="eye-glint" cx="117.5" cy="70" r="3" fill="${colors.eyeHighlight}"/>
            <circle class="eye-glint-small" cx="122.5" cy="76" r="1.4" fill="${colors.eyeHighlight}"/>
          </g>
          <!-- Má hồng phấn -->
          <ellipse cx="68" cy="87" rx="6" ry="3.5" fill="#FF758F" opacity="0.32"/>
          <ellipse cx="132" cy="87" rx="6" ry="3.5" fill="#FF758F" opacity="0.32"/>
        </g>

        <!-- Miệng mèo -->
        <g class="layer-mouth">
          <!-- Đường miệng cười chúm chím -->
          <path class="mouth-line" d="M 92 95 C 96 99 99 99 100 95 C 101 99 104 99 108 95" stroke="${colors.nose}" stroke-width="2.2" stroke-linecap="round" fill="none"/>
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
