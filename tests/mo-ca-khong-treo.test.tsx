import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
const m = vi.hoisted(() => ({ publish: vi.fn(), save: vi.fn(), address: vi.fn(), toast: vi.fn() }))
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: m.address }))
vi.mock('../src/lib/exam-api', async original => ({ ...await original<any>(), publishSession: m.publish }))
vi.mock('../src/lib/exam-db', async original => ({
  ...await original<any>(), loadScriptUrl: async () => '', loadTeacherSecret: async () => 'test-only',
  loadAllSessionTeacherBanks: async () => [], saveSessionTeacherBank: m.save,
  loadExamSources: async () => [{ maDe: '10-C1-B1', nhom: '10', nguon: 'Đề thử', phanI: [], phanII: [], phanIII: [{id:'q1',text:'Một câu',correct:'3'}] }],
}))
vi.mock('../src/lib/exam-sync', () => ({ dongBoNganHang: async () => null }))
vi.mock('../src/components/NutDongBo', () => ({ default: () => null }))
vi.mock('../src/store/appStore', () => ({ useAppStore: (sel:any) => sel({showToast:m.toast,classList:[],setScreen:vi.fn(),moChiTietCa:vi.fn()}) }))
import ExamSetupScreen from '../src/screens/ExamSetupScreen'
beforeEach(() => {
  m.address.mockResolvedValue('https://test.example');m.publish.mockResolvedValue({batDau:'2026-09-18T10:00:00Z',hetHanVao:''});m.save.mockResolvedValue(undefined)
})
afterEach(() => {cleanup();vi.useRealTimers();vi.clearAllMocks();vi.unstubAllGlobals()})
async function prepare() {
 render(<ExamSetupScreen />)
 fireEvent.change(screen.getByPlaceholderText('Nhập lớp…'),{target:{value:'TEST'}})
 const button = screen.getByRole('button',{name:/Mở ca kiểm tra ngay/})
 await waitFor(() => expect((button as HTMLButtonElement).disabled).toBe(false))
 return button
}
it('không có URL lưu cũ vẫn tạo được ca và không tải cấu hình để dựng link',async()=>{
 const f=vi.fn(() => new Promise(()=>{}));vi.stubGlobal('fetch',f)
 fireEvent.click(await prepare())
 expect(await screen.findByRole('heading',{name:'Ca kiểm tra đã mở'})).toBeTruthy()
 expect(m.publish.mock.calls[0][0]).toBe('https://test.example')
 expect(f).not.toHaveBeenCalled()
})
it.each(['pending','rejected'])('đã lưu trên máy chủ vẫn hiện ca khi bản sao cục bộ %s',async state=>{
 m.save.mockImplementation(() => state==='pending'?new Promise(()=>{}):Promise.reject(new Error('QuotaExceededError')))
 const button=await prepare();vi.useFakeTimers();fireEvent.click(button)
 await act(async()=>{await vi.advanceTimersByTimeAsync(0)})
 expect(screen.getByRole('heading',{name:'Ca kiểm tra đã mở'})).toBeTruthy()
 await act(async()=>{await vi.advanceTimersByTimeAsync(10000)})
 expect(m.toast).toHaveBeenCalledWith(expect.stringContaining('đã lưu trên máy chủ'), 'error')
 expect(m.publish).toHaveBeenCalledTimes(1)
})
it('cấu hình không phản hồi: thoát trạng thái quay và giữ lỗi để đọc',async()=>{
 const button=await prepare();m.address.mockImplementation(()=>new Promise(()=>{}));vi.useFakeTimers();fireEvent.click(button)
 await act(async()=>{await vi.advanceTimersByTimeAsync(10001)})
 expect(screen.getByRole('alert').textContent).toContain('Chưa đọc được kết nối')
 expect((screen.getByRole('button',{name:/Mở ca kiểm tra ngay/}) as HTMLButtonElement).disabled).toBe(false)
 expect(m.publish).not.toHaveBeenCalled()
})
