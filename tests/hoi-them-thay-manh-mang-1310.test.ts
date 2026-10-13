// Mảnh tải khi bấm thất bại phải trả lỗi mạng để giao diện mở lại nút và giữ câu hỏi.
import { describe, expect, it, vi } from 'vitest'

vi.mock('../src/lib/hoi-them-thay-api', () => { throw new Error('Không tải được mảnh hỏi thêm.') })
import { hoiThemThay } from '../src/lib/loi-giai-api'

describe('Hỏi thêm khi mất mảnh mã', () => {
  it('không đẩy lỗi không bắt được ra luồng gửi câu hỏi', async () => {
    await expect(hoiThemThay('Q', 'luyen_de', 'Em hỏi cách làm')).resolves.toMatchObject({
      ok: false, ma: 'mang', loi: 'Chưa nối được máy chủ. Em thử lại sau.',
    })
  })
})
