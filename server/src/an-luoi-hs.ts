// ẨN HỆ PHÁT HIỆN LƯỜI KHỎI MÁY HỌC SINH (thầy 26/10: nhãn Học thật / Đối phó, 12 bậc chăm «Lười Vô Cực → Chăm», nhóm Chăm / Chưa đều / Lười, ĐUỔI 5 bậc,
// Mức làm Thuộc / Bấm vội / Treo máy / Cố tình treo máy… «CHỈ THẦY VÀ PHỤ HUYNH xem được»). Hàm THUẦN, chỉ nhập KIỂU — bốn lệnh `/hs/*` gọi ở bước CUỐI,
// sau lõi dùng chung với `/ph/*` và `/gv/*` ⇒ bản phụ huynh và thầy giữ NGUYÊN mọi trường. Không xoá dữ liệu, không đổi phép tính: chỉ bỏ trường khỏi
// trả lời gửi xuống máy em (em mở công cụ nhà phát triển cũng không thấy). Khoá bằng test tests/an-luoi-hs-2610.test.ts.
import type { KetQuaHoSoThaiDo } from './bai-hang-ngay-kieu'
import type { KetQuaLichSuLamCau, LanLamCau } from './lich-su-lam-cau-kieu'
import type { KetQuaNhipHocEm } from './nhip-hoc-kieu'

/** `/hs/nhip-hoc`: bỏ nhóm, bậc, việc tiếp (loại việc lộ nhóm), tốc độ (đo «quá nhanh»), độ tin cậy của nhóm. */
export const TRUONG_AN_NHIP_HS = ['nhom', 'bacCham', 'viecTiep', 'tocDo', 'doTinCay', 'canThem'] as const
/** `/hs/ho-so-thai-do`: bỏ nhãn kết luận (Lười / Có dấu hiệu đối phó…), sáu tín hiệu (quá nhanh, chọn lặp, gợi ý…), nhóm, cờ đối phó, bậc, tin cậy. */
export const TRUONG_AN_HO_SO_HS = ['ketLuan', 'tinHieu', 'nhomNhip', 'coDoiPho', 'tinCayNhom', 'bacCham', 'cachTinhTinCay'] as const
/** `/hs/lich-su-lam-cau`: bỏ Mức làm (tổng, 6 mức, từng lượt) — em chỉ còn Đúng / Sai / có dùng gợi ý / số giây. */
export const TRUONG_AN_LICH_SU_HS = ['mucLam', 'mucLam6'] as const
/** `/hs/danh-gia`: chỉ còn `ok` — không nhãn, lý do, số liệu, tiến bộ, lịch sử, tin nhắn, không cả công tắc thầy bật. */
export const TRUONG_GIU_DANH_GIA_HS = ['ok'] as const

/** Bản em của Nhịp học: dải ngày + số ngày đủ mức + chuỗi ngày + số câu (không nhóm, không bậc). */
export type NhipHocHs = Omit<KetQuaNhipHocEm, (typeof TRUONG_AN_NHIP_HS)[number]>
export type TraLoiNhipHocHs = NhipHocHs | { ok: false; error: string }
export type TraLoiHoSoThaiDoHs = HoSoThaiDoHs | { ok: false; error: string }
export type TraLoiLichSuLamCauHs = LichSuLamCauHs | { ok: false; error: string }
export type HoSoThaiDoHs = Omit<KetQuaHoSoThaiDo, (typeof TRUONG_AN_HO_SO_HS)[number] | 'phanBoGiay'> & {
  /** Phân bố số giây KHÔNG kèm số lượt «quá nhanh». */
  phanBoGiay: Omit<KetQuaHoSoThaiDo['phanBoGiay'][number], 'soNhanh'>[]
}
export type LichSuLamCauHs = Omit<KetQuaLichSuLamCau, (typeof TRUONG_AN_LICH_SU_HS)[number] | 'lan'> & { lan: Omit<LanLamCau, 'mucLam'>[] }

function bo<T extends object, K extends string>(o: T, ds: readonly K[]): Omit<T, K> {
  const ra = { ...o } as Record<string, unknown>
  for (const k of ds) delete ra[k]
  return ra as Omit<T, K>
}

type Loi = { ok: false; error: string }

export function nhipHocChoHs(kq: KetQuaNhipHocEm | Loi): NhipHocHs | Loi {
  return kq.ok === true ? bo(kq, TRUONG_AN_NHIP_HS) : kq
}

export function hoSoThaiDoChoHs(kq: KetQuaHoSoThaiDo | Loi): HoSoThaiDoHs | Loi {
  if (kq.ok !== true) return kq
  const r = bo(kq, TRUONG_AN_HO_SO_HS)
  return { ...r, phanBoGiay: r.phanBoGiay.map((g) => bo(g, ['soNhanh'] as const)) }
}

export function lichSuChoHs(kq: KetQuaLichSuLamCau | Loi): LichSuLamCauHs | Loi {
  if (kq.ok !== true) return kq
  const r = bo(kq, TRUONG_AN_LICH_SU_HS)
  return { ...r, lan: r.lan.map((l) => bo(l, ['mucLam'] as const)) }
}

/** `/hs/danh-gia`: lỗi giữ nguyên lời; thành công ⇒ chỉ `{ ok: true }`. */
export function danhGiaChoHs(r: Record<string, unknown>): Record<string, unknown> {
  return r.ok === true ? { ok: true } : r
}
