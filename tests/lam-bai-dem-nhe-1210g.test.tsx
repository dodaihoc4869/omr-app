// @vitest-environment jsdom
// KHẨN 12/10 22h30 (thầy: "tối ưu triệt để máy chủ cho học sinh làm bài tập giờ cao điểm phải mượt nhất và ổn định nhất"). Số đo D1 thật: mỗi câu em nộp,
// màn làm bài gọi lại CẢ sảnh (`hoc-tap-sanh` ⇒ `lapGoi7` ~25 truy vấn) chỉ để cập nhật ô "đã làm/M câu hôm nay"; sảnh đang bay mà gọi tiếp thì máy chủ
// vẫn lập đủ từng lượt. Khoá:
//  · nhánh Gói 7: số hôm nay lấy từ `hoc-tap-start` lúc mở chặng, sau mỗi câu gọi lệnh nhẹ `hoc-tap-dem` — KHÔNG nạp lại sảnh sau mỗi câu;
//  · sảnh nạp lại ĐÚNG MỘT lần khi xong chặng, hoặc khi rời màn mà đã nộp câu;
//  · lượt `hoc-tap-dem` về muộn (cũ hơn) không đè số mới hơn; lỗi ⇒ giữ số cũ (không bịa);
//  · nhánh không có Gói 7 ⇒ y như cũ (nạp lại sảnh sau mỗi câu).
//  · `useSanhHoa2`: đang có lượt bay ⇒ `taiLai` không gửi song song, về xong gửi đúng một lượt nữa.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react'
import ManLamBaiTap from '../src/components/hoc-tap/ManLamBaiTap'
import { goiHoa2, useSanhHoa2 } from '../src/components/hoa2/api'
import { soHomNay, soHomNayGoi7, type SoHomNay } from '../src/components/hoc-tap/lam-bai'
import { docSanh } from '../src/components/hoa2/api'
vi.mock('../src/components/hoa2/api', async (goc) => ({ ...await goc<typeof import('../src/components/hoa2/api')>(), goiHoa2: vi.fn() }))
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.mocked(goiHoa2).mockReset(); vi.unstubAllGlobals(); localStorage.clear() })

const nen = { maDe: 'de-8', version: 'v1', group: 'g', hinhAnh: [], dang: null, tenDang: 'Amine', mucDo: 'hieu', sao: 0, kienThuc: [] }
const TN = (qid: string) => ({ ...nen, qid, phan: 'I' as const, text: `Câu ${qid}: chất nào là amine bậc hai?`, choices: ['CH3NH2', '(CH3)2NH', '(CH3)3N', 'C6H5NH2'], ideas: [] })
const goi7 = (daLam: number, muc = 24) => ({ bat: true, ngay: '2026-10-12', toiThieu: muc, daLamHomNay: daLam, tuLamCon: 9, tiepCanCon: 2, thieuPhu: 0, thieuNgay: 0, canHoTro: false, kienThucCu: { tong: 0, dat: 0, tyLe: null }, goi: [{ id: 'g', ten: 'Bài 8. Amine', batDau: '2026-10-10', han: '2026-10-16', tong: 40, daGap: 10, con: 30, quota: 6, gapHomNay: 2, quaHan: false, canBoSung: 0, to: ['de-8'] }], diemDaDo: [] })
// Số Hôm nay của cổng (sảnh) CŨ hơn số `hoc-tap-start` trả — giờ cao điểm sảnh về chậm.
const HN_CU: SoHomNay = { daLam: 6, muc: 24, chang: 2, soChang: 4 }
const lenh = () => vi.mocked(goiHoa2).mock.calls.map((c) => c[0])
const nopB = async () => {
  fireEvent.click(screen.getByRole('radio', { name: /\(CH3\)2NH/ }))
  fireEvent.click(screen.getByRole('button', { name: 'Nộp câu · đã chọn B' }))
}

describe('phép thuần soHomNayGoi7 — đúng luật nhánh Gói 7 của soHomNay', () => {
  it('(đã làm, M) ⇒ cùng kết quả soHomNay của sảnh Gói 7; số hỏng ⇒ null', () => {
    for (const [d, m] of [[0, 24], [5, 24], [6, 24], [13, 24], [24, 24], [30, 32], [31, 31]]) {
      expect(soHomNayGoi7(d, m)).toEqual(soHomNay(docSanh({ cheDo2: true, theLuc: { con: 1, tong: m }, goi7: goi7(d, m) })))
    }
    expect(soHomNayGoi7(3, 0)).toBeNull(); expect(soHomNayGoi7(-1, 24)).toBeNull(); expect(soHomNayGoi7(NaN, 24)).toBeNull()
  })
})

describe('màn làm bài nhánh Gói 7', () => {
  const mo = (cau: object[], homNay: SoHomNay | null = HN_CU, start: Record<string, unknown> = { goi7: goi7(12) }) => {
    vi.mocked(goiHoa2).mockResolvedValueOnce({ ok: true, id: 'p1', questions: cau, ...start })
    const onCapNhat = vi.fn(), onVe = vi.fn()
    const r = render(<ManLamBaiTap token="tk" sbd="s1" onVe={onVe} onCapNhat={onCapNhat} onChua={vi.fn()} homNay={homNay} />)
    return { ...r, onCapNhat, onVe }
  }
  it('mở chặng: số + chặng lấy từ hoc-tap-start (12/24 ⇒ chặng 3), không lấy số sảnh cũ 6/24', async () => {
    mo([TN('a'), TN('b')])
    await screen.findByText(/Câu a:/)
    expect(screen.getByText('12/24')).toBeTruthy()
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Chặng 3 · Câu 1/2')
  })
  it('nộp câu ⇒ gọi hoc-tap-dem (nhẹ), KHÔNG nạp lại sảnh; số trên thanh nhảy theo máy chủ', async () => {
    const { onCapNhat } = mo([TN('a'), TN('b')])
    await screen.findByText(/Câu a:/)
    vi.mocked(goiHoa2).mockResolvedValueOnce({ ok: true, correct: true, answer: 'B', solution: '' })
    vi.mocked(goiHoa2).mockResolvedValueOnce({ ok: true, ngay: '2026-10-12', daLamHomNay: 13, toiThieu: 24 })
    await nopB()
    await screen.findByText('13/24')
    expect(lenh()).toEqual(['hoc-tap-start', 'answer', 'hoc-tap-dem'])
    expect(onCapNhat).not.toHaveBeenCalled()
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Chặng 3 · Câu 1/2') // chặng chốt lúc mở
  })
  it('xong chặng ⇒ nạp lại sảnh ĐÚNG MỘT lần; thẻ Hôm nay dùng số mới nhất', async () => {
    const { onCapNhat, unmount } = mo([TN('a')])
    await screen.findByText(/Câu a:/)
    vi.mocked(goiHoa2).mockResolvedValueOnce({ ok: true, correct: true, answer: 'B', solution: '' })
    vi.mocked(goiHoa2).mockResolvedValueOnce({ ok: true, ngay: '2026-10-12', daLamHomNay: 13, toiThieu: 24 })
    await nopB()
    await screen.findByText('13/24')
    fireEvent.click(await screen.findByRole('button', { name: /Kết thúc chặng/ }))
    expect(onCapNhat).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Hôm nay 13/24 câu')).toBeTruthy()
    unmount()
    expect(onCapNhat).toHaveBeenCalledTimes(1) // đã nạp khi xong chặng ⇒ rời màn không nạp lần nữa
  })
  it('rời màn giữa chặng sau khi đã nộp ⇒ nạp lại sảnh một lần; chưa nộp câu nào ⇒ không nạp', async () => {
    const a = mo([TN('a'), TN('b')])
    await screen.findByText(/Câu a:/)
    a.unmount()
    expect(a.onCapNhat).not.toHaveBeenCalled()
    cleanup(); vi.mocked(goiHoa2).mockReset()
    const b = mo([TN('a'), TN('b')])
    await screen.findByText(/Câu a:/)
    vi.mocked(goiHoa2).mockResolvedValueOnce({ ok: true, correct: true, answer: 'B', solution: '' })
    vi.mocked(goiHoa2).mockResolvedValueOnce({ ok: true, ngay: '2026-10-12', daLamHomNay: 13, toiThieu: 24 })
    await nopB()
    await screen.findByText('13/24')
    b.unmount()
    expect(b.onCapNhat).toHaveBeenCalledTimes(1)
  })
  it('hoc-tap-dem lỗi / thiếu số ⇒ giữ số cũ (không bịa); M null ⇒ giữ M lúc mở chặng', async () => {
    mo([TN('a'), TN('b')])
    await screen.findByText(/Câu a:/)
    vi.mocked(goiHoa2).mockResolvedValueOnce({ ok: true, correct: true, answer: 'B', solution: '' })
    vi.mocked(goiHoa2).mockRejectedValueOnce(new Error('Máy chủ phản hồi chậm'))
    await nopB()
    await waitFor(() => expect(lenh()).toContain('hoc-tap-dem'))
    expect(screen.getByText('12/24')).toBeTruthy()
    fireEvent.click(await screen.findByRole('button', { name: /Câu tiếp theo/ }))
    await screen.findByText(/Câu b:/)
    vi.mocked(goiHoa2).mockResolvedValueOnce({ ok: true, correct: true, answer: 'B', solution: '' })
    vi.mocked(goiHoa2).mockResolvedValueOnce({ ok: true, ngay: '2026-10-12', daLamHomNay: 14, toiThieu: null })
    await nopB()
    await screen.findByText('14/24')
  })
  it('lượt hoc-tap-dem về muộn (cũ hơn) không đè số của lượt mới hơn', async () => {
    mo([TN('a'), TN('b')])
    await screen.findByText(/Câu a:/)
    let traCu: (v: Record<string, unknown>) => void = () => {}
    vi.mocked(goiHoa2).mockResolvedValueOnce({ ok: true, correct: true, answer: 'B', solution: '' })
    vi.mocked(goiHoa2).mockReturnValueOnce(new Promise((r) => { traCu = r }))
    await nopB()
    fireEvent.click(await screen.findByRole('button', { name: /Câu tiếp theo/ }))
    await screen.findByText(/Câu b:/)
    vi.mocked(goiHoa2).mockResolvedValueOnce({ ok: true, correct: true, answer: 'B', solution: '' })
    vi.mocked(goiHoa2).mockResolvedValueOnce({ ok: true, ngay: '2026-10-12', daLamHomNay: 14, toiThieu: 24 })
    await nopB()
    await screen.findByText('14/24')
    await act(async () => { traCu({ ok: true, ngay: '2026-10-12', daLamHomNay: 13, toiThieu: 24 }) })
    expect(screen.getByText('14/24')).toBeTruthy()
  })
  it('nhánh KHÔNG có Gói 7 ⇒ y như cũ: nạp lại sảnh sau mỗi câu, không gọi hoc-tap-dem', async () => {
    const { onCapNhat } = mo([TN('a'), TN('b')], HN_CU, {})
    await screen.findByText(/Câu a:/)
    expect(screen.getByText('6/24')).toBeTruthy()
    vi.mocked(goiHoa2).mockResolvedValueOnce({ ok: true, correct: true, answer: 'B', solution: '' })
    await nopB()
    await waitFor(() => expect(onCapNhat).toHaveBeenCalledTimes(1))
    expect(lenh()).not.toContain('hoc-tap-dem')
  })
})

describe('useSanhHoa2 — không gửi lượt sảnh song song', () => {
  it('đang có lượt bay: taiLai ×3 ⇒ chưa gửi thêm; lượt bay về ⇒ gửi ĐÚNG MỘT lượt nữa', async () => {
    const cho: ((v: Response) => void)[] = []
    // Cấu hình địa chỉ máy chủ (`/cau-hinh.json`) trả ngay; chỉ lượt SẢNH bị giữ lại để đếm.
    const goc = vi.fn((url: string) => url.endsWith('/cau-hinh.json') ? Promise.resolve(new Response('{}', { status: 200 })) : new Promise<Response>((r) => { cho.push(r) }))
    vi.stubGlobal('fetch', goc)
    const f = { get mock() { return { calls: goc.mock.calls.filter((c) => !String(c[0]).endsWith('/cau-hinh.json')) } } }
    const soLuot = () => f.mock.calls.length
    const tra = () => new Response(JSON.stringify({ ok: true, cheDo2: false }), { status: 200, headers: { 'content-type': 'application/json' } })
    const { result } = renderHook(() => useSanhHoa2('tk', 's-gop', 0, true))
    await waitFor(() => expect(soLuot()).toBe(1))
    act(() => { result.current.taiLai(); result.current.taiLai(); result.current.taiLai() })
    await new Promise((r) => setTimeout(r, 30))
    expect(soLuot()).toBe(1)
    await act(async () => { cho[0]!(tra()) })
    await waitFor(() => expect(soLuot()).toBe(2))
    await act(async () => { cho[1]!(tra()) })
    await new Promise((r) => setTimeout(r, 30))
    expect(soLuot()).toBe(2)
    // Không còn lượt bay ⇒ taiLai gửi ngay.
    act(() => { result.current.taiLai() })
    await waitFor(() => expect(soLuot()).toBe(3))
    await act(async () => { cho[2]!(tra()) })
  })
})
