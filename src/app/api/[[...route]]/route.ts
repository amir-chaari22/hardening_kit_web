import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { scans, projects, exceptions, members, alerts, apiKeys } from '@/lib/db/schema'
import { eq, desc, and, count, gte } from 'drizzle-orm'
import { createHash, randomBytes } from 'crypto'
import type { User } from '@supabase/supabase-js'

export const runtime = 'nodejs'

// Typed Hono app with user variable
type Variables = { user: User }
const app = new Hono<{ Variables: Variables }>().basePath('/api')

app.use('*', cors({ origin: process.env.NEXT_PUBLIC_APP_URL || '*', credentials: true }))

// Auth middleware
app.use('*', async (c, next) => {
  const path = c.req.path
  if (path === '/api/health') return next()
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new HTTPException(401, { message: 'Unauthorized' })
  c.set('user', user)
  return next()
})

app.get('/health', (c) => c.json({ status: 'ok', version: '1.0.0' }))

// ── Projects ──────────────────────────────────────────────────────────────────
app.get('/projects', async (c) => {
  const user = c.get('user')
  const member = await db.query.members.findFirst({ where: eq(members.userId, user.id) })
  if (!member) return c.json({ projects: [] })
  const rows = await db.query.projects.findMany({ where: eq(projects.orgId, member.orgId), orderBy: [desc(projects.updatedAt)] })
  return c.json({ projects: rows })
})

app.post('/projects', async (c) => {
  const user = c.get('user')
  const body = await c.req.json<{ name: string; description?: string; repoUrl?: string; defaultEnv?: 'development' | 'staging' | 'production' }>()
  const member = await db.query.members.findFirst({ where: eq(members.userId, user.id) })
  if (!member) throw new HTTPException(403, { message: 'No organization found' })
  const slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const [project] = await db.insert(projects).values({
    orgId: member.orgId, name: body.name, slug,
    description: body.description, repoUrl: body.repoUrl,
    defaultEnv: body.defaultEnv ?? 'staging', createdById: user.id,
  }).returning()
  return c.json({ project }, 201)
})

app.get('/projects/:id', async (c) => {
  const project = await db.query.projects.findFirst({ where: eq(projects.id, c.req.param('id')) })
  if (!project) throw new HTTPException(404, { message: 'Project not found' })
  return c.json({ project })
})

// ── Scans ─────────────────────────────────────────────────────────────────────
app.get('/projects/:id/scans', async (c) => {
  const rows = await db.query.scans.findMany({ where: eq(scans.projectId, c.req.param('id')), orderBy: [desc(scans.createdAt)], limit: 50 })
  return c.json({ scans: rows })
})

app.post('/projects/:id/scans', async (c) => {
  const user = c.get('user')
  const body = await c.req.json<{ decision: 'APPROVE'|'BLOCK'|'NEEDS_FIXES'; environment?: 'development'|'staging'|'production'; blockingCount?: number; warningCount?: number; durationMs?: number; violations?: unknown[]; warnings?: unknown[]; checksSummary?: Record<string,unknown>; toolsUsed?: string[]; commitSha?: string; branch?: string }>()
  const project = await db.query.projects.findFirst({ where: eq(projects.id, c.req.param('id')) })
  if (!project) throw new HTTPException(404, { message: 'Project not found' })
  const [scan] = await db.insert(scans).values({
    projectId: project.id, orgId: project.orgId, triggeredById: user.id,
    environment: body.environment ?? project.defaultEnv, decision: body.decision,
    blockingCount: body.blockingCount ?? 0, warningCount: body.warningCount ?? 0,
    durationMs: body.durationMs, violations: body.violations ?? [],
    warnings: body.warnings ?? [], checksSummary: body.checksSummary ?? {},
    toolsUsed: body.toolsUsed ?? [], commitSha: body.commitSha, branch: body.branch,
  }).returning()
  if (scan.decision === 'BLOCK') {
    await db.insert(alerts).values({
      orgId: project.orgId, projectId: project.id, scanId: scan.id,
      type: 'block', title: `Release blocked: ${project.name}`,
      body: `${scan.blockingCount} violation${scan.blockingCount !== 1 ? 's' : ''} found`,
    })
  }
  return c.json({ scan }, 201)
})

app.get('/scans/:id', async (c) => {
  const scan = await db.query.scans.findFirst({ where: eq(scans.id, c.req.param('id')) })
  if (!scan) throw new HTTPException(404, { message: 'Scan not found' })
  return c.json({ scan })
})

// ── Exceptions ────────────────────────────────────────────────────────────────
app.get('/projects/:id/exceptions', async (c) => {
  const rows = await db.query.exceptions.findMany({
    where: and(eq(exceptions.projectId, c.req.param('id')), eq(exceptions.active, true)),
    orderBy: [desc(exceptions.createdAt)],
  })
  return c.json({ exceptions: rows })
})

app.post('/projects/:id/exceptions', async (c) => {
  const user = c.get('user')
  const body = await c.req.json<{ policyId: string; reason: string; approvedBy?: string; expiresAt?: string }>()
  const project = await db.query.projects.findFirst({ where: eq(projects.id, c.req.param('id')) })
  if (!project) throw new HTTPException(404, { message: 'Project not found' })
  const [exc] = await db.insert(exceptions).values({
    projectId: project.id, orgId: project.orgId, policyId: body.policyId,
    reason: body.reason, approvedBy: body.approvedBy,
    expiresAt: body.expiresAt ? new Date(body.expiresAt) : null, createdById: user.id,
  }).returning()
  return c.json({ exception: exc }, 201)
})

app.delete('/projects/:projectId/exceptions/:id', async (c) => {
  await db.update(exceptions).set({ active: false }).where(eq(exceptions.id, c.req.param('id')))
  return c.json({ success: true })
})

// ── Alerts ────────────────────────────────────────────────────────────────────
app.get('/alerts', async (c) => {
  const user = c.get('user')
  const member = await db.query.members.findFirst({ where: eq(members.userId, user.id) })
  if (!member) return c.json({ alerts: [] })
  const rows = await db.query.alerts.findMany({ where: eq(alerts.orgId, member.orgId), orderBy: [desc(alerts.createdAt)], limit: 20 })
  return c.json({ alerts: rows })
})

app.patch('/alerts/:id/read', async (c) => {
  await db.update(alerts).set({ read: true }).where(eq(alerts.id, c.req.param('id')))
  return c.json({ success: true })
})

app.post('/alerts/read-all', async (c) => {
  const user = c.get('user')
  const member = await db.query.members.findFirst({ where: eq(members.userId, user.id) })
  if (member) await db.update(alerts).set({ read: true }).where(eq(alerts.orgId, member.orgId))
  return c.json({ success: true })
})

// ── API Keys ──────────────────────────────────────────────────────────────────
app.post('/api-keys', async (c) => {
  const user = c.get('user')
  const body = await c.req.json<{ name: string }>()
  const member = await db.query.members.findFirst({ where: eq(members.userId, user.id) })
  if (!member) throw new HTTPException(403)
  const rawKey  = `hk_${randomBytes(32).toString('hex')}`
  const keyHash = createHash('sha256').update(rawKey).digest('hex')
  await db.insert(apiKeys).values({ orgId: member.orgId, name: body.name, keyHash, prefix: rawKey.slice(0, 8), createdById: user.id })
  return c.json({ key: rawKey }, 201)
})

// ── Dashboard stats ───────────────────────────────────────────────────────────
app.get('/dashboard/stats', async (c) => {
  const user = c.get('user')
  const member = await db.query.members.findFirst({ where: eq(members.userId, user.id) })
  if (!member) return c.json({ projectCount: 0, scanCount: 0, blockRate: 0, alertCount: 0 })
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const [pCount] = await db.select({ count: count() }).from(projects).where(eq(projects.orgId, member.orgId))
  const [sCount] = await db.select({ count: count() }).from(scans).where(and(eq(scans.orgId, member.orgId), gte(scans.createdAt, sevenDaysAgo)))
  const [bCount] = await db.select({ count: count() }).from(scans).where(and(eq(scans.orgId, member.orgId), eq(scans.decision, 'BLOCK'), gte(scans.createdAt, sevenDaysAgo)))
  const [aCount] = await db.select({ count: count() }).from(alerts).where(and(eq(alerts.orgId, member.orgId), eq(alerts.read, false)))
  const total = Number(sCount.count)
  return c.json({ projectCount: Number(pCount.count), scanCount: total, blockRate: total > 0 ? Math.round((Number(bCount.count) / total) * 100) : 0, alertCount: Number(aCount.count) })
})

app.onError((err, c) => {
  if (err instanceof HTTPException) return c.json({ error: err.message }, err.status)
  console.error(err)
  return c.json({ error: 'Internal server error' }, 500)
})

export const GET    = handle(app)
export const POST   = handle(app)
export const PATCH  = handle(app)
export const DELETE = handle(app)
