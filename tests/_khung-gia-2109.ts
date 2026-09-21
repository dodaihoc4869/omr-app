// Đồng hồ khung hình GIẢ dùng chung cho test màn Bảng tin sàn: requestAnimationFrame chỉ chạy khi test gọi `chay(n)` — KHÔNG phụ thuộc rAF / timer thật của jsdom
// (máy tải nặng, cả bộ vitest chạy song song, làm khung hình thật trễ ⇒ test đỏ oan; Boss soát 21/09). Gỡ bằng vi.unstubAllGlobals() ở afterEach như các stub khác.
import { act } from '@testing-library/react'
import { vi } from 'vitest'

export function datKhungGia() {
  let hang: Array<[number, FrameRequestCallback]> = []
  let id = 0
  let dongHo = performance.now()
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { hang.push([++id, cb]); return id })
  vi.stubGlobal('cancelAnimationFrame', (h: number) => { hang = hang.filter(([i]) => i !== h) })
  return {
    /** Chạy n khung liên tiếp (mỗi khung 16 ms giả), trong act. */
    chay: (n = 1) => act(() => { for (let k = 0; k < n; k++) { const ds = hang; hang = []; dongHo += 16; ds.forEach(([, cb]) => cb(dongHo)) } }),
    /** Số lần đã xin khung hình từ lúc đặt. */
    soXin: () => id,
    /** Số yêu cầu còn treo. */
    dangCho: () => hang.length,
  }
}
