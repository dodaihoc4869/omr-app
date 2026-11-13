// HÔM NAY «MỘT TRANG» + MENU DỌC (Điểm danh, A.I Đỗ Đại Học) của app học sinh — bản vẽ ve-moi/hs-mot-trang*.html, thầy chốt 26/10.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { NHIP_EM_LUOI } from '../scripts/chup-v2/gia/nhip-hoc-em'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { createRef } from 'react'
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-chu' }))
const phanHoi = vi.hoisted(() => vi.fn())
vi.mock('../src/lib/phan-hoi', () => ({ phanHoi }))
const moBpuHs = vi.hoisted(() => vi.fn(() => true))
// 10/11: nút «Vào Bình Phản Ứng» gọi thêm xinQuyenTatMan (947b2cac5) và nối sẵn nenBpuHs — bản giả phải có đủ, không thì nút rơi vào «Chưa mở được»
vi.mock('../src/components/bpu/gan-hs', () => ({ moBpuHs, xinQuyenTatMan: () => {}, nenBpuHs: () => {} }))
import { MenuDocTrong, MotTrangHs, type PropsMotTrang } from '../src/components/hoc-tap/TrongHs'
import type { TomTatKiemTra } from '../src/lib/kiem-tra-ca-nhan'
import { KHO_DOI_PHO, KHO_GIUC_HOC } from '../src/lib/loi-mol'

const traLoi = (o: unknown) => new Response(JSON.stringify(o), { status: 200, headers: { 'content-type': 'application/json' } })
const noop = () => {}
const goc = (them: Partial<PropsMotTrang> = {}): PropsMotTrang => ({
  so: { daLam: 12, muc: 30, chang: 3, soChang: 5 } as PropsMotTrang['so'], dangTai: false, tenBai: 'Ester – Lipid', viec: 'Hiểu · Chặng 3/5',
  onHoc: noop, khoaHoc: false, hetCau: false, coCa: false, onThi: noop, soSua: 5, onChua: noop, ngayKiem: false, soBaiTap: 1, coBaiTap: true, onBaiTap: noop, ghi: [], ...them,
})
/** Mọi chặng của hôm nay đã xong (đủ mức) ⇒ Tự sửa lỗi MỞ khoá. */
const XONG = { daLam: 30, muc: 30, chang: 5, soChang: 5 } as PropsMotTrang['so']
const mo = Date.parse('2026-10-26T00:00:00+07:00')
const KIEM: TomTatKiemTra = { id: 'k', ngay: '2026-10-26', moLuc: mo, hanLuc: mo + 86400_000, serverNow: mo + 3600_000, trangThai: 'can_lam', homNay: true, baiNgayToiThieu: 12,
  tong: 28, daTra: 0, con: 28, soChang: 4, phut: 50, soBai: 6, tongKienThuc: 10, phuDe: 10, nguonDayDu: true, lyDo: '', thieuNguon: 0, diem: null, nopLuc: null }
/** Kiểm tra ôn tập của NGÀY KHÁC (chưa tới) ⇒ không khoá chặng, nút kiểm tra đứng sau các chặng như cũ. */
const KIEM_SAU: TomTatKiemTra = { ...KIEM, ngay: '2026-10-28', homNay: false, trangThai: 'sap_den' as TomTatKiemTra['trangThai'] }

afterEach(() => { cleanup(); vi.unstubAllGlobals(); window.history.replaceState(null, '', '/'); try { localStorage.clear() } catch { /* bỏ qua */ } })

// 26/10 tối (thầy chốt bản vẽ ve-moi/dm-*.html — hướng Duolingo + chất Hoá): Hôm nay «Một trang» nay là LỘ TRÌNH — con đường chặng giữ ĐÚNG thứ tự việc
// (học → Kiểm tra ôn tập → Tự sửa lỗi → Bài tập về nhà; ca đang mở / ngày chỉ kiểm tra như cũ), cùng nút, cùng lệnh. Luyện tập / Thành tích là hai mục còn lại.
// hệ Kính 02/11: Rương thành thẻ riêng dưới «Việc hôm nay» (vẫn bấm được, vẫn bật thẻ); Bài tập về nhà bỏ khỏi app học sinh (thầy 02/11 «phần btvn không còn nữa bỏ đi»)
// 10/11 (bản vẽ docs/ban-ve-mot-nut-1011 «chỉ để lại một nút»): danh sách «Việc hôm nay» đã bỏ ⇒ thứ tự / khoá / việc hiện tại đọc qua NÚT CHÍNH `.kb-cta`
// (việc đang làm đầu tiên của cùng danh sách việc, cùng lệnh cũ); Rương chỉ hiện khi hết việc.
const cta = () => document.querySelector<HTMLButtonElement>('.kb-cta')
const tieuDe = () => cta()?.querySelector('b')?.textContent
const nhanViec = () => cta()?.querySelector('.kb-cta-nhan')?.textContent
const phuCta = () => cta()?.querySelector('.kb-phu')?.textContent
const HS = { lop: '12A1', onXemLai: noop, onTuLuyen: noop, onLichSu: noop, onKetQua: noop }

describe('Lộ trình (Hôm nay kiểu Duolingo)', () => {
  // SỬA CÓ CHỦ ĐÍCH 10/11 (bản vẽ docs/ban-ve-mot-nut-1011 «chỉ để lại một nút»): huy hiệu số trên dòng Tự sửa lỗi đã bỏ ⇒ số «còn phải sửa hôm nay» đọc ở dòng phụ nút chính (12 rồi 7, không «99+»)
  it('nút Kiểm tra ôn tập / Tự sửa lỗi KHÔNG còn viên chữ cạnh nút (thầy 27/10: đè giám thị); huy hiệu số = câu CÒN PHẢI SỬA HÔM NAY (thầy duyệt 28/10: không còn «99+» tổng nợ)', () => {
    const { container, rerender } = render(<MotTrangHs {...goc({ soSua: 200, kiem: KIEM_SAU, so: XONG })} />)
    // chưa có việc hôm nay (chưa tải danh sách) ⇒ tối đa 12 câu của ngày
    expect(tieuDe()).toBe('Tự sửa lỗi')
    expect(phuCta()).toBe('Hôm nay còn 12 câu cần sửa')
    rerender(<MotTrangHs {...goc({ soSua: 7, kiem: KIEM_SAU, so: XONG })} />)
    expect(phuCta()).toBe('Hôm nay còn 7 câu cần sửa')
    expect(container.textContent).not.toContain('99+')
  })
  // SỬA CÓ CHỦ ĐÍCH 10/11 (bản vẽ docs/ban-ve-mot-nut-1011 «chỉ để lại một nút»): dòng Tự sửa lỗi + huy hiệu + thẻ bật ra đã bỏ ⇒ số hôm nay đọc ở nút chính; xong cả ngày ⇒ không còn nút chính Tự sửa lỗi (không có lối «sửa thêm»)
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
    await waitFor(() => expect(phuCta()).toBe('Hôm nay còn 2 câu cần sửa'), { timeout: 5000 }) // mảnh việc hôm nay nạp lười: máy bận có thể quá 1 s
    expect(tieuDe()).toBe('Tự sửa lỗi')
    expect(cta()!.getAttribute('data-sac')).toBe('sai')
    await act(async () => { await goi(['D1', 'D2', 'D3']) })
    rerender(<MotTrangHs {...goc({ soSua: 40, token: 'tk', so: { daLam: 30, muc: 30, chang: 5, soChang: 5 } as PropsMotTrang['so'] })} />)
    // xong phần hôm nay ⇒ Tự sửa lỗi không còn là việc chính, không còn lối sửa thêm ở Hôm nay (thầy 29/10); Bài tập về nhà đã bỏ (thầy 02/11)
    await waitFor(() => expect(cta()).toBeNull())
    expect(screen.queryByRole('button', { name: 'Bài tập về nhà' })).toBeNull()
  })
  // SỬA CÓ CHỦ ĐÍCH 10/11 (bản vẽ docs/ban-ve-mot-nut-1011 «chỉ để lại một nút»): it cũ «bấm nút Lộ trình KHÔNG vào thẳng: thẻ bật ra (role dialog)…» — thẻ bật ra / focus / Esc / chạm ngoài thuộc danh sách đã bỏ (nút chính vào thẳng); giữ «Sửa ngay» gọi onChua (qua nút chính) + Rương mở tại chỗ (Rương nay chỉ hiện khi hết việc ⇒ rerender soSua 0)
  it('đủ mức còn Tự sửa lỗi ⇒ nút chính đỏ gọi đúng lệnh cũ; sửa xong ⇒ Rương sáng mở ngay tại chỗ, mở rồi là thẻ tĩnh (thầy 02/11)', async () => {
    const onHoc = vi.fn(), onChua = vi.fn()
    const { rerender } = render(<MotTrangHs {...goc({ onHoc, onChua, hs: HS, so: XONG })} />)
    // Tự sửa lỗi đỏ, gọi đúng lệnh cũ
    expect(tieuDe()).toBe('Tự sửa lỗi')
    expect(cta()!.getAttribute('data-sac')).toBe('sai')
    expect(phuCta()).toContain('5 câu cần sửa')
    fireEvent.click(cta()!)
    expect(onChua).toHaveBeenCalledOnce()
    expect(onHoc).not.toHaveBeenCalled()
    // hết việc ⇒ rương đã sáng (xong hết chặng): thầy 02/11 tối «Rương xong cho mở luôn tại màn này» ⇒ chạm là mở ngay trong thẻ, không bảng chữ; nắp giữ mở
    rerender(<MotTrangHs {...goc({ onHoc, onChua, hs: HS, so: XONG, soSua: 0 })} />)
    expect(cta()).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Mở rương hôm nay' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    // thầy 02/11 khuya «mở rồi thì không còn hiệu ứng khi bấm vào nữa»: hiệu ứng xong ⇒ thẻ TĨNH (không còn là nút), chữ «Rương đã mở»
    const ruong = await waitFor(() => screen.getByLabelText('Rương hôm nay đã mở'), { timeout: 4000 })
    expect(ruong.tagName).toBe('SECTION')
    expect(ruong.hasAttribute('data-da-mo')).toBe(true)
    expect(ruong.textContent).toContain('Rương đã mở')
  })
  it('thầy 03/11 chốt: Mol nói ở góc trái thẻ đầu — bong bóng ở trong thẻ (không che nút) nên GIỮ HIỆN, không tự thu; lời theo đúng tình huống (đủ mức ⇒ lời vui)', () => {
    vi.useFakeTimers()
    vi.setSystemTime(Date.UTC(2026, 9, 31, 3, 0)) // 10:00 giờ VN (không phụ thuộc giờ chạy)
    try {
      const a = render(<MotTrangHs {...goc()} />)
      expect(a.container.querySelector('.kb-hero > .kb-mol')).not.toBeNull()
      act(() => { vi.advanceTimersByTime(6000) })
      expect(a.container.querySelector('.kb-hero > .kb-mol .bi-loi-bong')).not.toBeNull()
      a.unmount()
      const c = render(<MotTrangHs {...goc({ so: { daLam: 30, muc: 30, chang: 5, soChang: 5 } as PropsMotTrang['so'] })} />)
      const bb = c.container.querySelector<HTMLElement>('.kb-mol .bi-loi-bong')!, chu = bb.querySelector('.ht2-an')!.textContent!
      expect(chu.startsWith('Đủ mức rồi!') || bb.hasAttribute('data-chan-ngon')).toBe(true) // lời vui; 1/3 lượt vui là chân ngôn (chữ nghiêng)
      expect(chu).not.toMatch(/^«|»$/) // thầy 03/11 «Bỏ dấu << ở hai đầu bong bóng của mol»
    } finally { vi.useRealTimers() }
  })
  it('lời Bi trọn câu (soát 27/10: ảnh chụp lúc đang gõ trông «cụt» ở chữ «là»): câu đủ ý và gõ xong trong ≤ 0,7 s', () => {
    vi.useFakeTimers()
    vi.setSystemTime(Date.UTC(2026, 9, 31, 3, 0)) // 10:00 giờ VN: trước mốc Mol giận theo giờ (test cũ phụ thuộc giờ chạy — tối là đỏ)
    try {
      const { container } = render(<MotTrangHs {...goc()} />)
      const bong = container.querySelector('.bi-loi-bong')!
      expect(bong.querySelector('.ht2-an')!.textContent).toBe('Học tiếp nhé! Còn 18 câu nữa là đủ mức hôm nay.')
      act(() => { vi.advanceTimersByTime(750) })
      expect(bong.querySelector('.bi-loi-con')!.textContent).toBe('')
      expect(bong.querySelector('[aria-hidden="true"]')!.textContent).toBe('Học tiếp nhé! Còn 18 câu nữa là đủ mức hôm nay.')
    } finally { vi.useRealTimers() }
  })
  // SỬA CÓ CHỦ ĐÍCH 10/11 (bản vẽ docs/ban-ve-mot-nut-1011 «chỉ để lại một nút»): thứ tự dòng + thẻ bật ra + đếm dòng chặng ✓ đã bỏ ⇒ nút chính «Bắt đầu · Chặng 3 — Ester – Lipid · còn 6 câu» (Kiểm tra ôn tập ngày khác không chen lên), bấm gọi onHoc; Rương chưa hiện khi còn việc
  it('đang học: chặng hiện tại là nút «Học tiếp · 18 câu» có bong bóng; sau các chặng là Kiểm tra ôn tập → Tự sửa lỗi → Bài tập về nhà; thanh số trên', () => {
    const onHoc = vi.fn(), onKiemTra = vi.fn()
    render(<MotTrangHs {...goc({ kiem: KIEM_SAU, onKiemTra, onHoc, hs: HS })} />)
    // Kiểm tra ôn tập của ngày khác (chưa tới) đứng đầu nhưng không là việc hiện tại ⇒ nút chính là chặng đang học
    expect(document.querySelectorAll('.kb-cta')).toHaveLength(1)
    expect(tieuDe()).toBe('Chặng 3') // 2 chặng trước đã xong
    expect(nhanViec()).toBe('Bắt đầu') // chặng 3 chưa làm câu nào
    expect(cta()!.getAttribute('data-sac')).toBe('hs')
    expect(phuCta()).toContain('Ester – Lipid')
    expect(cta()!.querySelector('.kb-cta-con')!.textContent).toBe('còn 6 câu')
    expect(screen.queryByRole('button', { name: /Rương hôm nay/ })).toBeNull() // Rương chỉ hiện khi hết việc
    fireEvent.click(cta()!)
    expect(onHoc).toHaveBeenCalledOnce()
    expect(onKiemTra).not.toHaveBeenCalled()
    expect(screen.getByLabelText('12/30 câu hôm nay')).toBeTruthy()
    expect(screen.getByLabelText('Khối 12')).toBeTruthy()
  })

  // SỬA CÓ CHỦ ĐÍCH 10/11 (bản vẽ docs/ban-ve-mot-nut-1011 «chỉ để lại một nút»): bỏ kiểm «đường chặng mờ đi» (data-mo-di của danh sách đã bỏ); giữ băng ca + nút Vào ca kiểm tra gọi onThi
  it('ca kiểm tra đang mở ⇒ băng ca + nút Vào ca kiểm tra ở đầu, đường chặng mờ đi', () => {
    const onThi = vi.fn()
    render(<MotTrangHs {...goc({ coCa: true, onThi })} />)
    fireEvent.click(within(screen.getByRole('region', { name: 'Ca kiểm tra đang mở' })).getByRole('button', { name: /Vào ca kiểm tra/ }))
    expect(onThi).toHaveBeenCalledOnce()
  })

  // SỬA CÓ CHỦ ĐÍCH 10/11 (bản vẽ docs/ban-ve-mot-nut-1011 «chỉ để lại một nút»): dòng + thẻ bật ra «Sửa ngay» ⇒ nút chính Tự sửa lỗi (đỏ, 5 câu) gọi onChua
  it('đủ mức ⇒ băng «Đủ 30/30 câu hôm nay!», Tự sửa lỗi là nút hiện tại, «Học thêm câu mới» thành liên kết', () => {
    const onChua = vi.fn(), onHoc = vi.fn()
    render(<MotTrangHs {...goc({ so: { daLam: 30, muc: 30, chang: 5, soChang: 5 } as PropsMotTrang['so'], onChua, onHoc })} />)
    const bang = screen.getByRole('region', { name: 'Đủ mức hôm nay' })
    expect(bang.textContent).toContain('Đủ 30/30 câu hôm nay!')
    expect(bang.textContent).toContain('Tiếp theo: Tự sửa lỗi')
    expect(bang.textContent).not.toContain('Bài tập về nhà') // BTVN đã bỏ (thầy 02/11)
    expect(tieuDe()).toBe('Tự sửa lỗi')
    expect(nhanViec()).toBe('Sửa lỗi')
    expect(cta()!.getAttribute('data-sac')).toBe('sai')
    expect(phuCta()).toBe('Hôm nay còn 5 câu cần sửa')
    fireEvent.click(cta()!)
    fireEvent.click(screen.getByRole('button', { name: /Học thêm câu mới/ }))
    expect(onChua).toHaveBeenCalledOnce()
    expect(onHoc).toHaveBeenCalledOnce()
  })

  // 28/10 (thầy «Chúc mừng, em đã hoàn thành bài hôm nay — ghi rõ câu sửa, bài kiểm tra. Thay thẻ hoàn thành nhiệm vụ»)
  it('xong HẾT việc hôm nay ⇒ thẻ «Chúc mừng, em đã hoàn thành bài hôm nay!» ghi số câu học · câu sửa · điểm Kiểm tra ôn tập (thay «Đủ x/y câu…»)', () => {
    const ngay = new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10)
    localStorage.setItem('ddh.sua-nho', JSON.stringify({ t: 'tk', n: ngay, s: [0, 0, 0, 8] }))
    render(<MotTrangHs {...goc({ token: 'tk', so: { daLam: 30, muc: 30, chang: 5, soChang: 5 } as PropsMotTrang['so'], soSua: 0, soBaiTap: 0, coBaiTap: false,
      kiem: { ...KIEM, trangThai: 'da_nop' as TomTatKiemTra['trangThai'], nopLuc: mo + 7200_000, diem: 7.5 } })} />)
    const bang = screen.getByRole('region', { name: 'Hoàn thành bài hôm nay' })
    expect(bang.textContent).toContain('Chúc mừng, em đã hoàn thành bài hôm nay!')
    expect(bang.textContent).toContain('30 câu học · 8 câu sửa · Kiểm tra ôn tập 7,5/10')
    expect(screen.queryByRole('region', { name: 'Đủ mức hôm nay' })).toBeNull()
    expect(document.body.textContent).not.toContain('Em có thể nghỉ')
  })

  // SỬA CÓ CHỦ ĐÍCH 10/11 (bản vẽ docs/ban-ve-mot-nut-1011 «chỉ để lại một nút»): dòng Tự sửa lỗi ✓ đã bỏ ⇒ số nhớ đọc ở thẻ mức NGAY lần vẽ đầu: 12 câu học + 12 câu đã sửa xong = 24/42 (không nhảy khi danh sách về)
  it('tải lại trang: số nhớ trên máy của hôm nay ⇒ nút Tự sửa lỗi đúng chỗ, đúng ✓ NGAY lần vẽ đầu (không chờ danh sách)', () => {
    const ngay = new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10)
    localStorage.setItem('ddh.sua-nho', JSON.stringify({ t: 'tk', n: ngay, s: [5, 0, 0, 12] }))
    // số câu cần sửa CHƯA về (soSua null) ⇒ phần Tự sửa lỗi đã xong vẫn tính đúng ngay lần vẽ đầu
    const { container } = render(<MotTrangHs {...goc({ token: 'tk', soSua: null as never })} />)
    expect(container.querySelector('.kb-so')!.textContent).toBe('24/42 câu')
  })
  // SỬA CÓ CHỦ ĐÍCH 10/11 (bản vẽ docs/ban-ve-mot-nut-1011 «chỉ để lại một nút»): dòng Tự sửa lỗi đã bỏ ⇒ số nhớ ngày khác / phiên khác không vào thẻ mức (chỉ 12/30 câu học, không cộng câu sửa)
  it('số nhớ của NGÀY KHÁC / PHIÊN KHÁC không dùng (chưa có số ⇒ không vẽ nút Tự sửa lỗi như cũ)', () => {
    localStorage.setItem('ddh.sua-nho', JSON.stringify({ t: 'tk', n: '2020-01-01', s: [5, 0, 0, 12] }))
    const { container, unmount } = render(<MotTrangHs {...goc({ token: 'tk', soSua: null as never })} />)
    expect(container.querySelector('.kb-so')!.textContent).toBe('12/30 câu')
    unmount()
    localStorage.setItem('ddh.sua-nho', JSON.stringify({ t: 'khac', n: new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10), s: [5, 0, 0, 12] }))
    const r = render(<MotTrangHs {...goc({ token: 'tk', soSua: null as never })} />)
    expect(r.container.querySelector('.kb-so')!.textContent).toBe('12/30 câu')
  })

  // SỬA CÓ CHỦ ĐÍCH 10/11 (bản vẽ docs/ban-ve-mot-nut-1011 «chỉ để lại một nút»): nút chính là Kiểm tra ôn tập gọi onKiemTra; ngày có Kiểm tra ôn tập hôm nay không còn chặng Tự sửa lỗi riêng (thầy «Hs vẫn 57 câu à») ⇒ băng chỉ còn «Tiếp theo: Kiểm tra ôn tập», không còn dòng Tự sửa lỗi khoá
  it('đủ mức + còn Kiểm tra ôn tập phải làm ⇒ kiểm tra là nút hiện tại, rồi mới tới Tự sửa lỗi (thầy 26/10)', () => {
    const onKiemTra = vi.fn()
    render(<MotTrangHs {...goc({ so: { daLam: 30, muc: 30, chang: 5, soChang: 5 } as PropsMotTrang['so'], kiem: { ...KIEM, homNay: true, trangThai: 'can_lam', nopLuc: null }, onKiemTra })} />)
    expect(tieuDe()).toBe('Kiểm tra ôn tập')
    expect(cta()!.getAttribute('data-sac')).toBe('tin')
    const bang = screen.getByRole('region', { name: 'Đủ mức hôm nay' }).textContent
    expect(bang).toContain('Tiếp theo: Kiểm tra ôn tập')
    expect(bang).not.toContain('Tự sửa lỗi')
    fireEvent.click(cta()!)
    expect(onKiemTra).toHaveBeenCalledOnce()
  })

  // SỬA CÓ CHỦ ĐÍCH 10/11 (bản vẽ docs/ban-ve-mot-nut-1011 «chỉ để lại một nút»): thứ tự dòng / vòng / thẻ bật ra ⇒ nút chính là Kiểm tra ôn tập (xanh dương, 28 câu · khoảng 50 phút) gọi onKiemTra, không gọi học / sửa; thẻ mức báo khoá chặng; ngày có Kiểm tra ôn tập không còn chặng Tự sửa lỗi riêng
  it('KIỂM TRA ÔN TẬP HÔM NAY chưa nộp (thầy 27/10 «đẩy lên đầu hành trình, làm xong mới mở khoá»): nút kiểm tra ĐẦU đường, đang hiện tại + bong bóng; chặng chưa xong + Tự sửa lỗi khoá', () => {
    const onHoc = vi.fn(), onKiemTra = vi.fn(), onChua = vi.fn()
    const { container } = render(<MotTrangHs {...goc({ kiem: KIEM, onKiemTra, onHoc, onChua, hs: HS })} />)
    expect(container.querySelectorAll('.kb-cta')).toHaveLength(1)
    expect(tieuDe()).toBe('Kiểm tra ôn tập')
    expect(cta()!.getAttribute('data-sac')).toBe('tin')
    expect(phuCta()).toContain('28 câu · khoảng 50 phút')
    // chặng chưa xong khoá theo kiểm tra: thẻ mức nói «làm Kiểm tra ôn tập trước, rồi mới học chặng»
    expect(container.querySelector('.kb-dong-hero')!.textContent).toContain('làm Kiểm tra ôn tập trước, rồi mới học chặng.')
    fireEvent.click(cta()!)
    expect(onKiemTra).toHaveBeenCalledOnce()
    expect(onHoc).not.toHaveBeenCalled()
    expect(onChua).not.toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: /Học thêm câu mới/ })).toBeNull()
  })

  // SỬA CÓ CHỦ ĐÍCH 10/11 (bản vẽ docs/ban-ve-mot-nut-1011 «chỉ để lại một nút»): thứ tự dòng ⇒ nút chính từng tình huống (Chặng 3 · Chặng 3 · Chặng 4 · qua mốc ⇒ Tự sửa lỗi đứng trước Chặng 5); bỏ kiểm bong bóng / vòng của dòng
  it('THỨ TỰ NÚT (thầy 27/10 «kiểm tra lên đầu, sửa lỗi chèn giữa hành trình mới»): không kiểm tra · chỉ có tự sửa · còn ≤ 2 chặng · mốc đã qua ⇒ Tự sửa lỗi là việc hiện tại', () => {
    // không có kiểm tra: chặng 3 đang học ⇒ Tự sửa lỗi sau chặng 4 (chặng mới thứ 2), trước chặng 5 ⇒ việc hiện tại vẫn là Chặng 3
    let r = render(<MotTrangHs {...goc()} />)
    expect(tieuDe()).toBe('Chặng 3')
    r.unmount(); localStorage.clear()
    // chỉ có tự sửa (không kiểm tra, không bài tập)
    r = render(<MotTrangHs {...goc({ soBaiTap: 0, coBaiTap: false })} />)
    expect(tieuDe()).toBe('Chặng 3')
    r.unmount(); localStorage.clear()
    // còn 2 chặng mới ⇒ Tự sửa lỗi sau chặng mới đầu tiên (chặng 4 đang học)
    r = render(<MotTrangHs {...goc({ so: { daLam: 18, muc: 30, chang: 4, soChang: 5 } as PropsMotTrang['so'], soBaiTap: 0, coBaiTap: false })} />)
    expect(tieuDe()).toBe('Chặng 4')
    r.unmount()
    // cùng ngày, em học qua mốc đã nhớ (sau chặng 4) ⇒ nút không trôi; Tự sửa lỗi thành việc hiện tại (trước Chặng 5)
    const onChua = vi.fn(), onHoc = vi.fn()
    render(<MotTrangHs {...goc({ so: { daLam: 24, muc: 30, chang: 5, soChang: 5 } as PropsMotTrang['so'], soBaiTap: 0, coBaiTap: false, onChua, onHoc })} />)
    expect(tieuDe()).toBe('Tự sửa lỗi')
    expect(nhanViec()).toBe('Sửa lỗi')
    expect(phuCta()).toBe('Hôm nay còn 5 câu cần sửa')
    fireEvent.click(cta()!)
    expect(onChua).toHaveBeenCalledOnce()
    expect(onHoc).not.toHaveBeenCalled()
  })

  // SỬA CÓ CHỦ ĐÍCH 10/11 (bản vẽ docs/ban-ve-mot-nut-1011 «chỉ để lại một nút»): bỏ it «VÒNG NÚT KIỂM TRA ÔN TẬP…» — vòng tiến độ (VongChang) thuộc danh sách đã bỏ; «đủ mức ⇒ Tự sửa lỗi là việc hiện tại» đã có ở it «đủ mức ⇒ băng…»

  // SỬA CÓ CHỦ ĐÍCH 10/11 (bản vẽ docs/ban-ve-mot-nut-1011 «chỉ để lại một nút»): dòng ✓ / vỡ khoá / «Đã lỡ» của danh sách đã bỏ ⇒ trước nộp nút chính là Kiểm tra ôn tập, nộp xong nút chính về Chặng 3 (mở khoá) + xoá dấu khoá; ngày có Kiểm tra ôn tập không còn chặng Tự sửa lỗi; quá hạn ⇒ không khoá (nút chính Chặng 3)
  it('nộp xong ⇒ nút kiểm tra ✓ (đã xong), các chặng mở lại theo thứ tự cũ + vỡ khoá MỘT lần; quá hạn chưa làm ⇒ không khoá, ghi «Đã lỡ»', () => {
    const { rerender, unmount } = render(<MotTrangHs {...goc({ kiem: KIEM, onKiemTra: noop })} />)
    expect(localStorage.getItem('ddh.kt-khoa')).toBe('k')
    expect(tieuDe()).toBe('Kiểm tra ôn tập')
    rerender(<MotTrangHs {...goc({ kiem: { ...KIEM, nopLuc: mo + 7200_000, diem: 8.5, trangThai: 'da_nop' as TomTatKiemTra['trangThai'] }, onKiemTra: noop })} />)
    expect(tieuDe()).toBe('Chặng 3')
    expect(nhanViec()).toBe('Bắt đầu')
    expect(localStorage.getItem('ddh.kt-khoa')).toBeNull()
    unmount()
    render(<MotTrangHs {...goc({ kiem: { ...KIEM, homNay: false, trangThai: 'het_han' as TomTatKiemTra['trangThai'] } })} />)
    expect(tieuDe()).toBe('Chặng 3')
  })

  // thầy 02/11 (ảnh bản sống «8/12» mà còn 5 câu cần sửa + chặng 2): thẻ mức báo TỔNG câu mọi việc hôm nay; đủ hết mới đổi màu dung dịch
  // SỬA CÓ CHỦ ĐÍCH 10/11 (bản vẽ docs/ban-ve-mot-nut-1011 «chỉ để lại một nút»): ngày có Kiểm tra ôn tập hôm nay không còn chặng Tự sửa lỗi riêng (thầy «Hs vẫn 57 câu à») ⇒ trường hợp 1 không cộng câu sửa: 37/46 → 36/40, «Còn 9» → «Còn 4»
  it('thẻ mức = TỔNG câu hôm nay: câu học (đến mức) + câu Tự sửa lỗi phần hôm nay + câu Kiểm tra ôn tập hôm nay; xong hết mới đổi màu', () => {
    const ngay = new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10)
    localStorage.setItem('ddh.sua-nho', JSON.stringify({ t: 'tk', n: ngay, s: [40, 5, 5, 1] })) // còn 5 câu sửa hôm nay, đã sửa 1
    const r = render(<MotTrangHs {...goc({ token: 'tk', soSua: 40, so: { daLam: 8, muc: 12, chang: 2, soChang: 2 } as PropsMotTrang['so'],
      kiem: { ...KIEM, trangThai: 'da_nop' as TomTatKiemTra['trangThai'], nopLuc: mo + 7200_000, diem: 1.85 }, onKiemTra: noop })} />)
    const the = screen.getByRole('region', { name: /^Tổng câu hôm nay/ })
    // 8/12 câu học + 28/28 câu kiểm tra đã nộp = 36/40 (ngày có Kiểm tra ôn tập: không cộng câu Tự sửa lỗi)
    expect(the.querySelector('.kb-so')!.textContent).toBe('36/40 câu')
    expect(the.textContent).toContain('Còn 4 câu nữa là dung dịch đổi màu.')
    expect(the.hasAttribute('data-du')).toBe(false)
    r.unmount(); localStorage.clear()
    localStorage.setItem('ddh.sua-nho', JSON.stringify({ t: 'tk', n: ngay, s: [40, 0, 0, 6] })) // đã sửa xong 6 câu phần hôm nay
    render(<MotTrangHs {...goc({ token: 'tk', soSua: 40, so: { daLam: 14, muc: 12, chang: 2, soChang: 2 } as PropsMotTrang['so'] })} />)
    const xong = screen.getByRole('region', { name: /^Tổng câu hôm nay/ })
    expect(xong.querySelector('.kb-so')!.textContent).toBe('18/18 câu') // vượt mức câu học không cộng thêm
    expect(xong.hasAttribute('data-du')).toBe(true) // xong hết ⇒ dung dịch đổi màu
  })
  // SỬA CÓ CHỦ ĐÍCH 10/11 (bản vẽ docs/ban-ve-mot-nut-1011 «chỉ để lại một nút»): «đường chỉ một nút» ⇒ đúng một nút chính là Kiểm tra ôn tập, bấm gọi onKiemTra
  it('ngày chỉ có Kiểm tra ôn tập ⇒ đường chỉ một nút kiểm tra, không băng bài', () => {
    const onKiemTra = vi.fn()
    render(<MotTrangHs {...goc({ kiem: { ...KIEM, baiNgayToiThieu: undefined }, ngayKiem: true, onKiemTra })} />)
    expect(document.querySelectorAll('.kb-cta')).toHaveLength(1)
    expect(tieuDe()).toBe('Kiểm tra ôn tập')
    expect(cta()!.getAttribute('data-sac')).toBe('tin')
    expect(screen.queryByRole('region', { name: 'Bài học hôm nay' })).toBeNull()
    // thầy 11/11 (ảnh màn Hôm nay «Ngày Kiểm tra ôn tập 12/28 câu»: «bỏ câu này đi»): ngày chỉ có bài kiểm tra KHÔNG còn chặng nào ⇒ không nói «rồi mới học chặng»
    expect(document.querySelector('.kb-dong-hero')!.textContent).not.toContain('rồi mới học chặng')
    expect(document.querySelector('.kb-dong-hero')!.textContent).toMatch(/^Còn \d+ câu nữa là xong bài hôm nay\.$/)
    fireEvent.click(cta()!)
    expect(onKiemTra).toHaveBeenCalledOnce()
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
  // SIẾT 13/11 (test đỏ 19:00–21:59 ngày 13/11): bong bóng Mol giận theo giờ (src/lib/lua-cam-xuc.ts) rơi câu NGUYÊN VĂN thầy «Học thật, nỗ lực thật thì kết quả
  // mới thật được.» (kho src/lib/loi-mol.ts, thầy duyệt 01/11 — ngoại lệ chỉ trong bong bóng, không phải nhãn tuần). Luật 26/10 không nới: NGOÀI bong bóng vẫn cấm
  // mọi chữ nhóm / bậc / nhãn tuần; TRONG bong bóng cấm chữ nhóm / bậc, còn «học thật / đối phó» chỉ được khi là câu nguyên văn trong kho thầy.
  // Cố định giờ (chỉ giả Date để findBy* vẫn chạy): 21:30 ⇒ Mol bực, bong bóng BẮT BUỘC là câu kho thầy; 10:00 ⇒ lời thường.
  const KHO_THAY = new Set([...Object.values(KHO_DOI_PHO), ...Object.values(KHO_GIUC_HOC)].flat())
  const NHAN = /lười|chăm|chưa đều|bậc|đối phó|học thật|bấm vội|treo|quá nhanh/i
  const NHAN_NHOM_BAC = /lười|chăm|chưa đều|bậc|bấm vội|treo|quá nhanh/i
  it('Lộ trình + Thành tích: máy chủ CŨ còn gửi nhóm Lười / bậc 1 ⇒ em chỉ thấy «Chuỗi N ngày» + việc tiếp trung tính, không chữ / màu nhóm, bậc', async () => {
    for (const [gio, phut] of [[21, 30], [10, 0]] as const) {
      vi.useFakeTimers({ toFake: ['Date'] })
      vi.setSystemTime(Date.UTC(2026, 10, 13, gio - 7, phut)) // Thứ Sáu 13/11/2026, giờ Việt Nam
      try {
        vi.stubGlobal('fetch', vi.fn(async () => traLoi({ ...NHIP_EM_LUOI, bacCham: { bac: 1, diem: 0, diemLenBac: 3 }, doTinCay: 80 })))
        for (const muc of ['hom-nay', 'ket-qua']) {
          const { container, unmount } = render(<MotTrangHs {...goc({ muc, token: 'tk', hs: HS })} />)
          // Gộp thưởng phạt 26/10: ở Lộ trình thẻ «việc tiếp» nhường chỗ thẻ bên Giải tuần + Nhiệm vụ (bản vẽ tp-4) — Thành tích vẫn giữ.
          if (muc === 'ket-qua') {
            const the = await screen.findByText(/^Việc tiếp:/)
            expect(the.closest('.dm-the')!.querySelector('h3')!.textContent).toMatch(/^Chuỗi \d+ ngày$/)
          } else await screen.findByRole('region', { name: /^Tổng câu hôm nay/ }) // hệ Kính: thẻ tổng câu hôm nay thay thẻ «Bài học hôm nay»
          const bong = [...container.querySelectorAll('.bi-loi-bong')].map((b) => b.querySelector('.ht2-an')?.textContent ?? '')
          if (muc === 'hom-nay' && gio === 21) expect(bong.some((b) => KHO_THAY.has(b)), bong.join(' | ')).toBe(true) // Mol bực ⇒ đi đúng nhánh ngoại lệ
          for (const b of bong) {
            expect(b).not.toMatch(NHAN_NHOM_BAC)
            if (NHAN.test(b)) expect(KHO_THAY.has(b), b).toBe(true)
          }
          const ngoai = container.cloneNode(true) as HTMLElement
          ngoai.querySelectorAll('.bi-loi-bong').forEach((b) => b.remove())
          expect(ngoai.textContent).not.toMatch(NHAN)
          expect(container.innerHTML).not.toMatch(/data-nhom|da-12|da-bac/)
          unmount()
        }
      } finally { vi.useRealTimers() }
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
    fireEvent.click(await screen.findByRole('button', { name: 'Thêm · Buổi học đang mở điểm danh' }))
    const khoi = screen.getByRole('form', { name: 'Điểm danh buổi học' })
    expect(within(khoi).getByText('Buổi 26/10')).toBeTruthy()
    fireEvent.change(within(khoi).getByLabelText('Mã 6 số trên máy chiếu'), { target: { value: '482 915' } })
    fireEvent.click(within(khoi).getByRole('button', { name: 'Điểm danh' }))
    expect(await screen.findByText('Đã điểm danh')).toBeTruthy()
    expect(screen.getByText('Buổi 26/10 · 12A1')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Thêm' })).toBeTruthy()
    // thầy 07/11: em bị văng ⇒ vào lại Bình Phản Ứng ngay từ khối «Đã điểm danh»
    fireEvent.click(screen.getByRole('button', { name: 'Vào Bình Phản Ứng' }))
    await waitFor(() => expect(moBpuHs).toHaveBeenCalledWith('tk', 'B1'))
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
    expect(screen.getByRole('button', { name: 'Thêm' })).toBeTruthy()
  })

  it('chưa thấy buổi mở ⇒ mục «Điểm danh» luôn có trong tấm Thêm; bấm ⇒ 6 ô mã, gửi bằng ĐÚNG lệnh /hs/diem-danh', async () => {
    const f = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith('/hs/diem-danh')) { expect(JSON.parse(String(init?.body))).toEqual({ token: 'tk', ma: '482915' }); return traLoi({ ok: true, buoi: { id: 'B1', ten: 'Buổi học 07/11/2026', lop: '12A1', daDiemDanh: true } }) }
      return traLoi({ ok: true, buoi: null })
    })
    vi.stubGlobal('fetch', f)
    menu()
    fireEvent.click(screen.getByRole('button', { name: 'Thêm' }))
    expect(screen.queryByRole('form', { name: 'Điểm danh buổi học' })).toBeNull()
    fireEvent.click(within(nav()).getByRole('button', { name: 'Điểm danh' }))
    const khoi = await screen.findByRole('form', { name: 'Điểm danh buổi học' })
    expect(within(nav()).queryAllByRole('button', { name: 'Điểm danh' }).filter((b) => b.classList.contains('tr-menu-muc'))).toHaveLength(0)
    fireEvent.change(within(khoi).getByLabelText('Mã 6 số trên máy chiếu'), { target: { value: '482915' } })
    fireEvent.click(within(khoi).getByRole('button', { name: 'Điểm danh' }))
    expect(await screen.findByText('Đã điểm danh')).toBeTruthy()
  })

  it('đúng 6 mục theo thứ tự, mỗi mục một ô biểu tượng; chuông ở đầu menu; Ca kiểm tra gọi onThi (ẩn khi ca đang mở); chạm mục ⇒ phanHoi(chon)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => traLoi({ ok: true, buoi: null })))
    phanHoi.mockClear()
    const onThi = vi.fn(), onMuc = vi.fn()
    const { unmount } = menu({ moDiemDanh: false, onThi, onMuc })
    const muc = () => within(nav()).getAllByRole('button').filter((b) => b.classList.contains('tr-menu-muc'))
    // thầy 02/11 khuya «Đổi vị trí Luyện tập bằng Kiểm tra, bỏ dòng a.i đỗ đại học»: tấm Thêm còn Luyện tập (hiện) + Cài đặt; Kiểm tra lên thanh nổi
    // SỬA CÓ CHỦ ĐÍCH 07/11 — thầy «cho nút điểm danh hiện sẵn vào phần thêm luôn»: chưa thấy buổi mở ⇒ mục «Điểm danh» đứng đầu tấm Thêm.
    // 07/11 (ảnh thầy: tấm «Thêm» ẩn 3 mục đầu ⇒ Điểm danh đứng đầu bị ẩn): Điểm danh đứng TRÊN Cài đặt, có data-hien (luôn hiện trong tấm)
    // SỬA CÓ CHỦ ĐÍCH 11/11 — thầy chốt build «Xem lại Live» (docs/dac-ta-live-xem-lai-1011.md mục 2.1): thêm dòng «Live» đứng sau «Luyện tập»
    // (là mục thứ 4 trong DOM ⇒ không dính luật ẩn 3 mục đầu của tấm «Thêm», hiện ngay dưới «Luyện tập»).
    expect(muc().map((b) => b.textContent)).toEqual(['Hôm nay', 'Luyện tập', 'Thành tích', 'Live', 'Điểm danh', 'Cài đặt'])
    expect(muc()[4]!.hasAttribute('data-hien')).toBe(true)
    expect(within(nav()).getByRole('button', { name: 'Luyện tập' }).hasAttribute('data-hien')).toBe(true)
    expect(muc().every((b) => b.querySelector('.tr-menu-o'))).toBe(true)
    expect(within(nav()).getByRole('button', { name: 'Hôm nay' }).getAttribute('aria-current')).toBe('page')
    expect(nav().querySelector('.tr-menu-ds hr')).toBeNull() // không vạch ngăn giữa 6 mục
    // chuông THẬT nằm ở hàng đầu menu, cạnh «Đỗ Đại Học»
    expect(nav().querySelector('.tr-menu-dau .tr-menu-tb .m3-tb-chuong')).not.toBeNull()
    expect(nav().querySelector('.tr-menu-dau')!.textContent).toContain('Đỗ Đại Học')
    fireEvent.click(document.querySelector<HTMLElement>('.kb-thanh-ds [aria-label="Kiểm tra"]')!)
    expect(onThi).toHaveBeenCalledOnce()
    fireEvent.click(within(nav()).getByRole('button', { name: 'Thành tích' }))
    expect(onMuc).toHaveBeenCalledWith('ket-qua')
    await waitFor(() => expect(phanHoi).toHaveBeenCalled())
    expect(phanHoi).toHaveBeenCalledWith('chon')
    unmount()
    menu({ moDiemDanh: false, coCa: true })
    expect(within(nav()).queryByRole('button', { name: 'Ca kiểm tra' })).toBeNull()
    expect(within(nav()).queryByRole('button', { name: 'Hỏi A.I Đỗ Đại Học' })).toBeNull()
  })

  it('nút Thêm bật / tắt: bấm lần 1 mở bảng, bấm lần 2 ẩn bảng (thầy 02/11 «bấm 1 lần thì hiện bảng bấm lần nữa thì không ẩn bảng»)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => traLoi({ ok: true, buoi: null })))
    menu({ moDiemDanh: false })
    const nut = screen.getByRole('button', { name: 'Thêm' })
    fireEvent.click(nut)
    expect(nut.getAttribute('aria-expanded')).toBe('true')
    expect(nav().hasAttribute('data-mo')).toBe(true)
    fireEvent.click(nut)
    expect(nut.getAttribute('aria-expanded')).toBe('false')
    expect(nav().hasAttribute('data-mo')).toBe(false)
  })

  it('Cài đặt mở tấm con (Âm thanh · Rung · Cập nhật bài học · Của em), Quay lại / Esc về 6 mục; công tắc ghi localStorage ddh.am / ddh.rung (mặc định Bật)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => traLoi({ ok: true, buoi: null })))
    const onTaiLai = vi.fn(), onCuaEm = vi.fn()
    menu({ moDiemDanh: false, onTaiLai, onCuaEm })
    fireEvent.click(screen.getByRole('button', { name: 'Thêm' }))
    expect(screen.queryByRole('switch', { name: /Âm thanh/ })).toBeNull() // tấm con chưa mở ⇒ công tắc ẩn
    const cai = within(nav()).getByRole('button', { name: 'Cài đặt' })
    expect(cai.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(cai)
    const tam = screen.getByRole('group', { name: 'Cài đặt' })
    expect(within(nav()).queryByRole('button', { name: 'Hôm nay' })).toBeNull()
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
    expect(within(nav()).getByRole('button', { name: 'Hôm nay' })).toBeTruthy()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(nav().hasAttribute('data-mo')).toBe(false)
    // Cập nhật bài học / Của em giữ nguyên hành vi
    fireEvent.click(screen.getByRole('button', { name: 'Thêm' }))
    expect(within(nav()).getByRole('button', { name: 'Hôm nay' })).toBeTruthy() // mở lại ⇒ luôn về 6 mục
    fireEvent.click(within(nav()).getByRole('button', { name: 'Cài đặt' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cập nhật bài học' }))
    expect(onTaiLai).toHaveBeenCalledOnce()
    fireEvent.click(screen.getByRole('button', { name: 'Thêm' }))
    fireEvent.click(within(nav()).getByRole('button', { name: 'Cài đặt' }))
    fireEvent.click(screen.getByRole('button', { name: 'Của em' }))
    expect(onCuaEm).toHaveBeenCalledOnce()
  })

  it('nút A.I tròn riêng bắn sự kiện mở ĐÚNG tấm chat của BongBongAiDdh; tấm Thêm KHÔNG còn dòng Hỏi A.I (thầy 02/11 khuya); thanh nổi: Hôm nay · Kiểm tra · Thành tích', () => {
    vi.stubGlobal('fetch', vi.fn(async () => traLoi({ ok: true, buoi: null })))
    const nghe = vi.fn()
    window.addEventListener('ddh:mo-ai', nghe)
    menu({ moDiemDanh: false })
    expect(within(document.getElementById('tr-menu')!).queryByRole('button', { name: 'Hỏi A.I Đỗ Đại Học' })).toBeNull()
    fireEvent.click(document.querySelector('.tr-menu-ray .tr-ray-ai')!)
    window.removeEventListener('ddh:mo-ai', nghe)
    expect(nghe).toHaveBeenCalledTimes(1)
    expect([...document.querySelectorAll('.tr-menu-ray .tr-ray-muc')].map((b) => b.getAttribute('aria-label'))).toEqual(['Hôm nay', 'Kiểm tra', 'Thành tích', 'Hỏi A.I Đỗ Đại Học'])
    expect(document.querySelector('.tr-menu-ray .tr-menu-cham')).not.toBeNull()
  })
})
