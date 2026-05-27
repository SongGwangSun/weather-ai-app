import { NextRequest, NextResponse } from 'next/server';

const OWM = process.env.OPENWEATHER_API_KEY!;

/* ── OpenWeatherMap 날씨 코드 → 한국어 ─────────────────────────────────── */
const OWM_INFO: Record<number, { label: string; emoji: string }> = {
  200: { label: '뇌우(약한 비)', emoji: '⛈️' }, 201: { label: '뇌우', emoji: '⛈️' },
  202: { label: '뇌우(강한 비)', emoji: '⛈️' }, 210: { label: '가벼운 뇌우', emoji: '🌩️' },
  211: { label: '뇌우', emoji: '⛈️' },          212: { label: '강한 뇌우', emoji: '⛈️' },
  221: { label: '뇌우', emoji: '⛈️' },          230: { label: '뇌우+이슬비', emoji: '⛈️' },
  231: { label: '뇌우+이슬비', emoji: '⛈️' },   232: { label: '뇌우+이슬비', emoji: '⛈️' },
  300: { label: '가벼운 이슬비', emoji: '🌦️' }, 301: { label: '이슬비', emoji: '🌦️' },
  302: { label: '강한 이슬비', emoji: '🌧️' },   310: { label: '이슬비', emoji: '🌦️' },
  311: { label: '이슬비', emoji: '🌧️' },        312: { label: '강한 이슬비', emoji: '🌧️' },
  313: { label: '소나기+이슬비', emoji: '🌧️' }, 314: { label: '강한 소나기', emoji: '🌧️' },
  321: { label: '소나기성 이슬비', emoji: '🌦️' },
  500: { label: '약한 비', emoji: '🌧️' },       501: { label: '보통 비', emoji: '🌧️' },
  502: { label: '강한 비', emoji: '🌧️' },       503: { label: '매우 강한 비', emoji: '⛈️' },
  504: { label: '폭우', emoji: '⛈️' },          511: { label: '어는 비', emoji: '🌨️' },
  520: { label: '가벼운 소나기', emoji: '🌦️' }, 521: { label: '소나기', emoji: '🌧️' },
  522: { label: '강한 소나기', emoji: '⛈️' },   531: { label: '불규칙 소나기', emoji: '🌦️' },
  600: { label: '가벼운 눈', emoji: '🌨️' },     601: { label: '눈', emoji: '❄️' },
  602: { label: '강한 눈', emoji: '❄️' },       611: { label: '진눈깨비', emoji: '🌨️' },
  612: { label: '진눈깨비', emoji: '🌨️' },      613: { label: '소나기성 진눈깨비', emoji: '🌨️' },
  615: { label: '비+눈', emoji: '🌨️' },         616: { label: '비+눈', emoji: '🌨️' },
  620: { label: '소나기성 눈', emoji: '🌨️' },   621: { label: '소나기성 눈', emoji: '❄️' },
  622: { label: '강한 소나기성 눈', emoji: '❄️' },
  701: { label: '안개', emoji: '🌫️' },          711: { label: '연기', emoji: '🌫️' },
  721: { label: '실안개', emoji: '🌫️' },        731: { label: '모래 폭풍', emoji: '🌫️' },
  741: { label: '안개', emoji: '🌫️' },          751: { label: '모래', emoji: '🌫️' },
  761: { label: '먼지', emoji: '🌫️' },          762: { label: '화산재', emoji: '🌋' },
  771: { label: '돌풍', emoji: '🌬️' },          781: { label: '토네이도', emoji: '🌪️' },
  800: { label: '맑음', emoji: '☀️' },
  801: { label: '구름 조금', emoji: '🌤️' },     802: { label: '부분적으로 흐림', emoji: '⛅' },
  803: { label: '흐림', emoji: '🌥️' },          804: { label: '흐림', emoji: '☁️' },
};

/* WMO(Open-Meteo) 코드 → 한국어 (어제 폴백용) */
const WMO_INFO: Record<number, { label: string; emoji: string }> = {
  0:  { label: '맑음', emoji: '☀️' },           1: { label: '대체로 맑음', emoji: '🌤️' },
  2:  { label: '부분적으로 흐림', emoji: '⛅' }, 3: { label: '흐림', emoji: '☁️' },
  45: { label: '안개', emoji: '🌫️' },           48: { label: '안개', emoji: '🌫️' },
  51: { label: '가벼운 이슬비', emoji: '🌦️' }, 53: { label: '이슬비', emoji: '🌦️' },
  55: { label: '강한 이슬비', emoji: '🌧️' },
  61: { label: '가벼운 비', emoji: '🌧️' },     63: { label: '비', emoji: '🌧️' },
  65: { label: '강한 비', emoji: '⛈️' },
  71: { label: '가벼운 눈', emoji: '🌨️' },     73: { label: '눈', emoji: '❄️' },
  75: { label: '강한 눈', emoji: '❄️' },
  80: { label: '소나기', emoji: '🌦️' },         81: { label: '소나기', emoji: '🌧️' },
  82: { label: '강한 소나기', emoji: '⛈️' },
  95: { label: '뇌우', emoji: '⛈️' },           96: { label: '뇌우(우박)', emoji: '⛈️' },
  99: { label: '강한 뇌우(우박)', emoji: '⛈️' },
};

function owmInfo(id: number) { return OWM_INFO[id] ?? { label: '알 수 없음', emoji: '🌡️' }; }
function wmoInfo(id: number) { return WMO_INFO[id] ?? { label: '알 수 없음', emoji: '🌡️' }; }

function round1(v: number) { return Math.round(v * 10) / 10; }

function yesterdayDateStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}
function yesterdayNoonUnix() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  d.setHours(12, 0, 0, 0);
  return Math.floor(d.getTime() / 1000);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');
  if (!lat || !lon) return NextResponse.json({ error: '위치 정보가 필요합니다' }, { status: 400 });

  try {
    /* ── 1. 현재 날씨 + 역지오코딩 (OWM) ─────────────────────────────── */
    const [currentRes, geoRes] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OWM}&units=metric&lang=ko`),
      fetch(`http://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${OWM}`),
    ]);

    if (!currentRes.ok) {
      const e = await currentRes.json().catch(() => ({}));
      throw new Error(e.message ?? '현재 날씨 API 오류');
    }

    const cur = await currentRes.json();
    const geoArr: { name: string; local_names?: Record<string, string>; country: string; state?: string }[] =
      geoRes.ok ? await geoRes.json() : [];
    const geoPlace = geoArr[0];

    const weatherId = cur.weather?.[0]?.id ?? 800;
    const info      = owmInfo(weatherId);
    const isDay     = cur.dt > cur.sys.sunrise && cur.dt < cur.sys.sunset;
    const windKmh   = round1((cur.wind?.speed ?? 0) * 3.6);
    const precip    = round1((cur.rain?.['1h'] ?? 0) + (cur.snow?.['1h'] ?? 0));

    // 위치명 (한국어 우선)
    const cityKo    = geoPlace?.local_names?.['ko'] ?? geoPlace?.name ?? cur.name ?? '현재 위치';
    const stateKo   = geoPlace?.state ?? '';

    /* ── 2. 어제 날씨: OWM One Call 3.0 timemachine 시도 → Open-Meteo 폴백 ── */
    const yDate = yesterdayDateStr();
    let yesterdayResult;

    const tmRes = await fetch(
      `https://api.openweathermap.org/data/3.0/onecall/timemachine?lat=${lat}&lon=${lon}&dt=${yesterdayNoonUnix()}&appid=${OWM}&units=metric&lang=ko`
    );

    if (tmRes.ok) {
      /* OWM One Call 3.0 성공 */
      const tm = await tmRes.json();
      const hours: { temp: number; humidity: number; wind_speed: number; weather: { id: number }[]; rain?: { '1h': number }; snow?: { '1h': number } }[] =
        tm.data ?? [];

      const temps   = hours.map(h => h.temp).filter(Boolean);
      const tMax    = temps.length ? round1(Math.max(...temps)) : round1(cur.main.temp_max);
      const tMin    = temps.length ? round1(Math.min(...temps)) : round1(cur.main.temp_min);
      const precSum = round1(hours.reduce((s, h) => s + (h.rain?.['1h'] ?? 0) + (h.snow?.['1h'] ?? 0), 0));
      const windMax = round1(Math.max(...hours.map(h => (h.wind_speed ?? 0) * 3.6), 0));
      const humid   = Math.round(hours.reduce((s, h) => s + (h.humidity ?? 0), 0) / Math.max(hours.length, 1));
      const noon    = hours.find(h => { const hr = new Date(h as unknown as number * 1000).getHours(); return hr >= 11 && hr <= 13; }) ?? hours[Math.floor(hours.length / 2)] ?? hours[0];
      const yId     = noon?.weather?.[0]?.id ?? 800;

      yesterdayResult = { tempMax: tMax, tempMin: tMin, precipitation: precSum, windSpeed: windMax, humidity: humid, weatherCode: yId, ...owmInfo(yId), date: yDate };

    } else {
      /* Open-Meteo 아카이브 폴백 */
      const archRes = await fetch(
        `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}` +
        `&start_date=${yDate}&end_date=${yDate}` +
        `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code,wind_speed_10m_max,relative_humidity_2m_mean` +
        `&timezone=auto`
      );
      if (archRes.ok) {
        const arch = await archRes.json();
        const wCode = arch.daily?.weather_code?.[0] ?? 0;
        yesterdayResult = {
          tempMax:       round1(arch.daily?.temperature_2m_max?.[0] ?? cur.main.temp_max),
          tempMin:       round1(arch.daily?.temperature_2m_min?.[0] ?? cur.main.temp_min),
          precipitation: round1(arch.daily?.precipitation_sum?.[0] ?? 0),
          windSpeed:     round1(arch.daily?.wind_speed_10m_max?.[0] ?? 0),
          humidity:      Math.round(arch.daily?.relative_humidity_2m_mean?.[0] ?? cur.main.humidity),
          weatherCode:   wCode,
          ...wmoInfo(wCode),
          date: yDate,
        };
      } else {
        yesterdayResult = {
          tempMax: round1(cur.main.temp_max), tempMin: round1(cur.main.temp_min),
          precipitation: 0, windSpeed: windKmh, humidity: cur.main.humidity,
          weatherCode: weatherId, ...info, date: yDate,
        };
      }
    }

    return NextResponse.json({
      location: { city: cityKo, district: stateKo, country: geoPlace?.country ?? '', lat: parseFloat(lat), lon: parseFloat(lon) },
      current: {
        temperature:        round1(cur.main.temp),
        apparentTemperature:round1(cur.main.feels_like),
        humidity:           cur.main.humidity,
        windSpeed:          windKmh,
        windDirection:      cur.wind?.deg ?? 0,
        precipitation:      precip,
        pressure:           cur.main.pressure,
        visibility:         Math.round((cur.visibility ?? 10000) / 100) / 10, // km
        weatherCode:        weatherId,
        ...info,
        isDay,
        todayMax:           round1(cur.main.temp_max),
        todayMin:           round1(cur.main.temp_min),
        uvIndex:            0, // OWM free tier 미제공
        icon:               cur.weather?.[0]?.icon ?? '01d',
      },
      yesterday: yesterdayResult,
    });

  } catch (err) {
    console.error('날씨 API 오류:', err);
    return NextResponse.json({ error: String(err instanceof Error ? err.message : '날씨 정보를 가져오는데 실패했습니다') }, { status: 500 });
  }
}
