// @vitest-environment jsdom
// VIÊN ĐẾM NỔI MÉP TRÁI (thầy chốt bản vẽ P2 27/10): bỏ thanh đếm ngang trên cùng; 4 viên (vòng mục tiêu · lửa · nguyên tử · tinh thể) nổi mép trái.
//  - số dài rút gọn trên viên («12,3k»), số ĐẦY ĐỦ ở nhãn + thẻ bật khi chạm; thẻ có nút mở đúng màn; Esc đóng, trả focus;
//  - không truyền `vien` ⇒ y cũ (bấm là mở màn) — test thanh trên cũ vẫn giữ;
//  - mã: header viên vẽ bằng portal (ngoài khung .tt-vao-muc), thu khi EM cuộn, chừa lề trái, ẩn khi Lộ trình nằm dưới [inert] (màn làm câu), giảm chuyển động.
import { readFileSync } from 'node:fs'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-chu.test', ghiDiaChiDaDung: () => {} }))

import * as M from './_thuong-mau'
import { DUONG, _quenTam, docTongQuan, ghiTam, khoaTam } from '../src/lib/thuong-api'
import { ThanhThuong } from '../src/components/thuong/ThanhThuong'
import { soGon } from '../src/lib/so-gon'

const TK = 'tk-em'
function datTam(tq: Record<string, unknown>) {
  _quenTam()
  try { localStorage.clear() } catch { /* bỏ qua */ }
  const d = docTongQuan(tq)
  if (d) ghiTam(khoaTam(DUONG.tongQuan, TK), d)
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(tq), { status: 200, headers: { 'content-type': 'application/json' } })))
}
beforeEach(() => datTam(M.tongQuanGia()))
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe('số gọn trên viên', () => {
  it('≤ 9.999 giữ nguyên; từ 10.000 ⇒ «12,3k»; từ 1 triệu ⇒ «1,2tr»', () => {
    expect([0, 7, 245, 999, 1250, 9999].map(soGon)).toEqual(['0', '7', '245', '999', '1.250', '9.999'])
    expect([10000, 12345, 99949, 123456, 999949].map(soGon)).toEqual(['10k', '12,3k', '99,9k', '123,5k', '999,9k'])
    expect([999950, 1234567].map(soGon)).toEqual(['1tr', '1,2tr'])
    expect(soGon(Number.NaN)).toBe('0')
  })
})

describe('ThanhThuong vien', () => {
  it('số lớn rút gọn trên viên, nhãn + thẻ bật ghi đủ; nút thẻ mở đúng màn; vòng mục tiêu nhãn gọn «3/4»', async () => {
    datTam(M.tongQuanGia({ tinhThe: 12345 }))
    const mo = vi.fn()
    const c = render(<ThanhThuong token={TK} onMo={mo} thongBao={false} vien="noi" />).container
    await waitFor(() => expect(c.querySelector('[data-k="tt"] .tp-so')?.textContent).toBe('12,3k'))
    expect(c.querySelector('.tp-tr-muc em')?.textContent).toBe('3/4')
    const vienTt = screen.getByRole('button', { name: '12345 tinh thể' })
    fireEvent.click(vienTt)
    expect(mo).not.toHaveBeenCalled() // chạm viên ⇒ thẻ bật, chưa mở màn
    const the = screen.getByRole('dialog', { name: '12.345 tinh thể' })
    expect(vienTt.getAttribute('aria-expanded')).toBe('true')
    expect(vienTt.getAttribute('aria-controls')).toBe(the.id)
    fireEvent.click(screen.getByRole('button', { name: 'Mở cửa hàng' }))
    expect(mo).toHaveBeenCalledWith('cua-hang')
    expect(screen.queryByRole('dialog')).toBeNull()
  })
  it('thẻ lửa / mục tiêu đúng chữ; Esc đóng và trả focus về viên; chạm lại viên ⇒ đóng', async () => {
    const mo = vi.fn()
    render(<ThanhThuong token={TK} onMo={mo} thongBao={false} vien="noi" />)
    const lua = await screen.findByRole('button', { name: 'Chuỗi 12 ngày' })
    fireEvent.click(lua)
    expect(screen.getByRole('dialog', { name: 'Chuỗi 12 ngày' }).textContent).toMatch(/giữ chuỗi/)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(lua)
    const muc = screen.getByRole('button', { name: /^Mục tiêu hôm nay/ })
    fireEvent.click(muc)
    expect(screen.getByRole('dialog', { name: 'Mục tiêu hôm nay: 4 chặng' }).textContent).toMatch(/Đã làm 3\/4 chặng/)
    fireEvent.click(muc)
    expect(screen.queryByRole('dialog')).toBeNull()
  })
  it('trong thanh menu máy tính: vòng mục tiêu ghi đủ chữ', async () => {
    const c = render(<ThanhThuong token={TK} onMo={() => {}} thongBao={false} vien="menu" />).container
    await waitFor(() => expect(c.querySelector('.tp-tr-muc em')?.textContent).toBe('Mục tiêu hôm nay3/4 chặng'))
  })
  it('không truyền vien ⇒ y cũ: số đủ, bấm là mở màn', async () => {
    datTam(M.tongQuanGia({ tinhThe: 12345 }))
    const mo = vi.fn()
    const c = render(<ThanhThuong token={TK} onMo={mo} thongBao={false} />).container
    await waitFor(() => expect(c.querySelector('[data-k="tt"] .tp-so')?.textContent).toBe('12.345'))
    fireEvent.click(screen.getByRole('button', { name: '12345 tinh thể' }))
    expect(mo).toHaveBeenCalledWith('cua-hang')
  })
})

describe('mã nguồn: viên nổi thay thanh trên', () => {
  const ts = readFileSync('src/components/hoc-tap/TrongHs.tsx', 'utf8')
  const css = readFileSync('src/styles/trong-hs.css', 'utf8')
  it('portal header data-vien; máy tính ⇒ ô #tr-menu-dem trong menu; thu khi em cuộn', () => {
    expect(ts).toMatch(/createPortal\(<header className="da-tren" data-vien="" data-thu=\{thuVien \|\| undefined\}/)
    expect(ts).toMatch(/<div id="tr-menu-dem" className="tr-menu-dem" \/>/)
    expect(ts).toMatch(/MQ_MAY_TINH = '\(min-width: 1024px\) and \(min-height: 600px\)'/)
    expect(ts).toMatch(/performance\.now\(\) - tay < 800/)
  })
  it('CSS: viên cách mép 8 px, chỉ biến màu --tr-*, lề trái 60 px, ẩn dưới [inert], giảm chuyển động, thu chỉ transform / opacity', () => {
    const khoi = css.slice(css.indexOf('/* ── VIÊN ĐẾM NỔI MÉP TRÁI'))
    expect(khoi).toMatch(/left: calc\(8px \+ env\(safe-area-inset-left\)\)/)
    expect(khoi).toMatch(/padding-left: calc\(60px \+ env\(safe-area-inset-left\)\)/)
    expect(khoi).toMatch(/body:has\(\[inert\] \.dm-khung\[data-vien\]\) > \.da-tren\[data-vien\] \{ display: none; \}/)
    expect(khoi).toMatch(/prefers-reduced-motion: reduce/)
    expect(khoi).not.toMatch(/#[0-9a-f]{3,8}\b/i)
    expect(khoi).not.toMatch(/transition: all/)
    for (const m of khoi.match(/transition: [^;]+/g) ?? []) expect(m).toMatch(/^transition: (none|(transform|opacity) [^,]+)$/)
  })
})
