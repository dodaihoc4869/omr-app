// THẺ CUỐI CHẶNG + CẦU NỐI NỘP CHẶNG Ở KHUNG XEM PHIẾU. Bản vẽ: docs/ban-ve-btvn-nang-do-2109/hs-3-the-cuoi-chang.jpg.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import TheCuoiChang from '../src/components/bang-nhiem-vu/TheCuoiChang'
import KhungXemPhieu from '../src/components/KhungXemPhieu'
import { theChangView, type KetQuaChang } from '../src/lib/btvn-ca-nhan-em'

const KET: KetQuaChang = {
  ok: true,
  ketQua: [],
  chuaLam: [],
  loDaXong: 3,
  chang: { chiSo: 2, soCau: 8, soDung: 6, xong: true },
  exp: { homNay: 46, conLaiLenCap: 30 },
  tienBo: { dangLenBac: [{ ma: 'tp', ten: 'Thuỷ phân ester', tu: 0, den: 1 }], soCauDungLai: 2, soCauMoiGap: 1, soDangMoi: 0, coTienBo: true },
}
const view = (o: Partial<KetQuaChang> = {}, soChang: number | null = 7) => theChangView({ ...KET, ...o }, soChang)!

afterEach(() => cleanup())

describe('thẻ cuối chặng', () => {
  it('hiện đúng nội dung của bản vẽ: tiêu đề, dòng phụ, dạng lên bậc, dòng đếm, EXP, hai nút', () => {
    render(<TheCuoiChang view={view()} dong={() => {}} veBang={() => {}} />)
    const hop = screen.getByRole('dialog')
    expect(hop.getAttribute('aria-modal')).toBe('true')
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Xong chặng 3')
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Hôm nay em đã tiến thêm')
    expect(screen.getByText('Chặng 3/7 · đúng 6/8 câu')).toBeTruthy()
    expect(screen.getByText('Dạng “Thuỷ phân ester”')).toBeTruthy()
    expect(hop.querySelector('.tcc-bac-cu')!.textContent).toBe('Biết')
    expect(hop.querySelector('.tcc-bac-moi')!.textContent).toBe('Hiểu')
    expect(hop.querySelectorAll('.tcc-thang div.on')).toHaveLength(2) // Biết + Hiểu sáng, Vận dụng chưa
    expect(screen.getByText('Đúng lại 2 câu từng sai')).toBeTruthy()
    expect(screen.getByText('Gặp 1 câu mới')).toBeTruthy()
    expect(screen.queryByText(/dạng mới/)).toBeNull() // soDangMoi = 0 ⇒ không nói
    expect(hop.querySelector('.tcc-exp-so')!.textContent).toContain('+46 EXP')
    expect(hop.querySelector('.tcc-exp-phu')!.textContent).toContain('30 EXP')
    expect(screen.getByRole('button', { name: 'Về Bảng nhiệm vụ' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Xem kết quả chặng' })).toBeTruthy()
  })

  it('thanh 7 chặng: 3 chặng xong, chặng kế "mai", còn lại trống; có nhãn đọc màn hình', () => {
    render(<TheCuoiChang view={view()} dong={() => {}} veBang={() => {}} />)
    const mini = screen.getByRole('img', { name: 'Đã xong 3 trên 7 chặng' })
    const doan = [...mini.querySelectorAll('i')].map((i) => i.className)
    expect(doan).toEqual(['xong', 'xong', 'xong', 'mai', '', '', ''])
  })

  it('Esc và nút X đóng thẻ (xem kết quả chặng); "Về Bảng nhiệm vụ" gọi veBang; nút chính được focus', () => {
    const dong = vi.fn()
    const veBang = vi.fn()
    render(<TheCuoiChang view={view()} dong={dong} veBang={veBang} />)
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Về Bảng nhiệm vụ' }))
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(dong).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: /Đóng thẻ/ }))
    expect(dong).toHaveBeenCalledTimes(2)
    fireEvent.click(screen.getByRole('button', { name: 'Xem kết quả chặng' }))
    expect(dong).toHaveBeenCalledTimes(3)
    fireEvent.click(screen.getByRole('button', { name: 'Về Bảng nhiệm vụ' }))
    expect(veBang).toHaveBeenCalledTimes(1)
  })

  it('không có tiến triển: thẻ IM — không dạng lên bậc, không dòng đếm, tiêu đề trung tính, vẫn có EXP', () => {
    render(<TheCuoiChang view={view({ tienBo: { dangLenBac: [], soCauDungLai: 0, soCauMoiGap: 0, soDangMoi: 0, coTienBo: false } })} dong={() => {}} veBang={() => {}} />)
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Em đã làm xong chặng này')
    expect(document.querySelector('.tcc-tienbo')).toBeNull()
    expect(document.querySelector('.tcc-ds')).toBeNull()
    expect(document.querySelector('.tcc-exp')).not.toBeNull()
  })

  it('không có thú (conLaiLenCap null) ⇒ không nói "lên cấp"; không có exp ⇒ không thẻ EXP', () => {
    const { unmount } = render(<TheCuoiChang view={view({ exp: { homNay: 4, conLaiLenCap: null } })} dong={() => {}} veBang={() => {}} />)
    expect(document.querySelector('.tcc-exp-phu')).toBeNull()
    unmount()
    render(<TheCuoiChang view={view({ exp: undefined })} dong={() => {}} veBang={() => {}} />)
    expect(document.querySelector('.tcc-exp')).toBeNull()
  })

  it('chặng cuối: "Xong cả bài", đúng x/y và ghi chú câu thưởng', () => {
    render(<TheCuoiChang view={view({ nop: { daNop: true, nopLuc: '', soDung: 40, soCau: 45, soCauCuaEm: 48, soCauThuongSai: 3, qidSai: [] } })} dong={() => {}} veBang={() => {}} />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Xong cả bài')
    expect(screen.getByText('Em đã xong cả bài: đúng 40/45 câu')).toBeTruthy()
    expect(screen.getByText('3 câu thưởng chưa đúng không bị tính vào điểm.')).toBeTruthy()
  })

  it('không xếp hạng, không so với bạn khác, không chữ "nắm chắc"', () => {
    render(<TheCuoiChang view={view()} dong={() => {}} veBang={() => {}} />)
    expect(screen.getByRole('dialog').textContent).not.toMatch(/nắm chắc|xếp hạng|hạng \d|bạn khác|cả lớp/i)
  })
})

// ───────────────────── cầu nối nộp chặng ở KhungXemPhieu ─────────────────────
describe('KhungXemPhieu: tin "nộp chặng" từ phiếu', () => {
  const gui = (data: unknown, source: unknown) => {
    const ev = new MessageEvent('message', { data })
    Object.defineProperty(ev, 'source', { value: source })
    act(() => {
      window.dispatchEvent(ev)
    })
  }
  const mo = (nopChang?: (t: never) => Promise<{ ok: boolean; error?: string }>) => {
    render(<KhungXemPhieu html="<p>x</p>" ten="Bài tập" dong={() => {}} nopChang={nopChang as never} />)
    const khung = document.querySelector('iframe') as HTMLIFrameElement
    const traLoi = vi.spyOn(khung.contentWindow!, 'postMessage')
    return { khung, traLoi }
  }
  const TIN = { type: 'ddh-btvn-nop-chang', ma: 'B1', sbd: '12121212', chiSo: 2, dapAn: { q1: 'B', q2: 'DSDS', bad: 5, nul: null } }

  it('tin từ chính iframe ⇒ gọi nopChang với gói sạch (chỉ đáp án dạng chuỗi) và trả lời ok', async () => {
    const nop = vi.fn(async () => ({ ok: true }))
    const { khung, traLoi } = mo(nop)
    gui(TIN, khung.contentWindow)
    await vi.waitFor(() => expect(traLoi).toHaveBeenCalled())
    expect(nop).toHaveBeenCalledTimes(1)
    expect(nop.mock.calls[0][0]).toEqual({ ma: 'B1', sbd: '12121212', chiSo: 2, dapAn: { q1: 'B', q2: 'DSDS' } })
    expect(traLoi.mock.calls[0][0]).toEqual({ type: 'ddh-btvn-nop-chang-ket', ok: true, error: undefined })
  })

  it('tin từ trang KHÁC (không phải iframe của khung) bị bỏ: không nộp, không trả lời', async () => {
    const nop = vi.fn(async () => ({ ok: true }))
    const { traLoi } = mo(nop)
    gui(TIN, window)
    gui(TIN, null)
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0))
    })
    expect(nop).not.toHaveBeenCalled()
    expect(traLoi).not.toHaveBeenCalled()
  })

  it('nopChang trả lỗi ⇒ phiếu nhận đúng lời báo', async () => {
    const { khung, traLoi } = mo(async () => ({ ok: false, error: 'Chặng này chưa mở.' }))
    gui(TIN, khung.contentWindow)
    await vi.waitFor(() => expect(traLoi).toHaveBeenCalled())
    expect(traLoi.mock.calls[0][0]).toEqual({ type: 'ddh-btvn-nop-chang-ket', ok: false, error: 'Chặng này chưa mở.' })
  })

  it('nopChang NÉM lỗi ⇒ phiếu vẫn nhận lời báo (không treo nút "Đang nộp…")', async () => {
    const { khung, traLoi } = mo(async () => {
      throw new Error('boom')
    })
    gui(TIN, khung.contentWindow)
    await vi.waitFor(() => expect(traLoi).toHaveBeenCalled())
    expect(traLoi.mock.calls[0][0]).toMatchObject({ type: 'ddh-btvn-nop-chang-ket', ok: false })
    expect((traLoi.mock.calls[0][0] as { error: string }).error).toContain('thử lại nhé')
  })

  it('nơi mở phiếu không hỗ trợ nộp chặng (không truyền nopChang) ⇒ báo lỗi rõ ràng', async () => {
    const { khung, traLoi } = mo(undefined)
    gui(TIN, khung.contentWindow)
    await vi.waitFor(() => expect(traLoi).toHaveBeenCalled())
    expect(traLoi.mock.calls[0][0]).toMatchObject({ ok: false, error: expect.stringContaining('mở bài trong app') })
  })

  it('tin thiếu mã bài bị bỏ', async () => {
    const nop = vi.fn(async () => ({ ok: true }))
    const { khung, traLoi } = mo(nop)
    gui({ ...TIN, ma: '' }, khung.contentWindow)
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0))
    })
    expect(nop).not.toHaveBeenCalled()
    expect(traLoi).not.toHaveBeenCalled()
  })
})
