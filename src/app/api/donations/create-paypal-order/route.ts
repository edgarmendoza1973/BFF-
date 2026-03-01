/**
 * POST /api/donations/create-paypal-order
 * Creates a PayPal order and returns the order ID.
 * Works in sandbox mode (PAYPAL_MODE=sandbox) or live.
 * Falls back to a mock order ID when no PayPal credentials are configured.
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';

async function getPayPalAccessToken(clientId: string, clientSecret: string, mode: string): Promise<string> {
  const baseUrl = mode === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

  const res = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal auth failed: ${text}`);
  }
  const data = await res.json() as any;
  return data.access_token;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as any).id as string;
    const {
      amount,
      currency = 'USD',
      frequency = 'one_time',
      fund_designation = 'general',
      is_anonymous = false,
      message = '',
    } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const clientId     = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const mode         = process.env.PAYPAL_MODE || 'sandbox';
    const db           = getDb();

    if (clientId && clientSecret) {
      // ── Real PayPal ──────────────────────────────────────────────────────
      const baseUrl = mode === 'live'
        ? 'https://api-m.paypal.com'
        : 'https://api-m.sandbox.paypal.com';

      const accessToken = await getPayPalAccessToken(clientId, clientSecret, mode);

      const orderRes = await fetch(`${baseUrl}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [{
            amount: {
              currency_code: currency.toUpperCase(),
              value: parseFloat(amount).toFixed(2),
            },
            description: `BFF+ Donation — ${fund_designation}`,
            custom_id: userId,
          }],
          application_context: {
            return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/giving?paypal=success`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/giving?paypal=cancel`,
            brand_name: 'BFF+ Church',
            user_action: 'PAY_NOW',
          },
        }),
      });

      if (!orderRes.ok) {
        const err = await orderRes.text();
        throw new Error(`PayPal order creation failed: ${err}`);
      }
      const order = await orderRes.json() as any;

      // Record pending donation
      const result = db.prepare(`
        INSERT INTO donations (user_id, amount, currency, frequency, payment_method,
          payment_intent_id, status, is_anonymous, fund_designation, message)
        VALUES (?, ?, ?, ?, 'paypal', ?, 'pending', ?, ?, ?)
      `).run(userId, amount, currency, frequency, order.id, is_anonymous ? 1 : 0, fund_designation, message);

      return NextResponse.json({
        success: true,
        orderId: order.id,
        donationId: result.lastInsertRowid,
        approvalUrl: order.links?.find((l: any) => l.rel === 'approve')?.href,
        provider: 'paypal',
      });
    }

    // ── Demo / Sandbox fallback ──────────────────────────────────────────
    const mockOrderId = `PAYPAL-DEMO-${Date.now()}`;
    const result = db.prepare(`
      INSERT INTO donations (user_id, amount, currency, frequency, payment_method,
        payment_intent_id, status, is_anonymous, fund_designation, message)
      VALUES (?, ?, ?, ?, 'paypal', ?, 'pending', ?, ?, ?)
    `).run(userId, amount, currency, frequency, mockOrderId, is_anonymous ? 1 : 0, fund_designation, message);

    return NextResponse.json({
      success: true,
      orderId: mockOrderId,
      donationId: result.lastInsertRowid,
      approvalUrl: null,   // null signals demo mode to client
      provider: 'paypal_demo',
    });
  } catch (err: any) {
    console.error('[create-paypal-order]', err);
    return NextResponse.json({ error: err.message || 'Failed to create PayPal order' }, { status: 500 });
  }
}
