// BỘ KIỂM «LỜI GIẢI KÍNH» — THUẦN (không IO): máy chủ dùng lúc nhận bản soạn, app dùng lúc vẽ (bản hỏng ⇒ không vẽ).
// Chuẩn = bản mẫu thầy chốt 02/11 (docs/ban-ve-loi-giai-0211/): đủ khối, khớp đáp án kho, không bịa lời thầy, không ký hiệu cấm.
// Trả `ket`: 'dat' (hiện được) · 'lech' (lệch đáp án kho / phép tính) · 'thieu' (thiếu khối chuẩn) · 'khong_kiem_duoc' (khuôn hỏng).
// Thần chú / câu thầy nói / mẹo KHÔNG có trong nguồn ⇒ chỉ BỎ khối đó (không đánh trượt cả bản) — máy chủ không tin chữ mô hình tự nhận là của thầy.
import { HINH_NHIP, MANH_TEN, MAU_LOP, PHIEN_BAN_KINH, type BanKinh, type CanhKinh, type CongKinh, type HayNham, type LyDoKinh, type NhipPhim, type PhanKinh, type PhepTinhKinh, type TheNho } from './kieu'
import { tinhBieuThuc } from '../loi-giai-kiem'
import type { BuocTinh, SoDo } from '../goi-y-cham/kieu'

type Obj = Record<string, unknown>
const laObj = (x: unknown): x is Obj => x !== null && typeof x === 'object' && !Array.isArray(x)
const s = (v: unknown, tran = 600): string => (typeof v === 'string' || typeof v === 'number' ? String(v).normalize('NFC').replace(/\s+/g, ' ').trim().slice(0, tran) : '')
const mang = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])

/** Thuật ngữ SGK 2018 cho chữ thầy nói (phụ đề tự động ghi chữ cũ). Không dùng nhìn-lùi (Safari < 16.4). */
const SGK: Record<string, string> = { axit: 'acid', 'bazơ': 'base', oxit: 'oxide', este: 'ester', ancol: 'alcohol', amin: 'amine', 'anđehit': 'aldehyde', 'andehit': 'aldehyde', xeton: 'ketone', lipit: 'lipid', polyme: 'polymer' }
const RE_SGK = new RegExp(`(^|[^\\p{L}])(${Object.keys(SGK).join('|')})(?=[^\\p{L}]|$)`, 'giu')
export const chuSgk = (t: string): string => t.replace(RE_SGK, (_m, a: string, w: string) => a + (w[0] === w[0]!.toUpperCase() ? SGK[w.toLowerCase()]!.replace(/^./, (c) => c.toUpperCase()) : SGK[w.toLowerCase()]!))

/** Chuẩn hoá để đối chiếu chữ nguồn (bỏ dấu câu cuối, khoảng trắng, hoa thường). */
export const chuanDoiChieu = (t: string): string => chuSgk(t.normalize('NFC')).toLowerCase().replace(/[«»"“”'‘’]/g, '').replace(/[.!?…\s]+$/u, '').replace(/\s+/g, ' ').trim()

/** Chữ CẤM trên màn học sinh: dấu «» (thầy 02/11: in đậm thay), ẩn dụ tiền nhà (thầy 26/10 bỏ), độ bất bão hoà k (ngoài SGK KNTT), chữ AI. */
const RE_CAM: readonly [RegExp, string][] = [
  [/[«»]/u, 'có dấu «» (thầy: bỏ, in đậm thay)'],
  [/tiền(?! chất)|giàu|nghèo|thuế|nhà (?:thằng|bạn|giàu|nghèo)/iu, 'dùng ẩn dụ tiền / nhà (thầy đã bỏ)'],
  [/bất bão hoà|bất bão hòa|độ không no|\bk\s*=\s*\d/iu, 'dùng độ bất bão hoà k (ngoài SGK Kết nối tri thức)'],
  [/\bA\.?I\b|trí tuệ nhân tạo/u, 'có chữ AI'],
  [/<\/?(?!(?:b|i|sub|sup)>)[a-z][a-z0-9]*(?:\s[^<>]*)?>/iu, 'có thẻ HTML ngoài b/i/sub/sup'],
]
export function chuCam(ban: unknown): string | null {
  const chu = JSON.stringify(ban ?? '')
  for (const [re, ly] of RE_CAM) if (re.test(chu)) return ly
  return null
}

export interface NguonKinh {
  /** bảng thần chú của thầy (chữ in đậm của bảng) */
  thanChu: readonly string[]
  /** câu «Thầy nói» của các mục kiến thức ĐÃ GỬI cho máy soạn với câu này */
  thayNoi: readonly string[]
  /** «Mẹo» của các mục đó */
  meo: readonly string[]
}

export interface NguCanhKinh {
  phan: PhanKinh
  /** đáp án kho: «C» · «DSSD» · «13,2» */
  dapAn: string
  qid: string
  nguon: NguonKinh
  /** kiểm chuỗi phép tính (máy chủ cắm `kiemCong` của so-do-cong.ts); vắng ⇒ không kiểm số (app) */
  kiemSo?: (x: { soDo?: SoDo; buoc: BuocTinh[]; ketQua?: string }) => { ok: boolean; lyDo?: string }
  /** CÂU TỰ LUẬN (thầy 03/11 «câu tự luận giải luôn để lời giải hiện trên máy chiếu»): không có phương án / ý để khớp; `dapAn` = đáp số THAM CHIẾU của kho
   *  (đáp án / kết quả lời giải kho nếu là một số) hoặc rỗng. Mọi phép tính vẫn tính lại; có đáp số tham chiếu ⇒ mục `laDapSo` phải khớp. */
  tuLuan?: boolean
}

export interface KetQuaKiemKinh { ket: CongKinh; lyDo: string; ban: BanKinh | null; boKhoi: string[] }

const KHOA_I = ['A', 'B', 'C', 'D'], KHOA_II = ['a', 'b', 'c', 'd']

function docNhip(x: unknown): NhipPhim | null {
  if (!laObj(x)) return null
  const chu = s(x.chu, 200)
  if (!chu) return null
  const hinh = s(x.hinh, 20)
  return { chu, ...(s(x.phu, 200) ? { phu: s(x.phu, 200) } : {}), ...((HINH_NHIP as readonly string[]).includes(hinh) ? { hinh: hinh as NhipPhim['hinh'] } : {}) }
}

function docCanh(x: unknown): CanhKinh | null {
  if (!laObj(x)) return null
  if (x.loai === 'can-bang') {
    const tac = mang(x.tacDong).map((t) => laObj(t) && ['thuan', 'nghich', 'khong'].includes(String(t.chieu)) && s(t.nut, 40) && s(t.chu, 200)
      ? { nut: s(t.nut, 40), chieu: t.chieu as 'thuan' | 'nghich' | 'khong', chu: s(t.chu, 200) } : null)
    if (!s(x.trai, 80) || !s(x.phai, 80) || !tac.length || tac.length > 4 || tac.some((t) => !t)) return null
    return { loai: 'can-bang', trai: s(x.trai, 80), phai: s(x.phai, 80), ...(s(x.nhanTrai, 30) ? { nhanTrai: s(x.nhanTrai, 30) } : {}), ...(s(x.nhanPhai, 30) ? { nhanPhai: s(x.nhanPhai, 30) } : {}), tacDong: tac as never }
  }
  if (x.loai === 'ong-nghiem') {
    const buoc = mang(x.buoc).map((b) => {
      if (!laObj(b) || !s(b.chu, 200)) return null
      const lop = mang(b.lop).map((l) => laObj(l) && (MAU_LOP as readonly string[]).includes(String(l.mau)) ? { mau: l.mau as never, nhan: s(l.nhan, 30) } : null)
      if (!lop.length || lop.length > 2 || lop.some((l) => !l)) return null
      return { chu: s(b.chu, 200), lop: lop as never, ...(b.dun === true ? { dun: true } : {}), ...(b.khi === true ? { khi: true } : {}), ...(b.ketTua === true ? { ketTua: true } : {}) }
    })
    if (buoc.length < 2 || buoc.length > 5 || buoc.some((b) => !b)) return null
    return { loai: 'ong-nghiem', buoc: buoc as never }
  }
  if (x.loai === 'so-sanh') {
    const ve = (v: unknown) => (laObj(v) && s(v.ten, 60) ? { ten: s(v.ten, 60), y: mang(v.y).map((y) => s(y, 120)).filter(Boolean).slice(0, 4) } : null)
    const t = ve(x.trai), p = ve(x.phai)
    if (!t || !p || !t.y.length || !p.y.length) return null
    return { loai: 'so-sanh', trai: t, phai: p }
  }
  if (x.loai === 'dien-di') {
    const pH = Number(x.pH)
    const chat = mang(x.chat).map((c) => {
      if (!laObj(c) || !s(c.ten, 24)) return null
      const nhom = mang(c.nhom).map((g) => (laObj(g) && s(g.ten, 16) && Number.isInteger(g.dien) && Math.abs(Number(g.dien)) <= 2 ? { ten: s(g.ten, 16), dien: Number(g.dien) } : null))
      if (!nhom.length || nhom.length > 4 || nhom.some((g) => !g)) return null
      const pI = Number(c.pI)
      return { ten: s(c.ten, 24), ...(Number.isFinite(pI) && pI > 0 && pI < 14 ? { pI } : {}), nhom: nhom as { ten: string; dien: number }[] }
    })
    if (!Number.isFinite(pH) || pH < 0 || pH > 14 || !chat.length || chat.length > 3 || chat.some((c) => !c)) return null
    // pH < pI ⇒ tổng phải dương; pH > pI ⇒ tổng phải âm (luật thầy) — lệch ⇒ bỏ cảnh (không vẽ sai chiều).
    for (const c of chat) { const tong = c!.nhom.reduce((a, g) => a + g.dien, 0); if (c!.pI !== undefined && Math.abs(pH - c!.pI) > 0.3 && Math.sign(tong) !== (pH < c!.pI ? 1 : -1)) return null }
    return { loai: 'dien-di', pH, chat: chat as never }
  }
  if (x.loai === 'do-tan') {
    const Sds = mang(x.S).map((v) => (laObj(v) && Number.isFinite(Number(v.t)) && Number(v.S) > 0 ? { t: Number(v.t), S: Number(v.S) } : null))
    const hang = mang(x.hang).map((h) => (laObj(h) && s(h.nhan, 60) && Number(h.ct) >= 0 && Number(h.nuoc) >= 0 && Number(h.ct) + Number(h.nuoc) > 0
      ? { nhan: s(h.nhan, 60), ct: Number(h.ct), nuoc: Number(h.nuoc), ...(Number.isFinite(Number(h.baoHoa)) && h.baoHoa !== undefined && h.baoHoa !== null ? { baoHoa: Number(h.baoHoa) } : {}), ...(h.tachRa === true ? { tachRa: true } : {}) } : null))
    if (!s(x.chat, 30) || !Sds.length || Sds.length > 3 || Sds.some((v) => !v) || !hang.length || hang.length > 4 || hang.some((h) => !h)) return null
    const gan = (a: number, b: number) => Math.abs(a - b) <= Math.max(0.05, 0.01 * Math.abs(b))
    // hàng bão hoà ở t ⇒ ct/nước·100 = S(t); có hàng «tách ra» ⇒ hàng đầu = tách ra + còn lại (bảo toàn chất tan, bảo toàn nước)
    for (const h of hang) if (h!.baoHoa !== undefined) { const sv = Sds.find((v) => v!.t === h!.baoHoa); if (!sv || !h!.nuoc || !gan((h!.ct / h!.nuoc) * 100, sv.S)) return null }
    const tach = hang.findIndex((h) => h!.tachRa)
    if (tach > 0 && hang.length === 3) { const [a, b, c] = tach === 1 ? [hang[0]!, hang[1]!, hang[2]!] : [hang[0]!, hang[2]!, hang[1]!]; if (!gan(a.ct, b.ct + c.ct) || !gan(a.nuoc, b.nuoc + c.nuoc)) return null }
    return { loai: 'do-tan', chat: s(x.chat, 30), S: Sds as never, hang: hang as never }
  }
  if (x.loai === 'danh-phap') {
    const soC = Number.isInteger(x.soC) && Number(x.soC) >= 1 && Number(x.soC) <= 12 ? Number(x.soC) : undefined
    const trongMach = (v: unknown, tran: number) => Number.isInteger(v) && Number(v) >= 1 && Number(v) <= tran
    const nhom = (g: unknown) => (laObj(g) && s(g.ten, 16) && (!soC || trongMach(g.viTri, soC)) ? { viTri: Number(g.viTri) || 1, ten: s(g.ten, 16) } : null)
    const chuc = x.chuc === undefined || x.chuc === null ? undefined : nhom(x.chuc)
    const nhanh = mang(x.nhanh).map(nhom)
    const pi = mang(x.pi).map((q) => (laObj(q) && soC && trongMach(q.viTri, soC - 1) && (q.loai === 'doi' || q.loai === 'ba') ? { viTri: Number(q.viTri), loai: q.loai as 'doi' | 'ba' } : null))
    const manh = mang(x.manh).map((m) => (laObj(m) && (MANH_TEN as readonly string[]).includes(String(m.loai)) && typeof m.chu === 'string' && m.chu.trim() && s(m.giai, 220)
      ? { loai: m.loai as never, chu: String(m.chu).slice(0, 40), giai: s(m.giai, 220) } : null))
    const ten = s(x.ten, 80)
    const gon = (t: string) => t.normalize('NFC').toLowerCase().replace(/[\s ]+/g, '')
    if (x.chuc !== undefined && x.chuc !== null && !chuc) return null
    if (nhanh.some((g) => !g) || pi.some((q) => !q) || manh.length < 2 || manh.length > 5 || manh.some((m) => !m) || !ten || nhanh.length > 6) return null
    if (gon(manh.map((m) => m!.chu).join('')) !== gon(ten)) return null // tên = ghép đủ các mảnh
    return { loai: 'danh-phap', ...(soC ? { soC } : {}), ...(chuc ? { chuc } : {}), nhanh: nhanh as never, pi: pi as never, manh: manh as never, ten }
  }
  return null
}

function docSoDo(x: unknown): SoDo | undefined {
  if (!laObj(x)) return undefined
  const nut = mang(x.nut).map((n) => laObj(n) && s(n.chat, 60) ? { ...(s(n.tong, 60) ? { tong: s(n.tong, 60) } : {}), chat: s(n.chat, 60), soLieu: mang(n.soLieu).map((v) => s(v, 60)).filter(Boolean).slice(0, 6) } : null)
  if (nut.length < 2 || nut.length > 3 || nut.some((n) => !n)) return undefined
  const muiTen = mang(x.muiTen).map((m) => (laObj(m) && Number.isFinite(Number(m.H)) && Number(m.H) > 0 && Number(m.H) <= 100 ? { H: Number(m.H) } : {}))
  while (muiTen.length < nut.length - 1) muiTen.push({})
  return { nut: nut as SoDo['nut'], muiTen: muiTen.slice(0, nut.length - 1), chieu: x.chieu === 'nguoc' ? 'nguoc' : 'xuoi' }
}

function docBuoc(x: unknown): BuocTinh[] | undefined {
  const b = mang(x).map((v) => {
    if (!laObj(v)) return null
    const thuaSo = mang(v.thuaSo).map((t) => laObj(t) && s(t.so, 30) && s(t.nghia, 240) ? { so: s(t.so, 30), nghia: s(t.nghia, 240), ...(s(t.denDay, 160) ? { denDay: s(t.denDay, 160) } : {}) } : null)
    if (!s(v.ten, 60) || !thuaSo.length || thuaSo.some((t) => !t)) return null
    return { ten: s(v.ten, 60), thuaSo: thuaSo as BuocTinh['thuaSo'], ...(s(v.ketQua, 40) ? { ketQua: s(v.ketQua, 40) } : {}), ...(s(v.donVi, 20) ? { donVi: s(v.donVi, 20) } : {}) }
  })
  if (!b.length || b.length > 3 || b.some((x) => !x)) return undefined
  return b as BuocTinh[]
}

/** Đọc số kiểu Việt («13,2», «1.000,5», «2,5.10^-3») ⇒ number; không đọc được ⇒ null. */
export function docSoViet(raw: string): number | null {
  const t = raw.replace(/\s+/g, '').replace(/^\+(?=\d)/, '').replace(/[×x·]10\^?\(?(-?\d+)\)?/u, 'e$1').replace(/\.(?=\d{3}(?!\d))/g, '').replace(',', '.')
  const m = t.match(/^-?\d+(?:\.\d+)?(?:e-?\d+)?/)
  return m ? Number(m[0]) : null
}
/** Hai số khớp theo cách làm tròn của số ghi (`ghi`): lệch ≤ nửa đơn vị chữ số cuối, hoặc ≤ 0,5 %. */
export function khopLamTron(v: number, ghi: string): boolean {
  const d = docSoViet(ghi)
  if (d === null || !Number.isFinite(v)) return false
  const thapPhan = (ghi.split(/[eE×x]/)[0]!.split(',')[1] ?? '').replace(/\D/g, '').length
  return Math.abs(v - d) <= Math.max(0.5 * 10 ** -thapPhan + 1e-9 * Math.abs(d), 0.005 * Math.abs(d))
}
function docPhepTinh(x: unknown): PhepTinhKinh[] | undefined {
  const ds = mang(x).map((p) => laObj(p) && s(p.ten, 60) && s(p.bieuThuc, 200) && s(p.ketQua, 40)
    ? { ten: s(p.ten, 60), bieuThuc: s(p.bieuThuc, 200), ketQua: s(p.ketQua, 40), ...(p.laDapSo === true ? { laDapSo: true } : {}), ...(s(p.nghia, 200) ? { nghia: s(p.nghia, 200) } : {}) } : null)
  if (!ds.length || ds.length > 8 || ds.some((p) => !p)) return undefined
  return ds as PhepTinhKinh[]
}
/** Tính lại mọi phép tính; Phần III: mục `laDapSo` khớp đáp án kho. Lỗi ⇒ lý do. */
export function kiemPhepTinh(ds: readonly PhepTinhKinh[], phan: PhanKinh, dapAn: string): string | null {
  for (const p of ds) {
    let v: number
    try { v = tinhBieuThuc(p.bieuThuc) } catch { return `biểu thức «${p.ten}» không tính được` }
    if (!khopLamTron(v, p.ketQua)) return `«${p.ten}» tính lại ra ${v}, bản ghi ${p.ketQua}`
  }
  if (phan === 'III') {
    const cuoi = [...ds].reverse().find((p) => p.laDapSo)
    if (!cuoi) return 'thiếu phép tính ra đáp số'
    const v = tinhBieuThuc(cuoi.bieuThuc)
    if (!khopLamTron(v, dapAn)) return 'đáp số tính lại lệch đáp án kho'
  }
  return null
}

/** Đáp án kho ⇒ cờ đúng của từng khoá. Phần I: «C»; Phần II: «DSSD» (Đ = D). */
function dungTheoKho(phan: PhanKinh, dapAn: string): Map<string, boolean> | null {
  const d = dapAn.trim().toUpperCase().replace(/Đ/g, 'D')
  if (phan === 'I') return /^[A-D]$/.test(d) ? new Map(KHOA_I.map((k) => [k, k === d])) : null
  if (phan === 'II') return /^[DS]{4}$/.test(d) ? new Map(KHOA_II.map((k, i) => [k, d[i] === 'D'])) : null
  return null
}

/** Bản soạn THÔ (JSON mô hình) ⇒ bản sạch + kết quả cổng. */
export function kiemBanKinh(tho: unknown, ctx: NguCanhKinh): KetQuaKiemKinh {
  const boKhoi: string[] = []
  const hong = (ly: string): KetQuaKiemKinh => ({ ket: 'khong_kiem_duoc', lyDo: ly, ban: null, boKhoi })
  if (!laObj(tho)) return hong('không phải đối tượng JSON')
  const cl = laObj(tho.cotLoi) ? tho.cotLoi : {}
  const cotLoi = { chu: s(cl.chu, 260), ...(s(cl.congThuc, 80) ? { congThuc: s(cl.congThuc, 80) } : {}), chip: mang(cl.chip).map((c) => laObj(c) && s(c.nhan, 30) && s(c.chu, 90) ? { nhan: s(c.nhan, 30), chu: s(c.chu, 90) } : null).filter((c): c is { nhan: string; chu: string } => !!c).slice(0, 3) }
  const phim = mang(tho.phim).map(docNhip).filter((n): n is NhipPhim => !!n).slice(0, 6)
  const lyDo: LyDoKinh[] = mang(tho.lyDo).map((l) => laObj(l) && s(l.khoa, 2) && s(l.chu, 400) ? { khoa: s(l.khoa, 2), dung: l.dung === true, chu: s(l.chu, 400) } : null).filter((l): l is LyDoKinh => !!l)
  const hayNham: HayNham[] = mang(tho.hayNham).map((h) => laObj(h) && s(h.nghi, 220) && s(h.dung, 260) ? { nghi: s(h.nghi, 220), dung: s(h.dung, 260) } : null).filter((h): h is HayNham => !!h).slice(0, 3)
  const th = laObj(tho.tuHoi) ? tho.tuHoi : {}
  const tuHoi = { hoi: s(th.hoi, 220), tra: s(th.tra, 400) }
  const theNho: TheNho[] = mang(tho.theNho).map((t) => laObj(t) && s(t.truoc, 200) && s(t.sau, 220) ? { truoc: s(t.truoc, 200), sau: s(t.sau, 220), ...(s(t.viSao, 220) ? { viSao: s(t.viSao, 220) } : {}) } : null).filter((t): t is TheNho => !!t).slice(0, 4)
  // nguồn thầy: chỉ giữ chữ có trong nguồn
  const tcNguon = new Map(ctx.nguon.thanChu.map((t) => [chuanDoiChieu(t), t]))
  const thanChu = [...new Set(mang(tho.thanChu).map((t) => tcNguon.get(chuanDoiChieu(s(t, 160)))).filter((t): t is string => !!t))].slice(0, 3)
  if (mang(tho.thanChu).length > thanChu.length) boKhoi.push('thần chú không có trong bảng của thầy')
  const noiNguon = new Map(ctx.nguon.thayNoi.map((t) => [chuanDoiChieu(t), t]))
  const thayNoiTho = s(tho.thayNoi, 300)
  const thayNoiGoc = thayNoiTho ? noiNguon.get(chuanDoiChieu(thayNoiTho)) : undefined
  const thayNoi = thayNoiGoc ? chuSgk(thayNoiGoc) : undefined
  if (thayNoiTho && !thayNoi) boKhoi.push('câu thầy nói không có trong mục kiến thức')
  const meoNguon = new Map(ctx.nguon.meo.map((t) => [chuanDoiChieu(t), t]))
  const meoTho = s(tho.meo, 300)
  const meoGoc = meoTho ? meoNguon.get(chuanDoiChieu(meoTho)) : undefined
  const meo = meoGoc ? chuSgk(meoGoc) : undefined
  if (meoTho && !meo) boKhoi.push('mẹo không có trong mục kiến thức')
  const canhTho = tho.canh
  const canh = canhTho === undefined || canhTho === null ? null : docCanh(canhTho)
  if (canhTho && !canh) boKhoi.push('cảnh minh hoạ sai khuôn')
  const soDo = docSoDo(tho.soDo)
  const buoc = docBuoc(tho.buoc)
  const phepTinh = docPhepTinh(tho.phepTinh)
  const ban: BanKinh = {
    qid: ctx.qid, phienBan: PHIEN_BAN_KINH, phan: ctx.phan, cotLoi, phim, ...(canh ? { canh } : {}), thanChu,
    ...(thayNoi ? { thayNoi } : {}), ...(meo ? { meo } : {}), lyDo,
    ...(soDo ? { soDo } : {}), ...(buoc ? { buoc } : {}), ...(phepTinh ? { phepTinh } : {}), ...(s(tho.ketQua, 40) ? { ketQua: s(tho.ketQua, 40) } : {}),
    ...(s(tho.kiemLai, 260) ? { kiemLai: s(tho.kiemLai, 260) } : {}), hayNham, tuHoi, theNho,
  }
  // ---- đủ khối chuẩn bản mẫu
  const thieu: string[] = []
  if (!cotLoi.chu) thieu.push('kiến thức cốt lõi')
  if (phim.length < 3) thieu.push('phim ≥ 3 nhịp')
  if (!hayNham.length) thieu.push('chỗ hay nhầm')
  if (!tuHoi.hoi || !tuHoi.tra) thieu.push('câu tự trả lời')
  if (!theNho.length) thieu.push('thẻ nhớ')
  if (ctx.phan === 'III' && !ctx.tuLuan && !buoc && !phepTinh) thieu.push('phép tính có nghĩa từng số')
  if (ctx.tuLuan) { delete ban.buoc; delete ban.soDo; ban.lyDo = []; ban.tuLuan = true } // tự luận: chỉ phép tính có tên (tính lại được), không chuỗi khớp đáp án
  const cam = chuCam(ban)
  if (cam) return { ket: 'thieu', lyDo: cam, ban, boKhoi }
  if (thieu.length) return { ket: 'thieu', lyDo: `thiếu: ${thieu.join(', ')}`, ban, boKhoi }
  // ---- khớp đáp án kho
  const theoKho = dungTheoKho(ctx.phan, ctx.dapAn)
  if (ctx.tuLuan) {
    if (phepTinh) {
      const loi = kiemPhepTinh(phepTinh, ctx.dapAn && phepTinh.some((p) => p.laDapSo) ? 'III' : 'I', ctx.dapAn)
      if (loi) return { ket: 'lech', lyDo: loi, ban, boKhoi }
    }
    return { ket: 'dat', lyDo: '', ban, boKhoi }
  }
  if (ctx.phan === 'I' || ctx.phan === 'II') {
    if (!theoKho) return { ket: 'khong_kiem_duoc', lyDo: 'đáp án kho không đọc được', ban, boKhoi }
    const khoa = ctx.phan === 'I' ? KHOA_I : KHOA_II
    const gap = new Map(lyDo.map((l) => [l.khoa, l]))
    if (gap.size !== 4 || !khoa.every((k) => gap.has(k))) return { ket: 'thieu', lyDo: 'lý do chưa đủ bốn phương án / ý', ban, boKhoi }
    for (const k of khoa) if (gap.get(k)!.dung !== theoKho.get(k)) return { ket: 'lech', lyDo: `lý do ${k} lệch đáp án kho`, ban, boKhoi }
    ban.lyDo = khoa.map((k) => gap.get(k)!)
  } else if (lyDo.length) ban.lyDo = []
  if (phepTinh) {
    const loi = kiemPhepTinh(phepTinh, ctx.phan, ctx.dapAn)
    if (loi) return { ket: 'lech', lyDo: loi, ban, boKhoi }
  }
  if (buoc && ctx.kiemSo) {
    const k = ctx.kiemSo({ ...(soDo ? { soDo } : {}), buoc, ...(ban.ketQua ? { ketQua: ban.ketQua } : {}) })
    if (!k.ok) {
      // Phần III có phép tính tên đã khớp đáp số ⇒ bỏ chuỗi thừa số lỗi, giữ bản; còn lại ⇒ lệch
      if (ctx.phan === 'III' && phepTinh) { delete ban.buoc; delete ban.soDo; boKhoi.push('chuỗi thừa số không khớp, giữ phép tính có tên') }
      else return { ket: ctx.phan === 'III' ? 'lech' : 'thieu', lyDo: k.lyDo ?? 'phép tính không khớp đáp án kho', ban, boKhoi }
    }
  }
  return { ket: 'dat', lyDo: '', ban, boKhoi }
}

/** App: bản nhận từ máy chủ / gói dm còn dùng được (khuôn + đáp án đang chấm). Hỏng ⇒ null (màn hiện khung chờ, không vẽ bản lỗi). */
export function banKinhDungDuoc(x: unknown, phan: PhanKinh, dapAn: string): BanKinh | null {
  if (!laObj(x) || typeof x.qid !== 'string') return null
  const k = kiemBanKinh(x, { phan, dapAn, qid: x.qid, nguon: { thanChu: mang(x.thanChu).map((t) => s(t, 160)), thayNoi: x.thayNoi ? [s(x.thayNoi, 300)] : [], meo: x.meo ? [s(x.meo, 300)] : [] } })
  return k.ket === 'dat' ? k.ban : null
}

/** Chữ so khớp phương án / ý: bỏ thẻ, thực thể, khoảng trắng, hoa thường. */
const soKhop = (t: unknown) => String(t ?? '').replace(/<[^>]*>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').normalize('NFC').toLowerCase().replace(/[\s ]+/g, '').replace(/[.。]+$/, '')
/** Khớp lỏng: như soKhop nhưng bỏ mọi dấu câu (giữ chữ, số, + −, ngoặc không giữ). */
const soLong = (t: unknown) => soKhop(t).replace(/\.{2,}|…/g, '').replace(/[^\p{L}\p{N}+\-−]/gu, '')

/**
 * Bản (khoá theo CHỮ GỐC của kho, kèm `_goc` chữ phương án / ý lúc soạn) ⇒ bản theo ĐÚNG câu đã phát cho em (phương án / ý có thể bị xáo).
 * Không ghép được (chữ phương án đã đổi) hoặc lệch đáp án đang chấm ⇒ null (không hiện bản sai thứ tự).
 */
export function xepTheoCauPhat(tho: unknown, q: { phan: PhanKinh; choices?: readonly string[]; ideas?: readonly string[]; correct: string }): BanKinh | null {
  if (!laObj(tho)) return null
  const { _goc, ...ban } = tho as Obj & { _goc?: { pa?: Record<string, string> | null; y?: Record<string, string> | null } }
  const b = ban as unknown as BanKinh
  if (!Array.isArray(b.lyDo)) return null
  if (q.phan === 'III' || b.tuLuan) {
    if (!b.tuLuan && b.ketQua && !khopLamTron(docSoViet(b.ketQua) ?? NaN, q.correct)) return null
    return b
  }
  const khoa = q.phan === 'I' ? KHOA_I : KHOA_II
  const hien = (q.phan === 'I' ? q.choices : q.ideas) ?? []
  const goc = (q.phan === 'I' ? _goc?.pa : _goc?.y) ?? null
  const theoGoc = new Map(b.lyDo.map((l) => [l.khoa, l]))
  let lyDo: LyDoKinh[]
  let anLyDo = false
  if (goc && hien.length === 4) {
    // Ghép theo chữ: 1) khớp sát (bỏ thẻ, khoảng trắng); 2) khớp lỏng (bỏ cả dấu câu — máy em nhận chữ đã gọt «,», «,...», «.»: 03/11 quét ra 8 câu).
    const ghepTheo = (f: (t: unknown) => string) => {
      const ds = Object.entries(goc).map(([k, v]) => [f(v), k] as const)
      if (new Set(ds.map(([t]) => t)).size !== ds.length) return null
      const m = new Map(ds), g = hien.map((t) => m.get(f(t)))
      return g.some((k) => !k) || new Set(g).size !== 4 ? null : (g as string[])
    }
    const ghep = ghepTheo(soKhop) ?? ghepTheo(soLong)
    if (ghep) lyDo = ghep.map((k, i) => ({ ...theoGoc.get(k)!, khoa: khoa[i]! }))
    else {
      // Phương án trùng chữ (vd cả bốn «(xem hình)» — phương án là ảnh): không biết thứ tự đã xáo ⇒ chỉ nhận khi chữ hiện y hệt chữ gốc theo thứ tự
      // VÀ đáp án đang chấm khớp (kiểm ở dưới); khối «vì sao từng phương án» ẨN cho khỏi gắn nhầm lý do sang phương án khác.
      const gocTheoThuTu = khoa.map((k) => soLong(goc[k]))
      if (hien.some((t, i) => soLong(t) !== gocTheoThuTu[i])) return null
      lyDo = khoa.map((k) => theoGoc.get(k)!).filter(Boolean)
      anLyDo = true
    }
  } else lyDo = khoa.map((k) => theoGoc.get(k)!).filter(Boolean)
  if (lyDo.length !== 4) return null
  const d = dungTheoKho(q.phan, q.correct)
  if (!d || lyDo.some((l) => l.dung !== d.get(l.khoa))) return null
  return { ...b, lyDo: anLyDo ? [] : lyDo }
}
