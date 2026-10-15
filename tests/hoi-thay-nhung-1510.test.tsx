// ĐƯỜNG /hoi-thay (thầy 15/10/2026: "nối nguyên nút hỏi thầy trong app vào từng câu" các trang bài làm HTML văn phòng gửi em).
// Trang mẹ https://ddh-tai-lieu.pages.dev mở iframe `/hoi-thay?qid=…&dl=…&nguon=trang_html#t=<token>` ⇒ hộp Hỏi Thầy của app.
// Kiểm: định tuyến (vai hoithay, không phải app thầy), token qua #t (cất phiên, xoá hash, không gửi ngược), đăng nhập khi chưa có phiên,
// tin postMessage CHỈ tới đúng gốc trang mẹ, phiên hỏng ⇒ báo trang mẹ xoá token, lời máy chủ khác giữ nguyên, token dự phòng trong bộ nhớ.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
import { readFileSync } from 'node:fs'
import { docDuongVao } from '../src/lib/vai-tro'
import { docThamSoHoiThay, KHOA_PHIEN, laLoiPhien, ME_ORIGIN, phienTuToken, sbdCuaToken, tokenCuaHash } from '../src/lib/hoi-thay-nhung'
import { KHOA_PHIEN_HS } from '../src/lib/nap-truoc-man-em'

const KHOA = 'omr_student_portal_auth'
const tokenCua = (sbd: string, them: Record<string, unknown> = {}) => `${btoa(JSON.stringify({ sbd, exp: Date.now() + 1e9, pwd: 'x', ...them }))}.chuky`
const CAU = { qid: 'DH-10-C2-B5-I-1', so: 'Câu 1', nguon: 'DH-10-C2-B5', chuong: 'Nguyên tử', de: '<p>Đề thử</p>', y: { A: 'a', B: 'b', C: 'c', D: 'd' } }

describe('định tuyến /hoi-thay', () => {
  it('main.tsx dựng gốc riêng cho /hoi-thay (không App.tsx của thầy), không service worker, không đếm online', () => {
    const ma = readFileSync('src/main.tsx', 'utf8')
    expect(ma).toContain("const laHoiThay = /^\\/hoi-thay\\/?$/.test(location.pathname)")
    expect(ma).toContain("import('./screens/hoi-thay-goc')")
    expect(ma).toContain('else if (!laHoiThay) dangKySW()')
    expect(ma).toContain('if (!laHoiThay) startAppPresence()')
    expect(/^\/hoi-thay\/?$/.test('/hoi-thay')).toBe(true)
    expect(/^\/hoi-thay\/?$/.test('/hs')).toBe(false)
  })
  it('vai-tro không nhận /hoi-thay là vai nào ⇒ không chuẩn hoá địa chỉ, không nhớ vai, không đụng ba app', () => {
    expect(docDuongVao('?qid=X&dl=1', '/hoi-thay')).toEqual({ vai: null, maCa: '' })
  })
  it('cửa vào nạp đúng màn có default + huaManEmSom (khuôn GocApp của main.tsx)', async () => {
    const { napHoiThay } = await import('../src/screens/hoi-thay-goc')
    const m = await napHoiThay()
    expect(typeof m.default).toBe('function')
    expect(m.huaManEmSom()).toBeNull()
  })
})

describe('phần thuần (src/lib/hoi-thay-nhung.ts)', () => {
  it('tham số: dl=1 là đang làm, nguồn mặc định trang_html và bị lọc kí tự lạ, em ≤ 12 kí tự', () => {
    expect(docThamSoHoiThay('?qid=TL-de-1-I-3&dl=1')).toEqual({ qid: 'TL-de-1-I-3', dangLam: true, nguon: 'trang_html', dapAnEm: '' })
    expect(docThamSoHoiThay('?qid=Q&dl=0&nguon=trang<x>&em=B')).toEqual({ qid: 'Q', dangLam: false, nguon: 'trangx', dapAnEm: 'B' })
  })
  it('token trong #t, kể cả có khoá khác; không có ⇒ rỗng', () => {
    expect(tokenCuaHash('#t=abc.def')).toBe('abc.def')
    expect(tokenCuaHash('#a=1&t=abc%2Bx.y')).toBe('abc+x.y')
    expect(tokenCuaHash('#ta=1')).toBe('')
    expect(tokenCuaHash('')).toBe('')
  })
  it('SBD đọc từ token học sinh; mã phụ huynh (có purpose) và chuỗi hỏng ⇒ rỗng', () => {
    expect(sbdCuaToken(tokenCua('12001'))).toBe('12001')
    expect(sbdCuaToken(tokenCua('12001', { purpose: 'game-parent' }))).toBe('')
    expect(sbdCuaToken('khong-phai-token')).toBe('')
  })
  it('phiên cho token trang mẹ: cùng em giữ tên lớp, khác em thay cả phiên', () => {
    const t = tokenCua('12001')
    expect(phienTuToken(t, { sbd: '12001', hoTen: 'Em A', lop: '12A', namSinh: '2008', token: 'cu' })).toEqual({ sbd: '12001', hoTen: 'Em A', lop: '12A', namSinh: '2008', token: t })
    expect(phienTuToken(t, { sbd: '99999', hoTen: 'Em B', lop: '12B', namSinh: '2008', token: 'cu' })).toEqual({ sbd: '12001', hoTen: '', lop: '', namSinh: '', token: t })
    expect(phienTuToken('hong', null)).toBeNull()
  })
  it('lời phiên hỏng ⇒ đăng nhập lại; lời khoá ca kiểm tra thì không', () => {
    expect(laLoiPhien('Phiên game đã hết hạn. Em đăng nhập lại.')).toBe(true)
    expect(laLoiPhien('Mật khẩu đã đổi. Em đăng nhập lại.')).toBe(true)
    expect(laLoiPhien('Em nhập lại mật khẩu để mở hồ sơ game trên máy này.')).toBe(true)
    expect(laLoiPhien('Em đăng nhập lại để hỏi thầy.')).toBe(true)
    expect(laLoiPhien('Em đang có ca kiểm tra mở nên nút Hỏi thầy tạm khoá. Làm xong ca kiểm tra rồi hỏi nhé.')).toBe(false)
    expect(laLoiPhien('Không tìm thấy câu này trong kho đề.')).toBe(false)
  })
  it('khoá phiên viết thẳng trùng khoá cổng học sinh', () => {
    expect(KHOA_PHIEN).toBe(KHOA_PHIEN_HS)
  })
})

describe('màn /hoi-thay trong iframe trang mẹ', () => {
  let tra: unknown
  const goi: { url: string; body: Record<string, unknown> }[] = []
  const me = { postMessage: vi.fn() }
  const parentGoc = Object.getOwnPropertyDescriptor(window, 'parent')

  const moMan = async (duong: string) => {
    history.replaceState(null, '', duong)
    vi.resetModules()
    const { default: Man } = await import('../src/screens/HoiThayScreen')
    return render(<Man />)
  }

  beforeEach(() => {
    goi.length = 0
    me.postMessage.mockClear()
    localStorage.clear()
    Object.defineProperty(window, 'parent', { configurable: true, get: () => me })
    vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit) => {
      goi.push({ url, body: JSON.parse(String(init.body)) })
      return new Response(JSON.stringify(tra), { headers: { 'content-type': 'application/json' } })
    }))
  })
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
    localStorage.clear()
    if (parentGoc) Object.defineProperty(window, 'parent', parentGoc)
    history.replaceState(null, '', '/')
  })

  it('token qua #t: cất phiên, xoá hash khỏi địa chỉ, hỏi máy chủ đúng câu (đang làm ⇒ chiHoi), mở hộp Hỏi Thầy, KHÔNG gửi token ngược', async () => {
    const t = tokenCua('12001')
    tra = { ok: true, chiHoi: true, cau: CAU, hoiThem: true }
    await moMan(`/hoi-thay?qid=DH-10-C2-B5-I-1&dl=1&nguon=trang_html#t=${encodeURIComponent(t)}`)
    expect(location.hash).toBe('')
    expect(location.pathname + location.search).toBe('/hoi-thay?qid=DH-10-C2-B5-I-1&dl=1&nguon=trang_html')
    expect(JSON.parse(localStorage.getItem(KHOA)!)).toMatchObject({ sbd: '12001', token: t })
    await waitFor(() => expect(screen.getByRole('dialog').textContent).toContain('Câu 1'))
    expect(screen.getByText(/Thầy gợi hướng, chưa nói đáp án/)).toBeTruthy()
    const hoi = goi.find((x) => x.url === 'https://may.test/hs/hoi-thay')
    expect(hoi!.body).toEqual({ token: t, qid: 'DH-10-C2-B5-I-1', nguon: 'trang_html', chiHoi: true })
    expect(me.postMessage.mock.calls.some(([tin]) => tin?.type === 'ddh-hs-token')).toBe(false)
    // Đóng ⇒ báo trang mẹ, chỉ tới đúng gốc
    fireEvent.click(screen.getByRole('button', { name: 'Đóng' }))
    expect(me.postMessage).toHaveBeenCalledWith({ type: 'ddh-hoi-thay-dong' }, ME_ORIGIN)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('đã có phiên trong máy (không qua #t) ⇒ gửi token cho trang mẹ cất hộ, chỉ tới gốc trang mẹ; đã nộp ⇒ có lối sang lời giải từng bước', async () => {
    localStorage.setItem(KHOA, JSON.stringify({ sbd: '12001', hoTen: 'Em', lop: '12', namSinh: '', token: 'tok-luu' }))
    tra = { ok: true, coLoiGiai: false, cau: CAU, loiGiaiChu: { dapAn: 'A', chot: 'Chốt', tung: [], buoc: [], ketQua: '' }, hoiThem: true }
    await moMan('/hoi-thay?qid=DH-10-C2-B5-I-1&dl=0&em=B')
    await waitFor(() => expect(screen.getByRole('dialog').textContent).toContain('Câu 1'))
    expect(me.postMessage).toHaveBeenCalledWith({ type: 'ddh-hs-token', token: 'tok-luu' }, ME_ORIGIN)
    expect(me.postMessage.mock.calls.every(([, goc]) => goc === ME_ORIGIN)).toBe(true)
    expect(goi.find((x) => x.url === 'https://may.test/hs/hoi-thay')!.body).toEqual({ token: 'tok-luu', qid: 'DH-10-C2-B5-I-1', nguon: 'trang_html' })
    expect(screen.getByRole('button', { name: /Xem lời giải từng bước/ })).toBeTruthy()
  })

  it('chưa có phiên ⇒ thẻ đăng nhập học sinh của app; bấm đóng ⇒ báo trang mẹ', async () => {
    await moMan('/hoi-thay?qid=DH-10-C2-B5-I-1&dl=1')
    await waitFor(() => expect(screen.getByText('Em đăng nhập một lần để hỏi Thầy câu này.')).toBeTruthy())
    expect(screen.getByRole('button', { name: /Đăng nhập/ })).toBeTruthy()
    expect(goi.length).toBe(0)
    fireEvent.click(screen.getByRole('button', { name: /Đóng, quay lại bài làm/ }))
    expect(me.postMessage).toHaveBeenCalledWith({ type: 'ddh-hoi-thay-dong' }, ME_ORIGIN)
  })

  it('máy chủ báo phiên hỏng ⇒ xoá phiên, báo trang mẹ đăng xuất, hiện đăng nhập', async () => {
    localStorage.setItem(KHOA, JSON.stringify({ sbd: '12001', token: 'tok-cu' }))
    tra = { ok: false, error: 'Phiên game đã hết hạn. Em đăng nhập lại.' }
    await moMan('/hoi-thay?qid=DH-10-C2-B5-I-1&dl=1')
    await waitFor(() => expect(screen.getByText('Em đăng nhập một lần để hỏi Thầy câu này.')).toBeTruthy())
    expect(me.postMessage).toHaveBeenCalledWith({ type: 'ddh-hs-dang-xuat' }, ME_ORIGIN)
    expect(localStorage.getItem(KHOA)).toBeNull()
  })

  it('máy chủ khoá (đang có ca kiểm tra) ⇒ nói đúng lời máy chủ, không mở hộp, giữ phiên', async () => {
    localStorage.setItem(KHOA, JSON.stringify({ sbd: '12001', token: 'tok' }))
    tra = { ok: false, khoa: 'dang_kiem_tra', error: 'Em đang có ca kiểm tra mở nên nút Hỏi thầy tạm khoá. Làm xong ca kiểm tra rồi hỏi nhé.' }
    await moMan('/hoi-thay?qid=DH-10-C2-B5-I-1&dl=0')
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('ca kiểm tra mở'))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(localStorage.getItem(KHOA)).not.toBeNull()
  })

  it('đang làm mà phần hỏi Thầy chưa bật cho em ⇒ nhắc làm xong rồi hỏi (không lộ lời giải)', async () => {
    localStorage.setItem(KHOA, JSON.stringify({ sbd: '12001', token: 'tok' }))
    tra = { ok: true, chiHoi: true, cau: CAU, hoiThem: false }
    await moMan('/hoi-thay?qid=DH-10-C2-B5-I-1&dl=1')
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Em làm xong câu này rồi bấm Hỏi thầy'))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('trình duyệt CHẶN HẲN localStorage (đọc là ném lỗi) ⇒ kho nhớ tạm: token #t vẫn dùng được để hỏi', async () => {
    const goc = Object.getOwnPropertyDescriptor(window, 'localStorage') ?? Object.getOwnPropertyDescriptor(Object.getPrototypeOf(window), 'localStorage')
    Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new DOMException('chặn', 'SecurityError') } })
    try {
      const t = tokenCua('12002')
      tra = { ok: true, chiHoi: true, cau: CAU, hoiThem: true }
      await moMan(`/hoi-thay?qid=DH-10-C2-B5-I-1&dl=1#t=${t}`)
      await waitFor(() => expect(screen.getByRole('dialog').textContent).toContain('Câu 1'))
      expect(goi.find((x) => x.url === 'https://may.test/hs/hoi-thay')!.body).toMatchObject({ token: t, chiHoi: true })
    } finally {
      if (goc) Object.defineProperty(window, 'localStorage', { ...goc, configurable: true })
      else delete (window as { localStorage?: unknown }).localStorage
    }
  })
})
