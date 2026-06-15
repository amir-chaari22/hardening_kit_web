import { notFound } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'
import { projects, scans, exceptions } from '@/lib/db/schema'
import { eq, desc, and } from 'drizzle-orm'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/forms'
import {
  Shield, ArrowLeft, CheckCircle2, XCircle, Clock,
  GitBranch, AlertTriangle, ExternalLink, Terminal, Copy
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import CopyButton from '@/components/projects/copy-button'

const decisionConfig = {
  APPROVE:     { label: 'Approved',    icon: CheckCircle2, variant: 'success' as const,  bg: 'bg-emerald-500/10' },
  BLOCK:       { label: 'Blocked',     icon: XCircle,      variant: 'danger'  as const,  bg: 'bg-red-500/10' },
  NEEDS_FIXES: { label: 'Needs Fixes', icon: Clock,        variant: 'warning' as const,  bg: 'bg-amber-500/10' },
}

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, params.id),
  })
  if (!project) notFound()

  const [scanList, exceptionList] = await Promise.all([
    db.query.scans.findMany({
      where: eq(scans.projectId, project.id),
      orderBy: [desc(scans.createdAt)],
      limit: 30,
    }),
    db.query.exceptions.findMany({
      where: and(eq(exceptions.projectId, project.id), eq(exceptions.active, true)),
      orderBy: [desc(exceptions.createdAt)],
    }),
  ])

  const latest = scanList[0]
  const passRate = scanList.length > 0
    ? Math.round((scanList.filter(s => s.decision === 'APPROVE').length / scanList.length) * 100)
    : null

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link href="/dashboard/projects" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 w-fit">
          <ArrowLeft className="h-4 w-4" /> Projects
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-3">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold">{project.name}</h1>
                <Badge variant="outline" className="text-xs">{project.defaultEnv}</Badge>
                {latest && <Badge variant={decisionConfig[latest.decision].variant}>{decisionConfig[latest.decision].label}</Badge>}
              </div>
              {project.description && <p className="text-muted-foreground text-sm mt-0.5">{project.description}</p>}
            </div>
          </div>
          {project.repoUrl && (
            <a href={project.repoUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Repository
              </Button>
            </a>
          )}
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5 pb-5">
            <p className="text-xs text-muted-foreground mb-1">Total scans</p>
            <p className="text-2xl font-bold">{scanList.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-5">
            <p className="text-xs text-muted-foreground mb-1">Pass rate</p>
            <p className="text-2xl font-bold">{passRate !== null ? `${passRate}%` : '—'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-5">
            <p className="text-xs text-muted-foreground mb-1">Active exceptions</p>
            <p className="text-2xl font-bold">{exceptionList.length}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="scans">
        <TabsList>
          <TabsTrigger value="scans">Scan history ({scanList.length})</TabsTrigger>
          <TabsTrigger value="exceptions">Exceptions ({exceptionList.length})</TabsTrigger>
          <TabsTrigger value="setup">Setup</TabsTrigger>
        </TabsList>

        {/* Scans tab */}
        <TabsContent value="scans">
          <Card>
            <CardContent className="pt-6">
              {scanList.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Terminal className="h-8 w-8 mx-auto mb-3 opacity-40" />
                  <p className="text-sm font-medium mb-1">No scans yet</p>
                  <p className="text-xs">Run <code className="policy-id">harden scan --project {project.name}</code> to get started</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {scanList.map(scan => {
                    const cfg = decisionConfig[scan.decision]
                    const Icon = cfg.icon
                    return (
                      <Link key={scan.id} href={`/dashboard/projects/${project.id}/scans/${scan.id}`}>
                        <div className="flex items-center gap-4 rounded-lg border px-4 py-3 hover:bg-accent/50 transition-colors cursor-pointer">
                          <div className={`rounded-lg p-1.5 ${cfg.bg}`}>
                            <Icon className={`h-4 w-4 ${
                              scan.decision === 'APPROVE' ? 'text-emerald-600' :
                              scan.decision === 'BLOCK'   ? 'text-red-600' : 'text-amber-600'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Badge variant={cfg.variant} className="text-xs">{cfg.label}</Badge>
                              <Badge variant="outline" className="text-xs">{scan.environment}</Badge>
                              {scan.branch && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <GitBranch className="h-3 w-3" />{scan.branch}
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {scan.blockingCount > 0 && <span className="text-red-500">{scan.blockingCount} blocking · </span>}
                              {scan.warningCount > 0 && <span>{scan.warningCount} warning{scan.warningCount !== 1 ? 's' : ''} · </span>}
                              {formatDistanceToNow(new Date(scan.createdAt), { addSuffix: true })}
                              {scan.durationMs && ` · ${scan.durationMs}ms`}
                            </p>
                          </div>
                          {scan.commitSha && (
                            <code className="policy-id text-xs hidden lg:block">{scan.commitSha.slice(0, 7)}</code>
                          )}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Exceptions tab */}
        <TabsContent value="exceptions">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Active exceptions</CardTitle>
              <CardDescription>
                Documented policy exceptions with expiry dates. Manage via CLI: <code className="policy-id">harden exception add &lt;POLICY_ID&gt;</code>
              </CardDescription>
            </CardHeader>
            <CardContent>
              {exceptionList.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">No active exceptions. All policies enforced.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {exceptionList.map(exc => {
                    const expired = exc.expiresAt && new Date(exc.expiresAt) < new Date()
                    return (
                      <div key={exc.id} className="flex items-start gap-3 rounded-lg border px-4 py-3">
                        <code className="policy-id mt-0.5">{exc.policyId}</code>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">{exc.reason}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            {exc.approvedBy && <span>Approved by {exc.approvedBy}</span>}
                            {exc.expiresAt && (
                              <span className={expired ? 'text-red-500' : ''}>
                                {expired ? 'Expired' : 'Expires'} {format(new Date(exc.expiresAt), 'MMM d, yyyy')}
                              </span>
                            )}
                          </div>
                        </div>
                        <Badge variant={expired ? 'danger' : 'success'} className="text-xs shrink-0">
                          {expired ? 'Expired' : 'Active'}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Setup tab */}
        <TabsContent value="setup">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick setup</CardTitle>
              <CardDescription>Connect this project to the hardening kit CLI and CI/CD pipeline.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                {
                  step: '1', title: 'Install',
                  cmd: 'npm install -g hardening-kit',
                },
                {
                  step: '2', title: 'Initialize',
                  cmd: `harden init`,
                },
                {
                  step: '3', title: 'Run your first scan',
                  cmd: `harden scan --env ${project.defaultEnv} --project "${project.name}" --format json`,
                },
                {
                  step: '4', title: 'Add to CI/CD (GitHub Actions)',
                  cmd: `# .github/workflows/release-hardening.yml is created by harden init`,
                },
              ].map(({ step, title, cmd }) => (
                <div key={step} className="flex gap-4">
                  <div className="h-7 w-7 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                    {step}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-1.5">{title}</p>
                    <div className="relative rounded-md bg-muted px-4 py-2.5 font-mono text-xs">
                      <span className="text-muted-foreground pr-8">{cmd}</span>
                      <CopyButton text={cmd} />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
