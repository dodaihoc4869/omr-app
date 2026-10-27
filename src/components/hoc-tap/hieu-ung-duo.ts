// HIỆU ỨNG THƯỞNG Ở TẤM KẾT QUẢ màn làm chặng Duo (thầy 27/10: «Cái nguyên tử trôi lên làm hiệu ứng cùng với cái dải xanh đó» · «Làm đúng nhiều câu liên tiếp
// có hiệu ứng rung chuyển màn hình và con linh vật gắp kinh nghiệm, rung siêu xịn như dolingo»). Chỉ transform / opacity (Web Animations), không chặn bấm,
// huỷ được bất cứ lúc nào (bấm «Tiếp tục» ⇒ huỷ ⇒ số nhảy thẳng tới số cuối). Số nguyên tử LẤY TỪ PHẢN HỒI MÁY CHỦ (`thuong`), không bịa.
//  - Câu đúng thường: 3–4 hạt nguyên tử bay theo đường cong từ tiêu đề dải lên bộ đếm góc phải trên; mỗi hạt chạm ⇒ bộ đếm nảy + số tăng + «lách cách».
//  - Mốc chuỗi đúng liền 3 · 5 · 10 (rồi mỗi 5 câu): khung nội dung lắc 350 ms (3 / 5 / 7 px, mốc 10 xoay ±0,6°) + chớp sáng mép màn màu lửa + rung máy
//    mạnh dần (rung.ts combo3/5/10) + chuông lên nốt; Bi bay vụt vào từ mép phải, gom hạt vào người, nhảy mừng rồi ném lên bộ đếm. Tổng ≤ 1,4 s.
import { phanHoi } from '../../lib/phan-hoi'

export type MocCombo = 0 | 3 | 5 | 10
/** Mốc combo của chuỗi đúng liền n: 3, 5, 10 rồi mỗi 5 câu (15, 20 …, hiệu ứng như mốc 10). */
export const mocCombo = (n: number): MocCombo => (n === 3 ? 3 : n === 5 ? 5 : n >= 10 && n % 5 === 0 ? 10 : 0)
/** Chữ băng mốc: «3 câu đúng liền!» · «Phản ứng dây chuyền! ×5» · «10 câu liền — huy hiệu mới!» · 15+: «Phản ứng dây chuyền! ×15». */
export const chuMoc = (n: number) => (n === 10 ? '10 câu liền — huy hiệu mới!' : n >= 5 ? `Phản ứng dây chuyền! ×${n}` : `${n} câu đúng liền!`)

const tam = (e: Element) => { const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2] as const }

type Dat = { goc: HTMLElement | null; tu: Element | null; dem: HTMLElement | null; bi: HTMLElement | null; N: number; moc: MocCombo; chuoi: number; onSo: (them: number) => void }

/** Chạy hiệu ứng; trả hàm huỷ. Giảm chuyển động ⇒ không bay / không lắc (số đổi ngay ở phía gọi); rung máy mốc combo vẫn giữ. */
export function chayThuong(d: Dat, yen: boolean): () => void {
  const hoat: Animation[] = [], hen: number[] = [], nut: HTMLElement[] = []
  const sau = (ms: number, f: () => void) => { hen.push(window.setTimeout(f, ms)) }
  const ve = (e: Element | null, k: Keyframe[], o: KeyframeAnimationOptions) => { if (!e?.animate) return null; const a = e.animate(k, o); hoat.push(a); return a }
  if (d.moc) sau(120, () => phanHoi(d.moc === 10 ? 'combo10' : d.moc === 5 ? 'combo5' : 'combo3', Math.min(7, Math.max(0, d.chuoi - 3))))
  if (yen) { if (d.N > 0) d.onSo(d.N); return () => { for (const t of hen) window.clearTimeout(t) } }

  const nay = () => ve(d.dem, [{ transform: 'scale(1)' }, { transform: 'scale(1.2)' }, { transform: 'scale(1)' }], { duration: 200, easing: 'ease-out' })
  const hinh = d.dem?.querySelector('svg')
  const so = d.N <= 0 || !hinh ? 0 : d.moc ? Math.min(6, 3 + (d.moc === 3 ? 1 : d.moc === 5 ? 2 : 3)) : d.chuoi >= 3 ? 4 : 3
  // phần số cộng ở hạt thứ i (cộng đủ N khi hạt cuối chạm)
  const phan = (i: number) => Math.round((d.N * (i + 1)) / so) - Math.round((d.N * i) / so)
  const taoHat = (x: number, y: number) => {
    const h = document.createElement('span')
    h.className = 'duo-hat'; h.setAttribute('aria-hidden', 'true')
    h.append(hinh!.cloneNode(true))
    h.style.transform = `translate(${x - 11}px, ${y - 11}px)`
    document.body.append(h); nut.push(h)
    return h
  }
  // bay theo đường cong bậc hai (điểm điều khiển cao hơn cả hai đầu)
  const bay = (h: HTMLElement, a: readonly [number, number], b: readonly [number, number], tre: number, ms: number, xoay: number, co = 0.55) => {
    const cx = a[0] + (b[0] - a[0]) * 0.25, cy = Math.min(a[1], b[1]) - 110
    const k: Keyframe[] = []
    for (let s = 0; s <= 6; s++) {
      const t = s / 6, u = 1 - t
      const x = u * u * a[0] + 2 * u * t * cx + t * t * b[0], y = u * u * a[1] + 2 * u * t * cy + t * t * b[1]
      k.push({ transform: `translate(${x - 11}px, ${y - 11}px) rotate(${xoay * t}deg) scale(${1 - (1 - co) * t})`, opacity: s === 0 ? 0 : 1 })
    }
    return ve(h, k, { duration: ms, delay: tre, easing: 'cubic-bezier(.45,0,.55,1)', fill: 'both' })
  }
  const cham = (i: number, h: HTMLElement) => { h.remove(); d.onSo(phan(i)); nay(); phanHoi('chon') }

  if (!d.moc) {
    if (!so || !d.tu || !d.dem) return huy
    // dải trượt xong (~260 ms) + 150 ms ⇒ bay; 3–4 hạt so le 60 ms, mỗi hạt 520 ms ⇒ tổng < 900 ms
    sau(380, () => {
      const a = tam(d.tu!), b = tam(d.dem!)
      for (let i = 0; i < so; i++) {
        const h = taoHat(a[0] + (i - so / 2) * 10, a[1])
        const an = bay(h, [a[0] + (i - so / 2) * 10, a[1]], b, i * 60, 520, (i % 2 ? -1 : 1) * 70)
        if (an) an.onfinish = () => cham(i, h); else cham(i, h)
      }
    })
    return huy
  }

  // ── MỐC COMBO ──
  const A = d.moc === 10 ? 7 : d.moc === 5 ? 5 : 3, q = d.moc === 10 ? 0.6 : 0
  sau(120, () => {
    ve(d.goc, [0, A, -A, A * 0.7, -A * 0.7, A * 0.35, 0].map((x, i) => ({ transform: `translate(${x}px, ${i % 2 ? -x * 0.4 : x * 0.3}px) rotate(${i % 2 ? q : -q}deg)` })), { duration: 350, easing: 'ease-out' })
    const loe = document.createElement('div'); loe.className = 'duo-loe-mep'; loe.setAttribute('aria-hidden', 'true'); document.body.append(loe); nut.push(loe)
    ve(loe, [{ opacity: 0 }, { opacity: 1, offset: 0.25 }, { opacity: 0 }], { duration: 450, easing: 'ease-out', fill: 'both' })
  })
  if (!d.bi) return huy
  // Bi bay vụt vào từ mép phải (150 ms → 430 ms)
  ve(d.bi, [{ transform: 'translateX(24px) scale(.35) rotate(24deg)', opacity: 0 }, { transform: 'translateX(-8px) scale(1.06) rotate(-6deg)', opacity: 1, offset: 0.75 }, { transform: 'none', opacity: 1 }], { duration: 280, delay: 150, easing: 'ease-out', fill: 'both' })
  if (so && d.tu && d.dem) sau(380, () => {
    const a = tam(d.tu!), g = tam(d.bi!), b = tam(d.dem!)
    for (let i = 0; i < so; i++) {
      const x0 = a[0] + (i - so / 2) * 12
      const h = taoHat(x0, a[1])
      // gom vào người Bi (380 → ~760 ms) rồi bị ném lên bộ đếm (~900 → ~1 300 ms)
      const an = bay(h, [x0, a[1]], g, i * 40, 300, (i % 2 ? -1 : 1) * 90, 0.8)
      if (an) an.onfinish = () => { const nem = bay(h, g, b, 140 + i * 40, 380, (i % 2 ? 1 : -1) * 120, 0.55); if (nem) nem.onfinish = () => cham(i, h); else cham(i, h) }
      else cham(i, h)
    }
  })
  // ôm hạt ⇒ nhảy mừng (~780 ms), ném (~920 ms), rời màn (1 150 → 1 350 ms)
  sau(780, () => ve(d.bi, [{ transform: 'none' }, { transform: 'translateY(-16px) scale(1.08, .94)' }, { transform: 'translateY(0) scale(.96, 1.06)' }, { transform: 'none' }], { duration: 260, easing: 'ease-out' }))
  sau(1150, () => {
    const ra = ve(d.bi, [{ transform: 'none', opacity: 1 }, { transform: 'translateX(24px) scale(.4) rotate(14deg)', opacity: 0 }], { duration: 220, easing: 'ease-in' })
    // xong ⇒ thôi giữ khung cuối: Bi về chỗ cũ với opacity 0 của CSS (không nằm ngoài mép màn)
    if (ra) ra.onfinish = () => { for (const a of hoat) if (a.effect && (a.effect as KeyframeEffect).target === d.bi) a.cancel(); d.bi!.style.display = 'none' }
  })
  return huy

  function huy() {
    for (const t of hen) window.clearTimeout(t)
    for (const a of hoat) { a.onfinish = null; try { a.cancel() } catch { /* đã xong */ } }
    for (const n of nut) n.remove()
  }
}
