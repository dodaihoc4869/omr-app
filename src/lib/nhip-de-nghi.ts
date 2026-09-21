// `nhipDeNghi` CỦA MÁY CHỦ (hợp đồng docs/hop-dong-suc-khoe-may-chu-2109.md, Code 3 ↔ Code 2/4): máy chủ tự đo p95 và đề nghị máy khách GIÃN nhịp hỏi nền:
// `heSo` 1 (tốt) | 2 (bận) | 4 (nghẽn) — HỆ SỐ, không phải giây: nhân vào nhịp nền GỐC của mình rồi kẹp trần của mình.
// Luật máy khách: lấy MAX của 3 phản hồi gần nhất (mỗi lượt có thể rơi vào isolate khác, số đo khác nhau); chỉ về 1 khi 3 phản hồi LIỀN đều heSo 1, hoặc 120 giây không
// có phản hồi nào. KHÔNG dùng heSo để quyết việc quan trọng: nộp bài / hàng đợi nộp lại không bao giờ bị trì hoãn vì heSo.
// Nguồn: header `x-nhip-de-nghi` (Worker gắn song song thân JSON để máy khách không phải clone + parse mọi phản hồi) — chưa có header ⇒ heSo 1, không hỏng gì.

export type HeSoNhip = 1 | 2 | 4

export const HEADER_NHIP_DE_NGHI = 'x-nhip-de-nghi'
export const SO_MAU_GAN_NHAT = 3
export const HET_HAN_MS = 120_000
/** Trần chung: nhịp sau khi nhân hệ số không vượt mức này (hoặc chính nhịp gốc nếu gốc đã lớn hơn). */
export const TRAN_NHIP_MAC_DINH_MS = 300_000

const mau: { heSo: HeSoNhip; luc: number }[] = []

/** Đọc một giá trị thô (header / trường JSON) thành hệ số hợp lệ; lạ ⇒ null. */
export function docHeSo(v: unknown): HeSoNhip | null {
  const n = typeof v === 'string' ? Number(v.trim()) : typeof v === 'number' ? v : Number.NaN
  return n === 1 || n === 2 || n === 4 ? n : null
}

/** Ghi một phản hồi (giữ 3 cái gần nhất). Hệ số lạ ⇒ bỏ qua (không tính là phản hồi tốt). */
export function ghiHeSo(v: unknown, now: number = Date.now()): void {
  const h = docHeSo(v)
  if (h === null) return
  mau.push({ heSo: h, luc: now })
  if (mau.length > SO_MAU_GAN_NHAT) mau.splice(0, mau.length - SO_MAU_GAN_NHAT)
}

/** Hệ số hiện hành: MAX của các mẫu gần nhất (⇒ chỉ 1 khi cả 3 liền đều 1); mẫu cuối quá 120 giây ⇒ 1. */
export function heSoNhip(now: number = Date.now()): HeSoNhip {
  const cuoi = mau[mau.length - 1]
  if (!cuoi || now - cuoi.luc > HET_HAN_MS) return 1
  return mau.reduce<HeSoNhip>((a, m) => (m.heSo > a ? m.heSo : a), 1)
}

export interface TuyChonHeSo {
  /** Hệ số tối đa được áp cho vòng này (mặc định 4). Hiện diện = 1 (máy chủ coi "online" trong 90 s nên không được giãn). Vòng trực tiếp = 2. */
  heSoToiDa?: number
  /** Trần nhịp sau khi nhân (ms); mặc định max(gốc, 300 s). */
  tranMs?: number
}

/** Nhịp gốc × hệ số (kẹp theo `heSoToiDa` và trần). Không bao giờ dưới nhịp gốc. */
export function nhipSauHeSo(coSoMs: number, o: TuyChonHeSo = {}, now: number = Date.now()): number {
  const h = Math.min(heSoNhip(now), Math.max(1, o.heSoToiDa ?? 4))
  if (h <= 1) return coSoMs
  const tran = Math.max(coSoMs, o.tranMs ?? TRAN_NHIP_MAC_DINH_MS)
  return Math.min(tran, coSoMs * h)
}

/** Xoá bộ nhớ mẫu (test). */
export function datLaiHeSo(): void {
  mau.length = 0
}

let daCai = false
/**
 * Bọc `window.fetch` MỘT LẦN: CHỈ ĐỌC header `x-nhip-de-nghi` của phản hồi rồi trả nguyên phản hồi (không clone, không đụng thân, không đổi lỗi/độ trễ).
 * Gọi ở đầu app (main.tsx). Mọi lỗi trong việc đọc header đều bị nuốt.
 */
export function batDocNhipDeNghi(cua: { fetch?: typeof fetch } = typeof window !== 'undefined' ? window : {}): void {
  if (daCai || typeof cua.fetch !== 'function') return
  daCai = true
  const goc = cua.fetch.bind(cua)
  cua.fetch = (async (...args: Parameters<typeof fetch>) => {
    const res = await goc(...args)
    try {
      const v = res.headers?.get(HEADER_NHIP_DE_NGHI)
      if (v) ghiHeSo(v)
    } catch {
      /* không đọc được header ⇒ bỏ qua */
    }
    return res
  }) as typeof fetch
}

/** Chỉ để test: cho phép cài lại. */
export function datLaiCai(): void {
  daCai = false
}
