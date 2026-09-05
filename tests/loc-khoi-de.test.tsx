// BỘ LỌC KHỐI 10 / 11 / 12 trong hộp chọn đề (thầy chốt 04-09 khuya), dùng chung
// cho Mở ca và Gọi lên bảng vì cùng một HopChonDe.
import { describe, expect, it, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import HopChonDe, { khoiCuaDe } from '../src/components/HopChonDe'
import type { TeacherExamSource } from '../src/data/examContent'

const de = (maDe: string, nhom = ''): TeacherExamSource => ({ maDe, nhom, phanI: [{ id: `${maDe}-I-1` }] as never, phanII: [] as never, phanIII: [] as never })

describe('khoiCuaDe', () => {
  it('đọc khối từ đầu mã đề, hoặc từ nhóm khi mã không có', () => {
    expect(khoiCuaDe(de('10-C1-B1-TN'))).toBe('10')
    expect(khoiCuaDe(de('12-C1-B1-P2-DS'))).toBe('12')
    expect(khoiCuaDe(de('100', '11 · C1 - Cân bằng'))).toBe('11')
    expect(khoiCuaDe(de('100'))).toBe('')
  })
})

describe('HopChonDe — chip khối', () => {
  const DS = [de('10-C1-B1-TN', '10 · C1'), de('11-C1-B1-TN', '11 · C1'), de('12-C1-B1-TN', '12 · CI'), de('100')]
  it('hiện đúng ba chip Lớp 10 / 11 / 12 và Tất cả', () => {
    const { getByRole } = render(<HopChonDe ds={DS} daChon={new Set()} onChon={vi.fn()} />)
    for (const t of ['Tất cả', 'Lớp 10', 'Lớp 11', 'Lớp 12']) expect(getByRole('button', { name: t })).toBeTruthy()
  })
  it('bấm Lớp 12 thì chỉ còn đề lớp 12; Tất cả thì về đủ', () => {
    const { getByRole, queryAllByRole } = render(<HopChonDe ds={DS} daChon={new Set()} onChon={vi.fn()} />)
    fireEvent.click(getByRole('button', { name: 'Lớp 12' }))
    const dong = queryAllByRole('option').map((e) => e.textContent ?? '')
    expect(dong.some((t) => t.includes('12-C1-B1-TN'))).toBe(true)
    expect(dong.some((t) => t.includes('10-C1-B1-TN'))).toBe(false)
    fireEvent.click(getByRole('button', { name: 'Tất cả' }))
    expect(queryAllByRole('option')).toHaveLength(4)
  })
  it('kho chỉ có một khối thì vẫn bày chip khối đó, không bày khối trống', () => {
    const { queryByRole } = render(<HopChonDe ds={[de('12-C1-B1-TN')]} daChon={new Set()} onChon={vi.fn()} />)
    expect(queryByRole('button', { name: 'Lớp 12' })).toBeTruthy()
    expect(queryByRole('button', { name: 'Lớp 10' })).toBeNull()
  })
})
