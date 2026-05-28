import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? '';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

/**
 * Supabase 서버 전용 클라이언트 (Service Role Key 사용)
 * 초기화 실패 시 null 반환 → 호출부에서 null 체크 후 graceful 처리
 */
function createSupabaseClient() {
  if (!url || !key) return null;
  try {
    return createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  } catch (e) {
    console.error('[supabase] client init error:', e);
    return null;
  }
}

export const supabase = createSupabaseClient();
