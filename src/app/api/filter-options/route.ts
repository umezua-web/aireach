import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// フィルタ選択肢はキャッシュテーブルから読む（39万行の都度集計はタイムアウトするため）
// キャッシュは supabase/migrations/003_filter_cache.sql で生成・更新する
export async function GET() {
  const supabase = await createAdminClient()

  const { data: cached, error: cacheErr } = await supabase
    .from('filter_options_cache')
    .select('data')
    .eq('id', 1)
    .single()

  if (!cacheErr && cached?.data) {
    return NextResponse.json(cached.data)
  }

  // キャッシュ未生成時のフォールバック（タイムアウトする可能性あり）
  const { data, error } = await supabase.rpc('get_filter_options')
  if (error) {
    return NextResponse.json(
      { error: `フィルタ選択肢が未生成です。003_filter_cache.sql を実行してください。(${error.message})` },
      { status: 500 }
    )
  }
  return NextResponse.json(data)
}
