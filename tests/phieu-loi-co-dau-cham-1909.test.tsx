// SỬA LỖI (Code 4, 19/09): màn "Không mở được báo cáo" của trang phiếu công khai nối câu lỗi của máy với câu hướng dẫn
// bằng đúng MỘT dấu cách — `{loi} {huongDan}` — nên câu lỗi không tự kết thúc bằng dấu chấm thì ra hai câu dính liền:
//   "Máy chủ trả lỗi HTTP 503 Link vẫn còn dùng được, chỉ là máy chủ đang bận. …"
//   "Chưa cấu hình được máy chủ Phụ huynh nhắn lại cho Thầy Đỗ Đại Học …"
// Phụ huynh mở link Zalo gặp đúng lúc máy chủ bận (HTTP 5xx) là thấy câu này.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import PhieuScreen from '../src/screens/PhieuScreen'

const g = vi.hoisted(() => ({ url: 'https://may.test/exec', loi: '' }))
vi.mock('../src/lib/exam-db', async (goc) => ({ ...(await goc<typeof import('../src/lib/exam-db')>()), loadScriptUrlHoacMacDinh: async () => g.url }))
vi.mock('../src/lib/exam-api', async (goc) => ({
  ...(await goc<typeof import('../src/lib/exam-api')>()),
  layPhieu: async () => {
    throw new Error(g.loi)
  },
}))

afterEach(() => {
  cleanup()
  window.history.replaceState(null, '', '/')
  g.url = 'https://may.test/exec'
})

async function moLinkHong(loi: string, url = 'https://may.test/exec') {
  g.loi = loi
  g.url = url
  window.history.replaceState(null, '', '/#ABCDEFGHJK')
  render(<PhieuScreen />)
  await waitFor(() => expect(screen.getByText('Không mở được báo cáo')).toBeTruthy())
  return (document.querySelector('.bc div div:nth-child(2)') as HTMLElement).textContent!
}

describe('câu lỗi và câu hướng dẫn không dính vào nhau', () => {
  it('máy chủ bận (HTTP 503, câu lỗi không có dấu chấm): có dấu chấm trước câu "Link vẫn còn dùng được"', async () => {
    const t = await moLinkHong('Máy chủ trả lỗi HTTP 503')
    expect(t).toContain('Máy chủ trả lỗi HTTP 503. Link vẫn còn dùng được')
  })

  it('chưa cấu hình máy chủ: có dấu chấm trước câu "Phụ huynh nhắn lại cho Thầy"', async () => {
    const t = await moLinkHong('x', '')
    expect(t).toContain('Chưa cấu hình được máy chủ. Phụ huynh nhắn lại cho Thầy Đỗ Đại Học')
  })

  it('câu lỗi đã kết thúc bằng dấu câu thì KHÔNG thêm dấu chấm thừa (. ! ? …)', async () => {
    for (const [loi, doan] of [
      ['Báo cáo này thuộc phiên bản khác, Thầy cần gửi lại link mới.', 'link mới. Phụ huynh'],
      ['Máy chủ không trả lời sau 90 giây. Kiểm tra mạng rồi thử lại.', 'thử lại. Link vẫn còn'],
      ['Sao lại thế?', 'thế? Phụ huynh'],
      ['Mạng chập chờn…', 'chờn… Phụ huynh'],
    ] as const) {
      const t = await moLinkHong(loi)
      expect(t, loi).toContain(doan)
      expect(t, loi).not.toMatch(/[.!?…]\./)
      cleanup()
    }
  })
})
