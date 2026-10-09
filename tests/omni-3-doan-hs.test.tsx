// OMNI 3 · ĐOÀN HỘ TỐNG PHÍA HỌC SINH (làn C2, 05/10) — hợp đồng docs/hop-dong-omni-3.md mục A: `doan-nop` thêm `msLam?`, `tuTin?` (máy chủ chuyển
// vào `answer` nội bộ); Trạm hồi phục KHÔNG mở trong Đoàn. Chip "Chưa chắc" là nút phụ cùng kiểu "Cần tiếp sức"; cờ OMNI tắt ⇒ giao diện + thân lệnh y hệt cũ.
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor, configure } from '@testing-library/react'
vi.mock('../src/game/than-thu-v2/battle-audio', () => ({ unlockBattleAudio: vi.fn(), playBattleSound: vi.fn() }))
import DoanHoTong from '../src/game/than-thu-v2/DoanHoTong'
import type { DoanXem } from '../src/game/than-thu-v2/doan-kieu'
import { CHIP_CHUA_CHAC, GOI_Y_CHIP_CHUA_CHAC, chuDungNhungCham } from '../src/lib/omni-chu'

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
const xem = (o: Partial<DoanXem> = {}): DoanXem => ({ ma: 'DH2', revision: 5, laChu: true, batDau: true, ghe, gioMayChu: 0, tran, cau: { qid: 'Q1', nhan: 'toi_han_on', de } as DoanXem['cau'], ...o })
const OMNI = { bat: true, baiDangLuyen: [], dangVung: { a: 0, b: 0 }, conDangDe8: null, sEm: null, sMucTieu: 0.07, chungChi: [], ve: { con: 2, tong: 2 }, choBaiMoi: false, onBaiCu: 0, metGio: null, nhatKy: null, deThu: { duoc: false, soCau: 14, phut: 25 } }
const LOI_NHAN = chuDungNhungCham(190_000, 95_000)

function dung(omni: boolean) {
  const x = xem()
  sessionStorage.setItem('doan:S1', x.ma)
  const call = vi.fn(async (lenh: string, _b: Record<string, unknown> = {}) => lenh === 'hoa2-sanh' ? { ok: true, cheDo2: true, doan: { con: 4 }, dao: { con: 28 }, ...(omni ? { omni: OMNI } : {}) }
    : lenh === 'doan-xem' ? { ok: true, doan: x }
      : lenh === 'doan-nop' ? { ok: true, doan: xem({ revision: 6, cau: { qid: 'Q1', daChot: true, hanhDong: 'danh', ketQua: null } }), ketQuaCau: { correct: true, answer: 'B', solution: { chot: 'Muối là CH3COONa' } }, omni: { nhanTocDo: 'cham', msLam: 190000, msKyVong: 95000, luot: false, chacMaSai: false, loiNhan: LOI_NHAN } }
        : { ok: true })
  render(<DoanHoTong call={call} sbd="S1" pet={2} cap={32} onDong={vi.fn()} onVeBangNhiemVu={vi.fn()} />)
  return { call, than: () => call.mock.calls.find(c => c[0] === 'doan-nop')?.[1] as Record<string, unknown> | undefined }
}
const man = () => document.querySelector('.dh') as HTMLElement

describe('Đoàn Hộ Tống · OMNI', () => {
  it('cờ OMNI tắt ⇒ không chip, doan-nop y hệt cũ (không msLam / tuTin), không dòng nhắn', async () => {
    const m = dung(false)
    await screen.findByText('8,2 gam')
    await waitFor(() => expect(man().className).toContain('dh2'))
    await new Promise(r => setTimeout(r, 20))
    expect(screen.queryByRole('button', { name: CHIP_CHUA_CHAC })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /8,2 gam/ }))
    fireEvent.click(screen.getByRole('button', { name: 'CHỐT ĐÁP ÁN' }))
    await waitFor(() => expect(m.than()).toEqual({ ma: 'DH2', hiep: 3, answer: 'B', hanhDong: 'danh' }))
    await screen.findByText('Em trả lời đúng.')
    expect(document.querySelector('[data-khoi="omni-loi-nhan"]')).toBeNull()
  })

  it('OMNI bật ⇒ chip "Chưa chắc" (nút phụ cùng kiểu "Cần tiếp sức"), gợi ý lần đầu trong ngày; chốt ⇒ doan-nop có msLam + tuTin; lời nhắn một dòng dưới kết quả', async () => {
    const m = dung(true)
    await screen.findByText('8,2 gam')
    const chip = await screen.findByRole('button', { name: CHIP_CHUA_CHAC })
    expect(chip.className).toBe('dh-xin')
    expect(chip.getAttribute('aria-pressed')).toBe('false')
    fireEvent.click(chip)
    expect(chip.getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByText(GOI_Y_CHIP_CHUA_CHAC)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /8,2 gam/ })) // luồng chạm-chọn cũ không đổi
    fireEvent.click(screen.getByRole('button', { name: 'CHỐT ĐÁP ÁN' }))
    await waitFor(() => expect(m.than()).toMatchObject({ ma: 'DH2', hiep: 3, answer: 'B', hanhDong: 'danh', tuTin: 'chua_chac' }))
    expect(Number.isInteger(m.than()!.msLam)).toBe(true)
    expect(m.than()!.msLam as number).toBeGreaterThanOrEqual(0)
    const dong = await waitFor(() => { const d = document.querySelector('[data-khoi="omni-loi-nhan"]'); expect(d).toBeTruthy(); return d! })
    expect(dong.textContent).toBe(LOI_NHAN)
    expect(dong.closest('.dh-ket-qua-cau')).toBeTruthy()
    expect(screen.queryByRole('button', { name: CHIP_CHUA_CHAC })).toBeNull() // đã chốt: không còn chip
  })
})
