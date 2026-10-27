// HIỆU ỨNG DẢI ĐÚNG kiểu Duolingo (thầy 27/10, video quay màn Duolingo: «Hiệu ứng phải như thế này»). Đo theo khung video (15 khung/s):
//  - dải trượt lên ~140 ms (CSS duo-ket-len); ô đúng: vệt sáng chéo quét ~250 ms (CSS);
//  - MÂY BỌT: ngay mép trên dải, một dải mây nhiều bướu tròn (viền đậm hơn nền dải) phồng lên rồi xẹp, tan vào dải ~600 ms;
//  - HẠT VUÔNG BO GÓC xanh lá (6–14 px, ba sắc) bắn lên từ mép trên dải và từ ô đúng, tung rồi rơi chậm, xoay, mờ dần ~700–900 ms, 16 hạt.
// Chỉ transform / opacity (Web Animations). Gắn <BungDung /> TRONG dải `.duo-ket` (màn làm chặng Duo + màn sửa câu Duo); dải gỡ (bấm «Tiếp tục») ⇒ hiệu ứng
// tự huỷ. Giảm chuyển động / máy yếu ⇒ không chạy (chỉ đổi màu). Dải sai / chưa tính ⇒ không gắn.
import { useEffect, useRef } from 'react'
import { yenLang } from '../../lib/hieu-ung'

const NS = 'http://www.w3.org/2000/svg'
// giả ngẫu nhiên cố định (ảnh chụp ổn định, không Math.random)
const ngau = (i: number) => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x) }

export function bungDung(tam: HTMLElement, o: Element | null): () => void {
  const hoat: Animation[] = [], nut: Element[] = []
  const ve = (e: Element, k: Keyframe[], op: KeyframeAnimationOptions) => { if (!e.animate) return; hoat.push(e.animate(k, op)) }
  // ── mây bọt ──
  const w = tam.clientWidth, H = 80
  const svg = document.createElementNS(NS, 'svg')
  svg.setAttribute('class', 'duo-may'); svg.setAttribute('aria-hidden', 'true')
  svg.setAttribute('viewBox', `0 0 ${w} ${H}`); svg.setAttribute('width', String(w)); svg.setAttribute('height', String(H))
  const so = Math.max(5, Math.round(w / 64))
  const buou: { x: number; r: number }[] = []
  for (let i = 0; i < so; i++) {
    const r = 30 + ngau(i + 9) * 24
    // bướu nằm trọn trong bề ngang dải (không thò ra ngoài màn — máy đo tràn đo cả hình bị cắt)
    buou.push({ x: Math.min(w - r - 3, Math.max(r + 3, (w / (so - 1)) * i + (ngau(i) - 0.5) * 30)), r })
  }
  for (const lop of ['vien', 'nen'] as const) {
    buou.forEach(({ x, r }, i) => {
      const g = document.createElementNS(NS, 'g')
      const c = document.createElementNS(NS, 'circle')
      c.setAttribute('cx', String(x)); c.setAttribute('cy', String(H + r * 0.3)); c.setAttribute('r', String(lop === 'vien' ? r + 3 : r))
      c.setAttribute('class', lop); g.append(c); svg.append(g)
      // từng bướu phồng lệch nhịp ⇒ bọt sủi, không phải một khối
      ve(g, [{ transform: `translateY(${r}px)` }, { transform: 'translateY(-3px)', offset: 0.4 }, { transform: 'translateY(0)', offset: 0.6 }, { transform: `translateY(${r * 1.1}px)` }],
        { duration: 600, delay: 70 + i * 22, easing: 'cubic-bezier(.3,.7,.4,1)', fill: 'both' })
    })
  }
  const lot = document.createElementNS(NS, 'rect')
  lot.setAttribute('x', '0'); lot.setAttribute('y', String(H - 1)); lot.setAttribute('width', String(w)); lot.setAttribute('height', '2'); lot.setAttribute('class', 'nen')
  svg.append(lot)
  tam.append(svg); nut.push(svg)
  ve(svg, [{ opacity: 1 }, { opacity: 1, offset: 0.85 }, { opacity: 0 }], { duration: 760, easing: 'linear', fill: 'both' })
  // ── hạt vuông bo góc ──
  const r = tam.getBoundingClientRect(), ro = o?.getBoundingClientRect()
  for (let i = 0; i < 16; i++) {
    const tuO = ro && i >= 12
    const x0 = tuO ? ro.left + ro.width * (0.25 + ngau(i) * 0.5) : r.left + 16 + ngau(i * 3) * (r.width - 32)
    const y0 = tuO ? ro.top + ro.height / 2 : r.top + 4
    const s = 6 + Math.round(ngau(i * 5) * 8), dx = (ngau(i * 7) - 0.5) * 120, len = 70 + ngau(i * 11) * 110, xoay = (ngau(i * 13) - 0.5) * 220
    const h = document.createElement('i')
    h.className = 'duo-vuong'; h.dataset.s = String(i % 3); h.setAttribute('aria-hidden', 'true')
    h.style.width = h.style.height = `${s}px`
    document.body.append(h); nut.push(h)
    const t = (x: number, y: number, q: number, k: number) => `translate(${x0 + x - s / 2}px, ${y0 + y - s / 2}px) rotate(${q}deg) scale(${k})`
    ve(h, [{ transform: t(0, 0, 0, 0.5), opacity: 0 }, { transform: t(dx * 0.6, -len, xoay * 0.5, 1), opacity: 1, offset: 0.35 }, { transform: t(dx, -len + 40, xoay, 0.9), opacity: 0 }],
      { duration: 720 + ngau(i * 17) * 200, delay: 90 + ngau(i * 19) * 110, easing: 'cubic-bezier(.2,.7,.4,1)', fill: 'both' })
  }
  return () => {
    for (const a of hoat) { try { a.cancel() } catch { /* đã xong */ } }
    for (const n of nut) n.remove()
  }
}

/** Gắn trong dải ĐÚNG: chạy một lần khi dải hiện, huỷ khi dải gỡ. `o` = ô / ý đúng (hạt bắn từ đó), thiếu thì chỉ từ mép dải. */
export function BungDung({ chonO = '.ht2-lam-pa[data-ket=dung], .ht2-lam-o-hang[data-ket=dung], [data-trang-thai=dung]' }: { chonO?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const tam = ref.current?.closest<HTMLElement>('.duo-ket')
    if (!tam || yenLang()) return
    const goc = tam.closest('.ht-app, .duo, main') ?? document
    return bungDung(tam, goc.querySelector(chonO))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return <span ref={ref} hidden />
}
