import { describe, it, expect } from 'vitest'
import JSZip from 'jszip'
import { pageItemsToText, htmlToLines, countEmbeddedEquations } from '../src/lib/exam-file-import'

describe('pageItemsToText (PDF -> text có xuống dòng)', () => {
  it('tách dòng đúng theo hasEOL do pdf.js báo, không dính liền các dòng khác nhau', () => {
    const items = [
      { str: 'PHẦN I', hasEOL: true, width: 30, transform: [1, 0, 0, 1, 0, 100] },
      { str: 'Câu 1: ', hasEOL: false, width: 30, transform: [1, 0, 0, 1, 0, 90] },
      { str: 'Cho phản ứng', hasEOL: true, width: 60, transform: [1, 0, 0, 1, 35, 90] },
      { str: 'A. ', hasEOL: false, width: 15, transform: [1, 0, 0, 1, 0, 80] },
      { str: 'chọn A', hasEOL: true, width: 30, transform: [1, 0, 0, 1, 16, 80] },
    ]
    const text = pageItemsToText(items)
    const lines = text.split('\n')
    expect(lines[0]).toBe('PHẦN I')
    expect(lines[1]).toContain('Câu 1:')
    expect(lines[1]).toContain('Cho phản ứng')
    expect(lines[2]).toContain('A.')
    expect(lines[2]).toContain('chọn A')
  })

  it('không chèn khoảng trắng thừa giữa các mảnh chữ dính sát nhau (vd công thức hoá bị tách item)', () => {
    const items = [
      { str: 'H', hasEOL: false, width: 6, transform: [1, 0, 0, 1, 0, 100] },
      { str: '2', hasEOL: false, width: 4, transform: [1, 0, 0, 1, 6, 100] },
      { str: 'SO', hasEOL: false, width: 10, transform: [1, 0, 0, 1, 10, 100] },
      { str: '4', hasEOL: true, width: 4, transform: [1, 0, 0, 1, 20, 100] },
    ]
    const text = pageItemsToText(items)
    expect(text).toBe('H2SO4')
  })
})

describe('htmlToLines (Word HTML -> text có xuống dòng + số thứ tự)', () => {
  it('mỗi <p> là 1 dòng riêng', () => {
    const html = '<p>MÃ ĐỀ: 132</p><p>PHẦN I</p><p>Câu 1: nội dung</p>'
    const text = htmlToLines(html)
    expect(text.split('\n')).toEqual(['MÃ ĐỀ: 132', 'PHẦN I', 'Câu 1: nội dung'])
  })

  it('<br> (Shift+Enter thủ công trong Word) cũng tách dòng riêng', () => {
    const html = '<p>PHẦN I<br>Câu 1: a<br>A. x<br>B. y</p>'
    const text = htmlToLines(html)
    expect(text.split('\n')).toEqual(['PHẦN I', 'Câu 1: a', 'A. x', 'B. y'])
  })

  it('tự đánh lại số cho danh sách đánh số tự động <ol> của Word (Câu 1,2,3 không có số trong text)', () => {
    const html = '<p>PHẦN I</p><ol><li>Câu đầu tiên</li><li>Câu thứ hai</li></ol>'
    const text = htmlToLines(html)
    const lines = text.split('\n')
    expect(lines).toContain('1) Câu đầu tiên')
    expect(lines).toContain('2) Câu thứ hai')
  })

  it('tự đánh lại chữ cho danh sách đánh chữ tự động <ol type="A"> (lựa chọn A/B/C/D)', () => {
    const html = '<ol type="A"><li>chọn A</li><li>chọn B</li><li>chọn C</li><li>chọn D</li></ol>'
    const text = htmlToLines(html)
    expect(text.split('\n')).toEqual(['A) chọn A', 'B) chọn B', 'C) chọn C', 'D) chọn D'])
  })

  it('bảng 2x2 (2 lựa chọn/hàng, rất hay dùng để căn cột A/B/C/D) tách đúng mỗi ô 1 dòng, không dính lựa chọn sau vào lựa chọn trước', () => {
    // Mammoth xuất bảng Word thành <table><tr><td>...</td><td>...</td></tr></table>.
    // Trước khi sửa, 'td' không nằm trong BLOCK_TAGS nên 2 ô cùng hàng dính
    // chung 1 dòng ("A. x" liền "B. y" không xuống dòng) -> app chỉ nhận ra
    // lựa chọn đứng đầu dòng (A, C), còn lựa chọn dính sau (B, D) bị báo
    // "thiếu nội dung" dù chữ vẫn còn nguyên trong file gốc.
    const html =
      '<table><tr><td><p>A. chọn A</p></td><td><p>B. chọn B</p></td></tr>' +
      '<tr><td><p>C. chọn C</p></td><td><p>D. chọn D</p></td></tr></table>'
    const text = htmlToLines(html)
    expect(text.split('\n')).toEqual(['A. chọn A', 'B. chọn B', 'C. chọn C', 'D. chọn D'])
  })
})

describe('countEmbeddedEquations (đếm công thức MathType/Equation Editor trong .docx)', () => {
  async function buildFakeDocx(documentXmlBody: string): Promise<ArrayBuffer> {
    const zip = new JSZip()
    zip.file(
      'word/document.xml',
      `<?xml version="1.0"?><w:document xmlns:w="w" xmlns:m="m" xmlns:o="o"><w:body>${documentXmlBody}</w:body></w:document>`,
    )
    return zip.generateAsync({ type: 'arraybuffer' })
  }

  it('đếm đúng số <m:oMath> (công thức MathType/Equation kiểu mới)', async () => {
    const buf = await buildFakeDocx('<m:oMath>x</m:oMath><w:p>text</w:p><m:oMath>y</m:oMath>')
    expect(await countEmbeddedEquations(buf)).toBe(2)
  })

  it('đếm đúng số <o:OLEObject> (công thức Equation Editor 3.0 kiểu cũ)', async () => {
    const buf = await buildFakeDocx('<o:OLEObject Type="Embed">x</o:OLEObject>')
    expect(await countEmbeddedEquations(buf)).toBe(1)
  })

  it('trả về 0 khi file không có công thức nào', async () => {
    const buf = await buildFakeDocx('<w:p>không có công thức</w:p>')
    expect(await countEmbeddedEquations(buf)).toBe(0)
  })

  it('file hỏng/không phải zip hợp lệ -> trả về 0, không ném lỗi', async () => {
    const buf = new TextEncoder().encode('không phải file zip').buffer
    expect(await countEmbeddedEquations(buf)).toBe(0)
  })
})
