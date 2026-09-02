import { sheetHasUnreviewedFlag, useAppStore, type ScannedSheet } from '../store/appStore'
import type { Choice, DS, GradedItem, ItemFlag } from '../engine/score'
import { isReviewFlag } from '../engine/score'

const FLAG_LABEL: Record<string, string> = {
  WARN_ERASURE: 'Nghi tẩy mờ / tô nhạt',
  ERR_DOUBLE_MARK: 'Tô 2 đáp án trở lên',
  EMPTY: 'Bỏ trống',
}

function FlagBadge({ flag }: { flag: ItemFlag }) {
  if (!flag) return null
  const color = flag === 'ERR_DOUBLE_MARK' ? 'bg-rose-100 text-rose-700' : flag === 'WARN_ERASURE' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
  return <span className={`text-xs px-2 py-0.5 rounded-full ${color}`}>{FLAG_LABEL[flag] ?? flag}</span>
}

function ChoiceSelect<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T | null
  options: T[]
  onChange: (v: T | null) => void
}) {
  return (
    <select
      className="tap-target border border-slate-300 rounded-lg px-2 text-sm bg-white dark:bg-slate-800 dark:border-slate-600"
      value={value ?? ''}
      onChange={(e) => onChange((e.target.value || null) as T | null)}
    >
      <option value="">— trống —</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  )
}

function SheetReviewCard({ sheet }: { sheet: ScannedSheet }) {
  const updateSheetAnswers = useAppStore((s) => s.updateSheetAnswers)
  const markReviewed = useAppStore((s) => s.markReviewed)

  const setPhanI = (i: number, v: Choice | null) => {
    const phanI = sheet.answers.phanI.slice()
    phanI[i] = { value: v, flag: null }
    updateSheetAnswers(sheet.id, { ...sheet.answers, phanI })
  }
  const setPhanII = (q: number, idea: number, v: DS | null) => {
    const phanII = sheet.answers.phanII.map((arr) => arr.slice())
    phanII[q][idea] = { value: v, flag: null }
    updateSheetAnswers(sheet.id, { ...sheet.answers, phanII })
  }
  const setPhanIII = (i: number, v: string) => {
    const phanIII = sheet.answers.phanIII.slice()
    phanIII[i] = { value: v || null, flag: v ? null : 'EMPTY' }
    updateSheetAnswers(sheet.id, { ...sheet.answers, phanIII })
  }

  const flaggedPhanI = sheet.answers.phanI
    .map((a, i) => ({ a, i }))
    .filter((x) => isReviewFlag(x.a.flag))
  const flaggedPhanII = sheet.answers.phanII.flatMap((q, qi) =>
    q.map((a, idea) => ({ a, qi, idea })).filter((x) => isReviewFlag(x.a.flag)),
  )
  const flaggedPhanIII = sheet.answers.phanIII
    .map((a, i) => ({ a, i }))
    .filter((x) => isReviewFlag(x.a.flag))

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-3 bg-white dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-bold">{sheet.hoTen || '(chưa rõ tên)'} — SBD {sheet.answers.sbd}</div>
          <div className="text-sm text-slate-500">Mã đề {sheet.answers.madeThi} · {sheet.lop}</div>
        </div>
        {!sheet.sbdKnown && <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">SBD lạ</span>}
      </div>

      {sheet.imageDataUrl && (
        <img src={sheet.imageDataUrl} alt="Ảnh phiếu đã quét" className="w-full rounded-lg border border-slate-200 dark:border-slate-700" />
      )}

      <div className="space-y-2">
        {flaggedPhanI.map(({ a, i }) => (
          <div key={`I${i}`} className="flex items-center justify-between gap-2">
            <div className="text-sm">Phần I — câu {i + 1} <FlagBadge flag={a.flag} /></div>
            <ChoiceSelect value={a.value as GradedItem<Choice>['value']} options={['A', 'B', 'C', 'D']} onChange={(v) => setPhanI(i, v)} />
          </div>
        ))}
        {flaggedPhanII.map(({ a, qi, idea }) => (
          <div key={`II${qi}-${idea}`} className="flex items-center justify-between gap-2">
            <div className="text-sm">Phần II — câu {qi + 1} ý {idea + 1} <FlagBadge flag={a.flag} /></div>
            <ChoiceSelect value={a.value as GradedItem<DS>['value']} options={['D', 'S']} onChange={(v) => setPhanII(qi, idea, v)} />
          </div>
        ))}
        {flaggedPhanIII.map(({ a, i }) => (
          <div key={`III${i}`} className="flex items-center justify-between gap-2">
            <div className="text-sm">Phần III — câu {i + 1} <FlagBadge flag={a.flag} /></div>
            <input
              className="tap-target border border-slate-300 rounded-lg px-2 text-sm w-24 bg-white dark:bg-slate-800 dark:border-slate-600"
              defaultValue={a.value ?? ''}
              onBlur={(e) => setPhanIII(i, e.target.value)}
            />
          </div>
        ))}
        {!sheet.sbdKnown && (
          <div className="text-sm text-slate-600 dark:text-slate-300">
            SBD {sheet.answers.sbd} không có trong danh sách lớp — kiểm tra lại ảnh, sửa số báo danh trực tiếp trên bảng Kết quả nếu máy đọc sai.
          </div>
        )}
      </div>

      <button
        onClick={() => markReviewed(sheet.id)}
        className="tap-target w-full rounded-xl bg-indigo-600 text-white font-semibold"
      >
        Đã xem, xác nhận
      </button>
    </div>
  )
}

export default function ReviewScreen() {
  const sheets = useAppStore((s) => s.sheets)
  const flagged = sheets.filter(sheetHasUnreviewedFlag)

  return (
    <div className="min-h-screen pb-24 px-4 pt-4 space-y-4 bg-slate-50 dark:bg-slate-950">
      <h1 className="text-xl font-bold">Duyệt cờ</h1>
      {flagged.length === 0 ? (
        <div className="text-slate-500 text-sm">Không có phiếu nào cần duyệt.</div>
      ) : (
        flagged.map((s) => <SheetReviewCard key={s.id} sheet={s} />)
      )}
    </div>
  )
}
