// GAME HÓA 2.0 · Đoàn Hộ Tống — thầy 28/09: "làm được 1 câu rồi máy tự đánh", "thời gian xem đáp án quá ngắn".
// Phòng MỘT người thật: chốt xong ⇒ lời giải chuẩn đứng yên, KHÔNG đồng hồ, tới khi em bấm "ĐÁNH TIẾP" (lệnh `doan-tiep`).
// Phòng ≥ 2 người thật: giữ nhịp cũ nhưng có nút "Xem lại câu vừa rồi". Cờ tắt: y hệt bản cũ.
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor, configure, act } from '@testing-library/react'
vi.mock('../src/game/than-thu-v2/battle-audio', () => ({ unlockBattleAudio: vi.fn(), playBattleSound: vi.fn() }))
import DoanHoTong from '../src/game/than-thu-v2/DoanHoTong'
import type { DoanXem } from '../src/game/than-thu-v2/doan-kieu'
import { moChang, giaiHiep, khungNhinHiep } from '../src/game/than-thu-v2/doan-core'

/** Kết quả hiệp vừa giải đúng khuôn máy chủ gửi (em đánh sai ⇒ không sát thương). */
const vuaXong = (hiep: number) => ({ ...khungNhinHiep(giaiHiep(moChang({ hatGiong: 'DH7', nguoi: [{ id: 'S1', ten: 'Minh', pet: 2 }] }), { nop: [{ ghe: 0, dung: false, hanhDong: 'danh' }] }).lichSu.at(-1)!, 0), hiep })
/** Màn tung chưởng (≤ 3 s) có nút Bỏ qua — bấm để vào ngay quãng nghỉ. */
const boQuaChuong = async () => fireEvent.click(await screen.findByRole('button', { name: 'Bỏ qua' }))

configure({ asyncUtilTimeout: 8000 })
beforeEach(() => { sessionStorage.clear(); localStorage.clear() })
afterEach(() => { vi.useRealTimers(); cleanup() })

const em: DoanXem['ghe'][number] = { ghe: 0, ten: 'Minh', pet: 2, cap: 32, laMay: false, roi: false, laEm: true, trangThai: 'dang_lam', tinHieu: null }
const may: DoanXem['ghe'][number] = { ghe: 1, ten: 'Bạn đồng hành', pet: 1, cap: 10, laMay: true, roi: false, laEm: false, trangThai: 'may', tinHieu: null }
const ban: DoanXem['ghe'][number] = { ghe: 1, ten: 'Lan', pet: 1, cap: 10, laMay: false, roi: false, laEm: false, trangThai: 'dang_lam', tinHieu: null }
const tran = (o: Partial<NonNullable<DoanXem['tran']>> = {}) => ({ tenChang: 'Đèo', hiep: 2, soHiep: 8, laTrum: false, ketThuc: false, thang: null, linhTam: { hp: 90, toiDa: 100 }, quai: [{ ma: 1, loai: 'bun_acid', hp: 24 }], trumVoGiap: [],
  nangLuong: 0, daNhanTiepSuc: 0, giay: 40, moSauMs: 0, conMs: 30000, tenQuai: ['Bùn Acid', 'Khói'], loaiQuai: ['bun_acid', 'bun_acid'], tenTrum: ['x', 'y'], loaiTrum: ['chua_te_ket_tua', 'ba_chu_an_mon'], ...o }) as DoanXem['tran']
const deQ = (qid: string, text: string) => ({ qid, maDe: 'D', version: 'v', group: 'g', phan: 'I' as const, text, choices: ['C2H5ONa', 'HCOONa', 'CH3COONa', 'CH3ONa'], ideas: [], hinhAnh: [], dang: 'ES', tenDang: 'Thuỷ phân ester', mucDo: 'biet', sao: 1, kienThuc: [] })
const de7 = deQ('Q7', 'Muối thu được khi thuỷ phân ethyl acetate trong NaOH là')
const de8 = deQ('Q8', 'Câu hiệp ba')
const loiGiai = { chot: 'Ester RCOOR\' + NaOH → RCOONa + R\'OH', tung_pa: { A: { dung: false, vi_sao: 'Đây là ancolat' }, B: { dung: false, vi_sao: 'Sai gốc axit' }, C: { dung: true, vi_sao: 'Gốc acetate' }, D: { dung: false, vi_sao: 'Không phải muối' } } }
const xem = (o: Partial<DoanXem> = {}): DoanXem => ({ ma: 'DH7', revision: 5, laChu: true, batDau: true, ghe: [em, may], gioMayChu: 0, tran: tran(), cau: { qid: 'Q7', nhan: 'toi_han_on', de: de7 }, ...o } as DoanXem)
const man = () => document.querySelector('.dh') as HTMLElement

/** `sauNop` = gói máy chủ trả cho `doan-nop` và mọi `doan-xem` sau đó (tới khi `doan-tiep`). */
function dung({ hoa2 = true, truoc = xem(), sauNop, sauTiep }: { hoa2?: boolean; truoc?: DoanXem; sauNop: DoanXem; sauTiep?: DoanXem }) {
  let hienTai = truoc
  sessionStorage.setItem('doan:S1', truoc.ma)
  const call = vi.fn(async (lenh: string) => {
    if (lenh === 'hoa2-sanh') return hoa2 ? { ok: true, cheDo2: true, doan: { con: 3 }, dao: { con: 10 } } : { ok: true, cheDo2: false }
    if (lenh === 'doan-xem') return { ok: true, doan: hienTai }
    if (lenh === 'doan-nop') { hienTai = sauNop; return { ok: true, doan: sauNop, ketQuaCau: { correct: false, answer: 'C', solution: loiGiai } } }
    if (lenh === 'doan-tiep') { if (sauTiep) hienTai = sauTiep; return { ok: true, doan: hienTai } }
    return { ok: true }
  })
  render(<DoanHoTong call={call} sbd="S1" pet={2} cap={32} onDong={vi.fn()} onVeBangNhiemVu={vi.fn()} />)
  return call
}
async function chotB() {
  await screen.findByText('HCOONa')
  fireEvent.click(screen.getByRole('button', { name: /HCOONa/ }))
  fireEvent.click(await screen.findByRole('button', { name: /^CHỐT ĐÒN ĐÁNH · B|^Chốt đòn · B/ }))
}
const cho = xem({ revision: 6, tran: tran({ hiep: 3, moSauMs: 15 * 60_000, conMs: 40000, choTiep: true }), cau: undefined, hiepVuaXong: vuaXong(2) })
const hiep3 = xem({ hiepVuaXong: vuaXong(2), revision: 7, tran: tran({ hiep: 3, moSauMs: 0, conMs: 40000 }), cau: { qid: 'Q8', nhan: 'toi_han_on', de: de8 } })

describe('Đoàn 2.0 · phòng một người thật: lời giải đứng yên tới khi bấm ĐÁNH TIẾP', () => {
  it('chốt xong: lời giải chuẩn + nút ĐÁNH TIẾP (≥ 44 px), không đồng hồ; 10 phút trôi qua màn vẫn đứng yên và chưa gọi `doan-tiep`', async () => {
    const call = dung({ sauNop: cho, sauTiep: hiep3 })
    await waitFor(() => expect(man().className).toContain('dh2'))
    await chotB(); await boQuaChuong()
    const nut = await screen.findByRole('button', { name: 'ĐÁNH TIẾP' })
    expect(Number.parseInt(nut.style.minHeight)).toBeGreaterThanOrEqual(44)
    const khoi = document.querySelector('[data-vung="loi-giai-chuan"]') as HTMLElement
    expect(khoi.textContent).toContain('LỜI GIẢI'); expect(khoi.textContent).toContain('Kiến thức cốt lõi'); expect(khoi.textContent).toContain('Gốc acetate')
    expect(man().textContent).not.toMatch(/mở sau \d+ giây/)
    expect(document.querySelector('[role="timer"]')?.getAttribute('aria-label')).toBe('Chưa tính giờ')
    vi.useFakeTimers()
    await act(async () => { await vi.advanceTimersByTimeAsync(10 * 60_000) })
    expect(screen.getByRole('button', { name: 'ĐÁNH TIẾP' })).toBeTruthy()
    expect(document.querySelector('[data-vung="loi-giai-chuan"]')).toBeTruthy()
    expect(call.mock.calls.some(c => c[0] === 'doan-tiep')).toBe(false)
    vi.useRealTimers()
    fireEvent.click(screen.getByRole('button', { name: 'ĐÁNH TIẾP' }))
    expect(call.mock.calls.filter(c => c[0] === 'doan-tiep')).toEqual([['doan-tiep', { ma: 'DH7' }]])
    await screen.findByText('Câu hiệp ba')
    expect(screen.queryByRole('button', { name: 'ĐÁNH TIẾP' })).toBeNull()
  })

  it('câu cuối làm chặng kết thúc: giữ lời giải, bấm XEM KẾT QUẢ CHUYẾN mới sang màn kết chặng', async () => {
    const ketChang = { thang: false, sao: 0, linhTam: { hp: 0, toiDa: 100 }, trumVoGiap: [false, false], quaiHaGuc: 1, soLienKich: 0, cuaEm: { ghe: 0, soCau: 2, soDung: 1, soTuLamDung: 1, satThuong: 24, soLanGiup: 0, soLanGiupThanhCong: 0, soLanDuocGiup: 0 }, tienBo: { soCau: 2, tuLamDung: 1, lenBac: 0, giup: 0, giupThanhCong: 0, duocGiup: 0 }, ban: [] }
    const het = xem({ revision: 6, tran: tran({ hiep: 2, ketThuc: true, thang: false, moSauMs: 0, conMs: 0 }), cau: undefined, ketChang, hiepVuaXong: vuaXong(2) } as unknown as Partial<DoanXem>)
    const call = dung({ sauNop: het })
    await waitFor(() => expect(man().className).toContain('dh2'))
    await chotB(); await boQuaChuong()
    const nut = await screen.findByRole('button', { name: 'XEM KẾT QUẢ CHUYẾN' })
    expect(document.querySelector('[data-vung="loi-giai-chuan"]')).toBeTruthy()
    fireEvent.click(nut)
    await waitFor(() => expect(man().dataset.man).toBe('ket-chang'))
    expect(call.mock.calls.some(c => c[0] === 'doan-tiep')).toBe(false)
  })
})

describe('Đoàn 2.0 · phòng hai người thật: giữ nhịp cũ, xem lại được câu vừa rồi', () => {
  it('không có ĐÁNH TIẾP; hiệp mới mở thì có nút "Xem lại câu vừa rồi" hiện lời giải câu cũ, đồng hồ hiệp vẫn chạy', async () => {
    const hai = [em, ban]
    const call = dung({ truoc: xem({ ghe: hai }), sauNop: xem({ ghe: hai, revision: 6, cau: { qid: 'Q7', nhan: 'toi_han_on', daChot: true, hanhDong: 'danh', ketQua: null } }) })
    await waitFor(() => expect(man().className).toContain('dh2'))
    await chotB()
    await waitFor(() => expect(document.querySelector('[data-vung="loi-giai-chuan"]')).toBeTruthy())
    expect(screen.queryByRole('button', { name: 'ĐÁNH TIẾP' })).toBeNull()
    // bạn chốt xong ⇒ máy chủ sang hiệp 3 theo nhịp cũ (lần hỏi kế)
    call.mockImplementation(async (lenh: string) => lenh === 'hoa2-sanh' ? { ok: true, cheDo2: true, doan: { con: 3 }, dao: { con: 10 } } : { ok: true, doan: xem({ ghe: hai, revision: 7, tran: tran({ hiep: 3 }), cau: { qid: 'Q8', nhan: 'toi_han_on', de: de8 } }) })
    await screen.findByText('Câu hiệp ba')
    const xl = screen.getByRole('button', { name: 'Xem lại câu vừa rồi' })
    expect(Number.parseInt(xl.style.minHeight)).toBeGreaterThanOrEqual(44)
    fireEvent.click(xl)
    expect(screen.getByText('đồng hồ hiệp này vẫn chạy')).toBeTruthy()
    expect((document.querySelector('[data-vung="loi-giai-chuan"]') as HTMLElement).textContent).toContain('Gốc acetate')
    fireEvent.click(screen.getByRole('button', { name: 'Quay lại câu hiệp này' }))
    expect(screen.getByText('Câu hiệp ba')).toBeTruthy()
    expect(call.mock.calls.some(c => c[0] === 'doan-tiep')).toBe(false)
  })
})

describe('Cờ Hóa 2.0 tắt: y hệt bản cũ', () => {
  it('không có nút ĐÁNH TIẾP, quãng nghỉ vẫn đếm "mở sau … giây"', async () => {
    const nghi = xem({ revision: 6, tran: tran({ hiep: 3, moSauMs: 6000, conMs: 40000 }), cau: undefined })
    dung({ hoa2: false, sauNop: nghi })
    await screen.findByText('HCOONa')
    await chotB()
    await screen.findByText(/mở sau \d+ giây/)
    expect(screen.queryByRole('button', { name: 'ĐÁNH TIẾP' })).toBeNull()
  })
})
