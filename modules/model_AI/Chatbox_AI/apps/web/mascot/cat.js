/**
 * VisionFit Mascot - Cat (Mèo VIF)
 * Thiết kế Chibi Kawaii Mèo Mướp Cam Liền Khối (Seamless Open-Contour Vector Rig)
 * - Đã loại bỏ hoàn toàn các hình tròn (<circle>, <ellipse> viền kín) gây hiện tượng "nổi chấm/cục ở khớp"
 *   tại Vai, Khuỷu tay, Cổ tay và Cổ chân.
 * - Viền cánh tay (upper-arm & forearm) dùng nét mở (open contour) chỉ viền 2 cạnh ngoài và lòng bàn tay,
 *   đầu khớp dùng vòm tròn đồng màu lông ẩn bên trong giúp tay liền một dải mượt mà.
 */

export function renderCatSVG(stageOrConfig = 'starter', stateArg = 'idle', optionsArg = {}) {
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

  const prefix = options.idPrefix || options.instanceId || ('vif-c-' + Math.random().toString(36).slice(2, 8));

  const colors = {
    outline: '#4A2511',      // Viền nâu đậm chuẩn Kawaii Vector
    furMain: '#F48B3E',      // Lông cam gừng tươi tắn
    furStripe: '#C85617',    // Vằn mèo mướp cam đậm (trán, má, đuôi)
    furShade: '#D96E26',     // Bóng lông cam
    furBelly: '#FFF3E0',     // Bụng & cơ bụng kem sữa sáng
    furCream: '#FFF3E0',     // Khai báo đầy đủ chống lỗi undefined -> màu đen
    furWhite: '#FFF3E0',     // Bàn tay & chóp đuôi trắng kem
    earInner: '#F69A94',     // Lòng tai hồng đào
    snout: '#FFF3E0',        // Mõm mèo trắng kem
    nose: '#F27878',         // Mũi tam giác hồng cam
    eyes: '#381C0E',         // Mắt to tròn long lanh
    eyeHighlight: '#FFFFFF',
    blush: '#F47C7C',        // Má hồng
    whiskers: '#4A2511',     // Râu mèo sắc nét
    brandGreen: '#168B67',   // Xanh lá thể thao VisionFit
    brandDark: '#0E6349',
    brandLight: '#8CE9BF',
    beltDark: '#24303E',     // Đai thắt nút cấp Strong
    beltBlack: '#1E242B',    // Đai vô địch cấp Champion
    gold: '#F7C948',         // Vàng kim Champion
    goldLight: '#FFE885',
    goldDark: '#D49B1A',
    ribbonRed: '#D93829'     // Dây đeo huy chương đỏ-vàng
  };

  const isStarter = stage === 'starter';
  const isActive = stage === 'active';
  const isStrong = stage === 'strong';
  const isChampion = stage === 'champion';

  const shoulderW = isChampion ? 4.5 : isStrong ? 3.5 : isActive ? 1.5 : 0;
  const torsoW = isChampion ? 3.5 : isStrong ? 2.5 : isActive ? 1 : 0;

  return `
<svg class="vif-mascot-svg species-cat stage-${stage} state-${state}" viewBox="0 0 200 240" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Linh vật Mèo VisionFit cấp độ ${stage} trạng thái ${state}" data-species="cat" data-stage="${stage}" data-state="${state}">
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
    <ellipse cx="100" cy="224" rx="48" ry="9" fill="url(#${prefix}-shadow)"/>
  </g>

  <!-- GỐC NHÂN VẬT -->
  <g class="character-root">

    <!-- ĐUÔI MÈO CONG UỐN LƯỢN (LAYER TAIL): Pivot tại (130, 190) -->
    <g class="layer-tail">
      <path class="part-tail" d="M 130 194 C 156 196 174 176 174 150 C 174 134 162 132 161 144 C 160 162 148 182 128 184 Z" fill="${colors.furMain}" stroke="${colors.outline}" stroke-width="3.2" stroke-linejoin="round"/>
      <path d="M 150 185 C 154 180 158 182 156 188" stroke="${colors.furStripe}" stroke-width="3" stroke-linecap="round" fill="none"/>
      <path d="M 162 172 C 166 168 171 170 169 175" stroke="${colors.furStripe}" stroke-width="3" stroke-linecap="round" fill="none"/>
      ${!isStarter ? `
        <path d="M 174 152 C 174 134 162 132 161 144 C 161 149 167 153 174 152 Z" fill="${colors.furWhite}" stroke="${colors.outline}" stroke-width="3" stroke-linejoin="round"/>
      ` : ''}
    </g>

    <!-- CHÂN & BÀN CHÂN LIỀN KHỐI (Không dùng ellipse cắt ngang cổ chân) -->
    <g class="layer-legs">
      <g class="part-leg leg-left">
        <path d="M 68 186 C 67 198 66 208 65 214 C 63 220 69 223 78 223 C 88 223 91 220 90 214 C 89 208 89 198 88 186 Z" fill="${colors.furMain}" stroke="${colors.outline}" stroke-width="3.2" stroke-linejoin="round"/>
        <path d="M 74 216 L 74 222 M 80 216 L 80 222" stroke="${colors.outline}" stroke-width="2.2" stroke-linecap="round"/>
      </g>

      <g class="part-leg leg-right">
        <path d="M 112 186 C 111 198 111 208 110 214 C 109 220 112 223 122 223 C 131 223 137 220 135 214 C 134 208 133 198 132 186 Z" fill="${colors.furMain}" stroke="${colors.outline}" stroke-width="3.2" stroke-linejoin="round"/>
        <path d="M 120 216 L 120 222 M 126 216 L 126 222" stroke="${colors.outline}" stroke-width="2.2" stroke-linecap="round"/>
      </g>
    </g>

    <!-- HỆ KHUNG THÂN (TORSO RIG) -->
    <g class="torso-rig">

      <!-- KHỐI THÂN & TRANG PHỤC (LAYER BODY) -->
      <g class="layer-body">
        <path class="body-torso" d="M ${66 - shoulderW} 123 C 75 113 125 113 ${134 + shoulderW} 123 C ${143 + torsoW} 148 ${141 + torsoW} 186 132 197 C 116 205 84 205 68 197 C ${59 - torsoW} 186 ${57 - torsoW} 148 ${66 - shoulderW} 123 Z" fill="${colors.furMain}"/>
        <path d="M ${61 - torsoW} 136 C ${58 - torsoW} 158 ${59 - torsoW} 186 68 197 C 84 205 116 205 132 197 C ${141 + torsoW} 186 ${142 + torsoW} 158 ${139 + torsoW} 136" fill="none" stroke="${colors.outline}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>

        <ellipse class="body-neck" cx="100" cy="123" rx="20" ry="7" fill="${colors.furShade}"/>

        ${isStarter ? `
          <!-- STARTER: Bụng kem sữa lớn mềm mại + Vòng cổ xanh lá chuẩn mẫu -->
          <ellipse class="body-belly" cx="100" cy="165" rx="23" ry="27" fill="${colors.furBelly}"/>
          <path d="M 73 121 C 86 128 114 128 127 121 L 129 127 C 114 135 86 135 71 127 Z" fill="${colors.brandGreen}" stroke="${colors.outline}" stroke-width="2.8" stroke-linejoin="round"/>
        ` : isActive ? `
          <!-- ACTIVE: Áo Tank-Top xanh lá "VIF" viền cổ trắng -->
          <path class="body-jersey" d="M 71 122 C 80 122 85 137 100 137 C 115 137 120 122 129 122 C 135 145 137 175 133 190 C 115 197 85 197 67 190 C 63 175 65 145 71 122 Z" fill="url(#${prefix}-fabric)" stroke="${colors.outline}" stroke-width="3.2" stroke-linejoin="round"/>
          <path d="M 79 123 C 85 139 115 139 121 123" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" fill="none"/>
          <path d="M 71 124 C 76 136 74 147 65 153" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" fill="none"/>
          <path d="M 129 124 C 124 136 126 147 135 153" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" fill="none"/>
          <text x="100" y="164" font-size="15.5" font-weight="900" fill="#FFFFFF" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" letter-spacing="0.5">VIF</text>
        ` : isStrong ? `
          <!-- STRONG: Áo Gym "SPEED" viền trắng + Đai đen thắt nút võ thuật/thể lực -->
          <path class="body-jersey" d="M 69 121 C 79 121 84 136 100 136 C 116 136 121 121 131 121 C 137 144 139 173 135 187 C 115 193 85 193 65 187 C 61 173 63 144 69 121 Z" fill="url(#${prefix}-fabric)" stroke="${colors.outline}" stroke-width="3.2" stroke-linejoin="round"/>
          <path d="M 78 122 C 84 138 116 138 122 122" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" fill="none"/>
          <path d="M 70 123 C 75 135 74 146 64 152" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" fill="none"/>
          <path d="M 130 123 C 125 135 126 146 136 152" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" fill="none"/>
          <text x="100" y="160" font-size="12" font-weight="900" fill="#FFFFFF" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" letter-spacing="0.4">SPEED</text>
          <path d="M 64 179 C 85 184 115 184 136 179 L 135 190 C 115 195 85 195 65 190 Z" fill="${colors.beltDark}" stroke="${colors.outline}" stroke-width="3" stroke-linejoin="round"/>
          <path d="M 96 186 L 89 203 L 97 204 L 101 189 Z" fill="${colors.beltDark}" stroke="${colors.outline}" stroke-width="2.8" stroke-linejoin="round"/>
          <path d="M 104 186 L 111 203 L 103 204 L 99 189 Z" fill="${colors.beltDark}" stroke="${colors.outline}" stroke-width="2.8" stroke-linejoin="round"/>
          <rect x="94" y="180" width="12" height="11" rx="3" fill="${colors.beltDark}" stroke="${colors.outline}" stroke-width="2.8"/>
        ` : `
          <!-- CHAMPION: Ngực & Bụng 6 múi trắng kem săn chắc + Đai Vô Địch Đen-Vàng -->
          <path d="M 73 136 C 73 128 127 128 127 136 L 125 184 L 75 184 Z" fill="${colors.furCream}"/>
          <path class="body-pecs" d="M 72 136 C 72 149 84 152 99 149" fill="none" stroke="${colors.furShade}" stroke-width="2.4" stroke-linecap="round"/>
          <path class="body-pecs" d="M 128 136 C 128 149 116 152 101 149" fill="none" stroke="${colors.furShade}" stroke-width="2.4" stroke-linecap="round"/>
          <circle cx="80" cy="143" r="1.5" fill="${colors.furShade}"/>
          <circle cx="120" cy="143" r="1.5" fill="${colors.furShade}"/>
          <rect x="84" y="153" width="14" height="9" rx="2.5" fill="#FDE6C4" stroke="${colors.furShade}" stroke-width="1.6"/>
          <rect x="102" y="153" width="14" height="9" rx="2.5" fill="#FDE6C4" stroke="${colors.furShade}" stroke-width="1.6"/>
          <rect x="85" y="165" width="13" height="8.5" rx="2.5" fill="#FDE6C4" stroke="${colors.furShade}" stroke-width="1.6"/>
          <rect x="102" y="165" width="13" height="8.5" rx="2.5" fill="#FDE6C4" stroke="${colors.furShade}" stroke-width="1.6"/>
          <path d="M 62 178 C 85 184 115 184 138 178 L 136 193 C 115 199 85 199 64 193 Z" fill="${colors.beltBlack}" stroke="${colors.outline}" stroke-width="3" stroke-linejoin="round"/>
          <rect x="69" y="181.5" width="9" height="7.5" rx="1.5" fill="url(#${prefix}-gold)" stroke="${colors.outline}" stroke-width="2"/>
          <rect x="122" y="181.5" width="9" height="7.5" rx="1.5" fill="url(#${prefix}-gold)" stroke="${colors.outline}" stroke-width="2"/>
          <circle cx="100" cy="185.5" r="12.5" fill="url(#${prefix}-gold)" stroke="${colors.outline}" stroke-width="3"/>
          <circle cx="100" cy="185.5" r="8.5" fill="${colors.goldLight}" stroke="${colors.goldDark}" stroke-width="1.4"/>
        `}
      </g>

      <!-- HUY CHƯƠNG VÔ ĐỊCH (CHAMPION MEDAL): Thuộc torso-rig, đặt TRƯỚC layer-head-group -->
      ${isChampion ? `
        <g class="acc-medal">
          <path d="M 78 118 L 97 143 L 103 143 L 122 118" fill="none" stroke="${colors.outline}" stroke-width="7.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M 78 118 L 97 143 L 103 143 L 122 118" fill="none" stroke="${colors.ribbonRed}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M 78 118 L 97 143 M 122 118 L 103 143" fill="none" stroke="${colors.gold}" stroke-width="1.5" stroke-linecap="round"/>
          <circle cx="100" cy="147" r="10" fill="url(#${prefix}-gold)" stroke="${colors.outline}" stroke-width="2.8"/>
          <circle cx="100" cy="147" r="6.5" fill="${colors.goldLight}" opacity="0.65"/>
        </g>
      ` : ''}

      <!-- HỆ CÁNH TAY 2 ĐOẠN LIỀN MẠCH (OPEN-CONTOUR: KHÔNG CHẤM TRÒN Ở KHỚP, CƠ BẮP SĂN CHẮC Ở STRONG & CHAMPION) -->
      <g class="layer-arms">
        <!-- Cánh tay trái -->
        <g class="part-arm arm-left">
          ${isChampion ? `
            <!-- CHAMPION: Cầu vai đôi + Bắp tay mèo cuồn cuộn cực đô khuỳnh rộng chống nạnh -->
            <path class="upper-arm" d="M 67 119 C 54 113 39 119 37 129 C 26 133 22 145 29 154 A 9.5 8.5 0 0 0 47 148 C 54 149 60 143 62 135 L 68 128 Z" fill="${colors.furMain}"/>
            <path d="M 66 119 C 54 113 39 119 37 129 C 26 133 22 145 29 154 M 62 135 C 60 143 54 149 47 148 M 37 129 C 41 132 44 136 44 140 M 42 145 L 48 149" fill="none" stroke="${colors.outline}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>

            <g class="forearm forearm-left">
              <path class="forearm-shape" d="M 29 154 A 9.5 8.5 0 0 1 47 148 C 56 149 65 157 68 165 C 71 173 64 180 55 178 C 42 175 32 165 29 154 Z" fill="${colors.furMain}"/>
              <path d="M 29 154 C 32 165 42 175 55 178 C 64 180 71 173 68 165 C 65 157 56 149 47 148" fill="none" stroke="${colors.outline}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
              <ellipse class="paw paw-left" cx="61" cy="170.5" rx="5.5" ry="5" fill="${colors.furMain}"/>
              <g class="prop-dumbbell-left">
                <rect x="46" y="168" width="28" height="4" rx="2" fill="#94A3B8" stroke="${colors.outline}" stroke-width="2"/>
                <rect x="41" y="161" width="7.5" height="17" rx="2.5" fill="#334155" stroke="${colors.outline}" stroke-width="2.4"/>
                <rect x="71.5" y="161" width="7.5" height="17" rx="2.5" fill="#334155" stroke="${colors.outline}" stroke-width="2.4"/>
              </g>
            </g>
          ` : isStrong ? `
            <!-- STRONG: Vai & Bắp tay mèo săn chắc phồng cơ bắp, viền mở không chấm khớp -->
            <path class="upper-arm" d="M 68 121 C 49 122 37 136 41 152 A 8.5 8 0 0 0 58 152 C 57 143 60 135 69 128 Z" fill="${colors.furMain}"/>
            <path d="M 66 121 C 49 122 37 136 41 152 M 61 136 C 58 142 57 147 58 152" fill="none" stroke="${colors.outline}" stroke-width="3.2" stroke-linecap="round"/>

            <g class="forearm forearm-left">
              <path class="forearm-shape" d="M 41 152 A 8.5 8 0 0 1 58 152 C 59.5 163 59.5 173 57 178.5 C 54.5 184 43.5 184 41 178.5 C 37.5 172 38.5 161 41 152 Z" fill="${colors.furMain}"/>
              <path d="M 41 152 C 38.5 161 37.5 172 41 178.5 C 43.5 184 54.5 184 57 178.5 C 59.5 173 59.5 163 58 152" fill="none" stroke="${colors.outline}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
              <ellipse class="paw paw-left" cx="49" cy="176.5" rx="6" ry="5" fill="${colors.furMain}"/>
              <path d="M 46.5 177 L 46.5 181.5 M 51.5 177 L 51.5 181.5" stroke="${colors.outline}" stroke-width="2" stroke-linecap="round"/>
              <g class="prop-dumbbell-left">
                <rect x="33" y="174" width="28" height="4" rx="2" fill="#94A3B8" stroke="${colors.outline}" stroke-width="2"/>
                <rect x="28" y="167" width="7.5" height="17" rx="2.5" fill="#334155" stroke="${colors.outline}" stroke-width="2.4"/>
                <rect x="58.5" y="167" width="7.5" height="17" rx="2.5" fill="#334155" stroke="${colors.outline}" stroke-width="2.4"/>
              </g>
            </g>
          ` : `
            <!-- STARTER & ACTIVE: Tay mèo thon gọn mượt mà, viền mở không chấm khớp -->
            <path class="upper-arm" d="M 67 122 C ${52 - shoulderW} 125 ${45 - shoulderW / 2} 138 44.5 152 A 6.8 6.8 0 0 0 58 152 C 58 142 61 134 69 128 Z" fill="${colors.furMain}"/>
            <path d="M ${65 - shoulderW / 2} 123 C ${52 - shoulderW} 126 ${45 - shoulderW / 2} 138 44.5 152 M 60 138 C 58.5 143 58 148 58 152" fill="none" stroke="${colors.outline}" stroke-width="3.2" stroke-linecap="round"/>

            <g class="forearm forearm-left">
              <path class="forearm-shape" d="M 44.5 152 A 6.8 6.8 0 0 1 58 152 C 58 164 58.5 173 56.5 178.5 C 54.5 183.5 45.5 183.5 43.5 178.5 C 41.5 173 43 164 44.5 152 Z" fill="${colors.furMain}"/>
              <ellipse class="paw paw-left" cx="50" cy="176.5" rx="5.8" ry="5" fill="${isStarter ? colors.furWhite : colors.furMain}"/>
              <path d="M 44.5 152 C 43 164 41.5 173 43.5 178.5 C 45.5 183.5 54.5 183.5 56.5 178.5 C 58.5 173 58 164 58 152" fill="none" stroke="${colors.outline}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M 47.5 177 L 47.5 181.5 M 52.5 177 L 52.5 181.5" stroke="${colors.outline}" stroke-width="2" stroke-linecap="round"/>
              ${isActive ? `
                <rect x="41.5" y="162" width="17" height="7.5" rx="3" fill="${colors.brandGreen}" stroke="${colors.outline}" stroke-width="2.8"/>
              ` : ''}
              <g class="prop-dumbbell-left">
                <rect x="34" y="174" width="28" height="4" rx="2" fill="#94A3B8" stroke="${colors.outline}" stroke-width="2"/>
                <rect x="29" y="167" width="7.5" height="17" rx="2.5" fill="#334155" stroke="${colors.outline}" stroke-width="2.4"/>
                <rect x="59.5" y="167" width="7.5" height="17" rx="2.5" fill="#334155" stroke="${colors.outline}" stroke-width="2.4"/>
              </g>
            </g>
          `}
        </g>

        <!-- Cánh tay phải -->
        <g class="part-arm arm-right">
          ${isChampion ? `
            <!-- CHAMPION: Cầu vai đôi + Bắp tay phải mèo cuồn cuộn cực đô khuỳnh rộng chống nạnh đối xứng -->
            <path class="upper-arm" d="M 133 119 C 146 113 161 119 163 129 C 174 133 178 145 171 154 A 9.5 8.5 0 0 1 153 148 C 146 149 140 143 138 135 L 132 128 Z" fill="${colors.furMain}"/>
            <path d="M 134 119 C 146 113 161 119 163 129 C 174 133 178 145 171 154 M 138 135 C 140 143 146 149 153 148 M 163 129 C 159 132 156 136 156 140 M 158 145 L 152 149" fill="none" stroke="${colors.outline}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>

            <g class="forearm forearm-right">
              <path class="forearm-shape" d="M 153 148 A 9.5 8.5 0 0 1 171 154 C 168 165 158 175 145 178 C 136 180 129 173 132 165 C 135 157 144 149 153 148 Z" fill="${colors.furMain}"/>
              <path d="M 171 154 C 168 165 158 175 145 178 C 136 180 129 173 132 165 C 135 157 144 149 153 148" fill="none" stroke="${colors.outline}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
              <ellipse class="paw paw-right" cx="139" cy="170.5" rx="5.5" ry="5" fill="${colors.furMain}"/>
              <g class="prop-dumbbell-right">
                <rect x="126" y="168" width="28" height="4" rx="2" fill="#94A3B8" stroke="${colors.outline}" stroke-width="2"/>
                <rect x="121" y="161" width="7.5" height="17" rx="2.5" fill="#334155" stroke="${colors.outline}" stroke-width="2.4"/>
                <rect x="151.5" y="161" width="7.5" height="17" rx="2.5" fill="#334155" stroke="${colors.outline}" stroke-width="2.4"/>
              </g>
            <g class="prop-water-bottle">
              <rect x="142" y="156" width="16" height="25" rx="4" fill="#38BDF8" stroke="${colors.outline}" stroke-width="2"/>
              <rect x="144" y="164" width="12" height="15" rx="2" fill="#0284C7"/>
              <line x1="145" y1="168" x2="148" y2="168" stroke="#FFFFFF" stroke-width="1.2" stroke-linecap="round"/>
              <line x1="145" y1="172" x2="149" y2="172" stroke="#FFFFFF" stroke-width="1.2" stroke-linecap="round"/>
              <line x1="145" y1="176" x2="148" y2="176" stroke="#FFFFFF" stroke-width="1.2" stroke-linecap="round"/>
              <rect x="143" y="152" width="14" height="5" rx="1.5" fill="#1E293B" stroke="${colors.outline}" stroke-width="1.8"/>
              <rect x="147" y="148" width="6" height="5" rx="1.2" fill="#168B67" stroke="${colors.outline}" stroke-width="1.5"/>
            </g>
            </g>
          ` : isStrong ? `
            <!-- STRONG: Vai & Bắp tay phải mèo săn chắc phồng cơ bắp -->
            <path class="upper-arm" d="M 132 121 C 151 122 163 136 159 152 A 8.5 8 0 0 1 142 152 C 143 143 140 135 131 128 Z" fill="${colors.furMain}"/>
            <path d="M 134 121 C 151 122 163 136 159 152 M 139 136 C 142 142 143 147 142 152" fill="none" stroke="${colors.outline}" stroke-width="3.2" stroke-linecap="round"/>

            <g class="forearm forearm-right">
              <path class="forearm-shape" d="M 142 152 A 8.5 8 0 0 1 159 152 C 161.5 161 162.5 172 159 178.5 C 156.5 184 145.5 184 143 178.5 C 140.5 173 140.5 163 142 152 Z" fill="${colors.furMain}"/>
              <path d="M 142 152 C 140.5 163 140.5 173 143 178.5 C 145.5 184 156.5 184 159 178.5 C 162.5 172 161.5 161 159 152" fill="none" stroke="${colors.outline}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
              <ellipse class="paw paw-right" cx="151" cy="176.5" rx="6" ry="5" fill="${colors.furMain}"/>
              <path d="M 148.5 177 L 148.5 181.5 M 153.5 177 L 153.5 181.5" stroke="${colors.outline}" stroke-width="2" stroke-linecap="round"/>
              <g class="prop-dumbbell-right">
                <rect x="139" y="174" width="28" height="4" rx="2" fill="#94A3B8" stroke="${colors.outline}" stroke-width="2"/>
                <rect x="134" y="167" width="7.5" height="17" rx="2.5" fill="#334155" stroke="${colors.outline}" stroke-width="2.4"/>
                <rect x="164.5" y="167" width="7.5" height="17" rx="2.5" fill="#334155" stroke="${colors.outline}" stroke-width="2.4"/>
              </g>
            <g class="prop-water-bottle">
              <rect x="142" y="156" width="16" height="25" rx="4" fill="#38BDF8" stroke="${colors.outline}" stroke-width="2"/>
              <rect x="144" y="164" width="12" height="15" rx="2" fill="#0284C7"/>
              <line x1="145" y1="168" x2="148" y2="168" stroke="#FFFFFF" stroke-width="1.2" stroke-linecap="round"/>
              <line x1="145" y1="172" x2="149" y2="172" stroke="#FFFFFF" stroke-width="1.2" stroke-linecap="round"/>
              <line x1="145" y1="176" x2="148" y2="176" stroke="#FFFFFF" stroke-width="1.2" stroke-linecap="round"/>
              <rect x="143" y="152" width="14" height="5" rx="1.5" fill="#1E293B" stroke="${colors.outline}" stroke-width="1.8"/>
              <rect x="147" y="148" width="6" height="5" rx="1.2" fill="#168B67" stroke="${colors.outline}" stroke-width="1.5"/>
            </g>
            </g>
          ` : `
            <!-- STARTER & ACTIVE: Tay phải mèo thon gọn mượt mà -->
            <path class="upper-arm" d="M 133 122 C ${148 + shoulderW} 125 ${155 + shoulderW / 2} 138 155.5 152 A 6.8 6.8 0 0 1 142 152 C 142 142 139 134 131 128 Z" fill="${colors.furMain}"/>
            <path d="M ${135 + shoulderW / 2} 123 C ${148 + shoulderW} 126 ${155 + shoulderW / 2} 138 155.5 152 M 140 138 C 141.5 143 142 148 142 152" fill="none" stroke="${colors.outline}" stroke-width="3.2" stroke-linecap="round"/>

            <g class="forearm forearm-right">
              <path class="forearm-shape" d="M 142 152 A 6.8 6.8 0 0 1 155.5 152 C 157 164 158.5 173 156.5 178.5 C 154.5 183.5 145.5 183.5 143.5 178.5 C 141.5 173 142 164 142 152 Z" fill="${colors.furMain}"/>
              <ellipse class="paw paw-right" cx="150" cy="176.5" rx="5.8" ry="5" fill="${isStarter ? colors.furWhite : colors.furMain}"/>
              <path d="M 142 152 C 142 164 141.5 173 143.5 178.5 C 145.5 183.5 154.5 183.5 156.5 178.5 C 158.5 173 157 164 155.5 152" fill="none" stroke="${colors.outline}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M 147.5 177 L 147.5 181.5 M 152.5 177 L 152.5 181.5" stroke="${colors.outline}" stroke-width="2" stroke-linecap="round"/>
              ${isActive ? `
                <rect x="141.5" y="162" width="17" height="7.5" rx="3" fill="${colors.brandGreen}" stroke="${colors.outline}" stroke-width="2.8"/>
              ` : ''}
              <g class="prop-dumbbell-right">
                <rect x="138" y="174" width="28" height="4" rx="2" fill="#94A3B8" stroke="${colors.outline}" stroke-width="2"/>
                <rect x="133" y="167" width="7.5" height="17" rx="2.5" fill="#334155" stroke="${colors.outline}" stroke-width="2.4"/>
                <rect x="163.5" y="167" width="7.5" height="17" rx="2.5" fill="#334155" stroke="${colors.outline}" stroke-width="2.4"/>
              </g>
            <g class="prop-water-bottle">
              <rect x="142" y="156" width="16" height="25" rx="4" fill="#38BDF8" stroke="${colors.outline}" stroke-width="2"/>
              <rect x="144" y="164" width="12" height="15" rx="2" fill="#0284C7"/>
              <line x1="145" y1="168" x2="148" y2="168" stroke="#FFFFFF" stroke-width="1.2" stroke-linecap="round"/>
              <line x1="145" y1="172" x2="149" y2="172" stroke="#FFFFFF" stroke-width="1.2" stroke-linecap="round"/>
              <line x1="145" y1="176" x2="148" y2="176" stroke="#FFFFFF" stroke-width="1.2" stroke-linecap="round"/>
              <rect x="143" y="152" width="14" height="5" rx="1.5" fill="#1E293B" stroke="${colors.outline}" stroke-width="1.8"/>
              <rect x="147" y="148" width="6" height="5" rx="1.2" fill="#168B67" stroke="${colors.outline}" stroke-width="1.5"/>
            </g>
            </g>
          `}
        </g>
      </g>

      <!-- HỆ ĐẦU & KHUÔN MẶT (LAYER HEAD GROUP): Pivot cổ tại (100, 118) -->
      <g class="layer-head-group">
        ${isChampion ? `
          <g class="headband-tails">
            <path d="M 146 58 C 162 56 172 62 182 56 C 179 66 168 72 148 66 Z" fill="${colors.brandGreen}" stroke="${colors.outline}" stroke-width="3" stroke-linejoin="round"/>
            <path d="M 145 64 C 157 68 165 76 170 84 C 160 86 151 78 142 70 Z" fill="${colors.brandGreen}" stroke="${colors.outline}" stroke-width="3" stroke-linejoin="round"/>
          </g>
        ` : ''}

        <!-- Đôi tai mèo nhọn vểnh cao chuẩn mẫu -->
        <g class="layer-ears">
          <g class="ear-left">
            <path d="M 50 66 L 54 22 L 88 44 Z" fill="${colors.furMain}" stroke="${colors.outline}" stroke-width="3.2" stroke-linejoin="round"/>
            <path d="M 55 60 L 58 30 L 81 45 Z" fill="${colors.earInner}"/>
          </g>
          <g class="ear-right">
            <path d="M 150 66 L 146 22 L 112 44 Z" fill="${colors.furMain}" stroke="${colors.outline}" stroke-width="3.2" stroke-linejoin="round"/>
            <path d="M 145 60 L 142 30 L 119 45 Z" fill="${colors.earInner}"/>
          </g>
        </g>

        <!-- Khối đầu mèo bầu bĩnh -->
        <ellipse class="part-head" cx="100" cy="77" rx="51" ry="42" fill="${colors.furMain}" stroke="${colors.outline}" stroke-width="3.2"/>

        <!-- 3 Sọc vằn mèo mướp trên trán -->
        <g class="tabby-forehead-stripes" fill="${colors.furStripe}">
          <path d="M 97 35 L 103 35 L 101.5 49 L 98.5 49 Z"/>
          <path d="M 84 37 L 89 36 L 91 49 L 87 49 Z"/>
          <path d="M 116 37 L 111 36 L 109 49 L 113 49 Z"/>
        </g>

        <!-- Vằn mèo mướp 2 bên má -->
        <g class="tabby-cheek-stripes" stroke="${colors.furStripe}" stroke-width="4" stroke-linecap="round">
          <path d="M 51 78 L 62 80"/>
          <path d="M 53 87 L 64 87"/>
          <path d="M 149 78 L 138 80"/>
          <path d="M 147 87 L 136 87"/>
        </g>

        <!-- Băng đô thể thao xanh lá trên trán -->
        <g class="head-headband">
          <path d="M 50 56 C 75 45 125 45 150 56 L 152 66 C 125 55 75 55 48 66 Z" fill="${colors.brandGreen}" stroke="${colors.outline}" stroke-width="3.2" stroke-linejoin="round"/>
          ${isActive ? `
            <circle cx="100" cy="53.5" r="3" fill="#FFFFFF"/>
            <circle cx="84" cy="54.8" r="2.3" fill="#FFFFFF"/>
            <circle cx="116" cy="54.8" r="2.3" fill="#FFFFFF"/>
            <circle cx="70" cy="57.5" r="1.9" fill="#FFFFFF"/>
            <circle cx="130" cy="57.5" r="1.9" fill="#FFFFFF"/>
            <circle cx="57" cy="60.5" r="1.5" fill="#FFFFFF"/>
            <circle cx="143" cy="60.5" r="1.5" fill="#FFFFFF"/>
          ` : isStrong ? `
            <path d="M 51 59 C 75 49 125 49 149 59" stroke="${colors.brandLight}" stroke-width="2" fill="none"/>
            <path d="M 50 63 C 75 53 125 53 150 63" stroke="${colors.brandLight}" stroke-width="2" fill="none"/>
            <circle cx="100" cy="54.5" r="3" fill="#FFFFFF"/>
          ` : ''}
        </g>

        <!-- Lông mày theo cấp độ -->
        ${isStrong || isChampion ? `
          <path class="brow-left" d="M 72 60 L 87 65" stroke="${colors.outline}" stroke-width="3.6" stroke-linecap="round"/>
          <path class="brow-right" d="M 128 60 L 113 65" stroke="${colors.outline}" stroke-width="3.6" stroke-linecap="round"/>
        ` : ''}

        <!-- Má hồng phấn -->
        <ellipse cx="67" cy="84" rx="6.5" ry="3.8" fill="${colors.blush}" opacity="0.75"/>
        <ellipse cx="133" cy="84" rx="6.5" ry="3.8" fill="${colors.blush}" opacity="0.75"/>

        <!-- Mõm mèo trắng kem bầu bĩnh -->
        <ellipse class="part-snout" cx="100" cy="92" rx="18" ry="13.5" fill="${colors.snout}"/>

        <!-- Mũi mèo hồng tam giác ngược -->
        <polygon class="part-nose" points="95,85 105,85 100,90.5" fill="${colors.nose}"/>

        <!-- Râu mèo 2 bên má (LAYER WHISKERS) -->
        <g class="layer-whiskers">
          <line x1="60" y1="79" x2="40" y2="76" stroke="${colors.whiskers}" stroke-width="2.2" stroke-linecap="round"/>
          <line x1="60" y1="86" x2="39" y2="88" stroke="${colors.whiskers}" stroke-width="2.2" stroke-linecap="round"/>
          <line x1="140" y1="79" x2="160" y2="76" stroke="${colors.whiskers}" stroke-width="2.2" stroke-linecap="round"/>
          <line x1="140" y1="86" x2="161" y2="88" stroke="${colors.whiskers}" stroke-width="2.2" stroke-linecap="round"/>
        </g>

        <!-- Đôi mắt mèo to tròn long lanh -->
        <g class="layer-eyes">
          <g class="part-eye eye-left">
            <circle class="eye-ball" cx="80" cy="74" r="7.8" fill="${colors.eyes}"/>
            <circle class="eye-glint" cx="82" cy="71.5" r="2.7" fill="${colors.eyeHighlight}"/>
            <circle class="eye-glint-small" cx="77.5" cy="76.5" r="1.3" fill="${colors.eyeHighlight}"/>
          </g>
          <g class="part-eye eye-right">
            <circle class="eye-ball" cx="120" cy="74" r="7.8" fill="${colors.eyes}"/>
            <circle class="eye-glint" cx="122" cy="71.5" r="2.7" fill="${colors.eyeHighlight}"/>
            <circle class="eye-glint-small" cx="117.5" cy="76.5" r="1.3" fill="${colors.eyeHighlight}"/>
          </g>
        </g>

        <!-- Miệng mèo biểu cảm (LAYER MOUTH) -->
        <g class="layer-mouth">
          ${isChampion ? `
            <line x1="100" y1="90" x2="100" y2="94.5" stroke="${colors.outline}" stroke-width="2.4" stroke-linecap="round"/>
            <path class="mouth-line" d="M 93 95.5 Q 100 101 108 93.5" stroke="${colors.outline}" stroke-width="2.6" stroke-linecap="round" fill="none"/>
          ` : isActive ? `
            <line x1="100" y1="90" x2="100" y2="94" stroke="${colors.outline}" stroke-width="2.4" stroke-linecap="round"/>
            <g class="mouth-line">
              <path d="M 92 94 Q 96 98 100 94 Q 104 98 108 94" stroke="${colors.outline}" stroke-width="2.4" stroke-linecap="round" fill="none"/>
              <path d="M 94 95 C 94 104 106 104 106 95 Z" fill="#A82020" stroke="${colors.outline}" stroke-width="2" stroke-linejoin="round"/>
              <path d="M 96 99.5 C 98 98 102 98 104 99.5 C 103 103.5 97 103.5 96 99.5 Z" fill="#FF8A8A"/>
            </g>
          ` : `
            <line x1="100" y1="90" x2="100" y2="95" stroke="${colors.outline}" stroke-width="2.4" stroke-linecap="round"/>
            <path class="mouth-line" d="M 92 95.5 Q 96 100.5 100 95.5 Q 104 100.5 108 95.5" stroke="${colors.outline}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          `}
          <path class="mouth-open" d="M 92 95 C 92 107.5 108 107.5 108 95 Z" fill="#A82020" stroke="${colors.outline}" stroke-width="2" stroke-linejoin="round"/>
          <path class="mouth-tongue" d="M 95 100.5 C 97.5 98.5 102.5 98.5 105 100.5 C 104 105.5 96 105.5 95 100.5 Z" fill="#FF8A8A"/>
        </g>

        <!-- Bong bóng suy nghĩ (Thinking State) -->
        <g class="acc-thinking-bubbles">
          <circle cx="148" cy="36" r="4" fill="#FFFFFF" stroke="${colors.outline}" stroke-width="2"/>
          <circle cx="158" cy="24" r="6.5" fill="#FFFFFF" stroke="${colors.outline}" stroke-width="2"/>
          <circle cx="174" cy="15" r="10.5" fill="#FFFFFF" stroke="${colors.outline}" stroke-width="2"/>
          <text x="174" y="18.5" font-size="10" font-weight="900" fill="${colors.brandGreen}" text-anchor="middle">...</text>
        </g>

        <!-- Bong bóng nhắc uống nước (Nằm gọn bên trong, không đè viền) -->
        <g class="acc-water-bubble">
          <path d="M 124 8 L 186 8 C 193 8 198 13 198 20 L 198 34 C 198 41 193 46 186 46 L 150 46 L 140 54 L 144 46 L 124 46 C 117 46 112 41 112 34 L 112 20 C 112 13 117 8 124 8 Z" fill="#FFFFFF" stroke="${colors.outline}" stroke-width="2.4" stroke-linejoin="round"/>
          <path d="M 127 27 C 127 30.5 124.5 33 121.5 33 C 118.5 33 116 30.5 116 27 C 116 23.5 121.5 16.5 121.5 16.5 C 121.5 16.5 127 23.5 127 27 Z" fill="#38BDF8" stroke="#0284C7" stroke-width="1.2"/>
          <circle cx="120" cy="25" r="1.2" fill="#FFFFFF"/>
          <text x="160" y="30.5" font-size="9" font-weight="900" fill="#0369A1" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">Uống nước đi!</text>
        </g>
      </g>

      <!-- SVG DEBUG JOINT MARKERS (Chỉ hiện khi bật nút Debug) -->
      <g class="joint-markers">
        <circle class="joint-marker" cx="64" cy="126" r="2.2" title="Shoulder Left"/>
        <circle class="joint-marker" cx="50" cy="152" r="2" title="Elbow Left"/>
        <circle class="joint-marker" cx="136" cy="126" r="2.2" title="Shoulder Right"/>
        <circle class="joint-marker" cx="150" cy="152" r="2" title="Elbow Right"/>
        <circle class="joint-marker" cx="100" cy="118" r="2.2" title="Neck"/>
        <circle class="joint-marker" cx="78" cy="196" r="2" title="Hip Left"/>
        <circle class="joint-marker" cx="122" cy="196" r="2" title="Hip Right"/>
      </g>
    </g>
  </g>
</svg>
`;
}
