// Việc C · C8 (Code 4): sheet Bảng tin (BangTinPhuHuynh) — chỉ học sinh + phụ huynh dùng (TSX), nhưng BangTinPhuHuynh.css còn được
// BangTinGiaoVien (app giáo viên) import nên KHÔNG sửa; bộ mặt M3 đến bằng lớp `m3` + bang-tin.css (mọi luật có tiền tố `.m3 `).
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import BangTinPhuHuynh from '../src/components/BangTinPhuHuynh'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))

const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
const datDuong = (d: string) => window.history.replaceState(null, '', d)
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  datDuong('/')
})

const REPORT = {
  day: '2026-09-19', updatedAt: '2026-09-19T08:00:00Z', today: [{ tenCa: 'Ca Ancol', diem: 9.5, nopLuc: '2026-09-15T10:00:00Z' }], weak: [], wrong: 5, pending: 3,
  pendingDetails: { btvn: 1, mom: 1, daily: 1 }, questionCount: 8, assignmentCount: 1, minutes: 12, mode: 'on_lai', reason: 'Ôn lại các câu vừa sai.',
}
function giaLap(daily: unknown = null) {
  const cuoc: string[] = []
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    const u = new URL(String(url)).pathname
    cuoc.push(u)
    const b = u.includes('-news/') ? { ok: true, report: REPORT, daily, questionCount: 8, id: 'x1' } : { ok: true, winners: [], day: '2026-09-19', live: true }
    return { ok: true, status: 200, json: async () => b, text: async () => JSON.stringify(b) }
  }))
  return cuoc
}
const dung = (o: { hs?: boolean; onSelectTab?: (t: string) => void } = {}) =>
  render(<BangTinPhuHuynh sbd="12001" studentToken={o.hs === false ? undefined : 't'} hoTen="Minh" lop="12A1" onSent={() => {}} onSelectTab={o.onSelectTab} tabStats={{ diemCount: 5 }} caGanNhat={{ maCa: 'CA-ANCOL', tenCa: 'Ca Ancol', diem: 9.5 }} />)

describe('BangTinPhuHuynh dưới M3', () => {
  it('khối bảng tin nằm trong gốc `m3`; bảng vinh danh (thành phần khác) KHÔNG bị bọc; nút chính là nút M3', async () => {
    datDuong('/?vai=hocsinh')
    giaLap()
    const { container } = dung()
    await screen.findByText('Bảng tin học tập của em')
    const the = container.querySelector('.parent-news') as HTMLElement
    expect(the.parentElement!.classList.contains('m3')).toBe(true)
    expect(container.querySelector('.honors')!.closest('.m3')).toBeNull()
    const cta = await screen.findByRole('button', { name: 'Bắt đầu bài luyện hôm nay' })
    expect(cta.className).toContain('m3-nut-chinh')
    expect(cta.getAttribute('data-vai-tro')).toBeNull()
    expect(container.querySelector('.m3-an')).toBeTruthy() // vầng sáng nhấp nháy của thẻ điểm ẩn dưới M3
  })

  it('phụ huynh: nút "Giao bài theo đề xuất" bấm gọi /parent-news/assign; đã hoàn thành → nút tonal tertiary, khoá', async () => {
    datDuong('/?vai=phuhuynh')
    const cuoc = giaLap()
    dung({ hs: false })
    const giao = await screen.findByRole('button', { name: 'Giao bài theo đề xuất' })
    expect(giao.className).toContain('m3-nut-chinh')
    fireEvent.click(giao)
    await waitFor(() => expect(cuoc).toContain('/parent-news/assign'))
    cleanup()
    giaLap({ id: 'd1', submitted_at: '2026-09-19T09:00:00Z' })
    dung({ hs: false })
    const xong = await screen.findByRole('button', { name: 'Đã hoàn thành bài hôm nay' })
    expect(xong.className).toContain('m3-nut-tonal')
    expect(xong.getAttribute('data-vai-tro')).toBe('tertiary')
    expect((xong as HTMLButtonElement).disabled).toBe(true)
  })

  it('thẻ điểm ca gần nhất bấm được → onSelectTab("diem"); ba ô chỉ số và chữ nhãn còn đủ', async () => {
    datDuong('/?vai=hocsinh')
    giaLap()
    const onSelectTab = vi.fn()
    dung({ onSelectTab })
    fireEvent.click((await screen.findByText('Điểm ca thi gần nhất')).closest('button')!)
    expect(onSelectTab).toHaveBeenCalledWith('diem')
    for (const t of ['Bài hôm nay', 'Câu cần ôn', 'Chờ làm']) expect(screen.getByText(t)).toBeTruthy()
  })

  it('không còn mã màu tuỳ ý (#hex, [#…]), không emoji; dải 4 màu ẩn', () => {
    const t = doc('src/components/BangTinPhuHuynh.tsx')
    expect(t).not.toMatch(/#[0-9a-fA-F]{6}\b/)
    expect(t).not.toMatch(/\[#/)
    expect(t).not.toMatch(/✨/)
  })
})

describe('bang-tin.css và tệp CSS dùng chung với giáo viên', () => {
  it('bang-tin.css: mọi bộ chọn `.m3 `, không !important, không #hex; BangTinPhuHuynh.css (BangTinGiaoVien còn import) KHÔNG bị đụng tới `.m3`', () => {
    const css = doc('src/components/m3/bang-tin.css').replace(/\/\*[\s\S]*?\*\//g, '')
    expect(css).not.toContain('!important')
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    for (const m of css.matchAll(/([^{}]+)\{/g)) for (const s of m[1].split(',')) expect(s.trim().startsWith('.m3 '), s).toBe(true)
    expect(doc('src/components/BangTinPhuHuynh.css')).not.toContain('.m3')
    expect(doc('src/components/BangTinGiaoVien.tsx')).toContain("import './BangTinPhuHuynh.css'")
  })
})
