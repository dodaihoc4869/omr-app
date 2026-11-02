// 4 BẢNG · HƯỚNG B — CHỐT CUỐI BẰNG TRÊN LỚP (thầy 02/11: «máy tự động làm hết, dựa chốt cuối cùng là bài kiểm tra trên lớp và gọi lên bảng, tuần nào cũng
// có kiểm tra trên lớp và gọi lên bảng … hiệu quả phải đạt 99% … 99% số liệu thật» · «Áp dụng mọi thứ tới cực hạn để làm ra bộ đo chất lượng nhất này»).
// LÕI THUẦN — không đọc D1. Đầu vào giống `bon-ca-thi.ts` (cùng luật lọc lượt luyện), thêm mã DẠNG để so mịn hơn chuyên đề.
//
// CÂU HỎI DUY NHẤT của trục chất lượng: «điểm luyện ở nhà (không giám sát) có THẬT không?» — kiểm bằng bài CÓ GIÁM SÁT (ca thi thầy mở có phòng chờ, gọi lên
// bảng, kiểm tra đầu giờ). Cách các kỳ thi lớn kiểm điểm làm tại nhà: bài kiểm lại có giám sát (unproctored → proctored verification).
//
// KIỂM ĐỊNH TUẦN TỰ (SPRT — Wald): mỗi câu trên lớp i có hai giả thuyết về xác suất đúng:
//   H0 (Học thật)  p0_i = σ(θ + logit q_i)          — đúng bằng mức luyện ở nhà (Rasch: θ = logit p̂_nhà − logit độ khó TB câu luyện; q_i = tỉ lệ đúng cả lớp
//                                                    của chính câu ấy trong ca, thiếu ⇒ theo mức độ) ⇒ ĐÃ tính câu trên lớp khó/dễ hơn.
//   H1 (Đối phó)   p1_i = σ(logit p0_i − Δ)         — trên lớp kém hẳn mức ở nhà (Δ = 1,6 logit ≈ 80% → 45%).
//   LLR = Σ log(P(kết quả | H1) / P(kết quả | H0)). Dương = nghiêng Đối phó, âm = nghiêng Học thật.
// Chốt: |LLR| ≥ ln((1−β)/α) = 4,6 với α = β = 1% ⇒ theo lý thuyết Wald, xác suất chốt nhầm ≤ 1% mỗi phía.
// BA LỚP AN TOÀN chống nhầm do mô hình không hoàn hảo (ốm, run, quên):
//   1. MỖI BUỔI tối đa ±2,3 (một buổi không tự chốt được) ⇒ phải ≥ 2 buổi khác nhau.
//   2. Đối phó: BỎ buổi nặng nhất vẫn còn ≥ 2,3 (một ngày ốm / run không gánh nổi kết luận). Học thật: tương tự về phía âm.
//   3. Chỉ dùng đơn vị đã luyện ≥ 6 lượt LẦN ĐẦU (không gợi ý, không song sinh, không treo) trong 35 ngày TRƯỚC buổi ⇒ không phạt dạng em chưa luyện.
// Đơn vị so: DẠNG (`ma_dang`) khi đủ 6 lượt, thiếu thì CHUYÊN ĐỀ — em giỏi «este» mà hỏng «đốt cháy este» không bị trộn.
// Lên bảng / đầu giờ: em từng làm ĐÚNG chính câu ấy ở nhà ⇒ H0 kỳ vọng ≥ 0,8 (đã tính quên); không thì theo đơn vị như câu thi.
//
// KIỂM ĐỊNH NGƯỢC (để đo «99% trên số liệu thật»): nhãn NIÊM PHONG chỉ từ các buổi TRƯỚC 2 buổi gần nhất; 2 buổi ấy (dữ liệu chưa dùng) tự chốt — ngược là SAI.
import { khoaDv, qidGoc, doKhoMucDo, NGAY_LUYEN_TRUOC, LUYEN_TOI_THIEU_DV, type CauCaThi, type LuotBang, type LuyenCuDv } from './bon-ca-thi'
import type { LuotDanhGia } from './danh-gia-hoc-that'

/** Độ lệch logit của giả thuyết Đối phó. */
export const DELTA_DP = 1.6
/** Ngưỡng chốt ±ln(0,99/0,01). */
export const NGUONG_CHOT = Math.log(0.99 / 0.01)
/** Trần đóng góp mỗi buổi (≈ tỉ số 10 : 1) ⇒ ít nhất 2 buổi mới chốt. */
export const TRAN_BUOI = 2.3

export type NhanLop = 'ht' | 'dp'

export interface BuoiLop {
  /** Khoá buổi: mã ca (thi) hoặc `bang:<ngày>` (lên bảng + đầu giờ cùng ngày là một buổi). */
  buoi: string
  ngay: string
  luc: string
  loai: 'thi' | 'bang'
  /** Số câu / lượt có tin · số đúng · kỳ vọng đúng theo H0 · LLR thô · LLR sau trần. */
  n: number
  k: number
  e0: number
  llrTho: number
  llr: number
  /** Đơn vị (tên) của câu lệch nặng nhất trong buổi — để làm ví dụ. */
  dvLech: string[]
}

export interface KetQuaTrenLop {
  /** Tổng LLR (sau trần từng buổi). */
  llr: number
  buoi: BuoiLop[]
  /** Số buổi có tin · số buổi nghiêng Đối phó (llr > 0,5) · nghiêng Học thật (llr < −0,5). */
  soBuoi: number
  buoiDp: number
  buoiHt: number
  /** Nhãn ĐÃ KIỂM TRÊN LỚP; null = chưa đủ chắc (nhãn tạm theo hành vi ở nhà). */
  nhan: NhanLop | null
  /** KIỂM ĐỊNH NGƯỢC: nhãn NIÊM PHONG từ các buổi TRƯỚC 2 buổi gần nhất · `sau` = 2 buổi gần nhất TỰ chốt (cùng luật, chỉ dữ liệu chưa dùng khi niêm phong):
   *  trùng nhãn niêm phong = xác nhận, NGƯỢC = SAI (đúng mô hình thì ≤ 1%), null = 2 buổi ấy chưa đủ chắc. Giữ HAI buổi vì một buổi (trần ±2,3) không bao giờ
   *  tự chốt được (ngưỡng 4,6) ⇒ thước một buổi luôn ra «0 lật», không đo được gì (soát 02/11). Cần ≥ 4 buổi có tin. */
  nguoc: { nhan: NhanLop | null; sau: NhanLop | null; llrSau: number; e0Sau: number; kSau: number; nSau: number } | null
}

const kep = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x))
const lg = (p: number) => { const q = kep(p, 0.02, 0.98); return Math.log(q / (1 - q)) }
const sig = (x: number) => 1 / (1 + Math.exp(-x))
const truNgay = (ngay: string, n: number) => new Date(Date.parse(ngay + 'T00:00:00Z') - n * 86_400_000).toISOString().slice(0, 10)
const khoaDg = (s: string | null | undefined) => (s ?? '').trim().toLowerCase()

interface MucNha { dv: string; dg: string; luc: string; ngay: string; dung: boolean; pLop: number | null }

/** Lượt luyện ở nhà đem so — cùng luật `luotLuyenSo` (bon-ca-thi.ts): không gợi ý, không treo, LẦN ĐẦU gặp câu gốc; giữ cả dạng. Thuần. */
export function luotNha(luyen: readonly LuotDanhGia[]): MucNha[] {
  const da = new Set<string>()
  const ra: MucNha[] = []
  for (const l of [...luyen].sort((a, b) => (a.luc < b.luc ? -1 : a.luc > b.luc ? 1 : 0))) {
    const cau = l.cau ?? l.qid ?? ''
    const lanDau = !l.songSinh && (!cau || !da.has(cau))
    if (cau) da.add(cau)
    if (l.dung === null || l.coGoiY || l.treo || !lanDau || (!l.dv && !l.dg)) continue
    ra.push({ dv: khoaDv(l.dv), dg: khoaDg(l.dg), luc: l.luc, ngay: l.ngay, dung: l.dung === true, pLop: l.pLop })
  }
  return ra
}

/** Gộp lượt lên bảng ghi đôi (02/11: 158/159 lượt thật có hai dòng cách ~0,85 giây): cùng câu · cùng kết quả · cùng loại trong 10 giây = MỘT lần. Thuần. */
export function boTrungBang(ds: readonly LuotBang[]): LuotBang[] {
  const sx = [...ds].sort((a, b) => (a.luc < b.luc ? -1 : a.luc > b.luc ? 1 : 0))
  const ra: LuotBang[] = []
  for (const b of sx) {
    const t = Date.parse(b.luc)
    const trung = ra.some((x) => x.qid === b.qid && x.dat === b.dat && x.loai === b.loai && khoaDv(x.dv) === khoaDv(b.dv)
      && Number.isFinite(t) && Math.abs(t - Date.parse(x.luc)) <= 10_000)
    if (!trung) ra.push(b)
  }
  return ra
}

export interface DauVaoTrenLop {
  luyen: readonly LuotDanhGia[]
  luyenCu: readonly LuyenCuDv[]
  caThi: readonly CauCaThi[]
  lenBang: readonly LuotBang[]
}

interface CauLop { buoi: string; ngay: string; luc: string; loai: 'thi' | 'bang'; dung: boolean; p0: number; dv: string }

/** Chuyển mọi câu trên lớp thành (p0, đúng) có tin. Câu không đủ luyện trước đó ⇒ bỏ (không phạt). Thuần. */
function cauCoTin(v: DauVaoTrenLop): CauLop[] {
  const nha = luotNha(v.luyen)
  const theoDv = new Map<string, MucNha[]>(), theoDg = new Map<string, MucNha[]>()
  for (const m of nha) {
    if (m.dv) theoDv.set(m.dv, [...(theoDv.get(m.dv) ?? []), m])
    if (m.dg) theoDg.set(m.dg, [...(theoDg.get(m.dg) ?? []), m])
  }
  const cuDv = new Map<string, LuyenCuDv[]>(), cuDg = new Map<string, LuyenCuDv[]>()
  for (const c of v.luyenCu) {
    const a = khoaDv(c.dv), b = khoaDg(c.dg)
    if (a) cuDv.set(a, [...(cuDv.get(a) ?? []), c])
    if (b) cuDg.set(b, [...(cuDg.get(b) ?? []), c])
  }
  // Câu em từng làm ĐÚNG ở nhà (qid gốc → lúc đầu tiên) — cho lên bảng / đầu giờ hỏi lại đúng câu ấy.
  const daDung = new Map<string, string>()
  for (const l of [...v.luyen].sort((a, b) => (a.luc < b.luc ? -1 : 1))) if (l.dung === true) { const q = qidGoc(l.cau ?? l.qid ?? ''); if (q && !daDung.has(q)) daDung.set(q, l.luc) }

  /** Năng lực ở nhà trước mốc: ưu tiên DẠNG (≥ 6 lượt), không thì CHUYÊN ĐỀ. */
  const nangLuc = (dv: string, dg: string, luc: string, ngay: string): { n: number; d: number; qBar: number } | null => {
    const tu = truNgay(ngay, NGAY_LUYEN_TRUOC)
    const dem = (moiDs: MucNha[] | undefined, cuDs: LuyenCuDv[] | undefined) => {
      const moi = (moiDs ?? []).filter((m) => m.luc < luc && m.ngay >= tu)
      const cu = (cuDs ?? []).filter((c) => c.ngay < ngay && c.ngay >= tu)
      const pl = moi.map((m) => m.pLop).filter((x): x is number => typeof x === 'number')
      return { n: moi.length + cu.reduce((s, c) => s + c.n, 0), d: moi.filter((m) => m.dung).length + cu.reduce((s, c) => s + c.d, 0), qBar: pl.length >= 3 ? pl.reduce((s, x) => s + x, 0) / pl.length : 0.6 }
    }
    if (dg) { const x = dem(theoDg.get(dg), cuDg.get(dg)); if (x.n >= LUYEN_TOI_THIEU_DV) return x }
    if (dv) { const x = dem(theoDv.get(dv), cuDv.get(dv)); if (x.n >= LUYEN_TOI_THIEU_DV) return x }
    return null
  }
  const p0Cua = (nl: { n: number; d: number; qBar: number }, q: number) => {
    const p = (nl.d + 1) / (nl.n + 2)
    return kep(sig(lg(p) - lg(kep(nl.qBar, 0.1, 0.9)) + lg(q)), 0.03, 0.97)
  }
  const ra: CauLop[] = []
  for (const c of v.caThi) {
    const dv = khoaDv(c.dv), dg = khoaDg(c.dg)
    const nl = nangLuc(dv, dg, c.luc, c.ngay)
    if (!nl) continue
    ra.push({ buoi: c.ma, ngay: c.ngay, luc: c.luc, loai: 'thi', dung: c.dung, p0: p0Cua(nl, c.pLop ?? doKhoMucDo(c.mucDo)), dv: c.dv ?? '' })
  }
  for (const b of boTrungBang(v.lenBang)) {
    const dv = khoaDv(b.dv), dg = khoaDg(b.dg)
    const dung = daDung.get(qidGoc(b.qid))
    const nl = nangLuc(dv, dg, b.luc, b.ngay)
    let p0: number | null = null
    // Câu đã làm đúng ở nhà (hoặc Kiểm tra đầu giờ — thầy hỏi lại câu em ĐÃ đúng): kỳ vọng ≥ 0,8 (đã trừ quên); có năng lực đơn vị thì lấy cái lớn hơn.
    if ((dung && dung < b.luc) || b.loai === 'dau_gio') p0 = Math.max(0.8, nl ? p0Cua(nl, 0.6) : 0)
    else if (nl) p0 = p0Cua(nl, 0.6)
    if (p0 === null) continue
    ra.push({ buoi: `bang:${b.ngay}`, ngay: b.ngay, luc: b.luc, loai: 'bang', dung: b.dat, p0: kep(p0, 0.03, 0.97), dv: b.dv ?? '' })
  }
  return ra
}

/** LLR một câu: log P(kết quả | Đối phó) − log P(kết quả | Học thật). Thuần. */
export function llrCau(dung: boolean, p0: number, delta = DELTA_DP): number {
  const p1 = sig(lg(p0) - delta)
  return dung ? Math.log(p1 / p0) : Math.log((1 - p1) / (1 - p0))
}

function gomBuoi(cau: readonly CauLop[]): BuoiLop[] {
  const m = new Map<string, CauLop[]>()
  for (const c of cau) m.set(c.buoi, [...(m.get(c.buoi) ?? []), c])
  const ra: BuoiLop[] = []
  for (const [buoi, ds] of m) {
    const llrTho = ds.reduce((s, c) => s + llrCau(c.dung, c.p0), 0)
    const lech = ds.filter((c) => !c.dung && c.p0 >= 0.6).sort((a, b) => b.p0 - a.p0)
    ra.push({
      buoi, ngay: ds.map((c) => c.ngay).sort()[0]!, luc: ds.map((c) => c.luc).sort()[0]!, loai: ds[0]!.loai,
      n: ds.length, k: ds.filter((c) => c.dung).length, e0: ds.reduce((s, c) => s + c.p0, 0),
      llrTho, llr: kep(llrTho, -TRAN_BUOI, TRAN_BUOI), dvLech: [...new Set(lech.map((c) => c.dv).filter(Boolean))].slice(0, 3),
    })
  }
  return ra.sort((a, b) => (a.luc < b.luc ? -1 : a.luc > b.luc ? 1 : 0))
}

/** Một chiều kiểm định đã vượt ngưỡng chưa: tổng ≥ ngưỡng, ≥ 2 buổi cùng chiều, bỏ buổi nặng nhất vẫn còn ≥ một trần. Thuần. */
function vuot(xs: readonly number[]): boolean {
  const tong = xs.reduce((s, x) => s + x, 0)
  return tong >= NGUONG_CHOT && xs.filter((x) => x > 0.5).length >= 2 && tong - Math.max(0, ...xs) >= TRAN_BUOI
}

/** Quyết định từ các buổi: H1 vượt ngưỡng ⇒ Đối phó (điểm nhà cao hơn năng lực thật khi bị giám sát); H0 vượt ngưỡng ⇒ Học thật (điểm nhà khớp trên lớp).
 *  Trên lớp CAO hơn ở nhà là dấu hiệu TỐT (thi tốt ít luyện, giỏi làm nhanh) — không bao giờ tính là Đối phó. Chọn vội / bấm lặp / treo máy làm điểm nhà THẤP
 *  hơn sức thật ⇒ đó là CÔNG SỨC (Lười «làm cho có»), không phải trục này. Thuần. */
export function chotNhan(buoi: readonly BuoiLop[]): NhanLop | null {
  if (vuot(buoi.map((b) => b.llr))) return 'dp'
  if (vuot(buoi.map((b) => -b.llr))) return 'ht'
  return null
}

/** Trục chất lượng chốt bằng trên lớp. Thuần. */
export function tinhTrenLop(v: DauVaoTrenLop): KetQuaTrenLop {
  const buoi = gomBuoi(cauCoTin(v))
  const llr = buoi.reduce((s, b) => s + b.llr, 0)
  let nguoc: KetQuaTrenLop['nguoc'] = null
  if (buoi.length >= 4) {
    const truoc = buoi.slice(0, -2), sau = buoi.slice(-2)
    nguoc = { nhan: chotNhan(truoc), sau: chotNhan(sau), llrSau: sau.reduce((s, b) => s + b.llrTho, 0), e0Sau: sau.reduce((s, b) => s + b.e0, 0), kSau: sau.reduce((s, b) => s + b.k, 0), nSau: sau.reduce((s, b) => s + b.n, 0) }
  }
  return {
    llr, buoi, soBuoi: buoi.length, buoiDp: buoi.filter((b) => b.llr > 0.5).length, buoiHt: buoi.filter((b) => b.llr < -0.5).length,
    nhan: chotNhan(buoi), nguoc,
  }
}
