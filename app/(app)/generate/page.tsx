import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { GeneratorPageClient } from './GeneratorPageClient'
import { IS_LOCAL_MODE } from '@/lib/local-mode'

/**
 * Server Component wrapper for the skin generator page.
 * Keeps auth enforcement server-side before rendering the generator.
 */
export default async function GeneratePage() {
  if (IS_LOCAL_MODE) {
    return <GeneratorPageClient />
  }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <GeneratorPageClient />
}
