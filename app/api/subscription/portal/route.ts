import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { env } from '@/lib/env'

/** POST /api/subscription/portal — create a Stripe Billing Portal session */
export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'unauthorized', message: 'Not authenticated.' }, { status: 401 })
  }

  const [userRow] = await db
    .select({ stripeCustomerId: users.stripeCustomerId })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1)

  if (!userRow?.stripeCustomerId) {
    return NextResponse.json(
      { error: 'no_customer', message: 'No Stripe customer record found.' },
      { status: 400 }
    )
  }

  const appUrl = env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const session = await stripe.billingPortal.sessions.create({
    customer: userRow.stripeCustomerId,
    return_url: `${appUrl}/generate`,
  })

  return NextResponse.json({ url: session.url })
}
