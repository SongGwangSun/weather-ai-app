import type { Plan } from '@/lib/plans';

declare module 'next-auth' {
  interface Session {
    user: {
      email: string;
      name?: string | null;
      image?: string | null;
      plan: Plan;
    };
  }
}
