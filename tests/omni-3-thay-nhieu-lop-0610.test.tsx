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
// Hộp nạp lười nhiều lớp (kho, buổi, cờ OMNI, danh sách bài) — cho mỗi test đủ thời gian khi chạy chung nhiều tệp.
vi.setConfig({ testTimeout: 20000 })

import { hienHanNop } from '../src/components/chien-dich/ngay'
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

// SỬA CÓ CHỦ ĐÍCH 09/11 (thầy duyệt docs/ban-ve-giao-bai-0911: «bỏ hết màn phân bài bên trong»): bước «Bài hôm nay» rời bảng Dạy học — chọn lớp / cây bài /
// giao nhiều lớp nay kiểm trên hộp «Giao bài» (HopBoSungBai: ô tick, chọn nhiều bài; bài kế tiếp tick sẵn; bài đã giao ở MỌI lớp đang chọn gọn một dòng;
// bài mới có ở một phần lớp ghi «<lớp> đã có · còn <lớp>»). Chip gộp «Đã dạy · k/n lớp» + chấm theo lớp là của cây bước cũ (đã bỏ).
async function moHop() {
  const { default: HopBoSungBai } = await import('../src/components/day-hoc/HopBoSungBai')
  render(<HopBoSungBai onDong={() => {}} />)
  const hop = screen.getByRole('dialog', { name: 'Giao bài' })
  await within(hop).findByText('Bài 8. Amine', {}, { timeout: 4000 })
  return hop
}
const dongHop = (hop: HTMLElement, ten: string) => [...hop.querySelectorAll('.cbm-ten b')].find((b) => b.textContent === ten)?.closest('li') as HTMLElement
const oTick = (hop: HTMLElement, ten: RegExp) => within(hop).queryByRole('checkbox', { name: ten }) as HTMLInputElement | null
const nutGiao = (hop: HTMLElement) => within(hop).getByRole('button', { name: /^Giao \d+ bài cho / }) as HTMLButtonElement
const moTam = (hop: HTMLElement) => fireEvent.click(within(hop).getByRole('button', { name: /Chọn lớp/ }))
const tichLop = async (ten: RegExp) => fireEvent.click(await screen.findByRole('checkbox', { name: ten }))
const chipLop = (hop: HTMLElement) => [...within(hop).getByRole('group', { name: 'Lớp đã chọn' }).querySelectorAll('[data-lop]')].map((e) => e.getAttribute('data-lop'))
/** Lượt xem trước MỚI NHẤT của từng lớp cho một bài (bài gợi ý tick sẵn ⇒ lớp đầu đã có lượt xem trước sớm hơn). */
const xemCuoi = (khoaBai: string) => Object.fromEntries(lenh('xem-truoc').filter((x) => x.khoaBai === khoaBai).map((x) => [x.lop, x]))

describe('màn: ô chọn lớp xếp theo khối 10 · 11 · 12 (hộp Giao bài)', () => {
  it('lớp của buổi đang mở chọn sẵn; tấm xổ xuống hiện đủ khối 10 · 11 · 12 với các lớp trong khối; "Chưa xếp lớp" không có', async () => {
    const hop = await moHop()
    expect(chipLop(hop)).toEqual(['12 - Tinh Hoa'])
    moTam(hop)
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
    const hop = await moHop()
    moTam(hop)
    await tichLop(/^12 - Lớp Thường/)
    await tichLop(/^12 - Nhóm 10 điểm/)
    expect(chipLop(hop)).toEqual(['12 - Lớp Thường', '12 - Nhóm 10 điểm', '12 - Tinh Hoa'])
    await waitFor(() => expect(new Set(lenh('danh-sach').map((x) => x.lop))).toEqual(new Set(['12 - Tinh Hoa', '12 - Lớp Thường', '12 - Nhóm 10 điểm'])))
    // SỬA CÓ CHỦ ĐÍCH 09/11: chữ «3 lớp đang chọn» của bước cũ ⇒ hộp ghi số lớp ở dòng đầu danh sách bài.
    await waitFor(() => expect(hop.querySelector('.cbm-goi-y')?.textContent).toContain('3 lớp'))
    fireEvent.click(within(hop).getByRole('button', { name: 'Bỏ 12 - Nhóm 10 điểm' }))
    expect(chipLop(hop)).toEqual(['12 - Lớp Thường', '12 - Tinh Hoa'])
  })

  it('tick cả khối 12 ⇒ mọi lớp khối 12; tick lớp khối 11 ⇒ chọn lại từ đầu chỉ lớp ấy + dòng báo; cây đổi sang bài khối 11', async () => {
    const hop = await moHop()
    moTam(hop)
    fireEvent.click(await screen.findByRole('checkbox', { name: /^Khối 12 · 1\/3 lớp/ }))
    expect(chipLop(hop)).toEqual(['12 - Lớp Thường', '12 - Nhóm 10 điểm', '12 - Tinh Hoa'])
    await tichLop(/^11 · 30 em/)
    expect(chipLop(hop)).toEqual(['11'])
    expect(screen.getByText(/Đã chuyển sang Khối 11/)).toBeTruthy()
    await within(hop).findByRole('checkbox', { name: /Bài 3\. Ammonia/ }, { timeout: 4000 })
    expect(hop.textContent).not.toContain('Bài 8. Amine')
  })
})

describe('màn: cây bài đúng thứ tự (hộp Giao bài)', () => {
  it('kho nhập chương 3 theo 10, 8, 9 và chương 1 sau chương 3 ⇒ cây hiện chương 1 trước, bài 1, 2, 8, 9, 10 tăng dần', async () => {
    const hop = await moHop()
    // Lớp Tinh Hoa đã có Bài 1 và Bài 2 ⇒ chương 1 đã giao hết, gộp một dòng; bấm hiện lại rồi mở chương.
    fireEvent.click(within(hop).getByRole('button', { name: 'Hiện 1 chương đã giao hết (C1 - Ester lipid)' }))
    expect([...hop.querySelectorAll('.cbm-chuong-ten')].map((e) => e.textContent)).toEqual(['C1 - Ester lipid', 'C3 - Hợp chất chứa N'])
    const c1 = within(hop).getByRole('button', { name: /^C1 - Ester lipid/ })
    expect(c1.textContent).toContain('Đã giao hết')
    fireEvent.click(c1)
    expect([...hop.querySelectorAll('.cbm-ten b')].map((e) => e.textContent)).toEqual(['Bài 1. Ester', 'Bài 2. Lipid', 'Bài 8. Amine', 'Bài 9. Amino acid', 'Bài 10. Protein và enzyme'])
    expect(within(hop).getByRole('button', { name: /^C3 - Hợp chất chứa N/ }).textContent).toContain('0/3 bài đã giao')
  })
})

describe('màn: giao bài cho nhiều lớp (hộp Giao bài)', () => {
  it('thầy 06/10: lớp A đã giao Bài 8, lớp B chưa ⇒ dòng Bài 8 ghi rõ lớp nào đã có, lớp nào còn; vẫn chọn được; bài chưa tick thật ở mọi lớp không có «Gỡ bài»', async () => {
    daTick = { '12 - Lớp Thường': ['DH-12-C3-B8'], '12 - Tinh Hoa': [] }
    const hop = await moHop()
    moTam(hop)
    await tichLop(/^12 - Lớp Thường/)
    await waitFor(() => expect(dongHop(hop, 'Bài 8. Amine').textContent).toContain('12 - Lớp Thường đã có · còn 12 - Tinh Hoa'))
    expect(oTick(hop, /Bài 8\. Amine/)!.disabled).toBe(false)
    // Bài 1, 2 đứng trước Bài 8 nhưng lớp Tinh Hoa chưa dạy gì ⇒ không phải «bài cũ» của cả hai lớp.
    expect(dongHop(hop, 'Bài 1. Ester').textContent).not.toContain('bài cũ')
    expect(dongHop(hop, 'Bài 9. Amino acid').textContent).not.toContain('đã có')
    for (const ten of ['Bài 1. Ester', 'Bài 8. Amine', 'Bài 9. Amino acid']) expect(within(dongHop(hop, ten)).queryByRole('button', { name: 'Gỡ bài' })).toBeNull()
  })

  it('chọn bài ⇒ xem-truoc TỪNG LỚP chưa có bài, sbd chia đúng lớp; «Giao 1 bài cho 3 lớp» ⇒ 3 lệnh tick lần lượt cùng phamVi, hạn tự tính, không theLucNgay', async () => {
    const hop = await moHop()
    moTam(hop)
    await tichLop(/^12 - Lớp Thường/)
    await tichLop(/^12 - Nhóm 10 điểm/)
    await waitFor(() => expect(dongHop(hop, 'Bài 1. Ester').textContent).toContain('12 - Lớp Thường, 12 - Tinh Hoa đã có · còn 12 - Nhóm 10 điểm'))
    expect(dongHop(hop, 'Bài 2. Lipid').textContent).toContain('12 - Tinh Hoa đã có · còn 12 - Lớp Thường, 12 - Nhóm 10 điểm')
    // Bài 8 = bài gợi ý (sau bài đã giao xa nhất) ⇒ tick sẵn.
    expect(oTick(hop, /Bài 8\. Amine/)!.checked).toBe(true)
    expect(dongHop(hop, 'Bài 8. Amine').textContent).not.toContain('đã có')

    await waitFor(() => expect(Object.keys(xemCuoi('DH-12-C3-B8')).sort()).toEqual(['12 - Lớp Thường', '12 - Nhóm 10 điểm', '12 - Tinh Hoa']))
    await waitFor(() => expect(Object.fromEntries(Object.entries(xemCuoi('DH-12-C3-B8')).map(([l, x]) => [l, x.sbd]))).toEqual({ '12 - Lớp Thường': ['L1', 'L2', 'L3', 'L4'], '12 - Nhóm 10 điểm': ['N1', 'N2'], '12 - Tinh Hoa': ['T1', 'T2', 'T3'] }))
    const nut = await within(hop).findByRole('button', { name: 'Giao 1 bài cho 3 lớp · 9 em' }, { timeout: 4000 })
    await waitFor(() => expect((nut as HTMLButtonElement).disabled).toBe(false))
    fireEvent.click(nut)
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
      hanNop: '2026-10-12',
      sbd: ['T1', 'T2', 'T3'],
      phamVi,
    })
    for (const x of lenh('tick')) expect(x.phamVi).toEqual(phamVi)
    // Giao xong: dòng xong nêu đủ lớp; bài vừa giao rời danh sách chọn.
    await waitFor(() => expect(hop.textContent).toContain('Đã giao Bài 8 cho 9 em 3 lớp (12 - Lớp Thường, 12 - Nhóm 10 điểm, 12 - Tinh Hoa)'))
    expect(oTick(hop, /Bài 8\. Amine/)!.checked).toBe(false)
  })

  it('nhiều lớp ⇒ mỗi lớp một hạn chung riêng: «Không giao cho vài em…» liệt kê hạn từng lớp; tick mỗi lớp gửi đúng hạn chung của lớp ấy', async () => {
    const HAN: Record<string, { T: number; han: string }> = { '12 - Lớp Thường': { T: 12, han: '2026-10-17' }, '12 - Tinh Hoa': { T: 9, han: '2026-10-14' } }
    const goc = goi.getMockImplementation()!
    goi.mockImplementation(async (duong: string, b: Record<string, unknown>) => {
      const r = (await goc(duong, b)) as { ok: boolean; du: Record<string, unknown> }
      if (duong !== '/gv/bai-da-day' || b.action !== 'xem-truoc') return r
      const h = HAN[String(b.lop)]!
      return { ...r, du: { ...r.du, hanChung: { M: 1, T: h.T, han: h.han, duKienXong: 2, tongEm: 3 }, doChuan: { dungO: 28, M: 1, thieuDS: 0 } } }
    })
    const hop = await moHop()
    moTam(hop)
    await tichLop(/^12 - Lớp Thường/)
    await waitFor(() => expect(Object.keys(xemCuoi('DH-12-C3-B8')).sort()).toEqual(['12 - Lớp Thường', '12 - Tinh Hoa']))
    const nut = await within(hop).findByRole('button', { name: 'Giao 1 bài cho 2 lớp · 7 em' }, { timeout: 4000 })
    await waitFor(() => expect((nut as HTMLButtonElement).disabled).toBe(false))
    // Ô «Hạn chung cả lớp» hiện số ngày của lớp đầu; từng lớp liệt kê ở «Không giao cho vài em…».
    expect(hop.querySelectorAll('.cbm-o-so')[2]!.querySelector('b')!.textContent).toBe('12 ngày')
    fireEvent.click(within(hop).getByRole('button', { name: /^Không giao cho vài em…/ }))
    const ct = hop.querySelector('.cbm-ct') as HTMLElement
    expect([...ct.querySelectorAll('p[data-lop]')].map((p) => p.textContent)).toEqual([
      `Lớp 12 - Lớp Thường: hạn chung 12 ngày · hết ${hienHanNop('2026-10-17', false)}`,
      `Lớp 12 - Tinh Hoa: hạn chung 9 ngày · hết ${hienHanNop('2026-10-14', false)}`,
    ])
    fireEvent.click(nut)
    await waitFor(() => expect(lenh('tick')).toHaveLength(2))
    expect(Object.fromEntries(lenh('tick').map((x) => [x.lop, x.hanNop]))).toEqual({ '12 - Lớp Thường': '2026-10-17', '12 - Tinh Hoa': '2026-10-14' })
    for (const x of lenh('tick')) expect('theLucNgay' in x).toBe(false)
  })

  it('lớp ĐÃ có bài thì bị bỏ qua (không xem-truoc, không tick) và được ghi rõ; bài có ở MỌI lớp đã chọn ⇒ không chọn được', async () => {
    const hop = await moHop()
    moTam(hop)
    await tichLop(/^12 - Lớp Thường/)
    await waitFor(() => expect(dongHop(hop, 'Bài 2. Lipid').textContent).toContain('12 - Tinh Hoa đã có · còn 12 - Lớp Thường'))
    // Bỏ bài gợi ý (Bài 8) rồi chọn Bài 2: Lớp Thường chưa có, Tinh Hoa đã có.
    fireEvent.click(oTick(hop, /Bài 8\. Amine/)!)
    fireEvent.click(oTick(hop, /Bài 2\. Lipid/)!)
    await waitFor(() => expect(Object.keys(xemCuoi('DH-12-C1-B2'))).toEqual(['12 - Lớp Thường']))
    await new Promise((r) => setTimeout(r, 400)) // quá nhịp chờ gõ — Tinh Hoa vẫn không được hỏi
    expect(Object.keys(xemCuoi('DH-12-C1-B2'))).toEqual(['12 - Lớp Thường'])
    // Nút Giao đếm đúng số em sẽ nhận (chỉ lớp Thường, 4 em).
    const nut = await within(hop).findByRole('button', { name: /^Giao 1 bài cho .* · 4 em$/ }, { timeout: 4000 })
    await waitFor(() => expect((nut as HTMLButtonElement).disabled).toBe(false))
    fireEvent.click(nut)
    await waitFor(() => expect(lenh('tick')).toHaveLength(1))
    expect(lenh('tick')[0]).toMatchObject({ lop: '12 - Lớp Thường', khoaBai: 'DH-12-C1-B2' })
    // Bài 1 có ở cả hai lớp ⇒ gọn một dòng đã giao, không ô tick.
    expect(oTick(hop, /Bài 1\. Ester/)).toBeNull()
    expect(within(dongHop(hop, 'Bài 1. Ester')).getByRole('button', { name: 'Gỡ bài' })).toBeTruthy()
  })

  it('một lớp bị máy chủ từ chối ⇒ các lớp khác VẪN giao; lời lỗi ghi tên lớp; bài còn chọn, giao lại chỉ còn lớp lỗi', async () => {
    tickLoi = new Set(['12 - Nhóm 10 điểm'])
    const hop = await moHop()
    moTam(hop)
    await tichLop(/^12 - Nhóm 10 điểm/)
    await waitFor(() => expect(Object.keys(xemCuoi('DH-12-C3-B8')).sort()).toEqual(['12 - Nhóm 10 điểm', '12 - Tinh Hoa']))
    // Mô phỏng máy chủ đã nhận Tinh Hoa: lần nạp lại danh-sach sau giao thấy Bài 8 ở Tinh Hoa (lớp lỗi vẫn chưa có).
    const goc = goi.getMockImplementation()!
    goi.mockImplementation(async (duong: string, b: Record<string, unknown>) => {
      if (duong === '/gv/bai-da-day' && b.action === 'tick' && b.lop === '12 - Tinh Hoa') daTick['12 - Tinh Hoa'] = ['DH-12-C1-B1', 'DH-12-C1-B2', 'DH-12-C3-B8']
      return goc(duong, b)
    })
    const nut = await within(hop).findByRole('button', { name: /^Giao 1 bài cho 2 lớp/ }, { timeout: 4000 })
    await waitFor(() => expect((nut as HTMLButtonElement).disabled).toBe(false))
    fireEvent.click(nut)
    await waitFor(() => expect(lenh('tick')).toHaveLength(2))
    await new Promise((r) => setTimeout(r, 500)); console.log('GOLOI', hop.querySelector('[data-khoi="tom-tat-giao"]')?.textContent, '|ALERT|', [...hop.querySelectorAll('[role="alert"]')].map((x) => x.textContent))
    expect(await within(hop).findByText(/12 - Nhóm 10 điểm: Lớp này đang có ca kiểm tra mở\./, {}, { timeout: 4000 })).toBeTruthy()
    // Lớp đã giao xong (Tinh Hoa) được nạp lại; bài vẫn đang chọn cho lớp lỗi.
    await waitFor(() => expect(dongHop(hop, 'Bài 8. Amine').textContent).toContain('12 - Tinh Hoa đã có · còn 12 - Nhóm 10 điểm'))
    expect(oTick(hop, /Bài 8\. Amine/)!.checked).toBe(true)
    tickLoi = new Set()
    await waitFor(() => expect(nutGiao(hop).disabled).toBe(false))
    fireEvent.click(nutGiao(hop))
    await waitFor(() => expect(lenh('tick')).toHaveLength(3))
    expect(lenh('tick')[2]).toMatchObject({ lop: '12 - Nhóm 10 điểm', khoaBai: 'DH-12-C3-B8' })
  })

  it('«Gỡ bài» ở bài có ở nhiều lớp: hỏi lại TỪNG lớp; gọi bo-tick đúng lớp + khoá bài, «Giữ bài» ở lớp sau thì lớp ấy giữ', async () => {
    const hop = await moHop()
    moTam(hop)
    await tichLop(/^12 - Lớp Thường/)
    await waitFor(() => expect(oTick(hop, /Bài 1\. Ester/)).toBeNull()) // Bài 1 có ở cả hai lớp ⇒ dòng đã giao
    fireEvent.click(within(dongHop(hop, 'Bài 1. Ester')).getByRole('button', { name: 'Gỡ bài' }))
    let hoi = await screen.findByRole('alertdialog')
    expect(hoi.textContent).toContain('lớp 12 - Lớp Thường')
    fireEvent.click(within(hoi).getByRole('button', { name: 'Bỏ tick' }))
    await waitFor(() => expect(lenh('bo-tick')).toEqual([{ action: 'bo-tick', lop: '12 - Lớp Thường', khoaBai: 'DH-12-C1-B1' }]))
    hoi = await screen.findByRole('alertdialog')
    expect(hoi.textContent).toContain('lớp 12 - Tinh Hoa')
    fireEvent.click(within(hoi).getByRole('button', { name: 'Giữ bài' }))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
    expect(lenh('bo-tick')).toHaveLength(1)
  })
})

describe('bố cục máy tính / xoay ngang (thầy 06/10: "làm cho màn hình xoay ngang và máy tính nữa")', () => {
  // Bỏ theo thầy 09/11 (docs/ban-ve-giao-bai-0911): test «cột phải (aside) chứa ô chờ chọn bài, chọn bài xong thì chứa thẻ xác nhận» và «xếp dọc: chọn bài ⇒
  // cuộn MƯỢT tới đầu thẻ xác nhận…» — bố cục hai cột + thẻ xác nhận là của bước «Bài hôm nay» trong bảng Dạy học, đã bỏ (hộp Giao bài có thanh tóm tắt riêng).

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
