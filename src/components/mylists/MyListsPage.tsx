'use client'

import { useState, useEffect } from 'react'
import { Trash2, Download, Globe, Phone, Mail, ChevronLeft } from 'lucide-react'

type ListItem = {
  id: string
  name: string
  created_at: string
  list_companies: { count: number }[]
}

type Company = {
  houjin_bangou: string
  company_name: string
  industry_major: string
  industry_minor: string
  prefecture: string
  founded_year: number | null
  employee_range: string
  revenue_range: string
  hp_url: string
  phone: string
  email: string
  contact_url: string
}

export default function MyListsPage() {
  const [lists, setLists]           = useState<ListItem[]>([])
  const [loading, setLoading]       = useState(true)
  const [selected, setSelected]     = useState<ListItem | null>(null)
  const [companies, setCompanies]   = useState<Company[]>([])
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    fetch('/api/lists').then(r => r.json()).then(j => {
      setLists(j.data ?? [])
      setLoading(false)
    })
  }, [])

  async function openList(item: ListItem) {
    setSelected(item)
    setDetailLoading(true)
    const res = await fetch(`/api/lists/${item.id}`)
    const json = await res.json()
    setCompanies(json.companies ?? [])
    setDetailLoading(false)
  }

  async function deleteList(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm('このリストを削除しますか？')) return
    await fetch(`/api/lists/${id}`, { method: 'DELETE' })
    setLists(prev => prev.filter(l => l.id !== id))
    if (selected?.id === id) { setSelected(null); setCompanies([]) }
  }

  function exportCsv() {
    if (!selected) return
    const header = ['法人番号','企業名','業種','小分類','都道府県','設立年','従業員数','売上','HP','電話','メール']
    const rows = companies.map(c => [
      c.houjin_bangou, c.company_name, c.industry_major, c.industry_minor,
      c.prefecture, c.founded_year ?? '', c.employee_range ?? '', c.revenue_range ?? '',
      c.hp_url ?? '', c.phone ?? '', c.email ?? '',
    ])
    const csv = [header, ...rows]
      .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `${selected.name}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('ja-JP', { year:'numeric', month:'2-digit', day:'2-digit' })
  }

  const companyCount = (item: ListItem) => item.list_companies?.[0]?.count ?? 0

  // リスト詳細ビュー
  if (selected) {
    return (
      <div className="flex flex-col h-screen overflow-hidden">
        <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center gap-3 flex-shrink-0">
          <button onClick={() => { setSelected(null); setCompanies([]) }}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors">
            <ChevronLeft size={15} /> リスト一覧
          </button>
          <span className="text-gray-300">|</span>
          <h1 className="text-sm font-semibold text-gray-900">{selected.name}</h1>
          <span className="text-xs text-gray-400">{formatDate(selected.created_at)}</span>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-gray-600">{companies.length.toLocaleString()} 社</span>
            <button onClick={exportCsv} disabled={companies.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:border-gray-400 disabled:opacity-40 transition-colors">
              <Download size={13} /> CSV
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-white">
          {detailLoading ? (
            <div className="flex items-center justify-center h-40 text-sm text-gray-400">読み込み中...</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 border-b border-gray-100">
                <tr>
                  {['企業名','業種','小分類','都道府県','従業員','売上','連絡先'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {companies.map(c => (
                  <tr key={c.houjin_bangou} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">{c.company_name}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">{c.industry_major}</td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap text-xs">{c.industry_minor}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">{c.prefecture}</td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap text-xs">{c.employee_range ?? '–'}</td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap text-xs">{c.revenue_range ?? '–'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {c.hp_url && <a href={c.hp_url} target="_blank" rel="noopener noreferrer"><Globe size={13} className="text-blue-400 hover:text-blue-600" /></a>}
                        {c.phone && <Phone size={13} className="text-green-400" />}
                        {(c.email || c.contact_url) && <Mail size={13} className="text-purple-400" />}
                        {!c.hp_url && !c.phone && !c.email && !c.contact_url && <span className="text-xs text-gray-300">–</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    )
  }

  // リスト一覧ビュー
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="bg-white border-b border-gray-100 px-6 py-3 flex-shrink-0">
        <h1 className="text-sm font-semibold text-gray-900">マイリスト</h1>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-sm text-gray-400">読み込み中...</div>
        ) : lists.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 gap-3">
            <p className="text-sm text-gray-500">リストがまだありません</p>
            <p className="text-xs text-gray-400">リスト管理ページで企業を絞り込み、「リストに保存」してください</p>
          </div>
        ) : (
          <div className="grid gap-3 max-w-2xl">
            {lists.map(item => (
              <div key={item.id}
                onClick={() => openList(item)}
                className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-center justify-between hover:border-gray-400 cursor-pointer transition-colors group"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900 group-hover:text-black">{item.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {companyCount(item).toLocaleString()} 社 · {formatDate(item.created_at)}
                  </p>
                </div>
                <button
                  onClick={e => deleteList(item.id, e)}
                  className="text-gray-300 hover:text-red-500 transition-colors p-1"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
