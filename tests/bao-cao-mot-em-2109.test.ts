// XEM ĐIỂM BẢN 2 · GV-2 — số của trang "Báo cáo một em" (lib/bao-cao-mot-em.ts). THUẦN TÍNH TOÁN từ điểm/bảng chấm đã có ở máy thầy.
// Luật soi: thiếu dữ liệu ⇒ null/rỗng (không bịa số); đếm câu theo luật chung demKetQua; hạng chỉ có khi ≥ 2 em nộp; không suy diễn "vì sao".
import { describe, expect, it } from 'vitest'
import { GIAY_LAU_TOI_THIEU, ketQuaCau, nguonCauTuNganHang, NGUONG_CAN_ON, tinhBaoCaoMotEm } from '../src/lib/bao-cao-mot-em'
import type { EmChoBaoCao } from '../src/lib/bao-cao-ca-lop'
import type { ChiTietCauRow } from '../src/lib/exam-api'
import type { ScoreResult } from '../src/engine/score'

const items = (dung: number, tong: number) => Array.from({ length: tong }, (_, i) => ({ correct: i < dung })) as never[]
const score = (d: [number, number], d2: [number, number], d3: [number, number], diem: [number, number, number]): ScoreResult =>
  ({
    phanI: { items: items(d[0], d[1]), cents: 0 },
    phanII: { items: items(d2[0], d2[1]), cents: 0 },
    phanIII: { items: items(d3[0], d3[1]), cents: 0 },
    phanIScore: diem[0],
    phanIIScore: diem[1],
    phanIIIScore: diem[2],
    total: diem[0] + diem[1] + diem[2],
    totalCents: 0,
    quota: { I: 400, II: 300, III: 300 },
    remainingFlags: 0,
    crossSumOk: true,
  }) as unknown as ScoreResult

const cau = (qid: string, phan: 'I' | 'II' | 'III', soCau: number, chuyenDe: string, chon: string, dung: string, giay: number | null = 20): ChiTietCauRow => ({
  phan,
  soCau,
  qid,
  chuyenDe,
  mucDo: 'nb',
  dapAnChon: chon,
  dapAnDung: dung,
  dungSai: chon === '' ? false : chon === dung,
  giay,
})
const em = (sbd: string, diem: number | null, o: Partial<EmChoBaoCao> = {}): EmChoBaoCao => ({
  sbd,
  hoTen: `Em ${sbd}`,
  lop: '12A1',
  trangThai: 'da_nop',
  diem,
  score: null,
  soLanRoiMan: 0,
  tongGiayRoiMan: 0,
  rows: null,
  ...o,
})
const KHONG_NGUON = new Map()

describe('GV-2 · nguồn đề + lời giải từ kho', () => {
  it('lấy đề và lời giải theo qid; ưu tiên loiGiai, rồi explanation, không có thì null; không có kho ⇒ rỗng', () => {
    const m = nguonCauTuNganHang({ phanI: [{ id: 'a', text: ' Đề A ', loiGiai: { chot: 'x' } }], phanII: [{ id: 'b', text: 'Đề B', explanation: 'giải B' }], phanIII: [{ id: 'c', text: 'Đề C' }] })
    expect(m.get('a')).toEqual({ de: 'Đề A', loiGiai: { chot: 'x' } })
    expect(m.get('b')).toEqual({ de: 'Đề B', loiGiai: 'giải B' })
    expect(m.get('c')).toEqual({ de: 'Đề C', loiGiai: null })
    expect(nguonCauTuNganHang(null).size).toBe(0)
    // có cả hai thì `loiGiai` (có cấu trúc) thắng `explanation` (chuỗi cũ)
    expect(nguonCauTuNganHang({ phanI: [{ id: 'd', text: 'x', loiGiai: 'mới', explanation: 'cũ' }], phanII: [], phanIII: [] }).get('d')?.loiGiai).toBe('mới')
  })
})

describe('GV-2 · kết quả một câu (tô ô)', () => {
  const r = (phan: 'I' | 'II' | 'III', chon: string, dung: string, dungSai: boolean | null) => ({ phan, dapAnChon: chon, dapAnDung: dung, dungSai })
  it('đúng · sai · bỏ trống (chuỗi rỗng, dấu "-", null) · đúng một phần chỉ ở Phần II theo luật chung', () => {
    expect(ketQuaCau(r('I', 'A', 'A', true))).toBe('dung')
    expect(ketQuaCau(r('I', 'B', 'A', false))).toBe('sai')
    expect(ketQuaCau(r('I', '', 'A', false))).toBe('trong')
    expect(ketQuaCau(r('II', '----', 'DDSS', false))).toBe('trong')
    expect(ketQuaCau(r('III', '-', '3', false))).toBe('trong')
    expect(ketQuaCau(r('I', 'B', 'A', null))).toBe('trong')
    expect(ketQuaCau(r('II', 'DSSS', 'DDSS', false))).toBe('mot_phan') // 3/4 ý
    expect(ketQuaCau(r('II', 'SSDD', 'DDSS', false))).toBe('sai') // 0/4 ý
    expect(ketQuaCau(r('I', 'DSSS', 'DDSS', false))).toBe('sai') // chỉ Phần II mới có "một phần"
  })
})

describe('GV-2 · kết quả tổng + đếm câu', () => {
  it('chưa nộp / chưa có điểm ⇒ daNop=false, tong=null, mọi khối rỗng', () => {
    const r = tinhBaoCaoMotEm(em('1', null, { trangThai: 'dang_lam' }), [], KHONG_NGUON)
    expect(r).toMatchObject({ daNop: false, tong: null, dung: null, tongCau: null, phan: [], dang: [], cauXemLai: [], soVoiLop: null, coBangCham: false })
  })

  it('có bảng chấm ⇒ đếm bằng demKetQua (đúng trọn / một phần); tổng câu là số dòng bảng chấm', () => {
    const rows = [cau('a', 'I', 1, 'CD:X', 'A', 'A'), cau('b', 'I', 2, 'CD:X', 'B', 'A'), cau('c', 'II', 1, 'CD:Y', 'DSSS', 'DDSS'), cau('d', 'III', 1, 'CD:Y', '3', '3')]
    const r = tinhBaoCaoMotEm(em('1', 5, { rows }), [], KHONG_NGUON)
    expect(r).toMatchObject({ daNop: true, tong: 5, dung: 2, tongCau: 4, motPhan: 1, coBangCham: true })
  })

  it('không có bảng chấm nhưng có bảng điểm ⇒ lấy tổng theo bảng điểm; không có gì ⇒ null (không "0/0")', () => {
    const a = tinhBaoCaoMotEm(em('1', 5, { score: score([6, 8], [1, 2], [1, 2], [3, 1, 1]) }), [], KHONG_NGUON)
    expect(a).toMatchObject({ dung: 8, tongCau: 12, coBangCham: false, motPhan: 0 })
    expect(a.phan.map((p) => p.cau.length)).toEqual([0, 0, 0])
    const b = tinhBaoCaoMotEm(em('1', 5), [], KHONG_NGUON)
    expect(b).toMatchObject({ dung: null, tongCau: null, phan: [] })
  })

  it('thời gian làm từ mốc vào–nộp; thiếu mốc ⇒ null', () => {
    const a = tinhBaoCaoMotEm(em('1', 5, { vaoLuc: '2026-09-21T08:00:00Z', nopLuc: '2026-09-21T08:32:10Z' }), [], KHONG_NGUON)
    expect(a.chuThoiGian).toBe('32 phút 10 giây')
    expect(tinhBaoCaoMotEm(em('1', 5), [], KHONG_NGUON).chuThoiGian).toBeNull()
  })
})

describe('GV-2 · ba phần: ô từng câu', () => {
  it('mỗi phần có các ô xếp theo số câu, kèm kết quả; phần không có câu nào thì không có phần', () => {
    const rows = [cau('b', 'I', 2, 'CD:X', 'B', 'A'), cau('a', 'I', 1, 'CD:X', 'A', 'A'), cau('c', 'II', 1, 'CD:Y', 'DSSS', 'DDSS')]
    const r = tinhBaoCaoMotEm(em('1', 5, { rows, score: score([1, 2], [0, 1], [0, 0], [1, 0, 0]) }), [], KHONG_NGUON)
    expect(r.phan.map((p) => p.ma)).toEqual(['I', 'II'])
    expect(r.phan[0].cau).toEqual([{ soCau: 1, kq: 'dung' }, { soCau: 2, kq: 'sai' }])
    expect(r.phan[1].cau).toEqual([{ soCau: 1, kq: 'mot_phan' }])
  })
})

describe('GV-2 · theo dạng bài', () => {
  it('đúng/tổng của CHÍNH em; dưới 60% là "cần ôn thêm"; dạng vấp xếp trên; bỏ "CD:"; câu không dạng bị bỏ', () => {
    const rows = [
      cau('a', 'I', 1, 'CD:Este', 'A', 'A'),
      cau('b', 'I', 2, 'CD:Este', 'A', 'A'),
      cau('c', 'I', 3, 'CD:Glycerol', 'B', 'A'),
      cau('d', 'I', 4, 'CD:Glycerol', 'B', 'A'),
      cau('e', 'I', 5, 'CD:Glycerol', 'A', 'A'),
      cau('f', 'I', 6, 'CD:Lipid', 'A', 'A'),
      cau('g', 'I', 7, '', 'B', 'A'),
    ]
    const r = tinhBaoCaoMotEm(em('1', 5, { rows }), [], KHONG_NGUON)
    expect(r.dang).toEqual([
      { ten: 'Glycerol', dung: 1, tong: 3, canOn: true },
      { ten: 'Este', dung: 2, tong: 2, canOn: false },
      { ten: 'Lipid', dung: 1, tong: 1, canOn: false },
    ])
    // đúng ở mốc: 3/5 = 60% không phải "cần ôn thêm"
    const moc = [...Array.from({ length: 3 }, (_, i) => cau(`m${i}`, 'I', i + 1, 'CD:M', 'A', 'A')), ...Array.from({ length: 2 }, (_, i) => cau(`n${i}`, 'I', i + 4, 'CD:M', 'B', 'A'))]
    expect(tinhBaoCaoMotEm(em('1', 5, { rows: moc }), [], KHONG_NGUON).dang[0]).toMatchObject({ dung: 3, tong: 5, canOn: 3 / 5 < NGUONG_CAN_ON })
    expect(tinhBaoCaoMotEm(em('1', 5, { rows: moc }), [], KHONG_NGUON).dang[0].canOn).toBe(false)
    // 11/20 = 55% (dưới mốc 60%) ⇒ cần ôn; 13/20 = 65% ⇒ không
    const bon = (dung: number) => Array.from({ length: 20 }, (_, i) => cau(`z${i}`, 'I', i + 1, 'CD:Z', i < dung ? 'A' : 'B', 'A'))
    expect(tinhBaoCaoMotEm(em('1', 5, { rows: bon(11) }), [], KHONG_NGUON).dang[0].canOn).toBe(true)
    expect(tinhBaoCaoMotEm(em('1', 5, { rows: bon(13) }), [], KHONG_NGUON).dang[0].canOn).toBe(false)
  })
})

describe('GV-2 · tên dạng', () => {
  it('"CD: Este " và "CD:Este" là MỘT dạng (bỏ tiền tố, cắt khoảng trắng đầu/cuối)', () => {
    const rows = [cau('a', 'I', 1, 'CD: Este ', 'A', 'A'), cau('b', 'I', 2, 'CD:Este', 'B', 'A')]
    expect(tinhBaoCaoMotEm(em('1', 5, { rows }), [], KHONG_NGUON).dang).toEqual([{ ten: 'Este', dung: 1, tong: 2, canOn: true }])
  })
})

describe('GV-2 · trạng thái và bảng chấm rỗng', () => {
  it('em bị KHOÁ mà vẫn có điểm thì có báo cáo; điểm không hữu hạn thì không có điểm', () => {
    expect(tinhBaoCaoMotEm(em('1', 4, { trangThai: 'khoa' }), [], KHONG_NGUON)).toMatchObject({ daNop: true, tong: 4 })
    expect(tinhBaoCaoMotEm(em('1', NaN), [], KHONG_NGUON)).toMatchObject({ daNop: false, tong: null })
  })
  it('bảng chấm rỗng ([]) coi như không có', () => {
    expect(tinhBaoCaoMotEm(em('1', 5, { rows: [] }), [], KHONG_NGUON).coBangCham).toBe(false)
  })
})

describe('GV-2 · câu cần xem lại', () => {
  const nguon = new Map([['s1', { de: 'Đề s1', loiGiai: { chot: 'lời giải' } }]])

  it('mọi câu SAI hoặc bỏ trống, xếp theo phần rồi số câu; kèm đề + lời giải từ kho; không kho ⇒ de/loiGiai null', () => {
    const rows = [cau('s2', 'II', 1, 'CD:Y', 'SSDD', 'DDSS'), cau('s3', 'I', 3, 'CD:X', '', 'A'), cau('s1', 'I', 1, 'CD:X', 'B', 'A'), cau('ok', 'I', 2, 'CD:X', 'A', 'A')]
    const r = tinhBaoCaoMotEm(em('1', 5, { rows }), [], nguon)
    expect(r.cauXemLai.map((c) => [c.qid, c.loai])).toEqual([['s1', 'sai'], ['s3', 'sai'], ['s2', 'sai']])
    expect(r.cauXemLai[0]).toMatchObject({ de: 'Đề s1', loiGiai: { chot: 'lời giải' }, dapAnChon: 'B', dapAnDung: 'A', dang: 'X' })
    expect(r.cauXemLai[1]).toMatchObject({ de: null, loiGiai: null, dapAnChon: '' })
  })

  it('câu ĐÚNG nhưng làm lâu: cần ≥ 5 câu có số giây, giây ≥ 2 × trung vị và ≥ 30 giây; xếp sau câu sai, lâu nhất trước', () => {
    const bao = [
      cau('a', 'I', 1, 'CD:X', 'A', 'A', 20),
      cau('b', 'I', 2, 'CD:X', 'A', 'A', 20),
      cau('c', 'I', 3, 'CD:X', 'A', 'A', 20),
      cau('d', 'I', 4, 'CD:X', 'A', 'A', 60),
      cau('e', 'I', 5, 'CD:X', 'A', 'A', 90),
      cau('f', 'I', 6, 'CD:X', 'B', 'A', 20),
      cau('g', 'I', 7, 'CD:X', 'A', 'A', 35), // dưới 2 × trung vị (40) ⇒ không kể dù ≥ 30 giây
      cau('h', 'I', 8, 'CD:X', 'A', 'A', 40), // ĐÚNG mốc 2 × trung vị ⇒ kể
      cau('i', 'I', 9, 'CD:X', 'A', 'A', 20),
      cau('j', 'I', 10, 'CD:X', 'A', 'A', 20), // (đủ câu 20 giây để trung vị = 20)
    ]
    const r = tinhBaoCaoMotEm(em('1', 5, { rows: bao }), [], KHONG_NGUON)
    expect(r.cauXemLai.map((c) => [c.qid, c.loai])).toEqual([['f', 'sai'], ['e', 'dung_lau'], ['d', 'dung_lau'], ['h', 'dung_lau']])
    // ít hơn 5 câu có số giây ⇒ không kể câu "lâu" (dù một câu 200 giây)
    const it = [cau('a', 'I', 1, 'CD:X', 'A', 'A', 10), cau('b', 'I', 2, 'CD:X', 'A', 'A', 10), cau('c', 'I', 3, 'CD:X', 'A', 'A', 200)]
    expect(tinhBaoCaoMotEm(em('1', 5, { rows: it }), [], KHONG_NGUON).cauXemLai).toEqual([])
    // trung vị nhỏ nhưng dưới 30 giây ⇒ không kể
    const nhanh = [1, 2, 3, 4, 5].map((i) => cau(`q${i}`, 'I', i, 'CD:X', 'A', 'A', i === 5 ? 29 : 5))
    expect(GIAY_LAU_TOI_THIEU).toBe(30)
    expect(tinhBaoCaoMotEm(em('1', 5, { rows: nhanh }), [], KHONG_NGUON).cauXemLai).toEqual([])
  })

  it('tối đa 8 câu; sai được giữ trước câu đúng-lâu', () => {
    const rows = Array.from({ length: 12 }, (_, i) => cau(`q${i}`, 'I', i + 1, 'CD:X', 'B', 'A'))
    expect(tinhBaoCaoMotEm(em('1', 5, { rows }), [], KHONG_NGUON).cauXemLai).toHaveLength(8)
  })

  it('trung bình giây cả lớp chỉ có khi ≥ 3 em đã nộp có số giây ở câu đó', () => {
    const mk = (giay: number) => em('x' + giay, 5, { rows: [cau('s1', 'I', 1, 'CD:X', 'B', 'A', giay)] })
    const chinh = em('1', 5, { rows: [cau('s1', 'I', 1, 'CD:X', 'B', 'A', 100)] })
    const hai = tinhBaoCaoMotEm(chinh, [chinh, mk(20)], nguon)
    expect(hai.cauXemLai[0].tbGiayLop).toBeNull()
    const ba = tinhBaoCaoMotEm(chinh, [chinh, mk(20), mk(30)], nguon)
    expect(ba.cauXemLai[0].tbGiayLop).toBe(50) // (100 + 20 + 30) / 3
    // giây 0 (không đo được) không được góp vào trung bình
    const khong = (n: string) => em(n, 5, { rows: [cau('s1', 'I', 1, 'CD:X', 'B', 'A', 0)] })
    expect(tinhBaoCaoMotEm(chinh, [chinh, khong('a'), khong('b')], nguon).cauXemLai[0].tbGiayLop).toBeNull()
    // em chưa nộp không được góp số giây
    const dang = { ...mk(999), trangThai: 'dang_lam' as const }
    expect(tinhBaoCaoMotEm(chinh, [chinh, mk(20), dang], nguon).cauXemLai[0].tbGiayLop).toBeNull()
  })
})

describe('GV-2 · so với cả lớp (chỉ thầy)', () => {
  it('chỉ mình em nộp ⇒ không so (null); em chưa nộp ⇒ null', () => {
    const e = em('1', 6)
    expect(tinhBaoCaoMotEm(e, [e], KHONG_NGUON).soVoiLop).toBeNull()
    const dang = em('2', null, { trangThai: 'dang_lam' })
    expect(tinhBaoCaoMotEm(dang, [e, dang, em('3', 5)], KHONG_NGUON).soVoiLop).toBeNull()
  })

  it('trung bình cả lớp (gồm em ấy), chênh, hạng = 1 + số em điểm cao hơn (đồng điểm cùng hạng), sĩ số = số em đã nộp', () => {
    const lop = [em('1', 9), em('2', 7), em('3', 7), em('4', 4), em('5', 3, { trangThai: 'dang_lam' })]
    const r = tinhBaoCaoMotEm(lop[1], lop, KHONG_NGUON).soVoiLop!
    expect(r.siSo).toBe(4)
    expect(r.tbLop).toBeCloseTo(6.75, 5)
    expect(r.hieu).toBeCloseTo(0.25, 5)
    expect(r.hang).toBe(2)
    expect(tinhBaoCaoMotEm(lop[2], lop, KHONG_NGUON).soVoiLop!.hang).toBe(2) // đồng điểm cùng hạng
    expect(tinhBaoCaoMotEm(lop[0], lop, KHONG_NGUON).soVoiLop!.hang).toBe(1)
    expect(tinhBaoCaoMotEm(lop[3], lop, KHONG_NGUON).soVoiLop!.hang).toBe(4)
  })

  it('dạng em ấy làm tốt hơn cả lớp: chênh ≥ 20 điểm phần trăm (đúng mốc 20 vẫn kể), xếp theo chênh giảm dần, dạng dưới 2 câu của em không kể, lớp cần ≥ 3 em có bảng chấm, tối đa 3', () => {
    // mỗi dạng 2 câu (a,b); ai đúng ở câu nào do mảng chọn
    const hai = (ten: string, chon: [string, string]) => chon.map((c, i) => cau(`${ten}${i}`, 'I', 1, `CD:${ten}`, c, 'A'))
    const emChinh = em('1', 9, { rows: [...hai('Ester', ['A', 'A']), ...hai('Lipid', ['A', 'A']), ...hai('Glycerol', ['A', 'A']), ...hai('Phòng', ['A', 'A']), ...hai('Amin', ['A', 'A']), ...[cau('solo', 'I', 1, 'CD:Solo', 'A', 'A')]] })
    const ban = (n: string, ester: [string, string], lipid: [string, string], gly: [string, string], phong: [string, string]) =>
      em(n, 5, { rows: [...hai('Ester', ester), ...hai('Lipid', lipid), ...hai('Glycerol', gly), ...hai('Phòng', phong), ...hai('Amin', ['A', 'A']), cau('solo', 'I', 1, 'CD:Solo', 'B', 'A')] })
    // lớp có 3 em (em ấy + 2 bạn), 6 lượt mỗi dạng:
    //  Ester: bạn 0/4 ⇒ lớp 2/6=33,3% ⇒ chênh 66,7 · Lipid: bạn 2/4 ⇒ 4/6=66,7% ⇒ 33,3 · Glycerol: bạn 3/4 ⇒ 5/6=83,3% ⇒ 16,7 (dưới mốc)
    //  Phòng: bạn 4/4 ⇒ 100% ⇒ 0 · Amin: bằng ⇒ 0 · Solo: chỉ 1 câu ⇒ không kể
    const b1 = ban('2', ['B', 'B'], ['A', 'B'], ['A', 'A'], ['A', 'A'])
    const b2 = ban('3', ['B', 'B'], ['A', 'B'], ['A', 'B'], ['A', 'A'])
    const r = tinhBaoCaoMotEm(emChinh, [emChinh, b1, b2], KHONG_NGUON).soVoiLop!
    expect(r.dangTotHon).toEqual(['Ester', 'Lipid']) // xếp chênh giảm dần; Glycerol (16,7) dưới mốc; Solo/Amin/Phòng không kể
    // ít hơn 3 em có bảng chấm ⇒ không so dạng
    expect(tinhBaoCaoMotEm(emChinh, [emChinh, b1], KHONG_NGUON).soVoiLop!.dangTotHon).toEqual([])
    // ĐÚNG mốc 20: em 5/5 = 100%, lớp 12/15 = 80% ⇒ chênh 20 ⇒ vẫn kể
    const nam = (chon: string[]) => chon.map((c, i) => cau(`m${i}`, 'I', i + 1, 'CD:Moc', c, 'A'))
    const chinh = em('1', 9, { rows: nam(['A', 'A', 'A', 'A', 'A']) })
    const lop = [chinh, em('2', 5, { rows: nam(['A', 'A', 'A', 'A', 'B']) }), em('3', 5, { rows: nam(['A', 'A', 'A', 'B', 'B']) })]
    expect(tinhBaoCaoMotEm(chinh, lop, KHONG_NGUON).soVoiLop!.dangTotHon).toEqual(['Moc'])
    // tối đa 3 dạng
    const nhieu = (ten: string) => [cau(`${ten}1`, 'I', 1, `CD:${ten}`, 'A', 'A'), cau(`${ten}2`, 'I', 2, `CD:${ten}`, 'A', 'A')]
    const tenDang = ['D1', 'D2', 'D3', 'D4']
    const chinh4 = em('1', 9, { rows: tenDang.flatMap(nhieu) })
    const sai4 = (n: string) => em(n, 2, { rows: tenDang.flatMap((t) => nhieu(t).map((c) => ({ ...c, dapAnChon: 'B', dungSai: false }))) })
    expect(tinhBaoCaoMotEm(chinh4, [chinh4, sai4('2'), sai4('3')], KHONG_NGUON).soVoiLop!.dangTotHon).toHaveLength(3)
  })

  it('không nhãn suy diễn: chữ trong báo cáo không có "yếu", "giỏi", "lười", "gian lận"', () => {
    const rows = [cau('a', 'I', 1, 'CD:Este', 'B', 'A')]
    const e = em('1', 2, { rows })
    const r = tinhBaoCaoMotEm(e, [e, em('2', 8), em('3', 9)], KHONG_NGUON)
    expect(JSON.stringify(r)).not.toMatch(/yếu|giỏi|lười|gian lận|kém/i)
  })
})
