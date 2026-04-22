'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Product, Category, CartItem } from '@/types'
import { formatRupiah } from '@/lib/utils'

export default function PosPage() {
  const router = useRouter()
  const supabase = createClient()

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [loading, setLoading] = useState(true)
  const [discount, setDiscount] = useState(0)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const [{ data: prods }, { data: cats }] = await Promise.all([
      supabase.from('products').select('*, category:categories(*)').eq('is_active', true).order('name'),
      supabase.from('categories').select('*').order('name'),
    ])
    setProducts(prods || [])
    setCategories(cats || [])
    setLoading(false)
  }

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = selectedCategory ? p.category_id === selectedCategory : true
    return matchSearch && matchCat
  })

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id)
      if (existing) {
        if (existing.quantity >= product.stock) return prev
        return prev.map(i =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.product.price }
            : i
        )
      }
      return [...prev, { product, quantity: 1, subtotal: product.price }]
    })
  }

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(i => i.product.id !== productId))
  }

  const updateQty = (productId: string, qty: number) => {
    if (qty <= 0) { removeFromCart(productId); return }
    setCart(prev => prev.map(i =>
      i.product.id === productId
        ? { ...i, quantity: qty, subtotal: qty * i.product.price }
        : i
    ))
  }

  const subtotal = cart.reduce((sum, i) => sum + i.subtotal, 0)
  const total = subtotal - discount

  const handleCheckout = () => {
    if (cart.length === 0) return
    const cartData = JSON.stringify({ cart, discount, subtotal, total })
    sessionStorage.setItem('pos_cart', cartData)
    router.push('/pos/checkout')
  }

  const clearCart = () => {
    if (confirm('Kosongkan keranjang?')) setCart([])
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 60px)' }}>
      {/* LEFT: Product Grid */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid var(--border)',
        overflow: 'hidden',
      }}>
        {/* Search & Filter Bar */}
        <div style={{
          padding: '16px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-secondary)',
        }}>
          <input
            type="text"
            placeholder="🔍 Cari produk..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ marginBottom: '10px' }}
          />
          {/* Category tabs */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setSelectedCategory('')}
              style={{
                padding: '5px 12px',
                borderRadius: '20px',
                border: '1px solid',
                fontSize: '12px',
                fontWeight: '600',
                fontFamily: 'var(--font-syne)',
                background: !selectedCategory ? 'var(--accent)' : 'transparent',
                color: !selectedCategory ? '#000' : 'var(--text-secondary)',
                borderColor: !selectedCategory ? 'var(--accent)' : 'var(--border)',
              }}
            >
              Semua
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '20px',
                  border: '1px solid',
                  fontSize: '12px',
                  fontWeight: '600',
                  fontFamily: 'var(--font-syne)',
                  background: selectedCategory === cat.id ? 'var(--accent)' : 'transparent',
                  color: selectedCategory === cat.id ? '#000' : 'var(--text-secondary)',
                  borderColor: selectedCategory === cat.id ? 'var(--accent)' : 'var(--border)',
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '16px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: '12px',
          alignContent: 'start',
        }}>
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card" style={{
                height: '180px',
                background: 'var(--bg-hover)',
                animation: 'pulse 1.5s infinite',
              }} />
            ))
          ) : filteredProducts.length === 0 ? (
            <div style={{
              gridColumn: '1/-1',
              textAlign: 'center',
              padding: '60px 20px',
              color: 'var(--text-muted)',
            }}>
              <p style={{ fontSize: '40px', margin: '0 0 10px' }}>📦</p>
              <p style={{ fontFamily: 'var(--font-syne)', fontWeight: '600' }}>Produk tidak ditemukan</p>
            </div>
          ) : filteredProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              inCart={cart.find(i => i.product.id === product.id)?.quantity || 0}
              onAdd={() => addToCart(product)}
            />
          ))}
        </div>
      </div>

      {/* RIGHT: Cart */}
      <div style={{
        width: '340px',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-secondary)',
      }}>
        {/* Cart Header */}
        <div style={{
          padding: '16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <h2 style={{
            fontFamily: 'var(--font-syne)',
            fontWeight: '700',
            fontSize: '16px',
            margin: 0,
          }}>
            🛒 Keranjang
            {cart.length > 0 && (
              <span style={{
                marginLeft: '8px',
                background: 'var(--accent)',
                color: '#000',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: '700',
              }}>
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </h2>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              style={{
                background: 'rgba(239,68,68,0.1)',
                color: '#ef4444',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: '600',
              }}
            >
              Hapus Semua
            </button>
          )}
        </div>

        {/* Cart Items */}
        <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
          {cart.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: 'var(--text-muted)',
            }}>
              <p style={{ fontSize: '40px', margin: '0 0 10px' }}>🛒</p>
              <p style={{ fontSize: '13px' }}>Keranjang kosong</p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Klik produk untuk menambahkan</p>
            </div>
          ) : (
            cart.map(item => (
              <CartItemCard
                key={item.product.id}
                item={item}
                onRemove={() => removeFromCart(item.product.id)}
                onQtyChange={(qty) => updateQty(item.product.id, qty)}
              />
            ))
          )}
        </div>

        {/* Cart Footer */}
        {cart.length > 0 && (
          <div style={{
            padding: '16px',
            borderTop: '1px solid var(--border)',
            background: 'var(--bg-card)',
          }}>
            {/* Discount */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{
                fontSize: '12px',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                display: 'block',
                marginBottom: '6px',
                fontFamily: 'var(--font-syne)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                Diskon (Rp)
              </label>
              <input
                type="number"
                value={discount || ''}
                onChange={e => setDiscount(Number(e.target.value) || 0)}
                placeholder="0"
                min="0"
                max={subtotal}
              />
            </div>

            {/* Summary */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Subtotal</span>
                <span style={{ fontSize: '13px' }}>{formatRupiah(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#ef4444', fontSize: '13px' }}>Diskon</span>
                  <span style={{ color: '#ef4444', fontSize: '13px' }}>-{formatRupiah(discount)}</span>
                </div>
              )}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '10px',
                borderTop: '1px solid var(--border)',
              }}>
                <span style={{ fontFamily: 'var(--font-syne)', fontWeight: '700', fontSize: '15px' }}>Total</span>
                <span style={{
                  fontFamily: 'var(--font-syne)',
                  fontWeight: '800',
                  fontSize: '18px',
                  color: 'var(--accent)',
                }}>
                  {formatRupiah(total)}
                </span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              className="pulse-green"
              style={{
                width: '100%',
                padding: '14px',
                background: 'var(--accent)',
                color: '#000',
                border: 'none',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: '700',
                fontFamily: 'var(--font-syne)',
              }}
            >
              Bayar {formatRupiah(total)} →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ---- Sub Components ----

function ProductCard({ product, inCart, onAdd }: {
  product: Product
  inCart: number
  onAdd: () => void
}) {
  const outOfStock = product.stock <= 0
  const lowStock = product.stock <= product.min_stock && product.stock > 0

  return (
    <button
      onClick={onAdd}
      disabled={outOfStock}
      style={{
        background: inCart > 0 ? 'rgba(34,197,94,0.08)' : 'var(--bg-card)',
        border: `1px solid ${inCart > 0 ? 'rgba(34,197,94,0.4)' : 'var(--border)'}`,
        borderRadius: '12px',
        padding: '12px',
        textAlign: 'left',
        cursor: outOfStock ? 'not-allowed' : 'pointer',
        opacity: outOfStock ? 0.5 : 1,
        transition: 'all 0.2s',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        if (!outOfStock) e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
    >
      {inCart > 0 && (
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          background: 'var(--accent)',
          color: '#000',
          borderRadius: '50%',
          width: '22px',
          height: '22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          fontWeight: '700',
          fontFamily: 'var(--font-syne)',
        }}>
          {inCart}
        </div>
      )}

      {/* Product Image */}
      <div style={{
        width: '100%',
        height: '80px',
        background: 'var(--bg-hover)',
        borderRadius: '8px',
        marginBottom: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: '32px' }}>💨</span>
        )}
      </div>

      <p style={{
        margin: '0 0 4px',
        fontSize: '13px',
        fontWeight: '600',
        fontFamily: 'var(--font-syne)',
        color: 'var(--text-primary)',
        lineHeight: 1.3,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {product.name}
      </p>

      <p style={{
        margin: '0 0 6px',
        fontSize: '14px',
        fontWeight: '700',
        color: 'var(--accent)',
        fontFamily: 'var(--font-syne)',
      }}>
        {formatRupiah(product.price)}
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={{ fontSize: '10px', color: outOfStock ? '#ef4444' : lowStock ? '#f59e0b' : 'var(--text-muted)' }}>
          {outOfStock ? '● Habis' : lowStock ? `● Stok: ${product.stock}` : `● ${product.stock}`}
        </span>
      </div>
    </button>
  )
}

function CartItemCard({ item, onRemove, onQtyChange }: {
  item: CartItem
  onRemove: () => void
  onQtyChange: (qty: number) => void
}) {
  return (
    <div className="animate-fade-in" style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '10px',
      padding: '10px 12px',
      marginBottom: '8px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <p style={{
          margin: 0,
          fontSize: '13px',
          fontWeight: '600',
          fontFamily: 'var(--font-syne)',
          flex: 1,
          paddingRight: '8px',
          lineHeight: 1.3,
        }}>
          {item.product.name}
        </p>
        <button
          onClick={onRemove}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: '16px',
            padding: '0',
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Qty control */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => onQtyChange(item.quantity - 1)}
            style={{
              width: '28px',
              height: '28px',
              background: 'var(--bg-hover)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              color: 'var(--text-primary)',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            −
          </button>
          <span style={{
            fontFamily: 'var(--font-syne)',
            fontWeight: '700',
            fontSize: '14px',
            minWidth: '20px',
            textAlign: 'center',
          }}>
            {item.quantity}
          </span>
          <button
            onClick={() => onQtyChange(item.quantity + 1)}
            style={{
              width: '28px',
              height: '28px',
              background: 'var(--bg-hover)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              color: 'var(--text-primary)',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            +
          </button>
        </div>
        <span style={{
          fontFamily: 'var(--font-syne)',
          fontWeight: '700',
          fontSize: '14px',
          color: 'var(--accent)',
        }}>
          {formatRupiah(item.subtotal)}
        </span>
      </div>
    </div>
  )
}
