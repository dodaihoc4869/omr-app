// HÀNH TRÌNH — lịch sử: 12/10 còn 2 mục ("Dạy học & đầu giờ" · "Chữa bài"). SỬA CÓ CHỦ ĐÍCH 21/10 — thầy (bản vẽ docs/ban-ve-hanh-trinh-2110 đã
// duyệt): "bỏ thẻ dạy học và đầu giờ và thẻ chữa bài đi … 1 điểm danh, 2 là gọi lên bảng đầu giờ, 3 dạy học, 4 chữa câu khó và tính toán" + "các bước
// sau đều lấy danh sách điểm danh ở bước 1, các bước sau chọn độc lập được" + "bỏ cái phần tick bài vừa dạy khỏi hành trình đi". Kiểm:
//   · không còn thẻ / mục; thước 4 bước; khoá cũ ánh xạ sang bước (can-chua / chua-bai ⇒ 4; dau-gio ⇒ 2; khoá khác ⇒ theo điểm danh);
//   · MỘT điểm danh dùng chung (máy chủ chỉ được hỏi "buổi đang mở" MỘT lần); mỗi lúc một bước mở, bước khác thu mà vẫn gắn; bước độc lập (mở bước 3
//     khi chưa ai điểm danh được); bước 4 chỉ nạp khi mở; không còn Tick bài (không đọc cờ OMNI); thẻ từng em gọi lên bảng chấm Đạt / Chưa đạt;
//   · bảng "Bài đang giao" (mỗi gói một dòng, hai thanh có nhãn; lớp chưa em nào nhận ⇒ câu nói thật thay vì 0%) + lối sang bước 4.
// Hộp Bổ sung bài hôm nay (Tick bài) có test riêng: tests/hop-bo-sung-bai-2110.test.tsx.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'

const { goi } = vi.hoisted(() => ({ goi: vi.fn() }))
vi.mock('../src/lib/goi-lenh-thay', () => ({ goiLenh: (duong: string, body: Record<string, unknown>) => goi(duong, body) }))
vi.mock('../src/lib/exam-db', async (goc) => ({
  ...(await goc<typeof import('../src/lib/exam-db')>()),
  loadExamSources: async () => [],
  loadScriptUrl: async () => 'https://may-chu',
  loadTeacherSecret: async () => 'mat',
}))
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-chu' }))
// Mục Chữa bài có test riêng (làn Chữa bài) — ở đây chỉ kiểm đường nối.
vi.mock('../src/components/chien-dich/TheCanThayChua', () => ({ default: () => <p>Giả: mục Chữa bài</p> }))

import { useSoDemGv, type TheHanhTrinh } from '../src/lib/so-dem-gv'
import { buocMacDinh, chuBuoi, chuDemGiao, dongBaiDangGiao, goiDangGiao, trangThaiBuoc } from '../src/components/chien-dich/buoi-day-ui'
import { emVangBuoi } from '../src/components/day-hoc/DiemDanhBuoi'
import { kyTuTen } from '../src/components/day-hoc/KiemTraDauGio'
const { default: HanhTrinhV2, buocHanhTrinh } = await import('../src/components/chien-dich/HanhTrinhV2')
const { default: TheBaiDaDay } = await import('../src/components/chien-dich/TheBaiDaDay')
const { default: BangBaiDangGiao } = await import('../src/components/chien-dich/BangBaiDangGiao')

const NOW = Date.parse('2026-10-12T03:00:00Z') // 10:00 Thứ Hai 12/10 giờ VN
const BUOI = { id: 'BH-12', ten: 'Buổi học 12/10 · 12A1', lop: '12A1', moLuc: '2026-10-12T11:00:00Z', hetHan: '2026-10-13T11:00:00Z', dongLuc: null, dangMo: true }
const EM = [
  { sbd: 'S1', hoTen: 'Lê Khánh Vy', tenLop: '12A1' },
  { sbd: 'S2', hoTen: 'Đặng Quốc Việt', tenLop: '12A1' },
  { sbd: 'S3', hoTen: 'Bùi Quang Minh', tenLop: '12A1' },
  { sbd: 'S9', hoTen: 'Phạm Hà', tenLop: '12 - Tinh Hoa' },
]
const LUOT = [
  { sbd: 'S1', hoTen: 'Lê Khánh Vy', qid: 'Q-12', luot: 1, chuyenDe: 'Amine', trangThai: 'dat' },
  { sbd: 'S2', hoTen: 'Đặng Quốc Việt', qid: 'Q-5', luot: 1, chuyenDe: 'Chất béo', trangThai: 'cho' },
]
const GOI = [
  { id: 'g7:tinh-hoa', ten: 'Bài 8. Amine', lop: '12 - Tinh Hoa', han: '2026-10-17', bat_dau: '2026-10-11' },
  { id: 'g7:thuong', ten: 'Bài 8. Amine', lop: '12 - Lớp Thường', han: '2026-10-16', bat_dau: '2026-10-10' },
  { id: 'g7:cu', ten: 'Bài 6. Tinh bột', lop: '11', han: '2026-10-09', bat_dau: '2026-10-03' },
]
const emGoi = (tong: number, daGap: number, tuLam: number, sbd: string) => ({ sbd, ten: sbd, tong, daGap, tuLam, con: tong - daGap, kyNang: { tong: 0, dat: 0, tyLe: null }, diem: [] })
const CT_TINH_HOA = { bat: true, goiId: 'g7:tinh-hoa', soEm: 2, soCau: 10, canChua: 0, goi: GOI, cau: [], em: [emGoi(10, 6, 3, 'A'), emGoi(10, 4, 1, 'B')] }
const CT_THUONG = { bat: true, goiId: 'g7:thuong', soEm: 0, soCau: 132, canChua: 132, goi: GOI, cau: [], em: [] }

const TONG_HOP = { bat: true, goi: GOI, thongKe: { 'g7:tinh-hoa': { soEm: 2, pGap: 50, pTuLam: 20 }, 'g7:thuong': { soEm: 0, pGap: null, pTuLam: null }, 'g7:cu': { soEm: 3, pGap: 40, pTuLam: 20 } } }

let co: Record<string, unknown> = { bat: true, lop: ['12A1'], sbd: [] }
let tickLuc = '2026-10-05T03:00:00Z'
let goi7: (b: Record<string, unknown>) => unknown = (b) => ({ ok: true, du: b.action === 'tong_hop' ? TONG_HOP : b.goiId === 'g7:thuong' ? CT_THUONG : CT_TINH_HOA })

function mayChu() {
  goi.mockImplementation(async (duong: string, b: Record<string, unknown>) => {
    if (duong === '/gv/lop') return { ok: true, du: { ok: true, lop: [{ tenLop: '12A1', khoi: '12', soEm: 3, sbd: [] }] } }
    if (duong === '/gv/buoi-hoc' && b.action === 'dang-mo') return { ok: true, du: { ok: true, buoi: [BUOI] } }
    if (duong === '/gv/buoi-hoc' && b.action === 'gan-day') return { ok: false, loai: 'chua_co_lenh', chu: 'lệnh lạ' }
    if (duong === '/gv/buoi-hoc')
      return { ok: true, du: { ok: true, buoi: BUOI, ma: '482915', doiMaLuc: 1, coMat: EM.slice(0, 2).map((e) => ({ sbd: e.sbd, hoTen: e.hoTen, luc: BUOI.moLuc, cach: 'ma' })), siSo: 3, lopEm: EM } }
    if (duong === '/gv/dau-gio' && b.action === 'xem') return { ok: true, du: { ok: true, daKetThuc: false, luot: LUOT } }
    if (duong === '/gv/dau-gio' && b.action === 'lich-su') return { ok: true, du: { ok: true, ketQua: [{ sbd: 'S1', qid: 'Q-12', chu: 'Đúng 08/10 (Học theo kế hoạch)' }] } }
    if (duong === '/gv/dau-gio' && b.action === 'cham') return { ok: true, du: { ok: true, ketQua: b.dat ? 'dat' : 'chua_dat' } }
    if (duong === '/gv/omni' && b.action === 'co-doc') return { ok: true, du: { ok: true, co } }
    if (duong === '/gv/bai-da-day' && b.action === 'danh-sach')
      return { ok: true, du: { ok: true, bai: [{ khoaBai: 'DH-12-C1-B1', tenBai: 'Bài 1. Ester', viTri: 1, tickLuc, chienDichId: 'cd-1', trangThai: 'dang_luyen', hanNop: '2026-10-18', conNgay: 6, chungChi: null }], choBaiMoi: null } }
    if (duong === '/gv/goi-bai-7') return goi7(b)
    return { ok: false, loai: 'chua_co_lenh', chu: 'lệnh lạ' }
  })
}
const lenh = (duong: string, action?: string) => goi.mock.calls.filter(([d, b]) => d === duong && (action === undefined || (b as Record<string, unknown>).action === action))

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
  goi.mockReset()
  co = { bat: true, lop: ['12A1'], sbd: [] }
  tickLuc = '2026-10-05T03:00:00Z'
  goi7 = (b) => ({ ok: true, du: b.action === 'tong_hop' ? TONG_HOP : b.goiId === 'g7:thuong' ? CT_THUONG : CT_TINH_HOA })
  useSoDemGv.setState({ canThayChua: null, moHanhTrinh: null, giaoTuCa: null })
  mayChu()
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  localStorage.clear()
})

const buoc = (c: HTMLElement, so: number) => c.querySelector<HTMLElement>(`[data-buoc-ht="${so}"]`)!
const dangMo = (c: HTMLElement, so: number) => buoc(c, so)?.getAttribute('data-mo') === 'true'
const the = (c: HTMLElement, ten: RegExp) => within(buoc(c, 2)).getByRole('button', { name: ten, hidden: true })
const thuocCua = () => screen.getByRole('navigation', { name: 'Các bước của buổi dạy' })

// SỬA CÓ CHỦ ĐÍCH 07/11 — thầy duyệt bản vẽ docs/ban-ve-buoc-day-0711 («duyệt, build luôn»): đường thẳng 4 bước Điểm danh → Hôm nay làm gì? (thẻ hoạt
// động) → Chọn câu & chiếu (khối sẵn có của hoạt động) → Đang chiếu; bước + hoạt động đồng bộ mọi máy qua máy chủ (thay phần nhớ theo máy).
describe('các bước buổi dạy + khoá cũ', () => {
  it('thước 4 bước mới; tiêu đề phụ mới; số cần chữa trên thẻ Chữa câu khó; không nút ở đầu màn', async () => {
    useSoDemGv.getState().datSo({ canThayChua: 6 })
    const { container } = render(<HanhTrinhV2 />)
    const thuoc = await screen.findByRole('navigation', { name: 'Các bước của buổi dạy' })
    expect(screen.queryAllByRole('tab')).toHaveLength(0)
    expect(within(thuoc).getAllByRole('button').filter((b) => b.querySelector('.gvv2-ht-ten-dai')).map((b) => b.querySelector('.gvv2-ht-ten-dai')?.textContent)).toEqual(['Điểm danh', 'Hôm nay làm gì?', 'Chọn câu & chiếu', 'Đang chiếu'])
    expect(screen.getByText(/^Điểm danh → chọn hoạt động → chọn câu, chiếu lên bảng → trên lớp chỉ cần bấm Câu tiếp/)).toBeTruthy()
    expect(container.querySelector('.gvv2-dau button')).toBeNull()
    expect(buoc(container, 2).textContent).toContain('6 chỗ cần chữa')
    // một chỗ kết thúc buổi trên thước
    await waitFor(() => expect(within(thuoc).getByRole('button', { name: 'Kết thúc buổi học' })).toBeTruthy())
  })

  it('khoá cũ không gãy: can-chua / chua-bai ⇒ bước 3 · Chữa câu khó; dau-gio ⇒ bước 3 · Kiểm tra đầu giờ; khoá khác ⇒ theo điểm danh', async () => {
    const bang: [TheHanhTrinh | string, 2 | 4 | null][] = [
      ['day-hoc', null], ['chua-bai', 4], ['can-chua', 4], ['dau-gio', 2], ['goi-7', null], ['nhip', null], ['bai-hang-ngay', null], ['chien-dich', null], ['la', null],
    ]
    for (const [k, so] of bang) expect(buocHanhTrinh(k), k).toBe(so)
    const r = render(<HanhTrinhV2 theDau="can-chua" />)
    expect(await screen.findByText('Giả: mục Chữa bài')).toBeTruthy()
    expect(dangMo(r.container, 3)).toBe(true)
    r.unmount()
    const r2 = render(<HanhTrinhV2 theDau="dau-gio" />)
    await screen.findByRole('navigation', { name: 'Các bước của buổi dạy' })
    await waitFor(() => expect(dangMo(r2.container, 3)).toBe(true))
    expect(r2.container.querySelector('[data-hd="dau-gio"]')!.hasAttribute('hidden')).toBe(false)
  })
})

describe('các bước buổi dạy: MỘT điểm danh, đồng bộ mọi máy', () => {
  it('MỘT điểm danh dùng chung; có em có mặt ⇒ bước 2 «Hôm nay làm gì?»; chọn thẻ ⇒ bước 3 khối hoạt động, khối đã mở vẫn gắn; tiến trình ghi lên máy chủ', async () => {
    const { container } = render(<TheBaiDaDay />)
    await waitFor(() => expect(dangMo(container, 2)).toBe(true))
    await screen.findByRole('heading', { level: 2, name: 'Hôm nay làm gì?' })
    expect(lenh('/gv/buoi-hoc', 'dang-mo')).toHaveLength(1)
    expect([...container.querySelectorAll('[data-buoc-ht]')].map((b) => b.getAttribute('data-buoc-ht'))).toEqual(['1', '2', '3', '4'])
    await waitFor(() => expect(buoc(container, 2).textContent).toContain('2/3 em có mặt'))
    expect((screen.getByRole('combobox', { name: 'Buổi dạy' }) as HTMLSelectElement).value).toBe('BH-12')
    const muc = () => [...thuocCua().querySelectorAll('li[data-tt]')].map((l) => l.getAttribute('data-tt'))
    expect(muc()).toEqual(['xong', 'dang', 'cho', 'cho'])
    // chưa chọn hoạt động ⇒ chưa nạp khối nào; không Tick bài, không đọc cờ OMNI
    expect(screen.queryByText('Giả: mục Chữa bài')).toBeNull()
    expect(container.querySelector('[data-hd]')).toBeNull()
    expect(screen.queryByText('Tick bài vừa dạy')).toBeNull()
    // chọn Kiểm tra đầu giờ ⇒ bước 3, khối gọi lên bảng; tiến trình ghi lên máy chủ
    fireEvent.click(the(container, /^Kiểm tra đầu giờ/))
    await waitFor(() => expect(dangMo(container, 3)).toBe(true))
    expect(container.querySelector('[data-khoi="buoc-dau-gio"]')).toBeTruthy()
    await waitFor(() => expect(lenh('/gv/buoi-hoc', 'tien-trinh').at(-1)?.[1]).toMatchObject({ id: 'BH-12', tienTrinh: { buoc: 3, hoatDong: 'dau-gio' } }))
    // đổi sang Dạy học: khối Kiểm tra đầu giờ vẫn gắn (ẩn) — giữ em đang gọi
    fireEvent.click(within(buoc(container, 3)).getByRole('button', { name: /Đổi hoạt động/ }))
    await waitFor(() => expect(dangMo(container, 2)).toBe(true))
    fireEvent.click(the(container, /^Dạy học/))
    await waitFor(() => expect(dangMo(container, 3)).toBe(true))
    expect(container.querySelector('[data-hd="dau-gio"]')!.hasAttribute('hidden')).toBe(true)
    expect(container.querySelector('[data-hd="day-hoc"]')!.hasAttribute('hidden')).toBe(false)
    expect(muc()).toEqual(['xong', 'xong', 'dang', 'cho'])
    // Chữa câu khó chỉ nạp khi chọn
    expect(screen.queryByText('Giả: mục Chữa bài')).toBeNull()
    fireEvent.click(within(buoc(container, 3)).getByRole('button', { name: /Đổi hoạt động/ }))
    fireEvent.click(the(container, /^Chữa câu khó/))
    expect(await screen.findByText('Giả: mục Chữa bài')).toBeTruthy()
    expect(lenh('/gv/omni', 'co-doc')).toHaveLength(0)
  })

  it('Kiểm tra đầu giờ: thẻ từng em, Đạt / Chưa đạt đi đường /gv/dau-gio cham; thẻ hoạt động báo đã gọi', async () => {
    const { container } = render(<TheBaiDaDay />)
    await waitFor(() => expect(dangMo(container, 2)).toBe(true))
    fireEvent.click(the(container, /^Kiểm tra đầu giờ/))
    const buoc2 = await screen.findByRole('region', { name: 'Gọi lên bảng đầu giờ' })
    await within(buoc2).findByText('Đặng Quốc Việt')
    expect(within(buoc2).getByText('Đã ghi: Đạt')).toBeTruthy()
    expect(within(buoc2).getByText('Lịch sử câu này: Đúng 08/10 (Học theo kế hoạch)')).toBeTruthy()
    expect(within(buoc2).getByRole('button', { name: 'Chiếu lên bảng' })).toBeTruthy()
    expect(within(buoc2).getByRole('button', { name: 'Đã gọi hết em có mặt' }).hasAttribute('disabled')).toBe(true)
    expect(within(buoc2).getAllByRole('checkbox', { name: /Thầy đã chữa/ })).toHaveLength(2)
    fireEvent.click(within(buoc2).getByRole('button', { name: 'Quốc Việt: Đạt' }))
    await waitFor(() => expect(lenh('/gv/dau-gio', 'cham').map(([, b]) => b)).toEqual([expect.objectContaining({ buoiId: 'BH-12', sbd: 'S2', qid: 'Q-5', dat: true })]))
    await waitFor(() => expect(within(buoc2).getAllByText('Đã ghi: Đạt')).toHaveLength(2))
    await waitFor(() => expect(buoc(container, 2).textContent).toContain('Đã gọi 2 em · Đạt 2'))
  })

  it('chưa mở buổi ⇒ bước 1; vẫn chọn được Dạy học; Kiểm tra đầu giờ nói cần điểm danh + «Về bước 1»; máy khác / tải lại về đúng bước từ máy chủ', async () => {
    goi.mockImplementation(async (duong: string, b: Record<string, unknown>) => {
      if (duong === '/gv/buoi-hoc' && b.action === 'dang-mo') return { ok: true, du: { ok: true, buoi: [] } }
      if (duong === '/gv/lop') return { ok: true, du: { ok: true, lop: [{ tenLop: '12A1', khoi: '12', soEm: 3, sbd: [] }] } }
      return { ok: false, loai: 'chua_co_lenh', chu: 'lệnh lạ' }
    })
    const { container, unmount } = render(<TheBaiDaDay />)
    await waitFor(() => expect(dangMo(container, 1)).toBe(true))
    expect((within(buoc(container, 1)).getByRole('button', { name: 'Xong điểm danh →' }) as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(within(thuocCua()).getByRole('button', { name: /^Hôm nay làm gì\?/ }))
    await waitFor(() => expect(dangMo(container, 2)).toBe(true))
    expect(buoc(container, 2).textContent).toContain('Chưa mở buổi')
    fireEvent.click(the(container, /^Kiểm tra đầu giờ/))
    await waitFor(() => expect(dangMo(container, 3)).toBe(true))
    expect(within(buoc(container, 3)).getByText('Chưa có danh sách có mặt — điểm danh ở bước 1 trước.')).toBeTruthy()
    fireEvent.click(within(container.querySelector<HTMLElement>('[data-hd="dau-gio"]')!).getByRole('button', { name: 'Về bước 1' }))
    await waitFor(() => expect(dangMo(container, 1)).toBe(true))
    expect(lenh('/gv/buoi-hoc', 'tien-trinh')).toHaveLength(0) // chưa có buổi ⇒ không ghi
    unmount()

    // máy chủ có tiến trình (máy thầy khác vừa chọn Dạy học / tải lại) ⇒ vào màn mở đúng bước 3 · Dạy học
    mayChu()
    const goc = goi.getMockImplementation()!
    goi.mockImplementation(async (duong: string, b: Record<string, unknown>) => {
      const r = (await goc(duong, b)) as { ok: boolean; du: Record<string, unknown> }
      return duong === '/gv/buoi-hoc' && b.action === 'xem' ? { ...r, du: { ...r.du, tienTrinh: { buoc: 3, hoatDong: 'day-hoc', luc: NOW } } } : r
    })
    const r = render(<TheBaiDaDay />)
    await waitFor(() => expect(dangMo(r.container, 3)).toBe(true))
    expect(r.container.querySelector('[data-hd="day-hoc"]')!.hasAttribute('hidden')).toBe(false)
  })
})

describe('bảng Bài đang giao', () => {
  it('sửa hạn đúng bài/lớp; lỗi giữ ngày đã chọn, lưu xong thông báo tính lại; có thể gia hạn bài cũ',async()=>{
    const {container}=render(<BangBaiDangGiao />)
    const nut=await screen.findByRole('button',{name:'Sửa hạn Bài 8. Amine · 12 - Tinh Hoa'})
    fireEvent.click(nut)
    const o=screen.getByLabelText('Hạn mới của Bài 8. Amine · 12 - Tinh Hoa') as HTMLInputElement
    expect(o.min).toBe('2026-10-12');fireEvent.change(o,{target:{value:'2026-10-20'}})
    let thatBai=true
    goi7=b=>b.action==='sua_han'?(thatBai?{ok:false,chu:'Đang có ca kiểm tra mở.'}:{ok:true,du:{ok:true,goiId:b.goiId,han:b.han}}):{ok:true,du:b.action==='tong_hop'?TONG_HOP:b.goiId==='g7:thuong'?CT_THUONG:CT_TINH_HOA}
    fireEvent.click(screen.getByRole('button',{name:'Lưu hạn'}))
    expect((await screen.findByRole('alert')).textContent).toContain('ca kiểm tra mở')
    expect(o.value).toBe('2026-10-20');thatBai=false
    fireEvent.click(screen.getByRole('button',{name:'Lưu hạn'}))
    await screen.findByText(/Đã lưu hạn mới/)
    expect(lenh('/gv/goi-bai-7').filter(([,b])=>b.action==='sua_han').map(([,b])=>b)).toEqual(Array.from({length:2},()=>({action:'sua_han',goiId:'g7:tinh-hoa',hanCu:'2026-10-17',han:'2026-10-20'})))
    fireEvent.click(screen.getByRole('checkbox',{name:'Hiện cả bài đã quá hạn để sửa'}))
    await waitFor(()=>expect(container.querySelectorAll('[data-khoi="dong-giao"]')).toHaveLength(3))
    fireEvent.click(screen.getByRole('button',{name:'Sửa hạn Bài 6. Tinh bột · 11'}))
    expect((screen.getByLabelText('Hạn mới của Bài 6. Tinh bột · 11') as HTMLInputElement).value).toBe('2026-10-12')
    fireEvent.click(screen.getByRole('button',{name:'Hủy'}));expect(screen.queryByRole('button',{name:'Lưu hạn'})).toBeNull()
  })
  it('máy chủ chưa có lệnh sửa hạn không bị báo thành công giả; giữ ngày để thử lại',async()=>{
    render(<BangBaiDangGiao />)
    fireEvent.click(await screen.findByRole('button',{name:'Sửa hạn Bài 8. Amine · 12 - Tinh Hoa'}))
    fireEvent.click(screen.getByRole('button',{name:'Lưu hạn'}))
    expect((await screen.findByRole('alert')).textContent).toContain('Chưa nhận được xác nhận lưu hạn')
    expect(screen.queryByText(/Đã lưu hạn mới/)).toBeNull()
    expect(screen.getByRole('button',{name:'Lưu hạn'})).toBeTruthy()
  })
  it('mỗi gói còn hạn một dòng (hạn gần trước); hai thanh có nhãn; lớp chưa em nào nhận ⇒ câu nói thật thay vì 0%; lối sang bước 4', async () => {
    const sang = vi.fn()
    const { container } = render(<BangBaiDangGiao onMoChuaBai={sang} />)
    const vung = await screen.findByRole('region', { name: /^Bài đang giao/ })
    await waitFor(() => expect(container.querySelectorAll('[data-khoi="dong-giao"]')).toHaveLength(2))
    expect(within(vung).getByRole('heading', { level: 3 }).textContent).toBe('Bài đang giao · 2 lớp')
    const dong = [...container.querySelectorAll<HTMLTableRowElement>('[data-khoi="dong-giao"]')]
    // hạn gần trước: Lớp Thường (16/10) rồi Tinh Hoa (17/10); gói hết hạn 09/10 không hiện
    expect(dong.map((d) => d.querySelector('.gvv2-bdg-lop b')?.textContent)).toEqual(['12 - Lớp Thường', '12 - Tinh Hoa'])
    await waitFor(() => expect(dong[0]!.textContent).toContain('Chưa em nào nhận bài · kiểm lại danh sách lớp'))
    expect(dong[0]!.textContent).not.toContain('0%')
    expect(dong[0]!.textContent).toContain('0 em')
    await waitFor(() => expect(within(dong[1]!).getByRole('img', { name: 'Đã gặp câu gốc 50%' })).toBeTruthy())
    expect(within(dong[1]!).getByRole('img', { name: 'Đã tự làm 20%' })).toBeTruthy()
    expect(dong[1]!.textContent).toContain('2 em')
    expect(dong[1]!.textContent).toContain('T7 17/10')
    expect(dong[1]!.textContent).toContain('còn 6 ngày')
    // SỬA CÓ CHỦ ĐÍCH 13/10: chỉ một lệnh gọn cho cả bảng, không đọc từng đề/học sinh.
    expect(lenh('/gv/goi-bai-7').map(([, b]) => b)).toEqual([{ action: 'tong_hop' }])
    fireEvent.click(within(vung).getByRole('button', { name: 'Câu nhiều em sai của các bài này: sang Chữa câu khó & tính toán ›' }))
    expect(sang).toHaveBeenCalledTimes(1)
  })

  it('lỗi ⇒ lý do + Thử lại; máy chủ chưa bật ⇒ nói rõ; chưa gói nào còn hạn ⇒ hướng dẫn bổ sung bài', async () => {
    goi7 = () => ({ ok: false, loai: 'mang', chu: 'Không nối được máy chủ.' })
    const r1 = render(<BangBaiDangGiao />)
    expect((await screen.findByRole('alert')).textContent).toBe('Chưa tải được bài đang giao: Không nối được máy chủ.')
    goi7 = (b) => ({ ok: true, du: b.action === 'tong_hop' ? TONG_HOP : b.goiId === 'g7:thuong' ? CT_THUONG : CT_TINH_HOA })
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
    await waitFor(() => expect(r1.container.querySelectorAll('[data-khoi="dong-giao"]')).toHaveLength(2))
    expect(screen.queryByRole('alert')).toBeNull()
    r1.unmount()

    goi7 = () => ({ ok: true, du: { bat: false, goi: [] } })
    const r2 = render(<BangBaiDangGiao />)
    expect(await screen.findByText(/Máy chủ chưa bật giao bài 7 ngày/)).toBeTruthy()
    r2.unmount()

    goi7 = () => ({ ok: true, du: { bat: true, goi: [GOI[2]], thongKe: {} } })
    render(<BangBaiDangGiao />)
    expect(await screen.findByText(/Chưa lớp nào đang có bài giao\. Bấm “Bổ sung bài hôm nay” ở màn Hôm nay/)).toBeTruthy()
  })

  it('trong Hành trình: lối "Câu nhiều em sai … sang Chữa câu khó" (cuối khối Dạy học) mở hoạt động Chữa câu khó', async () => {
    const { container } = render(<HanhTrinhV2 />)
    await waitFor(() => expect(dangMo(container, 2)).toBe(true))
    fireEvent.click(the(container, /^Dạy học/))
    fireEvent.click(await screen.findByRole('button', { name: 'Câu nhiều em sai của các bài này: sang Chữa câu khó & tính toán ›' }, { timeout: 4000 }))
    expect(await screen.findByText('Giả: mục Chữa bài')).toBeTruthy()
    expect(dangMo(container, 3)).toBe(true)
    expect(container.querySelector('[data-hd="day-hoc"]')!.hasAttribute('hidden')).toBe(true)
  })
})

describe('phép thuần', () => {
  it('trạng thái bước: bước đang mở là "đang", bước khác theo cờ xong của chính nó (độc lập); bước mở mặc định', () => {
    expect(trangThaiBuoc([false, false, false, false], 1)).toEqual(['dang', 'cho', 'cho', 'cho'])
    expect(trangThaiBuoc([true, false, true, false], 4)).toEqual(['xong', 'cho', 'xong', 'dang'])
    expect(trangThaiBuoc([true, true, true, true], null)).toEqual(['xong', 'xong', 'xong', 'xong'])
    expect(buocMacDinh({ chiDinh: 4, dangTai: true, coMat: 0, nho: null })).toBe(4)
    expect(buocMacDinh({ chiDinh: null, dangTai: true, coMat: 3, nho: 3 })).toBeNull()
    expect(buocMacDinh({ chiDinh: null, dangTai: false, coMat: 0, nho: 3 })).toBe(1)
    expect(buocMacDinh({ chiDinh: null, dangTai: false, coMat: 5, nho: 3 })).toBe(3)
    expect(buocMacDinh({ chiDinh: null, dangTai: false, coMat: 5, nho: null })).toBe(2)
  })
  it('chữ ô Buổi dạy (giờ Việt Nam), gói còn hạn, dòng bảng, đếm lớp, chữ cái đầu tên, em vắng', () => {
    expect(chuBuoi(BUOI)).toBe('12A1 · Thứ Hai 12/10 · 18:00')
    expect(chuBuoi({ ...BUOI, lop: '', dangMo: false })).toBe('Mọi lớp · Thứ Hai 12/10 · 18:00 (đã kết thúc)')
    expect(goiDangGiao(GOI, '2026-10-12').map((g) => g.id)).toEqual(['g7:thuong', 'g7:tinh-hoa'])
    expect(dongBaiDangGiao(GOI[0]!, CT_TINH_HOA)).toMatchObject({ soEm: 2, pGap: 50, pTuLam: 20 })
    expect(dongBaiDangGiao(GOI[1]!, CT_THUONG)).toMatchObject({ soEm: 0, pGap: null, pTuLam: null })
    expect(chuDemGiao([{ lop: 'a' }, { lop: 'b' }])).toBe('2 lớp')
    expect(chuDemGiao([{ lop: 'a' }, { lop: 'a' }, { lop: 'b' }])).toBe('3 bài ở 2 lớp')
    expect(kyTuTen('Lê Khánh Vy', 'S1')).toBe('KV')
    expect(kyTuTen('', '12074')).toBe('74')
    expect(emVangBuoi({ buoi: BUOI, lopEm: EM, coMat: [{ sbd: 'S1', hoTen: '', luc: '', cach: 'ma' }] }).map((e) => e.sbd)).toEqual(['S2', 'S3'])
    expect(emVangBuoi({ buoi: { ...BUOI, lop: '' }, lopEm: EM, coMat: [] })).toEqual([])
  })
})
