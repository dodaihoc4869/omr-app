// Chỉ trang xem thử cục bộ: dữ liệu mẫu, không có yêu cầu tới máy chủ thật.
import { createRoot } from 'react-dom/client'
import { useAppStore } from '../../src/store/appStore'
import { useCoHoa2 } from '../../src/components/chien-dich/co-hoa2'
import { saveScriptUrl, saveTeacherSecret, saveCauHinhMayChu } from '../../src/lib/exam-db'
import '../../src/styles/tokens.css'
import '../../src/index.css'
import '../../src/components/m3'
import '../../src/styles/teacher-layout.css'
import '../../src/styles/vo-thay.css'
import '../../src/styles/gv-mau.css'
import '../../src/styles/teacher-modern.css'
import '@fontsource/be-vietnam-pro/vietnamese-400.css'
import '@fontsource/be-vietnam-pro/vietnamese-600.css'
import '@fontsource/be-vietnam-pro/vietnamese-700.css'
import ThanhBenTrai from '../../src/components/ThanhBenTrai'
import BottomNav from '../../src/components/BottomNav'
import TongQuanScreen from '../../src/screens/TongQuanScreen'
import ChienDichScreen from '../../src/screens/ChienDichScreen'
import HocSinhScreen from '../../src/screens/HocSinhScreen'
import CaiDatScreen from '../../src/screens/CaiDatScreen'

const nay=new Date(),ngay=(t:number)=>new Date(t).toISOString().slice(0,10)
const homNay=ngay(+nay),em=Array.from({length:24},(_,i)=>({sbd:`E${i}`,hoTen:`Học sinh mẫu ${i+1}`,ho_ten:`Học sinh mẫu ${i+1}`,ten:`Học sinh mẫu ${i+1}`,lop:i<12?'12A1':'11A1',namSinh:'2009',trangThai:'da_dang_ky',soCa:4,diemGanNhat:7+(i%9)/4,caGanNhat:'CA1',nopGanNhat:nay.toISOString(),coXat:18+i,thanhThao:10+i,canDayLai:i%3,treNhip:i%4,nhip:i%3?'dung':'tre12',theoDang:{Ester:.5,Carbohydrate:.7}}))
const cd=[{id:'CD1',ten:'Ester và Lipid',lop:'12A1',maDe:['D1'],hanNop:ngay(+nay+7*86400000),batDau:ngay(+nay-3*86400000),theLucNgay:40,huyetChien:false,maCa:null,taoLuc:new Date(+nay-3*86400000).toISOString(),trangThai:'dang_chay',soCau:120,soEm:24,hetHan:false,thongKe:{coXat:.65,thanhThao:.48,dungNhip:12,emLamQuaDu:6,quaTai:0,canDayLaiCau:6,canDayLaiLuot:12,mucCanHomNay:.36,ngayThu:4,tongNgay:11}}]
const bang={chienDich:cd[0],homNay,hetHan:false,lop:{coXat:.65,thanhThao:.48,huyetChien:0,canDayLaiCau:6,canDayLaiLuot:12,nhip:{dung:16,vuot:2,tre12:4,tre3:2},ngayThu:4,tongNgay:11,mucCanHomNay:.36},dang:['Ester','Carbohydrate'],em,canDayLai:[]}
const ca=[{maCa:'CA1',tenCa:'Kiểm tra Ester – Lipid',loai:'thi',trangThai:'mo',batDau:nay.toISOString(),moLuc:nay.toISOString(),thoiGianPhut:45,danhSachMoi:em.map(x=>x.sbd).join(','),daVao:24,daNop:16,canhBao:0}]
const fetchGoc=window.fetch.bind(window)
window.fetch=async(input,init)=>{
 const u=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url,location.href)
 if(u.pathname.startsWith('/gv/')||u.pathname.startsWith('/em/')||u.pathname==='/ca'||u.pathname==='/goi'||u.pathname==='/hs'){
  let b:Record<string,unknown>={};try{b=JSON.parse(String(init?.body??'{}'))}catch{}
  let du:unknown={ok:true,items:ca,em}
  if(u.pathname==='/em/danh-sach'||u.pathname==='/gv/hoc-sinh'||b.action==='danhSachEm')du={ok:true,items:em,em}
  if(u.pathname==='/gv/chien-dich')du=b.action==='bang'?{ok:true,...bang}:b.action==='co-doc'?{ok:true,co:{bat:true,lop:[],sbd:[]}}:b.action==='ds-em'?{ok:true,em}: {ok:true,homNay,chienDich:cd}
  return new Response(JSON.stringify(du),{headers:{'content-type':'application/json'}})
 }
 if(u.origin!==location.origin)throw Error('Preview không gọi máy chủ thật')
 return fetchGoc(input,init)
}
await saveScriptUrl(location.origin);await saveTeacherSecret('preview-du-lieu-gia');await saveCauHinhMayChu({BAT:true,URL:location.origin})
useCoHoa2.getState().dat({bat:true,lop:[],sbd:[]})
const man=new URLSearchParams(location.search).get('man')??'tongquan'
useAppStore.setState({screen:man as never,classList:em as never})
const Screen=man==='chiendich'?ChienDichScreen:man==='hocsinh'?HocSinhScreen:man==='caidat'?CaiDatScreen:TongQuanScreen
createRoot(document.getElementById('root')!).render(<div className="m3 m3-thay vo-thay" data-hoa2=""><ThanhBenTrai/><div className="khung-noi-dung"><div className="giua-noi-dung" data-teacher-screen={man}><Screen/></div></div><BottomNav/></div>)
