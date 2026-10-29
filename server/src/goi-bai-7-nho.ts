// KẾ HOẠCH VỪA LẬP CỦA SẢNH (19/10 — thầy 16/10: "phần này load lâu quá, quét và tối ưu tốc độ tức thì"; 19/10: "tiếp tục hoàn thiện tốc độ đỉnh cao nhất, ổn định nhất").
// Đo cao điểm 16/10 (run 38911946041): sảnh và mở chặng CÙNG chạy `lapGoi7` (~0,2 s CPU + ~25 lệnh D1 mỗi lần); app mở chặng TRƯỚC ngay khi Hôm nay có số
// (mo-chang-truoc.ts) ⇒ Hôm nay → Học tiếp lập kế hoạch hai lần liền trong vài trăm mili giây.
// Sảnh nhớ kết quả `lapGoi7` theo (D1 gốc của isolate, SBD) tối đa NHO_KE_HOACH_MS. Mở chặng lấy ra MỘT lần (lấy là xoá) rồi đối chiếu với lượt đọc MỚI
// "đã làm hôm nay / vừa làm" (`docDaLamVaVuaLam7`, cùng đợt D1 đầu của lệnh) — lệch một câu ⇒ bỏ, lập lại như cũ. Mọi lệnh game khác của em đi qua isolate
// này (nộp câu, học cách giải, kiểm…) xoá bản nhớ của em (game-v2.ts).
import { dbGoc } from './cau-hinh-dem'

/** Tuổi tối đa của bản nhớ. App mở chặng trước NGAY khi sảnh trả về ⇒ thường dùng trong < 1 giây; ngắn để kế hoạch không cũ. */
export const NHO_KE_HOACH_MS = 8_000
/** Số bản nhớ tối đa mỗi isolate (bộ nhớ). */
export const NHO_TOI_DA = 24

export interface KeHoachNho<T> {
  luc: number
  lap: T
  /** Dấu "đã làm hôm nay / vừa làm" lúc sảnh lập — mở chặng đọc lại và so. */
  daLam: ReadonlySet<string>
  vuaLam: ReadonlySet<string>
  soVua: number
}

const BANG = new WeakMap<object, Map<string, KeHoachNho<unknown>>>()
const bangCua = (db: unknown): Map<string, KeHoachNho<unknown>> => {
  const g = dbGoc(db as object)
  let m = BANG.get(g)
  if (!m) { m = new Map(); BANG.set(g, m) }
  return m
}

export function nhoKeHoach7<T>(db: unknown, sbd: string, muc: KeHoachNho<T>): void {
  const m = bangCua(db)
  for (const [k, v] of m) if (!(muc.luc - v.luc >= 0 && muc.luc - v.luc < NHO_KE_HOACH_MS)) m.delete(k)
  m.delete(sbd) // ghi lại ⇒ lên «mới nhất»
  // 29/10 (đo cao điểm 28/10: 1 367 lượt `exceededMemory`/133 581 — isolate 128 MB bị giết kéo theo mọi lượt đang chạy): mỗi bản giữ cả kế hoạch `lap` (nhiều MB) — trần 2000 em cũ là quá tay.
  // Sảnh → Mở chặng cách nhau < 1 s nên chỉ cần vài chục bản; quá trần ⇒ bỏ bản CŨ NHẤT (không xoá cả bảng).
  while (m.size >= NHO_TOI_DA) m.delete(m.keys().next().value as string)
  m.set(sbd, muc as KeHoachNho<unknown>)
}

/** Lấy (và XOÁ) bản nhớ còn hạn của em; không có ⇒ null. */
export function layKeHoach7<T>(db: unknown, sbd: string, now: number): KeHoachNho<T> | null {
  const m = bangCua(db), v = m.get(sbd)
  m.delete(sbd)
  return v && now - v.luc >= 0 && now - v.luc < NHO_KE_HOACH_MS ? (v as KeHoachNho<T>) : null
}

export function boKeHoach7(db: unknown, sbd: string): void {
  BANG.get(dbGoc(db as object))?.delete(sbd)
}

export const cungTap = (a: ReadonlySet<string>, b: ReadonlySet<string>): boolean => a.size === b.size && [...a].every((x) => b.has(x))
