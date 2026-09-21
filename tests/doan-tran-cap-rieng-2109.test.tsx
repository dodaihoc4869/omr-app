// ĐOÀN HỘ TỐNG · TRẦN TÁCH RIÊNG (thầy lệnh 19:30: "riêng trần hộ tống đoàn là 60 câu, tính riêng hẳn"; Đảo 36): hết-lượt + con số của SẢNH ĐOÀN lấy từ `doan-sanh` (`tranNgay`, `dailyUsed`), KHÔNG từ
// `recommendations` (đó là số của ĐẢO); `doan-sanh.changHomNay` ⇒ "Đã đi N/6 chặng hôm nay"; `doan-mo` báo `hetCauMoi` ⇒ máy nói thật lúc chuẩn bị hiệp 1. Máy chủ cũ (thiếu khoá) ⇒ không số, không tự khoá.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, configure, fireEvent, render, screen, waitFor } from '@testing-library/react'
vi.mock('../src/components/KhoiCauSai', () => ({ LoiGiaiCauSai: () => <p>Lời giải từ kho</p> }))
vi.mock('../src/game/than-thu-v2/battle-audio', () => ({ unlockBattleAudio: vi.fn(), playBattleSound: vi.fn() }))
import DoanHoTong from '../src/game/than-thu-v2/DoanHoTong'
import type { DoanXem, SanhXem } from '../src/game/than-thu-v2/doan-kieu'

configure({ asyncUtilTimeout: 8000 })
beforeEach(() => { sessionStorage.clear(); localStorage.clear() })
afterEach(() => { cleanup() })

const sanh = (): SanhXem => ({
  lop: '12 - Tinh Hoa', tenDoan: 'Đoàn Hộ Tống', mua: { so: 3, conNgay: 12 }, ve: 3, mienPhiHomNay: false, chuoi: { ngay: 0, daDiHomNay: false, mocKe: 7, conNgay: 7 },
  doanLop: { lop: '12 - Tinh Hoa', tram: 5, tongTram: 12, changThang: 3, changMoiTram: 4, conChangToiTramKe: 2, mocKe: 8, tenMocKe: 'Cổng Ester', conTramToiMoc: 3, gopSucHomNay: 11, siSo: 30 },
  trumLop: { dangMo: false, chuNhat: '2026-09-27', moSauMs: 6 * 24 * 3_600_000, conMs: 0, daGop: 0, mucTieu: 300, daHa: false }, quaMoi: [],
})
const ghe = (): DoanXem['ghe'] => [{ ghe: 0, ten: 'Minh', pet: 2, cap: 32, laMay: false, roi: false, laEm: true, trangThai: 'dang_lam' as never, tinHieu: null }, { ghe: 1, ten: 'Hà', pet: 1, cap: 30, laMay: false, roi: false, laEm: false, trangThai: 'dang_lam' as never, tinHieu: null }]
const cau = { qid: 'Q1', maDe: 'D', version: 'v', group: 'g', phan: 'I' as const, text: 'Thuỷ phân ethyl acetate thu được', choices: ['phương án một', 'phương án hai', 'phương án ba', 'phương án bốn'], ideas: [], hinhAnh: [], dang: 'ES', tenDang: 'Ester', mucDo: 'hieu', sao: 2, kienThuc: [] }
const tran = { tenChang: 'Vượt Đầm', hiep: 1, soHiep: 8, laTrum: false, ketThuc: false, thang: null, linhTam: { hp: 80, toiDa: 100 }, quai: [{ ma: 5, loai: 'bun_acid', hp: 9 }], trumVoGiap: [], nangLuong: 1, daNhanTiepSuc: 0, giay: 40, moSauMs: 30000, conMs: 27000, tenQuai: ['Bùn Acid', 'Khói'], loaiQuai: ['bun_acid', 'khoi_oxi_hoa'], tenTrum: ['A', 'B'], loaiTrum: ['chua_te_ket_tua', 'ba_chu_an_mon'] } as DoanXem['tran']
const doanMo = (): DoanXem => ({ ma: 'DH9', revision: 1, laChu: true, batDau: true, ghe: ghe(), gioMayChu: 0, tran, cau: { qid: 'Q1', nhan: 'cau_moi', de: cau } as never })

interface Cfg { sanh?: Record<string, unknown>; recs?: Record<string, unknown>; mo?: Record<string, unknown>[] }
function dung({ sanh: sanhResp, recs, mo }: Cfg) {
  const lanMo = [...(mo ?? [{ ok: true, doan: doanMo() }])]
  let dangDo: DoanXem = doanMo() // nhịp hỏi `doan-xem` trả ĐÚNG đoàn vừa mở (không lật về hiệp khác)
  const call = vi.fn(async (lenh: string, _b: Record<string, unknown> = {}) => {
    if (lenh === 'doan-sanh') return { ok: true, sanh: sanh(), ...sanhResp }
    if (lenh === 'recommendations') return { ok: true, suggestions: [{ title: 'Ester' }], ...recs }
    if (lenh === 'doan-mo') { const r = lanMo.shift() ?? { ok: true, doan: doanMo() }; if (r.doan) dangDo = r.doan as DoanXem; return r }
    if (lenh === 'doan-xem') return { ok: true, doan: dangDo }
    return { ok: true }
  })
  render(<DoanHoTong call={call} sbd="S1" pet={2} cap={32} onDong={vi.fn()} onVeBangNhiemVu={vi.fn()} />)
  return { call }
}
const nutMo = () => screen.findByRole('button', { name: /Mở đoàn mới/ }) as Promise<HTMLButtonElement>
const nutDi = () => screen.findByRole('button', { name: /LÊN ĐƯỜNG|ĐÃ ĐI ĐỦ CHẶNG|HẾT VÉ/ }) as Promise<HTMLButtonElement>

describe('sảnh Đoàn lấy hết-lượt từ doan-sanh (60 câu Đoàn), KHÔNG từ recommendations (36 câu Đảo)', () => {
  it('doan-sanh: 60/60 (Đoàn hết) trong khi Đảo còn nhiều (recommendations remaining 20) ⇒ khoá + "Hôm nay em đã đi 60/60 câu Đoàn Hộ Tống"', async () => {
    dung({ sanh: { tranNgay: 60, dailyUsed: 60 }, recs: { remaining: 20, dailyUsed: 16, tranNgay: 36 } })
    await waitFor(async () => expect((await nutMo()).disabled).toBe(true))
    expect(document.querySelector('.dh-ly-do')!.textContent).toBe('Hôm nay em đã đi 60/60 câu Đoàn Hộ Tống — mai mình đi tiếp nhé.')
    expect((await nutDi()).disabled).toBe(true)
  })
  it('Đảo HẾT (remaining 0, 36/36) nhưng Đoàn còn (10/60) ⇒ Đoàn KHÔNG bị khoá — hai trần độc lập', async () => {
    dung({ sanh: { tranNgay: 60, dailyUsed: 10 }, recs: { remaining: 0, dailyUsed: 36, tranNgay: 36 } })
    await screen.findByText(/Câu của riêng em hôm nay|Mỗi hiệp em nhận/) // sảnh dựng xong
    await waitFor(() => expect(screen.getByText(/còn 3 vé|Vé hộ tống: 3/)).toBeTruthy())
    expect((await nutMo()).disabled).toBe(false)
    expect((await nutDi()).disabled).toBe(false)
    expect(document.querySelector('.dh-ly-do')).toBeNull()
    expect(document.body.textContent).not.toMatch(/36\/36/)
  })
  it('máy chủ CŨ (doan-sanh chưa có tranNgay/dailyUsed): KHÔNG tự khoá theo recommendations.remaining của Đảo; số hiện câu chung không số khi máy chủ từ chối', async () => {
    dung({ sanh: {}, recs: { remaining: 0, dailyUsed: 36, tranNgay: 36 } })
    expect((await nutMo()).disabled).toBe(false)
    expect((await nutDi()).disabled).toBe(false)
    expect(document.querySelector('.dh-ly-do')).toBeNull()
  })
  it('chỉ có MỘT trong hai số (hỏng) ⇒ coi như máy chủ cũ: không khoá', async () => {
    dung({ sanh: { tranNgay: 60 } })
    expect((await nutMo()).disabled).toBe(false)
    cleanup()
    dung({ sanh: { dailyUsed: 60 } })
    expect((await nutMo()).disabled).toBe(false)
  })
})

describe('doan-sanh.changHomNay ⇒ "Đã đi N/6 chặng hôm nay"; đủ chặng ⇒ khoá', () => {
  it('2/6 ⇒ chip + hai nút bấm được', async () => {
    dung({ sanh: { tranNgay: 60, dailyUsed: 5, changHomNay: { daDi: 2, toiDa: 6 } } })
    expect(await screen.findByText('Đã đi 2/6 chặng hôm nay')).toBeTruthy()
    expect((await nutMo()).disabled).toBe(false)
  })
  it('6/6 ⇒ khoá cả hai nút, nhãn ĐÃ ĐI ĐỦ CHẶNG HÔM NAY, lý do "đã đi đủ 6 chặng"', async () => {
    dung({ sanh: { tranNgay: 60, dailyUsed: 5, changHomNay: { daDi: 6, toiDa: 6 } } })
    await waitFor(async () => expect((await nutMo()).disabled).toBe(true))
    expect(document.querySelector('.dh-ly-do')!.textContent).toBe('Hôm nay em đã đi đủ 6 chặng — mai mình đi tiếp nhé.')
    expect(screen.getByRole('button', { name: /ĐÃ ĐI ĐỦ CHẶNG HÔM NAY/ })).toBeTruthy()
  })
  it('thiếu changHomNay (máy chủ cũ / thiếu bảng) ⇒ không chip, không khoá', async () => {
    dung({ sanh: { tranNgay: 60, dailyUsed: 5 } })
    expect((await nutMo()).disabled).toBe(false)
    expect(document.querySelector('[data-vung="chang-hom-nay"]')).toBeNull()
  })
})

describe('rời đoàn về sảnh ⇒ số Đoàn (lượt câu, chặng) được HỎI LẠI và cập nhật', () => {
  it('mở đoàn (phòng chờ) rồi Rời đoàn ⇒ doan-sanh gọi lần nữa, chip chặng 2/6 → 3/6', async () => {
    let lanSanh = 0
    const phong: DoanXem = { ma: 'DH7', revision: 1, laChu: true, batDau: false, ghe: ghe(), gioMayChu: 0 }
    const call = vi.fn(async (lenh: string, _b: Record<string, unknown> = {}) => {
      if (lenh === 'doan-sanh') { lanSanh += 1; return { ok: true, sanh: sanh(), tranNgay: 60, dailyUsed: 5, changHomNay: { daDi: lanSanh === 1 ? 2 : 3, toiDa: 6 } } }
      if (lenh === 'recommendations') return { ok: true, suggestions: [] }
      if (lenh === 'doan-mo') return { ok: true, doan: phong }
      if (lenh === 'doan-xem') return { ok: true, doan: phong }
      if (lenh === 'doan-roi') return { ok: true, daRoi: true }
      return { ok: true }
    })
    render(<DoanHoTong call={call} sbd="S1" pet={2} cap={32} onDong={vi.fn()} onVeBangNhiemVu={vi.fn()} />)
    expect(await screen.findByText('Đã đi 2/6 chặng hôm nay')).toBeTruthy()
    fireEvent.click(await nutMo())
    fireEvent.click(await screen.findByRole('button', { name: 'Rời đoàn' }))
    expect(await screen.findByText('Đã đi 3/6 chặng hôm nay')).toBeTruthy()
    expect(lanSanh).toBe(2)
  })
})

describe('hetCauMoi (doan-mo): hôm nay hết câu MỚI ⇒ máy nói thật lúc chuẩn bị hiệp 1', () => {
  it('dòng CHỈ ở quãng chuẩn bị HIỆP 1 (không lặp ở hiệp sau)', async () => {
    dung({ sanh: { tranNgay: 60, dailyUsed: 5 }, mo: [{ ok: true, doan: { ...doanMo(), tran: { ...tran, hiep: 2 } as DoanXem['tran'] }, hetCauMoi: true }] })
    fireEvent.click(await nutDi())
    await screen.findByText(/Hiệp 2 mở sau/)
    expect(document.querySelector('[data-vung="het-cau-moi"]')).toBeNull()
  })
  it('doan-mo trả hetCauMoi ⇒ dòng "Hôm nay hết câu mới cho em, có vài câu em từng làm lâu rồi."; không có cờ ⇒ không dòng', async () => {
    dung({ sanh: { tranNgay: 60, dailyUsed: 5 }, mo: [{ ok: true, doan: doanMo(), hetCauMoi: true }] })
    fireEvent.click(await nutDi())
    expect(await screen.findByText('Hôm nay hết câu mới cho em, có vài câu em từng làm lâu rồi.')).toBeTruthy()
    expect(document.querySelector('[data-vung="het-cau-moi"]')!.getAttribute('role')).toBe('status')
    cleanup(); sessionStorage.clear()
    dung({ sanh: { tranNgay: 60, dailyUsed: 5 }, mo: [{ ok: true, doan: doanMo() }] })
    fireEvent.click(await nutDi())
    await screen.findByText(/Chuẩn bị lên đường/)
    expect(document.querySelector('[data-vung="het-cau-moi"]')).toBeNull()
  })
})
