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
    expect(than).toContain('const rMoi = await danhSachCaMoi(chMoi, secret, daXoa)')
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

  it('vì sao: đánh 0 là màn Theo dõi báo "còn N bài chưa về Sheet" rồi đẩy ngược lại bài đã có', () => {
    // Canh bằng chính chỗ đọc: `demChuaDay` lọc theo cột này.
    const DB = fs.readFileSync(path.join(process.cwd(), 'src/lib/dong-bo-nguoc.ts'), 'utf8')
    expect(DB).toContain('da_day_sheet')
  })

  it('ghi theo lô, không bắn từng dòng một', () => {
    expect(HAM).toContain('await env.DB.batch(cau.slice(i, i + 200))')
  })

  it('KHÔNG ghi đè mốc bắt đầu bằng rỗng — em đang thi mà mất mốc là bị đá về phòng chờ', () => {
    expect(HAM).toContain('bat_dau_thi_luc=COALESCE(excluded.bat_dau_thi_luc, ca.bat_dau_thi_luc)')
  })
})

describe('CHUYỂN DỮ LIỆU — tự đối chiếu, không tự phong là đủ', () => {
  const HAM = API.slice(API.indexOf('export async function napToanBoCaLenMayChuMoi'), API.length)

  it('chỉ ĐỌC Apps Script và GHI vào D1 — không có lệnh xoá nào', () => {
    expect(HAM).not.toMatch(/action: '(xoaCa|deleteStudent|xoaPhieu|xoaDe)'/)
  })

  it('so CHÍNH XÁC số ca và số dòng lượt, không so bằng `daVao`', () => {
    expect(HAM).toContain('const lechCa = tatCa.length - soCaD1')
    expect(HAM).toContain('const lechLuot = soLuotSheet - soLuotD1')
    expect(HAM).toContain('const soLuotD1 = lai?.soDongLuot ?? 0')
  })

  it('một ca hỏng cũng KHÔNG được ghi dấu', () => {
    expect(HAM).toContain('const khop = hong.length === 0 && lechCa === 0 && lechLuot <= 0')
  })

  it('KHÔNG khớp ⇒ XOÁ dấu, để màn Ca thi quay về đường cũ', () => {
    expect(HAM).toContain('await datDauDongBo(ch, secret, khop ? { soCa: soCaD1, soLuot: soLuotD1, ghiChu:')
    expect(CLIENT).toContain("const than = dau === null\n    ? { ma: 'ca_day_du', xoa: true }")
  })

  it('một ca lỗi không làm gãy cả lượt — ghi tên rồi đi tiếp', () => {
    expect(HAM).toContain('hong.push(c.maCa)')
    expect(HAM).toMatch(/\} catch \{\s*\n\s*hong\.push\(c\.maCa\)\s*\n\s*\}/)
  })

  it('gọi `chiTietCa` TUẦN TỰ — chạy song song là dựng lại đúng cú dồn đã gỡ', () => {
    expect(HAM).toContain('for (let i = 0; i < tatCa.length; i++)')
    expect(HAM).not.toContain('Promise.all(tatCa')
  })
})

describe('NÚT TRONG CÀI ĐẶT', () => {
  it('chỉ bấm được khi cờ máy chủ mới đang BẬT', () => {
    expect(KHOI).toContain('disabled={dangNap || !ch.BAT}')
  })

  it('nói rõ kết quả đối chiếu, không chỉ nói "đã chuyển"', () => {
    expect(KHOI).toContain('Đã chuyển và ĐỐI CHIẾU KHỚP')
    expect(KHOI).toContain('CHƯA khớp')
    expect(KHOI).toContain('Màn Ca thi vẫn đọc Apps Script như cũ')
  })

  it('nói rõ là KHÔNG xoá gì ở Google Sheet', () => {
    expect(KHOI).toContain('không xoá gì ở Google Sheet')
  })
})
