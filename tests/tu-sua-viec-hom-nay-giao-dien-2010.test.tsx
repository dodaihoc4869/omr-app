// @vitest-environment jsdom
// VIỆC HÔM NAY của Tự sửa lỗi — GIAO DIỆN (thầy 20/10: "cho sửa ít nhất 12 câu mỗi ngày, chia làm các chặng cho thông minh và cảm hứng").
// Khoá: thẻ ở Hôm nay (4 trạng thái, bấm mở THẲNG câu kế tiếp, không có phiên ⇒ thẻ cũ), khối đầu màn Tự sửa lỗi (một chặng 4 câu, chặng sau gọn một dòng,
// danh sách đầy đủ gập lại, nút chính tới câu kế tiếp, xong cả ngày ⇒ Về Hôm nay, KHÔNG còn Sửa thêm — thầy 29/10), một dòng điều kiện ở bản mới, tiêu đề sau khi nộp.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'

const api = vi.hoisted(() => ({ apiDanhSachTuChua: vi.fn() }))
vi.mock('../src/lib/chua-cau-sai-api', async (goc) => ({ ...(await goc<typeof import('../src/lib/chua-cau-sai-api')>()), apiDanhSachTuChua: api.apiDanhSachTuChua }))
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test', quenDiaChiMayChu: () => {} }))
vi.mock('../src/lib/may-chu-moi', () => ({ layCauHinhMayChu: async () => ({ URL: 'https://may.test' }), xongNapDiaChi: async () => {} }))
vi.mock('../src/components/chua-cau-sai/ManChuaCauSai', () => ({
  default: ({ qid, onVe }: { qid: string; onVe: () => void }) => (<div><p>Đang chữa {qid}</p><button type="button" onClick={onVe}>Ra danh sách</button></div>),
}))

import type { MucChua } from '../src/lib/chua-cau-sai-api'
import { taiTuSuaLoi, xoaNhoTuSua } from '../src/lib/tu-sua-loi'
import { ghiXongHomNay } from '../src/lib/tu-sua-viec-hom-nay'
import { LUAT_BAN_MOI } from '../src/lib/chua-truc-tiep'
const { default: ManTuChua } = await import('../src/components/hoc-tap/ManTuChua')
const { TheMoiTuSua } = await import('../src/components/hoc-tap/HocTapHomNay')

const QUA = new Date(Date.now() - 3600_000).toISOString()
const mot = (n: number, tt: string, tien: string, denHan?: string): MucChua[] => Array.from({ length: n }, (_, i) => ({ qid: `${tien}${i}`, dotId: `${tien}-d${i}`, trangThai: tt, ...(denHan ? { denHan } : {}) }))
/** 2 câu chỉ còn bản mới · 3 đang dở · 3 câu mới · 10 chỉ có lối câu gốc (18 câu). */
const DANH_SACH: MucChua[] = [...mot(10, 'thieu_hoc_lieu', 'g'), ...mot(3, 'can_chan_doan', 'm'), ...mot(3, 'dang_chua_buoc', 'k'), ...mot(2, 'cho_gap_lai_2', 'x', QUA), ...mot(4, 'da_tu_sua', 'z')]
const bat = (ds: MucChua[]) => ({ trangThai: 'bat', ds, dem: { tong: ds.length, can: ds.filter((m) => m.trangThai !== 'da_tu_sua').length, cho: 0, xong: ds.filter((m) => m.trangThai === 'da_tu_sua').length } })
const dangNhap = (sbd = '11010') => localStorage.setItem('omr_student_portal_auth', JSON.stringify({ sbd, token: 'tk' }))

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  xoaNhoTuSua()
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ ok: true, cheDo2: true, chienDich: [], cau: [] }) })))
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe('Thẻ ở Hôm nay', () => {
  const ve = async (ds: MucChua[], onChua = vi.fn()) => {
    api.apiDanhSachTuChua.mockResolvedValue(bat(ds))
    await taiTuSuaLoi('tk', { moi: true })
    return { onChua, ...render(<TheMoiTuSua so={bat(ds).dem.can} token="tk" onChua={onChua} />) }
  }

  // Chữa câu gọn (thầy 25/10): một đường cho mọi câu (không còn "chỉ còn làm bản mới"); em thấy NGAY số câu đã tự sửa hôm nay (máy chủ đếm).
  it('thẻ báo "Đã tự sửa hôm nay: N câu" (máy chủ đếm); nút "Bắt đầu sửa" mở THẲNG câu đầu', async () => {
    dangNhap()
    const onChua = vi.fn()
    api.apiDanhSachTuChua.mockResolvedValue({ ...bat(DANH_SACH), dem: { ...bat(DANH_SACH).dem, xongHomNay: 3 } })
    await taiTuSuaLoi('tk', { moi: true })
    render(<TheMoiTuSua so={bat(DANH_SACH).dem.can} token="tk" onChua={onChua} />)
    const the = await screen.findByRole('region', { name: /Hôm nay sửa 12 câu/ })
    expect(the.textContent).toContain('Đã tự sửa hôm nay: 3 câu.')
    expect(the.textContent).toContain('0/12 câu')
    expect(the.querySelectorAll('.vh-nhom')).toHaveLength(3)
    fireEvent.click(within(the).getByRole('button', { name: /Bắt đầu sửa/ }))
    expect(onChua).toHaveBeenCalledWith('g0')
  })

  it('chưa có câu gần xong ⇒ "Hôm nay sửa 12 câu", 3 chặng; còn bao nhiêu câu cho các ngày sau; "Bắt đầu sửa"', async () => {
    dangNhap()
    const { onChua } = await ve(mot(30, 'can_chan_doan', 'm'))
    const the = await screen.findByRole('region', { name: /Hôm nay sửa 12 câu/ })
    expect(the.textContent).toContain('3 chặng, mỗi chặng 4 câu. Còn 18 câu cho các ngày sau.')
    fireEvent.click(within(the).getByRole('button', { name: /Bắt đầu sửa/ }))
    expect(onChua).toHaveBeenCalledWith('m0')
  })

  it('đã xong phần của vài câu ⇒ nói đúng việc đã làm và nút "Sửa tiếp · chặng k/n"; xong cả ngày ⇒ thẻ xanh, KHÔNG còn nút sửa thêm (thầy 29/10: sửa hết câu của ngày thì không cho sửa thêm)', async () => {
    dangNhap()
    const ds = mot(30, 'can_chan_doan', 'm')
    const { onChua } = await ve(ds)
    await screen.findByRole('region', { name: /Hôm nay sửa 12 câu/ })
    cleanup()
    for (let i = 0; i < 5; i++) ghiXongHomNay(`m-d${i}`)
    render(<TheMoiTuSua so={30} token="tk" onChua={onChua} />)
    const dang = await screen.findByRole('region', { name: /xong phần của 5 câu/ })
    expect(dang.textContent).toContain('Tự sửa lỗi · Chặng 2/3 · còn 3 câu')
    fireEvent.click(within(dang).getByRole('button', { name: /Sửa tiếp · chặng 2\/3/ }))
    expect(onChua).toHaveBeenCalledWith('m5')
    cleanup()
    for (let i = 5; i < 12; i++) ghiXongHomNay(`m-d${i}`)
    render(<TheMoiTuSua so={30} token="tk" onChua={onChua} />)
    const xong = await screen.findByRole('region', { name: /xong phần của 12 câu/ })
    expect(xong.getAttribute('data-tt')).toBe('xong')
    expect(xong.textContent).toContain('Còn 18 câu cho các ngày sau.')
    expect(within(xong).queryByRole('button')).toBeNull() // không nút «Sửa thêm 1 chặng», không nút nào mở thêm câu
    expect(xong.textContent).not.toContain('Sửa thêm')
    expect(onChua).toHaveBeenCalledTimes(1) // chỉ lần bấm «Sửa tiếp · chặng 2/3» ở trên
  })

  it('không có phiên đăng nhập ⇒ thẻ CŨ y nguyên (một con số, một nút)', async () => {
    const { onChua } = await ve(DANH_SACH)
    const the = await screen.findByRole('region', { name: /câu đang chờ em sửa/ })
    expect(the.textContent).toContain('Sửa lỗi ngay')
    fireEvent.click(within(the).getByRole('button'))
    expect(onChua).toHaveBeenCalledWith()
  })

  it('chỉ có câu tự làm lại trên câu gốc vẫn có ngày làm được (94% đợt chưa có bài luyện từng bước)', async () => {
    dangNhap()
    await ve(mot(40, 'thieu_hoc_lieu', 'g'))
    expect((await screen.findByRole('region', { name: /Hôm nay sửa 12 câu/ })).textContent).toContain('Còn 28 câu cho các ngày sau')
  })
})

describe('Màn Tự sửa lỗi: Việc hôm nay', () => {
  it('một chặng 4 câu (một đường gọn: mọi câu "Cần sửa"), chặng sau gọn một dòng, danh sách đầy đủ gập lại, nút chính mở câu kế tiếp', async () => {
    dangNhap()
    api.apiDanhSachTuChua.mockResolvedValue(bat(DANH_SACH))
    const { container } = render(<ManTuChua token="tk" onVe={() => {}} />)
    expect(await screen.findByRole('heading', { name: 'Việc hôm nay: 12 câu' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Chặng 1/3' })).toBeTruthy()
    const hang = [...container.querySelectorAll<HTMLElement>('.vh-cau')]
    expect(hang).toHaveLength(4)
    expect(hang[0]!.textContent).toContain('Cần sửa')
    expect(hang[2]!.textContent).toContain('Cần sửa')
    expect(container.textContent).not.toMatch(/bản mới|từng bước|gặp lại 2/)
    expect(container.querySelector('.vh-sau')!.textContent).toContain('Chặng 2/3 · 4 câu')
    expect(container.querySelector('.vh-sau')!.textContent).toContain('Chặng 3/3 · 4 câu')
    // danh sách đầy đủ gập lại: không còn tường cả trăm câu
    const gap = container.querySelector('details.vh-gap')!
    expect(gap.hasAttribute('open')).toBe(false)
    expect(gap.querySelector('summary')!.textContent).toContain('Tất cả câu cần sửa')
    // thầy duyệt 28/10: tổng nợ CHỈ ở màn này, dạng «Còn N lỗi cần sửa» (nút Lộ trình chỉ số câu hôm nay)
    expect(container.textContent).toContain('Còn 18 lỗi cần sửa · 6 câu để các ngày sau, em không cần sửa hết hôm nay.')
    fireEvent.click(screen.getByRole('button', { name: /Bắt đầu sửa/ }))
    expect(await screen.findByText('Đang chữa g0')).toBeTruthy()
  })

  it('xong chặng 1 ⇒ "Đã xong chặng 1/3" và nút "Sửa tiếp · chặng 2/3"; xong cả ngày ⇒ Về Hôm nay, không Sửa thêm (thầy 29/10)', async () => {
    dangNhap()
    api.apiDanhSachTuChua.mockResolvedValue(bat(DANH_SACH))
    // Dựng (và lưu) việc hôm nay TRƯỚC, rồi mới ghi xong 4 câu đầu — như em làm thật (ghi trước khi dựng thì câu vừa làm bị xoay xuống sau).
    const dau = render(<ManTuChua token="tk" onVe={() => {}} />)
    await screen.findByRole('heading', { name: 'Việc hôm nay: 12 câu' })
    const bon = [...dau.container.querySelectorAll<HTMLElement>('.vh-cau')].map((x) => x.dataset.khoa!)
    expect(bon).toEqual(['g-d0', 'g-d1', 'g-d2', 'g-d3'])
    dau.unmount()
    for (const k of bon) ghiXongHomNay(k)
    const { container, unmount } = render(<ManTuChua token="tk" onVe={() => {}} />)
    expect(await screen.findByText('Đã xong chặng 1/3. Nghỉ một chút cũng được.')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Sửa tiếp · chặng 2\/3/ })).toBeTruthy()
    expect(container.querySelector('.vh-man h1')!.textContent).toBe('Việc hôm nay: 12 câu')
    unmount()
    for (const m of DANH_SACH.filter((x) => x.trangThai !== 'da_tu_sua')) ghiXongHomNay(m.dotId!)
    const onVe = vi.fn()
    render(<ManTuChua token="tk" onVe={onVe} />)
    expect(await screen.findByRole('heading', { name: 'Hôm nay em đã xong phần của 12 câu' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Về Hôm nay' }))
    expect(onVe).toHaveBeenCalledOnce()
    expect(screen.queryByRole('button', { name: 'Sửa thêm 1 chặng' })).toBeNull() // đã sửa đủ ⇒ không cho sửa thêm
    expect(screen.getByText('Em đã sửa đủ phần hôm nay. Những câu còn lại để ngày mai nhé.')).toBeTruthy()
    expect(screen.queryByText('Tất cả câu cần sửa')).toBeNull() // danh sách câu còn lại bị ẩn (chỉ còn nhóm đã xong để xem lại)
  })

  it('không có SBD ⇒ giao diện danh sách cũ (không việc hôm nay)', async () => {
    api.apiDanhSachTuChua.mockResolvedValue(bat(DANH_SACH))
    render(<ManTuChua token="tk" onVe={() => {}} />)
    expect(await screen.findByRole('region', { name: /Cần sửa: \d+ câu/ })).toBeTruthy()
    expect(screen.queryByText(/Việc hôm nay/)).toBeNull()
  })

  it('lỗi tải ⇒ không dựng việc hôm nay, vẫn báo lỗi + Thử lại', async () => {
    dangNhap()
    api.apiDanhSachTuChua.mockResolvedValue({ trangThai: 'loi', loi: 'Mạng yếu' })
    render(<ManTuChua token="tk" onVe={() => {}} />)
    await waitFor(() => expect(screen.getByText(/Mạng yếu/)).toBeTruthy())
    expect(screen.queryByText(/Việc hôm nay/)).toBeNull()
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeTruthy()
  })
})

describe('Một dòng điều kiện ở bản mới', () => {
  it('lời nói đúng luật tự làm, không hứa mốc giờ, không nhắc 12 giờ', () => {
    expect(LUAT_BAN_MOI).toBe('Tự làm, không xem gợi ý hay lời giải. Đúng thì câu này tính là đã tự sửa.')
    expect(LUAT_BAN_MOI).not.toMatch(/12 giờ|24 giờ/)
  })
})
