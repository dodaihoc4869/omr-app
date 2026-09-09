// LÝ DO PHIẾU CHỈ ĐỌC PHẢI NẰM TRONG PHIẾU, KHÔNG PHẢI TRÊN TRANG APP.
//
// Thầy báo 09/09 tối, HAI LẦN cùng một câu: "rút đề tạo khắc phục nhưng bấm
// chọn đáp án không được". Ảnh lần hai cho thấy URL
// `?vai=diem&examCode=335663`, thanh phiếu ghi "Phiếu chỉ có đề", bốn ô A/B/C/D
// xám, và KHÔNG có một dòng nào nói vì sao.
//
// NGUYÊN NHÂN GỐC CỦA VIỆC "KHÔNG BIẾT VÌ SAO":
// `KhoiBaiLuyen` đã dựng sẵn dòng giải thích từ 08/09 —
//
//     {khongNop !== '' && html !== '' && ( … 'Phiếu này chưa có mã bài tập…' )}
//
// — nhưng nó nằm trong luồng trang app, còn phiếu thì hiện bằng
// `KhungXemPhieu`, một lớp phủ TOÀN MÀN HÌNH dựng qua `createPortal`. Lớp phủ
// che kín dòng đó. Đúng lúc người dùng cần lời giải thích nhất thì nó bị đậy.
//
// SỬA: lý do đi THEO phiếu (`TuyChonPhieu.loiNhac`), nên hiện được ở cả bản
// xem trong app lẫn tệp HTML tải về.
//
// TỆP NÀY KHÔNG khẳng định phiếu chỉ đề phải bấm được — nó KHÔNG được bấm, vì
// `boLoiGiai` đã xoá `dapAn` (xem `phieu-chi-de-khong-duoc-nop-0909.test.ts`).
// Nó chỉ khoá một điều: chỉ đọc thì phải NÓI RA, không được im lặng.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { dungPhieu } from '../src/lib/html-phieu'
import type { CauLuyen } from '../src/lib/bai-tap-pdf'

const KHOI = fs.readFileSync(path.join(process.cwd(), 'src/components/KhoiBaiLuyen.tsx'), 'utf8')

const C = (o: Partial<CauLuyen>): CauLuyen =>
  ({
    phan: 'I',
    id: 'x',
    maDe: 'X',
    chuyenDe: 'Carbohydrate',
    dang: 'chua_ro',
    sao: 0,
    mucDo: 'hieu',
    text: 'Đề',
    luaChon: ['a', 'b', 'c', 'd'],
    dapAn: 'A',
    chot: 'c',
    lyDo: null,
    buoc: null,
    ketQua: '',
    ...o,
  }) as CauLuyen

const CAU = [C({ id: 'q1', dapAn: 'C' })]
const TT = { hoTen: 'Nguyễn Văn A', sbd: '12050', ngay: new Date(2026, 8, 9), tenChuyenDe: 'Carbohydrate', ketQua: '', hienDapAn: true }

describe('dungPhieu dựng được lời nhắc đầu phiếu', () => {
  it('có loiNhac thì hiện thành khối .nhac-phieu trong THÂN tài liệu', () => {
    const h = dungPhieu(TT, CAU, { anGiai: true, loiNhac: 'Chưa xin được mã bài tập.' })
    expect(h).toContain('class="nhac-phieu"')
    expect(h).toContain('Chưa xin được mã bài tập.')
    // Phải nằm TRONG khung phiếu, tức trước danh sách câu — không phải chân trang.
    expect(h.indexOf('class="nhac-phieu"')).toBeLessThan(h.indexOf('class="ds-cau"'))
  })

  it('không khai loiNhac thì KHÔNG mọc thêm khối nào', () => {
    const h = dungPhieu(TT, CAU, { anGiai: true })
    expect(h).not.toContain('class="nhac-phieu"')
  })

  it('chuỗi rỗng hoặc toàn dấu cách cũng không mọc khối', () => {
    expect(dungPhieu(TT, CAU, { anGiai: true, loiNhac: '' })).not.toContain('class="nhac-phieu"')
    expect(dungPhieu(TT, CAU, { anGiai: true, loiNhac: '   ' })).not.toContain('class="nhac-phieu"')
    expect(dungPhieu(TT, CAU, { anGiai: true, loiNhac: null })).not.toContain('class="nhac-phieu"')
  })

  it('LỜI NHẮC BỊ THOÁT — nhét thẻ vào không phá được trang', () => {
    const h = dungPhieu(TT, CAU, { anGiai: true, loiNhac: '</div><script>x</script>' })
    expect(h).not.toContain('</div><script>x</script>')
    expect(h).toContain('&lt;')
  })

  it('kiểu dáng dùng biến màu sẵn có, không đẻ mã màu mới', () => {
    const css = fs.readFileSync(path.join(process.cwd(), 'src/lib/html-phieu.ts'), 'utf8')
    const dong = css.slice(css.indexOf('.nhac-phieu {'), css.indexOf('\n', css.indexOf('.nhac-phieu {')))
    expect(dong).toContain('var(--kem-nen)')
    expect(dong).not.toMatch(/#[0-9a-fA-F]{3,8}/)
  })
})

describe('KhoiBaiLuyen phải truyền lý do vào phiếu', () => {
  it('phiếu chỉ đề của EM luôn đi kèm loiNhac', () => {
    expect(KHOI).toContain('chiDeChoEm ? { anGiai: true, loiNhac: nhacTrongPhieu } : { nop }')
  })

  it('đủ BA lý do, mỗi lý do một câu khác nhau — không gộp thành một câu chung chung', () => {
    const dau = KHOI.indexOf('const nhacTrongPhieu = chiDeChoEm')
    expect(dau).toBeGreaterThan(0)
    const than = KHOI.slice(dau, KHOI.indexOf("        : ''", dau) + 12)
    expect(than).toContain("lyDoKhongNop === 'thieu_ma'")
    expect(than).toContain("lyDoKhongNop === 'thieu_sbd'")
    // Nhánh cuối là thiếu link máy chủ.
    expect(than).toContain('địa chỉ máy chủ')
    // Mỗi câu phải nói RÕ là chưa bấm chọn được — đó chính là điều thầy thấy.
    expect((than.match(/chưa bấm chọn/g) || []).length).toBe(3)
  })

  it('nộp được thì KHÔNG có lời nhắc — không doạ người dùng vô cớ', () => {
    const dau = KHOI.indexOf('const nhacTrongPhieu = chiDeChoEm')
    const than = KHOI.slice(dau, KHOI.indexOf("        : ''", dau) + 12)
    // Toàn bộ biểu thức treo trên `chiDeChoEm`; không phải chỉ đề thì rỗng.
    expect(than.trimEnd().endsWith(": ''")).toBe(true)
  })

  it('dòng cũ trên trang app GIỮ NGUYÊN — người đóng lớp phủ vẫn đọc được', () => {
    expect(KHOI).toContain("{khongNop !== '' && html !== '' && (")
  })
})
