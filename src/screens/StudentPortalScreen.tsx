import BangNhiemVu from '../components/bang-nhiem-vu/BangNhiemVu'
import { mucMenuHocSinh } from '../components/bang-nhiem-vu/muc-menu'
import { taiKeHoachNgay, useBanNho, useCaDangMo, useKeHoachNgay, useLamMoiKhiDong, useThuThachHomNay } from '../components/bang-nhiem-vu/may-chu'
import { taiThuThachHomNay, DUONG_NOP_THU_THACH, type CauOn, type MucTraLoi } from '../components/bang-nhiem-vu/cau-on-api'
import { dangDeSau, docDeSau, luuDeSau, type ThuThachRieng } from '../lib/thu-thach-rieng'
import { ngayVietNam } from '../lib/han-bai-tap'
import { dungBangNhiemVu, soThuSucCua } from '../lib/nhiem-vu-adapter'
import { tongHopKeHoachTroLy } from '../lib/tro-ly-ca-nhan'
import NhanHanBaiTap from '../components/NhanHanBaiTap'
import { mocThoiGian } from '../lib/han-bai-tap'
import { useGioHocTap } from '../hooks/useGioHocTap'
import ThongBaoHocSinh,{noticeApi} from '../components/ThongBaoHocSinh'
import BangTinPhuHuynh from '../components/BangTinPhuHuynh'
import {MomQuestionStem,MomOption} from '../components/MomQuestionMedia'
import {momApi, momReviewHtml} from '../lib/mom-api'
import PhongVaoThi from '../components/PhongVaoThi'
import LuyenDeChuan from '../components/LuyenDeChuan'
import KhoiKhacPhuc3CheDo from '../components/KhoiKhacPhuc3CheDo'
import {syncStudentExp} from '../game/than-thu-v2/academic-sync'
import { tachDongTheoY } from '../lib/tach-dong-cau'
import NutQuayLai from '../components/NutQuayLai'
import { dungM3, ThanhTren } from '../components/m3'
import LichSuCaM3 from '../components/bang-nhiem-vu/LichSuCaM3'
import { useThiDua } from '../lib/use-thi-dua'
import { useHopThoai } from '../components/HopThoaiCong'
import BtvnM3 from '../components/bang-nhiem-vu/BtvnM3'
import VaoThiForm from '../components/bang-nhiem-vu/VaoThiForm'
import { MomDanhSachM3, MomLamBaiM3, type BaiMomM3 } from '../components/bang-nhiem-vu/MomM3'
import '../components/bang-nhiem-vu/sheet-m3.css'
import { lazy, Suspense, useCallback, useEffect, useMemo, useState, useRef } from 'react'
import {
  Award,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  Lock,
  LogIn,
  RefreshCw,
  Sparkles,
  AlertCircle,
  ArrowRight,
  Clock,
  RotateCcw,
  Heart,
  Timer,
  Check,
  Pause,
  X,
} from 'lucide-react'
import {
  hsDangNhapApi,
  hsDatMatKhauApi,
  hsLichSuCaApi,
  hsBtvnApi,
  hsCauSaiApi,
  hsCauDaThiApi,
  thanThuDocApi,
  thanThuGhiApi,
  voDaiTaoApi, voDaiMoiApi, voDaiLoiMoiApi, voDaiVaoApi,
  voDaiBatDauApi, voDaiXemApi, voDaiNopApi, voDaiDongApi,
} from '../lib/exam-api'
import { loadScriptUrlHoacMacDinh } from '../lib/exam-db'
import KhungXemPhieu from '../components/KhungXemPhieu'
import { tenBaiTapTrenThe, type TheChangView } from '../lib/btvn-ca-nhan-kieu'
import { nhoVaiDaDung } from '../lib/vai-tro'
import { datManifestTheoVai } from '../lib/pwa-install'
import { LogoDoc } from '../components/LogoVai'
// HAI GAME NẠP MUỘN — đo 14/09: mã game nặng ~234 KB nguồn, mà nhập thẳng
// vào đây là nó rơi vào MẢNH MÃ CHÍNH (755 KB), thứ MỌI người tải, kể cả phụ
// huynh chỉ mở một trang báo cáo trên điện thoại. Em nào mở tab game mới tải,
// và service worker cất lại ngay nên lần sau tức thì.
const ThanThuHoaHocGame = lazy(() => import('../game/than-thu-v2/Game'))
/** = KHOA_MAN_DAU của Game.tsx (test khoá khớp). KHÔNG import hằng ấy từ Game.tsx: sẽ kéo cả game vào gói chính, mất nạp lười. */
const KHOA_MAN_DAU_GAME = 'game-v2:man-dau'
import BaoCaoCaThiHocSinhModal from '../components/BaoCaoCaThiHocSinhModal'
import DongDemCau, { docSoDem } from '../components/DongDemCau'
import { goiBaiThi } from '../lib/goi-bao-cao'
import ModalKhacPhucCauSai from '../components/ModalKhacPhucCauSai'
import type { CauSaiDauVao } from '../lib/thuat-toan-rut-cau-sai'
import type { TuCongHocSinh } from './ExamTakeScreen'

// Màn làm bài nạp trễ: cổng học sinh không phải kéo theo bộ chấm khi chỉ xem điểm.
const ManLamBai = lazy(() => import('./ExamTakeScreen'))
const LamCauOn = lazy(() => import('../components/bang-nhiem-vu/LamCauOn'))
const TheCuoiChang = lazy(() => import('../components/bang-nhiem-vu/TheCuoiChang'))
import { chuanHoaLoiGiaiCau } from '../lib/chuan-hoa-loi-giai'
import { baoDaXemHocSinh } from '../lib/canh-bao-thay-may-chu'
import { gioDayDu } from '../lib/ngay-gio-24'
import { useToanManHinhGame } from '../components/useToanManHinhGame'
import { ketThucLuotToanManHinh, xinToanManHinh } from '../lib/toan-man-hinh-game'
import ONhapDapSo from '../components/ONhapDapSo'
import { batNhipBenVung } from '../lib/nhip-ben-vung'
import { CHU_DA_LUU_MAY, SU_KIEN_HANG_DOI_XONG, TOI_DA_LAN_THU, khoaChang } from '../lib/hang-doi-nop'
import { useHangDoiNop } from '../lib/use-hang-doi-nop'

const KHOA_LUU_AUTH = 'omr_student_portal_auth'

export interface BaiMomGiao {
  id: string
  tieuDe: string
  ngayGiao: string
  taoLuc?: string
  soCau: number
  thoiGianPhut: number
  dsCau: any[]
  cau?: any[]
  trangThai: 'chua_lam' | 'dang_lam' | 'da_nop'
  batDauLuc?: string
  nopLuc?: string
  diem?: number
  soCauDung?: number
  dapAnDaNop?: Record<string,string>
  htmlKetQua?: string
  htmlBaoCao?: string
}

export function chuanHoaBaiMom(b: any): BaiMomGiao {
  const rawCau = Array.isArray(b?.dsCau) ? b.dsCau : (Array.isArray(b?.cau) ? b.cau : [])
  const dsCau = rawCau.map((c: any, i: number) => ({
    ...c,
    phan: c?.phan || (/^[DS]{4}$/i.test(String(c?.dapAn || c?.dapAnDung)) ? 'II' : undefined),
    id: String(c?.id || `cau_${i + 1}`),
    text: String(c?.text || c?.noiDung || 'Câu hỏi'),
    choices: Array.isArray(c?.choices)
      ? c.choices.map(String)
      : (Array.isArray(c?.luaChon) ? c.luaChon.map(String) : (Array.isArray(c?.ideas) ? c.ideas.map(String) : [])),
    dapAn: String(c?.dapAn || c?.dapAnDung || 'A'),
    dapAnDung: String(c?.dapAnDung || c?.dapAn || 'A'),
    loiGiai: c?.loiGiai != null && String(c.loiGiai) !== '[object Object]' ? c.loiGiai : '',
    chuyenDe: String(c?.chuyenDe || 'Hoá học'),
  }))

  const id = String(b?.id || `mom_${Date.now()}`)
  const tieuDe = String(b?.tieuDe || `Bài gia đình giao (${dsCau.length} câu)`)
  const ngayGiao = String(b?.ngayGiao || b?.taoLuc || new Date().toISOString())
  const taoLuc = String(b?.taoLuc || b?.ngayGiao || new Date().toISOString())
  const soCau = Number(b?.soCau) || dsCau.length
  const thoiGianPhut = Number(b?.thoiGianPhut) || 120
  const trangThai = b?.trangThai || 'chua_lam'
  const htmlKetQua = b?.htmlKetQua || b?.htmlBaoCao || ''

  return {
    dapAnDaNop: b?.dapAnDaNop,
    ...b,
    id,
    tieuDe,
    ngayGiao,
    taoLuc,
    soCau,
    thoiGianPhut,
    dsCau,
    cau: dsCau,
    trangThai,
    htmlKetQua,
    htmlBaoCao: htmlKetQua,
  }
}

interface ThongTinHs {
  sbd: string
  hoTen: string
  lop: string
  namSinh: string
  token?: string
}

function dinhDangNgayGio(iso: string): string {
  if (!iso) return ''
  return gioDayDu(iso, iso) // "HH:mm · Thứ Năm 24/09/2026" (luật 6 CHUAN-TU-NGU); mốc hỏng ⇒ trả nguyên chuỗi
}

function mauDiem(diem: number | null): string {
  if (diem === null || diem === undefined) return 'text-slate-500 bg-slate-100 dark:bg-slate-800'
  if (diem >= 8.0) return 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950/40 dark:border-emerald-800'
  if (diem >= 6.5) return 'text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950/40 dark:border-blue-800'
  if (diem >= 5.0) return 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/40 dark:border-amber-800'
  return 'text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-950/40 dark:border-rose-800'
}

type TabType = 'diem' | 'btvn' | 'mom' | 'khacphuc' | 'vaothi' | 'thanthu' | 'bantin' | 'cauon'

/** Chỗ giữ màn trong lúc mảnh mã game đang về. Cao bằng vùng game để không
 * giật layout, và nói rõ đang chờ chứ không để em nhìn khoảng trắng. */
function ChoNapGame() {
  return (
    <div
      className="flex items-center justify-center"
      style={{ minHeight: '60vh', fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)', color: 'var(--nhat)' }}
    >
      Đang mở game…
    </div>
  )
}

export default function StudentPortalScreen() {
  const nowHocTap = useGioHocTap()
  // Hộp thoại riêng thay `confirm`/`alert` của trình duyệt (bảng từ ngữ H38): nói việc sẽ làm bằng động từ, không "OK / Hủy".
  const { hoi, bao, hop } = useHopThoai()
  const hoiRoiBaiMom = () => { void hoi({ tieuDe: 'Rời bài đang làm?', noiDung: 'Em quay về danh sách bài. Đồng hồ 2 tiếng vẫn tiếp tục đếm ngược.', nutDongY: 'Rời bài', nutHuy: 'Làm tiếp' }).then((dongY) => { if (dongY) setDangLamMom(null) }) }
  const [auth, setAuth] = useState<ThongTinHs | null>(() => {
    try {
      const luu = localStorage.getItem(KHOA_LUU_AUTH)
      return luu ? JSON.parse(luu) : null
    } catch {
      return null
    }
  })

  useEffect(()=>{
    if(!auth?.sbd||!auth.token)return
    // Nhịp nền CHẬM + lệch ngẫu nhiên + lùi dần khi lỗi (sự cố D1 21/09 ~20:30: 30 giây × mọi máy em ≈ 38 nghìn lượt/giờ). Quay lại tab / có mạng vẫn cập nhật nhưng chặn dội ≥ 20 giây.
    const nhip=batNhipBenVung(()=>syncStudentExp(auth.sbd,auth.token!))
    const kich=()=>nhip.kich()
    window.addEventListener('focus',kich);window.addEventListener('online',kich);document.addEventListener('visibilitychange',kich)
    return()=>{nhip.dung();window.removeEventListener('focus',kich);window.removeEventListener('online',kich);document.removeEventListener('visibilitychange',kich)}
  },[auth?.sbd,auth?.token])

  // Đăng nhập state
  const [sbdInput, setSbdInput] = useState('')
  const [matKhauInput, setMatKhauInput] = useState('')
  const [hienMatKhau, setHienMatKhau] = useState(false)
  const [dangXuLyDangNhap, setDangXuLyDangNhap] = useState(false)
  const [loiDangNhap, setLoiDangNhap] = useState('')

  // Đặt mật khẩu lần đầu
  const [chuaCoMatKhau, setChuaCoMatKhau] = useState(false)
  const [matKhauMoi, setMatKhauMoi] = useState('')
  const [xacNhanMatKhau, setXacNhanMatKhau] = useState('')
  const [dangDatMatKhau, setDangDatMatKhau] = useState(false)
  const [loiDatMatKhau, setLoiDatMatKhau] = useState('')

  // Tab
  const [tab, setTab] = useState<TabType | null>(null)
  // GAME TỰ VÀO TOÀN MÀN HÌNH (thầy lệnh 21/09): mọi cửa vào game gọi `moGame()` để xin toàn màn hình NGAY TRONG cú chạm; vào thẳng bằng link/tải lại thì
  // hook xin ở lần chạm đầu tiên; rời game ⇒ thoát. Không nút bật/thoát. Xem lib/toan-man-hinh-game.ts.
  const moGame = () => {
    xinToanManHinh('cu-cham-vao')
    setTab('thanthu')
  }
  useToanManHinhGame(tab === 'thanthu')
  const [cheDoKhacPhuc, setCheDoKhacPhuc] = useState<1 | 2 | 3 | 4>(1)

  // Dữ liệu ca thi & điểm
  const [dsLichSu, setDsLichSu] = useState<any[]>([])
  const [dangTaiLichSu, setDangTaiLichSu] = useState(false)

  // Dữ liệu BTVN
  const [dsBtvn, setDsBtvn] = useState<any[]>([])
  const [dangTaiBtvn, setDangTaiBtvn] = useState(false)
  const [dangMoBai, setDangMoBai] = useState<string | null>(null)

  // Khắc phục câu sai
  const [phieuHtml, setPhieuHtml] = useState('')
  /** BTVN "nâng đỡ": thẻ "hôm nay em tiến thêm gì" hiện sau khi em xong hẳn MỘT chặng (nội dung do `theChangView` quyết). */
  const [theChang, setTheChang] = useState<TheChangView | null>(null)
  /** Mã ca của phiếu BTVN đang mở — cần để tải lại bài sau khi nộp chặng. */
  const maCaPhieuRef = useRef('')
  /** Mã bài (maBtvn) của lần nộp chặng gần nhất từ phiếu đang mở — để hàng đợi nộp lại biết có nên vẽ lại đúng phiếu ấy khi nộp được. */
  const maBtvnPhieuRef = useRef('')
  const phieuMoRef = useRef(false)
  /** Tăng 1 khi hàng đợi nộp lại vừa nộp xong một việc ôn câu ⇒ hỏi lại kế hoạch ngày (cộng với lần "vừa đóng màn con"). */
  const [lamMoiHang, setLamMoiKeHoach] = useState(0)
  /** HTML đề + lời giải của em, dựng TẠI MÁY. Rỗng = không mở lớp phủ.
   *
   * Bản trước mở `/t/<mã ca>` trong khung. Cách ấy phụ thuộc việc máy chủ trả
   * đúng index.html cho một đường dẫn không có tệp thật — và đó là chỗ vỡ:
   * Cloudflare Pages trả 404, máy đã cài service worker thiếu đường lui thì ra
   * thẳng trang lỗi. Em bấm nút là thấy "không vào được". */
  const [xemDeHtml, setXemDeHtml] = useState('')
  /** Màn làm bài mở ngay trong cổng học sinh, không rời trang. */
  const [manThi, setManThi] = useState(false)
  /** Danh tính đã xác thực + mã ca, trao thẳng cho màn làm bài. */
  const [boVaoThi, setBoVaoThi] = useState<TuCongHocSinh | null>(null)
  const [dangMoDe, setDangMoDe] = useState(false)

  const moDeVaLoiGiai = async (maCa: string) => {
    if (!auth) return
    setDangMoDe(true)
    try {
      const { deVaLoiGiaiCuaEm } = await import('../lib/de-loi-giai-cua-em')
      const { loadScriptUrlHoacMacDinh } = await import('../lib/exam-db')
      const url = await loadScriptUrlHoacMacDinh().catch(() => '')
      const kq = await deVaLoiGiaiCuaEm(url, maCa, auth.sbd, auth.hoTen || '')
      if (kq.html) setXemDeHtml(kq.html)
      else void bao(kq.loi || 'Không mở được đề của em', 'Chưa mở được đề')
    } catch (e) {
      void bao(e instanceof Error ? e.message : 'Không mở được đề của em', 'Chưa mở được đề')
    } finally {
      setDangMoDe(false)
    }
  }
  const [dsCauSaiKhacPhucModal, setDsCauSaiKhacPhucModal] = useState<CauSaiDauVao[] | null>(null)
  const [tieuDeKhacPhucModal, setTieuDeKhacPhucModal] = useState('')
  const [cheDoKhacPhucMacDinh, setCheDoKhacPhucMacDinh] = useState<1 | 4>(1)
  const [caXemBaoCaoModal, setCaXemBaoCaoModal] = useState<any | null>(null)
  const [scriptUrl, setScriptUrl] = useState('')

  // Vào thi
  const [maCaVaoThi, setMaCaVaoThi] = useState('')
  const [matKhauCaVaoThi, setMatKhauCaVaoThi] = useState('')
  const [loiVaoThi, setLoiVaoThi] = useState('')

  // Bài của Mom giao (Đồng hồ đếm ngược 2 tiếng)
  const [dsMomGiao, setDsMomGiao] = useState<BaiMomGiao[]>([])
  const [dangLamMom, setDangLamMom] = useState<BaiMomGiao | null>(null)
  // Việc ÔN CÂU (on_lai) đang làm trong sheet 'cauon': đúng các qid máy chủ chọn, nộp về /hs/on-lai/nop.
  const [cauOn, setCauOn] = useState<{ viecId: string; qid: string[]; tieuDe: string; cauSan?: CauOn[]; duongNop?: string } | null>(null)
  const [giayConLaiMom, setGiayConLaiMom] = useState<number>(7200)
  const [cauTraLoiMom, setCauTraLoiMom] = useState<Record<string, string>>({})
  const [thongBaoNopMom, setThongBaoNopMom] = useState<string | null>(null)

  const answersMomRef = useRef(cauTraLoiMom)
  answersMomRef.current = cauTraLoiMom
  const submittingMom = useRef(false)
  const retryMomAt = useRef(0)
  const [loiMom, setLoiMom] = useState('')
  const [daTaiMom, setDaTaiMom] = useState(false)
  // Bảng nhiệm vụ vẽ skeleton tới khi lượt nạp đầu (điểm + BTVN) xong, kể cả khi lỗi.
  const [daNapLanDau, setDaNapLanDau] = useState(false)
  const napDsMom = useCallback(async () => {
    if (!auth) return
    try {
      const data = await momApi('list', {token:auth.token})
      let legacy: BaiMomGiao[] = []
      try { legacy = JSON.parse(localStorage.getItem(`omr_mom_btvn_${auth.sbd}`) || '[]').filter((b: BaiMomGiao) => b.trangThai === 'da_nop' && !data.items.some((n: BaiMomGiao) => n.id === b.id)) } catch {}
      setDsMomGiao([...data.items, ...legacy].map(chuanHoaBaiMom))
      setDaTaiMom(true)
      setLoiMom('')
      return true
    } catch (e) { setLoiMom(e instanceof Error ? e.message : 'Chưa tải được bài. Em thử lại.'); return false }
  }, [auth])

  useEffect(() => {
    // Danh sách bài Mẹ giao: nhịp nền CHẬM (180 s ± 30 s, không gọi chồng, lỗi ⇒ lùi 30 → 60 → 120 s); đổi tab / quay lại / có mạng vẫn nạp nhưng chặn dội ≥ 20 giây (sự cố D1 21/09: vòng 15 giây × mọi máy em).
    const nhip = batNhipBenVung(napDsMom)
    const kich = () => nhip.kich()
    window.addEventListener('focus', kich)
    window.addEventListener('online', kich)
    document.addEventListener('visibilitychange', kich)
    return () => { nhip.dung(); window.removeEventListener('focus', kich); window.removeEventListener('online', kich); document.removeEventListener('visibilitychange', kich) }
  }, [napDsMom])
  useEffect(() => {
    if (!dangLamMom || !auth) return
    try { localStorage.setItem(`omr_mom_draft_${auth.sbd}_${dangLamMom.id}`, JSON.stringify(cauTraLoiMom)) } catch {}
    const timer = setTimeout(() => {
      void momApi('save', {token:auth.token,id:dangLamMom.id,answers:cauTraLoiMom}).catch(e => setLoiMom(`Chưa lưu được đáp án lên máy chủ: ${e.message}`))
    }, 600)
    return () => clearTimeout(timer)
  }, [cauTraLoiMom, dangLamMom, auth])

  useEffect(() => {
    nhoVaiDaDung('hs')
    try {
      datManifestTheoVai('hs')
      document.title = 'ĐĐH Học Sinh'
      const meta = document.querySelector('meta[name="apple-mobile-web-app-title"]')
      if (meta) meta.setAttribute('content', 'ĐĐH Học Sinh')
    } catch {
      // ignore
    }
  }, [])

  // Đếm ngược 2 tiếng (7200 giây) kể từ khi bấm vào làm bài
  useEffect(() => {
    if (!dangLamMom || dangLamMom.trangThai === 'da_nop') return

    const capNhatDongHo = () => {
      if (!dangLamMom.batDauLuc) return
      const daTroiQua = Math.floor((Date.now() - new Date(dangLamMom.batDauLuc).getTime()) / 1000)
      const conLai = Math.max(0, 7200 - daTroiQua)
      setGiayConLaiMom(conLai)
      if (conLai === 0 && Date.now() >= retryMomAt.current) {
        void nopBaiCuaMom()
      }
    }

    capNhatDongHo()
    const timer = setInterval(capNhatDongHo, 1000)
    return () => clearInterval(timer)
  }, [dangLamMom])

  const dinhDangThoiGianMom = (tongGiay: number): string => {
    const gio = Math.floor(tongGiay / 3600)
    const phut = Math.floor((tongGiay % 3600) / 60)
    const giay = tongGiay % 60
    return `${String(gio).padStart(2, '0')}:${String(phut).padStart(2, '0')}:${String(giay).padStart(2, '0')}`
  }

  const batDauLamBaiMom = async (bai: BaiMomGiao) => {
    if (!auth) return
    setTab('mom')
    try {
      const data = await momApi('start', {token:auth.token,id:bai.id})
      const capNhat = chuanHoaBaiMom(data.item)
      let answers: Record<string, string> = {}
      try {
        const raw = localStorage.getItem(`omr_mom_draft_${auth.sbd}_${bai.id}`) || localStorage.getItem(`omr_mom_draft_${bai.id}_${auth.sbd}`)
        if (raw) {
          const parsed = JSON.parse(raw)
          answers = { ...answers, ...(parsed.cauTraLoi || parsed) }
        }
      } catch {}
      setCauTraLoiMom(answers)
      if (capNhat.trangThai === 'da_nop') {
        await napDsMom()
        try {
          const rev = await momApi('review', { token: auth.token, id: bai.id })
          if (rev?.item) setPhieuHtml(momReviewHtml(chuanHoaBaiMom(rev.item)))
          else setLoiMom('Chưa tải được kết quả. Em thử lại.')
        } catch (e) { setLoiMom(e instanceof Error ? e.message : 'Chưa tải được kết quả. Em thử lại.') }
        return
      }
      setDangLamMom(capNhat)
      setThongBaoNopMom(null)
      setLoiMom('')
    } catch (e) { setLoiMom(e instanceof Error ? e.message : 'Chưa mở được bài. Em thử lại.') }
  }

  async function nopBaiCuaMom() {
    if (!dangLamMom || !auth || submittingMom.current) return
    submittingMom.current = true
    retryMomAt.current = Date.now() + 15000
    const cauTraLoiMom = answersMomRef.current
    try {
    const dsCau = Array.isArray(dangLamMom.dsCau) && dangLamMom.dsCau.length > 0
      ? dangLamMom.dsCau
      : (Array.isArray(dangLamMom.cau) ? dangLamMom.cau : [])
    let soDung = 0
    const tongSo = dsCau.length || 1
    const chiTietKq: any[] = []

    for (let i = 0; i < dsCau.length; i++) {
      const cau = dsCau[i]
      const dapAnEm = (cauTraLoiMom[cau.id] || '').trim().toUpperCase()
      const dapAnDung = (cau.dapAn || cau.dapAnDung || 'A').trim().toUpperCase()
      const laDung = dapAnEm === dapAnDung
      if (laDung) soDung++

      const rawChoices = cau.choices && cau.choices.length > 0
        ? cau.choices
        : (cau.ideas && cau.ideas.length > 0 ? cau.ideas : [])
      const luaChon = rawChoices.map((x: unknown) => String(x ?? ''))

      const lgChuan = chuanHoaLoiGiaiCau(cau.loiGiai, cau.phan || 'I', dapAnDung)

      chiTietKq.push({
        stt: i + 1,
        text: cau.text,
        choices: luaChon,
        dapAnEm,
        dapAnDung,
        dungSai: laDung,
        chot: lgChuan.chot,
        lyDo: lgChuan.lyDo,
        buoc: lgChuan.buoc,
        chuyenDe: cau.chuyenDe || 'Chuyên đề ôn tập',
      })
    }

    const diem = Number(((soDung / tongSo) * 10).toFixed(2))

    const htmlKetQua = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Báo Cáo Bài Gia Đình Giao</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: rgb(248, 250, 252);
      padding: 16px;
      color: rgb(30, 41, 59);
    }
  </style>
</head>
<body>
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Google Sans', 'Segoe UI', Roboto, sans-serif; max-width: 820px; margin: 0 auto; padding: 28px; color: var(--muc, rgb(30, 41, 59)); background: var(--the, rgb(255, 255, 255)); border-radius: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
        <div style="height: 6px; width: 100%; border-radius: 9999px; overflow: hidden; display: flex; margin-bottom: 24px;">
          <div style="flex: 1; background: rgb(26, 115, 232);"></div>
          <div style="flex: 1; background: rgb(234, 67, 53);"></div>
          <div style="flex: 1; background: rgb(251, 188, 4);"></div>
          <div style="flex: 1; background: rgb(52, 168, 83);"></div>
        </div>

        <div style="text-align: center; border-bottom: 2px solid var(--vien, rgb(226, 232, 240)); padding-bottom: 24px; margin-bottom: 28px;">
          <div style="font-size: 24px; font-weight: 900; color: rgb(234, 67, 53); margin-bottom: 6px; letter-spacing: -0.01em;">💖 KẾT QUẢ BÀI GIA ĐÌNH GIAO</div>
          <div style="font-size: 14.5px; color: var(--nhat, rgb(100, 116, 139));">Học sinh: <strong>${auth.hoTen}</strong> (SBD: <strong>${auth.sbd}</strong>) ${auth.lop ? `· Lớp: ${auth.lop}` : ''}</div>
          <div style="font-size: 13px; color: var(--chim, rgb(148, 163, 184)); margin-top: 4px;">Thời gian nộp: ${new Date().toLocaleString('vi-VN')}</div>
          <div style="display: inline-block; margin-top: 18px; padding: 12px 32px; background: rgba(234, 67, 53, 0.08); border: 2px solid rgba(234, 67, 53, 0.25); border-radius: 9999px;">
            <span style="font-size: 16px; font-weight: 700; color: rgb(197, 34, 31);">Điểm số: </span>
            <span style="font-size: 32px; font-weight: 900; color: rgb(234, 67, 53);">${diem}</span>
            <span style="font-size: 15px; font-weight: 600; color: rgb(197, 34, 31);"> / 10 (${soDung}/${tongSo} câu đúng)</span>
          </div>
        </div>

        <div style="font-size: 16px; font-weight: 800; margin-bottom: 18px; color: var(--muc, rgb(15, 23, 42)); letter-spacing: 0.02em;">LỜI GIẢI CHI TIẾT TỪNG CÂU THEO CHUẨN HOÁ HỌC:</div>
        ${chiTietKq
          .map(
            (c) => `
          <div style="margin-bottom: 24px; padding: 20px; border-radius: 20px; border: 1px solid ${c.dungSai ? 'rgba(52, 168, 83, 0.35)' : 'rgba(234, 67, 53, 0.35)'}; background: ${c.dungSai ? 'rgba(52, 168, 83, 0.04)' : 'rgba(234, 67, 53, 0.04)'}; box-shadow: 0 1px 3px rgba(60,64,67,0.06);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <span style="font-weight: 800; font-size: 15px; color: var(--muc, rgb(30, 41, 59));">Câu ${c.stt}: ${c.chuyenDe}</span>
              <span style="font-size: 12px; font-weight: 800; padding: 4px 12px; border-radius: 9999px; background: ${c.dungSai ? 'rgb(52, 168, 83)' : 'rgb(234, 67, 53)'}; color: rgb(255, 255, 255);">
                ${c.dungSai ? '✓ ĐÚNG' : '✗ SAI'}
              </span>
            </div>
            <div style="font-size: 15px; line-height: 1.65; margin-bottom: 14px; color: var(--muc, rgb(51, 65, 85)); font-weight: 500; white-space: pre-line;">${tachDongTheoY(c.text)}</div>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; font-size: 14.5px; margin-bottom: 16px;">
              ${c.choices
                .map(
                  (ch: string, idx: number) => {
                    const kyTu = String.fromCharCode(65 + idx)
                    const laDung = kyTu === c.dapAnDung
                    const laChon = kyTu === c.dapAnEm
                    let bg = 'rgb(255, 255, 255)'
                    let border = 'rgb(226, 232, 240)'
                    let color = 'rgb(51, 65, 85)'
                    let badgeBg = 'rgb(241, 245, 249)'
                    let badgeColor = 'rgb(71, 85, 105)'
                    let fw = '500'
                    if (laDung) {
                      bg = 'rgb(240, 253, 244)'
                      border = 'rgb(167, 243, 208)'
                      color = 'rgb(22, 101, 52)'
                      badgeBg = 'rgb(220, 252, 231)'
                      badgeColor = 'rgb(22, 101, 52)'
                      fw = '700'
                    } else if (laChon) {
                      bg = 'rgb(254, 242, 242)'
                      border = 'rgb(254, 202, 202)'
                      color = 'rgb(153, 27, 27)'
                      badgeBg = 'rgb(254, 226, 226)'
                      badgeColor = 'rgb(153, 27, 27)'
                      fw = '700'
                    }
                    return `<div style="padding: 10px 16px; border-radius: 16px; border: 1.5px solid ${border}; background: ${bg}; color: ${color}; font-weight: ${fw}; display: flex; align-items: center; gap: 12px;"><span style="width: 28px; height: 28px; border-radius: 50%; background: ${badgeBg}; color: ${badgeColor}; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 13px; flex-shrink: 0;">${kyTu}</span><span style="flex: 1; min-width: 0;">${ch}</span></div>`
                  }
                )
                .join('')}
            </div>

            <!-- HỘP LỜI GIẢI ĐÚNG CHUẨN ẢNH 4 (MÀU KEM / HỔ PHÁCH) -->
            <div style="padding: 22px 24px; background: rgb(255, 253, 245); border: 1.5px solid rgb(253, 230, 138); border-radius: 20px; box-shadow: 0 4px 14px rgba(217,119,6,0.06);">
              <div style="font-size: 16px; color: rgb(120, 53, 15); font-weight: 700; margin-bottom: 12px;">
                Đáp án: <b style="font-size: 18px; font-weight: 900; color: rgb(120, 53, 15); letter-spacing: 0.04em;">${c.dapAnDung}</b>
              </div>
              ${c.chot ? `
                <div style="font-size: 11.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: rgb(146, 64, 14); margin-top: 10px; margin-bottom: 6px;">
                  KIẾN THỨC CỐT LÕI
                </div>
                <div style="font-size: 15px; font-weight: 800; line-height: 1.65; color: rgb(59, 29, 5); margin-bottom: 14px;">
                  ${c.chot}
                </div>
              ` : ''}
              ${c.lyDo && c.lyDo.length > 0 ? `
                <div style="font-size: 11.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: rgb(146, 64, 14); margin-top: 10px; margin-bottom: 8px;">
                  VÌ SAO CHỌN / KHÔNG CHỌN TỪNG PHƯƠNG ÁN
                </div>
                <div style="font-size: 14px; line-height: 1.65; color: rgb(120, 53, 15);">
                  ${c.lyDo.map((l: any) => `
                    <div style="padding: 6px 0; border-top: 1px dashed rgba(146, 64, 14, 0.18);">
                      <strong style="color: rgb(120, 53, 15);">${l.khoa}.</strong>
                      <span style="font-weight: 800; color: ${l.dung ? 'rgb(22, 163, 74)' : 'rgb(220, 38, 38)'}; margin: 0 4px;">
                        ${l.dung ? '✓' : '✗'}
                      </span>
                      <span>${l.ly}</span>
                    </div>
                  `).join('')}
                </div>
              ` : ''}
              ${c.buoc && c.buoc.length > 0 ? `
                <div style="font-size: 11.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: rgb(146, 64, 14); margin-top: 14px; margin-bottom: 6px;">
                  LÀM TỪNG BƯỚC
                </div>
                <div style="font-size: 14px; line-height: 1.65; color: rgb(120, 53, 15);">
                  ${c.buoc.map((b: string, bIdx: number) => `<div style="margin-bottom: 4px;">${bIdx + 1}. ${b}</div>`).join('')}
                </div>
              ` : ''}
            </div>
          </div>
        `
          )
          .join('')}
      </div>
</body>
</html>
    `

    const baiDaNop: BaiMomGiao = {
      ...dangLamMom,
      trangThai: 'da_nop',
      nopLuc: new Date().toISOString(),
      diem,
      soCauDung: soDung,
      dapAnDaNop: {...cauTraLoiMom},
      htmlKetQua,
    }

    const saved = await momApi('submit', {token:auth.token,id:dangLamMom.id,answers:cauTraLoiMom})
    const confirmed = {...baiDaNop, ...saved.item, htmlKetQua}
    const danhSachMoi = dsMomGiao.map((b) => (b.id === dangLamMom.id ? confirmed : b))
    try { localStorage.setItem(`omr_mom_btvn_${auth.sbd}`, JSON.stringify(danhSachMoi)) } catch {}
    setDsMomGiao(danhSachMoi)
    if(auth.token)void syncStudentExp(auth.sbd,auth.token)
    setDangLamMom(null)
    setThongBaoNopMom(`Đã nộp bài thành công. Điểm: ${saved.item.diem}/10. Phụ huynh đã có thể xem kết quả trên app.`)
    setLoiMom('')
    } catch (e) { setLoiMom(`Chưa nộp được bài. Đáp án vẫn được giữ trên máy, em bấm nộp lại khi có mạng. ${e instanceof Error ? e.message : ''}`) }
    finally { submittingMom.current = false }
  }

  // Ghi nhớ vai hs
  useEffect(() => {
    nhoVaiDaDung('hs')
    loadScriptUrlHoacMacDinh().then(setScriptUrl).catch(() => {})
  }, [])

  const napLaiBtvn = useCallback(async () => {
    if (!auth) return
    const url = await loadScriptUrlHoacMacDinh().catch(() => '')
    setDangTaiBtvn(true)
    try {
      const resBt = await hsBtvnApi(url, auth.sbd)
      if (resBt.ok && resBt.items) {
        setDsBtvn(resBt.items)
      }
    } finally {
      setDangTaiBtvn(false)
    }
  }, [auth])

  // HÀNG ĐỢI NỘP LẠI TỰ ĐỘNG (Boss 21/09, sau sự cố D1): máy chủ bận lúc em nộp một chặng ⇒ bài giữ ở máy, app tự nộp lại có lùi dần (`hang-doi-nop.ts`); máy chủ idempotent
  // (khoá đáp án đầu) nên nộp lại không nhân đôi. Nộp được: đang mở đúng phiếu ấy thì vẽ lại phiếu có kết quả, không thì nạp lại danh sách bài.
  phieuMoRef.current = !!phieuHtml
  const hangNop = useHangDoiNop(auth?.sbd, async (m) => {
    // CHỈ nộp việc của ĐÚNG em đang đăng nhập (máy dùng chung: em trước đăng xuất, em sau đăng nhập ⇒ việc của em trước NGỦ trong kho tới khi chính em ấy đăng nhập lại;
    // token không lưu trong hàng, mỗi lượt lấy token của em đang đăng nhập rồi mới gửi).
    if (!auth || m.sbd !== auth.sbd) return 'ban'
    // Việc ôn câu bị từ chối hẳn / hết lần thử: màn ôn đang mở nhận qua sự kiện (`daNhan`); màn đã đóng thì báo bằng hộp thoại — em luôn biết bài chưa vào.
    const baoOnCau = (error: string) => {
      const chiTiet = { id: m.id, phanHoi: { ok: false, error }, daNhan: false }
      window.dispatchEvent(new CustomEvent(SU_KIEN_HANG_DOI_XONG, { detail: chiTiet }))
      if (!chiTiet.daNhan) void bao(`${error} Bài của em vẫn ở máy — em mở lại bài ôn rồi nộp nhé.`, 'Chưa nộp được bài ôn')
    }
    if (m.lanThu >= TOI_DA_LAN_THU) {
      if (m.loai === 'on_cau') baoOnCau('Chưa nộp được sau nhiều lần thử.')
      else void bao('Chưa nộp được chặng sau nhiều lần thử. Bài của em vẫn ở máy — em mở lại bài rồi bấm nộp nhé.', 'Chưa nộp được chặng')
      return 'bo'
    }
    if (m.loai === 'on_cau') {
      // Ôn câu / thử thách riêng: máy chủ khoá sổ (kênh, ngày, sbd, qid) đầu thắng ⇒ nộp lại an toàn. Nộp được: màn ôn đang mở nhận kết quả qua sự kiện; hỏi lại kế hoạch ngày.
      const g = m.goi as { traLoi?: MucTraLoi[]; duong?: string }
      if (!auth?.token || !Array.isArray(g.traLoi) || g.traLoi.length === 0) return 'bo'
      const { nopOnLai } = await import('../components/bang-nhiem-vu/cau-on-api')
      const r = await nopOnLai(auth.token, g.traLoi, g.duong)
      if (r.ban) return 'ban'
      if (!r.ok) {
        baoOnCau(r.error || 'Máy chủ chưa nhận bài ôn.') // bị từ chối hẳn (đăng nhập hết hạn, bài không còn…): gỡ khỏi hàng, báo rõ
        return 'bo'
      }
      window.dispatchEvent(new CustomEvent(SU_KIEN_HANG_DOI_XONG, { detail: { id: m.id, phanHoi: r, daNhan: false } }))
      setLamMoiKeHoach((n) => n + 1)
      return 'xong'
    }
    if (m.loai !== 'btvn_chang') return 'bo'
    const g = m.goi as { ma?: string; chiSo?: number; dapAn?: Record<string, string>; maCa?: string }
    if (!g.ma || typeof g.chiSo !== 'number' || !g.dapAn) return 'bo'
    const [{ nopChangCaNhan }, { theChangView }] = await Promise.all([import('../lib/btvn-nop-chang-em'), import('../lib/btvn-ca-nhan-kieu')])
    const kq = await nopChangCaNhan({ ma: g.ma, sbd: m.sbd, chiSo: g.chiSo, dapAn: g.dapAn }, g.maCa || 'Riêng')
    if (kq.ban) return 'ban'
    if (!kq.ok) {
      void bao(kq.error || 'Chưa nộp được chặng.', 'Chưa nộp được chặng')
      return 'bo'
    }
    if (kq.html && phieuMoRef.current && maBtvnPhieuRef.current === g.ma) {
      setPhieuHtml(kq.html)
      const the = kq.ket ? theChangView(kq.ket, kq.soChang) : null
      if (the) setTheChang(the)
    } else {
      void napLaiBtvn()
    }
    return 'xong'
  })

  const moBaiTap = async (bt: any, lamLai = false, tuyChonPhanTang?: { vong?: number; soCauSang?: number }) => {
    if (!auth) return
    const id = bt.maBtvn || bt.maCa

    if (lamLai) {
      const con = typeof bt.soLanLamLaiConLai === 'number' ? bt.soLanLamLaiConLai : 3
      if (con <= 0) {
        void bao('Em đã dùng hết 3 lượt làm lại bài tập về nhà này.', 'Hết lượt làm lại')
        return
      }
      const xacNhan = await hoi({
        tieuDe: 'Làm lại bài tập về nhà này?',
        noiDung: `Em được làm lại tối đa 3 lần, hiện còn ${con} lượt. Lần nộp mới sẽ cập nhật điểm và kết quả.`,
        nutDongY: 'Làm lại bài',
        nutHuy: 'Để sau',
      })
      if (!xacNhan) return

      // Xoá bài làm dở trong localStorage để câu hỏi sạch trơn cho em làm mới
      try {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const k = localStorage.key(i)
          if (k && (k.startsWith('ddh.lam.' + id) || (bt.maBtvn && k.includes(bt.maBtvn)) || k.startsWith('ddh.btvn.draft.' + id))) {
            localStorage.removeItem(k)
          }
        }
      } catch {}
    }

    setDangMoBai(id)
    try {
      const { layCauHinhChoEmBtvn } = await import('../lib/btvn-cho-em')
      const { btvnCuaEm } = await import('../lib/btvn-may-chu-moi')
      const ch = await layCauHinhChoEmBtvn()
      const r = await btvnCuaEm(ch, bt.maCa || 'Riêng', auth.sbd, bt.maBtvn)
      if (!r.ok) {
        void bao(r.error || 'Không mở được bài tập về nhà', 'Chưa mở được bài')
        return
      }
      const { dungPhieuBtvn } = await import('../lib/btvn-cho-em')
      const html = await dungPhieuBtvn(r, bt.maCa || 'Riêng', auth.sbd, { lamLai, ...tuyChonPhanTang })
      maCaPhieuRef.current = bt.maCa || 'Riêng'
      setPhieuHtml(html)
    } catch (e) {
      void bao(e instanceof Error ? e.message : 'Không mở được bài tập', 'Chưa mở được bài')
    } finally {
      setDangMoBai(null)
    }
  }

  // Xử lý hành động 1-Click từ Trợ lý cá nhân (Zero-Friction Direct Test Launch)
  const xuLyHanhDongTroLy = useCallback((hanhDong: any) => {
    if (!hanhDong) return
    switch (hanhDong.loai) {
      case 'mo_btvn':
        if (hanhDong.payload?.bt) {
          void moBaiTap(hanhDong.payload.bt, false, {
            vong: hanhDong.payload?.vong,
            soCauSang: hanhDong.payload?.soCau,
          })
        } else {
          setTab('btvn')
        }
        break
      case 'mo_mom':
        if (hanhDong.payload?.bai) {
          void batDauLamBaiMom(hanhDong.payload.bai)
        } else if (hanhDong.payload?.id) {
          void batDauLamBaiMom({ id: hanhDong.payload.id } as BaiMomGiao)
        } else {
          setTab('mom')
        }
        break
      case 'lam_cau_on':
        if (Array.isArray(hanhDong.payload?.qid) && hanhDong.payload.qid.length > 0) {
          setCauOn({ viecId: String(hanhDong.payload.viecId || 'on_lai'), qid: hanhDong.payload.qid, tieuDe: String(hanhDong.payload.tieuDe || 'Ôn câu hôm nay') })
          setTab('cauon')
        }
        break
      case 'mo_khac_phuc':
        void (async () => {
          if (!auth?.token) return
          setDangMoDe(true)
          try {
            const kh = await taiKeHoachNgay({ token: auth.token })
            if (!kh) {
              void bao('Chưa tải được lịch ôn. Em thử lại khi có kết nối.', 'Chưa mở được bài ôn')
              return
            }
            const viec = kh.viec.find((v) => (v.loai === 'on_lai' || v.loai === 'on_thi') && v.hien !== false && Array.isArray(v.chiTiet?.qid) && v.chiTiet.qid.length > 0)
            if (!viec) {
              void bao('Hôm nay em chưa có câu cần ôn theo lịch.', 'Lịch ôn của em')
              return
            }
            const qid = [...new Set((viec.chiTiet!.qid as unknown[]).filter((q): q is string => typeof q === 'string' && q.length > 0))]
            if (!qid.length) return
            setCauOn({ viecId: viec.id, qid, tieuDe: 'Ôn câu theo lịch của em' })
            setTab('cauon')
          } catch (err) {
            void bao(err instanceof Error ? err.message : 'Chưa mở được bài ôn', 'Chưa mở được bài ôn')
          } finally {
            setDangMoDe(false)
          }
        })()
        break
      case 'mo_thu_thach':
        void (async () => {
          if (!auth?.token) return
          setDangMoDe(true)
          try {
            const t = await taiThuThachHomNay(auth.token)
            if (!t || t.cau.length === 0) {
              void bao('Chưa có câu thử thách phù hợp với phần em đã học hôm nay.', 'Chưa có câu thử thách')
              return
            }
            setCauOn({ viecId: `thu_thach_rieng:${t.ngay}`, qid: t.cau.map((c) => c.qid), tieuDe: 'Thử thách riêng hôm nay', cauSan: t.cau as unknown as CauOn[], duongNop: DUONG_NOP_THU_THACH })
            setTab('cauon')
          } catch (err) {
            void bao(err instanceof Error ? err.message : 'Chưa mở được bài thử thách', 'Chưa mở được bài thử thách')
          } finally {
            setDangMoDe(false)
          }
        })()
        break
      case 'mo_thi':
        setTab('vaothi')
        break
      case 'mo_than_thu':
        moGame()
        break
      default:
        break
    }
  }, [moBaiTap, batDauLamBaiMom, auth])

  // Nạp dữ liệu khi đã đăng nhập
  useEffect(() => {
    if (!auth) return
    let huy = false
    void (async () => {
      try {
        const url = await loadScriptUrlHoacMacDinh().catch(() => '')
        if (huy) return
        setDangTaiLichSu(true)
        const resLs = await hsLichSuCaApi(url, auth.sbd)
        if (!huy) {
          setDangTaiLichSu(false)
          if (resLs.ok && resLs.items) {
            setDsLichSu(resLs.items)
          }
        }

        setDangTaiBtvn(true)
        const resBt = await hsBtvnApi(url, auth.sbd)
        if (!huy) {
          setDangTaiBtvn(false)
          if (resBt.ok && resBt.items) {
            setDsBtvn(resBt.items)
          }
        }
      } finally {
        if (!huy) setDaNapLanDau(true)
      }
    })()

    return () => {
      huy = true
    }
  }, [auth])

  const xuLyDangNhap = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const sbd = sbdInput.trim()
    if (!sbd) {
      setLoiDangNhap('Vui lòng nhập số báo danh (SBD)')
      return
    }
    setDangXuLyDangNhap(true)
    setLoiDangNhap('')
    try {
      const url = await loadScriptUrlHoacMacDinh().catch(() => '')
      const res = await hsDangNhapApi(url, sbd, matKhauInput.trim())
      if (res.chuaCoMatKhau) {
        setChuaCoMatKhau(true)
        setDangXuLyDangNhap(false)
        return
      }
      if (!res.ok) {
        setLoiDangNhap(res.error || 'Đăng nhập không thành công. Kiểm tra lại SBD hoặc mật khẩu.')
        return
      }
      const thongTin: ThongTinHs = {
        sbd: res.sbd || sbd,
        hoTen: res.hoTen || `Học sinh ${sbd}`,
        lop: res.lop || '',
        namSinh: res.namSinh || '',
        token: res.token,
      }
      localStorage.setItem(KHOA_LUU_AUTH, JSON.stringify(thongTin))
      setAuth(thongTin)
    } catch (err) {
      setLoiDangNhap(err instanceof Error ? err.message : 'Lỗi kết nối máy chủ')
    } finally {
      setDangXuLyDangNhap(false)
    }
  }

  const xuLyDatMatKhau = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!matKhauMoi || matKhauMoi.length < 6) {
      setLoiDatMatKhau('Mật khẩu mới phải có tối thiểu 6 ký tự')
      return
    }
    if (matKhauMoi !== xacNhanMatKhau) {
      setLoiDatMatKhau('Xác nhận mật khẩu không khớp')
      return
    }
    setDangDatMatKhau(true)
    setLoiDatMatKhau('')
    try {
      const url = await loadScriptUrlHoacMacDinh().catch(() => '')
      const res = await hsDatMatKhauApi(url, sbdInput.trim(), matKhauMoi.trim())
      if (!res.ok) {
        setLoiDatMatKhau(res.error || 'Không thể đặt mật khẩu')
        return
      }
      // Sau khi đặt thành công, tự động đăng nhập
      setMatKhauInput(matKhauMoi)
      const resDn = await hsDangNhapApi(url, sbdInput.trim(), matKhauMoi.trim())
      if (resDn.ok) {
        const thongTin: ThongTinHs = {
          sbd: resDn.sbd || sbdInput.trim(),
          hoTen: resDn.hoTen || `Học sinh ${sbdInput.trim()}`,
          lop: resDn.lop || '',
          namSinh: resDn.namSinh || '',
          token: resDn.token,
        }
        localStorage.setItem(KHOA_LUU_AUTH, JSON.stringify(thongTin))
        setAuth(thongTin)
        setChuaCoMatKhau(false)
      } else {
        setChuaCoMatKhau(false)
        setLoiDangNhap('Đặt mật khẩu thành công! Vui lòng đăng nhập.')
      }
    } catch (err) {
      setLoiDatMatKhau(err instanceof Error ? err.message : 'Lỗi kết nối máy chủ')
    } finally {
      setDangDatMatKhau(false)
    }
  }

  const dangXuat = async () => {
    try{const r=await navigator.serviceWorker?.getRegistration();const sub=await r?.pushManager?.getSubscription();if(sub&&auth?.token){await noticeApi(auth.token,'unsubscribe',{endpoint:sub.endpoint});await sub.unsubscribe()}}catch{/* Generic push contains no personal data. */}
    localStorage.removeItem(KHOA_LUU_AUTH)
    setAuth(null)
    setMatKhauInput('')
    setSbdInput('')
  }

  const tongSoCauSaiDaChon = useMemo(() => {
    let t = 0
    for (const c of dsLichSu) {
      t += (docSoDem(c)?.soCanKhacPhuc ?? c.soCauSai ?? 0)
    }
    return t
  }, [dsLichSu])

  // Bảng nhiệm vụ: kế hoạch ngày của máy chủ (/hs/ke-hoach-ngay); lỗi/mất mạng → bản cuối hoặc nguồn trợ lý.
  const dangMoManCon =
    tab !== null || dangLamMom !== null || manThi || boVaoThi !== null || !!phieuHtml || !!xemDeHtml || caXemBaoCaoModal !== null || dsCauSaiKhacPhucModal !== null
  const lamMoiSheet = useLamMoiKhiDong(dangMoManCon)
  const keHoachNgay = useKeHoachNgay({ token: auth?.token, sbd: auth?.sbd }, !!auth, lamMoiSheet + lamMoiHang)
  // "Thử thách riêng hôm nay" của Bộ não A.I (lệnh riêng, hợp đồng docs/hop-dong-thu-thach-rieng-2109.md): co:false/lỗi/404 ⇒ null ⇒ không thẻ. "Để sau" ẩn tới ngày mai.
  const thuThachMayChu = useThuThachHomNay(auth?.token, lamMoiSheet + lamMoiHang)
  // Ô "Thi đua hôm nay" (8A): nạp /hs/thi-dua-hom-nay, làm mới mỗi 60 giây khi bảng đang hiện (không có lệnh ⇒ không ô).
  const thiDua = useThiDua(auth?.token, !!auth?.token && tab === null)
  const [deSauThuThach, setDeSauThuThach] = useState('')
  const homNayVn = ngayVietNam(nowHocTap) ?? ''
  const thuThachRieng = useMemo(() => {
    if (!thuThachMayChu) return null
    if (thuThachMayChu.trangThai !== 'xong' && dangDeSau(deSauThuThach || docDeSau(auth?.sbd ?? ''), thuThachMayChu.ngay, homNayVn)) return null
    return thuThachMayChu
  }, [thuThachMayChu, deSauThuThach, homNayVn, auth?.sbd])
  const caDangMo = useCaDangMo({ token: auth?.token, sbd: auth?.sbd }, !!auth)
  const duLieuNhiemVu = useMemo(
    () =>
      dungBangNhiemVu({
        keHoachTroLy: tongHopKeHoachTroLy({
          now: nowHocTap,
          sbd: auth?.sbd ?? '',
          hoTen: auth?.hoTen ?? '',
          dsBtvn,
          dsMomGiao,
          dsLichSu,
          tongCauSai: tongSoCauSaiDaChon,
        }),
        now: nowHocTap,
        keHoachNgay: keHoachNgay.keHoach,
        cu: keHoachNgay.cu,
        dsBtvn,
        dsMomGiao,
      }),
    [nowHocTap, auth?.sbd, auth?.hoTen, dsBtvn, dsMomGiao, dsLichSu, tongSoCauSaiDaChon, keHoachNgay],
  )
  // Mọi dữ liệu đã về (thành công hay lỗi) chưa? Trước đó vẽ từ BẢN NHỚ cùng ngày nếu có, không thì skeleton.
  const sanSangBang = daNapLanDau && (daTaiMom || !!loiMom) && keHoachNgay.daXong
  const banNho = useBanNho(auth?.sbd, sanSangBang && !keHoachNgay.cu && duLieuNhiemVu.nguon === 'ke_hoach_ngay' ? duLieuNhiemVu : null)
  const dungBanNho = !!banNho && !sanSangBang
  const duLieuBang = useMemo(() => ({ ...(dungBanNho ? banNho! : duLieuNhiemVu), thuThachRieng }), [dungBanNho, banNho, duLieuNhiemVu, thuThachRieng])

  // Rút đề khắc phục câu sai
  /**
   * LẤY CÂU SAI CỦA EM CHO GAME THẦN THÚ.
   *
   * Truyền xuống dưới dạng HÀM GỌI LẠI, không truyền số báo danh: game không
   * cần biết em là ai, nó chỉ cần nội dung câu và nhãn dạng thầy đã gắn.
   * Danh sách mã ca để RỖNG nghĩa là lấy câu sai của mọi ca em đã thi.
   */
  const layCauSaiChoGame = useCallback(async () => {
    if (!auth) return []
    const url = await loadScriptUrlHoacMacDinh().catch(() => '')
    // THÁP LẤY MỌI CÂU EM ĐÃ THI, không riêng câu sai — thầy chốt 15-09.
    // Máy chủ chưa đẩy bản mới thì lùi về kho câu sai, em vẫn leo được.
    const moi = await hsCauDaThiApi(url, auth.sbd, [])
    if (moi.ok && moi.items) return moi.items as NonNullable<Awaited<ReturnType<typeof hsCauSaiApi>>['items']>
    const res = await hsCauSaiApi(url, auth.sbd, [])
    if (!res.ok || !res.items) throw new Error(res.error || 'Máy chủ không trả được câu hỏi của em')
    return res.items
  }, [auth])

  /**
   * ĐỒNG BỘ THẦN THÚ ĐA THIẾT BỊ.
   *
   * Thầy bắt được 15-09: điện thoại thấy trứng, web thấy có sừng. Game không
   * biết số báo danh (và không cần biết) — cổng này biết, nên cổng gọi máy chủ
   * rồi trao kết quả xuống. Chỉ tiến trình game đi qua đây: cấp thú, EXP, tầng
   * tháp. Không tên, không điểm, không ảnh bài.
   */
  const docThanThuChoGame = useCallback(async () => {
    if (!auth) return null
    const url = await loadScriptUrlHoacMacDinh().catch(() => '')
    const res = await thanThuDocApi(url, auth.sbd)
    if (!res.ok) throw new Error(res.error || 'Máy chủ không trả được hồ sơ thần thú')
    return res.hoSo ?? null
  }, [auth])

  const ghiThanThuChoGame = useCallback(async (hoSo: unknown) => {
    if (!auth) return null
    const url = await loadScriptUrlHoacMacDinh().catch(() => '')
    return await thanThuGhiApi(url, auth.sbd, hoSo)
  }, [auth])

  /**
   * CỔNG ĐẤU TRƯỜNG CHÂN LÝ.
   *
   * Tám hàm dưới đây đóng sẵn số báo danh vào, nên màn game vẫn KHÔNG nhận số
   * báo danh — đúng luật đã đặt cho cả game từ đầu. Số báo danh của BẠN mà em
   * gõ vào ô mời thì đi thẳng lên máy chủ, không cất ở đâu trong máy.
   */
  const congVoDai = useMemo(() => {
    if (!auth) return undefined
    const url = () => loadScriptUrlHoacMacDinh().catch(() => '')
    return {
      taoPhong: async (biDanh: string, he: string) => voDaiTaoApi(await url(), auth.sbd, biDanh, he),
      moi: async (ma: string, dsSbd: string[]) => voDaiMoiApi(await url(), auth.sbd, ma, dsSbd),
      loiMoi: async () => voDaiLoiMoiApi(await url(), auth.sbd),
      vao: async (ma: string, biDanh: string, he: string) => voDaiVaoApi(await url(), auth.sbd, ma, biDanh, he),
      batDau: async (ma: string) => voDaiBatDauApi(await url(), auth.sbd, ma),
      xem: async (ma: string) => voDaiXemApi(await url(), auth.sbd, ma),
      nop: async (ma: string, vong: number, nop: Record<string, unknown>) =>
        voDaiNopApi(await url(), auth.sbd, ma, vong, nop),
      dong: async (ma: string) => voDaiDongApi(await url(), auth.sbd, ma),
    }
  }, [auth])

  const taoDeKhacPhuc = async (danhSachMaCaTuyChon?: string[]) => {
    if (!auth) return
    let dsMaCa = danhSachMaCaTuyChon && danhSachMaCaTuyChon.length > 0 ? danhSachMaCaTuyChon : []
    if (dsMaCa.length === 0) {
      const caCoSai = dsLichSu.filter((c) => (c.soCauSai ?? 0) > 0).map((c) => c.maCa)
      dsMaCa = caCoSai.length > 0 ? caCoSai : dsLichSu.map((c) => c.maCa)
    }
    if (dsMaCa.length === 0) {
      setTieuDeKhacPhucModal('Lựa chọn luyện tập')
      setDsCauSaiKhacPhucModal([])
      return
    }
    setCheDoKhacPhucMacDinh(1)
    try {
      const url = await loadScriptUrlHoacMacDinh().catch(() => '')
      const res = await hsCauSaiApi(url, auth.sbd, dsMaCa)
      if (!res.ok || !res.items) {
        return
      }

      setTieuDeKhacPhucModal(dsMaCa.length === 1 ? `Ca kiểm tra mã ${dsMaCa[0]}` : `${dsMaCa.length} ca kiểm tra đã chọn`)
      setDsCauSaiKhacPhucModal(res.items as CauSaiDauVao[])
    } catch {}
  }

  // Vào thi
  const vaoThi = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const ma = maCaVaoThi.trim()
    if (!ma || ma.length < 4) {
      setLoiVaoThi('Vui lòng nhập mã ca kiểm tra hợp lệ (từ 4 đến 8 chữ số)')
      return
    }
    setLoiVaoThi('')
    if (!auth) {
      setLoiVaoThi('Em cần đăng nhập trước khi vào thi.')
      return
    }
    // VÀO THẲNG PHÒNG CHỜ, KHÔNG HỎI LẠI TÊN (thầy chốt 14/09: "sau khi nhập mã
    // ca và mật khẩu thì phải chuyển vào màn hình chờ hoặc chuyển vào làm bài
    // luôn").
    //
    // Hai bản trước đều bắt em đi qua một cửa thừa. Bản đầu nhảy sang đường dẫn
    // `/t/<mã ca>`: em bị đá khỏi cổng, và đó đúng là chỗ vỡ khi máy chủ không
    // trả `index.html` cho đường dẫn không có tệp thật. Bản sau dựng màn thi
    // trong lớp phủ nhưng nhét mã ca vào ĐỊA CHỈ rồi để màn thi tự đọc — nên em
    // vẫn phải bấm qua màn "Có đúng em không?", trong khi chính em vừa đăng
    // nhập bằng mật khẩu riêng cách đó ba giây.
    //
    // Nay trao tay thẳng bằng THAM SỐ, không qua địa chỉ: tên và năm sinh của
    // em là dữ liệu cá nhân, không được nằm trên thanh địa chỉ để người ngồi
    // cạnh đọc được. Màn thi nhận đủ danh tính đã xác thực nên bỏ hẳn bước hỏi
    // lại, gọi máy chủ ngay và rơi đúng vào phòng chờ hoặc vào bài.
    setBoVaoThi({
      maCa: ma,
      sbd: auth.sbd,
      hoTen: auth.hoTen || '',
      namSinh: auth.namSinh || '',
      lop: auth.lop || '',
      matKhau: matKhauCaVaoThi.trim(),
    })
    setManThi(true)
  }

  // NẾU CHƯA ĐĂNG NHẬP
  if (!auth) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-50 to-blue-50/20 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200/80 dark:border-slate-800 p-8 transition">
          <div className="mb-6">
            <LogoDoc vai="hs" size={64} />
          </div>

          {chuaCoMatKhau ? (
            <form onSubmit={xuLyDatMatKhau} className="space-y-4">
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl text-amber-800 dark:text-amber-300 text-xs leading-relaxed flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <div>
                  <strong>Thiết lập mật khẩu lần đầu:</strong> SBD <strong>{sbdInput}</strong> chưa có mật khẩu. Em hãy tạo mật khẩu mới (tối thiểu 6 ký tự) để đăng nhập vào các lần sau.
                </div>
              </div>

              {loiDatMatKhau && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{loiDatMatKhau}</span>
                </div>
              )}

              <div>
                <label htmlFor="hs-mk-moi" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Mật khẩu mới
                </label>
                <input
                  id="hs-mk-moi"
                  type="password"
                  value={matKhauMoi}
                  onChange={(e) => setMatKhauMoi(e.target.value)}
                  placeholder="Nhập mật khẩu mới…"
                  className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition"
                  required
                />
              </div>

              <div>
                <label htmlFor="hs-mk-xac-nhan" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Xác nhận mật khẩu
                </label>
                <input
                  id="hs-mk-xac-nhan"
                  type="password"
                  value={xacNhanMatKhau}
                  onChange={(e) => setXacNhanMatKhau(e.target.value)}
                  placeholder="Nhập lại mật khẩu…"
                  className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition"
                  required
                />
              </div>

              <div className="pt-2 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setChuaCoMatKhau(false)}
                  className="w-1/3 min-h-[48px] py-2.5 px-3 rounded-full btn-google-outlined text-sm font-semibold cursor-pointer"
                >
                  Quay lại
                </button>
                <button
                  type="submit"
                  disabled={dangDatMatKhau}
                  className="w-2/3 min-h-[48px] py-2.5 px-4 rounded-full btn-google-primary text-sm shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {dangDatMatKhau ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  <span>Xác nhận & Đăng nhập</span>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={xuLyDangNhap} className="space-y-4">
              {loiDangNhap && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{loiDangNhap}</span>
                </div>
              )}

              <div>
                <label htmlFor="hs-dn-sbd" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Số báo danh (SBD)
                </label>
                <input
                  id="hs-dn-sbd"
                  type="text"
                  inputMode="numeric"
                  value={sbdInput}
                  onChange={(e) => setSbdInput(e.target.value)}
                  placeholder="Ví dụ: 110234 hoặc 12026"
                  className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono transition"
                  required
                  autoFocus
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="hs-dn-mat-khau" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Mật khẩu
                  </label>
                  <span className="text-[11px] text-slate-400">
                    (Lần đầu chưa có để trống để đặt)
                  </span>
                </div>
                <div className="relative">
                  <input
                    id="hs-dn-mat-khau"
                    type={hienMatKhau ? 'text' : 'password'}
                    value={matKhauInput}
                    onChange={(e) => setMatKhauInput(e.target.value)}
                    placeholder="Nhập mật khẩu của em…"
                    className="w-full min-h-[48px] px-4 py-2.5 pr-12 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition"
                  />
                  <button
                    type="button"
                    onClick={() => setHienMatKhau(!hienMatKhau)}
                    aria-label={hienMatKhau ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  >
                    {hienMatKhau ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={dangXuLyDangNhap}
                className="btn-google-primary w-full min-h-[48px] py-3 px-4 text-sm disabled:opacity-50 mt-3 shadow-sm cursor-pointer"
              >
                {dangXuLyDangNhap ? <RefreshCw className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                <span>Đăng nhập</span>
              </button>

              <div className="text-center pt-2">
                <p className="text-[11px] text-slate-400">
                  Quên mật khẩu: nhắn thầy để đặt lại.
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    )
  }

  // Vỏ M3 của sheet toàn màn: chỉ ở cổng học sinh (dungM3) và không phải game (game thần thú giữ nguyên, test khoá).
  const vaoM3 = dungM3() && tab !== 'thanthu'
  const tieuSheet =
    tab === 'diem' ? 'Xem điểm & lịch sử ca kiểm tra'
    : tab === 'btvn' ? 'Bài tập về nhà'
    : tab === 'mom' ? 'Bài gia đình giao'
    : tab === 'khacphuc' ? 'Khắc phục lỗi sai & luyện đề'
    : tab === 'vaothi' ? 'Vào ca kiểm tra trực tuyến'
    : tab === 'cauon' ? 'Ôn câu hôm nay'
    : 'Bảng tin & bài luyện hôm nay'

  const moManCu = (man: TabType) => {
    setTab(man)
    if (man === 'mom') void napDsMom()
    else if (man === 'btvn') void napLaiBtvn()
  }

  // KHI ĐÃ ĐĂNG NHẬP THÀNH CÔNG — MỘT màn "Bảng nhiệm vụ"; mọi màn cũ mở dạng sheet toàn màn.
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {hop}
      {auth.token && !(tab === 'mom' && dangLamMom) && !manThi && (
        <BangNhiemVu
          vaiTro="hocsinh"
          hoTen={auth.hoTen}
          now={nowHocTap}
          duLieu={duLieuBang}
          thiDua={thiDua}
          onLamThuThach={(t: ThuThachRieng) => {
            setCauOn({ viecId: `thu_thach_rieng:${t.ngay || homNayVn}`, qid: t.cau.map((c) => c.qid), tieuDe: 'Thử thách riêng hôm nay', cauSan: t.cau as unknown as CauOn[], duongNop: DUONG_NOP_THU_THACH })
            setTab('cauon')
          }}
          onDeSauThuThach={(t: ThuThachRieng) => {
            luuDeSau(auth.sbd, t.ngay || homNayVn)
            setDeSauThuThach(t.ngay || homNayVn)
          }}
          onCanhBaoDaXem={(cb) => void baoDaXemHocSinh(auth.token!, cb.id)}
          dangTai={!sanSangBang && !dungBanNho}
          dangLamMoi={keHoachNgay.dangLamMoi}
          dangChoNop={hangNop.soCho}
          onMoShop={() => {
            // Cửa vào Cửa hàng phụ kiện (chỉ có nút khi máy chủ báo `thanThu.shopBat`): khoá màn đầu = 'shop' rồi mở game; Đảo mở thẳng Cửa hàng khi `recommendations` cũng báo shopBat.
            try {
              sessionStorage.setItem(KHOA_MAN_DAU_GAME, 'shop')
            } catch {
              /* máy chặn lưu: game vẫn mở ở màn Đảo */
            }
            moGame()
          }}
          mucMenu={mucMenuHocSinh(moManCu, dangXuat)}
          khePhai={
            <ThongBaoHocSinh
              token={auth.token}
              onOpen={(t, noticeId) => {
                setTab(t)
                if (t === 'mom') {
                  void napDsMom()
                  if (noticeId) {
                    const momId = noticeId.startsWith('mom:') ? noticeId.split(':')[2] : noticeId
                    if (momId) void batDauLamBaiMom({ id: momId } as BaiMomGiao)
                  }
                } else if (t === 'btvn') {
                  void napLaiBtvn()
                }
              }}
            />
          }
          caDangMo={caDangMo}
          onHanhDong={xuLyHanhDongTroLy}
          onMoThanThu={moGame}
          onLenDuongDoan={() => {
            // Hợp đồng cửa vào của game (docs/hop-dong-mo-game-doan-ho-tong-1909.md): khoá màn đầu rồi mở tab game; game đọc MỘT lần rồi tự xoá.
            try {
              sessionStorage.setItem(KHOA_MAN_DAU_GAME, 'doan')
            } catch {
              /* máy chặn lưu: game vẫn mở, ở màn Đảo thần thú */
            }
            moGame()
          }}
          onVaoThi={() => setTab('vaothi')}
          onXemBaiDaNop={() => moManCu('diem')}
        />
      )}

      {/* FULLSCREEN CHỨC NĂNG: BẤM VÀO MỞ FULL MÀN HÌNH */}
      {tab !== null && (
        <div
          className={`${vaoM3 ? 'm3 m3-sheet ' : ''}fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 overflow-y-auto flex flex-col animate-google-fade`}
        >
          {/* Header Toàn Màn Hình. Cổng học sinh (mọi màn cũ trừ game) dùng thanh trên M3 dùng chung; mọi đường khác giữ đúng cái cũ. */}
          {vaoM3 && (
            <ThanhTren
              tieuDe={tieuSheet}
              onQuayLai={() => setTab(null)}
              nhanQuayLai="Quay lại Bảng tin"
              phai={
                <button type="button" onClick={() => setTab(null)} className="m3-nut-chu" title="Đóng toàn màn hình">
                  <X size={18} aria-hidden="true" />
                  <span>Đóng</span>
                </button>
              }
            />
          )}
          {/* GAME KHÔNG CÒN THANH TRÊN CỦA VỎ SHEET (thầy lệnh 21/09 · H4): trước đây "Quay lại Bảng tin" + "Đóng" nằm đè lên dải ải và trùng việc với nút "Về app học sinh" của chính game (bị thanh này che). Game tự có nút về ở MỌI màn
              (Đảo: nút dính trên cùng · Thám hiểm: "Về đảo" · Đoàn/Võ đài/Tiến bộ: thanh riêng) nên chỉ còn MỘT nút về. */}
          {!vaoM3 && tab !== 'thanthu' && <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-2 shadow-xs">
            <NutQuayLai onClick={() => setTab(null)} label="Quay lại Bảng tin" />

            <div className="flex items-center gap-2 min-w-0 max-w-[200px] sm:max-w-md">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
              <h2 className="font-bold text-xs sm:text-base text-slate-900 dark:text-white truncate">
                {tab === 'diem' && 'Xem Điểm & Lịch Sử Ca Kiểm Tra'}
                {tab === 'btvn' && 'Bài Tập Về Nhà'}
                {tab === 'mom' && 'Bài gia đình giao (120 phút từ khi bắt đầu)'}
                {tab === 'khacphuc' && 'Khắc Phục Lỗi Sai & Luyện Đề'}
                {tab === 'vaothi' && 'Vào Phòng Thi Trực Tuyến'}
                {tab === 'cauon' && 'Ôn câu hôm nay'}
                {tab === 'bantin' && 'Bảng tin & bài luyện hôm nay'}
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setTab(null)}
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-full bg-slate-100 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/60 dark:hover:text-rose-300 text-slate-600 dark:text-slate-300 text-xs sm:text-sm font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
              title="Đóng toàn màn hình"
            >
              <X size={16} />
              <span className="hidden sm:inline">Đóng</span>
            </button>
          </header>}

          <main className="max-w-6xl mx-auto w-full px-3 sm:px-6 py-4 sm:py-6 flex-1">

          {/* SHEET BẢNG TIN: nhận bài luyện hôm nay, mở các màn cũ từ bảng tin */}
          {tab === 'bantin' && (
            <BangTinPhuHuynh
              sbd={auth.sbd}
              hoTen={auth.hoTen}
              lop={auth.lop}
              studentToken={auth.token}
              onSent={(id) => {
                void napDsMom()
                setTab('mom')
                if (id) void batDauLamBaiMom({ id } as BaiMomGiao)
              }}
              activeTab={tab}
              onSelectTab={(k, cd) => {
                if (cd) setCheDoKhacPhuc(cd)
                setTab(k as TabType)
              }}
              tabStats={{
                diemCount: dsLichSu.length,
                btvnCount: dsBtvn.length,
                momCount: dsMomGiao.length,
                wrongCount: tongSoCauSaiDaChon,
              }}
            />
          )}

          {/* TAB 1: XEM ĐIỂM */}
          {tab === 'diem' && vaoM3 && (
            <LichSuCaM3
              dangTai={dangTaiLichSu}
              ds={dsLichSu}
              ngayGio={dinhDangNgayGio}
              dongDem={(item) => <DongDemCau so={item as any} />}
              dangMoDe={dangMoDe}
              onXemBaoCao={(item) => setCaXemBaoCaoModal(item as any)}
              onXemDe={(maCa) => void moDeVaLoiGiai(maCa)}
            />
          )}
          {tab === 'diem' && !vaoM3 && (
          <div className="space-y-4 animate-google-fade">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Lịch sử ca kiểm tra & Báo cáo kết quả
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Xem điểm chi tiết và báo cáo học tập của tất cả các ca kiểm tra em đã tham gia
                </p>
              </div>
            </div>

            {dangTaiLichSu ? (
              <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
                <span className="text-sm">Đang tải lịch sử thi...</span>
              </div>
            ) : dsLichSu.length === 0 ? (
              <div className="p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center">
                <Award className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                  Chưa có ca kiểm tra nào
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  Em chưa tham gia ca kiểm tra nào trên hệ thống hoặc ca kiểm tra chưa được đồng bộ.
                </p>
              </div>
            ) : (
              <div role="region" aria-label="Lịch sử ca kiểm tra và báo cáo" tabIndex={0} className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[65vh] overflow-y-auto overscroll-contain rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 p-3 sm:p-4">
                {dsLichSu.map((item) => (
                  <div
                    key={item.maCa}
                    className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            #{item.maCa}
                          </span>
                          <h3 className="font-bold text-slate-900 dark:text-white text-base mt-1.5">
                            {item.tenCa || `Ca kiểm tra mã ${item.maCa}`}
                          </h3>
                        </div>
                        <div
                          className={`text-xl font-extrabold px-3 py-1 rounded-xl border ${mauDiem(
                            item.tong,
                          )}`}
                        >
                          {item.tong !== null && item.tong !== undefined ? item.tong.toFixed(2) : '--'}
                          <span className="text-xs font-normal opacity-70">/10</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-4">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {dinhDangNgayGio(item.nopLuc)}
                        </span>
                        {/* CHƯA CHẤM THÌ KHÔNG HIỆN. Máy chủ trả `null` khi ca
                            chưa có bảng chấm; `?? 0` biến nó thành "Đúng 0/0
                            câu" — một con số bịa, và đó đúng là thứ ca Test2
                            (561169) hiện ra cho bài 1,56 điểm. */}
                        {typeof item.tongCau === 'number' && item.tongCau > 0 && (
                          <>
                            <span>•</span>
                            {/* KHÔNG tự trừ `tongCau - soCauDung` nữa: phép trừ
                                ấy dồn cả câu bỏ trống lẫn câu phần II đúng một
                                phần vào "sai", nên ca Test4 (thầy bắt 14/09)
                                in "Sai 12 câu" cho bài được 2,00 điểm. */}
                            <DongDemCau so={item} />
                          </>
                        )}
                      </div>

                      {/* Điểm từng phần */}
                      <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs mb-4">
                        <div className="text-center">
                          <div className="text-slate-400 text-[10px]">Phần I (TN)</div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {item.diemI !== null ? item.diemI.toFixed(2) : '--'}
                          </div>
                        </div>
                        <div className="text-center border-x border-slate-200 dark:border-slate-700">
                          <div className="text-slate-400 text-[10px]">Phần II (Đ/S)</div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {item.diemII !== null ? item.diemII.toFixed(2) : '--'}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-slate-400 text-[10px]">Phần III (Trả lời)</div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {item.diemIII !== null ? item.diemIII.toFixed(2) : '--'}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                      <button
                        type="button"
                        onClick={() => setCaXemBaoCaoModal(item)}
                        className="flex-1 py-2 px-4 rounded-full btn-google-tonal text-xs font-semibold text-center flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>Xem báo cáo</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void moDeVaLoiGiai(item.maCa)}
                        disabled={dangMoDe}
                        className="py-2 px-4 rounded-full btn-google-outlined text-xs font-medium text-center cursor-pointer"
                      >
                        Xem đề và lời giải kèm lỗi sai
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: NỘP BÀI TẬP VỀ NHÀ */}
        {tab === 'btvn' && vaoM3 && (
          <BtvnM3
            dangTai={dangTaiBtvn}
            ds={dsBtvn}
            now={nowHocTap}
            dangMoId={dangMoBai}
            ngayGio={dinhDangNgayGio}
            onMo={(bt, lamLai) => void moBaiTap(bt, lamLai)}
            onTaiLai={() => void napLaiBtvn()}
          />
        )}
        {tab === 'btvn' && !vaoM3 && (
          <div className="space-y-4 animate-google-fade">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Bài tập về nhà
                  </h2>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    Chia chặng theo ngày/giờ
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Mỗi bài chia thành các chặng mở dần theo ngày/giờ · làm chặng đang mở rồi nộp trước Hạn nộp
                </p>
              </div>

              <button
                type="button"
                onClick={() => void napLaiBtvn()}
                disabled={dangTaiBtvn}
                className="px-3.5 py-1.5 rounded-full btn-google-outlined text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${dangTaiBtvn ? 'animate-spin' : ''}`} />
                <span>Làm mới</span>
              </button>
            </div>

            {/* Banner cách làm BTVN theo lô (thay 3 Vòng Phân Tầng cũ) */}
            <div className="bg-gradient-to-r from-emerald-50/80 via-amber-50/60 to-rose-50/80 dark:from-emerald-950/20 dark:via-amber-950/20 dark:to-rose-950/20 border border-emerald-200/80 dark:border-emerald-800/60 rounded-2xl p-4">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                  Cách làm bài tập về nhà: chia chặng theo ngày/giờ
                </span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700">
                  Xong chặng đang mở, chặng sau mở đúng nhịp
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
                <div className="bg-white/80 dark:bg-slate-900/80 rounded-xl p-2.5 border border-emerald-200/60 dark:border-emerald-800/40">
                  <div className="font-bold text-emerald-700 dark:text-emerald-400 mb-0.5">CHẶNG ĐANG MỞ</div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-300">Em làm chặng tới nhịp hôm nay. Xong sớm thì chặng sau vẫn mở đúng nhịp, không mở sớm hơn.</div>
                </div>
                <div className="bg-white/80 dark:bg-slate-900/80 rounded-xl p-2.5 border border-amber-200/60 dark:border-amber-800/40">
                  <div className="font-bold text-amber-700 dark:text-amber-400 mb-0.5">CHẶNG SAU</div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-300">Mở dần theo ngày/giờ tính từ Hạn nộp, để không dồn bài vào phút chót.</div>
                </div>
                <div className="bg-white/80 dark:bg-slate-900/80 rounded-xl p-2.5 border border-rose-200/60 dark:border-rose-800/40">
                  <div className="font-bold text-rose-700 dark:text-rose-400 mb-0.5">NỘP BÀI</div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-300">Xong các chặng thì nộp trước Hạn nộp chung. Quá Hạn nộp là máy chủ chặn nộp — cần Thầy gia hạn.</div>
                </div>
              </div>
            </div>

            {dangTaiBtvn ? (
              <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
                <span className="text-sm">Đang tải danh sách bài tập...</span>
              </div>
            ) : dsBtvn.length === 0 ? (
              <div className="p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center">
                <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                  Chưa có bài tập về nhà nào
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  Hiện tại Thầy chưa giao bài tập mới hoặc các bài tập trước đó đã hoàn tất.
                </p>
                <button
                  type="button"
                  onClick={() => void napLaiBtvn()}
                  disabled={dangTaiBtvn}
                  className="mt-4 px-4 py-2 rounded-full btn-google-tonal text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${dangTaiBtvn ? 'animate-spin' : ''}`} />
                  <span>Tải lại danh sách</span>
                </button>
              </div>
            ) : (
              <div role="region" aria-label="Bài tập về nhà" tabIndex={0} className="space-y-3 max-h-[65vh] overflow-y-auto overscroll-contain rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 p-3 sm:p-4">
                {[...dsBtvn].sort((a, b) => Number(!!a.daNop) - Number(!!b.daNop) || (mocThoiGian(a.hanNop) ?? Infinity) - (mocThoiGian(b.hanNop) ?? Infinity)).map((bt) => (
                  <div
                    key={bt.maBtvn || bt.maCa}
                    className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          #{bt.maCa}
                        </span>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          Chia chặng theo ngày/giờ
                        </span>
                        {bt.daNop ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Đã nộp
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Chưa nộp
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-slate-900 dark:text-white text-base">
                        {tenBaiTapTrenThe(bt)}
                      </h3>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                        {bt.caNhan ? (
                          // Bài cá nhân hoá: số câu CỦA EM (không phải số câu của bài); chưa mở lần nào thì bộ chưa chốt.
                          <span>
                            {typeof bt.soCauCuaEm === 'number' ? (
                              <>
                                Câu của em: <strong>{bt.soCauCuaEm}</strong>
                                {soThuSucCua(bt) > 0 ? <> (+{soThuSucCua(bt)} câu thử sức thêm, không bắt buộc)</> : null}
                                {bt.soChang > 0 ? <> · {bt.soChang} chặng</> : null}
                              </>
                            ) : (
                              'Bộ câu của em chốt khi em mở bài'
                            )}
                          </span>
                        ) : (
                          bt.soCau > 0 && <span>Số câu: <strong>{bt.soCau}</strong></span>
                        )}
                        {bt.hanNop && (
                          <NhanHanBaiTap han={bt.hanNop} now={nowHocTap} daNop={!!bt.daNop} dayDu />
                        )}
                        {bt.nopLuc && (
                          <span>Nộp lúc: {dinhDangNgayGio(bt.nopLuc)}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-center flex-wrap justify-end">
                      {bt.daNop && bt.diem !== null && (
                        <div className="text-right mr-1">
                          <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                            {typeof bt.diem === 'number' && Number.isFinite(bt.diem) ? `${bt.diem.toFixed(2)}đ` : 'Chưa có điểm'}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {bt.soDung}/{bt.soCau} câu đúng
                          </div>
                        </div>
                      )}

                      {bt.daNop ? (
                        <>
                          <button
                            type="button"
                            onClick={() => void moBaiTap(bt, false)}
                            disabled={dangMoBai === (bt.maBtvn || bt.maCa)}
                            className="px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer btn-google-outlined"
                            title="Xem lại bài làm và lời giải chi tiết"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Xem lại bài</span>
                          </button>

                          {(bt.soLanLamLaiConLai ?? 3) > 0 && (mocThoiGian(bt.hanNop) ?? Infinity) > nowHocTap ? (
                            <button
                              type="button"
                              onClick={() => void moBaiTap(bt, true)}
                              disabled={dangMoBai === (bt.maBtvn || bt.maCa)}
                              className="px-4 py-2 rounded-full btn-google-primary !bg-amber-500 hover:!bg-amber-600 !border-amber-500 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                              title={`Làm lại bài tập về nhà này (còn ${bt.soLanLamLaiConLai ?? 3}/3 lượt)`}
                            >
                              {dangMoBai === (bt.maBtvn || bt.maCa) ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <RotateCcw className="w-3.5 h-3.5" />
                              )}
                              <span>Làm lại (còn {bt.soLanLamLaiConLai ?? 3}/3 lần)</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-full">
                              {(mocThoiGian(bt.hanNop) ?? Infinity) <= nowHocTap ? 'Cần Thầy gia hạn để làm lại' : bt.caNhan ? 'Làm lại khi Thầy cho phép' : 'Đã hết lượt làm lại'}
                            </span>
                          )}
                        </>
                      ) : (mocThoiGian(bt.hanNop) ?? Infinity) <= nowHocTap ? (
                        <p className="text-xs text-amber-800 dark:text-amber-200">Đã hết hạn. Em báo Thầy để được gia hạn.</p>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void moBaiTap(bt, false)}
                          disabled={dangMoBai === (bt.maBtvn || bt.maCa)}
                          className="px-4 py-2 rounded-full btn-google-primary !bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          {dangMoBai === (bt.maBtvn || bt.maCa) ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Đang mở...</span>
                            </>
                          ) : (
                            <>
                              <span>Vào làm bài</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2.5: BÀI CỦA MOM GIAO (HẠN 2 TIẾNG) */}
        {tab === 'mom' && vaoM3 && auth && (
          <>
            {dangLamMom ? (
              <MomLamBaiM3
                tieuDe={dangLamMom.tieuDe}
                giayConLai={giayConLaiMom}
                dinhDangThoiGian={dinhDangThoiGianMom}
                soDaLam={Object.keys(cauTraLoiMom).length}
                dsCau={dangLamMom.dsCau || dangLamMom.cau || []}
                traLoi={cauTraLoiMom}
                datTraLoi={(idCau, giaTri) => setCauTraLoiMom((prev) => ({ ...prev, [idCau]: giaTri }))}
                loi={loiMom}
                onQuayLai={hoiRoiBaiMom}
                onTamDung={() => {
                  try {
                    localStorage.setItem(`omr_mom_draft_${dangLamMom.id}_${auth.sbd}`, JSON.stringify({
                      cauTraLoi: cauTraLoiMom,
                      luuLuc: new Date().toISOString(),
                      giayConLai: giayConLaiMom,
                    }))
                  } catch {}
                  void bao('Bài của em đã được lưu nháp. Em vào làm tiếp bất cứ lúc nào trước Hạn nộp.', 'Đã lưu nháp')
                  setDangLamMom(null)
                }}
                onNop={nopBaiCuaMom}
              />
            ) : (
              <MomDanhSachM3
                ds={dsMomGiao as unknown as BaiMomM3[]}
                daTai={daTaiMom}
                loi={loiMom}
                thongBaoNop={thongBaoNopMom}
                onDongThongBao={() => setThongBaoNopMom(null)}
                onLamMoi={() => void napDsMom()}
                ngayGio={dinhDangNgayGio}
                onBatDau={(bai) => void batDauLamBaiMom(bai as unknown as BaiMomGiao)}
                onXemKetQua={async (bai: any) => {
                  if (bai.htmlKetQua) { setPhieuHtml(bai.htmlKetQua); return }
                  try { const data = await momApi('review', { token: auth?.token, id: bai.id }); setPhieuHtml(momReviewHtml(chuanHoaBaiMom(data.item))) }
                  catch (e) { setLoiMom(e instanceof Error ? e.message : 'Chưa tải được kết quả.') }
                }}
              />
            )}
          </>
        )}
        {tab === 'mom' && !vaoM3 && (
          <div className="space-y-4 animate-google-fade">
            {dangLamMom ? (
              /* MÀN HÌNH ĐANG LÀM BÀI CỦA MOM GIAO */
              <div className="space-y-4">
                {/* Thanh điều khiển đếm ngược 2 tiếng ghim trên */}
                <div className="sticky top-16 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 rounded-2xl border border-rose-200 dark:border-rose-900/60 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <NutQuayLai
                      onClick={hoiRoiBaiMom}
                      label="Danh sách bài"
                    />
                    <div className="font-bold text-sm text-slate-800 dark:text-slate-100 line-clamp-1">
                      {dangLamMom.tieuDe}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Đồng hồ đếm ngược 2 tiếng */}
                    <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full font-mono text-xs font-bold border transition-colors ${
                      giayConLaiMom < 900
                        ? 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800 animate-pulse'
                        : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                    }`}>
                      <Timer className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      <span>Thời gian làm còn: {dinhDangThoiGianMom(giayConLaiMom)}</span>
                    </div>

                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Đã làm: <strong className="text-slate-800 dark:text-slate-200">{Object.keys(cauTraLoiMom).length}</strong>/{(dangLamMom.dsCau || dangLamMom.cau || []).length}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        try {
                          localStorage.setItem(`omr_mom_draft_${dangLamMom.id}_${auth.sbd}`, JSON.stringify({
                            cauTraLoi: cauTraLoiMom,
                            luuLuc: new Date().toISOString(),
                            giayConLai: giayConLaiMom,
                          }))
                        } catch {}
                        void bao('Bài của em đã được lưu nháp. Em vào làm tiếp bất cứ lúc nào trước Hạn nộp.', 'Đã lưu nháp')
                        setDangLamMom(null)
                      }}
                      className="border border-amber-300 dark:border-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-bold text-xs py-2 px-3.5 rounded-full flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                      title="Tạm dừng và lưu tiến độ để làm tiếp sau"
                    >
                      <Pause className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>Tạm dừng</span>
                    </button>

                    <button
                      onClick={nopBaiCuaMom}
                      className="btn-google-primary !bg-rose-600 hover:!bg-rose-700 text-white font-bold text-xs py-2 px-4 rounded-full flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Nộp bài gia đình giao</span>
                    </button>
                  </div>
                </div>

                {/* Danh sách các câu hỏi của bài */}
                <div className="space-y-4">
                  {(dangLamMom.dsCau || dangLamMom.cau || []).map((cau: any, idx: number) => {
                    const daChon = cauTraLoiMom[cau.id]
                    return (
                      <div
                        key={cau.id || idx}
                        className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            Câu {idx + 1}
                          </span>
                          {cau.chuyenDe && (
                            <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              {cau.chuyenDe}
                            </span>
                          )}
                        </div>

                        <div className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                          <MomQuestionStem q={cau} />
                        </div>

                        {cau.phan === 'II' ? <div className="space-y-3">{(cau.ideas || cau.luaChon || cau.choices || []).map((idea:string,i:number)=><div key={i} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-3"><MomOption q={cau} index={i} text={`${String.fromCharCode(97+i)}) ${idea}`} tf /><div className="mt-2 flex gap-2">{['D','S'].map(v=><button key={v} onClick={()=>setCauTraLoiMom(prev=>{const a=(prev[cau.id]||'----').split('');a[i]=v;return {...prev,[cau.id]:a.join('')}})} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${daChon?.[i]===v?'bg-rose-600 text-white shadow-xs':'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'}`}>{v==='D'?'Đúng':'Sai'}</button>)}</div></div>)}</div> : Array.isArray(cau?.choices) && cau.choices.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                            {cau.choices.map((choice: string, cIdx: number) => {
                              const kyTu = String.fromCharCode(65 + cIdx)
                              const duocChon = daChon === kyTu
                              return (
                                <button
                                  key={cIdx}
                                  type="button"
                                  onClick={() =>
                                    setCauTraLoiMom((prev) => ({ ...prev, [cau.id]: kyTu }))
                                  }
                                  className={`p-3 rounded-2xl border text-left text-xs transition flex items-start gap-2.5 cursor-pointer ${
                                    duocChon
                                      ? 'bg-rose-50 text-rose-900 border-rose-300 dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-700 font-semibold shadow-xs'
                                      : 'bg-slate-50/70 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700/80'
                                  }`}
                                >
                                  <span
                                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${
                                      duocChon
                                        ? 'bg-rose-600 text-white'
                                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                    }`}
                                  >
                                    {kyTu}
                                  </span>
                                  <MomOption q={cau} index={cIdx} text={choice} />
                                </button>
                              )
                            })}
                          </div>
                        ) : (
                          <div className="pt-2">
                            <label htmlFor={`cp-tl-${cau.id}`} className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                              Điền câu trả lời ngắn:
                            </label>
                            <ONhapDapSo
                              id={`cp-tl-${cau.id}`}
                              inputMode="text"
                              className="sm:w-80"
                              value={daChon || ''}
                              onChange={(v) => setCauTraLoiMom((prev) => ({ ...prev, [cau.id]: v }))}
                              placeholder="Nhập đáp án số hoặc chữ..."
                            />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {loiMom && <div role="alert" className="p-4 rounded-2xl bg-amber-50 text-amber-900">{loiMom}</div>}
                {/* Nút nộp bài dưới cùng */}
                <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 text-center space-y-3">
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    Em đã hoàn thành bài gia đình giao chưa?
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    Khi nộp bài, hệ thống sẽ tự động chấm điểm, tạo cấu trúc lời giải chi tiết chuẩn HTML và gửi kết quả về cho phụ huynh xem.
                  </p>
                  <button
                    onClick={nopBaiCuaMom}
                    className="btn-google-primary !bg-rose-600 hover:!bg-rose-700 text-white font-bold text-sm py-2.5 px-6 rounded-full inline-flex items-center gap-2 shadow-sm cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Nộp bài ngay</span>
                  </button>
                </div>
              </div>
            ) : (
              /* DANH SÁCH BÀI CỦA MOM GIAO */
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                      <span>Bài gia đình giao (thời gian làm 2 giờ)</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Phụ huynh tạo bài từ Cổng Phụ Huynh dựa trên các câu con sai trước đó để con ôn luyện khắc phục.
                    </p>
                  </div>
                  <button
                    onClick={napDsMom}
                    className="btn-google-outlined inline-flex items-center gap-1.5 text-xs px-3.5 py-1.5 font-semibold self-start sm:self-auto cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Làm mới</span>
                  </button>
                </div>

                {loiMom && <div role="alert" className="p-4 rounded-2xl bg-amber-50 text-amber-900">{loiMom}</div>}
                {thongBaoNopMom && (
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between">
                    <span>{thongBaoNopMom}</span>
                    <button
                      onClick={() => setThongBaoNopMom(null)}
                      className="text-emerald-600 hover:text-emerald-900 font-bold ml-2 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {dsMomGiao.length === 0 ? (
                  <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-500 flex items-center justify-center mx-auto">
                      <Heart className="w-6 h-6" />
                    </div>
                    <div className="font-bold text-sm text-slate-900 dark:text-white">
                      {daTaiMom ? 'Chưa có bài gia đình giao nào' : loiMom ? 'Chưa tải được danh sách bài' : 'Đang nhận bài gia đình giao…'}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                      Phụ huynh có thể vào <strong>Cổng Phụ Huynh (/phu-huynh)</strong> chỉ bằng Số báo danh của con, kéo thanh chọn câu (tối đa 99 câu) để tự động tạo và gửi bài cho con làm bất kỳ lúc nào.
                    </p>
                  </div>
                ) : (
                  <div role="region" aria-label="Bài gia đình giao" tabIndex={0} className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[65vh] overflow-y-auto overscroll-contain rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 p-3 sm:p-4">
                    {dsMomGiao.map((bai) => {
                      const daNop = bai.trangThai === 'da_nop'
                      const dangLam = bai.trangThai === 'dang_lam'
                      return (
                        <div
                          key={bai.id}
                          className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs flex flex-col justify-between space-y-4"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-mono text-slate-400">
                                {dinhDangNgayGio(bai.ngayGiao)}
                              </span>
                              {daNop ? (
                                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                                  <CheckCircle2 className="w-3 h-3 inline -mt-0.5" aria-hidden="true" /> Đã nộp ({bai.diem}/10đ)
                                </span>
                              ) : dangLam ? (
                                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">
                                  <Clock className="w-3 h-3 inline -mt-0.5" aria-hidden="true" /> Đang làm
                                </span>
                              ) : (
                                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800">
                                  Chưa làm
                                </span>
                              )}
                            </div>

                            <div className="font-bold text-sm text-slate-900 dark:text-white">
                              {bai.tieuDe}
                            </div>

                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-3">
                              <span>Số câu: <strong>{bai.soCau || (bai.dsCau || bai.cau || []).length}</strong> câu</span>
                              <span>·</span>
                              <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium">
                                <Timer className="w-3.5 h-3.5" />
                                <span>Thời gian làm: 2 giờ</span>
                              </span>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                            {daNop ? (
                              <button
                                onClick={async () => {
                                  if (bai.htmlKetQua) { setPhieuHtml(bai.htmlKetQua); return }
                                  try { const data = await momApi('review', {token:auth?.token,id:bai.id}); setPhieuHtml(momReviewHtml(chuanHoaBaiMom(data.item))) }
                                  catch (e) { setLoiMom(e instanceof Error ? e.message : 'Chưa tải được kết quả.') }
                                }}
                                className="btn-google-outlined text-xs py-2 px-3.5 rounded-full font-semibold flex items-center gap-1.5 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Xem kết quả & Lời giải HTML</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => batDauLamBaiMom(bai)}
                                className="btn-google-primary !bg-rose-600 hover:!bg-rose-700 text-white text-xs py-2 px-4 rounded-full font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                              >
                                <span>{dangLam ? 'Tiếp tục làm bài' : 'Bắt đầu làm bài (2 tiếng)'}</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: KHẮC PHỤC CÂU SAI - CHIA 2 NỬA */}
        {tab === 'khacphuc' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start animate-google-fade">
            <div>
              <LuyenDeChuan sbd={auth.sbd} token={auth.token} />
            </div>
            <div>
              <KhoiKhacPhuc3CheDo
                sbd={auth.sbd}
                token={auth.token}
                hoTen={auth.hoTen}
                dsLichSu={dsLichSu}
                scriptUrl={scriptUrl}
                initialCheDo={cheDoKhacPhuc}
                lop={auth.lop}
              />
            </div>
          </div>
        )}

        {/* ÔN CÂU HÔM NAY (việc on_lai): lấy đề → làm → nộp → lời giải. Đóng sheet thì màn cổng hỏi lại kế hoạch ngày. */}
        {tab === 'cauon' && cauOn && auth && auth.token && (
          <Suspense fallback={<div className="m3-xuong" style={{ height: 160 }} />}>
            <LamCauOn token={auth.token} sbd={auth.sbd} viecId={cauOn.viecId} qid={cauOn.qid} tieuDe={cauOn.tieuDe} cauSan={cauOn.cauSan} duongNop={cauOn.duongNop} onXong={() => setTab(null)} xepHang={(m) => hangNop.them({ id: m.id, loai: 'on_cau', sbd: auth.sbd, goi: m.goi })} />
          </Suspense>
        )}

        {/* TAB 4: VÀO PHÒNG THI */}
        {tab === 'vaothi' && !manThi && (
          <PhongVaoThi onClose={() => setTab('diem')}>
          {vaoM3 && (
            <VaoThiForm maCa={maCaVaoThi} onMaCa={setMaCaVaoThi} matKhau={matKhauCaVaoThi} onMatKhau={setMatKhauCaVaoThi} loi={loiVaoThi} onSubmit={vaoThi} sbd={auth.sbd} hoTen={auth.hoTen} />
          )}
          {!vaoM3 && <div className="max-w-xl mx-auto py-4 animate-google-fade">
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-purple-600/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 mb-3 shadow-inner">
                  <LogIn className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Vào ca kiểm tra trực tuyến
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Nhập mã ca kiểm tra từ Thầy và mật khẩu ca (nếu có) để bắt đầu làm bài
                </p>
              </div>

              {loiVaoThi && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 mb-4">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{loiVaoThi}</span>
                </div>
              )}

              <form onSubmit={vaoThi} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Mã ca kiểm tra (thường 6 chữ số)
                  </label>
                  <input
                    type="text"
                    value={maCaVaoThi}
                    onChange={(e) => setMaCaVaoThi(e.target.value.replace(/\D/g, ''))}
                    placeholder="Ví dụ: 543998"
                    maxLength={8}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-center font-mono text-xl tracking-wider font-bold"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Mật khẩu ca kiểm tra (nếu ca có yêu cầu)
                  </label>
                  <input
                    type="password"
                    value={matKhauCaVaoThi}
                    onChange={(e) => setMatKhauCaVaoThi(e.target.value)}
                    placeholder="Nhập mật khẩu ca kiểm tra (để trống nếu không có)..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  />
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-500 dark:text-slate-400">
                  Số báo danh đăng nhập của em: <strong className="text-slate-800 dark:text-slate-200 font-mono">{auth.sbd}</strong> ({auth.hoTen})
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-full btn-google-primary !bg-purple-600 hover:!bg-purple-700 !border-purple-600 text-white font-semibold text-sm shadow-sm flex items-center justify-center gap-2 mt-2 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Vào ca kiểm tra</span>
                </button>
              </form>
            </div>
          </div>}
          </PhongVaoThi>
        )}

        {/* TAB 7: THẦN THÚ HÓA HỌC (ALCHEMON) — Nuôi thú, leo tháp & săn boss câu sai.
            Gắn kết chặt chẽ với nhiệm vụ làm BTVN, sửa câu sai và vào phòng thi. */}
        {tab === 'thanthu' && (
          <Suspense fallback={<ChoNapGame />}>
          <ThanThuHoaHocGame
            sbd={auth.sbd}
            token={auth.token}
            dsLichSu={dsLichSu}
            dsBtvn={dsBtvn}
            dsMom={dsMomGiao}
            layCauSaiCuaEm={layCauSaiChoGame}
            docThanThuMayChu={docThanThuChoGame}
            ghiThanThuMayChu={ghiThanThuChoGame}
            congVoDai={congVoDai}
            onDong={() => {
              ketThucLuotToanManHinh() // Về app học sinh: thoát toàn màn hình rồi về app
              setTab(null)
            }}
            onChuyenSangKhacPhuc={() => setTab('khacphuc')}
            onChuyenSangBtvn={() => setTab('btvn')}
            onChuyenSangVaoThi={() => setTab('vaothi')}
          />
          </Suspense>
        )}
          </main>
        </div>
      )}

      {/* XEM ĐỀ VÀ LỜI GIẢI NGAY TRONG APP.
          Trước đây bấm là điều hướng thẳng sang /t/<mã ca>, tức nhảy hẳn khỏi
          cổng học sinh: em mất chỗ đang đứng, và trên app đã cài vào màn hình
          chính thì đó là một cửa sổ khác hẳn. Nay mở trong lớp phủ, đóng lại là
          về đúng chỗ cũ. */}
      {/* MÀN LÀM BÀI — phủ toàn màn, ngay trong cổng học sinh. */}
      {manThi && (
        <div className="fixed inset-0 z-[60] overflow-auto bg-white dark:bg-slate-950" style={{ '--thi-le-phai': '52px' } as React.CSSProperties}>
          <button
            type="button"
            onClick={() => {
              setManThi(false)
              setBoVaoThi(null)
            }}
            className="fixed top-3 right-3 z-[61] w-10 h-10 rounded-full bg-white/95 dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700 shadow-lg flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white"
            aria-label="Đóng phòng thi, về cổng học sinh"
            title="Về cổng học sinh"
          >
            <X className="w-5 h-5" />
          </button>
          <Suspense fallback={<div className="p-6 text-sm text-slate-500">Đang mở phòng thi…</div>}>
            <ManLamBai
              tuCong={boVaoThi ?? undefined}
              onVe={() => {
                setManThi(false)
                setBoVaoThi(null)
              }}
            />
          </Suspense>
        </div>
      )}

      {xemDeHtml && (
        <KhungXemPhieu
          html={xemDeHtml}
          ten="Đề và lời giải kèm lỗi sai"
          dong={() => setXemDeHtml('')}
        />
      )}

      {/* Khung xem đề bài tập & khắc phục câu sai (chuẩn HTML tương tác) */}
      {phieuHtml && (
        <KhungXemPhieu
          html={phieuHtml}
          ten="Bài tập & Phiếu làm bài"
          dong={() => {
            setTheChang(null)
            setPhieuHtml('')
            void napLaiBtvn()
          }}
          nopChang={async (tin) => {
            // Bài `ca_nhan`: phiếu KHÔNG có đáp án, gửi đáp án MỘT chặng ra đây. Thành công ⇒ dựng lại phiếu có kết quả
            // (đổi html), xong hẳn chặng thì bật thẻ tiến bộ. Hỏng ⇒ trả lời báo cho phiếu, bài làm vẫn còn ở máy.
            const [{ nopChangCaNhan }, { theChangView }] = await Promise.all([import('../lib/btvn-nop-chang-em'), import('../lib/btvn-ca-nhan-kieu')])
            maBtvnPhieuRef.current = tin.ma
            const kq = await nopChangCaNhan(tin, maCaPhieuRef.current)
            const idHang = khoaChang(tin.sbd || auth?.sbd || '', tin.ma, tin.chiSo)
            if (kq.ban && auth) {
              // Máy chủ bận: GIỮ bài ở máy và để hàng đợi tự nộp lại (không bắt em bấm lại). Phiếu hiện "Đã lưu ở máy, đang chờ máy chủ".
              hangNop.them({ id: idHang, loai: 'btvn_chang', sbd: auth.sbd, goi: { ma: tin.ma, chiSo: tin.chiSo, dapAn: tin.dapAn, maCa: maCaPhieuRef.current } })
              return { ok: false, ban: true, daLuu: true, error: CHU_DA_LUU_MAY }
            }
            if (!kq.ok) return { ok: false, error: kq.error }
            hangNop.go(idHang) // nộp được bằng đường bấm tay ⇒ gỡ mục cùng việc khỏi hàng đợi (nếu có)
            if (!kq.html) {
              // Đã nộp và đã lưu kết quả, chỉ không dựng lại được phiếu: đóng, nạp lại danh sách (mở lại bài là thấy).
              setPhieuHtml('')
              void napLaiBtvn()
              return { ok: true }
            }
            setPhieuHtml(kq.html)
            const the = kq.ket ? theChangView(kq.ket, kq.soChang) : null
            if (the) setTheChang(the)
            return { ok: true }
          }}
          phu={
            theChang ? (
              <Suspense fallback={null}>
                <TheCuoiChang
                  view={theChang}
                  dong={() => setTheChang(null)}
                  veBang={() => {
                    setTheChang(null)
                    setPhieuHtml('')
                    setTab(null)
                    void napLaiBtvn()
                  }}
                />
              </Suspense>
            ) : null
          }
        />
      )}

      {/* Modal Báo cáo ca thi chuẩn Google Material 3 - Mở tức thì & Thúc đẩy sửa sai ngay */}
      {caXemBaoCaoModal && auth && (
        <BaoCaoCaThiHocSinhModal
          baiThi={goiBaiThi(
            caXemBaoCaoModal,
            caXemBaoCaoModal.nopLuc ? dinhDangNgayGio(caXemBaoCaoModal.nopLuc) : undefined,
          )}
          hoTen={auth.hoTen}
          sbd={auth.sbd}
          lop={auth.lop}
          scriptUrl={scriptUrl}
          onClose={() => setCaXemBaoCaoModal(null)}
          onBatDauKhacPhuc={(maCa, html) => {
            setCaXemBaoCaoModal(null)
            setTab('khacphuc')
            // Modal khắc phục đã dựng xong tờ phiếu thì MỞ THẲNG. Gọi lại
            // `taoDeKhacPhuc` ở đây là mở lại đúng modal em vừa bấm — vòng kín.
            if (html) {
              setPhieuHtml(html)
              return
            }
            void taoDeKhacPhuc([maCa])
          }}
          onMoLaiBaiThi={(maCa) => void moDeVaLoiGiai(maCa)}
        />
      )}

      {/* Modal Khắc phục câu sai chuẩn hoá 3 lựa chọn */}
      {dsCauSaiKhacPhucModal && auth && (
        <ModalKhacPhucCauSai
          isOpen={Boolean(dsCauSaiKhacPhucModal)}
          onClose={() => setDsCauSaiKhacPhucModal(null)}
          dsCauSai={dsCauSaiKhacPhucModal}
          hoTen={auth.hoTen}
          sbd={auth.sbd}
          tieuDeCa={tieuDeKhacPhucModal}
          cheDoMacDinh={cheDoKhacPhucMacDinh}
          lop={auth.lop}
          onTaoPhieuXong={(html) => {
            setDsCauSaiKhacPhucModal(null)
            setPhieuHtml(html)
          }}
        />
      )}
    </div>
  )
}
