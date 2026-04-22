import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PosNavbar from '@/components/pos/PosNavbar'

export default async function PosLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <PosNavbar user={user} profile={profile} />
      <main style={{ paddingTop: '60px' }}>
        {children}
      </main>
    </div>
  )
}
