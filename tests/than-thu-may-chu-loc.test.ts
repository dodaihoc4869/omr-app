/**
 * MÁY CHỦ PHẢI LỌC — KHÔNG TIN MÁY EM GỬI GÌ CŨNG LƯU.
 *
 * Bảng `than_thu` nằm cùng cơ sở dữ liệu với bảng điểm. Máy em là chỗ dễ sửa
 * nhất trong cả hệ: mở công cụ trình duyệt là đổi được localStorage, và gói tin
 * gửi lên cũng sửa được. Nên hai thứ phải chặn ở MÁY CHỦ, không phải ở máy em:
 *
 *  1. **Tầng đỏ**: hồ sơ lưu xuống KHÔNG được chứa tên, số điện thoại, điểm
 *     thi, ảnh bài — kể cả khi máy em cố tình nhét vào.
 *  2. **Trần cứng**: cấp không quá 12, EXP không quá 100 triệu, không số âm.
 *
 * Phép kiểm đọc thẳng mã nguồn máy chủ. Không dựng được D1 thật ở đây, nhưng
 * bộ lọc là phần dễ viết sót nhất và đọc mã là bắt được.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

const MA = readFileSync('server/src/goi-cu.ts', 'utf8')
// Phép trộn đã tách sang tệp thuần để phép kiểm CHẠY được nó (xem
// `than-thu-may-chu-tron.test.ts`); mấy phép đọc mã ở đây soi cả hai tệp.
const TRON = readFileSync('server/src/tron-than-thu.ts', 'utf8')
const KHOI = MA.slice(MA.indexOf('THẦN THÚ HOÁ HỌC — ĐỒNG BỘ ĐA THIẾT BỊ')) + '\n' + TRON
const SQL = readFileSync('server/migration-1509-than-thu.sql', 'utf8')
const INDEX = readFileSync('server/src/index.ts', 'utf8')

describe('Bảng than_thu', () => {
  it('chỉ THÊM bảng, không sửa không xoá bảng nào đang chạy', () => {
    expect(SQL).toContain('CREATE TABLE IF NOT EXISTS than_thu')
    expect(SQL).not.toMatch(/\bDROP\b/i)
    expect(SQL).not.toMatch(/\bALTER TABLE (ca|luot|hoc_sinh|danh_sach|chi_tiet_cau)\b/i)
  })

  it('không có cột nào chứa tên, điện thoại, điểm hay ảnh', () => {
    const than = SQL.slice(SQL.indexOf('CREATE TABLE IF NOT EXISTS than_thu'))
    for (const xau of ['ho_ten', 'ten_hs', 'sdt', 'dien_thoai', 'diem', 'anh', 'lop', 'nam_sinh']) {
      expect(than.includes(xau), `cột cấm: ${xau}`).toBe(false)
    }
  })

  it('có khoá chính theo số báo danh và mốc cập nhật', () => {
    expect(SQL).toMatch(/sbd\s+TEXT PRIMARY KEY/)
    expect(SQL).toContain('cap_nhat_luc')
    expect(SQL).toContain('tong_exp')
  })
})

describe('Bộ lọc trường của máy chủ', () => {
  it('có hàm lọc riêng, không ghi thẳng thứ máy em gửi', () => {
    expect(KHOI).toContain('function locHoSoThanThu')
    // Thân hàm ghi phải gọi bộ lọc trước khi chạm cơ sở dữ liệu.
    const ghi = KHOI.slice(KHOI.indexOf('export async function thanThuGhi'))
    expect(ghi.indexOf('locHoSoThanThu(')).toBeGreaterThan(-1)
    expect(ghi.indexOf('locHoSoThanThu(')).toBeLessThan(ghi.indexOf('INSERT INTO than_thu'))
  })

  it('KHÔNG có đường nào ghi nguyên gói máy em gửi vào cơ sở dữ liệu', () => {
    const ghi = KHOI.slice(KHOI.indexOf('export async function thanThuGhi'))
    // Chỉ được stringify bản ĐÃ LỌC.
    expect(ghi).toContain('JSON.stringify(hoSo)')
    expect(ghi).not.toContain('JSON.stringify(b.hoSo)')
    expect(ghi).not.toContain('JSON.stringify(b)')
  })

  it('có trần cứng cho cấp và EXP', () => {
    expect(KHOI).toContain('TRAN_CAP')
    expect(KHOI).toContain('TRAN_EXP')
    expect(KHOI).toMatch(/TRAN_CAP\s*=\s*12/)
  })

  it('hoà giải KHÔNG theo đồng hồ — máy em đặt sai giờ không đè được máy kia', () => {
    const ghi = KHOI.slice(KHOI.indexOf('export async function thanThuGhi'))
    expect(ghi).not.toMatch(/cap_nhat_luc\s*[<>]/)
  })

  it('máy chủ TRỘN hai bản rồi trả bản trộn về, không ghi đè mù', () => {
    const ghi = KHOI.slice(KHOI.indexOf('export async function thanThuGhi'))
    expect(ghi).toContain('tronHoSoThu')
    // Bản trộn phải quay về máy em, để hai bên bằng nhau ngay trong một vòng.
    expect(ghi).toContain('hoSo,')
  })

  it('thiếu số báo danh thì từ chối, cả đọc lẫn ghi', () => {
    for (const ten of ['thanThuDoc', 'thanThuGhi']) {
      const h = KHOI.slice(KHOI.indexOf(`export async function ${ten}`))
      expect(h.slice(0, 400)).toContain('Thiếu số báo danh')
    }
  })

  it('chỉ nhận đúng năm nguồn EXP, khoá lạ bị vứt', () => {
    expect(KHOI).toContain('NGUON_EXP_HOP_LE')
    for (const k of ['caThi', 'btvn', 'mom', 'leoThap', 'sanBoss']) {
      expect(KHOI.includes(`'${k}'`), k).toBe(true)
    }
  })
})

describe('Nối lệnh vào máy chủ', () => {
  it('hai lệnh mới có mặt, và không đụng lệnh ca thi nào', () => {
    expect(INDEX).toContain("case 'thanThuDoc'")
    expect(INDEX).toContain("case 'thanThuGhi'")
    expect(INDEX).toContain("p === '/hs/than-thu'")
    expect(INDEX).toContain("p === '/hs/than-thu-ghi'")
    // Lệnh ca thi vẫn nguyên.
    expect(INDEX).toContain("case 'hsCauSai'")
    expect(INDEX).toContain("case 'hsLichSuCa'")
    expect(INDEX).toContain("case 'publish'")
  })
})
