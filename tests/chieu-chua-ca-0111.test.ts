// @vitest-environment node
// CHIẾU CHỮA BÀI SAU CA (thầy chốt bản vẽ 01/11, docs/ban-ve-chieu-chua-ca-0111; sửa khi chốt: «phần tên em sai phải thu gọn lại được để lấy diện tích chữa
// bảng»). Khoá:
//   · luật xếp: mức độ khó → dễ (Vận dụng → Hiểu → Biết, không rõ mức sau cùng), cùng mức sai nhiều → ít, bằng nhau ⇒ phần rồi số câu;
//   · chỉ câu có em chưa đúng; bỏ trống = chưa đúng; Phần II sai 1 ý = chưa đúng; câu không chấm được (dungSai null) không đếm; đề riêng: đếm theo câu;
//   · tên trên thẻ: hai chữ cuối, trùng ⇒ đủ họ tên, quá 30 em ⇒ 29 tên + «+n em»;
//   · tờ chiếu: thẻ tên trong cột phải, chip mức độ, «Câu 1/N», pha «CHỮA BÀI», KHÔNG nút «Lên bảng», nút/phím H «Thu gọn tên»; tờ thường y như cũ;
//   · dựng từ đề có đáp án của ca: đúng nội dung, đúng thứ tự, dải thống kê lớp (phím T) từ bài làm của ca.
import { describe, expect, it } from 'vitest'
import { TOI_DA_TEN, tenGon, theChuaDung, xepCauChuaCa, type EmBaiCa } from '../src/lib/chieu-chua-ca'
import { taoHtmlMayChieu, type OBang } from '../src/lib/html-may-chieu'
import type { ChiTietCauRow } from '../src/lib/exam-api'
import type { TeacherExamSource } from '../src/data/examContent'

const r = (qid: string, phan: 'I' | 'II' | 'III', soCau: number, mucDo: string, dungSai: boolean | null, dapAnChon = 'B', dapAnDung = 'A'): ChiTietCauRow => ({ phan, soCau, qid, chuyenDe: '', mucDo, dapAnChon, dapAnDung, dungSai, giay: 30 })

describe('xếp câu cần chữa', () => {
  it('mức độ khó → dễ, cùng mức sai nhiều → ít, rồi phần + số câu; chỉ câu có em chưa đúng', () => {
    const ds: EmBaiCa[] = [
      { sbd: '1', hoTen: 'Nguyễn Văn An', rows: [r('q1', 'I', 1, 'biet', false), r('q2', 'I', 2, 'van_dung', false), r('q3', 'II', 1, 'hieu', false, 'DDSS', 'DSSS'), r('q4', 'III', 1, 'van_dung', true, '2', '2'), r('q5', 'I', 5, '', false)] },
      { sbd: '2', hoTen: 'Trần Thị Bình', rows: [r('q1', 'I', 1, 'biet', true, 'A'), r('q2', 'I', 2, 'van_dung', false), r('q3', 'II', 1, 'hieu', true, 'DSSS', 'DSSS'), r('q4', 'III', 1, 'van_dung', true, '2', '2'), r('q6', 'III', 2, 'van_dung', false, '', '5')] },
      { sbd: '3', hoTen: 'Lê Minh Châu', rows: [r('q1', 'I', 1, 'biet', true, 'A'), r('q2', 'I', 2, 'van_dung', true, 'A'), r('q3', 'II', 1, 'hieu', false, 'SSSS', 'DSSS'), r('q4', 'III', 1, 'van_dung', true, '2', '2')] },
    ]
    const x = xepCauChuaCa(ds)
    expect(x.map((c) => c.qid)).toEqual(['q2', 'q6', 'q3', 'q1', 'q5']) // q4 cả lớp đúng ⇒ không vào; q5 không rõ mức ⇒ cuối
    expect(x[0]!.sai.map((e) => e.sbd)).toEqual(['1', '2'])
    expect(x[0]!.lam).toBe(3)
    expect(x[1]).toMatchObject({ qid: 'q6', lam: 1, sai: [{ sbd: '2' }] }) // đề riêng: chỉ em được giao; bỏ trống = chưa đúng
    expect(x[2]).toMatchObject({ qid: 'q3', phan: 'II' }) // sai 1 ý = chưa đúng
    expect(x[2]!.sai.map((e) => e.sbd)).toEqual(['1', '3'])
  })
  it('câu không chấm được (dungSai null) không đếm, em không bảng chấm bỏ qua', () => {
    const x = xepCauChuaCa([{ sbd: '1', hoTen: 'A', rows: [r('q1', 'I', 1, 'hieu', null)] }, { sbd: '2', hoTen: 'B', rows: null }])
    expect(x).toEqual([])
  })
})

describe('tên trên thẻ', () => {
  it('hai chữ cuối; trùng ⇒ đủ họ tên; tên một chữ giữ nguyên', () => {
    expect(tenGon(['Nguyễn Minh Anh', 'Trần Minh Anh', 'Lê Thảo Chi', 'Tú'])).toEqual(['Nguyễn Minh Anh', 'Trần Minh Anh', 'Thảo Chi', 'Tú'])
  })
  it(`quá ${TOI_DA_TEN} em ⇒ ${TOI_DA_TEN - 1} tên + «+n em»`, () => {
    const sai = Array.from({ length: 34 }, (_, i) => ({ sbd: String(i), hoTen: `Họ Tên Em${i}` }))
    const t = theChuaDung({ sai, lam: 40 })
    expect(t.ten).toHaveLength(TOI_DA_TEN - 1)
    expect(t).toMatchObject({ them: 34 - (TOI_DA_TEN - 1), tong: 34, lam: 40 })
    expect(theChuaDung({ sai: sai.slice(0, TOI_DA_TEN), lam: 40 })).toMatchObject({ them: 0, tong: TOI_DA_TEN })
  })
})

const cauLuyen = (text: string) => ({ phan: 'I' as const, id: 'q', maDe: 'KT', chuyenDe: '', dang: 'chua_ro' as const, sao: 1 as const, mucDo: 'van_dung' as const, text, luaChon: ['1', '2', '3', '4'], dapAn: 'A', chot: '', lyDo: null, buoc: null, ketQua: 'A' })

describe('tờ chiếu chữa bài', () => {
  it('thẻ tên trong cột phải, chip mức độ, Câu n/N, CHỮA BÀI, không Lên bảng, nút H Thu gọn tên', () => {
    const o: OBang[] = [{ sbd: '', hoTen: 'Cả lớp', soCau: 7, mucDo: 'van_dung', cau: cauLuyen('Đề câu bảy'), chuaDung: { ten: ['Minh Anh', 'Thảo Chi'], them: 0, tong: 2, lam: 32 } }]
    const html = taoHtmlMayChieu(o, { tenBuoi: 'Chữa bài', chuaBai: true })
    expect(html).toMatch(/<body[^>]*data-chua-bai/)
    expect(html).not.toContain('id="mc-len-bang"')
    expect(html).toContain('id="mc-st-nut"')
    expect(html).toContain('Thu gọn tên')
    expect(html).toMatch(/<section class="mc-cot-lam-bai"[^>]*><aside class="mc-st"/)
    expect(html).toContain('<b>2<small>/32</small></b>')
    expect(html).toContain('<li>Minh Anh</li><li>Thảo Chi</li>')
    expect(html).toContain('mc-st-muc">Vận dụng</span>')
    expect(html).toContain("'Câu ' : 'Đợt '")
    expect(html).toContain("'CHỮA BÀI' : 'CHỜ THẦY GỌI'")
  })
  it('tờ thường (không chuaBai) y như cũ: có Lên bảng, không thẻ/nút H', () => {
    const html = taoHtmlMayChieu([{ sbd: '1', hoTen: 'Em', soCau: 1, cau: cauLuyen('Đề') }], { tenBuoi: 'Lên bảng' })
    expect(html).toContain('id="mc-len-bang"')
    expect(html).not.toMatch(/<body[^>]*data-chua-bai/)
    expect(html).not.toContain('class="mc-st"')
    expect(html).not.toContain('id="mc-st-nut"')
  })
  it('dựng từ đề có đáp án của ca: đúng nội dung theo mã, đúng thứ tự, thống kê lớp', async () => {
    const { dungToChuaCa } = await import('../src/components/ca-thi/dung-to-chua-ca')
    const nguon = [{
      maDe: 'KT15',
      phanI: [{ id: 'KT15-I-1', text: 'Câu dễ về acid', choices: ['a', 'b', 'c', 'd'], correct: 'A' }, { id: 'KT15-I-2', text: 'Câu khó về hiệu suất', choices: ['a', 'b', 'c', 'd'], correct: 'A' }],
      phanII: [],
      phanIII: [],
    }] as unknown as TeacherExamSource[]
    const ds = xepCauChuaCa([
      { sbd: '1', hoTen: 'Nguyễn Văn An', rows: [r('KT15-I-1', 'I', 1, 'biet', false, 'C'), r('KT15-I-2', 'I', 2, 'van_dung', false, 'B')] },
      { sbd: '2', hoTen: 'Trần Thị Bình', rows: [r('KT15-I-1', 'I', 1, 'biet', true, 'A'), r('KT15-I-2', 'I', 2, 'van_dung', false, 'B')] },
    ])
    const { html, soThieu } = await dungToChuaCa(ds, nguon, 'Chữa bài · KT15')
    expect(soThieu).toBe(0)
    expect(html.indexOf('Câu khó về hiệu suất')).toBeGreaterThan(-1)
    expect(html.indexOf('Câu khó về hiệu suất')).toBeLessThan(html.indexOf('Câu dễ về acid'))
    expect(html).toContain('<li>Văn An</li><li>Thị Bình</li>')
    expect(html).toContain('mc-tk') // dải thống kê lớp (phím T)
    expect(html).toMatch(/<body[^>]*data-chua-bai/)
    expect(html).toContain('<b>2<small>/2</small></b>')
    // câu không có nội dung trên máy ⇒ dòng «Nội dung câu hỏi N», vẫn có tên em, đếm soThieu
    const thieu = xepCauChuaCa([{ sbd: '1', hoTen: 'Nguyễn Văn An', rows: [r('KT15-III-9', 'III', 3, 'hieu', false, '1', '2')] }])
    const kq = await dungToChuaCa(thieu, nguon, 'Chữa bài')
    expect(kq.soThieu).toBe(1)
    expect(kq.html).toContain('Nội dung câu hỏi 3')
    expect(kq.html).toContain('<li>Văn An</li>')
  })
})
