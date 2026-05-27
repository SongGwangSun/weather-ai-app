'use client';

import { useEffect, useState } from 'react';
import { pickAd, type AdConfig } from '@/lib/ads';

/**
 * 의류 광고 배너 컴포넌트
 * - lib/ads.ts 에서 active 광고를 랜덤 선택해 표시
 * - 광고가 없으면(active: false 전체) 아무것도 렌더링하지 않음
 */
export default function AdBanner() {
  const [ad, setAd] = useState<AdConfig | null>(null);
  const [dismissed, setDismissed] = useState(false);

  // 클라이언트에서만 랜덤 선택 (SSR hydration mismatch 방지)
  useEffect(() => {
    setAd(pickAd());
  }, []);

  if (!ad || dismissed) return null;

  const isLight = ad.textTheme === 'light';
  const textBase    = isLight ? 'text-white'       : 'text-gray-900';
  const textMuted   = isLight ? 'text-white/70'    : 'text-gray-500';
  const brandBadge  = isLight ? 'bg-white/20 text-white' : 'bg-black/10 text-gray-700';
  const adBadge     = isLight ? 'bg-white/20 text-white/80' : 'bg-black/10 text-gray-500';
  const ctaClass    = isLight
    ? 'bg-white text-gray-900 hover:bg-white/90'
    : 'bg-gray-900 text-white hover:bg-gray-800';
  const closeClass  = isLight ? 'text-white/60 hover:text-white' : 'text-gray-400 hover:text-gray-700';

  return (
    <div className="animate-fade-up" style={{ animationDelay: '360ms' }}>
      {/* 구분선 + 광고 레이블 */}
      <div className="flex items-center gap-2 mb-2 px-1">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-[10px] text-gray-400 font-medium tracking-widest uppercase">광고</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* 배너 카드 */}
      <div className={`relative rounded-3xl overflow-hidden shadow-lg bg-gradient-to-br ${ad.gradient}`}>

        {/* 닫기 버튼 */}
        <button
          onClick={() => setDismissed(true)}
          className={`absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full transition-colors z-10 ${closeClass}`}
          aria-label="광고 닫기"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        {/* 메인 콘텐츠 */}
        <div className="px-5 pt-5 pb-4">
          {/* 브랜드 뱃지 */}
          <span className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full mb-3 ${brandBadge}`}>
            {ad.brand}
          </span>

          <div className="flex items-start gap-4">
            {/* 이모지 or 이미지 */}
            <div className="shrink-0">
              {ad.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={ad.imageUrl}
                  alt={ad.brand}
                  className="w-14 h-14 rounded-2xl object-cover"
                />
              ) : (
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl ${isLight ? 'bg-white/20' : 'bg-black/10'}`}>
                  {ad.emoji ?? '🛍️'}
                </div>
              )}
            </div>

            {/* 텍스트 */}
            <div className="flex-1 min-w-0 pr-6">
              <p className={`font-bold text-base leading-tight mb-1 ${textBase}`}>
                {ad.tagline}
              </p>
              <p className={`text-xs leading-relaxed ${textMuted}`}>
                {ad.description}
              </p>
            </div>
          </div>

          {/* CTA 버튼 */}
          <a
            href={ad.ctaUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className={`mt-4 flex items-center justify-center gap-1.5 w-full py-2.5 rounded-2xl text-sm font-bold transition-colors ${ctaClass}`}
            onClick={() => {
              // 클릭 추적이 필요하면 여기에 로직 추가
              // e.g. gtag('event', 'ad_click', { ad_id: ad.id });
            }}
          >
            {ad.ctaText}
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2.5 7h9M7.5 3l4 4-4 4"/>
            </svg>
          </a>
        </div>

        {/* 하단 광고 표시 */}
        <div className={`px-5 py-2 flex justify-end border-t ${isLight ? 'border-white/10' : 'border-black/10'}`}>
          <span className={`text-[10px] ${adBadge} px-2 py-0.5 rounded-full`}>광고</span>
        </div>
      </div>
    </div>
  );
}
