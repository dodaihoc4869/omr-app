// OMNI 3 · C1 — BẢNG BÀI trong Bảng chiến dịch sẵn có (thầy chốt 05/10; hợp đồng `/gv/omni` bang · xac-nhan · q-lo · q-duyet).
// Khoá: `/gv/omni bang` ok ⇒ ô em × dạng hiện P kèm "n câu" (4 màu thang đang dùng), thêm cột "Sơ ý" + "Khoảng cách tới 8" (chưa hiệu chuẩn ⇒ ghi nhỏ
// "đang hiệu chỉnh" ở đầu cột), bấm ô ⇒ hai nút xác nhận (`xac-nhan`); "Cần thầy dạy lại" ⇒ "Cần thầy chữa" đủ BA nhóm, "Chữa xong" giữ lệnh cũ;
// lỗi / ok:false ⇒ bảng cũ y nguyên. Vi kỹ năng: A.I tự gắn, chỉ một dòng "đã gắn tự động · Xem" (mặc định đóng), sửa được nếu thầy muốn.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'

const { goi } = vi.hoisted(() => ({ goi: vi.fn() }))
vi.mock('../src/lib/goi-lenh-thay', () => ({ goiLenh: (duong: string, body: Record<string, unknown>) => goi(duong, body) }))
vi.mock('../src/lib/exam-db', () => ({ loadExamSources: async () => [] }))

import BangChienDich from '../src/components/chien-dich/BangChienDich'
import LenBangChienDich from '../src/components/chien-dich/LenBangChienDich'
import type { BangChienDich as DuBang, EmBang } from '../src/components/chien-dich/api'
import type { BangOmni } from '../server/src/omni-kieu'
import { chuDangHieuChuan, chuKhoangCach8, phanTram, soP, TIEU_DE_CAN_THAY_CHUA, NUT_DAY_LAI, NUT_XAC_NHAN_VUNG, TEN_AI } from '../src/lib/omni-chu'
import { ghepCotDang, mucP, nhomCanThayChua, tbPLop } from '../src/components/chien-dich/omni-bang'
import { idVknMoi } from '../src/components/chien-dich/ViKyNangBai'

const DANG = ['Danh pháp ester', 'Thuỷ phân ester đơn chức', 'Chất béo']
const em = (ten: string, tiLe: (number | null)[], them: Partial<EmBang> = {}): EmBang => ({
  sbd: ten,
  ten,
  coXat: 30,
  thanhThao: 10,
  canDayLai: 0,
  treNhip: 0,
  huyetChien: false,
  theoDang: Object.fromEntries(DANG.map((d, i) => [d, tiLe[i] ?? null])),
  ...them,
})
const EM = [em('Trần Bình', [0.5, 0.2, 0.7]), em('Lê Chi', [0.9, 0.8, 0.95])]
const bang = (them: Partial<DuBang> = {}): DuBang => ({
  chienDich: { id: 'cd-1', ten: 'Bài 6 · Tinh bột', lop: '12A1', maDe: ['DH-12-C2-B6-TN'], hanNop: '2026-10-12', theLucNgay: 40, huyetChien: true, maCa: null, taoLuc: '', trangThai: 'dang_chay', soCau: 40, soEm: 2 },
  homNay: '2026-10-07',
  hetHan: false,
  lop: { coXat: 0.6, thanhThao: 0.3, huyetChien: 1, canDayLaiCau: 2, canDayLaiLuot: 7 },
  dang: DANG,
  em: EM,
  canDayLai: [
    { qid: 'DH-A-I-17', stt: 17, dang: 'Thuỷ phân ester đơn chức', soEm: 6, mucDo: 'van_dung', qidCung: ['DH-A-I-17', 'DH-B-I-3'] },
    { qid: 'DH-A-I-5', stt: 5, dang: 'Danh pháp ester', soEm: 1 },
  ],
  ...them,
})
const OMNI: BangOmni = {
  ok: true,
  chienDich: { id: 'cd-1', ten: 'Bài 6 · Tinh bột', hanNop: '2026-10-12', lop: '12A1' },
  em: [
    { sbd: 'Trần Bình', ten: 'Trần Bình' },
    { sbd: 'Lê Chi', ten: 'Lê Chi' },
  ],
  dang: [
    { ma: 'D-DP', ten: 'Danh pháp ester' },
    { ma: 'D-TP', ten: 'Thuỷ phân ester đơn chức' },
    { ma: 'D-HS', ten: 'Hiệu suất' }, // dạng chỉ OMNI có ⇒ cột thêm cuối
  ],
  o: {
    'Trần Bình': { 'D-DP': { p: 0.95, n: 10, trangThai: 'vung' }, 'D-TP': { p: 0.41, n: 6, trangThai: 'chua_vung' }, 'D-HS': { p: 0.62, n: 4, trangThai: 'chua_du' } },
    'Lê Chi': { 'D-DP': { p: 0.96, n: 9, trangThai: 'vung' }, 'D-TP': { p: 0.83, n: 6, trangThai: 'chua_du' } },
  },
  sEm: { 'Trần Bình': 0.06, 'Lê Chi': 0.11 },
  khoangCach8: { 'Trần Bình': 1.1, 'Lê Chi': 0 },
  sanSang: { 'Trần Bình': 0.4, 'Lê Chi': 0.92 },
  hieuChuan: { soCaChot: 2, du: false },
  canThayChua: [
    { loai: 'nut_that', tieuDe: 'Vi kỹ năng: Hệ số NaOH với ester của phenol', phu: 'đã qua thang tự gỡ · 3 thẻ nút thắt', soEm: 9, qids: ['DH-A-I-21', 'DH-A-I-22'], vkn: 'D-TP#2' },
    { loai: 'so_y', tieuDe: 'Sơ ý cao: Lê Chi (11%)', phu: 'Kiến thức vững nhưng sai khi chắc', soEm: 1, sbd: ['Lê Chi'] },
  ],
}
const NOW = Date.UTC(2026, 9, 7, 3, 0, 0)
const ve = (omni: BangOmni | null, onOmniDoi = vi.fn(), onDaChua = vi.fn()) => {
  const r = render(<BangChienDich du={bang()} nowMs={NOW} dangChieu={false} onChieu={vi.fn(async () => true)} onDaChua={onDaChua} omni={omni} onOmniDoi={onOmniDoi} />)
  return { ...r, onOmniDoi, onDaChua }
}

// Thân khối {…}: `() => goi.mockReset()` TRẢ VỀ chính `goi` ⇒ vitest coi là hàm dọn và gọi `goi()` không đối số sau mỗi test.
beforeEach(() => {
  goi.mockReset()
})
afterEach(cleanup)

describe('phần thuần (omni-bang.ts)', () => {
  it('màu ô P dùng 4 lớp màu thang đang dùng: ≥ 0,95 vững · 0,80 · 0,50', () => {
    expect([0.99, 0.95, 0.949, 0.8, 0.79, 0.5, 0.49, 0].map(mucP)).toEqual(['L4', 'L4', 'L3', 'L3', 'L2', 'L2', 'L1', 'L1'])
  })
  it('ghép cột: giữ thứ tự cột cũ, khớp theo tên hoặc mã; dạng chỉ OMNI có thêm cuối; P trung bình lớp', () => {
    expect(ghepCotDang(DANG, OMNI.dang)).toEqual([
      { ten: 'Danh pháp ester', ma: 'D-DP', moi: false },
      { ten: 'Thuỷ phân ester đơn chức', ma: 'D-TP', moi: false },
      { ten: 'Chất béo', ma: null, moi: false },
      { ten: 'Hiệu suất', ma: 'D-HS', moi: true },
    ])
    expect(ghepCotDang(['D-DP'], [{ ma: 'D-DP', ten: 'Danh pháp' }])[0]!.ma).toBe('D-DP')
    expect(tbPLop(OMNI, 'D-TP')).toBeCloseTo(0.62)
    expect(tbPLop(OMNI, null)).toBeNull()
  })
  it('ba nhóm Cần thầy chữa đúng thứ tự; máy chủ chưa gửi nhóm câu sai ≥ 4 ⇒ dựng từ "Cần thầy dạy lại" (đủ qid trùng nội dung)', () => {
    const g = nhomCanThayChua(OMNI.canThayChua, bang().canDayLai)
    expect(g.map((x) => [x.loai, x.dong.length])).toEqual([
      ['nut_that', 1],
      ['cat_tia', 2],
      ['so_y', 1],
    ])
    expect(g[1]!.dong[0]).toMatchObject({ tieuDe: 'Câu 17 · Thuỷ phân ester đơn chức', phu: 'Vận dụng', soEm: 6, qids: ['DH-A-I-17', 'DH-B-I-3'] })
    expect(nhomCanThayChua([{ loai: 'cat_tia', tieuDe: 'Câu 9', phu: '', soEm: 3, qids: ['Q9'] }], bang().canDayLai)[1]!.dong.map((d) => d.tieuDe)).toEqual(['Câu 9'])
  })
  it('id vi kỹ năng mới = <mã dạng>#<số kế tiếp>', () => {
    expect(idVknMoi('D-TP', [{ id: 'D-TP#1' }, { id: 'D-TP#3' }, { id: 'dang:D-TP' }, { id: 'D-DP#9' }])).toBe('D-TP#4')
    expect(idVknMoi('D-HS', [])).toBe('D-HS#1')
  })
})

describe('Bảng chiến dịch + Bảng bài OMNI', () => {
  it('có số OMNI: ô P kèm "n câu", thêm cột Sơ ý + Khoảng cách tới 8 (đang hiệu chỉnh ghi nhỏ đầu cột), tiêu đề + chú giải nói đúng thang', () => {
    const { container } = ve(OMNI)
    expect(screen.getByRole('heading', { name: 'Từng em × dạng · P nắm dạng kèm số câu tự làm' })).toBeTruthy()
    const dau = [...container.querySelectorAll('thead th')].map((x) => x.textContent ?? '')
    expect(dau).toContain('Sơ ý')
    expect(dau.find((t) => t.startsWith('Khoảng cách tới 8'))).toContain(chuDangHieuChuan(2, 3))
    expect(dau).toContain('Hiệu suất')
    const hang = [...container.querySelectorAll('tbody tr')].find((r) => r.textContent?.includes('Trần Bình')) as HTMLElement
    const o = within(hang).getByRole('button', { name: soP(0.41) })
    expect(o.className).toContain('cd-o--L1')
    expect(o.parentElement!.textContent).toContain('6 câu')
    expect(within(hang).getByRole('button', { name: soP(0.95) }).className).toContain('cd-o--L4')
    expect(hang.querySelector('[data-o-so-y]')!.textContent).toBe(phanTram(0.06))
    expect(hang.querySelector('[data-o-kc8]')!.textContent).toBe(chuKhoangCach8(1.1))
    const chi = [...container.querySelectorAll('tbody tr')].find((r) => r.textContent?.includes('Lê Chi')) as HTMLElement
    expect(chi.querySelector('[data-o-kc8]')!.textContent).toBe(chuKhoangCach8(0))
    expect(chi.querySelector('[data-o-so-y]')!.className).toContain('cd-chu-do') // sơ ý cao (trên 9%)
    expect(container.querySelector('[data-chu-giai-p="L4"]')?.textContent).toContain('0,95')
    expect(container.querySelector('[data-khoi="giai-thich-omni"]')).toBeTruthy()
  })

  it('bấm một ô ⇒ hai nút xác nhận; "Thầy xác nhận em đã vững" ⇒ `xac-nhan` đúng em + mã dạng, rồi nạp lại Bảng bài', async () => {
    goi.mockResolvedValue({ ok: true, du: { ok: true } })
    const { container, onOmniDoi } = ve(OMNI)
    const hang = [...container.querySelectorAll('tbody tr')].find((r) => r.textContent?.includes('Trần Bình')) as HTMLElement
    fireEvent.click(within(hang).getByRole('button', { name: soP(0.41) }))
    const thanh = container.querySelector('[data-khoi="xac-nhan-dang"]') as HTMLElement
    expect(thanh.textContent).toContain('Trần Bình')
    expect(thanh.textContent).toContain('Thuỷ phân ester đơn chức')
    expect(within(thanh).getByRole('button', { name: NUT_DAY_LAI })).toBeTruthy()
    fireEvent.click(within(thanh).getByRole('button', { name: NUT_XAC_NHAN_VUNG }))
    await waitFor(() => expect(goi).toHaveBeenCalledWith('/gv/omni', { action: 'xac-nhan', sbd: 'Trần Bình', maDang: 'D-TP', ket: 'vung' }))
    await waitFor(() => expect(onOmniDoi).toHaveBeenCalled())
  })

  it('thẻ "Cần thầy dạy lại" ⇒ "Cần thầy chữa" đủ BA nhóm cùng kiểu dòng; "Chữa xong" hỏi lại rồi gọi ĐÚNG lệnh cũ `chua-xong`', async () => {
    goi.mockResolvedValue({ ok: true, du: { ok: true, soLuot: 9, ngayOnLai: '2026-10-08' } })
    const { container, onDaChua } = ve(OMNI)
    expect(screen.getByRole('heading', { name: TIEU_DE_CAN_THAY_CHUA })).toBeTruthy()
    expect(screen.queryByRole('heading', { name: 'Cần thầy dạy lại' })).toBeNull()
    const khoi = container.querySelector('[data-khoi="can-thay-chua"]') as HTMLElement
    expect([...khoi.querySelectorAll('[data-nhom]')].map((x) => x.getAttribute('data-nhom'))).toEqual(['nut_that', 'cat_tia', 'so_y'])
    expect(khoi.querySelector('[data-nhom="nut_that"]')!.textContent).toContain('Hệ số NaOH với ester của phenol')
    expect(khoi.querySelector('[data-nhom="cat_tia"]')!.textContent).toContain('Câu 17 · Thuỷ phân ester đơn chức')
    expect(khoi.querySelector('[data-nhom="so_y"]')!.textContent).toContain('Sơ ý cao: Lê Chi')
    // Nhóm sơ ý không có câu ⇒ không có nút Chữa xong.
    expect(within(khoi.querySelector('[data-nhom="so_y"]') as HTMLElement).queryByRole('button')).toBeNull()
    fireEvent.click(within(khoi.querySelector('[data-nhom="nut_that"]') as HTMLElement).getByRole('button', { name: 'Chữa xong' }))
    const hop = screen.getByRole('alertdialog')
    expect(hop.textContent).toContain('không hoàn tác')
    expect(goi).not.toHaveBeenCalled()
    fireEvent.click(within(hop).getByRole('button', { name: 'Chữa xong' }))
    await waitFor(() => expect(goi).toHaveBeenCalledWith('/gv/chien-dich', { action: 'chua-xong', id: 'cd-1', qids: ['DH-A-I-21', 'DH-A-I-22'] }))
    await waitFor(() => expect(onDaChua).toHaveBeenCalled())
  })

  it('không có số OMNI ⇒ bảng cũ y nguyên: không cột mới, tiêu đề cũ, không dòng vi kỹ năng, không gọi lệnh nào', () => {
    const { container } = ve(null)
    expect(screen.getByRole('heading', { name: 'Từng em × dạng · % câu thành thạo' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Cần thầy dạy lại' })).toBeTruthy()
    const dau = [...container.querySelectorAll('thead th')].map((x) => x.textContent ?? '')
    expect(dau).not.toContain('Sơ ý')
    expect(dau.some((t) => t.startsWith('Khoảng cách tới 8'))).toBe(false)
    expect(container.querySelector('[data-o-p]')).toBeNull()
    expect(container.querySelector('[data-khoi="vi-ky-nang-bai"]')).toBeNull()
    expect(container.querySelector('[data-khoi="can-thay-chua"]')).toBeNull()
    expect(goi).not.toHaveBeenCalled()
  })
})

describe('Vi kỹ năng — A.I tự gắn, thầy không phải duyệt', () => {
  const LO = {
    ok: true,
    cau: [
      { qid: 'DH-A-I-17', stt: 17, de: 'Thuỷ phân phenyl acetate trong NaOH dư…', phan: 'I', maDang: 'D-TP', tenDang: 'Thuỷ phân ester đơn chức', goiY: ['D-TP#1'] },
      { qid: 'DH-A-I-5', stt: 5, de: 'Tên gọi của CH3COOC2H5 là', phan: 'I', maDang: 'D-DP', tenDang: 'Danh pháp ester', goiY: ['D-DP#1'] },
    ],
    vkn: [
      { id: 'D-TP#1', maDang: 'D-TP', ten: 'Viết sản phẩm thuỷ phân', thuTu: 1 },
      { id: 'D-TP#2', maDang: 'D-TP', ten: 'Hệ số NaOH với ester của phenol', thuTu: 2 },
      { id: 'D-DP#1', maDang: 'D-DP', ten: 'Gốc axit + gốc rượu', thuTu: 1 },
    ],
    conLai: 0,
  }
  it('mặc định chỉ một dòng nhỏ "đã gắn tự động · Xem" (không khối duyệt, không gọi q-lo); bấm Xem ⇒ danh sách chỉ-xem', async () => {
    goi.mockImplementation(async (_d: string, b: Record<string, unknown>) => (b.action === 'q-lo' ? { ok: true, du: LO } : { ok: false, loai: 'tu_choi', chu: 'x' }))
    const { container } = ve(OMNI)
    const dong = container.querySelector('[data-khoi="vi-ky-nang-bai"]') as HTMLElement
    expect(dong.textContent).toContain(`Vi kỹ năng: ${TEN_AI} đã gắn tự động`)
    expect(container.querySelector('[data-khoi="vi-ky-nang-than"]')).toBeNull()
    expect(container.textContent).not.toMatch(/chưa duyệt/i)
    expect(goi).not.toHaveBeenCalled()
    fireEvent.click(within(dong).getByRole('button', { name: 'Xem' }))
    await waitFor(() => expect(goi).toHaveBeenCalledWith('/gv/omni', { action: 'q-lo', chienDichId: 'cd-1' }))
    const than = (await screen.findByRole('heading', { name: 'Vi kỹ năng của bài' })).closest('section') as HTMLElement
    expect(than.querySelector('[data-vkn-gan="DH-A-I-17"]')!.textContent).toBe('Vi kỹ năng: Viết sản phẩm thuỷ phân')
    expect(within(than).queryByRole('button', { name: 'Lưu vi kỹ năng đã sửa' })).toBeNull()
    expect(than.textContent).not.toMatch(/chưa duyệt/i)
  })

  it('thầy muốn sửa: bật/tắt vi kỹ năng + thêm vi kỹ năng mới ⇒ `q-duyet` CHỈ gửi câu đã đổi + vi kỹ năng mới', async () => {
    goi.mockImplementation(async (_d: string, b: Record<string, unknown>) => (b.action === 'q-lo' ? { ok: true, du: LO } : b.action === 'q-duyet' ? { ok: true, du: { ok: true, daDuyet: 1 } } : { ok: false, loai: 'tu_choi', chu: 'x' }))
    const { container } = ve(OMNI)
    fireEvent.click(within(container.querySelector('[data-khoi="vi-ky-nang-bai"]') as HTMLElement).getByRole('button', { name: 'Xem' }))
    const than = (await screen.findByRole('heading', { name: 'Vi kỹ năng của bài' })).closest('section') as HTMLElement
    fireEvent.click(within(than).getByRole('button', { name: 'Sửa vi kỹ năng' }))
    const cau17 = than.querySelector('[data-q="DH-A-I-17"]') as HTMLElement
    fireEvent.click(within(cau17).getByRole('button', { name: 'Hệ số NaOH với ester của phenol' }))
    expect(within(cau17).getByRole('button', { name: 'Hệ số NaOH với ester của phenol' }).getAttribute('aria-pressed')).toBe('true')
    // Thêm vi kỹ năng mới cho dạng Thuỷ phân rồi bật cho câu 17.
    fireEvent.change(within(than).getByLabelText('Dạng'), { target: { value: 'D-TP' } })
    fireEvent.change(within(than).getByLabelText('Tên vi kỹ năng'), { target: { value: 'Tính số mol NaOH phản ứng' } })
    fireEvent.change(within(than).getByLabelText('Tên lỗi hay gặp (không bắt buộc)'), { target: { value: 'quên phenol ăn 2 NaOH' } })
    fireEvent.click(within(than).getByRole('button', { name: 'Thêm vi kỹ năng' }))
    fireEvent.click(within(cau17).getByRole('button', { name: 'Tính số mol NaOH phản ứng' }))
    fireEvent.click(within(than).getByRole('button', { name: 'Lưu vi kỹ năng đã sửa' }))
    await waitFor(() => expect(goi.mock.calls.some(([, b]) => b.action === 'q-duyet')).toBe(true))
    const gui = goi.mock.calls.find(([, b]) => b.action === 'q-duyet')![1]
    expect(gui).toEqual({
      action: 'q-duyet',
      ds: [{ qid: 'DH-A-I-17', vkn: ['D-TP#1', 'D-TP#2', 'D-TP#3'] }],
      vknMoi: [{ id: 'D-TP#3', maDang: 'D-TP', ten: 'Tính số mol NaOH phản ứng', tenLoi: 'quên phenol ăn 2 NaOH', nhanNen: null, thuTu: 3 }],
    })
  })
})

describe('màn Lên bảng (chế độ chiến dịch) nạp Bảng bài OMNI', () => {
  const DS = { homNay: '2026-10-07', chienDich: [{ ...bang().chienDich, hetHan: false }] }
  it('`/gv/omni bang` ok ⇒ bảng có cột OMNI; gửi đúng chienDichId', async () => {
    goi.mockImplementation(async (d: string, b: Record<string, unknown>) => {
      if (d === '/gv/chien-dich' && b.action === 'danh-sach') return { ok: true, du: { ok: true, ...DS } }
      if (d === '/gv/chien-dich' && b.action === 'bang') return { ok: true, du: { ok: true, ...bang() } }
      if (d === '/gv/omni' && b.action === 'bang') return { ok: true, du: OMNI }
      return { ok: false, loai: 'tu_choi', chu: 'lệnh lạ' }
    })
    const { container } = render(<LenBangChienDich />)
    await screen.findByRole('heading', { name: 'Từng em × dạng · P nắm dạng kèm số câu tự làm' })
    expect(goi).toHaveBeenCalledWith('/gv/omni', { action: 'bang', chienDichId: 'cd-1' })
    expect([...container.querySelectorAll('thead th')].map((x) => x.textContent)).toContain('Sơ ý')
  })
  it.each([
    ['ok:false (OMNI tắt / đang dựng)', { ok: false, loai: 'tu_choi', chu: 'Lệnh bang đang dựng.' }],
    ['hình dạng lạ', { ok: true, du: { ok: true, em: [], dang: ['Danh pháp'], chienDich: {} } }],
    ['máy chủ chưa có lệnh', { ok: false, loai: 'chua_co_lenh', chu: 'Máy chủ chưa có lệnh OMNI' }],
  ])('%s ⇒ bảng cũ y nguyên, không hiện lỗi OMNI', async (_ten, traLoi) => {
    goi.mockImplementation(async (d: string, b: Record<string, unknown>) => {
      if (d === '/gv/chien-dich' && b.action === 'danh-sach') return { ok: true, du: { ok: true, ...DS } }
      if (d === '/gv/chien-dich' && b.action === 'bang') return { ok: true, du: { ok: true, ...bang() } }
      if (d === '/gv/omni') return traLoi
      return { ok: false, loai: 'tu_choi', chu: 'lệnh lạ' }
    })
    const { container } = render(<LenBangChienDich />)
    await screen.findByRole('heading', { name: 'Từng em × dạng · % câu thành thạo' })
    await waitFor(() => expect(goi.mock.calls.some(([d]) => d === '/gv/omni')).toBe(true))
    await new Promise((r) => setTimeout(r, 20))
    expect(screen.getByRole('heading', { name: 'Từng em × dạng · % câu thành thạo' })).toBeTruthy()
    expect([...container.querySelectorAll('thead th')].map((x) => x.textContent)).not.toContain('Sơ ý')
    expect(screen.getByRole('heading', { name: 'Cần thầy dạy lại' })).toBeTruthy()
    expect(container.textContent).not.toContain('đang dựng')
  })
})
