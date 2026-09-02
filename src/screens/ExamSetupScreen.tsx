import { useEffect, useMemo, useState } from 'react'
import { Trash2, Search, CheckSquare, Square, Library } from 'lucide-react'
import { bankSizeWarning, mergeAndStrip, mergeKeepAnswers, type TeacherExamSource } from '../data/examContent'
import { publishSession } from '../lib/exam-api'
import { deleteExamSource, loadExamSources, loadScriptUrl, saveScriptUrl, saveSessionTeacherBank } from '../lib/exam-db'
import { useAppStore } from '../store/appStore'

function randomSessionCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export default function ExamSetupScreen() {
  const showToast = useAppStore((s) => s.showToast)
  const setScreen = useAppStore((s) => s.setScreen)

  const [scriptUrl, setScriptUrl] = useState('')
  const [savedSources, setSavedSources] = useState<TeacherExamSource[]>([])
  const [selectedMaDe, setSelectedMaDe] = useState<Set<string>>(new Set())

  const [timKiemMaDe, setTimKiemMaDe] = useState('')

  const [lop, setLop] = useState('')
  const [thoiGianPhut, setThoiGianPhut] = useState(45)
  const [immediateFeedback, setImmediateFeedback] = useState(false)
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

  const dsDeLoc = useMemo(() => {
    const q = timKiemMaDe.trim().toLowerCase()
    if (!q) return savedSources
    return savedSources.filter((c) => c.maDe.toLowerCase().includes(q))
  }, [savedSources, timKiemMaDe])

  const tongCauDaChon = selectedSources.reduce((s, c) => s + c.phanI.length + c.phanII.length + c.phanIII.length, 0)

  const chonTatCa = () => setSelectedMaDe(new Set(dsDeLoc.map((c) => c.maDe)))
  const boChonTatCa = () => setSelectedMaDe((prev) => {
    const next = new Set(prev)
    for (const c of dsDeLoc) next.delete(c.maDe)
    return next
  })

  const handleOpenSession = async () => {
    if (!scriptUrl.trim()) return showToast('Chưa nhập link Apps Script', 'error')
    if (!lop.trim()) return showToast('Chưa nhập lớp', 'error')
    if (selectedSources.length === 0) return showToast('Chưa chọn đề nào cho ngân hàng câu hỏi của ca này', 'error')
    if (thoiGianPhut <= 0) return showToast('Thời gian làm bài phải lớn hơn 0', 'error')

    setOpening(true)
    try {
      const maCa = randomSessionCode()
      const publicBank = mergeAndStrip(selectedSources)
      const keyBank = immediateFeedback ? mergeKeepAnswers(selectedSources) : undefined
      await publishSession(scriptUrl.trim(), maCa, lop.trim(), thoiGianPhut, publicBank, immediateFeedback, keyBank)
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
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm">2. Chọn đề từ ngân hàng câu hỏi cho ca này</h2>
          <button
            onClick={() => setScreen('nganhangde')}
            className="tap-target flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 font-medium"
          >
            <Library size={14} /> Ngân hàng câu hỏi
          </button>
        </div>

        {savedSources.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-600 p-4 text-center space-y-2">
            <p className="text-xs text-slate-500">Ngân hàng câu hỏi chưa có đề nào — thả file vào kho-de/moi/ trên máy rồi đồng bộ.</p>
            <button
              onClick={() => setScreen('nganhangde')}
              className="tap-target inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold px-4"
            >
              <Library size={16} /> Mở Ngân hàng câu hỏi
            </button>
          </div>
        ) : (
          <>
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="tap-target w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 pl-8 pr-3 text-sm"
                placeholder="Tìm theo mã đề…"
                value={timKiemMaDe}
                onChange={(e) => setTimKiemMaDe(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3 text-xs">
              <button onClick={chonTatCa} className="tap-target flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-medium">
                <CheckSquare size={14} /> Chọn tất cả
              </button>
              <button onClick={boChonTatCa} className="tap-target flex items-center gap-1 text-slate-500">
                <Square size={14} /> Bỏ chọn hết
              </button>
              {dsDeLoc.length !== savedSources.length && (
                <span className="text-slate-400">({dsDeLoc.length}/{savedSources.length} đề khớp tìm kiếm)</span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {dsDeLoc.map((c) => {
                const dangChon = selectedMaDe.has(c.maDe)
                const tongCau = c.phanI.length + c.phanII.length + c.phanIII.length
                return (
                  <button
                    key={c.maDe}
                    onClick={() => toggleSelect(c.maDe)}
                    className={`tap-target text-left rounded-xl border-2 p-3 transition-colors ${
                      dangChon
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-semibold text-sm truncate flex items-center gap-1.5">
                          {dangChon ? (
                            <CheckSquare size={15} className="shrink-0 text-indigo-600" />
                          ) : (
                            <Square size={15} className="shrink-0 text-slate-300" />
                          )}
                          Mã {c.maDe}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Phần I {c.phanI.length} · Phần II {c.phanII.length} · Phần III {c.phanIII.length} · tổng {tongCau} câu
                        </div>
                      </div>
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirm(`Xoá đề "${c.maDe}" khỏi ngân hàng câu hỏi? Không thể hoàn tác.`)) handleDeleteContent(c.maDe)
                        }}
                        className="tap-target shrink-0 text-slate-300 hover:text-rose-600"
                        title="Xoá đề này khỏi ngân hàng"
                      >
                        <Trash2 size={14} />
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>

            {selectedSources.length > 0 && (
              <div className="rounded-lg bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 px-3 py-2 text-xs text-indigo-700 dark:text-indigo-300">
                Đã chọn {selectedSources.length} đề · {tongCauDaChon} câu gộp vào ngân hàng câu hỏi của ca này.
              </div>
            )}
            {sizeWarning && (
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-300 dark:border-amber-800 p-3 text-xs text-amber-700 dark:text-amber-300">
                {sizeWarning}
              </div>
            )}
          </>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-sm">3. Lớp &amp; thời gian</h2>
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
        <label className="tap-target flex items-start gap-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2.5">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={immediateFeedback}
            onChange={(e) => setImmediateFeedback(e.target.checked)}
          />
          <span className="text-sm">
            <b>Cho học sinh xem điểm ngay sau khi nộp bài</b>
            <div className="text-xs text-slate-500 mt-0.5">
              Hiện popup điểm chi tiết + câu sai ngay trên máy em. Đánh đổi: đáp án của ca này sẽ có trong máy chủ để
              trả về — chỉ bật khi KHÔNG lo lộ đề giữa các em (vd mỗi em thi giờ riêng, hoặc đề không dùng lại).
            </div>
          </span>
        </label>
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
