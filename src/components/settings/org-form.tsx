'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/forms'

export default function OrgForm({ orgId, orgName }: { orgId: string; orgName: string }) {
  const [name, setName]         = useState(orgName)
  const [loading, setLoading]   = useState(false)
  const [saved, setSaved]       = useState(false)
  const [error, setError]       = useState('')
  const router = useRouter()

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true); setError('')
    const res = await fetch('/api/organizations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    })
    if (!res.ok) {
      const d = await res.json().catch(() => ({})) as { error?: string }
      setError(d.error ?? 'Failed to update')
    } else {
      setSaved(true)
      router.refresh()
      setTimeout(() => setSaved(false), 2000)
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSave} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="org-name">Organization name</Label>
        <Input
          id="org-name" value={name}
          onChange={e => setName(e.target.value)}
          placeholder="My Company"
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" size="sm" disabled={loading || name === orgName}>
        {loading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> :
         saved   ? <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-400" /> : null}
        {saved ? 'Saved!' : 'Save'}
      </Button>
    </form>
  )
}
