// ĐĂNG NHẬP KÈM SẢNH — PHÍA MÁY EM (D1 vòng 2, 06/10): phản hồi `hoa2-sanh` máy chủ đính kèm lệnh đăng nhập thành phản hồi "hỏi sớm" ĐÃ VỀ của Sảnh
// (src/lib/hoi-som.ts): nhận đúng MỘT lần, khớp địa chỉ + thân `{token}`, hết hạn thì bỏ; sai dạng thì đi đường cũ y hệt; số lệnh tới máy chủ KHÔNG tăng
// (bớt đúng lệnh `hoa2-sanh`). Form đăng nhập chuyển `sanh` ra ngoài, KHÔNG để lọt vào phiên cất trong máy.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { batDauHoiSom, danhDauDaNhan, diaChiDangDung, ghiDiaChiDaDung, HAN_SANH_KEM_MS, layHoiSom, xemHoiSomDaVe } from '../src/lib/hoi-som'
import DangNhapHocSinh from '../src/screens/DangNhapHocSinh'
import { hsDangNhapApi, hsDangNhapKemSanhApi } from '../src/lib/hs-dang-nhap-api'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-chu.test' }))
vi.mock('../src/lib/exam-db', async (goc) => ({ ...(await goc<Record<string, unknown>>()), loadScriptUrlHoacMacDinh: async () => '/test' }))

const GOC = 'https://omr.ttadodaihoc.workers.dev'
const SANH = { ok: true, cheDo2: true, ngay: '2026-10-06', theLuc: { con: 28, tong: 40 }, serverNow: 1_700_000_000_000, nhipDeNghi: 1 }
const thanTk = (token: string) => JSON.stringify({ token })
const DUONG_SANH = '/game-v2/hoa2-sanh'

describe('hoi-som — phản hồi Sảnh đi kèm lệnh đăng nhập', () => {
  let goiThat: ReturnType<typeof vi.fn>
  const fetchCu = window.fetch
  beforeEach(() => {
    ;(window as unknown as { __ddhHoiSom?: unknown }).__ddhHoiSom = undefined
    goiThat = vi.fn(async (url: string) => new Response(JSON.stringify({ ok: true, url }), { status: 200 }))
    vi.stubGlobal('fetch', goiThat)
    window.fetch = goiThat as unknown as typeof fetch
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    window.fetch = fetchCu
  })
  const duongDaGoi = () => goiThat.mock.calls.map((c) => String(c[0]).replace(GOC, ''))

  it('có `sanh` hợp lệ ⇒ KHÔNG gửi lệnh hoa2-sanh, vẫn gửi 4 lệnh Sảnh còn lại; Sảnh nhận đúng phản hồi ấy MỘT lần', async () => {
    batDauHoiSom(GOC, { token: 'tk1', sbd: '9' }, { sanh: SANH })
    expect(goiThat).toHaveBeenCalledTimes(4)
    expect(duongDaGoi()).not.toContain(DUONG_SANH)
    expect(duongDaGoi().sort()).toEqual(['/hs/buoi-hoc', '/hs/ca-dang-mo', '/hs/ke-hoach-ngay', '/hs/lich-su'])
    const r = await layHoiSom(GOC + DUONG_SANH, thanTk('tk1'))
    expect(r?.status).toBe(200)
    expect(r && (await r.json())).toEqual(SANH)
    expect(layHoiSom(GOC + DUONG_SANH, thanTk('tk1'))).toBeNull() // lượt sau gửi lệnh thật như cũ
    expect(goiThat).toHaveBeenCalledTimes(4)
  })

  it('đọc đồng bộ cho lượt vẽ ĐẦU của Sảnh: có số ngay khi đã biết địa chỉ; đánh dấu đã nhận thì thôi', () => {
    ghiDiaChiDaDung(GOC)
    batDauHoiSom(GOC, { token: 'tk1', sbd: '9' }, { sanh: SANH })
    const x = xemHoiSomDaVe(DUONG_SANH, thanTk('tk1'))
    expect(x).toMatchObject({ ok: true, status: 200 })
    expect(JSON.parse(x!.text)).toEqual(SANH)
    danhDauDaNhan(DUONG_SANH, thanTk('tk1'))
    expect(xemHoiSomDaVe(DUONG_SANH, thanTk('tk1'))).toBeNull()
  })

  it('khác token (em khác) hoặc khác máy chủ ⇒ không nhận', () => {
    ghiDiaChiDaDung(GOC)
    batDauHoiSom(GOC, { token: 'tk1', sbd: '9' }, { sanh: SANH })
    expect(layHoiSom(GOC + DUONG_SANH, thanTk('tk2'))).toBeNull()
    expect(layHoiSom('https://khac.workers.dev' + DUONG_SANH, thanTk('tk1'))).toBeNull()
    expect(xemHoiSomDaVe(DUONG_SANH, thanTk('tk2'))).toBeNull()
  })

  it('`sanh` sai dạng (null, chuỗi, mảng, ok:false, thiếu ok) ⇒ bỏ qua: gửi đủ 5 lệnh như cũ', () => {
    for (const hong of [undefined, null, 'x', [], { ok: false, error: 'Lỗi' }, { cheDo2: true }]) {
      ;(window as unknown as { __ddhHoiSom?: unknown }).__ddhHoiSom = undefined
      goiThat.mockClear()
      batDauHoiSom(GOC, { token: 'tk1', sbd: '9' }, { sanh: hong })
      expect(goiThat, JSON.stringify(hong)).toHaveBeenCalledTimes(5)
      expect(duongDaGoi(), JSON.stringify(hong)).toContain(DUONG_SANH)
    }
  })

  it('không có `kem` (lệnh đăng nhập cũ / máy chủ cũ) ⇒ y hệt trước: gửi đủ 5 lệnh', () => {
    batDauHoiSom(GOC, { token: 'tk1', sbd: '9' })
    expect(goiThat).toHaveBeenCalledTimes(5)
  })

  it(`quá hạn ${HAN_SANH_KEM_MS / 1000} giây mà chưa ai nhận ⇒ BỎ (không để số cũ lọt vào lượt vẽ sau): không nhận, không đọc đồng bộ`, () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(1_000_000)
    ghiDiaChiDaDung(GOC)
    batDauHoiSom(GOC, { token: 'tk1', sbd: '9' }, { sanh: SANH })
    vi.setSystemTime(1_000_000 + HAN_SANH_KEM_MS - 1)
    expect(xemHoiSomDaVe(DUONG_SANH, thanTk('tk1'))).not.toBeNull()
    vi.setSystemTime(1_000_000 + HAN_SANH_KEM_MS + 1)
    expect(xemHoiSomDaVe(DUONG_SANH, thanTk('tk1'))).toBeNull()
    expect(layHoiSom(GOC + DUONG_SANH, thanTk('tk1'))).toBeNull()
  })

  it('diaChiDangDung trả địa chỉ máy chủ đã ghi (để vỏ app ghi phản hồi ngay, không chờ đọc IndexedDB)', () => {
    ghiDiaChiDaDung(GOC)
    expect(diaChiDangDung()).toBe(GOC)
  })
})

describe('hsDangNhapKemSanhApi — chỉ xin kèm Sảnh khi nơi gọi chọn đúng hàm này', () => {
  const thanDaGui = () => JSON.parse(String(fetchGia.mock.calls.at(-1)![1].body)) as Record<string, unknown>
  const fetchGia = vi.fn()
  beforeEach(() => {
    fetchGia.mockReset()
    fetchGia.mockImplementation(async () => new Response(JSON.stringify({ ok: true, token: 'tk', sanh: SANH }), { status: 200 }))
    vi.stubGlobal('fetch', fetchGia)
  })
  afterEach(() => vi.unstubAllGlobals())

  it('hsDangNhapApi (màn Game, cổng cũ) KHÔNG gửi kemSanh; hsDangNhapKemSanhApi gửi kemSanh:true; hai hàm cùng đích + cùng trường còn lại', async () => {
    await hsDangNhapApi('', ' 99001 ', ' mk ')
    expect(String(fetchGia.mock.calls[0]![0])).toBe('https://may-chu.test/hs/dang-nhap')
    expect(thanDaGui()).toEqual({ sbd: '99001', matKhau: 'mk' })
    const r = await hsDangNhapKemSanhApi('', ' 99001 ', ' mk ')
    expect(String(fetchGia.mock.calls[1]![0])).toBe('https://may-chu.test/hs/dang-nhap')
    expect(thanDaGui()).toEqual({ sbd: '99001', matKhau: 'mk', kemSanh: true })
    expect(r.sanh).toEqual(SANH)
  })
})

describe('DangNhapHocSinh — chuyển `sanh` ra ngoài, không để lọt vào phiên', () => {
  afterEach(() => cleanup())
  const dien = async () => {
    fireEvent.change(await screen.findByLabelText('Số báo danh (SBD)'), { target: { value: '99001' } })
    fireEvent.change(screen.getByLabelText('Mật khẩu'), { target: { value: 'mk' } })
    fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }))
  }
  it('phản hồi có `sanh` ⇒ onDangNhap(phiên, { sanh }); phiên KHÔNG chứa `sanh`', async () => {
    const dangNhap = vi.fn(async () => ({ ok: true, sbd: '99001', hoTen: 'Em', lop: '12A', namSinh: '2008', token: 'tk-moi', sanh: SANH }))
    const onDangNhap = vi.fn()
    render(<DangNhapHocSinh api={{ dangNhap, datMatKhau: vi.fn() } as never} onDangNhap={onDangNhap} logo={null} />)
    await dien()
    await waitFor(() => expect(onDangNhap).toHaveBeenCalledTimes(1))
    const [phien, kem] = onDangNhap.mock.calls[0]!
    expect(phien).toEqual({ sbd: '99001', hoTen: 'Em', lop: '12A', namSinh: '2008', token: 'tk-moi' })
    expect(kem).toEqual({ sanh: SANH })
  })
  it('phản hồi KHÔNG có `sanh` ⇒ onDangNhap(phiên, undefined) — y như trước', async () => {
    const dangNhap = vi.fn(async () => ({ ok: true, sbd: '99001', hoTen: 'Em', token: 'tk-moi' }))
    const onDangNhap = vi.fn()
    render(<DangNhapHocSinh api={{ dangNhap, datMatKhau: vi.fn() } as never} onDangNhap={onDangNhap} logo={null} />)
    await dien()
    await waitFor(() => expect(onDangNhap).toHaveBeenCalledTimes(1))
    const [phien, kem] = onDangNhap.mock.calls[0]!
    expect(phien).toMatchObject({ sbd: '99001', token: 'tk-moi' })
    expect(kem).toBeUndefined()
  })
  it('đăng nhập sai ⇒ báo lỗi như cũ, không gọi onDangNhap (kể cả khi máy chủ lỡ gửi kèm `sanh`)', async () => {
    const dangNhap = vi.fn(async () => ({ ok: false, error: 'Mật khẩu không chính xác', sanh: SANH }))
    const onDangNhap = vi.fn()
    render(<DangNhapHocSinh api={{ dangNhap, datMatKhau: vi.fn() } as never} onDangNhap={onDangNhap} logo={null} />)
    await dien()
    expect(await screen.findByText('Mật khẩu không chính xác')).toBeTruthy()
    expect(onDangNhap).not.toHaveBeenCalled()
  })
})
