// HÀNH TRÌNH CÒN 2 MỤC — thầy 12/10 (nguyên văn): "Chỗ này rất khó hiểu, chốt lại trong phần này tôi chỉ cần mục dạy học, gọi lên bảng đầu giờ và chữa
// câu khó tính toán và câu học sinh cần chữa. Bạn hãy thu gọn tối giản hết lại thành 2 mục và làm thật trực quan dễ hiểu khoa học đẹp mắt" (bản vẽ
// HanhTrinh-DayHoc đã duyệt). Kiểm:
//   · ĐÚNG 2 mục "Dạy học & đầu giờ" · "Chữa bài" (số cần chữa cạnh tên); khoá cũ ánh xạ (can-chua ⇒ Chữa bài; dau-gio, goi-7, nhip, bai-hang-ngay ⇒
//     Dạy học & đầu giờ);
//   · mục 1 là MỘT buổi dạy 4 bước với MỘT điểm danh dùng chung (máy chủ chỉ được hỏi "buổi đang mở" MỘT lần; Kiểm tra đầu giờ / Dạy học nhận `dd`
//     nên không tạo buổi riêng, không vẽ lại bước Điểm danh); thanh bước xong / đang / chờ; thẻ từng em gọi lên bảng chấm Đạt / Chưa đạt;
//   · bước 4: nút chính "Tick bài hôm nay" / "Bổ sung bài" mở bước Bài hôm nay; bảng "Bài đang giao" (mỗi gói một dòng, hai thanh có nhãn; lớp chưa
//     em nào nhận ⇒ "Chưa em nào nhận bài · kiểm lại danh sách lớp" thay vì 0%) + lối sang mục Chữa bài; lỗi / chưa bật / trống nói rõ.
// SỐ TỪ MÁY CHỦ GIẢ (không số bịa); tên em là tên giả.
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

import { mucHanhTrinh, useSoDemGv, type TheHanhTrinh } from '../src/lib/so-dem-gv'
import { chuBuoi, chuDemGiao, dongBaiDangGiao, goiDangGiao, trangThaiBuoc } from '../src/components/chien-dich/buoi-day-ui'
import { emVangBuoi } from '../src/components/day-hoc/DiemDanhBuoi'
import { kyTuTen } from '../src/components/day-hoc/KiemTraDauGio'
const { default: HanhTrinhV2, THE_HANH_TRINH } = await import('../src/components/chien-dich/HanhTrinhV2')
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

describe('hai mục + khoá cũ', () => {
  it('đúng 2 mục dạng nút lớn; số cần chữa cạnh "Chữa bài"; tiêu đề phụ mới; không nút chính ở đầu màn', async () => {
    expect(THE_HANH_TRINH).toEqual([
      ['day-hoc', 'Dạy học & đầu giờ'],
      ['chua-bai', 'Chữa bài'],
    ])
    useSoDemGv.getState().datSo({ canThayChua: 6 })
    const { container } = render(<HanhTrinhV2 />)
    const tab = screen.getAllByRole('tab')
    expect(tab.map((t) => t.textContent)).toEqual(['Dạy học & đầu giờ', 'Chữa bài · 6 chỗ cần chữa'])
    expect(tab.every((t) => t.querySelector('svg[aria-hidden="true"]'))).toBe(true)
    expect(tab[0]!.getAttribute('aria-selected')).toBe('true')
    expect(screen.getByText('Thầy dạy và tick bài, app tự lập bài cho từng em mỗi ngày')).toBeTruthy()
    expect(container.querySelector('.gvv2-dau button')).toBeNull()
    fireEvent.click(tab[1]!)
    expect(await screen.findByText('Giả: mục Chữa bài')).toBeTruthy()
    expect(screen.getByRole('tab', { name: /^Chữa bài/ }).getAttribute('aria-selected')).toBe('true')
  })

  it('khoá cũ không gãy: can-chua ⇒ Chữa bài; dau-gio · goi-7 · nhip · bai-hang-ngay ⇒ Dạy học & đầu giờ', () => {
    const bang: [TheHanhTrinh | string, string][] = [
      ['day-hoc', 'day-hoc'], ['chua-bai', 'chua-bai'], ['can-chua', 'chua-bai'],
      ['dau-gio', 'day-hoc'], ['goi-7', 'day-hoc'], ['nhip', 'day-hoc'], ['bai-hang-ngay', 'day-hoc'], ['chien-dich', 'day-hoc'], ['la', 'day-hoc'],
    ]
    for (const [k, muc] of bang) expect(mucHanhTrinh(k), k).toBe(muc)
    for (const [k, nhan] of [['can-chua', /^Chữa bài/], ['dau-gio', 'Dạy học & đầu giờ'], ['nhip', 'Dạy học & đầu giờ']] as const) {
      const r = render(<HanhTrinhV2 theDau={k} />)
      expect(screen.getByRole('tab', { name: nhan }).getAttribute('aria-selected'), k).toBe('true')
      r.unmount()
    }
  })
})

describe('mục Dạy học & đầu giờ: MỘT buổi dạy 4 bước', () => {
  it('MỘT điểm danh dùng chung: hỏi buổi đang mở đúng một lần; chỉ bước 1 vẽ Điểm danh; bốn bước theo thứ tự; thanh bước xong/đang/chờ', async () => {
    const { container } = render(<TheBaiDaDay />)
    await screen.findByRole('heading', { level: 2, name: 'Gọi lên bảng đầu giờ' })
    await screen.findByRole('heading', { level: 2, name: 'Tick bài vừa dạy' })
    await screen.findByRole('img', { name: 'Có mặt 2 trên 3 em' })
    // một điểm danh: Kiểm tra đầu giờ + Dạy học nhận `dd` ⇒ không tự hỏi buổi / không vẽ lại bước Điểm danh
    expect(lenh('/gv/buoi-hoc', 'dang-mo')).toHaveLength(1)
    // 12/10C — thầy 12/10 duyệt bản vẽ GV-DiemDanh: tiêu đề bước 1 đổi thành "Điểm danh — việc đầu tiên của buổi" (sửa có chủ đích)
    expect(screen.getAllByRole('heading', { level: 2, name: 'Điểm danh — việc đầu tiên của buổi' })).toHaveLength(1)
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull()
    expect([...container.querySelectorAll('[data-buoc] h2, .dh-buoc[data-buoc] h2')].map((h) => h.textContent)).toEqual(['Điểm danh — việc đầu tiên của buổi', 'Gọi lên bảng đầu giờ', 'Dạy và chiếu câu', 'Tick bài vừa dạy'])
    // bước 1: thanh có mặt / sĩ số + tên em vắng (em lớp khác không tính vắng)
    expect(screen.getByRole('img', { name: 'Có mặt 2 trên 3 em' })).toBeTruthy()
    // 12/10C — thầy 12/10 duyệt bản vẽ: tên em vắng nằm trong ô đỏ "Vắng N em — k em đang Lười" (máy giả chưa có lệnh Nhịp học ⇒ chỉ "Vắng 1 em")
    const oVang = container.querySelector<HTMLElement>('[data-khoi="em-vang"]')!
    expect(within(oVang).getByText('Vắng 1 em')).toBeTruthy()
    expect(within(oVang).getByText('Bùi Quang Minh')).toBeTruthy()
    // ô Buổi dạy + thanh bước: điểm danh xong, đầu giờ còn một em chưa chấm ⇒ đang
    expect((screen.getByRole('combobox', { name: /^Buổi dạy/ }) as HTMLSelectElement).value).toBe('BH-12')
    const buoc = within(screen.getByRole('list', { name: 'Bốn bước của buổi dạy' })).getAllByRole('button')
    await waitFor(() => expect(buoc.map((b) => b.getAttribute('data-trang-thai'))).toEqual(['xong', 'dang', 'cho', 'cho']))
    expect(buoc[1]!.getAttribute('aria-current')).toBe('step')
    expect(buoc[0]!.textContent).toBe('1 Điểm danh · đã xong')
  })

  it('bước 2 gọi lên bảng: thẻ từng em, Đạt / Chưa đạt đi đường /gv/dau-gio cham; chấm hết ⇒ bước 2 xong', async () => {
    render(<TheBaiDaDay />)
    const buoc2 = await screen.findByRole('region', { name: 'Gọi lên bảng đầu giờ' })
    await within(buoc2).findByText('Đặng Quốc Việt')
    expect(within(buoc2).getByText('Đã ghi: Đạt')).toBeTruthy()
    expect(within(buoc2).getByText('Lịch sử câu này: Đúng 08/10 (Học theo kế hoạch)')).toBeTruthy()
    expect(within(buoc2).getByRole('button', { name: 'Chiếu lên bảng' })).toBeTruthy()
    // hai em có mặt đều đã được gọi ⇒ nút Gọi thêm nói thật và khoá
    expect(within(buoc2).getByRole('button', { name: 'Đã gọi hết em có mặt' }).hasAttribute('disabled')).toBe(true)
    expect(within(buoc2).getByRole('button', { name: /Kết thúc kiểm tra/ })).toBeTruthy()
    expect(within(buoc2).getAllByRole('checkbox', { name: /Thầy đã chữa/ })).toHaveLength(2)
    fireEvent.click(within(buoc2).getByRole('button', { name: 'Quốc Việt: Đạt' }))
    await waitFor(() => expect(lenh('/gv/dau-gio', 'cham').map(([, b]) => b)).toEqual([expect.objectContaining({ buoiId: 'BH-12', sbd: 'S2', qid: 'Q-5', dat: true })]))
    await waitFor(() => expect(within(buoc2).getAllByText('Đã ghi: Đạt')).toHaveLength(2))
    const buoc = within(screen.getByRole('list', { name: 'Bốn bước của buổi dạy' })).getAllByRole('button')
    await waitFor(() => expect(buoc.map((b) => b.getAttribute('data-trang-thai'))).toEqual(['xong', 'xong', 'dang', 'cho']))
  })

  it('bước 4: Bài hôm nay gập sẵn; "Tick bài hôm nay" mở bước ấy; lớp đã tick hôm nay ⇒ nút đổi thành "Bổ sung bài" và bước 4 xong', async () => {
    const { unmount } = render(<TheBaiDaDay />)
    const buoc4 = await screen.findByRole('region', { name: 'Tick bài vừa dạy' })
    const nut = await within(buoc4).findByRole('button', { name: 'Tick bài hôm nay' })
    expect(nut.getAttribute('aria-expanded')).toBe('false')
    expect(buoc4.querySelector('[data-khoi="bai-hom-nay"]')).toBeNull()
    fireEvent.click(nut)
    await waitFor(() => expect(buoc4.querySelector('[data-khoi="bai-hom-nay"]')).toBeTruthy())
    expect(nut.getAttribute('aria-expanded')).toBe('true')
    unmount()

    tickLuc = '2026-10-12T02:30:00Z'
    render(<TheBaiDaDay />)
    const buoc4b = await screen.findByRole('region', { name: 'Tick bài vừa dạy' })
    expect(await within(buoc4b).findByRole('button', { name: 'Bổ sung bài' })).toBeTruthy()
    const buoc = within(screen.getByRole('list', { name: 'Bốn bước của buổi dạy' })).getAllByRole('button')
    await waitFor(() => expect(buoc[3]!.getAttribute('data-trang-thai')).toBe('xong'))
  })

  it('OMNI tắt ⇒ bước 4 nói rõ cần bật ở đâu, không nút Tick; vào từ Hôm nay (Bổ sung bài) ⇒ mở sẵn bước Bài hôm nay', async () => {
    co = { bat: false, lop: [], sbd: [] }
    const r = render(<TheBaiDaDay />)
    const buoc4 = await screen.findByRole('region', { name: 'Tick bài vừa dạy' })
    expect(await within(buoc4).findByText('Tick bài vừa dạy cần bật OMNI cho lớp ở Cài đặt › OMNI (theo lớp).')).toBeTruthy()
    expect(within(buoc4).queryByRole('button', { name: /Tick bài hôm nay|Bổ sung bài/ })).toBeNull()
    r.unmount()

    co = { bat: true, lop: ['12A1'], sbd: [] }
    const cuon = vi.fn()
    const goc = Element.prototype.scrollIntoView
    Element.prototype.scrollIntoView = cuon
    try {
      render(<TheBaiDaDay lanBoSung={1} />)
      const b4 = await screen.findByRole('region', { name: 'Tick bài vừa dạy' })
      await waitFor(() => expect(b4.querySelector('[data-khoi="bai-hom-nay"]')).toBeTruthy())
      expect(cuon).toHaveBeenCalled()
    } finally {
      Element.prototype.scrollIntoView = goc
    }
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
  it('mỗi gói còn hạn một dòng (hạn gần trước); hai thanh có nhãn; lớp chưa em nào nhận ⇒ câu nói thật thay vì 0%; lối sang Chữa bài', async () => {
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
    fireEvent.click(within(vung).getByRole('button', { name: 'Câu nhiều em sai của các bài này nằm ở mục Chữa bài ›' }))
    expect(sang).toHaveBeenCalledTimes(1)
  })

  it('lỗi ⇒ lý do + Thử lại; máy chủ chưa bật ⇒ nói rõ; chưa gói nào còn hạn ⇒ hướng dẫn tick bài', async () => {
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
    expect(await screen.findByText(/Chưa lớp nào đang có bài giao\. Tick bài vừa dạy ở trên/)).toBeTruthy()
  })

  it('trong Hành trình: lối "Câu nhiều em sai … mục Chữa bài ›" chuyển sang mục Chữa bài', async () => {
    render(<HanhTrinhV2 />)
    fireEvent.click(await screen.findByRole('button', { name: 'Câu nhiều em sai của các bài này nằm ở mục Chữa bài ›' }, { timeout: 4000 }))
    expect(screen.getByRole('tab', { name: /^Chữa bài/ }).getAttribute('aria-selected')).toBe('true')
    expect(await screen.findByText('Giả: mục Chữa bài')).toBeTruthy()
  })
})

describe('phép thuần', () => {
  it('trạng thái bước: bước chưa xong đầu tiên là "đang", sau nó là "chờ"', () => {
    expect(trangThaiBuoc([false, false, false, false])).toEqual(['dang', 'cho', 'cho', 'cho'])
    expect(trangThaiBuoc([true, false, true, false])).toEqual(['xong', 'dang', 'xong', 'cho'])
    expect(trangThaiBuoc([true, true, true, true])).toEqual(['xong', 'xong', 'xong', 'xong'])
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
