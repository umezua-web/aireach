'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

type Props = {
  count: number
  onSave: (name: string) => Promise<void>
  onClose: () => void
}

export default function SaveListDialog({ count, onSave, onClose }: Props) {
  const [name, setName]       = useState('')
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleSave() {
    if (!name.trim()) { setError('リスト名を入力してください'); return }
    setSaving(true)
    try {
      await onSave(name.trim())
      onClose()
    } catch {
      setError('保存に失敗しました。再試行してください。')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">リストに保存</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <p className="text-sm text-gray-500">
          現在の検索結果 <span className="font-semibold text-gray-800">{count.toLocaleString()} 社</span> をリストに保存します。
        </p>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">リスト名</label>
          <input
            type="text"
            value={name}
            onChange={e => { setName(e.target.value); setError('') }}
            onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
            placeholder="例: 広告代理店リスト 2026/07"
            autoFocus
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
          />
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>

        <div className="flex gap-2 justify-end">
          <button onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
            キャンセル
          </button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors">
            {saving ? '保存中...' : '保存する'}
          </button>
        </div>
      </div>
    </div>
  )
}
