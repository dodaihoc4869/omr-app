// OMNI 3 · C1 — HAI THƯ MỤC MỤC ĐÍCH CỦA KHO (thầy chốt 05/10): cây chọn đề "DẠY HỌC" + "TU LUYỆN" ở Mở ca kiểm tra và Giao chiến dịch
// (vẫn chọn được MỌI tờ, `dungCay` cũ không đổi) + đồng bộ thư mục lên máy chủ `/kho/thu-muc` tối đa 1 lần/ngày, lô ≤ 400 mã.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, within } from '@testing-library/react'
import type { TeacherExamSource } from '../src/data/examContent'

const { goi } = vi.hoisted(() => ({ goi: vi.fn() }))
vi.mock('../src/lib/goi-lenh-thay', () => ({ goiLenh: (duong: string, body: Record<string, unknown>) => goi(duong, body) }))

import { dungCay, type Nut } from '../src/lib/cay-chon-de'
import { chiaLo, dsThuMucKho, dungCayTheoMucDich, KHOA_THU_MUC_TU_LUYEN, laDayHocMucDich, LO_THU_MUC, TEN_THU_MUC_TU_LUYEN } from '../src/lib/cay-muc-dich'
import { dongBoThuMucKho, KHOA_NGAY_THU_MUC } from '../src/lib/dong-bo-thu-muc'
import HopChonDe from '../src/components/HopChonDe'

const de = (maDe: string, nhom: string, nguon = maDe, n = 1): TeacherExamSource =>
  ({ maDe, nhom, nguon, phanI: Array.from({ length: n }, (_, i) => ({ id: `${maDe}-I-${i + 1}`, text: `${maDe} câu ${i + 1}` })), phanII: [], phanIII: [] }) as unknown as TeacherExamSource

const KHO = [
  de('12-C1-B1', '12 · C1 - Ester lipid', 'Bài 1. Ester', 3),
  de('DH-12-C1-B1-TN', '12 · DẠY HỌC/C1 - Ester lipid', 'Bài 1. Ester', 2),
  de('BD-12-01', '12 · BỘ ĐỀ/Đề thi thử', 'Đề số 1', 4),
  de('DH-11-C2-B3', '11 · C2 - Nitrogen', 'Bài 3. Ammonia', 2), // mã DH- mà nhóm chưa ghi thư mục ⇒ vẫn là DẠY HỌC
  de('11-C2-B3', '11 · C2 - Nitrogen', 'Bài 3. Ammonia', 5),
]

const tatCaKhoa = (cay: Nut[]): string[] => cay.flatMap((n) => [n.khoa, ...tatCaKhoa(n.con)])

beforeEach(() => {
  goi.mockReset()
  localStorage.clear()
})
afterEach(cleanup)

describe('dungCayTheoMucDich (thuần)', () => {
  it('hai nút ngoài cùng: DẠY HỌC rồi TU LUYỆN; mọi nhánh không phải DẠY HỌC nằm dưới TU LUYỆN, đủ mọi tờ, khoá không trùng', () => {
    const cay = dungCayTheoMucDich(KHO)
    expect(cay.map((n) => `${n.tang}:${n.nhan}`)).toEqual(['thumuc:DẠY HỌC', `thumuc:${TEN_THU_MUC_TU_LUYEN}`])
    const [dh, tl] = cay
    expect(new Set(dh!.laMa)).toEqual(new Set(['DH-12-C1-B1-TN', 'DH-11-C2-B3']))
    expect(new Set(tl!.laMa)).toEqual(new Set(['12-C1-B1', 'BD-12-01', '11-C2-B3']))
    // TU LUYỆN giữ nguyên cây con của `dungCay` (thư mục khác ▸ khối…), chỉ thêm tiền tố khoá.
    expect(tl!.con.map((n) => `${n.tang}:${n.nhan}`)).toEqual(dungCay(KHO.filter((s) => !laDayHocMucDich(s))).map((n) => `${n.tang}:${n.nhan}`))
    expect(tl!.con.every((n) => n.khoa.startsWith(`${KHOA_THU_MUC_TU_LUYEN}/`))).toBe(true)
    // Đủ mọi tờ, tổng câu cộng đúng.
    expect(cay.flatMap((n) => n.laMa).sort()).toEqual(KHO.map((s) => s.maDe).sort())
    expect(tl!.soCau.I).toBe(3 + 4 + 5)
    const khoa = tatCaKhoa(cay)
    expect(new Set(khoa).size).toBe(khoa.length)
    // Mã DH- chưa ghi thư mục: vào DẠY HỌC đúng khối 11.
    expect(dh!.con.map((n) => n.nhan)).toEqual(['Khối 11', 'Khối 12'])
  })

  it('giữ cấu trúc `dungCay`; nhánh rỗng thì không sinh nút', () => {
    expect(dungCay(KHO).map((n) => n.nhan)).toEqual(['Khối 11', 'Khối 12', 'DẠY HỌC', 'BỘ ĐỀ'])
    expect(dungCayTheoMucDich(KHO.filter((s) => !laDayHocMucDich(s))).map((n) => n.nhan)).toEqual([TEN_THU_MUC_TU_LUYEN])
    expect(dungCayTheoMucDich(KHO.filter(laDayHocMucDich)).map((n) => n.nhan)).toEqual(['DẠY HỌC'])
    expect(dungCayTheoMucDich([])).toEqual([])
  })

  it('dsThuMucKho: DAY_HOC khi thư mục DẠY HỌC hoặc mã "DH-"; còn lại TU_LUYEN; bỏ mã rỗng/trùng; chiaLo ≤ 400', () => {
    expect(dsThuMucKho([...KHO, de('12-C1-B1', 'x'), de('  ', 'y')])).toEqual([
      { maDe: '12-C1-B1', thuMuc: 'TU_LUYEN' },
      { maDe: 'DH-12-C1-B1-TN', thuMuc: 'DAY_HOC' },
      { maDe: 'BD-12-01', thuMuc: 'TU_LUYEN' },
      { maDe: 'DH-11-C2-B3', thuMuc: 'DAY_HOC' },
      { maDe: '11-C2-B3', thuMuc: 'TU_LUYEN' },
    ])
    expect(LO_THU_MUC).toBe(400)
    const lo = chiaLo(Array.from({ length: 901 }, (_, i) => i))
    expect(lo.map((x) => x.length)).toEqual([400, 400, 101])
    expect(chiaLo([], 400)).toEqual([])
  })
})

describe('HopChonDe theoMucDich (Mở ca kiểm tra · Giao chiến dịch)', () => {
  const ds = KHO
  it('mặc định: thư mục TU LUYỆN mở sẵn (thấy ngay các khối như trước), DẠY HỌC gập; vẫn chọn được tờ DẠY HỌC', () => {
    const onChon = vi.fn()
    const { container, getByRole } = render(<HopChonDe ds={ds} daChon={new Set()} onChon={onChon} chonNhieu onChonTatCa={onChon} theoMucDich />)
    const cay = container.querySelector('[role="tree"]') as HTMLElement
    expect(cay.textContent).toContain('DẠY HỌC')
    expect(cay.textContent).toContain(TEN_THU_MUC_TU_LUYEN)
    expect(cay.textContent).toContain('Khối 12')
    expect(cay.textContent).toContain('BỘ ĐỀ')
    expect(cay.textContent).not.toContain('Bài 1. Ester')
    // Mở DẠY HỌC ⇒ khối của DẠY HỌC; tích cả thư mục ⇒ chọn đúng các tờ DẠY HỌC.
    fireEvent.click(getByRole('button', { name: 'Mở DẠY HỌC' }))
    fireEvent.click(within(cay).getAllByRole('checkbox')[0]!)
    expect(new Set(onChon.mock.calls.at(-1)![0] as string[])).toEqual(new Set(['DH-12-C1-B1-TN', 'DH-11-C2-B3']))
  })
  it('vắng cờ ⇒ cây cũ y nguyên (khối ngoài cùng, không có TU LUYỆN)', () => {
    const { container } = render(<HopChonDe ds={ds} daChon={new Set()} onChon={vi.fn()} />)
    const cay = container.querySelector('[role="tree"]') as HTMLElement
    expect(cay.textContent).not.toContain(TEN_THU_MUC_TU_LUYEN)
    expect(cay.textContent).toContain('Khối 12')
  })
})

describe('đồng bộ thư mục lên máy chủ (/kho/thu-muc)', () => {
  const NOW = Date.UTC(2026, 9, 5, 3, 0, 0) // 10:00 giờ Việt Nam 05/10
  const kho900 = Array.from({ length: 901 }, (_, i) => de(i % 3 ? `12-X-${i}` : `DH-12-X-${i}`, '12 · C1'))

  it('gửi theo lô ≤ 400 mã {maDe, thuMuc}; xong ghi ngày ⇒ cùng ngày không gửi lại; sang ngày mới gửi lại', async () => {
    goi.mockImplementation(async (_d: string, b: { ds: unknown[] }) => ({ ok: true, du: { ok: true, daGhi: b.ds.length } }))
    expect(await dongBoThuMucKho(NOW, async () => kho900)).toBe('da_gui')
    const lenh = goi.mock.calls.filter(([d]) => d === '/kho/thu-muc')
    expect(lenh.map(([, b]) => (b as { ds: unknown[] }).ds.length)).toEqual([400, 400, 101])
    expect((lenh[0]![1] as { ds: unknown[] }).ds[0]).toEqual({ maDe: 'DH-12-X-0', thuMuc: 'DAY_HOC' })
    expect((lenh[0]![1] as { ds: unknown[] }).ds[1]).toEqual({ maDe: '12-X-1', thuMuc: 'TU_LUYEN' })
    expect(localStorage.getItem(KHOA_NGAY_THU_MUC)).toBe('2026-10-05')
    goi.mockClear()
    expect(await dongBoThuMucKho(NOW + 3_600_000, async () => kho900)).toBe('hom_nay_roi')
    expect(goi).not.toHaveBeenCalled()
    expect(await dongBoThuMucKho(NOW + 86_400_000, async () => kho900)).toBe('da_gui')
    expect(goi).toHaveBeenCalledTimes(3)
  })

  it('máy chủ chưa có lệnh ⇒ ghi ngày (mai thử lại); mất mạng ⇒ KHÔNG ghi ngày; kho trống ⇒ không gửi', async () => {
    goi.mockResolvedValue({ ok: false, loai: 'chua_co_lenh', chu: 'Máy chủ chưa có lệnh' })
    expect(await dongBoThuMucKho(NOW, async () => KHO)).toBe('may_chu_tu_choi')
    expect(localStorage.getItem(KHOA_NGAY_THU_MUC)).toBe('2026-10-05')
    localStorage.clear()
    goi.mockResolvedValue({ ok: false, loai: 'mang', chu: 'Không nối được máy chủ.' })
    expect(await dongBoThuMucKho(NOW, async () => KHO)).toBe('loi_tam')
    expect(localStorage.getItem(KHOA_NGAY_THU_MUC)).toBeNull()
    goi.mockClear()
    expect(await dongBoThuMucKho(NOW, async () => [])).toBe('kho_trong')
    expect(goi).not.toHaveBeenCalled()
  })

  it('máy chặn bộ nhớ (localStorage ném lỗi) ⇒ vẫn gửi, không ném', async () => {
    const goc = Storage.prototype.getItem
    Storage.prototype.getItem = () => {
      throw new Error('SecurityError')
    }
    try {
      goi.mockResolvedValue({ ok: true, du: { ok: true, daGhi: 1 } })
      expect(await dongBoThuMucKho(NOW, async () => KHO)).toBe('da_gui')
    } finally {
      Storage.prototype.getItem = goc
    }
  })

  it('App thầy gọi đồng bộ khi mở (đã mở khoá), nạp lười', async () => {
    const { readFileSync } = await import('node:fs')
    const app = readFileSync('src/App.tsx', 'utf8')
    expect(app).toMatch(/if \(laVoThay\) void import\('\.\/lib\/dong-bo-thu-muc'\)\.then\(\(m\) => m\.dongBoThuMucKho\(\)\)/)
  })
})
