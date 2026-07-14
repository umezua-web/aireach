// フィルタ選択肢マスターを companies テーブルから抽出して JSON に保存する
// 39万行の一括集計はSupabaseの8秒タイムアウトに掛かるため、
// キーセットページネーションで distinct 値を1件ずつ列挙する方式を取る。
//
// 実行: node scripts/build-filter-options.mjs
// 出力: src/data/filter-options.json

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

// .env.local から接続情報を読む
const env = Object.fromEntries(
  readFileSync(join(root, '.env.local'), 'utf8')
    .split('\n')
    .filter(l => l.includes('='))
    .map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
)
const BASE = `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/companies`
const HEADERS = {
  apikey: env.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
}

async function fetchRows(params) {
  for (let attempt = 1; attempt <= 6; attempt++) {
    const res = await fetch(`${BASE}?${params}`, { headers: HEADERS })
    if (res.ok) return res.json()
    const body = await res.text()
    if (attempt === 6) throw new Error(`${res.status}: ${body} (${params})`)
    await new Promise(r => setTimeout(r, 3000 * attempt))
  }
}

// 単一カラムの distinct 値をキーセットページネーションで列挙
async function distinctValues(column) {
  const values = []
  let last = null
  for (;;) {
    const filters = [`${column}=not.is.null`, `${column}=neq.`]
    if (last !== null) filters.push(`${column}=gt.${encodeURIComponent(last)}`)
    const rows = await fetchRows(
      `select=${column}&${filters.join('&')}&order=${column}&limit=1`
    )
    if (!rows.length) break
    last = rows[0][column]
    values.push(last)
    process.stdout.write(`\r${column}: ${values.length} 件`)
  }
  console.log()
  return values
}

// 特定の大分類に属する小分類を列挙
async function minorsOf(major) {
  const values = []
  let last = null
  const majorEnc = encodeURIComponent(major)
  for (;;) {
    const filters = [
      `industry_major=eq.${majorEnc}`,
      `industry_minor=not.is.null`,
      `industry_minor=neq.`,
    ]
    if (last !== null) filters.push(`industry_minor=gt.${encodeURIComponent(last)}`)
    const rows = await fetchRows(
      `select=industry_minor&${filters.join('&')}&order=industry_minor&limit=1`
    )
    if (!rows.length) break
    last = rows[0].industry_minor
    values.push(last)
  }
  return values
}

async function pooled(items, worker, concurrency = 5) {
  const results = new Array(items.length)
  let i = 0, done = 0
  async function run() {
    while (i < items.length) {
      const idx = i++
      results[idx] = await worker(items[idx])
      done++
      process.stdout.write(`\rindustry_map: ${done}/${items.length} 大分類`)
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, run))
  console.log()
  return results
}

// 途中結果を保存しながら進める（再実行時は済んだセクションをスキップ）
const outPath = join(root, 'src/data/filter-options.json')
const progressPath = join(root, 'src/data/.filter-options.partial.json')
mkdirSync(join(root, 'src/data'), { recursive: true })

let out = {}
try { out = JSON.parse(readFileSync(progressPath, 'utf8')) } catch {}

function saveProgress() {
  writeFileSync(progressPath, JSON.stringify(out))
}

if (!out.industry_map) {
  const majors = await distinctValues('industry_major')
  const minorLists = await pooled(majors, minorsOf)
  out.industry_map = Object.fromEntries(majors.map((m, i) => [m, minorLists[i]]))
  saveProgress()
} else {
  console.log(`industry_map: スキップ（取得済み ${Object.keys(out.industry_map).length} 大分類）`)
}

for (const col of ['prefecture', 'employee_range', 'revenue_range']) {
  if (!out[col]) {
    out[col] = await distinctValues(col)
    saveProgress()
  } else {
    console.log(`${col}: スキップ（取得済み ${out[col].length} 件）`)
  }
}

// --- 正規化 ---
// DBには「56人（2026/06時点）」のような実数混入や「京都」「宮崎県都」のような
// 表記ゆれがあるため、選択肢としては正規の値だけを出す（データ自体の清掃は別途）

const EMP_ORDER = ['20人未満','20-50人未満','50-100人未満','100-300人未満','300-1000人未満','1000-3000人未満','3000-10000人未満','10000人以上']
out.employee_range = EMP_ORDER.filter(v => out.employee_range.includes(v))

const REV_ORDER = ['3億未満','3億-20億未満','20億-100億未満','100億-500億未満','500億以上']
out.revenue_range = REV_ORDER.filter(v => out.revenue_range.includes(v))

const PREF_ORDER = ['北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県','茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県','新潟県','富山県','石川県','福井県','山梨県','長野県','岐阜県','静岡県','愛知県','三重県','滋賀県','京都府','大阪府','兵庫県','奈良県','和歌山県','鳥取県','島根県','岡山県','広島県','山口県','徳島県','香川県','愛媛県','高知県','福岡県','佐賀県','長崎県','熊本県','大分県','宮崎県','鹿児島県','沖縄県']
out.prefecture = PREF_ORDER.filter(v => out.prefecture.includes(v))

writeFileSync(outPath, JSON.stringify(out, null, 2))

const minorTotal = Object.values(out.industry_map).reduce((a, v) => a + v.length, 0)
console.log(`完了: 大分類${Object.keys(out.industry_map).length} / 小分類${minorTotal} / 都道府県${out.prefecture.length} / 従業員${out.employee_range.length} / 売上${out.revenue_range.length}`)
