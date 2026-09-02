import { useEffect, useMemo, useRef, useState } from 'react'
import type { PublicExamBank } from '../data/examContent'
import { assignStudentQuestions, type StudentAssignment } from '../lib/exam-assign'
import { fetchSession, submitAnswers } from '../lib/exam-api'
import { ChemText } from '../lib/chem-format'
import {
  cacheSession,
  emptyAnswerRecord,
  emptyIntegrityLog,
  loadAttempt,
  loadCachedSession,
  loadScriptUrl,
  saveAttempt,
  saveScriptUrl,
  type ExamAttempt,
} from '../lib/exam-db'
import { useAppStore } from '../store/appStore'

function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export default function ExamTakeScreen() {
  const showToast = useAppStore((s) => s.showToast)

  const [phase, setPhase] = useState<'join' | 'loading' | 'exam' | 'submitted' | 'error'>('join')
  const [errorMsg, setErrorMsg] = useState('')

  const [maCa, setMaCa] = useState('')
  const [sbd, setSbd] = useState('')
  const [scriptUrl, setScriptUrl] = useState('')

  const [bank, setBank] = useState<PublicExamBank | null>(null)
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null)
  // null = chưa tính lần nào (mới vào thi) — PHẢI phân biệt với 0 (đã hết giờ
  // thật sự), nếu không effect tự-nộp-bài bên dưới sẽ chạy với giá trị khởi
  // tạo 0 TRƯỚC khi effect đồng hồ kịp tính giờ thật, khiến bài tự nộp ngay
  // lập tức lúc vừa vào thi.
  const [remaining, setRemaining] = useState<number | null>(null)
  const retryTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const hiddenSinceRef = useRef<number | null>(null)

  // Đọc link mời (?examCode=...&api=...) — học sinh mở link chỉ cần gõ SBD.
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const codeFromUrl = params.get('examCode')
    const apiFromUrl = params.get('api')
    if (codeFromUrl) setMaCa(codeFromUrl)
    if (apiFromUrl) {
      setScriptUrl(apiFromUrl)
      saveScriptUrl(apiFromUrl)
    } else {
      loadScriptUrl().then(setScriptUrl)
    }
  }, [])

  const assignment: StudentAssignment | null = useMemo(() => {
    if (!bank || !maCa || !sbd) return null
    return assignStudentQuestions(bank, maCa.trim(), sbd.trim())
  }, [bank, maCa, sbd])

  const handleJoin = async () => {
    const ma = maCa.trim()
    const sb = sbd.trim()
    if (!ma || !sb) return showToast('Nhập đủ mã ca và số báo danh', 'error')
    setPhase('loading')
    try {
      const existing = await loadAttempt(ma, sb)
      if (existing?.submitted) {
        setAttempt(existing)
        setPhase('submitted')
        return
      }

      let cached = await loadCachedSession(ma)
      if (!cached) {
        if (!scriptUrl.trim())
          throw new Error('Chưa có link kết nối — mở đúng link thầy gửi, hoặc hỏi thầy mã ca + link Apps Script')
        const session = await fetchSession(scriptUrl.trim(), ma)
        if (!session.found || !session.bank) throw new Error('Không tìm thấy ca kiểm tra — kiểm tra lại mã ca')
        cached = { maCa: ma, lop: session.lop || '', thoiGianPhut: session.thoiGianPhut || 45, bank: session.bank }
        await cacheSession(cached)
      }
      setBank(cached.bank)

      const a: ExamAttempt =
        existing ?? {
          key: `${ma}:${sb}`,
          maCa: ma,
          sbd: sb,
          maDe: 'ngân hàng',
          startedAt: new Date().toISOString(),
          durationMinutes: cached.thoiGianPhut,
          answers: emptyAnswerRecord(),
          integrity: emptyIntegrityLog(),
          submitted: false,
          submittedAt: null,
          pendingSubmit: false,
        }
      if (!existing) await saveAttempt(a)
      setAttempt(a)
      setPhase('exam')
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Lỗi không rõ nguyên nhân')
      setPhase('error')
    }
  }

  // Đồng hồ đếm ngược: luôn tính lại từ startedAt (không cộng dồn setInterval) để không lệch giờ.
  useEffect(() => {
    if (phase !== 'exam' || !attempt) return
    const deadline = new Date(attempt.startedAt).getTime() + attempt.durationMinutes * 60000
    const tick = () => setRemaining((deadline - Date.now()) / 1000)
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [phase, attempt])

  // Ghi lại việc rời app (chuyển tab / tắt màn hình / mất focus) trong lúc làm bài — KHÔNG
  // thể phát hiện chụp ảnh màn hình bằng JavaScript (không trình duyệt nào cho phép), đây là
  // tín hiệu gần nhất có thể đo được để thầy tham khảo.
  useEffect(() => {
    if (phase !== 'exam') return
    const logEvent = (type: 'hidden' | 'visible' | 'blur' | 'focus') => {
      setAttempt((cur) => {
        if (!cur) return cur
        const events = [...cur.integrity.events, { type, at: new Date().toISOString() }].slice(-200)
        let leaveCount = cur.integrity.leaveCount
        let totalHiddenMs = cur.integrity.totalHiddenMs
        if (type === 'hidden' || type === 'blur') {
          if (hiddenSinceRef.current === null) {
            hiddenSinceRef.current = Date.now()
            leaveCount += 1
          }
        } else if (hiddenSinceRef.current !== null) {
          totalHiddenMs += Date.now() - hiddenSinceRef.current
          hiddenSinceRef.current = null
        }
        const next = { ...cur, integrity: { leaveCount, totalHiddenMs, events } }
        saveAttempt(next)
        return next
      })
    }
    const onVis = () => logEvent(document.hidden ? 'hidden' : 'visible')
    const onBlur = () => logEvent('blur')
    const onFocus = () => logEvent('focus')
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('blur', onBlur)
    window.addEventListener('focus', onFocus)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('focus', onFocus)
    }
  }, [phase])

  const doSubmit = async (a: ExamAttempt) => {
    const updated: ExamAttempt = { ...a, submitted: true, submittedAt: new Date().toISOString(), pendingSubmit: true }
    setAttempt(updated)
    await saveAttempt(updated)
    setPhase('submitted')
    trySend(updated)
  }

  const trySend = async (a: ExamAttempt) => {
    try {
      if (!scriptUrl.trim()) throw new Error('no-script-url')
      await submitAnswers(scriptUrl.trim(), a.maCa, a.sbd, a.maDe, a.answers, a.integrity)
      const done = { ...a, pendingSubmit: false }
      setAttempt(done)
      await saveAttempt(done)
      showToast('Đã nộp bài thành công', 'success')
      if (retryTimer.current) clearInterval(retryTimer.current)
    } catch {
      // Mất mạng — giữ pendingSubmit=true, đã lưu local, sẽ tự thử lại.
      if (!retryTimer.current) {
        retryTimer.current = setInterval(() => {
          setAttempt((cur) => {
            if (cur && cur.pendingSubmit) trySend(cur)
            return cur
          })
        }, 15000)
      }
    }
  }

  useEffect(() => {
    if (phase !== 'exam' || !attempt) return
    if (remaining !== null && remaining <= 0) doSubmit(attempt)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, phase])

  useEffect(() => {
    return () => {
      if (retryTimer.current) clearInterval(retryTimer.current)
    }
  }, [])

  const updateAndSave = (mutate: (a: ExamAttempt) => ExamAttempt) => {
    setAttempt((cur) => {
      if (!cur) return cur
      const next = mutate(cur)
      saveAttempt(next)
      return next
    })
  }

  const setPhanI = (qid: string, letter: 'A' | 'B' | 'C' | 'D') =>
    updateAndSave((a) => ({ ...a, answers: { ...a.answers, phanI: { ...a.answers.phanI, [qid]: letter } } }))

  const setPhanII = (qid: string, ideaIdx: number, value: 'D' | 'S') =>
    updateAndSave((a) => {
      const row = a.answers.phanII[qid] ?? [null, null, null, null]
      const nextRow = row.map((v, i) => (i === ideaIdx ? value : v))
      return { ...a, answers: { ...a.answers, phanII: { ...a.answers.phanII, [qid]: nextRow } } }
    })

  const setPhanIII = (qid: string, text: string) =>
    updateAndSave((a) => ({ ...a, answers: { ...a.answers, phanIII: { ...a.answers.phanIII, [qid]: text } } }))

  if (phase === 'join') {
    return (
      <div className="min-h-screen pb-24 px-4 pt-4 space-y-4 bg-slate-50 dark:bg-slate-950">
        <h1 className="text-xl font-bold">Vào thi</h1>
        <input
          className="tap-target w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3"
          placeholder="Mã ca (6 số thầy cho)"
          value={maCa}
          onChange={(e) => setMaCa(e.target.value)}
        />
        <input
          className="tap-target w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3"
          placeholder="Số báo danh"
          value={sbd}
          onChange={(e) => setSbd(e.target.value)}
        />
        <button onClick={handleJoin} className="tap-target w-full rounded-xl bg-indigo-600 text-white font-semibold">
          Vào thi
        </button>
      </div>
    )
  }

  if (phase === 'loading') {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">Đang tải đề…</div>
  }

  if (phase === 'error') {
    return (
      <div className="min-h-screen pb-24 px-4 pt-4 space-y-4 bg-slate-50 dark:bg-slate-950">
        <div className="rounded-lg bg-rose-50 dark:bg-rose-950 border border-rose-300 p-4 text-rose-700 dark:text-rose-300 text-sm">
          {errorMsg}
        </div>
        <button onClick={() => setPhase('join')} className="tap-target w-full rounded-xl bg-slate-200 dark:bg-slate-800 font-semibold">
          Thử lại
        </button>
      </div>
    )
  }

  if (phase === 'submitted') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-4 text-center">
        <div className="text-3xl">✅</div>
        <div className="text-lg font-bold">Đã nộp bài</div>
        {attempt?.pendingSubmit && (
          <div className="text-sm text-amber-600 dark:text-amber-400">
            Đang gửi lên hệ thống… đừng tắt trình duyệt, bài đã lưu an toàn trên máy và sẽ tự gửi lại khi có mạng.
          </div>
        )}
        {!attempt?.pendingSubmit && <div className="text-sm text-slate-500">Bài đã gửi lên hệ thống thành công.</div>}
      </div>
    )
  }

  if (!assignment || !attempt) return null

  return (
    <div className="min-h-screen pb-24 px-4 pt-4 space-y-6 bg-slate-50 dark:bg-slate-950">
      <div className="sticky top-0 z-30 -mx-4 px-4 py-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="text-sm">
          SBD <b>{attempt.sbd}</b>
        </div>
        <div className={`text-lg font-bold tabular-nums ${remaining !== null && remaining < 300 ? 'text-rose-600' : ''}`}>
          {formatClock(remaining ?? 0)}
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="font-bold text-indigo-700 dark:text-indigo-400">Phần I — Trắc nghiệm nhiều lựa chọn</h2>
        {assignment.phanI.map((item, displayIdx) => {
          const selectedLetter = attempt.answers.phanI[item.qid]
          return (
            <div
              key={item.qid}
              className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-3 space-y-2.5"
            >
              <div className="text-sm font-medium leading-relaxed">
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">Câu {displayIdx + 1}. </span>
                <ChemText text={item.question.text} />
              </div>
              <div className="grid grid-cols-1 gap-2">
                {item.choicePerm.map((origChoiceIdx, displayPos) => {
                  const letter = 'ABCD'[displayPos] as 'A' | 'B' | 'C' | 'D'
                  const origLetter = 'ABCD'[origChoiceIdx] as 'A' | 'B' | 'C' | 'D'
                  const active = selectedLetter === origLetter
                  return (
                    <button
                      key={displayPos}
                      type="button"
                      onClick={() => setPhanI(item.qid, origLetter)}
                      className={`tap-target flex items-center gap-2.5 text-left rounded-lg border-2 px-3 py-2 text-sm transition-colors ${
                        active
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-200'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                      }`}
                    >
                      <span
                        className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          active ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {letter}
                      </span>
                      <span className="flex-1">
                        <ChemText text={item.question.choices[origChoiceIdx]} />
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </section>

      <section className="space-y-3">
        <h2 className="font-bold text-indigo-700 dark:text-indigo-400">Phần II — Đúng / Sai</h2>
        {assignment.phanII.map((item, displayIdx) => (
          <div
            key={item.qid}
            className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-3 space-y-2.5"
          >
            <div className="text-sm font-medium leading-relaxed">
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">Câu {displayIdx + 1}. </span>
              <ChemText text={item.question.text} />
            </div>
            <div className="space-y-2">
              {item.question.ideas.map((idea, ideaIdx) => {
                const val = attempt.answers.phanII[item.qid]?.[ideaIdx]
                return (
                  <div
                    key={ideaIdx}
                    className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 px-2.5 py-1.5"
                  >
                    <span className="text-sm flex-1">
                      <b className="text-slate-500">{'abcd'[ideaIdx]})</b> <ChemText text={idea} />
                    </span>
                    <span className="flex gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setPhanII(item.qid, ideaIdx, 'D')}
                        className={`tap-target w-11 rounded-md text-xs font-bold border-2 transition-colors ${
                          val === 'D'
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-500'
                        }`}
                      >
                        Đúng
                      </button>
                      <button
                        type="button"
                        onClick={() => setPhanII(item.qid, ideaIdx, 'S')}
                        className={`tap-target w-11 rounded-md text-xs font-bold border-2 transition-colors ${
                          val === 'S'
                            ? 'bg-rose-600 border-rose-600 text-white'
                            : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-500'
                        }`}
                      >
                        Sai
                      </button>
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="font-bold text-indigo-700 dark:text-indigo-400">Phần III — Trả lời ngắn</h2>
        {assignment.phanIII.map((item, displayIdx) => (
          <div
            key={item.qid}
            className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-3 space-y-2.5"
          >
            <div className="text-sm font-medium leading-relaxed">
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">Câu {displayIdx + 1}. </span>
              <ChemText text={item.question.text} />
            </div>
            <input
              className="tap-target w-full rounded-lg border-2 border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 px-3 font-medium"
              placeholder="Đáp án"
              value={attempt.answers.phanIII[item.qid] ?? ''}
              onChange={(e) => setPhanIII(item.qid, e.target.value)}
            />
          </div>
        ))}
      </section>

      <button onClick={() => doSubmit(attempt)} className="tap-target w-full rounded-xl bg-emerald-600 text-white font-semibold">
        Nộp bài
      </button>
    </div>
  )
}
