'use client'

import { Pencil, Eraser, Pipette, PaintBucket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { EditorTool } from '@/hooks/use-editor-state'

interface EditorToolbarProps {
  activeTool: EditorTool
  onToolChange: (tool: EditorTool) => void
}

const TOOLS: { id: EditorTool; icon: typeof Pencil; label: string; shortcut: string }[] = [
  { id: 'pencil', icon: Pencil, label: 'Pencil', shortcut: 'B' },
  { id: 'eraser', icon: Eraser, label: 'Eraser', shortcut: 'E' },
  { id: 'eyedropper', icon: Pipette, label: 'Eyedropper', shortcut: 'I' },
  { id: 'fill', icon: PaintBucket, label: 'Fill', shortcut: 'G' },
]

export function EditorToolbar({ activeTool, onToolChange }: EditorToolbarProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex gap-1">
        {TOOLS.map(({ id, icon: Icon, label, shortcut }) => (
          <Tooltip key={id}>
            <TooltipTrigger asChild>
              <Button
                variant={activeTool === id ? 'default' : 'outline'}
                size="icon"
                onClick={() => onToolChange(id)}
                aria-label={`${label} (${shortcut})`}
                aria-pressed={activeTool === id}
              >
                <Icon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {label} ({shortcut})
              </p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  )
}
