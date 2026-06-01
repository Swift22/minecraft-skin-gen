'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase/client'

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: 'Invalid email or password.',
  Invalid_login_credentials: 'Invalid email or password.',
}

function getAuthErrorMessage(error: string): string {
  for (const [key, message] of Object.entries(AUTH_ERROR_MESSAGES)) {
    if (error.includes(key)) return message
  }
  return 'Invalid email or password.'
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!email.trim()) {
      toast.error('Email is required.')
      return
    }
    if (!password) {
      toast.error('Password is required.')
      return
    }

    setIsLoading(true)
    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

      if (authError) {
        toast.error(getAuthErrorMessage(authError.message))
        return
      }

      router.push('/generate')
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="font-pixel text-sm">LOG_IN</CardTitle>
        <CardDescription>&gt; Sign in to your SkinForge account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              aria-required="true"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              aria-required="true"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading} aria-busy={isLoading}>
            {isLoading ? 'Signing in\u2026' : 'Sign In'}
          </Button>
        </form>

        <div className="relative my-6">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
            or
          </span>
        </div>

        <TooltipProvider>
          <div className="flex flex-col gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" className="w-full" disabled>
                  Continue with Google
                </Button>
              </TooltipTrigger>
              <TooltipContent>Coming soon</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" className="w-full" disabled>
                  Continue with Discord
                </Button>
              </TooltipTrigger>
              <TooltipContent>Coming soon</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="underline hover:text-foreground">
            Sign up
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
