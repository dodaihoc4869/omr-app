// TẢI SẴN CA KIỂM TRA CHO APP THẦY (thầy 03/11 «bấm vào từng ca mãi mới vào được»): src/lib/nap-truoc-ca-thay.ts + nối vào LichSuCaScreen / ExamMonitorScreen.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const goi: { ma: string; xin: boolean }[] = []
const luuBank = vi.fn(async () => {})
const luuSo = vi.fn(async () => {})
let bankCo = new Set<string>()
let loi = false
vi.mock('../src/lib/exam-api', () => ({
  chiTietCa: vi.fn(async (_u: string, _m: string, ma: string, xin: boolean) => {
    goi.push({ ma, xin })
    if (loi) throw new Error('mạng lỗi')
    return { ca: { maCa: ma }, keyBank: xin ? { phanI: [1], phanII: [], phanIII: [], soCau: { I: 8, II: 4, III: 6 } } : undefined }
  }),
}))
vi.mock('../src/lib/exam-db', () => ({
  loadScriptUrl: async () => 'https://x.dev',
  loadTeacherSecret: async () => 'bi-mat',
  loadSessionTeacherBank: async (ma: string) => (bankCo.has(ma) ? [{}] : undefined),
  saveSessionTeacherBank: luuBank,
  docSoCauCa: async () => undefined,
  luuSoCauCa: luuSo,
}))

const doc = (p: string) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8')
const ca = (maCa: string, trangThai = 'dong', moLuc = '2026-11-01T00:00:00Z', loai = 'thi') => ({ maCa, trangThai, moLuc, loai })
const doiHet = async () => { for (let i = 0; i < 40; i++) await vi.advanceTimersByTimeAsync(700) }

beforeEach(async () => {
  vi.useFakeTimers()
  goi.length = 0; luuBank.mockClear(); luuSo.mockClear(); bankCo = new Set(); loi = false
  const m = await import('../src/lib/nap-truoc-ca-thay'); m.xoaNapTruocCaThay()
})
afterEach(() => { vi.useRealTimers() })

describe('tải sẵn ca', () => {
  it('đang mở trước, rồi mới nhất; ≤ 5 ca; bỏ ca đã xoá + bài tập; CẤT ngân hàng + số câu như màn theo dõi; xin ngân hàng khi máy chưa có', async () => {
    const m = await import('../src/lib/nap-truoc-ca-thay')
    bankCo.add('CU')
    m.napTruocCaThay([ca('A', 'dong', '2026-10-01T00:00:00Z'), ca('MO', 'mo', '2026-09-01T00:00:00Z'), ca('CU', 'dong', '2026-10-20T00:00:00Z'), ca('XOA', 'da_xoa', '2026-12-01T00:00:00Z'), ca('BT', 'dong', '2026-12-01T00:00:00Z', 'baitap'),
      ca('B', 'dong', '2026-10-05T00:00:00Z'), ca('C', 'dong', '2026-10-06T00:00:00Z'), ca('D', 'dong', '2026-10-07T00:00:00Z')])
    await doiHet()
    expect(goi.map((g) => g.ma)).toEqual(['MO', 'CU', 'D', 'C', 'B'])
    expect(goi.find((g) => g.ma === 'MO')!.xin).toBe(true) // máy chưa có ngân hàng ⇒ xin (đường cũ chậm — làm TRƯỚC khi thầy bấm)
    expect(goi.find((g) => g.ma === 'CU')!.xin).toBe(false) // đã có ⇒ đường nhanh
    expect(luuBank).toHaveBeenCalledTimes(4) // MO, D, C, B (CU đã có)
    expect(luuSo).toHaveBeenCalledTimes(4)
  })
  it('bản tải sẵn dùng MỘT lần trong 90 s; quá hạn ⇒ không dùng', async () => {
    const m = await import('../src/lib/nap-truoc-ca-thay')
    m.napTruocCaThay([ca('A')]); await doiHet()
    const dau = m.layCaNapTruoc('A')
    expect(dau?.ct.ca.maCa).toBe('A'); expect(m.layCaNapTruoc('A')).toBeNull()
    m.xoaNapTruocCaThay(); m.napTruocCaThay([ca('A')]); await doiHet()
    await vi.advanceTimersByTimeAsync(91_000)
    expect(m.layCaNapTruoc('A')).toBeNull()
  })
  it('chạm / rê vào một ca ⇒ ca ấy chen lên ĐẦU hàng; không tải lại ca vừa tải (5 phút)', async () => {
    const m = await import('../src/lib/nap-truoc-ca-thay')
    m.napTruocCaThay([ca('A'), ca('B')]); m.napTruocMotCa('Z'); await doiHet()
    expect(goi.map((g) => g.ma)).toEqual(['Z', 'A', 'B'])
    m.napTruocCaThay([ca('A'), ca('B')]); await doiHet()
    expect(goi).toHaveLength(3)
  })
  it('một lượt lỗi ⇒ dừng cả hàng (không dồn tải lên máy chủ), im lặng', async () => {
    const m = await import('../src/lib/nap-truoc-ca-thay')
    loi = true
    m.napTruocCaThay([ca('A'), ca('B'), ca('C')]); await doiHet()
    expect(goi).toHaveLength(1)
  })
})

describe('nối vào màn', () => {
  it('danh sách ca tải sẵn + nạp sẵn mảnh màn theo dõi + rê/chạm; màn theo dõi dùng bản tải sẵn rồi làm mới ngầm; gợi ý ca không còn gọi mỗi lần mở', () => {
    const ls = doc('src/screens/LichSuCaScreen.tsx')
    expect(ls).toMatch(/napTruocCaThay\(ds\)/); expect(ls).toMatch(/import\('\.\/ExamMonitorScreen'\)/)
    expect((ls.match(/onPointerEnter=\{\(\) => napTruocMotCa\(c\.maCa\)\}/g) ?? []).length).toBe(2)
    const em = doc('src/screens/ExamMonitorScreen.tsx')
    expect(em).toMatch(/layCaNapTruoc\(ma\.trim\(\)\)/)
    expect(em).toMatch(/if \(!chiTiet && \(!maCaTheoDoi \|\| loi\)\)/)
  })
})
