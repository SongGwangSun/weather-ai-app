/**
 * 의류 광고 배너 설정 파일
 * ─────────────────────────────────────────────────────
 * 광고를 추가·수정·삭제하려면 ADS 배열만 편집하면 됩니다.
 *
 * active: false → 해당 광고는 노출되지 않습니다.
 * 여러 개가 active: true이면 페이지 로드마다 랜덤으로 하나를 표시합니다.
 */

export interface AdConfig {
  id: string;
  active: boolean;

  /* 브랜드 */
  brand: string;        // 브랜드명 (작은 라벨)
  tagline: string;      // 메인 문구 (굵게)
  description: string;  // 보조 설명

  /* 링크 */
  ctaText: string;      // 버튼 텍스트
  ctaUrl: string;       // 클릭 시 이동할 URL

  /* 비주얼 */
  emoji?: string;       // 로고 대신 이모지 (imageUrl이 없을 때 사용)
  imageUrl?: string;    // 브랜드 이미지/로고 URL (절대경로 또는 /public 기준 상대경로)

  /** Tailwind 그라디언트 클래스 (배경색) */
  gradient: string;
  /** 텍스트 색상 — 'light' | 'dark' */
  textTheme: 'light' | 'dark';
}

export const ADS: AdConfig[] = [
  // ── 광고 1: 예시 ──────────────────────────────────────────────────────────
  {
    id: 'sample-musinsa',
    active: true,
    brand: '무신사',
    tagline: '오늘 날씨에 딱 맞는 스타일',
    description: '추천받은 아이템을 지금 바로 찾아보세요. 오늘 주문 시 무료배송!',
    ctaText: '쇼핑하러 가기',
    ctaUrl: 'https://www.musinsa.com',
    emoji: '🛍️',
    gradient: 'from-gray-900 to-gray-700',
    textTheme: 'light',
  },

  // ── 광고 2: 예시 ──────────────────────────────────────────────────────────
  {
    id: 'sample-29cm',
    active: false,          // ← active: false 이면 노출 안 됨
    brand: '29CM',
    tagline: '감도 높은 패션, 지금 발견하세요',
    description: '날씨에 어울리는 시즌 아이템을 큐레이션해드립니다.',
    ctaText: '컬렉션 보기',
    ctaUrl: 'https://www.29cm.co.kr',
    emoji: '✨',
    gradient: 'from-rose-500 to-pink-400',
    textTheme: 'light',
  },

  // ── 광고 3: 예시 ──────────────────────────────────────────────────────────
  {
    id: 'sample-ably',
    active: false,
    brand: '에이블리',
    tagline: '지금 날씨에 입기 좋은 신상 PICK',
    description: '매일 새로 업데이트되는 트렌디한 의류를 만나보세요.',
    ctaText: '신상 보러 가기',
    ctaUrl: 'https://www.a-bly.com',
    emoji: '👗',
    gradient: 'from-violet-500 to-purple-400',
    textTheme: 'light',
  },
];

/** active인 광고 중 하나를 랜덤으로 반환. 없으면 null */
export function pickAd(): AdConfig | null {
  const pool = ADS.filter((a) => a.active);
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}
