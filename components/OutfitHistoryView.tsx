'use client';

import { useState } from 'react';
import type { OutfitHistoryEntry } from '@/lib/outfit-history';
import { formatDisplayDate, deleteOutfitHistory } from '@/lib/outfit-history';

// 간단한 색상 원
function ColorDot({ color }: { color: string }) {
  const COLOR_MAP: Record<string, string> = {
    흰색: '#F8F8F8', 화이트: '#F8F8F8', 크림색: '#FFF5E4', 아이보리: '#FFFFF0',
    베이지: '#E8D5B7', 카멜: '#C19A6B', 브라운: '#8B4513', 블랙: '#2C2C2E',
    차콜: '#36454F', 그레이: '#9CA3AF', 네이비: '#1e3a5f', 블루: '#3B82F6',
    카키: '#6B8E23', 올리브: '#808000', 버건디: '#800020', 와인: '#722F37',
    코랄: '#FF6B6B', 핑크: '#FFB6C1', 라벤더: '#B57BDB', 민트: '#3EB489',
    블루데님: '#4682B4', 연그레이: '#D1D5DB',
  };
  const hex = COLOR_MAP[color.replace(/\s/g, '')] ?? '#CBD5E1';
  const isWhite = hex.toUpperCase() === '#F8F8F8';
  return (
    <span
      className={`inline-block w-4 h-4 rounded-full flex-shrink-0 ${isWhite ? 'border border-gray-300' : ''}`}
      style={{ backgroundColor: hex }}
      title={color}
    />
  );
}

interface Props {
  entries: OutfitHistoryEntry[];
  onUpdate: (entries: OutfitHistoryEntry[]) => void;
  onClose: () => void;
}

export default function OutfitHistoryView({ entries, onUpdate, onClose }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  function handleDelete(id: string) {
    if (!confirm('이 기록을 삭제할까요?')) return;
    onUpdate(deleteOutfitHistory(id));
  }

  if (entries.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-8 text-center">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 text-2xl">✕</button>
          <div className="text-6xl mb-4">📅</div>
          <h3 className="font-bold text-gray-800 text-lg mb-2">히스토리가 없어요</h3>
          <p className="text-gray-500 text-sm">코디 추천을 받으면 여기에 저장됩니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-500 px-6 py-5 rounded-t-3xl sm:rounded-t-3xl flex-shrink-0">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white text-2xl">✕</button>
          <h2 className="text-white font-bold text-xl">📅 코디 히스토리</h2>
          <p className="text-white/75 text-sm mt-1">총 {entries.length}개의 기록</p>
        </div>

        {/* 리스트 */}
        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          {entries.map((entry) => {
            const isOpen = expanded === entry.id;
            const rec = entry.recommendation;
            const colors = [
              ...(rec.topColors    ?? []),
              ...(rec.bottomColors ?? []),
              ...(rec.outerColors  ?? []),
            ].filter((c, i, a) => a.indexOf(c) === i).slice(0, 5);

            return (
              <div key={entry.id} className="rounded-2xl border border-gray-100 bg-gray-50 overflow-hidden">
                {/* 요약 헤더 */}
                <button
                  onClick={() => setExpanded(isOpen ? null : entry.id)}
                  className="w-full flex items-start gap-3 p-4 text-left hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-indigo-600">
                        {formatDisplayDate(entry.date)}
                      </span>
                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                        {entry.place}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-gray-800 truncate">{rec.summary}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{entry.weatherSummary}</p>
                    {/* 컬러 미리보기 */}
                    {colors.length > 0 && (
                      <div className="flex items-center gap-1 mt-2">
                        {colors.map((c, i) => <ColorDot key={i} color={c} />)}
                        <span className="text-xs text-gray-400 ml-1">{entry.style}</span>
                      </div>
                    )}
                  </div>
                  <span className="text-gray-400 text-sm mt-1 flex-shrink-0">
                    {isOpen ? '▲' : '▼'}
                  </span>
                </button>

                {/* 상세 정보 */}
                {isOpen && (
                  <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
                    {/* 기분/스타일 태그 */}
                    <div className="flex gap-2 flex-wrap">
                      <span className="text-xs bg-pink-100 text-pink-700 px-2.5 py-1 rounded-full font-medium">
                        기분: {entry.mood}
                      </span>
                      <span className="text-xs bg-violet-100 text-violet-700 px-2.5 py-1 rounded-full font-medium">
                        스타일: {entry.style}
                      </span>
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full font-medium">
                        {entry.source === 'ai' ? '✨ AI 추천' : '📋 기본 추천'}
                      </span>
                    </div>

                    {/* 의류 상세 */}
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { icon: '👕', label: '상의', val: rec.top,    colors: rec.topColors },
                        { icon: '👖', label: '하의', val: rec.bottom, colors: rec.bottomColors },
                        { icon: '🧥', label: '겉옷', val: rec.outer,  colors: rec.outerColors },
                        { icon: '👟', label: '신발', val: rec.shoes,  colors: rec.shoeColors },
                      ].map(({ icon, label, val, colors: cs }) => (
                        <div key={label} className="rounded-xl bg-white border border-gray-100 p-2.5">
                          <p className="text-xs text-gray-400 mb-1">{icon} {label}</p>
                          <p className="text-xs font-semibold text-gray-700 leading-snug">{val}</p>
                          {cs && cs.length > 0 && val !== '겉옷 불필요' && (
                            <div className="flex gap-1 mt-1.5">
                              {cs.map((c, i) => <ColorDot key={i} color={c} />)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* 팁 */}
                    {rec.tips.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-400 font-semibold mb-1.5">💡 팁</p>
                        <ul className="space-y-1">
                          {rec.tips.map((t, i) => (
                            <li key={i} className="text-xs text-gray-600 flex gap-1.5">
                              <span className="text-green-500">✓</span>{t}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* 삭제 버튼 */}
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="w-full text-xs text-red-400 hover:text-red-600 py-2 transition-colors"
                    >
                      🗑️ 이 기록 삭제
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
