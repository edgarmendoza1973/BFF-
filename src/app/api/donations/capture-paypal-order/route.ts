/**
 * POST /api/donations/capture-paypal-order
 * Captures a PayPal order after the user approves it.
 * Called by the front-end after the PayPal popup closes with success.
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { awardPoints } from '@/lib/points';

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
  const data = await res.json() as any;
  return data.access_token;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId                    = (session.user as any).id as string;
    const { orderId, donationId }   = await req.json();

    if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 });

    const db           = getDb();
    const clientId     = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const mode         = process.env.PAYPAL_MODE || 'sandbox';

    if (clientId && clientSecret && !orderId.startsWith('PAYPAL-DEMO-')) {
      // ── Real PayPal capture ──────────────────────────────────────────────
      const baseUrl    = mode === 'live'
        ? 'https://api-m.paypal.com'
        : 'https://api-m.sandbox.paypal.com';
      const accessToken = await getPayPalAccessToken(clientId, clientSecret, mode);

      const captureRes = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!captureRes.ok) {
        const err = await captureRes.text();
        throw new Error(`PayPal capture failed: ${err}`);
      }

      const capture = await captureRes.json() as any;
      const captureStatus = capture.status; // COMPLETED | PAYER_ACTION_REQUIRED | etc.

      if (captureStatus === 'COMPLETED') {
        db.prepare(`
          UPDATE donations SET status = 'completed', receipt_sent = 1
          WHERE payment_intent_id = ? AND user_id = ?
        `).run(orderId, userId);
        if (donationId) await awardPoints(userId, 'first_message', { donation_id: donationId });
      }

      return NextResponse.json({
        success: true,
        status: captureStatus,
        message: captureStatus === 'COMPLETED'
          ? 'Thank you for your generous gift! 🙏'
          : `Payment status: ${captureStatus}`,
      });
    }

    // ── Demo capture ─────────────────────────────────────────────────────
    db.prepare(`
      UPDATE donations SET status = 'completed', receipt_sent = 1
      WHERE payment_intent_id = ? AND user_id = ?
    `).run(orderId, userId);
    if (donationId) await awardPoints(userId, 'first_message', { donation_id: donationId });

    return NextResponse.json({
      success: true,
      status: 'COMPLETED',
      message: 'Thank you for your generous gift! 🙏',
    });
  } catch (err: any) {
    console.error('[capture-paypal-order]', err);
    return NextResponse.json({ error: err.message || 'Failed to capture PayPal order' }, { status: 500 });
  }
}
