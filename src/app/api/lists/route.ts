import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = await createAdminClient()
  const { data, error } = await admin
    .from('lists')
    .select('id, name, created_at, list_companies(count)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, houjin_bangous } = await req.json()
  if (!name || !Array.isArray(houjin_bangous)) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const admin = await createAdminClient()

  const { data: list, error: listErr } = await admin
    .from('lists')
    .insert({ name, user_id: user.id })
    .select('id')
    .single()

  if (listErr) return NextResponse.json({ error: listErr.message }, { status: 500 })

  if (houjin_bangous.length > 0) {
    const rows = houjin_bangous.map((h: string) => ({ list_id: list.id, houjin_bangou: h }))
    const { error: compErr } = await admin.from('list_companies').insert(rows)
    if (compErr) return NextResponse.json({ error: compErr.message }, { status: 500 })
  }

  return NextResponse.json({ id: list.id }, { status: 201 })
}
