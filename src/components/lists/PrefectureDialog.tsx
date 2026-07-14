'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

type Props = {
  allPrefs: string[]
  selected: string[]
  onConfirm: (prefs: string[]) => void
  onClose: () => void
}

const REGIONS: Record<string, string[]> = {
  '北海道': ['北海道'],
  '東北':   ['青森県','岩手県','宮城県','秋田県','山形県','福島県'],
  '関東':   ['茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県'],
  '中部':   ['新潟県','富山県','石川県','福井県','山梨県','長野県','岐阜県','静岡県','愛知県'],
  '近畿':   ['三重県','滋賀県','京都府','大阪府','兵庫県','奈良県','和歌山県'],
  '中国':   ['鳥取県','島根県','岡山県','広島県','山口県'],
  '四国':   ['徳島県','香川県','愛媛県','高知県'],
  '九州・沖縄': ['福岡県','佐賀県','長崎県','熊本県','大分県','宮崎県','鹿児島県','沖縄県'],
}

export default function PrefectureDialog({ allPrefs, selected, onConfirm, onClose }: Props) {
  const [local, setLocal] = useState<Set<string>>(new Set(selected))

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  function togglePref(p: string) {
    setLocal(prev => {
      const next = new Set(prev)
      next.has(p) ? next.delete(p) : next.add(p)
      return next
    })
  }

  function toggleRegion(region: string) {
    const prefs = REGIONS[region].filter(p => allPrefs.includes(p))
    const allChecked = prefs.every(p => local.has(p))
    setLocal(prev => {
      const next = new Set(prev)
      prefs.forEach(p => allChecked ? next.delete(p) : next.add(p))
      return next
    })
  }

  function selectAll() { setLocal(new Set(allPrefs)) }
  function clearAll()  { setLocal(new Set()) }

  function handleConfirm() {
    onConfirm(Array.from(local))
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden mx-4">

        {/* ヘッダー */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-base font-semibold text-gray-900">所在地を選択</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* 全選択 */}
        <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-3 flex-shrink-0">
          <button onClick={selectAll}
            className="text-xs text-gray-500 hover:text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors">
            すべて選択する
          </button>
          <button onClick={clearAll}
            className="text-xs text-gray-500 hover:text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors">
            選択をすべて解除する
          </button>
          {local.size > 0 && (
            <span className="text-xs text-gray-500 ml-auto">{local.size} 件選択中</span>
          )}
        </div>

        {/* 地域グリッド */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {Object.entries(REGIONS).map(([region, prefs]) => {
            const available = prefs.filter(p => allPrefs.includes(p))
            if (available.length === 0) return null
            const allChecked  = available.every(p => local.has(p))
            const someChecked = available.some(p => local.has(p))

            return (
              <div key={region} className="mb-4">
                <label className="flex items-center gap-2 mb-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    ref={el => { if (el) el.indeterminate = !allChecked && someChecked }}
                    onChange={() => toggleRegion(region)}
                    className="rounded border-gray-300 text-black focus:ring-black"
                  />
                  <span className="text-sm font-bold text-gray-800 group-hover:text-black transition-colors">
                    {region}
                  </span>
                </label>
                <div className="grid grid-cols-4 gap-x-3 gap-y-0.5 pl-5">
                  {available.map(p => (
                    <label key={p} className="flex items-center gap-1.5 py-1 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={local.has(p)}
                        onChange={() => togglePref(p)}
                        className="rounded border-gray-300 text-black focus:ring-black flex-shrink-0"
                      />
                      <span className="text-xs text-gray-600 group-hover:text-gray-900 transition-colors">
                        {p.replace('都','').replace('道','').replace('府','').replace('県','')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* フッター */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
          <span className="text-sm text-gray-500">
            {local.size > 0 ? `${local.size} 件選択中` : '未選択'}
          </span>
          <div className="flex gap-2">
            <button onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
              キャンセル
            </button>
            <button onClick={handleConfirm}
              className="px-5 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
              確定する {local.size > 0 && `(${local.size})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
