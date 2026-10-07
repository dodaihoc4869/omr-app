// HỌC LIỆU CHỮA — đọc và kiểm tra học liệu cho vòng chữa câu sai (đặc tả §8.3).
// Bảng `chua_loi_hoc_lieu` lưu HocLieuChua đã kiểm duyệt.
// KHÔNG chứa logic chấm hoặc FSM; chỉ đọc / kiểm tính đầy đủ.
import type { Env } from './kieu'
import type { HocLieuChua, BuocChua } from './chua-cau-sai-kieu'

export interface KetQuaKiemHocLieu {
  duDung: boolean
  lyDo: string   // rỗng nếu đủ dùng
  hocLieu: HocLieuChua | null
}

/** Lấy học liệu đã duyệt cho `qidChuan`. Trả null + lyDo nếu thiếu hoặc không đủ dùng. */
export async function docHocLieu(
  env: Env,
  qidChuan: string,
): Promise<KetQuaKiemHocLieu> {
  let row: { hoc_lieu_json: string; trang_thai: string; ly_do_thieu: string } | null = null
  try {
    row = await env.DB
      .prepare(`SELECT hoc_lieu_json, trang_thai, ly_do_thieu
                FROM chua_loi_hoc_lieu
                WHERE qid_chuan = ? AND trang_thai = 'du_dung'
                ORDER BY kiem_tra_luc DESC LIMIT 1`)
      .bind(qidChuan)
      .first<{ hoc_lieu_json: string; trang_thai: string; ly_do_thieu: string }>()
  } catch { return { duDung: false, lyDo: 'loi_doc_db', hocLieu: null } }

  if (!row) return { duDung: false, lyDo: 'chua_co_hoc_lieu', hocLieu: null }

  let hocLieu: HocLieuChua
  try { hocLieu = JSON.parse(row.hoc_lieu_json) as HocLieuChua } catch {
    return { duDung: false, lyDo: 'hoc_lieu_hong', hocLieu: null }
  }

  const kiem = kiemTinhDayDu(hocLieu)
  if (!kiem.ok) return { duDung: false, lyDo: kiem.lyDo, hocLieu: null }

  return { duDung: true, lyDo: '', hocLieu }
}

/** Kiểm tính đầy đủ tối thiểu của học liệu (§8.3). */
function kiemTinhDayDu(h: HocLieuChua): { ok: true } | { ok: false; lyDo: string } {
  if (!h.buoc || h.buoc.length === 0) return { ok: false, lyDo: 'khong_co_buoc' }
  if (!h.banGhepBai || h.banGhepBai.length === 0) return { ok: false, lyDo: 'thieu_ban_ghep' }
  if (!h.banKiemChung || h.banKiemChung.length === 0) return { ok: false, lyDo: 'thieu_ban_kiem' }
  for (const b of h.buoc) {
    if (!kiemBuoc(b)) return { ok: false, lyDo: `buoc_${b.thuTu}_thieu_chan_doan` }
  }
  return { ok: true }
}

function kiemBuoc(b: BuocChua): boolean {
  return (b.chanDoan?.length ?? 0) > 0
}

/**
 * Tìm bước đang vướng từ item chẩn đoán — trả index (0-based) bước đầu tiên em chưa qua.
 * -1 = tất cả bước đã ổn.
 */
export function timBuocVuong(
  hocLieu: HocLieuChua,
  buocDaQua: Set<number>,
): number {
  for (let i = 0; i < hocLieu.buoc.length; i++) {
    if (!buocDaQua.has(i)) return i
  }
  return -1
}
