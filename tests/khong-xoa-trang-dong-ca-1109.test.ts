// CA 704066 — HAI LỖI BẮT ĐƯỢC GIỮA CA THẬT TỐI 11/09, tra thẳng D1.
//
// ① DÒNG CA BỊ XOÁ TRẮNG LÚC BẤM BẮT ĐẦU.
// `batDauThi` đẩy sang Worker đúng HAI trường (`maCa`, `batDauThiLuc`), nhưng
// câu upsert của `/ca/day` lấy `excluded.*` cho mọi cột. Mọi trường không gửi
// bị ghi đè bằng rỗng. Tra D1 lúc 18:05, giữa ca, 25 em đang làm:
//
//     ma_ca 704066 · ten_ca '' · lop '' · bat_dau '' · het_han_vao ''
//     phong_cho 0  · bat_dau_thi_luc 2026-09-11T11:00:17.871Z
//
// Màn Ca thi đọc D1 từ sáng nay nên hiện một ca KHÔNG TÊN, KHÔNG LỚP. Và nặng
// hơn: HẠN VÀO PHÒNG với cờ PHÒNG CHỜ bị xoá ngay giữa ca.
//
// ② KHOÁ CA KHÔNG ĐÓNG NỔI LƯỢT BÊN D1.
// Thầy bấm Khoá ca lúc 18:08. Apps Script nộp hộ 25 em và ghi `da_nop` lên
// Sheet; dòng ca bên D1 sang `dong` nhờ lượt soi vừa phát hành. Nhưng 25 dòng
// LƯỢT bên D1 vẫn nằm `dang_lam`:
//
//     SELECT COUNT(*) FROM luot WHERE trang_thai='dang_lam'  →  25
//
// Màn Ca thi đếm `da_nop` từ D1 ⇒ hiện 4/29 nộp trong khi thật là 29/29.
// Sai số liệu còn tệ hơn chậm.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const WK = fs.readFileSync(path.join(process.cwd(), 'server/src/index.ts'), 'utf8')
const DAY = fs.readFileSync(path.join(process.cwd(), 'src/lib/day-ca-may-chu-moi.ts'), 'utf8')
const API = fs.readFileSync(path.join(process.cwd(), 'src/lib/exam-api.ts'), 'utf8')

describe('① ĐẨY MỘT PHẦN KHÔNG ĐƯỢC XOÁ PHẦN CÒN LẠI', () => {
  // Cắt ĐÚNG khối, không cắt theo số ký tự: cắt thừa là ăn sang câu upsert đầy
  // đủ ngay dưới, và phép kiểm "không đụng cột nào khác" đỏ oan.
  const DAU = WK.indexOf('if (b.chiMoc === true) {')
  const KHOI = WK.slice(DAU, WK.indexOf('chiMoc: true, coCa:', DAU))

  it('có đường đẩy riêng cho mốc bắt đầu', () => {
    expect(WK).toContain('if (b.chiMoc === true) {')
  })

  it('đường ấy chỉ UPDATE đúng hai cột, không đụng cột nào khác', () => {
    expect(KHOI).toContain('UPDATE ca SET bat_dau_thi_luc')
    expect(KHOI).toContain('bo_theo_em_json')
    for (const cam of ['ten_ca', 'lop', 'phong_cho', 'het_han_vao', 'bat_dau =', 'trang_thai']) {
      expect(KHOI, cam).not.toContain(cam)
    }
    expect(KHOI).not.toContain('INSERT INTO ca')
  })

  it('mốc rỗng KHÔNG xoá mốc đang có', () => {
    expect(KHOI).toContain('COALESCE(?, bat_dau_thi_luc)')
    expect(KHOI).toContain('COALESCE(?, bo_theo_em_json)')
  })

  it('CHỐT CHẶN THỨ HAI: upsert đầy đủ cũng không cho chuỗi rỗng ghi đè', () => {
    const up = WK.slice(WK.indexOf('ON CONFLICT(ma_ca) DO UPDATE SET'), WK.indexOf('ON CONFLICT(ma_ca) DO UPDATE SET') + 1600)
    for (const cot of ['ten_ca', 'bat_dau', 'het_han_vao', 'han_nop', 'lop']) {
      expect(up, cot).toContain(`${cot}=COALESCE(NULLIF(excluded.${cot},''), ca.${cot})`)
    }
  })

  it('máy thầy dùng `dayMocBatDauMoi`, KHÔNG dùng `dayCaMoi` cho lượt bấm Bắt đầu', () => {
    const i = API.indexOf("action: 'batDauThi'")
    expect(i).toBeGreaterThan(0)
    const than = API.slice(i, i + 1600)
    expect(than).toContain('dayMocBatDauMoi(')
    expect(than).not.toContain('dayCaMoi(')
  })

  it('`dayMocBatDauMoi` gửi cờ chiMoc', () => {
    const han = DAY.slice(DAY.indexOf('export async function dayMocBatDauMoi('), DAY.indexOf('export async function dayMocBatDauMoi(') + 700)
    expect(han).toContain('chiMoc: true')
  })
})

describe('② KHOÁ CA PHẢI ĐÓNG NỐT LƯỢT BÊN D1', () => {
  const KHOI = WK.slice(WK.indexOf('if (b.khoaLuot === true) {'), WK.indexOf('if (b.khoaLuot === true) {') + 1200)

  it('Worker có nhánh khoá lượt', () => {
    expect(WK).toContain('if (b.khoaLuot === true) {')
  })

  it('đóng đúng những lượt ĐANG LÀM, và ghi `da_nop` y như Apps Script', () => {
    expect(KHOI).toContain("trang_thai = 'da_nop'")
    expect(KHOI).toContain("WHERE ma_ca = ? AND trang_thai = 'dang_lam'")
  })

  it('TUYỆT ĐỐI không đụng `dap_an_json` — đó là phần em đã làm', () => {
    expect(KHOI).not.toContain('dap_an_json')
  })

  it('trả về số em bị nộp hộ để máy thầy đối chiếu được', () => {
    expect(KHOI).toContain('soEmBiNop')
  })

  it('khoaCa bên máy thầy bật cờ khoaLuot', () => {
    const i = API.indexOf("action: 'khoaCa'")
    expect(i).toBeGreaterThan(0)
    expect(API.slice(i, i + 800)).toContain('{ khoaLuot: true }')
  })

  it('CHỈ khoaCa mới khoá lượt — xoá, đổi tên, mở khoá thì không', () => {
    expect(API.match(/khoaLuot: true/g)?.length).toBe(1)
  })
})
