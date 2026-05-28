import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { supabase } from './supabase';
import { getEffectivePlan } from './plans';
import type { Plan } from './plans';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID     ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },

  callbacks: {
    /** Google 로그인 성공 시 Supabase에 사용자 upsert */
    async signIn({ user }) {
      if (!user.email) return false;
      if (!supabase)   return true; // Supabase 미설정 시 통과

      try {
        const { error } = await supabase.from('users').upsert(
          { email: user.email, name: user.name ?? null, image: user.image ?? null },
          { onConflict: 'email', ignoreDuplicates: false }
        );
        if (error) console.error('[auth] upsert error:', error.message);
      } catch (e) {
        // Supabase 연결 실패해도 로그인은 허용
        console.error('[auth] signIn supabase exception:', e);
      }
      return true;
    },

    /** JWT에 이메일 저장 */
    async jwt({ token, user }) {
      if (user?.email) token.email = user.email;
      return token;
    },

    /** session 객체에 plan 정보 주입 */
    async session({ session, token }) {
      // token.email 로 이메일 보장
      if (token?.email) {
        session.user = session.user ?? {};
        (session.user as { email: string }).email = token.email as string;
      }

      if (!session.user?.email || !supabase) {
        // plan 기본값 보장
        (session.user as { plan: Plan }).plan = 'free';
        return session;
      }

      try {
        const { data } = await supabase
          .from('users')
          .select('plan, plan_expires_at')
          .eq('email', session.user.email)
          .maybeSingle(); // .single() 대신 → 0행이어도 에러 안 남

        (session.user as { plan: Plan }).plan = getEffectivePlan(
          (data?.plan ?? 'free') as Plan,
          data?.plan_expires_at ?? null
        );
      } catch (e) {
        // Supabase 오류 시 세션 자체는 유지하고 free 처리
        console.error('[auth] session supabase exception:', e);
        (session.user as { plan: Plan }).plan = 'free';
      }

      return session;
    },
  },
};
