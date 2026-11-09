// ÔN BÀI CŨ trên THẺ XÁC NHẬN "Bài hôm nay" (app THẦY; thầy 06/10: "chọn Bài 6 thì tổng số câu ôn của Bài 1–5 khi hết hạn khoảng bao nhiêu, có giúp học sinh ôn trọn vẹn không"):
//  (a) đúng MỘT dòng "Ôn bài cũ: tối đa N câu/em · kho X câu · phủ ≈ Y%" (số do máy chủ tính ở `xem-truoc`, khối `onBaiCu`); vắng khối ấy ⇒ không dòng, không ô chỉnh (màn y hệt cũ);
//  (c) ô chỉnh "Ôn bài cũ: ngày thường [20] % · ngày thứ 4–5 của bài [40] %" (0–60 %, bước 5): đổi ⇒ dòng TÍNH LẠI ngay, "Lưu tỉ lệ cho lớp …" ⇒ `/gv/omni on-bai-cu-luu`
//  rồi hỏi lại `xem-truoc`; lỗi lưu hiện lời máy chủ; nhiều lớp ⇒ mỗi lớp một dòng + ô chỉnh riêng (lưu đúng lớp). `xem-truoc` gửi kèm `phamVi` (bài đứng trước).
// SỬA CÓ CHỦ ĐÍCH 09/11 (docs/ban-ve-giao-bai-0911): (a)(c) trên thẻ xác nhận đã bỏ cùng bước «Bài hôm nay» — xem chú thích cuối tệp.
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

// Bỏ theo thầy 09/11 (docs/ban-ve-giao-bai-0911): dòng «Ôn bài cũ» + ô chỉnh tỉ lệ ôn bài cũ theo lớp (OnBaiCuTheoLop) không còn ở đâu trong luồng giao
// bài — bước «Bài hôm nay» của Dạy học đã bỏ, hộp «Giao bài» chỉ còn ba ô Câu mới · Đề chuẩn · Hạn chung (máy tự xếp phần ôn). Đã xoá đúng các test:
// «(a) một lớp: ĐÚNG MỘT dòng…», «(a) máy chủ cũ / lỗi / kho 0 ⇒ KHÔNG dòng…», «(c) đổi ngày thường 20 → 30…», «(c) nhập sai…», «(c) bấm Lưu tỉ lệ…»,
// «(c) lưu lỗi…», «(a)(c) nhiều lớp: mỗi lớp một dòng…». Phần thuần (chuOnBaiCu, docOnBaiCuXem) vẫn kiểm ở trên.
// Còn giữ: `xem-truoc` gửi kèm `phamVi` (bài đứng trước) — kiểm trên hộp «Giao bài».
describe('hộp Giao bài: xem-truoc gửi phamVi; không còn dòng Ôn bài cũ', () => {
  async function moHop() {
    const { default: HopBoSungBai } = await import('../src/components/day-hoc/HopBoSungBai')
    render(<HopBoSungBai onDong={() => {}} />)
    const hop = screen.getByRole('dialog', { name: 'Giao bài' })
    await within(hop).findByRole('checkbox', { name: /Bài 3\. Xà phòng/ }, { timeout: 4000 })
    return hop
  }
  const o = (hop: HTMLElement, ten: RegExp) => within(hop).getByRole('checkbox', { name: ten }) as HTMLInputElement

  it('xem-truoc gửi kèm phamVi (bài đứng trước, đúng danh sách tick gửi); bài đầu tiên không có bài trước ⇒ KHÔNG gửi phamVi', async () => {
    const hop = await moHop()
    // Lớp chưa giao bài nào ⇒ Bài 1 là bài gợi ý, tick sẵn ⇒ xem trước của Bài 1: không có bài trước ⇒ không phamVi.
    await waitFor(() => expect(lenh('xem-truoc').length).toBeGreaterThan(0), { timeout: 4000 })
    expect(lenh('xem-truoc').at(-1)).toMatchObject({ khoaBai: 'DH-12-C1-B1', maDe: ['DH-12-C1-B1'] })
    expect('phamVi' in lenh('xem-truoc').at(-1)!).toBe(false)
    // Đổi sang Bài 3 ⇒ phamVi = Bài 1, Bài 2.
    fireEvent.click(o(hop, /Bài 1\. Ester/))
    fireEvent.click(o(hop, /Bài 3\. Xà phòng/))
    await waitFor(() => expect(lenh('xem-truoc').at(-1)!.khoaBai).toBe('DH-12-C1-B3'), { timeout: 4000 })
    expect(lenh('xem-truoc').at(-1)!.phamVi).toEqual([
      { khoaBai: 'DH-12-C1-B1', tenBai: 'Bài 1. Ester', viTri: 1, maDe: ['DH-12-C1-B1'] },
      { khoaBai: 'DH-12-C1-B2', tenBai: 'Bài 2. Lipid', viTri: 2, maDe: ['DH-12-C1-B2'] },
    ])
    // Máy chủ vẫn trả khối onBaiCu nhưng hộp không vẽ dòng / ô chỉnh ôn bài cũ (bỏ theo thầy 09/11).
    await waitFor(() => expect(within(hop).getByRole('button', { name: /^Giao 1 bài cho lớp 12 - Tinh Hoa/ })).toBeTruthy(), { timeout: 4000 })
    expect(hop.textContent).not.toContain('Ôn bài cũ:')
    expect(hop.querySelector('[data-khoi="on-bai-cu"]')).toBeNull()
    expect(within(hop).queryByRole('button', { name: /Lưu tỉ lệ/ })).toBeNull()
  })
})
