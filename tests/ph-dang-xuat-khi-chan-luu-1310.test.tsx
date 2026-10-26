import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import ParentPortalScreen from '../src/screens/ParentPortalScreen'
import { docPass, luuPass, xoaPass } from '../src/lib/ph-token'
import './_ph-nap-trang-cu' // trang cũ nạp lười (26/10): chờ mảnh về trước các test

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
vi.mock('../src/lib/exam-db', () => ({ loadScriptUrl: async () => '/test' }))
vi.mock('../src/lib/exam-api', () => ({ tenTheoSbd: async () => ({ hoTen: 'Con A', lop: '12' }) }))
vi.mock('../src/components/ph-v3/AppPhuHuynh', () => ({ default: ({ onDoiSbd }: { onDoiSbd: () => void }) => <button type="button" onClick={onDoiSbd}>Đổi số báo danh</button> }))
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); xoaPass(); localStorage.clear() })

describe('cổng phụ huynh trên máy chặn lưu', () => {
  it('đổi số báo danh vẫn thoát báo cáo và xóa liên kết riêng khi không xóa được bộ nhớ máy', async () => {
    luuPass('LIEN-KET-GIA-A')
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ ok: true, sbd: 'A', hoTen: 'Con A', lop: '12' })))
    render(<ParentPortalScreen />)
    const nut = await screen.findByRole('button', { name: 'Đổi số báo danh' })
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new DOMException('Máy chặn lưu', 'SecurityError') })
    fireEvent.click(nut)
    expect(screen.getByLabelText('Số báo danh của con')).toBeTruthy()
    expect(docPass()).toBe('')
  })

  it('bộ nhớ máy không đọc được: vẫn cho nhập số báo danh, không lỗi khởi động ngoài màn', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new DOMException('Máy chặn đọc', 'SecurityError') })
    render(<ParentPortalScreen />)
    fireEvent.change(screen.getByLabelText('Số báo danh của con'), { target: { value: 'B' } })
    fireEvent.click(screen.getByRole('button', { name: 'Vào xem kết quả của con' }))
    expect(await screen.findByRole('button', { name: 'Đổi số báo danh' })).toBeTruthy()
  })
})
