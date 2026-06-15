import { notFound } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'
import { scans, projects } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/forms'
import {
  ArrowLeft, CheckCircle2, XCircle, Clock, AlertTriangle,
  Shield, GitBranch, GitCommit, Zap, Package
} from 'lucide-react'
import { format } from 'date-fns'

const decisionConfig = {
  APPROVE:     { label: 'Approved',    icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10', variant: 'success' as const },
  BLOCK:       { label: 'Blocked',     icon: XCircle,      color: 'text-red-500',     bg: 'bg-red-500/10',     variant: 'danger'  as const },
  NEEDS_FIXES: { label: 'Needs Fixes', icon: Clock,        color: 'text-amber-500',   bg: 'bg-amber-500/10',   variant: 'warning' as const },
}

type Violation = { id: string; message: string; action: string; remediation?: string }

export default async function ScanDetailPage({ params }: { params: { id: string; scanId: string } }) {
  const scan = await db.query.scans.findFirst({ where: eq(scans.id, params.scanId) })
  if (!scan) notFound()

  const project = await db.query.projects.findFirst({ where: eq(projects.id, scan.projectId) })

  const cfg = decisionConfig[scan.decision]
  const DecisionIcon = cfg.icon
  const violations   = scan.violations as Violation[]
  const warnings     = scan.warnings   as Violation[]
  const checks       = scan.checksSummary as Record<string, unknown>
  const toolsUsed    = scan.toolsUsed  as string[]

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard/projects" className="hover:text-foreground">Projects</Link>
        <span>/</span>
        <Link href={`/dashboard/projects/${scan.projectId}`} className="hover:text-foreground">{project?.name ?? 'Project'}</Link>
        <span>/</span>
        <span className="text-foreground font-medium">Scan</span>
      </div>

      {/* Decision banner */}
      <div className={`rounded-xl border p-6 ${cfg.bg}`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className={`rounded-full ${cfg.bg} p-3`}>
              <DecisionIcon className={`h-8 w-8 ${cfg.color}`} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={cfg.variant} className="text-sm px-3 py-1">{cfg.label}</Badge>
                <Badge variant="outline">{scan.environment}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {format(new Date(scan.createdAt), 'PPpp')}
                {scan.durationMs && ` · ${scan.durationMs}ms`}
              </p>
            </div>
          </div>

          <div className="flex gap-6 text-center">
            <div>
              <p className="text-2xl font-bold text-red-500">{violations.length}</p>
              <p className="text-xs text-muted-foreground">Violations</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-500">{warnings.length}</p>
              <p className="text-xs text-muted-foreground">Warnings</p>
            </div>
          </div>
        </div>

        {/* Meta */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
          {scan.branch && (
            <div className="flex items-center gap-1.5">
              <GitBranch className="h-3.5 w-3.5" /> {scan.branch}
            </div>
          )}
          {scan.commitSha && (
            <div className="flex items-center gap-1.5 font-mono">
              <GitCommit className="h-3.5 w-3.5" /> {scan.commitSha.slice(0, 7)}
            </div>
          )}
          {toolsUsed.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5" /> {toolsUsed.join(', ')}
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5" /> v{scan.scannerVersion}
          </div>
        </div>
      </div>

      <Tabs defaultValue={violations.length > 0 ? 'violations' : warnings.length > 0 ? 'warnings' : 'checks'}>
        <TabsList>
          <TabsTrigger value="violations">
            Violations {violations.length > 0 && `(${violations.length})`}
          </TabsTrigger>
          <TabsTrigger value="warnings">
            Warnings {warnings.length > 0 && `(${warnings.length})`}
          </TabsTrigger>
          <TabsTrigger value="checks">Checks summary</TabsTrigger>
        </TabsList>

        {/* Violations */}
        <TabsContent value="violations">
          {violations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-500 mb-3" />
                <p className="font-medium">No blocking violations</p>
                <p className="text-sm text-muted-foreground mt-1">All critical policies passed.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {violations.map((v, i) => (
                <div key={i} className="violation-block">
                  <div className="flex items-start gap-3">
                    <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <code className="policy-id">{v.id}</code>
                        <Badge variant="danger" className="text-xs">BLOCK</Badge>
                      </div>
                      <p className="text-sm font-medium">{v.message}</p>
                      {v.remediation && (
                        <div className="mt-2 rounded-md bg-background/60 px-3 py-2">
                          <p className="text-xs text-muted-foreground font-medium mb-0.5">Remediation</p>
                          <p className="text-xs">{v.remediation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Warnings */}
        <TabsContent value="warnings">
          {warnings.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-500 mb-3" />
                <p className="font-medium">No warnings</p>
                <p className="text-sm text-muted-foreground mt-1">All advisory policies passed.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {warnings.map((w, i) => (
                <div key={i} className="violation-warn">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <code className="policy-id">{w.id}</code>
                        <Badge variant="warning" className="text-xs">WARN</Badge>
                      </div>
                      <p className="text-sm font-medium">{w.message}</p>
                      {w.remediation && (
                        <div className="mt-2 rounded-md bg-background/60 px-3 py-2">
                          <p className="text-xs text-muted-foreground font-medium mb-0.5">Remediation</p>
                          <p className="text-xs">{w.remediation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Checks summary */}
        <TabsContent value="checks">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Security checks summary</CardTitle>
              <CardDescription>Boolean snapshot of all 21 scanner results.</CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(checks).length === 0 ? (
                <p className="text-sm text-muted-foreground">No checks data available.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.entries(checks).map(([key, value]) => {
                    const isGood = value === false || value === 0 || value === true && key.includes('exists') || key === 'lockfile_exists' && value
                    const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
                    return (
                      <div key={key} className="flex items-center justify-between rounded-lg border px-3 py-2">
                        <span className="text-xs text-muted-foreground">{label}</span>
                        <span className="text-xs font-mono">
                          {typeof value === 'boolean'
                            ? value
                              ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 inline" />
                              : <XCircle className="h-3.5 w-3.5 text-red-500 inline" />
                            : String(value)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
