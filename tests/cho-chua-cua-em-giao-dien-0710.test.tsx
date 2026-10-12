// KHỐI "CÂU CẦN GỠ TIẾP" TRONG TU LUYỆN — ĐÃ GỠ (12/10).
// SỬA CÓ CHỦ Ý 12/10 (thầy: "trùng tu lại giao diện mục tu luyện của app học sinh, bỏ phần những câu cần gỡ"): tệp test cũ khoá lưới thẻ
// "Câu cần gỡ tiếp" của thành phần ChoChuaCuaEm (đặt đầu thẻ Luyện của Tu luyện). Thành phần ấy đã xoá; chữa lỗi có lối riêng
// (Hôm nay › Tự chữa lỗi, Ôn & sửa — ManTuChua). Test nay khoá điều ngược lại: Tu luyện KHÔNG còn khối ấy, KHÔNG hỏi danh sách đợt chữa,
// mã nguồn không còn nhắc tới thành phần cũ. Nút "Sửa từng bước" dưới câu sai ở màn kết quả Tu luyện vẫn giữ (test khác khoá).
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { existsSync, readFileSync } from 'node:fs'
import ManTuLuyen from '../src/components/tu-luyen/ManTuLuyen'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
vi.mock('../src/lib/may-chu-moi', () => ({ layCauHinhMayChu: async () => ({ URL: 'https://may.test' }), xongNapDiaChi: async () => {} }))

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})

function giaLap() {
  const cuoc: string[] = []
  vi.stubGlobal('matchMedia', (m: string) => ({ matches: false, media: m, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }))
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    const u = new URL(String(url)).pathname
    cuoc.push(u)
    const ok = (b: unknown) => ({ ok: true, status: 200, json: async () => b })
    if (u === '/hs/chua-cau-sai/danh-sach') return ok({ ok: true, ds: [{ qid: 'Q1', trangThai: 'thieu_hoc_lieu' }] })
    if (u === '/hs/chua-cau-sai/co') return ok({ ok: true })
    if (u === '/hs/tu-luyen/nguon') return ok({ ok: true, cacCa: [], soCauSai: 0, danhMuc: [], dangThi: false, khoCauSai: null, dangCauSai: null, tuDo: null, dangNenLuyen: null })
    if (u === '/hs/tu-luyen/tong-hop') return ok({ ok: true, luot: [], cau: [], luyenDe: [], khacPhuc: null })
    if (u === '/luyen-de/dieu-kien') return ok({ ok: true, trangThai: 'mo', lyDo: '', items: [] })
    return ok({ ok: true })
  }))
  return cuoc
}

describe('Tu luyện không còn khối "câu cần gỡ"', () => {
  it('thẻ Luyện: không tiêu đề "Câu cần gỡ tiếp", không "Câu cần xem lại", không hỏi danh sách đợt chữa', async () => {
    const cuoc = giaLap()
    render(<ManTuLuyen token="t" sbd="S1" onVe={() => {}} />)
    expect(await screen.findByRole('heading', { name: 'Chọn cách luyện' })).toBeTruthy()
    expect(screen.queryByRole('heading', { name: /cần gỡ/i })).toBeNull()
    expect(screen.queryByText(/Câu cần gỡ|câu cần gỡ|Câu cần xem lại|câu đang chờ/)).toBeNull()
    expect(document.querySelector('.tlu-cho-chua')).toBeNull()
    expect(cuoc).not.toContain('/hs/chua-cau-sai/danh-sach')
  })

  it('mã nguồn: thành phần ChoChuaCuaEm đã xoá, Tu luyện không nhập nó', () => {
    expect(existsSync('src/components/chua-cau-sai/ChoChuaCuaEm.tsx')).toBe(false)
    const man = readFileSync('src/components/tu-luyen/ManTuLuyen.tsx', 'utf8')
    expect(man).not.toMatch(/import ChoChuaCuaEm|<ChoChuaCuaEm/)
  })
})
