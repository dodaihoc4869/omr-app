// SỬA LỖI (Code 4, soát app giáo viên ở DỮ LIỆU TRỐNG sau reset 21/09): hai câu chữ trỏ vào khoảng trống.
//  (1) HopChonDe — ô tìm để trống mà kho đề rỗng: hiện `Không có đề nào khớp "".` (ngoặc kép rỗng, vô nghĩa). Kho đề TRỐNG khác "không khớp".
//  (2) ExamMonitorScreen — gõ mã ca không có: "…hoặc chọn từ danh sách ca thi bên dưới" trong khi bên dưới không có danh sách nào.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import HopChonDe from '../src/components/HopChonDe'
import { loiKhongTimThayCa } from '../src/lib/cau-chu-ca'
import type { TeacherExamSource } from '../src/data/examContent'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const de = (maDe: string): TeacherExamSource => ({ maDe, nhom: '12 · C1 - Ester lipid', nguon: 'Bài 1. Ester', phanI: [{ id: `${maDe}-1` }] as never, phanII: [], phanIII: [] })
const dung = (ds: TeacherExamSource[]) => render(<HopChonDe ds={ds} daChon={new Set()} onChon={vi.fn()} chonNhieu onChonTatCa={vi.fn()} />)
const cay = (c: HTMLElement) => (c.querySelector('[role="tree"]') as HTMLElement).textContent ?? ''

describe('HopChonDe: kho trống ≠ không khớp', () => {
  it('kho rỗng, ô tìm trống → nói kho đang trống và chỉ đường Đồng bộ; KHÔNG có `khớp ""`', () => {
    const { container } = dung([])
    expect(cay(container)).toContain('Kho đề đang trống. Vào Ngân hàng câu hỏi → Đồng bộ ngay để nạp đề.')
    expect(cay(container)).not.toContain('khớp')
  })

  it('kho có đề, gõ tìm không ra → vẫn `Không có đề nào khớp "xyz".`', () => {
    const { container, getByLabelText } = dung([de('12-C1-B1-TN')])
    fireEvent.change(getByLabelText('Tìm đề'), { target: { value: 'xyz' } })
    expect(cay(container)).toContain('Không có đề nào khớp "xyz".')
  })

  it('kho rỗng mà đang gõ tìm → câu "không khớp" (người dùng biết mình vừa tìm gì)', () => {
    const { container, getByLabelText } = dung([])
    fireEvent.change(getByLabelText('Tìm đề'), { target: { value: 'abc' } })
    expect(cay(container)).toContain('Không có đề nào khớp "abc".')
  })

  it('kho có đề, ô tìm trống → hiện đề, không câu trống', () => {
    const { container } = dung([de('12-C1-B1-TN')])
    expect(cay(container)).not.toContain('Kho đề đang trống')
    expect(cay(container)).not.toContain('Không có đề nào khớp')
    expect(cay(container)).toContain('Khối 12')
  })
})

describe('ExamMonitorScreen: mã ca không có', () => {
  it('CHƯA CÓ CA NÀO: câu lỗi chỉ bảo kiểm tra lại mã — không trỏ vào "danh sách bên dưới" (không có)', () => {
    expect(loiKhongTimThayCa('123456', false)).toBe('Không tìm thấy ca kiểm tra #123456. Bạn hãy kiểm tra lại mã ca.')
  })

  it('CÓ ca gợi ý bên dưới: vẫn nhắc "hoặc chọn từ danh sách ca thi bên dưới"; mã được cắt khoảng trắng', () => {
    expect(loiKhongTimThayCa(' 123456 ', true)).toBe('Không tìm thấy ca kiểm tra #123456. Bạn hãy kiểm tra lại mã ca hoặc chọn từ danh sách ca thi bên dưới.')
  })

  it('màn dùng hàm ấy với ĐÚNG điều kiện có danh sách gợi ý (dsCaGoiY), không còn chuỗi cứng', () => {
    const src = fs.readFileSync(path.join(process.cwd(), 'src/screens/ExamMonitorScreen.tsx'), 'utf8')
    expect(src).toContain('setLoi(loiKhongTimThayCa(ma, dsCaGoiY.length > 0))')
    expect(src).not.toContain('chọn từ danh sách ca thi bên dưới')
    expect(src).toContain("import { loiKhongTimThayCa } from '../lib/cau-chu-ca'")
  })
})
