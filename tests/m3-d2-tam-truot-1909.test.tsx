// Việc C · nhóm D (2/…) — TamTruotHoiBai (tấm trượt "Hỏi bài Thầy", trong luồng thi thật: ExamTakeScreen import).
// Thẻ TheCauChiTiet bên trong GIỮ kiểu "bản giấy" (--p-*, 0.Planer duyệt): chỉ đổi vỏ tấm trượt.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import TamTruotHoiBai from '../src/components/TamTruotHoiBai'

const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
const datDuong = (d: string) => window.history.replaceState(null, '', d)
afterEach(() => {
  cleanup()
  datDuong('/')
})

const ct = (phan: 'I' | 'II' | 'III', soCau: number, de: string, dung: string, chon: string) => ({
  qid: 'q' + soCau,
  chiTiet: { phan, soCau, qid: 'q' + soCau, chuyenDe: 'Ancol', mucDo: 'Nhận biết', giay: 48, de, luaChon: phan === 'I' ? ['a', 'b', 'c', 'd'] : null, dapAnDung: dung, dapAnChon: chon, chot: 'Chốt.', lyDo: null, buoc: null, ketQua: '', coHinh: false },
})
const CAU = [ct('I', 7, 'Ancol bậc II?', 'B', 'A'), ct('III', 9, 'Tính V.', '4,96', '4,48')] as any

describe('TamTruotHoiBai', () => {
  it('ngoài màn thi: KHÔNG lớp m3 (kiểu cũ); hành vi giữ nguyên: tick → nút Gửi đổi số, gửi đúng mã câu + ghi chú, đóng gọi dong', () => {
    datDuong('/')
    const gui = vi.fn()
    const dong = vi.fn()
    const { container } = render(<TamTruotHoiBai cau={CAU} daCongBo dong={dong} gui={gui} />)
    expect(container.querySelector('.m3')).toBeNull()
    expect(container.querySelector('.m3-tam-truot')).toBeTruthy() // móc lớp vô hại, chỉ có nghĩa dưới .m3
    expect((screen.getByRole('button', { name: 'Gửi 0 câu cho Thầy' }) as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: /Tick hết câu em làm sai \(2\)/ }))
    const gui2 = screen.getByRole('button', { name: 'Gửi 2 câu cho Thầy' })
    fireEvent.change(screen.getByLabelText('Em chưa hiểu chỗ nào'), { target: { value: 'chưa hiểu câu 7' } })
    fireEvent.click(gui2)
    expect(gui).toHaveBeenCalledWith(['q7', 'q9'], 'chưa hiểu câu 7')
    fireEvent.click(screen.getByRole('button', { name: 'Đóng' }))
    expect(dong).toHaveBeenCalledTimes(1)
  })

  it('màn thi (?examCode=): tự bọc `m3`, danh sách thẻ câu nằm trong khối m3-giay; /hs (game) không bọc', () => {
    datDuong('/?examCode=123456')
    const a = render(<TamTruotHoiBai cau={CAU} daCongBo dong={() => {}} gui={() => {}} />)
    const goc = a.container.firstElementChild as HTMLElement
    expect(goc.classList.contains('m3')).toBe(true)
    expect(goc.querySelector('.m3-tam-truot .m3-giay')).toBeTruthy()
    a.unmount()
    datDuong('/hs')
    const b = render(<TamTruotHoiBai cau={CAU} daCongBo dong={() => {}} gui={() => {}} />)
    expect(b.container.querySelector('.m3')).toBeNull()
  })

  it('giá trị dự phòng của biến = kích thước cũ (nút đóng 32, nút chọn nhanh 40, màu chữ nút chính --giay); CSS chỉ tiền tố `.m3 `, không !important', () => {
    const t = doc('src/components/TamTruotHoiBai.tsx')
    expect(t).toContain("'var(--tam-nut, 32px)'")
    expect(t).toContain("'var(--tam-cao-nut, 40px)'")
    expect(doc('src/components/DesignSystem.tsx')).toContain("color: 'var(--nut-chu, var(--giay))'")
    const css = doc('src/components/m3/tam-truot.css').replace(/\/\*[\s\S]*?\*\//g, '')
    expect(css).not.toContain('!important')
    for (const m of css.matchAll(/([^{}]+)\{/g)) for (const s of m[1].split(',')) expect(s.trim().startsWith('.m3 '), s).toBe(true)
  })

  it('logic không đổi: đáp án đúng chỉ hiện khi ca đã công bố (anLoiGiai cắt từ dữ liệu)', () => {
    const t = doc('src/components/TamTruotHoiBai.tsx')
    expect(t).toContain('anLoiGiai={!daCongBo}')
    expect(t).toContain('const cauSai = useMemo(')
    expect(t).toContain('loiNhacTickNhieu(chon.size, cau.length)')
  })
})
