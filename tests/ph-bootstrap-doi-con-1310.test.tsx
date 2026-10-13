import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import ParentPortalScreen from '../src/screens/ParentPortalScreen'
import { docPass, xoaPass } from '../src/lib/ph-token'
const api = vi.hoisted(() => ({ xac: vi.fn(), datPass: vi.fn() }))
vi.mock('../src/lib/exam-db', () => ({ loadScriptUrl: async () => '/test' }))
vi.mock('../src/lib/exam-api', () => ({ tenTheoSbd: async () => ({ hoTen: 'Con B', lop: '12' }) }))
vi.mock('../src/lib/ph-token', async (goc) => ({ ...await goc<typeof import('../src/lib/ph-token')>(), xacDinhPhuHuynh: api.xac }))
vi.mock('../src/lib/mom-api', () => ({ datPassPhuHuynh: api.datPass }))
vi.mock('../src/components/ph-v3/AppPhuHuynh', () => ({ default: ({ sbd }: { sbd: string }) => <h1>Con {sbd}</h1> }))
beforeEach(() => { xoaPass(); localStorage.clear(); api.xac.mockReset(); api.datPass.mockReset() })
afterEach(() => { cleanup(); xoaPass(); localStorage.clear() })
const doi = () => {
  let tra!: (v: unknown) => void
  api.xac.mockImplementation(() => new Promise(resolve => { tra = resolve }))
  localStorage.setItem('omr_ph_pass', 'LIEN-KET-GIA-A')
  return { tra: (v: unknown) => tra(v) }
}

it('chọn con B hủy liên kết A đang xác định; A về muộn không đổi con hoặc mã phiên', async () => {
  const cho = doi()
  render(<ParentPortalScreen />)
  await waitFor(() => expect(api.xac).toHaveBeenCalledWith('LIEN-KET-GIA-A'))
  fireEvent.change(screen.getByLabelText('Số báo danh của con'), { target: { value: 'B' } })
  fireEvent.click(screen.getByRole('button', { name: 'Vào xem kết quả của con' }))
  await screen.findByRole('heading', { name: 'Con B' })
  expect(docPass()).toBe('')
  await act(async () => cho.tra({ ok: true, sbd: 'A', hoTen: 'Con A', lop: '12' }))
  expect(screen.getByRole('heading').textContent).toBe('Con B')
  expect(localStorage.getItem('omr_ph_sbd')).toBe('B')
  expect(api.datPass).not.toHaveBeenCalledWith('LIEN-KET-GIA-A')
})

it('rời cổng trong lúc xác định liên kết: phản hồi muộn không ghi đè số báo danh đã chọn ở phiên khác', async () => {
  const cho = doi(), r = render(<ParentPortalScreen />)
  await waitFor(() => expect(api.xac).toHaveBeenCalled())
  r.unmount()
  localStorage.setItem('omr_ph_sbd', 'B')
  await act(async () => cho.tra({ ok: true, sbd: 'A', hoTen: 'Con A', lop: '12' }))
  expect(localStorage.getItem('omr_ph_sbd')).toBe('B')
  expect(api.datPass).not.toHaveBeenCalledWith('LIEN-KET-GIA-A')
})
