// BA VIỆC THẦY CHỐT 04-09 TỐI:
//  1. "Tải đề" của một ca phải ra ĐỀ RIÊNG của từng em (28 câu), không phải cả
//     kho (147 câu); có ô gõ SBD/tên để tìm em.
//  2. Phụ huynh tự chọn 10..40 câu cho con; số câu đi theo link `~<n>`.
//  3. Nút copy link màu vàng, nhấp nháy.
// Kèm: ảnh lời giải gốc chỉ hiện TRONG ô lời giải, không hiện cùng đề.
import { describe, expect, it, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import type { TeacherExamSource } from '../src/data/examContent'
import { chanSoCau, docLinkPhieu, docMaTuHash, SO_CAU_MAX, SO_CAU_MIN, taoLinkPhieu } from '../src/lib/phieu-link'
import { oGiaiHtml, theCauHtml } from '../src/lib/html-phieu'
import type { CauLuyen } from '../src/lib/bai-tap-pdf'

// ------------------------------------------------------------- link + số câu
describe('link phiếu mang số câu', () => {
  it('gắn ~n vào link và đọc lại được', () => {
    const l = taoLinkPhieu('https://vi.du/omr-app/', 'abcdefgh12', 25)
    expect(l).toBe('https://vi.du/omr-app/p#abcdefgh12~25')
    expect(docLinkPhieu('#abcdefgh12~25')).toEqual({ ma: 'abcdefgh12', soCau: 25 })
  })
  it('link cũ không có số thì soCau = null, mã vẫn đọc được — link đã gửi không chết', () => {
    expect(docLinkPhieu('#abcdefgh12')).toEqual({ ma: 'abcdefgh12', soCau: null })
    expect(docMaTuHash('#abcdefgh12~30')).toBe('abcdefgh12')
  })
  it('kẹp số câu vào 10..40, rác thì về 10', () => {
    expect(chanSoCau(3)).toBe(SO_CAU_MIN)
    expect(chanSoCau(99)).toBe(SO_CAU_MAX)
    expect(chanSoCau('abc')).toBe(SO_CAU_MIN)
    expect(docLinkPhieu('#abcdefgh12~999').soCau).toBe(SO_CAU_MAX)
  })
  it('mã rác thì trả rỗng, không hỏi máy chủ bằng rác', () => {
    expect(docLinkPhieu('#a b~10')).toEqual({ ma: '', soCau: null })
  })
})

// ------------------------------------------------------- ảnh lời giải gốc
const cauCoAnh: CauLuyen = {
  id: 'q1', phan: 'III', text: 'Tính m.', chuyenDe: 'Ester – lipid', mucDo: 'hieu', dapAn: '10,3',
  buoc: ['%O = 10,815% O 10.10,815% n kmol 16 ='],
  hinh: [{ src: 'data:image/png;base64,AAAA', viTri: 'sau_loi_giai', alt: 'lời giải' }],
} as unknown as CauLuyen

describe('ảnh lời giải gốc (sau_loi_giai)', () => {
  it('nằm TRONG ô lời giải', () => {
    const g = oGiaiHtml(cauCoAnh)
    expect(g).toContain('Lời giải của Thầy')
    expect(g).toContain('data:image/png;base64,AAAA')
  })
  it('KHÔNG nằm cùng thân đề — không phát đáp số cho em ngay trên đề', () => {
    const the = theCauHtml(cauCoAnh, 1)
    const than = the.split('class="q-nut-giai"')[0]
    expect(than).not.toContain('data:image/png;base64,AAAA')
  })
  it('chỉ có ảnh, không có chữ giải nào, vẫn mở được nút lời giải', () => {
    const c = { ...cauCoAnh, buoc: [], chot: '', ketQua: '' } as unknown as CauLuyen
    expect(theCauHtml(c, 1)).toContain('q-nut-giai')
  })
})

// ------------------------------------------------------ tải đề riêng từng em
vi.mock('../src/components/NutPhieuHtml', () => ({
  default: ({ nhanXem }: { nhanXem: string }) => <button type="button">{nhanXem}</button>,
}))
const { default: NutTaiDeCa } = await import('../src/components/NutTaiDeCa')

const kho = (maDe: string, nI: number, nII: number, nIII: number): TeacherExamSource => ({
  maDe,
  phanI: Array.from({ length: nI }, (_, i) => ({ id: `${maDe}-I-${i}`, text: 't', choices: ['a', 'b', 'c', 'd'], correct: 'A', chuyenDe: 'Ester – lipid' })) as never,
  phanII: Array.from({ length: nII }, (_, i) => ({ id: `${maDe}-II-${i}`, text: 't', ideas: ['a', 'b', 'c', 'd'], correct: ['D', 'D', 'S', 'S'], chuyenDe: 'Ester – lipid' })) as never,
  phanIII: Array.from({ length: nIII }, (_, i) => ({ id: `${maDe}-III-${i}`, text: 't', correct: '1', chuyenDe: 'Ester – lipid' })) as never,
})
const dsEm = [
  { sbd: '12121212', hoTen: 'Lê Minh Đức' },
  { sbd: '34343434', hoTen: 'Trần Thu Hà' },
  { sbd: '56565656', hoTen: 'Phạm Quang Huy' },
]
const chung = { maCa: '984033', tenCa: 'Ca 12A1', showToast: vi.fn(), soCauCa: { I: 18, II: 4, III: 6 } }

describe('tải đề riêng của một em', () => {
  it('ca cắt bớt: có ô tìm em và nút tải đề CỦA EM ĐÓ đúng 28 câu', () => {
    const { getByPlaceholderText, getByRole } = render(<NutTaiDeCa {...chung} banks={[kho('12-C1-B1', 90, 26, 31)]} dsEm={dsEm} />)
    expect(getByPlaceholderText('Gõ SBD hoặc tên em')).toBeTruthy()
    expect(getByRole('button', { name: /Tải đề của Lê Minh Đức \(28 câu\)/ })).toBeTruthy()
  })

  it('gõ SBD là lọc ra đúng em, gõ tên cũng được', () => {
    const { getByPlaceholderText, getByRole, queryByText } = render(<NutTaiDeCa {...chung} banks={[kho('12-C1-B1', 90, 26, 31)]} dsEm={dsEm} />)
    const o = getByPlaceholderText('Gõ SBD hoặc tên em')
    fireEvent.change(o, { target: { value: '5656' } })
    expect(getByRole('button', { name: /Tải đề của Phạm Quang Huy/ })).toBeTruthy()
    expect(queryByText(/Lê Minh Đức ·/)).toBeNull()
    fireEvent.change(o, { target: { value: 'thu hà' } })
    expect(getByRole('button', { name: /Tải đề của Trần Thu Hà/ })).toBeTruthy()
  })

  it('không khớp em nào thì nói thẳng, không dựng nút tải rỗng', () => {
    const { getByPlaceholderText, getByText, queryByRole } = render(<NutTaiDeCa {...chung} banks={[kho('12-C1-B1', 90, 26, 31)]} dsEm={dsEm} />)
    fireEvent.change(getByPlaceholderText('Gõ SBD hoặc tên em'), { target: { value: 'zzz' } })
    expect(getByText(/Không có em nào khớp/)).toBeTruthy()
    expect(queryByRole('button', { name: /Tải đề của/ })).toBeNull()
  })

  it('ca không cắt (kho = số câu mỗi em) thì KHÔNG hiện ô tìm — một tệp là đủ', () => {
    const { queryByPlaceholderText } = render(<NutTaiDeCa {...chung} banks={[kho('12-C1-B1', 18, 4, 6)]} dsEm={dsEm} />)
    expect(queryByPlaceholderText('Gõ SBD hoặc tên em')).toBeNull()
  })
})
