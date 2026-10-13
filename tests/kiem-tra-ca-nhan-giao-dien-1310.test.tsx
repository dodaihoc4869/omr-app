import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, render, screen, fireEvent, waitFor } from '@testing-library/react'
import HocTapHomNay from '../src/components/hoc-tap/HocTapHomNay'
import TheKiemTra from '../src/components/hoc-tap/TheKiemTraCaNhan'
import ManKiemTra from '../src/components/hoc-tap/ManKiemTraCaNhan'
import { docSanh } from '../src/components/hoa2/api'
import { docKiemTra, type TomTatKiemTra } from '../src/lib/kiem-tra-ca-nhan'
vi.mock('../src/lib/tu-sua-loi',()=>({useSoCauCanSua:()=>5}))
const api=vi.hoisted(()=>vi.fn())
vi.mock('../src/components/hoa2/api',async(importOriginal)=>({...await importOriginal(),goiHoa2:api}))
const now=Date.parse('2026-10-16T02:00:00Z')
const kt:TomTatKiemTra={id:'kt-S1',ngay:'2026-10-16',moLuc:Date.parse('2026-10-15T17:00:00Z'),hanLuc:Date.parse('2026-10-16T17:00:00Z'),serverNow:now,trangThai:'can_lam',homNay:true,tong:36,daTra:0,con:36,soChang:6,phut:45,soBai:12,tongKienThuc:36,phuDe:36,nguonDayDu:true,lyDo:'Kiểm chứng những phần em đang luyện thêm',thieuNguon:0,diem:null,nopLuc:null}
const noop=()=>{}
afterEach(()=>{cleanup();api.mockReset();localStorage.clear()})
it('ngày kiểm tra chỉ có thẻ kiểm tra, không vòng bài ngày hoặc lời mời sửa 5 câu',async()=>{
 const mo=vi.fn(),s=docSanh({cheDo2:true,ngay:kt.ngay,kiemTraCaNhan:kt,theLuc:{tong:36,con:36}})!
 render(<HocTapHomNay ten="An" lop="12A1" ketQua={s} dangTai={false} loi="" onHoc={noop} onXemLai={noop} onChua={noop} onThi={noop} onTuLuyen={noop} onLichSu={noop} onBaiTap={noop} onGiaDinh={noop} onTaiLai={noop} onDangXuat={noop} coCa={false} onKiemTra={mo}/>)
 expect(await screen.findByText('Hôm nay em chỉ cần làm bài kiểm tra này.')).toBeTruthy()
 expect(screen.queryByText('câu đang chờ em sửa')).toBeNull()
 expect(screen.queryByText('Ôn và sửa')).toBeNull()
 fireEvent.click(screen.getByRole('button',{name:'Làm bài kiểm tra'}));expect(mo).toHaveBeenCalledOnce()
})
it('nộp sớm vẫn chỉ xem kết quả, không mời làm thêm bài tập ngày',()=>{
 render(<TheKiemTra du={{...kt,nopLuc:now,trangThai:'da_nop',daTra:36,con:0,diem:8}} onMo={noop}/>)
 expect(screen.getByRole('button',{name:'Xem kết quả'})).toBeTruthy()
 expect(screen.getByText('Bài đã nộp. Bài tập tiếp tục vào ngày học kế tiếp.')).toBeTruthy()
})
it('lịch tương lai có ngày giờ thật và không đếm ngược gây áp lực',()=>{
 render(<TheKiemTra du={{...kt,homNay:false,trangThai:'sap_den'}} onMo={noop}/>)
 expect(screen.getByText(/hoàn thành trong 24 giờ/)).toBeTruthy()
 expect(screen.queryByText('Hôm nay em chỉ cần làm bài kiểm tra này.')).toBeNull()
})
it('số lệch hoặc cửa sổ không đủ 24h không rơi về sàn bài tập ngày',()=>{
 expect(docKiemTra({...kt,con:12})).toBeUndefined()
 expect(docSanh({cheDo2:true,theLuc:{tong:24,con:24},kiemTraCaNhan:{...kt,hanLuc:now}})).toBeNull()
})
it('màn kiểm tra chỉ bắt đầu đồng hồ khi bấm chặng; câu công khai không có phần chữa',async()=>{
 api.mockImplementation(async(action:string)=>action==='hoc-tap-ktcn-trang-thai'?{ok:true,kiemTra:kt,chang:[{stt:0,soCau:1,giay:60,han:null,daChot:false}]}:{ok:true,kiemTra:kt,revision:0,hanChang:now+60000,daChot:false,questions:[{qid:'q1',maDe:'d',version:'v1',group:'g1',phan:'I',text:'Câu kiểm chứng',choices:['Một','Hai','Ba','Bốn'],ideas:[],hinhAnh:[],dang:null,tenDang:'',mucDo:'NB',sao:0,kienThuc:[]}],tra:{q1:''}})
 render(<ManKiemTra token="token" sbd="S1" id="kt-S1" onVe={noop} onCapNhat={noop}/>)
 await screen.findByRole('button',{name:/Làm chặng 1/})
 expect(api.mock.calls.map(c=>c[0])).toEqual(['hoc-tap-ktcn-trang-thai'])
 fireEvent.click(screen.getByRole('button',{name:/Làm chặng 1/}))
 await screen.findByText('Câu kiểm chứng')
 expect(screen.getByLabelText('Thời gian chặng còn lại')).toBeTruthy()
 expect(screen.queryByText('Xem lời giải')).toBeNull()
 await waitFor(()=>expect(api).toHaveBeenCalledTimes(2))
})
it('mở lại chặng cho khôi phục nháp chưa đồng bộ, chỉ gửi khi em chọn và giữ hạn giờ cũ',async()=>{
 const deadline=now+60000
 localStorage.setItem('ktcn:nhap:S1:kt-S1:0',JSON.stringify({han:deadline,tra:{q1:'B',ngoai:'A'}}))
 api.mockImplementation(async(action:string)=>action==='hoc-tap-ktcn-trang-thai'?{ok:true,kiemTra:kt,chang:[{stt:0,soCau:1,giay:60,han:deadline,daChot:false}]}:action==='hoc-tap-ktcn-start'?{ok:true,kiemTra:kt,revision:0,hanChang:deadline,daChot:false,questions:[{qid:'q1',maDe:'d',version:'v1',group:'g1',phan:'I',text:'Câu kiểm chứng',choices:['Một','Hai','Ba','Bốn'],ideas:[],hinhAnh:[],dang:null,tenDang:'',mucDo:'NB',sao:0,kienThuc:[]}],tra:{q1:''}}:{ok:true,kiemTra:kt,revision:1,daLuu:true})
 render(<ManKiemTra token="token" sbd="S1" id="kt-S1" onVe={noop} onCapNhat={noop}/>)
 fireEvent.click(await screen.findByRole('button',{name:/Làm chặng 1/}))
 const button=await screen.findByRole('button',{name:'Khôi phục bản nháp trên máy'})
 expect(api.mock.calls.map(c=>c[0])).not.toContain('hoc-tap-ktcn-luu')
 fireEvent.click(button)
 await waitFor(()=>expect(api.mock.calls.find(c=>c[0]==='hoc-tap-ktcn-luu')?.[2]).toMatchObject({tra:{q1:'B'},revision:0}))
 expect(api.mock.calls.find(c=>c[0]==='hoc-tap-ktcn-luu')?.[2].tra).not.toHaveProperty('ngoai')
})

it('nộp khi còn câu trống dùng hộp app: Làm tiếp không nộp; Nộp bài chỉ chốt sau đồng ý',async()=>{
 api.mockImplementation(async(action:string)=> action==='hoc-tap-ktcn-nop'
  ? {ok:true,kiemTra:{...kt,nopLuc:now,diem:0,trangThai:'da_nop'},ketQua:{bai:[],cau:[],chu:'Kết quả kiểm tra'}}
  : {ok:true,kiemTra:kt,chang:[]})
 render(<div className="m3"><ManKiemTra token="token" sbd="S1" id="kt-S1" onVe={noop} onCapNhat={noop}/></div>)
 fireEvent.click(await screen.findByRole('button',{name:'Nộp toàn bài'}))
 const hop=await screen.findByRole('alertdialog',{name:'Nộp bài kiểm tra?'})
 expect(hop.textContent).toContain('Còn 36 câu chưa trả lời')
 expect(hop.closest('[data-vo-cong="hop-thoai"]')?.className).toBe('m3')
 fireEvent.click(screen.getByRole('button',{name:'Làm tiếp'}))
 await waitFor(()=>expect(screen.queryByRole('alertdialog')).toBeNull())
 expect(api.mock.calls.some(c=>c[0]==='hoc-tap-ktcn-nop')).toBe(false)
 fireEvent.click(screen.getByRole('button',{name:'Nộp toàn bài'}))
 fireEvent.click(await screen.findByRole('button',{name:'Nộp bài'}))
 await waitFor(()=>expect(api.mock.calls.filter(c=>c[0]==='hoc-tap-ktcn-nop')).toHaveLength(1))
})

it('lịch mới có kiểm tra và kế hoạch học nhẹ cùng ngày; nút bài ngày và nút kiểm tra đều hoạt động',async()=>{
 const hoc=vi.fn(),kiem=vi.fn(),s=docSanh({cheDo2:true,ngay:kt.ngay,kiemTraCaNhan:{...kt,baiNgayToiThieu:12},theLuc:{tong:12,con:12}})!
 render(<HocTapHomNay ten="An" lop="12A1" ketQua={s} dangTai={false} loi="" onHoc={hoc} onXemLai={noop} onChua={noop} onThi={noop} onTuLuyen={noop} onLichSu={noop} onBaiTap={noop} onGiaDinh={noop} onTaiLai={noop} onDangXuat={noop} coCa={false} onKiemTra={kiem}/>)
 expect(await screen.findByText(/kế hoạch học nhẹ/)).toBeTruthy();expect(screen.getByText('Ôn và sửa')).toBeTruthy()
 fireEvent.click(screen.getByRole('button',{name:'Làm bài kiểm tra'}));expect(kiem).toHaveBeenCalledOnce()
 const nut=screen.getAllByRole('button').find(b=>/Học ngay|Làm ngay|Bắt đầu|Học tiếp/.test(b.textContent??''))!
 expect(nut).toBeTruthy();fireEvent.click(nut);expect(hoc).toHaveBeenCalledOnce()
})
