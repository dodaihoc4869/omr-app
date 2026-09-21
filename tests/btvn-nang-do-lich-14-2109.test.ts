// BTVN "NÂNG ĐỠ" — BẢN 1.4: NGÂN SÁCH HẠN NGẮN CÓ TRẦN (Code 1, 21/09/2026; Boss duyệt hệ số 1,0): em mở MUỘN không bao giờ nhận nhiều câu hơn em mở SỚM (cùng bài, cùng hạn, cùng ngân sách gốc).
// Lỗi cũ: hạn ngắn đưa cho lõi `soPhien × cauMoiPhien` (bài 113 câu hạn 24/09 12:00: mở 21/09 20:30 ⇒ 36 câu; mở 22/09 21:00 ⇒ 60 câu). Nay trần = min(soCauToiDa, ngân sách gốc × số buổi tối còn trọn) qua `NganSachBai.tongToiDa`.
import { describe, expect, it } from 'vitest'
import { nganSachHanNgan, soNgayToiHan, sucChua, type CuaSoHoc } from '../src/lib/btvn-nang-do-lich'
import { chonBoCuaEm, chonLoi, type CauGiao, type HoSoEmRut, type NganSachBai } from '../src/lib/btvn-nang-do'
import { mulberry32 } from '../src/lib/exam-shuffle'

const vn = (s: string) => new Date(`${s}+07:00`).toISOString()

/** Tổng câu mà ngân sách này cho phép chọn (chưa tính lõi): dài = soNgay × (câu/ngày − ôn lại); ngắn = min(soNgay × câu/chặng, trần). */
const tongChoPhep = (ns: NganSachBai): number => Math.min(ns.soNgay * Math.max(0, ns.cauMoiNgay - ns.onLaiMoiNgay), ns.tongToiDa ?? Infinity)

describe('nganSachHanNgan — hạn DÀI y hệt cũ, hạn NGẮN có trần', () => {
  const p = (chot: string, o: Record<string, unknown> = {}) => ({ chotLuc: vn(chot), hanNop: vn('2026-09-24T12:00'), cauMoiNgay: 12, onLaiMoiNgay: 0, giayMoiCau: 90, ...o })

  it('CA SỐ THẬT của Boss: bài 113 câu, hạn 24/09 12:00, ngân sách 12/tối ⇒ mở 21/09 20:30 = 36 · mở 22/09 21:00 ≤ 24 (trước: 60) · mở 23/09 20:30 ≤ 12 (trước: 30)', () => {
    const tong = (chot: string) => {
      const q = p(chot)
      const sc = sucChua(q)
      return { sc, ns: nganSachHanNgan(sc, q), truoc: sc.cheDo === 'ngan' ? sc.soPhien * sc.cauMoiPhien : sc.soNgay * 12 }
    }
    const a = tong('2026-09-21T20:30')
    const b = tong('2026-09-22T21:00')
    const c = tong('2026-09-23T20:30')
    expect(a.sc.cheDo).toBe('dai')
    expect(tongChoPhep(a.ns)).toBe(36)
    expect(b.sc.cheDo).toBe('ngan')
    expect(tongChoPhep(b.ns)).toBe(24)
    expect(tongChoPhep(c.ns)).toBe(12)
    expect(b.truoc).toBe(60) // bản cũ: 6 phiên × 10 câu
    expect(c.truoc).toBe(30)
    expect(tongChoPhep(a.ns)).toBeGreaterThanOrEqual(tongChoPhep(b.ns))
    expect(tongChoPhep(b.ns)).toBeGreaterThanOrEqual(tongChoPhep(c.ns))
  })

  it('hạn DÀI: trả Y HỆT ngân sách cũ (soNgay, ngân sách gốc, ôn lại), KHÔNG có trần', () => {
    const q = p('2026-09-21T20:30', { cauMoiNgay: 14, onLaiMoiNgay: 3 })
    const sc = sucChua(q)
    expect(sc.cheDo).toBe('dai')
    expect(nganSachHanNgan(sc, q)).toEqual({ soNgay: sc.soNgay, cauMoiNgay: 14, onLaiMoiNgay: 3 })
    expect('tongToiDa' in nganSachHanNgan(sc, q)).toBe(false)
  })

  it('hạn NGẮN: trần = min(soCauToiDa, ngân sách gốc × số buổi tối); ôn lại 0; chặng tối đa = số phiên (không biết lõi) hoặc vừa đủ cho max(trần, lõi) (biết lõi)', () => {
    const q = p('2026-09-22T21:00')
    const sc = sucChua(q)
    expect(sc).toMatchObject({ cheDo: 'ngan', soPhien: 6, cauMoiPhien: 10, soCauToiDa: 36 })
    expect(soNgayToiHan(q.chotLuc, q.hanNop)).toBe(2)
    expect(nganSachHanNgan(sc, q)).toEqual({ soNgay: 6, cauMoiNgay: 10, onLaiMoiNgay: 0, tongToiDa: 24 }) // 12 × 2 buổi = 24 < 36
    expect(nganSachHanNgan(sc, q, 0).soNgay).toBe(3) // ⌈24/10⌉
    expect(nganSachHanNgan(sc, q, 34).soNgay).toBe(4) // lõi 34 > trần 24 ⇒ ⌈34/10⌉
    expect(nganSachHanNgan(sc, q, 500).soNgay).toBe(6) // không quá số phiên
    expect(nganSachHanNgan(sc, q, Number.NaN).soNgay).toBe(6) // số lạ ⇒ như không biết
    // ôn lại trừ khỏi ngân sách gốc: 12 − 3 = 9/buổi × 2 = 18
    const coOnLai = nganSachHanNgan(sucChua({ ...q, onLaiMoiNgay: 3 }), { ...q, onLaiMoiNgay: 3 })
    expect(coOnLai.tongToiDa).toBe(18)
    expect(coOnLai.onLaiMoiNgay).toBe(0) // hạn ngắn: ôn lại đã trừ vào trần, không trừ lần nữa trong ngân sách chặng
  })

  it('trần không bao giờ dưới 1; soCauToiDa nhỏ hơn thì lấy soCauToiDa (em làm chậm)', () => {
    const q = p('2026-09-23T20:30', { giayMoiCau: 300 })
    const sc = sucChua(q)
    expect(sc.cheDo).toBe('ngan')
    const ns = nganSachHanNgan(sc, q)
    expect(ns.tongToiDa).toBeLessThanOrEqual(sc.soCauToiDa)
    expect(ns.tongToiDa).toBeGreaterThanOrEqual(1)
  })
})

describe('TÍNH CHẤT ĐƠN ĐIỆU: chốt càng muộn, tổng câu cho phép càng KHÔNG tăng', () => {
  it('lưới thời điểm chốt mỗi 7 phút × 4 hạn × 3 ngân sách × 4 tốc độ × 2 cửa sổ (~190 nghìn điểm): 0 lần tăng; và mọi trần ≤ ngân sách gốc × số buổi tối, ≤ soCauToiDa, số chặng ≤ số phiên', () => {
    let soDiem = 0
    for (const han of ['2026-09-24T12:00', '2026-09-24T23:59', '2026-09-25T20:30', '2026-09-24T00:00'])
      for (const rong of [8, 12, 16])
        for (const giay of [60, 90, 150, 300])
          for (const cs of [undefined, { tu: '19:00', den: '22:00' } as CuaSoHoc]) {
            let truoc = Infinity
            const t0 = Date.parse('2026-09-15T00:00:00+07:00')
            const t1 = Date.parse(`${han}:00+07:00`) - 60_000
            for (let t = t0; t <= t1; t += 7 * 60_000) {
              const q = { chotLuc: new Date(t).toISOString(), hanNop: vn(han), cauMoiNgay: rong, onLaiMoiNgay: 0, giayMoiCau: giay, cuaSo: cs }
              const sc = sucChua(q)
              const ns = nganSachHanNgan(sc, q)
              const T = tongChoPhep(ns)
              soDiem++
              if (T > truoc) throw new Error(`TĂNG khi chốt muộn hơn: ${han} rong ${rong} giây ${giay} chốt ${new Date(t + 7 * 3_600_000).toISOString().slice(0, 16)}: ${truoc} → ${T}`)
              truoc = T
              if (sc.cheDo === 'ngan') {
                expect(ns.tongToiDa).toBeLessThanOrEqual(rong * soNgayToiHan(q.chotLuc, q.hanNop, cs))
                expect(ns.tongToiDa).toBeLessThanOrEqual(sc.soCauToiDa)
                expect(ns.soNgay).toBeLessThanOrEqual(sc.soPhien)
                expect(ns.soNgay * ns.cauMoiNgay).toBeGreaterThanOrEqual(ns.tongToiDa as number) // đủ chỗ chứa trần
              }
            }
          }
    expect(soDiem).toBeGreaterThan(150_000)
  })
})

describe('LÕI: `NganSachBai.tongToiDa` trong `chonBoCuaEm` — lõi bắt buộc luôn đủ, chỉ phần riêng + thử thách bị chặn', () => {
  /** 28 dạng × 4 câu + 1 = 113 câu (như bài thật): [Biết, Biết, Hiểu, Vận dụng]. */
  const CAU: CauGiao[] = (() => {
    const ra: CauGiao[] = []
    for (let d = 0; d < 28; d++) ([0, 0, 1, 2] as const).forEach((m, k) => ra.push({ qid: `q${d}-${k}`, dang: `D${d}`, chuyenDe: `CD${d % 6}`, mucDo: m, sao: ((d + k) % 3) as 0 | 1 | 2, phan: 'I' }))
    ra.push({ qid: 'q28-0', dang: 'D28', chuyenDe: 'CD1', mucDo: 0, sao: 1, phan: 'I' })
    return ra
  })()
  const LOI = chonLoi(CAU, [])
  const rong = (): HoSoEmRut => ({ dang: {}, cau: {} })

  it('vắng trần / trần không hợp lệ ⇒ kết quả Y HỆT bản không có trường (kể cả Infinity, NaN, âm)', () => {
    const goc = chonBoCuaEm(CAU, LOI, rong(), { soNgay: 6, cauMoiNgay: 10, onLaiMoiNgay: 0 }, 'H')
    for (const tongToiDa of [undefined, Number.NaN, -1, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, 'x' as unknown as number])
      expect(chonBoCuaEm(CAU, LOI, rong(), { soNgay: 6, cauMoiNgay: 10, onLaiMoiNgay: 0, tongToiDa }, 'H'), String(tongToiDa)).toEqual(goc)
  })
  it('trần chặn phần riêng + thử thách: trần < lõi ⇒ tổng = lõi bắt buộc; trần > lõi ⇒ tổng ≤ trần; lõi bắt buộc luôn nằm đủ trong các chặng; số thực bị làm tròn xuống', () => {
    const tong = (t: number | undefined) => chonBoCuaEm(CAU, LOI, rong(), { soNgay: 6, cauMoiNgay: 10, onLaiMoiNgay: 0, tongToiDa: t }, 'H')
    const khong = tong(undefined)
    expect(khong.tomTat.tong).toBeGreaterThan(khong.tomTat.soLoi) // không trần: có phần riêng
    const boLoi = tong(0)
    expect(boLoi.tomTat.tong).toBe(boLoi.tomTat.soLoi)
    expect(boLoi.tomTat.nganSachCau).toBe(boLoi.tomTat.soLoi) // con số ngân sách hiện cho thầy không bao giờ dưới lõi bắt buộc
    expect(boLoi.rieng).toEqual([])
    expect(boLoi.thuThach).toEqual([])
    const lo = boLoi.tomTat.soLoi
    const vua = tong(lo + 5.9)
    expect(vua.tomTat.tong).toBeLessThanOrEqual(lo + 5)
    expect(vua.tomTat.tong).toBeGreaterThanOrEqual(lo)
    for (const b of [boLoi, vua, khong]) for (const q of b.loi.filter((x) => !b.thuSucThem.includes(x))) expect(b.chang.flat()).toContain(q)
    expect(tong(1000).tomTat.tong).toBe(khong.tomTat.tong) // trần rộng hơn ngân sách ⇒ không đổi
  })

  it('CA SỐ THẬT đi hết đường ống (sucChua → nganSachHanNgan → chonBoCuaEm): tổng câu của em mở 21/09 20:30 ≥ mở 22/09 21:00 ≥ mở 23/09 20:30, lõi bắt buộc đủ ở cả ba; bản cũ thì mở muộn nhiều hơn', () => {
    const hanNop = vn('2026-09-24T12:00')
    const boCho = (chot: string, cu = false) => {
      const q = { chotLuc: vn(chot), hanNop, cauMoiNgay: 12, onLaiMoiNgay: 0, giayMoiCau: 90 }
      const sc = sucChua(q)
      const ns: NganSachBai = cu ? (sc.cheDo === 'ngan' ? { soNgay: sc.soPhien, cauMoiNgay: sc.cauMoiPhien, onLaiMoiNgay: 0 } : { soNgay: sc.soNgay, cauMoiNgay: 12, onLaiMoiNgay: 0 }) : nganSachHanNgan(sc, q, LOI.length)
      return chonBoCuaEm(CAU, LOI, rong(), ns, 'H|em')
    }
    const moi = ['2026-09-21T20:30', '2026-09-22T21:00', '2026-09-23T20:30'].map((c) => boCho(c))
    const cu = ['2026-09-21T20:30', '2026-09-22T21:00', '2026-09-23T20:30'].map((c) => boCho(c, true))
    expect(moi[0].tomTat.tong).toBeGreaterThanOrEqual(moi[1].tomTat.tong)
    expect(moi[1].tomTat.tong).toBeGreaterThanOrEqual(moi[2].tomTat.tong)
    for (const b of moi) for (const q of b.loi.filter((x) => !b.thuSucThem.includes(x))) expect(b.chang.flat(), 'lõi bắt buộc phải đủ').toContain(q)
    // bản cũ vi phạm đúng điều Boss nêu: mở muộn nhận NHIỀU HƠN mở sớm
    expect(cu[1].tomTat.tong).toBeGreaterThan(cu[0].tomTat.tong)
    // số chặng của bản mới không vượt số phiên và không vụn: mỗi chặng ≤ 10 câu khi lõi vừa trần
    expect(moi[1].chang.length).toBeLessThanOrEqual(6)
  })

  it('TÍNH CHẤT 300 em × mọi thời điểm chốt: tổng bộ của em mở muộn hơn ≤ tổng bộ của em mở sớm hơn (cùng bài, hạn, ngân sách gốc)', () => {
    const rnd = mulberry32(14092026)
    for (let i = 0; i < 300; i++) {
      const hanNop = vn(['2026-09-24T12:00', '2026-09-25T12:00', '2026-09-26T12:00', '2026-09-24T23:59'][Math.floor(rnd() * 4)])
      const cauMoiNgay = 8 + Math.floor(rnd() * 9)
      const onLai = Math.floor(rnd() * 3)
      const giay = [60, 90, 150][Math.floor(rnd() * 3)]
      const chot1 = Date.parse('2026-09-19T08:00:00+07:00') + Math.floor(rnd() * 5 * 86_400_000)
      const chot2 = chot1 + Math.floor(rnd() * 3 * 86_400_000)
      if (chot2 >= Date.parse(hanNop) - 3_600_000) continue
      const tong = (chot: number) => {
        const q = { chotLuc: new Date(chot).toISOString(), hanNop, cauMoiNgay, onLaiMoiNgay: onLai, giayMoiCau: giay }
        return chonBoCuaEm(CAU, LOI, rong(), nganSachHanNgan(sucChua(q), q, LOI.length), 'H|em').tomTat.tong
      }
      expect(tong(chot2), `${i}: chốt muộn hơn không được nhiều hơn`).toBeLessThanOrEqual(tong(chot1))
    }
  })
})
