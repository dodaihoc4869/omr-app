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

// ĐỐI TƯỢNG ĐÃ CÓ (31/10, thầy «máy chủ chạy cả trăm ngàn em cùng lúc»). Đo lệnh nóng giống thật: mỗi isolate MỚI gửi 59 lệnh `CREATE … IF NOT EXISTS`
// (6 lượt GHI — D1 coi DDL là ghi, giữ khoá ghi) dù bảng đã có từ lâu = 39% câu D1 của một lần mở Sảnh lạnh; ngăn mỗi em ⇒ mỗi isolate ngăn mới trả lại.
// Nay: mỗi isolate đọc MỘT lần tên mọi đối tượng (`sqlite_master`, đệm 10 phút theo D1 gốc); nhóm mà MỌI câu là `CREATE … IF NOT EXISTS <tên>` và mọi tên
// đã có ⇒ coi như đã chạy (không gửi gì) — đúng kết quả của lệnh cũ (IF NOT EXISTS trên đối tượng đã có là lệnh rỗng). Nhóm có câu khác (ALTER, INSERT…),
// thiếu tên nào, hay đọc tên lỗi ⇒ chạy lô như cũ.
const RE_TAO = /^\s*CREATE\s+(?:UNIQUE\s+)?(?:TABLE|INDEX|TRIGGER|VIEW)\s+IF\s+NOT\s+EXISTS\s+["`[]?(\w+)/i
const tenCuaNhom = new WeakMap<readonly string[], string[] | null>()
function tenTao(lenh: readonly string[]): string[] | null {
  if (tenCuaNhom.has(lenh)) return tenCuaNhom.get(lenh)!
  const ten: string[] = []
  for (const s of lenh) { const m = RE_TAO.exec(s); if (!m) { tenCuaNhom.set(lenh, null); return null } ten.push(m[1]!) }
  tenCuaNhom.set(lenh, ten)
  return ten
}
const HAN_DOI_TUONG_MS = 10 * 60_000
const doiTuongTheoDb = new WeakMap<object, { luc: number; p: Promise<Set<string> | null> }>()
function docDoiTuong(env: Env, goc: object): Promise<Set<string> | null> {
  const now = Date.now(), co = doiTuongTheoDb.get(goc)
  if (co && now - co.luc >= 0 && now - co.luc < HAN_DOI_TUONG_MS) return co.p
  let p: Promise<Set<string> | null>
  try {
    p = env.DB.prepare("SELECT name FROM sqlite_master WHERE type IN ('table', 'index', 'trigger', 'view')").all<{ name: string }>()
      .then((r) => new Set((r.results ?? []).map((x) => String(x.name))), () => null)
  } catch { p = Promise.resolve(null) } // D1 lạ (không có `all`) ⇒ chạy lô như cũ
  doiTuongTheoDb.set(goc, { luc: now, p })
  return p
}
export function chayDdlMotLan(env: Env, nhom: string, lenh: readonly string[]): Promise<void> {
  const goc = dbGoc(env.DB as unknown as object)
  let m = daChay.get(goc)
  if (!m) { m = new Map(); daChay.set(goc, m) }
  let p = m.get(nhom)
  if (!p) {
    const bang = m
    const chay = () => env.DB.batch(lenh.map((s) => env.DB.prepare(s))).then(() => undefined)
    const ten = tenTao(lenh)
    const xong = p = ten
      ? docDoiTuong(env, goc).then((co) => (co && ten.every((t) => co.has(t)) ? undefined : chay().then(() => { if (co) for (const t of ten) co.add(t) })))
      : chay()
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
