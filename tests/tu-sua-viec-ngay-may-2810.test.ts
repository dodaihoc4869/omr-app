// @vitest-environment jsdom
// VIỆC HÔM NAY TỰ SỬA LỖI — máy em gộp bản máy chủ (thầy duyệt 28/10): đổi máy vẫn cùng 12 câu; localStorage là bản đệm; bản mới hơn máy chủ ⇒ gửi nền.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { conSuaHomNay, dungViecHomNay, hopNhatKy, ngayVnTuSua, type NhatKy } from '../src/lib/tu-sua-viec-hom-nay'
import type { MucChua, ViecNgayMayChu } from '../src/lib/chua-cau-sai-api'

const NOW = Date.parse('2026-10-28T03:00:00Z')
const NGAY = ngayVnTuSua(NOW)
const SBD = 'HS1'
const ds: MucChua[] = Array.from({ length: 20 }, (_, i) => ({ dotId: `D${i}`, qid: `Q${i}`, trangThai: 'can_chan_doan', saiLuc: NOW - (i + 2) * 86_400_000 }))
const kq = (viecNgay?: ViecNgayMayChu) => ({ trangThai: 'bat', ds, dem: { can: 20 }, ...(viecNgay ? { viecNgay } : {}) })
const mayChu = (ids: number[], x: string[] = [], them = 0): ViecNgayMayChu => ({ n: NGAY, m: ids.map((i) => ({ q: `Q${i}`, d: `D${i}`, t: 'can_chan_doan', l: 'goc' as const })), x, them })
const KHOA = `omr_tu_sua_hom_nay_${SBD}`
beforeEach(() => { localStorage.clear() })
afterEach(() => { localStorage.clear() })

describe('Việc hôm nay: gộp bản máy chủ', () => {
  it('máy MỚI (chưa có bản đệm) + máy chủ đã có 12 câu ⇒ đúng 12 câu ấy, đúng thứ tự; ghi bản đệm; không gửi lại máy chủ', () => {
    const ids = [19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8]
    const r = dungViecHomNay(kq(mayChu(ids)), NOW, SBD)
    expect(r.viec?.muc.map((x) => x.khoa)).toEqual(ids.map((i) => `D${i}`))
    expect(r.luu?.m.map((x) => x.d)).toEqual(ids.map((i) => `D${i}`))
    expect(r.day).toBeNull()
  })
  it('máy chủ chưa có ⇒ máy tự chọn 12 câu và đánh dấu cần gửi', () => {
    const r = dungViecHomNay(kq(), NOW, SBD)
    expect(r.viec?.tong).toBe(12)
    expect(r.day?.m).toHaveLength(12)
  })
  it('hai máy chọn khác nhau, cùng 12 câu ⇒ bản máy chủ thắng; «đã xong» hợp lại; số còn hôm nay giảm', () => {
    const tren = dungViecHomNay(kq(), NOW, SBD).luu!
    localStorage.setItem(KHOA, JSON.stringify({ ...tren, x: ['D0'] }))
    const ids = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]
    const r = dungViecHomNay(kq(mayChu(ids, ['D8', 'D9'])), NOW, SBD)
    expect(r.viec?.muc.map((x) => x.khoa)).toEqual(ids.map((i) => `D${i}`))
    expect(r.viec?.xong).toBe(2)
    expect(conSuaHomNay(r.viec ?? null)).toBe(10)
    // máy này có «D0» xong mà máy chủ chưa có ⇒ gửi
    expect(r.day?.x).toContain('D0')
  })
  it('máy chủ đã thêm chặng (16 câu) ⇒ máy theo 16; xong hết ⇒ còn 0', () => {
    const ids = Array.from({ length: 16 }, (_, i) => i)
    const r = dungViecHomNay(kq(mayChu(ids, ids.map((i) => `D${i}`), 1)), NOW, SBD)
    expect(r.viec?.tong).toBe(16)
    expect(conSuaHomNay(r.viec ?? null)).toBe(0)
  })
  it('bản máy chủ của NGÀY KHÁC ⇒ bỏ qua', () => {
    const nk: NhatKy = { n: NGAY, m: [], x: [] }
    expect(hopNhatKy(nk, { ...mayChu([1, 2]), n: '2026-10-27' })).toBe(nk)
  })
  it('gửi nền gom 400 ms, có token phiên; trùng bản vừa gửi ⇒ không gửi lại', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    vi.doMock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-chu' }))
    const goi = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }))
    vi.stubGlobal('fetch', goi)
    localStorage.setItem('omr_student_portal_auth', JSON.stringify({ sbd: SBD, token: 'tk' }))
    const { luuViecHomNay } = await import('../src/lib/tu-sua-viec-hom-nay')
    const r = dungViecHomNay(kq(), NOW, SBD)
    luuViecHomNay(r.luu, r.day ?? null)
    luuViecHomNay(r.luu, r.day ?? null)
    await vi.advanceTimersByTimeAsync(450)
    await vi.waitFor(() => expect(goi).toHaveBeenCalledTimes(1))
    const [u, init] = goi.mock.calls[0] as unknown as [string, RequestInit]
    expect(u).toBe('https://may-chu/hs/chua-cau-sai/viec-ngay')
    const body = JSON.parse(String(init.body))
    expect(body).toMatchObject({ token: 'tk', ngay: NGAY, them: 0 })
    expect(body.m).toHaveLength(12)
    luuViecHomNay(null, r.day ?? null)
    await vi.advanceTimersByTimeAsync(450)
    expect(goi).toHaveBeenCalledTimes(1)
    vi.useRealTimers(); vi.unstubAllGlobals()
  })
})
