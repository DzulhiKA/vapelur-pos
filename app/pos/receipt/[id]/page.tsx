'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Transaction, StoreSettings } from '@/types'
import { formatRupiah, formatDate } from '@/lib/utils'

export default function ReceiptPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()

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
    <>
      {/* ========== PRINT STYLES ========== */}
      <style>{`
        @media print {
          /* Sembunyikan semua elemen */
          body * { visibility: hidden !important; }

          /* Tampilkan hanya area struk */
          #receipt-print-area,
          #receipt-print-area * {
            visibility: visible !important;
          }

          /* Posisikan struk di sudut kiri atas */
          #receipt-print-area {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 80mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            color: black !important;
            font-family: monospace !important;
          }

          /* Page settings untuk kertas thermal / A4 */
          @page {
            size: auto;
            margin: 8mm 4mm;
          }
        }
      `}</style>

      {/* ========== SCREEN VIEW ========== */}
      <div
        className="no-print"
        style={{
          minHeight: 'calc(100vh - 60px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          background: 'var(--bg-primary)',
        }}
      >
        {/* Success Banner */}
        <div className="animate-fade-in" style={{ textAlign: 'center', marginBottom: '32px' }}>
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

        {/* Receipt Card (screen preview) */}
        <ReceiptContent transaction={transaction} settings={settings} />

        {/* Action Buttons */}
        <div className="no-print" style={{ display: 'flex', gap: '12px', marginTop: '24px', flexWrap: 'wrap', justifyContent: 'center' }}>
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
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            🖨️ Print Struk
          </button>
          <button
            onClick={handlePrint}
            style={{
              padding: '12px 24px',
              background: 'rgba(34,197,94,0.1)',
              border: '1px solid rgba(34,197,94,0.4)',
              borderRadius: '10px',
              color: 'var(--accent)',
              fontWeight: '600',
              fontFamily: 'var(--font-syne)',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            📄 Download PDF Struk
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
              cursor: 'pointer',
            }}
          >
            🛒 Transaksi Baru →
          </button>
        </div>
      </div>

      {/* ========== PRINT-ONLY AREA (always in DOM, hidden on screen) ========== */}
      <div
        id="receipt-print-area"
        style={{
          display: 'none', // Hidden on screen, visible only during print via CSS
          background: 'white',
          color: '#111',
          fontFamily: 'monospace',
          padding: '8mm 4mm',
          width: '72mm',
        }}
      >
        <ReceiptContent transaction={transaction} settings={settings} printMode />
      </div>
    </>
  )
}

// ---- Shared Receipt Content Component ----

function ReceiptContent({
  transaction,
  settings,
  printMode = false,
}: {
  transaction: Transaction
  settings: StoreSettings | null
  printMode?: boolean
}) {
  const containerStyle: React.CSSProperties = printMode
    ? {
        background: 'white',
        color: '#111',
        fontFamily: 'monospace',
        width: '100%',
      }
    : {
        background: 'white',
        color: '#111',
        borderRadius: '16px',
        padding: '32px',
        width: '100%',
        maxWidth: '380px',
        fontFamily: 'monospace',
        boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
      }

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '16px',
        paddingBottom: '16px',
        borderBottom: '2px dashed #ccc',
      }}>
        <h2 style={{
          fontFamily: printMode ? 'monospace' : 'var(--font-syne)',
          fontWeight: '800',
          fontSize: printMode ? '16px' : '22px',
          margin: '0 0 4px',
          color: '#111',
        }}>
          💨 {settings?.store_name || 'Vape Lur'}
        </h2>
        {settings?.address && (
          <p style={{ margin: '2px 0', fontSize: '11px', color: '#555' }}>{settings.address}</p>
        )}
        {settings?.phone && (
          <p style={{ margin: '2px 0', fontSize: '11px', color: '#555' }}>{settings.phone}</p>
        )}
        <p style={{ margin: '8px 0 0', fontSize: '10px', color: '#888' }}>
          {formatDate(transaction.created_at)}
        </p>
        <p style={{ margin: '2px 0', fontSize: '10px', color: '#888', fontFamily: 'monospace' }}>
          {transaction.transaction_code}
        </p>
      </div>

      {/* Items */}
      <div style={{ marginBottom: '14px' }}>
        {transaction.transaction_items?.map(item => (
          <div key={item.id} style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px',
            fontSize: '12px',
            alignItems: 'flex-start',
            gap: '8px',
          }}>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: '600', lineHeight: 1.3, fontSize: printMode ? '11px' : '12px' }}>
                {item.product_name}
              </p>
              <p style={{ margin: 0, color: '#666', fontSize: '10px' }}>
                {formatRupiah(item.product_price)} × {item.quantity}
              </p>
            </div>
            <span style={{ fontWeight: '700', whiteSpace: 'nowrap', fontSize: printMode ? '11px' : '12px' }}>
              {formatRupiah(item.subtotal)}
            </span>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div style={{
        borderTop: '2px dashed #ccc',
        paddingTop: '12px',
        marginBottom: '12px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '12px' }}>
          <span>Subtotal</span>
          <span>{formatRupiah(transaction.subtotal)}</span>
        </div>
        {transaction.discount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '12px', color: '#e53e3e' }}>
            <span>Diskon</span>
            <span>-{formatRupiah(transaction.discount)}</span>
          </div>
        )}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontWeight: '800',
          fontSize: printMode ? '14px' : '17px',
          marginTop: '6px',
          paddingTop: '6px',
          borderTop: '1px solid #ddd',
        }}>
          <span>TOTAL</span>
          <span>{formatRupiah(transaction.total)}</span>
        </div>
      </div>

      {/* Payment Info */}
      <div style={{
        background: '#f5f5f5',
        borderRadius: '6px',
        padding: '10px',
        marginBottom: '14px',
        fontSize: '11px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
          <span style={{ color: '#666' }}>Metode Bayar</span>
          <span style={{ fontWeight: '600', textTransform: 'uppercase' }}>
            {transaction.payment_method === 'cash' ? 'Tunai' : 'QRIS'}
          </span>
        </div>
        {transaction.payment_method === 'cash' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span style={{ color: '#666' }}>Diterima</span>
              <span>{formatRupiah(transaction.cash_received || 0)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#666' }}>Kembalian</span>
              <span style={{ fontWeight: '700', color: '#16a34a' }}>
                {formatRupiah(transaction.change_amount || 0)}
              </span>
            </div>
          </>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px', borderTop: '1px dashed #ddd', paddingTop: '4px' }}>
          <span style={{ color: '#666' }}>Kasir</span>
          <span>{transaction.cashier_name || '-'}</span>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        textAlign: 'center',
        paddingTop: '12px',
        borderTop: '2px dashed #ccc',
      }}>
        <p style={{ fontSize: '11px', color: '#888', margin: 0, lineHeight: 1.5 }}>
          {settings?.receipt_footer || 'Terima kasih sudah berbelanja di Vape Lur! 💨'}
        </p>
      </div>
    </div>
  )
}
