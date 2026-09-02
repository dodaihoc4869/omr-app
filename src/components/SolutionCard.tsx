// Thẻ "Xem lại lời giải" sau khi học sinh nộp bài — bấm vào 1 câu mới mở ra
// xem đầy đủ đề + đáp án đúng/sai + giải thích, mặc định GẬP để danh sách
// gọn, đúng yêu cầu "bấm vào sẽ hiển thị". Tái dùng ChemText/QuestionMedia
// để công thức, bảng, ảnh hiển thị y hệt lúc làm bài.
import { useState } from 'react'
import { Check, X as XIcon, ChevronDown, ChevronUp } from 'lucide-react'
import { ChemText } from '../lib/chem-format'
import QuestionMedia from './QuestionMedia'

// Cùng 1 bảng màu lặp lại theo chỉ số câu — KHÔNG gắn với chủ đề thật (app
// không có dữ liệu phân loại chủ đề), chỉ để phân biệt các thẻ cho dễ nhìn.
export const MAU_HEADER = [
  'from-indigo-500 to-indigo-600',
  'from-amber-500 to-amber-600',
  'from-emerald-500 to-emerald-600',
  'from-sky-500 to-sky-600',
  'from-violet-500 to-violet-600',
  'from-rose-500 to-rose-600',
  'from-teal-500 to-teal-600',
  'from-orange-500 to-orange-600',
]

function CardShell({
  mauIdx,
  tieuDe,
  soThuTu,
  dungHet,
  children,
}: {
  mauIdx: number
  tieuDe: string
  soThuTu: number
  dungHet: boolean | null // null = chưa trả lời
  children: React.ReactNode
}) {
  const [mo, setMo] = useState(false)
  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setMo((v) => !v)}
        className={`tap-target w-full flex items-center justify-between gap-2 px-3.5 py-3 text-left bg-gradient-to-r ${MAU_HEADER[mauIdx % MAU_HEADER.length]} text-white`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="shrink-0 w-7 h-7 rounded-full bg-white/25 flex items-center justify-center text-sm font-bold">{soThuTu}</span>
          <span className="font-semibold text-sm truncate">{tieuDe}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {dungHet === true && (
            <span className="w-5 h-5 rounded-full bg-white/25 flex items-center justify-center">
              <Check size={13} />
            </span>
          )}
          {dungHet === false && (
            <span className="w-5 h-5 rounded-full bg-white/25 flex items-center justify-center">
              <XIcon size={13} />
            </span>
          )}
          {mo ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>
      {mo && <div className="p-3.5 space-y-3">{children}</div>}
    </div>
  )
}

function ExplanationBox({ text }: { text?: string }) {
  return (
    <div className="rounded-lg bg-amber-50 dark:bg-amber-950/40 border-l-4 border-amber-400 px-3 py-2 text-sm italic text-amber-800 dark:text-amber-300">
      {text?.trim() ? <ChemText text={text} /> : 'Thầy chưa nhập lời giải cho câu này.'}
    </div>
  )
}

export function SolutionMcq({
  mauIdx,
  soThuTu,
  tieuDe,
  text,
  table,
  imageDataUrl,
  choices,
  choicePerm,
  correct,
  selected,
  explanation,
}: {
  mauIdx: number
  soThuTu: number
  tieuDe?: string
  text: string
  table?: string[][]
  imageDataUrl?: string
  choices: [string, string, string, string]
  choicePerm: number[]
  correct: 'A' | 'B' | 'C' | 'D'
  selected: 'A' | 'B' | 'C' | 'D' | null
  explanation?: string
}) {
  const dungHet = selected === null ? null : selected === correct
  return (
    <CardShell mauIdx={mauIdx} tieuDe={tieuDe?.trim() || `Câu ${soThuTu}`} soThuTu={soThuTu} dungHet={dungHet}>
      <div className="text-sm leading-relaxed">
        <ChemText text={text} />
      </div>
      <QuestionMedia table={table} imageDataUrl={imageDataUrl} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {choicePerm.map((origIdx, displayPos) => {
          const origLetter = 'ABCD'[origIdx] as 'A' | 'B' | 'C' | 'D'
          const displayLetter = 'ABCD'[displayPos]
          const laDung = origLetter === correct
          const laDaChonSai = !laDung && selected === origLetter
          return (
            <div
              key={displayPos}
              className={`rounded-lg border-2 px-3 py-2 text-sm flex items-start gap-2 ${
                laDung
                  ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 font-semibold'
                  : laDaChonSai
                    ? 'border-rose-400 bg-rose-50 dark:bg-rose-950/40'
                    : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <span className="shrink-0 font-bold">{displayLetter}.</span>
              <span className="flex-1">
                <ChemText text={choices[origIdx]} />
              </span>
            </div>
          )
        })}
      </div>
      <ExplanationBox text={explanation} />
    </CardShell>
  )
}

export function SolutionTrueFalse({
  mauIdx,
  soThuTu,
  tieuDe,
  text,
  table,
  imageDataUrl,
  ideas,
  correct,
  selected,
  explanation,
}: {
  mauIdx: number
  soThuTu: number
  tieuDe?: string
  text: string
  table?: string[][]
  imageDataUrl?: string
  ideas: [string, string, string, string]
  correct: ['D' | 'S', 'D' | 'S', 'D' | 'S', 'D' | 'S']
  selected: (('D' | 'S') | null)[]
  explanation?: string
}) {
  const soYDaTraLoi = selected.filter((v) => v !== null).length
  const soYDung = correct.filter((c, i) => selected[i] === c).length
  const dungHet = soYDaTraLoi === 0 ? null : soYDung === 4
  return (
    <CardShell mauIdx={mauIdx} tieuDe={tieuDe?.trim() || `Câu ${soThuTu}`} soThuTu={soThuTu} dungHet={dungHet}>
      <div className="text-sm leading-relaxed">
        <ChemText text={text} />
      </div>
      <QuestionMedia table={table} imageDataUrl={imageDataUrl} />
      <div className="space-y-2">
        {ideas.map((idea, i) => {
          const dung = selected[i] !== null && selected[i] === correct[i]
          const daTraLoi = selected[i] !== null
          return (
            <div key={i} className="flex items-start gap-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 px-2.5 py-2">
              <span
                className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white ${
                  !daTraLoi ? 'bg-slate-300 dark:bg-slate-600' : dung ? 'bg-emerald-600' : 'bg-rose-600'
                }`}
              >
                {daTraLoi ? dung ? <Check size={13} /> : <XIcon size={13} /> : '?'}
              </span>
              <span className="text-sm flex-1">
                <b className="text-slate-500">{'abcd'[i]})</b> <ChemText text={idea} />
              </span>
            </div>
          )
        })}
      </div>
      <ExplanationBox text={explanation} />
    </CardShell>
  )
}

export function SolutionShortAnswer({
  mauIdx,
  soThuTu,
  tieuDe,
  text,
  table,
  imageDataUrl,
  correct,
  selected,
  explanation,
}: {
  mauIdx: number
  soThuTu: number
  tieuDe?: string
  text: string
  table?: string[][]
  imageDataUrl?: string
  correct: string
  selected: string | null
  explanation?: string
}) {
  const norm = (s: string) => s.trim().replace(',', '.')
  const daTraLoi = !!selected?.trim()
  const dung = daTraLoi ? norm(selected ?? '') === norm(correct) : null
  return (
    <CardShell mauIdx={mauIdx} tieuDe={tieuDe?.trim() || `Câu ${soThuTu}`} soThuTu={soThuTu} dungHet={dung}>
      <div className="text-sm leading-relaxed">
        <ChemText text={text} />
      </div>
      <QuestionMedia table={table} imageDataUrl={imageDataUrl} />
      <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 px-3 py-2 flex items-center gap-2">
        <span className="text-xs text-slate-500 shrink-0">Đáp án:</span>
        <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
          <ChemText text={correct} />
        </span>
      </div>
      {daTraLoi && (
        <div className={`rounded-lg border px-3 py-2 flex items-center gap-2 text-sm ${dung ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' : 'border-rose-300 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400'}`}>
          Em đã chọn: <b>{selected}</b>
        </div>
      )}
      {!daTraLoi && <div className="text-xs text-slate-400">Em chưa trả lời câu này.</div>}
      <ExplanationBox text={explanation} />
    </CardShell>
  )
}
