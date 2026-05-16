import { Hammer } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Pixel art logo header */}
        <div className="flex flex-col items-center gap-3">
          <div className="border-2 border-primary p-3 shadow-[4px_4px_0_0_hsl(var(--primary)/0.4)]">
            <Hammer className="h-8 w-8 text-primary" />
          </div>
          <span className="font-pixel text-sm text-foreground">SkinForge</span>
          <p className="font-pixel text-[9px] text-muted-foreground text-center leading-loose">
            AI MINECRAFT SKIN GENERATOR
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
