// LÕI ĐÚNG BẬC (thầy chốt 21/09/2026, Code 1): dạng em ỔN ĐỊNH ở bậc ≥ Hiểu thì câu lõi mức thấp được ĐỔI TẠI CHỖ 1–1 bằng câu cùng dạng ĐÚNG bậc của em. Mỗi dạng giữ số câu lõi (độ phủ + tổng không đổi);
// không có câu như vậy ⇒ giữ câu gốc; dạng yếu / chưa đủ tin / bậc Biết / vắng hồ sơ ⇒ Y HỆT bản trước; câu GHIM không bị thay; núm bộ não không đổi lõi; câu lõi gốc bị thay KHÔNG quay lại làm phần riêng.
import { describe, expect, it } from 'vitest'
import { chonBoCuaEm, chonLoi, thichNghiChangSau, type BoCuaEm, type CauGiao, type DieuChinhEm, type HoSoEmRut, type NganSachBai } from '../src/lib/btvn-nang-do'
import { kiemLoiTheoEm } from './_btvn-loi-theo-em'

/** 3 dạng × 5 câu: mức [Biết, Biết, Hiểu, Hiểu, Vận dụng]. */
const CAU: CauGiao[] = Array.from({ length: 3 }, (_, d) =>
  ([0, 0, 1, 1, 2] as const).map((m, k): CauGiao => ({ qid: `a${d}-${k}`, dang: `A${d}`, chuyenDe: `CD${d}`, mucDo: m, sao: ((d + k) % 3) as 0 | 1 | 2, phan: 'I' })),
).flat()
const LOI = chonLoi(CAU, [])
const NS = (soNgay = 3, cauMoiNgay = 10): NganSachBai => ({ soNgay, cauMoiNgay, onLaiMoiNgay: 0 })
const dang = (bac: 0 | 1 | 2, soGap = 8, tiLe: number | null = 0.9) => ({ bac, soGap, soSai: Math.round(soGap * (1 - (tiLe ?? 1))), tiLeKhacPhuc: tiLe })
const ho = (o: Partial<Record<string, ReturnType<typeof dang>>>, cau: HoSoEmRut['cau'] = {}): HoSoEmRut => ({ dang: o as HoSoEmRut['dang'], cau })
const OnDinh = (bac: 0 | 1 | 2 = 1) => ho({ A0: dang(bac), A1: dang(bac), A2: dang(bac) })
const muc = (q: string) => CAU.find((c) => c.qid === q)!.mucDo
const dangCua = (q: string) => CAU.find((c) => c.qid === q)!.dang
const tap = (b: BoCuaEm) => [...b.loi, ...b.rieng, ...b.thuThach]
const chon = (h: HoSoEmRut, ns = NS(), dc?: DieuChinhEm, ghim: string[] = [], loi = LOI) => chonBoCuaEm(CAU, loi, h, ns, 'H|em', dc, ghim.length ? { ghim } : {})

describe('LÕI ĐÚNG BẬC — lõi gốc của bài', () => {
  it('tiền đề: lõi gốc toàn câu Biết, mỗi dạng ≥ 1 câu', () => {
    expect(LOI.every((q) => muc(q) === 0)).toBe(true)
    for (const d of ['A0', 'A1', 'A2']) expect(LOI.some((q) => dangCua(q) === d)).toBe(true)
  })
})

describe('LÕI ĐÚNG BẬC — em ổn định', () => {
  it('bậc Hiểu: mọi câu lõi thành câu Hiểu CÙNG dạng; cùng số câu lõi; độ phủ dạng giữ nguyên; hợp lệ theo bộ kiểm', () => {
    const h = OnDinh(1)
    const b = chon(h)
    expect(b.loi).toHaveLength(LOI.length)
    expect(b.loi.every((q) => muc(q) === 1)).toBe(true)
    for (const d of ['A0', 'A1', 'A2']) expect(b.loi.filter((q) => dangCua(q) === d).length).toBe(LOI.filter((q) => dangCua(q) === d).length)
    expect(kiemLoiTheoEm(CAU, LOI, b, h)).toBe('')
    expect(b.tomTat.soLoi).toBe(LOI.length)
    for (const q of b.loi) expect(b.chang.flat()).toContain(q)
  })

  it('bậc Vận dụng: câu thay có mức = 2 (đúng bậc của em, không phải Hiểu)', () => {
    const h = OnDinh(2)
    const b = chon(h)
    const thay = b.loi.filter((q) => !LOI.includes(q))
    expect(thay.length).toBeGreaterThan(0)
    expect(thay.every((q) => muc(q) === 2)).toBe(true)
    expect(kiemLoiTheoEm(CAU, LOI, b, h)).toBe('')
  })

  it('câu lõi gốc bị thay KHÔNG quay lại (không làm phần riêng, không thử thách, không nằm trong chặng)', () => {
    for (const ns of [NS(3, 10), NS(7, 16), NS(1, 4)]) {
      const b = chon(OnDinh(1), ns)
      const bi = LOI.filter((q) => !b.loi.includes(q))
      expect(bi.length).toBeGreaterThan(0)
      for (const q of bi) expect([...tap(b), ...b.chang.flat(), ...b.thuSucThem]).not.toContain(q)
    }
  })

  it('TỔNG không đổi: số câu lõi, lõi bắt buộc và ngân sách giống em chưa có hồ sơ', () => {
    const goc = chon(ho({}))
    const b = chon(OnDinh(1))
    expect(b.loi.length).toBe(goc.loi.length)
    expect(b.tomTat.soLoi).toBe(goc.tomTat.soLoi)
    expect(b.tomTat.nganSachCau).toBe(goc.tomTat.nganSachCau)
  })

  it('TẤT ĐỊNH và thích nghi sau chặng giữ nguyên lõi của em', () => {
    const h = OnDinh(1)
    expect(chon(h)).toEqual(chon(h))
    const b = chon(h, NS(3, 8))
    const k = thichNghiChangSau(b, CAU, h, 0, { dung: Object.fromEntries(b.chang[0].map((q) => [q, false])) }, { soChangDaMo: 1 })
    expect(k.bo.loi).toEqual(b.loi)
    expect(k.bo.chang[0]).toEqual(b.chang[0])
  })
})

describe('LÕI ĐÚNG BẬC — khi KHÔNG thay (giữ câu gốc, Y HỆT bản trước)', () => {
  it('vắng hồ sơ / hồ sơ rỗng ⇒ lõi = lõi của bài', () => {
    expect(chon(ho({})).loi).toEqual(LOI)
    expect(chon({ dang: undefined, cau: undefined } as unknown as HoSoEmRut).loi).toEqual(LOI)
  })
  it('bậc Biết ổn định ⇒ giữ; dạng chưa đủ tin (< 4 câu đã gặp) ⇒ giữ', () => {
    expect(chon(OnDinh(0)).loi).toEqual(LOI)
    expect(chon(ho({ A0: dang(1, 3), A1: dang(1, 3), A2: dang(1, 3) })).loi).toEqual(LOI)
  })
  it('dạng YẾU (khắc phục < 70 %) ⇒ giữ câu gốc ở dạng ấy; dạng ổn định còn lại vẫn được thay', () => {
    const h = ho({ A0: dang(1, 8, 0.4), A1: dang(1), A2: dang(1) })
    const b = chon(h)
    expect(b.loi.filter((q) => dangCua(q) === 'A0')).toEqual(LOI.filter((q) => dangCua(q) === 'A0'))
    expect(b.loi.filter((q) => dangCua(q) !== 'A0').every((q) => muc(q) === 1)).toBe(true)
    expect(kiemLoiTheoEm(CAU, LOI, b, h)).toBe('')
  })
  it('câu GHIM của thầy KHÔNG bị thay dù dạng ổn định', () => {
    const ghim = LOI.find((q) => dangCua(q) === 'A1')!
    const loiGhim = chonLoi(CAU, [ghim])
    const b = chon(OnDinh(1), NS(), undefined, [ghim], loiGhim)
    expect(b.loi).toContain(ghim)
    expect(b.chang.flat()).toContain(ghim)
  })
  it('KHÔNG có câu đúng bậc còn dùng được (em đã đúng lại ≥ 2 ngày ở mọi câu Hiểu của dạng) ⇒ giữ câu gốc', () => {
    const daDung = { trangThai: 'da_khac_phuc' as const, ngayDungKhacNhau: 3, lanSai: 1 }
    const h = ho({ A0: dang(1), A1: dang(1), A2: dang(1) }, { 'a1-2': daDung, 'a1-3': daDung })
    const b = chon(h)
    expect(b.loi.filter((q) => dangCua(q) === 'A1')).toEqual(LOI.filter((q) => dangCua(q) === 'A1'))
    expect(b.loi.filter((q) => dangCua(q) === 'A0').every((q) => muc(q) === 1)).toBe(true)
  })
  it('câu Hiểu em đã đúng lại ≥ 2 ngày KHÔNG được chọn làm câu thay khi còn câu khác', () => {
    const daDung = { trangThai: 'da_khac_phuc' as const, ngayDungKhacNhau: 3, lanSai: 1 }
    const b = chon(ho({ A0: dang(1), A1: dang(1), A2: dang(1) }, { 'a0-2': daDung, 'a1-2': daDung, 'a2-2': daDung }))
    expect(b.loi).not.toContain('a0-2')
    expect(b.loi).toContain('a0-3')
  })
})

describe('LÕI ĐÚNG BẬC — núm bộ não KHÔNG đổi lõi', () => {
  it('mọi tổ hợp núm + nhịp + khắc phục: lõi của em = lõi khi không có cổng', () => {
    const h = OnDinh(1)
    const goc = chon(h).loi
    const nut = ['uu_tien', 'ha_mot_bac', 'cho_thu_len_bac', 'tam_nghi'] as const
    for (const n of nut) for (const d of ['A0', 'A1', 'A2']) expect(chon(h, NS(), { dang: [{ ma: d, nut: n }], nhip: 2 }).loi, `${n} ${d}`).toEqual(goc)
    expect(chon(h, NS(3, 12), { khacPhuc: [{ dang: 'A1', soCau: 2, bac: 'dung_bac' }] }).loi).toEqual(goc)
  })
})
