'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Shield } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input, Label, Textarea } from '@/components/ui/forms'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function NewProjectPage() {
  const [name, setName]           = useState('')
  const [description, setDesc]    = useState('')
  const [repoUrl, setRepoUrl]     = useState('')
  const [defaultEnv, setEnv]      = useState('staging')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const router = useRouter()

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Project name is required'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description, repoUrl, defaultEnv }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create project')
      }
      const { project } = await res.json()
      router.push(`/dashboard/projects/${project.id}`)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link href="/dashboard/projects" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 w-fit">
        <ArrowLeft className="h-4 w-4" />
        Back to projects
      </Link>

      <div className="mb-8 flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-3">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">New project</h1>
          <p className="text-muted-foreground text-sm">Set up a project to start scanning releases.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Project details</CardTitle>
          <CardDescription>Basic information about what you're securing.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="name">Project name <span className="text-destructive">*</span></Label>
              <Input
                id="name" placeholder="e.g. my-saas-api" value={name}
                onChange={e => setName(e.target.value)} required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="desc">Description <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Textarea
                id="desc" placeholder="What does this project do?" rows={3}
                value={description} onChange={e => setDesc(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="repo">Repository URL <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input
                id="repo" type="url" placeholder="https://github.com/org/repo"
                value={repoUrl} onChange={e => setRepoUrl(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="env">Default scan environment</Label>
              <select
                id="env"
                value={defaultEnv}
                onChange={e => setEnv(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="development">Development (relaxed rules)</option>
                <option value="staging">Staging (standard rules)</option>
                <option value="production">Production (strictest — requires SBOM, no source maps)</option>
              </select>
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create project
              </Button>
              <Link href="/dashboard/projects">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Quick start guide */}
      <Card className="mt-6 border-dashed">
        <CardContent className="pt-5 pb-5">
          <h3 className="text-sm font-semibold mb-3">After creating your project</h3>
          <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
            <li>Install the hardening kit in your repo: <code className="policy-id">npm install hardening-kit</code></li>
            <li>Run your first scan: <code className="policy-id">harden scan --env staging --project {'<name>'}</code></li>
            <li>Configure the CI workflow: <code className="policy-id">harden init</code></li>
            <li>Results appear here automatically via the API</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
