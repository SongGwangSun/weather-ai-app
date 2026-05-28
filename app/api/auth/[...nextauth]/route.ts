import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

// NextAuth v4는 반드시 Node.js 런타임 필요 (Edge 런타임 미지원)
export const runtime = 'nodejs';

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
