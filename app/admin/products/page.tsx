'use client'

import { useEffect, useState } from 'react'
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
    name: '', description: '', category_id: '', price: '', cost_price: '', stock: '', min_stock: '5', is_active: true,
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

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
    setShowModal(true)
  }

  const openEdit = (p: Product) => {
    setEditProduct(p)
    setForm({
      name: p.name,
      description: p.description || '',
      category_id: p.category_id || '',
      price: String(p.price),
      cost_price: String(p.cost_price),
      stock: String(p.stock),
      min_stock: String(p.min_stock),
      is_active: p.is_active,
    })
    setImageFile(null)
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.price) return
    setSaving(true)

    let image_url = editProduct?.image_url || null

    if (imageFile) {
      const fileName = `${Date.now()}-${imageFile.name}`
      const { data: uploadData } = await supabase.storage
        .from('product-images')
        .upload(fileName, imageFile)

      if (uploadData) {
        const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName)
        image_url = urlData.publicUrl
      }
    }

    const payload = {
      name: form.name,
      description: form.description,
      category_id: form.category_id || null,
      price: parseInt(form.price) || 0,
      cost_price: parseInt(form.cost_price) || 0,
      stock: parseInt(form.stock) || 0,
      min_stock: parseInt(form.min_stock) || 5,
      is_active: form.is_active,
      image_url,
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

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-syne)', fontWeight: '800', fontSize: '28px', margin: '0 0 4px', letterSpacing: '-0.5px' }}>
            Produk
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
            {products.length} produk terdaftar
          </p>
        </div>
        <button
          onClick={openAdd}
          style={{
            padding: '10px 20px',
            background: 'var(--accent)',
            color: '#000',
            border: 'none',
            borderRadius: '10px',
            fontWeight: '700',
            fontFamily: 'var(--font-syne)',
            fontSize: '14px',
          }}
        >
          + Tambah Produk
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="🔍 Cari produk..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: '360px' }}
        />
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-hover)' }}>
                {['Produk', 'Kategori', 'Harga Jual', 'Modal', 'Stok', 'Status', 'Aksi'].map(h => (
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
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Memuat...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Tidak ada produk</td></tr>
              ) : filtered.map(p => (
                <tr key={p.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        background: 'var(--bg-hover)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        flexShrink: 0,
                      }}>
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : <span>💨</span>}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', fontFamily: 'var(--font-syne)' }}>{p.name}</p>
                        {p.description && <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>{p.description.slice(0, 40)}</p>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {(p.category as any)?.name || '-'}
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--font-syne)', fontWeight: '700', color: 'var(--accent)' }}>
                    {formatRupiah(p.price)}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {formatRupiah(p.cost_price)}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className={`badge ${p.stock <= 0 ? 'badge-red' : p.stock <= p.min_stock ? 'badge-yellow' : 'badge-green'}`}>
                      {p.stock} pcs
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button onClick={() => toggleActive(p)} style={{
                      background: p.is_active ? 'rgba(34,197,94,0.1)' : 'rgba(82,82,91,0.2)',
                      color: p.is_active ? '#22c55e' : '#71717a',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '11px',
                      fontWeight: '600',
                      fontFamily: 'var(--font-syne)',
                      cursor: 'pointer',
                    }}>
                      {p.is_active ? 'Aktif' : 'Nonaktif'}
                    </button>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => openEdit(p)} style={{
                        background: 'var(--bg-hover)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        padding: '5px 10px',
                        color: 'var(--text-secondary)',
                        fontSize: '12px',
                        fontWeight: '600',
                      }}>
                        Edit
                      </button>
                      <button onClick={() => handleDelete(p.id)} style={{
                        background: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.2)',
                        borderRadius: '6px',
                        padding: '5px 10px',
                        color: '#ef4444',
                        fontSize: '12px',
                        fontWeight: '600',
                      }}>
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
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
          <div className="card animate-fade-in" style={{
            width: '100%',
            maxWidth: '520px',
            padding: '28px',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}>
            <h2 style={{ fontFamily: 'var(--font-syne)', fontWeight: '700', fontSize: '20px', marginBottom: '20px' }}>
              {editProduct ? 'Edit Produk' : 'Tambah Produk'}
            </h2>

            <div style={{ display: 'grid', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px', fontFamily: 'var(--font-syne)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nama Produk *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nama produk" />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px', fontFamily: 'var(--font-syne)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Kategori</label>
                <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}>
                  <option value="">-- Pilih Kategori --</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px', fontFamily: 'var(--font-syne)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Harga Jual *</label>
                  <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="0" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px', fontFamily: 'var(--font-syne)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Harga Modal</label>
                  <input type="number" value={form.cost_price} onChange={e => setForm({ ...form, cost_price: e.target.value })} placeholder="0" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px', fontFamily: 'var(--font-syne)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Stok</label>
                  <input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} placeholder="0" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px', fontFamily: 'var(--font-syne)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Min. Stok Alert</label>
                  <input type="number" value={form.min_stock} onChange={e => setForm({ ...form, min_stock: e.target.value })} placeholder="5" />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px', fontFamily: 'var(--font-syne)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Deskripsi</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Deskripsi produk" rows={2} style={{ resize: 'vertical' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px', fontFamily: 'var(--font-syne)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Foto Produk</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setImageFile(e.target.files?.[0] || null)}
                  style={{ padding: '8px' }}
                />
                {editProduct?.image_url && !imageFile && (
                  <img src={editProduct.image_url} alt="preview" style={{ marginTop: '8px', width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'var(--bg-hover)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text-secondary)',
                  fontWeight: '600',
                  fontFamily: 'var(--font-syne)',
                }}
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  flex: 2,
                  padding: '12px',
                  background: saving ? 'var(--bg-hover)' : 'var(--accent)',
                  border: 'none',
                  borderRadius: '8px',
                  color: saving ? 'var(--text-muted)' : '#000',
                  fontWeight: '700',
                  fontFamily: 'var(--font-syne)',
                  cursor: saving ? 'not-allowed' : 'pointer',
                }}
              >
                {saving ? 'Menyimpan...' : 'Simpan Produk'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
