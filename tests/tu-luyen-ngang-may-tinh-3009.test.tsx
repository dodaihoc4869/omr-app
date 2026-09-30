// TU LUYỆN NGANG + MÁY TÍNH (30/09, thầy: "mục tu luyện tất cả các thẻ các lớp phải có giao diện xoay ngang và máy tính"). Khoá:
// (1) màn dọc (không matchMedia / không khớp) GIỮ NGUYÊN bố cục cũ; (2) máy tính: lưới 6 thẻ có số liệu nhanh có nhãn, cài đặt hai cột,
// làm bài hai cột với lưới câu theo phần + MỘT nút Nộp + phím tắt (A–D, Đ/S, ←/→) không bắt khi đang gõ; (3) điện thoại ngang: phiếu trả lời
// chạm được (A–D, ý Đ → S → trống) ghi cùng một hàm với thẻ câu; (4) kết quả: bản đồ câu + lọc Tất cả / Câu sai / Câu đúng; (5) chế độ 1 luật mới:
// kho câu sai + thanh chọn cho vượt kho (báo câu lặp), nhãn "Luyện lại lần K" + "Sai gốc"; (6) Luyện đề cấu trúc dùng cùng khung.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import ManTuLuyen from '../src/components/tu-luyen/ManTuLuyen'
import LuyenDeCauTruc from '../src/components/tu-luyen/LuyenDeCauTruc'
import { MQ_NGANG, MQ_RONG } from '../src/components/tu-luyen/bo-cuc'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
vi.mock('../src/lib/may-chu-moi', () => ({ layCauHinhMayChu: async () => ({ URL: 'https://may.test' }), xongNapDiaChi: async () => {} }))

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
  try { localStorage.clear() } catch { /* bỏ qua */ }
})

function khoMan(q: string | null) {
  vi.stubGlobal('matchMedia', (m: string) => ({ matches: m === q, media: m, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }))
}

const CAU = [
  { qid: 'q1', phan: 'I', text: 'Câu một', luaChon: ['A1', 'B1', 'C1', 'D1'], tenDang: 'Dạng A', sao: 0, loai: 'ly_thuyet', nhanLuyen: 'Luyện lần đầu', saiGoc: 'Sai gốc: Ca kiểm tra Ester · 29/09' },
  { qid: 'q2', phan: 'II', text: 'Câu hai', luaChon: ['ý a', 'ý b', 'ý c', 'ý d'], tenDang: 'Dạng B', sao: 2, loai: 'ly_thuyet', nhanLuyen: 'Luyện lại lần 2', saiGoc: 'Sai gốc: Chiến dịch Ôn ester · Đoàn Hộ Tống · 30/09' },
  { qid: 'q3', phan: 'III', text: 'Câu ba', luaChon: null, tenDang: 'Dạng C', sao: 1, loai: 'bai_tap' },
]
function giaLap() {
  const cuoc: { u: string; body: Record<string, unknown> }[] = []
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: { body?: string }) => {
    const u = new URL(String(url)).pathname
    const body = JSON.parse(init?.body || '{}')
    cuoc.push({ u, body })
    const ok = (b: unknown) => ({ ok: true, status: 200, json: async () => b })
    if (u === '/hs/tu-luyen/nguon') return ok({ ok: true, cacCa: [{ maCa: 'C1', tenCa: 'Ca Ester', soCauSai: 9 }], soCauSai: 9, danhMuc: [{ lop: '12', bais: [{ tenBai: 'Bài 1', dangs: [{ ma: 'DB-12-B1-D1', ten: 'Dạng A', soCau: 40 }] }] }], dangThi: false, khoCauSai: { tong: 23, tuCa: 15, tuChienDich: 8, loi: '' } })
    if (u === '/hs/tu-luyen/tong-hop') return ok({ ok: true, luot: [], cau: [] })
    if (u === '/hs/tu-luyen/xem-truoc') return ok({ ok: true, tongToiDa: 40 })
    if (u === '/hs/tu-luyen/rut') return ok({ ok: true, luotId: 'tl_abcdef01', cheDo: body.cheDo, tieuDe: 'Sửa câu sai · 3 câu', taoLuc: Date.now(), cau: CAU })
    if (u === '/hs/tu-luyen/nop') return ok({ ok: true, luotId: 'tl_abcdef01', cheDo: 1, tieuDe: 'Sửa câu sai · 3 câu', soCau: 3, soDung: 1, diem: 3.33, giay: 60, nopLuc: Date.now(), cau: [
      { qid: 'q1', phan: 'I', dung: true, diem: 1, traLoi: 'B', dapAn: 'B' },
      { qid: 'q2', phan: 'II', dung: false, diem: 0.25, traLoi: 'DSSS', dapAn: 'DSDS', yDung: 2 },
      { qid: 'q3', phan: 'III', dung: false, diem: 0, traLoi: '', dapAn: '8,8' },
    ] })
    if (u === '/luyen-de/dieu-kien') return ok({ ok: true, trangThai: 'mo', lyDo: '', items: [{ id: 'p1', createdAt: Date.now(), status: 'submitted', score: 7.25 }] })
    return ok({ ok: true, items: [] })
  }))
  return cuoc
}

async function moCheDo1() {
  const cuoc = giaLap()
  render(<ManTuLuyen token="t" sbd="S1" onVe={() => {}} />)
  const the = await screen.findByRole('radio', { name: /Sửa câu sai/ })
  await waitFor(() => expect((the as HTMLButtonElement).disabled).toBe(false))
  fireEvent.click(the)
  return cuoc
}

describe('Màn dọc giữ nguyên', () => {
  it('không khớp khổ ngang/máy tính ⇒ bố cục cũ (4 thẻ chế độ, thanh Nộp ở đáy, không lưới câu bên phải)', async () => {
    khoMan(null)
    await moCheDo1()
    expect(document.querySelector('.tlu-rong')).toBeNull()
    expect(screen.getAllByRole('radio').filter((r) => r.classList.contains('tlu-the-che-do')).length).toBe(4)
    fireEvent.click(screen.getByRole('button', { name: /Luyện 10 câu sai/ }))
    await screen.findByText('Câu một')
    expect(document.querySelector('.tlu-thanh-nop')).not.toBeNull()
    expect(screen.queryByRole('navigation', { name: 'Lưới câu theo phần' })).toBeNull()
    expect(screen.getByText('Luyện lại lần 2')).toBeTruthy()
    expect(screen.getByText('Sai gốc: Chiến dịch Ôn ester · Đoàn Hộ Tống · 30/09')).toBeTruthy()
  })
})

describe('Máy tính (≥ 900 px)', () => {
  it('màn chọn: 6 thẻ (4 chế độ + Tổng hợp + Luyện đề), số liệu nhanh có nhãn', async () => {
    khoMan(MQ_RONG)
    giaLap()
    render(<ManTuLuyen token="t" sbd="S1" onVe={() => {}} />)
    await screen.findByText('câu sai còn phải sửa')
    expect(document.querySelectorAll('.tlu-luoi-the .tlu-the-lon').length).toBe(6)
    expect(screen.getByRole('button', { name: /^Tổng hợp/ })).toBeTruthy()
    await waitFor(() => expect(screen.getByText('đề đã nộp')).toBeTruthy())
    expect(screen.getByText('7,25/10')).toBeTruthy()
  })
  it('cài đặt chế độ 1: kho câu sai + thanh chọn cho vượt kho (báo câu lặp); gửi đúng số câu', async () => {
    khoMan(MQ_RONG)
    const cuoc = await moCheDo1()
    expect(screen.getByText('Kho câu sai của em')).toBeTruthy()
    expect(screen.getByText('15 từ ca kiểm tra · 8 từ chiến dịch')).toBeTruthy()
    const thanh = screen.getByLabelText('Số câu') as HTMLInputElement
    expect(thanh.max).toBe('46')
    fireEvent.change(thanh, { target: { value: '30' } })
    expect(screen.getByText(/sẽ có 7 câu lặp lại/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Luyện 30 câu sai' }))
    await screen.findByText('Câu một')
    expect(cuoc.find((c) => c.u === '/hs/tu-luyen/rut')!.body).toMatchObject({ cheDo: 1, soCau: 30 })
  })
  it('làm bài: lưới câu theo phần + MỘT nút Nộp; phím A–D / Đ-S / ←→ ghi đúng câu, không bắt khi đang gõ', async () => {
    khoMan(MQ_RONG)
    await moCheDo1()
    fireEvent.click(screen.getByRole('button', { name: /Luyện 10 câu sai/ }))
    await screen.findByText('Câu một')
    const luoi = screen.getByRole('navigation', { name: 'Lưới câu theo phần' })
    expect(within(luoi).getAllByRole('button').length).toBe(3)
    expect(screen.getAllByRole('button', { name: 'Nộp bài' }).length).toBe(1)
    expect(document.querySelector('.tlu-thanh-nop')).toBeNull()
    fireEvent.keyDown(window, { key: 'b' })
    await waitFor(() => expect(within(luoi).getByRole('button', { name: 'Câu 1, đã làm' })).toBeTruthy())
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    await waitFor(() => expect(within(luoi).getByRole('button', { name: /Câu 2/ }).getAttribute('aria-current')).toBe('true'))
    fireEvent.keyDown(window, { key: 'đ' })
    fireEvent.keyDown(window, { key: 's' })
    fireEvent.keyDown(window, { key: 'd' })
    fireEvent.keyDown(window, { key: 's' })
    await waitFor(() => expect(within(luoi).getByRole('button', { name: 'Câu 2, đã làm' })).toBeTruthy())
    // Đang gõ trong ô trả lời ngắn ⇒ phím không bị bắt.
    const o = document.querySelector('#tlu-lam-q3 input') as HTMLInputElement
    o.focus()
    fireEvent.keyDown(o, { key: 'a' })
    expect(within(luoi).getByRole('button', { name: 'Câu 3, chưa làm' })).toBeTruthy()
    const luu = JSON.parse(localStorage.getItem('ddh.tuluyen.dang.S1') || '{}') as { traLoi: Record<string, string> }
    expect(luu.traLoi).toMatchObject({ q1: 'B', q2: 'DSDS' })
  })
  it('kết quả: bản đồ câu + lọc Tất cả / Câu sai / Câu đúng', async () => {
    khoMan(MQ_RONG)
    await moCheDo1()
    fireEvent.click(screen.getByRole('button', { name: /Luyện 10 câu sai/ }))
    await screen.findByText('Câu một')
    fireEvent.click(screen.getByRole('button', { name: 'Nộp bài' }))
    await waitFor(() => expect(screen.getAllByRole('button', { name: 'Nộp bài' }).length).toBe(2))
    await act(async () => { fireEvent.click(screen.getAllByRole('button', { name: 'Nộp bài' })[1]!) })
    await screen.findByText('Kết quả tu luyện')
    expect(screen.getByRole('button', { name: 'Câu 1: đúng. Bấm để xem lại' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Câu 2: đúng một phần. Bấm để xem lại' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Câu 3: bỏ trống. Bấm để xem lại' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Câu đúng · 1' }))
    expect(document.querySelectorAll('.tlu-kq-phai .tlu-the-cau').length).toBe(1)
    fireEvent.click(screen.getByRole('button', { name: 'Câu sai · 2' }))
    expect(document.querySelectorAll('.tlu-kq-phai .tlu-the-cau').length).toBe(2)
  })
})

describe('Điện thoại xoay ngang', () => {
  it('phiếu trả lời chạm được: A–D, ý Đúng → Sai → trống; cùng một bài làm với thẻ câu', async () => {
    khoMan(MQ_NGANG)
    await moCheDo1()
    fireEvent.click(screen.getByRole('button', { name: /Luyện 10 câu sai/ }))
    await screen.findByText('Câu một')
    const phieu = screen.getByRole('navigation', { name: 'Phiếu trả lời' })
    fireEvent.click(within(phieu).getByRole('button', { name: 'Câu 1 chọn C' }))
    await waitFor(() => expect(within(phieu).getByRole('button', { name: 'Câu 1 chọn C' }).getAttribute('aria-pressed')).toBe('true'))
    const y = () => within(phieu).getByRole('button', { name: /Câu 2 ý a/ })
    fireEvent.click(y())
    expect(y().getAttribute('aria-label')).toBe('Câu 2 ý a: Đúng')
    fireEvent.click(y())
    expect(y().getAttribute('aria-label')).toBe('Câu 2 ý a: Sai')
    fireEvent.click(y())
    expect(y().getAttribute('aria-label')).toBe('Câu 2 ý a: chưa chọn')
    expect(within(phieu).getByRole('button', { name: 'Câu 3: bấm để điền đáp án' })).toBeTruthy()
    // Chọn trên phiếu = chọn trong đề: thẻ câu 1 thấy phương án C đang chọn.
    expect(document.querySelector('#tlu-lam-q1 [data-trang-thai="chon"]')?.textContent).toContain('C1')
  })
})

describe('Luyện đề cấu trúc dùng cùng khung', () => {
  const BANK = {
    phanI: Array.from({ length: 18 }, (_, i) => ({ id: `a${i + 1}`, text: `Câu một số ${i + 1}`, choices: ['A1', 'B1', 'C1', 'D1'] })),
    phanII: Array.from({ length: 4 }, (_, i) => ({ id: `b${i + 1}`, text: `Đúng sai ${i + 1}`, ideas: ['a', 'b', 'c', 'd'] })),
    phanIII: Array.from({ length: 6 }, (_, i) => ({ id: `c${i + 1}`, text: `Trả lời ngắn ${i + 1}` })),
  }
  it('máy tính: lưới 28 câu theo 3 phần, đồng hồ, một nút Nộp; không lộ đáp án', async () => {
    khoMan(MQ_RONG)
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      const u = new URL(String(url)).pathname
      const ok = (b: unknown) => ({ ok: true, status: 200, json: async () => b })
      if (u === '/luyen-de/history') return ok({ ok: true, items: [{ id: 'p1', createdAt: Date.now(), status: 'active', score: null }] })
      if (u === '/luyen-de/save') return ok({ ok: true, serverNow: Date.now() })
      return ok({ ok: true, id: 'p1', status: 'active', deadline: Date.now() + 40 * 60000, serverNow: Date.now(), answers: {}, bank: BANK })
    }))
    render(<LuyenDeCauTruc token="t" sbd="12001" dieuKien={{ trangThai: 'mo', lyDo: '', items: [] }} dangTaiDieuKien={false} onDoi={() => {}} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Làm tiếp bài đang làm' }))
    await screen.findByLabelText('Thời gian còn lại')
    const luoi = screen.getByRole('navigation', { name: 'Lưới câu theo phần' })
    expect(within(luoi).getAllByRole('button').length).toBe(28)
    expect(within(luoi).getByText('Phần III · Trả lời ngắn')).toBeTruthy()
    expect(screen.getAllByRole('button', { name: 'Nộp bài' }).length).toBe(1)
    expect(document.body.textContent).not.toMatch(/Đáp án đúng|Lời giải/)
    fireEvent.keyDown(window, { key: 'c' })
    await waitFor(() => expect(screen.getAllByText('1/28').length).toBeGreaterThan(0))
  })
})
