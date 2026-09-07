// THÊM HỌC SINH — thầy chốt 07/09.
//
// "Mục học sinh cho tôi nút thêm học sinh, khi bấm vào nút đó hiện đủ 3 trường:
// Họ tên, năm sinh, số báo danh. Khi tôi bấm thêm nó sẽ đồng bộ luôn vào danh
// sách của học sinh đó trên link google sheet."
//
// ĐIỀU QUAN TRỌNG NHẤT: ghi vào SHEET GỐC, không chỉ bản sao `DanhSachLop`.
// Bản sao bị lượt Đồng bộ kế tiếp ghi đè bằng nội dung ba link, nên em thêm vào
// mỗi bản sao sẽ biến mất mà không ai biết — và em đứng ngoài phòng thi.
import { describe, expect, it, vi, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { themEmVaoSheet } from '../src/lib/exam-api'

const GS = fs.readFileSync(path.join(process.cwd(), 'docs/apps-script-kiem-tra.gs'), 'utf8')
const THAN = GS.slice(GS.indexOf("if (action === 'themEmVaoSheet')"), GS.indexOf("if (action === 'trangThaiPhongCho')"))
const NUT = fs.readFileSync(path.join(process.cwd(), 'src/components/NutThemHocSinh.tsx'), 'utf8')

afterEach(() => {
  vi.unstubAllGlobals()
})

function gia(tra: unknown) {
  const goi = vi.fn(async () => ({ ok: true, json: async () => tra }))
  vi.stubGlobal('fetch', goi)
  return goi
}

describe('máy chủ', () => {
  it('GHI VÀO SHEET GỐC rồi mới thêm vào bản sao', () => {
    const viTriGoc = THAN.indexOf('shTE.appendRow(hangTE)')
    const viTriSao = THAN.indexOf('shDS.appendRow(')
    expect(viTriGoc).toBeGreaterThan(0)
    expect(viTriSao).toBeGreaterThan(viTriGoc)
    expect(THAN).toContain('moSheetKhoi_(namTE)')
  })

  it('đòi mã bí mật và kiểm đủ ba trường trước khi ghi', () => {
    expect(THAN).toContain('kiemTraMaBiMat_(body)')
    const viTriGhi = THAN.indexOf('shTE.appendRow')
    for (const kiem of ['Chưa nhập họ tên', 'Năm sinh phải là 4 chữ số', 'Số báo danh phải là số']) {
      expect(THAN.indexOf(kiem)).toBeGreaterThan(0)
      expect(THAN.indexOf(kiem)).toBeLessThan(viTriGhi)
    }
  })

  it('TRÙNG SỐ BÁO DANH LÀ DỪNG — hai em một bài thi là hỏng cả buổi', () => {
    expect(THAN).toContain("lyDo: 'trung_sbd'")
    // Kiểm cả bản sao lẫn sheet gốc, và cả hai đều đứng trước lệnh ghi.
    const viTriGhi = THAN.indexOf('shTE.appendRow')
    expect(THAN.indexOf('timTrongDanhSachLop_(sbdTE)')).toBeLessThan(viTriGhi)
    expect(THAN.indexOf('đã có số báo danh')).toBeLessThan(viTriGhi)
  })

  it('ghi theo TÊN CỘT của sheet đó, không ghi theo vị trí đoán bừa', () => {
    // Ba sheet khối đặt tiêu đề khác nhau ("HoTen" và "Họ tên").
    expect(THAN).toContain('cotDsLop_(dTE.length ? dTE[0] : [])')
    expect(THAN).toContain('hangTE[vtTE.sbd] = sbdTE')
    expect(THAN).toContain('hangTE[vtTE.hoTen] = tenTE')
    expect(THAN).toContain('hangTE[vtTE.namSinh] = namTE')
  })

  it('không tìm ra sheet, hoặc hai sheet trùng tên, thì DỪNG chứ không đoán', () => {
    const ham = GS.slice(GS.indexOf('function moSheetKhoi_'), GS.indexOf('/** Đọc TOÀN BỘ bản sao danh sách học sinh'))
    expect(ham).toContain("if (thay.length === 0) return { ok: false")
    expect(ham).toContain("if (thay.length > 1) return { ok: false")
    // Nhớ id lại để lần sau không quét Drive nữa.
    expect(ham).toContain('props.setProperty(KHOA_SHEET_KHOI, JSON.stringify(ban))')
    // Id nhớ mà mở không được (thầy xoá sheet) thì bỏ nhớ và tìm lại.
    expect(ham).toContain('delete ban[nam]')
  })
})

describe('máy khách', () => {
  it('gửi đúng lệnh và đủ ba trường', async () => {
    const goi = gia({ ok: true, sbd: '12050', hoTen: 'Nguyễn Văn A', namSinh: '2009', lop: '12', tenSheet: '2009' })
    await themEmVaoSheet('https://x', 'MAT', { sbd: '12050', hoTen: 'Nguyễn Văn A', namSinh: '2009' })
    expect(JSON.parse((goi.mock.calls[0][1] as { body: string }).body)).toEqual({
      action: 'themEmVaoSheet',
      secret: 'MAT',
      sbd: '12050',
      hoTen: 'Nguyễn Văn A',
      namSinh: '2009',
    })
  })

  it('trả về TÊN SHEET đã ghi để thầy đối chiếu đúng khối', async () => {
    gia({ ok: true, sbd: '12050', hoTen: 'A', namSinh: '2009', lop: '12', tenSheet: '2009' })
    expect((await themEmVaoSheet('https://x', 'MAT', { sbd: '12050', hoTen: 'A', namSinh: '2009' })).tenSheet).toBe('2009')
  })

  it('máy chủ từ chối thì ném nguyên văn', async () => {
    gia({ ok: false, lyDo: 'trung_sbd', error: 'Số báo danh 12050 đã có trong danh sách: Nguyễn Văn B' })
    await expect(themEmVaoSheet('https://x', 'MAT', { sbd: '12050', hoTen: 'A', namSinh: '2009' })).rejects.toThrow(/đã có trong danh sách/)
  })
})

describe('nút trên màn Học sinh', () => {
  it('đủ BA ô, đúng tên thầy chốt', () => {
    expect(NUT).toContain('aria-label="Họ và tên"')
    expect(NUT).toContain('aria-label="Năm sinh"')
    expect(NUT).toContain('aria-label="Số báo danh"')
  })

  it('kiểm ngay tại máy trước khi gọi mạng', () => {
    const than = NUT.slice(NUT.indexOf('const them = async'), NUT.indexOf('setDang(true)'))
    expect(than).toContain("if (!ten) return setLoi('Chưa nhập họ tên')")
    expect(than).toContain('/^(19|20)\\d{2}$/.test(nam)')
    expect(than).toContain('/^\\d{3,12}$/.test(so)')
  })

  it('thêm xong thì nói rõ đã ghi vào sheet nào', () => {
    expect(NUT).toContain('vào sheet ${kq.tenSheet}')
  })

  it('nút nằm trên màn Học sinh', () => {
    const man = fs.readFileSync(path.join(process.cwd(), 'src/screens/HocSinhScreen.tsx'), 'utf8')
    expect(man).toContain('<NutThemHocSinh')
    expect(man).toContain("import NutThemHocSinh from '../components/NutThemHocSinh'")
  })
})
