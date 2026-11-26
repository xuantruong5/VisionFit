import React, { useState, useEffect } from 'react';
import Svg, {
  G,
  Path,
  Ellipse,
  Rect,
  Polygon,
  Defs,
  RadialGradient,
  Stop,
  LinearGradient,
  Line,
  Circle,
  Text as SvgText,
} from 'react-native-svg';
import { MascotSpecies, MascotStage, MascotState, MascotMotionMode } from './types';

export interface MascotVectorRigProps {
  species?: MascotSpecies;
  stage?: MascotStage;
  state?: MascotState;
  mode?: MascotMotionMode;
  width?: number;
  height?: number;
}

export const MascotVectorRig: React.FC<MascotVectorRigProps> = ({
  species = 'cat',
  stage = 'starter',
  state = 'walking',
  mode = 'bouncing',
  width = 120,
  height = 144,
}) => {
  const isCat = species === 'cat';
  const isStarter = stage === 'starter';
  const isActive = stage === 'active';
  const isStrong = stage === 'strong';
  const isChampion = stage === 'champion';

  const shoulderW = isChampion ? 4.5 : isStrong ? 3.5 : isActive ? 1.5 : 0;
  const torsoW = isChampion ? 3.5 : isStrong ? 2.5 : isActive ? 1 : 0;

  // Bảng màu chuẩn vector Kawaii
  const colors = isCat
    ? {
        outline: '#4A2511',
        furMain: '#F48B3E',
        furStripe: '#C85617',
        furShade: '#D96E26',
        furBelly: '#FFF3E0',
        furCream: '#FFF3E0',
        furWhite: '#FFF3E0',
        earInner: '#F69A94',
        snout: '#FFF3E0',
        nose: '#F27878',
        eyes: '#381C0E',
        eyeHighlight: '#FFFFFF',
        blush: '#F47C7C',
        whiskers: '#4A2511',
        brandGreen: '#168B67',
        brandDark: '#0E6349',
        brandLight: '#8CE9BF',
        beltDark: '#24303E',
        beltBlack: '#1E242B',
        gold: '#F7C948',
        goldLight: '#FFE885',
        goldDark: '#D49B1A',
        ribbonRed: '#D93829',
      }
    : {
        outline: '#4A2B18',
        furMain: '#B9855A',
        furShade: '#9B6B43',
        furLight: '#CFA077',
        furBelly: '#FBEAD2',
        furCream: '#FBEAD2',
        furWhite: '#FBEAD2',
        earInner: '#E2B68E',
        snout: '#FBEAD2',
        nose: '#4A2B18',
        eyes: '#3B2010',
        eyeHighlight: '#FFFFFF',
        blush: '#EA8B91',
        whiskers: '#4A2B18',
        brandGreen: '#168B67',
        brandDark: '#0E6349',
        brandLight: '#73DFAC',
        beltDark: '#263240',
        beltBlack: '#1E242B',
        gold: '#F7C948',
        goldLight: '#FFE885',
        goldDark: '#D49B1A',
        ribbonRed: '#D93829',
      };

  // Vòng lặp animation thời gian thực tối ưu 30 FPS mượt mà chuẩn hoạt hình
  const [time, setTime] = useState(0);

  useEffect(() => {
    if (mode === 'static') {
      setTime(0);
      return;
    }

    let animId: number;
    let lastTime = Date.now();
    let accumulatedTime = 0;
    // Giảm 50% chi phí VDOM re-render, triệt tiêu hoàn toàn giật lag cho thiết bị
    const frameInterval = state === 'idle' ? 45 : 33;

    const loop = () => {
      const now = Date.now();
      const elapsed = now - lastTime;
      if (elapsed >= frameInterval) {
        lastTime = now - (elapsed % frameInterval);
        accumulatedTime += elapsed / 1000;
        setTime(accumulatedTime);
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [state, mode]);

  // Tính toán góc quay động học (Forward Kinematics) cho TẤT CẢ 10 TRẠNG THÁI (9 states trong lab + walking)
  let legLeftRot = 0;
  let legRightRot = 0;
  let legLeftY = 0;
  let legRightY = 0;
  let armLeftRot = 0;
  let armRightRot = 0;
  let forearmLeftRot = 0;
  let forearmRightRot = 0;
  let tailRot = 0;
  let headRot = 0;
  let torsoBobY = 0;
  let faceOffsetX = 0;
  let eyeOffsetX = 0;
  let eyeOffsetY = 0;

  // Props & Biểu cảm
  let showBottle = false;
  let showDumbbells = false;
  let showThinkingBubbles = false;
  let showSweatDrop = false;
  let mouthOpen = false;
  let mouthSpeaking = false;
  let mouthPout = false;

  // Hiệu ứng chớp mắt tự nhiên
  const blinkCycle = time % 3.5;
  const isBlinking = blinkCycle > 3.35 && state !== 'thinking';

  switch (state) {
    case 'walking': {
      // 1. Bước đi nhẹ nhàng ngay ngắn: hai chân bước so le (-14deg đến 14deg), nhún 2px
      const walkFreq = 5.5;
      const walkSin = Math.sin(time * walkFreq);
      legLeftRot = walkSin * 14;   // -14deg đến 14deg nhẹ nhàng
      legRightRot = -walkSin * 14;
      legLeftY = Math.min(0, walkSin * 2);
      legRightY = Math.min(0, -walkSin * 2);
      armLeftRot = -walkSin * 12;  // Tay đung đưa nhẹ nhàng
      armRightRot = walkSin * 12;
      forearmLeftRot = 8;
      forearmRightRot = 8;
      tailRot = Math.sin(time * 3) * 10;
      headRot = 0;                  // Thân đầu giữ ngay ngắn, không nghiêng ngả vặn vẹo
      torsoBobY = Math.abs(walkSin) * -2; // Nhún 2px êm ái
      faceOffsetX = 0;              // Giữ ngay ngắn
      eyeOffsetX = 0;
      eyeOffsetY = 0;
      break;
    }

    case 'stretching': {
      // 2. Vươn vai thư giãn: Hai tay vươn dài lên cao, ngực hít thở
      const stretchFreq = 2.2;
      const stretchSin = Math.sin(time * stretchFreq);
      armLeftRot = -10 + stretchSin * 36;
      armRightRot = 10 - stretchSin * 36;
      forearmLeftRot = -15 + stretchSin * 22;
      forearmRightRot = 15 - stretchSin * 22;
      tailRot = Math.sin(time * 3) * 12;
      headRot = Math.sin(time * 2) * 5;
      torsoBobY = stretchSin * -3;
      break;
    }

    case 'training': {
      // 3. Tập luyện cử tạ: Cầm 2 quả tạ dumbbell, gập khuỷu tay bicep curls liên tục!
      showDumbbells = true;
      const trainCycle = time * 4.5;
      const curlAmount = (Math.sin(trainCycle) * 0.5 + 0.5); // 0 -> 1
      armLeftRot = 12 + Math.sin(trainCycle) * 4;
      armRightRot = -12 - Math.sin(trainCycle) * 4;
      // Gập khuỷu tay nâng tạ từ -20deg lên -98deg
      forearmLeftRot = -18 - curlAmount * 80;
      forearmRightRot = 18 + curlAmount * 80;
      tailRot = Math.sin(time * 4) * 10;
      headRot = Math.sin(trainCycle) * 2;
      torsoBobY = Math.sin(trainCycle) * 2;
      mouthOpen = true; // Miệng mở hào hứng
      break;
    }

    case 'celebrating': {
      // 4. Ăn mừng chiến thắng: Nhảy cẫng lên, hai tay giơ cao chữ V
      const cheerFreq = 8;
      const cheerSin = Math.sin(time * cheerFreq);
      // Hai cánh tay vươn mở chữ V chiến thắng
      armLeftRot = 114 + cheerSin * 8;
      armRightRot = -114 - cheerSin * 8;
      forearmLeftRot = 18;
      forearmRightRot = -18;
      headRot = Math.sin(time * 6) * 4;
      torsoBobY = -10 + Math.abs(cheerSin) * -6; // Toàn thân nhún nhảy
      tailRot = Math.sin(time * 10) * 22;
      mouthOpen = true; // Cười toét rạng rỡ
      break;
    }

    case 'drinking': {
      // 5. Uống nước: Cánh tay phải đưa bình nước thể thao kề sát miệng
      showBottle = true;
      const drinkSin = Math.sin(time * 2);
      armLeftRot = 12 + drinkSin * 6;
      forearmLeftRot = 0;
      armRightRot = -12 + drinkSin * 5;
      forearmRightRot = 85 + drinkSin * 8; // Gập khuỷu tay đưa bình nước lên miệng!
      tailRot = Math.sin(time * 2.5) * 8;
      headRot = 4 + drinkSin * 2.5;
      mouthOpen = true;
      break;
    }

    case 'greeting': {
      // 6. Vẫy tay chào: Tay phải giơ cao vẫy chào liên tục
      const greetSin = Math.sin(time * 12);
      armLeftRot = 8;
      armRightRot = -105 + greetSin * 14;
      forearmRightRot = greetSin * 10;
      tailRot = Math.sin(time * 8) * 18;
      headRot = Math.sin(time * 4) * 3;
      torsoBobY = Math.abs(Math.sin(time * 6)) * -3;
      mouthOpen = true;
      break;
    }

    case 'thinking': {
      // 7. Suy nghĩ (Chat AI): Tay trái đưa lên chống cằm, nghiêng đầu, mắt nhìn lên, hiện bong bóng '...'
      showThinkingBubbles = true;
      const thinkSin = Math.sin(time * 2.5);
      armLeftRot = -34 + thinkSin * 4;
      forearmLeftRot = -125 + thinkSin * 6; // Chạm cằm
      armRightRot = -8;
      headRot = 6 + thinkSin * 3;
      eyeOffsetX = 2.2;
      eyeOffsetY = -2.5;
      tailRot = Math.sin(time * 2) * 8;
      break;
    }

    case 'speaking': {
      // 8. Trả lời (Chat AI): Tay trái làm cử chỉ, đầu gật gù, miệng mấp máy nói
      mouthSpeaking = true;
      const speakSin = Math.sin(time * 6);
      armLeftRot = -52 + speakSin * 18; // Làm cử chỉ tay
      forearmLeftRot = -28 + speakSin * 12;
      armRightRot = -10;
      headRot = Math.sin(time * 8) * 3.5; // Đầu gật gù
      tailRot = Math.sin(time * 3) * 10;
      torsoBobY = Math.sin(time * 4) * -1;
      break;
    }

    case 'error': {
      // 9. Bối rối / Lỗi mạng: Chu môi áy náy (pout), giọt mồ hôi lo lắng, hai tay bối rối
      showSweatDrop = true;
      mouthPout = true;
      const errSin = Math.sin(time * 3);
      armLeftRot = 14 + errSin * 3;
      armRightRot = -14 - errSin * 3;
      forearmLeftRot = -16;
      forearmRightRot = 16;
      headRot = -6 + errSin * 3;
      torsoBobY = 1.8;
      tailRot = Math.sin(time * 2) * 6;
      break;
    }

    case 'idle':
    default: {
      if (mode === 'static') {
        // Chế độ đứng yên hoàn toàn (Static)
        armLeftRot = 0;
        armRightRot = 0;
        tailRot = 0;
        headRot = 0;
        torsoBobY = 0;
      } else {
        // Chế độ nhún nhảy nhẹ nhàng tại chỗ (Bouncing)
        const bounceSin = Math.sin(time * 3.2);
        armLeftRot = bounceSin * 6;
        armRightRot = -bounceSin * 6;
        tailRot = Math.sin(time * 2.5) * 8;
        headRot = 0; // Thân đầu ngay ngắn
        torsoBobY = Math.abs(bounceSin) * -2; // Nhún 2px
      }
      break;
    }
  }

  const prefix = isCat ? 'vif-c' : 'vif-b';

  return (
    <Svg
      viewBox="0 0 200 240"
      width={width}
      height={height}
      style={{ overflow: 'visible' }}
    >
      <Defs>
        <RadialGradient id={`${prefix}-shadow`} cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0%" stopColor="#1E293B" stopOpacity="0.22" />
          <Stop offset="70%" stopColor="#1E293B" stopOpacity="0.08" />
          <Stop offset="100%" stopColor="#1E293B" stopOpacity="0" />
        </RadialGradient>
        <LinearGradient id={`${prefix}-gold`} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={colors.goldLight} />
          <Stop offset="55%" stopColor={colors.gold} />
          <Stop offset="100%" stopColor={colors.goldDark} />
        </LinearGradient>
        <LinearGradient id={`${prefix}-fabric`} x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#1D9E75" />
          <Stop offset="100%" stopColor={colors.brandGreen} />
        </LinearGradient>
      </Defs>

      {/* BÓNG MẶT ĐẤT */}
      <Ellipse
        cx={100}
        cy={224}
        rx={isCat ? 48 : 52}
        ry={isCat ? 9 : 9.5}
        fill={`url(#${prefix}-shadow)`}
      />

      {/* GỐC NHÂN VẬT CHÍNH */}
      <G originX={100} originY={224}>
        {/* ĐUÔI MÈO (LAYER TAIL): Pivot tại (130, 190) */}
        {isCat && (
          <G originX={130} originY={190} rotation={tailRot}>
            <Path
              d="M 130 194 C 156 196 174 176 174 150 C 174 134 162 132 161 144 C 160 162 148 182 128 184 Z"
              fill={colors.furMain}
              stroke={colors.outline}
              strokeWidth={3.2}
              strokeLinejoin="round"
            />
            <Path
              d="M 150 185 C 154 180 158 182 156 188"
              stroke={colors.furStripe}
              strokeWidth={3}
              strokeLinecap="round"
              fill="none"
            />
            <Path
              d="M 162 172 C 166 168 171 170 169 175"
              stroke={colors.furStripe}
              strokeWidth={3}
              strokeLinecap="round"
              fill="none"
            />
            {!isStarter && (
              <Path
                d="M 174 152 C 174 134 162 132 161 144 C 161 149 167 153 174 152 Z"
                fill={colors.furWhite}
                stroke={colors.outline}
                strokeWidth={3}
                strokeLinejoin="round"
              />
            )}
          </G>
        )}

        {/* HAI CHÂN ĐỘC LẬP XOAY QUANH KHỚP HÔNG (76, 196) VÀ (124, 196) */}
        <G originX={76} originY={196} rotation={legLeftRot} y={legLeftY}>
          <Path
            d={
              isCat
                ? 'M 68 186 C 67 198 66 208 65 214 C 63 220 69 223 78 223 C 88 223 91 220 90 214 C 89 208 89 198 88 186 Z'
                : 'M 65 186 C 64 198 63 208 62 214 C 60 220 67 223 77 223 C 88 223 92 220 91 214 C 90 208 90 198 89 186 Z'
            }
            fill={colors.furMain}
            stroke={colors.outline}
            strokeWidth={3.2}
            strokeLinejoin="round"
          />
          <Path
            d={isCat ? 'M 74 216 L 74 222 M 80 216 L 80 222' : 'M 73 216 L 73 222 M 80 216 L 80 222'}
            stroke={colors.outline}
            strokeWidth={2.4}
            strokeLinecap="round"
          />
        </G>

        <G originX={124} originY={196} rotation={legRightRot} y={legRightY}>
          <Path
            d={
              isCat
                ? 'M 112 186 C 111 198 111 208 110 214 C 109 220 112 223 122 223 C 131 223 137 220 135 214 C 134 208 133 198 132 186 Z'
                : 'M 111 186 C 110 198 110 208 109 214 C 108 220 112 223 123 223 C 133 223 140 220 138 214 C 137 208 136 198 135 186 Z'
            }
            fill={colors.furMain}
            stroke={colors.outline}
            strokeWidth={3.2}
            strokeLinejoin="round"
          />
          <Path
            d={isCat ? 'M 120 216 L 120 222 M 126 216 L 126 222' : 'M 120 216 L 120 222 M 127 216 L 127 222'}
            stroke={colors.outline}
            strokeWidth={2.4}
            strokeLinecap="round"
          />
        </G>

        {/* HỆ KHUNG THÂN (TORSO RIG): Nhún nhảy theo nhịp chuyển động */}
        <G y={torsoBobY}>
          {/* KHỐI THÂN & TRANG PHỤC */}
          <Path
            d={
              isCat
                ? `M ${66 - shoulderW} 123 C 75 113 125 113 ${134 + shoulderW} 123 C ${143 + torsoW} 148 ${141 + torsoW} 186 132 197 C 116 205 84 205 68 197 C ${59 - torsoW} 186 ${57 - torsoW} 148 ${66 - shoulderW} 123 Z`
                : `M ${64 - shoulderW} 122 C 74 112 126 112 ${136 + shoulderW} 122 C ${146 + torsoW} 148 ${144 + torsoW} 186 134 198 C 118 206 82 206 66 198 C ${56 - torsoW} 186 ${54 - torsoW} 148 ${64 - shoulderW} 122 Z`
            }
            fill={colors.furMain}
          />
          <Path
            d={
              isCat
                ? `M ${61 - torsoW} 136 C ${58 - torsoW} 158 ${59 - torsoW} 186 68 197 C 84 205 116 205 132 197 C ${141 + torsoW} 186 ${142 + torsoW} 158 ${139 + torsoW} 136`
                : `M ${59 - torsoW} 136 C ${55 - torsoW} 158 ${57 - torsoW} 186 66 198 C 82 206 118 206 134 198 C ${143 + torsoW} 186 ${145 + torsoW} 158 ${141 + torsoW} 136`
            }
            fill="none"
            stroke={colors.outline}
            strokeWidth={3.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <Ellipse cx={100} cy={123} rx={isCat ? 20 : 22} ry={isCat ? 7 : 8} fill={colors.furShade} />

          {/* TRANG PHỤC THEO CẤP ĐỘ */}
          {isStarter ? (
            <>
              {/* Bụng kem sữa mềm mại ngay ngắn */}
              <Ellipse cx={100} cy={165} rx={isCat ? 23 : 26} ry={isCat ? 27 : 29} fill={colors.furBelly} />
              {isCat && (
                <Path
                  d="M 73 121 C 86 128 114 128 127 121 L 129 127 C 114 135 86 135 71 127 Z"
                  fill={colors.brandGreen}
                  stroke={colors.outline}
                  strokeWidth={2.8}
                  strokeLinejoin="round"
                />
              )}
            </>
          ) : isActive ? (
            <>
              {/* Áo Tank-top VIF */}
              <Path
                d="M 71 122 C 80 122 85 137 100 137 C 115 137 120 122 129 122 C 135 145 137 175 133 190 C 115 197 85 197 67 190 C 63 175 65 145 71 122 Z"
                fill={`url(#${prefix}-fabric)`}
                stroke={colors.outline}
                strokeWidth={3.2}
                strokeLinejoin="round"
              />
              <Path d="M 79 123 C 85 139 115 139 121 123" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" fill="none" />
              <Path d="M 71 124 C 76 136 74 147 65 153" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" fill="none" />
              <Path d="M 129 124 C 124 136 126 147 135 153" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" fill="none" />
              <SvgText
                x={100}
                y={164}
                fontSize={15}
                fontWeight="900"
                fill="#FFFFFF"
                textAnchor="middle"
              >
                VIF
              </SvgText>
            </>
          ) : isStrong ? (
            <>
              {/* Áo Gym SPEED / PRO + Đai võ thuật */}
              <Path
                d="M 69 121 C 79 121 84 136 100 136 C 116 136 121 121 131 121 C 137 144 139 173 135 187 C 115 193 85 193 65 187 C 61 173 63 144 69 121 Z"
                fill={`url(#${prefix}-fabric)`}
                stroke={colors.outline}
                strokeWidth={3.2}
                strokeLinejoin="round"
              />
              <Path d="M 78 122 C 84 138 116 138 122 122" stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round" fill="none" />
              <Path d="M 70 123 C 75 135 74 146 64 152" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" fill="none" />
              <Path d="M 130 123 C 125 135 126 146 136 152" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" fill="none" />
              <SvgText
                x={100}
                y={161}
                fontSize={12}
                fontWeight="900"
                fill="#FFFFFF"
                textAnchor="middle"
              >
                {isCat ? 'SPEED' : 'PRO'}
              </SvgText>
              <Path
                d="M 64 179 C 85 184 115 184 136 179 L 135 190 C 115 195 85 195 65 190 Z"
                fill={colors.beltDark}
                stroke={colors.outline}
                strokeWidth={3}
                strokeLinejoin="round"
              />
              <Rect x={94} y={180} width={12} height={11} rx={3} fill={colors.beltDark} stroke={colors.outline} strokeWidth={2.8} />
            </>
          ) : (
            <>
              {/* Cấp Champion: Ngực săn chắc + Đai vô địch vàng kim */}
              <Path d="M 73 136 C 73 128 127 128 127 136 L 125 184 L 75 184 Z" fill={colors.furCream} />
              <Path d="M 72 136 C 72 149 84 152 99 149" fill="none" stroke={colors.furShade} strokeWidth={2.4} strokeLinecap="round" />
              <Path d="M 128 136 C 128 149 116 152 101 149" fill="none" stroke={colors.furShade} strokeWidth={2.4} strokeLinecap="round" />
              <Rect x={84} y={153} width={14} height={9} rx={2.5} fill="#FDE6C4" stroke={colors.furShade} strokeWidth={1.6} />
              <Rect x={102} y={153} width={14} height={9} rx={2.5} fill="#FDE6C4" stroke={colors.furShade} strokeWidth={1.6} />
              <Rect x={85} y={165} width={13} height={8.5} rx={2.5} fill="#FDE6C4" stroke={colors.furShade} strokeWidth={1.6} />
              <Rect x={102} y={165} width={13} height={8.5} rx={2.5} fill="#FDE6C4" stroke={colors.furShade} strokeWidth={1.6} />
              <Path
                d="M 62 178 C 85 184 115 184 138 178 L 136 193 C 115 199 85 199 64 193 Z"
                fill={colors.beltBlack}
                stroke={colors.outline}
                strokeWidth={3}
                strokeLinejoin="round"
              />
              <Rect x={69} y={181.5} width={9} height={7.5} rx={1.5} fill={`url(#${prefix}-gold)`} stroke={colors.outline} strokeWidth={2} />
              <Rect x={122} y={181.5} width={9} height={7.5} rx={1.5} fill={`url(#${prefix}-gold)`} stroke={colors.outline} strokeWidth={2} />
              <Circle cx={100} cy={185.5} r={12.5} fill={`url(#${prefix}-gold)`} stroke={colors.outline} strokeWidth={3} />
              <Circle cx={100} cy={185.5} r={8.5} fill={colors.goldLight} stroke={colors.goldDark} strokeWidth={1.4} />
            </>
          )}

          {/* HUY CHƯƠNG VÔ ĐỊCH (CHAMPION MEDAL) */}
          {isChampion && (
            <G>
              <Path d="M 78 118 L 97 143 L 103 143 L 122 118" fill="none" stroke={colors.outline} strokeWidth={7.5} strokeLinecap="round" strokeLinejoin="round" />
              <Path d="M 78 118 L 97 143 L 103 143 L 122 118" fill="none" stroke={colors.ribbonRed} strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" />
              <Circle cx={100} cy={147} r={10} fill={`url(#${prefix}-gold)`} stroke={colors.outline} strokeWidth={2.8} />
              <Circle cx={100} cy={147} r={6.5} fill={colors.goldLight} opacity={0.65} />
            </G>
          )}

          {/* HỆ CÁNH TAY 2 ĐOẠN KHỚP ĐỘNG HỌC (KINEMATIC ARMS) */}
          {/* CÁNH TAY TRÁI: Khớp vai (64, 126) */}
          <G originX={64} originY={126} rotation={armLeftRot}>
            {/* Bắp tay trên */}
            <Path
              d={
                isChampion
                  ? 'M 67 119 C 54 113 39 119 37 129 C 26 133 22 145 29 154 A 9.5 8.5 0 0 0 47 148 C 54 149 60 143 62 135 L 68 128 Z'
                  : isStrong
                  ? 'M 68 121 C 49 122 37 136 41 152 A 8.5 8 0 0 0 58 152 C 57 143 60 135 69 128 Z'
                  : `M 67 122 C ${52 - shoulderW} 125 ${45 - shoulderW / 2} 138 44.5 152 A 6.8 6.8 0 0 0 58 152 C 58 142 61 134 69 128 Z`
              }
              fill={colors.furMain}
            />
            <Path
              d={
                isChampion
                  ? 'M 66 119 C 54 113 39 119 37 129 C 26 133 22 145 29 154 M 62 135 C 60 143 54 149 47 148'
                  : isStrong
                  ? 'M 66 121 C 49 122 37 136 41 152 M 61 136 C 58 142 57 147 58 152'
                  : `M ${65 - shoulderW / 2} 123 C ${52 - shoulderW} 126 ${45 - shoulderW / 2} 138 44.5 152 M 60 138 C 58.5 143 58 148 58 152`
              }
              fill="none"
              stroke={colors.outline}
              strokeWidth={3.2}
              strokeLinecap="round"
            />

            {/* Cẳng tay trái: Khớp khuỷu tay (50, 152) */}
            <G originX={isChampion ? 41 : 50} originY={isChampion ? 149 : 152} rotation={forearmLeftRot}>
              <Path
                d={
                  isChampion
                    ? 'M 29 154 A 9.5 8.5 0 0 1 47 148 C 56 149 65 157 68 165 C 71 173 64 180 55 178 C 42 175 32 165 29 154 Z'
                    : isStrong
                    ? 'M 41 152 A 8.5 8 0 0 1 58 152 C 59.5 163 59.5 173 57 178.5 C 54.5 184 43.5 184 41 178.5 C 37.5 172 38.5 161 41 152 Z'
                    : 'M 44.5 152 A 6.8 6.8 0 0 1 58 152 C 58 164 58.5 173 56.5 178.5 C 54.5 183.5 45.5 183.5 43.5 178.5 C 41.5 173 43 164 44.5 152 Z'
                }
                fill={colors.furMain}
              />
              <Path
                d={
                  isChampion
                    ? 'M 29 154 C 32 165 42 175 55 178 C 64 180 71 173 68 165 C 65 157 56 149 47 148'
                    : isStrong
                    ? 'M 41 152 C 38.5 161 37.5 172 41 178.5 C 43.5 184 54.5 184 57 178.5 C 59.5 173 59.5 163 58 152'
                    : 'M 44.5 152 C 43 164 41.5 173 43.5 178.5 C 45.5 183.5 54.5 183.5 56.5 178.5 C 58.5 173 58 164 58 152'
                }
                fill="none"
                stroke={colors.outline}
                strokeWidth={3.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Bàn tay trái */}
              <Ellipse
                cx={isChampion ? 61 : 50}
                cy={isChampion ? 170.5 : 176.5}
                rx={5.8}
                ry={5}
                fill={isStarter ? colors.furWhite : colors.furMain}
              />
              <Path d="M 47.5 177 L 47.5 181.5 M 52.5 177 L 52.5 181.5" stroke={colors.outline} strokeWidth={2} strokeLinecap="round" />

              {/* TẠ TAY DUMBBELL TRÁI (KHI Ở TRẠNG THÁI TRAINING) */}
              {showDumbbells && (
                <G>
                  <Rect x={isCat ? 34 : 33} y={174} width={isCat ? 28 : 30} height={4.5} rx={2} fill="#94A3B8" stroke={colors.outline} strokeWidth={2} />
                  <Rect x={isCat ? 29 : 28} y={167} width={7.5} height={17} rx={2.5} fill="#334155" stroke={colors.outline} strokeWidth={2.4} />
                  <Rect x={isCat ? 59.5 : 60} y={167} width={7.5} height={17} rx={2.5} fill="#334155" stroke={colors.outline} strokeWidth={2.4} />
                </G>
              )}
            </G>
          </G>

          {/* CÁNH TAY PHẢI: Khớp vai (136, 126) */}
          <G originX={136} originY={126} rotation={armRightRot}>
            {/* Bắp tay phải */}
            <Path
              d={
                isChampion
                  ? 'M 133 119 C 146 113 161 119 163 129 C 174 133 178 145 171 154 A 9.5 8.5 0 0 1 153 148 C 146 149 140 143 138 135 L 132 128 Z'
                  : isStrong
                  ? 'M 132 121 C 151 122 163 136 159 152 A 8.5 8 0 0 1 142 152 C 143 143 140 135 131 128 Z'
                  : `M 133 122 C ${148 + shoulderW} 125 ${155 + shoulderW / 2} 138 155.5 152 A 6.8 6.8 0 0 1 142 152 C 142 142 139 134 131 128 Z`
              }
              fill={colors.furMain}
            />
            <Path
              d={
                isChampion
                  ? 'M 134 119 C 146 113 161 119 163 129 C 174 133 178 145 171 154 M 138 135 C 140 143 146 149 153 148'
                  : isStrong
                  ? 'M 134 121 C 151 122 163 136 159 152 M 139 136 C 142 142 143 147 142 152'
                  : `M ${135 + shoulderW / 2} 123 C ${148 + shoulderW} 126 ${155 + shoulderW / 2} 138 155.5 152 M 140 138 C 141.5 143 142 148 142 152`
              }
              fill="none"
              stroke={colors.outline}
              strokeWidth={3.2}
              strokeLinecap="round"
            />

            {/* Cẳng tay phải: Khớp khuỷu tay (150, 152) */}
            <G originX={isChampion ? 159 : 150} originY={isChampion ? 149 : 152} rotation={forearmRightRot}>
              <Path
                d={
                  isChampion
                    ? 'M 153 148 A 9.5 8.5 0 0 1 171 154 C 168 165 158 175 145 178 C 136 180 129 173 132 165 C 135 157 144 149 153 148 Z'
                    : isStrong
                    ? 'M 142 152 A 8.5 8 0 0 1 159 152 C 161.5 161 162.5 172 159 178.5 C 156.5 184 145.5 184 143 178.5 C 140.5 173 140.5 163 142 152 Z'
                    : 'M 142 152 A 6.8 6.8 0 0 1 155.5 152 C 157 164 158.5 173 156.5 178.5 C 154.5 183.5 145.5 183.5 143.5 178.5 C 141.5 173 142 164 142 152 Z'
                }
                fill={colors.furMain}
              />
              <Path
                d={
                  isChampion
                    ? 'M 171 154 C 168 165 158 175 145 178 C 136 180 129 173 132 165 C 135 157 144 149 153 148'
                    : isStrong
                    ? 'M 142 152 C 140.5 163 140.5 173 143 178.5 C 145.5 184 156.5 184 159 178.5 C 162.5 172 161.5 161 159 152'
                    : 'M 142 152 C 142 164 141.5 173 143.5 178.5 C 145.5 183.5 154.5 183.5 156.5 178.5 C 158.5 173 157 164 155.5 152'
                }
                fill="none"
                stroke={colors.outline}
                strokeWidth={3.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Bàn tay phải */}
              <Ellipse
                cx={isChampion ? 139 : 150}
                cy={isChampion ? 170.5 : 176.5}
                rx={5.8}
                ry={5}
                fill={isStarter ? colors.furWhite : colors.furMain}
              />
              <Path d="M 147.5 177 L 147.5 181.5 M 152.5 177 L 152.5 181.5" stroke={colors.outline} strokeWidth={2} strokeLinecap="round" />

              {/* BÌNH NƯỚC THỂ THAO (KHI Ở TRẠNG THÁI DRINKING) */}
              {showBottle && (
                <G>
                  <Rect x={142} y={156} width={16} height={25} rx={4} fill="#38BDF8" stroke={colors.outline} strokeWidth={2} />
                  <Rect x={144} y={164} width={12} height={15} rx={2} fill="#0284C7" />
                  <Line x1={145} y1={168} x2={148} y2={168} stroke="#FFFFFF" strokeWidth={1.2} strokeLinecap="round" />
                  <Line x1={145} y1={172} x2={149} y2={172} stroke="#FFFFFF" strokeWidth={1.2} strokeLinecap="round" />
                  <Line x1={145} y1={176} x2={148} y2={176} stroke="#FFFFFF" strokeWidth={1.2} strokeLinecap="round" />
                  <Rect x={143} y={152} width={14} height={5} rx={1.5} fill="#1E293B" stroke={colors.outline} strokeWidth={1.8} />
                  <Rect x={147} y={148} width={6} height={5} rx={1.2} fill="#168B67" stroke={colors.outline} strokeWidth={1.5} />
                </G>
              )}

              {/* TẠ TAY DUMBBELL PHẢI (KHI Ở TRẠNG THÁI TRAINING) */}
              {showDumbbells && (
                <G>
                  <Rect x={isCat ? 138 : 137} y={174} width={isCat ? 28 : 30} height={4.5} rx={2} fill="#94A3B8" stroke={colors.outline} strokeWidth={2} />
                  <Rect x={isCat ? 133 : 132} y={167} width={7.5} height={17} rx={2.5} fill="#334155" stroke={colors.outline} strokeWidth={2.4} />
                  <Rect x={isCat ? 163.5 : 164} y={167} width={7.5} height={17} rx={2.5} fill="#334155" stroke={colors.outline} strokeWidth={2.4} />
                </G>
              )}
            </G>
          </G>

          {/* HỆ ĐẦU & KHUÔN MẶT: Pivot cổ tại (100, 118) */}
          <G originX={100} originY={118} rotation={headRot} x={faceOffsetX}>
            {/* Đôi tai mèo / gấu */}
            {isCat ? (
              <G>
                {/* Tai trái */}
                <Path d="M 50 66 L 54 22 L 88 44 Z" fill={colors.furMain} stroke={colors.outline} strokeWidth={3.2} strokeLinejoin="round" />
                <Path d="M 55 60 L 58 30 L 81 45 Z" fill={colors.earInner} />
                {/* Tai phải */}
                <Path d="M 150 66 L 146 22 L 112 44 Z" fill={colors.furMain} stroke={colors.outline} strokeWidth={3.2} strokeLinejoin="round" />
                <Path d="M 145 60 L 142 30 L 119 45 Z" fill={colors.earInner} />
              </G>
            ) : (
              <G>
                {/* Tai gấu tròn */}
                <Circle cx={53} cy={43} r={21} fill={colors.furMain} stroke={colors.outline} strokeWidth={3.2} />
                <Circle cx={54} cy={44} r={12.5} fill={colors.earInner} />
                <Circle cx={147} cy={43} r={21} fill={colors.furMain} stroke={colors.outline} strokeWidth={3.2} />
                <Circle cx={146} cy={44} r={12.5} fill={colors.earInner} />
              </G>
            )}

            {/* Khối đầu */}
            <Ellipse cx={100} cy={77} rx={isCat ? 51 : 54} ry={isCat ? 42 : 45} fill={colors.furMain} stroke={colors.outline} strokeWidth={3.2} />

            {/* Vằn trán mèo */}
            {isCat && (
              <G fill={colors.furStripe}>
                <Path d="M 97 35 L 103 35 L 101.5 49 L 98.5 49 Z" />
                <Path d="M 84 37 L 89 36 L 91 49 L 87 49 Z" />
                <Path d="M 116 37 L 111 36 L 109 49 L 113 49 Z" />
              </G>
            )}

            {/* Băng đô thể thao trán */}
            <G>
              <Path d="M 50 56 C 75 45 125 45 150 56 L 152 66 C 125 55 75 55 48 66 Z" fill={colors.brandGreen} stroke={colors.outline} strokeWidth={3.2} strokeLinejoin="round" />
              {isActive && (
                <G>
                  <Circle cx={100} cy={53.5} r={3} fill="#FFFFFF" />
                  <Circle cx={84} cy={54.8} r={2.3} fill="#FFFFFF" />
                  <Circle cx={116} cy={54.8} r={2.3} fill="#FFFFFF" />
                  <Circle cx={70} cy={57.5} r={1.9} fill="#FFFFFF" />
                  <Circle cx={130} cy={57.5} r={1.9} fill="#FFFFFF" />
                </G>
              )}
            </G>

            {/* Má hồng */}
            <Ellipse cx={isCat ? 67 : 62} cy={84} rx={6.5} ry={3.8} fill={colors.blush} opacity={0.75} />
            <Ellipse cx={isCat ? 133 : 138} cy={84} rx={6.5} ry={3.8} fill={colors.blush} opacity={0.75} />

            {/* Mõm & Mũi ngay ngắn */}
            <Ellipse cx={100} cy={92} rx={isCat ? 18 : 23} ry={isCat ? 13.5 : 16.5} fill={colors.snout} />
            <Polygon points="95,85 105,85 100,90.5" fill={colors.nose} />

            {/* Râu mèo */}
            {isCat && (
              <G>
                <Line x1={60} y1={79} x2={40} y2={76} stroke={colors.whiskers} strokeWidth={2.2} strokeLinecap="round" />
                <Line x1={60} y1={86} x2={39} y2={88} stroke={colors.whiskers} strokeWidth={2.2} strokeLinecap="round" />
                <Line x1={140} y1={79} x2={160} y2={76} stroke={colors.whiskers} strokeWidth={2.2} strokeLinecap="round" />
                <Line x1={140} y1={86} x2={161} y2={88} stroke={colors.whiskers} strokeWidth={2.2} strokeLinecap="round" />
              </G>
            )}

            {/* Đôi mắt to tròn với hiệu ứng chớp mắt tự nhiên */}
            <G scaleY={isBlinking ? 0.15 : 1} originX={100} originY={74} x={eyeOffsetX} y={eyeOffsetY}>
              {/* Mắt trái */}
              <Circle cx={80} cy={74} r={7.8} fill={colors.eyes} />
              {!isBlinking && (
                <>
                  <Circle cx={82} cy={71.5} r={2.7} fill={colors.eyeHighlight} />
                  <Circle cx={77.5} cy={76.5} r={1.3} fill={colors.eyeHighlight} />
                </>
              )}
              {/* Mắt phải */}
              <Circle cx={120} cy={74} r={7.8} fill={colors.eyes} />
              {!isBlinking && (
                <>
                  <Circle cx={122} cy={71.5} r={2.7} fill={colors.eyeHighlight} />
                  <Circle cx={117.5} cy={76.5} r={1.3} fill={colors.eyeHighlight} />
                </>
              )}
            </G>

            {/* MIỆNG LINH VẬT ĐA DẠNG THEO TRẠNG THÁI */}
            {mouthPout ? (
              // Trạng thái Error: Chu môi áy náy, bối rối
              <Path
                d="M 93 99 Q 100 93.5 107 99"
                stroke={colors.outline}
                strokeWidth={2.6}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            ) : mouthSpeaking ? (
              // Trạng thái Speaking: Miệng mấp máy nói chuyện nhịp nhàng
              <G scaleY={0.65 + Math.sin(time * 16) * 0.45} originX={100} originY={95}>
                <Path d="M 93 94 C 93 105 107 105 107 94 Z" fill="#A82020" stroke={colors.outline} strokeWidth={2} strokeLinejoin="round" />
                <Path d="M 95 99 C 97.5 97.5 102.5 97.5 105 99 C 104 103 96 103 95 99 Z" fill="#FF8A8A" />
              </G>
            ) : mouthOpen ? (
              // Trạng thái mở miệng cười toét (celebrating, drinking, greeting, training)
              <G>
                <Path d="M 92 95 C 92 107.5 108 107.5 108 95 Z" fill="#A82020" stroke={colors.outline} strokeWidth={2} strokeLinejoin="round" />
                <Path d="M 95 100.5 C 97.5 98.5 102.5 98.5 105 100.5 C 104 105.5 96 105.5 95 100.5 Z" fill="#FF8A8A" />
              </G>
            ) : (
              // Trạng thái cười mỉm Chibi Kawaii tiêu chuẩn (idle, walking, stretching)
              <G>
                <Line x1={100} y1={90} x2={100} y2={95} stroke={colors.outline} strokeWidth={2.4} strokeLinecap="round" />
                <Path
                  d="M 92 95.5 Q 96 100.5 100 95.5 Q 104 100.5 108 95.5"
                  stroke={colors.outline}
                  strokeWidth={2.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </G>
            )}

            {/* BONG BÓNG SUY NGHĨ (THINKING BUBBLES) */}
            {showThinkingBubbles && (
              <G>
                <Circle cx={148} cy={36} r={4} fill="#FFFFFF" stroke={colors.outline} strokeWidth={2} />
                <Circle cx={158} cy={24} r={6.5} fill="#FFFFFF" stroke={colors.outline} strokeWidth={2} />
                <Circle cx={174} cy={14} r={10.5} fill="#FFFFFF" stroke={colors.outline} strokeWidth={2} />
                <SvgText x={174} y={17.5} fontSize={10} fontWeight="900" fill={colors.brandGreen} textAnchor="middle">
                  ...
                </SvgText>
              </G>
            )}

            {/* GIỌT MỒ HÔI LO LẮNG / BỐI RỐI (ERROR SWEAT DROP) */}
            {showSweatDrop && (
              <G>
                <Path
                  d="M 148 40 C 148 43 145.5 46 142.5 46 C 139.5 46 137 43 137 40 C 137 36.5 142.5 30 142.5 30 C 142.5 30 148 36.5 148 40 Z"
                  fill="#38BDF8"
                  stroke="#0284C7"
                  strokeWidth={1.4}
                />
                <Circle cx={141} cy={42} r={1} fill="#FFFFFF" />
              </G>
            )}

            {/* BONG BÓNG NHẮC UỐNG NƯỚC (DRINKING BUBBLE) */}
            {state === 'drinking' && (
              <G>
                <Path
                  d="M 124 8 L 186 8 C 193 8 198 13 198 20 L 198 34 C 198 41 193 46 186 46 L 150 46 L 140 54 L 144 46 L 124 46 C 117 46 112 41 112 34 L 112 20 C 112 13 117 8 124 8 Z"
                  fill="#FFFFFF"
                  stroke={colors.outline}
                  strokeWidth={2.4}
                  strokeLinejoin="round"
                />
                <Path
                  d="M 127 27 C 127 30.5 124.5 33 121.5 33 C 118.5 33 116 30.5 116 27 C 116 23.5 121.5 16.5 121.5 16.5 C 121.5 16.5 127 23.5 127 27 Z"
                  fill="#38BDF8"
                  stroke="#0284C7"
                  strokeWidth={1.2}
                />
                <SvgText
                  x={160}
                  y={30.5}
                  fontSize={8.5}
                  fontWeight="900"
                  fill="#0369A1"
                  textAnchor="middle"
                >
                  Uống nước đi!
                </SvgText>
              </G>
            )}
          </G>
        </G>
      </G>
    </Svg>
  );
};

export default MascotVectorRig;
