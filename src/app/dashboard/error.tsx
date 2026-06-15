'use client'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="text-center space-y-4 max-w-sm">
        <div className="rounded-full bg-destructive/10 p-4 w-16 h-16 mx-auto flex items-center justify-center">
          <AlertTriangle className="h-7 w-7 text-destructive" />
        </div>
        <h2 className="text-lg font-semibold">Something went wrong</h2>
        <p className="text-sm text-muted-foreground">{error.message || 'An unexpected error occurred.'}</p>
        <Button onClick={reset} variant="outline">Try again</Button>
      </div>
    </div>
  )
}
