'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Transaction, StoreSettings } from '@/types'
import { formatRupiah, formatDate } from '@/lib/utils'

export default function ReceiptPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  const printRef = useRef<HTMLDivElement>(null)

  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [settings, setSettings] = useState<StoreSettings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const id = params.id as string
    Promise.all([
      supabase.from('transactions').select('*, transaction_items(*)').eq('id', id).single(),
      supabase.from('store_settings').select('*').single(),
    ]).then(([{ data: trx }, { data: sts }]) => {
      setTransaction(trx)
      setSettings(sts)
      setLoading(false)
    })
  }, [])

  const handlePrint = () => {
    window.print()
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <p style={{ color: 'var(--text-muted)' }}>Memuat struk...</p>
    </div>
  )

  if (!transaction) return null

  return (
    <div style={{
      minHeight: 'calc(100vh - 60px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      background: 'var(--bg-primary)',
    }}>
      {/* Success Banner */}
      <div className="animate-fade-in" style={{
        textAlign: 'center',
        marginBottom: '32px',
      }}>
        <div style={{
          width: '72px',
          height: '72px',
          background: 'rgba(34,197,94,0.15)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          border: '2px solid var(--accent)',
        }}>
          <span style={{ fontSize: '32px' }}>✅</span>
        </div>
        <h1 style={{
          fontFamily: 'var(--font-syne)',
          fontWeight: '800',
          fontSize: '28px',
          color: 'var(--accent)',
          margin: '0 0 6px',
        }}>
          Transaksi Berhasil!
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          {transaction.transaction_code}
        </p>
      </div>

      {/* Receipt Card */}
      <div ref={printRef} style={{
        background: 'white',
        color: '#111',
        borderRadius: '16px',
        padding: '32px',
        width: '100%',
        maxWidth: '380px',
        fontFamily: 'monospace',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px', paddingBottom: '20px', borderBottom: '2px dashed #ddd' }}>
          <h2 style={{
            fontFamily: 'var(--font-syne)',
            fontWeight: '800',
            fontSize: '24px',
            margin: '0 0 4px',
            color: '#111',
          }}>
            💨 {settings?.store_name || 'Vape Lur'}
          </h2>
          {settings?.address && <p style={{ margin: '2px 0', fontSize: '12px', color: '#666' }}>{settings.address}</p>}
          {settings?.phone && <p style={{ margin: '2px 0', fontSize: '12px', color: '#666' }}>{settings.phone}</p>}
          <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#999' }}>
            {formatDate(transaction.created_at)}
          </p>
        </div>

        {/* Items */}
        <div style={{ marginBottom: '16px' }}>
          {transaction.transaction_items?.map(item => (
            <div key={item.id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px',
              fontSize: '13px',
            }}>
              <div>
                <p style={{ margin: 0, fontWeight: '600' }}>{item.product_name}</p>
                <p style={{ margin: 0, color: '#666', fontSize: '11px' }}>
                  {formatRupiah(item.product_price)} × {item.quantity}
                </p>
              </div>
              <span style={{ fontWeight: '700' }}>{formatRupiah(item.subtotal)}</span>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div style={{ borderTop: '2px dashed #ddd', paddingTop: '16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
            <span>Subtotal</span>
            <span>{formatRupiah(transaction.subtotal)}</span>
          </div>
          {transaction.discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px', color: '#ef4444' }}>
              <span>Diskon</span>
              <span>-{formatRupiah(transaction.discount)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '18px' }}>
            <span>TOTAL</span>
            <span>{formatRupiah(transaction.total)}</span>
          </div>
        </div>

        {/* Payment Info */}
        <div style={{
          background: '#f5f5f5',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '16px',
          fontSize: '13px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ color: '#666' }}>Metode Bayar</span>
            <span style={{ fontWeight: '600', textTransform: 'uppercase' }}>
              {transaction.payment_method === 'cash' ? '💵 Tunai' : '📱 QRIS'}
            </span>
          </div>
          {transaction.payment_method === 'cash' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: '#666' }}>Diterima</span>
                <span>{formatRupiah(transaction.cash_received || 0)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666' }}>Kembalian</span>
                <span style={{ fontWeight: '700', color: '#22c55e' }}>{formatRupiah(transaction.change_amount || 0)}</span>
              </div>
            </>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
            <span style={{ color: '#666' }}>Kasir</span>
            <span>{transaction.cashier_name || '-'}</span>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', paddingTop: '16px', borderTop: '2px dashed #ddd' }}>
          <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>
            {settings?.receipt_footer || 'Terima kasih sudah berbelanja di Vape Lur! 💨'}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
        <button
          onClick={handlePrint}
          style={{
            padding: '12px 24px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            color: 'var(--text-primary)',
            fontWeight: '600',
            fontFamily: 'var(--font-syne)',
            fontSize: '14px',
          }}
        >
          🖨️ Print Struk
        </button>
        <button
          onClick={() => router.push('/pos')}
          style={{
            padding: '12px 24px',
            background: 'var(--accent)',
            border: 'none',
            borderRadius: '10px',
            color: '#000',
            fontWeight: '700',
            fontFamily: 'var(--font-syne)',
            fontSize: '14px',
          }}
        >
          🛒 Transaksi Baru →
        </button>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          nav { display: none !important; }
        }
      `}</style>
    </div>
  )
}
