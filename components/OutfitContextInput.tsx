'use client';

export const PLACES = [
  { value: '회사/사무실', emoji: '🏢' },
  { value: '학교',        emoji: '🏫' },
  { value: '데이트',      emoji: '💑' },
  { value: '운동/헬스',   emoji: '🏃' },
  { value: '쇼핑',        emoji: '🛍️' },
  { value: '집 근처',     emoji: '🏠' },
  { value: '여행',        emoji: '✈️' },
  { value: '파티/모임',   emoji: '🎉' },
];

export const MOODS = [
  { value: '활기찬',  emoji: '😊' },
  { value: '설레는',  emoji: '🥰' },
  { value: '자신감',  emoji: '😎' },
  { value: '편안한',  emoji: '😌' },
  { value: '피곤한',  emoji: '😴' },
  { value: '바쁜',    emoji: '😤' },
];

export const STYLES = [
  { value: '캐주얼',   emoji: '👕' },
  { value: '포멀',     emoji: '👔' },
  { value: '스포티',   emoji: '🎽' },
  { value: '스트리트', emoji: '🧢' },
  { value: '미니멀',   emoji: '🤍' },
  { value: '비즈니스', emoji: '💼' },
];

interface OutfitContext {
  place: string;
  mood: string;
  style: string;
}

interface Props {
  value: OutfitContext;
  onChange: (ctx: OutfitContext) => void;
  onSubmit: () => void;
  loading: boolean;
}

export default function OutfitContextInput({ value, onChange, onSubmit, loading }: Props) {
  return (
    <div className="rounded-3xl bg-white shadow-lg overflow-hidden">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-fuchsia-500 to-pink-500 px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">✨</span>
          <h2 className="text-white font-bold">오늘 코디 정보</h2>
        </div>
        <p className="text-white/80 text-xs mt-1">더 정확한 추천을 위해 오늘 일정을 알려주세요</p>
      </div>

      <div className="p-5 space-y-5">
        {/* 방문 장소 */}
        <div>
          <p className="text-xs font-bold text-gray-500 mb-2">📍 어디 가세요?</p>
          <div className="grid grid-cols-4 gap-2">
            {PLACES.map(({ value: v, emoji }) => (
              <button
                key={v}
                onClick={() => onChange({ ...value, place: v })}
                className={`flex flex-col items-center gap-1 py-2.5 rounded-2xl text-xs font-semibold border-2 transition-all ${
                  value.place === v
                    ? 'border-fuchsia-400 bg-fuchsia-50 text-fuchsia-700 scale-[1.05]'
                    : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-fuchsia-200'
                }`}
              >
                <span className="text-lg">{emoji}</span>
                <span className="leading-tight text-center" style={{ fontSize: '10px' }}>{v}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 기분 */}
        <div>
          <p className="text-xs font-bold text-gray-500 mb-2">💭 오늘 기분은?</p>
          <div className="grid grid-cols-3 gap-2">
            {MOODS.map(({ value: v, emoji }) => (
              <button
                key={v}
                onClick={() => onChange({ ...value, mood: v })}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-2xl text-sm font-semibold border-2 transition-all ${
                  value.mood === v
                    ? 'border-pink-400 bg-pink-50 text-pink-700 scale-[1.03]'
                    : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-pink-200'
                }`}
              >
                <span className="text-lg">{emoji}</span>
                <span>{v}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 원하는 스타일 */}
        <div>
          <p className="text-xs font-bold text-gray-500 mb-2">👗 원하는 스타일</p>
          <div className="grid grid-cols-3 gap-2">
            {STYLES.map(({ value: v, emoji }) => (
              <button
                key={v}
                onClick={() => onChange({ ...value, style: v })}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-2xl text-sm font-semibold border-2 transition-all ${
                  value.style === v
                    ? 'border-violet-400 bg-violet-50 text-violet-700 scale-[1.03]'
                    : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-violet-200'
                }`}
              >
                <span className="text-lg">{emoji}</span>
                <span>{v}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 추천받기 버튼 */}
        <button
          onClick={onSubmit}
          disabled={loading || !value.place || !value.mood || !value.style}
          className="w-full py-4 bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white font-bold rounded-2xl text-base hover:opacity-90 disabled:opacity-40 transition-all shadow-lg shadow-pink-200"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              AI가 코디 중...
            </span>
          ) : (
            '✨ 지금 코디 추천받기'
          )}
        </button>

        {!value.place && !value.mood && !value.style && (
          <p className="text-center text-xs text-gray-400">장소·기분·스타일을 선택하면 활성화됩니다</p>
        )}
      </div>
    </div>
  );
}
