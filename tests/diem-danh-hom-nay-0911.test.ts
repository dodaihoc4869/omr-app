// 09/11 thầy «chuyển nút điểm danh ra màn hôm nay, bỏ hẳn thẻ hành trình, khi bấm nút điểm danh tự động hiện ra mọi thứ chọn như đang làm»:
// một lần bấm ⇒ buổi đang mở (≤ 4 giờ) dùng tiếp / không có thì mở buổi (nhiều lớp ⇒ hỏi lớp) ⇒ bật bảng Bình Phản Ứng ở màn điểm danh.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const api = vi.hoisted(() => ({ buoiDangMo: vi.fn(), moBuoiHoc: vi.fn(), xemBuoiHoc: vi.fn(), dongBuoiHoc: vi.fn(), linkDiemDanh: (g: string, m: string) => `${g}/hs?diem-danh=${m}` }))
const lop = vi.hoisted(() => ({ layLopThay: vi.fn() }))
const gan = vi.hoisted(() => ({ moBangDiemDanh: vi.fn(), capNhatMa: vi.fn(), dongBang: vi.fn() }))
vi.mock('../src/lib/buoi-hoc-api', () => api)
vi.mock('../src/lib/ten-lop-thay', () => lop)
vi.mock('../src/components/bpu/gan-gv', () => gan)

const tt = (id: string, ma: string) => ({ ok: true, du: { buoi: { id }, ma } })
beforeEach(() => { vi.clearAllMocks() })
afterEach(() => { vi.useRealTimers() })

const hai = { ok: true, du: { lop: [{ tenLop: '12A1' }, { tenLop: '12A2' }] } }
const mot = { ok: true, du: { lop: [{ tenLop: '12A1' }] } }
const moTruoc = (gio: number, lop = '12A1') => ({ ok: true, du: [{ id: 'b9', lop, ten: lop, moLuc: new Date(Date.now() - gio * 3_600_000).toISOString() }] })

describe('nút Điểm danh ở màn Hôm nay', () => {
  it('chưa có buổi, thầy dạy MỘT lớp ⇒ không hỏi, mở buổi lớp ấy + bảng chiếu điểm danh', async () => {
    api.buoiDangMo.mockResolvedValue({ ok: true, du: [] }); lop.layLopThay.mockResolvedValue(mot); api.moBuoiHoc.mockResolvedValue(tt('moi', '842517'))
    const { batDauDiemDanh } = await import('../src/lib/bpu/diem-danh-nhanh')
    const hoi = vi.fn()
    expect(await batDauDiemDanh(hoi)).toEqual({ loai: 'chieu' })
    expect(hoi).not.toHaveBeenCalled()
    expect(api.moBuoiHoc).toHaveBeenCalledWith('12A1')
    expect(gan.moBangDiemDanh).toHaveBeenCalledWith(expect.objectContaining({ buoiId: 'moi', ma: '842517', linkQr: expect.stringContaining('diem-danh=842517') }))
  })
  it('buổi 12A1 còn mở (lớp sáng quên đóng) ⇒ LUÔN hỏi: «Tiếp» dùng buổi cũ; chọn 12A2 ⇒ buổi MỚI, không nuốt vào buổi 12A1', async () => {
    api.buoiDangMo.mockResolvedValue(moTruoc(2)); lop.layLopThay.mockResolvedValue(hai)
    api.xemBuoiHoc.mockResolvedValue(tt('b9', '111111')); api.moBuoiHoc.mockResolvedValue(tt('moi', '222222'))
    const { batDauDiemDanh } = await import('../src/lib/bpu/diem-danh-nhanh')
    expect(await batDauDiemDanh(async (o) => { expect(o.dangMo?.id).toBe('b9'); expect(o.ds).toEqual(['12A1', '12A2']); return { loai: 'tiep' } })).toEqual({ loai: 'chieu' })
    expect(api.moBuoiHoc).not.toHaveBeenCalled()
    expect(gan.moBangDiemDanh).toHaveBeenLastCalledWith(expect.objectContaining({ buoiId: 'b9', ma: '111111' }))
    expect(await batDauDiemDanh(async () => ({ loai: 'moi', lop: '12A2' }))).toEqual({ loai: 'chieu' })
    expect(api.moBuoiHoc).toHaveBeenCalledWith('12A2')
    expect(gan.moBangDiemDanh).toHaveBeenLastCalledWith(expect.objectContaining({ buoiId: 'moi' }))
  })
  it('Kết thúc buổi ⇒ đóng buổi đang mở + đóng bảng; Trang buổi dạy / Huỷ ⇒ không mở gì', async () => {
    api.buoiDangMo.mockResolvedValue(moTruoc(1)); lop.layLopThay.mockResolvedValue(mot); api.dongBuoiHoc.mockResolvedValue({ ok: true, du: {} })
    const { batDauDiemDanh } = await import('../src/lib/bpu/diem-danh-nhanh')
    expect(await batDauDiemDanh(async () => ({ loai: 'ket-thuc' }))).toEqual({ loai: 'ket-thuc', lop: '12A1' })
    expect(api.dongBuoiHoc).toHaveBeenCalledWith('b9')
    expect(gan.dongBang).toHaveBeenCalled()
    expect(await batDauDiemDanh(async () => ({ loai: 'trang' }))).toEqual({ loai: 'trang' })
    expect(await batDauDiemDanh(async () => null)).toEqual({ loai: 'huy' })
    expect(api.moBuoiHoc).not.toHaveBeenCalled()
    expect(gan.moBangDiemDanh).not.toHaveBeenCalled()
  })
  it('buổi mở quá 4 giờ không tính là đang mở (một lớp ⇒ mở buổi mới)', async () => {
    api.buoiDangMo.mockResolvedValue(moTruoc(6)); lop.layLopThay.mockResolvedValue(mot); api.moBuoiHoc.mockResolvedValue(tt('moi', '333333'))
    const { batDauDiemDanh } = await import('../src/lib/bpu/diem-danh-nhanh')
    expect(await batDauDiemDanh(vi.fn())).toEqual({ loai: 'chieu' })
    expect(api.moBuoiHoc).toHaveBeenCalledWith('12A1')
  })
  it('máy chủ lỗi ⇒ trả câu báo, không mở bảng', async () => {
    api.buoiDangMo.mockResolvedValue({ ok: false, chu: 'Chưa kết nối được máy chủ.' }); lop.layLopThay.mockResolvedValue(mot)
    const { batDauDiemDanh } = await import('../src/lib/bpu/diem-danh-nhanh')
    expect(await batDauDiemDanh(vi.fn())).toEqual({ loai: 'loi', chu: 'Chưa kết nối được máy chủ.' })
    expect(gan.moBangDiemDanh).not.toHaveBeenCalled()
  })
})
