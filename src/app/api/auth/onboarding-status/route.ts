import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';

/** Lightweight endpoint used by middleware to check live onboarding status */
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ completed: false });
  const db = getDb();
  const profile = db.prepare('SELECT onboarding_completed FROM user_profiles WHERE user_id = ?')
    .get((session.user as any).id) as any;
  return NextResponse.json({ completed: profile?.onboarding_completed === 1 });
}
