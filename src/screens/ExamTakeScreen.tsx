import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { choBaoLau, gianNopTuDong, gianVaoSauBatDau, gianVaoThi, laLoiDongNguoi } from '../lib/nhip-gui-lai'
import type { PublicExamBank, TeacherExamSource, TeacherMcqQuestion, TeacherShortAnswerQuestion, TeacherTrueFalseQuestion } from '../data/examContent'
import { assignStudentQuestions, type StudentAssignment } from '../lib/exam-assign'
import { boCauTuBaiLam } from '../lib/bo-cau-tu-bai-lam'
import { taoLinkPhieu } from '../lib/phieu-link'
import { cauKhacPhuc, ghiPhieuKhacPhuc, lichSuEm as lichSuEmApi, tenTheoSbd, trangThaiPhongCho, vaoThi, phieuCuaEm as layBaiDaNop, thongDiepChan, submitAnswers, pushExamStatus, sendParentFeedback, fetchKetQua, sendStudentMessage, ghiDiem, luuTam, guiCauHoi, CHU_KY_LUU_TAM_GIAY, NHIP_BAO_SONG_GIAY, chuKyLechPha, chuKyLechPhaMs, type KeyBank, type CongBoDiem, type KetQuaVaoThi } from '../lib/exam-api'
import { CongNhip, NHIP_TIM_LUU_TAM_GIAY } from '../lib/nhip-gui'
import { goiCauHoi } from '../lib/hoi-bai'
import TamTruotHoiBai, { type CauChon } from '../components/TamTruotHoiBai'
import { taoBaiGhiDiem, taoChiTietCau } from '../lib/chi-tiet-cau'
import { chuyenDeXinKho, dungCauSai, dungPhieuMayEm, SO_CAU_BAI_TAP_KEM, type DiemMotCa, type PhieuDayDu } from '../lib/phieu-du-lieu'
import { buildTeacherSourceFromKhoDe, parseKhoDeJson } from '../lib/exam-kho-de-import'
import PhieuScreen from './PhieuScreen'
import { gioMayChu, gioNgan } from '../lib/gio-may-chu'
import { layIdThietBi } from '../lib/thiet-bi'
import { MS_XAC_NHAN_AN, MS_XAC_NHAN_BLUR, chuanHoaNguong, khoaViRoiLau, laMayCamUng, loiCanhBao, mucKhiRoiMan, soLanTinhTu, tinhLaRoiMan, type NguongGianLan } from '../lib/chong-gian-lan'
import { MS_AN_HAN_VAO_BAI, MS_TRUNG_KHOP, MS_VE_SOM, MS_XAC_NHAN_CO_MAN, MS_XAC_NHAN_CUA_SO_NOI, type PhieuKenh } from '../lib/do-dau-vet'
import {
  LOI_KHOA,
  MUC_NGAT_MAC_DINH,
  NGUONG_XUNG_CHOT,
  MS_RAF_NGHI_CHOT,
  TI_LE_CO_MAN_CHOT,
  coKhoa,
  khoaDuocViCuaSoNoi,
  khoaDuocViThuNhoMan,
  laCuaSoNoi,
  SO_NGON_CHUP,
  MS_NHIP_SOI_TIEU_DIEM,
  xetCoMan,
  type LyDoKhoaMoi,
  type TrangThaiCoMan,
} from '../lib/man-thi-sach'
import {
  MS_NHIP_SOI_GIU,
  anHanMsCua,
  batCuaCa,
  chamDiChuyen,
  chamLen,
  chamXuong,
  chuDanTruoc,
  coCamUng,
  coCamUngThat,
  coMat,
  dangGoOnhap,
  ghiHoatDong,
  moTrangThaiGiu,
} from '../lib/giu-de-doc'
import { thuTinHieu } from '../lib/thu-tin-hieu'
import { TEN_LY_DO_KHOA } from '../lib/man-thi-sach'
import ManChan from '../components/ManChan'
import ManGiuDeDoc from '../components/ManGiuDeDoc'
import VanTay from '../components/VanTay'
import TheCau from '../components/TheCau'
import MaCaInput from '../components/MaCaInput'
import LogoDDH from '../components/LogoDDH'
import { TheNoiDung, NutChinh, OThongBao, Nhan } from '../components/DesignSystem'
import { TriangleAlert, X, ArrowLeft, LayoutGrid } from 'lucide-react'
import { classify, moTaBieuDiem, type SoCauBaPhan } from '../engine/score'
import { docDuongVao } from '../lib/vai-tro'
import { gradeFromKeyBank, type GradedSubmission } from '../lib/exam-grade'
import {
  cacheSession,
  docLichSuDiem,
  emptyAnswerRecord,
  emptyIntegrityLog,
  hetGioCua,
  loadAttempt,
  listPendingAttempts,
  loadCachedSession,
  loadScriptUrlHoacMacDinh,
  luuDiemCuaEm,
  saveAttempt,
  saveScriptUrl,
  type ExamAttempt,
} from '../lib/exam-db'
import { useAppStore } from '../store/appStore'
import { datDangLamBai } from '../lib/cap-nhat-app'
import { napDong } from '../lib/nap-manh'
import KhungXemPhieu from '../components/KhungXemPhieu'
import NutNopBtvn from '../components/NutNopBtvn'

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

/** Đang mở trong TRÌNH DUYỆT CỦA MỘT ỨNG DỤNG KHÁC (Zalo, Messenger, Facebook)?
 *
 * VÌ SAO CẦN BIẾT (thầy báo 17:34 ngày 09/09, kèm ảnh: iPhone kẹt ở màn vào thi,
 * góc trái ghi "◄ Zalo"). Em nhận link qua Zalo rồi bấm thẳng vào đó, nên trang
 * chạy trong trình duyệt NHÚNG của Zalo. Ở đó:
 *   · không phải standalone ⇒ `dangToanManHinh()` sai;
 *   · iOS không cho `requestFullscreen` trên phần tử ⇒ không có nút để bật;
 *   · và Zalo KHÔNG có mục "Thêm vào Màn hình chính" ⇒ làm đúng theo dòng chữ
 *     app đang hiện cũng không ra.
 * Ba cái cộng lại là em không có đường nào vào thi. Dòng nhắc cũ chỉ vào một
 * việc KHÔNG LÀM ĐƯỢC ở đó — nên phải nói đúng việc: mở bằng Safari trước.
 *
 * Nhận dạng theo user agent là phỏng đoán, không chắc chắn. Nên nó chỉ đổi CHỮ
 * hướng dẫn, không đổi quyền vào thi của ai. */
function laTrinhDuyetTrongUngDung(nav: Navigator = navigator): boolean {
  const ua = String(nav.userAgent || '')
  return /\b(Zalo|FBAN|FBAV|FB_IAB|Instagram|Line\/|MicroMessenger|TikTok)\b/i.test(ua)
}

/** iPhone/iPad — nơi Apple không cho trang tự vào toàn màn hình. */
function laIOS(nav: Navigator = navigator): boolean {
  const ua = String(nav.userAgent || '')
  if (/iPhone|iPad|iPod/i.test(ua)) return true
  // iPadOS 13+ khai là Macintosh; phân biệt bằng màn hình cảm ứng.
  return /Macintosh/i.test(ua) && (nav.maxTouchPoints ?? 0) > 1
}

/** Chữ hướng dẫn ĐÚNG VIỆC LÀM ĐƯỢC ở đúng chỗ em đang đứng. */
export function loiKhuyenToanManHinh(coBatDuoc: boolean, trongUngDung: boolean, ios: boolean): string {
  if (coBatDuoc) return 'Bấm nút dưới để bật toàn màn hình, bài làm đỡ bị che.'
  if (trongUngDung) return 'Em đang mở trong ứng dụng khác. Bấm ⋯ rồi chọn "Mở trong Safari", sau đó bấm Chia sẻ → "Thêm vào Màn hình chính" và mở app từ biểu tượng đó.'
  if (ios) return 'Bấm nút Chia sẻ ở thanh dưới rồi chọn "Thêm vào Màn hình chính", sau đó mở app từ biểu tượng vừa hiện.'
  return 'Thêm app vào màn hình chính (hướng dẫn ở trên) rồi mở lại từ đó.'
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

// TÊN phần là cố định; BIỂU ĐIỂM thì không — nó phụ thuộc số câu của chính ca
// này. Bản cũ in cứng "Mỗi câu đúng 0,25 điểm" nên ca 8/2/2 (thầy báo 07/09)
// nói dối em ngay trên màn làm bài: em đọc 0,25 mà máy chấm 0,5625.
const TEN_PHAN: Record<PhanKey, string> = {
  I: 'Trắc nghiệm',
  II: 'Đúng / Sai',
  III: 'Trả lời ngắn',
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
function DauPhan({ phan, soCauBaPhan }: { phan: PhanKey; soCauBaPhan: SoCauBaPhan }) {
  const soCau = soCauBaPhan[phan]
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
          PHẦN {phan} — {TEN_PHAN[phan]} ({soCau} câu)
        </div>
        <div className="truncate" style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)' }}>
          {moTaBieuDiem(soCauBaPhan, phan)}
        </div>
      </div>
    </div>
  )
}

const KHOA_HO_TEN = 'ddh.em.hoTen'
const KHOA_NAM_SINH = 'ddh.em.namSinh'


export default function ExamTakeScreen() {
  const showToast = useAppStore((s) => s.showToast)

  const [phase, setPhase] = useState<'join' | 'loading' | 'cho' | 'exam' | 'submitted' | 'error'>('join')
  /** Bản ref của `phase`. Vòng thử lại của phòng chờ chạy ngoài chu kỳ vẽ lại,
   * nên nó phải đọc được màn HIỆN TẠI chứ không phải màn lúc nó khởi hành —
   * em đã vào thi được rồi mà vòng lặp vẫn tưởng chưa thì nó kéo em ra lại. */
  const phaseRef = useRef(phase)
  phaseRef.current = phase
  /** Câu lỗi cuối cùng của `handleJoin`, để vòng thử lại phân biệt được
   * "máy chủ đang đông" với "em bị chặn thật". Thử lại một lỗi không bao giờ
   * hết là hành em sáu lần rồi vẫn ra đúng câu ấy. */
  const loiVaoThiRef = useRef('')
  const [errorMsg, setErrorMsg] = useState('')
  // ĐÃ NỘP RỒI, MỞ LẠI LINK TRÊN MÁY KHÁC — thầy báo 07/09: em bấm link ca để
  // xem điểm thì nhận một ô ĐỎ như app hỏng. Bài đã nộp xong không phải lỗi,
  // nên tách riêng: ô vàng, nói rõ nộp lúc nào và điểm nằm ở đâu.
  const [daNopRoi, setDaNopRoi] = useState<{ nopLuc: string; lanThu: number } | null>(null)
  // CHẾ ĐỘ XEM ĐIỂM — đường `/d/<mã ca>` (thầy chốt 07/09).
  //
  // Cùng màn này, khác đúng hai chỗ: ô nhập chỉ hỏi SỐ BÁO DANH, và nút bấm mở
  // thẳng trạng thái "Đã nộp bài" bằng bài lấy từ máy chủ thay vì tạo lượt mới.
  // Không dựng màn điểm riêng: em phải thấy ĐÚNG cái màn lúc vừa thi xong, đủ
  // bốn nút Xem điểm chi tiết · Xem báo cáo học tập · Xem đề & lời giải · Hỏi
  // bài Thầy — dựng màn thứ hai là hai nơi rồi lệch nhau.
  const [laXemDiem] = useState(() => docDuongVao(location.search, location.pathname).vai === 'diem')

  const [maCa, setMaCa] = useState('')
  const [sbd, setSbd] = useState('')
  // MÀN XÁC NHẬN TÊN (thầy chốt 07/09). Em gõ MỖI số báo danh; bấm Vào thi thì
  // máy tra tên của chính số đó và hiện lên cho em nhìn, rồi em bấm Bắt đầu hay
  // Nhập lại.
  //
  // VÌ SAO ĐỔI: bản cũ bắt gõ đủ ba ô (số báo danh, họ tên, năm sinh) rồi so
  // với danh sách. Gõ lệch bất cứ ô nào cũng chỉ nhận đúng một câu "thông tin
  // không đúng" — 07/09 hai em bị chặn giữa buổi mà không ai biết sai ở đâu.
  // Nhìn thấy TÊN MÌNH thì gõ nhầm một số là phát hiện ngay.
  const [xacNhan, setXacNhan] = useState<{ sbd: string; hoTen: string; lop: string } | null>(null)
  const [dangTraTen, setDangTraTen] = useState(false)
  // PHÒNG CHỜ (thầy chốt 07/09): em đã qua cổng nhưng thầy chưa bấm bắt đầu.
  const [cho, setCho] = useState<{ tenCa: string; thoiGianPhut: number } | null>(null)
  const [loiCho, setLoiCho] = useState('')
  // DANH TÍNH — máy chủ đối chiếu đủ ba (số báo danh, họ tên, năm sinh) với
  // danh sách thầy đã nạp. Nhớ trên máy để lần sau em chỉ gõ mã ca; đây là
  // tiện dùng, KHÔNG phải quyền: máy chủ vẫn kiểm lại mỗi lần vào thi.
  const [hoTen, setHoTen] = useState(() => {
    try { return localStorage.getItem(KHOA_HO_TEN) ?? '' } catch { return '' }
  })
  // Năm sinh chỉ còn để GỬI KÈM cho ca lọc theo khối; không còn ô nhập nào từ
  // 07/09, giá trị lấy từ lần trước em đã gõ trên chính máy này.
  const [namSinh] = useState(() => {
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
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  /** ĐANG CÓ MỘT LƯỢT NỘP CHẠY DỞ. Chốt chống chồng lượt — xem `nhip-gui-lai`. */
  const dangGui = useRef(false)
  /** Số lần nộp hỏng liên tiếp, để giãn nhịp thử lại. Nộp được thì về 0. */
  const lanHong = useRef(0)
  // Nhịp thử lại đọc `attemptRef` (khai ngay dưới) chứ KHÔNG gọi `trySend`
  // bên trong updater của `setAttempt`: updater phải thuần, và React có thể
  // chạy nó hai lần — chạy hai lần ở đây là gửi hai lượt nộp.
  /** Đếm cho màn hình: đã thử mấy lần rồi, để em thấy máy CÓ đang làm gì. */
  const [soLanThuGui, setSoLanThuGui] = useState(0)
  const hiddenSinceRef = useRef<number | null>(null)
  // TÍN HIỆU MỚI (BAOMATCATHI): lý do đang che đề; null = không che.
  const [lyDoChe, setLyDoChe] = useState<string | null>(null)
  const leaveCountRef = useRef(0)
  // GIẢM TẢI MÁY CHỦ (05/09): nhớ thứ đã gửi lần trước để bỏ nhịp khi không có
  // gì đổi, và chu kỳ đã lệch pha riêng của máy này để ba mươi máy không đập
  // cùng một nhịp. Xem ghi chú ở đầu khối này trong exam-api.ts.
  // HAI CỔNG NHỊP. Xem `src/lib/nhip-gui.ts` — cái bẫy "ghi nhớ trước khi gửi"
  // được mô tả ở đầu tệp đó, và đây là hai chỗ duy nhất dùng nó.
  /** Đã giãn lượt vào thi đầu tiên chưa — chỉ giãn một lần cho mỗi phiên mở app. */
  const daGianVaoThiRef = useRef(false)
  const congRef = useRef({
    trangThai: new CongNhip(NHIP_BAO_SONG_GIAY * 1000),
    luuTam: new CongNhip(NHIP_TIM_LUU_TAM_GIAY * 1000),
  })
  const chuKyRef = useRef({ trangThai: chuKyLechPha(10), luuTam: chuKyLechPha(CHU_KY_LUU_TAM_GIAY) })
  // GIỮ ĐỂ ĐỌC: hai con số cộng dồn cho thầy đọc ở Chi tiết ca. Để trong ref
  // chứ không state — đếm mà render lại là mất hết cái lợi của việc không dùng
  // state ở effect kia. Gộp vào `integrity` đúng lúc nộp bài.
  const demTatDe = useRef({ soLan: 0, giay: 0, coChay: false })
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
  // HỎI BÀI THẦY (HOIBAITHAY.md). `daGuiHoi` giữ đúng những gì đã gửi lần
  // trước, để mở lại tấm trượt là thấy tick sẵn và sửa được (mục 4B).
  const [moHoiBai, setMoHoiBai] = useState(false)
  const [dangGuiHoi, setDangGuiHoi] = useState(false)
  const [loiHoiBai, setLoiHoiBai] = useState('')
  const [daGuiHoi, setDaGuiHoi] = useState<{ qids: string[]; ghiChu: string } | null>(null)

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

  // GỬI NỐT BÀI CÒN TỒN ĐỌNG — KHACPHUCTREOHANGLOAT.md T6 ("bài nộp không được
  // phép mất").
  //
  // Bài được ghi vào IndexedDB với `pendingSubmit: true` TRƯỚC lượt gọi mạng
  // đầu tiên, nên máy chủ chết hay mạng đứt thì bài vẫn còn nguyên trên máy em.
  // Nhưng đường thử lại cũ chỉ sống trong lúc màn ca ấy còn mở: em tắt app rồi
  // mở lại vào ca khác — hoặc chỉ mở app xem điểm — thì bài cũ nằm im trong
  // hàng đợi mãi mãi. `listPendingAttempts` có sẵn từ lâu mà KHÔNG chỗ nào gọi.
  //
  // Nay mở app là quét hàng đợi một lượt. Gửi lại an toàn nhờ khoá chống trùng
  // `maCa|sbd|lanThu` ở máy chủ (T4): máy chủ nhận rồi thì trả `daNhan` chứ
  // không ghi đè.
  useEffect(() => {
    let huy = false
    void (async () => {
      const url = scriptUrlRef.current.trim()
      if (!url) return
      let ton: ExamAttempt[] = []
      try {
        ton = await listPendingAttempts()
      } catch {
        return // IndexedDB bị chặn — không có gì để làm, và không được nổ
      }
      for (const bai of ton) {
        if (huy) return
        // Bài của CHÍNH ca đang mở đã có đường thử lại riêng của nó.
        const dang = attemptRef.current
        if (dang && dang.maCa === bai.maCa && dang.sbd === bai.sbd) continue
        try {
          await submitAnswers(url, bai.maCa, bai.sbd, bai.maDe, bai.answers, bai.integrity, bai.lanThu ?? 1, bai.idThietBi ?? layIdThietBi(), bai.giayCau)
          await saveAttempt({ ...bai, pendingSubmit: false })
          showToast(`Đã gửi nốt bài ca ${bai.maCa} còn tồn trên máy`, 'success')
        } catch (e) {
          // CA ĐÃ KHOÁ nghĩa là thầy đã nộp hộ theo bản lưu tạm — bài của em ĐÃ
          // được chấm. Xoá khỏi hàng đợi, nếu không máy em thử lại mỗi lần mở
          // app cho tới hết đời.
          const loi = e instanceof Error ? e.message : String(e)
          if (loi.includes('Ca đã khoá') || loi.includes('da_dong')) {
            await saveAttempt({ ...bai, pendingSubmit: false })
          }
          // Lỗi mạng thì để nguyên trong hàng đợi, lần mở app sau gửi tiếp.
        }
      }
    })()
    return () => {
      huy = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
  // DANH SÁCH CÂU CHO TẤM TRƯỢT HỎI BÀI — dựng TẠI MÁY EM từ bộ câu đã có
  // trong bộ nhớ, KHÔNG gọi máy chủ (tiêu chí trải nghiệm số 2).
  //
  // `sai` CHỈ được điền khi ca đã công bố điểm và máy em đã chấm xong. Chưa
  // công bố mà điền là lộ đáp án cho cả lớp — điều cấm số 3.
  const cauHoiBai: CauChon[] = useMemo(() => {
    const a = attempt
    if (!assignment || !a) return []

    // CA ĐÃ CÔNG BỐ ĐIỂM: máy em có `keyBank` (đề kèm đáp án + lời giải) nên
    // dựng được thẻ câu đầy đủ y như báo cáo, qua ĐÚNG một bộ dựng.
    if (keyBank) {
      const banks = [{ maDe: a.maCa, phanI: keyBank.phanI, phanII: keyBank.phanII, phanIII: keyBank.phanIII }]
      const rows = taoChiTietCau(keyBank, a.maCa, a.sbd, a.answers, a.giayCau)
      return dungCauSai(rows, banks, false).map((c) => ({ qid: c.qid, chiTiet: c }))
    }

    // CHƯA CÔNG BỐ: máy em CHỈ có đề công khai, không có đáp án nào để lộ. Dựng
    // thẻ rỗng phần lời giải — không phải giấu, mà là thật sự không có.
    const trong = (qid: string, phan: 'I' | 'II' | 'III', soCau: number, de: string, luaChon: string[] | null, daChon: string): CauChon => ({
      qid,
      // Giây từng câu lấy từ CHÍNH lượt đã lưu, KHÔNG lấy từ ref đo dấu vết:
      // ref đó khai báo mãi dưới thân hàm, mà khối này chạy ngay lần dựng đầu
      // → "Cannot access before initialization", vỡ luôn màn Làm bài (thầy báo
      // 06/09). `attempt.giayCau` có sẵn ở đây và là cùng một con số.
      chiTiet: { phan, soCau, qid, chuyenDe: '', mucDo: '', giay: a.giayCau?.[qid] ?? null, de, luaChon, dapAnDung: '', dapAnChon: daChon, chot: '', lyDo: null, buoc: null, ketQua: '', coHinh: false },
    })
    return [
      ...assignment.phanI.map((x, i) => trong(x.qid, 'I', i + 1, x.question.text, [...(x.question.choices ?? [])], a.answers.phanI[x.qid] ?? '')),
      ...assignment.phanII.map((x, i) => trong(x.qid, 'II', i + 1, x.question.text, [...(x.question.ideas ?? [])], (a.answers.phanII[x.qid] ?? []).map((v) => v ?? '-').join(''))),
      ...assignment.phanIII.map((x, i) => trong(x.qid, 'III', i + 1, x.question.text, null, a.answers.phanIII[x.qid] ?? '')),
    ]
  }, [assignment, attempt, keyBank])

  const guiHoiBai = async (qids: string[], ghiChu: string) => {
    const a = attemptRef.current
    if (!a) return
    setDangGuiHoi(true)
    setLoiHoiBai('')
    try {
      const goi = goiCauHoi(a.maCa, a.sbd, qids, ghiChu)
      await guiCauHoi(scriptUrl.trim(), goi)
      setDaGuiHoi({ qids: goi.qids, ghiChu: goi.ghiChu })
      setMoHoiBai(false)
    } catch (e) {
      // GIỮ NGUYÊN lựa chọn của em: tấm trượt không đóng, em bấm Gửi lại được
      // ngay khi có mạng, không phải tick lại từ đầu.
      setLoiHoiBai(e instanceof Error ? e.message : 'Chưa gửi được, em thử lại giúp Thầy')
    } finally {
      setDangGuiHoi(false)
    }
  }

  const flat: FlatRef[] = useMemo(() => {
    if (!assignment) return []
    const out: FlatRef[] = []
    assignment.phanI.forEach((_, i) => out.push({ phan: 'I', i }))
    assignment.phanII.forEach((_, i) => out.push({ phan: 'II', i }))
    assignment.phanIII.forEach((_, i) => out.push({ phan: 'III', i }))
    return out
  }, [assignment])

  // BỘ CÂU THẬT SỰ CỦA EM — một nguồn cho cả chấm điểm lẫn màn xem lại.
  //
  // Ưu tiên `assignment`: đó chính là bộ câu màn làm bài vừa bày ra, không có
  // gì thật hơn thế. Mở lại app sau khi nộp thì `assignment` không còn (bank
  // công khai đã xoá), lúc ấy dựng lại từ bài làm.
  //
  // TUYỆT ĐỐI KHÔNG để rơi về `assignStudentQuestions(keyBank, …)` như bản cũ:
  // `keyBank` máy chủ trả về là CẢ KHO của ca kèm `soCau`, KHÔNG kèm `boTheoEm`,
  // nên nó rút lại một bộ 8 câu khác hẳn bộ em đã làm (thầy bắt được 10/09 tối,
  // ca 234641 — điểm 5,69 thành 2,56, và màn xem lại bày ra toàn câu lạ).
  const boCauCuaEm: string[] | null = useMemo(() => {
    if (assignment) {
      return [...assignment.phanI, ...assignment.phanII, ...assignment.phanIII].map((x) => x.qid)
    }
    if (!keyBank || !attempt) return null
    return boCauTuBaiLam(keyBank, attempt.maCa, attempt.sbd, attempt.answers, attempt.giayCau, keyBank.soCau)
  }, [assignment, keyBank, attempt])

  // Bộ câu ĐẦY ĐỦ (kèm đáp án đúng + lời giải) dùng riêng cho màn "Xem lại
  // lời giải" — cùng bộ qid với bài em đã làm, chỉ khác nguồn có đáp án
  // (keyBank) thay vì bank công khai.
  const solutionAssignment: StudentAssignment | null = useMemo(() => {
    if (!keyBank || !attempt) return null
    const kho = boCauCuaEm && boCauCuaEm.length > 0 ? { ...keyBank, boTheoEm: { [attempt.sbd]: boCauCuaEm } } : keyBank
    return assignStudentQuestions(kho, attempt.maCa, attempt.sbd)
  }, [keyBank, attempt, boCauCuaEm])

  // SỐ CÂU BA PHẦN — biểu điểm phải tính từ đây, không in cứng 0,25.
  const soCauBaPhan = (a: StudentAssignment | null): SoCauBaPhan =>
    ({ I: a?.phanI.length ?? 0, II: a?.phanII.length ?? 0, III: a?.phanIII.length ?? 0 })
  const soCauCuaBai = soCauBaPhan(assignment)
  const soCauCuaBaiGiai = soCauBaPhan(solutionAssignment)

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

  // LỊCH SỬ ĐIỂM — để báo cáo của em có đường tiến bộ như bản gửi phụ huynh.
  //
  // THẦY CHỐT 06/09: lấy từ MÁY CHỦ, vì em đổi máy là mất sạch nếu chỉ đọc
  // trong máy. Máy chủ khoá bằng lượt đã nộp + mã thiết bị nên đổi máy vẫn đủ
  // lịch sử, mà đọc trộm theo số báo danh thì không qua được.
  //
  // Bản lưu trong máy GIỮ LẠI làm đường lùi: mất mạng ngay lúc nộp thì em vẫn
  // thấy biểu đồ của những ca đã làm trên máy này, thay vì thấy trống trơn.
  const [lichSuEm, setLichSuEm] = useState<DiemMotCa[]>([])
  useEffect(() => {
    if (!attempt || !graded) return
    let con = true
    void (async () => {
      const nay: DiemMotCa = { maCa: attempt.maCa, tenCa: attempt.tenCa || '', ngay: attempt.submittedAt || new Date().toISOString(), tong: graded.score.total, hang: null, siSo: null }
      try {
        await luuDiemCuaEm({ maCa: nay.maCa, sbd: attempt.sbd, tenCa: nay.tenCa, ngay: nay.ngay, tong: nay.tong })
      } catch {
        // IndexedDB hỏng thì bỏ qua bản lưu, vẫn còn đường máy chủ.
      }
      try {
        const tren = await lichSuEmApi(scriptUrl.trim(), attempt.maCa, attempt.sbd, idThietBiCuaLuot(attempt))
        if (con && tren.length > 0) return setLichSuEm(tren)
      } catch {
        // Mất mạng, hoặc máy chủ chưa triển khai bản mới — rơi về bản lưu
        // trong máy chứ không để báo cáo trống.
      }
      try {
        const ds = await docLichSuDiem(attempt.sbd)
        const co = ds.map((d) => ({ maCa: d.maCa, tenCa: d.tenCa, ngay: d.ngay, tong: d.tong, hang: null, siSo: null }))
        if (con) setLichSuEm(co.length > 0 ? co : [nay])
      } catch {
        if (con) setLichSuEm([nay])
      }
    })()
    return () => {
      con = false
    }
  }, [attempt, graded, scriptUrl])

/** ID THIẾT BỊ DÙNG CHO MỌI LỆNH KHẮC PHỤC — MỘT NGUỒN SỰ THẬT.
 *
 * NGUYÊN NHÂN GỐC CỦA "RÚT CÂU KHẮC PHỤC KHÔNG CÓ NÚT NỘP", thầy báo ba lần
 * tối 09/09 và lần thứ ba nói rõ: quay trên máy CỦA HỌC SINH, và TẤT CẢ học
 * sinh đều dính.
 *
 * Hai lệnh khắc phục đi qua ĐÚNG MỘT cổng máy chủ (`quaCongLuot_`), nhưng gửi
 * id thiết bị theo hai cách khác nhau:
 *
 *   cauKhacPhuc      → `attempt.idThietBi || layIdThietBi()`   CÓ đường lùi
 *   ghiPhieuKhacPhuc → `a.idThietBi ?? ''`                     KHÔNG có
 *
 * `idThietBi` là trường TUỲ CHỌN trên `ExamAttempt` (`idThietBi?: string`), chỉ
 * được đặt lúc `vaoThi`. Lượt lưu từ bản app cũ, hoặc lượt mở lại bằng
 * `moLaiDaNop(existing)` từ bản đã cất, thì trường này rỗng. Khi đó:
 *
 *   · `cauKhacPhuc` rơi về id thật của máy ⇒ CHẠY ⇒ em thấy đủ 18 câu;
 *   · `ghiPhieuKhacPhuc` gửi chuỗi rỗng ⇒ máy chủ chặn ngay ở dòng đầu
 *     (`if (!maCaGP || !sbdGP || !idTbGP) return LOI_GP`) ⇒ KHÔNG có mã ⇒
 *     `nop` rỗng ⇒ phiếu tụt xuống bản chỉ đề: không nút nộp, không bấm chọn.
 *
 * Đúng triệu chứng thầy quay được: đề hiện ra đầy đủ mà không bấm được.
 *
 * Nay hai đường gọi CÙNG một hàm, không thể lệch nhau lần nữa.
 */
function idThietBiCuaLuot(a: { idThietBi?: string } | null | undefined): string {
  return (a?.idThietBi || layIdThietBi() || '').trim()
}

  // CÂU KHẮC PHỤC RÚT TỪ KHO ĐỀ (thầy chốt 06/09).
  //
  // Máy em chỉ giữ ngân hàng của chính ca vừa thi, nên bản trước kéo mãi cũng
  // chỉ ra bằng số câu của ca. Nay máy chủ đọc chuyên đề em vừa mất điểm rồi
  // rút thẳng từ kho đề của thầy, bỏ hẳn những câu em vừa làm.
  //
  // ĐẶT SAU `lichSuEm`, TRƯỚC `phieuCuaEm`: đọc một const khai bên dưới là
  // đúng cái bẫy vùng chết biến làm vỡ màn Làm bài ngày 06/09.
  const [khoKhacPhuc, setKhoKhacPhuc] = useState<TeacherExamSource[]>([])
  const [thuTuKhacPhuc, setThuTuKhacPhuc] = useState<string[]>([])
  const [khacPhucCatBot, setKhacPhucCatBot] = useState(false)
  useEffect(() => {
    if (!attempt || !graded || !keyBank) return
    let con = true
    void (async () => {
      try {
        const rows = taoChiTietCau(keyBank, attempt.maCa, attempt.sbd, attempt.answers, attempt.giayCau)
        const yeu = chuyenDeXinKho(rows)
        if (yeu.length === 0) return
        const kq = await cauKhacPhuc(
          scriptUrl.trim(),
          attempt.maCa,
          attempt.sbd,
          idThietBiCuaLuot(attempt),
          yeu,
          rows.map((r) => r.qid).filter(Boolean),
          SO_CAU_BAI_TAP_KEM,
        )
        if (!con) return
        // Gói máy chủ trả về đi qua ĐÚNG cửa nạp của kho đề, không nới luật
        // nào: câu thiếu phương án hay thiếu đáp án thì bỏ, không dựng phiếu
        // với ô trống rồi để em ngồi đoán.
        const nguon: TeacherExamSource[] = []
        for (const m of kq.nguon) {
          const doc = parseKhoDeJson(m.json)
          if (!doc.ok || !doc.json) continue
          const dung = buildTeacherSourceFromKhoDe(doc.json)
          if (dung.errors.length === 0) nguon.push(dung.source)
        }
        if (con) {
          setKhoKhacPhuc(nguon)
          setThuTuKhacPhuc(kq.thuTu)
          setKhacPhucCatBot(kq.catBotViNang)
        }
      } catch {
        // Mất mạng, máy chủ chưa triển khai bản mới, hoặc từ chối vì lượt
        // không khớp máy — rơi về ngân hàng của chính ca như trước.
      }
    })()
    return () => {
      con = false
    }
  }, [attempt, graded, keyBank, scriptUrl])

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
        lichSu: lichSuEm,
        khoKhacPhuc,
        thuTuKhacPhuc,
        // CÂU HỎI LẠI VÀO ĐƯỢC BÁO CÁO CỦA EM (thầy chốt 08/09: "học sinh thi
        // xong nhưng chưa thống kê là đã làm sai câu trước"). Máy chủ gửi bản
        // đồ này lúc em vào thi; ca thường thì rỗng và báo cáo không đổi.
        lapCua: attempt.demLap && Object.keys(attempt.demLap).length > 0 ? attempt.demLap : null,
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
  }, [keyBank, attempt, graded, hoTen, lichSuEm, khoKhacPhuc, thuTuKhacPhuc])
  // MÃ BÀI TẬP CHO BỘ CÂU KHẮC PHỤC — xin ngay khi báo cáo dựng xong.
  //
  // Báo cáo này do chính máy em dựng, không có mã phiếu; mà thanh Nộp bài chấm
  // theo mã. Không xin mã thì đúng chỗ em hay bấm nhất lại là chỗ không nộp
  // được (thầy bắt được 08/09).
  //
  // Xin MỘT LẦN cho mỗi bộ câu: `daXinRef` chặn gọi lại khi React dựng lại.
  // Xin hỏng thì im lặng — phiếu vẫn mở được, chỉ là chưa nộp được, và khối
  // bài luyện đã có sẵn dòng nói vì sao.
  const [maBaiTapEm, setMaBaiTapEm] = useState('')
  /** Lần xin đang bay: một khoá, một lời hứa. Hai chỗ cùng cần link (hiệu ứng
   * xin trước lúc dựng báo cáo, và cú bấm của em) thì dùng chung một lượt gọi,
   * không gọi máy chủ hai lần cho cùng một bộ câu. Xin HỎNG thì xoá đi để lần
   * bấm sau xin lại — treo một lời hứa hỏng là em bấm mãi không bao giờ có mã. */
  const maBaiTapRef = useRef<{ khoa: string; hua: Promise<string> } | null>(null)
  const soCauKhacPhuc = phieuCuaEm?.baiTap?.length ?? 0
  const xinLinkBaiTap = useCallback(async (): Promise<string> => {
    const url = scriptUrl.trim()
    const a = attempt
    if (!url || !a || !phieuCuaEm || soCauKhacPhuc === 0) return ''
    const khoa = `${a.maCa}:${a.sbd}:${soCauKhacPhuc}`
    if (!maBaiTapRef.current || maBaiTapRef.current.khoa !== khoa) {
      const hua = ghiPhieuKhacPhuc(
        url,
        a.maCa,
        a.sbd,
        idThietBiCuaLuot(a),
        (phieuCuaEm.baiTap ?? []).map((c) => ({ id: c.id, phan: c.phan, dapAn: c.dapAn })),
        { hoTen: phieuCuaEm.hoTen, tenChuyenDe: phieuCuaEm.chuyenDeCa?.[0]?.ten ?? '' },
      )
      hua.catch(() => {
        if (maBaiTapRef.current && maBaiTapRef.current.khoa === khoa) maBaiTapRef.current = null
      })
      maBaiTapRef.current = { khoa, hua }
    }
    const ma = await maBaiTapRef.current.hua.catch(() => '')
    if (!ma) return ''
    setMaBaiTapEm(ma)
    return taoLinkPhieu(`${location.origin}${import.meta.env.BASE_URL}`, ma)
  }, [scriptUrl, attempt, phieuCuaEm, soCauKhacPhuc])

  // XIN TRƯỚC ngay khi báo cáo dựng xong, để trường hợp thường thấy là em bấm
  // đã có link sẵn. Xin hỏng thì im lặng ở đây — cú bấm sẽ xin lại và khối bài
  // luyện có sẵn dòng nói vì sao chưa nộp được.
  useEffect(() => {
    void xinLinkBaiTap()
  }, [xinLinkBaiTap])

  /** Báo cáo kèm link bài tập — thứ làm cho phiếu khắc phục nộp được. */
  const phieuCuaEmCoLink: PhieuDayDu | null = useMemo(() => {
    if (!phieuCuaEm) return null
    if (!maBaiTapEm) return phieuCuaEm
    return { ...phieuCuaEm, linkBaiTap: taoLinkPhieu(`${location.origin}${import.meta.env.BASE_URL}`, maBaiTapEm) }
  }, [phieuCuaEm, maBaiTapEm])

  useEffect(() => {
    totalCountRef.current = assignment ? assignment.phanI.length + assignment.phanII.length + assignment.phanIII.length : 0
  }, [assignment])

  // Đẩy trạng thái làm bài (đang làm/đã làm bao nhiêu câu/số lần rời màn
  // hình/có bị khoá không) lên server để phụ huynh xem gần-thời-gian-thực —
  // không chặn luồng làm bài chính, lỗi mạng thì bỏ qua (xem pushExamStatus).
  const pushStatusNow = (a: ExamAttempt, dangLam: boolean, chiKhiDoi = false) => {
    const url = scriptUrlRef.current.trim()
    if (!url) return
    const daLam =
      Object.keys(a.answers.phanI).length +
      Object.keys(a.answers.phanII).length +
      Object.values(a.answers.phanIII).filter((v) => v.trim() !== '').length
    // BỎ NHỊP KHI KHÔNG CÓ GÌ ĐỔI. Vẫn báo sống mỗi NHIP_BAO_SONG_GIAY để thầy
    // phân biệt "em đang nghĩ" với "em tắt máy". Nộp bài và khoá bài KHÔNG đi
    // qua đường này (chiKhiDoi = false) nên không bao giờ bị bỏ.
    const van = `${daLam}|${a.integrity.leaveCount}|${a.integrity.blocked}|${dangLam}`
    const cong = congRef.current.trangThai
    // Nộp bài và khoá bài đi đường `chiKhiDoi = false` — KHÔNG bao giờ qua cổng,
    // nên không bao giờ bị bỏ.
    if (chiKhiDoi) {
      if (!cong.nenGui(van)) return
      cong.batDau()
    }
    void pushExamStatus(url, {
      sbd: a.sbd,
      maCa: a.maCa,
      lop: lopRef.current,
      dangLam,
      batDauLuc: a.startedAt,
      daLamCauHoi: daLam,
      tongCauHoi: totalCountRef.current,
      soLanRoiApp: a.integrity.leaveCount,
      blocked: a.integrity.blocked,
    }).then((xong) => {
      // CHỈ GHI NHỚ KHI MÁY CHỦ ĐÃ NHẬN. Ghi nhớ trước lúc gửi thì một nhịp rớt
      // mạng làm nhịp sau tưởng "đã gửi rồi, không có gì đổi" và bỏ qua luôn —
      // màn Theo dõi của thầy đứng im ở con số cũ trong khi em vẫn đang làm.
      if (!chiKhiDoi) return
      if (xong) cong.xong(van)
      else cong.hong()
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

  /** Ngân hàng nhận về có đáp án thật không — xem ghi chú trong `moLaiTuMayChu`. */
  const coDapAn = (b: KeyBank): boolean => {
    if (b.phanII.length > 0 && !Array.isArray(b.phanII[0]?.correct)) return false
    if (b.phanI.length > 0 && !b.phanI[0]?.correct) return false
    if (b.phanIII.length > 0 && b.phanIII[0]?.correct === undefined) return false
    return b.phanI.length + b.phanII.length + b.phanIII.length > 0
  }

  /** MỞ LẠI BÀI ĐÃ NỘP TỪ MÁY CHỦ — chế độ xem điểm.
   *
   * Máy này không cần giữ gì: đáp án của em, ngân hàng CÓ đáp án của ca và mốc
   * giờ đều lấy về từ máy chủ, dựng thành đúng cái `ExamAttempt` mà màn "Đã nộp
   * bài" vẫn đọc. Không ghi xuống IndexedDB — em mở nhờ máy bạn thì máy bạn
   * không giữ lại bài của em. */
  /** Em mở bài bằng LINK XEM ĐIỂM, không phải vừa thi xong.
   *
   * Bài từng bị khoá thì `integrity.blocked` còn nguyên trong bản ghi, và màn
   * "Đã nộp" lấy cờ ấy để hiện tấm cảnh báo đỏ "giơ tay gọi thầy" THAY CHO
   * bảng điểm. Đúng lúc đang thi, sai hẳn lúc xem lại: em Nguyễn Tiến Nam
   * (7,5 điểm) và em Khổng Minh Huyền ca 195422 bấm link xem điểm chỉ thấy
   * tấm cảnh báo, không thấy điểm đâu.
   *
   * Cờ này chỉ đổi phần HIỂN THỊ. `attempt.integrity.blocked` giữ nguyên, nên
   * mọi chỗ ghi sổ, đẩy trạng thái và dựng phiếu vẫn biết bài từng bị khoá. */
  const [xemLai, setXemLai] = useState(false)

  const moLaiTuMayChu = async () => {
    const ma = maCa.trim()
    const sb = sbd.trim()
    if (!ma || !sb) return showToast('Nhập đủ mã ca và số báo danh', 'error')
    const url = scriptUrl.trim()
    if (!url) return showToast('Chưa có link kết nối — mở đúng link Thầy gửi', 'error')
    setPhase('loading')
    try {
      setXemLai(true)
      const b = await layBaiDaNop(url, ma, sb)
      if (!b.bank) throw new Error('Máy chủ chưa gửi đề của ca này — báo Thầy.')
      // ĐỀ PHẢI CÓ ĐÁP ÁN. Máy chủ có hai bản: bản gửi máy em lúc thi đã lược
      // sạch đáp án, bản `keyBank` mới có. Nhận nhầm bản lược thì bước chấm lại
      // nổ giữa chừng và em nhìn thấy màn "Màn Làm bài gặp lỗi" — đúng cái đã
      // xảy ra lần thử đầu 07/09. Kiểm ở đây để nói được câu người đọc hiểu.
      if (!coDapAn(b.bank)) throw new Error('Ca này chưa công bố đáp án — hỏi Thầy.')
      setBank(b.bank)
      setLop(b.lop)
      if (b.hoTen) setHoTen(b.hoTen)
      setAttempt({
        key: `${ma}:${sb}`,
        maCa: ma,
        sbd: sb,
        maDe: ma,
        startedAt: b.luot.vaoLuc || b.luot.nopLuc,
        durationMinutes: b.thoiGianPhut,
        lanThu: b.luot.lanThu,
        giayCau: b.luot.giayCau ?? undefined,
        tenCa: b.tenCa,
        giuDeDoc: b.giuDeDoc,
        answers: b.luot.dapAn ?? { phanI: {}, phanII: {}, phanIII: {} },
        integrity: b.luot.integrity ?? {
          leaveCount: b.luot.soLanRoiMan,
          totalHiddenMs: b.luot.tongGiayRoiMan * 1000,
          events: [],
          blocked: b.luot.trangThai === 'khoa',
        },
        submitted: true,
        submittedAt: b.luot.nopLuc || null,
        pendingSubmit: false,
      })
      // Chấm ngay tại máy em bằng ngân hàng CÓ đáp án vừa nhận — KHÔNG gọi
      // `apDungKeyBank`: hàm đó còn bật popup điểm và ghi điểm lên máy chủ.
      // Ở đây em chỉ xem lại, popup phải chờ em bấm "Xem điểm chi tiết", và
      // điểm trên máy chủ đã có rồi, ghi đè lần nữa là thừa.
      setKeyBank(b.bank)
      setChoCaLop(null)
      try {
        // Mở lại app sau khi nộp: KHÔNG còn `assignment` để đối chiếu, nên dựng
        // bộ câu từ chính bài đã nộp. Thiếu tham số này là chấm theo bộ câu rút
        // lại bằng hạt giống — sai hẳn với ca đề riêng.
        const daNop = b.luot.dapAn ?? { phanI: {}, phanII: {}, phanIII: {} }
        const boEm = boCauTuBaiLam(b.bank, ma, sb, daNop, b.luot.giayCau, b.bank.soCau)
        setGraded(gradeFromKeyBank(b.bank, ma, sb, daNop, boEm))
      } catch {
        // Đề đổi sau khi em thi thì không chấm lại được — vẫn hiện màn đã nộp,
        // chỉ thiếu điểm, chứ không ném em vào màn lỗi.
        setGraded(null)
      }
      setPhase('submitted')
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Không mở được bài của em.')
      setPhase('error')
    }
  }

  // VÀO THI (QUANLYCATHI.md mục 1 + 3): máy chủ quyết định — một SBD một lượt
  // mỗi ca, phân biệt máy bằng id thiết bị, 3 mốc thời gian, giờ máy chủ.
  // Không có mạng: CHỈ cho tiếp tục lượt đang làm dở trên chính máy này (đề
  // đã cache) — không tạo được lượt mới ngoài tầm máy chủ.
  /** BƯỚC 1: em gõ số báo danh, máy tra tên rồi hiện màn xác nhận. */
  const traTenRoiHoi = async () => {
    const ma = maCa.trim()
    const sb = sbd.trim()
    if (!ma || !sb) return showToast('Nhập đủ mã ca và số báo danh', 'error')
    const url = scriptUrl.trim()
    if (!url) return showToast('Chưa có link kết nối — mở đúng link thầy gửi.', 'error')
    setDangTraTen(true)
    try {
      const kq = await tenTheoSbd(url, ma, sb)
      // Máy chủ nhận số báo danh nhưng danh sách chưa có tên: KHÔNG bịa, cũng
      // không chặn — hiện thẳng để em và thầy biết.
      setXacNhan({ sbd: kq.sbd, hoTen: kq.hoTen, lop: kq.lop })
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Không tra được số báo danh', 'error')
    } finally {
      setDangTraTen(false)
    }
  }

  /** BƯỚC 2: em nhìn đúng tên mình rồi bấm Bắt đầu.
   *
   * HÀNG RÀO TẠI NGUỒN — thầy báo 08/09: 17/36 em bị chặn "không khớp danh sách".
   * Đọc sổ ChanVao của ca 447479: 37/40 dòng có họ tên RỖNG, 40/40 có năm sinh
   * RỖNG. Máy em gửi chuỗi rỗng chứ không gửi sai.
   *
   * Gốc: hai ô họ tên và năm sinh đã gỡ khỏi màn nhập (07/09), nên cổng máy chủ
   * chỉ còn mở bằng `xacNhanTen`. Mà hàm này còn một lối vào KHÔNG qua bước 1
   * (phím Enter trong ô số báo danh), ở đó `xacNhan` là null nên gửi lên toàn
   * chuỗi rỗng và bị máy chủ coi là khai sai tên.
   *
   * Không vá riêng chỗ phím Enter: vá một lối thì lối sau lại rơi đúng hố cũ.
   * Chặn ngay đầu hàm — chưa xác nhận tên thì KHÔNG gọi máy chủ, mà quay về
   * bước 1. Từ đây mọi lối vào, kể cả lối thêm sau này, đều đi qua xác nhận. */
  const handleJoin = async () => {
    const ma = maCa.trim()
    const sb = sbd.trim()
    const ten = (xacNhan?.hoTen || hoTen).trim()
    const nam = namSinh.trim()
    if (!ma || !sb) return showToast('Nhập đủ mã ca và số báo danh', 'error')
    if (!laXemDiem && !xacNhan) return void traTenRoiHoi()
    // Nhớ cho lần sau — em không phải gõ lại mỗi ca.
    try {
      if (ten) localStorage.setItem(KHOA_HO_TEN, ten)
      if (nam) localStorage.setItem(KHOA_NAM_SINH, nam)
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
        // XẾP HÀNG 0–3 GIÂY TRƯỚC LƯỢT VÀO ĐẦU TIÊN (T5). Thầy hô một tiếng là
        // cả lớp bấm trong hai giây; rải ra thì ba mươi lượt nối đuôi nhau thay
        // vì chồng lên nhau. Chỉ giãn LẦN ĐẦU — em bấm lại sau khi hỏng thì vào
        // thẳng, vì lúc ấy đám đông đã tan và em đang ngồi chờ.
        if (!daGianVaoThiRef.current) {
          daGianVaoThiRef.current = true
          const cho = gianVaoThi()
          if (cho > 0) await new Promise((nghi) => setTimeout(nghi, cho))
        }
        try {
          kq = await vaoThi(url, ma, sb, idTb, !cached, { hoTen: ten, namSinh: nam, xacNhanTen: xacNhan !== null })
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
        // Máy này không giữ bài (em mở link ở máy khác, hoặc đã xoá dữ liệu
        // trình duyệt): không có đường nào lấy lại đáp án của em từ máy chủ —
        // `lichSuEm` khoá theo id thiết bị của chính lượt đã nộp. Nói thẳng
        // điều đó và chỉ sang phiếu, thay vì ném một ô lỗi đỏ.
        if (kq.lyDo === 'da_nop') {
          setDaNopRoi({ nopLuc: kq.nopLuc || '', lanThu: kq.lanThu || 1 })
          setPhase('error')
          return
        }
        throw new Error(thongDiepChan(kq, gioNgan))
      }

      // Thầy vừa MỞ KHOÁ (mục 6): máy này đang giữ bài bị khoá → bỏ khoá, đếm
      // ngưỡng lại từ mốc hiện tại, giữ nguyên đáp án + lịch sử rời màn, làm tiếp.
      // THẦY VỪA MỞ KHOÁ. Không đòi cờ `daMoKhoa` nữa: cờ ấy do Apps Script
      // trả, máy chủ mới không có nên nó LUÔN false — em Nguyễn Anh Tùng và em
      // Đào Khánh Ngọc sáng 12/09 được mở khoá mà vào lại vẫn rơi vào màn "Đã
      // nộp" (dòng ghi_chu trong D1: "mở khoá bởi thầy", trạng thái vẫn da_nop).
      //
      // `cach === 'khoi_phuc'` đã đủ và chặt: em nộp thật thì máy chủ trả
      // `lyDo: 'da_nop'` (ok:false) chứ không bao giờ trả `khoi_phuc`. Nên
      // khoi_phuc + máy này đang giữ bài bị khoá ⇒ đúng là thầy đã mở khoá.
      if (kq.cach === 'khoi_phuc' && existing?.submitted && existing.integrity.blocked) {
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
      // PHÒNG CHỜ (thầy chốt 07/09). Em qua hết cổng nhưng thầy chưa bấm "Bắt
      // đầu thi": máy chủ chưa tạo lượt và chưa gửi đề, nên ở đây KHÔNG có gì
      // để dựng. Sang màn chờ và hỏi lại máy chủ vài giây một lần.
      if (kq.cach === 'cho') {
        setLop(kq.lop)
        setCho({ tenCa: kq.tenCa, thoiGianPhut: kq.thoiGianPhut })
        setPhase('cho')
        return
      }

      // Máy chủ nói "khôi phục" nhưng máy này đã nộp (mất mạng lúc nộp, máy chủ
      // chưa nhận) → về màn Đã nộp và gửi tiếp, không cho làm lại.
      if (kq.cach === 'khoi_phuc' && existing?.submitted) return moLaiDaNop(existing)

      const bankGoc = cached?.bank ?? kq.bank
      if (!bankGoc) throw new Error('Máy chủ chưa gửi đề — bấm Vào thi lại.')
      // ĐỀ RIÊNG TỪNG EM: GHÉP BẢN ĐỒ VÀO KHO TRƯỚC KHI CẮT ĐỀ.
      //
      // Thầy bắt được 08/09: `vaoThi` gửi kho đề mà thiếu bản đồ, nên máy em
      // cắt 28 câu theo luật hash còn máy thầy chấm theo bản đồ — hai tờ đề
      // khác nhau. Ghép ở ĐÂY (không chỉ trông vào `kq.bank`) vì kho đề có thể
      // là bản đã cất từ lần vào trước, khi đó máy chủ không gửi lại kho.
      const boEm = kq.boCuaEm ?? []
      const bank = boEm.length > 0 ? { ...bankGoc, boTheoEm: { [sb]: boEm } } : bankGoc
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
      // CÂU HỎI LẠI: giữ bản đã cất nếu lần gọi này máy chủ không trả (ca thường,
      // hoặc máy chủ bản cũ) — mất dấu giữa chừng còn khó hiểu hơn không có dấu.
      const cauLap = (kq.cauLap && kq.cauLap.length > 0 ? kq.cauLap : existing?.cauLap) ?? []
      const demLap = (kq.demLap && Object.keys(kq.demLap).length > 0 ? kq.demLap : existing?.demLap) ?? {}
      const thongTinCa = { loai: kq.loai, hanNop: kq.hanNop, tenCa: kq.tenCa, giuDeDoc: kq.giuDeDoc, anHanGiay: kq.anHanGiay, cauLap, demLap }
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
            // KHÔNG LẶNG LẼ: em vào thi mà máy không ở toàn màn hình thì ghi
            // ngay một dấu vào nhật ký, để thầy đọc được ở khối Vi phạm của
            // Chi tiết ca. Toàn màn hình nay là KHUYÊN chứ không phải cửa (xem
            // ô nhắc ở màn vào thi), nhưng thầy vẫn phải biết em nào làm bài
            // trong tình trạng nào — nới ra mà giấu đi thì tệ hơn cả khoá.
            integrity: dangToanManHinh()
              ? emptyIntegrityLog()
              : { ...emptyIntegrityLog(), events: [{ type: 'vao_ngoai_toan_man', at: new Date().toISOString() }] },
            submitted: false,
            submittedAt: null,
            pendingSubmit: false,
          }
      await saveAttempt(a)
      setAttempt(a)
      if (kq.cach === 'duyet_lai') showToast(`Thầy đã duyệt cho thi lại — lần ${kq.lanThu}`, 'success')
      setPhase('exam')
    } catch (e) {
      loiVaoThiRef.current = e instanceof Error ? e.message : 'Lỗi không rõ nguyên nhân'
      setErrorMsg(loiVaoThiRef.current)
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
      if (attemptRef.current) pushStatusNow(attemptRef.current, true, true)
    }, chuKyRef.current.trangThai * 1000)
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
    const luu = (chiKhiDoi = false) => {
      const a = attemptRef.current
      const url = scriptUrlRef.current.trim()
      if (!a || !url) return
      // Em làm 28 câu trong 45 phút thì chỉ có 28 lần đáp án thật sự đổi; hơn
      // một trăm nhịp còn lại đang gửi lại y nguyên thứ máy chủ đã có. Nhịp
      // CUỐI lúc rời màn vẫn gửi vô điều kiện — đó là bản chốt.
      const van = JSON.stringify(a.answers)
      const cong = congRef.current.luuTam
      // Nhịp CUỐI lúc rời màn (`chiKhiDoi` false) đi vô điều kiện — đó là bản
      // chốt, không được phép nhường ai.
      if (chiKhiDoi) {
        if (!cong.nenGui(van)) return
        cong.batDau()
      }
      void luuTam(url, a.maCa, a.sbd, a.answers, giayCauRef.current).then((xong) => {
        if (!chiKhiDoi) return
        if (xong) cong.xong(van)
        else cong.hong()
      })
    }
    const id = setInterval(() => luu(true), chuKyRef.current.luuTam * 1000)
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
    const logEvent = (type: 'hidden' | 'visible' | 'blur' | 'focus', mocBatDau?: number) => {
      const cur = attemptRef.current
      if (!cur || cur.submitted) return
      const events = [...cur.integrity.events, { type, at: new Date().toISOString() }].slice(-200)
      if (type === 'hidden' || type === 'blur') {
        if (hiddenSinceRef.current !== null) return // đã đang ẩn (blur rồi hidden) — tính 1 lần
        hiddenSinceRef.current = mocBatDau ?? Date.now()
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
    // ẨN NGẮN KHÔNG PHẢI LÀ RỜI MÀN (thầy báo 06/09: iPhone vẫn khoá oan).
    // Kéo trung tâm điều khiển, thanh địa chỉ trượt ra, chuông báo hiện rồi
    // tắt — iOS đều bật `document.hidden` trong tích tắc. Chỉ ghi sổ khi màn
    // hình ẩn QUÁ `MS_XAC_NHAN_AN`; quay lại trước đó coi như chưa từng rời.
    let henAn: ReturnType<typeof setTimeout> | null = null
    const onVis = () => {
      if (document.hidden) {
        if (henAn) clearTimeout(henAn)
        henAn = setTimeout(() => {
          henAn = null
          // Còn ẩn thật thì mới tính, và tính LÙI về đúng lúc bắt đầu ẩn để
          // đồng hồ "rời quá lâu" không bị hụt mất nhịp chờ này.
          if (document.hidden) logEvent('hidden', Date.now() - MS_XAC_NHAN_AN)
        }, MS_XAC_NHAN_AN)
        return
      }
      if (henAn) {
        // Về trước khi kịp xác nhận ⇒ chưa từng ghi 'hidden', nên cũng không
        // được ghi 'visible': ghi vào là đẻ một cặp rời–về giả trong nhật ký.
        clearTimeout(henAn)
        henAn = null
        return
      }
      logEvent('visible')
    }
    // BLUR KHÔNG ĐÁNG TIN (thầy báo 06/09: iPhone khoá oan). Trên máy cảm ứng
    // bỏ hẳn; trên máy có chuột phải chờ rồi đọc lại `hasFocus()` mới tính.
    // Xem khối luật ở đầu `chong-gian-lan.ts`.
    const camUng = laMayCamUng()
    let henBlur: ReturnType<typeof setTimeout> | null = null
    const onBlur = () => {
      if (camUng) return
      if (henBlur) clearTimeout(henBlur)
      henBlur = setTimeout(() => {
        henBlur = null
        if (tinhLaRoiMan('mat_tieu_diem', camUng, document.hasFocus())) logEvent('blur')
      }, MS_XAC_NHAN_BLUR)
    }
    const onFocus = () => {
      // Tiêu điểm về trước khi kịp xác nhận ⇒ chưa từng tính là rời màn, nên
      // cũng không được ghi 'focus' (ghi vào là đẻ một cặp rời–về giả).
      if (henBlur) {
        clearTimeout(henBlur)
        henBlur = null
        return
      }
      logEvent('focus')
    }
    // Thoát toàn màn hình (Back trên Android, vuốt xuống…) khi KHÔNG ở chế độ
    // standalone → tính là rời màn hình (quay lại toàn màn hình = quay lại).
    //
    // KHÔNG áp cho máy cảm ứng: iOS không cho phần tử vào toàn màn hình thật,
    // nên `dangToanManHinh()` luôn false và mỗi lần sự kiện bắn là một lần
    // "rời màn" bịa ra. Trên iPhone `hidden` đã đủ bắt em thoát app.
    const onFs = () => {
      if (camUng) return
      logEvent(dangToanManHinh() ? 'focus' : 'hidden')
    }
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
      if (henBlur) clearTimeout(henBlur)
      if (henAn) clearTimeout(henAn)
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
    // Máy cảm ứng (điện thoại, máy tính bảng) không có tín hiệu tiêu điểm và
    // toàn màn hình đáng tin — xem `khoaDuocViCuaSoNoi` và `onFs`.
    const camUngMay = laMayCamUng()
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

    /** Một phiếu vừa tới. **KHÔNG KHOÁ AI** — chỉ giữ lại trong cửa sổ trượt để
     * ghi bối cảnh vào nhật ký của thầy.
     *
     * Bản trước có hai đường dẫn tới khoá từ đây: đủ hai họ trùng khớp, và một
     * phiếu họ luồng-chính khi không ai chạm màn. Cả hai đã gỡ 06/09 — lý do
     * đầy đủ nằm ở khối "LUỒNG CHÍNH NGHẼN KHÔNG CÒN ĐƯỢC KHOÁ" trong
     * `man-thi-sach.ts`. Tóm tắt: đó là suy đoán từ độ nghẽn của máy, mà máy
     * nghẽn vì trăm thứ không phải gian lận, và điều kiện "không chạm màn" bắt
     * đúng vào em đang ngồi đọc đề.
     *
     * `phieuDuocKhoa` là cửa duy nhất còn lại: chỉ họ `do_truc_tiep`. Kênh 5, 6,
     * 8 rơi vào đây thì dừng ở dòng ghi sổ. */
    const xetPhieu = (p: PhieuKenh) => {
      phieu.push(p)
      while (phieu.length && phieu[0].luc < p.luc - MS_TRUNG_KHOP * 2) phieu.shift()
    }

    // ---- CÁCH 1: ĐẾM SỐ NGÓN CHẠM.
    // Chụp màn hình bằng cử chỉ trên Android là vuốt BA NGÓN, và trang nhận đủ
    // ba điểm chạm. Em làm bài chạm một ngón để chọn đáp án, hai ngón để phóng
    // ảnh — không bao giờ ba. Tín hiệu trực tiếp, không ngưỡng nào phải đo.
    //
    // Sau 06/09 đây là ĐƯỜNG DUY NHẤT còn khoá được vì dấu vết chụp trên điện
    // thoại (máy tính còn kênh 7 phím chụp). Mọi đường suy đoán đã gỡ.
    const demNgon = (e: Event) => {
      const t = (e as TouchEvent).touches
      if (!t || t.length < SO_NGON_CHUP) return
      if (daKhoa || conAnHan()) return
      if (coKhoa(muc, 'dau_vet_chup')) khoaVi('dau_vet_chup', `${t.length} ngón chạm cùng lúc`)
    }
    document.addEventListener('touchstart', demNgon, { passive: true })
    document.addEventListener('touchmove', demNgon, { passive: true })

    // ---- CÁCH 2 (CHE ĐỀ KHI BẤT ĐỘNG) ĐÃ GỠ 06/09 theo lệnh của thầy.
    // Video ca 06/09: em Tuân bị che đề ba lần trong 23 giây chỉ vì đang đọc.
    // Đề nay hiện suốt giờ làm bài. Lý do đầy đủ ở `man-thi-sach.ts`.

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
      if (!khoaDuocViCuaSoNoi(camUngMay)) return // che thì có, khoá thì không
      if (!conAnHan() && coKhoa(muc, 'cua_so_noi', soLanNoi)) khoaVi('cua_so_noi', 'nhịp soi tiêu điểm')
    }, MS_NHIP_SOI_TIEU_DIEM)

    const go = thuTinHieu({
      onPhieu: (p, bc) => {
        if (daKhoa) return

        // --- KÊNH 3: thoát toàn màn hình. Số đo trực tiếp, khoá một mình.
        //
        // KHÔNG áp cho máy cảm ứng: iOS không cho phần tử vào toàn màn hình
        // thật, nên `document.fullscreenElement` luôn null và mỗi lần sự kiện
        // bắn là một lần "thoát toàn màn" bịa ra. Cùng luật với `onFs` ở effect
        // đếm rời màn phía trên.
        if (p.kenh === 'toan_man') {
          if (camUngMay) return
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
          // MÁY CẢM ỨNG KHÔNG BỊ KHOÁ VÌ KÊNH NÀY — xem `khoaDuocViThuNhoMan`.
          // Che đề thì vẫn che, chỉ không khoá bài.
          if (kq.khoa && !conAnHan() && khoaDuocViThuNhoMan(camUngMay) && coKhoa(muc, 'thu_nho_man')) khoaVi('thu_nho_man', 'kênh 4')
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
            if (raTu !== null && p.luc - raTu < MS_VE_SOM) xetPhieu(p) // ra rồi về ngay: ghi sổ
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
              if (!khoaDuocViCuaSoNoi(camUngMay)) return // che thì có, khoá thì không
              if (!conAnHan() && coKhoa(muc, 'cua_so_noi', soLanNoi)) khoaVi('cua_so_noi', 'kênh 2')
            }, MS_XAC_NHAN_CUA_SO_NOI)
          }
          return
        }

        // --- KÊNH 5, 6, 8: CHỈ GHI SỔ, không khoá ai (gỡ 06/09). Ngưỡng lọc vẫn
        // giữ ở đây để nhật ký không ngập nhát yếu — trang /do dùng ngưỡng quan
        // sát rộng hơn.
        if (p.kenh === 'nhip_ve') {
          const gap = Number(/(\d+)/.exec(p.chiTiet)?.[1] ?? 0)
          if (gap >= MS_RAF_NGHI_CHOT) xetPhieu(p)
          return
        }
        // Kênh 6 (lệch đồng hồ) đã gỡ hẳn 06/09 — không còn nhánh nào ở đây.
        if (p.kenh === 'xung_chuyen_dong') {
          const xoan = Number(/([\d.]+)/.exec(p.chiTiet)?.[1] ?? 0)
          if (xoan >= NGUONG_XUNG_CHOT.xoan) xetPhieu(p)
        }
      },
    })

    return () => {
      go()
      document.removeEventListener('touchstart', demNgon)
      document.removeEventListener('touchmove', demNgon)
      window.clearInterval(nhipTieuDiem)
      if (henNoi) window.clearTimeout(henNoi)
      setLyDoChe(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // ==========================================================================
  // GIỮ ĐỂ ĐỌC — GIUDEDOC.md, effect RIÊNG, không đụng một dòng nào của luật
  // đếm rời app lẫn bốn tín hiệu khoá của BAOMATCATHI.
  //
  // Video 05/09 chứng minh cửa sổ nổi không để lại một bit tín hiệu nào cho
  // web. Nên thôi tìm cách nhìn thấy nó: đề chỉ hiện khi ngón tay em còn trên
  // màn thi. Muốn chạm vào cửa sổ nổi thì phải nhả tay, nhả tay thì đề tắt —
  // không đọc hai thứ cùng lúc được nữa.
  //
  // KHÔNG state React: đổi đúng MỘT thuộc tính trên thẻ <html>. Một setState
  // mỗi lần nhả tay là render lại cả màn 28 câu, mục 5 cấm.
  // KHÔNG khoá bài vì việc này (mục 9) — đây là hiển thị, không phải xử phạt.
  useEffect(() => {
    if (phase !== 'exam') return
    const a = attemptRef.current
    if (!a || !batCuaCa(a)) return
    // MÁY KHÔNG CẢM ỨNG: cơ chế KHÔNG bật (màn thi vốn dựng cho điện thoại; bật
    // ở máy tính là khoá cứng bài của một em không làm gì sai).
    //
    // KHÔNG còn `return` sớm ở đây. Lời khai của máy có thể sai — iPhone bật
    // "Yêu cầu trang web dành cho máy tính" khai `maxTouchPoints = 0` (thầy báo
    // 09/09). Nên vẫn gắn tai nghe, và quyết định bằng BẰNG CHỨNG: thấy một cú
    // `touchstart` thật thì bật. Xem `coCamUngThat`.
    const khaiCoCamUng = coCamUng()
    let daThayCham = false

    const anHanMs = anHanMsCua(a.anHanGiay)
    const tt = moTrangThaiGiu(performance.now())
    const goc = document.documentElement
    let dangAn = false
    let tatTu: number | null = null

    /** Đổi trạng thái hiện/ẩn. Chạm là hiện NGAY trong cùng nhịp xử lý sự
     * kiện, không đợi nhịp soi — MS_HIEN_LAI = 0. */
    const dat = (an: boolean, nay: number) => {
      if (an === dangAn) return
      dangAn = an
      if (an) {
        goc.setAttribute('data-giu-de-an', '1')
        tatTu = nay
        demTatDe.current.soLan += 1
      } else {
        goc.removeAttribute('data-giu-de-an')
        if (tatTu !== null) demTatDe.current.giay += (nay - tatTu) / 1000
        tatTu = null
      }
    }

    const soi = () => {
      const nay = performance.now()
      dat(
        !coMat(tt, nay, {
          coCamUng: coCamUngThat(daThayCham, khaiCoCamUng),
          dangGoO: dangGoOnhap(document.activeElement),
          anHanMs,
        }),
        nay,
      )
    }

    const xuong = (e: TouchEvent) => {
      const nay = performance.now()
      // Bằng chứng máy có cảm ứng. Từ đây cơ chế chạy dù máy khai gì đi nữa.
      daThayCham = true
      demTatDe.current.coChay = true
      for (const t of Array.from(e.changedTouches)) chamXuong(tt, t.identifier, t.clientX, t.clientY, nay)
      dat(false, nay) // hiện lại NGAY, cùng nhịp sự kiện
    }
    const di = (e: TouchEvent) => {
      const nay = performance.now()
      for (const t of Array.from(e.changedTouches)) chamDiChuyen(tt, t.identifier, t.clientX, t.clientY, nay)
      soi()
    }
    const len = (e: TouchEvent) => {
      const nay = performance.now()
      for (const t of Array.from(e.changedTouches)) chamLen(tt, t.identifier, nay)
    }
    // Cuộn quán tính và gõ bàn phím đều là bằng chứng em còn làm bài: ân hạn
    // đếm lại từ đây, nếu không thì nhả tay cho trang trôi là đề tắt giữa lúc
    // đang trôi. Bỏ che NGAY luôn — em gõ tiếp mà đề còn ẩn thêm một nhịp nữa
    // thì bực, và ngón tay em không hề rời bàn phím để chạm màn.
    const dong = () => {
      const nay = performance.now()
      ghiHoatDong(tt, nay)
      dat(false, nay)
    }

    document.addEventListener('touchstart', xuong, { passive: true })
    document.addEventListener('touchmove', di, { passive: true })
    document.addEventListener('touchend', len, { passive: true })
    document.addEventListener('touchcancel', len, { passive: true })
    document.addEventListener('scroll', dong, { passive: true, capture: true })
    document.addEventListener('keydown', dong)
    const nhip = window.setInterval(soi, MS_NHIP_SOI_GIU)

    return () => {
      document.removeEventListener('touchstart', xuong)
      document.removeEventListener('touchmove', di)
      document.removeEventListener('touchend', len)
      document.removeEventListener('touchcancel', len)
      document.removeEventListener('scroll', dong, true)
      document.removeEventListener('keydown', dong)
      window.clearInterval(nhip)
      dat(false, performance.now())
      goc.removeAttribute('data-giu-de-an')
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

  const doSubmit = async (a: ExamAttempt, tuDongNop = false) => {
    // GIỮ ĐỂ ĐỌC: gộp hai con số đúng lúc này, không rắc dọc đường. Chúng KHÔNG
    // đếm vào bất kỳ ngưỡng khoá nào — chỉ để thầy nhìn ở Chi tiết ca.
    const dem = demTatDe.current
    // BÁO SỐ NGAY CẢ KHI BẰNG 0, miễn là cơ chế CÓ CHẠY trên máy em.
    //
    // Bản cũ chỉ gửi khi `soLan > 0`, nên hai chuyện hoàn toàn khác nhau đổ vào
    // cùng một chỗ trống: "cơ chế chạy, em không nhả tay lần nào" và "cơ chế
    // KHÔNG chạy trên máy này". Thầy hỏi 09/09 iPhone nào không hoạt động thì
    // không có gì trong dữ liệu để trả lời — phải đoán. Nay đọc Chi tiết ca là
    // biết ngay em nào cơ chế không chạy.
    const integrity = dem.coChay ? { ...a.integrity, soLanTatDe: dem.soLan, giayTatDe: Math.round(dem.giay) } : a.integrity
    const updated: ExamAttempt = { ...a, integrity, giayCau: { ...(a.giayCau ?? {}), ...giayCauRef.current }, submitted: true, submittedAt: new Date().toISOString(), pendingSubmit: true }
    setAttempt(updated)
    await saveAttempt(updated)
    setPhase('submitted')
    pushStatusNow(updated, false)
    // GIÃN RIÊNG CÚ GỌI MẠNG, KHÔNG giãn việc lưu. Hết giờ là mốc CHUNG của cả
    // ca: mọi máy đếm về 0 trong cùng một giây rồi cùng bắn một lượt POST. Bài
    // đã lưu xong trên máy em ở dòng trên, `phase` cũng đã sang "đã nộp", nên
    // hoãn 0–2,5 giây không mất gì của em mà máy chủ đỡ hẳn cú dồn.
    //
    // Tự bấm Nộp bài thì KHÔNG giãn — em bấm rồi thì phải thấy máy chạy ngay,
    // và mấy chục em không bao giờ bấm trùng đúng một khoảnh khắc như hết giờ.
    const giam = tuDongNop ? gianNopTuDong() : 0
    if (giam > 0) setTimeout(() => void trySend(updated), giam)
    else void trySend(updated)
  }

  // Nhận keyBank (CÓ đáp án) → chấm tại máy em, hiện popup điểm (trừ bài bị
  // khoá — màn khoá đã đủ nghiêm), gửi nhận xét cho phụ huynh. Dùng chung cho
  // cả 2 đường: trả về ngay lúc nộp, hoặc hỏi lại sau (cả lớp xong / mở lại app).
  const apDungKeyBank = (kb: KeyBank, done: ExamAttempt) => {
    setKeyBank(kb)
    setChoCaLop(null)
    try {
      // BỘ CÂU CỦA EM đi kèm, KHÔNG để hàm tự rút lại. `kb` là cả kho của ca
      // (26/9/9) kèm `soCau` 8/2/2 nhưng KHÔNG kèm `boTheoEm`, nên thiếu tham
      // số này là chấm em theo 8 câu em chưa từng thấy — đúng chỗ làm điểm
      // popup của ca 234641 ra 2,56 trong khi bài được 5,69.
      const boEm = boCauCuaEm ?? boCauTuBaiLam(kb, done.maCa, done.sbd, done.answers, done.giayCau, kb.soCau)
      const g = gradeFromKeyBank(kb, done.maCa, done.sbd, done.answers, boEm)
      setGraded(g)
      if (!done.integrity.blocked) setGradedPopup(true)
      // MẪU SỐ máy em vừa chia. `gradeFromKeyBank` cắt đề theo `kb.soCau`, thiếu
      // thì rơi về mặc định 18/4/6 — đúng chỗ đã làm điểm ca 447479 lệch (xem
      // ghi chú dài ở `ghiDiem`). Khai đúng con số ĐÃ DÙNG, không khai con số
      // mình mong là đúng: máy chủ đối chiếu rồi mới cho ghi.
      const soCauEmDaChia = kb.soCau ?? undefined
      if (scriptUrlRef.current.trim()) {
        // Ghi điểm + chi tiết từng câu (chuyên đề, mức độ, giây làm) lên máy chủ
        // — quyền bằng id thiết bị của chính lượt này, không cần mã bí mật.
        ghiDiem(
          scriptUrlRef.current.trim(),
          '',
          done.maCa,
          [taoBaiGhiDiem(kb, done.maCa, done.sbd, done.lanThu ?? 1, done.answers, g, done.giayCau, done.idThietBi ?? layIdThietBi())],
          soCauEmDaChia,
        ).catch(() => {
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
          done.idThietBi ?? layIdThietBi(),
          soCauEmDaChia,
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
    // CHỐT CHỐNG CHỒNG LƯỢT + LỆCH PHA, cùng lý do với đường nộp bài và màn
    // Phòng chờ (xem `src/lib/nhip-gui-lai.ts`).
    //
    // Đây là ĐÁM ĐÔNG THỨ HAI của ca, ngay sau đám đông nộp bài: cả lớp nộp
    // trong vòng vài giây rồi cùng ngồi ở màn "Đã nộp", cùng hỏi máy chủ mỗi
    // ĐÚNG 20 giây cho tới khi thầy công bố. `fetchKetQua` mất 1,3–4,4 giây một
    // lượt; nghẹn quá 20 giây là lượt sau chồng lên lượt trước, y hệt bệnh cũ.
    let dangHoi = false
    const hoi = async () => {
      if (dung || dangHoi || document.hidden) return
      dangHoi = true
      try {
        const r = await fetchKetQua(url, attempt.maCa, attempt.sbd)
        if (dung) return
        setCongBo(r.congBo)
        if (r.sanSang && r.keyBank) apDungKeyBank(r.keyBank, attempt)
        else if (r.congBo === 'ca_lop_xong') setChoCaLop({ daNop: r.daNop, daVao: r.daVao })
      } catch {
        // mất mạng — lần sau hỏi lại
      } finally {
        dangHoi = false
      }
    }
    void hoi()
    const id = setInterval(() => void hoi(), chuKyLechPhaMs(20000))
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

  /** GỬI BÀI LÊN MÁY CHỦ, có chốt chống chồng lượt và nhịp lùi dần.
   *
   * Xem `src/lib/nhip-gui-lai.ts` để biết vì sao — tóm tắt: bản cũ dùng
   * `setInterval` 15 giây trong khi một lượt nộp có hạn 25 giây, nên lượt sau
   * chồng lên lượt trước, cả lớp lại thử lại cùng một khoảnh khắc. Máy chủ càng
   * nghẹn thì càng nhiều lượt hết hạn, càng nhiều lượt hết hạn thì càng nhiều
   * lượt thử lại. Em ngồi nhìn "Đang gửi lên hệ thống…" mãi không tắt. */
  const trySend = async (a: ExamAttempt) => {
    attemptRef.current = a
    // ① CHỐT CHỐNG CHỒNG LƯỢT. Một máy, một lượt nộp tại một thời điểm.
    if (dangGui.current) return
    dangGui.current = true
    setSoLanThuGui((n) => n + 1)
    try {
      if (!scriptUrl.trim()) throw new Error('no-script-url')
      const { keyBank, congBo: cb } = await submitAnswers(scriptUrl.trim(), a.maCa, a.sbd, a.maDe, a.answers, a.integrity, a.lanThu ?? 1, a.idThietBi ?? layIdThietBi(), a.giayCau)
      const done = { ...a, pendingSubmit: false }
      attemptRef.current = done
      setAttempt(done)
      await saveAttempt(done)
      showToast('Đã nộp bài thành công', 'success')
      lanHong.current = 0
      if (retryTimer.current) {
        clearTimeout(retryTimer.current)
        retryTimer.current = null
      }
      setCongBo(cb)
      // Thầy bật "xem điểm ngay" cho ca này — chấm ngay tại máy em bằng đúng
      // engine chấm chuẩn, không phải ước lượng. Chế độ "khi cả lớp nộp xong"
      // thì chưa có keyBank lúc này — effect hỏi lại bên dưới sẽ lo.
      if (keyBank) apDungKeyBank(keyBank, done)
    } catch {
      // Mất mạng — giữ pendingSubmit=true, đã lưu local, sẽ tự thử lại.
      // ② LÙI DẦN CÓ LỆCH PHA, và ③ HẸN MỘT lượt kế chứ không đặt nhịp lặp.
      const cho = choBaoLau(lanHong.current)
      lanHong.current += 1
      if (retryTimer.current) clearTimeout(retryTimer.current)
      retryTimer.current = setTimeout(() => {
        retryTimer.current = null
        const cur = attemptRef.current
        if (cur && cur.pendingSubmit) void trySend(cur)
      }, cho)
    } finally {
      dangGui.current = false
    }
  }

  /** EM TỰ BẤM GỬI LẠI. Không có nút này thì em chỉ còn cách ngồi nhìn — và
   * dòng chữ "đang gửi" không phân biệt được "máy đang chạy" với "máy đã chết". */
  const guiLaiNgay = () => {
    const cur = attemptRef.current ?? attempt
    if (!cur || !cur.pendingSubmit || dangGui.current) return
    if (retryTimer.current) {
      clearTimeout(retryTimer.current)
      retryTimer.current = null
    }
    lanHong.current = 0
    void trySend(cur)
  }

  useEffect(() => {
    if (phase !== 'exam' || !attempt) return
    if (attempt.loai === 'baitap') return // bài tập không tự nộp theo giờ
    if (remaining !== null && remaining <= 0) void doSubmit(attempt, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, phase])

  useEffect(() => {
    return () => {
      if (retryTimer.current) clearTimeout(retryTimer.current)
    }
  }, [])

  /** PHÒNG CHỜ — hỏi máy chủ vài giây một lần xem thầy bấm bắt đầu chưa.
   *
   * Ba giây một nhịp: cả lớp cùng chờ nên đây là lượt gọi đông nhất của ca,
   * nhưng nhanh hơn thì tốn mà không ai thấy khác, chậm hơn thì em ngồi nhìn
   * màn trắng sau khi thầy đã hô bắt đầu.
   *
   * Thầy bấm bắt đầu thì gọi lại chính `handleJoin` — lúc đó máy chủ mới tạo
   * lượt, mới tính giờ, mới gửi đề. Không có đường tắt nào bỏ qua nó. */
  /** VÀO THI SAU KHI THẦY BẤM BẮT ĐẦU — đường riêng, KHÔNG dùng lại đường em
   * tự bấm. Thầy báo 11/09: "bấm duyệt bắt đầu ở phòng chờ, rất chậm và học
   * sinh bị văng ra thử lại nhiều lần".
   *
   * Hai chỗ hỏng, và cả hai đều nằm ở đây chứ không phải ở máy chủ:
   *
   *   ① GIÃN NHẦM CHỖ. `handleJoin` có sẵn cú giãn 0–3 giây, nhưng nó chỉ chạy
   *      LẦN ĐẦU trong phiên. Em vào phòng chờ đã tiêu mất lần ấy rồi, nên đúng
   *      lúc cả lớp ùa vào thì KHÔNG còn giãn nữa — giãn đúng lúc không cần, và
   *      không giãn đúng lúc cần.
   *
   *   ② HỎNG LÀ NÉM EM RA. `handleJoin` hỏng thì `setPhase('error')` kèm câu
   *      "bấm Vào thi lại" — em phải tự chạm, mà cả lớp cùng chạm lại thì lượt
   *      bấm lại nối vào cuối chính hàng đợi đang tắc.
   *
   * VÌ SAO HÀM NÀY ĐỨNG Ở CẤP COMPONENT, KHÔNG NẰM TRONG EFFECT PHÒNG CHỜ:
   * effect ấy phụ thuộc `phase`, mà `handleJoin` đổi `phase` sang 'loading'
   * ngay câu đầu ⇒ effect bị dọn và vòng thử lại chết giữa chừng ngay lần thử
   * thứ nhất. Đặt ở đây thì nó sống qua mọi lần đổi màn. */
  const dangVaoSauBatDauRef = useRef(false)
  const vaoSauBatDau = async () => {
    if (dangVaoSauBatDauRef.current) return
    dangVaoSauBatDauRef.current = true
    try {
      for (let lan = 0; lan < 6; lan++) {
        setLoiCho(lan === 0 ? 'Thầy đã bắt đầu — đang xếp hàng vào phòng thi…' : 'Máy chủ đang đông — máy tự thử lại, em không phải bấm gì.')
        await new Promise((r) => setTimeout(r, lan === 0 ? gianVaoSauBatDau() : choBaoLau(lan - 1)))
        loiVaoThiRef.current = ''
        try {
          await handleJoin()
        } catch {
          // `handleJoin` tự nuốt lỗi rồi chuyển sang màn lỗi, nên nhánh này gần
          // như không chạy. Giữ để một lần ném lọt ra ngoài không giết cả vòng.
        }
        if (phaseRef.current !== 'error') return
        // CHỈ THỬ LẠI LỖI ĐƯỜNG TRUYỀN — xem `laLoiDongNguoi`.
        if (!laLoiDongNguoi(loiVaoThiRef.current)) return
        setPhase('cho')
      }
      setLoiCho('Chưa vào được sau nhiều lần thử. Em bấm Vào thi lại, hoặc báo thầy.')
    } finally {
      dangVaoSauBatDauRef.current = false
    }
  }

  useEffect(() => {
    if (phase !== 'cho') return
    let con = true
    const url = scriptUrl.trim()
    if (!url) return
    // CHỐT CHỐNG CHỒNG LƯỢT. Đo 09/09 trước ca thi đông: `trangThaiPhongCho`
    // mất 2,2–3,3 giây một lượt lúc vắng và 3,6 giây khi 60 máy cùng hỏi — tức
    // LÂU HƠN chính nhịp 3 giây. `setInterval` không đợi lượt trước xong, nên
    // máy em cứ 3 giây lại thả thêm một lượt vào hàng: chờ hai phút là chồng
    // hàng chục lượt trên MỖI máy, rồi nhân với cả lớp. Đây đúng là lúc đông
    // nhất của ca — cả lớp cùng đứng chờ thầy bấm Bắt đầu.
    //
    // Máy chủ KHÔNG phải chỗ yếu: 60 lượt cùng lúc xong hết, 0 hỏng, chậm nhất
    // 4,3 giây. Thứ phải chữa là nhịp gọi của từng máy.
    let dangHoi = false
    const hoi = async () => {
      if (dangHoi || dangVaoSauBatDauRef.current) return
      dangHoi = true
      try {
        const tt = await trangThaiPhongCho(url, maCa.trim())
        if (!con) return
        if (tt.batDau) void vaoSauBatDau()
      } catch (e) {
        // Ca bị thầy huỷ giữa lúc chờ: nói thẳng, đừng để em đứng mãi.
        if (con) setLoiCho(e instanceof Error ? e.message : 'Mất kết nối — em cứ chờ, máy tự hỏi lại.')
      } finally {
        dangHoi = false
      }
    }
    void hoi()
    // LỆCH PHA THEO MILI GIÂY. Cùng lý do đã lệch pha lưu tạm và báo sống: ba
    // mươi máy cùng nhịp là ba mươi lượt gọi dồn vào một khoảnh khắc. Nhịp 3
    // giây làm tròn về giây chỉ ra 3 hoặc 4, vẫn dồn cục — phải rải bằng ms.
    const dong = setInterval(() => {
      // Thấy `batDau` rồi thì THÔI HỎI. Mỗi lượt hỏi thừa lúc này là một lượt
      // tranh chỗ chạy với chính cú `vaoThi` của cả lớp.
      if (dangVaoSauBatDauRef.current) return
      void hoi()
    }, chuKyLechPhaMs(3000))
    return () => {
      con = false
      clearInterval(dong)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, scriptUrl, maCa])

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
  // MÀN XÁC NHẬN TÊN (thầy chốt 07/09). Chỉ có đúng ba thứ: số báo danh em vừa
  // gõ, TÊN của số đó, và hai nút. Không nhồi thêm gì — em đang đứng trước giờ
  // thi, mỗi dòng thừa là một nhịp chậm.
  if (phase === 'join' && !laXemDiem && xacNhan) {
    return (
      <Trang className="flex items-center justify-center px-4 py-8">
        <div className="w-full" style={{ maxWidth: 400 }}>
          <TheNoiDung>
            <div className="text-center" style={{ marginBottom: 'var(--k5)' }}>
              <div className="flex justify-center" style={{ color: 'var(--muc)', marginBottom: 'var(--k3)' }}>
                <LogoDDH size={40} />
              </div>
              <div style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)' }}>Có đúng em không?</div>
            </div>

            <div className="text-center" style={{ background: 'var(--the-2)', borderRadius: 'var(--bo-2)', padding: 'var(--k5) var(--k4)' }}>
              <div style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)' }}>
                Số báo danh <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: 'var(--muc)' }}>{xacNhan.sbd}</span>
              </div>
              {xacNhan.hoTen ? (
                <div className="font-bold" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-5)', color: 'var(--muc)', marginTop: 'var(--k2)', lineHeight: 1.25 }}>
                  {xacNhan.hoTen}
                </div>
              ) : (
                // Danh sách chưa có tên cho số này: KHÔNG bịa tên, nói thẳng.
                <div style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)', color: 'var(--cam)', marginTop: 'var(--k2)' }}>
                  Danh sách lớp chưa ghi tên cho số báo danh này. Báo Thầy trước khi bắt đầu.
                </div>
              )}
              {xacNhan.lop && (
                <div style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)', marginTop: 'var(--k2)' }}>Lớp {xacNhan.lop}</div>
              )}
            </div>

            <div className="flex flex-col" style={{ gap: 'var(--k3)', marginTop: 'var(--k5)' }}>
              <NutChinh onClick={handleJoin}>Bắt đầu</NutChinh>
              <NutChinh
                variant="phu"
                onClick={() => {
                  setXacNhan(null)
                  setSbd('')
                }}
              >
                Nhập lại
              </NutChinh>
            </div>
          </TheNoiDung>
        </div>
      </Trang>
    )
  }

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
                    // ĐI ĐÚNG ĐƯỜNG CỦA NÚT "Vào thi": tra tên rồi hiện màn xác
                    // nhận. Bản cũ gọi thẳng `handleJoin` nên bỏ qua cả bước xác
                    // nhận mà nút có. Điều kiện toàn màn hình đã gỡ khỏi CẢ HAI
                    // đường (xem ô nhắc ngay trên) — gỡ một chỗ mà quên chỗ kia
                    // thì em bấm nút được còn gõ Enter thì không, đúng loại lệch
                    // khó chịu nhất.
                    if (e.key !== 'Enter') return
                    if (laXemDiem || dangTraTen) return
                    void traTenRoiHoi()
                  }}
                />
              </div>
              {/* HỌ TÊN + NĂM SINH: máy chủ đối chiếu với danh sách của thầy.
                  Gõ nhầm một chữ số báo danh sẽ bị chặn ngay ở đây thay vì tạo
                  ra một em lạ trong bảng điểm. Máy nhớ sẵn từ lần trước.

                  CHẾ ĐỘ XEM ĐIỂM KHÔNG HỎI HAI Ô NÀY (thầy chốt 07/09): bài đã
                  nộp rồi, không tạo ra em lạ nào nữa, mà bắt gõ ba ô trên điện
                  thoại thì sai một dấu là tắc. Cổng còn lại: số báo danh phải
                  có trong danh sách lớp và phải có lượt đã nộp của ca. */}
              {/* HAI Ô HỌ TÊN VÀ NĂM SINH ĐÃ GỠ (thầy chốt 07/09).
                  Em chỉ gõ SỐ BÁO DANH; bấm Vào thi thì máy tra tên của chính
                  số đó và hiện lên cho em xác nhận. Gõ nhầm một số là thấy ngay
                  tên người khác — bắt lỗi tốt hơn hẳn cách bắt gõ đủ ba ô, vì
                  gõ ba ô thì lỗi nào cũng chỉ ra một câu "thông tin không
                  đúng". Xem màn xác nhận ngay trên `phase === 'join'`. */}
              {/* TOÀN MÀN HÌNH LÀ KHUYÊN, KHÔNG PHẢI CỬA (đổi 09/09 17:34).
                  Trước đây nút "Vào thi" bị khoá cứng khi chưa toàn màn hình.
                  Trên iPhone mở link từ Zalo thì KHÔNG có đường nào đạt được:
                  không standalone, iOS không cho bật toàn màn hình, và Zalo
                  không có mục "Thêm vào Màn hình chính". Em đứng trước một nút
                  xám với một dòng chỉ dẫn không làm theo được — mất bài thi vì
                  một quy tắc chống gian lận, trong khi gian lận thì không.
                  Nay: vẫn khuyên, vẫn hướng dẫn đúng chỗ em đang đứng, nhưng
                  cho vào. Em vào ngoài toàn màn hình thì máy GHI LẠI để thầy
                  đọc ở Chi tiết ca — không lặng lẽ. */}
              {!laXemDiem && !toanManHinh && (
                <div className="flex flex-col" style={{ gap: 'var(--k2)' }}>
                  <OThongBao tone="cam">
                    Nên để app ở <b>toàn màn hình</b> khi làm bài.{' '}
                    {loiKhuyenToanManHinh(coTheBatToanManHinh(), laTrinhDuyetTrongUngDung(), laIOS())}
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
              {!laXemDiem && (
                <div style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)', lineHeight: 1.6 }}>
                  Bật <b>Không làm phiền</b> trước khi bắt đầu. Cuộc gọi hay thông báo kéo em ra khỏi màn làm bài đều bị tính là rời màn.
                </div>
              )}
              {/* GIỮ ĐỂ ĐỌC (GIUDEDOC mục 6): em biết trước thì không hoảng lúc
                  đề tạm ẩn. Ca không bật cơ chế thì dòng này vô hại. */}
              {!laXemDiem && (
                <div style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)', lineHeight: 1.6 }} data-dan-giu-de>
                  {chuDanTruoc()}
                </div>
              )}
              {laXemDiem ? (
                <>
                  <NutChinh onClick={moLaiTuMayChu}>Xem điểm của em</NutChinh>
                  {/* HAI NÚT dưới ô số báo danh (đặc tả PHAN-CONG-GIAO-BTVN):
                      Xem điểm y như cũ, và Nộp BTVN mở phiếu bài tập của chính
                      em đó. Ca chưa giao bài thì nút báo thẳng, không im lặng. */}
                  <NutNopBtvn maCa={maCa.trim()} sbd={sbd.trim()} />
                </>
              ) : (
                <NutChinh onClick={() => void traTenRoiHoi()} disabled={dangTraTen}>
                  {dangTraTen ? 'Đang tra số báo danh…' : 'Vào thi'}
                </NutChinh>
              )}
            </div>
          </TheNoiDung>
        </div>
      </Trang>
    )
  }

  // MÀN PHÒNG CHỜ (thầy chốt 07/09). Trắng, một dòng chữ, không có gì để bấm.
  // Cố ý trống: em đang ngồi trong phòng thi và thầy sắp hô bắt đầu, mọi thứ
  // hiện ra ở đây đều là thứ kéo mắt em khỏi việc chuẩn bị.
  if (phase === 'cho') {
    return (
      <Trang className="flex items-center justify-center px-4">
        <div className="w-full text-center" style={{ maxWidth: 360 }}>
          <div className="flex justify-center" style={{ color: 'var(--nhat)', marginBottom: 'var(--k5)' }}>
            <LogoDDH size={40} />
          </div>
          <div className="font-bold" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-4)', color: 'var(--muc)' }}>
            Đang chờ Thầy bấm bắt đầu
          </div>
          <div style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)', marginTop: 'var(--k3)', lineHeight: 1.6 }}>
            Em giữ nguyên màn hình này. Đề hiện ra ngay khi Thầy bắt đầu.
            {cho?.thoiGianPhut ? ` Bài làm trong ${cho.thoiGianPhut} phút, đồng hồ chạy từ lúc đó.` : ''}
          </div>
          {loiCho && (
            <div style={{ marginTop: 'var(--k4)' }}>
              <OThongBao tone="do">{loiCho}</OThongBao>
            </div>
          )}
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

  if (phase === 'error' && daNopRoi) {
    return (
      <Trang className="flex items-center justify-center px-4">
        <div className="w-full flex flex-col" style={{ maxWidth: 400, gap: 'var(--k4)' }}>
          <OThongBao tone="cam">
            Em đã nộp bài ca này{daNopRoi.nopLuc ? ` lúc ${gioNgan(daNopRoi.nopLuc)}` : ''}
            {daNopRoi.lanThu > 1 ? ` (lần ${daNopRoi.lanThu})` : ''}. Bài đã chấm xong.
            {'\n\n'}Máy này không giữ bài của em nên không mở lại được điểm ở đây. Điểm, bài chữa và
            nhận xét nằm trong PHIẾU KẾT QUẢ Thầy gửi riêng cho em — mở link phiếu đó.
            {'\n\n'}Chưa nhận được phiếu thì nhắn Thầy gửi lại.
          </OThongBao>
          <NutChinh
            variant="phu"
            onClick={() => {
              setDaNopRoi(null)
              setPhase('join')
            }}
          >
            Quay lại
          </NutChinh>
        </div>
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
  if (phase === 'submitted' && xemBaoCao && phieuCuaEmCoLink) {
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
        <PhieuScreen duCoSan={phieuCuaEmCoLink} laCuaEm xinLink={xinLinkBaiTap} />
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
          <DauPhan phan="I" soCauBaPhan={soCauCuaBaiGiai} />
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
          <DauPhan phan="II" soCauBaPhan={soCauCuaBaiGiai} />
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
                // CÙNG thứ tự xáo với lúc làm bài. Xem lại mà đảo lại thứ tự thì
                // "ý b) em chọn Đúng" đổi nghĩa giữa hai màn — em đọc ra một
                // đằng, bài chấm một nẻo.
                yPerm={item.yPerm}
                selected={attempt.answers.phanII[item.qid] ?? [null, null, null, null]}
                correct={q.correct}
                explanation={q.explanation}
                loiGiai={q.loiGiai}
                nhanLoiGiai={q.loiGiaiTrangThai}
                onZoom={setZoomSrc}
              />
            )
          })}
          <DauPhan phan="III" soCauBaPhan={soCauCuaBaiGiai} />
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
    if (attempt?.integrity.blocked && !xemLai) {
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
                {attempt?.pendingSubmit && (
                  <div className="flex flex-col" style={{ gap: 'var(--k2)' }}>
                    <Nhan tone="cam">{soLanThuGui > 1 ? `Đang gửi — đã thử ${soLanThuGui} lần` : 'Đang gửi lên hệ thống… đừng tắt trình duyệt'}</Nhan>
                    <NutChinh variant="phu" onClick={guiLaiNgay}>
                      Gửi lại ngay
                    </NutChinh>
                  </div>
                )}
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
                /* NÓI THẬT TRẠNG THÁI, VÀ CHO EM MỘT VIỆC ĐỂ LÀM.
                   Bản cũ chỉ có đúng một dòng chữ đứng yên, nên "máy đang thử
                   lại" và "máy đã chết" nhìn y hệt nhau — thầy gọi đó là treo.
                   Nay hiện số lần đã thử và một nút bấm được. */
                <div className="flex flex-col" style={{ gap: 'var(--k2)' }}>
                  <OThongBao tone="cam">
                    Bài của em <b>đã lưu an toàn trên máy</b>, đang gửi lên hệ thống. Đừng tắt trình duyệt.
                    {soLanThuGui > 1 && (
                      <>
                        {' '}
                        Máy đã thử <b style={SANS_SO}>{soLanThuGui}</b> lần, mạng đang chậm — máy vẫn tự thử lại.
                      </>
                    )}
                  </OThongBao>
                  <NutChinh variant="phu" onClick={guiLaiNgay}>
                    Gửi lại ngay
                  </NutChinh>
                </div>
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

          {graded && (!attempt?.integrity.blocked || xemLai) && (
            <NutChinh onClick={() => setGradedPopup(true)}>
              Xem điểm chi tiết
            </NutChinh>
          )}
          {phieuCuaEm && (
            <NutChinh variant="phu" onClick={() => setXemBaoCao(true)}>
              Xem báo cáo học tập
            </NutChinh>
          )}
          {/* NÓI THẲNG khi bộ câu bị cắt vì nặng, thay vì để em tưởng kho chỉ
              có ngần ấy câu. Nguyên nhân gần như luôn là câu có ảnh. */}
          {khacPhucCatBot && (
            <div style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)', lineHeight: 1.6 }}>
              Bộ câu khắc phục lấy được {phieuCuaEm?.baiTap?.length ?? 0} câu. Còn câu nữa trong kho nhưng nhiều ảnh, tải hết một lượt sẽ nặng máy — làm xong bộ này rồi vào lại để lấy tiếp.
            </div>
          )}
          {/* ĐỀ RIÊNG CỦA EM. Mỗi em một bộ câu khác nhau nên tải chung đề của
              ca là sai — phải dựng từ ĐÚNG bộ máy đã gán cho em này. */}
          {solutionAssignment && attempt && (
            <NutChinh variant="phu" onClick={() => void taiDeCuaEm()} disabled={dangTaiDe}>
              {dangTaiDe ? 'Đang dựng đề…' : 'Xem đề & lời giải'}
            </NutChinh>
          )}
          {/* HỎI BÀI THẦY — hiện NGAY sau khi nộp, không chờ công bố điểm
              (giả định mục 10): em vướng lúc vừa làm xong là lúc nhớ rõ nhất. */}
          {cauHoiBai.length > 0 && (
            <NutChinh variant="phu" onClick={() => setMoHoiBai(true)}>
              {daGuiHoi ? `Sửa câu đã hỏi (${daGuiHoi.qids.length})` : 'Hỏi bài Thầy'}
            </NutChinh>
          )}
        </div>

        {moHoiBai && (
          <TamTruotHoiBai
            cau={cauHoiBai}
            daCongBo={Boolean(graded)}
            daHoi={daGuiHoi?.qids ?? []}
            ghiChuCu={daGuiHoi?.ghiChu ?? ''}
            dang={dangGuiHoi}
            loi={loiHoiBai}
            dong={() => setMoHoiBai(false)}
            gui={(q, g) => void guiHoiBai(q, g)}
          />
        )}

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

  // CÂU HỎI LẠI — tra bằng Set để 40 câu không thành 40 lần duyệt mảng.
  const boHoiLai = new Set(attempt.cauLap ?? [])
  const nhanHoiLai = (qid: string) => (boHoiLai.has(qid) ? {} : undefined)

  let stt = 0
  const renderPhan = (phan: PhanKey) => {
    const items = phan === 'I' ? assignment.phanI : phan === 'II' ? assignment.phanII : assignment.phanIII
    if (items.length === 0) return null
    return (
      <>
        <DauPhan phan={phan} soCauBaPhan={soCauCuaBai} />
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
                cauHoiLai={nhanHoiLai(item.qid)}
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
                cauHoiLai={nhanHoiLai(item.qid)}
                text={item.question.text}
                thanCauImg={item.question.thanCauImg}
                table={item.question.table}
                imageDataUrl={item.question.imageDataUrl}
                hinhAnh={item.question.hinhAnh}
                ideas={item.question.ideas}
                ideaImgs={item.question.ideaImgs}
                yPerm={item.yPerm}
                selected={attempt.answers.phanII[item.qid] ?? [null, null, null, null]}
                // `idx` là chỉ số Ý GỐC (TheCau đã quy về), nên đáp án cất đi
                // vẫn theo thứ tự gốc và đường chấm không phải biết gì về xáo.
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
                cauHoiLai={nhanHoiLai(item.qid)}
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

      {/* TẤM PHỦ "GIỮ ĐỂ ĐỌC" — LUÔN trong DOM, ẩn/hiện bằng CSS theo thuộc
          tính `data-giu-de-an` trên <html>. Không state, không render lại danh
          sách câu, không tụt tốc độ cuộn (GIUDEDOC mục 5). */}
      <ManGiuDeDoc />
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
