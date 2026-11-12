// TRÒ «GIỮ LỬA» ở phòng chờ Live theo khối (thầy duyệt bản vẽ 12/11: docs/ban-ve-live-moi-1211/08-em-phong-cho-giu-lua-844.jpg; đặc tả mục 4, 5).
// Mỗi em là một đốm lửa màu đội: gom hạt để lớn, tránh đốm lớn đội khác, mang năng lượng về góc đội. Luật nằm cả ở LÕI THUẦN src/lib/live-khoi/tro-loi.ts;
// tệp này chỉ lo: MỘT canvas (vòng requestAnimationFrame, tab ẩn ⇒ dừng), điều khiển (cần ảo / nút / bàn phím), kênh lớp, và vài lớp DOM phủ trên.
// Máy yếu / giảm chuyển động ⇒ 30 khung / giây, bỏ hào quang. Màu đọc từ biến CSS của app (không mã màu thô). kJ trong trò KHÔNG cộng vào kJ buổi học.
import { toaDoXoay } from '../live/chieu-xoay'
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as SuKienTro } from 'react'
import { DOI_BPU } from '../../lib/bpu/phong'
import { SAN_CAO, SAN_RONG, type KenhLop, type NguoiLop, type TinLop, type TroAnh } from '../../lib/live-khoi/kieu'
import {
  M_MIN, vanSo, apThuong, banKinh, buoc, capLua, capNhatDomKhac, dangChet, diemDoi, dungGoi, gocDoi, hatHien, hoiTang, sinhHat, taoNhipGui, taoToi, thuGui,
  viTriDom, vongLanh, type DomKhac, type DomNoiSuy, type Hat, type NhipGui, type TrangThaiToi,
} from '../../lib/live-khoi/tro-loi'
import './tro-giu-lua.css'

export interface TroGiuLuaProps {
  /** Em đang chơi; `null` khi `xemThoi` (máy thầy). */ toi: NguoiLop | null
  /** Cả phòng: tên + đội theo số báo danh. */ ds: readonly NguoiLop[]
  kenh: KenhLop
  soEm: number
  mayYeu?: boolean
  /** Khung cha đang bị XOAY HÌNH bằng CSS `rotate(90deg) translateY(-100%)` gốc 0 0 (iPhone cầm dọc) ⇒ đổi toạ độ con trỏ về hệ của khung. */ xoay?: boolean
  /** Máy thầy xem trận: không có đốm của mình, không cần / nút, không gửi gì — chỉ nghe ảnh chụp và vẽ; dải dưới ẩn. */ xemThoi?: boolean
}

type Rgb = [number, number, number]
interface ManhTin { c: string; doi?: number }
interface TinTran { id: number; het: number; manh: ManhTin[] }
interface Bao { kieu: 'thu' | 'lanh' | 'meo'; chu: string }
interface BangMau { doi: Rgb[]; nen: Rgb; chu: Rgb; sao: Rgb; tin: Rgb; phong: string }

const TAU = Math.PI * 2
/** Bán kính cần ảo (px) và vùng chết. */
const BK_CAN = 46
const VUNG_CHET = 0.14
/** Đốm từ khối lượng này trở lên mới hiện tên (đỡ rối khi 80–100 em). */
const M_HIEN_TEN = 60
/** …và chỉ tối đa chừng này đốm lớn nhất. */
const SO_TEN = 8
const TIN_SONG_MS = 7000
/** Ba path ngọn lửa — đúng `NgonLua` ở src/components/bpu/ManBinhPhanUng.tsx (viewBox 64 × 80). */
const LUA_NGOAI = 'M32 4C35 17 50 25 54 40c4 17-7 34-22 34S6 57 10 40c2-8 7-12 9-19 3 7 6 10 9 11-1-10 1-19 4-28z'
const LUA_GIUA = 'M32 28c2 9 12 14 14 24 2 12-5 21-14 21s-16-9-14-21c1-5 4-9 6-13 1 4 3 7 6 8-1-7 0-13 2-19z'
const LUA_LOI = 'M32 47c2 6 8 9 8 16a8 8 0 0 1-16 0c0-7 6-10 8-16z'
const BIEN_DOI = DOI_BPU.map((d) => d.mau)
const PHIM: Record<string, [number, number]> = {
  KeyW: [0, -1], ArrowUp: [0, -1], KeyS: [0, 1], ArrowDown: [0, 1], KeyA: [-1, 0], ArrowLeft: [-1, 0], KeyD: [1, 0], ArrowRight: [1, 0],
}

const kepDoi = (d: number) => (d >= 0 && d < 4 ? Math.floor(d) : 0)
/** Hai chữ cuối của tên (tên gọi của người Việt) cho gọn trên sân. */
const tenNgan = (ten: string) => ten.trim().split(/\s+/).slice(-2).join(' ')
const mau = (c: Rgb, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`
/** Pha hai màu đã đọc từ biến: `t` = phần của `b`. */
const pha = (a: Rgb, b: Rgb, t: number): Rgb => [Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t), Math.round(a[2] + (b[2] - a[2]) * t)]
const sangHon = (c: Rgb, t: number): Rgb => [Math.round(c[0] + (255 - c[0]) * t), Math.round(c[1] + (255 - c[1]) * t), Math.round(c[2] + (255 - c[2]) * t)]
const toiHon = (c: Rgb, t: number): Rgb => [Math.round(c[0] * t), Math.round(c[1] * t), Math.round(c[2] * t)]

/** Đổi chuỗi màu trình duyệt đã tính (`rgb(…)` hoặc `color(srgb …)`) thành ba số 0..255. */
function tachMau(chuoi: string, macDinh: Rgb): Rgb {
  const so = chuoi.match(/-?\d*\.?\d+(?:e-?\d+)?/g)
  if (!so || so.length < 3) return macDinh
  const he = chuoi.startsWith('color(') ? 255 : 1
  const v = so.slice(0, 3).map((x) => Math.max(0, Math.min(255, Math.round(Number(x) * he))))
  return [v[0], v[1], v[2]]
}
/** Đọc bảng màu từ biến CSS tại đúng chỗ trò đang đứng (theo nền sáng / tối của app). */
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
  const chu = doc('--tr-chu', chuGoc)
  const bang: BangMau = {
    doi: BIEN_DOI.map((b) => doc(b, chu)), nen: doc('--tr-nen', [255 - chu[0], 255 - chu[1], 255 - chu[2]]), chu,
    sao: doc('--tr-sao', chu), tin: doc('--tr-tin', chu), phong: kieuGoc.fontFamily || 'sans-serif',
  }
  que.remove()
  return bang
}
function taoVai(canh: number): [HTMLCanvasElement, CanvasRenderingContext2D | null] {
  const cv = document.createElement('canvas')
  cv.width = canh; cv.height = canh
  return [cv, cv.getContext('2d')]
}
/** Ảnh sẵn của một đốm (vẽ một lần, mỗi khung chỉ dán): thân gradient màu đội; `hao` ⇒ thêm quầng sáng nướng sẵn (không dùng shadowBlur lúc chạy). */
function taoAnhDom(c: Rgb, hao: boolean): HTMLCanvasElement {
  const [cv, g] = taoVai(128)
  if (!g) return cv
  const r = hao ? 40 : 60
  if (hao) {
    const q = g.createRadialGradient(64, 64, r * 0.7, 64, 64, 64)
    q.addColorStop(0, mau(c, 0.55)); q.addColorStop(1, mau(c, 0))
    g.fillStyle = q; g.fillRect(0, 0, 128, 128)
  }
  const t = g.createRadialGradient(64 - r * 0.3, 64 - r * 0.4, r * 0.05, 64, 64, r)
  t.addColorStop(0, mau(sangHon(c, 0.85))); t.addColorStop(0.55, mau(c)); t.addColorStop(1, mau(toiHon(c, 0.8)))
  g.fillStyle = t; g.beginPath(); g.arc(64, 64, r, 0, TAU); g.fill()
  return cv
}
function taoAnhHat(c: Rgb, hao: boolean): HTMLCanvasElement {
  const [cv, g] = taoVai(32)
  if (!g) return cv
  if (hao) {
    const q = g.createRadialGradient(16, 16, 3, 16, 16, 16)
    q.addColorStop(0, mau(c, 0.7)); q.addColorStop(1, mau(c, 0))
    g.fillStyle = q; g.fillRect(0, 0, 32, 32)
  }
  g.fillStyle = mau(c); g.beginPath(); g.arc(16, 16, hao ? 7 : 11, 0, TAU); g.fill()
  return cv
}

export default function TroGiuLua({ toi, ds, kenh, soEm, mayYeu = false, xoay = false, xemThoi = false }: TroGiuLuaProps) {
  const xem = xemThoi || !toi
  const sbd = toi?.sbd ?? ''
  const tenToi = toi?.ten ?? ''
  const gocRef = useRef<HTMLDivElement>(null)
  const vaiRef = useRef<HTMLCanvasElement>(null)
  const canRef = useRef<HTMLDivElement>(null)
  const numRef = useRef<HTMLElement>(null)
  const tangRef = useRef<HTMLButtonElement>(null)
  /** Đầu vào đang giữ: cần ảo, bàn phím, và một lần bấm «Tăng tốc» chờ khung kế tiếp. */
  const vao = useRef({ cx: 0, cy: 0, phim: {} as Record<string, boolean>, tang: false, canId: -1, gx: 0, gy: 0 })
  const dsRef = useRef(ds)
  const tenRef = useRef(tenToi)
  const [diem, setDiem] = useState<[number, number, number, number]>([0, 0, 0, 0])
  const [tin, setTin] = useState<TinTran[]>([])
  const [bao, setBao] = useState<Bao | null>(null)
  const doiToi = kepDoi(toi?.doi ?? 0)

  useEffect(() => { dsRef.current = ds; tenRef.current = tenToi }, [ds, tenToi])

  useEffect(() => {
    const goc = gocRef.current, vai = vaiRef.current
    const g = vai?.getContext('2d')
    if (!goc || !vai || !g) return
    const sbdToi = sbd
    /** Người xem không thuộc đội nào: điểm đội chỉ là tổng các đốm trong ảnh chụp. */
    const doiDiem = xem ? -1 : doiToi
    const giam = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const nhe = mayYeu || giam
    const nhipKhung = nhe ? 1000 / 30 : 0
    const coLua = typeof Path2D === 'function'
    const lua = coLua ? [new Path2D(LUA_NGOAI), new Path2D(LUA_GIUA), new Path2D(LUA_LOI)] : []

    // ── Trạng thái trò (không qua React: đổi 60 lần / giây) ──
    let tt: TrangThaiToi = taoToi(doiToi, Date.now())
    let hat: Hat[] = sinhHat(tt.van)
    let dom: Record<string, DomNoiSuy> = {}
    let anhDs: TroAnh['ds'] = {}
    let nhip: NhipGui = taoNhipGui()
    /** Lệch giờ phòng so với đồng hồ máy (ms), làm mượt theo dấu `l` của từng ảnh chụp. */
    let lech = 0, coLech = false
    const khac: DomKhac[] = []
    let soKhac = 0
    let capCu: number[] | null = null
    const nhay = [0, 0, 0, 0]
    let lucThuong = 0, soTin = 0
    let baoCu = '', diemCu = '', hoiCu = -1
    const lucMo = performance.now()
    let dsTin: TinTran[] = []

    // ── Khung vẽ ──
    let W = 0, H = 0, ti = 1, ox = 0, oy = 0, dpr = 1
    let bang = docBangMau(goc)
    let anhDom: HTMLCanvasElement[] = [], anhHat: HTMLCanvasElement[] = []
    const [nen, gNen] = taoVai(1)
    const px = (x: number) => ox + x * ti
    const py = (y: number) => oy + y * ti

    const dungAnh = () => {
      anhDom = bang.doi.map((c) => taoAnhDom(c, !nhe))
      anhHat = [taoAnhHat(bang.sao, !nhe), taoAnhHat(bang.tin, !nhe)]
    }
    /** Nền tĩnh vẽ MỘT lần mỗi khi đổi cỡ / đổi màu: nền, chấm mờ, bốn quầng màu đội ở bốn góc, viền sân. */
    const veNen = () => {
      if (!gNen || !W || !H) return
      nen.width = vai.width; nen.height = vai.height
      gNen.setTransform(dpr, 0, 0, dpr, 0, 0)
      gNen.fillStyle = mau(bang.nen); gNen.fillRect(0, 0, W, H)
      const sang = gNen.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.6)
      sang.addColorStop(0, mau(bang.chu, 0.06)); sang.addColorStop(1, mau(bang.chu, 0))
      gNen.fillStyle = sang; gNen.fillRect(0, 0, W, H)
      for (let d = 0; d < 4; d++) {
        const p = gocDoi(d), r = 330 * ti
        const q = gNen.createRadialGradient(px(p.x), py(p.y), 0, px(p.x), py(p.y), r)
        q.addColorStop(0, mau(bang.doi[d], 0.3)); q.addColorStop(1, mau(bang.doi[d], 0))
        gNen.fillStyle = q; gNen.fillRect(px(p.x) - r, py(p.y) - r, r * 2, r * 2)
      }
      gNen.fillStyle = mau(bang.chu, 0.08)
      for (let y = 14; y < H; y += 28) for (let x = 14; x < W; x += 28) gNen.fillRect(x - 1, y - 1, 2, 2)
      gNen.strokeStyle = mau(bang.chu, 0.14); gNen.lineWidth = 1.5
      gNen.beginPath(); gNen.roundRect?.(ox + 1, oy + 1, SAN_RONG * ti - 2, SAN_CAO * ti - 2, 14 * ti); gNen.stroke()
    }
    /** Sân 1000 × 600 co vừa khung, nằm giữa (không cuộn). Cần và nút đặt ở lề trống; khung khít sân thì dịch vào quá ngọn lửa góc. */
    const doKhung = () => {
      W = goc.clientWidth; H = goc.clientHeight
      if (!W || !H) return
      dpr = Math.min(nhe ? 1.5 : 2, window.devicePixelRatio || 1)
      vai.width = Math.round(W * dpr); vai.height = Math.round(H * dpr)
      ti = Math.min(W / SAN_RONG, H / SAN_CAO)
      ox = (W - SAN_RONG * ti) / 2; oy = (H - SAN_CAO * ti) / 2
      goc.style.setProperty('--gl-le', `${ox >= 90 || oy >= 96 ? 16 : Math.round(ox + SAN_RONG * ti * 0.2)}px`)
      veNen()
    }
    const doiMau = () => { bang = docBangMau(goc); dungAnh(); veNen() }

    // ── Tin trận, biển báo, bảng điểm (DOM, chỉ đặt lại khi đổi) ──
    const tenCua = (sbd: string) => (!xem && sbd === sbdToi ? 'Em' : tenNgan(dsRef.current.find((n) => n.sbd === sbd)?.ten ?? `Bạn ${sbd}`))
    const doiCua = (sbd: string) => (!xem && sbd === sbdToi ? doiToi : dsRef.current.find((n) => n.sbd === sbd)?.doi ?? anhDs[sbd]?.[3])
    const themTin = (manh: ManhTin[], luc: number) => {
      dsTin = [...dsTin, { id: ++soTin, het: luc + TIN_SONG_MS, manh }].slice(-2)
      setTin(dsTin)
    }
    const datBao = (b: Bao | null) => {
      const khoa = b ? b.kieu + b.chu : ''
      if (khoa === baoCu) return
      baoCu = khoa; setBao(b)
    }
    /** Hai lần / giây: điểm 4 đội, cấp lửa, dọn tin cũ. */
    const nhipCham = (luc: number) => {
      const d = diemDoi(anhDs, { sbd: sbdToi, doi: doiDiem, m: tt.m, daNop: tt.daNop })
      if (d.join() !== diemCu) { diemCu = d.join(); setDiem(d) }
      const cap = d.map(capLua)
      if (capCu) for (let i = 0; i < 4; i++) if (cap[i] > capCu[i]) {
        capCu[i] = cap[i]; nhay[i] = luc
        themTin([{ c: DOI_BPU[i].ten, doi: i }, { c: ` thắp lửa cấp ${cap[i]}` }], luc)
      }
      if (!capCu) capCu = cap
      if (dsTin.length && dsTin[0].het <= luc) { dsTin = dsTin.filter((t) => t.het > luc); setTin(dsTin) }
    }

    // ── Kênh lớp: ảnh chụp mỗi 250 ms ──
    const boNghe = kenh.nghe('tro', (t: TinLop) => {
      const anh = t.x as Partial<TroAnh> | null
      if (!anh || typeof anh !== 'object' || !anh.ds || typeof anh.ds !== 'object') return
      const luc = performance.now()
      if (Number.isFinite(t.l) && t.l > 0) {
        const d = t.l - Date.now()
        lech = coLech ? lech + (d - lech) * 0.1 : d
        coLech = true
      }
      anhDs = anh.ds
      const an = Array.isArray(anh.an) ? anh.an : []
      dom = capNhatDomKhac(dom, { ds: anh.ds, an }, sbdToi, luc)
      if (!xem) {
        const thuong = apThuong(tt, an, sbdToi)
        if (thuong.cong > 0) { tt = thuong.tt; lucThuong = luc }
      }
      for (const dong of an) {
        if (!Array.isArray(dong) || typeof dong[0] !== 'string' || typeof dong[1] !== 'string') continue
        themTin([{ c: tenCua(dong[0]), doi: doiCua(dong[0]) }, { c: ' thu phục ' }, { c: tenCua(dong[1]), doi: doiCua(dong[1]) }], luc)
      }
    })

    // ── Vẽ một khung ──
    const veTen = (chu: string, x: number, y: number, co: number) => {
      g.font = `800 ${co}px ${bang.phong}`
      if (!nhe) { g.lineWidth = 3; g.strokeStyle = mau(bang.nen, 0.85); g.strokeText(chu, x, y) }
      g.fillStyle = mau(bang.chu); g.fillText(chu, x, y)
    }
    const veDom = (x: number, y: number, m: number, doi: number) => {
      const r = Math.max(4, banKinh(m) * ti), nua = r * (nhe ? 64 / 60 : 1.6)
      const X = px(x), Y = py(y)
      if (X + nua < 0 || Y + nua < 0 || X - nua > W || Y - nua > H) return
      g.drawImage(anhDom[kepDoi(doi)], X - nua, Y - nua, nua * 2, nua * 2)
    }
    const veLua = (d: number, luc: number, cap: number) => {
      const p = gocDoi(d), c = bang.doi[d]
      const bat = nhe ? 0 : Math.max(0, 1 - (luc - nhay[d]) / 600)
      const cao = (62 + cap * 5) * ti * (1 + 0.3 * bat)
      const X = px(p.x), Y = py(p.y) + 30 * ti
      if (coLua) {
        const k = cao / 80
        g.save(); g.translate(X, Y); g.scale(k, k * (nhe ? 1 : 1 + 0.045 * Math.sin(luc / 170 + d * 1.7))); g.translate(-32, -76)
        g.fillStyle = mau(c); g.fill(lua[0])
        g.fillStyle = mau(pha(bang.sao, c, 0.4)); g.fill(lua[1])
        g.fillStyle = mau(sangHon(bang.sao, 0.6)); g.fill(lua[2])
        g.restore()
      } else { g.fillStyle = mau(c); g.beginPath(); g.arc(X, Y - cao * 0.4, cao * 0.35, 0, TAU); g.fill() }
      g.textAlign = 'center'; g.textBaseline = 'middle'
      const coKy = Math.max(10, cao * 0.3)
      g.font = `800 ${coKy}px ${bang.phong}`
      g.lineWidth = 3; g.strokeStyle = mau(bang.chu, 0.9); g.strokeText(DOI_BPU[d].ky, X, Y - cao * 0.24)
      g.fillStyle = mau(bang.nen); g.fillText(DOI_BPU[d].ky, X, Y - cao * 0.24)
      g.font = `800 ${Math.max(10, 17 * ti)}px ${bang.phong}`
      g.fillStyle = mau(pha(c, bang.chu, 0.25)); g.fillText(DOI_BPU[d].ten, X, Y + Math.max(9, 14 * ti))
    }
    const ve = (luc: number, nay: number, chet: boolean) => {
      g.setTransform(dpr, 0, 0, dpr, 0, 0)
      g.globalAlpha = 1
      g.drawImage(nen, 0, 0, W, H)
      // Vòng lạnh: nét đứt; ngoài vòng phủ lạnh nhẹ (máy yếu bỏ lớp phủ).
      const v = vongLanh(nay)
      g.beginPath(); g.ellipse(px(v.cx), py(v.cy), v.rx * ti, v.ry * ti, 0, 0, TAU)
      g.setLineDash([9, 8]); g.lineWidth = 2; g.strokeStyle = mau(bang.tin, 0.6); g.stroke(); g.setLineDash([])
      if (!nhe) { g.rect(0, 0, W, H); g.fillStyle = mau(bang.tin, 0.07); g.fill('evenodd') }
      // Hạt năng lượng (hạt em đã ăn ẩn tới khi mọc lại).
      const cHat = Math.max(nhe ? 6 : 12, (nhe ? 9 : 19) * ti)
      for (const h of hat) if (hatHien(tt, h.id, nay)) g.drawImage(anhHat[h.loai], px(h.x) - cHat / 2, py(h.y) - cHat / 2, cHat, cHat)
      // Bốn ngọn lửa đội + tên đội.
      for (let d = 0; d < 4; d++) veLua(d, luc, capCu ? capCu[d] : 1)
      // Đốm các bạn (nhỏ trước, lớn đè lên), rồi đốm của em.
      const coTen = Math.max(10, 16 * ti)
      g.textAlign = 'center'; g.textBaseline = 'alphabetic'
      for (let i = 0; i < soKhac; i++) veDom(khac[i].x, khac[i].y, khac[i].m, khac[i].doi)
      for (let i = Math.max(0, soKhac - SO_TEN); i < soKhac; i++) {
        const k = khac[i]
        if (k.m >= M_HIEN_TEN) veTen(tenCua(k.sbd), px(k.x), py(k.y) - banKinh(k.m) * ti - 5, coTen)
      }
      if (xem) return
      const X = px(tt.x), Y = py(tt.y), r = Math.max(4, banKinh(tt.m) * ti)
      if (chet) g.globalAlpha = nhe ? 0.4 : 0.3 + 0.15 * Math.sin(luc / 140)
      veDom(tt.x, tt.y, tt.m, doiToi)
      g.beginPath(); g.arc(X, Y, r + 4, 0, TAU); g.lineWidth = 2; g.strokeStyle = mau(bang.chu); g.stroke()
      g.globalAlpha = 1
      const thuong = 1 - (luc - lucThuong) / 500
      if (lucThuong && thuong > 0) { g.beginPath(); g.arc(X, Y, r + 4 + (1 - thuong) * 26, 0, TAU); g.strokeStyle = mau(bang.sao, thuong); g.lineWidth = 3; g.stroke() }
      veTen(`${tenNgan(tenRef.current)} (em)`, X, Y - r - 9, coTen)
    }

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
      // Đốm các bạn tại lúc này (nội suy giữa hai ảnh chụp); dùng lại mảng để không sinh rác mỗi khung.
      soKhac = 0
      for (const sbd in dom) {
        const d = dom[sbd], p = viTriDom(d, luc)
        const o = khac[soKhac] ?? (khac[soKhac] = { sbd: '', x: 0, y: 0, m: M_MIN, doi: 0 })
        o.sbd = sbd; o.x = p.x; o.y = p.y; o.m = p.m; o.doi = d.doi
        soKhac++
      }
      khac.length = soKhac
      khac.sort((a, b) => a.m - b.m)
      if (xem) {
        // Máy thầy: chỉ theo ván (bản đồ hạt + vòng lạnh), điểm đội, rồi vẽ. Không mô phỏng, không gửi.
        const van = vanSo(nay)
        if (van !== tt.van) { tt = { ...tt, van, hatAn: {} }; hat = sinhHat(van) }
        if (luc - lucCham >= 500) { lucCham = luc; nhipCham(luc) }
        ve(luc, nay, false)
        return
      }
      const i = vao.current
      let dx = i.cx, dy = i.cy
      for (const ma in PHIM) if (i.phim[ma]) { dx += PHIM[ma][0]; dy += PHIM[ma][1] }
      const kq = buoc(tt, { dx, dy, tang: i.tang }, dt, nay, hat, khac)
      i.tang = false
      tt = kq.tt
      if (kq.vanMoi) hat = sinhHat(tt.van)
      if (kq.nop >= 1) {
        nhay[doiToi] = luc
        themTin([{ c: `Em nộp ${Math.round(kq.nop)} kJ về ` }, { c: DOI_BPU[doiToi].ten, doi: doiToi }], luc)
      }
      const gui = thuGui(nhip, dungGoi(tt), luc, kq.goiThuPhuc)
      nhip = gui.nhip
      if (gui.gui) kenh.gui('tro', gui.gui)
      const chet = dangChet(tt, nay)
      if (chet) datBao({ kieu: 'thu', chu: `Em bị thu phục · hồi sinh sau ${Math.max(1, Math.ceil((tt.chetDen - nay) / 1000))} giây` })
      else if (kq.ngoaiVong && tt.m > M_MIN) datBao({ kieu: 'lanh', chu: 'Ngoài vòng lạnh · lửa đang nguội, vào trong vòng' })
      else if (luc - lucMo < 9000) datBao({ kieu: 'meo', chu: 'Gom hạt để lớn · tránh đốm lớn đội khác · mang về góc đội' })
      else datBao(null)
      const hoi = chet ? 0 : Math.round(hoiTang(tt, nay) * 20) / 20
      if (hoi !== hoiCu && tangRef.current) {
        hoiCu = hoi
        tangRef.current.style.setProperty('--gl-hoi', String(hoi))
        if (hoi < 1) tangRef.current.setAttribute('data-hoi', '1'); else tangRef.current.removeAttribute('data-hoi')
      }
      if (luc - lucCham >= 500) { lucCham = luc; nhipCham(luc) }
      ve(luc, nay, chet)
    }
    const chay = () => { if (!rafId && !document.hidden) { lucTruoc = 0; rafId = requestAnimationFrame(khung) } }
    const dung = () => { if (rafId) cancelAnimationFrame(rafId); rafId = 0 }
    const doiHien = () => { if (document.hidden) dung(); else chay() }

    // ── Bàn phím (máy tính): WASD / mũi tên để đi, phím cách để tăng tốc. Đang gõ chữ (chat) thì bỏ qua. ──
    const dangGo = (e: KeyboardEvent) => {
      const d = e.target as HTMLElement | null
      return !!d && (d.tagName === 'INPUT' || d.tagName === 'TEXTAREA' || d.tagName === 'SELECT' || d.isContentEditable)
    }
    const phimXuong = (e: KeyboardEvent) => {
      if (dangGo(e) || e.ctrlKey || e.metaKey || e.altKey) return
      if (e.code === 'Space') { vao.current.tang = true; if ((e.target as HTMLElement | null)?.tagName !== 'BUTTON') e.preventDefault(); return }
      if (PHIM[e.code]) { vao.current.phim[e.code] = true; e.preventDefault() }
    }
    const phimLen = (e: KeyboardEvent) => { if (PHIM[e.code]) vao.current.phim[e.code] = false }
    const buongPhim = () => { vao.current.phim = {} }

    dungAnh(); doKhung()
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
  }, [kenh, sbd, doiToi, mayYeu, xem])

  // ── Cần ảo: chạm đâu trong nửa trái, cần hiện đó. Toạ độ đổi về hệ của KHUNG như src/components/live/KhungDocLap.tsx (lớp live xoay 90° bằng CSS). ──
  const toaDo = (e: SuKienTro) => {
    const r = (vaiRef.current ?? e.currentTarget).getBoundingClientRect()
    return xoay ? toaDoXoay(e, r) : { x: e.clientX - r.left, y: e.clientY - r.top }
  }
  const datNum = (dx: number, dy: number) => { if (numRef.current) numRef.current.style.transform = dx || dy ? `translate(${dx}px, ${dy}px)` : '' }
  const canXuong = (e: SuKienTro<HTMLDivElement>) => {
    const i = vao.current
    if (i.canId !== -1) return
    const p = toaDo(e)
    i.canId = e.pointerId; i.gx = p.x; i.gy = p.y; i.cx = 0; i.cy = 0
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* trình duyệt cũ: vẫn nhận sự kiện trong vùng */ }
    const can = canRef.current
    if (can) { can.setAttribute('data-giu', '1'); can.style.left = `${p.x}px`; can.style.top = `${p.y}px` }
    datNum(0, 0)
    e.preventDefault()
  }
  const canDi = (e: SuKienTro<HTMLDivElement>) => {
    const i = vao.current
    if (i.canId !== e.pointerId) return
    const p = toaDo(e)
    let dx = p.x - i.gx, dy = p.y - i.gy
    const dai = Math.hypot(dx, dy)
    if (dai > BK_CAN) { dx = (dx / dai) * BK_CAN; dy = (dy / dai) * BK_CAN }
    const co = Math.min(dai, BK_CAN) / BK_CAN
    i.cx = co < VUNG_CHET ? 0 : dx / BK_CAN
    i.cy = co < VUNG_CHET ? 0 : dy / BK_CAN
    datNum(dx, dy)
  }
  const canBuong = (e: SuKienTro<HTMLDivElement>) => {
    const i = vao.current
    if (i.canId !== e.pointerId) return
    i.canId = -1; i.cx = 0; i.cy = 0
    const can = canRef.current
    if (can) { can.removeAttribute('data-giu'); can.style.left = ''; can.style.top = '' }
    datNum(0, 0)
  }
  const bamTang = () => { vao.current.tang = true }

  const bienDoi = (d: number) => ({ ['--doi' as string]: `var(${DOI_BPU[kepDoi(d)].mau})` }) as CSSProperties
  return (
    <div className="gl" ref={gocRef} style={bienDoi(doiToi)} data-xem={xem ? '1' : undefined}>
      <canvas className="gl-san" ref={vaiRef} aria-hidden="true" />
      {xem ? null : <div className="gl-vung" onPointerDown={canXuong} onPointerMove={canDi} onPointerUp={canBuong} onPointerCancel={canBuong} onLostPointerCapture={canBuong} />}
      {xem ? null : <div className="gl-can" ref={canRef} aria-hidden="true"><i ref={numRef} /></div>}
      {xem ? null : <button type="button" className="gl-tang" ref={tangRef} onPointerDown={bamTang} onClick={bamTang} aria-label="Tăng tốc (phím cách)">Tăng tốc</button>}
      <div className="gl-bang" role="group" aria-label={`kJ gom được: ${DOI_BPU.map((d, i) => `${d.ten} ${diem[i]}`).join(', ')}`}>
        {DOI_BPU.map((d, i) => (
          <span key={d.ky} className="gl-o" style={bienDoi(i)} data-toi={!xem && i === doiToi ? '1' : undefined}><i />{d.ky} {diem[i]}</span>
        ))}
        <span className="gl-mo">kJ gom được</span>
      </div>
      <ul className="gl-tin" aria-live="off">
        {tin.map((t) => (
          <li key={t.id}>{t.manh.map((m, i) => (m.doi !== undefined && m.doi >= 0 && m.doi < 4 ? <b key={i} style={bienDoi(m.doi)}>{m.c}</b> : <span key={i}>{m.c}</span>))}</li>
        ))}
      </ul>
      {bao ? <div className="gl-bao" data-kieu={bao.kieu} role="status">{bao.chu}</div> : null}
      {xem ? null : <div className="gl-cho"><i className="gl-cham" />Phòng chờ · {soEm} em đã vào · chờ thầy bấm Bắt đầu</div>}
    </div>
  )
}
