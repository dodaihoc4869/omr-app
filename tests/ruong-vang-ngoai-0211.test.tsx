// Thầy 02/11 khuya: «làm lại hiệu ứng mở rương siêu đẹp hơn nữa, mở rồi thì không còn hiệu ứng khi bấm vào nữa» + (ảnh rương ngày) «để rương ở ngoài thôi,
// rương bên trong bỏ đi, sửa thành rương màu vàng như thế này nhé, vẽ lại cho đẹp hơn».
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import { TheRuong } from '../src/components/hoc-tap/TrongHs'
import type { TongQuanThuong } from '../src/lib/thuong-api'
import * as M from './_thuong-mau'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-chu.test', ghiDiaChiDaDung: () => {} }))

afterEach(() => { cleanup(); localStorage.clear(); vi.unstubAllGlobals() })
const tq = (them: Record<string, unknown> = {}) => M.tongQuanGia(them) as unknown as TongQuanThuong
const ds = [{ k: 'c1', tt: 'xong' }, { k: 'c2', tt: 'dang' }] as never

describe('rương vàng ở Hôm nay = rương ngày thật', () => {
  it('chưa xong nhiệm vụ: tiêu đề «Rương hôm nay», 3 vạch 1/3, không có nút Mở', () => {
    const { container } = render(<TheRuong ds={ds} token="t" tq={tq()} />)
    expect(container.textContent).toMatch(/Rương hôm nay/)
    expect(screen.getByRole('img', { name: 'Đã xong 1/3 nhiệm vụ' })).toBeTruthy()
    expect(container.querySelector('.kb-mo-ruong')).toBeNull()
    expect(container.querySelector('svg.rv')).not.toBeNull()
  })
  it('đủ nhiệm vụ: chạm ⇒ gọi /hs/thuong/mo-ruong rồi chuyển sang «Rương đã mở · +15»', async () => {
    const goi = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } }))
    vi.stubGlobal('fetch', goi)
    render(<TheRuong ds={ds} token="t" tq={tq({ nhiemVu: M.NHIEM_VU_XONG })} />)
    fireEvent.click(screen.getByRole('button', { name: 'Mở rương hôm nay' }))
    await waitFor(() => expect(screen.getByLabelText(/Rương đã mở, cộng 15 tinh thể/)).toBeTruthy(), { timeout: 4000 })
    expect(goi.mock.calls.some(([u]) => String(u).includes('/hs/thuong/mo-ruong'))).toBe(true)
  })
  it('ĐÃ MỞ: thẻ tĩnh (không phải nút) — chạm không chạy hiệu ứng; chữ «Hẹn em mai với 3 nhiệm vụ mới.»', () => {
    const { container } = render(<TheRuong ds={ds} token="t" tq={tq({ nhiemVu: M.NHIEM_VU_XONG, ruong: { mo: true, thuong: 15 } })} />)
    expect(container.querySelector('button')).toBeNull()
    expect(container.querySelector('[data-da-mo]')?.textContent).toMatch(/Rương đã mở\s·\s\+15.*Hẹn em mai với 3 nhiệm vụ mới\./)
    expect(container.querySelector('.rv .rv-tt')).not.toBeNull()
  })
  it('không có hệ thưởng: rương trang trí theo chặng như cũ; đã mở hôm nay ⇒ cũng tĩnh', () => {
    localStorage.setItem(`ddh.ruong-mo.${new Date(Date.now() + 7 * 3_600_000).toISOString().slice(0, 10)}`, '1')
    const xong = [{ k: 'c1', tt: 'xong' }, { k: 'c2', tt: 'xong' }] as never
    const { container } = render(<TheRuong ds={xong} />)
    expect(container.querySelector('button')).toBeNull()
    expect(container.textContent).toMatch(/Rương đã mở/)
  })
  it('màn Nhiệm vụ không còn rương; hiệu ứng mở rương v2 có cột sáng + vòng 16 tia', () => {
    expect(fs.readFileSync(path.join(__dirname, '../src/components/thuong/ManTinhThe.tsx'), 'utf8')).not.toMatch(/<Ruong\b/)
    const s = fs.readFileSync(path.join(__dirname, '../src/lib/hieu-ung/ruong.ts'), 'utf8')
    expect(s).toMatch(/CỘT SÁNG/)
    expect(s).toMatch(/so = du \? 16 : 8/)
  })
})
