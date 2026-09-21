// @vitest-environment node
// `nhipDeNghi` của máy chủ (hợp đồng docs/hop-dong-suc-khoe-may-chu-2109.md): heSo 1|2|4 nhân vào nhịp nền gốc, MAX 3 phản hồi gần nhất, về 1 khi 3 phản hồi liền heSo 1
// hoặc 120 s im; hiện diện không giãn; vòng trực tiếp tối đa ×2; nộp bài không bị heSo trì hoãn (hàng đợi nộp lại không đọc heSo).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
  HEADER_NHIP_DE_NGHI,
  HET_HAN_MS,
  TRAN_NHIP_MAC_DINH_MS,
  batDocNhipDeNghi,
  datLaiCai,
  datLaiHeSo,
  docHeSo,
  ghiHeSo,
  heSoNhip,
  nhipSauHeSo,
} from '../src/lib/nhip-de-nghi'
import { batNhipBenVung, batVongTrucTiep } from '../src/lib/nhip-ben-vung'

const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
const T0 = 1_800_000_000_000

beforeEach(() => datLaiHeSo())

describe('hệ số — thuần', () => {
  it('docHeSo: chỉ nhận 1 | 2 | 4 (số hoặc chuỗi); lạ ⇒ null', () => {
    expect([1, 2, 4, '1', ' 2 ', '4'].map(docHeSo)).toEqual([1, 2, 4, 1, 2, 4])
    for (const x of [0, 3, 8, -1, '', 'x', null, undefined, {}, Number.NaN]) expect(docHeSo(x)).toBeNull()
  })
  it('MAX của 3 phản hồi gần nhất; về 1 CHỈ khi 3 phản hồi LIỀN đều 1', () => {
    expect(heSoNhip(T0)).toBe(1) // chưa có phản hồi
    ghiHeSo(4, T0)
    expect(heSoNhip(T0 + 1)).toBe(4)
    ghiHeSo(1, T0 + 2)
    ghiHeSo(1, T0 + 3)
    expect(heSoNhip(T0 + 4)).toBe(4) // hai phản hồi tốt chưa đủ: mẫu 4 còn trong 3 gần nhất
    ghiHeSo(1, T0 + 5)
    expect(heSoNhip(T0 + 6)).toBe(1) // ba liền tốt
    ghiHeSo(2, T0 + 7)
    expect(heSoNhip(T0 + 8)).toBe(2)
    ghiHeSo(1, T0 + 9)
    ghiHeSo(1, T0 + 10)
    expect(heSoNhip(T0 + 11)).toBe(2) // 2 vẫn nằm trong 3 gần nhất
    ghiHeSo(1, T0 + 12)
    expect(heSoNhip(T0 + 13)).toBe(1)
  })
  it('120 giây không có phản hồi nào ⇒ về 1; giá trị lạ không ghi (không tính là "tốt")', () => {
    ghiHeSo(4, T0)
    expect(heSoNhip(T0 + HET_HAN_MS)).toBe(4)
    expect(heSoNhip(T0 + HET_HAN_MS + 1)).toBe(1)
    datLaiHeSo()
    ghiHeSo(4, T0)
    ghiHeSo('lạ', T0 + 1)
    ghiHeSo(3, T0 + 2)
    expect(heSoNhip(T0 + 3)).toBe(4)
  })
  it('nhipSauHeSo: nhân + kẹp trần 300 s (hoặc nhịp gốc nếu gốc lớn hơn) + kẹp heSoToiDa; heSo 1 ⇒ đúng nhịp gốc; không bao giờ dưới nhịp gốc', () => {
    expect(TRAN_NHIP_MAC_DINH_MS).toBe(300_000)
    expect(nhipSauHeSo(180_000, {}, T0)).toBe(180_000)
    ghiHeSo(2, T0)
    expect(nhipSauHeSo(180_000, {}, T0 + 1)).toBe(300_000) // 360 s kẹp 300 s
    expect(nhipSauHeSo(10_000, {}, T0 + 1)).toBe(20_000) // Bảng tin sàn 10 s ⇒ 20 s
    ghiHeSo(4, T0 + 2)
    expect(nhipSauHeSo(10_000, {}, T0 + 3)).toBe(40_000) // ⇒ 40 s
    expect(nhipSauHeSo(180_000, {}, T0 + 3)).toBe(300_000)
    expect(nhipSauHeSo(600_000, {}, T0 + 3)).toBe(600_000) // gốc đã lớn hơn trần: giữ gốc, không nhân
    expect(nhipSauHeSo(60_000, { heSoToiDa: 1 }, T0 + 3)).toBe(60_000) // hiện diện: không giãn
    expect(nhipSauHeSo(1500, { heSoToiDa: 2, tranMs: 3000 }, T0 + 3)).toBe(3000) // vòng trực tiếp: ×2 là tối đa
  })
})

describe('tích hợp nhịp nền + vòng trực tiếp (đồng hồ giả)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(T0)
  })
  afterEach(() => vi.useRealTimers())

  it('heSo 2 ⇒ vòng nền 180 s giãn thành 300 s (kẹp trần); máy chủ hết bận (3 phản hồi liền heSo 1) ⇒ trở lại 180 s', async () => {
    let heSoMay: 1 | 2 = 2
    // mỗi lượt gọi thật đều nhận một phản hồi kèm header ⇒ ghi mẫu (giả lập ở đây)
    const chay = vi.fn(async () => { ghiHeSo(heSoMay); return true })
    const v = batNhipBenVung(chay, { lechMs: 0, chayNgay: false })
    ghiHeSo(2) // phản hồi trước đó (từ một lệnh khác) đã báo bận
    await vi.advanceTimersByTimeAsync(180_000)
    expect(chay).toHaveBeenCalledTimes(1) // lượt đầu đã hẹn lúc bật, khi chưa biết heSo ⇒ 180 s
    await vi.advanceTimersByTimeAsync(299_000)
    expect(chay).toHaveBeenCalledTimes(1) // lượt kế hẹn 300 s vì heSo 2 (360 s kẹp trần 300 s)
    await vi.advanceTimersByTimeAsync(2_000)
    expect(chay).toHaveBeenCalledTimes(2)
    heSoMay = 1 // máy chủ hết bận
    await vi.advanceTimersByTimeAsync(300_000) // lượt 3 (hẹn 300 s), phản hồi heSo 1 nhưng mẫu 2 còn trong 3 gần nhất
    expect(chay).toHaveBeenCalledTimes(3)
    await vi.advanceTimersByTimeAsync(300_000)
    expect(chay).toHaveBeenCalledTimes(4)
    await vi.advanceTimersByTimeAsync(300_000)
    expect(chay).toHaveBeenCalledTimes(5) // sau các lượt liền heSo 1 ⇒ lượt hẹn kế đã về 180 s
    await vi.advanceTimersByTimeAsync(181_000)
    expect(chay).toHaveBeenCalledTimes(6)
    v.dung()
  })

  it('hiện diện (heSoToiDa 1) KHÔNG giãn dù máy chủ nghẽn', async () => {
    const chay = vi.fn(async () => true)
    const v = batNhipBenVung(chay, { coSoMs: 60_000, lechMs: 0, heSoToiDa: 1 })
    ghiHeSo(4)
    await vi.advanceTimersByTimeAsync(0)
    expect(chay).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(60_000)
    expect(chay).toHaveBeenCalledTimes(2)
    await vi.advanceTimersByTimeAsync(60_000)
    expect(chay).toHaveBeenCalledTimes(3)
    v.dung()
  })

  it('vòng TRỰC TIẾP: heSo 4 chỉ giãn tối đa ×2 (1,5 s ⇒ 3 s)', async () => {
    const chay = vi.fn(async () => true)
    ghiHeSo(4)
    const v = batVongTrucTiep(chay, 1500)
    await vi.advanceTimersByTimeAsync(3000)
    expect(chay).toHaveBeenCalledTimes(1) // lượt đầu hẹn 3 s
    await vi.advanceTimersByTimeAsync(2900)
    expect(chay).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(200)
    expect(chay).toHaveBeenCalledTimes(2)
    v.dung()
  })
})

describe('bọc fetch — CHỈ ĐỌC header', () => {
  it('đọc x-nhip-de-nghi từ phản hồi, trả NGUYÊN phản hồi (cùng đối tượng), không đụng thân; lỗi mạng vẫn ném như cũ; cài một lần', async () => {
    datLaiCai()
    datLaiHeSo()
    const res = new Response('{"ok":true}', { status: 200, headers: { [HEADER_NHIP_DE_NGHI]: '4' } })
    const goc = vi.fn(async (_: unknown) => res)
    const cua = { fetch: goc as unknown as typeof fetch }
    batDocNhipDeNghi(cua)
    const boc = cua.fetch
    batDocNhipDeNghi(cua)
    expect(cua.fetch).toBe(boc) // cài hai lần vẫn một lớp
    const r = await cua.fetch('https://may.test/x')
    expect(r).toBe(res)
    expect(await r.text()).toBe('{"ok":true}') // thân còn nguyên (chưa bị clone / đọc)
    expect(heSoNhip()).toBe(4)
    datLaiHeSo()
    goc.mockRejectedValueOnce(new Error('mạng rớt'))
    await expect(cua.fetch('https://may.test/y')).rejects.toThrow('mạng rớt')
    goc.mockResolvedValueOnce(new Response('x', { status: 500 })) // không có header ⇒ không ghi
    await cua.fetch('https://may.test/z')
    expect(heSoNhip()).toBe(1)
    datLaiCai()
  })
})

describe('khoá nguồn', () => {
  it('main.tsx cài bộ đọc; hiện diện đặt heSoToiDa 1; hàng đợi nộp lại và ExamTakeScreen KHÔNG đọc heSo (nộp bài không bị trì hoãn)', () => {
    expect(doc('src/main.tsx')).toMatch(/batDocNhipDeNghi\(\)/)
    expect(doc('src/lib/app-presence.ts')).toMatch(/heSoToiDa:1/)
    for (const f of ['src/lib/use-hang-doi-nop.ts', 'src/lib/hang-doi-nop.ts', 'src/screens/ExamTakeScreen.tsx', 'src/lib/btvn-nop-chang-em.ts'])
      expect(doc(f), f).not.toMatch(/nhip-de-nghi|heSoNhip|nhipSauHeSo/)
  })
})
