// @vitest-environment jsdom
// NGĂN «TIN NHẮN LỚP» MÁY EM (thầy duyệt bản vẽ 60–66 ngày 13/11): «hs vuốt từ mép bên phải vào thì hiện luôn khung chat siêu đẹp giống như thiết kế của gv để
// nhắn cho tiện (trên màn hình xoay ngang của đt), trên máy tính bạn tính sao cho tiện nhất».
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { NganChatEm, type ChatLop } from '../src/components/live-khoi/ChatEm'
import type { TinChat } from '../src/lib/live-khoi/chat-loi'

const tin = (o: Partial<TinChat>): TinChat => ({ id: '1-S1', sbd: 'S1', ten: 'Nguyễn Thị Hà', doi: 1, luc: Date.parse('2026-11-13T12:50:00Z'), chu: 'Em hiểu rồi ạ', hoi: false, thay: false, ...o })
function dung(o: Partial<Parameters<typeof NganChatEm>[0]> = {}, khoa = false) {
  const gui = vi.fn(() => 'ok' as const), onDong = vi.fn(), onGhim = vi.fn(), danhDauDoc = vi.fn()
  const chat = { ds: [tin({}), tin({ id: '2-S2', sbd: 'S2', ten: 'Trần Minh Khôi', doi: 2, chu: 'CO2 là gì ạ?', hoi: true }), tin({ id: '3-gv', sbd: 'gv', ten: 'Thầy', doi: -1, chu: 'Carbon dioxide', thay: true })], khoa, moi: 0, tinMoi: null, gui, danhDauDoc } as unknown as ChatLop
  const r = render(<NganChatEm chat={chat} toiSbd="S1" soEm={62} ghim={false} coGhim={false} tieuDiem={0} onDong={onDong} onGhim={onGhim} {...o} />)
  return { ...r, gui, onDong, onGhim, danhDauDoc, ngan: r.container.querySelector<HTMLElement>('.lc-ngan')! }
}

describe('ngăn tin nhắn máy em', () => {
  it('dòng tin hai dòng như cột của thầy; tin của chính em có nhãn «Em»; câu hỏi của bạn có nhãn «Câu hỏi»; ba câu nhắn nhanh bằng chữ, không biểu tượng cảm xúc', () => {
    const { ngan, gui } = dung()
    const d = [...ngan.querySelectorAll<HTMLElement>('.lc-g')]
    expect(d).toHaveLength(3)
    expect(d[0]!.dataset.toi).toBe('true'); expect(d[0]!.querySelector('.lc-g-ten > em')!.textContent).toBe('Em')
    expect(d[1]!.dataset.toi).toBeUndefined(); expect(d[1]!.querySelector('.lc-g-ten > em')!.textContent).toBe('Câu hỏi')
    expect(d[1]!.querySelector('.lc-g-ten > span')!.textContent).toBe('Trần Minh Khôi'); expect(d[1]!.style.getPropertyValue('--lc-doi')).toBe('var(--p-xanh)')
    expect(d[2]!.dataset.thay).toBe('true')
    const nhanh = [...ngan.querySelectorAll('.lc-nhanh button')].map((b) => b.textContent)
    expect(nhanh).toEqual(['Em hiểu rồi ạ', 'Thầy giảng lại ạ', 'Em chưa rõ ạ'])
    expect(nhanh.join('')).not.toMatch(/\p{Extended_Pictographic}/u)
    fireEvent.click(ngan.querySelectorAll('.lc-nhanh button')[2]!)
    expect(gui).toHaveBeenCalledWith('Em chưa rõ ạ')
    expect(ngan.querySelector('.lc-dau-ten')!.textContent).toBe('Tin nhắn lớp62 em')
  })
  it('điện thoại: không có nút ghim, không có dòng phím tắt; ✕ và Esc đóng ngăn; KHÔNG còn tay nắm kéo (thầy 13/11: bỏ vuốt)', () => {
    const { ngan, onDong, getByRole, queryByRole } = dung()
    expect(queryByRole('button', { name: /Ghim/ })).toBeNull(); expect(ngan.querySelector('.lc-phim')).toBeNull(); expect(ngan.querySelector('.lc-ngan-tay')).toBeNull(); expect(ngan.style.transform).toBe('')
    fireEvent.click(getByRole('button', { name: 'Đóng tin nhắn' })); expect(onDong).toHaveBeenCalledTimes(1)
    fireEvent.keyDown(window, { key: 'Escape' }); expect(onDong).toHaveBeenCalledTimes(2)
  })
  it('máy tính đang ghim: lớp cột, không tay nắm, nút «Cất cột»; Esc lúc không gõ để yên cho màn bên dưới, lúc đang gõ thì chỉ rời ô nhập; đổi `tieuDiem` ⇒ con trỏ vào ô nhập', () => {
    const { ngan, onDong, onGhim, getByRole, rerender, danhDauDoc } = dung({ ghim: true, coGhim: true })
    expect(ngan.classList.contains('lc-ghim')).toBe(true); expect(ngan.querySelector('.lc-ngan-tay')).toBeNull(); expect(ngan.querySelector('.lc-phim')!.textContent).toBe('Enter gõ ngay · Esc về bài')
    fireEvent.keyDown(window, { key: 'Escape' }); expect(onDong).not.toHaveBeenCalled()
    const o = ngan.querySelector('input')!
    const chat = { ds: [tin({})], khoa: false, moi: 0, tinMoi: null, gui: vi.fn(), danhDauDoc } as unknown as ChatLop
    rerender(<NganChatEm chat={chat} toiSbd="S1" soEm={62} ghim coGhim tieuDiem={1} onDong={onDong} onGhim={onGhim} />)
    expect(document.activeElement).toBe(o)
    fireEvent.keyDown(window, { key: 'Escape' }); expect(document.activeElement).not.toBe(o); expect(onDong).not.toHaveBeenCalled()
    fireEvent.click(getByRole('button', { name: 'Cất cột tin nhắn' })); expect(onGhim).toHaveBeenCalledWith(false)
  })
  it('máy tính chưa ghim: có nút «Ghim»; thầy tắt nhắn tin ⇒ ô nhập và câu nhắn nhanh khoá, có dòng báo', () => {
    const { getByRole, onGhim, ngan } = dung({ coGhim: true }, true)
    fireEvent.click(getByRole('button', { name: /Ghim tin nhắn/ })); expect(onGhim).toHaveBeenCalledWith(true)
    expect(ngan.querySelector('input')!.disabled).toBe(true); expect([...ngan.querySelectorAll<HTMLButtonElement>('.lc-nhanh button')].every((b) => b.disabled)).toBe(true)
    expect(ngan.querySelector('.lc-bao')!.textContent).toBe('Thầy đang tắt nhắn tin')
  })
  it('CSS: ngăn rộng 44 % (tối đa 380 px) sát mép phải; cột ghim 300 px và màn live co đúng 300 px; bàn phím bật thì ẩn đầu ngăn + câu nhắn nhanh; KHÔNG còn dải vuốt mép phải, thanh vàng không còn báo kéo sang chat', () => {
    const chat = readFileSync('src/components/live-khoi/chat.css', 'utf8'), em = readFileSync('src/components/live-khoi/em-khoi.css', 'utf8'), live = readFileSync('src/components/live/live-em.css', 'utf8')
    expect(chat).toMatch(/\.lc-ngan \{[^}]*right: 0; top: 0; bottom: 0;[^}]*width: min\(380px, 44%\)/)
    expect(chat).toMatch(/\.lc-ngan\.go \.lc-dau, \.lc-ngan\.go \.lc-nhanh, \.lc-ngan\.go \.lc-phim \{ display: none; \}/)
    expect(em).toMatch(/:root\[data-lke-cot\] \{ --lke-cot: 300px; \}/); expect(em).toMatch(/:root\[data-lke-cot\] \.bpu-hs[^{]*\{ right: var\(--lke-cot\); \}/)
    expect(live).not.toMatch(/lv-vuot/); expect(readFileSync('src/components/live/LopLive.tsx', 'utf8')).not.toMatch(/ddh-lk-keo|ddh-lk-tha|keoChat/)
    expect(chat.slice(chat.indexOf('NGĂN «TIN NHẮN LỚP» MÁY EM')) + em.slice(em.indexOf('CỘT TIN NHẮN GHIM'))).not.toMatch(/:has\(/)
  })
})
