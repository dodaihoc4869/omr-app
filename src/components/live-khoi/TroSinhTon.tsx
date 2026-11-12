// TRÒ «SINH TỒN» ở phòng chờ Live theo khối (thầy chốt 12/11 «chốt build đẩy luôn lên»; bản vẽ docs/ban-ve-sinh-ton-1211/, đặc tả docs/dac-ta-sinh-ton-1211.md).
// Bốn đội, mỗi em một bé ma đeo súng tự bắn đối thủ gần nhất; KHÔNG có nút điều khiển: vuốt ở đâu cũng chạy, chạm một điểm thì tự chạy tới. Luật nằm cả ở
// LÕI THUẦN src/lib/live-khoi/sinh-ton-loi.ts; tệp này chỉ lo: MỘT canvas (vòng requestAnimationFrame, tab ẩn ⇒ dừng), cử chỉ, kênh lớp, vài lớp DOM phủ.
// Máy yếu / giảm chuyển động ⇒ 30 khung / giây, bỏ quầng sáng. Màu đọc từ biến CSS của app. Lượt hạ trong trò KHÔNG cộng vào kJ buổi học.
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as SuKienTro } from 'react'
import { DOI_BPU } from '../../lib/bpu/phong'
import type { KenhLop, NguoiLop, SinhTonAnh, SinhTonGui, TinLop } from '../../lib/live-khoi/kieu'
import {
  ANH_MS, CAP_TOI_DA, HOP_BK, MAU_DAY, NHIP_GUI_MS, NHIP_NHAC_MS, SUNG_TEN, buocToi, chonMucTieu, anVoi, conLai, dangAn, dangChet, dangNghi, docDong, hopSo, laMay, ngoaiVong,
  nhanDon, satThuong, taoBanDo, taoToi, timDuong, trongBui, vanSo, vong, type BanDo, type Diem, type NhanVat, type Toi,
} from '../../lib/live-khoi/sinh-ton-loi'
import { pha, taoBoHinh, type BangMau, type BoHinh, type Rgb } from './sinh-ton-hinh'
import { K_NV, veBanDoNho, veKhung, type NvVe, type SoBay } from './sinh-ton-ve'
import './tro-giu-lua.css'
import './tro-sinh-ton.css'

export interface TroSinhTonProps {
  /** Em đang chơi; `null` khi `xemThoi` (máy thầy). */ toi: NguoiLop | null
  /** Cả phòng: tên + đội theo số báo danh. */ ds: readonly NguoiLop[]
  kenh: KenhLop
  soEm: number
  mayYeu?: boolean
  /** Khung cha đang bị XOAY HÌNH bằng CSS `rotate(90deg) translateY(-100%)` gốc 0 0 (iPhone cầm dọc) ⇒ đổi toạ độ con trỏ về hệ của khung. */ xoay?: boolean
  /** Máy thầy xem trận: thấy CẢ sân, không có bé ma của mình, không gửi gì. */ xemThoi?: boolean
}

interface ManhTin { c: string; doi?: number }
interface TinTran { id: number; het: number; manh: ManhTin[] }
interface Bao { kieu: 'meo' | 'an' | 'canh' | 'vui'; chu: string }
interface BiHa { ai: string; doi: number; giay: number }
interface KetQua { van: number; hang: { doi: number; diem: number; nhat: string }[] }
/** Nhân vật khác đang nội suy giữa hai ảnh chụp. */
interface NoiSuy { nv: NhanVat; tx: number; ty: number; luc: number; goc: number }

/** Bán kính «cần ảo» vô hình (px): kéo xa chừng này là chạy hết tốc. */
const BK_CAN = 46
const VUNG_CHET = 0.14
/** Ngón tay xê dịch quá chừng này (px) thì là VUỐT, chưa tới thì là CHẠM. */
const NGUONG_KEO = 12
const CHAM_MS = 350
const TIN_SONG_MS = 6000
const BIEN_DOI = DOI_BPU.map((d) => d.mau)
const PHIM: Record<string, [number, number]> = {
  KeyW: [0, -1], ArrowUp: [0, -1], KeyS: [0, 1], ArrowDown: [0, 1], KeyA: [-1, 0], ArrowLeft: [-1, 0], KeyD: [1, 0], ArrowRight: [1, 0],
}
const TRANG: Rgb = [255, 255, 255]

const kepDoi = (d: number): number => (d >= 0 && d < 4 ? Math.floor(d) : 0)
/** Hai chữ cuối của tên (tên gọi của người Việt) cho gọn trên sân. */
const tenNgan = (ten: string): string => ten.trim().split(/\s+/).slice(-2).join(' ')
const bamSo = (id: string): number => { let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 997; return h }
const chuGio = (ms: number): string => { const s = Math.ceil(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` }
const bienDoi = (d: number): CSSProperties => ({ ['--doi' as string]: `var(${DOI_BPU[kepDoi(d)].mau})` }) as CSSProperties

/** Đổi chuỗi màu trình duyệt đã tính (`rgb(…)` hoặc `color(srgb …)`) thành ba số 0..255. */
function tachMau(chuoi: string, macDinh: Rgb): Rgb {
  const so = chuoi.match(/-?\d*\.?\d+(?:e-?\d+)?/g)
  if (!so || so.length < 3) return macDinh
  const he = chuoi.startsWith('color(') ? 255 : 1
  const v = so.slice(0, 3).map((x) => Math.max(0, Math.min(255, Math.round(Number(x) * he))))
  return [v[0], v[1], v[2]]
}
/** Đọc bảng màu từ biến CSS tại đúng chỗ trò đang đứng (phòng chờ luôn nền xanh than). */
function docBangMau(goc: HTMLElement): BangMau {
  const que = document.createElement('span')
  que.style.display = 'none'
  goc.appendChild(que)
  const kieuGoc = getComputedStyle(goc)
  const chuGoc = tachMau(kieuGoc.color, [128, 128, 128])
  const doc = (bien: string, macDinh: Rgb): Rgb => {
    que.style.color = ''
    que.style.color = `var(${bien})`
    return que.style.color ? tachMau(getComputedStyle(que).color, macDinh) : macDinh
  }
  const chu = doc('--tr-chu', chuGoc), nen = doc('--tr-nen', [255 - chu[0], 255 - chu[1], 255 - chu[2]]), muc = doc('--p-muc', pha(nen, [0, 0, 0], 0.4))
  const bang: BangMau = {
    doi: BIEN_DOI.map((b) => doc(b, chu)), nen, nen2: pha(nen, [0, 0, 0], 0.26), vien: doc('--tr-vien', pha(nen, chu, 0.2)), chu, chu2: doc('--tr-chu-2', chu), chu3: doc('--tr-chu-3', chu),
    sao: doc('--tr-sao', chu), tin: doc('--tr-tin', chu), dung: doc('--tr-dung', chu), sai: doc('--tr-sai', chu), muc, trang: TRANG, phong: kieuGoc.fontFamily || 'sans-serif',
  }
  que.remove()
  return bang
}

/** Hình bé ma nhỏ của một đội (bảng hết ván). */
function AnhMa({ bang, doi }: { bang: BangMau; doi: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cv = ref.current, g = cv?.getContext('2d')
    if (!cv || !g) return
    const dpr = Math.min(2, window.devicePixelRatio || 1), k = 0.32
    cv.width = Math.round(30 * dpr); cv.height = Math.round(38 * dpr)
    const a = taoBoHinh(bang, k * dpr).than(doi, false)
    g.setTransform(dpr, 0, 0, dpr, 0, 0)
    g.clearRect(0, 0, 30, 38)
    g.drawImage(a.cv, 15 + a.x * k, 37 + a.y * k, a.w * k, a.h * k)
  }, [bang, doi])
  return <canvas ref={ref} className="st-ma" aria-hidden="true" />
}

export default function TroSinhTon({ toi, ds, kenh, soEm, mayYeu = false, xoay = false, xemThoi = false }: TroSinhTonProps) {
  const xem = xemThoi || !toi
  const sbd = toi?.sbd ?? ''
  const doiToi = kepDoi(toi?.doi ?? 0)
  const gocRef = useRef<HTMLDivElement>(null)
  const vaiRef = useRef<HTMLCanvasElement>(null)
  const nhoRef = useRef<HTMLCanvasElement>(null)
  /** Đầu vào đang giữ: hướng vuốt, bàn phím, và một lần CHẠM chờ khung kế tiếp đổi ra toạ độ sân. */
  const vao = useRef({ cx: 0, cy: 0, phim: {} as Record<string, boolean>, id: -1, gx: 0, gy: 0, t0: 0, keo: false, cham: null as Diem | null, daDung: false })
  const dsRef = useRef(ds)
  const [diem, setDiem] = useState<[number, number, number, number]>([0, 0, 0, 0])
  const [gio, setGio] = useState({ van: 1, con: '1:30' })
  const [tin, setTin] = useState<TinTran[]>([])
  const [bao, setBao] = useState<Bao | null>(null)
  const [cap, setCap] = useState(1)
  const [biHa, setBiHa] = useState<BiHa | null>(null)
  const [ketQua, setKetQua] = useState<KetQua | null>(null)
  const [bang, setBang] = useState<BangMau | null>(null)

  useEffect(() => { dsRef.current = ds }, [ds])

  useEffect(() => {
    const goc = gocRef.current, vai = vaiRef.current
    const g = vai?.getContext('2d')
    if (!goc || !vai || !g) return
    const giam = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const nhe = mayYeu || giam
    const nhipKhung = nhe ? 1000 / 30 : 0
    const hat = bamSo(sbd) / 997

    // ── Trạng thái trò (không qua React: đổi 60 lần / giây) ──
    let bd: BanDo = taoBanDo(0)
    let tt: Toi = taoToi(bd, doiToi, Date.now(), hat)
    let noi: Record<string, NoiSuy> = {}
    /** Lệch giờ phòng so với đồng hồ máy (ms), làm mượt theo dấu `l` của từng ảnh chụp. */
    let lech = 0, coLech = false
    let lucAnh = 0, soAnh = 0
    let mucTieu = '', lucNgam = 0, huong = 0
    /** `choA` = mã kẻ hạ em còn chờ báo phòng; `keHa` = kẻ hạ em ở lượt này ('' = hết máu ngoài vòng). */
    let choA = '', keHa = '', choH = -1, hopNhan = -1
    let vanHien = 1, lucNho = 0
    let hop: [number, string] = [-1, '']
    let lucGui = 0, khoaGui = ''
    let chetCu = false, nghiCu = false, vanKq = -1
    const soHa = new Map<string, number>()
    let so: SoBay[] = []
    let dsTin: TinTran[] = [], soTin = 0
    let vui: { chu: string; het: number } | null = null
    let baoCu = '', diemCu = '', gioCu = '', capCu = 1, haCu = ''
    const lucMo = performance.now()
    const khac: NhanVat[] = []
    const nvVe: NvVe[] = []

    // ── Khung vẽ ──
    let W = 0, H = 0, ti = 1, dpr = 1
    let bm = docBangMau(goc)
    let hinh: BoHinh = taoBoHinh(bm, 1)
    setBang(bm)
    const doKhung = () => {
      W = goc.clientWidth; H = goc.clientHeight
      if (!W || !H) return
      dpr = Math.min(nhe ? 1.5 : 2, window.devicePixelRatio || 1)
      vai.width = Math.round(W * dpr); vai.height = Math.round(H * dpr)
      // Mọi máy thấy CÙNG diện tích sân (máy to không nhìn xa hơn máy nhỏ); máy thầy thấy cả sân.
      ti = xem ? Math.min(W / (bd.rong + 40), H / (bd.cao + 40)) : Math.max(0.5, Math.min(1.7, Math.sqrt((W * H) / (1000 * 520))))
      hinh = taoBoHinh(bm, K_NV * ti * dpr)
    }
    const doiMau = () => { bm = docBangMau(goc); setBang(bm); doKhung() }

    // ── Tin trận, dòng chữ nhỏ (DOM, chỉ đặt lại khi đổi) ──
    const tenCua = (id: string): string => (laMay(id) ? 'Máy' : !xem && id === sbd ? 'Em' : tenNgan(dsRef.current.find((n) => n.sbd === id)?.ten ?? `Bạn ${id}`))
    const doiCua = (id: string): number => (!xem && id === sbd ? doiToi : noi[id]?.nv.doi ?? dsRef.current.find((n) => n.sbd === id)?.doi ?? 0)
    const themTin = (manh: ManhTin[], luc: number) => {
      dsTin = [...dsTin, { id: ++soTin, het: luc + TIN_SONG_MS, manh }].slice(-2)
      setTin(dsTin)
    }
    const datBao = (b: Bao | null) => {
      const khoa = b ? b.kieu + b.chu : ''
      if (khoa === baoCu) return
      baoCu = khoa; setBao(b)
    }
    const baoVui = (chu: string, luc: number) => { vui = { chu, het: luc + 2600 } }
    const lenCap = (luc: number) => {
      if (tt.cap >= CAP_TOI_DA) return
      tt = { ...tt, cap: tt.cap + 1 }
      baoVui(`Súng lên cấp ${tt.cap} · ${SUNG_TEN[tt.cap - 1]}`, luc)
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
      if (typeof anh.c === 'number' && anh.c !== bd.cap) {
        bd = taoBanDo(anh.c)
        if (!xem) tt = { ...taoToi(bd, doiToi, nay, hat), cap: tt.cap, mau: tt.mau }
        doKhung()
      }
      const moi: Record<string, NoiSuy> = {}
      const emThatCu = [0, 0, 0, 0]
      for (const id in noi) if (!laMay(id)) emThatCu[noi[id].nv.doi]++
      for (const id in anh.ds) {
        if (!xem && id === sbd) continue
        const nv = docDong(id, anh.ds[id])
        if (!nv) continue
        const cu = noi[id]
        if (cu) {
          const f = Math.min(1, (luc - cu.luc) / ANH_MS)
          // Vừa hồi sinh (nhảy về trại) thì không trượt ngang sân.
          const nhay = Math.hypot(nv.x - cu.nv.x, nv.y - cu.nv.y) > 260
          moi[id] = { nv, tx: nhay ? nv.x : cu.tx + (cu.nv.x - cu.tx) * f, ty: nhay ? nv.y : cu.ty + (cu.nv.y - cu.ty) * f, luc, goc: cu.goc }
          if (!xem && id === mucTieu && nv.mau < cu.nv.mau && cu.nv.mau > 0) so.push({ x: nv.x + 34, y: nv.y - 70, chu: `−${Math.round(cu.nv.mau - nv.mau)} máu`, luc })
        } else {
          moi[id] = { nv, tx: nv.x, ty: nv.y, luc, goc: nv.x > bd.rong / 2 ? Math.PI : 0 }
          // Em mới vào giữa trận: đội còn thiếu người thì em thay một máy.
          if (soAnh > 1 && !laMay(id)) baoVui(`${tenCua(id)} vào ${DOI_BPU[nv.doi].ten}${emThatCu[nv.doi] + (!xem && nv.doi === doiToi ? 1 : 0) < 4 ? ' · thay một máy' : ''}`, luc)
        }
      }
      noi = moi
      if (so.length > 6) so = so.slice(-6)
      for (const dong of Array.isArray(anh.an) ? anh.an : []) {
        if (!Array.isArray(dong) || typeof dong[0] !== 'string' || typeof dong[1] !== 'string') continue
        soHa.set(dong[0], (soHa.get(dong[0]) ?? 0) + 1)
        // Máy hạ máy thì không báo (đỡ rối tin trận); có em thật ở một trong hai phía mới hiện.
        if (!laMay(dong[0]) || !laMay(dong[1])) themTin([{ c: tenCua(dong[0]), doi: doiCua(dong[0]) }, { c: ' hạ ' }, { c: tenCua(dong[1]), doi: doiCua(dong[1]) }], luc)
        if (!xem && dong[0] === sbd && !dangChet(tt, nay)) lenCap(luc)
      }
      if (typeof anh.v === 'number' && anh.v > 0) vanHien = anh.v
      if (Array.isArray(anh.d) && anh.d.length === 4 && anh.d.join() !== diemCu) { diemCu = anh.d.join(); setDiem([anh.d[0], anh.d[1], anh.d[2], anh.d[3]]) }
      if (Array.isArray(anh.h) && typeof anh.h[0] === 'number') {
        hop = [anh.h[0], typeof anh.h[1] === 'string' ? anh.h[1] : '']
        if (!xem && hop[1] === sbd && hop[0] !== hopNhan) {
          hopNhan = hop[0]
          if (!dangChet(tt, nay)) { tt = { ...tt, mau: MAU_DAY }; lenCap(luc); if (tt.cap >= CAP_TOI_DA) baoVui('Hộp tiếp tế · đầy máu', luc) }
        }
      }
      if (xem) return
      // Em bị bắn: tự tính từ ảnh chụp (ai khai đang bắn em).
      const quanh: NhanVat[] = []
      for (const id in noi) quanh.push(noi[id].nv)
      const don = satThuong({ id: sbd, x: tt.x, y: tt.y, doi: doiToi }, quanh, ANH_MS / 1000)
      const song = !dangChet(tt, nay)
      tt = nhanDon(tt, don.tong, nay)
      if (song && dangChet(tt, nay)) { choA = don.ai; keHa = don.ai }
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
      const nay = Date.now() + lech
      const nghi = dangNghi(nay), van = vanSo(nay), v = vong(bd, nay)
      const matMang = soAnh > 0 && luc - lucAnh > 2500
      // Nhân vật khác tại lúc này (nội suy giữa hai ảnh chụp); dùng lại mảng để không sinh rác mỗi khung.
      let n = 0
      for (const id in noi) {
        const o = noi[id], f = Math.min(1, (luc - o.luc) / ANH_MS)
        const k = khac[n] ?? (khac[n] = { id: '', x: 0, y: 0, mau: 0, doi: 0, cap: 1, t: '' })
        k.id = id; k.x = o.tx + (o.nv.x - o.tx) * f; k.y = o.ty + (o.nv.y - o.ty) * f; k.mau = o.nv.mau; k.doi = o.nv.doi; k.cap = o.nv.cap; k.t = o.nv.t
        n++
      }
      khac.length = n
      if (!xem) {
        if (van !== tt.van) { tt = taoToi(bd, doiToi, nay, hat); soHa.clear(); mucTieu = ''; vao.current.cham = null }
        const i = vao.current
        let dx = i.cx, dy = i.cy
        for (const ma in PHIM) if (i.phim[ma]) { dx += PHIM[ma][0]; dy += PHIM[ma][1] }
        if (dx || dy) i.daDung = true
        // Chạm một điểm ⇒ tự chạy tới, vòng qua tường.
        if (i.cham && !dangChet(tt, nay)) {
          const camX = Math.max(W / 2 / ti - 40, Math.min(bd.rong + 40 - W / 2 / ti, tt.x)), camY = Math.max(H / 2 / ti - 40, Math.min(bd.cao + 40 - H / 2 / ti, tt.y - 34))
          tt = { ...tt, duong: timDuong(bd, tt.x, tt.y, camX + (i.cham.x - W / 2) / ti, camY + (i.cham.y - H / 2) / ti) }
          i.daDung = true
        }
        i.cham = null
        const xCu = tt.x, yCu = tt.y, songTruoc = !dangChet(tt, nay)
        tt = buocToi(bd, tt, { dx, dy }, dt, nay, hat)
        if (songTruoc && dangChet(tt, nay)) keHa = ''
        if (tt.x !== xCu || tt.y !== yCu) huong = Math.atan2(tt.y - yCu, tt.x - xCu)
        const chet = dangChet(tt, nay)
        if (luc - lucNgam >= 100) { lucNgam = luc; mucTieu = chet || nghi || dangAn(bd, tt, nay) ? '' : chonMucTieu(bd, tt, khac) }
        // Hộp tiếp tế: chạm là xin phòng (em chạm đầu tiên được nhận).
        const soHop = hopSo(nay)
        if (!chet && !nghi && hop[0] !== soHop && choH !== soHop && Math.hypot(tt.x - bd.rong / 2, tt.y - bd.cao / 2) < HOP_BK) choH = soHop
        // Gửi ≤ 4 gói / giây; đứng yên vẫn nhắc mỗi 2 giây để phòng không gỡ em.
        const goi: SinhTonGui = { p: [Math.round(tt.x), Math.round(tt.y), chet ? 0 : Math.max(1, Math.round(tt.mau)), tt.cap] }
        if (mucTieu) goi.t = mucTieu
        const khoa = `${goi.p.join()}|${mucTieu}`
        if ((luc - lucGui >= NHIP_GUI_MS && (khoa !== khoaGui || choA || choH === soHop)) || luc - lucGui >= NHIP_NHAC_MS) {
          if (choA) { goi.a = choA; choA = '' }
          if (choH === soHop && hop[0] !== soHop) goi.h = soHop
          lucGui = luc; khoaGui = khoa
          kenh.gui('tro', goi)
        }
        // Lớp DOM: bị hạ, cấp súng, dòng chữ nhỏ.
        if (chet !== chetCu || chet) {
          const giay = chet ? Math.max(1, Math.ceil((tt.chetDen - nay) / 1000)) : 0
          const khoaHa = chet ? `${keHa}|${giay}` : ''
          if (khoaHa !== haCu) { haCu = khoaHa; setBiHa(chet ? { ai: keHa ? tenCua(keHa) : '', doi: keHa ? doiCua(keHa) : -1, giay } : null) }
          chetCu = chet
        }
        if (tt.cap !== capCu) { capCu = tt.cap; setCap(tt.cap) }
        const an = !chet && dangAn(bd, tt, nay)
        if (vui && vui.het <= luc) vui = null
        if (chet || nghi) datBao(null)
        else if (matMang) datBao({ kieu: 'canh', chu: 'Mất kết nối · đang nối lại · em vẫn chạy được, các bạn tạm đứng yên' })
        else if (vui) datBao({ kieu: 'vui', chu: vui.chu })
        else if (ngoaiVong(v, tt.x, tt.y)) datBao({ kieu: 'canh', chu: 'Ngoài vòng an toàn · đang mất máu · chạy vào trong vòng' })
        else if (an) datBao({ kieu: 'an', chu: `Đang ẩn trong bụi · đội khác không thấy em${tt.mau < MAU_DAY ? ' · máu đang hồi' : ''}` })
        else if (!i.daDung && luc - lucMo < 9000) datBao({ kieu: 'meo', chu: 'Vuốt để chạy · Chạm để tới · Súng tự bắn đối thủ gần nhất' })
        else datBao(null)
      } else {
        if (vui && vui.het <= luc) vui = null
        datBao(vui ? { kieu: 'vui', chu: vui.chu } : null)
      }
      // Hết ván: bảng xếp hạng bốn đội (một lần mỗi ván).
      if (nghi !== nghiCu) {
        nghiCu = nghi
        if (nghi && vanKq !== van) {
          vanKq = van
          const d = diemCu ? diemCu.split(',').map(Number) : [0, 0, 0, 0]
          const hang = [0, 1, 2, 3].map((doi) => {
            let nhat = '', nhieu = 0
            for (const [id, soLan] of soHa) if (soLan > nhieu && !laMay(id) && doiCua(id) === doi) { nhieu = soLan; nhat = `${tenCua(id)} ${soLan} lượt hạ · nhiều nhất đội` }
            return { doi, diem: d[doi] ?? 0, nhat }
          }).sort((a, b) => b.diem - a.diem)
          setKetQua({ van: vanHien, hang })
        } else if (!nghi) setKetQua(null)
      }
      if (luc - lucCham >= 500) {
        lucCham = luc
        const chu = chuGio(conLai(nay)), khoa = `${vanHien}|${chu}`
        if (khoa !== gioCu) { gioCu = khoa; setGio({ van: vanHien, con: chu }) }
        if (dsTin.length && dsTin[0].het <= luc) { dsTin = dsTin.filter((t) => t.het > luc); setTin(dsTin) }
        so = so.filter((s) => luc - s.luc < 700)
      }
      // ── Dựng danh sách vẽ ──
      let m = 0
      const them = (): NvVe => nvVe[m] ?? (nvVe[m] = { id: '', x: 0, y: 0, mau: 0, doi: 0, cap: 1, goc: 0, ban: false, dx: 0, dy: 0, may: false, toi: false, mo: 1, ten: '', an: false })
      const viTri = (id: string): NhanVat | undefined => (!xem && id === sbd ? { id, x: tt.x, y: tt.y, mau: tt.mau, doi: doiToi, cap: tt.cap, t: mucTieu } : khac.find((k) => k.id === id))
      for (const k of khac) {
        // Đối thủ ẩn trong bụi: em không thấy (máy thầy thấy hết, vẽ mờ).
        const an = !k.t && trongBui(bd, k.x, k.y)
        if (!xem && k.mau > 0 && anVoi(bd, k, tt.x, tt.y, doiToi)) continue
        const o = noi[k.id], mt = k.t ? viTri(k.t) : undefined, e = them()
        if (mt) o.goc = Math.atan2(mt.y - 34 - (k.y - 25), mt.x - k.x)
        else if (Math.hypot(o.nv.x - o.tx, o.nv.y - o.ty) > 4) o.goc = Math.atan2(o.nv.y - o.ty, o.nv.x - o.tx)
        e.id = k.id; e.x = k.x; e.y = k.y; e.mau = k.mau; e.doi = k.doi; e.cap = k.cap; e.goc = o.goc
        e.ban = !!mt && !nghi && k.mau > 0; e.dx = mt?.x ?? 0; e.dy = mt?.y ?? 0
        e.may = laMay(k.id); e.toi = false; e.an = an && k.mau > 0
        e.mo = k.mau <= 0 ? 0.25 : matMang ? 0.45 : e.an ? 0.6 : 1
        e.ten = e.may ? 'Máy' : tenCua(k.id)
        m++
      }
      let camX = bd.rong / 2, camY = bd.cao / 2, duong: Diem[] | null = null
      if (!xem) {
        const chet = dangChet(tt, nay), mt = mucTieu ? khac.find((k) => k.id === mucTieu) : undefined, e = them()
        if (mt) huong = Math.atan2(mt.y - 34 - (tt.y - 25), mt.x - tt.x)
        e.id = sbd; e.x = tt.x; e.y = tt.y; e.mau = chet ? 0 : tt.mau; e.doi = doiToi; e.cap = tt.cap; e.goc = huong
        e.ban = !!mt; e.dx = mt?.x ?? 0; e.dy = mt?.y ?? 0; e.may = false; e.toi = true
        e.an = !chet && dangAn(bd, tt, nay); e.mo = chet ? 0.25 : e.an ? 0.6 : 1; e.ten = `${tenNgan(toi?.ten ?? '')} (em)`
        m++
        camX = Math.max(W / 2 / ti - 40, Math.min(bd.rong + 40 - W / 2 / ti, tt.x)); camY = Math.max(H / 2 / ti - 40, Math.min(bd.cao + 40 - H / 2 / ti, tt.y - 34))
        if (W / ti >= bd.rong + 80) camX = bd.rong / 2
        if (H / ti >= bd.cao + 80) camY = bd.cao / 2
        if (tt.duong.length) duong = [{ x: tt.x, y: tt.y }, ...tt.duong]
      }
      nvVe.length = m
      veKhung({ g, W, H, dpr, ti, cx: camX, cy: camY, bd, bang: bm, hinh, nhe, luc, vong: v, nv: nvVe, hopCo: !nghi && hop[0] !== hopSo(nay), nghi, duong, so })
      const nho = nhoRef.current, gn = nho?.getContext('2d')
      if (nho && gn && luc - lucNho >= 500) {
        lucNho = luc
        const r = 130, c = Math.round((r * bd.cao) / bd.rong), d2 = Math.min(2, window.devicePixelRatio || 1)
        if (nho.width !== Math.round(r * d2)) { nho.width = Math.round(r * d2); nho.height = Math.round(c * d2) }
        veBanDoNho(gn, r, c, d2, bd, bm, v, nvVe, doiToi)
      }
    }
    const chay = () => { if (!rafId && !document.hidden) { lucTruoc = 0; rafId = requestAnimationFrame(khung) } }
    const dung = () => { if (rafId) cancelAnimationFrame(rafId); rafId = 0 }
    const doiHien = () => { if (document.hidden) dung(); else chay() }

    // ── Bàn phím (máy tính): WASD / mũi tên để đi. Đang gõ chữ (chat) thì bỏ qua. ──
    const dangGo = (e: KeyboardEvent) => {
      const d = e.target as HTMLElement | null
      return !!d && (d.tagName === 'INPUT' || d.tagName === 'TEXTAREA' || d.tagName === 'SELECT' || d.isContentEditable)
    }
    const phimXuong = (e: KeyboardEvent) => {
      if (dangGo(e) || e.ctrlKey || e.metaKey || e.altKey) return
      if (PHIM[e.code]) { vao.current.phim[e.code] = true; e.preventDefault() }
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
      dung(); boNghe(); quanSat?.disconnect()
      nenToi?.removeEventListener?.('change', doiMau)
      window.removeEventListener('resize', doKhung)
      window.removeEventListener('keydown', phimXuong)
      window.removeEventListener('keyup', phimLen)
      window.removeEventListener('blur', buongPhim)
      document.removeEventListener('visibilitychange', doiHien)
    }
  }, [kenh, sbd, doiToi, mayYeu, xem]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Cử chỉ: VUỐT ở đâu cũng là cần ảo vô hình; CHẠM nhanh một điểm = chạy tới đó. Toạ độ đổi về hệ của KHUNG (lớp live có thể xoay 90° bằng CSS). ──
  const toaDo = (e: SuKienTro) => {
    const r = (vaiRef.current ?? e.currentTarget).getBoundingClientRect()
    return xoay ? { x: e.clientY - r.top, y: r.right - e.clientX } : { x: e.clientX - r.left, y: e.clientY - r.top }
  }
  const xuong = (e: SuKienTro<HTMLDivElement>) => {
    const i = vao.current
    if (i.id !== -1) return
    const p = toaDo(e)
    i.id = e.pointerId; i.gx = p.x; i.gy = p.y; i.cx = 0; i.cy = 0; i.keo = false; i.t0 = performance.now()
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
    if (!i.keo && e.type === 'pointerup' && performance.now() - i.t0 < CHAM_MS) i.cham = { x: i.gx, y: i.gy }
    i.id = -1; i.cx = 0; i.cy = 0; i.keo = false
  }

  const tenToi = toi ? DOI_BPU[doiToi].ten : ''
  return (
    <div className="gl st" ref={gocRef} style={bienDoi(doiToi)} data-xem={xem ? '1' : undefined}>
      <canvas className="gl-san" ref={vaiRef} aria-hidden="true" />
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
          <li key={t.id}>{t.manh.map((m, i) => (m.doi !== undefined && m.doi >= 0 && m.doi < 4 ? <b key={i} style={bienDoi(m.doi)}>{m.c}</b> : <span key={i}>{m.c}</span>))}</li>
        ))}
      </ul>
      {bao ? <div className="st-bao" data-kieu={bao.kieu} role="status">{bao.chu}</div> : null}
      {xem ? null : (
        <div className="st-sung" aria-label={`Súng của em: cấp ${cap} trên ${CAP_TOI_DA}, ${SUNG_TEN[cap - 1]}`}>
          {[1, 2, 3, 4].map((i) => <i key={i} data-co={i <= cap ? '1' : undefined} />)}Súng cấp {cap} · {SUNG_TEN[cap - 1]}
        </div>
      )}
      {xem ? null : <div className="st-bd"><canvas ref={nhoRef} aria-hidden="true" /><span>Bản đồ · vòng an toàn</span></div>}
      {xem ? null : <div className="st-cho"><i />Phòng chờ · {soEm} em đã vào · chờ thầy bấm Bắt đầu</div>}
      {biHa && !ketQua ? (
        <div className="st-ha" role="status">
          <h2>{biHa.ai ? <><b style={bienDoi(biHa.doi)}>{biHa.ai} · {DOI_BPU[kepDoi(biHa.doi)].ten}</b> vừa hạ em</> : 'Em hết máu ngoài vòng an toàn'}</h2>
          <p>Em hồi sinh ở trại {tenToi}</p>
          <div className="st-dem">{biHa.giay}</div>
          <small>giây nữa</small>
        </div>
      ) : null}
      {ketQua ? (
        <div className="st-kq" role="status" style={bienDoi(ketQua.hang[0].doi)}>
          <h2>Hết ván {ketQua.van} · {ketQua.hang[0].diem > (ketQua.hang[1]?.diem ?? 0) ? <><b>{DOI_BPU[ketQua.hang[0].doi].ten}</b> thắng</> : 'hoà'}</h2>
          {ketQua.hang.map((h, i) => (
            <div key={h.doi} className="st-dong" data-nhat={i === 0 && h.diem > (ketQua.hang[1]?.diem ?? 0) ? '1' : undefined} style={bienDoi(h.doi)}>
              <span className="st-hang">{i + 1}</span>
              {bang ? <AnhMa bang={bang} doi={h.doi} /> : null}
              <span className="st-t">{DOI_BPU[h.doi].ten}{h.nhat ? <small>{h.nhat}</small> : null}</span>
              <span className="st-d">{h.diem}<small>lượt hạ</small></span>
            </div>
          ))}
          <p>Ván mới bắt đầu sau vài giây · mọi người về trại đội mình</p>
        </div>
      ) : null}
    </div>
  )
}
