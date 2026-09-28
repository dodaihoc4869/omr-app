// @vitest-environment node
// BỐC CÂU MỚI CÁ NHÂN HOÁ (thầy chốt 28/09): hạng theo dạng L1–L4, bậc thang L3, vừa sức + khởi động L4, thứ tự chuyến Đảo.
import { describe, expect, it } from 'vitest'
import {
  bocCauMoiCaNhan, chiaBacThang, gopThongKeDang, hangTuTiLe, lapKeHoachNgay, phatLaiCau, tiLeLamTron, tinhHangTheoDang, xepChuyenDao,
  type CauSrs, type HangEm, type TrangThaiCau, type TuyChonKeHoach,
} from '../server/src/srs2-loi'

const NGAY_DAU = '2026-10-01'
const HAN = '2026-10-08' // D = 8 ở ngày đầu ⇒ 5 ngày giao câu mới (D − 3)
const MUC = ['NB', 'TH', 'VD', 'VDC'] as const
const ngayThu = (k: number) => new Date(Date.parse(`${NGAY_DAU}T00:00:00Z`) + k * 86_400_000).toISOString().slice(0, 10)

/** Kho mẫu: `so[m]` câu mức m, dạng `dang`. Nhãn mức xen kiểu viết khác nhau để kiểm `HANG_MUC_DO`. */
function kho(so: readonly number[], dang = 'A', tienTo = dang): CauSrs[] {
  const ra: CauSrs[] = []
  const nhan = [['NB', 'Nhận biết', 'biet'], ['TH', 'Thông hiểu', 'hieu'], ['VD', 'Vận dụng', 'van_dung'], ['VDC', 'Vận dụng cao', 'van_dung_cao']]
  so.forEach((n, m) => {
    for (let i = 0; i < n; i++) ra.push({ qid: `${tienTo}-${MUC[m]}-${i}`, phan: 'II', mucDo: nhan[m]![i % 3]!, dang, nguon: 'chien_dich' })
  })
  return ra
}
const mucCua = (c: CauSrs) => ({ NB: 0, 'Nhận biết': 0, biet: 0, TH: 1, 'Thông hiểu': 1, hieu: 1, VD: 2, 'Vận dụng': 2, van_dung: 2, VDC: 3, 'Vận dụng cao': 3, van_dung_cao: 3 } as Record<string, number>)[c.mucDo ?? '']!

/**
 * Chạy kế hoạch từng ngày: câu đã giao coi như đã làm (không có lịch ôn ⇒ không chiếm thể lực), để đo đúng phần câu mới.
 * Trả số câu mới theo mức mỗi ngày (và danh sách câu mới theo thứ tự phục vụ).
 */
function moPhong(cau: CauSrs[], tc: Omit<TuyChonKeHoach, 'homNay' | 'hanNop'>, soNgay = 8) {
  const tt = new Map<string, TrangThaiCau>(cau.map((c) => [c.qid, phatLaiCau(c.qid, [], HAN)]))
  const theoCau = new Map(cau.map((c) => [c.qid, c]))
  const ngay: { so: number[]; ds: CauSrs[]; theoDang: Map<string, number[]> }[] = []
  for (let k = 0; k < soNgay; k++) {
    // Trần Huyết Chiến = trần ngày: đo đúng quota câu mới, không để Huyết Chiến nới trần.
    const kh = lapKeHoachNgay(cau, tt, { homNay: ngayThu(k), hanNop: HAN, tranHuyetChien: tc.tranNgay, ...tc })
    const ds = kh.dao.map((q) => theoCau.get(q)!).filter((c) => tt.get(c.qid)!.laMoi)
    const so = [0, 0, 0, 0]
    const theoDang = new Map<string, number[]>()
    for (const c of ds) {
      so[mucCua(c)]!++
      if (!theoDang.has(c.dang!)) theoDang.set(c.dang!, [0, 0, 0, 0])
      theoDang.get(c.dang!)![mucCua(c)]!++
      tt.set(c.qid, { ...tt.get(c.qid)!, laMoi: false, henOn: null })
    }
    ngay.push({ so, ds, theoDang })
  }
  return { ngay, conMoi: [...tt.values()].filter((t) => t.laMoi).length }
}
const ba = (so: number[]) => so.slice(0, 3)
const hang = (h: HangEm): Pick<TuyChonKeHoach, 'hangTheoDang' | 'hangChung'> => ({ hangTheoDang: { A: h }, hangChung: 'L2' })
const KHO_CHUAN = kho([24, 62, 84]) // 170 câu, 5 ngày × 34

describe('hạng theo dạng', () => {
  it('p = (đúng + 2)/(gặp + 4) và ngưỡng 0,40 / 0,65 / 0,85', () => {
    expect(tiLeLamTron(0, 0)).toBe(0.5)
    expect(tiLeLamTron(8, 10)).toBeCloseTo(10 / 14)
    expect(hangTuTiLe(0.39)).toBe('L1')
    expect(hangTuTiLe(0.4)).toBe('L2')
    expect(hangTuTiLe(0.649)).toBe('L2')
    expect(hangTuTiLe(0.65)).toBe('L3')
    expect(hangTuTiLe(0.85)).toBe('L3')
    expect(hangTuTiLe(0.851)).toBe('L4')
  })
  it('dạng có dữ liệu dùng p riêng; dạng chưa có dùng p chung; em không có gì ⇒ L2', () => {
    const r = tinhHangTheoDang(new Map([['A', { gap: 20, dung: 20 }], ['B', { gap: 10, dung: 1 }]]), ['A', 'B', 'C'])
    expect(r.hangTheoDang.A).toBe('L4') // 22/24
    expect(r.hangTheoDang.B).toBe('L1') // 3/14
    expect(r.hangChung).toBe('L3') // 23/34 ≈ 0,68
    expect(r.hangTheoDang.C).toBe('L3')
    const rong = tinhHangTheoDang(new Map(), ['A', 'B'])
    expect(rong).toEqual({ hangTheoDang: { A: 'L2', B: 'L2' }, hangChung: 'L2' })
  })
  it('gộp hồ sơ nam_kt_dang + lần làm trong chiến dịch: bỏ lượt có gợi ý, lượt trước lúc giao, lượt đã nằm trong hồ sơ, dòng CD:', () => {
    const tk = gopThongKeDang(
      [{ maDang: 'A', soGap: 10, soSai: 4, capNhatLuc: '2026-10-02T00:00:00Z' }, { maDang: 'CD:X', soGap: 50, soSai: 0, capNhatLuc: null }],
      [
        { dang: 'A', luc: '2026-10-01T10:00:00Z', dung: true, coGoiY: false }, // đã có trong hồ sơ
        { dang: 'A', luc: '2026-10-03T10:00:00Z', dung: true, coGoiY: false },
        { dang: 'A', luc: '2026-10-03T11:00:00Z', dung: true, coGoiY: true }, // có gợi ý
        { dang: 'B', luc: '2026-09-20T10:00:00Z', dung: true, coGoiY: false }, // trước lúc giao
        { dang: 'B', luc: '2026-10-03T10:00:00Z', dung: false, coGoiY: false },
      ],
      '2026-10-01T00:00:00Z',
    )
    expect(Object.fromEntries(tk)).toEqual({ A: { gap: 11, dung: 7 }, B: { gap: 1, dung: 0 } })
  })
})

describe('ví dụ chuẩn kho 24 NB / 62 TH / 84 VD, 5 ngày × 34', () => {
  it('L1, L2: dễ trước (như cũ)', () => {
    for (const h of ['L1', 'L2'] as const) {
      const { ngay, conMoi } = moPhong(KHO_CHUAN, { tranNgay: 34, ...hang(h) })
      expect(ngay.slice(0, 5).map((x) => ba(x.so))).toEqual([[24, 10, 0], [0, 34, 0], [0, 18, 16], [0, 0, 34], [0, 0, 34]])
      expect(conMoi).toBe(0)
    }
  })
  it('L3: bậc thang — sai số ≤ 2 câu/mức/ngày so với bảng thầy, tổng mỗi ngày 34, hết mọi mức ngày giao cuối', () => {
    const { ngay, conMoi } = moPhong(KHO_CHUAN, { tranNgay: 34, ...hang('L3') })
    const mau = [[8, 16, 10], [8, 14, 12], [4, 12, 18], [2, 10, 22], [2, 10, 22]]
    ngay.slice(0, 5).forEach((x, k) => {
      expect(x.so.reduce((s, v) => s + v, 0)).toBe(34)
      ba(x.so).forEach((v, m) => expect(Math.abs(v - mau[k]![m]!)).toBeLessThanOrEqual(2))
    })
    // Câu khó tăng dần theo ngày, câu dễ giảm dần.
    for (let k = 1; k < 5; k++) {
      expect(ngay[k]!.so[2]!).toBeGreaterThanOrEqual(ngay[k - 1]!.so[2]!)
      expect(ngay[k]!.so[0]!).toBeLessThanOrEqual(ngay[k - 1]!.so[0]!)
    }
    expect(ngay.slice(5).every((x) => x.ds.length === 0)).toBe(true)
    expect(conMoi).toBe(0)
  })
  it('chiaBacThang tái tạo đúng từng ngày khi đưa đúng phần còn lại của bảng thầy', () => {
    const con = [[24, 62, 84, 5], [16, 46, 74, 4], [8, 32, 62, 3], [4, 20, 44, 2]]
    const ra = con.map(([a, b, c, K]) => [...chiaBacThang(new Map([[0, a!], [1, b!], [2, c!]]), 34, K!).values()])
    expect(ra[2]).toEqual([4, 12, 18])
    expect(ra[3]).toEqual([2, 10, 22])
    const mau = [[8, 16, 10], [8, 14, 12]]
    ra.slice(0, 2).forEach((x, k) => x.forEach((v, m) => expect(Math.abs(v - mau[k]![m]!)).toBeLessThanOrEqual(2)))
    expect([...chiaBacThang(new Map([[0, 2], [1, 10], [2, 22]]), 34, 1).values()]).toEqual([2, 10, 22])
  })
  it('L4: vừa sức trước + 6 câu khởi động (dễ hơn 1 bậc)', () => {
    const { ngay, conMoi } = moPhong(KHO_CHUAN, { tranNgay: 34, ...hang('L4') })
    expect(ngay.slice(0, 5).map((x) => ba(x.so))).toEqual([[0, 6, 28], [0, 6, 28], [0, 6, 28], [0, 34, 0], [24, 10, 0]])
    expect(conMoi).toBe(0)
    // Câu khởi động rải đều: mỗi chuyến 6 câu đầu ngày có ít nhất một câu Thông hiểu.
    const d1 = ngay[0]!.ds
    for (let i = 0; i + 6 <= d1.length; i += 6) expect(d1.slice(i, i + 6).some((c) => mucCua(c) === 1)).toBe(true)
  })
})

describe('mọi câu mới giao hết trước D − 3', () => {
  it.each(['L1', 'L2', 'L3', 'L4'] as const)('hạng %s, kho có cả Vận dụng cao, thể lực 40', (h) => {
    const cau = kho([13, 41, 37, 9])
    const { ngay, conMoi } = moPhong(cau, { tranNgay: 40, ...hang(h) })
    expect(conMoi).toBe(0)
    expect(ngay.slice(5).every((x) => x.ds.length === 0)).toBe(true)
  })
  it('một ngày nhiều dạng khác hạng: tổng mỗi ngày = quota, từng dạng theo luật của hạng mình', () => {
    const cau = [...kho([10, 20, 30], 'A'), ...kho([12, 20, 18], 'B'), ...kho([8, 22, 30], 'C')] // 170 câu
    const tc = { tranNgay: 34, hangTheoDang: { A: 'L1', B: 'L3', C: 'L4' } as Record<string, HangEm> }
    const { ngay, conMoi } = moPhong(cau, tc)
    expect(conMoi).toBe(0)
    ngay.slice(0, 5).forEach((x) => expect(x.ds.length).toBe(34))
    // Dạng A (Yếu): ngày đầu toàn câu dễ; dạng C (Giỏi): ngày đầu chủ yếu Vận dụng + vài câu Thông hiểu khởi động.
    const a1 = ngay[0]!.theoDang.get('A')!, c1 = ngay[0]!.theoDang.get('C')!
    expect(a1[2]).toBe(0)
    expect(a1[0]).toBeGreaterThan(0)
    expect(c1[2]!).toBeGreaterThan(c1[1]!)
    expect(c1[1]!).toBeGreaterThan(0)
    expect(c1[0]).toBe(0)
  })
  it('em không có dữ liệu ⇒ L2 (dễ trước)', () => {
    const { hangTheoDang, hangChung } = tinhHangTheoDang(new Map(), ['A'])
    const a = moPhong(KHO_CHUAN, { tranNgay: 34, hangTheoDang, hangChung })
    const b = moPhong(KHO_CHUAN, { tranNgay: 34, ...hang('L2') })
    expect(a.ngay.map((x) => x.ds.map((c) => c.qid))).toEqual(b.ngay.map((x) => x.ds.map((c) => c.qid)))
  })
})

describe('vắng hangTheoDang ⇒ y hệt cũ', () => {
  it('kế hoạch từng ngày trùng với hạng L2 cho mọi dạng (thứ tự cũ, dễ trước)', () => {
    const cau = [...kho([10, 20, 30], 'A'), ...kho([12, 20, 18], 'B')]
    const cu = moPhong(cau, { tranNgay: 40 })
    const l2 = moPhong(cau, { tranNgay: 40, hangTheoDang: {}, hangChung: 'L2' })
    expect(cu.ngay.map((x) => x.ds.map((c) => c.qid))).toEqual(l2.ngay.map((x) => x.ds.map((c) => c.qid)))
    expect(ba(cu.ngay[0]!.so)).toEqual([22, 18, 0])
  })
  it('bocCauMoiCaNhan với mọi câu L2 giữ nguyên thứ tự đầu vào', () => {
    const moi = kho([3, 3, 3])
    expect(bocCauMoiCaNhan(moi, 4, 3, () => 'L2').map((c) => c.qid)).toEqual(moi.map((c) => c.qid))
  })
})

describe('thứ tự trong chuyến Đảo', () => {
  it('câu ôn đi trước; ải 1–2 là câu mới dễ nhất, trùm (ải 6) khó nhất', () => {
    type X = { q: string; moi: boolean; m: string }
    const ds: X[] = [{ q: 'a', moi: true, m: 'VD' }, { q: 'b', moi: true, m: 'NB' }, { q: 'c', moi: true, m: 'VDC' }, { q: 'd', moi: true, m: 'TH' }, { q: 'e', moi: true, m: 'hieu' }, { q: 'f', moi: true, m: 'Vận dụng' }]
    const xep = xepChuyenDao(ds, (x) => x.moi, (x) => x.m).map((x) => x.q)
    expect(xep.slice(0, 2).sort()).toEqual(['b', 'd'])
    expect(xep[5]).toBe('c')
    const coOn = xepChuyenDao([...ds.slice(0, 4), { q: 'on', moi: false, m: 'VDC' }], (x) => x.moi, (x) => x.m).map((x) => x.q)
    expect(coOn).toEqual(['on', 'b', 'd', 'a', 'c'])
  })
})
