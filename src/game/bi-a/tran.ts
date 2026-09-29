// BI-A PHẢN ỨNG · LÕI TRẬN ONLINE (GĐ2, đặc tả 6.2). Thuần TS, không hẹn giờ, không DOM — trạng thái là JSON lưu được.
// Phòng đấu (Durable Object `BanBiA`) dùng lõi này làm QUYỀN QUYẾT: mô phỏng lại mọi cú bằng `vat-ly` theo đúng một vòng bước chuẩn
// (`buocChuan`, kiểm dừng sau MỖI bước rồi chốt vận tốc/xoáy = 0) và áp luật `luat` y như ván với A.I (`dieu-khien.ts` GĐ1).
// Máy em chỉ vẽ trước đường bi bằng cùng `buocChuan` rồi KHỚP theo trạng thái phòng gửi — hai máy không bao giờ lệch nhau lâu hơn một cú.
import {
  AI_DUNG, DIEM_CHOT, DIEM_TRONG, GIAY_CU, MAT_THAN_TOI_DA, chiaBi, conLaiDoi, diemMuc, duocDanhTiep, hangMuc, tiepTheo, xetCu,
  type BangBi, type CheDo, type Doi, type Ghe, type KetQuaXet,
} from './luat'
import { CHOT, KL, PK, laKiHieu, type KiHieu } from './nguyen-to'
import { DIEM_DAU, R, VMAX, W, H, choHopLe, danhBiV, dangChay, datCho, datLaiChan, step, suKienMoi, xepBan, type Ban, type Bi, type Moc, type SuKienCu } from './vat-ly'

export type LoaiBan = 'ban' | 'giao_huu'
/** Câu của một bi (hoặc Câu chốt) của ghế người: mã câu, mức độ (tính điểm ván), giây làm (giữ lượt tối đa giây + 10). */
export interface CauBi { qid: string; muc: string; giay: number }
export interface GheTran extends Ghe { sbd: string | null; roi: boolean }
export interface ChoCau { ghe: number; ki: KiHieu; loai: 'bi' | 'chot'; han: number }
export interface KetThucTran { doiThang: Doi | null; nguoiHa: number | null; lyDo: 'thang' | 'bo' | 'roi_mang' | 'het_han' }
export interface TkTran { dung: number; sai: number; an: number; vang: number }
export interface TranBia {
  v: 1
  van: string
  cheDo: CheDo
  loai: LoaiBan
  seq: number
  /** [kí hiệu, x, y, còn trên bàn] theo đúng thứ tự `xepBan` (thứ tự ảnh hưởng thứ tự va chạm). */
  balls: [string, number, number, 0 | 1][]
  bi: BangBi
  /** Mức độ tính điểm của từng bi (bi của ghế người: mức câu thật; bi A.I: mức giả định). */
  muc: Partial<Record<KiHieu, string>>
  /** Câu thật của bi do ghế người giữ (chỉ phòng biết; máy em tự biết câu của mình). */
  cau: Partial<Record<KiHieu, CauBi>>
  chot: (CauBi | null)[]
  ghe: GheTran[]
  cur: number
  isBreak: boolean
  ballInHand: boolean
  diem: [number, number]
  matThan: number[]
  tk: TkTran[]
  cho: ChoCau[]
  ctx: { p: number; kq: KetQuaXet; ketQua: boolean[] } | null
  hanCu: number
  soCu: number
  khongElo: boolean
  over: KetThucTran | null
}
/** Gói "cú đánh" (đặc tả 6.2): gửi TỐC ĐỘ `v` (đã tính) thay cho lực để hai máy khỏi lệch vì làm tròn. */
export interface GoiCu { dx: number; dy: number; v: number; sx: number; sy: number; datBi?: { x: number; y: number } }
/** Tóm tắt một sự kiện để máy em hiện chữ/hiệu ứng (không cần suy luật lại). */
export type SuKienTran =
  | { k: 'cu'; ghe: number; cu: GoiCu; kq: KetQuaXet; phaBan: boolean; bamVa: string }
  | { k: 'cau'; ghe: number; ki: KiHieu; loai: 'bi' | 'chot'; dung: boolean; hetGio?: boolean }
  | { k: 'giai_truoc'; ghe: number; ki: KiHieu; dung: boolean }
  | { k: 'het_gio'; ghe: number }
  | { k: 'ghe_ai'; ghe: number; lyDo: 'roi_mang' | 'bo' }
  | { k: 'doi_cau'; ghe: number; ki: KiHieu }
  | { k: 'ket_thuc'; ket: KetThucTran }

export const GIAY_THEM_CAU = 10
export const GIAY_DEM_CU = 2
export const BUOC_TOI_DA = 240 * 12
const MUC_AI = ['TH', 'NB', 'VD', 'TH', 'NB', 'TH', 'VD'] as const

/** Số ngẫu nhiên có hạt giống (mulberry32) — cùng mã ván ⇒ cùng dãy số ở phòng và mọi máy. */
export function randHat(hat: string): () => number {
  let a = 2166136261 >>> 0
  for (let i = 0; i < hat.length; i++) { a ^= hat.charCodeAt(i); a = Math.imul(a, 16777619) >>> 0 }
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}

// ───────────── vật lý chuẩn (phòng và máy em dùng CHUNG) ─────────────
/** Một bước chuẩn: `step` rồi kiểm dừng NGAY; dừng ⇒ chốt v, ω = 0 cho mọi bi. Trả true khi đã dừng. */
export function buocChuan(st: Ban, ev: SuKienCu, hook: Moc | null): boolean {
  step(st, ev, hook)
  if (dangChay(st)) return false
  for (const b of st.balls) { b.vx = 0; b.vy = 0; b.wx = 0; b.wy = 0; b.wz = 0 }
  return true
}
/** Chạy hết một cú theo bước chuẩn (tối đa 12 giây mô phỏng). */
export function chayChuan(st: Ban, ev: SuKienCu, hook: Moc | null = null): number {
  let n = 0
  while (n < BUOC_TOI_DA) { n++; if (buocChuan(st, ev, hook)) return n }
  for (const b of st.balls) { b.vx = 0; b.vy = 0; b.wx = 0; b.wy = 0; b.wz = 0 }
  return n
}
export function banTu(balls: TranBia['balls']): Ban {
  return { balls: balls.map(([id, x, y, on]) => ({ id: id as Bi['id'], x, y, vx: 0, vy: 0, wx: 0, wy: 0, wz: 0, on: on === 1, q: [1, 0, 0, 0], ver: 0 })) }
}
export const ballsTu = (st: Ban): TranBia['balls'] => st.balls.map((b) => [b.id, b.x, b.y, b.on ? 1 : 0])
/** Băm VỊ TRÍ bi lúc vừa dừng (trước khi áp luật) — máy em so với bản vẽ trước của mình (đếm lệch vật lý giữa hai máy). */
export function bamVi(balls: TranBia['balls']): string {
  let h = 2166136261 >>> 0
  for (const [id, x, y, on] of balls) { const s = `${id}${x.toFixed(4)},${y.toFixed(4)},${on};`; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0 } }
  return h.toString(16)
}
/** Băm trạng thái công khai (vị trí 4 số lẻ, còn bàn, bi, lượt, điểm) — so phòng với máy em. */
export function bamTran(t: Pick<TranBia, 'balls' | 'bi' | 'cur' | 'diem'>): string {
  let h = 2166136261 >>> 0
  const tron = (s: string) => { for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0 } }
  for (const [id, x, y, on] of t.balls) tron(`${id}${x.toFixed(4)},${y.toFixed(4)},${on};`)
  for (const id of [...KL, ...PK, CHOT]) { const s = t.bi[id]; tron(`${id}${s.chu}${+s.an}${+s.vang}${+s.trong};`) }
  tron(`${t.cur}|${t.diem[0]}|${t.diem[1]}`)
  return h.toString(16)
}

// ───────────── tạo trận ─────────────
export interface DauVaoGhe { ten: string; ai: boolean; sbd: string | null; bi: Partial<Record<KiHieu, CauBi>>; chot: CauBi | null }
const tenNgan = (ten: string) => ten.trim().split(/\s+/).pop() || ten
const tenTat = (ten: string) => ten.trim().split(/\s+/).filter(Boolean).slice(-2).map((x) => x[0]!.toLocaleUpperCase('vi')).join('') || 'EM'
export function taoTran(o: { van: string; cheDo: CheDo; loai: LoaiBan; ghe: DauVaoGhe[]; now: number }): TranBia {
  const soGhe = o.cheDo === 'doi' ? 4 : 2
  if (o.ghe.length !== soGhe) throw new Error(`Bàn ${o.cheDo === 'doi' ? 'đánh đôi' : 'đấu đơn'} cần ${soGhe} ghế.`)
  const st = xepBan(randHat(o.van))
  const bi = chiaBi(o.cheDo)
  const muc: TranBia['muc'] = {}, cau: TranBia['cau'] = {}
  let m = 0
  const ghe: GheTran[] = o.ghe.map((g, i) => ({ ten: g.ten, ngan: o.cheDo === 'doi' ? tenNgan(g.ten) : g.ten, tat: g.ai ? `A${i + 1}` : tenTat(g.ten), ai: g.ai, doi: (i % 2) as Doi, sbd: g.ai ? null : g.sbd, roi: false }))
  const chot: (CauBi | null)[] = []
  o.ghe.forEach((g, s) => {
    for (const id of [...KL, ...PK]) {
      if (bi[id].chu !== s) continue
      if (o.loai === 'giao_huu') { bi[id].trong = true; continue }
      if (g.ai) { muc[id] = MUC_AI[m++ % MUC_AI.length]; continue }
      const c = g.bi[id]
      if (c) { cau[id] = c; muc[id] = c.muc } else bi[id].trong = true
    }
    chot.push(o.loai === 'giao_huu' ? null : g.ai ? { qid: '', muc: 'VD', giay: 0 } : g.chot)
  })
  return {
    v: 1, van: o.van, cheDo: o.cheDo, loai: o.loai, seq: 0, balls: ballsTu(st), bi, muc, cau, chot, ghe, cur: 0, isBreak: true, ballInHand: false,
    diem: [0, 0], matThan: ghe.map(() => 0), tk: ghe.map(() => ({ dung: 0, sai: 0, an: 0, vang: 0 })), cho: [], ctx: null,
    hanCu: o.now + (GIAY_CU + GIAY_DEM_CU) * 1000, soCu: 0, khongElo: o.loai !== 'ban' || ghe.some((g) => g.ai), over: null,
  }
}

// ───────────── tiện ích luật ─────────────
const chotTrong = (t: TranBia, s: number) => !t.chot[s]
const diemBi = (t: TranBia, id: KiHieu) => (t.bi[id].trong ? DIEM_TRONG : diemMuc(t.muc[id] ?? null))
function anBi(t: TranBia, id: KiHieu, s: number): void {
  t.bi[id].an = true
  t.diem[t.ghe[s]!.doi] += diemBi(t, id)
  t.tk[s]!.an++
}
function datLaiBi(st: Ban, id: KiHieu): void { const b = st.balls.find((x) => x.id === id); if (b) datLaiChan(st, b) }
function voi<T>(t: TranBia, f: (st: Ban) => T): T { const st = banTu(t.balls); const r = f(st); t.balls = ballsTu(st); return r }
function thang(t: TranBia, doi: Doi, p: number, lyDo: KetThucTran['lyDo'] = 'thang', congChot = true): void {
  if (congChot) t.diem[doi] += chotTrong(t, p) ? 0 : DIEM_CHOT
  t.over = { doiThang: doi, nguoiHa: lyDo === 'thang' ? p : null, lyDo }
  t.cho = []; t.ctx = null
}
function batDauLuot(t: TranBia, cur: number, datBiCai: boolean, now: number): void {
  t.cur = cur; t.ballInHand = datBiCai; t.cho = []; t.ctx = null
  t.hanCu = now + (GIAY_CU + GIAY_DEM_CU) * 1000
}
function hanCauDau(t: TranBia, now: number): void {
  const c = t.cho[0]
  if (!c) return
  const ghe = t.ghe[c.ghe]!
  const giay = ghe.ai ? 3 : (c.loai === 'chot' ? t.chot[c.ghe]?.giay : t.cau[c.ki]?.giay) ?? 90
  c.han = now + (giay + GIAY_THEM_CAU) * 1000
}
/** Xong hàng câu của cú (hết câu hoặc có câu sai): đánh tiếp hay sang lượt. */
function sauHang(t: TranBia, now: number): void {
  const x = t.ctx
  if (!x) return
  if (duocDanhTiep(x.kq, x.ketQua)) batDauLuot(t, x.p, false, now)
  else batDauLuot(t, tiepTheo(x.p, t.ghe.length), false, now)
}

// ───────────── áp sự kiện (phòng kiểm hợp lệ TRƯỚC khi áp; lỗi ⇒ ném Error có chữ cho em) ─────────────
export function apCu(t: TranBia, ghe: number, cu: GoiCu, now: number): SuKienTran {
  if (t.over) throw new Error('Ván đã kết thúc.')
  if (ghe !== t.cur) throw new Error('Chưa tới lượt ghế này.')
  if (t.cho.length) throw new Error('Đang chờ trả lời câu.')
  const d = Math.hypot(cu.dx, cu.dy)
  if (!(d > 0.5 && d < 1.5) || !(cu.v > 0 && cu.v <= VMAX + 1e-6) || ![cu.sx, cu.sy].every((x) => Number.isFinite(x) && Math.abs(x) <= 0.81)) throw new Error('Cú đánh không hợp lệ.')
  const g = t.ghe[ghe]!, doi = g.doi, phaBan = t.isBreak
  const shotCon = conLaiDoi(t.bi, doi)
  const ev = suKienMoi()
  const bamVa = voi(t, (st) => {
    const c = st.balls.find((b) => b.id === 'cue')!
    if (cu.datBi) {
      if (!t.ballInHand) throw new Error('Không được đặt bi cái.')
      const x = Math.max(R, Math.min(W - R, cu.datBi.x)), y = Math.max(R, Math.min(H - R, cu.datBi.y))
      if (!choHopLe(st, x, y, 'cue')) throw new Error('Chỗ đặt bi cái không hợp lệ.')
      c.x = x; c.y = y
    }
    danhBiV(c, cu.dx / d, cu.dy / d, cu.v, cu.sx, cu.sy)
    chayChuan(st, ev)
    return bamVi(ballsTu(st))
  })
  t.soCu++
  if (!g.ai && t.loai === 'ban' && t.matThan[ghe]! > 0) t.matThan[ghe]!-- // Mắt thần: mỗi cú của người dùng 1 (G4)
  t.isBreak = false; t.ballInHand = false
  const kq = xetCu(ev, ghe, t.ghe, t.bi, phaBan, shotCon, chotTrong(t, ghe))
  voi(t, (st) => {
    if (kq.maLoi) {
      kq.datLai.forEach((id) => datLaiBi(st, id))
      if (kq.datBiCai) { const c = st.balls.find((b) => b.id === 'cue')!; c.on = true; datCho(st, c, DIEM_DAU.x, DIEM_DAU.y) }
    } else kq.cuaBan.forEach((id) => datLaiBi(st, id))
  })
  if (kq.maLoi) { batDauLuot(t, tiepTheo(ghe, t.ghe.length), true, now); return { k: 'cu', ghe, cu, kq, phaBan, bamVa } }
  for (const id of kq.anNgay) anBi(t, id, t.bi[id].chu)
  if (kq.thangNgay) { thang(t, doi, ghe); return { k: 'cu', ghe, cu, kq, phaBan, bamVa } }
  t.ctx = { p: ghe, kq, ketQua: [] }
  t.cho = kq.hang.map((h) => ({ ghe: h.nguoiTL, ki: h.loai === 'chot' ? CHOT : h.id, loai: h.loai, han: 0 }))
  if (t.cho.length) hanCauDau(t, now)
  else sauHang(t, now)
  return { k: 'cu', ghe, cu, kq, phaBan, bamVa }
}
/** Kết quả câu đang chờ ở đầu hàng (ghế người: phòng đã đối chiếu `game_v2_attempt`; ghế A.I: máy chủ bàn quyết theo tỉ lệ G5). */
export function apCau(t: TranBia, ghe: number, ki: KiHieu, dung: boolean, now: number, hetGio = false): SuKienTran {
  const c = t.cho[0]
  if (t.over || !c || !t.ctx) throw new Error('Không có câu nào đang chờ.')
  if (c.ghe !== ghe || c.ki !== ki) throw new Error('Câu này không phải câu đang chờ.')
  const tk = t.tk[ghe]!, g = t.ghe[ghe]!
  if (dung) tk.dung++; else tk.sai++
  t.ctx.ketQua.push(dung)
  if (c.loai === 'chot') {
    if (dung) { if (!g.ai) t.matThan[ghe] = Math.min(MAT_THAN_TOI_DA, t.matThan[ghe]! + 1); thang(t, g.doi, t.ctx.p); return { k: 'cau', ghe, ki, loai: 'chot', dung, hetGio } }
    voi(t, (st) => datLaiBi(st, CHOT))
  } else if (dung) {
    anBi(t, ki, ghe)
    if (!g.ai) t.matThan[ghe] = Math.min(MAT_THAN_TOI_DA, t.matThan[ghe]! + 1)
  } else {
    voi(t, (st) => datLaiBi(st, ki))
    if (g.ai) t.muc[ki] = ['NB', 'TH', 'VD'][Math.floor(randHat(`${t.van}|${t.seq}|${ki}`)() * 3)]!
  }
  t.cho.shift()
  if (!dung) { // một câu sai là dừng (G13): bi còn chờ về chân bàn, lượt sang NGAY
    voi(t, (st) => { for (const r of t.cho) if (r.loai === 'bi') datLaiBi(st, r.ki) })
    t.cho = []
    sauHang(t, now)
  } else if (t.cho.length) hanCauDau(t, now)
  else sauHang(t, now)
  return { k: 'cau', ghe, ki, loai: c.loai, dung, hetGio }
}
/** Giải trước bi của mình khi người khác đang nhắm (đúng ⇒ bi vàng). */
export function apGiaiTruoc(t: TranBia, ghe: number, ki: KiHieu, dung: boolean): SuKienTran {
  const s = t.bi[ki]
  if (t.over || t.loai !== 'ban') throw new Error('Bàn này không giải trước.')
  if (ghe === t.cur || t.cho.length) throw new Error('Chỉ giải trước lúc người khác đang nhắm.')
  if (!laKiHieu(ki) || ki === CHOT || s.chu !== ghe || s.an || s.vang || s.trong) throw new Error('Bi này không giải trước được.')
  const tk = t.tk[ghe]!
  if (dung) { s.vang = true; tk.dung++; tk.vang++; if (!t.ghe[ghe]!.ai) t.matThan[ghe] = Math.min(MAT_THAN_TOI_DA, t.matThan[ghe]! + 1) }
  else { tk.sai++; if (t.ghe[ghe]!.ai) t.muc[ki] = ['NB', 'TH', 'VD'][Math.floor(randHat(`${t.van}|gt|${t.seq}|${ki}`)() * 3)]! }
  return { k: 'giai_truoc', ghe, ki, dung }
}
/** Câu thay sau câu sai (bia-doi-cau): phòng cập nhật câu + mức của bi (`null` ⇒ bi trống). */
export function apDoiCau(t: TranBia, ghe: number, ki: KiHieu, cau: CauBi | null): SuKienTran {
  if (ki === CHOT) { t.chot[ghe] = cau; return { k: 'doi_cau', ghe, ki } }
  if (t.bi[ki].chu !== ghe || t.ghe[ghe]!.ai) throw new Error('Bi này không phải của ghế gửi.')
  if (cau) { t.cau[ki] = cau; t.muc[ki] = cau.muc; t.bi[ki].doiCau++ } else { delete t.cau[ki]; t.bi[ki].trong = true }
  return { k: 'doi_cau', ghe, ki }
}
/** Hạn: hết 30 giây cú đánh ⇒ sang lượt (không phạm luật); câu quá giờ + 10 giây ⇒ tính sai. Trả sự kiện nếu có. */
export function apHan(t: TranBia, now: number): SuKienTran | null {
  if (t.over) return null
  const c = t.cho[0]
  if (c) return now >= c.han ? apCau(t, c.ghe, c.ki, false, now, true) : null
  if (now >= t.hanCu) { const g = t.cur; batDauLuot(t, tiepTheo(g, t.ghe.length), false, now); return { k: 'het_gio', ghe: g } }
  return null
}
/** Ghế chuyển cho A.I (G14): rớt mạng > 60 giây hoặc bỏ ván ở bàn đánh đôi. Ván thôi tính Điểm bàn. */
export function apGheAi(t: TranBia, ghe: number, lyDo: 'roi_mang' | 'bo'): SuKienTran {
  const g = t.ghe[ghe]!
  g.ai = true; g.roi = false; g.tat = `A${ghe + 1}`
  t.khongElo = true
  let m = 0
  for (const id of [...KL, ...PK]) if (t.bi[id].chu === ghe) { delete t.cau[id]; if (!t.bi[id].trong && !t.muc[id]) t.muc[id] = MUC_AI[m++ % MUC_AI.length] }
  if (t.loai === 'ban') t.chot[ghe] = { qid: '', muc: 'VD', giay: 0 }
  return { k: 'ghe_ai', ghe, lyDo }
}
/** Đấu đơn: người bỏ/rớt thua; đánh đôi: ghế chuyển A.I. */
export function apRoi(t: TranBia, ghe: number, lyDo: 'roi_mang' | 'bo'): SuKienTran {
  if (t.over) throw new Error('Ván đã kết thúc.')
  if (t.cheDo === 'don' || t.ghe.filter((g) => !g.ai).length <= 1) {
    const doi = (1 - t.ghe[ghe]!.doi) as Doi
    t.over = { doiThang: doi, nguoiHa: null, lyDo }; t.cho = []; t.ctx = null
    return { k: 'ket_thuc', ket: t.over }
  }
  return apGheAi(t, ghe, lyDo)
}
/** Ghế A.I trả lời câu đang chờ theo tỉ lệ G5 (máy chủ bàn gọi; phòng chỉ nhận từ máy chủ bàn). */
export const aiDung = (t: TranBia, ki: KiHieu, loai: 'bi' | 'chot', rand: () => number): boolean => rand() < (loai === 'chot' ? 0.7 : AI_DUNG[hangMuc(t.muc[ki] ?? null)])

// ───────────── công khai + Điểm bàn ─────────────
/** Trạng thái gửi mọi máy: KHÔNG có mã câu (`cau`, `chot`) — chỉ mức độ để hiện "đang giải bi Na · Thông hiểu". */
export type TranCongKhai = Omit<TranBia, 'cau' | 'chot' | 'ctx' | 'hanCu' | 'cho'> & { cho: (Omit<ChoCau, 'han'> & { conMs: number })[]; conCuMs: number; chotCo: boolean[]; bam: string }
export function congKhai(t: TranBia, now: number): TranCongKhai {
  const { cau: _c, chot, ctx: _x, hanCu, cho, ...r } = t
  return { ...r, cho: cho.map(({ han, ...c }) => ({ ...c, conMs: Math.max(0, han - now) })), conCuMs: Math.max(0, hanCu - now), chotCo: chot.map(Boolean), bam: bamTran(t) }
}
export const ELO_K = 24, ELO_DAU = 1000
/** Elo đội (đặc tả G7): kỳ vọng theo điểm trung bình hai phe; mọi người trong phe nhận cùng mức đổi. */
export function doiElo(phe0: readonly number[], phe1: readonly number[], doiThang: Doi): [number, number] {
  const tb = (a: readonly number[]) => a.reduce((s, x) => s + x, 0) / a.length
  const e0 = 1 / (1 + Math.pow(10, (tb(phe1) - tb(phe0)) / 400))
  const d0 = Math.round(ELO_K * ((doiThang === 0 ? 1 : 0) - e0))
  return [d0, -d0]
}
/** Kiểm nhanh một bi thường (không phải Bi chốt) — dùng khi đọc gói từ máy em. */
export const laBiThuong = (x: unknown): x is KiHieu => laKiHieu(x) && x !== CHOT
