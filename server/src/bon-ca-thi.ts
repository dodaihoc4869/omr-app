// HÔM NAY · 4 BẢNG v3 — CA THI THẬT + LÊN BẢNG theo TỪNG ĐƠN VỊ KIẾN THỨC (thầy 02/11: «Làm luôn với ca thi thật rồi đếm lại, lấy yếu tố đó làm chính, tính
// từng câu từng đơn vị kiến thức để ra chỉ số chính xác nhất, thêm phần lên bảng đạt và chưa đạt nữa. Hai cái đó là thật nhất để đánh giá học sinh.»).
// LÕI THUẦN (không đọc D1 — bon-chi-so-d1.ts nạp; bon-chi-so.ts dùng kết quả làm HAI YẾU TỐ CHÍNH của bảng Học thật / Đối phó).
//
// ĐƠN VỊ KIẾN THỨC = CHUYÊN ĐỀ của câu (khoá `khoaDv`): tra theo qid GỐC trong chỉ mục kho `cau_meta.chuyen_de` ⇒ thiếu thì `su_kien_hoc.chuyen_de` của dòng
// (ca thi / lên bảng ghi sẵn) ⇒ thiếu nữa thì cầu nối mã dạng → chuyên đề (dạng của câu khác cùng em đã tra được) ⇒ vẫn thiếu: câu KHÔNG ghép (không đoán).
//
// SO TỪNG CẶP (ca thi × đơn vị): luyện tập của em ở ĐÚNG đơn vị ấy TRONG 35 NGÀY TRƯỚC giờ nộp ca (luyện SAU ca có thể là học từ lỗi — không tính).
//   · Lượt luyện tính: lượt thật (không lướt / đọc lời giải — lọc ở SQL), KHÔNG mở gợi ý / lời giải trước, KHÔNG treo máy, và chỉ LẦN ĐẦU gặp câu GỐC (làm lại
//     câu đã thấy đáp án = «đáp án có sẵn» ⇒ bỏ; câu song sinh = làm lại sau khi xem lời giải câu sai ⇒ bỏ khỏi phép so, vì ca thi là câu MỚI — đo trên mô phỏng:
//     tính song sinh làm kỳ vọng cao hơn thực tế ~5 điểm %). Lượt tra ngoài / dò đáp án VẪN tính: ca thi chính là thước lật điểm luyện bị thổi phồng.
//   · Dưới 6 lượt luyện ở đơn vị ⇒ «đơn vị chưa luyện», bỏ (không phạt). Có ≥ 6: năng lực luyện p̂ = (đúng + ½)/(làm + 1).
//   · HIỆU CHỈNH ĐỘ KHÓ (mô hình Rasch): θ = logit(p̂) − logit(độ khó trung bình câu luyện — tỉ lệ đúng cả lớp `pLop`, thiếu ⇒ 0,6); câu thi i có tỉ lệ đúng
//     cả lớp TRONG CA q_i (thiếu ⇒ theo mức độ: biết 0,8 · hiểu 0,65 · VD 0,45 · VDC 0,3 · không rõ 0,6) ⇒ kỳ vọng đúng e_i = σ(θ + logit q_i).
//   · Lệch = Σe − số câu thi đúng; phương sai = Σe(1−e) (câu thi) + (Σe(1−e))² / (n_luyện · p̂(1−p̂)) (sai số của chính p̂) ⇒ z.
// ĐƠN VỊ LỆCH: ≥ 3 câu thi, z ≥ 1,96, thấp hơn kỳ vọng ≥ 20 điểm %, luyện ≥ 60% («luyện cao mà thi thấp»). ĐƠN VỊ KHỚP: ≥ 2 câu thi, z < 1,28.
// GỘP mọi đơn vị đã ghép: z gộp ≥ 2,33 và thấp hơn ≥ 15 điểm % ⇒ lệch gộp có ý nghĩa. «Ca lệch» = ca có cặp thấp hơn kỳ vọng ≥ 1 câu, ≥ 20%, z ≥ 1,645.
//   «Lệch gộp BỀN» = vẫn lệch gộp (z ≥ 2,33, ≥ 15 điểm %) khi BỎ ca kém nhất — một ngày ốm / run không gánh nổi kết luận.
//   Họ Đối phó `lechCa`: 3 = ≥ 2 đơn vị lệch + ≥ 2 ca lệch + lệch gộp bền · 2 = ≥ 1 đơn vị lệch + ≥ 2 ca lệch + lệch gộp bền · 1 = ≥ 2 đơn vị lệch, hoặc lệch gộp,
//   hoặc 1 đơn vị lệch mà z gộp ≥ 1,645 (MỘT đơn vị lệch giữa nhiều đơn vị khớp = nhiễu so nhiều lần, không tính; MỘT ca kém — ốm, run — tối đa 1, không đủ xếp
//   Đối phó). Luyện gộp < 60% ⇒ 0 (yếu thật, không phải «luyện cao»).
//   Nhóm Học thật `ca` (ca thi khớp luyện tập): ≥ 6 câu thi đã ghép, ≥ 2 đơn vị khớp, 0 đơn vị lệch, z gộp ≤ 1,28.
// LÊN BẢNG (bảng `len_bang` + Kiểm tra đầu giờ `dau_gio`, cùng sổ `su_kien_hoc`): Đạt / Chưa đạt trong 60 ngày.
//   · «Chưa đạt ở phần luyện đúng nhiều»: Kiểm tra đầu giờ (thầy hỏi lại câu em ĐÃ làm đúng) luôn tính; Lên bảng tính khi trước đó em luyện đơn vị ấy ≥ 6 lượt
//     và đúng ≥ 70%, hoặc đã làm đúng chính câu ấy. Họ Đối phó `bangChua`: 2 = ≥ 3 lần và cận dưới Wilson ≥ 0,4 · 1 = ≥ 2 lần và ≥ một nửa. MỘT lần (run) ⇒ 0.
//   · Nhóm Học thật `bang`: Đạt ≥ 2 lần, cận dưới Wilson (Đạt / tổng) ≥ 0,4, không có `bangChua`. Điểm thành phần = (Đạt + 1,5) / (lần + 2) (co về 75% khi ít lần).
import { canDuoiWilson, type LuotDanhGia } from './danh-gia-hoc-that'

/** Cửa sổ ca thi + lên bảng (ngày TRỌN tới hết hôm qua, cùng mốc cuối với cửa sổ 14 ngày). v3b: 60 ngày (thầy «đánh giá trọn vẹn mọi học sinh» ⇒ ít em
 *  thiếu ca thi hơn). */
export const SO_NGAY_CA = 60
/** Luyện tập được so với một ca: trong ngần này ngày TRƯỚC giờ nộp ca. */
export const NGAY_LUYEN_TRUOC = 35
/** Luyện tập đọc lùi tối đa ngần này ngày trước đầu cửa sổ ca thi (luyện CŨ, gộp theo ngày × đơn vị). */
export const NGAY_LUYEN_TOI_DA = 60
/** Lượt luyện tối thiểu ở một đơn vị mới so (dưới ⇒ «đơn vị chưa luyện»). */
export const LUYEN_TOI_THIEU_DV = 6

/** Một câu của ca thi thật (sổ `su_kien_hoc`, nguon = 'thi'; bỏ trống = sai). `pLop` = tỉ lệ đúng cả lớp của câu TRONG CA (null khi < 5 em). */
export interface CauCaThi { ma: string; qid: string; ngay: string; luc: string; dv: string | null; mucDo: string; dung: boolean; pLop: number | null }
/** Một lần lên bảng: `len_bang` (thầy gọi lên bảng) hoặc `dau_gio` (Kiểm tra đầu giờ: hỏi lại câu em đã làm đúng). */
export interface LuotBang { qid: string; ngay: string; luc: string; dv: string | null; dat: boolean; loai: 'len_bang' | 'dau_gio' }
/** Luyện tập CŨ hơn cửa sổ 14 ngày, gộp theo (ngày, đơn vị): lần đầu gặp câu / song sinh, không hỗ trợ. */
export interface LuyenCuDv { ngay: string; dv: string; n: number; d: number }

export interface DauVaoCaThi { luyen: readonly LuotDanhGia[]; luyenCu: readonly LuyenCuDv[]; caThi: readonly CauCaThi[]; lenBang: readonly LuotBang[] }

export interface DonViCa {
  /** Tên hiển thị (chuyên đề). */
  ten: string
  kL: number; nL: number
  kT: number; nT: number
  /** Kỳ vọng đúng (tổng) theo năng lực luyện đã hiệu chỉnh độ khó. */
  eT: number
  z: number
  lech: boolean; khop: boolean
  luc: string
}
export interface KetQuaCaThi {
  /** Số câu ca thi trong cửa sổ (mọi đơn vị); số câu đã ghép được với luyện tập. */
  caCau: number
  N: number; K: number; E: number; z: number
  /** Đúng luyện tập gộp ở các đơn vị đã ghép (cặp gần nhất mỗi đơn vị). */
  kL: number; nL: number
  dv: DonViCa[]
  dvLech: number; dvKhop: number; caLech: number
  lechGop: boolean
  lechCa: 0 | 1 | 2 | 3
  caKhop: boolean
  /** Điểm thành phần Học thật 0–1 (null khi < 4 câu ghép). */
  caDiem: number | null
  /** `ds` mọi lần (cũ → mới); `lq` = lần ở phần em đã luyện đúng nhiều (Kiểm tra đầu giờ luôn thuộc). */
  bang: { tong: number; dat: number; lq: number; chuaLq: number; ds: LuotBang[]; dsLq: LuotBang[] }
  bangChua: 0 | 1 | 2
  bangDat: boolean
  bangDiem: number | null
}

/** Khoá so khớp của đơn vị kiến thức: chữ thường, gạch nối thống nhất, một dấu cách. Thuần. */
export const khoaDv = (s: string | null | undefined): string =>
  (s ?? '').normalize('NFC').toLowerCase().replace(/[‐-―−]/g, '-').replace(/\s*-\s*/g, ' - ').replace(/\s+/g, ' ').trim()
/** qid gốc (bỏ hậu tố song sinh `~ss3` / biến thể / lượt lặp `#2`). Thuần. */
export const qidGoc = (q: string): string => q.replace(/#\d+$/, '').replace(/~(?:ss|bt|yd)\d+$/, '')

/** Cận TRÊN Wilson (một phía). Thuần. */
export function canTrenWilson(k: number, n: number, z = 1.645): number {
  if (!(n > 0)) return 1
  const p = Math.min(1, Math.max(0, k / n)), z2 = z * z
  return Math.min(1, (p + z2 / (2 * n) + z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))) / (1 + z2 / n))
}

const kep = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x))
const lg = (p: number) => { const q = kep(p, 0.03, 0.97); return Math.log(q / (1 - q)) }
const sig = (x: number) => 1 / (1 + Math.exp(-x))
const truNgay = (ngay: string, n: number) => new Date(Date.parse(ngay + 'T00:00:00Z') - n * 86_400_000).toISOString().slice(0, 10)
/** Tỉ lệ đúng tiên nghiệm theo mức độ câu (khi ca quá ít em để đo tỉ lệ đúng cả lớp). */
export function doKhoMucDo(mucDo: string): number {
  const k = (mucDo ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/[_\s]+/g, ' ').trim()
  if (k === 'biet' || k === 'nhan biet' || k === 'nb') return 0.8
  if (k === 'hieu' || k === 'thong hieu' || k === 'th') return 0.65
  if (k === 'vdc' || k === 'van dung cao') return 0.3
  if (k === 'vd' || k === 'van dung') return 0.45
  return 0.6
}

interface MucLuyen { k: string; luc: string; ngay: string; dung: boolean; pLop: number | null; cau: string }

/** Lượt luyện được đem so: không gợi ý, không treo, LẦN ĐẦU gặp câu gốc (không song sinh, không làm lại), có đơn vị. Thuần. */
export function luotLuyenSo(luyen: readonly LuotDanhGia[]): MucLuyen[] {
  const da = new Set<string>()
  const ra: MucLuyen[] = []
  for (const l of [...luyen].sort((a, b) => (a.luc < b.luc ? -1 : a.luc > b.luc ? 1 : 0))) {
    const cau = l.cau ?? l.qid ?? ''
    const lanDau = !l.songSinh && (!cau || !da.has(cau))
    if (cau) da.add(cau)
    if (l.dung === null || l.coGoiY || l.treo || !lanDau || !l.dv) continue
    ra.push({ k: khoaDv(l.dv), luc: l.luc, ngay: l.ngay, dung: l.dung === true, pLop: l.pLop, cau })
  }
  return ra
}

/** Bảng tra luyện tập theo đơn vị (dùng chung cho phép so và chẩn đoán độ ghép). Thuần. */
function taoTraLuyen(v: DauVaoCaThi) {
  const luyen = luotLuyenSo(v.luyen)
  const cuTheo = new Map<string, LuyenCuDv[]>()
  for (const c of v.luyenCu) { const k = khoaDv(c.dv); if (k) cuTheo.set(k, [...(cuTheo.get(k) ?? []), c]) }
  const luyenTheo = new Map<string, MucLuyen[]>()
  for (const l of luyen) luyenTheo.set(l.k, [...(luyenTheo.get(l.k) ?? []), l])
  /** Luyện ở đơn vị `k` trước mốc (luc, ngay), trong `soNgay` ngày (mặc định NGAY_LUYEN_TRUOC). */
  const luyenTruoc = (k: string, luc: string, ngay: string, soNgay = NGAY_LUYEN_TRUOC) => {
    const tu = truNgay(ngay, soNgay)
    const moi = (luyenTheo.get(k) ?? []).filter((l) => l.luc < luc && l.ngay >= tu)
    const cu = (cuTheo.get(k) ?? []).filter((c) => c.ngay < ngay && c.ngay >= tu)
    const pl = moi.map((l) => l.pLop).filter((x): x is number => typeof x === 'number')
    return { n: moi.length + cu.reduce((s, c) => s + c.n, 0), d: moi.filter((l) => l.dung).length + cu.reduce((s, c) => s + c.d, 0), qBar: pl.length >= 3 ? pl.reduce((s, x) => s + x, 0) / pl.length : 0.6 }
  }
  /** Luyện ở đơn vị `k` SAU mốc (để chẩn đoán «chỉ luyện sau ca»). */
  const luyenSau = (k: string, luc: string, ngay: string) => (luyenTheo.get(k) ?? []).filter((l) => l.luc > luc).length + (cuTheo.get(k) ?? []).filter((c) => c.ngay > ngay).reduce((s, c) => s + c.n, 0)
  return { luyenTruoc, luyenSau, luyenTheo, cuTheo }
}
/** Nhóm câu ca thi theo cặp (ca × đơn vị); câu không có đơn vị bỏ ra ngoài. Thuần. */
function nhomCaDv(caThi: readonly CauCaThi[]): Map<string, CauCaThi[]> {
  const nhom = new Map<string, CauCaThi[]>()
  for (const c of caThi) { const k = khoaDv(c.dv); if (k) nhom.set(`${c.ma}\u0000${k}`, [...(nhom.get(`${c.ma}\u0000${k}`) ?? []), c]) }
  return nhom
}

/** Lý do một câu ca thi KHÔNG ghép được (chẩn đoán 02/11, chỉ số đếm). */
export type LyDoGhep = 'ghep' | 'thieuDv' | 'dvChuaLuyen' | 'chiLuyenSauCa' | 'luyenNgoai35' | 'du6Neu60' | 'locLanDau' | 'luyenIt'
/** CHẨN ĐOÁN ĐỘ GHÉP: mỗi câu ca thi ⇒ đúng MỘT lý do (ưu tiên theo thứ tự `LyDoGhep`), cùng luật cặp của `tinhCaThi`. Thuần — chỉ trả số đếm. */
export function chanDoanGhep(v: DauVaoCaThi): Record<LyDoGhep, number> {
  const ra: Record<LyDoGhep, number> = { ghep: 0, thieuDv: 0, dvChuaLuyen: 0, chiLuyenSauCa: 0, luyenNgoai35: 0, du6Neu60: 0, locLanDau: 0, luyenIt: 0 }
  const { luyenTruoc, luyenSau, cuTheo } = taoTraLuyen(v)
  ra.thieuDv = v.caThi.filter((c) => !khoaDv(c.dv)).length
  for (const [khoa, ds] of nhomCaDv(v.caThi)) {
    const k = khoa.split('\u0000')[1]!
    const luc = ds.map((c) => c.luc).sort()[0]!, ngay = ds.map((c) => c.ngay).sort()[0]!
    const l35 = luyenTruoc(k, luc, ngay)
    if (l35.n >= LUYEN_TOI_THIEU_DV) { ra.ghep += ds.length; continue }
    const l60 = luyenTruoc(k, luc, ngay, 60), truocHet = luyenTruoc(k, luc, ngay, 3650).n, sau = luyenSau(k, luc, ngay)
    // lượt THÔ (kể cả làm lại / song sinh / có gợi ý) trong 35 ngày: đo phần luật «lần đầu gặp câu gốc» lọc mất
    const tu = truNgay(ngay, NGAY_LUYEN_TRUOC)
    const tho = v.luyen.filter((l) => l.dung !== null && khoaDv(l.dv ?? null) === k && l.luc < luc && l.ngay >= tu).length
      + (cuTheo.get(k) ?? []).filter((c) => c.ngay < ngay && c.ngay >= tu).reduce((s, c) => s + c.n, 0)
    const ly: LyDoGhep = truocHet === 0 && sau === 0 && tho === 0 ? 'dvChuaLuyen' : truocHet === 0 && tho === 0 ? 'chiLuyenSauCa' : l35.n === 0 && l60.n > 0 ? 'luyenNgoai35'
      : l60.n >= LUYEN_TOI_THIEU_DV ? 'du6Neu60' : tho >= LUYEN_TOI_THIEU_DV ? 'locLanDau' : 'luyenIt'
    ra[ly] += ds.length
  }
  return ra
}

/** So luyện tập ↔ ca thi theo đơn vị + lên bảng. Thuần. */
export function tinhCaThi(v: DauVaoCaThi): KetQuaCaThi {
  const ten = new Map<string, string>()
  const datTen = (s: string | null) => { const k = khoaDv(s); if (k && !ten.has(k)) ten.set(k, (s ?? '').replace(/\s+/g, ' ').trim()) }
  for (const c of v.caThi) datTen(c.dv)
  for (const l of v.luyen) datTen(l.dv ?? null)
  for (const c of v.luyenCu) datTen(c.dv)
  const { luyenTruoc } = taoTraLuyen(v)

  // ── Cặp (ca, đơn vị)
  const nhom = nhomCaDv(v.caThi)
  interface Cap { ma: string; k: string; luc: string; kT: number; nT: number; e: number; vT: number; dE: number; nL: number; kL: number; p: number }
  const cap: Cap[] = []
  for (const [khoa, ds] of nhom) {
    const k = khoa.split('\u0000')[1]!
    const luc = ds.map((c) => c.luc).sort()[0]!, ngay = ds.map((c) => c.ngay).sort()[0]!
    const l = luyenTruoc(k, luc, ngay)
    if (l.n < LUYEN_TOI_THIEU_DV) continue
    const p = (l.d + 0.5) / (l.n + 1)
    const th = lg(p) - lg(kep(l.qBar, 0.1, 0.9))
    let e = 0, vT = 0
    for (const c of ds) { const ei = sig(th + lg(c.pLop ?? doKhoMucDo(c.mucDo))); e += ei; vT += ei * (1 - ei) }
    cap.push({ ma: ds[0]!.ma, k, luc, kT: ds.filter((c) => c.dung).length, nT: ds.length, e, vT, dE: vT, nL: l.n, kL: l.d, p })
  }
  // phương sai của một cặp: câu thi + sai số năng lực luyện (delta method trên logit)
  const varCap = (c: Cap) => c.vT + (c.dE * c.dE) / Math.max(1e-6, c.nL * c.p * (1 - c.p))
  const zCua = (e: number, k: number, va: number) => (va > 0 ? (e - k) / Math.sqrt(va) : 0)

  // ── Gộp theo đơn vị
  const dvMap = new Map<string, Cap[]>()
  for (const c of cap) dvMap.set(c.k, [...(dvMap.get(c.k) ?? []), c])
  const dv: DonViCa[] = []
  let kLg = 0, nLg = 0
  for (const [k, ds] of dvMap) {
    const kT = ds.reduce((s, c) => s + c.kT, 0), nT = ds.reduce((s, c) => s + c.nT, 0), e = ds.reduce((s, c) => s + c.e, 0), va = ds.reduce((s, c) => s + varCap(c), 0)
    const gan = [...ds].sort((a, b) => (a.luc < b.luc ? 1 : -1))[0]!
    const z = zCua(e, kT, va)
    const lech = nT >= 3 && z >= 1.96 && (e - kT) / nT >= 0.2 && gan.kL / gan.nL >= 0.6
    dv.push({ ten: ten.get(k) || k, kL: gan.kL, nL: gan.nL, kT, nT, eT: e, z, lech, khop: nT >= 2 && !lech && z < 1.28, luc: gan.luc })
    kLg += gan.kL; nLg += gan.nL
  }
  const N = cap.reduce((s, c) => s + c.nT, 0), K = cap.reduce((s, c) => s + c.kT, 0), E = cap.reduce((s, c) => s + c.e, 0), V = cap.reduce((s, c) => s + varCap(c), 0)
  const z = zCua(E, K, V)
  const luyenCao = nLg > 0 && kLg / nLg >= 0.6
  const lechGop = N >= 6 && z >= 2.33 && (E - K) / N >= 0.15
  const dvLech = dv.filter((d) => d.lech).length
  const dvKhop = dv.filter((d) => d.khop).length
  const caLech = new Set(cap.filter((c) => c.e - c.kT >= 1 && (c.e - c.kT) / c.nT >= 0.2 && zCua(c.e, c.kT, varCap(c)) >= 1.645).map((c) => c.ma)).size
  // bỏ ca có thiếu hụt (kỳ vọng − đúng) lớn nhất rồi xét lại lệch gộp
  const theoCa = new Map<string, { e: number; k: number; n: number; v: number }>()
  for (const c of cap) { const x = theoCa.get(c.ma) ?? { e: 0, k: 0, n: 0, v: 0 }; x.e += c.e; x.k += c.kT; x.n += c.nT; x.v += varCap(c); theoCa.set(c.ma, x) }
  const kemNhat = [...theoCa.values()].sort((a, b) => (b.e - b.k) - (a.e - a.k))[0]
  const Nb = N - (kemNhat?.n ?? 0), Kb = K - (kemNhat?.k ?? 0), Eb = E - (kemNhat?.e ?? 0), Vb = V - (kemNhat?.v ?? 0)
  const lechBen = lechGop && Nb >= 6 && zCua(Eb, Kb, Vb) >= 2.33 && (Eb - Kb) / Nb >= 0.15
  const lechCa: KetQuaCaThi['lechCa'] = !luyenCao ? 0
    : dvLech >= 2 && caLech >= 2 && lechBen ? 3
    : dvLech >= 1 && caLech >= 2 && lechBen ? 2
    : dvLech >= 2 || lechGop || (dvLech >= 1 && z >= 1.645) ? 1 : 0
  const caKhop = N >= 6 && dvKhop >= 2 && dvLech === 0 && z <= 1.28
  const caDiem = N >= 4 ? kep(1 - Math.max(0, z - 0.5) / 2.5, 0, 1) : null

  // ── Lên bảng
  const daDung = new Map<string, string>() // qid gốc → lúc đầu tiên em làm ĐÚNG ở luyện tập
  for (const l of [...v.luyen].sort((a, b) => (a.luc < b.luc ? -1 : 1))) if (l.dung === true) { const q = qidGoc(l.cau ?? l.qid ?? ''); if (q && !daDung.has(q)) daDung.set(q, l.luc) }
  const ds = [...v.lenBang].sort((a, b) => (a.luc < b.luc ? -1 : a.luc > b.luc ? 1 : 0))
  const dsLq: LuotBang[] = []
  for (const b of ds) {
    const k = khoaDv(b.dv)
    const l = k ? luyenTruoc(k, b.luc, b.ngay) : { n: 0, d: 0 }
    const cauDung = daDung.get(qidGoc(b.qid))
    const lienQuan = b.loai === 'dau_gio' || (l.n >= LUYEN_TOI_THIEU_DV && (l.d + 0.5) / (l.n + 1) >= 0.7) || (!!cauDung && cauDung < b.luc)
    if (lienQuan) dsLq.push(b)
  }
  const lq = dsLq.length, chuaLq = dsLq.filter((b) => !b.dat).length
  const dat = ds.filter((b) => b.dat).length
  const bangChua: KetQuaCaThi['bangChua'] = chuaLq >= 3 && canDuoiWilson(chuaLq, lq) >= 0.4 ? 2 : chuaLq >= 2 && chuaLq >= 0.5 * lq ? 1 : 0
  const bangDat = dat >= 2 && canDuoiWilson(dat, ds.length) >= 0.4 && bangChua === 0

  return {
    caCau: v.caThi.length, N, K, E, z, kL: kLg, nL: nLg,
    dv: dv.sort((a, b) => b.nT - a.nT || a.ten.localeCompare(b.ten, 'vi')),
    dvLech, dvKhop, caLech, lechGop, lechCa, caKhop, caDiem,
    bang: { tong: ds.length, dat, lq, chuaLq, ds, dsLq },
    bangChua, bangDat, bangDiem: ds.length >= 2 ? (dat + 1.5) / (ds.length + 2) : null,
  }
}
