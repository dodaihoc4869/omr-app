// TRANG XEM THỬ (chỉ `npm run dev`, KHÔNG vào bản build): /src/game/than-thu-v2/dao2/xem-thu.html[?man=khoa][&thu=2&cap=7]
// Dựng Đảo 2.0 THẬT (Dao2) với máy chủ GIẢ trong trang để soát bố cục dọc/ngang: bản đồ → LÊN ĐƯỜNG → 6 ải (ải 1 đề dài, ải 3 Đúng–sai, ải 6 Trùm
// trả lời ngắn) → lời giải → xong chuyến. Đáp án giả: I = B, II = DSSD, III = 6,9.
import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import '@fontsource/be-vietnam-pro/vietnamese-400.css'
import '@fontsource/be-vietnam-pro/vietnamese-600.css'
import '@fontsource/be-vietnam-pro/vietnamese-700.css'
import '@fontsource/be-vietnam-pro/latin-400.css'
import '@fontsource/be-vietnam-pro/latin-600.css'
import '@fontsource/be-vietnam-pro/latin-700.css'
import '../../../styles/tokens.css'
import '../../../index.css'
import '../game.css'
import '../dao/dao.css'
import Dao2 from './Dao2'
import type {CauDao2} from './dao2-core'
import type {DaoCall,DaoKetQua,DaoProfile} from '../dao/kieu'

const q=new URLSearchParams(location.search)
const PET=['dat_quy','nuoc_long','lua_phuong','khi_lang','ductin_lan','tinhyeu_ho','bieton_huou','sangy_cu']
const hoSo:DaoProfile={nickname:'Lửa Nhỏ',pet:PET[Number(q.get('thu')??2)]!,choice:false,cap:Number(q.get('cap')??7),exp:360,wallet:0,mastery:[]}
const VAI=['moi','moi','on_lai','moi','moi','trum']
const cau=(i:number):CauDao2=>{const chung={qid:`q${i}`,maDe:'DE',version:'1',group:`g${i}`,ideas:[],choices:[],hinhAnh:[],dang:'CB',sao:1,kienThuc:[],vai:VAI[i]}
 if(i===2)return {...chung,phan:'II',tenDang:'Glucose và fructose',mucDo:'hieu',text:'Cho các phát biểu sau về glucose (C6H12O6) và fructose (C6H12O6). Mỗi phát biểu đúng hay sai?',
  ideas:['Glucose và fructose là đồng phân của nhau.','Glucose và fructose đều tham gia phản ứng tráng bạc.','Trong dung dịch, glucose tồn tại chủ yếu ở dạng mạch vòng.','Fructose làm mất màu nước bromine (Br2).']} as CauDao2
 if(i===5)return {...chung,phan:'III',tenDang:'Tinh bột',mucDo:'van_dung',text:'Thuỷ phân hoàn toàn 16,2 gam tinh bột (C6H10O5)n rồi lên men toàn bộ glucose thu được với hiệu suất 75%. Khối lượng ethanol (C2H5OH) thu được là bao nhiêu gam? (làm tròn đến hàng phần mười)'} as CauDao2
 return {...chung,phan:'I',tenDang:'Saccharose',mucDo:i===0?'van_dung':'biet',text:i===0?'Thuỷ phân hoàn toàn 34,2 gam saccharose (C12H22O11) trong môi trường acid, thu được dung dịch X. Trung hoà X rồi cho tác dụng với lượng dư dung dịch AgNO3 trong NH3, đun nóng. Biết các phản ứng xảy ra hoàn toàn. Khối lượng Ag thu được là':`Câu hỏi số ${i+1}: chất nào sau đây là disaccharide?`,
  choices:i===0?['21,6 gam','43,2 gam','10,8 gam','86,4 gam']:['Glucose','Saccharose','Fructose','Tinh bột']} as CauDao2}
const CAU=VAI.map((_,i)=>cau(i))
const sanh=(coXat:number,con:number)=>({ok:true,cheDo2:true,ngay:'2026-09-30',chienDich:{id:'cd1',ten:'Carbohydrate',hanNop:'2026-10-04',D:5,tong:120,coXat,thanhThao:0,canDayLai:0,thanhThaoTangTu:'2026-10-02'},
 theLuc:{con,tong:40},huyetChien:false,doan:{con:3},dao:{con},khoaDao:q.get('man')==='khoa',loiKhoaDao:'',ruong:{daLam:40-con,tong:40,moDuoc:false,daMo:false}})
let lan=0
const call:DaoCall=async(action,data={})=>{await new Promise(r=>setTimeout(r,30));const ok=(x:object={}):DaoKetQua=>({ok:true,...x} as DaoKetQua)
 if(action==='hoa2-sanh')return ok(lan++===0?sanh(67,24):sanh(73,18))
 if(action==='hoa2-cau-da-lam')return ok({cau:[{qid:'a',chienDichId:'cd1',tenDang:'Glucose',lanCuoiDung:true},{qid:'b',chienDichId:'cd1',tenDang:'Saccharose',lanCuoiDung:false,henOn:'2026-10-01'},{qid:'c',chienDichId:'cd1',tenDang:'Tinh bột',lanCuoiDung:true}]})
 if(action==='sync')return ok({remaining:0})
 if(action==='start')return ok({id:'s1',mode:'adventure',questions:CAU,theLuc:{con:24,tong:40},dao:{con:24}})
 if(action==='answer'){const c=CAU.find(x=>x.qid===data.qid)!,dap=c.phan==='I'?'B':c.phan==='II'?'DSSD':'6,9',dung=String(data.answer)===dap
  const solution=c.phan==='I'?{chot:'C12H22O11 + H2O → C6H12O6 (glucose) + C6H12O6 (fructose). Trong môi trường NH3, cả glucose và fructose đều tráng bạc: 1 mol → 2 mol Ag.',tung_pa:{A:{dung:false,vi_sao:'Chỉ tính glucose, quên fructose cũng tráng bạc.'},B:{dung:true,vi_sao:'n(saccharose) = 0,1 mol → n(Ag) = 0,4 mol → m(Ag) = 43,2 gam.'},C:{dung:false,vi_sao:'Lấy n(Ag) = n(saccharose), bỏ qua thuỷ phân.'},D:{dung:false,vi_sao:'Nhầm mỗi monosaccharide cho 4 mol Ag.'}}}
   :c.phan==='II'?{chot:'Glucose có nhóm –CHO; fructose chuyển thành glucose trong môi trường NH3.',tung_y:{a:{dung:true,vi_sao:'Cùng công thức C6H12O6.'},b:{dung:false,vi_sao:'Ý này thầy chấm Sai trong bộ giả.'},c:{dung:false,vi_sao:'Ý này thầy chấm Sai trong bộ giả.'},d:{dung:true,vi_sao:'Bộ giả chấm Đúng.'}}}
   :{chot:'(C6H10O5)n → n C6H12O6 → 2n C2H5OH; m = 0,1 × 2 × 46 × 0,75 = 6,9 gam.'}
  return ok({correct:dung,answer:dap,traLoi:String(data.answer),solution,reward:dung?4:0,stage:dung?1:0,solutionImages:[]})}
 return ok()}
createRoot(document.getElementById('root')!).render(<StrictMode><section className="spirit-game spirit-game-dao">
 <Dao2 sbd="12121212" profile={hoSo} call={call} doanMo onMoDoan={()=>{}} onMoSoTay={()=>{}} onDong={()=>{}}/></section></StrictMode>)
