// DANH SÁCH HỌC SINH LÀ CỔNG VÀO THI.
//
// Bỏ màn đăng ký (app học sinh tách sang repo riêng) thì không còn ai điền hồ
// sơ nữa. Thay vào đó thầy nạp file danh sách 3 cột — số báo danh, họ tên, năm
// sinh — và em phải nhập đúng CẢ BA mới vào thi được. Test này khoá cả hai đầu:
// phía app đọc file đúng và không im lặng bỏ dòng hỏng, phía máy chủ chặn đúng
// chỗ và chỉ thầy mới đụng được danh sách.
import { describe, expect, it } from 'vitest'
import gsCode from '../docs/apps-script-kiem-tra.gs?raw'
import { autoMatchColumns, rowsToClassList } from '../src/lib/sheet-gviz'
import { docNamSinh, hangToDanhSach, lopTuTenSheet } from '../src/lib/danh-sach-hs'

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

describe('Đọc FILE danh sách học sinh của thầy', () => {
  const TIEU_DE = ['SBD', 'Họ và tên', 'Năm sinh']

  it('đọc đủ ba cột từ file có hàng tiêu đề', () => {
    const kq = hangToDanhSach([
      TIEU_DE,
      ['110234', 'Lê Minh Đức', 2009],
      ['110235', 'Trần Bảo An', '12/05/2010'],
    ])
    expect(kq.items).toEqual([
      { sbd: '110234', hoTen: 'Lê Minh Đức', namSinh: '2009', lop: '' },
      { sbd: '110235', hoTen: 'Trần Bảo An', namSinh: '2010', lop: '' },
    ])
    expect(kq.boQua).toEqual([])
  })

  it('file KHÔNG có hàng tiêu đề vẫn đọc được — đoán theo hình dạng ô', () => {
    const kq = hangToDanhSach([
      ['110234', 'Lê Minh Đức', '2009'],
      ['110235', 'Trần Bảo An', '2010'],
    ])
    expect(kq.items.map((e) => e.sbd)).toEqual(['110234', '110235'])
    expect(kq.items[0].hoTen).toBe('Lê Minh Đức')
  })

  it('DÒNG THIẾU KHÔNG ĐƯỢC IM LẶNG — em không lên danh sách là em đứng ngoài phòng thi', () => {
    const kq = hangToDanhSach([
      TIEU_DE,
      ['110234', 'Lê Minh Đức', '2009'],
      ['110235', '', '2010'],
      ['', 'Phạm Gia Huy', '2009'],
      ['110237', 'Vũ Khánh Linh', ''],
    ])
    expect(kq.items).toHaveLength(1)
    expect(kq.boQua.map((b) => b.dong)).toEqual([3, 4, 5])
    expect(kq.boQua[0].vaoSao).toContain('họ tên')
    expect(kq.boQua[1].vaoSao).toContain('số báo danh')
    expect(kq.boQua[2].vaoSao).toContain('năm sinh')
  })

  it('số báo danh trùng: giữ dòng đầu và nêu ra', () => {
    const kq = hangToDanhSach([TIEU_DE, ['110234', 'Lê Minh Đức', '2009'], ['110234', 'Lê Minh Đúc', '2009']])
    expect(kq.items).toHaveLength(1)
    expect(kq.items[0].hoTen).toBe('Lê Minh Đức')
    expect(kq.trung).toEqual(['110234'])
  })

  it('thiếu hẳn một cột thì BÁO LỖI, không nạp nửa vời', () => {
    expect(() => hangToDanhSach([['SBD', 'Họ và tên'], ['110234', 'Lê Minh Đức']])).toThrow(/3 cột/)
  })

  it('năm sinh đọc được từ số, chuỗi, ngày đầy đủ và ô Date của Excel', () => {
    expect(docNamSinh(2009)).toBe('2009')
    expect(docNamSinh('12/05/2010')).toBe('2010')
    expect(docNamSinh(new Date(2008, 4, 12))).toBe('2008')
    expect(docNamSinh('')).toBe('')
    expect(docNamSinh('lớp 11')).toBe('')
  })

  it('gộp khoảng trắng thừa trong tên và bỏ khoảng trắng trong số báo danh', () => {
    const kq = hangToDanhSach([TIEU_DE, [' 110 234 ', '  Lê   Minh  Đức ', '2009']])
    expect(kq.items[0]).toEqual({ sbd: '110234', hoTen: 'Lê Minh Đức', namSinh: '2009', lop: '' })
  })

  // FILE THẦY GỬI CÓ BA SHEET: "lớp 10", "lớp 11", "lớp 12". Đọc mỗi sheet đầu
  // là mất hơn 200 em mà tổng số nhìn vẫn "có vẻ đúng" — lỗi im lặng tệ nhất.
  it('tên sheet thành tên lớp, bỏ chữ "lớp" thừa', () => {
    expect(lopTuTenSheet('lớp 12')).toBe('12')
    expect(lopTuTenSheet('Lop 11')).toBe('11')
    expect(lopTuTenSheet('lớp10')).toBe('10')
    // Sheet đặt kiểu tên lớp thật thì giữ nguyên.
    expect(lopTuTenSheet('12A1')).toBe('12A1')
  })

  it('gán lớp cho mọi em trong một sheet', () => {
    const kq = hangToDanhSach([TIEU_DE, ['12000', 'Hoàng Thị Kim Ngân', '2009']], '12', new Set(), [], 'lớp 12')
    expect(kq.items[0].lop).toBe('12')
    expect(kq.theoSheet).toEqual([{ ten: 'lớp 12', soEm: 1 }])
    expect(kq.boQua).toEqual([])
  })

  it('một em chỉ nằm ở MỘT lớp — trùng số báo danh giữa hai sheet thì giữ sheet trước', () => {
    const daCo = new Set<string>()
    const trung: string[] = []
    const a = hangToDanhSach([TIEU_DE, ['11010', 'Lê Minh Đức', '2010']], '11', daCo, trung, 'lớp 11')
    const b = hangToDanhSach([TIEU_DE, ['11010', 'Lê Minh Đức', '2010']], '12', daCo, trung, 'lớp 12')
    expect(a.items).toHaveLength(1)
    expect(b.items).toHaveLength(0)
    expect(trung).toEqual(['11010'])
  })
})

describe('Máy chủ — cổng vào thi theo danh sách', () => {
  it('chặn khi không khớp đủ ba, và KHÔNG nói rõ sai ô nào', () => {
    const i = gsCode.indexOf('function quyetDinhVaoThi_')
    const than = gsCode.slice(i, gsCode.indexOf('\nfunction ', i + 10))
    expect(than).toContain("hocSinh.trongDanhSach === false) return { ok: false, lyDo: 'sai_ho_so' }")
    // Cổng phải đứng TRƯỚC phạm vi ca — chặn sớm nhất có thể.
    expect(than.indexOf('trongDanhSach')).toBeLessThan(than.indexOf("pv === 'khoi'"))
  })

  it('chưa nạp danh sách bao giờ thì KHÔNG chặn ai — không để trung tâm đứng hình', () => {
    const i = gsCode.indexOf("if (action === 'vaoThi')")
    const than = gsCode.slice(i, i + 3000)
    expect(than).toContain('const coDs = coDanhSachHocSinh_()')
    expect(than).toContain('trongDanhSach: coDs ? !!trongDs : null')
  })

  it('so khớp tên bỏ dấu và bỏ khoảng trắng thừa, năm sinh so đúng 4 chữ số', () => {
    const i = gsCode.indexOf("if (action === 'vaoThi')")
    const than = gsCode.slice(i, i + 3000)
    expect(than).toContain('chuanTen_(body.hoTen)')
    expect(than).toContain('chuanNamSinh_(body.namSinh)')
    // Dòng thầy bỏ trống thì không lấy đó làm cớ chặn em.
    expect(than).toContain('!chuanTen_(dong.hoTen)')
    expect(than).toContain('!dong.namSinh')
  })
})

describe('Máy chủ — em qua cổng thì có hồ sơ', () => {
  it('tạo hồ sơ TRƯỚC khi xét phạm vi ca', () => {
    // Thứ tự quan trọng: tạo sau khi xét phạm vi thì ca lọc theo khối chặn em
    // ngay lần đầu, dù danh sách có năm sinh của em.
    const iThem = gsCode.indexOf('if (!hoSo && (!coDs || trongDs)) hoSo = themEmVaoDanhSach_(sbd, ca, trongDs)')
    const iXet = gsCode.indexOf('const qd = quyetDinhVaoThi_(ca, luot, idThietBi, now')
    expect(iThem).toBeGreaterThan(0)
    expect(iXet).toBeGreaterThan(iThem)
  })

  it('CHỈ tạo hồ sơ cho em đã qua cổng danh sách', () => {
    // `!hoSo && (!coDs || trongDs)`: có danh sách mà không khớp thì không tạo
    // dòng nào — danh sách học sinh không phình ra vì người lạ gõ bừa.
    expect(gsCode).toContain('if (!hoSo && (!coDs || trongDs)) hoSo = themEmVaoDanhSach_(sbd, ca, trongDs)')
  })

  it('em tự vào được đánh dấu tu_vao_thi và KHÔNG được cấp token', () => {
    const than = gsCode.slice(gsCode.indexOf('function themEmVaoDanhSach_'))
    const ham = than.slice(0, than.indexOf('\nfunction '))
    expect(ham).toContain("row[HS_COT_TRANGTHAI] = 'tu_vao_thi'")
    expect(ham).not.toContain('HS_COT_TOKEN')
    expect(ham).not.toContain('sinhToken_')
  })

  it('họ tên ghi vào hồ sơ lấy từ DANH SÁCH, không lấy chữ em gõ', () => {
    const than = gsCode.slice(gsCode.indexOf('function themEmVaoDanhSach_'))
    const ham = than.slice(0, than.indexOf('\nfunction '))
    // Tham số `tu` là dòng tra được trong danh sách; body của lệnh vaoThi
    // (chữ em gõ) không bao giờ chạm tới đây.
    expect(ham).toContain('tu ? tu.hoTen :')
    expect(ham).not.toContain('body.')
  })
})

describe('Máy chủ — danh sách em trên màn Học sinh', () => {
  const than = (() => {
    const i = gsCode.indexOf("if (action === 'danhSachEm')")
    return gsCode.slice(i, gsCode.indexOf('serverNow: Date.now() })', i))
  })()

  it('lấy danh sách thầy nạp làm nguồn chính, không phải bảng hồ sơ', () => {
    expect(than).toContain('const dsLop = docDanhSachLop_()')
    // Danh sách thầy nạp phải duyệt TRƯỚC hồ sơ riêng, để tên trong file thắng.
    expect(than.indexOf('for (let i = 0; i < dsLop.length; i++)')).toBeLessThan(than.indexOf('dsSbdHoSo'))
  })

  it('KHÔNG làm biến mất em đã có bài làm, dù danh sách mới không còn tên em', () => {
    // Điểm của em nằm trong LuotThi; danh sách thay không được xoá em khỏi mắt
    // thầy. Ba nguồn gộp lại: danh sách nạp · hồ sơ riêng · lượt thi.
    expect(than).toContain('const dsSbdLuot = Object.keys(soCaTheoCa)')
    expect(than).toContain('tenTuLuot[sbd]')
  })

  it('nhưng BỎ QUA lượt mồ côi của ca đã xoá hẳn', () => {
    // Xoá hẳn một ca là xoá cả bài làm của ca đó. Không lọc thì màn Học sinh
    // đầy số báo danh của các ca thử đã xoá từ đời nào.
    expect(than).toContain('const caSong = {}')
    expect(than).toContain('if (!coCaSong) continue')
  })

  it('em ngoài danh sách được gắn cờ để thầy biết em đó không thi được nữa', () => {
    expect(than).toContain("'ngoai_danh_sach'")
    // Chưa nạp danh sách lần nào thì không gắn cờ bừa cho ai.
    expect(than).toContain("dsLop.length ? 'ngoai_danh_sach'")
  })

  it('mỗi số báo danh chỉ ra MỘT dòng, dù có ở cả ba nguồn', () => {
    expect(than).toContain('if (!sbd || daRa[sbd]) return')
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
