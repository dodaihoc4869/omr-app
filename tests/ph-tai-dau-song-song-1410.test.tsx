import { Profiler } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import AppPhuHuynh from '../src/components/ph-v3/AppPhuHuynh'
import { NHIP_PH_MOI_MS } from '../src/lib/ph-moi/use-tat-ca-ve-con'
import { luuPass, xoaPass } from '../src/lib/ph-token'
import { hoc2Gia, loiThayGia, nhipGia, tatCaGia, tongQuanGia } from '../scripts/chup-ph-dot19/gia'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => diaChi }))
vi.mock('../src/lib/tai-thong-tin-ph', () => ({ taiThongTinPhuHuynh: async () => ({ canhBao: [] }) }))
let diaChi = 'https://may.test'
let duLieu: Record<string, unknown>
let goi: { duong: string; url: string; than: unknown }[]
let cho: { duong: string; xong: () => void }[]
let giu = new Set<string>()
const TAT_CA = '/ph/tat-ca-ve-con'
const PHU = ['/ph/hoc-2', '/ph/con-tong-quan', '/ph/loi-thay', '/ph/nhip-hoc']
const app = (sbd = 'A') => <AppPhuHuynh sbd={sbd} hoTen="Nguyễn Minh Khôi" lop="12A1" onDoiSbd={() => {}} />
const xong = async (duong: string) => {
  await act(async () => {
    cho.filter((x) => x.duong === duong).forEach((x) => x.xong())
    cho = cho.filter((x) => x.duong !== duong)
  })
}
const doi = async () => { await act(async () => {}) }
const batGio = () => { vi.useFakeTimers(); vi.spyOn(Math, 'random').mockReturnValue(0.5) }
const lamMoi = async () => { await act(async () => { await vi.advanceTimersByTimeAsync(NHIP_PH_MOI_MS) }) }

beforeEach(() => {
  diaChi = 'https://may.test'
  duLieu = { [TAT_CA]: tatCaGia(), '/ph/hoc-2': hoc2Gia(), '/ph/con-tong-quan': tongQuanGia(), '/ph/loi-thay': loiThayGia(), '/ph/nhip-hoc': nhipGia() }
  goi = []; cho = []; giu = new Set()
  localStorage.clear()
  window.history.replaceState(null, '', '/ph')
  vi.stubGlobal('scrollTo', vi.fn())
  vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect() {} })
  vi.stubGlobal('fetch', vi.fn((url: string, o: RequestInit) => {
    const duong = new URL(url).pathname
    goi.push({ duong, url, than: JSON.parse(String(o.body)) })
    // Chụp thân ở lúc gửi, để một phản hồi cũ thật sự khác dữ liệu mới.
    const body = duLieu[duong] ?? { ok: true }
    const res = { ok: true, status: 200, json: async () => body }
    return giu.has(duong) ? new Promise((ok) => cho.push({ duong, xong: () => ok(res) })) : Promise.resolve(res)
  }))
})
afterEach(() => { cleanup(); xoaPass(); localStorage.clear(); vi.unstubAllGlobals(); vi.useRealTimers(); vi.restoreAllMocks() })

describe('tải báo cáo phụ huynh trong React thật', () => {
  it('bốn lệnh phụ khởi động trước khi bản chính về; bản đầu không tạo lượt đọc kép', async () => {
    giu.add(TAT_CA)
    let soLanVe = 0
    const r = render(<Profiler id="ph" onRender={() => soLanVe++}>{app()}</Profiler>)
    await doi()
    expect(goi.map((x) => x.duong).sort()).toEqual([TAT_CA, ...PHU].sort())
    expect(r.container.querySelector('[data-vung="anh-hung"]')).toBeNull()
    await xong(TAT_CA)
    expect(r.container.querySelector('[data-vung="anh-hung"]')).toBeTruthy()
    expect(goi).toHaveLength(5)
    console.info(`Đo mount PH: ${goi.length} request; ${soLanVe} lượt React commit`)
  })

  it.each([true, false])('refresh đọc lại đủ khối với pass và endpoint mới; serverNow đổi=%s', async (doiMoc) => {
    batGio()
    localStorage.setItem('omr_ph_pass', 'PASS-A')
    const r = render(app())
    await doi()
    expect(goi).toHaveLength(5)
    expect(goi.every((x) => JSON.stringify(x.than) === '{"pass":"PASS-A"}')).toBe(true)
    const pm = tatCaGia(), tq = tongQuanGia(), nx = loiThayGia()
    duLieu[TAT_CA] = { ...pm, serverNow: pm.serverNow + (doiMoc ? 1000 : 0), hoTen: 'Nguyễn Minh An' }
    duLieu['/ph/con-tong-quan'] = { ...tq, goiY: [{ ma: 'nhanh-sai', chu: 'Gợi ý mới cho con.' }] }
    duLieu['/ph/hoc-2'] = { ...hoc2Gia(), hanhTrinh: { tang: 4, toiThieu: 30 } }
    duLieu['/ph/loi-thay'] = { ...nx, nhanXet: [{ ...nx.nhanXet[0], noiDung: 'Nhận xét mới của thầy.' }] }
    duLieu['/ph/nhip-hoc'] = { ...nhipGia(), doTinCay: 95, canThem: 'Cần thêm số liệu mới.' }
    diaChi = 'https://may-moi.test'
    await act(async () => luuPass('PASS-B'))
    expect(goi).toHaveLength(10)
    for (const d of [TAT_CA, ...PHU]) expect(goi.filter((x) => x.duong === d)).toHaveLength(2)
    expect(goi.slice(5).every((x) => x.url.startsWith(diaChi) && JSON.stringify(x.than) === '{"pass":"PASS-B"}')).toBe(true)
    expect(r.container.textContent).toContain('Nguyễn Minh An')
    expect(r.container.querySelector('[data-vung="goi-y-nhac"]')?.textContent).toContain('Gợi ý mới cho con.')
    expect(r.container.querySelector('[data-vung="loi-thay-moi"]')?.textContent).toContain('Nhận xét mới của thầy.')
    expect(r.container.querySelector('[data-vung="nhip-hoc-con"]')?.textContent).toContain('95%')
    expect(r.container.querySelector('[data-vung="anh-hung"]')?.textContent).toContain('Hành trình của con: tầng Tổng hợp')
    await lamMoi()
    expect(goi).toHaveLength(15)
  })

  it('tab ẩn không đọc; quay lại tab làm mới đủ năm lệnh một lượt', async () => {
    batGio()
    const an = vi.spyOn(document, 'hidden', 'get').mockReturnValue(false)
    const hien = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
    render(app())
    await doi()
    an.mockReturnValue(true); hien.mockReturnValue('hidden')
    await lamMoi()
    expect(goi).toHaveLength(5)
    an.mockReturnValue(false); hien.mockReturnValue('visible')
    await act(async () => document.dispatchEvent(new Event('visibilitychange')))
    expect(goi).toHaveLength(10)
    await act(async () => document.dispatchEvent(new Event('visibilitychange')))
    expect(goi).toHaveLength(10)
  })

  it('đổi con bỏ cả bốn báo cáo phụ về muộn của con trước', async () => {
    giu = new Set([TAT_CA, ...PHU])
    const r = render(app('A'))
    await doi()
    const cu = cho.splice(0)
    const nx = loiThayGia()
    duLieu[TAT_CA] = { ...tatCaGia(), hoTen: 'Nguyễn Minh An' }
    duLieu['/ph/loi-thay'] = { ...nx, nhanXet: [{ ...nx.nhanXet[0], noiDung: 'Nhận xét cho An.' }] }
    r.rerender(app('B'))
    await doi()
    expect(goi).toHaveLength(10)
    for (const d of [TAT_CA, ...PHU]) await xong(d)
    expect(r.container.textContent).toContain('Nguyễn Minh An')
    expect(r.container.textContent).toContain('Nhận xét cho An.')
    await act(async () => cu.forEach((x) => x.xong()))
    expect(r.container.textContent).toContain('Nguyễn Minh An')
    expect(r.container.textContent).toContain('Nhận xét cho An.')
    expect(r.container.textContent).not.toContain('Nguyễn Minh Khôi')
  })

  it('lỗi từng khối giữ dữ liệu cũ và lý do; thử lại nhận xét chỉ đọc khối đó', async () => {
    batGio()
    const r = render(app())
    await doi()
    const loiCu = r.container.querySelector('[data-vung="loi-thay-moi"] blockquote')?.textContent
    const nhacCu = r.container.querySelector('[data-vung="goi-y-nhac"] ul')?.textContent
    for (const d of PHU) duLieu[d] = { ok: false, error: `Lỗi riêng ${d}.` }
    await lamMoi()
    expect(goi).toHaveLength(10)
    for (const d of PHU) expect(r.container.textContent).toContain(`Lỗi riêng ${d}.`)
    expect(r.container.querySelector('[data-vung="loi-thay-moi"] blockquote')?.textContent).toBe(loiCu)
    expect(r.container.querySelector('[data-vung="goi-y-nhac"] ul')?.textContent).toBe(nhacCu)
    expect(r.container.querySelector('[data-vung="nhip-hoc-con"] [data-vung="so-nhip"]')).toBeTruthy()
    const nx = loiThayGia()
    duLieu['/ph/loi-thay'] = { ...nx, nhanXet: [{ ...nx.nhanXet[0], noiDung: 'Nhận xét đã cập nhật.' }] }
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Thử lại nhận xét' })))
    expect(goi).toHaveLength(11)
    expect(goi.at(-1)?.duong).toBe('/ph/loi-thay')
    expect(r.container.querySelector('[data-vung="loi-thay-moi"]')?.textContent).toContain('Nhận xét đã cập nhật.')
    expect(r.container.textContent).not.toContain('Lỗi riêng /ph/loi-thay.')
  })

  it('một khối lỗi giữ bản cũ, khối thành công vẫn cập nhật; thử lại báo cáo đọc mới đủ khối', async () => {
    batGio()
    const r = render(app())
    await doi()
    const loiCu = r.container.querySelector('[data-vung="loi-thay-moi"] blockquote')?.textContent
    duLieu[TAT_CA] = { ok: false, error: 'Báo cáo đang chậm.' }
    duLieu['/ph/loi-thay'] = { ok: false, error: 'Nhận xét đang chậm.' }
    duLieu['/ph/nhip-hoc'] = { ...nhipGia(), doTinCay: 96 }
    await lamMoi()
    expect(goi).toHaveLength(10)
    expect(r.container.querySelector('[data-vung="anh-hung"]')).toBeTruthy()
    expect(r.container.querySelector('[data-vung="loi-thay-moi"] blockquote')?.textContent).toBe(loiCu)
    expect(r.container.querySelector('[data-vung="nhip-hoc-con"]')?.textContent).toContain('96%')
    expect(r.container.textContent).toContain('Báo cáo đang hiển thị bản đã tải. Báo cáo đang chậm.')
    expect(r.container.textContent).toContain('Nhận xét đang hiển thị bản đã tải. Nhận xét đang chậm.')
    duLieu[TAT_CA] = { ...tatCaGia(), serverNow: tatCaGia().serverNow + 2000 }
    duLieu['/ph/loi-thay'] = loiThayGia()
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Thử lại báo cáo' })))
    expect(goi).toHaveLength(15)
    expect(r.container.textContent).not.toContain('Báo cáo đang chậm.')
    expect(r.container.textContent).not.toContain('Nhận xét đang chậm.')
  })
})
