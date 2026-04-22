'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Transaction } from '@/types'
import { formatRupiah, formatDate } from '@/lib/utils'

export default function TransactionsPage() {
  const supabase = createClient()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Transaction | null>(null)
  const [filter, setFilter] = useState({ date: '', method: '' })

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    let query = supabase
      .from('transactions')
      .select('*, transaction_items(*)')
      .order('created_at', { ascending: false })

    if (filter.date) {
      query = query.gte('created_at', filter.date).lt('created_at', filter.date + 'T23:59:59')
    }
    if (filter.method) {
      query = query.eq('payment_method', filter.method)
    }

    const { data } = await query
    setTransactions(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [filter])

  const totalRevenue = transactions.filter(t => t.status === 'completed').reduce((s, t) => s + t.total, 0)

  const handleCancel = async (id: string) => {
    if (!confirm('Batalkan transaksi ini?')) return
    await supabase.from('transactions').update({ status: 'cancelled' }).eq('id', id)
    await fetchData()
  }

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'var(--font-syne)', fontWeight: '800', fontSize: '28px', margin: '0 0 4px', letterSpacing: '-0.5px' }}>
          Transaksi
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
          {transactions.length} transaksi ditemukan · Total: <span style={{ color: 'var(--accent)', fontWeight: '700' }}>{formatRupiah(totalRevenue)}</span>
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input
          type="date"
          value={filter.date}
          onChange={e => setFilter({ ...filter, date: e.target.value })}
          style={{ width: 'auto' }}
        />
        <select
          value={filter.method}
          onChange={e => setFilter({ ...filter, method: e.target.value })}
          style={{ width: 'auto' }}
        >
          <option value="">Semua Metode</option>
          <option value="cash">Tunai</option>
          <option value="qris">QRIS</option>
        </select>
        {(filter.date || filter.method) && (
          <button
            onClick={() => setFilter({ date: '', method: '' })}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--text-secondary)',
              fontSize: '13px',
              fontWeight: '600',
              fontFamily: 'var(--font-syne)',
            }}
          >
            Reset Filter ×
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-hover)' }}>
                {['Kode Transaksi', 'Kasir', 'Item', 'Metode', 'Total', 'Status', 'Waktu', 'Aksi'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left',
                    padding: '12px 16px',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    fontFamily: 'var(--font-syne)',
                    whiteSpace: 'nowrap',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Memuat...</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Tidak ada transaksi</td></tr>
              ) : transactions.map(trx => (
                <tr
                  key={trx.id}
                  style={{
                    borderTop: '1px solid var(--border)',
                    opacity: trx.status === 'cancelled' ? 0.5 : 1,
                  }}
                >
                  <td style={{ padding: '12px 16px', fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                    {trx.transaction_code}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px' }}>{trx.cashier_name || '-'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {trx.transaction_items?.length || 0} item
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className={`badge ${trx.payment_method === 'cash' ? 'badge-blue' : 'badge-green'}`}>
                      {trx.payment_method === 'cash' ? '💵 Tunai' : '📱 QRIS'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--font-syne)', fontWeight: '700', color: 'var(--accent)' }}>
                    {formatRupiah(trx.total)}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className={`badge ${trx.status === 'completed' ? 'badge-green' : 'badge-red'}`}>
                      {trx.status === 'completed' ? 'Selesai' : 'Dibatalkan'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {formatDate(trx.created_at)}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => setSelected(trx)}
                        style={{
                          background: 'var(--bg-hover)',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          padding: '5px 10px',
                          color: 'var(--text-secondary)',
                          fontSize: '12px',
                          fontWeight: '600',
                          fontFamily: 'var(--font-syne)',
                        }}
                      >
                        Detail
                      </button>
                      {trx.status === 'completed' && (
                        <button
                          onClick={() => handleCancel(trx.id)}
                          style={{
                            background: 'rgba(239,68,68,0.1)',
                            border: '1px solid rgba(239,68,68,0.2)',
                            borderRadius: '6px',
                            padding: '5px 10px',
                            color: '#ef4444',
                            fontSize: '12px',
                            fontWeight: '600',
                            fontFamily: 'var(--font-syne)',
                          }}
                        >
                          Batal
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 200,
          padding: '20px',
        }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '480px', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'var(--font-syne)', fontWeight: '700', fontSize: '18px', margin: 0 }}>
                Detail Transaksi
              </h2>
              <button
                onClick={() => setSelected(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '24px', cursor: 'pointer', lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '16px', padding: '14px', background: 'var(--bg-hover)', borderRadius: '10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                <div>
                  <p style={{ margin: '0 0 2px', color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'var(--font-syne)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Kode</p>
                  <p style={{ margin: 0, fontFamily: 'monospace', fontSize: '12px' }}>{selected.transaction_code}</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 2px', color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'var(--font-syne)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Kasir</p>
                  <p style={{ margin: 0 }}>{selected.cashier_name || '-'}</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 2px', color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'var(--font-syne)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Metode</p>
                  <p style={{ margin: 0 }}>{selected.payment_method === 'cash' ? '💵 Tunai' : '📱 QRIS'}</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 2px', color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'var(--font-syne)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Waktu</p>
                  <p style={{ margin: 0, fontSize: '12px' }}>{formatDate(selected.created_at)}</p>
                </div>
              </div>
            </div>

            <h3 style={{ fontFamily: 'var(--font-syne)', fontWeight: '600', fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
              Item Dibeli
            </h3>

            {selected.transaction_items?.map(item => (
              <div key={item.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '10px 0',
                borderBottom: '1px solid var(--border)',
                fontSize: '13px',
              }}>
                <div>
                  <p style={{ margin: '0 0 2px', fontWeight: '600', fontFamily: 'var(--font-syne)' }}>{item.product_name}</p>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '12px' }}>
                    {formatRupiah(item.product_price)} × {item.quantity}
                  </p>
                </div>
                <span style={{ fontWeight: '700', color: 'var(--accent)', fontFamily: 'var(--font-syne)' }}>
                  {formatRupiah(item.subtotal)}
                </span>
              </div>
            ))}

            <div style={{ marginTop: '16px', padding: '14px', background: 'var(--bg-hover)', borderRadius: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
                <span>{formatRupiah(selected.subtotal)}</span>
              </div>
              {selected.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                  <span style={{ color: '#ef4444' }}>Diskon</span>
                  <span style={{ color: '#ef4444' }}>-{formatRupiah(selected.discount)}</span>
                </div>
              )}
              {selected.payment_method === 'cash' && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Diterima</span>
                    <span>{formatRupiah(selected.cash_received || 0)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Kembalian</span>
                    <span style={{ color: 'var(--accent)' }}>{formatRupiah(selected.change_amount || 0)}</span>
                  </div>
                </>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid var(--border)', fontFamily: 'var(--font-syne)', fontWeight: '800' }}>
                <span>TOTAL</span>
                <span style={{ color: 'var(--accent)', fontSize: '18px' }}>{formatRupiah(selected.total)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
