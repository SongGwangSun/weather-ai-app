import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { PLAN_LIMITS } from '@/lib/plans';

function today(): string {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD (UTC)
}

/** GET /api/usage — 오늘 사용량 조회 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const plan  = session.user.plan ?? 'free';
  const limit = PLAN_LIMITS[plan].dailyRecommendations;

  if (!supabase) {
    // Supabase 미설정 → 개발 환경: 무제한 처리
    return NextResponse.json({ used: 0, limit, plan });
  }

  const { data } = await supabase
    .from('daily_usage')
    .select('count')
    .eq('email', session.user.email)
    .eq('date', today())
    .maybeSingle();

  return NextResponse.json({
    used:  data?.count ?? 0,
    limit: limit === Infinity ? null : limit,
    plan,
  });
}
