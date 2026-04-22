'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Product, Category } from '@/types'
import { formatRupiah } from '@/lib/utils'

export default function ProductsPage() {
  const supabase = createClient()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({
    name: '', description: '', category_id: '', price: '',
    cost_price: '', stock: '', min_stock: '5', is_active: true,
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [saving, setSaving] = useState(false)

  // Ref untuk reset scroll modal ke atas
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const [{ data: prods }, { data: cats }] = await Promise.all([
      supabase.from('products').select('*, category:categories(*)').order('name'),
      supabase.from('categories').select('*').order('name'),
    ])
    setProducts(prods || [])
    setCategories(cats || [])
    setLoading(false)
  }

  const openAdd = () => {
    setEditProduct(null)
    setForm({ name: '', description: '', category_id: '', price: '', cost_price: '', stock: '', min_stock: '5', is_active: true })
    setImageFile(null)
    setImagePreview('')
    setShowModal(true)
    // Reset scroll overlay ke atas setelah render
    setTimeout(() => overlayRef.current?.scrollTo({ top: 0 }), 0)
  }

  const openEdit = (p: Product) => {
    setEditProduct(p)
    setForm({
      name: p.name, description: p.description || '',
      category_id: p.category_id || '', price: String(p.price),
      cost_price: String(p.cost_price), stock: String(p.stock),
      min_stock: String(p.min_stock), is_active: p.is_active,
    })
    setImageFile(null)
    setImagePreview(p.image_url || '')
    setShowModal(true)
    setTimeout(() => overlayRef.current?.scrollTo({ top: 0 }), 0)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleSave = async () => {
    if (!form.name || !form.price) return
    setSaving(true)
    let image_url = editProduct?.image_url || null
    if (imageFile) {
      const fileName = `${Date.now()}-${imageFile.name}`
      const { data: uploadData } = await supabase.storage.from('product-images').upload(fileName, imageFile)
      if (uploadData) {
        const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName)
        image_url = urlData.publicUrl
      }
    }
    const payload = {
      name: form.name, description: form.description,
      category_id: form.category_id || null,
      price: parseInt(form.price) || 0,
      cost_price: parseInt(form.cost_price) || 0,
      stock: parseInt(form.stock) || 0,
      min_stock: parseInt(form.min_stock) || 5,
      is_active: form.is_active, image_url,
    }
    if (editProduct) {
      await supabase.from('products').update(payload).eq('id', editProduct.id)
    } else {
      await supabase.from('products').insert(payload)
    }
    await fetchData()
    setShowModal(false)
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus produk ini?')) return
    await supabase.from('products').delete().eq('id', id)
    await fetchData()
  }

  const toggleActive = async (p: Product) => {
    await supabase.from('products').update({ is_active: !p.is_active }).eq('id', p.id)
    await fetchData()
  }

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))

  const getMargin = () => {
    const price = parseInt(form.price) || 0
    const cost = parseInt(form.cost_price) || 0
    if (!price || !cost) return null
    return { margin: Math.round(((price - cost) / price) * 100), profit: price - cost }
  }
  const marginData = getMargin()

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-syne)', fontWeight: '800', fontSize: '28px', margin: '0 0 4px', letterSpacing: '-0.5px' }}>Produk</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>{products.length} produk terdaftar</p>
        </div>
        <button onClick={openAdd} style={{ padding: '10px 20px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '10px', fontWeight: '700', fontFamily: 'var(--font-syne)', fontSize: '14px', cursor: 'pointer' }}>
          + Tambah Produk
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <input type="text" placeholder="🔍 Cari produk..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: '360px' }} />
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-hover)' }}>
                {['Produk', 'Kategori', 'Harga Jual', 'Modal', 'Stok', 'Status', 'Aksi'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.5px', fontFamily: 'var(--font-syne)', whiteSpace: 'nowrap' as const }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Memuat...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Tidak ada produk</td></tr>
              ) : filtered.map(p => (
                <tr key={p.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '40px', height: '40px', background: 'var(--bg-hover)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                        {p.image_url ? <img src={p.image_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' as const }} /> : <span>💨</span>}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', fontFamily: 'var(--font-syne)' }}>{p.name}</p>
                        {p.description && <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>{p.description.slice(0, 40)}</p>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>{(p.category as any)?.name || '-'}</td>
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--font-syne)', fontWeight: '700', color: 'var(--accent)' }}>{formatRupiah(p.price)}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>{formatRupiah(p.cost_price)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className={`badge ${p.stock <= 0 ? 'badge-red' : p.stock <= p.min_stock ? 'badge-yellow' : 'badge-green'}`}>{p.stock} pcs</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button onClick={() => toggleActive(p)} style={{ background: p.is_active ? 'rgba(34,197,94,0.1)' : 'rgba(82,82,91,0.2)', color: p.is_active ? '#22c55e' : '#71717a', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: '600', fontFamily: 'var(--font-syne)', cursor: 'pointer' }}>
                      {p.is_active ? 'Aktif' : 'Nonaktif'}
                    </button>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => openEdit(p)} style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: '6px', padding: '5px 10px', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Edit</button>
                      <button onClick={() => handleDelete(p.id)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', padding: '5px 10px', color: '#ef4444', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Hapus</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        // PERBAIKAN: overflowY dipindah ke overlay, alignItems: flex-start + paddingTop
        // agar modal mulai dari atas dan bisa di-scroll jika konten panjang
        <div
          ref={overlayRef}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'flex-start',       // ← bukan 'center', agar modal mulai dari atas
            justifyContent: 'center',
            zIndex: 200,
            padding: '20px',
            overflowY: 'auto',              // ← scroll ada di overlay, bukan di inner div
          }}
        >
          <div
            className="animate-fade-in"
            style={{
              width: '100%',
              maxWidth: '580px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              borderRadius: '16px',
              // PERBAIKAN: hapus maxHeight & overflowY dari sini
              // biarkan konten natural dan overlay yang scroll
              boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
              marginTop: 'auto',
              marginBottom: 'auto',
            }}
          >
            {/* Header Modal — sticky tidak diperlukan lagi karena tidak ada nested scroll */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderRadius: '16px 16px 0 0',
              background: 'var(--bg-card)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', background: 'var(--accent-glow)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                  {editProduct ? '✏️' : '📦'}
                </div>
                <div>
                  <h2 style={{ fontFamily: 'var(--font-syne)', fontWeight: '700', fontSize: '17px', margin: 0 }}>{editProduct ? 'Edit Produk' : 'Tambah Produk Baru'}</h2>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>{editProduct ? `Mengedit: ${editProduct.name}` : 'Isi detail produk di bawah ini'}</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ width: '32px', height: '32px', background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', lineHeight: '1' }}>×</button>
            </div>

            {/* Body Modal */}
            <div style={{ padding: '24px' }}>

              {/* Foto Produk */}
              <div style={{ marginBottom: '22px' }}>
                <FieldLabel>Foto Produk</FieldLabel>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  <div style={{ width: '100px', height: '100px', flexShrink: 0, background: 'var(--bg-hover)', border: `2px dashed ${imagePreview ? 'var(--accent)' : 'var(--border)'}`, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {imagePreview ? <img src={imagePreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' as const }} /> : <span style={{ fontSize: '32px', opacity: 0.4 }}>💨</span>}
                  </div>
                  <label style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', gap: '6px', height: '100px', background: 'var(--bg-hover)', border: '1px dashed var(--border)', borderRadius: '10px', cursor: 'pointer' }}>
                    <span style={{ fontSize: '22px' }}>📁</span>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', fontFamily: 'var(--font-syne)' }}>{imageFile ? imageFile.name.slice(0, 22) + '...' : 'Klik untuk upload'}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>JPG, PNG, WEBP</span>
                    <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>

              <div style={{ height: '1px', background: 'var(--border)', marginBottom: '20px' }} />

              {/* Nama */}
              <div style={{ marginBottom: '16px' }}>
                <FieldLabel required>Nama Produk</FieldLabel>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Contoh: Saltnic Mango Ice 30mg" />
              </div>

              {/* Kategori */}
              <div style={{ marginBottom: '16px' }}>
                <FieldLabel>Kategori</FieldLabel>
                <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}>
                  <option value="">-- Pilih Kategori --</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {/* Harga */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <FieldLabel required>Harga Jual</FieldLabel>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '13px', fontFamily: 'var(--font-syne)', fontWeight: '600' }}>Rp</span>
                    <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="0" style={{ paddingLeft: '36px' }} />
                  </div>
                </div>
                <div>
                  <FieldLabel>Harga Modal</FieldLabel>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '13px', fontFamily: 'var(--font-syne)', fontWeight: '600' }}>Rp</span>
                    <input type="number" value={form.cost_price} onChange={e => setForm({ ...form, cost_price: e.target.value })} placeholder="0" style={{ paddingLeft: '36px' }} />
                  </div>
                </div>
              </div>

              {/* Margin indicator */}
              {marginData && (
                <div style={{ background: marginData.margin >= 20 ? 'rgba(34,197,94,0.08)' : marginData.margin >= 0 ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${marginData.margin >= 20 ? 'rgba(34,197,94,0.2)' : marginData.margin >= 0 ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)'}`, borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>💹 Estimasi Profit per item</span>
                  <div>
                    <span style={{ fontFamily: 'var(--font-syne)', fontWeight: '700', fontSize: '14px', color: marginData.margin >= 20 ? 'var(--accent)' : marginData.margin >= 0 ? '#f59e0b' : '#ef4444' }}>{formatRupiah(marginData.profit)}</span>
                    <span style={{ marginLeft: '6px', fontSize: '11px', fontWeight: '600', fontFamily: 'var(--font-syne)', color: marginData.margin >= 20 ? 'var(--accent)' : marginData.margin >= 0 ? '#f59e0b' : '#ef4444' }}>({marginData.margin}%)</span>
                  </div>
                </div>
              )}

              {/* Stok */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <FieldLabel required>Stok Saat Ini</FieldLabel>
                  <input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} placeholder="0" min="0" />
                </div>
                <div>
                  <FieldLabel>Min. Stok Alert</FieldLabel>
                  <input type="number" value={form.min_stock} onChange={e => setForm({ ...form, min_stock: e.target.value })} placeholder="5" min="0" />
                  <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>Notifikasi saat stok ≤ angka ini</p>
                </div>
              </div>

              {/* Deskripsi */}
              <div style={{ marginBottom: '16px' }}>
                <FieldLabel>Deskripsi (opsional)</FieldLabel>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Contoh: Rasa mangga segar dengan sensasi dingin..." rows={3} style={{ resize: 'vertical' as const, lineHeight: '1.5' }} />
              </div>

              {/* Toggle aktif */}
              <div onClick={() => setForm({ ...form, is_active: !form.is_active })} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--bg-hover)', borderRadius: '10px', marginBottom: '24px', cursor: 'pointer' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', fontFamily: 'var(--font-syne)' }}>Tampilkan di Kasir</p>
                  <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>Produk nonaktif tidak muncul di halaman POS</p>
                </div>
                <div style={{ width: '44px', height: '24px', background: form.is_active ? 'var(--accent)' : 'var(--border)', borderRadius: '12px', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: '3px', left: form.is_active ? '22px' : '3px', width: '18px', height: '18px', background: 'white', borderRadius: '50%', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
                </div>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '12px', background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text-secondary)', fontWeight: '600', fontFamily: 'var(--font-syne)', fontSize: '14px', cursor: 'pointer' }}>Batal</button>
                <button onClick={handleSave} disabled={saving || !form.name || !form.price} style={{ flex: 2, padding: '12px', background: (saving || !form.name || !form.price) ? 'var(--bg-hover)' : 'var(--accent)', border: 'none', borderRadius: '10px', color: (saving || !form.name || !form.price) ? 'var(--text-muted)' : '#000', fontWeight: '700', fontFamily: 'var(--font-syne)', fontSize: '14px', cursor: (saving || !form.name || !form.price) ? 'not-allowed' : 'pointer' }}>
                  {saving ? '⏳ Menyimpan...' : editProduct ? '💾 Simpan Perubahan' : '✅ Tambah Produk'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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