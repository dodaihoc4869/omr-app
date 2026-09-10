// LỊCH SỬ LÊN BẢNG — SHEET MỚI, KHÔNG ĐỤNG BẢNG NÀO ĐANG CHẠY.
//
// Chỗ này trước đây là một lỗ hổng LẶNG LẼ: `ghiLenBang` nhận `qid` rồi vứt,
// `TienDoCa` không có cột nào giữ nó, và không có đường nào đọc ngược ra "em này
// lên bảng mấy lần tháng qua". Hệ số `moi(e)` vì thế luôn bằng 1 — công thức có
// vế công bằng tần suất mà vế ấy không bao giờ chạy.
//
// CHỐT: thêm SHEET MỚI `LenBang` chứ KHÔNG thêm cột vào `TienDoCa`. Thêm cột vào
// một bảng đang có dữ liệu thật là đổi cấu trúc đang chạy; thêm sheet thì dữ
// liệu cũ đọc y nguyên và `getSheet_` tự tạo.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const GS = fs.readFileSync(path.join(process.cwd(), 'docs/apps-script-kiem-tra.gs'), 'utf8')
const API = fs.readFileSync(path.join(process.cwd(), 'src/lib/exam-api.ts'), 'utf8')
const MAN = fs.readFileSync(path.join(process.cwd(), 'src/screens/GoiLenBangScreen.tsx'), 'utf8')

describe('MÁY CHỦ — thêm, tuyệt đối không đụng cái đang có', () => {
  it('sheet mới có, header đủ sáu cột', () => {
    expect(GS).toContain("const SHEET_LENBANG = 'LenBang'")
    expect(GS).toContain("const LENBANG_HEADERS = ['SBD', 'MaCa', 'Qid', 'ChuyenDe', 'Dat', 'GhiLuc']")
  })

  it('KHÔNG đổi header của TienDoCa / TienDoHS / ChiTietCau', () => {
    // Đây là chốt quan trọng nhất của cả đợt: mọi bảng đang chạy phải nguyên vẹn.
    expect(GS).toContain("const TIENDO_CA_HEADERS = ['SBD', 'MaCa', 'ChuyenDe', 'SoCau', 'SoSai', 'NopLuc', 'CapNhatLuc']")
    expect(GS).toContain("const TIENDO_HS_HEADERS = ['SBD', 'ChuyenDe', 'SoCau', 'SoSai', 'CapNhatLuc']")
    expect(GS).toContain("const QID_HEADERS = ['SBD', 'DanhSachQid', 'SoCau', 'CapNhatLuc']")
  })

  it('`ghiLenBang` GIỮ NGUYÊN đường cũ rồi mới ghi thêm', () => {
    const than = GS.slice(GS.indexOf("if (action === 'ghiLenBang') {"), GS.indexOf("if (action === 'lichSuLenBang') {"))
    // đường cũ còn nguyên
    expect(than).toContain('ghiTienDo_(maCaLB, tomTat)')
    // và ghi thêm SAU nó
    expect(than.indexOf('ghiTienDo_(maCaLB, tomTat)')).toBeLessThan(than.indexOf('getSheet_(SHEET_LENBANG, LENBANG_HEADERS).appendRow'))
    expect(than).toContain("datLB ? 'dat' : 'chua',")
  })

  it('ghi lịch sử hỏng KHÔNG được làm hỏng việc chính', () => {
    const than = GS.slice(GS.indexOf("if (action === 'ghiLenBang') {"), GS.indexOf("if (action === 'lichSuLenBang') {"))
    expect(than).toContain('} catch (errLB) {')
    expect(than).toContain("canhBao: 'Không ghi được lịch sử lên bảng: '")
    // vẫn trả ok: bảng mạnh–yếu đã ghi xong ở trên rồi
    expect(than).toContain('ok: true, maCa: maCaLB, dat: datLB, canhBao')
  })

  it('lệnh đọc đòi mã bí mật, và chỉ trả SBD + con số đếm', () => {
    const than = GS.slice(GS.indexOf("if (action === 'lichSuLenBang') {"), GS.indexOf('// ------------------------------------------------------------------ KHO ĐỀ'))
    expect(than).toContain('const loiLS = kiemTraMaBiMat_(body)')
    expect(than).toContain('return jsonResponse_({ ok: true, soNgay: soNgay, theoEm: dem })')
    // KHÔNG lấy tên em, không lấy nội dung câu
    expect(than).not.toContain('hoTen')
    expect(than).not.toContain('SHEET_HOCSINH')
  })

  it('cắt theo cửa sổ ngày, mặc định 30', () => {
    expect(GS).toContain('const NGAY_LICH_SU_LEN_BANG = 30')
    const than = GS.slice(GS.indexOf("if (action === 'lichSuLenBang') {"), GS.indexOf('// ------------------------------------------------------------------ KHO ĐỀ'))
    expect(than).toContain('const moc = Date.now() - soNgay * 86400000')
    expect(than).toContain('if (!t || t < moc) continue')
  })

  it('MÃ BÍ MẬT không lọt vào mã nguồn — repo là repo công khai', () => {
    expect(GS).not.toMatch(/MA_BI_MAT\s*=\s*['"][^'"]{6,}['"]/)
  })
})

describe('MÁY THẦY — đọc được thì dùng, không đọc được thì NÓI THẬT', () => {
  it('API có, và trả về đúng hình dạng', () => {
    expect(API).toContain('export async function lichSuLenBang(')
    expect(API).toContain("postJson(scriptUrl, { action: 'lichSuLenBang', secret, soNgay: soNgay ?? 0 })")
  })

  it('màn cộng CẢ lịch sử THẬT lẫn số lần đã gọi trong buổi', () => {
    expect(MAN).toContain('soLanLenBang: (lichSu?.theoEm[e.sbd]?.soLan ?? 0) + (daGoiCau[e.sbd] ?? []).length,')
  })

  it('máy chủ bản cũ chưa có lệnh ⇒ coi là CHƯA CÓ, không phải hỏng', () => {
    const than = MAN.slice(MAN.indexOf('// Lịch sử lên bảng: đọc một lần'), MAN.indexOf('}, [cauHinh])'))
    expect(than).toContain('setLichSu(await lichSuLenBang(cauHinh.url, cauHinh.mat))')
    expect(than).toContain('setLichSu(null)')
  })

  it('cờ "chưa có lịch sử" nay theo SỰ THẬT, không cắm cứng', () => {
    expect(MAN).not.toContain('chuaCoLichSuLenBang: true')
    expect(MAN).toContain('chuaCoLichSuLenBang: !lichSu || Object.keys(lichSu.theoEm).length === 0,')
  })

  it('chấm xong một em thì cộng ngay, khỏi tải lại cả bảng', () => {
    const than = MAN.slice(MAN.indexOf('const cham = async ('))
    expect(than).toContain('soLan: (cu.theoEm[p.sbd]?.soLan ?? 0) + 1,')
    expect(than).toContain('lanCuoi: new Date().toISOString(),')
  })

  it('màn hiện đúng trạng thái lịch sử, cả khi chưa đọc được', () => {
    expect(MAN).toContain('Lịch sử lên bảng {lichSu.soNgay} ngày')
    expect(MAN).toContain('Chưa đọc được lịch sử lên bảng — mọi em coi như nhau về tần suất')
  })
})

describe('RÀ SOÁT — hai chỗ tự tìm ra khi soi lại phần vừa dựng', () => {
  it('DỰNG KHO CẤT DỌC ĐƯỜNG, không đợi tới cuối', () => {
    // Dựng kho là việc dài: mỗi ca một lượt gọi máy chủ kèm cả bản đề. Cất một
    // lần ở cuối thì thầy đóng tab ở ca 25/32 là mất trắng 25 ca vừa nạp.
    const than = MAN.slice(MAN.indexOf('const dungKho = async ()'), MAN.indexOf('const chayGiaoAn ='))
    expect(than).toContain('if (i % 5 === 0 || i === canNap.length) {')
    expect(than).toContain('await luuKhoDoKho(hienTai)')
    // và một ca hỏng không được chặn các ca còn lại
    expect(than).toContain('// Một ca hỏng KHÔNG chặn các ca còn lại')
  })

  it('KHÔNG nạp ca đã xoá vào kho độ khó', () => {
    // `danhSachCa(url, mat)` mặc định `daXoa = false`. Gọi kèm `true` là kéo cả
    // ca thùng rác vào thống kê độ khó.
    const than = MAN.slice(MAN.indexOf('const dungKho = async ()'), MAN.indexOf('const chayGiaoAn ='))
    expect(than).toContain('await danhSachCa(cauHinh.url, cauHinh.mat)')
    expect(than).not.toContain('danhSachCa(cauHinh.url, cauHinh.mat, true)')
  })

  it('hộp THỪA GIỜ nói luôn GIÁ PHẢI TRẢ, không chỉ nêu con số phút', () => {
    expect(MAN).toContain('Giá phải trả: chỉ <b style={SO}>{kqXep.soEmLenBang}</b>/<b style={SO}>{tranEm}</b> em được lên bảng.')
  })
})
