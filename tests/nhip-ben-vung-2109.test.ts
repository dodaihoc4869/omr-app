// NHỊP TỰ GỌI BỀN VỮNG (sự cố D1 21/09 ~20:30: lệnh đọc 8–23 giây; vòng nền 15 s / 30 s trên mọi máy em ≈ 900 lượt/phút). Luật của Boss: nhịp nền 180 s ± 30 s, không gọi chồng, quay lại tab / có mạng vẫn gọi nhưng chặn dội ≥ 20 s, lỗi ⇒ lùi 30 → 60 → 120 s.
import { describe, expect, it, vi } from 'vitest'
import fs from 'node:fs'
import { CHAN_DOI_MS, LECH_NHIP_MS, LUI_DAN_MS, NHIP_NEN_MS, batNhipBenVung, khoangChoTiepTheo } from '../src/lib/nhip-ben-vung'

describe('khoangChoTiepTheo — thuần', () => {
  it('mặc định 180 s, lệch ±30 s theo số ngẫu nhiên: 0 ⇒ 150 s, 0,5 ⇒ 180 s, 1 ⇒ 210 s', () => {
    expect([NHIP_NEN_MS, LECH_NHIP_MS, CHAN_DOI_MS]).toEqual([180_000, 30_000, 20_000])
    expect(khoangChoTiepTheo(180_000, 30_000, 0, () => 0)).toBe(150_000)
    expect(khoangChoTiepTheo(180_000, 30_000, 0, () => 0.5)).toBe(180_000)
    expect(khoangChoTiepTheo(180_000, 30_000, 0, () => 1)).toBe(210_000)
  })
  it('lùi dần khi lỗi: 30 → 60 → 120 s, giữ ở 120; KHÔNG BAO GIỜ nhanh hơn nhịp thường (nhịp 180 s thì lỗi vẫn ≥ 150 s)', () => {
    expect(LUI_DAN_MS).toEqual([30_000, 60_000, 120_000])
    // nhịp ngắn 10 s (nơi cần nhanh) ⇒ lỗi ép lên mức lùi
    expect(khoangChoTiepTheo(10_000, 0, 1)).toBe(30_000)
    expect(khoangChoTiepTheo(10_000, 0, 2)).toBe(60_000)
    expect(khoangChoTiepTheo(10_000, 0, 3)).toBe(120_000)
    expect(khoangChoTiepTheo(10_000, 0, 9)).toBe(120_000)
    // nhịp 180 s: lỗi không làm gọi NHANH hơn
    for (const n of [1, 2, 3, 9]) expect(khoangChoTiepTheo(180_000, 0, n)).toBe(180_000)
    expect(khoangChoTiepTheo(180_000, 30_000, 2, () => 0)).toBe(150_000)
  })
  it('sàn 1 giây; số lỗi lẻ/âm không làm hỏng', () => {
    expect(khoangChoTiepTheo(0, 0, 0)).toBe(1000)
    expect(khoangChoTiepTheo(100, 5000, 0, () => 0)).toBe(1000)
    expect(khoangChoTiepTheo(10_000, 0, -3)).toBe(10_000)
    expect(khoangChoTiepTheo(10_000, 0, 1.9)).toBe(30_000)
  })
})

/** Đồng hồ + hẹn giờ GIẢ: mỗi lần hẹn ghi lại (f, ms); test tự bấm chạy. */
function may(o: { an?: boolean } = {}) {
  let gio = 1_000_000
  let an = !!o.an
  const hen: { f: () => void; ms: number; huy: boolean }[] = []
  const tuyChon = {
    bayGio: () => gio,
    dangAn: () => an,
    datGio: (f: () => void, ms: number) => { const h = { f, ms, huy: false }; hen.push(h); return h as unknown as ReturnType<typeof setTimeout> },
    xoaGio: (t: ReturnType<typeof setTimeout> | undefined) => { if (t) (t as unknown as { huy: boolean }).huy = true },
    ngauNhien: () => 0.5,
  }
  const con = () => hen.filter((h) => !h.huy)
  return { tuyChon, hen, con, tien: (ms: number) => { gio += ms }, dat: (v: boolean) => { an = v }, chayHen: () => { const h = con().at(-1)!; h.huy = true; h.f() } }
}
const doi = () => new Promise<void>((r) => setTimeout(r, 0))

describe('batNhipBenVung', () => {
  it('gọi NGAY một lần khi bật, rồi hẹn lần kế sau ~180 s (không setInterval)', async () => {
    const m = may()
    const chay = vi.fn(async () => true)
    batNhipBenVung(chay, m.tuyChon)
    await doi()
    expect(chay).toHaveBeenCalledTimes(1)
    expect(m.con()).toHaveLength(1)
    expect(m.con()[0]!.ms).toBe(180_000)
  })
  it('KHÔNG gọi chồng: lần trước chưa xong thì hẹn giờ / sự kiện quay lại tab đều không gọi thêm', async () => {
    const m = may()
    let xong!: () => void
    const chay = vi.fn(() => new Promise<boolean>((r) => { xong = () => r(true) }))
    const nhip = batNhipBenVung(chay, m.tuyChon)
    expect(chay).toHaveBeenCalledTimes(1)
    m.tien(60_000)
    nhip.kich()
    expect(chay).toHaveBeenCalledTimes(1)
    xong()
    await doi()
    expect(chay).toHaveBeenCalledTimes(1)
    expect(m.con()).toHaveLength(1) // hẹn lần kế SAU khi xong
  })
  it('kich() chặn dội: trong 20 s kể từ lần bắt đầu trước ⇒ không gọi; qua 20 s ⇒ gọi; tab ẩn ⇒ không gọi', async () => {
    const m = may()
    const chay = vi.fn(async () => true)
    const nhip = batNhipBenVung(chay, m.tuyChon)
    await doi()
    m.tien(19_000)
    nhip.kich()
    await doi()
    expect(chay).toHaveBeenCalledTimes(1)
    m.tien(2_000) // 21 s
    m.dat(true)
    nhip.kich()
    await doi()
    expect(chay).toHaveBeenCalledTimes(1) // ẩn
    m.dat(false)
    nhip.kich()
    await doi()
    expect(chay).toHaveBeenCalledTimes(2)
    nhip.kich() // ngay sau đó: dội
    await doi()
    expect(chay).toHaveBeenCalledTimes(2)
  })
  it('lỗi (từ chối hoặc trả false) ⇒ đếm lỗi, lần kế theo mức lùi; thành công ⇒ về 0', async () => {
    const m = may()
    const kq: (boolean | Error)[] = [false, new Error('mạng'), true]
    const chay = vi.fn(async () => { const k = kq.shift()!; if (k instanceof Error) throw k; return k })
    const nhip = batNhipBenVung(chay, { ...m.tuyChon, coSoMs: 10_000, lechMs: 0 })
    await doi()
    expect(nhip.soLoi()).toBe(1)
    expect(m.con()[0]!.ms).toBe(30_000)
    m.chayHen()
    await doi()
    expect(nhip.soLoi()).toBe(2)
    expect(m.con()[0]!.ms).toBe(60_000)
    m.chayHen()
    await doi()
    expect(nhip.soLoi()).toBe(0)
    expect(m.con()[0]!.ms).toBe(10_000) // thành công ⇒ về nhịp thường
  })
  it('hẹn giờ tới lúc tab đang ẩn ⇒ KHÔNG gọi, hẹn lại; hiện lại thì gọi', async () => {
    const m = may()
    const chay = vi.fn(async () => true)
    batNhipBenVung(chay, m.tuyChon)
    await doi()
    m.dat(true)
    m.chayHen()
    await doi()
    expect(chay).toHaveBeenCalledTimes(1)
    expect(m.con()).toHaveLength(1)
    m.dat(false)
    m.chayHen()
    await doi()
    expect(chay).toHaveBeenCalledTimes(2)
  })
  it('lệch ngẫu nhiên: hai máy có số ngẫu nhiên khác nhau hẹn KHÁC nhau (trong 150–210 s)', async () => {
    const ms: number[] = []
    for (const r of [0, 0.25, 0.75, 1]) {
      const m = may()
      batNhipBenVung(async () => true, { ...m.tuyChon, ngauNhien: () => r })
      await doi()
      ms.push(m.con()[0]!.ms)
    }
    expect(ms).toEqual([150_000, 165_000, 195_000, 210_000])
  })
  it('dung() ⇒ huỷ hẹn, không gọi thêm dù hẹn cũ chạy hoặc kich()', async () => {
    const m = may()
    const chay = vi.fn(async () => true)
    const nhip = batNhipBenVung(chay, m.tuyChon)
    await doi()
    const h = m.con()[0]!
    nhip.dung()
    expect(h.huy).toBe(true)
    h.f()
    m.tien(100_000)
    nhip.kich()
    await doi()
    expect(chay).toHaveBeenCalledTimes(1)
  })
  it('chayNgay=false ⇒ chỉ hẹn, chưa gọi', async () => {
    const m = may()
    const chay = vi.fn(async () => true)
    batNhipBenVung(chay, { ...m.tuyChon, chayNgay: false })
    await doi()
    expect(chay).not.toHaveBeenCalled()
    expect(m.con()).toHaveLength(1)
  })
})

describe('khoá nguồn: hai vòng nền của cổng học sinh', () => {
  it('StudentPortalScreen: không còn setInterval 30 000 / 15 000 cho syncStudentExp và danh sách Mẹ giao; dùng batNhipBenVung + quay lại tab/online chặn dội', () => {
    const s = fs.readFileSync('src/screens/StudentPortalScreen.tsx', 'utf8')
    expect(s).not.toMatch(/setInterval\(sync,\s*30000\)/)
    expect(s).not.toMatch(/setInterval\(refresh,\s*15000\)/)
    expect(s).toMatch(/batNhipBenVung\(\(\)=>syncStudentExp\(auth\.sbd,auth\.token!\)\)/)
    expect(s).toMatch(/batNhipBenVung\(napDsMom\)/)
    expect(s.match(/import \{ batNhipBenVung \}/g)).toHaveLength(1)
  })
  it('syncStudentExp trả true/false (để vòng nền biết lùi)', () => {
    const s = fs.readFileSync('src/game/than-thu-v2/academic-sync.ts', 'utf8')
    expect(s).toContain('Promise<boolean>')
    expect(s).toMatch(/\.catch\(\(\)=>false/)
  })
})
