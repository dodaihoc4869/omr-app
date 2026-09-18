import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import ExamMonitorScreen from '../src/screens/ExamMonitorScreen'
const m=vi.hoisted(()=>({begin:vi.fn(), detail:vi.fn(), ca:{maCa:'C1',tenCa:'Ca thử',loai:'thi',lop:'12',phongCho:true,batDauThiLuc:'',thoiGianPhut:45,trangThai:'mo',phamVi:'tu_do',congBo:'khong',dongBoGio:false}}))
vi.mock('../src/store/appStore',()=>({useAppStore:(select:any)=>select({maCaTheoDoi:'C1',classList:[],setScreen:vi.fn(),showToast:vi.fn()})}))
vi.mock('../src/lib/exam-db',async original=>({...await original<any>(),loadScriptUrl:async()=> 'https://local.test',loadTeacherSecret:async()=> 'test-only',loadSessionTeacherBank:async()=>null,docSoCauCa:async()=>undefined,docDeRiengCa:async()=>undefined,docCheDoDeRieng:async()=>false}))
vi.mock('../src/lib/exam-api',async original=>({...await original<any>(),chiTietCa:m.detail,batDauThi:m.begin,danhSachCa:async()=>[]}))
beforeEach(()=>{
 m.ca.batDauThiLuc='';m.ca.dongBoGio=false;m.ca.loai='thi'
 m.detail.mockImplementation(async()=>({ca:{...m.ca},luot:[],dsCho:[],biChan:[]}))
 m.begin.mockImplementation(async(...args:any[])=>{m.ca.batDauThiLuc='2026-09-18T07:00:00Z';m.ca.dongBoGio=args[7];return {batDauLuc:m.ca.batDauThiLuc}})
})
afterEach(()=>{cleanup();vi.clearAllMocks()})
it.each([false,true])('công tắc mặc định tắt; gửi đúng lựa chọn %s khi bắt đầu rồi khoá lựa chọn',async enabled=>{
 render(<ExamMonitorScreen />)
 const toggle=await screen.findByRole('switch',{name:'Đồng bộ giờ cả phòng'}) as HTMLInputElement
 expect(toggle.checked).toBe(false)
 if(enabled)fireEvent.click(toggle)
 fireEvent.click(screen.getByRole('button',{name:'Bắt đầu thi'}))
 await waitFor(()=>expect(m.begin).toHaveBeenCalled())
 expect(m.begin.mock.calls[0][7]).toBe(enabled)
 await waitFor(()=>expect(screen.queryByRole('switch',{name:'Đồng bộ giờ cả phòng'})).toBeNull())
 expect(await screen.findByText(enabled?/đồng bộ giờ cả phòng, cùng hết giờ lúc/:/tính giờ riêng từng em/)).toBeTruthy()
})
it('bắt đầu lỗi vẫn giữ lựa chọn để thử lại',async()=>{
 m.begin.mockRejectedValue(new Error('Lỗi thử nghiệm'))
 render(<ExamMonitorScreen />)
 const toggle=await screen.findByRole('switch',{name:'Đồng bộ giờ cả phòng'}) as HTMLInputElement
 fireEvent.click(toggle);fireEvent.click(screen.getByRole('button',{name:'Bắt đầu thi'}))
 await waitFor(()=>expect(m.begin).toHaveBeenCalled())
 await waitFor(()=>expect((screen.getByRole('button',{name:'Bắt đầu thi'}) as HTMLButtonElement).disabled).toBe(false))
 expect(toggle.checked).toBe(true)
})
