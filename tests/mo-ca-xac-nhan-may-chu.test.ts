import {it,expect,vi,beforeEach} from 'vitest'
const m=vi.hoisted(()=>({day:vi.fn(),config:{BAT:true,URL:'https://test'}}))
vi.mock('../src/lib/dia-chi-may-chu',()=>({layDiaChiMayChu:async()=> 'https://test'}))
vi.mock('../src/lib/may-chu-moi',async original=>({...await original<any>(),layCauHinhMayChu:async()=>m.config}))
vi.mock('../src/lib/exam-db',async original=>({...await original<any>(),loadTeacherSecret:async()=> 'test-only'}))
vi.mock('../src/lib/day-ca-may-chu-moi',async original=>({...await original<any>(),taoCaDaXacNhan:m.day}))
import {publishSession} from '../src/lib/exam-api'
beforeEach(()=>vi.clearAllMocks())
it('không báo mở thành công khi tải ca thất bại',async()=>{
 m.day.mockResolvedValue(false)
 await expect(publishSession('', '991779','10',45,{} as any)).rejects.toThrow('Không đẩy được ca')
})
it('đồng bộ giờ lưu từ màn tạo ca và tự bật phòng chờ',async()=>{
 m.day.mockResolvedValue(true)
 await publishSession('','123456','10',45,{} as any,'khong',undefined,{dongBoGio:true})
 expect(m.day.mock.calls[0][2]).toMatchObject({dongBoGio:true,phongCho:true})
})

it('máy mới chưa lưu cấu hình vẫn mở ca bằng địa chỉ đã phân giải',async()=>{
 m.config={BAT:false,URL:''};m.day.mockResolvedValue(true)
 await publishSession('','123456','10',45,{} as any)
 expect(m.day.mock.calls[0][0]).toMatchObject({BAT:true,URL:'https://test'})
 m.config={BAT:true,URL:'https://test'}
})
