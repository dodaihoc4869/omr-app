// DDL LÚC CHẠY — MỘT LẦN MỖI ISOLATE (tối ưu máy chủ 28/09, việc 5).
// Vì sao: CI/D1 mới không chạy migration nên vài bảng CHỈ-THÊM được tạo tại chỗ bằng `CREATE TABLE IF NOT EXISTS` — trước đây chạy LẠI ở MỌI lượt ghi,
// từng lệnh nối tiếp (srs2-sua: 4 vòng; buổi học: 2 vòng; nhận xét ca: 1; ngày bắt đầu: 1) ≈ 300–400 ms mỗi vòng.
// Nay: cả nhóm lệnh đi MỘT `DB.batch` (một vòng), và chỉ LẦN ĐẦU trong isolate (cờ Promise trong bộ nhớ, khoá theo D1 gốc + tên nhóm).
// Lỗi ⇒ bỏ cờ (lượt sau thử lại) và NÉM như cũ (nơi gọi vốn để lỗi DDL nổi lên).
import type { Env } from './kieu'
import { dbGoc } from './cau-hinh-dem'

const daChay = new WeakMap<object, Map<string, Promise<void>>>()

export function chayDdlMotLan(env: Env, nhom: string, lenh: readonly string[]): Promise<void> {
  const goc = dbGoc(env.DB as unknown as object)
  let m = daChay.get(goc)
  if (!m) { m = new Map(); daChay.set(goc, m) }
  let p = m.get(nhom)
  if (!p) {
    const bang = m
    p = env.DB.batch(lenh.map((s) => env.DB.prepare(s))).then(() => undefined)
    p.catch(() => { if (bang.get(nhom) === p) bang.delete(nhom) })
    m.set(nhom, p)
  }
  return p
}
