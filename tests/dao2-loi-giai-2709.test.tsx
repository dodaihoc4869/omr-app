// SỬA CÓ CHỦ ĐÍCH 14/10: game đã ngừng; giữ hợp đồng lời giải qua propsTheCau đang dùng ở Câu đã làm.
// GAME HÓA 2.0 · SAU KHI CHỐT: lời giải BẮT BUỘC dùng khối LỜI GIẢI chuẩn của TheCau (chế độ `xem_lai`) đọc bằng `chuanHoaLoiGiaiCau`:
// LỜI GIẢI → KIẾN THỨC CỐT LÕI → từng phương án/ý ✓ ✗ kèm lý do (Phần III: bước + kết quả). Không tự vẽ khối lời giải thứ hai.
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { createElement } from 'react'
import TheCau, { type TheCauProps } from '../src/components/TheCau'
import { loiGiaiChoTheCau, propsTheCau } from '../src/components/hoa2/cau-chuyen'
import type { ChiTietCau } from '../src/components/hoa2/api'
import type { Question } from '../src/game/than-thu-v2/core'

const soi = vi.hoisted(() => ({ goi: [] as TheCauProps[] }))
vi.mock('../src/components/TheCau', async (goc) => {
  const m = await goc<typeof import('../src/components/TheCau')>()
  return { ...m, default: (p: TheCauProps) => { soi.goi.push(p); return createElement(m.default, p) } }
})

beforeEach(() => { soi.goi.length = 0 })
afterEach(cleanup)
const cauI: Question = { qid: 'q1', maDe: 'DE', version: '1', group: 'g1', phan: 'I', text: 'Công thức của tristearin là', choices: ['(C17H35COO)3C3H5', '(C17H33COO)3C3H5', '(C15H31COO)3C3H5', '(C17H31COO)3C3H5'], ideas: [], hinhAnh: [], dang: 'D', tenDang: 'Chất béo', mucDo: 'biet', sao: 1, kienThuc: [], vai: 'moi' }
const LG_I = { chot: 'Chất béo là triester của glycerol với acid béo.', tung_pa: { A: { dung: true, vi_sao: 'Gốc stearate C17H35COO–.' }, B: { dung: false, vi_sao: 'Đây là triolein.' }, C: { dung: false, vi_sao: 'Đây là tripalmitin.' }, D: { dung: false, vi_sao: 'Đây là trilinolein.' } } }
describe('Khối lời giải sau khi chốt = TheCau xem_lai', () => {
  it('Phần I: TheCau nhận cheDo xem_lai + đáp án máy chủ + đáp án em gửi; khối LỜI GIẢI → KIẾN THỨC CỐT LÕI → 4 dòng ✓ ✗ kèm lý do', () => {
    const { container } = render(<TheCau {...propsTheCau({ de: cauI, dapAn: 'A', emTraLoi: 'B', loiGiai: LG_I } as ChiTietCau, 2)} />)
    expect(soi.goi.length).toBeGreaterThan(0)
    const p = soi.goi.at(-1)! as Extract<TheCauProps, { phan: 'I' }>
    expect(p.cheDo).toBe('xem_lai'); expect(p.phan).toBe('I'); expect(p.correct).toBe('A'); expect(p.selected).toBe('B')
    expect(p.loiGiai?.chot).toBe(LG_I.chot); expect(p.loiGiai?.tungPa?.B?.viSao).toBe('Đây là triolein.')
    // thứ tự khối chuẩn
    const lg = container.querySelector('.loi-giai') as HTMLElement
    expect(lg.querySelector('.lg-nhan')?.textContent).toBe('LỜI GIẢI')
    expect(lg.querySelector('.lg-chot .loi-giai-nhan-nho')?.textContent).toBe('Kiến thức cốt lõi')
    const dong = [...lg.querySelectorAll('.lg-y')]
    expect(dong.map(d => d.querySelector('.lg-dau')?.textContent)).toEqual(['✓', '✗', '✗', '✗'])
    expect(dong.map(d => d.querySelector('.lg-ma')?.textContent)).toEqual(['A.', 'B.', 'C.', 'D.'])
    expect(dong[1]!.textContent).toContain('triolein')
    // phương án: A đúng (✓), B em chọn sai (✗)
    expect(container.querySelector('.pa-hang[data-trang-thai="dung"]')?.textContent).toContain('A.')
    expect(container.querySelector('.pa-hang[data-trang-thai="sai"]')?.textContent).toContain('B.')
    // đầu thẻ theo bản vẽ + khung M3
  })

  it('Phần II: ý a–d ✓ ✗ theo đáp án Đ/S của máy chủ; Phần III: bước + kết quả; lời giải là chuỗi JSON vẫn đọc được', () => {
    const cauII: Question = { ...cauI, qid: 'q2', phan: 'II', choices: [], ideas: ['Ý một.', 'Ý hai.', 'Ý ba.', 'Ý bốn.'], vai: 'on_lai' }
    const lgII = JSON.stringify({ chot: 'Tráng bạc cần nhóm –CHO.', tung_y: { a: { dung: true, vi_sao: 'a đúng' }, b: { dung: false, vi_sao: 'b sai' }, c: { dung: true, vi_sao: 'c đúng' }, d: { dung: false, vi_sao: 'd sai' } } })
    const { container, unmount } = render(<TheCau {...propsTheCau({ de: cauII, dapAn: 'DSDS', emTraLoi: 'DDDS', loiGiai: lgII } as ChiTietCau, 3)} />)
    const p = soi.goi.at(-1)! as Extract<TheCauProps, { phan: 'II' }>
    expect(p.cheDo).toBe('xem_lai'); expect(p.correct).toEqual(['D', 'S', 'D', 'S']); expect(p.selected).toEqual(['D', 'D', 'D', 'S'])
    expect([...container.querySelectorAll('.lg-y .lg-ma')].map(x => x.textContent)).toEqual(['a)', 'b)', 'c)', 'd)'])
    expect(container.querySelector('.lg-chot')?.textContent).toContain('Tráng bạc cần nhóm –CHO.')
    unmount()
    const cauIII: Question = { ...cauI, qid: 'q3', phan: 'III', choices: [], vai: 'trum' }
    const { container: c3 } = render(<TheCau {...propsTheCau({ de: cauIII, dapAn: '8,2', emTraLoi: '8,2', loiGiai: { chot: 'n muối = n ester', buoc: ['n ester = 0,1 mol', 'm muối = 0,1 × 82 = 8,2 gam'], ket_qua: '8,2' } } as ChiTietCau, 6)} />)
    expect([...c3.querySelectorAll('.lg-buoc li')].length).toBe(2)
    expect(c3.querySelector('.lg-ket-qua')?.textContent).toContain('8,2')
  })

  it('kho chưa có lời giải ⇒ TheCau tự nói thật (không dựng chữ thay); loiGiaiChoTheCau không bịa lý do', () => {
    const { container } = render(<TheCau {...propsTheCau({ de: cauI, dapAn: 'A', emTraLoi: 'B', loiGiai: null } as ChiTietCau, 1)} />)
    expect(container.querySelector('.loi-giai')?.textContent).toContain('Thầy chưa nhập lời giải cho câu này.')
    expect(loiGiaiChoTheCau(null, 'I', 'A')).toBeUndefined()
    expect(loiGiaiChoTheCau({ chot: 'x', tung_pa: { A: { dung: true, vi_sao: 'vì' } } }, 'I', 'A').tungPa).toEqual({ A: { dung: true, viSao: 'vì' } })
  })

})
