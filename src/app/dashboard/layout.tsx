import { redirect } from 'next/navigation'
import { getUser } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/sidebar'
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser()
  if (!user) redirect('/auth/login')
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar user={user} />
      <main className="flex-1 overflow-y-auto md:pt-0 pt-16">{children}</main>
    </div>
  )
}
