import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
const inter = Inter({ subsets: ['latin'] })
export const metadata: Metadata = {
  title: 'Hardening Kit — Release Security Platform',
  description: 'AI-native SaaS release hardening. 30 security policies, 21 scanners, automated CI/CD gates.',
  keywords: ['security', 'devsecops', 'release hardening', 'SAST', 'SBOM', 'supply chain'],
  authors: [{ name: 'Hardening Kit' }],
  openGraph: {
    type: 'website',
    title: 'Hardening Kit — Release Security Platform',
    description: '30 security policies enforced before every deploy. Secrets, CVEs, AI prompts, containers.',
    siteName: 'Hardening Kit',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hardening Kit',
    description: 'AI-native SaaS release hardening — 30 policies, 21 scanners.',
  },
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" suppressHydrationWarning><body className={inter.className}>{children}</body></html>
}
