// PHÂN BỔ SỬA LỖI MỖI NGÀY (thầy 29/10: «mỗi ngày tự tính toán lại số câu sai mới của học sinh và tổng số câu sai hiện có phân bổ lại thật thông minh và hiệu quả cho từng học sinh
// tối thiểu 12 câu và tối đa 36 câu/ngày, đủ các mức độ, đủ độ phủ kiến thức đã sai, chưa sửa được thì cộng vào ngày hôm sau; mỗi học sinh tối đa trong 12 ngày phải sửa xong
// ít nhất 80% tổng số câu sai»). Hàm THUẦN — máy chủ gọi trong `danhSach` (chua-cau-sai.ts) đúng một lần / em / ngày; kết quả vào việc hôm nay (tu-sua-viec-ngay.ts).
//
//  SỐ CÂU MỖI NGÀY  N = kẹp(⌈0,8 × (còn sửa + đã sửa 11 ngày gần đây) / 12⌉, 12, 36)
//    · «còn sửa» = câu cần sửa hôm nay + câu đang chờ gặp lại (chưa «đã tự sửa»); «đã sửa gần đây» = câu đã tự sửa trong 11 ngày qua.
//    · Vì sao có số hạng thứ hai: nếu chỉ tính phần còn lại thì mỗi ngày số câu giảm dần (suy giảm mũ) và 12 ngày chỉ xong ~60%. Cộng cả câu đã sửa trong cửa sổ 12 ngày thì
//      N giữ nguyên khi không có câu sai mới ⇒ 12 ngày × N ≥ 80% tổng; có câu sai mới ⇒ tổng tăng ⇒ N tự tăng hôm sau («tự tính lại mỗi ngày»).
//    · Tổng > 540 câu thì chạm trần 36/ngày (thầy chốt trần) — lúc ấy 12 ngày chỉ sửa được 36 × 12 = 432 câu.
//
//  CHỌN CÂU (độ phủ + mức độ + dồn ngày sau): lần lượt chọn từng câu, mỗi lần
//    1. nhóm DẠNG (kiến thức) có ÍT câu đã chọn nhất (hoà ⇒ nhóm có câu ưu tiên cao nhất) ⇒ mọi dạng đã sai đều có mặt trước khi dạng nào được chọn lần hai;
//    2. trong nhóm, câu có MỨC ĐỘ (NB/TH/VD/VDC) đang ít mặt nhất trong cả ngày (hoà ⇒ câu ưu tiên cao hơn) ⇒ ngày đủ các mức;
//    3. ưu tiên: câu sai TRƯỚC hôm nay (sai hôm nay xuống cuối — cùng ngày chỉ tính xong phần) → câu đã gặp lại (gần xong) → sai LÂU nhất trước ⇒ câu hôm qua chưa sửa
//       được tự trôi lên đầu hôm sau, không câu nào bị bỏ đói.
//  Không dùng ngẫu nhiên ⇒ cùng dữ liệu ra cùng danh sách (hai máy cùng ngày không lệch).
import { HANG_MUC_DO } from './srs2-loi'

export const SUA_NGAY_TOI_THIEU = 12
export const SUA_NGAY_TOI_DA = 36
/** Cửa sổ cam kết: trong 12 ngày phải sửa xong ≥ 80% (4/5) tổng số câu sai. */
export const SUA_SO_NGAY_CAM_KET = 12
/** Câu đã tự sửa trong chừng này ngày gần đây vẫn tính vào tổng của cửa sổ (hôm nay + 11 ngày trước = 12 ngày). */
export const SUA_NGAY_TINH_DA_SUA = SUA_SO_NGAY_CAM_KET - 1

export interface DemSuaNgay {
  /** Câu cần sửa ngay hôm nay. */
  can: number
  /** Câu đang chờ tới lịch gặp lại (chưa «đã tự sửa»). */
  cho: number
  /** Câu đã tự sửa trong `SUA_NGAY_TINH_DA_SUA` ngày gần đây. */
  daSua: number
}

/** Số câu Sửa lỗi của MỘT ngày. Số nguyên thuần (4/5 thay 0,8) để không lệch ở mốc 540. */
export function soCauSuaNgay(d: DemSuaNgay): number {
  const tong = Math.max(0, d.can | 0) + Math.max(0, d.cho | 0) + Math.max(0, d.daSua | 0)
  const can = Math.ceil((tong * 4) / (5 * SUA_SO_NGAY_CAM_KET))
  return Math.min(SUA_NGAY_TOI_DA, Math.max(SUA_NGAY_TOI_THIEU, can))
}

export interface UngVienSua {
  /** Mã đợt (khoá của mục trong việc hôm nay). */
  d: string
  /** Mã câu chuẩn. */
  q: string
  /** Trạng thái đợt (`trang_thai_day`). */
  t: string
  /** Hạn gặp lại (YYYY-MM-DD), rỗng nếu không có. */
  h: string
  /** Số lần gặp lại đã qua (`lan_gap_lai`): ≥ 1 = đã sửa dở, gần xong. */
  lan: number
  /** Lần sai cuối (ms); 0 = không rõ. */
  sai: number
  /** Khoá dạng / kiến thức để tính độ phủ; rỗng = «không rõ» (gom chung một nhóm). */
  dang: string
  /** Bậc mức độ 0..3 (NB…VDC); -1 = không rõ. */
  muc: number
}

/** Bậc mức độ từ chữ trong `cau_meta.muc_do`; lạ ⇒ -1. */
export const bacMucSua = (m: unknown): number => (typeof m === 'string' && m in HANG_MUC_DO ? HANG_MUC_DO[m]! : -1)

const GIO_MS = 3_600_000
const dauNgayVnMs = (ms: number) => Math.floor((ms + 7 * GIO_MS) / 86_400_000) * 86_400_000 - 7 * GIO_MS

/** Hạng ưu tiên (nhỏ = đứng trước): 0 sai trước hôm nay · 1 không rõ · 2 vừa sai hôm nay. */
function hangTuoi(u: UngVienSua, dau: number): number {
  return u.sai <= 0 ? 1 : u.sai >= dau ? 2 : 0
}
/** So hai câu theo ưu tiên: hạng tuổi → đã gặp lại trước → sai lâu nhất trước → mã đợt (ổn định). */
function truoc(a: UngVienSua, b: UngVienSua, dau: number): number {
  return hangTuoi(a, dau) - hangTuoi(b, dau)
    || (b.lan > 0 ? 1 : 0) - (a.lan > 0 ? 1 : 0)
    || (a.sai > 0 && b.sai > 0 ? a.sai - b.sai : 0)
    || (a.d < b.d ? -1 : a.d > b.d ? 1 : 0)
}

/**
 * Chọn tối đa `n` câu cho hôm nay từ `ung` (đã loại câu không sửa được hôm nay). `daCo` = câu ĐÃ nằm trong việc hôm nay (đếm vào độ phủ / mức độ, không chọn lại).
 * Trả theo thứ tự chọn — chặng đầu có các dạng ưu tiên cao nhất, mỗi chặng 4 câu trộn nhiều dạng.
 */
export function chonViecSuaNgay(ung: readonly UngVienSua[], n: number, nayMs: number, daCo: readonly UngVienSua[] = []): UngVienSua[] {
  const can = Math.max(0, Math.floor(n))
  if (can === 0 || ung.length === 0) return []
  const dau = dauNgayVnMs(nayMs)
  const bo = new Set(daCo.map((x) => x.d))
  const nhom = new Map<string, UngVienSua[]>()
  for (const u of ung) {
    if (bo.has(u.d)) continue
    const g = nhom.get(u.dang)
    if (g) g.push(u); else nhom.set(u.dang, [u])
  }
  for (const g of nhom.values()) g.sort((a, b) => truoc(a, b, dau))
  const demNhom = new Map<string, number>()
  const demMuc = [0, 0, 0, 0, 0] // 0..3 + «không rõ» ở ô 4
  for (const x of daCo) { demNhom.set(x.dang, (demNhom.get(x.dang) ?? 0) + 1); demMuc[x.muc >= 0 && x.muc <= 3 ? x.muc : 4]!++ }
  const ra: UngVienSua[] = []
  while (ra.length < can && nhom.size > 0) {
    // 1. nhóm ít câu đã chọn nhất; hoà ⇒ nhóm có câu đầu ưu tiên cao hơn.
    let tot: string | null = null
    for (const [k, g] of nhom) {
      if (tot === null) { tot = k; continue }
      const dk = demNhom.get(k) ?? 0, dt = demNhom.get(tot) ?? 0
      if (dk < dt || (dk === dt && truoc(g[0]!, nhom.get(tot)![0]!, dau) < 0)) tot = k
    }
    const g = nhom.get(tot!)!
    // 2. trong nhóm: mức đang ít mặt nhất; hoà ⇒ câu ưu tiên cao hơn (nhóm đã xếp sẵn nên chọn dòng đầu của mức ấy).
    let vi = 0, dem = Infinity
    for (let i = 0; i < g.length; i++) {
      const o = g[i]!.muc >= 0 && g[i]!.muc <= 3 ? g[i]!.muc : 4
      const diem = demMuc[o]! + (o === 4 ? 1e6 : 0) // mức không rõ chỉ được chọn khi nhóm không còn câu biết mức
      if (diem < dem) { dem = diem; vi = i }
    }
    const c = g.splice(vi, 1)[0]!
    if (g.length === 0) nhom.delete(tot!)
    demNhom.set(c.dang, (demNhom.get(c.dang) ?? 0) + 1)
    demMuc[c.muc >= 0 && c.muc <= 3 ? c.muc : 4]!++
    ra.push(c)
  }
  return ra
}
