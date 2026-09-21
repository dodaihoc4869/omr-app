// "Luyện nâng cao / Thử sức ngay" (Bảng nhiệm vụ → mở thử thách): chọn 2 câu từ kho đề máy em.
// Luật: chỉ câu HỢP KHỐI của em (câu khối cao hơn ⇒ bỏ; không rõ khối em / khối câu ⇒ giữ — đúng luật `khoi-cau.ts`), ưu tiên câu Vận dụng
// (2 sao hoặc mức "vận dụng") có đáp án; không đủ thì lấy câu bất kỳ có đáp án. Hàm THUẦN — màn chỉ gọi.
import type { CauLuyen } from './bai-tap-pdf'
import { locCauHopKhoi, type Khoi } from './khoi-cau'

export const SO_CAU_THU_THACH = 2

export function chonCauThuThach(tatCa: readonly CauLuyen[], khoiEm: Khoi | null | undefined, soCau: number = SO_CAU_THU_THACH): CauLuyen[] {
  const hop = locCauHopKhoi(khoiEm, tatCa)
  const vanDung = hop.filter((c) => (c.sao === 2 || c.mucDo === 'van_dung') && c.dapAn)
  const nguon = vanDung.length >= soCau ? vanDung : hop.filter((c) => c.dapAn)
  return nguon.slice(0, Math.max(0, soCau))
}
