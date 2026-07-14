import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams
  const keyword    = p.get('keyword') ?? ''
  const majors     = p.getAll('major')
  const minors     = p.getAll('minor')
  const prefs      = p.getAll('pref')
  const empRanges  = p.getAll('emp')
  const revRanges  = p.getAll('rev')
  const noHp       = p.get('no_hp') === '1'
  const noPhone    = p.get('no_phone') === '1'
  const hpKw       = p.get('hp') ?? ''
  const phoneKw    = p.get('phone') ?? ''
  const yearFrom   = p.get('year_from')
  const yearTo     = p.get('year_to')
  const limit      = Math.min(parseInt(p.get('limit') ?? '200'), 5000)

  const supabase = await createAdminClient()

  let q = supabase
    .from('companies')
    .select(
      'houjin_bangou,company_name,industry_major,industry_minor,prefecture,founded_year,employee_range,revenue_range,hp_url,phone,email,contact_url,representative_name',
      { count: 'exact' }
    )
    .limit(limit)

  if (keyword) q = q.ilike('company_name', `%${keyword}%`)

  if (majors.length && minors.length) {
    const majorPart = `industry_major.in.(${majors.join(',')})`
    const minorPart = `industry_minor.in.(${minors.join(',')})`
    q = q.or(`${majorPart},${minorPart}`)
  } else if (majors.length) {
    q = q.in('industry_major', majors)
  } else if (minors.length) {
    q = q.in('industry_minor', minors)
  }

  if (prefs.length)     q = q.in('prefecture', prefs)
  if (empRanges.length) q = q.in('employee_range', empRanges)
  if (revRanges.length) q = q.in('revenue_range', revRanges)
  if (noHp)    q = q.or('hp_url.is.null,hp_url.eq.')
  if (noPhone) q = q.or('phone.is.null,phone.eq.')
  if (hpKw)     q = q.ilike('hp_url', `%${hpKw}%`)
  if (phoneKw)  q = q.ilike('phone', `%${phoneKw}%`)
  if (yearFrom) q = q.gte('founded_year', parseInt(yearFrom))
  if (yearTo)   q = q.lte('founded_year', parseInt(yearTo))

  const { data, count, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data, count })
}
