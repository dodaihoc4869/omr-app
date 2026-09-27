// GAME HÓA 2.0 · Đoàn Hộ Tống — Bùa Trợ giảng gạch 2 phương án sai: ô "cháy thành tro" KHÔNG bấm được, nút chốt không nhận nó; phương án còn lại chốt bình thường.
// Máy chủ giả bằng `call`: `hoa2-sanh` báo cheDo2, `doan-xem` trả câu ôn có `goiY.gach`.
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor, configure } from '@testing-library/react'
vi.mock('../src/game/than-thu-v2/battle-audio', () => ({ unlockBattleAudio: vi.fn(), playBattleSound: vi.fn() }))
import DoanHoTong from '../src/game/than-thu-v2/DoanHoTong'
import type { DoanXem } from '../src/game/than-thu-v2/doan-kieu'

configure({ asyncUtilTimeout: 8000 })
beforeEach(() => { sessionStorage.clear(); localStorage.clear() })
afterEach(() => { cleanup() })

const ghe: DoanXem['ghe'] = [
  { ghe: 0, ten: 'Minh', pet: 2, cap: 32, laMay: false, roi: false, laEm: true, trangThai: 'dang_lam', tinHieu: null },
  { ghe: 1, ten: 'Thu Hà', pet: 1, cap: 30, laMay: false, roi: false, laEm: false, trangThai: 'da_chot', tinHieu: null },
]
const tran = { tenChang: 'Đèo Hoàng Hôn', hiep: 3, soHiep: 8, laTrum: false, ketThuc: false, thang: null, linhTam: { hp: 80, toiDa: 100 }, quai: [{ ma: 5, loai: 'bun_acid', hp: 9 }], trumVoGiap: [],
  nangLuong: 2, daNhanTiepSuc: 0, giay: 40, moSauMs: 0, conMs: 26000, tenQuai: ['Bùn Acid', 'Khói Oxi Hoá'], loaiQuai: ['bun_acid', 'khoi_oxi_hoa'], tenTrum: ['Chúa tể Kết Tủa', 'Bá chủ Ăn Mòn'], loaiTrum: ['chua_te_ket_tua', 'ba_chu_an_mon'] } as DoanXem['tran']
const de = { qid: 'Q1', maDe: 'D', version: 'v', group: 'g', phan: 'I' as const, text: 'Thuỷ phân hoàn toàn 8,8 gam ethyl acetate bằng NaOH dư. Khối lượng muối là', choices: ['4,1 gam', '8,2 gam', '9,6 gam', '6,8 gam'], ideas: [], hinhAnh: [], dang: 'ES', tenDang: 'Thuỷ phân ester', mucDo: 'hieu', sao: 2, kienThuc: [] }
const xem = (o: Partial<DoanXem> = {}): DoanXem => ({ ma: 'DH2', revision: 5, laChu: true, batDau: true, ghe, gioMayChu: 0, tran, cau: { qid: 'Q1', nhan: 'toi_han_on', de, goiY: { gach: ['A', 'D'] } } as DoanXem['cau'], ...o })

function dung(x: DoanXem) {
  sessionStorage.setItem('doan:S1', x.ma)
  const call = vi.fn(async (lenh: string, _b: Record<string, unknown> = {}) => lenh === 'hoa2-sanh' ? { ok: true, cheDo2: true, doan: { con: 4 }, dao: { con: 28 } }
    : lenh === 'doan-xem' ? { ok: true, doan: x }
      : lenh === 'doan-nop' ? { ok: true, doan: xem({ revision: 6, cau: { qid: 'Q1', daChot: true, hanhDong: 'danh', ketQua: null } }), ketQuaCau: { correct: true, answer: 'B', solution: { chot: 'Muối là CH3COONa' } } }
        : { ok: true })
  render(<DoanHoTong call={call} sbd="S1" pet={2} cap={32} onDong={vi.fn()} onVeBangNhiemVu={vi.fn()} />)
  return call
}
const man = () => document.querySelector('.dh') as HTMLElement

describe('Đoàn 2.0 · phương án bị Bùa Trợ giảng gạch', () => {
  it('A và D cháy thành tro: disabled, có lớp dh2-chay, tên đọc được nói rõ "không chọn được"; B, C vẫn bấm được', async () => {
    dung(xem())
    await screen.findByText('8,2 gam')
    await waitFor(() => expect(man().className).toContain('dh2'))
    const a = screen.getByRole('button', { name: /4,1 gam/ }) as HTMLButtonElement, d = screen.getByRole('button', { name: /6,8 gam/ }) as HTMLButtonElement
    for (const nut of [a, d]) { expect(nut.disabled).toBe(true); expect(nut.className).toContain('dh2-chay'); expect(nut.textContent).toMatch(/đã cháy thành tro — phương án sai, không chọn được/) }
    for (const chu of ['8,2 gam', '9,6 gam']) { const nut = screen.getByRole('button', { name: new RegExp(chu) }) as HTMLButtonElement; expect(nut.disabled).toBe(false); expect(nut.className).not.toContain('dh2-chay') }
  })

  it('bấm ô cháy không chọn được: nút chính vẫn "CHỌN ĐÁP ÁN ĐỂ CHỐT ĐÒN" và khoá; chọn B thì "CHỐT ĐÒN ĐÁNH · B" gửi đúng gói doan-nop', async () => {
    const call = dung(xem())
    await screen.findByText('8,2 gam')
    await waitFor(() => expect(man().className).toContain('dh2'))
    const a = screen.getByRole('button', { name: /4,1 gam/ })
    fireEvent.click(a)
    expect(a.getAttribute('aria-pressed')).toBe('false')
    const chot = screen.getByRole('button', { name: 'CHỌN ĐÁP ÁN ĐỂ CHỐT ĐÒN' }) as HTMLButtonElement
    expect(chot.disabled).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: /8,2 gam/ }))
    fireEvent.click(screen.getByRole('button', { name: 'CHỐT ĐÒN ĐÁNH · B' }))
    await waitFor(() => expect(call).toHaveBeenCalledWith('doan-nop', { ma: 'DH2', hiep: 3, answer: 'B', hanhDong: 'danh' }))
    expect(call.mock.calls.some(c => c[0] === 'doan-nop' && (c[1] as { answer?: string }).answer === 'A')).toBe(false)
  })

  it('đáp án không có trên màn trước khi chốt: không ô nào mang dấu đúng/sai, không có khối LỜI GIẢI', async () => {
    dung(xem())
    await screen.findByText('8,2 gam')
    await waitFor(() => expect(man().className).toContain('dh2'))
    expect(document.querySelector('[data-kq]')).toBeNull()
    expect(man().textContent).not.toContain('LỜI GIẢI')
  })
})
