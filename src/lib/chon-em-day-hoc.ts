// CHỌN EM LÊN BẢNG — BẢNG DẠY HỌC (thầy lệnh 28/09: "thuật toán tự động chọn học sinh ở mức độ câu đó hoặc cao hơn, đảm bảo xác suất cao nhất
// lên bảng làm đúng được câu đó"). THUẦN: không IO, không đồng hồ, không ngẫu nhiên — cùng đầu vào ra cùng em (test được, thầy bấm lại không đổi).
//
// LUẬT (theo thứ tự):
//  1. Chỉ em CÓ MẶT (danh sách điểm danh của buổi), trừ em thầy vừa bấm "Đổi em khác" cho câu này.
//  2. MỨC CỦA EM ở câu = bậc hồ sơ `nam_kt_dang` theo dạng của câu (0 Biết · 1 Hiểu · 2 Vận dụng); không có bậc ⇒ suy từ tỉ lệ đúng dạng/chuyên đề
//     (≥ 3 lần: ≥ 85% ⇒ Vận dụng, ≥ 65% ⇒ Hiểu, ≥ 40% ⇒ Biết, thấp hơn ⇒ chưa tới). Em ĐỦ MỨC khi mức ≥ mức độ câu (Nhận biết 0 · Thông hiểu 1 · Vận dụng 2).
//  3. XÁC SUẤT làm đúng (ước theo Bayes, co về trung bình): gốc = tỉ lệ đúng chung (60 ngày) → chỉnh theo chuyên đề → theo dạng → theo CHÍNH câu này
//     → theo lịch sử lên bảng (Đạt / Chưa đạt); rồi nhân hệ số mức (đủ mức ×1, thiếu một bậc ×0,7, thiếu hai bậc ×0,45).
//  4. Chọn trong nhóm ĐỦ MỨC em có xác suất cao nhất. Hoà (chênh < 0,5 điểm %) ⇒ em ít được gọi hôm nay hơn ⇒ SBD nhỏ hơn.
//  5. Không gọi một em quá 2 lần/buổi khi còn em khác đủ mức và chưa tới 2 lần. Hết em đủ mức ⇒ lấy em xác suất cao nhất trong cả lớp có mặt (ghi rõ).
//  6. Không em nào có số liệu ở dạng/câu này ⇒ chọn em hạng chung cao nhất (tỉ lệ đúng chung) và GHI RÕ "ước lượng".

export type MucDo = 'biet' | 'hieu' | 'van_dung'
export const MUC_SO: Record<MucDo, 0 | 1 | 2> = { biet: 0, hieu: 1, van_dung: 2 }
export const TEN_MUC_CAU: Record<0 | 1 | 2, string> = { 0: 'Nhận biết', 1: 'Thông hiểu', 2: 'Vận dụng' }
export const TEN_BAC_EM: Record<-1 | 0 | 1 | 2, string> = { [-1]: 'chưa tới bậc Biết', 0: 'bậc Biết', 1: 'bậc Hiểu', 2: 'bậc Vận dụng' }
/** Số lần tối đa một em được gọi trong một buổi (khi còn em khác đủ sức). */
export const TOI_DA_LAN_MOI_BUOI = 2
/** Hai xác suất chênh ít hơn ngần này coi là hoà. */
export const NGUONG_HOA = 0.005
/** Số lần tối thiểu ở dạng/chuyên đề để suy mức từ tỉ lệ đúng (không có bậc hồ sơ). */
export const TOI_THIEU_LAN_SUY_MUC = 3

export interface Dem {
  n: number
  d: number
}
/** Sức học một em (khuôn `/gv/buoi-hoc/suc-hoc`). */
export interface SucHocEm {
  tong: Dem
  qid: Record<string, Dem>
  dang: Record<string, Dem>
  chuyenDe: Record<string, Dem>
  bac: Record<string, number>
  lenBang: { n: number; dat: number; homNay: number }
}
export interface CauCanChon {
  qid: string
  maDang?: string | null
  chuyenDe?: string | null
  mucDo?: MucDo | '' | null
}
export interface EmCoMat {
  sbd: string
  hoTen: string
}
export interface UngVien {
  sbd: string
  hoTen: string
  /** Xác suất ước làm đúng (0..1). */
  xacSuat: number
  /** Mức của em ở câu này (-1 chưa tới Biết); null = không biết. */
  mucEm: -1 | 0 | 1 | 2 | null
  duMuc: boolean
  /** Số lần đã được gọi trong buổi (tính cả các câu đã xếp trước). */
  soLanGoi: number
  /** Có số liệu RIÊNG ở câu/dạng/chuyên đề này (không chỉ tỉ lệ chung). */
  coSoLieu: boolean
}
export interface KetQuaChon {
  sbd: string
  hoTen: string
  xacSuat: number
  /** Chọn khi thiếu số liệu ⇒ số chỉ là ước lượng (màn thầy ghi rõ). */
  uocLuong: boolean
  duMuc: boolean
  /** Một câu cho THẦY đọc (không chiếu lên tờ). */
  lyDo: string
  /** Toàn bộ bảng xếp (đã sắp), để màn thầy xem vì sao. */
  bang: UngVien[]
}

const RONG: SucHocEm = { tong: { n: 0, d: 0 }, qid: {}, dang: {}, chuyenDe: {}, bac: {}, lenBang: { n: 0, dat: 0, homNay: 0 } }
const kep = (x: number) => Math.max(0.01, Math.min(0.99, x))
/** Co về `goc` với "trọng lượng" k lần giả định. */
const co = (dem: Dem | undefined, goc: number, k: number) => (dem && dem.n > 0 ? (dem.d + k * goc) / (dem.n + k) : goc)
const pt = (x: number) => `${Math.round(x * 100)}%`

export function mucCauSo(m: CauCanChon['mucDo']): 0 | 1 | 2 {
  return m && m in MUC_SO ? MUC_SO[m as MucDo] : 0
}

/** Mức của em ở dạng của câu: bậc hồ sơ trước, không có thì suy từ tỉ lệ đúng (đủ ≥ 3 lần), không nữa ⇒ null. */
export function mucEmOCau(s: SucHocEm, c: CauCanChon): -1 | 0 | 1 | 2 | null {
  const bac = (c.maDang ? s.bac[c.maDang] : undefined) ?? (c.chuyenDe ? s.bac[`CD:${c.chuyenDe}`] : undefined)
  if (typeof bac === 'number' && Number.isFinite(bac)) return Math.max(0, Math.min(2, Math.round(bac))) as 0 | 1 | 2
  const dem = [c.maDang ? s.dang[c.maDang] : undefined, c.chuyenDe ? s.chuyenDe[c.chuyenDe] : undefined].find((x) => x && x.n >= TOI_THIEU_LAN_SUY_MUC)
  if (!dem) return null
  const p = dem.d / dem.n
  return p >= 0.85 ? 2 : p >= 0.65 ? 1 : p >= 0.4 ? 0 : -1
}

/** Xác suất ước em làm đúng câu (0..1) + có số liệu riêng ở câu/dạng/chuyên đề không. */
export function xacSuatDung(s: SucHocEm, c: CauCanChon): { p: number; coSoLieu: boolean; mucEm: -1 | 0 | 1 | 2 | null } {
  const muc = mucCauSo(c.mucDo)
  // Gốc: tỉ lệ đúng chung co về 0,5; câu càng khó gốc càng thấp một chút.
  let p = co(s.tong, 0.5, 4) - 0.05 * muc
  const cd = c.chuyenDe ? s.chuyenDe[c.chuyenDe] : undefined
  const dg = c.maDang ? s.dang[c.maDang] : undefined
  const q = s.qid[c.qid]
  p = co(cd, p, 4)
  p = co(dg, p, 3)
  p = co(q, p, 2)
  // Lên bảng: đạt/chưa đạt nói về khả năng ĐỨNG TRƯỚC LỚP làm đúng — trọng lượng nhỏ.
  if (s.lenBang.n > 0) p = co({ n: s.lenBang.n, d: s.lenBang.dat }, p, 6)
  const mucEm = mucEmOCau(s, c)
  if (mucEm !== null && mucEm < muc) p *= mucEm === muc - 1 ? 0.7 : 0.45
  return { p: kep(p), coSoLieu: !!((cd && cd.n) || (dg && dg.n) || (q && q.n) || mucEm !== null), mucEm }
}

/** Chọn MỘT em cho một câu. `daGoi` = số lần mỗi em đã được gọi trong buổi (kể cả câu đã xếp trước); `boQua` = em thầy vừa đổi đi. Không còn em ⇒ null. */
export function chonEmChoCau(
  c: CauCanChon,
  coMat: readonly EmCoMat[],
  sucHoc: Readonly<Record<string, SucHocEm>>,
  daGoi: Readonly<Record<string, number>> = {},
  boQua: ReadonlySet<string> = new Set(),
): KetQuaChon | null {
  const muc = mucCauSo(c.mucDo)
  const ds: UngVien[] = coMat
    .filter((e) => e.sbd && !boQua.has(e.sbd))
    .map((e) => {
      const s = sucHoc[e.sbd] ?? RONG
      const { p, coSoLieu, mucEm } = xacSuatDung(s, c)
      return { sbd: e.sbd, hoTen: e.hoTen, xacSuat: p, mucEm, duMuc: mucEm !== null && mucEm >= muc, soLanGoi: daGoi[e.sbd] ?? 0, coSoLieu }
    })
  if (!ds.length) return null
  // Lần gọi HÔM NAY ngoài buổi này (máy chủ đếm `len_bang`) chỉ dùng để phá hoà — giới hạn 2 lần tính theo buổi.
  const homNay = (sbd: string) => (sucHoc[sbd]?.lenBang.homNay ?? 0)
  const sap = (a: UngVien, b: UngVien) =>
    Math.abs(b.xacSuat - a.xacSuat) >= NGUONG_HOA ? b.xacSuat - a.xacSuat : a.soLanGoi - b.soLanGoi || homNay(a.sbd) - homNay(b.sbd) || a.sbd.localeCompare(b.sbd)
  ds.sort(sap)

  const khongAiCoSoLieu = ds.every((x) => !x.coSoLieu)
  if (khongAiCoSoLieu) {
    // Thiếu số liệu ⇒ hạng CHUNG cao nhất (tỉ lệ đúng chung), vẫn tôn trọng giới hạn 2 lần.
    const chung = (x: UngVien) => co(sucHoc[x.sbd]?.tong, 0.5, 4)
    const theoHang = [...ds].sort((a, b) => chung(b) - chung(a) || a.soLanGoi - b.soLanGoi || homNay(a.sbd) - homNay(b.sbd) || a.sbd.localeCompare(b.sbd))
    const chon = theoHang.find((x) => x.soLanGoi < TOI_DA_LAN_MOI_BUOI) ?? theoHang.sort((a, b) => a.soLanGoi - b.soLanGoi)[0]!
    const tong = sucHoc[chon.sbd]?.tong
    return {
      sbd: chon.sbd,
      hoTen: chon.hoTen,
      xacSuat: chon.xacSuat,
      uocLuong: true,
      duMuc: false,
      lyDo: `Ước lượng: chưa em nào có số liệu ở dạng này — chọn em hạng chung cao nhất${tong && tong.n ? ` (đúng ${pt(tong.d / tong.n)} trên ${tong.n} câu gần đây)` : ''}.`,
      bang: ds,
    }
  }

  const duMuc = ds.filter((x) => x.duMuc)
  const conLuot = (x: UngVien) => x.soLanGoi < TOI_DA_LAN_MOI_BUOI
  const chon = duMuc.find(conLuot) ?? ds.find(conLuot) ?? duMuc[0] ?? ds[0]!
  const uocLuong = !chon.coSoLieu
  const lyMuc =
    chon.duMuc && chon.mucEm !== null
      ? `${TEN_BAC_EM[chon.mucEm]} ≥ mức ${TEN_MUC_CAU[muc]}`
      : duMuc.length
        ? `các em đủ mức đã lên ${TOI_DA_LAN_MOI_BUOI} lần — chọn em xác suất cao nhất còn lại`
        : `chưa em nào có mặt đạt mức ${TEN_MUC_CAU[muc]} — chọn em xác suất cao nhất`
  return {
    sbd: chon.sbd,
    hoTen: chon.hoTen,
    xacSuat: chon.xacSuat,
    uocLuong,
    duMuc: chon.duMuc,
    lyDo: `${uocLuong ? 'Ước lượng · ' : ''}Khả năng làm đúng ≈ ${pt(chon.xacSuat)} · ${lyMuc}${chon.soLanGoi ? ` · đã lên ${chon.soLanGoi} lần buổi này` : ''}.`,
    bang: ds,
  }
}

/** Xếp em cho CẢ danh sách câu theo thứ tự, cộng dồn số lần gọi (giới hạn 2 lần/buổi áp đúng trên cả lượt). `daGoi` = số lần đã gọi trước lượt này. */
export function xepEmChoDanhSach(
  dsCau: readonly CauCanChon[],
  coMat: readonly EmCoMat[],
  sucHoc: Readonly<Record<string, SucHocEm>>,
  daGoi: Readonly<Record<string, number>> = {},
): (KetQuaChon | null)[] {
  const dem: Record<string, number> = { ...daGoi }
  return dsCau.map((c) => {
    const kq = chonEmChoCau(c, coMat, sucHoc, dem)
    if (kq) dem[kq.sbd] = (dem[kq.sbd] ?? 0) + 1
    return kq
  })
}
