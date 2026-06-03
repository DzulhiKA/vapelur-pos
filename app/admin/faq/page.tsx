'use client'

import { useState } from 'react'

const faqSections = [
  {
    section: '🛒 Kasir (POS)',
    items: [
      {
        q: 'Bagaimana cara memulai transaksi baru?',
        a: 'Buka halaman Kasir melalui tombol "Buka Kasir" di sidebar kiri. Pilih produk dengan mengklik kartu produk, tentukan jumlah, lalu klik "Bayar" untuk memproses pembayaran.',
      },
      {
        q: 'Metode pembayaran apa saja yang tersedia?',
        a: 'Sistem mendukung dua metode pembayaran: Tunai (Cash) dan QRIS. Pilih metode saat proses checkout. Jika memilih QRIS, sistem akan menampilkan QR Code yang telah dikonfigurasi di Pengaturan.',
      },
      {
        q: 'Bagaimana cara mencetak struk?',
        a: 'Setelah transaksi berhasil, akan muncul tombol "Cetak Struk". Klik tombol tersebut untuk membuka dialog cetak browser. Pastikan printer sudah terhubung dan dipilih dengan benar.',
      },
      {
        q: 'Apakah bisa mengubah jumlah produk di keranjang?',
        a: 'Ya. Di panel keranjang sebelah kanan, gunakan tombol "+" dan "−" untuk mengubah kuantitas produk, atau klik ikon hapus (🗑️) untuk menghapus produk dari keranjang.',
      },
    ],
  },
  {
    section: '📦 Manajemen Produk',
    items: [
      {
        q: 'Bagaimana cara menambah produk baru?',
        a: 'Pergi ke menu Produk → klik tombol "Tambah Produk". Isi nama produk, harga, stok, dan kategori. Anda juga bisa mengupload foto produk. Klik "Simpan" untuk menyimpan.',
      },
      {
        q: 'Bagaimana cara mengubah harga atau stok produk?',
        a: 'Di halaman Produk, klik ikon edit (✏️) pada baris produk yang ingin diubah. Ubah informasi yang diperlukan, lalu klik "Simpan Perubahan".',
      },
      {
        q: 'Bagaimana cara menonaktifkan produk tanpa menghapusnya?',
        a: 'Saat ini produk yang dihapus akan dihilangkan dari sistem. Untuk menyembunyikan produk sementara, ubah stoknya menjadi 0 — produk dengan stok 0 akan ditandai "Habis" dan tidak bisa dipilih di kasir.',
      },
      {
        q: 'Apakah ada batas upload foto produk?',
        a: 'Upload foto produk mendukung format JPG, PNG, dan WEBP. Disarankan menggunakan gambar dengan ukuran di bawah 2MB dan rasio 1:1 (persegi) agar tampilan kartu produk optimal.',
      },
    ],
  },
  {
    section: '👥 Manajemen Pengguna',
    items: [
      {
        q: 'Apa perbedaan role Admin dan Kasir?',
        a: 'Admin memiliki akses penuh ke seluruh fitur termasuk panel admin, laporan, pengaturan, dan manajemen pengguna. Kasir hanya dapat mengakses halaman POS untuk melakukan transaksi.',
      },
      {
        q: 'Bagaimana cara menambah akun kasir baru?',
        a: 'Pergi ke menu Pengguna → klik "Tambah Pengguna". Isi nama lengkap, email, password, dan pilih role "Kasir". Akun kasir yang baru dibuat bisa langsung login.',
      },
      {
        q: 'Bagaimana cara mengubah password pengguna?',
        a: 'Di halaman Pengguna, klik ikon edit pada pengguna yang ingin diubah, lalu isi field password baru. Biarkan kosong jika tidak ingin mengubah password.',
      },
    ],
  },
  {
    section: '🧾 Laporan & Transaksi',
    items: [
      {
        q: 'Di mana saya bisa melihat riwayat transaksi?',
        a: 'Pergi ke menu Transaksi di sidebar. Di sini ditampilkan semua riwayat transaksi lengkap dengan detail produk, total, metode bayar, dan waktu transaksi.',
      },
      {
        q: 'Apakah transaksi bisa dibatalkan?',
        a: 'Transaksi yang sudah selesai tidak dapat dibatalkan melalui sistem saat ini. Untuk penyesuaian, hubungi administrator database secara langsung.',
      },
      {
        q: 'Bagaimana cara melihat laporan penjualan harian?',
        a: 'Dashboard admin menampilkan ringkasan penjualan hari ini, total transaksi, dan produk terlaris. Untuk laporan detail per periode, gunakan filter tanggal di halaman Transaksi.',
      },
    ],
  },
  {
    section: '⚙️ Pengaturan Sistem',
    items: [
      {
        q: 'Bagaimana cara mengubah nama toko di struk?',
        a: 'Pergi ke menu Pengaturan. Di bagian "Informasi Toko", ubah Nama Toko, Alamat, dan Nomor Telepon sesuai kebutuhan. Klik "Simpan Pengaturan" untuk menyimpan perubahan.',
      },
      {
        q: 'Bagaimana cara mengatur QRIS untuk pembayaran?',
        a: 'Di menu Pengaturan, scroll ke bagian "QRIS Pembayaran". Upload foto QR Code QRIS Anda dalam format JPG/PNG/WEBP. Pastikan QR Code terlihat jelas. Klik "Simpan Pengaturan".',
      },
      {
        q: 'Apa itu Pesan Footer Struk?',
        a: 'Pesan footer adalah teks yang akan muncul di bagian bawah struk cetak, misalnya ucapan terima kasih atau informasi promo. Contoh: "Terima kasih sudah berbelanja di Vape Lur! 💨".',
      },
    ],
  },
]

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<string | null>(null)

  const toggle = (key: string) => {
    setOpenIndex(prev => (prev === key ? null : key))
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '760px' }}>
      {/* Header */}
      <h1 style={{
        fontFamily: 'var(--font-syne)',
        fontWeight: '800',
        fontSize: '28px',
        margin: '0 0 4px',
        letterSpacing: '-0.5px',
      }}>
        FAQ & Panduan Pengguna
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '32px' }}>
        Panduan lengkap penggunaan sistem POS Vape Lur
      </p>

      {/* Info Banner */}
      <div style={{
        background: 'rgba(34,197,94,0.08)',
        border: '1px solid rgba(34,197,94,0.25)',
        borderRadius: '12px',
        padding: '16px 20px',
        marginBottom: '32px',
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-start',
      }}>
        <span style={{ fontSize: '20px', flexShrink: 0 }}>💡</span>
        <div>
          <p style={{ margin: '0 0 4px', fontWeight: '700', fontFamily: 'var(--font-syne)', fontSize: '14px', color: 'var(--accent)' }}>
            Tips Penggunaan
          </p>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Klik pertanyaan untuk melihat jawabannya. Jika ada kendala yang belum tercakup, hubungi administrator sistem.
          </p>
        </div>
      </div>

      {/* FAQ Sections */}
      {faqSections.map((section, sIdx) => (
        <div key={sIdx} style={{ marginBottom: '28px' }}>
          {/* Section Header */}
          <h2 style={{
            fontFamily: 'var(--font-syne)',
            fontWeight: '700',
            fontSize: '15px',
            marginBottom: '12px',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            {section.section}
          </h2>

          {/* FAQ Items */}
          <div style={{ display: 'grid', gap: '8px' }}>
            {section.items.map((item, iIdx) => {
              const key = `${sIdx}-${iIdx}`
              const isOpen = openIndex === key
              return (
                <div
                  key={iIdx}
                  className="card"
                  style={{
                    overflow: 'hidden',
                    border: isOpen ? '1px solid rgba(34,197,94,0.35)' : '1px solid var(--border)',
                    transition: 'border 0.2s',
                  }}
                >
                  {/* Question */}
                  <button
                    id={`faq-btn-${key}`}
                    onClick={() => toggle(key)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '16px 20px',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{
                      fontFamily: 'var(--font-syne)',
                      fontWeight: '600',
                      fontSize: '14px',
                      color: isOpen ? 'var(--accent)' : 'var(--text-primary)',
                      lineHeight: 1.4,
                      transition: 'color 0.2s',
                    }}>
                      {item.q}
                    </span>
                    <span style={{
                      fontSize: '18px',
                      color: 'var(--text-muted)',
                      transform: isOpen ? 'rotate(45deg)' : 'rotate(0)',
                      transition: 'transform 0.2s',
                      flexShrink: 0,
                    }}>
                      +
                    </span>
                  </button>

                  {/* Answer */}
                  {isOpen && (
                    <div style={{
                      padding: '0 20px 16px',
                      borderTop: '1px solid var(--border)',
                      paddingTop: '14px',
                    }}>
                      <p style={{
                        margin: 0,
                        fontSize: '13.5px',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.7,
                      }}>
                        {item.a}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Footer Contact */}
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: '14px',
        padding: '24px',
        textAlign: 'center',
        marginTop: '8px',
      }}>
        <p style={{ fontSize: '24px', margin: '0 0 8px' }}>🙋</p>
        <p style={{ fontFamily: 'var(--font-syne)', fontWeight: '700', fontSize: '15px', margin: '0 0 6px' }}>
          Masih ada pertanyaan?
        </p>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
          Hubungi administrator sistem atau lihat dokumentasi teknis di repositori proyek.
        </p>
      </div>
    </div>
  )
}
