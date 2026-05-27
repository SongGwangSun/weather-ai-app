'use client';

import { getTempColor, getTempLabel, getWindLabel } from '@/lib/weather-utils';

interface WeatherData {
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
}

interface LocationData {
  city: string;
  district: string;
  country: string;
}

export default function WeatherCard({
  weather,
  location,
}: {
  weather: WeatherData;
  location: LocationData;
}) {
  const gradientClass = getTempColor(weather.apparentTemperature);
  const tempLabel = getTempLabel(weather.apparentTemperature);

  return (
    <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${gradientClass} p-6 text-white shadow-2xl`}>
      {/* 배경 장식 */}
      <div className="absolute -right-8 -top-8 text-[120px] opacity-20 select-none pointer-events-none">
        {weather.emoji}
      </div>

      {/* 위치 */}
      <div className="mb-4">
        <p className="text-sm font-medium opacity-80">📍 {location.district && `${location.district}, `}{location.city}</p>
        <p className="text-xs opacity-60">{location.country}</p>
      </div>

      {/* 현재 기온 */}
      <div className="mb-4">
        <div className="flex items-end gap-3">
          <span className="text-7xl font-bold tracking-tight">
            {weather.temperature}°
          </span>
          <div className="mb-2">
            <p className="text-xl font-semibold">{weather.label}</p>
            <p className="text-sm opacity-80">{weather.emoji} {tempLabel}</p>
          </div>
        </div>
        <p className="text-sm opacity-75 mt-1">
          체감 {weather.apparentTemperature}°C
        </p>
      </div>

      {/* 최고/최저 */}
      <div className="flex gap-4 mb-5 text-sm font-medium">
        <span>↑ 최고 {weather.todayMax}°C</span>
        <span>↓ 최저 {weather.todayMin}°C</span>
      </div>

      {/* 세부 정보 */}
      <div className="grid grid-cols-3 gap-3">
        <StatBox icon="💧" label="습도" value={`${weather.humidity}%`} />
        <StatBox icon="💨" label="풍속" value={`${weather.windSpeed}km/h`} sub={getWindLabel(weather.windSpeed)} />
        <StatBox icon="☔" label="강수량" value={`${weather.precipitation}mm`} />
      </div>

      {weather.uvIndex > 2 && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-white/20 px-3 py-2 text-xs font-medium">
          ☀️ UV 지수 {weather.uvIndex}
          {weather.uvIndex >= 8 ? ' — 매우 높음, 선크림 필수!' :
           weather.uvIndex >= 6 ? ' — 높음, 선크림 권장' :
           ' — 보통'}
        </div>
      )}
    </div>
  );
}

function StatBox({ icon, label, value, sub }: { icon: string; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl bg-white/20 px-3 py-2 text-center backdrop-blur-sm">
      <p className="text-lg">{icon}</p>
      <p className="text-xs opacity-75">{label}</p>
      <p className="text-sm font-bold">{value}</p>
      {sub && <p className="text-xs opacity-60">{sub}</p>}
    </div>
  );
}
