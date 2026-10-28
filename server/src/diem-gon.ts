// Bản GỌN điểm kỹ năng của em (`omni_p_gon`, chỉ-thêm — thử tải 270 em 28/10): một dòng JSON [vkn_id, p, trang_thai] thay ~2.770 dòng omni_p_vkn ở mỗi lượt
// Sảnh / mở chặng. Ghi cùng lô ảnh chụp đêm (omni-d1.ts `chupHoSoTho`) và cất nền ở lượt đọc đầu (goi-bai-7.ts `docDiemKyNangGon`).
import type { Env } from './kieu'

export const LENH_BANG_DIEM_GON = ['CREATE TABLE IF NOT EXISTS omni_p_gon (sbd TEXT PRIMARY KEY, moc TEXT NOT NULL, json TEXT NOT NULL)']
/** Lệnh ghi bản gọn của một em (mảng [vkn_id, p, trang_thai] theo vkn_id). */
export const lenhDiemGon = (env: Env, sbd: string, moc: string, rows: readonly (readonly [string, number, string])[]) =>
  env.DB.prepare('INSERT OR REPLACE INTO omni_p_gon (sbd, moc, json) VALUES (?,?,?)').bind(sbd, moc, JSON.stringify([...rows].sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))))
