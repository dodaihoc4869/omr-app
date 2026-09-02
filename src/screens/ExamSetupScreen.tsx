import { useEffect, useState } from 'react'
import { bankSizeWarning, mergeAndStrip, validateTeacherSource, type TeacherExamSource } from '../data/examContent'
import { publishSession } from '../lib/exam-api'
import {
  deleteExamSource,
  loadExamSources,
  loadScriptUrl,
  saveExamSource,
  saveScriptUrl,
  saveSessionTeacherBank,
} from '../lib/exam-db'
import { parseExamText } from '../lib/exam-parse'
import { ChemText } from '../lib/chem-format'
import { useAppStore } from '../store/appStore'

function randomSessionCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

const SAMPLE_TEXT = `MÃ ĐỀ: de-01
PHẦN I
1) Chất nào sau đây là oxit axit?
A. CaO
*B. CO2
C. NaOH
D. HCl
2) Hoà tan hết 5,6 gam Fe bằng dung dịch H2SO4 loãng, dư thu được ion Fe^2+ và khí H2. ...(muốn ngân hàng đa dạng thì tải càng nhiều câu càng tốt, không bắt buộc đúng 18 câu)...
PHẦN II
1) Cho các phát biểu sau về nguyên tố X:
a) Phát biểu a (Đ)
b) Phát biểu b (S)
c) Phát biểu c (Đ)
d) Phát biểu d (S)
PHẦN III
1) Tính khối lượng chất X thu được...
=> 12,5`

export default function ExamSetupScreen() {
  const showToast = useAppStore((s) => s.showToast)
  const setScreen = useAppStore((s) => s.setScreen)

  const [scriptUrl, setScriptUrl] = useState('')
  const [savedSources, setSavedSources] = useState<TeacherExamSource[]>([])
  const [selectedMaDe, setSelectedMaDe] = useState<Set<string>>(new Set())

  const [draftText, setDraftText] = useState('')
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [parseWarnings, setParseWarnings] = useState<string[]>([])
  const [parsedPreview, setParsedPreview] = useState<TeacherExamSource | null>(null)

  const [lop, setLop] = useState('')
  const [thoiGianPhut, setThoiGianPhut] = useState(45)
  const [opening, setOpening] = useState(false)
  const [opened, setOpened] = useState<{ maCa: string; joinLink: string } | null>(null)

  useEffect(() => {
    loadScriptUrl().then(setScriptUrl)
    loadExamSources().then(setSavedSources)
  }, [])

  const handleSaveScriptUrl = async () => {
    await saveScriptUrl(scriptUrl.trim())
    showToast('Đã lưu link Apps Script trên máy này', 'success')
  }

  const handleParse = () => {
    const result = parseExamText(draftText)
    setParseErrors(result.errors)
    setParseWarnings(result.warnings)
    setParsedPreview(result.source)
    if (result.source) {
      const errs = validateTeacherSource(result.source)
      setParseErrors(errs)
      if (errs.length === 0) {
        showToast(
          `Đọc được "${result.source.maDe}" — ${result.source.phanI.length} câu Phần I, ${result.source.phanII.length} câu Phần II, ${result.source.phanIII.length} câu Phần III`,
          'success',
        )
      }
    }
  }

  const handleSaveContent = async () => {
    if (!parsedPreview) return
    const errors = validateTeacherSource(parsedPreview)
    if (errors.length > 0) {
      setParseErrors(errors)
      return
    }
    await saveExamSource(parsedPreview)
    const list = await loadExamSources()
    setSavedSources(list)
    setSelectedMaDe((prev) => new Set(prev).add(parsedPreview.maDe))
    showToast(`Đã lưu đề "${parsedPreview.maDe}" vào ngân hàng câu hỏi`, 'success')
    setDraftText('')
    setParsedPreview(null)
    setParseErrors([])
    setParseWarnings([])
  }

  const handleDeleteContent = async (maDe: string) => {
    await deleteExamSource(maDe)
    setSavedSources((prev) => prev.filter((c) => c.maDe !== maDe))
    setSelectedMaDe((prev) => {
      const next = new Set(prev)
      next.delete(maDe)
      return next
    })
  }

  const toggleSelect = (maDe: string) => {
    setSelectedMaDe((prev) => {
      const next = new Set(prev)
      if (next.has(maDe)) next.delete(maDe)
      else next.add(maDe)
      return next
    })
  }

  const selectedSources = savedSources.filter((c) => selectedMaDe.has(c.maDe))
  const sizeWarning = selectedSources.length > 0 ? bankSizeWarning(selectedSources) : null

  const handleOpenSession = async () => {
    if (!scriptUrl.trim()) return showToast('Chưa nhập link Apps Script', 'error')
    if (!lop.trim()) return showToast('Chưa nhập lớp', 'error')
    if (selectedSources.length === 0) return showToast('Chưa chọn đề nào cho ngân hàng câu hỏi của ca này', 'error')
    if (thoiGianPhut <= 0) return showToast('Thời gian làm bài phải lớn hơn 0', 'error')

    setOpening(true)
    try {
      const maCa = randomSessionCode()
      const publicBank = mergeAndStrip(selectedSources)
      await publishSession(scriptUrl.trim(), maCa, lop.trim(), thoiGianPhut, publicBank)
      // Lưu bản CÓ đáp án trên máy thầy để màn Theo dõi chấm lại được sau này.
      await saveSessionTeacherBank(maCa, selectedSources)
      const joinLink = `${location.origin}${location.pathname}?examCode=${maCa}&api=${encodeURIComponent(scriptUrl.trim())}`
      setOpened({ maCa, joinLink })
      showToast('Đã mở ca kiểm tra', 'success')
    } catch (e) {
      showToast(`Lỗi mở ca: ${e instanceof Error ? e.message : 'không rõ nguyên nhân'}`, 'error')
    } finally {
      setOpening(false)
    }
  }

  if (opened) {
    return (
      <div className="min-h-screen pb-24 px-4 pt-4 space-y-4 bg-slate-50 dark:bg-slate-950">
        <h1 className="text-xl font-bold">Ca kiểm tra đã mở</h1>
        <div className="rounded-xl bg-indigo-600 text-white p-6 text-center">
          <div className="text-sm opacity-90">Mã ca</div>
          <div className="text-4xl font-bold tracking-widest">{opened.maCa}</div>
        </div>
        <p className="text-sm text-slate-500">
          Gửi link sau cho học sinh (qua Zalo nhóm lớp) — học sinh mở link, chỉ cần nhập số báo danh là vào thi ngay:
        </p>
        <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 p-3 text-xs break-all">
          {opened.joinLink}
        </div>
        <button
          onClick={() => navigator.clipboard.writeText(opened.joinLink).then(() => showToast('Đã copy link', 'success'))}
          className="tap-target w-full rounded-xl bg-indigo-600 text-white font-semibold"
        >
          Copy link mời vào thi
        </button>
        <button
          onClick={() => setScreen('exammonitor')}
          className="tap-target w-full rounded-xl bg-white dark:bg-slate-800 border-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold"
        >
          Theo dõi bài nộp của ca này →
        </button>
        <button onClick={() => setOpened(null)} className="tap-target w-full text-sm text-slate-500">
          ← Mở ca khác
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24 px-4 pt-4 space-y-5 bg-slate-50 dark:bg-slate-950">
      <h1 className="text-xl font-bold">Soạn đề &amp; mở ca kiểm tra</h1>

      <section className="space-y-2">
        <h2 className="font-semibold text-sm">1. Link Apps Script nhận bài</h2>
        <p className="text-xs text-slate-500">
          Làm 1 lần: dán code file <code>docs/apps-script-kiem-tra.gs</code> vào script.google.com, triển khai làm Ứng
          dụng web, dán link /exec vào đây.
        </p>
        <input
          className="tap-target w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 text-sm"
          placeholder="https://script.google.com/macros/s/.../exec"
          value={scriptUrl}
          onChange={(e) => setScriptUrl(e.target.value)}
        />
        <button
          onClick={handleSaveScriptUrl}
          className="tap-target w-full rounded-lg bg-slate-200 dark:bg-slate-800 text-sm font-semibold"
        >
          Lưu link
        </button>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-sm">2. Tải đề vào ngân hàng câu hỏi (tải được nhiều đề, không giới hạn)</h2>
        <p className="text-xs text-slate-500">
          Mỗi lần dán 1 đề. Đúng định dạng: dòng đầu "MÃ ĐỀ: ...", "PHẦN I" (mỗi câu A. B. C. D., đặt <b>*</b> trước lựa
          chọn ĐÚNG), "PHẦN II" (mỗi ý ghi thêm (Đ) hoặc (S)), "PHẦN III" (dòng cuối "=&gt; đáp án"). Số câu mỗi phần
          KHÔNG cần đúng 18/4/6 — càng nhiều đề, mỗi học sinh càng ít trùng câu với nhau.
        </p>
        <p className="text-xs text-slate-500">
          Công thức Hoá: gõ số bình thường ngay sau chữ, app tự hiển thị chỉ số dưới (vd "H2SO4" →{' '}
          <ChemText text="H2SO4" />, "Fe2O3" → <ChemText text="Fe2O3" />). Điện tích đơn giản gõ liền dấu +/- (vd
          "Na+" → <ChemText text="Na+" />). Điện tích phức tạp (có cả số + dấu, vd ion SO4 2-) gõ rõ bằng dấu ^ để
          khỏi sai: "SO4^{'{2-}'}" → <ChemText text={'SO4^{2-}'} />. Mũi tên phản ứng gõ "-&gt;" hoặc "&lt;=&gt;" sẽ
          tự thành → hoặc ⇌.
        </p>
        <textarea
          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-mono"
          rows={10}
          placeholder={SAMPLE_TEXT}
          value={draftText}
          onChange={(e) => setDraftText(e.target.value)}
        />
        <button onClick={handleParse} className="tap-target w-full rounded-lg bg-slate-200 dark:bg-slate-800 text-sm font-semibold">
          Phân tích đề
        </button>
        {parseErrors.length > 0 && (
          <div className="rounded-lg bg-rose-50 dark:bg-rose-950 border border-rose-300 dark:border-rose-800 p-3 text-xs text-rose-700 dark:text-rose-300 space-y-1">
            {parseErrors.map((e, i) => (
              <div key={i}>• {e}</div>
            ))}
          </div>
        )}
        {parseWarnings.length > 0 && (
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-300 dark:border-amber-800 p-3 text-xs text-amber-700 dark:text-amber-300 space-y-1">
            {parseWarnings.map((w, i) => (
              <div key={i}>• {w}</div>
            ))}
          </div>
        )}
        {parsedPreview && parseErrors.length === 0 && (
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 p-3 text-xs text-emerald-700 dark:text-emerald-300 space-y-2">
            <div>
              "{parsedPreview.maDe}": {parsedPreview.phanI.length} câu Phần I, {parsedPreview.phanII.length} câu Phần
              II, {parsedPreview.phanIII.length} câu Phần III.
            </div>
            {parsedPreview.phanI[0] && (
              <div className="rounded-md bg-white/70 dark:bg-slate-900/50 px-2 py-1.5">
                Câu 1 Phần I (xem thử hiển thị): <ChemText text={parsedPreview.phanI[0].text} /> — đáp án đúng:{' '}
                <b>{parsedPreview.phanI[0].correct}</b>
              </div>
            )}
            <button onClick={handleSaveContent} className="tap-target w-full rounded-lg bg-emerald-600 text-white font-semibold">
              Lưu vào ngân hàng câu hỏi
            </button>
          </div>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-sm">3. Chọn (các) đề gộp thành ngân hàng cho ca này</h2>
        {savedSources.length === 0 && <p className="text-xs text-slate-500">Chưa có đề nào đã lưu.</p>}
        {savedSources.map((c) => (
          <label
            key={c.maDe}
            className="tap-target flex items-center justify-between rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3"
          >
            <span className="flex items-center gap-2">
              <input type="checkbox" checked={selectedMaDe.has(c.maDe)} onChange={() => toggleSelect(c.maDe)} />
              {c.maDe} ({c.phanI.length}+{c.phanII.length}+{c.phanIII.length} câu)
            </span>
            <button onClick={() => handleDeleteContent(c.maDe)} className="text-xs text-rose-600">
              Xoá
            </button>
          </label>
        ))}
        {sizeWarning && (
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-300 dark:border-amber-800 p-3 text-xs text-amber-700 dark:text-amber-300">
            {sizeWarning}
          </div>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-sm">4. Lớp &amp; thời gian</h2>
        <input
          className="tap-target w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3"
          placeholder="Lớp (vd 12A1)"
          value={lop}
          onChange={(e) => setLop(e.target.value)}
        />
        <div className="flex items-center gap-2">
          <input
            type="number"
            className="tap-target w-24 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3"
            value={thoiGianPhut}
            onChange={(e) => setThoiGianPhut(Number(e.target.value))}
          />
          <span className="text-sm text-slate-500">phút làm bài</span>
        </div>
      </section>

      <button
        onClick={handleOpenSession}
        disabled={opening}
        className="tap-target w-full rounded-xl bg-indigo-600 text-white font-semibold disabled:opacity-60"
      >
        {opening ? 'Đang mở ca…' : 'Mở ca kiểm tra'}
      </button>
    </div>
  )
}
