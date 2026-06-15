'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Shield, LayoutDashboard, FolderOpen, Bell, Settings, LogOut, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { User } from '@supabase/supabase-js'

const nav = [
  { href: '/dashboard',          label: 'Overview',  icon: LayoutDashboard },
  { href: '/dashboard/projects', label: 'Projects',  icon: FolderOpen },
  { href: '/dashboard/alerts',   label: 'Alerts',    icon: Bell },
  { href: '/dashboard/settings', label: 'Settings',  icon: Settings },
]

export default function Sidebar({ user }: { user: User }) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'User'
  const initials    = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <aside className="w-64 border-r bg-card flex flex-col shrink-0">
      <div className="p-4 border-b">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="rounded-lg bg-primary p-1.5">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-sm">Hardening Kit</span>
        </Link>
      </div>
      <div className="px-3 pt-4">
        <Link href="/dashboard/projects/new" className="flex items-center gap-2 w-full rounded-md bg-primary/10 hover:bg-primary/15 text-primary px-3 py-2 text-sm font-medium transition-colors">
          <Plus className="h-4 w-4" />New Project
        </Link>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link key={href} href={href} className={cn('flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground')}>
              <Icon className="h-4 w-4" />{label}
            </Link>
          )
        })}
      </nav>
      <div className="border-t p-3">
        <div className="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-accent group">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">{initials}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{displayName}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
          <button onClick={handleSignOut} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-all" title="Sign out">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
