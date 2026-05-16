import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { skinGenerations } from '@/lib/db/schema'
import { eq, and, desc, count } from 'drizzle-orm'
import { IS_LOCAL_MODE, LOCAL_USER } from '@/lib/local-mode'

export async function GET(request: NextRequest) {
  let userId: string

  if (IS_LOCAL_MODE) {
    userId = LOCAL_USER.id
  } else {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    userId = user.id
  }

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '12', 10)))
  const offset = (page - 1) * limit

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
    .offset(offset)

  // Generate signed URLs
  let items = rows
  if (!IS_LOCAL_MODE) {
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
        return { ...row, imageUrl }
      })
    )
  }

  return NextResponse.json({
    items,
    totalCount,
    page,
    totalPages,
  })
}
