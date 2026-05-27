'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

// BeforeInstallPromptEvent는 표준 타입에 없으므로 선언
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
import WeatherCard from '@/components/WeatherCard';
import YesterdayCard from '@/components/YesterdayCard';
import OutfitCard from '@/components/OutfitCard';
import AdBanner from '@/components/AdBanner';

type Gender = 'male' | 'female' | 'other';

interface UserProfile {
  gender: Gender | null;
  age: number | null;
}

interface SavedProfile {
  id: string;
  gender: Gender | null;
  age: number | null;
  usedAt: number;        // 마지막 사용 시각
  cachedOutfit?: OutfitState; // 1시간 캐시
  cachedAt?: number;          // 캐시 저장 시각
}

const HISTORY_KEY = 'weather-outfit-history';
const MAX_HISTORY = 5;
const ONE_HOUR    = 3600 * 1000;

function loadHistory(): SavedProfile[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]');
  } catch { return []; }
}

function saveToHistory(profile: UserProfile): SavedProfile[] {
  if (!profile.gender && !profile.age) return loadHistory();
  const existing = loadHistory();
  // 동일한 gender+age 항목의 캐시를 계승하면서 맨 앞으로 이동
  const prev = existing.find(
    (p) => p.gender === profile.gender && p.age === profile.age
  );
  const deduped = existing.filter(
    (p) => !(p.gender === profile.gender && p.age === profile.age)
  );
  const next: SavedProfile[] = [
    {
      id: prev?.id ?? Date.now().toString(),
      gender: profile.gender,
      age: profile.age,
      usedAt: Date.now(),
      cachedOutfit: prev?.cachedOutfit,
      cachedAt: prev?.cachedAt,
    },
    ...deduped,
  ].slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  return next;
}

/** 추천 결과를 해당 프로필의 캐시로 저장 */
function cacheOutfitToHistory(profile: UserProfile, outfit: OutfitState): SavedProfile[] {
  const existing = loadHistory();
  const next = existing.map((p) =>
    p.gender === profile.gender && p.age === profile.age
      ? { ...p, cachedOutfit: outfit, cachedAt: Date.now() }
      : p
  );
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  return next;
}

function deleteFromHistory(id: string): SavedProfile[] {
  const next = loadHistory().filter((p) => p.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  return next;
}

/** 캐시가 1시간 이내에 유효한지 확인 */
function isCacheValid(saved: SavedProfile): boolean {
  return !!(
    saved.cachedOutfit &&
    saved.cachedAt &&
    Date.now() - saved.cachedAt < ONE_HOUR
  );
}

interface WeatherState {
  location: { city: string; district: string; country: string; lat: number; lon: number };
  current: {
    temperature: number;
    apparentTemperature: number;
    humidity: number;
    windSpeed: number;
    precipitation: number;
    weatherCode: number;
    label: string;
    emoji: string;
    isDay: boolean;
    todayMax: number;
    todayMin: number;
    uvIndex: number;
  };
  yesterday: {
    tempMax: number;
    tempMin: number;
    precipitation: number;
    windSpeed: number;
    humidity: number;
    weatherCode: number;
    label: string;
    emoji: string;
    date: string;
  };
}

interface OutfitState {
  recommendation: {
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
  };
  source: 'ai' | 'rule';
}

type Status = 'idle' | 'locating' | 'loading' | 'done' | 'error';

export default function HomePage() {
  const [status, setStatus]           = useState<Status>('idle');
  const [error, setError]             = useState<string>('');
  const [weather, setWeather]         = useState<WeatherState | null>(null);
  const [outfit, setOutfit]           = useState<OutfitState | null>(null);
  const [outfitLoading, setOutfitLoading] = useState(false);
  const [profile, setProfile]         = useState<UserProfile>({ gender: null, age: null });
  const [ageInput, setAgeInput]       = useState<string>('');
  const [history, setHistory]         = useState<SavedProfile[]>([]);
  const weatherRef = useRef<WeatherState | null>(null);

  // PWA 설치 배너
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // localStorage는 클라이언트에서만 읽기
  useEffect(() => { setHistory(loadHistory()); }, []);

  // 옷차림만 다시 요청 (완료 후 localStorage에 캐싱)
  const fetchOutfit = useCallback(async (w: WeatherState, p: UserProfile) => {
    setOutfitLoading(true);
    setOutfit(null);
    try {
      const res = await fetch('/api/outfit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current:  w.current,
          location: w.location,
          age:      p.age,
          gender:   p.gender,
        }),
      });
      if (res.ok) {
        const result: OutfitState = await res.json();
        setOutfit(result);
        // 결과를 히스토리에 캐싱 (1시간 유효)
        setHistory(cacheOutfitToHistory(p, result));
      }
    } finally {
      setOutfitLoading(false);
    }
  }, []);

  const fetchWeatherAndOutfit = useCallback(async (lat: number, lon: number, p: UserProfile) => {
    setStatus('loading');
    setError('');
    setOutfit(null);

    try {
      const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? '날씨 정보를 불러오지 못했습니다');
      }
      const w: WeatherState = await res.json();
      setWeather(w);
      weatherRef.current = w;
      setStatus('done');
      await fetchOutfit(w, p);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다');
      setStatus('error');
    }
  }, [fetchOutfit]);

  const requestLocation = useCallback((p: UserProfile) => {
    setStatus('locating');
    setError('');
    const go = (lat: number, lon: number) => fetchWeatherAndOutfit(lat, lon, p);

    if (!navigator.geolocation) { go(37.5665, 126.978); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => go(pos.coords.latitude, pos.coords.longitude),
      ()    => go(37.5665, 126.978),
      { timeout: 10000, maximumAge: 300000 }
    );
  }, [fetchWeatherAndOutfit]);

  useEffect(() => { requestLocation(profile); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 프로필 적용 공통 함수
  const applyProfile = useCallback((p: UserProfile) => {
    setProfile(p);
    const next = saveToHistory(p);
    setHistory(next);
    if (weatherRef.current) fetchOutfit(weatherRef.current, p);
  }, [fetchOutfit]);

  // 입력폼 → 적용
  const handleProfileApply = () => {
    const parsed = parseInt(ageInput, 10);
    const newAge = !isNaN(parsed) && parsed >= 5 && parsed <= 100 ? parsed : null;
    applyProfile({ ...profile, age: newAge });
  };

  // 이력에서 선택 — 1시간 이내 캐시가 있으면 API 호출 없이 즉시 표시
  const handleSelectHistory = (saved: SavedProfile) => {
    setAgeInput(saved.age?.toString() ?? '');
    const p: UserProfile = { gender: saved.gender, age: saved.age };
    setProfile(p);

    if (isCacheValid(saved)) {
      // ✅ 캐시 히트: 즉시 표시
      setOutfit(saved.cachedOutfit!);
      // usedAt만 갱신해서 맨 앞으로 올리기
      const existing = loadHistory();
      const reordered: SavedProfile[] = [
        { ...saved, usedAt: Date.now() },
        ...existing.filter((x) => x.id !== saved.id),
      ];
      localStorage.setItem(HISTORY_KEY, JSON.stringify(reordered));
      setHistory(reordered);
    } else {
      // 캐시 없거나 만료 → 새로 요청
      applyProfile(p);
    }
  };

  // 이력 삭제
  const handleDeleteHistory = (id: string) => {
    setHistory(deleteFromHistory(id));
  };

  // 클라이언트에서만 시간 렌더 (hydration 불일치 방지)
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

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShowInstall(false);
    setDeferredPrompt(null);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-white/70 backdrop-blur-md border-b border-white/50 header-safe">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-gray-800">🌤️ 날씨 &amp; 옷차림</h1>
            <p className="text-xs text-gray-500">{dateStr}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-700">{timeStr}</p>
            <button
              onClick={() => requestLocation(profile)}
              disabled={status === 'locating' || status === 'loading'}
              className="text-xs text-indigo-600 hover:text-indigo-800 disabled:opacity-40 transition-colors"
            >
              {status === 'loading' || status === 'locating' ? '⏳ 로딩 중...' : '🔄 새로고침'}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5 pb-safe">
        {/* 로딩 */}
        {(status === 'idle' || status === 'locating' || status === 'loading') && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-14 h-14 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
            <p className="text-gray-500 text-sm">
              {status === 'locating' ? '📍 위치를 확인하는 중...' : '☁️ 날씨 정보를 불러오는 중...'}
            </p>
          </div>
        )}

        {/* 오류 */}
        {status === 'error' && (
          <div className="rounded-3xl bg-red-50 border border-red-200 p-8 text-center">
            <p className="text-4xl mb-3">⚠️</p>
            <h2 className="text-lg font-bold text-red-800 mb-2">오류 발생</h2>
            <p className="text-red-600 text-sm mb-5">{error}</p>
            <button onClick={() => requestLocation(profile)} className="px-6 py-2.5 bg-red-600 text-white rounded-full text-sm font-semibold hover:bg-red-700 transition-colors">
              다시 시도
            </button>
          </div>
        )}

        {/* 날씨 + 프로필 + 추천 */}
        {status === 'done' && weather && (
          <>
            <div className="animate-fade-up card-hover">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 pl-1">🌡️ 지금 날씨</p>
              <WeatherCard weather={weather.current} location={weather.location} />
            </div>

            <div className="animate-fade-up card-hover" style={{ animationDelay: '80ms' }}>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 pl-1">📅 어제 날씨</p>
              <YesterdayCard weather={weather.yesterday} />
            </div>

            <div className="animate-fade-up" style={{ animationDelay: '160ms' }}>
              <CompareCard current={weather.current} yesterday={weather.yesterday} />
            </div>

            {/* ── 프로필 입력 카드 ── */}
            <div className="animate-fade-up" style={{ animationDelay: '210ms' }}>
              <ProfileCard
                profile={profile}
                ageInput={ageInput}
                history={history}
                onGenderChange={(g) => setProfile((p) => ({ ...p, gender: g }))}
                onAgeInput={setAgeInput}
                onApply={handleProfileApply}
                onSelectHistory={handleSelectHistory}
                onDeleteHistory={handleDeleteHistory}
                outfitLoading={outfitLoading}
              />
            </div>

            {/* ── 옷차림 추천 ── */}
            <div className="animate-fade-up" style={{ animationDelay: '270ms' }}>
              {(outfitLoading || outfit) && (
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

            {/* ── 의류 광고 배너 ── */}
            {!outfitLoading && outfit && (
              <AdBanner />
            )}
          </>
        )}

        {status === 'done' && (
          <p className="text-center text-xs text-gray-400 pb-4 animate-fade-up" style={{ animationDelay: '360ms' }}>
            날씨 데이터: OpenWeatherMap · 어제 날씨: Open-Meteo<br />
            옷차림 추천: GPT-4o-mini (OpenAI)
          </p>
        )}
      </div>

      {/* PWA 설치 배너 */}
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
                <button
                  onClick={() => setShowInstall(false)}
                  className="px-3 py-1.5 text-indigo-200 text-sm rounded-xl hover:bg-indigo-500 transition-colors"
                >
                  나중에
                </button>
                <button
                  onClick={handleInstall}
                  className="px-4 py-1.5 bg-white text-indigo-700 text-sm font-bold rounded-xl hover:bg-indigo-50 transition-colors"
                >
                  추가
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// ─── 프로필 입력 카드 ────────────────────────────────────────────────────────
const GENDER_META: Record<Gender, { label: string; emoji: string }> = {
  male:   { label: '남성', emoji: '👨' },
  female: { label: '여성', emoji: '👩' },
  other:  { label: '기타', emoji: '🧑' },
};

function profileLabel(p: { gender: Gender | null; age: number | null }): string {
  const g = p.gender ? GENDER_META[p.gender].label : null;
  const a = p.age ? `${p.age}세` : null;
  return [g, a].filter(Boolean).join(' · ') || '정보 없음';
}
function profileEmoji(p: { gender: Gender | null }): string {
  return p.gender ? GENDER_META[p.gender].emoji : '🧑';
}
function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60)   return '방금';
  if (s < 3600) return `${Math.floor(s / 60)}분 전`;
  if (s < 86400) return `${Math.floor(s / 3600)}시간 전`;
  return `${Math.floor(s / 86400)}일 전`;
}

function ProfileCard({
  profile, ageInput, history,
  onGenderChange, onAgeInput, onApply,
  onSelectHistory, onDeleteHistory,
  outfitLoading,
}: {
  profile: UserProfile;
  ageInput: string;
  history: SavedProfile[];
  onGenderChange: (g: Gender) => void;
  onAgeInput: (v: string) => void;
  onApply: () => void;
  onSelectHistory: (p: SavedProfile) => void;
  onDeleteHistory: (id: string) => void;
  outfitLoading: boolean;
}) {
  const isActive = (p: SavedProfile) =>
    p.gender === profile.gender && p.age === profile.age;

  return (
    <div className="rounded-3xl bg-white shadow-lg overflow-hidden">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-pink-500 to-orange-400 px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">👤</span>
          <h2 className="text-white font-bold">나에게 맞는 스타일 추천받기</h2>
        </div>
        <p className="text-white/80 text-xs mt-1">나이와 성별을 입력하면 색상까지 맞춤 추천해드려요</p>
      </div>

      <div className="p-5 space-y-4">

        {/* ── 최근 이력 리스트 ── */}
        {history.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-2">🕐 최근 입력 이력</p>
            <ul className="space-y-2">
              {history.map((h) => {
                const active  = isActive(h);
                const cached  = isCacheValid(h);
                return (
                  <li key={h.id} className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectHistory(h)}
                      className={`flex-1 flex items-center gap-3 px-4 py-2.5 rounded-2xl border-2 text-left transition-all ${
                        active
                          ? 'border-indigo-400 bg-indigo-50'
                          : 'border-gray-100 bg-gray-50 hover:border-indigo-200 hover:bg-indigo-50/40'
                      }`}
                    >
                      <span className="text-xl leading-none">{profileEmoji(h)}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${active ? 'text-indigo-700' : 'text-gray-700'}`}>
                          {profileLabel(h)}
                        </p>
                        <p className="text-xs text-gray-400">
                          {cached
                            ? `⚡ ${timeAgo(h.cachedAt!)} 추천 저장됨`
                            : timeAgo(h.usedAt)}
                        </p>
                      </div>
                      {/* 뱃지 영역 */}
                      <div className="flex items-center gap-1 shrink-0">
                        {cached && !active && (
                          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">
                            바로보기
                          </span>
                        )}
                        {active && (
                          <span className="text-xs bg-indigo-500 text-white px-2 py-0.5 rounded-full font-semibold">
                            현재
                          </span>
                        )}
                        {outfitLoading && active && (
                          <span className="text-xs text-indigo-400">⏳</span>
                        )}
                      </div>
                    </button>
                    {/* 삭제 버튼 */}
                    <button
                      onClick={() => onDeleteHistory(h.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-300 hover:text-red-400 hover:bg-red-50 transition-all shrink-0"
                      title="삭제"
                    >
                      ✕
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="mt-3 border-t border-gray-100" />
          </div>
        )}

        {/* ── 새 프로필 입력 ── */}
        <div>
          <p className="text-xs font-semibold text-gray-400 mb-2">
            {history.length > 0 ? '새로 입력하기' : '성별'}
          </p>
          {/* 성별 */}
          <div className="flex gap-2 mb-3">
            {(Object.entries(GENDER_META) as [Gender, { label: string; emoji: string }][]).map(([value, { label, emoji }]) => (
              <button
                key={value}
                onClick={() => onGenderChange(value)}
                className={`flex-1 py-2.5 rounded-2xl text-sm font-semibold border-2 transition-all ${
                  profile.gender === value
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 scale-[1.02]'
                    : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-300'
                }`}
              >
                <span className="block text-lg">{emoji}</span>
                {label}
              </button>
            ))}
          </div>

          {/* 나이 + 추천 버튼 */}
          <div className="flex gap-2">
            <input
              type="number"
              min={5}
              max={100}
              value={ageInput}
              onChange={(e) => onAgeInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onApply()}
              placeholder="나이 입력 (예: 28)"
              className="flex-1 border-2 border-gray-100 rounded-2xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-indigo-400 transition-colors"
            />
            <button
              onClick={onApply}
              disabled={outfitLoading || (!profile.gender && !ageInput)}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-bold rounded-2xl hover:opacity-90 disabled:opacity-40 transition-all whitespace-nowrap"
            >
              {outfitLoading ? '⏳' : '✨ 추천받기'}
            </button>
          </div>
        </div>

        {/* 현재 적용 중 표시 */}
        {(profile.gender || profile.age) && (
          <div className="rounded-2xl bg-indigo-50 border border-indigo-100 px-4 py-2.5 flex items-center gap-2">
            <span className="text-indigo-500 text-sm">✓</span>
            <span className="text-sm text-indigo-700 font-medium">
              {profileLabel(profile)} 기준으로 추천 중
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 어제 대비 오늘 카드 ──────────────────────────────────────────────────────
function CompareCard({
  current, yesterday,
}: {
  current: WeatherState['current'];
  yesterday: WeatherState['yesterday'];
}) {
  const avgYesterday = (yesterday.tempMax + yesterday.tempMin) / 2;
  const tempDiff = current.temperature - avgYesterday;
  const isWarmer = tempDiff > 0;
  const diffAbs  = Math.abs(tempDiff).toFixed(1);

  return (
    <div className="rounded-3xl bg-white shadow-lg p-5">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">📊 어제 대비 오늘</p>
      <div className="flex items-center justify-around">
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-1">어제 평균</p>
          <p className="text-2xl font-bold text-gray-700">{avgYesterday.toFixed(1)}°</p>
        </div>
        <div className="text-center px-4">
          <p className={`text-3xl font-extrabold ${isWarmer ? 'text-orange-500' : 'text-blue-500'}`}>
            {isWarmer ? '▲' : '▼'} {diffAbs}°
          </p>
          <p className="text-xs text-gray-400 mt-1">{isWarmer ? '더 따뜻함' : '더 추움'}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-1">지금</p>
          <p className="text-2xl font-bold text-gray-700">{current.temperature}°</p>
        </div>
      </div>
      {Math.abs(tempDiff) >= 5 && (
        <div className={`mt-4 rounded-2xl px-4 py-2.5 text-sm font-medium text-center ${
          isWarmer ? 'bg-orange-50 text-orange-700' : 'bg-blue-50 text-blue-700'
        }`}>
          {isWarmer ? `☀️ 어제보다 ${diffAbs}°C 더 따뜻해요! 얇게 입으세요` : `🥶 어제보다 ${diffAbs}°C 더 추워요! 따뜻하게 입으세요`}
        </div>
      )}
    </div>
  );
}
