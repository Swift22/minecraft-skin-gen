'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase/client'
import { Mail } from 'lucide-react'

function getSignupErrorMessage(error: string): string {
  if (error.includes('user_already_exists') || error.includes('already registered')) {
    return 'An account with this email already exists.'
  }
  if (error.includes('weak_password') || error.includes('Password should be')) {
    return 'Password must be at least 8 characters.'
  }
  return 'An error occurred during sign up. Please try again.'
}

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    let hasError = false
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address.')
      hasError = true
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters.')
      hasError = true
    }
    if (hasError) return

    setIsLoading(true)
    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signUp({ email, password })

      if (authError) {
        toast.error(getSignupErrorMessage(authError.message))
        return
      }

      setSuccess(true)
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <Card className="animate-fade-in">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="font-pixel text-sm">CHECK EMAIL</CardTitle>
          <CardDescription>
            We sent a confirmation link to <strong>{email}</strong>. Click the link to activate
            your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-muted-foreground">
            Already confirmed?{' '}
            <Link href="/login" className="underline hover:text-foreground">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="font-pixel text-sm">NEW_ACCOUNT</CardTitle>
        <CardDescription>&gt; Sign up for SkinForge</CardDescription>
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
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              aria-required="true"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading} aria-busy={isLoading}>
            {isLoading ? 'Creating account\u2026' : 'Create Account'}
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
          Already have an account?{' '}
          <Link href="/login" className="underline hover:text-foreground">
            Log in
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
