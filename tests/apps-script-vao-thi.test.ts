// Bảng quyết định VÀO THI của máy chủ (QUANLYCATHI.md mục 1 + 3) — nạp thẳng
// file Apps Script (docs/apps-script-kiem-tra.gs) vào Node và gọi hàm thuần
// quyetDinhVaoThi_ để logic test được đúng bản sẽ dán lên Google.
import { describe, expect, it } from 'vitest'
import gsCode from '../docs/apps-script-kiem-tra.gs?raw'

type QD = { ok: true; cach: 'moi' | 'khoi_phuc' | 'duyet_lai' } | { ok: false; lyDo: string; nopLuc?: string; lanThu?: number; batDau?: string; hetHanVao?: string }
interface Gs {
  quyetDinhVaoThi_: (
    ca: { trangThai: string; batDau: string; hetHanVao: string; thoiGianPhut: number; phamVi?: string; danhSachMoi?: string },
    luot: { trangThai: string; idThietBi: string; lanThu: number; nopLuc: string } | null,
    idThietBi: string,
    nowMs: number,
    hocSinh?: { sbd: string; namSinh: string },
  ) => QD
  msCua_: (iso: string) => number
  LUOT_HEADERS: string[]
  CA_HEADERS: string[]
  CHITIET_HEADERS: string[]
}

// File chỉ khai báo const + function ở cấp cao nhất (không gọi Google API lúc
// nạp) nên đưa vào Function là chạy được; các hàm hoist nên lấy ra được.
const gs: Gs = new Function(`${gsCode}\nreturn { quyetDinhVaoThi_, msCua_, LUOT_HEADERS, CA_HEADERS, CHITIET_HEADERS }`)()

const T0 = Date.parse('2026-09-03T07:00:00Z') // 14:00 VN
const caMo = { trangThai: 'mo', batDau: '2026-09-03T07:00:00Z', hetHanVao: '2026-09-03T07:30:00Z', thoiGianPhut: 45 }

describe('Apps Script quyetDinhVaoThi_ — một SBD một lượt', () => {
  it('chưa có lượt, trong giờ → lượt mới', () => {
    expect(gs.quyetDinhVaoThi_(caMo, null, 'may-A', T0 + 60_000)).toEqual({ ok: true, cach: 'moi' })
  })

  it('kiểm chứng 2: dang_lam CÙNG máy → khôi phục (kể cả đã quá hạn vào phòng)', () => {
    const luot = { trangThai: 'dang_lam', idThietBi: 'may-A', lanThu: 1, nopLuc: '' }
    expect(gs.quyetDinhVaoThi_(caMo, luot, 'may-A', T0 + 60_000)).toEqual({ ok: true, cach: 'khoi_phuc' })
    expect(gs.quyetDinhVaoThi_(caMo, luot, 'may-A', T0 + 40 * 60_000)).toEqual({ ok: true, cach: 'khoi_phuc' })
  })

  it('kiểm chứng 3: dang_lam KHÁC máy → chặn, kể cả khi lượt cũ đã hết giờ', () => {
    const luot = { trangThai: 'dang_lam', idThietBi: 'may-A', lanThu: 1, nopLuc: '' }
    expect(gs.quyetDinhVaoThi_(caMo, luot, 'may-B', T0 + 60_000)).toMatchObject({ ok: false, lyDo: 'dang_lam_may_khac' })
    expect(gs.quyetDinhVaoThi_(caMo, luot, 'may-B', T0 + 3 * 3600_000)).toMatchObject({ ok: false, lyDo: 'dang_lam_may_khac' })
  })

  it('kiểm chứng 1: đã nộp → chặn kèm giờ nộp; bị khoá cũng chặn', () => {
    const daNop = { trangThai: 'da_nop', idThietBi: 'may-A', lanThu: 1, nopLuc: '2026-09-03T07:32:00Z' }
    expect(gs.quyetDinhVaoThi_(caMo, daNop, 'may-A', T0 + 60_000)).toEqual({ ok: false, lyDo: 'da_nop', nopLuc: '2026-09-03T07:32:00Z', lanThu: 1 })
    const khoa = { ...daNop, trangThai: 'khoa' }
    expect(gs.quyetDinhVaoThi_(caMo, khoa, 'may-B', T0 + 60_000)).toMatchObject({ ok: false, lyDo: 'da_nop' })
  })

  it('kiểm chứng 4: thầy duyệt thi lại → vào được, cách = duyet_lai', () => {
    const duyet = { trangThai: 'duoc_duyet_lai', idThietBi: '', lanThu: 2, nopLuc: '' }
    expect(gs.quyetDinhVaoThi_(caMo, duyet, 'may-B', T0 + 60_000)).toEqual({ ok: true, cach: 'duyet_lai' })
  })

  it('kiểm chứng 7: quá hạn vào phòng → mã ca vô hiệu (lượt mới và cả lượt được duyệt lại)', () => {
    expect(gs.quyetDinhVaoThi_(caMo, null, 'may-A', T0 + 31 * 60_000)).toEqual({ ok: false, lyDo: 'het_han_vao', hetHanVao: caMo.hetHanVao })
    const duyet = { trangThai: 'duoc_duyet_lai', idThietBi: '', lanThu: 2, nopLuc: '' }
    expect(gs.quyetDinhVaoThi_(caMo, duyet, 'may-A', T0 + 31 * 60_000)).toMatchObject({ ok: false, lyDo: 'het_han_vao' })
  })

  it('trước giờ bắt đầu → "chưa mở" kèm mốc bắt đầu', () => {
    expect(gs.quyetDinhVaoThi_(caMo, null, 'may-A', T0 - 60_000)).toEqual({ ok: false, lyDo: 'chua_mo', batDau: caMo.batDau })
  })

  it('không đặt hạn vào phòng (rỗng) → vào lúc nào cũng được', () => {
    const tuDo = { ...caMo, hetHanVao: '' }
    expect(gs.quyetDinhVaoThi_(tuDo, null, 'may-A', T0 + 5 * 3600_000)).toEqual({ ok: true, cach: 'moi' })
  })

  it('ca đã xoá / đã đóng → chặn trước mọi thứ', () => {
    expect(gs.quyetDinhVaoThi_({ ...caMo, trangThai: 'da_xoa' }, null, 'may-A', T0)).toEqual({ ok: false, lyDo: 'da_xoa' })
    const luot = { trangThai: 'dang_lam', idThietBi: 'may-A', lanThu: 1, nopLuc: '' }
    expect(gs.quyetDinhVaoThi_({ ...caMo, trangThai: 'dong' }, luot, 'may-A', T0)).toEqual({ ok: false, lyDo: 'da_dong' })
  })

  it('tiêu đề sheet LuotThi đúng thứ tự cột mà code ghi theo chỉ số', () => {
    // vaoThi ghi cột 4..8 (IdThietBi, VaoLuc, HetGioLuc, NopLuc, TrangThai); submit ghi 7..12; sendFeedback ghi 14..17; GhiChu 20, CapNhatLuc 21.
    expect(gs.LUOT_HEADERS.slice(3, 8)).toEqual(['IdThietBi', 'VaoLuc', 'HetGioLuc', 'NopLuc', 'TrangThai'])
    expect(gs.LUOT_HEADERS.slice(6, 12)).toEqual(['NopLuc', 'TrangThai', 'DapAnJson', 'SoLanRoiMan', 'TongGiayRoiMan', 'IntegrityJson'])
    expect(gs.LUOT_HEADERS.slice(13, 17)).toEqual(['DiemI', 'DiemII', 'DiemIII', 'Tong'])
    expect(gs.LUOT_HEADERS[17]).toBe('DuyetBoi')
    expect(gs.LUOT_HEADERS[19]).toBe('GhiChu')
    expect(gs.LUOT_HEADERS[20]).toBe('CapNhatLuc')
    expect(gs.LUOT_HEADERS[21]).toBe('GiayCauJson')
    expect(gs.LUOT_HEADERS).toHaveLength(22)
    expect(gs.CA_HEADERS.slice(0, 7)).toEqual(['MaCa', 'Lop', 'ThoiGianPhut', 'MoLuc', 'BankJson', 'ImmediateFeedback', 'KeyBankJson'])
    expect(gs.CA_HEADERS.slice(7, 10)).toEqual(['BatDau', 'HetHanVao', 'TrangThai'])
    expect(gs.CA_HEADERS.slice(10, 15)).toEqual(['TenCa', 'PhamVi', 'DanhSachMoi', 'NguoiTao', 'XoaLuc'])
  })

  it('kiểm chứng 12: bảng ChiTietCau có đủ cột chuyên đề, mức độ, giây làm câu', () => {
    expect(gs.CHITIET_HEADERS).toEqual(['MaCa', 'SBD', 'LanThu', 'Phan', 'SoCau', 'Qid', 'ChuyenDe', 'MucDo', 'DapAnChon', 'DapAnDung', 'DungSai', 'GiayLamCau', 'GhiLuc'])
  })
})

describe('Apps Script quyetDinhVaoThi_ — phạm vi gửi ca (mục 4)', () => {
  const caKhoi = { ...caMo, phamVi: 'khoi', danhSachMoi: '2010' }
  const caChon = { ...caMo, phamVi: 'chon', danhSachMoi: JSON.stringify(['HS01', 'HS02']) }

  it('kiểm chứng 8: theo khối — đúng năm sinh vào được, khác khối bị chặn kèm năm sinh của ca', () => {
    expect(gs.quyetDinhVaoThi_(caKhoi, null, 'may-A', T0 + 60_000, { sbd: 'HS01', namSinh: '2010' })).toEqual({ ok: true, cach: 'moi' })
    expect(gs.quyetDinhVaoThi_(caKhoi, null, 'may-A', T0 + 60_000, { sbd: 'HS01', namSinh: '2009' })).toEqual({ ok: false, lyDo: 'khong_thuoc_khoi', namSinh: '2010' })
  })

  it('theo khối — chưa đăng ký hồ sơ (không có năm sinh) → chặn với lý do riêng', () => {
    expect(gs.quyetDinhVaoThi_(caKhoi, null, 'may-A', T0 + 60_000, { sbd: 'HS01', namSinh: '' })).toEqual({ ok: false, lyDo: 'chua_co_ho_so', namSinh: '2010' })
  })

  it('chọn từng em — có trong danh sách vào được, không có bị chặn', () => {
    expect(gs.quyetDinhVaoThi_(caChon, null, 'may-A', T0 + 60_000, { sbd: 'HS02', namSinh: '' })).toEqual({ ok: true, cach: 'moi' })
    expect(gs.quyetDinhVaoThi_(caChon, null, 'may-A', T0 + 60_000, { sbd: 'HS09', namSinh: '' })).toEqual({ ok: false, lyDo: 'khong_trong_danh_sach' })
  })

  it('phạm vi KHÔNG chặn em đang làm dở mở lại cùng máy (khôi phục) — đã được vào rồi', () => {
    const luot = { trangThai: 'dang_lam', idThietBi: 'may-A', lanThu: 1, nopLuc: '' }
    expect(gs.quyetDinhVaoThi_(caChon, luot, 'may-A', T0 + 60_000, { sbd: 'HS09', namSinh: '' })).toEqual({ ok: true, cach: 'khoi_phuc' })
  })

  it('tự do — ai cũng vào được, kể cả chưa có hồ sơ', () => {
    expect(gs.quyetDinhVaoThi_({ ...caMo, phamVi: 'tu_do' }, null, 'may-A', T0 + 60_000, { sbd: 'X', namSinh: '' })).toEqual({ ok: true, cach: 'moi' })
  })
})

describe('Apps Script quyetDinhVaoThi_ — dữ liệu năm sinh bị bọc dấu nháy (ca mở bằng v10)', () => {
  it('vẫn so khớp đúng năm sinh', () => {
    const ca = { ...caMo, phamVi: 'khoi', danhSachMoi: '"2010"' }
    expect(gs.quyetDinhVaoThi_(ca, null, 'may-A', T0 + 60_000, { sbd: 'HS01', namSinh: '2010' })).toEqual({ ok: true, cach: 'moi' })
    expect(gs.quyetDinhVaoThi_(ca, null, 'may-A', T0 + 60_000, { sbd: 'HS01', namSinh: '2009' })).toEqual({ ok: false, lyDo: 'khong_thuoc_khoi', namSinh: '2010' })
  })
})

describe('TỰ DO là tự do ĐÚNG NGHĨA (thầy báo 05/09)', () => {
  // Bản cũ chạy cổng danh sách lớp TRƯỚC khi xét phạm vi, nên chọn "Tự do" mà
  // em không có trong danh sách vẫn bị chặn — trái hẳn cái tên và trái dòng mô
  // tả "ai có mã ca đều vào được". Tự do là để luyện tập, ôn ngoài giờ, em lớp
  // khác học ké: ở đó danh sách lớp không có nghĩa lý gì.
  const caTuDo = { ...caMo, phamVi: 'tu_do' }

  it('em KHÔNG có trong danh sách lớp vẫn vào được', () => {
    const la = { sbd: '999999', namSinh: '', trongDanhSach: false }
    expect(gs.quyetDinhVaoThi_(caTuDo, null, 'may-A', T0 + 60_000, la)).toEqual({ ok: true, cach: 'moi' })
  })

  it('ca không ghi phạm vi (ca cũ) cũng là tự do', () => {
    const la = { sbd: '999999', namSinh: '', trongDanhSach: false }
    expect(gs.quyetDinhVaoThi_(caMo, null, 'may-A', T0 + 60_000, la)).toEqual({ ok: true, cach: 'moi' })
  })

  it('chưa nạp danh sách bao giờ cũng vào được', () => {
    expect(gs.quyetDinhVaoThi_(caTuDo, null, 'may-A', T0 + 60_000, { sbd: '1', namSinh: '', trongDanhSach: null })).toEqual({ ok: true, cach: 'moi' })
    expect(gs.quyetDinhVaoThi_(caTuDo, null, 'may-A', T0 + 60_000)).toEqual({ ok: true, cach: 'moi' })
  })

  it('BA PHẠM VI KIA VẪN GIỮ CỔNG — nới cả bốn là hỏng ca thi thật', () => {
    const la = { sbd: '999999', namSinh: '2009', trongDanhSach: false }
    for (const pv of ['khoi', 'chon', 'sbd']) {
      const kq = gs.quyetDinhVaoThi_({ ...caMo, phamVi: pv, danhSachMoi: pv === 'khoi' ? '2009' : '[]' }, null, 'may-A', T0 + 60_000, la)
      expect(kq.ok, pv).toBe(false)
    }
  })

  it('ca tự do vẫn chặn đúng những thứ KHÔNG liên quan danh sách', () => {
    // đóng ca, quá hạn vào phòng, đang làm máy khác — tự do không có nghĩa là bỏ hết luật
    expect(gs.quyetDinhVaoThi_({ ...caTuDo, trangThai: 'dong' }, null, 'may-A', T0 + 60_000)).toMatchObject({ ok: false, lyDo: 'da_dong' })
    expect(gs.quyetDinhVaoThi_(caTuDo, null, 'may-A', T0 + 31 * 60_000)).toMatchObject({ ok: false, lyDo: 'het_han_vao' })
    const dangLam = { trangThai: 'dang_lam', idThietBi: 'may-A', lanThu: 1, nopLuc: '' }
    expect(gs.quyetDinhVaoThi_(caTuDo, dangLam, 'may-B', T0 + 60_000)).toMatchObject({ ok: false, lyDo: 'dang_lam_may_khac' })
  })
})

// ---------------------------------------------------------------------------
// THẦY HỎI 06/09: chế độ SỐ BÁO DANH có kiểm năm sinh và họ tên không.
//
// CÓ. Cổng danh sách (`trongDanhSach`) khớp đủ ba — số báo danh, họ tên, năm
// sinh — và chạy TRƯỚC mọi phạm vi trừ Tự do. Cái sai chỉ là dòng mô tả trên
// màn Mở ca nói thiếu; bộ kiểm này khoá cả hành vi lẫn dòng chữ đó lại.

describe('Chế độ SỐ BÁO DANH đòi đủ mã ca + số báo danh + họ tên + năm sinh', () => {
  const caSbd = { ...caMo, phamVi: 'sbd' }

  it('khớp đủ ba → vào được', () => {
    const dung = { sbd: '11004', namSinh: '2010', trongDanhSach: true }
    expect(gs.quyetDinhVaoThi_(caSbd, null, 'may-A', T0 + 60_000, dung)).toEqual({ ok: true, cach: 'moi' })
  })

  it('SAI TÊN hoặc SAI NĂM SINH đều bị chặn — máy chủ trả trongDanhSach false', () => {
    // `vaoThi` đặt `trongDanhSach: false` cho cả hai trường hợp lệch tên và
    // lệch năm sinh, nên ở đây một phép là đủ cho cả hai.
    const lech = { sbd: '11004', namSinh: '2010', trongDanhSach: false }
    expect(gs.quyetDinhVaoThi_(caSbd, null, 'may-A', T0 + 60_000, lech)).toMatchObject({ ok: false, lyDo: 'sai_ho_so' })
  })

  it('SBD lạ, không có dòng nào trong danh sách → chặn', () => {
    const la = { sbd: '999999', namSinh: '', trongDanhSach: false }
    expect(gs.quyetDinhVaoThi_(caSbd, null, 'may-A', T0 + 60_000, la)).toMatchObject({ ok: false, lyDo: 'sai_ho_so' })
  })

  it('CHƯA NẠP danh sách bao giờ thì chế độ này CHẶN — cả mục đích của nó là cổng danh sách', () => {
    const chuaNap = { sbd: '11004', namSinh: '2010', trongDanhSach: null }
    expect(gs.quyetDinhVaoThi_(caSbd, null, 'may-A', T0 + 60_000, chuaNap)).toMatchObject({ ok: false, lyDo: 'khong_trong_danh_sach' })
    // Khác hẳn 'khoi' và 'chon': hai chế độ kia mở cổng khi chưa nạp danh sách.
    expect(gs.quyetDinhVaoThi_({ ...caMo, phamVi: 'khoi', danhSachMoi: '2010' }, null, 'may-A', T0 + 60_000, chuaNap)).toEqual({ ok: true, cach: 'moi' })
  })

  it('máy chủ so tên bỏ dấu và năm sinh 4 chữ số, dòng thầy bỏ trống thì không lấy làm cớ chặn', () => {
    // Cắt tới lệnh kế tiếp, không cắt cứng theo số ký tự: thêm dòng chú thích
    // vào lệnh là phép kiểm rơi ra ngoài cửa sổ và báo trượt oan.
    const i = gsCode.indexOf("if (action === 'vaoThi')")
    const j = gsCode.indexOf("\n  if (action === '", i + 10)
    const than = gsCode.slice(i, j > 0 ? j : undefined)
    // TỪ 07/09 màn vào thi chỉ hỏi số báo danh rồi cho em XÁC NHẬN BẰNG MẮT
    // tên của số đó. Có cờ `xacNhanTen` thì không so tên và năm sinh nữa.
    expect(than).toContain('const tenKhop = body.xacNhanTen === true ||')
    expect(than).toContain('const namKhop = body.xacNhanTen === true ||')
    // KHÔNG có cờ thì luật cũ phải còn nguyên — mọi chỗ gọi khác không đổi.
    // Tên đi qua `tenKhopNhau_`: nó nuốt chữ eth ð Ð, ký tự tàng hình, dấu câu
    // thừa và chữ dính — ba bẫy "nhìn y hệt mà khác mã".
    expect(than).toContain('!chuanTen_(dong.hoTen) || tenKhopNhau_(body.hoTen, dong.hoTen)')
    expect(than).toContain('!dong.namSinh || namGoi === dong.namSinh')
    expect(than).toContain('if (!tenKhop || !namKhop) {')
    expect(than).toContain('trongDs = null')
    // Mỗi lượt bị chặn phải để lại bằng chứng cho thầy đọc.
    expect(than).toContain('ghiChanVao_(')
  })

  it('CỜ XÁC NHẬN KHÔNG ĐƯỢC NỚI CỔNG DANH SÁCH', () => {
    // Đây là ranh giới của lần đổi 07/09: bỏ so tên và năm sinh thì cổng còn
    // lại CHỈ có "số báo danh phải nằm trong danh sách lớp". Nới nốt cái đó là
    // ai gõ số nào cũng vào được.
    const i = gsCode.indexOf('const coDs = coDanhSachHocSinh_()')
    const than = gsCode.slice(i, gsCode.indexOf('let hoSo = hoSoHocSinh_(sbd)', i))
    expect(than).toContain('const dong = coDs ? timTrongDanhSachLop_(sbd) : null')
    expect(than).toContain("ghiChanVao_(maCa, sbd, body.hoTen, body.namSinh, '', '', 'khong_co_sbd')")
    // `trongDs` chỉ được gán đúng hai lần: khởi tạo bằng dòng tìm được trong
    // danh sách, và gán null khi bị chặn. Không có nhánh nào cho nó giá trị
    // đúng chỉ vì có cờ xác nhận.
    const ganTrongDs = than.match(/trongDs\s*=\s*[^=]/g) ?? []
    expect(ganTrongDs).toHaveLength(2)
    expect(than).toContain('let trongDs = dong')
    expect(than).toContain('trongDs = null')
  })

  it('DÒNG MÔ TẢ trên màn Mở ca phải nói đúng việc máy chủ làm', async () => {
    const { readFileSync } = await import('node:fs')
    const { resolve } = await import('node:path')
    const man = readFileSync(resolve(__dirname, '../src/screens/ExamSetupScreen.tsx'), 'utf8')
    const dau = man.indexOf('const PHAM_VI_CHON')
    expect(dau).toBeGreaterThan(0)
    // Cắt tới dấu `]` ĐẦU DÒNG — dấu `]` đầu tiên nằm trong kiểu `{...}[]`,
    // cắt ở đó thì khối rỗng và phép kiểm tự đạt.
    const khoi = man.slice(dau, man.indexOf('\n]', dau))
    const dong = khoi.split('\n').filter((d) => d.includes("mota: '"))
    // BA chế độ (thầy chốt 07/09): "Theo khối" đã bỏ vì nó lọc bằng năm sinh,
    // mà em không gõ năm sinh nữa.
    expect(dong).toHaveLength(3)
    expect(khoi).not.toContain("id: 'khoi'")
    expect(khoi).toContain("id: 'sbd'")
    expect(khoi).toContain("id: 'chon'")
    // Hai chế độ có cổng KHÔNG được nói là phải gõ đủ ba ô nữa — nói vậy là
    // sai việc máy chủ đang làm, và thầy đọc xong sẽ dặn em gõ thứ không có ô.
    for (const d of dong.filter((x) => /'chon'|'sbd'/.test(x))) {
      expect(d).not.toContain('họ tên, năm sinh')
      expect(d).toContain('số báo danh')
    }
    // Và Tự do phải nói rõ nó là chế độ DUY NHẤT không dò danh sách.
    const tuDo = khoi.split('\n').find((d) => d.includes("'tu_do'"))!
    expect(tuDo).toContain('DUY NHẤT')
  })
})

