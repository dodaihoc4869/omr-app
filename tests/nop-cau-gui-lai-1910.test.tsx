// @vitest-environment jsdom
// NỘP CÂU KẸT ĐƯỜNG TRUYỀN (thầy 19/10, ảnh 18/10 21:56 "Chặng 4 · Câu 1/6 — Máy chủ phản hồi chậm hoặc mạng gián đoạn. Em thử lại nhé."): cả cao điểm 18/10
// máy chủ 0 lỗi, 99% lượt < 0,73 giây (run 39184928429) — lượt ấy kẹt đường truyền, em chờ đủ 40 giây rồi mới thấy lỗi. Lệnh `answer` chống trùng theo biên
// nhận (nộp lại trả kết quả lần đầu) ⇒ nay mỗi lượt chờ 15 giây, lỗi đường truyền tự gửi lại tối đa 2 lần; lỗi máy chủ trả lời thì báo ngay như cũ.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import ManLamBaiTap from '../src/components/hoc-tap/ManLamBaiTap'
import { goiHoa2, guiLaiKhiKetMang, LoiHoa2 } from '../src/components/hoa2/api'
vi.mock('../src/components/hoa2/api', async (goc) => ({ ...await goc<typeof import('../src/components/hoa2/api')>(), goiHoa2: vi.fn() }))
afterEach(() => { cleanup(); vi.mocked(goiHoa2).mockReset(); localStorage.clear() })

const TN = { maDe: 'de-8', version: 'v1', group: 'g', hinhAnh: [], dang: null, tenDang: 'Amine', mucDo: 'hieu', sao: 0, kienThuc: [], qid: 'tn1', phan: 'I' as const, text: 'Chất nào sau đây là amine bậc hai?', choices: ['CH3NH2', '(CH3)2NH', '(CH3)3N', 'C6H5NH2'], ideas: [] }
const lanNop = () => vi.mocked(goiHoa2).mock.calls.filter((c) => c[0] === 'answer')
const HET_GIO = () => new LoiHoa2('Máy chủ phản hồi chậm hoặc mạng gián đoạn. Em thử lại nhé.', 'het_gio')

describe('guiLaiKhiKetMang', () => {
  it('lỗi đường truyền ⇒ gửi lại; lỗi máy chủ trả lời ⇒ báo ngay, không gửi lại', async () => {
    const goi = vi.fn().mockRejectedValueOnce(HET_GIO()).mockRejectedValueOnce(new LoiHoa2('Chưa kết nối được máy chủ.', 'mat_mang')).mockResolvedValueOnce({ ok: true, id: 'x' })
    expect(await guiLaiKhiKetMang(() => goi('answer', 't', { a: 1 }, 15))).toEqual({ ok: true, id: 'x' })
    expect(goi).toHaveBeenCalledTimes(3)
    expect(goi).toHaveBeenNthCalledWith(3, 'answer', 't', { a: 1 }, 15)
    const loiMayChu = vi.fn().mockRejectedValue(new LoiHoa2('Câu không thuộc lượt học.'))
    await expect(guiLaiKhiKetMang(() => loiMayChu('answer', 't', {}, 15))).rejects.toThrow('Câu không thuộc lượt học.')
    expect(loiMayChu).toHaveBeenCalledTimes(1)
    const hong = vi.fn().mockRejectedValue(HET_GIO())
    await expect(guiLaiKhiKetMang(() => hong('answer', 't', {}, 15))).rejects.toThrow('Máy chủ phản hồi chậm')
    expect(hong).toHaveBeenCalledTimes(3) // 1 lần đầu + 2 lần gửi lại rồi mới báo em
  })
})

describe('màn làm bài: nộp câu kẹt mạng', () => {
  it('lượt đầu hết giờ ⇒ tự gửi lại cùng đáp án, em thấy kết quả, không thấy báo lỗi', async () => {
    vi.mocked(goiHoa2).mockResolvedValueOnce({ ok: true, id: 'p1', questions: [TN] })
    render(<ManLamBaiTap token="tk" sbd="s1" onVe={vi.fn()} onCapNhat={vi.fn()} onChua={vi.fn()} homNay={{ daLam: 6, muc: 24, chang: 2, soChang: 4 }} />)
    await screen.findByText(TN.text)
    fireEvent.click(screen.getByRole('radio', { name: /\(CH3\)2NH/ }))
    vi.mocked(goiHoa2).mockRejectedValueOnce(HET_GIO()).mockResolvedValueOnce({ ok: true, correct: true, answer: 'B', solution: '' })
    fireEvent.click(screen.getByRole('button', { name: 'Nộp câu · đã chọn B' }))
    await screen.findByRole('button', { name: /Kết thúc chặng/ })
    expect(lanNop()).toHaveLength(2)
    expect(lanNop()[1]![2]).toEqual(lanNop()[0]![2]) // gửi lại ĐÚNG lượt nộp ấy (cùng phiên, câu, đáp án)
    expect(screen.queryByText(/phản hồi chậm/)).toBeNull()
  })
})
