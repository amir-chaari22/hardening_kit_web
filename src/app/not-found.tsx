import Link from 'next/link'
import { Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="rounded-full bg-muted p-6 w-20 h-20 mx-auto flex items-center justify-center">
          <Shield className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="text-4xl font-bold">404</h1>
        <p className="text-muted-foreground">Page not found.</p>
        <Link href="/dashboard"><Button>Go to dashboard</Button></Link>
      </div>
    </div>
  )
}
