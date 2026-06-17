-- ============================================================
-- FIX: RLS Policy untuk tabel store_settings
-- Jalankan ini di Supabase Dashboard → SQL Editor
-- ============================================================

-- Pastikan RLS aktif
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

-- Hapus policy lama jika ada (agar tidak duplikat)
DROP POLICY IF EXISTS "Allow authenticated read store_settings" ON store_settings;
DROP POLICY IF EXISTS "Allow authenticated update store_settings" ON store_settings;
DROP POLICY IF EXISTS "Allow authenticated insert store_settings" ON store_settings;

-- Izinkan semua user yang login untuk READ store_settings
CREATE POLICY "Allow authenticated read store_settings"
ON store_settings FOR SELECT
TO authenticated
USING (true);

-- Izinkan semua user yang login untuk UPDATE store_settings
CREATE POLICY "Allow authenticated update store_settings"
ON store_settings FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Izinkan semua user yang login untuk INSERT store_settings
CREATE POLICY "Allow authenticated insert store_settings"
ON store_settings FOR INSERT
TO authenticated
WITH CHECK (true);
