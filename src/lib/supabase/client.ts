import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

/**
 * Browser (client-side) Supabase client.
 * Safe to import in 'use client' components.
 * Never expose service_role key here — only NEXT_PUBLIC_ vars.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
