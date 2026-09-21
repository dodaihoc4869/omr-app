// NHỊP TỰ GỌI MÁY CHỦ CỦA APP THẦY — kế hoạch KE-HOACH-MAY-CHU-GIO-CAO-DIEM-2109.md, mục Code 4 (3). Sự cố D1 21/09 20:30: mọi vòng tự hỏi nền đè lên D1 (chỉ MỘT luồng).
// Luật: nhịp lấy từ BẢNG (BANG_NHIP_THAY); tab ẩn thì dừng; không gọi chồng; lỗi ⇒ lùi dần 30 → 60 → 120 s (không nhanh hơn nhịp thường). Trước đây: `setInterval` trần ở Theo dõi ca (20 s, không đợi lượt trước xong,
// lỗi cũng cứ 20 s một lần) và `useTuLamMoi` của Bảng tin bản 3 (không chống chồng, không lùi).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook } from '@testing-library/react'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { BANG_NHIP_THAY, useNhipThay } from '../src/lib/nhip-may-thay'
import { LUI_DAN_MS } from '../src/lib/nhip-ben-vung'

const doc = (p: string) => readFileSync(resolve(__dirname, '..', p), 'utf8')
const boChuThich = (m: string) => m.replace(/^\s*\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')
const an = (v: boolean) => Object.defineProperty(document, 'hidden', { configurable: true, get: () => v })

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })
  an(false)
})
afterEach(() => {
  cleanup()
  an(false)
  vi.useRealTimers()
})
const troi = async (ms: number) => act(async () => void (await vi.advanceTimersByTimeAsync(ms)))

describe('BẢNG NHỊP của app thầy', () => {
  it('đúng bảng: Bảng tin sàn 10 s · Bảng tin bản 3 60 s · Theo dõi ca 20 s', () => {
    expect(BANG_NHIP_THAY).toEqual({ bangTinSan: 10_000, bangTinV3: 60_000, theoDoiCa: 20_000 })
  })
})

describe('useNhipThay — tab ẩn thì dừng, không gọi chồng, lỗi thì lùi dần', () => {
  it('KHÔNG gọi ngay khi bật (nơi dùng tự nạp lần đầu); gọi đều mỗi nhịp', async () => {
    const chay = vi.fn(async () => true)
    renderHook(() => useNhipThay(chay, 20_000))
    await troi(19_000)
    expect(chay).toHaveBeenCalledTimes(0)
    await troi(1_100)
    expect(chay).toHaveBeenCalledTimes(1)
    await troi(20_000)
    expect(chay).toHaveBeenCalledTimes(2)
    await troi(20_000)
    expect(chay).toHaveBeenCalledTimes(3)
  })
  it('TAB ẨN ⇒ không gọi dù trôi bao nhiêu nhịp; hiện lại ⇒ gọi (một lần, chặn dội); hiện-ẩn liên tục không gọi dồn', async () => {
    const chay = vi.fn(async () => true)
    renderHook(() => useNhipThay(chay, 10_000))
    await troi(10_100)
    expect(chay).toHaveBeenCalledTimes(1)
    an(true)
    await act(async () => void document.dispatchEvent(new Event('visibilitychange')))
    await troi(60_000)
    expect(chay).toHaveBeenCalledTimes(1)
    an(false)
    await act(async () => void document.dispatchEvent(new Event('visibilitychange')))
    expect(chay).toHaveBeenCalledTimes(2)
    for (let i = 0; i < 5; i++) {
      await act(async () => void document.dispatchEvent(new Event('visibilitychange')))
      await act(async () => void window.dispatchEvent(new Event('focus')))
    }
    expect(chay).toHaveBeenCalledTimes(2) // vừa gọi xong, chưa qua khoảng chặn dội ⇒ không thêm
  })
  it('KHÔNG GỌI CHỒNG: lượt trước chưa xong (máy chủ chậm) thì ba nhịp trôi qua không thêm lệnh; xong rồi mới hẹn lượt kế', async () => {
    let xong!: () => void
    const chay = vi.fn(() => new Promise<boolean>((r) => { xong = () => r(true) }))
    renderHook(() => useNhipThay(chay, 10_000))
    await troi(10_100)
    expect(chay).toHaveBeenCalledTimes(1)
    await troi(35_000)
    expect(chay).toHaveBeenCalledTimes(1)
    await act(async () => xong())
    await troi(10_100)
    expect(chay).toHaveBeenCalledTimes(2)
  })
  it('LỖI (trả false hoặc ném) ⇒ lùi 30 → 60 → 120 s, giữ ở 120; tốt lại ⇒ về nhịp thường; không bao giờ nhanh hơn nhịp thường', async () => {
    let ketQua: 'loi' | 'nem' | 'tot' = 'loi'
    const chay = vi.fn(async () => {
      if (ketQua === 'nem') throw new Error('mạng')
      return ketQua !== 'loi' ? true : false
    })
    renderHook(() => useNhipThay(chay, 10_000))
    await troi(10_100) // lần 1 (lỗi)
    expect(chay).toHaveBeenCalledTimes(1)
    await troi(LUI_DAN_MS[0]! - 1_000)
    expect(chay).toHaveBeenCalledTimes(1) // đang lùi 30 s
    await troi(1_200) // lần 2 (lỗi)
    expect(chay).toHaveBeenCalledTimes(2)
    ketQua = 'nem'
    await troi(LUI_DAN_MS[1]! - 1_000)
    expect(chay).toHaveBeenCalledTimes(2) // lùi 60 s
    await troi(1_200) // lần 3 (ném)
    expect(chay).toHaveBeenCalledTimes(3)
    await troi(LUI_DAN_MS[2]! - 1_000)
    expect(chay).toHaveBeenCalledTimes(3) // lùi 120 s
    ketQua = 'tot'
    await troi(1_200) // lần 4 (tốt)
    expect(chay).toHaveBeenCalledTimes(4)
    await troi(10_100) // về nhịp thường
    expect(chay).toHaveBeenCalledTimes(5)
  })
  it('bat=false ⇒ không có vòng; bật/tắt giữa chừng ⇒ vòng dừng/khởi lại; tháo màn ⇒ dừng hẳn và gỡ sự kiện', async () => {
    const chay = vi.fn(async () => true)
    const { rerender, unmount } = renderHook(({ bat }) => useNhipThay(chay, 10_000, bat), { initialProps: { bat: false } })
    await troi(60_000)
    expect(chay).toHaveBeenCalledTimes(0)
    rerender({ bat: true })
    await troi(10_100)
    expect(chay).toHaveBeenCalledTimes(1)
    rerender({ bat: false })
    await troi(60_000)
    expect(chay).toHaveBeenCalledTimes(1)
    rerender({ bat: true })
    unmount()
    await act(async () => void window.dispatchEvent(new Event('focus')))
    await troi(60_000)
    expect(chay).toHaveBeenCalledTimes(1)
  })
  it('luôn gọi bản `chay` MỚI NHẤT (không kẹt bản cũ của lần vẽ đầu)', async () => {
    const a = vi.fn(async () => true)
    const b = vi.fn(async () => true)
    const { rerender } = renderHook(({ f }) => useNhipThay(f, 10_000), { initialProps: { f: a } })
    rerender({ f: b })
    await troi(10_100)
    expect(a).toHaveBeenCalledTimes(0)
    expect(b).toHaveBeenCalledTimes(1)
  })
})

describe('mã chạy: MỌI vòng tự gọi máy chủ của app thầy đi qua nhịp chung', () => {
  const tepMan = (t: string) => `src/screens/${t}`
  it('Theo dõi ca: không còn `setInterval` trần; dùng useNhipThay với nhịp trong bảng; `tai` trả boolean và lượt nền không chồng', () => {
    const m = boChuThich(doc(tepMan('ExamMonitorScreen.tsx')))
    expect(m).not.toMatch(/setInterval\(/)
    expect(m).toContain('useNhipThay(')
    expect(m).toContain('BANG_NHIP_THAY.theoDoiCa')
    expect(m).toMatch(/if \(imLang && dangTaiRef\.current\) return true/)
    expect(m).toMatch(/const tai = async \(ma: string, imLang = false\): Promise<boolean>/)
    expect(m).toMatch(/return true\s*\} catch \(e\) \{/) // tải được ⇒ true
    expect(m).toMatch(/return false\s*\} finally \{\s*dangTaiRef\.current = false/) // lỗi ⇒ false (vòng nền mới lùi dần)
  })
  it('useTuLamMoi (Bảng tin bản 3 + sàn) là vỏ của useNhipThay: không còn setInterval / visibilitychange tự viết', () => {
    const h = boChuThich(doc('src/components/bang-tin/hooks.ts'))
    expect(h).toContain('useNhipThay(lam, ms)')
    expect(h).not.toMatch(/setInterval\(|visibilitychange/)
  })
  it('Bảng tin sàn: lam trả Promise báo hụt; nhịp từ bảng; Bảng tin bản 3: lam trả r.ok và nhịp từ bảng', () => {
    const s = boChuThich(doc('src/components/bang-tin-san/use-san-song.ts'))
    expect(s).toContain('BANG_NHIP_THAY.bangTinSan')
    expect(s).toMatch(/useCallback\(\(\): Promise<boolean> =>/)
    expect(s).not.toMatch(/setInterval\(/)
    const hn = boChuThich(doc('src/screens/HomNayScreen.tsx'))
    expect(hn).toContain('useTuLamMoi(lam, BANG_NHIP_THAY.bangTinV3)')
    expect(hn).toContain('return r.ok')
    expect(hn).not.toMatch(/useEffect\(\(\) => lam\(\), \[lam\]\)/) // effect trả Promise là sai
  })
  it('CHẶN vòng mới: trong các tệp app thầy KHÔNG có `setInterval` ngoài bộ đếm giao diện đã liệt kê (không gọi máy chủ); thêm vòng gọi máy chủ ⇒ dùng useNhipThay + ghi vào docs/nhip-app-thay-2109.md', () => {
    const tep: string[] = []
    const NHIEU = ['ClassListScreen', 'CaiDatScreen', 'CauHoiScreen', 'ExamHubScreen', 'ExamMonitorScreen', 'ExamSetupScreen', 'GoiLenBangScreen', 'HomNay', 'KhoaAppScreen', 'KhoaMayThayScreen', 'LichSuCaScreen', 'NganHangDeScreen', 'PhanCongScreen', 'PhieuScreen', 'PhieuV3', 'ToanCanhEmScreen']
    for (const f of readdirSync(resolve(__dirname, '../src/screens'))) if (/\.tsx?$/.test(f) && NHIEU.some((n) => f.startsWith(n))) tep.push(`src/screens/${f}`)
    for (const d of ['bang-tin', 'bang-tin-san', 'xem-diem-gv', 'btvn-da-giao']) for (const f of readdirSync(resolve(__dirname, '../src/components', d))) if (/\.tsx?$/.test(f)) tep.push(`src/components/${d}/${f}`)
    expect(tep.length).toBeGreaterThan(20)
    // bộ đếm GIAO DIỆN (không gọi máy chủ): đồng hồ đếm ngược khoá app · số lăn của Bảng tin sàn (1 giây, chỉ vẽ)
    const CHO_PHEP: Record<string, number> = { 'src/screens/KhoaAppScreen.tsx': 1, 'src/components/bang-tin-san/hooks.ts': 1 }
    const thua: string[] = []
    for (const f of tep) {
      const n = (boChuThich(doc(f)).match(/\bsetInterval\(/g) ?? []).length
      if (n !== (CHO_PHEP[f] ?? 0)) thua.push(`${f}: ${n} (cho phép ${CHO_PHEP[f] ?? 0})`)
    }
    expect(thua).toEqual([])
  })
  it('bảng nhịp đã ghi ở docs/nhip-app-thay-2109.md (đủ ba vòng + các vòng của tab khác)', () => {
    const d = doc('docs/nhip-app-thay-2109.md')
    for (const tu of ['Bảng tin sàn', 'Bảng tin bản 3', 'Theo dõi ca', 'app-presence', 'cap-nhat-app', 'nhipDeNghi']) expect(d, tu).toContain(tu)
  })
})
