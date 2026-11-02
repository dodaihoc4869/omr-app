// Thầy 03/11: «Bong bóng của giám thị khung phải tự động vừa với chữ nhé.» (ảnh: bong bóng cam 2 dòng rộng hết cỡ, thừa khoảng trống bên phải)
// jsdom không dàn chữ ⇒ kiểm mã: cả hai bộ vẽ giám thị (mới / cũ) đo dòng dài nhất rồi đặt bề rộng ngay sau khi gắn đủ chữ. Đo thật trên Chromium: 394 → 308 px.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
const doc = (p: string) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8')
describe('bong bóng giám thị co vừa chữ', () => {
  for (const tep of ['src/components/giam-thi/giam-thi-nguoi.ts', 'src/components/giam-thi/giam-thi-ve.ts']) {
    it(tep, () => {
      const s = doc(tep)
      expect(s).toMatch(/function coVuaChu\(el: HTMLElement\): void/)
      expect(s).toMatch(/r\.selectNodeContents\(el\)/)
      expect(s).toMatch(/el\.style\.width = `\$\{Math\.ceil\(rong \+ dem \+ 1\)\}px`/)
      expect(s).toMatch(/coVuaChu\(el\) \/\/ khung vừa dòng chữ dài nhất/)
    })
  }
})
