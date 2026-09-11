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
