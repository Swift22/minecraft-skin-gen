import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { db } from '@/lib/db'
import { subscriptions, users, webhookEvents } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import type Stripe from 'stripe'
import { env } from '@/lib/env'
import { subscriptionActivationUpdate } from '@/lib/stripe-webhook'

/**
 * POST /api/webhooks/stripe — receive and idempotently process Stripe webhook events.
 * Returns 5xx on processing errors so Stripe will retry.
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'missing_signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return NextResponse.json({ error: 'invalid_signature' }, { status: 400 })
  }

  // Atomic idempotency claim: insert first; if conflict, the event was already processed.
  const claim = await db
    .insert(webhookEvents)
    .values({ stripeEventId: event.id, type: event.type })
    .onConflictDoNothing({ target: webhookEvents.stripeEventId })
    .returning({ id: webhookEvents.id })

  if (claim.length === 0) {
    return NextResponse.json({ received: true, duplicate: true })
  }

  try {
    await handleEvent(event)
  } catch (error) {
    console.error(`Error processing Stripe webhook ${event.id}:`, error)
    // Release the claim so Stripe's retry can re-process.
    await db.delete(webhookEvents).where(eq(webhookEvents.stripeEventId, event.id))
    return NextResponse.json({ error: 'processing_failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

async function handleEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const customerId = sub.customer as string

      const [userRow] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.stripeCustomerId, customerId))
        .limit(1)

      if (!userRow) {
        throw new Error(`No user found for Stripe customer ${customerId}`)
      }

      const periodEnd = new Date((sub.current_period_end ?? 0) * 1000)

      await db
        .insert(subscriptions)
        .values({
          userId: userRow.id,
          stripeSubscriptionId: sub.id,
          stripePriceId: sub.items.data[0]?.price.id ?? '',
          stripeCurrentPeriodEnd: periodEnd,
          status: sub.status,
        })
        .onConflictDoUpdate({
          target: subscriptions.stripeSubscriptionId,
          set: {
            stripePriceId: sub.items.data[0]?.price.id ?? '',
            stripeCurrentPeriodEnd: periodEnd,
            status: sub.status,
            updatedAt: new Date(),
          },
        })

      const update = subscriptionActivationUpdate(sub.status, new Date())
      if (update) {
        await db.update(users).set(update).where(eq(users.id, userRow.id))
      }
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await db
        .update(subscriptions)
        .set({ status: 'canceled', updatedAt: new Date() })
        .where(eq(subscriptions.stripeSubscriptionId, sub.id))
      // Do not immediately revoke credits — hasActiveSubscription checks stripe_current_period_end
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string | null
      if (!customerId) break

      // Mark subscription as past_due so hasActiveSubscription returns false.
      const [userRow] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.stripeCustomerId, customerId))
        .limit(1)

      if (userRow) {
        await db
          .update(subscriptions)
          .set({ status: 'past_due', updatedAt: new Date() })
          .where(eq(subscriptions.userId, userRow.id))
      }

      console.warn(`Payment failed for invoice ${invoice.id} (customer ${customerId})`)
      break
    }

    default:
      // Unknown event types are ignored
      break
  }
}
