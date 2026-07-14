'use client'

import { useState, useEffect } from 'react'
import { X, Search } from 'lucide-react'

type Props = {
  industryMap: Record<string, string[]>
  selectedMajors: string[]
  selectedMinors: string[]
  onConfirm: (majors: string[], minors: string[]) => void
  onClose: () => void
}

export default function IndustryDialog({ industryMap, selectedMajors, selectedMinors, onConfirm, onClose }: Props) {
  const [localMajors, setLocalMajors] = useState<Set<string>>(new Set(selectedMajors))
  const [localMinors, setLocalMinors] = useState<Set<string>>(new Set(selectedMinors))
  const [searchKw, setSearchKw]       = useState('')

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  function toggleMajor(major: string) {
    const minors = industryMap[major] ?? []
    const newMajors = new Set(localMajors)
    const newMinors = new Set(localMinors)
    if (newMajors.has(major)) {
      newMajors.delete(major)
    } else {
      newMajors.add(major)
      minors.forEach(m => newMinors.delete(m))
    }
    setLocalMajors(newMajors)
    setLocalMinors(newMinors)
  }

  function toggleMinor(minor: string, major: string) {
    const minors = industryMap[major] ?? []
    const newMinors = new Set(localMinors)
    const newMajors = new Set(localMajors)
    if (newMinors.has(minor)) {
      newMinors.delete(minor)
      newMajors.delete(major)
    } else {
      newMinors.add(minor)
      newMajors.delete(major)
      if (minors.every(m => m === minor || newMinors.has(m))) {
        minors.forEach(m => newMinors.delete(m))
        newMajors.add(major)
      }
    }
    setLocalMinors(newMinors)
    setLocalMajors(newMajors)
  }

  function selectAll() { setLocalMajors(new Set(Object.keys(industryMap))); setLocalMinors(new Set()) }
  function clearAll()  { setLocalMajors(new Set()); setLocalMinors(new Set()) }

  function handleConfirm() {
    onConfirm(Array.from(localMajors), Array.from(localMinors))
    onClose()
  }

  const filteredMap: Record<string, string[]> = searchKw
    ? Object.fromEntries(
        Object.entries(industryMap)
          .map(([major, minors]) => {
            if (major.includes(searchKw)) return [major, minors] as [string, string[]]
            const matched = minors.filter(m => m.includes(searchKw))
            return matched.length ? [major, matched] as [string, string[]] : null
          })
          .filter((x): x is [string, string[]] => x !== null)
      )
    : industryMap

  const totalSelected = localMajors.size + localMinors.size

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden mx-4">

        {/* ヘッダー */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-base font-semibold text-gray-900">業種を選択</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* 検索・全選択 */}
        <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-3 flex-shrink-0">
          <div className="relative flex-1 max-w-xs">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchKw}
              onChange={e => setSearchKw(e.target.value)}
              placeholder="業種を検索..."
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <button onClick={selectAll}
            className="text-xs text-gray-500 hover:text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors whitespace-nowrap">
            すべて選択する
          </button>
          <button onClick={clearAll}
            className="text-xs text-gray-500 hover:text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors whitespace-nowrap">
            選択をすべて解除する
          </button>
        </div>

        {/* 業種グリッド */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {Object.entries(filteredMap).map(([major, minors]) => {
            const isMajorChecked   = localMajors.has(major)
            const someMinorChecked = minors.some(m => localMinors.has(m))

            return (
              <div key={major} className="mb-5">
                {/* 大分類ヘッダー */}
                <label className="flex items-center gap-2 mb-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={isMajorChecked}
                    ref={el => { if (el) el.indeterminate = !isMajorChecked && someMinorChecked }}
                    onChange={() => toggleMajor(major)}
                    className="rounded border-gray-300 text-black focus:ring-black"
                  />
                  <span className="text-sm font-bold text-gray-800 group-hover:text-black transition-colors">
                    {major}
                  </span>
                </label>

                {/* 小分類グリッド（3列） */}
                {!isMajorChecked && (
                  <div className="grid grid-cols-3 gap-x-4 gap-y-0.5 pl-5">
                    {minors.map(minor => (
                      <label key={minor} className="flex items-center gap-2 py-1 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={localMinors.has(minor)}
                          onChange={() => toggleMinor(minor, major)}
                          className="rounded border-gray-300 text-black focus:ring-black flex-shrink-0"
                        />
                        <span className="text-xs text-gray-600 group-hover:text-gray-900 transition-colors leading-tight">
                          {minor}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
                {isMajorChecked && (
                  <p className="pl-5 text-xs text-gray-400">全小分類が選択されています</p>
                )}
              </div>
            )
          })}
        </div>

        {/* フッター */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
          <span className="text-sm text-gray-500">
            {totalSelected > 0 ? `${totalSelected} 件選択中` : '未選択'}
          </span>
          <div className="flex gap-2">
            <button onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
              キャンセル
            </button>
            <button onClick={handleConfirm}
              className="px-5 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
              確定する {totalSelected > 0 && `(${totalSelected})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
