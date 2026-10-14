// GIỜ CAO ĐIỂM 14/10 (thầy: "Tối ưu chuyên sâu toàn bộ cho giờ cao điểm luôn nhé"): máy chủ đề nghị giãn vòng hỏi NỀN của app em ×2 từ 19:00 tới 22:59
// (server/src/suc-khoe-may.ts `heSoGoiNen`, header `x-nhip-de-nghi`). Khoá phía máy em: vòng kế hoạch ngày GIÃN theo đề nghị; vòng "ca đang mở" KHÔNG giãn
// (em vào thi không chậm) — dù máy chủ đề nghị ×4.
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, renderHook } from '@testing-library/react'
import { useCaDangMo } from '../src/components/bang-nhiem-vu/may-chu'
import { datLaiHeSo, ghiHeSo } from '../src/lib/nhip-de-nghi'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))

const dem: Record<string, number> = {}
beforeEach(() => {
  vi.useFakeTimers()
  datLaiHeSo()
  for (const k of Object.keys(dem)) delete dem[k]
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    const duong = new URL(url).pathname
    dem[duong] = (dem[duong] ?? 0) + 1
    for (let i = 0; i < 3; i++) ghiHeSo('4', Date.now()) // mỗi phản hồi mang đề nghị ×4 (như header x-nhip-de-nghi lúc nghẽn)
    return new Response(JSON.stringify(duong === '/hs/ca-dang-mo' ? { ok: true, coCa: false } : { ok: false, error: 'x' }), { status: 200, headers: { 'content-type': 'application/json' } })
  }))
})
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.useRealTimers(); datLaiHeSo() })

it('máy chủ đề nghị ×4: "ca đang mở" vẫn hỏi lại đúng nhịp gốc 180 ± 30 giây (không giãn tới 300 giây như vòng nền khác)', async () => {
  const d = { token: 't', sbd: 'S1' } as never
  renderHook(() => useCaDangMo(d, true))
  await vi.advanceTimersByTimeAsync(50)
  expect(dem['/hs/ca-dang-mo']).toBe(1)
  for (let n = 2; n <= 4; n++) {
    await vi.advanceTimersByTimeAsync(211_000)
    expect(dem['/hs/ca-dang-mo'], `lượt ${n}`).toBe(n)
  }
})

it('đối chứng: vòng nền thường (heSoToiDa mặc định) bị giãn bởi cùng đề nghị ×4', async () => {
  const { batNhipBenVung } = await import('../src/lib/nhip-ben-vung')
  let n = 0
  const v = batNhipBenVung(() => { n++; for (let i = 0; i < 3; i++) ghiHeSo('4', Date.now()); return true }, { coSoMs: 180_000, lechMs: 30_000 })
  v.kich()
  await vi.advanceTimersByTimeAsync(50)
  expect(n).toBe(1)
  await vi.advanceTimersByTimeAsync(265_000)
  expect(n).toBe(1) // ×4 kẹp trần 300 ± 30 giây ⇒ chưa hỏi lại ở 265 giây
  await vi.advanceTimersByTimeAsync(70_000)
  expect(n).toBe(2)
  v.dung()
})
