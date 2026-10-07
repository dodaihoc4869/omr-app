// ADAPTER TRẠNG THÁI LỖI — vòng chữa câu sai (07/10/2026, đặc tả §9.3).
//
// Hai track riêng biệt (KHÔNG trộn):
//   - Track lỗi học: `TrangThaiLoi` từ `phatLaiLoi` (loi-hoc-luat.ts) — sổ su_kien_hoc.
//   - Track dạy:    `TrangThaiDay`  từ bảng chua_loi_dot.trang_thai_day.
//
// Adapter này ĐỌC track lỗi, cấp dữ liệu đầu vào cho FSM dạy mà KHÔNG sửa track lỗi.
import type { Env } from './kieu'
import {
  phatLaiLoi, tachSongSinh, TU_NGAY,
  type KetQuaLoi, type LanLamLoi, type ThamSoLuat, THAM_SO_GOC,
} from './loi-hoc-luat'
import { SQL_LA_LAN_LAM } from './omni-kieu'
import { SQL_DA_CONG_BO } from './cong-bo-diem'
import type { TrangThaiDay } from './chua-cau-sai-kieu'

export interface TrangThaiLoiDau {
  qidChuan: string
  loiHoc: KetQuaLoi
  /** Thời điểm sai đầu (ms) — NULL nếu không có lần sai đã công bố. */
  moLuc: number | null
  /** Thời điểm sai cuối (ms). */
  saiCuoiLuc: number | null
}

/** Chuẩn hoá qid về dạng gốc (bỏ ~ss, ~bt, prefix tc:). */
export function qidChuan(qid: string): string {
  const sans = tachSongSinh(qid).goc
  return sans.startsWith('tc:') ? sans.slice(3) : sans
}

type Row = Record<string, unknown>
const str = (v: unknown) => (v == null ? '' : String(v))

/**
 * Lấy trạng thái lỗi học hiện tại của (sbd, qidGoc) bằng cách đọc sổ su_kien_hoc.
 * Trả `null` nếu không có lần sai TỰ LÀM đã công bố từ 29/09.
 */
export async function docTrangThaiLoiDau(
  env: Env,
  sbd: string,
  qidGoc: string,
  homNay: string,
  ts: ThamSoLuat = THAM_SO_GOC,
): Promise<TrangThaiLoiDau | null> {
  const q = qidChuan(qidGoc)
  // Bao gồm câu song sinh (tachSongSinh về gốc)
  const SQL_NGUON_CA = SQL_DA_CONG_BO('c')

  // Lấy tất cả lần làm sổ cho (sbd, câu gốc / song sinh) từ TU_NGAY
  const sql = `
    SELECT s.luc, s.ket_qua, s.ngay_vn, COALESCE(s.assistance,'') AS assistance,
           COALESCE(s.purpose,'') AS purpose, s.qid, s.nguon
    FROM su_kien_hoc s
    WHERE s.sbd = ?
      AND s.ngay_vn >= ?
      AND COALESCE(s.qid,'') <> ''
      AND ${SQL_LA_LAN_LAM}
      AND COALESCE(s.visibility,'') <> 'embargoed'
      AND (s.nguon <> 'thi' OR EXISTS (
            SELECT 1 FROM ca c WHERE c.ma_ca = s.ma_nguon
              AND c.trang_thai <> 'da_xoa' AND ${SQL_NGUON_CA}))
  `
  let rows: Row[] = []
  try {
    rows = (await env.DB.prepare(sql).bind(sbd, TU_NGAY).all<Row>()).results ?? []
  } catch { return null }

  // Lọc chỉ câu gốc và song sinh của nó
  const lan: LanLamLoi[] = []
  let moLuc: number | null = null
  let saiCuoiLuc: number | null = null

  for (const x of rows) {
    const qRaw = str(x.qid)
    const qGoc = tachSongSinh(qRaw).goc
    if (qGoc !== q) continue

    const isSongSinh = qRaw !== qGoc
    const coHoTro = str(x.assistance) === 'assisted'
    const kq = x.ket_qua == null ? null : Number(x.ket_qua) as 0 | 1 | null
    const luc = str(x.luc)
    const ngayVn = str(x.ngay_vn)

    lan.push({ luc, ngayVn, ketQua: kq, coHoTro, songSinh: isSongSinh, nguon: str(x.nguon) })

    if (!coHoTro && (kq === 0 || kq === null)) {
      const ms = Date.parse(luc)
      if (moLuc == null || ms < moLuc) moLuc = ms
      if (saiCuoiLuc == null || ms > saiCuoiLuc) saiCuoiLuc = ms
    }
  }

  if (moLuc == null) return null  // chưa từng sai tự làm

  // Đọc mốc em đã xem lời giải câu này
  let docLuc: string[] = []
  try {
    const r = await env.DB.prepare(
      'SELECT luc FROM loi_giai_hoi WHERE sbd = ? AND qid = ? AND luc >= ?',
    ).bind(sbd, q, `${TU_NGAY}T00:00:00`).all<{ luc: string }>()
    docLuc = (r.results ?? []).map((x) => x.luc)
  } catch { /* bảng chưa tạo */ }

  const coSongSinh = false  // FSM dạy kiểm riêng khi cần
  const loiHoc = phatLaiLoi(lan, docLuc, coSongSinh, homNay, ts)

  return { qidChuan: q, loiHoc, moLuc, saiCuoiLuc }
}

/**
 * Map `TrangThaiLoi` → `TrangThaiDay` ban đầu khi mở đợt mới.
 * Chỉ dùng lúc TẠO đợt; sau đó FSM dạy tự chuyển trạng thái.
 */
export function trangThaiDayBanDau(
  loiHoc: KetQuaLoi,
  coHocLieu: boolean,
): TrangThaiDay {
  if (loiHoc.trangThai === 'dong' || loiHoc.trangThai === 'khong_loi') {
    return 'da_tu_sua'
  }
  if (!coHocLieu) return 'thieu_hoc_lieu'
  return 'can_chan_doan'
}
