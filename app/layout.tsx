import type { Metadata } from 'next'
import Script from 'next/script'
import { Press_Start_2P } from 'next/font/google'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const pixelFont = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-pixel',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'SkinForge — AI Minecraft Skin Generator',
  description: 'Create unique, AI-generated Minecraft skins from text descriptions or reference images.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT
  const shouldLoadAdsense =
    process.env.NODE_ENV === 'production' &&
    !!adsenseClientId &&
    adsenseClientId.startsWith('ca-pub-')

  return (
    <html lang="en" className={`dark ${pixelFont.variable}`}>
      <body className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <Toaster />
        {shouldLoadAdsense && (
          <Script
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`}
            strategy="afterInteractive"
            crossOrigin="anonymous"
          />
        )}
      </body>
    </html>
  )
}
