// @vitest-environment jsdom
// GIỮ CHÂN KHI THOÁT + ĐỘNG VIÊN GIỮA BÀI (thầy 27/10, ảnh Duolingo «Đừng đi mà…»). Khoá: chưa chấm câu nào ⇒ X thoát thẳng; đã chấm ≥ 1 câu, chặng chưa
// xong ⇒ X / Esc / back mở tấm (lời nhắn đúng số câu còn lại), «Tiếp tục học» đóng tấm, «Thoát» mới rời màn; lời nhắn chỉ nói điều đúng với luật thưởng
// (không bao giờ «mất nguyên tử» — nguyên tử từng câu vào sổ ngay); hai câu sai liền ⇒ Bi động viên; băng «Còn 1 câu» trước câu cuối.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import ManLamBaiTap from '../src/components/hoc-tap/ManLamBaiTap'
import { goiHoa2 } from '../src/components/hoa2/api'
import { canGiuChan, chuoiHomNay, loiBangNhac, loiDongVien, loiGiuChan, type CauDaCham, type SoLieuGiuChan } from '../src/components/hoc-tap/giu-chan'
vi.mock('../src/components/hoa2/api', async (goc) => ({ ...await goc<typeof import('../src/components/hoa2/api')>(), goiHoa2: vi.fn() }))
beforeEach(() => { document.documentElement.dataset.trong = 'hs' })
afterEach(() => { cleanup(); vi.mocked(goiHoa2).mockReset(); localStorage.clear(); delete document.documentElement.dataset.trong })

const DUNG: CauDaCham = { d: true, tu: true, tinh: true }
const SAI: CauDaCham = { d: false, tu: true, tinh: true }
const goc = (x: Partial<SoLieuGiuChan> = {}): SoLieuGiuChan => ({ conLai: 4, lamLai: false, soCau: 6, daCham: [DUNG, SAI], coThuong: true, ...x })

describe('lời giữ chân (hàm thuần)', () => {
  it('đúng số câu còn lại; còn ≤ 1 ⇒ «chỉ 1 câu nữa thôi»; vòng làm lại nói câu làm lại', () => {
    expect(loiGiuChan(goc()).tieuDe).toBe('Đừng đi mà, chỉ còn 4 câu nữa là xong chặng rồi!')
    expect(loiGiuChan(goc({ conLai: 1 })).tieuDe).toBe('Đừng đi mà, chỉ 1 câu nữa thôi là xong chặng rồi!')
    expect(loiGiuChan(goc({ conLai: 0 })).tieuDe).toContain('chỉ 1 câu nữa thôi')
    const ll = loiGiuChan(goc({ lamLai: true, conLai: 2, chuoi: { so: 5, homNayDat: false } }))
    expect(ll.tieuDe).toBe('Đừng đi mà, chỉ còn 2 câu làm lại nữa thôi!')
    expect(ll.phu.join(' ')).not.toMatch(/chuỗi|mục tiêu|Hoàn hảo/) // bài đã tính xong trước vòng làm lại
  })

  it('chuỗi ngày: chỉ nhắc khi hôm nay CHƯA đạt và xong chặng chắc chắn đủ 6 câu', () => {
    expect(loiGiuChan(goc({ chuoi: { so: 5, homNayDat: false } })).phu).toContain('Hôm nay em chưa giữ chuỗi 5 ngày. Xong chặng này là giữ được.')
    expect(loiGiuChan(goc({ chuoi: { so: 5, homNayDat: true } })).phu.join(' ')).not.toContain('chuỗi')
    expect(loiGiuChan(goc({ chuoi: { so: 0, homNayDat: false } })).phu.join(' ')).not.toContain('chuỗi')
    // chặng 3 câu, hôm nay mới 2 câu, còn 1 ⇒ xong cũng chưa đủ 6 ⇒ không hứa
    expect(loiGiuChan(goc({ soCau: 3, conLai: 1, cauHomNay: 2, chuoi: { so: 5, homNayDat: false } })).phu.join(' ')).not.toContain('chuỗi')
    // hôm nay đã đủ 6 câu (bản tổng quan cũ) ⇒ không doạ
    expect(loiGiuChan(goc({ cauHomNay: 7, chuoi: { so: 5, homNayDat: false } })).phu.join(' ')).not.toContain('chuỗi')
    expect(chuoiHomNay({ so: 4, lich7: [{ ngay: '2026-10-27', kieu: 'cho' }] }, '2026-10-27')).toEqual({ so: 4, homNayDat: false })
    expect(chuoiHomNay({ so: 4, lich7: [{ ngay: '2026-10-26', kieu: 'hoc' }] }, '2026-10-27')).toBeNull() // bản của hôm qua
  })

  it('mục tiêu ngày / Hoàn hảo nói đúng; KHÔNG BAO GIỜ nói «mất nguyên tử» (nguyên tử từng câu đã vào sổ)', () => {
    expect(loiGiuChan(goc({ mucTieu: { daXong: 3, can: 4 } })).phu).toContain('Xong chặng này là em đạt mục tiêu hôm nay.')
    expect(loiGiuChan(goc({ mucTieu: { daXong: 1, can: 4 } })).phu.join(' ')).not.toContain('mục tiêu')
    expect(loiGiuChan(goc({ daCham: [DUNG, DUNG] })).phu).toContain('Em đang đúng cả 2 câu. Giữ tới cuối chặng là có thưởng Hoàn hảo.')
    expect(loiGiuChan(goc({ daCham: [DUNG, { ...DUNG, tu: false }] })).phu.join(' ')).not.toContain('Hoàn hảo')
    expect(loiGiuChan(goc({ daCham: [DUNG, DUNG], coThuong: false })).phu.join(' ')).not.toContain('Hoàn hảo')
    expect(loiGiuChan(goc({ daCham: [DUNG], soCau: 2 })).phu.join(' ')).not.toContain('Hoàn hảo') // bài < 3 câu
    for (const x of [goc(), goc({ daCham: [DUNG, DUNG], mucTieu: { daXong: 3, can: 4 }, chuoi: { so: 9, homNayDat: false } })]) expect(JSON.stringify(loiGiuChan(x))).not.toMatch(/mất|nguyên tử/)
    expect(canGiuChan(0, false)).toBe(false); expect(canGiuChan(1, false)).toBe(true); expect(canGiuChan(3, true)).toBe(false)
  })

  it('động viên sau 2 câu sai liền (câu khó nói khó); băng mở chặng và «Còn 1 câu»', () => {
    expect(loiDongVien([DUNG, SAI])).toBe('')
    expect(loiDongVien([SAI, SAI])).toBe('Không sao, sai để nhớ lâu. Câu sau đọc kĩ dữ kiện nhé.')
    expect(loiDongVien([SAI, { ...SAI, kho: true }])).toBe('Không sao, câu này khó. Đọc kĩ dữ kiện nhé.')
    expect(loiDongVien([SAI, { ...SAI, tinh: false }])).toBe('') // câu chưa được tính không đếm
    expect(loiBangNhac({ viTri: 0, soCau: 6, chang: 3, lamLai: false, daCham: false })).toBe('Chặng 3 · 6 câu · bắt đầu nào!')
    expect(loiBangNhac({ viTri: 5, soCau: 6, chang: 3, lamLai: false, daCham: false })).toBe('Còn 1 câu là xong chặng!')
    expect(loiBangNhac({ viTri: 5, soCau: 6, chang: 3, lamLai: false, daCham: true })).toBe('')
    expect(loiBangNhac({ viTri: 2, soCau: 6, chang: 3, lamLai: false, daCham: false })).toBe('')
    expect(loiBangNhac({ viTri: 0, soCau: 2, chang: null, lamLai: true, daCham: false })).toBe('')
  })
})

const nen = { maDe: 'de-8', version: 'v1', group: 'g', hinhAnh: [], dang: null, tenDang: 'Amine', mucDo: 'hieu', sao: 0, kienThuc: [], ideas: [] }
const C = (i: number) => ({ ...nen, qid: `q${i}`, phan: 'I' as const, text: `Đề câu số ${i}`, choices: ['2', '8', '3', '4'] })
const mo = (n: number) => {
  vi.mocked(goiHoa2).mockResolvedValueOnce({ ok: true, id: 'p1', questions: Array.from({ length: n }, (_, i) => C(i + 1)) })
  const onVe = vi.fn()
  render(<ManLamBaiTap token="tk" sbd="s1" onVe={onVe} onCapNhat={vi.fn()} onChua={vi.fn()} homNay={{ daLam: 6, muc: 24, chang: 2, soChang: 4 }} />)
  return onVe
}
const lamCau = async (dung: boolean) => {
  vi.mocked(goiHoa2).mockResolvedValueOnce({ correct: dung, answer: 'D' })
  fireEvent.click(screen.getByRole('radio', { name: dung ? /^D/ : /^B/ }))
  fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra' }))
  await screen.findByRole('heading', { name: dung ? 'Chính xác!' : 'Chưa đúng' })
}
const X = () => screen.getByRole('button', { name: 'Lưu và về Lộ trình' })

describe('tấm giữ chân trên màn làm chặng Duo', () => {
  it('chưa làm câu nào ⇒ X thoát thẳng, không tấm', async () => {
    const onVe = mo(3)
    await screen.findByText('Đề câu số 1')
    fireEvent.click(X())
    expect(onVe).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('đã làm 1 câu ⇒ X mở tấm «chỉ còn 2 câu»; Tiếp tục học đóng; Esc mở lại; Thoát mới rời màn', async () => {
    const onVe = mo(3)
    await screen.findByText('Đề câu số 1')
    await lamCau(true)
    fireEvent.click(screen.getByRole('button', { name: 'Tiếp tục' }))
    await screen.findByText('Đề câu số 2')
    fireEvent.click(X())
    const tam = await screen.findByRole('dialog', { name: 'Đừng đi mà, chỉ còn 2 câu nữa là xong chặng rồi!' })
    expect(onVe).not.toHaveBeenCalled()
    expect(tam.textContent).not.toMatch(/mất/)
    fireEvent.click(screen.getByRole('button', { name: 'Tiếp tục học' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.keyDown(window, { key: 'Escape' })
    await screen.findByRole('dialog')
    fireEvent.keyDown(window, { key: 'Escape' }) // đang mở ⇒ Esc = học tiếp
    expect(screen.queryByRole('dialog')).toBeNull()
    act(() => { history.back() }) // nút back Android: rời mục lịch sử canh ⇒ mở tấm (và canh lại)
    await screen.findByRole('dialog')
    fireEvent.click(screen.getByRole('button', { name: 'Thoát' }))
    expect(onVe).toHaveBeenCalledTimes(1)
  })

  it('đang ở câu cuối chưa chấm ⇒ «chỉ 1 câu nữa thôi»; băng «Còn 1 câu»; 2 câu sai liền ⇒ Bi động viên', async () => {
    mo(3)
    await screen.findByText('Đề câu số 1')
    expect(document.querySelector('.duo-nhan-nhac')?.textContent).toBe('Chặng 2 · 3 câu · bắt đầu nào!')
    await lamCau(false)
    expect(document.querySelector('.giu-dong-vien')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Tiếp tục' }))
    await screen.findByText('Đề câu số 2')
    await lamCau(false)
    expect(document.querySelector('.giu-dong-vien')?.textContent).toBe('Không sao, sai để nhớ lâu. Câu sau đọc kĩ dữ kiện nhé.')
    fireEvent.click(screen.getByRole('button', { name: 'Tiếp tục' }))
    await screen.findByText('Đề câu số 3')
    expect(document.querySelector('.duo-nhan-nhac')?.textContent).toBe('Còn 1 câu là xong chặng!')
    fireEvent.click(X())
    await screen.findByRole('dialog', { name: 'Đừng đi mà, chỉ 1 câu nữa thôi là xong chặng rồi!' })
  })
})
