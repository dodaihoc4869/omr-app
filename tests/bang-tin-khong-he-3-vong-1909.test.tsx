// SỬA LỖI: Bảng tin (BangTinPhuHuynh — học sinh + phụ huynh) còn ba huy hiệu "V1 · Lõi sửa lỗi / V2 · Chống quên / V3 · Thử thách" của hệ
// 3 VÒNG BTVN mà thầy đã bỏ 19/09 (thay bằng lô theo ngày/giờ). Số liệu là kế hoạch hôm nay: sửa lỗi · ôn bài cũ · câu tiến bộ.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import BangTinPhuHuynh from '../src/components/BangTinPhuHuynh'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const REPORT = {
  day: '2026-09-19', updatedAt: '2026-09-19T08:00:00Z', today: [], weak: [], wrong: 5, pending: 0, questionCount: 8, assignmentCount: 1, minutes: 12, mode: 'on_lai', reason: 'Ôn lại các câu vừa sai.',
  keHoach: { tongCau: 8, soCauSuaLoi: 4, soCauOnBaiCu: 2, soCauTienBo: 2, phuongPhap: 'x' },
}

describe('Bảng tin: kế hoạch hôm nay không còn nhãn V1/V2/V3', () => {
  for (const vai of ['học sinh', 'phụ huynh']) {
    it(`${vai}: nói sửa lỗi · ôn bài cũ · câu tiến bộ kèm đúng số câu, không "V1/V2/V3", "Lõi", "Chống quên", "Thử thách"`, async () => {
      vi.stubGlobal('fetch', vi.fn(async (url: string) => {
        const u = String(url)
        const b = u.includes('-news/') ? { ok: true, report: REPORT, daily: null } : { ok: true, winners: [], day: '2026-09-19', live: true }
        return { ok: true, status: 200, json: async () => b, text: async () => JSON.stringify(b) }
      }))
      const { container } = render(<BangTinPhuHuynh sbd="12001" studentToken={vai === 'học sinh' ? 't' : undefined} onSent={() => {}} />)
      await screen.findByText(/Sửa lỗi/)
      const chu = container.textContent || ''
      expect(chu).toMatch(/4c\s*Sửa lỗi/)
      expect(chu).toMatch(/2c\s*Ôn bài cũ/)
      expect(chu).toMatch(/2c\s*Câu tiến bộ/)
      expect(chu).not.toMatch(/\bV[123]\b|Lõi|Chống quên|Thử thách/)
    })
  }

  it('mã nguồn không còn huy hiệu V1/V2/V3 và chú thích 3 vòng phân tầng', () => {
    const nd = fs.readFileSync(path.join(process.cwd(), 'src/components/BangTinPhuHuynh.tsx'), 'utf8')
    expect(nd).not.toMatch(/>V[123]</)
    expect(nd).not.toMatch(/3 VÒNG|Lõi sửa lỗi|Chống quên/)
  })
})
