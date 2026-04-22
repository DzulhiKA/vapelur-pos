'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CartItem, StoreSettings } from '@/types'
import { formatRupiah, generateTransactionCode } from '@/lib/utils'

type PaymentMethod = 'cash' | 'qris'

export default function CheckoutPage() {
  const router = useRouter()
  const supabase = createClient()

  const [cartData, setCartData] = useState<{
    cart: CartItem[]
    discount: number
    subtotal: number
    total: number
  } | null>(null)

  const [settings, setSettings] = useState<StoreSettings | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [cashReceived, setCashReceived] = useState('')
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem('pos_cart')
    if (!stored) { router.push('/pos'); return }
    setCartData(JSON.parse(stored))

    supabase.from('store_settings').select('*').single().then(({ data }) => {
      setSettings(data)
    })
  }, [])

  const cashReceivedNum = parseInt(cashReceived.replace(/\D/g, '')) || 0
  const change = cashReceivedNum - (cartData?.total || 0)

  const handleConfirm = async () => {
    if (!cartData) return
    if (paymentMethod === 'cash' && cashReceivedNum < cartData.total) return

    setProcessing(true)

    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('id', user?.id)
      .single()

    const transactionCode = generateTransactionCode()

    // Insert transaction
    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert({
        transaction_code: transactionCode,
        cashier_id: user?.id,
        cashier_name: profile?.full_name || user?.email,
        payment_method: paymentMethod,
        subtotal: cartData.subtotal,
        discount: cartData.discount,
        total: cartData.total,
        cash_received: paymentMethod === 'cash' ? cashReceivedNum : 0,
        change_amount: paymentMethod === 'cash' ? Math.max(0, change) : 0,
        status: 'completed',
      })
      .select()
      .single()

    if (error) {
      alert('Gagal menyimpan transaksi. Coba lagi.')
      setProcessing(false)
      return
    }

    // Insert transaction items & update stock
    const items = cartData.cart.map(item => ({
      transaction_id: transaction.id,
      product_id: item.product.id,
      product_name: item.product.name,
      product_price: item.product.price,
      quantity: item.quantity,
      subtotal: item.subtotal,
    }))

    await supabase.from('transaction_items').insert(items)

    // Update stock
    for (const item of cartData.cart) {
      await supabase
        .from('products')
        .update({ stock: item.product.stock - item.quantity })
        .eq('id', item.product.id)
    }

    sessionStorage.removeItem('pos_cart')
    router.push(`/pos/receipt/${transaction.id}`)
  }

  if (!cartData) return null

  return (
    <div style={{
      minHeight: 'calc(100vh - 60px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'var(--bg-primary)',
    }}>
      <div style={{ width: '100%', maxWidth: '960px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* LEFT: Order Summary */}
        <div>
          <h2 style={{ fontFamily: 'var(--font-syne)', fontWeight: '800', fontSize: '22px', marginBottom: '20px' }}>
            📋 Ringkasan Pesanan
          </h2>

          <div className="card" style={{ padding: '20px', marginBottom: '16px' }}>
            {cartData.cart.map(item => (
              <div key={item.product.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '10px',
                marginBottom: '10px',
                borderBottom: '1px solid var(--border)',
              }}>
                <div>
                  <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: '600', fontFamily: 'var(--font-syne)' }}>
                    {item.product.name}
                  </p>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
                    {formatRupiah(item.product.price)} × {item.quantity}
                  </p>
                </div>
                <span style={{ fontFamily: 'var(--font-syne)', fontWeight: '700', fontSize: '14px' }}>
                  {formatRupiah(item.subtotal)}
                </span>
              </div>
            ))}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Subtotal</span>
              <span style={{ fontSize: '13px' }}>{formatRupiah(cartData.subtotal)}</span>
            </div>
            {cartData.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#ef4444', fontSize: '13px' }}>Diskon</span>
                <span style={{ color: '#ef4444', fontSize: '13px' }}>-{formatRupiah(cartData.discount)}</span>
              </div>
            )}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingTop: '12px',
              marginTop: '6px',
              borderTop: '1px solid var(--border)',
            }}>
              <span style={{ fontFamily: 'var(--font-syne)', fontWeight: '700', fontSize: '16px' }}>Total</span>
              <span style={{ fontFamily: 'var(--font-syne)', fontWeight: '800', fontSize: '20px', color: 'var(--accent)' }}>
                {formatRupiah(cartData.total)}
              </span>
            </div>
          </div>

          <button
            onClick={() => router.push('/pos')}
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              borderRadius: '8px',
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: '600',
              fontFamily: 'var(--font-syne)',
            }}
          >
            ← Kembali ke Kasir
          </button>
        </div>

        {/* RIGHT: Payment */}
        <div>
          <h2 style={{ fontFamily: 'var(--font-syne)', fontWeight: '800', fontSize: '22px', marginBottom: '20px' }}>
            💳 Pembayaran
          </h2>

          {/* Payment Method Toggle */}
          <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
            <p style={{
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--text-secondary)',
              marginBottom: '12px',
              fontFamily: 'var(--font-syne)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              Metode Pembayaran
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {(['cash', 'qris'] as PaymentMethod[]).map(method => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  style={{
                    padding: '16px',
                    borderRadius: '10px',
                    border: `2px solid ${paymentMethod === method ? 'var(--accent)' : 'var(--border)'}`,
                    background: paymentMethod === method ? 'rgba(34,197,94,0.1)' : 'var(--bg-hover)',
                    color: paymentMethod === method ? 'var(--accent)' : 'var(--text-secondary)',
                    textAlign: 'center',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontSize: '28px', marginBottom: '6px' }}>
                    {method === 'cash' ? '💵' : '📱'}
                  </div>
                  <p style={{
                    margin: 0,
                    fontFamily: 'var(--font-syne)',
                    fontWeight: '700',
                    fontSize: '14px',
                  }}>
                    {method === 'cash' ? 'Tunai' : 'QRIS'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Cash Section */}
          {paymentMethod === 'cash' && (
            <div className="card animate-fade-in" style={{ padding: '20px', marginBottom: '20px' }}>
              <p style={{
                fontSize: '12px',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                marginBottom: '12px',
                fontFamily: 'var(--font-syne)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                Uang Diterima
              </p>

              <div style={{ marginBottom: '12px' }}>
                <input
                  type="number"
                  value={cashReceived}
                  onChange={e => setCashReceived(e.target.value)}
                  placeholder={`Min. ${formatRupiah(cartData.total)}`}
                  style={{ fontSize: '18px', fontWeight: '700', fontFamily: 'var(--font-syne)' }}
                />
              </div>

              {/* Quick amount buttons */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                {[cartData.total, 50000, 100000, 150000, 200000].map(amt => (
                  <button
                    key={amt}
                    onClick={() => setCashReceived(String(amt))}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '20px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-hover)',
                      color: 'var(--text-secondary)',
                      fontSize: '12px',
                      fontWeight: '600',
                      fontFamily: 'var(--font-syne)',
                    }}
                  >
                    {amt === cartData.total ? 'Pas' : formatRupiah(amt)}
                  </button>
                ))}
              </div>

              {cashReceivedNum >= cartData.total && (
                <div style={{
                  background: 'rgba(34,197,94,0.1)',
                  border: '1px solid rgba(34,197,94,0.3)',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span style={{ fontFamily: 'var(--font-syne)', fontWeight: '600', fontSize: '14px', color: 'var(--accent)' }}>
                    💵 Kembalian
                  </span>
                  <span style={{ fontFamily: 'var(--font-syne)', fontWeight: '800', fontSize: '20px', color: 'var(--accent)' }}>
                    {formatRupiah(change)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* QRIS Section */}
          {paymentMethod === 'qris' && (
            <div className="card animate-fade-in" style={{ padding: '20px', marginBottom: '20px', textAlign: 'center' }}>
              <p style={{
                fontFamily: 'var(--font-syne)',
                fontWeight: '700',
                fontSize: '16px',
                marginBottom: '4px',
              }}>
                Scan QRIS Vape Lur
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px' }}>
                Tunjukkan QR Code ini ke pelanggan
              </p>

              {/* QR Display */}
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '16px',
                display: 'inline-block',
                marginBottom: '16px',
              }}>
                {settings?.qris_image_url ? (
                  <img
                    src={settings.qris_image_url}
                    alt="QRIS Vape Lur"
                    style={{ width: '200px', height: '200px', objectFit: 'contain', display: 'block' }}
                  />
                ) : (
                  <div style={{
                    width: '200px',
                    height: '200px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#666',
                  }}>
                    <span style={{ fontSize: '48px', marginBottom: '10px' }}>📱</span>
                    <p style={{ fontSize: '12px', fontWeight: '600', color: '#333', textAlign: 'center' }}>
                      Upload QRIS di Settings Admin
                    </p>
                  </div>
                )}
              </div>

              <div style={{
                background: 'rgba(34,197,94,0.1)',
                border: '1px solid rgba(34,197,94,0.3)',
                borderRadius: '10px',
                padding: '12px 16px',
              }}>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Total yang harus dibayar:
                </p>
                <p style={{
                  margin: 0,
                  fontFamily: 'var(--font-syne)',
                  fontWeight: '800',
                  fontSize: '24px',
                  color: 'var(--accent)',
                }}>
                  {formatRupiah(cartData.total)}
                </p>
              </div>
            </div>
          )}

          {/* Confirm Button */}
          <button
            onClick={handleConfirm}
            disabled={processing || (paymentMethod === 'cash' && cashReceivedNum < cartData.total)}
            style={{
              width: '100%',
              padding: '16px',
              background: (processing || (paymentMethod === 'cash' && cashReceivedNum < cartData.total))
                ? 'var(--bg-hover)' : 'var(--accent)',
              color: (processing || (paymentMethod === 'cash' && cashReceivedNum < cartData.total))
                ? 'var(--text-muted)' : '#000',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '700',
              fontFamily: 'var(--font-syne)',
              cursor: processing ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {processing ? '⏳ Memproses...' : paymentMethod === 'qris'
              ? '✅ Konfirmasi Pembayaran QRIS Diterima'
              : cashReceivedNum < cartData.total
                ? `⚠️ Kurang ${formatRupiah(cartData.total - cashReceivedNum)}`
                : '✅ Konfirmasi Pembayaran Tunai'
            }
          </button>
        </div>
      </div>
    </div>
  )
}
