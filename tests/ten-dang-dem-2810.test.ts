// Tên dạng bài nhớ trong isolate (28/10 tối, giờ cao điểm): chỉ hỏi D1 mã CHƯA có; lỗi đọc không nhớ gì; hết hạn 30 phút ⇒ hỏi lại.
import { beforeEach, describe, expect, it } from 'vitest'
import { tenDangCoNho, xoaTenDangNho } from '../server/src/ten-dang-dem'

const T0 = Date.parse('2026-10-28T14:00:00Z')
const gia = (ten: Record<string, string>) => { const goi: string[][] = []; return { goi, hoi: async (j: string) => { const ds = JSON.parse(j) as string[]; goi.push(ds); return ds.filter((m) => ten[m]).map((m) => ({ ma: m, ten: ten[m] })) } } }
beforeEach(() => xoaTenDangNho())

describe('tenDangCoNho', () => {
  it('lần đầu hỏi D1; lần sau cùng mã ⇒ 0 lệnh; mã mới ⇒ chỉ hỏi mã mới; kết quả đủ như câu gốc', async () => {
    const d = gia({ A: 'Amine', B: 'Ester' })
    expect(await tenDangCoNho(['A', 'B'], d.hoi, T0)).toEqual(expect.arrayContaining([{ ma: 'A', ten: 'Amine' }, { ma: 'B', ten: 'Ester' }]))
    expect(await tenDangCoNho(['A', 'B', 'A'], d.hoi, T0 + 1000)).toHaveLength(2)
    expect(d.goi).toEqual([['A', 'B']])
    const d2 = gia({ C: 'Lipid' })
    await tenDangCoNho(['A', 'C'], d2.hoi, T0 + 2000)
    expect(d2.goi).toEqual([['C']])
  })
  it('mã không có tên ⇒ vắng, không nhớ (lần sau hỏi lại); lỗi đọc (null) ⇒ trả phần đã có', async () => {
    const d = gia({})
    expect(await tenDangCoNho(['X'], d.hoi, T0)).toEqual([])
    await tenDangCoNho(['X'], d.hoi, T0 + 1)
    expect(d.goi).toHaveLength(2)
    expect(await tenDangCoNho(['Y'], async () => null, T0)).toEqual([])
  })
  it('quá 30 phút ⇒ hỏi lại', async () => {
    const d = gia({ A: 'Amine' })
    await tenDangCoNho(['A'], d.hoi, T0)
    await tenDangCoNho(['A'], d.hoi, T0 + 31 * 60_000)
    expect(d.goi).toHaveLength(2)
  })
})
