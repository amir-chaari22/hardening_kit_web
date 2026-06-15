'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Shield, Github, Mail, Lock, User, Loader2, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/forms'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const supabase = createClient()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true); setError('')
    const { error } = await supabase.auth.signUp({
      email, password, options: { data: { display_name: name }, emailRedirectTo: `${window.location.origin}/auth/callback` }
    })
    if (error) { setError(error.message); setLoading(false); return }
    setDone(true)
  }

  async function handleGitHub() {
    setLoading(true)
    await supabase.auth.signInWithOAuth({ provider: 'github', options: { redirectTo: `${window.location.origin}/auth/callback` } })
  }

  if (done) return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-8 pb-8 space-y-3">
          <div className="rounded-full bg-emerald-100 dark:bg-emerald-900/20 p-4 w-16 h-16 mx-auto flex items-center justify-center">
            <Shield className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-semibold">Check your email</h2>
          <p className="text-muted-foreground">We sent a confirmation link to <strong>{email}</strong>.</p>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-primary p-2"><Shield className="h-6 w-6 text-primary-foreground" /></div>
            <span className="text-2xl font-semibold tracking-tight">Hardening Kit</span>
          </div>
          <p className="text-sm text-muted-foreground">Free for your first 3 projects</p>
        </div>
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Create account</CardTitle>
            <CardDescription>Start securing your releases today</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full" onClick={handleGitHub} disabled={loading}>
              <Github className="mr-2 h-4 w-4" />Continue with GitHub
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">or</span></div>
            </div>
            <form onSubmit={handleSignup} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="name">Full name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="name" placeholder="Jane Smith" className="pl-9" value={name} onChange={e => setName(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Work email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="you@company.com" className="pl-9" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="password" type="password" placeholder="8+ characters" className="pl-9" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
              </div>
              {error && <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}Create account
              </Button>
            </form>
          </CardContent>
          <CardFooter>
            <p className="text-center text-sm text-muted-foreground w-full">
              Already have an account? <Link href="/auth/login" className="text-primary hover:underline font-medium">Sign in</Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
