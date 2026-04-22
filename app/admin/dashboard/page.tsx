'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatRupiah, formatDateShort } from '@/lib/utils'
import { Transaction } from '@/types'

export default function DashboardPage() {
  const supabase = createClient()
  const [stats, setStats] = useState({
    todayRevenue: 0,
    todayTrx: 0,
    monthRevenue: 0,
    monthTrx: 0,
    lowStockCount: 0,
    totalProducts: 0,
  })
  const [recentTrx, setRecentTrx] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const today = new Date().toISOString().slice(0, 10)
    const monthStart = new Date().toISOString().slice(0, 7) + '-01'

    const [
      { data: todayTrx },
      { data: monthTrx },
      { data: products },
      { data: recent },
    ] = await Promise.all([
      supabase.from('transactions').select('total').gte('created_at', today).eq('status', 'completed'),
      supabase.from('transactions').select('total').gte('created_at', monthStart).eq('status', 'completed'),
      supabase.from('products').select('id, stock, min_stock').eq('is_active', true),
      supabase.from('transactions').select('*, transaction_items(*)').eq('status', 'completed').order('created_at', { ascending: false }).limit(8),
    ])

    setStats({
      todayRevenue: todayTrx?.reduce((s, t) => s + t.total, 0) || 0,
      todayTrx: todayTrx?.length || 0,
      monthRevenue: monthTrx?.reduce((s, t) => s + t.total, 0) || 0,
      monthTrx: monthTrx?.length || 0,
      lowStockCount: products?.filter(p => p.stock <= p.min_stock).length || 0,
      totalProducts: products?.length || 0,
    })
    setRecentTrx(recent || [])
    setLoading(false)
  }

  const statCards = [
    { label: 'Omset Hari Ini', value: formatRupiah(stats.todayRevenue), sub: `${stats.todayTrx} transaksi`, icon: '💰', color: '#22c55e' },
    { label: 'Omset Bulan Ini', value: formatRupiah(stats.monthRevenue), sub: `${stats.monthTrx} transaksi`, icon: '📈', color: '#3b82f6' },
    { label: 'Total Produk', value: stats.totalProducts, sub: 'Produk aktif', icon: '📦', color: '#f59e0b' },
    { label: 'Stok Menipis', value: stats.lowStockCount, sub: 'Perlu restock', icon: '⚠️', color: '#ef4444' },
  ]

  return (
    <div className="animate-fade-in">
      <h1 style={{ fontFamily: 'var(--font-syne)', fontWeight: '800', fontSize: '28px', marginBottom: '6px', letterSpacing: '-0.5px' }}>
        Dashboard
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '14px' }}>
        Selamat datang di panel admin Vape Lur 👋
      </p>

      {/* Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '32px',
      }}>
        {statCards.map((card, i) => (
          <div key={i} className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <span style={{ fontSize: '24px' }}>{card.icon}</span>
              <span style={{ fontSize: '11px', color: card.color, fontWeight: '600', fontFamily: 'var(--font-syne)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {card.sub}
              </span>
            </div>
            <p style={{
              fontFamily: 'var(--font-syne)',
              fontWeight: '800',
              fontSize: '22px',
              margin: '0 0 4px',
              color: card.color,
            }}>
              {loading ? '...' : card.value}
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>
              {card.label}
            </p>
          </div>
        ))}
      </div>

      {/* Recent Transactions */}
      <div className="card" style={{ padding: '20px' }}>
        <h2 style={{
          fontFamily: 'var(--font-syne)',
          fontWeight: '700',
          fontSize: '16px',
          marginBottom: '20px',
          paddingBottom: '12px',
          borderBottom: '1px solid var(--border)',
        }}>
          🧾 Transaksi Terbaru
        </h2>

        {loading ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>Memuat...</p>
        ) : recentTrx.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>Belum ada transaksi</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Kode', 'Kasir', 'Metode', 'Total', 'Waktu'].map(h => (
                    <th key={h} style={{
                      textAlign: 'left',
                      padding: '8px 12px',
                      fontSize: '11px',
                      fontWeight: '600',
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      fontFamily: 'var(--font-syne)',
                      borderBottom: '1px solid var(--border)',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentTrx.map(trx => (
                  <tr key={trx.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                      {trx.transaction_code}
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: '13px' }}>{trx.cashier_name || '-'}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span className={`badge ${trx.payment_method === 'cash' ? 'badge-blue' : 'badge-green'}`}>
                        {trx.payment_method === 'cash' ? '💵 Tunai' : '📱 QRIS'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', fontFamily: 'var(--font-syne)', fontWeight: '700', color: 'var(--accent)' }}>
                      {formatRupiah(trx.total)}
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                      {formatDateShort(trx.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
