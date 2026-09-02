import { useState } from 'react'
import { useAppStore } from '../store/appStore'
import { parseAnswerKeyText } from '../lib/answerkey-parse'

const PLACEHOLDER = `Mã đề: 101
Phần I: ABCDABCDABCDABCDAB
Phần II: DSDS SDSD DDSS SSDD
Phần III: -0,87 12 3,5 100 -5 0,25`

export default function AnswerKeyScreen() {
  const [text, setText] = useState('')
  const [errors, setErrors] = useState<string[]>([])
  const answerKeys = useAppStore((s) => s.answerKeys)
  const setAnswerKey = useAppStore((s) => s.setAnswerKey)
  const showToast = useAppStore((s) => s.showToast)

  const handleSave = () => {
    const result = parseAnswerKeyText(text)
    if (!result.ok || !result.key) {
      setErrors(result.errors)
      return
    }
    setErrors([])
    setAnswerKey(result.key.madeThi, result.key)
    showToast(`Đã lưu đáp án mã đề ${result.key.madeThi}`, 'success')
    setText('')
  }

  return (
    <div className="min-h-screen pb-24 px-4 pt-4 space-y-4 bg-slate-50 dark:bg-slate-950">
      <h1 className="text-xl font-bold">Đáp án & biểu điểm</h1>

      <textarea
        className="w-full h-40 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 p-3 text-sm font-mono"
        placeholder={PLACEHOLDER}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      {errors.length > 0 && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700 space-y-1">
          {errors.map((e, i) => (
            <div key={i}>• {e}</div>
          ))}
        </div>
      )}

      <button onClick={handleSave} className="tap-target w-full rounded-xl bg-indigo-600 text-white font-semibold">
        Lưu đáp án mã đề
      </button>

      <div className="text-xs text-slate-500 whitespace-pre-line">
        Biểu điểm cố định: Phần I 18×0,25=4,5 · Phần II theo số ý đúng (1 ý:0,1 · 2 ý:0,25 · 3 ý:0,5 · 4 ý:1,0), tối đa 4,0 · Phần III 6×0,25=1,5.
      </div>

      <div className="space-y-2">
        <h2 className="font-semibold text-sm text-slate-600 dark:text-slate-300">Đã lưu ({Object.keys(answerKeys).length} mã đề)</h2>
        {Object.values(answerKeys).map((k) => (
          <div key={k.madeThi} className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-sm bg-white dark:bg-slate-900">
            <div className="font-bold">Mã đề {k.madeThi}</div>
            <div className="text-slate-500">
              P.I: {k.phanI.join('')} · P.II: {k.phanII.map((g) => g.join('')).join(' ')} · P.III: {k.phanIII.join(' ')}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
