'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Search, ChevronDown, ChevronRight } from 'lucide-react'

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
  const [expandedMajors, setExpandedMajors] = useState<Set<string>>(new Set(Object.keys(industryMap)))
  const [searchKw, setSearchKw] = useState('')
  const dialogRef = useRef<HTMLDivElement>(null)

  // Escキーで閉じる
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
      // 大分類選択時は配下の小分類チェックを外す
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
      // 全小分類が選ばれたら大分類にまとめる
      const allSelected = minors.every(m => m === minor || newMinors.has(m))
      if (allSelected) {
        minors.forEach(m => newMinors.delete(m))
        newMajors.add(major)
      }
    }
    setLocalMinors(newMinors)
    setLocalMajors(newMajors)
  }

  function selectAll() {
    setLocalMajors(new Set(Object.keys(industryMap)))
    setLocalMinors(new Set())
  }

  function clearAll() {
    setLocalMajors(new Set())
    setLocalMinors(new Set())
  }

  function handleConfirm() {
    onConfirm(Array.from(localMajors), Array.from(localMinors))
    onClose()
  }

  const totalSelected = localMajors.size + localMinors.size

  // 検索フィルタ
  const filteredMap = searchKw
    ? Object.fromEntries(
        Object.entries(industryMap)
          .map(([major, minors]) => {
            if (major.includes(searchKw)) return [major, minors]
            const matched = (minors as string[]).filter(m => m.includes(searchKw))
            return matched.length ? [major, matched] : null
          })
          .filter(Boolean) as [string, string[]][]
      )
    : industryMap

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* オーバーレイ */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />

      {/* ダイアログ */}
      <div ref={dialogRef} className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden mx-4">

        {/* ヘッダー */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">業種を選択</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* 検索 + 全選択 */}
        <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchKw}
              onChange={e => setSearchKw(e.target.value)}
              placeholder="業種を検索..."
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <button onClick={selectAll} className="text-xs text-gray-500 hover:text-gray-900 transition-colors whitespace-nowrap">すべて選択</button>
          <button onClick={clearAll} className="text-xs text-gray-500 hover:text-gray-900 transition-colors whitespace-nowrap">すべて解除</button>
        </div>

        {/* 業種リスト */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {Object.entries(filteredMap).map(([major, minors]) => {
            const isMajorChecked = localMajors.has(major)
            const someMinorsChecked = (minors as string[]).some(m => localMinors.has(m))
            const isExpanded = expandedMajors.has(major)

            return (
              <div key={major} className="mb-0.5">
                {/* 大分類 */}
                <div className="flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-gray-50 group">
                  <button
                    onClick={() => setExpandedMajors(p => {
                      const n = new Set(p)
                      n.has(major) ? n.delete(major) : n.add(major)
                      return n
                    })}
                    className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                  >
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                  <label className="flex items-center gap-2.5 flex-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isMajorChecked}
                      ref={el => { if (el) el.indeterminate = !isMajorChecked && someMinorsChecked }}
                      onChange={() => toggleMajor(major)}
                      className="rounded border-gray-300 text-black focus:ring-black"
                    />
                    <span className="text-sm font-semibold text-gray-800">{major}</span>
                    <span className="text-xs text-gray-400">（{(minors as string[]).length}）</span>
                  </label>
                </div>

                {/* 小分類 */}
                {isExpanded && !isMajorChecked && (
                  <div className="ml-8 mb-1">
                    {(minors as string[]).map(minor => (
                      <label key={minor} className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={localMinors.has(minor)}
                          onChange={() => toggleMinor(minor, major)}
                          className="rounded border-gray-300 text-black focus:ring-black"
                        />
                        <span className="text-sm text-gray-600">{minor}</span>
                      </label>
                    ))}
                  </div>
                )}
                {isExpanded && isMajorChecked && (
                  <div className="ml-8 mb-1 px-3 py-1">
                    <span className="text-xs text-gray-400">全小分類が選択されています</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* フッター */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
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
              適用する {totalSelected > 0 && `(${totalSelected})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
