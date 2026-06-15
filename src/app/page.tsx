import Link from 'next/link'
import { Shield, Check, Zap, Lock, GitBranch, Terminal, ArrowRight, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const policies = [
  { id: 'DEV001', label: 'No .env commits',           group: 'DEV' },
  { id: 'SC002',  label: 'No critical CVEs',           group: 'SC'  },
  { id: 'CS002',  label: 'No AI prompts in public',    group: 'CS'  },
  { id: 'CI001',  label: 'Actions pinned to SHA',      group: 'CI'  },
  { id: 'CON002', label: 'No root in containers',      group: 'CON' },
  { id: 'RT002',  label: 'No prompt in LLM response',  group: 'RT'  },
]

const features = [
  { icon: Shield,    title: '30 security policies',   desc: 'DEV, SC, CS, BLD, CI, CON, RT — enforced in TypeScript, Rego, and YAML.' },
  { icon: Zap,       title: '21 typed scanners',      desc: 'Secrets, CVEs, AI prompts, CI/CD workflows, containers, and LLM output.' },
  { icon: Terminal,  title: 'CLI + MCP server',       desc: 'Run from terminal or chat with your codebase in Claude Desktop.' },
  { icon: GitBranch, title: 'CI/CD native',           desc: 'GitHub Actions workflow, SARIF output for Code Scanning, exit codes.' },
  { icon: Lock,      title: 'Exception management',   desc: 'Documented, time-limited, approved exceptions with automatic expiry.' },
  { icon: Star,      title: 'AI Release Guardian',    desc: 'Claude-powered agent that explains findings and suggests remediations.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b bg-background/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="rounded-lg bg-primary p-1.5">
              <Shield className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm">Hardening Kit</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="https://github.com/amir-chaari22/hardening_kit" target="_blank">
              <Button variant="ghost" size="sm">GitHub</Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="sm">Get started free</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <Badge variant="secondary" className="mb-6 text-xs px-3 py-1">
          ✦ 30 policies · 21 scanners · MCP server · AI agent
        </Badge>
        <h1 className="text-5xl font-bold tracking-tight mb-6 max-w-3xl mx-auto leading-tight">
          Secure every release,{' '}
          <span className="text-primary">automatically</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          AI-native release hardening for SaaS teams. 30 security policies enforced before every deploy —
          secrets, CVEs, AI prompts, containers, and CI/CD hygiene.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/auth/signup">
            <Button size="lg" className="h-12 px-8">
              Start free <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="https://github.com/amir-chaari22/hardening_kit" target="_blank">
            <Button variant="outline" size="lg" className="h-12 px-8">
              View on GitHub
            </Button>
          </Link>
        </div>
        {/* Terminal preview */}
        <div className="mt-14 max-w-2xl mx-auto rounded-xl border bg-zinc-950 text-left overflow-hidden shadow-2xl">
          <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-zinc-800">
            <div className="h-3 w-3 rounded-full bg-red-500/70" />
            <div className="h-3 w-3 rounded-full bg-amber-500/70" />
            <div className="h-3 w-3 rounded-full bg-emerald-500/70" />
            <span className="ml-2 text-xs text-zinc-500 font-mono">terminal</span>
          </div>
          <div className="p-5 font-mono text-sm space-y-1.5">
            <p><span className="text-zinc-500">$</span> <span className="text-emerald-400">harden</span> <span className="text-white">scan --env production --project myapp</span></p>
            <p className="text-zinc-400">[1/21] Scanning git staged files</p>
            <p className="text-zinc-400">[2/21] Running gitleaks on staged files</p>
            <p className="text-zinc-400">...</p>
            <p className="text-zinc-400">[21/21] Scanning LLM response for leaks</p>
            <p className="text-emerald-400 mt-2">✓ No secrets in staged files</p>
            <p className="text-red-400">✗ SC001: No lockfile found</p>
            <p className="text-amber-400">⚠ SC006: Wildcard versions: lodash, axios</p>
            <p className="mt-3 text-white">Decision: <span className="text-red-400 font-bold">❌ BLOCK</span></p>
          </div>
        </div>
      </section>

      {/* Policy pills */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <p className="text-center text-sm text-muted-foreground mb-6">Sample policies enforced on every scan</p>
        <div className="flex flex-wrap justify-center gap-3">
          {policies.map(({ id, label, group }) => (
            <div key={id} className="flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm">
              <code className="text-xs text-muted-foreground font-mono">{id}</code>
              <span>{label}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 rounded-full border border-dashed px-4 py-1.5 text-sm text-muted-foreground">
            +24 more policies
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Everything your release needs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-xl border p-6 hover:border-primary/40 transition-colors">
              <div className="rounded-lg bg-primary/10 p-2.5 w-fit mb-4">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-6 py-16 border-t">
        <h2 className="text-3xl font-bold text-center mb-12">Get protected in 3 steps</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: '01', title: 'Install', desc: 'npm install hardening-kit then harden init in your repo.' },
            { step: '02', title: 'Scan', desc: 'harden scan runs 21 security checks in under 500ms.' },
            { step: '03', title: 'Gate', desc: 'CI exits 1 on BLOCK. No more accidental secret deploys.' },
          ].map(({ step, title, desc }) => (
            <div key={step} className="text-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 text-primary font-bold text-lg flex items-center justify-center mx-auto mb-4">
                {step}
              </div>
              <h3 className="font-semibold mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-16 text-center border-t">
        <h2 className="text-3xl font-bold mb-4">Ready to harden your releases?</h2>
        <p className="text-muted-foreground mb-8">Free for 3 projects. No credit card required.</p>
        <Link href="/auth/signup">
          <Button size="lg" className="h-12 px-10">
            Get started free <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm text-muted-foreground flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span>Hardening Kit v1.0.0</span>
          </div>
          <div className="flex gap-6">
            <Link href="https://github.com/amir-chaari22/hardening_kit" className="hover:text-foreground" target="_blank">GitHub</Link>
            <Link href="/auth/login" className="hover:text-foreground">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
