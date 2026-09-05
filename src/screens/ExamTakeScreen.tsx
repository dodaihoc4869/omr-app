import { useEffect, useMemo, useRef, useState } from 'react'
import type { PublicExamBank, TeacherExamSource, TeacherMcqQuestion, TeacherShortAnswerQuestion, TeacherTrueFalseQuestion } from '../data/examContent'
import { assignStudentQuestions, type StudentAssignment } from '../lib/exam-assign'
import { vaoThi, thongDiepChan, submitAnswers, pushExamStatus, sendParentFeedback, fetchKetQua, sendStudentMessage, ghiDiem, luuTam, CHU_KY_LUU_TAM_GIAY, type KeyBank, type CongBoDiem, type KetQuaVaoThi } from '../lib/exam-api'
import { taoBaiGhiDiem, taoChiTietCau } from '../lib/chi-tiet-cau'
import { dungPhieuMayEm, type PhieuDayDu } from '../lib/phieu-du-lieu'
import PhieuScreen from './PhieuScreen'
import { gioMayChu, gioNgan } from '../lib/gio-may-chu'
import { layIdThietBi } from '../lib/thiet-bi'
import { chuanHoaNguong, khoaViRoiLau, loiCanhBao, mucKhiRoiMan, soLanTinhTu, type NguongGianLan } from '../lib/chong-gian-lan'
import { MS_AN_HAN_VAO_BAI, MS_TRUNG_KHOP, MS_VE_SOM, MS_XAC_NHAN_CO_MAN, MS_XAC_NHAN_CUA_SO_NOI, type PhieuKenh } from '../lib/do-dau-vet'
import {
  LOI_KHOA,
  MUC_NGAT_MAC_DINH,
  NGUONG_XUNG_CHOT,
  MS_LECH_DONG_HO_CHOT,
  MS_RAF_NGHI_CHOT,
  TI_LE_CO_MAN_CHOT,
  chuNhomPhieu,
  coKhoa,
  duKhoaMotMinh,
  laCuaSoNoi,
  LOI_CHE_BAT_DONG,
  MS_BAT_DONG_CHE,
  SO_NGON_CHUP,
  MS_KHONG_CHAM_QUANH_PHIEU,
  MS_NHIP_SOI_TIEU_DIEM,
  nhomDuKhoa,
  xetCoMan,
  type LyDoKhoaMoi,
  type TrangThaiCoMan,
} from '../lib/man-thi-sach'
import { thuTinHieu } from '../lib/thu-tin-hieu'
import { TEN_LY_DO_KHOA } from '../lib/man-thi-sach'
import ManChan from '../components/ManChan'
import VanTay from '../components/VanTay'
import TheCau from '../components/TheCau'
import MaCaInput from '../components/MaCaInput'
import LogoDDH from '../components/LogoDDH'
import { TheNoiDung, NutChinh, OThongBao, Nhan } from '../components/DesignSystem'
import { TriangleAlert, X, ArrowLeft, LayoutGrid } from 'lucide-react'
import { classify } from '../engine/score'
import { gradeFromKeyBank, type GradedSubmission } from '../lib/exam-grade'
import {
  cacheSession,
  emptyAnswerRecord,
  emptyIntegrityLog,
  hetGioCua,
  loadAttempt,
  loadCachedSession,
  loadScriptUrlHoacMacDinh,
  saveAttempt,
  saveScriptUrl,
  type ExamAttempt,
} from '../lib/exam-db'
import { useAppStore } from '../store/appStore'
import { datDangLamBai } from '../lib/cap-nhat-app'
import { napDong } from '../lib/nap-manh'
import KhungXemPhieu from '../components/KhungXemPhieu'

/** Đang toàn màn hình: đã thêm vào màn hình chính (standalone) HOẶC Fullscreen API đang bật. */
function dangToanManHinh(): boolean {
  if (typeof document === 'undefined') return true
  const nav = navigator as Navigator & { standalone?: boolean }
  if (nav.standalone || window.matchMedia('(display-mode: standalone)').matches || window.matchMedia('(display-mode: fullscreen)').matches) return true
  const d = document as Document & { webkitFullscreenElement?: Element | null }
  return !!(document.fullscreenElement || d.webkitFullscreenElement)
}
function coTheBatToanManHinh(): boolean {
  if (typeof document === 'undefined') return false
  const el = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void }
  return typeof el.requestFullscreen === 'function' || typeof el.webkitRequestFullscreen === 'function'
}
async function batToanManHinh(): Promise<void> {
  const el = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void }
  try {
    if (typeof el.requestFullscreen === 'function') await el.requestFullscreen({ navigationUI: 'hide' } as FullscreenOptions)
    else if (typeof el.webkitRequestFullscreen === 'function') await el.webkitRequestFullscreen()
  } catch {
    // trình duyệt từ chối (vd iOS Safari) — ô nhắc phía trên đã hướng dẫn thêm vào màn hình chính
  }
}

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

const KHOA_HO_TEN = 'ddh.em.hoTen'
const KHOA_NAM_SINH = 'ddh.em.namSinh'

/** Ô nhập họ tên / năm sinh ở màn vào thi — cùng kích cỡ với ô số báo danh. */
const O_DANH_TINH: React.CSSProperties = {
  height: 52,
  borderRadius: 'var(--bo-1)',
  padding: '0 var(--k4)',
  background: 'var(--the-2)',
  border: '1.5px solid transparent',
  fontFamily: 'var(--serif)',
  fontSize: 'var(--cx-3)',
  color: 'var(--muc)',
  outline: 'none',
}

export default function ExamTakeScreen() {
  const showToast = useAppStore((s) => s.showToast)

  const [phase, setPhase] = useState<'join' | 'loading' | 'exam' | 'submitted' | 'error'>('join')
  const [errorMsg, setErrorMsg] = useState('')

  const [maCa, setMaCa] = useState('')
  const [sbd, setSbd] = useState('')
  // DANH TÍNH — máy chủ đối chiếu đủ ba (số báo danh, họ tên, năm sinh) với
  // danh sách thầy đã nạp. Nhớ trên máy để lần sau em chỉ gõ mã ca; đây là
  // tiện dùng, KHÔNG phải quyền: máy chủ vẫn kiểm lại mỗi lần vào thi.
  const [hoTen, setHoTen] = useState(() => {
    try { return localStorage.getItem(KHOA_HO_TEN) ?? '' } catch { return '' }
  })
  const [namSinh, setNamSinh] = useState(() => {
    try { return localStorage.getItem(KHOA_NAM_SINH) ?? '' } catch { return '' }
  })
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
  // TÍN HIỆU MỚI (BAOMATCATHI): lý do đang che đề; null = không che.
  const [lyDoChe, setLyDoChe] = useState<string | null>(null)
  const leaveCountRef = useRef(0)
  // TOÀN MÀN HÌNH: bắt buộc trước khi vào thi (đã thêm vào màn hình chính =
  // standalone, hoặc bật Fullscreen API). Thoát toàn màn hình giữa chừng =
  // rời màn hình = khoá bài.
  const [toanManHinh, setToanManHinh] = useState(() => dangToanManHinh())
  useEffect(() => {
    const cap = () => setToanManHinh(dangToanManHinh())
    document.addEventListener('fullscreenchange', cap)
    document.addEventListener('webkitfullscreenchange', cap)
    const mq = window.matchMedia('(display-mode: standalone)')
    mq.addEventListener('change', cap)
    return () => {
      document.removeEventListener('fullscreenchange', cap)
      document.removeEventListener('webkitfullscreenchange', cap)
      mq.removeEventListener('change', cap)
    }
  }, [])
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
  // Màn báo cáo học tập của chính em, mở từ màn "Đã nộp bài".
  const [xemBaoCao, setXemBaoCao] = useState(false)
  const [dangTaiDe, setDangTaiDe] = useState(false)
  // Phiếu hiện NGAY TRONG APP, không mở thẻ mới — app đã cài chạy ở cửa sổ
  // riêng, không có thẻ để mở.
  const [htmlDe, setHtmlDe] = useState('')
  const [xemLoiGiai, setXemLoiGiai] = useState(false)

  // ---- Trạng thái riêng của màn làm bài ----
  const [showGrid, setShowGrid] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showBackDialog, setShowBackDialog] = useState(false)
  const [zoomSrc, setZoomSrc] = useState<string | null>(null)
  // Dải cảnh báo rời màn (mục 6): nhẹ (lần 1) / đậm (lần 2+), tự ẩn sau 15 giây.
  const [canhBaoRoi, setCanhBaoRoi] = useState<{ muc: 'nhe' | 'dam'; loi: string } | null>(null)
  const canhBaoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const roiLauTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
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

  // Đang thi thì hoãn việc tự tải bản app mới — tải lại giữa bài làm mất toàn
  // màn hình và có thể bị tính là một lần rời màn (xem cap-nhat-app.ts).
  useEffect(() => {
    datDangLamBai(phase === 'exam')
    return () => datDangLamBai(false)
  }, [phase])

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

  // BÁO CÁO HỌC TẬP dựng NGAY TRÊN MÁY EM. Không gọi thêm lệnh máy chủ nào:
  // máy em đã có bài làm, giây từng câu và ngân hàng CÓ đáp án của ca. Mục nào
  // cần dữ liệu chỉ thầy có (hạng lớp, phân bố điểm, lịch sử ca) thì trang báo
  // cáo tự giấu, chứ không dựng mục rỗng.
  /** Tải ĐÚNG bộ câu em vừa làm, kèm lời giải, theo mẫu phiếu đã chốt. */
  const taiDeCuaEm = async () => {
    if (!solutionAssignment || !attempt) return
    setDangTaiDe(true)
    try {
      const bo = [
        ...solutionAssignment.phanI.map((a) => ({ phan: 'I' as const, q: a.question as TeacherMcqQuestion })),
        ...solutionAssignment.phanII.map((a) => ({ phan: 'II' as const, q: a.question as TeacherTrueFalseQuestion })),
        ...solutionAssignment.phanIII.map((a) => ({ phan: 'III' as const, q: a.question as TeacherShortAnswerQuestion })),
      ]
      const [{ cauLuyenTuBoCau }, { dungPhieu }] = await napDong(() =>
        Promise.all([import('../lib/bai-tap-pdf'), import('../lib/html-phieu')]),
      )
      const cau = cauLuyenTuBoCau(bo)
      const cd = [...new Set(cau.map((c) => c.chuyenDe).filter(Boolean))]
      const html = dungPhieu(
        {
          hoTen: hoTen.trim() || `SBD ${attempt.sbd}`,
          sbd: attempt.sbd,
          ngay: new Date(),
          tenChuyenDe: cd.length === 1 ? cd[0] : attempt.tenCa || 'Hoá học',
          ketQua: graded ? `Điểm ${graded.score.total.toFixed(2)}/10` : '',
          hienDapAn: true,
          nhanBia: 'Đề của em kèm lời giải',
          oBia: [
            { nhan: 'Học sinh', gia: hoTen.trim() || `SBD ${attempt.sbd}` },
            { nhan: 'SBD', gia: attempt.sbd },
            ...(attempt.tenCa ? [{ nhan: 'Bài kiểm tra', gia: attempt.tenCa }] : []),
          ],
        },
        cau,
      )
      setHtmlDe(html)
    } catch {
      showToast('Chưa mở được đề. Em thử lại khi máy rảnh hơn.', 'error')
    } finally {
      setDangTaiDe(false)
    }
  }

  const phieuCuaEm: PhieuDayDu | null = useMemo(() => {
    if (!keyBank || !attempt || !graded) return null
    try {
      const banks: TeacherExamSource[] = [{ maDe: attempt.maDe || attempt.maCa, phanI: keyBank.phanI, phanII: keyBank.phanII, phanIII: keyBank.phanIII }]
      const rows = taoChiTietCau(keyBank, attempt.maCa, attempt.sbd, attempt.answers, attempt.giayCau)
      return dungPhieuMayEm({
        hoTen: hoTen.trim(),
        sbd: attempt.sbd,
        maCa: attempt.maCa,
        nopLuc: attempt.submittedAt || new Date().toISOString(),
        vaoLuc: attempt.startedAt,
        thoiLuongPhut: attempt.durationMinutes,
        diem: graded.score.total,
        diemPhan: { I: graded.score.phanIScore, II: graded.score.phanIIScore, III: graded.score.phanIIIScore },
        rows,
        banks,
        // Em thấy đúng thứ thầy và phụ huynh sẽ thấy. Em đã nhận cảnh báo ngay
        // lúc rời màn rồi, nên đây không phải tin dữ bất ngờ — chỉ là bản ghi.
        viPham: {
          soLan: attempt.integrity.leaveCount || 0,
          tongGiay: Math.round((attempt.integrity.totalHiddenMs || 0) / 1000),
          daKhoa: Boolean(attempt.integrity.blocked),
          lyDoKhoa: attempt.integrity.lyDoKhoa ?? null,
          events: attempt.integrity.events ?? null,
        },
      })
    } catch {
      return null
    }
  }, [keyBank, attempt, graded, hoTen])
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

  // Mở lại màn "Đã nộp" từ bản đã lưu trên máy (đã nộp trước đó): nạp lại đề
  // đã cache để đếm số câu / hiện điểm; effect hỏi lại kết quả (fetchKetQua)
  // chạy ở màn đó. Bài chưa gửi được (mất mạng lúc nộp) thì gửi tiếp.
  const moLaiDaNop = async (existing: ExamAttempt) => {
    const cachedCu = await loadCachedSession(existing.maCa)
    if (cachedCu) {
      setBank(cachedCu.bank)
      setLop(cachedCu.lop)
    }
    setAttempt(existing)
    setPhase('submitted')
    if (existing.pendingSubmit) trySend(existing)
  }

  // VÀO THI (QUANLYCATHI.md mục 1 + 3): máy chủ quyết định — một SBD một lượt
  // mỗi ca, phân biệt máy bằng id thiết bị, 3 mốc thời gian, giờ máy chủ.
  // Không có mạng: CHỈ cho tiếp tục lượt đang làm dở trên chính máy này (đề
  // đã cache) — không tạo được lượt mới ngoài tầm máy chủ.
  const handleJoin = async () => {
    const ma = maCa.trim()
    const sb = sbd.trim()
    const ten = hoTen.trim()
    const nam = namSinh.trim()
    if (!ma || !sb) return showToast('Nhập đủ mã ca và số báo danh', 'error')
    if (!ten) return showToast('Nhập họ tên đúng như Thầy ghi trong sổ', 'error')
    if (!/^(19|20)\d{2}$/.test(nam)) return showToast('Nhập năm sinh 4 chữ số, ví dụ 2009', 'error')
    // Nhớ cho lần sau — em không phải gõ lại mỗi ca.
    try {
      localStorage.setItem(KHOA_HO_TEN, ten)
      localStorage.setItem(KHOA_NAM_SINH, nam)
    } catch {
      // trình duyệt chặn storage — chỉ mất tiện dùng, vẫn thi được
    }
    setPhase('loading')
    try {
      const existing = await loadAttempt(ma, sb)
      const cached = await loadCachedSession(ma)
      const url = scriptUrl.trim()
      const idTb = layIdThietBi()

      let kq: KetQuaVaoThi | null = null
      if (url) {
        try {
          kq = await vaoThi(url, ma, sb, idTb, !cached, { hoTen: ten, namSinh: nam })
        } catch {
          kq = null
        }
      }

      if (!kq) {
        if (existing?.submitted) return moLaiDaNop(existing)
        if (existing && cached && !existing.submitted) {
          // Rớt mạng, mở lại cùng máy: tiếp tục lượt dở — mốc hết giờ đã lưu từ máy chủ.
          setBank(cached.bank)
          setLop(cached.lop)
          setAttempt(existing)
          setPhase('exam')
          return
        }
        throw new Error(url ? 'Không kết nối được máy chủ — cần mạng để vào thi. Kiểm tra mạng rồi bấm Vào thi lại.' : 'Chưa có link kết nối — mở đúng link thầy gửi.')
      }

      if (!kq.ok) {
        // Đã nộp đúng lượt này trên chính máy này → mở màn "Đã nộp" (xem điểm,
        // lời giải) thay vì báo lỗi; các trường hợp chặn khác hiện lý do rõ.
        if (kq.lyDo === 'da_nop' && existing?.submitted && (existing.lanThu ?? 1) === (kq.lanThu ?? 1)) return moLaiDaNop(existing)
        throw new Error(thongDiepChan(kq, gioNgan))
      }

      // Thầy vừa MỞ KHOÁ (mục 6): máy này đang giữ bài bị khoá → bỏ khoá, đếm
      // ngưỡng lại từ mốc hiện tại, giữ nguyên đáp án + lịch sử rời màn, làm tiếp.
      if (kq.cach === 'khoi_phuc' && existing?.submitted && existing.integrity.blocked && kq.daMoKhoa) {
        const bankMo = cached?.bank ?? kq.bank
        if (!bankMo) throw new Error('Máy chủ chưa gửi đề — bấm Vào thi lại.')
        setBank(bankMo)
        setLop(kq.lop)
        setCongBo(kq.congBo)
        const moKhoaRoi: ExamAttempt = {
          ...existing,
          submitted: false,
          submittedAt: null,
          pendingSubmit: false,
          hetGioLuc: kq.hetGioLuc,
          nguong: { lan: kq.nguongLan, giay: kq.nguongGiay },
          integrity: { ...existing.integrity, blocked: false, lyDoKhoa: undefined, mocMoKhoa: existing.integrity.leaveCount, soLanMoKhoa: (existing.integrity.soLanMoKhoa ?? 0) + 1 },
        }
        await saveAttempt(moKhoaRoi)
        setAttempt(moKhoaRoi)
        showToast('Thầy đã mở khoá — em làm tiếp, đừng rời màn hình nữa', 'success')
        setPhase('exam')
        return
      }
      // Máy chủ nói "khôi phục" nhưng máy này đã nộp (mất mạng lúc nộp, máy chủ
      // chưa nhận) → về màn Đã nộp và gửi tiếp, không cho làm lại.
      if (kq.cach === 'khoi_phuc' && existing?.submitted) return moLaiDaNop(existing)

      const bank = cached?.bank ?? kq.bank
      if (!bank) throw new Error('Máy chủ chưa gửi đề — bấm Vào thi lại.')
      if (!cached || kq.bank) await cacheSession({ maCa: ma, lop: kq.lop, thoiGianPhut: kq.thoiGianPhut, bank })
      setBank(bank)
      setLop(kq.lop)
      setCongBo(kq.congBo)

      // Lượt trước nộp lúc mất mạng chưa gửi được mà máy chủ đã cho lượt mới
      // (thầy duyệt thi lại) → gửi nốt bài cũ trước, không để mất.
      if (existing?.submitted && existing.pendingSubmit && kq.cach !== 'khoi_phuc') {
        try {
          await submitAnswers(url, existing.maCa, existing.sbd, existing.maDe, existing.answers, existing.integrity, existing.lanThu ?? 1, existing.idThietBi ?? idTb)
        } catch {
          // vẫn mở lượt mới — máy chủ đã ghi trạng thái lượt cũ theo cách của nó
        }
      }

      const giuLuotDo = kq.cach === 'khoi_phuc' && existing && !existing.submitted && (existing.lanThu ?? 1) === kq.lanThu
      const nguong = { lan: kq.nguongLan, giay: kq.nguongGiay }
      const thongTinCa = { loai: kq.loai, hanNop: kq.hanNop, tenCa: kq.tenCa }
      const a: ExamAttempt = giuLuotDo
        ? { ...existing, startedAt: kq.vaoLuc, hetGioLuc: kq.hetGioLuc, durationMinutes: kq.thoiGianPhut, idThietBi: idTb, nguong, ...thongTinCa }
        : {
            key: `${ma}:${sb}`,
            maCa: ma,
            sbd: sb,
            maDe: 'ngân hàng',
            startedAt: kq.vaoLuc,
            durationMinutes: kq.thoiGianPhut,
            hetGioLuc: kq.hetGioLuc,
            lanThu: kq.lanThu,
            idThietBi: idTb,
            nguong,
            ...thongTinCa,
            answers: emptyAnswerRecord(),
            integrity: emptyIntegrityLog(),
            submitted: false,
            submittedAt: null,
            pendingSubmit: false,
          }
      await saveAttempt(a)
      setAttempt(a)
      if (kq.cach === 'duyet_lai') showToast(`Thầy đã duyệt cho thi lại — lần ${kq.lanThu}`, 'success')
      setPhase('exam')
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Lỗi không rõ nguyên nhân')
      setPhase('error')
    }
  }

  // Đồng hồ đếm ngược: mốc hết giờ do MÁY CHỦ đặt (hetGioLuc), thời gian hiện
  // tại lấy từ gioMayChu() (đã hiệu chỉnh theo máy chủ, chống chỉnh giờ máy) —
  // không cộng dồn setInterval để không lệch giờ.
  useEffect(() => {
    if (phase !== 'exam' || !attempt) return
    // BÀI TẬP VỀ NHÀ: không đồng hồ đếm ngược, không tự nộp — chỉ hiện hạn nộp
    // (BA-APP.md mục 6). Quá hạn vẫn làm và nộp được, máy chủ đánh dấu quá hạn.
    if (attempt.loai === 'baitap') {
      setRemaining(null)
      return
    }
    const deadline = new Date(hetGioCua(attempt)).getTime()
    const tick = () => setRemaining((deadline - gioMayChu()) / 1000)
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [phase, attempt])

  // Gửi trạng thái làm bài lên máy chủ theo lô mỗi 10 giây (GIAO-DIEN-LAM-BAI.md
  // "Lưu bài"): ngay khi vào thi + định kỳ, không cần đợi em thao tác gì.
  useEffect(() => {
    if (phase !== 'exam') return
    if (attemptRef.current) pushStatusNow(attemptRef.current, true)
    const id = setInterval(() => {
      if (attemptRef.current) pushStatusNow(attemptRef.current, true)
    }, 10000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // LƯU TẠM ĐÁP ÁN lên máy chủ mỗi 20 giây (CATHIVAGOILENBANG mục 1).
  //
  // Vì sao phải có: thầy khoá ca giữa giờ thì máy chủ chấm PHẦN ĐÃ LÀM của em
  // đang làm dở. Không có bản lưu tạm này thì máy chủ chẳng có gì để chấm — em
  // ngồi làm 30 phút xong nhận 0 điểm.
  //
  // Chạy nền: không spinner, không toast, mất mạng một nhịp thì bỏ qua nhịp
  // đó — nhịp sau ghi đè đủ. Không bao giờ chặn thao tác của em.
  useEffect(() => {
    if (phase !== 'exam') return
    const luu = () => {
      const a = attemptRef.current
      const url = scriptUrlRef.current.trim()
      if (!a || !url) return
      void luuTam(url, a.maCa, a.sbd, a.answers, giayCauRef.current)
    }
    const id = setInterval(luu, CHU_KY_LUU_TAM_GIAY * 1000)
    return () => {
      clearInterval(id)
      // Rời màn làm bài (nộp, hết giờ, đóng tab) thì lưu nốt nhịp cuối.
      luu()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // GIÂY LÀM TỪNG CÂU (QUANLYCATHI mục 5): mỗi giây cộng 1 cho câu đang chiếm
  // nhiều màn hình nhất (IntersectionObserver trên thẻ câu). Không đếm khi màn
  // bị ẩn. Lưu vào attempt mỗi 10 giây + lúc nộp — mở lại vẫn cộng tiếp.
  const giayCauRef = useRef<Record<string, number>>({})
  useEffect(() => {
    if (phase !== 'exam' || !assignment || flat.length === 0) return
    giayCauRef.current = { ...(attemptRef.current?.giayCau ?? {}) }
    const qidCua = (stt: number): string | null => {
      const f = flat[stt - 1]
      if (!f) return null
      const items = f.phan === 'I' ? assignment.phanI : f.phan === 'II' ? assignment.phanII : assignment.phanIII
      return items[f.i]?.qid ?? null
    }
    const tiLe = new Map<number, number>()
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const stt = Number((e.target as HTMLElement).id.replace('cau-', ''))
          tiLe.set(stt, e.isIntersecting ? e.intersectionRatio : 0)
        }
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] },
    )
    for (let stt = 1; stt <= flat.length; stt++) {
      const el = document.getElementById(`cau-${stt}`)
      if (el) io.observe(el)
    }
    const tick = setInterval(() => {
      if (document.hidden) return
      let best = 0
      let bestStt = 0
      tiLe.forEach((r, stt) => {
        if (r > best) {
          best = r
          bestStt = stt
        }
      })
      if (!bestStt) return
      const qid = qidCua(bestStt)
      if (!qid) return
      giayCauRef.current[qid] = (giayCauRef.current[qid] ?? 0) + 1
    }, 1000)
    const luu = setInterval(() => {
      setAttempt((cur) => {
        if (!cur || cur.submitted) return cur
        const next = { ...cur, giayCau: { ...giayCauRef.current } }
        saveAttempt(next)
        return next
      })
    }, 10000)
    return () => {
      io.disconnect()
      clearInterval(tick)
      clearInterval(luu)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, assignment])

  // CHỐNG GIAN LẬN THEO MỨC (QUANLYCATHI mục 6, thay quy định "1 lần là khoá"
  // ngày 2/9): rời màn (chuyển app, tắt màn hình, mất tiêu điểm — bắt được cả
  // cửa sổ nổi vừa hiện, thoát toàn màn hình) → lần 1 cảnh báo nhẹ, lần 2 cảnh
  // báo đậm + rung, lần thứ N (ngưỡng ca, mặc định 3) → KHOÁ + tự nộp phần đã
  // làm; một lần rời quá M giây (mặc định 30) → khoá ngay. Cuộc gọi đến, pin
  // yếu cũng gây blur nên không khoá oan ngay lần đầu. Thầy mở khoá được ở màn
  // Chi tiết ca. KHÔNG thể phát hiện CHỤP ẢNH MÀN HÌNH bằng JavaScript.
  useEffect(() => {
    if (phase !== 'exam') return
    const nguong: NguongGianLan = chuanHoaNguong(attemptRef.current?.nguong)
    const khoa = (cur: ExamAttempt, lyDo: 'qua_so_lan' | 'roi_qua_lau', themMs: number) => {
      const next: ExamAttempt = {
        ...cur,
        integrity: { ...cur.integrity, totalHiddenMs: cur.integrity.totalHiddenMs + themMs, blocked: true, lyDoKhoa: lyDo },
      }
      attemptRef.current = next
      setAttempt(next)
      saveAttempt(next)
      pushStatusNow(next, false)
      baoThayGianLan(next)
      doSubmit(next)
    }
    const logEvent = (type: 'hidden' | 'visible' | 'blur' | 'focus') => {
      const cur = attemptRef.current
      if (!cur || cur.submitted) return
      const events = [...cur.integrity.events, { type, at: new Date().toISOString() }].slice(-200)
      if (type === 'hidden' || type === 'blur') {
        if (hiddenSinceRef.current !== null) return // đã đang ẩn (blur rồi hidden) — tính 1 lần
        hiddenSinceRef.current = Date.now()
        const leaveCount = cur.integrity.leaveCount + 1
        leaveCountRef.current = leaveCount
        const next: ExamAttempt = { ...cur, integrity: { ...cur.integrity, leaveCount, events } }
        attemptRef.current = next
        setAttempt(next)
        saveAttempt(next)
        pushStatusNow(next, true)
        const muc = mucKhiRoiMan(leaveCount, cur.integrity.mocMoKhoa ?? 0, nguong)
        if (muc === 'khoa') {
          hiddenSinceRef.current = null
          khoa(next, 'qua_so_lan', 0)
          return
        }
        // Rời quá lâu → khoá ngay cả khi em chưa quay lại (đồng hồ chờ; trình
        // duyệt có thể tạm dừng khi ẩn → lúc quay lại vẫn kiểm tra lại thời gian).
        if (roiLauTimerRef.current) clearTimeout(roiLauTimerRef.current)
        roiLauTimerRef.current = setTimeout(() => {
          const c = attemptRef.current
          if (!c || c.submitted || hiddenSinceRef.current === null) return
          const ms = Date.now() - hiddenSinceRef.current
          hiddenSinceRef.current = null
          khoa(c, 'roi_qua_lau', ms)
        }, nguong.giay * 1000 + 500)
        setCanhBaoRoi({ muc, loi: loiCanhBao(muc, soLanTinhTu(leaveCount, cur.integrity.mocMoKhoa ?? 0), nguong) })
        if (muc === 'dam') navigator.vibrate?.([200, 100, 200])
        if (canhBaoTimerRef.current) clearTimeout(canhBaoTimerRef.current)
        canhBaoTimerRef.current = setTimeout(() => setCanhBaoRoi(null), 15000)
      } else if (hiddenSinceRef.current !== null) {
        const ms = Date.now() - hiddenSinceRef.current
        hiddenSinceRef.current = null
        if (roiLauTimerRef.current) clearTimeout(roiLauTimerRef.current)
        if (khoaViRoiLau(ms / 1000, nguong)) {
          khoa({ ...cur, integrity: { ...cur.integrity, events } }, 'roi_qua_lau', ms)
          return
        }
        const next: ExamAttempt = { ...cur, integrity: { ...cur.integrity, totalHiddenMs: cur.integrity.totalHiddenMs + ms, events } }
        attemptRef.current = next
        setAttempt(next)
        saveAttempt(next)
        pushStatusNow(next, true)
      }
    }
    const onVis = () => logEvent(document.hidden ? 'hidden' : 'visible')
    const onBlur = () => logEvent('blur')
    const onFocus = () => logEvent('focus')
    // Thoát toàn màn hình (Back trên Android, vuốt xuống…) khi KHÔNG ở chế độ
    // standalone → tính là rời màn hình (quay lại toàn màn hình = quay lại).
    const onFs = () => logEvent(dangToanManHinh() ? 'focus' : 'hidden')
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('blur', onBlur)
    window.addEventListener('focus', onFocus)
    document.addEventListener('fullscreenchange', onFs)
    document.addEventListener('webkitfullscreenchange', onFs)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('fullscreenchange', onFs)
      document.removeEventListener('webkitfullscreenchange', onFs)
      if (roiLauTimerRef.current) clearTimeout(roiLauTimerRef.current)
      if (canhBaoTimerRef.current) clearTimeout(canhBaoTimerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // ==========================================================================
  // TÍN HIỆU MỚI — BAOMATCATHI.md mục 3. MỘT LẦN LÀ KHOÁ.
  // ==========================================================================
  // Effect RIÊNG, không đụng một dòng nào của luật đếm rời app phía trên.
  //
  // Bốn tín hiệu: thoát toàn màn hình · thu nhỏ hoặc chia đôi màn · cửa sổ nổi
  // đè lên · dấu vết chụp màn hình. Ba tấm đệm chống oan vẫn còn nguyên: ân hạn
  // 3 giây đầu, nhịp chờ 900 ms trước khi kết luận cửa sổ nổi, và màn khoá bảo
  // em giơ tay gọi thầy (thầy mở khoá một chạm ở Chi tiết ca).
  useEffect(() => {
    if (phase !== 'exam') return
    // Mức ngặt của ca. Ca mở trước bản này chưa có cột MucNgat trên máy chủ ⇒
    // rơi về Bình thường, đúng hành vi cũ, không đổi điểm ca đã gửi phụ huynh.
    const muc = MUC_NGAT_MAC_DINH
    const vaoLuc = performance.now()
    const phieu: PhieuKenh[] = []
    let coMan: TrangThaiCoMan = { moc: window.innerWidth * window.innerHeight, nhoTu: null }
    let raTu: number | null = null
    let soLanNoi = 0
    let daKhoa = false
    let henNoi: number | undefined

    const conAnHan = () => performance.now() - vaoLuc < MS_AN_HAN_VAO_BAI

    /** Che đề NGAY, không đợi phân loại. Việc che ở nhịp 0; ba nhịp sau chỉ
     * hoãn việc PHÂN LOẠI. */
    const che = (ly: string) => setLyDoChe(ly)
    const boChe = () => setLyDoChe(null)

    const khoaVi = (lyDo: LyDoKhoaMoi, kenhBao?: string) => {
      if (daKhoa) return
      const cur = attemptRef.current
      if (!cur || cur.submitted) return
      daKhoa = true
      che(LOI_KHOA[lyDo])
      const events = [...cur.integrity.events, { type: 'khoa' as const, at: new Date().toISOString() }].slice(-200)
      const next: ExamAttempt = { ...cur, integrity: { ...cur.integrity, events, blocked: true, lyDoKhoa: lyDo, kenhBao } }
      attemptRef.current = next
      setAttempt(next)
      saveAttempt(next)
      pushStatusNow(next, false)
      baoThayGianLan(next)
      void doSubmit(next)
    }

    /** Một phiếu vừa tới. Hai đường dẫn tới khoá:
     *
     *   1. ĐỦ HAI HỌ trùng trong 300 ms — hai kênh cùng đo một hiện tượng chỉ
     *      tính một phiếu, xem đầu `man-thi-sach.ts`.
     *   2. MỘT phiếu họ luồng-chính mà KHÔNG AI CHẠM MÀN — số đo trên máy thầy
     *      05/09 cho thấy chụp màn hình chỉ làm kênh 6 báo, nên nếu chỉ chờ đủ
     *      hai họ thì không bao giờ khoá. Điều kiện "không chạm" là thứ tách
     *      được chụp màn hình khỏi cuộn và gõ.
     *
     * Đường 2 đợi thêm 250 ms rồi mới chốt: ngón tay có thể chạm màn NGAY SAU
     * nhát nghẽn (em vừa cuộn xong), và lúc phiếu tới thì chưa biết điều đó. */
    const xetPhieu = (p: PhieuKenh, coChamMan: boolean) => {
      phieu.push(p)
      while (phieu.length && phieu[0].luc < p.luc - MS_TRUNG_KHOP * 2) phieu.shift()
      if (conAnHan()) return

      const nhom = nhomDuKhoa(phieu)
      const cuoi = nhom[nhom.length - 1]
      if (cuoi && coKhoa(muc, 'dau_vet_chup')) return khoaVi('dau_vet_chup', chuNhomPhieu(cuoi))

      const hoLuongChinh = p.kenh === 'nhip_ve' || p.kenh === 'lech_dong_ho'
      if (!hoLuongChinh || coChamMan) return
      if (p.luc - mocKhoaMotMinh < MS_KHONG_CHAM_QUANH_PHIEU * 5) return // không chốt dồn dập
      window.setTimeout(() => {
        if (daKhoa) return
        const chamSau = performance.now() - mocChamManCuoi < MS_KHONG_CHAM_QUANH_PHIEU
        const du = duKhoaMotMinh({
          hoLuongChinh: true,
          coChamMan: chamSau,
          dangLamBaiBinhThuong: document.hasFocus() && document.visibilityState === 'visible',
        })
        if (!du || !coKhoa(muc, 'dau_vet_chup')) return
        mocKhoaMotMinh = performance.now()
        khoaVi('dau_vet_chup', `${p.kenh === 'lech_dong_ho' ? 'kênh 6' : 'kênh 5'}, không chạm màn`)
      }, 250)
    }

    /** Mốc chạm màn gần nhất — dùng để biết ngón tay có chạm NGAY SAU nhát
     * nghẽn hay không, và để đếm giờ bất động. */
    let mocChamManCuoi = performance.now()
    let mocKhoaMotMinh = -1e9

    let dangCheBatDong = false

    // ---- CÁCH 1: ĐẾM SỐ NGÓN CHẠM.
    // Chụp màn hình bằng cử chỉ trên Android là vuốt BA NGÓN, và trang nhận đủ
    // ba điểm chạm. Em làm bài chạm một ngón để chọn đáp án, hai ngón để phóng
    // ảnh — không bao giờ ba. Tín hiệu trực tiếp, không ngưỡng nào phải đo.
    const demNgon = (e: Event) => {
      ghiChamMan()
      const t = (e as TouchEvent).touches
      if (!t || t.length < SO_NGON_CHUP) return
      if (daKhoa || conAnHan()) return
      if (coKhoa(muc, 'dau_vet_chup')) khoaVi('dau_vet_chup', `${t.length} ngón chạm cùng lúc`)
    }
    const ghiChamMan = () => {
      mocChamManCuoi = performance.now()
      // Bỏ che NGAY khi có chạm, không đợi nhịp một giây: em chạm mà đề còn ẩn
      // thêm một nhịp nữa thì bực.
      if (dangCheBatDong) {
        dangCheBatDong = false
        boChe()
      }
    }
    document.addEventListener('touchstart', demNgon, { passive: true })
    document.addEventListener('touchmove', demNgon, { passive: true })
    document.addEventListener('pointerdown', ghiChamMan, { passive: true })
    document.addEventListener('scroll', ghiChamMan, { passive: true, capture: true })
    document.addEventListener('keydown', ghiChamMan)

    // ---- CÁCH 2: CHE ĐỀ KHI BẤT ĐỘNG.
    // Không nhìn thấy cửa sổ nổi, nhưng nhìn thấy hậu quả của nó: suốt lúc em
    // thao tác với Gemini thì trang không nhận cú chạm nào. Không khoá, không
    // đếm — chỉ làm cái cửa sổ nổi kia thành vô dụng.
    const nhipBatDong = window.setInterval(() => {
      if (daKhoa) return
      const im = performance.now() - mocChamManCuoi
      if (im >= MS_BAT_DONG_CHE && !dangCheBatDong) {
        dangCheBatDong = true
        che(LOI_CHE_BAT_DONG)
      } else if (im < MS_BAT_DONG_CHE && dangCheBatDong) {
        dangCheBatDong = false
        boChe()
      }
    }, 1000)

    // NHỊP SOI TIÊU ĐIỂM — đây là chỗ bắt CỬA SỔ NỔI, kiểu gian lận thầy quay
    // video ngày 05/09: em mở cửa sổ nổi Gemini đè lên bài rồi đưa ảnh chụp vào
    // hỏi. Lúc đó Chrome mất tiêu điểm nhưng trang VẪN HIỆN — không sự kiện
    // `blur` nào chắc chắn bắn, nên phải tự soi thay vì ngồi đợi.
    //
    // Soi 250 ms một lần: che đề gần như tức thì, và khoá trong khoảng một giây
    // kể từ lúc cửa sổ nổi mở.
    let mocMatTieuDiem: number | null = null
    const nhipTieuDiem = window.setInterval(() => {
      if (daKhoa) return
      const noi = laCuaSoNoi({ coTieuDiem: document.hasFocus(), manConHien: document.visibilityState === 'visible' })
      if (!noi) {
        mocMatTieuDiem = null
        return
      }
      const nay = performance.now()
      if (mocMatTieuDiem === null) {
        mocMatTieuDiem = nay
        che('Bài thi tạm ẩn khi có cửa sổ khác đè lên. Quay lại để làm tiếp.')
        return
      }
      if (nay - mocMatTieuDiem < MS_XAC_NHAN_CUA_SO_NOI) return
      soLanNoi += 1
      mocMatTieuDiem = null
      if (!conAnHan() && coKhoa(muc, 'cua_so_noi', soLanNoi)) khoaVi('cua_so_noi', 'nhịp soi tiêu điểm')
    }, MS_NHIP_SOI_TIEU_DIEM)

    const go = thuTinHieu({
      onPhieu: (p, bc) => {
        if (daKhoa) return

        // --- KÊNH 3: thoát toàn màn hình. Số đo trực tiếp, khoá một mình.
        if (p.kenh === 'toan_man') {
          if (document.fullscreenElement) return boChe()
          che(LOI_KHOA.thoat_toan_man)
          if (!conAnHan() && coKhoa(muc, 'thoat_toan_man')) khoaVi('thoat_toan_man', 'kênh 3')
          return
        }

        // --- KÊNH 4: thu nhỏ / chia đôi màn. Bỏ qua tuyệt đối khi đang gõ ô
        // nhập — bàn phím ảo lúc làm Phần III không bao giờ được gây khoá.
        if (p.kenh === 'kich_thuoc') {
          const dangGoO = document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement
          const kq = xetCoMan(coMan, { rong: bc.rong, cao: bc.cao, dangGoO, bayGio: p.luc, tiLe: TI_LE_CO_MAN_CHOT, msXacNhan: MS_XAC_NHAN_CO_MAN })
          coMan = kq.tt
          if (kq.khoa && !conAnHan() && coKhoa(muc, 'thu_nho_man')) khoaVi('thu_nho_man', 'kênh 4')
          return
        }

        // --- KÊNH 7: phím chụp trên máy tính. Một mình đủ để khoá.
        if (p.kenh === 'phim_chup') {
          if (!conAnHan() && coKhoa(muc, 'dau_vet_chup')) khoaVi('dau_vet_chup', 'kênh 7')
          return
        }

        // --- KÊNH 1 và 2: ra khỏi màn. Che ngay, phân loại sau (mục 4.1).
        if (p.kenh === 'an_trang' || p.kenh === 'tieu_diem') {
          const veLai = (p.kenh === 'an_trang' && bc.hienTrang) || (p.kenh === 'tieu_diem' && bc.coTieuDiem)
          if (veLai) {
            if (raTu !== null && p.luc - raTu < MS_VE_SOM) xetPhieu(p, bc.dangChamMan) // ra rồi về ngay = một dấu vết chụp
            raTu = null
            if (henNoi) window.clearTimeout(henNoi)
            boChe()
            return
          }
          che('Bài thi tạm ẩn khi màn hình bị che. Quay lại để làm tiếp.')
          if (raTu === null) {
            raTu = p.luc
            // Nhịp 900 ms: chờ `hidden` báo trễ của iOS. Bỏ nhịp này là mọi
            // cuộc gọi đến thành cửa sổ nổi → khoá ngay.
            if (henNoi) window.clearTimeout(henNoi)
            henNoi = window.setTimeout(() => {
              if (daKhoa || raTu === null) return
              // Xét TRẠNG THÁI TẠI ĐÂY, không tin cái nhớ "đã từng thấy hidden":
              // Android bắn hidden một nhịp rồi visible lại, mà trang thì vẫn
              // nhìn thấy được — xem `laCuaSoNoi` trong man-thi-sach.ts.
              const noi = laCuaSoNoi({ coTieuDiem: document.hasFocus(), manConHien: document.visibilityState === 'visible' })
              if (!noi) return // trang đã khuất hẳn ⇒ rời app ⇒ luật đếm cũ lo
              soLanNoi += 1
              if (!conAnHan() && coKhoa(muc, 'cua_so_noi', soLanNoi)) khoaVi('cua_so_noi', 'kênh 2')
            }, MS_XAC_NHAN_CUA_SO_NOI)
          }
          return
        }

        // --- KÊNH 5, 6, 8: dấu vết chụp, chỉ góp phiếu. Ngưỡng lọc ở đây, vì
        // bộ thu dùng ngưỡng QUAN SÁT rộng hơn để trang /do nhìn thấy nhát yếu.
        if (p.kenh === 'nhip_ve') {
          const gap = Number(/(\d+)/.exec(p.chiTiet)?.[1] ?? 0)
          if (gap >= MS_RAF_NGHI_CHOT) xetPhieu(p, bc.dangChamMan)
          return
        }
        if (p.kenh === 'lech_dong_ho') {
          const lech = Math.abs(Number(/(-?\d+)/.exec(p.chiTiet)?.[1] ?? 0))
          if (lech >= MS_LECH_DONG_HO_CHOT) xetPhieu(p, bc.dangChamMan)
          return
        }
        if (p.kenh === 'xung_chuyen_dong') {
          const xoan = Number(/([\d.]+)/.exec(p.chiTiet)?.[1] ?? 0)
          if (xoan >= NGUONG_XUNG_CHOT.xoan) xetPhieu(p, bc.dangChamMan)
        }
      },
    })

    return () => {
      go()
      document.removeEventListener('touchstart', demNgon)
      document.removeEventListener('touchmove', demNgon)
      document.removeEventListener('pointerdown', ghiChamMan)
      document.removeEventListener('scroll', ghiChamMan, true)
      document.removeEventListener('keydown', ghiChamMan)
      window.clearInterval(nhipBatDong)
      window.clearInterval(nhipTieuDiem)
      if (henNoi) window.clearTimeout(henNoi)
      setLyDoChe(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // LÁ CHẮN CSS — lớp che thứ hai, tự chạy không cần JavaScript. Chỉ bật khi
  // ĐÃ THẬT SỰ vào toàn màn hình: máy chạy PWA đứng riêng (standalone) không
  // khớp `:fullscreen`, bật ở đó là ẩn đề vĩnh viễn của một em không làm gì.
  useEffect(() => {
    if (phase !== 'exam') return
    const dong = () => {
      if (document.fullscreenElement) document.documentElement.setAttribute('data-la-chan', '1')
      else document.documentElement.removeAttribute('data-la-chan')
    }
    dong()
    document.addEventListener('fullscreenchange', dong)
    return () => {
      document.removeEventListener('fullscreenchange', dong)
      document.documentElement.removeAttribute('data-la-chan')
    }
  }, [phase])

  // CHẶN SAO CHÉP ĐỀ (mục 6D). Không chặn được ảnh chụp, nhưng chặn được đường
  // chép chữ — đường rẻ nhất để tuồn nguyên đề ra ngoài.
  useEffect(() => {
    if (phase !== 'exam') return
    const chan = (e: Event) => e.preventDefault()
    for (const t of ['contextmenu', 'copy', 'cut', 'dragstart']) document.addEventListener(t, chan)
    return () => {
      for (const t of ['contextmenu', 'copy', 'cut', 'dragstart']) document.removeEventListener(t, chan)
    }
  }, [phase])

  // BÁO THẦY khi bài bị khoá — KHÔNG gửi thẳng phụ huynh (BA-APP.md mục 4D):
  // sự kiện có thể là một cuộc gọi đến, tin nhắn "cháu nhà anh chị gian lận"
  // gửi tự động thì không rút lại được. Tin này vào hộp thư của THẦY; thầy đọc,
  // xác minh, rồi mới bấm "Báo phụ huynh". Trạng thái Blocked vẫn đẩy lên như cũ.
  const baoThayGianLan = (a: ExamAttempt) => {
    const url = scriptUrlRef.current.trim()
    if (!url) return
    const luc = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    const lyDo = laLyDoMoi(a.integrity.lyDoKhoa)
      ? `${TEN_LY_DO_KHOA[a.integrity.lyDoKhoa as LyDoKhoaMoi]}${a.integrity.kenhBao ? ` (${a.integrity.kenhBao})` : ''}`
      : a.integrity.lyDoKhoa === 'roi_qua_lau'
      ? `rời khỏi màn hình làm bài quá ${chuanHoaNguong(a.nguong).giay} giây`
      : `rời khỏi màn hình làm bài ${soLanTinhTu(a.integrity.leaveCount, a.integrity.mocMoKhoa ?? 0)} lần (đã được cảnh báo trước đó)`
    sendStudentMessage(
      url,
      a.sbd,
      `[HỆ THỐNG] SBD ${a.sbd}`,
      '',
      `[TỰ ĐỘNG] Lúc ${luc}, trong ca kiểm tra ${a.maCa}, học sinh SBD ${a.sbd} đã ${lyDo}. Bài đã được nộp phần đã làm và khoá. Thầy mở khoá hoặc báo phụ huynh ở màn Chi tiết ca.`,
    ).catch(() => {
      // mất mạng — trạng thái Blocked vẫn được gửi lại khi nộp bài (pendingSubmit)
    })
  }

  const doSubmit = async (a: ExamAttempt) => {
    const updated: ExamAttempt = { ...a, giayCau: { ...(a.giayCau ?? {}), ...giayCauRef.current }, submitted: true, submittedAt: new Date().toISOString(), pendingSubmit: true }
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
        // Ghi điểm + chi tiết từng câu (chuyên đề, mức độ, giây làm) lên máy chủ
        // — quyền bằng id thiết bị của chính lượt này, không cần mã bí mật.
        ghiDiem(scriptUrlRef.current.trim(), '', done.maCa, [
          taoBaiGhiDiem(kb, done.maCa, done.sbd, done.lanThu ?? 1, done.answers, g, done.giayCau, done.idThietBi ?? layIdThietBi()),
        ]).catch(() => {
          // máy thầy chấm lại sẽ ghi đè — không chặn luồng
        })
        sendParentFeedback(
          scriptUrlRef.current.trim(),
          done.sbd,
          done.maCa,
          done.maDe,
          done.submittedAt || new Date().toISOString(),
          g.score.total,
          classify(g.score.total),
          { phanI: g.wrongPhanI, phanII: g.wrongPhanII, phanIII: g.wrongPhanIII },
          { I: g.score.phanIScore, II: g.score.phanIIScore, III: g.score.phanIIIScore },
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
      const { keyBank, congBo: cb } = await submitAnswers(scriptUrl.trim(), a.maCa, a.sbd, a.maDe, a.answers, a.integrity, a.lanThu ?? 1, a.idThietBi ?? layIdThietBi(), a.giayCau)
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
    if (attempt.loai === 'baitap') return // bài tập không tự nộp theo giờ
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
      const next = { ...mutate(cur), giayCau: { ...giayCauRef.current } }
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
              {/* HỌ TÊN + NĂM SINH: máy chủ đối chiếu với danh sách của thầy.
                  Gõ nhầm một chữ số báo danh sẽ bị chặn ngay ở đây thay vì tạo
                  ra một em lạ trong bảng điểm. Máy nhớ sẵn từ lần trước. */}
              <div>
                <div style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)', marginBottom: 'var(--k2)' }}>Họ và tên</div>
                <input
                  className="tap-target w-full"
                  style={O_DANH_TINH}
                  placeholder="Họ và tên"
                  autoComplete="name"
                  value={hoTen}
                  onChange={(e) => setHoTen(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleJoin()
                  }}
                />
              </div>
              <div>
                <div style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)', marginBottom: 'var(--k2)' }}>Năm sinh</div>
                <input
                  className="tap-target w-full"
                  style={{ ...O_DANH_TINH, fontVariantNumeric: 'tabular-nums' }}
                  placeholder="2009"
                  inputMode="numeric"
                  maxLength={4}
                  value={namSinh}
                  onChange={(e) => setNamSinh(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleJoin()
                  }}
                />
              </div>
              {!toanManHinh && (
                <div className="flex flex-col" style={{ gap: 'var(--k2)' }}>
                  <OThongBao tone="cam">
                    Chỉ vào thi được khi app ở <b>toàn màn hình</b>.
                    {coTheBatToanManHinh() ? ' Bấm nút dưới để bật.' : ' Thêm app vào màn hình chính (hướng dẫn ở trên) rồi mở lại từ đó.'}
                  </OThongBao>
                  {coTheBatToanManHinh() && (
                    <NutChinh variant="phu" onClick={batToanManHinh}>
                      Bật toàn màn hình
                    </NutChinh>
                  )}
                </div>
              )}
              {/* Nhắc trước khi vào (BA-APP đợt 5): rời màn hình là bị khoá bài,
                  mà cuộc gọi/thông báo cũng tính là rời — bật Không làm phiền
                  là cách duy nhất em tự phòng được. */}
              <div style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)', lineHeight: 1.6 }}>
                Bật <b>Không làm phiền</b> trước khi bắt đầu. Cuộc gọi hay thông báo kéo em ra khỏi màn làm bài đều bị tính là rời màn.
              </div>
              <NutChinh onClick={handleJoin} disabled={!toanManHinh}>
                Vào thi
              </NutChinh>
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
  if (phase === 'submitted' && xemBaoCao && phieuCuaEm) {
    return (
      <div style={{ minHeight: '100vh', position: 'relative' }}>
        <button
          type="button"
          onClick={() => setXemBaoCao(false)}
          className="tap-target font-bold"
          style={{
            position: 'fixed',
            left: 12,
            top: 12,
            zIndex: 20,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            height: 40,
            padding: '0 14px',
            borderRadius: 999,
            background: 'var(--muc)',
            color: 'var(--muc-nguoc)',
            fontFamily: 'var(--sans)',
            fontSize: 'var(--cx-1)',
            boxShadow: 'var(--bong-2)',
          }}
        >
          <ArrowLeft size={16} /> Quay lại
        </button>
        <PhieuScreen duCoSan={phieuCuaEm} />
      </div>
    )
  }

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
                loiGiai={q.loiGiai}
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
                loiGiai={q.loiGiai}
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
                loiGiai={q.loiGiai}
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
                  BÀI THI ĐÃ KHOÁ
                </div>
                <div style={{ fontSize: 'var(--cx-2)', lineHeight: 1.7 }}>
                  {/* Nêu ĐÚNG lý do. Bốn lý do mới của BAOMATCATHI nói bằng câu
                      dữ kiện trần — máy đo được dấu vết, không đo được ý định,
                      nên không có chữ nào kết luận em gian lận. */}
                  {laLyDoMoi(attempt.integrity.lyDoKhoa) ? (
                    <>{LOI_KHOA[attempt.integrity.lyDoKhoa as LyDoKhoaMoi]}</>
                  ) : attempt.integrity.lyDoKhoa === 'roi_qua_lau' ? (
                    <>
                      Em đã <b>rời khỏi màn hình làm bài quá {chuanHoaNguong(attempt.nguong).giay} giây</b>.
                    </>
                  ) : (
                    <>
                      Em đã <b>rời khỏi màn hình làm bài {soLanTinhTu(attempt.integrity.leaveCount, attempt.integrity.mocMoKhoa ?? 0)} lần</b> dù đã được cảnh báo.
                    </>
                  )}{' '}
                  Phần đã làm được <b>nộp và khoá</b>. Hệ thống đã báo cho thầy. <b>Em giơ tay gọi Thầy</b> — thầy mở khoá thì mở lại link này trên đúng máy này để làm tiếp.
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
              <div className="flex items-center" style={{ gap: 'var(--k2)' }}>
                <div className="font-bold" style={{ fontSize: 'var(--cx-4)' }}>
                  Đã nộp bài
                </div>
                {(attempt?.lanThu ?? 1) > 1 && <Nhan tone="tim">lần {attempt?.lanThu}</Nhan>}
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
          {phieuCuaEm && (
            <NutChinh variant="phu" onClick={() => setXemBaoCao(true)}>
              Xem báo cáo học tập
            </NutChinh>
          )}
          {/* ĐỀ RIÊNG CỦA EM. Mỗi em một bộ câu khác nhau nên tải chung đề của
              ca là sai — phải dựng từ ĐÚNG bộ máy đã gán cho em này. */}
          {solutionAssignment && attempt && (
            <NutChinh variant="phu" onClick={() => void taiDeCuaEm()} disabled={dangTaiDe}>
              {dangTaiDe ? 'Đang dựng đề…' : 'Xem đề & lời giải'}
            </NutChinh>
          )}
          {keyBank && solutionAssignment && (
            <NutChinh variant="phu" onClick={() => setXemLoiGiai(true)}>
              Xem lại lời giải
            </NutChinh>
          )}
        </div>

        {htmlDe && <KhungXemPhieu html={htmlDe} ten="Đề của em kèm lời giải" dong={() => setHtmlDe('')} />}

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
  // BÀI TẬP VỀ NHÀ: thay đồng hồ đếm ngược bằng hạn nộp (BA-APP.md mục 6).
  const laBaiTap = attempt?.loai === 'baitap'
  const hanNopNgan = (() => {
    if (!attempt?.hanNop) return ''
    const d = new Date(attempt.hanNop)
    return Number.isFinite(d.getTime()) ? d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) : ''
  })()
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
          {laBaiTap ? (
            <div className="font-bold" style={{ ...SANS_SO, fontSize: 'var(--cx-2)', color: 'var(--muc)' }} title="Bài tập về nhà — không tính giờ">
              {hanNopNgan ? `Hạn ${hanNopNgan}` : 'Bài tập'}
            </div>
          ) : (
            <div className="font-bold" style={{ ...SANS_SO, fontSize: 'var(--cx-4)', color: gapNow ? 'var(--gap)' : 'var(--muc)', transitionProperty: 'color', transitionDuration: 'var(--nhanh)' }}>
              {formatClock(remaining ?? 0)}
            </div>
          )}
          <button onClick={() => setShowGrid(true)} className="tap-target flex items-center justify-center" style={{ color: 'var(--muc)' }} title="Danh sách câu" aria-label="Danh sách câu">
            <LayoutGrid size={22} />
          </button>
        </div>
      </div>


      {/* DẢI CẢNH BÁO RỜI MÀN (mục 6) — dính dưới thanh trên, tự ẩn sau 15 giây */}
      {canhBaoRoi && (
        <div className="sticky z-30 px-3 sm:px-4" style={{ top: 56, paddingTop: 'var(--k2)', background: 'var(--nen)' }} role="alert" data-canh-bao={canhBaoRoi.muc}>
          <OThongBao tone={canhBaoRoi.muc === 'dam' ? 'do' : 'cam'}>
            <b>{canhBaoRoi.loi}</b>
          </OThongBao>
        </div>
      )}

      {/* HAI CỘT TRÊN MÀN RỘNG. Cột trái KHÔNG phải menu của thầy: em đang thi
          mà bên cạnh có "Ngân hàng câu hỏi" thì một chạm là ra hết đáp án. Cột
          trái là LƯỚI SỐ CÂU — thứ em thật sự cần: nhìn ra ngay còn câu nào
          chưa làm, bấm là nhảy tới. Màn hẹp thì lưới này ẩn, vẫn mở bằng nút
          ô vuông trên thanh trên như cũ. */}
      {/* VÂN TAY — ảnh chụp luôn chứa đủ bốn góc, nên in danh tính em lên chính
          khung hình. Ảnh trôi ra ngoài thì truy được ngay em nào. */}
      <VanTay sbd={attempt.sbd} hoTen={hoTen.trim() || `SBD ${attempt.sbd}`} maCa={attempt.maCa} />

      <div className="thi-hai-cot thi-noi-dung">
        <aside className="thi-luoi" aria-label="Danh sách câu">
          <div className="thi-luoi-dinh">
            <div className="font-bold" style={{ fontSize: 'var(--cx-2)', marginBottom: 'var(--k3)' }}>
              Đã làm{' '}
              <span style={SANS_SO}>
                {daLamCount}/{total}
              </span>
            </div>
            <div className="grid grid-cols-5" style={{ gap: 'var(--k2)' }}>
              {flat.map((f, i) => {
                const done = daTraLoiEntry(attempt, assignment, f)
                return (
                  <button
                    key={i}
                    onClick={() => cuonToiCau(i + 1)}
                    className="tap-target aspect-square flex items-center justify-center font-bold"
                    style={{ ...SANS_SO, fontSize: 'var(--cx-1)', borderRadius: 'var(--bo-1)', background: done ? 'var(--muc)' : 'var(--the-2)', color: done ? 'var(--muc-nguoc)' : 'var(--muc)' }}
                    title={`Câu ${i + 1}${done ? ' — đã làm' : ' — chưa làm'}`}
                  >
                    {i + 1}
                  </button>
                )
              })}
            </div>
            <div style={{ marginTop: 'var(--k4)' }}>
              <NutChinh onClick={() => setShowConfirm(true)}>Nộp bài</NutChinh>
            </div>
          </div>
        </aside>

        {/* DANH SÁCH CÂU — cuộn dọc liên tục, đầu phần dính */}
        <div className="px-3 sm:px-4 flex flex-col" style={{ gap: 'var(--k5)', paddingTop: 'var(--k2)', paddingBottom: 'calc(var(--k8) + env(safe-area-inset-bottom))' }}>
          {renderPhan('I')}
          {renderPhan('II')}
          {renderPhan('III')}
          <div style={{ paddingTop: 'var(--k3)' }}>
            <NutChinh onClick={() => setShowConfirm(true)}>Nộp bài</NutChinh>
          </div>
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

      {/* TẤM CHE — lớp React, dựng ngay trong hàm xử lý sự kiện, trước khung
          hình kế tiếp. Không chứa nội dung câu hỏi nào. */}
      {lyDoChe && <ManChan lyDo={lyDoChe} onQuayLai={() => setLyDoChe(null)} />}
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

/** Bốn lý do khoá của BAOMATCATHI — tách khỏi hai lý do rời app cũ. */
function laLyDoMoi(v: string | undefined): boolean {
  return v === 'cua_so_noi' || v === 'thu_nho_man' || v === 'thoat_toan_man' || v === 'dau_vet_chup'
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
