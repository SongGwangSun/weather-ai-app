'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import WeatherCard from '@/components/WeatherCard';
import YesterdayCard from '@/components/YesterdayCard';
import OutfitCard from '@/components/OutfitCard';
import AdBanner from '@/components/AdBanner';
import LoginModal from '@/components/LoginModal';
import UpgradeModal from '@/components/UpgradeModal';
import ProfileSetupModal from '@/components/ProfileSetupModal';
import OutfitContextInput from '@/components/OutfitContextInput';
import OutfitHistoryView from '@/components/OutfitHistoryView';
import AvatarSVG from '@/components/AvatarSVG';
import { PLAN_LIMITS } from '@/lib/plans';
import { loadProfile, saveProfile } from '@/lib/profile';
import type { UserProfile } from '@/lib/profile';
import {
  loadOutfitHistory, addOutfitHistory, todayDateString,
} from '@/lib/outfit-history';
import type { OutfitHistoryEntry } from '@/lib/outfit-history';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface WeatherState {
  location: { city: string; district: string; country: string; lat: number; lon: number };
  current: {
    temperature: number; apparentTemperature: number; humidity: number;
    windSpeed: number; precipitation: number; weatherCode: number;
    label: string; emoji: string; isDay: boolean;
    todayMax: number; todayMin: number; uvIndex: number;
  };
  yesterday: {
    tempMax: number; tempMin: number; precipitation: number; windSpeed: number;
    humidity: number; weatherCode: number; label: string; emoji: string; date: string;
  };
}

interface OutfitState {
  recommendation: {
    summary: string; top: string; topColors?: string[];
    bottom: string; bottomColors?: string[];
    outer: string; outerColors?: string[];
    shoes: string; shoeColors?: string[];
    colorStory?: string; accessories: string[]; tips: string[]; warning: string | null;
  };
  source: 'ai' | 'rule';
}

interface OutfitContext { place: string; mood: string; style: string; }

type Status = 'idle' | 'locating' | 'loading' | 'done' | 'error';

export default function HomePage() {
  const { data: session, status: authStatus } = useSession();

  const [status, setStatus]                   = useState<Status>('idle');
  const [error, setError]                     = useState('');
  const [weather, setWeather]                 = useState<WeatherState | null>(null);
  const [outfit, setOutfit]                   = useState<OutfitState | null>(null);
  const [outfitLoading, setOutfitLoading]     = useState(false);
  const [outfitCtx, setOutfitCtx]             = useState<OutfitContext>({ place: '', mood: '', style: '' });
  const [profile, setProfile]                 = useState<UserProfile | null>(null);
  const [history, setHistory]                 = useState<OutfitHistoryEntry[]>([]);
  const [usage, setUsage]                     = useState<{ used: number; limit: number | null } | null>(null);
  const weatherRef = useRef<WeatherState | null>(null);

  // 모달
  const [showLogin,        setShowLogin]        = useState(false);
  const [showUpgrade,      setShowUpgrade]      = useState(false);
  const [upgradeData,      setUpgradeData]      = useState<{ used: number; limit: number } | null>(null);
  const [showUserMenu,     setShowUserMenu]     = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [profileEditMode,  setProfileEditMode]  = useState(false);
  const [showHistory,      setShowHistory]      = useState(false);

  // PWA
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall,    setShowInstall]    = useState(false);

  // 클라이언트 시간
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: true }));
      setDateStr(now.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }));
    };
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, []);

  // PWA 설치 이벤트
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // 초기화: localStorage에서 프로필 & 히스토리 로드
  useEffect(() => {
    const p = loadProfile();
    setProfile(p);
    setHistory(loadOutfitHistory());
  }, []);

  // 로그인 시 사용량 조회
  useEffect(() => {
    if (!session?.user) { setUsage(null); return; }
    fetch('/api/usage').then((r) => r.json())
      .then((d) => setUsage({ used: d.used, limit: d.limit }))
      .catch(() => {});
  }, [session?.user?.email]);

  // ── 날씨 로드 ───────────────────────────────────────────────────────────────
  const fetchWeather = useCallback(async (lat: number, lon: number) => {
    setStatus('loading');
    setError('');
    setOutfit(null);
    try {
      const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
      if (!res.ok) { const e = await res.json(); throw new Error(e.error ?? '날씨 오류'); }
      const w: WeatherState = await res.json();
      setWeather(w);
      weatherRef.current = w;
      setStatus('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : '알 수 없는 오류');
      setStatus('error');
    }
  }, []);

  const requestLocation = useCallback(() => {
    setStatus('locating');
    const go = (lat: number, lon: number) => fetchWeather(lat, lon);
    if (!navigator.geolocation) { go(37.5665, 126.978); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => go(pos.coords.latitude, pos.coords.longitude),
      ()    => go(37.5665, 126.978),
      { timeout: 10000, maximumAge: 300000 },
    );
  }, [fetchWeather]);

  useEffect(() => { requestLocation(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 옷차림 추천 요청 ────────────────────────────────────────────────────────
  const fetchOutfit = useCallback(async () => {
    if (!weatherRef.current) return;
    if (!session?.user) { setShowLogin(true); return; }
    if (!profile)        { setShowProfileSetup(true); return; }
    if (!outfitCtx.place || !outfitCtx.mood || !outfitCtx.style) return;

    const w = weatherRef.current;
    setOutfitLoading(true);
    setOutfit(null);
    try {
      const res = await fetch('/api/outfit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current:  w.current,
          location: w.location,
          age:      profile.age,
          gender:   profile.gender,
          height:   profile.height,
          weight:   profile.weight,
          place:    outfitCtx.place,
          mood:     outfitCtx.mood,
          style:    outfitCtx.style,
        }),
      });

      if (res.status === 401) { setShowLogin(true); return; }
      if (res.status === 403) {
        const d = await res.json();
        if (d.error === 'LIMIT_REACHED') {
          setUpgradeData({ used: d.used, limit: d.limit });
          setShowUpgrade(true);
          setUsage({ used: d.used, limit: d.limit });
        }
        return;
      }

      if (res.ok) {
        const result: OutfitState & { usage?: { used: number; limit: number | null } } = await res.json();
        setOutfit(result);
        if (result.usage) setUsage({ used: result.usage.used, limit: result.usage.limit });

        // 히스토리 저장
        const weatherSummary = `${w.location.city} · ${w.current.temperature}°C · ${w.current.label}`;
        const next = addOutfitHistory({
          date:            todayDateString(),
          timestamp:       Date.now(),
          place:           outfitCtx.place,
          mood:            outfitCtx.mood,
          style:           outfitCtx.style,
          weatherSummary,
          recommendation:  result.recommendation,
          source:          result.source,
        });
        setHistory(next);
      }
    } finally {
      setOutfitLoading(false);
    }
  }, [session, profile, outfitCtx]);

  // 프로필 저장
  const handleProfileSave = (p: UserProfile) => {
    saveProfile(p);
    setProfile(p);
    setShowProfileSetup(false);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShowInstall(false);
    setDeferredPrompt(null);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200">
      {/* ── 헤더 ── */}
      <header className="sticky top-0 z-10 bg-white/70 backdrop-blur-md border-b border-white/50 header-safe">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-base font-bold text-gray-800">🌤️ 날씨코디</h1>
            <p className="text-xs text-gray-500 truncate">{dateStr}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-700">{timeStr}</p>
              <button
                onClick={requestLocation}
                disabled={status === 'locating' || status === 'loading'}
                className="text-xs text-indigo-600 hover:text-indigo-800 disabled:opacity-40 transition-colors"
              >
                {(status === 'loading' || status === 'locating') ? '⏳' : '🔄 새로고침'}
              </button>
            </div>

            {authStatus === 'loading' ? (
              <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
            ) : session?.user ? (
              <div className="relative">
                <button onClick={() => setShowUserMenu((v) => !v)} className="flex items-center gap-1.5">
                  {usage && usage.limit !== null && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      usage.used >= usage.limit ? 'bg-red-100 text-red-600' : 'bg-indigo-50 text-indigo-600'
                    }`}>{usage.used}/{usage.limit}</span>
                  )}
                  {session.user.plan === 'paid' && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">PRO</span>
                  )}
                  {session.user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={session.user.image} alt="avatar" className="w-8 h-8 rounded-full object-cover border border-gray-200" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm">👤</div>
                  )}
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 top-10 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-1 z-20">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-xs font-bold text-gray-800 truncate">{session.user.name}</p>
                      <p className="text-xs text-gray-400 truncate">{session.user.email}</p>
                    </div>
                    <button
                      onClick={() => { setShowHistory(true); setShowUserMenu(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >📅 코디 히스토리</button>
                    <button
                      onClick={() => { setProfileEditMode(true); setShowProfileSetup(true); setShowUserMenu(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >✏️ 체형 수정</button>
                    {session.user.plan === 'free' && (
                      <button
                        onClick={() => { setShowUpgrade(true); setUpgradeData({ used: usage?.used ?? 0, limit: usage?.limit ?? PLAN_LIMITS.free.dailyRecommendations }); setShowUserMenu(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-indigo-600 font-semibold hover:bg-indigo-50 transition-colors"
                      >⚡ PRO로 업그레이드</button>
                    )}
                    <button
                      onClick={() => { signOut({ callbackUrl: '/' }); setShowUserMenu(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                    >로그아웃</button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-colors"
              >로그인</button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5 pb-safe">
        {/* ── 로딩 ── */}
        {(status === 'idle' || status === 'locating' || status === 'loading') && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-14 h-14 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
            <p className="text-gray-500 text-sm">
              {status === 'locating' ? '📍 위치 확인 중...' : '☁️ 날씨 정보 로딩 중...'}
            </p>
          </div>
        )}

        {/* ── 오류 ── */}
        {status === 'error' && (
          <div className="rounded-3xl bg-red-50 border border-red-200 p-8 text-center">
            <p className="text-4xl mb-3">⚠️</p>
            <h2 className="text-lg font-bold text-red-800 mb-2">오류 발생</h2>
            <p className="text-red-600 text-sm mb-5">{error}</p>
            <button onClick={requestLocation} className="px-6 py-2.5 bg-red-600 text-white rounded-full text-sm font-semibold hover:bg-red-700 transition-colors">
              다시 시도
            </button>
          </div>
        )}

        {/* ── 메인 컨텐츠 ── */}
        {status === 'done' && weather && (
          <>
            {/* 날씨 */}
            <div className="animate-fade-up card-hover">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 pl-1">🌡️ 지금 날씨</p>
              <WeatherCard weather={weather.current} location={weather.location} />
            </div>

            <div className="animate-fade-up card-hover" style={{ animationDelay: '60ms' }}>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 pl-1">📅 어제 날씨</p>
              <YesterdayCard weather={weather.yesterday} />
            </div>

            <div className="animate-fade-up" style={{ animationDelay: '120ms' }}>
              <CompareCard current={weather.current} yesterday={weather.yesterday} />
            </div>

            {/* ── 프로필 섹션 ── */}
            <div className="animate-fade-up" style={{ animationDelay: '180ms' }}>
              {!session?.user ? (
                /* 비로그인 */
                <button
                  onClick={() => setShowLogin(true)}
                  className="w-full rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 p-6 text-center shadow-lg hover:opacity-95 transition-opacity"
                >
                  <div className="text-4xl mb-2">👗</div>
                  <p className="text-white font-bold text-base mb-1">AI 코디 추천받기</p>
                  <p className="text-white/75 text-sm mb-4">로그인하면 날씨·장소·기분에 맞는<br/>아바타 코디를 GPT-4o-mini가 추천해드려요</p>
                  <span className="inline-block bg-white text-indigo-600 font-bold text-sm px-5 py-2 rounded-xl">Google로 시작하기 →</span>
                </button>
              ) : !profile ? (
                /* 프로필 미설정 */
                <button
                  onClick={() => { setProfileEditMode(false); setShowProfileSetup(true); }}
                  className="w-full rounded-3xl bg-gradient-to-br from-violet-500 to-fuchsia-500 p-6 text-center shadow-lg hover:opacity-95 transition-opacity"
                >
                  <div className="text-5xl mb-3">🧍</div>
                  <p className="text-white font-bold text-base mb-1">나만의 아바타 만들기</p>
                  <p className="text-white/75 text-sm mb-4">성별·나이·키·몸무게를 입력하면<br/>아바타가 직접 옷을 입어 보여드려요!</p>
                  <span className="inline-block bg-white text-violet-600 font-bold text-sm px-5 py-2 rounded-xl">프로필 설정하기 →</span>
                </button>
              ) : (
                /* 프로필 카드 + 아바타 */
                <div className="rounded-3xl bg-white shadow-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 py-3.5 flex items-center justify-between">
                    <div>
                      <p className="text-white font-bold text-sm">내 프로필</p>
                      <p className="text-white/75 text-xs mt-0.5">
                        {profile.gender === 'male' ? '남성' : profile.gender === 'female' ? '여성' : '기타'} · {profile.age}세 · {profile.height}cm · {profile.weight}kg
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setShowHistory(true); }}
                        className="text-white/80 hover:text-white text-xs border border-white/30 px-3 py-1.5 rounded-xl transition-colors"
                      >📅 히스토리</button>
                      <button
                        onClick={() => { setProfileEditMode(true); setShowProfileSetup(true); }}
                        className="text-white/80 hover:text-white text-xs border border-white/30 px-3 py-1.5 rounded-xl transition-colors"
                      >✏️ 수정</button>
                    </div>
                  </div>

                  {/* 아바타 + 추천 결과 */}
                  <div className="p-5">
                    {(outfit || outfitLoading) && (
                      <div className="flex gap-4 mb-5">
                        {/* 아바타 */}
                        <div className="flex-shrink-0 bg-gradient-to-b from-violet-50 to-fuchsia-50 rounded-2xl p-3 border border-violet-100 flex items-center justify-center w-36">
                          {outfit ? (
                            <AvatarSVG profile={profile} recommendation={outfit.recommendation} size={120} />
                          ) : (
                            <div className="w-28 h-56 bg-gray-100 rounded-xl animate-pulse" />
                          )}
                        </div>
                        {/* 간략 추천 */}
                        <div className="flex-1 space-y-2">
                          {outfitLoading ? (
                            <>
                              <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
                              <div className="h-3 bg-gray-100 rounded animate-pulse w-full" />
                              <div className="h-3 bg-gray-100 rounded animate-pulse w-2/3" />
                            </>
                          ) : outfit && (
                            <>
                              <p className="text-sm font-bold text-gray-800">{outfit.recommendation.summary}</p>
                              {outfit.recommendation.colorStory && (
                                <p className="text-xs text-violet-700 bg-violet-50 rounded-xl px-3 py-1.5">
                                  🎨 {outfit.recommendation.colorStory}
                                </p>
                              )}
                              <div className="flex flex-wrap gap-1.5">
                                {[outfit.recommendation.topColors?.[0], outfit.recommendation.bottomColors?.[0]]
                                  .filter(Boolean).map((c, i) => (
                                  <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{c}</span>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 전체 추천 카드 (아래) */}
                    {(outfit || outfitLoading) && (
                      <OutfitCard
                        recommendation={outfit?.recommendation ?? {
                          summary: '', top: '', bottom: '', outer: '', shoes: '',
                          accessories: [], tips: [], warning: null,
                        }}
                        source={outfit?.source ?? 'ai'}
                        loading={outfitLoading}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ── 코디 컨텍스트 입력 (로그인 + 프로필 있을 때) ── */}
            {session?.user && profile && (
              <div className="animate-fade-up" style={{ animationDelay: '240ms' }}>
                <OutfitContextInput
                  value={outfitCtx}
                  onChange={setOutfitCtx}
                  onSubmit={fetchOutfit}
                  loading={outfitLoading}
                />
              </div>
            )}

            {/* ── 광고 배너 ── */}
            {!outfitLoading && outfit && session?.user?.plan !== 'paid' && (
              <AdBanner />
            )}

            <p className="text-center text-xs text-gray-400 pb-4 animate-fade-up" style={{ animationDelay: '300ms' }}>
              날씨: OpenWeatherMap · Open-Meteo | 코디: GPT-4o-mini
            </p>
          </>
        )}
      </div>

      {/* ── 드롭다운 닫기 ── */}
      {showUserMenu && <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />}

      {/* ── 모달들 ── */}
      {showLogin       && <LoginModal onClose={() => setShowLogin(false)} />}
      {showUpgrade     && upgradeData && (
        <UpgradeModal used={upgradeData.used} limit={upgradeData.limit} onClose={() => setShowUpgrade(false)} />
      )}
      {showProfileSetup && (
        <ProfileSetupModal
          initial={profile}
          editMode={profileEditMode}
          onSave={handleProfileSave}
          onClose={() => { setShowProfileSetup(false); setProfileEditMode(false); }}
        />
      )}
      {showHistory && (
        <OutfitHistoryView
          entries={history}
          onUpdate={setHistory}
          onClose={() => setShowHistory(false)}
        />
      )}

      {/* ── PWA 설치 배너 ── */}
      {showInstall && (
        <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up pb-safe">
          <div className="mx-auto max-w-2xl px-4 pb-4">
            <div className="bg-indigo-600 rounded-3xl shadow-2xl p-4 flex items-center gap-4">
              <span className="text-3xl shrink-0">📲</span>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm">홈 화면에 추가하기</p>
                <p className="text-indigo-200 text-xs mt-0.5">앱처럼 빠르게 날씨를 확인하세요</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => setShowInstall(false)} className="px-3 py-1.5 text-indigo-200 text-sm rounded-xl hover:bg-indigo-500 transition-colors">나중에</button>
                <button onClick={handleInstall} className="px-4 py-1.5 bg-white text-indigo-700 text-sm font-bold rounded-xl hover:bg-indigo-50 transition-colors">추가</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// ─── 어제 대비 오늘 카드 ──────────────────────────────────────────────────────
function CompareCard({ current, yesterday }: {
  current: WeatherState['current'];
  yesterday: WeatherState['yesterday'];
}) {
  const avg      = (yesterday.tempMax + yesterday.tempMin) / 2;
  const diff     = current.temperature - avg;
  const isWarmer = diff > 0;
  const abs      = Math.abs(diff).toFixed(1);

  return (
    <div className="rounded-3xl bg-white shadow-lg p-5">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">📊 어제 대비 오늘</p>
      <div className="flex items-center justify-around">
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-1">어제 평균</p>
          <p className="text-2xl font-bold text-gray-700">{avg.toFixed(1)}°</p>
        </div>
        <div className="text-center px-4">
          <p className={`text-3xl font-extrabold ${isWarmer ? 'text-orange-500' : 'text-blue-500'}`}>
            {isWarmer ? '▲' : '▼'} {abs}°
          </p>
          <p className="text-xs text-gray-400 mt-1">{isWarmer ? '더 따뜻함' : '더 추움'}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-1">지금</p>
          <p className="text-2xl font-bold text-gray-700">{current.temperature}°</p>
        </div>
      </div>
      {Math.abs(diff) >= 5 && (
        <div className={`mt-4 rounded-2xl px-4 py-2.5 text-sm font-medium text-center ${
          isWarmer ? 'bg-orange-50 text-orange-700' : 'bg-blue-50 text-blue-700'
        }`}>
          {isWarmer ? `☀️ 어제보다 ${abs}°C 따뜻해요! 얇게 입으세요` : `🥶 어제보다 ${abs}°C 추워요! 따뜻하게 입으세요`}
        </div>
      )}
    </div>
  );
}
