import {it,expect,vi,afterEach} from 'vitest'
import {render,screen,fireEvent,cleanup,within} from '@testing-library/react'
import HocSinhNhanBai from '../src/components/HocSinhNhanBai'
import NhomCaThuGon from '../src/components/NhomCaThuGon'
vi.mock('../src/components/BaiNopBtvn',()=>({default:({sbd,onClose}:any)=><div role="dialog">Bài {sbd}<button onClick={onClose}>Đóng</button></div>}))
afterEach(cleanup)
it('đã nộp lên đầu, bấm tên mở đúng SBD và đóng được',()=>{
 render(<HocSinhNhanBai busy={false} onAction={()=>{}} bai={{maBtvn:'BT',maCa:'ca',maDe:'D',soCau:34,giaoLuc:'',hanNop:'',quaHan:false,tong:2,daNop:1,chuaNop:[],hocSinh:[{sbd:'1',hoTen:'Chưa nộp A',nopLuc:null,soDung:null,soCau:null,thuHoi:false},{sbd:'11040',hoTen:'Nguyễn Khánh Ly',nopLuc:'2026-09-16T15:47:31Z',soDung:28,soCau:34,thuHoi:false}]}}/>)
 expect(screen.getAllByRole('article')[0].textContent).toContain('Nguyễn Khánh Ly')
 fireEvent.click(screen.getByRole('button',{name:'Xem bài đã nộp của Nguyễn Khánh Ly'}))
 expect(screen.getByRole('dialog').textContent).toContain('11040')
 fireEvent.click(within(screen.getByRole('dialog')).getByText('Đóng'));expect(screen.queryByRole('dialog')).toBeNull()
 fireEvent.change(screen.getByRole('textbox'),{target:{value:'khanh ly'}});expect(screen.getAllByRole('article')).toHaveLength(1)
})
it('thư mục ca gọn theo năm sinh, không bỏ tick khi đóng mở',()=>{
 const {container}=render(<NhomCaThuGon ds={[{maCa:'1',tenCa:'2009 - Lớp TH'},{maCa:'2',tenCa:'2011 - Lớp 1'}]} selected={c=>c.maCa==='1'} render={c=><p key={c.maCa}>{c.tenCa}</p>}/>)
 expect(container.querySelectorAll('details')).toHaveLength(2)
 for(const d of container.querySelectorAll('details'))expect(d.open).toBe(false)
 expect(container.textContent).toContain('Năm sinh 2009 · 1 ca · 1 đã chọn')
})
