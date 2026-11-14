// @vitest-environment jsdom
// MÁY THẦY · THI ĐUA ĐỘI TUẦN (bản vẽ 17): dòng «Đội X thắng n / m ván tuần này» — đội nhiều ván thắng nhất (bằng nhau ⇒ đội đứng trước); chưa đội nào thắng ⇒ ẩn.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'

const tra = vi.hoisted(() => ({ du: {} as Record<string, unknown> }))
vi.mock('../src/lib/goi-lenh-thay', () => ({ goiLenh: async () => ({ ok: true, du: tra.du }) }))
import ThiDuaTuanThay from '../src/components/live-khoi/ThiDuaTuanThay'

const GOC = { ok: true, tuan: '2026-11-09', chuTuan: '09/11 – 15/11', doi: [388, 412, 301, 276], soEm: 40, danhHieuTuanTruoc: [] }
afterEach(() => { cleanup() })

describe('dòng ván thắng của đội', () => {
  it('hiện đội nhiều ván thắng nhất, tên đội tô màu đội', async () => {
    tra.du = { ...GOC, danhHieuTuanNay: [{ loai: 'tho-san', ten: 'Thợ săn tuần', nguoi: ['Gia Bảo'], so: 58 }], van: [14, 14, 12, 14], thang: [3, 9, 2, 0] }
    render(<ThiDuaTuanThay khoi={11} onDong={() => {}} />)
    const li = await screen.findByText((_, el) => el?.tagName === 'LI' && el.textContent === 'Đội Kali thắng 9 / 14 ván tuần này')
    expect(li.getAttribute('style')).toContain('--p-tim-2')
    expect(screen.getByText('Thợ săn tuần:')).toBeTruthy()
  })
  it('bằng nhau ⇒ đội đứng trước; không có danh hiệu vẫn hiện dòng, không hiện «Chưa có ván»', async () => {
    tra.du = { ...GOC, danhHieuTuanNay: [], van: [5, 5, 4, 0], thang: [2, 2, 1, 0] }
    render(<ThiDuaTuanThay khoi={11} onDong={() => {}} />)
    await screen.findByText((_, el) => el?.tagName === 'LI' && el.textContent === 'Đội Natri thắng 2 / 5 ván tuần này')
    expect(screen.queryByText(/Chưa có ván nào/)).toBeNull()
  })
  it('chưa đội nào thắng ván nào (hoặc máy chủ cũ không trả số) ⇒ không hiện dòng', async () => {
    tra.du = { ...GOC, danhHieuTuanNay: [], van: [3, 3, 0, 0], thang: [0, 0, 0, 0] }
    render(<ThiDuaTuanThay khoi={11} onDong={() => {}} />)
    await screen.findByText(/Chưa có ván nào/)
    expect(screen.queryByText(/ván tuần này/)).toBeNull()
    cleanup()
    tra.du = { ...GOC, danhHieuTuanNay: [{ loai: 'tho-san', ten: 'Thợ săn tuần', nguoi: ['Gia Bảo'], so: 5 }] }
    render(<ThiDuaTuanThay khoi={11} onDong={() => {}} />)
    await screen.findByText('Thợ săn tuần:')
    expect(screen.queryByText(/ván tuần này/)).toBeNull()
  })
})
