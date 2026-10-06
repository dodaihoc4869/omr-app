// CHUẨN HIỂN THỊ LỜI GIẢI (thầy lệnh 06/10: "sửa mọi chỗ hiển thị lời giải cho đúng chuẩn hiển thị của app"; docs/hop-dong-game-hoa-2.md:53).
// Khoá: (1) KhoiLoiGiaiChuan đúng thứ tự LỜI GIẢI → Kiến thức cốt lõi → từng phương án/ý ✓ ✗ → bước → kết quả, cả ba phần;
// (2) MỖI nơi đã chuyển có nhãn "LỜI GIẢI" + "Kiến thức cốt lõi"; (3) CSS khối chuẩn: không viền trái cong, hết khoảng thừa, nhãn ≥ 4,5:1 sáng + tối.
import { describe, expect, it, afterEach } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import fs from 'node:fs'
import path from 'node:path'
import KhoiLoiGiaiChuan, { KhoiLoiGiaiTuCT, loiGiaiChuanTuKho } from '../src/components/loi-giai/KhoiLoiGiaiChuan'
import { LoiGiaiCauSai } from '../src/components/KhoiCauSai'
import KhungLoiGiaiGame from '../src/components/KhungLoiGiaiGame'
import TheCauChiTiet from '../src/components/TheCauChiTiet'
import { htmlKhoiLoiGiaiChuan } from '../src/lib/html-khoi-loi-giai-chuan'
import type { CauSaiChiTiet } from '../src/lib/phieu-du-lieu'

afterEach(cleanup)
const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
const viTri = (h: string, ...xs: string[]) => xs.map((x) => h.indexOf(x))
const tangDan = (a: number[]) => a.every((x, i) => x >= 0 && (i === 0 || x > a[i - 1]!))

const LG_I = { chot: 'Este no đơn chức', tungPa: { A: { dung: false, viSao: 'Sai A' }, B: { dung: true, viSao: 'Đúng B' }, C: { dung: false, viSao: 'Sai C' }, D: { dung: false, viSao: 'Sai D' } } }
const LG_II = { chot: 'Carbohydrate', tungY: { a: { dung: true, viSao: 'ý a' }, b: { dung: false, viSao: 'ý b' }, c: { dung: true, viSao: 'ý c' }, d: { dung: false, viSao: 'ý d' } } }
const LG_III = { chot: 'Bảo toàn khối lượng', buoc: ['Tính số mol', 'Tính khối lượng'], ketQua: '12,5' }

describe('KhoiLoiGiaiChuan · thứ tự và dấu ✓ ✗', () => {
  it('Phần I: LỜI GIẢI → Kiến thức cốt lõi → bốn phương án (xáo: mã theo chữ đang thấy, lý do theo chữ gốc), ✓ đúng một dòng', () => {
    const { container } = render(<KhoiLoiGiaiChuan phan="I" loiGiai={LG_I} correct="B" choicePerm={[1, 0, 3, 2]} />)
    const h = container.innerHTML
    expect(tangDan(viTri(h, 'LỜI GIẢI', 'Kiến thức cốt lõi', 'Đúng B', 'Sai A', 'Sai D', 'Sai C'))).toBe(true)
    const dong = [...container.querySelectorAll('.lg-y')]
    expect(dong.map((d) => d.querySelector('.lg-ma')!.textContent)).toEqual(['A.', 'B.', 'C.', 'D.'])
    expect(dong.map((d) => d.getAttribute('data-dung'))).toEqual(['1', '0', '0', '0'])
    expect(container.querySelectorAll('[aria-label="đúng"]')).toHaveLength(1)
    expect(container.querySelectorAll('[aria-label="sai"]')).toHaveLength(3)
    expect(container.textContent).toMatch(/✓/)
    expect(container.textContent).toMatch(/✗/)
  })
  it('Phần II: bốn ý a) b) c) d), ✓/✗ theo đáp án Đ/S đang chấm (không theo cờ kho)', () => {
    const { container } = render(<KhoiLoiGiaiChuan phan="II" loiGiai={LG_II} correct="SDSD" />)
    expect([...container.querySelectorAll('.lg-ma')].map((x) => x.textContent)).toEqual(['a)', 'b)', 'c)', 'd)'])
    expect([...container.querySelectorAll('.lg-y')].map((d) => d.getAttribute('data-dung'))).toEqual(['0', '1', '0', '1'])
  })
  it('Phần III: bước đánh số + Kết quả; câu hỏi không có lời giải ⇒ "Thầy chưa nhập lời giải cho câu này."', () => {
    const { container } = render(<KhoiLoiGiaiChuan phan="III" loiGiai={LG_III} correct="12,5" />)
    const h = container.innerHTML
    expect(tangDan(viTri(h, 'LỜI GIẢI', 'Kiến thức cốt lõi', 'Tính số mol', 'Tính khối lượng', 'lg-ket-qua'))).toBe(true)
    expect(container.querySelectorAll('.lg-buoc li')).toHaveLength(2)
    expect(container.querySelector('.lg-ket-qua')!.textContent).toBe('12,5')
    cleanup()
    const trong = render(<KhoiLoiGiaiChuan phan="I" />)
    expect(trong.container.textContent).toContain('LỜI GIẢI')
    expect(trong.container.textContent).toContain('Thầy chưa nhập lời giải cho câu này.')
    expect(trong.container.querySelector('.lg-chot')).toBeNull()
  })
  it('thiếu cấu trúc ⇒ lời giải chữ trong cùng khối', () => {
    const { container } = render(<KhoiLoiGiaiChuan phan="I" explanation="Este có nhóm –COO–." />)
    expect(container.querySelector('.loi-giai .lg-chu')!.textContent).toBe('Este có nhóm –COO–.')
  })
  it('loiGiaiChuanTuKho đọc JSON kho; kho thiếu ⇒ undefined (không bịa)', () => {
    expect(loiGiaiChuanTuKho(JSON.stringify({ chot: 'x', tung_pa: { A: { dung: true, vi_sao: 'a' } } }), 'I', 'A')?.tungPa?.A?.viSao).toBe('a')
    expect(loiGiaiChuanTuKho(null, 'I', 'A')).toBeUndefined()
  })
})

describe('Mỗi nơi đã chuyển đều có nhãn LỜI GIẢI + Kiến thức cốt lõi, đúng thứ tự', () => {
  const kho = JSON.stringify({ chot: 'Cu(OH)2 màu xanh', tung_pa: { A: { dung: false, vi_sao: 'Sai A' }, B: { dung: true, vi_sao: 'Đúng B' }, C: { dung: false, vi_sao: 'Sai C' }, D: { dung: false, vi_sao: 'Sai D' } } })
  const kiem = (h: string) => {
    expect(h).toContain('LỜI GIẢI')
    expect(h).toContain('Kiến thức cốt lõi')
    expect(h).not.toMatch(/Điểm mấu chốt|bg-amber|bg-slate|Chốt: /)
    expect(tangDan(viTri(h, 'LỜI GIẢI', 'Kiến thức cốt lõi', 'Đúng B'))).toBe(true)
  }
  it('LoiGiaiCauSai (game, LamCauOn, báo cáo)', () => kiem(renderToStaticMarkup(<LoiGiaiCauSai c={{ phan: 'I', dapAnDung: 'B', loiGiai: kho }} />)))
  it('KhungLoiGiaiGame (Leo tháp, Săn câu sai)', () => kiem(renderToStaticMarkup(<KhungLoiGiaiGame loiGiaiTho={kho} dapAnDung={1} daChon={0} phuongAn={['a', 'b', 'c', 'd']} />)))
  it('KhoiLoiGiaiTuCT (phụ huynh: TungCau, ManChiTietCa) có lý do từng phương án', () => {
    kiem(renderToStaticMarkup(<KhoiLoiGiaiTuCT ct={{ chot: 'Cu(OH)2 màu xanh', buoc: [], ketQua: '', lyDo: [{ khoa: 'A', dung: false, ly: 'Sai A' }, { khoa: 'B', dung: true, ly: 'Đúng B' }] }} dapAn="B" />))
  })
  it('TheCauChiTiet (báo cáo phụ huynh / tấm trượt)', () => {
    const c: CauSaiChiTiet = { phan: 'I', soCau: 1, qid: 'q1', chuyenDe: 'Este', mucDo: 'hieu', giay: 30, de: 'Đề', luaChon: ['a', 'b', 'c', 'd'], dapAnDung: 'B', dapAnChon: 'A', chot: 'Cu(OH)2 màu xanh', lyDo: [{ khoa: 'A', dung: false, ly: 'Sai A' }, { khoa: 'B', dung: true, ly: 'Đúng B' }], buoc: null, ketQua: '', coHinh: false }
    kiem(renderToStaticMarkup(<TheCauChiTiet c={c} stt={1} moSanBanDau />))
  })
  it('HTML trang kết quả (StudentPortalScreen) cùng thứ tự, thoát ký tự HTML, không còn bản sao rgb kem/hổ phách', () => {
    const h = htmlKhoiLoiGiaiChuan({ chot: 'a < b', lyDo: [{ khoa: 'A', dung: false, ly: 'Sai A' }, { khoa: 'B', dung: true, ly: 'Đúng B' }], phan: 'I' })
    expect(tangDan(viTri(h, 'LỜI GIẢI', 'Kiến thức cốt lõi', 'Sai A', 'Đúng B'))).toBe(true)
    expect(h).toContain('a &lt; b')
    const man = doc('src/screens/StudentPortalScreen.tsx')
    expect(man).toContain('htmlKhoiLoiGiaiChuan(c)')
    expect(man).not.toContain('ĐÚNG CHUẨN ẢNH 4')
    expect(man).not.toContain('rgb(255, 253, 245)')
  })
  it('màn tổ chiếu + khung dự phòng + báo cáo thầy dùng khối chuẩn (không còn nhãn cũ)', () => {
    for (const t of ['src/screens/DieuKhienToChieuScreen.tsx', 'src/components/loi-giai/KhungLoiGiai.tsx', 'src/components/xem-diem-gv/BaoCaoMotEm.tsx']) {
      const s = doc(t)
      expect(s, t).toContain('KhoiLoiGiaiChuan')
      expect(s, t).not.toMatch(/Điểm mấu chốt|Kiến thức cốt lõi:|Hướng dẫn giải:/)
    }
  })
})

/** Tương phản WCAG giữa hai màu #rrggbb. */
const doChoi = (hex: string) => {
  const t = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4))
  return 0.2126 * t[0]! + 0.7152 * t[1]! + 0.0722 * t[2]!
}
const tuongPhan = (a: string, b: string) => { const [l1, l2] = [doChoi(a), doChoi(b)].sort((x, y) => y - x); return (l1! + 0.05) / (l2! + 0.05) }

describe('CSS khối chuẩn (index.css + tokens.css)', () => {
  const css = doc('src/index.css')
  const tok = doc('src/styles/tokens.css')
  const iToi = tok.indexOf('prefers-color-scheme: dark')
  const doc2 = (khoi: string) => Object.fromEntries([...khoi.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)].map((m) => [m[1]!, m[2]!]))
  const SANG = doc2(tok.slice(0, iToi))
  const TOI = doc2(tok.slice(iToi))
  it('nhãn LỜI GIẢI / Kiến thức cốt lõi (--lg-nhan) ≥ 4,5:1 trên nền khối (--the-2) và nền ô chốt (--the), sáng + tối', () => {
    for (const [ten, bang] of [['sáng', SANG], ['tối', { ...SANG, ...TOI }]] as const) {
      expect(tuongPhan(bang['lg-nhan']!, bang['the-2']!), `${ten} trên --the-2`).toBeGreaterThanOrEqual(4.5)
      expect(tuongPhan(bang['lg-nhan']!, bang['the']!), `${ten} trên --the`).toBeGreaterThanOrEqual(4.5)
      expect(tuongPhan(bang['muc']!, bang['the-2']!), `${ten} chữ thân`).toBeGreaterThanOrEqual(4.5)
    }
  })
  it('khối .loi-giai: nền trung tính, bo 16, KHÔNG viền trái cong; ô chốt hết khoảng thừa dưới cùng; chữ thân ≥ 15px', () => {
    const kh = css.match(/\.loi-giai \{[^}]*\}/)![0]
    expect(kh).toMatch(/background:\s*var\(--the-2\)/)
    expect(kh).toMatch(/border:\s*0/)
    expect(kh).not.toMatch(/border-left/)
    expect(kh).toMatch(/border-radius:\s*var\(--bo-3\)/)
    expect(css).toMatch(/\.lg-chot:last-child\s*\{\s*margin-bottom:\s*0/)
    expect(css).toMatch(/\.lg-chu \{[^}]*var\(--cx-2\)/) // 15px
    expect(css).toMatch(/\.loi-giai-nhan-nho \{[^}]*color:\s*var\(--lg-nhan\)/)
  })
  it('dưới .m3 vẫn đè màu M3 (dao2-cot-loi-2709 khoá thêm)', () => {
    const m3 = doc('src/components/m3/the-cau.css')
    expect(m3).toMatch(/\.m3 \.loi-giai-nhan-nho\s*\{\s*color:\s*var\(--m3-primary\)/)
    expect(m3).toMatch(/\.m3 \.lg-chot\s*\{\s*border-left-color:\s*var\(--m3-primary\)/)
  })
})
