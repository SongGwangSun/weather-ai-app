import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

// NextAuth v4는 Pages Router에서 가장 안정적으로 동작합니다.
// App Router의 app/api/auth/[...nextauth]/route.ts 대신 이 파일을 사용합니다.
export default NextAuth(authOptions);
