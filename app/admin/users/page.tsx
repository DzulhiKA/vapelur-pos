'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase/client'
import { UserProfile } from '@/types'
import { formatDate } from '@/lib/utils'

export default function UsersPage() {
  const supabase = createClient()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', full_name: '', role: 'cashier' as 'admin' | 'cashier' })
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetchData()
  }, [])

  // Handle body scroll when modal is open
  useEffect(() => {
    if (!mounted) return
    if (showModal) {
      document.documentElement.style.overflow = 'hidden'
      document.body.style.overflow = 'hidden'
    } else {
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''
    }
    return () => {
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''
    }
  }, [showModal, mounted])

  const fetchData = async () => {
    setLoading(true)
    const { data } = await supabase.from('user_profiles').select('*').order('created_at', { ascending: false })
    setUsers(data || [])
    setLoading(false)
  }

  const handleCreate = async () => {
    if (!form.email || !form.password || !form.full_name) {
      setError('Semua field wajib diisi')
      return
    }
    setSaving(true)
    setError('')

    const { data, error: signUpError } = await supabase.auth.admin.createUser({
      email: form.email,
      password: form.password,
      user_metadata: { full_name: form.full_name, role: form.role },
      email_confirm: true,
    })

    if (signUpError) {
      // Fallback: use signUp if admin.createUser fails (needs service key)
      const { error: err } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { full_name: form.full_name, role: form.role },
        },
      })
      if (err) {
        setError(err.message)
        setSaving(false)
        return
      }
    }

    await fetchData()
    setShowModal(false)
    setSaving(false)
    setForm({ email: '', password: '', full_name: '', role: 'cashier' })
  }

  const toggleRole = async (user: UserProfile) => {
    const newRole = user.role === 'admin' ? 'cashier' : 'admin'
    await supabase.from('user_profiles').update({ role: newRole }).eq('id', user.id)
    await fetchData()
  }

  const toggleActive = async (user: UserProfile) => {
    await supabase.from('user_profiles').update({ is_active: !user.is_active }).eq('id', user.id)
    await fetchData()
  }

  const modalContent = (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 99999,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        alignItems: 'flex-start', // Align to top to allow natural scrolling
        justifyContent: 'center',
      }}
    >
      <div
        className="animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '460px',
          margin: '40px auto', // Margin top/bottom for spacing
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: '16px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
          padding: 0,
          overflow: 'hidden',
        }}
      >
        {/* Header Modal */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--bg-card)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', background: 'var(--accent-glow)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
              👤
            </div>
            <div>
              <h2 style={{ fontFamily: 'var(--font-syne)', fontWeight: '700', fontSize: '17px', margin: 0 }}>
                Tambah Pengguna Baru
              </h2>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
                Isi detail akun di bawah ini
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowModal(false)}
            style={{ width: '32px', height: '32px', background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >×</button>
        </div>

        {/* Body Modal */}
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gap: '18px' }}>
            <div>
              <FieldLabel required>Nama Lengkap</FieldLabel>
              <input
                value={form.full_name}
                onChange={e => setForm({ ...form, full_name: e.target.value })}
                placeholder="Nama lengkap kasir"
              />
            </div>
            <div>
              <FieldLabel required>Email</FieldLabel>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="email@vapelur.com"
              />
            </div>
            <div>
              <FieldLabel required>Password</FieldLabel>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="Minimal 6 karakter"
              />
            </div>
            <div>
              <FieldLabel>Role</FieldLabel>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as any })}>
                <option value="cashier">🧑‍💼 Kasir</option>
                <option value="admin">👑 Admin</option>
              </select>
            </div>
          </div>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '8px',
              padding: '10px 14px',
              marginTop: '18px',
              color: '#ef4444',
              fontSize: '13px',
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '28px' }}>
            <button
              onClick={() => setShowModal(false)}
              style={{
                flex: 1,
                padding: '12px',
                background: 'var(--bg-hover)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                color: 'var(--text-secondary)',
                fontWeight: '600',
                fontFamily: 'var(--font-syne)',
                cursor: 'pointer'
              }}
            >
              Batal
            </button>
            <button
              onClick={handleCreate}
              disabled={saving}
              style={{
                flex: 2,
                padding: '12px',
                background: saving ? 'var(--bg-hover)' : 'var(--accent)',
                border: 'none',
                borderRadius: '10px',
                color: saving ? 'var(--text-muted)' : '#000',
                fontWeight: '700',
                fontFamily: 'var(--font-syne)',
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? '⏳ Membuat Akun...' : '✅ Buat Akun'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-syne)', fontWeight: '800', fontSize: '28px', margin: '0 0 4px', letterSpacing: '-0.5px' }}>
            Pengguna
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
            {users.length} akun terdaftar
          </p>
        </div>
        <button
          onClick={() => { setShowModal(true); setError('') }}
          style={{
            padding: '10px 20px',
            background: 'var(--accent)',
            color: '#000',
            border: 'none',
            borderRadius: '10px',
            fontWeight: '700',
            fontFamily: 'var(--font-syne)',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          + Tambah Pengguna
        </button>
      </div>

      {/* Info Box */}
      <div style={{
        background: 'rgba(59,130,246,0.08)',
        border: '1px solid rgba(59,130,246,0.2)',
        borderRadius: '10px',
        padding: '12px 16px',
        marginBottom: '20px',
        fontSize: '13px',
        color: '#93c5fd',
      }}>
        💡 <strong>Admin</strong> bisa akses semua fitur · <strong>Kasir</strong> hanya bisa akses halaman POS
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-hover)' }}>
                {['Nama', 'Role', 'Status', 'Bergabung', 'Aksi'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left',
                    padding: '12px 16px',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    fontFamily: 'var(--font-syne)',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Memuat...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Belum ada pengguna</td></tr>
              ) : users.map(user => (
                <tr key={user.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        background: user.role === 'admin' ? 'rgba(34,197,94,0.15)' : 'var(--bg-hover)',
                        border: `1px solid ${user.role === 'admin' ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                      }}>
                        {user.role === 'admin' ? '👑' : '🧑‍💼'}
                      </div>
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', fontFamily: 'var(--font-syne)' }}>
                        {user.full_name || 'Tanpa Nama'}
                      </p>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className={`badge ${user.role === 'admin' ? 'badge-green' : 'badge-blue'}`}>
                      {user.role === 'admin' ? '👑 Admin' : '🧑‍💼 Kasir'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className={`badge ${user.is_active ? 'badge-green' : 'badge-gray'}`}>
                      {user.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    {formatDate(user.created_at)}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => toggleRole(user)}
                        style={{
                          background: 'var(--bg-hover)',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          padding: '5px 10px',
                          color: 'var(--text-secondary)',
                          fontSize: '12px',
                          fontWeight: '600',
                          fontFamily: 'var(--font-syne)',
                          cursor: 'pointer'
                        }}
                      >
                        {user.role === 'admin' ? '→ Kasir' : '→ Admin'}
                      </button>
                      <button
                        onClick={() => toggleActive(user)}
                        style={{
                          background: user.is_active ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
                          border: `1px solid ${user.is_active ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}`,
                          borderRadius: '6px',
                          padding: '5px 10px',
                          color: user.is_active ? '#ef4444' : '#22c55e',
                          fontSize: '12px',
                          fontWeight: '600',
                          fontFamily: 'var(--font-syne)',
                          cursor: 'pointer'
                        }}
                      >
                        {user.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Render modal via Portal to avoid overflow issues */}
      {mounted && showModal && createPortal(modalContent, document.body)}
    </div>
  )
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px', fontFamily: 'var(--font-syne)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
      {children}{required && <span style={{ color: 'var(--accent)', marginLeft: '3px' }}>*</span>}
    </label>
  )
}
