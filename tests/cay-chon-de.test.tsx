// Ô TÍCH CẢ CHƯƠNG — đặc tả CA-THI-VA-GOI-LEN-BANG mục 4.3, phép kiểm 10–13.
//
// Luật gom nhóm và ba trạng thái ô tích kiểm bằng test thuần; phần vẽ kiểm qua
// HopChonDe. Không chụp màn hình.
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render } from '@testing-library/react'
import { bamTich, chuongCuaDe, dungCay, locCay, tenBai, tongCau, tongDaChon, trangThaiTich, type Nut } from '../src/lib/cay-chon-de'
import HopChonDe from '../src/components/HopChonDe'
import type { TeacherExamSource } from '../src/data/examContent'

const de = (maDe: string, nhom: string, nguon: string, n: [number, number, number]): TeacherExamSource => ({
  maDe,
  nhom,
  nguon,
  phanI: Array.from({ length: n[0] }, (_, i) => ({ id: `${maDe}-I-${i}` })) as never,
  phanII: Array.from({ length: n[1] }, (_, i) => ({ id: `${maDe}-II-${i}` })) as never,
  phanIII: Array.from({ length: n[2] }, (_, i) => ({ id: `${maDe}-III-${i}` })) as never,
})

/** Một chương hai bài, bài đầu đủ ba dạng, bài sau chỉ hai. */
const KHO = [
  de('12-C1-B1-TN', '12 · C1 - Ester lipid', 'Bài 1. Ester', [48, 0, 0]),
  de('12-C1-B1-DS', '12 · C1 - Ester lipid', 'Bài 1. Ester', [0, 16, 0]),
  de('12-C1-B1-TLN', '12 · C1 - Ester lipid', 'Bài 1. Ester', [0, 0, 17]),
  de('12-C1-B2-TN', '12 · C1 - Ester lipid', 'Bài 2. Xà phòng', [53, 0, 0]),
  de('12-C1-B2-DS', '12 · C1 - Ester lipid', 'Bài 2. Xà phòng', [0, 8, 0]),
  de('12-C2-B4-TN', '12 · C2 - Carbohydrate', 'Bài 4. Glucose', [30, 0, 0]),
  de('11-C1-B1-TN', '11 · C1 - Cân bằng hoá học', 'Bài 1. Cân bằng', [20, 0, 0]),
]

const tim = (ds: Nut[], khoa: string): Nut => {
  for (const n of ds) {
    if (n.khoa === khoa) return n
    const s = n.con.length ? tim(n.con, khoa) : null
    if (s) return s
  }
  return null as never
}

describe('dựng cây bốn tầng', () => {
  const cay = dungCay(KHO)

  it('tầng 1 là khối, giữ thứ tự xuất hiện chứ không sắp lại', () => {
    expect(cay.map((n) => n.nhan)).toEqual(['Khối 12', 'Khối 11'])
  })

  it('tầng 2 là chương, bỏ phần khối phía trước dấu chấm giữa', () => {
    expect(chuongCuaDe({ nhom: '12 · C1 - Ester lipid' })).toBe('C1 - Ester lipid')
    expect(chuongCuaDe({ nhom: '' })).toBe('')
    expect(tim(cay, '12').con.map((n) => n.nhan)).toEqual(['C1 - Ester lipid', 'C2 - Carbohydrate'])
  })

  it('tầng 3 là bài, tên lấy từ nguồn và cắt phần chú thích dài', () => {
    expect(tenBai({ maDe: '12-C1-B1-TN', nguon: 'Bài 1. Ester – Lipid — 4.1 TN · 4.2 ĐS' })).toBe('Bài 1. Ester – Lipid')
    expect(tim(cay, '12/C1 - Ester lipid').con.map((n) => n.nhan)).toEqual(['Bài 1. Ester', 'Bài 2. Xà phòng'])
  })

  it('tầng 4 là dạng, đặt tên đúng phần và mang mã đề', () => {
    const b1 = tim(cay, '12/C1 - Ester lipid/12-C1-B1')
    expect(b1.con.map((n) => n.nhan)).toEqual(['Trắc nghiệm', 'Đúng sai', 'Trả lời ngắn'])
    expect(b1.con.map((n) => n.maDe)).toEqual(['12-C1-B1-TN', '12-C1-B1-DS', '12-C1-B1-TLN'])
  })

  it('PHÉP KIỂM 12 — số câu cộng dồn đúng từ lá lên gốc, chia đúng ba phần', () => {
    expect(tim(cay, '12/C1 - Ester lipid/12-C1-B1').soCau).toEqual({ I: 48, II: 16, III: 17 })
    expect(tim(cay, '12/C1 - Ester lipid').soCau).toEqual({ I: 101, II: 24, III: 17 })
    expect(tim(cay, '12').soCau).toEqual({ I: 131, II: 24, III: 17 })
    expect(tongCau(tim(cay, '12').soCau)).toBe(172)
  })

  it('bài chỉ có hai dạng thì KHÔNG sinh nút dạng rỗng', () => {
    expect(tim(cay, '12/C1 - Ester lipid/12-C1-B2').con).toHaveLength(2)
  })
})

describe('ô tích ba trạng thái', () => {
  const cay = dungCay(KHO)
  const chuong = tim(cay, '12/C1 - Ester lipid')

  it('PHÉP KIỂM 8 — tích ô chương chọn hết mọi bài và mọi dạng trong chương', () => {
    const sau = bamTich(chuong, new Set())
    expect([...sau].sort()).toEqual(['12-C1-B1-DS', '12-C1-B1-TLN', '12-C1-B1-TN', '12-C1-B2-DS', '12-C1-B2-TN'])
    expect(trangThaiTich(chuong, sau)).toBe('day')
  })

  it('PHÉP KIỂM 9 — bỏ tích một dạng thì ô chương chuyển sang NỬA', () => {
    const day = bamTich(chuong, new Set())
    day.delete('12-C1-B1-TLN')
    expect(trangThaiTich(chuong, day)).toBe('nua')
    expect(trangThaiTich(tim(cay, '12/C1 - Ester lipid/12-C1-B1'), day)).toBe('nua')
    expect(trangThaiTich(tim(cay, '12/C1 - Ester lipid/12-C1-B2'), day)).toBe('day')
  })

  it('bấm lại ô đang đầy thì bỏ hết con', () => {
    const day = bamTich(chuong, new Set())
    expect(bamTich(chuong, day).size).toBe(0)
  })

  it('bấm ô đang NỬA thì chọn nốt phần còn thiếu, không đảo ngược', () => {
    const nua = new Set(['12-C1-B1-TN'])
    expect(bamTich(chuong, nua).size).toBe(5)
  })

  it('tích bài rồi tích thêm cả chương KHÔNG cộng trùng số câu', () => {
    const chiBai = bamTich(tim(cay, '12/C1 - Ester lipid/12-C1-B1'), new Set())
    expect(tongCau(tongDaChon(cay, chiBai))).toBe(48 + 16 + 17)
    const themChuong = bamTich(chuong, chiBai)
    expect(themChuong.size).toBe(5)
    expect(tongCau(tongDaChon(cay, themChuong))).toBe(48 + 16 + 17 + 53 + 8)
  })
})

describe('ô tìm', () => {
  const cay = dungCay(KHO)

  it('gõ tên chương thì giữ NGUYÊN cả nhánh con của chương đó', () => {
    const { cay: loc } = locCay(cay, 'carbohydrate')
    expect(loc).toHaveLength(1)
    expect(loc[0].con[0].nhan).toBe('C2 - Carbohydrate')
    expect(loc[0].con[0].con[0].con).toHaveLength(1)
  })

  it('gõ mã đề thì lọc tới đúng lá, và báo những nhánh cần tự mở', () => {
    const { cay: loc, moKhoa } = locCay(cay, '12-C1-B2-DS')
    expect(loc[0].con[0].con[0].con.map((n) => n.maDe)).toEqual(['12-C1-B2-DS'])
    expect(moKhoa).toContain('12')
    expect(moKhoa).toContain('12/C1 - Ester lipid')
    expect(moKhoa).toContain('12/C1 - Ester lipid/12-C1-B2')
  })

  it('bỏ dấu khi tìm — gõ không dấu vẫn ra', () => {
    expect(locCay(cay, 'ester').cay).toHaveLength(1)
    expect(locCay(cay, 'can bang').cay[0].nhan).toBe('Khối 11')
  })

  it('không khớp gì thì cây rỗng, không trả cả kho', () => {
    expect(locCay(cay, 'zzz').cay).toHaveLength(0)
  })
})

describe('HopChonDe — vẽ cây', () => {
  it('PHÉP KIỂM 13 — gõ tìm thì cây TỰ MỞ tới lá, không phải bấm từng tầng', () => {
    const { container, getByLabelText } = render(<HopChonDe ds={KHO} daChon={new Set()} onChon={vi.fn()} chonNhieu onChonTatCa={vi.fn()} />)
    const cay = () => (container.querySelector('[role="tree"]') as HTMLElement).textContent ?? ''
    expect(cay()).not.toContain('12-C1-B2-DS')
    fireEvent.change(getByLabelText('Tìm đề'), { target: { value: '12-C1-B2-DS' } })
    expect(cay()).toContain('12-C1-B2-DS')
    expect(cay()).not.toContain('12-C1-B1-TN')
  })

  it('PHÉP KIỂM 10 — bấm ô tích chương chọn hết 5 mã trong chương', () => {
    const goi = vi.fn()
    const { getByRole } = render(<HopChonDe ds={KHO} daChon={new Set()} onChon={vi.fn()} chonNhieu onChonTatCa={goi} />)
    fireEvent.click(getByRole('checkbox', { name: /C1 - Ester lipid/ }))
    expect([...goi.mock.calls[0][0]].sort()).toEqual(['12-C1-B1-DS', '12-C1-B1-TLN', '12-C1-B1-TN', '12-C1-B2-DS', '12-C1-B2-TN'])
  })

  it('PHÉP KIỂM 12 — thanh tổng LUÔN hiện và cập nhật đúng ba phần', () => {
    const { container, rerender } = render(<HopChonDe ds={KHO} daChon={new Set()} onChon={vi.fn()} chonNhieu onChonTatCa={vi.fn()} />)
    expect(container.textContent).toContain('Đã chọn:')
    rerender(<HopChonDe ds={KHO} daChon={new Set(['12-C1-B1-TN', '12-C1-B1-DS', '12-C1-B1-TLN'])} onChon={vi.fn()} chonNhieu onChonTatCa={vi.fn()} />)
    const thanh = container.textContent ?? ''
    expect(thanh).toContain('81') // 48 + 16 + 17
    expect(thanh).toMatch(/I:\s*48/)
    expect(thanh).toMatch(/II:\s*16/)
    expect(thanh).toMatch(/III:\s*17/)
  })

  it('chọn MỘT đề (Gọi lên bảng) thì tầng trên KHÔNG tích được, chỉ lá chọn được', () => {
    const goi = vi.fn()
    const { queryByRole, getByLabelText, getAllByRole } = render(<HopChonDe ds={KHO} daChon={new Set()} onChon={goi} />)
    expect(queryByRole('checkbox')).toBeNull()
    fireEvent.change(getByLabelText('Tìm đề'), { target: { value: '12-C1-B2-DS' } })
    const la = getAllByRole('radio').filter((e) => (e.textContent ?? '').includes('12-C1-B2-DS'))
    expect(la).toHaveLength(1)
    fireEvent.click(la[0])
    expect(goi).toHaveBeenCalledWith('12-C1-B2-DS')
  })
})
