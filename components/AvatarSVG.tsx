'use client';

import { getBMI, getBodyType } from '@/lib/profile';
import type { Gender, UserProfile } from '@/lib/profile';

/* ── 색상 매핑 ─────────────────────────────────────────────────────────────── */
const COLOR_MAP: Record<string, string> = {
  흰색:'#F5F5F5', 화이트:'#F5F5F5', 크림색:'#FFF0D6', 아이보리:'#FAFAE8',
  연베이지:'#F0DFC0', 베이지:'#DEC89A', 카멜:'#C09060', 브라운:'#7A3B10',
  블랙:'#1A1A1F', 검정:'#1A1A1F', 차콜:'#2E3D4A', 다크그레이:'#444C55',
  그레이:'#8A95A0', 연그레이:'#C8D0D8', 슬레이트그레이:'#5E7080',
  네이비:'#132D52', 다크네이비:'#091C33', 블루:'#2563EB',
  하늘색:'#60B8E0', 블루데님:'#3A6EA5', 카고베이지:'#B89D72',
  카키:'#5C7A28', 올리브:'#6B7030', 버건디:'#6E0F20', 와인:'#5C2233',
  딥로즈:'#B03050', 테라코타:'#B84840', 코랄:'#E85050',
  핑크:'#F0A0B8', 베이비핑크:'#F8C8D8', 라벤더:'#9060C8', 민트:'#28A878',
  누드:'#DCA882', 인디고:'#3D0E7A', 레드:'#CC1030',
  연초록:'#70C870', 그린:'#1A6E1A', 차분한블루:'#4A6EA0',
};

function hex(name: string): string {
  const k = name.replace(/\s/g, '');
  return COLOR_MAP[k] ?? COLOR_MAP[name] ?? '#8A95A0';
}

/** 색상을 밝게 */
function lighten(color: string, amt = 40): string {
  const r = Math.min(255, parseInt(color.slice(1,3),16) + amt);
  const g = Math.min(255, parseInt(color.slice(3,5),16) + amt);
  const b = Math.min(255, parseInt(color.slice(5,7),16) + amt);
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}
/** 색상을 어둡게 */
function darken(color: string, amt = 40): string {
  const r = Math.max(0, parseInt(color.slice(1,3),16) - amt);
  const g = Math.max(0, parseInt(color.slice(3,5),16) - amt);
  const b = Math.max(0, parseInt(color.slice(5,7),16) - amt);
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

/* ── 체형 ── */
function bodyWidths(type: 'slim'|'normal'|'full') {
  if (type==='slim') return { sh:50, wa:42, hi:46, armW:10 };
  if (type==='full') return { sh:68, wa:64, hi:70, armW:14 };
  return                    { sh:58, wa:50, hi:56, armW:12 };
}

/* ── 한국인 스타일 얼굴 ─────────────────────────────────────────────────────── */
function KoreanFace({ gender, cx, headY }: { gender: Gender; cx: number; headY: number }) {
  const skinLight  = '#FDE8CA';
  const skinBase   = '#FADA9E';  // 밝은 황금빛 피부
  const skinShadow = '#E8C080';
  const hairColor  = gender === 'female' ? '#1A0E08' : '#140C06';
  const hairHighlight = '#3D2010';

  // 얼굴 중심
  const fy = headY;

  return (
    <g>
      {/* ── 머리카락 (뒤쪽 레이어) ── */}
      {gender === 'female' ? (
        <g>
          {/* 긴 머리 뒤 */}
          <ellipse cx={cx} cy={fy-2} rx={43} ry={46} fill={hairColor} />
          {/* 양쪽 긴 머리 */}
          <rect x={cx-48} y={fy+22} width={18} height={68} rx={9} fill={hairColor} />
          <rect x={cx+30} y={fy+22} width={18} height={68} rx={9} fill={hairColor} />
          {/* 머리카락 하이라이트 */}
          <ellipse cx={cx-8} cy={fy-28} rx={12} ry={6} fill={hairHighlight} opacity={0.5} />
        </g>
      ) : (
        <g>
          <ellipse cx={cx} cy={fy-4} rx={42} ry={38} fill={hairColor} />
          {/* 남자 머리 하이라이트 */}
          <ellipse cx={cx-6} cy={fy-26} rx={10} ry={5} fill={hairHighlight} opacity={0.45} />
        </g>
      )}

      {/* ── 목 ── */}
      <defs>
        <linearGradient id="neckGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={skinShadow} />
          <stop offset="35%" stopColor={skinBase} />
          <stop offset="65%" stopColor={skinBase} />
          <stop offset="100%" stopColor={skinShadow} />
        </linearGradient>
      </defs>
      <rect x={cx-11} y={fy+44} width={22} height={24} rx={5} fill="url(#neckGrad)" />

      {/* ── 얼굴 본체 (계란형, 3D 입체감) ── */}
      <defs>
        <radialGradient id="faceGrad" cx="42%" cy="38%" r="58%">
          <stop offset="0%"   stopColor={skinLight} />
          <stop offset="55%"  stopColor={skinBase} />
          <stop offset="100%" stopColor={skinShadow} />
        </radialGradient>
        {/* 얼굴 클립 */}
        <clipPath id="faceClip">
          <ellipse cx={cx} cy={fy} rx={37} ry={44} />
        </clipPath>
      </defs>

      {/* 얼굴 베이스 */}
      <ellipse cx={cx} cy={fy} rx={37} ry={44} fill="url(#faceGrad)" />

      {/* 측면 음영 */}
      <ellipse cx={cx-33} cy={fy+4} rx={10} ry={28} fill={skinShadow} opacity={0.28} />
      <ellipse cx={cx+33} cy={fy+4} rx={10} ry={28} fill={skinShadow} opacity={0.28} />

      {/* 이마 하이라이트 */}
      <ellipse cx={cx} cy={fy-22} rx={18} ry={10} fill={skinLight} opacity={0.6} />

      {/* ── 눈썹 (자연스러운 곡선) ── */}
      {gender === 'female' ? (
        <>
          <path d={`M${cx-22},${fy-14} Q${cx-12},${fy-20} ${cx-3},${fy-15}`}
            stroke="#3A2010" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <path d={`M${cx+3},${fy-15} Q${cx+12},${fy-20} ${cx+22},${fy-14}`}
            stroke="#3A2010" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d={`M${cx-24},${fy-13} Q${cx-12},${fy-19} ${cx-2},${fy-14}`}
            stroke="#1E1208" strokeWidth="2.8" fill="none" strokeLinecap="round" />
          <path d={`M${cx+2},${fy-14} Q${cx+12},${fy-19} ${cx+24},${fy-13}`}
            stroke="#1E1208" strokeWidth="2.8" fill="none" strokeLinecap="round" />
        </>
      )}

      {/* ── 눈 (아몬드형, 쌍꺼풀) ── */}
      <g clipPath="url(#faceClip)">
        {/* 왼쪽 눈 */}
        <g>
          {/* 눈꺼풀 */}
          <path d={`M${cx-24},${fy-4} Q${cx-14},${fy-12} ${cx-4},${fy-4} Q${cx-14},${fy-1} ${cx-24},${fy-4}Z`}
            fill="#1A1008" />
          {/* 흰자 */}
          <path d={`M${cx-23},${fy-4} Q${cx-14},${fy-10} ${cx-5},${fy-4} Q${cx-14},${fy} ${cx-23},${fy-4}Z`}
            fill="white" />
          {/* 홍채 */}
          <circle cx={cx-14} cy={fy-5} r={4.5} fill="#3D2810" />
          <circle cx={cx-14} cy={fy-5} r={3}   fill="#1A0C06" />
          {/* 광택 */}
          <circle cx={cx-12} cy={fy-7} r={1.4} fill="white" />
          <circle cx={cx-16} cy={fy-4} r={0.7} fill="white" opacity={0.7} />
          {/* 쌍꺼풀 선 */}
          <path d={`M${cx-23},${fy-6} Q${cx-14},${fy-14} ${cx-5},${fy-6}`}
            stroke="#C88858" strokeWidth="0.8" fill="none" opacity={0.5} />
          {/* 속눈썹 */}
          {gender === 'female' && (
            <path d={`M${cx-23},${fy-4} Q${cx-14},${fy-13} ${cx-5},${fy-4}`}
              stroke="#1A0C06" strokeWidth="1.2" fill="none" />
          )}
        </g>

        {/* 오른쪽 눈 */}
        <g>
          <path d={`M${cx+4},${fy-4} Q${cx+14},${fy-12} ${cx+24},${fy-4} Q${cx+14},${fy-1} ${cx+4},${fy-4}Z`}
            fill="#1A1008" />
          <path d={`M${cx+5},${fy-4} Q${cx+14},${fy-10} ${cx+23},${fy-4} Q${cx+14},${fy} ${cx+5},${fy-4}Z`}
            fill="white" />
          <circle cx={cx+14} cy={fy-5} r={4.5} fill="#3D2810" />
          <circle cx={cx+14} cy={fy-5} r={3}   fill="#1A0C06" />
          <circle cx={cx+16} cy={fy-7} r={1.4} fill="white" />
          <circle cx={cx+12} cy={fy-4} r={0.7} fill="white" opacity={0.7} />
          <path d={`M${cx+5},${fy-6} Q${cx+14},${fy-14} ${cx+23},${fy-6}`}
            stroke="#C88858" strokeWidth="0.8" fill="none" opacity={0.5} />
          {gender === 'female' && (
            <path d={`M${cx+5},${fy-4} Q${cx+14},${fy-13} ${cx+23},${fy-4}`}
              stroke="#1A0C06" strokeWidth="1.2" fill="none" />
          )}
        </g>

        {/* ── 콧날/콧구멍 (오뚝한 코) ── */}
        {/* 콧날 */}
        <path d={`M${cx},${fy-2} L${cx-3},${fy+12} Q${cx},${fy+14} ${cx+3},${fy+12} L${cx},${fy-2}`}
          fill={skinShadow} opacity={0.18} />
        {/* 콧날 하이라이트 */}
        <line x1={cx} y1={fy-2} x2={cx} y2={fy+12}
          stroke={skinLight} strokeWidth="1.2" opacity={0.5} />
        {/* 콧구멍 */}
        <ellipse cx={cx-5}  cy={fy+13} rx={3.5} ry={2.2} fill={skinShadow} opacity={0.55} />
        <ellipse cx={cx+5}  cy={fy+13} rx={3.5} ry={2.2} fill={skinShadow} opacity={0.55} />

        {/* ── 입술 (도톰한 한국풍) ── */}
        {gender === 'female' ? (
          <g>
            {/* 윗입술 */}
            <path d={`M${cx-11},${fy+22} Q${cx-5},${fy+18} ${cx},${fy+19} Q${cx+5},${fy+18} ${cx+11},${fy+22}`}
              fill="#D06070" />
            {/* 아랫입술 */}
            <path d={`M${cx-11},${fy+22} Q${cx},${fy+30} ${cx+11},${fy+22}`}
              fill="#E07888" />
            {/* 입술 하이라이트 */}
            <ellipse cx={cx} cy={fy+24} rx={5} ry={2} fill="white" opacity={0.25} />
          </g>
        ) : (
          <g>
            <path d={`M${cx-10},${fy+22} Q${cx-4},${fy+19} ${cx},${fy+20} Q${cx+4},${fy+19} ${cx+10},${fy+22}`}
              fill="#B05050" opacity={0.8} />
            <path d={`M${cx-10},${fy+22} Q${cx},${fy+28} ${cx+10},${fy+22}`}
              fill="#C06060" opacity={0.8} />
          </g>
        )}

        {/* ── 볼터치 ── */}
        {gender === 'female' && (
          <>
            <ellipse cx={cx-24} cy={fy+8} rx={9} ry={6} fill="#FFB0A8" opacity={0.3} />
            <ellipse cx={cx+24} cy={fy+8} rx={9} ry={6} fill="#FFB0A8" opacity={0.3} />
          </>
        )}

        {/* ── 턱 하이라이트 ── */}
        <ellipse cx={cx} cy={fy+36} rx={8} ry={4} fill={skinLight} opacity={0.35} />
      </g>

      {/* ── 머리카락 앞쪽 ── */}
      {gender === 'female' ? (
        <g>
          {/* 가르마 + 앞머리 */}
          <path d={`M${cx-40},${fy-28} Q${cx-20},${fy-50} ${cx},${fy-46} Q${cx+20},${fy-50} ${cx+40},${fy-28}`}
            fill={hairColor} />
          {/* 앞머리 곡선 */}
          <path d={`M${cx-38},${fy-30} Q${cx-10},${fy-44} ${cx+12},${fy-40} Q${cx+28},${fy-36} ${cx+38},${fy-28}`}
            fill={hairColor} opacity={0.85} />
        </g>
      ) : (
        <g>
          <path d={`M${cx-40},${fy-22} Q${cx-20},${fy-44} ${cx},${fy-44} Q${cx+20},${fy-44} ${cx+40},${fy-22}`}
            fill={hairColor} />
          {/* 남자 옆머리 */}
          <path d={`M${cx-38},${fy-22} Q${cx-42},${fy-2} ${cx-40},${fy+14}`}
            fill={hairColor} />
          <path d={`M${cx+38},${fy-22} Q${cx+42},${fy-2} ${cx+40},${fy+14}`}
            fill={hairColor} />
        </g>
      )}
    </g>
  );
}

/* ── 3D 의류 그리기 헬퍼 ─────────────────────────────────────────────────── */
function ClothingGrad({ id, baseColor }: { id: string; baseColor: string }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stopColor={darken(baseColor, 35)} />
      <stop offset="20%"  stopColor={baseColor} />
      <stop offset="50%"  stopColor={lighten(baseColor, 25)} />
      <stop offset="80%"  stopColor={baseColor} />
      <stop offset="100%" stopColor={darken(baseColor, 35)} />
    </linearGradient>
  );
}
function LegGrad({ id, baseColor, side }: { id: string; baseColor: string; side: 'left'|'right' }) {
  const from = side === 'left' ? darken(baseColor,30) : lighten(baseColor,20);
  const to   = side === 'left' ? lighten(baseColor,20) : darken(baseColor,30);
  return (
    <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stopColor={from} />
      <stop offset="50%"  stopColor={baseColor} />
      <stop offset="100%" stopColor={to} />
    </linearGradient>
  );
}

/* ── 메인 아바타 ─────────────────────────────────────────────────────────── */
interface Rec {
  top: string; topColors?: string[];
  bottom: string; bottomColors?: string[];
  outer: string; outerColors?: string[];
  shoes: string; shoeColors?: string[];
}
interface AvatarProps {
  profile: UserProfile;
  recommendation?: Rec;
  size?: number;
}

export default function AvatarSVG({ profile, recommendation, size = 260 }: AvatarProps) {
  const bmi      = getBMI(profile.height, profile.weight);
  const bodyType = getBodyType(bmi);
  const w        = bodyWidths(bodyType);

  const cx  = 100;
  const headY = 62;       // 얼굴 중심 Y

  // 신체 좌표
  const shoulderY = 116;
  const waistY    = 218;
  const hipY      = 244;
  const kneeY     = 312;
  const ankleY    = 372;

  // 색상 파싱
  const topC    = hex(recommendation?.topColors?.[0]    ?? '연그레이');
  const bottomC = hex(recommendation?.bottomColors?.[0] ?? '블루데님');
  const hasOuter = recommendation?.outer && !recommendation.outer.includes('불필요');
  const outerC  = hasOuter ? hex(recommendation!.outerColors?.[0] ?? '차콜') : null;
  const shoeC   = hex(recommendation?.shoeColors?.[0]  ?? '블랙');

  // 소매 / 바지 길이
  const isShortSleeve = (recommendation?.top ?? '').match(/반소매|민소매|반팔|탱크/);
  const isShorts      = (recommendation?.bottom ?? '').match(/반바지|쇼츠|숏/);
  const sleeveEnd     = isShortSleeve ? shoulderY + 30 : shoulderY + 80;
  const legEnd        = isShorts      ? kneeY           : ankleY;

  const sw = w.sh / 2;
  const ww = w.wa / 2;
  const hw = w.hi / 2;
  const aw = w.armW;
  const gap = 4; // 다리 사이 간격

  const skinBase   = '#FADA9E';
  const skinShadow = '#D4A860';

  return (
    <svg
      viewBox="0 0 200 420"
      width={size}
      height={size * 2.1}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
    >
      <defs>
        {/* 피부 그라데이션 */}
        <linearGradient id="skinArm" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor={skinShadow} />
          <stop offset="40%"  stopColor={skinBase} />
          <stop offset="100%" stopColor={skinShadow} />
        </linearGradient>
        {/* 의류 그라데이션 */}
        <ClothingGrad id="topGrad"    baseColor={topC} />
        <ClothingGrad id="outerGrad"  baseColor={outerC ?? '#444'} />
        <LegGrad id="leftLegGrad"  baseColor={bottomC} side="left" />
        <LegGrad id="rightLegGrad" baseColor={bottomC} side="right" />
        {/* 바닥 그림자 */}
        <radialGradient id="shadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#00000030" />
          <stop offset="100%" stopColor="#00000000" />
        </radialGradient>
      </defs>

      {/* 바닥 그림자 */}
      <ellipse cx={cx} cy={ankleY+22} rx={52} ry={10} fill="url(#shadow)" />

      {/* ─── 피부: 팔 ─────────────────────────────────────────────────── */}
      {/* 왼팔 */}
      <path
        d={`M${cx-sw},${shoulderY} L${cx-sw-aw},${shoulderY+4} L${cx-sw-aw+4},${shoulderY+82} L${cx-sw+6},${shoulderY+78} Z`}
        fill="url(#skinArm)"
      />
      {/* 오른팔 */}
      <path
        d={`M${cx+sw},${shoulderY} L${cx+sw+aw},${shoulderY+4} L${cx+sw+aw-4},${shoulderY+82} L${cx+sw-6},${shoulderY+78} Z`}
        fill="url(#skinArm)"
      />

      {/* ─── 하의 ───────────────────────────────────────────────────────── */}
      {/* 허리 연결 */}
      <path d={`M${cx-ww},${waistY} L${cx+ww},${waistY} L${cx+hw},${hipY} L${cx-hw},${hipY} Z`}
        fill={`url(#leftLegGrad)`} />
      {/* 왼쪽 다리 */}
      <path d={`M${cx-hw},${hipY} L${cx-gap},${hipY} L${cx-gap},${legEnd} L${cx-hw},${legEnd} Z`}
        fill="url(#leftLegGrad)" />
      {/* 오른쪽 다리 */}
      <path d={`M${cx+gap},${hipY} L${cx+hw},${hipY} L${cx+hw},${legEnd} L${cx+gap},${legEnd} Z`}
        fill="url(#rightLegGrad)" />
      {/* 다리 사이 어두운 선 */}
      <rect x={cx-gap} y={hipY} width={gap*2} height={legEnd-hipY} fill={darken(bottomC,50)} />
      {/* 하의 주름 */}
      {!isShorts && (<>
        <line x1={cx-hw+8}  y1={hipY+10} x2={cx-hw+4}  y2={legEnd-20} stroke={darken(bottomC,20)} strokeWidth="1" opacity="0.5" />
        <line x1={cx+hw-8}  y1={hipY+10} x2={cx+hw-4}  y2={legEnd-20} stroke={darken(bottomC,20)} strokeWidth="1" opacity="0.5" />
      </>)}
      {/* 벨트 */}
      <rect x={cx-ww} y={waistY-4} width={ww*2} height={8} rx={3} fill={darken(bottomC,45)} />
      <rect x={cx-4}  y={waistY-5} width={8} height={10} rx={2} fill={darken(bottomC,20)} />

      {/* ─── 상의 소매 ─────────────────────────────────────────────────── */}
      {/* 왼쪽 소매 */}
      <path
        d={`M${cx-sw+2},${shoulderY} L${cx-sw-aw+2},${shoulderY+4} L${cx-sw-aw+6},${sleeveEnd} L${cx-sw+4},${sleeveEnd-2} Z`}
        fill={`url(#topGrad)`}
      />
      {/* 오른쪽 소매 */}
      <path
        d={`M${cx+sw-2},${shoulderY} L${cx+sw+aw-2},${shoulderY+4} L${cx+sw+aw-6},${sleeveEnd} L${cx+sw-4},${sleeveEnd-2} Z`}
        fill={`url(#topGrad)`}
      />
      {/* 소매 끝단 */}
      <rect x={cx-sw-aw+2} y={sleeveEnd-3} width={aw+sw/3} height={5} rx={2} fill={darken(topC,30)} />
      <rect x={cx+sw-sw/3-2} y={sleeveEnd-3} width={aw+sw/3} height={5} rx={2} fill={darken(topC,30)} />

      {/* ─── 상의 몸통 ─────────────────────────────────────────────────── */}
      <path
        d={`M${cx-sw},${shoulderY} L${cx+sw},${shoulderY} L${cx+ww},${waistY} L${cx-ww},${waistY} Z`}
        fill={`url(#topGrad)`}
      />
      {/* 상의 세로 주름 */}
      <line x1={cx} y1={shoulderY+14} x2={cx} y2={waistY-8} stroke={darken(topC,18)} strokeWidth="1" opacity="0.4" />
      {/* 상의 어깨선 */}
      <line x1={cx-sw} y1={shoulderY} x2={cx+sw} y2={shoulderY} stroke={darken(topC,25)} strokeWidth="1.5" opacity="0.5" />

      {/* ─── 겉옷 ───────────────────────────────────────────────────────── */}
      {outerC && (
        <g>
          {/* 겉옷 소매 */}
          <path
            d={`M${cx-sw-2},${shoulderY-2} L${cx-sw-aw-4},${shoulderY+2} L${cx-sw-aw},${sleeveEnd+6} L${cx-sw+2},${sleeveEnd+4} Z`}
            fill={`url(#outerGrad)`} opacity="0.92"
          />
          <path
            d={`M${cx+sw+2},${shoulderY-2} L${cx+sw+aw+4},${shoulderY+2} L${cx+sw+aw},${sleeveEnd+6} L${cx+sw-2},${sleeveEnd+4} Z`}
            fill={`url(#outerGrad)`} opacity="0.92"
          />
          {/* 겉옷 몸통 */}
          <path
            d={`M${cx-sw-2},${shoulderY-2} L${cx+sw+2},${shoulderY-2} L${cx+ww+6},${waistY+12} L${cx-ww-6},${waistY+12} Z`}
            fill={`url(#outerGrad)`} opacity="0.92"
          />
          {/* 라펠 (안쪽 상의 색 보임) */}
          <path d={`M${cx-sw-2},${shoulderY-2} L${cx-6},${shoulderY+46} L${cx-6},${waistY+12} L${cx-ww-6},${waistY+12} Z`}
            fill={topC} opacity="0.88" />
          <path d={`M${cx+sw+2},${shoulderY-2} L${cx+6},${shoulderY+46} L${cx+6},${waistY+12} L${cx+ww+6},${waistY+12} Z`}
            fill={topC} opacity="0.88" />
          {/* 깃(collar) */}
          <path d={`M${cx-sw-2},${shoulderY-2} Q${cx},${shoulderY+8} ${cx+sw+2},${shoulderY-2}`}
            fill={darken(outerC,30)} opacity="0.7" />
          {/* 단추 */}
          {[130,152,174].map((y,i) => (
            <circle key={i} cx={cx} cy={y} r={3.5} fill={darken(outerC,50)} />
          ))}
        </g>
      )}

      {/* ─── 넥라인 ─────────────────────────────────────────────────────── */}
      {!outerC && (
        <path
          d={`M${cx-16},${shoulderY+3} Q${cx},${shoulderY+22} ${cx+16},${shoulderY+3}`}
          stroke={darken(topC,28)} strokeWidth="1.5" fill="none" opacity="0.6"
        />
      )}

      {/* ─── 신발 ───────────────────────────────────────────────────────── */}
      {/* 왼쪽 신발 */}
      <ellipse cx={cx-hw/2-gap/2} cy={legEnd+10} rx={hw/2+5} ry={11} fill={shoeC} />
      <ellipse cx={cx-hw/2-gap/2-3} cy={legEnd+9} rx={hw/2+3} ry={8} fill={lighten(shoeC,25)} />
      <rect x={cx-hw-2} y={legEnd+14} width={hw-gap+2} height={5} rx={3} fill={darken(shoeC,20)} />

      {/* 오른쪽 신발 */}
      <ellipse cx={cx+hw/2+gap/2} cy={legEnd+10} rx={hw/2+5} ry={11} fill={shoeC} />
      <ellipse cx={cx+hw/2+gap/2+3} cy={legEnd+9} rx={hw/2+3} ry={8} fill={lighten(shoeC,25)} />
      <rect x={cx+gap} y={legEnd+14} width={hw-gap+2} height={5} rx={3} fill={darken(shoeC,20)} />

      {/* ─── 손 ─────────────────────────────────────────────────────────── */}
      <ellipse cx={cx-sw-aw/2+3} cy={sleeveEnd+12} rx={9} ry={10} fill={skinBase} />
      <ellipse cx={cx+sw+aw/2-3} cy={sleeveEnd+12} rx={9} ry={10} fill={skinBase} />
      {/* 손 음영 */}
      <ellipse cx={cx-sw-aw/2+3} cy={sleeveEnd+14} rx={7} ry={6} fill={skinShadow} opacity={0.2} />
      <ellipse cx={cx+sw+aw/2-3} cy={sleeveEnd+14} rx={7} ry={6} fill={skinShadow} opacity={0.2} />

      {/* ─── 얼굴 (맨 위) ──────────────────────────────────────────────── */}
      <KoreanFace gender={profile.gender} cx={cx} headY={headY} />
    </svg>
  );
}
