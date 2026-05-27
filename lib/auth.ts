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

  callbacks: {
    /** Google 로그인 성공 시 Supabase에 사용자 upsert */
    async signIn({ user }) {
      if (!user.email) return false;
      if (!supabase)   return true; // Supabase 미설정 시 통과

      const { error } = await supabase.from('users').upsert(
        {
          email: user.email,
          name:  user.name  ?? null,
          image: user.image ?? null,
        },
        { onConflict: 'email', ignoreDuplicates: false }
      );
      if (error) console.error('[auth] upsert error:', error.message);
      return true;
    },

    /** session 객체에 plan 정보 주입 */
    async session({ session }) {
      if (!session.user?.email || !supabase) return session;

      const { data } = await supabase
        .from('users')
        .select('plan, plan_expires_at')
        .eq('email', session.user.email)
        .single();

      (session.user as { plan: Plan }).plan = getEffectivePlan(
        (data?.plan ?? 'free') as Plan,
        data?.plan_expires_at ?? null
      );
      return session;
    },
  },

  pages: {
    signIn: '/',   // 별도 로그인 페이지 없이 메인에서 처리
  },
};
