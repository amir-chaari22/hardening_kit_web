'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/forms'
import { Shield, Plus, FolderOpen, CheckCircle2, XCircle, Clock, ExternalLink, Search } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

type Project = { id: string; name: string; description: string | null; repoUrl: string | null; defaultEnv: string; createdAt: Date; updatedAt: Date }
type Scan    = { decision: 'APPROVE'|'BLOCK'|'NEEDS_FIXES'; blockingCount: number; createdAt: Date } | null

const decisionIcon = {
  APPROVE:     <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
  BLOCK:       <XCircle className="h-4 w-4 text-red-500" />,
  NEEDS_FIXES: <Clock className="h-4 w-4 text-amber-500" />,
}
const decisionVariant: Record<string, 'success'|'danger'|'warning'> = {
  APPROVE: 'success', BLOCK: 'danger', NEEDS_FIXES: 'warning',
}

export default function ProjectsClient({ projects, latestScans }: { projects: Project[]; latestScans: Record<string, Scan> }) {
  const [search, setSearch] = useState('')
  const filtered = projects.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-muted-foreground mt-1">
            {projects.length} project{projects.length !== 1 ? 's' : ''}
            {search && ` — ${filtered.length} matching "${search}"`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {projects.length > 3 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search…" className="pl-9 h-9 w-52" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          )}
          <Link href="/dashboard/projects/new">
            <Button><Plus className="mr-2 h-4 w-4" />New Project</Button>
          </Link>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed p-16 text-center">
          <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">No projects yet</h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">Create your first project to start scanning releases.</p>
          <Link href="/dashboard/projects/new"><Button><Plus className="mr-2 h-4 w-4" />Create first project</Button></Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <Search className="h-8 w-8 mx-auto text-muted-foreground mb-3 opacity-40" />
          <p className="text-sm text-muted-foreground">No projects match "{search}"</p>
          <button onClick={() => setSearch('')} className="text-sm text-primary hover:underline mt-2">Clear search</button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(project => {
            const latest = latestScans[project.id]
            return (
              <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
                <Card className="hover:border-primary/50 transition-all hover:shadow-sm cursor-pointer h-full">
                  <CardContent className="pt-5 pb-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="rounded-lg bg-primary/10 p-2"><Shield className="h-4 w-4 text-primary" /></div>
                        <div>
                          <h3 className="font-semibold text-sm">{project.name}</h3>
                          <p className="text-xs text-muted-foreground">{project.defaultEnv}</p>
                        </div>
                      </div>
                      {latest && <Badge variant={decisionVariant[latest.decision]} className="text-xs">{latest.decision.replace('_',' ')}</Badge>}
                    </div>
                    {project.description && <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{project.description}</p>}
                    {latest ? (
                      <div className="mt-3 pt-3 border-t space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            {decisionIcon[latest.decision]}<span>Last scan</span>
                          </div>
                          <span className="text-muted-foreground">{formatDistanceToNow(new Date(latest.createdAt), { addSuffix: true })}</span>
                        </div>
                        {latest.blockingCount > 0 && <p className="text-xs text-red-600 dark:text-red-400">{latest.blockingCount} blocking violation{latest.blockingCount !== 1 ? 's' : ''}</p>}
                      </div>
                    ) : (
                      <div className="mt-3 pt-3 border-t"><p className="text-xs text-muted-foreground">No scans yet</p></div>
                    )}
                    {project.repoUrl && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
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
