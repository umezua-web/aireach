'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  List,
  Bookmark,
  Send,
  GitBranch,
  Settings,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard',  label: 'ダッシュボード', icon: LayoutDashboard },
  { href: '/lists',      label: 'リスト管理',     icon: List },
  { href: '/mylists',    label: 'マイリスト',     icon: Bookmark },
  { href: '/outbound',   label: 'アウトバウンド', icon: Send },
  { href: '/pipeline',   label: 'パイプライン',   icon: GitBranch },
  { href: '/settings',   label: '設定',           icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 min-h-screen bg-white border-r border-gray-100 flex flex-col">
      {/* ロゴ */}
      <div className="px-6 py-5 border-b border-gray-100">
        <span className="text-lg font-bold tracking-tight text-gray-900">AI REACH</span>
      </div>

      {/* ナビ */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon size={16} strokeWidth={1.75} />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
