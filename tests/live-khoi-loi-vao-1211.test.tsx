// @vitest-environment jsdom
// LIVE THEO KHỐI — BA KHỐI LỐI VÀO (12/11; đặc tả docs/dac-ta-live-moi-1211.md): thẻ Live trang chủ em · bảng «Live» của thầy · màn «Bốn đội».
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { DsLichLive } from '../src/lib/live-khoi/api'
import type { LichLive, LiveCuaEm, NguoiLop } from '../src/lib/live-khoi/kieu'

type KqDs = { ok: true; du: DsLichLive } | { ok: false; loai: 'tu_choi'; chu: string }
const may = vi.hoisted(() => ({
  cuaEm: { trangThai: 'khong' } as unknown,
  vao: { ok: true, buoiId: 'b-12' } as unknown,
  ds: null as unknown,
  mo: null as unknown,
  goi: [] as [string, ...unknown[]][],
  moBpu: [] as unknown[][],
  bpuNhan: true,
  treo: null as null | Promise<void>,
}))
vi.mock('../src/lib/live-khoi/api', () => ({
  liveCuaEm: async (token: string) => { may.goi.push(['cuaEm', token]); return may.cuaEm },
  vaoLiveKhoi: async (token: string) => { may.goi.push(['vao', token]); if (may.treo) await may.treo; return may.vao },
  taiLichLive: async () => { may.goi.push(['ds']); return may.ds },
  henLichLive: async (o: unknown) => { may.goi.push(['hen', o]); return may.ds },
  suaLichLive: async (id: string, o: unknown) => { may.goi.push(['sua', id, o]); return may.ds },
  huyLichLive: async (id: string) => { may.goi.push(['huy', id]); return may.ds },
  moLiveKhoi: async (o: unknown) => { may.goi.push(['mo', o]); if (may.treo) await may.treo; return may.mo },
}))
vi.mock('../src/components/bpu/gan-hs', () => ({ moBpuHs: (...a: unknown[]) => { may.moBpu.push(a); return may.bpuNhan } }))
vi.mock('../src/components/bpu/ManBinhPhanUng', () => ({ NgonLua: ({ doi, to }: { doi: number; to?: boolean }) => <span data-lua={doi} data-to={to ? '' : undefined} /> }))
vi.mock('../src/screens/live-xem-lai/gv/LichSuLive', () => ({ default: ({ onDong }: { onDong: () => void }) => <div className="lsl"><button type="button" onClick={onDong}>Đóng lịch sử giả</button></div> }))

import TheLiveEm from '../src/components/live-khoi/TheLiveEm'
import BangLiveThay from '../src/components/live-khoi/BangLiveThay'
import { chuConLai, chuGioLive, chuNgayGio, mocTuO } from '../src/components/live-khoi/chu-gio'
import ManBonDoi from '../src/components/live-khoi/ManBonDoi'

const NAY = new Date(2026, 10, 12, 17, 15, 0).getTime() // Thứ Năm 12/11/2026 17:15 giờ máy
const troi = (ms: number) => act(async () => { await vi.advanceTimersByTimeAsync(ms) })
const lich = (id: string, o: Partial<LichLive> = {}): LichLive => ({ id, khoi: 12, batDau: NAY + 3 * 3600_000, ten: '', trangThai: 'hen', ...o })
const dsOk = (l: LichLive[]): KqDs => ({ ok: true, du: { lich: l, soEm: { 10: 64, 11: 92, 12: 86 } } })
const goiLoai = (loai: string) => may.goi.filter((g) => g[0] === loai)
const datHien = (v: 'visible' | 'hidden') => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => v }); Object.defineProperty(document, 'hidden', { configurable: true, get: () => v === 'hidden' }); document.dispatchEvent(new Event('visibilitychange')) }

beforeEach(() => {
  vi.useFakeTimers(); vi.setSystemTime(NAY)
  Object.assign(may, { cuaEm: { trangThai: 'khong' }, vao: { ok: true, buoiId: 'b-12' }, ds: dsOk([]), mo: null, goi: [], moBpu: [], bpuNhan: true, treo: null })
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' })
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => false })
})
afterEach(() => { cleanup(); vi.useRealTimers() })

describe('Thẻ Live trang chủ em', () => {
  const dat = (o: LiveCuaEm) => { may.cuaEm = o }

  it('không có buổi cho khối em ⇒ không vẽ gì', async () => {
    const { container } = render(<TheLiveEm token="tk" />)
    await troi(10)
    expect(container.innerHTML).toBe('')
    expect(goiLoai('cuaEm')).toEqual([['cuaEm', 'tk']])
  })

  it('có lịch ⇒ giờ + tên buổi + đếm ngược, không có nút; đếm ngược tự cập nhật mỗi 30 giây', async () => {
    dat({ trangThai: 'hen', khoi: 12, ten: 'Chữa đề Ester – Lipid', batDau: NAY + (2 * 60 + 15) * 60_000 })
    render(<TheLiveEm token="tk" />)
    await troi(10)
    expect(screen.getByText('Live 19:30 hôm nay')).toBeTruthy()
    expect(screen.getByText('Chữa đề Ester – Lipid · còn 2 giờ 15 phút')).toBeTruthy()
    expect(screen.queryByRole('button')).toBeNull()
    await troi(30_000)
    expect(screen.getByText('Chữa đề Ester – Lipid · còn 2 giờ 14 phút')).toBeTruthy()
    expect(goiLoai('cuaEm').length).toBe(1) // đếm ngược không gọi máy chủ
  })

  it('chữ giờ và chữ còn lại: hôm nay / ngày khác, giờ – phút – ngày, đã tới giờ', () => {
    expect(chuGioLive(new Date(2026, 10, 14, 9, 5).getTime(), NAY)).toBe('Live 09:05 ngày 14/11')
    expect(chuConLai(NAY + 45 * 60_000, NAY)).toBe('còn 45 phút')
    expect(chuConLai(NAY + 120 * 60_000, NAY)).toBe('còn 2 giờ')
    expect(chuConLai(NAY + (2 * 1440 + 190) * 60_000, NAY)).toBe('còn 2 ngày 3 giờ')
    expect(chuConLai(NAY + 20_000, NAY)).toBe('còn chưa tới 1 phút')
    expect(chuConLai(NAY - 1, NAY)).toBe('sắp bắt đầu')
  })

  it('phòng chờ / đang live ⇒ thẻ sáng đúng chữ + nút «Tham gia»', async () => {
    dat({ trangThai: 'cho', khoi: 12 })
    const { unmount } = render(<TheLiveEm token="tk" />)
    await troi(10)
    expect(screen.getByText('Thầy đang mở phòng chờ · Khối 12')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Tham gia' })).toBeTruthy()
    unmount()
    dat({ trangThai: 'dang', khoi: 11, ten: 'Cân bằng hoá học' })
    render(<TheLiveEm token="tk" />)
    await troi(10)
    expect(screen.getByText('Thầy đang live · Khối 11')).toBeTruthy()
    expect(screen.getByText('Cân bằng hoá học')).toBeTruthy()
  })

  it('bấm «Tham gia» lặp nhiều lần ⇒ chỉ gọi máy chủ MỘT lần, rồi mở màn phòng đúng buổi', async () => {
    dat({ trangThai: 'dang', khoi: 12 })
    let tha = () => {}
    may.treo = new Promise<void>((r) => { tha = r })
    render(<TheLiveEm token="tk" />)
    await troi(10)
    const nut = screen.getByRole('button', { name: 'Tham gia' })
    fireEvent.click(nut); fireEvent.click(nut); fireEvent.click(nut)
    await troi(10)
    expect((screen.getByRole('button', { name: 'Đang vào…' }) as HTMLButtonElement).disabled).toBe(true)
    tha(); may.treo = null
    await troi(10)
    expect(goiLoai('vao')).toEqual([['vao', 'tk']])
    expect(may.moBpu).toEqual([['tk', 'b-12']])
    expect(screen.getByRole('button', { name: 'Tham gia' })).toBeTruthy()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('máy chủ từ chối ⇒ hiện đúng lời máy chủ dưới thẻ, không mở màn phòng; bấm lại được', async () => {
    dat({ trangThai: 'cho', khoi: 12 })
    may.vao = { ok: false, chu: 'Buổi live này dành cho Khối 11.' }
    render(<TheLiveEm token="tk" />)
    await troi(10)
    fireEvent.click(screen.getByRole('button', { name: 'Tham gia' }))
    await troi(10)
    expect(screen.getByRole('alert').textContent).toBe('Buổi live này dành cho Khối 11.')
    expect(may.moBpu).toEqual([])
    may.vao = { ok: true, buoiId: 'b-9' }
    fireEvent.click(screen.getByRole('button', { name: 'Tham gia' }))
    await troi(10)
    expect(may.moBpu).toEqual([['tk', 'b-9']])
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('hỏi lại khoảng 60 giây / lần (50–70 giây, lệch pha) khi tab hiện; tab ẩn không hỏi; quay lại tab và sự kiện «ddh-live-khoi» ⇒ hỏi ngay', async () => {
    render(<TheLiveEm token="tk" />)
    await troi(10)
    expect(goiLoai('cuaEm').length).toBe(1)
    await troi(49_000)
    expect(goiLoai('cuaEm').length).toBe(1)
    await troi(21_100)
    expect(goiLoai('cuaEm').length).toBe(2)
    act(() => datHien('hidden'))
    await troi(180_000)
    expect(goiLoai('cuaEm').length).toBe(2)
    may.cuaEm = { trangThai: 'cho', khoi: 12 }
    act(() => datHien('visible'))
    await troi(10)
    expect(goiLoai('cuaEm').length).toBe(3)
    expect(screen.getByRole('button', { name: 'Tham gia' })).toBeTruthy()
    may.cuaEm = { trangThai: 'khong' }
    act(() => { window.dispatchEvent(new Event('ddh-live-khoi')) })
    await troi(10)
    expect(goiLoai('cuaEm').length).toBe(4)
    expect(screen.queryByRole('button')).toBeNull()
  })
})

describe('Bảng «Live» của thầy', () => {
  const dung = async (onMoPhong = vi.fn(), onDong = vi.fn()) => { const r = render(<BangLiveThay onDong={onDong} onMoPhong={onMoPhong} />); await troi(10); return { ...r, onMoPhong, onDong } }

  it('ba thẻ chọn + ba ô khối có sĩ số; chọn khối rồi mở ⇒ gọi đúng tham số và báo người ghép', async () => {
    const kq = { lich: lich('l1', { trangThai: 'cho', khoi: 11, buoiId: 'b-11' }), buoiId: 'b-11', ma: '4821' }
    may.mo = { ok: true, du: kq }
    const { onMoPhong } = await dung()
    for (const t of ['Mở live ngay', 'Hẹn lịch live', 'Xem lại live']) expect(screen.getByRole('button', { name: new RegExp(`^${t}`) })).toBeTruthy()
    expect(screen.getByRole('radio', { name: /Khối 10\s*64 em/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Mở phòng chờ Khối 12' })).toBeTruthy()
    fireEvent.click(screen.getByRole('radio', { name: /Khối 11/ }))
    const nut = screen.getByRole('button', { name: 'Mở phòng chờ Khối 11' })
    fireEvent.click(nut); fireEvent.click(nut)
    await troi(10)
    expect(goiLoai('mo')).toEqual([['mo', { khoi: 11 }]])
    expect(onMoPhong).toHaveBeenCalledTimes(1)
    expect(onMoPhong).toHaveBeenCalledWith(kq)
  })

  it('đang gọi ⇒ nút khoá «Đang mở…»; máy chủ lỗi ⇒ hiện đúng chữ lỗi, không báo người ghép', async () => {
    let tha = () => {}
    may.treo = new Promise<void>((r) => { tha = r })
    may.mo = { ok: false, loai: 'tu_choi', chu: 'Khối 12 chưa có em nào.' }
    const { onMoPhong } = await dung()
    fireEvent.click(screen.getByRole('button', { name: 'Mở phòng chờ Khối 12' }))
    await troi(10)
    expect((screen.getByRole('button', { name: 'Đang mở…' }) as HTMLButtonElement).disabled).toBe(true)
    tha(); may.treo = null
    await troi(10)
    expect(screen.getByRole('alert').textContent).toBe('Khối 12 chưa có em nào.')
    expect(onMoPhong).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Mở phòng chờ Khối 12' })).toBeTruthy()
  })

  it('đã có phòng chờ / đang live ⇒ không cho mở khối khác, chỉ «Vào lại phòng» (gọi kèm id)', async () => {
    may.ds = dsOk([lich('p1', { trangThai: 'cho', khoi: 11, buoiId: 'b-11' }), lich('h1', { batDau: NAY + 10 * 60_000 })])
    may.mo = { ok: true, du: { lich: lich('p1', { trangThai: 'cho', khoi: 11 }), buoiId: 'b-11', ma: '' } }
    const { onMoPhong } = await dung()
    expect(screen.getByText('Đang có phòng Khối 11')).toBeTruthy()
    expect(screen.queryByRole('radio')).toBeNull()
    expect(screen.queryByRole('button', { name: /^Mở phòng chờ/ })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Vào lại phòng' }))
    await troi(10)
    expect(goiLoai('mo')).toEqual([['mo', { khoi: 11, id: 'p1' }]])
    expect(onMoPhong).toHaveBeenCalledTimes(1)
    // buổi hẹn sắp tới giờ cũng không mở được khi đang có phòng khác
    fireEvent.click(screen.getByRole('button', { name: /^Hẹn lịch live/ }))
    expect(screen.queryByRole('button', { name: 'Mở phòng chờ' })).toBeNull()
  })

  it('hẹn lịch: giờ quá khứ bị chặn với đúng câu báo, không gọi máy chủ; giờ sau bây giờ ⇒ lưu đúng tham số (tên cắt 60 ký tự)', async () => {
    const { container } = await dung()
    fireEvent.click(screen.getByRole('button', { name: /^Hẹn lịch live/ }))
    expect(screen.getByText('Chưa hẹn buổi nào')).toBeTruthy()
    const oNgay = container.querySelector<HTMLInputElement>('input[type=date]')!, oGio = container.querySelector<HTMLInputElement>('input[type=time]')!, oTen = container.querySelector<HTMLInputElement>('input[type=text]')!
    expect(oTen.maxLength).toBe(60)
    fireEvent.change(oNgay, { target: { value: '2026-11-12' } }); fireEvent.change(oGio, { target: { value: '17:00' } })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu lịch' }))
    await troi(10)
    expect(screen.getByRole('alert').textContent).toBe('Giờ hẹn phải ở sau bây giờ')
    expect(goiLoai('hen')).toEqual([])
    fireEvent.change(oNgay, { target: { value: '2026-11-14' } }); fireEvent.change(oGio, { target: { value: '20:00' } })
    fireEvent.change(oTen, { target: { value: `  ${'a'.repeat(70)}` } })
    fireEvent.click(screen.getByRole('radio', { name: /Khối 11/ }))
    const batDau = new Date(2026, 10, 14, 20, 0).getTime()
    may.ds = dsOk([lich('h9', { khoi: 11, batDau, ten: 'Cân bằng hoá học' })])
    fireEvent.click(screen.getByRole('button', { name: 'Lưu lịch' }))
    await troi(10)
    const o = goiLoai('hen')[0]![1] as { khoi: number; batDau: number; ten: string }
    expect(o.khoi).toBe(11); expect(o.batDau).toBe(batDau); expect(o.ten.length).toBeLessThanOrEqual(60); expect(o.ten.startsWith('a')).toBe(true)
    expect(screen.getByText('Th 7 14/11 · 20:00')).toBeTruthy()
    expect(screen.getByText('Khối 11 · Cân bằng hoá học')).toBeTruthy()
  })

  it('lịch đã hẹn: thứ kiểu «Th 5» / «CN», nhãn «Hôm nay», «Mở phòng chờ» chỉ khi còn ≤ 30 phút hoặc đã quá giờ', async () => {
    may.ds = dsOk([
      lich('xa', { batDau: new Date(2026, 10, 15, 9, 0).getTime(), khoi: 10, ten: 'Liên kết hoá học' }),
      lich('gan', { batDau: NAY + 25 * 60_000, ten: 'Chữa đề Ester – Lipid' }),
      lich('qua', { batDau: NAY - 5 * 60_000, khoi: 11 }),
      lich('toi', { batDau: NAY + 31 * 60_000 }),
    ])
    may.mo = { ok: true, du: { lich: lich('gan', { trangThai: 'cho' }), buoiId: 'b-g', ma: '' } }
    const { container, onMoPhong } = await dung()
    fireEvent.click(screen.getByRole('button', { name: /^Hẹn lịch live/ }))
    const hang = [...container.querySelectorAll<HTMLElement>('.blt-ds li')]
    expect(hang.map((h) => h.querySelector('b')!.textContent)).toEqual(['Th 5 12/11 · 17:10', 'Th 5 12/11 · 17:40', 'Th 5 12/11 · 17:46', 'CN 15/11 · 09:00'])
    expect(hang.map((h) => !!within(h).queryByText('Hôm nay'))).toEqual([true, true, true, false])
    expect(hang.map((h) => !!within(h).queryByRole('button', { name: 'Mở phòng chờ' }))).toEqual([true, true, false, false])
    expect(within(hang[3]!).getByText('Khối 10 · Liên kết hoá học')).toBeTruthy()
    fireEvent.click(within(hang[1]!).getByRole('button', { name: 'Mở phòng chờ' }))
    await troi(10)
    expect(goiLoai('mo')).toEqual([['mo', { khoi: 12, id: 'gan' }]])
    expect(onMoPhong).toHaveBeenCalledTimes(1)
    expect(chuNgayGio(new Date(2026, 10, 16, 7, 5).getTime())).toBe('Th 2 16/11 · 07:05')
    expect(mocTuO('2026-11-14', '')).toBeNull()
  })

  it('huỷ hai chạm: chạm một chỉ đổi chữ, quá 4 giây tự trở lại; chạm hai mới gọi máy chủ', async () => {
    may.ds = dsOk([lich('h1'), lich('h2', { batDau: NAY + 5 * 3600_000, khoi: 10 })])
    const { container } = await dung()
    fireEvent.click(screen.getByRole('button', { name: /^Hẹn lịch live/ }))
    const nutHuy = () => within(container.querySelector<HTMLElement>('.blt-ds li')!).getByRole('button', { name: /huỷ buổi/i })
    fireEvent.click(nutHuy())
    expect(nutHuy().textContent).toBe('Chạm lần nữa để huỷ')
    expect(goiLoai('huy')).toEqual([])
    await troi(4100)
    expect(nutHuy().textContent).toBe('Huỷ')
    may.ds = dsOk([lich('h2', { batDau: NAY + 5 * 3600_000, khoi: 10 })])
    fireEvent.click(nutHuy()); fireEvent.click(nutHuy())
    await troi(10)
    expect(goiLoai('huy')).toEqual([['huy', 'h1']])
    expect(container.querySelectorAll('.blt-ds li').length).toBe(1)
  })

  it('«Sửa» nạp buổi vào ô nhập và lưu bằng lệnh sửa kèm id', async () => {
    const batDau = new Date(2026, 10, 14, 20, 0).getTime()
    may.ds = dsOk([lich('h1', { batDau, khoi: 11, ten: 'Cân bằng hoá học' })])
    const { container } = await dung()
    fireEvent.click(screen.getByRole('button', { name: /^Hẹn lịch live/ }))
    fireEvent.click(screen.getByRole('button', { name: /^Sửa buổi/ }))
    expect(container.querySelector<HTMLInputElement>('input[type=date]')!.value).toBe('2026-11-14')
    expect(container.querySelector<HTMLInputElement>('input[type=time]')!.value).toBe('20:00')
    expect(container.querySelector<HTMLInputElement>('input[type=text]')!.value).toBe('Cân bằng hoá học')
    fireEvent.change(container.querySelector<HTMLInputElement>('input[type=time]')!, { target: { value: '20:30' } })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))
    await troi(10)
    expect(goiLoai('sua')).toEqual([['sua', 'h1', { khoi: 11, batDau: batDau + 30 * 60_000, ten: 'Cân bằng hoá học' }]])
    expect(goiLoai('hen')).toEqual([])
  })

  it('«Xem lại live» hiện màn Lịch sử Live trong bảng; đóng màn ấy ⇒ về ba thẻ; nút lùi gọi onDong; khung cha mang dấu ẩn Hôm nay', async () => {
    const { container, onDong, unmount } = await dung()
    expect(container.hasAttribute('data-blt-mo')).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: /^Xem lại live/ }))
    await troi(10)
    expect(screen.getByRole('button', { name: 'Đóng lịch sử giả' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /^Mở live ngay/ })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Đóng lịch sử giả' }))
    expect(screen.getByRole('button', { name: /^Mở live ngay/ })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Hôm nay' }))
    expect(onDong).toHaveBeenCalledTimes(1)
    unmount()
    expect(container.hasAttribute('data-blt-mo')).toBe(false)
  })
})

describe('Màn «Bốn đội»', () => {
  const TEN = ['Minh Anh', 'Quốc Bảo', 'Hải Đăng', 'Ngọc Ánh', 'Hoài An', 'Việt Hoàng', 'Gia Bảo', 'Như Quỳnh', 'Thu Hà']
  const ds: NguoiLop[] = TEN.map((ten, i) => ({ sbd: `s${i}`, ten, doi: i === 8 ? 0 : Math.floor(i / 2) }))

  it('đầu màn «Em thuộc Đội X»; mỗi cột có lửa to, tên đội, «N em · M kJ»; tên em nổi kèm «(em)», chỉ cột đội em có viền', () => {
    const { container } = render(<ManBonDoi ds={ds} toi={ds[2]!} kj={[1840, 1620, 1975, 1410]} onDong={() => {}} />)
    expect(screen.getByRole('heading', { name: 'Em thuộc Đội Kali' })).toBeTruthy()
    const cot = [...container.querySelectorAll<HTMLElement>('.bd-cot')]
    expect(cot.map((c) => c.querySelector('h3')!.textContent)).toEqual(['Đội Natri', 'Đội Kali', 'Đội Đồng', 'Đội Canxi'])
    expect(cot.map((c) => c.querySelector('p')!.textContent)).toEqual(['3 em · 1840 kJ', '2 em · 1620 kJ', '2 em · 1975 kJ', '2 em · 1410 kJ'])
    expect(cot.map((c) => c.hasAttribute('data-toi'))).toEqual([false, true, false, false])
    expect(cot.every((c, i) => c.querySelector(`[data-lua="${i}"][data-to]`))).toBe(true)
    const noi = container.querySelectorAll('li[data-toi]')
    expect(noi.length).toBe(1)
    expect(noi[0]!.textContent).toBe('Hải Đăng (em)')
    expect(within(cot[0]!).getByText('Thu Hà')).toBeTruthy()
  })

  it('hết `tuDong` ⇒ tự đóng đúng một lần; chưa hết thì chưa đóng', async () => {
    const onDong = vi.fn()
    render(<ManBonDoi ds={ds} toi={ds[0]!} kj={[0, 0, 0, 0]} onDong={onDong} tuDong={3000} />)
    await troi(2900)
    expect(onDong).not.toHaveBeenCalled()
    await troi(200)
    expect(onDong).toHaveBeenCalledTimes(1)
  })

  it('không có `tuDong` ⇒ không tự đóng; chạm bất kỳ hoặc Esc ⇒ đóng; chưa biết em là ai ⇒ không có dòng «Em thuộc»', async () => {
    const onDong = vi.fn()
    const { container } = render(<ManBonDoi ds={ds} toi={null} kj={[]} onDong={onDong} />)
    await troi(10_000)
    expect(onDong).not.toHaveBeenCalled()
    expect(screen.queryByRole('heading', { name: /^Em thuộc/ })).toBeNull()
    expect(container.querySelector('.bd-cot p')!.textContent).toBe('3 em · 0 kJ')
    fireEvent.click(container.querySelector('.bd-cot li')!)
    expect(onDong).toHaveBeenCalledTimes(1)
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(onDong).toHaveBeenCalledTimes(2)
  })
})
