'use client'
import { useState } from 'react'
import { Plus, Key, Eye, EyeOff, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, Label, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/forms'
import { Badge } from '@/components/ui/badge'

export default function ApiKeySection({ orgId }: { orgId: string }) {
  const [open, setOpen]         = useState(false)
  const [keyName, setKeyName]   = useState('')
  const [newKey, setNewKey]     = useState('')
  const [loading, setLoading]   = useState(false)
  const [copied, setCopied]     = useState(false)
  const [showKey, setShowKey]   = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/api-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: keyName }),
    })
    if (res.ok) {
      const { key } = await res.json()
      setNewKey(key)
    }
    setLoading(false)
  }

  async function copyKey() {
    await navigator.clipboard.writeText(newKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      <div className="text-center py-6 border border-dashed rounded-lg text-muted-foreground">
        <Key className="h-8 w-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm">No API keys yet</p>
        <p className="text-xs mt-1">Create a key to authenticate the hardening kit CLI.</p>
      </div>

      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="mr-1.5 h-3.5 w-3.5" /> Create API key
      </Button>

      <Dialog open={open} onOpenChange={o => { setOpen(o); if (!o) { setNewKey(''); setKeyName(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create API key</DialogTitle>
            <DialogDescription>
              This key allows the hardening kit CLI to post scan results to your dashboard.
            </DialogDescription>
          </DialogHeader>

          {!newKey ? (
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="key-name">Key name</Label>
                <Input
                  id="key-name" placeholder="e.g. CI/CD pipeline"
                  value={keyName} onChange={e => setKeyName(e.target.value)} required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={loading || !keyName.trim()}>Create key</Button>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted p-3">
                <p className="text-xs text-muted-foreground mb-2 font-medium">Your new API key — copy it now, it won't be shown again.</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs flex-1 break-all font-mono">
                    {showKey ? newKey : '•'.repeat(40)}
                  </code>
                  <button onClick={() => setShowKey(!showKey)} className="text-muted-foreground hover:text-foreground">
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <button onClick={copyKey} className="text-muted-foreground hover:text-foreground">
                    {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Badge variant="warning">Store this key securely. You won't be able to see it again.</Badge>
              <Button onClick={() => { setOpen(false); setNewKey(''); setKeyName(''); }}>Done</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
