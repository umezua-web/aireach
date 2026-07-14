import { NextResponse } from 'next/server'
import filterOptions from '@/data/filter-options.json'

// フィルタ選択肢はビルド時に同梱した静的マスターから返す。
// 39万行の都度集計（get_filter_options RPC）はSupabaseの8秒タイムアウトに掛かるため廃止。
// マスターの再生成: node scripts/build-filter-options.mjs
export async function GET() {
  return NextResponse.json(filterOptions)
}
