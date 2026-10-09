// CHƯƠNG TRÌNH "CẨN THẬN" · ĐOÀN HỘ TỐNG PHÍA HỌC SINH (đặc tả 4.6; thầy 06/10 "Làm nốt đi tất cả") — LÀN B, đợt 2 sáng 06/10.
// CHỈ khi `hoa2-sanh` báo `omni.canThan` (Sơ ý > 7%): (b) chip "Soát lại đơn vị và số liệu" ở câu PHẦN III (nút phụ cùng kiểu chip "Chưa chắc", không bắt buộc, không thêm trường vào `doan-nop`);
// (c) thẻ "Em biết câu này. Sai vì bước nào?" đi cùng kết quả câu (`doan-nop` → omni.buocSai khi canThan ∧ chắc-mà-sai): chạm ⇒ `hoa2-omni-buoc-sai {qid, ma}`.
// `canThan` vắng ⇒ DOM + thân lệnh y hệt hôm nay. Chữ dựng bằng CHÍNH hằng của src/lib/omni-chu.ts.
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor, configure, within } from '@testing-library/react'
vi.mock('../src/game/than-thu-v2/battle-audio', () => ({ unlockBattleAudio: vi.fn(), playBattleSound: vi.fn() }))
import DoanHoTong from '../src/game/than-thu-v2/DoanHoTong'
import type { DoanXem } from '../src/game/than-thu-v2/doan-kieu'
import { canThanTrongSanh } from '../src/game/than-thu-v2/doan2/kieu2'
import { CHIP_CHUA_CHAC, CHU_CHAC_MA_SAI, CHU_DA_GHI_BUOC_SAI, CHU_LOI_GHI_BUOC_SAI, CHU_SOAT_LAI, NUT_EM_CHUA_RO, TIEU_DE_BUOC_SAI } from '../src/lib/omni-chu'

configure({ asyncUtilTimeout: 8000 })
beforeEach(() => { sessionStorage.clear(); localStorage.clear() })
afterEach(() => { cleanup() })

const ghe: DoanXem['ghe'] = [
  { ghe: 0, ten: 'Minh', pet: 2, cap: 32, laMay: false, roi: false, laEm: true, trangThai: 'dang_lam', tinHieu: null },
  { ghe: 1, ten: 'Thu Hà', pet: 1, cap: 30, laMay: false, roi: false, laEm: false, trangThai: 'da_chot', tinHieu: null },
]
const tran = { tenChang: 'Đèo Hoàng Hôn', hiep: 3, soHiep: 8, laTrum: false, ketThuc: false, thang: null, linhTam: { hp: 80, toiDa: 100 }, quai: [{ ma: 5, loai: 'bun_acid', hp: 9 }], trumVoGiap: [],
  nangLuong: 2, daNhanTiepSuc: 0, giay: 40, moSauMs: 0, conMs: 26000, tenQuai: ['Bùn Acid', 'Khói Oxi Hoá'], loaiQuai: ['bun_acid', 'khoi_oxi_hoa'], tenTrum: ['Chúa tể Kết Tủa', 'Bá chủ Ăn Mòn'], loaiTrum: ['chua_te_ket_tua', 'ba_chu_an_mon'] } as DoanXem['tran']
const deI = { qid: 'Q1', maDe: 'D', version: 'v', group: 'g', phan: 'I' as const, text: 'Thuỷ phân hoàn toàn 8,8 gam ethyl acetate bằng NaOH dư. Khối lượng muối là', choices: ['4,1 gam', '8,2 gam', '9,6 gam', '6,8 gam'], ideas: [], hinhAnh: [], dang: 'ES', tenDang: 'Thuỷ phân ester', mucDo: 'hieu', sao: 2, kienThuc: [] }
const deIII = { ...deI, qid: 'Q3', phan: 'III' as const, text: 'Tính khối lượng muối thu được (gam).', choices: [] }
const xem = (de: typeof deI, o: Partial<DoanXem> = {}): DoanXem => ({ ma: 'DH2', revision: 5, laChu: true, batDau: true, ghe, gioMayChu: 0, tran, cau: { qid: de.qid, nhan: 'toi_han_on', de } as DoanXem['cau'], ...o })
const OMNI = { bat: true, baiDangLuyen: [], dangVung: { a: 0, b: 0 }, conDangDe8: null, sEm: null, sMucTieu: 0.07, chungChi: [], ve: { con: 2, tong: 2 }, choBaiMoi: false, onBaiCu: 0, metGio: null, nhatKy: null, deThu: { duoc: false, soCau: 14, phut: 25 } }
const OMNI_CAN_THAN = { ...OMNI, sEm: 0.11, canThan: true }
const BUOC = [{ ma: 'nen:mol', ten: 'Tính số mol' }, { ma: 'nen:pt', ten: 'Lập phương trình phản ứng' }]
const omniKq = (o: object) => ({ nhanTocDo: 'thuong', msLam: 40_000, msKyVong: 60_000, luot: false, chacMaSai: false, loiNhan: null, ...o })

function dung(o: { omni?: object; de?: typeof deI; omniKq?: object; chacSai?: boolean; buocSaiLoi?: boolean } = {}) {
  const de = o.de ?? deI
  const x = xem(de)
  sessionStorage.setItem('doan:S1', x.ma)
  let lanGhi = 0
  const call = vi.fn(async (lenh: string, _b: Record<string, unknown> = {}) => lenh === 'hoa2-sanh' ? { ok: true, cheDo2: true, doan: { con: 4 }, dao: { con: 28 }, ...(o.omni ? { omni: o.omni } : {}) }
    : lenh === 'doan-xem' ? { ok: true, doan: x }
      : lenh === 'doan-nop' ? { ok: true, doan: xem(de, { revision: 6, cau: { qid: de.qid, daChot: true, hanhDong: 'danh', ketQua: null } }),
        ketQuaCau: { correct: !o.chacSai, answer: 'B', solution: { chot: 'Muối là CH3COONa' } }, omni: omniKq(o.omniKq ?? {}) }
        : lenh === 'hoa2-omni-buoc-sai' ? (o.buocSaiLoi && lanGhi++ === 0 ? Promise.reject(new Error('Mất mạng')) : { ok: true, daGhi: true })
          : { ok: true })
  render(<DoanHoTong call={call} sbd="S1" pet={2} cap={32} onDong={vi.fn()} onVeBangNhiemVu={vi.fn()} />)
  return { call, goi: (lenh: string) => call.mock.calls.filter(c => c[0] === lenh).map(c => c[1] as Record<string, unknown>) }
}
const man = () => document.querySelector('.dh') as HTMLElement
const chipSoat = () => screen.queryByRole('button', { name: CHU_SOAT_LAI })
const coThe = () => document.querySelector('[data-khoi="buoc-sai"]') as HTMLElement | null
async function vaoDoan() {
  await waitFor(() => expect(man().className).toContain('dh2'))
  await new Promise(r => setTimeout(r, 20))
}
const nhapDapSo = (v: string) => fireEvent.change(screen.getByRole('textbox', { name: 'Đáp số của em' }), { target: { value: v } })

describe('đọc cờ canThan trong hoa2-sanh (kieu2.ts)', () => {
  it('CHỈ khi omni.bat ∧ omni.canThan === true', () => {
    expect(canThanTrongSanh({ omni: OMNI_CAN_THAN })).toBe(true)
    expect(canThanTrongSanh({ omni: OMNI })).toBe(false)
    expect(canThanTrongSanh({ omni: { ...OMNI, canThan: 'true' } })).toBe(false)
    expect(canThanTrongSanh({ omni: { canThan: true } })).toBe(false) // thiếu bat ⇒ OMNI không áp
    expect(canThanTrongSanh({})).toBe(false)
    expect(canThanTrongSanh(null)).toBe(false)
  })
})

describe('Đoàn · (b) chip "Soát lại đơn vị và số liệu"', () => {
  it('canThan VẮNG (OMNI bật, Sơ ý ≤ 7%) ⇒ chip "Chưa chắc" như cũ, KHÔNG chip Soát lại ở câu Phần III; doan-nop không thêm trường', async () => {
    const m = dung({ omni: OMNI, de: deIII })
    await screen.findByText('Tính khối lượng muối thu được (gam).')
    await vaoDoan()
    await screen.findByRole('button', { name: CHIP_CHUA_CHAC })
    expect(chipSoat()).toBeNull()
    expect(document.querySelector('[data-vung="soat-lai"]')).toBeNull()
    nhapDapSo('8,2')
    fireEvent.click(await screen.findByRole('button', { name: /CHỐT ĐÁP ÁN/ }))
    await waitFor(() => expect(m.goi('doan-nop')).toHaveLength(1))
    expect(Object.keys(m.goi('doan-nop')[0]!).sort()).toEqual(['answer', 'hanhDong', 'hiep', 'ma', 'msLam'])
  })

  it('OMNI tắt ⇒ không chip nào của OMNI, thân doan-nop như cũ', async () => {
    const m = dung({ de: deIII })
    await screen.findByText('Tính khối lượng muối thu được (gam).')
    await vaoDoan()
    expect(chipSoat()).toBeNull()
    expect(screen.queryByRole('button', { name: CHIP_CHUA_CHAC })).toBeNull()
    nhapDapSo('8,2')
    fireEvent.click(await screen.findByRole('button', { name: /CHỐT ĐÁP ÁN/ }))
    await waitFor(() => expect(m.goi('doan-nop')).toEqual([{ ma: 'DH2', hiep: 3, answer: '8,2', hanhDong: 'danh' }]))
  })

  it('canThan ⇒ chip CHỈ ở câu Phần III, cùng kiểu chip "Chưa chắc" (nút phụ dh-xin), chạm bật/tắt; KHÔNG bắt buộc; thân doan-nop không thêm trường', async () => {
    const m = dung({ omni: OMNI_CAN_THAN, de: deIII })
    await screen.findByText('Tính khối lượng muối thu được (gam).')
    await vaoDoan()
    const chip = await screen.findByRole('button', { name: CHU_SOAT_LAI })
    expect(chip.className).toBe('dh-xin')
    expect(chip.textContent).toBe(CHU_SOAT_LAI)
    expect(chip.getAttribute('aria-pressed')).toBe('false')
    expect(screen.getByRole('button', { name: CHIP_CHUA_CHAC })).toBeTruthy() // chip Chưa chắc còn nguyên
    fireEvent.click(chip)
    expect(chip.getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(chip)
    expect(chip.getAttribute('aria-pressed')).toBe('false')
    // KHÔNG bắt buộc: chưa soát vẫn chốt được
    nhapDapSo('8,2')
    const chot = await screen.findByRole('button', { name: /CHỐT ĐÁP ÁN/ }) as HTMLButtonElement
    expect(chot.disabled).toBe(false)
    fireEvent.click(chot)
    await waitFor(() => expect(m.goi('doan-nop')).toHaveLength(1))
    expect(Object.keys(m.goi('doan-nop')[0]!).sort()).toEqual(['answer', 'hanhDong', 'hiep', 'ma', 'msLam'])
  })

  it('canThan nhưng câu Phần I ⇒ KHÔNG chip Soát lại', async () => {
    dung({ omni: OMNI_CAN_THAN, de: deI })
    await screen.findByText('8,2 gam')
    await vaoDoan()
    await screen.findByRole('button', { name: CHIP_CHUA_CHAC })
    expect(chipSoat()).toBeNull()
  })
})

describe('Đoàn · (c) thẻ "Em biết câu này. Sai vì bước nào?"', () => {
  const chacMaSai = { chacMaSai: true, loiNhan: CHU_CHAC_MA_SAI, canThan: true, buocSai: { lua: BUOC } }

  it('canThan VẮNG trong câu trả lời ⇒ KHÔNG thẻ (kể cả máy chủ lỡ gửi buocSai)', async () => {
    const m = dung({ omni: OMNI, chacSai: true, omniKq: { chacMaSai: true, loiNhan: CHU_CHAC_MA_SAI, buocSai: { lua: BUOC } } })
    await screen.findByText('8,2 gam')
    await vaoDoan()
    fireEvent.click(await screen.findByRole('button', { name: /9,6 gam/ }))
    fireEvent.click(await screen.findByRole('button', { name: /CHỐT ĐÁP ÁN/ }))
    await screen.findByText(CHU_CHAC_MA_SAI)
    expect(coThe()).toBeNull()
    expect(screen.queryByText(TIEU_DE_BUOC_SAI)).toBeNull()
    expect(m.goi('hoa2-omni-buoc-sai')).toHaveLength(0)
  })

  it('canThan ∧ chắc-mà-sai ⇒ thẻ đủ chữ chuẩn cùng kết quả câu; chạm một bước ⇒ hoa2-omni-buoc-sai {qid, ma} đúng một lần, thẻ báo đã ghi, khoá nút; không chấm lại', async () => {
    const m = dung({ omni: OMNI_CAN_THAN, chacSai: true, omniKq: chacMaSai })
    await screen.findByText('8,2 gam')
    await vaoDoan()
    fireEvent.click(await screen.findByRole('button', { name: /9,6 gam/ }))
    fireEvent.click(await screen.findByRole('button', { name: /CHỐT ĐÁP ÁN/ }))
    await screen.findByText(CHU_CHAC_MA_SAI)
    const the = await waitFor(() => { const t = coThe(); expect(t).toBeTruthy(); return t! })
    expect(within(the).getByText(TIEU_DE_BUOC_SAI)).toBeTruthy()
    expect(TIEU_DE_BUOC_SAI).toBe('Em biết câu này. Sai vì bước nào?')
    expect([...the.querySelectorAll('button')].map(b => b.textContent)).toEqual(['Tính số mol', 'Lập phương trình phản ứng', NUT_EM_CHUA_RO])
    expect([...the.querySelectorAll('button')].every(b => b.className === 'dh-xin')).toBe(true) // chip sẵn có của Đoàn
    expect(the.closest('.dh-giay')).toBeTruthy() // trong thẻ câu, ngoài hộp kết quả (nền sáng riêng)
    expect(the.closest('.dh-ket-qua-cau')).toBeNull()
    expect(the.textContent).not.toMatch(/nen:|dang:|vi kỹ năng/i)
    expect(m.goi('hoa2-omni-buoc-sai')).toHaveLength(0)
    const nop = m.goi('doan-nop').length
    fireEvent.click(within(the).getByRole('button', { name: 'Lập phương trình phản ứng' }))
    await within(the).findByText(CHU_DA_GHI_BUOC_SAI)
    expect(m.goi('hoa2-omni-buoc-sai')).toEqual([{ qid: 'Q1', ma: 'nen:pt' }])
    expect(m.goi('doan-nop')).toHaveLength(nop) // không chấm lại
    expect([...the.querySelectorAll('button')].every(b => (b as HTMLButtonElement).disabled)).toBe(true)
    fireEvent.click(within(the).getByRole('button', { name: NUT_EM_CHUA_RO }))
    expect(m.goi('hoa2-omni-buoc-sai')).toHaveLength(1)
  })

  it('"Em chưa rõ" ⇒ ma = chua_ro; lỗi mạng ⇒ báo lỗi nhỏ và cho chạm lại', async () => {
    const m = dung({ omni: OMNI_CAN_THAN, chacSai: true, omniKq: chacMaSai, buocSaiLoi: true })
    await screen.findByText('8,2 gam')
    await vaoDoan()
    fireEvent.click(await screen.findByRole('button', { name: /9,6 gam/ }))
    fireEvent.click(await screen.findByRole('button', { name: /CHỐT ĐÁP ÁN/ }))
    const the = await waitFor(() => { const t = coThe(); expect(t).toBeTruthy(); return t! })
    fireEvent.click(within(the).getByRole('button', { name: NUT_EM_CHUA_RO }))
    expect((await within(the).findByRole('alert')).textContent).toBe(CHU_LOI_GHI_BUOC_SAI)
    expect([...the.querySelectorAll('button')].every(b => !(b as HTMLButtonElement).disabled)).toBe(true)
    fireEvent.click(within(the).getByRole('button', { name: NUT_EM_CHUA_RO }))
    await within(the).findByText(CHU_DA_GHI_BUOC_SAI)
    expect(m.goi('hoa2-omni-buoc-sai')).toEqual([{ qid: 'Q1', ma: 'chua_ro' }, { qid: 'Q1', ma: 'chua_ro' }])
  })

  it('canThan nhưng KHÔNG chắc-mà-sai (đúng) ⇒ không thẻ', async () => {
    dung({ omni: OMNI_CAN_THAN, omniKq: { canThan: true } })
    await screen.findByText('8,2 gam')
    await vaoDoan()
    fireEvent.click(await screen.findByRole('button', { name: /8,2 gam/ }))
    fireEvent.click(await screen.findByRole('button', { name: /CHỐT ĐÁP ÁN/ }))
    await screen.findByText('Em trả lời đúng.')
    expect(coThe()).toBeNull()
  })
})
