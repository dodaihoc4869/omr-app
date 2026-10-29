// @vitest-environment jsdom
// KHÔNG CHO SỬA THÊM (thầy 29/10 «Phần sửa lỗi sai sau khi làm hết câu cần sửa thì không cho sửa thêm nữa»): đã xong HẾT việc hôm nay ⇒
//   · màn Tự sửa lỗi: không còn «Sửa thêm 1 chặng»; danh sách câu còn lại («Tất cả câu cần sửa») bị ẩn, «Xem tiếp các câu» ẩn; câu ĐÃ xong vẫn «Xem lại» được;
//   · mở thẳng một câu chưa nằm trong việc hôm nay (từ Hôm nay / Hồ sơ…) ⇒ không mở, báo «để ngày mai»; câu đã xong hôm nay / câu thầy yêu cầu kiểm lại vẫn mở;
//   · chưa xong hết ⇒ y như cũ (danh sách đầy đủ gập lại, mở được câu bất kỳ).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'

const api = vi.hoisted(() => ({ apiDanhSachTuChua: vi.fn() }))
vi.mock('../src/lib/chua-cau-sai-api', async (goc) => ({ ...(await goc<typeof import('../src/lib/chua-cau-sai-api')>()), apiDanhSachTuChua: api.apiDanhSachTuChua }))
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test', quenDiaChiMayChu: () => {} }))
vi.mock('../src/lib/may-chu-moi', () => ({ layCauHinhMayChu: async () => ({ URL: 'https://may.test' }), xongNapDiaChi: async () => {} }))
vi.mock('../src/components/chua-cau-sai/ManChuaCauSai', () => ({
  default: ({ qid, onVe }: { qid: string; onVe: () => void }) => (<div><p>Đang chữa {qid}</p><button type="button" onClick={onVe}>Ra danh sách</button></div>),
}))

import type { MucChua } from '../src/lib/chua-cau-sai-api'
import { xoaNhoTuSua } from '../src/lib/tu-sua-loi'
import { ghiXongHomNay } from '../src/lib/tu-sua-viec-hom-nay'
const { default: ManTuChua } = await import('../src/components/hoc-tap/ManTuChua')

const mot = (n: number, tt: string, tien: string): MucChua[] => Array.from({ length: n }, (_, i) => ({ qid: `${tien}${i}`, dotId: `${tien}-d${i}`, trangThai: tt }))
/** 30 câu cần sửa (12 của hôm nay + 18 để ngày sau) + 3 câu đã tự sửa. */
const DS: MucChua[] = [...mot(30, 'can_chan_doan', 'm'), ...mot(3, 'da_tu_sua', 'z')]
const bat = (ds: MucChua[]) => ({ trangThai: 'bat', ds, dem: { tong: ds.length, can: ds.filter((m) => m.trangThai !== 'da_tu_sua').length, cho: 0, xong: ds.filter((m) => m.trangThai === 'da_tu_sua').length } })
const dangNhap = () => localStorage.setItem('omr_student_portal_auth', JSON.stringify({ sbd: '11010', token: 'tk' }))

beforeEach(() => {
  vi.clearAllMocks(); localStorage.clear(); xoaNhoTuSua(); dangNhap()
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ ok: true, cheDo2: true, chienDich: [], cau: [] }) })))
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

/** Dựng việc hôm nay trước (12 câu đầu), rồi ghi xong cả 12 như em làm thật; trả khoá 12 câu. */
async function lamXongHet(ds: MucChua[] = DS) {
  api.apiDanhSachTuChua.mockResolvedValue(bat(ds))
  const dau = render(<ManTuChua token="tk" onVe={() => {}} />)
  await screen.findByRole('heading', { name: 'Việc hôm nay: 12 câu' })
  const khoa = [...dau.container.querySelectorAll<HTMLElement>('.vh-cau')].map((x) => x.dataset.khoa!)
  // chỉ hiện chặng hiện tại (4 câu) — các chặng sau lấy theo thứ tự việc hôm nay: m-d0 … m-d11
  dau.unmount()
  for (let i = 0; i < 12; i++) ghiXongHomNay(`m-d${i}`)
  return khoa
}

describe('xong hết việc hôm nay ⇒ không cho sửa thêm', () => {
  it('không còn «Sửa thêm 1 chặng»; danh sách câu còn lại + «Xem tiếp các câu» bị ẩn; thông báo để ngày mai; nút Về vẫn còn', async () => {
    await lamXongHet()
    const onVe = vi.fn()
    render(<ManTuChua token="tk" onVe={onVe} />)
    expect(await screen.findByRole('heading', { name: 'Hôm nay em đã xong phần của 12 câu' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Sửa thêm/ })).toBeNull()
    expect(screen.getByText('Em đã sửa đủ phần hôm nay. Những câu còn lại để ngày mai nhé.')).toBeTruthy()
    expect(screen.queryByText('Tất cả câu cần sửa')).toBeNull()
    expect(screen.queryByRole('button', { name: /Xem tiếp các câu/ })).toBeNull()
    expect(document.querySelectorAll('.tcl-ds .tcl-the, .tcl-ds [data-khoa]').length).toBe(document.querySelectorAll('.tcl-ds details [data-khoa]').length) // chỉ còn nhóm đã xong
    fireEvent.click(screen.getByRole('button', { name: /^Về / }))
    expect(onVe).toHaveBeenCalledOnce()
  })

  it('mở thẳng một câu CHƯA nằm trong việc hôm nay ⇒ không mở, báo «để ngày mai»; câu đã xong hôm nay vẫn mở xem lại', async () => {
    await lamXongHet()
    const r = render(<ManTuChua token="tk" qid="m20" onVe={() => {}} />) // m20 = câu để ngày sau
    expect(await screen.findByText('Hôm nay em đã sửa đủ phần của mình rồi')).toBeTruthy()
    expect(screen.queryByText('Đang chữa m20')).toBeNull()
    r.unmount()
    render(<ManTuChua token="tk" qid="m3" onVe={() => {}} />) // m3 = câu đã xong hôm nay
    expect(await screen.findByText('Đang chữa m3')).toBeTruthy()
  })
})

describe('chưa xong hết ⇒ y như cũ', () => {
  it('danh sách đầy đủ gập lại vẫn có; nút «Sửa tiếp»; mở thẳng câu bất kỳ được', async () => {
    api.apiDanhSachTuChua.mockResolvedValue(bat(DS))
    const { container, unmount } = render(<ManTuChua token="tk" onVe={() => {}} />)
    await screen.findByRole('heading', { name: 'Việc hôm nay: 12 câu' })
    expect(container.querySelector('details.vh-gap summary')!.textContent).toContain('Tất cả câu cần sửa')
    expect(screen.getByRole('button', { name: /Bắt đầu sửa/ })).toBeTruthy()
    unmount()
    render(<ManTuChua token="tk" qid="m20" onVe={() => {}} />)
    expect(await screen.findByText('Đang chữa m20')).toBeTruthy()
  })
})
