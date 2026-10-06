// @vitest-environment jsdom
// 06/10 (thầy: "câu tự luận tuyệt đối loại bỏ; câu bảng bị lỗi — vẽ lại bảng"): tờ chiếu chữa chiến dịch
//  (1) KHÔNG BAO GIỜ có câu tự luận, và dòng Phần III không tra được nội dung không còn ghi nhãn "Tự luận" giả;
//  (2) câu mà bảng đã bị dẹt thành chữ ("Chất | palmitic acid | … | 5% | …") trên máy thầy ⇒ lấy bản đúng của máy chủ (có bảng thật).
import { describe, expect, it, vi } from 'vitest'
import { dungToChieu, laBangDet, napNoiDungChoToChieu, type CauGoc, type OChieu } from '../src/components/chien-dich/to-chieu'

const DET = 'Một loại dầu hướng dương với hàm lượng các acid béo như sau: Chất | palmitic acid | stearic acid | oleic acid | linoleic acid Hàm lượng (%) | 5% | 6% | 30% | 59% Chỉ số iodine của chất béo là bao nhiêu?'
const BANG = [['Chất', 'Hàm lượng (%)'], ['palmitic acid', '5'], ['stearic acid', '6'], ['oleic acid', '30'], ['linoleic acid', '59']]
const o = (qid: string, phan: 'I' | 'II' | 'III', stt: number, them: Partial<OChieu> = {}): OChieu => ({ qid, stt, phan, mucDo: null, sbd: '01', ten: 'Em 01', viSao: '', ...them })

describe('laBangDet', () => {
  it('đề có ≥ 3 dấu | liền nhau và KHÔNG có bảng thật ⇒ bảng dẹt', () => {
    expect(laBangDet({ text: DET })).toBe(true)
    expect(laBangDet({ text: DET, table: BANG })).toBe(false)
    expect(laBangDet({ text: DET, bang: BANG })).toBe(false)
    expect(laBangDet({ text: 'Tính |x| biết x = −3 (|x| là trị tuyệt đối)' })).toBe(false)
    expect(laBangDet(null)).toBe(false)
  })
})

describe('tờ chiếu lấy bản đúng của máy chủ cho câu có bảng dẹt', () => {
  const tra = new Map<string, CauGoc>([
    ['X-III-6', { phan: 'III', q: { id: 'X-III-6', text: DET, correct: '128' } as never }],
    ['X-I-1', { phan: 'I', q: { id: 'X-I-1', text: 'Câu bình thường', choices: ['a', 'b', 'c', 'd'], correct: 'A' } as never }],
  ])
  it('chỉ hỏi máy chủ câu dẹt (câu bình thường có sẵn trên máy thì không hỏi)', async () => {
    const hoi = vi.fn(async (qids: string[]) => ({ cau: { 'X-III-6': { id: 'X-III-6', phan: 'III', text: 'Số liệu ở bảng sau.', table: BANG, correct: '128' } }, boKhoi: [], khoiDich: [] as number[], qids }))
    const r = await napNoiDungChoToChieu([o('X-III-6', 'III', 6), o('X-I-1', 'I', 1)], tra, hoi as never)
    expect(hoi).toHaveBeenCalledWith(['X-III-6'])
    expect((r.ds[0] as OChieu & { cauGoc?: { table?: unknown } }).cauGoc?.table).toEqual(BANG)
    expect((r.ds[1] as OChieu & { cauGoc?: unknown }).cauGoc).toBeUndefined()
  })
  it('tờ dựng từ bản máy chủ có BẢNG THẬT, không còn dòng chữ ngăn bằng |', async () => {
    const dsO = [o('X-III-6', 'III', 6, { cauGoc: { id: 'X-III-6', phan: 'III', text: 'Số liệu ở bảng sau. Xác định chỉ số iodine (làm tròn đến hàng đơn vị).', table: BANG, correct: '128' } })]
    const { html } = await dungToChieu(dsO, 'Buổi chữa', tra)
    expect(html).toContain('<table')
    expect(html).toContain('palmitic acid')
    expect(html).not.toContain('Chất | palmitic')
  })
})

describe('câu tự luận không bao giờ lên tờ chiếu chữa', () => {
  it('dòng Phần III không có nội dung ⇒ bỏ (đếm vào thiếu), không ghi "Tự luận"', async () => {
    const { html, soThieu } = await dungToChieu([o('Z-III-118', 'III', 118), o('Z-I-3', 'I', 3, { cauGoc: { id: 'Z-I-3', phan: 'I', text: 'Câu trắc nghiệm', choices: ['a', 'b', 'c', 'd'], correct: 'A' } })], 'Buổi chữa', new Map())
    expect(html).not.toContain('Tự luận')
    expect(html).not.toContain('Nội dung câu hỏi 118')
    expect(soThieu).toBe(1)
    expect(html).toContain('Câu trắc nghiệm')
  })
  it('câu Phần III có nội dung là tự luận (đáp án là công thức/chữ) ⇒ bỏ', async () => {
    const tl = { id: 'Z-III-5', phan: 'III', text: 'Trình bày cơ chế phản ứng xà phòng hoá chất béo.', correct: 'Giải thích bằng lời' }
    const { html } = await dungToChieu([o('Z-III-5', 'III', 5, { cauGoc: tl })], 'Buổi chữa', new Map())
    expect(html).not.toContain('Trình bày cơ chế')
    expect(html).not.toContain('Tự luận')
  })
})
