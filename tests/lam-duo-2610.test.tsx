// @vitest-environment jsdom
// LÀM CHẶNG KIỂU DUOLINGO (thầy chốt bản vẽ docs/ban-ve-duo-2610, 26/10, bỏ «Bỏ qua»): CHỈ khi <html data-trong>. Khoá: thanh tiến độ liền + chuỗi đúng
// liền (đếm ở máy, sai ⇒ 0); nút «Kiểm tra» xám tới khi chọn; bấm ⇒ tấm kết quả (đúng: «Chính xác!» + kiến thức cốt lõi; sai: «Chưa đúng» + đáp án + lý do
// phương án em chọn + lịch ôn); lời giải KHÔNG chen giữa màn (mở qua «Lời giải từng bước»); không có nút «Bỏ qua»; cùng lệnh `answer` như cũ; màn xong chặng
// có ba ô số; tắt «Trong» ⇒ màn cũ.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import ManLamBaiTap from '../src/components/hoc-tap/ManLamBaiTap'
import { goiHoa2 } from '../src/components/hoa2/api'
import type { SoHomNay } from '../src/components/hoc-tap/lam-bai'
vi.mock('../src/components/hoa2/api', async (goc) => ({ ...await goc<typeof import('../src/components/hoa2/api')>(), goiHoa2: vi.fn() }))
beforeEach(() => { document.documentElement.dataset.trong = 'hs' })
afterEach(() => { cleanup(); vi.mocked(goiHoa2).mockReset(); localStorage.clear(); delete document.documentElement.dataset.trong })

const nen = { maDe: 'de-8', version: 'v1', group: 'g', hinhAnh: [], dang: null, tenDang: 'Hợp chất chứa nitrogen', mucDo: 'hieu', sao: 0, kienThuc: [], ideas: [] }
const C1 = { ...nen, qid: 'q1', phan: 'I' as const, text: 'Số đồng phân amine bậc một tạo alcohol là', choices: ['2', '8', '3', '4'] }
const C2 = { ...nen, qid: 'q2', phan: 'I' as const, text: 'Chất nào là amine bậc hai?', choices: ['A1', 'B2', 'C3', 'D4'] }
const HN: SoHomNay = { daLam: 6, muc: 24, chang: 2, soChang: 4 }
const LG1 = { chot: 'Chỉ amine bậc một cho alcohol.', tung_pa: { B: { dung: false, vi_sao: '8 là tổng số đồng phân amine.' } } }
const mo = (ds: object[], homNay: SoHomNay | null = HN) => {
  vi.mocked(goiHoa2).mockResolvedValueOnce({ ok: true, id: 'p1', questions: ds })
  return render(<ManLamBaiTap token="tk" sbd="s1" onVe={vi.fn()} onCapNhat={vi.fn()} onChua={vi.fn()} homNay={homNay} />)
}
const kiemTra = () => screen.getByRole('button', { name: 'Kiểm tra' }) as HTMLButtonElement

describe('làm chặng kiểu Duolingo («Trong»)', () => {
  it('đầu màn: nút thoát lưu-và-về, MỘT thanh tiến độ, chuỗi 0; «Kiểm tra» xám tới khi chọn; không có «Bỏ qua»; lưới 2×2 khi phương án ngắn', async () => {
    const { container } = mo([C1, C2])
    await screen.findByText(C1.text)
    expect(screen.getByRole('button', { name: 'Lưu và về Hôm nay' })).toBeTruthy()
    expect(screen.getByRole('progressbar', { name: 'Câu 1/2 của chặng 2' }).getAttribute('aria-valuenow')).toBe('0')
    expect(screen.getByLabelText('Chuỗi 0 câu đúng liền')).toBeTruthy()
    expect(container.querySelector('.ht2-lam-vach')).toBeNull() // vạch rời cũ không còn
    expect(kiemTra().disabled).toBe(true)
    expect(screen.queryByText(/Bỏ qua/i)).toBeNull()
    expect(container.querySelector('.duo-tra[data-luoi]')).not.toBeNull()
    fireEvent.click(screen.getByRole('radio', { name: /^D/ }))
    expect(kiemTra().disabled).toBe(false)
  })

  it('sai: cùng lệnh `answer`; tấm «Chưa đúng» + đáp án + lý do phương án em chọn + lịch ôn; lời giải chỉ mở qua liên kết; chuỗi về 0', async () => {
    mo([C1, C2])
    await screen.findByText(C1.text)
    vi.mocked(goiHoa2).mockResolvedValueOnce({ correct: false, answer: 'D', solution: LG1 })
    fireEvent.click(screen.getByRole('radio', { name: /^B/ }))
    fireEvent.click(kiemTra())
    await screen.findByRole('heading', { name: 'Chưa đúng' })
    const goi = vi.mocked(goiHoa2).mock.calls.find((c) => c[0] === 'answer')!
    expect(goi[2]).toMatchObject({ session: 'p1', qid: 'q1', answer: 'B' })
    const tam = document.querySelector('.duo-ket')!
    expect(tam.getAttribute('data-tt')).toBe('sai')
    expect(tam.textContent).toContain('Đáp án: D. 4')
    expect(tam.textContent).toContain('8 là tổng số đồng phân amine.')
    expect(tam.textContent).toContain('lịch ôn 1 · 3 · 7 ngày')
    expect(tam.textContent).not.toContain('Sửa câu này') // thầy 26/10 «Bỏ câu sai từng bước»: chỉ Lời giải từng bước + Hỏi thầy
    expect(document.querySelector('.ht2-lam-loi-giai')).toBeNull() // lời giải không chen giữa màn
    fireEvent.click(screen.getByRole('button', { name: /Lời giải từng bước/ }))
    expect(screen.getByRole('dialog', { name: 'Lời giải từng bước' }).querySelector('.ht2-lam-loi-giai')).not.toBeNull()
    expect(screen.getByLabelText('Chuỗi 0 câu đúng liền')).toBeTruthy()
  })

  it('đúng: «Chính xác!» + kiến thức cốt lõi, chuỗi +1; hết chặng ⇒ «Xong chặng 2!» với Tự làm đúng · Thời gian · Hôm nay', async () => {
    mo([C1])
    await screen.findByText(C1.text)
    vi.mocked(goiHoa2).mockResolvedValueOnce({ correct: true, answer: 'D', solution: LG1 })
    fireEvent.click(screen.getByRole('radio', { name: /^D/ }))
    fireEvent.click(kiemTra())
    await screen.findByRole('heading', { name: 'Chính xác!' })
    expect(document.querySelector('.duo-ket')!.textContent).toContain('Chỉ amine bậc một cho alcohol.')
    expect(screen.getByLabelText('Chuỗi 1 câu đúng liền')).toBeTruthy()
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('1')
    fireEvent.click(screen.getByRole('button', { name: 'Tiếp tục' }))
    expect(await screen.findByRole('heading', { name: 'Xong chặng 2!' })).toBeTruthy()
    const ket = screen.getByRole('region', { name: 'Kết quả chặng' })
    expect(ket.textContent).toContain('Tự làm đúng'); expect(ket.textContent).toContain('1/1')
    expect(ket.textContent).toContain('Thời gian'); expect(ket.textContent).toContain('Hôm nay'); expect(ket.textContent).toContain('6/24')
    expect(screen.getByRole('button', { name: 'Học tiếp chặng 3' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Về Hôm nay' })).toBeTruthy()
  })

  it('tắt «Trong» ⇒ màn cũ (thanh «Chặng · Câu x/y», nút «Nộp câu»)', async () => {
    delete document.documentElement.dataset.trong
    mo([C1, C2])
    await screen.findByText(C1.text)
    expect(screen.getByRole('heading', { name: 'Chặng 2 · Câu 1/2' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Kiểm tra' })).toBeNull()
  })
})

describe('hiệu ứng đúng / sai kiểu Duolingo (thầy 26/10)', () => {
  it('đúng ⇒ màn data-tt=dung, ô đúng data-ket=dung (nảy + tia), vệt sáng trên thanh; sai ⇒ data-tt=sai, ô em chọn data-ket=sai (lắc), thanh không tăng', async () => {
    mo([C1, C2])
    await screen.findByText(C1.text)
    vi.mocked(goiHoa2).mockResolvedValueOnce({ correct: false, answer: 'D', solution: LG1 })
    fireEvent.click(screen.getByRole('radio', { name: /^B/ }))
    fireEvent.click(kiemTra())
    await screen.findByRole('heading', { name: 'Chưa đúng' })
    const goc = document.querySelector('.ht2-lam.duo')!
    expect(goc.getAttribute('data-tt')).toBe('sai')
    expect(goc.querySelector('.ht2-lam-pa[data-ket="sai"]')!.textContent).toContain('8')
    expect(goc.querySelector('.ht2-lam-pa[data-ket="dung"]')!.textContent).toContain('4')
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('0') // sai: thanh không tăng
    expect(goc.querySelector('.duo-loe')).toBeNull()
    expect(goc.querySelector('.duo-kq-bi')).not.toBeNull() // khe linh vật
    vi.mocked(goiHoa2).mockResolvedValueOnce({ correct: true, answer: 'B', solution: {} })
    fireEvent.click(screen.getByRole('button', { name: 'Tiếp tục' }))
    await screen.findByText(C2.text)
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('1') // sang câu sau mới nhích
    fireEvent.click(screen.getByRole('radio', { name: /^B/ }))
    fireEvent.click(kiemTra())
    await screen.findByRole('heading', { name: 'Chính xác!' })
    expect(goc.getAttribute('data-tt')).toBe('dung')
    expect(goc.querySelector('.duo-loe')).not.toBeNull()
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('2')
  })
  it('giảm chuyển động / máy yếu ⇒ không animation (chỉ đổi màu)', async () => {
    const { readFileSync } = await import('node:fs')
    const css = readFileSync('src/styles/trong-lam-bai.css', 'utf8')
    const khoi = css.slice(css.indexOf('── 11. HIỆU ỨNG ĐÚNG / SAI'))
    const giam = khoi.slice(khoi.indexOf('@media (prefers-reduced-motion: reduce)'))
    expect(giam).toMatch(/\.ht2-lam-pa, \.ht2-lam-y, \.ht2-lam-o-hang\)[^{]*\{ animation: none !important/)
    expect(giam).toMatch(/\.duo-hoa \{ display: none; \}/)
    expect(khoi).toMatch(/\.may-yeu[^{]*\{ animation: none; \}/)
  })
})
