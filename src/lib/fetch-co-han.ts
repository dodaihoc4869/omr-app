// `fetch` CÓ HẠN CHỜ — tách khỏi exam-api.ts (05/10, tối ưu mở app học sinh) để màn ĐĂNG NHẬP học sinh gọi máy chủ mà không phải
// tải cả exam-api (≈ 16 KB gzip + bộ chấm, đề riêng…) trước khi hiện. exam-api.ts nhập lại `fetchCoHan` từ đây (một bản duy nhất).

/** Giới hạn chờ mặc định, tính bằng giây — CÙNG giá trị `HAN_GIAY` của exam-api.ts (phép kiểm han-goi-nang-0809 giữ hằng ấy ở đó).
 *
 * LỖI ĐÃ DÍNH 04-09: nút "Copy link" đứng mãi ở "Đang tạo…". `fetch` KHÔNG tự
 * bỏ cuộc — mạng chập hoặc Apps Script nghẹn là lời hứa treo vĩnh viễn, nút
 * kẹt ở trạng thái đang chạy và thầy không biết nên chờ hay bấm lại. Mọi lệnh
 * gọi máy chủ từ nay đều có hạn, hết hạn thì báo thẳng. */
export const HAN_GIAY = 25

/** `fetch` có hạn chờ. Không dùng thẳng AbortSignal.timeout vì Safari cũ
 * (iPhone đời trước) chưa có — tự dựng bằng AbortController cho chắc. */
export async function fetchCoHan(url: string, init: RequestInit, giay: number): Promise<Response> {
  const bo = new AbortController()
  const hen = setTimeout(() => bo.abort(), giay * 1000)
  try {
    return await fetch(url, { ...init, signal: bo.signal })
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new Error(`Máy chủ không trả lời sau ${giay} giây. Kiểm tra mạng rồi thử lại.`)
    }
    throw e
  } finally {
    clearTimeout(hen)
  }
}
