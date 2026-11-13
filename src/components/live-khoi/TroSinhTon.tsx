// TRÒ «SINH TỒN · TRANG VỞ» (bản 2 — thầy duyệt bản vẽ 13/11: docs/ban-ve-sinh-ton-v2-1311/, đặc tả docs/dac-ta-sinh-ton-v2-1311.md) ở phòng chờ Live theo khối
// và phòng chờ ca kiểm tra (bản ÊM). Bốn đội, mỗi em một bé ma vẽ tay đeo súng tự bắn đối thủ gần nhất; KHÔNG có nút điều khiển: vuốt ở đâu cũng chạy, chạm một
// điểm thì tự chạy tới. Luật nằm cả ở LÕI THUẦN src/lib/live-khoi/sinh-ton-loi.ts; tệp này chỉ lo: MỘT canvas (vòng requestAnimationFrame, tab ẩn ⇒ dừng),
// cử chỉ, kênh lớp, vài lớp DOM phủ (băng dính điểm, tin hạ, con dấu câu hô, giấy nhớ bản đồ). Nền LUÔN TỐI (--st-*), máy bù mang tên như học sinh (tenMay).
// Máy yếu / giảm chuyển động ⇒ 30 khung / giây + kiểu phẳng. Lượt hạ trong trò KHÔNG cộng vào kJ buổi học.
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as SuKienTro } from 'react'
import { DOI_BPU } from '../../lib/bpu/phong'
import { toaDoXoay } from '../live/chieu-xoay'
import type { KenhLop, NguoiLop, SinhTonAnh, TinLop } from '../../lib/live-khoi/kieu'
import {
  ANH_MS, BAT_TU_MS, CAP_TOI_DA, HOP_BK, KHIEN_MS, MAU_DAY, NHANH_MS, NHIP_BAN_MS, NHIP_GUI_MS, NHIP_NHAC_MS, SAO_MS, SUNG_TEN, VAN_MS, apHop, buocToi, capSung, chonMucTieu, anVoi,
  coKhien, conLai, dangAn, dangChet, dangNghi, dangNhanh, docDong, hopSo, laMay, loaiHop, ngoaiVong, nhanDon, satThuong, taoBanDo, taoToi, timDuong, trongBui, vanSo, vong,
  type BanDo, type Diem, type LoaiHop, type NhanVat, type Toi,
} from '../../lib/live-khoi/sinh-ton-loi'
import { tenMay } from '../../lib/live-khoi/ten-may'
import { MAU_SINH_TON } from '../../lib/live-khoi/mau'
import { datTat, datYeuAm, docTat, moAm, tieng, tiengBan } from './sinh-ton-am'
import { BoHinh, taoBangMau, type BangMau, type Rgb } from './sinh-ton-hinh'
import { BoO, taoBoSan, type BoSan } from './sinh-ton-san'
import {
  BIEU_CAM, BoTen, HIEN_MS, KY_BIEU_CAM, MUC_MS, THE_HOP, XEP_DOI, bamSo, camNhin, cauChuoi, chamMaEm, diemMaEm, duoiBiHa, taoGoi, tiMan, veBanDoNho, veKhung, type Hieu, type NvVe,
} from './sinh-ton-ve'
import './tro-giu-lua.css'
import './tro-sinh-ton.css'

export interface TroSinhTonProps {
  /** Em đang chơi; `null` khi `xemThoi` (máy thầy). */ toi: NguoiLop | null
  /** Cả phòng: tên + đội theo số báo danh. */ ds: readonly NguoiLop[]
  kenh: KenhLop
  soEm: number
  mayYeu?: boolean
  /** Khung cha đang bị XOAY HÌNH bằng CSS (điện thoại cầm dọc; chiều xoay theo src/components/live/chieu-xoay.ts) ⇒ đổi toạ độ con trỏ về hệ của khung. */ xoay?: boolean
  /** Máy thầy xem trận: thấy CẢ sân, không có bé ma của mình, không gửi gì. */ xemThoi?: boolean
  /** Phòng chờ CA KIỂM TRA: tiếng trò mặc định TẮT (thầy 27/10: màn kiểm tra tự tắt âm thanh); em bấm nút loa thì bật cho lượt chơi này. */ imLang?: boolean
  /** BẢN ÊM phòng chờ ca kiểm tra (đặc tả: ngay trước giờ kiểm tra thật): không con dấu câu hô, không rung, không chớp, KHÔNG chữ «trượt». Khác `imLang` (chỉ là tiếng). */ banEm?: boolean
}

interface ManhTin { c: string; doi?: number; noi?: boolean }
interface TinTran { id: number; het: number; manh: ManhTin[] }
interface Bao { kieu: 'meo' | 'an' | 'canh' | 'vui'; chu: string }
interface BiHa { ai: string; doi: number; giay: number }
interface KetQua { van: number; hang: { doi: number; diem: number; nhat: string; xep: number }[] }
/** Câu hô dạng con dấu đỏ (vàng cho câu mừng). */
interface Dau { id: number; chu: string; phu: string; vang: boolean }
/** Nhân vật khác đang nội suy giữa hai ảnh chụp; `hl` = lúc bắt đầu hiện ra (0 = không), `hs` = hiện kiểu sống lại.
 *  `giu` = dòng GIỮ LẠI từ ảnh trước vì ảnh vừa nhận là ảnh mỏng (`m: 1`) — chỉ để vẽ, KHÔNG dùng ngắm / tính sát thương (hợp đồng kieu.ts). */
interface NoiSuy { nv: NhanVat; tx: number; ty: number; luc: number; goc: number; hl: number; hs: boolean; giu: boolean }
/** Dải báo truy nã thủ khoa (ảnh 07). */
interface TruyNa { id: number; ten: string; ha: number; em: boolean }
/** Bảng vàng (5 giây nghỉ): top 3 em thật (`bv`), hạng của em (`hg`), ai đã diệt thủ khoa trong ván. */
interface DongVang { ten: string; ha: number; doi: number; em: boolean; tk: boolean }
interface Vang { top: DongVang[]; hg: number; haEm: number; dietTk: string[] }

/** Bán kính «cần ảo» vô hình (px): kéo xa chừng này là chạy hết tốc. */
const BK_CAN = 46
const VUNG_CHET = 0.14
/** Ngón tay xê dịch quá chừng này (px) thì là VUỐT, chưa tới thì là CHẠM. */
const NGUONG_KEO = 12
const CHAM_MS = 350
const TIN_SONG_MS = 6000
const DAU_MS = 1900
const PHIM: Record<string, [number, number]> = {
  KeyW: [0, -1], ArrowUp: [0, -1], KeyS: [0, 1], ArrowDown: [0, 1], KeyA: [-1, 0], ArrowLeft: [-1, 0], KeyD: [1, 0], ArrowRight: [1, 0],
}

const kepDoi = (d: number): number => (d >= 0 && d < 4 ? Math.floor(d) : 0)
/** Hai chữ cuối của tên (tên gọi của người Việt), cắt ở 16 ký tự cho gọn trên sân. */
const tenNgan = (ten: string): string => { const s = ten.trim().split(/\s+/).slice(-2).join(' '); return s.length > 16 ? `${s.slice(0, 15)}…` : s }
const chuGio = (ms: number): string => { const s = Math.ceil(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` }
const bienDoi = (d: number): CSSProperties => ({ ['--doi' as string]: `var(${DOI_BPU[kepDoi(d)].mau})` }) as CSSProperties
const hoa = (s: string): string => s.toLocaleUpperCase('vi')

/** Đổi chuỗi màu trình duyệt đã tính (`rgb(…)` hoặc `color(srgb …)`) thành ba số 0..255. */
function tachMau(chuoi: string, macDinh: Rgb): Rgb {
  const so = chuoi.match(/-?\d*\.?\d+(?:e-?\d+)?/g)
  if (!so || so.length < 3) return macDinh
  const he = chuoi.startsWith('color(') ? 255 : 1
  const v = so.slice(0, 3).map((x) => Math.max(0, Math.min(255, Math.round(Number(x) * he))))
  return [v[0], v[1], v[2]]
}
/** Đọc bảng màu từ biến CSS tại đúng chỗ trò đang đứng: nền / chữ từ --st-* (luôn tối), đội + trạng thái từ token. */
function docBangMau(goc: HTMLElement): BangMau {
  const que = document.createElement('span')
  que.style.display = 'none'
  goc.appendChild(que)
  const doc = (bien: string, macDinh: Rgb): Rgb => {
    que.style.color = ''
    que.style.color = `var(${bien})`
    return que.style.color ? tachMau(getComputedStyle(que).color, macDinh) : macDinh
  }
  const bang = taoBangMau(doc, tachMau(getComputedStyle(goc).color, [128, 128, 128]))
  que.remove()
  return bang
}

/** Máy này vừa vẽ không kịp ⇒ nhớ 1 ngày để lần sau vào là kiểu phẳng ngay (không phải chịu vài giây đầu giật); hết hạn thì thử lại. */
const KHOA_PHANG = 'ddh.sinhton.phang'
function docPhang(): boolean {
  try { const luc = Number(localStorage.getItem(KHOA_PHANG)); return luc > 0 && Date.now() - luc < 86_400_000 } catch { return false }
}
function ghiPhang(): void { try { localStorage.setItem(KHOA_PHANG, String(Date.now())) } catch { /* không có kho */ } }

/** Máy YẾU theo phần cứng, nhận NGAY từ đầu (khỏi chịu vài giây đầu giật): ≤ 3 GB RAM (chỉ Chrome Android khai) hoặc ≤ 2 lõi.
 *  KHÔNG coi «4 lõi» là yếu, và KHÔNG tin số lõi trên iPhone / iPad (Safari có thể khai số lõi thấp hơn thật) — nhiều máy 4 lõi vẫn chạy đủ hình; máy nào giật thật
 *  thì bộ tự hạ (hai cửa sổ < 48 khung / giây) bắt sau ~2 giây và nhớ theo máy. Trình duyệt không khai (`undefined`) thì không đoán. */
function phanCungYeu(): boolean {
  try {
    const n = navigator as Navigator & { deviceMemory?: number }
    const lo = n.hardwareConcurrency, ram = n.deviceMemory, ios = /iPhone|iPad|iPod/.test(n.userAgent)
    return (typeof ram === 'number' && ram > 0 && ram <= 3) || (!ios && typeof lo === 'number' && lo > 0 && lo <= 2)
  } catch { return false }
}

/** Hình bé ma của một đội (bảng hết ván; `to` = phóng — bục bảng vàng máy thầy; `vuong` = đội vương miện thủ khoa). Hình hộp (`hop`) = thẻ báo nhặt hộp. */
function AnhMa({ bang, doi, to = 1, vuong = false, hop }: { bang: BangMau; doi: number; to?: number; vuong?: boolean; hop?: LoaiHop }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cv = ref.current, g = cv?.getContext('2d')
    if (!cv || !g) return
    const dpr = Math.min(2, window.devicePixelRatio || 1), k = 0.44 * to, w = 30 * to, h = (38 + (vuong ? 12 : 0)) * to, dat = to * 36 + (vuong ? 12 * to : 0)
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr)
    if (to !== 1 || vuong) { cv.style.width = `${w}px`; cv.style.height = `${h}px` }
    const kk = hop ? 0.56 * to : k, bh = new BoHinh(bang, kk * dpr, false), a = hop ? bh.hop(hop) : bh.ma(doi, false, 0)
    g.setTransform(dpr, 0, 0, dpr, 0, 0)
    g.clearRect(0, 0, w, h)
    if (hop) g.drawImage(a.c, (w - a.w * kk) / 2, (h - a.h * kk) / 2, a.w * kk, a.h * kk)
    else g.drawImage(a.c, w / 2 - a.ox * k, dat - a.oy * k, a.w * k, a.h * k)
    if (vuong) { const v = bh.vuong(); g.drawImage(v.c, w / 2 - v.ox * k, dat - 64 * k - v.oy * k, v.w * k, v.h * k) }
  }, [bang, doi, to, vuong, hop])
  return <canvas ref={ref} className="st-ma" aria-hidden="true" />
}

export default function TroSinhTon({ toi, ds, kenh, soEm, mayYeu = false, xoay = false, xemThoi = false, imLang = false, banEm = false }: TroSinhTonProps) {
  const xem = xemThoi || !toi
  const sbd = toi?.sbd ?? ''
  const doiToi = kepDoi(toi?.doi ?? 0)
  const gocRef = useRef<HTMLDivElement>(null)
  const rungRef = useRef<HTMLDivElement>(null)
  const vaiRef = useRef<HTMLCanvasElement>(null)
  const nhoRef = useRef<HTMLCanvasElement>(null)
  /** Đầu vào đang giữ: hướng vuốt, bàn phím, và một lần CHẠM chờ khung kế tiếp đổi ra toạ độ sân. */
  // `ma` / `ti` = tâm thân bé ma của em trên khung + tỉ lệ (vòng khung ghi; null = không chạm được: đang bị hạ / máy thầy) — chạm trúng ⇒ mở nhãn biểu cảm.
  // `e` = biểu cảm chờ gửi (-1 = không), `moBc` = lúc mở bốn nhãn (0 = đóng).
  const vao = useRef({ cx: 0, cy: 0, phim: {} as Record<string, boolean>, id: -1, gx: 0, gy: 0, t0: 0, keo: false, cham: null as Diem | null, daDung: false, ma: null as Diem | null, ti: 1, e: -1, moBc: 0 })
  const dsRef = useRef(ds)
  const [diem, setDiem] = useState<[number, number, number, number]>([0, 0, 0, 0])
  const [gio, setGio] = useState({ van: 1, con: '2:00' })
  const [tin, setTin] = useState<TinTran[]>([])
  const [bao, setBao] = useState<Bao | null>(null)
  const [cap, setCap] = useState(1)
  const [biHa, setBiHa] = useState<BiHa | null>(null)
  const [ketQua, setKetQua] = useState<KetQua | null>(null)
  const [bang, setBang] = useState<BangMau | null>(null)
  const [dau, setDau] = useState<Dau | null>(null)
  const [truyNa, setTruyNa] = useState<TruyNa | null>(null)
  const [theHop, setTheHop] = useState<{ id: number; loai: LoaiHop } | null>(null)
  /** Pháo Sao TẠM (hộp tiếp tế): số giây còn lại, 0 = không. */
  const [sao, setSao] = useState(0)
  /** Bốn nhãn biểu cảm đang mở quanh bé ma của em (toạ độ khung). */
  const [bieuCam, setBieuCam] = useState<Diem[] | null>(null)
  const [vang, setVang] = useState<Vang | null>(null)
  const [tatTieng, setTatTieng] = useState(() => { if (!imLang) return docTat(); datTat(true, false); return true })

  useEffect(() => { dsRef.current = ds }, [ds])

  useEffect(() => {
    const goc = gocRef.current, vai = vaiRef.current
    const g = vai?.getContext('2d', { alpha: false })
    if (!goc || !vai || !g) return
    const giam = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const nhe = mayYeu || giam
    const nhipKhung = nhe ? 1000 / 30 : 0
    /** MÁY YẾU = khai báo / giảm chuyển động / phần cứng yếu / đã tự hạ từ lần trước ⇒ vẽ dpr 1, kiểu phẳng, ít hạt, ít tiếng. Tự hạ giữa chừng cũng vào đây. */
    let yeu = nhe || phanCungYeu() || docPhang()
    datYeuAm(yeu)
    const hat = bamSo(sbd) / 997
    let conSong = true
    /** Đội của em THEO PHÒNG (dòng của chính em trong ảnh chụp là chuẩn): phòng vừa chia lại đội mà máy chưa kịp nhận thì vẫn không bắn nhầm đồng đội. */
    let doiEm = doiToi

    // ── Trạng thái trò (không qua React: đổi 60 lần / giây) ──
    let bd: BanDo = taoBanDo(0)
    let tt: Toi = taoToi(bd, doiEm, Date.now(), hat)
    let noi: Record<string, NoiSuy> = {}
    /** Lệch giờ phòng so với đồng hồ máy (ms), làm mượt theo dấu `l` của từng ảnh chụp. */
    let lech = 0, coLech = false
    let lucAnh = 0, soAnh = 0
    let mucTieu = '', lucNgam = 0, huong = 0, gioEm = NaN
    /** `choA` = mã kẻ hạ em còn chờ báo phòng; `keHa` = kẻ hạ em ở lượt này ('' = hết máu ngoài vòng). */
    let choA = '', keHa = '', choH = -1
    let vanHien = 1, lucNho = 0
    let hop: [number, string] = [-1, '']
    /** Hiệu ứng hộp của NGƯỜI KHÁC (suy từ `h` + `loaiHop` + thời gian, hợp đồng kieu.ts): người nhặt hộp gần nhất và mốc hết khiên / chạy nhanh (giờ phòng). */
    let hh = { id: '', khienDen: 0, nhanhDen: 0 }
    let lucGui = 0, khoaGui = ''
    let chetCu = false, nghiCu = false, vanKq = -1
    const soHa = new Map<string, number>()
    let haVan = 0, vanThuBai = -1
    /** Thủ khoa đang bị truy nã (`tk`), người đã diệt thủ khoa trong ván, chấm đồng đội ở xa (`dd`), biểu cảm còn hiệu lực (`bc`). */
    let tk = '', soTruy = 0, henTruy = 0, henHop = 0, soTheHop = 0, lucChan = 0
    let dietTk: string[] = []
    let dd: readonly number[] = []
    let bc: Record<string, number> = {}
    /** Biểu cảm của chính em hiện ngay (khỏi chờ phòng): chữ + hết lúc (đồng hồ khung). `lucBcEm` = lần gửi gần nhất (phòng nhận 1 lần / 2 giây). */
    let bcEm = { chu: '', het: 0 }, lucBcEm = -1e9
    let bvCu = '', saoCu = 0
    /** Vào / rời phòng chỉ đọc từ danh sách lớp (`lop-ds` / `st-ds` ⇒ prop `ds`), không đọc từ ảnh chụp («chỉ gửi gần»: người vào / ra `ds` là chuyện thường). */
    const daBiet = new Set(ds.map((n) => n.sbd))
    let dsCu = dsRef.current
    /** Dòng của ẢNH VỪA NHẬN (không gồm em) — chỉ những dòng này được tính sát thương; `khacBan` = nhân vật khác lúc vẽ trừ dòng giữ lại (để ngắm). */
    const dongAnh: NhanVat[] = []
    const khacBan: NhanVat[] = []
    let hieu: Hieu[] = []
    const lucMuc = new Map<string, number>()
    /** Bé ma của em đang hiện ra (vào trận / sống lại) từ lúc này (đồng hồ khung hình); 0 = không. Em vào giữa ván ⇒ hiện kiểu sống lại. */
    let hienEm = performance.now(), hienSong = true
    let dsTin: TinTran[] = [], soTin = 0, soDau = 0, henDau = 0
    let vui: { chu: string; het: number } | null = null
    let baoCu = '', diemCu = '', gioCu = '', capCu = 1, haCu = ''
    const lucMo = performance.now()
    const khac: NhanVat[] = []
    const nvVe: NvVe[] = []
    /** Nhịp bắn gần nhất đã kêu của từng nhân vật (tiếng súng đi cùng nhịp đạn trên màn). */
    const nhipBan = new Map<string, number>()
    let lucTrungTieng = 0

    // ── Khung vẽ ──
    let W = 0, H = 0, ti = 1, dpr = 1
    let bm = docBangMau(goc)
    /** KIỂU PHẲNG: máy yếu ngay từ đầu, hoặc TỰ HẠ khi máy vẽ không kịp (xem vòng khung) ⇒ bé ma 1 khung, không khối 3D / bóng đổ, không nhún. */
    let phang = yeu
    if (phang) goc.setAttribute('data-phang', '1')
    let hinh = new BoHinh(bm, 1, phang)
    let san: BoSan = taoBoSan(g, bm, 1)
    /** Ô nướng sẵn lớp dưới (nền + trang; kiểu phẳng cả vật chặn); trần bộ nhớ theo máy. */
    let oSan: BoO | null = null
    let phiVe = 0
    let bangTen = new BoTen(bm, 1, 13)
    /** Đo theo từng cửa sổ 0,6 giây (bỏ 1 giây đầu lúc còn nướng ảnh, app còn bận việc mở phòng): `cuaXau` = số cửa sổ liền nhau dưới 48 khung / giây. */
    let lucDauVe = 0, cuaTu = 0, cuaKhung = 0, cuaXau = 0
    setBang(bm)
    const doKhung = () => {
      W = goc.clientWidth; H = goc.clientHeight
      if (!W || !H) return
      dpr = Math.min(yeu ? 1 : 2, window.devicePixelRatio || 1)
      vai.width = Math.round(W * dpr); vai.height = Math.round(H * dpr)
      // Mọi máy thấy CÙNG diện tích sân (máy to không nhìn xa hơn máy nhỏ, nửa đường chéo ≤ 840 — «chỉ gửi gần»); máy thầy thấy cả sân. Ô mẫu nền = số nguyên điểm ảnh.
      ti = tiMan(W, H, dpr, xem, bd)
      // Ảnh nướng sẵn: trần 2,4 điểm ảnh / đơn vị sân (máy tính bảng 1180 × 820 dpr 2 cần 2,73 ⇒ 13,8 MB; trần này giữ bộ nhớ ảnh ≤ 12 MB, mắt không thấy khác).
      hinh = new BoHinh(bm, Math.min(2.4, ti * dpr), phang)
      san = taoBoSan(g, bm, ti * dpr)
      oSan?.huy()
      // Chỉ máy yếu / đã tự hạ mới dùng ô: máy thường đủ sức vẽ thẳng, khỏi tốn thêm bộ nhớ ảnh.
      oSan = yeu ? new BoO(bm, hinh, bd, san, ti * dpr, phang, false, 14e6) : null
      bangTen = new BoTen(bm, dpr, Math.round(Math.max(12, Math.min(16, 17 * ti))))
    }
    const doiMau = () => { bm = docBangMau(goc); setBang(bm); doKhung() }
    // Phông viết tay về muộn ⇒ nướng lại chữ (công thức, tên trại, bảng tên) bằng đúng phông.
    const phong = (document as Document & { fonts?: FontFaceSet }).fonts
    void phong?.load?.('16px "Patrick Hand"', 'Đỗ đại học ạ').then(() => { if (conSong) doKhung() }).catch(() => { /* không tải được phông: giữ phông dự phòng */ })

    // ── Tin trận, câu hô, dòng chữ nhỏ (DOM, chỉ đặt lại khi đổi) ──
    const tenCua = (id: string): string => (laMay(id) ? tenMay(id) ?? 'Bạn cùng lớp' : !xem && id === sbd ? 'Em' : tenNgan(dsRef.current.find((n) => n.sbd === id)?.ten ?? `Bạn ${id}`))
    const doiCua = (id: string): number => (!xem && id === sbd ? doiEm : noi[id]?.nv.doi ?? dsRef.current.find((n) => n.sbd === id)?.doi ?? 0)
    const themTin = (manh: ManhTin[], luc: number) => {
      dsTin = [...dsTin, { id: ++soTin, het: luc + TIN_SONG_MS, manh }].slice(-3)
      setTin(dsTin)
    }
    const datBao = (b: Bao | null) => {
      const khoa = b ? b.kieu + b.chu : ''
      if (khoa === baoCu) return
      baoCu = khoa; setBao(b)
    }
    const baoVui = (chu: string, luc: number) => { vui = { chu, het: luc + 2600 } }
    /** Con dấu câu hô (bản êm: không có). */
    const hoDau = (chu: string, phu = '', vang = false) => {
      if (banEm) return
      setDau({ id: ++soDau, chu, phu, vang })
      window.clearTimeout(henDau)
      henDau = window.setTimeout(() => { if (conSong) setDau(null) }, DAU_MS)
    }
    /** Rung nhẹ màn khi em hạ được bạn (≤ 120 ms, transform trên lớp bọc canvas); tắt khi giảm chuyển động / bản êm. */
    const rung = () => {
      const r = rungRef.current
      if (giam || banEm || yeu || !r || typeof r.animate !== 'function') return
      r.animate([{ transform: 'translate(0, 0)' }, { transform: 'translate(-3px, 2px)' }, { transform: 'translate(2px, -2px)' }, { transform: 'translate(0, 0)' }], { duration: 110, easing: 'ease-out' })
    }
    /** Lên `buoc` cấp THẬT (hạ thủ khoa ⇒ 2, một tiếng + một dòng báo). Pháo Sao tạm không đổi `cap` thật. */
    const lenCap = (luc: number, buoc = 1): boolean => {
      if (tt.cap >= CAP_TOI_DA) return false
      tt = { ...tt, cap: Math.min(CAP_TOI_DA, tt.cap + buoc) }
      capCu = tt.cap; setCap(tt.cap)
      tieng('lenCap')
      baoVui(`Súng lên cấp ${tt.cap} · ${SUNG_TEN[tt.cap - 1]}`, luc)
      return true
    }
    /** Hết ván / bảng vàng tới: xếp hạng bốn đội «Đỗ thủ khoa · Đỗ á khoa · Đỗ vớt · Thi lại ván sau» (một lần mỗi ván). */
    const chotVan = (van: number) => {
      vanKq = van
      if (!xem) tieng('hetVan')
      const d = diemCu ? diemCu.split(',').map(Number) : [0, 0, 0, 0]
      const hang = [0, 1, 2, 3].map((doi) => {
        let nhat = '', nhieu = 0
        // Máy bù không bao giờ được vinh danh (không có thật).
        for (const [id, soLan] of soHa) if (soLan > nhieu && !laMay(id) && doiCua(id) === doi) { nhieu = soLan; nhat = `${tenCua(id)} ${soLan} lượt hạ · nhiều nhất đội` }
        return { doi, diem: d[doi] ?? 0, nhat, xep: d.filter((x) => x > (d[doi] ?? 0)).length }
      }).sort((a, b) => b.diem - a.diem)
      setKetQua({ van: vanHien, hang })
    }
    const themHieu = (e: Hieu) => {
      if (yeu && e.k === 'muc') { let n = 0; for (const x of hieu) if (x.k === 'muc') n++; if (n >= 3) return }
      hieu.push(e); if (hieu.length > (yeu ? 10 : 24)) hieu = hieu.slice(-(yeu ? 10 : 24))
    }

    // ── Kênh lớp: ảnh chụp mỗi 250 ms ──
    const boNghe = kenh.nghe('tro', (t: TinLop) => {
      const anh = t.x as Partial<SinhTonAnh> | null
      if (!anh || typeof anh !== 'object' || !anh.ds || typeof anh.ds !== 'object') return
      const luc = performance.now()
      if (Number.isFinite(t.l) && t.l > 0) {
        const d = t.l - Date.now()
        lech = coLech ? lech + (d - lech) * 0.1 : d
        coLech = true
      }
      const nay = Date.now() + lech
      lucAnh = luc; soAnh++
      // Cỡ sân đổi ở đầu ván theo số nhân vật (bản đồ nhớ sẵn theo cỡ ⇒ so đúng đối tượng; cỡ lạ quy về 0, không dựng lại mỗi nhịp).
      const bdMoi = typeof anh.c === 'number' ? taoBanDo(anh.c) : bd
      // Đổi sân / sang ván mới ⇒ không giữ dòng cũ, bỏ chấm đồng đội xa.
      const doiSan = bdMoi !== bd || (typeof anh.v === 'number' && anh.v > 0 && anh.v !== vanHien)
      if (bdMoi !== bd) {
        const roiRong = bdMoi.rong * bdMoi.cao > bd.rong * bd.cao
        bd = bdMoi
        if (!xem) { tt = { ...taoToi(bd, doiEm, nay, hat), cap: tt.cap, mau: tt.mau }; if (soAnh > 1) baoVui(roiRong ? 'Lớp đông hơn · sân mở rộng' : 'Sân thu gọn lại', luc) }
        doKhung()
      }
      if (doiSan) { dd = []; hh = { id: '', khienDen: 0, nhanhDen: 0 }; dietTk = [] }
      // Ảnh mỏng thiếu dòng của em ⇒ giữ đội cũ.
      const dongToi = xem ? null : docDong(sbd, anh.ds[sbd])
      if (dongToi && dongToi.doi !== doiEm) { doiEm = dongToi.doi; tt = { ...taoToi(bd, doiEm, nay, hat), cap: tt.cap }; mucTieu = '' }
      const dauVan = ((nay % VAN_MS) + VAN_MS) % VAN_MS < 3000
      const moi: Record<string, NoiSuy> = {}
      const matMau: string[] = []
      dongAnh.length = 0
      for (const id in anh.ds) {
        if (!xem && id === sbd) continue
        const nv = docDong(id, anh.ds[id])
        if (!nv) continue
        dongAnh.push(nv)
        const cu = noi[id]
        if (cu) {
          const f = Math.min(1, (luc - cu.luc) / ANH_MS)
          // Vừa hồi sinh (nhảy về trại) thì không trượt ngang sân; sống lại / đầu ván ⇒ hiệu ứng hiện ra.
          const nhay = Math.hypot(nv.x - cu.nv.x, nv.y - cu.nv.y) > 260
          const song = cu.nv.mau <= 0 && nv.mau > 0, vaoVan = dauVan && (nhay || song)
          moi[id] = { nv, tx: nhay ? nv.x : cu.tx + (cu.nv.x - cu.tx) * f, ty: nhay ? nv.y : cu.ty + (cu.nv.y - cu.ty) * f, luc, goc: cu.goc, hl: song || vaoVan ? luc : cu.hl, hs: vaoVan ? false : song ? true : cu.hs, giu: false }
          if (nv.mau < cu.nv.mau && cu.nv.mau > 0 && !cu.giu) {
            matMau.push(id)
            if (!xem && id === mucTieu) themHieu({ k: 'so', x: nv.x + 20, y: nv.y - 66, doi: doiEm, luc, chu: `−${Math.round(cu.nv.mau - nv.mau)}`, mau: 'sai' })
          }
        } else {
          // Người mới lọt vào ảnh (vào giữa trận, hoặc chỉ vừa tới gần — «chỉ gửi gần») ⇒ hiện ra kiểu sống lại; KHÔNG báo «vào đội» (vào phòng đọc từ `ds`).
          moi[id] = { nv, tx: nv.x, ty: nv.y, luc, goc: nv.x > bd.rong / 2 ? Math.PI : 0, hl: soAnh > 1 ? luc : 0, hs: true, giu: false }
        }
        // Người nhặt hộp bị hạ ⇒ mất hiệu ứng hộp.
        if (nv.mau <= 0 && id === hh.id) hh = { id: '', khienDen: 0, nhanhDen: 0 }
      }
      // ẢNH MỎNG (`m: 1`): người ở vành ngoài vắng mặt ⇒ GIỮ dòng cũ (nguyên đối tượng, để vẽ / nội suy tiếp). Ảnh đủ mà vắng ⇒ đã ra khỏi tập, bỏ.
      if (anh.m === 1 && !doiSan) for (const id in noi) if (!moi[id]) { const o = noi[id]; o.giu = true; moi[id] = o }
      noi = moi
      if (Array.isArray(anh.dd)) dd = anh.dd.every((v) => typeof v === 'number') ? anh.dd : dd
      // Vết mực màu đội của kẻ đang bắn lên người vừa mất máu (mỗi người tối đa ~3 vết / giây).
      for (const id of matMau) {
        if (luc - (lucMuc.get(id) ?? -1e9) < 350) continue
        let doiBan = !xem && mucTieu === id ? doiEm : -1
        if (doiBan < 0) for (const k in moi) if (moi[k].nv.t === id) { doiBan = moi[k].nv.doi; break }
        if (doiBan < 0) continue
        lucMuc.set(id, luc)
        const n = moi[id].nv
        themHieu({ k: 'muc', x: n.x + ((luc % 17) - 8), y: n.y - 30 + ((luc % 11) - 5), doi: doiBan, luc, chu: '', mau: 'sai' })
      }
      // Lượt hạ (bản 4): [kẻ hạ, bị hạ, chuỗi người bị hạ, chuỗi kẻ hạ, 1 = người bị hạ là thủ khoa] — chuỗi do PHÒNG đếm (thiếu ⇒ 0).
      for (const dong of Array.isArray(anh.an) ? anh.an : []) {
        if (!Array.isArray(dong) || typeof dong[0] !== 'string' || typeof dong[1] !== 'string') continue
        const [ai, bi] = dong, chBi = Number(dong[2]) || 0, ch = Number(dong[3]) || 0, laTk = dong[4] === 1
        soHa.set(ai, (soHa.get(ai) ?? 0) + 1)
        haVan++
        // Máy hạ máy thì không báo (đỡ rối tin trận); có em thật ở một trong hai phía mới hiện.
        const coEm = !laMay(ai) || !laMay(bi)
        if (coEm) themTin([{ c: tenCua(ai), doi: doiCua(ai) }, { c: ' hạ ' }, { c: tenCua(bi), doi: doiCua(bi) }], luc)
        if (laTk) {
          if (!laMay(ai) && !dietTk.includes(ai)) dietTk = [...dietTk, ai]
          themTin([{ c: tenCua(ai), doi: doiCua(ai), noi: true }, { c: ' diệt thủ khoa!', noi: true }], luc)
        } else if (coEm && ch >= 2) themTin([{ c: tenCua(ai), doi: doiCua(ai), noi: true }, { c: ` chuỗi ${ch} · ${cauChuoi(ch)}`, noi: true }], luc)
        if (!xem && ai === sbd) {
          tieng('ha'); rung()
          // Hạ thủ khoa ⇒ lên THÊM một cấp (tổng +2, tối đa 6) — một lần lên, một tiếng.
          const len = !dangChet(tt, nay) && lenCap(luc, laTk ? 2 : 1)
          const n = noi[bi]?.nv
          if (n) themHieu({ k: 'so', x: n.x, y: n.y - 70, doi: doiEm, luc, chu: '+1', mau: 'sao' })
          const sung = len ? ` · súng lên ${SUNG_TEN[tt.cap - 1]}` : ''
          if (laTk) hoDau('ĐÃ TIÊU DIỆT THỦ KHOA!', `Em hạ thủ khoa ${tenCua(bi)}${sung}`)
          else if (chBi >= 3) hoDau('ĐÁNH TRƯỢT ĐẠI HỌC!', `${tenCua(bi)} đang chuỗi ${chBi}${sung}`)
          else if (ch >= 2) hoDau(hoa(cauChuoi(ch)), `Hạ ${ch} bạn liên tiếp${sung}`)
          else if (haVan === 1) hoDau('MỞ BÀI!', 'Em hạ được bạn đầu tiên của ván')
        } else if (haVan === 1) hoDau('MỞ BÀI!', `${tenCua(ai)} hạ được bạn đầu tiên của ván`)
      }
      if (typeof anh.v === 'number' && anh.v > 0) vanHien = anh.v
      if (Array.isArray(anh.d) && anh.d.length === 4 && anh.d.join() !== diemCu) { diemCu = anh.d.join(); setDiem([anh.d[0], anh.d[1], anh.d[2], anh.d[3]]) }
      // TRUY NÃ THỦ KHOA: `tk` đổi ⇒ dòng tin + dải báo 6 giây; em thành thủ khoa ⇒ con dấu vàng.
      const tkMoi = typeof anh.tk === 'string' ? anh.tk : ''
      if (tkMoi !== tk) {
        tk = tkMoi
        window.clearTimeout(henTruy)
        if (tk) {
          const em = !xem && tk === sbd
          themTin([{ c: tenCua(tk), doi: doiCua(tk), noi: true }, { c: ` thành thủ khoa ván ${vanHien}!`, noi: true }], luc)
          setTruyNa({ id: ++soTruy, ten: em ? '' : tenCua(tk), ha: soHa.get(tk) ?? 0, em })
          henTruy = window.setTimeout(() => { if (conSong) setTruyNa(null) }, 6000)
          if (em) hoDau('EM LÀ THỦ KHOA!', 'Cả lớp đang truy nã em', true)
        } else setTruyNa(null)
      }
      // Biểu cảm còn hiệu lực; biểu cảm MỚI của đồng đội (em thật) ⇒ một dòng tin.
      const bcMoi: Record<string, number> = {}
      if (anh.bc && typeof anh.bc === 'object') for (const id in anh.bc) {
        const e = anh.bc[id]
        if (!Number.isInteger(e) || e < 0 || e >= BIEU_CAM.length) continue
        bcMoi[id] = e
        if (bc[id] !== e && id !== sbd && !laMay(id) && (xem || doiCua(id) === doiEm)) themTin([{ c: tenCua(id), doi: doiCua(id) }, { c: `: ${BIEU_CAM[e]}` }], luc)
      }
      bc = bcMoi
      if (Array.isArray(anh.h) && typeof anh.h[0] === 'number') {
        const nhat = typeof anh.h[1] === 'string' ? anh.h[1] : ''
        // Hộp vừa có người nhặt (lần đầu thấy) ⇒ hiệu ứng theo loại hộp; em nhặt ⇒ `apHop` (không lên cấp, không kích chuỗi) + thẻ báo.
        if (nhat && (anh.h[0] !== hop[0] || nhat !== hop[1]) && soAnh > 1) {
          const loai = loaiHop(anh.h[0])
          hh = { id: nhat, khienDen: loai === 'khien' ? nay + KHIEN_MS : 0, nhanhDen: loai === 'nhanh' ? nay + NHANH_MS : 0 }
          if (!laMay(nhat)) themTin([{ c: tenCua(nhat), doi: doiCua(nhat) }, { c: ` nhặt hộp ${THE_HOP[loai][0]}` }], luc)
          if (!xem && nhat === sbd && !dangChet(tt, nay)) {
            tt = apHop(tt, loai, nay); tieng('hop')
            setTheHop({ id: ++soTheHop, loai })
            window.clearTimeout(henHop)
            henHop = window.setTimeout(() => { if (conSong) setTheHop(null) }, 2800)
            if (loai === 'sao') { saoCu = Math.ceil(SAO_MS / 1000); setSao(saoCu) }
          }
        }
        hop = [anh.h[0], nhat]
      }
      // BẢNG VÀNG (chỉ trong 5 giây nghỉ): top 3 em thật + hạng của em ⇒ chốt ván ngay (không chờ vòng khung).
      if (Array.isArray(anh.bv)) {
        const hg = typeof anh.hg === 'number' && anh.hg > 0 ? Math.floor(anh.hg) : 0, khoa = `${JSON.stringify(anh.bv)}|${hg}|${tk}`
        if (khoa !== bvCu) {
          bvCu = khoa
          if (vanKq !== vanSo(nay)) chotVan(vanSo(nay))
          const top: DongVang[] = []
          for (const r of anh.bv) {
            if (!Array.isArray(r) || typeof r[0] !== 'string' || laMay(r[0]) || typeof r[1] !== 'number' || top.length >= 3) continue
            const em = !xem && r[0] === sbd
            top.push({ ten: em ? `${tenNgan(toi?.ten ?? '')} (em)` : tenCua(r[0]), ha: r[1], doi: em ? doiEm : doiCua(r[0]), em, tk: r[0] === tk })
          }
          setVang({ top, hg, haEm: soHa.get(sbd) ?? 0, dietTk: dietTk.map(tenCua) })
        }
      }
      if (xem) return
      // Em bị bắn: tự tính từ ẢNH VỪA NHẬN (dòng giữ lại không tính); Súng Lửa Màu bắn thẳng ⇒ châm lửa. Có khiên ⇒ «chặn!».
      const don = satThuong({ id: sbd, x: tt.x, y: tt.y, doi: doiEm }, dongAnh, ANH_MS / 1000)
      const song = !dangChet(tt, nay), mauTruoc = tt.mau
      if (song && don.tong > 0 && coKhien(tt, nay) && luc - lucChan > 600) { lucChan = luc; themHieu({ k: 'so', x: tt.x + 18, y: tt.y - 66, doi: doiEm, luc, chu: 'chặn!', mau: 'dung' }) }
      tt = nhanDon(tt, don.tong, nay, don.chay)
      if (song && tt.mau < mauTruoc) {
        themHieu({ k: 'so', x: tt.x + 18, y: tt.y - 66, doi: doiEm, luc, chu: `−${Math.max(1, Math.round(mauTruoc - tt.mau))}`, mau: 'sai' })
        if (don.ai && luc - (lucMuc.get(sbd) ?? -1e9) >= 350) { lucMuc.set(sbd, luc); themHieu({ k: 'muc', x: tt.x, y: tt.y - 30, doi: doiCua(don.ai), luc, chu: '', mau: 'sai' }) }
      }
      if (song && dangChet(tt, nay)) { choA = don.ai; keHa = don.ai; tieng('biHa') }
      else if (don.tong > 0 && song && luc - lucTrungTieng > 240 && nay >= tt.batTuDen) { lucTrungTieng = luc; tieng('trung') }
    })

    // ── Vòng khung hình ──
    let rafId = 0, lucTruoc = 0, lucCham = 0
    const khung = (luc: number) => {
      rafId = requestAnimationFrame(khung)
      if (!W || !H) { doKhung(); return }
      if (!lucTruoc) lucTruoc = luc - 16
      const dt = luc - lucTruoc
      if (nhipKhung && dt < nhipKhung - 3) return
      lucTruoc = luc
      // TỰ HẠ: HAI cửa sổ 0,6 giây liền nhau dưới 48 khung / giây ⇒ chuyển hẳn sang kiểu phẳng và GHI NHỚ ở máy 1 ngày.
      if (!phang) {
        if (!lucDauVe) lucDauVe = luc
        if (luc - lucDauVe > 1000) {
          if (!cuaTu) { cuaTu = luc; cuaKhung = 0 }
          cuaKhung++
          if (luc - cuaTu >= 600) {
            cuaXau = cuaKhung / ((luc - cuaTu) / 1000) < 48 ? cuaXau + 1 : 0
            cuaTu = luc; cuaKhung = 0
            if (cuaXau >= 2) { phang = true; yeu = true; datYeuAm(true); ghiPhang(); goc.setAttribute('data-phang', '1'); doKhung() }
          }
        }
      }
      const nay = Date.now() + lech
      const nghi = dangNghi(nay), van = vanSo(nay), v = vong(bd, nay)
      const matMang = soAnh > 0 && luc - lucAnh > 2500
      // Nhân vật khác tại lúc này (nội suy giữa hai ảnh chụp); dùng lại mảng để không sinh rác mỗi khung. `khacBan` bỏ dòng giữ lại của ảnh mỏng (không ngắm).
      let n = 0
      khacBan.length = 0
      for (const id in noi) {
        const o = noi[id], f = Math.min(1, (luc - o.luc) / ANH_MS)
        const k = khac[n] ?? (khac[n] = { id: '', x: 0, y: 0, mau: 0, doi: 0, cap: 1, t: '' })
        k.id = id; k.x = o.tx + (o.nv.x - o.tx) * f; k.y = o.ty + (o.nv.y - o.ty) * f; k.mau = o.nv.mau; k.doi = o.nv.doi; k.cap = o.nv.cap; k.t = o.nv.t
        if (!o.giu) khacBan.push(k)
        n++
      }
      khac.length = n
      // 10 giây cuối ván: SẮP THU BÀI! (một lần mỗi ván).
      if (!nghi && vanThuBai !== van && conLai(nay) <= 10_000) { vanThuBai = van; if (soAnh > 0) hoDau('SẮP THU BÀI!', 'Còn 10 giây') }
      const i = vao.current
      // Bốn nhãn biểu cảm tự đóng sau 4 giây.
      if (i.moBc && luc - i.moBc > 4000) { i.moBc = 0; setBieuCam(null) }
      let cam: Diem = { x: bd.rong / 2, y: bd.cao / 2 }, duong: Diem[] | null = null
      if (!xem) {
        if (van !== tt.van) {
          tt = taoToi(bd, doiEm, nay, hat); soHa.clear(); haVan = 0; mucTieu = ''; i.cham = null; hh = { id: '', khienDen: 0, nhanhDen: 0 }; dietTk = []
          hienEm = luc; hienSong = false
          hoDau('VÀO TRẬN!', 'Cả đội được vẽ ra ở trại', true)
        }
        let dx = i.cx, dy = i.cy
        for (const ma in PHIM) if (i.phim[ma]) { dx += PHIM[ma][0]; dy += PHIM[ma][1] }
        if (dx || dy) i.daDung = true
        // Chạm một điểm ⇒ tự chạy tới, vòng qua vật chặn.
        if (i.cham && !dangChet(tt, nay)) {
          const c0 = camNhin(bd, W, H, ti, tt.x, tt.y)
          tt = { ...tt, duong: timDuong(bd, tt.x, tt.y, c0.x + (i.cham.x - W / 2) / ti, c0.y + (i.cham.y - H / 2) / ti) }
          i.daDung = true
        }
        i.cham = null
        // `vuaSong`: hết 3 giây bị hạ ⇒ bước này `buocToi` hồi sinh em ở trại (hoặc mép vòng).
        const xCu = tt.x, yCu = tt.y, songTruoc = !dangChet(tt, nay), vuaSong = tt.chetDen > 0 && songTruoc
        tt = buocToi(bd, tt, { dx, dy }, dt, nay, hat)
        // Chết vì CHÁY (Súng Lửa Màu) ⇒ kẻ châm lửa là kẻ hạ em; chết ngoài vòng ⇒ ''.
        if (songTruoc && dangChet(tt, nay)) { keHa = tt.chayAi; if (tt.chayAi) choA = tt.chayAi; tieng('biHa') }
        if (vuaSong && !dangChet(tt, nay)) { hienEm = luc; hienSong = true; hoDau('THI LẠI!', 'Bất tử 2 giây · súng về cấp 1', true) }
        const diChuyen = tt.x !== xCu || tt.y !== yCu
        if (diChuyen) huong = Math.atan2(tt.y - yCu, tt.x - xCu)
        gioEm = diChuyen ? huong : NaN
        const chet = dangChet(tt, nay)
        cam = camNhin(bd, W, H, ti, tt.x, tt.y)
        // Thân bé ma của em trên khung (chạm trúng ⇒ mở nhãn biểu cảm); bị hạ ⇒ không chạm được, nhãn đang mở thì đóng.
        i.ma = chet ? null : diemMaEm(tt.x, tt.y, cam, ti, W, H); i.ti = ti
        if (chet && i.moBc) { i.moBc = 0; setBieuCam(null) }
        // Súng bắn đối thủ gần nhất ĐANG HIỆN TRÊN MÀN của em (lùi mép 24 px để thấy rõ bé ma, không chỉ thấy mép áo) — chỉ dòng có trong ảnh vừa nhận.
        if (luc - lucNgam >= 100) {
          lucNgam = luc
          const nx = (W / 2 - 24) / ti, ny = (H / 2 - 24) / ti
          // Bé ma cao chừng 60 đơn vị: lấy thân (chân + 34) làm điểm «đang thấy».
          mucTieu = chet || nghi || dangAn(bd, tt, nay) ? '' : chonMucTieu(bd, tt, khacBan, { x0: cam.x - nx, y0: cam.y - ny + 34, x1: cam.x + nx, y1: cam.y + ny + 34 })
        }
        // Hộp tiếp tế: chạm là xin phòng (em chạm đầu tiên được nhận).
        const soHop = hopSo(nay)
        if (!chet && !nghi && hop[0] !== soHop && choH !== soHop && Math.hypot(tt.x - bd.rong / 2, tt.y - bd.cao / 2) < HOP_BK) choH = soHop
        // Gửi ≤ 4 gói / giây (`p[3]` = cấp súng đang dùng — Pháo Sao tạm ⇒ 6); đứng yên vẫn nhắc mỗi 2 giây để phòng không gỡ em. Biểu cảm chờ gửi ⇒ gửi ở nhịp kế.
        const goi = taoGoi(tt, nay, chet, mucTieu)
        const khoa = `${goi.p.join()}|${mucTieu}`
        if ((luc - lucGui >= NHIP_GUI_MS && (khoa !== khoaGui || choA || choH === soHop || i.e >= 0)) || luc - lucGui >= NHIP_NHAC_MS) {
          if (choA) { goi.a = choA; choA = '' }
          if (choH === soHop && hop[0] !== soHop) goi.h = soHop
          if (i.e >= 0) { goi.e = i.e; i.e = -1 }
          lucGui = luc; khoaGui = khoa
          kenh.gui('tro', goi)
        }
        // Lớp DOM: bị hạ, cấp súng (Pháo Sao tạm đếm giây), dòng chữ nhỏ.
        if (chet !== chetCu || chet) {
          const giay = chet ? Math.max(1, Math.ceil((tt.chetDen - nay) / 1000)) : 0
          const khoaHa = chet ? `${keHa}|${giay}` : ''
          if (khoaHa !== haCu) { haCu = khoaHa; setBiHa(chet ? { ai: keHa ? tenCua(keHa) : '', doi: keHa ? doiCua(keHa) : -1, giay } : null) }
          chetCu = chet
        }
        if (tt.cap !== capCu) { capCu = tt.cap; setCap(tt.cap) }
        const saoCon = (tt.saoDen ?? 0) > nay ? Math.ceil(((tt.saoDen ?? 0) - nay) / 1000) : 0
        if (saoCon !== saoCu) { saoCu = saoCon; setSao(saoCon) }
        const an = !chet && dangAn(bd, tt, nay)
        if (vui && vui.het <= luc) vui = null
        if (chet || nghi) datBao(null)
        else if (matMang) datBao({ kieu: 'canh', chu: 'Mất kết nối · đang nối lại · em vẫn chạy được, các bạn tạm đứng yên' })
        else if (vui) datBao({ kieu: 'vui', chu: vui.chu })
        else if (ngoaiVong(v, tt.x, tt.y) && !coKhien(tt, nay)) datBao({ kieu: 'canh', chu: 'Ra khỏi phòng thi · đang mất máu' })
        else if (an) datBao({ kieu: 'an', chu: `Đang ẩn trong bụi · đội khác không thấy em${tt.mau < MAU_DAY ? ' · máu đang hồi' : ''}` })
        else if (!i.daDung && luc - lucMo < 9000) datBao({ kieu: 'meo', chu: 'Vuốt để chạy · Chạm để tới · Súng tự bắn đối thủ gần nhất' })
        else if (lucBcEm < 0 && luc - lucMo >= 9000 && luc - lucMo < 16000) datBao({ kieu: 'meo', chu: 'Chạm bé ma của em để gửi biểu cảm · cả lớp thấy 2 giây' })
        else datBao(null)
      } else {
        if (vui && vui.het <= luc) vui = null
        datBao(vui ? { kieu: 'vui', chu: vui.chu } : null)
      }
      // Hết ván: xếp hạng bốn đội (một lần mỗi ván; bảng vàng tới trước thì đã chốt ở người nghe).
      if (nghi !== nghiCu) {
        nghiCu = nghi
        if (nghi && vanKq !== van) chotVan(van)
        else if (!nghi) { setKetQua(null); setVang(null); bvCu = '' }
      }
      if (luc - lucCham >= 500) {
        lucCham = luc
        const chu = chuGio(conLai(nay)), khoa = `${vanHien}|${chu}`
        if (khoa !== gioCu) { gioCu = khoa; setGio({ van: vanHien, con: chu }) }
        if (dsTin.length && dsTin[0].het <= luc) { dsTin = dsTin.filter((t) => t.het > luc); setTin(dsTin) }
        if (hieu.length) hieu = hieu.filter((e) => luc - e.luc < MUC_MS)
        // Em mới VÀO PHÒNG (danh sách lớp `lop-ds` / `st-ds` có thêm người) ⇒ «<tên> vào <đội>».
        if (dsRef.current !== dsCu) {
          dsCu = dsRef.current
          for (const e of dsCu) if (!daBiet.has(e.sbd)) { daBiet.add(e.sbd); if (e.sbd !== sbd) baoVui(`${tenNgan(e.ten)} vào ${DOI_BPU[kepDoi(e.doi)].ten}`, luc) }
        }
      }
      // ── Dựng danh sách vẽ ──
      let m = 0
      const them = (): NvVe => nvVe[m] ?? (nvVe[m] = { id: '', x: 0, y: 0, mau: 0, doi: 0, cap: 1, goc: 0, ban: false, dx: 0, dy: 0, toi: false, dong: false, mo: 1, ten: '', an: false, hien: -1, song: false, batTu: false, tk: false, khien: false, nhanh: false, gio: NaN, bc: '' })
      const viTri = (id: string): NhanVat | undefined => (!xem && id === sbd ? { id, x: tt.x, y: tt.y, mau: tt.mau, doi: doiEm, cap: tt.cap, t: mucTieu } : khac.find((k) => k.id === id))
      for (const k of khac) {
        // Đối thủ ẩn trong bụi: em không thấy (máy thầy thấy hết).
        if (!xem && k.mau > 0 && anVoi(bd, k, tt.x, tt.y, doiEm)) continue
        const o = noi[k.id], mt = k.t ? viTri(k.t) : undefined, e = them()
        if (mt) o.goc = Math.atan2(mt.y - k.y, mt.x - k.x)
        else if (Math.hypot(o.nv.x - o.tx, o.nv.y - o.ty) > 4) o.goc = Math.atan2(o.nv.y - o.ty, o.nv.x - o.tx)
        const tuoi = o.hl ? luc - o.hl : 1e9
        e.id = k.id; e.x = k.x; e.y = k.y; e.mau = k.mau; e.doi = k.doi; e.cap = k.cap; e.goc = o.goc
        e.ban = !!mt && !nghi && k.mau > 0; e.dx = mt?.x ?? 0; e.dy = mt?.y ?? 0
        e.toi = false; e.dong = !xem && k.doi === doiEm
        // Đứng trong bụi mà vẫn thấy (đồng đội, đang bắn, máy thầy) ⇒ vẽ sau bụi; không bắn thì mờ.
        e.an = k.mau > 0 && trongBui(bd, k.x, k.y)
        e.mo = matMang ? 0.45 : e.an && !k.t ? 0.6 : 1
        e.ten = tenCua(k.id)
        e.hien = tuoi < HIEN_MS ? tuoi / HIEN_MS : -1; e.song = o.hs; e.batTu = tuoi >= HIEN_MS && tuoi < BAT_TU_MS
        // Truy nã · hộp tiếp tế (suy từ `h` + thời gian) · biểu cảm.
        e.tk = k.id === tk; e.khien = k.id === hh.id && hh.khienDen > nay; e.nhanh = k.id === hh.id && hh.nhanhDen > nay
        e.gio = e.nhanh && Math.hypot(o.nv.x - o.tx, o.nv.y - o.ty) > 4 ? Math.atan2(o.nv.y - o.ty, o.nv.x - o.tx) : NaN
        const sb = bc[k.id]; e.bc = sb === undefined ? '' : BIEU_CAM[sb]
        m++
      }
      if (!xem) {
        const chet = dangChet(tt, nay), mt = mucTieu ? khac.find((k) => k.id === mucTieu) : undefined, e = them()
        if (mt) huong = Math.atan2(mt.y - tt.y, mt.x - tt.x)
        const tuoi = hienEm ? luc - hienEm : 1e9
        e.id = sbd; e.x = tt.x; e.y = tt.y; e.mau = chet ? 0 : tt.mau; e.doi = doiEm; e.cap = capSung(tt, nay); e.goc = huong
        e.ban = !!mt; e.dx = mt?.x ?? 0; e.dy = mt?.y ?? 0; e.toi = true; e.dong = true
        e.an = !chet && trongBui(bd, tt.x, tt.y); e.mo = !chet && dangAn(bd, tt, nay) ? 0.6 : 1; e.ten = `${tenNgan(toi?.ten ?? '')} (em)`
        e.hien = !chet && tuoi < HIEN_MS ? tuoi / HIEN_MS : -1; e.song = hienSong; e.batTu = !chet && tuoi >= HIEN_MS && nay < tt.batTuDen
        e.tk = tk === sbd; e.khien = coKhien(tt, nay); e.nhanh = dangNhanh(tt, nay)
        e.gio = e.nhanh ? gioEm : NaN
        const sb = bc[sbd]; e.bc = bcEm.het > luc ? bcEm.chu : sb === undefined ? '' : BIEU_CAM[sb]
        m++
        if (tt.duong.length) duong = [{ x: tt.x, y: tt.y }, ...tt.duong]
      }
      nvVe.length = m
      // Tiếng súng đi cùng nhịp đạn trên màn (cùng công thức nhịp với sinh-ton-ve.ts); chỉ máy em đang chơi mới kêu.
      if (!xem) for (const e of nvVe) {
        if (!e.ban) continue
        const nhip = Math.floor((luc + bamSo(e.id) * 37) / NHIP_BAN_MS[e.cap - 1])
        if (nhipBan.get(e.id) === nhip) continue
        nhipBan.set(e.id, nhip)
        tiengBan(e.cap, e.toi, e.toi ? 1 : Math.max(0, 1 - Math.hypot(e.x - tt.x, e.y - tt.y) / 620))
      }
      if (nhipBan.size > 160) nhipBan.clear()
      const tVe = performance.now()
      hinh.han = tVe - lucMo < 2500 ? tVe + 9 : 0
      veKhung({ g, W, H, dpr, ti, cx: cam.x, cy: cam.y, bd, bang: bm, hinh, san, ten: bangTen, phang, em: banEm, luc, vong: v, nv: nvVe, hopCo: !nghi && hop[0] !== hopSo(nay), hopLoai: loaiHop(hopSo(nay)), nghi, duong, hieu, yeu, o: oSan, ranh: phiVe < 9 })
      phiVe = performance.now() - tVe
      const nho = nhoRef.current, gn = nho?.getContext('2d')
      if (nho && gn && luc - lucNho >= 500) {
        lucNho = luc
        const r = 130, c = Math.round((r * bd.cao) / bd.rong), d2 = Math.min(yeu ? 1 : 2, window.devicePixelRatio || 1)
        if (nho.width !== Math.round(r * d2) || nho.height !== Math.round(c * d2)) { nho.width = Math.round(r * d2); nho.height = Math.round(c * d2) }
        // Bản đồ nhỏ = đồng đội trong ảnh + chấm `dd` + sao thủ khoa.
        const sao = !tk ? null : !xem && tk === sbd ? tt : khac.find((k) => k.id === tk) ?? null
        veBanDoNho(gn, r, c, d2, bd, bm, v, nvVe, doiEm, dd, sao)
      }
    }
    // Tab vừa hiện lại ⇒ đo lại từ đầu (khung đầu sau khi ẩn không phản ánh sức máy).
    const chay = () => { if (!rafId && !document.hidden) { lucTruoc = 0; lucDauVe = 0; cuaTu = 0; cuaXau = 0; rafId = requestAnimationFrame(khung) } }
    const dung = () => { if (rafId) cancelAnimationFrame(rafId); rafId = 0 }
    const doiHien = () => { if (document.hidden) dung(); else chay() }

    // ── Bàn phím (máy tính): WASD / mũi tên để đi. Đang gõ chữ (chat) thì bỏ qua. ──
    const dangGo = (e: KeyboardEvent) => {
      const d = e.target as HTMLElement | null
      return !!d && (d.tagName === 'INPUT' || d.tagName === 'TEXTAREA' || d.tagName === 'SELECT' || d.isContentEditable)
    }
    const phimXuong = (e: KeyboardEvent) => {
      if (dangGo(e) || e.ctrlKey || e.metaKey || e.altKey) return
      if (PHIM[e.code]) { vao.current.phim[e.code] = true; moAm(); e.preventDefault() }
    }
    const phimLen = (e: KeyboardEvent) => { if (PHIM[e.code]) vao.current.phim[e.code] = false }
    const buongPhim = () => { vao.current.phim = {} }

    doKhung()
    const quanSat = typeof ResizeObserver === 'function' ? new ResizeObserver(doKhung) : null
    quanSat?.observe(goc)
    const nenToi = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-color-scheme: dark)') : null
    nenToi?.addEventListener?.('change', doiMau)
    window.addEventListener('resize', doKhung)
    if (!xem) {
      window.addEventListener('keydown', phimXuong)
      window.addEventListener('keyup', phimLen)
      window.addEventListener('blur', buongPhim)
    }
    document.addEventListener('visibilitychange', doiHien)
    chay()
    return () => {
      conSong = false
      oSan?.huy(); oSan = null
      dung(); boNghe(); quanSat?.disconnect(); window.clearTimeout(henDau)
      nenToi?.removeEventListener?.('change', doiMau)
      window.removeEventListener('resize', doKhung)
      window.removeEventListener('keydown', phimXuong)
      window.removeEventListener('keyup', phimLen)
      window.removeEventListener('blur', buongPhim)
      document.removeEventListener('visibilitychange', doiHien)
    }
  }, [kenh, sbd, doiToi, mayYeu, xem, banEm]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Cử chỉ: VUỐT ở đâu cũng là cần ảo vô hình; CHẠM nhanh một điểm = chạy tới đó. Toạ độ đổi về hệ của KHUNG (lớp live có thể xoay 90° bằng CSS). ──
  const toaDo = (e: SuKienTro) => {
    const r = (vaiRef.current ?? e.currentTarget).getBoundingClientRect()
    return xoay ? toaDoXoay(e, r) : { x: e.clientX - r.left, y: e.clientY - r.top }
  }
  const xuong = (e: SuKienTro<HTMLDivElement>) => {
    const i = vao.current
    if (i.id !== -1) return
    // Bốn nhãn biểu cảm đang mở mà em chạm chỗ khác ⇒ đóng, và cử chỉ vẫn chạy như thường.
    if (i.moBc) { i.moBc = 0; setBieuCam(null) }
    const p = toaDo(e)
    i.id = e.pointerId; i.gx = p.x; i.gy = p.y; i.cx = 0; i.cy = 0; i.keo = false; i.t0 = performance.now()
    moAm()
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* trình duyệt cũ: vẫn nhận sự kiện trong vùng */ }
    e.preventDefault()
  }
  const di = (e: SuKienTro<HTMLDivElement>) => {
    const i = vao.current
    if (i.id !== e.pointerId) return
    const p = toaDo(e)
    let dx = p.x - i.gx, dy = p.y - i.gy
    const dai = Math.hypot(dx, dy)
    if (!i.keo && dai < NGUONG_KEO) return
    i.keo = true
    if (dai > BK_CAN) { dx = (dx / dai) * BK_CAN; dy = (dy / dai) * BK_CAN }
    const co = Math.min(dai, BK_CAN) / BK_CAN
    i.cx = co < VUNG_CHET ? 0 : dx / BK_CAN
    i.cy = co < VUNG_CHET ? 0 : dy / BK_CAN
  }
  const buong = (e: SuKienTro<HTMLDivElement>) => {
    const i = vao.current
    if (i.id !== e.pointerId) return
    // CHẠM (không vuốt): trúng bé ma của em ⇒ mở bốn nhãn biểu cảm; chạm chỗ khác ⇒ chạy tới đó như cũ.
    if (!i.keo && e.type === 'pointerup' && performance.now() - i.t0 < CHAM_MS) {
      if (i.ma && chamMaEm(i.gx, i.gy, i.ma, i.ti)) {
        // Bốn nhãn tròn 56 px xếp vòng cung phía trên bé ma, kẹp trong khung.
        const W = gocRef.current?.clientWidth ?? 0, H = gocRef.current?.clientHeight ?? 0, ma = i.ma
        i.moBc = performance.now()
        setBieuCam(KY_BIEU_CAM.map((_, k) => { const a = ((-165 + k * 50) * Math.PI) / 180; return { x: Math.max(32, Math.min(W - 32, ma.x + Math.cos(a) * 84)), y: Math.max(32, Math.min(H - 32, ma.y - 4 + Math.sin(a) * 84)) } }))
      }
      else i.cham = { x: i.gx, y: i.gy }
    }
    i.id = -1; i.cx = 0; i.cy = 0; i.keo = false
  }
  /** Chọn một nhãn ⇒ gửi `e` ở nhịp kế (phòng nhận 1 lần / 2 giây mỗi em) + bong bóng của em hiện ngay. */
  const guiBieuCam = (so: number) => { const i = vao.current; i.e = so; i.moBc = 0; setBieuCam(null) }

  const tenToi = toi ? DOI_BPU[doiToi].ten : ''
  const nhat = ketQua && ketQua.hang[0].diem > (ketQua.hang[1]?.diem ?? 0) ? ketQua.hang[0] : null
  const hangEm = ketQua && !xem ? ketQua.hang.find((h) => h.doi === doiToi) : undefined
  // Bảng vàng có ít nhất một dòng (hoặc hạng của em) ⇒ thẻ cuối ván kiểu ảnh 14 / bục lớn máy thầy kiểu ảnh 13; không thì thẻ bốn đội như đợt 1.
  const coVang = !!vang && (vang.top.length > 0 || (!xem && vang.hg > 0))
  return (
    <div className="gl st" ref={gocRef} style={{ ...MAU_SINH_TON, ...bienDoi(doiToi) } as CSSProperties} data-xem={xem ? '1' : undefined} data-phang={mayYeu ? '1' : undefined} data-em={banEm ? '1' : undefined}>
      <div className="st-rung" ref={rungRef}><canvas className="gl-san" ref={vaiRef} aria-hidden="true" /></div>
      {xem ? null : <div className="st-vung" onPointerDown={xuong} onPointerMove={di} onPointerUp={buong} onPointerCancel={buong} onLostPointerCapture={buong} />}
      <div className="gl-bang st-bang" role="group" aria-label={`Lượt hạ ván ${gio.van}: ${DOI_BPU.map((d, i) => `${d.ten} ${diem[i]}`).join(', ')}. Còn ${gio.con}`}>
        {DOI_BPU.map((d, i) => (
          <span key={d.ky} className="gl-o" style={bienDoi(i)} data-toi={!xem && i === doiToi ? '1' : undefined}><i />{d.ky} {diem[i]}</span>
        ))}
        <span className="gl-mo">lượt hạ</span>
        <span className="st-gio">Ván {gio.van} · còn {gio.con}</span>
      </div>
      <ul className="gl-tin st-tin" aria-live="off">
        {tin.map((t) => (
          <li key={t.id} data-noi={t.manh.some((m) => m.noi) ? '1' : undefined}>{t.manh.map((m, i) => (m.doi !== undefined && m.doi >= 0 && m.doi < 4 ? <b key={i} style={bienDoi(m.doi)}>{m.c}</b> : <span key={i}>{m.c}</span>))}</li>
        ))}
      </ul>
      {truyNa && !biHa && !ketQua ? (
        <div key={`truy${truyNa.id}`} className="st-truy" role="status">
          <b>{truyNa.em ? 'EM LÀ THỦ KHOA' : `THỦ KHOA ${truyNa.ten}`}{truyNa.ha ? ` · ${truyNa.ha} lượt hạ` : ''}</b>
          <span>{truyNa.em ? 'Cả lớp đang truy nã em · giữ vương miện tới cuối ván' : 'Cả lớp đang truy nã · hạ bạn ấy là súng lên cấp ngay'}</span>
        </div>
      ) : null}
      {bao ? <div className="st-bao" data-kieu={bao.kieu} role="status">{bao.chu}</div> : null}
      {xem ? null : (
        <div className="st-sung" data-tam={sao ? '1' : undefined} aria-label={sao ? `Súng của em: Pháo Sao tạm, còn ${sao} giây` : `Súng của em: cấp ${cap} trên ${CAP_TOI_DA}, ${SUNG_TEN[cap - 1]}`}>
          <span className="st-vach" aria-hidden="true">{SUNG_TEN.map((_, i) => <i key={i} data-co={i < (sao ? CAP_TOI_DA : cap) ? '1' : undefined} />)}</span>
          {sao ? <><span className="st-cap">Súng tạm cấp 6 · </span>{SUNG_TEN[CAP_TOI_DA - 1]} · còn {sao} giây</> : <><span className="st-cap">Súng cấp {cap} · </span>{SUNG_TEN[cap - 1]}</>}
        </div>
      )}
      {theHop && bang && !biHa && !ketQua ? (
        <div key={`hop${theHop.id}`} className="st-the-hop" data-loai={theHop.loai} role="status">
          <AnhMa bang={bang} doi={0} hop={theHop.loai} to={1.2} /><span><b>{THE_HOP[theHop.loai][0]}</b> · {THE_HOP[theHop.loai][1]}</span>
        </div>
      ) : null}
      {bieuCam && !biHa && !ketQua ? bieuCam.map((d, i) => (
        <button key={`nhan${i}`} type="button" className="st-nhan" style={{ left: d.x, top: d.y }} onClick={() => guiBieuCam(i)}><span aria-hidden="true">{KY_BIEU_CAM[i]}</span>{BIEU_CAM[i]}</button>
      )) : null}
      {xem ? null : (
        <button type="button" className="st-am" aria-pressed={!tatTieng} aria-label={tatTieng ? 'Bật tiếng trò chơi' : 'Tắt tiếng trò chơi'} onClick={() => { const v = !tatTieng; datTat(v, !imLang); setTatTieng(v); if (!v) moAm() }}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5v5h3.5l4.5 4v-13l-4.5 4z" />{tatTieng ? <path d="M16 9.5l5 5m0-5l-5 5" /> : <path d="M15.5 9a4.2 4.2 0 0 1 0 6m2.6-8.6a8 8 0 0 1 0 11.2" />}</svg>
        </button>
      )}
      {xem ? null : <div className="st-bd"><canvas ref={nhoRef} aria-hidden="true" /><span>Bản đồ · vòng an toàn</span></div>}
      {xem ? null : <div className="st-cho"><i />{banEm ? 'Phòng chờ ca · thầy bấm Bắt đầu là vào bài ngay' : `Phòng chờ · ${soEm} em đã vào · chờ thầy bấm Bắt đầu`}</div>}
      {dau && !banEm && !biHa && !ketQua ? (
        <div key={dau.id} className="st-dau" data-vang={dau.vang ? '1' : undefined} role="status"><b>{dau.chu}</b>{dau.phu ? <small>{dau.phu}</small> : null}</div>
      ) : null}
      {biHa && !ketQua ? (
        <div className="st-ha" role="status">
          {banEm ? null : <div className="st-dau st-dau-ha"><b>TRƯỢT ĐẠI HỌC RỒI!</b></div>}
          <h2>{biHa.ai ? <><b style={bienDoi(biHa.doi)}>{biHa.ai}</b> {duoiBiHa(banEm)}</> : 'Em hết máu ngoài phòng thi'}</h2>
          <div className="st-dem">{biHa.giay}</div>
          <p>Thi lại ở phía trại {tenToi} sau {biHa.giay} giây</p>
        </div>
      ) : null}
      {ketQua && coVang && vang && xem ? (
        // BẢNG VÀNG lớn máy thầy (ảnh 13): bục 3 khối (2 · 1 · 3), bé ma trên bục, tên + lượt hạ; bên phải hạng bốn đội.
        <div className="st-vv" role="status">
          <h2>Bảng vàng <small>Ván {ketQua.van}</small></h2>
          <div className="st-buc">
            {[1, 0, 2].map((h) => {
              const r = vang.top[h]
              if (!r) return null
              return (
                <div key={h} className="st-buc-o" data-hang={h + 1} style={bienDoi(r.doi)}>
                  {bang ? <AnhMa bang={bang} doi={r.doi} to={2.2} vuong={r.tk} /> : null}
                  <div className="st-khoi"><b>{h + 1}</b></div>
                  <span className="st-buc-ten"><b>{r.ten}</b><small>{r.ha} lượt hạ{r.tk ? ' · thủ khoa' : ''}</small></span>
                </div>
              )
            })}
          </div>
          <div className="st-vv-ben">
            {nhat ? <p style={bienDoi(nhat.doi)}><b>{DOI_BPU[nhat.doi].ten}</b> đỗ thủ khoa ván {ketQua.van} · {nhat.diem} lượt hạ</p> : <p>Hết ván {ketQua.van} · hoà</p>}
            <p>{ketQua.hang.filter((h) => h !== nhat).map((h) => <span key={h.doi}>{XEP_DOI[h.xep]}: <b style={bienDoi(h.doi)}>{DOI_BPU[h.doi].ten}</b> · {h.diem}</span>)}</p>
            {vang.dietTk.length ? <p><em>Đã tiêu diệt thủ khoa:</em> {vang.dietTk.join(', ')}</p> : null}
            <small>Ván mới sau vài giây</small>
          </div>
        </div>
      ) : ketQua && coVang && vang ? (
        // Thẻ cuối ván máy em (ảnh 14): đội thắng · hạng đội em · lượt hạ + hạng của em · top 3 lớp.
        <div className="st-kq" data-vang="1" role="status" style={bienDoi(ketQua.hang[0].doi)}>
          <h2>{nhat ? <><b>{DOI_BPU[nhat.doi].ten}</b> đỗ thủ khoa ván {ketQua.van}!</> : `Hết ván ${ketQua.van} · hoà`}</h2>
          {hangEm && !banEm ? <span className="st-kq-dau">{XEP_DOI[hangEm.xep]}</span> : null}
          {hangEm ? <p>Đội em (<b style={bienDoi(hangEm.doi)}>{DOI_BPU[hangEm.doi].ten}</b>): {XEP_DOI[hangEm.xep].toLocaleLowerCase('vi')} · {hangEm.diem} lượt hạ</p> : null}
          <p>Em: <b>{vang.haEm} lượt hạ</b>{vang.hg ? ` · hạng ${vang.hg} trong lớp` : ''}</p>
          {vang.top.length ? <ol>{vang.top.map((r, k) => <li key={k} data-toi={r.em ? '1' : undefined}>{r.ten} · {r.ha} lượt hạ{r.tk ? ' · thủ khoa' : ''}</li>)}</ol> : null}
          <p className="st-sau">Ván mới bắt đầu sau vài giây</p>
        </div>
      ) : ketQua ? (
        <div className="st-kq" role="status" style={bienDoi(ketQua.hang[0].doi)}>
          <h2>{nhat ? <><b>{DOI_BPU[nhat.doi].ten}</b> đỗ thủ khoa ván {ketQua.van}!</> : `Hết ván ${ketQua.van} · hoà`}</h2>
          {ketQua.hang.map((h) => (
            <div key={h.doi} className="st-dong" data-nhat={nhat && h.doi === nhat.doi ? '1' : undefined} data-toi={hangEm && h.doi === doiToi ? '1' : undefined} style={bienDoi(h.doi)}>
              <span className="st-hang">{h.xep + 1}</span>
              {bang ? <AnhMa bang={bang} doi={h.doi} /> : null}
              <span className="st-t">{DOI_BPU[h.doi].ten} · {XEP_DOI[h.xep]}{h.nhat ? <small>{h.nhat}</small> : null}</span>
              <span className="st-d">{h.diem}<small>lượt hạ</small></span>
            </div>
          ))}
          <p>{hangEm ? `Đội em: ${XEP_DOI[hangEm.xep]} · ` : ''}Ván mới bắt đầu sau vài giây · mọi người về trại đội mình</p>
        </div>
      ) : null}
    </div>
  )
}
