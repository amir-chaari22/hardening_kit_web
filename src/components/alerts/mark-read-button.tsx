'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CheckCheck, Loader2 } from 'lucide-react'

export default function MarkReadButton({ orgId }: { orgId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function markAllRead() {
    setLoading(true)
    await fetch('/api/alerts/read-all', { method: 'POST' })
    router.refresh()
    setLoading(false)
  }

  return (
    <Button variant="outline" size="sm" onClick={markAllRead} disabled={loading}>
      {loading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="mr-1.5 h-3.5 w-3.5" />}
      Mark all read
    </Button>
  )
}
