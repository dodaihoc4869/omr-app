// CHƯƠNG TRÌNH "CẨN THẬN" · ĐẢO 2.0 PHÍA HỌC SINH (đặc tả 4.6; thầy 06/10 "Làm nốt đi tất cả") — LÀN B, đợt 2 sáng 06/10.
// Ngoại lệ CÓ KIỂM SOÁT của luật "giữ nguyên giao diện app học sinh": phần thêm CHỈ hiện cho em máy chủ báo `canThan` (hoa2-sanh → omni.canThan; answer → omni.canThan + buocSai).
//   (b) chip "Soát lại đơn vị và số liệu" ở câu PHẦN III — một chạm, KHÔNG bắt buộc, không chặn nút chốt, không thêm trường vào thân `answer`;
//   (c) thẻ "Em biết câu này. Sai vì bước nào?" sau lượt chắc-mà-sai: các bước của câu + "Em chưa rõ"; chạm ⇒ `hoa2-omni-buoc-sai {qid, ma}` (máy chủ ghi `omni_buoc_sai`).
// `canThan` vắng ⇒ DOM Y HỆT hôm nay (không chip, không thẻ, không lệnh mới). Chữ dựng bằng CHÍNH hằng của src/lib/omni-chu.ts.
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor, configure, within } from '@testing-library/react'
import Dao2 from '../src/game/than-thu-v2/dao2/Dao2'
import { docBuocSai, docKetQuaOmni, docSanhOmni } from '../src/lib/omni-hs'
import { CHIP_CHUA_CHAC, CHU_CHAC_MA_SAI, CHU_DA_GHI_BUOC_SAI, CHU_LOI_GHI_BUOC_SAI, CHU_SOAT_LAI, NUT_EM_CHUA_RO, TIEU_DE_BUOC_SAI } from '../src/lib/omni-chu'
import type { CauDao2 } from '../src/game/than-thu-v2/dao2/dao2-core'
import type { DaoKetQua, DaoProfile } from '../src/game/than-thu-v2/dao/kieu'

configure({ asyncUtilTimeout: 8000 })
beforeEach(() => {
  sessionStorage.clear(); localStorage.clear()
  Element.prototype.scrollIntoView = function () {} as unknown as Element['scrollIntoView']
})
afterEach(() => { cleanup(); vi.clearAllMocks() })

const hoSo: DaoProfile = { nickname: 'Lửa Nhỏ', pet: 'lua_phuong', choice: false, cap: 7, exp: 0, wallet: 0, mastery: [] }
const cau = (i: number, them: Partial<CauDao2> = {}): CauDao2 => ({ qid: `q${i}`, maDe: 'DE', version: '1', group: `g${i}`, phan: 'I', text: `Câu hỏi số ${i + 1}`, choices: ['Một', 'Hai', 'Ba', 'Bốn'], ideas: [], hinhAnh: [], dang: 'D', tenDang: 'Este', mucDo: 'biet', sao: 1, kienThuc: [], vai: 'moi', ...them })
const cauIII = (i: number): CauDao2 => cau(i, { phan: 'III', choices: [], text: `Tính khối lượng muối (gam) — câu ${i + 1}` })
const OMNI = { bat: true, baiDangLuyen: [], dangVung: { a: 2, b: 9 }, conDangDe8: 3, sEm: 0.12, sMucTieu: 0.07, chungChi: [], ve: { con: 1, tong: 2 }, choBaiMoi: false, onBaiCu: 0, metGio: null, nhatKy: null, deThu: { duoc: false, soCau: 14, phut: 25 } }
const OMNI_CAN_THAN = { ...OMNI, canThan: true }
const sanh = (omni?: object) => ({ ok: true, cheDo2: true, ngay: '2026-10-06', chienDich: { id: 'cd1', ten: 'Ester', hanNop: '2026-10-12', D: 7, tong: 120, coXat: 50, thanhThao: 10, canDayLai: 0, thanhThaoTangTu: null },
  theLuc: { con: 20, tong: 40 }, huyetChien: false, doan: { con: 0 }, dao: { con: 20 }, khoaDao: false, ruong: { daLam: 20, tong: 40, moDuoc: false, daMo: false }, ...(omni ? { omni } : {}) })
const SAI = { correct: false, answer: 'A', traLoi: 'B', solution: { chot: 'Chốt lời giải' }, reward: 0, stage: 0 }
const DUNG = { correct: true, answer: 'B', traLoi: 'B', solution: { chot: 'Chốt lời giải' }, reward: 2, stage: 1 }
const omniKq = (o: object) => ({ nhanTocDo: null, msLam: 4000, msKyVong: 60000, luot: false, chacMaSai: false, loiNhan: null, ...o })
const BUOC = [{ ma: 'nen:mol', ten: 'Tính số mol' }, { ma: 'nen:pt', ten: 'Lập phương trình phản ứng' }, { ma: 'dang:es', ten: 'Thuỷ phân ester' }]

type Kich = Record<string, (d: Record<string, unknown>) => unknown>
function dung(o: { omni?: object; kich?: Kich; cau?: CauDao2[] } = {}) {
  const nhat: [string, Record<string, unknown>][] = []
  const kich: Kich = {
    'hoa2-cau-da-lam': () => ({ cau: [] }), resume: () => ({ questions: [] }), sync: () => ({ remaining: 0 }),
    start: () => ({ id: 's1', questions: o.cau ?? [cau(0), cau(1)] }), answer: () => SAI, complete: () => ({}),
    ...o.kich,
  }
  const call = vi.fn(async (action: string, data: Record<string, unknown> = {}): Promise<DaoKetQua> => { nhat.push([action, data]); return { ok: true, ...((kich[action]?.(data) as object) ?? {}) } as DaoKetQua })
  const r = render(<Dao2 sbd="S1" profile={hoSo} call={call} doanMo={false} sanhDau={sanh(o.omni)} onMoDoan={() => {}} onMoSoTay={() => {}} onDong={() => {}} />)
  return { ...r, nhat, call, than: (lenh: string, i = 0) => nhat.filter(n => n[0] === lenh)[i]?.[1], goi: (lenh: string) => nhat.filter(n => n[0] === lenh) }
}
async function lenDuong(tong = 2) {
  const nut = await screen.findByRole('button', { name: /LÊN ĐƯỜNG/ }) as HTMLButtonElement
  await waitFor(() => expect(nut.disabled).toBe(false))
  fireEvent.click(nut)
  await screen.findByText(new RegExp(`^ẢI 1/${tong}`))
}
const chotI = () => { fireEvent.click(screen.getByRole('button', { name: /^B\./ })); fireEvent.click(screen.getByRole('button', { name: 'CHỐT ĐÁP ÁN' })) }
const nhapIII = (v: string) => fireEvent.change(screen.getByRole('textbox', { name: 'Đáp án của em' }), { target: { value: v } })
const nutChot = () => screen.getByRole('button', { name: /CHỐT ĐÁP ÁN|Nhập đáp án để tung chiêu/ }) as HTMLButtonElement
const chipSoat = () => screen.queryByRole('switch', { name: CHU_SOAT_LAI }) as HTMLInputElement | null
const nutSang = (sau: number) => screen.findByRole('button', { name: `ĐÃ ĐỌC LỜI GIẢI · SANG ẢI ${sau}` })
const coThe = (c: HTMLElement) => c.querySelector('[data-khoi="buoc-sai"]')

describe('đọc chặt dữ liệu máy chủ (src/lib/omni-hs.ts)', () => {
  it('Sảnh: canThan CHỈ khi đúng true; vắng / sai kiểu ⇒ không trường', () => {
    expect(docSanhOmni(OMNI_CAN_THAN)!.canThan).toBe(true)
    for (const v of [undefined, false, 'true', 1, null]) expect('canThan' in docSanhOmni({ ...OMNI, canThan: v })!, String(v)).toBe(false)
    expect('canThan' in docSanhOmni(OMNI)!).toBe(false)
  })
  it('answer: buocSai CHỈ khi canThan === true ∧ chacMaSai === true; tối đa 4, mục thiếu ma/ten bị bỏ; không mục hợp lệ ⇒ không thẻ', () => {
    const co = docKetQuaOmni(omniKq({ canThan: true, chacMaSai: true, buocSai: { lua: BUOC } }))!
    expect(co.canThan).toBe(true)
    expect(co.buocSai).toEqual({ lua: BUOC })
    expect(docKetQuaOmni(omniKq({ canThan: false, chacMaSai: true, buocSai: { lua: BUOC } }))!.buocSai).toBeUndefined() // máy chủ lỡ gửi buocSai khi canThan sai ⇒ bỏ
    expect(docKetQuaOmni(omniKq({ chacMaSai: true, buocSai: { lua: BUOC } }))!.buocSai).toBeUndefined()
    expect(docKetQuaOmni(omniKq({ canThan: true, chacMaSai: false, buocSai: { lua: BUOC } }))!.buocSai).toBeUndefined()
    expect(docBuocSai({ lua: [{ ma: 'a', ten: '' }, { ma: '', ten: 'x' }, { ten: 'y' }, 5, null] })).toBeNull()
    expect(docBuocSai({ lua: Array.from({ length: 7 }, (_, i) => ({ ma: `m${i}`, ten: `Bước ${i}` })) })!.lua).toHaveLength(4)
    expect(docBuocSai(undefined)).toBeNull()
    expect('canThan' in docKetQuaOmni(omniKq({}))!).toBe(false)
  })
})

describe('(b) chip "Soát lại đơn vị và số liệu" — Đảo 2.0', () => {
  it('canThan VẮNG (OMNI bật nhưng Sơ ý ≤ 7%) ⇒ KHÔNG chip ở câu Phần III; thân answer y như hôm nay', async () => {
    const m = dung({ omni: OMNI, cau: [cauIII(0), cauIII(1)], kich: { answer: d => ({ ...DUNG, answer: d.answer, traLoi: d.answer }) } })
    await lenDuong()
    expect(chipSoat()).toBeNull()
    expect(m.container.querySelector('[data-khoi="soat-lai"]')).toBeNull()
    expect(screen.queryByText(CHU_SOAT_LAI)).toBeNull()
    nhapIII('12')
    fireEvent.click(nutChot())
    await screen.findByRole('button', { name: /ĐÃ ĐỌC LỜI GIẢI/ })
    expect(Object.keys(m.than('answer')!).sort()).toEqual(['answer', 'assisted', 'msLam', 'qid', 'session'])
  })

  it('OMNI tắt (không có omni trong Sảnh) ⇒ không chip, không thẻ, không lệnh mới', async () => {
    const m = dung({ cau: [cauIII(0), cauIII(1)] })
    await lenDuong()
    expect(chipSoat()).toBeNull()
    expect(m.container.querySelector('[data-khoi="soat-lai"], [data-khoi="chua-chac"], [data-khoi="buoc-sai"]')).toBeNull()
  })

  it('canThan ⇒ chip CHỈ ở câu Phần III (không ở Phần I), đúng chữ, mặc định tắt, nằm cạnh các chip sẵn có; chạm bật/tắt; sang ải đặt lại', async () => {
    const m = dung({ omni: OMNI_CAN_THAN, cau: [cauIII(0), cau(1), cauIII(2)], kich: { answer: d => ({ ...DUNG, answer: d.answer, traLoi: d.answer }) } })
    await lenDuong(3)
    const chip = chipSoat()!
    expect(chip).toBeTruthy()
    expect(chip.checked).toBe(false)
    expect(chip.closest('label')?.textContent).toBe(CHU_SOAT_LAI)
    expect(chip.closest('label')?.className).toBe('dao2-tro') // cùng kiểu chip sẵn có
    expect(chip.closest('.dao2-chan-hang')?.querySelector('[aria-label="Câu này em có trợ giúp"]')).toBeTruthy()
    expect(screen.getByRole('switch', { name: CHIP_CHUA_CHAC })).toBeTruthy() // chip Chưa chắc vẫn còn nguyên
    fireEvent.click(chip)
    expect(chip.checked).toBe(true)
    expect(chip.closest('label')?.hasAttribute('data-bat')).toBe(true)
    fireEvent.click(chip)
    expect(chip.checked).toBe(false)
    fireEvent.click(chip) // bật rồi chốt
    nhapIII('12')
    fireEvent.click(nutChot())
    fireEvent.click(await nutSang(2))
    await screen.findByText(/^ẢI 2\/3/)
    expect(chipSoat()).toBeNull() // câu Phần I: không có ô
    chotI()
    fireEvent.click(await nutSang(3))
    await screen.findByText(/^ẢI 3\/3/)
    expect(chipSoat()!.checked).toBe(false) // câu Phần III kế: đặt lại
    expect(m.container.querySelectorAll('[data-khoi="soat-lai"]')).toHaveLength(1)
  })

  it('KHÔNG bắt buộc: không chạm chip vẫn chốt được; chạm chip KHÔNG thêm trường vào thân answer (không gửi gì lên máy chủ)', async () => {
    const m = dung({ omni: OMNI_CAN_THAN, cau: [cauIII(0), cauIII(1)], kich: { answer: d => ({ ...DUNG, answer: d.answer, traLoi: d.answer }) } })
    await lenDuong()
    expect(nutChot().disabled).toBe(true)
    nhapIII('12')
    expect(nutChot().disabled).toBe(false) // chưa soát vẫn chốt được
    fireEvent.click(nutChot())
    fireEvent.click(await nutSang(2))
    await screen.findByText(/^ẢI 2\/2/)
    fireEvent.click(chipSoat()!)
    nhapIII('13')
    fireEvent.click(nutChot())
    await screen.findByRole('button', { name: /ĐÃ ĐỌC LỜI GIẢI/ })
    for (const i of [0, 1]) expect(Object.keys(m.than('answer', i)!).sort(), `lần ${i + 1}`).toEqual(['answer', 'assisted', 'msLam', 'qid', 'session'])
    expect(m.goi('hoa2-omni-buoc-sai')).toHaveLength(0)
  })
})

describe('(c) thẻ "Em biết câu này. Sai vì bước nào?" — Đảo 2.0', () => {
  const chacMaSai = (them: object = {}) => ({ ...SAI, omni: omniKq({ chacMaSai: true, loiNhan: CHU_CHAC_MA_SAI, canThan: true, buocSai: { lua: BUOC }, ...them }) })

  it('canThan VẮNG ⇒ KHÔNG thẻ (kể cả chắc-mà-sai vẫn mở lời giải như hôm nay); máy chủ lỡ gửi buocSai mà thiếu canThan ⇒ bỏ', async () => {
    const m = dung({ omni: OMNI, kich: { answer: () => chacMaSai({ canThan: undefined }) } })
    await lenDuong()
    chotI()
    await nutSang(2)
    expect(coThe(m.container)).toBeNull()
    expect(screen.queryByText(TIEU_DE_BUOC_SAI)).toBeNull()
    expect(m.container.querySelector('.dao2-the-giai[data-mo-loi-giai]')).toBeTruthy() // hành vi cũ giữ nguyên
    expect(m.goi('hoa2-omni-buoc-sai')).toHaveLength(0)
  })

  it('canThan ∧ chắc-mà-sai ⇒ thẻ đủ chữ chuẩn: tiêu đề + các bước + "Em chưa rõ"; nằm trên nút sang ải, dưới kết quả', async () => {
    const m = dung({ omni: OMNI_CAN_THAN, kich: { answer: () => chacMaSai() } })
    await lenDuong()
    chotI()
    await nutSang(2)
    const the = coThe(m.container) as HTMLElement
    expect(the).toBeTruthy()
    expect(the.getAttribute('role')).toBe('group')
    expect(the.className).toBe('dao2-kinh dao2-het-tran') // thẻ kính sẵn có (cùng kiểu thẻ Trạm hồi phục)
    expect(within(the).getByText(TIEU_DE_BUOC_SAI)).toBeTruthy()
    expect(TIEU_DE_BUOC_SAI).toBe('Em biết câu này. Sai vì bước nào?')
    expect(NUT_EM_CHUA_RO).toBe('Em chưa rõ')
    expect([...the.querySelectorAll('button')].map(b => b.textContent)).toEqual(['Tính số mol', 'Lập phương trình phản ứng', 'Thuỷ phân ester', NUT_EM_CHUA_RO])
    expect(the.textContent).not.toMatch(/nen:|dang:|vi kỹ năng/i) // không mã nội bộ trên màn học sinh
    const chan = the.closest('.dao2-chan')!
    expect(chan.contains(screen.getByRole('button', { name: 'ĐÃ ĐỌC LỜI GIẢI · SANG ẢI 2' }))).toBe(true) // nút chính vẫn ngay dưới
    expect(m.goi('hoa2-omni-buoc-sai')).toHaveLength(0) // chưa chạm ⇒ chưa gọi
  })

  it('chạm một bước ⇒ gọi hoa2-omni-buoc-sai {qid, ma} ĐÚNG MỘT lần; thẻ báo đã ghi, khoá các nút; không chấm lại (Máu/kết quả không đổi)', async () => {
    const m = dung({ omni: OMNI_CAN_THAN, kich: { answer: () => chacMaSai(), 'hoa2-omni-buoc-sai': () => ({ daGhi: true }) } })
    await lenDuong()
    chotI()
    await nutSang(2)
    const the = coThe(m.container) as HTMLElement
    const truoc = m.goi('answer').length
    fireEvent.click(within(the).getByRole('button', { name: 'Lập phương trình phản ứng' }))
    await within(the).findByText(CHU_DA_GHI_BUOC_SAI)
    expect(m.goi('hoa2-omni-buoc-sai')).toHaveLength(1)
    expect(m.than('hoa2-omni-buoc-sai')).toEqual({ qid: 'q0', ma: 'nen:pt' })
    expect(m.goi('answer')).toHaveLength(truoc) // không chấm lại
    const nut = [...the.querySelectorAll('button')]
    expect(nut.every(b => (b as HTMLButtonElement).disabled)).toBe(true)
    expect(within(the).getByRole('button', { name: 'Lập phương trình phản ứng' }).getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(within(the).getByRole('button', { name: NUT_EM_CHUA_RO })) // đã khoá ⇒ không gọi lần hai
    expect(m.goi('hoa2-omni-buoc-sai')).toHaveLength(1)
  })

  it('"Em chưa rõ" ⇒ ma = chua_ro', async () => {
    const m = dung({ omni: OMNI_CAN_THAN, kich: { answer: () => chacMaSai(), 'hoa2-omni-buoc-sai': () => ({ daGhi: true }) } })
    await lenDuong()
    chotI()
    await nutSang(2)
    fireEvent.click(within(coThe(m.container) as HTMLElement).getByRole('button', { name: NUT_EM_CHUA_RO }))
    await waitFor(() => expect(m.goi('hoa2-omni-buoc-sai')).toHaveLength(1))
    expect(m.than('hoa2-omni-buoc-sai')).toEqual({ qid: 'q0', ma: 'chua_ro' })
  })

  it('máy chủ từ chối / mất mạng ⇒ báo lỗi nhỏ (không mã lỗi), các nút còn bấm lại được; bấm lại được thì ghi', async () => {
    let lan = 0
    const m = dung({ omni: OMNI_CAN_THAN, kich: { answer: () => chacMaSai(), 'hoa2-omni-buoc-sai': () => { if (lan++ === 0) throw new Error('Mất mạng'); return { daGhi: true } } } })
    await lenDuong()
    chotI()
    await nutSang(2)
    const the = coThe(m.container) as HTMLElement
    fireEvent.click(within(the).getByRole('button', { name: 'Tính số mol' }))
    expect((await within(the).findByRole('alert')).textContent).toBe(CHU_LOI_GHI_BUOC_SAI)
    expect([...the.querySelectorAll('button')].every(b => !(b as HTMLButtonElement).disabled)).toBe(true)
    fireEvent.click(within(the).getByRole('button', { name: 'Tính số mol' }))
    await within(the).findByText(CHU_DA_GHI_BUOC_SAI)
    expect(within(the).queryByRole('alert')).toBeNull()
    expect(m.goi('hoa2-omni-buoc-sai')).toHaveLength(2)
  })

  it('canThan nhưng KHÔNG chắc-mà-sai (đúng / chọn "Chưa chắc") ⇒ không thẻ; sang ải kế ⇒ thẻ biến mất', async () => {
    let n = 0
    const m = dung({ omni: OMNI_CAN_THAN, kich: { answer: () => (n++ === 0 ? chacMaSai() : { ...DUNG, omni: omniKq({ canThan: true }) }) } })
    await lenDuong()
    chotI()
    fireEvent.click(await nutSang(2))
    await screen.findByText(/^ẢI 2\/2/)
    expect(coThe(m.container)).toBeNull() // thẻ của câu 1 không theo sang câu 2
    chotI()
    await screen.findByRole('button', { name: 'ĐÃ ĐỌC LỜI GIẢI · HOÀN THÀNH CHUYẾN' })
    expect(coThe(m.container)).toBeNull() // câu 2 đúng ⇒ không thẻ
  })
})
