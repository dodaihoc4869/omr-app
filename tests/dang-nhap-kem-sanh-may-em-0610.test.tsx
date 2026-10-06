// ĐĂNG NHẬP KÈM SẢNH — PHÍA MÁY EM (D1 vòng 2, 06/10): máy chủ trả phản hồi đăng nhập THEO LUỒNG (dòng 1 = đăng nhập, dòng 2 = `{sanh}`); máy em vào cổng ngay ở dòng 1 và
// bắn các lệnh Sảnh còn lại KHÔNG chờ Sảnh; dòng 2 thành phản hồi "hỏi sớm" của Sảnh (src/lib/hoi-som.ts): nhận đúng MỘT lần, khớp địa chỉ + thân `{token}`, hết hạn thì
// bỏ; thiếu/sai/hỏng ⇒ đi đường cũ y hệt; số lệnh tới máy chủ KHÔNG tăng (bớt đúng lệnh `hoa2-sanh`). Form đăng nhập chuyển Sảnh ra ngoài, KHÔNG để lọt vào phiên cất trong máy.
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

  it('Sảnh ĐANG VỀ theo luồng (sanhHua): bắn 4 lệnh còn lại NGAY (không chờ Sảnh); lượt hỏi của Sảnh chờ dòng 2 rồi nhận đúng phản hồi ấy MỘT lần', async () => {
    let tra!: (x: unknown) => void
    const sanhHua = new Promise<unknown>((xong) => { tra = xong })
    ghiDiaChiDaDung(GOC)
    batDauHoiSom(GOC, { token: 'tk1', sbd: '9' }, { sanhHua })
    expect(goiThat).toHaveBeenCalledTimes(4) // KHÔNG chờ Sảnh mới bắn các lệnh còn lại
    expect(duongDaGoi()).not.toContain(DUONG_SANH)
    expect(xemHoiSomDaVe(DUONG_SANH, thanTk('tk1'))).toBeNull() // chưa về: lượt vẽ đầu chưa có số
    const cho = layHoiSom(GOC + DUONG_SANH, thanTk('tk1'))
    expect(cho).not.toBeNull()
    let xong = false
    void cho!.then(() => { xong = true })
    await new Promise((r) => setTimeout(r, 5))
    expect(xong).toBe(false) // đang chờ dòng 2
    tra(SANH)
    const r = await cho!
    expect(r && (await r.json())).toEqual(SANH)
    expect(layHoiSom(GOC + DUONG_SANH, thanTk('tk1'))).toBeNull()
    expect(goiThat).toHaveBeenCalledTimes(4)
  })

  it('sanhHua về TRƯỚC lượt vẽ đầu ⇒ đọc đồng bộ có số ngay; về null / sai dạng / bị từ chối ⇒ chỗ gọi nhận null và tự gửi lệnh như cũ', async () => {
    ghiDiaChiDaDung(GOC)
    batDauHoiSom(GOC, { token: 'tk1', sbd: '9' }, { sanhHua: Promise.resolve(SANH) })
    await new Promise((r) => setTimeout(r, 0))
    expect(JSON.parse(xemHoiSomDaVe(DUONG_SANH, thanTk('tk1'))!.text)).toEqual(SANH)
    for (const hong of [null, undefined, 'x', { ok: false }, new Error('x')]) {
      ;(window as unknown as { __ddhHoiSom?: unknown }).__ddhHoiSom = undefined
      batDauHoiSom(GOC, { token: 'tk1', sbd: '9' }, { sanhHua: hong instanceof Error ? Promise.reject(hong) : Promise.resolve(hong) })
      await new Promise((r) => setTimeout(r, 0))
      expect(xemHoiSomDaVe(DUONG_SANH, thanTk('tk1')), String(hong)).toBeNull()
      await expect(layHoiSom(GOC + DUONG_SANH, thanTk('tk1')), String(hong)).resolves.toBeNull()
    }
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

describe('hsDangNhapKemSanhApi — chỉ xin kèm Sảnh khi nơi gọi chọn đúng hàm này; đọc luồng NDJSON', () => {
  const thanDaGui = () => JSON.parse(String(fetchGia.mock.calls.at(-1)![1].body)) as Record<string, unknown>
  const fetchGia = vi.fn()
  const mh = new TextEncoder()
  /** Phản hồi luồng do phép kiểm điều khiển từng nhịp. */
  const luong = () => {
    let dk!: ReadableStreamDefaultController<Uint8Array>
    const body = new ReadableStream<Uint8Array>({ start: (c) => { dk = c } })
    return { dk: () => dk, res: new Response(body, { status: 200, headers: { 'content-type': 'application/x-ndjson; charset=utf-8' } }) }
  }
  beforeEach(() => {
    fetchGia.mockReset()
    vi.stubGlobal('fetch', fetchGia)
  })
  afterEach(() => vi.unstubAllGlobals())

  it('hsDangNhapApi (màn Game, cổng cũ) KHÔNG gửi kemSanh; hsDangNhapKemSanhApi gửi kemSanh:true; hai hàm cùng đích + cùng trường còn lại', async () => {
    fetchGia.mockImplementation(async () => new Response(JSON.stringify({ ok: true, token: 'tk' }), { status: 200, headers: { 'content-type': 'application/json' } }))
    await hsDangNhapApi('', ' 99001 ', ' mk ')
    expect(String(fetchGia.mock.calls[0]![0])).toBe('https://may-chu.test/hs/dang-nhap')
    expect(thanDaGui()).toEqual({ sbd: '99001', matKhau: 'mk' })
    await hsDangNhapKemSanhApi('', ' 99001 ', ' mk ')
    expect(String(fetchGia.mock.calls[1]![0])).toBe('https://may-chu.test/hs/dang-nhap')
    expect(thanDaGui()).toEqual({ sbd: '99001', matKhau: 'mk', kemSanh: true })
  })

  it('luồng: đăng nhập trả NGAY ở dòng 1 (Sảnh chưa về), sanhHua thành phản hồi khi dòng 2 về — kể cả khi dòng bị cắt giữa chừng giữa hai nhịp', async () => {
    const l = luong()
    fetchGia.mockImplementation(async () => l.res)
    const hua = hsDangNhapKemSanhApi('', '99001', 'mk')
    const dong1 = JSON.stringify({ ok: true, token: 'tk', sbd: '99001', hoTen: 'Em' }) + '\n'
    l.dk().enqueue(mh.encode(dong1.slice(0, 20))) // nửa dòng đầu
    await new Promise((r) => setTimeout(r, 5))
    l.dk().enqueue(mh.encode(dong1.slice(20)))
    const dn = await hua // KHÔNG chờ dòng 2
    expect(dn).toMatchObject({ ok: true, token: 'tk', sbd: '99001' })
    expect(dn.sanh).toBeUndefined()
    expect(dn.sanhHua).toBeInstanceOf(Promise)
    let xong = false
    void dn.sanhHua!.then(() => { xong = true })
    await new Promise((r) => setTimeout(r, 5))
    expect(xong).toBe(false)
    const dong2 = JSON.stringify({ sanh: SANH }) + '\n'
    l.dk().enqueue(mh.encode(dong2.slice(0, 7)))
    l.dk().enqueue(mh.encode(dong2.slice(7)))
    l.dk().close()
    expect(await dn.sanhHua).toEqual(SANH)
  })

  it('luồng đóng sau dòng 1 / dòng 2 hỏng / dòng 2 là {sanh:null} ⇒ sanhHua = null (không bao giờ bị từ chối), đăng nhập vẫn thành công', async () => {
    for (const dong2 of ['', 'không phải json\n', JSON.stringify({ sanh: null }) + '\n', JSON.stringify({ khac: 1 }) + '\n']) {
      const l = luong()
      fetchGia.mockImplementation(async () => l.res)
      const hua = hsDangNhapKemSanhApi('', '99001', 'mk')
      l.dk().enqueue(mh.encode(JSON.stringify({ ok: true, token: 'tk' }) + '\n' + dong2))
      l.dk().close()
      const dn = await hua
      expect(dn.ok, dong2).toBe(true)
      expect(await dn.sanhHua, dong2).toBeNull()
    }
  })

  it('máy chủ CŨ (JSON một khối, có hay không `sanh`) hoặc đăng nhập sai (JSON một khối) ⇒ y như trước: không sanhHua', async () => {
    fetchGia.mockImplementation(async () => new Response(JSON.stringify({ ok: false, error: 'Mật khẩu không chính xác' }), { status: 200, headers: { 'content-type': 'application/json;charset=utf-8' } }))
    const sai = await hsDangNhapKemSanhApi('', '99001', 'x')
    expect(sai).toMatchObject({ ok: false, error: 'Mật khẩu không chính xác' })
    expect(sai.sanhHua).toBeUndefined()
    fetchGia.mockImplementation(async () => new Response(JSON.stringify({ ok: true, token: 'tk', sanh: SANH }), { status: 200, headers: { 'content-type': 'application/json' } }))
    const cu = await hsDangNhapKemSanhApi('', '99001', 'mk')
    expect(cu).toMatchObject({ ok: true, token: 'tk', sanh: SANH })
    expect(cu.sanhHua).toBeUndefined()
  })

  it('luồng rỗng / dòng 1 hỏng ⇒ báo lỗi như mọi lỗi mạng (ok:false, không treo)', async () => {
    const l = luong()
    fetchGia.mockImplementation(async () => l.res)
    const hua = hsDangNhapKemSanhApi('', '99001', 'mk')
    l.dk().close()
    expect(await hua).toMatchObject({ ok: false })
    const l2 = luong()
    fetchGia.mockImplementation(async () => l2.res)
    const hua2 = hsDangNhapKemSanhApi('', '99001', 'mk')
    l2.dk().enqueue(mh.encode('{hỏng\n'))
    l2.dk().close()
    expect(await hua2).toMatchObject({ ok: false })
  })

  it('máy KHÔNG đọc được luồng (thiếu ReadableStream) ⇒ KHÔNG xin kemSanh (khỏi chờ cả thân mới đăng nhập được)', async () => {
    vi.stubGlobal('ReadableStream', undefined)
    fetchGia.mockImplementation(async () => new Response(JSON.stringify({ ok: true, token: 'tk' }), { status: 200, headers: { 'content-type': 'application/json' } }))
    await hsDangNhapKemSanhApi('', '99001', 'mk')
    expect(thanDaGui()).toEqual({ sbd: '99001', matKhau: 'mk' })
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
  it('phản hồi có `sanhHua` (luồng) ⇒ onDangNhap(phiên, { sanhHua }) — đúng lời hứa ấy; phiên KHÔNG chứa nó', async () => {
    const sanhHua = Promise.resolve(SANH)
    const dangNhap = vi.fn(async () => ({ ok: true, sbd: '99001', hoTen: 'Em', lop: '12A', namSinh: '2008', token: 'tk-moi', sanhHua }))
    const onDangNhap = vi.fn()
    render(<DangNhapHocSinh api={{ dangNhap, datMatKhau: vi.fn() } as never} onDangNhap={onDangNhap} logo={null} />)
    await dien()
    await waitFor(() => expect(onDangNhap).toHaveBeenCalledTimes(1))
    const [phien, kem] = onDangNhap.mock.calls[0]!
    expect(phien).toEqual({ sbd: '99001', hoTen: 'Em', lop: '12A', namSinh: '2008', token: 'tk-moi' })
    expect(kem.sanhHua).toBe(sanhHua)
    expect('sanh' in kem).toBe(false)
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
