// LỜI GIẢI THẬT, TỪNG BƯỚC — ĐỒNG NHẤT MỌI BÁO CÁO, MỌI CA, MỌI APP.
//
// Thầy 14/09: "đáp án trả lời ngắn phải có giải từng bước. Sửa lại và đồng bộ
// hết mọi báo cáo, mọi ca thi, mọi app."
//
// NGUYÊN NHÂN GỐC đã truy: gói đề công khai `de/<maCa>.json` do `mergeAndStrip`
// dựng ra KHÔNG giữ `loiGiai` (đúng, vì gói ấy gửi cho em TRƯỚC khi làm bài),
// nhưng báo cáo lại dựng nội dung câu từ chính gói ấy, nên lời giải luôn rỗng;
// rồi `chuanHoaLoiGiaiCau` bịa một câu độn thay vào.
//
// Bộ kiểm này khoá hai điều:
//   1. `mergeAndStrip` VẪN không được rò lời giải ra gói công khai.
//   2. Không chỗ nào được bịa lời giải nữa; có lời giải kho thì phải in đủ bước.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { chuanHoaLoiGiaiCau, CHUA_CO_LOI_GIAI, taoHtmlKhungLoiGiaiGoogle } from '../src/lib/chuan-hoa-loi-giai'
import { mergeAndStrip } from '../src/data/examContent'

const LOI_GIAI_KHO_PHAN_III = {
  chot: 'Độ bất bão hoà của C₂₂H₃₂O₂ bằng (2 × 22 + 2 − 32) : 2 = 7.',
  buoc: [
    'Độ bất bão hoà của C₂₂H₃₂O₂ bằng (2 × 22 + 2 − 32) : 2 = 7.',
    'Nhóm −COOH đã chiếm một liên kết pi của nhóm C=O.',
    'Phân tử mạch hở nên không có vòng. Vậy còn 7 − 1 = 6 liên kết đôi C=C.',
  ],
  ket_qua: '6',
}

describe('Cấm bịa lời giải', () => {
  it('không có lời giải thì không dựng chữ thay — mọi định dạng rỗng đều báo thiếu', () => {
    for (const rong of ['', null, undefined, '[object Object]', {}, '   ']) {
      const r = chuanHoaLoiGiaiCau(rong, 'III', '6')
      expect(r.thieu, `đầu vào ${JSON.stringify(rong)}`).toBe(true)
      expect(r.chot).toBe('')
      expect(r.buoc).toBeNull()
      expect(r.lyDo).toBeNull()
    }
  })

  it('câu độn cũ đã bị gỡ khỏi mã nguồn', () => {
    const src = readFileSync(join(process.cwd(), 'src/lib/chuan-hoa-loi-giai.ts'), 'utf8')
    const than = src.replace(/^\/\/.*$/gm, '')
    expect(than).not.toContain('Bản chất kiến thức cốt lõi chuyên đề')
    expect(than).not.toContain('Đây là khẳng định chính xác theo bản chất hoá học')
    expect(than).not.toContain('Ghi nhớ định nghĩa và quy tắc suy luận hoá học trọng tâm')
  })

  it('khối HTML khi thiếu lời giải chỉ nói một câu, không in mục rỗng', () => {
    const html = taoHtmlKhungLoiGiaiGoogle(chuanHoaLoiGiaiCau('', 'I', 'B'))
    expect(html).toContain(CHUA_CO_LOI_GIAI)
    expect(html).not.toContain('KIẾN THỨC CỐT LÕI')
    expect(html).not.toContain('VÌ SAO CHỌN')
    expect(html).not.toContain('LÀM TỪNG BƯỚC')
  })
})

describe('Phần III phải có giải từng bước', () => {
  it('đọc đủ ba bước từ kho và in ra khối HTML', () => {
    const lg = chuanHoaLoiGiaiCau(LOI_GIAI_KHO_PHAN_III, 'III', '6')
    expect(lg.thieu).toBe(false)
    expect(lg.buoc).toEqual(LOI_GIAI_KHO_PHAN_III.buoc)

    const html = taoHtmlKhungLoiGiaiGoogle(lg)
    expect(html).toContain('LÀM TỪNG BƯỚC')
    expect(html).toContain('1. Độ bất bão hoà')
    expect(html).toContain('3. Phân tử mạch hở')
    expect(html).not.toContain(CHUA_CO_LOI_GIAI)
  })

  it('lời giải gửi dạng chuỗi JSON (đường máy chủ) cho ra đúng bấy nhiêu bước', () => {
    const lg = chuanHoaLoiGiaiCau(JSON.stringify(LOI_GIAI_KHO_PHAN_III), 'III', '6')
    expect(lg.buoc).toHaveLength(3)
    expect(lg.chot).toContain('Độ bất bão hoà')
  })
})

describe('Gói đề công khai vẫn không được mang lời giải', () => {
  it('mergeAndStrip lược sạch loiGiai, dang, canChua', () => {
    const nguon = [
      {
        maDe: 'T',
        phanI: [],
        phanII: [],
        phanIII: [
          {
            id: 'T-III-1',
            text: 'Số liên kết đôi C=C trong DHA bằng bao nhiêu?',
            correct: '6',
            loiGiai: { chot: LOI_GIAI_KHO_PHAN_III.chot, buoc: LOI_GIAI_KHO_PHAN_III.buoc },
            dang: { ma: 'ESTER.CAU_TAO.DEM_NGUYEN_TU', ten: 'Cấu tạo — đếm nguyên tử' },
            chuyenDe: 'Ester – lipid',
            canChua: { sao: 1 as const, dk: ['bay' as const], ly_do: '', bay: null },
          },
        ],
      },
    ] as never
    const cong = JSON.stringify(mergeAndStrip(nguon))
    expect(cong).not.toContain('Độ bất bão hoà')
    expect(cong).not.toContain('ESTER.CAU_TAO')
    expect(cong).not.toContain('canChua')
    // Nhưng đề bài thì vẫn phải còn, nếu không em không có gì để làm.
    expect(cong).toContain('Số liên kết đôi C=C')
  })
})
