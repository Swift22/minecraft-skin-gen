import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { skinGenerations } from '@/lib/db/schema'
import { eq, and, desc, count } from 'drizzle-orm'
import { GalleryPageClient } from './GalleryPageClient'
import { IS_LOCAL_MODE, LOCAL_USER } from '@/lib/local-mode'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Gallery | SkinForge',
}

export default async function GalleryPage() {
  let userId: string

  if (IS_LOCAL_MODE) {
    userId = LOCAL_USER.id
  } else {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')
    userId = user.id
  }

  const limit = 12

  const [totalResult] = await db
    .select({ value: count() })
    .from(skinGenerations)
    .where(
      and(
        eq(skinGenerations.userId, userId),
        eq(skinGenerations.status, 'completed')
      )
    )

  const totalCount = totalResult?.value ?? 0
  const totalPages = Math.ceil(totalCount / limit)

  const rows = await db
    .select({
      id: skinGenerations.id,
      prompt: skinGenerations.prompt,
      resultPath: skinGenerations.resultPath,
      createdAt: skinGenerations.createdAt,
    })
    .from(skinGenerations)
    .where(
      and(
        eq(skinGenerations.userId, userId),
        eq(skinGenerations.status, 'completed')
      )
    )
    .orderBy(desc(skinGenerations.createdAt))
    .limit(limit)

  // Generate signed URLs
  let items
  if (IS_LOCAL_MODE) {
    items = rows.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
      imageUrl: null,
    }))
  } else {
    const serviceSupabase = await createServiceClient()
    items = await Promise.all(
      rows.map(async (row) => {
        let imageUrl: string | null = null
        if (row.resultPath) {
          const { data } = await serviceSupabase.storage
            .from('skins')
            .createSignedUrl(row.resultPath, 300)
          imageUrl = data?.signedUrl ?? null
        }
        return {
          ...row,
          createdAt: row.createdAt.toISOString(),
          imageUrl,
        }
      })
    )
  }

  return (
    <GalleryPageClient
      initialData={{
        items,
        totalCount,
        page: 1,
        totalPages,
      }}
    />
  )
}
