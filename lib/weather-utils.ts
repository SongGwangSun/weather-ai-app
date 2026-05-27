// WMO Weather Code 한글 매핑
export const WMO_CODES: Record<number, { label: string; emoji: string }> = {
  0:  { label: '맑음', emoji: '☀️' },
  1:  { label: '대체로 맑음', emoji: '🌤️' },
  2:  { label: '부분적으로 흐림', emoji: '⛅' },
  3:  { label: '흐림', emoji: '☁️' },
  45: { label: '안개', emoji: '🌫️' },
  48: { label: '안개', emoji: '🌫️' },
  51: { label: '가벼운 이슬비', emoji: '🌦️' },
  53: { label: '이슬비', emoji: '🌦️' },
  55: { label: '강한 이슬비', emoji: '🌧️' },
  56: { label: '얼어붙는 이슬비', emoji: '🌧️' },
  57: { label: '강한 얼어붙는 이슬비', emoji: '🌧️' },
  61: { label: '가벼운 비', emoji: '🌧️' },
  63: { label: '비', emoji: '🌧️' },
  65: { label: '강한 비', emoji: '⛈️' },
  66: { label: '얼어붙는 비', emoji: '🌨️' },
  67: { label: '강한 얼어붙는 비', emoji: '🌨️' },
  71: { label: '가벼운 눈', emoji: '🌨️' },
  73: { label: '눈', emoji: '❄️' },
  75: { label: '강한 눈', emoji: '❄️' },
  77: { label: '눈 결정', emoji: '❄️' },
  80: { label: '소나기', emoji: '🌦️' },
  81: { label: '소나기', emoji: '🌧️' },
  82: { label: '강한 소나기', emoji: '⛈️' },
  85: { label: '눈 소나기', emoji: '🌨️' },
  86: { label: '강한 눈 소나기', emoji: '🌨️' },
  95: { label: '뇌우', emoji: '⛈️' },
  96: { label: '뇌우(우박)', emoji: '⛈️' },
  99: { label: '강한 뇌우(우박)', emoji: '⛈️' },
};

export function getWeatherInfo(code: number) {
  return WMO_CODES[code] ?? { label: '알 수 없음', emoji: '🌡️' };
}

// 체감온도 기반 색상 테마
export function getTempColor(temp: number): string {
  if (temp <= 0)  return 'from-blue-900 to-blue-700';
  if (temp <= 5)  return 'from-blue-700 to-blue-500';
  if (temp <= 10) return 'from-blue-500 to-cyan-400';
  if (temp <= 15) return 'from-cyan-400 to-teal-400';
  if (temp <= 20) return 'from-teal-400 to-green-400';
  if (temp <= 25) return 'from-green-400 to-yellow-400';
  if (temp <= 30) return 'from-yellow-400 to-orange-400';
  if (temp <= 35) return 'from-orange-400 to-red-500';
  return 'from-red-500 to-red-700';
}

export function getTempLabel(temp: number): string {
  if (temp <= 0)  return '매우 추움';
  if (temp <= 5)  return '추움';
  if (temp <= 10) return '쌀쌀함';
  if (temp <= 15) return '서늘함';
  if (temp <= 20) return '적당함';
  if (temp <= 25) return '따뜻함';
  if (temp <= 30) return '더움';
  if (temp <= 35) return '매우 더움';
  return '폭염';
}

export function formatWindSpeed(speed: number): string {
  return `${speed.toFixed(1)} km/h`;
}

export function getWindLabel(speed: number): string {
  if (speed < 1)  return '고요';
  if (speed < 6)  return '약풍';
  if (speed < 12) return '남풍';
  if (speed < 20) return '보통';
  if (speed < 29) return '강풍';
  return '폭풍';
}
