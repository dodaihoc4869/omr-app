// BI-A PHẢN ỨNG · A.I ĐỖ ĐẠI HỌC (đặc tả 6.1). Dùng chính lõi vật lý: thử tối đa ~60 cú ứng viên (bóng bi ma theo từng bi của phe × 6 lỗ × 3 lực,
// cộng 5 cú nhắm thẳng), chấm điểm từng cú bằng mô phỏng thật, rồi nhiễu góc ±0,7°. Thuần (nhận `rand`) để test được.
import { CHOT, NHOM, doiCuaBi, type KiHieu } from './nguyen-to'
import { conLaiDoi, type BangBi, type Doi } from './luat'
import { DIEM_DAU, LO_NHAM, R, W, H, choHopLe, danhBi, dangChay, datCho, step, suKienMoi, type Ban, type Bi } from './vat-ly'

export interface CuAi { aim: { x: number; y: number }; p: number }
/** Bi phe `doi` nhắm được: bi chưa ăn còn trên bàn; ăn hết thì Bi chốt. */
export function dichCua(st: Ban, bi: BangBi, doi: Doi): Bi[] {
  const tim = (id: KiHieu) => st.balls.find((b) => b.id === id)
  if (conLaiDoi(bi, doi) > 0) return NHOM[doi]!.filter((id) => !bi[id].an).map(tim).filter((b): b is Bi => !!b && b.on)
  const c = tim(CHOT)
  return c && c.on ? [c] : []
}
const saoBan = (st: Ban): Ban => ({ balls: st.balls.map((b) => ({ ...b, q: [...b.q] as Bi['q'] })) })

/** Điểm một cú thử: mô phỏng tới khi dừng (tối đa 8 giây). */
export function aiCham(st: Ban, s: CuAi, doi: Doi, bi: BangBi, laPhaBan: boolean, rand: () => number = Math.random): number {
  const con = conLaiDoi(bi, doi)
  const thu = saoBan(st), ev = suKienMoi()
  const c = thu.balls.find((b) => b.id === 'cue')!
  danhBi(c, s.aim.x, s.aim.y, s.p, 0, 0)
  for (let i = 0; i < 240 * 8; i++) { step(thu, ev, null); if (i % 8 === 0 && !dangChay(thu)) break }
  let sc = 0, loi = false
  if (ev.cuePotted) { sc -= 300; loi = true }
  if (ev.firstHit === null) { sc -= 250; loi = true }
  else if (!laPhaBan) {
    if (ev.firstHit === CHOT) { if (con > 0) { sc -= 250; loi = true } }
    else if (doiCuaBi(ev.firstHit) !== doi) { sc -= 250; loi = true }
  }
  for (const id of ev.potted) {
    if (id === 'cue') continue
    if (id === CHOT) sc += (!loi && con === 0) ? 1500 : -500
    else if (doiCuaBi(id) === doi) sc += bi[id].vang ? 200 : 110
    else sc -= 90
  }
  const cu = thu.balls.find((b) => b.id === 'cue')!
  if (cu.on) sc -= Math.hypot(cu.x - W / 2, cu.y - H / 2) * 0.02
  return sc + rand() * 4
}

/** Chọn cú đánh cho phe `doi`. */
export function aiTinh(st: Ban, doi: Doi, bi: BangBi, laPhaBan: boolean, aimCu: { x: number; y: number }, rand: () => number = Math.random): CuAi {
  const c = st.balls.find((b) => b.id === 'cue')!
  const cands: { aim: { x: number; y: number }; pre: number }[] = []
  for (const t of dichCua(st, bi, doi)) for (const P of LO_NHAM) {
    const dx = P.x - t.x, dy = P.y - t.y, d = Math.hypot(dx, dy)
    if (d < 1) continue
    const ux = dx / d, uy = dy / d, gx = t.x - ux * 2 * R, gy = t.y - uy * 2 * R
    const ax = gx - c.x, ay = gy - c.y, ad = Math.hypot(ax, ay)
    if (ad < 2 * R) continue
    const aim = { x: ax / ad, y: ay / ad }, cut = aim.x * ux + aim.y * uy
    if (cut < 0.35) continue
    cands.push({ aim, pre: cut - d / 3000 - ad / 4000 })
  }
  cands.sort((a, b) => b.pre - a.pre)
  const thu: CuAi[] = []
  for (const k of cands.slice(0, 14)) for (const pw of [0.42, 0.68, 0.9]) thu.push({ aim: k.aim, p: pw })
  for (const t of dichCua(st, bi, doi).slice(0, 5)) { const ax = t.x - c.x, ay = t.y - c.y, ad = Math.hypot(ax, ay) || 1; thu.push({ aim: { x: ax / ad, y: ay / ad }, p: 0.62 }) }
  let best: CuAi | null = null, bs = -1e9
  for (const s of thu) { const sc = aiCham(st, s, doi, bi, laPhaBan, rand); if (sc > bs) { bs = sc; best = s } }
  if (!best) best = { aim: aimCu, p: 0.5 }
  const e = (rand() - 0.5) * 0.024, ce = Math.cos(e), se = Math.sin(e)
  return { aim: { x: best.aim.x * ce - best.aim.y * se, y: best.aim.x * se + best.aim.y * ce }, p: best.p }
}

/** Được đặt bi cái: thử 2 khoảng cách sau bóng bi ma của từng bi × lỗ; không có chỗ tốt thì đặt ở đầu bàn. Đặt thẳng vào `st`. */
export function aiDatBi(st: Ban, doi: Doi, bi: BangBi, laPhaBan: boolean, rand: () => number = Math.random): void {
  const c = st.balls.find((b) => b.id === 'cue')!
  const ox = c.x, oy = c.y
  let best: { x: number; y: number } | null = null, bs = -1e9
  for (const t of dichCua(st, bi, doi)) for (const P of LO_NHAM) {
    const dx = P.x - t.x, dy = P.y - t.y, d = Math.hypot(dx, dy)
    if (d < 1) continue
    const ux = dx / d, uy = dy / d, gx = t.x - ux * 2 * R, gy = t.y - uy * 2 * R
    for (const k of [120, 190]) {
      const px = gx - ux * k, py = gy - uy * k
      if (!choHopLe(st, px, py, 'cue')) continue
      c.x = px; c.y = py
      const sc = aiCham(st, { aim: { x: ux, y: uy }, p: 0.5 }, doi, bi, laPhaBan, rand)
      if (sc > bs) { bs = sc; best = { x: px, y: py } }
    }
  }
  c.x = ox; c.y = oy
  if (best) { c.x = best.x; c.y = best.y } else datCho(st, c, DIEM_DAU.x, DIEM_DAU.y)
}
