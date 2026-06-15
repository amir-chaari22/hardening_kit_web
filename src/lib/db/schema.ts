import { pgTable, uuid, text, timestamp, integer, boolean, jsonb, index, pgEnum } from 'drizzle-orm/pg-core'
export const scanDecisionEnum = pgEnum('scan_decision', ['APPROVE','BLOCK','NEEDS_FIXES'])
export const scanEnvEnum      = pgEnum('scan_env',      ['development','staging','production'])
export const planEnum         = pgEnum('plan',          ['free','pro','enterprise'])
export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(), name: text('name').notNull(),
  slug: text('slug').notNull().unique(), plan: planEnum('plan').notNull().default('free'),
  createdAt: timestamp('created_at').notNull().defaultNow(), updatedAt: timestamp('updated_at').notNull().defaultNow()
})
export const members = pgTable('members', {
  id: uuid('id').primaryKey().defaultRandom(), orgId: uuid('org_id').notNull().references(() => organizations.id, {onDelete:'cascade'}),
  userId: uuid('user_id').notNull(), role: text('role').notNull().default('member'),
  email: text('email').notNull(), displayName: text('display_name'), avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').notNull().defaultNow()
}, t => ({ idx: index('members_org_user_idx').on(t.orgId, t.userId) }))
export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(), orgId: uuid('org_id').notNull().references(() => organizations.id, {onDelete:'cascade'}),
  name: text('name').notNull(), slug: text('slug').notNull(), description: text('description'),
  repoUrl: text('repo_url'), defaultEnv: scanEnvEnum('default_env').notNull().default('staging'),
  createdById: uuid('created_by_id').notNull(), createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}, t => ({ idx: index('projects_org_slug_idx').on(t.orgId, t.slug) }))
export const scans = pgTable('scans', {
  id: uuid('id').primaryKey().defaultRandom(), projectId: uuid('project_id').notNull().references(() => projects.id, {onDelete:'cascade'}),
  orgId: uuid('org_id').notNull(), triggeredById: uuid('triggered_by_id'),
  environment: scanEnvEnum('environment').notNull().default('staging'), decision: scanDecisionEnum('decision').notNull(),
  blockingCount: integer('blocking_count').notNull().default(0), warningCount: integer('warning_count').notNull().default(0),
  durationMs: integer('duration_ms'), scannerVersion: text('scanner_version').notNull().default('1.0.0'),
  violations: jsonb('violations').notNull().default([]), warnings: jsonb('warnings').notNull().default([]),
  checksSummary: jsonb('checks_summary').notNull().default({}), toolsUsed: jsonb('tools_used').notNull().default([]),
  commitSha: text('commit_sha'), branch: text('branch'), createdAt: timestamp('created_at').notNull().defaultNow()
}, t => ({ pIdx: index('scans_project_idx').on(t.projectId), cIdx: index('scans_created_idx').on(t.createdAt) }))
export const exceptions = pgTable('exceptions', {
  id: uuid('id').primaryKey().defaultRandom(), projectId: uuid('project_id').notNull().references(() => projects.id, {onDelete:'cascade'}),
  orgId: uuid('org_id').notNull(), policyId: text('policy_id').notNull(), reason: text('reason').notNull(),
  expiresAt: timestamp('expires_at'), approvedBy: text('approved_by'),
  createdById: uuid('created_by_id').notNull(), active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow()
})
export const alerts = pgTable('alerts', {
  id: uuid('id').primaryKey().defaultRandom(), orgId: uuid('org_id').notNull(),
  projectId: uuid('project_id').references(() => projects.id, {onDelete:'cascade'}),
  scanId: uuid('scan_id').references(() => scans.id, {onDelete:'set null'}),
  type: text('type').notNull(), title: text('title').notNull(), body: text('body'),
  read: boolean('read').notNull().default(false), createdAt: timestamp('created_at').notNull().defaultNow()
}, t => ({ idx: index('alerts_org_idx').on(t.orgId, t.read) }))
export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(), orgId: uuid('org_id').notNull().references(() => organizations.id, {onDelete:'cascade'}),
  name: text('name').notNull(), keyHash: text('key_hash').notNull().unique(), prefix: text('prefix').notNull(),
  lastUsedAt: timestamp('last_used_at'), expiresAt: timestamp('expires_at'),
  createdById: uuid('created_by_id').notNull(), createdAt: timestamp('created_at').notNull().defaultNow()
})
export type Organization = typeof organizations.$inferSelect
export type Member       = typeof members.$inferSelect
export type Project      = typeof projects.$inferSelect
export type Scan         = typeof scans.$inferSelect
export type Exception    = typeof exceptions.$inferSelect
export type Alert        = typeof alerts.$inferSelect

// ─── Relations (for Drizzle .with() queries) ──────────────────────────────────
import { relations } from 'drizzle-orm'

export const organizationsRelations = relations(organizations, ({ many }) => ({
  members:  many(members),
  projects: many(projects),
  alerts:   many(alerts),
  apiKeys:  many(apiKeys),
}))

export const membersRelations = relations(members, ({ one }) => ({
  org: one(organizations, { fields: [members.orgId], references: [organizations.id] }),
}))

export const projectsRelations = relations(projects, ({ one, many }) => ({
  org:        one(organizations, { fields: [projects.orgId], references: [organizations.id] }),
  scans:      many(scans),
  exceptions: many(exceptions),
  alerts:     many(alerts),
}))

export const scansRelations = relations(scans, ({ one }) => ({
  project: one(projects, { fields: [scans.projectId], references: [projects.id] }),
}))

export const exceptionsRelations = relations(exceptions, ({ one }) => ({
  project: one(projects, { fields: [exceptions.projectId], references: [projects.id] }),
}))

export const alertsRelations = relations(alerts, ({ one }) => ({
  project: one(projects, { fields: [alerts.projectId], references: [projects.id] }),
  scan:    one(scans,    { fields: [alerts.scanId],    references: [scans.id] }),
}))

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  org: one(organizations, { fields: [apiKeys.orgId], references: [organizations.id] }),
}))
