'use client'

import Link from 'next/link'
import { Hammer } from 'lucide-react'

interface LogoProps {
  isAuthenticated?: boolean
}

export function Logo({ isAuthenticated = false }: LogoProps) {
  return (
    <Link
      href={isAuthenticated ? '/generate' : '/'}
      className="flex items-center gap-2 hover:opacity-80 transition-opacity"
    >
      <Hammer className="h-5 w-5 text-primary" />
      <span className="font-pixel text-xs text-foreground">SkinForge</span>
    </Link>
  )
}
