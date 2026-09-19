// @vitest-environment node
// ĐOÀN HỘ TỐNG — bước 4: thẻ gợi ý của Tiếp sức. Ba chốt: KHÔNG chứa đáp án đúng · KHÔNG phải toàn bộ lời giải · không lời giải → chỉ còn "Loại 1 phương án".
import { describe, it, expect } from 'vitest'
import { soanThe, loDapAn, toanVanLoiGiai, deRutGon, MO_TA_THE, TI_LE_TOI_DA, THE_DAI_TOI_DA } from '../server/src/game-v2-doan-the'
import type { PrivateQuestion } from '../src/game/than-thu-v2/core'

const cau = (o: Partial<PrivateQuestion>): PrivateQuestion => ({ qid: 'Q1', maDe: 'D', version: 'v', group: 'g', phan: 'I', text: 'Thuỷ phân ethyl acetate trong dung dịch NaOH dư, đun nóng, thu được sản phẩm hữu cơ gồm',
  choices: ['CH3COOH và C2H5OH', 'CH3COONa và C2H5OH', 'CH3COONa và CH3OH', 'HCOONa và C2H5OH'], ideas: [], hinhAnh: [], dang: 'ES.A.X', tenDang: 'Ester', mucDo: 'hieu', sao: 2,
  kienThuc: ['phản ứng xà phòng hoá ester', 'gọi tên ester'], correct: 'B', reviewed: true,
  solution: { chot: 'Ester thuỷ phân trong kiềm cho muối của acid và ancol tương ứng.', tung_pa: { A: { dung: false, vi_sao: 'Môi trường kiềm không giữ được acid tự do.' }, B: { dung: true, vi_sao: 'Gốc acetate thành muối natri, gốc ethyl thành ethanol.' }, C: { dung: false, vi_sao: 'Gốc ancol là ethyl chứ không phải methyl.' }, D: { dung: false, vi_sao: 'Gốc acid là acetate chứ không phải formate.' } },
    buoc: ['Tách ester thành gốc acid và gốc ancol.', 'Trong kiềm, gốc acid gắn với Na thành muối.', 'Gốc ancol nhận H thành ancol tương ứng.'] }, ...o })
const khongLoVaKhongTron = (q: PrivateQuestion, hat = 'DH1') => {
  const toanVan = toanVanLoiGiai(q)
  for (const t of soanThe(q, hat)) {
    expect(loDapAn(t.noiDung, q), `${t.loai}: "${t.noiDung}" làm lộ đáp án`).toBe(false)
    expect(t.noiDung.length).toBeLessThanOrEqual(THE_DAI_TOI_DA + 12)
    if (toanVan) { expect(t.noiDung).not.toContain(toanVan); if (t.loai === 'buoc_dau') expect(t.noiDung.length).toBeLessThanOrEqual(toanVan.length * TI_LE_TOI_DA + 12) }
  }
}

describe('Thẻ gợi ý · soạn từ dữ liệu có sẵn của câu', () => {
  it('câu có kiến thức + lời giải nhiều bước → đủ ba thẻ đúng thứ tự; không thẻ nào chứa đáp án hay toàn bộ lời giải', () => {
    const q = cau({}), the = soanThe(q, 'DH1')
    expect(the.map(t => t.loai)).toEqual(['nhac_cong_thuc', 'loai_phuong_an', 'buoc_dau']); expect(the.map(t => t.tieuDe)).toEqual(['Nhắc công thức', 'Loại 1 phương án', 'Chỉ bước đầu'])
    expect(the[0]!.noiDung).toBe('Kiến thức gốc của câu này: phản ứng xà phòng hoá ester · gọi tên ester.')
    expect(the[2]!.noiDung).toBe('Bước đầu: Tách ester thành gốc acid và gốc ancol.')
    khongLoVaKhongTron(q)
  })
  it('thẻ "Loại 1 phương án" gạch đúng MỘT phương án SAI — không bao giờ gạch đáp án đúng; tất định theo (mã chặng, câu)', () => {
    const daGach = new Set<string>()
    for (let i = 0; i < 60; i++) {
      const t = soanThe(cau({}), `DH${i}`).find(x => x.loai === 'loai_phuong_an')!
      const m = t.noiDung.match(/^Phương án ([ABCD]) không đúng/)!; expect(m[1]).not.toBe('B'); daGach.add(m[1]!)
      expect(soanThe(cau({}), `DH${i}`)).toEqual(soanThe(cau({}), `DH${i}`))
    }
    expect([...daGach].sort()).toEqual(['A', 'C', 'D'])
    for (const dung of ['A', 'C', 'D']) for (let i = 0; i < 20; i++) expect(soanThe(cau({ correct: dung }), `X${i}`).find(x => x.loai === 'loai_phuong_an')!.noiDung).not.toContain(`Phương án ${dung} `)
  })
  it('câu KHÔNG có lời giải (và không có kiến thức) → Phần I chỉ còn thẻ "Loại 1 phương án"; Phần II, III không có thẻ nào', () => {
    for (const solution of [null, undefined, '', '   ', {}]) expect(soanThe(cau({ solution, kienThuc: [] }), 'DH1').map(t => t.loai)).toEqual(['loai_phuong_an'])
    expect(soanThe(cau({ phan: 'II', correct: 'DSDS', ideas: ['a', 'b', 'c', 'd'], choices: [], solution: null, kienThuc: [] }), 'DH1')).toEqual([])
    expect(soanThe(cau({ phan: 'III', correct: '12,5', choices: [], solution: null, kienThuc: [] }), 'DH1')).toEqual([])
  })
  it('lời giải chỉ có MỘT bước / một câu chữ thô → không có thẻ "Chỉ bước đầu" (vì đó đã là toàn bộ lời giải)', () => {
    expect(soanThe(cau({ solution: { chot: '', buoc: ['Ester + NaOH tạo muối và ancol.'] } }), 'DH1').map(t => t.loai)).toEqual(['nhac_cong_thuc', 'loai_phuong_an'])
    expect(soanThe(cau({ solution: 'Ester thuỷ phân trong kiềm cho muối và ancol nên chọn B.', kienThuc: [] }), 'DH1').map(t => t.loai)).toEqual(['loai_phuong_an'])
  })
  it('thiếu trường kiến thức → "Nhắc công thức" dùng câu chốt của lời giải, NHƯNG chỉ khi lời giải còn phần khác và câu chốt không lộ đáp án', () => {
    expect(soanThe(cau({ kienThuc: [] }), 'DH1')[0]).toEqual({ loai: 'nhac_cong_thuc', tieuDe: 'Nhắc công thức', noiDung: 'Ester thuỷ phân trong kiềm cho muối của acid và ancol tương ứng.' })
    expect(soanThe(cau({ kienThuc: [], solution: { chot: 'Sản phẩm là CH3COONa và C2H5OH.', buoc: ['Viết phương trình.', 'Đọc sản phẩm.'] } }), 'DH1').map(t => t.loai)).toEqual(['loai_phuong_an', 'buoc_dau'])
    expect(soanThe(cau({ kienThuc: [], solution: { chot: 'Đáp án B vì gốc acetate thành muối.', buoc: ['Viết phương trình.', 'Đọc sản phẩm.'] } }), 'DH1').map(t => t.loai)).toEqual(['loai_phuong_an', 'buoc_dau'])
  })
  it('bước đầu mà lộ đáp án thì BỎ thẻ ấy (Phần I: chữ cái / nội dung phương án đúng; Phần III: đáp số; Phần II: dãy Đ/S, "ý a đúng")', () => {
    const loai = (o: Partial<PrivateQuestion>) => soanThe(cau(o), 'DH1').map(t => t.loai)
    expect(loai({ solution: { chot: 'x', buoc: ['Chọn B vì tạo muối natri acetate.', 'Kiểm tra lại.'] } })).not.toContain('buoc_dau')
    expect(loai({ solution: { chot: 'x', buoc: ['Sản phẩm: CH3COONa và C2H5OH.', 'Kiểm tra lại.'] } })).not.toContain('buoc_dau')
    const so = { phan: 'III' as const, correct: '12,5', choices: [], kienThuc: ['bảo toàn khối lượng'] }
    expect(loai({ ...so, solution: { chot: 'Bảo toàn khối lượng.', buoc: ['m = 12.5 gam.', 'Làm tròn.'] } })).toEqual(['nhac_cong_thuc'])
    expect(loai({ ...so, solution: { chot: 'Bảo toàn khối lượng.', buoc: ['Tính số mol NaOH: 0,125 mol (lấy 112,5 mL).', 'Suy ra khối lượng.', 'Làm tròn.'] } })).toEqual(['nhac_cong_thuc', 'buoc_dau']) // 0,125 và 112,5 KHÔNG phải đáp số 12,5
    const ds = { phan: 'II' as const, correct: 'DSDS', choices: [], ideas: ['a', 'b', 'c', 'd'], kienThuc: ['tính chất ester'] }
    expect(loai({ ...ds, solution: { chot: 'Xét từng ý.', buoc: ['Ý a đúng vì X là ethyl acetate.', 'Xét tiếp ý b.'] } })).toEqual(['nhac_cong_thuc'])
    expect(loai({ ...ds, solution: { chot: 'Xét từng ý.', buoc: ['Đáp án: Đ - S - Đ - S.', 'Giải thích.'] } })).toEqual(['nhac_cong_thuc'])
    expect(loai({ ...ds, solution: { chot: 'Xét từng ý.', buoc: ['Viết công thức cấu tạo của X trước.', 'Xét từng ý theo cấu tạo.'] } })).toEqual(['nhac_cong_thuc', 'buoc_dau'])
  })
  it('quét 300 câu sinh tự động (3 phần, lời giải đủ kiểu): KHÔNG thẻ nào lộ đáp án, KHÔNG thẻ nào là toàn bộ lời giải', () => {
    const manh = ['Chọn B.', 'Đáp án là 7,5.', 'Viết phương trình phản ứng.', 'Đổi đơn vị về mol.', 'CH3COONa và C2H5OH là sản phẩm.', 'Ý c sai.', 'Đ S Đ S', 'Áp dụng bảo toàn nguyên tố.', 'So sánh nhiệt độ sôi.', 'Kết quả 7.5 gam.']
    for (let i = 0; i < 300; i++) {
      const phan = (['I', 'II', 'III'] as const)[i % 3], buoc = [manh[i % manh.length]!, manh[(i * 3 + 1) % manh.length]!, manh[(i * 7 + 2) % manh.length]!].slice(0, 1 + (i % 3))
      const q = cau({ qid: `Q${i}`, phan, correct: phan === 'I' ? 'ABCD'[i % 4]! : phan === 'II' ? 'DSDS' : '7,5', choices: phan === 'I' ? ['HCOOH', 'CH3COONa và C2H5OH', 'CH3OH', 'C2H5OH'] : [], ideas: phan === 'II' ? ['a', 'b', 'c', 'd'] : [],
        kienThuc: i % 2 ? [] : ['xà phòng hoá'], solution: i % 5 === 0 ? buoc.join(' ') : { chot: manh[(i * 5) % manh.length], buoc } })
      khongLoVaKhongTron(q, `H${i}`)
    }
  })
})

describe('Thẻ gợi ý · bộ dò lộ đáp án và phần đề rút gọn', () => {
  it('bảng thử loDapAn', () => {
    const I = cau({}), III = cau({ phan: 'III', correct: '12,5', choices: [] }), II = cau({ phan: 'II', correct: 'DSDS', choices: [], ideas: ['a', 'b', 'c', 'd'] })
    for (const s of ['Chọn B', 'đáp án: b', 'B là đúng', 'phương án đúng là B', 'Thu được CH3COONa  và C2H5OH']) expect(loDapAn(s, I), s).toBe(true)
    for (const s of ['Ester thuỷ phân trong kiềm cho muối và ancol', 'Phương án C không đúng', 'Bước đầu: viết phương trình']) expect(loDapAn(s, I), s).toBe(false)
    for (const s of ['m = 12,5 g', 'kết quả 12.5', '12,5']) expect(loDapAn(s, III), s).toBe(true)
    for (const s of ['0,125 mol', '112,5 mL', '12,55', 'lấy 12 gam rồi thêm 5 gam']) expect(loDapAn(s, III), s).toBe(false)
    for (const s of ['ĐSĐS', 'Đúng, Sai, Đúng, Sai', 'ý b sai', 'a) đúng', 'sai: ý c', '✓ X là ester']) expect(loDapAn(s, II), s).toBe(true)
    for (const s of ['Viết công thức cấu tạo trước', 'Xét tính tan của ester so với ancol', 'Cách làm sai thường gặp là quên cân bằng']) expect(loDapAn(s, II), s).toBe(false)
  })
  it('người tiếp sức chỉ thấy THÂN câu rút gọn của bạn — không phương án, không ý', () => {
    const q = cau({ text: 'x '.repeat(300) }); expect(deRutGon(q).length).toBeLessThanOrEqual(201); expect(deRutGon(q).endsWith('…')).toBe(true)
    const r = deRutGon(cau({})); expect(r).toBe(cau({}).text); for (const c of cau({}).choices) expect(r).not.toContain(c)
    expect(Object.values(MO_TA_THE).map(x => x.tieuDe)).toEqual(['Nhắc công thức', 'Loại 1 phương án', 'Chỉ bước đầu'])
  })
})
