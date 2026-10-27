// @vitest-environment jsdom
// SỐ CỦA EM: CỘT DỌC DƯỚI CHUÔNG TRONG MENU (thầy 27/10 chốt bản vẽ menu-cot-doc: «chuyển hết 4 biểu tượng bên trái vào menu ẩn bên phải» · «để dọc
// xuống thẳng hàng cách đều dưới cái chuông»; thay viên nổi mép trái #501):
//  - 4 mục (vòng mục tiêu · lửa · nguyên tử · tinh thể): số dài rút gọn («12,3k»), nhãn đủ chữ ở aria-label; chạm ⇒ mở đúng màn;
//  - không truyền `menu` ⇒ y cũ (thanh ngang, số đủ) — test thanh trên cũ vẫn giữ;
//  - mã: thanh số vẽ portal vào ô #tr-menu-dem của menu (sau Điểm danh, cột phải 6 mục); chạm ô ⇒ menu thu; không lề trái, không viên nổi.
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

describe('ThanhThuong menu (cột dọc dưới chuông)', () => {
  it('số lớn rút gọn, nhãn đủ chữ; vòng mục tiêu số gọn «3/4»; chạm ⇒ mở thẳng màn (không thẻ bật)', async () => {
    datTam(M.tongQuanGia({ tinhThe: 12345 }))
    const mo = vi.fn()
    const c = render(<ThanhThuong token={TK} onMo={mo} thongBao={false} menu />).container
    await waitFor(() => expect(c.querySelector('[data-k="tt"] .tp-so')?.textContent).toBe('12,3k'))
    expect(c.querySelector('[data-k="lua"] .tp-so')?.textContent).toBe('12')
    expect(c.querySelector('.tp-tr-muc .tp-tr-so')?.textContent).toBe('3/4')
    expect(c.querySelector('.tp-tr-muc em')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: '12345 tinh thể' }))
    expect(mo).toHaveBeenCalledWith('cua-hang')
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Mục tiêu hôm nay: 4 chặng · đã làm 3' }))
    expect(mo).toHaveBeenLastCalledWith('nhiem-vu')
    fireEvent.click(screen.getByRole('button', { name: 'Chuỗi 12 ngày' }))
    expect(mo).toHaveBeenLastCalledWith('chuoi')
  })
  it('đủ mức ⇒ vòng ghi «Đủ», có data-dat', async () => {
    datTam(M.tongQuanGia({ mucTieu: { daXong: 8, can: 16, cau: 92, cauDaLam: 93, dat: true } }))
    const c = render(<ThanhThuong token={TK} onMo={() => {}} thongBao={false} menu />).container
    await waitFor(() => expect(c.querySelector('.tp-tr-muc .tp-tr-so')?.textContent).toBe('Đủ'))
    expect(c.querySelector('.tp-tr-muc')?.hasAttribute('data-dat')).toBe(true)
  })
  it('không truyền menu ⇒ y cũ: số đủ, nhãn «3/4 chặng» dưới vòng, bấm là mở màn', async () => {
    datTam(M.tongQuanGia({ tinhThe: 12345 }))
    const mo = vi.fn()
    const c = render(<ThanhThuong token={TK} onMo={mo} thongBao={false} />).container
    await waitFor(() => expect(c.querySelector('[data-k="tt"] .tp-so')?.textContent).toBe('12.345'))
    expect(c.querySelector('.tp-tr-muc em')?.textContent).toBe('3/4 chặng')
    fireEvent.click(screen.getByRole('button', { name: '12345 tinh thể' }))
    expect(mo).toHaveBeenCalledWith('cua-hang')
  })
})

describe('mã nguồn: số của em nằm trong menu, bỏ viên mép trái', () => {
  const ts = readFileSync('src/components/hoc-tap/TrongHs.tsx', 'utf8')
  const css = readFileSync('src/styles/trong-hs.css', 'utf8')
  it('portal vào ô #tr-menu-dem (sau Điểm danh); chạm ô ⇒ menu thu; không còn viên nổi / thu khi cuộn / lề trái', () => {
    expect(ts).toMatch(/createPortal\(<header className="da-tren" data-menu="" aria-label="Số của em">/)
    expect(ts).toMatch(/thongBao=\{!tp && \(p\.muc \?\? 'hom-nay'\) === 'hom-nay'\} menu \/>/)
    expect(ts).toMatch(/<KhoiDiemDanh[^\n]*\n[\s\S]{0,400}<div ref=\{oSo\} id="tr-menu-dem" className="tr-menu-dem" \/>/)
    expect(ts).toMatch(/closest\?\.\('button'\)\) \{ cham\(\); setMo\(false\) \}/)
    expect(ts).not.toMatch(/useThuKhiCuon|data-vien|data-thu=\{thuVien/)
    expect(css).not.toMatch(/\.da-tren\[data-vien\]/)
  })
  it('CSS: lưới «6 mục | cột số» dưới chuông, không thêm hàng; vạch ngăn mảnh; tiến độ nền tối tô màu đúng; chỉ biến --tr-*', () => {
    const khoi = css.slice(css.indexOf('/* ── SỐ CỦA EM: CỘT DỌC DƯỚI CHUÔNG'))
    expect(khoi).toMatch(/grid-template-areas: 'dau dau' 'ds dem';/)
    expect(khoi).toMatch(/grid-template-areas: 'dau dau' 'dd dd' 'ds dem';/)
    expect(khoi).toMatch(/justify-content: space-between/)
    expect(khoi).toMatch(/min-width: 44px/)
    expect(khoi).toMatch(/@media \(prefers-color-scheme: dark\) \{ :root\[data-trong='hs'\] :is\(\.da-bai-tien, \.da-dai-tien\) > i > s \{ background: var\(--tr-dung\); \} \}/)
    expect(khoi).not.toMatch(/#[0-9a-f]{3,8}\b/i)
    expect(khoi).not.toMatch(/transition: all/)
  })
})
