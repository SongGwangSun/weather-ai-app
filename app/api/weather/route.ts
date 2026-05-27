import { NextRequest, NextResponse } from 'next/server';
import { getWeatherInfo } from '@/lib/weather-utils';

// 어제 날짜 계산
function getYesterdayDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  if (!lat || !lon) {
    return NextResponse.json({ error: '위치 정보가 필요합니다' }, { status: 400 });
  }

  const yesterday = getYesterdayDate();

  try {
    // 현재 날씨 + 오늘 최고/최저 기온
    const [currentRes, yesterdayRes, geoRes] = await Promise.all([
      fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,weather_code,wind_speed_10m,wind_direction_10m` +
        `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,uv_index_max` +
        `&timezone=auto&forecast_days=1`,
        { next: { revalidate: 300 } }
      ),
      fetch(
        `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}` +
        `&start_date=${yesterday}&end_date=${yesterday}` +
        `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code,wind_speed_10m_max,relative_humidity_2m_mean` +
        `&timezone=auto`,
        { next: { revalidate: 3600 } }
      ),
      fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
        {
          headers: { 'User-Agent': 'WeatherAI-App/1.0 songgs33@gmail.com' },
          next: { revalidate: 86400 }
        }
      ),
    ]);

    const [currentData, yesterdayData, geoData] = await Promise.all([
      currentRes.json(),
      yesterdayRes.json(),
      geoRes.json(),
    ]);

    const currentCode = currentData.current?.weather_code ?? 0;
    const yesterdayCode = yesterdayData.daily?.weather_code?.[0] ?? 0;

    const addr = geoData.address ?? {};
    const cityName =
      addr.city ?? addr.town ?? addr.village ?? addr.county ?? '현재 위치';
    const districtName = addr.suburb ?? addr.neighbourhood ?? addr.district ?? '';

    return NextResponse.json({
      location: {
        city: cityName,
        district: districtName,
        country: addr.country ?? '',
        lat: parseFloat(lat),
        lon: parseFloat(lon),
      },
      current: {
        temperature: Math.round(currentData.current.temperature_2m * 10) / 10,
        apparentTemperature: Math.round(currentData.current.apparent_temperature * 10) / 10,
        humidity: currentData.current.relative_humidity_2m,
        windSpeed: Math.round(currentData.current.wind_speed_10m * 10) / 10,
        windDirection: currentData.current.wind_direction_10m,
        precipitation: currentData.current.precipitation,
        weatherCode: currentCode,
        ...getWeatherInfo(currentCode),
        isDay: currentData.current.is_day === 1,
        todayMax: Math.round(currentData.daily?.temperature_2m_max?.[0] * 10) / 10,
        todayMin: Math.round(currentData.daily?.temperature_2m_min?.[0] * 10) / 10,
        uvIndex: currentData.daily?.uv_index_max?.[0] ?? 0,
      },
      yesterday: {
        tempMax: Math.round(yesterdayData.daily?.temperature_2m_max?.[0] * 10) / 10,
        tempMin: Math.round(yesterdayData.daily?.temperature_2m_min?.[0] * 10) / 10,
        precipitation: Math.round((yesterdayData.daily?.precipitation_sum?.[0] ?? 0) * 10) / 10,
        windSpeed: Math.round((yesterdayData.daily?.wind_speed_10m_max?.[0] ?? 0) * 10) / 10,
        humidity: Math.round(yesterdayData.daily?.relative_humidity_2m_mean?.[0] ?? 0),
        weatherCode: yesterdayCode,
        ...getWeatherInfo(yesterdayCode),
        date: yesterday,
      },
    });
  } catch (err) {
    console.error('날씨 API 오류:', err);
    return NextResponse.json({ error: '날씨 정보를 가져오는데 실패했습니다' }, { status: 500 });
  }
}
