// @vitest-environment jsdom
// Giãn ý đề trên DOM thật của DeCau (màn làm chặng Duo · sửa câu Duo · KTCN kiểu Duo dùng chung): đoạn khối, phương trình thành khối riêng,
// câu hỏi tách riêng; «Câu N.» vẫn là <b> con đầu của <p> (Duo ẩn bằng `> b:first-child`); chạm-hiểu-đề dò TỪNG đoạn (data-gyc-khoi).
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DeCau } from '../src/components/hoc-tap/LamCau'
import { chuCuaGoc } from '../src/components/goi-y-cham/boc-chu'
import type { Question } from '../src/game/than-thu-v2/core'
import { DE_ANILINE } from './fixtures/de-aniline-2710'

const cau = (text: string): Question => ({ qid: 'Q1', maDe: 'D', version: '1', group: 'g', phan: 'I', text, choices: ['1', '2', '3', '4'], ideas: [], hinhAnh: [], dang: null, tenDang: '', mucDo: null, sao: null, kienThuc: [] })

describe('DeCau giãn ý', () => {
  it('đề aniline: 7 đoạn, 1 khối phương trình, câu hỏi riêng', () => {
    const { container } = render(<DeCau q={cau(DE_ANILINE)} stt={1} />)
    const p = container.querySelector('.ht2-lam-de-chu.de-gian')!
    expect(p).toBeTruthy()
    expect(p.firstElementChild?.tagName).toBe('B')
    expect(p.firstElementChild?.textContent).toBe('Câu 1.')
    const doan = [...p.querySelectorAll(':scope > .de-doan')]
    expect(doan.map((d) => d.getAttribute('data-loai'))).toEqual(['chu', 'chu', 'nhan', 'pt', 'nhan', 'chu', 'hoi'])
    expect(doan[2].querySelector('.de-nhan')?.textContent).toBe('Bước 1:')
    expect(doan[3].textContent).toContain('→')
    expect(doan[6].textContent).toContain('là bao nhiêu lít?')
    // chạm-hiểu-đề: «Câu 1.» + 7 đoạn = 8 khối, mỗi khối dò riêng
    expect(chuCuaGoc(container as HTMLElement).length).toBe(8)
  })
  it('đề một đoạn: DOM như cũ (không lớp de-gian)', () => {
    const { container } = render(<DeCau q={cau('Chất nào sau đây là amine bậc II?')} stt={2} />)
    expect(container.querySelector('.de-gian')).toBeNull()
    expect(container.querySelector('.ht2-lam-de-chu')?.textContent).toBe('Câu 2. Chất nào sau đây là amine bậc II?')
  })
})
