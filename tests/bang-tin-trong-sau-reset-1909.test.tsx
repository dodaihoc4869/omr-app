// SỬA LỖI (Code 4, theo Code 2 · 19/09): thầy xoá toàn bộ dữ liệu học sinh 00:01 thứ Hai 21/09 → mọi màn HS/PH phải đẹp khi dữ liệu TRỐNG.
// (1) BangTinPhuHuynh: máy chủ trả ok mà KHÔNG có `report` (vừa reset, chưa dựng bản tin) → `report` mãi null → vòng quay
//     "Đang tổng hợp…" quay VÔ HẠN (Code 2 đo: còn quay sau 3,5 s, cả HS lẫn PH, sáng lẫn tối). Nay: tải xong mà chưa có bản tin → nói
//     thật, không quay; tải xong mà lỗi mạng → chỉ dải cảnh báo; đang tải lần đầu → vòng quay, xưng đúng người (HS "em", PH "con").
// (2) Bảng vinh danh trong Bảng tin: dải 4 màu Google + chữ "DẤU ẤN MỖI NGÀY" (--vd-vang = #fbbc04 trên nền sáng 1,71:1) — chỉ ở bản M3.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import BangTinPhuHuynh from '../src/components/BangTinPhuHuynh'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))

const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const REPORT = {
  day: '2026-09-21', updatedAt: '2026-09-21T00:01:00Z', today: [], weak: [], wrong: 0, pending: 0, pendingDetails: { btvn: 0, mom: 0, daily: 0 },
  questionCount: 0, assignmentCount: 0, minutes: 0, mode: 'on_lai', reason: '',
}
type Cach = 'khong-report' | 'co-report' | 'loi' | { cho: Promise<void> }
/** `cach` có thể đổi giữa chừng qua `doi.cach`. */
function mayChu(cach: Cach) {
  const doi = { cach }
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    const u = new URL(String(url)).pathname
    const ok = (b: unknown) => ({ ok: true, status: 200, json: async () => b, text: async () => JSON.stringify(b) })
    if (!u.includes('-news/')) return ok({ ok: true, winners: [], day: '2026-09-21', live: true })
    if (typeof doi.cach === 'object') await doi.cach.cho
    const c = doi.cach
    if (c === 'loi') throw new TypeError('Failed to fetch')
    return ok(c === 'co-report' ? { ok: true, report: REPORT, daily: null } : { ok: true, daily: null })
  }))
  return doi
}
const dung = (hs: boolean, sbd = '12001') => render(<BangTinPhuHuynh sbd={sbd} studentToken={hs ? 't' : undefined} hoTen="Minh" lop="12A1" onSent={() => {}} tabStats={{ diemCount: 0 }} caGanNhat={null} />)
const CHUA_CO = 'Chưa có bản tin hôm nay. Bản tin mới lúc 00:01 mỗi ngày.'

describe('(1) tải xong mà chưa có bản tin: không quay vô hạn', () => {
  for (const hs of [true, false]) {
    it(`${hs ? 'học sinh' : 'phụ huynh'}: máy chủ ok không kèm report → nói thật "${CHUA_CO}", hết vòng quay, nút cập nhật vẫn còn`, async () => {
      mayChu('khong-report')
      const { container } = dung(hs)
      await screen.findByText(CHUA_CO)
      expect(screen.queryByText(/Đang tổng hợp/)).toBeNull()
      expect(container.querySelector('.animate-spin')).toBeNull()
      expect(screen.getByRole('button', { name: 'Cập nhật bảng tin' })).toBeTruthy()
      expect(screen.queryByRole('alert')).toBeNull()
    })
  }

  it('đang tải LẦN ĐẦU: vòng quay + xưng đúng người (học sinh "của em", phụ huynh "của con"); về sau hết quay', async () => {
    let mo!: () => void
    const doi = mayChu({ cho: new Promise<void>((r) => (mo = r)) })
    const a = dung(true)
    expect(await screen.findByText('Đang tổng hợp dữ liệu học tập của em…')).toBeTruthy()
    expect(a.container.querySelector('.animate-spin')).toBeTruthy()
    a.unmount()
    dung(false)
    expect(await screen.findByText('Đang tổng hợp dữ liệu học tập của con…')).toBeTruthy()
    doi.cach = 'khong-report'
    mo()
    await screen.findByText(CHUA_CO)
    expect(screen.queryByText(/Đang tổng hợp/)).toBeNull()
  })

  it('lỗi mạng ở lần tải đầu: chỉ dải cảnh báo (role=alert), KHÔNG vòng quay, KHÔNG câu "chưa có bản tin" (chưa biết là có hay không)', async () => {
    mayChu('loi')
    const { container } = dung(true)
    expect((await screen.findByRole('alert')).textContent).toContain('Failed to fetch')
    expect(container.querySelector('.animate-spin')).toBeNull()
    expect(screen.queryByText(CHUA_CO)).toBeNull()
    expect(screen.queryByText(/Đang tổng hợp/)).toBeNull()
  })

  it('bấm Cập nhật sau khi máy chủ dựng xong bản tin → bản tin hiện ra, câu "chưa có" biến mất', async () => {
    const doi = mayChu('khong-report')
    dung(false)
    await screen.findByText(CHUA_CO)
    doi.cach = 'co-report'
    fireEvent.click(screen.getByRole('button', { name: 'Cập nhật bảng tin' }))
    await screen.findByText('Ngày 21/09/2026')
    expect(screen.queryByText(CHUA_CO)).toBeNull()
  })

  it('có bản tin ngay: không câu "chưa có", không vòng quay (không hồi quy)', async () => {
    mayChu('co-report')
    const { container } = dung(true)
    await screen.findByText('Ngày 21/09/2026')
    expect(screen.queryByText(CHUA_CO)).toBeNull()
    expect(container.querySelector('.animate-spin')).toBeNull()
  })

  it('đổi số báo danh (đổi con): tải lại từ đầu → vòng quay trở lại, không giữ trạng thái "đã tải" của em trước', async () => {
    const doi = mayChu('khong-report')
    const { rerender } = dung(false, '12001')
    await screen.findByText(CHUA_CO)
    let mo!: () => void
    doi.cach = { cho: new Promise<void>((r) => (mo = r)) }
    rerender(<BangTinPhuHuynh sbd="12002" hoTen="Nam" lop="12A1" onSent={() => {}} tabStats={{ diemCount: 0 }} caGanNhat={null} />)
    expect(await screen.findByText('Đang tổng hợp dữ liệu học tập của con…')).toBeTruthy()
    expect(screen.queryByText(CHUA_CO)).toBeNull()
    doi.cach = 'khong-report'
    mo()
    await screen.findByText(CHUA_CO)
  })
})

describe('(2) bảng vinh danh trong Bảng tin: dải 4 màu + chữ vàng chỉ đổi ở bản M3', () => {
  const css = doc('src/components/m3/bang-tin.css').replace(/\/\*[\s\S]*?\*\//g, '')
  const luat = (chon: string) => [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].find((m) => m[1].split(',').map((s) => s.trim()).includes(chon))?.[2] ?? ''

  it('bang-tin.css: `.m3 .honors:before` ẩn; chữ DẤU ẤN MỖI NGÀY lấy --m3-tren-canh-bao (tối trên sáng / vàng nhạt trên tối); biểu tượng theo màu chữ', () => {
    expect(luat('.m3 .honors:before')).toMatch(/display:\s*none/)
    expect(luat('.m3 .honors-eyebrow')).toMatch(/color:\s*var\(--m3-tren-canh-bao\)/)
    expect(luat('.m3 .honors-eyebrow svg')).toMatch(/color:\s*inherit/)
  })

  it('tương phản thẻ vinh danh (Code 2 đo 21/09): nhãn TOP n + điểm + tên hạng 1 đọc theo cặp cảnh báo M3; tên hạng 1 đặt CẢ nền lẫn chữ (không dựa `.dark`)', () => {
    expect(luat('.m3 .honors .honors-rank')).toMatch(/color:\s*var\(--m3-tren-canh-bao\)/)
    expect(luat('.m3 .honors .honors-rank')).toMatch(/font-weight:\s*800/)
    const diem = luat('.m3 .honors .honors-score')
    expect(diem).toMatch(/color:\s*var\(--m3-tren-canh-bao\)/)
    const ten = luat('.m3 .honors .honors-rank-1 .honors-name')
    expect(ten).toMatch(/background:\s*var\(--m3-canh-bao-nen\)/)
    expect(ten).toMatch(/color:\s*var\(--m3-tren-canh-bao\)/)
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
  })

  it('bảng vinh danh nằm TRONG gốc `m3` của Bảng tin ở cả hai vai', async () => {
    for (const hs of [true, false]) {
      mayChu('co-report')
      const { container, unmount } = dung(hs)
      await screen.findByText('Ngày 21/09/2026')
      expect(container.querySelector('.honors')!.closest('.m3')).toBeTruthy()
      unmount()
    }
  })

  it('app giáo viên không đổi màu: BangVinhDanh.css còn dải 4 màu + chữ vàng, nay qua token `--vd-*` (tokens.css giữ ĐÚNG giá trị cũ; chỉ luật `.m3 …` mới ghi đè)', () => {
    const css = doc('src/components/BangVinhDanh.css'), tk = doc('src/styles/tokens.css')
    expect(css).toContain('Google 4-color top stripe')
    expect(css).toMatch(/\.honors-eyebrow \{[^}]*color: var\(--vd-vang\)/)
    expect(css).toContain('linear-gradient(90deg, var(--vd-xanh) 0 25%, var(--vd-do) 25% 50%, var(--vd-vang) 50% 75%, var(--vd-luc) 75%)')
    // Giá trị của token = đúng mã màu cũ của app thầy (không đổi màu, chỉ đổi chỗ đứng).
    for (const [ten, mau] of [['vang', '#fbbc04'], ['xanh', '#4285f4'], ['do', '#ea4335'], ['luc', '#34a853']]) expect(tk).toContain(`--vd-${ten}: ${mau};`)
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
  })
})
