'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
  { href: '/admin/products', icon: '📦', label: 'Produk' },
  { href: '/admin/transactions', icon: '🧾', label: 'Transaksi' },
  { href: '/admin/users', icon: '👥', label: 'Pengguna' },
  { href: '/admin/settings', icon: '⚙️', label: 'Pengaturan' },
]

export default function AdminSidebar({ user, profile }: { user: any; profile: any }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '240px',
      height: '100vh',
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 50,
    }}>
      {/* Logo */}
      <div style={{
        padding: '24px 20px',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
          }}>
            💨
          </div>
          <div>
            <p style={{ margin: 0, fontFamily: 'var(--font-syne)', fontWeight: '800', fontSize: '16px', letterSpacing: '-0.5px' }}>
              Vape Lur
            </p>
            <p style={{ margin: 0, fontSize: '10px', color: 'var(--accent)', fontWeight: '600', fontFamily: 'var(--font-syne)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Admin Panel
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
        <Link href="/pos" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 12px',
          borderRadius: '8px',
          textDecoration: 'none',
          marginBottom: '4px',
          color: 'var(--text-secondary)',
          fontSize: '13px',
          fontWeight: '600',
          fontFamily: 'var(--font-syne)',
          background: 'transparent',
          border: '1px dashed var(--border)',
        }}>
          <span>🛒</span> Buka Kasir
        </Link>

        <div style={{ height: '12px' }} />

        {navItems.map(item => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '8px',
                textDecoration: 'none',
                marginBottom: '2px',
                color: isActive ? '#000' : 'var(--text-secondary)',
                fontSize: '13px',
                fontWeight: '600',
                fontFamily: 'var(--font-syne)',
                background: isActive ? 'var(--accent)' : 'transparent',
                transition: 'all 0.2s',
              }}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid var(--border)',
      }}>
        <div style={{ marginBottom: '10px' }}>
          <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
            {profile?.full_name || user?.email}
          </p>
          <p style={{ margin: 0, fontSize: '11px', color: 'var(--accent)', fontWeight: '600', fontFamily: 'var(--font-syne)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Admin
          </p>
        </div>
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '8px',
            background: 'var(--bg-hover)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: 'var(--text-secondary)',
            fontSize: '12px',
            fontWeight: '600',
            fontFamily: 'var(--font-syne)',
          }}
        >
          Keluar
        </button>
      </div>
    </aside>
  )
}
