// ĐOÀN HỘ TỐNG · GAME HÓA 2.0 — kiểu dữ liệu riêng của chế độ 2.0 (docs/hop-dong-game-hoa-2.md). Chỉ-thêm: không đụng `doan-kieu.ts`.
// Cờ `cau_hinh.game_hoa_2` TẮT (hoặc máy chủ cũ chưa có lệnh `hoa2-sanh`) ⇒ `docHoa2` trả null ⇒ Đoàn chạy y hệt giao diện cũ.
import type { CauXem } from '../doan-kieu'

/** Gợi ý M3 máy chủ gửi kèm câu ôn: Phần I gạch 2 phương án SAI (không bao giờ là đáp án), Phần II/III mở trước ô Kiến thức cốt lõi. */
export interface GoiYM3 { gach?: string[]; cotLoi?: string }

/** Phần của `hoa2-sanh` mà Đoàn cần: số "ổ phục kích" (câu ôn còn lại hôm nay) và số câu của Đảo đang chờ. */
export interface Hoa2Xem { doanCon: number; daoCon: number }

const so = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0)

/** Đọc phản hồi `hoa2-sanh`. Chỉ khi máy chủ nói RÕ `cheDo2: true` (và em đã có thần thú) mới vào giao diện 2.0. */
export function docHoa2(r: unknown): Hoa2Xem | null {
  if (!r || typeof r !== 'object') return null
  const x = r as { ok?: unknown; cheDo2?: unknown; canChonThu?: unknown; doan?: { con?: unknown } | null; dao?: { con?: unknown } | null }
  if (x.ok === false || x.cheDo2 !== true || x.canChonThu === true) return null
  return { doanCon: so(x.doan?.con), daoCon: so(x.dao?.con) }
}

/** OMNI 3 (05/10): `hoa2-sanh` có `omni.bat === true` ⇒ công tắc OMNI áp cho em (Đoàn gửi thêm `msLam`/`tuTin` trong `doan-nop`, có chip "Chưa chắc"). */
export function coOmniTrongSanh(r: unknown): boolean {
  const o = r && typeof r === 'object' ? (r as { omni?: unknown }).omni : null
  return !!o && typeof o === 'object' && (o as { bat?: unknown }).bat === true
}

/** CẨN THẬN (đặc tả 4.6; chỉ-thêm): `hoa2-sanh` → `omni.canThan === true` (OMNI bật ∧ Sơ ý > 7%) ⇒ Đoàn hiện chip "Soát lại đơn vị và số liệu" ở câu Phần III + thẻ "Sai vì bước nào?". Vắng ⇒ y hệt hôm nay. */
export function canThanTrongSanh(r: unknown): boolean {
  const o = r && typeof r === 'object' ? (r as { omni?: unknown }).omni : null
  return coOmniTrongSanh(r) && (o as { canThan?: unknown }).canThan === true
}

/** Gợi ý M3 của câu đang chơi (máy chủ gửi `doan.cau.goiY` khi em đủ điều kiện). Chỉ nhận chữ cái A–D để gạch; `cotLoi` phải là chữ thật. */
export function goiYCuaCau(cau: CauXem | undefined): GoiYM3 | null {
  const g = (cau as (CauXem & { goiY?: unknown }) | undefined)?.goiY
  if (!g || typeof g !== 'object') return null
  const o = g as { gach?: unknown; cotLoi?: unknown }
  const gach = Array.isArray(o.gach) ? [...new Set(o.gach.map(String).filter(c => /^[ABCD]$/.test(c)))] : []
  const cotLoi = typeof o.cotLoi === 'string' && o.cotLoi.trim() && !o.cotLoi.includes('[object Object]') ? o.cotLoi.trim() : ''
  if (gach.length) return { gach }
  if (cotLoi) return { cotLoi }
  return null
}
