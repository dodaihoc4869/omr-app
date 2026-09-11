// CẮT HẲN GOOGLE — thầy chốt 12/09 rạng sáng:
// "gỡ sạch google, toàn bộ app phải được chạy trên máy chủ mới".
//
// Bộ test này là THƯỚC ĐO của mệnh lệnh ấy, không phải test cho một hàm. Nó đọc
// thẳng mã nguồn và hỏi ba câu:
//   1. Còn chỗ nào trong app gọi `script.google.com` không?
//   2. `postJson` — cửa duy nhất mọi lệnh đi qua — có trỏ vào máy chủ mới không?
//   3. Có lệnh nào app còn gửi mà máy chủ mới CHƯA dựng không?
//
// Câu 3 là câu đáng giá nhất: thiếu một lệnh thì màn hình dùng lệnh ấy hiện lỗi
// giữa giờ dạy, và không có cách nào biết trước bằng mắt — app có 61 lệnh.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')

const API = doc('src/lib/exam-api.ts')
const WORKER = doc('server/src/index.ts')

describe('cắt Google khỏi app', () => {
  it('không còn chỗ nào GỌI script.google.com', () => {
    // Ô nhập cấu hình còn chữ ấy làm placeholder, và vài ghi chú lịch sử nhắc
    // tên nó. Thứ bị cấm là GỌI: fetch tới đó.
    const goi = [...API.matchAll(/fetch\w*\([^)]*script\.google\.com/g)]
    expect(goi).toHaveLength(0)
    expect(API).not.toContain("fetch(`${scriptUrl}")
    expect(API).not.toContain('fetch(url)')
  })

  it('postJson gửi vào cổng /goi của máy chủ mới, không nhận địa chỉ từ chỗ gọi', () => {
    const i = API.indexOf('async function postJson(')
    expect(i).toBeGreaterThan(0)
    const than = API.slice(i, API.indexOf('\n}', i))
    expect(than).toContain('_scriptUrl')
    expect(than).toContain('layCauHinhMayChu()')
    expect(than).toContain('/goi`')
    // Thiếu địa chỉ thì BÁO, không âm thầm quay về đường cũ.
    expect(than).toContain('Chưa có địa chỉ máy chủ mới')
  })

  it('mở ca KHÔNG còn ghi Google Sheet', () => {
    const i = API.indexOf('export async function publishSession(')
    const than = API.slice(i, API.indexOf('\n}\n', i))
    expect(than).not.toContain('theoGhiSheet')
    expect(than).not.toContain("action: 'publish'")
    expect(than).toContain('dayMayChuMoi')
  })

  it('MỌI lệnh app còn gửi đều có mặt trong bảng dịch của máy chủ mới', () => {
    const lenh = [...new Set([...API.matchAll(/action: '([a-zA-Z]+)'/g)].map((m) => m[1]))]
    // App phải còn đủ lệnh — con số này rơi mạnh nghĩa là có chỗ gọi bị xoá nhầm.
    expect(lenh.length).toBeGreaterThan(50)
    const thieu = lenh.filter((x) => !WORKER.includes(`case '${x}':`))
    expect(thieu, `Máy chủ mới chưa dựng: ${thieu.join(', ')}`).toEqual([])
  })

  it('cổng /goi đứng TRƯỚC cổng mã bí mật và tự phân quyền', () => {
    const iGoi = WORKER.indexOf("if (p === '/goi')")
    const iMat = WORKER.indexOf('if (!laThay(req, env, b))')
    expect(iGoi).toBeGreaterThan(0)
    expect(iGoi).toBeLessThan(iMat)
    // Lệnh của thầy vẫn phải đòi mã — cổng mở cho học sinh không được kéo theo
    // lệnh chấm điểm, xoá ca, đọc kho đề.
    const i = WORKER.indexOf('const LENH_CUA_THAY')
    const bang = WORKER.slice(i, WORKER.indexOf('])', i))
    for (const x of ['ghiDiem', 'xoaCa', 'chiTietCa', 'danhSachDe', 'layDe', 'danhSachEm', 'hoSoEm']) {
      expect(bang, `lệnh ${x} phải đòi mã bí mật`).toContain(`'${x}'`)
    }
    // Lệnh của EM thì KHÔNG được nằm trong danh sách đòi mã.
    for (const x of ['vaoThi', 'submit', 'luuTam', 'tenTheoSbd', 'layPhieu', 'nopKhacPhuc']) {
      expect(bang, `lệnh ${x} là lệnh của em, không được đòi mã`).not.toContain(`'${x}'`)
    }
  })

  it('bảng dịch không bỏ sót lệnh nào rơi vào nhánh mặc định im lặng', () => {
    const i = WORKER.indexOf('async function goiCu(')
    const than = WORKER.slice(i, WORKER.indexOf('\n}\n', i))
    expect(than).toContain('default:')
    // Lệnh lạ phải NÓI TÊN nó ra, không trả `{ok:true}` rỗng.
    expect(than).toContain('chưa dựng lệnh')
  })
})

// DỊCH DÁNG TRẢ VỀ — chỗ dễ hỏng nhất của cả cổng.
//
// Bảng dịch không chỉ đổi nơi nhận: vài đường của máy chủ mới trả DÁNG KHÁC
// đường cũ. Không dịch thì lệnh vẫn "chạy", trả HTTP 200, và màn hình hiện
// trống — đúng loại hỏng im lặng khó thấy nhất.
describe('DỊCH ĐÚNG DÁNG TRẢ VỀ', () => {
  const than = (ten: string) => {
    const i = WORKER.indexOf(`case '${ten}':`)
    expect(i, ten).toBeGreaterThan(0)
    return WORKER.slice(i, i + 1200)
  }

  it('layDe bọc gói đề lại thành {ok, de} — đường /kho/lay trả thẳng dòng byte', () => {
    expect(than('layDe')).toContain('ra({ ok: true, de })')
  })

  it('chiTietCa dịch "không có ca" về {ok:false} — chỗ gọi đọc r.ca.maCa', () => {
    expect(than('chiTietCa')).toContain("j.coCa === false")
  })

  it('napDanhSachLop đổi khoá items → ds, đúng khoá /danh-sach/day đọc', () => {
    expect(than('napDanhSachLop')).toContain('{ ds: b.items }')
  })

  it('luuDe tự rút mã đề và danh sách câu từ gói, và từ chối gói không có mã đề', () => {
    const t = than('luuDe')
    expect(t).toContain('docCauTuGoiDe(de)')
    expect(t).toContain('Gói đề không có mã đề')
    // KHÔNG bịa số: máy chủ mới không đoán chất lượng câu nên `soNghi` là 0.
    expect(t).toContain('soNghi: 0')
  })
})

// ĐỦ TRƯỜNG, KHÔNG CHỈ ĐÚNG TÊN LỆNH.
//
// Lỗi thật 12/09: em bấm "xem điểm" thì hiện "Máy chủ chưa gửi đề của ca này".
// Lệnh `phieuCuaEm` chạy, trả HTTP 200, `ok: true` — nhưng thiếu `bank`, và
// màn của em đọc đúng trường ấy. Lệnh "có mặt" không đồng nghĩa với "dùng được".
describe('TRẢ ĐỦ TRƯỜNG MÀN HÌNH ĐANG ĐỌC', () => {
  const GC = doc('server/src/goi-cu.ts')
  const than = (ten: string) => {
    const i = GC.indexOf(`export async function ${ten}(`)
    expect(i, ten).toBeGreaterThan(0)
    return GC.slice(i, GC.indexOf('\n}\n', i))
  }

  it('phieuCuaEm trả đủ những trường màn "xem điểm" đọc', () => {
    const t = than('phieuCuaEm')
    for (const f of ['ma:', 'maBaiTap:', 'tong:', 'hoTen:', 'lop:', 'tenCa:', 'thoiGianPhut:', 'giuDeDoc:', 'luot:', 'bank,']) {
      expect(t, f).toContain(f)
    }
    for (const f of ['lanThu:', 'vaoLuc:', 'nopLuc:', 'trangThai:', 'dapAn:', 'giayCau:', 'integrity:', 'soLanRoiMan:', 'tongGiayRoiMan:']) {
      expect(t, f).toContain(f)
    }
  })

  it('CHƯA NỘP thì KHÔNG trả ngân hàng có đáp án — đường này công khai', () => {
    const t = than('phieuCuaEm')
    expect(t).toContain('const daNop =')
    expect(t).toContain('if (daNop && env.DE)')
  })

  it('ketQua trả đúng dáng KetQuaCongBo, không phải dáng tự nghĩ ra', () => {
    const t = than('ketQuaCuaEm')
    for (const f of ['congBo,', 'sanSang,', 'daNop,', 'daVao,', 'keyBank']) expect(t, f).toContain(f)
  })

  it('session trả dáng SessionConfig kèm gói đề KHÔNG đáp án', () => {
    const t = than('xemCa')
    expect(t).toContain('found: true')
    expect(t).toContain('bank,')
  })
})
