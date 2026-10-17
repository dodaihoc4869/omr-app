// Mạng mất lúc tải mô-đun hỏi: các nút vẫn nhận lỗi đúng hợp đồng, không kẹt vì Promise bị từ chối.
import { expect, it, vi } from 'vitest'
vi.mock('../src/lib/hoi-them-thay-api', () => { throw new Error('Không tải được mảnh mạng') })
import { guiCauKiem, guiThay, hoiThay, hoiThemThay, luyenNen, nopLuyenNen, thangGo } from '../src/lib/loi-giai-api'

it('mảnh nạp lỗi không làm các lệnh hỏi và luyện bị văng lỗi', async () => {
  for (const p of [hoiThay('Q', 'tu_luyen'), hoiThemThay('Q', 'luyen', 'em hỏi'), guiCauKiem('Q', 1, '2', 3), guiThay('Q', 1, 'em hỏi'), luyenNen('N'), nopLuyenNen('N', '1', 'Q')]) {
    await expect(p).resolves.toMatchObject({ ok: false, loi: expect.any(String) })
  }
  await expect(thangGo('Q')).resolves.toBeNull()
})
