import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { count: totalCompanies } = await supabase
    .from('companies')
    .select('*', { count: 'exact', head: true })

  const { count: noHp } = await supabase
    .from('companies')
    .select('*', { count: 'exact', head: true })
    .or('hp_url.is.null,hp_url.eq.')

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-xl font-bold text-gray-900 mb-1">ダッシュボード</h1>
      <p className="text-sm text-gray-400 mb-8">{user?.email}</p>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="マスターDB" value={totalCompanies?.toLocaleString() ?? '–'} unit="社" />
        <StatCard label="HP未登録" value={noHp?.toLocaleString() ?? '–'} unit="社" />
        <StatCard label="エンリッチ済み" value="–" unit="社" />
      </div>
    </div>
  )
}

function StatCard({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 px-6 py-5">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">
        {value}
        <span className="text-sm font-normal text-gray-400 ml-1">{unit}</span>
      </p>
    </div>
  )
}
