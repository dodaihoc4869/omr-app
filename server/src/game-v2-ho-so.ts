// KÊNH 4 (thần thú) — ĐỌC HỒ SƠ CHO GAME V2 (GĐ 5, DE-XUAT-CA-NHAN-HOA-1909.md mục 2 "Kênh 4"). Mọi hàm ở đây CHỈ ĐỌC và không bao giờ ném lỗi:
// thiếu bảng (fixture cũ, migration chưa chạy) thì trả đúng thứ đầu vào, game chạy như trước.
//
// Không đụng `advance` (khoá thưởng 20/40/40), không đụng hồ sơ game đã lưu: `masteryTheoHoSo` trả BẢN SAO chỉ để truyền cho `chooseSession`.
import type { Env } from './kieu'
import type { Mastery } from '../../src/game/than-thu-v2/core'
import { MOM_CHUA_BAT_DAU_SO_NGAY } from './ho-so-cau-hinh'

const MOT_NGAY_MS = 86_400_000
const GIO_VN_MS = 7 * 3_600_000
type Row = Record<string, unknown>

/** 00:00 giờ VN của ngày YYYY-MM-DD, tính bằng ms. */
export const dauNgayVn = (ngay: string): number => Date.parse(`${ngay}T00:00:00+07:00`)
const ngayVnCua = (ms: number): string => new Date(ms + GIO_VN_MS).toISOString().slice(0, 10)

/**
 * MỘT ĐỒNG HỒ ÔN: mốc ôn của dạng = `nam_kt_dang.moc_on_ke` (ngày VN, sớm nhất trong các câu chưa khắc phục), không phải `due` riêng của game.
 * Dạng có mốc → `due` = 00:00 VN của ngày đó (dạng chưa có tiến trình game thì thêm một dòng mastery tổng hợp, chỉ `key` và `due` được
 * `chooseSession` đọc). Dạng KHÔNG có mốc (mọi câu đã khắc phục/chưa từng sai) giữ nguyên `due` của game — không tước lịch giãn cách của game.
 * Mã dạng thiếu (`CD:<chuyên đề>`) bỏ qua vì `key` của game là mã dạng thật hoặc nhóm nội dung. KHÔNG sửa mảng đầu vào.
 */
export async function masteryTheoHoSo(env: Env, sbd: string, mastery: Mastery[]): Promise<Mastery[]> {
  try {
    const r = await env.DB.prepare("SELECT ma_dang, moc_on_ke FROM nam_kt_dang WHERE sbd = ? AND moc_on_ke IS NOT NULL AND ma_dang NOT LIKE 'CD:%'").bind(sbd).all<Row>()
    const due = new Map<string, number>()
    for (const x of r.results ?? []) {
      const t = dauNgayVn(String(x.moc_on_ke))
      if (Number.isFinite(t)) due.set(String(x.ma_dang), t)
    }
    if (due.size === 0) return mastery
    const co = new Set(mastery.map((m) => m.key))
    const ra = mastery.map((m) => (due.has(m.key) ? { ...m, groups: [...m.groups], due: due.get(m.key)! } : m))
    for (const [dang, t] of due) if (!co.has(dang)) ra.push({ key: dang, stage: 0, first: 0, due: t, groups: [], repaired: false })
    return ra
  } catch {
    return mastery
  }
}

/**
 * Câu game KHÔNG được ra hôm nay vì em đang/đã làm ở chỗ khác: (a) câu có sự kiện HÔM NAY ở mọi nguồn TRỪ game (BTVN, Mom, ôn lại, khắc phục…),
 * (b) câu nằm trong bài Mom CHƯA NỘP giao trong `MOM_CHUA_BAT_DAU_SO_NGAY` ngày VN gần nhất (`mom_bai.qid_json`, cùng cửa sổ với `viec[]` của kế hoạch;
 * bài tồn cũ hơn không chặn game). Bài BTVN chưa làm chưa có `lo_json` (GĐ 3) nên chưa chặn được câu BTVN đang chờ.
 */
export async function qidChanHomNay(env: Env, sbd: string, now: number): Promise<Set<string>> {
  const ra = new Set<string>()
  const homNay = ngayVnCua(now)
  try {
    const r = await env.DB.prepare("SELECT DISTINCT qid FROM su_kien_hoc WHERE sbd = ? AND ngay_vn = ? AND nguon <> 'game'").bind(sbd, homNay).all<Row>()
    for (const x of r.results ?? []) ra.add(String(x.qid))
  } catch { /* chưa có sổ */ }
  try {
    const tu = new Date(dauNgayVn(ngayVnCua(now - (MOM_CHUA_BAT_DAU_SO_NGAY - 1) * MOT_NGAY_MS))).toISOString()
    const r = await env.DB.prepare('SELECT qid_json FROM mom_bai WHERE sbd = ? AND submitted_at IS NULL AND qid_json IS NOT NULL AND created_at >= ?').bind(sbd, tu).all<Row>()
    for (const x of r.results ?? []) {
      try {
        const a = JSON.parse(String(x.qid_json)) as unknown
        if (Array.isArray(a)) for (const q of a) if (typeof q === 'string' && q) ra.add(q)
      } catch { /* dòng hỏng: bỏ */ }
    }
  } catch { /* chưa có cột qid_json */ }
  return ra
}
