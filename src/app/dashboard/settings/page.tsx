import { getUser } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { members, organizations } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/forms'
import { Shield, User, Building2, Key, Zap } from 'lucide-react'
import ProfileForm from '@/components/settings/profile-form'
import OrgForm from '@/components/settings/org-form'
import ApiKeySection from '@/components/settings/api-key-section'

export default async function SettingsPage() {
  const user = await getUser()
  if (!user) return null

  const member = await db.query.members.findFirst({
    where: eq(members.userId, user.id),
    with: { org: true } as any,
  })

  const org = member ? await db.query.organizations.findFirst({
    where: eq(organizations.id, (member as any).orgId),
  }) : null

  const displayName = user.user_metadata?.display_name || ''
  const email = user.email || ''
  const initials = (displayName || email).split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '?'

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and organization settings.</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Profile</CardTitle>
          </div>
          <CardDescription>Your personal account details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center text-lg font-semibold text-primary">
              {initials}
            </div>
            <div>
              <p className="font-medium">{displayName || 'No name set'}</p>
              <p className="text-sm text-muted-foreground">{email}</p>
            </div>
          </div>
          <Separator />
          <ProfileForm displayName={displayName} />
        </CardContent>
      </Card>

      {/* Organization */}
      {org && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Organization</CardTitle>
            </div>
            <CardDescription>Your team workspace settings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{org.name}</p>
                <p className="text-sm text-muted-foreground">/{org.slug}</p>
              </div>
              <Badge variant={org.plan === 'free' ? 'secondary' : 'default'} className="capitalize">
                {org.plan}
              </Badge>
            </div>
            {org.plan === 'free' && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 flex items-center gap-3">
                <Zap className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-medium">Upgrade to Pro</p>
                  <p className="text-xs text-muted-foreground">Unlimited projects, team seats, priority support.</p>
                </div>
                <Badge variant="default" className="ml-auto shrink-0">Soon</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* API Keys */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">API Keys</CardTitle>
          </div>
          <CardDescription>
            Use API keys to authenticate the hardening kit CLI with this dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ApiKeySection orgId={org?.id ?? ''} />
        </CardContent>
      </Card>

      {/* Hardening Kit version */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Kit version</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">hardening-kit</span>
            <code className="policy-id">1.0.0</code>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            30 policy rules · 21 scanners · 12 MCP tools · 74 integration tests
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
