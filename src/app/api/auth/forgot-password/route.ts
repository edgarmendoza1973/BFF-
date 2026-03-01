import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { randomBytes } from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

    const db = getDb();
    const user = db.prepare('SELECT id, email, name FROM users WHERE email = ?').get(email.toLowerCase().trim()) as any;

    // Always return success to prevent email enumeration
    if (!user) return NextResponse.json({ success: true, message: 'If account exists, reset link was sent' });

    // Generate a reset token (valid 1 hour)
    const token   = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    // Store token in DB (we reuse user_profiles for simplicity — store in a dedicated reset_tokens approach)
    // Since we don't have a reset_tokens table in this demo, just log and return
    // In production: send email via SendGrid/Resend with the reset link
    console.log(`[Password Reset] Token for ${email}: ${token} (expires: ${expires})`);
    console.log(`[Password Reset] Link: ${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}`);

    return NextResponse.json({ success: true, message: 'If account exists, reset link was sent' });
  } catch (error) {
    console.error('[forgot-password]', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
