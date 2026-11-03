/**
 * VisionFit Mascot - Bear (Gấu VIF)
 * Thiết kế Chibi Kawaii Viền Nâu Đậm Liền Khối (Seamless Open-Contour Vector Rig)
 * - Đã loại bỏ hoàn toàn các hình tròn (<circle>, <ellipse> viền kín) gây hiện tượng "nổi chấm/cục ở khớp"
 *   tại Vai, Khuỷu tay, Cổ tay và Cổ chân.
 * - Viền cánh tay (upper-arm & forearm) dùng nét mở (open contour) chỉ viền 2 cạnh ngoài và lòng bàn tay,
 *   đầu khớp dùng vòm tròn đồng màu lông ẩn bên trong giúp tay vừa liền một dải khi đứng yên vừa không bị hở khi gập.
 */

export function renderBearSVG(stageOrConfig = 'starter', stateArg = 'idle', optionsArg = {}) {
  let stage = 'starter';
  let state = 'idle';
  let options = {};

  if (typeof stageOrConfig === 'object' && stageOrConfig !== null) {
    stage = stageOrConfig.stage || 'starter';
    state = stageOrConfig.state || 'idle';
    options = stageOrConfig;
  } else {
    stage = stageOrConfig || 'starter';
    state = stateArg || 'idle';
    options = optionsArg || {};
  }

  const prefix = options.idPrefix || options.instanceId || ('vif-b-' + Math.random().toString(36).slice(2, 8));

  const colors = {
    outline: '#4A2B18',      // Viền nâu đậm chuẩn Kawaii Vector
    furMain: '#B9855A',      // Lông nâu caramel ấm áp
    furShade: '#9B6B43',     // Bóng lông dưới cổ / cơ bụng
    furLight: '#CFA077',     // Ánh sáng trên đầu
    furBelly: '#FBEAD2',     // Bụng & mõm kem sữa ấm
    furCream: '#FBEAD2',
    earInner: '#E2B68E',     // Lòng tai kem nâu sáng
    snout: '#FBEAD2',        // Mõm gấu
    nose: '#4A2B18',         // Mũi nâu đậm
    eyes: '#3B2010',         // Mắt nâu đen to tròn
    eyeHighlight: '#FFFFFF',
    blush: '#EA8B91',        // Má hồng phấn
    brandGreen: '#168B67',   // Xanh lá thể thao VisionFit
    brandDark: '#0E6349',
    brandLight: '#73DFAC',
    beltDark: '#263240',     // Đai lưng Strong
    beltBlack: '#1E242B',    // Đai lưng Champion
    gold: '#F7C948',         // Vàng huy chương & đai Champion
    goldLight: '#FFE885',
    goldDark: '#D49B1A',
    ribbonRed: '#D93829'     // Dây đeo huy chương đỏ-vàng
  };

  const isStarter = stage === 'starter';
  const isActive = stage === 'active';
  const isStrong = stage === 'strong';
  const isChampion = stage === 'champion';

  const shoulderW = isChampion ? 5 : isStrong ? 4 : isActive ? 1.5 : 0;
  const torsoW = isChampion ? 4 : isStrong ? 3 : isActive ? 1 : 0;

  return `
<svg class="vif-mascot-svg species-bear stage-${stage} state-${state}" viewBox="0 0 200 240" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Linh vật Gấu VisionFit cấp độ ${stage} trạng thái ${state}" data-species="bear" data-stage="${stage}" data-state="${state}">
  <defs>
    <radialGradient id="${prefix}-shadow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#1E293B" stop-opacity="0.22"/>
      <stop offset="70%" stop-color="#1E293B" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#1E293B" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="${prefix}-gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${colors.goldLight}"/>
      <stop offset="55%" stop-color="${colors.gold}"/>
      <stop offset="100%" stop-color="${colors.goldDark}"/>
    </linearGradient>
    <linearGradient id="${prefix}-fabric" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1D9E75"/>
      <stop offset="100%" stop-color="${colors.brandGreen}"/>
    </linearGradient>
  </defs>

  <!-- BÓNG MẶT ĐẤT: Nằm ngoài character-root -->
  <g class="layer-shadow">
    <ellipse cx="100" cy="224" rx="52" ry="9.5" fill="url(#${prefix}-shadow)"/>
  </g>

  <!-- GỐC NHÂN VẬT -->
  <g class="character-root">

    <!-- CHÂN & BÀN CHÂN LIỀN KHỐI (Không dùng ellipse cắt ngang cổ chân) -->
    <g class="layer-legs">
      <g class="part-leg leg-left">
        <path d="M 65 186 C 64 198 63 208 62 214 C 60 220 67 223 77 223 C 88 223 92 220 91 214 C 90 208 90 198 89 186 Z" fill="${colors.furMain}" stroke="${colors.outline}" stroke-width="3.2" stroke-linejoin="round"/>
        <path d="M 73 216 L 73 222 M 80 216 L 80 222" stroke="${colors.outline}" stroke-width="2.4" stroke-linecap="round"/>
      </g>

      <g class="part-leg leg-right">
        <path d="M 111 186 C 110 198 110 208 109 214 C 108 220 112 223 123 223 C 133 223 140 220 138 214 C 137 208 136 198 135 186 Z" fill="${colors.furMain}" stroke="${colors.outline}" stroke-width="3.2" stroke-linejoin="round"/>
        <path d="M 120 216 L 120 222 M 127 216 L 127 222" stroke="${colors.outline}" stroke-width="2.4" stroke-linecap="round"/>
      </g>
    </g>

    <!-- HỆ KHUNG THÂN (TORSO RIG) -->
    <g class="torso-rig">

      <!-- KHỐI THÂN & TRANG PHỤC (LAYER BODY) -->
      <g class="layer-body">
        <!-- Nền thân chính (tách riêng fill và nét viền hông từ nách y=136 xuống để vai liền khối với tay) -->
        <path class="body-torso" d="M ${64 - shoulderW} 122 C 74 112 126 112 ${136 + shoulderW} 122 C ${146 + torsoW} 148 ${144 + torsoW} 186 134 198 C 118 206 82 206 66 198 C ${56 - torsoW} 186 ${54 - torsoW} 148 ${64 - shoulderW} 122 Z" fill="${colors.furMain}"/>
        <path d="M ${59 - torsoW} 136 C ${55 - torsoW} 158 ${57 - torsoW} 186 66 198 C 82 206 118 206 134 198 C ${143 + torsoW} 186 ${145 + torsoW} 158 ${141 + torsoW} 136" fill="none" stroke="${colors.outline}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>

        <ellipse class="body-neck" cx="100" cy="124" rx="22" ry="8" fill="${colors.furShade}"/>

        ${isStarter ? `
          <!-- STARTER: Bụng kem trứng bầu bĩnh đáng yêu -->
          <ellipse class="body-belly" cx="100" cy="164" rx="26" ry="29" fill="${colors.furBelly}"/>
        ` : isActive ? `
          <!-- ACTIVE: Áo Tank-Top xanh lá "VIF" có viền cổ & nách trắng -->
          <path class="body-jersey" d="M 69 121 C 79 121 83 137 100 137 C 117 137 121 121 131 121 C 138 145 140 176 136 192 C 116 199 84 199 64 192 C 60 176 62 145 69 121 Z" fill="url(#${prefix}-fabric)" stroke="${colors.outline}" stroke-width="3.2" stroke-linejoin="round"/>
          <path d="M 78 122 C 84 139 116 139 122 122" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" fill="none"/>
          <path d="M 69 123 C 74 136 73 148 63 154" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" fill="none"/>
          <path d="M 131 123 C 126 136 127 148 137 154" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" fill="none"/>
          <path d="M 65 188 C 85 195 115 195 135 188" stroke="${colors.brandDark}" stroke-width="2" fill="none"/>
          <text x="100" y="164" font-size="16" font-weight="900" fill="#FFFFFF" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" letter-spacing="0.5">VIF</text>
        ` : isStrong ? `
          <!-- STRONG: Áo Gym "PRO" viền trắng + Đai lưng đen khóa xanh -->
          <path class="body-jersey" d="M 67 120 C 78 120 83 136 100 136 C 117 136 122 120 133 120 C 139 144 141 174 137 188 C 116 194 84 194 63 188 C 59 174 61 144 67 120 Z" fill="url(#${prefix}-fabric)" stroke="${colors.outline}" stroke-width="3.2" stroke-linejoin="round"/>
          <path d="M 77 121 C 84 138 116 138 123 121" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round" fill="none"/>
          <path d="M 68 122 C 74 136 73 148 62 154" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" fill="none"/>
          <path d="M 132 122 C 126 136 127 148 138 154" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" fill="none"/>
          <text x="100" y="161" font-size="15" font-weight="900" fill="#FFFFFF" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" letter-spacing="0.6">PRO</text>
          <path d="M 61 180 C 85 185 115 185 139 180 L 138 193 C 115 198 85 198 62 193 Z" fill="${colors.beltDark}" stroke="${colors.outline}" stroke-width="3" stroke-linejoin="round"/>
          <rect x="91" y="179" width="18" height="16" rx="3" fill="${colors.brandGreen}" stroke="${colors.outline}" stroke-width="2.8"/>
        ` : `
          <!-- CHAMPION: Ngực đôi & Cơ bụng 6 múi săn chắc + Đai Vô Địch Đen-Vàng -->
          <path class="body-pecs" d="M 68 136 C 68 149 82 153 99 150 C 99 142 96 134 86 131" fill="${colors.furMain}" stroke="${colors.outline}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
          <path class="body-pecs" d="M 132 136 C 132 149 118 153 101 150 C 101 142 104 134 114 131" fill="${colors.furMain}" stroke="${colors.outline}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="77" cy="144" r="1.8" fill="${colors.outline}"/>
          <circle cx="123" cy="144" r="1.8" fill="${colors.outline}"/>
          <g class="champion-abs" fill="${colors.furShade}" opacity="0.35">
            <rect x="83" y="153" width="15" height="9" rx="3"/>
            <rect x="102" y="153" width="15" height="9" rx="3"/>
            <rect x="84" y="165" width="14" height="9" rx="3"/>
            <rect x="102" y="165" width="14" height="9" rx="3"/>
          </g>
          <path d="M 100 138 L 100 176 M 83 159 C 83 154 86 153 96 153 M 117 159 C 117 154 114 153 104 153 M 84 170 C 84 165 87 164 96 164 M 116 170 C 116 165 113 164 104 164" stroke="${colors.outline}" stroke-width="2.3" stroke-linecap="round" fill="none"/>
          <path d="M 59 178 C 84 184 116 184 141 178 L 139 194 C 116 200 84 200 61 194 Z" fill="${colors.beltBlack}" stroke="${colors.outline}" stroke-width="3" stroke-linejoin="round"/>
          <rect x="67" y="182" width="10" height="8" rx="1.5" fill="url(#${prefix}-gold)" stroke="${colors.outline}" stroke-width="2"/>
          <rect x="123" y="182" width="10" height="8" rx="1.5" fill="url(#${prefix}-gold)" stroke="${colors.outline}" stroke-width="2"/>
          <circle cx="100" cy="186" r="13.5" fill="url(#${prefix}-gold)" stroke="${colors.outline}" stroke-width="3"/>
          <circle cx="100" cy="186" r="9.5" fill="${colors.goldLight}" stroke="${colors.goldDark}" stroke-width="1.5"/>
        `}
      </g>

      <!-- HUY CHƯƠNG VÔ ĐỊCH (CHAMPION MEDAL): Thuộc torso-rig, đặt TRƯỚC layer-head-group -->
      ${isChampion ? `
        <g class="acc-medal">
          <path d="M 76 118 L 97 144 L 103 144 L 124 118" fill="none" stroke="${colors.outline}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M 76 118 L 97 144 L 103 144 L 124 118" fill="none" stroke="${colors.ribbonRed}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M 76 118 L 97 144 M 124 118 L 103 144" fill="none" stroke="${colors.gold}" stroke-width="1.6" stroke-linecap="round"/>
          <circle cx="100" cy="148" r="10.5" fill="url(#${prefix}-gold)" stroke="${colors.outline}" stroke-width="2.8"/>
          <circle cx="100" cy="148" r="7" fill="${colors.goldLight}" opacity="0.6"/>
        </g>
      ` : ''}

      <!-- HỆ CÁNH TAY 2 ĐOẠN LIỀN MẠCH (OPEN-CONTOUR: KHÔNG CHẤM TRÒN Ở KHỚP, CƠ BẮP CUỒN CUỘN Ở STRONG & CHAMPION) -->
      <g class="layer-arms">
        <!-- Cánh tay trái: Pivot vai (64, 126) -->
        <g class="part-arm arm-left">
          ${isChampion ? `
            <!-- CHAMPION: Cầu vai đôi (Deltoid) + Bắp tay (Bicep) cuồn cuộn cực đô khuỳnh rộng chống nạnh -->
            <path class="upper-arm" d="M 66 118 C 52 112 37 118 35 129 C 23 133 19 145 27 155 A 10 9 0 0 0 46 149 C 53 150 60 144 62 135 L 67 128 Z" fill="${colors.furMain}"/>
            <path d="M 65 118 C 52 112 37 118 35 129 C 23 133 19 145 27 155 M 62 135 C 60 144 53 150 46 149 M 35 129 C 39 132 42 136 42 140 M 40 146 L 47 150" fill="none" stroke="${colors.outline}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>

            <g class="forearm forearm-left">
              <path class="forearm-shape" d="M 27 155 A 10 9 0 0 1 46 149 C 55 150 64 157 68 166 C 71 174 64 181 55 179 C 41 176 30 166 27 155 Z" fill="${colors.furMain}"/>
              <path d="M 27 155 C 30 166 41 176 55 179 C 64 181 71 174 68 166 C 64 157 55 150 46 149" fill="none" stroke="${colors.outline}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
              <ellipse class="paw paw-left" cx="60" cy="171" rx="6" ry="5.5" fill="${colors.furMain}"/>
              <g class="prop-dumbbell-left">
                <rect x="44" y="169" width="30" height="4.5" rx="2" fill="#94A3B8" stroke="${colors.outline}" stroke-width="2"/>
                <rect x="39" y="162" width="8" height="18" rx="2.5" fill="#334155" stroke="${colors.outline}" stroke-width="2.4"/>
                <rect x="71" y="162" width="8" height="18" rx="2.5" fill="#334155" stroke="${colors.outline}" stroke-width="2.4"/>
              </g>
            </g>
          ` : isStrong ? `
            <!-- STRONG: Vai & Bắp tay phồng to cơ bắp (Bicep bulge), cẳng tay lực lưỡng, viền mở không chấm khớp -->
            <path class="upper-arm" d="M 67 120 C 46 121 33 135 38 152 A 9.5 8.5 0 0 0 57 152 C 56 143 60 135 68 128 Z" fill="${colors.furMain}"/>
            <path d="M 65 120 C 46 121 33 135 38 152 M 60 136 C 56 142 56 147 57 152" fill="none" stroke="${colors.outline}" stroke-width="3.2" stroke-linecap="round"/>

            <g class="forearm forearm-left">
              <path class="forearm-shape" d="M 38 152 A 9.5 8.5 0 0 1 57 152 C 59 163 59 173 56 179 C 53 185 41 185 38 179 C 34 172 35 161 38 152 Z" fill="${colors.furMain}"/>
              <path d="M 38 152 C 35 161 34 172 38 179 C 41 185 53 185 56 179 C 59 173 59 163 57 152" fill="none" stroke="${colors.outline}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
              <ellipse class="paw paw-left" cx="47.5" cy="176.5" rx="6.5" ry="5.5" fill="${colors.furMain}"/>
              <path d="M 44.5 177.5 L 44.5 182 M 50 177.5 L 50 182" stroke="${colors.outline}" stroke-width="2.2" stroke-linecap="round"/>
              <g class="prop-dumbbell-left">
                <rect x="31" y="174" width="30" height="4.5" rx="2" fill="#94A3B8" stroke="${colors.outline}" stroke-width="2"/>
                <rect x="26" y="167" width="8" height="18" rx="2.5" fill="#334155" stroke="${colors.outline}" stroke-width="2.4"/>
                <rect x="58" y="167" width="8" height="18" rx="2.5" fill="#334155" stroke="${colors.outline}" stroke-width="2.4"/>
              </g>
            </g>
          ` : `
            <!-- STARTER & ACTIVE: Tay chibi thon gọn mượt mà, viền mở không chấm khớp -->
            <path class="upper-arm" d="M 66 121 C ${50 - shoulderW} 124 ${43 - shoulderW / 2} 137 43 152 A 7.5 7.5 0 0 0 58 152 C 58 142 61 134 68 128 Z" fill="${colors.furMain}"/>
            <path d="M ${64 - shoulderW / 2} 122 C ${50 - shoulderW} 125 ${43 - shoulderW / 2} 138 43 152 M 59 138 C 58 143 58 148 58 152" fill="none" stroke="${colors.outline}" stroke-width="3.2" stroke-linecap="round"/>

            <g class="forearm forearm-left">
              <path class="forearm-shape" d="M 43 152 A 7.5 7.5 0 0 1 58 152 C 58 164 58.5 174 56.5 179 C 54.5 184 44.5 184 42.5 179 C 40.5 174 41.5 164 43 152 Z" fill="${colors.furMain}"/>
              <path d="M 43 152 C 41.5 164 40.5 174 42.5 179 C 44.5 184 54.5 184 56.5 179 C 58.5 174 58 164 58 152" fill="none" stroke="${colors.outline}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
              <ellipse class="paw paw-left" cx="49.5" cy="176" rx="6" ry="5.5" fill="${colors.furMain}"/>
              ${isStarter ? `
                <circle cx="49.5" cy="177.5" r="3.2" fill="${colors.furBelly}"/>
                <circle cx="45.5" cy="173" r="1.4" fill="${colors.furBelly}"/>
                <circle cx="49.5" cy="171.8" r="1.4" fill="${colors.furBelly}"/>
                <circle cx="53.5" cy="173" r="1.4" fill="${colors.furBelly}"/>
              ` : `
                <path d="M 47 177 L 47 181.5 M 52 177 L 52 181.5" stroke="${colors.outline}" stroke-width="2" stroke-linecap="round"/>
              `}
              ${isActive ? `
                <rect x="40.5" y="162" width="18" height="7.5" rx="3" fill="${colors.brandGreen}" stroke="${colors.outline}" stroke-width="2.8"/>
              ` : ''}
              <g class="prop-dumbbell-left">
                <rect x="33" y="174" width="30" height="4.5" rx="2" fill="#94A3B8" stroke="${colors.outline}" stroke-width="2"/>
                <rect x="28" y="167" width="8" height="18" rx="2.5" fill="#334155" stroke="${colors.outline}" stroke-width="2.4"/>
                <rect x="60" y="167" width="8" height="18" rx="2.5" fill="#334155" stroke="${colors.outline}" stroke-width="2.4"/>
              </g>
            </g>
          `}
        </g>

        <!-- Cánh tay phải: Pivot vai (136, 126) -->
        <g class="part-arm arm-right">
          ${isChampion ? `
            <!-- CHAMPION: Cầu vai đôi + Bắp tay phải cuồn cuộn cực đô khuỳnh rộng chống nạnh đối xứng -->
            <path class="upper-arm" d="M 134 118 C 148 112 163 118 165 129 C 177 133 181 145 173 155 A 10 9 0 0 1 154 149 C 147 150 140 144 138 135 L 133 128 Z" fill="${colors.furMain}"/>
            <path d="M 135 118 C 148 112 163 118 165 129 C 177 133 181 145 173 155 M 138 135 C 140 144 147 150 154 149 M 165 129 C 161 132 158 136 158 140 M 160 146 L 153 150" fill="none" stroke="${colors.outline}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>

            <g class="forearm forearm-right">
              <path class="forearm-shape" d="M 154 149 A 10 9 0 0 1 173 155 C 170 166 159 176 145 179 C 136 181 129 174 132 166 C 136 157 145 150 154 149 Z" fill="${colors.furMain}"/>
              <path d="M 173 155 C 170 166 159 176 145 179 C 136 181 129 174 132 166 C 136 157 145 150 154 149" fill="none" stroke="${colors.outline}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
              <ellipse class="paw paw-right" cx="140" cy="171" rx="6" ry="5.5" fill="${colors.furMain}"/>
              <g class="prop-dumbbell-right">
                <rect x="126" y="169" width="30" height="4.5" rx="2" fill="#94A3B8" stroke="${colors.outline}" stroke-width="2"/>
                <rect x="121" y="162" width="8" height="18" rx="2.5" fill="#334155" stroke="${colors.outline}" stroke-width="2.4"/>
                <rect x="153" y="162" width="8" height="18" rx="2.5" fill="#334155" stroke="${colors.outline}" stroke-width="2.4"/>
              </g>
            </g>
          ` : isStrong ? `
            <!-- STRONG: Vai & Bắp tay phải phồng to cơ bắp, cẳng tay lực lưỡng -->
            <path class="upper-arm" d="M 133 120 C 154 121 167 135 162 152 A 9.5 8.5 0 0 1 143 152 C 144 143 140 135 132 128 Z" fill="${colors.furMain}"/>
            <path d="M 135 120 C 154 121 167 135 162 152 M 140 136 C 144 142 144 147 143 152" fill="none" stroke="${colors.outline}" stroke-width="3.2" stroke-linecap="round"/>

            <g class="forearm forearm-right">
              <path class="forearm-shape" d="M 143 152 A 9.5 8.5 0 0 1 162 152 C 165 161 166 172 162 179 C 159 185 147 185 144 179 C 141 173 141 163 143 152 Z" fill="${colors.furMain}"/>
              <path d="M 143 152 C 141 163 141 173 144 179 C 147 185 159 185 162 179 C 166 172 165 161 162 152" fill="none" stroke="${colors.outline}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
              <ellipse class="paw paw-right" cx="152.5" cy="176.5" rx="6.5" ry="5.5" fill="${colors.furMain}"/>
              <path d="M 150 177.5 L 150 182 M 155.5 177.5 L 155.5 182" stroke="${colors.outline}" stroke-width="2.2" stroke-linecap="round"/>
              <g class="prop-dumbbell-right">
                <rect x="139" y="174" width="30" height="4.5" rx="2" fill="#94A3B8" stroke="${colors.outline}" stroke-width="2"/>
                <rect x="134" y="167" width="8" height="18" rx="2.5" fill="#334155" stroke="${colors.outline}" stroke-width="2.4"/>
                <rect x="166" y="167" width="8" height="18" rx="2.5" fill="#334155" stroke="${colors.outline}" stroke-width="2.4"/>
              </g>
            </g>
          ` : `
            <!-- STARTER & ACTIVE: Tay phải chibi thon gọn mượt mà -->
            <path class="upper-arm" d="M 134 121 C ${150 + shoulderW} 124 ${157 + shoulderW / 2} 137 157 152 A 7.5 7.5 0 0 1 142 152 C 142 142 139 134 132 128 Z" fill="${colors.furMain}"/>
            <path d="M ${136 + shoulderW / 2} 122 C ${150 + shoulderW} 125 ${157 + shoulderW / 2} 138 157 152 M 141 138 C 142 143 142 148 142 152" fill="none" stroke="${colors.outline}" stroke-width="3.2" stroke-linecap="round"/>

            <g class="forearm forearm-right">
              <path class="forearm-shape" d="M 142 152 A 7.5 7.5 0 0 1 157 152 C 158.5 164 159.5 174 157.5 179 C 155.5 184 145.5 184 143.5 179 C 141.5 174 142 164 142 152 Z" fill="${colors.furMain}"/>
              <path d="M 142 152 C 142 164 141.5 174 143.5 179 C 145.5 184 155.5 184 157.5 179 C 159.5 174 158.5 164 157 152" fill="none" stroke="${colors.outline}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
              <ellipse class="paw paw-right" cx="150.5" cy="176" rx="6" ry="5.5" fill="${colors.furMain}"/>
              ${isStarter ? `
                <circle cx="150.5" cy="177.5" r="3.2" fill="${colors.furBelly}"/>
                <circle cx="146.5" cy="173" r="1.4" fill="${colors.furBelly}"/>
                <circle cx="150.5" cy="171.8" r="1.4" fill="${colors.furBelly}"/>
                <circle cx="154.5" cy="173" r="1.4" fill="${colors.furBelly}"/>
              ` : `
                <path d="M 148 177 L 148 181.5 M 153 177 L 153 181.5" stroke="${colors.outline}" stroke-width="2" stroke-linecap="round"/>
              `}
              ${isActive ? `
                <rect x="141.5" y="162" width="18" height="7.5" rx="3" fill="${colors.brandGreen}" stroke="${colors.outline}" stroke-width="2.8"/>
              ` : ''}
              <g class="prop-dumbbell-right">
                <rect x="137" y="174" width="30" height="4.5" rx="2" fill="#94A3B8" stroke="${colors.outline}" stroke-width="2"/>
                <rect x="132" y="167" width="8" height="18" rx="2.5" fill="#334155" stroke="${colors.outline}" stroke-width="2.4"/>
                <rect x="164" y="167" width="8" height="18" rx="2.5" fill="#334155" stroke="${colors.outline}" stroke-width="2.4"/>
              </g>
            </g>
          `}
        </g>
      </g>

      <!-- HỆ ĐẦU & KHUÔN MẶT (LAYER HEAD GROUP): Pivot cổ tại (100, 118) -->
      <g class="layer-head-group">
        ${isChampion ? `
          <g class="headband-tails">
            <path d="M 149 58 C 164 56 174 62 184 56 C 181 66 170 72 150 66 Z" fill="${colors.brandGreen}" stroke="${colors.outline}" stroke-width="3" stroke-linejoin="round"/>
            <path d="M 148 64 C 160 68 168 76 173 84 C 163 86 154 78 145 70 Z" fill="${colors.brandGreen}" stroke="${colors.outline}" stroke-width="3" stroke-linejoin="round"/>
          </g>
        ` : ''}

        <!-- Đôi tai gấu tròn bầu bĩnh -->
        <g class="layer-ears">
          <g class="ear-left">
            <circle cx="53" cy="43" r="21" fill="${colors.furMain}" stroke="${colors.outline}" stroke-width="3.2"/>
            <circle cx="54" cy="44" r="12.5" fill="${colors.earInner}"/>
          </g>
          <g class="ear-right">
            <circle cx="147" cy="43" r="21" fill="${colors.furMain}" stroke="${colors.outline}" stroke-width="3.2"/>
            <circle cx="146" cy="44" r="12.5" fill="${colors.earInner}"/>
          </g>
        </g>

        <!-- Khối đầu gấu -->
        ${isStarter ? `
          <ellipse class="part-head" cx="100" cy="76" rx="54" ry="45" fill="${colors.furMain}" stroke="${colors.outline}" stroke-width="3.2"/>
        ` : `
          <path class="part-head" d="M 89 32 L 94 24 L 98 30 L 104 23 L 106 31 C 135 34 154 52 154 76 C 154 102 132 121 100 121 C 68 121 46 102 46 76 C 46 52 65 34 89 32 Z" fill="${colors.furMain}" stroke="${colors.outline}" stroke-width="3.2" stroke-linejoin="round"/>
        `}

        <!-- Băng đô thể thao xanh lá -->
        ${!isStrong ? `
          <g class="head-headband">
            <path d="M 48 56 C 74 44 126 44 152 56 L 154 67 C 126 55 74 55 46 67 Z" fill="${colors.brandGreen}" stroke="${colors.outline}" stroke-width="3.2" stroke-linejoin="round"/>
            ${isActive ? `
              <circle cx="100" cy="53.5" r="3.2" fill="#FFFFFF"/>
              <circle cx="84" cy="54.8" r="2.4" fill="#FFFFFF"/>
              <circle cx="116" cy="54.8" r="2.4" fill="#FFFFFF"/>
              <circle cx="69" cy="57.5" r="2" fill="#FFFFFF"/>
              <circle cx="131" cy="57.5" r="2" fill="#FFFFFF"/>
              <circle cx="56" cy="61" r="1.6" fill="#FFFFFF"/>
              <circle cx="144" cy="61" r="1.6" fill="#FFFFFF"/>
            ` : ''}
          </g>
        ` : ''}

        <!-- Lông mày theo cấp độ -->
        ${isStrong ? `
          <path class="brow-left" d="M 70 59 L 87 65" stroke="${colors.outline}" stroke-width="3.8" stroke-linecap="round"/>
          <path class="brow-right" d="M 130 59 L 113 65" stroke="${colors.outline}" stroke-width="3.8" stroke-linecap="round"/>
        ` : isChampion ? `
          <path class="brow-left" d="M 71 62 Q 80 59 87 63" stroke="${colors.outline}" stroke-width="3.4" stroke-linecap="round" fill="none"/>
          <path class="brow-right" d="M 129 62 Q 120 59 113 63" stroke="${colors.outline}" stroke-width="3.4" stroke-linecap="round" fill="none"/>
        ` : ''}

        <!-- Má hồng phấn hai bên -->
        <ellipse cx="62" cy="84" rx="7.5" ry="4.2" fill="${colors.blush}" opacity="0.75"/>
        <ellipse cx="138" cy="84" rx="7.5" ry="4.2" fill="${colors.blush}" opacity="0.75"/>

        <!-- Mõm gấu kem sáng bầu bĩnh -->
        <ellipse class="part-snout" cx="100" cy="92" rx="23" ry="16.5" fill="${colors.snout}"/>

        <!-- Mũi gấu nâu đậm -->
        <path class="part-nose" d="M 93 84 C 96 81 104 81 107 84 C 108.5 88.5 103.5 92 100 92 C 96.5 92 91.5 88.5 93 84 Z" fill="${colors.nose}"/>
        <ellipse cx="98" cy="84.5" rx="2.2" ry="1.1" fill="#FFFFFF" opacity="0.75"/>

        <!-- Đôi mắt gấu to tròn long lanh -->
        <g class="layer-eyes">
          <g class="part-eye eye-left">
            <circle class="eye-ball" cx="80" cy="74" r="8" fill="${colors.eyes}"/>
            <circle class="eye-glint" cx="82.2" cy="71.5" r="2.8" fill="${colors.eyeHighlight}"/>
            <circle class="eye-glint-small" cx="77.5" cy="76.5" r="1.4" fill="${colors.eyeHighlight}"/>
          </g>
          <g class="part-eye eye-right">
            <circle class="eye-ball" cx="120" cy="74" r="8" fill="${colors.eyes}"/>
            <circle class="eye-glint" cx="122.2" cy="71.5" r="2.8" fill="${colors.eyeHighlight}"/>
            <circle class="eye-glint-small" cx="117.5" cy="76.5" r="1.4" fill="${colors.eyeHighlight}"/>
          </g>
        </g>

        <!-- Miệng gấu theo cấp độ & trạng thái -->
        <g class="layer-mouth">
          ${isStrong ? `
            <path class="mouth-line" d="M 95 98 L 106 95.5" stroke="${colors.nose}" stroke-width="2.8" stroke-linecap="round" fill="none"/>
          ` : isChampion ? `
            <line x1="100" y1="91" x2="100" y2="96" stroke="${colors.nose}" stroke-width="2.6" stroke-linecap="round"/>
            <path class="mouth-line" d="M 92 97 Q 101 103 109 95" stroke="${colors.nose}" stroke-width="2.8" stroke-linecap="round" fill="none"/>
          ` : `
            <line x1="100" y1="91" x2="100" y2="97" stroke="${colors.nose}" stroke-width="2.6" stroke-linecap="round"/>
            <path class="mouth-line" d="M 91 96.5 Q 95.5 102 100 97 Q 104.5 102 109 96.5" stroke="${colors.nose}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          `}
          <path class="mouth-open" d="M 91 96 C 91 109 109 109 109 96 Z" fill="#A82020" stroke="${colors.nose}" stroke-width="2.2" stroke-linejoin="round"/>
          <path class="mouth-tongue" d="M 94 102 C 97 99.5 103 99.5 106 102 C 105 107 95 107 94 102 Z" fill="#FF8A8A"/>
        </g>

        <!-- Bong bóng suy nghĩ (Thinking State) -->
        <g class="acc-thinking-bubbles">
          <circle cx="148" cy="36" r="4" fill="#FFFFFF" stroke="${colors.outline}" stroke-width="2"/>
          <circle cx="158" cy="24" r="6.5" fill="#FFFFFF" stroke="${colors.outline}" stroke-width="2"/>
          <circle cx="174" cy="15" r="10.5" fill="#FFFFFF" stroke="${colors.outline}" stroke-width="2"/>
          <text x="174" y="18.5" font-size="10" font-weight="900" fill="${colors.brandGreen}" text-anchor="middle">...</text>
        </g>
      </g>

      <!-- SVG DEBUG JOINT MARKERS (Chỉ hiện khi bật nút Debug) -->
      <g class="joint-markers">
        <circle class="joint-marker" cx="64" cy="126" r="2.2" title="Shoulder Left"/>
        <circle class="joint-marker" cx="50" cy="152" r="2" title="Elbow Left"/>
        <circle class="joint-marker" cx="136" cy="126" r="2.2" title="Shoulder Right"/>
        <circle class="joint-marker" cx="150" cy="152" r="2" title="Elbow Right"/>
        <circle class="joint-marker" cx="100" cy="118" r="2.2" title="Neck"/>
        <circle class="joint-marker" cx="76" cy="196" r="2" title="Hip Left"/>
        <circle class="joint-marker" cx="124" cy="196" r="2" title="Hip Right"/>
      </g>
    </g>
  </g>
</svg>
`;
}
