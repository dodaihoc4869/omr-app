// XEM LẠI LIVE — DỰNG BUỔI (đặc tả docs/dac-ta-live-xem-lai-1011.md mục 4.3–4.7). THUẦN: không mạng, không đồng hồ, không R2 / D1 — máy chủ
// (server/src/live-xem-lai.ts) đọc nhật ký của phòng + phần đầu các khúc tiếng rồi gọi `dungBuoi`; cùng đầu vào ⇒ cùng đầu ra (chốt chạy lại được).
// Việc: (1) dựng TRỤC TIẾNG từ các khúc 10 giây (thiếu khúc ⇒ lấp khung câm đúng thời lượng; các lần tắt / bật live nối liền);
// (2) LUẬT AN TOÀN 7: câu CHƯA mở đáp án trong buổi ⇒ cả khoảng của câu bị cắt khỏi tiếng (theo khung MP3) và khỏi nét, không có thẻ câu, không có đoạn;
// (3) dựng `net.bin` (đúng hợp đồng xem-lai-kieu.ts: bản ghi xếp theo `t`, số thứ tự đánh lại 1..N; chỗ nối sau khoảng cắt / đầu mỗi lần live là một
//     ẢNH TRẠNG THÁI «bảng mới + các nét đang có» với giờ điểm = 0 ⇒ trình phát hiện ngay, không vẽ lại từng nét);
// (4) cắt đoạn, chọn đoạn đáng xem, đặt tên ⇒ `buoi.json` + các dòng `live_doan`.
import { ghiStt, MA_SO } from '../bpu/phong-live'
import type { NetBut } from '../but-bang-loi'
import { giaiSo, maBangMoi, maNetXong, type MucSo } from './ma-net'
import { apMuc, datLai, taoBang } from './so-net'
import { catDoan, chonDangXem, type LuotCat } from './xem-lai-cat'
import { MUC_MS, mucTuDb, type DauKhuc } from './xem-lai-khuc'
import { DAU_BAN_GHI_NET, ghiNetBin, type BangVangLive, type BuoiLiveJson, type CauBuoiLive, type DoanBuoiLive, type KhoangMs, type LyDoKhongDoan } from './xem-lai-kieu'
import { BYTE_MOI_KHUNG, MS_MOI_KHUNG } from './xem-lai-mp3'
import { tenBaiTuDong, tenDoan, tenGoi } from './xem-lai-ten'

/** Một dòng nhật ký sự kiện của phòng (giờ `t` = đồng hồ PHÒNG, ms). Thêm loại mới thì bộ dựng bỏ qua loại lạ. */
export interface SuKienXl {
  k: 'bat' | 'tat' | 'luot' | 'bo' | 'goi' | 'cham' | 'mo' | 'bang' | 'mic' | 'dh' | 'ghi'
  t: number
  so?: number
  /** `luot`: giờ bắt đầu lượt (phân biệt hai lượt trùng số). */
  bd?: number
  qid?: string
  sbd?: string
  v?: boolean
  dat?: boolean
  /** `dh`: giờ MÁY THẦY lúc gửi (ms) + mã phiên máy ghi ⇒ độ lệch đồng hồ = t − m. */
  m?: number
  p?: string
  tt?: string
}
/** Một bản ghi nhật ký nét của phòng: 0 = khung sổ nét thầy gửi lúc live · 1 = mốc «làm lại» (đầu mỗi lần bật live) · 2 = khung ẢNH sổ nét lúc bật live. */
export interface NetXl { loai: 0 | 1 | 2; luc: number; khung: Uint8Array }
/** Ảnh chụp một lượt (phòng giữ). `mo` vắng / true: chụp lúc MỞ ĐÁP ÁN (có đáp án + lời giải). `mo: false` (11/11): lượt CHƯA mở đáp án nhưng thầy đã gọi em
 *  lên bảng / bật bảng live — KHÔNG mang đáp án, KHÔNG mang lời giải (`dung` = '', `giai` = null); tỉ lệ lớp phòng chấm sẵn. */
export interface LuotChup {
  mo?: boolean
  so: number
  bd: number
  qid: string
  phan: 'I' | 'II' | 'III'
  tuLuan: boolean
  cau: Record<string, unknown>
  dung: string
  giai: CauBuoiLive['giai']
  soDung: number
  soGui: number
  goi: { sbd: string; dat: boolean | null } | null
}
export interface KhucVao { khoa: string; phien: string; stt: number; dau: DauKhuc }
export interface DauVaoDung {
  id: string
  ban: number
  lop: string
  suKien: readonly SuKienXl[]
  net: readonly NetXl[]
  khuc: readonly KhucVao[]
  luot: Readonly<Record<number, LuotChup>>
  ds: readonly { sbd: string; ten: string; doi: number }[]
  bangVang: BangVangLive | null
  /** Tên bài + tên dạng của từng câu, tra từ kho lúc chốt ('' = không tra được). */
  ten: Readonly<Record<string, { bai: string; dang: string }>>
  tenThay: string | null
  /** Giờ phòng lúc chốt (đóng lần live còn dang dở). */
  nay: number
}
/** Kế hoạch ghép `tieng.mp3`: theo thứ tự, mỗi mục là một khúc R2 (giữ các khoảng khung `giu`) hoặc `kh` khung câm. */
export type MucTieng = { loai: 'khuc'; khoa: string; giu: [number, number][] } | { loai: 'cam'; kh: number }
export interface DongDoanD1 {
  stt: number; loai: string; luot: number; qid: string; ten: string; sbd: string | null; dat: number | null
  t0: number; t1: number; giayCoTieng: number; soNet: number; tiLeDung: number | null; dangXem: number; lyDo: string | null
}
export interface KetQuaDung {
  /** false ⇒ buổi KHÔNG có đoạn xem lại (11/11: vẫn có dòng trong Lịch sử Live của thầy kèm lý do, máy em không thấy): live dưới 15 giây, chưa câu nào được chữa,
   *  không thu được tiếng và không có nét, hoặc phần chữa quá ngắn. `khong-live` = phòng chưa từng bật live (không có gì để ghi). */
  du: boolean
  lyDo: '' | 'khong-live' | LyDoKhongDoan
  /** Thời lượng live thật (mili-giây, trước khi cắt câu chưa chữa) — dòng «chưa có đoạn xem lại» của thầy hiện số này. */
  msTho: number
  buoi: BuoiLiveJson
  netBin: Uint8Array<ArrayBuffer>
  tieng: MucTieng[]
  doan: DongDoanD1[]
  /** Khoảng tiếng bị mất (thiếu khúc giữa chừng) trên trục tiếng — để ghi nhật ký. */
  matTieng: KhoangMs[]
}

/** 11/11 (thầy live thử 1 phút ⇒ «kết thúc live chưa thấy có bản ghi»): 120 giây → 15 giây. */
export const LIVE_TOI_THIEU_MS = 15_000
/** Buổi «có tiếng» khi có ít nhất một ô 0,5 giây từ −70 dBFS trở lên; mic câm cả buổi (mức 0) ⇒ coi như không có tiếng (không dựng `tieng.mp3`, đoạn tính theo nét). */
export const NGUONG_CO_AM = mucTuDb(-70)
const K = MS_MOI_KHUNG
const sanK = (ms: number): number => Math.floor(ms / K) * K
const tranK = (ms: number): number => Math.ceil(ms / K) * K
const ngayVn = (ms: number): string => new Date(ms + 7 * 3_600_000).toISOString().slice(0, 10)
const tucThi = (n: NetBut): NetBut => ({ ...n, diem: n.diem.map((p) => [p[0], p[1], p[2], 0]) })

interface Manh { w0: number; w1: number; a0: number; kh: number; loai: 'khuc' | 'cam' | 'trong'; khoa?: string }

export function dungBuoi(v: DauVaoDung): KetQuaDung {
  const sk = v.suKien.map((e, i) => ({ e, i })).sort((a, b) => a.e.t - b.e.t || a.i - b.i).map((x) => x.e)

  // ── 1. Các lần live ──
  const khoang: [number, number][] = []
  { let mo: number | null = null
    for (const e of sk) { if (e.k === 'bat' && mo == null) mo = e.t; else if (e.k === 'tat' && mo != null) { if (e.t > mo) khoang.push([mo, e.t]); mo = null } }
    if (mo != null && v.nay > mo) khoang.push([mo, v.nay]) }

  // ── 2. Độ lệch đồng hồ máy thầy ⇒ đồng hồ phòng (nhỏ nhất của t − m: mẫu ít trễ mạng nhất) ──
  const lech = new Map<string, number>()
  let lechChung = Infinity
  for (const e of sk) if (e.k === 'dh' && typeof e.m === 'number' && Number.isFinite(e.m)) { const d = e.t - e.m, p = e.p ?? ''; lech.set(p, Math.min(lech.get(p) ?? Infinity, d)); lechChung = Math.min(lechChung, d) }
  const lechCua = (p: string): number => lech.get(p) ?? (Number.isFinite(lechChung) ? lechChung : 0)

  // ── 3. Trục tiếng THÔ: mảnh = khúc thật / khung câm lấp chỗ thiếu / khoảng không tiếng (buổi không mic) ──
  const coAm = v.khuc.some((c) => c.dau.muc.some((m) => m >= NGUONG_CO_AM))
  const khucTat = [...new Map(v.khuc.filter((c) => c.dau.kh > 0).map((c) => [c.khoa, c])).values()]
  const khuc = (coAm ? khucTat : [])
    .map((c) => ({ c, w0: c.dau.t0 + lechCua(c.phien), ms: c.dau.kh * K }))
    .sort((a, b) => a.w0 - b.w0 || (a.c.khoa < b.c.khoa ? -1 : 1))
  const daDung = new Set<string>()
  const trongKhoang = khoang.map(([b, e]) => khuc.filter((x) => x.w0 >= b - 3000 && x.w0 < e + 1000))
  const coTieng = trongKhoang.some((ds) => ds.length > 0)
  const manh: Manh[] = []
  let a = 0
  khoang.forEach(([b, e], i) => {
    if (!coTieng) { const kh = Math.max(1, Math.ceil((e - b) / K)); manh.push({ w0: b, w1: e, a0: a, kh, loai: 'trong' }); a += kh * K; return }
    let con = b
    const lap = (toi: number): void => { const kh = Math.round((toi - con) / K); if (kh >= 2) { manh.push({ w0: con, w1: toi, a0: a, kh, loai: 'cam' }); a += kh * K } }
    for (const x of trongKhoang[i]!) {
      if (daDung.has(x.c.khoa)) continue
      daDung.add(x.c.khoa)
      const dau = Math.max(x.w0, con)
      lap(dau)
      manh.push({ w0: dau, w1: dau + x.ms, a0: a, kh: x.c.dau.kh, loai: 'khuc', khoa: x.c.khoa }); a += x.ms
      con = dau + x.ms
    }
    if (e > con) lap(e)
  })
  const tongTho = a
  /** Giờ phòng ⇒ trục thô. Lúc live đang tắt ⇒ đầu mảnh kế tiếp. */
  const W2A = (w: number): number => {
    let lo = 0, hi = manh.length - 1, k = -1
    while (lo <= hi) { const g = (lo + hi) >> 1; if (manh[g]!.w0 <= w) { k = g; lo = g + 1 } else hi = g - 1 }
    if (k < 0) return 0
    const m = manh[k]!
    return w < m.w1 ? m.a0 + Math.min(w - m.w0, m.kh * K) : m.a0 + m.kh * K
  }
  const trongLive = (w: number): boolean => khoang.some(([b, e]) => w >= b && w <= e)

  // ── 4. Chương theo lượt (trục thô) + LUẬT AN TOÀN 7 ──
  // 11/11 (thầy: «kết thúc live chưa thấy có bản ghi» — thầy chữa trên bảng mà không bấm mở đáp án): câu vào trang xem lại khi ĐÃ MỞ ĐÁP ÁN (`mo`), HOẶC
  // khi thầy đã gọi em lên bảng / bảng live đã bật trong lúc câu ấy đang chiếu (`bang`). Câu `bang` mà chưa mở đáp án: KHÔNG mang đáp án, KHÔNG mang lời giải
  // (ép `dung` = '' và `giai` = null ngay tại đây, dù ảnh chụp có gì). Câu không `mo` cũng không `bang` ⇒ vẫn bị loại và cắt khỏi tiếng + nét như cũ.
  interface Chuong { so: number; bd: number; qid: string; w: number; wKet: number; a0: number; a1: number; mo: boolean; bang: boolean; bangSan: boolean; chup: LuotChup | null }
  /** Các khoảng bảng live đang bật (giờ phòng). */
  const bangBat: [number, number][] = []
  { let tu: number | null = null
    for (const e of sk) {
      if (e.k === 'bang' && e.v === true) { if (tu == null) tu = e.t }
      else if ((e.k === 'bang' && e.v === false) || e.k === 'tat') { if (tu != null && e.t > tu) bangBat.push([tu, e.t]); tu = null }
    }
    if (tu != null && v.nay > tu) bangBat.push([tu, v.nay]) }
  const chuong: Chuong[] = []
  for (const e of sk) {
    if (e.k !== 'luot' || typeof e.so !== 'number') continue
    const truoc = chuong[chuong.length - 1]
    if (truoc && truoc.so === e.so && truoc.bd === (e.bd ?? 0)) continue // phòng ghi lại lượt đang mở ở đầu mỗi lần bật live
    if (truoc) { truoc.wKet = e.t; truoc.a1 = W2A(e.t) }
    chuong.push({ so: e.so, bd: e.bd ?? 0, qid: e.qid ?? '', w: e.t, wKet: Infinity, a0: W2A(e.t), a1: tongTho, mo: false, bang: false, bangSan: false, chup: null })
  }
  for (const c of chuong) {
    const chup = v.luot[c.so], khop = !!chup && (chup.bd === c.bd || !chup.bd || !c.bd), ket = Math.min(c.wKet, v.nay)
    c.mo = khop && chup!.mo !== false && sk.some((e) => e.k === 'mo' && e.so === c.so && e.t >= c.w && e.t < c.wKet)
    c.bangSan = bangBat.some(([x, y]) => x <= c.w && y > c.w) && trongLive(c.w)
    c.bang = khop && !c.mo && (sk.some((e) => e.k === 'goi' && e.so === c.so && e.t >= c.w && e.t < c.wKet && trongLive(e.t)) || bangBat.some(([x, y]) => Math.min(y, ket) > Math.max(x, c.w)))
    c.chup = c.mo || c.bang ? chup! : null
  }
  const cat: [number, number][] = []
  for (const c of chuong) {
    if (c.mo || c.bang || !(c.a1 > c.a0)) continue
    const x = sanK(c.a0), y = Math.min(tongTho, tranK(c.a1)), cuoi = cat[cat.length - 1]
    if (cuoi && x <= cuoi[1]) cuoi[1] = Math.max(cuoi[1], y); else cat.push([x, y])
  }
  const trongCat = (t: number): boolean => cat.some(([x, y]) => t >= x && t < y)
  /** Trục thô ⇒ trục tiếng cuối (đã bỏ các khoảng cắt). Điểm nằm trong khoảng cắt ⇒ dồn về mép cắt. */
  const R2F = (t: number): number => { let tru = 0; for (const [x, y] of cat) { if (t >= y) tru += y - x; else if (t > x) tru += t - x } return Math.max(0, t - tru) }
  const msLive = R2F(tongTho)

  // ── 5. Kế hoạch ghép tiếng (cắt theo khung, không mã hoá lại) + khoảng mất tiếng ──
  const tieng: MucTieng[] = [], matTieng: KhoangMs[] = []
  if (coTieng) for (const m of manh) {
    const giu: [number, number][] = []
    let dau = -1
    for (let f = 0; f <= m.kh; f++) {
      const co = f < m.kh && !trongCat(m.a0 + f * K)
      if (co && dau < 0) dau = f
      if (!co && dau >= 0) { giu.push([dau, f]); dau = -1 }
    }
    const tong = giu.reduce((s, g) => s + g[1] - g[0], 0)
    if (!tong) continue
    if (m.loai === 'khuc') tieng.push({ loai: 'khuc', khoa: m.khoa!, giu })
    else { tieng.push({ loai: 'cam', kh: tong }); for (const [x, y] of giu) matTieng.push([R2F(m.a0 + x * K), R2F(m.a0 + y * K)]) }
  }
  const tongKhung = tieng.reduce((s, m) => s + (m.loai === 'cam' ? m.kh : m.giu.reduce((x, g) => x + g[1] - g[0], 0)), 0)

  // ── 6. Mức âm trên trục cuối ──
  const muc = new Uint8Array(Math.ceil(msLive / MUC_MS))
  const mocNet = new Map<string, number[]>()
  for (const c of khucTat) { const l = lechCua(c.phien); for (const [id, rel] of c.dau.net) { const ds = mocNet.get(id) ?? []; ds.push(c.dau.t0 + rel + l); mocNet.set(id, ds) } }
  for (const x of khuc) {
    if (!daDung.has(x.c.khoa)) continue
    const d = x.c.dau, l = lechCua(x.c.phien)
    d.muc.forEach((g, j) => { const t = W2A(d.tm + l + j * MUC_MS + MUC_MS / 2); if (trongCat(t)) return; const o = Math.floor(R2F(t) / MUC_MS); if (o < muc.length && g > muc[o]!) muc[o] = g })
  }

  // ── 7. Nhật ký nét ⇒ `net.bin` ──
  type Muc =
    | { loai: 'moc'; w: number; i: number }
    | { loai: 'ranh'; w: number; i: number }
    | { loai: 'anh'; w: number; i: number; m: MucSo }
    | { loai: 'khung'; w: number; luc: number; i: number; phan: { m: MucSo; khung: Uint8Array }[]; net: NetBut | null; vt: number | null; viet: boolean; ms: number }
  const ds: Muc[] = []
  { let ghep: { m: MucSo; khung: Uint8Array }[] = [], wTruoc = -Infinity, truocTucThi = false, lucTruoc = -Infinity
    v.net.forEach((r, i) => {
      if (r.loai === 1) { ds.push({ loai: 'moc', w: r.luc, i }); ghep = []; truocTucThi = true; lucTruoc = r.luc; return }
      const m = giaiSo(r.khung)
      if (!m) return
      if (r.loai === 2) { ds.push({ loai: 'anh', w: r.luc, i, m }); truocTucThi = true; lucTruoc = r.luc; return }
      if (m.k !== 'net') {
        const w = Math.max(r.luc, wTruoc); wTruoc = w
        ds.push({ loai: 'khung', w, luc: r.luc, i, phan: [{ m, khung: r.khung }], net: null, vt: null, viet: false, ms: 0 })
        truocTucThi = m.k === 'bang' || m.k === 'xoa-het'; lucTruoc = r.luc
        return
      }
      // nét nhiều khung: gom đủ rồi mới quyết giờ
      if (m.tu === 0) ghep = []
      else if (!ghep.length || ghep[0]!.m.k !== 'net' || (ghep[0]!.m as { net: NetBut }).net.id !== m.net.id) { ghep = []; return }
      ghep.push({ m, khung: r.khung })
      if (!m.het) return
      const phan = ghep; ghep = []
      const dau = phan[0]!.m as Extract<MucSo, { k: 'net' }>
      const net: NetBut = { ...dau.net, diem: phan.flatMap((p) => (p.m as Extract<MucSo, { k: 'net' }>).net.diem) }
      const ms = net.diem.length ? Math.max(0, net.diem[net.diem.length - 1]![3]) : 0
      // Nét thầy VỪA viết (vẽ dần theo giờ từng điểm) hay nét dựng lại tức thì (ảnh trạng thái, hoàn tác xoá)?
      let viet = false, bd = r.luc
      const moc = mocNet.get(net.id)
      if (dau.vt != null) viet = false
      else if (moc) {
        const gan = moc.reduce((x, y) => (Math.abs(y - (r.luc - ms)) < Math.abs(x - (r.luc - ms)) ? y : x), moc[0]!)
        if (gan >= r.luc - ms - 3000 && gan <= r.luc + 500) { viet = true; bd = Math.min(gan, r.luc) }
      } else if (!(truocTucThi && r.luc - lucTruoc <= 30)) { viet = true; bd = r.luc - ms }
      const w = Math.max(viet ? bd : r.luc, wTruoc); wTruoc = w
      ds.push({ loai: 'khung', w, luc: r.luc, i, phan, net, vt: dau.vt, viet, ms })
      truocTucThi = !viet; lucTruoc = r.luc
    }) }
  khoang.forEach(([b], i) => ds.push({ loai: 'ranh', w: b, i }))
  for (const c of chuong) if (!c.mo && !c.bang && c.a1 > c.a0 && Number.isFinite(c.wKet)) ds.push({ loai: 'ranh', w: c.wKet, i: c.so })
  const uuTien = (m: Muc): number => (m.loai === 'moc' || m.loai === 'anh' ? 0 : m.loai === 'ranh' ? 1 : 2)
  ds.sort((x, y) => x.w - y.w || uuTien(x) - uuTien(y) || x.i - y.i)

  const sim = taoBang(), an = new Set<string>()
  const ra: { t: number; khung: Uint8Array }[] = [], mocBang: { t: number; byte: number }[] = []
  const netViet: { t: number; ms: number }[] = []
  let stt = 0, byte = 0, ban = true, daPhat = false
  const phat = (t: number, k: Uint8Array): void => {
    const c = k.slice(); ghiStt(c, ++stt)
    if (c[0] === MA_SO.bangMoi || c[0] === MA_SO.xoaHet) mocBang.push({ t, byte })
    ra.push({ t, khung: c }); byte += DAU_BAN_GHI_NET + c.length
  }
  const ap = (m: MucSo): void => { apMuc(sim, { ...m, stt: sim.cuoi + 1 }); if (m.k === 'bang' || m.k === 'xoa-het') an.clear() }
  const chup = (t: number): void => {
    phat(t, maBangMoi(sim.trang, sim.tiLe))
    for (const n of sim.net) if (!an.has(n.id)) for (const k of maNetXong(tucThi(n))) phat(t, k)
    ban = false; daPhat = true
  }
  const giu = (w: number): boolean => trongLive(w) && !trongCat(W2A(w))
  let tCuoi = 0
  for (const m of ds) {
    if (m.loai === 'moc') { datLai(sim); an.clear(); ban = true; continue }
    if (m.loai === 'anh') { ap(m.m); ban = true; continue }
    if (m.loai === 'ranh') { if (giu(m.w) && (ban || !daPhat)) { tCuoi = Math.max(tCuoi, Math.round(R2F(W2A(m.w)))); chup(tCuoi) } continue }
    const duoc = giu(m.w)
    if (duoc && (ban || !daPhat)) { tCuoi = Math.max(tCuoi, Math.round(R2F(W2A(m.w)))); chup(tCuoi) }
    for (const p of m.phan) ap(p.m)
    if (!duoc) { ban = true; if (m.net && trongLive(m.w)) an.add(m.net.id); continue }
    const t = Math.max(tCuoi, Math.round(R2F(W2A(m.w)))); tCuoi = t
    if (m.net && !m.viet) { for (const k of maNetXong(tucThi(m.net), m.vt)) phat(t, k) }
    else for (const p of m.phan) phat(t, p.khung)
    if (m.net && m.viet) netViet.push({ t, ms: m.ms })
  }
  if (!daPhat) chup(0)
  const netBin = ghiNetBin(ra)

  // ── 8. Câu đã mở đáp án / đã chữa trên bảng + đoạn ──
  const tenEm = new Map(v.ds.map((e) => [e.sbd, e]))
  const mo = chuong.filter((c) => (c.mo || c.bang) && c.chup && R2F(c.a1) > R2F(c.a0))
  const cau: CauBuoiLive[] = mo.map((c, i) => {
    const ch = c.chup!, ten = v.ten[ch.qid], kin = !c.mo
    return { so: i + 1, luot: c.so, qid: ch.qid, phan: ch.phan, tuLuan: ch.tuLuan, dang: ten?.dang ?? '', bai: ten?.bai ?? '', cau: ch.cau, dung: kin ? '' : ch.dung, giai: kin ? null : ch.giai ?? null,
      soDung: ch.soDung, soGui: ch.soGui, t0: Math.round(R2F(c.a0)), t1: Math.round(R2F(c.a1)), ...(kin ? { moDapAn: false } : {}) }
  })
  const F = (w: number): number => Math.round(R2F(W2A(w)))
  const luotCat: LuotCat[] = mo.map((c, i) => {
    const trong = sk.filter((e) => e.so === c.so && e.t >= c.w && e.t < c.wKet)
    const goi = trong.filter((e) => e.k === 'goi' && typeof e.sbd === 'string').map((e) => ({ t: F(e.t), sbd: e.sbd!, w: e.t }))
    const moE = c.mo ? trong.find((e) => e.k === 'mo') : undefined
    const bangTay = sk.filter((e) => e.k === 'bang' && e.v === true && e.t >= c.w && e.t < c.wKet && trongLive(e.t) && !goi.some((g) => g.w <= e.t)).map((e) => F(e.t))
    // Câu chưa mở đáp án mà bảng live đã bật SẴN từ câu trước (thầy để bảng suốt buổi) ⇒ cửa «thầy chữa» mở từ đầu chương.
    if (!c.mo && c.bangSan && !goi.some((g) => g.w <= c.w)) bangTay.unshift(cau[i]!.t0)
    return { so: c.so, t0: cau[i]!.t0, t1: cau[i]!.t1, moDapAn: moE ? F(moE.t) : null, bangTay, goi: goi.map((g) => ({ t: g.t, sbd: g.sbd })) }
  })
  const ranh = khoang.slice(1).map(([b]) => F(b))
  const { doan: doanCat, lang } = catDoan({ msLive, luot: luotCat, ranh, net: netViet, muc, coTieng })
  const soCuaLuot = new Map(cau.map((c) => [c.luot, c]))
  const datCua = (so: number, sbd: string): boolean | null => {
    const c = mo.find((x) => x.so === so)!
    const cham = sk.filter((e) => e.k === 'cham' && e.so === so && e.sbd === sbd && e.t >= c.w && e.t < c.wKet).pop()
    if (cham && typeof cham.dat === 'boolean') return cham.dat
    return c.chup!.goi && c.chup!.goi.sbd === sbd ? c.chup!.goi.dat : null
  }
  const doanTho = doanCat.map((d, i) => ({ ...d, stt: i + 1, dat: d.sbd ? datCua(d.luot, d.sbd) : null }))
  const dangXem = chonDangXem(doanTho.map((d) => ({ stt: d.stt, luot: d.luot, loai: d.loai, dat: d.dat, t0: d.t0, t1: d.t1, soNet: d.soNet, giayCoTieng: d.giayCoTieng })),
    cau.map((c) => ({ luot: c.luot, soDung: c.soDung, soGui: c.soGui, tuLuan: c.tuLuan })))
  const doan: DoanBuoiLive[] = doanTho.map((d) => {
    const c = soCuaLuot.get(d.luot)!, e = d.sbd ? tenEm.get(d.sbd) : undefined
    return { stt: d.stt, loai: d.loai, cau: c.so, luot: d.luot, ten: tenDoan({ so: c.so, dang: c.dang, loai: d.loai, tenEm: d.sbd ? (e?.ten ?? d.sbd) : null, phan: d.phan }),
      lenBang: d.loai === 'len_bang' && d.sbd ? { sbd: d.sbd, ten: tenGoi(e?.ten ?? d.sbd), doi: e?.doi ?? 0, dat: d.dat } : null,
      t0: d.t0, t1: d.t1, giayCoTieng: d.giayCoTieng, soNet: d.soNet, dangXem: dangXem.get(d.stt)?.lyDo ?? null, phan: d.phan }
  })
  const dongD1: DongDoanD1[] = doan.map((d) => {
    const c = soCuaLuot.get(d.luot)!
    return { stt: d.stt, loai: d.loai, luot: d.luot, qid: c.qid, ten: d.ten, sbd: d.lenBang?.sbd ?? null, dat: d.lenBang?.dat == null ? null : d.lenBang.dat ? 1 : 0, t0: d.t0, t1: d.t1,
      giayCoTieng: d.giayCoTieng, soNet: d.soNet, tiLeDung: !c.tuLuan && c.soGui > 0 ? Math.round((c.soDung / c.soGui) * 1000) / 1000 : null, dangXem: d.dangXem ? 1 : 0, lyDo: d.dangXem }
  })

  // ── 9. Vạch em nói ──
  const emNoi: BuoiLiveJson['emNoi'] = []
  { const dangMo = new Map<string, number>()
    const dong = (sbd: string, w: number): void => {
      const tu = dangMo.get(sbd); dangMo.delete(sbd)
      if (tu == null) return
      const t0 = F(tu), t1 = F(w), e = tenEm.get(sbd)
      if (t1 - t0 >= 500) emNoi.push({ ten: tenGoi(e?.ten ?? sbd), doi: e ? e.doi : null, t0, t1 })
    }
    for (const e of sk) {
      if (e.k === 'mic' && typeof e.sbd === 'string') { if (e.v) { if (!dangMo.has(e.sbd)) dangMo.set(e.sbd, e.t) } else dong(e.sbd, e.t) }
      else if (e.k === 'tat') for (const s of [...dangMo.keys()]) dong(s, e.t)
    }
    for (const s of [...dangMo.keys()]) dong(s, v.nay) }

  const batLuc = khoang.length ? khoang[0]![0] : v.nay, tatLuc = khoang.length ? khoang[khoang.length - 1]![1] : null
  const buoi: BuoiLiveJson = {
    v: 1, id: v.id, ban: v.ban, ngay: ngayVn(batLuc), lop: v.lop, batLuc: new Date(batLuc).toISOString(), tatLuc: tatLuc == null ? null : new Date(tatLuc).toISOString(),
    tenTuDong: tenBaiTuDong(cau, v.lop), tenThay: v.tenThay, giayToi: /~t$/.test(sim.trang), coTieng,
    msLive: Math.round(msLive), msDoan: doan.reduce((s, d) => s + d.t1 - d.t0, 0), byteTieng: coTieng ? tongKhung * BYTE_MOI_KHUNG : 0, byteNet: netBin.length,
    cau, doan, lang, emNoi, mocBang, bangVang: v.bangVang,
  }
  // `ngan` tính trên thời lượng live THẬT (trước khi cắt câu chưa chữa) để lý do hiện cho thầy nói đúng việc đã xảy ra.
  const lyDo: KetQuaDung['lyDo'] = !khoang.length ? 'khong-live' : tongTho < LIVE_TOI_THIEU_MS ? 'ngan' : !cau.length ? 'khong-cau' : doan.length ? '' : !coTieng && !netViet.length ? 'khong-tieng-net' : 'khong-doan'
  return { du: !lyDo, lyDo, msTho: Math.round(tongTho), buoi, netBin, tieng: coTieng ? tieng : [], doan: dongD1, matTieng }
}
