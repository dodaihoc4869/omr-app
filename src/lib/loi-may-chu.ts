// LỜI LỖI MÁY CHỦ TRÊN MÀN HỌC SINH (thầy chụp 28/10: «D1_ERROR: Currently processing a long-running export.» trên màn Kiểm tra ôn tập).
// Bảng dịch CHÍNH ở máy chủ (server/src/loi-may-chu.ts: mọi thân ok:false đã là câu Việt, máy chủ bận ⇒ 503 + ma/maLoi MAY_CHU_BAN). Tệp này là lớp chặn
// thứ hai, CHỈ dùng ở màn nạp khi bấm (Kiểm tra ôn tập, chặng Duo, Kim cương, Câu đã làm…) — không nằm trên đường mở app (LUẬT TỐC ĐỘ, dung sai 64 byte):
// chữ kỹ thuật tiếng Anh / lỗi JS ⇒ câu Việt; mất mạng ⇒ câu mạng; máy chủ bận ⇒ câu nhẹ + tự gửi lại lùi dần. THUẦN.

import { guiLaiKhiKetMang } from '../components/hoa2/api'

export const MA_MAY_CHU_BAN = 'MAY_CHU_BAN'
/** Câu cho em khi máy chủ bận (503 / MAY_CHU_BAN): bài không mất, máy tự gửi lại. */
export const CHU_MAY_CHU_BAN_EM = 'Máy chủ đang bận. Em cứ làm tiếp, bài vẫn được lưu trên máy và tự gửi khi máy chủ sẵn sàng.'
export const CHU_LOI_CHUNG = 'Máy chủ gặp trục trặc. Thử lại sau ít phút.'
export const CHU_MAT_MANG = 'Chưa kết nối được máy chủ. Kiểm tra mạng rồi thử lại.'

const RE_KY_THUAT = /D1_|SQLITE|no such (table|column)|constraint failed|TypeError|ReferenceError|RangeError|SyntaxError|Cannot read|Cannot set|is not a function|is not defined|is not iterable|Unexpected (token|end)|fetch failed|long-running|overloaded|Network connection lost|\bat \S+ \(|\[object /
const RE_CHU_VIET = /[À-ỹĐđ]/
const RE_MA = /^[a-z0-9_]{1,40}$/

/** Chữ lỗi này hiện được cho em chưa (có chữ Việt, không lẫn chữ kỹ thuật; hoặc là mã có tên). */
export function laChuLoiHienDuoc(chu: string): boolean {
  const s = chu.trim()
  if (!s) return false
  if (RE_MA.test(s)) return true
  return RE_CHU_VIET.test(s) && !RE_KY_THUAT.test(s)
}

/** Câu lỗi an toàn để hiện: chữ kỹ thuật ⇒ `macDinh`. */
export function chuLoiAnToan(chu: unknown, macDinh = CHU_LOI_CHUNG): string {
  return typeof chu === 'string' && laChuLoiHienDuoc(chu) ? chu : macDinh
}

/** Lỗi bắt được (Error / chuỗi) ⇒ câu an toàn để đặt vào ô lỗi. */
export function chuCuaLoi(e: unknown, macDinh = CHU_LOI_CHUNG): string {
  if (laLoiMayChuBan(e)) return CHU_MAY_CHU_BAN_EM
  const chu = e instanceof Error ? e.message : e
  if (typeof chu === 'string' && /Failed to fetch|NetworkError|Load failed|network error/i.test(chu)) return CHU_MAT_MANG
  return chuLoiAnToan(chu, macDinh)
}

/** Phản hồi / lỗi này là "máy chủ bận tạm thời" (503 hoặc maLoi MAY_CHU_BAN). */
export function laLoiMayChuBan(x: unknown, status?: number): boolean {
  if (status === 503) return true
  const o = x as { maLoi?: unknown; ma?: unknown } | null
  return !!o && typeof o === 'object' && (o.maLoi === MA_MAY_CHU_BAN || o.ma === MA_MAY_CHU_BAN)
}

/** Lỗi đường truyền / máy chủ bận: thử lại được, bản nháp giữ nguyên (không phải máy chủ từ chối hẳn). */
export function laLoiTamThoi(e: unknown): boolean {
  const ma = (e as { ma?: unknown } | null)?.ma
  return laLoiMayChuBan(e) || ma === 'het_gio' || ma === 'mat_mang'
}

/** Lùi dần khi thử lại: 1, 2, 4, 8, 15, 30 giây (trần 30 giây). */
export function choLuiDanMs(lan: number): number {
  return [1000, 2000, 4000, 8000, 15000, 30000][Math.max(0, Math.min(5, Math.floor(lan)))]
}

/**
 * Gửi lệnh CHỐNG TRÙNG (vd `answer` có khoá biên nhận): máy chủ bận (MAY_CHU_BAN) ⇒ chờ lùi dần 1, 2, 4, 8, 15 giây (≈ 30 giây) rồi gửi lại —
 * máy chủ khoá theo biên nhận nên gửi lại không ghi đôi, không cộng thưởng đôi. Lỗi khác ném ngay. `cho` thay được trong test.
 */
export async function guiLaiKhiBan<T>(goi: () => Promise<T>, cho: (ms: number) => Promise<void> = (ms) => new Promise((x) => setTimeout(x, ms))): Promise<T> {
  for (let lan = 0; ; lan++) {
    try {
      return await goi()
    } catch (e) {
      if (lan >= 5 || !laLoiMayChuBan(e)) throw e
      await cho(choLuiDanMs(lan))
    }
  }
}

/** Lệnh chống trùng của màn làm câu: lỗi đường truyền ⇒ gửi lại ngay (guiLaiKhiKetMang); máy chủ bận ⇒ lùi dần rồi gửi lại. */
export function guiLaiBenVung<T>(goi: () => Promise<T>): Promise<T> {
  return guiLaiKhiBan(() => guiLaiKhiKetMang(goi))
}
