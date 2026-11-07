// Bình Phản Ứng TỰ ĐỘNG (thầy 07/11): tờ chuyển câu ⇒ app mở bảng + lượt mới. Khoá: chỉ theo buổi mở trong 4 giờ (không đẩy câu xuống máy lớp đã về nhà),
// không có buổi ⇒ im lặng (không báo lỗi mỗi lần chuyển câu); thầy bấm P mà không có buổi ⇒ báo.
import { afterEach, describe, expect, it, vi } from 'vitest'

const buoi = vi.hoisted(() => ({ ds: [] as { id: string; moLuc: string }[] }))
const toast = vi.hoisted(() => vi.fn())
vi.mock('../src/lib/buoi-hoc-api', () => ({ buoiDangMo: async () => ({ ok: true, du: buoi.ds }) }))
vi.mock('../src/store/appStore', () => ({ useAppStore: { getState: () => ({ showToast: toast }) } }))
vi.mock('../src/components/bpu/BangBinhPhanUng', () => ({ default: (p: { buoiId: string; qid: string; giay?: number }) => <div data-bang={p.buoiId} data-qid={p.qid} data-giay={p.giay} /> }))

const gio = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString()
afterEach(async () => { (await import('../src/components/bpu/gan-gv')).dongBang(); toast.mockReset() })

describe('mở bảng từ tờ chiếu', () => {
  it('buổi mở 6 giờ trước ⇒ tin tự động KHÔNG mở bảng, không báo; buổi mới ⇒ mở với câu + giây', async () => {
    vi.resetModules()
    const m = await import('../src/components/bpu/gan-gv'); m.datChoTuDong(0)
    buoi.ds = [{ id: 'cu', moLuc: gio(6) }]
    await m.moBangTuToChieu('q1', { tuDong: true, giay: 120 })
    await new Promise((r) => setTimeout(r, 20))
    expect(document.querySelector('[data-bang]')).toBeNull()
    expect(toast).not.toHaveBeenCalled()
    vi.resetModules()
    const m2 = await import('../src/components/bpu/gan-gv'); m2.datChoTuDong(0)
    buoi.ds = [{ id: 'moi', moLuc: gio(1) }, { id: 'cu', moLuc: gio(6) }]
    await m2.moBangTuToChieu('q2', { tuDong: true, giay: 120 })
    await new Promise((r) => setTimeout(r, 20))
    const b = document.querySelector('[data-bang]')!
    expect(b.getAttribute('data-bang')).toBe('moi')
    expect(b.getAttribute('data-qid')).toBe('q2')
    expect(b.getAttribute('data-giay')).toBe('120')
    m2.dongBang()
  })
  it('buổi mở quá 4 giờ nhưng máy này đang xem hôm nay (bước Điểm danh) ⇒ vẫn tự mở', async () => {
    vi.resetModules()
    const m = await import('../src/components/bpu/gan-gv'); m.datChoTuDong(0)
    localStorage.setItem('ddh.gv.buoi-xem', JSON.stringify({ id: 'sang', n: new Date(Date.now() + 7 * 3_600_000).toISOString().slice(0, 10) }))
    buoi.ds = [{ id: 'sang', moLuc: gio(5) }]
    await m.moBangTuToChieu('q3', { tuDong: true })
    await new Promise((r) => setTimeout(r, 20))
    expect(document.querySelector('[data-bang]')?.getAttribute('data-bang')).toBe('sang')
    localStorage.removeItem('ddh.gv.buoi-xem')
  })
  it('lật nhanh: tin tự động mới huỷ tin đang chờ ⇒ chỉ mở MỘT lượt cho câu cuối', async () => {
    vi.resetModules()
    const m = await import('../src/components/bpu/gan-gv'); m.datChoTuDong(40)
    buoi.ds = [{ id: 'moi', moLuc: gio(1) }]
    void m.moBangTuToChieu('q1', { tuDong: true }); void m.moBangTuToChieu('q2', { tuDong: true })
    await m.moBangTuToChieu('q3', { tuDong: true })
    await new Promise((r) => setTimeout(r, 20))
    expect(document.querySelectorAll('[data-bang]')).toHaveLength(1)
    expect(document.querySelector('[data-bang]')!.getAttribute('data-qid')).toBe('q3')
    m.dongBang()
  })
  it('tờ VỪA MỞ (cửa sổ tờ mới) ⇒ vào thẳng bảng gần như ngay, không chờ 1,5 giây; đổi câu trên cùng tờ vẫn chờ', async () => {
    vi.resetModules()
    const m = await import('../src/components/bpu/gan-gv'); m.datChoTuDong(5000)
    buoi.ds = [{ id: 'moi', moLuc: gio(1) }]
    const to = { postMessage: () => {} } as unknown as Window
    await m.moBangTuToChieu('q1', { tuDong: true, nguon: to })
    await new Promise((r) => setTimeout(r, 20))
    expect(document.querySelector('[data-bang]')?.getAttribute('data-qid')).toBe('q1')
    void m.moBangTuToChieu('q2', { tuDong: true, nguon: to })
    await new Promise((r) => setTimeout(r, 400))
    expect(document.querySelector('[data-bang]')?.getAttribute('data-qid')).toBe('q1')
    m.dongBang()
  })
  it('không có buổi: tin tự động im lặng; bấm P thì báo thầy mở điểm danh', async () => {
    vi.resetModules()
    const m = await import('../src/components/bpu/gan-gv'); m.datChoTuDong(0)
    buoi.ds = []
    await m.moBangTuToChieu('q1', { tuDong: true })
    expect(toast).not.toHaveBeenCalled()
    await m.moBangTuToChieu('q1', {})
    expect(toast).toHaveBeenCalledWith(expect.stringMatching(/mở Điểm danh/), 'warn')
  })
})
