'use client';

import { getTempColor } from '@/lib/weather-utils';

interface YesterdayData {
  tempMax: number;
  tempMin: number;
  precipitation: number;
  windSpeed: number;
  humidity: number;
  weatherCode: number;
  label: string;
  emoji: string;
  date: string;
}

export default function YesterdayCard({ weather }: { weather: YesterdayData }) {
  const avgTemp = (weather.tempMax + weather.tempMin) / 2;
  const gradientClass = getTempColor(avgTemp);

  // 날짜 포맷
  const dateObj = new Date(weather.date + 'T12:00:00');
  const dateStr = dateObj.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });

  return (
    <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${gradientClass} p-6 text-white shadow-2xl opacity-90`}>
      <div className="absolute -right-6 -top-6 text-[90px] opacity-15 select-none pointer-events-none">
        {weather.emoji}
      </div>

      <div className="mb-3">
        <p className="text-xs font-semibold uppercase tracking-widest opacity-70">어제 날씨</p>
        <p className="text-sm font-medium opacity-80">{dateStr}</p>
      </div>

      {/* 날씨 요약 */}
      <div className="flex items-center gap-3 mb-5">
        <span className="text-5xl">{weather.emoji}</span>
        <div>
          <p className="text-xl font-bold">{weather.label}</p>
          <p className="text-sm opacity-75">
            {weather.tempMin}° ~ {weather.tempMax}°C
          </p>
        </div>
      </div>

      {/* 세부 정보 */}
      <div className="grid grid-cols-3 gap-3">
        <StatBox icon="💧" label="평균습도" value={`${weather.humidity}%`} />
        <StatBox icon="💨" label="최대풍속" value={`${weather.windSpeed}km/h`} />
        <StatBox icon="☔" label="강수량" value={`${weather.precipitation}mm`} />
      </div>

      {weather.precipitation > 0 && (
        <p className="mt-3 text-xs opacity-75 bg-white/10 rounded-xl px-3 py-2">
          💡 어제는 비가 {weather.precipitation}mm 내렸어요
        </p>
      )}
    </div>
  );
}

function StatBox({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/20 px-3 py-2 text-center backdrop-blur-sm">
      <p className="text-lg">{icon}</p>
      <p className="text-xs opacity-75">{label}</p>
      <p className="text-sm font-bold">{value}</p>
    </div>
  );
}
