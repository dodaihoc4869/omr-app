import {beforeEach,afterEach,it,expect,vi} from 'vitest'
import {render,screen,fireEvent,cleanup} from '@testing-library/react'
import StudentPortalScreen from '../src/screens/StudentPortalScreen'
const mocks=vi.hoisted(()=>({start:vi.fn(),homework:vi.fn(),sheet:vi.fn(),items:[] as any[],momItems:[] as any[]}))
vi.mock('../src/game/than-thu-v2/Spirit2D',()=>({default:()=>null}))
vi.mock('../src/components/BangVinhDanh',()=>({default:()=>null}))
vi.mock('../src/components/BangTinPhuHuynh',()=>({default:({onSelectTab}:any)=><button onClick={()=>onSelectTab('btvn')}>Danh sách BTVN</button>}))
vi.mock('../src/components/ThongBaoHocSinh',()=>({default:()=>null,noticeApi:vi.fn()}))
vi.mock('../src/game/than-thu-v2/academic-sync',()=>({syncStudentExp:async()=>{}}))
vi.mock('../src/lib/exam-db',async original=>({...await original<any>(),loadScriptUrlHoacMacDinh:async()=>'/test'}))
vi.mock('../src/lib/exam-api',async original=>({...await original<any>(),hsLichSuCaApi:async()=>({ok:true,items:[]}),hsBtvnApi:async()=>({ok:true,items:mocks.items}),thanThuDocApi:async()=>({ok:true,hoSo:{}})}))
vi.mock('../src/lib/mom-api',async original=>({...await original<any>(),momApi:async(action:string)=>action==='start'?mocks.start():({ok:true,items:mocks.momItems})}))
vi.mock('../src/lib/btvn-may-chu-moi',()=>({btvnCuaEm:mocks.homework}))
vi.mock('../src/lib/btvn-cho-em',()=>({layCauHinhChoEmBtvn:async()=>({URL:'/test'}),dungPhieuBtvn:mocks.sheet}))
beforeEach(()=>{
 mocks.items=[];mocks.momItems=[{id:'M1',tieuDe:'Bài luyện thử',soCau:1,trangThai:'chua_lam'}]
 mocks.sheet.mockResolvedValue('<html><body>Đề BTVN thử</body></html>')
 mocks.homework.mockResolvedValue({ok:true,maBtvn:'BT1',de:{},soCau:1})
 localStorage.setItem('omr_student_portal_auth',JSON.stringify({sbd:'test',hoTen:'Em thử',token:'test-token'}))
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({ok:true,items:[]})}))
 mocks.start.mockResolvedValue({ok:true,item:{id:'M1',tieuDe:'Bài luyện thử',trangThai:'dang_lam',batDauLuc:new Date().toISOString(),dsCau:[{id:'q1',text:'Nội dung câu hỏi phải hiện',phan:'I',choices:['Một','Hai','Ba','Bốn'],dapAn:'A'}]}})
})
afterEach(()=>{cleanup();localStorage.clear();vi.unstubAllGlobals();vi.clearAllMocks()})
it('từ bảng tin mở đúng màn đề và đóng về bảng tin không trắng',async()=>{
 render(<StudentPortalScreen/>);fireEvent.click(await screen.findByRole('button',{name:'Làm bài gia đình giao'}))
 expect(await screen.findByText('Nội dung câu hỏi phải hiện')).toBeTruthy()
 fireEvent.click(screen.getByTitle('Đóng toàn màn hình'))
 expect(await screen.findByRole('heading',{name:'Chào thử'})).toBeTruthy()
 fireEvent.click(await screen.findByRole('button',{name:'Làm bài gia đình giao'}))
 expect(await screen.findByText('Nội dung câu hỏi phải hiện')).toBeTruthy()
})
it('lỗi mở bài được hiện trong màn bài gia đình, không biến mất ở trang chủ',async()=>{
 mocks.start.mockRejectedValueOnce(new Error('Không tải được đề thử'))
 render(<StudentPortalScreen/>);fireEvent.click(await screen.findByRole('button',{name:'Làm bài gia đình giao'}))
 expect(await screen.findByText('Không tải được đề thử')).toBeTruthy()
})

it.each(['chua_lam','dang_lam'])('nút đỏ trong danh sách Mom hoạt động: %s',async(trangThai)=>{
 mocks.momItems[0].trangThai=trangThai
 render(<StudentPortalScreen/>);fireEvent.click(await screen.findByRole('button',{name:'Làm bài gia đình giao'}))
 await screen.findByText('Nội dung câu hỏi phải hiện')
 fireEvent.click(screen.getByRole('button',{name:'Danh sách bài'}))
 fireEvent.click(await screen.findByRole('button',{name:'Rời bài'}))
 fireEvent.click(await screen.findByRole('button',{name:trangThai==='dang_lam'?'Tiếp tục làm bài':'Bắt đầu làm bài (2 tiếng)'}))
 expect(await screen.findByText('Nội dung câu hỏi phải hiện')).toBeTruthy()
})
it.each(['moi','xem','lamlai'])('BTVN mở đúng lượt và đúng chế độ: %s',async(mode)=>{
 const bt={maBtvn:'BT1',maCa:'CA1',soCau:1,tenBtvn:'Bài test',hanNop:new Date(Date.now()+86400000).toISOString(),daNop:mode!=='moi',soLanLamLaiConLai:3}
 mocks.items=[bt]
 render(<StudentPortalScreen/>);fireEvent.click(await screen.findByRole('button',{name:'Mở menu'}));fireEvent.click(await screen.findByRole('menuitem',{name:'Bài tập về nhà'}))
 const name=mode==='moi'?'Vào làm bài':mode==='xem'?/Xem lại/:/Làm lại/
 fireEvent.click(await screen.findByRole('button',{name}))
 if(mode==='lamlai')fireEvent.click(await screen.findByRole('button',{name:'Làm lại bài'}))
 expect(await screen.findByRole('dialog',{name:'Bài tập & Phiếu làm bài'})).toBeTruthy()
 expect(mocks.homework).toHaveBeenCalledWith({URL:'/test'},'CA1','test','BT1')
 expect(mocks.sheet.mock.calls[0][3].lamLai).toBe(mode==='lamlai')
})
