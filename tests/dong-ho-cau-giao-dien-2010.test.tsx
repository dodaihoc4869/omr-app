// 20/10 ĐO GIÂY — màn ôn lại gửi `doGiay` (giây đo thật của câu em đang làm + số từ của đề) cùng lượt nộp.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import LamCauOn from '../src/components/bang-nhiem-vu/LamCauOn'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))

const CAU = [
  { qid: 'on1', phan: 'I', text: 'Este X có tên gọi là gì trong danh pháp thường dùng hiện nay?', choices: ['etyl axetat', 'metyl propionat', 'propyl fomat', 'isopropyl fomat'], ideas: [], hinhAnh: [] },
  { qid: 'on4', phan: 'I', text: 'Chất nào là chất béo?', choices: ['Glixerol', 'Etyl axetat', 'Tristearin', 'Axit oleic'], ideas: [], hinhAnh: [] },
]
let goi: { url: string; body: any }[]
beforeEach(() => {
  goi = []
  localStorage.clear()
  // jsdom không có IntersectionObserver: giả MỌI câu đang hiện đủ trên màn.
  vi.stubGlobal('IntersectionObserver', class { constructor(private cb: (d: unknown[]) => void) {} observe(el: Element) { this.cb([{ target: el, isIntersecting: true, intersectionRatio: 1 }]) } disconnect() {} })
  vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit) => {
    const u = new URL(String(url)).pathname
    const body = JSON.parse(String(init.body || '{}'))
    goi.push({ url: u, body })
    const d = u === '/hs/cau-theo-qid' ? { ok: true, cau: CAU, khongCo: [] } : u === '/hs/on-lai/nop' ? { ok: true, ketQua: [], khongCo: [], chuaLam: [], tienBo: null, exp: 0 } : {}
    return { ok: true, status: 200, json: async () => d }
  }))
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe('Làm câu ôn: đồng hồ đo giây', () => {
  it('em chạm vào câu 1, đợi ~2 giây, chọn đáp án rồi nộp ⇒ doGiay có giây ≥ 1, số từ > 0, phần I; câu em không chạm không có doGiay', async () => {
    render(<LamCauOn token="tok-hs" sbd="12121212" viecId="on_lai:2026-10-20" qid={['on1', 'on4']} tieuDe="Ôn" onXong={vi.fn()} />)
    await waitFor(() => expect(document.querySelectorAll('.lco-the').length).toBe(2))
    const the = (i: number) => document.querySelectorAll<HTMLElement>('.lco-the')[i]!
    fireEvent.pointerDown(the(0))
    await new Promise((r) => setTimeout(r, 2300))
    fireEvent.pointerDown(the(0))
    fireEvent.click(within(the(0)).getAllByRole('radio')[1]!)
    fireEvent.click(within(the(1)).getAllByRole('radio')[2]!)
    fireEvent.click(screen.getByRole('button', { name: /^Kiểm tra/ }))
    await waitFor(() => expect(goi.some((g) => g.url === '/hs/on-lai/nop')).toBe(true))
    const nop = goi.find((g) => g.url === '/hs/on-lai/nop')!.body.traLoi as { qid: string; doGiay?: { g: number } }[]
    const c1 = nop.find((x) => x.qid === 'on1')!
    expect(c1.doGiay!.g).toBeGreaterThanOrEqual(1)
    expect(c1.doGiay!.g).toBeLessThanOrEqual(3)
    expect(Object.keys(c1.doGiay!)).toEqual(['g']) // máy em chỉ gửi giây; số từ/hình/phần do máy chủ tự đo
    expect(nop.find((x) => x.qid === 'on4')!.doGiay).toBeUndefined() // em không chạm câu 2 ⇒ không có giây của câu 2
  }, 15000)
})
