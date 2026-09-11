// MÀN CA THI ĐỌC THẲNG MÁY CHỦ MỚI — đợt 5B, 11/09.
//
// Thầy báo: "ca thi vẫn tải trên google sheet, chuyển hết sang máy chủ mới đi
// cho nhanh". Đo thật từ trình duyệt của thầy cùng ngày:
//
//   Apps Script, gọi một lệnh KHÔNG tồn tại:  1 552 / 1 666 / 1 798 ms
//   Máy chủ mới, `/khoe`:                       109 /   333 /   547 ms
//
// Gần hai giây trôi qua TRƯỚC khi Apps Script đọc một ô nào.
//
// ====================================================================
// VÌ SAO KHÔNG ĐƠN GIẢN LÀ ĐỔI CHỖ ĐỌC
// ====================================================================
//
// Danh sách ca mang cả cột "đã vào / đã nộp / cảnh báo", đếm từ `LuotThi`. Hôm
// nay D1 có 1 ca (ca đo tải) và 0 lượt. Đổi chỗ đọc trước khi chuyển dữ liệu là
// màn Ca thi hiện THIẾU CA và ĐẾM SAI SỐ EM — thầy nhìn "12/36 đã nộp" rồi đi
// nhắc nhầm hai mươi tư phụ huynh. Sai số liệu tệ hơn chậm.
//
// Nên cổng an toàn là DỮ LIỆU, không phải mã: app chỉ đọc D1 khi trên D1 có dấu
// `ca_day_du`, và dấu ấy chỉ được ghi sau khi CHÍNH APP đối chiếu số ca và số
// dòng lượt hai bên khớp nhau.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const API = fs.readFileSync(path.join(process.cwd(), 'src/lib/exam-api.ts'), 'utf8')
const CLIENT = fs.readFileSync(path.join(process.cwd(), 'src/lib/man-ca-may-chu-moi.ts'), 'utf8')
const MAY = fs.readFileSync(path.join(process.cwd(), 'server/src/index.ts'), 'utf8')
const GS = fs.readFileSync(path.join(process.cwd(), 'docs/apps-script-kiem-tra.gs'), 'utf8')
const KHOI = fs.readFileSync(path.join(process.cwd(), 'src/components/KhoiMayChuMoi.tsx'), 'utf8')

describe('CỔNG AN TOÀN — chưa chuyển xong thì KHÔNG đọc D1', () => {
  it('thiếu dấu `ca_day_du` ⇒ trả null ⇒ đi đường cũ', () => {
    expect(CLIENT).toContain("if (!dau || dau.ma !== 'ca_day_du') return null")
  })

  it('`danhSachCaThat` hỏi máy chủ mới TRƯỚC, nhưng vẫn còn nguyên đường cũ phía sau', () => {
    const i = API.indexOf('async function danhSachCaThat')
    const than = API.slice(i, i + 1200)
    // NEO ĐỔI 16h10 (không hạ tiêu chí): thêm cửa `chiDuongCu` để lượt CHUYỂN
    // DỮ LIỆU ép đọc Apps Script — đọc D1 rồi ghi lại vào D1 là tự soi gương
    // rồi bảo mình khớp. Cửa ấy có phép kiểm riêng ở khối "CHUYỂN DỮ LIỆU".
    expect(than).toContain('const rMoi = chMoi ? await danhSachCaMoi(chMoi, secret, daXoa) : null')
    expect(than).toContain('if (rMoi) return chuanCaTomTat(rMoi.items)')
    // đường cũ phải nằm SAU, và phải còn
    expect(than.indexOf('danhSachCaMoi')).toBeLessThan(than.indexOf("action: 'danhSachCa'"))
    expect(than).toContain("postJson(scriptUrl, { action: 'danhSachCa', secret, daXoa })")
  })

  it('máy chủ mới ném lỗi cũng đi đường cũ, không nổ ra màn hình', () => {
    const i = API.indexOf('async function danhSachCaThat')
    expect(API.slice(i, i + 900)).toMatch(/try \{[\s\S]{0,500}\} catch \{/)
  })

  it('HAI ĐƯỜNG TRẢ VỀ CÙNG MỘT DÁNG — màn hình không phải biết mình đọc ở đâu', () => {
    expect(API).toContain('function chuanCaTomTat(items: unknown): CaTomTat[]')
    const n = (API.match(/chuanCaTomTat\(/g) || []).length
    expect(n).toBe(3) // khai báo + hai chỗ gọi
  })

  it('cửa BỎ QUA cổng chỉ dùng cho lượt đối chiếu, KHÔNG cho màn Ca thi', () => {
    expect(CLIENT).toContain('export async function danhSachCaMoiThoDoiChieu(')
    const i = API.indexOf('async function danhSachCaThat')
    expect(API.slice(i, i + 1200)).not.toContain('danhSachCaMoiThoDoiChieu')
    // chỉ được gọi trong đúng hàm chuyển dữ liệu
    const j = API.indexOf('export async function napToanBoCaLenMayChuMoi')
    expect(API.indexOf('danhSachCaMoiThoDoiChieu(ch, secret, false)')).toBeGreaterThan(j)
  })
})

describe('LUẬT ĐẾM PHẢI KHỚP APPS SCRIPT — lệch một ly là thầy nhìn sai số em', () => {
  const SQL = MAY.slice(MAY.indexOf('async function danhSachCaMoi'), MAY.indexOf('async function danhSachCaMoi') + 2600)

  it('lấy LẦN THỬ CAO NHẤT của mỗi em trong ca', () => {
    expect(SQL).toContain('SELECT ma_ca, sbd, MAX(lan_thu) AS m FROM luot GROUP BY ma_ca, sbd')
  })

  it('lượt `duoc_duyet_lai` KHÔNG tính vào bất kỳ ô nào', () => {
    expect(SQL).toContain("WHERE l.trang_thai <> 'duoc_duyet_lai'")
    // Apps Script cũng bỏ qua trước khi đếm bất cứ gì
    expect(GS).toContain("if (l.trangThai === 'duoc_duyet_lai') continue")
  })

  it('đã nộp = da_nop hoặc khoa, y như Apps Script', () => {
    expect(SQL).toContain("SUM(CASE WHEN trang_thai IN ('da_nop','khoa') THEN 1 ELSE 0 END) AS da_nop")
    expect(GS).toContain("if (l.trangThai === 'da_nop' || l.trangThai === 'khoa') kq.daNop++")
  })

  it('cảnh báo = khoa hoặc có lần rời màn, y như Apps Script', () => {
    expect(SQL).toContain("SUM(CASE WHEN trang_thai = 'khoa' OR so_lan_roi_man > 0 THEN 1 ELSE 0 END) AS canh_bao")
    expect(GS).toContain("if (l.trangThai === 'khoa' || l.soLanRoiMan > 0) kq.canhBao++")
  })

  it('ca ĐO TẢI không lọt vào danh sách của thầy', () => {
    expect(SQL).toContain("ma_ca <> 'DOTAI'")
  })
})

describe('ĐẨY DỮ LIỆU CŨ — không được giả vờ là bài chưa về Sheet', () => {
  const HAM = MAY.slice(MAY.indexOf('async function dayNhieuCa'), MAY.indexOf('async function dayNhieuCa') + 4200)

  it('MỌI dòng lượt đẩy ở đây đánh dấu `da_day_sheet = 1`', () => {
    expect(HAM).toContain('VALUES (?,?,?,?,?,?,?,?,?,?,?,1)')
    expect(HAM).toContain('da_day_sheet=1')
  })

  it('cột `da_day_sheet` nay chỉ còn là dấu vết lịch sử, không còn đường đọc nào', () => {
    // Trước 12/09, `dong-bo-nguoc.ts` lọc theo cột này để kéo bài về Google
    // Sheet. Thầy chốt "gỡ sạch google" nên cả tính năng ấy đã gỡ; cột giữ
    // nguyên trong lược đồ vì đổi cấu trúc dữ liệu đang có là việc khác hẳn,
    // và dữ liệu cũ vẫn phải đọc được.
    expect(fs.existsSync(path.join(process.cwd(), 'src/lib/dong-bo-nguoc.ts'))).toBe(false)
    const MAN = fs.readFileSync(path.join(process.cwd(), 'src/screens/ExamMonitorScreen.tsx'), 'utf8')
    expect(MAN).not.toContain('về Sheet')
  })

  it('ghi theo lô, không bắn từng dòng một', () => {
    expect(HAM).toContain('await env.DB.batch(cau.slice(i, i + 200))')
  })

  it('KHÔNG ghi đè mốc bắt đầu bằng rỗng — em đang thi mà mất mốc là bị đá về phòng chờ', () => {
    expect(HAM).toContain('bat_dau_thi_luc=COALESCE(excluded.bat_dau_thi_luc, ca.bat_dau_thi_luc)')
  })
})

describe('CHUYỂN DỮ LIỆU — hai lượt gọi cho cả kho, không phải một lượt mỗi ca', () => {
  const HAM = API.slice(API.indexOf('export async function napToanBoCaLenMayChuMoi'), API.length)

  // CHUYỆN THẬT 15h42–15h46 ngày 11/09. Bản đầu đọc CHI TIẾT từng ca để tự đếm
  // lại: 83 lượt gọi Apps Script, mỗi lượt 1,5–8 giây, tức hơn mười phút, và cả
  // vòng lặp ấy sống trong tab của thầy. Nhật ký Worker cho thấy nó chết sau
  // đúng 6 ca, không chạy tới bước đối chiếu — nên dấu không bao giờ được ghi.
  //
  // Apps Script ĐÃ đếm sẵn ba số đã vào / đã nộp / cảnh báo ngay trong lượt
  // `danhSachCa`, một lượt cho cả kho. Chép thẳng ba số ấy là xong.

  it('KHÔNG đọc chi tiết từng ca nữa', () => {
    expect(HAM).not.toContain('chiTietCa(')
    expect(HAM).not.toContain('for (let i = 0; i < tatCa.length; i++)')
  })

  it('chép ba số đếm Apps Script đã tính sẵn', () => {
    expect(HAM).toContain('daVao: c.daVao,')
    expect(HAM).toContain('daNop: c.daNop,')
    expect(HAM).toContain('canhBao: c.canhBao,')
  })

  it('đọc NGUỒN SỰ THẬT là Apps Script, không đọc D1 rồi ghi lại vào D1', () => {
    expect(HAM).toContain('danhSachCaThat(scriptUrl, secret, false, true)')
    expect(HAM).toContain('danhSachCaThat(scriptUrl, secret, true, true)')
    expect(API).toContain('const chMoi = chiDuongCu ? null : await layCauHinhMayChu()')
  })

  it('CHỐT CHỐNG BẤM CHỒNG — hai lượt chạy đè nhau là thứ đã làm hỏng 15h42', () => {
    expect(API).toContain('let dangNapCa = false')
    expect(HAM).toContain("if (dangNapCa) throw new Error('Lượt chuyển trước còn đang chạy")
    expect(HAM).toMatch(/\} finally \{\s*\n\s*dangNapCa = false\s*\n\s*\}/)
  })

  it('máy chủ mới không trả lời lượt đối chiếu ⇒ NÉM LỖI, không lặng lẽ coi là không khớp', () => {
    expect(HAM).toContain("if (!lai || !laiXoa) throw new Error('Máy chủ mới không trả lời lượt đối chiếu')")
  })

  it('so SỐ CA và TỔNG SỐ EM ĐÃ VÀO', () => {
    expect(HAM).toContain('const lechCa = tatCa.length - soCaD1')
    expect(HAM).toContain('const lechLuot = tongVaoSheet - tongVaoD1')
    expect(HAM).toContain('const khop = lechCa === 0 && lechLuot <= 0')
  })

  it('KHÔNG khớp ⇒ XOÁ dấu, màn Ca thi quay về đường cũ', () => {
    expect(HAM).toContain('await datDauDongBo(ch, secret, khop ?')
    expect(CLIENT).toContain("const than = dau === null\n    ? { ma: 'ca_day_du', xoa: true }")
  })

  it('chỉ ĐỌC Apps Script và GHI vào D1 — không lệnh xoá nào', () => {
    expect(HAM).not.toMatch(/action: '(xoaCa|deleteStudent|xoaPhieu|xoaDe)'/)
  })
})

describe('LẤY SỐ LỚN HƠN giữa đếm sống và số chụp', () => {
  const SQL = MAY.slice(MAY.indexOf('async function danhSachCaMoi'), MAY.indexOf('async function danhSachCaMoi') + 4200)

  it('ca CŨ: D1 không có dòng lượt nào ⇒ số chụp phải thắng', () => {
    expect(SQL).toContain('const chup = { da_vao: Number(v.dem_da_vao) || 0')
    expect(SQL).toContain('daVao: Math.max(Number(t.da_vao) || 0, chup.da_vao)')
  })

  it('cả ba ô đều lấy số lớn hơn, không chỉ mỗi ô đã vào', () => {
    expect(SQL).toContain('daNop: Math.max(Number(t.da_nop) || 0, chup.da_nop)')
    expect(SQL).toContain('canhBao: Math.max(Number(t.canh_bao) || 0, chup.canh_bao)')
  })

  it('số chụp được GHI lúc đẩy ca', () => {
    const HAM = MAY.slice(MAY.indexOf('async function dayNhieuCa'), MAY.indexOf('async function dayNhieuCa') + 4200)
    expect(HAM).toContain('dem_da_vao, dem_da_nop, dem_canh_bao, dem_luc')
    expect(HAM).toContain('Number(c.daVao) || 0, Number(c.daNop) || 0, Number(c.canhBao) || 0, nay,')
  })
})

// KHỐI CÀI ĐẶT ĐÃ RÚT GỌN (12/09). Ba nút của thời hai máy chủ — bật/tắt cờ,
// chuyển ca cũ, chuyển kho đề — đã làm xong việc và bị gỡ. Nút không còn tác
// dụng nhưng vẫn nằm đó là thứ thầy sẽ bấm nhầm giữa giờ dạy.
describe('KHỐI CÀI ĐẶT SAU KHI CẮT GOOGLE', () => {
  it('không còn nút bật/tắt cờ, không còn nút chuyển ca cũ và chuyển kho đề', () => {
    for (const cam of ['Tắt, quay về Apps Script', 'Chuyển ca cũ sang máy chủ mới', 'Chuyển KHO ĐỀ sang máy chủ mới']) {
      expect(KHOI, cam).not.toContain(cam)
    }
  })

  it('không còn một dòng chữ nào nhắc Apps Script hay Google Sheet', () => {
    for (const cam of ['Apps Script', 'Google Sheet']) expect(KHOI, cam).not.toContain(cam)
  })

  it('giữ đúng ba việc còn sống: địa chỉ · lập lại chỉ mục · đếm dữ liệu', () => {
    expect(KHOI).toContain('Thử kết nối')
    expect(KHOI).toContain('Lập lại chỉ mục câu của kho')
    expect(KHOI).toContain('Đếm dữ liệu trên máy chủ')
  })
})

