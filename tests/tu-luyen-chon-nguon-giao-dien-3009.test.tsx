// TU LUYỆN — CHỌN NGUỒN CÂU SAI · GIAO DIỆN (30/09). Khoá: khối "Nguồn câu sai" có 6 ô tick kèm số câu; nguồn 0 câu bị tắt;
// mặc định tick mọi nguồn có câu; tick/bỏ tick cập nhật NGAY tổng câu duy nhất (không gọi lại máy chủ); nhớ lựa chọn theo máy;
// không tick nguồn nào ⇒ nút tắt + nhắc; "Chọn tất cả"; lệnh rút gửi đúng `nguon`; máy chủ bản cũ ⇒ không hiện khối.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import ManTuLuyen from '../src/components/tu-luyen/ManTuLuyen'
import { chonMacDinh, docNhoNguon, ghiNhoNguon } from '../src/components/tu-luyen/nguon-cau-sai'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
vi.mock('../src/lib/may-chu-moi', () => ({ layCauHinhMayChu: async () => ({ URL: 'https://may.test' }), xongNapDiaChi: async () => {} }))

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
  try { localStorage.clear() } catch { /* bỏ qua */ }
})

// 5 câu duy nhất: 2 chỉ ở ca (bit 1), 1 ở ca + Đảo (1|2 = 3), 1 chỉ Đảo (2), 1 Bi-a (8).
const KHO = {
  tong: 5, tuCa: 3, tuChienDich: 2, tuLuyenDe: 0, tuTuLuyen: 0, loi: '', tongTuMoc: 6, daKhacPhuc: 1, toiHan: 0, choHen: 0,
  theoNguon: { ca: 3, dao: 2, doan: 0, bia: 1, tu_luyen: 0, luyen_de: 0 },
  theoMat: { 1: 2, 3: 1, 2: 1, 8: 1 },
}
const CAU = [{ qid: 'q1', phan: 'I', text: 'Câu một', luaChon: ['A', 'B', 'C', 'D'], tenDang: 'Ester', sao: 0, loai: 'ly_thuyet', nhanLuyen: 'Luyện lần đầu', saiGoc: 'Sai gốc: Bi-a · 30/09' }]
function giaLap(kho: Record<string, unknown> = KHO) {
  const cuoc: { u: string; body: Record<string, unknown> }[] = []
  vi.stubGlobal('matchMedia', (m: string) => ({ matches: false, media: m, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }))
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: { body?: string }) => {
    const u = new URL(String(url)).pathname
    const body = JSON.parse(init?.body || '{}')
    cuoc.push({ u, body })
    const ok = (b: unknown) => ({ ok: true, status: 200, json: async () => b })
    if (u === '/hs/tu-luyen/nguon') return ok({
      ok: true, cacCa: [], soCauSai: 5, danhMuc: [], dangThi: false, khoCauSai: kho,
      dangCauSai: { kieu: 'cau_sai', nhan: 'Theo câu sai của em' }, tuDo: { kieu: 'cau_sai', nhan: 'Theo câu sai của em' }, dangNenLuyen: null,
    })
    if (u === '/hs/tu-luyen/tong-hop') return ok({ ok: true, luot: [], cau: [], luyenDe: [], khacPhuc: null })
    if (u === '/hs/tu-luyen/rut') return ok({ ok: true, luotId: 'tl_abcdef01', cheDo: 1, tieuDe: 'Sửa câu sai · 1 câu', taoLuc: Date.now(), cau: CAU })
    if (u === '/luyen-de/dieu-kien') return ok({ ok: true, trangThai: 'mo', lyDo: '', items: [] })
    return ok({ ok: true, items: [] })
  }))
  return cuoc
}
const o = (ten: RegExp) => screen.getByRole('checkbox', { name: ten }) as HTMLInputElement
const soKho = () => document.querySelector('.tlu-kho-sai b')?.textContent
async function moCheDo1() {
  render(<ManTuLuyen token="t" sbd="S1" onVe={() => {}} />)
  fireEvent.click(await screen.findByRole('radio', { name: /Sửa câu sai/ }))
  await screen.findByRole('group', { name: 'Nguồn câu sai' })
}

describe('Khối Nguồn câu sai', () => {
  it('6 ô tick có số câu; nguồn 0 câu tắt; mặc định tick mọi nguồn có câu; tổng cập nhật NGAY, không gọi lại máy chủ', async () => {
    const cuoc = giaLap()
    await moCheDo1()
    expect(screen.getAllByRole('checkbox').filter((x) => x.closest('.tlu-nguon-sai')).length).toBe(6)
    expect(o(/Ca kiểm tra/).checked).toBe(true)
    expect(o(/Đảo thần thú/).checked).toBe(true)
    expect(o(/Bi-a/).checked).toBe(true)
    expect(o(/Đoàn Hộ Tống/).disabled).toBe(true)
    expect(o(/Đoàn Hộ Tống/).closest('label')!.textContent).toContain('0 câu')
    expect(o(/Ca kiểm tra/).closest('label')!.textContent).toContain('3 câu')
    expect(soKho()).toBe('5')
    expect(screen.getByText('Kho câu sai của em: 5 câu')).toBeTruthy()
    const truoc = cuoc.length
    fireEvent.click(o(/Ca kiểm tra/))
    expect(soKho()).toBe('3') // Đảo (2 câu, 1 câu trùng ca) + Bi-a 1
    fireEvent.click(o(/Đảo thần thú/))
    expect(soKho()).toBe('1')
    expect((screen.getByLabelText('Số câu') as HTMLInputElement).max).toBe('2')
    expect(cuoc.length).toBe(truoc)
    expect(docNhoNguon('S1')).toEqual(['ca', 'dao'])
  })

  it('không tick nguồn nào ⇒ nút tắt + nhắc; "Chọn tất cả" bật lại; rút gửi đúng nguồn', async () => {
    const cuoc = giaLap()
    await moCheDo1()
    for (const t of [/Ca kiểm tra/, /Đảo thần thú/, /Bi-a/]) fireEvent.click(o(t))
    expect(soKho()).toBe('0')
    expect(screen.getByText('Em chọn ít nhất 1 nguồn câu sai để bắt đầu.')).toBeTruthy()
    const nut = screen.getByRole('button', { name: 'Chọn nguồn để luyện' }) as HTMLButtonElement
    expect(nut.disabled).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Chọn tất cả' }))
    expect(soKho()).toBe('5')
    fireEvent.click(o(/Ca kiểm tra/))
    fireEvent.click(screen.getByRole('button', { name: /^Luyện \d+ câu sai$/ }))
    await waitFor(() => expect(cuoc.some((c) => c.u === '/hs/tu-luyen/rut')).toBe(true))
    const rut = cuoc.find((c) => c.u === '/hs/tu-luyen/rut')!
    expect(rut.body.cheDo).toBe(1)
    expect([...(rut.body.nguon as string[])].sort()).toEqual(['bia', 'dao'])
  })

  it('nhớ lựa chọn theo máy: mở lại vẫn bỏ nguồn em đã bỏ; nguồn mới có câu tự được tick', async () => {
    giaLap()
    ghiNhoNguon('S1', new Set(['dao', 'bia']), KHO.theoNguon)
    await moCheDo1()
    expect(o(/Ca kiểm tra/).checked).toBe(false)
    expect(o(/Đảo thần thú/).checked).toBe(true)
    expect(soKho()).toBe('3')
    // hàm thuần: bỏ hết nguồn đang có ⇒ về mặc định tick tất cả; nguồn mới (Tu luyện) tự được tick
    expect([...chonMacDinh({ ca: 1, dao: 1 }, ['ca', 'dao'])]).toEqual(['ca', 'dao'])
    expect([...chonMacDinh({ ca: 1, tu_luyen: 2 }, ['ca'])]).toEqual(['tu_luyen'])
  })

  it('localStorage bị chặn ⇒ không lỗi', () => {
    const goc = Object.getOwnPropertyDescriptor(window, 'localStorage')
    Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new Error('chặn') } })
    try {
      expect(docNhoNguon('S1')).toBeNull()
      expect(() => ghiNhoNguon('S1', new Set(), { ca: 1 })).not.toThrow()
    } finally {
      if (goc) Object.defineProperty(window, 'localStorage', goc)
    }
  })

  it('máy chủ bản cũ (không có đếm theo nguồn) ⇒ không hiện khối chọn, rút không gửi nguồn', async () => {
    const { theoNguon: _a, theoMat: _b, ...cu } = KHO
    void _a; void _b
    const cuoc = giaLap(cu)
    render(<ManTuLuyen token="t" sbd="S1" onVe={() => {}} />)
    fireEvent.click(await screen.findByRole('radio', { name: /Sửa câu sai/ }))
    await waitFor(() => expect(soKho()).toBe('5'))
    expect(screen.queryByRole('group', { name: 'Nguồn câu sai' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /^Luyện \d+ câu sai$/ }))
    await waitFor(() => expect(cuoc.some((c) => c.u === '/hs/tu-luyen/rut')).toBe(true))
    expect(cuoc.find((c) => c.u === '/hs/tu-luyen/rut')!.body.nguon).toBeUndefined()
  })
})
