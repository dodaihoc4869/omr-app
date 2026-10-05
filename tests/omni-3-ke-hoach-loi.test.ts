// OMNI 3 · làn A2 — luật thuần mới của `lapKeHoachNgay` (đặc tả DAC-TA-BUILD-OMNI-3-0510.md mục 1 bước 3 + 11, mục 4.9; prompt tick bài mục B, C, D, G):
// nhiều bài song song (EDF, quota riêng, Huyết Chiến), trọng số câu, dạng đã vững, ôn bài cũ, chế độ chờ. Mọi trường TUỲ CHỌN.
import { describe, expect, it } from 'vitest'
import { congNgay, lapKeHoachNgay, phatLaiCau, quotaCauMoi, type CauSrs, type LanLam, type TrangThaiCau, type TuyChonKeHoach } from '../server/src/srs2-loi'
import { theLucCho } from '../server/src/omni-ke-hoach'
import { THAM_SO_OMNI } from '../server/src/omni-kieu'

const HOM_NAY = '2026-10-05'
const han = (D: number) => congNgay(HOM_NAY, D - 1)
const lan = (qid: string, ngay: string, dung: boolean): LanLam => ({ qid, ngay, luc: `${ngay}T03:00:00Z`, dung, coGoiY: false })
/** Bộ câu dựng tay: mỗi câu (qid, phần, mức, dạng, nguồn, cd) + lịch sử ⇒ trạng thái bằng `phatLaiCau` với hạn của nó. */
class Bo {
  cau: CauSrs[] = []
  tt = new Map<string, TrangThaiCau>()
  them(qid: string, o: { phan?: CauSrs['phan']; mucDo?: string; dang?: string; nguon?: CauSrs['nguon']; cd?: string; lich?: LanLam[]; hanNop?: string | null; vao?: 'cau' | 'ngoai' } = {}): CauSrs {
    const c: CauSrs = { qid, phan: o.phan ?? 'I', mucDo: o.mucDo ?? 'TH', dang: o.dang ?? 'D1', ...(o.nguon ? { nguon: o.nguon } : {}), ...(o.cd ? { cd: o.cd } : {}) }
    if (o.vao !== 'ngoai') this.cau.push(c)
    this.tt.set(qid, phatLaiCau(qid, o.lich ?? [], o.hanNop ?? null, [], { phan: c.phan, mucDo: c.mucDo }))
    return c
  }
  /** `n` câu mới chiến dịch `cd` (hạn `hanNop`), tiền tố `tien`. */
  moi(tien: string, n: number, cd: string | undefined, hanNop: string, o: { dang?: (i: number) => string; phan?: CauSrs['phan'] } = {}): CauSrs[] {
    return Array.from({ length: n }, (_, i) => this.them(`${tien}${i}`, { nguon: 'chien_dich', cd, hanNop, dang: o.dang?.(i) ?? 'D1', phan: o.phan ?? 'I', mucDo: ['NB', 'TH', 'VD'][i % 3] }))
  }
  /** `n` câu nợ tới lịch hôm nay (sai hôm qua). */
  no(tien: string, n: number, o: { cd?: string; hanNop?: string | null; nguon?: CauSrs['nguon']; dang?: string; phan?: CauSrs['phan'] } = {}): CauSrs[] {
    return Array.from({ length: n }, (_, i) => this.them(`${tien}${i}`, { nguon: o.nguon ?? 'chien_dich', cd: o.cd, hanNop: o.hanNop ?? null, dang: o.dang, phan: o.phan, lich: [lan(`${tien}${i}`, congNgay(HOM_NAY, -1), false)] }))
  }
  /** `n` câu ôn duy trì tới lịch (thành thạo từ lâu). */
  duyTri(tien: string, n: number): CauSrs[] {
    return Array.from({ length: n }, (_, i) => this.them(`${tien}${i}`, { nguon: 'duy_tri', hanNop: congNgay(HOM_NAY, -40), lich: [lan(`${tien}${i}`, congNgay(HOM_NAY, -45), true), lan(`${tien}${i}`, congNgay(HOM_NAY, -42), true)] }))
  }
}
const tatCa = (kh: { dao: string[]; doan: string[] }) => [...kh.dao, ...kh.doan]
const dem = (ds: readonly string[], tien: string) => ds.filter((q) => q.startsWith(tien)).length

describe('dangVung — câu mới của dạng đã vững KHÔNG bắt buộc', () => {
  it('bỏ khỏi câu mới, quota và khối lượng; nợ cùng dạng vẫn vào kế hoạch', () => {
    const b = new Bo()
    b.moi('a', 20, undefined, han(7), { dang: () => 'A' })
    b.moi('b', 20, undefined, han(7), { dang: () => 'B' })
    b.no('n', 3, { hanNop: han(7), dang: 'A' })
    const tc: TuyChonKeHoach = { homNay: HOM_NAY, hanNop: han(7), tranNgay: 40, raiDeu: true }
    const goc = lapKeHoachNgay(b.cau, b.tt, tc)
    expect(dem(tatCa(goc), 'a') + dem(tatCa(goc), 'b')).toBe(quotaCauMoi(40, 7)) // 10
    const vung = lapKeHoachNgay(b.cau, b.tt, { ...tc, dangVung: ['A'] })
    expect(dem(tatCa(vung), 'a')).toBe(0)
    expect(dem(tatCa(vung), 'b')).toBe(quotaCauMoi(20, 7)) // 5: quota tính trên câu mới CÒN bắt buộc
    expect(dem(tatCa(vung), 'n')).toBe(3) // câu ôn/nợ không miễn
    expect(vung.khoiLuong).toBe(goc.khoiLuong - 40)
  })
  it('dạng vững không có trong chiến dịch ⇒ y hệt khi vắng', () => {
    const b = new Bo()
    b.moi('m', 30, undefined, han(6))
    b.no('n', 8, { hanNop: han(6) })
    const tc: TuyChonKeHoach = { homNay: HOM_NAY, hanNop: han(6), tranNgay: 40, raiDeu: true }
    expect(lapKeHoachNgay(b.cau, b.tt, { ...tc, dangVung: ['KHAC'] })).toEqual(lapKeHoachNgay(b.cau, b.tt, tc))
    expect(lapKeHoachNgay(b.cau, b.tt, { ...tc, dangVung: [] })).toEqual(lapKeHoachNgay(b.cau, b.tt, tc))
  })
})

describe('trongSoCau — đổi THỨ TỰ câu mới trong quota, KHÔNG đổi số câu mới/ngày', () => {
  const dung = () => {
    const b = new Bo()
    b.moi('m', 60, undefined, han(8), { dang: (i) => `D${i % 4}` })
    b.no('n', 6, { hanNop: han(8) })
    return b
  }
  it('cùng số câu mới; chọn đúng các câu trọng số cao nhất (hoà theo băm ngày)', () => {
    const b = dung()
    const tc: TuyChonKeHoach = { homNay: HOM_NAY, hanNop: han(8), tranNgay: 40, raiDeu: true }
    const goc = lapKeHoachNgay(b.cau, b.tt, tc)
    // trọng số: câu m40..m59 cao nhất (giảm dần theo chỉ số), còn lại 0
    const trongSoCau = Object.fromEntries(b.cau.filter((c) => c.qid.startsWith('m')).map((c) => [c.qid, Number(c.qid.slice(1)) >= 40 ? Number(c.qid.slice(1)) : 0]))
    const ts = lapKeHoachNgay(b.cau, b.tt, { ...tc, trongSoCau })
    const soMoi = (kh: typeof goc) => dem(tatCa(kh), 'm')
    expect(soMoi(ts)).toBe(soMoi(goc))
    expect(soMoi(ts)).toBe(quotaCauMoi(60, 8)) // 12
    const chon = tatCa(ts).filter((q) => q.startsWith('m')).map((q) => Number(q.slice(1))).sort((x, y) => y - x)
    expect(chon).toEqual(Array.from({ length: 12 }, (_, i) => 59 - i))
    expect(tatCa(ts).filter((q) => q.startsWith('m')).sort()).not.toEqual(tatCa(goc).filter((q) => q.startsWith('m')).sort())
    expect(dem(tatCa(ts), 'n')).toBe(dem(tatCa(goc), 'n'))
  })
  it('thay cả bốc cá nhân (hạng theo dạng): số câu mới vẫn theo quota', () => {
    const b = dung()
    const tc: TuyChonKeHoach = { homNay: HOM_NAY, hanNop: han(8), tranNgay: 40, raiDeu: false, hangTheoDang: { D0: 'L4', D1: 'L1', D2: 'L3', D3: 'L2' }, hangChung: 'L3' }
    const trongSoCau = Object.fromEntries(b.cau.map((c) => [c.qid, (Number(c.qid.slice(1)) * 7) % 13]))
    const goc = lapKeHoachNgay(b.cau, b.tt, tc), ts = lapKeHoachNgay(b.cau, b.tt, { ...tc, trongSoCau })
    expect(dem(tatCa(ts), 'm')).toBe(dem(tatCa(goc), 'm'))
    expect(tatCa(ts).length).toBe(tatCa(goc).length)
  })
  it('nhiều ngày (em làm đúng hết): số câu mới mỗi ngày không đổi khi có trọng số', () => {
    const chay = (coTs: boolean) => {
      const lich = new Map<string, LanLam[]>()
      const soMoiNgay: number[] = []
      for (let d = 0; d < 8; d++) {
        const ngay = congNgay('2026-10-01', d)
        const cau: CauSrs[] = [], tt = new Map<string, TrangThaiCau>()
        for (let i = 0; i < 60; i++) {
          const q = `m${i}`
          cau.push({ qid: q, phan: 'I', mucDo: ['NB', 'TH', 'VD'][i % 3]!, dang: `D${i % 4}`, nguon: 'chien_dich' })
          tt.set(q, phatLaiCau(q, lich.get(q) ?? [], '2026-10-08', [], { phan: 'I', mucDo: ['NB', 'TH', 'VD'][i % 3]! }))
        }
        const kh = lapKeHoachNgay(cau, tt, { homNay: ngay, hanNop: '2026-10-08', tranNgay: 40, raiDeu: true, ...(coTs ? { trongSoCau: Object.fromEntries(cau.map((c, i) => [c.qid, (i * 37) % 11])) } : {}) })
        soMoiNgay.push(tatCa(kh).filter((q) => tt.get(q)!.laMoi).length)
        for (const q of tatCa(kh)) lich.set(q, [...(lich.get(q) ?? []), lan(q, ngay, true)])
      }
      return soMoiNgay
    }
    expect(chay(true)).toEqual(chay(false))
    expect(chay(false).slice(0, 5).reduce((s, x) => s + x, 0)).toBe(60)
  })
})

describe('chienDich — nhiều bài song song', () => {
  it('quota câu mới RIÊNG từng bài theo D của nó; thể lực = max thể lực; D báo = bài hạn gần nhất', () => {
    const b = new Bo()
    b.moi('x', 40, 'CD1', han(7)) // quota ceil(40/4) = 10
    b.moi('y', 60, 'CD2', han(10)) // quota ceil(60/7) = 9
    const kh = lapKeHoachNgay(b.cau, b.tt, { homNay: HOM_NAY, hanNop: han(7), chienDich: [{ id: 'CD2', hanNop: han(10), theLucNgay: 30, raiDeu: true }, { id: 'CD1', hanNop: han(7), theLucNgay: 40, raiDeu: true }] })
    expect(kh.moiTheoCd).toEqual({ CD1: 10, CD2: 9 })
    expect(dem(tatCa(kh), 'x')).toBe(10)
    expect(dem(tatCa(kh), 'y')).toBe(9)
    expect(kh.D).toBe(7)
    expect(kh.tran).toBe(40)
    expect(kh.sucChua).toBe((7 + 10) * 40)
    expect(kh.huyetChien).toBe(false)
  })
  it('EDF: chật chỗ ⇒ bài hạn gần lấy câu mới trước; bài kia nhận phần còn lại', () => {
    const b = new Bo()
    b.moi('x', 80, 'CD1', han(7)) // quota 20
    b.moi('y', 100, 'CD2', han(8)) // quota 20
    b.no('n', 20, { cd: 'CD1', hanNop: han(7) })
    const kh = lapKeHoachNgay(b.cau, b.tt, { homNay: HOM_NAY, hanNop: han(7), tranHuyetChien: 40, chienDich: [{ id: 'CD1', hanNop: han(7), theLucNgay: 40, raiDeu: true }, { id: 'CD2', hanNop: han(8), theLucNgay: 40, raiDeu: true }] })
    expect(dem(tatCa(kh), 'n')).toBe(20) // nợ ≤ 50 %
    expect(kh.moiTheoCd).toEqual({ CD1: 20, CD2: 0 })
    expect(tatCa(kh)).toHaveLength(40)
  })
  it('rải đều theo cờ RIÊNG: bài tắt rải đều lấp lượt dư bằng câu mới của nó, bài bật dừng đúng quota', () => {
    const b = new Bo()
    b.moi('x', 40, 'CD1', han(7))
    b.moi('y', 60, 'CD2', han(10))
    const kh = lapKeHoachNgay(b.cau, b.tt, { homNay: HOM_NAY, hanNop: han(7), chienDich: [{ id: 'CD1', hanNop: han(7), theLucNgay: 40, raiDeu: true }, { id: 'CD2', hanNop: han(10), theLucNgay: 40, raiDeu: false }] })
    expect(kh.moiTheoCd).toEqual({ CD1: 10, CD2: 30 })
    expect(tatCa(kh)).toHaveLength(40)
  })
  it('Huyết Chiến theo TỔNG: Σ khối lượng > 0,9 × Σ D_c × thể lực ⇒ trần 2 × thể lực', () => {
    const b = new Bo()
    b.moi('x', 70, 'CD1', han(4)) // 140 lượt
    b.moi('y', 160, 'CD2', han(5)) // 320 lượt; Σ 460 > 0,9 × 9 × 40 = 324
    const kh = lapKeHoachNgay(b.cau, b.tt, { homNay: HOM_NAY, hanNop: han(4), chienDich: [{ id: 'CD1', hanNop: han(4), theLucNgay: 40, raiDeu: true }, { id: 'CD2', hanNop: han(5), theLucNgay: 40, raiDeu: true }] })
    expect(kh.huyetChien).toBe(true)
    expect(kh.tran).toBe(80)
    expect(tatCa(kh).length).toBeLessThanOrEqual(80)
  })
  it('Huyết Chiến khi MỘT bài tự vượt ngưỡng của nó dù tổng chưa vượt; trần theo tranHuyetChien nếu có', () => {
    const b = new Bo()
    b.moi('x', 70, 'CD1', han(4)) // 140 > 0,9 × 4 × 40 = 144? không — 140 < 144
    b.no('xn', 10, { cd: 'CD1', hanNop: han(4) }) // + 20 lượt ⇒ 160 > 144
    b.moi('y', 10, 'CD2', han(14)) // 20 lượt; Σ 180 < 0,9 × 18 × 40 = 648
    const tc: TuyChonKeHoach = { homNay: HOM_NAY, hanNop: han(4), chienDich: [{ id: 'CD1', hanNop: han(4), theLucNgay: 40, raiDeu: true }, { id: 'CD2', hanNop: han(14), theLucNgay: 40, raiDeu: true }] }
    expect(lapKeHoachNgay(b.cau, b.tt, tc).huyetChien).toBe(true)
    expect(lapKeHoachNgay(b.cau, b.tt, { ...tc, tranHuyetChien: 40 }).tran).toBe(40) // chiến dịch tắt Huyết Chiến ⇒ trần không nâng
    // chỉ bài 2 (không bài 1) ⇒ không Huyết Chiến
    const chiCd2 = lapKeHoachNgay(b.cau.filter((c) => c.cd === 'CD2'), b.tt, { homNay: HOM_NAY, hanNop: han(14), chienDich: [tc.chienDich![1]!] })
    expect(chiCd2.huyetChien).toBe(false)
  })
  it('ngày giao câu mới CUỐI của một bài (D = 4): câu mới giữ chỗ trước nợ ⇒ mọi câu mới gặp trước hạn − 3', () => {
    const b = new Bo()
    b.moi('x', 30, 'CD1', han(4))
    b.no('n', 30, { cd: 'CD1', hanNop: han(4) })
    const kh = lapKeHoachNgay(b.cau, b.tt, { homNay: HOM_NAY, hanNop: han(4), tranHuyetChien: 40, chienDich: [{ id: 'CD1', hanNop: han(4), theLucNgay: 40, raiDeu: true }] })
    expect(kh.huyetChien).toBe(false)
    expect(dem(tatCa(kh), 'x')).toBe(30)
    expect(dem(tatCa(kh), 'n')).toBe(10)
    // đường cũ (một hanNop) giữ luật nợ trước 50 % như trước OMNI 3
    const cu = lapKeHoachNgay(b.cau, b.tt, { homNay: HOM_NAY, hanNop: han(4), tranNgay: 40, tranHuyetChien: 40, raiDeu: true })
    expect(dem(tatCa(cu), 'x')).toBe(20)
  })
  it('câu mới bắt buộc vượt thể lực ⇒ Huyết Chiến (trần 2 ×)', () => {
    const b = new Bo()
    b.moi('x', 50, 'CD1', han(4))
    const kh = lapKeHoachNgay(b.cau, b.tt, { homNay: HOM_NAY, hanNop: han(4), chienDich: [{ id: 'CD1', hanNop: han(4), theLucNgay: 40, raiDeu: true }] })
    expect(kh.huyetChien).toBe(true)
    expect(dem(tatCa(kh), 'x')).toBe(50)
  })
  it('bỏ chiến dịch quá hạn / chưa tới ngày bắt đầu; câu không có cd tính vào bài hạn gần nhất; mảng rỗng = không chiến dịch', () => {
    const b = new Bo()
    b.moi('x', 12, 'CD1', han(7))
    b.moi('z', 8, undefined, han(7))
    b.moi('q', 10, 'CDQ', congNgay(HOM_NAY, -1))
    b.moi('s', 10, 'CDS', han(9))
    const kh = lapKeHoachNgay(b.cau, b.tt, { homNay: HOM_NAY, hanNop: han(7), chienDich: [
      { id: 'CD1', hanNop: han(7), theLucNgay: 40, raiDeu: true },
      { id: 'CDQ', hanNop: congNgay(HOM_NAY, -1), theLucNgay: 40, raiDeu: true },
      { id: 'CDS', hanNop: han(9), theLucNgay: 40, raiDeu: true, batDau: congNgay(HOM_NAY, 1) },
    ] })
    expect(Object.keys(kh.moiTheoCd!)).toEqual(['CD1'])
    expect(kh.moiTheoCd!.CD1).toBe(quotaCauMoi(12 + 8 + 10 + 10, 7)) // mọi câu chiến dịch lạc ⇒ bài hạn gần nhất
    const rong = lapKeHoachNgay(b.cau, b.tt, { homNay: HOM_NAY, hanNop: null, chienDich: [] })
    expect(tatCa(rong)).toEqual([])
    expect(rong.D).toBe(1)
  })
  it('moiDaLamTheoCd: lập lại giữa ngày trừ đúng phần câu mới đã làm của từng bài', () => {
    const b = new Bo()
    b.moi('x', 36, 'CD1', han(7)) // còn 36, đã làm 4 hôm nay ⇒ quota ceil(40/4) − 4 = 6
    b.moi('y', 60, 'CD2', han(10)) // đã làm 0 ⇒ quota 9
    const kh = lapKeHoachNgay(b.cau, b.tt, { homNay: HOM_NAY, hanNop: han(7), moiDaLamTheoCd: { CD1: 4 }, chienDich: [{ id: 'CD1', hanNop: han(7), theLucNgay: 40, raiDeu: true }, { id: 'CD2', hanNop: han(10), theLucNgay: 40, raiDeu: true }] }, 4)
    expect(kh.moiTheoCd).toEqual({ CD1: 6, CD2: 9 })
  })
})

describe('onBaiCu — ôn bài cũ lấp lượt dư', () => {
  const dung = () => {
    const b = new Bo()
    b.moi('m', 40, 'CD1', han(7)) // quota 10
    b.no('n', 4, { cd: 'CD1', hanNop: han(7) })
    const on: CauSrs[] = []
    for (let i = 0; i < 30; i++) on.push(b.them(`o${i}`, { nguon: 'on_bai_cu', vao: 'ngoai', phan: i % 5 === 4 ? 'II' : 'I', lich: i < 10 ? [lan(`o${i}`, congNgay(HOM_NAY, -8), true)] : [] }))
    return { b, on }
  }
  const chienDich = [{ id: 'CD1', hanNop: han(7), theLucNgay: 40, raiDeu: true }]
  it('sau nợ + mới + củng cố + duy trì, tối đa floor(trần × tỉ lệ); trả danh sách onBaiCu', () => {
    const { b, on } = dung()
    const kh = lapKeHoachNgay(b.cau, b.tt, { homNay: HOM_NAY, hanNop: han(7), chienDich, onBaiCu: on })
    expect(dem(tatCa(kh), 'm')).toBe(10)
    expect(dem(tatCa(kh), 'n')).toBe(4)
    expect(kh.onBaiCu).toHaveLength(Math.floor(40 * THAM_SO_OMNI.ON_BAI_CU_TI_LE)) // 8
    expect(dem(tatCa(kh), 'o')).toBe(8)
    const kh4 = lapKeHoachNgay(b.cau, b.tt, { homNay: HOM_NAY, hanNop: han(7), chienDich, onBaiCu: on, tiLeOnBaiCu: 0.4 })
    expect(kh4.onBaiCu).toHaveLength(16)
    // không đổi phần còn lại của kế hoạch
    expect(tatCa(kh4).filter((q) => !q.startsWith('o')).sort()).toEqual(tatCa(kh).filter((q) => !q.startsWith('o')).sort())
  })
  it('không chiếm chỗ của câu mới/nợ: ngày đầy thì không có ôn bài cũ', () => {
    const { b, on } = dung()
    b.no('k', 40, { cd: 'CD1', hanNop: han(7) }) // nợ dồi dào ⇒ 50 % nợ + 10 mới + lượt dư cho nợ
    const kh = lapKeHoachNgay(b.cau, b.tt, { homNay: HOM_NAY, hanNop: han(7), chienDich, onBaiCu: on })
    expect(tatCa(kh)).toHaveLength(40)
    expect(kh.onBaiCu).toEqual([])
  })
  it('câu chưa gặp ⇒ Đảo; câu đã gặp ⇒ như câu ôn (Phần II Đảo, còn lại Đoàn); onVaoDao ⇒ tất cả Đảo', () => {
    const { b, on } = dung()
    const kh = lapKeHoachNgay(b.cau, b.tt, { homNay: HOM_NAY, hanNop: han(7), chienDich, onBaiCu: on, tiLeOnBaiCu: 1 })
    for (const q of kh.onBaiCu!) {
      const t = b.tt.get(q)!, c = on.find((x) => x.qid === q)!
      if (t.laMoi || c.phan === 'II') expect(kh.dao).toContain(q)
      else expect(kh.doan).toContain(q)
    }
    expect(kh.onBaiCu!.some((q) => kh.doan.includes(q))).toBe(true)
    const dao = lapKeHoachNgay(b.cau, b.tt, { homNay: HOM_NAY, hanNop: han(7), chienDich, onBaiCu: on, tiLeOnBaiCu: 1, onVaoDao: true })
    expect(dao.doan).toEqual([])
    expect(dao.onBaiCu!.every((q) => dao.dao.includes(q))).toBe(true)
  })
  it('thứ tự: trọng số giảm dần (hoà giữ thứ tự truyền vào); không trọng số ⇒ thứ tự truyền vào', () => {
    const { b, on } = dung()
    const kh = lapKeHoachNgay(b.cau, b.tt, { homNay: HOM_NAY, hanNop: han(7), chienDich, onBaiCu: on })
    // o4, o9: Phần II đúng ngay lần đầu ⇒ đã thành thạo ⇒ không còn là ứng viên
    expect(b.tt.get('o4')!.thanhThao).toBe(true)
    expect(kh.onBaiCu).toEqual(['o0', 'o1', 'o2', 'o3', 'o5', 'o6', 'o7', 'o8'])
    const trongSoCau = { o29: 5, o28: 5, o3: 2 }
    const ts = lapKeHoachNgay(b.cau, b.tt, { homNay: HOM_NAY, hanNop: han(7), chienDich, onBaiCu: on, trongSoCau })
    expect(ts.onBaiCu).toEqual(['o28', 'o29', 'o3', 'o0', 'o1', 'o2', 'o5', 'o6'])
  })
  it('bỏ ứng viên đã thành thạo / cắt tỉa / trùng câu trong phạm vi chính', () => {
    const b = new Bo()
    b.moi('m', 4, 'CD1', han(7))
    const tt = b.tt
    const on: CauSrs[] = [
      b.them('t0', { vao: 'ngoai', lich: [lan('t0', congNgay(HOM_NAY, -9), true), lan('t0', congNgay(HOM_NAY, -6), true)] }), // thành thạo
      b.them('x0', { vao: 'ngoai', lich: [0, 1, 2, 3].map((k) => lan('x0', congNgay(HOM_NAY, -8 + k), false)) }), // cắt tỉa
      { qid: 'm0', phan: 'I', mucDo: 'NB', dang: 'D1' }, // trùng câu chiến dịch
      b.them('ok', { vao: 'ngoai' }),
    ]
    expect(tt.get('t0')!.thanhThao).toBe(true)
    expect(tt.get('x0')!.catTia).toBe(true)
    const kh = lapKeHoachNgay(b.cau, b.tt, { homNay: HOM_NAY, hanNop: han(7), chienDich, onBaiCu: on, tiLeOnBaiCu: 1 })
    expect(kh.onBaiCu).toEqual(['ok'])
  })
})

describe('cheDoCho — chế độ chờ bài mới', () => {
  const dung = (soNo: number, soDuyTri: number, soOn: number) => {
    const b = new Bo()
    b.no('n', soNo, { nguon: 'no_cu' })
    b.duyTri('u', soDuyTri)
    const on = Array.from({ length: soOn }, (_, i) => b.them(`o${i}`, { nguon: 'on_bai_cu', vao: 'ngoai' }))
    return { b, on }
  }
  const tc = (on: CauSrs[]): TuyChonKeHoach => ({ homNay: HOM_NAY, hanNop: null, tranNgay: 40, chienDich: [], onBaiCu: on, cheDoCho: { theLuc: theLucCho(40) } })
  it('trần 24; nợ → duy trì ≤ 50 % → ôn bài cũ lấp phần còn lại', () => {
    const { b, on } = dung(5, 30, 50)
    const kh = lapKeHoachNgay(b.cau, b.tt, tc(on))
    expect(kh.tran).toBe(24)
    expect(kh.huyetChien).toBe(false)
    expect(dem(tatCa(kh), 'n')).toBe(5)
    expect(dem(tatCa(kh), 'u')).toBe(12)
    expect(dem(tatCa(kh), 'o')).toBe(7)
    expect(tatCa(kh)).toHaveLength(24)
  })
  it('nợ nhiều ⇒ nợ chiếm hết trần (không chiến dịch: nợ tới 100 %)', () => {
    const { b, on } = dung(30, 10, 10)
    const kh = lapKeHoachNgay(b.cau, b.tt, tc(on))
    expect(dem(tatCa(kh), 'n')).toBe(24)
    expect(kh.onBaiCu).toEqual([])
  })
  it('không nợ, không duy trì ⇒ vẫn có ôn bài cũ; ít ứng viên ⇒ kế hoạch ngắn hơn 12 là bình thường', () => {
    const a = dung(0, 0, 40)
    expect(tatCa(lapKeHoachNgay(a.b.cau, a.b.tt, tc(a.on)))).toHaveLength(24)
    const c = dung(0, 0, 4)
    const kh = lapKeHoachNgay(c.b.cau, c.b.tt, tc(c.on))
    expect(kh.onBaiCu).toHaveLength(4)
    expect(tatCa(kh)).toHaveLength(4)
  })
  it('sàn 12: thể lực lớp nhỏ', () => {
    expect(theLucCho(10)).toBe(12)
    const { b, on } = dung(0, 0, 40)
    expect(tatCa(lapKeHoachNgay(b.cau, b.tt, { ...tc(on), cheDoCho: { theLuc: theLucCho(10) } }))).toHaveLength(12)
  })
  it('có chiến dịch đang chạy ⇒ bỏ qua chế độ chờ', () => {
    const b = new Bo()
    b.moi('m', 20, 'CD1', han(7))
    const coCho = lapKeHoachNgay(b.cau, b.tt, { homNay: HOM_NAY, hanNop: han(7), chienDich: [{ id: 'CD1', hanNop: han(7), theLucNgay: 40, raiDeu: true }], cheDoCho: { theLuc: 24 } })
    const khongCho = lapKeHoachNgay(b.cau, b.tt, { homNay: HOM_NAY, hanNop: han(7), chienDich: [{ id: 'CD1', hanNop: han(7), theLucNgay: 40, raiDeu: true }] })
    expect(coCho).toEqual(khongCho)
    expect(coCho.tran).toBe(40)
  })
})
