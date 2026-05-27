import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// 나이대 텍스트
function ageGroup(age: number | null): string {
  if (!age) return '';
  if (age < 20) return `10대(${age}세)`;
  if (age < 30) return `20대(${age}세)`;
  if (age < 40) return `30대(${age}세)`;
  if (age < 50) return `40대(${age}세)`;
  if (age < 60) return `50대(${age}세)`;
  return `60대 이상(${age}세)`;
}
function genderText(gender: string | null): string {
  if (gender === 'male')   return '남성';
  if (gender === 'female') return '여성';
  if (gender === 'other')  return '중성적 스타일 선호';
  return '';
}

const JSON_SCHEMA = `{
  "summary": "한 줄 날씨 코멘트 (이모지 포함, 예: ☀️ 화창한 봄날씨!)",
  "top": "상의 종류만 (색상 제외, 예: 반소매 티셔츠)",
  "topColors": ["추천 색상1", "추천 색상2"],
  "bottom": "하의 종류만 (색상 제외)",
  "bottomColors": ["추천 색상1", "추천 색상2"],
  "outer": "겉옷 종류만 (불필요하면 '겉옷 불필요')",
  "outerColors": ["추천 색상1"],
  "shoes": "신발 종류만 (색상 제외)",
  "shoeColors": ["추천 색상1", "추천 색상2"],
  "colorStory": "전체 코디 컬러 조합 한 줄 설명",
  "accessories": ["액세서리1", "액세서리2"],
  "tips": ["외출 팁1", "외출 팁2"],
  "warning": "주의사항 또는 null
}`;

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!process.env.OPENAI_API_KEY) {
    return ruleBasedRecommendation(body);
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const { current, location, age, gender } = body;
    const personInfo = [genderText(gender), ageGroup(age)].filter(Boolean).join(' ');

    const systemPrompt = `당신은 한국의 패션 스타일리스트입니다. 날씨와 착용자 정보를 받아 외출 옷차림을 추천합니다.
- 나이·성별에 맞는 현실적인 한국 패션 트렌드를 반영하세요
- 색상은 코디 전체의 조화를 고려해 2가지씩 추천하세요 (한국어 색상명 사용)
- 반드시 JSON 형식으로만 응답하세요`;

    const userPrompt = `착용자: ${personInfo || '정보 없음'}
위치: ${location.city} ${location.district}
기온: ${current.temperature}°C (체감 ${current.apparentTemperature}°C)
날씨: ${current.label} ${current.emoji}
습도: ${current.humidity}% | 풍속: ${current.windSpeed}km/h | 강수: ${current.precipitation}mm
UV: ${current.uvIndex} | 오늘 최고/최저: ${current.todayMax}°C / ${current.todayMin}°C

다음 JSON 형식으로 추천해주세요:
${JSON_SCHEMA}`;

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 1200,
    });

    const text = response.choices[0].message.content ?? '{}';
    const recommendation = JSON.parse(text);
    return NextResponse.json({ recommendation, source: 'ai' });
  } catch (err) {
    console.error('OpenAI 추천 오류:', err);
    return ruleBasedRecommendation(body);
  }
}

// ─── 규칙 기반 폴백 ────────────────────────────────────────────────────────

// 나이·성별 기반 색상 팔레트
function getColorPalette(gender: string | null, age: number | null) {
  const isFemale = gender === 'female';
  const isYoung  = !age || age < 30;
  const isMid    = age !== null && age >= 30 && age < 50;

  if (isFemale) {
    if (isYoung) return { neutral: ['흰색','크림색'], accent: ['라벤더','민트','코랄','베이비핑크'], bottom: ['블루데님','베이지','연그레이'], shoes: ['흰색','베이지','누드'] };
    if (isMid)   return { neutral: ['베이지','아이보리'], accent: ['코랄','테라코타','와인'], bottom: ['네이비','차콜','카키'], shoes: ['베이지','카멜','블랙'] };
    return          { neutral: ['아이보리','연베이지'], accent: ['버건디','딥로즈','올리브'], bottom: ['네이비','다크그레이'], shoes: ['카멜','브라운','블랙'] };
  } else {
    if (isYoung) return { neutral: ['흰색','연그레이'], accent: ['카키','올리브','버건디'], bottom: ['블루데님','블랙','카고베이지'], shoes: ['흰색','그레이','블랙'] };
    if (isMid)   return { neutral: ['화이트','그레이'], accent: ['네이비','카키','버건디'], bottom: ['슬레이트그레이','네이비','차콜'], shoes: ['화이트','다크그레이','블랙'] };
    return          { neutral: ['베이지','연그레이'], accent: ['네이비','차분한 블루'], bottom: ['다크네이비','차콜그레이'], shoes: ['브라운','블랙','네이비'] };
  }
}

function ruleBasedRecommendation(body: Record<string, unknown>) {
  try {
    const current = body.current as Record<string, unknown>;
    const age    = typeof body.age    === 'number' ? body.age    : null;
    const gender = typeof body.gender === 'string' ? body.gender : null;

    const temp = (current.apparentTemperature ?? current.temperature) as number;
    const code = (current.weatherCode ?? 0) as number;
    const isRaining = [51,53,55,61,63,65,80,81,82].includes(code);
    const isSnowing = [71,73,75,85,86].includes(code);
    const isHot     = temp >= 28;
    const isWarm    = temp >= 20;
    const isCool    = temp >= 10;
    const isCold    = temp >= 0;

    const palette = getColorPalette(gender, age);

    let top = '', topColors: string[] = [];
    let bottom = '', bottomColors: string[] = [];
    let outer = '', outerColors: string[] = [];
    let shoes = '', shoeColors: string[] = [];
    const accessories: string[] = [];
    const tips: string[] = [];

    if (isHot) {
      top = '반소매 티셔츠 또는 민소매';       topColors = [palette.neutral[0], palette.accent[0]];
      bottom = '반바지 또는 얇은 면 바지';      bottomColors = [palette.bottom[0], palette.bottom[1]];
      outer = '겉옷 불필요';                     outerColors = [];
      shoes = '샌들 또는 스니커즈';             shoeColors = [palette.shoes[0], palette.shoes[1]];
      accessories.push('선글라스', '자외선 차단제');
      tips.push('수분을 자주 섭취하세요', '자외선 차단제를 꼭 바르세요');
    } else if (isWarm) {
      top = '반소매 티셔츠 또는 얇은 긴소매';  topColors = [palette.neutral[0], palette.accent[0]];
      bottom = '면 바지 또는 청바지';           bottomColors = [palette.bottom[0], palette.bottom[1]];
      outer = '얇은 가디건';                    outerColors = [palette.neutral[1] ?? palette.neutral[0], palette.accent[1]];
      shoes = '스니커즈 또는 로퍼';             shoeColors = [palette.shoes[0], palette.shoes[1]];
      accessories.push('선글라스');
      tips.push('일교차에 대비해 얇은 겉옷을 챙기세요');
    } else if (isCool) {
      top = '긴소매 셔츠 또는 가벼운 니트';    topColors = [palette.neutral[0], palette.accent[1] ?? palette.accent[0]];
      bottom = '청바지 또는 면 바지';           bottomColors = [palette.bottom[0], palette.bottom[1]];
      outer = '가벼운 자켓 또는 후드집업';      outerColors = [palette.accent[1] ?? palette.neutral[0], palette.accent[0]];
      shoes = '스니커즈 또는 운동화';           shoeColors = [palette.shoes[0], palette.shoes[2] ?? palette.shoes[1]];
      tips.push('바람이 차가울 수 있으니 바람막이를 고려하세요');
    } else if (isCold) {
      top = '두꺼운 니트 또는 맨투맨';          topColors = [palette.accent[1] ?? palette.accent[0], palette.neutral[0]];
      bottom = '두꺼운 청바지 또는 기모 바지'; bottomColors = [palette.bottom[1], palette.bottom[0]];
      outer = '코트 또는 패딩';                 outerColors = [palette.neutral[0], palette.accent[2] ?? palette.accent[1]];
      shoes = '부츠 또는 운동화';               shoeColors = [palette.shoes[1] ?? palette.shoes[0], palette.shoes[2] ?? palette.shoes[1]];
      accessories.push('목도리');
      tips.push('내복을 입으면 체온 유지에 도움됩니다');
    } else {
      top = '두꺼운 내복 + 니트';               topColors = [palette.accent[0], palette.neutral[0]];
      bottom = '기모 바지 또는 두꺼운 청바지'; bottomColors = [palette.bottom[1], palette.bottom[0]];
      outer = '두꺼운 패딩 또는 코트';          outerColors = [palette.neutral[0], palette.accent[1] ?? palette.accent[0]];
      shoes = '따뜻한 부츠';                    shoeColors = [palette.shoes[1], palette.shoes[2] ?? palette.shoes[1]];
      accessories.push('목도리', '장갑', '귀마개');
      tips.push('레이어드 착장으로 체온을 유지하세요');
    }

    if (isRaining) {
      accessories.push('우산');
      shoes = '방수 운동화 또는 장화';
      shoeColors = ['블랙', '네이비'];
      tips.push('방수 소재 신발을 신으세요');
    }
    if (isSnowing) {
      accessories.push('방수 방한 모자');
      shoes = '방수 부츠';
      shoeColors = ['블랙', '브라운'];
      tips.push('미끄러운 노면에 주의하세요');
    }

    const summary = isRaining ? `🌧️ 비 오는 날! 우산 필수예요`
      : isSnowing ? `❄️ 눈 오는 날! 방한 준비 철저히`
      : isHot     ? `🔥 더운 날씨! 시원하게 입으세요`
      : isWarm    ? `🌤️ 쾌적한 날씨! 가볍게 입고 나가세요`
      : isCool    ? `🧥 쌀쌀한 날씨! 겉옷을 챙기세요`
      :             `🧤 추운 날씨! 따뜻하게 입으세요`;

    const colorStory = `${topColors[0]}과 ${bottomColors[0]} 조합의 ${gender === 'female' ? '세련된' : '깔끔한'} 코디`;

    return NextResponse.json({
      recommendation: { summary, top, topColors, bottom, bottomColors, outer, outerColors, shoes, shoeColors, colorStory, accessories, tips, warning: null },
      source: 'rule',
    });
  } catch {
    return NextResponse.json({ error: '추천을 가져오는데 실패했습니다' }, { status: 500 });
  }
}
