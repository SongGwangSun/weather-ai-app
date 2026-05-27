'use client';

interface Recommendation {
  summary: string;
  top: string;
  bottom: string;
  outer: string;
  shoes: string;
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
    { icon: '👕', label: '상의', value: recommendation.top },
    { icon: '👖', label: '하의', value: recommendation.bottom },
    { icon: '🧥', label: '겉옷', value: recommendation.outer },
    { icon: '👟', label: '신발', value: recommendation.shoes },
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
          {source === 'ai' && (
            <span className="text-xs bg-white/20 text-white px-2 py-1 rounded-full font-medium">
              ✨ AI 추천
            </span>
          )}
        </div>
        <p className="text-white/90 text-sm font-medium">{recommendation.summary}</p>
      </div>

      <div className="p-6">
        {/* 의류 추천 그리드 */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {items.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl bg-gray-50 border border-gray-100 p-3"
            >
              <p className="text-xs text-gray-400 font-medium mb-1">
                {item.icon} {item.label}
              </p>
              <p className="text-sm text-gray-800 font-semibold leading-snug">
                {item.value}
              </p>
            </div>
          ))}
        </div>

        {/* 액세서리 */}
        {recommendation.accessories.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-400 font-medium mb-2">🎒 액세서리</p>
            <div className="flex flex-wrap gap-2">
              {recommendation.accessories.map((acc, i) => (
                <span
                  key={i}
                  className="inline-block bg-purple-50 text-purple-700 text-xs font-medium px-3 py-1 rounded-full border border-purple-100"
                >
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
            <p className="text-sm text-amber-800 font-medium">
              ⚠️ {recommendation.warning}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
