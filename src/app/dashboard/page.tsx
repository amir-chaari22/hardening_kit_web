import { getUser } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { scans, projects, alerts, members } from '@/lib/db/schema'
import { eq, desc, and, count, gte } from 'drizzle-orm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Shield, FolderOpen, AlertTriangle, TrendingUp, Plus, ArrowRight, CheckCircle2, XCircle, Clock } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

type ScanDecision = 'APPROVE' | 'BLOCK' | 'NEEDS_FIXES'

const decisionConfig: Record<ScanDecision, { label: string; icon: React.ElementType; color: string; variant: 'success'|'danger'|'warning' }> = {
  APPROVE:     { label: 'Approved',    icon: CheckCircle2, color: 'text-emerald-500', variant: 'success' },
  BLOCK:       { label: 'Blocked',     icon: XCircle,      color: 'text-red-500',     variant: 'danger'  },
  NEEDS_FIXES: { label: 'Needs Fixes', icon: Clock,        color: 'text-amber-500',   variant: 'warning' },
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'; if (h < 17) return 'afternoon'; return 'evening'
}

export default async function DashboardPage() {
  const user = await getUser()
  if (!user) return null

  const member = await db.query.members.findFirst({ where: eq(members.userId, user.id) })

  if (!member) return (
    <div className="p-8 text-center">
      <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
      <h2 className="text-xl font-semibold mb-2">Welcome to Hardening Kit</h2>
      <p className="text-muted-foreground mb-6">Create your first project to start scanning releases.</p>
      <Link href="/dashboard/projects/new"><Button><Plus className="mr-2 h-4 w-4" />New Project</Button></Link>
    </div>
  )

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const [pCount] = await db.select({ count: count() }).from(projects).where(eq(projects.orgId, member.orgId))
  const [sCount] = await db.select({ count: count() }).from(scans).where(and(eq(scans.orgId, member.orgId), gte(scans.createdAt, sevenDaysAgo)))
  const [bCount] = await db.select({ count: count() }).from(scans).where(and(eq(scans.orgId, member.orgId), eq(scans.decision, 'BLOCK'), gte(scans.createdAt, sevenDaysAgo)))
  const [aCount] = await db.select({ count: count() }).from(alerts).where(and(eq(alerts.orgId, member.orgId), eq(alerts.read, false)))
  const total = Number(sCount.count); const blocked = Number(bCount.count)
  const stats = { projects: Number(pCount.count), scans: total, blockRate: total > 0 ? Math.round((blocked/total)*100) : 0, alerts: Number(aCount.count) }

  const recentScans = await db.query.scans.findMany({ where: eq(scans.orgId, member.orgId), orderBy: [desc(scans.createdAt)], limit: 8 })
  const projectMap: Record<string, string> = {}
  for (const s of recentScans) {
    if (!projectMap[s.projectId]) {
      const p = await db.query.projects.findFirst({ where: eq(projects.id, s.projectId) })
      if (p) projectMap[p.id] = p.name
    }
  }

  const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'there'

  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-500/10 text-indigo-600', blue: 'bg-blue-500/10 text-blue-600',
    red: 'bg-red-500/10 text-red-600', emerald: 'bg-emerald-500/10 text-emerald-600',
    amber: 'bg-amber-500/10 text-amber-600',
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Good {getGreeting()}, {displayName}</h1>
          <p className="text-muted-foreground mt-1">Release security overview — past 7 days.</p>
        </div>
        <Link href="/dashboard/projects/new"><Button><Plus className="mr-2 h-4 w-4" />New Project</Button></Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {([
          { icon: FolderOpen, label: 'Projects',    value: stats.projects,             color: 'indigo' },
          { icon: Shield,     label: 'Scans (7d)',  value: stats.scans,                color: 'blue' },
          { icon: AlertTriangle, label: 'Block rate', value: `${stats.blockRate}%`,     color: stats.blockRate > 20 ? 'red' : 'emerald' },
          { icon: TrendingUp, label: 'Open alerts', value: stats.alerts,               color: stats.alerts > 0 ? 'amber' : 'emerald' },
        ] as const).map(({ icon: Icon, label, value, color }) => (
          <Card key={label}>
            <CardContent className="pt-6 pb-6">
              <div className="flex items-center gap-3">
                <div className={`rounded-lg p-2 ${colorMap[color]}`}><Icon className="h-5 w-5" /></div>
                <div><p className="text-2xl font-bold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Recent scans</CardTitle>
            <CardDescription>Latest security scan results across all projects</CardDescription>
          </div>
          <Link href="/dashboard/projects"><Button variant="ghost" size="sm">View all <ArrowRight className="ml-1 h-3 w-3" /></Button></Link>
        </CardHeader>
        <CardContent>
          {recentScans.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-8 w-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No scans yet. Run <code className="policy-id">harden scan</code> in your project.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentScans.map(scan => {
                const cfg = decisionConfig[scan.decision as ScanDecision]
                const Icon = cfg.icon
                return (
                  <Link key={scan.id} href={`/dashboard/projects/${scan.projectId}/scans/${scan.id}`}>
                    <div className="flex items-center gap-4 rounded-lg border px-4 py-3 hover:bg-accent/50 transition-colors cursor-pointer">
                      <Icon className={`h-5 w-5 shrink-0 ${cfg.color}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{projectMap[scan.projectId] ?? scan.projectId}</span>
                          <Badge variant={cfg.variant} className="text-xs">{cfg.label}</Badge>
                          <Badge variant="outline" className="text-xs">{scan.environment}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {scan.blockingCount > 0 && `${scan.blockingCount} violation${scan.blockingCount !== 1 ? 's' : ''} · `}
                          {formatDistanceToNow(new Date(scan.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
