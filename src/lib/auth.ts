import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'bff-plus-secret-change-in-production',
  trustHost: true,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const db = getDb();
        const user = db
          .prepare('SELECT * FROM users WHERE email = ?')
          .get(credentials.email as string) as any;

        if (!user) return null;

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password_hash
        );

        if (!passwordMatch) return null;

        const profile = db
          .prepare('SELECT * FROM user_profiles WHERE user_id = ?')
          .get(user.id) as any;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          memberLevel: profile?.member_level || 'new_member',
          faithPoints: profile?.faith_points || 0,
          language: profile?.language || 'en',
          onboardingCompleted: profile?.onboarding_completed === 1,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.memberLevel = (user as any).memberLevel;
        token.faithPoints = (user as any).faithPoints;
        token.language = (user as any).language;
        token.onboardingCompleted = (user as any).onboardingCompleted;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
        (session.user as any).memberLevel = token.memberLevel as string;
        (session.user as any).faithPoints = token.faithPoints as number;
        (session.user as any).language = token.language as string;
        (session.user as any).onboardingCompleted = token.onboardingCompleted as boolean;
      }
      return session;
    },
  },
});
