import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { hocLieuMau } from './_chua-cau-sai-fixture'
import { oChuaCuoi } from '../src/lib/chua-cau-sai-chieu'
import { taoHtmlMayChieu } from '../src/lib/html-may-chieu'
import type { NhomChuaTrenLop } from '../server/src/chua-cau-sai-chieu-kieu'
const m = vi.hoisted(() => ({
  goi: vi.fn(),
  thay: undefined as any,
  dd: {
    idBuoi: 'buoi',
    buoiXong: false,
    coMat: [{ sbd: 'HS1' }],
    tt: { buoi: { lop: '12A1' } },
  },
  gan: vi.fn(),
}))
vi.mock('../src/lib/chua-cau-sai-thay-api', () => ({ goiChuaThay: m.goi }))
vi.mock('../src/components/day-hoc/DiemDanhBuoi', () => ({
  useDiemDanhBuoi: () => m.dd,
  BuocDiemDanh: () => <p>Điểm danh có sẵn</p>,
}))
vi.mock('../src/components/chien-dich/ghi-to-chieu', () => ({
  useGhiToChieu: (_id: any, _ghi: any, thay: any) => {
    m.thay = thay
    return {
      moPhien: () => 'phien-chua-cuoi-123456',
      ganO: m.gan,
      dongPhien: vi.fn(),
    }
  },
}))
vi.mock('../src/components/KhungXemPhieu', () => ({
  default: ({ html }: any) => <pre data-testid="to-chieu">{html}</pre>,
}))
import CauCanChua from '../src/components/chua-cau-sai/CauCanChuaTrenLop'
const nhom = (): NhomChuaTrenLop => ({
  id: 'g1',
  lop: '12A1',
  qid: 'Q',
  buocId: 'm',
  tieuDe: 'Khối lượng mol',
  maLoi: null,
  diemVuong: 'Cần kiểm quan hệ khối lượng mol.',
  cauGoc: { phan: 'III', text: 'Tính M(NaOH).' },
  buoc: hocLieuMau().buoc,
  guiLuc: 1,
  em: [
    {
      dotId: 'D1',
      sbd: 'HS1',
      hoTen: 'Tên em có mặt',
      revision: 5,
      daHieu: ['Đọc đề'],
      traLoi: '23',
      hoi: 'Tính M(KOH).',
      soVongHoTro: 2,
    },
    {
      dotId: 'D2',
      sbd: 'HS2',
      hoTen: 'Tên em vắng',
      revision: 5,
      daHieu: [],
      traLoi: '24',
      hoi: 'Tính M(KOH).',
      soVongHoTro: 2,
    },
  ],
})
beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  m.dd.coMat = [{ sbd: 'HS1' }]
  m.goi.mockResolvedValue({ ok: true, bat: true, ds: [nhom()], conNua: false })
})
describe('Màn chiếu bước cuối', () => {
  it('thầy xem bằng chứng riêng; tờ chiếu giữ đề, không có tên, đáp án sai hay nút chấm cá nhân', () => {
    const h = taoHtmlMayChieu([oChuaCuoi(nhom(), 1)], {
      cauNoi: { maPhien: 'phien-chua-cuoi-123456' },
      nutAiSai: false,
    })
    const dom = new DOMParser().parseFromString(h, 'text/html')
    expect(dom.querySelector('.mc-than')?.textContent).toContain(
      'Cùng nối lại: Khối lượng mol',
    )
    expect(dom.querySelector('.mc-than')?.textContent).toContain('Tính M(NaOH)')
    expect(dom.querySelector('.mc-de-phan')?.textContent).toContain(
      'Trả lời ngắn',
    )
    expect(dom.body.textContent).not.toContain('Tên em có mặt')
    expect(dom.body.textContent).not.toContain('Tên em vắng')
    expect(dom.querySelector('.mc-cham')).toBeNull()
    expect(dom.querySelector('.mc-nut-hien-em')).toBeNull()
    expect(dom.querySelector('.mc-thay-chua-nut')).toBeTruthy()
    expect(dom.querySelector('.mc-giai')?.hasAttribute('hidden')).toBe(true)
  })
  // HÀNH TRÌNH › CẦN THẦY CHỮA (trung tu 09/10 tối): nhúng dưới danh sách cần chữa — bỏ tiêu đề + đoạn giải thích, đánh dấu + cuộn tới nhóm thầy bấm.
  it('gọn: không tiêu đề/đoạn giải thích; nhóm thầy bấm được đánh dấu và cuộn tới; điểm danh + chiếu giữ nguyên', async () => {
    const cuon = vi.fn()
    const goc = Element.prototype.scrollIntoView
    Element.prototype.scrollIntoView = cuon
    try {
      const { container } = render(<CauCanChua gon chonDau="g1" />)
      expect(await screen.findByText('Chiếu bước này để chữa chung')).toBeTruthy()
      expect(screen.queryByRole('heading', { name: 'Câu cần chữa · Bước cuối trên lớp' })).toBeNull()
      expect(container.textContent).not.toContain('Hệ thống đã giúp em tự gỡ từng bước')
      expect(screen.getByText('Điểm danh có sẵn')).toBeTruthy()
      expect(container.querySelector('article[data-nhom-chua="g1"]')?.getAttribute('data-chon')).toBe('true')
      await waitFor(() => expect(cuon).toHaveBeenCalledTimes(1))
    } finally {
      Element.prototype.scrollIntoView = goc
    }
  })
  it('chỉ các em có mặt được xác nhận từ nút Thầy chữa trên tờ', async () => {
    render(<CauCanChua />)
    fireEvent.click(await screen.findByText('Chiếu bước này để chữa chung'))
    await screen.findByTestId('to-chieu')
    m.goi
      .mockResolvedValueOnce({ ok: true, soEm: 1, choHocLieu: 0 })
      .mockResolvedValue({ ok: true, bat: true, ds: [], conNua: false })
    expect(await m.thay({ qid: 'g1' })).toMatchObject({ ok: true })
    const call = m.goi.mock.calls.find((x) => x[0] === 'da-chua-tren-lop')!
    expect(call[1].dot).toEqual([{ dotId: 'D1', revision: 5 }])
    expect(call[1].buoiId).toBe('buoi')
    await screen.findByText(/Đã ghi buổi chữa cho 1 em có mặt/)
  })
  it('câu tổng hợp cần chọn bước vừa chữa trước khi mở tờ', async () => {
    m.goi.mockResolvedValue({
      ok: true,
      bat: true,
      ds: [{ ...nhom(), buocId: '__ghep_bai__' }],
    })
    render(<CauCanChua />)
    const nut = await screen.findByText('Chiếu bước này để chữa chung')
    expect((nut as HTMLButtonElement).disabled).toBe(true)
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'm' } })
    expect((nut as HTMLButtonElement).disabled).toBe(false)
  })
  it('nhiều em được chia lượt ghi tự động; mất mạng giữa lượt giữ cùng mã khi thử lại', async () => {
    const g = nhom()
    g.em = Array.from({ length: 7 }, (_, i) => ({
      ...g.em[0]!,
      dotId: `D${i}`,
      sbd: `HS${i}`,
    }))
    m.dd.coMat = g.em.map((e) => ({ sbd: e.sbd }))
    m.goi.mockResolvedValue({ ok: true, bat: true, ds: [g] })
    render(<CauCanChua />)
    fireEvent.click(await screen.findByText('Chiếu bước này để chữa chung'))
    await screen.findByTestId('to-chieu')
    m.goi
      .mockResolvedValueOnce({ ok: true, soEm: 6, choHocLieu: 0 })
      .mockRejectedValueOnce(new Error('Mất mạng'))
    expect(await m.thay({ qid: 'g1' })).toMatchObject({ ok: false })
    const truoc = m.goi.mock.calls
      .filter((x) => x[0] === 'da-chua-tren-lop')
      .map((x) => x[1])
    m.goi
      .mockResolvedValueOnce({ ok: true, soEm: 6, choHocLieu: 0 })
      .mockResolvedValueOnce({ ok: true, soEm: 1, choHocLieu: 0 })
      .mockResolvedValue({ ok: true, bat: true, ds: [] })
    expect(await m.thay({ qid: 'g1' })).toMatchObject({ ok: true })
    const sau = m.goi.mock.calls
      .filter((x) => x[0] === 'da-chua-tren-lop')
      .map((x) => x[1])
    expect(sau.slice(2)).toEqual(truoc)
    await waitFor(() =>
      expect(screen.getByText(/Đã ghi buổi chữa cho 7 em có mặt/)).toBeTruthy(),
    )
  })
})
