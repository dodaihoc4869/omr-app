// ĐẢO THẦN THÚ bản mới · màn 4 "Sổ tay dạng bài": sao = mastery[].stage, gom theo chương của lệnh so-tay,
// dạng chưa gặp = "???" (không lộ tên), thẻ "N dạng đang yếu", phần thưởng chưa có ⇒ SẮP MỞ.
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup, within } from '@testing-library/react'
import SoTay from '../src/game/than-thu-v2/dao/SoTay'
import { soTay } from '../src/game/than-thu-v2/dao/dao-core'
import type { DaoProfile } from '../src/game/than-thu-v2/dao/kieu'
import type { Mastery } from '../src/game/than-thu-v2/core'

afterEach(cleanup)
const NGAY = 86400000, NOW = 1_790_000_000_000
const m = (key: string, stage: number, due = NOW + NGAY): Mastery => ({ key, stage, first: stage ? NOW - 9 * NGAY : 0, due, groups: [], repaired: stage === 3 })
const MASTERY = [m('ES.TP', 2, NOW - 1), m('ES.TEN', 3), m('ES.DOT', 1), m('CB.LM', 0), m('g-le', 1)]
const DANH_MUC = [{ key: 'ES.TEN', ten: 'Tên gọi ester', chuong: 'ES' }, { key: 'ES.TP', ten: 'Thuỷ phân ester', chuong: 'ES' }, { key: 'ES.DOT', ten: 'Đốt cháy ester', chuong: 'ES' }, { key: 'ES.XP', ten: 'Xà phòng hoá', chuong: 'ES' }, { key: 'CB.LM', ten: 'Lên men', chuong: 'CB' }, { key: 'CB.TB', ten: 'Glucose tráng bạc', chuong: 'CB' }]
const hoSo = (mastery = MASTERY): DaoProfile => ({ pet: 'lua_phuong', choice: false, cap: 34, exp: 0, wallet: 0, mastery })

describe('soTay (lõi)', () => {
  it('sao của từng dạng = mastery.stage; gom theo mã chương; dạng trong danh mục mà chưa gặp ⇒ ô khoá; khoá lạ của mastery vào nhóm "khác"', () => {
    const s = soTay(MASTERY, NOW, DANH_MUC)
    expect(s.chuong.map(c => [c.ma, c.ten, c.dang.length, c.thanhThao])).toEqual([['CB', 'Nhóm CB', 2, 0], ['ES', 'Nhóm ES', 4, 1], ['', 'Dạng khác em đã gặp', 1, 0]])
    const es = s.chuong[1]!.dang
    expect(es.map(d => [d.key, d.sao, d.daGap])).toEqual([['ES.TEN', 3, true], ['ES.TP', 2, true], ['ES.DOT', 1, true], ['ES.XP', 0, false]])
    expect(es.find(d => d.key === 'ES.TP')!.toiHan).toBe(true); expect(es.find(d => d.key === 'ES.DOT')!.toiHan).toBe(false)
    expect([s.thanhThao, s.tong]).toEqual([1, 7]); expect(s.yeu.map(d => d.key)).toEqual(['CB.LM'])
  })
  it('Worker cũ chưa có lệnh so-tay ⇒ chỉ liệt kê dạng em đã gặp, tên lấy từ các câu đã làm', () => {
    const s = soTay(MASTERY, NOW, null, { 'ES.TP': 'Thuỷ phân ester' })
    expect(s.chuong.map(c => c.ten)).toEqual(['Dạng em đã gặp']); expect(s.tong).toBe(5)
    expect(s.chuong[0]!.dang.find(d => d.key === 'ES.TP')!.ten).toBe('Thuỷ phân ester')
  })
})

describe('Sổ tay dạng bài', () => {
  it('đầu trang đếm đúng; mỗi ô đúng số sao; ô chưa gặp là "???" và KHÔNG lộ tên', () => {
    const { container } = render(<div className="dao"><SoTay profile={hoSo()} now={NOW} danhMuc={DANH_MUC} tenChuong={{ ES: 'Ester – Lipid' }} /></div>)
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Em đã thành thạo 1/7 dạng')
    const es = screen.getByLabelText('Ester – Lipid')
    expect(within(es).getByText('1/4 dạng thành thạo')).toBeTruthy()
    expect(within(within(es).getByText('Thuỷ phân ester').closest('li')!).getByRole('img').getAttribute('aria-label')).toBe('2 trên 3 sao')
    expect(within(es).getByText('Thuỷ phân ester').closest('li')!.textContent).toContain('đến lịch ôn lại')
    expect(container.textContent).not.toContain('Xà phòng hoá'); expect(container.textContent).not.toContain('Glucose tráng bạc')
    expect(container.querySelectorAll('li[data-khoa]').length).toBe(2)
  })
  it('thẻ "N dạng đang yếu" chỉ hiện khi có; phần thưởng chưa có ⇒ SẮP MỞ, không bịa trang phục', () => {
    const { container, rerender } = render(<div className="dao"><SoTay profile={hoSo()} now={NOW} danhMuc={DANH_MUC} /></div>)
    expect(screen.getByLabelText('Dạng đang yếu').textContent).toContain('1 dạng đang yếu'); expect(screen.getByLabelText('Dạng đang yếu').textContent).toContain('Lên men')
    expect(screen.getByLabelText('Phần thưởng chương, sắp mở').textContent).toContain('SẮP MỞ'); expect(container.textContent).not.toMatch(/Hoả Diệm|trang phục/i)
    rerender(<div className="dao"><SoTay profile={hoSo([m('ES.TEN', 3)])} now={NOW} danhMuc={DANH_MUC} /></div>)
    expect(screen.queryByLabelText('Dạng đang yếu')).toBeNull()
  })
  it('hồ sơ trống (vừa reset) ⇒ lời mời mở ô đầu tiên, không màn trắng', () => {
    render(<div className="dao"><SoTay profile={hoSo([])} now={NOW} /></div>)
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Sổ tay đang chờ trang đầu tiên'); expect(screen.getByText('LÊN ĐƯỜNG')).toBeTruthy()
  })
})
