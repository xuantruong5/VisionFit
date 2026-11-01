/**
 * VisionFit Mascot - Bear (Gấu VIF)
 * Hệ thống SVG phân cấp khớp động học (kinematic joint hierarchy):
 * - layer-shadow: bóng mặt đất cố định
 * - character-root: gốc chuyển động toàn thân (nhảy, đáp đất)
 *   - layer-legs: chân & hông
 *   - torso-rig: thân, cổ, tay và đầu
 *     - layer-body: thân, cơ ngực/bụng, trang phục theo cấp
 *     - acc-medal: huy chương đeo cổ (Champion) gắn vào torso-rig
 *     - layer-arms: cánh tay trái/phải với pivot vai chuẩn xác
 *     - layer-head-group: nhóm đầu, tai, mắt, mũi, miệng với pivot cổ
 */

export function renderBearSVG(stage = 'starter', state = 'idle', options = {}) {
  const prefix = options.idPrefix || ('vif-b-' + Math.random().toString(36).slice(2, 8));

  // Bảng màu chuẩn thương hiệu VisionFit cho Gấu
  const colors = {
    furMain: '#8f5c34',
    furDark: '#6b4120',
    furLight: '#b87f4f',
    furBelly: '#f7dec0',
    earInner: '#f3b090',
    snout: '#fae4cd',
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

  // Điều chỉnh tỷ lệ cơ bắp theo cấp tiến hóa thực sự
  const torsoWidthOffset = isChampion ? 6 : isStrong ? 4 : isActive ? 2 : 0;
  const armThickness = isChampion ? 3 : isStrong ? 2 : isActive ? 1 : 0;

  return `
<svg class="vif-mascot-svg species-bear stage-${stage} state-${state}" viewBox="0 0 200 240" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Linh vật Gấu VisionFit cấp độ ${stage} trạng thái ${state}" data-species="bear" data-stage="${stage}" data-state="${state}">
  <defs>
    <!-- Đổ bóng mặt đất độc lập -->
    <radialGradient id="${prefix}-shadow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#0b2417" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="#0b2417" stop-opacity="0"/>
    </radialGradient>
    <!-- Gradient lông gấu mềm mại -->
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

  <!-- BÓNG MẶT ĐẤT: Nằm ngoài character-root để không bị nhấc bổng khi nhảy -->
  <g class="layer-shadow">
    <ellipse cx="100" cy="225" rx="56" ry="12" fill="url(#${prefix}-shadow)"/>
  </g>

  <!-- GỐC NHÂN VẬT: Nhận các animation toàn thân như nhảy, bật nảy -->
  <g class="character-root">

    <!-- CHÂN & HÔNG: Nối với phần dưới của cơ thể -->
    <g class="layer-legs">
      <!-- Chân trái -->
      <g class="part-leg leg-left">
        <ellipse cx="76" cy="210" rx="17" ry="15" fill="${colors.furDark}"/>
        <ellipse cx="75" cy="212" rx="11" ry="9" fill="${colors.furBelly}"/>
      </g>
      <!-- Chân phải -->
      <g class="part-leg leg-right">
        <ellipse cx="124" cy="210" rx="17" ry="15" fill="${colors.furDark}"/>
        <ellipse cx="125" cy="212" rx="11" ry="9" fill="${colors.furBelly}"/>
      </g>
    </g>

    <!-- HỆ KHUNG THÂN (TORSO RIG): Chứa thân, vai, tay, cổ và đầu -->
    <g class="torso-rig">

      <!-- KHỐI THÂN & TRANG PHỤC: Có phần cổ nhô lên (y=114) tạo độ chồng lấp giải phẫu với đầu -->
      <g class="layer-body">
        <!-- Khối thân chính: bắt đầu từ cổ y=114, mở rộng sang vai y=128 và hông y=205 -->
        <path class="body-torso" d="M ${65 - torsoWidthOffset} 128 C 72 114 128 114 ${135 + torsoWidthOffset} 128 C ${152 + torsoWidthOffset} 165 ${148 + torsoWidthOffset} 198 140 206 C 100 216 100 216 60 206 C 52 198 ${48 - torsoWidthOffset} 165 ${65 - torsoWidthOffset} 128 Z" fill="url(#${prefix}-fur-body)"/>

        <!-- Bụng sáng / Trang phục theo cấp độ tiến hóa thực tế -->
        ${isStarter ? `
          <!-- Starter: Bụng tròn dễ thương mộc mạc -->
          <ellipse class="body-belly" cx="100" cy="168" rx="28" ry="32" fill="${colors.furBelly}"/>
        ` : isActive ? `
          <!-- Active: Áo ba lỗ thể thao VisionFit bo cong tự nhiên ôm dáng -->
          <path class="body-jersey" d="M 72 128 C 82 135 118 135 128 128 L 132 194 C 112 197 88 197 68 194 Z" fill="url(#${prefix}-fabric)"/>
          <path d="M 85 128 C 93 140 107 140 115 128" stroke="${colors.brandDark}" stroke-width="2.8" stroke-linecap="round" fill="none"/>
          <text x="100" y="165" font-size="13" font-weight="900" fill="#ffffff" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">VIF</text>
        ` : isStrong ? `
          <!-- Strong: Áo gym thể hình Pro + Sọc phản quang + Đai nâng tạ -->
          <path class="body-jersey" d="M 70 126 C 80 134 120 134 130 126 L 135 190 C 112 194 88 194 65 190 Z" fill="url(#${prefix}-fabric)"/>
          <path d="M 84 126 C 92 138 108 138 116 126" stroke="${colors.brandDark}" stroke-width="3.2" stroke-linecap="round" fill="none"/>
          <path d="M 74 132 L 69 188" stroke="${colors.brandLight}" stroke-width="2.5" stroke-linecap="round"/>
          <path d="M 126 132 L 131 188" stroke="${colors.brandLight}" stroke-width="2.5" stroke-linecap="round"/>
          <text x="100" y="162" font-size="12" font-weight="900" fill="#ffffff" text-anchor="middle" font-family="system-ui, sans-serif">PRO</text>
          <!-- Đai lưng cử tạ chuyên nghiệp -->
          <path d="M 62 188 C 100 193 100 193 138 188 L 137 202 C 100 207 100 207 63 202 Z" fill="${colors.beltBlack}"/>
          <rect x="94" y="190" width="12" height="12" rx="2" fill="${colors.gold}"/>
        ` : `
          <!-- Champion: Thể hình lực lưỡng 6 múi bo cong + Đai vô địch mạ vàng -->
          <path class="body-pecs" d="M 70 138 C 88 144 98 152 98 162 C 78 163 70 152 68 142 Z" fill="${colors.furBelly}" opacity="0.92"/>
          <path class="body-pecs" d="M 130 138 C 112 144 102 152 102 162 C 122 163 130 152 132 142 Z" fill="${colors.furBelly}" opacity="0.92"/>
          <!-- Múi cơ bụng thể thao -->
          <rect x="79" y="166" width="18" height="9" rx="3" fill="${colors.furBelly}" opacity="0.85"/>
          <rect x="103" y="166" width="18" height="9" rx="3" fill="${colors.furBelly}" opacity="0.85"/>
          <rect x="81" y="178" width="16" height="8" rx="3" fill="${colors.furBelly}" opacity="0.8"/>
          <rect x="103" y="178" width="16" height="8" rx="3" fill="${colors.furBelly}" opacity="0.8"/>
          <!-- Đai vô địch Gold Champion Belt -->
          <path d="M 58 190 C 100 196 100 196 142 190 L 140 206 C 100 212 100 212 60 206 Z" fill="${colors.beltBlack}"/>
          <circle cx="100" cy="198" r="10" fill="url(#${prefix}-gold)"/>
          <text x="100" y="202" font-size="9" font-weight="900" fill="#2c1e18" text-anchor="middle">★</text>
        `}
      </g>

      <!-- HUY CHƯƠNG VÔ ĐỊCH: Gắn vào torso-rig, không lắc theo đầu như đồ dán mặt -->
      ${isChampion ? `
        <g class="acc-medal">
          <path d="M 86 122 L 98 148 L 100 148 L 114 122" stroke="${colors.brandGreen}" stroke-width="3.5" stroke-linecap="round" fill="none"/>
          <circle cx="100" cy="154" r="11" fill="url(#${prefix}-gold)" stroke="#d49419" stroke-width="1.5"/>
          <text x="100" y="158" font-size="10" font-weight="900" fill="#2c1e18" text-anchor="middle">V</text>
        </g>
      ` : ''}

      <!-- HỆ CÁNH TAY (ARMS RIG): Pivot vai cố định (64, 132) và (136, 132) -->
      <g class="layer-arms">
        <!-- Cánh tay trái -->
        <g class="part-arm arm-left">
          <path class="arm-shape" d="M 66 130 C 44 134 ${32 - armThickness} 154 36 174 C 40 186 52 188 58 178 C 64 167 67 151 70 138 Z" fill="url(#${prefix}-fur)"/>
          ${isActive || isStrong || isChampion ? `
            <!-- Băng cổ tay thể thao -->
            <rect x="36" y="165" width="18" height="8" rx="2" fill="${colors.brandGreen}" transform="rotate(-15 45 169)"/>
          ` : ''}
          <!-- Tạ tay trái (Dumbbell) di chuyển đồng bộ với bàn tay -->
          <g class="prop-dumbbell-left">
            <rect x="23" y="168" width="8" height="16" rx="2" fill="#2d3748"/>
            <rect x="43" y="168" width="8" height="16" rx="2" fill="#2d3748"/>
            <rect x="27" y="174" width="20" height="4" fill="#a0aec0"/>
          </g>
        </g>

        <!-- Cánh tay phải -->
        <g class="part-arm arm-right">
          <path class="arm-shape" d="M 134 130 C 156 134 ${168 + armThickness} 154 164 174 C 160 186 148 188 142 178 C 136 167 133 151 130 138 Z" fill="url(#${prefix}-fur)"/>
          ${isActive || isStrong || isChampion ? `
            <!-- Băng cổ tay thể thao -->
            <rect x="146" y="165" width="18" height="8" rx="2" fill="${colors.brandGreen}" transform="rotate(15 155 169)"/>
          ` : ''}
          <!-- Tạ tay phải (Dumbbell) di chuyển đồng bộ với bàn tay -->
          <g class="prop-dumbbell-right">
            <rect x="149" y="168" width="8" height="16" rx="2" fill="#2d3748"/>
            <rect x="169" y="168" width="8" height="16" rx="2" fill="#2d3748"/>
            <rect x="153" y="174" width="20" height="4" fill="#a0aec0"/>
          </g>
        </g>
      </g>

      <!-- HỆ ĐẦU & KHUÔN MẶT (HEAD GROUP): Pivot cổ tại (100, 120), gối lên phần thân -->
      <g class="layer-head-group">
        <!-- Tai gấu -->
        <g class="layer-ears">
          <g class="ear-left">
            <circle cx="56" cy="46" r="22" fill="url(#${prefix}-fur)"/>
            <circle cx="56" cy="46" r="14" fill="${colors.earInner}"/>
          </g>
          <g class="ear-right">
            <circle cx="144" cy="46" r="22" fill="url(#${prefix}-fur)"/>
            <circle cx="144" cy="46" r="14" fill="${colors.earInner}"/>
          </g>
        </g>

        <!-- Khối đầu gấu tròn bo cong -->
        <ellipse class="part-head" cx="100" cy="80" rx="54" ry="46" fill="url(#${prefix}-fur)"/>

        <!-- Băng đô thể thao trán VisionFit -->
        <g class="head-headband">
          <path d="M 48 64 C 74 54 126 54 152 64 L 151 76 C 126 67 74 67 49 76 Z" fill="${colors.brandGreen}"/>
          <path d="M 50 70 C 75 62 125 62 150 70" stroke="${colors.brandLight}" stroke-width="2" fill="none"/>
          <circle cx="100" cy="67" r="4" fill="#ffffff"/>
          <circle cx="100" cy="67" r="2" fill="${colors.brandGreen}"/>
        </g>

        <!-- Mõm gấu -->
        <ellipse class="part-snout" cx="100" cy="94" rx="25" ry="19" fill="${colors.snout}"/>

        <!-- Mũi gấu -->
        <path class="part-nose" d="M 94 85 C 98 81 102 81 106 85 C 108 92 104 95 100 95 C 96 95 92 92 94 85 Z" fill="${colors.nose}"/>
        <ellipse cx="98" cy="86" rx="2" ry="1.2" fill="#ffffff" opacity="0.75"/>

        <!-- Mắt gấu: Nhóm đồng bộ phần mắt/pupil/highlight để chớp mắt không bị lệch tâm -->
        <g class="layer-eyes">
          <g class="part-eye eye-left">
            <ellipse class="eye-ball" cx="80" cy="74" rx="7.5" ry="9" fill="${colors.eyes}"/>
            <circle class="eye-glint" cx="77.5" cy="71" r="3" fill="${colors.eyeHighlight}"/>
            <circle class="eye-glint-small" cx="81.5" cy="76" r="1.5" fill="${colors.eyeHighlight}"/>
            <path class="eye-brow" d="M 72 63 C 76 60 84 60 88 64" stroke="${colors.furDark}" stroke-width="3" stroke-linecap="round" fill="none"/>
          </g>
          <g class="part-eye eye-right">
            <ellipse class="eye-ball" cx="120" cy="74" rx="7.5" ry="9" fill="${colors.eyes}"/>
            <circle class="eye-glint" cx="117.5" cy="71" r="3" fill="${colors.eyeHighlight}"/>
            <circle class="eye-glint-small" cx="121.5" cy="76" r="1.5" fill="${colors.eyeHighlight}"/>
            <path class="eye-brow" d="M 112 64 C 116 60 124 60 128 63" stroke="${colors.furDark}" stroke-width="3" stroke-linecap="round" fill="none"/>
          </g>
          <!-- Má hồng thể thao -->
          <ellipse cx="68" cy="86" rx="7" ry="4" fill="#ff7070" opacity="0.32"/>
          <ellipse cx="132" cy="86" rx="7" ry="4" fill="#ff7070" opacity="0.32"/>
        </g>

        <!-- Miệng gấu -->
        <g class="layer-mouth">
          <!-- Miệng mỉm cười chuẩn -->
          <path class="mouth-line" d="M 93 98 C 97 104 103 104 107 98" stroke="${colors.nose}" stroke-width="2.5" stroke-linecap="round" fill="none"/>
          <!-- Vòm miệng mở cười nói khi greeting / speaking / celebrating -->
          <path class="mouth-open" d="M 93 98 C 93 113 107 113 107 98 Z" fill="#d14242"/>
          <path class="mouth-tongue" d="M 96 104 C 98 107 102 107 104 104 C 104 111 96 111 96 104 Z" fill="#ff8c8c"/>
        </g>

        <!-- Bong bóng tư duy (Thinking State) -->
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
