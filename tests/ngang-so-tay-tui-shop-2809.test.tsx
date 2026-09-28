// SỔ TAY · TÚI ĐỒ · CỬA HÀNG — BỐ CỤC NGANG (thầy 28/09). Điểm ngắt DÙNG LẠI dao2/ngang.ts (MQ_NGANG); dọc (không matchMedia) giữ nguyên.
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, cleanup, screen, fireEvent, waitFor } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import SoTay from '../src/game/than-thu-v2/dao/SoTay'
import TuiDo from '../src/game/than-thu-v2/dao/TuiDo'
import ManShop from '../src/game/than-thu-v2/shop/ManShop'
import { ShopApiGia } from '../src/game/than-thu-v2/shop/du-lieu-mau'
import { MQ_NGANG } from '../src/game/than-thu-v2/dao2/ngang'
import type { DaoProfile } from '../src/game/than-thu-v2/dao/kieu'
import type { Mastery } from '../src/game/than-thu-v2/core'

const goc = window.matchMedia
afterEach(() => { cleanup(); window.matchMedia = goc; vi.restoreAllMocks() })
const manHinh = (ngang: boolean) => {
  window.matchMedia = ((q: string) => ({ matches: ngang && q === MQ_NGANG, media: q, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false })) as unknown as typeof window.matchMedia
}
const NOW = 1_790_000_000_000
const m = (key: string, stage: number): Mastery => ({ key, stage, first: NOW - 1, due: NOW + 1e9, groups: [], repaired: false })
const hoSo: DaoProfile = { pet: 'lua_phuong', choice: false, cap: 34, exp: 0, wallet: 0, mastery: [m('ES.TEN', 3), m('CB.LM', 0)] }
const DM = [{ key: 'ES.TEN', ten: 'Tên gọi ester', chuong: 'ES' }, { key: 'CB.LM', ten: 'Lên men', chuong: 'CB' }]

describe('Bố cục ngang · Sổ tay, Túi đồ, Cửa hàng', () => {
  it('Sổ tay ngang: danh sách chương TRÁI (nút ≥ 44 px) · dạng của chương chọn PHẢI; dọc không có data-ngang', () => {
    manHinh(true)
    const { container } = render(<div className="dao dao-vo"><SoTay profile={hoSo} now={NOW} danhMuc={DM} tenChuong={{ ES: 'Ester', CB: 'Carbohydrate' }} /></div>)
    const so = container.querySelector('.dao-so[data-ngang]')!
    expect(so).not.toBeNull()
    expect(so.querySelector('.dao-so-trai .dao-so-ds')).not.toBeNull()
    const nuts = screen.getAllByRole('button')
    expect(nuts.map((b) => b.textContent)).toEqual(['Carbohydrate0/1', 'Ester1/1'])
    expect(nuts[0]!.getAttribute('aria-current')).toBe('true')
    expect(so.querySelector('.dao-so-phai')!.textContent).toContain('Lên men')
    fireEvent.click(nuts[1]!)
    expect(so.querySelector('.dao-so-phai')!.textContent).toContain('Tên gọi ester')
    cleanup(); manHinh(false)
    const doc = render(<div className="dao"><SoTay profile={hoSo} now={NOW} danhMuc={DM} /></div>)
    expect(doc.container.querySelector('[data-ngang]')).toBeNull()
    expect(doc.container.querySelectorAll('.dao-so-chuong').length).toBe(2)
  })

  it('Túi đồ ngang: data-ngang + nút Rèn khiên có lớp nút vàng', () => {
    manHinh(true)
    const { container } = render(<div className="dao dao-vo"><TuiDo profile={{ ...hoSo, renKhien: { manh: 12, gia: 100, duTru: 50 } } as DaoProfile} onDungKhien={vi.fn()} onRenKhien={vi.fn()} /></div>)
    expect(container.querySelector('.dao-tui[data-ngang]')).not.toBeNull()
    expect(container.querySelector('button.dao-tui-ren')).not.toBeNull()
  })

  it('Cửa hàng ngang: .ps[data-ngang], ví + đổi ở cột trái, lưới món ở cột phải', async () => {
    manHinh(true)
    const { container } = render(<ManShop api={new ShopApiGia({})} pet={2} cap={34} tenThu="Bé Mây" onDong={vi.fn()} />)
    await waitFor(() => expect(container.querySelector('.ps-the[data-ma]')).not.toBeNull())
    expect(container.querySelector('.ps[data-ngang]')).not.toBeNull()
    expect(container.querySelector('.ps-ngang-trai .ps-vi')).not.toBeNull()
    expect(container.querySelector('.ps-ngang-trai .ps-doi')).not.toBeNull()
    expect(container.querySelector('.ps-ngang-phai .ps-luoi .ps-the[data-ma]')).not.toBeNull()
  })

  it('CSS: lưới nhiều cột, nút ≥ 44 px, không mã hex', () => {
    const dao = readFileSync('src/game/than-thu-v2/dao/dao-ngang.css', 'utf8'), shop = readFileSync('src/game/than-thu-v2/shop/shop-ngang.css', 'utf8')
    expect(dao).toMatch(/\.dao-so\[data-ngang\]\{display:grid;grid-template-columns:minmax\(260px,360px\) minmax\(0,1fr\)/)
    expect(dao).toMatch(/\.dao-tui\[data-ngang\]\{display:grid;grid-template-columns:repeat\(auto-fill/)
    expect(dao).toMatch(/\.dao-so-ds button\{[^}]*min-height:48px/)
    expect(shop).toMatch(/\.ps\[data-ngang\] \.ps-luoi \{\s*grid-template-columns: repeat\(auto-fill/)
    expect(shop).toMatch(/min-height: 44px/)
    for (const c of [dao, shop]) expect(c).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
  })
})
