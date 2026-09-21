// NHẬT KÝ LỖI CỦA MÁY (B11 — docs/de-xuat-b7-b8-b9-b11-2109.md; migration-2109-nhat-ky-may.sql). Ghi khi một việc NỀN của cron gặp lỗi để `/gv/bang-tin` (ô `sucKhoe.canhBao`) báo cho thầy.
// KHÔNG BAO GIỜ ném lỗi (việc ghi nhật ký không được kéo việc khác đổ theo); chống trùng: mỗi nguồn ≤ 1 dòng / 30 phút; giữ ≤ 500 dòng; câu ghi là câu đơn giản cho thầy, chi tiết kỹ thuật chỉ ở log.
import type { Env } from './kieu'

export const TOI_DA_DONG_NHAT_KY = 500
export const PHUT_CHONG_TRUNG = 30
/** Nguồn → tên việc bằng lời của thầy. */
export const TEN_NGUON_NHAT_KY: Readonly<Record<string, string>> = {
  nhac_nop_bai: 'Nhắc nộp bài',
  ke_hoach_ngay: 'Lập kế hoạch ngày',
  exp_ngay: 'Chốt điểm ngày',
  tin_phu_huynh: 'Tin phụ huynh và vinh danh',
  gui_thong_bao: 'Gửi thông báo',
}
export const tenViec = (nguon: string): string => TEN_NGUON_NHAT_KY[nguon] ?? 'Một việc của máy'
export const chuLoiMay = (nguon: string): string => `${tenViec(nguon)} lỗi, A.I Đỗ Đại Học sẽ thử lại`

/** Ghi MỘT lỗi. Trả `true` khi thật sự ghi thêm dòng (không trùng trong 30 phút, có bảng). */
export async function ghiLoiMay(env: Env, nguon: string, nowMs: number = Date.now()): Promise<boolean> {
  try {
    const r = await env.DB.prepare("INSERT INTO nhat_ky_may (luc, nguon, muc, chu) SELECT ?, ?, 'loi', ? WHERE NOT EXISTS (SELECT 1 FROM nhat_ky_may WHERE nguon = ? AND luc >= ?)")
      .bind(new Date(nowMs).toISOString(), nguon, chuLoiMay(nguon), nguon, new Date(nowMs - PHUT_CHONG_TRUNG * 60_000).toISOString()).run()
    if (!r.meta?.changes) return false
    await env.DB.prepare('DELETE FROM nhat_ky_may WHERE id <= (SELECT id FROM nhat_ky_may ORDER BY id DESC LIMIT 1 OFFSET ?)').bind(TOI_DA_DONG_NHAT_KY).run()
    return true
  } catch {
    return false
  }
}
