import {afterEach,expect,it,vi} from 'vitest'
import {render,screen,fireEvent,waitFor,cleanup} from '@testing-library/react'
import PhanCongScreen from '../src/screens/PhanCongScreen'
const mocks=vi.hoisted(()=>({giao:vi.fn(),theoDoi:vi.fn().mockResolvedValue([])}))
vi.mock('../src/lib/exam-db',()=>({loadScriptUrl:async()=>'/test',loadTeacherSecret:async()=>'test',loadExamSources:async()=>[]}))
vi.mock('../src/lib/may-chu-moi',()=>({layCauHinhMayChu:async()=>({URL:'/test'})}))
vi.mock('../src/lib/exam-api',()=>({danhSachCa:async()=>[{maCa:'CA',tenCa:'Ca thử',daVao:1,daNop:1}],danhSachEm:async()=>[],khoiTuNamSinh:()=>12}))
vi.mock('../src/lib/day-ca-may-chu-moi',()=>({luotCuaCaMoi:async()=>[]}))
vi.mock('../src/lib/btvn-may-chu-moi',()=>({giaoBtvn:mocks.giao,theoDoiBtvn:mocks.theoDoi,suaGiaoBtvn:vi.fn()}))
vi.mock('../src/components/HopChonDe',()=>({default:({onChon}:any)=><button onClick={()=>onChon('D-TN')}>Chọn đề mẫu</button>}))
vi.mock('../src/components/NhomCaThuGon',()=>({default:({ds,render}:any)=><div>{ds.map(render)}</div>}))
vi.mock('../src/components/HocSinhNhanBai',()=>({default:()=>null}))
afterEach(()=>{cleanup();vi.unstubAllGlobals();vi.clearAllMocks()})
async function open(){
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({ok:true,items:[]})}))
 render(<PhanCongScreen/> )
 await waitFor(()=>expect(mocks.theoDoi).toHaveBeenCalled())
 fireEvent.click(screen.getAllByRole('button',{name:/Giao bài mới/})[0])
 await screen.findByText(/Chưa có đề sẵn sàng/)
 const ca=screen.getByText('Ca thử').closest('button')!
 fireEvent.click(ca)
 fireEvent.click(screen.getByText('Chọn đề mẫu'))
}
it('giữ màn giao và dữ liệu đã chọn khi máy chủ từ chối giao',async()=>{
 mocks.giao.mockRejectedValueOnce(new Error('Không giao được bài thử'))
 await open()
 fireEvent.click(screen.getByRole('button',{name:/Giao bài tập/}))
 await screen.findByText('Không giao được bài thử')
 expect(screen.getByLabelText('Hạn nộp bài mới')).toBeDefined()
 expect(screen.getByText('Ca thử').closest('button')!.getAttribute('aria-pressed')).toBe('true')
})
it('hạn đã qua không gửi yêu cầu giao lên máy chủ',async()=>{
 await open()
 fireEvent.change(screen.getByLabelText('Hạn nộp bài mới'),{target:{value:'2000-01-01T12:00'}})
 fireEvent.click(screen.getByRole('button',{name:/Giao bài tập/}))
 await screen.findByText('Hạn nộp phải ở sau thời điểm hiện tại.')
 expect(mocks.giao).not.toHaveBeenCalled()
})
