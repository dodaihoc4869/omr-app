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

const moTruoc = (gio: number) => ({ ok: true, du: [{ id: 'b9', lop: '', ten: 'Buổi', moLuc: new Date(Date.now() - gio * 3_600_000).toISOString() }] })
const cho = () => new Promise((r) => setTimeout(r, 0))

// SỬA CÓ CHỦ ĐÍCH 09/11 (lần 3, thầy «bỏ luôn chọn lớp đi, bấm điểm danh cái vào màn chiếu luôn … tức thì»): không hỏi gì — buổi mở ≤ 3 giờ dùng tiếp,
// không có thì mở buổi «mọi lớp»; bảng mở ngay (mã của buổi cũ đọc song song rồi cập nhật).
describe('nút Điểm danh ở màn Hôm nay', () => {
  it('chưa có buổi ⇒ mở buổi «mọi lớp» (không hỏi lớp) + bảng chiếu điểm danh với mã vừa cấp', async () => {
    api.buoiDangMo.mockResolvedValue({ ok: true, du: [] }); api.moBuoiHoc.mockResolvedValue(tt('moi', '842517'))
    const { batDauDiemDanh } = await import('../src/lib/bpu/diem-danh-nhanh')
    expect(await batDauDiemDanh()).toEqual({ loai: 'chieu' })
    expect(api.moBuoiHoc).toHaveBeenCalledWith('')
    expect(lop.layLopThay).not.toHaveBeenCalled()
    expect(gan.moBangDiemDanh).toHaveBeenCalledWith(expect.objectContaining({ buoiId: 'moi', ma: '842517', linkQr: expect.stringContaining('diem-danh=842517') }))
  })
  it('buổi mở 2 giờ trước ⇒ dùng tiếp: bảng mở NGAY (chưa chờ mã), mã đọc song song rồi cập nhật lên bảng', async () => {
    api.buoiDangMo.mockResolvedValue(moTruoc(2)); api.xemBuoiHoc.mockResolvedValue(tt('b9', '111111'))
    const { batDauDiemDanh } = await import('../src/lib/bpu/diem-danh-nhanh')
    expect(await batDauDiemDanh()).toEqual({ loai: 'chieu' })
    expect(api.moBuoiHoc).not.toHaveBeenCalled()
    expect(gan.moBangDiemDanh).toHaveBeenCalledWith(expect.objectContaining({ buoiId: 'b9', ma: null }))
    await cho()
    expect(gan.capNhatMa).toHaveBeenCalledWith('b9', '111111', expect.stringContaining('diem-danh=111111'))
  })
  it('buổi mở quá 3 giờ ⇒ mở buổi mới; hỏi sớm (rê chuột) dùng lại một lệnh cho lần bấm ngay sau', async () => {
    api.buoiDangMo.mockResolvedValue(moTruoc(4)); api.moBuoiHoc.mockResolvedValue(tt('moi', '333333'))
    const { batDauDiemDanh, hoiSom } = await import('../src/lib/bpu/diem-danh-nhanh')
    void hoiSom()
    expect(await batDauDiemDanh()).toEqual({ loai: 'chieu' })
    expect(api.buoiDangMo).toHaveBeenCalledTimes(1)
    expect(api.moBuoiHoc).toHaveBeenCalledWith('')
  })
  it('máy chủ lỗi ⇒ trả câu báo, không mở bảng', async () => {
    api.buoiDangMo.mockResolvedValue({ ok: false, chu: 'Chưa kết nối được máy chủ.' })
    const { batDauDiemDanh } = await import('../src/lib/bpu/diem-danh-nhanh')
    expect(await batDauDiemDanh()).toEqual({ loai: 'loi', chu: 'Chưa kết nối được máy chủ.' })
    expect(gan.moBangDiemDanh).not.toHaveBeenCalled()
  })
})
