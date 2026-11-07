// BÌNH PHẢN ỨNG — LUẬT PHÒNG THUẦN (thầy 06/11: «khi chiếu đề nào thì học sinh ở dưới nhận được đề trên app … chọn đáp án thì hiện lên bảng»;
// đặc tả + bản vẽ thầy duyệt «build luôn»: docs/ban-ve-binh-phan-ung-0611/GHI-CHU.md). Dùng chung: Durable Object máy chủ (server/src/phong-binh-phan-ung.ts)
// giữ trạng thái và gọi các hàm này; app thầy / máy em chỉ dùng phần chia đội + chữ. KHÔNG đọc mạng, KHÔNG đọc đồng hồ (nơi gọi truyền `nay`).
// BẤT BIẾN AN TOÀN: `viewEm` không bao giờ mang đáp án (`dung`) khi lượt chưa mở đáp án — test tests/bpu-phong-0611.test.ts khoá.
// Điểm trong buổi là «kJ» (năng lượng) — KHÔNG phải «tinh thể» (tinh thể là phần thưởng tích luỹ sẵn có của app học sinh).

export type PhanCau = 'I' | 'II' | 'III'
export type PhaLuot = 'tra-loi' | 'goi' | 'lam-bang' | 'mo'

/** Bốn đội màu thử ngọn lửa: Na vàng cam · K tím · Cu xanh lục (đúng màu ngọn lửa đồng) · Ca đỏ — biến màu CỐ ĐỊNH sẵn có ở tokens.css (không đổi theo nền, cùng giá trị ở bảng chiếu và máy em; không thêm byte vào tờ màu lúc mở app). */
export const DOI_BPU = [
  { ten: 'Đội Natri', ky: 'Na', mau: '--p-cam' },
  { ten: 'Đội Kali', ky: 'K', mau: '--p-tim-2' },
  { ten: 'Đội Đồng', ky: 'Cu', mau: '--p-xanh' },
  { ten: 'Đội Canxi', ky: 'Ca', mau: '--p-do' },
] as const

export const KJ = {
  dung: 100,
  nhanhToiDa: 50,
  moiYDung: 25,
  vaoLop: 10,
  duQuanDau: 50,
  kichHoat: 30,
  lenBangDat: 200,
  doanDung: 20,
  roiMan: -20,
  /** «Em chưa biết làm» (thầy 07/11 «để học sinh thành thật»): +20 kJ cho em, không bị gọi lên bảng; đoán bừa sai thì 0 kJ và vẫn có thể được gọi. */
  thanhThat: 20,
} as const
export const NGUONG_KICH_HOAT = 0.75
export const TIEP_SUC_TOI_DA = 10
/** Gửi trễ hơn hạn bao lâu vẫn nhận (mạng chậm). */
export const AN_HAN_MS = 2000

export interface EmPhong {
  sbd: string
  ten: string
  doi: number
  vao: boolean
  /** Giờ điểm danh (ms) — để hiện «Vừa vào lớp». */
  luc: number | null
  kj: number
  dungSo: number
  chuoi: number
  roi: number
  daLenBang: number
}
/** `kb` = em bấm «Em chưa biết làm» (cờ riêng, KHÔNG giả làm một lựa chọn ⇒ không bao giờ được chấm là đúng). */
export interface TraLoi { chon: string; t: number; kb?: boolean }
export interface GoiLenBang {
  sbd: string
  lyDo: string[]
  duDoan: Record<string, 0 | 1>
  tiep: Record<string, number>
  dat: boolean | null
}
export interface KetQuaEm { dung: boolean; soY: number | null; kj: number; nhanh: number | null; kb?: boolean }
export interface LuotPhong {
  so: number
  qid: string
  phan: PhanCau
  tuLuan: boolean
  /** Câu công khai (không đáp án) — nguyên dạng máy em dùng (`cauCongKhai`). */
  cau: Record<string, unknown>
  /** Đáp án — CHỈ trong phòng, chỉ ra ngoài sau khi mở. */
  dung: string
  batDau: number
  han: number | null
  pha: PhaLuot
  tra: Record<string, TraLoi>
  roiMe: string[]
  goi: GoiLenBang | null
  ketQua: Record<string, KetQuaEm> | null
  kich: boolean
  /** LỜI GIẢI (thầy 07/11: máy em hiện lời giải Kính / thu gọn sau khi mở đáp án): lời giải kho + ảnh lời giải — CHỈ trong phòng, chỉ ra máy em khi pha «mo». */
  giai?: { solution: unknown; anh: { src: string; viTri: string; alt?: string }[] } | null
}
export interface TomTatLuot { so: number; qid: string; soDung: number; soGui: number; tuLuan: boolean }
export interface TrangThaiPhong {
  buoiId: string
  lop: string
  thang: string
  mo: number
  ds: EmPhong[]
  luot: LuotPhong | null
  soLuot: number
  doiThuong: number[]
  doiDu: number | null
  /** Số đội (thầy 07/11 «dưới 12 bạn thì chỉ tạo 2 đội»): 2 | 4. Phòng lưu trước bản này không có ⇒ 4. */
  soDoi?: number
  vuaVao: string[]
  lichSu: TomTatLuot[]
  ketThuc: boolean
  capNhat: number
}

/** Băm chuỗi ổn định (FNV-1a 32 bit). */
function bam(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0 }
  return h >>> 0
}
/** Chia đội CỐ ĐỊNH CẢ THÁNG: xếp sbd theo băm (sbd + tháng) rồi chia rắn bò 0-1-2-3-3-2-1-0 ⇒ các đội lệch nhau tối đa 1 bạn.
 *  Hai đội: cùng thứ tự, đội = (đội bốn) mod 2 ⇒ {Natri+Đồng}, {Kali+Canxi} — gộp từ bốn đội ra đúng hai đội đều. */
export function chiaDoi(dsSbd: readonly string[], thang: string, soDoi = 4): Map<string, number> {
  const xep = [...new Set(dsSbd)].sort((a, b) => bam(a + '|' + thang) - bam(b + '|' + thang) || a.localeCompare(b))
  const ra = new Map<string, number>()
  xep.forEach((s, k) => { const v = Math.floor(k / 4), r = k % 4, d = v % 2 === 0 ? r : 3 - r; ra.set(s, soDoi === 2 ? d % 2 : d) })
  return ra
}
/** Dưới ngần này em ⇒ hai đội. */
export const IT_EM_HAI_DOI = 12
export const soDoiCua = (st: Pick<TrangThaiPhong, 'soDoi'>): number => (st.soDoi === 2 ? 2 : 4)
/** Gộp bốn đội thành hai (lượt đầu mà có mặt dưới 12 em): em đổi đội = đội mod 2, kJ thưởng đội cộng dồn — không mất điểm điểm danh. */
export function gopHaiDoi(st: TrangThaiPhong): void {
  if (soDoiCua(st) === 2) return
  for (const e of st.ds) e.doi = e.doi % 2
  st.doiThuong = [(st.doiThuong[0] ?? 0) + (st.doiThuong[2] ?? 0), (st.doiThuong[1] ?? 0) + (st.doiThuong[3] ?? 0)]
  if (st.doiDu != null) st.doiDu = st.doiDu % 2
  st.soDoi = 2
}
export const thangCua = (nay: number): string => {
  const d = new Date(nay + 7 * 3_600_000)
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}
/** Tên gọi trên bảng: hai chữ cuối. */
export const tenNgan = (ten: string): string => { const p = ten.trim().split(/\s+/); return p.slice(-2).join(' ') || ten }
/** Kí hiệu ô nguyên tố: hai chữ cái đầu của chữ cuối, bỏ dấu. */
export function kyHieu(ten: string): string {
  const p = ten.trim().split(/\s+/), cuoi = (p[p.length - 1] || '?').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')
  return (cuoi[0] || '?').toUpperCase() + (cuoi[1] || '').toLowerCase()
}

export function taoPhong(o: { buoiId: string; lop: string; nay: number; ds: readonly { sbd: string; ten: string; coMat: boolean; luc?: number | null }[] }): TrangThaiPhong {
  const thang = thangCua(o.nay)
  const soDoi = o.ds.length < IT_EM_HAI_DOI ? 2 : 4
  const doi = chiaDoi(o.ds.map((x) => x.sbd), thang, soDoi)
  const st: TrangThaiPhong = {
    buoiId: o.buoiId, lop: o.lop, thang, mo: o.nay,
    ds: o.ds.map((x) => ({ sbd: x.sbd, ten: x.ten || x.sbd, doi: doi.get(x.sbd) ?? 0, vao: false, luc: null, kj: 0, dungSo: 0, chuoi: 0, roi: 0, daLenBang: 0 })),
    luot: null, soLuot: 0, doiThuong: Array(soDoi).fill(0), doiDu: null, soDoi, vuaVao: [], lichSu: [], ketThuc: false, capNhat: o.nay,
  }
  const coMat = [...o.ds].filter((x) => x.coMat).sort((a, b) => (a.luc ?? 0) - (b.luc ?? 0))
  for (const x of coMat) vaoLop(st, x.sbd, x.luc ?? o.nay)
  return st
}
const em = (st: TrangThaiPhong, sbd: string): EmPhong | undefined => st.ds.find((x) => x.sbd === sbd)

/** Em điểm danh / vào phòng: +10 kJ cho đội; đội đủ quân đầu tiên +50. Em lạ (không thuộc lớp) ⇒ false. */
/** Thêm em vào danh sách phòng (chưa vào lớp) nếu chưa có — tự chia đội như em vào muộn. */
export function themEm(st: TrangThaiPhong, sbd: string, ten: string): void {
  if (!sbd || em(st, sbd)) return
  const doi = chiaDoi([...st.ds.map((x) => x.sbd), sbd], st.thang, soDoiCua(st)).get(sbd) ?? 0
  st.ds.push({ sbd, ten: ten || sbd, doi, vao: false, luc: null, kj: 0, dungSo: 0, chuoi: 0, roi: 0, daLenBang: 0 })
}
export function vaoLop(st: TrangThaiPhong, sbd: string, nay: number, ten?: string): boolean {
  let e = em(st, sbd)
  if (!e) {
    if (!ten) return false
    const doi = chiaDoi([...st.ds.map((x) => x.sbd), sbd], st.thang, soDoiCua(st)).get(sbd) ?? 0
    e = { sbd, ten, doi, vao: false, luc: null, kj: 0, dungSo: 0, chuoi: 0, roi: 0, daLenBang: 0 }
    st.ds.push(e)
  }
  if (e.vao) return true
  e.vao = true; e.luc = nay
  st.doiThuong[e.doi] = (st.doiThuong[e.doi] ?? 0) + KJ.vaoLop
  st.vuaVao = [...st.vuaVao.filter((s) => s !== sbd), sbd].slice(-6)
  if (st.doiDu == null && st.ds.filter((x) => x.doi === e!.doi).every((x) => x.vao)) { st.doiDu = e.doi; st.doiThuong[e.doi] = (st.doiThuong[e.doi] ?? 0) + KJ.duQuanDau }
  st.capNhat = nay
  return true
}

/** Lượt đang mở mà CHƯA em nào gửi, chưa gọi ai ⇒ bỏ (không đánh số mới cho câu kế tiếp). Trả true nếu đã bỏ. */
export function boLuotRong(st: TrangThaiPhong): boolean {
  const l = st.luot
  if (!l || l.pha === 'mo' || l.goi || Object.keys(l.tra).length) return false
  st.luot = null
  st.soLuot = Math.max(0, st.soLuot - 1)
  return true
}
export function moLuot(st: TrangThaiPhong, c: { qid: string; phan: PhanCau; tuLuan: boolean; cau: Record<string, unknown>; dung: string; hanGiay: number | null; giai?: LuotPhong['giai'] }, nay: number): LuotPhong {
  // Lượt đầu mà lớp có mặt dưới 12 em ⇒ hai đội (linh hoạt theo số em thật sự có mặt; từ lượt hai đội đã chốt, không đổi giữa buổi).
  if (st.soLuot === 0 && st.ds.filter((e) => e.vao).length < IT_EM_HAI_DOI) gopHaiDoi(st)
  st.soLuot += 1
  st.luot = {
    so: st.soLuot, qid: c.qid, phan: c.phan, tuLuan: c.tuLuan, cau: c.cau, dung: c.dung, batDau: nay,
    han: c.hanGiay && c.hanGiay > 0 ? nay + c.hanGiay * 1000 : null, pha: 'tra-loi', tra: {}, roiMe: [], goi: null, ketQua: null, kich: false, giai: c.giai ?? null,
  }
  st.capNhat = nay
  return st.luot
}

export type LyDoTuChoi = 'khong-co-luot' | 'da-khoa' | 'het-gio' | 'da-gui' | 'la' | 'rong'
/** Nhận đáp án: chỉ lần gửi ĐẦU theo (sbd, lượt); quá hạn (+2 s) ⇒ từ chối. Em chưa điểm danh mà gửi ⇒ tính là vào lớp. */
export function nhanTra(st: TrangThaiPhong, sbd: string, chon: string, nay: number, kb = false): { ok: true } | { ok: false; ly: LyDoTuChoi } {
  const l = st.luot
  if (!l) return { ok: false, ly: 'khong-co-luot' }
  if (l.pha !== 'tra-loi') return { ok: false, ly: 'da-khoa' }
  if (l.han != null && nay > l.han + AN_HAN_MS) return { ok: false, ly: 'het-gio' }
  const e = em(st, sbd)
  if (!e) return { ok: false, ly: 'la' }
  if (l.tra[sbd]) return { ok: false, ly: 'da-gui' }
  const v = kb ? '' : l.tuLuan ? 'xong' : String(chon ?? '').trim().slice(0, 40)
  if (!v && !kb) return { ok: false, ly: 'rong' }
  if (!e.vao) vaoLop(st, sbd, nay)
  l.tra[sbd] = kb ? { chon: '', t: Math.max(0, nay - l.batDau), kb: true } : { chon: v, t: Math.max(0, nay - l.batDau) }
  st.capNhat = nay
  return { ok: true }
}

/** Em rời màn (ẩn app ≥ 2 s — máy em tự đo): −20 kJ cho đội, đếm lần. CHỈ tính khi đang có lượt chưa mở đáp án (đang trả lời / lên bảng);
 *  lúc chờ giữa các lượt em được rời (không phạt, không báo). */
export function roiMan(st: TrangThaiPhong, sbd: string, nay: number): boolean {
  const e = em(st, sbd)
  if (!e || st.ketThuc || !st.luot || st.luot.pha === 'mo') return false
  e.roi += 1
  st.doiThuong[e.doi] = (st.doiThuong[e.doi] ?? 0) + KJ.roiMan
  if (st.luot && !st.luot.roiMe.includes(sbd)) st.luot.roiMe.push(sbd)
  st.capNhat = nay
  return true
}

export function goiLenBang(st: TrangThaiPhong, sbd: string, lyDo: readonly string[], nay: number): boolean {
  const l = st.luot
  if (!l || l.pha === 'mo' || !em(st, sbd)) return false
  l.pha = 'goi'
  l.goi = { sbd, lyDo: lyDo.map((x) => String(x).slice(0, 200)).slice(0, 3), duDoan: {}, tiep: {}, dat: null }
  st.capNhat = nay
  return true
}
export function lamBang(st: TrangThaiPhong, nay: number): boolean {
  const l = st.luot
  if (!l || !l.goi || l.pha === 'mo') return false
  l.pha = 'lam-bang'; st.capNhat = nay
  return true
}
export function duDoan(st: TrangThaiPhong, sbd: string, v: 0 | 1, nay: number): boolean {
  const l = st.luot
  if (!l?.goi || l.pha === 'mo' || l.goi.sbd === sbd || !em(st, sbd) || l.goi.duDoan[sbd] != null) return false
  l.goi.duDoan[sbd] = v ? 1 : 0; st.capNhat = nay
  return true
}
export function tiepSuc(st: TrangThaiPhong, sbd: string, nay: number): boolean {
  const l = st.luot
  if (!l?.goi || l.pha === 'mo' || l.goi.sbd === sbd || !em(st, sbd)) return false
  const n = l.goi.tiep[sbd] ?? 0
  if (n >= TIEP_SUC_TOI_DA) return false
  l.goi.tiep[sbd] = n + 1; st.capNhat = nay
  return true
}
export function chamLenBang(st: TrangThaiPhong, dat: boolean, nay: number): boolean {
  const l = st.luot
  if (!l?.goi || l.pha === 'mo') return false
  l.goi.dat = dat; st.capNhat = nay
  return true
}
export const tongTiep = (g: GoiLenBang | null): number => (g ? Object.values(g.tiep).reduce((a, b) => a + b, 0) : 0)

/** Chấm một câu trả lời. `chamSo` = luật so đáp số Phần III của app (truyền vào để module này không kéo bộ chấm). */
export function chamTra(l: Pick<LuotPhong, 'phan' | 'dung' | 'tuLuan'>, chon: string, chamSo: (traLoi: string, dapAn: string) => boolean): { dung: boolean; soY: number | null } {
  if (l.tuLuan) return { dung: false, soY: null }
  const a = chon.trim().toUpperCase(), d = l.dung.trim().toUpperCase()
  if (l.phan === 'III') return { dung: chamSo(chon, l.dung), soY: null }
  if (l.phan === 'II') {
    let soY = 0
    for (let i = 0; i < Math.max(4, d.length); i++) if (d[i] && a[i] === d[i]) soY++
    return { dung: a === d, soY }
  }
  return { dung: a === d, soY: null }
}

/** MỞ ĐÁP ÁN: khoá nhận bài trước, chấm, cộng kJ (đúng 100 + nhanh tối đa 50; Đúng–sai 25/ý, đủ 4 ý mới có nhanh), chuỗi, năng lượng hoạt hoá
 *  (≥ 75% em có mặt đúng ⇒ mọi em có mặt +30), lên bảng Đạt ⇒ đội +200, đoán đúng +20. Gọi lại khi đã mở ⇒ không làm gì. */
export function moDapAn(st: TrangThaiPhong, nay: number, chamSo: (traLoi: string, dapAn: string) => boolean): boolean {
  const l = st.luot
  if (!l || l.pha === 'mo') return false
  l.pha = 'mo'
  // LƯỢT RỖNG (không em nào gửi — thầy lật qua câu): không đụng chuỗi đúng của ai, không ghi vào tổng kết (tỉ lệ đúng, «lượt khó nhất»).
  if (!Object.keys(l.tra).length && !l.goi) { l.ketQua = {}; st.capNhat = nay; return true }
  const kq: Record<string, KetQuaEm> = {}
  const dungTheoGio = Object.entries(l.tra).filter(([, t]) => !t.kb && chamTra(l, t.chon, chamSo).dung).sort((a, b) => a[1].t - b[1].t).map(([s]) => s)
  const thoiLuong = l.han != null ? l.han - l.batDau : 60_000
  for (const e of st.ds) {
    const t = l.tra[e.sbd]
    if (!t) { if (!l.tuLuan) e.chuoi = 0; continue }
    // Chưa biết làm: +20 kJ thành thật (câu tự luận 0), không chấm, không cộng nhanh; chuỗi đúng giữ nguyên (không phạt sự thành thật).
    if (t.kb) { const kj = l.tuLuan ? 0 : KJ.thanhThat; e.kj += kj; kq[e.sbd] = { dung: false, soY: 0, kj, nhanh: null, kb: true }; continue }
    const c = chamTra(l, t.chon, chamSo)
    const nhanh = Math.round(KJ.nhanhToiDa * Math.max(0, 1 - t.t / Math.max(1, thoiLuong)))
    let kj = 0
    if (l.tuLuan) kj = 0
    else if (l.phan === 'II') kj = (c.soY ?? 0) * KJ.moiYDung + (c.dung ? nhanh : 0)
    else kj = c.dung ? KJ.dung + nhanh : 0
    if (!l.tuLuan) { if (c.dung) { e.dungSo += 1; e.chuoi += 1 } else e.chuoi = 0 }
    e.kj += kj
    const k = dungTheoGio.indexOf(e.sbd)
    kq[e.sbd] = { dung: c.dung, soY: c.soY, kj, nhanh: k >= 0 ? k + 1 : null }
  }
  const coMat = st.ds.filter((e) => e.vao).length
  l.kich = !l.tuLuan && coMat > 0 && dungTheoGio.length / coMat >= NGUONG_KICH_HOAT
  if (l.kich) for (const e of st.ds) if (e.vao) { e.kj += KJ.kichHoat; if (kq[e.sbd]) kq[e.sbd]!.kj += KJ.kichHoat }
  if (l.goi) {
    const g = l.goi, duoc = em(st, g.sbd)
    if (duoc) duoc.daLenBang += 1
    if (g.dat === true && duoc) st.doiThuong[duoc.doi] = (st.doiThuong[duoc.doi] ?? 0) + KJ.lenBangDat
    if (g.dat != null) for (const [s, v] of Object.entries(g.duDoan)) if ((v === 1) === g.dat) { const e = em(st, s); if (e) { e.kj += KJ.doanDung; if (kq[s]) kq[s]!.kj += KJ.doanDung } }
  }
  l.ketQua = kq
  st.lichSu.push({ so: l.so, qid: l.qid, soDung: dungTheoGio.length, soGui: Object.keys(l.tra).length, tuLuan: l.tuLuan })
  st.capNhat = nay
  return true
}

export const diemDoi = (st: TrangThaiPhong, d: number): number => st.ds.reduce((s, e) => s + (e.doi === d ? e.kj : 0), 0) + (st.doiThuong[d] ?? 0)
/** Xếp hạng đội theo TỔNG kJ (con số hiện trên bảng — cả lớp nhìn là hiểu); hoà ⇒ trung bình mỗi bạn có mặt cao hơn. Chia đội lệch nhau tối đa 1 bạn. */
export function xepDoi(st: TrangThaiPhong): { doi: number; tong: number; coMat: number; tb: number }[] {
  return Array.from({ length: soDoiCua(st) }, (_, d) => d).map((d) => { const coMat = st.ds.filter((e) => e.doi === d && e.vao).length, tong = diemDoi(st, d); return { doi: d, tong, coMat, tb: coMat ? tong / coMat : tong } })
    .sort((a, b) => b.tong - a.tong || b.tb - a.tb || a.doi - b.doi)
}
export const xepEm = (st: TrangThaiPhong): EmPhong[] => [...st.ds].filter((e) => e.vao).sort((a, b) => b.kj - a.kj || a.ten.localeCompare(b.ten))

/** Thông tin cho BẢNG CHIẾU (máy thầy): đủ mọi thứ; đáp án chỉ khi đã mở. */
export function viewBang(st: TrangThaiPhong) {
  const l = st.luot
  return {
    t: 'bang' as const,
    buoiId: st.buoiId, lop: st.lop, soLuot: st.soLuot, ketThuc: st.ketThuc, doiThuong: st.doiThuong, doiDu: st.doiDu, soDoi: soDoiCua(st), vuaVao: st.vuaVao, lichSu: st.lichSu,
    ds: st.ds.map((e) => ({ sbd: e.sbd, ten: e.ten, doi: e.doi, vao: e.vao, luc: e.luc, kj: e.kj, dungSo: e.dungSo, chuoi: e.chuoi, roi: e.roi, daLenBang: e.daLenBang })),
    luot: l ? {
      so: l.so, qid: l.qid, phan: l.phan, tuLuan: l.tuLuan, cau: l.cau, batDau: l.batDau, han: l.han, pha: l.pha, roiMe: l.roiMe, kich: l.kich,
      daGui: Object.keys(l.tra),
      chuaBiet: Object.entries(l.tra).filter(([, t]) => t.kb).map(([s]) => s),
      goi: l.goi ? { sbd: l.goi.sbd, lyDo: l.goi.lyDo, dat: l.goi.dat, doanDung: Object.values(l.goi.duDoan).filter((v) => v === 1).length, doanSai: Object.values(l.goi.duDoan).filter((v) => v === 0).length, tiep: tongTiep(l.goi) } : null,
      ...(l.pha === 'mo' ? { dung: l.dung, chon: Object.fromEntries(Object.entries(l.tra).filter(([, t]) => !t.kb).map(([s, t]) => [s, t.chon])), ketQua: l.ketQua } : {}),
    } : null,
  }
}
export type ViewBang = ReturnType<typeof viewBang>

/** Thông tin cho MÁY EM: chỉ việc của em; KHÔNG đáp án trước khi mở. */
export function viewEm(st: TrangThaiPhong, sbd: string) {
  const e = em(st, sbd), l = st.luot
  const xep = xepEm(st), hang = e ? xep.findIndex((x) => x.sbd === sbd) + 1 : 0
  const d = e ? e.doi : 0
  const goi = l?.goi ? (() => { const g = l.goi!, h = em(st, g.sbd); return { sbd: g.sbd, ten: h?.ten ?? g.sbd, doi: h?.doi ?? 0, lyDo: g.lyDo, emDoan: g.duDoan[sbd] ?? null, emTiep: g.tiep[sbd] ?? 0, tiep: tongTiep(g), dat: g.dat } })() : null
  return {
    t: 'em' as const,
    ketThuc: st.ketThuc, soLuot: st.soLuot,
    em: e ? { sbd: e.sbd, ten: e.ten, doi: d, vao: e.vao, luc: e.luc, kj: e.kj, dungSo: e.dungSo, roi: e.roi, hang, soEm: xep.length } : null,
    doi: { so: st.ds.filter((x) => x.doi === d && x.vao).length, tong: st.ds.filter((x) => x.doi === d).length, kj: diemDoi(st, d) },
    luot: l ? {
      so: l.so, phan: l.phan, tuLuan: l.tuLuan, cau: l.cau, batDau: l.batDau, han: l.han, pha: l.pha,
      daGui: Object.keys(l.tra).length, coMat: st.ds.filter((x) => x.vao).length,
      emTra: l.tra[sbd] ?? null, goi,
      ...(l.pha === 'mo' ? { dung: l.dung, ketQua: l.ketQua?.[sbd] ?? null, soDung: Object.values(l.ketQua ?? {}).filter((k) => k.dung).length, qid: l.qid, giai: l.giai ?? null } : {}),
    } : null,
  }
}
export type ViewEm = ReturnType<typeof viewEm>

export function ketThuc(st: TrangThaiPhong, nay: number): void { st.ketThuc = true; st.capNhat = nay }
