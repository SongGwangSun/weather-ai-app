# 🌤️ 날씨 & AI 옷차림 추천 앱

현재 날씨와 어제 날씨를 한눈에 확인하고, GPT-4o-mini가 나이·성별 맞춤 옷차림과 색상까지 추천해드립니다.  
PWA로 제작되어 홈 화면에 추가하면 앱처럼 사용할 수 있습니다.

## 주요 기능

| | |
|---|---|
| 📍 자동 위치 감지 | 브라우저 GPS (거부 시 서울 기본값) |
| 🌡️ 현재 날씨 | 기온·체감온도·습도·풍속·강수량·UV 지수 |
| 📅 어제 날씨 | 최고/최저 기온·강수량·풍속·습도 |
| 📊 어제 대비 비교 | 기온 변화 한눈에 확인 |
| 👗 AI 옷차림 추천 | GPT-4o-mini — 상의·하의·아우터·신발·색상 |
| 🎨 맞춤 색상 추천 | 나이·성별별 어울리는 색상 팔레트 |
| 🕐 프로필 이력 | 최근 입력 5개 저장, 원클릭 재선택 |
| 📲 PWA | 홈 화면 추가·오프라인 아이콘 지원 |

## 빠른 시작

```bash
# 1. 의존성 설치
npm install

# 2. 환경 변수 설정
cp .env.example .env.local
# .env.local 을 열어 API 키 입력

# 3. 개발 서버 실행
npm run dev
# → http://localhost:3000
```

## 환경 변수

`.env.local` 파일에 아래 두 키를 입력하세요:

```env
# OpenAI API 키 (필수) — https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-...

# OpenWeatherMap API 키 (필수) — https://home.openweathermap.org/api_keys
OPENWEATHER_API_KEY=your_key_here
```

> OpenWeatherMap 무료 플랜으로 충분합니다. 어제 날씨는 Open-Meteo (무료)로 자동 폴백합니다.

## Vercel 배포

1. [Vercel](https://vercel.com)에 GitHub 리포지토리 연결
2. **Settings → Environment Variables**에서 위 두 키 추가
3. 배포 완료 🚀

또는 CLI로 배포:
```bash
npx vercel --prod
```

## 아이콘 재생성 (선택)

`public/icons/icon.svg`를 수정한 뒤 PNG 재생성:
```bash
node scripts/gen-icons.mjs
```

## 기술 스택

| 분류 | 라이브러리/서비스 |
|---|---|
| 프레임워크 | Next.js 16 (App Router, TypeScript) |
| 스타일 | Tailwind CSS v4 |
| 현재 날씨 | OpenWeatherMap API v2.5 |
| 어제 날씨 | OpenWeatherMap Timemachine → Open-Meteo 폴백 |
| AI 추천 | OpenAI GPT-4o-mini |
| PWA | Web App Manifest + Apple Touch Icon |
