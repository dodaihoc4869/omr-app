// @vitest-environment jsdom
// KHE «chạm để hiện giải thích» (chờ thầy duyệt, ruột do phiên Code app 3 thay): VungChamDe trả đề y nguyên (không thêm thẻ DOM),
// TamGiaiThich là tấm trượt từ đáy cùng kiểu tấm kết quả, đóng được; màn làm chặng bọc thân đề và đặt tấm thế chỗ thanh đáy.
import { readFileSync } from 'node:fs'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TamGiaiThich, VungChamDe } from '../src/components/goi-y-cham/VungChamDe'
import type { Question } from '../src/game/than-thu-v2/core'

describe('VungChamDe', () => {
  it('trả lại children nguyên vẹn, không bọc thêm thẻ', () => {
    const { container } = render(<div id="g"><VungChamDe q={{ qid: 'x' } as Question}><p className="de">Đề</p></VungChamDe></div>)
    expect(container.querySelector('#g')!.innerHTML).toBe('<p class="de">Đề</p>')
  })
  it('tấm giải thích: kiểu tấm kết quả (duo-day duo-ket, data-tt=giai), có nút đóng', () => {
    const dong = vi.fn()
    const { container } = render(<TamGiaiThich g={{ tieuDe: 'mol', noiDung: 'Lượng chất' }} onDong={dong} />)
    expect(container.querySelector('section.duo-day.duo-ket[data-tt="giai"]')).not.toBeNull()
    expect(screen.getByRole('dialog', { name: 'mol' }).textContent).toContain('Lượng chất')
    fireEvent.click(screen.getByRole('button', { name: 'Đóng giải thích' }))
    expect(dong).toHaveBeenCalledOnce()
  })
  it('màn làm chặng bọc thân đề và đặt tấm giải thích thế chỗ thanh đáy', () => {
    const s = readFileSync('src/components/hoc-tap/ManLamBaiTap.tsx', 'utf8')
    expect(s).toMatch(/<VungChamDe q=\{q\} onGiaiThich=\{setGiaiThich\}><DeCau q=\{q\} stt=\{stt\} \/><\/VungChamDe>/)
    expect(s).toMatch(/giaiThich && q && !xong \? <TamGiaiThich g=\{giaiThich\}[^\n]*\/> : day\}/)
  })
})
