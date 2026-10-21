// HỘP "BỔ SUNG BÀI HÔM NAY" (thầy 21/10: "nút này làm riêng bấm vào popup lên để chọn luôn chứ không gắn vào phần hành trình nữa" + "bỏ cái phần tick bài
// vừa dạy khỏi hành trình đi"; bản vẽ docs/ban-ve-hanh-trinh-2110 khung 04). Kiểm:
//   · hộp chuẩn (role dialog, tiêu đề, Esc đóng, nút Đóng) — thân là bước Bài hôm nay KHÔNG đầu bước; lớp mặc định = lớp của buổi đang mở;
//   · nhớ lớp + bài đang chọn theo buổi ở khoá `ddh.dayHoc.<buổi>` (đọc-gộp-ghi, không xoá phần nhớ câu chiếu): đóng rồi mở lại vẫn còn bài;
//   · bước "Dạy học" của Hành trình (DayHocLenBang nhúng) ghi phần nhớ của mình KHÔNG xoá lớp + bài hộp đã chọn (lỗi Đợt 16 không quay lại);
//   · OMNI tắt ⇒ hộp nói rõ cần bật ở đâu, không nút Giao; đọc cờ lỗi ⇒ lý do + Thử lại.
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
const to = (maDe: string, nguon: string, n: number): TeacherExamSource => ({ maDe, nhom: '12 · DẠY HỌC/C1 - Ester lipid', nguon, phanI: cau(maDe, n), phanII: [], phanIII: [] }) as unknown as TeacherExamSource
const KHO: TeacherExamSource[] = [to('DH-12-C1-B1', 'Bài 1. Ester', 2), to('DH-12-C1-B2', 'Bài 2. Lipid', 2), to('DH-12-C1-B3', 'Bài 3. Xà phòng và chất giặt rửa', 2)]

const { default: HopBoSungBai } = await import('../src/components/day-hoc/HopBoSungBai')
const { default: TheBaiDaDay } = await import('../src/components/chien-dich/TheBaiDaDay')

const BUOI = { id: 'BH-9', ten: 'Buổi học 21/10 · 12A1', lop: '12A1', moLuc: '2026-10-21T11:00:00Z', hetHan: '2026-10-22T11:00:00Z', dongLuc: null, dangMo: true }
let co: Record<string, unknown> | 'loi' = { bat: true, lop: ['12A1'], sbd: [] }
function mayChu() {
  goi.mockImplementation(async (duong: string, b: Record<string, unknown>) => {
    if (duong === '/gv/lop') return { ok: true, du: { ok: true, lop: [{ tenLop: '12A1', khoi: '12', soEm: 2, sbd: [] }] } }
    if (duong === '/gv/buoi-hoc' && b.action === 'dang-mo') return { ok: true, du: { ok: true, buoi: [BUOI] } }
    if (duong === '/gv/buoi-hoc' && b.action === 'gan-day') return { ok: false, loai: 'chua_co_lenh', chu: 'lệnh lạ' }
    if (duong === '/gv/buoi-hoc') return { ok: true, du: { ok: true, buoi: BUOI, ma: '482915', doiMaLuc: 1, coMat: [{ sbd: 'S1', hoTen: 'Lê Khánh Vy', luc: BUOI.moLuc, cach: 'ma' }], siSo: 2, lopEm: [] } }
    if (duong === '/gv/omni' && b.action === 'co-doc') return co === 'loi' ? { ok: false, loai: 'mang', chu: 'Không nối được máy chủ.' } : { ok: true, du: { ok: true, co } }
    if (duong === '/gv/bai-da-day' && b.action === 'danh-sach') return { ok: true, du: { ok: true, bai: [], choBaiMoi: null } }
    if (duong === '/gv/bai-da-day' && b.action === 'xem-truoc') return { ok: true, du: { ok: true, soCau: 2, soTuLuan: 0, hanNop: '2026-10-28', D: 7, luotCan: 20, sucChua: 280, duLuot: 2, tongEm: 2, duDiem8: null, quaTai: [], theLucNgay: 40 } }
    return { ok: false, loai: 'chua_co_lenh', chu: 'lệnh lạ' }
  })
}
const lenh = (duong: string, action?: string) => goi.mock.calls.filter(([d, b]) => d === duong && (action === undefined || (b as Record<string, unknown>).action === action))

beforeEach(() => {
  goi.mockReset()
  co = { bat: true, lop: ['12A1'], sbd: [] }
  mayChu()
})
afterEach(() => {
  cleanup()
  localStorage.clear()
})

describe('hộp Bổ sung bài hôm nay', () => {
  it('hộp chuẩn: tiêu đề, không đầu bước "Bài hôm nay"; lớp mặc định của buổi; chọn bài ⇒ nhớ theo buổi (gộp, giữ câu chiếu); mở lại vẫn còn; Esc đóng', async () => {
    localStorage.setItem('ddh.dayHoc.BH-9', JSON.stringify({ maChon: ['DH-12-C1-B1'], boCau: [], giao: {}, lopNhan: null, baiChon: null }))
    const dong = vi.fn()
    const r = render(<HopBoSungBai onDong={dong} />)
    const hop = screen.getByRole('dialog', { name: 'Bổ sung bài hôm nay' })
    expect(within(hop).queryByRole('heading', { name: 'Bài hôm nay' })).toBeNull()
    const radio = await within(hop).findByRole('radio', { name: /Bài 2\. Lipid/ }, { timeout: 4000 })
    expect(hop.textContent).toContain('12A1')
    fireEvent.click(radio)
    await waitFor(() => expect(JSON.parse(localStorage.getItem('ddh.dayHoc.BH-9')!)).toMatchObject({ maChon: ['DH-12-C1-B1'], baiChon: { khoaBai: expect.stringContaining('B2'), khoi: '12' } }))
    // hộp chỉ đọc buổi một lần, không nhịp làm mới
    expect(lenh('/gv/buoi-hoc', 'dang-mo')).toHaveLength(1)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(dong).toHaveBeenCalledWith(false)
    r.unmount()

    render(<HopBoSungBai onDong={dong} />)
    await waitFor(() => expect((screen.getByRole('radio', { name: /Bài 2\. Lipid/ }) as HTMLInputElement).checked).toBe(true), { timeout: 4000 })
    fireEvent.click(screen.getByRole('button', { name: 'Đóng' }))
    expect(dong).toHaveBeenCalledTimes(2)
  })

  it('OMNI tắt ⇒ nói rõ cần bật ở đâu, không nút Giao; đọc cờ lỗi ⇒ lý do + Thử lại', async () => {
    co = { bat: false, lop: [], sbd: [] }
    const r = render(<HopBoSungBai onDong={() => {}} />)
    expect(await screen.findByText('Tick bài vừa dạy cần bật OMNI cho lớp ở Cài đặt › OMNI (theo lớp).')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /^Giao / })).toBeNull()
    r.unmount()

    co = 'loi'
    render(<HopBoSungBai onDong={() => {}} />)
    expect((await screen.findByRole('alert')).textContent).toContain('Chưa tải được phần Tick bài: Không nối được máy chủ.')
    co = { bat: true, lop: ['12A1'], sbd: [] }
    fireEvent.click(screen.getByRole('button', { name: 'Thử tải Tick bài lại' }))
    expect(await screen.findByRole('radio', { name: /Bài 1\. Ester/ }, { timeout: 4000 })).toBeTruthy()
  })

  it('bước Dạy học của Hành trình ghi phần nhớ KHÔNG xoá lớp + bài hộp đã chọn; Hành trình không đọc cờ OMNI', async () => {
    const baiChon = { khoaBai: 'DH-12-C1-B2', khoi: '12', tenBai: 'Bài 2. Lipid' }
    localStorage.setItem('ddh.dayHoc.BH-9', JSON.stringify({ maChon: [], boCau: [], giao: {}, lopNhan: ['12A1'], baiChon }))
    localStorage.setItem('ddh.hanhTrinh.buoc.BH-9', '3')
    const { container } = render(<TheBaiDaDay />)
    await waitFor(() => expect(container.querySelector('[data-buoc-ht="3"]')!.getAttribute('data-mo')).toBe('true'))
    await screen.findByRole('heading', { level: 2, name: 'Dạy học' })
    await new Promise((r) => setTimeout(r, 50))
    expect(JSON.parse(localStorage.getItem('ddh.dayHoc.BH-9')!)).toMatchObject({ lopNhan: ['12A1'], baiChon })
    expect(lenh('/gv/omni', 'co-doc')).toHaveLength(0)
  })
})
