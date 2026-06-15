import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const c = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return c.getAll() },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
          try { cookiesToSet.forEach(({ name, value, options }) => c.set(name, value, options)) } catch {}
        },
      },
    }
  )
}

export async function getUser() {
  const s = await createClient()
  const { data: { user } } = await s.auth.getUser()
  return user
}

export async function requireUser() {
  const user = await getUser()
  if (!user) throw new Error('Unauthorized')
  return user
}
