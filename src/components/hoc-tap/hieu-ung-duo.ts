// HIỆU ỨNG THƯỞNG Ở TẤM KẾT QUẢ màn làm chặng Duo (thầy 27/10: «Cái nguyên tử trôi lên làm hiệu ứng cùng với cái dải xanh đó» · «Làm đúng nhiều câu liên tiếp
// có hiệu ứng rung chuyển màn hình và con linh vật gắp kinh nghiệm, rung siêu xịn như dolingo»). Chỉ transform / opacity (Web Animations), không chặn bấm,
// huỷ được bất cứ lúc nào (bấm «Tiếp tục» ⇒ huỷ ⇒ số nhảy thẳng tới số cuối). Số nguyên tử LẤY TỪ PHẢN HỒI MÁY CHỦ (`thuong`), không bịa.
//  LÀM LẠI 27/10 (thầy: «Hiệu ứng kinh nghiệm chạy chưa đẹp mắt và tinh tế. Làm lại cho ngon như Duolingo» · «sét đánh dọc màn hình rung lắc siêu xịn»):
//  - BỎ đường bay vòng cung của nhiều hạt từ dải lên góc màn. Mọi viên thưởng CHỈ bật cạnh bộ đếm ⚛ góc phải trên: viên «+N» (chữ đậm màu nguyên tử) bật
//    .6 → 1,1 → 1 (160 ms) rồi trôi lên 12 px, mờ dần (600 ms); thưởng chuỗi / làm nghiêm túc = viên thứ hai màu cam, bật sau 120 ms, chồng lệch nhẹ.
//    Bộ đếm: ⚛ xoay một vòng + nảy 1,15; số lăn từng chữ số (SoLan.tsx).
//  - (bản 27/10, nay thay bằng bộ chung — xem đoạn cuối) MỐC 3 · 5 · 10: SÉT đánh dọc màn (1 / 2 / 3 tia zigzag có nhánh, lõi sáng viền cam vàng, vẽ xuống 90 ms rồi chớp 2–3 lần ~350 ms; mốc 10 thêm tia lửa ở
//    chân tia) + màn loé vàng rất nhẹ + khung nội dung LẮC tắt dần (7 nhịp ~500 ms, 6 / 9 / 12 px, xoay 0,5 / 0,8 / 1,2°) trùng cú sét đầu + rung máy (nhịp
//    mạnh 120 ms đúng lúc sét) + tiếng sét nổ rồi chuông. Bi bay vào, gom 3–6 hạt ⚛ 20 px quanh người rồi ném lên bộ đếm (đường ngắn). Tổng ≤ 1,2 s.
//  - Giảm chuyển động: không sét, không lắc, không hạt — chỉ băng mốc + đổi số (rung / tiếng giữ). Máy yếu (html.may-yeu, ≤ 4 nhân, tiết kiệm dữ liệu):
//    bản nhẹ — 1 tia, lắc nửa biên độ, không tia lửa.
//  BỘ HIỆU ỨNG ĂN MỪNG (thầy chốt 02/11, src/lib/hieu-ung/): SÉT vẽ bằng bộ chung (`anMung('set')`, đúng nhịp bản trình diễn) và chỉ ở chuỗi 5 · 10 · 15 …
//    (mốc 3: băng chữ + chuông + Bi gom, không sét); câu được tính không phải mốc ⇒ nguyên tử bay từ thẻ vừa đúng vào bộ đếm (`anMung('nguyen-tu')`) rồi mới
//    bật viên «+N». Máy yếu chạy bản GỌN của bộ chung (không còn tắt hẳn); chỉ giảm chuyển động mới yên. Tiếng sét nổ ở bộ chung — mặc định tắt.
import { rung } from '../../lib/rung'
import { phat } from '../../lib/am-thanh'
import { anMung, anMungSanSang, kichSet, napAnMung } from '../../lib/hieu-ung'

export type MocCombo = 0 | 3 | 5 | 10
/** Mốc combo của chuỗi đúng liền n: 3, 5, 10 rồi mỗi 5 câu (15, 20 …, hiệu ứng như mốc 10). */
export const mocCombo = (n: number): MocCombo => (n === 3 ? 3 : n === 5 ? 5 : n >= 10 && n % 5 === 0 ? 10 : 0)
/** Chữ băng mốc: «3 câu đúng liền!» · «Phản ứng dây chuyền! ×5» · «10 câu liền — huy hiệu mới!» · 15+: «Phản ứng dây chuyền! ×15». */
export const chuMoc = (n: number) => (n === 10 ? '10 câu liền — huy hiệu mới!' : n >= 5 ? `Phản ứng dây chuyền! ×${n}` : `${n} câu đúng liền!`)

const tam = (e: Element) => { const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2] as const }

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
  /** thẻ vừa đúng (sét đánh vào, nguyên tử bay ra) */ tu?: Element | null
  /** băng mốc «Phản ứng dây chuyền! ×5» (nảy lúc sét chạm) */ chu?: Element | null
  /** nguyên tử của câu (máy chủ) và phần thưởng chuỗi / làm nghiêm túc trong đó (viên cam) */ N: number; phu?: number
  moc: MocCombo; chuoi: number
  /** cộng `them` vào số trên bộ đếm (một lần, lúc viên bật) */ onSo: (them: number) => void
}

/** Chạy hiệu ứng; trả hàm huỷ. `yen` (giảm chuyển động) ⇒ đổi số ngay, không chuyển động (rung / tiếng mốc vẫn giữ). */
export function chayThuong(d: Dat, yen: boolean): () => void {
  const hoat: Animation[] = [], hen: number[] = [], nut: Element[] = [], huyAm: (() => void)[] = []
  const sau = (ms: number, f: () => void) => { hen.push(window.setTimeout(f, ms)) }
  const ve = (e: Element | null | undefined, k: Keyframe[], o: KeyframeAnimationOptions) => { if (!e?.animate) return null; const a = e.animate(k, o); hoat.push(a); return a }
  const nhe = mayYeu()
  if (d.moc) {
    const k = d.moc === 10 ? 'combo10' : d.moc === 5 ? 'combo5' : 'combo3'
    sau(60, () => rung(k))
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
  if (!d.moc) {
    // câu thường: nguyên tử bay từ thẻ vừa đúng vào bộ đếm, chạm xong mới bật viên «+N» (bộ chung). Không bay được (thiếu thẻ / bộ đếm, mảnh hiệu ứng
    // chưa nạp xong) ⇒ viên «+N» bật sau 220 ms như cũ — số không bao giờ phải chờ mạng.
    const tu = d.tu ?? d.day?.querySelector('.duo-tick') ?? null
    if (d.N > 0 && tu && d.dem && anMungSanSang()) huyAm.push(anMung('nguyen-tu', { tu, dich: d.dem, N: d.N, onXong: bat }))
    else { if (!anMungSanSang()) void napAnMung(); sau(220, bat) }
    return huy
  }

  // ── MỐC 5 · 10 · 15 …: sét đánh xuống thẻ vừa đúng (bộ chung: tối màn trừ dải kết quả, loé, rung khung nội dung, tia lửa, băng mốc nảy) ──
  if (kichSet(d.chuoi)) huyAm.push(anMung('set', { chuoi: d.chuoi, dich: d.tu, chu: d.chu, goc: d.goc, day: d.day }))

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
    for (const f of huyAm) f()
    for (const t of hen) window.clearTimeout(t)
    for (const a of hoat) { a.onfinish = null; try { a.cancel() } catch { /* đã xong */ } }
    for (const n of nut) n.remove()
  }
}
