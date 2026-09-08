// MÀN VÀO THI CHỈ NHẬP SỐ BÁO DANH — thầy chốt 07/09.
//
// "Màn đăng nhập vào thi chỉ phải nhập số báo danh. Khi nhập số báo danh bấm
// vào thi sẽ hiện ra một cái bảng Họ tên của số báo danh đó, trong bảng đó
// hiển thị tên của số báo danh đó và 2 nút, nút bắt đầu và nút nhập lại."
//
// VÌ SAO ĐỔI. Bản cũ bắt gõ đủ ba ô rồi so với danh sách; gõ lệch ô nào cũng
// chỉ nhận đúng một câu "thông tin không đúng". 07/09 hai em bị chặn giữa buổi
// và không ai lần ra sai ở đâu. Nhìn thấy TÊN MÌNH thì gõ nhầm một số là phát
// hiện ngay, không cần máy chủ nói ra sai ô nào.
//
// ĐÁNH ĐỔI đã ghi nhận: ai cầm mã ca cũng dò được "số báo danh này là ai".
import { describe, expect, it, vi, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { tenTheoSbd, vaoThi } from '../src/lib/exam-api'

const GS = fs.readFileSync(path.join(process.cwd(), 'docs/apps-script-kiem-tra.gs'), 'utf8')
const MAN = fs.readFileSync(path.join(process.cwd(), 'src/screens/ExamTakeScreen.tsx'), 'utf8')

afterEach(() => {
  vi.unstubAllGlobals()
})

function gia(tra: unknown) {
  const goi = vi.fn(async () => ({ ok: true, json: async () => tra }))
  vi.stubGlobal('fetch', goi)
  return goi
}

describe('tenTheoSbd — lệnh tra tên', () => {
  it('gói gửi đi CHỈ có mã ca và số báo danh, không kèm mã bí mật', async () => {
    const goi = gia({ ok: true, sbd: '10038', hoTen: 'Triệu Đức Duy', lop: '10' })
    await tenTheoSbd('https://x', '371304', '10038')
    const b = JSON.parse((goi.mock.calls[0][1] as { body: string }).body)
    expect(b).toEqual({ action: 'tenTheoSbd', maCa: '371304', sbd: '10038' })
    expect(Object.keys(b)).not.toContain('secret')
  })

  it('trả tên và lớp, KHÔNG trả năm sinh hay số điện thoại', () => {
    const than = GS.slice(GS.indexOf("if (action === 'tenTheoSbd')"), GS.indexOf("if (action === 'dongBoTenCa')"))
    expect(than).toContain('hoTen: tenTS')
    expect(than).toContain('lop:')
    expect(than).not.toMatch(/namSinh:\s*/)
    expect(than).not.toContain('sdt')
  })

  it('vẫn giữ ba cổng: mã ca thật · ca chưa xoá · SBD trong danh sách lớp', () => {
    const than = GS.slice(GS.indexOf("if (action === 'tenTheoSbd')"), GS.indexOf("if (action === 'dongBoTenCa')"))
    expect(than).toContain("lyDo: 'khong_co_ca'")
    expect(than).toContain("lyDo: 'da_xoa'")
    expect(than).toContain("lyDo: 'khong_trong_danh_sach'")
    // Số báo danh lạ cũng để lại dấu vết cho thầy đọc.
    expect(than).toContain("ghiChanVao_(maCaTS, sbdTS, '', '', '', '', 'khong_co_sbd')")
  })

  it('SBD không có trong danh sách thì ném đúng câu của máy chủ', async () => {
    gia({ ok: false, lyDo: 'khong_trong_danh_sach', error: 'Số báo danh này không có trong danh sách lớp. Kiểm tra lại đúng như Thầy ghi trong sổ.' })
    await expect(tenTheoSbd('https://x', '371304', '99999')).rejects.toThrow(/không có trong danh sách lớp/)
  })

  it('danh sách chưa ghi tên cho số đó thì trả chuỗi rỗng — KHÔNG bịa tên', async () => {
    gia({ ok: true, sbd: '10038', hoTen: '', lop: '10' })
    expect((await tenTheoSbd('https://x', '371304', '10038')).hoTen).toBe('')
  })
})

describe('vaoThi — cờ xác nhận bằng mắt', () => {
  it('gửi kèm xacNhanTen', async () => {
    const goi = gia({ ok: true, cach: 'moi', lop: '10', thoiGianPhut: 45, congBo: 'khong', lanThu: 1 })
    await vaoThi('https://x', '371304', '10038', 'may-A', true, { hoTen: 'Triệu Đức Duy', namSinh: '', xacNhanTen: true })
    expect(JSON.parse((goi.mock.calls[0][1] as { body: string }).body).xacNhanTen).toBe(true)
  })

  it('không truyền thì mặc định false — luật cũ giữ nguyên cho mọi chỗ gọi khác', async () => {
    const goi = gia({ ok: true, cach: 'moi', lop: '', thoiGianPhut: 45, congBo: 'khong', lanThu: 1 })
    await vaoThi('https://x', '371304', '10038', 'may-A', true)
    expect(JSON.parse((goi.mock.calls[0][1] as { body: string }).body).xacNhanTen).toBe(false)
  })

  it('máy chủ chỉ bỏ so tên/năm khi CÓ cờ — cổng danh sách vẫn nguyên', () => {
    const than = GS.slice(GS.indexOf('const coDs = coDanhSachHocSinh_()'), GS.indexOf('let hoSo = hoSoHocSinh_(sbd)'))
    expect(than).toContain('khopHoSoDanhSach_(body, dong)')
    const ham = GS.slice(GS.indexOf('function khopHoSoDanhSach_('), GS.indexOf('function tenKhopNhau_('))
    expect(ham).toContain('body.xacNhanTen === true')
    // Cổng "phải có trong danh sách lớp" KHÔNG được nới theo.
    expect(than).toContain('const dong = coDs ? timTrongDanhSachLop_(sbd) : null')
    expect(than).toContain("ghiChanVao_(maCa, sbd, body.hoTen, body.namSinh, '', '', 'khong_co_sbd')")
  })
})

describe('màn vào thi', () => {
  it('KHÔNG còn ô nhập họ tên và năm sinh', () => {
    expect(MAN).not.toContain('placeholder="Họ và tên"')
    expect(MAN).not.toContain('onChange={(e) => setHoTen(e.target.value)}')
    expect(MAN).not.toContain('setNamSinh(e.target.value')
  })

  it('nút Vào thi đi tra tên trước, không vào thẳng', () => {
    expect(MAN).toContain('onClick={() => void traTenRoiHoi()}')
    expect(MAN).toContain("'Đang tra số báo danh…'")
  })

  it('màn xác nhận có đủ tên và HAI nút Bắt đầu · Nhập lại', () => {
    const than = MAN.slice(MAN.indexOf("if (phase === 'join' && !laXemDiem && xacNhan)"), MAN.indexOf("if (phase === 'join') {"))
    expect(than).toContain('Có đúng em không?')
    expect(than).toContain('{xacNhan.hoTen}')
    expect(than).toContain('<NutChinh onClick={handleJoin}>Bắt đầu</NutChinh>')
    expect(than).toContain('Nhập lại')
    // Nhập lại phải XOÁ số báo danh cũ, nếu không em bấm xong lại thấy y nguyên.
    expect(than).toContain('setXacNhan(null)')
    expect(than).toContain("setSbd('')")
  })

  it('danh sách chưa có tên thì nói thẳng, KHÔNG hiện ô tên trống', () => {
    const than = MAN.slice(MAN.indexOf("if (phase === 'join' && !laXemDiem && xacNhan)"), MAN.indexOf("if (phase === 'join') {"))
    expect(than).toContain('Danh sách lớp chưa ghi tên cho số báo danh này')
  })

  it('màn XEM ĐIỂM không đi qua bước xác nhận — nó có lối riêng', () => {
    expect(MAN).toContain("if (phase === 'join' && !laXemDiem && xacNhan)")
    expect(MAN).toContain('<NutChinh onClick={moLaiTuMayChu}>Xem điểm của em</NutChinh>')
  })

  it('vào thi gửi tên LẤY TỪ MÁY CHỦ, không lấy chuỗi cũ trong máy em', () => {
    expect(MAN).toContain("const ten = (xacNhan?.hoTen || hoTen).trim()")
    expect(MAN).toContain('xacNhanTen: xacNhan !== null')
  })
})
