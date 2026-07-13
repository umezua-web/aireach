'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, X, Globe, Phone, Mail, ChevronDown } from 'lucide-react'
import IndustryDialog from './IndustryDialog'

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
  const [inputVal, setInputVal]           = useState('')
  const [keyword, setKeyword]             = useState('')
  const [selectedMajors, setSelectedMajors] = useState<string[]>([])
  const [selectedMinors, setSelectedMinors] = useState<string[]>([])
  const [selectedPrefs, setSelectedPrefs] = useState<string[]>([])
  const [selectedEmps, setSelectedEmps]   = useState<string[]>([])
  const [selectedRevs, setSelectedRevs]   = useState<string[]>([])
  const [noHp, setNoHp]                   = useState(false)
  const [noPhone, setNoPhone]             = useState(false)
  const [companies, setCompanies]         = useState<Company[]>([])
  const [count, setCount]                 = useState<number | null>(null)
  const [loading, setLoading]             = useState(false)
  const [filterOpts, setFilterOpts]       = useState<FilterOptions | null>(null)
  const [showIndustryDlg, setShowIndustryDlg] = useState(false)
  const [showPrefDlg, setShowPrefDlg]     = useState(false)
  const [showEmpDlg, setShowEmpDlg]       = useState(false)
  const [showRevDlg, setShowRevDlg]       = useState(false)

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
    selectedEmps.forEach(e => params.append('emp', e))
    selectedRevs.forEach(r => params.append('rev', r))
    if (noHp)    params.set('no_hp', '1')
    if (noPhone) params.set('no_phone', '1')
    params.set('limit', '500')

    const res = await fetch(`/api/companies?${params}`)
    const json = await res.json()
    setCompanies(json.data ?? [])
    setCount(json.count ?? 0)
    setLoading(false)
  }, [keyword, selectedMajors, selectedMinors, selectedPrefs, selectedEmps, selectedRevs, noHp, noPhone])

  useEffect(() => { search() }, [search])

  function clearAll() {
    setKeyword(''); setInputVal('')
    setSelectedMajors([]); setSelectedMinors([])
    setSelectedPrefs([]); setSelectedEmps([]); setSelectedRevs([])
    setNoHp(false); setNoPhone(false)
  }

  const industryLabel = () => {
    const total = selectedMajors.length + selectedMinors.length
    if (total === 0) return '業種'
    if (total === 1) return selectedMajors[0] ?? selectedMinors[0]
    return `業種 (${total})`
  }

  const prefLabel = () => {
    if (selectedPrefs.length === 0) return '都道府県'
    if (selectedPrefs.length === 1) return selectedPrefs[0]
    return `${selectedPrefs[0]} 他${selectedPrefs.length - 1}件`
  }

  const empLabel = () => {
    if (selectedEmps.length === 0) return '従業員数'
    if (selectedEmps.length === 1) return selectedEmps[0]
    return `従業員数 (${selectedEmps.length})`
  }

  const revLabel = () => {
    if (selectedRevs.length === 0) return '売上'
    if (selectedRevs.length === 1) return selectedRevs[0]
    return `売上 (${selectedRevs.length})`
  }

  const hasFilters = keyword || selectedMajors.length || selectedMinors.length ||
    selectedPrefs.length || selectedEmps.length || selectedRevs.length || noHp || noPhone

  return (
    <div className="flex flex-col h-screen overflow-hidden">

      {/* トップバー */}
      <div className="bg-white border-b border-gray-100 px-6 py-3 flex-shrink-0">
        <div className="flex items-center gap-2 flex-wrap">

          {/* 企業名検索 */}
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') setKeyword(inputVal) }}
              placeholder="企業名で検索"
              className="pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-lg w-52 focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          {/* 業種 */}
          <button
            onClick={() => setShowIndustryDlg(true)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg border transition-colors ${
              selectedMajors.length || selectedMinors.length
                ? 'border-black bg-black text-white'
                : 'border-gray-200 text-gray-700 hover:border-gray-400'
            }`}
          >
            {industryLabel()}
            <ChevronDown size={13} />
          </button>

          {/* 都道府県 */}
          <button
            onClick={() => { setShowPrefDlg(v => !v); setShowEmpDlg(false); setShowRevDlg(false) }}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg border transition-colors ${
              selectedPrefs.length
                ? 'border-black bg-black text-white'
                : 'border-gray-200 text-gray-700 hover:border-gray-400'
            }`}
          >
            {prefLabel()}
            <ChevronDown size={13} />
          </button>

          {/* 都道府県ドロップダウン */}
          {showPrefDlg && filterOpts?.prefecture && (
            <div className="absolute top-16 z-40 bg-white border border-gray-200 rounded-xl shadow-lg p-3 w-72">
              <div className="grid grid-cols-4 gap-1 max-h-64 overflow-y-auto">
                {filterOpts.prefecture.map(p => (
                  <label key={p} className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedPrefs.includes(p)}
                      onChange={e => setSelectedPrefs(prev =>
                        e.target.checked ? [...prev, p] : prev.filter(x => x !== p)
                      )}
                      className="rounded"
                    />
                    <span className="text-xs text-gray-700">{p.replace('都','').replace('道','').replace('府','').replace('県','')}</span>
                  </label>
                ))}
              </div>
              <div className="flex justify-end mt-2 pt-2 border-t border-gray-100">
                <button onClick={() => setShowPrefDlg(false)}
                  className="px-3 py-1 bg-black text-white text-xs rounded-lg">適用</button>
              </div>
            </div>
          )}

          {/* 従業員数 */}
          <button
            onClick={() => { setShowEmpDlg(v => !v); setShowRevDlg(false); setShowPrefDlg(false) }}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg border transition-colors ${
              selectedEmps.length
                ? 'border-black bg-black text-white'
                : 'border-gray-200 text-gray-700 hover:border-gray-400'
            }`}
          >
            {empLabel()}
            <ChevronDown size={13} />
          </button>

          {showEmpDlg && filterOpts?.employee_range && (
            <div className="absolute top-16 z-40 bg-white border border-gray-200 rounded-xl shadow-lg p-3 w-52">
              <div className="flex flex-col gap-0.5">
                {filterOpts.employee_range.map(e => (
                  <label key={e} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedEmps.includes(e)}
                      onChange={ev => setSelectedEmps(prev =>
                        ev.target.checked ? [...prev, e] : prev.filter(x => x !== e)
                      )}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">{e}</span>
                  </label>
                ))}
              </div>
              <div className="flex justify-end mt-2 pt-2 border-t border-gray-100">
                <button onClick={() => setShowEmpDlg(false)}
                  className="px-3 py-1 bg-black text-white text-xs rounded-lg">適用</button>
              </div>
            </div>
          )}

          {/* 売上 */}
          <button
            onClick={() => { setShowRevDlg(v => !v); setShowEmpDlg(false); setShowPrefDlg(false) }}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg border transition-colors ${
              selectedRevs.length
                ? 'border-black bg-black text-white'
                : 'border-gray-200 text-gray-700 hover:border-gray-400'
            }`}
          >
            {revLabel()}
            <ChevronDown size={13} />
          </button>

          {showRevDlg && filterOpts?.revenue_range && (
            <div className="absolute top-16 z-40 bg-white border border-gray-200 rounded-xl shadow-lg p-3 w-52">
              <div className="flex flex-col gap-0.5">
                {filterOpts.revenue_range.map(r => (
                  <label key={r} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedRevs.includes(r)}
                      onChange={ev => setSelectedRevs(prev =>
                        ev.target.checked ? [...prev, r] : prev.filter(x => x !== r)
                      )}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">{r}</span>
                  </label>
                ))}
              </div>
              <div className="flex justify-end mt-2 pt-2 border-t border-gray-100">
                <button onClick={() => setShowRevDlg(false)}
                  className="px-3 py-1 bg-black text-white text-xs rounded-lg">適用</button>
              </div>
            </div>
          )}

          {/* HP/電話なし */}
          <label className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg border cursor-pointer transition-colors ${
            noHp ? 'border-black bg-black text-white' : 'border-gray-200 text-gray-700 hover:border-gray-400'
          }`}>
            <input type="checkbox" checked={noHp} onChange={e => setNoHp(e.target.checked)} className="sr-only" />
            HP未登録
          </label>

          <label className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg border cursor-pointer transition-colors ${
            noPhone ? 'border-black bg-black text-white' : 'border-gray-200 text-gray-700 hover:border-gray-400'
          }`}>
            <input type="checkbox" checked={noPhone} onChange={e => setNoPhone(e.target.checked)} className="sr-only" />
            電話未登録
          </label>

          {/* クリア */}
          {hasFilters && (
            <button onClick={clearAll}
              className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 px-2 py-2 transition-colors">
              <X size={13} /> クリア
            </button>
          )}

          {/* 件数 */}
          <div className="ml-auto flex items-center gap-2">
            {loading ? (
              <span className="text-sm text-gray-400">検索中...</span>
            ) : (
              <span className="text-sm font-medium text-gray-700">{(count ?? 0).toLocaleString()} 社</span>
            )}
            {count !== null && count >= 500 && (
              <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                500件表示中 — 絞り込んでください
              </span>
            )}
          </div>
        </div>
      </div>

      {/* テーブル */}
      <div className="flex-1 overflow-auto bg-white">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-gray-50 border-b border-gray-100 z-10">
            <tr>
              {['企業名','業種','小分類','都道府県','設立年','従業員','売上','連絡先'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {companies.map(c => (
              <tr key={c.houjin_bangou} className="hover:bg-gray-50 transition-colors cursor-pointer">
                <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">{c.company_name}</td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">{c.industry_major}</td>
                <td className="px-4 py-3 text-gray-400 whitespace-nowrap text-xs">{c.industry_minor}</td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">{c.prefecture}</td>
                <td className="px-4 py-3 text-gray-400 whitespace-nowrap text-xs">{c.founded_year ?? '–'}</td>
                <td className="px-4 py-3 text-gray-400 whitespace-nowrap text-xs">{c.employee_range ?? '–'}</td>
                <td className="px-4 py-3 text-gray-400 whitespace-nowrap text-xs">{c.revenue_range ?? '–'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {c.hp_url && (
                      <a href={c.hp_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                        <Globe size={13} className="text-blue-400 hover:text-blue-600" />
                      </a>
                    )}
                    {c.phone && <Phone size={13} className="text-green-400" />}
                    {(c.email || c.contact_url) && <Mail size={13} className="text-purple-400" />}
                    {!c.hp_url && !c.phone && !c.email && !c.contact_url && (
                      <span className="text-xs text-gray-300">–</span>
                    )}
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

      {/* 業種ダイアログ */}
      {showIndustryDlg && filterOpts?.industry_map && (
        <IndustryDialog
          industryMap={filterOpts.industry_map}
          selectedMajors={selectedMajors}
          selectedMinors={selectedMinors}
          onConfirm={(majors, minors) => { setSelectedMajors(majors); setSelectedMinors(minors) }}
          onClose={() => setShowIndustryDlg(false)}
        />
      )}
    </div>
  )
}
