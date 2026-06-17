'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { StoreSettings } from '@/types'

export default function SettingsPage() {
  const supabase = createClient()
  const [settings, setSettings] = useState<StoreSettings | null>(null)
  const [form, setForm] = useState({ store_name: '', address: '', phone: '', receipt_footer: '' })
  const [qrisFile, setQrisFile] = useState<File | null>(null)
  const [qrisPreview, setQrisPreview] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch via API route agar konsisten
    fetch('/api/settings')
      .then(res => res.json())
      .then(({ data }) => {
        if (data) {
          setSettings(data)
          setForm({
            store_name: data.store_name || '',
            address: data.address || '',
            phone: data.phone || '',
            receipt_footer: data.receipt_footer || '',
          })
          if (data.qris_image_url) setQrisPreview(data.qris_image_url)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleQrisChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setQrisFile(file)
    setQrisPreview(URL.createObjectURL(file))
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveError(null)

    try {
      let qris_image_url = settings?.qris_image_url ?? null

      // Upload foto QRIS jika ada file baru
      if (qrisFile) {
        const ext = qrisFile.name.split('.').pop()
        const fileName = `qris-vapelur-${Date.now()}.${ext}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('qris-image')
          .upload(fileName, qrisFile, { upsert: true })

        if (uploadError) {
          setSaveError(`Gagal upload foto QRIS: ${uploadError.message}`)
          setSaving(false)
          return
        }

        if (uploadData) {
          const { data: urlData } = supabase.storage.from('qris-image').getPublicUrl(fileName)
          qris_image_url = urlData.publicUrl
        }
      }

      // Simpan ke DB via API Route (bypass RLS dengan service role key)
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: settings?.id ?? null,
          ...form,
          qris_image_url,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || `Server error ${res.status}`)
      }

      // Update state lokal dengan data yang berhasil disimpan
      if (result.data) {
        const saved: StoreSettings = {
          id: result.data.id ?? settings?.id ?? '',
          created_at: settings?.created_at ?? new Date().toISOString(),
          updated_at: new Date().toISOString(),
          store_name: form.store_name,
          address: form.address || undefined,
          phone: form.phone || undefined,
          receipt_footer: form.receipt_footer || undefined,
          qris_image_url: qris_image_url ?? undefined,
        }
        setSettings(saved)
        if (qris_image_url) setQrisPreview(qris_image_url)
      }

      setQrisFile(null)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan tidak diketahui'
      setSaveError(`Gagal menyimpan: ${msg}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh' }}>
      <p style={{ color: 'var(--text-muted)' }}>Memuat pengaturan...</p>
    </div>
  )

  return (
    <div className="animate-fade-in" style={{ maxWidth: '640px' }}>
      <h1 style={{ fontFamily: 'var(--font-syne)', fontWeight: '800', fontSize: '28px', margin: '0 0 4px', letterSpacing: '-0.5px' }}>
        Pengaturan
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '32px' }}>
        Konfigurasi informasi toko dan metode pembayaran
      </p>

      {/* Error Banner */}
      {saveError && (
        <div style={{
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '10px',
          padding: '12px 16px',
          marginBottom: '20px',
          color: '#ef4444',
          fontSize: '13px',
          fontWeight: '600',
        }}>
          ⚠️ {saveError}
        </div>
      )}

      {/* Store Info */}
      <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'var(--font-syne)', fontWeight: '700', fontSize: '16px', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
          🏪 Informasi Toko
        </h2>

        <div style={{ display: 'grid', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px', fontFamily: 'var(--font-syne)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Nama Toko
            </label>
            <input
              value={form.store_name}
              onChange={e => setForm({ ...form, store_name: e.target.value })}
              placeholder="Vape Lur"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px', fontFamily: 'var(--font-syne)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Alamat
            </label>
            <textarea
              value={form.address}
              onChange={e => setForm({ ...form, address: e.target.value })}
              placeholder="Alamat lengkap toko"
              rows={2}
              style={{ resize: 'vertical' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px', fontFamily: 'var(--font-syne)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Nomor Telepon / WhatsApp
            </label>
            <input
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              placeholder="08xxxxxxxxxx"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px', fontFamily: 'var(--font-syne)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Pesan Footer Struk
            </label>
            <textarea
              value={form.receipt_footer}
              onChange={e => setForm({ ...form, receipt_footer: e.target.value })}
              placeholder="Terima kasih sudah berbelanja di Vape Lur! 💨"
              rows={2}
              style={{ resize: 'vertical' }}
            />
          </div>
        </div>
      </div>

      {/* QRIS Settings */}
      <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'var(--font-syne)', fontWeight: '700', fontSize: '16px', marginBottom: '8px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
          📱 QRIS Pembayaran
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
          Upload foto QR Code QRIS toko Anda. Akan ditampilkan saat kasir pilih metode QRIS.
        </p>

        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* QR Preview */}
          <div style={{
            width: '160px',
            height: '160px',
            background: qrisPreview ? 'white' : 'var(--bg-hover)',
            border: `2px dashed ${qrisPreview ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            flexShrink: 0,
          }}>
            {qrisPreview ? (
              <img
                src={qrisPreview}
                alt="QRIS Preview"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                onError={() => setQrisPreview('')}
              />
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: '32px', margin: '0 0 6px' }}>📱</p>
                <p style={{ fontSize: '11px', margin: 0 }}>Belum ada QRIS</p>
              </div>
            )}
          </div>

          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px', fontFamily: 'var(--font-syne)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Upload Foto QRIS
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleQrisChange}
              style={{ marginBottom: '10px', padding: '8px' }}
            />
            {qrisFile && (
              <p style={{ fontSize: '12px', color: 'var(--accent)', margin: '0 0 8px', fontWeight: '600' }}>
                ✅ File dipilih: {qrisFile.name}
              </p>
            )}
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
              Format: JPG, PNG, atau WEBP.<br />
              Pastikan QR Code terlihat jelas dan tidak terpotong.
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          width: '100%',
          padding: '14px',
          background: saved ? 'rgba(34,197,94,0.2)' : saving ? 'var(--bg-hover)' : 'var(--accent)',
          color: saved ? 'var(--accent)' : saving ? 'var(--text-muted)' : '#000',
          border: saved ? '1px solid rgba(34,197,94,0.4)' : 'none',
          borderRadius: '12px',
          fontSize: '15px',
          fontWeight: '700',
          fontFamily: 'var(--font-syne)',
          cursor: saving ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s',
        }}
      >
        {saved ? '✅ Pengaturan Tersimpan!' : saving ? '⏳ Menyimpan...' : 'Simpan Pengaturan'}
      </button>
    </div>
  )
}
