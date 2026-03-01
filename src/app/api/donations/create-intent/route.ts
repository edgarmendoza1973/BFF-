import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = getDb();
    const userId = (session.user as any).id;
    const {
      amount, currency = 'USD', frequency = 'one_time',
      is_anonymous = false, message = '', fund_designation = 'general',
      payment_method = 'stripe',
    } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;

    if (stripeKey && stripeKey.startsWith('sk_')) {
      // ── Real Stripe Integration ───────────────────────────────
      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(stripeKey, { apiVersion: '2025-01-27.acacia' as any });

      // Convert to cents
      const amountCents = Math.round(amount * 100);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountCents,
        currency: currency.toLowerCase(),
        metadata: {
          user_id:          userId,
          fund_designation: fund_designation,
          frequency:        frequency,
          is_anonymous:     String(is_anonymous),
          message:          message.slice(0, 500),
        },
        automatic_payment_methods: { enabled: true },
      });

      // Record pending donation
      const result = db.prepare(`
        INSERT INTO donations (user_id, amount, currency, frequency, payment_method,
          payment_intent_id, status, is_anonymous, fund_designation, message)
        VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)
      `).run(userId, amount, currency, frequency, payment_method,
        paymentIntent.id, is_anonymous ? 1 : 0, fund_designation, message);

      return NextResponse.json({
        success:           true,
        payment_intent_id: paymentIntent.id,
        donation_id:       result.lastInsertRowid,
        client_secret:     paymentIntent.client_secret,
        amount,
        currency,
        use_stripe:        true,
      });
    }

    // ── Demo / Sandbox mode ───────────────────────────────────────
    const mockIntentId = `pi_demo_${Date.now()}`;
    const result = db.prepare(`
      INSERT INTO donations (user_id, amount, currency, frequency, payment_method,
        payment_intent_id, status, is_anonymous, fund_designation, message)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)
    `).run(userId, amount, currency, frequency, payment_method,
      mockIntentId, is_anonymous ? 1 : 0, fund_designation, message);

    return NextResponse.json({
      success:           true,
      payment_intent_id: mockIntentId,
      donation_id:       result.lastInsertRowid,
      client_secret:     null,   // signals demo mode to client
      amount,
      currency,
      use_stripe:        false,
    });
  } catch (error: any) {
    console.error('[create-intent]', error);
    return NextResponse.json({ error: error.message || 'Failed to create payment intent' }, { status: 500 });
  }
}
