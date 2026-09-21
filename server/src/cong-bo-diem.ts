// LUẬT CÔNG BỐ ĐIỂM CỦA CA (thầy chốt từ trước; `ca.cong_bo`): MỘT nguồn cho mọi lệnh trả điểm / đáp án / lời giải theo ca ra máy học sinh và phụ huynh.
//   `ngay`        ⇒ công bố ngay khi em nộp.
//   `ca_lop_xong` ⇒ công bố khi CA ĐÃ ĐÓNG (`trang_thai = 'dong'`) hoặc CẢ LỚP xong: có ít nhất một lượt vào thi và số lượt `da_nop` ≥ số lượt (ca chưa ai vào KHÔNG tính là xong).
//   `khong` / thiếu ⇒ KHÔNG công bố (thầy chưa cho xem).
// Hàm thuần `laSanSangCongBo` là luật; `SQL_DA_CONG_BO` và `docTrangThaiCongBo` là hai cách áp CÙNG luật ấy lên D1 (test khoá ba đường cho cùng kết quả: tests/cong-bo-diem-may-chu-2109.test.ts).
// `ketQuaCuaEm` (goi-cu.ts) — đường máy em đang hỏi "đã được xem đáp án chưa" — gọi chính hàm này.
import type { Env } from './kieu'

export type CheDoCongBo = 'khong' | 'ngay' | 'ca_lop_xong'

/** Luật: ca đã được phép hiện điểm / đáp án cho em chưa. `daVao` = số lượt của ca, `daNop` = số lượt đã nộp (`da_nop`). */
export function laSanSangCongBo(congBo: string, trangThaiCa: string, daVao: number, daNop: number): boolean {
  const caXong = trangThaiCa === 'dong' || (daVao > 0 && daNop >= daVao)
  return congBo === 'ngay' || (congBo === 'ca_lop_xong' && caXong)
}

/** Chuẩn hoá `ca.cong_bo` (thiếu / lạ ⇒ `khong`). */
export function cheDoCongBo(v: unknown): CheDoCongBo {
  const s = v === null || v === undefined ? '' : String(v).trim()
  return s === 'ngay' || s === 'ca_lop_xong' ? s : 'khong'
}

/**
 * Điều kiện SQL "ca đã công bố" cho bảng `ca` mang bí danh `bd` — ĐÚNG luật `laSanSangCongBo`. Ca không có dòng trong `ca` (LEFT JOIN rỗng) ⇒ NULL ⇒ KHÔNG công bố.
 */
export const SQL_DA_CONG_BO = (bd = 'c'): string =>
  `(${bd}.cong_bo = 'ngay' OR (${bd}.cong_bo = 'ca_lop_xong' AND (${bd}.trang_thai = 'dong' OR ((SELECT COUNT(*) FROM luot cb_a WHERE cb_a.ma_ca = ${bd}.ma_ca) > 0 AND (SELECT COUNT(*) FROM luot cb_a WHERE cb_a.ma_ca = ${bd}.ma_ca) <= (SELECT COUNT(*) FROM luot cb_b WHERE cb_b.ma_ca = ${bd}.ma_ca AND cb_b.trang_thai = 'da_nop')))))`

export interface TrangThaiCongBoCa {
  maCa: string
  congBo: CheDoCongBo
  /** Đã được phép cho em thấy điểm / đáp án / lời giải của ca. */
  daCongBo: boolean
  /** Số lượt đã nộp / số lượt của ca — cho dòng "Đã nộp a/b em — điểm hiện khi cả lớp nộp". */
  soEmDaNop: number
  soEmDaVao: number
}

/** Trạng thái công bố của các ca (MỘT truy vấn). Ca không có dòng trong `ca` ⇒ vắng trong bản đồ (người gọi coi là CHƯA công bố). Lỗi truy vấn ⇒ ném (người gọi KHÔNG được coi là công bố). */
export async function docTrangThaiCongBo(env: Env, dsMaCa: string[]): Promise<Map<string, TrangThaiCongBoCa>> {
  const ra = new Map<string, TrangThaiCongBoCa>()
  const ds = [...new Set(dsMaCa.filter((x) => typeof x === 'string' && x !== ''))]
  if (ds.length === 0) return ra
  const r = await env.DB.prepare(
    `SELECT c.ma_ca, c.cong_bo, c.trang_thai,
            (SELECT COUNT(*) FROM luot l WHERE l.ma_ca = c.ma_ca) AS da_vao,
            (SELECT COUNT(*) FROM luot l WHERE l.ma_ca = c.ma_ca AND l.trang_thai = 'da_nop') AS da_nop
       FROM ca c WHERE c.ma_ca IN (SELECT value FROM json_each(?))`,
  )
    .bind(JSON.stringify(ds))
    .all<Record<string, unknown>>()
  for (const x of r.results ?? []) {
    const maCa = String(x.ma_ca ?? '')
    const congBo = cheDoCongBo(x.cong_bo)
    const soEmDaVao = Number(x.da_vao) || 0
    const soEmDaNop = Number(x.da_nop) || 0
    ra.set(maCa, { maCa, congBo, daCongBo: laSanSangCongBo(congBo, String(x.trang_thai ?? ''), soEmDaVao, soEmDaNop), soEmDaNop, soEmDaVao })
  }
  return ra
}

/** Dòng "ca chưa công bố" cho máy mới (chỉ-thêm): `chuaCongBo: [{maCa, tenCa, nopLuc, congBo, soEmDaNop, soEmDaVao}]`. */
export function dongChuaCongBo(maCa: string, tenCa: string, nopLuc: string, t: TrangThaiCongBoCa | undefined) {
  return { maCa, tenCa: tenCa || `Ca ${maCa}`, nopLuc, congBo: t?.congBo ?? 'khong', soEmDaNop: t?.soEmDaNop ?? 0, soEmDaVao: t?.soEmDaVao ?? 0 }
}
