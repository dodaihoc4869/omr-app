// @vitest-environment jsdom
// SỬA LỖI 12–36 CÂU/NGÀY (thầy 29/10) — phía máy em: điền danh sách ngày từ `ke` của máy chủ, nhớ mục tiêu `mt`, khoá phần ngày đếm theo mục tiêu.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { conSuaHomNay, conSuaPhanNgay, dungViecHomNay, hopNhatKy, ngayVnTuSua, themMotChang, type NhatKy } from '../src/lib/tu-sua-viec-hom-nay'
import { docKeSuaNgay, docViecNgay, type KeSuaNgay, type MucChua, type MucViecNgay, type ViecNgayMayChu } from '../src/lib/chua-cau-sai-api'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-chu' }))
const NOW = Date.parse('2026-10-29T03:00:00Z')
const NGAY = ngayVnTuSua(NOW)
const SBD = 'HS1'
const KHOA = `omr_tu_sua_hom_nay_${SBD}`
const ds: MucChua[] = Array.from({ length: 100 }, (_, i) => ({ dotId: `D${i}`, qid: `Q${i}`, trangThai: 'can_chan_doan', saiLuc: NOW - (i + 2) * 86_400_000 }))
const mv = (i: number): MucViecNgay => ({ q: `Q${i}`, d: `D${i}`, t: 'can_chan_doan', l: 'goc' })
const ke = (ids: number[], n = 20): KeSuaNgay => ({ n, ung: ids.map(mv) })
const dai = (a: number, b: number) => Array.from({ length: b - a }, (_, i) => a + i)
const kq = (o: { ke?: KeSuaNgay; viecNgay?: ViecNgayMayChu } = {}) => ({ trangThai: 'bat', ds, dem: { can: 100 }, ...o })
const mayChu = (ids: number[], x: string[] = [], them = 0, mt?: number): ViecNgayMayChu => ({ n: NGAY, m: ids.map(mv), x, them, ...(mt ? { mt } : {}) })
beforeEach(() => { localStorage.clear() })
afterEach(() => { localStorage.clear() })

describe('ngày mới: máy chủ lập kế hoạch 20 câu', () => {
  it('điền đúng 20 câu theo thứ tự của máy chủ (không theo thứ tự danh sách), nhớ mt, báo gửi máy chủ kèm mt', () => {
    const ids = [50, 3, 77, 12, 8, 90, 41, 5, 63, 22, 31, 70, 14, 88, 2, 19, 55, 6, 37, 99]
    const r = dungViecHomNay(kq({ ke: ke(ids) }), NOW, SBD)
    expect(r.viec?.muc.map((x) => x.khoa)).toEqual(ids.map((i) => `D${i}`))
    expect(r.viec?.tong).toBe(20)
    expect(r.viec?.phan).toBe(20)
    expect(r.viec?.chang).toHaveLength(5)
    expect(r.luu?.mt).toBe(20)
    expect(r.day?.mt).toBe(20)
    expect(r.day?.m).toHaveLength(20)
  })
  it('không có kế hoạch (máy chủ cũ / lỗi) ⇒ 12 câu như trước, không mt', () => {
    const r = dungViecHomNay(kq(), NOW, SBD)
    expect(r.viec?.tong).toBe(12)
    expect(r.viec?.phan).toBe(12)
    expect(r.luu?.mt).toBeUndefined()
  })
  it('kế hoạch 12 câu (n = 12) ⇒ vẫn 12 câu, nhớ mt = 12 làm dấu «đã lập» (lần mở sau khỏi xin lại)', () => {
    const r = dungViecHomNay(kq({ ke: ke(dai(0, 12), 12) }), NOW, SBD)
    expect(r.viec?.tong).toBe(12)
    expect(r.viec?.phan).toBe(12)
    expect(r.luu?.mt).toBe(12)
    expect(r.day?.mt).toBe(12)
  })
  it('kế hoạch ít câu hơn mục tiêu (hết câu sửa được) ⇒ đúng số có, vẫn nhớ mt để máy chủ không lập lại', () => {
    const r = dungViecHomNay(kq({ ke: ke(dai(0, 15), 24) }), NOW, SBD)
    expect(r.viec?.tong).toBe(15)
    expect(r.luu?.mt).toBe(24)
  })
  it('trần 36: máy chủ lỡ báo 99 ⇒ máy em kẹp 36', () => {
    const r = dungViecHomNay(kq({ ke: ke(dai(0, 50), 99) }), NOW, SBD)
    expect(r.viec?.tong).toBe(36)
  })
})

describe('danh sách 12 câu lập từ trước bản này', () => {
  it('em chưa làm câu nào + máy chủ bù 8 câu ⇒ giữ nguyên 12 câu đầu, nối 8 câu mới, không trùng', () => {
    const cu = dai(0, 12)
    const r = dungViecHomNay(kq({ viecNgay: mayChu(cu), ke: ke(dai(12, 20)) }), NOW, SBD)
    expect(r.viec?.muc.map((x) => x.khoa)).toEqual(dai(0, 20).map((i) => `D${i}`))
    expect(r.viec?.phan).toBe(20)
    expect(r.day?.mt).toBe(20)
  })
  it('kế hoạch lặp lại câu đã có ⇒ bỏ câu trùng', () => {
    const r = dungViecHomNay(kq({ viecNgay: mayChu(dai(0, 12)), ke: ke([...dai(5, 12), ...dai(12, 24)], 20) }), NOW, SBD)
    expect(r.viec?.tong).toBe(20)
    expect(new Set(r.viec?.muc.map((x) => x.khoa)).size).toBe(20)
  })
  it('29/10 áp dụng NGAY HÔM NAY: em đã làm dở 12 câu cũ + máy chủ bù 8 câu ⇒ 20 câu, câu đã xong giữ nguyên, câu mới nối ở cuối, «còn» = 8 + chưa xong', () => {
    const xong = dai(0, 12).map((i) => `D${i}`)
    const r = dungViecHomNay(kq({ viecNgay: mayChu(dai(0, 12), xong), ke: ke(dai(12, 20)) }), NOW, SBD)
    expect(r.viec?.muc.map((x) => x.khoa)).toEqual(dai(0, 20).map((i) => `D${i}`))
    expect(r.viec?.xong).toBe(12)
    expect(conSuaHomNay(r.viec ?? null)).toBe(8)
    expect(conSuaPhanNgay(r.viec ?? null)).toBe(8) // khoá chặng sau đếm theo mục tiêu mới
    expect(r.day?.mt).toBe(20)
  })
  it('đã thêm «Sửa thêm 1 chặng» (them > 0) ⇒ không bù thêm (tránh chèn giữa các chặng thêm)', () => {
    const r = dungViecHomNay(kq({ viecNgay: mayChu(dai(0, 16), dai(0, 16).map((i) => `D${i}`), 1), ke: ke(dai(16, 24)) }), NOW, SBD)
    expect(r.viec?.tong).toBe(16)
  })
  it('em đã làm giữa ngày: máy chủ không gửi kế hoạch ⇒ danh sách không đổi, số «còn» không nhảy lên', () => {
    const r = dungViecHomNay(kq({ viecNgay: mayChu(dai(0, 12), ['D0', 'D1']) }), NOW, SBD)
    expect(r.viec?.tong).toBe(12)
    expect(conSuaHomNay(r.viec ?? null)).toBe(10)
  })
})

describe('ngày đã lập 20 câu (máy chủ giữ mt)', () => {
  const may = mayChu(dai(0, 20), [], 0, 20)
  it('mở ở máy khác ⇒ đúng 20 câu ấy và phan = 20', () => {
    const r = dungViecHomNay(kq({ viecNgay: may }), NOW, SBD)
    expect(r.viec?.tong).toBe(20)
    expect(r.viec?.phan).toBe(20)
    expect(r.day).toBeNull() // máy chủ đã đủ, không phải gửi lại
  })
  it('khoá phần ngày đếm cả 20 câu, không còn dừng ở 12', () => {
    const x12 = dai(0, 12).map((i) => `D${i}`)
    const a = dungViecHomNay(kq({ viecNgay: mayChu(dai(0, 20), x12, 0, 20) }), NOW, SBD)
    expect(conSuaPhanNgay(a.viec ?? null)).toBe(8)
    const b = dungViecHomNay(kq({ viecNgay: mayChu(dai(0, 20), dai(0, 20).map((i) => `D${i}`), 0, 20) }), NOW, SBD)
    expect(conSuaPhanNgay(b.viec ?? null)).toBe(0)
  })
  it('máy chủ cũ không có mt ⇒ khoá vẫn đếm 12 câu đầu', () => {
    const r = dungViecHomNay(kq({ viecNgay: mayChu(dai(0, 20), [], 0) }), NOW, SBD)
    expect(r.viec?.phan).toBe(12)
    expect(conSuaPhanNgay(r.viec ?? null)).toBe(12)
  })
  it('«Sửa thêm 1 chặng» nối thêm 4 câu sau 20 câu, mt giữ nguyên, khoá không bị nâng lên', () => {
    localStorage.setItem('omr_student_portal_auth', JSON.stringify({ sbd: SBD, token: 'tk' }))
    const x = dai(0, 20).map((i) => `D${i}`)
    const v = themMotChang(kq({ viecNgay: mayChu(dai(0, 20), x, 0, 20) }), NOW)
    expect(v?.tong).toBe(24)
    expect(v?.phan).toBe(20)
    expect(conSuaPhanNgay(v ?? null)).toBe(0)
    expect(JSON.parse(localStorage.getItem(KHOA)!).mt).toBe(20)
  })
})

describe('gộp bản máy với máy chủ', () => {
  it('mt lấy lớn nhất của hai bên', () => {
    const nk: NhatKy = { n: NGAY, m: [], x: [], mt: 18 }
    expect(hopNhatKy(nk, mayChu(dai(0, 20), [], 0, 24)).mt).toBe(24)
    expect(hopNhatKy({ ...nk, mt: 30 }, mayChu(dai(0, 20), [], 0, 24)).mt).toBe(30)
    expect(hopNhatKy({ n: NGAY, m: [], x: [] }, mayChu(dai(0, 12))).mt).toBeUndefined()
    expect(hopNhatKy({ n: NGAY, m: [], x: [] }, mayChu(dai(0, 12), [], 0, 12)).mt).toBe(12)
  })
})

describe('đọc phản hồi máy chủ', () => {
  it('docViecNgay đọc mt hợp lệ (12…36), bỏ mt dưới 12 / lạ', () => {
    expect(docViecNgay({ n: NGAY, m: [], x: [], them: 0, mt: 20 })?.mt).toBe(20)
    expect(docViecNgay({ n: NGAY, m: [], x: [], them: 0, mt: 12 })?.mt).toBe(12)
    expect(docViecNgay({ n: NGAY, m: [], x: [], them: 0, mt: 99 })?.mt).toBe(36)
    expect(docViecNgay({ n: NGAY, m: [], x: [], them: 0, mt: 11 })?.mt).toBeUndefined()
    expect(docViecNgay({ n: NGAY, m: [], x: [], them: 0, mt: 'abc' })?.mt).toBeUndefined()
  })
  it('docKeSuaNgay: lọc mục hỏng, kẹp 12…36, hỏng ⇒ null', () => {
    expect(docKeSuaNgay({ n: 20, ung: [{ q: 'Q1', d: 'D1', t: 'x', l: 'goc' }, { q: '', t: 'x', l: 'goc' }, { q: 'Q3', t: 'x', l: 'la' }] })).toEqual({ n: 20, ung: [{ q: 'Q1', d: 'D1', t: 'x', l: 'goc' }] })
    expect(docKeSuaNgay({ n: 99, ung: [] })?.n).toBe(36)
    expect(docKeSuaNgay({ n: 5, ung: [] })).toBeNull()
    expect(docKeSuaNgay(null)).toBeNull()
    expect(docKeSuaNgay('x')).toBeNull()
  })
})

describe('gửi nền kèm mt', () => {
  it('lời gọi viec-ngay mang mt khi mục tiêu > 12', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const goi = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }))
    vi.stubGlobal('fetch', goi)
    localStorage.setItem('omr_student_portal_auth', JSON.stringify({ sbd: SBD, token: 'tk' }))
    const { luuViecHomNay } = await import('../src/lib/tu-sua-viec-hom-nay')
    const r = dungViecHomNay(kq({ ke: ke(dai(0, 20)) }), NOW, SBD)
    luuViecHomNay(r.luu, r.day ?? null)
    await vi.advanceTimersByTimeAsync(450)
    const viec = () => (goi.mock.calls as unknown as [string, RequestInit][]).filter((c) => String(c[0]).endsWith('/hs/chua-cau-sai/viec-ngay'))
    await vi.waitFor(() => expect(viec()).toHaveLength(1))
    const body = JSON.parse(String(viec()[0]![1].body))
    expect(body).toMatchObject({ token: 'tk', ngay: NGAY, mt: 20 })
    expect(body.m).toHaveLength(20)
    vi.useRealTimers(); vi.unstubAllGlobals()
  })
})

describe('máy em chỉ XIN kế hoạch khi cần (danh sách vẫn một lô D1 khi không xin)', () => {
  const goiDanhSach = async () => {
    vi.resetModules()
    vi.doMock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-chu' }))
    const bodies: Record<string, unknown>[] = []
    vi.stubGlobal('fetch', vi.fn(async (u: string, init?: RequestInit) => {
      if (String(u).endsWith('/hs/chua-cau-sai/co')) return new Response(JSON.stringify({ ok: true }), { status: 200 })
      bodies.push(JSON.parse(String(init?.body ?? '{}')))
      return new Response(JSON.stringify({ ok: true, ds: [] }), { status: 200 })
    }))
    const { apiDanhSachTuChua } = await import('../src/lib/chua-cau-sai-api')
    await apiDanhSachTuChua('tk')
    vi.unstubAllGlobals(); vi.doUnmock('../src/lib/dia-chi-may-chu')
    return bodies[0]!
  }
  const auth = () => localStorage.setItem('omr_student_portal_auth', JSON.stringify({ sbd: SBD, token: 'tk' }))
  const homNay = new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10)
  const nhatKy = (o: Record<string, unknown>) => localStorage.setItem(KHOA, JSON.stringify({ n: homNay, m: dai(0, 12).map((i) => ({ q: `Q${i}`, d: `D${i}`, t: 'x', l: 'goc' })), x: [], ...o }))
  it('chưa có việc hôm nay ⇒ xin', async () => { auth(); expect(await goiDanhSach()).toMatchObject({ ke: 1 }) })
  it('có danh sách 12 câu cũ, chưa làm, chưa nhớ mt ⇒ xin (để bù cho đủ)', async () => { auth(); nhatKy({}); expect(await goiDanhSach()).toMatchObject({ ke: 1 }) })
  it('đã nhớ mt (kể cả 12) ⇒ không xin', async () => { auth(); nhatKy({ mt: 12 }); expect(await goiDanhSach()).not.toHaveProperty('ke') })
  it('đã làm dở nhưng chưa nhớ mt ⇒ xin (áp dụng ngay hôm nay); đã thêm chặng ⇒ không xin', async () => {
    auth(); nhatKy({ x: ['D0'] }); expect(await goiDanhSach()).toMatchObject({ ke: 1 })
    nhatKy({ x: ['D0'], them: 1 }); expect(await goiDanhSach()).not.toHaveProperty('ke')
  })
  it('nhật ký của NGÀY KHÁC ⇒ xin', async () => { auth(); nhatKy({ n: '2020-01-01', mt: 20 }); expect(await goiDanhSach()).toMatchObject({ ke: 1 }) })
  it('chưa đăng nhập (không SBD) ⇒ không xin', async () => { expect(await goiDanhSach()).not.toHaveProperty('ke') })
})
