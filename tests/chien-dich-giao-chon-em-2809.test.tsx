// Giao chiến dịch (thầy 28/09; bản vẽ docs/ban-ve-gv-2809 GV-GiaoChienDich): ô chọn em nhiều tầng Khối › Lớp › Em, cây Kho đề, số câu đồng bộ, cột tóm tắt.
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'

// SỬA CÓ CHỦ ĐÍCH 14/10: kiểm chooser dùng chung trực tiếp sau khi gỡ màn giao chiến dịch cũ.
import { useState } from 'react'
import ChonEmGiao, { khoiCuaLop, nhomDaChon } from '../src/components/chien-dich/ChonEmGiao'

afterEach(cleanup)

const EM_MAY_CHU = [
  { sbd: '1101', hoTen: 'An', khoi: '11', tenLop: '11' },
  { sbd: '1102', hoTen: 'Bình', khoi: '11', tenLop: '11' },
  { sbd: '1201', hoTen: 'Dũng', khoi: '12', tenLop: '12 - Tinh Hoa' },
  { sbd: '1202', hoTen: 'Hà', khoi: '12', tenLop: '12 - Tinh Hoa' },
  { sbd: '1203', hoTen: 'Giang', khoi: '12', tenLop: '12 - Lớp Thường' },
]
let chonCu: string[] = []
function BoChon() {
  const [chon, setChon] = useState<Set<string>>(new Set())
  return <ChonEmGiao ds={EM_MAY_CHU} chon={chon} onDoi={(s) => { chonCu = [...s].sort(); setChon(s) }} />
}
const cuoi = () => ({ sbd: chonCu })
const moChon = async () => fireEvent.click(await screen.findByRole('button', { name: 'Chọn em' }))

describe('ô chọn em nhiều tầng Khối › Lớp › Em (bản vẽ 28/09) — danh sách từ máy chủ, có lớp đã phân', () => {
  it('khối đọc từ đầu tên lớp', () => {
    expect(khoiCuaLop('12A1')).toBe('12')
    expect(khoiCuaLop('11')).toBe('11')
    expect(khoiCuaLop('10CL')).toBe('10')
    expect(khoiCuaLop('Ôn thi')).toBe('Khác')
  })
  it('gom thẻ đã chọn: khối đủ (nhiều lớp) ⇒ một thẻ khối; lớp đủ ⇒ thẻ lớp; một phần lớp ⇒ "x/y em"', () => {
    const ds = EM_MAY_CHU.map((e) => ({ ...e }))
    expect(nhomDaChon(ds, new Set(['1201', '1202', '1203'])).map((n) => [n.khoa, n.sbd.length, n.tong])).toEqual([['k:12', 3, 3]])
    expect(nhomDaChon(ds, new Set(['1201', '1202', '1101'])).map((n) => [n.khoa, n.sbd.length, n.tong])).toEqual([
      ['l:11', 1, 2],
      ['l:12 - Tinh Hoa', 2, 2],
    ])
  })
  it('tích "Khối 12" trong tấm ⇒ chọn cả 3 em, thẻ "Khối 12 · 3 em"; bỏ tích ⇒ 0 em', async () => {
    render(<BoChon />)
    await moChon()
    expect(screen.getByRole('button', { name: 'Đóng' }).getAttribute('aria-expanded')).toBe('true')
    fireEvent.click(screen.getByRole('checkbox', { name: 'Khối 12 · 0/3 em' }))
    await waitFor(() => expect(cuoi()).toMatchObject({ sbd: ['1201', '1202', '1203'] }))
    expect(screen.getByText(/Đã chọn 3\/5 em/)).toBeTruthy()
    expect(document.querySelector('[data-nhom="k:12"]')?.textContent).toContain('Khối 12 · 3 em')
    fireEvent.click(screen.getByRole('checkbox', { name: 'Khối 12 · 3/3 em' }))
    expect(screen.getByText('Chưa chọn em nào')).toBeTruthy()
    expect(cuoi()).toEqual({ sbd: [] })
  })
  it('mở nhánh Khối 12, tích lớp "12 - Tinh Hoa" ⇒ đúng 2 em; ô Khối 12 thành "một phần" 2/3; thẻ × bỏ cả lớp', async () => {
    render(<BoChon />)
    await moChon()
    expect(screen.queryByRole('checkbox', { name: /12 - Tinh Hoa/ })).toBeNull() // nhánh gập sẵn
    fireEvent.click(screen.getByRole('button', { name: 'Mở Khối 12' }))
    fireEvent.click(screen.getByRole('checkbox', { name: '12 - Tinh Hoa · 0/2 em' }))
    await waitFor(() => expect(cuoi()).toMatchObject({ sbd: ['1201', '1202'] }))
    const khoi12 = screen.getByRole('checkbox', { name: 'Khối 12 · 2/3 em' }) as HTMLInputElement
    expect(khoi12.checked).toBe(false)
    expect(khoi12.indeterminate).toBe(true)
    expect(document.querySelector('[data-khoi="em-da-chon-theo-lop"]')?.textContent).toContain('12 - Tinh Hoa2 em')
    fireEvent.click(screen.getByRole('button', { name: 'Bỏ 12 - Tinh Hoa' }))
    expect(screen.getByText('Chưa chọn em nào')).toBeTruthy()
  })
  it('từng em: mở tới lớp để tích một em; ô tìm không dấu ("binh"); "Chọn hết" / "Bỏ chọn hết" chỉ áp cho em đang khớp', async () => {
    render(<BoChon />)
    await moChon()
    fireEvent.click(screen.getByRole('button', { name: 'Mở Khối 12' }))
    fireEvent.click(screen.getByRole('button', { name: 'Mở 12 - Lớp Thường' }))
    fireEvent.click(screen.getByRole('checkbox', { name: /Giang/ }))
    const tim = screen.getByRole('searchbox', { name: 'Tìm em' })
    fireEvent.change(tim, { target: { value: 'binh' } })
    expect(screen.getByRole('checkbox', { name: /Bình/ })).toBeTruthy()
    expect(screen.queryByRole('checkbox', { name: /Giang/ })).toBeNull()
    fireEvent.change(tim, { target: { value: '11' } }) // khớp tên lớp "11" ⇒ An, Bình
    fireEvent.click(screen.getByRole('button', { name: 'Chọn hết' }))
    fireEvent.click(screen.getByRole('checkbox', { name: /Bình/ }))
    await waitFor(() => expect(cuoi()).toMatchObject({ sbd: ['1101', '1203'] }))
    fireEvent.click(screen.getByRole('button', { name: 'Bỏ chọn hết' }))
    await waitFor(() => expect(cuoi()).toMatchObject({ sbd: ['1203'] }))
  })
  it('Esc và "Xong" đóng tấm, tiêu điểm về nút mở', async () => {
    render(<BoChon />)
    await moChon()
    expect(screen.getByRole('dialog', { name: 'Chọn em nhận chiến dịch' })).toBeTruthy()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog', { name: 'Chọn em nhận chiến dịch' })).toBeNull()
    expect(document.activeElement?.textContent).toContain('Chọn em')
    await moChon()
    fireEvent.click(screen.getByRole('button', { name: 'Xong' }))
    expect(screen.queryByRole('dialog', { name: 'Chọn em nhận chiến dịch' })).toBeNull()
  })
})
