// @vitest-environment jsdom
// MÁY YẾU 30/10 (thầy: «Tối ưu tức thì 100% cho máy cấu hình yếu app hs mọi chỗ mọi lớp»): lưu chặng đang dở KHÔNG chuỗi hoá lại cả đề mỗi lượt.
// Khoá:
//   · đề các câu ghi khoá riêng `omr_chang_dang_cau_<sbd>` — chỉ khi bộ câu ĐỔI (cùng mảng ⇒ không ghi lại);
//   · khoá chặng giữ tiến độ, không chứa đề; `omr_chang_dang_cua` (Lộ trình đọc mỗi lần vẽ) chỉ là bản tóm tắt nhỏ (qid / vai / câu đã nộp);
//   · mở lại (bộ nhớ trống) ⇒ ghép đủ đề; bản lưu kiểu cũ (đề nằm trong khoá chặng) vẫn đọc được; đề lệch số câu ⇒ coi như không có chặng dở.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { batGoiNgay, datLaiGoiNgay, docChangDangLam, luuChangDangLam, xoaChangDangLam } from '../src/components/hoc-tap/mo-chang-truoc'

beforeEach(() => { localStorage.clear(); batGoiNgay(true) })
afterEach(() => { vi.restoreAllMocks(); localStorage.clear(); batGoiNgay(false) })

const ngayVn = () => new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10)
const cau = [1, 2, 3].map((i) => ({ qid: `q${i}`, phan: 'I', text: `Đề rất dài của câu số ${i} `.repeat(40), choices: ['A', 'B', 'C', 'D'], vaiGoi7: i === 3 ? 'lam_lai' : 'tu_lam' }))
const banLuu = (ket: Record<string, unknown>, viTri = 1) => ({
  moLuc: Date.now(), phien: 'p1', cau: cau as never, soGoc: 3, viTri, ket, tra: '', chang: 2, goi7: undefined, dem: { daLam: 7, muc: 24 },
  moi: { qids: Object.keys(ket), tiep: 0, d0: 6, ngay: '' }, tuLam: false, goiY: false, moLoiGiai: false, msCau: {}, dhMs: 0, dhT: { v: 0, a: 0, l: 0, n: 0, lang: 0 },
  daXinLamLai: false, luotChang: 0, daHoiThay: '', hoTroCham: '',
})

describe('lưu chặng đang dở nhẹ cho máy yếu', () => {
  it('đề chỉ ghi một lần khi bộ câu không đổi; tiến độ + tóm tắt ghi mỗi lượt và không chứa đề', () => {
    const ghi = vi.spyOn(Storage.prototype, 'setItem')
    luuChangDangLam('s1', banLuu({ q1: { correct: true, answer: 'B', solution: 'lời giải dài' } }))
    luuChangDangLam('s1', banLuu({ q1: { correct: true, answer: 'B', solution: 'lời giải dài' }, q2: { correct: false, answer: 'C', omni: { luot: true } } }, 2))
    const khoa = ghi.mock.calls.map((c) => c[0])
    expect(khoa.filter((k) => k === 'omr_chang_dang_cau_s1')).toHaveLength(1)
    expect(khoa.filter((k) => k === 'omr_chang_dang_lam_s1')).toHaveLength(2)
    expect(localStorage.getItem('omr_chang_dang_lam_s1')).not.toContain('Đề rất dài')
    const cua = localStorage.getItem('omr_chang_dang_cua')!
    expect(cua).not.toContain('Đề rất dài')
    expect(cua).not.toContain('lời giải dài')
    expect(JSON.parse(cua)).toMatchObject({ sbd: 's1', ngay: ngayVn(), chang: 2, soGoc: 3, moi: { d0: 6 },
      cau: [{ qid: 'q1', vaiGoi7: 'tu_lam' }, { qid: 'q2', vaiGoi7: 'tu_lam' }, { qid: 'q3', vaiGoi7: 'lam_lai' }], ket: { q1: 1, q2: { omni: { luot: true } } } })
  })
  it('bộ câu đổi (thêm vòng làm lại) ⇒ ghi lại đề', () => {
    const ghi = vi.spyOn(Storage.prototype, 'setItem')
    luuChangDangLam('s1', banLuu({}))
    luuChangDangLam('s1', { ...banLuu({}), cau: [...cau, { ...cau[0], qid: 'q4' }] as never })
    expect(ghi.mock.calls.filter((c) => c[0] === 'omr_chang_dang_cau_s1')).toHaveLength(2)
  })
  it('mở lại app (bộ nhớ trống) ⇒ đọc đủ đề + tiến độ; lưu tiếp không ghi lại đề', () => {
    luuChangDangLam('s1', banLuu({ q1: { correct: true, answer: 'B' } }))
    datLaiGoiNgay()
    const d = docChangDangLam('s1')!
    expect(d.cau.map((c) => c.qid)).toEqual(['q1', 'q2', 'q3'])
    expect(d).toMatchObject({ phien: 'p1', viTri: 1, ket: { q1: { correct: true } } })
    expect((d as Record<string, unknown>).soCau).toBeUndefined()
    const ghi = vi.spyOn(Storage.prototype, 'setItem')
    luuChangDangLam('s1', { ...banLuu({ q1: { correct: true, answer: 'B' } }), cau: d.cau as never })
    expect(ghi.mock.calls.filter((c) => c[0] === 'omr_chang_dang_cau_s1')).toHaveLength(0)
  })
  it('bản lưu kiểu cũ (đề trong khoá chặng) vẫn đọc được; đề lệch số câu ⇒ không có chặng dở', () => {
    const cu = { ...banLuu({}), sbd: 's1', ngay: ngayVn(), luc: Date.now() }
    localStorage.setItem('omr_chang_dang_lam_s1', JSON.stringify(cu))
    expect(docChangDangLam('s1')?.cau).toHaveLength(3)
    datLaiGoiNgay(); localStorage.clear()
    localStorage.setItem('omr_chang_dang_lam_s1', JSON.stringify({ ...cu, cau: undefined, soCau: 3 }))
    localStorage.setItem('omr_chang_dang_cau_s1', JSON.stringify(cau.slice(0, 2)))
    expect(docChangDangLam('s1')).toBeNull()
    expect(localStorage.getItem('omr_chang_dang_cau_s1')).toBeNull()
  })
  it('xoá chặng dở ⇒ xoá cả khoá đề', () => {
    luuChangDangLam('s1', banLuu({}))
    xoaChangDangLam('s1')
    expect(localStorage.getItem('omr_chang_dang_cau_s1')).toBeNull()
    expect(localStorage.getItem('omr_chang_dang_lam_s1')).toBeNull()
    expect(localStorage.getItem('omr_chang_dang_cua')).toBeNull()
  })
})
