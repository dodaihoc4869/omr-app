// XEM LẠI LIVE — LỆNH CỦA APP THẦY (thầy chốt build 11/11; hợp đồng src/lib/live/xem-lai-kieu.ts). Mảnh nạp lười cùng màn Lịch sử Live.
import { goiLenh, type KetQuaLenh } from '../../../lib/goi-lenh-thay'
import type { TraLiveDsGv, TraLiveXoa } from '../../../lib/live/xem-lai-kieu'

const CHUA_CO = 'Máy chủ chưa có Lịch sử Live.'
export type BuoiGv = TraLiveDsGv['buoi'][number]

export async function taiDsLive(): Promise<KetQuaLenh<TraLiveDsGv>> {
  const r = await goiLenh('/gv/live-ds', {}, CHUA_CO)
  if (!r.ok) return r
  const d = r.du as unknown as Partial<TraLiveDsGv>
  return { ok: true, du: { buoi: Array.isArray(d.buoi) ? d.buoi : [], tongByte: Number(d.tongByte) || 0 } }
}
export async function doiTenLive(id: string, ten: string): Promise<KetQuaLenh<{ tenThay: string | null }>> {
  const r = await goiLenh('/gv/live-doi-ten', { id, ten }, CHUA_CO)
  return r.ok ? { ok: true, du: { tenThay: typeof r.du.tenThay === 'string' ? r.du.tenThay : null } } : r
}
export async function xoaLive(ids: readonly string[]): Promise<KetQuaLenh<TraLiveXoa>> {
  const r = await goiLenh('/gv/live-xoa', { ids }, CHUA_CO, 'Máy chủ đang xoá chậm. Buổi chưa xoá xong sẽ tự xoá tiếp.')
  if (!r.ok) return r
  const d = r.du as unknown as Partial<TraLiveXoa>
  return { ok: true, du: { xoa: Array.isArray(d.xoa) ? d.xoa : [], conDo: Array.isArray(d.conDo) ? d.conDo : [], byte: Number(d.byte) || 0 } }
}
export async function dungLaiLive(id: string): Promise<KetQuaLenh<Record<string, unknown>>> { return goiLenh('/gv/live-dung-lai', { id }, CHUA_CO) }

/** Số buổi đang xử lý (chip «1 đang xử lý» cạnh nút Live ở Hôm nay). Lỗi / chưa có lệnh ⇒ 0 (không hiện chip). */
export async function demDangXuLy(): Promise<number> {
  const r = await taiDsLive()
  return r.ok ? r.du.buoi.filter((b) => b.trangThai === 'dang_xu_ly').length : 0
}
