// CẢNH SẢNH 3D — lớp HÌNH của Sảnh bản đồ Bát Linh theo bản vẽ động đã chốt 28/09
// (docs/ban-ve-sanh-dong-2809/Sanh-Dong.html, "tươi sáng, 3D"): trời hoàng hôn, biển ngọc, mặt trời + tia, mây,
// đảo/đất liền 2.5D (vách, bóng, viền sáng, bọt sóng), cây/núi, cầu gỗ dày, xe hàng + Linh Tâm pha lê, ổ phục kích,
// sương mù tan theo % khai phá THẬT, thị sai nhiều lớp theo chuột / nghiêng máy.
// Chỉ vẽ — mọi con số nhận từ SanhBanDo (máy chủ). Hình sinh ngẫu nhiên dùng hạt giống cố định (ảnh chụp lặp lại được).
// Chuyển động: chỉ transform/opacity; vòng rAF thị sai chỉ chạy khi có chuột/nghiêng máy, dừng khi tab ẩn, dọn khi unmount;
// prefers-reduced-motion ⇒ không thị sai, không hạt, CSS tắt mọi hoạt ảnh (màn đứng yên ở trạng thái cuối).
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import type { SanhHoa2 } from './api'
import { giamChuyenDong, hat, loatPhao, timFx, veToaDoFx } from './hieu-ung-sanh'

type Diem = [number, number]

/** Vùng cảnh luôn thấy trọn (toạ độ bản vẽ): cảnh được thu/phóng cho vừa phần bản đồ KHÔNG bị HUD / lối tắt / tấm che. */
export const HOP_CANH = { x: -12, y: -14, w: 424, h: 522 } as const
/** viewBox mặc định (trước khi đo được khung). */
export const VIEWBOX_MAC_DINH = `${HOP_CANH.x} ${HOP_CANH.y} ${HOP_CANH.w} ${HOP_CANH.h}`
/** Tâm lỗ khai phá (bến đảo) và bán kính theo % khai phá: 0% ⇒ 34, 100% ⇒ 294 (phủ cả đảo). */
const TAM_LO: Diem = [212, 278]
export const banKinhKhaiPha = (phanTram: number) => Math.round(34 + Math.max(0, Math.min(100, phanTram)) * 2.6)

// ─── đường hộ tống (bến → chân cầu): hai đoạn Bézier của bản vẽ ─────────────────────────────────
const DUONG_HO_TONG = 'M60 438 C92 442 74 404 104 394 C132 384 122 356 158 340'
const DOAN_1: [Diem, Diem, Diem, Diem] = [[60, 438], [92, 442], [74, 404], [104, 394]]
const DOAN_2: [Diem, Diem, Diem, Diem] = [[104, 394], [132, 384], [122, 356], [158, 340]]
function bezier([p0, p1, p2, p3]: [Diem, Diem, Diem, Diem], t: number): Diem {
  const u = 1 - t
  const a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t
  return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]]
}
/** Điểm trên đường ở tỉ lệ t (0 = bến, 1 = chân cầu). */
export function diemTrenDuong(t: number): Diem {
  const k = Math.max(0, Math.min(1, t))
  return k < 0.5 ? bezier(DOAN_1, k / 0.5) : bezier(DOAN_2, (k - 0.5) / 0.5)
}
/** Hiện tối đa bấy nhiêu ổ phục kích trên đường (chữ vẫn nói đủ số thật). */
export const TOI_DA_O_VE = 6
/** Vị trí n ổ phục kích rải đều trên đường (bỏ đoạn sát bến và sát cầu). */
export function viTriOPhucKich(n: number): Diem[] {
  const so = Math.max(0, Math.min(TOI_DA_O_VE, Math.floor(n)))
  if (so === 0) return []
  if (so === 1) return [diemTrenDuong(0.56)]
  return Array.from({ length: so }, (_, i) => diemTrenDuong(0.22 + (0.64 * i) / (so - 1)))
}

// ─── phần sinh ngẫu nhiên (hạt giống 7, cùng thứ tự rút số với bản vẽ) ─────────────────────────
interface May { x: number; y: number; k: number; t: string; d: string; mo: number }
interface Canh {
  tia: { d: string; quay: string; mo: string }[]
  mayXa: May[]
  mayGan: May[]
  song: { d: string; t: string; nguoc: boolean; net: string; day: string }[]
  sao: { x: string; y: string; r: string; t: string; d: string; sao4?: { d: string; t: string; dd: string } }[]
  vetNang: { cx: string; cy: string; rx: string; ry: string; mo: string; t: string; d: string }[]
  dom: { cx: string; cy: string; r: string; t: string; d: string; dx: string; dy: string; t2: string }[]
}
let canhDaTao: Canh | null = null
/** Sinh (một lần) các chi tiết lặp của cảnh bằng số ngẫu nhiên có hạt giống — mọi lần vẽ ra y hệt. */
export function taoCanh(): Canh {
  if (canhDaTao) return canhDaTao
  let hg = 7
  const rnd = () => (hg = (hg * 16807) % 2147483647) / 2147483647
  const tia = Array.from({ length: 14 }, (_, i) => {
    const dai = 160 + rnd() * 120
    return { d: `M64 12 L${(64 + dai).toFixed(1)} 5 L${(64 + dai).toFixed(1)} 19 Z`, quay: `rotate(${((i / 14) * 360).toFixed(1)} 64 12)`, mo: (0.4 + rnd() * 0.4).toFixed(2) }
  })
  const may = (x: number, y: number, k: number, mo: number): May => {
    const t = (28 + rnd() * 24).toFixed(0) + 's'
    const d = (-rnd() * 30).toFixed(0) + 's'
    return { x, y, k, t, d, mo }
  }
  const mayXa: May[] = []
  for (let i = 0; i < 9; i++) {
    const x = -640 + i * 200 + rnd() * 80
    const y = -150 + rnd() * 140
    const k = 0.6 + rnd() * 0.7
    mayXa.push(may(x, y, k, 0.95))
  }
  const mayGan = ([[470, 330, 1.3], [-150, 250, 1.1], [300, 560, 1.2]] as const).map(([x, y, k]) => may(x, y, k, 0.7))
  const song = Array.from({ length: 30 }, (_, i) => {
    const y = 30 + i * 22 + rnd() * 8
    let d = `M-700 ${y.toFixed(1)}`
    for (let x = -700; x < 1100; x += 24) d += ' q6 -3 12 0 t12 0'
    const t = (7 + rnd() * 7).toFixed(1) + 's'
    const net = `rgb(255 255 255 / ${(0.14 + rnd() * 0.16).toFixed(2)})`
    const day = (1 + rnd() * 0.8).toFixed(1)
    return { d, t, nguoc: i % 2 === 1, net, day }
  })
  const sao: Canh['sao'] = []
  for (let i = 0; i < 64; i++) {
    const x = -700 + rnd() * 1800, y = 30 + rnd() * 900, r = 0.8 + rnd() * 2
    const muc: Canh['sao'][number] = { x: x.toFixed(1), y: y.toFixed(1), r: (r * 2).toFixed(1), t: (1.6 + rnd() * 2.6).toFixed(1) + 's', d: (-rnd() * 4).toFixed(1) + 's' }
    if (i % 5 === 0) {
      const s = r * 3.2
      const t = (2.2 + rnd() * 2).toFixed(1) + 's'
      const dd = (-rnd() * 3).toFixed(1) + 's'
      const f = (v: number) => v.toFixed(1)
      muc.sao4 = { d: `M${f(x)} ${f(y - s)} L${f(x + s * 0.22)} ${f(y)} L${f(x)} ${f(y + s)} L${f(x - s * 0.22)} ${f(y)} Z M${f(x - s)} ${f(y)} L${f(x)} ${f(y + s * 0.22)} L${f(x + s)} ${f(y)} L${f(x)} ${f(y - s * 0.22)} Z`, t, dd }
    }
    sao.push(muc)
  }
  const vetNang = Array.from({ length: 18 }, (_, i) => {
    const cx = (64 + (rnd() - 0.5) * 14).toFixed(1)
    const cy = (28 + i * 16 + rnd() * 5).toFixed(1)
    const rx = (26 - i * 0.9 + rnd() * 9).toFixed(1)
    const ry = (1.2 + rnd() * 1.3).toFixed(1)
    return { cx, cy, rx, ry, mo: (0.95 - i * 0.035).toFixed(2), t: (1.4 + rnd() * 1.6).toFixed(1) + 's', d: (-rnd() * 2).toFixed(1) + 's' }
  })
  const vungDom = [[150, 110, 260, 190], [-80, 330, 240, 160], [-200, 60, 180, 220], [400, 260, 200, 200]]
  const dom = Array.from({ length: 24 }, (_, i) => {
    const [vx, vy, vw, vh] = vungDom[i % vungDom.length]
    const t = (6 + rnd() * 7).toFixed(1) + 's'
    const d = (-rnd() * 8).toFixed(1) + 's'
    const dx = ((rnd() - 0.5) * 60).toFixed(0) + 'px'
    const dy = ((rnd() - 0.5) * 50).toFixed(0) + 'px'
    const cx = (vx + rnd() * vw).toFixed(1)
    const cy = (vy + rnd() * vh).toFixed(1)
    const r = (2.2 + rnd() * 2.4).toFixed(1)
    return { cx, cy, r, t, d, dx, dy, t2: (1.4 + rnd() * 2).toFixed(1) + 's' }
  })
  canhDaTao = { tia, mayXa, mayGan, song, sao, vetNang, dom }
  return canhDaTao
}

// Ổ phục kích: ngôi sao gai 14 cánh (tính một lần).
const GAI = (() => {
  let d = ''
  for (let k = 0; k < 14; k++) {
    const a = (k / 14) * Math.PI * 2, rr = k % 2 ? 9 : 13.5
    d += (k ? 'L' : 'M') + (Math.cos(a) * rr).toFixed(1) + ' ' + (Math.sin(a) * rr * 0.85).toFixed(1)
  }
  return d + 'Z'
})()

const bien = (ten: string, gt: string) => ({ [ten]: gt }) as CSSProperties

function MayBongBenh({ m, i }: { m: May; i: number }) {
  return (
    <g className="h2c-may-troi" style={{ ...bien('--t', m.t), ...bien('--d', m.d) }} key={i}>
      <g transform={`translate(${m.x.toFixed(1)} ${m.y.toFixed(1)}) scale(${m.k.toFixed(3)})`} opacity={m.mo}>
        <ellipse cx="0" cy="10" rx="46" ry="9" fill="rgb(230 190 225 / .8)" />
        {[[-30, 2, 14], [-12, -8, 20], [10, -12, 24], [32, -2, 16], [44, 6, 10], [-42, 8, 9]].map(([cx, cy, r], j) => (
          <circle key={j} cx={cx} cy={cy} r={r} fill="url(#h2c-may)" />
        ))}
        <ellipse cx="4" cy="-22" rx="12" ry="5" fill="rgb(255 255 255 / .9)" />
      </g>
    </g>
  )
}

export type TrangThaiCanh = 'cho' | 'a' | 'b' | 'c'

export interface CanhSanh3DProps {
  s: SanhHoa2 | null
  ngang?: boolean
  /** Đang chạy cảnh mở màn (lần đầu trong phiên). */
  moMan?: boolean
}

/** Bản đồ Bát Linh 3D. Giữ các móc `data-ve` cũ: o-phuc-kich (data-so), cau-keo-len / cau-ha, suong. */
export default function CanhSanh3D({ s, ngang = false, moMan = false }: CanhSanh3DProps) {
  const c = taoCanh()
  const cd = s?.chienDich ?? null
  const p = cd && cd.tong > 0 ? Math.round((100 * Math.min(cd.coXat, cd.tong)) / cd.tong) : 0
  const oPk = s ? viTriOPhucKich(s.doan.con) : []
  const nhoO = oPk.length > 4 ? 0.8 : 1
  const khoa = !!s?.khoaDao
  const xong = !!s && s.theLuc.tong > 0 && s.theLuc.con === 0
  const tt: TrangThaiCanh = !s ? 'cho' : s.doan.con > 0 ? 'a' : xong ? 'c' : 'b'
  const rLo = banKinhKhaiPha(p)

  const refBd = useRef<HTMLDivElement>(null)
  const refSvg = useRef<SVGSVGElement>(null)
  const refNghieng = useRef<HTMLDivElement>(null)
  const refNhan = useRef<HTMLDivElement>(null)
  const vb = useRef<{ x: number; y: number; s: number; w: number; h: number; phai: number }>({ x: HOP_CANH.x, y: HOP_CANH.y, s: 1, w: 0, h: 0, phai: 0 })
  const [thiSai] = useState(() => !giamChuyenDong())

  // ── khớp khung nhìn + đặt nhãn (đo DOM thật; jsdom không có kích thước ⇒ giữ viewBox mặc định) ──
  const khop = useRef<() => void>(() => {})
  khop.current = () => {
    const bd = refBd.current
    const svg = refSvg.current
    if (!bd || !svg) return
    const W = bd.clientWidth, H = bd.clientHeight
    if (!W || !H) return
    // Đo bằng offset* (bỏ qua transform của cảnh mở màn đang trượt vào; không bị zoom bản ngang thấp làm lệch).
    // Bản đồ nằm phủ kín khung cha (.h2-khung / .h2-ng-trai) nên toạ độ offset của HUD/tấm/tiêu đề cùng gốc với bản đồ.
    let tren = 12, duoi = 20, trai = 6, phai = 12
    if (ngang) {
      const dau = bd.closest('.h2-ng-trai')?.querySelector<HTMLElement>('.h2-ng-bd-dau')
      if (dau) tren = Math.max(12, dau.offsetTop + dau.offsetHeight + 14)
      trai = 16
      phai = 16
    } else {
      const khung = bd.closest('.h2-khung')
      const hud = khung?.querySelector<HTMLElement>('.h2-hud')
      const ray = khung?.querySelector<HTMLElement>('.h2-ray')
      const tam = khung?.querySelector<HTMLElement>('.h2-tam')
      if (hud) {
        const hb = hud.offsetTop + hud.offsetHeight
        if (ray) ray.style.top = `${Math.round(hb + 10)}px`
        tren = hb + 26
      }
      if (ray) phai = Math.max(12, W - ray.offsetLeft + 2)
      if (tam) duoi = Math.max(12, H - tam.offsetTop + 22)
    }
    const aw = Math.max(40, W - trai - phai), ah = Math.max(40, H - tren - duoi)
    const sc = Math.min(aw / HOP_CANH.w, ah / HOP_CANH.h)
    const x = HOP_CANH.x - (trai + (aw - HOP_CANH.w * sc) / 2) / sc
    const y = HOP_CANH.y - (tren + (ah - HOP_CANH.h * sc) / 2) / sc
    svg.setAttribute('viewBox', `${x.toFixed(2)} ${y.toFixed(2)} ${(W / sc).toFixed(2)} ${(H / sc).toFixed(2)}`)
    vb.current = { x, y, s: sc, w: W, h: H, phai }
    for (const n of Array.from(bd.querySelectorAll<HTMLElement>('.h2-nhan-bd[data-x]'))) {
      const sx = (Number(n.dataset.x) - x) * sc
      const sy = (Number(n.dataset.y) - y) * sc
      n.style.maxWidth = `${Math.max(120, W - phai - 16)}px` // nhãn dài hơn chỗ trống ⇒ xuống dòng, không chui dưới lối tắt
      const w = n.offsetWidth, h = n.offsetHeight
      const l = Math.min(Math.max(8, sx - w / 2), W - phai - w - 4)
      const t = n.dataset.neo === 'tren' ? sy - h : sy
      n.style.transform = `translate(${Math.round(Math.max(8, l))}px, ${Math.round(t)}px)`
    }
  }
  const chuNhan = `${cd?.ten ?? ''}|${p}|${s?.doan.con ?? -1}|${s?.dao.con ?? -1}|${tt}`
  useLayoutEffect(() => {
    khop.current()
  }, [ngang, chuNhan])
  useEffect(() => {
    const chay = () => khop.current()
    window.addEventListener('resize', chay)
    let ro: ResizeObserver | null = null
    if (typeof ResizeObserver === 'function' && refBd.current) {
      ro = new ResizeObserver(chay)
      ro.observe(refBd.current)
      const khung = refBd.current.closest('.h2-khung, .h2-ng-trai')
      khung?.querySelectorAll('.h2-tam, .h2-hud, .h2-ng-bd-dau').forEach((e) => ro!.observe(e))
    }
    try {
      void document.fonts?.ready.then(chay)
    } catch {
      /* không có FontFaceSet */
    }
    return () => {
      window.removeEventListener('resize', chay)
      ro?.disconnect()
    }
  }, [ngang])

  // ── THỊ SAI nhiều lớp + nghiêng 2.5D: chỉ khi có chuột / nghiêng máy; rAF dừng khi đã tới đích, khi tab ẩn, khi unmount ──
  useEffect(() => {
    if (!thiSai) return
    const bd = refBd.current
    if (!bd) return
    const lop = Array.from(bd.querySelectorAll<SVGGElement>('.h2c-lop')).map((g) => [g, Number(g.dataset.sau) || 0] as const)
    const BIEN = 9 // px tối đa ở lớp sâu 1 (giới hạn thị sai)
    const dich = { x: 0, y: 0 }
    const hien = { x: 0, y: 0 }
    let raf = 0
    const kep = (v: number) => Math.max(-1, Math.min(1, v))
    const buoc = () => {
      raf = 0
      if (document.hidden) return
      hien.x += (dich.x - hien.x) * 0.08
      hien.y += (dich.y - hien.y) * 0.08
      const sc = vb.current.s || 1
      for (const [g, k] of lop) g.style.transform = `translate(${((-hien.x * BIEN * k) / sc).toFixed(2)}px, ${((-hien.y * BIEN * 0.7 * k) / sc).toFixed(2)}px)`
      if (refNhan.current) refNhan.current.style.transform = `translate(${(-hien.x * BIEN * 0.7).toFixed(2)}px, ${(-hien.y * BIEN * 0.49).toFixed(2)}px)`
      if (refNghieng.current) refNghieng.current.style.transform = `scale(1.03) rotateX(${(hien.y * 1.6).toFixed(2)}deg) rotateY(${(-hien.x * 2.2).toFixed(2)}deg)`
      if (Math.abs(dich.x - hien.x) + Math.abs(dich.y - hien.y) > 0.002) raf = requestAnimationFrame(buoc)
    }
    const chay = () => {
      if (!raf && !document.hidden) raf = requestAnimationFrame(buoc)
    }
    const chuot = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      const r = bd.getBoundingClientRect()
      if (!r.width || !r.height) return
      dich.x = kep(((e.clientX - r.left) / r.width - 0.5) * 2)
      dich.y = kep(((e.clientY - r.top) / r.height - 0.5) * 2)
      chay()
    }
    const nghieng = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return
      dich.x = kep(e.gamma / 20)
      dich.y = kep((e.beta - 40) / 20)
      chay()
    }
    const doiTab = () => {
      if (document.hidden) {
        if (raf) cancelAnimationFrame(raf)
        raf = 0
      } else chay()
    }
    window.addEventListener('pointermove', chuot, { passive: true })
    window.addEventListener('deviceorientation', nghieng)
    document.addEventListener('visibilitychange', doiTab)
    return () => {
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', chuot)
      window.removeEventListener('deviceorientation', nghieng)
      document.removeEventListener('visibilitychange', doiTab)
    }
  }, [thiSai])

  // ── cầu hạ "cạch" (khi vừa phá hết ổ, hoặc cảnh mở màn ở trạng thái cầu đã hạ) + pháo sáng mở màn khi xong hôm nay ──
  const khoaTruoc = useRef(khoa)
  const oTruoc = useRef(oPk)
  useEffect(() => {
    const hen: number[] = []
    let huyPhao = () => {}
    const bd = refBd.current
    const raFx = (px: number, py: number): [number, number] | null => {
      const fx = timFx(bd)
      if (!bd || !fx) return null
      const v = vb.current
      const r = bd.getBoundingClientRect()
      const k = bd.clientWidth > 0 ? r.width / bd.clientWidth : 1
      return veToaDoFx(fx, r.left + (px - v.x) * v.s * k, r.top + (py - v.y) * v.s * k)
    }
    const cach = () => {
      const svg = refSvg.current
      if (!svg || giamChuyenDong()) return
      svg.classList.remove('h2c-cach')
      void svg.getBoundingClientRect()
      svg.classList.add('h2c-cach')
      const d = raFx(160, 338)
      if (d) hat(timFx(bd), d[0], d[1], 14, ['rgb(230 200 150)', 'rgb(255 255 255)'], 26, 5, 0.7, -8)
    }
    if (khoaTruoc.current && !khoa && !giamChuyenDong()) {
      oTruoc.current.forEach(([x, y], i) =>
        hen.push(window.setTimeout(() => {
          const d = raFx(x, y)
          if (d) hat(timFx(bd), d[0], d[1], 16, ['rgb(255 80 140)', 'rgb(180 60 160)', 'rgb(255 200 220)'], 34, 6, 0.8)
        }, i * 90)),
      )
      hen.push(window.setTimeout(cach, 720))
    } else if (moMan && !khoa && s) {
      hen.push(window.setTimeout(cach, 1900))
    }
    if (moMan && tt === 'c') hen.push(window.setTimeout(() => (huyPhao = loatPhao(timFx(bd))), 1500))
    khoaTruoc.current = khoa
    oTruoc.current = oPk
    return () => {
      hen.forEach((id) => clearTimeout(id))
      huyPhao()
    }
    // oPk suy ra từ s.doan.con; chỉ phản ứng khi khoá cầu / mở màn / trạng thái đổi.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [khoa, moMan, tt])

  return (
    <div
      className="h2-ban-do"
      ref={refBd}
      data-khoa-dao={khoa ? 'true' : 'false'}
      data-tt={tt}
      data-thi-sai={thiSai ? 'bat' : 'tat'}
      data-mo-man={moMan ? 'true' : 'false'}
    >
      <div className="h2c-nghieng" ref={refNghieng}>
        <svg ref={refSvg} className="h2c-canh" viewBox={VIEWBOX_MAC_DINH} preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
          <defs>
            <linearGradient id="h2c-troi" gradientUnits="userSpaceOnUse" x1="0" y1="-420" x2="0" y2="22">
              <stop offset="0" stopColor="rgb(128 132 236)" />
              <stop offset=".45" stopColor="rgb(206 150 226)" />
              <stop offset=".75" stopColor="rgb(255 164 180)" />
              <stop offset="1" stopColor="rgb(255 206 150)" />
            </linearGradient>
            <linearGradient id="h2c-bien" gradientUnits="userSpaceOnUse" x1="0" y1="20" x2="0" y2="720">
              <stop offset="0" stopColor="rgb(255 214 190)" />
              <stop offset=".08" stopColor="rgb(170 226 232)" />
              <stop offset=".45" stopColor="rgb(92 206 214)" />
              <stop offset="1" stopColor="rgb(28 150 186)" />
            </linearGradient>
            <linearGradient id="h2c-chan-troi" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="rgb(255 240 220 / 0)" />
              <stop offset=".5" stopColor="rgb(255 240 220 / .75)" />
              <stop offset="1" stopColor="rgb(255 240 220 / 0)" />
            </linearGradient>
            <radialGradient id="h2c-mat-troi">
              <stop offset="0" stopColor="rgb(255 255 240)" />
              <stop offset=".6" stopColor="rgb(255 238 170)" />
              <stop offset="1" stopColor="rgb(255 196 110)" />
            </radialGradient>
            <radialGradient id="h2c-hao-troi">
              <stop offset="0" stopColor="rgb(255 236 180 / .9)" />
              <stop offset=".35" stopColor="rgb(255 200 160 / .4)" />
              <stop offset="1" stopColor="rgb(255 190 170 / 0)" />
            </radialGradient>
            <linearGradient id="h2c-tia" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="rgb(255 245 210 / .5)" />
              <stop offset="1" stopColor="rgb(255 245 210 / 0)" />
            </linearGradient>
            <linearGradient id="h2c-may" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="rgb(255 255 255)" />
              <stop offset=".6" stopColor="rgb(255 238 244)" />
              <stop offset="1" stopColor="rgb(236 200 230)" />
            </linearGradient>
            <linearGradient id="h2c-co" x1="0" y1="0" x2=".6" y2="1">
              <stop offset="0" stopColor="rgb(160 230 120)" />
              <stop offset=".5" stopColor="rgb(96 196 110)" />
              <stop offset="1" stopColor="rgb(52 150 96)" />
            </linearGradient>
            <linearGradient id="h2c-vach1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="rgb(214 170 120)" />
              <stop offset="1" stopColor="rgb(160 116 84)" />
            </linearGradient>
            <linearGradient id="h2c-vach2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="rgb(150 108 92)" />
              <stop offset="1" stopColor="rgb(96 70 84)" />
            </linearGradient>
            <linearGradient id="h2c-vien-sang" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="rgb(255 250 220)" />
              <stop offset=".5" stopColor="rgb(255 250 220 / .4)" />
              <stop offset="1" stopColor="rgb(255 250 220 / 0)" />
            </linearGradient>
            <radialGradient id="h2c-tan" cx="35%" cy="30%" r="75%">
              <stop offset="0" stopColor="rgb(180 240 130)" />
              <stop offset=".55" stopColor="rgb(70 170 90)" />
              <stop offset="1" stopColor="rgb(30 110 70)" />
            </radialGradient>
            <radialGradient id="h2c-hat-nang">
              <stop offset="0" stopColor="rgb(255 255 230)" />
              <stop offset=".35" stopColor="rgb(255 236 160 / .8)" />
              <stop offset="1" stopColor="rgb(255 236 160 / 0)" />
            </radialGradient>
            <radialGradient id="h2c-sao">
              <stop offset="0" stopColor="rgb(255 255 255)" />
              <stop offset=".4" stopColor="rgb(255 250 220 / .7)" />
              <stop offset="1" stopColor="rgb(255 250 220 / 0)" />
            </radialGradient>
            <radialGradient id="h2c-suong" cx="45%" cy="40%">
              <stop offset="0" stopColor="rgb(255 255 255 / .97)" />
              <stop offset=".55" stopColor="rgb(250 240 252 / .85)" />
              <stop offset="1" stopColor="rgb(236 222 250 / 0)" />
            </radialGradient>
            <radialGradient id="h2c-lo">
              <stop offset="0" stopColor="rgb(0 0 0)" />
              <stop offset=".55" stopColor="rgb(0 0 0)" />
              <stop offset="1" stopColor="rgb(255 255 255)" />
            </radialGradient>
            <radialGradient id="h2c-hao-lt">
              <stop offset="0" stopColor="rgb(120 240 255 / .9)" />
              <stop offset="1" stopColor="rgb(120 240 255 / 0)" />
            </radialGradient>
            <radialGradient id="h2c-hao-do">
              <stop offset="0" stopColor="rgb(255 60 110 / .7)" />
              <stop offset="1" stopColor="rgb(255 60 110 / 0)" />
            </radialGradient>
            <radialGradient id="h2c-hao-vang">
              <stop offset="0" stopColor="rgb(255 210 90 / .9)" />
              <stop offset="1" stopColor="rgb(255 210 90 / 0)" />
            </radialGradient>
            <radialGradient id="h2c-rune">
              <stop offset="0" stopColor="rgb(80 240 250 / .85)" />
              <stop offset="1" stopColor="rgb(80 240 250 / 0)" />
            </radialGradient>
            <radialGradient id="h2c-bong" cx="50%" cy="50%">
              <stop offset="0" stopColor="rgb(10 80 110 / .38)" />
              <stop offset=".7" stopColor="rgb(10 80 110 / .18)" />
              <stop offset="1" stopColor="rgb(10 80 110 / 0)" />
            </radialGradient>
            <linearGradient id="h2c-go" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="rgb(226 170 104)" />
              <stop offset="1" stopColor="rgb(176 116 60)" />
            </linearGradient>
            <linearGradient id="h2c-cot" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="rgb(200 140 80)" />
              <stop offset=".4" stopColor="rgb(236 184 120)" />
              <stop offset="1" stopColor="rgb(130 80 40)" />
            </linearGradient>
            <path id="h2c-p-dao" d="M198 283 C168 262 150 222 170 196 C184 176 176 150 198 128 C226 100 262 104 290 92 C320 80 352 88 372 108 C396 132 420 160 404 196 C394 218 408 244 388 264 C364 290 326 300 290 296 C262 293 240 306 220 298 C210 294 204 290 198 283 Z" />
            <path id="h2c-p-dat" d="M-400 330 C-200 304 40 306 110 324 C146 334 166 342 166 356 C168 382 142 404 168 434 C192 462 244 478 296 534 L296 1000 L-400 1000 Z" />
            <clipPath id="h2c-cat-dao">
              <use href="#h2c-p-dao" />
            </clipPath>
            <mask id="h2c-m-suong" maskUnits="userSpaceOnUse" x="100" y="40" width="360" height="300">
              <rect x="100" y="40" width="360" height="300" fill="rgb(255 255 255)" />
              <circle className="h2c-lo" data-ve="lo-khai-pha" cx={TAM_LO[0]} cy={TAM_LO[1]} r={rLo} fill="url(#h2c-lo)" />
            </mask>
            <g id="h2c-cay">
              <ellipse cx="6" cy="4" rx="11" ry="5" fill="rgb(20 80 50 / .35)" />
              <rect x="-1.6" y="-6" width="3.2" height="9" rx="1" fill="rgb(130 80 40)" />
              <circle cx="0" cy="-12" r="10" fill="url(#h2c-tan)" />
              <circle cx="-3.5" cy="-15.5" r="3" fill="rgb(230 255 190 / .6)" />
            </g>
            <g id="h2c-thong">
              <ellipse cx="6" cy="4" rx="9" ry="4" fill="rgb(20 80 50 / .35)" />
              <rect x="-1.4" y="-4" width="2.8" height="7" fill="rgb(120 76 40)" />
              <path d="M0 -26 L9 -4 L-9 -4 Z" fill="rgb(46 140 90)" />
              <path d="M0 -26 L9 -4 L0 -4 Z" fill="rgb(26 104 70)" />
              <path d="M0 -26 L-3 -16 L1 -17 Z" fill="rgb(190 250 170 / .7)" />
            </g>
          </defs>

          {/* LỚP XA: trời hoàng hôn, mặt trời + tia, mây, núi xa */}
          <g className="h2c-lop" data-sau="0.25">
            <rect x="-2000" y="-2000" width="4400" height="2024" fill="url(#h2c-troi)" />
            <g className="h2c-tia-troi">
              {c.tia.map((t, i) => (
                <path key={i} d={t.d} fill="url(#h2c-tia)" transform={t.quay} opacity={t.mo} />
              ))}
            </g>
            <circle className="h2c-hao-troi" cx="64" cy="12" r="110" fill="url(#h2c-hao-troi)" />
            <circle cx="64" cy="12" r="22" fill="url(#h2c-mat-troi)" />
            <g>
              {c.mayXa.map((m, i) => (
                <MayBongBenh key={i} m={m} i={i} />
              ))}
            </g>
            <path d="M-700 22 C-640 6 -600 10 -560 18 C-520 2 -470 4 -430 20 C-380 14 -350 16 -320 22 Z M430 22 C470 4 510 2 550 16 C590 8 630 10 670 22 Z M760 22 C800 12 850 8 900 22 Z" fill="rgb(176 150 214 / .75)" />
          </g>

          {/* LỚP BIỂN: nước ngọc, vệt nắng, sóng, ánh lấp lánh */}
          <g className="h2c-lop" data-sau="0.45">
            <rect x="-2000" y="20" width="4400" height="2000" fill="url(#h2c-bien)" />
            <rect x="-2000" y="12" width="4400" height="20" fill="url(#h2c-chan-troi)" />
            <g className="h2c-vet-nang" fill="rgb(255 244 200)">
              {c.vetNang.map((e, i) => (
                <ellipse key={i} cx={e.cx} cy={e.cy} rx={e.rx} ry={e.ry} opacity={e.mo} style={{ ...bien('--t', e.t), ...bien('--d', e.d) }} />
              ))}
            </g>
            <g>
              {c.song.map((w, i) => (
                <g key={i} className={w.nguoc ? 'h2c-song h2c-nguoc' : 'h2c-song'} style={bien('--t', w.t)}>
                  <path d={w.d} fill="none" stroke={w.net} strokeWidth={w.day} />
                </g>
              ))}
            </g>
            <g>
              {c.sao.map((m, i) => (
                <g key={i}>
                  <circle className="h2c-lap" cx={m.x} cy={m.y} r={m.r} fill="url(#h2c-sao)" style={{ ...bien('--t', m.t), ...bien('--d', m.d) }} />
                  {m.sao4 && (
                    <g className="h2c-lap" style={{ ...bien('--t', m.sao4.t), ...bien('--d', m.sao4.dd) }}>
                      <path d={m.sao4.d} fill="rgb(255 255 255 / .95)" />
                    </g>
                  )}
                </g>
              ))}
            </g>
          </g>

          {/* LỚP ĐẢO + ĐẤT LIỀN (cùng một lớp để cầu, đường khớp nhau) */}
          <g className="h2c-lop" data-sau="0.7">
            <g className="h2c-dat-lien">
              <use href="#h2c-p-dat" transform="translate(10 30)" fill="url(#h2c-bong)" />
              <use href="#h2c-p-dat" transform="translate(0 22)" fill="none" stroke="rgb(255 255 255 / .8)" strokeWidth="4" className="h2c-bot-song" />
              <use href="#h2c-p-dat" transform="translate(0 18)" fill="url(#h2c-vach2)" />
              <use href="#h2c-p-dat" transform="translate(0 10)" fill="url(#h2c-vach1)" />
              <use href="#h2c-p-dat" transform="translate(0 -4)" fill="rgb(248 226 176)" />
              <use href="#h2c-p-dat" fill="url(#h2c-co)" />
              <use href="#h2c-p-dat" fill="none" stroke="url(#h2c-vien-sang)" strokeWidth="2.5" />
              <use href="#h2c-cay" x="-10" y="366" />
              <use href="#h2c-cay" x="8" y="356" />
              <use href="#h2c-thong" x="-26" y="420" />
              <use href="#h2c-cay" x="122" y="426" />
              <use href="#h2c-thong" x="136" y="440" />
              <use href="#h2c-cay" x="202" y="486" />
              <use href="#h2c-thong" x="110" y="470" />
              {/* đường hộ tống */}
              <path d={DUONG_HO_TONG} fill="none" stroke="rgb(250 232 186)" strokeWidth="10" strokeLinecap="round" />
              <path d={DUONG_HO_TONG} fill="none" stroke="rgb(200 160 100 / .5)" strokeWidth="10" strokeLinecap="round" transform="translate(0 1.5)" opacity=".4" />
              <path className="h2c-duong" d={DUONG_HO_TONG} fill="none" stroke="rgb(222 110 10)" strokeWidth="3" strokeLinecap="round" />
              {/* Bến: sàn gỗ có bề dày + cột đèn */}
              <g>
                <rect x="8" y="452" width="64" height="5" rx="1.5" fill="rgb(140 90 45)" />
                <rect x="8" y="445" width="64" height="8" rx="2" fill="url(#h2c-go)" />
                <path d="M20 445v8M32 445v8M44 445v8M56 445v8" stroke="rgb(160 104 50 / .6)" strokeWidth="1" />
                <rect x="-7" y="408" width="4" height="44" rx="1.5" fill="url(#h2c-cot)" />
                <circle className="h2c-den-long" cx="-5" cy="404" r="16" fill="url(#h2c-hao-vang)" />
                <rect x="-10" y="398" width="10" height="11" rx="2.5" fill="rgb(255 222 120)" stroke="rgb(170 110 30)" strokeWidth="1" />
              </g>
              {/* xe hàng khối + Linh Tâm pha lê */}
              <g transform="translate(40 442)">
                <ellipse cx="3" cy="4" rx="26" ry="5" fill="rgb(20 70 50 / .3)" />
                <g className="h2c-xe-lac">
                  <path d="M-22 -18 L-16 -24 L28 -24 L22 -18 Z" fill="rgb(236 186 120)" />
                  <path d="M22 -18 L28 -24 L28 -8 L22 -3 Z" fill="rgb(150 92 42)" />
                  <rect x="-22" y="-18" width="44" height="15" rx="2" fill="url(#h2c-go)" stroke="rgb(120 72 30)" strokeWidth="1.2" />
                  <path d="M-22 -11h44" stroke="rgb(150 95 40 / .7)" strokeWidth="1.2" />
                  {[-12, 14].map((bx) => (
                    <g key={bx}>
                      <circle cx={bx} cy="0" r="6" fill="rgb(90 60 36)" />
                      <circle cx={bx} cy="0" r="4" fill="none" stroke="rgb(220 170 110)" strokeWidth="1.4" />
                      <path d={`M${bx - 4} 0h8M${bx} -4v8`} stroke="rgb(220 170 110)" strokeWidth="1" />
                    </g>
                  ))}
                  <g className="h2c-linh-tam">
                    <circle className="h2c-hao-lt" cx="2" cy="-40" r="24" fill="url(#h2c-hao-lt)" />
                    <path d="M2 -54 L-8 -40 L2 -40 Z" fill="rgb(226 252 255)" />
                    <path d="M2 -54 L12 -40 L2 -40 Z" fill="rgb(150 226 250)" />
                    <path d="M-8 -40 L2 -26 L2 -40 Z" fill="rgb(96 196 240)" />
                    <path d="M12 -40 L2 -26 L2 -40 Z" fill="rgb(44 138 220)" />
                    <path d="M2 -54 L-8 -40 L2 -26 L12 -40 Z" fill="none" stroke="rgb(255 255 255 / .9)" strokeWidth=".8" />
                    <path d="M-3 -45 L0 -49 L1 -44 Z" fill="rgb(255 255 255)" />
                    <path className="h2c-lap-lt" d="M13 -52 l1 3 l3 1 l-3 1 l-1 3 l-1 -3 l-3 -1 l3 -1 z" fill="rgb(255 255 255)" />
                  </g>
                </g>
              </g>
              {/* Ổ phục kích = câu ôn còn ở Đoàn (tối đa 6 ổ vẽ) */}
              <g data-ve="o-phuc-kich" data-so={oPk.length}>
                {oPk.map(([x, y], i) => (
                  <g key={i} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${nhoO})`}>
                    <g className="h2c-o-pk">
                      <g className="h2c-xuat" style={{ animationDelay: `${(1.1 + i * 0.12).toFixed(2)}s` }}>
                        <g className="h2c-rung" style={bien('--d', `${-i * 0.7}s`)}>
                          <circle className="h2c-hao-do" r="20" fill="url(#h2c-hao-do)" />
                          <ellipse cx="3" cy="9" rx="13" ry="4" fill="rgb(30 60 40 / .35)" />
                          <path d={GAI} transform="translate(0 3)" fill="rgb(70 20 60)" />
                          <path d={GAI} fill="rgb(130 44 110)" stroke="rgb(255 110 160)" strokeWidth="1.4" />
                          <ellipse cx="-3" cy="-6" rx="6" ry="2.5" fill="rgb(255 180 220 / .5)" />
                          <g className="h2c-mat" style={bien('--d', `${-i * 0.9}s`)}>
                            <circle cx="-4" cy="-1" r="5" fill="url(#h2c-hao-do)" />
                            <circle cx="4" cy="-1" r="5" fill="url(#h2c-hao-do)" />
                            <ellipse cx="-4" cy="-1" rx="2.4" ry="1.7" fill="rgb(255 40 70)" />
                            <ellipse cx="4" cy="-1" rx="2.4" ry="1.7" fill="rgb(255 40 70)" />
                          </g>
                        </g>
                      </g>
                    </g>
                  </g>
                ))}
              </g>
            </g>

            {/* ĐẢO CHIẾN DỊCH 2.5D */}
            <g className="h2c-dao-noi">
              <use href="#h2c-p-dao" transform="translate(12 30)" fill="url(#h2c-bong)" />
              <use href="#h2c-p-dao" transform="translate(0 24)" fill="none" stroke="rgb(255 255 255 / .85)" strokeWidth="4" className="h2c-bot-song" />
              <use href="#h2c-p-dao" transform="translate(0 20)" fill="url(#h2c-vach2)" />
              <use href="#h2c-p-dao" transform="translate(0 11)" fill="url(#h2c-vach1)" />
              <use href="#h2c-p-dao" transform="translate(0 4)" fill="rgb(236 206 150)" />
              <use href="#h2c-p-dao" fill="rgb(250 232 186)" />
              <use href="#h2c-p-dao" fill="url(#h2c-co)" transform="scale(.93)" />
              <use href="#h2c-p-dao" fill="none" stroke="url(#h2c-vien-sang)" strokeWidth="3" />
              {/* núi 2 mặt sáng/tối + tuyết */}
              <ellipse cx="324" cy="172" rx="40" ry="8" fill="rgb(30 90 60 / .3)" />
              <path d="M288 170 L322 112 L322 172 Z" fill="rgb(206 196 228)" />
              <path d="M322 112 L356 170 L322 172 Z" fill="rgb(138 124 180)" />
              <path d="M322 112 L312 130 L318 127 L322 134 Z" fill="rgb(255 255 255)" />
              <path d="M322 112 L330 128 L326 126 L322 134 Z" fill="rgb(226 226 246)" />
              <path d="M266 178 L288 142 L288 178 Z" fill="rgb(160 190 170)" />
              <path d="M288 142 L310 178 L288 178 Z" fill="rgb(100 140 124)" />
              {/* rừng */}
              <use href="#h2c-cay" x="232" y="170" />
              <use href="#h2c-thong" x="248" y="158" />
              <use href="#h2c-cay" x="362" y="206" />
              <use href="#h2c-thong" x="376" y="192" />
              <use href="#h2c-cay" x="254" y="252" />
              <use href="#h2c-cay" x="334" y="262" />
              <use href="#h2c-thong" x="346" y="248" />
              <use href="#h2c-cay" x="222" y="214" />
              {/* vòng rune lục giác */}
              <circle className="h2c-rune-sang" cx="292" cy="212" r="36" fill="url(#h2c-rune)" />
              <g className="h2c-rune" fill="none" stroke="rgb(0 190 200)" strokeWidth="2.2">
                <path d="M292 190 L311 201 L311 223 L292 234 L273 223 L273 201 Z" fill="rgb(200 250 255 / .35)" />
                <path d="M292 198 L304 205 L304 219 L292 226 L280 219 L280 205 Z" strokeWidth="1.2" opacity=".8" />
              </g>
              {/* phần đã khai phá: lửa trại + cờ */}
              <g transform="translate(224 266)">
                <circle className="h2c-lua-trai" cx="0" cy="-2" r="12" fill="url(#h2c-hao-vang)" />
                <path d="M-5 2 l10 0" stroke="rgb(120 70 30)" strokeWidth="2" />
                <path d="M-3 1 L0 -7 L3 1 Z" fill="rgb(255 150 40)" />
                <path d="M-1.4 1 L0 -3.5 L1.4 1 Z" fill="rgb(255 230 120)" />
              </g>
              <g transform="translate(238 252)">
                <ellipse cx="3" cy="2" rx="6" ry="2" fill="rgb(20 80 50 / .35)" />
                <rect x="0" y="-20" width="2" height="22" fill="rgb(250 250 255)" />
                <path className="h2c-co-bay" d="M2 -20 h15 l-4 5 l4 5 h-15 z" fill="rgb(255 110 90)" />
              </g>
              {/* SƯƠNG MÙ: phủ phần CHƯA khai phá; lỗ quanh bến đảo nở theo % khai phá thật */}
              <g clipPath="url(#h2c-cat-dao)">
                <g mask="url(#h2c-m-suong)" data-ve="suong" data-phan-tram={p} opacity={p >= 100 ? 0 : 1}>
                  {(
                    [
                      [300, 150, 70, '17s', '0s'],
                      [350, 220, 66, '14s', '-4s'],
                      [260, 190, 62, '19s', '-8s'],
                      [300, 262, 56, '15s', '-2s'],
                      [220, 150, 52, '21s', '-11s'],
                      [380, 140, 50, '13s', '-6s'],
                      [250, 250, 46, '18s', '-9s'],
                    ] as const
                  ).map(([cx, cy, r, t, d], i) => (
                    <circle key={i} className="h2c-suong-cuon" style={{ ...bien('--t', t), ...bien('--d', d) }} cx={cx} cy={cy} r={r} fill="url(#h2c-suong)" />
                  ))}
                </g>
              </g>
              <circle className="h2c-rune-sang" cx="292" cy="212" r="20" fill="url(#h2c-rune)" opacity=".55" />
            </g>

            {/* CẦU gỗ có bề dày: bản lề ở bến đảo (204,288) — kéo lên 205°, hạ xuống 131° */}
            <g transform="translate(204 288)" data-ve={khoa ? 'cau-keo-len' : 'cau-ha'}>
              {khoa && <line x1="2" y1="-24" x2="-58" y2="-27" stroke="rgb(90 70 60)" strokeWidth="1.4" strokeDasharray="2 2" />}
              <g className="h2c-cau-van">
                <rect x="0" y="4" width="66" height="6" rx="1.5" fill="rgb(130 80 36)" />
                <rect x="0" y="-7" width="66" height="12" rx="2" fill="url(#h2c-go)" stroke="rgb(120 72 30)" strokeWidth="1.4" />
                <path d="M11 -7v12M22 -7v12M33 -7v12M44 -7v12M55 -7v12" stroke="rgb(150 95 40 / .7)" strokeWidth="1.2" />
                <path d="M2 -6h62" stroke="rgb(255 230 180 / .8)" strokeWidth="1" />
              </g>
              <rect x="-3.5" y="-26" width="7" height="30" rx="2" fill="url(#h2c-cot)" />
              <circle cx="0" cy="-26" r="3.5" fill="rgb(255 200 60)" stroke="rgb(170 110 20)" strokeWidth="1" />
              {khoa && (
                <g transform="translate(18 -28)">
                  <circle r="10.5" fill="rgb(255 255 255)" stroke="rgb(230 150 20)" strokeWidth="2.2" />
                  <path d="M-4 -1 h8 v6 h-8 z M-2.4 -1 v-2.4 a2.4 2.4 0 0 1 4.8 0 v2.4" stroke="rgb(170 90 0)" strokeWidth="1.7" fill="none" />
                </g>
              )}
            </g>
            <rect x="155" y="328" width="7" height="22" rx="2" fill="url(#h2c-cot)" />
            <circle cx="158.5" cy="328" r="3" fill="rgb(255 200 60)" />
            <g>
              {c.dom.map((d, i) => (
                <g key={i} className="h2c-dom" style={{ ...bien('--t', d.t), ...bien('--d', d.d), ...bien('--dx', d.dx), ...bien('--dy', d.dy) }}>
                  <circle cx={d.cx} cy={d.cy} r={d.r} fill="url(#h2c-hat-nang)" style={bien('--t2', d.t2)} />
                </g>
              ))}
            </g>
          </g>

          {/* LỚP GẦN: mây trôi sát mặt nước + bóng mây */}
          <g className="h2c-lop" data-sau="1.25">
            {c.mayGan.map((m, i) => (
              <g key={i}>
                <ellipse cx={m.x + 16} cy={m.y + 46} rx={60 * m.k} ry={14 * m.k} fill="rgb(10 80 110 / .12)" />
                <MayBongBenh m={m} i={i} />
              </g>
            ))}
          </g>
        </svg>

        {/* nhãn bản đồ: đặt theo toạ độ cảnh (khop), đi theo lớp đảo khi thị sai */}
        <div className="h2c-nhan-wrap" ref={refNhan}>
          {cd && (
            <span className="h2-nhan-bd h2-kinh h2-nhan-dao" data-x="300" data-y="84" data-neo="tren">
              Đảo {cd.ten} · <span className="h2c-pt">{p}% đã khai phá</span>
            </span>
          )}
          {s && s.doan.con > 0 && (
            <span className="h2-nhan-bd h2-kinh h2-nhan-phuc-kich" data-x="250" data-y="330" data-neo="duoi">
              {s.doan.con} ổ phục kích chặn cầu
            </span>
          )}
          {s && s.doan.con === 0 && s.dao.con > 0 && (
            <span className="h2-nhan-bd h2-kinh h2-nhan-cau-ha" data-x="250" data-y="330" data-neo="duoi">
              Cầu sang đảo đã hạ
            </span>
          )}
          <span className="h2-nhan-bd h2-kinh h2-nhan-ben" data-x="40" data-y="470" data-neo="duoi">
            Bến Hộ Tống · Linh Tâm của lớp
          </span>
        </div>
      </div>
      <div className="h2c-quet h2c-quet-mo" aria-hidden="true" />
      <div className="h2c-quet h2c-quet-deu" aria-hidden="true" />
      <div className="h2c-man-suong" aria-hidden="true" />
    </div>
  )
}
