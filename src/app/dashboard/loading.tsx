import { Shield } from 'lucide-react'
export default function DashboardLoading() {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Shield className="h-8 w-8 animate-pulse" />
        <p className="text-sm">Loading...</p>
      </div>
    </div>
  )
}
