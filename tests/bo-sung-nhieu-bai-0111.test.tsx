// HỘP «BỔ SUNG BÀI HÔM NAY» — CHỌN NHIỀU BÀI (thầy 01/11, bản vẽ chốt docs/ban-ve-chon-nhieu-bai-0111). Kiểm:
//   · ô tick từng bài; bài đã giao gọn một dòng (không ô tick, có «Bỏ giao»); chương đã giao hết gọn lại;
//   · chọn 2 bài ⇒ MỘT lượt `xem-truoc` gộp tờ tự giao của cả 2 bài (khoá = bài sau, phạm vi = các bài trước bài đầu) ⇒ thẻ tóm tắt đúng số máy chủ (câu, TN/ĐS/TLN, hạn, em);
//   · «Giao 2 bài» ⇒ `tick` lần lượt bài số nhỏ trước, CÙNG hạn nộp máy chủ tính cho cả khối lượng ⇒ dòng xong nói rõ các em đã được xếp lại + máy tự tải;
//   · chưa chọn bài ⇒ không gọi `xem-truoc`, nút Giao không có.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import type { TeacherExamSource } from '../src/data/examContent'

const { goi } = vi.hoisted(() => ({ goi: vi.fn() }))
vi.mock('../src/lib/goi-lenh-thay', () => ({ goiLenh: (duong: string, body: Record<string, unknown>) => goi(duong, body) }))
vi.mock('../src/lib/exam-db', async (goc) => ({
  ...(await goc<typeof import('../src/lib/exam-db')>()),
  loadExamSources: async () => KHO,
  loadScriptUrl: async () => 'https://may-chu',
  loadTeacherSecret: async () => 'mat',
}))
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-chu' }))

let soCau = 0
const cau = (maDe: string, n: number) => Array.from({ length: n }, () => ({ id: `${maDe}-I-${++soCau}`, text: `Câu ${soCau} của ${maDe}`, choices: ['a', 'b', 'c', 'd'], correct: 'A' }))
const to = (maDe: string, nguon: string, n: number, chuong = 'C1 - Ester lipid'): TeacherExamSource => ({ maDe, nhom: `12 · DẠY HỌC/${chuong}`, nguon, phanI: cau(maDe, n), phanII: [], phanIII: [] }) as unknown as TeacherExamSource
const KHO: TeacherExamSource[] = [
  to('DH-12-C1-B1', 'Bài 1. Ester', 3), to('DH-12-C1-B2', 'Bài 2. Lipid', 4), to('DH-12-C1-B3', 'Bài 3. Xà phòng và chất giặt rửa', 5),
  to('DH-12-C2-B4', 'Bài 4. Glucose', 6, 'C2 - Carbohydrate'),
]
const BUOI = { id: 'BH-1', ten: 'Buổi học 01/11 · 12A1', lop: '12A1', moLuc: '2026-11-01T01:00:00Z', hetHan: '2026-11-02T01:00:00Z', dongLuc: null, dangMo: true }
const TICK_B1 = { khoaBai: 'DH-12-C1-B1', tenBai: 'Bài 1. Ester', viTri: 1, tickLuc: '2026-10-20T01:00:00Z', chienDichId: 'cd1', trangThai: 'dang_luyen', hanNop: '2026-11-03', conNgay: 2, chungChi: { dat: 0, tong: 2 }, soEm: 2 }
function mayChu() {
  goi.mockImplementation(async (duong: string, b: Record<string, unknown>) => {
    if (duong === '/gv/lop') return { ok: true, du: { ok: true, lop: [{ tenLop: '12A1', khoi: '12', soEm: 2, sbd: [] }] } }
    if (duong === '/gv/buoi-hoc' && b.action === 'dang-mo') return { ok: true, du: { ok: true, buoi: [BUOI] } }
    if (duong === '/gv/buoi-hoc' && b.action === 'gan-day') return { ok: false, loai: 'chua_co_lenh', chu: 'lệnh lạ' }
    if (duong === '/gv/buoi-hoc') return { ok: true, du: { ok: true, buoi: BUOI, ma: '1', doiMaLuc: 1, coMat: [], siSo: 2, lopEm: [] } }
    if (duong === '/gv/omni' && b.action === 'co-doc') return { ok: true, du: { ok: true, co: { bat: true, lop: ['12A1'], sbd: [] } } }
    if (duong === '/gv/bai-da-day' && b.action === 'danh-sach') return { ok: true, du: { ok: true, bai: [TICK_B1], choBaiMoi: null } }
    if (duong === '/gv/bai-da-day' && b.action === 'xem-truoc') {
      const n = (b.maDe as string[]).length
      return { ok: true, du: { ok: true, soCau: n === 2 ? 9 : 4, soTuLuan: 0, theoPhan: { I: n === 2 ? 9 : 4, II: 0, III: 0 }, hanNop: '2026-11-09', D: 8, luotCan: 30, sucChua: 320, duLuot: 2, tongEm: 2, soEmChon: 2, duDiem8: null, quaTai: [], theLucNgay: 40 } }
    }
    if (duong === '/gv/bai-da-day' && b.action === 'tick') return { ok: true, du: { ok: true, chienDichId: `cd-${String(b.khoaBai)}`, hanNop: String(b.hanNop), daCo: false } }
    return { ok: false, loai: 'chua_co_lenh', chu: 'lệnh lạ' }
  })
}
const lenh = (action: string) => goi.mock.calls.filter(([d, b]) => d === '/gv/bai-da-day' && (b as Record<string, unknown>).action === action).map(([, b]) => b as Record<string, unknown>)

beforeEach(() => { goi.mockReset(); mayChu() })
afterEach(() => { cleanup(); localStorage.clear() })

describe('hộp Bổ sung bài hôm nay — chọn nhiều bài', () => {
  it('bài đã giao gọn một dòng; tick 2 bài ⇒ một lượt xem trước gộp; Giao 2 bài ⇒ tick lần lượt cùng một hạn; báo xếp lại + máy tự tải', async () => {
    const { default: HopBoSungBai } = await import('../src/components/day-hoc/HopBoSungBai')
    render(<HopBoSungBai onDong={() => {}} />)
    const hop = screen.getByRole('dialog', { name: 'Bổ sung bài hôm nay' })
    const b2 = await within(hop).findByRole('checkbox', { name: /Bài 2\. Lipid/ }, { timeout: 4000 })
    // Bài 1 đã giao: không có ô tick, có «Bỏ giao» + trạng thái
    expect(within(hop).queryByRole('checkbox', { name: /Bài 1\. Ester/ })).toBeNull()
    expect(hop.textContent).toContain('Đang luyện · còn 2 ngày · 2 em')
    expect(within(hop).getByRole('button', { name: 'Bỏ giao' })).toBeTruthy()
    // chưa chọn ⇒ không xem trước, không nút giao
    expect(lenh('xem-truoc')).toHaveLength(0)
    expect(within(hop).queryByRole('button', { name: /^Giao / })).toBeNull()

    fireEvent.click(b2)
    fireEvent.click(within(hop).getByRole('checkbox', { name: /Bài 3\. Xà phòng/ }))
    await waitFor(() => expect(within(hop).getByRole('button', { name: 'Giao 2 bài cho lớp 12A1 · 2 em' })).toBeTruthy(), { timeout: 4000 })
    const xem = lenh('xem-truoc')
    expect(xem.at(-1)).toMatchObject({ lop: '12A1', khoaBai: 'DH-12-C1-B3', maDe: ['DH-12-C1-B2', 'DH-12-C1-B3'], phamVi: [expect.objectContaining({ khoaBai: 'DH-12-C1-B1' })] })
    const tom = hop.querySelector('[data-khoi="tom-tat-giao"]')!.textContent!
    expect(tom).toContain('Bài 2, Bài 3')
    expect(tom).toContain('9TN 9')
    expect(tom).toContain('8 ngày')
    expect(tom).toContain('2/2')

    fireEvent.click(within(hop).getByRole('button', { name: 'Giao 2 bài cho lớp 12A1 · 2 em' }))
    await waitFor(() => expect(hop.textContent).toContain('Đã giao Bài 2, Bài 3 cho 2 em lớp 12A1'), { timeout: 4000 })
    expect(hop.textContent).toContain('máy các em tự tải câu và đáp án')
    const tick = lenh('tick')
    expect(tick.map((t) => t.khoaBai)).toEqual(['DH-12-C1-B2', 'DH-12-C1-B3'])
    expect(tick.every((t) => t.hanNop === '2026-11-09')).toBe(true)
    expect(tick[1]!.phamVi).toEqual(expect.arrayContaining([expect.objectContaining({ khoaBai: 'DH-12-C1-B2' })]))
  })
})
