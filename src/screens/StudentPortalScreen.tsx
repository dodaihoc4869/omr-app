// App học sinh tập trung làm bài; giữ máy chủ giao câu, chấm và tiến độ hiện hành.
import HocTapHomNay from '../components/hoc-tap/HocTapHomNay'
import { soHomNay } from '../components/hoc-tap/lam-bai' // màn làm bài 12/10D: thanh trên "đã làm/M câu hôm nay" cùng nguồn vòng tròn Hôm nay
import TheDiemDanhHs from '../components/diem-danh/TheDiemDanhHs'
import { napTrongHs } from '../components/hoc-tap/nap-trong-hs'
import { useKhoaCuonTrang } from '../lib/khoa-cuon-trang'
import { canThanTuSanh, useSanhHoa2 } from '../components/hoa2/api'
import { useBanNho, useCaDangMo, useKeHoachNgay, useLamMoiKhiDong } from '../components/bang-nhiem-vu/may-chu'
// `nopOnLai` nhập TĨNH (Gói C 15/10): dòng này vốn đã kéo cả mô-đun vào mảnh cổng (verbatimModuleSyntax giữ lệnh nhập), nên `import()` cũ chỉ
// sinh một mảnh vỏ 76 byte — thêm một tệp precache, thêm một vòng mạng, không bớt byte nào.
import { nopOnLai, type CauOn, type MucTraLoi } from '../components/bang-nhiem-vu/cau-on-api'
import { dungBangNhiemVu, soThuSucCua } from '../lib/nhiem-vu-adapter'
import { tongHopKeHoachTroLy } from '../lib/tro-ly-ca-nhan'
import NhanHanBaiTap from '../components/NhanHanBaiTap'
import { mocThoiGian } from '../lib/han-bai-tap'
import { useGioHocTap } from '../hooks/useGioHocTap'
import ThongBaoHocSinh,{noticeApi} from '../components/ThongBaoHocSinh'
import {MomQuestionStem,MomOption} from '../components/MomQuestionMedia'
import {momApi, momReviewHtml} from '../lib/mom-api'
import PhongVaoThi from '../components/PhongVaoThi'
// Gói C 15/10: KhoiKhacPhuc3CheDo nay nạp lười (mảnh khối phụ, dưới) — nhưng thẻ câu GIỮ trong mảnh mở cổng như trước: các màn lười của em
// (Ôn câu, Làm bài tập, Câu đã làm…) vẫn dựa vào tờ kiểu đi cùng nó (m3/the-cau.css: `.m3 .loi-giai`, `.m3 .the-cau`). Bỏ dòng này là đổi màu.
import '../components/TheCau'
import {syncStudentExp} from '../game/than-thu-v2/academic-sync'
import NutQuayLai from '../components/NutQuayLai'
import { dungM3, ThanhTren } from '../components/m3'
import TheCanhBaoThay from '../components/bang-nhiem-vu/TheCanhBaoThay'
import { useHopThoai } from '../components/HopThoaiCong'
import VaoThiForm from '../components/bang-nhiem-vu/VaoThiForm'
import type { BaiMomM3 } from '../components/bang-nhiem-vu/MomM3'
import '../components/bang-nhiem-vu/sheet-m3.css'
// Tạm dừng hoạt ảnh Sảnh khi bị màn toàn màn hình che (lớp `sanh-bi-che`, xem hiệu ứng ngay dưới `cheDo2`).
import '../styles/sanh-bi-che.css'
import { lazy, Suspense, useCallback, useEffect, useMemo, useState, useRef, type CSSProperties, type ReactNode } from 'react'
const LuyenDeChuan=lazy(()=>import('../components/LuyenDeChuan'))
import { taoKhoGio, useGiayConLai } from '../lib/dong-ho-thi'
import {
  Award,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Eye,
  LogIn,
  RefreshCw,
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
// 27/10 tốc độ: bộ API ca thi (exam-api ~40 KB thô) KHÔNG chặn lượt mở cổng học sinh — bắt đầu tải ngay khi mảnh này chạy (song song, máy đã cài app
// lấy từ precache), về rồi thì gọi thẳng như nhập tĩnh; chưa về thì lệnh chờ đúng lượt tải đó.
type ExamApi = typeof import('../lib/exam-api')
let examApi: ExamApi | null = null
const examApiCho = import('../lib/exam-api').then((m) => (examApi = m))
examApiCho.catch(() => {}) // mất mạng lúc tải sẵn: không thành lỗi nền; lệnh gọi sau tự nhận lỗi qua chính lời hứa này
const hsDangNhapApi: ExamApi['hsDangNhapApi'] = (...a) => examApi ? examApi.hsDangNhapApi(...a) : examApiCho.then((m) => m.hsDangNhapApi(...a))
const hsDatMatKhauApi: ExamApi['hsDatMatKhauApi'] = (...a) => examApi ? examApi.hsDatMatKhauApi(...a) : examApiCho.then((m) => m.hsDatMatKhauApi(...a))
const hsLichSuCaApi: ExamApi['hsLichSuCaApi'] = (...a) => examApi ? examApi.hsLichSuCaApi(...a) : examApiCho.then((m) => m.hsLichSuCaApi(...a))
const hsBtvnApi: ExamApi['hsBtvnApi'] = (...a) => examApi ? examApi.hsBtvnApi(...a) : examApiCho.then((m) => m.hsBtvnApi(...a))
const hsCauSaiApi: ExamApi['hsCauSaiApi'] = (...a) => examApi ? examApi.hsCauSaiApi(...a) : examApiCho.then((m) => m.hsCauSaiApi(...a))
import { loadScriptUrlHoacMacDinh } from '../lib/exam-db'
import KhungXemPhieu from '../components/KhungXemPhieu'
import { tenBaiTapTrenThe, type TheChangView } from '../lib/btvn-ca-nhan-kieu'
import { nhoVaiDaDung } from '../lib/vai-tro'
import { datManifestTheoVai } from '../lib/pwa-install'
import { LogoDoc } from '../components/LogoVai'
import DangNhapHocSinh, { type ApiDangNhapHs } from './DangNhapHocSinh'
import { useTuDangXuatKhiPhienHong } from '../lib/phien-hong'
import { boNap, nenNapTruoc, veNgayKhiCo, type BoNap } from '../components/hoa2/nap-truoc-man'
import { napManCauDaLam, napManTuLuyen } from '../components/hoa2/man-sanh-luoi'
// Màn làm bài, chữa và xem lại chỉ tải khi em mở.
const ManLamBaiTap = lazy(() => import('../components/hoc-tap/ManLamBaiTap'))
const ManKiemTraCaNhan = lazy(() => import('../components/hoc-tap/ManKiemTraCaNhan'))
// Hồ sơ làm bài của em (thầy 12/10: "Cho hs bấm vào bảng lười chăm. Khi bấm vào hiển thị đủ hồ sơ như trong nhịp học nhé") — nạp lười, ngoài precache.
const HoSoCuaEmHs = lazy(() => import('../components/hoc-tap/HoSoCuaEmHs'))
const ManTuChua = lazy(() => import('../components/hoc-tap/ManTuChua'))

const CauDaLam = lazy(() => import('../components/hoa2/CauDaLam'))
// TU LUYỆN (29/09): màn riêng, nạp lười — máy yếu không tải khi chưa bấm cửa.
const ManTuLuyen = lazy(() => import('../components/tu-luyen/ManTuLuyen'))
// CHUYỂN MÀN NHANH (05/10): Sảnh 2.0 nạp trước ba mảnh trên lúc rảnh (components/hoa2/man-sanh-luoi.ts). `veNgayKhiCo`: mảnh đã có ⇒ vẽ
// thẳng, KHÔNG treo Suspense + 300 ms giữ màn chờ của React; chưa có ⇒ đúng lazy cũ ở trên (cùng màn chờ).

const CauDaLamNhanh = veNgayKhiCo(CauDaLam, napManCauDaLam)
const ManTuLuyenNhanh = veNgayKhiCo(ManTuLuyen, napManTuLuyen)
// LỊCH SỬ CA + BÁO CÁO CHI TIẾT bản mới (28/09): hai mảnh lazy NGOÀI precache.
const LichSuCaEm = lazy(() => import('../components/hoa2/LichSuCaEm'))
const BaoCaoCaCuaEm = lazy(() => import('../components/ca-thi/BaoCaoCaCuaEm'))

import DongDemCau, { docSoDem } from '../components/DongDemCau'
import { chuTheCaGanNhat, dungLichSuCa } from '../lib/lich-su-ca-hs'
import type { CauSaiDauVao } from '../lib/thuat-toan-rut-cau-sai'
import type { TuCongHocSinh } from './ExamTakeScreen'

// Màn làm bài nạp trễ nhưng nạp trước lúc rảnh / lúc bấm cửa: khi học sinh bấm "Vào thi" thì màn mở ngay lập tức trong 0ms.
export const boNapExam = boNap(() => import('./ExamTakeScreen'))
const ManLamBai = veNgayKhiCo(lazy(boNapExam), boNapExam)
const LamCauOn = lazy(() => import('../components/bang-nhiem-vu/LamCauOn'))
const TheCuoiChang = lazy(() => import('../components/bang-nhiem-vu/TheCuoiChang'))
// MÁY YẾU (29/09): Bảng tin + hộp Khắc phục câu sai chỉ hiện khi em BẤM mở — nạp lười (một mảnh chung, xem cong-hs-nap-luoi.ts)
// để lượt mở /hs đầu tiên không phải tải + dịch ≈ 55 KB mã chưa dùng. Tên biến giữ nguyên để JSX không đổi.
const napKhoiPhu = boNap(() => import('../components/cong-hs-nap-luoi'))
const BangTinPhuHuynh = lazy(() => napKhoiPhu().then((m) => ({ default: m.BangTinPhuHuynh })))
const ModalKhacPhucCauSai = lazy(() => napKhoiPhu().then((m) => ({ default: m.ModalKhacPhucCauSai })))
// Gói C 15/10 (app mở nhanh hơn): ba tab chỉ mở khi em BẤM — Khắc phục, Bài tập về nhà, Bài gia đình giao — cũng vào mảnh trên (lượt mở /hs bớt
// mã ba khối ấy cùng cửa nạp kho đề, thuật toán rút câu sai, phiếu luyện mà chỉ chúng dùng). Mảnh được nạp trước lúc rảnh ở Hôm nay (cùng nhịp nạp trước màn thi, dưới) ⇒ lúc em bấm, khối đã có thì VẼ THẲNG (veNgayKhiCo,
// không treo Suspense, không màn chờ); chưa có (2G / tiết kiệm dữ liệu / bấm quá sớm) ⇒ React.lazy, chỗ chờ giữ khung như các khối lười khác.
type KhoiPhu = typeof import('../components/cong-hs-nap-luoi')
function khoiPhu<K extends 'KhoiKhacPhuc3CheDo' | 'BtvnM3' | 'MomDanhSachM3' | 'MomLamBaiM3' | 'LichSuCaM3'>(ten: K) {
  const bo: BoNap<{ default: KhoiPhu[K] }> = Object.assign(() => napKhoiPhu().then((m) => ({ default: m[ten] })), {
    san: () => {
      const m = napKhoiPhu.san()
      return m ? { default: m[ten] } : null
    },
  })
  return veNgayKhiCo(lazy(bo), bo)
}
const KhoiKhacPhuc3CheDo = khoiPhu('KhoiKhacPhuc3CheDo')
const BtvnM3 = khoiPhu('BtvnM3')
const MomDanhSachM3 = khoiPhu('MomDanhSachM3')
const MomLamBaiM3 = khoiPhu('MomLamBaiM3')
const LichSuCaM3 = khoiPhu('LichSuCaM3') // tab «Xem điểm» (25/10: nạp lười cùng mảnh trên)
// Bong bóng A.I Đỗ Đại Học (thầy 24/10): kênh hỏi bài của văn phòng; chỉ ở Hôm nay; mảnh riêng ngoài precache, cửa nạp qua cong-hs-nap-luoi.
const BongBongAiDdh = lazy(() => napKhoiPhu().then((m) => m.napBong()))
import { baoDaXemHocSinh } from '../lib/canh-bao-thay-may-chu'
import { gioDayDu } from '../lib/ngay-gio-24'
import OSoTraLoi from '../components/OSoTraLoi'
import { batNhipBenVung } from '../lib/nhip-ben-vung'
import { CHU_DA_LUU_MAY, SU_KIEN_HANG_DOI_XONG, TOI_DA_LAN_THU, khoaChang } from '../lib/hang-doi-nop'
import { useHangDoiNop } from '../lib/use-hang-doi-nop'

const KHOA_LUU_AUTH = 'omr_student_portal_auth'
/** Hai lệnh màn đăng nhập dùng — lấy từ exam-api (xuất lại từ hs-dang-nhap-api.ts) để phép kiểm giả lập exam-api vẫn chặn được. */
const API_DANG_NHAP: ApiDangNhapHs = { dangNhap: hsDangNhapApi, datMatKhau: hsDatMatKhauApi }

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
    dapAn: String(c?.dapAn || c?.dapAnDung || ''),
    dapAnDung: String(c?.dapAnDung || c?.dapAn || ''),
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

type TabType = 'lichsuca' | 'diem' | 'btvn' | 'mom' | 'khacphuc' | 'vaothi' | 'thanthu' | 'bantin' | 'cauon' | 'caudalam' | 'bia' | 'tuluyen' | 'hoctap' | 'tuchua' | 'kiemtra'

/** Giữ khung bài học trong lúc mảnh mã đang về, tránh giật trang và khoảng trắng. Chữ chờ chỉ hiện khi quá ~800ms (thầy 26/10: tải nhanh không chớp chữ). */
function ChoNapGame() {
  return (
    <div
      className="flex items-center justify-center"
      style={{ minHeight: '60vh', fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)', color: 'var(--nhat)' }}
    >
      <span className="chu-cho-tre">Đang mở bài học…</span>
    </div>
  )
}

/** Chỗ giữ MÀN CON của học sinh (Câu đã làm, Tu luyện, Lịch sử ca) trong lúc mảnh mã về — trung tu 09/10: chữ chờ chung "Đang mở…"
 * (không phải game nên không ghi "Đang mở game…"); nền do khung màn con tô (`khungManCon`). */
function ChoNapManCon() {
  return (
    <div role="status" className="flex items-center justify-center" style={{ minHeight: '60vh', fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)', color: 'var(--nhat)' }}>
      <span className="chu-cho-tre">Đang mở…</span>
    </div>
  )
}

/** Chỗ giữ khung cho khối nạp lười trong sheet (Khắc phục, Bài tập về nhà, Bài gia đình giao — Gói C 15/10): hai thẻ xương M3 như lúc
 * các khối ấy chờ danh sách (BtvnM3 `dangTai`), cùng khe dọc ⇒ không nhảy bố cục. Chỉ hiện khi mảnh chưa nạp trước được (2G / tiết kiệm dữ liệu). */
function ChoKhoiPhu() {
  return (
    <div role="status" aria-busy="true" aria-label="Đang mở…" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--k3, 12px)' }}>
      <div className="m3-xuong" style={{ height: 160 }} />
      <div className="m3-xuong" style={{ height: 160 }} />
    </div>
  )
}

/** Khung toàn màn của màn con học sinh. Game Hoá 2.0 (màn V2): nền --v2-nen ngay từ khung (không chớp màn Sảnh phía sau lúc chờ mảnh mã)
 *  + trượt lên (.tt-mo-lop, thang chung). Cờ tắt ⇒ y như cũ. */
function khungManCon(cheDo2: boolean): { className: string; style: CSSProperties } {
  return {
    className: `fixed inset-0 z-50 overflow-y-auto${cheDo2 ? ' tt-mo-lop' : ''}`,
    style: cheDo2 ? { overscrollBehavior: 'contain', background: 'var(--v2-nen, var(--nen))' } : { overscrollBehavior: 'contain' },
  }
}

/** Giây còn lại của bài gia đình giao: 2 tiếng (7200 giây) kể từ lúc bấm làm. */
function giayConLaiMomTu(mom: { batDauLuc?: string } | null): number {
  if (!mom?.batDauLuc) return 7200
  const daTroiQua = Math.floor((Date.now() - new Date(mom.batDauLuc).getTime()) / 1000)
  return Math.max(0, 7200 - daTroiQua)
}

/** Đồng hồ bài gia đình giao TỰ ĐẾM trong nút lá (28/09): trước đây `setGiayConLaiMom`
 * mỗi giây ở gốc làm CẢ cổng học sinh vẽ lại từng giây suốt 2 tiếng làm bài. */
function DemGioMom({ mom, children }: { mom: { batDauLuc?: string; trangThai?: string } | null; children: (giay: number) => ReactNode }) {
  const kho = useMemo(
    () => (mom?.batDauLuc && mom.trangThai !== 'da_nop' ? taoKhoGio(new Date(mom.batDauLuc).getTime() + 7200_000, Date.now) : null),
    [mom],
  )
  const song = useGiayConLai(kho)
  // 7200 − floor(đã trôi) = ceil(còn lại) — y hệt cách đếm cũ.
  return <>{children(kho ? Math.max(0, Math.ceil(song ?? 0)) : giayConLaiMomTu(mom))}</>
}

export default function StudentPortalScreen() {
  const [auth, setAuth] = useState<ThongTinHs | null>(() => {
    try {
      const luu = localStorage.getItem(KHOA_LUU_AUTH)
      const em = luu ? JSON.parse(luu) : null
      return em?.sbd && typeof em.token === 'string' && em.token ? em : null
    } catch {
      return null
    }
  })
  // Máy dùng chung: đổi phiên dựng cổng mới, dừng nhịp cũ và không nhận phản hồi đang tải của em trước.
  return <CongHocSinh key={auth?.token ?? 'chua-dang-nhap'} auth={auth} setAuth={setAuth} />
}

function CongHocSinh({ auth, setAuth }: { auth: ThongTinHs | null; setAuth: (v: ThongTinHs | null) => void }) {
  const nowHocTap = useGioHocTap()
  // Hộp thoại riêng thay `confirm`/`alert` của trình duyệt (bảng từ ngữ H38): nói việc sẽ làm bằng động từ, không "OK / Hủy".
  const { hoi, bao, hop } = useHopThoai()

  useEffect(()=>{
    if(!auth?.sbd||!auth.token)return
    // Nhịp nền CHẬM + lệch ngẫu nhiên + lùi dần khi lỗi (sự cố D1 21/09 ~20:30: 30 giây × mọi máy em ≈ 38 nghìn lượt/giờ). Quay lại tab / có mạng vẫn cập nhật nhưng chặn dội ≥ 20 giây.
    const nhip=batNhipBenVung(()=>syncStudentExp(auth.sbd,auth.token!))
    const kich=()=>nhip.kich()
    window.addEventListener('focus',kich);window.addEventListener('online',kich);document.addEventListener('visibilitychange',kich)
    return()=>{nhip.dung();window.removeEventListener('focus',kich);window.removeEventListener('online',kich);document.removeEventListener('visibilitychange',kich)}
  },[auth?.sbd,auth?.token])

  // Tab — nếu học sinh thoát bất thình lình (F5 / đóng app) khi đang ở trong màn Làm bài tập, Tự sửa lỗi hoặc Tu luyện và còn bài làm dở trên máy ⇒ mở thẳng lại đúng màn ấy ngay khung vẽ đầu (0ms).
  const docManDangMo = (): { tab: TabType | null; qidChua?: string } => {
    if (!auth?.sbd) return { tab: null }
    try {
      const o = JSON.parse(localStorage.getItem('omr_hs_man_dang_mo_' + auth.sbd) || 'null') as { ngay?: string; tab?: TabType; qidChua?: string; luc?: number } | null
      const nay = Date.now(), ngay = new Date(nay + 7 * 3600_000).toISOString().slice(0, 10)
      if (!o || o.ngay !== ngay || nay - (o.luc || 0) > 105 * 60_000) return { tab: null }
      if (o.tab === 'hoctap' && localStorage.getItem('omr_chang_dang_lam_' + auth.sbd)) return { tab: 'hoctap' }
      if (o.tab === 'tuchua' && (o.qidChua || localStorage.getItem('omr_tu_sua_chon_' + auth.sbd))) return { tab: 'tuchua', qidChua: o.qidChua }
      if (o.tab === 'tuluyen' && localStorage.getItem('ddh.tuluyen.dang.' + auth.sbd)) return { tab: 'tuluyen' }
    } catch { /* bỏ qua */ }
    return { tab: null }
  }
  const [man0] = useState(docManDangMo)
  const [tab, setTabThat] = useState<TabType | null>(man0.tab)
  const setTab = (t: TabType | null) => {
    const m = t === 'thanthu' || t === 'bia' ? 'hoctap' : t
    if (auth?.sbd) {
      try {
        if (m === 'hoctap' || m === 'tuchua' || m === 'tuluyen') {
          const nay = Date.now(), ngay = new Date(nay + 7 * 3600_000).toISOString().slice(0, 10)
          localStorage.setItem('omr_hs_man_dang_mo_' + auth.sbd, JSON.stringify({ ngay, tab: m, qidChua: m === 'tuchua' ? qidChua : undefined, luc: nay }))
        } else if (m === null) {
          localStorage.removeItem('omr_hs_man_dang_mo_' + auth.sbd)
        }
      } catch { /* bỏ qua */ }
    }
    setTabThat(m)
  }
  const [qidChua, setQidChua] = useState<string | undefined>(man0.qidChua)
  // Tấm Hồ sơ làm bài của em, mở từ thẻ "Hôm nay của em" (nút Xem hồ sơ làm bài của em).
  const [moHoSoEm, setMoHoSoEm] = useState(false)
  // «Trong» (bản vẽ hs-mot-trang-menu 26/10): Điểm danh + A.I Đỗ Đại Học vào menu dọc ⇒ không thẻ điểm danh nổi, không nút A.I nổi. Mảnh «Trong» tải hỏng
  // (HocTapHomNay vẽ bản cũ, không menu) ⇒ hai lối nổi cũ quay lại.
  const [trongHs, setTrongHs] = useState(() => !!napTrongHs())
  useEffect(() => { void napTrongHs()?.then((m) => { if (!m) setTrongHs(false) }) }, [])
  // Lịch sử ca mở từ màn Câu đã làm (bản vẽ tối giản 09/10) ⇒ "Về" quay lại Câu đã làm; mở từ chỗ khác ⇒ về màn chính như cũ.
  const [veSauLichSuCa, setVeSauLichSuCa] = useState<TabType | null>(null)
  const [cheDoKhacPhuc, setCheDoKhacPhuc] = useState<1 | 2 | 3 | 4>(1)

  // Dữ liệu ca thi & điểm
  const [dsLichSu, setDsLichSu] = useState<any[]>([])
  const [dangTaiLichSu, setDangTaiLichSu] = useState(false)
  /** Ca đã nộp mà thầy CHƯA công bố (`chuaCongBo` của `/hs/lich-su`) — không điểm, không số câu. null = chưa nạp được lịch sử. */
  const [dsChuaCongBo, setDsChuaCongBo] = useState<any[] | null>(null)

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
  const hoiRoiBaiMom = () => { void hoi({ tieuDe: 'Rời bài đang làm?', noiDung: 'Em quay về danh sách bài. Đồng hồ 2 tiếng vẫn tiếp tục đếm ngược.', nutDongY: 'Rời bài', nutHuy: 'Làm tiếp' }).then((dongY) => { if (dongY) setDangLamMom(null) }) }
  // Việc ÔN CÂU (on_lai) đang làm trong sheet 'cauon': đúng các qid máy chủ chọn, nộp về /hs/on-lai/nop.
  const [cauOn] = useState<{ viecId: string; qid: string[]; tieuDe: string; cauSan?: CauOn[]; duongNop?: string } | null>(null)
  const [cauTraLoiMom, setCauTraLoiMom] = useState<Record<string, string>>({})
  const [thongBaoNopMom, setThongBaoNopMom] = useState<string | null>(null)

  const answersMomRef = useRef(cauTraLoiMom)
  answersMomRef.current = cauTraLoiMom
  // Chỉ thao tác mới chưa ACK được ưu tiên hơn bản máy chủ; nháp cũ đã đồng bộ không đè đáp án máy khác.
  const choDongBoMom = useRef<Record<string, string>>({})
  const luuChoMom = (id: string) => {
    if (!auth) return
    try { localStorage.setItem(`omr_mom_draft_cho_dong_bo_${auth.sbd}_${id}`, JSON.stringify(choDongBoMom.current)) } catch { /* vẫn giữ nháp trong phiên */ }
  }
  const doiTraLoiMom = (qid: string, value: string) => {
    if (!dangLamMom) return
    choDongBoMom.current = { ...choDongBoMom.current, [qid]: value }
    luuChoMom(dangLamMom.id)
    const next = { ...answersMomRef.current, [qid]: value }
    answersMomRef.current = next
    setCauTraLoiMom(next)
  }
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
    let huy = false
    try { localStorage.setItem(`omr_mom_draft_${auth.sbd}_${dangLamMom.id}`, JSON.stringify(cauTraLoiMom)) } catch {}
    const timer = setTimeout(() => {
      void momApi('save', {token:auth.token,id:dangLamMom.id,answers:cauTraLoiMom}).then(() => {
        if (huy) return
        choDongBoMom.current = Object.fromEntries(Object.entries(choDongBoMom.current).filter(([qid, value]) => cauTraLoiMom[qid] !== value))
        luuChoMom(dangLamMom.id)
      }).catch(e => { if (!huy) setLoiMom(`Chưa lưu được đáp án lên máy chủ: ${e.message}`) })
    }, 600)
    return () => { huy = true; clearTimeout(timer) }
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
      // Chỉ soi hết giờ để tự nộp — số hiển thị do `DemGioMom` tự đếm, gốc không vẽ lại.
      const conLai = giayConLaiMomTu(dangLamMom)
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
      let answers: Record<string, string> = capNhat.dapAnDaNop && typeof capNhat.dapAnDaNop === 'object' ? { ...capNhat.dapAnDaNop } : {}
      try {
        const raw = localStorage.getItem(`omr_mom_draft_${auth.sbd}_${bai.id}`) || localStorage.getItem(`omr_mom_draft_${bai.id}_${auth.sbd}`)
        if (raw) {
          const parsed = JSON.parse(raw)
          // API không có mốc sửa từng câu: nháp máy chỉ bù câu trống, không đè đáp án đã lưu trên máy khác.
          const daLuu = Object.fromEntries(Object.entries(answers).filter(([, v]) => typeof v === 'string' && v.trim()))
          answers = { ...(parsed.cauTraLoi || parsed), ...daLuu }
        }
      } catch {}
      const ids = new Set(capNhat.dsCau.map(c => c.id))
      answers = Object.fromEntries(Object.entries(answers).filter(([qid, v]) => ids.has(qid) && typeof v === 'string' && v.length <= 1000))
      let pending: Record<string, string> = {}
      try {
        const raw = JSON.parse(localStorage.getItem(`omr_mom_draft_cho_dong_bo_${auth.sbd}_${bai.id}`) || '{}')
        if (raw && typeof raw === 'object' && !Array.isArray(raw)) pending = Object.fromEntries(Object.entries(raw).filter(([qid, v]) => ids.has(qid) && typeof v === 'string' && v.length <= 1000 && capNhat.dapAnDaNop?.[qid] !== v)) as Record<string, string>
      } catch { /* Metadata nháp hỏng: vẫn dùng bản chính máy chủ. */ }
      choDongBoMom.current = pending
      luuChoMom(bai.id)
      answers = { ...answers, ...pending }
      setCauTraLoiMom(answers)
      if (capNhat.trangThai === 'da_nop') {
        await napDsMom()
        try {
          const rev = await momApi('review', { token: auth.token, id: bai.id })
          if (rev?.item) setPhieuHtml(await momReviewHtml(chuanHoaBaiMom(rev.item)))
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
    const saved = await momApi('submit', {token:auth.token,id:dangLamMom.id,answers:cauTraLoiMom})
    if (saved.item?.id !== dangLamMom.id || saved.item.trangThai !== 'da_nop' || !Number.isFinite(saved.item.diem)) throw new Error('Máy chủ chưa xác nhận kết quả. Em thử nộp lại nhé.')
    // Câu công khai không có đáp án. Chỉ dùng điểm đã chấm; phần chữa lấy qua review sau nộp.
    const confirmed = chuanHoaBaiMom({ ...dangLamMom, ...saved.item, htmlKetQua: '', htmlBaoCao: '' })
    choDongBoMom.current = {}; luuChoMom(dangLamMom.id)
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
    const g = m.goi as { ma?: string; chiSo?: number; dapAn?: Record<string, string>; maCa?: string; doGiay?: Record<string, { g: number }> }
    if (!g.ma || typeof g.chiSo !== 'number' || !g.dapAn) return 'bo'
    const [{ nopChangCaNhan }, { theChangView }] = await Promise.all([import('../lib/btvn-nop-chang-em'), import('../lib/btvn-ca-nhan-kieu')])
    const kq = await nopChangCaNhan({ ma: g.ma, sbd: m.sbd, chiSo: g.chiSo, dapAn: g.dapAn, doGiay: g.doGiay }, g.maCa || 'Riêng')
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

  // Nạp dữ liệu khi đã đăng nhập
  useEffect(() => {
    if (!auth) return
    let huy = false
    setDangTaiLichSu(true)
    setDangTaiBtvn(true)
    void (async () => {
      try {
        const url = await loadScriptUrlHoacMacDinh().catch(() => '')
        if (huy) return
        // Hai nguồn độc lập: nguồn về trước hiện trước; một nguồn mất mạng không chặn nguồn kia.
        await Promise.all([
          hsLichSuCaApi(url, auth.sbd).then(resLs => {
            if (huy || !resLs.ok || !resLs.items) return
            setDsLichSu(resLs.items)
            setDsChuaCongBo(resLs.chuaCongBo ?? [])
          }, () => {}).finally(() => { if (!huy) setDangTaiLichSu(false) }),
          hsBtvnApi(url, auth.sbd).then(resBt => {
            if (huy || !resBt.ok || !resBt.items) return
            setDsBtvn(resBt.items)
          }, () => {}).finally(() => { if (!huy) setDangTaiBtvn(false) }),
        ])
      } finally {
        if (!huy) setDaNapLanDau(true)
      }
    })()

    return () => {
      huy = true
    }
  }, [auth])

  // Đăng nhập (+ đặt mật khẩu lần đầu): màn DangNhapHocSinh (05/10, tách để vỏ app học sinh dựng trước cổng). Cất phiên rồi vào cổng như cũ.
  const daDangNhap = (thongTin: ThongTinHs) => {
    try { localStorage.setItem(KHOA_LUU_AUTH, JSON.stringify(thongTin)) } catch {
      // Bộ nhớ máy bị chặn/đầy: phiên mới vẫn dùng được, cố bỏ bản cũ để không mở nhầm em.
      try { localStorage.removeItem(KHOA_LUU_AUTH) } catch {}
    }
    setAuth(thongTin)
  }

  const dangXuat = async () => {
    try { localStorage.removeItem(KHOA_LUU_AUTH) } catch {
      try { localStorage.setItem(KHOA_LUU_AUTH, '') } catch { /* Vẫn đăng xuất phiên trong bộ nhớ. */ }
    }
    // Đóng cổng của em ngay; bỏ đăng ký thông báo tiếp tục độc lập ở nền.
    setAuth(null)
    try{const r=await navigator.serviceWorker?.getRegistration();const sub=await r?.pushManager?.getSubscription();if(sub&&auth?.token){await noticeApi(auth.token,'unsubscribe',{endpoint:sub.endpoint});await sub.unsubscribe()}}catch{/* Generic push contains no personal data. */}
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
  // GAME HÓA 2.0: hỏi `hoa2-sanh` sau đăng nhập và mỗi lần vừa đóng một màn con (game, Câu đã làm…). `cheDo2` = máy chủ bật cờ cho em
  // (hoặc NHỚ từ lần trước khi đang chờ, để không nháy Bảng nhiệm vụ cũ). Cờ tắt ⇒ mọi thứ dưới đây chạy như cũ.
  const hoa2 = useSanhHoa2(auth?.token, auth?.sbd, lamMoiSheet + lamMoiHang, true)
  const cheDo2 = !!auth?.token && hoa2.cheDo2
  // Tải lại / Pages đổi bản giữa chặng Kiểm tra ôn tập (26/10, em 12095 «load lại thế là mất chặng 1»): màn kiểm tra là lớp phủ do `tab` giữ trong bộ nhớ nên tải lại là
  // về trang chủ còn đồng hồ chặng vẫn chạy ở máy chủ. Máy nhớ chặng em mở dở (khoá `ktcn:lam:<sbd>` ghi bởi lib/ktcn-dang-lam, đọc thẳng ở đây cho nhẹ lượt mở app)
  // ⇒ MỘT lần khi sảnh vừa cho biết bài kiểm tra (đổi `ktSanh.id`), tự mở lại màn kiểm tra; màn ấy mở lại đúng chặng đó (và dọn ghi nhớ đã hết hạn). Em bấm Về / nộp chặng thì ghi nhớ đã xoá.
  const ktSanh = hoa2.ketQua?.cheDo2 && 'sanh' in hoa2.ketQua ? hoa2.ketQua.sanh.kiemTraCaNhan : undefined
  useEffect(() => {
    if (ktSanh && auth && tab === null && localStorage.getItem('ktcn:lam:' + auth.sbd)?.includes(ktSanh.id)) setTab('kiemtra')
  }, [ktSanh?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  // 27/10 tốc độ (thầy: «chỗ bấm kiểm tra phải tức thì»): Sảnh có bài kiểm tra ⇒ lúc rảnh nạp sẵn mảnh màn kiểm tra (từ precache/kho chạy-lúc),
  // bấm là vẽ ngay thẻ tổng quan bằng số Sảnh (prop `ban`), không còn màn chờ nạp mảnh.
  useEffect(() => {
    if (!ktSanh?.id) return
    const nap = () => { void import('../components/hoc-tap/ManKiemTraCaNhan').catch(() => {}) }
    const ric = (globalThis as { requestIdleCallback?: (f: () => void, o?: { timeout: number }) => number }).requestIdleCallback
    if (ric) ric(nap, { timeout: 3000 }); else setTimeout(nap, 1200)
  }, [ktSanh?.id])
  // PHIÊN CŨ KHÔNG CÒN DÙNG ĐƯỢC (07/10: mã bí mật máy chủ đổi ⇒ token cất trong máy bị từ chối "Phiên game không hợp lệ"; nút Thử lại gửi lại đúng token hỏng):
  // máy chủ nói token hỏng / hết hạn / mật khẩu đã đổi ⇒ đăng xuất, màn đăng nhập hiện một dòng giải thích.
  useTuDangXuatKhiPhienHong(!!auth?.token, hoa2.loi, dangXuat)
  // CẨN THẬN (đặc tả 4.6): `hoa2-sanh` báo `omni.canThan` (OMNI bật ∧ Sơ ý > 7%) ⇒ câu ôn Phần III có ô "Soát lại đơn vị và số liệu". Vắng ⇒ y hệt hôm nay.
  const canThanSanh = canThanTuSanh(hoa2.ketQua)
  // MÁY YẾU (30/09, số đo docs/do-toi-uu-app-hs-3009.md): màn toàn màn hình (game, Câu đã làm, Tu luyện…) che kín Sảnh nhưng ~55 hoạt ảnh
  // SVG của cảnh Sảnh vẫn chạy ở LUỒNG CHÍNH mỗi khung (tính kiểu + vẽ lại phần bị che). Gắn lớp `sanh-bi-che` lên <html> ⇒ may-yeu.css TẠM
  // DỪNG các hoạt ảnh ấy (animation-play-state) — không gỡ Sảnh, không đổi trạng thái/chữ; đóng màn là chạy tiếp đúng chỗ cũ.
  useEffect(() => {
    if (!cheDo2 || tab === null) return
    const goc = document.documentElement
    goc.classList.add('sanh-bi-che')
    return () => goc.classList.remove('sanh-bi-che')
  }, [cheDo2, tab])
  // SỬA LỖI 12/10 "không vuốt lên được": có màn con ⇒ khoá trang Hôm nay phía sau, cú vuốt luôn thuộc màn đang nhìn (src/lib/khoa-cuon-trang.ts).
  useKhoaCuonTrang(dangMoManCon)
  // Chỉ nạp trước màn thi sau xác thực, ở Hôm nay và lúc máy rảnh; bấm Vào thi vẫn tải ngay.
  // Gói C 15/10: màn thi về xong thì nạp tiếp mảnh khối phụ (Khắc phục / Bài tập về nhà / Bài gia đình giao) — NỐI SAU, không tranh lượt.
  useEffect(() => {
    if (typeof window === 'undefined' || !auth?.token || dangMoManCon || !nenNapTruoc()) return
    let huy = false
    const cb = () => { if (!huy) void boNapExam().then(() => { if (!huy) return napKhoiPhu() }).catch(() => {}) }
    const hen = ('requestIdleCallback' in window
      ? (window as Window & { requestIdleCallback: (fn: () => void) => number }).requestIdleCallback
      : (fn: () => void) => setTimeout(fn, 1200))(cb)
    return () => {
      huy = true
      if ('cancelIdleCallback' in window) {
        (window as Window & { cancelIdleCallback: (n: number) => void }).cancelIdleCallback(hen)
      } else {
        clearTimeout(hen)
      }
    }
  }, [auth?.token, dangMoManCon])
  const keHoachNgay = useKeHoachNgay({ token: auth?.token, sbd: auth?.sbd }, !!auth, lamMoiSheet + lamMoiHang)
  // Ô "Thi đua hôm nay" (8A): nạp /hs/thi-dua-hom-nay, làm mới mỗi 60 giây khi bảng đang hiện (không có lệnh ⇒ không ô).
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
  const duLieuBang = useMemo(() => (dungBanNho ? banNho! : duLieuNhiemVu), [dungBanNho, banNho, duLieuNhiemVu]) // thẻ Thử thách riêng (Bộ não A.I) đã gỡ 28/09
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
      scriptUrl: scriptUrl || undefined,
    })
    setManThi(true)
  }

  // NẾU CHƯA ĐĂNG NHẬP — màn đăng nhập (cây JSX chép nguyên văn sang DangNhapHocSinh.tsx 05/10; vỏ app học sinh dựng nó trước cổng).
  if (!auth) {
    return <DangNhapHocSinh api={API_DANG_NHAP} onDangNhap={daDangNhap} logo={<LogoDoc vai="hs" size={48} />} />
  }

  // Vỏ M3 của sheet toàn màn: chỉ ở cổng học sinh (dungM3) và không phải game (game thần thú giữ nguyên, test khoá).
  const vaoM3 = dungM3()
  const hoiDangXuat = () => {
    void hoi({ tieuDe: 'Đăng xuất khỏi máy này?', noiDung: 'Lần sau em nhập lại số báo danh và mật khẩu để vào app.', nutDongY: 'Đăng xuất', nutHuy: 'Ở lại' }).then((dongY) => {
      if (dongY) void dangXuat()
    })
  }
  const tieuSheet =
    tab === 'diem' ? 'Kết quả bài đã nộp'
    : tab === 'btvn' ? 'Bài tập về nhà'
    : tab === 'mom' ? 'Bài gia đình giao'
    : tab === 'khacphuc' ? 'Luyện lại từ bài kiểm tra'
    : tab === 'vaothi' ? 'Vào ca kiểm tra trực tuyến'
    : tab === 'cauon' ? 'Ôn câu hôm nay'
    : 'Thông tin từ gia đình'

  const moManCu = (man: TabType) => {
    setTab(man)
    if (man === 'mom') void napDsMom()
    else if (man === 'btvn') void napLaiBtvn()
  }

  // KHI ĐÃ ĐĂNG NHẬP THÀNH CÔNG — MỘT màn "Bảng nhiệm vụ"; mọi màn cũ mở dạng sheet toàn màn.
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {hop}
      {/* ĐIỂM DANH BUỔI HỌC (bảng Dạy học của thầy, 28/09): thẻ nổi khi lớp em có buổi đang mở; quét QR ⇒ tự điểm danh. Không hiện khi đang thi. */}
      {/* + bong bóng A.I Đỗ Đại Học (24/10): chỉ ở Hôm nay, không khi đang thi / mở hồ sơ. */}
      {auth.token && !manThi && tab === null && <>{!trongHs && <TheDiemDanhHs token={auth.token} />}{!moHoSoEm && <Suspense fallback={null}><BongBongAiDdh auth={auth} anBong={trongHs} /></Suspense>}</>}
      {auth.token && !manThi && (
        <div inert={tab !== null} aria-hidden={tab !== null || undefined}><HocTapHomNay nguon={duLieuBang.nguon} dangLamMoi={keHoachNgay.dangLamMoi} thongBao={<ThongBaoHocSinh token={auth.token} onOpen={(t) => { setTab(t); if (t === 'mom') void napDsMom(); if (t === 'btvn') void napLaiBtvn() }} />}
          canhBao={<TheCanhBaoThay vaiTro="hocsinh" now={nowHocTap} canhBao={duLieuBang.canhBaoThay ?? []} onDaXem={cb => void baoDaXemHocSinh(auth.token!, cb.id)} />}
          tienDoCu={duLieuBang.nguon === 'ke_hoach_ngay' ? duLieuBang.tienDo : undefined} ten={auth.hoTen} lop={auth.lop} ketQua={hoa2.ketQua} dangTai={hoa2.dangTai} loi={hoa2.loi}
          coCa={!!caDangMo} soBaiTap={dsBtvn.filter((bt) => !bt?.daNop).length} coBaiTap={dsBtvn.length > 0} token={auth.token} onHoc={() => setTab('hoctap')} onXemLai={() => setTab('caudalam')}
          onChua={(q) => { setQidChua(typeof q === 'string' ? q : undefined); setTab('tuchua') }} onThi={() => { void boNapExam().catch(() => {}); setTab('vaothi') }}
          onTuLuyen={() => setTab('tuluyen')} onLichSu={() => setTab('lichsuca')}
          onKetQua={() => moManCu('diem')} onLuyenLai={() => moManCu('khacphuc')} onBangTin={() => moManCu('bantin')} onBaiTap={() => moManCu('btvn')} onGiaDinh={() => moManCu('mom')} onTaiLai={hoa2.taiLai} onDangXuat={hoiDangXuat}
          onMoHoSo={() => setMoHoSoEm(true)} onKiemTra={() => setTab('kiemtra')} moDiemDanh={tab === null}
        /></div>
      )}
      {moHoSoEm && auth.token && tab === null && !manThi && <Suspense fallback={null}><HoSoCuaEmHs token={auth.token} tenEm={auth.hoTen ?? ''} lop={auth.lop ?? undefined} onDong={() => setMoHoSoEm(false)} onChuaCau={(qid) => { setMoHoSoEm(false); setQidChua(qid); setTab('tuchua') }} onMoBaiTap={() => { setMoHoSoEm(false); setTab('hoctap') }} /></Suspense>}
      {tab === 'hoctap' && auth.token && !manThi && <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain"><Suspense fallback={<ChoNapGame />}><ManLamBaiTap token={auth.token} sbd={auth.sbd} onVe={() => setTab(null)} onCapNhat={hoa2.taiLai} onVa={hoa2.va} onChua={(qid) => { setQidChua(qid); setTab('tuchua') }} homNay={soHomNay(hoa2.ketQua, duLieuBang.nguon === 'ke_hoach_ngay' ? duLieuBang.tienDo : undefined)} /></Suspense></div>}
      {tab === 'kiemtra' && auth.token && !manThi && ktSanh && <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain"><Suspense fallback={<ChoNapGame />}><ManKiemTraCaNhan token={auth.token} sbd={auth.sbd} id={ktSanh.id} ban={ktSanh} onVe={()=>setTab(null)} onCapNhat={hoa2.taiLai} onVa={hoa2.va}/></Suspense></div>}
      {tab === 'tuchua' && auth.token && !manThi && <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain"><Suspense fallback={<ChoNapGame />}><ManTuChua token={auth.token} qid={qidChua} onVe={() => setTab(null)} onTuLuyen={() => setTab('tuluyen')} /></Suspense></div>}

      {/* FULLSCREEN CHỨC NĂNG: BẤM VÀO MỞ FULL MÀN HÌNH */}
      {/* CÂU ĐÃ LÀM (Game Hóa 2.0): màn riêng toàn màn hình, có nút "Về Hôm nay" của chính nó. */}
      {/* LỊCH SỬ CA KIỂM TRA (thẻ nhỏ trên Sảnh): màn riêng toàn màn hình, lazy ngoài precache. */}
      {tab === 'lichsuca' && (
        <div {...khungManCon(cheDo2)}>
          <Suspense fallback={<ChoNapManCon />}>
            <LichSuCaEm
              sbd={auth.sbd}
              scriptUrl={scriptUrl}
              banDau={dsChuaCongBo !== null ? { items: dsLichSu, chuaCongBo: dsChuaCongBo } : null}
              onVe={() => {
                setTab(veSauLichSuCa)
                setVeSauLichSuCa(null)
              }}
            />
          </Suspense>
        </div>
      )}
      {tab === 'caudalam' && auth.token && (
        <div {...khungManCon(cheDo2)}>
          <Suspense fallback={<ChoNapManCon />}>
            {/* Bản vẽ tối giản 09/10: thẻ "Ca kiểm tra gần nhất" chuyển từ Sảnh sang đầu màn Câu đã làm — cùng số, cùng lối vào Lịch sử ca. */}
            <CauDaLamNhanh
              token={auth.token}
              hoTen={auth.hoTen}
              sbd={auth.sbd}
              lop={auth.lop}
              onVe={() => setTab(null)}
              caGanNhat={cheDo2 && dsChuaCongBo !== null ? chuTheCaGanNhat(dungLichSuCa(dsLichSu, dsChuaCongBo)) : null}
              onLichSuCa={
                cheDo2
                  ? () => {
                      setVeSauLichSuCa('caudalam')
                      setTab('lichsuca')
                    }
                  : undefined
              }
            />
          </Suspense>
        </div>
      )}

      {/* TU LUYỆN (cửa trên Sảnh): 4 chế độ luyện tự do, không tính EXP — màn riêng toàn màn hình, nút "Về Hôm nay" của chính nó. */}
      {tab === 'tuluyen' && auth.token && (
        <div {...khungManCon(cheDo2)}>
          <Suspense fallback={<ChoNapManCon />}>
            <ManTuLuyenNhanh token={auth.token} sbd={auth.sbd} onVe={() => setTab(null)} />
          </Suspense>
        </div>
      )}

      {tab !== null && tab !== 'kiemtra' && tab !== 'hoctap' && tab !== 'tuchua' && tab !== 'caudalam' && tab !== 'lichsuca' && tab !== 'tuluyen' && (
        <div
          className={`${vaoM3 ? 'm3 m3-sheet ' : ''}fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 overflow-y-auto overscroll-contain flex flex-col animate-google-fade`}
        >
          {/* Header Toàn Màn Hình. Cổng học sinh (mọi màn cũ trừ game) dùng thanh trên M3 dùng chung; mọi đường khác giữ đúng cái cũ. */}
          {vaoM3 && (
            <ThanhTren
              tieuDe={tieuSheet}
              onQuayLai={() => setTab(null)}
              nhanQuayLai={'Về ' + (trongHs ? 'Lộ trình' : 'Hôm nay')} /* Boss 27/10: trang chính giao diện Trong là Lộ trình */
              phai={
                <button type="button" onClick={() => setTab(null)} className="m3-nut-chu" title="Đóng toàn màn hình">
                  <X size={18} aria-hidden="true" />
                  <span>Đóng</span>
                </button>
              }
            />
          )}
          {!vaoM3 && <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-2 shadow-xs">
            <NutQuayLai onClick={() => setTab(null)} label="Về Hôm nay" />

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
            <Suspense fallback={<div className="m3-xuong" style={{ height: 160 }} />}>
            <BangTinPhuHuynh tapTrungHoc
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
            </Suspense>
          )}

          {/* TAB 1: XEM ĐIỂM */}
          {tab === 'diem' && vaoM3 && (
            <Suspense fallback={<ChoKhoiPhu />}>
            <LichSuCaM3
              dangTai={dangTaiLichSu}
              ds={dsLichSu}
              ngayGio={dinhDangNgayGio}
              dongDem={(item) => <DongDemCau so={item as any} />}
              dangMoDe={dangMoDe}
              onXemBaoCao={(item) => setCaXemBaoCaoModal(item as any)}
              onXemDe={(maCa) => void moDeVaLoiGiai(maCa)}
            />
            </Suspense>
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
                <span className="text-sm">Đang tải lịch sử kiểm tra…</span>
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
          <Suspense fallback={<ChoKhoiPhu />}>
          <BtvnM3
            dangTai={dangTaiBtvn}
            ds={dsBtvn}
            now={nowHocTap}
            dangMoId={dangMoBai}
            ngayGio={dinhDangNgayGio}
            onMo={(bt, lamLai) => void moBaiTap(bt, lamLai)}
            onTaiLai={() => void napLaiBtvn()}
          />
          </Suspense>
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
                <span className="text-sm">Đang tải danh sách bài tập…</span>
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
                              <span>Đang mở…</span>
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
          <Suspense fallback={<ChoKhoiPhu />}>
            {dangLamMom ? (
              <DemGioMom mom={dangLamMom}>{(giayConLaiMom) => (
              <MomLamBaiM3
                tieuDe={dangLamMom.tieuDe}
                giayConLai={giayConLaiMom}
                dinhDangThoiGian={dinhDangThoiGianMom}
                soDaLam={Object.keys(cauTraLoiMom).length}
                dsCau={dangLamMom.dsCau || dangLamMom.cau || []}
                traLoi={cauTraLoiMom}
                datTraLoi={doiTraLoiMom}
                loi={loiMom}
                onQuayLai={hoiRoiBaiMom}
                onTamDung={() => {
                  try {
                    localStorage.setItem(`omr_mom_draft_${dangLamMom.id}_${auth.sbd}`, JSON.stringify({
                      cauTraLoi: cauTraLoiMom,
                      luuLuc: new Date().toISOString(),
                      giayConLai: giayConLaiMomTu(dangLamMom),
                    }))
                  } catch {}
                  void bao('Bài của em đã được lưu nháp. Em vào làm tiếp bất cứ lúc nào trước Hạn nộp.', 'Đã lưu nháp')
                  setDangLamMom(null)
                }}
                onNop={nopBaiCuaMom}
              />
              )}</DemGioMom>
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
                  // Phiếu cũ trong máy có thể từng tự đoán đáp án; chỉ mở phần chữa máy chủ xác nhận sau nộp.
                  try { const data = await momApi('review', { token: auth?.token, id: bai.id }); setPhieuHtml(await momReviewHtml(chuanHoaBaiMom(data.item))) }
                  catch (e) { setLoiMom(e instanceof Error ? e.message : 'Chưa tải được kết quả.') }
                }}
              />
            )}
          </Suspense>
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
                    <DemGioMom mom={dangLamMom}>{(giayConLaiMom) => (
                    <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full font-mono text-xs font-bold border transition-colors ${
                      giayConLaiMom < 900
                        ? 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800 animate-pulse'
                        : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                    }`}>
                      <Timer className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      <span>Thời gian làm còn: {dinhDangThoiGianMom(giayConLaiMom)}</span>
                    </div>
                    )}</DemGioMom>

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
                            giayConLai: giayConLaiMomTu(dangLamMom),
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

                        {cau.phan === 'II' ? <div className="space-y-3">{(cau.ideas || cau.luaChon || cau.choices || []).map((idea:string,i:number)=><div key={i} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-3"><MomOption q={cau} index={i} text={`${String.fromCharCode(97+i)}) ${idea}`} tf /><div className="mt-2 flex gap-2">{['D','S'].map(v=><button key={v} onClick={()=>{const a=(answersMomRef.current[cau.id]||'----').split('');a[i]=v;doiTraLoiMom(cau.id,a.join(''))}} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${daChon?.[i]===v?'bg-rose-600 text-white shadow-xs':'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'}`}>{v==='D'?'Đúng':'Sai'}</button>)}</div></div>)}</div> : Array.isArray(cau?.choices) && cau.choices.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                            {cau.choices.map((choice: string, cIdx: number) => {
                              const kyTu = String.fromCharCode(65 + cIdx)
                              const duocChon = daChon === kyTu
                              return (
                                <button
                                  key={cIdx}
                                  type="button"
                                  onClick={() =>
                                    doiTraLoiMom(cau.id, kyTu)
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
                            <OSoTraLoi
                              id={`cp-tl-${cau.id}`}
                              inputMode="text"
                              className="sm:w-80"
                              value={daChon || ''}
                              onChange={(v) => doiTraLoiMom(cau.id, v)}
                              placeholder="Nhập đáp án số hoặc chữ…"
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
                                  // Phiếu cũ trong máy có thể từng tự đoán đáp án; chỉ mở phần chữa máy chủ xác nhận sau nộp.
                                  try { const data = await momApi('review', {token:auth?.token,id:bai.id}); setPhieuHtml(await momReviewHtml(chuanHoaBaiMom(data.item))) }
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
              <Suspense fallback={<ChoNapGame/>}><LuyenDeChuan sbd={auth.sbd} token={auth.token} /></Suspense>
            </div>
            <div>
              <Suspense fallback={<ChoKhoiPhu />}>
              <KhoiKhacPhuc3CheDo
                sbd={auth.sbd}
                token={auth.token}
                hoTen={auth.hoTen}
                dsLichSu={dsLichSu}
                scriptUrl={scriptUrl}
                initialCheDo={cheDoKhacPhuc}
                lop={auth.lop}
              />
              </Suspense>
            </div>
          </div>
        )}

        {/* ÔN CÂU HÔM NAY (việc on_lai): lấy đề → làm → nộp → lời giải. Đóng sheet thì màn cổng hỏi lại kế hoạch ngày. */}
        {tab === 'cauon' && cauOn && auth && auth.token && (
          <Suspense fallback={<div className="m3-xuong" style={{ height: 160 }} />}>
            <LamCauOn token={auth.token} sbd={auth.sbd} viecId={cauOn.viecId} qid={cauOn.qid} tieuDe={cauOn.tieuDe} cauSan={cauOn.cauSan} duongNop={cauOn.duongNop} onXong={() => setTab(null)} xepHang={(m) => hangNop.them({ id: m.id, loai: 'on_cau', sbd: auth.sbd, goi: m.goi })} {...(canThanSanh ? { canThan: true } : {})} />
          </Suspense>
        )}

        {/* TAB 4: VÀO PHÒNG THI */}
        {tab === 'vaothi' && !manThi && (
          <PhongVaoThi onClose={() => setTab(cheDo2 ? null : 'diem')}>
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
                    aria-label="Mã ca kiểm tra"
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
                    aria-label="Mật khẩu ca kiểm tra"
                    type="password"
                    value={matKhauCaVaoThi}
                    onChange={(e) => setMatKhauCaVaoThi(e.target.value)}
                    placeholder="Để trống nếu ca không có mật khẩu"
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
        <div className="fixed inset-0 z-[60] overflow-y-auto overscroll-contain bg-white dark:bg-slate-950 man-thi-phu" style={{ '--thi-le-phai': '52px' } as React.CSSProperties}>
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
              hangNop.them({ id: idHang, loai: 'btvn_chang', sbd: auth.sbd, goi: { ma: tin.ma, chiSo: tin.chiSo, dapAn: tin.dapAn, maCa: maCaPhieuRef.current, doGiay: tin.doGiay } })
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

      {/* BÁO CÁO CHI TIẾT CA — BẢN MỚI (BaoCaoChiTiet chế độ em, thầy 28/09 "thay thế hết bằng bản mới"). */}
      {caXemBaoCaoModal && auth && (
        <Suspense fallback={<ChoNapGame />}>
          <BaoCaoCaCuaEm
            maCa={String(caXemBaoCaoModal.maCa)}
            tenCa={caXemBaoCaoModal.tenCa}
            sbd={auth.sbd}
            scriptUrl={scriptUrl}
            lichSu={dsChuaCongBo !== null ? { items: dsLichSu, chuaCongBo: dsChuaCongBo } : null}
            onDong={() => setCaXemBaoCaoModal(null)}
            onKhacPhuc={(maCa) => {
              setCaXemBaoCaoModal(null)
              setTab('khacphuc')
              void taoDeKhacPhuc([maCa])
            }}
            onMoLaiBaiThi={(maCa) => void moDeVaLoiGiai(maCa)}
          />
        </Suspense>
      )}

      {/* Modal Khắc phục câu sai chuẩn hoá 3 lựa chọn */}
      {dsCauSaiKhacPhucModal && auth && (
        <Suspense fallback={null}>
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
        </Suspense>
      )}
    </div>
  )
}
