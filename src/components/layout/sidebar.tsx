'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { Shield, LayoutDashboard, FolderOpen, Bell, Settings, LogOut, Plus, Menu, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { User } from '@supabase/supabase-js'

const nav = [
  { href: '/dashboard',          label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/projects', label: 'Projects', icon: FolderOpen },
  { href: '/dashboard/alerts',   label: 'Alerts',   icon: Bell },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

function SidebarContent({ user, onNavigate }: { user: User; onNavigate?: () => void }) {
  const pathname    = usePathname()
  const router      = useRouter()
  const supabase    = createClient()
  const [alertCount, setAlertCount] = useState(0)

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setAlertCount(d.alertCount ?? 0))
      .catch(() => {})
  }, [pathname])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const displayName = (user.user_metadata?.display_name as string | undefined) || user.email?.split('@')[0] || 'User'
  const initials    = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b">
        <Link href="/dashboard" className="flex items-center gap-2.5" onClick={onNavigate}>
          <div className="rounded-lg bg-primary p-1.5">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-sm">Hardening Kit</span>
        </Link>
      </div>

      {/* Quick action */}
      <div className="px-3 pt-4">
        <Link href="/dashboard/projects/new"
          className="flex items-center gap-2 w-full rounded-md bg-primary/10 hover:bg-primary/15 text-primary px-3 py-2 text-sm font-medium transition-colors"
          onClick={onNavigate}>
          <Plus className="h-4 w-4" />New Project
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link key={href} href={href} onClick={onNavigate}
              className={cn('flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground')}>
              <Icon className="h-4 w-4" />{label}
              {label === 'Alerts' && alertCount > 0 && (
                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {alertCount > 9 ? '9+' : alertCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="border-t p-3">
        <div className="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-accent group">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{displayName}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
          <button onClick={handleSignOut} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-all" title="Sign out">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Sidebar({ user }: { user: User }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 border-r bg-card flex-col shrink-0">
        <SidebarContent user={user} />
      </aside>

      {/* Mobile hamburger */}
      <div className="md:hidden">
        <button
          onClick={() => setOpen(true)}
          className="fixed top-4 left-4 z-40 rounded-md border bg-background p-2 shadow-sm"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Mobile overlay */}
        {open && (
          <>
            <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setOpen(false)} />
            <aside className="fixed inset-y-0 left-0 z-50 w-72 bg-card border-r flex flex-col shadow-xl">
              <button
                onClick={() => setOpen(false)}
                className="absolute top-4 right-4 rounded-md p-1 text-muted-foreground hover:text-foreground"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
              <SidebarContent user={user} onNavigate={() => setOpen(false)} />
            </aside>
          </>
        )}
      </div>
    </>
  )
}
