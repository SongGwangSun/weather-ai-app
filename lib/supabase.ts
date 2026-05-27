import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? '';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

/**
 * Supabase 서버 전용 클라이언트 (Service Role Key 사용)
 * API Routes / Server Components 에서만 import 하세요.
 * 클라이언트 컴포넌트에서 절대 import 금지.
 *
 * NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 없으면
 * null을 반환 → 호출부에서 null 체크 후 graceful 처리
 */
export const supabase = url && key
  ? createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

export type Database = {
  users: {
    email: string;
    name: string | null;
    image: string | null;
    plan: 'free' | 'paid';
    plan_expires_at: string | null;
    created_at: string;
  };
  daily_usage: {
    email: string;
    date: string;   // YYYY-MM-DD
    count: number;
  };
};
