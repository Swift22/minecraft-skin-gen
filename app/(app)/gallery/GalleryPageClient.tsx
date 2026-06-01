'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { GallerySkeleton } from '@/components/skin-generator/GallerySkeleton'
import { SkinDetailDialog } from '@/components/skin-generator/SkinDetailDialog'
import { Plus, ImageIcon } from 'lucide-react'

interface SkinItem {
  id: string
  prompt: string | null
  resultPath: string | null
  imageUrl?: string | null
  createdAt: string
}

interface GalleryData {
  items: SkinItem[]
  totalCount: number
  page: number
  totalPages: number
}

interface GalleryPageClientProps {
  initialData: GalleryData
}

export function GalleryPageClient({ initialData }: GalleryPageClientProps) {
  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(false)
  const [selectedSkin, setSelectedSkin] = useState<SkinItem | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  async function loadMore() {
    if (loading || data.page >= data.totalPages) return
    setLoading(true)
    try {
      const nextPage = data.page + 1
      const response = await fetch(`/api/gallery?page=${nextPage}&limit=12`)
      if (response.ok) {
        const newData = await response.json()
        setData({
          ...newData,
          items: [...data.items, ...newData.items],
        })
      }
    } finally {
      setLoading(false)
    }
  }

  function handleSkinClick(skin: SkinItem) {
    setSelectedSkin(skin)
    setDialogOpen(true)
  }

  // Empty state
  if (data.totalCount === 0) {
    return (
      <div className="animate-fade-in max-w-5xl mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h2 className="font-pixel text-sm">NO SKINS YET</h2>
            <p className="text-muted-foreground">Create your first AI-generated Minecraft skin.</p>
          </div>
          <Button asChild>
            <Link href="/generate">
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Skin
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-pixel text-sm">MY SKINS</h1>
          <p className="text-xs text-muted-foreground mt-1">{data.totalCount} skins created</p>
        </div>
        <Button asChild size="sm">
          <Link href="/generate">
            <Plus className="mr-2 h-4 w-4" />
            Create New
          </Link>
        </Button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {data.items.map((skin) => (
          <button
            key={skin.id}
            onClick={() => handleSkinClick(skin)}
            className="card-hover rounded-lg border border-border bg-card p-3 text-left group"
          >
            <div className="aspect-square rounded bg-muted/30 overflow-hidden mb-3">
              {skin.imageUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={skin.imageUrl}
                  alt={skin.prompt ?? 'Generated skin'}
                  className="w-full h-full object-contain pixel-art"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
                </div>
              )}
            </div>
            <p className="text-sm truncate">{skin.prompt ?? 'No prompt'}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(skin.createdAt).toLocaleDateString()}
            </p>
          </button>
        ))}
      </div>

      {/* Load More */}
      {data.page < data.totalPages && (
        <div className="flex justify-center pt-4">
          <Button variant="outline" onClick={loadMore} disabled={loading}>
            {loading ? 'Loading\u2026' : 'Load More'}
          </Button>
        </div>
      )}

      {loading && data.page > 1 && <GallerySkeleton />}

      <SkinDetailDialog skin={selectedSkin} open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
