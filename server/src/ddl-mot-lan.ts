// DDL LÚC CHẠY — MỘT LẦN MỖI ISOLATE (tối ưu máy chủ 28/09, việc 5).
// Vì sao: CI/D1 mới không chạy migration nên vài bảng CHỈ-THÊM được tạo tại chỗ bằng `CREATE TABLE IF NOT EXISTS` — trước đây chạy LẠI ở MỌI lượt ghi,
// từng lệnh nối tiếp (srs2-sua: 4 vòng; buổi học: 2 vòng; nhận xét ca: 1; ngày bắt đầu: 1) ≈ 300–400 ms mỗi vòng.
// Nay: cả nhóm lệnh đi MỘT `DB.batch` (một vòng), và chỉ LẦN ĐẦU trong isolate (cờ Promise trong bộ nhớ, khoá theo D1 gốc + tên nhóm).
// Lỗi ⇒ bỏ cờ (lượt sau thử lại) và NÉM như cũ (nơi gọi vốn để lỗi DDL nổi lên).
import type { Env } from './kieu'
import { dbGoc } from './cau-hinh-dem'

const daChay = new WeakMap<object, Map<string, Promise<void>>>()
/** Nhóm DDL đã CHẠY XONG (thành công) trong isolate, theo D1 gốc — chỉ để nơi gọi quyết có ĐỌC ĐOÁN TRƯỚC hay không (đợt 18), không đổi kết quả. */
const daXong = new WeakMap<object, Set<string>>()

export function chayDdlMotLan(env: Env, nhom: string, lenh: readonly string[]): Promise<void> {
  const goc = dbGoc(env.DB as unknown as object)
  let m = daChay.get(goc)
  if (!m) { m = new Map(); daChay.set(goc, m) }
  let p = m.get(nhom)
  if (!p) {
    const bang = m
    const xong = p = env.DB.batch(lenh.map((s) => env.DB.prepare(s))).then(() => undefined)
    p.then(() => { if (bang.get(nhom) !== xong) return; let t = daXong.get(goc); if (!t) { t = new Set(); daXong.set(goc, t) } t.add(nhom) }, () => { if (bang.get(nhom) === xong) bang.delete(nhom) })
    m.set(nhom, p)
  }
  return p
}

/**
 * GỬI SỚM, SONG SONG nhiều nhóm DDL (Gói R 15/10 — luật thầy 13/10 "sửa xong máy chủ phải nhanh hơn"). Trước: mỗi nhóm gửi đúng lúc hàm của nó cần, qua bản gộp
 * đọc của lượt ⇒ lệnh tạo bảng là lệnh GHI, mọi lượt đọc gửi sau phải chờ nó; isolate mới mở Sảnh tốn 5 đợt D1 nối tiếp chỉ để tạo bảng. Nay nơi gọi biết sớm
 * lượt sẽ cần nhóm nào ⇒ gửi NGAY, mỗi nhóm MỘT lô riêng như cũ (lỗi nhóm nào chỉ nhóm ấy), đi thẳng D1 GỐC (`dbGoc`, không qua hàng rào ghi của bản gộp
 * đọc: `CREATE … IF NOT EXISTS` không đổi dữ liệu nên lượt đọc khác không phải chờ). Cùng cờ nhớ của `chayDdlMotLan` (khoá D1 gốc + tên nhóm) ⇒ hàm cần bảng
 * `await` đúng lời hứa đang bay; nhóm đã xong / đang chạy ⇒ không gửi gì. Lỗi ⇒ bỏ cờ như cũ (hàm cần bảng tự chạy lại và nhận lỗi ở đúng chỗ cũ). Không ném.
 */
export function guiDdlSom(env: Env, nhom: readonly (readonly [string, readonly string[]])[]): void {
  const goc = dbGoc(env.DB as unknown as object) as unknown as Env['DB']
  if (!goc || typeof (goc as { batch?: unknown }).batch !== 'function' || typeof (goc as { prepare?: unknown }).prepare !== 'function') return
  const envGoc = { ...env, DB: goc } as Env
  for (const [ten, lenh] of nhom) { try { chayDdlMotLan(envGoc, ten, lenh).catch(() => {}) } catch { /* D1 lạ ⇒ để hàm cần bảng tự chạy như cũ */ } }
}

/**
 * Nhóm DDL `nhom` đã chạy xong trong isolate này (D1 gốc của `env.DB`)?Dùng để ĐỌC ĐOÁN TRƯỚC chỉ khi không phải gửi lệnh tạo bảng (đợt 18): lệnh tạo bảng là
 * lệnh GHI — gửi sớm thì mọi lượt đọc gửi sau nó trong cùng lượt phải chờ nó (bản gộp đọc), có khi làm CHẬM thay vì nhanh. Chưa chạy / đang chạy / lỗi ⇒ false.
 */
export function ddlDaXong(env: Env, nhom: string): boolean {
  return !!daXong.get(dbGoc(env.DB as unknown as object))?.has(nhom)
}
