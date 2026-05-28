import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
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
    async jwt({ token, user }) {
      if (user?.email) token.email = user.email;
      return token;
    },

    async session({ session, token }) {
      if (token?.email) {
        (session.user as { email: string }).email = token.email as string;
      }
      // Supabase 조회 없이 기본 free 플랜
      (session.user as { plan: Plan }).plan = 'free';
      return session;
    },
  },
};
