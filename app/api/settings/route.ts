import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

// GET: Ambil store_settings
export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('store_settings')
      .select('*')
      .single()

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST: Simpan store_settings (bypass RLS dengan admin client)
export async function POST(req: NextRequest) {
  try {
    // Verifikasi user sudah login dulu
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { id, store_name, address, phone, receipt_footer, qris_image_url } = body

    const adminClient = createAdminClient()

    const payload = {
      store_name: store_name || '',
      address: address || null,
      phone: phone || null,
      receipt_footer: receipt_footer || null,
      qris_image_url: qris_image_url || null,
      updated_at: new Date().toISOString(),
    }

    let result

    if (id) {
      // UPDATE row yang sudah ada
      const { error } = await adminClient
        .from('store_settings')
        .update(payload)
        .eq('id', id)

      if (error) {
        console.error('[API settings] UPDATE error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      result = { ...payload, id }
    } else {
      // INSERT row baru, ambil id yang digenerate
      const { data, error } = await adminClient
        .from('store_settings')
        .insert(payload)
        .select('id')
        .single()

      if (error) {
        console.error('[API settings] INSERT error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      result = { ...payload, id: data?.id }
    }

    return NextResponse.json({ success: true, data: result })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[API settings] Unexpected error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
