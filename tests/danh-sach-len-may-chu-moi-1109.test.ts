// CỔNG DANH SÁCH LỚP TRÊN MÁY CHỦ MỚI — 11/09.
//
// Bảng `danh_sach` trên D1 là CỔNG VÀO THI của máy chủ mới, đúng vai sheet
// `DanhSachLop` bên Apps Script. Hai máy chủ cùng gác một cổng, nên mọi lệch
// luật đều biến thành "em qua được bên này, bị chặn bên kia" — thứ thầy đã
// gặp một lần và không có cách nào lần ra giữa giờ thi.
//
// LỖI THẬT, tìm ra trước khi phát hành:
//
//     ds.map(e => String(e.sbd).trim())    // mảng CHUỖI
//       .filter(x => x.length > 0)         // BỎ phần tử ⇒ chỉ số lệch
//       .map((_, i) => bind(ds[i].sbd, ds[i].hoTen, ...))   // tra mảng GỐC
//
// Một em thiếu số báo danh trong tệp của thầy là đủ: mọi em đứng sau bị gán họ
// tên của em kế tiếp, và những em cuối rơi mất. Cổng vẫn "chạy", chỉ chặn nhầm
// người.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { chuanHoaDanhSach } from '../server/src/danh-sach'

const MAY = fs.readFileSync(path.join(process.cwd(), 'server/src/index.ts'), 'utf8')
const GS = fs.readFileSync(path.join(process.cwd(), 'docs/apps-script-kiem-tra.gs'), 'utf8')

/** Ba em, em GIỮA thiếu số báo danh — đúng hình dạng tệp thật của thầy khi có
 * một dòng trống hoặc một dòng ghi chú lọt vào giữa. */
const TEP_THAY = [
  { sbd: '0001', hoTen: 'Nguyễn Văn An', namSinh: '2009', lop: '12A1' },
  { sbd: '   ', hoTen: 'dòng thừa', namSinh: '', lop: '' },
  { sbd: '0003', hoTen: 'Trần Thị Bình', namSinh: '2009', lop: '12A1' },
  { sbd: '0004', hoTen: 'Lê Văn Cường', namSinh: '2010', lop: '12A2' },
]

describe('TÁI HIỆN LỖI CŨ — để không ai vô tình viết lại', () => {
  it('kiểu `.filter()` rồi tra mảng gốc theo chỉ số thì GÁN NHẦM TÊN', () => {
    const cuSai = TEP_THAY.map((e) => String(e.sbd ?? '').trim())
      .filter((x) => x.length > 0)
      .map((_, i) => ({ sbd: String(TEP_THAY[i].sbd ?? '').trim(), hoTen: TEP_THAY[i].hoTen }))
    // Em 0003 lẽ ra tên "Trần Thị Bình", nhưng chỉ số lệch nên nhận dòng thừa.
    expect(cuSai[1].sbd).toBe('')
    expect(cuSai[1].hoTen).toBe('dòng thừa')
    // Và em cuối cùng RƠI MẤT khỏi cổng — em này đến phòng thi là bị chặn.
    expect(cuSai.some((x) => x.sbd === '0004')).toBe(false)
  })

  it('bản mới giữ đúng từng em với đúng tên của em ấy', () => {
    const moi = chuanHoaDanhSach(TEP_THAY)
    expect(moi.map((x) => x.sbd)).toEqual(['0001', '0003', '0004'])
    expect(moi.map((x) => x.hoTen)).toEqual(['Nguyễn Văn An', 'Trần Thị Bình', 'Lê Văn Cường'])
    expect(moi.map((x) => x.namSinh)).toEqual(['2009', '2009', '2010'])
    expect(moi.map((x) => x.lop)).toEqual(['12A1', '12A1', '12A2'])
  })
})

describe('LUẬT PHẢI KHỚP APPS SCRIPT — hai cổng, một luật', () => {
  it('số báo danh trùng: GIỮ DÒNG ĐẦU, y như Apps Script', () => {
    const moi = chuanHoaDanhSach([
      { sbd: '0007', hoTen: 'Bản đúng', namSinh: '2009', lop: '12A1' },
      { sbd: '0007', hoTen: 'Bản gõ nhầm sau', namSinh: '2011', lop: '12A9' },
    ])
    expect(moi).toHaveLength(1)
    expect(moi[0].hoTen).toBe('Bản đúng')
    // Canh luôn bên Apps Script để hai bên không lặng lẽ tách nhau.
    expect(GS).toContain('if (!sbd || daCo[sbd]) continue')
  })

  it('cắt khoảng trắng hai đầu, đúng chỗ Apps Script cũng cắt', () => {
    const moi = chuanHoaDanhSach([{ sbd: ' 0009 ', hoTen: ' Phạm D ', namSinh: ' 2010 ', lop: ' 12A3 ' }])
    expect(moi[0]).toEqual({ sbd: '0009', hoTen: 'Phạm D', namSinh: '2010', lop: '12A3' })
  })

  it('không phải mảng, hoặc phần tử rỗng: trả mảng rỗng, không nổ', () => {
    expect(chuanHoaDanhSach(null)).toEqual([])
    expect(chuanHoaDanhSach('0001,0002')).toEqual([])
    expect(chuanHoaDanhSach([null, undefined, {}])).toEqual([])
  })
})

describe('GHI ĐÈ TOÀN BỘ — em bị gạch tên phải biến mất khỏi cổng', () => {
  const HAM = MAY.slice(
    MAY.indexOf('async function dayDanhSach'),
    MAY.indexOf('async function dayDanhSach') + 1600,
  )

  it('có xoá những em KHÔNG nằm trong lượt đẩy này', () => {
    expect(HAM).toContain('DELETE FROM danh_sach WHERE cap_nhat_luc <> ?')
  })

  it('XOÁ ĐỨNG SAU mọi lô ghi — không xoá trên một bảng ghi dở', () => {
    const iGhi = HAM.indexOf('env.DB.batch(')
    const iXoa = HAM.indexOf('DELETE FROM danh_sach')
    expect(iGhi).toBeGreaterThan(0)
    expect(iXoa).toBeGreaterThan(iGhi)
  })

  it('DANH SÁCH RỖNG thì không ghi và KHÔNG xoá — cấm mở toang cổng', () => {
    const iChan = HAM.indexOf("ds.length === 0")
    const iXoa = HAM.indexOf('DELETE FROM danh_sach')
    expect(iChan).toBeGreaterThan(0)
    expect(iChan).toBeLessThan(iXoa)
    expect(HAM).toMatch(/ds\.length === 0\) return ra\(\{ ok: false/)
    // Apps Script cũng từ chối y hệt.
    expect(GS).toContain("Danh sách rỗng — không ghi đè")
  })

  it('KHÔNG còn kiểu `.filter()` rồi tra `ds[i]` trong hàm này', () => {
    expect(HAM).not.toMatch(/\.filter\([\s\S]{0,80}\.map\(\(_, i\)/)
    expect(HAM).not.toContain('ds[i]')
  })
})

describe('CỔNG CHẶN — bảng trống thì KHÔNG chặn ai', () => {
  it('Worker chỉ chặn khi bảng đã có ít nhất một dòng', () => {
    expect(MAY).toContain("SELECT 1 AS co FROM danh_sach LIMIT 1")
    expect(MAY).toMatch(/if \(ca && \(await coDanhSach\(env\)\) && !\(await docDanhSach\(env, sbd\)\)\)/)
  })

  it('Apps Script cũng vậy — cùng một đánh đổi, không lệch', () => {
    expect(GS).toContain('function coDanhSachHocSinh_()')
    expect(GS).toContain('const coDs = coDanhSachHocSinh_()')
  })
})
