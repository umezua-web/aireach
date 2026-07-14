'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

export type TagMode = 'any' | 'all'

type Props = {
  selected: string[]
  mode: TagMode
  onConfirm: (tags: string[], mode: TagMode) => void
  onClose: () => void
}

// 現在のマスターデータから導出できる特徴タグ
// （上場区分・展示会出展などは元データが必要なため、データ拡充後に追加する）
export const TAG_GROUPS: { group: string; tags: { id: string; label: string }[] }[] = [
  {
    group: '連絡先情報',
    tags: [
      { id: 'hp_yes',    label: 'HPあり' },
      { id: 'hp_no',     label: 'HPなし' },
      { id: 'phone_yes', label: '電話番号あり' },
      { id: 'phone_no',  label: '電話番号なし' },
      { id: 'email_yes', label: 'メール・問い合わせフォームあり' },
    ],
  },
  {
    group: '企業年齢',
    tags: [
      { id: 'founded_3y',  label: '設立3年以内' },
      { id: 'founded_10y', label: '設立10年以内' },
      { id: 'founded_30y', label: '設立30年以上' },
      { id: 'founded_50y', label: '設立50年以上（老舗）' },
    ],
  },
]

export default function FeatureTagDialog({ selected, mode, onConfirm, onClose }: Props) {
  const [local, setLocal]         = useState<Set<string>>(new Set(selected))
  const [localMode, setLocalMode] = useState<TagMode>(mode)

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  function toggle(id: string) {
    setLocal(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function clearAll() { setLocal(new Set()) }

  function handleConfirm() {
    onConfirm(Array.from(local), localMode)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[80vh] flex flex-col overflow-hidden mx-4">

        {/* ヘッダー */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-base font-semibold text-gray-900">特徴タグを選択</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* 一致条件 */}
        <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-4 flex-shrink-0 bg-gray-50">
          <span className="text-xs font-semibold text-gray-600">一致条件</span>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="radio" name="tagmode" checked={localMode === 'any'}
              onChange={() => setLocalMode('any')} className="text-teal-600" />
            <span className="text-xs text-gray-700">いずれかの選択肢を含む</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="radio" name="tagmode" checked={localMode === 'all'}
              onChange={() => setLocalMode('all')} className="text-teal-600" />
            <span className="text-xs text-gray-700">すべての選択肢を含む</span>
          </label>
          <button onClick={clearAll}
            className="ml-auto text-xs text-gray-500 hover:text-gray-900 transition-colors">
            すべて解除
          </button>
        </div>

        {/* タググリッド */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {TAG_GROUPS.map(({ group, tags }) => (
            <div key={group} className="mb-5">
              <p className="text-sm font-bold text-gray-800 mb-2">{group}</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 pl-1">
                {tags.map(t => (
                  <label key={t.id} className="flex items-center gap-2 py-1 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={local.has(t.id)}
                      onChange={() => toggle(t.id)}
                      className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 flex-shrink-0"
                    />
                    <span className="text-xs text-gray-600 group-hover:text-gray-900 transition-colors">
                      {t.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
          <p className="text-xs text-gray-400 border-t border-gray-100 pt-3">
            上場区分・売上推移・採用状況などのタグは、データ拡充後に追加予定です。
          </p>
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
              className="px-5 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors">
              確定する {local.size > 0 && `(${local.size})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
