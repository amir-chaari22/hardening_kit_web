import { getUser } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { alerts, members } from '@/lib/db/schema'
import { eq, desc, and } from 'drizzle-orm'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bell, XCircle, AlertTriangle, Clock } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import MarkReadButton from '@/components/alerts/mark-read-button'

const alertConfig: Record<string, { icon: any; variant: any; label: string }> = {
  block:               { icon: XCircle,       variant: 'danger',   label: 'Release Blocked' },
  new_critical:        { icon: AlertTriangle,  variant: 'warning',  label: 'New Critical' },
  expiring_exception:  { icon: Clock,          variant: 'secondary',label: 'Expiring Exception' },
}

export default async function AlertsPage() {
  const user = await getUser()
  if (!user) return null

  const member = await db.query.members.findFirst({ where: eq(members.userId, user.id) })

  const alertList = member ? await db.query.alerts.findMany({
    where: eq(alerts.orgId, member.orgId),
    orderBy: [desc(alerts.createdAt)],
    limit: 50,
  }) : []

  const unread = alertList.filter(a => !a.read)

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Alerts</h1>
          <p className="text-muted-foreground mt-1">
            {unread.length > 0 ? `${unread.length} unread alert${unread.length !== 1 ? 's' : ''}` : 'All caught up'}
          </p>
        </div>
        {unread.length > 0 && <MarkReadButton orgId={member?.orgId ?? ''} />}
      </div>

      <Card>
        <CardContent className="pt-6">
          {alertList.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No alerts</p>
              <p className="text-sm mt-1">Security alerts will appear here when scans detect issues.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {alertList.map(alert => {
                const cfg = alertConfig[alert.type] ?? { icon: Bell, variant: 'secondary', label: alert.type }
                const Icon = cfg.icon
                return (
                  <div
                    key={alert.id}
                    className={`flex items-start gap-4 rounded-lg border px-4 py-3 transition-colors ${
                      !alert.read ? 'bg-primary/5 border-primary/20' : 'opacity-60'
                    }`}
                  >
                    <div className={`rounded-lg p-1.5 mt-0.5 ${
                      alert.type === 'block' ? 'bg-red-500/10' : 'bg-amber-500/10'
                    }`}>
                      <Icon className={`h-4 w-4 ${
                        alert.type === 'block' ? 'text-red-500' : 'text-amber-500'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <Badge variant={cfg.variant} className="text-xs">{cfg.label}</Badge>
                        {!alert.read && (
                          <span className="h-2 w-2 rounded-full bg-primary inline-block" />
                        )}
                      </div>
                      <p className="text-sm font-medium">{alert.title}</p>
                      {alert.body && <p className="text-xs text-muted-foreground mt-0.5">{alert.body}</p>}
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        <span>{formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}</span>
                        {alert.projectId && (
                          <Link href={`/dashboard/projects/${alert.projectId}`} className="hover:text-foreground underline">
                            View project
                          </Link>
                        )}
                        {alert.scanId && (
                          <Link href={`/dashboard/projects/${alert.projectId}/scans/${alert.scanId}`} className="hover:text-foreground underline">
                            View scan
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
