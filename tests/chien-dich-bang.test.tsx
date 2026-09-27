// GAME HÓA 2.0 · BẢNG CHIẾN DỊCH (bản vẽ GV-BangChienDich) + màn Lên bảng chọn chiến dịch, tự chuyển Buổi chữa khi hết hạn nộp.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'

const { goi } = vi.hoisted(() => ({ goi: vi.fn() }))
vi.mock('../src/lib/goi-lenh-thay', () => ({ goiLenh: (duong: string, body: Record<string, unknown>) => goi(duong, body) }))
vi.mock('../src/lib/exam-db', () => ({ loadExamSources: async () => [] }))

import BangChienDich, { SO_EM_THU_GON, nguoiGiaiMau } from '../src/components/chien-dich/BangChienDich'
import LenBangChienDich, { chonMacDinh } from '../src/components/chien-dich/LenBangChienDich'
import type { BangChienDich as DuBang, EmBang } from '../src/components/chien-dich/api'
import { mucO } from '../src/components/chien-dich/tinh'

const DANG = ['Danh pháp ester', 'Đồng phân', 'Thuỷ phân ester đơn chức', 'Chất béo', 'Đốt cháy']
const em = (ten: string, tiLe: (number | null)[], them: Partial<EmBang> = {}): EmBang => ({
  sbd: ten,
  ten,
  coXat: 40,
  thanhThao: 20,
  canDayLai: 0,
  treNhip: 0,
  huyetChien: false,
  theoDang: Object.fromEntries(DANG.map((d, i) => [d, tiLe[i] ?? null])),
  ...them,
})
const bang = (dsEm: EmBang[], them: Partial<DuBang> = {}): DuBang => ({
  chienDich: { id: 'cd-1', ten: 'Ester – Lipid', lop: '12A1', maDe: ['DE-A'], hanNop: '2026-10-04', theLucNgay: 40, huyetChien: true, maCa: null, taoLuc: '', trangThai: 'dang_chay', soCau: 40, soEm: dsEm.length },
  homNay: '2026-10-03',
  hetHan: false,
  lop: { coXat: 0.93, thanhThao: 0.34, huyetChien: 2, canDayLaiCau: 4, canDayLaiLuot: 16 },
  dang: DANG,
  em: dsEm,
  canDayLai: [
    { qid: 'DE-A-I-17', stt: 17, dang: 'Thuỷ phân ester đơn chức', soEm: 9 },
    { qid: 'DE-A-I-31', stt: 31, dang: 'Đồng phân', soEm: 4 },
    { qid: 'DE-A-I-5', stt: 5, dang: 'Danh pháp ester', soEm: 2 },
    { qid: 'DE-A-I-28', stt: 28, dang: 'Đốt cháy', soEm: 1 },
  ],
  ...them,
})
const NOW = Date.UTC(2026, 9, 3, 11, 59, 59) // 18:59 giờ Việt Nam Thứ Bảy 03/10

beforeEach(() => {
  goi.mockReset()
})
afterEach(cleanup)

describe('ô màu theo % thành thạo của dạng', () => {
  it('≥ 70 xanh đậm · 40–69 xanh nhạt · 20–39 vàng · < 20 đỏ · không có câu = ô trống', () => {
    expect([0.7, 0.69, 0.4, 0.39, 0.2, 0.19, 0, null].map(mucO)).toEqual(['xd', 'xg', 'xg', 'xv', 'xv', 'xr', 'xr', 'trong'])
  })

  it('bảng từng em hiện đúng ô màu, chú giải, nhãn Huyết Chiến, Trễ nhịp; 4 ô số có nhãn', () => {
    const { container } = render(
      <BangChienDich
        du={bang([em('Trần Bảo', [0.8, 0.55, 0.3, 0.1, null]), em('Lê Chi', [0.3, 0.15, 0.05, 0.25, 0.2], { huyetChien: true, treNhip: 2, coXat: 35, thanhThao: 8 })])}
        nowMs={NOW}
        dangChieu={false}
        onChieu={vi.fn(async () => true)}
        onDaChua={vi.fn()}
      />,
    )
    expect(screen.getByRole('heading', { name: 'Lên bảng · Chiến dịch Ester – Lipid' })).toBeTruthy()
    expect(container.textContent).toContain('Hạn nộp: còn 1 ngày 5 giờ (tới 23:59 Chủ Nhật 04/10)')
    const o = within(container.querySelector('[data-khoi="o-so-chien-dich"]') as HTMLElement)
    expect(o.getByText('Cọ xát trung bình lớp').nextSibling?.textContent).toBe('93%')
    expect(o.getByText('Thành thạo trung bình lớp').nextSibling?.textContent).toBe('34%')
    expect(o.getByText('Em đang Huyết Chiến').nextSibling?.textContent).toBe('2 em')
    expect(o.getByText('Cần thầy dạy lại').nextSibling?.textContent).toBe('4 câu · 16 lượt em')

    const hangBao = screen.getByRole('rowheader', { name: 'Trần Bảo' }).closest('tr') as HTMLElement
    expect([...hangBao.querySelectorAll('[data-o]')].map((x) => x.getAttribute('data-o'))).toEqual(['xd', 'xg', 'xv', 'xr', 'trong'])
    expect([...hangBao.querySelectorAll('[data-o]')].map((x) => x.textContent)).toEqual(['80%', '55%', '30%', '10%', '—'])
    expect(hangBao.querySelector('.cd-o--xd')).toBeTruthy()

    const hangChi = screen.getByRole('rowheader', { name: /Lê Chi/ }).closest('tr') as HTMLElement
    expect(within(hangChi).getByText('Huyết Chiến')).toBeTruthy()
    expect(hangChi.textContent).toContain('2 ngày')
    expect(hangChi.textContent).toContain('88%') // cọ xát 35/40
    expect(hangChi.textContent).toContain('20%') // thành thạo 8/40

    const chuGiai = container.querySelector('[data-khoi="chu-giai-o-mau"]') as HTMLElement
    expect(chuGiai.textContent).toContain('Ô màu = % câu thành thạo của dạng:')
    for (const t of ['≥ 70%', '40–69%', '20–39%', 'dưới 20%']) expect(chuGiai.textContent).toContain(t)

    // Xếp theo tên gọi: Bảo trước Chi
    const ten = [...container.querySelectorAll('tbody th')].map((x) => x.textContent)
    expect(ten[0]).toContain('Trần Bảo')
  })

  it('lớp đông: thu gọn 12 em, "Xem cả lớp" mở đủ', () => {
    const ds = Array.from({ length: 15 }, (_, i) => em(`Em Số${String(i + 1).padStart(2, '0')}`, [0.5, 0.5, 0.5, 0.5, 0.5]))
    const { container } = render(<BangChienDich du={bang(ds)} nowMs={NOW} dangChieu={false} onChieu={vi.fn(async () => true)} onDaChua={vi.fn()} />)
    expect(container.querySelectorAll('tbody tr')).toHaveLength(SO_EM_THU_GON)
    expect(screen.getByText(`Hiện ${SO_EM_THU_GON}/15 em · xếp theo tên`)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Xem cả lớp' }))
    expect(container.querySelectorAll('tbody tr')).toHaveLength(15)
  })

  it('"Gọi lên bảng 3 câu đầu" chiếu đúng 3 câu cần dạy lại; "Chữa xong 3 câu này" hỏi lại rồi gọi `chua-xong` đúng 3 câu', async () => {
    goi.mockResolvedValue({ ok: true, du: { ok: true, soLuot: 15, ngayOnLai: '2026-10-04' } })
    const onChieu = vi.fn(async () => true)
    const onDaChua = vi.fn()
    const du = bang([em('Trần Bảo', [0.8, 0.9, 0.7, 0.5, 0.5]), em('Lê Chi', [0.1, 0.1, 0.1, 0.1, 0.1])])
    render(<BangChienDich du={du} nowMs={NOW} dangChieu={false} onChieu={onChieu} onDaChua={onDaChua} />)
    fireEvent.click(screen.getByRole('button', { name: 'Gọi lên bảng 3 câu đầu' }))
    await waitFor(() => expect(onChieu).toHaveBeenCalled())
    const [ds, tenBuoi] = onChieu.mock.calls[0] as unknown as [{ qid: string; sbd: string }[], string]
    expect(ds.map((o) => o.qid)).toEqual(['DE-A-I-17', 'DE-A-I-31', 'DE-A-I-5'])
    expect(ds[0]!.sbd).toBe('Trần Bảo') // em thành thạo dạng ấy nhiều nhất giải mẫu
    expect(tenBuoi).toContain('Ester – Lipid')

    fireEvent.click(await screen.findByRole('button', { name: 'Chữa xong 3 câu này' }))
    const hop = screen.getByRole('alertdialog')
    expect(hop.textContent).toContain('Đoàn Hộ Tống')
    expect(hop.textContent).toContain('không hoàn tác')
    expect(goi).not.toHaveBeenCalled()
    fireEvent.click(within(hop).getByRole('button', { name: 'Chữa xong' }))
    await waitFor(() => expect(goi).toHaveBeenCalledWith('/gv/chien-dich', { action: 'chua-xong', id: 'cd-1', qids: ['DE-A-I-17', 'DE-A-I-31', 'DE-A-I-5'] }))
    await waitFor(() => expect(onDaChua).toHaveBeenCalled())
  })

  it('người giải mẫu không lặp một em khi còn em khác', () => {
    const e = [em('A', [0.9, 0.9, 0.9, 0.9, 0.9]), em('B', [0.5, 0.5, 0.5, 0.5, 0.5])]
    const ds = nguoiGiaiMau(bang(e).canDayLai.slice(0, 2), e)
    expect(ds.map((o) => o.sbd)).toEqual(['A', 'B'])
  })
})

describe('màn Lên bảng (chế độ chiến dịch)', () => {
  const DS = {
    homNay: '2026-10-05',
    chienDich: [
      { id: 'cd-2', ten: 'Amine', lop: '12A1', maDe: ['DE-B'], hanNop: '2026-10-10', theLucNgay: 40, huyetChien: true, maCa: null, taoLuc: '2026-10-03', trangThai: 'dang_chay', soCau: 40, soEm: 2, hetHan: false },
      { id: 'cd-1', ten: 'Ester – Lipid', lop: '12A1', maDe: ['DE-A'], hanNop: '2026-10-04', theLucNgay: 40, huyetChien: true, maCa: null, taoLuc: '2026-09-27', trangThai: 'dang_chay', soCau: 40, soEm: 2, hetHan: true },
    ],
  }
  const EM = [em('Trần Bảo', [0.8, 0.9, 0.7, 0.5, 0.5]), em('Lê Chi', [0.1, 0.1, 0.1, 0.1, 0.1])]

  it('chọn chiến dịch mặc định = cái đang chạy mới nhất', () => {
    expect(chonMacDinh(DS.chienDich as never)).toBe('cd-2')
    expect(chonMacDinh([])).toBe('')
  })

  it('đang chạy ⇒ Bảng chiến dịch; chọn chiến dịch hết hạn nộp ⇒ TỰ chuyển Buổi chữa (`buoi-chua`)', async () => {
    goi.mockImplementation(async (_d: string, b: Record<string, unknown>) => {
      if (b.action === 'danh-sach') return { ok: true, du: { ok: true, ...DS } }
      if (b.action === 'bang' && b.id === 'cd-2') return { ok: true, du: { ok: true, ...bang(EM, { chienDich: { ...bang(EM).chienDich, id: 'cd-2', ten: 'Amine', hanNop: '2026-10-10' } }) } }
      if (b.action === 'bang' && b.id === 'cd-1') return { ok: true, du: { ok: true, ...bang(EM, { hetHan: true, homNay: '2026-10-05' }) } }
      if (b.action === 'buoi-chua')
        return {
          ok: true,
          du: {
            ok: true,
            chienDich: { id: 'cd-1', ten: 'Ester – Lipid', hanNop: '2026-10-04', lop: '12A1' },
            hetHan: true,
            soEm: 2,
            lop: { coXat: 0.96, thanhThao: 0.51 },
            cau: [{ qid: 'DE-A-I-17', stt: 17, dang: 'Thuỷ phân ester đơn chức', phan: 'I', mucDo: 'VD', soChuaThanhThao: 1, soCanDayLai: 1, diemChua: 3, giaiMau: { sbd: 'Trần Bảo', ten: 'Trần Bảo' }, emSua: [{ sbd: 'Lê Chi', ten: 'Lê Chi' }] }],
          },
        }
      return { ok: false, loai: 'tu_choi', chu: 'lệnh lạ' }
    })
    render(<LenBangChienDich onCheDoCu={vi.fn()} />)
    expect(await screen.findByRole('heading', { name: 'Lên bảng · Chiến dịch Amine' })).toBeTruthy()
    expect(goi.mock.calls.some(([, b]) => b.action === 'buoi-chua')).toBe(false)

    fireEvent.change(screen.getByLabelText('Chiến dịch'), { target: { value: 'cd-1' } })
    expect(await screen.findByRole('heading', { name: 'Lên bảng · Buổi chữa Ester – Lipid' })).toBeTruthy()
    expect(goi.mock.calls.some(([, b]) => b.action === 'buoi-chua' && b.id === 'cd-1')).toBe(true)
    expect(screen.getByRole('button', { name: 'Mở tờ máy chiếu' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Gọi lên bảng theo một ca kiểm tra (cách cũ)' })).toBeTruthy()
  })

  it('máy chủ chưa có lệnh ⇒ nói thật + nút thử lại; chưa có chiến dịch ⇒ nói vì sao + việc làm tiếp', async () => {
    goi.mockResolvedValueOnce({ ok: false, loai: 'chua_co_lenh', chu: 'Máy chủ chưa có lệnh Chiến dịch (Game Hóa 2.0) — cần đẩy bản máy chủ mới.' })
    render(<LenBangChienDich />)
    expect(await screen.findByText(/Máy chủ chưa có lệnh Chiến dịch/)).toBeTruthy()
    goi.mockResolvedValueOnce({ ok: true, du: { ok: true, homNay: '2026-10-05', chienDich: [] } })
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
    expect(await screen.findByRole('heading', { name: 'Chưa có chiến dịch nào' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Tới Ca kiểm tra' })).toBeTruthy()
  })
})
