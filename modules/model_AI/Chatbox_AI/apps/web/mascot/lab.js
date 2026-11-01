import { MASCOT_STATES, MASCOT_SPECIES, EVOLUTION_STAGES, HOST_EVENTS } from '/contracts/assistant.js';

// ============================================================================
// SVG GENERATOR CHO GẤU VÀ MÈO TRONG PHÒNG THỬ NGHIỆM
// ============================================================================
function getBearSVG(stage = 'starter', state = 'idle') {
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

  return `
<svg class="vif-mascot-svg species-bear stage-${stage} state-${state}" viewBox="0 0 200 240" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Gấu VIF ${stage} ${state}">
  <defs>
    <radialGradient id="bear-sh-${stage}-${state}" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#000" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="bear-f-${stage}-${state}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${colors.furLight}"/>
      <stop offset="100%" stop-color="${colors.furMain}"/>
    </linearGradient>
    <linearGradient id="bear-fb-${stage}-${state}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${colors.furLight}"/>
      <stop offset="100%" stop-color="${colors.furDark}"/>
    </linearGradient>
    <linearGradient id="vif-fab-${stage}-${state}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${colors.brandLight}"/>
      <stop offset="100%" stop-color="${colors.brandGreen}"/>
    </linearGradient>
    <linearGradient id="gold-g-${stage}-${state}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${colors.goldLight}"/>
      <stop offset="100%" stop-color="${colors.gold}"/>
    </linearGradient>
  </defs>

  <g class="layer-shadow">
    <ellipse cx="100" cy="224" rx="55" ry="12" fill="url(#bear-sh-${stage}-${state})"/>
  </g>

  <g class="layer-legs">
    <g class="part-leg leg-left">
      <ellipse cx="78" cy="210" rx="16" ry="14" fill="${colors.furDark}"/>
      <ellipse cx="77" cy="212" rx="11" ry="8" fill="${colors.furBelly}"/>
    </g>
    <g class="part-leg leg-right">
      <ellipse cx="122" cy="210" rx="16" ry="14" fill="${colors.furDark}"/>
      <ellipse cx="123" cy="212" rx="11" ry="8" fill="${colors.furBelly}"/>
    </g>
  </g>

  <g class="layer-body">
    <path class="body-torso" d="M 64 125 Q 50 170 60 205 Q 100 215 140 205 Q 150 170 136 125 Z" fill="url(#bear-fb-${stage}-${state})"/>
    ${isStarter ? `
      <ellipse class="body-belly" cx="100" cy="168" rx="28" ry="32" fill="${colors.furBelly}"/>
    ` : isActive ? `
      <path class="body-jersey" d="M 70 130 L 130 130 L 134 195 L 66 195 Z" fill="url(#vif-fab-${stage}-${state})" rx="6"/>
      <path d="M 85 130 Q 100 145 115 130" stroke="${colors.brandDark}" stroke-width="3" fill="none"/>
      <text x="100" y="165" font-size="14" font-weight="900" fill="#ffffff" text-anchor="middle" font-family="system-ui, sans-serif">VIF</text>
    ` : isStrong ? `
      <path class="body-jersey" d="M 68 128 L 132 128 L 136 190 L 64 190 Z" fill="url(#vif-fab-${stage}-${state})"/>
      <path d="M 82 128 Q 100 146 118 128" stroke="${colors.brandDark}" stroke-width="4" fill="none"/>
      <line x1="72" y1="135" x2="68" y2="188" stroke="${colors.brandLight}" stroke-width="3"/>
      <line x1="128" y1="135" x2="132" y2="188" stroke="${colors.brandLight}" stroke-width="3"/>
      <text x="100" y="162" font-size="13" font-weight="900" fill="#ffffff" text-anchor="middle" font-family="system-ui">PRO</text>
      <rect x="62" y="188" width="76" height="15" rx="3" fill="${colors.beltBlack}"/>
      <rect x="94" y="189" width="12" height="13" rx="2" fill="${colors.gold}"/>
    ` : `
      <path class="body-torso-champion" d="M 62 125 Q 46 168 58 205 Q 100 216 142 205 Q 154 168 138 125 Z" fill="url(#bear-fb-${stage}-${state})"/>
      <path class="body-pecs" d="M 72 138 Q 100 148 100 162 Q 72 162 70 142 Z" fill="${colors.furBelly}" opacity="0.9"/>
      <path class="body-pecs" d="M 128 138 Q 100 148 100 162 Q 128 162 130 142 Z" fill="${colors.furBelly}" opacity="0.9"/>
      <rect x="80" y="166" width="18" height="10" rx="3" fill="${colors.furBelly}" opacity="0.85"/>
      <rect x="102" y="166" width="18" height="10" rx="3" fill="${colors.furBelly}" opacity="0.85"/>
      <rect x="82" y="179" width="16" height="9" rx="3" fill="${colors.furBelly}" opacity="0.8"/>
      <rect x="102" y="179" width="16" height="9" rx="3" fill="${colors.furBelly}" opacity="0.8"/>
      <path d="M 58 190 Q 100 196 142 190 L 140 206 Q 100 212 60 206 Z" fill="${colors.beltBlack}"/>
      <circle cx="100" cy="198" r="10" fill="url(#gold-g-${stage}-${state})"/>
      <text x="100" y="202" font-size="9" font-weight="900" fill="#2c1e18" text-anchor="middle">★</text>
    `}
  </g>

  <g class="layer-arms">
    <g class="part-arm arm-left">
      <path class="arm-shape" d="M 65 132 C 45 135 32 155 36 175 C 40 188 54 190 60 178 C 65 168 68 152 70 138 Z" fill="url(#bear-f-${stage}-${state})"/>
      ${isActive || isStrong || isChampion ? `
        <rect x="36" y="166" width="18" height="8" rx="2" fill="${colors.brandGreen}" transform="rotate(-15 45 170)"/>
      ` : ''}
      <g class="prop-dumbbell-left">
        <rect x="24" y="170" width="8" height="16" rx="2" fill="#333"/>
        <rect x="42" y="170" width="8" height="16" rx="2" fill="#333"/>
        <rect x="28" y="176" width="18" height="4" fill="#aaa"/>
      </g>
    </g>

    <g class="part-arm arm-right">
      <path class="arm-shape" d="M 135 132 C 155 135 168 155 164 175 C 160 188 146 190 140 178 C 135 168 132 152 130 138 Z" fill="url(#bear-f-${stage}-${state})"/>
      ${isActive || isStrong || isChampion ? `
        <rect x="146" y="166" width="18" height="8" rx="2" fill="${colors.brandGreen}" transform="rotate(15 155 170)"/>
      ` : ''}
      <g class="prop-dumbbell-right">
        <rect x="150" y="170" width="8" height="16" rx="2" fill="#333"/>
        <rect x="168" y="170" width="8" height="16" rx="2" fill="#333"/>
        <rect x="154" y="176" width="18" height="4" fill="#aaa"/>
      </g>
    </g>
  </g>

  <g class="layer-head-group">
    <g class="layer-ears">
      <g class="ear-left">
        <circle cx="56" cy="46" r="22" fill="url(#bear-f-${stage}-${state})"/>
        <circle cx="56" cy="46" r="14" fill="${colors.earInner}"/>
      </g>
      <g class="ear-right">
        <circle cx="144" cy="46" r="22" fill="url(#bear-f-${stage}-${state})"/>
        <circle cx="144" cy="46" r="14" fill="${colors.earInner}"/>
      </g>
    </g>

    <ellipse class="part-head" cx="100" cy="80" rx="54" ry="48" fill="url(#bear-f-${stage}-${state})"/>

    <g class="head-headband">
      <path d="M 48 65 Q 100 55 152 65 L 151 77 Q 100 68 49 77 Z" fill="${colors.brandGreen}"/>
      <line x1="50" y1="71" x2="150" y2="71" stroke="${colors.brandLight}" stroke-width="2"/>
      <circle cx="100" cy="68" r="4" fill="#ffffff"/>
      <circle cx="100" cy="68" r="2" fill="${colors.brandGreen}"/>
    </g>

    <ellipse class="part-snout" cx="100" cy="94" rx="25" ry="19" fill="${colors.snout}"/>
    <path class="part-nose" d="M 94 85 Q 100 81 106 85 Q 107 92 100 95 Q 93 92 94 85 Z" fill="${colors.nose}"/>
    <ellipse cx="98" cy="86" rx="2" ry="1.2" fill="#ffffff" opacity="0.7"/>

    <g class="layer-eyes">
      <g class="eye-left">
        <ellipse class="eye-ball" cx="80" cy="74" rx="7.5" ry="9" fill="${colors.eyes}"/>
        <circle class="eye-glint" cx="77.5" cy="71" r="3" fill="${colors.eyeHighlight}"/>
        <circle class="eye-glint-small" cx="81.5" cy="76" r="1.5" fill="${colors.eyeHighlight}"/>
        <path class="eye-brow" d="M 72 63 Q 80 60 88 64" stroke="${colors.furDark}" stroke-width="3" stroke-linecap="round" fill="none"/>
      </g>
      <g class="eye-right">
        <ellipse class="eye-ball" cx="120" cy="74" rx="7.5" ry="9" fill="${colors.eyes}"/>
        <circle class="eye-glint" cx="117.5" cy="71" r="3" fill="${colors.eyeHighlight}"/>
        <circle class="eye-glint-small" cx="121.5" cy="76" r="1.5" fill="${colors.eyeHighlight}"/>
        <path class="eye-brow" d="M 112 64 Q 120 60 128 63" stroke="${colors.furDark}" stroke-width="3" stroke-linecap="round" fill="none"/>
      </g>
      <ellipse cx="68" cy="86" rx="7" ry="4" fill="#ff7070" opacity="0.3"/>
      <ellipse cx="132" cy="86" rx="7" ry="4" fill="#ff7070" opacity="0.3"/>
    </g>

    <g class="layer-mouth">
      <path class="mouth-line" d="M 93 98 Q 100 105 107 98" stroke="${colors.nose}" stroke-width="2.5" stroke-linecap="round" fill="none"/>
      <path class="mouth-open" d="M 92 98 Q 100 114 108 98 Z" fill="#d14242"/>
      <path class="mouth-tongue" d="M 95 104 Q 100 108 105 104 Q 100 114 95 104 Z" fill="#ff8c8c"/>
    </g>

    ${isChampion ? `
      <g class="acc-medal">
        <path d="M 85 124 L 97 146 L 100 146 L 115 124" stroke="${colors.brandGreen}" stroke-width="3.5" fill="none"/>
        <circle cx="100" cy="154" r="12" fill="url(#gold-g-${stage}-${state})" stroke="#d49419" stroke-width="1.5"/>
        <text x="100" y="158" font-size="10" font-weight="900" fill="#2c1e18" text-anchor="middle">V</text>
      </g>
    ` : ''}

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

function getCatSVG(stage = 'starter', state = 'idle') {
  const colors = {
    furMain: '#e77c38',
    furDark: '#c25816',
    furLight: '#fca867',
    furWhite: '#ffffff',
    furCream: '#fff4ea',
    earInner: '#ffafaf',
    snout: '#ffffff',
    nose: '#ff6b81',
    eyes: '#154e38',
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
<svg class="vif-mascot-svg species-cat stage-${stage} state-${state}" viewBox="0 0 200 240" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Mèo VIF ${stage} ${state}">
  <defs>
    <radialGradient id="cat-sh-${stage}-${state}" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#000" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="cat-f-${stage}-${state}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${colors.furLight}"/>
      <stop offset="100%" stop-color="${colors.furMain}"/>
    </linearGradient>
    <linearGradient id="cat-fb-${stage}-${state}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${colors.furLight}"/>
      <stop offset="100%" stop-color="${colors.furDark}"/>
    </linearGradient>
    <linearGradient id="cat-vif-fab-${stage}-${state}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${colors.brandLight}"/>
      <stop offset="100%" stop-color="${colors.brandGreen}"/>
    </linearGradient>
    <linearGradient id="cat-gold-g-${stage}-${state}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${colors.goldLight}"/>
      <stop offset="100%" stop-color="${colors.gold}"/>
    </linearGradient>
  </defs>

  <g class="layer-shadow">
    <ellipse cx="100" cy="224" rx="52" ry="11" fill="url(#cat-sh-${stage}-${state})"/>
  </g>

  <g class="layer-tail">
    <path class="part-tail" d="M 135 195 Q 175 190 178 155 Q 180 135 168 128 Q 160 132 166 148 Q 168 172 135 185 Z" fill="url(#cat-f-${stage}-${state})"/>
    <path d="M 178 155 Q 180 135 168 128 Q 160 132 166 148 Z" fill="${colors.furWhite}"/>
  </g>

  <g class="layer-legs">
    <g class="part-leg leg-left">
      <ellipse cx="79" cy="212" rx="14" ry="12" fill="${colors.furDark}"/>
      <ellipse cx="79" cy="214" rx="10" ry="7" fill="${colors.furWhite}"/>
    </g>
    <g class="part-leg leg-right">
      <ellipse cx="121" cy="212" rx="14" ry="12" fill="${colors.furDark}"/>
      <ellipse cx="121" cy="214" rx="10" ry="7" fill="${colors.furWhite}"/>
    </g>
  </g>

  <g class="layer-body">
    <path class="body-torso" d="M 68 126 Q 54 168 64 205 Q 100 214 136 205 Q 146 168 132 126 Z" fill="url(#cat-fb-${stage}-${state})"/>
    ${isStarter ? `
      <path class="body-belly" d="M 85 128 Q 100 145 115 128 Q 125 170 100 195 Q 75 170 85 128 Z" fill="${colors.furCream}"/>
    ` : isActive ? `
      <path class="body-jersey" d="M 72 130 L 128 130 L 132 195 L 68 195 Z" fill="url(#cat-vif-fab-${stage}-${state})" rx="6"/>
      <path d="M 86 130 Q 100 144 114 130" stroke="${colors.brandDark}" stroke-width="3" fill="none"/>
      <text x="100" y="165" font-size="13" font-weight="900" fill="#ffffff" text-anchor="middle" font-family="system-ui">VIF</text>
    ` : isStrong ? `
      <path class="body-jersey" d="M 70 128 L 130 128 L 134 190 L 66 190 Z" fill="url(#cat-vif-fab-${stage}-${state})"/>
      <path d="M 84 128 Q 100 145 116 128" stroke="${colors.brandDark}" stroke-width="3.5" fill="none"/>
      <line x1="74" y1="135" x2="70" y2="188" stroke="${colors.brandLight}" stroke-width="3"/>
      <line x1="126" y1="135" x2="130" y2="188" stroke="${colors.brandLight}" stroke-width="3"/>
      <text x="100" y="162" font-size="12" font-weight="900" fill="#ffffff" text-anchor="middle" font-family="system-ui">SPEED</text>
      <rect x="64" y="188" width="72" height="14" rx="3" fill="${colors.beltBlack}"/>
      <rect x="94" y="189" width="12" height="12" rx="2" fill="${colors.gold}"/>
    ` : `
      <path class="body-torso-champion" d="M 66 126 Q 52 168 62 205 Q 100 215 138 205 Q 148 168 134 126 Z" fill="url(#cat-fb-${stage}-${state})"/>
      <path class="body-pecs" d="M 75 138 Q 100 148 100 160 Q 75 160 74 142 Z" fill="${colors.furCream}" opacity="0.9"/>
      <path class="body-pecs" d="M 125 138 Q 100 148 100 160 Q 125 160 126 142 Z" fill="${colors.furCream}" opacity="0.9"/>
      <rect x="82" y="165" width="16" height="9" rx="3" fill="${colors.furCream}" opacity="0.85"/>
      <rect x="102" y="165" width="16" height="9" rx="3" fill="${colors.furCream}" opacity="0.85"/>
      <rect x="84" y="177" width="14" height="8" rx="3" fill="${colors.furCream}" opacity="0.8"/>
      <rect x="102" y="177" width="14" height="8" rx="3" fill="${colors.furCream}" opacity="0.8"/>
      <path d="M 60 190 Q 100 195 140 190 L 138 205 Q 100 211 62 205 Z" fill="${colors.beltBlack}"/>
      <circle cx="100" cy="198" r="9" fill="url(#cat-gold-g-${stage}-${state})"/>
      <text x="100" y="202" font-size="8" font-weight="900" fill="#2c1e18" text-anchor="middle">★</text>
    `}
  </g>

  <g class="layer-arms">
    <g class="part-arm arm-left">
      <path class="arm-shape" d="M 68 132 C 50 135 38 154 42 173 C 46 185 58 187 63 176 C 68 166 70 152 72 138 Z" fill="url(#cat-f-${stage}-${state})"/>
      <ellipse cx="46" cy="176" rx="6" ry="5" fill="${colors.furWhite}"/>
      ${isActive || isStrong || isChampion ? `
        <rect x="42" y="165" width="16" height="7" rx="2" fill="${colors.brandGreen}" transform="rotate(-15 50 168)"/>
      ` : ''}
      <g class="prop-dumbbell-left">
        <circle cx="36" cy="180" r="8" fill="#333"/>
        <path d="M 32 172 Q 36 166 40 172" stroke="#aaa" stroke-width="2.5" fill="none"/>
      </g>
    </g>

    <g class="part-arm arm-right">
      <path class="arm-shape" d="M 132 132 C 150 135 162 154 158 173 C 154 185 142 187 137 176 C 132 166 130 152 128 138 Z" fill="url(#cat-f-${stage}-${state})"/>
      <ellipse cx="154" cy="176" rx="6" ry="5" fill="${colors.furWhite}"/>
      ${isActive || isStrong || isChampion ? `
        <rect x="142" y="165" width="16" height="7" rx="2" fill="${colors.brandGreen}" transform="rotate(15 150 168)"/>
      ` : ''}
      <g class="prop-dumbbell-right">
        <circle cx="164" cy="180" r="8" fill="#333"/>
        <path d="M 160 172 Q 164 166 168 172" stroke="#aaa" stroke-width="2.5" fill="none"/>
      </g>
    </g>
  </g>

  <g class="layer-head-group">
    <g class="layer-ears">
      <g class="ear-left">
        <polygon points="50,75 58,26 88,58" fill="url(#cat-f-${stage}-${state})"/>
        <polygon points="55,70 61,35 82,58" fill="${colors.earInner}"/>
      </g>
      <g class="ear-right">
        <polygon points="150,75 142,26 112,58" fill="url(#cat-f-${stage}-${state})"/>
        <polygon points="145,70 139,35 118,58" fill="${colors.earInner}"/>
      </g>
    </g>

    <ellipse class="part-head" cx="100" cy="80" rx="52" ry="46" fill="url(#cat-f-${stage}-${state})"/>

    <g class="head-headband">
      <path d="M 52 64 Q 100 55 148 64 L 147 75 Q 100 67 53 75 Z" fill="${colors.brandGreen}"/>
      <line x1="54" y1="69" x2="146" y2="69" stroke="${colors.brandLight}" stroke-width="1.8"/>
      <circle cx="100" cy="67" r="3.5" fill="#ffffff"/>
      <circle cx="100" cy="67" r="1.8" fill="${colors.brandGreen}"/>
    </g>

    <ellipse class="part-snout" cx="90" cy="94" rx="14" ry="11" fill="${colors.snout}"/>
    <ellipse class="part-snout" cx="110" cy="94" rx="14" ry="11" fill="${colors.snout}"/>
    <polygon class="part-nose" points="95,86 105,86 100,92" fill="${colors.nose}"/>

    <g class="layer-whiskers">
      <line x1="68" y1="91" x2="42" y2="88" stroke="${colors.whiskers}" stroke-width="1.8" stroke-linecap="round"/>
      <line x1="68" y1="96" x2="40" y2="98" stroke="${colors.whiskers}" stroke-width="1.8" stroke-linecap="round"/>
      <line x1="132" y1="91" x2="158" y2="88" stroke="${colors.whiskers}" stroke-width="1.8" stroke-linecap="round"/>
      <line x1="132" y1="96" x2="160" y2="98" stroke="${colors.whiskers}" stroke-width="1.8" stroke-linecap="round"/>
    </g>

    <g class="layer-eyes">
      <g class="eye-left">
        <ellipse class="eye-ball" cx="80" cy="74" rx="8" ry="9.5" fill="${colors.eyes}"/>
        <ellipse cx="80.5" cy="74" rx="5" ry="8.5" fill="#0d2b1f"/>
        <circle class="eye-glint" cx="77.5" cy="70" r="3.2" fill="${colors.eyeHighlight}"/>
        <circle class="eye-glint-small" cx="82.5" cy="76" r="1.5" fill="${colors.eyeHighlight}"/>
        <path class="eye-brow" d="M 72 62 Q 80 58 88 63" stroke="${colors.furDark}" stroke-width="2.8" stroke-linecap="round" fill="none"/>
      </g>
      <g class="eye-right">
        <ellipse class="eye-ball" cx="120" cy="74" rx="8" ry="9.5" fill="${colors.eyes}"/>
        <ellipse cx="119.5" cy="74" rx="5" ry="8.5" fill="#0d2b1f"/>
        <circle class="eye-glint" cx="117.5" cy="70" r="3.2" fill="${colors.eyeHighlight}"/>
        <circle class="eye-glint-small" cx="122.5" cy="76" r="1.5" fill="${colors.eyeHighlight}"/>
        <path class="eye-brow" d="M 112 63 Q 120 58 128 62" stroke="${colors.furDark}" stroke-width="2.8" stroke-linecap="round" fill="none"/>
      </g>
      <ellipse cx="68" cy="88" rx="6" ry="3.5" fill="#ff7070" opacity="0.32"/>
      <ellipse cx="132" cy="88" rx="6" ry="3.5" fill="#ff7070" opacity="0.32"/>
    </g>

    <g class="layer-mouth">
      <path class="mouth-line" d="M 92 95 Q 100 101 100 95 Q 100 101 108 95" stroke="${colors.nose}" stroke-width="2.2" stroke-linecap="round" fill="none"/>
      <path class="mouth-open" d="M 94 96 Q 100 110 106 96 Z" fill="#d14242"/>
      <path class="mouth-tongue" d="M 96 102 Q 100 106 104 102 Q 100 110 96 102 Z" fill="#ff8c8c"/>
    </g>

    ${isChampion ? `
      <g class="acc-medal">
        <path d="M 86 124 L 97 146 L 100 146 L 114 124" stroke="${colors.brandGreen}" stroke-width="3" fill="none"/>
        <circle cx="100" cy="154" r="11" fill="url(#cat-gold-g-${stage}-${state})" stroke="#d49419" stroke-width="1.5"/>
        <text x="100" y="158" font-size="9" font-weight="900" fill="#2c1e18" text-anchor="middle">V</text>
      </g>
    ` : ''}

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

// ============================================================================
// LOGIC ĐIỀU KHIỂN MASCOT LAB
// ============================================================================
const $ = (id) => document.getElementById(id);

let currentSpecies = 'bear';
let currentStage = 'starter';
let currentState = 'idle';
let currentWorkout = 'idle'; // 'idle' | 'training' | 'paused' | 'completed'
let reducedMotion = false;
let transientTimer = null;

// Khởi tạo các nút chọn 7 trạng thái
const statesGrid = $('states-grid');
for (const state of MASCOT_STATES) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'lab-btn';
  btn.textContent = state;
  btn.setAttribute('aria-pressed', String(state === currentState));
  btn.onclick = () => {
    setState(state);
  };
  statesGrid.appendChild(btn);
}

function render() {
  const previewBox = $('lab-mascot-preview');
  previewBox.classList.add('vif-mascot-container');
  if (reducedMotion) previewBox.classList.add('reduced-motion');
  else previewBox.classList.remove('reduced-motion');

  const svgHTML = currentSpecies === 'cat'
    ? getCatSVG(currentStage, currentState)
    : getBearSVG(currentStage, currentState);

  previewBox.innerHTML = svgHTML;

  // Cập nhật nhãn trạng thái
  $('lbl-species').textContent = currentSpecies === 'bear' ? 'Gấu VIF' : 'Mèo VIF';
  $('lbl-stage').textContent = currentStage;
  $('lbl-state').textContent = currentState;
  $('lbl-workout-status').textContent = currentWorkout === 'training'
    ? 'Đang tập (Training)'
    : currentWorkout === 'paused'
    ? 'Tạm dừng (Paused)'
    : currentWorkout === 'completed'
    ? 'Đã xong buổi tập!'
    : 'Nghỉ ngơi';

  // Cập nhật trạng thái nút bấm 7 states
  for (const child of statesGrid.children) {
    child.setAttribute('aria-pressed', String(child.textContent === currentState));
  }

  // Cập nhật hàng so sánh 4 cấp ngoại hình
  renderStagesComparison();
}

function setState(state, durationMs = 0) {
  if (transientTimer) {
    clearTimeout(transientTimer);
    transientTimer = null;
  }
  currentState = state;
  render();

  // Xử lý trở về trạng thái nền sau thời gian hữu hạn
  if (durationMs > 0 || state === 'greeting' || state === 'celebrating') {
    const wait = durationMs > 0 ? durationMs : state === 'greeting' ? 2400 : 3200;
    transientTimer = setTimeout(() => {
      currentState = currentWorkout === 'training' ? 'training' : 'idle';
      render();
      transientTimer = null;
    }, wait);
  }
}

function renderStagesComparison() {
  const container = $('stages-comparison-row');
  container.innerHTML = '';
  const stageDescs = {
    starter: 'Nhỏ nhắn · Mới bắt đầu',
    active: 'Khỏe khoắn · Áo tập VIF',
    strong: 'Săn chắc · Đai lưng Pro',
    champion: 'Vô địch · 6 múi & Huy chương Vàng'
  };

  for (const st of EVOLUTION_STAGES) {
    const item = document.createElement('div');
    item.className = 'stage-item';
    const preview = document.createElement('div');
    preview.className = 'stage-preview';
    preview.innerHTML = currentSpecies === 'cat'
      ? getCatSVG(st, 'idle')
      : getBearSVG(st, 'idle');

    const name = document.createElement('div');
    name.className = 'stage-name';
    name.textContent = st;

    const desc = document.createElement('div');
    desc.className = 'stage-desc';
    desc.textContent = stageDescs[st] || '';

    item.appendChild(preview);
    item.appendChild(name);
    item.appendChild(desc);
    container.appendChild(item);
  }
}

// Bắt sự kiện thay đổi Dropdown
$('sel-species').onchange = (e) => {
  currentSpecies = e.target.value;
  render();
};

$('sel-stage').onchange = (e) => {
  currentStage = e.target.value;
  render();
};

// Bật/tắt giảm chuyển động
$('btn-toggle-motion').onclick = () => {
  reducedMotion = !reducedMotion;
  $('btn-toggle-motion').textContent = reducedMotion ? 'Đang bật Giảm chuyển động' : 'Chế độ bình thường';
  $('btn-toggle-motion').classList.toggle('active', reducedMotion);
  render();
};

// Mô phỏng sự kiện tập luyện (Host Events)
$('btn-workout-start').onclick = () => {
  currentWorkout = 'training';
  window.dispatchEvent(new CustomEvent(HOST_EVENTS.start, { detail: { planId: 'demo-cardio-1' } }));
  setState('training');
};

$('btn-workout-pause').onclick = () => {
  currentWorkout = 'paused';
  window.dispatchEvent(new CustomEvent(HOST_EVENTS.pause, { detail: { planId: 'demo-cardio-1' } }));
  setState('idle');
};

$('btn-workout-complete').onclick = () => {
  currentWorkout = 'completed';
  window.dispatchEvent(new CustomEvent(HOST_EVENTS.complete, { detail: { planId: 'demo-cardio-1' } }));
  setState('celebrating', 4000);
};

// Mô phỏng API & Lỗi
$('btn-sim-slow').onclick = () => {
  setState('thinking');
  setTimeout(() => {
    setState('speaking', 2000);
  }, 3000);
};

$('btn-sim-error').onclick = () => {
  setState('thinking');
  setTimeout(() => {
    setState('error', 3000);
  }, 1000);
};

$('btn-sim-expired').onclick = () => {
  window.dispatchEvent(new CustomEvent('vif:session-expired'));
  setState('error', 2500);
};

// Thử nghiệm lời chào
$('btn-test-greet').onclick = () => {
  setState('greeting', 2400);
};

// Khởi chạy lần đầu
render();
