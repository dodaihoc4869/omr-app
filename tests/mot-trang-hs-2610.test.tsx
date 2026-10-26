// HÔM NAY «MỘT TRANG» + MENU DỌC (Điểm danh, A.I Đỗ Đại Học) của app học sinh — bản vẽ ve-moi/hs-mot-trang*.html, thầy chốt 26/10.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { createRef } from 'react'
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-chu' }))
import { MenuDocTrong, MotTrangHs, type PropsMotTrang } from '../src/components/hoc-tap/TrongHs'
import type { TomTatKiemTra } from '../src/lib/kiem-tra-ca-nhan'

const traLoi = (o: unknown) => new Response(JSON.stringify(o), { status: 200, headers: { 'content-type': 'application/json' } })
const noop = () => {}
const goc = (them: Partial<PropsMotTrang> = {}): PropsMotTrang => ({
  so: { daLam: 12, muc: 30, chang: 3, soChang: 5 } as PropsMotTrang['so'], dangTai: false, tenBai: 'Ester – Lipid', viec: 'Hiểu · Chặng 3/5',
  onHoc: noop, khoaHoc: false, hetCau: false, coCa: false, onThi: noop, soSua: 5, onChua: noop, ngayKiem: false, soBaiTap: 1, coBaiTap: true, onBaiTap: noop, ghi: [], ...them,
})
const mo = Date.parse('2026-10-26T00:00:00+07:00')
const KIEM: TomTatKiemTra = { id: 'k', ngay: '2026-10-26', moLuc: mo, hanLuc: mo + 86400_000, serverNow: mo + 3600_000, trangThai: 'can_lam', homNay: true, baiNgayToiThieu: 12,
  tong: 28, daTra: 0, con: 28, soChang: 4, phut: 50, soBai: 6, tongKienThuc: 10, phuDe: 10, nguonDayDu: true, lyDo: '', thieuNguon: 0, diem: null, nopLuc: null }
const viecChinh = () => screen.getByRole('region', { name: 'Việc của em lúc này' })
const sauDo = () => screen.queryByRole('region', { name: 'Sau đó' })

afterEach(() => { cleanup(); vi.unstubAllGlobals(); window.history.replaceState(null, '', '/') })

describe('Hôm nay «Một trang»', () => {
  it('học tiếp là việc số 1, MỘT nút (chữ nút app đang dùng), «Sau đó» tối đa 3 dòng đánh số 2–4', () => {
    render(<MotTrangHs {...goc({ kiem: KIEM, onKiemTra: noop })} />)
    expect(within(viecChinh()).getAllByRole('button').map((b) => b.textContent)).toEqual(['Học tiếp · 18 câu'])
    expect(within(viecChinh()).getByText('Còn 18 câu để đủ mức')).toBeTruthy()
    const dong = within(sauDo()!).getAllByRole('button')
    expect(dong).toHaveLength(3)
    expect(dong[0]!.textContent).toMatch(/^2Tự sửa lỗiCâu em làm sai5 câu/)
    expect(dong[1]!.textContent).toMatch(/^3Kiểm tra ôn tập/)
    expect(dong[2]!.textContent).toMatch(/^4Bài tập về nhàThầy đang giao1 bài/)
    expect(within(sauDo()!).getByText('28 câu · khoảng 50 phút · hạn nộp 24:00')).toBeTruthy()
  })

  it('ca kiểm tra đang mở ⇒ ca lên số 1 (nút Vào ca kiểm tra), học tiếp lùi xuống dòng 2', () => {
    const onThi = vi.fn()
    render(<MotTrangHs {...goc({ coCa: true, onThi })} />)
    fireEvent.click(within(viecChinh()).getByRole('button', { name: /Vào ca kiểm tra/ }))
    expect(onThi).toHaveBeenCalledOnce()
    expect(within(viecChinh()).getByText('Ca kiểm tra đang mở')).toBeTruthy()
    expect(within(sauDo()!).getAllByRole('button')[0]!.textContent).toMatch(/^2Ester – LipidHọc tiếp · 18 câu12\/30 câu/)
  })

  it('đủ mức ⇒ Tự sửa lỗi lên số 1, «Học thêm câu mới» thành liên kết', () => {
    const onChua = vi.fn(), onHoc = vi.fn()
    render(<MotTrangHs {...goc({ so: { daLam: 30, muc: 30, chang: 5, soChang: 5 } as PropsMotTrang['so'], onChua, onHoc })} />)
    expect(within(viecChinh()).getByText('Đủ mức hôm nay')).toBeTruthy()
    fireEvent.click(within(viecChinh()).getByRole('button', { name: /Sửa lỗi ngay/ }))
    fireEvent.click(within(sauDo()!).getByRole('button', { name: /Học thêm câu mới/ }))
    expect(onChua).toHaveBeenCalledOnce()
    expect(onHoc).toHaveBeenCalledOnce()
    expect(within(sauDo()!).queryByText('Tự sửa lỗi')).toBeNull()
  })

  it('ngày chỉ có Kiểm tra ôn tập ⇒ thẻ kiểm tra là việc số 1, không dòng nào khác', () => {
    render(<MotTrangHs {...goc({ kiem: { ...KIEM, baiNgayToiThieu: undefined }, ngayKiem: true, onKiemTra: noop })} />)
    expect(within(viecChinh()).getByRole('button', { name: /Làm bài kiểm tra/ })).toBeTruthy()
    expect(sauDo()).toBeNull()
  })
})

describe('Menu dọc «Một trang»: Điểm danh đầu menu, A.I Đỗ Đại Học', () => {
  const menu = (them: { moDiemDanh?: boolean } = {}) => render(<MenuDocTrong muc="hom-nay" ds={[]} onMuc={noop} coCa={false} onThi={noop} dangTai={false} onTaiLai={noop}
    chuDau="MA" moCuaEm={false} onCuaEm={noop} nutCuaEm={createRef()} token="tk" moDiemDanh={them.moDiemDanh ?? true} />)

  it('buổi đang mở ⇒ vạch thò «Điểm danh», khối chàm gửi mã bằng ĐÚNG lệnh /hs/diem-danh ⇒ «Đã điểm danh» kèm giờ', async () => {
    const f = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith('/hs/buoi-hoc')) return traLoi({ ok: true, buoi: { id: 'B1', ten: 'Buổi học 26/10/2026', lop: '12A1', daDiemDanh: false } })
      if (url.endsWith('/hs/diem-danh')) { expect(JSON.parse(String(init?.body))).toEqual({ token: 'tk', ma: '482915' }); return traLoi({ ok: true, buoi: { id: 'B1', ten: 'Buổi học 26/10/2026', lop: '12A1', daDiemDanh: true } }) }
      return traLoi({ ok: false })
    })
    vi.stubGlobal('fetch', f)
    menu()
    fireEvent.click(await screen.findByRole('button', { name: 'Mở menu · Buổi học đang mở điểm danh' }))
    const khoi = screen.getByRole('form', { name: 'Điểm danh buổi học' })
    expect(within(khoi).getByText('Buổi 26/10')).toBeTruthy()
    fireEvent.change(within(khoi).getByLabelText('Mã 6 số trên máy chiếu'), { target: { value: '482 915' } })
    fireEvent.click(within(khoi).getByRole('button', { name: 'Điểm danh' }))
    expect(await screen.findByText('Đã điểm danh')).toBeTruthy()
    expect(screen.getByText('Buổi 26/10 · 12A1')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Mở menu' })).toBeTruthy()
  })

  it('không có buổi ⇒ khối xám; QR ?diem-danh= vẫn tự gửi một lần và mở menu', async () => {
    window.history.replaceState(null, '', '/hs?diem-danh=482915')
    const f = vi.fn(async (url: string) => (url.endsWith('/hs/diem-danh') ? traLoi({ ok: true, buoi: { id: 'B1', ten: 'Buổi học 26/10/2026', lop: '12A1', daDiemDanh: true } }) : traLoi({ ok: true, buoi: null })))
    vi.stubGlobal('fetch', f)
    menu()
    expect(await screen.findByText('Đã điểm danh')).toBeTruthy()
    expect(window.location.search).toBe('')
    expect(f.mock.calls.filter(([u]) => String(u).endsWith('/hs/diem-danh')).length).toBe(1)
    await waitFor(() => expect(screen.getByRole('navigation', { name: 'Điều hướng học sinh' }).hasAttribute('data-mo')).toBe(true))
    cleanup()
    menu()
    expect(await screen.findByText('Chưa có buổi học nào đang mở')).toBeTruthy()
  })

  it('mục A.I Đỗ Đại Học bắn sự kiện mở ĐÚNG tấm chat của BongBongAiDdh', () => {
    vi.stubGlobal('fetch', vi.fn(async () => traLoi({ ok: true, buoi: null })))
    const nghe = vi.fn()
    window.addEventListener('ddh:mo-ai', nghe)
    menu({ moDiemDanh: false })
    fireEvent.click(screen.getByRole('button', { name: 'A.I Đỗ Đại Học' }))
    window.removeEventListener('ddh:mo-ai', nghe)
    expect(nghe).toHaveBeenCalledOnce()
  })
})
