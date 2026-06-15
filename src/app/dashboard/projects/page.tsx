import { getUser } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { projects, scans, members } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Shield, Plus, FolderOpen, CheckCircle2, XCircle, Clock, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

export default async function ProjectsPage() {
  const user = await getUser()
  if (!user) return null

  const member = await db.query.members.findFirst({ where: eq(members.userId, user.id) })

  const projectList = member ? await db.query.projects.findMany({
    where: eq(projects.orgId, member.orgId),
    orderBy: [desc(projects.updatedAt)],
  }) : []

  // Get latest scan per project
  const latestScans: Record<string, any> = {}
  for (const p of projectList) {
    const s = await db.query.scans.findFirst({
      where: eq(scans.projectId, p.id),
      orderBy: [desc(scans.createdAt)],
    })
    if (s) latestScans[p.id] = s
  }

  const decisionIcon = {
    APPROVE:     <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
    BLOCK:       <XCircle className="h-4 w-4 text-red-500" />,
    NEEDS_FIXES: <Clock className="h-4 w-4 text-amber-500" />,
  }

  const decisionVariant: Record<string, any> = {
    APPROVE: 'success', BLOCK: 'danger', NEEDS_FIXES: 'warning',
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-muted-foreground mt-1">Manage and monitor your release security.</p>
        </div>
        <Link href="/dashboard/projects/new">
          <Button><Plus className="mr-2 h-4 w-4" />New Project</Button>
        </Link>
      </div>

      {projectList.length === 0 ? (
        <div className="rounded-xl border border-dashed p-16 text-center">
          <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">No projects yet</h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
            Create your first project to start scanning releases and enforcing security policies.
          </p>
          <Link href="/dashboard/projects/new">
            <Button><Plus className="mr-2 h-4 w-4" />Create first project</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projectList.map(project => {
            const latest = latestScans[project.id]
            return (
              <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
                <Card className="hover:border-primary/50 transition-all hover:shadow-sm cursor-pointer h-full">
                  <CardContent className="pt-5 pb-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="rounded-lg bg-primary/10 p-2">
                          <Shield className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm">{project.name}</h3>
                          <p className="text-xs text-muted-foreground">{project.defaultEnv}</p>
                        </div>
                      </div>
                      {latest && (
                        <Badge variant={decisionVariant[latest.decision]} className="text-xs">
                          {latest.decision.replace('_', ' ')}
                        </Badge>
                      )}
                    </div>

                    {project.description && (
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{project.description}</p>
                    )}

                    {latest ? (
                      <div className="mt-3 pt-3 border-t space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            {decisionIcon[latest.decision as keyof typeof decisionIcon]}
                            <span>Last scan</span>
                          </div>
                          <span className="text-muted-foreground">
                            {formatDistanceToNow(new Date(latest.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        {latest.blockingCount > 0 && (
                          <p className="text-xs text-red-600 dark:text-red-400">
                            {latest.blockingCount} blocking violation{latest.blockingCount !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-muted-foreground">No scans yet</p>
                      </div>
                    )}

                    {project.repoUrl && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                        <ExternalLink className="h-3 w-3" />
                        <span className="truncate">{project.repoUrl.replace(/^https?:\/\//, '')}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
