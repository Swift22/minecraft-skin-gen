'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface AccountData {
  email: string
  createdAt: string
  totalGenerations: number
}

interface AccountPageClientProps {
  data: AccountData
}

export function AccountPageClient({ data }: AccountPageClientProps) {
  return (
    <div className="animate-fade-in max-w-3xl mx-auto px-4 py-8 space-y-6">
      <h1 className="font-pixel text-sm">ACCOUNT</h1>

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
            </div>
          </div>
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
    </div>
  )
}
