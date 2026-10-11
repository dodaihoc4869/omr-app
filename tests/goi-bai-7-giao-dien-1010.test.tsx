// @vitest-environment jsdom
import { afterEach,expect,it,vi } from 'vitest'
import { cleanup,fireEvent,render,screen,waitFor } from '@testing-library/react'
import HocTapHomNay from '../src/components/hoc-tap/HocTapHomNay'
import ManLamBaiTap from '../src/components/hoc-tap/ManLamBaiTap'
import ManKiemGoi7 from '../src/components/hoc-tap/ManKiemGoi7'
import { docSanh,goiHoa2 } from '../src/components/hoa2/api'
import { docTomTatGoi7,type TomTatGoi7 } from '../src/lib/goi-bai-7'
vi.mock('../src/components/hoa2/api',async original=>({...await original<typeof import('../src/components/hoa2/api')>(),goiHoa2:vi.fn()}))
afterEach(()=>{cleanup();vi.clearAllMocks();localStorage.clear()})
const q={qid:'q1',maDe:'de',version:'v1',group:'g1',phan:'I' as const,text:'Chất nào là muối?',choices:['NaCl','HCl','NaOH','H2O'],ideas:[],hinhAnh:[],dang:null,tenDang:'',mucDo:'NB',sao:0,kienThuc:[]}
const goi:TomTatGoi7={bat:true,ngay:'2026-10-10',toiThieu:24,daLamHomNay:0,tuLamCon:18,tiepCanCon:6,thieuPhu:0,thieuNgay:0,canHoTro:false,kienThucCu:{tong:10,dat:7,tyLe:70},goi:[{id:'g1',ten:'Bài Este',batDau:'2026-10-10',han:'2026-10-16',tong:127,daGap:0,con:127,quota:19,gapHomNay:0,quaHan:false,canBoSung:0,to:['de']}],diemDaDo:[]}
it('màn Hôm nay ưu tiên gói thật thay kế hoạch cũ; phân biệt gặp câu và kỹ năng',()=>{
  const onKiem=vi.fn()
  render(<HocTapHomNay ten="An" lop="12A1" ketQua={docSanh({cheDo2:true,theLuc:{con:24,tong:24},goi7:goi})} dangTai={false} loi="" coCa={false} onHoc={vi.fn()} onKiem={onKiem} onXemLai={vi.fn()} onChua={vi.fn()} onThi={vi.fn()} onTuLuyen={vi.fn()} onLichSu={vi.fn()} onBaiTap={vi.fn()} onGiaDinh={vi.fn()} onTaiLai={vi.fn()} onDangXuat={vi.fn()}/>)
  expect(screen.getByText('18 câu tự làm · 6 câu học có hỗ trợ')).toBeTruthy()
  expect(screen.getByText(/0\/127 câu/)).toBeTruthy()
  expect(screen.getByText(/7\/10 kỹ năng đã đạt \(70%\)/)).toBeTruthy()
  fireEvent.click(screen.getByRole('button',{name:'Tự kiểm tờ 1'}));expect(onKiem).toHaveBeenCalledWith('g1','de')
  expect(screen.getByRole('button',{name:'Vào ca kiểm tra'})).toBeTruthy()
})
it('dữ liệu sai hoặc thiếu không biến thành hoàn tất bài/đạt 80%',()=>{
  expect(docTomTatGoi7({...goi,goi:[{...goi.goi[0],daGap:200}]})).toBeUndefined()
  expect(docTomTatGoi7({...goi,kienThucCu:{tong:10,dat:20,tyLe:100}})).toBeUndefined()
  expect(docTomTatGoi7({bat:true})).toBeUndefined()
  expect(docTomTatGoi7(goi)).toEqual(goi)
})
it('thiếu nguồn một tờ không hiển thị tỷ lệ hoàn thành hoặc điểm tự kiểm của cả bộ',()=>{
  render(<HocTapHomNay ten="An" lop="12A1" ketQua={docSanh({cheDo2:true,theLuc:{con:24,tong:24},goi7:{...goi,goi:[{...goi.goi[0],nguonDayDu:false}]}})} dangTai={false} loi="" coCa={false} onHoc={vi.fn()} onKiem={vi.fn()} onXemLai={vi.fn()} onChua={vi.fn()} onThi={vi.fn()} onTuLuyen={vi.fn()} onLichSu={vi.fn()} onBaiTap={vi.fn()} onGiaDinh={vi.fn()} onTaiLai={vi.fn()} onDangXuat={vi.fn()}/>)
  expect(screen.getByText(/chưa chốt tổng số câu/i)).toBeTruthy();expect(screen.queryByText(/0\/127 câu/)).toBeNull();expect(screen.queryByRole('button',{name:'Tự kiểm tờ 1'})).toBeNull()
})
it('học có hỗ trợ là hành động riêng, không hiện sai hoặc làm đúng',async()=>{
  vi.mocked(goiHoa2).mockResolvedValueOnce({ok:true,id:'p',questions:[{...q,vaiGoi7:'tiep_can',huongDan7:true}]}).mockResolvedValueOnce({ok:true,correct:false,answer:'A',solution:'NaCl là muối.',hocCoHoTro:true})
  render(<ManLamBaiTap token="t" sbd="s" onVe={vi.fn()} onCapNhat={vi.fn()} onChua={vi.fn()}/>)
  await screen.findByText(q.text);expect(screen.queryByText('NaCl là muối.')).toBeNull()
  fireEvent.click(screen.getByRole('button',{name:/Chưa tự làm được/}))
  await screen.findByText(/đã gặp với hỗ trợ, chưa tính tự làm đúng/)
  expect(screen.queryByText('Em đã trả lời đúng.')).toBeNull();expect(screen.queryByRole('button',{name:'Tự chữa câu này'})).toBeNull()
  expect(goiHoa2).toHaveBeenLastCalledWith('hoc-tap-gap','t',{session:'p',qid:'q1',chuaTuLam:true},40)
})
it('bài tự kiểm giữ nháp khi mạng lỗi, chỉ hiện đáp án sau nộp cả tờ',async()=>{
  vi.mocked(goiHoa2).mockResolvedValueOnce({ok:true,id:'kiem1',cauMoi:0,tong:1,questions:[q]}).mockRejectedValueOnce(new Error('Mạng gián đoạn')).mockResolvedValueOnce({ok:true,daNop:true,diem:10,daGhiSo:true,ketQua:[{qid:q.qid,correct:true,answer:'A',solution:'NaCl là muối.'}]})
  render(<ManKiemGoi7 token="t" sbd="s" goiId="g1" maDe="de" onVe={vi.fn()} onCapNhat={vi.fn()}/>)
  await screen.findByText(q.text);expect(screen.queryByText('NaCl là muối.')).toBeNull()
  fireEvent.click(screen.getByText('NaCl'));fireEvent.click(screen.getByRole('button',{name:'Nộp cả tờ'}));fireEvent.click(screen.getByRole('button',{name:'Xác nhận nộp bài'}))
  await screen.findByText('Mạng gián đoạn');expect(JSON.parse(localStorage.getItem('hoc-tap:kiem:s:kiem1')!)).toEqual({q1:'A'})
  fireEvent.click(screen.getByRole('button',{name:'Xác nhận nộp bài'}));await screen.findByText('10.00/10 điểm')
  expect(screen.getByText(/Điểm này chưa xác nhận em đã thành thạo mọi kỹ năng/)).toBeTruthy()
  await waitFor(()=>expect(localStorage.getItem('hoc-tap:kiem:s:kiem1')).toBeNull())
})
it('nhờ thầy chữa không lộ đáp án, không hiện làm sai và vẫn chuyển được câu',async()=>{
  vi.mocked(goiHoa2).mockResolvedValueOnce({ok:true,id:'p',questions:[{...q,vaiGoi7:'tiep_can',huongDan7:true}]}).mockResolvedValueOnce({ok:true,correct:false,choThay:true})
  render(<ManLamBaiTap token="t" sbd="s" onVe={vi.fn()} onCapNhat={vi.fn()} onChua={vi.fn()}/>)
  await screen.findByText(q.text);fireEvent.click(screen.getByRole('button',{name:/Chưa tự làm được/}))
  await screen.findByText(/nhờ thầy chữa/)
  expect(screen.queryByRole('button',{name:'Tự chữa câu này'})).toBeNull()
  expect(screen.queryByText('Em đã trả lời đúng.')).toBeNull()
  fireEvent.click(screen.getByRole('button',{name:'Kết thúc đợt'}));expect(screen.getByText('Em đã hoàn thành đợt này')).toBeTruthy()
})
