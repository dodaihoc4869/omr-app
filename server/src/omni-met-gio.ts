// OMNI 3 — HỒ SƠ MỆT THEO KHUNG GIỜ (của riêng em, co Bayes). LÕI THUẦN. Chỉ GỢI Ý đổi thứ tự — không khoá, không báo phụ huynh.
// ⚠ STUB HỢP ĐỒNG: agent "Lõi thuần" hoàn thiện + test. Đặc tả mục 4.7.
import { THAM_SO_OMNI, type HoSoOmniEm, type KhungGio, type ThamSoOmni } from './omni-kieu'

/** Tỉ lệ sơ ý theo khung (co về tỉ lệ chung của em bằng luotAo lượt ảo); kích hoạt khi khung hiện tại ≥ boi × khung tốt nhất và ≥ toiThieu lượt thật. */
export function xetMetGio(hs: Pick<HoSoOmniEm, 'khungGio'>, khung: KhungGio, ts: ThamSoOmni = THAM_SO_OMNI): { khung: KhungGio; tiLe: number; tiLeTot: number; kichHoat: boolean } | null {
  void hs; void khung; void ts
  return null
}
