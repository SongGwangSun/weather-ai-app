'use client';

import { getBMI, getBodyType } from '@/lib/profile';
import type { Gender, UserProfile } from '@/lib/profile';

// ── 한국어 색상명 → CSS hex ───────────────────────────────────────────────────
const COLOR_MAP: Record<string, string> = {
  흰색: '#F8F8F8', 화이트: '#F8F8F8', 크림색: '#FFF5E4', 아이보리: '#FFFFF0',
  연베이지: '#F5E6CC', 베이지: '#E8D5B7', 카멜: '#C19A6B', 브라운: '#8B4513',
  블랙: '#2C2C2E', 검정: '#2C2C2E', 차콜: '#36454F', 다크그레이: '#555',
  그레이: '#9CA3AF', 연그레이: '#D1D5DB', 슬레이트그레이: '#708090',
  네이비: '#1e3a5f', 다크네이비: '#0d2137', 블루: '#3B82F6',
  하늘색: '#87CEEB', 블루데님: '#4682B4', 카고베이지: '#C4A882',
  카키: '#6B8E23', 올리브: '#808000', 버건디: '#800020', 와인: '#722F37',
  딥로즈: '#C5485B', 테라코타: '#C86558', 코랄: '#FF6B6B',
  핑크: '#FFB6C1', 베이비핑크: '#FFD1DC', 라벤더: '#B57BDB', 민트: '#3EB489',
  누드: '#E8C4A0', 인디고: '#4B0082', 레드: '#DC143C',
};

function hex(name: string): string {
  const k = name.replace(/\s/g, '');
  return COLOR_MAP[k] ?? COLOR_MAP[name] ?? '#CBD5E1';
}

// ── 체형에 따른 몸통 너비 ────────────────────────────────────────────────────
function bodyWidths(bodyType: 'slim' | 'normal' | 'full') {
  if (bodyType === 'slim')   return { shoulder: 54, waist: 46, hip: 50 };
  if (bodyType === 'full')   return { shoulder: 72, waist: 68, hip: 74 };
  return                           { shoulder: 62, waist: 54, hip: 60 };
}

// ── 헤어 스타일 ──────────────────────────────────────────────────────────────
function Hair({ gender, skinColor }: { gender: Gender; skinColor: string }) {
  if (gender === 'female') {
    return (
      <g>
        {/* 긴 머리 */}
        <ellipse cx="100" cy="52" rx="42" ry="38" fill="#3D2314" />
        {/* 앞머리 */}
        <path d="M60 55 Q80 38 100 36 Q120 38 140 55" fill="#3D2314" />
        {/* 양 옆 긴 머리 */}
        <rect x="58" y="60" width="14" height="55" rx="7" fill="#3D2314" />
        <rect x="128" y="60" width="14" height="55" rx="7" fill="#3D2314" />
        {/* 얼굴 영역 */}
        <ellipse cx="100" cy="65" rx="36" ry="38" fill={skinColor} />
      </g>
    );
  }
  if (gender === 'male') {
    return (
      <g>
        {/* 짧은 머리 */}
        <ellipse cx="100" cy="52" rx="40" ry="32" fill="#2C1810" />
        {/* 얼굴 영역 */}
        <ellipse cx="100" cy="66" rx="36" ry="38" fill={skinColor} />
        {/* 짧은 앞머리 */}
        <path d="M64 52 Q82 36 100 34 Q118 36 136 52 Q118 50 100 50 Q82 50 64 52Z" fill="#2C1810" />
      </g>
    );
  }
  // other: 중간 길이
  return (
    <g>
      <ellipse cx="100" cy="52" rx="41" ry="34" fill="#4A3728" />
      <ellipse cx="100" cy="66" rx="36" ry="38" fill={skinColor} />
      <rect x="60" y="62" width="12" height="38" rx="6" fill="#4A3728" />
      <rect x="128" y="62" width="12" height="38" rx="6" fill="#4A3728" />
    </g>
  );
}

// ── 얼굴 표정 ────────────────────────────────────────────────────────────────
function Face({ gender }: { gender: Gender }) {
  return (
    <g>
      {/* 눈 */}
      <ellipse cx="88"  cy="65" rx="4.5" ry="5.5" fill="#1C1C1E" />
      <ellipse cx="112" cy="65" rx="4.5" ry="5.5" fill="#1C1C1E" />
      {/* 눈 광택 */}
      <circle cx="90"  cy="63" r="1.5" fill="white" />
      <circle cx="114" cy="63" r="1.5" fill="white" />
      {/* 콧구멍 */}
      <ellipse cx="97"  cy="76" rx="2" ry="1.5" fill="#C68642" opacity="0.5" />
      <ellipse cx="103" cy="76" rx="2" ry="1.5" fill="#C68642" opacity="0.5" />
      {/* 입 */}
      <path d="M90 84 Q100 90 110 84" stroke="#C46B6B" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* 볼터치 */}
      {gender === 'female' && (
        <>
          <ellipse cx="80"  cy="78" rx="8" ry="5" fill="#FFB6C1" opacity="0.35" />
          <ellipse cx="120" cy="78" rx="8" ry="5" fill="#FFB6C1" opacity="0.35" />
        </>
      )}
    </g>
  );
}

interface OutfitColors {
  top: string;
  bottom: string;
  outer: string | null;  // null = 겉옷 불필요
  shoes: string;
}

function parseOutfitColors(rec: {
  topColors?: string[];
  bottomColors?: string[];
  outerColors?: string[];
  shoeColors?: string[];
  outer?: string;
}): OutfitColors {
  return {
    top:    hex(rec.topColors?.[0]    ?? '연그레이'),
    bottom: hex(rec.bottomColors?.[0] ?? '블루데님'),
    outer:  rec.outer?.includes('불필요') ? null : hex(rec.outerColors?.[0] ?? '차콜'),
    shoes:  hex(rec.shoeColors?.[0]   ?? '블랙'),
  };
}

// ── 메인 아바타 컴포넌트 ─────────────────────────────────────────────────────
interface AvatarProps {
  profile: UserProfile;
  recommendation?: {
    top: string;
    topColors?: string[];
    bottom: string;
    bottomColors?: string[];
    outer: string;
    outerColors?: string[];
    shoes: string;
    shoeColors?: string[];
  };
  size?: number;
}

export default function AvatarSVG({ profile, recommendation, size = 200 }: AvatarProps) {
  const bmi      = getBMI(profile.height, profile.weight);
  const bodyType = getBodyType(bmi);
  const widths   = bodyWidths(bodyType);
  const skinColor = '#F4C089';

  // 몸통 좌표 (cx=100 기준)
  const cx   = 100;
  const shoulderY = 108;
  const waistY    = 210;
  const hipY      = 235;
  const kneeY     = 305;
  const ankleY    = 360;

  const sw = widths.shoulder / 2; // half shoulder width
  const ww = widths.waist    / 2;
  const hw = widths.hip      / 2;

  // 상의 몸통 path
  const torsoPath = `M${cx - sw},${shoulderY} L${cx + sw},${shoulderY} L${cx + ww},${waistY} L${cx - ww},${waistY} Z`;

  // 하의 path (두 다리)
  const hipPath   = `M${cx - ww},${waistY} L${cx + ww},${waistY} L${cx + hw},${hipY} L${cx - hw},${hipY} Z`;
  const legW      = hw * 0.88;
  const gapW      = hw * 0.12;
  const leftLeg   = `M${cx - hw},${hipY} L${cx - gapW},${hipY} L${cx - gapW},${ankleY} L${cx - hw},${ankleY} Z`;
  const rightLeg  = `M${cx + gapW},${hipY} L${cx + hw},${hipY}  L${cx + hw},${ankleY}  L${cx + gapW},${ankleY} Z`;

  // 팔 path
  const armLen    = 80;
  const armW      = bodyType === 'full' ? 13 : 11;
  const leftArm   = `M${cx - sw},${shoulderY} L${cx - sw - armW},${shoulderY} L${cx - sw - armW + 6},${shoulderY + armLen} L${cx - sw + 6},${shoulderY + armLen} Z`;
  const rightArm  = `M${cx + sw},${shoulderY} L${cx + sw + armW},${shoulderY} L${cx + sw + armW - 6},${shoulderY + armLen} L${cx + sw - 6},${shoulderY + armLen} Z`;

  // 소매 길이 (반소매 vs 긴소매)
  const topText  = recommendation?.top ?? '';
  const isShortSleeve = topText.includes('반소매') || topText.includes('민소매') || topText.includes('반팔');
  const sleeveEnd     = isShortSleeve ? shoulderY + 32 : shoulderY + armLen;
  const leftSleeve    = `M${cx - sw},${shoulderY} L${cx - sw - armW},${shoulderY} L${cx - sw - armW + 6},${sleeveEnd} L${cx - sw + 6},${sleeveEnd} Z`;
  const rightSleeve   = `M${cx + sw},${shoulderY} L${cx + sw + armW},${shoulderY} L${cx + sw + armW - 6},${sleeveEnd} L${cx + sw - 6},${sleeveEnd} Z`;

  // 하의 길이 (반바지 vs 긴바지)
  const bottomText = recommendation?.bottom ?? '';
  const isShorts   = bottomText.includes('반바지') || bottomText.includes('쇼츠');
  const legEnd     = isShorts ? kneeY : ankleY;
  const leftLegC   = `M${cx - hw},${hipY} L${cx - gapW},${hipY} L${cx - gapW},${legEnd} L${cx - hw},${legEnd} Z`;
  const rightLegC  = `M${cx + gapW},${hipY} L${cx + hw},${hipY}  L${cx + hw},${legEnd}  L${cx + gapW},${legEnd} Z`;

  // 겉옷 (jacket) - 상의보다 살짝 넓음
  const jw        = sw + 8;
  const jacketPath  = `M${cx - jw},${shoulderY - 4} L${cx + jw},${shoulderY - 4} L${cx + ww + 5},${waistY + 10} L${cx - ww - 5},${waistY + 10} Z`;
  const lapelLeft   = `M${cx - jw},${shoulderY - 4} L${cx - 8},${shoulderY + 40} L${cx - 8},${waistY + 10} L${cx - ww - 5},${waistY + 10} Z`;
  const lapelRight  = `M${cx + jw},${shoulderY - 4} L${cx + 8},${shoulderY + 40} L${cx + 8},${waistY + 10} L${cx + ww + 5},${waistY + 10} Z`;

  const colors  = recommendation ? parseOutfitColors(recommendation) : null;
  const topC    = colors?.top    ?? '#D1D5DB';
  const bottomC = colors?.bottom ?? '#4682B4';
  const outerC  = colors?.outer;
  const shoeC   = colors?.shoes  ?? '#2C2C2E';

  // 신발 너비/높이
  const shoeH = 18;
  const shoeW = hw - gapW + 4;

  return (
    <svg
      viewBox="0 0 200 400"
      width={size}
      height={size * 2}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
    >
      {/* 배경 원형 그라데이션 */}
      <defs>
        <radialGradient id="bgGrad" cx="50%" cy="60%" r="50%">
          <stop offset="0%"   stopColor="#f0f4ff" />
          <stop offset="100%" stopColor="#e8edf8" />
        </radialGradient>
      </defs>
      <ellipse cx="100" cy="370" rx="70" ry="12" fill="#00000010" />

      {/* 피부: 팔/목 */}
      <path d={leftArm}  fill={skinColor} />
      <path d={rightArm} fill={skinColor} />
      <rect x="91" y="105" width="18" height="20" fill={skinColor} />

      {/* ── 하의 ── */}
      <path d={hipPath}   fill={bottomC} />
      <path d={leftLegC}  fill={bottomC} />
      <path d={rightLegC} fill={bottomC} />
      {/* 하의 주름선 */}
      {!isShorts && (
        <>
          <line x1={cx - gapW - 1} y1={hipY} x2={cx - gapW - 5} y2={legEnd - 10} stroke="rgba(0,0,0,0.08)" strokeWidth="1.5" />
          <line x1={cx + gapW + 1} y1={hipY} x2={cx + gapW + 5} y2={legEnd - 10} stroke="rgba(0,0,0,0.08)" strokeWidth="1.5" />
        </>
      )}

      {/* ── 상의 소매 ── */}
      <path d={leftSleeve}  fill={topC} />
      <path d={rightSleeve} fill={topC} />

      {/* ── 상의 몸통 ── */}
      <path d={torsoPath} fill={topC} />
      {/* 상의 라인 */}
      <line x1={cx} y1={shoulderY + 10} x2={cx} y2={waistY - 5} stroke="rgba(0,0,0,0.06)" strokeWidth="1" />

      {/* ── 겉옷 레이어 ── */}
      {outerC && (
        <g opacity="0.88">
          <path d={jacketPath} fill={outerC} />
          {/* 라펠 (옷깃) */}
          <path d={lapelLeft}  fill={topC} opacity="0.9" />
          <path d={lapelRight} fill={topC} opacity="0.9" />
          {/* 겉옷 소매 (상의보다 살짝 넓게) */}
          <path d={`M${cx - sw - 2},${shoulderY - 2} L${cx - sw - armW - 3},${shoulderY - 2} L${cx - sw - armW + 3},${sleeveEnd + 4} L${cx - sw + 3},${sleeveEnd + 4} Z`}
            fill={outerC} />
          <path d={`M${cx + sw + 2},${shoulderY - 2} L${cx + sw + armW + 3},${shoulderY - 2} L${cx + sw + armW - 3},${sleeveEnd + 4} L${cx + sw - 3},${sleeveEnd + 4} Z`}
            fill={outerC} />
          {/* 단추 */}
          {[130, 155, 180].map((y, i) => (
            <circle key={i} cx={cx} cy={y} r="3" fill="rgba(0,0,0,0.25)" />
          ))}
        </g>
      )}

      {/* ── 신발 ── */}
      {/* 왼쪽 신발 */}
      <rect x={cx - hw - 2} y={legEnd} width={shoeW + 4} height={shoeH} rx="6" fill={shoeC} />
      <rect x={cx - hw - 6} y={legEnd + 4} width={shoeW + 8} height={shoeH - 4} rx="5" fill={shoeC} />
      {/* 오른쪽 신발 */}
      <rect x={cx + gapW - 2} y={legEnd} width={shoeW + 4} height={shoeH} rx="6" fill={shoeC} />
      <rect x={cx + gapW - 2} y={legEnd + 4} width={shoeW + 8} height={shoeH - 4} rx="5" fill={shoeC} />
      {/* 신발 밑창 */}
      <rect x={cx - hw - 7} y={legEnd + shoeH - 2} width={shoeW + 10} height="4" rx="2" fill={shoeC} opacity="0.5" />
      <rect x={cx + gapW - 3} y={legEnd + shoeH - 2} width={shoeW + 10} height="4" rx="2" fill={shoeC} opacity="0.5" />

      {/* ── 손 ── */}
      <ellipse cx={cx - sw - armW/2 + 3} cy={sleeveEnd + 10} rx="9" ry="10" fill={skinColor} />
      <ellipse cx={cx + sw + armW/2 - 3} cy={sleeveEnd + 10} rx="9" ry="10" fill={skinColor} />

      {/* ── 머리 ── */}
      <Hair gender={profile.gender} skinColor={skinColor} />
      <Face gender={profile.gender} />

      {/* ── 넥라인 장식 ── */}
      {!outerC && (
        <path
          d={`M${cx - 18},${shoulderY + 2} Q${cx},${shoulderY + 22} ${cx + 18},${shoulderY + 2}`}
          fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="1.5"
        />
      )}
    </svg>
  );
}
