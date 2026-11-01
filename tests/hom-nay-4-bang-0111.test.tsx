// @vitest-environment jsdom
// HÔM NAY · 4 BẢNG (thầy chốt bản vẽ 01/11, docs/ban-ve-hom-nay-4-bang-0111; sửa khi chốt: «bằng chứng ẩn phần cách tính đi, chỉ hiện các thông số sắc bén»).
// Khoá:
//   · «Trong»: màn Hôm nay vẽ 4 bảng (Học thật · Học đối phó · Chăm · Lười) theo đúng thứ tự máy chủ đã xếp + «Việc cần thầy»; KHÔNG còn dải số, xếp hạng
//     cũ, «Nhịp học theo lớp», «12 bậc»; KHÔNG hỏi `/gv/nhip-hoc` (lệnh nặng nhất màn) — hỏi `/gv/bon-bang`;
//   · mỗi thẻ 6 em đầu + «Xem đủ N em» mở tại chỗ; lọc Khối + tìm tên lọc cả 4 bảng ở máy; ô chọn bảng (điện thoại) đổi bảng đang hiện;
//   · «**x**» của máy chủ in đậm; đang tính dần ⇒ dòng «Đang tính dần: a/b em»;
//   · bấm một em ⇒ trang bằng chứng «Bằng chứng · <tên>» (kết luận + hạng, thẻ bằng chứng, 4 chỉ số, 14 ngày) — KHÔNG có «Cách tính»; Esc đóng, tiêu điểm về dòng.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import type { TraLoiBangChung, TraLoiBonBang, DongBang } from '../src/lib/bon-bang-kieu'

const m = vi.hoisted(() => ({ goi: vi.fn(), danhSachCa: vi.fn(), boSung: vi.fn(async () => [] as unknown[]) }))
vi.mock('../src/lib/goi-lenh-thay', () => ({ goiLenh: (duong: string, body: Record<string, unknown>) => m.goi(duong, body), CHU_HUONG_DAN_MA: '' }))
vi.mock('../src/lib/exam-api', () => ({ danhSachCa: (...a: unknown[]) => m.danhSachCa(...a), danhSachCauHoi: async () => [], xoaNhieuCa: vi.fn(), khoiPhucCa: vi.fn(), xoaVinhVienCa: vi.fn() }))
vi.mock('../src/lib/bai-bo-sung', () => ({ layBaiBoSung: (...a: unknown[]) => m.boSung(...a), xuLyBaiBoSung: vi.fn() }))
vi.mock('../src/lib/exam-db', () => ({ loadScriptUrl: async () => 'https://gia/exec', loadTeacherSecret: async () => 'mat', loadExamSources: async () => [] }))
vi.mock('../src/lib/gio-may-chu', () => ({ gioMayChu: () => new Date('2026-11-01T03:00:00Z').getTime() }))
vi.mock('../src/lib/chua-cau-sai-thay-api', () => ({ goiChuaThay: async () => ({ ok: true, bat: true, ds: [], conNua: false }) }))
vi.mock('../src/lib/nut-that-api', () => ({ gvDsNutThat: async () => ({ ok: true, nhom: [], kemRieng: [], tong: { soThe: 0, soNhom: 0, theNgayDongNhat: 0, quaTai: false } }), gvGoNutThat: vi.fn() }))

const dong = (sbd: string, hoTen: string, khoi: string, diem: number, bc: string): DongBang => ({ sbd, hoTen, lop: `${khoi}A1`, khoi, diem, bc })
const BON: TraLoiBonBang = {
  ok: true,
  tu: '2026-10-18',
  den: '2026-10-31',
  tinhLuc: '2026-10-31T23:10:00Z',
  daTinh: 260,
  tong: 262,
  bang: {
    ht: [dong('H1', 'Phan Thảo Vy', '11', 96, 'Sửa đúng **19/20** câu từng sai'), ...Array.from({ length: 7 }, (_, i) => dong(`H${i + 2}`, `Em Học Thật ${i + 2}`, i % 2 ? '12' : '10', 90 - i, 'Đọc kỹ'))],
    dp: [dong('D1', 'Doãn Thanh Tâm', '12', 88, '**46%** câu chọn khi chưa đọc hết đề'), dong('D2', 'Văn Quốc Bảo', '11', 81, 'Chọn **B** liền **11 câu**')],
    ch: [dong('C1', 'Lã Thanh Hương', '12', 99, 'Đủ mức **14/14** ngày')],
    lu: [dong('L1', 'Từ Văn Hùng', '12', 99, '**14/14** ngày không làm'), dong('L2', 'Cù Thị Mai', '10', 96, '**12/14** ngày không làm')],
  },
  trungVi: { ht: 61, dp: 18, ch: 58, lu: 42 },
}
const BC: TraLoiBangChung = {
  ok: true,
  em: { sbd: 'D1', hoTen: 'Doãn Thanh Tâm', lop: '12A1' },
  tu: '2026-10-18',
  den: '2026-10-31',
  tinhLuc: '2026-10-31T23:10:00Z',
  diem: { ht: 12, dp: 88, ch: 86, lu: 14 },
  trungVi: { ht: 61, dp: 18, ch: 58, lu: 42 },
  soLuot: 191,
  bang: 'dp',
  hang: { thu: 1, tong: 18 },
  ketLuan: 'Em làm 12/14 ngày đủ mức nhưng làm cho có:\n**46%** số câu chọn đáp án khi chưa kịp đọc hết đề — sai 40/88 câu\n**3 lần** bấm cùng một chữ từ 6 câu liền trở lên',
  the: [
    { ma: 'voi', tieu: 'Chọn đáp án khi chưa kịp đọc hết đề', lon: '88/191', nhoSo: 'lượt · 46%', so: 46, lop: 7, viDu: [{ luc: '2026-10-30T14:14:00Z', cau: 'Bài 7 · Fe và Cu tác dụng với HCl', phu: 'đề 64 chữ ⇒ cần ít nhất 16 giây để đọc', kq: 'chọn sau 3 giây · B · sai', dung: false }] },
    { ma: 'lap', tieu: 'Bấm cùng một chữ nhiều câu liền', lon: '5', nhoSo: 'chuỗi từ 6 câu', chuoi: { chu: 'BBBBBBBBBBB', dung: [3, 8] } },
    { ma: 'lech', tieu: 'Luyện tập cao, kiểm tra thấp', lon: '71% → 3,5', hai: [{ nhan: 'Luyện tập', so: '71%', phu: '42/59 câu đúng' }, { nhan: 'Kiểm tra cá nhân', so: '3,5/10', phu: 'tự làm', lech: true }] },
  ],
  ngay: Array.from({ length: 14 }, (_, i) => ({ ngay: `2026-10-${String(18 + i).padStart(2, '0')}`, muc: 36, ky: i === 3 ? 0 : 18, voi: i === 3 ? 0 : 20 })),
}

function mayChu() {
  m.goi.mockImplementation(async (duong: string, b: Record<string, unknown>) => {
    if (duong === '/gv/bon-bang') return { ok: true, du: { ...BON } }
    if (duong === '/gv/bon-bang/em') return { ok: true, du: { ...BC, bang: b.bang } }
    if (duong === '/gv/chien-dich' && b.action === 'danh-sach') return { ok: true, du: { homNay: '2026-11-01', chienDich: [] } }
    if (duong === '/gv/omni' && b.action === 'co-doc') return { ok: true, du: { ok: true, co: { bat: false, lop: [], sbd: [] } } }
    if (duong === '/gv/bai-da-day' && b.action === 'danh-sach') return { ok: true, du: { ok: true, bai: [], choBaiMoi: { soNgay: 0 } } }
    return { ok: false, loai: 'tu_choi', chu: 'lệnh lạ' }
  })
}

beforeEach(() => {
  document.documentElement.dataset.trong = 'gv'
  m.danhSachCa.mockResolvedValue([])
  mayChu()
})
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  localStorage.clear()
  delete document.documentElement.dataset.trong
})

const { default: BonBang, chuDam, locBang } = await import('../src/components/hom-nay-thay/BonBang')
const { xoaDemBonBang, docBonBang } = await import('../src/lib/bon-bang-api')
const tenTrongThe = (the: HTMLElement) => [...the.querySelectorAll('.bb-ten')].map((x) => x.firstChild?.textContent)

describe('4 bảng', () => {
  beforeEach(() => xoaDemBonBang())
  it('4 thẻ theo hai trục, đúng thứ tự máy chủ; 6 em đầu + «Xem đủ N em» mở tại chỗ; **x** in đậm; đang tính dần', async () => {
    const { container } = render(<BonBang />)
    await screen.findByRole('heading', { name: /Học thật/ })
    expect([...container.querySelectorAll('.bb-bon > .bb-the')].map((x) => x.getAttribute('data-bang'))).toEqual(['ht', 'dp', 'ch', 'lu'])
    const ht = container.querySelector<HTMLElement>('.bb-the[data-bang="ht"]')!
    expect(tenTrongThe(ht)).toHaveLength(6)
    expect(tenTrongThe(ht)[0]).toBe('Phan Thảo Vy')
    expect(ht.querySelector('.bb-bc b')?.textContent).toBe('19/20')
    fireEvent.click(within(ht).getByRole('button', { name: 'Xem đủ 8 em' }))
    expect(tenTrongThe(ht)).toHaveLength(8)
    expect(tenTrongThe(container.querySelector<HTMLElement>('.bb-the[data-bang="lu"]')!)).toEqual(['Từ Văn Hùng', 'Cù Thị Mai'])
    expect(screen.getByText(/Đang tính dần: 260\/262 em/)).toBeTruthy()
    expect(m.goi).toHaveBeenCalledWith('/gv/bon-bang', {})
  })
  it('lọc Khối + tìm tên lọc cả 4 bảng; ô chọn bảng (điện thoại) đổi bảng đang hiện', async () => {
    const { container } = render(<BonBang />)
    await screen.findByRole('heading', { name: /Học thật/ })
    fireEvent.click(screen.getByRole('radio', { name: /^K10/ }))
    expect(tenTrongThe(container.querySelector<HTMLElement>('.bb-the[data-bang="lu"]')!)).toEqual(['Cù Thị Mai'])
    expect(tenTrongThe(container.querySelector<HTMLElement>('.bb-the[data-bang="dp"]')!)).toEqual([])
    fireEvent.click(screen.getByRole('radio', { name: /^Tất cả/ }))
    fireEvent.change(screen.getByRole('searchbox', { name: /Tìm tên học sinh/ }), { target: { value: 'van' } })
    expect(tenTrongThe(container.querySelector<HTMLElement>('.bb-the[data-bang="dp"]')!)).toEqual(['Văn Quốc Bảo'])
    expect(tenTrongThe(container.querySelector<HTMLElement>('.bb-the[data-bang="lu"]')!)).toEqual(['Từ Văn Hùng'])
    const chon = within(container.querySelector<HTMLElement>('.bb-chon')!)
    fireEvent.click(chon.getByRole('radio', { name: /Lười/ }))
    expect(container.querySelector('.bb-bon')?.getAttribute('data-chon')).toBe('lu')
    expect(chon.getByRole('radio', { name: /Lười/ }).getAttribute('aria-checked')).toBe('true')
  })
  it('bấm một em ⇒ trang bằng chứng; KHÔNG có «Cách tính»; Esc đóng, tiêu điểm về dòng', async () => {
    render(<BonBang />)
    const nut = await screen.findByRole('button', { name: /Doãn Thanh Tâm.*xem bằng chứng/ })
    fireEvent.click(nut)
    const sheet = await screen.findByRole('dialog', { name: 'Bằng chứng · Doãn Thanh Tâm' })
    await within(sheet).findByText('Chọn đáp án khi chưa kịp đọc hết đề')
    expect(m.goi).toHaveBeenCalledWith('/gv/bon-bang/em', { sbd: 'D1', bang: 'dp' })
    expect(sheet.textContent).toContain('Kết luận · Học đối phó · hạng 1/18')
    expect(sheet.textContent).toContain('12A1 · 14 ngày 18/10 – 31/10 · 191 lượt làm câu')
    expect(sheet.textContent).not.toContain('Cách tính')
    // thầy 01/11: kết luận = dòng nhận định + mỗi lý do một dòng, con số to (không còn hai con số liền nhau)
    expect(sheet.querySelector('.bbc-ket-chu')?.textContent).toBe('Em làm 12/14 ngày đủ mức nhưng làm cho có:')
    expect([...sheet.querySelectorAll('.bbc-ket-ds li')].map((x) => x.querySelector('b')?.textContent)).toEqual(['46%', '3 lần'])
    expect(sheet.querySelectorAll('.bbc-chuoi span')).toHaveLength(11)
    expect(sheet.querySelectorAll('.bbc-chuoi span[data-dung]')).toHaveLength(2)
    expect(sheet.querySelector('.bbc-hai [data-lech] b')?.textContent).toBe('3,5/10')
    expect(sheet.querySelector('.bbc-vd time')?.textContent).toBe('30/10 21:14')
    expect(sheet.querySelectorAll('.bbc-cs')).toHaveLength(4)
    expect(sheet.querySelectorAll('.bbc-cot')).toHaveLength(14)
    expect(sheet.querySelectorAll('.bbc-cot[data-khong]')).toHaveLength(1)
    fireEvent.keyDown(window, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(document.activeElement).toBe(nut)
  })
})

describe('phép thuần', () => {
  it('chuDam bọc **x** thành <b>; locBang giữ thứ tự, lọc khối + tên không dấu; docBonBang bỏ dòng sai kiểu', () => {
    const { container } = render(<p>{chuDam('a **b** c **d**')}</p>)
    expect([...container.querySelectorAll('b')].map((b) => b.textContent)).toEqual(['b', 'd'])
    expect(locBang(BON.bang.ht, '12', '').map((d) => d.sbd)).toEqual(['H3', 'H5', 'H7'])
    expect(locBang(BON.bang.dp, null, 'doan').map((d) => d.sbd)).toEqual(['D1'])
    const doc = docBonBang({ ...BON, bang: { ht: [{ sbd: 'x' }, BON.bang.ht[0]], dp: 'sai', ch: [], lu: [] } })
    expect(doc?.bang.ht.map((d) => d.sbd)).toEqual(['H1'])
    expect(doc?.bang.dp).toEqual([])
    expect(docBonBang({ ok: true })).toBeNull()
  })
})

describe('màn Hôm nay «Trong»', () => {
  it('4 bảng + Việc cần thầy; không dải số, không xếp hạng cũ, không «Nhịp học theo lớp» / «12 bậc»; không hỏi /gv/nhip-hoc', async () => {
    xoaDemBonBang()
    const { default: GvHomNayScreen } = await import('../src/screens/GvHomNayScreen')
    const { container } = render(<GvHomNayScreen />)
    await screen.findByRole('heading', { name: /Học đối phó/ })
    await screen.findByRole('region', { name: 'Việc cần thầy' })
    expect(container.querySelector('.nht-dai-so')).toBeNull()
    expect(container.querySelector('.xh-4cot')).toBeNull()
    expect(container.textContent).not.toContain('Nhịp học theo lớp')
    expect(container.textContent).not.toContain('12 bậc')
    await waitFor(() => expect(container.querySelector('.gvhn-dau .gvv2-phu')?.textContent).toContain('262 em'))
    await new Promise((r) => setTimeout(r, 30))
    expect(m.goi.mock.calls.some(([d]) => d === '/gv/nhip-hoc')).toBe(false)
  })
  it('có bài bổ sung chờ duyệt ⇒ một việc «Bài bổ sung chờ duyệt · N bài» → bấm mở tấm duyệt (thầy chốt 01/11)', async () => {
    xoaDemBonBang()
    m.boSung.mockResolvedValueOnce([
      { khoa: 'k1', maCa: 'C1', tenCa: 'LD3', sbd: '91', hoTen: 'Đỗ Thanh Tùng', lanThu: 1, soCauMoi: 1, guiLuc: '2026-10-25T12:55:00Z', nopLuc: '2026-10-25T12:54:00Z' },
      { khoa: 'k2', maCa: 'C2', tenCa: '12L1', sbd: '92', hoTen: 'Lê Minh Khoa', lanThu: 1, soCauMoi: 3, guiLuc: '2026-10-30T12:22:00Z', nopLuc: '2026-10-30T12:20:00Z' },
    ])
    const { default: GvHomNayScreen } = await import('../src/screens/GvHomNayScreen')
    render(<GvHomNayScreen />)
    const nut = await screen.findByRole('button', { name: /Bài bổ sung chờ duyệt · 2 bài/ })
    expect(nut.textContent).toContain('2 ca · cũ nhất 25/10')
    expect(m.boSung).toHaveBeenCalledWith('mat')
    fireEvent.click(nut)
    expect(await screen.findByRole('dialog', { name: 'Bài bổ sung chờ duyệt' })).toBeTruthy()
  })
})
