'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/forms'

export default function ProfileForm({ displayName }: { displayName: string }) {
  const [name, setName]     = useState(displayName)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved]     = useState(false)
  const supabase = createClient()
  const router   = useRouter()

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await supabase.auth.updateUser({ data: { display_name: name } })
    setSaved(true)
    setLoading(false)
    router.refresh()
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="display-name">Display name</Label>
        <Input
          id="display-name" value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Your full name"
        />
      </div>
      <Button type="submit" size="sm" disabled={loading}>
        {loading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> :
         saved   ? <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-400" /> : null}
        {saved ? 'Saved!' : 'Save changes'}
      </Button>
    </form>
  )
}
