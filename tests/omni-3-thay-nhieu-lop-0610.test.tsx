// BƯỚC "BÀI HÔM NAY" · NHIỀU LỚP (thầy 06/10: "tích chọn được nhiều lớp, sắp xếp bài theo đúng thứ tự từ bé tới lớn … chỗ chọn lớp xếp theo khối 10,11,12 ô tick xổ xuống là các lớp").
// Khoá: (1) hàm thuần chọn lớp theo khối / chia em về lớp / chip gộp nhiều lớp; (2) ô chọn lớp xếp khối 10 · 11 · 12, chọn nhiều lớp CÙNG KHỐI, khối khác ⇒ chọn lại từ đầu;
// (3) cây bài theo số bài tăng dần; (4) giao nhiều lớp: danh-sach / xem-truoc / tick MỖI LỚP MỘT LỆNH (máy chủ giữ nguyên), lớp đã có bài bị bỏ qua, một lớp lỗi không chặn lớp khác.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
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
import {
  chiaEmTheoLop,
  doiChonKhoi,
  doiChonLop,
  khoiCuaDongLop,
  lopTheoKhoi,
  tenGonLop,
  trangThaiNhieuLop,
  type TickTom,
} from '../src/lib/bai-hom-nay'

const LOP = [
  { tenLop: '12 - Lớp Thường', khoi: '12', soEm: 44 },
  { tenLop: '12 - Tinh Hoa', khoi: '12', soEm: 28 },
  { tenLop: '12 - Nhóm 10 điểm', khoi: '12', soEm: 20 },
  { tenLop: '11', khoi: '11', soEm: 30 },
  { tenLop: '10', khoi: '10', soEm: 25 },
  { tenLop: 'Chưa xếp lớp', khoi: '', soEm: 5 },
]

describe('hàm thuần: chọn lớp theo khối, chia em về lớp, chip gộp nhiều lớp', () => {
  const ds = lopTheoKhoi(LOP)
  it('lớp xếp khối 10 → 11 → 12, trong khối theo tên; lớp không rõ khối ("Chưa xếp lớp") bị bỏ; khối đọc từ cột khối rồi tên lớp', () => {
    expect(ds.map((l) => [l.khoi, l.tenLop, l.soEm])).toEqual([
      ['10', '10', 25],
      ['11', '11', 30],
      ['12', '12 - Lớp Thường', 44],
      ['12', '12 - Nhóm 10 điểm', 20],
      ['12', '12 - Tinh Hoa', 28],
    ])
    expect(khoiCuaDongLop({ tenLop: '12A1' })).toBe('12')
    expect(khoiCuaDongLop({ tenLop: 'Lớp lạ', khoi: '11' })).toBe('11')
    expect(khoiCuaDongLop({ tenLop: 'Chưa xếp lớp' })).toBe('')
    expect(tenGonLop('12 - Tinh Hoa')).toBe('Tinh Hoa')
    expect(tenGonLop('12A1')).toBe('12A1')
    expect(tenGonLop('11')).toBe('11')
  })
  it('tick lớp: cộng dồn trong cùng khối (thứ tự theo danh sách); lớp KHỐI KHÁC ⇒ chọn lại từ đầu + báo đổi khối; bỏ tick; lớp lạ giữ nguyên', () => {
    expect(doiChonLop(ds, [], '12 - Tinh Hoa', true)).toEqual({ chon: ['12 - Tinh Hoa'], doiKhoi: false })
    expect(doiChonLop(ds, ['12 - Tinh Hoa'], '12 - Lớp Thường', true)).toEqual({ chon: ['12 - Lớp Thường', '12 - Tinh Hoa'], doiKhoi: false })
    expect(doiChonLop(ds, ['12 - Tinh Hoa', '12 - Lớp Thường'], '11', true)).toEqual({ chon: ['11'], doiKhoi: true })
    expect(doiChonLop(ds, ['12 - Lớp Thường', '12 - Tinh Hoa'], '12 - Tinh Hoa', false)).toEqual({ chon: ['12 - Lớp Thường'], doiKhoi: false })
    expect(doiChonLop(ds, ['11'], 'Không có lớp này', true)).toEqual({ chon: ['11'], doiKhoi: false })
  })
  it('tick cả khối: mọi lớp của khối (bỏ lớp khối khác); bỏ tick khối chỉ bỏ lớp của khối ấy', () => {
    expect(doiChonKhoi(ds, [], '12', true)).toEqual({ chon: ['12 - Lớp Thường', '12 - Nhóm 10 điểm', '12 - Tinh Hoa'], doiKhoi: false })
    expect(doiChonKhoi(ds, ['11'], '12', true).doiKhoi).toBe(true)
    expect(doiChonKhoi(ds, ['11'], '12', true).chon).toHaveLength(3)
    expect(doiChonKhoi(ds, ['12 - Lớp Thường', '12 - Tinh Hoa'], '12', false)).toEqual({ chon: [], doiKhoi: false })
  })
  it('chia em đã chọn về từng lớp (em ngoài các lớp chọn về lớp đầu — y hành vi một lớp cũ); lớp không em vẫn có khoá rỗng', () => {
    const em = [
      { sbd: 'T1', khoi: '12', tenLop: '12 - Tinh Hoa' },
      { sbd: 'T2', khoi: '12', tenLop: '12 - Tinh Hoa' },
      { sbd: 'L1', khoi: '12', tenLop: '12 - Lớp Thường' },
      { sbd: 'X1', khoi: '12', tenLop: '12 - Nhóm 10 điểm' },
      { sbd: 'K1', khoi: '11', tenLop: '11' },
    ]
    const ra = chiaEmTheoLop(['12 - Tinh Hoa', '12 - Lớp Thường', '12 - Nhóm 10 điểm'], em, ['T2', 'L1', 'K1', 'T1'])
    expect([...ra]).toEqual([
      ['12 - Tinh Hoa', ['T1', 'T2', 'K1']],
      ['12 - Lớp Thường', ['L1']],
      ['12 - Nhóm 10 điểm', []],
    ])
    expect([...chiaEmTheoLop([], em, ['T1'])]).toEqual([])
    // Một lớp ⇒ đúng danh sách cũ (mọi em đã chọn, theo thứ tự danh sách em).
    expect(chiaEmTheoLop(['12 - Tinh Hoa'], em, ['L1', 'T1']).get('12 - Tinh Hoa')).toEqual(['T1', 'L1'])
  })
  it('chip gộp qua các lớp: một lớp y chip cũ; nhiều lớp "Đã dạy · k/n lớp" / "Đang luyện · k/n lớp"; chưa lớp nào ⇒ "Chưa dạy" hoặc "Bài hôm nay"', () => {
    const daDay: TickTom = { trangThai: 'da_day', tickLuc: '2026-09-22T03:00:00Z', conNgay: null, chungChi: { dat: 38, tong: 44 } }
    const dangLuyen: TickTom = { trangThai: 'dang_luyen', tickLuc: '', conNgay: 2, chungChi: null }
    expect(trangThaiNhieuLop([daDay], false)).toMatchObject({ kieu: 'da_day', chu: 'Đã dạy 22/09 · chứng chỉ 38/44' })
    expect(trangThaiNhieuLop([null], true)).toMatchObject({ kieu: 'hom_nay', chu: 'Bài hôm nay' })
    expect(trangThaiNhieuLop([null, undefined, null], false)).toMatchObject({ kieu: 'chua_day', chu: 'Chưa dạy', soLopDaGiao: 0, tong: 3 })
    expect(trangThaiNhieuLop([daDay, null, daDay], false)).toMatchObject({ kieu: 'da_day', chu: 'Đã dạy · 2/3 lớp', soLopDaGiao: 2, tong: 3 })
    expect(trangThaiNhieuLop([daDay, dangLuyen], false)).toMatchObject({ kieu: 'dang_luyen', chu: 'Đang luyện · 2/2 lớp' })
    expect(trangThaiNhieuLop([], false)).toMatchObject({ kieu: 'chua_day', soLopDaGiao: 0, tong: 0 })
  })
  it('bài đứng TRƯỚC bài đã tick / đang chọn (thầy 06/10): một lớp ⇒ "Đã dạy"; nhiều lớp ⇒ "Đã dạy" khi mọi lớp coi là bài trước, "Đã dạy · k/n lớp" khi chỉ k lớp; chỉ dự kiến ⇒ nét đứt; tick thật và "Bài hôm nay" thắng', () => {
    expect(trangThaiNhieuLop([null], false, ['tick'])).toMatchObject({ kieu: 'da_day', chu: 'Đã dạy', soLopDaGiao: 0, tong: 1 })
    expect(trangThaiNhieuLop([null], false, ['xem'])).toMatchObject({ kieu: 'da_day', chu: 'Đã dạy', duKien: true })
    expect(trangThaiNhieuLop([null, null], false, ['tick', 'tick'])).toMatchObject({ kieu: 'da_day', chu: 'Đã dạy', soLopDaGiao: 0, tong: 2 })
    expect(trangThaiNhieuLop([null, null, null], false, ['tick', null, 'tick'])).toMatchObject({ kieu: 'da_day', chu: 'Đã dạy · 2/3 lớp' })
    expect(trangThaiNhieuLop([null, null], false, ['xem', 'xem']).duKien).toBe(true)
    expect(trangThaiNhieuLop([null, null], false, ['tick', 'xem']).duKien).toBeUndefined() // có lớp đã là phạm vi thật ⇒ không nét đứt
    expect(trangThaiNhieuLop([null, null], false, [null, null])).toMatchObject({ kieu: 'chua_day', chu: 'Chưa dạy' })
    expect(trangThaiNhieuLop([null, null], true, ['tick', null])).toMatchObject({ kieu: 'hom_nay', chu: 'Bài hôm nay' })
    const daDay: TickTom = { trangThai: 'da_day', tickLuc: '2026-09-22T03:00:00Z', conNgay: null, chungChi: null }
    expect(trangThaiNhieuLop([daDay, null], false, [null, 'tick'])).toMatchObject({ kieu: 'da_day', chu: 'Đã dạy · 1/2 lớp', soLopDaGiao: 1 }) // có lớp tick thật ⇒ đếm theo tick
  })
})

// ---------------------------------------------------------------- màn: Dạy học nhiều lớp
let soCau = 0
const cau = (maDe: string, n: number) => Array.from({ length: n }, () => ({ id: `${maDe}-I-${++soCau}`, text: `Câu ${soCau} của ${maDe}`, choices: ['a', 'b', 'c', 'd'], correct: 'A' }))
const cauII = (maDe: string, n: number) => Array.from({ length: n }, () => ({ id: `${maDe}-II-${++soCau}`, text: `Ý ${soCau} của ${maDe}`, ideas: ['a', 'b', 'c', 'd'], correct: 'DDSS' }))
const to = (maDe: string, nguon: string, nI: number, nII: number, nhom: string): TeacherExamSource => ({ maDe, nhom, nguon, phanI: cau(maDe, nI), phanII: cauII(maDe, nII), phanIII: [] }) as unknown as TeacherExamSource
const c12 = (n: number, ten: string) => `12 · DẠY HỌC/C${n} - ${ten}`
// Kho nhập ĐẢO thứ tự (như kho thật: chương 3 nhập 10, 8, 9) ⇒ cây phải sắp lại.
khoGia.ds = [
  to('DH-12-C3-B10', 'Bài 10. Protein và enzyme', 2, 1, c12(3, 'Hợp chất chứa N')),
  to('DH-12-C3-B8', 'Bài 8. Amine', 2, 1, c12(3, 'Hợp chất chứa N')),
  to('DH-12-C3-B9', 'Bài 9. Amino acid', 2, 1, c12(3, 'Hợp chất chứa N')),
  to('DH-12-C1-B2', 'Bài 2. Lipid', 2, 0, c12(1, 'Ester lipid')),
  to('DH-12-C1-B1', 'Bài 1. Ester', 2, 1, c12(1, 'Ester lipid')),
  to('DH-11-C2-B3', 'Bài 3. Ammonia', 2, 0, '11 · DẠY HỌC/C2 - Nitrogen'),
]
const BUOI = { id: 'BH-9', ten: 'Buổi học 05/10 · 12 - Tinh Hoa', lop: '12 - Tinh Hoa', moLuc: '2026-10-05T11:00:00Z', hetHan: '2026-10-06T11:00:00Z', dongLuc: null, dangMo: true }
const XEM = { ok: true, soCau: 60, soTuLuan: 0, hanNop: '2026-10-12', D: 7, luotCan: 120, sucChua: 200, duLuot: 20, tongEm: 30, duDiem8: 15, quaTai: [], theLucNgay: 40 }
const EM = [
  ...['T1', 'T2', 'T3'].map((sbd) => ({ sbd, hoTen: `Em ${sbd}`, khoi: '12', tenLop: '12 - Tinh Hoa' })),
  ...['L1', 'L2', 'L3', 'L4'].map((sbd) => ({ sbd, hoTen: `Em ${sbd}`, khoi: '12', tenLop: '12 - Lớp Thường' })),
  ...['N1', 'N2'].map((sbd) => ({ sbd, hoTen: `Em ${sbd}`, khoi: '12', tenLop: '12 - Nhóm 10 điểm' })),
  ...['K1', 'K2'].map((sbd) => ({ sbd, hoTen: `Em ${sbd}`, khoi: '11', tenLop: '11' })),
]
/** Bài đã tick theo lớp (khoá bài) + lớp mà `tick` bị máy chủ từ chối. */
let daTick: Record<string, string[]> = {}
let tickLoi: Set<string> = new Set()
const TEN_BAI: Record<string, [string, number]> = { 'DH-12-C1-B1': ['Bài 1. Ester', 1], 'DH-12-C1-B2': ['Bài 2. Lipid', 2], 'DH-12-C3-B8': ['Bài 8. Amine', 3] }
function mayChu() {
  goi.mockImplementation(async (duong: string, b: Record<string, unknown>) => {
    if (duong === '/gv/lop') return { ok: true, du: { ok: true, lop: LOP.map((l) => ({ ...l, sbd: [] })) } }
    if (duong === '/gv/buoi-hoc' && b.action === 'dang-mo') return { ok: true, du: { ok: true, buoi: [BUOI] } }
    if (duong === '/gv/buoi-hoc' && b.action === 'gan-day') return { ok: true, du: { ok: true, buoi: [] } }
    if (duong === '/gv/buoi-hoc') return { ok: true, du: { ok: true, buoi: BUOI, ma: '482915', doiMaLuc: 1, coMat: [], siSo: 28, lopEm: [] } }
    if (duong === '/gv/chien-dich' && b.action === 'ds-em') return { ok: true, du: { ok: true, em: EM } }
    if (duong === '/gv/omni' && b.action === 'co-doc') return { ok: true, du: { ok: true, co: { bat: true, lop: [], sbd: [] } } }
    if (duong === '/gv/bai-da-day' && b.action === 'danh-sach') {
      const khoa = daTick[String(b.lop)] ?? []
      return {
        ok: true,
        du: { ok: true, bai: khoa.map((k) => ({ khoaBai: k, tenBai: TEN_BAI[k]![0], viTri: TEN_BAI[k]![1], tickLuc: '2026-09-22T03:00:00Z', chienDichId: `cd-${k}`, trangThai: 'da_day', hanNop: '2026-09-29', conNgay: null, chungChi: { dat: 3, tong: 4 } })), choBaiMoi: null },
      }
    }
    if (duong === '/gv/bai-da-day' && b.action === 'xem-truoc') {
      const n = Array.isArray(b.sbd) ? b.sbd.length : 30
      return { ok: true, du: { ...XEM, soEmChon: n, tongEm: n } }
    }
    if (duong === '/gv/bai-da-day' && b.action === 'tick') {
      if (tickLoi.has(String(b.lop))) return { ok: false, loai: 'tu_choi', chu: 'Lớp này đang có ca kiểm tra mở.' }
      return { ok: true, du: { ok: true, chienDichId: `cd-${b.lop}`, hanNop: '2026-10-12', daCo: false } }
    }
    if (duong === '/gv/bai-da-day' && b.action === 'bo-tick') return { ok: true, du: { ok: true, chienDich: 'da_huy' } }
    return { ok: false, loai: 'chua_co_lenh', chu: 'lệnh lạ' }
  })
}
const lenh = (action: string) => goi.mock.calls.filter(([d, b]) => d === '/gv/bai-da-day' && b.action === action).map(([, b]) => b as Record<string, unknown>)

beforeEach(() => {
  goi.mockReset()
  daTick = { '12 - Lớp Thường': ['DH-12-C1-B1'], '12 - Tinh Hoa': ['DH-12-C1-B1', 'DH-12-C1-B2'] }
  tickLoi = new Set()
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
  await waitFor(() => expect(within(buoc).getByText('Bài 8. Amine')).toBeTruthy())
  return buoc
}
const dong = (buoc: HTMLElement, khoa: string) => buoc.querySelector(`[data-bai="${khoa}"]`) as HTMLElement
const moTam = (buoc: HTMLElement) => fireEvent.click(within(buoc).getByRole('button', { name: /Chọn lớp/ }))
const tichLop = async (ten: RegExp) => fireEvent.click(await screen.findByRole('checkbox', { name: ten }))
const chipLop = (buoc: HTMLElement) => [...within(buoc).getByRole('group', { name: 'Lớp đã chọn' }).querySelectorAll('[data-lop]')].map((e) => e.getAttribute('data-lop'))

describe('màn: ô chọn lớp xếp theo khối 10 · 11 · 12', () => {
  it('lớp của buổi đang mở chọn sẵn; tấm xổ xuống hiện đủ khối 10 · 11 · 12 với các lớp trong khối; "Chưa xếp lớp" không có', async () => {
    const buoc = await moBuoc()
    expect(chipLop(buoc)).toEqual(['12 - Tinh Hoa'])
    moTam(buoc)
    const tam = await screen.findByRole('dialog', { name: 'Chọn lớp nhận bài' })
    const khoi = [...tam.querySelectorAll('[role="tree"] > [role="treeitem"]')].map((li) => li.querySelector('b')?.textContent)
    expect(khoi).toEqual(['Khối 10', 'Khối 11', 'Khối 12'])
    const lop12 = [...(tam.querySelectorAll('[role="tree"] > [role="treeitem"]')[2] as HTMLElement).querySelectorAll('[role="group"] input[type="checkbox"]')].map((i) => i.getAttribute('aria-label'))
    expect(lop12).toEqual(['12 - Lớp Thường · 44 em', '12 - Nhóm 10 điểm · 20 em', '12 - Tinh Hoa · 28 em'])
    expect(tam.textContent).not.toContain('Chưa xếp lớp')
    expect((within(tam).getByRole('checkbox', { name: /^12 - Tinh Hoa/ }) as HTMLInputElement).checked).toBe(true)
    expect(within(tam).getByText(/1 \/ 3 lớp/)).toBeTruthy()
  })

  it('tick thêm lớp cùng khối ⇒ chọn NHIỀU lớp (thẻ + cây bài + danh-sach gọi từng lớp); bỏ lớp bằng ×', async () => {
    const buoc = await moBuoc()
    moTam(buoc)
    await tichLop(/^12 - Lớp Thường/)
    await tichLop(/^12 - Nhóm 10 điểm/)
    expect(chipLop(buoc)).toEqual(['12 - Lớp Thường', '12 - Nhóm 10 điểm', '12 - Tinh Hoa'])
    await waitFor(() => expect(new Set(lenh('danh-sach').map((x) => x.lop))).toEqual(new Set(['12 - Tinh Hoa', '12 - Lớp Thường', '12 - Nhóm 10 điểm'])))
    expect(buoc.textContent).toContain('3 lớp đang chọn')
    fireEvent.click(within(buoc).getByRole('button', { name: 'Bỏ 12 - Nhóm 10 điểm' }))
    expect(chipLop(buoc)).toEqual(['12 - Lớp Thường', '12 - Tinh Hoa'])
  })

  it('tick cả khối 12 ⇒ mọi lớp khối 12; tick lớp khối 11 ⇒ chọn lại từ đầu chỉ lớp ấy + dòng báo; cây đổi sang bài khối 11', async () => {
    const buoc = await moBuoc()
    moTam(buoc)
    fireEvent.click(await screen.findByRole('checkbox', { name: /^Khối 12 · 1\/3 lớp/ }))
    expect(chipLop(buoc)).toEqual(['12 - Lớp Thường', '12 - Nhóm 10 điểm', '12 - Tinh Hoa'])
    await tichLop(/^11 · 30 em/)
    expect(chipLop(buoc)).toEqual(['11'])
    expect(screen.getByText(/Đã chuyển sang Khối 11/)).toBeTruthy()
    await waitFor(() => expect(dong(buoc, 'DH-11-C2-B3')).toBeTruthy())
    expect(buoc.textContent).not.toContain('Bài 8. Amine')
  })
})

describe('màn: cây bài đúng thứ tự', () => {
  it('kho nhập chương 3 theo 10, 8, 9 và chương 1 sau chương 3 ⇒ cây hiện chương 1 trước, bài 1, 2, 8, 9, 10 tăng dần', async () => {
    const buoc = await moBuoc()
    expect([...buoc.querySelectorAll('[data-bai]')].map((e) => e.getAttribute('data-bai'))).toEqual(['DH-12-C1-B1', 'DH-12-C1-B2', 'DH-12-C3-B8', 'DH-12-C3-B9', 'DH-12-C3-B10'])
    expect([...buoc.querySelectorAll('.bhn-chuong-dau h3')].map((e) => e.textContent)).toEqual(['C1 - Ester lipid', 'C3 - Hợp chất chứa N'])
    expect(buoc.querySelector('.bhn-chuong-dem')?.textContent).toBe('2/2 bài đã giao') // lớp Tinh Hoa đã có Bài 1 và Bài 2
  })
})

describe('màn: giao Bài cho nhiều lớp', () => {
  it('thầy 06/10: lớp A đã giao Bài 8, lớp B chưa ⇒ Bài 1, 2 hiện "Đã dạy · 1/2 lớp" (chấm: lớp A đã dạy, lớp B chưa dạy); Bài 9, 10 vẫn "Chưa dạy"; bài chưa tick thật không có nút Sửa em / Bỏ tick', async () => {
    daTick = { '12 - Lớp Thường': ['DH-12-C3-B8'], '12 - Tinh Hoa': [] }
    const buoc = await moBuoc()
    moTam(buoc)
    await tichLop(/^12 - Lớp Thường/)
    await waitFor(() => expect(dong(buoc, 'DH-12-C1-B1').textContent).toContain('Đã dạy · 1/2 lớp'))
    expect(dong(buoc, 'DH-12-C1-B2').textContent).toContain('Đã dạy · 1/2 lớp')
    expect(dong(buoc, 'DH-12-C1-B1').getAttribute('data-trang-thai')).toBe('da_day')
    expect(dong(buoc, 'DH-12-C3-B9').textContent).toContain('Chưa dạy')
    const cham = [...dong(buoc, 'DH-12-C1-B1').querySelectorAll('.bhn-cham-ds li[data-lop]')].map((li) => [li.getAttribute('data-lop'), li.getAttribute('aria-label')])
    expect(cham).toEqual([
      ['12 - Lớp Thường', '12 - Lớp Thường: Đã dạy'],
      ['12 - Tinh Hoa', '12 - Tinh Hoa: Chưa dạy'],
    ])
    expect(within(dong(buoc, 'DH-12-C1-B1')).queryByRole('button', { name: /Sửa em \/ Bỏ tick theo lớp/ })).toBeNull()
    expect(within(dong(buoc, 'DH-12-C3-B8')).getByRole('button', { name: /Sửa em \/ Bỏ tick theo lớp/ })).toBeTruthy() // Bài 8 tick thật ở lớp Thường
  })

  it('chip bài gộp qua lớp ("Đã dạy · 2/3 lớp"), chấm từng lớp; chọn bài ⇒ xem-truoc TỪNG LỚP chưa có bài, sbd chia đúng lớp; "Giao Bài 8 cho 3 lớp" ⇒ 3 lệnh tick lần lượt cùng phamVi', async () => {
    const buoc = await moBuoc()
    moTam(buoc)
    await tichLop(/^12 - Lớp Thường/)
    await tichLop(/^12 - Nhóm 10 điểm/)
    await waitFor(() => expect(dong(buoc, 'DH-12-C1-B1').textContent).toContain('Đã dạy · 2/3 lớp'))
    expect(dong(buoc, 'DH-12-C1-B2').textContent).toContain('Đã dạy · 1/3 lớp')
    expect(dong(buoc, 'DH-12-C3-B8').textContent).toContain('Chưa dạy')
    const cham = [...dong(buoc, 'DH-12-C1-B1').querySelectorAll('.bhn-cham-ds li[data-lop]')].map((li) => [li.getAttribute('data-lop'), li.textContent, li.getAttribute('aria-label')])
    expect(cham).toEqual([
      ['12 - Lớp Thường', 'Lớp Thường · Đã dạy 22/09', '12 - Lớp Thường: Đã dạy 22/09 · chứng chỉ 3/4'],
      ['12 - Nhóm 10 điểm', 'Nhóm 10 điểm', '12 - Nhóm 10 điểm: Chưa dạy'], // lớp chưa dạy chỉ ghi tên (chấm xám), chữ đầy đủ ở aria-label
      ['12 - Tinh Hoa', 'Tinh Hoa · Đã dạy 22/09', '12 - Tinh Hoa: Đã dạy 22/09 · chứng chỉ 3/4'],
    ])
    // Bài chưa lớp nào dạy ⇒ không có hàng chấm theo lớp (chip "Chưa dạy" đã đủ), dòng gọn như một lớp.
    expect(dong(buoc, 'DH-12-C3-B8').querySelector('.bhn-cham-ds')).toBeNull()

    fireEvent.click(within(dong(buoc, 'DH-12-C3-B8')).getByRole('radio'))
    expect(dong(buoc, 'DH-12-C3-B8').textContent).toContain('Bài hôm nay')
    await waitFor(() => expect(lenh('xem-truoc').length).toBe(3))
    const xem = Object.fromEntries(lenh('xem-truoc').map((x) => [x.lop, x.sbd]))
    expect(xem).toEqual({ '12 - Lớp Thường': ['L1', 'L2', 'L3', 'L4'], '12 - Nhóm 10 điểm': ['N1', 'N2'], '12 - Tinh Hoa': ['T1', 'T2', 'T3'] })

    const the = buoc.querySelector('[data-khoi="xac-nhan-tick"]') as HTMLElement
    await waitFor(() => expect(the.querySelectorAll('.bhn-xem-lop')).toHaveLength(3))
    expect([...the.querySelectorAll('[data-khoi="giao-cho"] .bhn-lop-the')].map((e) => e.textContent)).toEqual(['12 - Lớp Thường · 4 em', '12 - Nhóm 10 điểm · 2 em', '12 - Tinh Hoa · 3 em'])
    fireEvent.click(within(the).getByRole('button', { name: 'Giao Bài 8 cho 3 lớp' }))
    await waitFor(() => expect(lenh('tick')).toHaveLength(3))
    expect(lenh('tick').map((x) => x.lop)).toEqual(['12 - Lớp Thường', '12 - Nhóm 10 điểm', '12 - Tinh Hoa'])
    const phamVi = [
      { khoaBai: 'DH-12-C1-B1', tenBai: 'Bài 1. Ester', viTri: 1, maDe: ['DH-12-C1-B1-TN', 'DH-12-C1-B1-DS'] },
      { khoaBai: 'DH-12-C1-B2', tenBai: 'Bài 2. Lipid', viTri: 2, maDe: ['DH-12-C1-B2'] },
    ]
    expect(lenh('tick')[2]).toEqual({
      action: 'tick',
      lop: '12 - Tinh Hoa',
      khoaBai: 'DH-12-C3-B8',
      tenBai: 'Bài 8. Amine',
      viTri: 3,
      maDe: ['DH-12-C3-B8-TN', 'DH-12-C3-B8-DS'],
      sbd: ['T1', 'T2', 'T3'],
      phamVi,
    })
    for (const x of lenh('tick')) expect(x.phamVi).toEqual(phamVi)
    // Giao xong: nạp lại trạng thái MỌI lớp, thẻ xác nhận đóng.
    await waitFor(() => expect(document.querySelector('[data-khoi="xac-nhan-tick"]')).toBeNull())
  })

  it('lớp ĐÃ có bài thì bị bỏ qua (không xem-truoc, không tick) và được ghi rõ; bài có ở MỌI lớp đã chọn ⇒ không chọn được', async () => {
    const buoc = await moBuoc()
    moTam(buoc)
    await tichLop(/^12 - Lớp Thường/)
    await waitFor(() => expect(dong(buoc, 'DH-12-C1-B2').textContent).toContain('Đã dạy · 1/2 lớp'))
    fireEvent.click(within(dong(buoc, 'DH-12-C1-B2')).getByRole('radio')) // Lớp Thường chưa có Bài 2, Tinh Hoa đã có
    const the = buoc.querySelector('[data-khoi="xac-nhan-tick"]') as HTMLElement
    await waitFor(() => expect(lenh('xem-truoc').map((x) => x.lop)).toEqual(['12 - Lớp Thường']))
    expect(the.querySelector('[data-khoi="lop-da-co"]')?.textContent).toContain('12 - Tinh Hoa')
    expect(within(the).getByRole('button', { name: 'Giao Bài 2 cho 12 - Lớp Thường' })).toBeTruthy()
    // Bài 1 có ở cả hai lớp ⇒ radio khoá.
    expect((within(dong(buoc, 'DH-12-C1-B1')).getByRole('radio') as HTMLInputElement).disabled).toBe(true)
  })

  it('một lớp bị máy chủ từ chối ⇒ các lớp khác VẪN giao; thẻ xác nhận giữ lại, lời lỗi ghi tên lớp; giao lại chỉ còn lớp lỗi', async () => {
    tickLoi = new Set(['12 - Nhóm 10 điểm'])
    const buoc = await moBuoc()
    moTam(buoc)
    await tichLop(/^12 - Nhóm 10 điểm/)
    fireEvent.click(within(dong(buoc, 'DH-12-C3-B8')).getByRole('radio'))
    const the = buoc.querySelector('[data-khoi="xac-nhan-tick"]') as HTMLElement
    await waitFor(() => expect(lenh('xem-truoc')).toHaveLength(2))
    // Mô phỏng máy chủ đã nhận Tinh Hoa: lần nạp lại danh-sach sau giao thấy Bài 8 ở Tinh Hoa (lớp lỗi vẫn chưa có).
    const goc = goi.getMockImplementation()!
    goi.mockImplementation(async (duong: string, b: Record<string, unknown>) => {
      if (duong === '/gv/bai-da-day' && b.action === 'tick' && b.lop === '12 - Tinh Hoa') daTick['12 - Tinh Hoa'] = ['DH-12-C1-B1', 'DH-12-C1-B2', 'DH-12-C3-B8']
      return goc(duong, b)
    })
    fireEvent.click(within(the).getByRole('button', { name: 'Giao Bài 8 cho 2 lớp' }))
    await waitFor(() => expect(lenh('tick')).toHaveLength(2))
    expect(await screen.findByText('12 - Nhóm 10 điểm: Lớp này đang có ca kiểm tra mở.')).toBeTruthy()
    expect(document.querySelector('[data-khoi="xac-nhan-tick"]')).toBeTruthy()
    // Lớp đã giao xong (Tinh Hoa) được nạp lại và tự rời danh sách giao; còn đúng lớp lỗi.
    await waitFor(() => expect([...document.querySelectorAll('[data-khoi="giao-cho"] .bhn-lop-the')].map((e) => e.getAttribute('data-lop'))).toEqual(['12 - Nhóm 10 điểm']))
    expect(within(document.querySelector('[data-khoi="xac-nhan-tick"]') as HTMLElement).getByRole('button', { name: 'Giao Bài 8 cho 12 - Nhóm 10 điểm' })).toBeTruthy()
  })

  it('"Bỏ tick" theo lớp trong "Sửa em / Bỏ tick theo lớp": gọi bo-tick đúng lớp + khoá bài', async () => {
    const buoc = await moBuoc()
    moTam(buoc)
    await tichLop(/^12 - Lớp Thường/)
    await waitFor(() => expect(dong(buoc, 'DH-12-C1-B1').textContent).toContain('Đã dạy · 2/2 lớp'))
    fireEvent.click(within(dong(buoc, 'DH-12-C1-B1')).getByText('Sửa em / Bỏ tick theo lớp'))
    fireEvent.click(within(dong(buoc, 'DH-12-C1-B1')).getByRole('button', { name: 'Bỏ tick · 12 - Lớp Thường' }))
    const hop = await screen.findByRole('alertdialog')
    expect(hop.textContent).toContain('lớp 12 - Lớp Thường')
    fireEvent.click(within(hop).getByRole('button', { name: 'Bỏ tick' }))
    await waitFor(() => expect(lenh('bo-tick')).toEqual([{ action: 'bo-tick', lop: '12 - Lớp Thường', khoaBai: 'DH-12-C1-B1' }]))
  })
})

describe('bố cục máy tính / xoay ngang (thầy 06/10: "làm cho màn hình xoay ngang và máy tính nữa")', () => {
  it('cột phải (aside) chứa ô chờ chọn bài, chọn bài xong thì chứa thẻ xác nhận', async () => {
    const buoc = await moBuoc()
    const aside = buoc.querySelector('aside[data-khoi="bai-hom-nay-the"]') as HTMLElement
    expect(aside.querySelector('[data-khoi="cho-chon-bai"]')).toBeTruthy()
    expect(aside.querySelector('[data-khoi="xac-nhan-tick"]')).toBeNull()
    fireEvent.click(within(dong(buoc, 'DH-12-C3-B8')).getByRole('radio'))
    await waitFor(() => expect(aside.querySelector('[data-khoi="xac-nhan-tick"]')).toBeTruthy())
    expect(aside.querySelector('[data-khoi="cho-chon-bai"]')).toBeNull()
  })

  it('xếp dọc: chọn bài ⇒ cuộn MƯỢT tới đầu thẻ xác nhận (nằm dưới cây); thẻ đã thấy sẵn (hai cột, dính) ⇒ không cuộn; giảm chuyển động ⇒ cuộn tức thì; mỗi bài một lần', async () => {
    const cuon = vi.fn()
    const gocCuon = (Element.prototype as { scrollIntoView?: unknown }).scrollIntoView
    const gocMedia = window.matchMedia
    ;(Element.prototype as { scrollIntoView?: unknown }).scrollIntoView = cuon
    let top = 2000
    const rect = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      return { top: this.getAttribute('data-khoi') === 'xac-nhan-tick' ? top : 0, bottom: 0, left: 0, right: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) } as DOMRect
    })
    try {
      const buoc = await moBuoc()
      fireEvent.click(within(dong(buoc, 'DH-12-C3-B8')).getByRole('radio'))
      await waitFor(() => expect(cuon).toHaveBeenCalledTimes(1))
      expect(cuon).toHaveBeenLastCalledWith({ behavior: 'smooth', block: 'start' })
      // Thẻ đã nằm trong tầm nhìn (cột phải dính) ⇒ chọn bài khác không cuộn.
      cuon.mockClear()
      top = 100
      fireEvent.click(within(dong(buoc, 'DH-12-C3-B9')).getByRole('radio'))
      await waitFor(() => expect(buoc.querySelector('[data-khoi="xac-nhan-tick"]')?.textContent).toContain('Bài 9. Amino acid'))
      expect(cuon).not.toHaveBeenCalled()
      // Giảm chuyển động ⇒ cuộn tức thì.
      window.matchMedia = ((q: string) => ({ matches: /reduce/.test(q), media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia
      top = 2000
      fireEvent.click(within(dong(buoc, 'DH-12-C3-B10')).getByRole('radio'))
      await waitFor(() => expect(cuon).toHaveBeenCalledTimes(1))
      expect(cuon).toHaveBeenLastCalledWith({ behavior: 'auto', block: 'start' })
    } finally {
      rect.mockRestore()
      window.matchMedia = gocMedia
      if (gocCuon) (Element.prototype as { scrollIntoView?: unknown }).scrollIntoView = gocCuon
      else delete (Element.prototype as { scrollIntoView?: unknown }).scrollIntoView
    }
  })

  it('kiểu dáng: khung chứa của container query là .bhn-ngoai (container query KHÔNG đổi kiểu chính khung chứa ⇒ lưới hai cột đặt ở .bhn-khung con); có ngưỡng hai cột và gọn khi nằm ngang thấp', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/components/day-hoc/bai-hom-nay.css'), 'utf8')
    const khoi = (sel: string) => css.match(new RegExp(`${sel.replace('.', '\\.')}\\s*\\{([^}]*)\\}`))?.[1] ?? ''
    expect(khoi('.bhn-ngoai')).toMatch(/container:\s*bhn\s*\/\s*inline-size/)
    expect(khoi('.bhn-khung')).not.toMatch(/container/)
    expect(css).toMatch(/@container bhn \(min-width: 760px\)/)
    expect(css).toMatch(/@container bhn \(min-width: 920px\)/)
    expect(css).toMatch(/@media \(orientation: landscape\) and \(max-height: 520px\)/)
    expect(css).toMatch(/position:\s*sticky/)
  })
})
