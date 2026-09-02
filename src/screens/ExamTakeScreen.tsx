import { useEffect, useMemo, useRef, useState } from 'react'
import type { PublicExamBank, TeacherMcqQuestion, TeacherShortAnswerQuestion, TeacherTrueFalseQuestion } from '../data/examContent'
import { assignStudentQuestions, type StudentAssignment } from '../lib/exam-assign'
import { fetchSession, submitAnswers, pushExamStatus, sendParentFeedback, fetchKetQua, type KeyBank, type CongBoDiem } from '../lib/exam-api'
import TheCau from '../components/TheCau'
import MaCaInput from '../components/MaCaInput'
import DaiNhacCaiApp from '../components/DaiNhacCaiApp'
import LogoDDH from '../components/LogoDDH'
import { TheNoiDung, NutChinh, OThongBao, Nhan } from '../components/DesignSystem'
import { TriangleAlert, X, ArrowLeft, LayoutGrid } from 'lucide-react'
import { classify } from '../engine/score'
import { gradeFromKeyBank, type GradedSubmission } from '../lib/exam-grade'
import {
  cacheSession,
  emptyAnswerRecord,
  emptyIntegrityLog,
  loadAttempt,
  loadCachedSession,
  loadScriptUrlHoacMacDinh,
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
// MÀN LÀM BÀI — theo GIAO-DIEN-LAM-BAI.md: cuộn dọc liên tục (không phân
// trang, không vuốt ngang), thẻ câu dùng chung với màn Xem lại (TheCau, cờ
// cheDo), ẩn hết menu (BottomNav/FAB đã gỡ khỏi DOM ở App.tsx khi
// screen==='examtake'), chặn Back vật lý, nút Nộp bài ở cuối trang. Mọi
// màu/cỡ chữ lấy từ tokens.css — không hard-code.
// ============================================================================
type PhanKey = 'I' | 'II' | 'III'
interface FlatRef {
  phan: PhanKey
  i: number
}

const SANS_SO: React.CSSProperties = { fontFamily: 'var(--sans)', fontVariantNumeric: 'tabular-nums' }

const PHAN_INFO: Record<PhanKey, { ten: string; diem: string }> = {
  I: { ten: 'Trắc nghiệm', diem: 'Mỗi câu đúng 0,25 điểm' },
  II: { ten: 'Đúng / Sai', diem: 'Đúng 1 ý 0,1đ · 2 ý 0,25đ · 3 ý 0,5đ · cả 4 ý 1đ' },
  III: { ten: 'Trả lời ngắn', diem: 'Mỗi câu đúng 0,25 điểm' },
}

function daTraLoiEntry(attempt: ExamAttempt, assignment: StudentAssignment, ref: FlatRef): boolean {
  if (ref.phan === 'I') return !!attempt.answers.phanI[assignment.phanI[ref.i].qid]
  if (ref.phan === 'II') {
    const v = attempt.answers.phanII[assignment.phanII[ref.i].qid]
    return !!v && v.some((x) => x !== null && x !== undefined)
  }
  return !!attempt.answers.phanIII[assignment.phanIII[ref.i].qid]?.trim()
}

function cuonToiCau(stt: number) {
  document.getElementById(`cau-${stt}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

/** Đầu phần dính — cuộn qua phần nào thì đầu phần đó dính lên dưới thanh trên. */
function DauPhan({ phan, soCau }: { phan: PhanKey; soCau: number }) {
  const info = PHAN_INFO[phan]
  return (
    <div className="sticky z-20 flex items-center" style={{ top: 56, background: 'var(--nen)', padding: 'var(--k3) 0', gap: 'var(--k3)' }}>
      <div
        className="shrink-0 flex items-center justify-center font-bold"
        style={{ width: 36, height: 36, borderRadius: 'var(--bo-1)', background: 'var(--tim-nen)', color: 'var(--tim)', fontFamily: 'var(--serif)', fontSize: 'var(--cx-2)' }}
      >
        {phan}
      </div>
      <div className="min-w-0">
        <div className="font-bold truncate" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-3)', color: 'var(--muc)' }}>
          PHẦN {phan} — {info.ten} ({soCau} câu)
        </div>
        <div className="truncate" style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)' }}>
          {info.diem}
        </div>
      </div>
    </div>
  )
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
  // Kết quả đã chấm trên máy em (khi thầy cho công bố) — giữ lại để bấm "Xem
  // điểm" mở lại popup bất cứ lúc nào; popup chỉ là cờ hiện/ẩn.
  const [graded, setGraded] = useState<GradedSubmission | null>(null)
  const [gradedPopup, setGradedPopup] = useState(false)
  // Chế độ công bố của ca (server trả về sau khi nộp / khi hỏi lại) + số em
  // đã nộp / đã vào thi để hiện "đang chờ cả lớp x/y".
  const [congBo, setCongBo] = useState<CongBoDiem | null>(null)
  const [choCaLop, setChoCaLop] = useState<{ daNop: number; daVao: number } | null>(null)
  // Lưu lại keyBank (CÓ đáp án + lời giải) nhận được lúc nộp bài — để màn
  // "Xem lại lời giải" mở lại được bất cứ lúc nào trong phiên này mà không
  // cần gọi mạng lại. Chỉ tồn tại khi thầy bật "xem điểm ngay" cho ca này.
  const [keyBank, setKeyBank] = useState<KeyBank | null>(null)
  const [xemLoiGiai, setXemLoiGiai] = useState(false)

  // ---- Trạng thái riêng của màn làm bài ----
  const [showGrid, setShowGrid] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showBackDialog, setShowBackDialog] = useState(false)
  const [zoomSrc, setZoomSrc] = useState<string | null>(null)
  const [saveFlash, setSaveFlash] = useState(false)
  const saveFlashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [online, setOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true))
  const gapVibratedRef = useRef(false)

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

  // Chặn Back vật lý (Android) / nút quay lại trình duyệt trong lúc làm bài:
  // đẩy 1 mục lịch sử giả, mỗi lần bấm Back thì đẩy lại + hỏi có nộp luôn
  // không — không thoát được khỏi màn thi (GIAO-DIEN-LAM-BAI.md).
  useEffect(() => {
    if (phase !== 'exam') return
    history.pushState(null, '', location.href)
    const onPop = () => {
      history.pushState(null, '', location.href)
      setShowBackDialog(true)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [phase])

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
      loadScriptUrlHoacMacDinh().then(setScriptUrl)
    }
  }, [])

  const assignment: StudentAssignment | null = useMemo(() => {
    if (!bank || !maCa || !sbd) return null
    return assignStudentQuestions(bank, maCa.trim(), sbd.trim())
  }, [bank, maCa, sbd])

  // Gộp cả 3 phần thành 1 danh sách phẳng, đánh số liên tục 1..tổng (đúng số
  // hiện trong "12/28", lưới số câu và id cuộn tới "cau-N").
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
        // Mở lại sau khi đã nộp: nạp lại đề đã cache để đếm số câu / hiện điểm
        // chi tiết; effect hỏi lại kết quả (fetchKetQua) chạy ở màn "Đã nộp".
        const cachedCu = await loadCachedSession(ma)
        if (cachedCu) {
          setBank(cachedCu.bank)
          setLop(cachedCu.lop)
        }
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

  // Gửi trạng thái làm bài lên máy chủ theo lô mỗi 10 giây (GIAO-DIEN-LAM-BAI.md
  // "Lưu bài"): ngay khi vào thi + định kỳ, không cần đợi em thao tác gì.
  // Đáp án chi tiết chỉ gửi lúc nộp (submitAnswers) — Apps Script hiện chỉ
  // nhận trạng thái tiến độ giữa chừng, không nhận đáp án từng câu.
  useEffect(() => {
    if (phase !== 'exam') return
    if (attemptRef.current) pushStatusNow(attemptRef.current, true)
    const id = setInterval(() => {
      if (attemptRef.current) pushStatusNow(attemptRef.current, true)
    }, 10000)
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

  // Nhận keyBank (CÓ đáp án) → chấm tại máy em, hiện popup điểm (trừ bài bị
  // khoá — màn khoá đã đủ nghiêm), gửi nhận xét cho phụ huynh. Dùng chung cho
  // cả 2 đường: trả về ngay lúc nộp, hoặc hỏi lại sau (cả lớp xong / mở lại app).
  const apDungKeyBank = (kb: KeyBank, done: ExamAttempt) => {
    setKeyBank(kb)
    setChoCaLop(null)
    try {
      const g = gradeFromKeyBank(kb, done.maCa, done.sbd, done.answers)
      setGraded(g)
      if (!done.integrity.blocked) setGradedPopup(true)
      if (scriptUrlRef.current.trim()) {
        sendParentFeedback(
          scriptUrlRef.current.trim(),
          done.sbd,
          done.maCa,
          done.maDe,
          done.submittedAt || new Date().toISOString(),
          g.score.total,
          classify(g.score.total),
          { phanI: g.wrongPhanI, phanII: g.wrongPhanII, phanIII: g.wrongPhanIII },
        ).catch(() => {
          // Gửi nhận xét cho phụ huynh không phải luồng chính — lỗi thì bỏ qua.
        })
      }
    } catch {
      // Không chấm được (vd ngân hàng đề đổi khác) — bỏ qua, không hiện popup sai lệch.
    }
  }

  // Đã nộp mà chưa có đáp án → hỏi lại máy chủ: ngay khi vào màn "Đã nộp" và
  // mỗi 20 giây khi màn hình đang mở (chế độ "khi cả lớp nộp xong", hoặc em
  // mở lại link sau khi đã nộp). Server tự quyết đã được phép xem hay chưa.
  useEffect(() => {
    if (phase !== 'submitted' || keyBank || !attempt || attempt.pendingSubmit) return
    if (congBo === 'khong') return
    const url = scriptUrlRef.current.trim()
    if (!url) return
    let dung = false
    const hoi = async () => {
      if (dung || document.hidden) return
      try {
        const r = await fetchKetQua(url, attempt.maCa, attempt.sbd)
        if (dung) return
        setCongBo(r.congBo)
        if (r.sanSang && r.keyBank) apDungKeyBank(r.keyBank, attempt)
        else if (r.congBo === 'ca_lop_xong') setChoCaLop({ daNop: r.daNop, daVao: r.daVao })
      } catch {
        // mất mạng — lần sau hỏi lại
      }
    }
    hoi()
    const id = setInterval(hoi, 20000)
    const onVis = () => {
      if (!document.hidden) hoi()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      dung = true
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, keyBank, attempt?.pendingSubmit, congBo])

  const trySend = async (a: ExamAttempt) => {
    try {
      if (!scriptUrl.trim()) throw new Error('no-script-url')
      const { keyBank, congBo: cb } = await submitAnswers(scriptUrl.trim(), a.maCa, a.sbd, a.maDe, a.answers, a.integrity)
      const done = { ...a, pendingSubmit: false }
      setAttempt(done)
      await saveAttempt(done)
      showToast('Đã nộp bài thành công', 'success')
      if (retryTimer.current) clearInterval(retryTimer.current)
      setCongBo(cb)
      // Thầy bật "xem điểm ngay" cho ca này — chấm ngay tại máy em bằng đúng
      // engine chấm chuẩn, không phải ước lượng. Chế độ "khi cả lớp nộp xong"
      // thì chưa có keyBank lúc này — effect hỏi lại bên dưới sẽ lo.
      if (keyBank) apDungKeyBank(keyBank, done)
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

  // ---------------------------------------------------------------- VÀO PHÒNG
  if (phase === 'join') {
    return (
      <Trang className="flex items-center justify-center px-4 py-8">
        <div className="w-full" style={{ maxWidth: 400 }}>
          <DaiNhacCaiApp />
          <TheNoiDung>
            <div className="text-center" style={{ marginBottom: 'var(--k6)' }}>
              <div className="flex justify-center" style={{ color: 'var(--muc)', marginBottom: 'var(--k3)' }}>
                <LogoDDH size={44} />
              </div>
              <div className="font-bold" style={{ fontSize: 'var(--cx-5)', letterSpacing: '.28em', color: 'var(--muc)' }}>
                ĐỖ ĐẠI HỌC
              </div>
              <div style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--mo)', letterSpacing: '.1em' }}>KIÊN TRÌ</div>
            </div>
            <div className="flex flex-col" style={{ gap: 'var(--k4)' }}>
              <div>
                <div style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)', marginBottom: 'var(--k2)' }}>Mã ca (6 số thầy cho)</div>
                <MaCaInput value={maCa} onChange={setMaCa} autoFocus={!maCa} />
              </div>
              <div>
                <div style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)', marginBottom: 'var(--k2)' }}>Số báo danh</div>
                <input
                  className="tap-target w-full"
                  style={{
                    height: 52,
                    borderRadius: 'var(--bo-1)',
                    padding: '0 var(--k4)',
                    background: 'var(--the-2)',
                    border: '1.5px solid transparent',
                    fontFamily: 'var(--serif)',
                    fontSize: 'var(--cx-3)',
                    color: 'var(--muc)',
                    outline: 'none',
                  }}
                  placeholder="Số báo danh"
                  value={sbd}
                  onChange={(e) => setSbd(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleJoin()
                  }}
                />
              </div>
              <NutChinh onClick={handleJoin}>Vào thi</NutChinh>
            </div>
          </TheNoiDung>
        </div>
      </Trang>
    )
  }

  if (phase === 'loading') {
    return (
      <Trang className="flex items-center justify-center">
        <div style={{ color: 'var(--nhat)', fontSize: 'var(--cx-3)' }}>Đang tải đề…</div>
      </Trang>
    )
  }

  if (phase === 'error') {
    return (
      <Trang className="flex items-center justify-center px-4">
        <div className="w-full flex flex-col" style={{ maxWidth: 400, gap: 'var(--k4)' }}>
          <OThongBao tone="do">{errorMsg}</OThongBao>
          <NutChinh variant="phu" onClick={() => setPhase('join')}>
            Thử lại
          </NutChinh>
        </div>
      </Trang>
    )
  }

  // ------------------------------------------------------- XEM LẠI LỜI GIẢI
  if (phase === 'submitted' && xemLoiGiai && solutionAssignment && attempt) {
    let stt = 0
    return (
      <Trang>
        <div
          className="sticky top-0 z-30 flex items-center"
          style={{ height: 56, background: 'var(--the-mo)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--vien)', padding: '0 var(--k4)', gap: 'var(--k3)' }}
        >
          <button onClick={() => setXemLoiGiai(false)} className="tap-target shrink-0 flex items-center gap-1 font-bold" style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)', color: 'var(--muc)' }}>
            <ArrowLeft size={18} /> Quay lại
          </button>
          <div className="font-bold" style={{ fontSize: 'var(--cx-3)' }}>
            Xem lại lời giải
          </div>
        </div>
        <div className="px-3 sm:px-4 pb-12 flex flex-col" style={{ gap: 'var(--k5)', paddingTop: 'var(--k2)' }}>
          <DauPhan phan="I" soCau={solutionAssignment.phanI.length} />
          {solutionAssignment.phanI.map((item) => {
            stt += 1
            const q = item.question as TeacherMcqQuestion
            return (
              <TheCau
                key={item.qid}
                cheDo="xem_lai"
                phan="I"
                stt={stt}
                id={`cau-${stt}`}
                tieuDe={q.tieuDe}
                text={q.text}
                thanCauImg={q.thanCauImg}
                table={q.table}
                imageDataUrl={q.imageDataUrl}
                hinhAnh={q.hinhAnh}
                choices={q.choices}
                choiceImgs={q.choiceImgs}
                choicePerm={item.choicePerm}
                selected={(attempt.answers.phanI[item.qid] as 'A' | 'B' | 'C' | 'D' | undefined) ?? null}
                correct={q.correct}
                explanation={q.explanation}
                nhanLoiGiai={q.loiGiaiTrangThai}
                onZoom={setZoomSrc}
              />
            )
          })}
          <DauPhan phan="II" soCau={solutionAssignment.phanII.length} />
          {solutionAssignment.phanII.map((item) => {
            stt += 1
            const q = item.question as TeacherTrueFalseQuestion
            return (
              <TheCau
                key={item.qid}
                cheDo="xem_lai"
                phan="II"
                stt={stt}
                id={`cau-${stt}`}
                tieuDe={q.tieuDe}
                text={q.text}
                thanCauImg={q.thanCauImg}
                table={q.table}
                imageDataUrl={q.imageDataUrl}
                hinhAnh={q.hinhAnh}
                ideas={q.ideas}
                ideaImgs={q.ideaImgs}
                selected={attempt.answers.phanII[item.qid] ?? [null, null, null, null]}
                correct={q.correct}
                explanation={q.explanation}
                nhanLoiGiai={q.loiGiaiTrangThai}
                onZoom={setZoomSrc}
              />
            )
          })}
          <DauPhan phan="III" soCau={solutionAssignment.phanIII.length} />
          {solutionAssignment.phanIII.map((item) => {
            stt += 1
            const q = item.question as TeacherShortAnswerQuestion
            return (
              <TheCau
                key={item.qid}
                cheDo="xem_lai"
                phan="III"
                stt={stt}
                id={`cau-${stt}`}
                tieuDe={q.tieuDe}
                text={q.text}
                thanCauImg={q.thanCauImg}
                table={q.table}
                imageDataUrl={q.imageDataUrl}
                hinhAnh={q.hinhAnh}
                selected={attempt.answers.phanIII[item.qid] ?? null}
                correct={q.correct}
                explanation={q.explanation}
                nhanLoiGiai={q.loiGiaiTrangThai}
                onZoom={setZoomSrc}
              />
            )
          })}
        </div>
        {zoomSrc && <ZoomOverlay src={zoomSrc} onClose={() => setZoomSrc(null)} />}
      </Trang>
    )
  }

  // ------------------------------------------------------------- ĐÃ NỘP BÀI
  if (phase === 'submitted') {
    if (attempt?.integrity.blocked) {
      return (
        <Trang className="flex items-center justify-center px-4">
          <div className="w-full" style={{ maxWidth: 400 }}>
            <TheNoiDung>
              <div className="flex flex-col items-center text-center" style={{ gap: 'var(--k3)' }}>
                <TriangleAlert size={40} style={{ color: 'var(--do)' }} />
                <div className="font-bold" style={{ fontSize: 'var(--cx-4)', color: 'var(--do)' }}>
                  BÀI THI ĐÃ BỊ KHOÁ
                </div>
                <div style={{ fontSize: 'var(--cx-2)', lineHeight: 1.7 }}>
                  Em đã rời màn hình làm bài từ <b>2 lần trở lên</b>. Theo quy định, bài thi tự động nộp và được đánh dấu{' '}
                  <b>nghi vấn gian lận</b> để thầy xem xét, có thể kèm báo phụ huynh.
                </div>
                {attempt?.pendingSubmit && <Nhan tone="cam">Đang gửi lên hệ thống… đừng tắt trình duyệt</Nhan>}
              </div>
            </TheNoiDung>
          </div>
        </Trang>
      )
    }
    const soDaLam = attempt && assignment ? flat.filter((f) => daTraLoiEntry(attempt, assignment, f)).length : null
    const gioNop = attempt?.submittedAt ? new Date(attempt.submittedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''
    return (
      <Trang className="flex items-center justify-center px-4 py-8">
        <div className="w-full flex flex-col" style={{ maxWidth: 400, gap: 'var(--k4)' }}>
          <TheNoiDung>
            <div className="flex flex-col" style={{ gap: 'var(--k3)' }}>
              <div className="font-bold" style={{ fontSize: 'var(--cx-4)' }}>
                Đã nộp bài
              </div>
              <div className="flex flex-col" style={{ gap: 'var(--k1)', fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)', color: 'var(--nhat)' }}>
                <div>
                  Số báo danh: <b style={{ color: 'var(--muc)' }}>{attempt?.sbd}</b>
                </div>
                <div>
                  Mã ca: <b style={{ color: 'var(--muc)' }}>{attempt?.maCa}</b>
                </div>
                {gioNop && (
                  <div>
                    Giờ nộp: <b style={{ color: 'var(--muc)', ...SANS_SO }}>{gioNop}</b>
                  </div>
                )}
                {soDaLam !== null && (
                  <div>
                    Số câu đã làm:{' '}
                    <b style={{ color: 'var(--muc)', ...SANS_SO }}>
                      {soDaLam}/{flat.length}
                    </b>
                  </div>
                )}
              </div>
              {attempt?.pendingSubmit ? (
                <OThongBao tone="cam">Đang gửi lên hệ thống… đừng tắt trình duyệt. Bài đã lưu an toàn trên máy và sẽ tự gửi lại khi có mạng.</OThongBao>
              ) : graded ? (
                <OThongBao tone="xanh">
                  Điểm của em: <b style={SANS_SO}>{graded.score.total.toFixed(2)}/10</b> — {classify(graded.score.total)}.
                </OThongBao>
              ) : choCaLop ? (
                <OThongBao tone="cam">
                  Điểm sẽ tự hiện khi cả lớp nộp xong — đã nộp{' '}
                  <b style={SANS_SO}>
                    {choCaLop.daNop}/{choCaLop.daVao}
                  </b>{' '}
                  em. Giữ màn hình này, hoặc mở lại link sau.
                </OThongBao>
              ) : (
                <OThongBao tone="xanh">Thầy sẽ công bố kết quả sau.</OThongBao>
              )}
            </div>
          </TheNoiDung>

          {graded && !attempt?.integrity.blocked && (
            <NutChinh onClick={() => setGradedPopup(true)}>
              Xem điểm chi tiết
            </NutChinh>
          )}
          {keyBank && solutionAssignment && (
            <NutChinh variant="phu" onClick={() => setXemLoiGiai(true)}>
              Xem lại lời giải
            </NutChinh>
          )}
        </div>

        {gradedPopup && graded && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 py-6" style={{ background: 'var(--phu)' }}>
            <div className="w-full overflow-y-auto" style={{ maxWidth: 400, maxHeight: '85vh', background: 'var(--the)', borderRadius: 'var(--bo-3)', boxShadow: 'var(--bong-2)' }}>
              <div className="sticky top-0 flex items-start justify-between" style={{ background: 'var(--the)', padding: 'var(--k5) var(--k5) var(--k3)', borderBottom: '1px solid var(--vien)' }}>
                <div>
                  <div style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)' }}>Kết quả bài thi</div>
                  <div className="font-bold" style={{ fontSize: 'var(--cx-6)', ...SANS_SO }}>
                    {graded.score.total.toFixed(2)}
                    <span style={{ fontSize: 'var(--cx-2)', color: 'var(--nhat)', fontWeight: 500 }}>/10</span>
                  </div>
                  <div className="font-bold" style={{ fontSize: 'var(--cx-2)' }}>
                    {classify(graded.score.total)}
                  </div>
                </div>
                <button onClick={() => setGradedPopup(false)} className="shrink-0 flex items-center justify-center rounded-full" style={{ width: 32, height: 32, background: 'var(--the-2)', color: 'var(--nhat)' }}>
                  <X size={16} />
                </button>
              </div>
              <div className="flex flex-col" style={{ padding: 'var(--k4) var(--k5)', gap: 'var(--k3)' }}>
                <div className="grid grid-cols-3" style={{ gap: 'var(--k2)' }}>
                  {(
                    [
                      ['Phần I', graded.score.phanIScore, assignment?.phanI.length ?? 0, graded.wrongPhanI.length],
                      ['Phần II', graded.score.phanIIScore, assignment?.phanII.length ?? 0, graded.wrongPhanII.length],
                      ['Phần III', graded.score.phanIIIScore, assignment?.phanIII.length ?? 0, graded.wrongPhanIII.length],
                    ] as const
                  ).map(([label, pts, n, wrong]) => (
                    <div key={label} className="text-center" style={{ background: 'var(--the-2)', borderRadius: 'var(--bo-1)', padding: 'var(--k2)' }}>
                      <div style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)' }}>{label}</div>
                      <div className="font-bold" style={{ fontSize: 'var(--cx-4)', ...SANS_SO }}>
                        {pts.toFixed(2)}đ
                      </div>
                      <div style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)' }}>
                        {n - wrong}/{n} đúng
                      </div>
                    </div>
                  ))}
                </div>
                {graded.wrongPhanI.length + graded.wrongPhanII.length + graded.wrongPhanIII.length > 0 ? (
                  <OThongBao tone="do">
                    <b>Cần xem lại:</b>
                    {graded.wrongPhanI.length > 0 && <div>Phần I — câu {graded.wrongPhanI.join(', ')}</div>}
                    {graded.wrongPhanII.length > 0 && <div>Phần II — câu {graded.wrongPhanII.join(', ')}</div>}
                    {graded.wrongPhanIII.length > 0 && <div>Phần III — câu {graded.wrongPhanIII.join(', ')}</div>}
                  </OThongBao>
                ) : (
                  <OThongBao tone="xanh">Đúng hết tất cả các câu!</OThongBao>
                )}
                {!graded.score.crossSumOk && (
                  <div style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--cam)' }}>* Có sai lệch khi cộng điểm — thầy sẽ kiểm tra lại thủ công.</div>
                )}
                {solutionAssignment && (
                  <NutChinh
                    onClick={() => {
                      setGradedPopup(false)
                      setXemLoiGiai(true)
                    }}
                  >
                    Xem lại lời giải
                  </NutChinh>
                )}
                <NutChinh variant="phu" onClick={() => setGradedPopup(false)}>
                  Đóng
                </NutChinh>
              </div>
            </div>
          </div>
        )}
      </Trang>
    )
  }

  // ---------------------------------------------------------------- LÀM BÀI
  if (!assignment || !attempt || flat.length === 0) return null

  const total = flat.length
  const daLamCount = flat.filter((f) => daTraLoiEntry(attempt, assignment, f)).length
  const chuaLam = flat.map((f, i) => (daTraLoiEntry(attempt, assignment, f) ? null : i + 1)).filter((x): x is number => x !== null)
  const gapNow = remaining !== null && remaining <= 300
  const dotColor = !online ? 'var(--mo)' : saveFlash ? 'var(--cam)' : 'var(--xanh)'
  const dotLabel = !online ? 'mất mạng — đã lưu trên máy' : saveFlash ? 'đang lưu…' : 'đã lưu'

  let stt = 0
  const renderPhan = (phan: PhanKey) => {
    const items = phan === 'I' ? assignment.phanI : phan === 'II' ? assignment.phanII : assignment.phanIII
    if (items.length === 0) return null
    return (
      <>
        <DauPhan phan={phan} soCau={items.length} />
        {phan === 'I' &&
          assignment.phanI.map((item) => {
            stt += 1
            return (
              <TheCau
                key={item.qid}
                cheDo="thi"
                phan="I"
                stt={stt}
                id={`cau-${stt}`}
                text={item.question.text}
                thanCauImg={item.question.thanCauImg}
                table={item.question.table}
                imageDataUrl={item.question.imageDataUrl}
                hinhAnh={item.question.hinhAnh}
                choices={item.question.choices}
                choiceImgs={item.question.choiceImgs}
                choicePerm={item.choicePerm}
                selected={(attempt.answers.phanI[item.qid] as 'A' | 'B' | 'C' | 'D' | undefined) ?? null}
                onSelect={(orig) => setPhanI(item.qid, orig)}
                onZoom={setZoomSrc}
              />
            )
          })}
        {phan === 'II' &&
          assignment.phanII.map((item) => {
            stt += 1
            return (
              <TheCau
                key={item.qid}
                cheDo="thi"
                phan="II"
                stt={stt}
                id={`cau-${stt}`}
                text={item.question.text}
                thanCauImg={item.question.thanCauImg}
                table={item.question.table}
                imageDataUrl={item.question.imageDataUrl}
                hinhAnh={item.question.hinhAnh}
                ideas={item.question.ideas}
                ideaImgs={item.question.ideaImgs}
                selected={attempt.answers.phanII[item.qid] ?? [null, null, null, null]}
                onSelect={(idx, v) => setPhanII(item.qid, idx, v)}
                onZoom={setZoomSrc}
              />
            )
          })}
        {phan === 'III' &&
          assignment.phanIII.map((item) => {
            stt += 1
            return (
              <TheCau
                key={item.qid}
                cheDo="thi"
                phan="III"
                stt={stt}
                id={`cau-${stt}`}
                text={item.question.text}
                thanCauImg={item.question.thanCauImg}
                table={item.question.table}
                imageDataUrl={item.question.imageDataUrl}
                hinhAnh={item.question.hinhAnh}
                selected={attempt.answers.phanIII[item.qid] ?? null}
                onChange={(t) => setPhanIII(item.qid, t)}
                onZoom={setZoomSrc}
              />
            )
          })}
      </>
    )
  }

  return (
    <Trang className="man-lam-bai">
      {/* THANH TRÊN — 56px, dính, mờ; tiến độ 3px sát mép trên; chấm lưu 6px góc phải */}
      <div
        className="sticky top-0 z-30"
        style={{ height: 56, background: 'var(--the-mo)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: '1px solid var(--vien)' }}
      >
        <div className="absolute left-0 top-0 w-full" style={{ height: 3, background: 'var(--vien)' }}>
          <div style={{ height: 3, width: `${total ? (daLamCount / total) * 100 : 0}%`, background: 'var(--xanh)', transitionProperty: 'width', transitionDuration: 'var(--nhanh)' }} />
        </div>
        <span className="absolute rounded-full" style={{ top: 8, right: 8, width: 6, height: 6, background: dotColor }} title={dotLabel} aria-label={dotLabel} />
        <div className="h-full flex items-center justify-between" style={{ padding: '0 var(--k4)' }}>
          <div className="font-bold" style={{ ...SANS_SO, fontSize: 'var(--cx-2)' }}>
            {daLamCount}/{total}
          </div>
          <div className="font-bold" style={{ ...SANS_SO, fontSize: 'var(--cx-4)', color: gapNow ? 'var(--gap)' : 'var(--muc)', transitionProperty: 'color', transitionDuration: 'var(--nhanh)' }}>
            {formatClock(remaining ?? 0)}
          </div>
          <button onClick={() => setShowGrid(true)} className="tap-target flex items-center justify-center" style={{ color: 'var(--muc)' }} title="Danh sách câu" aria-label="Danh sách câu">
            <LayoutGrid size={22} />
          </button>
        </div>
      </div>

      {leaveWarning && (
        <div className="sticky z-30 px-3" style={{ top: 60, paddingTop: 'var(--k1)' }}>
          <div className="flex items-start" style={{ background: 'var(--do)', color: 'var(--muc-nguoc)', borderRadius: 'var(--bo-1)', padding: 'var(--k3)', gap: 'var(--k2)', boxShadow: 'var(--bong-2)' }}>
            <TriangleAlert size={20} className="shrink-0 mt-0.5" />
            <div style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)', lineHeight: 1.5 }}>
              <b>Em vừa rời khỏi màn hình làm bài</b> (lần {leaveWarning.count}, {leaveWarning.sec} giây). Thầy đã ghi lại — hành vi này sẽ đưa vào báo cáo gửi
              phụ huynh khi thầy xem xét bài thi. <b>Nếu em rời màn hình thêm một lần nữa, bài thi sẽ tự động NỘP NGAY và bị đánh dấu nghi vấn gian lận.</b>
            </div>
            <button onClick={() => setLeaveWarning(null)} className="shrink-0 text-lg leading-none px-1" style={{ color: 'var(--muc-nguoc)', opacity: 0.85 }}>
              ×
            </button>
          </div>
        </div>
      )}

      {/* DANH SÁCH CÂU — cuộn dọc liên tục, đầu phần dính */}
      <div className="px-3 sm:px-4 flex flex-col" style={{ gap: 'var(--k5)', paddingTop: 'var(--k2)', paddingBottom: 'calc(var(--k8) + env(safe-area-inset-bottom))' }}>
        {renderPhan('I')}
        {renderPhan('II')}
        {renderPhan('III')}
        <div style={{ paddingTop: 'var(--k3)' }}>
          <NutChinh onClick={() => setShowConfirm(true)}>Nộp bài</NutChinh>
        </div>
      </div>

      {/* LƯỚI SỐ CÂU — tấm trượt từ dưới lên */}
      {showGrid && (
        <div className="fixed inset-0 z-40 flex items-end" style={{ background: 'var(--phu)' }} onClick={() => setShowGrid(false)}>
          <div
            className="w-full flex flex-col"
            style={{ background: 'var(--the)', borderTopLeftRadius: 'var(--bo-3)', borderTopRightRadius: 'var(--bo-3)', padding: 'var(--k4)', gap: 'var(--k3)', maxHeight: '75vh', paddingBottom: 'calc(var(--k4) + env(safe-area-inset-bottom))', boxShadow: 'var(--bong-2)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="font-bold" style={{ fontSize: 'var(--cx-3)' }}>
                Đã làm{' '}
                <span style={SANS_SO}>
                  {daLamCount}/{total}
                </span>
              </div>
              <button onClick={() => setShowGrid(false)} className="tap-target flex items-center justify-center" style={{ color: 'var(--nhat)' }} aria-label="Đóng">
                <X size={20} />
              </button>
            </div>
            <div className="grid grid-cols-6 overflow-y-auto" style={{ gap: 'var(--k2)', maxHeight: '45vh' }}>
              {flat.map((f, i) => {
                const done = daTraLoiEntry(attempt, assignment, f)
                return (
                  <button
                    key={i}
                    onClick={() => {
                      setShowGrid(false)
                      cuonToiCau(i + 1)
                    }}
                    className="tap-target aspect-square flex items-center justify-center font-bold"
                    style={{ ...SANS_SO, fontSize: 'var(--cx-2)', borderRadius: 'var(--bo-1)', background: done ? 'var(--muc)' : 'var(--the-2)', color: done ? 'var(--muc-nguoc)' : 'var(--muc)' }}
                  >
                    {i + 1}
                  </button>
                )
              })}
            </div>
            <NutChinh
              onClick={() => {
                setShowGrid(false)
                setShowConfirm(true)
              }}
            >
              Nộp bài
            </NutChinh>
          </div>
        </div>
      )}

      {/* XÁC NHẬN NỘP BÀI */}
      {showConfirm && (
        <HopThoai>
          <div style={{ fontSize: 'var(--cx-3)', lineHeight: 1.6 }}>
            Em đã làm{' '}
            <b style={SANS_SO}>
              {daLamCount}/{total}
            </b>{' '}
            câu.
          </div>
          {chuaLam.length > 0 && (
            <OThongBao tone="do">
              Còn {chuaLam.length} câu chưa làm: câu {chuaLam.join(', ')}.
            </OThongBao>
          )}
          <div style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)' }}>Sau khi nộp không sửa được nữa.</div>
          <div className="flex" style={{ gap: 'var(--k2)' }}>
            <NutChinh
              variant="phu"
              onClick={() => {
                setShowConfirm(false)
                if (chuaLam.length > 0) cuonToiCau(chuaLam[0])
              }}
            >
              Xem lại
            </NutChinh>
            <NutChinh
              onClick={() => {
                setShowConfirm(false)
                doSubmit(attempt)
              }}
            >
              Nộp bài
            </NutChinh>
          </div>
        </HopThoai>
      )}

      {/* BẤM BACK TRONG LÚC THI */}
      {showBackDialog && (
        <HopThoai>
          <div style={{ fontSize: 'var(--cx-3)', lineHeight: 1.6 }}>Đang làm bài, không thoát được. Nộp bài luôn?</div>
          <div className="flex" style={{ gap: 'var(--k2)' }}>
            <NutChinh variant="phu" onClick={() => setShowBackDialog(false)}>
              Tiếp tục làm
            </NutChinh>
            <NutChinh
              onClick={() => {
                setShowBackDialog(false)
                doSubmit(attempt)
              }}
            >
              Nộp bài
            </NutChinh>
          </div>
        </HopThoai>
      )}

      {zoomSrc && <ZoomOverlay src={zoomSrc} onClose={() => setZoomSrc(null)} />}
    </Trang>
  )
}

// Khung trang chung cho mọi trạng thái của màn này — nền --nen, chữ --muc,
// KHÔNG theo theme tối của App (một bộ màu cố định cho học sinh). Định nghĩa
// NGOÀI component chính để không bị tạo lại mỗi lần render (nếu khai báo bên
// trong, React sẽ unmount/mount lại cả trang mỗi lần chọn đáp án — mất vị trí
// cuộn và focus ô nhập).
function Trang({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`min-h-screen ${className}`} style={{ background: 'var(--nen)', color: 'var(--muc)', fontFamily: 'var(--serif)' }}>
      {children}
    </div>
  )
}

function HopThoai({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'var(--phu)' }}>
      <div className="w-full flex flex-col" style={{ maxWidth: 400, background: 'var(--the)', borderRadius: 'var(--bo-3)', padding: 'var(--k5)', gap: 'var(--k3)', boxShadow: 'var(--bong-2)' }}>
        {children}
      </div>
    </div>
  )
}

function ZoomOverlay({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-2 overflow-auto" style={{ background: 'var(--phu-dam)' }} onClick={onClose}>
      <img src={src} alt="Phóng to" className="max-w-full max-h-full" style={{ borderRadius: 'var(--bo-1)' }} />
    </div>
  )
}
