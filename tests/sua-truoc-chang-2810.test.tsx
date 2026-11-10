// SỬA XONG MỚI MỞ CHẶNG SAU (thầy 28/10 «Tôi muốn sửa phải xong mới hiện chặng sau»): Lộ trình khoá các chặng nằm sau nút Tự sửa lỗi tới khi phần ngày
// (12 câu đầu của việc hôm nay) xong; «Sửa thêm 1 chặng» không khoá lại; thiếu số ⇒ không khoá; Kiểm tra ôn tập đang khoá thì khoá kiểm tra đứng trên.
// 10/11 (bản vẽ docs/ban-ve-mot-nut-1011 «chỉ để lại một nút»): danh sách «Việc hôm nay» đã bỏ ⇒ việc hiện tại đọc qua NÚT CHÍNH `.kb-cta`.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-chu' }))
vi.mock('../src/lib/phan-hoi', () => ({ phanHoi: vi.fn() }))
const SO = vi.hoisted(() => ({ con: 8 as number | null, phan: 8 as number | null, bao: vi.fn() }))
vi.mock('../src/components/hoc-tap/ManTuChua', () => ({
  dungViecHomNay: () => ({ viec: {}, luu: null }), luuViecHomNay: () => {}, docSbdHs: () => 'S1',
  conSuaHomNay: () => SO.con, conSuaPhanNgay: () => SO.phan, baoKhoaSua: SO.bao, ngheXongSua: () => () => {},
}))
import { MotTrangHs, type PropsMotTrang } from '../src/components/hoc-tap/TrongHs'
import type { TomTatKiemTra } from '../src/lib/kiem-tra-ca-nhan'

const noop = () => {}
const goc = (them: Partial<PropsMotTrang> = {}): PropsMotTrang => ({
  so: { daLam: 12, muc: 30, chang: 3, soChang: 5 } as PropsMotTrang['so'], dangTai: false, tenBai: 'Ester – Lipid', viec: 'Hiểu · Chặng 3/5',
  onHoc: noop, khoaHoc: false, hetCau: false, coCa: false, onThi: noop, soSua: 20, onChua: noop, ngayKiem: false, soBaiTap: 0, coBaiTap: false, onBaiTap: noop, ghi: [], ...them,
})
const ngay = new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10)
/** Nút chính duy nhất của Hôm nay (bản vẽ docs/ban-ve-mot-nut-1011). */
const cta = () => document.querySelector<HTMLButtonElement>('.kb-cta')
const tieuDe = () => cta()?.querySelector('b')?.textContent
afterEach(() => { cleanup(); vi.unstubAllGlobals(); SO.con = 8; SO.phan = 8; SO.bao.mockReset(); try { localStorage.clear() } catch { /* bỏ qua */ } })

describe('Lộ trình: khoá chặng sau nút Tự sửa lỗi', () => {
  // SỬA CÓ CHỦ ĐÍCH 10/11 (bản vẽ docs/ban-ve-mot-nut-1011 «chỉ để lại một nút»): thứ tự dòng + thẻ khoá chặng 5 đã bỏ ⇒ chờ mảnh việc hôm nay nạp (thẻ mức 8 câu sửa), nút chính vẫn là Chặng 3 (học được), chưa báo máy chủ
  it('phần ngày còn 8 câu ⇒ chặng NẰM SAU nút Sửa lỗi khoá xám (thẻ «Sửa xong 8 lỗi hôm nay…»); chặng trước nút vẫn học được; chưa tới nút ⇒ chưa báo máy chủ', async () => {
    const onHoc = vi.fn(), onChua = vi.fn()
    const { container } = render(<MotTrangHs {...goc({ onHoc, onChua })} />)
    // mảnh việc hôm nay đã nạp ⇒ thẻ mức cộng đúng 8 câu sửa còn lại (12 học / 30 + 8)
    await waitFor(() => expect(container.querySelector('.kb-so')!.textContent).toBe('12/38 câu'))
    expect(tieuDe()).toBe('Chặng 3')
    expect(cta()!.querySelector('.kb-cta-nhan')!.textContent).toBe('Bắt đầu')
    fireEvent.click(cta()!)
    expect(onHoc).toHaveBeenCalledOnce()
    expect(onChua).not.toHaveBeenCalled()
    expect(SO.bao).not.toHaveBeenCalled()
  })

  // SỬA CÓ CHỦ ĐÍCH 10/11 (bản vẽ docs/ban-ve-mot-nut-1011 «chỉ để lại một nút»): thứ tự dòng / nhãn việc / vỡ khoá dòng đã bỏ ⇒ nút chính là Tự sửa lỗi (đúng một nút), sửa xong ⇒ nút chính về Chặng 3
  it('tới nút Sửa lỗi (đã qua mốc) ⇒ mọi chặng chưa xong phía sau khoá, bong bóng chỉ ở nút Sửa lỗi, báo máy chủ; về 0 ⇒ mở + vỡ khoá MỘT lần', async () => {
    localStorage.setItem('ddh.moc-sua', JSON.stringify({ ngay, tong: 5, sau: 2 }))
    const onHoc = vi.fn(), onChua = vi.fn()
    const { rerender, container } = render(<MotTrangHs {...goc({ onHoc, onChua })} />)
    await waitFor(() => expect(SO.bao).toHaveBeenCalled())
    expect(container.querySelectorAll('.kb-cta')).toHaveLength(1)
    expect(tieuDe()).toBe('Tự sửa lỗi')
    expect(cta()!.querySelector('.kb-cta-nhan')!.textContent).toBe('Sửa lỗi')
    expect(cta()!.getAttribute('data-sac')).toBe('sai')
    expect(cta()!.querySelector('.kb-phu')!.textContent).toBe('Hôm nay còn 8 câu cần sửa')
    fireEvent.click(cta()!)
    expect(onChua).toHaveBeenCalledOnce()
    expect(onHoc).not.toHaveBeenCalled()
    expect(localStorage.getItem('ddh.sua-khoa')).toBe(ngay)
    // sửa xong phần ngày ⇒ mở: nút chính về Chặng 3
    SO.con = 0; SO.phan = 0
    rerender(<MotTrangHs {...goc({ ghi: ['x'], onHoc, onChua })} />)
    await waitFor(() => expect(tieuDe()).toBe('Chặng 3'))
    fireEvent.click(cta()!)
    expect(onHoc).toHaveBeenCalledOnce()
    expect(localStorage.getItem('ddh.sua-khoa')).toBeNull()
  })

  // SỬA CÓ CHỦ ĐÍCH 10/11 (bản vẽ docs/ban-ve-mot-nut-1011 «chỉ để lại một nút»): bỏ it «"Sửa thêm 1 chặng" ⇒ KHÔNG khoá lại; thiếu số ⇒ không khoá» — chỉ kiểm dòng khoá Chặng 5 của danh sách đã bỏ (nút chính là Chặng 3 trong mọi trường hợp)

  // SỬA CÓ CHỦ ĐÍCH 10/11 (bản vẽ docs/ban-ve-mot-nut-1011 «chỉ để lại một nút»): ngày có Kiểm tra ôn tập hôm nay không còn chặng Tự sửa lỗi riêng (thầy «Hs vẫn 57 câu à») ⇒ nút chính là Kiểm tra ôn tập, không có Tự sửa lỗi, không báo máy chủ
  it('có cả Kiểm tra ôn tập đang mở ⇒ khoá kiểm tra đứng trên (chặng + Sửa lỗi khoá theo kiểm tra)', async () => {
    const mo = Date.parse(`${ngay}T00:00:00+07:00`)
    const KIEM: TomTatKiemTra = { id: 'k', ngay, moLuc: mo, hanLuc: mo + 86400_000, serverNow: Date.now(), trangThai: 'can_lam', homNay: true, baiNgayToiThieu: 12,
      tong: 28, daTra: 0, con: 28, soChang: 4, phut: 50, soBai: 6, tongKienThuc: 10, phuDe: 10, nguonDayDu: true, lyDo: '', thieuNguon: 0, diem: null, nopLuc: null }
    const onKiemTra = vi.fn(), onHoc = vi.fn(), onChua = vi.fn()
    const { container } = render(<MotTrangHs {...goc({ kiem: KIEM, onKiemTra, onHoc, onChua })} />)
    expect(container.querySelectorAll('.kb-cta')).toHaveLength(1)
    expect(tieuDe()).toBe('Kiểm tra ôn tập')
    expect(cta()!.getAttribute('data-sac')).toBe('tin')
    fireEvent.click(cta()!)
    expect(onKiemTra).toHaveBeenCalledOnce()
    expect(onHoc).not.toHaveBeenCalled()
    expect(onChua).not.toHaveBeenCalled()
    await new Promise((r) => setTimeout(r, 0))
    expect(SO.bao).not.toHaveBeenCalled()
  })
})

describe('Sảnh chưa về (ảnh thầy 28/10 giờ cao điểm: Lộ trình chỉ có nút Sửa lỗi)', () => {
  // SỬA CÓ CHỦ ĐÍCH 10/11 (bản vẽ docs/ban-ve-mot-nut-1011 «chỉ để lại một nút»): «chưa vẽ đường» ⇒ chưa có nút chính (không chỉ còn nút Sửa lỗi); có số ⇒ nút chính Chặng 3
  it('đang tải, chưa có số ⇒ báo «Đang tải bài học hôm nay…», CHƯA vẽ đường (không chỉ còn nút Sửa lỗi); có số ⇒ đường như cũ', async () => {
    const { rerender } = render(<MotTrangHs {...goc({ so: null, dangTai: true })} />)
    expect(screen.getByRole('status').textContent).toBe('Đang tải bài học hôm nay…')
    expect(cta()).toBeNull()
    rerender(<MotTrangHs {...goc()} />)
    await waitFor(() => expect(tieuDe()).toBe('Chặng 3'))
    expect(screen.queryByText('Đang tải bài học hôm nay…')).toBeNull()
  })
})
