// GAME HÓA 2.0 · "KHỐI LƯỢNG SO VỚI THỜI GIAN CÒN LẠI" (tên cũ Sức chứa tới hạn nộp; bản vẽ docs/ban-ve-gv-2809 28/09): xanh ≤ 70% · vàng 70–90% · đỏ > 90%, câu "Em ở giữa lớp…",
// thầy 28/09 bỏ hai nút gợi ý "Rút còn" / "Lùi hạn nộp" (thay bằng nút gạt thể lực Tự động ở màn giao).
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import DongHoSucChua from '../src/components/chien-dich/DongHoSucChua'
import type { SucChua } from '../src/components/chien-dich/api'
import { mucSucChua } from '../src/components/chien-dich/tinh'
import { conLai, hienHanNop, hienNgay } from '../src/components/chien-dich/ngay'

afterEach(cleanup)

const sc = (tiLe: number, them: Partial<SucChua> = {}): SucChua => ({
  soCau: 120,
  soEm: 33,
  D: 6,
  sucChua: 240,
  khoiLuongTrungVi: Math.round(tiLe * 240),
  tiLe,
  muc: mucSucChua(tiLe),
  soEmQuaTai: tiLe > 0.9 ? 4 : 0,
  goiY: null,
  ...them,
})

const ve = (s: SucChua | null) => {
  const f = { onTinhLai: vi.fn() }
  const r = render(<DongHoSucChua sc={s} dangTinh={false} loi="" theLuc={40} {...f} />)
  return { ...r, ...f }
}
const khoi = (c: HTMLElement) => c.querySelector('[data-khoi="dong-ho-suc-chua"]') as HTMLElement

describe('mức sức chứa — đúng ngưỡng máy chủ', () => {
  it('≤ 70% xanh · 70–90% vàng · > 90% đỏ', () => {
    expect(mucSucChua(0.5)).toBe('xanh')
    expect(mucSucChua(0.7)).toBe('xanh')
    expect(mucSucChua(0.71)).toBe('vang')
    expect(mucSucChua(0.9)).toBe('vang')
    expect(mucSucChua(0.91)).toBe('do')
    expect(mucSucChua(1.4)).toBe('do')
  })
})

describe('đồng hồ đổi màu theo tỉ lệ', () => {
  it.each([
    [0.55, 'xanh', 'Vừa sức'],
    [0.85, 'vang', 'Sát'],
    [0.96, 'do', 'Quá tải'],
  ])('tỉ lệ %s ⇒ %s, chữ "%s", thanh đúng màu và đúng bề rộng', (tiLe, muc, chu) => {
    const { container } = ve(sc(tiLe))
    const k = khoi(container)
    expect(k.getAttribute('data-muc')).toBe(muc)
    expect(k.querySelector(`[data-ray="${muc}"]`)).toBeTruthy()
    expect(k.querySelector(`.cd-ray--${muc}`)).toBeTruthy()
    expect(k.textContent).toContain(`${Math.round(tiLe * 100)}%`)
    expect(k.textContent).toContain(chu)
    const ray = k.querySelector('[data-ray]') as HTMLElement
    expect(ray.style.width).toBe(`${Math.min(1, tiLe) * 100}%`)
    expect(k.querySelector('[role="meter"]')?.getAttribute('aria-valuenow')).toBe(String(Math.round(tiLe * 100)))
  })

  it('câu giải thích đủ nhãn: "Em ở giữa lớp cần khoảng X lượt · có D ngày × 40 câu = Y lượt. N em quá tải"', () => {
    const { container } = ve(sc(0.96))
    expect(khoi(container).textContent).toContain('Em ở giữa lớp cần khoảng 230 lượt · có 6 ngày × 40 lượt/ngày = 240 lượt.')
    expect(khoi(container).textContent).toContain('4/33 em quá tải.')
    cleanup()
    const r = ve(sc(0.5))
    expect(khoi(r.container).textContent).toContain('Không em nào quá tải.')
  })
})

describe('không còn nút gợi ý', () => {
  it('máy chủ vẫn gửi goiY thì đồng hồ cũng KHÔNG hiện nút "Rút còn" / "Lùi hạn nộp" (thầy 28/09)', () => {
    ve(sc(1.2, { goiY: { rutCon: { soCau: 101, tiLe: 0.7 }, luiHan: { hanNop: '2026-10-06', tiLe: 0.64 } } }))
    expect(screen.queryByRole('button', { name: /Rút còn/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /Lùi hạn nộp/ })).toBeNull()
  })
  it('không có dữ liệu: nói việc cần làm; lỗi: nói lý do thật + nút tính lại', () => {
    const { container } = ve(null)
    expect(khoi(container).textContent).toContain('Chọn tờ đề, em và hạn nộp để tính khối lượng.')
    cleanup()
    const f = vi.fn()
    render(<DongHoSucChua sc={null} dangTinh={false} loi="Hạn nộp đã qua." theLuc={40} rutCon={null} onRut={vi.fn()} onLuiHan={vi.fn()} onBoRut={vi.fn()} onTinhLai={f} />)
    expect(screen.getByText('Hạn nộp đã qua.')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Tính lại' }))
    expect(f).toHaveBeenCalled()
  })
})

describe('ngày giờ một kiểu', () => {
  it('"23:59 · Chủ Nhật 04/10/2026", khoảng còn lại kèm mốc', () => {
    expect(hienHanNop('2026-10-04')).toBe('23:59 · Chủ Nhật 04/10/2026')
    expect(hienNgay('2026-10-06', false)).toBe('Thứ Ba 06/10')
    // 18:59 giờ Việt Nam ngày 03/10 ⇒ còn 1 ngày 5 giờ tới 23:59 ngày 04/10
    expect(conLai('2026-10-04', Date.UTC(2026, 9, 3, 11, 59, 59))).toBe('còn 1 ngày 5 giờ')
    expect(conLai('2026-10-04', Date.UTC(2026, 9, 4, 17, 0, 0))).toBe('đã hết hạn nộp')
  })
})
