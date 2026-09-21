// BẢNG TIN THẦY · "Chưa học hôm nay" (Boss chuyển lệnh thầy 21/09): thần thú mỗi ngày Điều 8 — app học sinh KHÔNG nêu tên em ít học, tên các em CHƯA HỌC theo lớp chỉ hiện ở Bảng tin của thầy.
// Khối `chuaHocHomNay` (Code 3, đúng thân `gvChuaHocHomNay`): một dòng 48 px dưới "Em cần thầy để ý" + tấm bên có tên từng lớp; chạm tên ⇒ Toàn cảnh một em. Chỉ ĐỌC: không nút việc, không thêm cuộn ở trang chính.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import { MAU_DAY } from './fixtures/bang-tin-mau'
import { docBangTin, docChuaHoc } from '../src/lib/bang-tin-thay'
import BangTinV3 from '../src/components/bang-tin/BangTin'

afterEach(() => cleanup())
const NAY = Date.parse('2026-09-21T07:20:00.000Z')

const KHOI = {
  ngay: '2026-09-21',
  theoLop: [
    { lop: '12A1', siSo: 30, chuaHoc: 3, em: [{ sbd: '1', hoTen: 'Nguyễn An' }, { sbd: '2', hoTen: 'Trần Bình' }, { sbd: '3', hoTen: 'Lê Chi' }] },
    { lop: '12A2', siSo: 28, chuaHoc: 5, em: [{ sbd: '4', hoTen: 'Vũ Dũng' }, { sbd: '5', hoTen: 'Đỗ Em' }] },
    { lop: '11B', siSo: 25, chuaHoc: 1, em: [{ sbd: '6', hoTen: 'Hà Giang' }] },
  ],
}
const bt = (extra: Record<string, unknown> = {}) => docBangTin({ ...MAU_DAY, ...extra } as Record<string, unknown>)!
const dung = (extra: Record<string, unknown> = { chuaHocHomNay: KHOI }) => {
  const onMoEm = vi.fn()
  const r = render(<BangTinV3 du={bt(extra)} nayMs={NAY} dsTraCuu={[]} onMoEm={onMoEm} onMoCa={() => {}} />)
  return { ...r, onMoEm }
}

describe('docChuaHoc — đọc khối máy chủ, khoan dung nhưng không bịa', () => {
  it('đọc thân {theoLop} hoặc thẳng mảng lớp; số em chưa học tối thiểu bằng số tên có; sĩ số tối thiểu bằng số chưa học', () => {
    const a = docChuaHoc(KHOI)!
    expect(a.map((l) => [l.lop, l.chuaHoc, l.siSo, l.em.length])).toEqual([['12A1', 3, 30, 3], ['12A2', 5, 28, 2], ['11B', 1, 25, 1]])
    expect(docChuaHoc(KHOI.theoLop)).toEqual(a)
    const thap = docChuaHoc({ theoLop: [{ lop: 'X', siSo: 1, chuaHoc: 1, em: [{ sbd: '1', hoTen: 'A' }, { sbd: '2', hoTen: 'B' }] }] })!
    expect(thap[0]).toMatchObject({ chuaHoc: 2, siSo: 2 })
  })

  it('bỏ lớp thiếu tên lớp hoặc không có em nào; bỏ em thiếu sbd/tên; không còn lớp nào ⇒ null (ẩn khối, không nói "cả lớp đã học")', () => {
    expect(docChuaHoc({ theoLop: [{ lop: '', siSo: 3, chuaHoc: 1, em: [{ sbd: '1', hoTen: 'A' }] }, { lop: 'L', siSo: 3, chuaHoc: 1, em: [] }, { lop: 'M', siSo: 3, chuaHoc: 1, em: [{ sbd: '', hoTen: 'A' }, { sbd: '2', hoTen: '' }] }] })).toBeNull()
    expect(docChuaHoc({ theoLop: [null, 5, 'x', { lop: 'K', siSo: 2, chuaHoc: 1, em: [{ sbd: '9', hoTen: 'Z' }] }] })!.map((l) => l.lop)).toEqual(['K']) // phần tử rác trong mảng không làm hỏng cả khối
    expect(docChuaHoc({ theoLop: [] })).toBeNull()
    expect(docChuaHoc(undefined)).toBeNull()
    expect(docChuaHoc('x')).toBeNull()
    expect(docChuaHoc({ theoLop: [{ lop: 'M', siSo: 3, chuaHoc: 2, em: [{ sbd: '', hoTen: 'A' }, { sbd: '2', hoTen: 'B' }] }] })![0].em).toEqual([{ sbd: '2', hoTen: 'B' }])
  })

  it('docBangTin: key vắng ⇒ chuaHoc null; có ⇒ mảng; các khối khác không đổi', () => {
    expect(docBangTin(MAU_DAY as Record<string, unknown>)!.chuaHoc).toBeNull()
    expect(bt({ chuaHocHomNay: KHOI }).chuaHoc).toHaveLength(3)
  })
})

describe('Bảng tin · dòng "Chưa học hôm nay"', () => {
  it('có dữ liệu ⇒ MỘT dòng nút có tổng số em + hai lớp đầu (số chưa học/sĩ số) + "+N lớp"; nằm trong ô "Em cần thầy để ý"', () => {
    const { container } = dung()
    const dong = container.querySelector('[data-khoi="chua-hoc-hom-nay"]') as HTMLElement
    expect(dong).toBeTruthy()
    expect(dong.closest('[data-khoi="can-de-y"]')).toBeTruthy()
    expect(dong.tagName).toBe('BUTTON')
    expect(dong.textContent).toContain('Chưa học hôm nay: 9 em')
    expect(dong.textContent).toContain('12A1 3/30 · 12A2 5/28 · +1 lớp')
  })

  it('đúng hai lớp ⇒ không có "+N lớp"; một lớp ⇒ chỉ lớp đó', () => {
    const hai = dung({ chuaHocHomNay: { theoLop: KHOI.theoLop.slice(0, 2) } })
    expect(hai.container.querySelector('[data-khoi="chua-hoc-hom-nay"]')!.textContent).not.toContain('lớp')
    cleanup()
    const mot = dung({ chuaHocHomNay: { theoLop: KHOI.theoLop.slice(2) } })
    expect(mot.container.querySelector('[data-khoi="chua-hoc-hom-nay"]')!.textContent).toBe('Chưa học hôm nay: 1 em11B 1/25')
  })

  it('máy chủ chưa trả khối / không có em nào chưa học ⇒ KHÔNG có dòng (không bịa "cả lớp đã học")', () => {
    for (const extra of [{}, { chuaHocHomNay: { theoLop: [] } }]) {
      const { container } = dung(extra)
      expect(container.querySelector('[data-khoi="chua-hoc-hom-nay"]')).toBeNull()
      cleanup()
    }
  })

  it('không thêm nút việc cho thầy: dòng chỉ MỞ tấm bên; chưa mở thì trang chính không có tên em nào của khối này', () => {
    const { container } = dung()
    expect(container.textContent).not.toContain('Nguyễn An')
    expect(container.querySelector('[data-khoi="tam-ben"]')).toBeNull()
  })
})

describe('Bảng tin · tấm bên "Chưa học hôm nay"', () => {
  const mo = () => {
    const r = dung()
    fireEvent.click(r.container.querySelector('[data-khoi="chua-hoc-hom-nay"]') as HTMLElement)
    const tam = r.container.querySelector('[data-khoi="tam-ben"]') as HTMLElement
    return { ...r, tam }
  }

  it('bấm dòng ⇒ tấm bên có tiêu đề, dòng phụ (theo lớp, số chưa học/sĩ số, tính đến giờ cập nhật) và tên từng lớp', () => {
    const { tam } = mo()
    expect(tam).toBeTruthy()
    const t = within(tam)
    expect(t.getByRole('heading', { name: 'Chưa học hôm nay' })).toBeTruthy()
    expect(tam.textContent).toMatch(/Theo lớp: số em chưa học \/ sĩ số · tính đến \d{2}:\d{2}\./)
    expect(t.getByRole('heading', { name: '12A1 · 3/30 em chưa học' })).toBeTruthy()
    expect(t.getByRole('heading', { name: '12A2 · 5/28 em chưa học' })).toBeTruthy()
    expect(t.getByRole('heading', { name: '11B · 1/25 em chưa học' })).toBeTruthy()
    for (const ten of ['Nguyễn An', 'Trần Bình', 'Lê Chi', 'Vũ Dũng', 'Đỗ Em', 'Hà Giang']) expect(t.getByText(ten)).toBeTruthy()
  })

  it('mỗi tên là MỘT nút có tên đọc rõ; chạm ⇒ đóng tấm bên rồi mở Toàn cảnh đúng em', () => {
    const { tam, onMoEm, container } = mo()
    const nut = within(tam).getByRole('button', { name: 'Vũ Dũng · 12A2 — chưa học hôm nay, mở toàn cảnh' })
    fireEvent.click(nut)
    expect(onMoEm).toHaveBeenCalledWith('4')
    expect(container.querySelector('[data-khoi="tam-ben"]')).toBeNull()
  })

  it('Esc đóng tấm bên; không có lớp nào bị lặp và không có tên em ngoài khối', () => {
    const { tam, container } = mo()
    expect(tam.querySelectorAll('section.bt3-chua-lop')).toHaveLength(3)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(container.querySelector('[data-khoi="tam-ben"]')).toBeNull()
  })
})

describe('Bảng tin · nguồn', () => {
  const doc = (f: string) => fs.readFileSync(path.join(process.cwd(), f), 'utf8')
  it('CSS: dòng cao ≥ 48, chữ ≥ 13, không mã màu thô; tên dòng phụ tối đa 2 dòng (không cắt "…" một dòng)', () => {
    const css = doc('src/styles/bang-tin-v3.css')
    const khoi = css.slice(css.indexOf('.bt3-chua-hoc {'), css.indexOf('/* ── tấm bên'))
    expect(khoi).toMatch(/min-height: 48px/)
    expect([...khoi.matchAll(/font-size: (\d+)px/g)].every((m) => Number(m[1]) >= 13)).toBe(true)
    expect(khoi).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    expect(khoi).toMatch(/line-clamp: 2/)
    expect(khoi).not.toMatch(/text-overflow: ellipsis/)
  })
  it('máy thầy không có nút nào "giao/nhắc" cho khối này: chỉ có onMoChuaHoc (mở tấm bên) và onMoEm (toàn cảnh)', () => {
    const t = doc('src/components/bang-tin/cac-khoi.tsx')
    const dong = t.slice(t.indexOf('export function DongChuaHoc'), t.indexOf('export function HangChuaHoc'))
    expect(dong).not.toMatch(/nhắc|giao|gửi/i)
  })
})
