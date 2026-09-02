import { useEffect, useMemo, useRef, useState } from 'react'
import type { PublicExamBank } from '../data/examContent'
import { assignStudentQuestions, type StudentAssignment } from '../lib/exam-assign'
import { fetchSession, submitAnswers, pushExamStatus, sendParentFeedback, type KeyBank } from '../lib/exam-api'
import { ChemText } from '../lib/chem-format'
import QuestionMedia from '../components/QuestionMedia'
import { SolutionMcq, SolutionTrueFalse, SolutionShortAnswer } from '../components/SolutionCard'
import { TriangleAlert, X, ArrowLeft, Grid3x3 } from 'lucide-react'
import { classify } from '../engine/score'
import { gradeFromKeyBank, type GradedSubmission } from '../lib/exam-grade'
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

// ============================================================================
// MÀN LÀM BÀI ("phòng thi") — bản sắc RIÊNG, cố định, KHÔNG đổi theo theme
// sáng/tối hệ thống (giống màn Quét OMR) để học sinh/phụ huynh nhận ra cùng
// một trung tâm với phiếu kết quả giấy đã gửi. Bảy màu, mỗi màu một nhiệm
// vụ — đỏ (--gap) CHỈ dùng đúng một việc: còn dưới 5 phút.
// ============================================================================
const PHONG_THI_VARS = {
  '--muc': '#12212b',
  '--giay': '#fdfcf8',
  '--the': '#ffffff',
  '--ke': '#e3ded1',
  '--nhat': '#8a8578',
  '--chon': '#1f6f5c',
  '--gap': '#b8332e',
} as React.CSSProperties
const SERIF = "'Iowan Old Style', Palatino, 'Palatino Linotype', Georgia, serif"

type PhanKey = 'I' | 'II' | 'III'
interface FlatRef {
  phan: PhanKey
  i: number
}

function daTraLoiEntry(attempt: ExamAttempt, assignment: StudentAssignment, ref: FlatRef): boolean {
  if (ref.phan === 'I') return !!attempt.answers.phanI[assignment.phanI[ref.i].qid]
  if (ref.phan === 'II') {
    const v = attempt.answers.phanII[assignment.phanII[ref.i].qid]
    return !!v && v.some((x) => x !== null && x !== undefined)
  }
  return !!attempt.answers.phanIII[assignment.phanIII[ref.i].qid]?.trim()
}

export default function ExamTakeScreen() {
  const showToast = useAppStore((s) => s.showToast)

  const [phase, setPhase] = useState<'join' | 'loading' | 'exam' | 'submitted' | 'error'>('join')
  const [errorMsg, setErrorMsg] = useState('')

  const [maCa, setMaCa] = useState('')
  const [sbd, setSbd] = useState('')
  const [scriptUrl, setScriptUrl] = useState('')

  const [bank, setBank] = useState<PublicExamBank | null>(null)
  const [lop, setLop] = useState('')
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null)
  // null = chưa tính lần nào (mới vào thi) — PHẢI phân biệt với 0 (đã hết giờ
  // thật sự), nếu không effect tự-nộp-bài bên dưới sẽ chạy với giá trị khởi
  // tạo 0 TRƯỚC khi effect đồng hồ kịp tính giờ thật, khiến bài tự nộp ngay
  // lập tức lúc vừa vào thi.
  const [remaining, setRemaining] = useState<number | null>(null)
  const retryTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const hiddenSinceRef = useRef<number | null>(null)
  const leaveCountRef = useRef(0)
  const [leaveWarning, setLeaveWarning] = useState<{ count: number; sec: number } | null>(null)
  const leaveWarningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Luôn phản ánh giá trị attempt MỚI NHẤT (kể cả đáp án em vừa chọn) — để sự
  // kiện rời màn hình không vô tình ghi đè lại đáp án bằng bản cũ.
  const attemptRef = useRef<ExamAttempt | null>(null)
  useEffect(() => {
    attemptRef.current = attempt
  }, [attempt])
  const [gradedPopup, setGradedPopup] = useState<GradedSubmission | null>(null)
  // Lưu lại keyBank (CÓ đáp án + lời giải) nhận được lúc nộp bài — để màn
  // "Xem lại lời giải" mở lại được bất cứ lúc nào trong phiên này mà không
  // cần gọi mạng lại. Chỉ tồn tại khi thầy bật "xem điểm ngay" cho ca này.
  const [keyBank, setKeyBank] = useState<KeyBank | null>(null)
  const [xemLoiGiai, setXemLoiGiai] = useState(false)

  // ---- Màn làm bài kiểu "phòng thi": mỗi câu 1 màn hình ----
  const [qIndex, setQIndex] = useState(0)
  const [showGrid, setShowGrid] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [zoomSrc, setZoomSrc] = useState<string | null>(null)
  const [saveFlash, setSaveFlash] = useState(false)
  const saveFlashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [online, setOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true))
  const gapVibratedRef = useRef(false)
  const reducedMotion = useMemo(
    () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    [],
  )
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (phase === 'exam') setQIndex(0)
  }, [phase])

  useEffect(() => {
    const onOn = () => setOnline(true)
    const onOff = () => setOnline(false)
    window.addEventListener('online', onOn)
    window.addEventListener('offline', onOff)
    return () => {
      window.removeEventListener('online', onOn)
      window.removeEventListener('offline', onOff)
    }
  }, [])

  // Rung MỘT LẦN DUY NHẤT khi vừa xuống dưới 5 phút — không lặp lại, không
  // nhấp nháy, đúng nguyên tắc "báo trạng thái, không gây hoảng".
  useEffect(() => {
    if (remaining !== null && remaining <= 300 && !gapVibratedRef.current) {
      gapVibratedRef.current = true
      navigator.vibrate?.(200)
    }
  }, [remaining])

  // Refs để hàm chạy trong effect/listener luôn đọc được giá trị MỚI NHẤT
  // (tránh closure cũ), dùng cho việc đẩy trạng thái làm bài lên cho phụ huynh.
  const scriptUrlRef = useRef('')
  useEffect(() => {
    scriptUrlRef.current = scriptUrl
  }, [scriptUrl])
  const lopRef = useRef('')
  useEffect(() => {
    lopRef.current = lop
  }, [lop])
  const totalCountRef = useRef(0)

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

  // Gộp cả 3 phần thành 1 danh sách phẳng — "mỗi câu một màn hình", đánh số
  // liên tục 1..tổng (đúng số hiện trong "7/18" và lưới câu hỏi).
  const flat: FlatRef[] = useMemo(() => {
    if (!assignment) return []
    const out: FlatRef[] = []
    assignment.phanI.forEach((_, i) => out.push({ phan: 'I', i }))
    assignment.phanII.forEach((_, i) => out.push({ phan: 'II', i }))
    assignment.phanIII.forEach((_, i) => out.push({ phan: 'III', i }))
    return out
  }, [assignment])

  // Bộ câu ĐẦY ĐỦ (kèm đáp án đúng + lời giải) dùng riêng cho màn "Xem lại
  // lời giải" — assignStudentQuestions tái tạo LẠI ĐÚNG cùng bộ câu vì cùng
  // seed (maCa+sbd), chỉ khác nguồn có đáp án (keyBank) thay vì bank công khai.
  const solutionAssignment: StudentAssignment | null = useMemo(() => {
    if (!keyBank || !attempt) return null
    return assignStudentQuestions(keyBank, attempt.maCa, attempt.sbd)
  }, [keyBank, attempt])
  useEffect(() => {
    totalCountRef.current = assignment ? assignment.phanI.length + assignment.phanII.length + assignment.phanIII.length : 0
  }, [assignment])

  // Đẩy trạng thái làm bài (đang làm/đã làm bao nhiêu câu/số lần rời màn
  // hình/có bị khoá không) lên server để phụ huynh xem gần-thời-gian-thực —
  // không chặn luồng làm bài chính, lỗi mạng thì bỏ qua (xem pushExamStatus).
  const pushStatusNow = (a: ExamAttempt, dangLam: boolean) => {
    const url = scriptUrlRef.current.trim()
    if (!url) return
    const daLam =
      Object.keys(a.answers.phanI).length +
      Object.keys(a.answers.phanII).length +
      Object.values(a.answers.phanIII).filter((v) => v.trim() !== '').length
    pushExamStatus(url, {
      sbd: a.sbd,
      maCa: a.maCa,
      lop: lopRef.current,
      dangLam,
      batDauLuc: a.startedAt,
      daLamCauHoi: daLam,
      tongCauHoi: totalCountRef.current,
      soLanRoiApp: a.integrity.leaveCount,
      blocked: a.integrity.blocked,
    })
  }

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
      setLop(cached.lop)

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

  // Đẩy trạng thái làm bài lên cho phụ huynh: ngay khi vào thi + định kỳ mỗi
  // 20 giây trong lúc làm (không cần đợi em thao tác gì).
  useEffect(() => {
    if (phase !== 'exam') return
    if (attemptRef.current) pushStatusNow(attemptRef.current, true)
    const id = setInterval(() => {
      if (attemptRef.current) pushStatusNow(attemptRef.current, true)
    }, 20000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // Ghi lại việc rời app (chuyển tab / tắt màn hình / mất focus) trong lúc làm bài — KHÔNG
  // thể phát hiện chụp ảnh màn hình bằng JavaScript (không trình duyệt nào cho phép), đây là
  // tín hiệu gần nhất có thể đo được để thầy tham khảo. Rời màn hình LẦN 2 trở lên: khoá bài,
  // tự nộp ngay lập tức, đánh dấu nghi gian lận — chặn ngay lúc rời (không đợi quay lại), vì
  // học sinh có thể không quay lại nữa (đóng tab).
  useEffect(() => {
    if (phase !== 'exam') return
    const logEvent = (type: 'hidden' | 'visible' | 'blur' | 'focus') => {
      const cur = attemptRef.current
      if (!cur || cur.submitted) return
      const events = [...cur.integrity.events, { type, at: new Date().toISOString() }].slice(-200)
      let leaveCount = cur.integrity.leaveCount
      let totalHiddenMs = cur.integrity.totalHiddenMs
      let blockNow = false
      if (type === 'hidden' || type === 'blur') {
        if (hiddenSinceRef.current === null) {
          hiddenSinceRef.current = Date.now()
          leaveCount += 1
          leaveCountRef.current = leaveCount
          if (leaveCount >= 2) blockNow = true
        }
      } else if (hiddenSinceRef.current !== null) {
        const awaySec = Math.max(1, Math.round((Date.now() - hiddenSinceRef.current) / 1000))
        totalHiddenMs += Date.now() - hiddenSinceRef.current
        hiddenSinceRef.current = null
        // Cảnh báo nghiêm khắc ngay khi em quay lại màn hình — thấy ngay lúc
        // đó mới có tác dụng răn đe, báo sau khi nộp bài thì vô nghĩa.
        if (leaveWarningTimerRef.current) clearTimeout(leaveWarningTimerRef.current)
        setLeaveWarning({ count: leaveCountRef.current, sec: awaySec })
        leaveWarningTimerRef.current = setTimeout(() => setLeaveWarning(null), 10000)
      }
      const next: ExamAttempt = {
        ...cur,
        integrity: { leaveCount, totalHiddenMs, events, blocked: cur.integrity.blocked || blockNow },
      }
      attemptRef.current = next
      setAttempt(next)
      saveAttempt(next)
      // Gửi ngay khi có tín hiệu rời màn hình (không đợi tick định kỳ) — đây
      // là lúc phụ huynh cần biết sớm nhất để cảnh báo có tác dụng.
      if (type === 'hidden' || type === 'blur' || blockNow) pushStatusNow(next, !blockNow)
      if (blockNow) doSubmit(next)
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
      if (leaveWarningTimerRef.current) clearTimeout(leaveWarningTimerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const doSubmit = async (a: ExamAttempt) => {
    const updated: ExamAttempt = { ...a, submitted: true, submittedAt: new Date().toISOString(), pendingSubmit: true }
    setAttempt(updated)
    await saveAttempt(updated)
    setPhase('submitted')
    pushStatusNow(updated, false)
    trySend(updated)
  }

  const trySend = async (a: ExamAttempt) => {
    try {
      if (!scriptUrl.trim()) throw new Error('no-script-url')
      const { keyBank } = await submitAnswers(scriptUrl.trim(), a.maCa, a.sbd, a.maDe, a.answers, a.integrity)
      const done = { ...a, pendingSubmit: false }
      setAttempt(done)
      await saveAttempt(done)
      showToast('Đã nộp bài thành công', 'success')
      if (retryTimer.current) clearInterval(retryTimer.current)
      // Thầy bật "xem điểm ngay" cho ca này — chấm ngay tại máy em bằng đúng
      // engine chấm chuẩn, không phải ước lượng. Không hiện nếu bài bị khoá
      // do nghi gian lận (màn khoá đã đủ nghiêm rồi).
      if (keyBank) {
        setKeyBank(keyBank)
        try {
          const graded = gradeFromKeyBank(keyBank, done.maCa, done.sbd, done.answers)
          // Chỉ hiện popup điểm ngay TRÊN MÁY EM nếu bài không bị khoá (màn khoá
          // đã đủ nghiêm rồi) — nhưng vẫn gửi nhận xét cho phụ huynh trong cả 2
          // trường hợp, để phụ huynh biết cả khi bài bị đánh dấu nghi gian lận.
          if (!done.integrity.blocked) setGradedPopup(graded)
          if (scriptUrlRef.current.trim()) {
            sendParentFeedback(
              scriptUrlRef.current.trim(),
              done.sbd,
              done.maCa,
              done.maDe,
              done.submittedAt || new Date().toISOString(),
              graded.score.total,
              classify(graded.score.total),
              { phanI: graded.wrongPhanI, phanII: graded.wrongPhanII, phanIII: graded.wrongPhanIII },
            ).catch(() => {
              // Gửi nhận xét cho phụ huynh không phải luồng chính — lỗi thì bỏ qua.
            })
          }
        } catch {
          // Không chấm được (vd ngân hàng đề đổi khác) — bỏ qua, không hiện popup sai lệch.
        }
      }
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
    // Chấm lưu ở thanh trên: lưu vào IndexedDB máy em NGAY khi chọn (không
    // đợi bấm nộp) — mất mạng/hết pin giữa giờ vẫn còn nguyên đáp án.
    setSaveFlash(true)
    if (saveFlashTimerRef.current) clearTimeout(saveFlashTimerRef.current)
    saveFlashTimerRef.current = setTimeout(() => setSaveFlash(false), 700)
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

  if (phase === 'submitted' && xemLoiGiai && solutionAssignment && attempt) {
    let stt = 0
    return (
      <div className="min-h-screen pb-10 px-4 pt-4 space-y-3 bg-slate-50 dark:bg-slate-950">
        <div className="sticky top-0 z-30 -mx-4 px-4 py-2.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <button onClick={() => setXemLoiGiai(false)} className="tap-target shrink-0 flex items-center gap-1 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
            <ArrowLeft size={16} /> Quay lại
          </button>
          <div className="font-bold text-sm">Xem lại lời giải</div>
        </div>

        <section className="space-y-2.5">
          <h2 className="font-bold text-indigo-700 dark:text-indigo-400 text-sm">
            Phần I — Trắc nghiệm ({solutionAssignment.phanI.length} câu)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {solutionAssignment.phanI.map((item) => {
              stt += 1
              const q = item.question as import('../data/examContent').TeacherMcqQuestion
              return (
                <SolutionMcq
                  key={item.qid}
                  mauIdx={stt - 1}
                  soThuTu={stt}
                  tieuDe={q.tieuDe}
                  text={q.text}
                  table={q.table}
                  imageDataUrl={q.imageDataUrl}
                  choices={q.choices}
                  choicePerm={item.choicePerm}
                  correct={q.correct}
                  selected={(attempt.answers.phanI[item.qid] as 'A' | 'B' | 'C' | 'D' | undefined) ?? null}
                  explanation={q.explanation}
                />
              )
            })}
          </div>
        </section>

        <section className="space-y-2.5">
          <h2 className="font-bold text-indigo-700 dark:text-indigo-400 text-sm">
            Phần II — Đúng / Sai ({solutionAssignment.phanII.length} câu)
          </h2>
          {solutionAssignment.phanII.map((item) => {
            stt += 1
            const q = item.question as import('../data/examContent').TeacherTrueFalseQuestion
            return (
              <SolutionTrueFalse
                key={item.qid}
                mauIdx={stt - 1}
                soThuTu={stt}
                tieuDe={q.tieuDe}
                text={q.text}
                table={q.table}
                imageDataUrl={q.imageDataUrl}
                ideas={q.ideas}
                correct={q.correct}
                selected={attempt.answers.phanII[item.qid] ?? [null, null, null, null]}
                explanation={q.explanation}
              />
            )
          })}
        </section>

        <section className="space-y-2.5">
          <h2 className="font-bold text-indigo-700 dark:text-indigo-400 text-sm">
            Phần III — Trả lời ngắn ({solutionAssignment.phanIII.length} câu)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {solutionAssignment.phanIII.map((item) => {
              stt += 1
              const q = item.question as import('../data/examContent').TeacherShortAnswerQuestion
              return (
                <SolutionShortAnswer
                  key={item.qid}
                  mauIdx={stt - 1}
                  soThuTu={stt}
                  tieuDe={q.tieuDe}
                  text={q.text}
                  table={q.table}
                  imageDataUrl={q.imageDataUrl}
                  correct={q.correct}
                  selected={attempt.answers.phanIII[item.qid] ?? null}
                  explanation={q.explanation}
                />
              )
            })}
          </div>
        </section>
      </div>
    )
  }

  if (phase === 'submitted') {
    if (attempt?.integrity.blocked) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center bg-rose-50 dark:bg-rose-950">
          <TriangleAlert size={40} className="text-rose-600" />
          <div className="text-lg font-bold text-rose-700 dark:text-rose-300">BÀI THI ĐÃ BỊ KHOÁ</div>
          <div className="text-sm text-rose-700 dark:text-rose-300 leading-relaxed">
            Em đã rời màn hình làm bài từ <b>2 lần trở lên</b>. Theo quy định, bài thi tự động nộp và được đánh dấu{' '}
            <b>nghi vấn gian lận</b> để thầy xem xét, có thể kèm báo phụ huynh.
          </div>
          {attempt?.pendingSubmit && (
            <div className="text-xs text-amber-700 dark:text-amber-400">Đang gửi lên hệ thống… đừng tắt trình duyệt.</div>
          )}
        </div>
      )
    }
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

        {keyBank && solutionAssignment && (
          <button
            onClick={() => setXemLoiGiai(true)}
            className="tap-target rounded-xl bg-indigo-600 text-white font-semibold px-5"
          >
            Xem lại lời giải
          </button>
        )}

        {gradedPopup && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm px-4 py-6">
            <div className="w-full max-w-sm max-h-[85vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 shadow-2xl">
              <div className="sticky top-0 bg-white dark:bg-slate-900 px-5 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between">
                <div>
                  <div className="text-xs text-slate-400">Kết quả bài thi</div>
                  <div className="text-4xl font-extrabold text-indigo-600 dark:text-indigo-400 tabular-nums">
                    {gradedPopup.score.total.toFixed(2)}
                    <span className="text-base font-medium text-slate-400">/10</span>
                  </div>
                  <div className="text-sm font-semibold mt-0.5">{classify(gradedPopup.score.total)}</div>
                </div>
                <button
                  onClick={() => setGradedPopup(null)}
                  className="shrink-0 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="px-5 py-4 space-y-3 text-left">
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      ['Phần I', gradedPopup.score.phanIScore, assignment?.phanI.length ?? 0, gradedPopup.wrongPhanI.length],
                      ['Phần II', gradedPopup.score.phanIIScore, assignment?.phanII.length ?? 0, gradedPopup.wrongPhanII.length],
                      ['Phần III', gradedPopup.score.phanIIIScore, assignment?.phanIII.length ?? 0, gradedPopup.wrongPhanIII.length],
                    ] as const
                  ).map(([label, pts, n, wrong]) => (
                    <div key={label} className="rounded-xl bg-slate-50 dark:bg-slate-800 p-2.5 text-center">
                      <div className="text-[11px] text-slate-400">{label}</div>
                      <div className="text-lg font-bold">{pts.toFixed(2)}đ</div>
                      <div className="text-[11px] text-slate-500">
                        {n - wrong}/{n} đúng
                      </div>
                    </div>
                  ))}
                </div>

                {(gradedPopup.wrongPhanI.length > 0 || gradedPopup.wrongPhanII.length > 0 || gradedPopup.wrongPhanIII.length > 0) && (
                  <div className="rounded-xl bg-rose-50 dark:bg-rose-950/40 p-3 text-sm">
                    <div className="font-semibold text-rose-700 dark:text-rose-300 mb-1">Cần xem lại</div>
                    <div className="text-rose-700 dark:text-rose-300 text-xs leading-relaxed">
                      {gradedPopup.wrongPhanI.length > 0 && <div>Phần I — câu {gradedPopup.wrongPhanI.join(', ')}</div>}
                      {gradedPopup.wrongPhanII.length > 0 && <div>Phần II — câu {gradedPopup.wrongPhanII.join(', ')}</div>}
                      {gradedPopup.wrongPhanIII.length > 0 && <div>Phần III — câu {gradedPopup.wrongPhanIII.join(', ')}</div>}
                    </div>
                  </div>
                )}
                {gradedPopup.wrongPhanI.length === 0 && gradedPopup.wrongPhanII.length === 0 && gradedPopup.wrongPhanIII.length === 0 && (
                  <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 p-3 text-sm text-emerald-700 dark:text-emerald-300 font-medium text-center">
                    Đúng hết tất cả các câu! 🎉
                  </div>
                )}
                {!gradedPopup.score.crossSumOk && (
                  <div className="text-[11px] text-amber-600 dark:text-amber-400">
                    * Có sai lệch khi cộng điểm — thầy sẽ kiểm tra lại thủ công.
                  </div>
                )}
              </div>

              <div className="px-5 pb-5 space-y-2">
                {solutionAssignment && (
                  <button
                    onClick={() => {
                      setGradedPopup(null)
                      setXemLoiGiai(true)
                    }}
                    className="tap-target w-full rounded-xl bg-indigo-600 text-white font-semibold"
                  >
                    Xem lại lời giải
                  </button>
                )}
                <button
                  onClick={() => setGradedPopup(null)}
                  className={`tap-target w-full rounded-xl font-semibold ${solutionAssignment ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300' : 'bg-indigo-600 text-white'}`}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (!assignment || !attempt || flat.length === 0) return null

  const total = flat.length
  const cur = flat[Math.min(qIndex, total - 1)]
  const daLamCount = flat.filter((f) => daTraLoiEntry(attempt, assignment, f)).length
  const chuaLam = flat.map((f, i) => (daTraLoiEntry(attempt, assignment, f) ? null : i + 1)).filter((x): x is number => x !== null)

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0]
    swipeStartRef.current = { x: t.clientX, y: t.clientY }
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = swipeStartRef.current
    swipeStartRef.current = null
    if (!start) return
    const t = e.changedTouches[0]
    const dx = t.clientX - start.x
    const dy = t.clientY - start.y
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) setQIndex((i) => Math.min(total - 1, i + 1))
      else setQIndex((i) => Math.max(0, i - 1))
    }
  }

  const gapNow = remaining !== null && remaining <= 300
  const dotColor = !online ? 'var(--nhat)' : saveFlash ? '#c98a1f' : 'var(--chon)'
  const dotLabel = !online ? 'mất mạng, đã lưu máy' : saveFlash ? 'đang lưu…' : 'đã lưu'

  const phanLabel = cur.phan === 'I' ? 'Phần I — Trắc nghiệm' : cur.phan === 'II' ? 'Phần II — Đúng / Sai' : 'Phần III — Trả lời ngắn'

  return (
    <div style={PHONG_THI_VARS} className="min-h-screen flex flex-col bg-[var(--giay)]">
      {/* THANH TRÊN — dính, thanh tiến độ theo từng ô câu + vị trí + đồng hồ + chấm lưu */}
      <div
        className="sticky top-0 z-30 border-b px-3 pb-2 space-y-1.5"
        style={{ borderColor: 'var(--ke)', background: 'var(--giay)', paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}
      >
        <div className="flex gap-[2px] h-1.5">
          {flat.map((f, i) => (
            <div
              key={i}
              className="flex-1 rounded-full"
              style={{
                background: daTraLoiEntry(attempt, assignment, f) ? 'var(--muc)' : 'var(--ke)',
                outline: i === qIndex ? '1.5px solid var(--chon)' : 'none',
                outlineOffset: 1,
              }}
            />
          ))}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="shrink-0 w-2 h-2 rounded-full transition-colors" style={{ background: dotColor }} title={dotLabel} />
            <span className="text-[11px] truncate" style={{ color: 'var(--nhat)' }}>
              {dotLabel}
            </span>
          </div>
          <div className="text-sm font-semibold tabular-nums" style={{ fontFamily: SERIF, color: 'var(--muc)' }}>
            {qIndex + 1}/{total}
          </div>
          <div
            className="text-lg font-bold tabular-nums transition-colors"
            style={{ fontFamily: SERIF, color: gapNow ? 'var(--gap)' : 'var(--nhat)' }}
          >
            {formatClock(remaining ?? 0)}
          </div>
        </div>
      </div>

      {leaveWarning && (
        <div className="sticky top-[70px] z-30 px-3 pt-1.5">
          <div className="bg-rose-600 text-white rounded-lg px-3 py-2.5 shadow-lg flex items-start gap-2 animate-[pulse_1.2s_ease-in-out_2]">
            <TriangleAlert size={20} className="shrink-0 mt-0.5" />
            <div className="text-sm leading-snug">
              <b>Em vừa rời khỏi màn hình làm bài</b> (lần {leaveWarning.count}, {leaveWarning.sec} giây). Thầy đã ghi
              lại — hành vi này sẽ đưa vào báo cáo gửi phụ huynh khi thầy xem xét bài thi.{' '}
              <b>Nếu em rời màn hình thêm một lần nữa, bài thi sẽ tự động NỘP NGAY và bị đánh dấu nghi vấn gian lận.</b>
            </div>
            <button onClick={() => setLeaveWarning(null)} className="shrink-0 text-white/80 hover:text-white text-lg leading-none px-1">
              ×
            </button>
          </div>
        </div>
      )}

      {/* NỘI DUNG — 1 câu 1 màn hình, vuốt ngang để chuyển câu */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div key={qIndex} className={reducedMotion ? '' : 'animate-[phongthifade_150ms_ease-out]'}>
          <div className="text-[11px] font-semibold tracking-wide mb-2" style={{ color: 'var(--nhat)' }}>
            {phanLabel.toUpperCase()}
          </div>

          {cur.phan === 'I' &&
            (() => {
              const item = assignment.phanI[cur.i]
              const stemImg = item.question.thanCauImg
              return (
                <>
                  {stemImg ? (
                    <button type="button" onClick={() => setZoomSrc(stemImg)} className="block w-full mb-1">
                      <img src={stemImg} alt="Đề bài" className="w-full rounded-lg border" style={{ borderColor: 'var(--ke)' }} />
                    </button>
                  ) : (
                    <div className="text-base leading-relaxed mb-2" style={{ color: 'var(--muc)' }}>
                      <ChemText text={item.question.text} />
                    </div>
                  )}
                  <QuestionMedia table={item.question.table} imageDataUrl={item.question.imageDataUrl} />
                  {stemImg && (
                    <button
                      onClick={() => setZoomSrc(stemImg)}
                      className="text-[12px] underline decoration-dotted mb-3 mt-1 block"
                      style={{ color: 'var(--nhat)' }}
                    >
                      xem bản gốc
                    </button>
                  )}
                  <div className="space-y-2 mt-3">
                    {item.choicePerm.map((origIdx, displayPos) => {
                      const letter = 'ABCD'[displayPos] as 'A' | 'B' | 'C' | 'D'
                      const origLetter = 'ABCD'[origIdx] as 'A' | 'B' | 'C' | 'D'
                      const active = attempt.answers.phanI[item.qid] === origLetter
                      const img = item.question.choiceImgs?.[origIdx]
                      return (
                        <button
                          key={displayPos}
                          type="button"
                          onClick={() => setPhanI(item.qid, origLetter)}
                          className="tap-target w-full flex items-stretch rounded-lg border-2 overflow-hidden text-left transition-colors"
                          style={{
                            borderColor: active ? 'var(--chon)' : 'var(--ke)',
                            background: active ? 'rgba(31,111,92,0.07)' : 'var(--the)',
                            minHeight: 56,
                          }}
                        >
                          <span
                            className="shrink-0 w-12 flex items-center justify-center font-bold text-base"
                            style={{ fontFamily: SERIF, color: active ? '#fff' : 'var(--muc)', background: active ? 'var(--chon)' : 'transparent' }}
                          >
                            {letter}
                          </span>
                          <span className="flex-1 flex items-center px-3 py-2" style={{ color: 'var(--muc)' }}>
                            {img ? (
                              <img src={img} alt={`Phương án ${letter}`} className="max-h-14 w-auto" />
                            ) : (
                              <span className="text-sm">
                                <ChemText text={item.question.choices[origIdx]} />
                              </span>
                            )}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </>
              )
            })()}

          {cur.phan === 'II' &&
            (() => {
              const item = assignment.phanII[cur.i]
              const stemImg = item.question.thanCauImg
              return (
                <>
                  {stemImg ? (
                    <button type="button" onClick={() => setZoomSrc(stemImg)} className="block w-full mb-1">
                      <img src={stemImg} alt="Đề bài" className="w-full rounded-lg border" style={{ borderColor: 'var(--ke)' }} />
                    </button>
                  ) : (
                    <div className="text-base leading-relaxed mb-2" style={{ color: 'var(--muc)' }}>
                      <ChemText text={item.question.text} />
                    </div>
                  )}
                  <QuestionMedia table={item.question.table} imageDataUrl={item.question.imageDataUrl} />
                  {stemImg && (
                    <button
                      onClick={() => setZoomSrc(stemImg)}
                      className="text-[12px] underline decoration-dotted mb-3 mt-1 block"
                      style={{ color: 'var(--nhat)' }}
                    >
                      xem bản gốc
                    </button>
                  )}
                  <div className="space-y-2.5 mt-3">
                    {item.question.ideas.map((idea, ideaIdx) => {
                      const val = attempt.answers.phanII[item.qid]?.[ideaIdx]
                      const img = item.question.ideaImgs?.[ideaIdx]
                      return (
                        <div key={ideaIdx} className="rounded-lg border p-2.5 flex items-center gap-2.5" style={{ borderColor: 'var(--ke)', background: 'var(--the)' }}>
                          <div className="text-sm flex-1 flex items-start gap-1.5" style={{ color: 'var(--muc)' }}>
                            <b style={{ color: 'var(--nhat)' }}>{'abcd'[ideaIdx]})</b>
                            {img ? <img src={img} alt={`Ý ${'abcd'[ideaIdx]}`} className="max-h-14 w-auto" /> : <ChemText text={idea} />}
                          </div>
                          <div className="flex flex-col gap-1.5 shrink-0 w-20">
                            <button
                              type="button"
                              onClick={() => setPhanII(item.qid, ideaIdx, 'D')}
                              className="tap-target rounded-md text-sm font-bold border-2 py-1.5"
                              style={{
                                borderColor: val === 'D' ? 'var(--chon)' : 'var(--ke)',
                                background: val === 'D' ? 'var(--chon)' : 'var(--the)',
                                color: val === 'D' ? '#fff' : 'var(--muc)',
                              }}
                            >
                              Đúng
                            </button>
                            <button
                              type="button"
                              onClick={() => setPhanII(item.qid, ideaIdx, 'S')}
                              className="tap-target rounded-md text-sm font-bold border-2 py-1.5"
                              style={{
                                borderColor: val === 'S' ? 'var(--gap)' : 'var(--ke)',
                                background: val === 'S' ? 'var(--gap)' : 'var(--the)',
                                color: val === 'S' ? '#fff' : 'var(--muc)',
                              }}
                            >
                              Sai
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )
            })()}

          {cur.phan === 'III' &&
            (() => {
              const item = assignment.phanIII[cur.i]
              const stemImg = item.question.thanCauImg
              return (
                <>
                  {stemImg ? (
                    <button type="button" onClick={() => setZoomSrc(stemImg)} className="block w-full mb-1">
                      <img src={stemImg} alt="Đề bài" className="w-full rounded-lg border" style={{ borderColor: 'var(--ke)' }} />
                    </button>
                  ) : (
                    <div className="text-base leading-relaxed mb-2" style={{ color: 'var(--muc)' }}>
                      <ChemText text={item.question.text} />
                    </div>
                  )}
                  <QuestionMedia table={item.question.table} imageDataUrl={item.question.imageDataUrl} />
                  {stemImg && (
                    <button
                      onClick={() => setZoomSrc(stemImg)}
                      className="text-[12px] underline decoration-dotted mb-3 mt-1 block"
                      style={{ color: 'var(--nhat)' }}
                    >
                      xem bản gốc
                    </button>
                  )}
                  <input
                    className="tap-target w-full rounded-lg border-2 px-3 font-medium mt-3"
                    style={{ borderColor: 'var(--ke)', background: 'var(--the)', color: 'var(--muc)', minHeight: 56 }}
                    placeholder="Đáp án"
                    value={attempt.answers.phanIII[item.qid] ?? ''}
                    onChange={(e) => setPhanIII(item.qid, e.target.value)}
                  />
                </>
              )
            })()}
        </div>
      </div>

      {/* THANH DƯỚI — dính, Trước / lưới câu / Sau (đổi thành Nộp bài ở câu cuối) */}
      <div
        className="sticky bottom-0 z-30 border-t px-3 py-2 flex items-center justify-between gap-2"
        style={{ borderColor: 'var(--ke)', background: 'var(--giay)', paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
      >
        <button
          onClick={() => setQIndex((i) => Math.max(0, i - 1))}
          disabled={qIndex === 0}
          className="tap-target px-4 py-2.5 rounded-lg font-semibold disabled:opacity-30"
          style={{ color: 'var(--muc)' }}
        >
          ‹ Trước
        </button>
        <button
          onClick={() => setShowGrid(true)}
          className="tap-target w-12 h-12 rounded-full flex items-center justify-center border-2"
          style={{ borderColor: 'var(--ke)' }}
          title="Xem danh sách câu"
        >
          <Grid3x3 size={18} style={{ color: 'var(--muc)' }} />
        </button>
        {qIndex === total - 1 ? (
          <button
            onClick={() => setShowConfirm(true)}
            className="tap-target px-5 py-2.5 rounded-lg font-semibold text-white"
            style={{ background: 'var(--chon)' }}
          >
            Nộp bài
          </button>
        ) : (
          <button
            onClick={() => setQIndex((i) => Math.min(total - 1, i + 1))}
            className="tap-target px-4 py-2.5 rounded-lg font-semibold"
            style={{ color: 'var(--muc)' }}
          >
            Sau ›
          </button>
        )}
      </div>

      {/* LƯỚI SỐ CÂU */}
      {showGrid && (
        <div className="fixed inset-0 z-40 flex items-end" style={{ background: 'rgba(18,33,43,0.5)' }} onClick={() => setShowGrid(false)}>
          <div
            className="w-full rounded-t-2xl p-4 space-y-3"
            style={{ background: 'var(--giay)', maxHeight: '75vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="font-bold" style={{ fontFamily: SERIF, color: 'var(--muc)' }}>
                Danh sách câu — đã làm {daLamCount}/{total}
              </div>
              <button onClick={() => setShowGrid(false)} style={{ color: 'var(--nhat)' }}>
                <X size={20} />
              </button>
            </div>
            <div className="grid grid-cols-6 gap-2 max-h-[45vh] overflow-y-auto pb-1">
              {flat.map((f, i) => {
                const done = daTraLoiEntry(attempt, assignment, f)
                const dangXem = i === qIndex
                return (
                  <button
                    key={i}
                    onClick={() => {
                      setQIndex(i)
                      setShowGrid(false)
                    }}
                    className="tap-target aspect-square rounded-lg flex items-center justify-center font-semibold text-sm tabular-nums"
                    style={{
                      fontFamily: SERIF,
                      background: done ? 'var(--muc)' : 'var(--the)',
                      color: done ? 'var(--giay)' : 'var(--muc)',
                      border: dangXem ? '2px solid var(--chon)' : '1px solid var(--ke)',
                    }}
                  >
                    {i + 1}
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => {
                setShowGrid(false)
                setShowConfirm(true)
              }}
              className="tap-target w-full rounded-xl font-semibold text-white py-3"
              style={{ background: 'var(--chon)' }}
            >
              Nộp bài
            </button>
          </div>
        </div>
      )}

      {/* XÁC NHẬN NỘP BÀI */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(18,33,43,0.6)' }}>
          <div className="w-full max-w-sm rounded-2xl p-5 space-y-3" style={{ background: 'var(--the)' }}>
            <div className="text-sm leading-relaxed" style={{ color: 'var(--muc)' }}>
              Em đã làm{' '}
              <b>
                {daLamCount}/{total}
              </b>{' '}
              câu.
              {chuaLam.length > 0 && (
                <div className="mt-1.5 font-medium" style={{ color: 'var(--gap)' }}>
                  Còn {chuaLam.length} câu chưa làm: câu {chuaLam.join(', ')}.
                </div>
              )}
            </div>
            <div className="text-xs" style={{ color: 'var(--nhat)' }}>
              Sau khi nộp không sửa được nữa.
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  setShowConfirm(false)
                  if (chuaLam.length > 0) setQIndex(chuaLam[0] - 1)
                }}
                className="tap-target flex-1 rounded-xl font-semibold py-2.5"
                style={{ border: '1px solid var(--ke)', color: 'var(--muc)' }}
              >
                Xem lại
              </button>
              <button
                onClick={() => {
                  setShowConfirm(false)
                  doSubmit(attempt)
                }}
                className="tap-target flex-1 rounded-xl font-semibold py-2.5 text-white"
                style={{ background: 'var(--chon)' }}
              >
                NỘP BÀI
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PHÓNG TO ẢNH ĐỀ/PHƯƠNG ÁN */}
      {zoomSrc && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-2 overflow-auto"
          style={{ background: 'rgba(18,33,43,0.9)' }}
          onClick={() => setZoomSrc(null)}
        >
          <img src={zoomSrc} alt="Phóng to" className="max-w-full max-h-full rounded shadow-2xl" />
        </div>
      )}

      {!reducedMotion && (
        <style>{`@keyframes phongthifade { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      )}
    </div>
  )
}
