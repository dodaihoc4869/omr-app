// Thầy 02/11 khuya (ảnh câu tinh bột): «Những chỗ này ngắt ý ra nhé. Quét hết xem còn bao nhiêu câu cần ngắt ý đẹp vào.»
import { describe, expect, it } from 'vitest'
import { tachDongTheoY as tach } from '../src/lib/tach-dong-cau'
import { ngatYSoSau } from '../src/lib/ngat-y-so-sau'
import fs from 'node:fs'
import path from 'node:path'
const tachDongTheoY = (t: string) => ngatYSoSau(tach(t))

describe('ngắt ý khi số ý đứng SAU ý', () => {
  it('câu tinh bột của thầy: mỗi tính chất một dòng, câu hỏi cuối riêng', () => {
    const r = tachDongTheoY('Cho một số tính chất sau: tan trong nước lạnh (1); làm mất màu nước bromine (2); tan trong nước Schweizer (3); tác dụng với Cu(OH)2 tạo dung dịch xanh lam (4); phản ứng màu với iodine (5); bị thuỷ phân trong dung dịch acid đun nóng (6). Có bao nhiêu tính chất đúng của tinh bột?')
    expect(r.split('\n').filter(Boolean)).toEqual([
      'Cho một số tính chất sau:', 'tan trong nước lạnh (1);', 'làm mất màu nước bromine (2);', 'tan trong nước Schweizer (3);',
      'tác dụng với Cu(OH)2 tạo dung dịch xanh lam (4);', 'phản ứng màu với iodine (5);', 'bị thuỷ phân trong dung dịch acid đun nóng (6).', 'Có bao nhiêu tính chất đúng của tinh bột?',
    ])
  })
  it('dãy chất đánh số sau (câu trong kho)', () => {
    const r = tachDongTheoY('Cho các chất có công thức cấu tạo sau: H₂NCH₂COOH (1); C₂H₅COOH (2); C₂H₅NH₂ (3). Những chất vừa phản ứng được với acid vừa phản ứng được với base là')
    expect(r.split('\n')[0]).toBe('Cho các chất có công thức cấu tạo sau:')
    expect(r).toContain('H₂NCH₂COOH (1);\nC₂H₅COOH (2);\nC₂H₅NH₂ (3).')
  })
  it('KHÔNG tách: câu đục lỗ «…(1)…», nhắc lại «Thứ tự (1), (2)», liệt kê bằng dấu phẩy, công thức Cu(OH)2', () => {
    const lo = 'Phân tử NH₃ ...(1)... của H₂O nên NH₃ là ...(2)...'
    expect(tachDongTheoY(lo)).toBe(lo)
    expect(tachDongTheoY('Thứ tự (1), (2), (3), (4) về bán kính sẽ tương ứng với dãy nào?')).not.toMatch(/\(1\),\n/)
    expect(tachDongTheoY('Cho lá nhôm vào ống nghiệm (1), lá sắt vào ống nghiệm (2), lá đồng vào ống nghiệm (3).')).not.toMatch(/\(1\),\n/)
    expect(tachDongTheoY('Hoà tan Cu(OH)2 vào dung dịch rồi lọc.')).toBe('Hoà tan Cu(OH)2 vào dung dịch rồi lọc.')
  })
  it('màn làm câu học sinh (DeCau) dùng luật này', () => {
    expect(fs.readFileSync(path.join(__dirname, '../src/components/hoc-tap/LamCau.tsx'), 'utf8')).toMatch(/const de = ngatYSoSau\(tachDongTheoY\(q\.text\)\)/)
  })
})
