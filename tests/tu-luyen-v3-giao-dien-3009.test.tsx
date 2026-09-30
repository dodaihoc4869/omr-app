// TU LUYỆN v3 — GIAO DIỆN (30/09). Khoá: (1) không thẻ nào "Đang khoá" vì kho câu sai trống — chế độ 1 hiện lời chúc mừng + nút gợi ý dạng nên luyện;
// chế độ 2/4 ghi rõ nguồn dự phòng; (2) bộ đếm "Đã khắc phục X/Y câu sai"; (3) công tắc "Chấm từng câu" nhớ theo máy, mỗi câu bấm Kiểm tra gửi ĐÚNG
// một câu, hiện đúng/sai + lời giải + nút Câu tiếp, câu đã chấm bị khoá; (4) Tổng hợp tính cả Luyện đề cấu trúc (không báo "chưa có" khi đã nộp đề).
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import ManTuLuyen from '../src/components/tu-luyen/ManTuLuyen'
import { khacPhucTheoTuan, tongHopLuyenDe } from '../src/lib/tu-luyen'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
vi.mock('../src/lib/may-chu-moi', () => ({ layCauHinhMayChu: async () => ({ URL: 'https://may.test' }), xongNapDiaChi: async () => {} }))

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
  try { localStorage.clear() } catch { /* bỏ qua */ }
})

const DM = [{ lop: '12', bais: [{ tenBai: 'Bài 1. Ester', dangs: [{ ma: 'DB-12-B1-D1', ten: 'Ester đơn chức', soCau: 40 }] }] }]
const CAU = [
  { qid: 'q1', phan: 'I', text: 'Câu một', luaChon: ['A1', 'B1', 'C1', 'D1'], tenDang: 'Ester đơn chức', sao: 0, loai: 'ly_thuyet', nhanLuyen: 'Luyện lại lần 2', saiGoc: 'Sai gốc: Ca kiểm tra Ester · 29/09', conMotLan: 'Còn 1 lần đúng nữa là khắc phục' },
  { qid: 'q2', phan: 'I', text: 'Câu hai', luaChon: ['A2', 'B2', 'C2', 'D2'], tenDang: 'Ester đơn chức', sao: 0, loai: 'ly_thuyet' },
]
function giaLap(o: { kho?: Record<string, unknown>; dang2?: Record<string, unknown>; tongHop?: Record<string, unknown> } = {}) {
  const cuoc: { u: string; body: Record<string, unknown> }[] = []
  vi.stubGlobal('matchMedia', (m: string) => ({ matches: false, media: m, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }))
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: { body?: string }) => {
    const u = new URL(String(url)).pathname
    const body = JSON.parse(init?.body || '{}')
    cuoc.push({ u, body })
    const ok = (b: unknown) => ({ ok: true, status: 200, json: async () => b })
    if (u === '/hs/tu-luyen/nguon') return ok({
      ok: true, cacCa: [], soCauSai: 0, danhMuc: DM, dangThi: false,
      khoCauSai: o.kho ?? { tong: 0, tuCa: 0, tuChienDich: 0, tuLuyenDe: 0, tuTuLuyen: 0, loi: 'Em chưa sai câu nào từ 29/09.', tongTuMoc: 0, daKhacPhuc: 0 },
      dangCauSai: o.dang2 ?? { kieu: 'yeu', nhan: 'Theo dạng em còn yếu' },
      tuDo: { kieu: 'toan_kho', nhan: 'Toàn kho lớp 12 trở xuống' },
      dangNenLuyen: { ma: 'ES.A.X', ten: 'Ester đơn chức' },
    })
    if (u === '/hs/tu-luyen/tong-hop') return ok(o.tongHop ?? { ok: true, luot: [], cau: [], luyenDe: [], khacPhuc: null })
    if (u === '/hs/tu-luyen/xem-truoc') return ok({ ok: true, tongToiDa: 40, nguonDang: { kieu: 'yeu', nhan: 'Theo dạng em còn yếu' }, thongKe: [{ tenDang: 'Ester đơn chức', soCauSai: 3, soUngVien: 30 }] })
    if (u === '/hs/tu-luyen/rut') return ok({ ok: true, luotId: 'tl_abcdef01', cheDo: body.cheDo, tieuDe: 'Sửa câu sai · 2 câu', taoLuc: Date.now(), cau: CAU })
    if (u === '/hs/tu-luyen/cham-cau') return ok({ ok: true, khoa: true, ketQua: { qid: body.qid, phan: 'I', dung: body.traLoi === 'B', diem: body.traLoi === 'B' ? 1 : 0, traLoi: body.traLoi, dapAn: 'B', loiGiai: { chot: 'Chọn B vì ester no đơn chức.' }, khacPhuc: body.traLoi === 'B' ? 'Đã khắc phục câu này — rời kho câu sai' : undefined } })
    if (u === '/luyen-de/dieu-kien') return ok({ ok: true, trangThai: 'mo', lyDo: '', items: [] })
    return ok({ ok: true, items: [] })
  }))
  return cuoc
}

describe('Không còn khoá vì kho câu sai trống', () => {
  it('chế độ 1: thẻ bấm được, lời chúc mừng + nút gợi ý sang Dạng bài với dạng nên luyện; chế độ 2/4 ghi nguồn dự phòng', async () => {
    giaLap()
    render(<ManTuLuyen token="t" sbd="S1" onVe={() => {}} />)
    const the1 = await screen.findByRole('radio', { name: /Sửa câu sai/ })
    await waitFor(() => expect(screen.getByText('Em chưa sai câu nào từ 29/09')).toBeTruthy())
    expect(screen.queryByText('Đang khoá')).toBeNull()
    for (const r of screen.getAllByRole('radio').filter((x) => x.classList.contains('tlu-the-che-do'))) expect((r as HTMLButtonElement).disabled).toBe(false)
    expect(screen.getByText('Theo dạng em còn yếu')).toBeTruthy()
    expect(screen.getByText('Toàn kho lớp 12 trở xuống')).toBeTruthy()
    fireEvent.click(the1)
    expect(screen.getByText('Em chưa sai câu nào từ 29/09!')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Luyện dạng Ester đơn chức' }))
    await waitFor(() => expect(screen.getByRole('radio', { name: /Dạng bài/ }).getAttribute('aria-checked')).toBe('true'))
  })

  it('bộ đếm "Đã khắc phục X/Y câu sai" trên thẻ Sửa câu sai', async () => {
    giaLap({ kho: { tong: 7, tuCa: 5, tuChienDich: 2, tuLuyenDe: 0, tuTuLuyen: 0, loi: '', tongTuMoc: 10, daKhacPhuc: 3, toiHan: 1, choHen: 1 }, dang2: { kieu: 'cau_sai', nhan: 'Theo câu sai của em' } })
    render(<ManTuLuyen token="t" sbd="S1" onVe={() => {}} />)
    await waitFor(() => expect(document.querySelector('.tlu-dem-kp')?.textContent).toBe('Đã khắc phục 3/10 câu sai'))
    expect(screen.getByRole('progressbar', { name: 'Số câu sai đã khắc phục' }).getAttribute('aria-valuenow')).toBe('3')
  })
})

describe('Chấm từng câu', () => {
  it('bật công tắc (nhớ theo máy) ⇒ Kiểm tra gửi đúng một câu, hiện Đúng + lời giải + Câu tiếp; câu đã chấm bị khoá', async () => {
    const cuoc = giaLap({ kho: { tong: 7, tuCa: 7, tuChienDich: 0, tuLuyenDe: 0, tuTuLuyen: 0, loi: '', tongTuMoc: 7, daKhacPhuc: 0 } })
    render(<ManTuLuyen token="t" sbd="S1" onVe={() => {}} />)
    const the1 = await screen.findByRole('radio', { name: /Sửa câu sai/ })
    fireEvent.click(the1)
    const cong = screen.getByRole('switch', { name: /Chấm từng câu/ }) as HTMLInputElement
    expect(cong.checked).toBe(false)
    fireEvent.click(cong)
    expect(localStorage.getItem('ddh.tuluyen.chamtungcau')).toBe('1')
    fireEvent.click(screen.getByRole('button', { name: /Luyện 10 câu sai/ }))
    await screen.findByText('Câu một')
    expect(screen.getByText('Còn 1 lần đúng nữa là khắc phục')).toBeTruthy()
    const nut = screen.getAllByRole('button', { name: 'Kiểm tra câu này' })
    expect(nut.length).toBe(2)
    expect((nut[0] as HTMLButtonElement).disabled).toBe(true) // chưa chọn đáp án
    fireEvent.click([...document.querySelectorAll('#tlu-lam-q1 button, #tlu-lam-q1 [role="radio"]')].find((b) => b.textContent?.includes('B1'))!)
    await waitFor(() => expect((screen.getAllByRole('button', { name: 'Kiểm tra câu này' })[0] as HTMLButtonElement).disabled).toBe(false))
    fireEvent.click(screen.getAllByRole('button', { name: 'Kiểm tra câu này' })[0]!)
    await screen.findByText('Đã khắc phục câu này — rời kho câu sai')
    const goi = cuoc.filter((c) => c.u === '/hs/tu-luyen/cham-cau')
    expect(goi.length).toBe(1)
    expect(goi[0]!.body).toMatchObject({ luotId: 'tl_abcdef01', qid: 'q1', traLoi: 'B' })
    expect(screen.getByText('Đúng')).toBeTruthy()
    expect(screen.getByText(/Chọn B vì ester no đơn chức/)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Câu tiếp' })).toBeTruthy()
    expect(screen.getAllByRole('button', { name: 'Kiểm tra câu này' }).length).toBe(1) // câu 2 chưa chấm, chưa lộ gì
    expect(document.querySelector('#tlu-lam-q2')!.textContent).not.toContain('Chọn B')
  })
})

describe('Tổng hợp tính cả Luyện đề cấu trúc', () => {
  it('chưa có lượt 4 chế độ nhưng đã nộp đề ⇒ hiện khối Luyện đề (điểm gần nhất, theo phần) + khắc phục, không báo "Chưa có lượt nào"', async () => {
    giaLap({ tongHop: { ok: true, luot: [], cau: [], luyenDe: [{ id: 'LD1', luc: Date.now(), diem: 6.5, theoPhan: { I: { soCau: 18, soDung: 12 }, II: { soCau: 4, soDung: 2 }, III: { soCau: 6, soDung: 3 } } }], khacPhuc: { tong: 4, daKhacPhuc: 1, lichSu: [{ vao: Date.now() - 86_400_000, khacPhucLuc: Date.now() }] } } })
    render(<ManTuLuyen token="t" sbd="S1" onVe={() => {}} />)
    fireEvent.click(await screen.findByRole('tab', { name: 'Tổng hợp' }))
    await screen.findByText('Luyện đề cấu trúc', { selector: 'h2' })
    expect(screen.queryByText('Chưa có lượt nào')).toBeNull()
    expect(screen.getAllByText('6,5 / 10').length).toBeGreaterThan(0)
    expect(screen.getByText('Phần I · Trắc nghiệm')).toBeTruthy()
    expect(document.querySelector('.tlu-o-kp')!.textContent).toContain('Đã khắc phục 1/4 câu sai')
  })

  it('hàm thuần: tổng hợp Luyện đề + tỉ lệ khắc phục lũy kế theo tuần', () => {
    const now = Date.parse('2026-09-30T20:00:00+07:00')
    const ld = tongHopLuyenDe([
      { id: 'a', luc: now - 1000, diem: 7, theoPhan: { I: { soCau: 18, soDung: 14 }, II: { soCau: 4, soDung: 2 }, III: { soCau: 6, soDung: 3 } } },
      { id: 'b', luc: now - 9000, diem: 5, theoPhan: { I: { soCau: 18, soDung: 10 }, II: { soCau: 4, soDung: 1 }, III: { soCau: 6, soDung: 2 } } },
    ])!
    expect(ld).toMatchObject({ soDe: 2, diemGanNhat: 7, diemCaoNhat: 7, diemTrungBinh: 6 })
    expect(ld.theoPhan.I).toEqual({ soCau: 36, soDung: 24, tiLe: 66.7 })
    expect(tongHopLuyenDe([])).toBeNull()
    const tuan = khacPhucTheoTuan({ tong: 3, daKhacPhuc: 1, lichSu: [{ vao: now - 3600_000, khacPhucLuc: now }, { vao: now - 7200_000, khacPhucLuc: null }, { vao: now - 8 * 86_400_000, khacPhucLuc: null }] }, now)
    expect(tuan.length).toBe(8)
    expect(tuan[7]).toMatchObject({ moi: 2, khacPhuc: 1, tongLuyKe: 3, daKhacPhucLuyKe: 1, tiLe: 33.3 })
    expect(tuan[6]).toMatchObject({ moi: 1, tongLuyKe: 1, daKhacPhucLuyKe: 0, tiLe: 0 })
  })
})
