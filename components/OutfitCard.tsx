'use client';

// 한국어 색상명 → CSS 색상값
const COLOR_MAP: Record<string, string> = {
  흰색: '#FFFFFF', 화이트: '#FFFFFF', 크림색: '#FFF5E4', 아이보리: '#FFFFF0',
  연베이지: '#F5E6CC', 베이지: '#E8D5B7', 카멜: '#C19A6B', 브라운: '#8B4513',
  블랙: '#1C1C1E', 검정: '#1C1C1E', 차콜: '#36454F', 다크그레이: '#444',
  그레이: '#9CA3AF', 연그레이: '#D1D5DB', 슬레이트그레이: '#708090',
  네이비: '#1e3a5f', 다크네이비: '#0d2137', 블루: '#3B82F6',
  하늘색: '#87CEEB', 차분한블루: '#5B7FA6', 블루데님: '#4682B4',
  카고베이지: '#C4A882', 카키: '#6B8E23', 올리브: '#808000', 인디고: '#4B0082',
  버건디: '#800020', 와인: '#722F37', 딥로즈: '#C5485B', 테라코타: '#C86558',
  코랄: '#FF6B6B', 레드: '#DC143C',
  핑크: '#FFB6C1', 베이비핑크: '#FFD1DC', 라벤더: '#E6E6FA', 민트: '#98FF98',
  연초록: '#90EE90', 그린: '#228B22',
  누드: '#E8C4A0', 카멜브라운: '#C19A6B',
  차분한블루1: '#5B7FA6',
};

function getColorHex(name: string): string {
  const key = name.replace(/\s/g, '');
  return COLOR_MAP[key] ?? COLOR_MAP[name] ?? '#CBD5E1';
}

function needsDarkText(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}

function ColorChip({ name }: { name: string }) {
  const hex = getColorHex(name);
  const dark = needsDarkText(hex);
  const isWhitish = hex.toUpperCase() === '#FFFFFF' || hex === '#FFF5E4' || hex === '#FFFFF0';
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${isWhitish ? 'border-gray-200' : 'border-transparent'}`}
      style={{ backgroundColor: hex, color: dark ? '#1C1C1E' : '#FFFFFF' }}
    >
      {name}
    </span>
  );
}

interface Recommendation {
  summary: string;
  top: string;
  topColors?: string[];
  bottom: string;
  bottomColors?: string[];
  outer: string;
  outerColors?: string[];
  shoes: string;
  shoeColors?: string[];
  colorStory?: string;
  accessories: string[];
  tips: string[];
  warning: string | null;
}

interface OutfitCardProps {
  recommendation: Recommendation;
  source: 'ai' | 'rule';
  loading: boolean;
}

export default function OutfitCard({ recommendation, source, loading }: OutfitCardProps) {
  if (loading) {
    return (
      <div className="rounded-3xl bg-white shadow-xl p-6 animate-pulse">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-100 rounded-full" />
          <div className="h-5 bg-gray-200 rounded w-32" />
        </div>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="mb-4">
            <div className="h-3 bg-gray-100 rounded w-20 mb-2" />
            <div className="h-5 bg-gray-200 rounded w-full" />
          </div>
        ))}
      </div>
    );
  }

  const items = [
    { icon: '👕', label: '상의', value: recommendation.top,   colors: recommendation.topColors },
    { icon: '👖', label: '하의', value: recommendation.bottom, colors: recommendation.bottomColors },
    { icon: '🧥', label: '겉옷', value: recommendation.outer,  colors: recommendation.outerColors },
    { icon: '👟', label: '신발', value: recommendation.shoes,  colors: recommendation.shoeColors },
  ];

  return (
    <div className="rounded-3xl bg-white shadow-xl overflow-hidden">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">👗</span>
            <h2 className="text-white font-bold text-lg">오늘의 옷차림 추천</h2>
          </div>
          <span className="text-xs bg-white/20 text-white px-2 py-1 rounded-full font-medium">
            {source === 'ai' ? '✨ GPT-4o-mini' : '📋 기본 추천'}
          </span>
        </div>
        <p className="text-white/90 text-sm font-medium">{recommendation.summary}</p>
      </div>

      <div className="p-6">
        {/* 색상 코디 스토리 */}
        {recommendation.colorStory && (
          <div className="mb-4 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 px-4 py-3">
            <p className="text-xs text-purple-500 font-semibold mb-1">🎨 오늘의 컬러 코디</p>
            <p className="text-sm text-purple-800 font-medium">{recommendation.colorStory}</p>
          </div>
        )}

        {/* 의류 + 색상 그리드 */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {items.map((item) => (
            <div key={item.label} className="rounded-2xl bg-gray-50 border border-gray-100 p-3">
              <p className="text-xs text-gray-400 font-medium mb-1">{item.icon} {item.label}</p>
              <p className="text-sm text-gray-800 font-semibold leading-snug mb-2">{item.value}</p>
              {item.colors && item.colors.length > 0 && item.value !== '겉옷 불필요' && (
                <div className="flex flex-wrap gap-1">
                  {item.colors.map((c, i) => <ColorChip key={i} name={c} />)}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 컬러 팔레트 미리보기 */}
        {(recommendation.topColors || recommendation.shoeColors) && (
          <div className="mb-4 p-3 rounded-2xl bg-gray-50 border border-gray-100">
            <p className="text-xs text-gray-400 font-medium mb-2">🖌️ 컬러 팔레트</p>
            <div className="flex gap-2 flex-wrap">
              {[
                ...(recommendation.topColors    ?? []),
                ...(recommendation.bottomColors ?? []),
                ...(recommendation.outerColors  ?? []),
                ...(recommendation.shoeColors   ?? []),
              ]
                .filter((c, i, arr) => arr.indexOf(c) === i) // 중복 제거
                .map((c, i) => {
                  const hex = getColorHex(c);
                  const isWhitish = hex.toUpperCase() === '#FFFFFF' || hex === '#FFF5E4';
                  return (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <div
                        className={`w-8 h-8 rounded-full shadow-sm ${isWhitish ? 'border border-gray-200' : ''}`}
                        style={{ backgroundColor: hex }}
                        title={c}
                      />
                      <span className="text-[10px] text-gray-500 text-center leading-tight max-w-[36px]">{c}</span>
                    </div>
                  );
                })
              }
            </div>
          </div>
        )}

        {/* 액세서리 */}
        {recommendation.accessories.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-400 font-medium mb-2">🎒 액세서리</p>
            <div className="flex flex-wrap gap-2">
              {recommendation.accessories.map((acc, i) => (
                <span key={i} className="inline-block bg-purple-50 text-purple-700 text-xs font-medium px-3 py-1 rounded-full border border-purple-100">
                  {acc}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 팁 */}
        {recommendation.tips.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-400 font-medium mb-2">💡 외출 팁</p>
            <ul className="space-y-2">
              {recommendation.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-green-500 mt-0.5">✓</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 경고 */}
        {recommendation.warning && (
          <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3">
            <p className="text-sm text-amber-800 font-medium">⚠️ {recommendation.warning}</p>
          </div>
        )}
      </div>
    </div>
  );
}
