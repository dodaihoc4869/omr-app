// 12 BẬC TỪ LƯỜI ĐẾN CHĂM (thầy 13/10: "tính toán tối ưu sắp xếp mức độ lười biếng theo cấu trúc sau và hiển thị luôn … Mỗi cấp độ hiển thị màu
// khác nhau"). MỘT phép thuần (không D1, không Env) dùng chung cho thầy (`/gv/nhip-hoc`, hồ sơ một em), em và phụ huynh (`/hs|/ph/nhip-hoc`) ⇒ ba app
// cùng một bậc, cùng một điểm. Không thêm truy vấn: tính trên đúng dãy ngày (mức tối thiểu · đã làm) mà luật nhóm Nhịp học đã đọc.
//
// KHÔNG BAO GIỜ MÂU THUẪN NHÓM THẦY ĐÃ DUYỆT (`tomTatNhip`, nhip-hoc-luat.ts): Lười ⇒ bậc 1–5 · Chưa đều ⇒ bậc 6–7 · Chăm ⇒ bậc 8–12 · Chưa đủ dữ liệu
// (dưới 3 ngày đã qua) ⇒ chưa xếp bậc. Nhóm quyết KHOẢNG bậc; ĐIỂM CHĂM (0–100) xếp em trong khoảng ấy.
//
// ĐIỂM CHĂM — tính trên các ngày ĐÃ QUA được tính (hôm nay chưa hết ngày nên không tính, trừ chuỗi đủ mức đã cộng hôm nay khi hôm nay đã đủ):
//   · trọng số gần đây: ngày cách hôm nay t ngày có trọng số 0,5^((t−1)/7) — hôm qua 1, một tuần trước 0,5 ⇒ thói quen HIỆN TẠI nặng hơn chuyện cũ;
//   · D = tỉ lệ ngày đủ mức (có trọng số) · C = tỉ lệ khối lượng đã làm so mức, mỗi ngày tối đa 100% (có trọng số; làm 70% vẫn được 0,7 — khác hẳn
//     không làm) · B = chuỗi ngày đủ mức liền gần nhất / 7 (tối đa 1) · V = phần làm VƯỢT mức trung bình (có trọng số, mỗi ngày tối đa gấp đôi);
//   · z = số ngày liền KHÔNG làm câu nào tính lùi từ hôm qua (đang bỏ học ⇒ trừ ngay, mỗi ngày 8 điểm, tối đa 30).
//   Điểm = 95 × (0,5·D + 0,3·C + 0,2·B) + 5 × min(V / 0,3; 1) − min(30; 8·z), kẹp 0–100, làm tròn.
// BẬC trong nhóm = bậc đầu khoảng + số ngưỡng điểm của nhóm đã vượt (`NGUONG_BAC`). Bậc 12 thêm điều kiện: chuỗi đủ mức liền ≥ 7 ngày.
import type { NgayNhipEm, NhomNhip } from './nhip-hoc-kieu'
import type { TomTatNhip } from './nhip-hoc-luat'

export type NhomCoBac = Exclude<NhomNhip, 'chua-du'>
export interface MotBac {
  /** 1 (lười nhất) … 12 (chăm nhất). */
  so: number
  ten: string
  bieuTuong: string
  nhom: NhomCoBac
}

export const BAC_CHAM_CHI: readonly MotBac[] = [
  { so: 1, ten: 'Lười Vô Cực', bieuTuong: '🦥', nhom: 'luoi' },
  { so: 2, ten: 'Thánh Bất Động', bieuTuong: '🛌', nhom: 'luoi' },
  { so: 3, ten: 'Vua Ngủ Nướng', bieuTuong: '💤', nhom: 'luoi' },
  { so: 4, ten: 'Chúa Tể Trì Hoãn', bieuTuong: '🐌', nhom: 'luoi' },
  { so: 5, ten: 'Cao Thủ Né Việc', bieuTuong: '🐢', nhom: 'luoi' },
  { so: 6, ten: 'Lười Có Tính Toán', bieuTuong: '🐼', nhom: 'chua-deu' },
  { so: 7, ten: 'Đại Sư Cân Bằng', bieuTuong: '⚖️', nhom: 'chua-deu' },
  { so: 8, ten: 'Tân Binh Siêng Năng', bieuTuong: '🚶', nhom: 'cham' },
  { so: 9, ten: 'Chiến Binh Cần Cù', bieuTuong: '📚', nhom: 'cham' },
  { so: 10, ten: 'Cao Thủ Chăm Chỉ', bieuTuong: '🔥', nhom: 'cham' },
  { so: 11, ten: 'Chiến Thần Năng Suất', bieuTuong: '⚡', nhom: 'cham' },
  { so: 12, ten: 'Thần Chăm Chỉ Tối Thượng', bieuTuong: '👑', nhom: 'cham' },
]
export const SO_BAC = BAC_CHAM_CHI.length

/** Bậc đầu của từng nhóm + ngưỡng điểm để lên từng bậc kế trong nhóm (tăng dần). */
export const NGUONG_BAC: Readonly<Record<NhomCoBac, { dau: number; nguong: readonly number[] }>> = {
  luoi: { dau: 1, nguong: [8, 16, 26, 36] },
  'chua-deu': { dau: 6, nguong: [55] },
  cham: { dau: 8, nguong: [72, 82, 90, 98] },
}
/** Bậc 12 cần chuỗi đủ mức liền gần nhất ít nhất chừng này ngày. */
export const CHUOI_BAC_CAO_NHAT = 7
export const NUA_DOI_NGAY = 7

export interface KetQuaBac {
  /** 1–12. */
  bac: number
  /** Điểm chăm 0–100 (cùng phép cho thầy, em, phụ huynh). */
  diem: number
  /** Điểm còn thiếu để lên bậc kế TRONG CÙNG NHÓM; null khi bậc kế thuộc nhóm khác (lên nhóm theo luật nhóm) hoặc đã bậc 12. */
  diemLenBac: number | null
}

const MOT_NGAY = 86_400_000
const ngayMs = (s: string) => Date.parse(`${s}T00:00:00Z`)

/** Điểm chăm 0–100 từ dãy ngày ĐƯỢC TÍNH (cũ → mới) — xem đầu tệp. Không có ngày đã qua ⇒ 0. */
export function diemChamChi(ngay: readonly NgayNhipEm[], homNay: string, chuoiDuGanNhat: number): number {
  const h = ngayMs(homNay)
  const qua = ngay.filter((x) => x.ngay < homNay)
  if (!qua.length) return 0
  let tong = 0, d = 0, c = 0, v = 0
  for (const x of qua) {
    const tuoi = Math.max(1, Math.round((h - ngayMs(x.ngay)) / MOT_NGAY))
    const w = 0.5 ** ((tuoi - 1) / NUA_DOI_NGAY)
    const r = x.muc > 0 ? Math.max(0, x.lam) / x.muc : 1
    tong += w
    if (x.lam >= x.muc) d += w
    c += w * Math.min(r, 1)
    v += w * Math.min(Math.max(r - 1, 0), 1)
  }
  let z = 0
  for (let i = qua.length - 1; i >= 0 && qua[i]!.lam <= 0; i--) z++
  const D = d / tong, C = c / tong, V = v / tong, B = Math.min(Math.max(chuoiDuGanNhat, 0), CHUOI_BAC_CAO_NHAT) / CHUOI_BAC_CAO_NHAT
  const diem = 95 * (0.5 * D + 0.3 * C + 0.2 * B) + 5 * Math.min(V / 0.3, 1) - Math.min(30, 8 * z)
  return Math.round(Math.min(100, Math.max(0, diem)))
}

/** Bậc từ nhóm + điểm (+ chuỗi cho bậc 12). Thuần — app dùng lại để kiểm. */
export function bacTuDiem(nhom: NhomCoBac, diem: number, chuoiDuGanNhat: number): { bac: number; diemLenBac: number | null } {
  const { dau, nguong } = NGUONG_BAC[nhom]
  let vuot = 0
  while (vuot < nguong.length && diem >= nguong[vuot]!) vuot++
  const bac = dau + vuot
  // Bậc 12 cần thêm chuỗi đủ mức ≥ 7 ngày: đủ điểm mà chuỗi ngắn ⇒ giữ bậc 11, điểm không còn là thứ thiếu (diemLenBac = null).
  if (bac === SO_BAC && chuoiDuGanNhat < CHUOI_BAC_CAO_NHAT) return { bac: SO_BAC - 1, diemLenBac: null }
  const keTiep = bac - dau < nguong.length ? nguong[bac - dau]! : null
  return { bac, diemLenBac: keTiep === null ? null : Math.max(1, keTiep - diem) }
}

/** Bậc của một em. Nhóm 'chua-du' ⇒ null (chưa xếp bậc). `t` = `tomTatNhip(ngay, homNay)` đã tính sẵn (không tính lại). */
export function bacChamChi(ngay: readonly NgayNhipEm[], homNay: string, t: Pick<TomTatNhip, 'nhom' | 'chuoiDuGanNhat'>): KetQuaBac | null {
  if (t.nhom === 'chua-du') return null
  const diem = diemChamChi(ngay, homNay, t.chuoiDuGanNhat)
  return { diem, ...bacTuDiem(t.nhom, diem, t.chuoiDuGanNhat) }
}
