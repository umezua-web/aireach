import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">ダッシュボード</h1>
      <p className="text-sm text-gray-500">ログイン中: {user.email}</p>
    </div>
  )
}
