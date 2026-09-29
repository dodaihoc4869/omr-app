// Nút "Hỏi thầy" trên phiếu (thầy lệnh 29/09: mọi câu học sinh làm, trừ lúc kiểm tra): chỉ phiếu HỌC SINH (giao diện M3) có nút;
// phiếu in / phiếu của thầy không mọc thêm byte nào. Bấm nút ⇒ phiếu nhắn app `ddh-hoi-thay` kèm đúng qid.
import { describe, expect, it } from 'vitest'
import { dungPhieu, theCauHtml } from '../src/lib/html-phieu'
import type { CauLuyen } from '../src/lib/bai-tap-pdf'

const CAU = [
  { id: '12-X-I-1', phan: 'I', text: 'Chất nào là ester?', luaChon: ['A1', 'B1', 'C1', 'D1'], dapAn: 'B', chot: 'x' },
  { id: '12-X-II-2', phan: 'II', text: 'Xét các ý', luaChon: ['a1', 'b1', 'c1', 'd1'], dapAn: 'DSSD', chot: 'y' },
] as unknown as CauLuyen[]
const T = { hoTen: 'Em', tenChuyenDe: 'Ester', ngay: new Date('2026-09-29T00:00:00Z'), nhanBia: 'PHIẾU', oBia: [] } as never

describe('nút Hỏi thầy trên phiếu', () => {
  it('thẻ câu: có nút khi bật, mang đúng qid; tắt thì không đổi byte nào', () => {
    const co = theCauHtml(CAU[0], 1, false, false, true, false, undefined, true)
    expect(co).toContain('data-hoi-thay="12-X-I-1"')
    expect(co).toContain('>Hỏi thầy</button>')
    expect(theCauHtml(CAU[0], 1, false, false, true, false, undefined)).not.toContain('data-hoi-thay')
  })
  it('phiếu học sinh (nộp được) có nút + mã nhắn app; phiếu in không có', () => {
    const hs = dungPhieu(T, CAU, { nop: { ma: 'P1', sbd: 'E1', url: 'https://x' } })
    expect(hs.match(/data-hoi-thay=/g)?.length).toBe(2)
    expect(hs).toContain("type: 'ddh-hoi-thay'")
    const inDe = dungPhieu(T, CAU, { anGiai: true })
    expect(inDe).not.toContain('data-hoi-thay')
    expect(inDe).not.toContain('ddh-hoi-thay')
    const thay = dungPhieu(T, CAU, {})
    expect(thay).not.toContain('data-hoi-thay')
  })
})
