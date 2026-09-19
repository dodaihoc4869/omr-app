// Việc C · nhóm A2 (Code 4): vào thi — MaCaInput (6 ô mã ca) + PhongChoGame (phòng chờ). Cả hai nằm trong LUỒNG THI THẬT (ExamTakeScreen import).
// Điều khoá: (1) ngoài màn thi / ngoài `.m3` không đổi một điểm ảnh (giá trị dự phòng của biến = giá trị cũ); (2) chỉ ở màn thi
// (?examCode=, /t/<mã>) mới tự mang `m3`; (3) CSS không !important, mọi bộ chọn có tiền tố `.m3 `.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import MaCaInput from '../src/components/MaCaInput'
import PhongChoGame from '../src/components/PhongChoGame'
import { laManThi } from '../src/components/m3'

const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
const datDuong = (d: string) => window.history.replaceState(null, '', d)
afterEach(() => {
  cleanup()
  datDuong('/')
})

describe('laManThi(): chỉ đường vào màn thi / xem điểm của em', () => {
  it.each([
    ['?examCode=123456', '/', true],
    ['', '/t/123456', true],
    ['', '/d/123456', true],
    ['', '/hs', false], // game thần thú ở /hs → không được bật
    ['', '/ph', false],
    ['', '/', false],
    ['', '/gv', false],
    ['?vai=hocsinh', '/', false],
    ['?vai=phieu', '/', false],
  ])('search=%s path=%s → %s', (search, duong, mong) => {
    expect(laManThi(search, duong)).toBe(mong)
  })
})

describe('vao-thi.css', () => {
  const css = doc('src/components/m3/vao-thi.css')
  it('không !important, không mã #, mọi bộ chọn có tiền tố `.m3 `, chỉ đọc biến --m3-*', () => {
    // bỏ chú thích và khối @keyframes (tên khung + phần trăm không phải bộ chọn)
    const sach = css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@keyframes[^{]*\{(?:[^{}]*\{[^}]*\})*[^}]*\}/g, '')
    expect(sach).not.toContain('!important')
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    for (const m of sach.matchAll(/([^{}@]+)\{/g)) {
      const ch = m[1].trim()
      if (!ch) continue
      for (const s of ch.split(',')) expect(s.trim().startsWith('.m3 '), s).toBe(true)
    }
    expect(sach).toMatch(/--ma-vien: 0 none/)
  })
})

describe('MaCaInput (6 ô mã ca)', () => {
  it('ngoài màn thi: KHÔNG lớp m3; giá trị dự phòng của biến = kích thước cũ 48×56, viền 1,5 px; 6 ô, số hiện đúng ô, cấu trúc div > div > div giữ nguyên', () => {
    datDuong('/')
    const onChange = vi.fn()
    const { container, getByLabelText } = render(<MaCaInput value="4830" onChange={onChange} />)
    expect(container.querySelector('.m3')).toBeNull()
    const o = Array.from(container.querySelectorAll('.m3-o-ma'))
    expect(o).toHaveLength(6)
    expect(Array.from(container.querySelectorAll('div > div > div')).slice(0, 6).map((d) => d.textContent)).toEqual(['4', '8', '3', '0', '', ''])
    expect(o.map((d) => d.getAttribute('data-co-so'))).toEqual(['1', '1', '1', '1', null, null])
    fireEvent.change(getByLabelText('Mã ca 6 số'), { target: { value: '80a25539' } })
    expect(onChange).toHaveBeenCalledWith('802553')
    const nd = doc('src/components/MaCaInput.tsx')
    for (const cu of ["'var(--ma-rong, 48px)'", "'var(--ma-cao, 56px)'", "'var(--ma-cao-hang, 56px)'", "'var(--ma-bo, var(--bo-1))'", "'var(--ma-nen, var(--the-2))'", 'var(--ma-vien, 1.5px solid ']) expect(nd).toContain(cu)
  })

  it('màn thi (?examCode=): tự bọc `m3`; đường /hs (game) KHÔNG bọc', () => {
    datDuong('/?examCode=123456')
    const a = render(<MaCaInput value="" onChange={() => {}} />)
    expect(a.container.firstElementChild!.classList.contains('m3')).toBe(true)
    a.unmount()
    datDuong('/hs')
    const b = render(<MaCaInput value="" onChange={() => {}} />)
    expect(b.container.querySelector('.m3')).toBeNull()
  })

  it('ô đang gõ được đánh dấu data-dang-go khi lấy nét', () => {
    const { container, getByLabelText } = render(<MaCaInput value="48" onChange={() => {}} />)
    fireEvent.focus(getByLabelText('Mã ca 6 số'))
    const o = Array.from(container.querySelectorAll('.m3-o-ma'))
    expect(o.map((d) => d.getAttribute('data-dang-go'))).toEqual([null, null, '1', null, null, null])
  })
})

describe('PhongChoGame (phòng chờ)', () => {
  it('nội dung bắt buộc còn nguyên; ngoài màn thi không m3; màn thi thì bọc m3; đầu thẻ có móc lớp', () => {
    datDuong('/')
    const a = render(<PhongChoGame cho={{ thoiGianPhut: 50, tenCa: 'Ca Ancol', lop: '12A1' }} loiCho="Mất kết nối" />)
    const chu = a.container.textContent || ''
    for (const s of ['PHÒNG CHỜ THI TRỰC TUYẾN', 'Cao độ:', 'Điểm nguyên tử:', 'Đang chờ Thầy bấm bắt đầu', 'Bài làm trong 50 phút', 'Ca thi: Ca Ancol', 'Mất kết nối']) expect(chu, s).toContain(s)
    expect(a.container.querySelector('.m3')).toBeNull()
    expect(a.container.querySelector('.m3-phong-cho-dau')).toBeTruthy()
    a.unmount()
    datDuong('/?examCode=123456')
    const b = render(<PhongChoGame />)
    expect(b.container.firstElementChild!.classList.contains('m3')).toBe(true)
  })
})
