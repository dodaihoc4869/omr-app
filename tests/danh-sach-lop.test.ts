// EM THI LÀ TỰ CÓ TÊN TRONG DANH SÁCH.
//
// Bỏ màn đăng ký (app học sinh tách sang repo riêng) thì không còn ai điền hồ
// sơ nữa. Em vào thi chỉ gõ SỐ BÁO DANH, nên họ tên phải đến từ bản sao danh
// sách lớp mà app thầy đẩy lên máy chủ. Test này khoá cả hai đầu: phía app đọc
// đúng cột, phía máy chủ tự thêm em và chỉ cho thầy xoá.
import { describe, expect, it } from 'vitest'
import gsCode from '../docs/apps-script-kiem-tra.gs?raw'
import { autoMatchColumns, rowsToClassList } from '../src/lib/sheet-gviz'

describe('Đọc danh sách lớp từ Google Sheet', () => {
  const HEADER = ['SBD', 'Họ và tên', 'Ngày sinh', 'Lớp', 'SĐT phụ huynh']

  it('nhận cột năm sinh dù thầy đặt tên "Ngày sinh" hay "Năm sinh"', () => {
    expect(autoMatchColumns(HEADER).namSinh).toBe('Ngày sinh')
    expect(autoMatchColumns(['SBD', 'Tên', 'Năm sinh', 'Lớp']).namSinh).toBe('Năm sinh')
    // Không có cột đó thì để trống, KHÔNG đoán bừa sang cột khác.
    expect(autoMatchColumns(['SBD', 'Tên', 'Lớp']).namSinh).toBeNull()
  })

  it('rút đúng 4 chữ số năm, kể cả khi ô ghi cả ngày', () => {
    const rows = [
      HEADER,
      ['110234', 'Lê Minh Đức', '12/05/2009', '11A1', '0912345678'],
      ['110235', 'Trần Bảo An', '2010', '11A1', ''],
      ['110236', 'Phạm Gia Huy', '', '11A2', ''],
    ]
    const ds = rowsToClassList(rows, autoMatchColumns(HEADER))
    expect(ds.map((r) => r.namSinh)).toEqual(['2009', '2010', ''])
    expect(ds.map((r) => r.hoTen)).toEqual(['Lê Minh Đức', 'Trần Bảo An', 'Phạm Gia Huy'])
    expect(ds.map((r) => r.lop)).toEqual(['11A1', '11A1', '11A2'])
  })

  it('sheet không có cột năm sinh thì để rỗng, không làm hỏng các cột khác', () => {
    const h = ['SBD', 'Họ tên', 'Lớp']
    const ds = rowsToClassList([h, ['110234', 'Lê Minh Đức', '11A1']], autoMatchColumns(h))
    expect(ds[0]).toMatchObject({ sbd: '110234', hoTen: 'Lê Minh Đức', lop: '11A1', namSinh: '' })
  })
})

describe('Máy chủ — em vào thi tự vào danh sách', () => {
  it('vaoThi tự thêm em khi chưa có hồ sơ, TRƯỚC khi xét phạm vi ca', () => {
    // Thứ tự quan trọng: thêm sau khi xét phạm vi thì ca lọc theo khối chặn
    // em ngay lần đầu, dù danh sách lớp có năm sinh của em.
    const iThem = gsCode.indexOf('if (!hoSo) hoSo = themEmVaoDanhSach_(sbd, ca)')
    const iXet = gsCode.indexOf('const qd = quyetDinhVaoThi_(ca, luot, idThietBi, now')
    expect(iThem).toBeGreaterThan(0)
    expect(iXet).toBeGreaterThan(iThem)
  })

  it('em tự vào được đánh dấu tu_vao_thi và KHÔNG được cấp token', () => {
    const than = gsCode.slice(gsCode.indexOf('function themEmVaoDanhSach_'))
    const ham = than.slice(0, than.indexOf('\nfunction '))
    expect(ham).toContain("row[HS_COT_TRANGTHAI] = 'tu_vao_thi'")
    expect(ham).not.toContain('HS_COT_TOKEN')
    expect(ham).not.toContain('sinhToken_')
  })

  it('họ tên tra từ bản sao danh sách lớp, không để em tự gõ', () => {
    const than = gsCode.slice(gsCode.indexOf('function themEmVaoDanhSach_'))
    const ham = than.slice(0, than.indexOf('\nfunction '))
    expect(ham).toContain('timTrongDanhSachLop_(sbd)')
    // Không đọc tên từ body của lệnh vaoThi — em gõ gì cũng không thành tên.
    expect(ham).not.toContain('body.')
  })
})

describe('Máy chủ — chỉ thầy đụng được danh sách', () => {
  it('napDanhSachLop đòi mã bí mật', () => {
    const i = gsCode.indexOf("if (action === 'napDanhSachLop')")
    expect(i).toBeGreaterThan(0)
    const than = gsCode.slice(i, i + 1400)
    expect(than).toContain('kiemTraMaBiMat_(body)')
    // Ghi đè bằng sheet rỗng là xoá sạch tên của cả trung tâm — phải chặn.
    expect(than).toContain('Danh sách rỗng')
  })

  it('deleteStudent (nút Xoá em ở màn Học sinh) vẫn đòi mã bí mật', () => {
    const i = gsCode.indexOf("if (action === 'deleteStudent')")
    expect(i).toBeGreaterThan(0)
    expect(gsCode.slice(i, i + 400)).toContain('kiemTraMaBiMat_(body)')
  })
})
