// GAME HÓA 2.0 · BẢNG CHIẾN DỊCH (bản vẽ docs/ban-ve-gv-2809/GV-BangChienDich, thầy chốt 28/09) + màn Chữa trên lớp chọn chiến dịch, tự chuyển Buổi chữa khi hết hạn nộp.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'

const { goi } = vi.hoisted(() => ({ goi: vi.fn() }))
vi.mock('../src/lib/goi-lenh-thay', () => ({ goiLenh: (duong: string, body: Record<string, unknown>) => goi(duong, body) }))
vi.mock('../src/lib/exam-db', () => ({ loadExamSources: async () => [] }))

import BangChienDich, { SO_EM_THU_GON, demHangLop, nguoiGiaiMau, tbLopTheoDang } from '../src/components/chien-dich/BangChienDich'
import LenBangChienDich, { chonMacDinh } from '../src/components/chien-dich/LenBangChienDich'
import type { BangChienDich as DuBang, EmBang } from '../src/components/chien-dich/api'
import { CHU_GIAI_HANG, hangTuTiLe, mucO } from '../src/components/chien-dich/tinh'
import { hangTuTiLe as hangMayChu } from '../server/src/srs2-loi'

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

describe('hạng ô heatmap — ĐÚNG ngưỡng thuật toán (Yếu < 40 · TB 40–65 · Khá 65–85 · Giỏi > 85), không phải 40/60/80 của bản vẽ', () => {
  it('mucO theo hạng; em chưa làm câu nào của dạng ⇒ "chua-lam"; dạng không có câu ⇒ "trong"', () => {
    expect([0.39, 0.4, 0.6, 0.649, 0.65, 0.8, 0.85, 0.851, 1, null].map((x) => mucO(x))).toEqual(['L1', 'L2', 'L2', 'L2', 'L3', 'L3', 'L3', 'L4', 'L4', 'trong'])
    expect(mucO(0, 0)).toBe('chua-lam')
    expect(mucO(0, 0.5)).toBe('L1')
    expect(CHU_GIAI_HANG.map((g) => g.chu)).toEqual(['Yếu dưới 40%', 'Trung bình 40–65%', 'Khá 65–85%', 'Giỏi trên 85%'])
  })
  it('hạng phía màn khớp từng điểm với hạng máy chủ dùng để bốc câu', () => {
    for (let i = 0; i <= 1000; i++) expect(hangTuTiLe(i / 1000)).toBe(hangMayChu(i / 1000))
  })
})

describe('bảng chiến dịch (bản vẽ GV-BangChienDich 28/09)', () => {
  it('5 thẻ số có nhãn + mẫu số + so với hôm qua; heatmap em yếu trước, dạng lớp yếu trước; nhãn Quá tải hôm nay, Trễ nhịp', () => {
    const { container } = render(
      <BangChienDich
        du={bang([em('Trần Bảo', [0.8, 0.55, 0.3, 0.1, null]), em('Lê Chi', [0.3, 0.15, 0.05, 0.25, 0.2], { huyetChien: true, treNhip: 2, coXat: 35, thanhThao: 8 })], {
          lop: { coXat: 0.93, thanhThao: 0.34, huyetChien: 2, canDayLaiCau: 4, canDayLaiLuot: 16, homQua: { coXat: 0.85, thanhThao: 0.36 }, nhip: { vuot: 0, dung: 1, tre12: 1, tre3: 0 }, dungNhip: 1 },
        })}
        nowMs={NOW}
        dangChieu={false}
        onChieu={vi.fn(async () => true)}
        onDaChua={vi.fn()}
      />,
    )
    expect(screen.getByRole('heading', { name: 'Ester – Lipid · 12A1' })).toBeTruthy()
    expect(container.textContent).toContain('Chữa trên lớp › Bảng chiến dịch')
    expect(container.textContent).toContain('hạn nộp 23:59 · Chủ Nhật 04/10/2026 (còn 1 ngày 5 giờ)')
    const so = (k: string) => container.querySelector(`[data-so="${k}"]`)?.textContent
    expect(so('da-lam-qua')).toBe('93% câu')
    expect(so('thanh-thao')).toBe('34% câu')
    expect(so('dung-nhip')).toBe('1/ 2 em')
    expect(so('qua-tai')).toBe('2em')
    expect(so('can-day-lai')).toBe('4câu')
    const o = container.querySelector('[data-khoi="o-so-chien-dich"]') as HTMLElement
    expect(o.textContent).toContain('Đã làm qua')
    expect(o.textContent).toContain('câu em đã làm ít nhất 1 lần')
    expect(o.textContent).toContain('TB 37 / 40 câu · ▲ 8 điểm so với hôm qua')
    expect(o.textContent).toContain('▼ 2 điểm so với hôm qua')
    expect(o.textContent).toContain('1 em trễ nhịp · 0 em từ 3 ngày')
    expect(o.textContent).toContain('16 lượt em')
    expect(o.textContent).not.toMatch(/Cọ xát|Huyết Chiến/)

    // Dạng xếp theo TB lớp tăng dần: Thuỷ phân (17,5%) · Chất béo (17,5%) · Đốt cháy (20%) · Đồng phân (35%) · Danh pháp (55%)
    const dauCot = [...container.querySelectorAll('thead .cd-ten-dang-xoay')].map((x) => x.textContent)
    expect(dauCot).toEqual(['Thuỷ phân ester đơn chức', 'Chất béo', 'Đốt cháy', 'Đồng phân', 'Danh pháp ester'])
    const hangBao = screen.getByRole('rowheader', { name: 'Trần Bảo' }).closest('tr') as HTMLElement
    expect([...hangBao.querySelectorAll('[data-o]')].map((x) => x.getAttribute('data-o'))).toEqual(['L1', 'L1', 'trong', 'L2', 'L3'])
    expect([...hangBao.querySelectorAll('[data-o]')].map((x) => x.textContent)).toEqual(['30', '10', '—', '55', '80'])

    const hangChi = screen.getByRole('rowheader', { name: /Lê Chi/ }).closest('tr') as HTMLElement
    expect(within(hangChi).getByText('Quá tải hôm nay')).toBeTruthy()
    expect(hangChi.textContent).toContain('2 ngày')
    expect(hangChi.textContent).toContain('20%') // thành thạo 8/40

    // Em thành thạo thấp trước: Chi (8) rồi Bảo (20); dòng đầu là "Cả lớp"
    const ten = [...container.querySelectorAll('tbody th')].map((x) => x.textContent)
    expect(ten[0]).toBe('Cả lớp (2 em)')
    expect(ten[1]).toContain('Lê Chi')
    expect(ten[2]).toContain('Trần Bảo')

    const chuGiai = container.querySelector('[data-khoi="chu-giai-o-mau"]') as HTMLElement
    for (const t of ['Yếu dưới 40%', 'Trung bình 40–65%', 'Khá 65–85%', 'Giỏi trên 85%', 'Chưa làm']) expect(chuGiai.textContent).toContain(t)
  })

  it('ô "Chưa làm" gạch chéo khi em chưa làm câu nào của dạng; dòng Cả lớp có hạng; thẻ nhịp lớp và hạng lớp theo dạng', () => {
    const ds = [
      em('An', [0.9, 0.7, 0.5, 0, 0.2], { daLamTheoDang: { 'Chất béo': 0 }, nhip: 'tre3', soNgayTre: 4, treNhip: 4 }),
      em('Bình', [0.9, 0.7, 0.5, 0.3, 0.2], { nhip: 'vuot' }),
    ]
    const { container } = render(
      <BangChienDich
        du={bang(ds, {
          lop: {
            coXat: 0.5, thanhThao: 0.4, huyetChien: 0, canDayLaiCau: 0, canDayLaiLuot: 0,
            nhip: { vuot: 1, dung: 0, tre12: 0, tre3: 1 }, dungNhip: 1,
            theoDang: { 'Danh pháp ester': 0.9, 'Đồng phân': 0.7, 'Thuỷ phân ester đơn chức': 0.5, 'Chất béo': 0.15, 'Đốt cháy': 0.2 },
            hangTheoDang: { 'Danh pháp ester': 'L4', 'Đồng phân': 'L3', 'Thuỷ phân ester đơn chức': 'L2', 'Chất béo': 'L1', 'Đốt cháy': 'L1' },
          },
          canDayLai: [],
        })}
        nowMs={NOW}
        dangChieu={false}
        onChieu={vi.fn(async () => true)}
        onDaChua={vi.fn()}
      />,
    )
    const hangAn = screen.getByRole('rowheader', { name: 'An' }).closest('tr') as HTMLElement
    const oBeo = [...hangAn.querySelectorAll('[data-o]')].find((x) => x.getAttribute('title')?.startsWith('Chất béo'))!
    expect(oBeo.getAttribute('data-o')).toBe('chua-lam')
    expect(oBeo.textContent).toBe('Chưa làm')
    expect(hangAn.textContent).toContain('4 ngày')
    const lop = container.querySelector('[data-khoi="hang-ca-lop"]') as HTMLElement
    expect(lop.textContent).toContain('Giỏi')
    expect(lop.textContent).toContain('Yếu')
    const nhip = container.querySelector('[data-khoi="nhip-lop"]') as HTMLElement
    expect(nhip.querySelector('[data-nhip="vuot"]')?.textContent).toContain('1 em')
    expect(nhip.querySelector('[data-nhip="tre3"]')?.textContent).toContain('Trễ từ 3 ngày')
    const hang = container.querySelector('[data-khoi="hang-lop-theo-dang"]') as HTMLElement
    expect([...hang.querySelectorAll('[data-hang]')].map((x) => x.textContent)).toEqual(['Giỏi1', 'Khá1', 'Trung bình1', 'Yếu2'])
  })

  it('máy chủ cũ (không có nhịp / TB lớp theo dạng) ⇒ vẫn vẽ: TB lớp tự tính, thẻ nhịp ẩn, Đúng nhịp "—"', () => {
    const { container } = render(<BangChienDich du={bang([em('A', [0.9, 0.5, 0.5, 0.5, 0.5])])} nowMs={NOW} dangChieu={false} onChieu={vi.fn(async () => true)} onDaChua={vi.fn()} />)
    expect(container.querySelector('[data-khoi="nhip-lop"]')).toBeNull()
    expect(container.querySelector('[data-so="dung-nhip"]')?.textContent).toBe('—/ 1 em')
    expect(tbLopTheoDang(bang([em('A', [0.9, 0.5, null, 0.5, 0.5]), em('B', [0.5, 0.5, null, 0.5, 0.5])]))['Danh pháp ester']).toBeCloseTo(0.7)
    expect(demHangLop({ a: 0.9, b: 0.3, c: null })).toEqual({ L1: 1, L2: 0, L3: 0, L4: 1 })
  })

  it('lớp đông: thu gọn 12 em (+ dòng Cả lớp), "Xem cả 15 em · 5 dạng" mở đủ', () => {
    const ds = Array.from({ length: 15 }, (_, i) => em(`Em Số${String(i + 1).padStart(2, '0')}`, [0.5, 0.5, 0.5, 0.5, 0.5]))
    const { container } = render(<BangChienDich du={bang(ds)} nowMs={NOW} dangChieu={false} onChieu={vi.fn(async () => true)} onDaChua={vi.fn()} />)
    expect(container.querySelectorAll('tbody tr')).toHaveLength(SO_EM_THU_GON + 1)
    expect(container.textContent).toContain(`Hiện ${SO_EM_THU_GON}/15 em`)
    fireEvent.click(screen.getByRole('button', { name: 'Xem cả 15 em · 5 dạng' }))
    expect(container.querySelectorAll('tbody tr')).toHaveLength(16)
  })

  it('"Chiếu 3 câu đầu lên bảng" chiếu đúng 3 câu cần dạy lại; "Chữa xong 3 câu này" hỏi lại rồi gọi `chua-xong` đúng 3 câu', async () => {
    goi.mockResolvedValue({ ok: true, du: { ok: true, soLuot: 15, ngayOnLai: '2026-10-04' } })
    const onChieu = vi.fn(async () => true)
    const onDaChua = vi.fn()
    const du = bang([em('Trần Bảo', [0.8, 0.9, 0.7, 0.5, 0.5]), em('Lê Chi', [0.1, 0.1, 0.1, 0.1, 0.1])])
    render(<BangChienDich du={du} nowMs={NOW} dangChieu={false} onChieu={onChieu} onDaChua={onDaChua} />)
    fireEvent.click(screen.getByRole('button', { name: 'Chiếu 3 câu đầu lên bảng' }))
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
    expect(await screen.findByRole('heading', { name: 'Amine · 12A1' })).toBeTruthy()
    expect(goi.mock.calls.some(([, b]) => b.action === 'buoi-chua')).toBe(false)

    fireEvent.change(screen.getByLabelText('Chiến dịch'), { target: { value: 'cd-1' } })
    expect(await screen.findByRole('heading', { name: 'Buổi chữa · Ester – Lipid · 12A1' })).toBeTruthy()
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
