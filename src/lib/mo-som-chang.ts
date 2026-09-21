// MỞ SỚM CHẶNG BÀI TẬP VỀ NHÀ (Điều 6, phương án B — thầy chốt 21/09/2026; hàm THUẦN, Code 1).
// Hiện chặng kế chỉ mở 00:00 hôm sau, em chăm làm xong chặng hôm nay không có đường làm tiếp. Luật mới: em ĐÚNG từ 80 % số câu của chặng vừa xong thì được MỞ SỚM ĐÚNG MỘT chặng kế trong ngày VN.
// Hạn nộp KHÔNG đổi; EXP theo đúng nhịp KHÔNG đổi; em yếu vẫn đi nhịp từng tối như cũ; thích nghi sau chặng (`thichNghiChangSau`) vẫn chạy TRƯỚC khi mở. Code 3 nối vào `btvn-nang-do-chang.ts`.
export const NGUONG_MO_SOM = 0.8
export const SO_CHANG_MO_SOM_TOI_DA_NGAY = 1
export type LyDoKhongMoSom = 'het_chang' | 'da_mo_som_hom_nay' | 'chua_du_ti_le'
export interface DauVaoMoSom {
  /** Tỉ lệ đúng của chặng VỪA XONG: 0…1 (đúng / số câu chặng). Không phải số ⇒ coi 0. */
  tiLeDungChangVuaXong: number
  /** Số chặng đã được mở sớm hôm nay (ngày VN). */
  soChangMoSomHomNay: number
  /** Còn chặng kế chưa mở không. */
  conChangKe: boolean
}
export interface KetQuaMoSom { duoc: boolean; lyDo: LyDoKhongMoSom | null }
/** Thứ tự nói lý do: hết chặng → hôm nay đã mở sớm một chặng → chưa đủ 80 %. Đủ 80 % ⇒ `duoc`. */
export function duocMoSomChang(v: DauVaoMoSom): KetQuaMoSom {
  if (!v.conChangKe) return { duoc: false, lyDo: 'het_chang' }
  const daMo = Number.isFinite(v.soChangMoSomHomNay) ? Math.max(0, v.soChangMoSomHomNay) : 0
  if (daMo >= SO_CHANG_MO_SOM_TOI_DA_NGAY) return { duoc: false, lyDo: 'da_mo_som_hom_nay' }
  const t = Number.isFinite(v.tiLeDungChangVuaXong) ? v.tiLeDungChangVuaXong : 0
  if (t < NGUONG_MO_SOM - 1e-9) return { duoc: false, lyDo: 'chua_du_ti_le' }
  return { duoc: true, lyDo: null }
}
/** Câu chữ cho màn (theo đề bài; Code 2 có thể dùng nguyên). `soChangXong`, `soChangKe` đánh số từ 1; `dung`/`tong` = số câu đúng / tổng của chặng vừa xong. */
export function chuMoSomChang(kq: KetQuaMoSom, d: { soChangXong: number; soChangKe: number; dung: number; tong: number }): string {
  if (kq.duoc) return `Em làm tốt chặng ${d.soChangXong} (đúng ${d.dung}/${d.tong}). Em được mở sớm chặng ${d.soChangKe} ngay hôm nay.`
  if (kq.lyDo === 'het_chang') return 'Em đã làm hết các chặng của bài tập về nhà này.'
  return `Chặng ${d.soChangKe} mở 00:00 ngày mai. Muốn luyện thêm hôm nay: vào Đảo thần thú.`
}
