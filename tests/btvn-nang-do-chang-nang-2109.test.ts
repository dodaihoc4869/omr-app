// CHẶNG NẶNG (Boss chốt 21/09, hướng (c)): MỘT ngưỡng dùng chung cho máy em (Code 2) và Xem trước của thầy (Code 4) — > 20 câu HOẶC > 40 phút.
// Chỉ CẢNH BÁO: không đổi bộ, không đổi lịch (dấu vân tay mô phỏng `59b3e73a13` giữ nguyên khi thêm hàm này).
import { describe, expect, it } from 'vitest'
import { LICH_CHANG, laChangNang, nganSachHanNgan, phutUocTinhChang, sucChua } from '../src/lib/btvn-nang-do-lich'
import { chonBoCuaEm, chonLoi, type CauGiao, type HoSoEmRut } from '../src/lib/btvn-nang-do'

describe('laChangNang — ngưỡng dùng chung', () => {
  it('hằng số: 20 câu · 40 phút', () => {
    expect(LICH_CHANG.CHANG_NANG_CAU).toBe(20)
    expect(LICH_CHANG.CHANG_NANG_PHUT).toBe(40)
  })

  it('ranh giới CÂU: đúng 20 câu chưa nặng, 21 câu nặng (giây/câu ngắn để phút không xen vào)', () => {
    expect(laChangNang(20, 30)).toBe(false)
    expect(laChangNang(21, 30)).toBe(true)
  })

  it('ranh giới PHÚT (chỉ chi phối khi em làm CHẬM, > 120 giây/câu, vì 20 câu × 120 s = 40 phút): đúng 40 phút chưa nặng, hơn một giây là nặng — so số thực, không làm tròn', () => {
    expect(laChangNang(16, 150)).toBe(false) // 2400 s = đúng 40 phút
    expect(laChangNang(17, 150)).toBe(true) // 2550 s
    expect(laChangNang(20, 120)).toBe(false) // 2400 s
    expect(laChangNang(20, 121)).toBe(true) // 2420 s
    expect(laChangNang(19, 126)).toBe(false) // 2394 s
    expect(laChangNang(19, 127)).toBe(true) // 2413 s
    expect(laChangNang(22, 60)).toBe(true) // quá 20 câu dù chỉ 22 phút
  })

  it('giây/câu lạ (NaN, 0, âm, quá lớn, vô cực) ⇒ dùng mặc định 90 giây (20 câu = 30 phút: chưa nặng; 21 câu: nặng vì quá số câu); số câu lạ ⇒ không nặng', () => {
    for (const g of [Number.NaN, 0, -3, 5000, Number.POSITIVE_INFINITY]) {
      expect(laChangNang(20, g), String(g)).toBe(false)
      expect(laChangNang(21, g), String(g)).toBe(true)
    }
    for (const n of [Number.NaN, -5, 0, Number.NEGATIVE_INFINITY]) expect(laChangNang(n, 90), String(n)).toBe(false)
  })

  it('phutUocTinhChang làm tròn LÊN và THỐNG NHẤT với laChangNang: nặng ⇔ > 20 câu hoặc phút hiện ra > 40 (lưới 1–60 câu × 15 mức giây)', () => {
    expect(phutUocTinhChang(27, 90)).toBe(41)
    expect(phutUocTinhChang(16, 150)).toBe(40)
    expect(phutUocTinhChang(0, 90)).toBe(0)
    expect(phutUocTinhChang(10, Number.NaN)).toBe(15)
    for (let n = 1; n <= 60; n++)
      for (const g of [20, 30, 45, 60, 75, 90, 100, 110, 120, 135, 150, 200, 300, 600, 900])
        expect(laChangNang(n, g), `${n} câu × ${g} s`).toBe(n > LICH_CHANG.CHANG_NANG_CAU || phutUocTinhChang(n, g) > LICH_CHANG.CHANG_NANG_PHUT)
  })
})

describe('ca số thật: bài 113 câu (lõi 34), hạn 24/09 12:00 — chặng nặng chỉ khi em mở sát hạn', () => {
  const CAU: CauGiao[] = (() => {
    const ra: CauGiao[] = []
    for (let d = 0; d < 28; d++) ([0, 0, 1, 2] as const).forEach((m, k) => ra.push({ qid: `q${d}-${k}`, dang: `D${d}`, chuyenDe: `CD${d % 6}`, mucDo: m, sao: ((d + k) % 3) as 0 | 1 | 2, phan: 'I' }))
    ra.push({ qid: 'q28-0', dang: 'D28', chuyenDe: 'CD1', mucDo: 0, sao: 1, phan: 'I' })
    return ra
  })()
  const LOI = chonLoi(CAU, [])
  const rong = (): HoSoEmRut => ({ dang: {}, cau: {} })
  const chang = (chot: string) => {
    const q = { chotLuc: new Date(`${chot}+07:00`).toISOString(), hanNop: new Date('2026-09-24T12:00:00+07:00').toISOString(), cauMoiNgay: 12, onLaiMoiNgay: 0, giayMoiCau: 90 }
    return chonBoCuaEm(CAU, LOI, rong(), nganSachHanNgan(sucChua(q), q, LOI.length), 'H|em').chang.map((c) => c.length)
  }
  it('mở tối trước hạn lúc 20:30 ⇒ 3 chặng ~12 câu (không nặng); lúc 23:00 ⇒ MỘT chặng 34 câu ≈ 51 phút (nặng vì quá 20 câu)', () => {
    const som = chang('2026-09-23T20:30')
    expect(som.length).toBe(3)
    expect(som.some((n) => laChangNang(n, 90))).toBe(false)
    const muon = chang('2026-09-23T23:00')
    expect(muon).toEqual([34])
    expect(laChangNang(muon[0], 90)).toBe(true)
    expect(phutUocTinhChang(muon[0], 90)).toBe(51)
  })
})
