// HÔM NAY «MỘT TRANG» + MENU DỌC (Điểm danh, A.I Đỗ Đại Học) của app học sinh — bản vẽ ve-moi/hs-mot-trang*.html, thầy chốt 26/10.
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import { NHIP_EM_LUOI } from '../scripts/chup-v2/gia/nhip-hoc-em'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { createRef } from 'react'
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-chu' }))
const phanHoi = vi.hoisted(() => vi.fn())
vi.mock('../src/lib/phan-hoi', () => ({ phanHoi }))
import { MenuDocTrong, MotTrangHs, type PropsMotTrang } from '../src/components/hoc-tap/TrongHs'
import type { TomTatKiemTra } from '../src/lib/kiem-tra-ca-nhan'

const traLoi = (o: unknown) => new Response(JSON.stringify(o), { status: 200, headers: { 'content-type': 'application/json' } })
const noop = () => {}
const goc = (them: Partial<PropsMotTrang> = {}): PropsMotTrang => ({
  so: { daLam: 12, muc: 30, chang: 3, soChang: 5 } as PropsMotTrang['so'], dangTai: false, tenBai: 'Ester – Lipid', viec: 'Hiểu · Chặng 3/5',
  onHoc: noop, khoaHoc: false, hetCau: false, coCa: false, onThi: noop, soSua: 5, onChua: noop, ngayKiem: false, soBaiTap: 1, coBaiTap: true, onBaiTap: noop, ghi: [], ...them,
})
const mo = Date.parse('2026-10-26T00:00:00+07:00')
const KIEM: TomTatKiemTra = { id: 'k', ngay: '2026-10-26', moLuc: mo, hanLuc: mo + 86400_000, serverNow: mo + 3600_000, trangThai: 'can_lam', homNay: true, baiNgayToiThieu: 12,
  tong: 28, daTra: 0, con: 28, soChang: 4, phut: 50, soBai: 6, tongKienThuc: 10, phuDe: 10, nguonDayDu: true, lyDo: '', thieuNguon: 0, diem: null, nopLuc: null }
/** Kiểm tra ôn tập của NGÀY KHÁC (chưa tới) ⇒ không khoá chặng, nút kiểm tra đứng sau các chặng như cũ. */
const KIEM_SAU: TomTatKiemTra = { ...KIEM, ngay: '2026-10-28', homNay: false, trangThai: 'sap_den' as TomTatKiemTra['trangThai'] }

afterEach(() => { cleanup(); vi.unstubAllGlobals(); window.history.replaceState(null, '', '/'); try { localStorage.clear() } catch { /* bỏ qua */ } })

// 26/10 tối (thầy chốt bản vẽ ve-moi/dm-*.html — hướng Duolingo + chất Hoá): Hôm nay «Một trang» nay là LỘ TRÌNH — con đường chặng giữ ĐÚNG thứ tự việc
// (học → Kiểm tra ôn tập → Tự sửa lỗi → Bài tập về nhà; ca đang mở / ngày chỉ kiểm tra như cũ), cùng nút, cùng lệnh. Luyện tập / Thành tích là hai mục còn lại.
const duong = () => screen.getByRole('list', { name: 'Lộ trình hôm nay' })
const nut = () => within(duong()).getAllByRole('listitem').map((li) => (li.firstElementChild as HTMLElement))
const HS = { lop: '12A1', onXemLai: noop, onTuLuyen: noop, onLichSu: noop, onKetQua: noop }

describe('Lộ trình (Hôm nay kiểu Duolingo)', () => {
  it('nút Kiểm tra ôn tập / Tự sửa lỗi KHÔNG còn viên chữ cạnh nút (thầy 27/10: đè giám thị); huy hiệu số = câu CÒN PHẢI SỬA HÔM NAY (thầy duyệt 28/10: không còn «99+» tổng nợ)', async () => {
    const { container, rerender } = render(<MotTrangHs {...goc({ soSua: 200, kiem: KIEM_SAU })} />)
    // chưa có việc hôm nay (chưa tải danh sách) ⇒ tối đa 12 câu của ngày; huy hiệu vẽ khi mảnh việc hôm nay đã nạp (không nháy số)
    const sua = within(duong()).getByRole('button', { name: 'Tự sửa lỗi: hôm nay còn 12 câu' })
    expect(sua.querySelector('.da-nhan')).toBeNull()
    await waitFor(() => expect(sua.querySelector('.da-dem')?.textContent).toBe('12'), { timeout: 5000 }) // mảnh việc hôm nay nạp lười: máy bận (chạy song song nhiều tệp) có thể quá 1 s
    for (const n of container.querySelectorAll('.da-nut[data-loai="kiem"], .da-nut[data-loai="sua"]')) expect(n.querySelector('.da-nhan')).toBeNull()
    rerender(<MotTrangHs {...goc({ soSua: 7, kiem: KIEM_SAU })} />)
    expect(within(duong()).getByRole('button', { name: 'Tự sửa lỗi: hôm nay còn 7 câu' }).querySelector('.da-dem')!.textContent).toBe('7')
    expect(container.textContent).not.toContain('99+')
  })
  it('SỐ HÔM NAY theo việc hôm nay (cùng hàm màn Tự sửa lỗi, bản máy chủ `viecNgay`): giảm khi em xong câu; xong cả ngày ⇒ nút ✓, không còn là việc chính', async () => {
    localStorage.setItem('omr_student_portal_auth', JSON.stringify({ sbd: 'HS9', token: 'tk' }))
    const ngay = new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10)
    const muc = ['D1', 'D2', 'D3'].map((d, i) => ({ dotId: d, qid: `Q${i}`, trangThai: 'can_chan_doan' }))
    const goi = async (x: string[]) => {
      const { xoaNhoTuSua, taiTuSuaLoi } = await import('../src/lib/tu-sua-loi')
      xoaNhoTuSua()
      vi.stubGlobal('fetch', vi.fn(async (u: string) => traLoi(String(u).endsWith('/co') ? { ok: true }
        : String(u).endsWith('/danh-sach') ? { ok: true, ds: muc, dem: { tong: 40, can: 40, cho: 0, xong: 0 }, kiemLaiHoiThay: [],
          viecNgay: { n: ngay, m: muc.map((m) => ({ q: m.qid, d: m.dotId, t: m.trangThai, l: 'goc' })), x, them: 0 } } : { ok: true })))
      await taiTuSuaLoi('tk', { moi: true })
    }
    await goi(['D1'])
    const { rerender } = render(<MotTrangHs {...goc({ soSua: 40, token: 'tk', so: { daLam: 30, muc: 30, chang: 5, soChang: 5 } as PropsMotTrang['so'] })} />)
    await waitFor(() => expect(within(duong()).getByRole('button', { name: 'Tự sửa lỗi: hôm nay còn 2 câu' }).querySelector('.da-dem')!.textContent).toBe('2'))
    expect(within(duong()).getByRole('button', { name: 'Tự sửa lỗi: hôm nay còn 2 câu' }).getAttribute('data-tt')).toBe('dang')
    await act(async () => { await goi(['D1', 'D2', 'D3']) })
    rerender(<MotTrangHs {...goc({ soSua: 40, token: 'tk', so: { daLam: 30, muc: 30, chang: 5, soChang: 5 } as PropsMotTrang['so'] })} />)
    const xong = await waitFor(() => within(duong()).getByRole('button', { name: 'Tự sửa lỗi: hôm nay đã sửa xong' }))
    expect(xong.getAttribute('data-tt')).toBe('xong')
    expect(xong.querySelector('.da-dem')).toBeNull()
    // Bài tập về nhà thành việc chính; thẻ của nút đã xong vẫn cho sửa thêm
    expect(screen.getByRole('button', { name: 'Bài tập về nhà' }).getAttribute('data-tt')).toBe('dang')
    fireEvent.click(xong)
    expect(within(screen.getByRole('dialog', { name: 'Tự sửa lỗi' })).getByRole('button', { name: 'Sửa thêm' })).toBeTruthy()
  })
  it('bấm nút Lộ trình KHÔNG vào thẳng: thẻ bật ra (role dialog) đúng màu nút, focus vào nút chính, Esc đóng + trả focus; một thẻ một lúc; chạm ngoài đóng (thầy 27/10)', () => {
    const onHoc = vi.fn(), onChua = vi.fn()
    render(<MotTrangHs {...goc({ onHoc, onChua, hs: HS })} />)
    const hoc = screen.getByRole('button', { name: 'Học tiếp · 18 câu' })
    expect(hoc.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(hoc)
    expect(onHoc).not.toHaveBeenCalled()
    expect(hoc.getAttribute('aria-expanded')).toBe('true')
    let the = screen.getByRole('dialog', { name: 'Ester – Lipid' })
    expect(the.getAttribute('data-sac')).toBe('dung')
    expect(the.textContent).toContain('Chặng 3 / 5 · 6 câu')
    expect(document.activeElement).toBe(within(the).getByRole('button', { name: 'Bắt đầu' }))
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(hoc)
    // chặng khoá: thẻ xám, không có nút bắt đầu
    fireEvent.click(screen.getByRole('button', { name: 'Chặng 4: chưa mở' }))
    the = screen.getByRole('dialog')
    expect(the.getAttribute('data-sac')).toBe('khoa')
    expect(the.textContent).toContain('Hoàn thành các chặng trước để mở khoá')
    expect(within(the).queryByRole('button')).toBeNull()
    // bấm nút khác ⇒ chỉ thẻ mới mở; Tự sửa lỗi đỏ, «Sửa ngay» gọi đúng lệnh cũ
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Tự sửa lỗi: hôm nay còn 5 câu' }))
    fireEvent.click(screen.getByRole('button', { name: 'Tự sửa lỗi: hôm nay còn 5 câu' }))
    expect(screen.getAllByRole('dialog')).toHaveLength(1)
    the = screen.getByRole('dialog', { name: 'Tự sửa lỗi' })
    expect(the.getAttribute('data-sac')).toBe('sai')
    expect(the.textContent).toContain('5 câu cần sửa')
    fireEvent.click(within(the).getByRole('button', { name: 'Sửa ngay' }))
    expect(onChua).toHaveBeenCalledOnce()
    expect(screen.queryByRole('dialog')).toBeNull()
    // rương: nói điều kiện sáng; chạm ra ngoài ⇒ đóng
    fireEvent.click(screen.getByRole('button', { name: 'Rương hôm nay' }))
    expect(screen.getByRole('dialog', { name: 'Rương hôm nay' }).textContent).toContain('còn 3 chặng')
    fireEvent.pointerDown(document.body)
    expect(screen.queryByRole('dialog')).toBeNull()
  })
  it('lời Bi NHẮC MỘT LẦN mỗi ngày (thầy 27/10): giữ ~4 s rồi thu gọn và gỡ; mở lại trong ngày ⇒ không hiện; nội dung đổi hẳn (đủ mức) ⇒ hiện lại một lần', () => {
    vi.useFakeTimers()
    try {
      const a = render(<MotTrangHs {...goc()} />)
      expect(a.container.querySelector('.bi-loi')).not.toBeNull()
      act(() => { vi.advanceTimersByTime(4800) })
      expect(a.container.querySelector('.bi-loi-boc[data-thu]')).not.toBeNull()
      act(() => { vi.advanceTimersByTime(500) })
      expect(a.container.querySelector('.bi-loi')).toBeNull()
      a.unmount()
      const b = render(<MotTrangHs {...goc({ so: { daLam: 14, muc: 30, chang: 3, soChang: 5 } as PropsMotTrang['so'] })} />)
      expect(b.container.querySelector('.bi-loi')).toBeNull() // số câu còn lại đổi KHÔNG phải nội dung mới
      b.unmount()
      const c = render(<MotTrangHs {...goc({ so: { daLam: 30, muc: 30, chang: 5, soChang: 5 } as PropsMotTrang['so'] })} />)
      expect(c.container.querySelector('.bi-loi-bong .ht2-an')!.textContent).toMatch(/^Đủ mức rồi!/)
    } finally { vi.useRealTimers() }
  })
  it('lời Bi trọn câu (soát 27/10: ảnh chụp lúc đang gõ trông «cụt» ở chữ «là»): câu đủ ý và gõ xong trong ≤ 0,7 s', () => {
    vi.useFakeTimers()
    try {
      const { container } = render(<MotTrangHs {...goc()} />)
      const bong = container.querySelector('.bi-loi-bong')!
      expect(bong.querySelector('.ht2-an')!.textContent).toBe('Học tiếp nhé! Còn 18 câu nữa là đủ mức hôm nay.')
      act(() => { vi.advanceTimersByTime(750) })
      expect(bong.querySelector('.bi-loi-con')!.textContent).toBe('')
      expect(bong.querySelector('[aria-hidden="true"]')!.textContent).toBe('Học tiếp nhé! Còn 18 câu nữa là đủ mức hôm nay.')
    } finally { vi.useRealTimers() }
  })
  it('đang học: chặng hiện tại là nút «Học tiếp · 18 câu» có bong bóng; sau các chặng là Kiểm tra ôn tập → Tự sửa lỗi → Bài tập về nhà; thanh số trên', () => {
    const onHoc = vi.fn()
    render(<MotTrangHs {...goc({ kiem: KIEM_SAU, onKiemTra: noop, onHoc, hs: HS })} />)
    const ds = nut()
    // thầy 27/10: Kiểm tra ôn tập LUÔN đầu đường; Tự sửa lỗi chèn GIỮA hành trình (sau chặng mới thứ 2 kể từ chỗ đang học)
    expect(ds.map((n) => n.getAttribute('aria-label'))).toEqual(['Kiểm tra ôn tập: Thứ Tư 28/10 · còn 2 ngày', 'Chặng 1: đã xong', 'Chặng 2: đã xong', 'Học tiếp · 18 câu', 'Rương hôm nay',
      'Chặng 4: chưa mở', 'Tự sửa lỗi: hôm nay còn 5 câu', 'Chặng 5: chưa mở', 'Bài tập về nhà'])
    fireEvent.click(screen.getByRole('button', { name: 'Học tiếp · 18 câu' }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Bắt đầu' }))
    expect(onHoc).toHaveBeenCalledOnce()
    expect(screen.getByRole('button', { name: 'Học tiếp · 18 câu' }).textContent).toContain('Bắt đầu') // chặng 3 chưa làm câu nào
    expect(screen.getByLabelText('12/30 câu hôm nay')).toBeTruthy()
    expect(screen.getByLabelText('Khối 12')).toBeTruthy()
    expect(screen.getByText('Ester – Lipid')).toBeTruthy()
    expect(screen.getByText('2/5 chặng')).toBeTruthy()
  })

  it('ca kiểm tra đang mở ⇒ băng ca + nút Vào ca kiểm tra ở đầu, đường chặng mờ đi', () => {
    const onThi = vi.fn()
    render(<MotTrangHs {...goc({ coCa: true, onThi })} />)
    fireEvent.click(within(screen.getByRole('region', { name: 'Ca kiểm tra đang mở' })).getByRole('button', { name: /Vào ca kiểm tra/ }))
    expect(onThi).toHaveBeenCalledOnce()
    expect(duong().closest('.da-duong')!.hasAttribute('data-mo-di')).toBe(true)
  })

  it('đủ mức ⇒ băng «Đủ 30/30 câu hôm nay!», Tự sửa lỗi là nút hiện tại, «Học thêm câu mới» thành liên kết', () => {
    const onChua = vi.fn(), onHoc = vi.fn()
    render(<MotTrangHs {...goc({ so: { daLam: 30, muc: 30, chang: 5, soChang: 5 } as PropsMotTrang['so'], onChua, onHoc })} />)
    const bang = screen.getByRole('region', { name: 'Đủ mức hôm nay' })
    expect(bang.textContent).toContain('Đủ 30/30 câu hôm nay!')
    expect(bang.textContent).toContain('Tiếp theo: Tự sửa lỗi, rồi Bài tập về nhà')
    const sua = screen.getByRole('button', { name: 'Tự sửa lỗi: hôm nay còn 5 câu' })
    expect(sua.getAttribute('data-tt')).toBe('dang')
    fireEvent.click(sua)
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Sửa ngay' }))
    fireEvent.click(screen.getByRole('button', { name: /Học thêm câu mới/ }))
    expect(onChua).toHaveBeenCalledOnce()
    expect(onHoc).toHaveBeenCalledOnce()
  })

  it('đủ mức + còn Kiểm tra ôn tập phải làm ⇒ kiểm tra là nút hiện tại, rồi mới tới Tự sửa lỗi (thầy 26/10)', () => {
    const onKiemTra = vi.fn()
    render(<MotTrangHs {...goc({ so: { daLam: 30, muc: 30, chang: 5, soChang: 5 } as PropsMotTrang['so'], kiem: { ...KIEM, homNay: true, trangThai: 'can_lam', nopLuc: null }, onKiemTra })} />)
    const kiem = within(duong()).getByRole('button', { name: /^Kiểm tra ôn tập/ })
    expect(kiem.getAttribute('data-tt')).toBe('dang')
    expect(screen.getByRole('region', { name: 'Đủ mức hôm nay' }).textContent).toContain('Tiếp theo: Kiểm tra ôn tập, rồi Tự sửa lỗi')
    fireEvent.click(kiem)
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Kiểm tra ôn tập' })).getByRole('button', { name: 'Bắt đầu' }))
    expect(onKiemTra).toHaveBeenCalledOnce()
    // thầy 27/10: kiểm tra chưa nộp ⇒ Tự sửa lỗi khoá tới khi nộp
    expect(screen.getByRole('button', { name: 'Tự sửa lỗi: khoá đến khi làm xong Kiểm tra ôn tập' }).getAttribute('data-tt')).toBe('khoa')
  })

  it('KIỂM TRA ÔN TẬP HÔM NAY chưa nộp (thầy 27/10 «đẩy lên đầu hành trình, làm xong mới mở khoá»): nút kiểm tra ĐẦU đường, đang hiện tại + bong bóng; chặng chưa xong + Tự sửa lỗi khoá', () => {
    const onHoc = vi.fn(), onKiemTra = vi.fn(), onChua = vi.fn()
    render(<MotTrangHs {...goc({ kiem: KIEM, onKiemTra, onHoc, onChua, hs: HS })} />)
    expect(nut().map((n) => n.getAttribute('aria-label'))).toEqual(['Kiểm tra ôn tập: 28 câu · khoảng 50 phút · hạn nộp 24:00', 'Chặng 1: đã xong', 'Chặng 2: đã xong',
      'Chặng 3: khoá đến khi làm xong Kiểm tra ôn tập', 'Rương hôm nay', 'Chặng 4: khoá đến khi làm xong Kiểm tra ôn tập', 'Tự sửa lỗi: khoá đến khi làm xong Kiểm tra ôn tập',
      'Chặng 5: khoá đến khi làm xong Kiểm tra ôn tập', 'Bài tập về nhà'])
    const kiem = nut()[0]!
    expect(kiem.getAttribute('data-tt')).toBe('dang')
    expect(kiem.querySelector('.da-bong')!.textContent).toBe('Kiểm tra ôn tập')
    expect(kiem.querySelector('.da-vong')).not.toBeNull()
    // chặng khoá: thẻ xám «Làm Kiểm tra ôn tập trước để mở khoá», không có nút bắt đầu
    fireEvent.click(screen.getByRole('button', { name: 'Chặng 3: khoá đến khi làm xong Kiểm tra ôn tập' }))
    const the = screen.getByRole('dialog')
    expect(the.getAttribute('data-sac')).toBe('khoa')
    expect(the.textContent).toContain('Làm Kiểm tra ôn tập trước để mở khoá')
    expect(within(the).queryByRole('button')).toBeNull()
    // nút kiểm tra: thẻ xanh dương, số câu + thời gian, «Bắt đầu»
    fireEvent.pointerDown(kiem); fireEvent.click(kiem)
    const tk = screen.getByRole('dialog', { name: 'Kiểm tra ôn tập' })
    expect(tk.getAttribute('data-sac')).toBe('tin')
    expect(tk.textContent).toContain('28 câu · khoảng 50 phút')
    fireEvent.click(within(tk).getByRole('button', { name: 'Bắt đầu' }))
    expect(onKiemTra).toHaveBeenCalledOnce()
    expect(onHoc).not.toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: /Học thêm câu mới/ })).toBeNull()
  })

  it('THỨ TỰ NÚT (thầy 27/10 «kiểm tra lên đầu, sửa lỗi chèn giữa hành trình mới»): không kiểm tra · chỉ có tự sửa · còn ≤ 2 chặng · mốc đã qua ⇒ Tự sửa lỗi là việc hiện tại', () => {
    const nhan = () => nut().map((n) => n.getAttribute('aria-label'))
    // không có kiểm tra: chặng 3 đang học ⇒ Tự sửa lỗi sau chặng 4 (chặng mới thứ 2), trước chặng 5
    let r = render(<MotTrangHs {...goc()} />)
    expect(nhan()).toEqual(['Chặng 1: đã xong', 'Chặng 2: đã xong', 'Học tiếp · 18 câu', 'Rương hôm nay', 'Chặng 4: chưa mở', 'Tự sửa lỗi: hôm nay còn 5 câu', 'Chặng 5: chưa mở', 'Bài tập về nhà'])
    r.unmount(); localStorage.clear()
    // chỉ có tự sửa (không kiểm tra, không bài tập)
    r = render(<MotTrangHs {...goc({ soBaiTap: 0, coBaiTap: false })} />)
    expect(nhan()).toEqual(['Chặng 1: đã xong', 'Chặng 2: đã xong', 'Học tiếp · 18 câu', 'Rương hôm nay', 'Chặng 4: chưa mở', 'Tự sửa lỗi: hôm nay còn 5 câu', 'Chặng 5: chưa mở'])
    r.unmount(); localStorage.clear()
    // còn 2 chặng mới ⇒ sau chặng mới đầu tiên
    r = render(<MotTrangHs {...goc({ so: { daLam: 18, muc: 30, chang: 4, soChang: 5 } as PropsMotTrang['so'], soBaiTap: 0, coBaiTap: false })} />)
    expect(nhan().slice(-3)).toEqual(['Học tiếp · 12 câu', 'Tự sửa lỗi: hôm nay còn 5 câu', 'Chặng 5: chưa mở'])
    r.unmount()
    // cùng ngày, em học qua mốc đã nhớ (sau chặng 4) ⇒ nút không trôi; Tự sửa lỗi thành việc hiện tại (bong bóng), chặng 5 không còn bong bóng / vòng
    render(<MotTrangHs {...goc({ so: { daLam: 24, muc: 30, chang: 5, soChang: 5 } as PropsMotTrang['so'], soBaiTap: 0, coBaiTap: false })} />)
    expect(nhan()).toEqual(['Chặng 1: đã xong', 'Chặng 2: đã xong', 'Chặng 3: đã xong', 'Rương hôm nay', 'Chặng 4: đã xong', 'Tự sửa lỗi: hôm nay còn 5 câu', 'Học tiếp · 6 câu'])
    const sua = screen.getByRole('button', { name: 'Tự sửa lỗi: hôm nay còn 5 câu' })
    expect(sua.getAttribute('data-tt')).toBe('dang')
    expect(sua.querySelector('.da-bong')!.textContent).toBe('Sửa lỗi')
    expect(screen.getByRole('button', { name: 'Học tiếp · 6 câu' }).querySelector('.da-bong, .da-vong')).toBeNull()
  })

  it('VÒNG NÚT KIỂM TRA ÔN TẬP (ảnh thầy 28/10: màn bài «3/5 chặng đã chốt» mà vòng trên Lộ trình xám hết): mỗi chặng một đoạn, tô đúng số chặng đã chốt; Tự sửa lỗi không vòng xám', () => {
    const KT35: TomTatKiemTra = { ...KIEM, soChang: 5, daTra: 18, con: 10, changChot: 3 }
    const { container, rerender } = render(<MotTrangHs {...goc({ kiem: KT35, onKiemTra: noop })} />)
    const vong = nut()[0]!.querySelector('.da-vong')!
    expect(vong).not.toBeNull()
    const nen = vong.querySelector('circle.nen')!, CV = 2 * Math.PI * 54
    expect(Number(nen.getAttribute('stroke-dasharray')!.split(' ')[0]) + 14).toBeCloseTo(CV / 5, 3) // 5 đoạn = 5 chặng
    expect(Number(vong.querySelector('mask circle')!.getAttribute('stroke-dasharray')!.split(' ')[0])).toBeCloseTo((CV * 3) / 5, 3) // tô 3 đoạn
    expect(vong.querySelector('circle.chay')).not.toBeNull()
    // máy chủ cũ chưa gửi số chặng ⇒ theo câu đã trả lời (18/28), không xám nguyên
    rerender(<MotTrangHs {...goc({ kiem: { ...KT35, changChot: undefined }, onKiemTra: noop })} />)
    expect(Number(nut()[0]!.querySelector('.da-vong mask circle')!.getAttribute('stroke-dasharray')!.split(' ')[0])).toBeCloseTo((CV * 18) / 28, 3)
    // không kiểm tra, đủ mức ⇒ Tự sửa lỗi là việc hiện tại: có bong bóng, KHÔNG vòng xám (không có số tổng để tô)
    rerender(<MotTrangHs {...goc({ so: { daLam: 30, muc: 30, chang: 5, soChang: 5 } as PropsMotTrang['so'] })} />)
    const sua = screen.getByRole('button', { name: 'Tự sửa lỗi: hôm nay còn 5 câu' })
    expect(sua.getAttribute('data-tt')).toBe('dang')
    expect(sua.querySelector('.da-vong')).toBeNull()
    expect(container.querySelectorAll('.da-vong')).toHaveLength(0)
  })

  it('nộp xong ⇒ nút kiểm tra ✓ (đã xong), các chặng mở lại theo thứ tự cũ + vỡ khoá MỘT lần; quá hạn chưa làm ⇒ không khoá, ghi «Đã lỡ»', () => {
    // máy có chuyển động (jsdom mặc định coi là «giảm chuyển động»)
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} }))
    const animCu = Element.prototype.animate
    Element.prototype.animate = vi.fn(() => ({ cancel() {}, finished: Promise.resolve() })) as unknown as typeof Element.prototype.animate
    onTestFinished(() => { Element.prototype.animate = animCu })
    const { rerender, container, unmount } = render(<MotTrangHs {...goc({ kiem: KIEM, onKiemTra: noop })} />)
    expect(localStorage.getItem('ddh.kt-khoa')).toBe('k')
    rerender(<MotTrangHs {...goc({ kiem: { ...KIEM, nopLuc: mo + 7200_000, diem: 8.5, trangThai: 'da_nop' as TomTatKiemTra['trangThai'] }, onKiemTra: noop })} />)
    expect(nut()[0]!.getAttribute('data-tt')).toBe('xong')
    expect(screen.getByRole('button', { name: 'Học tiếp · 18 câu' }).getAttribute('data-tt')).toBe('dang')
    expect(screen.getByRole('button', { name: 'Tự sửa lỗi: hôm nay còn 5 câu' }).getAttribute('data-tt')).toBe('mo')
    expect(container.querySelectorAll('.da-vo-khoa').length).toBe(2) // chặng hiện tại + Tự sửa lỗi
    expect(localStorage.getItem('ddh.kt-khoa')).toBeNull()
    unmount()
    render(<MotTrangHs {...goc({ kiem: { ...KIEM, homNay: false, trangThai: 'het_han' as TomTatKiemTra['trangThai'] } })} />)
    expect(screen.getByRole('button', { name: 'Học tiếp · 18 câu' }).getAttribute('data-tt')).toBe('dang')
    expect(screen.getByRole('button', { name: /^Kiểm tra ôn tập: Đã lỡ/ })).toBeTruthy()
  })

  it('ngày chỉ có Kiểm tra ôn tập ⇒ đường chỉ một nút kiểm tra, không băng bài', () => {
    render(<MotTrangHs {...goc({ kiem: { ...KIEM, baiNgayToiThieu: undefined }, ngayKiem: true, onKiemTra: noop })} />)
    expect(nut()).toHaveLength(1)
    expect(nut()[0]!.getAttribute('aria-label')).toMatch(/^Kiểm tra ôn tập/)
    expect(screen.queryByRole('region', { name: 'Bài học hôm nay' })).toBeNull()
  })

  it('Luyện tập: mỗi việc một ô to có số (Tự sửa lỗi nổi đỏ khi còn câu); Thành tích: chuỗi ngày + lối vào điểm đã công bố', () => {
    const onXemLai = vi.fn(), onLichSu = vi.fn()
    const { unmount } = render(<MotTrangHs {...goc({ muc: 'on-lai', kiem: KIEM, onKiemTra: noop, hs: { ...HS, onXemLai } })} />)
    expect(screen.getByRole('heading', { name: 'Luyện tập' })).toBeTruthy()
    expect(screen.getByRole('button', { name: /^Tự sửa lỗi/ }).hasAttribute('data-noi')).toBe(true)
    expect(screen.getAllByRole('button', { name: /^Kiểm tra ôn tập/ })[0]!.textContent).toContain('0/28')
    fireEvent.click(screen.getByRole('button', { name: /^Câu đã làm/ }))
    expect(onXemLai).toHaveBeenCalledOnce()
    unmount()
    render(<MotTrangHs {...goc({ muc: 'ket-qua', hs: { ...HS, onLichSu } })} />)
    expect(screen.getByRole('heading', { name: 'Thành tích' })).toBeTruthy()
    expect(screen.getByText('0 ngày')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /^Ca kiểm tra/ }))
    expect(onLichSu).toHaveBeenCalledOnce()
  })
})

describe('Hệ lười chỉ thầy / phụ huynh xem (thầy 26/10)', () => {
  it('Lộ trình + Thành tích: máy chủ CŨ còn gửi nhóm Lười / bậc 1 ⇒ em chỉ thấy «Chuỗi N ngày» + việc tiếp trung tính, không chữ / màu nhóm, bậc', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => traLoi({ ...NHIP_EM_LUOI, bacCham: { bac: 1, diem: 0, diemLenBac: 3 }, doTinCay: 80 })))
    for (const muc of ['hom-nay', 'ket-qua']) {
      const { container, unmount } = render(<MotTrangHs {...goc({ muc, token: 'tk', hs: HS })} />)
      // Gộp thưởng phạt 26/10: ở Lộ trình thẻ «việc tiếp» nhường chỗ thẻ bên Giải tuần + Nhiệm vụ (bản vẽ tp-4) — Thành tích vẫn giữ.
      if (muc === 'ket-qua') {
        const the = await screen.findByText(/^Việc tiếp:/)
        expect(the.closest('.dm-the')!.querySelector('h3')!.textContent).toMatch(/^Chuỗi \d+ ngày$/)
      } else await screen.findByLabelText('Bài học hôm nay')
      expect(container.textContent).not.toMatch(/lười|chăm|chưa đều|bậc|đối phó|học thật|bấm vội|treo|quá nhanh/i)
      expect(container.innerHTML).not.toMatch(/data-nhom|da-12|da-bac/)
      unmount()
    }
  })
})

describe('Menu dọc «Một trang» — MENU 6 MỤC (thầy 27/10): Điểm danh chỉ khi có buổi mở, chuông ở đầu menu, Cài đặt là tấm con', () => {
  const chuong = <div className="m3-tb"><button type="button" className="m3-tb-chuong" aria-label="Thông báo, 2 chưa đọc"><span className="m3-tb-dem">2</span></button></div>
  const menu = (them: { moDiemDanh?: boolean; coCa?: boolean; onThi?: () => void; onMuc?: (id: string) => void; onTaiLai?: () => void; onCuaEm?: () => void } = {}) => render(<MenuDocTrong muc="hom-nay" ds={[]}
    onMuc={them.onMuc ?? noop} coCa={them.coCa ?? false} onThi={them.onThi ?? noop} dangTai={false} onTaiLai={them.onTaiLai ?? noop} thongBao={chuong}
    chuDau="MA" moCuaEm={false} onCuaEm={them.onCuaEm ?? noop} nutCuaEm={createRef()} token="tk" moDiemDanh={them.moDiemDanh ?? true} />)
  const nav = () => screen.getByRole('navigation', { name: 'Điều hướng học sinh' })

  it('buổi đang mở ⇒ vạch thò «Điểm danh», khối chàm gửi mã bằng ĐÚNG lệnh /hs/diem-danh ⇒ «Đã điểm danh» kèm giờ', async () => {
    const f = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith('/hs/buoi-hoc')) return traLoi({ ok: true, buoi: { id: 'B1', ten: 'Buổi học 26/10/2026', lop: '12A1', daDiemDanh: false } })
      if (url.endsWith('/hs/diem-danh')) { expect(JSON.parse(String(init?.body))).toEqual({ token: 'tk', ma: '482915' }); return traLoi({ ok: true, buoi: { id: 'B1', ten: 'Buổi học 26/10/2026', lop: '12A1', daDiemDanh: true } }) }
      return traLoi({ ok: false })
    })
    vi.stubGlobal('fetch', f)
    menu()
    fireEvent.click(await screen.findByRole('button', { name: 'Mở menu · Buổi học đang mở điểm danh' }))
    const khoi = screen.getByRole('form', { name: 'Điểm danh buổi học' })
    expect(within(khoi).getByText('Buổi 26/10')).toBeTruthy()
    fireEvent.change(within(khoi).getByLabelText('Mã 6 số trên máy chiếu'), { target: { value: '482 915' } })
    fireEvent.click(within(khoi).getByRole('button', { name: 'Điểm danh' }))
    expect(await screen.findByText('Đã điểm danh')).toBeTruthy()
    expect(screen.getByText('Buổi 26/10 · 12A1')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Mở menu' })).toBeTruthy()
  })

  it('không có buổi ⇒ KHÔNG có khối Điểm danh; QR ?diem-danh= vẫn tự gửi một lần và mở menu', async () => {
    window.history.replaceState(null, '', '/hs?diem-danh=482915')
    const f = vi.fn(async (url: string) => (url.endsWith('/hs/diem-danh') ? traLoi({ ok: true, buoi: { id: 'B1', ten: 'Buổi học 26/10/2026', lop: '12A1', daDiemDanh: true } }) : traLoi({ ok: true, buoi: null })))
    vi.stubGlobal('fetch', f)
    menu()
    expect(await screen.findByText('Đã điểm danh')).toBeTruthy()
    expect(window.location.search).toBe('')
    expect(f.mock.calls.filter(([u]) => String(u).endsWith('/hs/diem-danh')).length).toBe(1)
    await waitFor(() => expect(screen.getByRole('navigation', { name: 'Điều hướng học sinh' }).hasAttribute('data-mo')).toBe(true))
    cleanup()
    menu()
    await waitFor(() => expect(f.mock.calls.filter(([u]) => String(u).endsWith('/hs/buoi-hoc')).length).toBeGreaterThan(1))
    await new Promise((r) => setTimeout(r, 0))
    expect(screen.queryByLabelText('Điểm danh buổi học')).toBeNull()
    expect(screen.queryByText(/Chưa có buổi học/)).toBeNull()
    expect(nav().hasAttribute('data-dd')).toBe(false)
    expect(screen.getByRole('button', { name: 'Mở menu' })).toBeTruthy()
  })

  it('đúng 6 mục theo thứ tự, mỗi mục một ô biểu tượng; chuông ở đầu menu; Ca kiểm tra gọi onThi (ẩn khi ca đang mở); chạm mục ⇒ phanHoi(chon)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => traLoi({ ok: true, buoi: null })))
    phanHoi.mockClear()
    const onThi = vi.fn(), onMuc = vi.fn()
    const { unmount } = menu({ moDiemDanh: false, onThi, onMuc })
    const muc = () => within(nav()).getAllByRole('button').filter((b) => b.classList.contains('tr-menu-muc'))
    expect(muc().map((b) => b.textContent)).toEqual(['Lộ trình', 'Luyện tập', 'Thành tích', 'Ca kiểm tra', 'Hỏi A.I Đỗ Đại Học', 'Cài đặt'])
    expect(muc().every((b) => b.querySelector('.tr-menu-o'))).toBe(true)
    expect(within(nav()).getByRole('button', { name: 'Lộ trình' }).getAttribute('aria-current')).toBe('page')
    expect(nav().querySelector('.tr-menu-ds hr')).toBeNull() // không vạch ngăn giữa 6 mục
    // chuông THẬT nằm ở hàng đầu menu, cạnh «Đỗ Đại Học»
    expect(nav().querySelector('.tr-menu-dau .tr-menu-tb .m3-tb-chuong')).not.toBeNull()
    expect(nav().querySelector('.tr-menu-dau')!.textContent).toContain('Đỗ Đại Học')
    fireEvent.click(within(nav()).getByRole('button', { name: 'Ca kiểm tra' }))
    expect(onThi).toHaveBeenCalledOnce()
    fireEvent.click(within(nav()).getByRole('button', { name: 'Thành tích' }))
    expect(onMuc).toHaveBeenCalledWith('ket-qua')
    await waitFor(() => expect(phanHoi).toHaveBeenCalled())
    expect(phanHoi).toHaveBeenCalledWith('chon')
    unmount()
    menu({ moDiemDanh: false, coCa: true })
    expect(within(nav()).queryByRole('button', { name: 'Ca kiểm tra' })).toBeNull()
  })

  it('Cài đặt mở tấm con (Âm thanh · Rung · Cập nhật bài học · Của em), Quay lại / Esc về 6 mục; công tắc ghi localStorage ddh.am / ddh.rung (mặc định Bật)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => traLoi({ ok: true, buoi: null })))
    const onTaiLai = vi.fn(), onCuaEm = vi.fn()
    menu({ moDiemDanh: false, onTaiLai, onCuaEm })
    fireEvent.click(screen.getByRole('button', { name: 'Mở menu' }))
    expect(screen.queryByRole('switch', { name: /Âm thanh/ })).toBeNull() // tấm con chưa mở ⇒ công tắc ẩn
    const cai = within(nav()).getByRole('button', { name: 'Cài đặt' })
    expect(cai.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(cai)
    const tam = screen.getByRole('group', { name: 'Cài đặt' })
    expect(within(nav()).queryByRole('button', { name: 'Lộ trình' })).toBeNull()
    await waitFor(() => expect(document.activeElement).toBe(within(tam).getByRole('button', { name: 'Quay lại menu' })))
    expect(within(tam).getByRole('button', { name: 'Cập nhật bài học' })).toBeTruthy()
    expect(within(tam).getByRole('button', { name: 'Của em' }).getAttribute('aria-haspopup')).toBe('dialog')
    const am = within(tam).getByRole('switch', { name: /Âm thanh/ }), ru = within(tam).getByRole('switch', { name: /Rung/ })
    expect(am.getAttribute('aria-checked')).toBe('true')
    fireEvent.click(am); fireEvent.click(ru)
    expect(localStorage.getItem('ddh.am')).toBe('tat'); expect(localStorage.getItem('ddh.rung')).toBe('tat')
    fireEvent.click(am)
    expect(localStorage.getItem('ddh.am')).toBeNull()
    localStorage.clear()
    // Esc ở tấm con ⇒ về 6 mục (menu vẫn mở), tiêu điểm về «Cài đặt»; Esc lần nữa ⇒ menu thu
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('group', { name: 'Cài đặt' })).toBeNull()
    expect(nav().hasAttribute('data-mo')).toBe(true)
    await waitFor(() => expect(document.activeElement).toBe(within(nav()).getByRole('button', { name: 'Cài đặt' })))
    fireEvent.click(within(nav()).getByRole('button', { name: 'Cài đặt' }))
    fireEvent.click(screen.getByRole('button', { name: 'Quay lại menu' }))
    expect(within(nav()).getByRole('button', { name: 'Lộ trình' })).toBeTruthy()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(nav().hasAttribute('data-mo')).toBe(false)
    // Cập nhật bài học / Của em giữ nguyên hành vi
    fireEvent.click(screen.getByRole('button', { name: 'Mở menu' }))
    expect(within(nav()).getByRole('button', { name: 'Lộ trình' })).toBeTruthy() // mở lại ⇒ luôn về 6 mục
    fireEvent.click(within(nav()).getByRole('button', { name: 'Cài đặt' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cập nhật bài học' }))
    expect(onTaiLai).toHaveBeenCalledOnce()
    fireEvent.click(screen.getByRole('button', { name: 'Mở menu' }))
    fireEvent.click(within(nav()).getByRole('button', { name: 'Cài đặt' }))
    fireEvent.click(screen.getByRole('button', { name: 'Của em' }))
    expect(onCuaEm).toHaveBeenCalledOnce()
  })

  it('mục Hỏi A.I Đỗ Đại Học bắn sự kiện mở ĐÚNG tấm chat của BongBongAiDdh', () => {
    vi.stubGlobal('fetch', vi.fn(async () => traLoi({ ok: true, buoi: null })))
    const nghe = vi.fn()
    window.addEventListener('ddh:mo-ai', nghe)
    menu({ moDiemDanh: false })
    fireEvent.click(within(document.getElementById('tr-menu')!).getByRole('button', { name: 'Hỏi A.I Đỗ Đại Học' }))
    expect(nghe).toHaveBeenCalledOnce()
    // khung thấp xoay ngang: dải biểu tượng có cùng lối A.I + 3 mục chính (dọc: dải bị CSS ẩn)
    fireEvent.click(document.querySelector('.tr-menu-ray .tr-ray-ai')!)
    window.removeEventListener('ddh:mo-ai', nghe)
    expect(nghe).toHaveBeenCalledTimes(2)
    expect([...document.querySelectorAll('.tr-menu-ray .tr-ray-muc')].map((b) => b.getAttribute('aria-label'))).toEqual(['Lộ trình', 'Luyện tập', 'Thành tích', 'A.I Đỗ Đại Học'])
    expect(document.querySelector('.tr-menu-ray .tr-menu-cham')).not.toBeNull()
  })
})
