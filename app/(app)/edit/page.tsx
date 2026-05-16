import { redirect } from 'next/navigation'
import { eq, and } from 'drizzle-orm'
import { IS_LOCAL_MODE } from '@/lib/local-mode'
import { EditPageClient } from './EditPageClient'

export const dynamic = 'force-dynamic'

interface EditPageProps {
  searchParams: Promise<{ id?: string }>
}

export default async function EditPage({ searchParams }: EditPageProps) {
  const { id } = await searchParams

  // No ID → upload mode
  if (!id) {
    return <EditPageClient />
  }

  // Local mode: serve from local path
  if (IS_LOCAL_MODE) {
    return <EditPageClient skinUrl={`/local-skins/${id}.png`} generationId={id} />
  }

  // Auth check + fetch generation
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { db } = await import('@/lib/db')
  const { skinGenerations } = await import('@/lib/db/schema')

  const [generation] = await db
    .select()
    .from(skinGenerations)
    .where(and(eq(skinGenerations.id, id), eq(skinGenerations.userId, user.id)))
    .limit(1)

  if (!generation || generation.status !== 'completed' || !generation.resultPath) {
    redirect('/gallery')
  }

  // Generate signed URL from Supabase Storage
  const { createServiceClient } = await import('@/lib/supabase/server')
  const serviceClient = await createServiceClient()
  const { data: signedData } = await serviceClient.storage
    .from('skins')
    .createSignedUrl(generation.resultPath, 3600)

  if (!signedData?.signedUrl) {
    redirect('/gallery')
  }

  return <EditPageClient skinUrl={signedData.signedUrl} generationId={id} />
}
