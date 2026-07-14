import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = await createAdminClient()

  const { data: list, error: listErr } = await admin
    .from('lists')
    .select('id, name, created_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (listErr) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: lc, error: lcErr } = await admin
    .from('list_companies')
    .select('houjin_bangou')
    .eq('list_id', id)

  if (lcErr) return NextResponse.json({ error: lcErr.message }, { status: 500 })

  const houjin_bangous = lc.map((r: { houjin_bangou: string }) => r.houjin_bangou)

  if (houjin_bangous.length === 0) {
    return NextResponse.json({ list, companies: [] })
  }

  const { data: companies, error: compErr } = await admin
    .from('companies')
    .select('houjin_bangou,company_name,industry_major,industry_minor,prefecture,founded_year,employee_range,revenue_range,hp_url,phone,email,contact_url')
    .in('houjin_bangou', houjin_bangous)

  if (compErr) return NextResponse.json({ error: compErr.message }, { status: 500 })

  return NextResponse.json({ list, companies })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = await createAdminClient()
  const { error } = await admin
    .from('lists')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
