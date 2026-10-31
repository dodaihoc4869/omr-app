// LỚP VẼ «LỬA ĐỔI CẢM XÚC» cấp 2–5 (thầy «Chốt duyệt tất» 31/10 — docs/DE-XUAT-BI-CAM-XUC-3110.md, bản vẽ scripts/ban-ve-bi-cam-xuc-3110/lua-gian.js).
// MẢNH NẠP LƯỜI riêng: chỉ Bi.tsx gọi import('./lua-gian') khi Lửa lên cấp ≥ 2 ⇒ em vui vẻ / chờ (cấp 0–1) không tải byte nào của lớp này; mảnh lua-dong
// (luôn tải trên Lộ trình) chỉ thêm vài phép tính vị trí. Không vẽ con mới: chồng chi tiết lên ĐÚNG hình Lửa (Cú Ngọc) — mắt, mày, miệng, má, chỏm lửa,
// hiệu ứng. Dựng nút LẦN ĐẦU cần cho từng cấp, rồi chỉ bật / tắt (hạ cấp ⇒ về đúng hình cũ).
//   2 Sốt ruột: đồng hồ báo thức nhỏ · 3 Bực: một gân giận · 4 Giận: tròng đỏ, mày chữ V, nghiến răng, ba vạch má, hai gân
//   5 Siêu cáu: tròng đỏ rực lõi vàng con ngươi dọc, răng to, lửa ngoài đỏ sẫm, hơi nước hai tai, vạch rung, gân thứ ba, quầng đỏ sau lưng.
// MÀU: chỉ biến --cn-* (styles/lua-gian.css nạp cùng mảnh này, pha color-mix từ token có sẵn) — không màu thô. Máy yếu / giảm chuyển động: đứng tĩnh, quầng là
// dải màu (không `filter`).
import type { DungGian, LopGian, PhanLua } from './lua-dong'
import '../../styles/lua-gian.css'

const NS = 'http://www.w3.org/2000/svg'
const M = (k: string) => `var(--cn-${k})`
function tao(tag: string, tt: Record<string, string | number> | null, cha?: Element | null): SVGElement {
  const e = document.createElementNS(NS, tag) as SVGElement
  if (tt) for (const k in tt) e.setAttribute(k, String(tt[k]))
  if (cha) cha.appendChild(e)
  return e
}
const to = (e: SVGElement, mau: string) => { e.style.fill = M(mau); return e }
const vien = (e: SVGElement, w: number, mau = 'vien') => { e.style.stroke = M(mau); e.setAttribute('stroke-width', String(w)); e.style.paintOrder = 'stroke'; e.setAttribute('stroke-linejoin', 'round'); return e }
const net = (e: SVGElement, mau: string, w: number) => { e.style.stroke = M(mau); e.setAttribute('stroke-width', String(w)); e.setAttribute('fill', 'none'); e.setAttribute('stroke-linecap', 'round'); e.setAttribute('stroke-linejoin', 'round'); return e }
const hien = (e: SVGElement | null | undefined, ok: boolean) => { if (e) e.style.display = ok ? '' : 'none' }

/** Dấu «gân giận» kiểu truyện tranh (bốn cung quay lưng vào nhau). */
function gan(cha: Element, x: number, y: number, k: number): SVGElement {
  const g = tao('g', { transform: `translate(${x},${y}) scale(${k})` }, cha)
  net(tao('path', { d: 'M-5,-16Q-5,-5 -16,-5M5,-16Q5,-5 16,-5M-5,16Q-5,5 -16,5M5,16Q5,5 16,5' }, g), 'gian', 6.5)
  return g
}
/** Miệng nghiến răng: rộng w, mép trên t, đáy b. */
function rang(cha: Element, w: number, t: number, b: number): SVGElement {
  const g = tao('g', null, cha)
  vien(to(tao('path', { d: `M${-w},${t + 5}Q0,${t - 6} ${w},${t + 5}L${w - 3},${b - 3}Q${w - 4},${b} ${w - 9},${b}H${-w + 9}Q${-w + 4},${b} ${-w + 3},${b - 3}Z` }, g), 'rang'), 3.6)
  net(tao('path', { d: `M${-w + 4},${(t + b) / 2 + 1}H${w - 4}` + [-w / 2, 0, w / 2].map((x) => `M${x},${t + 2.5}V${b - 1}`).join('') }, g), 'vien', 2.4)
  return g
}

export const dungGian: DungGian = (p: PhanLua): LopGian => {
  const n: Record<string, SVGElement> = {}
  const mieng = [...p.mq.children] as SVGElement[]
  const luaVo = p.lua.querySelector('path')
  let capNay = 0
  // nút từng phần dựng LẦN ĐẦU cần
  const lay = (k: string, dung: () => SVGElement) => (n[k] ??= dung())
  const mat = (lon: boolean) => p.mats.map(({ ng, miT }) => {
    const g = tao('g', null, null)
    ng.parentNode!.insertBefore(g, miT)
    to(tao('circle', { r: lon ? 21 : 15 }, g), 'matDo')
    if (lon) to(tao('circle', { r: 10 }, g), 'matSang')
    to(lon ? tao('ellipse', { rx: 3.2, ry: 8 }, g) : tao('circle', { r: 5.5 }, g), 'den')
    to(tao('circle', { cx: -7, cy: -8, r: lon ? 3.4 : 3 }, g), 'rang')
    return g
  })
  const matG: Record<'4' | '5', SVGElement[] | undefined> = { 4: undefined, 5: undefined }
  const DUNG: Record<string, () => SVGElement> = {
    dongHo: () => { // cấp 2: đồng hồ báo thức nhỏ trên vai (thời gian đang trôi)
      const g = tao('g', { transform: 'translate(132,-296)' }, p.hieu)
      vien(tao('path', { d: 'M-20,-14a9,9 0 0,1 12,-9M20,-14a9,9 0 0,0 -12,-9', fill: 'none' }, g), 5)
      vien(to(tao('circle', { r: 19 }, g), 'rang'), 4.5)
      net(tao('path', { d: 'M0,0V-11M0,0L8,5' }, g), 'vien', 4)
      net(tao('path', { d: 'M-12,20L-15,25M12,20L15,25' }, g), 'vien', 4)
      return g
    },
    gan3: () => gan(p.hieu, 128, -298, 0.95),
    gan4: () => { const g = tao('g', null, p.hieu); gan(g, 142, -232, 1); gan(g, -144, -218, 0.85); return g },
    gan5: () => { const g = tao('g', null, p.hieu); gan(g, 142, -232, 1.2); gan(g, -144, -218, 1.05); return g },
    rang4: () => rang(p.mq, 17, -1, 12),
    rang5: () => rang(p.mq, 25, -5, 17),
    ma: () => { // ba vạch đỏ ửng mỗi bên má
      const g = tao('g', { opacity: 0.55 }, p.mat)
      for (const s of [-1, 1]) net(tao('path', { d: [0, 1, 2].map((k) => `M${s * (58 + k * 9) + 3},33L${s * (58 + k * 9) - 3},46`).join('') }, g), 'vien', 3)
      return g
    },
    luaNgoai: () => { // lớp lửa ngoài đỏ sẫm sau chỏm lửa
      const e = vien(to(tao('path', { d: luaVo?.getAttribute('d') ?? '', transform: 'translate(0,4) scale(1.32,1.25)' }, null), 'luaNgoai'), 4)
      p.lua.insertBefore(e, p.lua.firstChild)
      return e
    },
    hoi: () => { // hơi nước phụt hai tai + vạch rung hai bên thân
      const g = tao('g', null, p.hieu)
      for (const s of [-1, 1]) {
        const tia = `M${s * 70},-326L${s * 98},-338M${s * 76},-312L${s * 104},-314`
        net(tao('path', { d: tia }, g), 'vien', 11)
        net(tao('path', { d: tia }, g), 'hoi', 6)
        const may = [[112, -346, 13], [134, -360, 17], [156, -338, 15], [140, -322, 12]] as const
        const may4 = vien(to(tao('path', { d: may.map(([x, y, r]) => `M${s * x - r},${y}a${r},${r} 0 1,0 ${2 * r},0a${r},${r} 0 1,0 ${-2 * r},0`).join(''), class: 'lua-hoi' }, g), 'hoi'), 3.5)
        may4.style.transformBox = 'fill-box'; may4.style.transformOrigin = '50% 100%' // phập phồng tại chỗ (gốc = chân cụm mây)
        net(tao('path', { d: `M${s * 124},-168q${s * 12},16 0,32M${s * 140},-180q${s * 17},28 0,56` }, g), 'gian', 5.5)
      }
      return g
    },
    quang: () => { // quầng đỏ sau lưng (dải màu tròn, không filter)
      const id = p.id + 'q', rg = tao('radialGradient', { id, cx: '50%', cy: '50%', r: '50%' }, p.defs)
      for (const [o, a] of [[0, 0.55], [0.6, 0.22], [1, 0]] as const) { const st = tao('stop', { offset: o }, rg); st.style.stopColor = 'var(--g-do)'; st.style.stopOpacity = String(a) }
      const e = tao('ellipse', { cx: 0, cy: -196, rx: 176, ry: 196, fill: `url(#${id})` }, null)
      p.svg.insertBefore(e, p.defs.nextSibling)
      return e
    },
  }
  const bat = (k: string, ok: boolean) => { if (ok) hien(lay(k, DUNG[k]!), true); else hien(n[k], false) }
  return {
    cap(c) {
      capNay = c
      const giu = c >= 4, lon = c >= 5
      bat('dongHo', c === 2)
      bat('gan3', c === 3)
      bat('gan4', c === 4)
      bat('gan5', lon)
      bat('rang4', c === 4)
      bat('rang5', lon)
      bat('ma', giu)
      bat('luaNgoai', lon)
      bat('hoi', lon)
      bat('quang', lon)
      // mắt: tròng đỏ (cấp 5 to, lõi vàng, con ngươi dọc) thay hai đốm sáng
      if (c === 4 && !matG[4]) matG[4] = mat(false)
      if (lon && !matG[5]) matG[5] = mat(true)
      for (const g of matG[4] ?? []) hien(g, c === 4)
      for (const g of matG[5] ?? []) hien(g, lon)
      for (const { ng, may } of p.mats) {
        hien(ng, !giu)
        may.setAttribute('d', lon ? 'M-22,0H22' : giu ? 'M-18,0H18' : 'M-14,0H14')
        may.setAttribute('stroke-width', lon ? '11' : giu ? '8.5' : '6')
      }
      for (const e of mieng) hien(e, !giu) // miệng thường ⇄ nghiến răng
    },
    ve(t, tinh) {
      // cấp 5: hơi nước phập phồng (nhịp 240 ms) — máy yếu / giảm chuyển động: đứng yên
      if (capNay < 5 || !n.hoi) return
      const k = tinh ? 1 : Math.round((1 + 0.1 * Math.sin(t / 76)) * 100) / 100
      for (const e of n.hoi.querySelectorAll<SVGElement>('.lua-hoi')) e.setAttribute('transform', `scale(${k})`)
    },
  }
}

// ── BIỂU TƯỢNG TAB TRÌNH DUYỆT (đặc tả mục 2.2): cấp 4–5 ⇒ đầu Lửa đỏ, chụp từ CHÍNH hình Lửa đang vẽ trên trang (màu token đã quy ra — không tệp ảnh mới,
// không mã màu thô); hạ cấp / rời Lộ trình ⇒ về logo cũ (đúng href / type ban đầu). Nằm ở mảnh lười này (chỉ cần khi Lửa đã ≥ cấp 2) — Lộ trình truyền
// hàm chụp SVG (`anhSvg` của khung-tinh-hs) vào để mảnh này không kéo theo mô-đun ấy. Máy chặn canvas / ảnh ⇒ giữ logo, không ném lỗi.
let iconGoc: { el: HTMLLinkElement; href: string; type: string }[] | null = null
let lanIcon = 0
export async function datIconTabLua(cap: number, anh: (svg: SVGSVGElement) => { src: string } | null): Promise<void> {
  const ma = ++lanIcon
  if (cap < 4) { if (iconGoc) for (const g of iconGoc) { g.el.type = g.type; g.el.href = g.href } iconGoc = null; return }
  try {
    // ưu tiên Lửa đứng thẳng (vòng Mục tiêu ngày / bong bóng) đã vẽ xong đúng cấp; thiếu thì Lửa cạnh đường
    const duoi = `[data-cap="${cap}"] > svg.lua-svg[data-cap-ve="${cap}"]`
    const svg = document.querySelector<SVGSVGElement>(`.bi.lua:not([data-goc])${duoi}`) ?? document.querySelector<SVGSVGElement>(`.bi.lua${duoi}`)
    const a = svg && anh(svg)
    if (!a) return
    const img = new Image()
    img.src = a.src.replace(/width='[^']*' height='[^']*'/, "width='340' height='391'") // khung vẽ đúng cỡ gốc 340 × 391
    await img.decode()
    const c = document.createElement('canvas')
    c.width = c.height = 64
    const x = c.getContext('2d')
    if (!x || ma !== lanIcon) return
    x.drawImage(img, 30, 0, 280, 280, 0, 0, 64, 64) // đầu Lửa: x −140…140, y −372…−92 của khung vẽ (gồm chỏm lửa + hơi nước)
    const url = c.toDataURL('image/png')
    if (ma !== lanIcon || !url.startsWith('data:image/png')) return
    iconGoc ??= [...document.querySelectorAll<HTMLLinkElement>('link[rel="icon"]')].map((el) => ({ el, href: el.getAttribute('href') ?? '', type: el.type }))
    for (const g of iconGoc) { g.el.type = 'image/png'; g.el.href = url }
  } catch { /* giữ logo */ }
}
