// @vitest-environment jsdom
import { afterEach,expect,it,vi } from 'vitest'
import { cleanup,fireEvent,render,screen,waitFor } from '@testing-library/react'
import HocTapHomNay from '../src/components/hoc-tap/HocTapHomNay'
import ManLamBaiTap from '../src/components/hoc-tap/ManLamBaiTap'
import { docSanh,goiHoa2 } from '../src/components/hoa2/api'
import { docTomTatGoi7,type TomTatGoi7 } from '../src/lib/goi-bai-7'
vi.mock('../src/components/hoa2/api',async original=>({...await original<typeof import('../src/components/hoa2/api')>(),goiHoa2:vi.fn()}))
afterEach(()=>{cleanup();vi.clearAllMocks();localStorage.clear()})
const q={qid:'q1',maDe:'de',version:'v1',group:'g1',phan:'I' as const,text:'Chất nào là muối?',choices:['NaCl','HCl','NaOH','H2O'],ideas:[],hinhAnh:[],dang:null,tenDang:'',mucDo:'NB',sao:0,kienThuc:[]}
const goi:TomTatGoi7={bat:true,ngay:'2026-10-10',toiThieu:24,daLamHomNay:0,tuLamCon:18,tiepCanCon:6,thieuPhu:0,thieuNgay:0,canHoTro:false,kienThucCu:{tong:10,dat:7,tyLe:70},goi:[{id:'g1',ten:'Bài Este',batDau:'2026-10-10',han:'2026-10-16',tong:127,daGap:0,con:127,quota:19,gapHomNay:0,quaHan:false,canBoSung:0,to:['de']}],diemDaDo:[]}
it('màn Hôm nay ưu tiên gói thật thay kế hoạch cũ; phân biệt gặp câu và kỹ năng',()=>{
  render(<HocTapHomNay ten="An" lop="12A1" ketQua={docSanh({cheDo2:true,theLuc:{con:24,tong:24},goi7:goi})} dangTai={false} loi="" coCa={false} onHoc={vi.fn()} onXemLai={vi.fn()} onChua={vi.fn()} onThi={vi.fn()} onTuLuyen={vi.fn()} onLichSu={vi.fn()} onBaiTap={vi.fn()} onGiaDinh={vi.fn()} onTaiLai={vi.fn()} onDangXuat={vi.fn()}/>)
  expect(screen.getByText('18 câu tự làm · 6 câu học có hỗ trợ')).toBeTruthy()
  expect(screen.getByText(/0\/127 câu/)).toBeTruthy()
  // SỬA CÓ CHỦ ĐÍCH 12/10 (thầy: "Bỏ chỗ này đi"): không còn khối Tự kiểm kiến thức, dòng "Kiến thức bài trước … kỹ năng" và đoạn giải thích.
  expect(screen.queryByText(/kỹ năng đã đạt/)).toBeNull()
  expect(screen.queryByText(/Tự kiểm kiến thức/)).toBeNull();expect(screen.queryByRole('button',{name:'Tự kiểm tờ 1'})).toBeNull()
  expect(screen.queryByText(/Đọc chữa không đồng nghĩa đã hiểu chắc/)).toBeNull()
  expect(screen.getByRole('button',{name:'Vào ca kiểm tra'})).toBeTruthy()
})
it('dữ liệu sai hoặc thiếu không biến thành hoàn tất bài/đạt 80%',()=>{
  expect(docTomTatGoi7({...goi,goi:[{...goi.goi[0],daGap:200}]})).toBeUndefined()
  expect(docTomTatGoi7({...goi,kienThucCu:{tong:10,dat:20,tyLe:100}})).toBeUndefined()
  expect(docTomTatGoi7({bat:true})).toBeUndefined()
  expect(docTomTatGoi7(goi)).toEqual(goi)
})
it('thiếu nguồn một tờ không hiển thị tỷ lệ hoàn thành hoặc điểm tự kiểm của cả bộ',()=>{
  render(<HocTapHomNay ten="An" lop="12A1" ketQua={docSanh({cheDo2:true,theLuc:{con:24,tong:24},goi7:{...goi,goi:[{...goi.goi[0],nguonDayDu:false}]}})} dangTai={false} loi="" coCa={false} onHoc={vi.fn()} onXemLai={vi.fn()} onChua={vi.fn()} onThi={vi.fn()} onTuLuyen={vi.fn()} onLichSu={vi.fn()} onBaiTap={vi.fn()} onGiaDinh={vi.fn()} onTaiLai={vi.fn()} onDangXuat={vi.fn()}/>)
  expect(screen.getByText(/chưa chốt tổng số câu/i)).toBeTruthy();expect(screen.queryByText(/0\/127 câu/)).toBeNull();expect(screen.queryByRole('button',{name:'Tự kiểm tờ 1'})).toBeNull()
})
it('học có hỗ trợ là hành động riêng, không hiện sai hoặc làm đúng',async()=>{
  vi.mocked(goiHoa2).mockResolvedValueOnce({ok:true,id:'p',questions:[{...q,vaiGoi7:'tiep_can',huongDan7:true}]}).mockResolvedValueOnce({ok:true,correct:false,answer:'A',solution:'NaCl là muối.',hocCoHoTro:true})
  render(<ManLamBaiTap token="t" sbd="s" onVe={vi.fn()} onCapNhat={vi.fn()} onChua={vi.fn()}/>)
  await screen.findByText(q.text);expect(screen.queryByText('NaCl là muối.')).toBeNull()
  // SỬA CÓ CHỦ ĐÍCH 12/10 (thầy 12/10 duyệt bản vẽ màn làm bài): câu Gói 7 có hướng dẫn hỏi "Câu này em chọn làm thế nào?" — hai nút Học cách giải / Tự làm câu này.
  expect(screen.getByText('Câu này em chọn làm thế nào?')).toBeTruthy();expect(screen.getByRole('button',{name:'Tự làm câu này'})).toBeTruthy()
  fireEvent.click(screen.getByRole('button',{name:'Học cách giải'}))
  await screen.findByText(/đã gặp với hỗ trợ, chưa tính tự làm đúng/)
  expect(screen.queryByText('Em đã trả lời đúng.')).toBeNull();expect(screen.queryByRole('button',{name:'Tự chữa câu này'})).toBeNull()
  expect(goiHoa2).toHaveBeenLastCalledWith('hoc-tap-gap','t',{session:'p',qid:'q1',chuaTuLam:true},40)
})
// Đã gỡ 12/10: test màn tự kiểm (ManKiemGoi7) — thầy bỏ phần Tự kiểm kiến thức khỏi app học sinh, màn ấy không còn lối vào nên đã xoá.
it('nhờ thầy chữa không lộ đáp án, không hiện làm sai và vẫn chuyển được câu',async()=>{
  vi.mocked(goiHoa2).mockResolvedValueOnce({ok:true,id:'p',questions:[{...q,vaiGoi7:'tiep_can',huongDan7:true}]}).mockResolvedValueOnce({ok:true,correct:false,choThay:true})
  render(<ManLamBaiTap token="t" sbd="s" onVe={vi.fn()} onCapNhat={vi.fn()} onChua={vi.fn()}/>)
  /* thầy 12/10 duyệt bản vẽ màn làm bài: nút "Học cách giải" */await screen.findByText(q.text);fireEvent.click(screen.getByRole('button',{name:'Học cách giải'}))
  await screen.findByText(/nhờ thầy chữa/)
  expect(screen.queryByRole('button',{name:'Tự chữa câu này'})).toBeNull()
  expect(screen.queryByText('Em đã trả lời đúng.')).toBeNull()
  /* Trùng tu 11/10: "đợt" → "chặng" (bảng từ chuẩn A2) */fireEvent.click(screen.getByRole('button',{name:'Kết thúc chặng'}));/* thầy 12/10 duyệt bản vẽ màn làm bài: "Đã lưu chặng N" (không có số chặng ⇒ "chặng học") */expect(screen.getByText('Đã lưu chặng học')).toBeTruthy()
})
