// Bình Phản Ứng — CHUYỂN CẢNH GỐC BẢNG (gan-gv) thầy báo 10/11:
// (1) «Đóng» / Esc ra THẲNG Hôm nay trong một nhịp: lớp phủ tờ chiếu (KhungXemPhieu cổng thẳng vào body, không nằm trong khung tờ) ẩn CÙNG LÚC với bảng;
// (2) chọn câu xong không lộ tờ chiếu cũ: tờ nạp ngầm dưới bảng, ẩn hẳn (html[data-bpu-che-to]) — chỉ lộ khi bảng thu vào tờ lúc em lên bảng;
// (4) chọn câu khác khi đang có lượt ⇒ lượt mới của đúng câu ấy mang cờ «bỏ lượt dở» (một lần; → / «Câu tiếp» thì không).
import { createPortal } from 'react-dom'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const setScreen = vi.hoisted(() => vi.fn())
vi.mock('../src/lib/buoi-hoc-api', () => ({ buoiDangMo: async () => ({ ok: true, du: [{ id: 'b1', moLuc: new Date().toISOString() }] }) }))
vi.mock('../src/store/appStore', () => ({ useAppStore: { getState: () => ({ showToast: vi.fn(), setScreen }) } }))
vi.mock('../src/components/bpu/BangBinhPhanUng', () => ({ default: (p: { buoiId: string; qid?: string; bo?: boolean }) => <div className="bpu-bang" tabIndex={-1} data-bang={p.buoiId} data-qid={p.qid ?? ''} data-bo={String(!!p.bo)} /> }))
vi.mock('../src/lib/bpu/to-chieu-bpu', () => ({ dungToChieuBpu: async () => '<p>tờ</p>', napKhoDayHoc: async () => [], baiDaChonCuaBuoi: () => ({ maChon: [], boCau: [] }) }))
vi.mock('../src/components/KhungXemPhieu', () => ({ default: (p: { ten?: string }) => createPortal(<div className="lop-xem-phieu" aria-label={p.ten} />, document.body) }))

const cau = (qid: string) => ({ khoa: qid, qid, phan: 'I', maDe: 'm', tenDe: 'Bài', chuyenDe: '', maDang: null, tenDang: null, mucDo: '', tuLuan: false, q: {} }) as never
const html = () => document.documentElement
const to = () => document.querySelector<HTMLElement>('.lop-xem-phieu')!
const bang = () => document.querySelector<HTMLElement>('[data-bpu-bang]')!
const cho = () => act(() => new Promise((r) => setTimeout(r, 20)))
afterEach(async () => { const m = await import('../src/components/bpu/gan-gv'); m.dongBang(); document.body.innerHTML = ''; html().className = ''; setScreen.mockReset() })

async function moPhien() {
  vi.resetModules()
  const m = await import('../src/components/bpu/gan-gv'); m.datChoTuDong(0)
  await act(async () => { m.moBangDiemDanh({ buoiId: 'b1', ma: '123456' }) })
  await act(async () => { expect(await m.chieuCau([cau('q1'), cau('q2')])).toBe('') })
  await act(async () => { await m.moBangTuToChieu('q1', { tuDong: true, nguon: { postMessage: () => {}, focus: () => {} } as unknown as Window }) })
  await cho()
  return m
}

describe('gốc bảng Bình Phản Ứng — chuyển cảnh 10/11', () => {
  it('bảng ở trên ⇒ tờ chiếu vừa dựng bị che ngay (không lộ một nhịp)', async () => {
    await moPhien()
    expect(to()).toBeTruthy()
    expect(html().hasAttribute('data-bpu-che-to')).toBe(true)
    expect(bang().querySelector('[data-qid]')?.getAttribute('data-qid')).toBe('q1')
  })
  it('Esc / Đóng ⇒ bảng + lớp phủ tờ ẩn CÙNG MỘT NHỊP (đồng bộ), về Hôm nay; vào lại ⇒ đúng chỗ dở, tờ vẫn bị che', async () => {
    const m = await moPhien()
    expect(m.escRaHomNay()).toBe(true)
    // Không chờ khung hình nào: ngay sau lệnh, không lớp nào còn thấy.
    expect(bang().style.visibility).toBe('hidden')
    expect(to().style.visibility).toBe('hidden')
    expect(html().hasAttribute('data-bpu-an')).toBe(true)
    expect(setScreen).toHaveBeenCalledWith('tongquan')
    await act(async () => { m.moBangDiemDanh({ buoiId: 'b1' }) })
    expect(bang().style.visibility).toBe('')
    expect(to().style.visibility).toBe('')
    expect(html().hasAttribute('data-bpu-che-to')).toBe(true)
  })
  it('em lên bảng (bảng thu vào tờ) ⇒ tờ lộ ra; chấm xong bảng phóng lại ⇒ tờ che lại; bảng đóng hẳn ⇒ tờ hiện như thường', async () => {
    const m = await moPhien()
    html().classList.add('may-yeu') // không hoạt ảnh ⇒ đổi tức thì
    expect(m.lenBangTo({ sbd: 'S1', ten: 'Đỗ Đại Học', goiNgay: false })).toBe(true)
    expect(html().hasAttribute('data-bpu-che-to')).toBe(false)
    m.chamTuTo(true)
    expect(html().hasAttribute('data-bpu-che-to')).toBe(true)
    m.dongBang()
    expect(html().hasAttribute('data-bpu-che-to')).toBe(false)
  })
  it('chọn câu khác khi đang có lượt ⇒ lượt mới của câu ấy mang cờ bỏ lượt dở (một lần); → «Câu tiếp» thì không', async () => {
    const m = await moPhien()
    expect(bang().querySelector('[data-bo]')?.getAttribute('data-bo')).toBe('false') // câu đầu sau điểm danh: chưa có lượt cũ
    await act(async () => { await m.chieuCau([cau('q5')]) })
    await act(async () => { await m.moBangTuToChieu('q5', { tuDong: true }) })
    await cho()
    expect(bang().querySelector('[data-qid]')?.getAttribute('data-qid')).toBe('q5')
    expect(bang().querySelector('[data-bo]')?.getAttribute('data-bo')).toBe('true')
    m.toiCau(1)
    await act(async () => { await m.moBangTuToChieu('q6', { tuDong: true }) })
    await cho()
    expect(bang().querySelector('[data-qid]')?.getAttribute('data-qid')).toBe('q6')
    expect(bang().querySelector('[data-bo]')?.getAttribute('data-bo')).toBe('false')
  })
})

describe('bảng chọn câu — nút về / Đóng (10/11)', () => {
  it('mở từ màn đua ⇒ «Về màn đua» (phím C) về lại màn đua; «Đóng» ra Hôm nay (không phiên ⇒ chỉ đóng bảng chọn)', async () => {
    const { default: ChonCauBpu } = await import('../src/components/bpu/ChonCauBpu')
    const onDong = vi.fn()
    const { unmount } = render(<ChonCauBpu buoiId="b1" lop="12A1" buocDau="cau" onChieu={async () => ''} onDong={onDong} />)
    expect(screen.getByRole('button', { name: /Về màn đua/ })).toBeTruthy()
    await act(() => new Promise((r) => setTimeout(r, 5)))
    fireEvent.keyDown(window, { key: 'c' })
    expect(onDong).toHaveBeenCalledTimes(1)
    fireEvent.keyDown(screen.getByRole('searchbox', { name: 'Tìm bài' }), { key: 'c' }) // gõ trong ô tìm ⇒ không về
    expect(onDong).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: /Đóng/ }))
    await act(() => new Promise((r) => setTimeout(r, 20)))
    expect(onDong).toHaveBeenCalledTimes(2)
    unmount()
  })
  it('mở từ điểm danh («Hôm nay làm gì?») ⇒ «Về điểm danh», không có phím C', async () => {
    const { default: ChonCauBpu } = await import('../src/components/bpu/ChonCauBpu')
    const onDong = vi.fn()
    render(<ChonCauBpu buoiId="b1" lop="12A1" buocDau="hd" onChieu={async () => ''} onDong={onDong} onHoatDong={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: 'Về điểm danh' }))
    expect(onDong).toHaveBeenCalledTimes(1)
    fireEvent.keyDown(window, { key: 'c' })
    expect(onDong).toHaveBeenCalledTimes(1)
  })
})
