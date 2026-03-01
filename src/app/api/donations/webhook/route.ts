import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { awardPoints } from '@/lib/points';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    // Verify with Stripe if secret is configured
    if (webhookSecret && signature) {
      const stripe = (await import('stripe')).default;
      const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY || '', {
        apiVersion: '2025-01-27.acacia' as any,
      });

      let event: any;
      try {
        event = stripeClient.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (err: any) {
        console.error('[Stripe Webhook] Signature verification failed:', err.message);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
      }

      return await handleStripeEvent(event);
    }

    // Fallback: accept unsigned events in dev (no webhook secret configured)
    const event = JSON.parse(body);
    return await handleStripeEvent(event);
  } catch (err) {
    console.error('[Stripe Webhook] Error:', err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleStripeEvent(event: any) {
  const db = getDb();

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const pi = event.data.object;
      const donation = db.prepare(
        "SELECT * FROM donations WHERE payment_intent_id = ? AND status != 'completed'"
      ).get(pi.id) as any;

      if (donation) {
        db.prepare("UPDATE donations SET status = 'completed', receipt_sent = 1 WHERE id = ?")
          .run(donation.id);

        // Award faith points
        await awardPoints(donation.user_id, 'first_message', { donation_id: donation.id });

        // Add to donor wall if not anonymous
        if (!donation.is_anonymous && donation.message) {
          const user = db.prepare('SELECT name FROM users WHERE id = ?').get(donation.user_id) as any;
          const existing = db.prepare('SELECT id FROM donor_wall WHERE donation_id = ?').get(donation.id);
          if (!existing) {
            db.prepare(`
              INSERT INTO donor_wall (user_id, donation_id, display_name, amount, message, approved)
              VALUES (?, ?, ?, ?, ?, 1)
            `).run(donation.user_id, donation.id, user?.name || 'Anonymous', donation.amount, donation.message);
          }
        }
      }
      break;
    }

    case 'payment_intent.payment_failed': {
      const pi = event.data.object;
      db.prepare("UPDATE donations SET status = 'failed' WHERE payment_intent_id = ?").run(pi.id);
      break;
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      // Handle recurring donation subscriptions
      const sub = event.data.object;
      console.log('[Stripe] Subscription event:', event.type, sub.id);
      break;
    }

    default:
      console.log('[Stripe Webhook] Unhandled event type:', event.type);
  }

  return NextResponse.json({ received: true });
}
