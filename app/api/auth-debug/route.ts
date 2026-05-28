import { NextResponse } from 'next/server';

// 환경변수 설정 여부 확인 (값은 노출하지 않음)
export async function GET() {
  const googleId = process.env.GOOGLE_CLIENT_ID ?? '';
  const googleSecret = process.env.GOOGLE_CLIENT_SECRET ?? '';
  const nextAuthSecret = process.env.NEXTAUTH_SECRET ?? '';

  return NextResponse.json({
    GOOGLE_CLIENT_ID:       googleId     ? `✅ ${googleId.slice(0, 12)}...` : '❌ 없음',
    GOOGLE_CLIENT_SECRET:   googleSecret ? `✅ ${googleSecret.slice(0, 6)}...` : '❌ 없음',
    NEXTAUTH_SECRET:        nextAuthSecret ? `✅ (${nextAuthSecret.length}자)` : '❌ 없음',
    NEXTAUTH_URL:           process.env.NEXTAUTH_URL           || '⚠️ 없음 (자동감지)',
    VERCEL_URL:             process.env.VERCEL_URL             || '(로컬환경)',
    NEXT_PUBLIC_SUPABASE_URL:  process.env.NEXT_PUBLIC_SUPABASE_URL   ? '✅' : '❌ 없음',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY  ? '✅' : '❌ 없음',
    NODE_ENV: process.env.NODE_ENV,
  });
}
