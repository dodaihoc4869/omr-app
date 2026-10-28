// MỐC ĐỌC BẢN SAO D1 (28/10, máy chủ server/src/ban-sao-doc.ts): Sảnh / đếm sau câu / mở chặng đọc bản sao D1 gần nhất thay vì D1 chính.
// Máy em giữ MỐC (`x-d1-bookmark`) của lượt đọc gần nhất và gửi lại ⇒ không bao giờ thấy số cũ hơn lần trước. Vừa GHI (mọi lệnh game khác: nộp câu, làm lại…)
// mà chưa có mốc mới hơn lần ghi ⇒ gửi `x-d1-tuoi: 1` (lượt đầu đọc tại D1 chính, thấy chắc câu vừa nộp). Mở lại app trong 60 giây sau lần ghi ⇒ cũng `tuoi`.
// Chỉ là mốc thứ tự của D1 (không dữ liệu học sinh, không đáp án). Chỉ giữ trong bộ nhớ; localStorage chỉ giữ GIỜ của lần ghi gần nhất.

/** Lệnh đọc bản sao — PHẢI khớp `LENH_BAN_SAO` của máy chủ. */
export const LENH_DOC_BAN_SAO: ReadonlySet<string> = new Set(['hoc-tap-sanh', 'hoc-tap-dem', 'hoc-tap-start'])
/** Khoá localStorage: giờ (ms) lần ghi gần nhất — đoạn mã hỏi sớm lúc mở app (nap-truoc-man-em.ts) cũng đọc khoá này. */
export const KHOA_GHI_D1 = 'ddh.d1ghi'
export const TUOI_SAU_GHI_MS = 60_000

let moc: string | null = null
let soGhi = 0
let mocSauGhi = 0

function gioGhiCu(): number {
  try { return Number(globalThis.localStorage?.getItem(KHOA_GHI_D1)) || 0 } catch { return 0 }
}

/** Gọi TRƯỚC khi gửi `POST /game-v2/<lenh>`: đầu cần thêm + hàm nhận phản hồi (giữ mốc mới). */
export function dauMocD1(lenh: string, now = Date.now()): { dau: Record<string, string>; nhan: (r: Response) => void } {
  if (!LENH_DOC_BAN_SAO.has(lenh)) {
    soGhi++
    try { globalThis.localStorage?.setItem(KHOA_GHI_D1, String(now)) } catch { /* chỉ là tăng tốc */ }
    return { dau: {}, nhan: () => {} }
  }
  const luc = soGhi
  const tuoi = soGhi > mocSauGhi || (!moc && now - gioGhiCu() < TUOI_SAU_GHI_MS)
  const dau: Record<string, string> = { 'x-d1-ban': '1' }
  if (tuoi) dau['x-d1-tuoi'] = '1'
  else if (moc) dau['x-d1-bookmark'] = moc
  return {
    dau,
    nhan: (r) => {
      let m: string | null = null
      try { m = r.headers.get('x-d1-bookmark') } catch { m = null }
      if (m && luc === soGhi) { moc = m; mocSauGhi = luc } // có lệnh ghi gửi đi trong lúc chờ ⇒ mốc này có thể chưa gồm lần ghi ấy ⇒ không nhận
    },
  }
}

/** Test: về trạng thái đầu. */
export function datLaiMocD1(): void { moc = null; soGhi = 0; mocSauGhi = 0 }
