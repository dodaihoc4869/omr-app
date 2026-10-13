import type { Env } from './kieu'

/**
 * ĐỢT 22 (thầy 13/10: "tối ưu máy chủ chuyên sâu hơn nữa, đảm bảo … máy chủ phản hồi tức thì") · DẤU KHO CÂU rẻ.
 * `game_v2_question` CHỈ được ghi lại cùng `game_v2_index` trong MỘT lô (`lapChiMucTo`, game-v2-bank.ts: xoá câu cũ của tờ, ghi câu mới, ghi mốc)
 * ⇒ (số tờ đã lập chỉ mục, mốc lập chỉ mục mới nhất) đổi ⇔ câu trong kho đổi (sửa đề/đáp án/duyệt, thêm/bớt tờ). Một lệnh đọc bảng nhỏ (một dòng/tờ)
 * thay cho đọc lại hàng nghìn câu kèm JSON mỗi khi đệm trong isolate vừa hết hạn mà kho không đổi (số đo 13/10: danh mục Hành trình 524 lần/3 giờ ×
 * 57 ms, câu của các tờ trong phạm vi 444 lần/3 giờ × 65 ms). Đệm dùng dấu này vẫn giữ HẠN TỐI ĐA riêng để chắc chắn tự làm mới.
 */
export const SQL_DAU_KHO_CAU = `SELECT COUNT(*)||'|'||COALESCE(MAX(indexed_at),'') d FROM game_v2_index`

/** Dấu kho hiện tại; lỗi đọc ⇒ '' (nơi gọi coi như "không chắc" ⇒ đọc lại đầy đủ như cũ). */
export async function dauKhoCau(env: Env): Promise<string> {
  try {
    const r = await env.DB.prepare(SQL_DAU_KHO_CAU).first<{ d: string | null }>()
    return String(r?.d ?? '')
  } catch {
    return ''
  }
}
