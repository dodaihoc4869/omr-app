import { describe, expect, it } from 'vitest'
import type { TeacherExamSource, TeacherMcqQuestion, TeacherShortAnswerQuestion, TeacherTrueFalseQuestion } from '../src/data/examContent'
import { mergeAndStrip, mergeKeepAnswers } from '../src/data/examContent'
import { assignStudentQuestions } from '../src/lib/exam-assign'
import { boMotCau, demMucDo, doiMotCau, dsChuyenDe, dungUngVien, locNguonTheoId, locTheoYeuCau, moiIdDaRut, qidDaRaTuCacCa, rutDe, soCauCua, tongCau, type MucDoRut, type YeuCauRut } from '../src/lib/rut-de'

type Mo = { chuyenDe?: string; mucDo?: MucDoRut }

function mcq(id: string, o: Mo = {}): TeacherMcqQuestion {
  return { id, text: `Đề ${id}`, choices: ['A', 'B', 'C', 'D'], correct: 'A', ...o }
}
function tf(id: string, o: Mo = {}): TeacherTrueFalseQuestion {
  return { id, text: `Đề ${id}`, ideas: ['a', 'b', 'c', 'd'], correct: ['D', 'S', 'D', 'S'], ...o }
}
function sa(id: string, o: Mo = {}): TeacherShortAnswerQuestion {
  return { id, text: `Đề ${id}`, correct: '1', ...o }
}

/** Kho giả lập kho thật `12-C1-B1`: nhiều câu phần I, ít phần II/III. */
function khoLon(): TeacherExamSource[] {
  const cd = ['Ester – lipid', 'Carbohydrate', 'Amin']
  const md: MucDoRut[] = ['biet', 'hieu', 'van_dung']
  const phanI = Array.from({ length: 90 }, (_, i) => mcq(`I${i}`, { chuyenDe: cd[i % 3], mucDo: md[i % 3] }))
  const phanII = Array.from({ length: 26 }, (_, i) => tf(`II${i}`, { chuyenDe: cd[i % 3], mucDo: md[i % 3] }))
  const phanIII = Array.from({ length: 31 }, (_, i) => sa(`III${i}`, { chuyenDe: cd[i % 3], mucDo: md[i % 3] }))
  return [{ maDe: 'KHO', phanI, phanII, phanIII }]
}

const YC_TRONG = { chuyenDe: [] as string[], mucDo: [] as MucDoRut[] }

describe('dungUngVien / thống kê kho', () => {
  it('dàn phẳng đúng số câu từng phần và giữ số thứ tự đề gốc', () => {
    const uv = dungUngVien(khoLon())
    expect(uv.I.length).toBe(90)
    expect(uv.II.length).toBe(26)
    expect(uv.III.length).toBe(31)
    expect(uv.I[0].soGoc).toBe(1)
    expect(uv.I[89].soGoc).toBe(90)
    expect(uv.I[0].maDe).toBe('KHO')
  })

  it('gộp hai đề thì số thứ tự đếm lại từ 1 theo từng đề', () => {
    const uv = dungUngVien([
      { maDe: 'A', phanI: [mcq('a1'), mcq('a2')], phanII: [], phanIII: [] },
      { maDe: 'B', phanI: [mcq('b1')], phanII: [], phanIII: [] },
    ])
    expect(uv.I.map((c) => `${c.maDe}${c.soGoc}`)).toEqual(['A1', 'A2', 'B1'])
  })

  it('đếm chuyên đề và mức độ để dựng chip lọc', () => {
    const uv = dungUngVien(khoLon())
    expect(dsChuyenDe(uv).map((c) => c.ten).sort()).toEqual(['Amin', 'Carbohydrate', 'Ester – lipid'])
    expect(dsChuyenDe(uv).reduce((s, c) => s + c.soCau, 0)).toBe(147)
    const dm = demMucDo(uv)
    expect(dm.biet + dm.hieu + dm.van_dung + dm['']).toBe(147)
  })

  it('câu chưa gắn chuyên đề vẫn được đếm, dưới nhãn nói rõ là chưa gắn', () => {
    const uv = dungUngVien([{ maDe: 'A', phanI: [mcq('a1')], phanII: [], phanIII: [] }])
    expect(dsChuyenDe(uv)).toEqual([{ ten: '(chưa gắn chuyên đề)', soCau: 1 }])
    expect(demMucDo(uv)['']).toBe(1)
  })
})

describe('locTheoYeuCau', () => {
  const uv = dungUngVien(khoLon())

  it('lọc rỗng thì nhận hết', () => {
    expect(locTheoYeuCau(uv.I, YC_TRONG).length).toBe(90)
  })

  it('lọc chuyên đề không phụ thuộc dấu và loại gạch ngang', () => {
    expect(locTheoYeuCau(uv.I, { chuyenDe: ['ester - lipid'], mucDo: [] }).length).toBe(30)
  })

  it('lọc mức độ loại luôn câu chưa gắn mức — không đoán câu chưa gắn là mức nào', () => {
    const uvTron = dungUngVien([{ maDe: 'A', phanI: [mcq('a1', { mucDo: 'biet' }), mcq('a2')], phanII: [], phanIII: [] }])
    expect(locTheoYeuCau(uvTron.I, { chuyenDe: [], mucDo: ['biet'] }).map((c) => c.id)).toEqual(['a1'])
  })
})

describe('rutDe', () => {
  const uv = dungUngVien(khoLon())
  const yc = (p: Partial<YeuCauRut> = {}): YeuCauRut => ({ soCau: { I: 18, II: 4, III: 6 }, chuyenDe: [], mucDo: [], seed: 7, ...p })

  it('rút đúng số câu từng phần', () => {
    const kq = rutDe(uv, yc())
    expect(soCauCua(kq)).toEqual({ I: 18, II: 4, III: 6 })
    expect(tongCau(soCauCua(kq))).toBe(28)
    expect(kq.thieu).toEqual({ I: 0, II: 0, III: 0 })
  })

  it('không lấy trùng câu trong cùng một lần rút', () => {
    const kq = rutDe(uv, yc())
    expect(moiIdDaRut(kq).size).toBe(28)
  })

  it('cùng seed ra cùng bộ câu, đổi seed ra bộ khác', () => {
    const a = rutDe(uv, yc())
    const b = rutDe(uv, yc())
    const c = rutDe(uv, yc({ seed: 99 }))
    expect(a.chon.I.map((x) => x.id)).toEqual(b.chon.I.map((x) => x.id))
    expect(a.chon.I.map((x) => x.id)).not.toEqual(c.chon.I.map((x) => x.id))
  })

  it('trải đều chuyên đề: 18 câu trên 3 chuyên đề ra 6 câu mỗi chuyên đề', () => {
    const kq = rutDe(uv, yc())
    const dem = new Map<string, number>()
    for (const c of kq.chon.I) dem.set(c.chuyenDe, (dem.get(c.chuyenDe) ?? 0) + 1)
    expect([...dem.values()].sort()).toEqual([6, 6, 6])
  })

  it('trải đều mức độ trong phạm vi đã trải chuyên đề', () => {
    const kq = rutDe(uv, yc())
    const dem = new Map<string, number>()
    for (const c of kq.chon.I) dem.set(c.mucDo, (dem.get(c.mucDo) ?? 0) + 1)
    expect([...dem.values()].sort()).toEqual([6, 6, 6])
  })

  it('lọc một chuyên đề thì chỉ ra câu của chuyên đề đó', () => {
    const kq = rutDe(uv, yc({ chuyenDe: ['Amin'], soCau: { I: 10, II: 2, III: 2 } }))
    expect(kq.chon.I.every((c) => c.chuyenDe === 'Amin')).toBe(true)
    expect(kq.chon.I.length).toBe(10)
  })

  it('KHÔNG lặng lẽ trả ít câu hơn: thiếu bao nhiêu thì báo bấy nhiêu', () => {
    const kq = rutDe(uv, yc({ chuyenDe: ['Amin'], mucDo: ['van_dung'], soCau: { I: 50, II: 0, III: 0 } }))
    expect(kq.chon.I.length).toBeLessThan(50)
    expect(kq.thieu.I).toBe(50 - kq.chon.I.length)
    expect(kq.chon.I.every((c) => c.chuyenDe === 'Amin' && c.mucDo === 'van_dung')).toBe(true)
  })

  it('số câu 0 hoặc âm thì phần đó không ra câu nào và không báo thiếu', () => {
    const kq = rutDe(uv, yc({ soCau: { I: 5, II: 0, III: -3 } }))
    expect(soCauCua(kq)).toEqual({ I: 5, II: 0, III: 0 })
    expect(kq.thieu).toEqual({ I: 0, II: 0, III: 0 })
  })

  it('tránh câu đã ra ở ca trước khi kho còn câu mới', () => {
    const tranhQid = uv.I.slice(0, 45).map((c) => c.id)
    const kq = rutDe(uv, yc({ tranhQid, soCau: { I: 18, II: 0, III: 0 } }))
    expect(kq.lapLai).toBe(0)
    expect(kq.chon.I.some((c) => tranhQid.includes(c.id))).toBe(false)
  })

  it('hết câu mới thì VẪN mở được ca, nhưng đếm rõ số câu lặp lại', () => {
    const tranhQid = uv.I.map((c) => c.id)
    const kq = rutDe(uv, yc({ tranhQid, soCau: { I: 18, II: 0, III: 0 } }))
    expect(kq.chon.I.length).toBe(18)
    expect(kq.lapLai).toBe(18)
  })

  it('conLai cho biết còn bao nhiêu câu hợp lọc để bấm đổi', () => {
    const kq = rutDe(uv, yc({ soCau: { I: 18, II: 4, III: 6 } }))
    expect(kq.conLai.I).toBe(90 - 18)
    expect(kq.conLai.III).toBe(31 - 6)
  })
})

describe('doiMotCau / boMotCau', () => {
  const uv = dungUngVien(khoLon())
  const yc: YeuCauRut = { soCau: { I: 6, II: 2, III: 2 }, chuyenDe: [], mucDo: [], seed: 3 }

  it('đổi một câu thì giữ nguyên các câu còn lại và không trả lại chính câu vừa bỏ', () => {
    const kq = rutDe(uv, yc)
    const bo = kq.chon.I[2].id
    const moi = doiMotCau(uv, yc, kq, 'I', bo)
    expect(moi.chon.I.length).toBe(6)
    expect(moi.chon.I.some((c) => c.id === bo)).toBe(false)
    const giu = kq.chon.I.filter((c) => c.id !== bo).map((c) => c.id)
    expect(giu.every((id) => moi.chon.I.some((c) => c.id === id))).toBe(true)
  })

  it('đổi liên tiếp không quay về câu đã đổi ra trước đó', () => {
    let kq = rutDe(uv, yc)
    const daBo: string[] = []
    for (let i = 0; i < 4; i++) {
      const bo = kq.chon.I[0].id
      daBo.push(bo)
      kq = doiMotCau(uv, yc, kq, 'I', bo, daBo.slice(0, -1))
    }
    expect(kq.chon.I.some((c) => daBo.includes(c.id))).toBe(false)
  })

  it('đổi câu ở phần khác không đụng phần còn lại', () => {
    const kq = rutDe(uv, yc)
    const moi = doiMotCau(uv, yc, kq, 'III', kq.chon.III[0].id)
    expect(moi.chon.I.map((c) => c.id)).toEqual(kq.chon.I.map((c) => c.id))
  })

  it('đổi mã không có trong bộ thì trả về nguyên trạng', () => {
    const kq = rutDe(uv, yc)
    expect(doiMotCau(uv, yc, kq, 'I', 'khong-co')).toBe(kq)
  })

  it('bỏ một câu thì bộ ngắn đi một và số câu còn để đổi tăng lên', () => {
    const kq = rutDe(uv, yc)
    const moi = boMotCau(kq, 'I', kq.chon.I[0].id)
    expect(moi.chon.I.length).toBe(5)
    expect(moi.conLai.I).toBe(kq.conLai.I + 1)
  })
})

describe('locNguonTheoId', () => {
  it('cắt kho xuống đúng những câu đã rút, giữ nguyên dạng TeacherExamSource', () => {
    const kho = khoLon()
    const kq = rutDe(dungUngVien(kho), { soCau: { I: 18, II: 4, III: 6 }, chuyenDe: [], mucDo: [], seed: 1 })
    const ra = locNguonTheoId(kho, moiIdDaRut(kq))
    expect(ra.length).toBe(1)
    expect(ra[0].phanI.length).toBe(18)
    expect(ra[0].phanII.length).toBe(4)
    expect(ra[0].phanIII.length).toBe(6)
    expect(ra[0].phanI[0].correct).toBe('A')
  })

  it('đề không còn câu nào bị bỏ khỏi danh sách', () => {
    const nguon: TeacherExamSource[] = [
      { maDe: 'A', phanI: [mcq('a1')], phanII: [], phanIII: [] },
      { maDe: 'B', phanI: [mcq('b1')], phanII: [], phanIII: [] },
    ]
    expect(locNguonTheoId(nguon, new Set(['a1'])).map((s) => s.maDe)).toEqual(['A'])
  })
})

describe('bộ câu đã rút đi tới máy học sinh nguyên vẹn', () => {
  const kho = khoLon()
  const kq = rutDe(dungUngVien(kho), { soCau: { I: 25, II: 5, III: 8 }, chuyenDe: [], mucDo: [], seed: 11 })
  const nguon = locNguonTheoId(kho, moiIdDaRut(kq))
  const soCau = soCauCua(kq)

  it('mergeAndStrip mang theo số câu và không mang đáp án', () => {
    const bank = mergeAndStrip(nguon, soCau)
    expect(bank.soCau).toEqual({ I: 25, II: 5, III: 8 })
    expect(bank.phanI.length).toBe(25)
    expect((bank.phanI[0] as unknown as { correct?: string }).correct).toBeUndefined()
  })

  it('mỗi em nhận ĐÚNG bộ đã rút, không bị cắt lại về 18/4/6', () => {
    const bank = mergeAndStrip(nguon, soCau)
    const a = assignStudentQuestions(bank, 'ca01', 'hs001')
    expect(a.phanI.length).toBe(25)
    expect(a.phanII.length).toBe(5)
    expect(a.phanIII.length).toBe(8)
  })

  it('CẢ LỚP CÙNG MỘT BỘ CÂU — chỉ khác thứ tự', () => {
    const bank = mergeAndStrip(nguon, soCau)
    const a = assignStudentQuestions(bank, 'ca01', 'hs001')
    const b = assignStudentQuestions(bank, 'ca01', 'hs002')
    expect(a.phanI.map((x) => x.qid).sort()).toEqual(b.phanI.map((x) => x.qid).sort())
    expect(a.phanI.map((x) => x.qid)).not.toEqual(b.phanI.map((x) => x.qid))
  })

  it('máy thầy chấm lại tái tạo đúng bộ đó nhờ soCau đi kèm keyBank', () => {
    const key = mergeKeepAnswers(nguon, soCau)
    const bank = mergeAndStrip(nguon, soCau)
    const em = assignStudentQuestions(bank, 'ca01', 'hs001')
    const thay = assignStudentQuestions(key, 'ca01', 'hs001')
    expect(thay.phanI.map((x) => x.qid)).toEqual(em.phanI.map((x) => x.qid))
    expect(thay.phanIII.map((x) => x.qid)).toEqual(em.phanIII.map((x) => x.qid))
  })

  it('ca cũ KHÔNG có soCau vẫn chạy luật 18/4/6 — không đổi điểm đã gửi phụ huynh', () => {
    const bank = mergeAndStrip(kho)
    expect(bank.soCau).toBeUndefined()
    const a = assignStudentQuestions(bank, 'ca-cu', 'hs001')
    expect(a.phanI.length).toBe(18)
    expect(a.phanII.length).toBe(4)
    expect(a.phanIII.length).toBe(6)
  })

  it('soCau hỏng (0, âm, không phải số) thì rơi về luật cũ chứ không ra ca 0 câu', () => {
    const bank = mergeAndStrip(kho, { I: 0, II: -2, III: Number.NaN })
    const a = assignStudentQuestions(bank, 'ca01', 'hs001')
    expect(a.phanI.length).toBe(18)
    expect(a.phanII.length).toBe(4)
    expect(a.phanIII.length).toBe(6)
  })
})

describe('qidDaRaTuCacCa', () => {
  const kho = khoLon()

  it('ca mở bằng màn Rút đề: bản lưu chính là bộ đã ra, tính hết', () => {
    const kq = rutDe(dungUngVien(kho), { soCau: { I: 25, II: 5, III: 8 }, chuyenDe: [], mucDo: [], seed: 5 })
    const nguon = locNguonTheoId(kho, moiIdDaRut(kq))
    const ra = qidDaRaTuCacCa([{ maCa: 'c1', sources: nguon, soCau: soCauCua(kq) }])
    expect(ra.length).toBe(38)
    expect(new Set(ra)).toEqual(moiIdDaRut(kq))
  })

  it('ca CŨ lưu cả kho 147 câu thì BỎ QUA — không coi cả kho là đã ra', () => {
    expect(qidDaRaTuCacCa([{ maCa: 'cu', sources: kho }])).toEqual([])
  })

  it('ca cũ có kho vừa đúng 18/4/6 thì mọi em nhận trọn đề, tính hết', () => {
    const vua: TeacherExamSource[] = [
      {
        maDe: 'D28',
        phanI: Array.from({ length: 18 }, (_, i) => mcq(`d${i}`)),
        phanII: Array.from({ length: 4 }, (_, i) => tf(`t${i}`)),
        phanIII: Array.from({ length: 6 }, (_, i) => sa(`s${i}`)),
      },
    ]
    expect(qidDaRaTuCacCa([{ maCa: 'cu', sources: vua }]).length).toBe(28)
  })

  it('gộp nhiều ca, không đếm trùng', () => {
    const vua: TeacherExamSource[] = [{ maDe: 'D', phanI: [mcq('x1')], phanII: [], phanIII: [] }]
    expect(qidDaRaTuCacCa([{ maCa: 'a', sources: vua }, { maCa: 'b', sources: vua }])).toEqual(['x1'])
  })
})

describe('mỗi em một bộ câu riêng (thầy chốt 04-09)', () => {
  const kho = khoLon()
  // Thầy đặt mỗi em 18/4/6 câu; kho của ca rút gấp 3 = 54/12/18 câu.
  const kq = rutDe(dungUngVien(kho), { soCau: { I: 54, II: 12, III: 18 }, chuyenDe: [], mucDo: [], seed: 21 })
  const nguon = locNguonTheoId(kho, moiIdDaRut(kq))
  const bank = mergeAndStrip(nguon, { I: 18, II: 4, III: 6 })

  it('kho của ca lớn hơn số câu mỗi em', () => {
    expect(bank.phanI.length).toBe(54)
    expect(bank.soCau).toEqual({ I: 18, II: 4, III: 6 })
  })

  it('mỗi em vẫn làm đúng số câu thầy đặt', () => {
    const a = assignStudentQuestions(bank, 'ca9', 'hs001')
    expect(a.phanI.length).toBe(18)
    expect(a.phanII.length).toBe(4)
    expect(a.phanIII.length).toBe(6)
  })

  it('HAI EM NHẬN BỘ CÂU KHÁC NHAU', () => {
    const a = assignStudentQuestions(bank, 'ca9', 'hs001')
    const b = assignStudentQuestions(bank, 'ca9', 'hs002')
    const ta = new Set(a.phanI.map((x) => x.qid))
    const chung = b.phanI.filter((x) => ta.has(x.qid)).length
    expect(chung).toBeLessThan(18)
  })

  it('cùng em thì luôn ra đúng bộ đó — chấm lại không lệch', () => {
    const a = assignStudentQuestions(bank, 'ca9', 'hs001')
    const b = assignStudentQuestions(bank, 'ca9', 'hs001')
    expect(a.phanI.map((x) => x.qid)).toEqual(b.phanI.map((x) => x.qid))
    expect(a.phanIII.map((x) => x.qid)).toEqual(b.phanIII.map((x) => x.qid))
  })

  it('thứ tự A–D cũng đảo riêng từng em', () => {
    const a = assignStudentQuestions(bank, 'ca9', 'hs001')
    const b = assignStudentQuestions(bank, 'ca9', 'hs002')
    const chungQid = a.phanI.find((x) => b.phanI.some((y) => y.qid === x.qid))
    if (chungQid) {
      const kia = b.phanI.find((y) => y.qid === chungQid.qid)!
      expect(chungQid.choicePerm).not.toEqual(kia.choicePerm)
    }
  })
})
