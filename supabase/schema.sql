-- ================================================================
-- 날씨코디 회원제 스키마
-- Supabase SQL Editor에서 실행하세요
-- ================================================================

-- 사용자 테이블
CREATE TABLE IF NOT EXISTS public.users (
  email           TEXT PRIMARY KEY,
  name            TEXT,
  image           TEXT,
  plan            TEXT NOT NULL DEFAULT 'free'
                      CHECK (plan IN ('free', 'paid')),
  plan_expires_at TIMESTAMPTZ,         -- 유료 만료일 (null이면 영구 또는 해당없음)
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 일일 사용량 테이블
CREATE TABLE IF NOT EXISTS public.daily_usage (
  email  TEXT  NOT NULL REFERENCES public.users(email) ON DELETE CASCADE,
  date   DATE  NOT NULL,               -- UTC 기준 YYYY-MM-DD
  count  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (email, date)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_daily_usage_email_date
  ON public.daily_usage (email, date);

-- ================================================================
-- Row Level Security (RLS) — 서버 사이드 Service Role Key만 사용
-- ================================================================
ALTER TABLE public.users       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_usage ENABLE ROW LEVEL SECURITY;

-- Service Role Key는 RLS를 우회하므로 추가 정책 불필요
-- (Next.js API Routes에서 Service Role Key로만 접근)

-- ================================================================
-- 수동 플랜 업그레이드 (Supabase 대시보드에서 실행)
-- ================================================================
-- 특정 사용자를 PRO로 1개월 업그레이드:
-- UPDATE public.users
--   SET plan = 'paid', plan_expires_at = NOW() + INTERVAL '1 month'
--   WHERE email = 'user@example.com';

-- 연간 구독:
-- UPDATE public.users
--   SET plan = 'paid', plan_expires_at = NOW() + INTERVAL '1 year'
--   WHERE email = 'user@example.com';

-- 무료로 다운그레이드:
-- UPDATE public.users
--   SET plan = 'free', plan_expires_at = NULL
--   WHERE email = 'user@example.com';
