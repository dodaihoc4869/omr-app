import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import ManChiTietCa from '../src/components/ph-v3/ManChiTietCa'
import { CHI_TIET } from './_ph-moi/du-lieu-mau'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
vi.mock('../src/lib/ph-token', () => ({ docPass: () => '' }))
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe('phụ huynh mở lại lời giải sau mất mạng', () => {
  it('thu gọn và mở lại câu lỗi sẽ thử tải lại, không giữ lỗi mãi', async () => {
    let soLanLoiGiai = 0
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (String(url).endsWith('/ph/bao-cao-ca')) return Response.json({
        ok: true, ca: { maCa: 'CA-1', tenCa: 'Ca đã công bố', nopLuc: '2026-10-13T10:00:00Z' },
        congBo: { congBo: 'ngay', daCongBo: true, soEmDaNop: 1, soEmDaVao: 1 },
        ketQua: { tong: 7, soCau: 1, soCauDung: 0 },
        cauCanXemLai: [{ qid: 'Q7', phan: 'I', soCau: 7, de: 'Câu cần chữa', dapAnChon: 'A', dapAnDung: 'B', loiGiai: '', laDungNhungLau: false }],
      })
      soLanLoiGiai++
      if (soLanLoiGiai === 1) throw new TypeError('Mất mạng')
      return Response.json(CHI_TIET)
    }))
    const { container } = render(<ManChiTietCa sbd="A" maCa="CA-1" />)
    fireEvent.click(await screen.findByRole('button', { name: 'Lời giải' }))
    await screen.findByText(/Chưa mở được lời giải câu này/)
    fireEvent.click(screen.getByRole('button', { name: 'Thu gọn' }))
    fireEvent.click(screen.getByRole('button', { name: 'Lời giải' }))
    await waitFor(() => expect(soLanLoiGiai).toBe(2))
    await waitFor(() => expect(container.querySelectorAll('.ph3-pa li').length).toBe(4))
    expect(screen.queryByText(/Chưa mở được lời giải câu này/)).toBeNull()
  })
})
