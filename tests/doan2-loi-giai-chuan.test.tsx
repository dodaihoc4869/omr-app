// GAME HÓA 2.0 · Đoàn Hộ Tống — sau khi chốt, lời giải dùng KHỐI CHUẨN của app: `TheCau` chế độ xem_lai (✓ đúng, ✗ em chọn sai)
// + `chuanHoaLoiGiaiCau` (LỜI GIẢI → Kiến thức cốt lõi → từng phương án). Trước khi chốt không có đáp án/lời giải nào trên màn.
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor, configure } from '@testing-library/react'
vi.mock('../src/game/than-thu-v2/battle-audio', () => ({ unlockBattleAudio: vi.fn(), playBattleSound: vi.fn() }))
import DoanHoTong from '../src/game/than-thu-v2/DoanHoTong'
import { loiGiaiChoTheCau } from '../src/game/than-thu-v2/doan2/XemLaiChuan'
import { CHUA_CO_LOI_GIAI } from '../src/lib/chuan-hoa-loi-giai'
import type { DoanXem } from '../src/game/than-thu-v2/doan-kieu'

configure({ asyncUtilTimeout: 8000 })
beforeEach(() => { sessionStorage.clear(); localStorage.clear() })
afterEach(() => { cleanup() })

const ghe: DoanXem['ghe'] = [{ ghe: 0, ten: 'Minh', pet: 2, cap: 32, laMay: false, roi: false, laEm: true, trangThai: 'dang_lam', tinHieu: null }]
const tran = { tenChang: 'Đèo', hiep: 2, soHiep: 8, laTrum: false, ketThuc: false, thang: null, linhTam: { hp: 90, toiDa: 100 }, quai: [{ ma: 1, loai: 'bun_acid', hp: 24 }], trumVoGiap: [],
  nangLuong: 0, daNhanTiepSuc: 0, giay: 40, moSauMs: 0, conMs: 30000, tenQuai: ['Bùn Acid', 'Khói'], loaiQuai: ['bun_acid', 'bun_acid'], tenTrum: ['x', 'y'], loaiTrum: ['chua_te_ket_tua', 'ba_chu_an_mon'] } as DoanXem['tran']
const de = { qid: 'Q7', maDe: 'D', version: 'v', group: 'g', phan: 'I' as const, text: 'Muối thu được khi thuỷ phân ethyl acetate trong NaOH là', choices: ['C2H5ONa', 'HCOONa', 'CH3COONa', 'CH3ONa'], ideas: [], hinhAnh: [], dang: 'ES', tenDang: 'Thuỷ phân ester', mucDo: 'hieu', sao: 2, kienThuc: [] }
const loiGiai = { chot: 'Ester RCOOR\' + NaOH → RCOONa + R\'OH', tung_pa: { A: { dung: false, vi_sao: 'Đây là ancolat' }, B: { dung: false, vi_sao: 'Sai gốc axit' }, C: { dung: true, vi_sao: 'Gốc acetate' }, D: { dung: false, vi_sao: 'Không phải muối carboxylate' } } }
const xem = (o: Partial<DoanXem> = {}): DoanXem => ({ ma: 'DH7', revision: 5, laChu: true, batDau: true, ghe, gioMayChu: 0, tran, cau: { qid: 'Q7', nhan: 'toi_han_on', de }, ...o })

function dung(solution: unknown) {
  const x = xem()
  sessionStorage.setItem('doan:S1', x.ma)
  const call = vi.fn(async (lenh: string) => lenh === 'hoa2-sanh' ? { ok: true, cheDo2: true, doan: { con: 3 }, dao: { con: 10 } }
    : lenh === 'doan-xem' ? { ok: true, doan: x }
      : lenh === 'doan-nop' ? { ok: true, doan: xem({ revision: 6, cau: { qid: 'Q7', daChot: true, hanhDong: 'danh', ketQua: null } }), ketQuaCau: { correct: false, answer: 'C', solution } }
        : { ok: true })
  render(<DoanHoTong call={call} sbd="S1" pet={2} cap={32} onDong={vi.fn()} onVeBangNhiemVu={vi.fn()} />)
  return call
}
const man = () => document.querySelector('.dh') as HTMLElement

describe('Đoàn 2.0 · lời giải sau khi chốt dùng khối chuẩn TheCau xem_lai', () => {
  it('chưa chốt: không LỜI GIẢI, không dấu đúng/sai; chốt B (sai) ⇒ thẻ xem lại chuẩn: C ✓ đúng, B ✗ em chọn, LỜI GIẢI → Kiến thức cốt lõi → từng phương án', async () => {
    dung(loiGiai)
    await screen.findByText('HCOONa'); await waitFor(() => expect(man().className).toContain('dh2'))
    expect(man().textContent).not.toContain('LỜI GIẢI'); expect(document.querySelector('[data-trang-thai="dung"]')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /HCOONa/ }))
    fireEvent.click(screen.getByRole('button', { name: 'CHỐT ĐÁP ÁN' }))
    const khoi = await waitFor(() => { const k = document.querySelector('[data-vung="loi-giai-chuan"]'); expect(k).toBeTruthy(); return k as HTMLElement })
    expect(screen.getByText('Chưa đúng — em xem lời giải để sửa câu này.')).toBeTruthy()
    expect(khoi.textContent).toContain('LỜI GIẢI'); expect(khoi.textContent).toContain('Kiến thức cốt lõi'); expect(khoi.textContent).toContain('RCOONa')
    expect(khoi.textContent).toContain('Gốc acetate'); expect(khoi.textContent).toContain('Sai gốc axit')
    const dung_ = khoi.querySelector('[data-trang-thai="dung"]') as HTMLElement, sai = khoi.querySelector('[data-trang-thai="sai"]') as HTMLElement
    expect(dung_.textContent).toBe('C.CH3COONa') // ô ✓ là phương án C (đáp án máy chủ trả SAU khi chốt)
    expect(sai.textContent).toMatch(/^B\.HCOONa/)
    expect(khoi.querySelectorAll('.lg-y')).toHaveLength(4) // đủ bốn phương án ✓/✗
  })

  it('kho chưa có lời giải: nói thẳng câu chung CHUA_CO_LOI_GIAI, không dựng chữ thay', async () => {
    dung(null)
    await screen.findByText('HCOONa'); await waitFor(() => expect(man().className).toContain('dh2'))
    fireEvent.click(screen.getByRole('button', { name: /HCOONa/ }))
    fireEvent.click(screen.getByRole('button', { name: 'CHỐT ĐÁP ÁN' }))
    const khoi = await waitFor(() => { const k = document.querySelector('[data-vung="loi-giai-chuan"]'); expect(k).toBeTruthy(); return k as HTMLElement })
    expect(khoi.textContent).toContain(CHUA_CO_LOI_GIAI)
  })

  it('bộ chuyển lời giải: Phần I ra tungPa theo A–D, Phần II ra tungY theo a–d, Phần III giữ các bước + kết quả', () => {
    expect(loiGiaiChoTheCau(loiGiai, 'I', 'C').loiGiai!.tungPa!.C).toEqual({ dung: true, viSao: 'Gốc acetate' })
    const ii = loiGiaiChoTheCau({ chot: 'k', tung_y: { a: { dung: true, vi_sao: 'ya' }, b: { dung: false, vi_sao: 'yb' } } }, 'II', 'DS--')
    expect(ii.loiGiai!.tungY!.a!.viSao).toBe('ya'); expect(ii.loiGiai!.tungPa).toBeUndefined()
    const iii = loiGiaiChoTheCau({ chot: 'k', buoc: ['n = 0,1', 'm = 8,2'] }, 'III', '8,2')
    expect(iii.loiGiai!.buoc).toEqual(['n = 0,1', 'm = 8,2']); expect(iii.loiGiai!.ketQua).toBe('8,2')
    expect(loiGiaiChoTheCau(undefined, 'I', 'A')).toEqual({ explanation: CHUA_CO_LOI_GIAI })
  })
})
