import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Wand2, ImagePlus, Download, Sparkles, ArrowRight } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="animate-fade-in">

      {/* Hero */}
      <section className="py-20 md:py-32 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl space-y-8">
            {/* Pixel-art decorative bar */}
            <div className="flex gap-1">
              {['bg-primary', 'bg-accent', 'bg-primary/60', 'bg-accent/60', 'bg-primary/30'].map(
                (c, i) => (
                  <div key={i} className={`h-2 w-8 ${c}`} />
                )
              )}
            </div>

            <h1 className="font-pixel text-lg md:text-2xl leading-loose text-foreground">
              Create Custom<br />
              Minecraft Skins<br />
              <span className="text-primary">with AI</span>
            </h1>

            <p className="text-base text-muted-foreground leading-relaxed">
              Describe your character in plain text or upload a reference image.
              Our AI generates a unique 64&times;64 skin ready for Minecraft Java Edition &mdash; in seconds.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Button asChild size="lg" className="font-semibold font-pixel text-xs">
                <Link href="/signup">
                  Start Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href="#how-it-works">How It Works</a>
              </Button>
            </div>

            <p className="text-xs text-muted-foreground font-pixel">
              &gt; Free &middot; Unlimited &middot; No ads
            </p>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="flex h-4">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 ${i % 2 === 0 ? 'bg-primary/20' : 'bg-accent/20'}`}
          />
        ))}
      </div>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 bg-card/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-pixel text-sm text-center mb-12 text-foreground">
            [ HOW IT WORKS ]
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                title: 'DESCRIBE',
                description: 'Type a prompt describing your ideal skin, or upload a reference image.',
                icon: Wand2,
                color: 'text-primary',
              },
              {
                step: '02',
                title: 'AI GENERATES',
                description: 'Our AI maps colors to every region of the Minecraft skin format.',
                icon: ImagePlus,
                color: 'text-accent',
              },
              {
                step: '03',
                title: 'DOWNLOAD',
                description: 'Preview in 3D, then download your ready-to-use 64\u00d764 PNG skin file.',
                icon: Download,
                color: 'text-primary',
              },
            ].map(({ step, title, description, icon: Icon, color }) => (
              <div
                key={step}
                className="border-2 border-border bg-card p-6 space-y-4 pixel-shadow"
              >
                <div className="flex items-center gap-3">
                  <span className={`font-pixel text-xs ${color}`}>{step}</span>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <h3 className={`font-pixel text-xs ${color}`}>{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="flex h-4">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 ${i % 2 === 0 ? 'bg-border' : 'bg-transparent'}`}
          />
        ))}
      </div>

      {/* Feature Grid */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-pixel text-sm text-center mb-12">[ FEATURES ]</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Wand2,
                iconBg: 'bg-primary/10 border-primary/30',
                iconColor: 'text-primary',
                title: 'Text to Skin',
                description: 'Describe your skin in plain text and watch AI bring it to life.',
              },
              {
                icon: ImagePlus,
                iconBg: 'bg-accent/10 border-accent/30',
                iconColor: 'text-accent',
                title: 'Image Reference',
                description: 'Upload a reference image and the AI extracts colors to match your character.',
              },
              {
                icon: Download,
                iconBg: 'bg-primary/10 border-primary/30',
                iconColor: 'text-primary',
                title: 'Instant Download',
                description: 'Get your skin as a ready-to-use 64\u00d764 PNG in seconds.',
              },
            ].map(({ icon: Icon, iconBg, iconColor, title, description }) => (
              <div
                key={title}
                className={`card-hover border-2 border-border bg-card p-6 space-y-4`}
              >
                <div className={`w-10 h-10 border-2 ${iconBg} flex items-center justify-center`}>
                  <Icon className={`h-5 w-5 ${iconColor}`} />
                </div>
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="flex h-4">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 ${i % 2 === 0 ? 'bg-primary/20' : 'bg-accent/20'}`}
          />
        ))}
      </div>

      {/* Free Access */}
      <section className="py-20 px-4 bg-card/30">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-pixel text-sm text-center mb-4">[ FREE ACCESS ]</h2>
          <p className="text-center text-muted-foreground mb-12">
            Generate as many Minecraft skins as you want. No payments, no ads, no daily cap.
          </p>
          <Card className="card-hover">
            <CardHeader>
              <div className="font-pixel text-xs text-muted-foreground mb-1">ACCESS</div>
              <CardTitle className="font-pixel text-sm">UNLIMITED</CardTitle>
              <p className="text-3xl font-bold mt-2">$0</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {['Unlimited skin generation', 'Download as PNG', '3D preview', 'Text & image input'].map(
                (feature) => (
                  <div key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
                    {feature}
                  </div>
                )
              )}
              <Button asChild variant="outline" className="w-full mt-4">
                <Link href="/signup">Get Started</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4">
        <div className="max-w-xl mx-auto text-center space-y-6">
          {/* Pixel art decorative element */}
          <div className="flex justify-center gap-1 mb-4">
            {[16, 12, 8, 12, 16].map((h, i) => (
              <div key={i} className={`w-3 bg-primary/40`} style={{ height: h }} />
            ))}
          </div>
          <h2 className="font-pixel text-sm leading-loose">
            Ready to forge<br />your perfect skin?
          </h2>
          <p className="text-muted-foreground">
            Join players using AI to create unique Minecraft skins.
          </p>
          <Button asChild size="lg" className="font-pixel text-xs">
            <Link href="/signup">
              Start Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
