// @vitest-environment node
// BỘ CÂU CHUẨN CỦA MỘT EM (thầy 06/10: "quét toàn bộ mục chấm điểm … không được phép chấm sai cho bất kì bài kiểm tra nào").
//
// Khoá bằng SỐ: (1) bộ câu đã ghi được dùng ĐÚNG, không bù câu lạ; (2) thiếu câu trong kho / bài làm ngoài bộ ⇒ LỖI, không chấm đoán;
// (3) hash chỉ dùng khi KHỚP dấu vết bài làm; (4) điểm (scoreStudent) và dòng chi tiết (taoChiTietCau) LUÔN cùng một bộ câu;
// (5) khoá Phần III có đơn vị chấm được; (6) lưới "Từng câu" phân biệt bỏ trống / sai / đúng một phần.
import { describe, expect, it } from 'vitest'
import type { PublicExamBank } from '../src/data/examContent'
import { scoreStudent, type AnswerKey } from '../src/engine/score'
import { chiTieuHieuLuc, giaiBoCauEm, hopNhatBo, lamPhangBo, LoiBoCauError } from '../src/lib/bo-cau-chuan'
import { taoBaiGhiDiem, taoChiTietCau, taoChiTietCauHoacLoi } from '../src/lib/chi-tiet-cau'
import { gradeFromKeyBank, gradeSubmissionFull } from '../src/lib/exam-grade'
import { chuDemLoai, chuLoaiChuaDung, dongCauSaiLai, loaiCauChuaDung } from '../src/lib/loai-cau-chua-dung'
import { luoiTungCau, demChuaDungTron } from '../src/lib/ket-qua-sau-nop'
import { dongCachTinhDiem } from '../src/lib/phieu-du-lieu'
import type { AnswerRecord } from '../src/lib/exam-db'

const mcq = (id: string, correct = 'A') => ({ id, text: id, choices: ['a', 'b', 'c', 'd'], correct, chuyenDe: 'CD', mucDo: 'hieu' })
const tf = (id: string, correct: ('D' | 'S')[] = ['D', 'S', 'D', 'S']) => ({ id, text: id, ideas: ['1', '2', '3', '4'], correct, chuyenDe: 'CD', mucDo: 'hieu' })
const sa = (id: string, correct = '0,54') => ({ id, text: id, correct, chuyenDe: 'CD', mucDo: 'van_dung' })

/** Kho 6/3/3 — ca đề riêng rút 2/1/1 cho mỗi em. */
function kho(extra: Partial<PublicExamBank> = {}): PublicExamBank {
  return {
    phanI: ['I-1', 'I-2', 'I-3', 'I-4', 'I-5', 'I-6'].map((x) => mcq(x)),
    phanII: ['II-1', 'II-2', 'II-3'].map((x) => tf(x)),
    phanIII: ['III-1', 'III-2', 'III-3'].map((x) => sa(x)),
    soCau: { I: 2, II: 1, III: 1 },
    ...extra,
  } as unknown as PublicExamBank
}
const BO_S1 = ['I-1', 'I-2', 'II-1', 'III-1']
const BO_S2 = ['I-3', 'I-4', 'II-2', 'III-2']
const rong = (): AnswerRecord => ({ phanI: {}, phanII: {}, phanIII: {} }) as AnswerRecord

describe('lamPhangBo / hopNhatBo', () => {
  it('đọc cả dạng phẳng lẫn dạng gói, bỏ giá trị hỏng', () => {
    expect(lamPhangBo({ S1: ['a'], S2: [], S3: 'x', S4: [1] })).toEqual({ S1: ['a'] })
    expect(lamPhangBo({ bo: { S1: ['a'], S2: ['b', 'c'] }, lap: { S1: ['a'] } })).toEqual({ S1: ['a'], S2: ['b', 'c'] })
    expect(lamPhangBo(null)).toEqual({})
    expect(lamPhangBo([['a']])).toEqual({})
  })
  it('D1 sống THẮNG bản chụp trong tờ đáp án, theo từng em; em chỉ có ở một phía vẫn giữ', () => {
    const r = hopNhatBo({ S1: ['cu1'], S3: ['cu3'] }, { bo: { S1: ['moi1'], S2: ['moi2'] } })
    expect(r).toEqual({ S1: ['moi1'], S2: ['moi2'], S3: ['cu3'] })
  })
})

describe('giaiBoCauEm — bộ đã ghi', () => {
  it('dùng ĐÚNG bộ đã ghi, KHÔNG bù câu lạ khi kho đủ', () => {
    const bc = giaiBoCauEm(kho(), 'CA', 'S1', { dapAn: rong() }, BO_S1)
    expect(bc.loi).toBeNull()
    expect(bc.nguon).toBe('da_ghi')
    expect(bc.qids).toEqual(BO_S1)
    expect(bc.canhBao).toEqual([])
  })
  it('bộ đã ghi THIẾU so với chỉ tiêu ⇒ vẫn chấm nhưng NÓI RA có bù (bo_duoc_bu_N)', () => {
    const bc = giaiBoCauEm(kho(), 'CA', 'S1', { dapAn: rong() }, ['I-1', 'II-1', 'III-1'])
    expect(bc.loi).toBeNull()
    expect(bc.canhBao).toEqual(['bo_duoc_bu_1'])
  })
  it('câu của bộ KHÔNG còn trong kho ⇒ LỖI thieu_trong_kho (không bù câu khác vào chỗ ấy)', () => {
    const bc = giaiBoCauEm(kho(), 'CA', 'S1', { dapAn: rong() }, ['I-1', 'I-XOA', 'II-1', 'III-1'])
    expect(bc.loi?.ma).toBe('thieu_trong_kho')
    expect(bc.loi?.qid).toEqual(['I-XOA'])
    expect(bc.loi?.chiTiet).toContain('I-XOA')
  })
  it('em để lại dấu vết (đã trả lời / đã xem) ở câu NGOÀI bộ ⇒ LỖI bai_lam_ngoai_bo', () => {
    const traLoi = { ...rong(), phanI: { 'I-3': 'A' } } as AnswerRecord
    const bc = giaiBoCauEm(kho(), 'CA', 'S1', { dapAn: traLoi }, BO_S1)
    expect(bc.loi?.ma).toBe('bai_lam_ngoai_bo')
    expect(bc.loi?.qid).toEqual(['I-3'])
    const xem = giaiBoCauEm(kho(), 'CA', 'S1', { dapAn: rong(), giayCau: { 'II-3': 12 } }, BO_S1)
    expect(xem.loi?.ma).toBe('bai_lam_ngoai_bo') // câu chỉ XEM mà bỏ trống cũng là dấu vết
  })
  it('khoá lạ trong giayCau (không phải qid trong kho) KHÔNG đủ để kết luận gì', () => {
    const bc = giaiBoCauEm(kho(), 'CA', 'S1', { dapAn: rong(), giayCau: { 'khong-phai-qid': 9 } }, BO_S1)
    expect(bc.loi).toBeNull()
  })
})

describe('giaiBoCauEm — không có bộ đã ghi', () => {
  it('luật hash KHỚP dấu vết ⇒ dùng hash (qids null), không đoán', () => {
    const bc = giaiBoCauEm(kho(), 'CA', 'S9', { dapAn: rong() })
    expect(bc.nguon).toBe('hash')
    expect(bc.qids).toBeNull()
    expect(bc.loi).toBeNull()
  })
  it('hash LỆCH dấu vết ⇒ dựng từ bài làm, bù cho đủ chỉ tiêu, có cảnh báo', () => {
    // Em S9 trả lời đúng bộ BO_S2 (mà hash của S9 rất khó trùng bộ ấy) và còn dấu vết ở câu Phần II/III.
    const traLoi = { phanI: { 'I-3': 'A', 'I-4': 'A' }, phanII: { 'II-2': ['D', 'S', 'D', 'S'] }, phanIII: { 'III-2': '0,54' } } as unknown as AnswerRecord
    const bc = giaiBoCauEm(kho(), 'CA', 'S9', { dapAn: traLoi })
    expect(bc.nguon).toBe('bai_lam')
    expect(bc.canhBao).toContain('hash_lech_bai_lam')
    expect([...(bc.qids ?? [])].sort()).toEqual([...BO_S2].sort())
  })
  it('chiTieuHieuLuc: có soCau thì lấy soCau; thiếu thì 18/4/6 nhưng không vượt kho', () => {
    expect(chiTieuHieuLuc(kho())).toEqual({ I: 2, II: 1, III: 1 })
    const k = kho({ soCau: undefined })
    expect(chiTieuHieuLuc(k)).toEqual({ I: 6, II: 3, III: 3 })
  })
})

describe('điểm và bảng chi tiết dùng CÙNG một bộ câu', () => {
  const traLoiS2 = { phanI: { 'I-3': 'A', 'I-4': 'B' }, phanII: { 'II-2': ['D', 'S', 'D', 'S'] }, phanIII: { 'III-2': '0,540' } } as unknown as AnswerRecord

  it('gradeSubmissionFull trả bộ câu chuẩn; taoChiTietCau dùng đúng nó ⇒ số đúng khớp từng câu', () => {
    const goc = { phanI: kho().phanI, phanII: kho().phanII, phanIII: kho().phanIII } as unknown as Parameters<typeof gradeSubmissionFull>[0][number]
    const g = gradeSubmissionFull([goc], 'CA', 'S2', traLoiS2, { I: 2, II: 1, III: 1 }, { bo: { S1: BO_S1, S2: BO_S2 } }, null)
    expect(g.boCau?.nguon).toBe('da_ghi')
    expect(g.score.total).toBe(7.75) // I: 1/2 → 2,25 · II: 4,00 · III: 1,50 (Phần III "0,540" khớp "0,54")
    const rows = taoChiTietCauHoacLoi({ ...kho(), boTheoEm: { bo: { S1: BO_S1, S2: BO_S2 } } } as never, 'CA', 'S2', traLoiS2, null, g.boCau?.qids)
    expect(rows.map((r) => r.qid)).toEqual(BO_S2)
    const dungTheoDiem = [...g.score.phanI.items, ...g.score.phanII.items, ...g.score.phanIII.items].map((x) => x.correct)
    expect(rows.map((r) => r.dungSai === true)).toEqual(dungTheoDiem)
  })

  it('bộ ghi lệch bài làm ⇒ gradeSubmissionFull NÉM LoiBoCauError (không ra điểm đoán); taoChiTietCau trả rỗng, bản "HoacLoi" ném', () => {
    const goc = { phanI: kho().phanI, phanII: kho().phanII, phanIII: kho().phanIII } as never
    // Bộ ghi của S2 là BO_S1 nhưng em làm bộ BO_S2 ⇒ bài làm nằm ngoài bộ.
    const mapSai = { S2: BO_S1 }
    expect(() => gradeSubmissionFull([goc], 'CA', 'S2', traLoiS2, { I: 2, II: 1, III: 1 }, mapSai, null)).toThrow(LoiBoCauError)
    const bank = { ...kho(), boTheoEm: mapSai } as never
    expect(taoChiTietCau(bank, 'CA', 'S2', traLoiS2, null)).toEqual([])
    expect(() => taoChiTietCauHoacLoi(bank, 'CA', 'S2', traLoiS2, null)).toThrow(LoiBoCauError)
  })

  it('SO SÁNH VỚI CÁCH CŨ: máy em tự rút lại bằng hash cho ra điểm KHÁC hẳn điểm đúng (lỗi 10/09 vẫn bị chặn)', () => {
    const goc = { phanI: kho().phanI, phanII: kho().phanII, phanIII: kho().phanIII } as never
    const dung = gradeSubmissionFull([goc], 'CA', 'S2', traLoiS2, { I: 2, II: 1, III: 1 }, { S2: BO_S2 }, null)
    const hashThuan = gradeFromKeyBank({ ...kho() } as never, 'CA', 'S2', traLoiS2)
    expect(dung.score.total).toBe(7.75)
    expect(hashThuan.score.total).not.toBe(7.75)
  })

  it('taoBaiGhiDiem lấy dòng chi tiết theo ĐÚNG bộ câu lần chấm đã dùng (bản đồ D1 sống), kể cả khi `bank` chỉ có bản chụp thiếu em', () => {
    const goc = { phanI: kho().phanI, phanII: kho().phanII, phanIII: kho().phanIII } as never
    const bai = { phanI: { 'I-3': 'A' }, phanII: {}, phanIII: {} } as unknown as AnswerRecord // em bỏ trống gần hết ⇒ đoán từ bài làm sẽ ra bộ khác
    const g = gradeSubmissionFull([goc], 'CA', 'S2', bai, { I: 2, II: 1, III: 1 }, { bo: { S1: BO_S1, S2: BO_S2 } }, null)
    expect(g.boCau?.qids).toEqual(BO_S2)
    const bankChup = { ...kho(), boTheoEm: { bo: { S1: BO_S1 } } } as never // bản chụp lúc mở ca: KHÔNG có S2
    const goi = taoBaiGhiDiem(bankChup, 'CA', 'S2', 1, bai, g, null)
    expect(goi.cau.map((c) => c.qid)).toEqual(BO_S2)
  })
})

describe('chuDemLoai — chỉ nêu loại CÓ MẶT, theo thứ tự sai · bỏ trống · đúng một phần', () => {
  it('không in "0 …" cho loại vắng mặt', () => {
    expect(chuDemLoai([{ loai: 'sai' }, { loai: 'trong' }, { loai: 'sai' }])).toBe('2 sai · 1 bỏ trống')
    expect(chuDemLoai([{ loai: 'mot_phan' }, { loai: 'trong' }])).toBe('1 bỏ trống · 1 đúng một phần')
    expect(chuDemLoai([{}, { loai: 'sai' }])).toBe('1 sai')
    expect(chuDemLoai([])).toBe('')
    expect(chuDemLoai([{ loai: 'sai' }, { loai: 'trong' }, { loai: 'mot_phan' }], ', ')).toBe('1 sai, 1 bỏ trống, 1 đúng một phần')
    expect(chuLoaiChuaDung('mot_phan')).toBe('đúng một phần')
  })
})

describe('khoá Phần III có đơn vị / % chấm được (trước đây ném lỗi làm cả bài không chấm)', () => {
  const key = (phanIII: string[]): AnswerKey => ({ madeThi: 'X', phanI: [], phanII: [], phanIII })
  const bai = (v: (string | null)[]) => ({ sbd: 'S', madeThi: 'X', phanI: [], phanII: [], phanIII: v.map((value) => ({ value, flag: null as null })) })
  it.each(['12 g/mol', '5 mol', '50%', '1,2375×10⁹ kJ', '0,54', '–1'])('khoá %s chấm được', (k) => {
    const r = scoreStudent(bai([null]), key([k]))
    expect(r.total).toBe(0)
  })
  it('em ghi đúng số (không đơn vị) ⇒ đúng; ghi sai đơn vị ⇒ sai', () => {
    expect(scoreStudent(bai(['12']), key(['12 g/mol'])).total).toBe(10)
    expect(scoreStudent(bai(['12 g/mol']), key(['12 g/mol'])).total).toBe(10)
    expect(scoreStudent(bai(['12 kg']), key(['12 g'])).total).toBe(0)
  })
  it.each(['abc', '', '1/2', '0,5 hoặc 1/2'])('khoá %s vẫn bị TỪ CHỐI (nói to, không chấm sai âm thầm)', (k) => {
    expect(() => scoreStudent(bai(['1']), key([k]))).toThrow(/khóa đáp án không hợp lệ/)
  })
})

describe('lưới "Từng câu": bỏ trống ≠ sai ≠ đúng một phần', () => {
  it('Phần I/II/III đủ bốn loại, và số câu chưa đúng trọn khớp tập `dung_sai = 0`', () => {
    const khoLon = { phanI: [mcq('a'), mcq('b'), mcq('c')], phanII: [tf('d'), tf('e'), tf('f'), tf('g')], phanIII: [sa('h'), sa('i'), sa('j')] } as unknown as Parameters<typeof gradeSubmissionFull>[0][number]
    const tl = {
      phanI: { a: 'A', b: 'B' }, // a đúng · b sai · c bỏ trống
      phanII: { d: ['D', 'S', 'D', 'S'], e: ['D', 'S', 'S', 'D'], f: [null, null, null, null], g: ['S', 'D', 'S', 'D'] }, // đúng · một phần (2 ý) · bỏ trống · sai hẳn
      phanIII: { h: '0,54', i: '9', j: '  ' }, // đúng · sai · bỏ trống (chỉ có khoảng trắng)
    } as unknown as AnswerRecord
    // Có bản đồ đề riêng ⇒ thứ tự câu là thứ tự kho (đường hash xáo thứ tự theo hạt giống).
    const bo = { S1: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'] }
    const g = gradeSubmissionFull([khoLon], 'CA', 'S1', tl, { I: 3, II: 4, III: 3 }, bo, null)
    const luoi = luoiTungCau(g.score, g.studentAnswers)
    expect(luoi.map((x) => `${x.phan}${x.so}:${x.kq}`)).toEqual(['I1:dung', 'I2:sai', 'I3:trong', 'II1:dung', 'II2:mot_phan', 'II3:trong', 'II4:sai', 'III1:dung', 'III2:sai', 'III3:trong'])
    expect(demChuaDungTron(luoi)).toBe(7)
    // Bảng chi tiết ghi `dung_sai = 0` đúng 7 câu — cùng tập với "chưa đúng trọn".
    const rows = taoChiTietCau({ ...khoLon, soCau: { I: 3, II: 4, III: 3 }, boTheoEm: bo } as never, 'CA', 'S1', tl, null, g.boCau?.qids ?? null)
    const chua = rows.filter((r) => r.dungSai !== true)
    expect(chua).toHaveLength(7)
    // Phân loại từ dòng chi tiết (chuỗi đáp án) khớp lưới, câu theo câu.
    expect(chua.map((r) => loaiCauChuaDung(r))).toEqual(['sai', 'trong', 'mot_phan', 'trong', 'sai', 'sai', 'trong'])
    expect(luoi.filter((x) => x.kq !== 'dung').map((x) => x.kq)).toEqual(['sai', 'trong', 'mot_phan', 'trong', 'sai', 'sai', 'trong'])
  })
})

describe('loaiCauChuaDung — chuỗi đáp án như bảng chấm ghi', () => {
  it.each([
    ['I', 'A', 'B', 'sai'],
    ['I', '', 'B', 'trong'],
    ['III', '  ', '0,54', 'trong'],
    ['III', '9', '0,54', 'sai'],
    ['II', '----', 'DSDS', 'trong'], // Phần II bỏ trống KHÔNG phải chuỗi rỗng
    ['II', 'D---', 'DSDS', 'mot_phan'],
    ['II', 'SDSD', 'DSDS', 'sai'],
    ['II', 'DS-S', 'DSDS', 'mot_phan'],
  ] as const)('%s · chọn %j · đúng %j ⇒ %s', (phan, chon, dung, kq) => {
    expect(loaiCauChuaDung({ phan, dapAnChon: chon, dapAnDung: dung })).toBe(kq)
  })
})

describe('dongCachTinhDiem — Phần II nêu câu đúng một phần, bỏ trống nhận đúng', () => {
  const r = (phan: 'I' | 'II' | 'III', so: number, chon: string, dung: string, ok: boolean) => ({ phan, soCau: so, qid: `q${phan}${so}`, chuyenDe: '', mucDo: '', dapAnChon: chon, dapAnDung: dung, dungSai: ok, giay: 5 }) as never
  it('"đúng trọn 1/3 câu, 1 câu đúng một phần" và nhắc câu bỏ trống Phần II ("----")', () => {
    const rows = [r('II', 1, 'DSDS', 'DSDS', true), r('II', 2, 'DS--', 'DSDS', false), r('II', 3, '----', 'DSDS', false)]
    const dong = dongCachTinhDiem(rows, { I: 0, II: 1.5, III: 0 }, { I: 4.5, II: 4, III: 1.5 })
    expect(dong).toContain('đúng trọn 1/3 câu, 1 câu đúng một phần')
    expect(dong).toContain('Câu bỏ trống tính như câu sai')
  })
})

describe('dongCauSaiLai — dòng "câu em còn chưa đúng" ở báo cáo ca rút câu SAI', () => {
  const r = (phan: 'I' | 'II' | 'III', chon: string, dung: string) => ({ phan, soCau: 3, qid: 'q3', chuyenDe: 'Este', dapAnChon: chon, dapAnDung: dung })
  it('sai thường: giữ đáp án em chọn; số lần sai gồm cả lần này; 0 = không biết (không bịa 1)', () => {
    expect(dongCauSaiLai(r('I', 'B', 'A'), 2)).toMatchObject({ dapAnChon: 'B', dapAnDung: 'A', soLanSai: 3, motPhan: false })
    expect(dongCauSaiLai(r('I', 'B', 'A'), 0).soLanSai).toBe(0)
  })
  it('bỏ trống: đáp án chọn RỖNG (kể cả Phần II "----"), không in chuỗi gạch', () => {
    expect(dongCauSaiLai(r('III', '', '0,54'), 0).dapAnChon).toBe('')
    expect(dongCauSaiLai(r('II', '----', 'DSDS'), 0)).toMatchObject({ dapAnChon: '', motPhan: false })
  })
  it('Phần II đúng một phần: đánh dấu riêng, vẫn giữ chuỗi em chọn để thầy thấy ý nào sai', () => {
    expect(dongCauSaiLai(r('II', 'DS-S', 'DSDS'), 1)).toMatchObject({ dapAnChon: 'DS-S', motPhan: true, soLanSai: 2 })
    expect(dongCauSaiLai(r('II', 'SDSD', 'DSDS'), 1)).toMatchObject({ dapAnChon: 'SDSD', motPhan: false })
  })
})
