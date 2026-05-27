import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // API 키 없을 때 규칙 기반 추천으로 폴백
    return ruleBasedRecommendation(request);
  }

  try {
    const body = await request.json();
    const { current, location } = body;

    const prompt = `당신은 패션과 날씨 전문가입니다. 다음 날씨 정보를 바탕으로 외출 시 옷차림을 추천해주세요.

📍 위치: ${location.city} ${location.district}
🌡️ 현재 기온: ${current.temperature}°C (체감 ${current.apparentTemperature}°C)
🌤️ 날씨: ${current.label} ${current.emoji}
💧 습도: ${current.humidity}%
💨 풍속: ${current.windSpeed} km/h
🌧️ 강수량: ${current.precipitation}mm
☀️ UV 지수: ${current.uvIndex}
📈 오늘 최고/최저: ${current.todayMax}°C / ${current.todayMin}°C

다음 형식으로 한국어로 추천해주세요. JSON 형식으로만 응답하세요:

{
  "summary": "한 줄 오늘의 날씨 코멘트 (이모지 포함, 예: ☀️ 화창한 봄날씨! 가볍게 입고 나가세요)",
  "top": "상의 추천 (구체적인 종류와 색상 예: 흰색 반소매 티셔츠 또는 얇은 긴소매)",
  "bottom": "하의 추천 (구체적으로)",
  "outer": "겉옷 추천 (필요없으면 '겉옷 불필요')",
  "shoes": "신발 추천",
  "accessories": ["액세서리 목록 (우산, 선글라스, 마스크 등) 배열"],
  "tips": ["실용적인 외출 팁 2~3가지 배열"],
  "warning": "주의사항 (없으면 null)"
}`;

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';

    // JSON 파싱
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('JSON 파싱 실패');

    const recommendation = JSON.parse(jsonMatch[0]);

    return NextResponse.json({ recommendation, source: 'ai' });
  } catch (err) {
    console.error('AI 추천 오류:', err);
    return ruleBasedRecommendation(request);
  }
}

async function ruleBasedRecommendation(request: NextRequest) {
  try {
    const body = await request.json();
    const { current } = body;
    const temp = current.apparentTemperature ?? current.temperature;
    const code = current.weatherCode ?? 0;
    const isRaining = [51,53,55,61,63,65,80,81,82].includes(code);
    const isSnowing = [71,73,75,85,86].includes(code);
    const isHot = temp >= 28;
    const isWarm = temp >= 20;
    const isCool = temp >= 10;
    const isCold = temp >= 0;

    let top = '', bottom = '', outer = '', shoes = '';
    const accessories: string[] = [];
    const tips: string[] = [];

    if (isHot) {
      top = '얇은 반소매 티셔츠 또는 민소매';
      bottom = '반바지 또는 얇은 면 바지';
      outer = '겉옷 불필요';
      shoes = '샌들 또는 스니커즈';
      accessories.push('선글라스', '자외선 차단제');
      tips.push('수분을 자주 섭취하세요', '외출 시 자외선 차단제를 꼭 바르세요');
    } else if (isWarm) {
      top = '반소매 티셔츠 또는 얇은 긴소매';
      bottom = '면 바지 또는 청바지';
      outer = '얇은 가디건 (아침/저녁용)';
      shoes = '스니커즈 또는 로퍼';
      accessories.push('선글라스');
      tips.push('일교차가 있을 수 있으니 얇은 겉옷을 챙기세요');
    } else if (isCool) {
      top = '긴소매 셔츠 또는 가벼운 니트';
      bottom = '청바지 또는 면 바지';
      outer = '가벼운 자켓 또는 후드집업';
      shoes = '스니커즈 또는 운동화';
      tips.push('바람이 차가울 수 있으니 바람막이를 고려하세요');
    } else if (isCold) {
      top = '두꺼운 니트 또는 맨투맨';
      bottom = '두꺼운 청바지 또는 기모 바지';
      outer = '코트 또는 패딩 조끼';
      shoes = '부츠 또는 운동화';
      accessories.push('목도리');
      tips.push('내복을 입으면 체온 유지에 도움됩니다');
    } else {
      top = '두꺼운 내복 + 니트';
      bottom = '기모 바지 또는 두꺼운 청바지';
      outer = '두꺼운 패딩 또는 코트';
      shoes = '따뜻한 부츠';
      accessories.push('목도리', '장갑', '귀마개');
      tips.push('외출 시 충분히 보온하세요', '체온 유지를 위해 레이어드 착장을 추천합니다');
    }

    if (isRaining) {
      accessories.push('우산');
      shoes = '방수 운동화 또는 장화';
      tips.push('우산과 방수 신발을 챙기세요');
    }
    if (isSnowing) {
      accessories.push('우산 또는 방수 방한 모자');
      shoes = '방수 부츠';
      tips.push('미끄러운 노면에 주의하세요', '방수 소재 의류를 추천합니다');
    }

    const weatherLabel = current.label ?? '알 수 없음';
    const summary = isRaining
      ? `🌧️ 비 오는 날! 우산 필수예요`
      : isSnowing
      ? `❄️ 눈 오는 날! 방한 준비 철저히`
      : isHot
      ? `🔥 더운 날씨! 시원하게 입으세요`
      : isWarm
      ? `🌤️ 쾌적한 날씨! 가볍게 입고 나가세요`
      : isCool
      ? `🧥 쌀쌀한 날씨! 겉옷을 챙기세요`
      : `🧤 추운 날씨! 따뜻하게 입으세요`;

    return NextResponse.json({
      recommendation: { summary, top, bottom, outer, shoes, accessories, tips, warning: null },
      source: 'rule',
    });
  } catch {
    return NextResponse.json({ error: '추천을 가져오는데 실패했습니다' }, { status: 500 });
  }
}
