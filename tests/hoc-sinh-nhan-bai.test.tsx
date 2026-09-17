import {it,expect} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import HocSinhNhanBai from '../src/components/HocSinhNhanBai'
it('mỗi học sinh có thẻ riêng, tên SBD trạng thái và hai thao tác trong vùng cuộn',()=>{
 const html=renderToStaticMarkup(<HocSinhNhanBai busy={false} onAction={()=>{}} bai={{maBtvn:'test',maCa:'x',maDe:'d',soCau:10,giaoLuc:'',hanNop:'',quaHan:false,tong:2,daNop:1,chuaNop:[],hocSinh:[{sbd:'1',hoTen:'Nguyễn A',nopLuc:null,soDung:null,soCau:null,thuHoi:false},{sbd:'2',hoTen:'Trần B',nopLuc:'2026-09-16T10:00:00Z',soDung:8,soCau:10,thuHoi:false}]}}/> )
 expect(html.match(/<article/g)).toHaveLength(2)
 for(const text of ['SBD 1','SBD 2','Chưa nộp','Đã nộp','Cho làm lại','Thu hồi','Tìm tên hoặc số báo danh','overflow-y:auto'])expect(html).toContain(text)
})
