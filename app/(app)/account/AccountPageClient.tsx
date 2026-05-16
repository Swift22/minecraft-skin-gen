'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface AccountData {
  email: string
  createdAt: string
  isSubscriber: boolean
  subscriptionEndsAt: string | null
  creditsRemaining: number
  dailyLimit: number
  totalGenerations: number
}

interface AccountPageClientProps {
  data: AccountData
}

export function AccountPageClient({ data }: AccountPageClientProps) {
  const creditPercentage = data.dailyLimit > 0 ? (data.creditsRemaining / data.dailyLimit) * 100 : 0

  async function handleManageSubscription() {
    const response = await fetch('/api/subscription/portal', { method: 'POST' })
    const result = await response.json()
    if (result.url) window.location.href = result.url
  }

  async function handleUpgrade() {
    const response = await fetch('/api/subscription/checkout', { method: 'POST' })
    const result = await response.json()
    if (result.url) window.location.href = result.url
  }

  return (
    <div className="animate-fade-in max-w-3xl mx-auto px-4 py-8 space-y-6">
      <h1 className="font-pixel text-sm">ACCOUNT</h1>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary/20 text-primary text-xl">
                    {data.email.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <p className="font-medium">{data.email}</p>
                  <p className="text-sm text-muted-foreground">
                    Member since {new Date(data.createdAt).toLocaleDateString()}
                  </p>
                  <Badge variant={data.isSubscriber ? 'default' : 'secondary'}>
                    {data.isSubscriber ? 'Pro' : 'Free'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Current Plan: {data.isSubscriber ? 'Pro' : 'Free'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.isSubscriber ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    Your Pro subscription renews on{' '}
                    {data.subscriptionEndsAt
                      ? new Date(data.subscriptionEndsAt).toLocaleDateString()
                      : 'N/A'}
                  </p>
                  <Button variant="outline" onClick={handleManageSubscription}>
                    Manage Subscription
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    You&apos;re on the free plan with 3 generations per day.
                    Upgrade to Pro for 50 daily generations, no ads, and priority processing.
                  </p>
                  <Button onClick={handleUpgrade}>Upgrade to Pro</Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Today&apos;s Credits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Remaining</span>
                <span>
                  {data.creditsRemaining} / {data.dailyLimit}
                </span>
              </div>
              <Progress value={creditPercentage} className="h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">All-Time Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total generations</span>
                <span className="font-medium">{data.totalGenerations}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
