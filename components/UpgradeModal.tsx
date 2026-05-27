'use client';

import { PLAN_LIMITS } from '@/lib/plans';

interface Props {
  used: number;
  limit: number;
  onClose: () => void;
}

const FREE  = PLAN_LIMITS.free;
const PAID  = PLAN_LIMITS.paid;

const PAID_FEATURES = [
  { icon: '⚡', text: '하루 무제한 AI 옷차림 추천' },
  { icon: '👥', text: `프로필 최대 ${PAID.maxProfiles}명 저장` },
  { icon: '🎨', text: '맞춤 색상 팔레트 추천' },
  { icon: '📵', text: '광고 없이 사용' },
  { icon: '🔥', text: '신규 기능 우선 이용' },
];

export default function UpgradeModal({ used, limit, onClose }: Props) {
  const handleUpgrade = (period: 'monthly' | 'annual') => {
    /**
     * TODO: 실제 결제 연동
     * - Toss Payments: https://docs.tosspayments.com
     * - PortOne(아임포트): https://portone.io
     *
     * 예시 (Toss Payments):
     *   const tossPayments = await loadTossPayments(clientKey);
     *   await tossPayments.requestPayment('카드', {
     *     amount: period === 'monthly' ? 1900 : 14900,
     *     orderId: `order-${Date.now()}`,
     *     orderName: `날씨코디 PRO ${period === 'monthly' ? '월' : '연'}간 구독`,
     *     successUrl: `${window.location.origin}/api/payment/success`,
     *     failUrl: `${window.location.origin}/api/payment/fail`,
     *   });
     */
    alert(`결제 연동 준비 중입니다.\n\n${period === 'monthly' ? '월 ₩1,900' : '연 ₩14,900'} 구독이 곧 오픈됩니다! 😊`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* 오버레이 */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* 모달 */}
      <div className="relative w-full max-w-sm mx-4 mb-8 sm:mb-0 bg-white rounded-3xl shadow-2xl overflow-hidden animate-slide-up">

        {/* 헤더 */}
        <div className="bg-gradient-to-br from-amber-400 to-orange-500 px-6 pt-8 pb-10 text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
          >
            ✕
          </button>
          <div className="text-5xl mb-2">🔥</div>
          <h2 className="text-white text-xl font-bold">오늘 {limit}회를 모두 사용했어요</h2>
          <p className="text-white/80 text-sm mt-1">
            PRO로 업그레이드하면 무제한으로 추천받을 수 있어요
          </p>
        </div>

        <div className="px-6 py-5 -mt-4 space-y-4">

          {/* 사용량 바 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
              <span>오늘 사용량</span>
              <span className="font-bold text-red-500">{used}/{limit}회 완료</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full w-full" />
            </div>
            <p className="text-xs text-gray-400 mt-1.5">내일 자정에 초기화됩니다</p>
          </div>

          {/* PRO 혜택 */}
          <div>
            <p className="text-xs font-bold text-gray-400 mb-2">PRO 혜택</p>
            <ul className="space-y-2">
              {PAID_FEATURES.map(({ icon, text }) => (
                <li key={text} className="flex items-center gap-2.5 text-sm text-gray-700">
                  <span className="text-base">{icon}</span>
                  {text}
                </li>
              ))}
            </ul>
          </div>

          {/* 플랜 비교 */}
          <div className="grid grid-cols-2 gap-2">
            {/* 무료 */}
            <div className="rounded-2xl border-2 border-gray-100 p-3 text-center">
              <p className="text-xs text-gray-400 mb-1">{FREE.label}</p>
              <p className="text-lg font-bold text-gray-700">₩0</p>
              <p className="text-xs text-gray-400 mt-1">하루 {FREE.dailyRecommendations}회</p>
            </div>
            {/* PRO 월간 */}
            <button
              onClick={() => handleUpgrade('monthly')}
              className="rounded-2xl border-2 border-indigo-400 bg-indigo-50 p-3 text-center hover:bg-indigo-100 transition-colors"
            >
              <p className="text-xs text-indigo-500 font-bold mb-1">{PAID.label} 🔥</p>
              <p className="text-lg font-bold text-indigo-700">₩{PAID.priceMonthly?.toLocaleString()}</p>
              <p className="text-xs text-indigo-400 mt-1">무제한/월</p>
            </button>
          </div>

          {/* 연간 플랜 */}
          <button
            onClick={() => handleUpgrade('annual')}
            className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl text-sm font-bold hover:opacity-90 transition-opacity"
          >
            ✨ 연간 구독 ₩{PAID.priceAnnual?.toLocaleString()}원 — 34% 할인
          </button>

          <button
            onClick={onClose}
            className="w-full py-2.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            내일 다시 사용하기 (무료)
          </button>
        </div>
      </div>
    </div>
  );
}
