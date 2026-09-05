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
