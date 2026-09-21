// NỘP TRỄ · CHIA CHẶNG cho em CHƯA TỪNG MỞ bài cá nhân hoá khi hạn đã qua (Code 1, 21/09/2026; Code 3 nối vào chotBoChoEm chế độ nopTre).
import { describe, expect, it } from 'vitest'
import { mulberry32 } from '../src/lib/exam-shuffle'
import { chiaChangNopTre, TRAN_NOP_TRE_MAC_DINH, type CauLoiNopTre } from '../src/lib/ve-dich'

const vn = (s: string) => Date.parse(`${s}:00+07:00`)
const cau = (n: number, giay?: number): CauLoiNopTre[] => Array.from({ length: n }, (_, i) => ({ qid: `Q${i}`, ...(giay === undefined ? {} : { giay }) }))
const MS_NGAY = 86_400_000
const dauNgay = (ms: number) => Math.floor((ms + 7 * 3600_000) / MS_NGAY) * MS_NGAY - 7 * 3600_000

describe('chiaChangNopTre', () => {
  it('70 câu, 90 giây/câu (mặc định): trần 30 câu chặn trước (30 câu = 45 phút) ⇒ 30 · 30 · 10; hai chặng đầu mở NGAY, chặng 3 mở 00:00 ngày kế (giờ VN)', () => {
    const now = vn('2026-09-26T09:30')
    const r = chiaChangNopTre({ now, cauLoi: cau(70) })
    expect(r.chang.map((c) => c.length)).toEqual([30, 30, 10])
    expect(r.moLuc).toEqual([new Date(now).toISOString(), new Date(now).toISOString(), new Date(vn('2026-09-27T00:00')).toISOString()])
    expect(r.chang.flat()).toEqual(cau(70).map((c) => c.qid)) // thứ tự nguyên
  })
  it('trần PHÚT chặn trước khi câu chậm: 150 giây/câu ⇒ 24 câu = 60 phút; 25 câu = 63 phút vượt ⇒ chặng 24 · 24 · … ; giây từng câu được tính riêng, giây lạ ⇒ mặc định', () => {
    const r = chiaChangNopTre({ now: vn('2026-09-26T09:30'), cauLoi: cau(50, 150) })
    expect(r.chang.map((c) => c.length)).toEqual([24, 24, 2])
    const trong = chiaChangNopTre({ now: 0, cauLoi: [{ qid: 'A', giay: 3600 }, { qid: 'B', giay: 1 }, { qid: 'C', giay: Number.NaN }, { qid: 'D' }], giayMoiCau: 90 })
    expect(trong.chang.flat()).toEqual(['A', 'B', 'C', 'D']) // giây 3 600 / 1 / NaN ngoài 5…900 ⇒ 90
    expect(trong.chang).toEqual([['A', 'B', 'C', 'D']])
    // 3 câu 900 giây (15 phút) + câu thứ 5 sẽ là 75 phút ⇒ 4 câu / chặng
    expect(chiaChangNopTre({ now: 0, cauLoi: cau(9, 900) }).chang.map((c) => c.length)).toEqual([4, 4, 1])
  })
  it('mỗi ngày VN tối đa 2 chặng (tuỳ chọn): 5 chặng ⇒ ngày 0 ×2, ngày 1 ×2, ngày 2 ×1; mốc mở đúng 00:00 giờ VN các ngày kế; không lùi; qua nửa đêm VN vẫn theo ngày VN', () => {
    const now = vn('2026-09-26T23:50')
    const r = chiaChangNopTre({ now, cauLoi: cau(150) })
    expect(r.chang).toHaveLength(5)
    expect(r.moLuc).toEqual([now, now, vn('2026-09-27T00:00'), vn('2026-09-27T00:00'), vn('2026-09-28T00:00')].map((t) => new Date(t).toISOString()))
    const mot = chiaChangNopTre({ now, cauLoi: cau(90), tranBuoi: { changMoiNgay: 1 } })
    expect(mot.moLuc).toEqual([now, vn('2026-09-27T00:00'), vn('2026-09-28T00:00')].map((t) => new Date(t).toISOString()))
    const ba = chiaChangNopTre({ now, cauLoi: cau(150), tranBuoi: { changMoiNgay: 3 } })
    expect(ba.moLuc.slice(0, 3).every((m) => m === new Date(now).toISOString())).toBe(true)
    expect(ba.moLuc[3]).toBe(new Date(vn('2026-09-27T00:00')).toISOString())
  })
  it('biên: không câu ⇒ rỗng; 1 câu ⇒ 1 chặng; đúng 30 câu ⇒ 1 chặng; 31 câu ⇒ 30 + 1; tuỳ chọn trần và số lạ', () => {
    expect(chiaChangNopTre({ now: 1, cauLoi: [] })).toEqual({ chang: [], moLuc: [] })
    expect(chiaChangNopTre({ now: 1, cauLoi: cau(1) }).chang).toEqual([['Q0']])
    expect(chiaChangNopTre({ now: 1, cauLoi: cau(30) }).chang.map((c) => c.length)).toEqual([30])
    expect(chiaChangNopTre({ now: 1, cauLoi: cau(31) }).chang.map((c) => c.length)).toEqual([30, 1])
    expect(chiaChangNopTre({ now: 1, cauLoi: cau(10), tranBuoi: { cau: 4 } }).chang.map((c) => c.length)).toEqual([4, 4, 2])
    expect(chiaChangNopTre({ now: 1, cauLoi: cau(10), tranBuoi: { cau: 0, phut: Number.NaN, changMoiNgay: -3 } }).chang.map((c) => c.length)).toEqual([10]) // số lạ ⇒ mặc định
    expect(TRAN_NOP_TRE_MAC_DINH).toEqual({ cau: 30, phut: 60, changMoiNgay: 2 })
  })
  it('TÍNH CHẤT 4 000 ca: mọi câu đúng MỘT chặng và đúng thứ tự; không chặng rỗng; ≤ trần câu và ≤ trần phút (chặng ≥ 2 câu); ≤ 2 chặng/ngày VN; mốc không lùi; chặng ngày sau mở đúng 00:00 VN; thuần', () => {
    const r = mulberry32(1509)
    for (let i = 0; i < 4000; i++) {
      const n = Math.floor(r() * 150)
      const dsGiay = Array.from({ length: n }, () => (r() < 0.3 ? undefined : r() < 0.1 ? 3000 : 20 + Math.floor(r() * 300)))
      const cauLoi = Object.freeze(dsGiay.map((g, k) => Object.freeze({ qid: `X${k}`, ...(g === undefined ? {} : { giay: g }) })))
      const gm = [60, 90, 150][Math.floor(r() * 3)]!
      const now = vn('2026-09-20T00:00') + Math.floor(r() * 10 * MS_NGAY)
      const kq = chiaChangNopTre({ now, cauLoi, giayMoiCau: gm })
      const nhan = `#${i} n${n}`
      expect(kq.chang.flat(), nhan).toEqual(cauLoi.map((c) => c.qid))
      expect(kq.moLuc.length, nhan).toBe(kq.chang.length)
      const giay = (q: string) => { const c = cauLoi[Number(q.slice(1))]!; return typeof c.giay === 'number' && c.giay >= 5 && c.giay <= 900 ? c.giay : gm }
      const dem = new Map<string, number>()
      kq.chang.forEach((c, j) => {
        expect(c.length, `${nhan} chặng ${j} rỗng`).toBeGreaterThan(0)
        expect(c.length, `${nhan} câu`).toBeLessThanOrEqual(30)
        expect(Math.ceil(c.reduce((s, q) => s + giay(q), 0) / 60), `${nhan} phút`).toBeLessThanOrEqual(60)
        if (j > 0) expect(Date.parse(kq.moLuc[j]!), `${nhan} lùi`).toBeGreaterThanOrEqual(Date.parse(kq.moLuc[j - 1]!))
        const ngay = j < 2 ? 'nay' : new Date(Date.parse(kq.moLuc[j]!) + 7 * 3600_000).toISOString().slice(0, 10)
        dem.set(ngay, (dem.get(ngay) ?? 0) + 1)
        if (Math.floor(j / 2) >= 1) expect(Date.parse(kq.moLuc[j]!), `${nhan} 00:00 VN`).toBe(dauNgay(now) + Math.floor(j / 2) * MS_NGAY)
        else expect(Date.parse(kq.moLuc[j]!), nhan).toBe(now)
      })
      for (const [, k] of dem) expect(k, nhan).toBeLessThanOrEqual(2)
      // chặng liền sau chỉ nhỏ hơn khi hết câu hoặc câu kế làm vượt trần: tham lam đúng
      kq.chang.forEach((c, j) => {
        const ke = kq.chang[j + 1]?.[0]
        if (!ke) return
        const cau1 = c.length + 1 > 30
        const phut1 = Math.ceil((c.reduce((s, q) => s + giay(q), 0) + giay(ke)) / 60) > 60
        expect(cau1 || phut1, `${nhan} chặng ${j} chưa đầy mà đã cắt`).toBe(true)
      })
      expect(chiaChangNopTre({ now, cauLoi, giayMoiCau: gm }), nhan).toEqual(kq)
    }
  })
})
