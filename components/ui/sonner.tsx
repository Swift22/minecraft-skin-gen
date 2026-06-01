'use client'

import { Toaster as SonnerToaster } from 'sonner'

export function Toaster() {
  return (
    <SonnerToaster
      theme="dark"
      position="top-right"
      toastOptions={{
        style: {
          background: 'hsl(220 20% 9%)',
          border: '1px solid hsl(220 20% 18%)',
          color: 'hsl(210 30% 90%)',
        },
      }}
    />
  )
}
