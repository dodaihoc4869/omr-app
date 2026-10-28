// @vitest-environment jsdom
// KHOÁ SAU SỬA LỖI Ở MÀN LÀM CHẶNG (ảnh thầy 28/10 19:55: khung đỏ «Em sửa xong lỗi hôm nay rồi mới mở chặng tiếp nhé.» + «Thử lại» ⇒ em kẹt).
// Khoá: máy chủ chặn TU_SUA_TRUOC ⇒ (1) gửi ngay việc Sửa lỗi đã xong trên máy rồi mở lại MỘT lần (giờ cao điểm lượt gửi nền có thể hết giờ);
// (2) vẫn chặn ⇒ thẻ trung tính + nút về Lộ trình, KHÔNG «Thử lại»; lỗi khác vẫn khung lỗi + «Thử lại» như cũ.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import ManLamBaiTap from '../src/components/hoc-tap/ManLamBaiTap'
import { goiHoa2, LoiHoa2 } from '../src/components/hoa2/api'

vi.mock('../src/components/hoa2/api', async (goc) => ({ ...await goc<typeof import('../src/components/hoa2/api')>(), goiHoa2: vi.fn() }))
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may' }))
// Lượt gửi ngay việc Sửa lỗi trên máy: đếm lời gọi /hs/chua-cau-sai/viec-ngay; `viecOk` = máy chủ ghi được.
let viecOk = true
const fetchGia = vi.fn(async (url: string) => ({ json: async () => (String(url).endsWith('/hs/chua-cau-sai/viec-ngay') ? { ok: viecOk } : {}) }))
vi.stubGlobal('fetch', fetchGia)
const goiViec = () => fetchGia.mock.calls.filter((c) => String(c[0]).endsWith('/hs/chua-cau-sai/viec-ngay'))
const coViecTrenMay = () => localStorage.setItem('omr_tu_sua_hom_nay_s1', JSON.stringify({ n: '2026-10-28', m: [{ q: 'Q9', d: 'D9', t: 'x', l: 'gan' }], x: ['D9'] }))
afterEach(() => { cleanup(); vi.mocked(goiHoa2).mockReset(); fetchGia.mockClear(); viecOk = true; localStorage.clear() })

const CHU = 'Em sửa xong lỗi hôm nay rồi mới mở chặng tiếp nhé.'
const chan = () => new LoiHoa2(CHU, 'TU_SUA_TRUOC')
const C = { maDe: 'de-8', version: 'v1', group: 'g', hinhAnh: [], dang: null, tenDang: 'Amine', mucDo: 'hieu', sao: 0, kienThuc: [], ideas: [], qid: 'q1', phan: 'I', text: 'Câu một', choices: ['2', '8', '3', '4'] }

describe('màn làm chặng: máy chủ chặn vì chưa xong Sửa lỗi', () => {
  it('việc Sửa lỗi trên máy gửi lên được ⇒ mở lại chặng MỘT lần, câu hiện, không khung lỗi', async () => {
    vi.mocked(goiHoa2).mockRejectedValueOnce(chan()).mockResolvedValueOnce({ ok: true, id: 'p1', questions: [C] })
    coViecTrenMay()
    render(<ManLamBaiTap token="tk" sbd="s1" onVe={vi.fn()} onCapNhat={vi.fn()} onChua={vi.fn()} />)
    await screen.findByText('Câu một')
    expect(goiViec()).toHaveLength(1)
    expect(JSON.parse(String((goiViec()[0]![1] as RequestInit).body))).toMatchObject({ token: 'tk', ngay: '2026-10-28', x: ['D9'] })
    expect(vi.mocked(goiHoa2).mock.calls.filter((c) => c[0] === 'hoc-tap-start')).toHaveLength(2)
    expect(screen.queryByText(CHU)).toBeNull()
  })
  it('vẫn chặn sau khi gửi ⇒ thẻ trung tính + «Về …» (làm mới rồi về), không «Thử lại»; chỉ thử lại một lần', async () => {
    vi.mocked(goiHoa2).mockRejectedValue(chan())
    coViecTrenMay()
    const onVe = vi.fn(), onCapNhat = vi.fn()
    render(<ManLamBaiTap token="tk" sbd="s1" onVe={onVe} onCapNhat={onCapNhat} onChua={vi.fn()} />)
    const the = await screen.findByText(CHU)
    expect(the.closest('[role="status"]')).toBeTruthy()
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.queryByRole('button', { name: /Thử lại/ })).toBeNull()
    await waitFor(() => expect(vi.mocked(goiHoa2).mock.calls.filter((c) => c[0] === 'hoc-tap-start')).toHaveLength(2))
    fireEvent.click(screen.getByRole('button', { name: /^Về / }))
    expect(onCapNhat).toHaveBeenCalled()
    expect(onVe).toHaveBeenCalled()
  })
  it('không có gì trên máy để gửi / máy chủ không ghi ⇒ không mở lại, thẻ trung tính ngay', async () => {
    vi.mocked(goiHoa2).mockRejectedValue(chan())
    render(<ManLamBaiTap token="tk" sbd="s1" onVe={vi.fn()} onCapNhat={vi.fn()} onChua={vi.fn()} />)
    await screen.findByText(CHU)
    expect(goiViec()).toHaveLength(0)
    cleanup(); coViecTrenMay(); viecOk = false
    render(<ManLamBaiTap token="tk" sbd="s1" onVe={vi.fn()} onCapNhat={vi.fn()} onChua={vi.fn()} />)
    await screen.findByText(CHU)
    expect(goiViec()).toHaveLength(1)
    expect(vi.mocked(goiHoa2).mock.calls.filter((c) => c[0] === 'hoc-tap-start')).toHaveLength(2) // một lượt mỗi lần mở màn, không mở lại
  })
  it('lỗi khác (mạng) vẫn khung lỗi + «Thử lại» như cũ', async () => {
    vi.mocked(goiHoa2).mockRejectedValue(new LoiHoa2('Máy chủ phản hồi chậm hoặc mạng gián đoạn. Em thử lại nhé.', 'het_gio'))
    render(<ManLamBaiTap token="tk" sbd="s1" onVe={vi.fn()} onCapNhat={vi.fn()} onChua={vi.fn()} />)
    await screen.findByRole('alert')
    expect(screen.getByRole('button', { name: /Thử lại/ })).toBeTruthy()
    expect(goiViec()).toHaveLength(0)
  })
})
