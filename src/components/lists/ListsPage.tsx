'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, SlidersHorizontal, X, Globe, Phone, Mail } from 'lucide-react'

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
  representative_name: string
}

type FilterOptions = {
  industry_map: Record<string, string[]>
  prefecture: string[]
  employee_range: string[]
  revenue_range: string[]
}

export default function ListsPage() {
  const [keyword, setKeyword] = useState('')
  const [inputVal, setInputVal] = useState('')
  const [selectedMajors, setSelectedMajors] = useState<string[]>([])
  const [selectedMinors, setSelectedMinors] = useState<string[]>([])
  const [selectedPrefs, setSelectedPrefs] = useState<string[]>([])
  const [noHp, setNoHp] = useState(false)
  const [noPhone, setNoPhone] = useState(false)
  const [companies, setCompanies] = useState<Company[]>([])
  const [count, setCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [filterOpts, setFilterOpts] = useState<FilterOptions | null>(null)
  const [showIndustry, setShowIndustry] = useState(false)

  useEffect(() => {
    fetch('/api/filter-options').then(r => r.json()).then(setFilterOpts)
  }, [])

  const search = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (keyword) params.set('keyword', keyword)
    selectedMajors.forEach(m => params.append('major', m))
    selectedMinors.forEach(m => params.append('minor', m))
    selectedPrefs.forEach(p => params.append('pref', p))
    if (noHp) params.set('no_hp', '1')
    if (noPhone) params.set('no_phone', '1')
    params.set('limit', '500')

    const res = await fetch(`/api/companies?${params}`)
    const json = await res.json()
    setCompanies(json.data ?? [])
    setCount(json.count ?? 0)
    setLoading(false)
  }, [keyword, selectedMajors, selectedMinors, selectedPrefs, noHp, noPhone])

  useEffect(() => { search() }, [search])

  function clearAll() {
    setKeyword(''); setInputVal('')
    setSelectedMajors([]); setSelectedMinors([])
    setSelectedPrefs([]); setNoHp(false); setNoPhone(false)
  }

  const hasFilters = keyword || selectedMajors.length || selectedMinors.length ||
    selectedPrefs.length || noHp || noPhone

  return (
    <div className="flex h-[calc(100vh-0px)]">
      {/* サイドバー フィルター */}
      <aside className="w-60 border-r border-gray-100 bg-white flex flex-col overflow-y-auto flex-shrink-0">
        <div className="p-4 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">絞り込み</p>

          {/* 企業名 */}
          <div className="relative mb-3">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') setKeyword(inputVal) }}
              placeholder="企業名"
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          {/* 業種 */}
          <button
            onClick={() => setShowIndustry(v => !v)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm border mb-2 transition-colors ${
              selectedMajors.length || selectedMinors.length
                ? 'border-black text-black font-medium'
                : 'border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span>業種</span>
              {(selectedMajors.length || selectedMinors.length) ? (
                <span className="text-xs bg-black text-white rounded-full px-1.5">{selectedMajors.length + selectedMinors.length}</span>
              ) : (
                <SlidersHorizontal size={13} className="text-gray-400" />
              )}
            </div>
          </button>

          {showIndustry && filterOpts?.industry_map && (
            <div className="mb-3 border border-gray-100 rounded-lg overflow-hidden max-h-72 overflow-y-auto">
              {Object.entries(filterOpts.industry_map).map(([major, minors]) => (
                <div key={major}>
                  <label className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 cursor-pointer hover:bg-gray-100">
                    <input type="checkbox"
                      checked={selectedMajors.includes(major)}
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedMajors(p => [...p, major])
                          setSelectedMinors(p => p.filter(m => !(minors as string[]).includes(m)))
                        } else {
                          setSelectedMajors(p => p.filter(x => x !== major))
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-xs font-semibold text-gray-700">{major}</span>
                  </label>
                  {!selectedMajors.includes(major) && (minors as string[]).map(minor => (
                    <label key={minor} className="flex items-center gap-2 px-4 py-1 cursor-pointer hover:bg-gray-50">
                      <input type="checkbox"
                        checked={selectedMinors.includes(minor)}
                        onChange={e => {
                          setSelectedMinors(p => e.target.checked ? [...p, minor] : p.filter(x => x !== minor))
                        }}
                        className="rounded"
                      />
                      <span className="text-xs text-gray-600">{minor}</span>
                    </label>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* 都道府県 */}
          {filterOpts?.prefecture && (
            <select
              multiple
              value={selectedPrefs}
              onChange={e => setSelectedPrefs(Array.from(e.target.selectedOptions, o => o.value))}
              className="w-full text-sm border border-gray-200 rounded-lg p-2 mb-3 h-24 focus:outline-none focus:ring-2 focus:ring-black"
            >
              {filterOpts.prefecture.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          )}

          {/* HP/電話なし */}
          <div className="space-y-1.5 mb-3">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" checked={noHp} onChange={e => setNoHp(e.target.checked)} className="rounded" />
              HP URLなし
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" checked={noPhone} onChange={e => setNoPhone(e.target.checked)} className="rounded" />
              電話番号なし
            </label>
          </div>
        </div>

        <div className="p-4 space-y-2">
          <button onClick={search}
            className="w-full bg-black text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
            検索
          </button>
          {hasFilters && (
            <button onClick={clearAll}
              className="w-full text-gray-400 py-2 rounded-lg text-sm hover:text-gray-600 transition-colors flex items-center justify-center gap-1">
              <X size={13} /> クリア
            </button>
          )}
        </div>
      </aside>

      {/* メインコンテンツ */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* ヘッダー */}
        <div className="px-6 py-4 border-b border-gray-100 bg-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-900">
              {loading ? '検索中...' : `${(count ?? 0).toLocaleString()} 社`}
            </span>
            {count !== null && count >= 500 && (
              <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                500件表示中（絞り込んでください）
              </span>
            )}
          </div>
        </div>

        {/* テーブル */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-50 border-b border-gray-100">
              <tr>
                {['企業名','業種','小分類','都道府県','設立年','従業員','売上','連絡先'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {companies.map(c => (
                <tr key={c.houjin_bangou} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-2.5 font-medium text-gray-900 max-w-xs truncate">{c.company_name}</td>
                  <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">{c.industry_major}</td>
                  <td className="px-4 py-2.5 text-gray-400 whitespace-nowrap">{c.industry_minor}</td>
                  <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">{c.prefecture}</td>
                  <td className="px-4 py-2.5 text-gray-400 whitespace-nowrap">{c.founded_year ?? '–'}</td>
                  <td className="px-4 py-2.5 text-gray-400 whitespace-nowrap">{c.employee_range ?? '–'}</td>
                  <td className="px-4 py-2.5 text-gray-400 whitespace-nowrap">{c.revenue_range ?? '–'}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      {c.hp_url && <a href={c.hp_url} target="_blank" rel="noopener noreferrer"><Globe size={13} className="text-blue-400" /></a>}
                      {c.phone && <span title={c.phone}><Phone size={13} className="text-green-400" /></span>}
                      {(c.email || c.contact_url) && <Mail size={13} className="text-purple-400" />}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && companies.length === 0 && (
            <div className="flex items-center justify-center h-40 text-sm text-gray-400">
              条件に一致する企業がありません
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
