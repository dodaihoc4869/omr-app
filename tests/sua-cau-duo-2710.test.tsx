// @vitest-environment jsdom
// SỬA CÂU KIỂU DUOLINGO (thầy 27/10 «Phần sửa câu tôi chưa thấy giao diện của doligo», src/components/chua-cau-sai/ChuaGonDuo.tsx). Khoá:
//   · CHỈ khi <html data-trong="hs">: khung Duo (thanh tiến độ, ô phương án, «Kiểm tra» ở đáy); tắt «Trong» ⇒ màn cũ (tests/chua-gon-giao-dien-2510);
//   · cùng lệnh, cùng dữ liệu gửi: gon-nop nhận đúng (token, đợt, bản, câu trả lời, khoá); đáp án KHÔNG có trên màn trước khi nộp;
//   · đúng ⇒ tấm xanh «Em đã tự sửa xong câu này» + «Tiếp tục»; câu cuối chặng ⇒ màn xong chặng có nút sang chặng sau;
//   · sai ⇒ tấm đỏ + gợi ý, chưa ghi xong; «Làm lại câu này» mở lần 2; sai nữa ⇒ đáp án + «Lời giải» mở tấm lời giải;
//   · giữ chân khi thoát giữa chặng sửa (useGiuChan, như màn làm chặng — PR 415);
//   · tienDoSua: vị trí câu trong chặng của Việc hôm nay.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'

const api = vi.hoisted(() => ({ apiMoDot: vi.fn(), apiPhatItem: vi.fn(), apiNopItem: vi.fn(), apiXinGoiY: vi.fn(), apiCoChua: vi.fn(), apiGonMo: vi.fn(), apiGonNop: vi.fn() }))
vi.mock('../src/lib/chua-cau-sai-api', () => api)
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
vi.mock('../src/lib/may-chu-moi', () => ({ layCauHinhMayChu: async () => ({ URL: 'https://may.test' }), xongNapDiaChi: async () => {} }))
import Man from '../src/components/chua-cau-sai/ManChuaCauSai'
import { tienDoSua } from '../src/components/hoc-tap/ManTuChua'
import type { ViecHomNay, ViecMuc } from '../src/lib/tu-sua-viec-hom-nay'
import type { MucChua } from '../src/lib/chua-cau-sai-api'

const DE = { qid: 'Q', phan: 'I', text: 'Thuỷ phân hoàn toàn 8,8 gam etyl axetat bằng dung dịch NaOH vừa đủ. Khối lượng muối thu được là', choices: ['8,2 gam.', '6,8 gam.', '9,6 gam.', '4,1 gam.'], ideas: [], hinhAnh: [], tenDang: 'Thuỷ phân ester' }
const CHI_TIET = { de: { ...DE, maDe: 'DH-12', mucDo: 'hieu', sao: 0 }, dapAn: 'A', loiGiai: { chot: 'Muối CH₃COONa là 8,2 gam.' } }
const MO = { ok: true, dotId: 'D1', lan: 1, ban: 'Q', banKhac: false, tuSuaNeuDung: true, de: DE }
const CHO = { timeout: 8000 } // mảnh trình bày Duo nạp lười
const xong = () => (JSON.parse(localStorage.getItem('omr_tu_sua_hom_nay_10044') || '{"x":[]}') as { x: string[] }).x

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  localStorage.setItem('omr_student_portal_auth', JSON.stringify({ sbd: '10044', token: 't' }))
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ ok: true, cau: [] }) })))
  api.apiMoDot.mockResolvedValue({ ok: true, dotId: 'D1', trangThai: 'thieu_hoc_lieu' })
  api.apiGonMo.mockResolvedValue(MO)
  document.documentElement.dataset.trong = 'hs'
})
afterEach(() => { cleanup(); vi.unstubAllGlobals(); delete document.documentElement.dataset.trong })

describe('Sửa câu kiểu Duolingo («Trong» HS)', () => {
  it('khung Duo: thanh tiến độ + ô phương án + «Kiểm tra»; nộp gửi y lệnh cũ; đúng ⇒ tấm xanh, «Tiếp tục» sang câu kế', async () => {
    const onTiep = vi.fn()
    const { container } = render(<Man token="t" qid="Q" onVe={() => {}} onTiep={onTiep} />)
    const kiem = await screen.findByRole('button', { name: 'Kiểm tra' }, CHO) as HTMLButtonElement
    expect(container.querySelector('.ht2-lam.duo .duo-tren .duo-thanh[role=progressbar]')).toBeTruthy()
    expect(container.querySelector('.ccs-dau')).toBeNull() // không còn đầu màn cũ
    expect(screen.getByText('Câu em đã sai')).toBeTruthy()
    expect(kiem.disabled).toBe(true)
    expect(screen.queryByText(/Đáp án/)).toBeNull()
    api.apiGonNop.mockResolvedValue({ ok: true, dotId: 'D1', lan: 1, ban: 'Q', dung: true, ket: 'tu_sua', trangThai: 'da_tu_sua', chiTiet: CHI_TIET })
    fireEvent.click(screen.getByRole('radio', { name: /8,2/ }))
    expect(kiem.disabled).toBe(false)
    fireEvent.click(kiem)
    expect(await screen.findByRole('heading', { name: 'Em đã tự sửa xong câu này' })).toBeTruthy()
    expect(api.apiGonNop).toHaveBeenCalledWith('t', 'D1', 'Q', 'A', expect.any(String))
    expect(container.querySelector('.duo-ket[data-tt=dung]')).toBeTruthy()
    expect(xong()).toEqual(['D1', 'Q'])
    fireEvent.click(screen.getByRole('button', { name: 'Tiếp tục' }))
    expect(onTiep).toHaveBeenCalledOnce()
  })

  it('câu cuối chặng ⇒ «Tiếp tục» mở màn xong chặng (Bi mừng), nút sang chặng sau gọi câu kế', async () => {
    const onTiep = vi.fn()
    const { container } = render(<Man token="t" qid="Q" onVe={() => {}} onTiep={onTiep} tienDo={{ so: 2, xong: 3, tong: 4, cuoi: true, conSau: true, changTiep: 3, homNay: { xong: 8, tong: 12 } }} />)
    await screen.findByRole('button', { name: 'Kiểm tra' }, CHO)
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('75')
    api.apiGonNop.mockResolvedValue({ ok: true, dotId: 'D1', lan: 1, ban: 'Q', dung: true, ket: 'tu_sua', trangThai: 'da_tu_sua', chiTiet: CHI_TIET })
    fireEvent.click(screen.getByRole('radio', { name: /8,2/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra' }))
    await screen.findByRole('heading', { name: 'Em đã tự sửa xong câu này' })
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('100')
    fireEvent.click(screen.getByRole('button', { name: 'Tiếp tục' }))
    expect(onTiep).not.toHaveBeenCalled()
    expect(screen.getByRole('heading', { name: 'Xong chặng sửa 2!' })).toBeTruthy()
    expect(container.querySelector('.duo-xong .bi[data-cam=mung]')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Sửa tiếp chặng 3' }))
    expect(onTiep).toHaveBeenCalledOnce()
  })

  it('sai ⇒ tấm đỏ + gợi ý, không đáp án, chưa ghi xong; «Làm lại câu này» ⇒ lần 2; sai nữa ⇒ đáp án + tấm lời giải', async () => {
    const { container } = render(<Man token="t" qid="Q" onVe={() => {}} />)
    await screen.findByRole('button', { name: 'Kiểm tra' }, CHO)
    api.apiGonNop.mockResolvedValueOnce({ ok: true, dotId: 'D1', lan: 1, ban: 'Q', dung: false, ket: 'goi_y', goiY: 'Em gạch chân điều đề hỏi.' })
    fireEvent.click(screen.getByRole('radio', { name: /6,8/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra' }))
    expect(await screen.findByRole('heading', { name: 'Chưa đúng · em thử thêm một lần' })).toBeTruthy()
    expect(container.querySelector('.duo-ket[data-tt=sai]')).toBeTruthy()
    expect(screen.getByText(/gạch chân điều đề hỏi/)).toBeTruthy()
    expect(screen.queryByText(/Đáp án/)).toBeNull()
    expect(xong()).toEqual([])
    api.apiGonMo.mockResolvedValueOnce({ ...MO, lan: 2, tuSuaNeuDung: false })
    fireEvent.click(screen.getByRole('button', { name: 'Làm lại câu này' }))
    expect(await screen.findByText(/· lần 2/)).toBeTruthy()
    expect(api.apiGonMo).toHaveBeenCalledTimes(2)
    api.apiGonNop.mockResolvedValueOnce({ ok: true, dotId: 'D1', lan: 2, ban: 'Q', dung: false, ket: 'loi_giai', chiTiet: CHI_TIET })
    fireEvent.click(screen.getByRole('radio', { name: /9,6/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra' }))
    expect(await screen.findByRole('heading', { name: 'Chưa đúng · xem đáp án và lời giải' })).toBeTruthy()
    expect(screen.getByText(/Đáp án:/)).toBeTruthy()
    expect(xong()).toEqual(['D1', 'Q'])
    fireEvent.click(screen.getByRole('button', { name: 'Lời giải' }))
    expect(screen.getByRole('dialog', { name: 'Lời giải' })).toBeTruthy()
  })

  it('giữ chân (như màn làm chặng): giữa chặng sửa đã xong ≥ 1 câu ⇒ X mở tấm «Đừng đi mà…», «Tiếp tục học» ở lại, «Thoát» về; Esc cũng mở tấm', async () => {
    const onVe = vi.fn()
    render(<Man token="t" qid="Q" onVe={onVe} tienDo={{ so: 1, xong: 1, tong: 4, cuoi: false, conSau: true, changTiep: 1 }} />)
    await screen.findByRole('button', { name: 'Kiểm tra' }, CHO)
    fireEvent.click(screen.getByRole('button', { name: 'Quay lại' }))
    expect(await screen.findByRole('heading', { name: 'Đừng đi mà, chỉ còn 3 câu nữa là xong chặng rồi!' }, CHO)).toBeTruthy()
    expect(onVe).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Tiếp tục học' }))
    expect(screen.queryByRole('heading', { name: /Đừng đi mà/ })).toBeNull()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(await screen.findByRole('heading', { name: /Đừng đi mà/ }, CHO)).toBeTruthy()
    expect(onVe).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Thoát' }))
    expect(onVe).toHaveBeenCalledOnce()
  })

  it('chưa sửa câu nào trong chặng (hoặc câu ngoài việc hôm nay) ⇒ X / Esc thoát thẳng, không tấm', async () => {
    const onVe = vi.fn()
    render(<Man token="t" qid="Q" onVe={onVe} tienDo={{ so: 1, xong: 0, tong: 4, cuoi: false, conSau: true, changTiep: 1 }} />)
    await screen.findByRole('button', { name: 'Kiểm tra' }, CHO)
    fireEvent.click(screen.getByRole('button', { name: 'Quay lại' }))
    expect(onVe).toHaveBeenCalledOnce()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onVe).toHaveBeenCalledTimes(2)
    expect(screen.queryByRole('heading', { name: /Đừng đi mà/ })).toBeNull()
  })

  it('tắt «Trong» (không data-trong) ⇒ màn cũ, không khung Duo', async () => {
    delete document.documentElement.dataset.trong
    const { container } = render(<Man token="t" qid="Q" onVe={() => {}} />)
    expect(await screen.findByRole('heading', { name: 'Em tự làm lại câu này' }, CHO)).toBeTruthy()
    expect(container.querySelector('.duo')).toBeNull()
    expect(container.querySelector('.ccs-dau')).toBeTruthy()
  })
})

describe('tienDoSua — chỗ của câu trong chặng sửa hôm nay', () => {
  const muc = (qid: string, x: boolean): ViecMuc => ({ m: { qid } as MucChua, khoa: qid, loai: 'moi', xong: x })
  const a = muc('A', true), b = muc('B', true), c = muc('C', false), d = muc('D', true), e = muc('E', false)
  const viec: ViecHomNay = { muc: [a, b, c, d, e], chang: [[a, b, c, d], [e]], xong: 3, tong: 5, changHienTai: 0, tiep: c, conNgaySau: 0 }
  it('câu cuối còn lại của chặng 1, còn câu ở chặng 2', () => {
    expect(tienDoSua(viec, 'C')).toEqual({ so: 1, xong: 3, tong: 4, cuoi: true, conSau: true, changTiep: 2, homNay: { xong: 4, tong: 5 } })
  })
  it('khớp mã gốc (bản đổi số ~n); hết câu ⇒ conSau false; câu ngoài việc hôm nay ⇒ vắng', () => {
    expect(tienDoSua({ ...viec, muc: [a, b, d, e], chang: [[a, b, d], [e]] }, 'E')).toMatchObject({ so: 2, conSau: false, changTiep: undefined })
    expect(tienDoSua(viec, 'E~2')).toMatchObject({ so: 2, xong: 0, tong: 1, cuoi: true, conSau: true, changTiep: 1 }) // C (chặng 1) còn dở ⇒ câu kế ở chặng 1
    expect(tienDoSua(viec, 'Z')).toBeUndefined()
    expect(tienDoSua(null, 'C')).toBeUndefined()
  })
})
