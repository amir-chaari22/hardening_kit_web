/**
 * Typed API client for browser components
 * For server components, use db directly
 */

const BASE = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_APP_URL ?? '')

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    credentials: 'include',
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error((err as { error?: string }).error ?? 'Request failed')
  }
  return res.json() as Promise<T>
}

type ProjectBody = { name: string; description?: string; repoUrl?: string; defaultEnv?: string }
type ScanBody    = Record<string, unknown>
type ExcBody     = { policyId: string; reason: string; approvedBy?: string; expiresAt?: string }

export const api = {
  projects: {
    list:   () =>                 apiFetch<{ projects: unknown[] }>('/projects'),
    get:    (id: string) =>       apiFetch<{ project: unknown }>(`/projects/${id}`),
    create: (body: ProjectBody) => apiFetch<{ project: unknown }>('/projects', { method: 'POST', body: JSON.stringify(body) }),
  },
  scans: {
    list:   (projectId: string) =>             apiFetch<{ scans: unknown[] }>(`/projects/${projectId}/scans`),
    get:    (scanId: string) =>                apiFetch<{ scan: unknown }>(`/scans/${scanId}`),
    submit: (projectId: string, body: ScanBody) =>
      apiFetch<{ scan: unknown }>(`/projects/${projectId}/scans`, { method: 'POST', body: JSON.stringify(body) }),
  },
  exceptions: {
    list:   (projectId: string) =>            apiFetch<{ exceptions: unknown[] }>(`/projects/${projectId}/exceptions`),
    add:    (projectId: string, body: ExcBody) =>
      apiFetch<{ exception: unknown }>(`/projects/${projectId}/exceptions`, { method: 'POST', body: JSON.stringify(body) }),
    remove: (projectId: string, id: string) =>
      apiFetch<{ success: boolean }>(`/projects/${projectId}/exceptions/${id}`, { method: 'DELETE' }),
  },
  alerts: {
    list:        () =>           apiFetch<{ alerts: unknown[] }>('/alerts'),
    markRead:    (id: string) => apiFetch<{ success: boolean }>(`/alerts/${id}/read`, { method: 'PATCH' }),
    markAllRead: () =>           apiFetch<{ success: boolean }>('/alerts/read-all', { method: 'POST' }),
  },
  dashboard: {
    stats: () => apiFetch<{ projectCount: number; scanCount: number; blockRate: number; alertCount: number }>('/dashboard/stats'),
  },
}
