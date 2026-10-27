// @vitest-environment jsdom
// MỞ CHẶNG TRƯỚC (thầy 16/10, ảnh "Chặng học của em — Đang chuẩn bị những câu phù hợp với em…": "phần này load lâu quá, quét và tối ưu tốc độ tức thì").
// Khoá:
//   · kho mở trước: mỗi token một lượt còn hạn (không gọi trùng), lấy là xoá, khác token / quá 10 phút ⇒ không dùng, lượt lỗi mạng ⇒ gọi lại một lần;
//   · màn làm bài dùng lại lượt mở trước ⇒ câu hiện NGAY, không gọi `hoc-tap-start` lần hai;
//   · xong chặng ⇒ mở trước chặng sau; bấm "Học tiếp chặng N" ⇒ câu của chặng sau có sẵn, KHÔNG gọi thêm.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import ManLamBaiTap from '../src/components/hoc-tap/ManLamBaiTap'
import { goiHoa2 } from '../src/components/hoa2/api'
import { batMoChangTruoc, layChangMoTruoc, moChangTruoc, TUOI_MO_TRUOC_MS } from '../src/components/hoc-tap/mo-chang-truoc'
vi.mock('../src/components/hoa2/api', async (goc) => ({ ...await goc<typeof import('../src/components/hoa2/api')>(), goiHoa2: vi.fn() }))
beforeEach(() => batMoChangTruoc(true))
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.mocked(goiHoa2).mockReset(); localStorage.clear(); batMoChangTruoc(false) })

const nen = { maDe: 'de-8', version: 'v1', group: 'g', hinhAnh: [], dang: null, tenDang: 'Amine', mucDo: 'hieu', sao: 0, kienThuc: [] }
const TN = { ...nen, qid: 'tn1', phan: 'I' as const, text: 'Chất nào sau đây là amine bậc hai?', choices: ['CH3NH2', '(CH3)2NH', '(CH3)3N', 'C6H5NH2'], ideas: [] }
const TN2 = { ...TN, qid: 'tn2', text: 'Chất nào là amine bậc ba?' }
const soLanMo = () => vi.mocked(goiHoa2).mock.calls.filter((c) => c[0] === 'hoc-tap-start').length

describe('kho mở chặng trước', () => {
  it('mỗi token một lượt còn hạn; lấy là xoá; khác token / quá hạn ⇒ không dùng', async () => {
    const goi = vi.fn(async () => ({ ok: true, id: 'p1', questions: [] }))
    moChangTruoc('tk', goi, 1_000)
    moChangTruoc('tk', goi, 2_000) // còn hạn ⇒ không gọi trùng
    expect(goi).toHaveBeenCalledTimes(1)
    expect(goi).toHaveBeenCalledWith('hoc-tap-start', 'tk', {}, 40)
    expect(layChangMoTruoc('khac', goi, 3_000)).toBeNull() // khác token ⇒ không dùng (và bỏ luôn)
    moChangTruoc('tk', goi, 4_000)
    expect(await layChangMoTruoc('tk', goi, 5_000)).toEqual({ ok: true, id: 'p1', questions: [] })
    expect(layChangMoTruoc('tk', goi, 5_001)).toBeNull() // dùng một lần
    moChangTruoc('tk', goi, 10_000)
    expect(layChangMoTruoc('tk', goi, 10_000 + TUOI_MO_TRUOC_MS)).toBeNull() // quá hạn
  })
  it('lượt mở trước lỗi mạng ⇒ lấy ra là tự gọi lại một lần như cũ', async () => {
    const goi = vi.fn().mockRejectedValueOnce(new Error('mất mạng')).mockResolvedValueOnce({ ok: true, id: 'p2', questions: [] })
    moChangTruoc('tk', goi, 1)
    expect(await layChangMoTruoc('tk', goi, 2)).toEqual({ ok: true, id: 'p2', questions: [] })
    expect(goi).toHaveBeenCalledTimes(2)
  })
  it('tắt (mặc định trong bộ test) ⇒ không gọi gì', () => {
    batMoChangTruoc(false)
    const goi = vi.fn(async () => ({ ok: true }))
    moChangTruoc('tk', goi)
    expect(goi).not.toHaveBeenCalled()
    expect(layChangMoTruoc('tk', goi)).toBeNull()
  })
})

describe('màn làm bài dùng lượt mở trước', () => {
  it('Hôm nay đã mở trước ⇒ câu hiện ngay, không gọi hoc-tap-start lần hai', async () => {
    vi.mocked(goiHoa2).mockResolvedValueOnce({ ok: true, id: 'p1', questions: [TN] })
    moChangTruoc('tk')
    render(<ManLamBaiTap token="tk" sbd="s1" onVe={vi.fn()} onCapNhat={vi.fn()} onChua={vi.fn()} homNay={{ daLam: 6, muc: 24, chang: 2, soChang: 4 }} />)
    await screen.findByText(TN.text)
    expect(soLanMo()).toBe(1)
  })
  it('xong chặng ⇒ mở trước chặng sau; bấm "Học tiếp chặng 3" ⇒ có câu, không gọi thêm', async () => {
    vi.mocked(goiHoa2).mockResolvedValueOnce({ ok: true, id: 'p1', questions: [TN] })
    render(<ManLamBaiTap token="tk" sbd="s1" onVe={vi.fn()} onCapNhat={vi.fn()} onChua={vi.fn()} homNay={{ daLam: 6, muc: 24, chang: 2, soChang: 4 }} />)
    await screen.findByText(TN.text)
    fireEvent.click(screen.getByRole('radio', { name: /\(CH3\)2NH/ }))
    vi.mocked(goiHoa2).mockResolvedValueOnce({ ok: true, correct: true, answer: 'B', solution: '' })
    fireEvent.click(screen.getByRole('button', { name: 'Nộp câu · đã chọn B' }))
    vi.mocked(goiHoa2).mockResolvedValueOnce({ ok: true, id: 'p2', questions: [TN2] }) // lượt mở trước chặng sau
    fireEvent.click(await screen.findByRole('button', { name: /Kết thúc chặng/ }))
    await screen.findByRole('heading', { name: 'Đã lưu chặng 2' })
    expect(soLanMo()).toBe(2) // lượt đầu + lượt mở trước ngay khi xong chặng
    fireEvent.click(screen.getByRole('button', { name: /Học tiếp chặng 3/ }))
    await screen.findByText(TN2.text)
    expect(soLanMo()).toBe(2) // dùng lại lượt mở trước
  })
})

describe('27/10 (ảnh thầy) — chặng rỗng vì đã xong phần hôm nay KHÔNG là lỗi', () => {
  it('máy chủ trả questions:[] + message ⇒ thẻ trạng thái + nút về trang chính (làm mới số), không «Thử lại», không role=alert', async () => {
    const CHU = 'Em đã hoàn thành phần được xếp hôm nay. Lỗi chưa kiểm chứng vẫn được giữ để học tiếp.'
    vi.mocked(goiHoa2).mockResolvedValue({ ok: true, questions: [], message: CHU })
    const onVe = vi.fn(), onCapNhat = vi.fn()
    render(<ManLamBaiTap token="tk" sbd="s1" onVe={onVe} onCapNhat={onCapNhat} onChua={vi.fn()} />)
    const the = (await screen.findByText(CHU, undefined, { timeout: 3000 })).closest('[role=status]')
    expect(the?.getAttribute('data-tt')).toBe('xong')
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.queryByText('Thử lại')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /^Về / }))
    expect(onCapNhat).toHaveBeenCalledTimes(1)
    expect(onVe).toHaveBeenCalledTimes(1)
  })
})
