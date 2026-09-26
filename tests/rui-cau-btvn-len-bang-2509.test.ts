// RÚT CÂU BTVN LÊN BẢNG (thầy chốt 25/09/2026) — khoá LÕI THUẦN `rui-cau-btvn-len-bang.ts`.
//
// Bốn điều phải luôn đúng, mỗi điều một nhóm test:
//   1. THỨ TỰ ƯU TIÊN: cả lớp sai nhiều nhất → sai ít dần → khó ít em làm được → cốt tủy → còn lại.
//   2. PHỦ HẾT: mọi câu vào buổi đúng MỘT lần (chữa ∨ đọc đáp án ∨ bỏ qua); câu SAI không chữa được thì BÁO.
//   3. SÀN 80 %: số câu CHỮA ≥ 80 % số câu LỌC RA, và tổng giây chữa ≤ ngân sách.
//   4. PHÂN LƯỢT: mọi em có mặt ≥ 1 lượt khi đủ câu; lượt phát CÂN BẰNG (chênh ≤ 1); seed cho ra ĐÚNG một bảng.
import { describe, expect, it } from 'vitest'
import {
  bangChuRuiCau,
  phanBoLuotEm,
  ruiCauLenBang,
  tangUuTien,
  xenKeNgauNhien,
  xepUuTienCau,
  RUI_CAU_BTVN,
  type CauVaoRui,
  type CauXep,
  type ChamEm,
} from '../src/lib/rui-cau-btvn-len-bang'
import { CAU_HINH_LEN_BANG_MAC_DINH } from '../src/lib/len-bang-cau-hinh'

/** Câu không kèm `noiDung` ⇒ giây = 300/180/120 theo sao (thầy chốt), nên test đo được số chính xác. */
const cau = (qid: string, o: Partial<CauVaoRui> = {}): CauVaoRui => ({
  qid,
  dang: `D-${qid}`,
  chuyenDe: 'CD1',
  phan: 'I',
  sao: 0,
  loi: false,
  soEmLam: 0,
  soEmSai: 0,
  soEmDung: 0,
  ...o,
})
const em = (n: number, tienTo = 'E') => Array.from({ length: n }, (_, i) => ({ sbd: `${tienTo}${i + 1}`, hoTen: `Em ${i + 1}` }))
/** Giây một câu khi KHÔNG có `noiDung` — đúng bảng thầy chốt trong `len-bang-cau-hinh.ts`. */
const giayTheoSao = (sao: 0 | 1 | 2) => CAU_HINH_LEN_BANG_MAC_DINH.GIAY_LEN_BANG_THEO_SAO[sao]
/** 60 câu 2 sao, MỌI em đều sai (số sai giảm dần theo i) ⇒ thứ tự ưu tiên đúng Q0…Q59, dễ đo. */
const ds60 = () => Array.from({ length: 60 }, (_, i) => cau(`Q${i}`, { sao: 2, soEmLam: 60, soEmSai: 60 - i, soEmDung: i }))

describe('thứ tự ưu tiên (thầy: "sai nhiều nhất, rồi sai nhiều tiếp theo … sau đó câu khó … câu cốt tủy")', () => {
  it('sai nhiều nhất → sai ít dần → khó ít em làm được → cốt tủy → còn lại', () => {
    const ds = [
      cau('COT_TUY', { soEmLam: 10, soEmDung: 9, loi: true }), // cốt tủy (không ai sai)
      cau('CON_LAI', { soEmLam: 10, soEmDung: 9 }), // còn lại
      cau('SAI_1', { soEmLam: 10, soEmSai: 1, soEmDung: 9 }),
      cau('SAI_9', { soEmLam: 24, soEmSai: 9, soEmDung: 15 }),
      cau('SAI_4', { soEmLam: 20, soEmSai: 4, soEmDung: 16 }),
      cau('KHO', { soEmLam: 10, soEmDung: 1 }), // khó: 1/10 đúng < ngưỡng
    ]
    expect(xepUuTienCau(ds).map((c) => c.qid)).toEqual(['SAI_9', 'SAI_4', 'SAI_1', 'KHO', 'COT_TUY', 'CON_LAI'])
  })

  it('tầng ưu tiên đúng định nghĩa; câu chưa ai làm (soEmLam 0) cũng là "khó ít em làm được"', () => {
    expect(tangUuTien(cau('a', { soEmLam: 5, soEmSai: 1, soEmDung: 4 }))).toBe(0)
    expect(tangUuTien(cau('b', { soEmLam: 0 }))).toBe(1)
    expect(tangUuTien(cau('c', { soEmLam: 10, soEmDung: 1 }))).toBe(1)
    expect(tangUuTien(cau('d', { soEmLam: 10, soEmDung: 9, loi: true }))).toBe(2)
    expect(tangUuTien(cau('e', { soEmLam: 10, soEmDung: 9 }))).toBe(3)
  })

  it('tất định: gọi hai lần ra đúng một thứ tự', () => {
    const ds = [cau('x', { soEmLam: 4, soEmSai: 2 }), cau('y', { soEmLam: 4, soEmSai: 2 }), cau('z', { soEmLam: 4, soEmSai: 2 })]
    expect(xepUuTienCau(ds).map((c) => c.qid)).toEqual(xepUuTienCau(ds).map((c) => c.qid))
  })
})

describe('rút câu: phủ hết + trần ngân sách + SÀN 80 %', () => {
  it('ngân sách đủ ⇒ MỌI câu vào đúng một lần, không câu nào rơi vào `boQua`', () => {
    const ds = Array.from({ length: 30 }, (_, i) => cau(`Q${i}`, { soEmLam: 20, soEmSai: 3 + i, soEmDung: 17 - i }))
    const kq = ruiCauLenBang(ds)
    const tatCa = [...kq.chua, ...kq.docDapAn, ...kq.boQua].map((c) => c.qid)
    expect(tatCa).toHaveLength(30)
    expect(new Set(tatCa).size).toBe(30)
    expect(kq.boQua).toHaveLength(0)
    expect(kq.tiLeChua).toBe(1)
    expect(kq.dat80).toBe(true)
    expect(kq.tongGiay).toBeLessThanOrEqual(kq.nganSach)
  })

  it('ngân sách hẹp (60 câu 2 sao ⇒ chỉ 16 câu vừa 4.920 s) ⇒ chữa 16 · đọc đáp án 4 · bỏ 40, vẫn ĐẠT 80 %', () => {
    const kq = ruiCauLenBang(ds60())
    expect(giayTheoSao(2)).toBe(300)
    expect(kq.chua).toHaveLength(16) // 16 × 300 = 4.800 ≤ 4.920; 17 × 300 = 5.100 > 4.920
    expect(kq.nganSach).toBe(90 * 60 - (180 + 300))
    expect(kq.soCauLocRa).toBe(20) // floor(16 / 0,8)
    expect(kq.docDapAn).toHaveLength(4)
    expect(kq.boQua).toHaveLength(40)
    expect(kq.tiLeChua).toBeCloseTo(0.8, 10)
    expect(kq.dat80).toBe(true)
    expect(kq.tongGiay).toBe(16 * 300)
  })

  it('câu cả lớp SAI không chữa kịp ⇒ BÁO đúng số phút cần thêm + tên câu (KHÔNG im lặng bỏ)', () => {
    const kq = ruiCauLenBang(ds60())
    expect(kq.thieuGiay).toBe(44 * 300) // 60 − 16 = 44 câu sai chưa chữa
    const loi = kq.canhBao.find((c) => c.includes('câu cả lớp SAI chưa chữa được'))
    expect(loi).toBeTruthy()
    expect(loi).toContain('cần thêm 220 phút')
    expect(loi).toContain('Phần I câu Q16')
  })

  it('vượt trần 60 câu/buổi ⇒ cắt và ĐẾM (`cauBiCat`), không im lặng', () => {
    const ds = Array.from({ length: 70 }, (_, i) => cau(`Q${i}`, { soEmLam: 10, soEmSai: 1 }))
    const kq = ruiCauLenBang(ds)
    expect(kq.cauBiCat).toBe(10)
    expect(kq.canhBao.some((c) => c.includes('vượt trần 60 câu'))).toBe(true)
    expect(kq.chua.length + kq.docDapAn.length + kq.boQua.length).toBe(RUI_CAU_BTVN.SO_CAU_TOI_DA)
  })

  it('kho rỗng ⇒ nói thật; câu RẤT dài bị KẸP giây theo trần Engine, không bịa số vô hạn', () => {
    expect(ruiCauLenBang([]).canhBao.some((c) => c.includes('Không có câu nào để rút'))).toBe(true)
    const cauDai: CauVaoRui = cau('D', { sao: 2, noiDung: { soTu: 4000, coHinh: true, soBuoc: 6 } })
    const kq = ruiCauLenBang([cauDai])
    expect(kq.chua).toHaveLength(1)
    expect(kq.chua[0]!.giay).toBeGreaterThan(0)
    expect(kq.chua[0]!.giay).toBeLessThanOrEqual(480) // TOI_DA_GIAY của `len-bang-cau-hinh.ts`
  })

  it('giây nhóm CHỮA không bao giờ vượt ngân sách, kể cả khi có câu đắt', () => {
    const ds = Array.from({ length: 40 }, (_, i) => cau(`Q${i}`, { sao: (i % 3) as 0 | 1 | 2, soEmLam: 10, soEmSai: 1 + (i % 5) }))
    const kq = ruiCauLenBang(ds)
    expect(kq.tongGiay).toBeLessThanOrEqual(kq.nganSach)
    expect(kq.chua.every((c) => c.giay > 0)).toBe(true)
  })
})


describe('phân bổ lượt em (thầy: "có em nhiều lượt, có em 1 lượt, ngẫu nhiên phù hợp")', () => {
  const q = (n: number) => Array.from({ length: n }, (_, i) => ruiCauLenBang([cau(`Q${i}`, { soEmLam: 10, soEmSai: 1 })]).chua[0]!)

  it('đủ câu ⇒ MỌI em có mặt được ≥ 1 lượt TRƯỚC khi ai được lượt thứ hai', () => {
    const pb = phanBoLuotEm(q(6), em(4))
    expect(pb.emKhongLuot).toEqual([])
    expect(pb.soEmCoLuot).toBe(4)
    expect(pb.soEmNhieuLuot).toBe(2) // 6 câu / 4 em ⇒ 2 em 2 lượt, 2 em 1 lượt
    expect([...pb.soLuot.values()].sort()).toEqual([1, 1, 2, 2])
  })

  it('thiếu câu ⇒ em không có lượt được NÊU TÊN, không bịa thêm em', () => {
    const pb = phanBoLuotEm(q(2), em(5))
    expect(pb.soEmCoLuot).toBe(2)
    expect(pb.emKhongLuot).toHaveLength(3)
    expect(pb.canhBao.some((c) => c.includes('chưa được gọi lượt nào'))).toBe(true)
  })

  it('lượt phát CÂN BẰNG: 10 câu / 4 em ⇒ chênh lệch số lượt ≤ 1', () => {
    const pb = phanBoLuotEm(q(10), em(4))
    const so = [...pb.soLuot.values()].sort((a, b) => a - b)
    expect(so[so.length - 1]! - so[0]!).toBeLessThanOrEqual(1)
    expect(so.reduce((a, b) => a + b, 0)).toBe(10)
  })

  it('dùng ĐÚNG hồ sơ cá nhân (`cham`): em hợp nhất được câu', () => {
    const chac: ChamEm = (sbd) => ({ diem: sbd === 'E2' ? 0.9 : 0.1, viSao: sbd === 'E2' ? 'sai câu này · yếu CD1' : '' })
    const pb = phanBoLuotEm(q(1), em(3), chac)
    expect(pb.luot[0]!.sbd).toBe('E2')
    expect(pb.luot[0]!.viSao).toContain('yếu CD1')
    expect(pb.luot[0]!.luotCuaEm).toBe(1)
  })

  it('chặn cứng (`chan`) được TÔN TRỌNG: em bị chặn không nhận câu', () => {
    const chac: ChamEm = (sbd) => (sbd === 'E1' ? { diem: 1, chan: true } : { diem: 0 })
    expect(phanBoLuotEm(q(1), em(2), chac).luot[0]!.sbd).toBe('E2')
  })

  it('MỌI em bị chặn ⇒ vẫn gọi một em và BÁO (không bỏ câu)', () => {
    const pb = phanBoLuotEm(q(1), em(2), () => ({ diem: 1, chan: true }))
    expect(pb.luot).toHaveLength(1)
    expect(pb.canhBao.some((c) => c.includes('mọi em đều bị chặn bậc'))).toBe(true)
  })

  it('SEED tất định: cùng đầu vào ⇒ đúng một bảng (thầy mở lại y nguyên)', () => {
    const a = phanBoLuotEm(q(9), em(5), undefined, 'buoi-toan-25-09')
    const b = phanBoLuotEm(q(9), em(5), undefined, 'buoi-toan-25-09')
    expect(a.luot.map((x) => `${x.cau.qid}→${x.sbd}`)).toEqual(b.luot.map((x) => `${x.cau.qid}→${x.sbd}`))
  })

  it('không có em nào ⇒ nói thật, không ném', () => {
    const pb = phanBoLuotEm(q(3), [])
    expect(pb.luot).toEqual([])
    expect(pb.canhBao.some((c) => c.includes('Chưa có em nào'))).toBe(true)
  })
})

describe('bảng chữ cho thầy', () => {
  it('có nhóm gọi lên bảng, nhóm đọc đáp án, và cảnh báo', () => {
    const kq = ruiCauLenBang(ds60())
    const pb = phanBoLuotEm(kq.chua, em(10))
    const chu = bangChuRuiCau(kq, pb, 'Toán 25/09')
    expect(chu).toContain('Rút câu BTVN lên bảng · Toán 25/09')
    expect(chu).toContain('GỌI LÊN BẢNG')
    expect(chu).toContain('CHỈ ĐỌC ĐÁP ÁN')
    expect(chu).toContain('⚠')
  })

describe('ĐAN XEN LUÂN PHIÊN 3 nhóm (sai · khó · cốt tủy)', () => {
  /** Câu đã xếp — chỉ cần `nguon` + `qid` cho việc đan xen. */
  const x = (qid: string, nguon: CauXep['nguon']): CauXep => ({
    qid, dang: '', phan: 'I', sao: 0, loi: nguon === 'cot_tuy', soEmLam: 10, soEmSai: 0, soEmDung: 10, giay: 120, lyDo: '', nguon,
  })
  const ds: CauXep[] = [
    x('S1', 'sai_nhieu'), x('S2', 'sai_nhieu'), x('S3', 'sai_nhieu'),
    x('K1', 'kho_it_lam_duoc'), x('K2', 'kho_it_lam_duoc'),
    x('C1', 'cot_tuy'),
    x('L1', 'con_lai'), x('L2', 'con_lai'),
  ]

  it('vòng đầu lấy MỘT câu từ MỖI nhóm; "còn lại" luôn nằm CUỐI', () => {
    const ra = xenKeNgauNhien(ds)
    expect(new Set(ra.slice(0, 3).map((c) => c.nguon)).size).toBe(3)
    expect(ra.slice(-2).map((c) => c.nguon)).toEqual(['con_lai', 'con_lai'])
  })

  it('giữ nguyên thứ tự TRONG mỗi nhóm (S1→S2→S3, K1→K2)', () => {
    const ra = xenKeNgauNhien(ds)
    const chua = ra.filter((c) => c.nguon !== 'con_lai').map((c) => c.qid)
    expect(chua.filter((q) => q.startsWith('S'))).toEqual(['S1', 'S2', 'S3'])
    expect(chua.filter((q) => q.startsWith('K'))).toEqual(['K1', 'K2'])
  })

  it('không mất câu nào + TẤT ĐỊNH (gọi hai lần ra y nhau)', () => {
    expect(xenKeNgauNhien(ds).map((c) => c.qid).sort()).toEqual(ds.map((c) => c.qid).sort())
    expect(xenKeNgauNhien(ds).map((c) => c.qid)).toEqual(xenKeNgauNhien(ds).map((c) => c.qid))
  })

  it('thiếu nhóm thì vẫn chạy (chỉ một nhóm ⇒ giữ nguyên thứ tự)', () => {
    const chiSai = [x('S1', 'sai_nhieu'), x('S2', 'sai_nhieu')]
    expect(xenKeNgauNhien(chiSai).map((c) => c.qid)).toEqual(['S1', 'S2'])
  })
})

})

