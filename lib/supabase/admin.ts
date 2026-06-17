import { createClient } from '@supabase/supabase-js'

// Client ini menggunakan Service Role Key — bypass RLS sepenuhnya
// HANYA boleh dipakai di server-side (API Routes / Server Components)
// JANGAN diekspos ke client/browser
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
