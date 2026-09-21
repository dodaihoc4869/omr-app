// QUÉT MỌI Ô TRẢ LỜI NGẮN (thầy 21/09: "quét mọi chỗ, sửa mọi chỗ mọi app"): khoá để về sau KHÔNG ai dựng lại một ô đáp số trần (không có nút "−" và ",") ở bất kỳ màn nào.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const GOC = path.join(process.cwd(), 'src')
function lietKe(d: string, ra: string[] = []): string[] {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name)
    if (e.isDirectory()) { if (!/graphify-out|node_modules|xem-thu/.test(e.name)) lietKe(p, ra) }
    else if (/\.(tsx?|css)$/.test(e.name)) ra.push(p)
  }
  return ra
}
const TEP = lietKe(GOC)
const doc = (f: string) => fs.readFileSync(f, 'utf8')
const tuong = (f: string) => path.relative(process.cwd(), f)

describe('mọi ô trả lời ngắn đều đi qua ONhapDapSo', () => {
  it('`inputMode="decimal"` (bàn phím số) CHỈ nằm trong ONhapDapSo.tsx — mọi nơi khác phải dùng thành phần đó', () => {
    const khongChuThich = (f: string) => doc(f).split('\n').filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n')
    const coDecimal = TEP.filter((f) => /\.tsx$/.test(f) && /inputMode\s*=\s*["']decimal["']|inputMode\s*=\s*'decimal'|inputMode = 'decimal'/.test(khongChuThich(f))).map(tuong)
    expect(coDecimal).toEqual(['src/components/ONhapDapSo.tsx'])
  })
  it('tờ phiếu HTML (chuỗi thô) có `inputmode="decimal"` ĐÚNG MỘT chỗ, và chỗ đó nằm trong khối có hai nút', () => {
    const src = doc(path.join(GOC, 'lib/html-phieu.ts'))
    const dem = src.match(/inputmode="decimal"/g) ?? []
    expect(dem).toHaveLength(1)
    expect(src).toMatch(/<div class="lam-nhap-khoi">.*inputmode="decimal".*<\/div>/)
  })
  it('các nơi đã chuyển đang thật sự nhập và dùng ONhapDapSo', () => {
    const NOI = ['components/TheCau.tsx', 'components/bang-nhiem-vu/LamCauOn.tsx', 'components/bang-nhiem-vu/MomM3.tsx', 'screens/StudentPortalScreen.tsx', 'game/than-thu-v2/DoanCau.tsx']
    for (const n of NOI) {
      const s = doc(path.join(GOC, n))
      expect(s, n).toMatch(/import ONhapDapSo from/)
      expect(s, n).toMatch(/<ONhapDapSo/)
    }
  })
  it('ô "số hoặc chữ" / "đáp án" / "câu trả lời ngắn" KHÔNG còn là <input> trần ở nơi nào (placeholder đặc trưng chỉ đứng cạnh ONhapDapSo)', () => {
    const DAC_TRUNG = /placeholder=["']?(Nhập đáp án số hoặc chữ|Nhập đáp án|Nhập đáp số|Ví dụ 12,5)/
    for (const f of TEP.filter((x) => /\.tsx$/.test(x))) {
      const s = doc(f)
      for (const m of s.matchAll(new RegExp(DAC_TRUNG.source, 'g'))) {
        const truoc = s.slice(Math.max(0, m.index! - 500), m.index)
        // tìm thẻ mở gần nhất trước placeholder: phải là <ONhapDapSo, không phải <input
        const thoMo = Math.max(truoc.lastIndexOf('<input'), truoc.lastIndexOf('<textarea'))
        const daoMo = truoc.lastIndexOf('<ONhapDapSo')
        expect(daoMo, `${tuong(f)}: ô "${m[1]}" phải là <ONhapDapSo>, không phải <input> trần`).toBeGreaterThan(thoMo)
      }
    }
  })
  it('không nơi nào tự chế nút đổi dấu âm/dấu phẩy khác (nhãn "Thêm dấu âm"/"Thêm dấu phẩy" chỉ ở ONhapDapSo và tờ phiếu)', () => {
    const co = TEP.filter((f) => /Thêm dấu (âm|phẩy)|Bỏ dấu âm/.test(doc(f))).map(tuong).sort()
    expect(co).toEqual(['src/components/ONhapDapSo.tsx', 'src/lib/html-phieu.ts'].sort())
  })
})

describe('bảng các nơi có ô nhập (đã rà 21/09) — KHÔNG áp dụng, có lý do', () => {
  // Mọi <input> khác trong src là: mã ca / số báo danh / mật khẩu / tên / tìm kiếm / số câu cần rút / thanh kéo / ô tick — không phải đáp số của bài làm.
  it('không có <input type="number"> nào nhận ĐÁP ÁN của em (chỉ cấu hình của thầy / số lượng)', () => {
    for (const f of TEP.filter((x) => /\.tsx$/.test(x))) {
      const s = doc(f)
      for (const m of s.matchAll(/type="number"/g)) {
        const gan = s.slice(Math.max(0, m.index! - 300), m.index! + 400)
        expect(gan, `${tuong(f)}: type=number gần chữ "đáp án của em"`).not.toMatch(/Đáp án của em|Đáp số của em|đáp án số hoặc chữ/)
      }
    }
  })
})
