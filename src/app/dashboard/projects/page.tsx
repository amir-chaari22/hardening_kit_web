import { getUser } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { projects, scans, members } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import ProjectsClient from '@/components/projects/projects-client'

export default async function ProjectsPage() {
  const user = await getUser()
  if (!user) return null

  const member = await db.query.members.findFirst({ where: eq(members.userId, user.id) })
  const projectList = member ? await db.query.projects.findMany({
    where: eq(projects.orgId, member.orgId),
    orderBy: [desc(projects.updatedAt)],
  }) : []

  const latestScans: Record<string, any> = {}
  for (const p of projectList) {
    const s = await db.query.scans.findFirst({
      where: eq(scans.projectId, p.id),
      orderBy: [desc(scans.createdAt)],
    })
    if (s) latestScans[p.id] = s
  }

  return <ProjectsClient projects={projectList} latestScans={latestScans} />
}
