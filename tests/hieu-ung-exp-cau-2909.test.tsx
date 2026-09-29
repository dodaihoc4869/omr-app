// HIỆU ỨNG EXP THEO TỪNG CÂU ĐÚNG (luật v4, thầy chốt 29/09/2026): chỉ câu tự làm đúng có khoản EXP câu của máy chủ mới có "+N EXP";
// câu sai / có trợ giúp / đã bấm Hỏi thầy ⇒ không hiệu ứng; máy yếu ⇒ không hạt; giảm chuyển động ⇒ đứng yên.
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { cheDoHieuUng, docAnhThu, expTheoCau, tiLeThanh } from '../src/lib/hieu-ung-exp-cau'
import { SoExpCau, ThanhExpNho } from '../src/components/exp-cau/ExpCau'

afterEach(cleanup)

describe('expTheoCau — câu nào được "+N EXP"', () => {
  const ketQua = [{ qid: 'A', dung: true }, { qid: 'B', dung: false }, { qid: 'C', dung: true }, { qid: 'D', dung: true }]
  const expNhan = [
    { loai: 'cau', qid: 'A', exp: 5, ghiChu: 'x' },
    { loai: 'cau', qid: 'B', exp: 3, ghiChu: 'x' }, // câu sai: máy chủ không bao giờ trả, nhưng nếu có cũng không hiện
    { loai: 'cau', qid: 'C', exp: 2, ghiChu: 'x' },
    { loai: 'len_bac', qid: 'D', exp: 6, ghiChu: 'x' }, // không phải EXP câu
    { loai: 'dat_ngay', exp: 80, ghiChu: 'x' },
  ]
  it('chỉ câu ĐÚNG có khoản `cau` mang đúng qid; câu đã bấm Hỏi thầy bị loại', () => {
    expect(expTheoCau(ketQua, expNhan)).toEqual({ A: 5, C: 2 })
    expect(expTheoCau(ketQua, expNhan, new Set(['C']))).toEqual({ A: 5 })
    expect(expTheoCau(undefined, expNhan)).toEqual({})
    expect(expTheoCau(ketQua, [{ loai: 'cau', exp: 4, ghiChu: 'x' }])).toEqual({}) // máy chủ cũ không gửi qid ⇒ không hiệu ứng
  })
  it('mức hiệu ứng: giảm chuyển động ⇒ tĩnh; máy yếu ⇒ gọn; còn lại đầy đủ', () => {
    expect(cheDoHieuUng({ giamChuyenDong: true, mayYeu: true })).toBe('tinh')
    expect(cheDoHieuUng({ giamChuyenDong: false, mayYeu: true })).toBe('gon')
    expect(cheDoHieuUng({ giamChuyenDong: false, mayYeu: false })).toBe('day-du')
  })
  it('docAnhThu đọc chặt; thiếu/sai ⇒ null', () => {
    expect(docAnhThu({ cap: 3, exp: 40, thanh: 510, soCapLen: 2, choMoc: 0 })).toEqual({ cap: 3, exp: 40, thanh: 510, soCapLen: 2, choMoc: 0 })
    expect(docAnhThu({ cap: 0, exp: 1, thanh: 2 })).toBeNull()
    expect(docAnhThu(null)).toBeNull()
    expect(tiLeThanh({ exp: 255, thanh: 510 })).toBe(0.5)
    expect(tiLeThanh({ exp: 0, thanh: 0 })).toBe(1)
  })
})

describe('SoExpCau / ThanhExpNho', () => {
  it('đầy đủ: số + 3 hạt; gọn (máy yếu): không hạt; tĩnh: không hạt; exp 0 ⇒ không vẽ', () => {
    const a = render(<SoExpCau exp={5} cheDo="day-du" />)
    expect(a.container.textContent).toBe('+5 EXP')
    expect(a.container.querySelectorAll('.exp-cau-hat')).toHaveLength(3)
    cleanup()
    expect(render(<SoExpCau exp={5} cheDo="gon" />).container.querySelectorAll('.exp-cau-hat')).toHaveLength(0)
    cleanup()
    expect(render(<SoExpCau exp={5} cheDo="tinh" />).container.querySelector('[data-che-do="tinh"]')).not.toBeNull()
    cleanup()
    expect(render(<SoExpCau exp={0} cheDo="day-du" />).container.textContent).toBe('')
  })
  it('thanh có nhãn + số; lên cấp ⇒ "Lên cấp N!"; đang chờ mốc ⇒ nói EXP được giữ', () => {
    const r = render(<ThanhExpNho thu={{ cap: 10, exp: 100, thanh: 2990, soCapLen: 1, choMoc: 0 }} cheDo="tinh" />)
    expect(r.container.textContent).toContain('Thần thú cấp 10 · 100 / 2.990 EXP')
    expect(r.container.textContent).toContain('Lên cấp 10!')
    expect(r.container.querySelector('[role="progressbar"]')!.getAttribute('aria-valuenow')).toBe('100')
    cleanup()
    const cho = render(<ThanhExpNho thu={{ cap: 9, exp: 2929, thanh: 2930, soCapLen: 0, choMoc: 500 }} cheDo="gon" />)
    expect(cho.container.textContent).toContain('500 EXP đang được giữ, vào thần thú khi em đạt nhiệm vụ ngày đủ 21 ngày.')
  })
  it('CSS: tôn trọng giảm chuyển động và máy yếu; không mã màu thô', () => {
    const css = readFileSync('src/components/exp-cau/exp-cau.css', 'utf8')
    expect(css).toMatch(/prefers-reduced-motion: reduce/)
    expect(css).toMatch(/\.may-yeu \.exp-cau-hat \{ display: none; \}/)
    expect(css.replace(/\/\*[\s\S]*?\*\//g, '')).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
  })
})
