'use client'

import { useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Pixel } from '@/lib/skin-editor/pixel-buffer'

interface ColorPaletteProps {
  foregroundColor: Pixel
  recentColors: string[]
  onColorChange: (hex: string) => void
}

const MC_PRESETS = [
  '#1d1d21', '#474f52', '#9d9d97', '#f9fffe', // grays
  '#835432', '#b02e26', '#f9801d', '#ffd83d', // warm
  '#80c71f', '#5e7c16', '#169c9c', '#3ab3da', // cool
  '#3c44aa', '#7b2fbe', '#f38baa', '#c74ebd', // purples/pinks
]

function pixelToHex(pixel: Pixel): string {
  return `#${pixel[0].toString(16).padStart(2, '0')}${pixel[1].toString(16).padStart(2, '0')}${pixel[2].toString(16).padStart(2, '0')}`
}

export function ColorPalette({ foregroundColor, recentColors, onColorChange }: ColorPaletteProps) {
  const hexValue = pixelToHex(foregroundColor)

  const handleHexInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      if (/^#[0-9a-fA-F]{6}$/.test(val)) {
        onColorChange(val)
      }
    },
    [onColorChange]
  )

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs text-muted-foreground mb-1 block">Color</Label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={hexValue}
            onChange={(e) => onColorChange(e.target.value)}
            className="w-10 h-10 border border-border rounded cursor-pointer bg-transparent"
            aria-label="Color picker"
          />
          <Input
            value={hexValue}
            onChange={handleHexInput}
            className="w-24 font-mono text-xs h-8"
            maxLength={7}
            aria-label="Hex color value"
          />
          <div
            className="w-8 h-8 rounded border border-border checkerboard-bg"
            title="Current color preview"
          >
            <div
              className="w-full h-full rounded"
              style={{
                backgroundColor: `rgba(${foregroundColor[0]},${foregroundColor[1]},${foregroundColor[2]},${foregroundColor[3] / 255})`,
              }}
            />
          </div>
        </div>
      </div>

      {recentColors.length > 1 && (
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Recent</Label>
          <div className="flex flex-wrap gap-1">
            {recentColors.map((color) => (
              <button
                key={color}
                className="w-6 h-6 rounded border border-border hover:border-primary/60 transition-colors"
                style={{ backgroundColor: color }}
                onClick={() => onColorChange(color)}
                title={color}
                aria-label={`Select color ${color}`}
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <Label className="text-xs text-muted-foreground mb-1 block">Minecraft</Label>
        <div className="grid grid-cols-4 gap-1">
          {MC_PRESETS.map((color) => (
            <button
              key={color}
              className="w-6 h-6 rounded border border-border hover:border-primary/60 transition-colors"
              style={{ backgroundColor: color }}
              onClick={() => onColorChange(color)}
              title={color}
              aria-label={`Select preset ${color}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
