'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Globe, Phone, Mail, ChevronDown, ChevronUp, Download, BookmarkPlus } from 'lucide-react'
import IndustryDialog    from './IndustryDialog'
import PrefectureDialog  from './PrefectureDialog'
import SaveListDialog    from './SaveListDialog'

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

// アコーディオンセクション
function FilterSection({ title, active, children, defaultOpen = false }: {
  title: string
  active?: boolean
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-gray-100">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center justify-between w-full px-4 py-3 text-left"
      >
        <span className="flex items-center gap-1.5 text-sm text-gray-700">
          <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-teal-500' : 'bg-gray-200'}`} />
          {title}
        </span>
        {open ? <ChevronUp size={13} className="text-gray-400" /> : <ChevronDown size={13} className="text-gray-400" />}
      </button>
      {open && <div className="px-4 pb-3">{children}</div>}
    </div>
  )
}

export default function ListsPage() {
  // 検索条件（入力中の値）
  const [nameKw, setNameKw]               = useState('')
  const [hpKw, setHpKw]                   = useState('')
  const [phoneKw, setPhoneKw]             = useState('')
  const [selectedMajors, setSelectedMajors] = useState<string[]>([])
  const [selectedMinors, setSelectedMinors] = useState<string[]>([])
  const [selectedPrefs, setSelectedPrefs] = useState<string[]>([])
  const [selectedEmps, setSelectedEmps]   = useState<string[]>([])
  const [selectedRevs, setSelectedRevs]   = useState<string[]>([])
  const [yearFrom, setYearFrom]           = useState('')
  const [yearTo, setYearTo]               = useState('')
  const [noHp, setNoHp]                   = useState(false)
  const [noPhone, setNoPhone]             = useState(false)

  // 結果
  const [companies, setCompanies] = useState<Company[]>([])
  const [count, setCount]         = useState<number | null>(null)
  const [loading, setLoading]     = useState(false)
  const [searched, setSearched]   = useState(false)

  const [filterOpts, setFilterOpts] = useState<FilterOptions | null>(null)
  const [showIndustryDlg, setShowIndustryDlg] = useState(false)
  const [showPrefDlg, setShowPrefDlg]         = useState(false)
  const [showSaveDlg, setShowSaveDlg]         = useState(false)
  const [savedNotice, setSavedNotice]         = useState('')

  useEffect(() => {
    fetch('/api/filter-options').then(r => r.json()).then(setFilterOpts)
  }, [])

  const search = useCallback(async () => {
    setLoading(true)
    setSearched(true)
    const params = new URLSearchParams()
    if (nameKw)  params.set('keyword', nameKw)
    if (hpKw)    params.set('hp', hpKw)
    if (phoneKw) params.set('phone', phoneKw)
    selectedMajors.forEach(m => params.append('major', m))
    selectedMinors.forEach(m => params.append('minor', m))
    selectedPrefs.forEach(p => params.append('pref', p))
    selectedEmps.forEach(e => params.append('emp', e))
    selectedRevs.forEach(r => params.append('rev', r))
    if (yearFrom) params.set('year_from', yearFrom)
    if (yearTo)   params.set('year_to', yearTo)
    if (noHp)     params.set('no_hp', '1')
    if (noPhone)  params.set('no_phone', '1')
    params.set('limit', '500')

    const res = await fetch(`/api/companies?${params}`)
    const json = await res.json()
    setCompanies(json.data ?? [])
    setCount(json.count ?? 0)
    setLoading(false)
  }, [nameKw, hpKw, phoneKw, selectedMajors, selectedMinors, selectedPrefs, selectedEmps, selectedRevs, yearFrom, yearTo, noHp, noPhone])

  // 初回のみ全件表示
  useEffect(() => { search() /* eslint-disable-line react-hooks/exhaustive-deps */ }, [])

  function clearAll() {
    setNameKw(''); setHpKw(''); setPhoneKw('')
    setSelectedMajors([]); setSelectedMinors([])
    setSelectedPrefs([]); setSelectedEmps([]); setSelectedRevs([])
    setYearFrom(''); setYearTo('')
    setNoHp(false); setNoPhone(false)
  }

  function exportCsv() {
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
    a.href = url; a.download = `aireach_export_${Date.now()}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  async function saveList(name: string) {
    const res = await fetch('/api/lists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, houjin_bangous: companies.map(c => c.houjin_bangou) }),
    })
    if (!res.ok) throw new Error('save failed')
    setSavedNotice(`「${name}」に ${companies.length} 社を保存しました`)
    setTimeout(() => setSavedNotice(''), 4000)
  }

  const industryCount = selectedMajors.length + selectedMinors.length
  const inputCls = 'w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-gray-300'
  const selectBtnCls = 'w-full py-1.5 text-sm text-teal-600 border border-teal-500 rounded-lg hover:bg-teal-50 transition-colors'

  return (
    <div className="flex h-screen overflow-hidden">

      {/* ===== 左：検索条件サイドバー ===== */}
      <div className="w-64 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col">
        <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-sm font-semibold text-gray-900">条件検索</h2>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* 企業名 */}
          <FilterSection title="企業名" active={!!nameKw} defaultOpen>
            <input
              type="text" value={nameKw}
              onChange={e => setNameKw(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') search() }}
              placeholder="企業名を入力..."
              className={inputCls}
            />
          </FilterSection>

          {/* ホームページ */}
          <FilterSection title="ホームページ" active={!!hpKw || noHp}>
            <input
              type="text" value={hpKw}
              onChange={e => setHpKw(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') search() }}
              placeholder="URLを自由に入力..."
              className={inputCls}
            />
            <label className="flex items-center gap-2 mt-2 cursor-pointer">
              <input type="checkbox" checked={noHp} onChange={e => setNoHp(e.target.checked)} className="rounded" />
              <span className="text-xs text-gray-600">HP未登録のみ</span>
            </label>
          </FilterSection>

          {/* 所在地 */}
          <FilterSection title="所在地" active={!!selectedPrefs.length}>
            <button onClick={() => setShowPrefDlg(true)} className={selectBtnCls}>
              所在地を選択
            </button>
            {selectedPrefs.length > 0 && (
              <p className="text-xs text-gray-500 mt-1.5">{selectedPrefs.length} 件選択中</p>
            )}
          </FilterSection>

          {/* 代表電話番号 */}
          <FilterSection title="代表電話番号" active={!!phoneKw || noPhone}>
            <input
              type="text" value={phoneKw}
              onChange={e => setPhoneKw(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') search() }}
              placeholder="電話番号を入力..."
              className={inputCls}
            />
            <label className="flex items-center gap-2 mt-2 cursor-pointer">
              <input type="checkbox" checked={noPhone} onChange={e => setNoPhone(e.target.checked)} className="rounded" />
              <span className="text-xs text-gray-600">電話未登録のみ</span>
            </label>
          </FilterSection>

          {/* 業種 */}
          <FilterSection title="業種" active={!!industryCount}>
            <button onClick={() => setShowIndustryDlg(true)} className={selectBtnCls}>
              業種を選択
            </button>
            {industryCount > 0 && (
              <p className="text-xs text-gray-500 mt-1.5">{industryCount} 件選択中</p>
            )}
          </FilterSection>

          {/* 従業員数 */}
          <FilterSection title="従業員数" active={!!selectedEmps.length}>
            <div className="flex flex-col gap-0.5">
              {filterOpts?.employee_range?.map(e => (
                <label key={e} className="flex items-center gap-2 py-1 cursor-pointer">
                  <input type="checkbox" checked={selectedEmps.includes(e)}
                    onChange={ev => setSelectedEmps(prev => ev.target.checked ? [...prev, e] : prev.filter(x => x !== e))}
                    className="rounded" />
                  <span className="text-xs text-gray-600">{e}</span>
                </label>
              ))}
            </div>
          </FilterSection>

          {/* 売上 */}
          <FilterSection title="売上" active={!!selectedRevs.length}>
            <div className="flex flex-col gap-0.5">
              {filterOpts?.revenue_range?.map(r => (
                <label key={r} className="flex items-center gap-2 py-1 cursor-pointer">
                  <input type="checkbox" checked={selectedRevs.includes(r)}
                    onChange={ev => setSelectedRevs(prev => ev.target.checked ? [...prev, r] : prev.filter(x => x !== r))}
                    className="rounded" />
                  <span className="text-xs text-gray-600">{r}</span>
                </label>
              ))}
            </div>
          </FilterSection>

          {/* 設立年 */}
          <FilterSection title="設立年" active={!!(yearFrom || yearTo)}>
            <div className="flex items-center gap-2">
              <input
                type="number" value={yearFrom}
                onChange={e => setYearFrom(e.target.value)}
                placeholder="1990"
                className={`${inputCls} w-20`}
              />
              <span className="text-xs text-gray-400">〜</span>
              <input
                type="number" value={yearTo}
                onChange={e => setYearTo(e.target.value)}
                placeholder="2026"
                className={`${inputCls} w-20`}
              />
            </div>
          </FilterSection>
        </div>

        {/* 下部固定ボタン */}
        <div className="p-3 border-t border-gray-100 flex flex-col gap-2 flex-shrink-0">
          <button onClick={clearAll}
            className="flex items-center justify-center gap-1 w-full py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:border-gray-400 hover:text-gray-700 transition-colors">
            <X size={13} /> 検索条件をクリア
          </button>
          <button onClick={search} disabled={loading}
            className="w-full py-2.5 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors">
            {loading ? '検索中...' : '検索する'}
          </button>
        </div>
      </div>

      {/* ===== 右：結果テーブル ===== */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white">

        {/* 結果ヘッダー */}
        <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-3 flex-shrink-0">
          {loading ? (
            <span className="text-sm text-gray-400">検索中...</span>
          ) : (
            <span className="text-sm font-medium text-gray-700">
              {(count ?? 0).toLocaleString()} 社
            </span>
          )}
          {count !== null && count >= 500 && (
            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">500件表示中</span>
          )}

          <div className="ml-auto flex items-center gap-2">
            <button onClick={exportCsv} disabled={companies.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-900 disabled:opacity-40 transition-colors">
              <Download size={13} /> CSV
            </button>
            <button onClick={() => setShowSaveDlg(true)} disabled={companies.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-40 transition-colors">
              <BookmarkPlus size={13} /> リストに保存
            </button>
          </div>
        </div>

        {savedNotice && (
          <div className="mx-6 mt-2 text-xs text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2 flex-shrink-0">
            {savedNotice}
          </div>
        )}

        {/* テーブル */}
        <div className="flex-1 overflow-auto">
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
                <tr key={c.houjin_bangou} className="hover:bg-gray-50 transition-colors">
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
                        <a href={c.hp_url} target="_blank" rel="noopener noreferrer">
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
          {!loading && searched && companies.length === 0 && (
            <div className="flex items-center justify-center h-40 text-sm text-gray-400">
              条件に一致する企業がありません
            </div>
          )}
        </div>
      </div>

      {/* ダイアログ群 */}
      {showIndustryDlg && filterOpts?.industry_map && (
        <IndustryDialog
          industryMap={filterOpts.industry_map}
          selectedMajors={selectedMajors}
          selectedMinors={selectedMinors}
          onConfirm={(majors, minors) => { setSelectedMajors(majors); setSelectedMinors(minors) }}
          onClose={() => setShowIndustryDlg(false)}
        />
      )}
      {showPrefDlg && filterOpts?.prefecture && (
        <PrefectureDialog
          allPrefs={filterOpts.prefecture}
          selected={selectedPrefs}
          onConfirm={prefs => setSelectedPrefs(prefs)}
          onClose={() => setShowPrefDlg(false)}
        />
      )}
      {showSaveDlg && (
        <SaveListDialog
          count={companies.length}
          onSave={saveList}
          onClose={() => setShowSaveDlg(false)}
        />
      )}
    </div>
  )
}
