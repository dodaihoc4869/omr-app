// GAME HÓA 2.0 · Đoàn Hộ Tống — dải "Bùa Trợ giảng" trên thẻ "CÂU ÔN CỦA EM": hiện khi máy chủ gửi `goiY` (gạch / Kiến thức cốt lõi),
// đứng TRƯỚC đề; không có gợi ý thì không có dải. Trong trận: HUD "HIỆP k/8" + vạch 8 hiệp (2 kim cương trùm) + đồng hồ vòng + "Ổ phục kích còn N".
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, cleanup, waitFor, configure } from '@testing-library/react'
vi.mock('../src/game/than-thu-v2/battle-audio', () => ({ unlockBattleAudio: vi.fn(), playBattleSound: vi.fn() }))
import DoanHoTong from '../src/game/than-thu-v2/DoanHoTong'
import type { DoanXem } from '../src/game/than-thu-v2/doan-kieu'

configure({ asyncUtilTimeout: 8000 })
beforeEach(() => { sessionStorage.clear(); localStorage.clear() })
afterEach(() => { cleanup() })

const ghe: DoanXem['ghe'] = [
  { ghe: 0, ten: 'Minh', pet: 2, cap: 32, laMay: false, roi: false, laEm: true, trangThai: 'dang_lam', tinHieu: null },
  { ghe: 1, ten: 'Thu Hà', pet: 1, cap: 30, laMay: false, roi: false, laEm: false, trangThai: 'da_chot', tinHieu: null },
  { ghe: 2, ten: 'Nam', pet: 3, cap: 12, laMay: false, roi: false, laEm: false, trangThai: 'dang_lam', tinHieu: null },
]
const tran = { tenChang: 'Đèo Hoàng Hôn', hiep: 3, soHiep: 8, laTrum: false, ketThuc: false, thang: null, linhTam: { hp: 80, toiDa: 100 }, quai: [{ ma: 5, loai: 'bun_acid', hp: 9 }, { ma: 6, loai: 'bun_acid', hp: 24 }], trumVoGiap: [],
  nangLuong: 1, daNhanTiepSuc: 0, giay: 40, moSauMs: 0, conMs: 26000, tenQuai: ['Bùn Acid', 'Khói Oxi Hoá'], loaiQuai: ['bun_acid', 'khoi_oxi_hoa'], tenTrum: ['Chúa tể Kết Tủa', 'Bá chủ Ăn Mòn'], loaiTrum: ['chua_te_ket_tua', 'ba_chu_an_mon'] } as DoanXem['tran']
const deI = { qid: 'Q1', maDe: 'D', version: 'v', group: 'g', phan: 'I' as const, text: 'Đề câu ôn phần một', choices: ['một', 'hai', 'ba', 'bốn'], ideas: [], hinhAnh: [], dang: 'ES', tenDang: 'Thuỷ phân ester', mucDo: 'hieu', sao: 2, kienThuc: [] }
const deII = { ...deI, qid: 'Q2', phan: 'II' as const, text: 'Đề câu ôn đúng sai', choices: [], ideas: ['ý thứ nhất', 'ý thứ hai', 'ý thứ ba', 'ý thứ tư'] }
const xem = (cau: Record<string, unknown>): DoanXem => ({ ma: 'DH3', revision: 5, laChu: true, batDau: true, ghe, gioMayChu: 0, tran, cau: cau as DoanXem['cau'] })

function dung(x: DoanXem) {
  sessionStorage.setItem('doan:S1', x.ma)
  const call = vi.fn(async (lenh: string) => lenh === 'hoa2-sanh' ? { ok: true, cheDo2: true, doan: { con: 4 }, dao: { con: 28 } } : lenh === 'doan-xem' ? { ok: true, doan: x } : { ok: true })
  render(<DoanHoTong call={call} sbd="S1" pet={2} cap={32} onDong={vi.fn()} onVeBangNhiemVu={vi.fn()} />)
  return call
}
const man = () => document.querySelector('.dh') as HTMLElement
const cho2 = async () => { await waitFor(() => expect(man().className).toContain('dh2')) }

describe('Đoàn 2.0 · dải Bùa Trợ giảng', () => {
  it('gợi ý gạch: dải nói "2 phương án sai đã cháy thành tro", nói thật câu có bùa chưa tính Thành thạo, và đứng TRƯỚC đề', async () => {
    dung(xem({ qid: 'Q1', nhan: 'toi_han_on', de: deI, goiY: { gach: ['A', 'D'] } }))
    await screen.findByText('Đề câu ôn phần một'); await cho2()
    const bua = document.querySelector('[data-vung="bua-tro-giang"]') as HTMLElement
    expect(bua).toBeTruthy()
    expect(bua.textContent).toContain('Bùa Trợ giảng:')
    expect(bua.textContent).toContain('2 phương án sai đã cháy thành tro')
    expect(bua.textContent).toContain('chưa tính Thành thạo')
    expect(bua.textContent).not.toMatch(/đã sai \d+ lần/) // máy chủ không gửi số lần sai ⇒ không bịa
    const deBai = screen.getByText('Đề câu ôn phần một')
    expect(bua.compareDocumentPosition(deBai) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.getByText('CÂU ÔN CỦA EM')).toBeTruthy()
    expect(screen.getByText(/Thuỷ phân ester · đến lịch ôn lại/)).toBeTruthy()
  })

  it('gợi ý Kiến thức cốt lõi (câu Đúng–sai): dải hiện đúng chữ cốt lõi, không ô nào bị gạch', async () => {
    dung(xem({ qid: 'Q2', nhan: 'toi_han_on', de: deII, goiY: { cotLoi: 'Ester thuỷ phân trong kiềm tạo muối và ancol' } }))
    await screen.findByText('Đề câu ôn đúng sai'); await cho2()
    const bua = document.querySelector('[data-vung="bua-tro-giang"]') as HTMLElement
    expect(bua.textContent).toContain('Kiến thức cốt lõi')
    expect(bua.textContent).toContain('Ester thuỷ phân trong kiềm tạo muối và ancol')
    expect(document.querySelector('.dh2-chay')).toBeNull()
  })

  it('không có gợi ý: KHÔNG có dải bùa; HUD mới vẫn đủ — HIỆP 3/8, 8 vạch (2 kim cương trùm), đồng hồ, Ổ phục kích còn 4, đồng đội chỉ có trạng thái', async () => {
    dung(xem({ qid: 'Q1', nhan: 'toi_han_on', de: deI }))
    await screen.findByText('Đề câu ôn phần một'); await cho2()
    expect(document.querySelector('[data-vung="bua-tro-giang"]')).toBeNull()
    expect(screen.getByText('HIỆP 3/8')).toBeTruthy()
    expect(document.querySelectorAll('.dh2-vach i')).toHaveLength(8)
    expect(document.querySelectorAll('.dh2-vach i.dh2-kc')).toHaveLength(2)
    expect(screen.getByRole('timer').textContent).toBe('26')
    expect(document.querySelector('[data-vung="o-phuc-kich"]')!.textContent).toBe('Ổ phục kích còn 4')
    expect(screen.getByText('Máu Linh Tâm 80/100')).toBeTruthy()
    const doi = screen.getByLabelText('Đồng đội')
    expect(doi.textContent).toBe('Thu Hàđã chốtNamđang làm')
    expect(man().textContent).not.toMatch(/\bsai\b/i)
  })
})
