// GAME HÓA 2.0 · SAU KHI CHỐT: lời giải BẮT BUỘC dùng khối LỜI GIẢI chuẩn của TheCau (chế độ `xem_lai`) đọc bằng `chuanHoaLoiGiaiCau`:
// LỜI GIẢI → KIẾN THỨC CỐT LÕI → từng phương án/ý ✓ ✗ kèm lý do (Phần III: bước + kết quả). Không tự vẽ khối lời giải thứ hai.
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { createElement } from 'react'
import type { TheCauProps } from '../src/components/TheCau'

const soi = vi.hoisted(() => ({ goi: [] as TheCauProps[] }))
vi.mock('../src/components/TheCau', async (goc) => {
  const m = await goc<typeof import('../src/components/TheCau')>()
  return { ...m, default: (p: TheCauProps) => { soi.goi.push(p); return createElement(m.default, p) } }
})
import { KhoiLoiGiai, DaiKetQua } from '../src/game/than-thu-v2/dao2/TrongAi'
import type { PhanHoi2 } from '../src/game/than-thu-v2/dao2/TrongAi'
import { loiGiaiChoTheCau } from '../src/game/than-thu-v2/dao2/dao2-core'
import type { CauDao2 } from '../src/game/than-thu-v2/dao2/dao2-core'
import type { DaoProfile } from '../src/game/than-thu-v2/dao/kieu'

beforeEach(() => { soi.goi.length = 0 })
afterEach(cleanup)
const hoSo: DaoProfile = { nickname: 'Lửa Nhỏ', pet: 'lua_phuong', choice: false, cap: 7, exp: 0, wallet: 0, mastery: [] }
const cauI: CauDao2 = { qid: 'q1', maDe: 'DE', version: '1', group: 'g1', phan: 'I', text: 'Công thức của tristearin là', choices: ['(C17H35COO)3C3H5', '(C17H33COO)3C3H5', '(C15H31COO)3C3H5', '(C17H31COO)3C3H5'], ideas: [], hinhAnh: [], dang: 'D', tenDang: 'Chất béo', mucDo: 'biet', sao: 1, kienThuc: [], vai: 'moi' }
const LG_I = { chot: 'Chất béo là triester của glycerol với acid béo.', tung_pa: { A: { dung: true, vi_sao: 'Gốc stearate C17H35COO–.' }, B: { dung: false, vi_sao: 'Đây là triolein.' }, C: { dung: false, vi_sao: 'Đây là tripalmitin.' }, D: { dung: false, vi_sao: 'Đây là trilinolein.' } } }
const phanHoi = (them: Partial<PhanHoi2> = {}): PhanHoi2 => ({ correct: false, answer: 'A', traLoi: 'B', solution: LG_I, solutionImages: [], reward: 0, lyDo: { moc: 0, exp: 0, chu: 'Câu này em sẽ gặp lại để ôn.' }, ...them })

describe('Khối lời giải sau khi chốt = TheCau xem_lai', () => {
  it('Phần I: TheCau nhận cheDo xem_lai + đáp án máy chủ + đáp án em gửi; khối LỜI GIẢI → KIẾN THỨC CỐT LÕI → 4 dòng ✓ ✗ kèm lý do', () => {
    const { container } = render(<div className="dao dao2"><KhoiLoiGiai cau={cauI} stt={2} phanHoi={phanHoi()} traLoiMay="B" /></div>)
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
    expect(container.querySelector('.dao2-giai-dau b')?.textContent).toBe('ẢI 2 · CÂU MỚI')
    expect(container.querySelector('.dao2-giai-dau span')?.textContent).toBe('Chất béo · Nhận biết')
    expect(container.querySelector('.dao2-the-giai')?.classList.contains('m3')).toBe(true)
  })

  it('Phần II: ý a–d ✓ ✗ theo đáp án Đ/S của máy chủ; Phần III: bước + kết quả; lời giải là chuỗi JSON vẫn đọc được', () => {
    const cauII: CauDao2 = { ...cauI, qid: 'q2', phan: 'II', choices: [], ideas: ['Ý một.', 'Ý hai.', 'Ý ba.', 'Ý bốn.'], vai: 'on_lai' }
    const lgII = JSON.stringify({ chot: 'Tráng bạc cần nhóm –CHO.', tung_y: { a: { dung: true, vi_sao: 'a đúng' }, b: { dung: false, vi_sao: 'b sai' }, c: { dung: true, vi_sao: 'c đúng' }, d: { dung: false, vi_sao: 'd sai' } } })
    const { container, unmount } = render(<div className="dao dao2"><KhoiLoiGiai cau={cauII} stt={3} phanHoi={phanHoi({ answer: 'DSDS', traLoi: 'DDDS', solution: lgII })} traLoiMay="DDDS" /></div>)
    const p = soi.goi.at(-1)! as Extract<TheCauProps, { phan: 'II' }>
    expect(p.cheDo).toBe('xem_lai'); expect(p.correct).toEqual(['D', 'S', 'D', 'S']); expect(p.selected).toEqual(['D', 'D', 'D', 'S'])
    expect([...container.querySelectorAll('.lg-y .lg-ma')].map(x => x.textContent)).toEqual(['a)', 'b)', 'c)', 'd)'])
    expect(container.querySelector('.lg-chot')?.textContent).toContain('Tráng bạc cần nhóm –CHO.')
    expect(container.querySelector('.dao2-giai-dau b')?.textContent).toBe('ẢI 3 · ÔN LẠI')
    unmount()
    const cauIII: CauDao2 = { ...cauI, qid: 'q3', phan: 'III', choices: [], vai: 'trum' }
    const { container: c3 } = render(<div className="dao dao2"><KhoiLoiGiai cau={cauIII} stt={6} phanHoi={phanHoi({ answer: '8,2', traLoi: '8,2', correct: true, solution: { chot: 'n muối = n ester', buoc: ['n ester = 0,1 mol', 'm muối = 0,1 × 82 = 8,2 gam'], ket_qua: '8,2' } })} traLoiMay="8,2" /></div>)
    expect([...c3.querySelectorAll('.lg-buoc li')].length).toBe(2)
    expect(c3.querySelector('.lg-ket-qua')?.textContent).toContain('8,2')
    expect(c3.querySelector('.dao2-giai-dau b')?.textContent).toBe('ẢI 6 · TRÙM ẢI')
  })

  it('kho chưa có lời giải ⇒ TheCau tự nói thật (không dựng chữ thay); loiGiaiChoTheCau không bịa lý do', () => {
    const { container } = render(<div className="dao dao2"><KhoiLoiGiai cau={cauI} stt={1} phanHoi={phanHoi({ solution: null })} traLoiMay="B" /></div>)
    expect(container.querySelector('.loi-giai')?.textContent).toContain('Thầy chưa nhập lời giải cho câu này.')
    expect(loiGiaiChoTheCau(null, 'I', 'A')).toEqual({ chot: '' })
    expect(loiGiaiChoTheCau({ chot: 'x', tung_pa: { A: { dung: true, vi_sao: 'vì' } } }, 'I', 'A').tungPa).toEqual({ A: { dung: true, viSao: 'vì' } })
  })

  it('dải kết quả: chưa đúng ⇒ "quái phản đòn", câu mới ⇒ "Ô đất vẫn được khai phá"; đúng có thưởng ⇒ "+N EXP" + lời máy chủ', () => {
    const { container, rerender } = render(<div className="dao dao2"><DaiKetQua profile={hoSo} cau={cauI} phanHoi={phanHoi()} ketQua={[{ qid: 'q1', correct: false }]} tong={6} /></div>)
    expect(container.textContent).toMatch(/Chưa đúng · quái phản đòn/); expect(container.textContent).toMatch(/Ô đất vẫn được khai phá/)
    expect(container.querySelector('.dao2-ket-qua-so')?.textContent).toBe('−18')
    rerender(<div className="dao dao2"><DaiKetQua profile={hoSo} cau={cauI} phanHoi={phanHoi({ correct: true, reward: 20, lyDo: { moc: 1, exp: 20, chu: '+20 · Sao thứ nhất của dạng Chất béo' } })} ketQua={[{ qid: 'q1', correct: true }]} tong={6} /></div>)
    expect(container.textContent).toMatch(/Đúng rồi · quái trúng đòn/); expect(container.textContent).toMatch(/\+20 EXP/); expect(container.textContent).toMatch(/Sao thứ nhất của dạng Chất béo/)
    expect(container.textContent).not.toMatch(/Ô đất vẫn/)
  })
})
