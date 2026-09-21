// XEM ĐIỂM BẢN 2 · GV-1 — số của khối "Báo cáo cả lớp" (lib/bao-cao-ca-lop.ts). THUẦN TÍNH TOÁN từ điểm/bảng chấm đã có ở máy thầy.
// Luật soi ở đây: không bịa số (thiếu dữ liệu ⇒ null/rỗng), lý do "em cần để ý" bằng SỐ, "Nhiều em chọn" chỉ nêu đáp án + số em.
import { describe, expect, it } from 'vitest'
import { chuGiay, KHOANG_DIEM, NGUONG_DIEM_THAP, NGUONG_ROI_MAN, tinhBaoCaoCaLop, tomTatCaLop, type EmChoBaoCao } from '../src/lib/bao-cao-ca-lop'
import type { ChiTietCauRow } from '../src/lib/exam-api'
import type { ScoreResult } from '../src/engine/score'

const items = (dung: number, tong: number) => Array.from({ length: tong }, (_, i) => ({ correct: i < dung })) as never[]
/** Bảng điểm rút gọn: phanTuDiem chỉ đọc số câu đúng/tổng, điểm từng phần và trần điểm. */
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

const cau = (qid: string, phan: 'I' | 'II' | 'III', soCau: number, chuyenDe: string, dapAnChon: string, dapAnDung: string): ChiTietCauRow => ({
  phan,
  soCau,
  qid,
  chuyenDe,
  mucDo: 'nb',
  dapAnChon,
  dapAnDung,
  dungSai: dapAnChon === '' ? false : dapAnChon === dapAnDung,
  giay: 20,
})

const em = (sbd: string, diem: number | null, o: Partial<EmChoBaoCao> = {}): EmChoBaoCao => ({
  sbd,
  hoTen: `Em ${sbd}`,
  lop: '12 - Tinh Hoa',
  trangThai: 'da_nop',
  diem,
  score: null,
  soLanRoiMan: 0,
  tongGiayRoiMan: 0,
  rows: null,
  ...o,
})

describe('GV-1 · tổng quan cả lớp', () => {
  it('chỉ đếm bài ĐÃ NỘP/khoá có điểm; trung bình, cao nhất, thấp nhất, số em chưa nộp', () => {
    const r = tinhBaoCaoCaLop([em('1', 8), em('2', 6), em('3', 4), em('4', null), em('5', 9, { trangThai: 'dang_lam' }), em('6', 2, { trangThai: 'khoa' })], 8)
    expect(r.nop).toBe(4)
    expect(r.tb).toBeCloseTo(5, 5)
    expect(r.cao).toBe(8)
    expect(r.thap).toBe(2)
    expect(r.daVao).toBe(8)
    expect(r.chuaNop).toBe(4)
  })

  it('chưa ai nộp ⇒ mọi số là null (không hiện "0"), phổ điểm toàn 0', () => {
    const r = tinhBaoCaoCaLop([em('1', null, { trangThai: 'dang_lam' })], 1)
    expect(r.nop).toBe(0)
    expect(r.tb).toBeNull()
    expect(r.cao).toBeNull()
    expect(r.thap).toBeNull()
    expect(r.phutTB).toBeNull()
    expect(r.pho.every((b) => b.soEm === 0)).toBe(true)
    expect(r.emCanYY).toEqual([])
  })

  it('số em chưa nộp không âm khi số "đã vào" đếm ít hơn số bài nộp', () => {
    expect(tinhBaoCaoCaLop([em('1', 5), em('2', 6)], 1).chuaNop).toBe(0)
  })

  it('thời gian làm trung bình từ mốc vào–nộp; thiếu mốc hoặc nộp trước vào ⇒ bỏ em đó, không đoán', () => {
    const r = tinhBaoCaoCaLop(
      [
        em('1', 5, { vaoLuc: '2026-09-21T08:00:00Z', nopLuc: '2026-09-21T08:30:00Z' }),
        em('2', 6, { vaoLuc: '2026-09-21T08:00:00Z', nopLuc: '2026-09-21T08:41:00Z' }),
        em('3', 7, { vaoLuc: '2026-09-21T08:00:00Z', nopLuc: '2026-09-21T07:00:00Z' }),
        em('4', 8),
      ],
      4,
    )
    expect(r.phutTB).toBe(36) // (30 + 41) / 2 = 35,5 ⇒ làm tròn lên
    expect(tinhBaoCaoCaLop([em('1', 5)], 1).phutTB).toBeNull()
    // mốc là số mili-giây (máy chủ có lúc trả số)
    expect(tinhBaoCaoCaLop([em('1', 5, { vaoLuc: 1_000_000, nopLuc: 1_000_000 + 20 * 60000 })], 1).phutTB).toBe(20)
  })
})

describe('GV-1 · phần RẺ cho dòng gập (tomTatCaLop)', () => {
  it('đếm đúng bài đã nộp/khoá có điểm và điểm trung bình; luôn khớp với phần nặng', () => {
    const ds = [em('1', 8), em('2', 6), em('3', 4), em('4', null), em('5', 9, { trangThai: 'dang_lam' }), em('6', 2, { trangThai: 'khoa' })]
    const r = tomTatCaLop(ds)
    expect(r.nop).toBe(4)
    expect(r.tb).toBeCloseTo(5, 5)
    const day = tinhBaoCaoCaLop(ds, 8)
    expect(r).toEqual({ nop: day.nop, tb: day.tb })
  })
  it('chưa ai nộp ⇒ nop 0 và tb null (không "0" giả)', () => {
    expect(tomTatCaLop([em('1', null, { trangThai: 'dang_lam' })])).toEqual({ nop: 0, tb: null })
    expect(tomTatCaLop([])).toEqual({ nop: 0, tb: null })
  })
  it('không cần bảng chấm từng câu: chạy được với chỉ trạng thái + điểm', () => {
    expect(tomTatCaLop([{ trangThai: 'da_nop', diem: 7 }, { trangThai: 'da_nop', diem: 5 }])).toEqual({ nop: 2, tb: 6 })
  })
})

describe('GV-1 · phổ điểm', () => {
  it('mỗi điểm rơi đúng một khoảng; 10 điểm thuộc khoảng cuối; tổng các cột = số em nộp', () => {
    const ds = [0, 1.99, 2, 3.5, 4, 5, 5.99, 6, 7, 8, 9, 10]
    const r = tinhBaoCaoCaLop(ds.map((d, i) => em(String(i), d)), ds.length)
    const theoNhan = Object.fromEntries(r.pho.map((b) => [b.nhan, b.soEm]))
    expect(theoNhan).toEqual({ '0–2': 2, '2–4': 2, '4–5': 1, '5–6': 2, '6–7': 1, '7–8': 1, '8–9': 1, '9–10': 2 })
    expect(r.pho.reduce((s, b) => s + b.soEm, 0)).toBe(ds.length)
    expect(r.pho.map((b) => b.nhan)).toEqual(KHOANG_DIEM.map((k) => k[2]))
  })
})

describe('GV-1 · ba phần của bài', () => {
  it('trung bình điểm + câu đúng từng phần của những em có bảng điểm; em không có bảng điểm không kéo số về 0', () => {
    const a = em('1', 7, { score: score([6, 8], [1, 2], [1, 2], [3, 2, 2]) })
    const b = em('2', 5, { score: score([4, 8], [0, 2], [1, 2], [2, 0, 3]) })
    const c = em('3', 6) // không có bảng điểm chấm tại máy
    const r = tinhBaoCaoCaLop([a, b, c], 3)
    expect(r.baPhan.map((p) => p.ma)).toEqual(['I', 'II', 'III'])
    const p1 = r.baPhan[0]
    expect(p1.diemTB).toBeCloseTo(2.5, 5)
    expect(p1.dungTB).toBeCloseTo(5, 5)
    expect(p1.tong).toBe(8)
    expect(p1.toiDa).toBe(4)
    expect(r.baPhan[1].diemTB).toBeCloseTo(1, 5)
    expect(r.baPhan[2].dungTB).toBeCloseTo(1, 5)
  })

  it('không em nào có bảng điểm ⇒ danh sách rỗng (màn ẩn khối)', () => {
    expect(tinhBaoCaoCaLop([em('1', 7)], 1).baPhan).toEqual([])
  })
})

describe('GV-1 · dạng cả lớp vấp + câu sai nhiều nhất', () => {
  const bang = (sbd: string, chon: string[]): ChiTietCauRow[] => [
    cau('q1', 'I', 1, 'CD:Este', chon[0], 'A'),
    cau('q2', 'I', 2, 'CD:Este', chon[1], 'B'),
    cau('q3', 'I', 3, 'CD:Glucozơ', chon[2], 'C'),
  ]

  it('dạng xếp tỉ lệ đúng thấp trước; đếm số em sai ít nhất một câu; bỏ tiền tố "CD:"', () => {
    const ds = [em('1', 5, { rows: bang('1', ['A', 'B', 'C']) }), em('2', 5, { rows: bang('2', ['D', 'D', 'C']) }), em('3', 5, { rows: bang('3', ['A', 'D', 'D']) })]
    const r = tinhBaoCaoCaLop(ds, 3)
    expect(r.coBangCham).toBe(true)
    const este = r.dang.find((d) => d.ten === 'Este')!
    expect(este).toMatchObject({ tiLeDung: 50, soEmSai: 2, soEmLam: 3 })
    expect(r.dang.map((d) => d.ten)).toEqual(['Este', 'Glucozơ']) // Este đúng 50% đứng trước Glucozơ đúng 67%
    expect(r.dang[1]).toMatchObject({ tiLeDung: 67, soEmSai: 1 })
    expect(r.dang.every((d) => !d.ten.startsWith('CD:'))).toBe(true)
  })

  it('dạng chỉ nêu khi có ít nhất 3 lượt câu; tối đa 5 dạng', () => {
    const nhieu = Array.from({ length: 8 }, (_, i) => [cau(`a${i}`, 'I', 1, `CD:Dạng ${i}`, 'X', 'A'), cau(`b${i}`, 'I', 2, `CD:Dạng ${i}`, 'X', 'A'), cau(`c${i}`, 'I', 3, `CD:Dạng ${i}`, 'A', 'A')]).flat()
    const r = tinhBaoCaoCaLop([em('1', 5, { rows: nhieu })], 1)
    expect(r.dang).toHaveLength(5)
    const hai = tinhBaoCaoCaLop([em('1', 5, { rows: [cau('a', 'I', 1, 'CD:Este', 'X', 'A'), cau('b', 'I', 2, 'CD:Este', 'X', 'A')] })], 1)
    expect(hai.dang).toEqual([])
  })

  it('câu sai nhiều nhất: xếp theo tỉ lệ sai, tối đa 3, chỉ câu có ≥ 2 em làm; "Nhiều em chọn" = đáp án sai đông nhất + số em, không lý do', () => {
    const rows = (ch: string): ChiTietCauRow[] => [cau('q1', 'I', 1, 'CD:Este', ch, 'A')]
    const ds = [em('1', 5, { rows: rows('B') }), em('2', 5, { rows: rows('B') }), em('3', 5, { rows: rows('C') }), em('4', 5, { rows: rows('A') })]
    const r = tinhBaoCaoCaLop(ds, 4)
    expect(r.cauSai).toHaveLength(1)
    expect(r.cauSai[0]).toMatchObject({ qid: 'q1', soSai: 3, soLam: 4, tiLeSai: 75, dapAnDung: 'A', dapAnSaiNhieu: { dapAn: 'B', soEm: 2 } })
    expect(Object.keys(r.cauSai[0].dapAnSaiNhieu ?? {}).sort()).toEqual(['dapAn', 'soEm'])
    // câu cả lớp đều đúng không lọt danh sách; có ≥ 2 em làm mà không ai sai
    const dungHet = (ch: string): ChiTietCauRow[] => [cau('q1', 'I', 1, 'CD:Este', ch, 'A'), cau('q9', 'I', 9, 'CD:Este', 'A', 'A')]
    expect(tinhBaoCaoCaLop([em('1', 5, { rows: dungHet('B') }), em('2', 5, { rows: dungHet('C') })], 2).cauSai.map((c) => c.qid)).toEqual(['q1'])
    // chỉ 1 em làm ⇒ không nêu
    expect(tinhBaoCaoCaLop([em('1', 5, { rows: rows('B') })], 1).cauSai).toEqual([])
  })

  it('em sai vì BỎ TRỐNG ("" hoặc "-") ⇒ không có đáp án sai đông nhất (null), vẫn tính là sai', () => {
    const rows = (ch: string): ChiTietCauRow[] => [{ ...cau('q1', 'I', 1, 'CD:Este', ch, 'A'), dungSai: false }]
    const r = tinhBaoCaoCaLop([em('1', 5, { rows: rows('') }), em('2', 5, { rows: rows('-') })], 2)
    expect(r.cauSai[0]).toMatchObject({ soSai: 2, dapAnSaiNhieu: null })
  })

  it('dòng chưa chấm (dungSai null) bị bỏ qua; không có bảng chấm ⇒ dạng/câu rỗng và coBangCham=false', () => {
    const r = tinhBaoCaoCaLop([em('1', 5, { rows: [{ ...cau('q1', 'I', 1, 'CD:Este', 'B', 'A'), dungSai: null }] })], 1)
    expect(r.dang).toEqual([])
    expect(r.cauSai).toEqual([])
    const khong = tinhBaoCaoCaLop([em('1', 5)], 1)
    expect(khong.coBangCham).toBe(false)
    expect(khong.dang).toEqual([])
    expect(khong.cauSai).toEqual([])
  })

  it('cauSai xếp: tỉ lệ sai giảm dần, hoà thì nhiều em sai hơn, hoà nữa thì số câu nhỏ trước; tối đa 3', () => {
    const mk = (qid: string, soCau: number, chon: string): ChiTietCauRow => cau(qid, 'I', soCau, 'CD:Este', chon, 'A')
    const ds = [
      em('1', 5, { rows: [mk('c4', 4, 'B'), mk('c1', 1, 'B'), mk('c2', 2, 'B'), mk('c3', 3, 'B')] }),
      em('2', 5, { rows: [mk('c4', 4, 'A'), mk('c1', 1, 'B'), mk('c2', 2, 'B'), mk('c3', 3, 'A')] }),
    ]
    const r = tinhBaoCaoCaLop(ds, 2)
    expect(r.cauSai.map((c) => c.qid)).toEqual(['c1', 'c2', 'c3'])
  })
})

describe('GV-1 · bảng chấm thiếu hoặc lạ', () => {
  it('bảng chấm rỗng ([]) coi như không có', () => {
    expect(tinhBaoCaoCaLop([em('1', 5, { rows: [] })], 1).coBangCham).toBe(false)
  })

  it('tên dạng bỏ "CD:" và khoảng trắng đầu/cuối; câu không có chuyên đề vẫn tính ở "câu sai" nhưng không thành một dạng', () => {
    const rows = [cau('a', 'I', 1, 'CD: Este ', 'A', 'A'), cau('b', 'I', 2, 'CD:Este', 'X', 'A'), cau('c', 'I', 3, 'CD:Este', 'X', 'A'), cau('d', 'I', 0, '', 'X', 'A')]
    const r = tinhBaoCaoCaLop([em('1', 5, { rows }), em('2', 5, { rows }), em('3', 5, { rows })], 3)
    expect(r.dang).toHaveLength(1)
    expect(r.dang[0]).toMatchObject({ ten: 'Este', tiLeDung: 33 }) // 3 đúng / 9 lượt: viết "CD: Este " cũng gộp về "Este"
    expect(r.cauSai.some((c) => c.qid === 'd')).toBe(true)
  })

  it('dòng chưa chấm (dungSai null) không thành lượt câu, kể cả khi nhiều em cùng có', () => {
    const rows = [{ ...cau('q1', 'I', 1, 'CD:Este', 'B', 'A'), dungSai: null }]
    const r = tinhBaoCaoCaLop([em('1', 5, { rows }), em('2', 5, { rows }), em('3', 5, { rows })], 3)
    expect(r.cauSai).toEqual([])
    expect(r.dang).toEqual([])
  })

  it('"số em làm" của dạng là số em CÓ bảng chấm, không phải mọi em đã nộp', () => {
    const rows = [cau('a', 'I', 1, 'CD:Este', 'X', 'A'), cau('b', 'I', 2, 'CD:Este', 'X', 'A'), cau('c', 'I', 3, 'CD:Este', 'A', 'A')]
    const r = tinhBaoCaoCaLop([em('1', 5, { rows }), em('2', 5, { rows }), em('3', 5)], 3)
    expect(r.dang[0]).toMatchObject({ soEmLam: 2, soEmSai: 2 })
  })

  it('câu sai hoà tỉ lệ thì câu nhiều em sai hơn đứng trước', () => {
    const mk = (qid: string, soCau: number, chon: string): ChiTietCauRow => cau(qid, 'I', soCau, 'CD:Este', chon, 'A')
    // c1: 1/2 sai (50%); c2: 2/4 sai (50%) ⇒ c2 đứng trước dù số câu lớn hơn
    const ds = [
      em('1', 5, { rows: [mk('c1', 1, 'B'), mk('c2', 2, 'B')] }),
      em('2', 5, { rows: [mk('c1', 1, 'A'), mk('c2', 2, 'B')] }),
      em('3', 5, { rows: [mk('c2', 2, 'A')] }),
      em('4', 5, { rows: [mk('c2', 2, 'A')] }),
    ]
    expect(tinhBaoCaoCaLop(ds, 4).cauSai.map((c) => c.qid)).toEqual(['c2', 'c1'])
  })
})

describe('GV-1 · em cần thầy để ý (lý do bằng số, mốc cố định)', () => {
  it('điểm dưới mốc ⇒ nêu "Đúng a/b câu (p%) — điểm x" khi có bảng điểm; không có thì nêu điểm + mốc', () => {
    const r = tinhBaoCaoCaLop([em('1', 3.25, { score: score([1, 8], [0, 2], [1, 2], [1, 1, 1]) }), em('2', 4.5), em('3', NGUONG_DIEM_THAP)], 3)
    expect(r.emCanYY.map((e) => e.sbd)).toEqual(['1', '2'])
    expect(r.emCanYY[0].lyDo).toEqual(['Đúng 2/12 câu (17%) — điểm 3,25'])
    expect(r.emCanYY[1].lyDo).toEqual([`Điểm 4,5, dưới ${NGUONG_DIEM_THAP}`])
  })

  it('bảng điểm không có câu nào (0/0) ⇒ không chia cho 0: nêu điểm + mốc', () => {
    const r = tinhBaoCaoCaLop([em('1', 3, { score: score([0, 0], [0, 0], [0, 0], [0, 0, 0]) })], 1)
    expect(r.emCanYY[0].lyDo).toEqual([`Điểm 3, dưới ${NGUONG_DIEM_THAP}`])
  })

  it('rời màn từ mốc trở lên ⇒ nêu số lần + tổng thời gian; em vừa điểm thấp vừa rời màn gộp MỘT dòng hai lý do', () => {
    const r = tinhBaoCaoCaLop([em('1', 3, { soLanRoiMan: NGUONG_ROI_MAN, tongGiayRoiMan: 130 }), em('2', 8, { soLanRoiMan: NGUONG_ROI_MAN - 1 }), em('3', 8, { soLanRoiMan: 7, tongGiayRoiMan: 600 })], 3)
    expect(r.emCanYY.map((e) => e.sbd)).toEqual(['1', '3'])
    expect(r.emCanYY[0].lyDo).toHaveLength(2)
    expect(r.emCanYY[0].lyDo[1]).toBe(`Rời màn làm bài ${NGUONG_ROI_MAN} lần, tổng 2 phút 10 giây`)
    expect(r.emCanYY[1].lyDo).toEqual(['Rời màn làm bài 7 lần, tổng 10 phút'])
  })

  it('em rời màn nhưng đang làm dở (chưa nộp) vẫn được nêu; tối đa 5 em; mọi lý do có chữ số', () => {
    const nhieu = Array.from({ length: 9 }, (_, i) => em(String(i), 8, { trangThai: 'dang_lam', soLanRoiMan: 4 + i }))
    const r = tinhBaoCaoCaLop(nhieu, 9)
    expect(r.emCanYY).toHaveLength(5)
    expect(r.emCanYY[0].sbd).toBe('8') // rời màn nhiều nhất đứng đầu
    expect(r.emCanYY.every((e) => e.lyDo.every((l) => /\d/.test(l)))).toBe(true)
  })

  it('không nhãn suy diễn: chữ lý do không chứa "yếu", "lười", "gian lận", "nghi"', () => {
    const r = tinhBaoCaoCaLop([em('1', 2, { soLanRoiMan: 9, tongGiayRoiMan: 300 })], 1)
    expect(r.emCanYY[0].lyDo.join(' ')).not.toMatch(/yếu|lười|gian lận|nghi|kém/i)
  })
})

describe('GV-1 · chữ thời gian', () => {
  it('giây ⇒ "x giây" / "x phút" / "x phút yy giây"', () => {
    expect(chuGiay(45)).toBe('45 giây')
    expect(chuGiay(60)).toBe('1 phút')
    expect(chuGiay(130)).toBe('2 phút 10 giây')
    expect(chuGiay(125)).toBe('2 phút 05 giây')
    expect(chuGiay(-5)).toBe('0 giây')
  })
})
