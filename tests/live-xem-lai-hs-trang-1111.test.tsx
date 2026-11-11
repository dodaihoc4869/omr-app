// XEM LẠI LIVE — MÁY EM (đợt X2, thầy chốt build 11/11; đặc tả docs/dac-ta-live-xem-lai-1011.md mục 2.1, 3, 4.5, 4.7). Thành phần THẬT + máy chủ giả (fetch):
//   · dòng «Live» ở tấm «Thêm» có chip «N buổi mới»; `GET /hs/live-ds` chỉ gọi một lần trong 10 phút;
//   · trạng thái danh sách: đang tải (khung xương) · rỗng · lỗi + «Thử lại» · mất mạng hiện danh sách đã lưu · buổi đang dựng tự đổi khi xong;
//   · thứ tự đoạn RIÊNG từng em: «Câu em chưa đúng» ⇒ «Em lên bảng» ⇒ còn lại;
//   · AN TOÀN: không hiện câu / đoạn / kết quả ngoài `buoi.json`; chỉ gọi đúng ba lệnh; không lộ số báo danh của bạn lên bảng;
//   · 404 ⇒ «Thầy đã gỡ buổi này.»; trình phát mở được, có «Đoạn 3/5», ba tốc độ, «Bỏ khoảng lặng», buổi không tiếng có dòng báo.
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { createRef } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { BuoiLiveJson, TraLiveBuoiHs, TraLiveDsHs } from '../src/lib/live/xem-lai-kieu'
import { MenuDocTrong } from '../src/components/hoc-tap/TrongHs'
import XemBuoiLive, { ManLiveHs, demBuoiMoi } from '../src/screens/live-xem-lai/hs'
import { HOI_LAI_DANG_DUNG_MS } from '../src/screens/live-xem-lai/hs/kieu'
import { _quenDs, NHO_DS_MS } from '../src/screens/live-xem-lai/hs/may-chu'
import { chuDaXem, danhDauXem, docDaXem, khoaEm } from '../src/screens/live-xem-lai/hs/nho-may'
import { dangXemNhat, doanHopLe, dongThoiGian, sapDoan } from '../src/screens/live-xem-lai/hs/sap-doan'
import { dongNgay, gioPhat, gioVn, nhanThang, tenBai, tenDayDu } from '../src/screens/live-xem-lai/hs/ten-hien'
import { ID_BUOI_GIA, taoBuoiGia, taoDsGia, taoRiengGia } from './_live-xem-lai-gia'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-chu' }))

const TOKEN = 'tk-em-1'
type KichBan = { ds?: () => TraLiveDsHs | 'loi' | 'mat' | 'treo'; rieng?: () => TraLiveBuoiHs | 'go' | 'mat'; buoi?: () => BuoiLiveJson | 'go'; net?: Uint8Array }
let kb: KichBan = {}
let goi: string[] = []
const tra = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json' } })
function datMayChu(k: KichBan) {
  kb = k; goi = []
  vi.stubGlobal('fetch', vi.fn(async (vao: RequestInfo | URL, khoiTao?: RequestInit) => {
    const u = new URL(String(vao))
    goi.push(u.pathname)
    if (u.pathname === '/hs/live-ds') {
      expect(u.searchParams.get('token')).toBe(TOKEN)
      const d = kb.ds?.() ?? { buoi: [] }
      if (d === 'treo') return new Promise<Response>(() => {})
      if (d === 'mat') throw new TypeError('Failed to fetch')
      return d === 'loi' ? tra({ ok: false }, 500) : tra(d)
    }
    if (u.pathname === '/hs/live-buoi') {
      const d = kb.rieng?.() ?? 'go'
      if (d === 'mat') throw new TypeError('Failed to fetch')
      return d === 'go' ? tra({ ok: false }, 404) : tra(d)
    }
    const m = /^\/live-tep\/([^/]+)\/([^/]+)$/.exec(u.pathname)
    if (m && m[2] === 'buoi.json') { const d = kb.buoi?.() ?? 'go'; return d === 'go' ? tra({}, 404) : tra(d) }
    if (m && m[2] === 'net.bin' && kb.net) {
      const r = /bytes=(\d+)-(\d+)/.exec(String((khoiTao?.headers as Record<string, string> | undefined)?.Range ?? ''))
      const a = r ? +r[1]! : 0, b = r ? +r[2]! : kb.net.length - 1
      return new Response(kb.net.slice(a, b + 1), { status: r ? 206 : 200 })
    }
    return tra({ ok: false }, 404)
  }))
}
const cho = (ms: number) => act(async () => { await new Promise((r) => setTimeout(r, ms)) })

beforeEach(() => { localStorage.clear(); _quenDs() })
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.useRealTimers() })

describe('chữ hiện + luật xếp (thuần)', () => {
  const { buoi } = taoBuoiGia()
  it('tên buổi, ngày, giờ Việt Nam', () => {
    expect(tenBai(buoi)).toBe('Bài 8. Amine')
    expect(tenBai({ ...buoi, tenThay: '  Chữa đề amine  ' })).toBe('Chữa đề amine')
    expect(tenBai({ ...buoi, tenTuDong: '', tenThay: null })).toBe('Buổi live 12A1')
    expect(dongNgay(buoi)).toBe('Thứ Ba 10/11/2026 · 12A1')
    expect(gioVn(buoi.batLuc)).toBe('19:34')
    expect(tenDayDu({ ...buoi, soCau: 5, giayLive: 48 * 60 })).toBe('Thứ Ba 10/11 · 12A1 · Bài 8. Amine · 5 câu · 48 phút')
    expect(nhanThang('2026-10-27', 2026)).toBe('Tháng 10')
    expect(nhanThang('2025-12-02', 2026)).toBe('Tháng 12/2025')
    expect(gioPhat(527_000)).toBe('8:47')
    expect(gioPhat(3_727_000)).toBe('1:02:07')
  })
  it('thứ tự đoạn riêng từng em: câu em chưa đúng ⇒ em lên bảng ⇒ còn lại theo thứ tự buổi', () => {
    // em sai câu 4 (không lên bảng), lên bảng câu 2 (làm đúng), các câu khác đúng
    const luot = (so: number) => buoi.cau.find((c) => c.so === so)!.luot
    const rieng: TraLiveBuoiHs = { id: buoi.id, ban: 1, ve: 'v', ketQua: Object.fromEntries(buoi.cau.map((c) => [c.luot, { dung: c.so !== 4 }])), lenBang: [luot(2)] }
    const ds = sapDoan(buoi, rieng)
    expect(ds.map((e) => e.cau.so)).toEqual([4, 2, 1, 3, 5])
    expect(ds[0]!.nhan).toEqual(['chua-dung'])
    expect(ds[1]!.nhan).toEqual(['em-len-bang'])
    expect(ds[3]!.nhan).toEqual(['dang-xem'])
    // không có kết quả riêng (app thầy mở xem) ⇒ đúng thứ tự buổi
    expect(sapDoan(buoi, null).map((e) => e.cau.so)).toEqual([1, 2, 3, 4, 5])
    // em vừa sai vừa lên bảng câu 3 ⇒ đứng đầu, mang cả hai nhãn
    expect(sapDoan(buoi, taoRiengGia(buoi))[0]).toMatchObject({ cau: { so: 3 }, nhan: ['chua-dung', 'em-len-bang', 'dang-xem'] })
  })
  it('đoạn đáng xem nhất + dòng thời gian', () => {
    expect(dangXemNhat(buoi)?.chu).toBe('Đáng xem nhất: Câu 3 · cả lớp sai nhiều nhất (46 % đúng)')
    expect(dangXemNhat({ ...buoi, doan: buoi.doan.map((d) => ({ ...d, dangXem: null })) })).toBeNull()
    const k = dongThoiGian(buoi)
    expect(k.filter((x) => x.doan).map((x) => x.cau)).toEqual([1, 2, 3, 4, 5])
    expect(k.filter((x) => x.hay).map((x) => x.cau)).toEqual([3])
    expect(k[0]!.doan).toBeNull() // đầu buổi: khúc xám
    expect(k.reduce((s, x) => s + x.phan, 0)).toBeCloseTo(1, 2)
  })
  it('«Đã xem x/y đoạn» nhớ trên máy theo em + theo bản dựng', () => {
    const k = khoaEm(TOKEN)
    expect(chuDaXem(0, 6)).toBe('Chưa xem'); expect(chuDaXem(4, 6)).toBe('Đã xem 4/6 đoạn'); expect(chuDaXem(4, 4)).toBe('Đã xem hết 4 đoạn')
    danhDauXem(k, 'b', 1, 3); danhDauXem(k, 'b', 1, 3); danhDauXem(k, 'b', 1, 5)
    expect(docDaXem(k, 'b', 1)).toEqual([3, 5])
    expect(docDaXem(k, 'b', 2)).toEqual([]) // buổi dựng lại ⇒ đoạn đã đổi
    expect(docDaXem(khoaEm('tk-em-khac'), 'b', 1)).toEqual([]) // em khác dùng chung máy
  })
})

describe('danh sách «Xem lại Live»', () => {
  const { buoi } = taoBuoiGia()
  it('đang tải (khung xương) rồi rỗng: nói vì sao + «Về Lộ trình»', async () => {
    let xong: (d: TraLiveDsHs) => void = () => {}
    const hua = new Promise<TraLiveDsHs>((r) => { xong = r })
    datMayChu({})
    ;(fetch as unknown as ReturnType<typeof vi.fn>).mockImplementationOnce(async () => tra(await hua))
    const dong = vi.fn()
    render(<ManLiveHs token={TOKEN} dong={dong} />)
    expect(document.querySelector('.xl-xuong')).not.toBeNull()
    expect(screen.getByRole('main').getAttribute('aria-busy')).toBe('true')
    await act(async () => { xong({ buoi: [] }) })
    await screen.findByText('Lớp em chưa có buổi live nào')
    expect(document.querySelector('.xl-xuong')).toBeNull()
    expect(screen.getAllByRole('button', { name: 'Về Lộ trình' })).toHaveLength(2) // nút lùi đầu trang + nút trong thẻ rỗng
    fireEvent.click(within(document.querySelector('.xl-trong') as HTMLElement).getByRole('button', { name: 'Về Lộ trình' }))
    expect(dong).toHaveBeenCalled()
  })
  it('có buổi: thẻ lớn buổi mới nhất (một nút chính) + buổi cũ theo tháng; mở buổi thì hết «Mới»', async () => {
    datMayChu({ ds: () => taoDsGia(buoi), rieng: () => taoRiengGia(buoi), buoi: () => buoi })
    render(<ManLiveHs token={TOKEN} dong={() => {}} />)
    const nut = await screen.findByRole('button', { name: /Xem buổi này/ })
    expect(document.querySelectorAll('.xl-nut.chinh')).toHaveLength(1)
    expect(screen.getByText('Lớp 12A1 · 5 buổi')).toBeTruthy()
    expect(screen.getByText('Mới')).toBeTruthy()
    expect(screen.getByText('Em lên bảng câu 3')).toBeTruthy()
    expect(screen.getAllByText(/^Tháng 1[01]$/).map((e) => e.textContent)).toEqual(['Tháng 11', 'Tháng 10'])
    expect(screen.getByText('6 câu · 52 phút · Chưa xem')).toBeTruthy()
    expect(await demBuoiMoi(TOKEN)).toBe(5)
    fireEvent.click(nut)
    await screen.findByText('Phát cả 5 đoạn · 29 phút')
    expect(await demBuoiMoi(TOKEN)).toBe(4) // buổi vừa mở không còn là «mới»
    fireEvent.click(screen.getByRole('button', { name: 'Về danh sách buổi live' }))
    await screen.findByRole('button', { name: /Xem buổi này/ })
    expect(screen.queryByText('Mới')).toBeNull()
  })
  it('`/hs/live-ds` nhớ 10 phút: mở «Thêm» nhiều lần chỉ gọi máy chủ một lần; quá 10 phút gọi lại', async () => {
    datMayChu({ ds: () => taoDsGia(buoi) })
    expect(await demBuoiMoi(TOKEN)).toBe(5)
    expect(await demBuoiMoi(TOKEN)).toBe(5)
    expect(goi.filter((p) => p === '/hs/live-ds')).toHaveLength(1)
    const nay = Date.now()
    vi.spyOn(Date, 'now').mockReturnValue(nay + NHO_DS_MS + 1)
    expect(await demBuoiMoi(TOKEN)).toBe(5)
    expect(goi.filter((p) => p === '/hs/live-ds')).toHaveLength(2)
    vi.restoreAllMocks()
  })
  it('lỗi máy chủ: «Chưa tải được. Em thử lại.» + «Thử lại» tải lại được', async () => {
    let hong = true
    datMayChu({ ds: () => (hong ? 'loi' : taoDsGia(buoi)) })
    render(<ManLiveHs token={TOKEN} dong={() => {}} />)
    await screen.findByText('Chưa tải được. Em thử lại.')
    hong = false
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
    await screen.findByRole('button', { name: /Xem buổi này/ })
  })
  it('mất mạng: hiện danh sách đã lưu trên máy + dải báo; chưa từng lưu thì báo lỗi', async () => {
    datMayChu({ ds: () => 'mat' })
    const { unmount } = render(<ManLiveHs token={TOKEN} dong={() => {}} />)
    await screen.findByText('Chưa tải được. Em thử lại.')
    unmount()
    datMayChu({ ds: () => taoDsGia(buoi) })
    expect(await demBuoiMoi(TOKEN)).toBe(5) // lần có mạng: danh sách được cất trên máy
    _quenDs()
    datMayChu({ ds: () => 'mat' })
    render(<ManLiveHs token={TOKEN} dong={() => {}} />)
    await screen.findByText('Mất mạng. Đang hiện danh sách đã lưu trên máy.')
    expect(screen.getByRole('button', { name: /Xem buổi này/ })).toBeTruthy()
    expect(localStorage.getItem(`ddh.live.ds.${khoaEm(TOKEN)}`)).not.toContain('ve-gia') // vé không cất trên máy
  })
  it('buổi vừa xong đang dựng: có thẻ báo, tự hỏi lại và tự đổi thành buổi thường khi xong', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const ds = taoDsGia(buoi)
    let dang = true
    datMayChu({ ds: () => ({ buoi: ds.buoi.map((b, i) => (i === 0 && dang ? { ...b, trangThai: 'dang_xu_ly' as const, tienDo: 62, ve: null } : b)) }) })
    render(<ManLiveHs token={TOKEN} dong={() => {}} />)
    await screen.findByText(/đang được dựng/)
    expect(screen.getByText(/thường xong dưới 1 phút/)).toBeTruthy()
    expect(screen.getByText('Lớp 12A1 · 4 buổi')).toBeTruthy() // buổi đang dựng chưa tính là buổi xem được
    dang = false
    await act(async () => { await vi.advanceTimersByTimeAsync(HOI_LAI_DANG_DUNG_MS + 50) })
    await waitFor(() => expect(screen.queryByText(/đang được dựng/)).toBeNull())
    expect(screen.getByText('Lớp 12A1 · 5 buổi')).toBeTruthy()
    expect(goi.filter((p) => p === '/hs/live-ds').length).toBeGreaterThanOrEqual(2)
  })
})

describe('trang buổi live', () => {
  it('đủ phần: bìa, dòng thời gian, bảng vàng, danh sách đoạn riêng của em, thẻ câu; lời giải mở tại chỗ', async () => {
    const { buoi } = taoBuoiGia()
    datMayChu({ rieng: () => taoRiengGia(buoi), buoi: () => buoi })
    localStorage.setItem('omr_student_portal_auth', JSON.stringify({ token: TOKEN }))
    render(<XemBuoiLive id={ID_BUOI_GIA} ve="ve-gia" nguon="hs" dong={() => {}} />)
    await screen.findByText('Phát cả 5 đoạn · 29 phút')
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Bài 8. Amine')
    expect(screen.getByText('Thứ Ba 10/11/2026 · 12A1 · live từ 19:34')).toBeTruthy()
    expect(screen.getByText('Đáng xem nhất: Câu 3 · cả lớp sai nhiều nhất (46 % đúng)')).toBeTruthy()
    expect(screen.getByText('Đội Kali thắng')).toBeTruthy()
    expect(screen.getByText('2.450 kJ · hơn đội nhì 210 kJ')).toBeTruthy()
    expect(screen.getByText('Chuỗi đúng dài nhất: Vũ Hà My · 5 câu liền')).toBeTruthy()
    // danh sách đoạn: câu em chưa đúng + em lên bảng đứng đầu
    const dsDoan = screen.getByRole('region', { name: 'Danh sách đoạn chữa bài' })
    const so = [...dsDoan.querySelectorAll('.xl-doan .o')].map((e) => e.textContent)
    expect(so).toEqual(['3', '1', '2', '4', '5'])
    expect(within(dsDoan.querySelector('.xl-doan') as HTMLElement).getByText('Câu em chưa đúng')).toBeTruthy()
    expect(within(dsDoan.querySelector('.xl-doan') as HTMLElement).getByText('Em lên bảng')).toBeTruthy()
    // thẻ câu 3
    const c3 = screen.getByRole('region', { name: 'Câu 3' })
    expect(within(c3).getByText('Em chưa đúng')).toBeTruthy()
    expect(within(c3).getByText('Lớp làm đúng 46 %')).toBeTruthy()
    expect(within(c3).getByText('69/150 em')).toBeTruthy()
    expect(within(c3).getByText('12,95')).toBeTruthy()
    expect(within(c3).getByText('Chưa đạt')).toBeTruthy()
    expect(within(c3).getByText('Minh Anh')).toBeTruthy()
    expect(within(c3).getByRole('button', { name: /Phát đoạn chữa câu 3 · 8:47/ })).toBeTruthy()
    expect(within(screen.getByRole('region', { name: 'Câu 1' })).getByText('Em làm đúng')).toBeTruthy()
    expect(within(screen.getByRole('region', { name: 'Câu 1' })).getByText('Đạt')).toBeTruthy()
    const moGiai = within(c3).getByRole('button', { name: 'Xem lời giải của câu 3' })
    expect(moGiai.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(moGiai)
    expect(moGiai.getAttribute('aria-expanded')).toBe('true')
    await waitFor(() => expect(c3.querySelector('.xl-giai')?.textContent).toMatch(/12,95/))
    fireEvent.click(within(screen.getByRole('region', { name: 'Câu 5' })).getByRole('button', { name: 'Xem lời giải của câu 5' }))
    expect(screen.getByText('Kho chưa có lời giải cho câu này.')).toBeTruthy()
    // không lộ số báo danh của bạn lên bảng
    for (const d of buoi.doan) expect(document.body.textContent).not.toContain(d.lenBang!.sbd)
  })
  it('AN TOÀN: không hiện câu / đoạn / kết quả ngoài buoi.json; chỉ gọi đúng ba lệnh', async () => {
    const { buoi: du } = taoBuoiGia()
    // máy chủ đã lọc câu 4 (chưa mở đáp án) khỏi `cau`; giả sử chỉ mục còn sót đoạn trỏ tới câu 4 và kết quả riêng còn lượt của câu 4
    const c4 = du.cau.find((c) => c.so === 4)!
    const buoi: BuoiLiveJson = { ...du, cau: du.cau.filter((c) => c.so !== 4) }
    const rieng = taoRiengGia(du)
    rieng.ketQua[c4.luot] = { dung: false }; rieng.ketQua[99] = { dung: false }; rieng.lenBang.push(c4.luot)
    datMayChu({ rieng: () => rieng, buoi: () => buoi })
    localStorage.setItem('omr_student_portal_auth', JSON.stringify({ token: TOKEN }))
    render(<XemBuoiLive id={ID_BUOI_GIA} ve="ve-gia" nguon="hs" dong={() => {}} />)
    await screen.findByText('Phát cả 4 đoạn · 24 phút')
    expect(doanHopLe(buoi).map((d) => d.cau)).toEqual([1, 2, 3, 5])
    expect(screen.queryByRole('region', { name: 'Câu 4' })).toBeNull()
    expect(document.body.textContent).not.toContain(String(c4.cau.text))
    expect(document.body.textContent).not.toContain(c4.dang)
    expect(document.body.textContent).not.toContain('0,05') // đáp án câu 4
    expect([...document.querySelectorAll('.xl-doan .o')].map((e) => e.textContent)).toEqual(['3', '1', '2', '5'])
    expect([...document.querySelectorAll('.xl-tg .chua b')].map((e) => e.textContent)).toEqual(['1', '2', '3', '5'])
    await cho(50)
    // chỉ ba lệnh của hợp đồng (trang buổi: live-buoi + buoi.json); không lệnh lấy đề / đáp án nào khác
    for (const p of goi) expect(p === '/hs/live-buoi' || p.startsWith(`/live-tep/${ID_BUOI_GIA}/`)).toBe(true)
  })
  it('app thầy mở xem (nguon gv): không gọi `/hs/live-buoi`, không có phần riêng từng em', async () => {
    const { buoi } = taoBuoiGia()
    datMayChu({ buoi: () => buoi })
    render(<XemBuoiLive id={ID_BUOI_GIA} ve="ve-thay" nguon="gv" dong={() => {}} />)
    await screen.findByText('Phát cả 5 đoạn · 29 phút')
    expect(goi).not.toContain('/hs/live-buoi')
    expect(screen.queryByText('Em chưa đúng')).toBeNull(); expect(screen.queryByText('Em làm đúng')).toBeNull(); expect(screen.queryByText('Câu em chưa đúng')).toBeNull()
    expect([...document.querySelectorAll('.xl-doan .o')].map((e) => e.textContent)).toEqual(['1', '2', '3', '4', '5'])
    expect(screen.getByRole('button', { name: 'Về Lịch sử Live' })).toBeTruthy()
  })
  it('thầy đã gỡ buổi (404) ⇒ «Thầy đã gỡ buổi này.» + «Về danh sách»; lỗi khác ⇒ «Thử lại»', async () => {
    datMayChu({ rieng: () => 'go', buoi: () => 'go' })
    const dong = vi.fn()
    localStorage.setItem('omr_student_portal_auth', JSON.stringify({ token: TOKEN }))
    const { unmount } = render(<XemBuoiLive id="da-go" ve="ve" nguon="hs" dong={dong} />)
    await screen.findByText('Thầy đã gỡ buổi này.')
    fireEvent.click(screen.getByRole('button', { name: 'Về danh sách' }))
    expect(dong).toHaveBeenCalled()
    unmount()
    const { buoi } = taoBuoiGia()
    let mat = true
    datMayChu({ rieng: () => (mat ? 'mat' : taoRiengGia(buoi)), buoi: () => buoi })
    ;(fetch as unknown as ReturnType<typeof vi.fn>).mockImplementation(async (vao: RequestInfo | URL) => { if (mat) throw new TypeError('Failed to fetch'); return String(vao).includes('/hs/live-buoi') ? tra(taoRiengGia(buoi)) : tra(buoi) })
    render(<XemBuoiLive id={ID_BUOI_GIA} ve="ve" nguon="hs" dong={() => {}} />)
    await screen.findByText('Chưa tải được. Em thử lại.')
    mat = false
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
    await screen.findByText('Phát cả 5 đoạn · 29 phút')
  })
  it('vé từ danh sách đã hết hạn ⇒ dùng vé mới của `/hs/live-buoi`', async () => {
    const { buoi } = taoBuoiGia()
    datMayChu({ rieng: () => taoRiengGia(buoi, 've-moi'), buoi: () => buoi })
    const goc = fetch as unknown as ReturnType<typeof vi.fn>, cu = goc.getMockImplementation()!
    goc.mockImplementation(async (vao: RequestInfo | URL, kt?: RequestInit) => (String(vao).includes('buoi.json') && String(vao).includes('ve=ve-cu') ? tra({ ok: false }, 403) : cu(vao, kt)))
    localStorage.setItem('omr_student_portal_auth', JSON.stringify({ token: TOKEN }))
    render(<XemBuoiLive id={ID_BUOI_GIA} ve="ve-cu" nguon="hs" dong={() => {}} />)
    await screen.findByText('Phát cả 5 đoạn · 29 phút')
    expect(goc.mock.calls.some((c) => String(c[0]).includes('buoi.json') && String(c[0]).includes('ve=ve-moi'))).toBe(true)
  })
})

describe('trình phát (mở từ thẻ câu)', () => {
  it('mở đoạn câu 3: «Đoạn 3/5», thanh tua 5 khúc theo câu, ba tốc độ, «Bỏ khoảng lặng», đóng được; tải net.bin theo Range từ mốc bảng', async () => {
    const { buoi, net } = taoBuoiGia()
    datMayChu({ rieng: () => taoRiengGia(buoi), buoi: () => buoi, net })
    localStorage.setItem('omr_student_portal_auth', JSON.stringify({ token: TOKEN }))
    render(<XemBuoiLive id={ID_BUOI_GIA} ve="ve-gia" nguon="hs" dong={() => {}} />)
    await screen.findByText('Phát cả 5 đoạn · 29 phút')
    fireEvent.click(within(screen.getByRole('region', { name: 'Câu 3' })).getByRole('button', { name: /Phát đoạn chữa câu 3/ }))
    const phat = await screen.findByRole('dialog', { name: /Xem lại đoạn chữa bài: Câu 3/ })
    expect(within(phat).getByText('Đoạn 3/5')).toBeTruthy()
    expect(phat.querySelectorAll('.xp-khuc')).toHaveLength(5)
    expect(phat.querySelector('.xp-khuc.nay small')?.textContent).toBe('Câu 3')
    expect(within(phat).getAllByRole('button', { name: /^Tốc độ/ }).map((b) => b.textContent)).toEqual(['1×', '1,5×', '2×'])
    const lang = within(phat).getByRole('switch', { name: 'Bỏ khoảng lặng' })
    expect(lang.getAttribute('aria-checked')).toBe('true')
    fireEvent.click(lang)
    expect(lang.getAttribute('aria-checked')).toBe('false')
    fireEvent.click(within(phat).getByRole('button', { name: 'Tốc độ 1,5 lần' }))
    expect(within(phat).getByRole('button', { name: 'Tốc độ 1,5 lần' }).getAttribute('aria-pressed')).toBe('true')
    expect(phat.getAttribute('data-giay')).toBe('sang')
    expect(phat.querySelector('audio')?.getAttribute('src')).toBe(`https://may-chu/live-tep/${ID_BUOI_GIA}/tieng.mp3?ve=ve-gia`)
    expect(within(phat).queryByText('Buổi này không có tiếng')).toBeNull()
    // nét: chỉ tải khúc của mốc bảng câu 3 (không tải từ đầu tệp)
    await waitFor(() => expect(goi.some((p) => p.endsWith('/net.bin'))).toBe(true))
    const lanGoi = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.filter((c) => String(c[0]).includes('net.bin')).map((c) => String(((c[1]?.headers ?? {}) as Record<string, string>).Range))
    const mocC3 = buoi.mocBang.filter((m) => m.t <= buoi.doan[2]!.t0).pop()!
    expect(lanGoi[0]).toMatch(new RegExp(`^bytes=${mocC3.byte}-`))
    expect(mocC3.byte).toBeGreaterThan(0)
    fireEvent.click(within(phat).getByRole('button', { name: 'Đóng trình phát' }))
    await waitFor(() => expect(screen.queryByRole('dialog', { name: /Xem lại đoạn chữa bài/ })).toBeNull())
  })
  it('buổi không có tiếng: không có thẻ audio, có dòng «Buổi này không có tiếng»; giấy tối theo thầy', async () => {
    const { buoi, net } = taoBuoiGia({ coTieng: false, giayToi: true })
    datMayChu({ rieng: () => taoRiengGia(buoi), buoi: () => buoi, net })
    localStorage.setItem('omr_student_portal_auth', JSON.stringify({ token: TOKEN }))
    render(<XemBuoiLive id={ID_BUOI_GIA} ve="ve-gia" nguon="hs" dong={() => {}} />)
    await screen.findByText('Phát cả 5 đoạn · 29 phút')
    fireEvent.click(screen.getByRole('button', { name: /Phát cả 5 đoạn/ }))
    const phat = await screen.findByRole('dialog', { name: /Xem lại đoạn chữa bài: Câu 1/ })
    expect(within(phat).getByText('Buổi này không có tiếng')).toBeTruthy()
    expect(phat.querySelector('audio')).toBeNull()
    expect(phat.getAttribute('data-giay')).toBe('toi')
    expect(within(phat).getByText('Đoạn 1/5')).toBeTruthy()
    await cho(60)
  })
})

describe('dòng «Live» ở tấm «Thêm» (MenuDocTrong thật)', () => {
  const menu = (token?: string) => <div className="ht-app ht2"><MenuDocTrong muc="hom-nay" ds={[]} onMuc={() => {}} coCa={false} onThi={() => {}} dangTai={false} onTaiLai={() => {}} chuDau="MA" moCuaEm={false} onCuaEm={() => {}} nutCuaEm={createRef<HTMLButtonElement>()} token={token} moDiemDanh={false} /></div>
  it('đứng sau «Luyện tập», đúng kiểu dòng menu, có chip «N buổi mới»; bấm thì mở «Xem lại Live»; chỉ gọi `/hs/live-ds` khi em mở «Thêm»', async () => {
    const { buoi } = taoBuoiGia()
    datMayChu({ ds: () => taoDsGia(buoi) })
    render(menu(TOKEN))
    await cho(30)
    expect(goi).not.toContain('/hs/live-ds') // chưa mở «Thêm» ⇒ chưa gọi
    fireEvent.click(screen.getByRole('button', { name: 'Thêm' }))
    const dong = await screen.findByRole('button', { name: /^Live/ })
    await waitFor(() => expect(within(dong).getByText('5 buổi mới')).toBeTruthy())
    expect(dong.className).toBe('tr-menu-muc')
    expect(dong.querySelector('.tr-menu-o')).not.toBeNull()
    // thứ tự trong tấm: … Luyện tập, (Thành tích — ẩn ở tấm Thêm), Live, Điểm danh, Cài đặt
    const ten = [...document.querySelectorAll('.tr-menu-ds > .tr-menu-muc')].map((e) => e.textContent ?? '')
    const iLive = ten.findIndex((t) => t.startsWith('Live'))
    expect(ten.findIndex((t) => t === 'Luyện tập')).toBeLessThan(iLive)
    expect(ten.findIndex((t) => t === 'Cài đặt')).toBeGreaterThan(iLive)
    expect(goi.filter((p) => p === '/hs/live-ds')).toHaveLength(1)
    fireEvent.click(dong)
    await screen.findByRole('dialog', { name: 'Xem lại Live' })
    await screen.findByRole('button', { name: /Xem buổi này/ })
    expect(goi.filter((p) => p === '/hs/live-ds')).toHaveLength(1) // danh sách dùng lại bản nhớ 10 phút
  })
  it('chưa có buổi mới ⇒ dòng «Live» vẫn hiện, không có chip', async () => {
    datMayChu({ ds: () => ({ buoi: [] }) })
    render(menu(TOKEN))
    fireEvent.click(screen.getByRole('button', { name: 'Thêm' }))
    const dong = await screen.findByRole('button', { name: /^Live/ })
    await waitFor(() => expect(goi).toContain('/hs/live-ds'))
    await cho(30)
    expect(dong.querySelector('.xl-chip-moi')).toBeNull()
  })
})
