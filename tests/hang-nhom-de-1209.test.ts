// HÀNG LỌC NHÓM ĐỀ — thầy chốt 12/09 lúc 0:33 kèm ảnh màn: 28 nhóm đề xuống
// dòng thành mười hàng chip, đẩy hộp chọn đề rơi khỏi màn.
//
// "phần này thu gọn lại, làm cho tinh tế. đẹp mắt ở cả phần mở ca và phần phân công"
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { nhanNgan } from '../src/components/HangNhomDe'

const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
const HANG = doc('src/components/HangNhomDe.tsx')
const MO_CA = doc('src/screens/ExamSetupScreen.tsx')
const PC = doc('src/screens/PhanCongScreen.tsx')

describe('CẮT NHÃN', () => {
  it('nhãn ngắn giữ nguyên, không thêm dấu ba chấm thừa', () => {
    expect(nhanNgan('12 · C4 - Polymer')).toBe('12 · C4 - Polymer')
  })

  it('nhãn dài bị cắt và có dấu ba chấm', () => {
    const dai = '11 · C5 - Dẫn xuất halogen – Alcohol – Phenol'
    const ra = nhanNgan(dai)
    expect(ra.length).toBeLessThanOrEqual(27)
    expect(ra.endsWith('…')).toBe(true)
  })

  it('cắt ở khoảng trắng — chữ cuối cùng còn nguyên, không đứt nửa chừng', () => {
    const dai = '12 · C3 - Hợp chất chứa nitrogen'
    const giu = nhanNgan(dai).replace('…', '')
    // Phần giữ lại phải kết thúc ĐÚNG chỗ có khoảng trắng trong tên gốc, nghĩa
    // là chữ cuối cùng không bị cắt làm đôi.
    expect(dai.startsWith(`${giu} `)).toBe(true)
  })

  it('không bịa chữ — phần giữ lại là tiền tố thật của tên nhóm', () => {
    const dai = '10 · C2 - Bảng tuần hoàn và định luật tuần hoàn'
    expect(dai.startsWith(nhanNgan(dai).replace('…', '').trimEnd())).toBe(true)
  })
})

describe('MỘT DÒNG, VUỐT NGANG', () => {
  it('không xuống dòng — chiều cao khối lọc là hằng số dù kho có bao nhiêu nhóm', () => {
    expect(HANG).toContain("overflowX: 'auto'")
    expect(HANG).toContain("whiteSpace: 'nowrap'")
    expect(HANG).not.toContain('flex-wrap')
  })

  it('chip "Tất cả" luôn đứng đầu — đường về thì không được đi tìm', () => {
    expect(HANG).toContain("{['', ...ds].map((n)")
  })

  it('giữ tên đầy đủ trong title, vì nhãn đã bị cắt', () => {
    expect(HANG).toContain("title={n || 'Tất cả nhóm đề'}")
  })

  it('nút đủ cao cho ngón tay', () => {
    expect(HANG).toContain('minHeight: 34')
  })
})

describe('DÙNG CHUNG HAI MÀN', () => {
  it('cả Mở ca và Phân công đều dùng đúng hàng này', () => {
    for (const [ten, mh] of [['Mở ca', MO_CA], ['Phân công', PC]] as const) {
      expect(mh, ten).toContain('<HangNhomDe ds={dsNhom} chon={nhomLoc} onChon={setNhomLoc} />')
      expect(mh, ten).toContain("import HangNhomDe from '../components/HangNhomDe'")
    }
  })

  it('không màn nào còn tự vẽ hàng chip nhóm riêng', () => {
    for (const [ten, mh] of [['Mở ca', MO_CA], ['Phân công', PC]] as const) {
      expect(mh, ten).not.toContain('aria-label="Lọc theo nhóm đề"')
    }
  })
})
