import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// 特徴タグ → PostgREST の or() 項目リスト
// 各タグは「項目同士を OR したもの」で表現する（項目が and(...) のこともある）
function tagConditions(year: number): Record<string, string[]> {
  return {
    hp_yes:      ['and(hp_url.not.is.null,hp_url.neq.)'],
    hp_no:       ['hp_url.is.null', 'hp_url.eq.'],
    phone_yes:   ['and(phone.not.is.null,phone.neq.)'],
    phone_no:    ['phone.is.null', 'phone.eq.'],
    email_yes:   ['email.not.is.null', 'contact_url.not.is.null'],
    founded_3y:  [`founded_year.gte.${year - 3}`],
    founded_10y: [`founded_year.gte.${year - 10}`],
    founded_30y: [`founded_year.lte.${year - 30}`],
    founded_50y: [`founded_year.lte.${year - 50}`],
  }
}

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
  const tags       = p.getAll('tag')
  const tagMode    = p.get('tag_mode') === 'all' ? 'all' : 'any'
  const limit      = Math.min(parseInt(p.get('limit') ?? '200'), 5000)

  const supabase = await createAdminClient()

  let q = supabase
    .from('companies')
    .select(
      'houjin_bangou,company_name,industry_major,industry_minor,prefecture,founded_year,employee_range,revenue_range,hp_url,phone,email,contact_url,representative_name',
      { count: 'estimated' }
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

  // 特徴タグ
  if (tags.length) {
    const conds = tagConditions(new Date().getFullYear())
    const valid = tags.filter(t => conds[t])
    if (tagMode === 'any') {
      // いずれかを含む: 全タグの条件をひとつの OR にまとめる
      const items = valid.flatMap(t => conds[t])
      if (items.length) q = q.or(items.join(','))
    } else {
      // すべてを含む: タグごとに OR を張り、タグ間は AND
      for (const t of valid) q = q.or(conds[t].join(','))
    }
  }

  const { data, count, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data, count })
}
