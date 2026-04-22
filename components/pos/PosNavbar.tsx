'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface PosNavbarProps {
  user: any
  profile: any
}

export default function PosNavbar({ user, profile }: PosNavbarProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '60px',
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '32px',
          height: '32px',
          background: 'linear-gradient(135deg, #22c55e, #16a34a)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
        }}>
          💨
        </div>
        <span style={{
          fontFamily: 'var(--font-syne)',
          fontWeight: '800',
          fontSize: '18px',
          letterSpacing: '-0.5px',
        }}>
          Vape Lur
        </span>
        <span style={{
          background: 'var(--accent-glow)',
          color: 'var(--accent)',
          padding: '2px 8px',
          borderRadius: '6px',
          fontSize: '11px',
          fontWeight: '600',
          fontFamily: 'var(--font-syne)',
          border: '1px solid rgba(34,197,94,0.2)',
        }}>
          POS
        </span>
      </div>

      {/* Nav Links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <Link href="/pos" style={{
          color: 'var(--text-secondary)',
          textDecoration: 'none',
          padding: '6px 14px',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: '600',
          fontFamily: 'var(--font-syne)',
          transition: 'all 0.2s',
        }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          🛒 Kasir
        </Link>
        {profile?.role === 'admin' && (
          <Link href="/admin/dashboard" style={{
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            padding: '6px 14px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '600',
            fontFamily: 'var(--font-syne)',
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            ⚙️ Admin
          </Link>
        )}
      </div>

      {/* User */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
            {profile?.full_name || user?.email}
          </p>
          <p style={{ margin: 0, fontSize: '11px', color: 'var(--accent)', fontWeight: '600', fontFamily: 'var(--font-syne)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {profile?.role || 'cashier'}
          </p>
        </div>
        <button
          onClick={handleLogout}
          style={{
            background: 'var(--bg-hover)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: '600',
          }}
        >
          Keluar
        </button>
      </div>
    </nav>
  )
}
