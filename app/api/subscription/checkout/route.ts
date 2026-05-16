import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { hasActiveSubscription } from '@/lib/credits'
import { env } from '@/lib/env'

/** POST /api/subscription/checkout — create a Stripe Checkout session for Pro subscription */
export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'unauthorized', message: 'Not authenticated.' }, { status: 401 })
  }

  // Reject if user already has an active subscription
  const isAlreadySubscribed = await hasActiveSubscription(user.id)
  if (isAlreadySubscribed) {
    return NextResponse.json(
      { error: 'already_subscribed', message: 'You already have an active subscription.' },
      { status: 400 }
    )
  }

  const [userRow] = await db
    .select({ stripeCustomerId: users.stripeCustomerId, email: users.email })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1)

  // Retrieve or create Stripe customer
  let customerId = userRow?.stripeCustomerId
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: userRow?.email ?? user.email ?? undefined,
      metadata: { supabaseUserId: user.id },
    })
    customerId = customer.id
    await db.update(users).set({ stripeCustomerId: customerId }).where(eq(users.id, user.id))
  }

  const appUrl = env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  if (!env.STRIPE_PRO_PRICE_ID) {
    return NextResponse.json(
      { error: 'misconfigured', message: 'STRIPE_PRO_PRICE_ID is not set.' },
      { status: 500 }
    )
  }
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: env.STRIPE_PRO_PRICE_ID, quantity: 1 }],
    success_url: `${appUrl}/generate?checkout=success`,
    cancel_url: `${appUrl}/generate?checkout=cancelled`,
  })

  return NextResponse.json({ url: session.url })
}
