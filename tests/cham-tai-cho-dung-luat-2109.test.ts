// CHẤM TẠI CHỖ TRÊN PHIẾU (`chamTaiCho` trong src/lib/html-phieu.ts) PHẢI CHẤM Y HỆT LUẬT CHÍNH THỨC — lỗi thật Code 1 tìm 21/09:
// bản cũ tự viết luật riêng cho Phần III (bỏ "+", bỏ đơn vị mol/g/%, so SỐ HỌC |a−b|<1e-4) nên em thấy "đúng" trên phiếu rồi máy chủ
// chấm SAI. Luật chính thức `normalizeNumericAnswer` (src/engine/score.ts) CỐ Ý không làm thế: chữ số có nghĩa có tính điểm.
// Test này LÔI HÀM `chamTaiCho` RA CHẠY THẬT (không chỉ đọc chữ) với đáp án đề + câu em gõ, và đối chiếu từng cặp với `normalizeNumericAnswer`.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { normalizeNumericAnswer } from '../src/engine/score'

const NGUON = readFileSync(resolve(__dirname, '..', 'src/lib/html-phieu.ts'), 'utf8')
const a = NGUON.indexOf('      function chamTaiCho() {')
const b = NGUON.indexOf('\n      function toKetQua', a)
expect(a).toBeGreaterThan(0)
// Trong tệp nguồn `\\s` là hai ký tự (chuỗi mẫu); trang HTML sinh ra nhận `\s`.
const THAN = NGUON.slice(a, b).replace(/\\\\s/g, '\\s')
const chamTaiCho = new Function('du', 'lam', `${THAN}\nreturn chamTaiCho();`) as (du: unknown, lam: unknown) => { dung: number; sai: string[] }

/** Chấm MỘT câu Phần III: đáp án đề `dapAn`, em gõ `chon` → có tính là đúng không. */
const dungIII = (dapAn: string, chon: string): boolean => {
  const r = chamTaiCho({ cau: [{ id: 'q1', phan: 'III', dapAn }] }, { q1: chon })
  return r.dung === 1 && r.sai.length === 0
}

describe('Phần III chấm tại chỗ: KHỚP luật chính thức, không nới (bảng cặp chốt 21/09)', () => {
  const CAP: [string, string, boolean, string][] = [
    // đáp án đề, em gõ, đúng?, ghi chú
    ['0,8', '0,80', false, 'chữ số có nghĩa: "0,80" ≠ "0,8"'],
    ['0,80', '0,8', false, 'chiều ngược lại'],
    ['5', '+5', false, 'dấu "+" KHÔNG bị bỏ'],
    ['+5', '5', false, 'dấu "+" KHÔNG bị bỏ (chiều ngược)'],
    ['5', '5 mol', false, 'đơn vị KHÔNG bị bỏ'],
    ['5 mol', '5', false, 'đơn vị KHÔNG bị bỏ (chiều ngược)'],
    ['12', '12%', false, '"%" KHÔNG bị bỏ'],
    ['0,5', '0.5000', false, 'không so số học'],
    ['0,87', '0.87', true, '"," ≡ "."'],
    ['–1', '-1', true, 'en dash (Word) ≡ dấu trừ bàn phím — ca thật 890691'],
    ['−5', '- 5', true, 'minus sign + khoảng trắng'],
    ['－3', '-3', true, 'fullwidth hyphen'],
    ['—7', '-7', true, 'em dash'],
    ['-5', '- 5', true, 'no-break space bị bỏ'],
    ['1 234', '1234', true, 'mọi khoảng trắng bị bỏ'],
    ['12', '1.2', false, 'số khác nhau vẫn khác nhau'],
    ['–5', '5', false, 'dấu trừ KHÔNG bị nuốt'],
  ]
  for (const [dapAn, chon, ky, ghi] of CAP) {
    it(`đáp án "${dapAn}" · em gõ "${chon}" ⇒ ${ky ? 'ĐÚNG' : 'SAI'} (${ghi})`, () => {
      expect(dungIII(dapAn, chon)).toBe(ky)
      // Và luôn ĐÚNG khi và chỉ khi luật chính thức nói hai chuỗi chuẩn hoá bằng nhau.
      expect(dungIII(dapAn, chon)).toBe(normalizeNumericAnswer(dapAn) === normalizeNumericAnswer(chon))
    })
  }
  it('câu bỏ trống là sai; Phần I và Phần II vẫn chấm như cũ', () => {
    expect(dungIII('5', '')).toBe(false)
    const r = chamTaiCho({ cau: [{ id: 'a', phan: 'I', dapAn: 'B' }, { id: 'b', phan: 'II', dapAn: 'ĐSĐS' }, { id: 'c', phan: 'II', dapAn: 'ĐSĐS' }] }, { a: 'b', b: 'DSDS', c: 'DSDD' })
    expect(r.dung).toBe(2); expect(r.sai).toEqual(['c'])
  })
})
