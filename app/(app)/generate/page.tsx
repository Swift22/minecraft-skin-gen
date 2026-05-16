import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserCredits } from '@/lib/credits'
import { GeneratorPageClient } from './GeneratorPageClient'
import { IS_LOCAL_MODE, LOCAL_USER } from '@/lib/local-mode'

/**
 * Server Component wrapper for the skin generator page.
 * Fetches initial user data directly from the DB to avoid circular HTTP calls.
 */
export default async function GeneratePage() {
  if (IS_LOCAL_MODE) {
    return <GeneratorPageClient initialUser={LOCAL_USER} />
  }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const credits = await getUserCredits(user.id)
  if (!credits) {
    redirect('/login')
  }

  return <GeneratorPageClient initialUser={credits} />
}
