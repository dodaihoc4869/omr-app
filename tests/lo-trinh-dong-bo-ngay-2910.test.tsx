// @vitest-environment jsdom
// LỘ TRÌNH ĐỒNG BỘ NGAY (thầy 29/10 «làm xong thoát ra Lộ trình phải đồng bộ chính xác ngay lập tức, hiện tại load lại mới đồng bộ»).
// Nguyên nhân: số «đã làm» của Sảnh tính từ sổ học mà máy chủ ghi SAU khi trả lời (việc nền) ⇒ Sảnh nạp ngay lúc thoát mang số cũ. Khoá:
//  (1) `vaDaLamSanh` chỉ NÂNG số (không bao giờ hạ), trừ đúng số câu còn lại, tách câu tiếp cận / tự làm, bỏ qua kết quả không phải Sảnh Gói 7;
//  (2) màn làm chặng báo `onVa` NGAY sau mỗi câu mới (không chờ máy chủ), không tính câu làm lại / câu lặp;
//  (3) thoát màn ⇒ nạp lại Sảnh ngay + thêm 2 lần (4 s, 12 s).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import ManLamBaiTap, { vaDaLamSanh } from '../src/components/hoc-tap/ManLamBaiTap'
import { docSanh, goiHoa2, type KetQuaSanh } from '../src/components/hoa2/api'
import type { TomTatGoi7 } from '../src/lib/goi-bai-7'

vi.mock('../src/components/hoa2/api', async (goc) => ({ ...await goc<typeof import('../src/components/hoa2/api')>(), goiHoa2: vi.fn() }))
vi.mock('../src/components/hoa2/doc-luong-nop', async () => { const api = await import('../src/components/hoa2/api'); return { nopCauLuong: (token: string, du: Record<string, unknown>, giay: number) => api.goiHoa2('answer', token, du, giay) } })
beforeEach(() => { document.documentElement.dataset.trong = 'hs' })
afterEach(() => { cleanup(); vi.mocked(goiHoa2).mockReset(); vi.useRealTimers(); localStorage.clear(); delete document.documentElement.dataset.trong })

const goi: TomTatGoi7 = { bat: true, ngay: '2026-10-29', toiThieu: 24, daLamHomNay: 4, tuLamCon: 14, tiepCanCon: 6, thieuPhu: 0, thieuNgay: 0, canHoTro: false, kienThucCu: { tong: 10, dat: 7, tyLe: 70 },
  goi: [{ id: 'g1', ten: 'Bài Amine', batDau: '2026-10-29', han: '2026-11-05', tong: 100, daGap: 4, con: 96, quota: 19, gapHomNay: 4, quaHan: false, canBoSung: 0, to: ['de'] }], diemDaDo: [] }
const sanh = (g: Partial<TomTatGoi7> = {}, con = 20): KetQuaSanh => docSanh({ cheDo2: true, theLuc: { con, tong: 24 }, goi7: { ...goi, ...g } })!
const goi7Cua = (k: KetQuaSanh) => (k.cheDo2 && 'sanh' in k ? k.sanh.goi7! : null)!
const conCua = (k: KetQuaSanh) => (k.cheDo2 && 'sanh' in k ? k.sanh.theLuc.con : -1)

describe('vaDaLamSanh (hàm thuần)', () => {
  it('nâng «đã làm» và trừ đúng số câu còn lại; câu tiếp cận trừ ở tiepCanCon', () => {
    const k = vaDaLamSanh(6, 1, '2026-10-29')(sanh())
    expect(goi7Cua(k).daLamHomNay).toBe(6)
    expect(goi7Cua(k)).toMatchObject({ tuLamCon: 13, tiepCanCon: 5 })
    expect(conCua(k)).toBe(18)
    expect(vaDaLamSanh(6, 0, '2026-10-29')(sanh())).toSatisfy((x: KetQuaSanh) => goi7Cua(x).tuLamCon === 12 && goi7Cua(x).tiepCanCon === 6)
  })
  it('KHÔNG bao giờ hạ số; máy chủ đã theo kịp ⇒ giữ nguyên đối tượng; vá hai lần không cộng dồn', () => {
    const cao = sanh({ daLamHomNay: 9 }, 15)
    expect(vaDaLamSanh(6, 0, '2026-10-29')(cao)).toBe(cao)
    const mot = vaDaLamSanh(6, 0, '2026-10-29')(sanh())
    expect(vaDaLamSanh(6, 0, '2026-10-29')(mot)).toBe(mot)
    expect(conCua(vaDaLamSanh(7, 0, '2026-10-29')(mot))).toBe(17)
    const homSau = sanh({ ngay: '2026-10-30', daLamHomNay: 0 })
    expect(vaDaLamSanh(6, 0, '2026-10-29')(homSau)).toBe(homSau) // sang ngày mới ⇒ bản vá của hôm qua KHÔNG đè số ngày mới
  })
  it('không phải Sảnh Gói 7 (cờ tắt / chọn thú / không có goi7) ⇒ trả nguyên', () => {
    const tat: KetQuaSanh = { cheDo2: false }
    expect(vaDaLamSanh(6, 0, '2026-10-29')(tat)).toBe(tat)
    const khongG7 = docSanh({ cheDo2: true, theLuc: { con: 5, tong: 5 } })!
    expect(vaDaLamSanh(6, 0, '2026-10-29')(khongG7)).toBe(khongG7)
  })
})

const nen = { maDe: 'de-8', version: 'v1', group: 'g', hinhAnh: [], dang: null, tenDang: 'Amine', mucDo: 'hieu', sao: 0, kienThuc: [], ideas: [] }
const C = (i: number, vai = 'tu_lam') => ({ ...nen, qid: `q${i}`, phan: 'I' as const, text: `Đề câu số ${i}`, choices: ['2', '8', '3', '4'], vaiGoi7: vai })
const lam = async (dung = true) => {
  vi.mocked(goiHoa2).mockResolvedValueOnce({ correct: dung, answer: 'D' })
  fireEvent.click(screen.getByRole('radio', { name: dung ? /^D/ : /^B/ }))
  fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra' }))
  await screen.findByRole('heading', { name: dung ? 'Chính xác!' : 'Chưa đúng' })
}

describe('màn làm chặng ⇒ Lộ trình đúng NGAY', () => {
  it('mỗi câu mới ⇒ onVa ngay (không chờ hoc-tap-dem); câu làm lại không cộng; vá lên bản Sảnh cũ ra đúng số', async () => {
    vi.mocked(goiHoa2).mockResolvedValueOnce({ ok: true, id: 'p1', goi7: goi, questions: [C(1), C(2, 'tiep_can'), C(3, 'lam_lai')] })
    vi.mocked(goiHoa2).mockResolvedValue({ ok: true, daLamHomNay: 0, toiThieu: 24 }) // hoc-tap-dem về MUỘN và SỐ CŨ (sổ học chưa kịp ghi)
    const onVa = vi.fn(), onCapNhat = vi.fn()
    render(<ManLamBaiTap token="tk" sbd="s1" onVe={vi.fn()} onCapNhat={onCapNhat} onVa={onVa} onChua={vi.fn()} />)
    await screen.findByText('Đề câu số 1')
    vi.mocked(goiHoa2).mockResolvedValueOnce({ correct: true, answer: 'D' })
    fireEvent.click(screen.getByRole('radio', { name: /^D/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra' }))
    await screen.findByRole('heading', { name: 'Chính xác!' })
    expect(onVa).toHaveBeenCalled()
    const cu = sanh()
    const sau1 = onVa.mock.calls.at(-1)![0](cu) as KetQuaSanh
    expect(goi7Cua(sau1).daLamHomNay).toBe(5) // 4 lúc mở chặng + 1 câu vừa làm, dù hoc-tap-dem trả số cũ 0
    expect(conCua(sau1)).toBe(19)
    // số cũ của máy chủ về sau không làm hạ số đã vá
    expect(goi7Cua(onVa.mock.calls.at(-1)![0](sanh({ daLamHomNay: 4 }))).daLamHomNay).toBe(5)
  })
  it('thoát màn sau khi làm câu ⇒ nạp lại Sảnh ngay + sau 4 s + sau 12 s', async () => {
    vi.mocked(goiHoa2).mockResolvedValueOnce({ ok: true, id: 'p1', goi7: goi, questions: [C(1), C(2)] })
    vi.mocked(goiHoa2).mockResolvedValue({ ok: true, daLamHomNay: 5, toiThieu: 24 })
    const onCapNhat = vi.fn()
    const { unmount } = render(<ManLamBaiTap token="tk" sbd="s1" onVe={vi.fn()} onCapNhat={onCapNhat} onVa={vi.fn()} onChua={vi.fn()} />)
    await screen.findByText('Đề câu số 1')
    await lam(true)
    vi.useFakeTimers()
    onCapNhat.mockClear()
    unmount()
    expect(onCapNhat).toHaveBeenCalledTimes(1)
    act(() => { vi.advanceTimersByTime(4100) })
    expect(onCapNhat).toHaveBeenCalledTimes(2)
    act(() => { vi.advanceTimersByTime(8100) })
    expect(onCapNhat).toHaveBeenCalledTimes(3)
  })
})

// ── Sửa lỗi: em vừa sửa xong một câu ⇒ Lộ trình dựng lại việc hôm nay TỨC THÌ (bản sao danh sách ⇒ vẽ lại), rồi hỏi máy chủ làm tươi nền (gộp một lượt) ──
vi.mock('../src/lib/chua-cau-sai-api', async (goc) => ({ ...await goc<typeof import('../src/lib/chua-cau-sai-api')>(), apiDanhSachTuChua: vi.fn() }))
describe('Sửa lỗi ⇒ Lộ trình', () => {
  it('ghiXongHomNay gọi phatTuSua: người nghe nhận bản SAO danh sách NGAY (React vẽ lại từ nhật ký trên máy), mỗi câu một lần', async () => {
    const { apiDanhSachTuChua } = await import('../src/lib/chua-cau-sai-api')
    const { ghiXongHomNay, ngheXongSua } = await import('../src/lib/tu-sua-viec-hom-nay')
    localStorage.setItem('omr_student_portal_auth', JSON.stringify({ sbd: '11010', token: 'tk' }))
    const nghe = vi.fn(); const go = ngheXongSua(nghe)
    ghiXongHomNay('d1'); ghiXongHomNay('d2'); ghiXongHomNay('d2') // câu đã ghi rồi ⇒ không báo lại
    expect(nghe).toHaveBeenCalledTimes(2)
    expect(apiDanhSachTuChua).not.toHaveBeenCalled() // không thêm lượt gọi máy chủ (giờ cao điểm)
    go(); ghiXongHomNay('d3')
    expect(nghe).toHaveBeenCalledTimes(2) // đã gỡ người nghe
  })
})
