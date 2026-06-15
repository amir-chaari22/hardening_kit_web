/**
 * Runtime environment variable validation.
 * Import this in server-only code to catch missing env vars early.
 */

function requireEnv(name: string): string {
  const val = process.env[name]
  if (!val) throw new Error(`Missing required environment variable: ${name}`)
  return val
}

export const env = {
  supabaseUrl:       requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey:   requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  databaseUrl:       process.env.DATABASE_URL ?? '',  // optional at build time
  appUrl:            process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  serviceRoleKey:    process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
} as const
