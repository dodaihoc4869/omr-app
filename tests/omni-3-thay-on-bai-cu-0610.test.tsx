// ÔN BÀI CŨ trên THẺ XÁC NHẬN "Bài hôm nay" (app THẦY; thầy 06/10: "chọn Bài 6 thì tổng số câu ôn của Bài 1–5 khi hết hạn khoảng bao nhiêu, có giúp học sinh ôn trọn vẹn không"):
//  (a) đúng MỘT dòng "Ôn bài cũ: tối đa N câu/em · kho X câu · phủ ≈ Y%" (số do máy chủ tính ở `xem-truoc`, khối `onBaiCu`); vắng khối ấy ⇒ không dòng, không ô chỉnh (màn y hệt cũ);
//  (c) ô chỉnh "Ôn bài cũ: ngày thường [20] % · ngày thứ 4–5 của bài [40] %" (0–60 %, bước 5): đổi ⇒ dòng TÍNH LẠI ngay, "Lưu tỉ lệ cho lớp …" ⇒ `/gv/omni on-bai-cu-luu`
//  rồi hỏi lại `xem-truoc`; lỗi lưu hiện lời máy chủ; nhiều lớp ⇒ mỗi lớp một dòng + ô chỉnh riêng (lưu đúng lớp). `xem-truoc` gửi kèm `phamVi` (bài đứng trước).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import type { TeacherExamSource } from '../src/data/examContent'

const { goi, khoGia } = vi.hoisted(() => ({ goi: vi.fn(), khoGia: { ds: [] as unknown[] } }))
vi.mock('../src/lib/goi-lenh-thay', () => ({ goiLenh: (duong: string, body: Record<string, unknown>) => goi(duong, body) }))
vi.mock('../src/lib/exam-db', async (goc) => ({
  ...(await goc<typeof import('../src/lib/exam-db')>()),
  loadExamSources: async () => khoGia.ds,
  loadScriptUrl: async () => 'https://may-chu',
  loadTeacherSecret: async () => 'mat',
}))
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-chu' }))

import DayHocLenBang from '../src/components/day-hoc/DayHocLenBang'
import { useAppStore } from '../src/store/appStore'
import { docOnBaiCuXem } from '../src/components/chien-dich/api-omni'
import { chuOnBaiCu } from '../src/lib/bai-hom-nay'

let soCau = 0
const cau = (maDe: string, n: number) => Array.from({ length: n }, () => ({ id: `${maDe}-I-${++soCau}`, text: `Câu ${soCau} của ${maDe}`, choices: ['a', 'b', 'c', 'd'], correct: 'A' }))
const to = (maDe: string, nguon: string, nI: number): TeacherExamSource => ({ maDe, nhom: '12 · DẠY HỌC/C1 - Ester lipid', nguon, phanI: cau(maDe, nI), phanII: [], phanIII: [] }) as unknown as TeacherExamSource
khoGia.ds = [to('DH-12-C1-B1', 'Bài 1. Ester', 2), to('DH-12-C1-B2', 'Bài 2. Lipid', 2), to('DH-12-C1-B3', 'Bài 3. Xà phòng và chất giặt rửa', 2)]

const TINH_HOA = '12 - Tinh Hoa'
const THUONG = '12 - Lớp Thường'
const BUOI = { id: 'BH-9', ten: `Buổi học 05/10 · ${TINH_HOA}`, lop: TINH_HOA, moLuc: '2026-10-05T11:00:00Z', hetHan: '2026-10-06T11:00:00Z', dongLuc: null, dangMo: true }
const XEM = { ok: true, soCau: 112, soTuLuan: 6, hanNop: '2026-10-12', D: 7, luotCan: 224, sucChua: 280, duLuot: 41, tongEm: 44, duDiem8: null, quaTai: [], theLucNgay: 40 }
/** Số máy chủ tính cho lớp Tinh Hoa: D = 7, thể lực 40, tỉ lệ 20 % / 40 % ⇒ N = 5 × 8 + 2 × 16 = 72; kho 310 ⇒ 23,2 % ⇒ 23. */
const ON_TINH_HOA = { toiDaMoiEm: 72, khoCau: 310, phuPhanTram: 23, soBai: 2, tiLe: { thuong: 0.2, cuoi: 0.4 } }
/** Lớp Thường: 30 % / 50 % ⇒ N = 5 × 12 + 2 × 20 = 100; kho 200 ⇒ 50 %. */
const ON_THUONG = { toiDaMoiEm: 100, khoCau: 200, phuPhanTram: 50, soBai: 2, tiLe: { thuong: 0.3, cuoi: 0.5 } }
let onBaiCu: Record<string, unknown> | null = ON_TINH_HOA
let onTheoLop: Record<string, Record<string, unknown> | null> = {}
let luuMay: { ok: true } | { ok: false; loai: string; chu: string } = { ok: true }

function mayChu() {
  goi.mockImplementation(async (duong: string, b: Record<string, unknown>) => {
    if (duong === '/gv/lop') return { ok: true, du: { ok: true, lop: [{ tenLop: THUONG, khoi: '12', soEm: 44, sbd: [] }, { tenLop: TINH_HOA, khoi: '12', soEm: 28, sbd: [] }, { tenLop: '11', khoi: '11', soEm: 30, sbd: [] }] } }
    if (duong === '/gv/buoi-hoc' && b.action === 'dang-mo') return { ok: true, du: { ok: true, buoi: [BUOI] } }
    if (duong === '/gv/buoi-hoc' && b.action === 'gan-day') return { ok: true, du: { ok: true, buoi: [] } }
    if (duong === '/gv/buoi-hoc') return { ok: true, du: { ok: true, buoi: BUOI, ma: '482915', doiMaLuc: 1, coMat: [], siSo: 28, lopEm: [] } }
    if (duong === '/gv/omni' && b.action === 'co-doc') return { ok: true, du: { ok: true, co: { bat: true, lop: [], sbd: [] } } }
    if (duong === '/gv/omni' && b.action === 'on-bai-cu-luu') {
      if (!luuMay.ok) return luuMay
      return { ok: true, du: { ok: true, lop: b.lop, tiLe: { thuong: b.thuong, cuoi: b.cuoi } } }
    }
    if (duong === '/gv/bai-da-day' && b.action === 'danh-sach') return { ok: true, du: { ok: true, bai: [], choBaiMoi: null } }
    if (duong === '/gv/bai-da-day' && b.action === 'xem-truoc') {
      const ob = String(b.lop) in onTheoLop ? onTheoLop[String(b.lop)] : onBaiCu
      return { ok: true, du: { ...XEM, ...(ob ? { onBaiCu: ob } : {}) } }
    }
    return { ok: false, loai: 'chua_co_lenh', chu: 'lệnh lạ' }
  })
}
const lenh = (action: string) => goi.mock.calls.filter(([d, b]) => d === '/gv/bai-da-day' && b.action === action).map(([, b]) => b as Record<string, unknown>)
const luuLenh = () => goi.mock.calls.filter(([d, b]) => d === '/gv/omni' && b.action === 'on-bai-cu-luu').map(([, b]) => b as Record<string, unknown>)

beforeEach(() => {
  goi.mockReset()
  onBaiCu = ON_TINH_HOA
  onTheoLop = {}
  luuMay = { ok: true }
  useAppStore.setState({ toast: null })
  mayChu()
})
afterEach(() => {
  cleanup()
  localStorage.clear()
  document.body.innerHTML = ''
})

async function moBuoc() {
  render(<DayHocLenBang />)
  const buoc = (await screen.findByRole('heading', { name: 'Bài hôm nay' })).closest('section') as HTMLElement
  await waitFor(() => expect(within(buoc).getByText('Bài 3. Xà phòng và chất giặt rửa')).toBeTruthy())
  return buoc
}
const dong = (buoc: HTMLElement, khoa: string) => buoc.querySelector(`[data-bai="${khoa}"]`) as HTMLElement
async function chonBai3() {
  const buoc = await moBuoc()
  fireEvent.click(within(dong(buoc, 'DH-12-C1-B3')).getByRole('radio'))
  await screen.findByText('Câu rút được')
  return buoc.querySelector('[data-khoi="xac-nhan-tick"]') as HTMLElement
}
const cacDong = (the: HTMLElement) => [...the.querySelectorAll('[data-khoi="on-bai-cu-dong"]')].map((e) => e.textContent)
const oThuong = (the: HTMLElement) => within(the).getByLabelText(/ngày thường/) as HTMLInputElement
const oCuoi = (the: HTMLElement) => within(the).getByLabelText(/ngày thứ 4–5 của bài/) as HTMLInputElement

describe('phần thuần: chữ dòng + đọc khối onBaiCu chặt', () => {
  it('chuOnBaiCu: đúng khuôn "Ôn bài cũ: tối đa N câu/em · kho X câu · phủ ≈ Y%"; kho 0 / hỏng / vắng ⇒ null', () => {
    expect(chuOnBaiCu(ON_TINH_HOA)).toBe('Ôn bài cũ: tối đa 72 câu/em · kho 310 câu · phủ ≈ 23%')
    expect(chuOnBaiCu({ toiDaMoiEm: 128, khoCau: 128, phuPhanTram: 100 })).toBe('Ôn bài cũ: tối đa 128 câu/em · kho 128 câu · phủ ≈ 100%')
    expect(chuOnBaiCu({ toiDaMoiEm: 72, khoCau: 0, phuPhanTram: 0 })).toBeNull()
    expect(chuOnBaiCu({ toiDaMoiEm: Number.NaN, khoCau: 10, phuPhanTram: 5 })).toBeNull()
    expect(chuOnBaiCu(null)).toBeNull()
    expect(chuOnBaiCu(undefined)).toBeNull()
  })
  it('docOnBaiCuXem: đủ trường đúng kiểu ⇒ khối; thiếu / sai kiểu / kho ≤ 0 ⇒ null (máy chủ cũ / trả lạ không làm vỡ màn)', () => {
    expect(docOnBaiCuXem(ON_TINH_HOA)).toEqual(ON_TINH_HOA)
    expect(docOnBaiCuXem({ ...ON_TINH_HOA, toiDaMoiEm: 71.6 })!.toiDaMoiEm).toBe(72)
    for (const x of [null, undefined, 5, 'x', [], {}, { ...ON_TINH_HOA, khoCau: 0 }, { ...ON_TINH_HOA, khoCau: '310' }, { ...ON_TINH_HOA, tiLe: null }, { ...ON_TINH_HOA, tiLe: { thuong: 0.2 } }, { ...ON_TINH_HOA, phuPhanTram: null }]) expect(docOnBaiCuXem(x), JSON.stringify(x)).toBeNull()
  })
})

describe('(a) dòng "Ôn bài cũ" trên thẻ xác nhận', () => {
  it('một lớp: ĐÚNG MỘT dòng, đúng chữ; ô chỉnh hiện 20 % / 40 %; nút Lưu khoá khi chưa đổi', async () => {
    const the = await chonBai3()
    expect(cacDong(the)).toEqual(['Ôn bài cũ: tối đa 72 câu/em · kho 310 câu · phủ ≈ 23%'])
    expect(oThuong(the).value).toBe('20')
    expect(oCuoi(the).value).toBe('40')
    const nut = within(the).getByRole('button', { name: `Lưu tỉ lệ cho lớp ${TINH_HOA}` }) as HTMLButtonElement
    expect(nut.disabled).toBe(true)
    expect(the.querySelector('[data-khoi="on-bai-cu-phu"]')?.textContent).toContain('Kế hoạch hôm nay đã chốt của từng em giữ nguyên')
  })
  it('máy chủ cũ / lỗi / kho 0 (không có khối onBaiCu) ⇒ KHÔNG dòng, KHÔNG ô chỉnh — thẻ y hệt trước', async () => {
    onBaiCu = null
    const the = await chonBai3()
    expect(the.querySelector('[data-khoi="on-bai-cu"]')).toBeNull()
    expect(the.textContent).not.toContain('Ôn bài cũ')
    expect(the.querySelectorAll('[data-so-tick]').length).toBeGreaterThanOrEqual(5) // sáu con số cũ vẫn đủ (ô "ca chốt ≥ 8" ẩn khi null)
    expect(within(the).queryByRole('button', { name: /Lưu tỉ lệ/ })).toBeNull()
  })
  it('xem-truoc gửi kèm phamVi (bài đứng trước, đúng danh sách tick gửi); bài đầu tiên không có bài trước ⇒ KHÔNG gửi phamVi', async () => {
    const buoc = await moBuoc()
    fireEvent.click(within(dong(buoc, 'DH-12-C1-B3')).getByRole('radio'))
    await waitFor(() => expect(lenh('xem-truoc').length).toBe(1))
    expect(lenh('xem-truoc')[0]!.phamVi).toEqual([
      { khoaBai: 'DH-12-C1-B1', tenBai: 'Bài 1. Ester', viTri: 1, maDe: ['DH-12-C1-B1'] },
      { khoaBai: 'DH-12-C1-B2', tenBai: 'Bài 2. Lipid', viTri: 2, maDe: ['DH-12-C1-B2'] },
    ])
    fireEvent.click(within(dong(buoc, 'DH-12-C1-B1')).getByRole('radio'))
    await waitFor(() => expect(lenh('xem-truoc').length).toBe(2))
    expect('phamVi' in lenh('xem-truoc')[1]!).toBe(false)
  })
})

describe('(c) chỉnh tỉ lệ ôn bài cũ của lớp', () => {
  it('đổi ngày thường 20 → 30 ⇒ dòng TÍNH LẠI ngay (N = 5 × 12 + 2 × 16 = 92 ⇒ 92 / 310 = 30 %), báo "Chưa lưu", nút Lưu mở; đổi lại 20 ⇒ về số cũ, nút khoá', async () => {
    const the = await chonBai3()
    fireEvent.change(oThuong(the), { target: { value: '30' } })
    expect(cacDong(the)).toEqual(['Ôn bài cũ: tối đa 92 câu/em · kho 310 câu · phủ ≈ 30%'])
    expect(the.querySelector('[data-khoi="on-bai-cu-phu"]')?.textContent).toContain('Chưa lưu')
    expect((within(the).getByRole('button', { name: `Lưu tỉ lệ cho lớp ${TINH_HOA}` }) as HTMLButtonElement).disabled).toBe(false)
    // ngày 4–5: 40 → 60 ⇒ N = 5 × 12 + 2 × 24 = 108 ⇒ 108 / 310 = 34,8 % ⇒ 35
    fireEvent.change(oCuoi(the), { target: { value: '60' } })
    expect(cacDong(the)).toEqual(['Ôn bài cũ: tối đa 108 câu/em · kho 310 câu · phủ ≈ 35%'])
    fireEvent.change(oThuong(the), { target: { value: '20' } })
    fireEvent.change(oCuoi(the), { target: { value: '40' } })
    expect(cacDong(the)).toEqual(['Ôn bài cũ: tối đa 72 câu/em · kho 310 câu · phủ ≈ 23%'])
    expect((within(the).getByRole('button', { name: `Lưu tỉ lệ cho lớp ${TINH_HOA}` }) as HTMLButtonElement).disabled).toBe(true)
    expect(luuLenh()).toHaveLength(0) // chưa bấm Lưu ⇒ chưa gửi gì
  })
  it('nhập sai (rỗng / 70 / 12,5 / chữ) ⇒ báo "Nhập số nguyên từ 0 đến 60.", nút khoá, dòng giữ số hợp lệ gần nhất; 0 và 60 là hợp lệ', async () => {
    const the = await chonBai3()
    for (const sai of ['', '70', '61', '12,5', '-5', 'abc']) {
      fireEvent.change(oThuong(the), { target: { value: sai } })
      expect(the.querySelector('[data-khoi="on-bai-cu-phu"]')?.textContent, `"${sai}"`).toBe('Nhập số nguyên từ 0 đến 60.')
      expect(the.querySelector('[data-khoi="on-bai-cu-phu"]')?.classList.contains('bhn-on-cu-sai'), `"${sai}" dòng phụ báo lỗi (đỏ)`).toBe(true)
      expect(oThuong(the).getAttribute('aria-invalid'), `"${sai}"`).toBe('true')
      expect((within(the).getByRole('button', { name: `Lưu tỉ lệ cho lớp ${TINH_HOA}` }) as HTMLButtonElement).disabled, `"${sai}"`).toBe(true)
      expect(cacDong(the)[0], `"${sai}"`).toBe('Ôn bài cũ: tối đa 72 câu/em · kho 310 câu · phủ ≈ 23%')
    }
    fireEvent.change(oThuong(the), { target: { value: '0' } }) // ngày thường 0 % ⇒ N = 2 × 16 = 32 ⇒ 32 / 310 = 10,3 % ⇒ 10
    expect(cacDong(the)).toEqual(['Ôn bài cũ: tối đa 32 câu/em · kho 310 câu · phủ ≈ 10%'])
    expect(oThuong(the).getAttribute('aria-invalid')).toBe('false')
    expect(the.querySelector('[data-khoi="on-bai-cu-phu"]')?.classList.contains('bhn-on-cu-sai')).toBe(false) // hợp lệ ⇒ hết đỏ
    fireEvent.change(oThuong(the), { target: { value: '60' } }) // 60 % thường, 40 % ngày 4–5 ⇒ N = 5 × 24 + 2 × 16 = 152 ⇒ 49 %
    expect(cacDong(the)).toEqual(['Ôn bài cũ: tối đa 152 câu/em · kho 310 câu · phủ ≈ 49%'])
    expect(oThuong(the).max).toBe('60')
    expect(oThuong(the).step).toBe('5')
    expect(oThuong(the).min).toBe('0')
  })
  it('bấm "Lưu tỉ lệ cho lớp …" ⇒ gửi đúng {lop, thuong, cuoi} (số 0–0,6) ⇒ báo đã lưu ⇒ hỏi lại xem-truoc ⇒ dòng theo số máy chủ trả; nút khoá lại', async () => {
    const the = await chonBai3()
    fireEvent.change(oThuong(the), { target: { value: '30' } })
    const nut = within(the).getByRole('button', { name: `Lưu tỉ lệ cho lớp ${TINH_HOA}` })
    // máy chủ trả lại số mới ở lần xem-truoc kế (tỉ lệ 30 % / 40 % ⇒ N = 92)
    onBaiCu = { toiDaMoiEm: 92, khoCau: 310, phuPhanTram: 30, soBai: 2, tiLe: { thuong: 0.3, cuoi: 0.4 } }
    fireEvent.click(nut)
    await waitFor(() => expect(luuLenh()).toHaveLength(1))
    expect(luuLenh()[0]).toEqual({ action: 'on-bai-cu-luu', lop: TINH_HOA, thuong: 0.3, cuoi: 0.4 })
    await waitFor(() => expect(useAppStore.getState().toast?.text).toContain(`Đã lưu tỉ lệ ôn bài cũ của lớp ${TINH_HOA}: ngày thường 30 %, ngày thứ 4–5 của bài 40 %`))
    expect(useAppStore.getState().toast?.kind).toBe('success')
    await waitFor(() => expect(lenh('xem-truoc').length).toBe(2)) // hỏi lại máy chủ sau khi lưu
    await waitFor(() => expect(cacDong(the)).toEqual(['Ôn bài cũ: tối đa 92 câu/em · kho 310 câu · phủ ≈ 30%']))
    expect(oThuong(the).value).toBe('30')
    expect(the.querySelector('[data-khoi="on-bai-cu-phu"]')?.textContent).not.toContain('Chưa lưu')
    expect((within(the).getByRole('button', { name: `Lưu tỉ lệ cho lớp ${TINH_HOA}` }) as HTMLButtonElement).disabled).toBe(true)
  })
  it('lưu lỗi ⇒ hiện ĐÚNG lời máy chủ (role alert), giữ số đang gõ, không báo đã lưu; bấm lại được', async () => {
    luuMay = { ok: false, loai: 'chua_co_lenh', chu: 'Máy chủ chưa có lệnh OMNI — cần đẩy bản máy chủ mới.' }
    const the = await chonBai3()
    fireEvent.change(oCuoi(the), { target: { value: '50' } })
    fireEvent.click(within(the).getByRole('button', { name: `Lưu tỉ lệ cho lớp ${TINH_HOA}` }))
    const loi = await within(the).findByRole('alert')
    expect(loi.textContent).toBe('Máy chủ chưa có lệnh OMNI — cần đẩy bản máy chủ mới.')
    expect(oCuoi(the).value).toBe('50')
    expect(useAppStore.getState().toast).toBeNull()
    expect(lenh('xem-truoc')).toHaveLength(1) // lỗi ⇒ không hỏi lại
    expect((within(the).getByRole('button', { name: `Lưu tỉ lệ cho lớp ${TINH_HOA}` }) as HTMLButtonElement).disabled).toBe(false) // bấm lại được
    luuMay = { ok: true }
    fireEvent.click(within(the).getByRole('button', { name: `Lưu tỉ lệ cho lớp ${TINH_HOA}` }))
    await waitFor(() => expect(luuLenh()).toHaveLength(2))
    await waitFor(() => expect(within(the).queryByRole('alert')).toBeNull())
  })
})

describe('(a)(c) nhiều lớp: mỗi lớp một dòng + ô chỉnh riêng', () => {
  it('hai lớp ⇒ hai dòng đúng số của từng lớp; lưu ở lớp nào gửi đúng lớp ấy', async () => {
    onTheoLop = { [TINH_HOA]: ON_TINH_HOA, [THUONG]: ON_THUONG }
    const buoc = await moBuoc()
    fireEvent.click(within(buoc).getByRole('button', { name: /Chọn lớp/ }))
    fireEvent.click(await screen.findByRole('checkbox', { name: /^12 - Lớp Thường/ }))
    fireEvent.click(within(dong(buoc, 'DH-12-C1-B3')).getByRole('radio'))
    await waitFor(() => expect(lenh('xem-truoc').length).toBe(2))
    const the = buoc.querySelector('[data-khoi="xac-nhan-tick"]') as HTMLElement
    await waitFor(() => expect(the.querySelectorAll('[data-khoi="on-bai-cu"]')).toHaveLength(2))
    const theoLop = Object.fromEntries([...the.querySelectorAll('[data-khoi="on-bai-cu"]')].map((e) => [e.getAttribute('data-lop'), e.querySelector('[data-khoi="on-bai-cu-dong"]')!.textContent]))
    expect(theoLop).toEqual({
      [THUONG]: 'Ôn bài cũ: tối đa 100 câu/em · kho 200 câu · phủ ≈ 50%',
      [TINH_HOA]: 'Ôn bài cũ: tối đa 72 câu/em · kho 310 câu · phủ ≈ 23%',
    })
    // sửa lớp Thường: 30 → 40 ⇒ N = 5 × 16 + 2 × 20 = 120 ⇒ 120 / 200 = 60 %; lớp Tinh Hoa không đổi
    const khung = (lop: string) => the.querySelector(`[data-khoi="on-bai-cu"][data-lop="${lop}"]`) as HTMLElement
    fireEvent.change(within(khung(THUONG)).getByLabelText(/ngày thường/), { target: { value: '40' } })
    expect(khung(THUONG).querySelector('[data-khoi="on-bai-cu-dong"]')!.textContent).toBe('Ôn bài cũ: tối đa 120 câu/em · kho 200 câu · phủ ≈ 60%')
    expect(khung(TINH_HOA).querySelector('[data-khoi="on-bai-cu-dong"]')!.textContent).toBe('Ôn bài cũ: tối đa 72 câu/em · kho 310 câu · phủ ≈ 23%')
    expect((within(khung(TINH_HOA)).getByRole('button', { name: /Lưu tỉ lệ/ }) as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(within(khung(THUONG)).getByRole('button', { name: `Lưu tỉ lệ cho lớp ${THUONG}` }))
    await waitFor(() => expect(luuLenh()).toHaveLength(1))
    expect(luuLenh()[0]).toEqual({ action: 'on-bai-cu-luu', lop: THUONG, thuong: 0.4, cuoi: 0.5 })
  })
})
