'use client';

import { signIn } from 'next-auth/react';
import { PLAN_LIMITS } from '@/lib/plans';

interface Props {
  onClose: () => void;
}

export default function LoginModal({ onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* 배경 오버레이 */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* 모달 카드 */}
      <div className="relative w-full max-w-sm mx-4 mb-8 sm:mb-0 bg-white rounded-3xl shadow-2xl overflow-hidden animate-slide-up">

        {/* 헤더 그라디언트 */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 px-6 pt-8 pb-10">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
          >
            ✕
          </button>
          <div className="text-center">
            <div className="text-5xl mb-3">🌤️</div>
            <h2 className="text-white text-xl font-bold">로그인이 필요해요</h2>
            <p className="text-white/80 text-sm mt-1">AI 옷차림 추천을 받으려면<br />로그인해 주세요</p>
          </div>
        </div>

        {/* 혜택 목록 */}
        <div className="px-6 py-5 -mt-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
            <p className="text-xs font-bold text-gray-400 mb-3">✨ 무료 회원 혜택</p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                하루 {PLAN_LIMITS.free.dailyRecommendations}회 AI 옷차림 추천
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                프로필 최대 {PLAN_LIMITS.free.maxProfiles}명 저장
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                현재·어제 날씨 무제한 확인
              </li>
            </ul>
          </div>

          {/* Google 로그인 버튼 */}
          <button
            onClick={() => signIn('google', { callbackUrl: '/' })}
            className="w-full flex items-center justify-center gap-3 py-3.5 bg-white border-2 border-gray-200 rounded-2xl text-sm font-bold text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-all shadow-sm"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google로 계속하기
          </button>

          <p className="text-center text-xs text-gray-400 mt-3">
            로그인하면 이용약관 및 개인정보처리방침에 동의합니다
          </p>
        </div>
      </div>
    </div>
  );
}
