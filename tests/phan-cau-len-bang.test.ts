// PHÂN CÂU GỌI LÊN BẢNG — đặc tả CA-THI-VA-GOI-LEN-BANG mục 4.4, phép kiểm
// 16–26. Toàn hàm thuần nên kiểm bằng test, không bấm tay, không chụp màn hình.
import { describe, expect, it } from 'vitest'
import {
  bangChu,
  chiDocDapAn,
  diemCau,
  doChum,
  nhacHieuNhamChung,
  phanCauLenBang,
  phanMotLuot,
  tiLeDungLop,
  xepCau,
  HE_SO_SAO,
  type CauTrongCa,
  type EmTrongCa,
} from '../src/lib/phan-cau-len-bang'

const cau = (o: Partial<CauTrongCa> & { qid: string; so: number }): CauTrongCa => ({
  phan: 'I',
  chuyenDe: '',
  sao: 0,
  tomTat: '',
  soEmLam: 20,
  soEmDung: 10,
  dapAnSai: [],
  ...o,
})

const em = (o: Partial<EmTrongCa> & { sbd: string }): EmTrongCa => ({
  hoTen: 'Em ' + o.sbd,
  qidSai: [],
  chuyenDeYeu: [],
  ...o,
})

describe('tỉ lệ đúng và độ chụm', () => {
  it('không em nào làm tới thì tỉ lệ đúng là 0, không phải 1', () => {
    expect(tiLeDungLop({ soEmLam: 0, soEmDung: 0 })).toBe(0)
    expect(tiLeDungLop({ soEmLam: 20, soEmDung: 17 })).toBeCloseTo(0.85)
  })

  it('cả lớp sai cùng một phương án → độ chụm 1; sai mỗi em một kiểu → thấp', () => {
    expect(doChum(['B', 'B', 'B', 'B'])).toBe(1)
    expect(doChum(['B', 'C', 'D', 'B'])).toBe(0.5)
    expect(doChum([])).toBe(0)
    expect(doChum(['', '  '])).toBe(0)
  })

  it('nhắc hiểu nhầm chung chỉ hiện khi thật sự chụm', () => {
    expect(nhacHieuNhamChung(cau({ qid: 'q', so: 1, dapAnSai: Array(12).fill('B') }))).toBe('12 em cùng chọn B — hiểu nhầm chung')
    expect(nhacHieuNhamChung(cau({ qid: 'q', so: 1, dapAnSai: ['B', 'C', 'D', 'A'] }))).toBe('')
  })
})

describe('PHÉP KIỂM 20 — khối chỉ đọc đáp án', () => {
  it('lớp đúng ≥ 0,85 thì chỉ đọc đáp án, dù câu hai sao', () => {
    expect(chiDocDapAn(cau({ qid: 'q', so: 1, sao: 2, soEmLam: 20, soEmDung: 17 }))).toBe(true)
    expect(chiDocDapAn(cau({ qid: 'q', so: 1, sao: 2, soEmLam: 20, soEmDung: 16 }))).toBe(false)
  })

  it('câu KHÔNG SAO mà lớp đúng ≥ 0,70 cũng chỉ đọc đáp án', () => {
    expect(chiDocDapAn(cau({ qid: 'q', so: 1, sao: 0, soEmLam: 20, soEmDung: 14 }))).toBe(true)
    // Cùng tỉ lệ đó nhưng câu có sao thì VẪN phải chữa.
    expect(chiDocDapAn(cau({ qid: 'q', so: 1, sao: 1, soEmLam: 20, soEmDung: 14 }))).toBe(false)
  })

  it('câu chưa em nào làm tới không bị coi là cả lớp đã đúng', () => {
    expect(chiDocDapAn(cau({ qid: 'q', so: 1, sao: 0, soEmLam: 0, soEmDung: 0 }))).toBe(false)
  })
})

describe('PHÉP KIỂM 19 — điểm câu và thứ tự', () => {
  it('sao nặng hơn hẳn hai yếu tố kia cộng lại', () => {
    const haiSaoLopDungHet = cau({ qid: 'a', so: 1, sao: 2, soEmLam: 10, soEmDung: 8 })
    const khongSaoLopSaiHet = cau({ qid: 'b', so: 2, sao: 0, soEmLam: 10, soEmDung: 0, dapAnSai: Array(10).fill('B') })
    expect(diemCau(haiSaoLopDungHet)).toBeGreaterThan(diemCau(khongSaoLopSaiHet))
    expect(HE_SO_SAO).toBe(100)
  })

  it('cùng số sao thì câu lớp sai nhiều hơn xếp trước', () => {
    const a = cau({ qid: 'a', so: 1, sao: 1, soEmLam: 10, soEmDung: 9 })
    const b = cau({ qid: 'b', so: 2, sao: 1, soEmLam: 10, soEmDung: 2 })
    expect(xepCau([a, b]).map((c) => c.qid)).toEqual(['b', 'a'])
  })

  it('cùng số sao, cùng tỉ lệ sai thì câu CHỤM hơn xếp trước', () => {
    const raiRac = cau({ qid: 'a', so: 1, sao: 1, soEmLam: 10, soEmDung: 6, dapAnSai: ['B', 'C', 'D', 'A'] })
    const chum = cau({ qid: 'b', so: 2, sao: 1, soEmLam: 10, soEmDung: 6, dapAnSai: ['B', 'B', 'B', 'B'] })
    expect(xepCau([raiRac, chum]).map((c) => c.qid)).toEqual(['b', 'a'])
  })

  it('câu hai sao luôn đứng trước câu một sao, một sao trước không sao', () => {
    const ds = [cau({ qid: 'x0', so: 3, sao: 0 }), cau({ qid: 'x2', so: 1, sao: 2 }), cau({ qid: 'x1', so: 2, sao: 1 })]
    expect(xepCau(ds).map((c) => c.qid)).toEqual(['x2', 'x1', 'x0'])
  })

  it('bằng điểm thì thứ tự ổn định theo phần rồi số câu — chạy lại không nhảy', () => {
    const a = cau({ qid: 'a', so: 5, sao: 1, phan: 'I' })
    const b = cau({ qid: 'b', so: 2, sao: 1, phan: 'III' })
    const c = cau({ qid: 'c', so: 3, sao: 1, phan: 'I' })
    expect(xepCau([b, a, c]).map((x) => x.qid)).toEqual(['c', 'a', 'b'])
  })
})

describe('PHÉP KIỂM 16, 17, 18, 21 — ghép em với câu', () => {
  const dsCau = [
    cau({ qid: 'q1', so: 1, sao: 2, chuyenDe: 'pH và acid base', soEmLam: 10, soEmDung: 2 }),
    cau({ qid: 'q2', so: 2, sao: 2, chuyenDe: 'Chuẩn độ', soEmLam: 10, soEmDung: 3 }),
    cau({ qid: 'q3', so: 3, sao: 1, chuyenDe: 'Ester', soEmLam: 10, soEmDung: 4 }),
  ]

  it('một câu chỉ phân cho một em, một em chỉ nhận một câu mỗi lượt', () => {
    const dsEm = [em({ sbd: '1' }), em({ sbd: '2' }), em({ sbd: '3' })]
    const { dong } = phanMotLuot(dsCau, dsEm, 'ca1')
    expect(dong).toHaveLength(3)
    expect(new Set(dong.map((d) => d.cau.qid)).size).toBe(3)
    expect(new Set(dong.map((d) => d.sbd)).size).toBe(3)
  })

  it('PHÉP KIỂM 18 — em vắng mặt không xuất hiện', () => {
    const dsEm = [em({ sbd: '1', vangMat: true }), em({ sbd: '2' })]
    const { dong } = phanMotLuot(dsCau, dsEm, 'ca1')
    expect(dong.map((d) => d.sbd)).not.toContain('1')
  })

  it('PHÉP KIỂM 21 — ưu tiên em SAI câu đó VÀ yếu đúng chuyên đề đó', () => {
    const dsEm = [
      em({ sbd: 'A', qidSai: [], chuyenDeYeu: [] }),
      em({ sbd: 'B', qidSai: ['q1'], chuyenDeYeu: ['Ester'] }), // mức 2
      em({ sbd: 'C', qidSai: ['q1'], chuyenDeYeu: ['pH và acid base'] }), // mức 1
    ]
    const { dong } = phanMotLuot([dsCau[0]], dsEm, 'ca1')
    expect(dong[0].sbd).toBe('C')
    expect(dong[0].muc).toBe(1)
    expect(dong[0].viSao).toContain('sai câu này')
    expect(dong[0].viSao).toContain('pH và acid base')
  })

  it('không em nào sai câu đó thì lấy em YẾU CHUYÊN ĐỀ (mức 3) trước em bất kỳ', () => {
    const dsEm = [em({ sbd: 'A' }), em({ sbd: 'B', chuyenDeYeu: ['Chuẩn độ'] })]
    const { dong } = phanMotLuot([dsCau[1]], dsEm, 'ca1')
    expect(dong[0].sbd).toBe('B')
    expect(dong[0].muc).toBe(3)
  })

  it('so chuyên đề bỏ dấu và bỏ khác biệt gạch ngang', () => {
    const c = cau({ qid: 'q', so: 1, chuyenDe: 'Ester – lipid' })
    const dsEm = [em({ sbd: 'A' }), em({ sbd: 'B', chuyenDeYeu: ['ester - lipid'] })]
    expect(phanMotLuot([c], dsEm, 'ca1').dong[0].sbd).toBe('B')
  })

  it('cùng mức thì em ÍT LÊN BẢNG NHẤT được gọi', () => {
    const dsEm = [em({ sbd: 'A', qidSai: ['q1'], soLanLenBang: 5 }), em({ sbd: 'B', qidSai: ['q1'], soLanLenBang: 1 })]
    expect(phanMotLuot([dsCau[0]], dsEm, 'ca1').dong[0].sbd).toBe('B')
  })

  it('PHÉP KIỂM 26 — cùng mã ca chạy lại ra kết quả y hệt', () => {
    const dsEm = [em({ sbd: '1' }), em({ sbd: '2' }), em({ sbd: '3' })]
    const a = phanMotLuot(dsCau, dsEm, 'ca-123')
    const b = phanMotLuot(dsCau, dsEm, 'ca-123')
    expect(a.dong.map((d) => `${d.cau.qid}:${d.sbd}`)).toEqual(b.dong.map((d) => `${d.cau.qid}:${d.sbd}`))
  })

  it('hết em thì câu còn lại trả về conCau, không im lặng bỏ', () => {
    const { dong, conCau } = phanMotLuot(dsCau, [em({ sbd: '1' })], 'ca1')
    expect(dong).toHaveLength(1)
    expect(conCau.map((c) => c.qid)).toEqual(['q2', 'q3'])
  })
})

describe('PHÉP KIỂM 22–25 — chia lượt', () => {
  const nCau = (n: number, sao: 0 | 1 | 2 = 1) =>
    Array.from({ length: n }, (_, i) => cau({ qid: `q${i + 1}`, so: i + 1, sao, soEmLam: 10, soEmDung: 2 }))
  const nEm = (n: number) => Array.from({ length: n }, (_, i) => em({ sbd: String(i + 1).padStart(3, '0') }))

  it('PHÉP KIỂM 22 — 19 câu · 27 em: một lượt phân hết 19 câu, không còn câu chưa phân', () => {
    const kq = phanCauLenBang(nCau(19), nEm(27), 'ca1')
    expect(kq.luot).toHaveLength(1)
    expect(kq.luot[0].dong).toHaveLength(19)
    expect(kq.chuaPhan).toHaveLength(0)
  })

  it('PHÉP KIỂM 23 — 40 câu · 27 em: lượt 1 phân 27, lượt 2 phân 13 câu còn lại', () => {
    const kq = phanCauLenBang(nCau(40), nEm(27), 'ca1')
    expect(kq.luot).toHaveLength(2)
    expect(kq.luot[0].dong).toHaveLength(27)
    expect(kq.luot[1].dong).toHaveLength(13)
    expect(kq.chuaPhan).toHaveLength(0)
  })

  it('PHÉP KIỂM 24 — câu đã phân ở lượt 1 KHÔNG xuất hiện lại ở lượt 2', () => {
    const kq = phanCauLenBang(nCau(40), nEm(27), 'ca1')
    const l1 = new Set(kq.luot[0].dong.map((d) => d.cau.qid))
    for (const d of kq.luot[1].dong) expect(l1.has(d.cau.qid)).toBe(false)
  })

  it('PHÉP KIỂM 25 — em đã lên lượt 1 chỉ nhận ở lượt 2 khi hết em chưa lên', () => {
    // 40 câu · 10 em: lượt 1 gọi đủ 10 em, lượt 2 buộc phải gọi lại người cũ.
    const kq10 = phanCauLenBang(nCau(40), nEm(10), 'ca1')
    expect(kq10.luot[0].dong).toHaveLength(10)
    expect(kq10.luot[1].dong).toHaveLength(10)
    // 12 câu · 10 em: lượt 2 chỉ còn 2 câu, và phải rơi vào em CHƯA lên... nhưng
    // lượt 1 đã gọi cả 10 em, nên đây kiểm ca 15 câu · 20 em thì lượt 1 gọi 15
    // em, không ai bị gọi hai lần.
    const kq20 = phanCauLenBang(nCau(15), nEm(20), 'ca1')
    expect(kq20.luot).toHaveLength(1)
    expect(new Set(kq20.luot[0].dong.map((d) => d.sbd)).size).toBe(15)
  })

  it('lượt 2 ưu tiên em CHƯA LÊN trước em đã lên lượt 1', () => {
    // 6 câu · 4 em: lượt 1 gọi 4 em, lượt 2 còn 2 câu.
    const kq = phanCauLenBang(nCau(6), nEm(4), 'ca1')
    const daLen = new Set(kq.luot[0].dong.map((d) => d.sbd))
    expect(daLen.size).toBe(4)
    // Không còn em chưa lên nên lượt 2 buộc gọi lại — nhưng vẫn một em một câu.
    expect(new Set(kq.luot[1].dong.map((d) => d.sbd)).size).toBe(kq.luot[1].dong.length)
  })

  it('câu chỉ đọc đáp án bị tách ra khỏi mọi lượt, không phân cho ai', () => {
    const ds = [...nCau(3), cau({ qid: 'de', so: 99, sao: 0, soEmLam: 10, soEmDung: 10 })]
    const kq = phanCauLenBang(ds, nEm(10), 'ca1')
    expect(kq.chiDoc.map((c) => c.qid)).toEqual(['de'])
    const moiQid = kq.luot.flatMap((l) => l.dong.map((d) => d.cau.qid))
    expect(moiQid).not.toContain('de')
  })

  it('không em nào có mặt thì không sinh lượt nào, không ném lỗi', () => {
    const kq = phanCauLenBang(nCau(5), [em({ sbd: '1', vangMat: true })], 'ca1')
    expect(kq.luot).toHaveLength(0)
    expect(kq.dangChua).toHaveLength(5)
  })

  it('quá ba lượt thì câu còn lại vào chuaPhan, hiện ra chứ không giấu', () => {
    const kq = phanCauLenBang(nCau(50), nEm(5), 'ca1')
    expect(kq.luot).toHaveLength(3)
    expect(kq.chuaPhan.length).toBe(50 - 15)
  })
})

describe('bảng chữ để copy sang Zalo', () => {
  it('có đủ lượt, số câu, tên em, lý do và khối chỉ đọc đáp án', () => {
    const ds = [
      cau({ qid: 'q1', so: 9, sao: 2, chuyenDe: 'pH', soEmLam: 10, soEmDung: 2 }),
      cau({ qid: 'de', so: 2, sao: 0, soEmLam: 10, soEmDung: 10 }),
    ]
    const t = bangChu(phanCauLenBang(ds, [em({ sbd: '1', hoTen: 'Lê Minh Đức', qidSai: ['q1'], chuyenDeYeu: ['pH'] })], 'ca1'), '11A1 · 05/09')
    expect(t).toContain('LƯỢT 1')
    expect(t).toContain('Câu 9')
    expect(t).toContain('★★')
    expect(t).toContain('Lê Minh Đức')
    expect(t).toContain('sai câu này')
    expect(t).toContain('CHỈ ĐỌC ĐÁP ÁN')
    expect(t).toContain('Câu 2')
  })
})

// ------------------------------------------------ DỰNG DỮ LIỆU TỪ MỘT CA
import { dungDuLieuTuCa } from '../src/lib/phan-cau-len-bang'
import type { TeacherExamSource } from '../src/data/examContent'
import { mergeKeepAnswers } from '../src/data/examContent'

const q = (id: string, correct: 'A' | 'B' | 'C' | 'D', chuyenDe: string, sao: 0 | 1 | 2) => ({
  id,
  text: `Đề ${id}`,
  choices: ['a', 'b', 'c', 'd'] as [string, string, string, string],
  correct,
  chuyenDe,
  canChua: { sao, dk: [], ly_do: '', bay: null },
})

const nguon: TeacherExamSource[] = [
  {
    maDe: 'CA',
    phanI: [q('c1', 'A', 'pH', 2), q('c2', 'B', 'Ester', 1), q('c3', 'C', 'pH', 0)] as never,
    phanII: [] as never,
    phanIII: [] as never,
  },
]

describe('dungDuLieuTuCa', () => {
  const bank = mergeKeepAnswers(nguon)
  const traLoi = (m: Record<string, string>) => ({ phanI: m, phanII: {}, phanIII: {} })

  it('gom đúng số em làm, số em đúng và các đáp án sai của từng câu', () => {
    const { cau } = dungDuLieuTuCa(bank as never, '111111', [
      { sbd: '001', hoTen: 'A', trangThai: 'da_nop', dapAn: traLoi({ c1: 'A', c2: 'D', c3: 'C' }) as never },
      { sbd: '002', hoTen: 'B', trangThai: 'da_nop', dapAn: traLoi({ c1: 'B', c2: 'D', c3: 'C' }) as never },
      { sbd: '003', hoTen: 'C', trangThai: 'da_nop', dapAn: traLoi({ c1: 'B', c2: 'B', c3: 'C' }) as never },
    ])
    const c1 = cau.find((c) => c.qid === 'c1')!
    expect(c1.soEmLam).toBe(3)
    expect(c1.soEmDung).toBe(1)
    expect(c1.dapAnSai.sort()).toEqual(['B', 'B'])
    expect(c1.sao).toBe(2)
    const c3 = cau.find((c) => c.qid === 'c3')!
    expect(c3.soEmDung).toBe(3)
    expect(chiDocDapAn(c3)).toBe(true)
  })

  it('số câu lấy theo NGÂN HÀNG CỦA CA, không theo thứ tự xáo của từng em', () => {
    const { cau } = dungDuLieuTuCa(bank as never, '111111', [{ sbd: '001', hoTen: 'A', trangThai: 'da_nop', dapAn: traLoi({ c1: 'A', c2: 'B', c3: 'C' }) as never }])
    expect(cau.map((c) => [c.qid, c.so])).toEqual([
      ['c1', 1],
      ['c2', 2],
      ['c3', 3],
    ])
  })

  it('em chưa nộp bị đánh VẮNG MẶT, không ghép câu cho chỗ trống', () => {
    const { em } = dungDuLieuTuCa(bank as never, '111111', [
      { sbd: '001', hoTen: 'A', trangThai: 'dang_lam', dapAn: null },
      { sbd: '002', hoTen: 'B', trangThai: 'da_nop', dapAn: traLoi({ c1: 'A', c2: 'B', c3: 'C' }) as never },
    ])
    expect(em.find((e) => e.sbd === '001')!.vangMat).toBe(true)
    expect(em.find((e) => e.sbd === '002')!.vangMat).toBeUndefined()
  })

  it('chuyên đề yếu suy từ chính ca này khi không có hồ sơ tích luỹ', () => {
    const { em } = dungDuLieuTuCa(bank as never, '111111', [
      // Sai c1 (pH) và c3 (pH) → yếu pH nhất; sai c2 (Ester) một câu.
      { sbd: '001', hoTen: 'A', trangThai: 'da_nop', dapAn: traLoi({ c1: 'B', c2: 'D', c3: 'A' }) as never },
    ])
    expect(em[0].chuyenDeYeu[0]).toBe('pH')
    expect(em[0].qidSai.sort()).toEqual(['c1', 'c2', 'c3'])
  })

  it('có hồ sơ tích luỹ thì DÙNG hồ sơ, không suy lại từ ca', () => {
    const { em } = dungDuLieuTuCa(bank as never, '111111', [{ sbd: '001', hoTen: 'A', trangThai: 'da_nop', dapAn: traLoi({ c1: 'B', c2: 'B', c3: 'C' }) as never }], { '001': ['Ester'] })
    expect(em[0].chuyenDeYeu).toEqual(['Ester'])
  })

  it('câu không em nào làm tới bị loại — không đưa lên bảng câu cả lớp chưa đọc', () => {
    const { cau } = dungDuLieuTuCa(bank as never, '111111', [])
    expect(cau).toHaveLength(0)
  })

  it('chạy nối vào phanCauLenBang ra danh sách gọi hoàn chỉnh', () => {
    const { cau, em } = dungDuLieuTuCa(bank as never, '111111', [
      { sbd: '001', hoTen: 'An', trangThai: 'da_nop', dapAn: traLoi({ c1: 'B', c2: 'B', c3: 'C' }) as never },
      { sbd: '002', hoTen: 'Bình', trangThai: 'da_nop', dapAn: traLoi({ c1: 'B', c2: 'D', c3: 'C' }) as never },
    ])
    const kq = phanCauLenBang(cau, em, '111111')
    expect(kq.chiDoc.map((c) => c.qid)).toEqual(['c3'])
    expect(kq.luot[0].dong.map((d) => d.cau.qid)).toEqual(['c1', 'c2'])
    // c1 hai sao, cả hai em cùng sai và cùng chọn B → phải đứng đầu.
    expect(kq.luot[0].dong[0].cau.sao).toBe(2)
    expect(nhacHieuNhamChung(kq.luot[0].dong[0].cau)).toContain('cùng chọn B')
  })
})

describe('nút Đổi em khác', () => {
  const c1 = cau({ qid: 'q1', so: 1, sao: 2, soEmLam: 10, soEmDung: 1 })
  it('bỏ em thầy vừa đổi ra khỏi ĐÚNG câu đó, câu khác vẫn gọi em ấy', () => {
    const dsEm = [em({ sbd: 'A', qidSai: ['q1'] }), em({ sbd: 'B' })]
    const lan1 = phanMotLuot([c1], dsEm, 'ca1')
    expect(lan1.dong[0].sbd).toBe('A')
    const lan2 = phanMotLuot([c1], dsEm, 'ca1', new Set(), { q1: ['A'] })
    expect(lan2.dong[0].sbd).toBe('B')
  })

  it('đổi hết mọi em thì câu đó về conCau, không gán bừa', () => {
    const dsEm = [em({ sbd: 'A' }), em({ sbd: 'B' })]
    const kq = phanMotLuot([c1], dsEm, 'ca1', new Set(), { q1: ['A', 'B'] })
    expect(kq.dong).toHaveLength(0)
    expect(kq.conCau.map((c) => c.qid)).toEqual(['q1'])
  })
})
