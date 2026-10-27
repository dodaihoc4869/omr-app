// HIỆU ỨNG THƯỞNG Ở TẤM KẾT QUẢ màn làm chặng Duo (thầy 27/10: «Cái nguyên tử trôi lên làm hiệu ứng cùng với cái dải xanh đó» · «Làm đúng nhiều câu liên tiếp
// có hiệu ứng rung chuyển màn hình và con linh vật gắp kinh nghiệm, rung siêu xịn như dolingo»). Chỉ transform / opacity (Web Animations), không chặn bấm,
// huỷ được bất cứ lúc nào (bấm «Tiếp tục» ⇒ huỷ ⇒ số nhảy thẳng tới số cuối). Số nguyên tử LẤY TỪ PHẢN HỒI MÁY CHỦ (`thuong`), không bịa.
//  LÀM LẠI 27/10 (thầy: «Hiệu ứng kinh nghiệm chạy chưa đẹp mắt và tinh tế. Làm lại cho ngon như Duolingo» · «sét đánh dọc màn hình rung lắc siêu xịn»):
//  - BỎ đường bay vòng cung của nhiều hạt từ dải lên góc màn. Mọi viên thưởng CHỈ bật cạnh bộ đếm ⚛ góc phải trên: viên «+N» (chữ đậm màu nguyên tử) bật
//    .6 → 1,1 → 1 (160 ms) rồi trôi lên 12 px, mờ dần (600 ms); thưởng chuỗi / làm nghiêm túc = viên thứ hai màu cam, bật sau 120 ms, chồng lệch nhẹ.
//    Bộ đếm: ⚛ xoay một vòng + nảy 1,15; số lăn từng chữ số (SoLan.tsx).
//  - MỐC 3 · 5 · 10: SÉT đánh dọc màn (1 / 2 / 3 tia zigzag có nhánh, lõi sáng viền cam vàng, vẽ xuống 90 ms rồi chớp 2–3 lần ~350 ms; mốc 10 thêm tia lửa ở
//    chân tia) + màn loé vàng rất nhẹ + khung nội dung LẮC tắt dần (7 nhịp ~500 ms, 6 / 9 / 12 px, xoay 0,5 / 0,8 / 1,2°) trùng cú sét đầu + rung máy (nhịp
//    mạnh 120 ms đúng lúc sét) + tiếng sét nổ rồi chuông. Bi bay vào, gom 3–6 hạt ⚛ 20 px quanh người rồi ném lên bộ đếm (đường ngắn). Tổng ≤ 1,2 s.
//  - Giảm chuyển động: không sét, không lắc, không hạt — chỉ băng mốc + đổi số (rung / tiếng giữ). Máy yếu (html.may-yeu, ≤ 4 nhân, tiết kiệm dữ liệu):
//    bản nhẹ — 1 tia, lắc nửa biên độ, không tia lửa.
import { rung } from '../../lib/rung'
import { phat } from '../../lib/am-thanh'
import { phatThuong } from '../../lib/am-thanh-thuong'

export type MocCombo = 0 | 3 | 5 | 10
/** Mốc combo của chuỗi đúng liền n: 3, 5, 10 rồi mỗi 5 câu (15, 20 …, hiệu ứng như mốc 10). */
export const mocCombo = (n: number): MocCombo => (n === 3 ? 3 : n === 5 ? 5 : n >= 10 && n % 5 === 0 ? 10 : 0)
/** Chữ băng mốc: «3 câu đúng liền!» · «Phản ứng dây chuyền! ×5» · «10 câu liền — huy hiệu mới!» · 15+: «Phản ứng dây chuyền! ×15». */
export const chuMoc = (n: number) => (n === 10 ? '10 câu liền — huy hiệu mới!' : n >= 5 ? `Phản ứng dây chuyền! ×${n}` : `${n} câu đúng liền!`)

const tam = (e: Element) => { const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2] as const }
const NS = 'http://www.w3.org/2000/svg'
// giả ngẫu nhiên theo hạt giống (ảnh / video chụp ổn định, không Math.random)
const ngau = (i: number) => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x) }

/** Máy yếu ⇒ bản nhẹ. */
export function mayYeu(): boolean {
  if (typeof document === 'undefined') return false
  if (document.documentElement.classList.contains('may-yeu')) return true
  const n = navigator as Navigator & { connection?: { saveData?: boolean } }
  return (n.hardwareConcurrency ?? 8) <= 4 || n.connection?.saveData === true
}

type Dat = {
  /** khung nội dung (lắc) */ goc: HTMLElement | null
  /** bộ đếm ⚛ góc phải trên */ dem: HTMLElement | null
  /** Bi gom thưởng (chỉ mốc) */ bi: HTMLElement | null
  /** mép trên dải kết quả — sét dừng trên đó, không đánh xuống nút */ day?: HTMLElement | null
  /** nguyên tử của câu (máy chủ) và phần thưởng chuỗi / làm nghiêm túc trong đó (viên cam) */ N: number; phu?: number
  moc: MocCombo; chuoi: number
  /** cộng `them` vào số trên bộ đếm (một lần, lúc viên bật) */ onSo: (them: number) => void
}

/** Chạy hiệu ứng; trả hàm huỷ. `yen` (giảm chuyển động) ⇒ đổi số ngay, không chuyển động (rung / tiếng mốc vẫn giữ). */
export function chayThuong(d: Dat, yen: boolean): () => void {
  const hoat: Animation[] = [], hen: number[] = [], nut: Element[] = []
  const sau = (ms: number, f: () => void) => { hen.push(window.setTimeout(f, ms)) }
  const ve = (e: Element | null | undefined, k: Keyframe[], o: KeyframeAnimationOptions) => { if (!e?.animate) return null; const a = e.animate(k, o); hoat.push(a); return a }
  const nhe = mayYeu()
  if (d.moc) {
    const k = d.moc === 10 ? 'combo10' : d.moc === 5 ? 'combo5' : 'combo3'
    sau(60, () => { rung(k); if (!yen) phatThuong('set') })
    sau(yen ? 60 : 280, () => phat(k, Math.min(7, Math.max(0, d.chuoi - 3))))
  }
  if (yen) { if (d.N > 0) d.onSo(d.N); return huy }

  // ── viên «+N» cạnh bộ đếm + bộ đếm xoay / nảy / lăn số ──
  const bat = () => {
    if (d.N <= 0 || !d.dem) { if (d.N > 0) d.onSo(d.N); return }
    const phu = Math.max(0, Math.min(d.N, d.phu ?? 0)), chinh = d.N - phu
    const vien = (so: number, cam: boolean, tre: number) => {
      const v = document.createElement('span')
      v.className = 'duo-vien'; v.setAttribute('aria-hidden', 'true'); if (cam) v.dataset.cam = ''
      v.textContent = `+${so}`
      d.dem!.append(v); nut.push(v)
      ve(v, [{ transform: 'translateY(0) scale(.6)', opacity: 0 }, { transform: 'translateY(0) scale(1.1)', opacity: 1, offset: 0.12 }, { transform: 'translateY(0) scale(1)', opacity: 1, offset: 0.21 },
        { transform: 'translateY(-12px) scale(1)', opacity: 0 }], { duration: 760, delay: tre, easing: 'ease-out', fill: 'both' })
    }
    if (chinh > 0) vien(chinh, false, 0)
    if (phu > 0) vien(phu, true, chinh > 0 ? 120 : 0)
    ve(d.dem.querySelector('svg'), [{ transform: 'rotate(0) scale(1)' }, { transform: 'rotate(200deg) scale(1.15)', offset: 0.55 }, { transform: 'rotate(360deg) scale(1)' }], { duration: 520, easing: 'cubic-bezier(.3,.7,.4,1)' })
    ve(d.dem, [{ transform: 'scale(1)' }, { transform: 'scale(1.15)', offset: 0.4 }, { transform: 'scale(1)' }], { duration: 300, easing: 'ease-out' })
    d.onSo(d.N)
  }
  if (!d.moc) { sau(220, bat); return huy }

  // ── MỐC COMBO: sét + loé + lắc tắt dần ──
  const soTia = nhe ? 1 : d.moc === 10 ? 3 : d.moc === 5 ? 2 : 1
  const A = (d.moc === 10 ? 12 : d.moc === 5 ? 9 : 6) * (nhe ? 0.5 : 1), Q = d.moc === 10 ? 1.2 : d.moc === 5 ? 0.8 : 0.5
  sau(60, () => {
    const W = window.innerWidth, H = window.innerHeight
    // dải kết quả đang trượt lên (transform) ⇒ lấy mép trên ĐÍCH của dải (đáy màn − cao dải), không lấy vị trí đang trượt
    const day = d.day ? H - d.day.offsetHeight : H
    const lop = document.createElementNS(NS, 'svg')
    lop.setAttribute('class', 'duo-set'); lop.setAttribute('aria-hidden', 'true')
    lop.setAttribute('viewBox', `0 0 ${W} ${H}`); lop.setAttribute('width', String(W)); lop.setAttribute('height', String(H))
    document.body.append(lop); nut.push(lop)
    const loe = document.createElement('div'); loe.className = 'duo-set-loe'; loe.setAttribute('aria-hidden', 'true'); document.body.append(loe); nut.push(loe)
    ve(loe, [{ opacity: 0 }, { opacity: 0.18, offset: 0.2 }, { opacity: 0.05, offset: 0.45 }, { opacity: 0.12, offset: 0.6 }, { opacity: 0 }], { duration: 420, easing: 'linear', fill: 'both' })
    for (let t = 0; t < soTia; t++) {
      const g = d.chuoi * 7 + t * 31
      // vị trí ngang 20–80 %, các tia tách nhau (trái / phải / giữa); dừng trên mép dải kết quả (không đánh thẳng xuống nút đang bấm)
      const x0 = W * (soTia === 1 ? 0.3 + ngau(g) * 0.4 : [0.24, 0.72, 0.5][t]! + (ngau(g) - 0.5) * 0.08)
      const yHet = Math.min(H * (0.7 + ngau(g + 1) * 0.2), day - 12)
      const buoc = 9, pts: [number, number][] = [[x0, -4]]
      for (let i = 1; i <= buoc; i++) pts.push([x0 + (ngau(g + i * 3) - 0.5) * 56 + (i % 2 ? 10 : -10), (yHet * i) / buoc])
      const nhanh: [number, number][][] = [3, 6].map((m, j) => { const [bx, by] = pts[m]!, h = j % 2 ? 1 : -1
        return [[bx, by], [bx + h * 22, by + 26], [bx + h * 16, by + 46], [bx + h * 34, by + 70]] })
      const dd = (p: [number, number][]) => p.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('')
      const tia = document.createElementNS(NS, 'g')
      tia.setAttribute('class', 'tia')
      for (const lopNet of ['vien', 'giua', 'loi'] as const) for (const p of [pts, ...nhanh]) {
        const e = document.createElementNS(NS, 'path')
        e.setAttribute('d', dd(p)); e.setAttribute('class', lopNet + (p === pts ? '' : ' nhanh')); e.setAttribute('pathLength', '1')
        tia.append(e)
        ve(e, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 90, delay: t * 120 + (p === pts ? 0 : 50), easing: 'ease-in', fill: 'both' })
      }
      lop.append(tia)
      // chớp 2–3 lần, sáng giảm dần
      ve(tia, [{ opacity: 1 }, { opacity: 1, offset: 0.26 }, { opacity: 0.15, offset: 0.36 }, { opacity: 0.85, offset: 0.48 }, { opacity: 0.1, offset: 0.62 }, { opacity: 0.5, offset: 0.74 }, { opacity: 0 }],
        { duration: 350, delay: t * 120, easing: 'linear', fill: 'both' })
      // mốc 10: tia lửa ở chân tia
      if (d.moc === 10 && !nhe) {
        const [cx, cy] = pts[pts.length - 1]!
        for (let i = 0; i < 6; i++) {
          const h = document.createElementNS(NS, 'circle')
          h.setAttribute('class', 'lua'); h.setAttribute('r', String(2 + ngau(g + i) * 2)); h.setAttribute('cx', String(cx)); h.setAttribute('cy', String(cy))
          lop.append(h)
          const goc = (-150 + ngau(g + i * 5) * 120) * Math.PI / 180, xa = 26 + ngau(g + i * 7) * 30
          ve(h, [{ transform: 'translate(0,0)', opacity: 1 }, { transform: `translate(${Math.cos(goc) * xa}px, ${Math.sin(goc) * xa + 18}px)`, opacity: 0 }],
            { duration: 420, delay: t * 120 + 80, easing: 'cubic-bezier(.2,.7,.4,1)', fill: 'both' })
        }
      }
    }
    // lắc tắt dần trùng cú sét đầu: 7 nhịp ~500 ms
    const nhip = [1, -0.82, 0.62, -0.44, 0.28, -0.14, 0.05, 0]
    ve(d.goc, nhip.map((m) => ({ transform: `translate(${(A * m).toFixed(2)}px, ${(A * m * -0.25).toFixed(2)}px) rotate(${(Q * m).toFixed(2)}deg)` })), { duration: 500, easing: 'linear' })
  })
  sau(560, () => { for (const n of nut) if (n.classList.contains('duo-set') || n.classList.contains('duo-set-loe')) n.remove() })

  // ── Bi bay vào, gom hạt ⚛ quanh người, ném lên bộ đếm ──
  const hinh = d.dem?.querySelector('svg')
  if (!d.bi || d.N <= 0 || !hinh || !d.dem) { sau(420, bat); return huy }
  ve(d.bi, [{ transform: 'translateX(24px) scale(.35) rotate(24deg)', opacity: 0 }, { transform: 'translateX(-8px) scale(1.06) rotate(-6deg)', opacity: 1, offset: 0.75 }, { transform: 'none', opacity: 1 }],
    { duration: 260, delay: 100, easing: 'ease-out', fill: 'both' })
  const so = nhe ? 3 : d.moc === 10 ? 6 : d.moc === 5 ? 5 : 4
  sau(380, () => {
    const g = tam(d.bi!), b = tam(d.dem!)
    for (let i = 0; i < so; i++) {
      const h = document.createElement('span')
      h.className = 'duo-hat'; h.setAttribute('aria-hidden', 'true'); h.append(hinh.cloneNode(true))
      document.body.append(h); nut.push(h)
      const goc = (i / so) * Math.PI * 2 - Math.PI / 2, x = g[0] + Math.cos(goc) * 58, y = g[1] + Math.sin(goc) * 58
      const t = (px: number, py: number, k: number) => `translate(${(px - 10).toFixed(1)}px, ${(py - 10).toFixed(1)}px) scale(${k})`
      // bật ra quanh Bi (0 → 120 ms) · hút vào người (→ 320 ms) · ném lên bộ đếm (420 → 680 ms)
      const an = ve(h, [{ transform: t(g[0], g[1], 0.3), opacity: 0 }, { transform: t(x, y, 1.1), opacity: 1, offset: 0.18 }, { transform: t(g[0], g[1], 0.8), opacity: 1, offset: 0.47 },
        { transform: t(g[0], g[1] - 6, 1), opacity: 1, offset: 0.62 }, { transform: t(b[0], b[1], 0.9), opacity: 1 }], { duration: 680, delay: i * 25, easing: 'ease-in-out', fill: 'both' })
      const xong = () => { h.remove(); if (i === so - 1) bat() }
      if (an) an.onfinish = xong; else xong()
    }
  })
  // ôm hạt ⇒ nhảy mừng (~700 ms), rời màn (950 → 1 150 ms)
  sau(680, () => ve(d.bi, [{ transform: 'none' }, { transform: 'translateY(-14px) scale(1.08, .94)' }, { transform: 'translateY(0) scale(.96, 1.06)' }, { transform: 'none' }], { duration: 240, easing: 'ease-out' }))
  sau(950, () => {
    const ra = ve(d.bi, [{ transform: 'none', opacity: 1 }, { transform: 'translateX(24px) scale(.4) rotate(14deg)', opacity: 0 }], { duration: 200, easing: 'ease-in' })
    if (ra) ra.onfinish = () => { for (const a of hoat) if (a.effect && (a.effect as KeyframeEffect).target === d.bi) a.cancel(); d.bi!.style.display = 'none' }
  })
  return huy

  function huy() {
    for (const t of hen) window.clearTimeout(t)
    for (const a of hoat) { a.onfinish = null; try { a.cancel() } catch { /* đã xong */ } }
    for (const n of nut) n.remove()
  }
}
