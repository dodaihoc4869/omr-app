// Bình Phản Ứng — máy em, thầy 10/11: «bỏ nút gửi đáp án hiện lên trên 4 giây đi, chuyển nút gửi đáp án sang mép phải giữa màn hình, khi học sinh chọn hết
// thì tự bật ra, còn chưa chọn hết thì ẩn đi. thiết kế đẹp tinh tế.»
// Nút gửi NỔI (`.bpu-gui-noi`, mép phải, giữa màn): chưa chọn đủ ⇒ ẩn (vẫn trong cây để trượt, nhưng aria-hidden + inert + disabled); đủ ⇒ bật; bỏ bớt ⇒ thu lại.
import { act, render, screen, waitFor, within } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { moLuot, taoPhong, viewEm } from '../src/lib/bpu/phong'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-chu' }))

class WsGia { static ds: WsGia[] = []; readyState = 1; gui: string[] = []; onopen?: () => void; onmessage?: (e: { data: string }) => void; onclose?: () => void; onerror?: () => void
  constructor(public url: string) { WsGia.ds.push(this); setTimeout(() => this.onopen?.(), 0) }
  send(d: string) { this.gui.push(d) } close() {} nhan(v: unknown) { act(() => { this.onmessage?.({ data: JSON.stringify(v) }) }) } }

const T0 = Date.now()
const phong = () => taoPhong({ buoiId: 'b1', lop: '12A1', nay: T0, ds: [{ sbd: 'S1', ten: 'Nguyễn Minh Anh', coMat: true, luc: T0 }, { sbd: 'S2', ten: 'Trần Gia Bảo', coMat: true, luc: T0 }] })
const goc = { qid: 'q1', maDe: 'm', phan: 'I', text: 'Chất nào là amine bậc hai?', choices: ['CH3NH2', 'CH3NHCH3', '(CH3)3N', 'C6H5NH2'], ideas: [], hinhAnh: [], kienThuc: [] }
const tn = { qid: 'q1', phan: 'I' as const, tuLuan: false, cau: goc, dung: 'B', hanGiay: 60 }
const ds = { qid: 'q2', phan: 'II' as const, tuLuan: false, cau: { ...goc, qid: 'q2', phan: 'II', choices: [], ideas: ['Ý một', 'Ý hai', 'Ý ba', 'Ý bốn'] }, dung: 'DSSD', hanGiay: 60 }
const tln = { qid: 'q3', phan: 'III' as const, tuLuan: false, cau: { ...goc, qid: 'q3', phan: 'III', choices: [] }, dung: '12', hanGiay: 60 }
const tl = { qid: 'q4', phan: 'III' as const, tuLuan: true, cau: { ...goc, qid: 'q4', phan: 'III', choices: [] }, dung: '', hanGiay: 0 }

beforeEach(() => { WsGia.ds = []; vi.stubGlobal('WebSocket', WsGia); vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ ok: true, ve: 've-em', buoiId: 'b1' })))) })
afterEach(() => { vi.unstubAllGlobals() })

async function vao(cau: Parameters<typeof moLuot>[1], luc = T0) {
  const { default: Man } = await import('../src/components/bpu/ManBinhPhanUng')
  render(<Man token="tok" buoiId="b1" onDong={() => {}} />)
  await waitFor(() => expect(WsGia.ds.length).toBe(1))
  const ws = WsGia.ds[0]!
  const st = phong(); moLuot(st, cau, luc); ws.nhan(viewEm(st, 'S1'))
  await waitFor(() => expect(document.querySelector('.bpu-gui-noi')).toBeTruthy(), { timeout: 5000 })
  return { ws, st }
}
const nut = () => document.querySelector<HTMLButtonElement>('.bpu-gui-noi')!
const an = () => {
  expect(screen.queryByRole('button', { name: 'Gửi đáp án' })).toBeNull()
  const b = nut()
  expect(b.getAttribute('data-hien')).toBe('false')
  expect(b.getAttribute('aria-hidden')).toBe('true')
  expect(b.hasAttribute('inert')).toBe(true)
  expect(b.disabled).toBe(true)
}
const bat = () => {
  const b = screen.getByRole('button', { name: 'Gửi đáp án' })
  expect(b).toBe(nut())
  expect(b.getAttribute('data-hien')).toBe('true')
  expect(b.hasAttribute('inert')).toBe(false)
  expect((b as HTMLButtonElement).disabled).toBe(false)
  return b
}
const daGui = (ws: WsGia) => ws.gui.map((x) => JSON.parse(x) as { t: string; chon?: string }).filter((x) => x.t === 'tra')

describe('nút gửi nổi — ẩn khi chưa đủ, tự bật khi đủ, gửi được', () => {
  it('trắc nghiệm: chưa chọn ⇒ ẩn (không thanh dưới); chọn ⇒ bật + quầng sáng; gửi ⇒ `tra` + che, nút thu vào', async () => {
    const { ws } = await vao(tn)
    an()
    expect(document.querySelector('.bpu-hs-day')).toBeNull() // bỏ thanh dưới chứa nút gửi
    expect(document.querySelector('.bpu-hs')!.classList.contains('co-gui')).toBe(true) // thân màn chừa lề phải ngay từ đầu (không chạy dòng khi bật)
    expect(nut().classList.contains('quang')).toBe(false)
    const pa = await screen.findAllByRole('radio', {}, { timeout: 5000 })
    act(() => { pa[1]!.click() })
    const b = bat()
    expect(b.classList.contains('quang')).toBe(true)
    expect(b.textContent).toBe('Gửi')
    act(() => { b.click() })
    expect(daGui(ws)).toEqual([{ t: 'tra', chon: 'B' }])
    expect(document.querySelector('.bpu-che')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Gửi đáp án' })).toBeNull() // đang bay: nút thu vào mép, không bấm lại được
    act(() => { nut()?.click() })
    expect(daGui(ws)).toHaveLength(1)
  })
  it('đúng–sai: 3/4 ý ⇒ ẩn; đủ 4 ý ⇒ bật; gửi đúng chuỗi 4 ý', async () => {
    const { ws } = await vao(ds)
    const chonY = (chu: string, v: RegExp) => act(() => { within(screen.getByRole('group', { name: `Chọn cho ý ${chu}` })).getByRole('button', { name: v }).click() })
    await screen.findByRole('group', { name: 'Chọn cho ý a' }, { timeout: 5000 })
    chonY('a', /Đúng/); chonY('b', /Sai/); chonY('c', /Sai/)
    an()
    chonY('d', /Đúng/)
    act(() => { bat().click() })
    expect(daGui(ws)).toEqual([{ t: 'tra', chon: 'DSSD' }])
  })
  it('trả lời ngắn: ô trống / chỉ dấu trừ ⇒ ẩn; có số ⇒ bật; xoá hết ⇒ thu lại; gửi đúng số', async () => {
    const { ws } = await vao(tln)
    const phim = (p: string) => act(() => { screen.getByRole('button', { name: p }).click() })
    await screen.findByRole('button', { name: '1' }, { timeout: 5000 })
    an()
    phim('Đổi dấu'); an() // chỉ «−» vẫn là ô trống
    phim('Đổi dấu'); phim('1'); bat()
    phim('Xoá'); an() // bỏ bớt ⇒ thu lại vào mép
    expect(nut().classList.contains('quang')).toBe(true) // quầng chỉ một lần mỗi lượt (lớp giữ nguyên ⇒ bật lại không nháy nữa)
    phim('1'); phim('2')
    act(() => { bat().click() })
    expect(daGui(ws)).toEqual([{ t: 'tra', chon: '12' }])
  })
  it('tự luận: nút nổi «Xong» luôn bật (không có gì để chọn), gửi `xong`', async () => {
    const { ws } = await vao(tl)
    const b = screen.getByRole('button', { name: 'Em làm xong' })
    expect(b.getAttribute('data-hien')).toBe('true')
    expect(b.textContent).toBe('Xong')
    act(() => { b.click() })
    expect(daGui(ws)).toEqual([{ t: 'tra', chon: 'xong' }])
  })
  it('hết giờ ⇒ không có nút gửi, dòng báo ở thanh dưới', async () => {
    const { default: Man } = await import('../src/components/bpu/ManBinhPhanUng')
    render(<Man token="tok" buoiId="b1" onDong={() => {}} />)
    await waitFor(() => expect(WsGia.ds.length).toBe(1))
    const st = phong(); moLuot(st, tn, Date.now() - 120_000); WsGia.ds[0]!.nhan(viewEm(st, 'S1'))
    expect(await screen.findByText(/Hết giờ — câu này để trống/)).toBeTruthy()
    expect(document.querySelector('.bpu-gui-noi')).toBeNull()
    expect(document.querySelector('.bpu-hs')!.classList.contains('co-gui')).toBe(false)
  })
})

describe('nút gửi nổi — CSS', () => {
  const css = readFileSync('src/components/bpu/bpu-hs.css', 'utf8')
  const luat = (sel: string) => { const i = css.indexOf(`${sel} {`); expect(i).toBeGreaterThan(-1); return css.slice(i, css.indexOf('}', i)) }
  it('mép phải, giữa chiều cao, vùng chạm ≥ 56 px, màu đội; ẩn = ngoài mép + mờ + không chạm; chỉ transform / opacity', () => {
    const g = luat('.bpu-gui-noi')
    expect(g).toMatch(/position: fixed/)
    expect(g).toMatch(/top: 50%/)
    expect(g).toMatch(/right: max\(12px, env\(safe-area-inset-right, 0px\)\)/)
    expect(g).toMatch(/width: 56px/)
    expect(luat('.bpu-hs .bpu-gui-noi')).toMatch(/min-height: 84px/)
    expect(g).toMatch(/background: var\(--doi\)/)
    expect(g).toMatch(/opacity: 0; pointer-events: none/)
    expect(g).toMatch(/transition: transform [^;]*, opacity [^;]*;/)
    expect(luat('.bpu-gui-noi[data-hien="true"]')).toMatch(/transform: translate\(0, -50%\); opacity: 1; pointer-events: auto/)
    expect(css).toMatch(/@keyframes bpu-gui-noi-quang \{ from \{ transform: [^}]*opacity[^}]*\} to \{ transform: [^}]*opacity[^}]*\} \}/)
    expect(luat('.bpu-gui-noi.quang::after')).toMatch(/animation: bpu-gui-noi-quang [^;]* 2;/) // nhịp đúng 2 lần, không lặp mãi
  })
  it('máy yếu / giảm chuyển động ⇒ hiện / ẩn tức thì; thân màn chừa lề phải cho nút; không còn nâng thanh dưới', () => {
    expect(css).toMatch(/prefers-reduced-motion: reduce\) \{ \.bpu-gui-noi, \.bpu-gui-noi\[data-hien="true"\] \{ transition: none; \} \.bpu-gui-noi\.quang::after \{ animation: none; \} \}/)
    expect(css).toMatch(/html\.may-yeu \.bpu-gui-noi, html\.may-yeu \.bpu-gui-noi\[data-hien="true"\] \{ transition: none; \}/)
    expect(css).toMatch(/html\.may-yeu \.bpu-gui-noi\.quang::after \{ animation: none; \}/)
    expect(luat('.bpu-hs.co-gui .bpu-hs-than')).toMatch(/padding-right: calc\(max\(12px, env\(safe-area-inset-right, 0px\)\) - env\(safe-area-inset-right, 0px\) \+ 64px\)/)
    expect(css).not.toMatch(/nang-day/)
  })
})
