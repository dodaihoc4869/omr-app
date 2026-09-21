// ĐOÀN HỘ TỐNG · P0 "đáp án bị nhảy" — ẢNH của câu nạp trễ đẩy lưới đáp án xuống dưới ngón tay (dữ liệu không ghi kích thước ảnh ⇒ không chừa chỗ trước được).
// Chữa: chỉ dựng thẻ câu khi ảnh đã tải xong (thành công / lỗi) hoặc quá hạn 2,5 s; câu không ảnh hiện ngay (không chớp "đang tải").
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, configure, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react'
vi.mock('../src/components/KhoiCauSai', () => ({ LoiGiaiCauSai: () => <p>Lời giải từ kho</p> }))
vi.mock('../src/game/than-thu-v2/battle-audio', () => ({ unlockBattleAudio: vi.fn(), playBattleSound: vi.fn() }))
import DoanHoTong from '../src/game/than-thu-v2/DoanHoTong'
import { HAN_CHO_ANH_MS, cacAnhCuaCau, useAnhSanSang } from '../src/game/than-thu-v2/anh-san-sang'
import type { DoanXem } from '../src/game/than-thu-v2/doan-kieu'

configure({ asyncUtilTimeout: 8000 })

class AnhGia {
  static ds: AnhGia[] = []
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  private _src = ''
  set src(v: string) { this._src = v }
  get src() { return this._src }
  constructor() { AnhGia.ds.push(this) }
}
beforeEach(() => { AnhGia.ds = []; vi.stubGlobal('Image', AnhGia); sessionStorage.clear(); localStorage.clear() })
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.useRealTimers() })

const Q = { qid: 'Q1', maDe: 'D', version: 'v', group: 'g', phan: 'I' as const, text: 'Thuỷ phân ethyl acetate thu được', choices: ['phương án một', 'phương án hai', 'phương án ba', 'phương án bốn'], ideas: [], hinhAnh: [] as { src: string; viTri: string }[], dang: 'ES', tenDang: 'Ester', mucDo: 'hieu', sao: 2, kienThuc: [] }

describe('cacAnhCuaCau — thuần', () => {
  it('gom ảnh đề cắt, ảnh sau đề/phương án, ảnh phương án, ảnh ý; bỏ trùng, rỗng, data:/blob:', () => {
    expect(cacAnhCuaCau({ ...Q, thanCauImg: '/a.png', imageDataUrl: 'data:image/png;base64,AAA', choiceImgs: ['/c1.png', '', '/a.png'], ideaImgs: ['blob:xyz', '/y1.png'], hinhAnh: [{ src: '/h1.png', viTri: 'sau_de' }, { src: '  ', viTri: 'sau_de' }] } as never))
      .toEqual(['/a.png', '/c1.png', '/y1.png', '/h1.png'])
    expect(cacAnhCuaCau(Q as never)).toEqual([])
    expect(cacAnhCuaCau(undefined)).toEqual([])
    expect(cacAnhCuaCau(null)).toEqual([])
  })
})

describe('useAnhSanSang', () => {
  it('câu KHÔNG ảnh ⇒ sẵn sàng NGAY từ lần vẽ đầu; không tạo Image nào', () => {
    const { result } = renderHook(() => useAnhSanSang([]))
    expect(result.current).toBe(true)
    expect(AnhGia.ds).toHaveLength(0)
  })
  it('có ảnh ⇒ chưa sẵn sàng tới khi TẤT CẢ ảnh tải xong (onload); một ảnh về thì chưa đủ', async () => {
    const { result } = renderHook(() => useAnhSanSang(['/a.png', '/b.png']))
    expect(result.current).toBe(false)
    expect(AnhGia.ds.map((i) => i.src)).toEqual(['/a.png', '/b.png'])
    await act(async () => { AnhGia.ds[0]!.onload!() })
    expect(result.current).toBe(false)
    await act(async () => { AnhGia.ds[1]!.onload!() })
    expect(result.current).toBe(true)
  })
  it('ảnh LỖI (onerror) cũng tính là xong — không đứng chờ hình hỏng', async () => {
    const { result } = renderHook(() => useAnhSanSang(['/hong.png']))
    expect(result.current).toBe(false)
    await act(async () => { AnhGia.ds[0]!.onerror!() })
    expect(result.current).toBe(true)
  })
  it(`quá hạn ${HAN_CHO_ANH_MS} ms mà ảnh chưa về ⇒ hiện luôn`, async () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useAnhSanSang(['/cham.png']))
    expect(result.current).toBe(false)
    await act(async () => { vi.advanceTimersByTime(HAN_CHO_ANH_MS - 1) })
    expect(result.current).toBe(false)
    await act(async () => { vi.advanceTimersByTime(2) })
    expect(result.current).toBe(true)
  })
  it('đổi sang câu KHÁC (danh sách ảnh khác) ⇒ chờ lại từ đầu, không dùng kết quả câu trước; cùng danh sách vẽ lại ⇒ không tải lại', async () => {
    const { result, rerender } = renderHook(({ s }) => useAnhSanSang(s), { initialProps: { s: ['/a.png'] } })
    await act(async () => { AnhGia.ds[0]!.onload!() })
    expect(result.current).toBe(true)
    rerender({ s: ['/a.png'] })
    expect(AnhGia.ds).toHaveLength(1) // cùng ảnh: không tạo Image mới
    expect(result.current).toBe(true)
    rerender({ s: ['/b.png'] })
    expect(result.current).toBe(false)
    await act(async () => { AnhGia.ds[1]!.onload!() })
    expect(result.current).toBe(true)
  })
})

describe('trong trận: thẻ câu CHỈ dựng khi ảnh tải xong', () => {
  const ghe = (): DoanXem['ghe'] => [{ ghe: 0, ten: 'Minh', pet: 2, cap: 32, laMay: false, roi: false, laEm: true, trangThai: 'dang_lam' as never, tinHieu: null }, { ghe: 1, ten: 'Hà', pet: 1, cap: 30, laMay: false, roi: false, laEm: false, trangThai: 'dang_lam' as never, tinHieu: null }]
  const tran = { tenChang: 'Vượt Đầm', hiep: 3, soHiep: 8, laTrum: false, ketThuc: false, thang: null, linhTam: { hp: 80, toiDa: 100 }, quai: [{ ma: 5, loai: 'bun_acid', hp: 9 }], trumVoGiap: [], nangLuong: 1, daNhanTiepSuc: 0, giay: 40, moSauMs: 0, conMs: 27000, tenQuai: ['Bùn Acid', 'Khói'], loaiQuai: ['bun_acid', 'khoi_oxi_hoa'], tenTrum: ['A', 'B'], loaiTrum: ['chua_te_ket_tua', 'ba_chu_an_mon'] } as DoanXem['tran']
  const dung = (de: object) => {
    const xem: DoanXem = { ma: 'DH1', revision: 5, laChu: true, batDau: true, ghe: ghe(), gioMayChu: 0, tran, cau: { qid: 'Q1', nhan: 'toi_han_on', de } as never }
    sessionStorage.setItem('doan:S1', 'DH1')
    const call = vi.fn(async (lenh: string) => (lenh === 'doan-xem' ? { ok: true, doan: xem } : lenh === 'recommendations' ? { ok: true, suggestions: [], remaining: 9 } : { ok: true }))
    render(<DoanHoTong call={call} sbd="S1" pet={2} cap={32} onDong={vi.fn()} onVeBangNhiemVu={vi.fn()} />)
  }
  it('câu CÓ ảnh: chưa về ⇒ "Đang tải hình của câu…", CHƯA có nút đáp án nào; ảnh về ⇒ lưới hiện, bấm được', async () => {
    dung({ ...Q, hinhAnh: [{ src: '/h1.png', viTri: 'sau_de' }] })
    expect(await screen.findByText('Đang tải hình của câu…')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /phương án một/ })).toBeNull()
    await act(async () => { AnhGia.ds.forEach((i) => i.onload?.()) })
    await waitFor(() => expect(screen.getByRole('button', { name: /phương án một/ })).toBeTruthy())
    expect(screen.queryByText('Đang tải hình của câu…')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /phương án hai/ }))
    expect(screen.getByRole('button', { name: /phương án hai/ }).getAttribute('aria-pressed')).toBe('true')
  })
  it('câu chung của TRÙM có ảnh: "Đang tải hình của câu chung…" tới khi ảnh về, rồi mới hiện các ý Đúng/Sai', async () => {
    const trum: DoanXem = { ma: 'DH1', revision: 5, laChu: true, batDau: true, ghe: ghe(), gioMayChu: 0, tran: { ...tran, laTrum: true, hiep: 4 } as DoanXem['tran'],
      trum: { coCau: true, giaoY: [0, 1, 0, 1], yCuaEm: [0, 2], yDaChot: [false, false, false, false], qid: 'T1', tenDang: 'Ester', de: { ...Q, qid: 'T1', phan: 'II', choices: [], ideas: ['ý thứ nhất', 'ý thứ hai', 'ý thứ ba', 'ý thứ tư'], hinhAnh: [{ src: '/t1.png', viTri: 'sau_de' }] } as never } }
    sessionStorage.setItem('doan:S1', 'DH1')
    const call = vi.fn(async (lenh: string) => (lenh === 'doan-xem' ? { ok: true, doan: trum } : lenh === 'recommendations' ? { ok: true, suggestions: [], remaining: 9 } : { ok: true }))
    render(<DoanHoTong call={call} sbd="S1" pet={2} cap={32} onDong={vi.fn()} onVeBangNhiemVu={vi.fn()} />)
    expect(await screen.findByText('Đang tải hình của câu chung…')).toBeTruthy()
    expect(screen.queryByText('ý thứ nhất')).toBeNull()
    await act(async () => { AnhGia.ds.forEach((i) => i.onload?.()) })
    expect(await screen.findByText('ý thứ nhất')).toBeTruthy()
    expect(screen.queryByText('Đang tải hình của câu chung…')).toBeNull()
  })
  it('câu KHÔNG ảnh: hiện đủ lưới ngay, không có dòng "Đang tải hình"', async () => {
    dung(Q)
    expect(await screen.findByRole('button', { name: /phương án một/ })).toBeTruthy()
    expect(screen.queryByText('Đang tải hình của câu…')).toBeNull()
    expect(AnhGia.ds).toHaveLength(0)
  })
})
