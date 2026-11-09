// 09/11 thầy «chuyển nút điểm danh ra màn hôm nay, bỏ hẳn thẻ hành trình, khi bấm nút điểm danh tự động hiện ra mọi thứ chọn như đang làm»:
// một lần bấm ⇒ buổi đang mở (≤ 4 giờ) dùng tiếp / không có thì mở buổi (nhiều lớp ⇒ hỏi lớp) ⇒ bật bảng Bình Phản Ứng ở màn điểm danh.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const api = vi.hoisted(() => ({ buoiDangMo: vi.fn(), moBuoiHoc: vi.fn(), xemBuoiHoc: vi.fn(), linkDiemDanh: (g: string, m: string) => `${g}/hs?diem-danh=${m}` }))
const lop = vi.hoisted(() => ({ layLopThay: vi.fn() }))
const gan = vi.hoisted(() => ({ moBangDiemDanh: vi.fn(), capNhatMa: vi.fn() }))
vi.mock('../src/lib/buoi-hoc-api', () => api)
vi.mock('../src/lib/ten-lop-thay', () => lop)
vi.mock('../src/components/bpu/gan-gv', () => gan)

const tt = (id: string, ma: string) => ({ ok: true, du: { buoi: { id }, ma } })
beforeEach(() => { vi.clearAllMocks() })
afterEach(() => { vi.useRealTimers() })

describe('nút Điểm danh ở màn Hôm nay', () => {
  it('có buổi đang mở trong 4 giờ ⇒ không mở buổi mới, bảng chiếu điểm danh với mã hiện tại', async () => {
    api.buoiDangMo.mockResolvedValue({ ok: true, du: [{ id: 'b9', moLuc: new Date(Date.now() - 3_600_000).toISOString() }] })
    api.xemBuoiHoc.mockResolvedValue(tt('b9', '842517'))
    const { batDauDiemDanh } = await import('../src/lib/bpu/diem-danh-nhanh')
    const chon = vi.fn()
    expect(await batDauDiemDanh(chon)).toBe('')
    expect(api.moBuoiHoc).not.toHaveBeenCalled()
    expect(chon).not.toHaveBeenCalled()
    expect(gan.moBangDiemDanh).toHaveBeenCalledWith(expect.objectContaining({ buoiId: 'b9', ma: '842517', linkQr: expect.stringContaining('diem-danh=842517') }))
  })
  it('không có buổi, thầy dạy hai lớp ⇒ hỏi lớp rồi mở buổi lớp ấy; huỷ ⇒ không mở gì', async () => {
    api.buoiDangMo.mockResolvedValue({ ok: true, du: [{ id: 'cu', moLuc: new Date(Date.now() - 6 * 3_600_000).toISOString() }] })
    lop.layLopThay.mockResolvedValue({ ok: true, du: { lop: [{ tenLop: '12A1' }, { tenLop: '12A2' }] } })
    api.moBuoiHoc.mockResolvedValue(tt('moi', '111222'))
    const { batDauDiemDanh } = await import('../src/lib/bpu/diem-danh-nhanh')
    expect(await batDauDiemDanh(async (ds) => { expect(ds).toEqual(['12A1', '12A2']); return '12A2' })).toBe('')
    expect(api.moBuoiHoc).toHaveBeenCalledWith('12A2')
    expect(gan.moBangDiemDanh).toHaveBeenCalledWith(expect.objectContaining({ buoiId: 'moi', ma: '111222' }))
    gan.moBangDiemDanh.mockClear(); api.moBuoiHoc.mockClear()
    expect(await batDauDiemDanh(async () => null)).toBe('')
    expect(api.moBuoiHoc).not.toHaveBeenCalled()
    expect(gan.moBangDiemDanh).not.toHaveBeenCalled()
  })
  it('máy chủ lỗi ⇒ trả câu báo, không mở bảng', async () => {
    api.buoiDangMo.mockResolvedValue({ ok: false, chu: 'Chưa kết nối được máy chủ.' })
    const { batDauDiemDanh } = await import('../src/lib/bpu/diem-danh-nhanh')
    expect(await batDauDiemDanh(async () => '12A1')).toBe('Chưa kết nối được máy chủ.')
    expect(gan.moBangDiemDanh).not.toHaveBeenCalled()
  })
})
