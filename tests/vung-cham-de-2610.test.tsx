// @vitest-environment jsdom
// «Chạm để hiểu đề» gắn vào màn Duo — 3 chỗ theo hợp đồng docs/hop-dong-doc-de-2610.md (Code app 3 ↔ Code app 1, 26/10). Thay bản khe chờ cũ
// (VungChamDe trả nguyên đề + TamGiaiThich của màn): nay ruột thật (main #397) tự vẽ thẻ giải nghĩa / gợi ý; hành vi ruột có test riêng goi-y-cham-*.
//   1. thân đề bọc VungChamDe với token + phiên chặng + onHoTro + nutBatDau (nút vào hàng nút đáy);
//   2. khung màn chừa cột phải gợi ý: padding-right: var(--gyc-cot-phai, 0px);
//   3. lời giải sau nộp ở tấm «Lời giải từng bước»: LoiGiaiCauCoSoDo (nạp lười khi mở tấm) với soDo của kết quả `answer`.
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('màn Duo gắn «Chạm để hiểu đề»', () => {
  const s = readFileSync('src/components/hoc-tap/ManLamBaiTap.tsx', 'utf8')
  it('bọc thân đề bằng VungChamDe (token, phiên, onHoTro, nutBatDau)', () => {
    expect(s).toMatch(/<VungChamDe q=\{q\} token=\{token\} phien=\{phien\} onHoTro=\{danhDauHoTro\} nutBatDau=\{nutBatDau\}><DeCau q=\{q\} stt=\{stt\} \/><\/VungChamDe>/)
  })
  it('khung màn chừa cột phải gợi ý', () => {
    expect(readFileSync('src/styles/trong-lam-bai.css', 'utf8')).toMatch(/\.ht-app\.ht2-lam\.duo \{ padding-right: var\(--gyc-cot-phai, 0px\); \}/)
  })
  it('lời giải từng bước dùng LoiGiaiCauCoSoDo với soDo', () => {
    expect(s).toMatch(/lazy\(\(\) => import\('..\/goi-y-cham\/LoiGiaiCauCoSoDo'\)\)/)
    expect(s).toMatch(/<LoiGiaiCauCoSoDo q=\{q\} solution=\{k\.solution\} dapAn=\{k\.answer\} hinhLoiGiai=\{k\.solutionImages\} soDo=\{k\.soDo\} \/>/)
  })
})
