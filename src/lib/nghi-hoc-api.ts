// NGHỈ HỌC / KHÔI PHỤC ĐI HỌC (thầy 04/11 «khôi phục bỏ đã nghỉ … tạo một công tắc khôi phục») — chỉ màn Học sinh của thầy dùng, nên TÁCH khỏi exam-api
// (exam-api nằm trong mảnh mà link phiếu `/p` và màn mở app thầy `/gv` tải sẵn — luật tốc độ). Gọi thẳng `/gv/nghi-hoc` (server/src/goi-cu.ts danhDauNghiHoc).
import { layDiaChiMayChu } from './dia-chi-may-chu'
import { HAN_GIAY, fetchCoHan } from './fetch-co-han'

/** Đánh dấu học sinh nghỉ học (`nghi` mặc định) hoặc KHÔI PHỤC đi học lại (`nghi = false`) — chỉ thầy (mã bí mật). */
export async function danhDauNghiHocApi(
  scriptUrl: string,
  secret: string,
  sbd: string,
  nghi = true,
): Promise<{ ok: boolean; sbd: string; daNghi: boolean; trangThai: string; error?: string }> {
  const base = await layDiaChiMayChu(scriptUrl)
  if (!base) throw new Error('Máy này chưa có địa chỉ máy chủ mới')
  const res = await fetchCoHan(`${base}/gv/nghi-hoc`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-ma-bi-mat': secret.trim() },
    body: JSON.stringify({ secret: secret.trim(), sbd, ...(nghi ? {} : { nghi: false }) }),
  }, HAN_GIAY)
  const r = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string }
  if (!res.ok || !r.ok) throw new Error(r.error || 'Cập nhật trạng thái thất bại')
  return r as { ok: boolean; sbd: string; daNghi: boolean; trangThai: string; error?: string }
}
