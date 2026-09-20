// TRANG XEM THỬ (chỉ dùng khi `npm run dev`, KHÔNG vào bản build): mở /src/game/than-thu-v2/dao/xem-thu.html?man=chon
// Dựng từng màn của Đảo thần thú với dữ liệu giả, bọc trong .spirit-game như Game.tsx thật để lộ xung đột CSS.
import {StrictMode,useState} from 'react'
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
import ChonBanDongHanh,{theMoDau} from './ChonBanDongHanh'
import DaoCuaEm from './DaoCuaEm'
import TuiDo from './TuiDo'
import ThamHiem from './ThamHiem'
import SoTay from './SoTay'
import DaoThanThu from './DaoThanThu'
import type {DaoCall,DaoKetQua} from './kieu'
import type {CauDao} from './kieu'
import type {DaoProfile} from './kieu'

const q=new URLSearchParams(location.search),man=q.get('man')??'chon'
function ManChon(){const [busy,setBusy]=useState(false),[da,setDa]=useState('')
 return <>{da&&<p data-da-chon>{da}</p>}<ChonBanDongHanh batDau={q.has('dau')?Number(q.get('dau')):theMoDau(q.get('sbd')??'12121212')} busy={busy} loi={q.get('loi')??''} moiDoan={q.has('doan')} onChon={(pet,ten)=>{setBusy(true);setTimeout(()=>{setBusy(false);setDa(`${pet}|${ten}`)},400)}}/></>}
const NGAY=86400000,BAY_GIO=Date.now()
/** Hồ sơ giả: ?thu=2&cap=34&exp=640&vi=120 */
const hoSo=():DaoProfile=>({nickname:q.get('ten')??'Lửa Nhỏ',pet:['dat_quy','nuoc_long','lua_phuong','khi_lang','ductin_lan','tinhyeu_ho','bieton_huou','sangy_cu'][Number(q.get('thu')??2)]!,choice:false,cap:Number(q.get('cap')??34),exp:Number(q.get('exp')??640),wallet:Number(q.get('vi')??0),
 shields:{used:1,activeUntil:0},khienRen:q.has('khongkhien')?undefined:{manh:8,daRen:1,moiKhien:12},
 mastery:[{key:'ES-TP',stage:2,first:BAY_GIO-8*NGAY,due:BAY_GIO-NGAY,groups:['a','b'],repaired:false},{key:'ES-TEN',stage:3,first:BAY_GIO-20*NGAY,due:BAY_GIO+5*NGAY,groups:['c','d','e'],repaired:true},{key:'ES-DOT',stage:1,first:BAY_GIO-2*NGAY,due:BAY_GIO+NGAY,groups:['f'],repaired:false},{key:'CB-LM',stage:0,first:0,due:BAY_GIO+NGAY,groups:[],repaired:false}]})
const TEN_DANG={'ES-TP':'Ester thuỷ phân','ES-TEN':'Tên gọi ester','ES-DOT':'Đốt cháy ester','CB-LM':'Lên men'}
function ManDao(){const [bao,setBao]=useState('')
 return <div className="dao dao-vo"><DaoCuaEm profile={hoSo()} exp={q.has('khongexp')?null:{homNay:46,manhKhien:{manh:8,moiKhien:12}}} chuoiNgay={q.has('khongchuoi')?undefined:5} tenDang={TEN_DANG} goiY={q.has('khonggoiy')?null:[{title:'Ester thuỷ phân'},{title:'Glucose tráng bạc'},{title:'Đốt cháy ester'}]} conLai={q.has('het')?0:180}
  tasks={q.has('nhac')?[{id:'t1',dang:'Xà phòng hoá'}]:[]} thongBao={bao} onLenDuong={()=>setBao('Đang lên đường…')} onNap={()=>setBao('Đã nạp')} onDoiTen={t=>setBao(`Tên mới: ${t}`)} onOnTheoNhac={d=>setBao(`Ôn ${d}`)}/></div>}
const cauGia=(i:number,role:CauDao['role'],phan:'I'|'II'|'III'='I'):CauDao=>({qid:`q${i}`,maDe:'DE01',version:'1',group:`g${i}`,phan,text:['Oxi hoá ethanol bằng CuO, đun nóng, thu được chất hữu cơ X. X là','Thuỷ phân hoàn toàn 8,8 gam ethyl acetate trong dung dịch NaOH dư, thu được m gam muối. Giá trị của m là','Cho các phát biểu về ester, mỗi phát biểu đúng hay sai?'][i%3]!,choices:phan==='I'?['CH₃COOH','CH₃CHO','HCHO','C₂H₄']:[],ideas:phan==='II'?['Ester no đơn chức có công thức CnH2nO2.','Phản ứng xà phòng hoá là thuận nghịch.','Ethyl acetate tan tốt trong nước.','Isoamyl acetate có mùi chuối chín.']:[],hinhAnh:[],dang:'AN-OXH',tenDang:['Ancol · oxi hoá','Ester thuỷ phân','Lý thuyết ester'][i%3]!,mucDo:'hieu',sao:2,kienThuc:[],role})
const CAU_GIA=[cauGia(0,'yeu'),cauGia(1,'yeu','III'),cauGia(2,'toi_han','II'),cauGia(3,'lap'),cauGia(4,'lap'),cauGia(5,'thu_thach')]
/** ?man=tham&buoc=cau|no|sai|xong[&phan=II] */
function ManTham(){const buoc=q.get('buoc')??'cau',[tl,setTl]=useState(buoc==='cau'?'':'B')
 const kq=buoc==='no'?[0,1,2].map(i=>({qid:`q${i}`,correct:true})):buoc==='sai'?[{qid:'q0',correct:true},{qid:'q1',correct:false}]:buoc==='xong'?CAU_GIA.map((c,i)=>({qid:c.qid,correct:i!==1})):[{qid:'q0',correct:true},{qid:'q1',correct:true},{qid:'q2',correct:false}]
 const viTri=buoc==='xong'?5:kq.length-(buoc==='cau'?0:1),cau=q.get('phan')==='II'?CAU_GIA.map((c,i)=>i===viTri?{...cauGia(2,c.role,'II'),qid:c.qid}:c):CAU_GIA
 return <div className="dao dao-vo dao-vo-tham"><ThamHiem profile={hoSo()} cau={cau} viTri={viTri} ketQua={kq} traLoi={tl} assisted={false} xong={buoc==='xong'} tongKet={{dung:5,tong:6,exp:60,sao:2}}
  phanHoi={buoc==='no'?{correct:true,answer:'B',solution:'CH₃CH₂OH + CuO → CH₃CHO + Cu + H₂O. Ancol bậc I bị oxi hoá thành aldehyde.',solutionImages:[],lyDo:{moc:2,exp:40,chu:'+40 · đúng lại ở một câu khác sau 1 ngày — sao thứ 2 của dạng này'}}:buoc==='sai'?{correct:false,answer:'8,2',solution:'n = 0,1 mol ⇒ m = 0,1 × 82 = 8,2 gam.',solutionImages:[],lyDo:{moc:0,exp:0,chu:'Chưa đúng — dạng này hẹn em ôn lại vào ngày mai'}}:null}
  onTraLoi={setTl} onAssisted={()=>{}} onNop={()=>{}} onTiep={()=>{}} onVeDao={()=>{}} onChuyenMoi={()=>{}} onMoSoTay={()=>{}}/></div>}
/** ?man=vo[&chuachon][&doan] — VỎ thật + máy chủ GIẢ trong trang (đáp án đúng: I=B, II=DSSD, III=8,2). */
function ManVo(){const [p,setP]=useState<DaoProfile>(()=>({...hoSo(),choice:q.has('chuachon'),nickname:q.has('chuachon')?undefined:'Lửa Nhỏ'})),[nhat,setNhat]=useState<string[]>([])
 const call:DaoCall=async(action,data={})=>{setNhat(n=>[...n,action]);await new Promise(r=>setTimeout(r,60));const ok=(x:Partial<DaoKetQua>={}):DaoKetQua=>({ok:true,...x})
  if(action==='choose'){setP(c=>({...c,pet:String(data.pet),choice:false}));return ok()}
  if(action==='rename'){setP(c=>({...c,nickname:String(data.name)}));return ok()}
  if(action==='invest'){setP(c=>({...c,exp:c.exp+c.wallet,wallet:0}));return ok()}
  if(action==='recommendations')return ok({suggestions:[{title:'Ester thuỷ phân',source:'DE01',part:'I'},{title:'Lên men',source:'DE02',part:'III'}],remaining:180,dailyUsed:20})
  if(action==='so-tay')return ok({dang:[{key:'ES-TEN',ten:'Tên gọi ester',chuong:'ES'},{key:'ES-TP',ten:'Ester thuỷ phân',chuong:'ES'},{key:'ES-XP',ten:'Xà phòng hoá',chuong:'ES'},{key:'CB-LM',ten:'Lên men',chuong:'CB'}]})
  if(action==='resume')return ok()
  if(action==='sync')return ok({remaining:0})
  if(action==='start')return ok({id:'s1',mode:'adventure',questions:CAU_GIA})
  if(action==='answer'){const c=CAU_GIA.find(x=>x.qid===data.qid)!,dung=String(data.answer)===(c.phan==='I'?'B':c.phan==='II'?'DSSD':'8,2'),reward=dung&&!data.assisted?(c.qid==='q0'?20:c.qid==='q3'?40:0):0
   if(reward)setP(x=>({...x,wallet:x.wallet+reward}))
   return ok({correct:dung,answer:c.phan==='I'?'B':c.phan==='II'?'DSSD':'8,2',solution:'Lời giải mẫu của câu này.',reward,stage:reward===40?2:1,solutionImages:[],...(c.qid==='q3'?{lyDoThuong:{moc:2,exp:40,chu:'+40 · đúng lại ở một câu khác sau 1 ngày — sao thứ 2 của dạng này'}}:{})})}
  return ok()}
 return <><DaoThanThu sbd="12121212" profile={p} doanMo={q.has('doan')} call={call} exp={q.has('khongexp')?null:{homNay:46,manhKhien:{manh:8,moiKhien:12}}} moiDoan={q.has('doan')&&p.choice} onMoDoan={()=>setNhat(n=>[...n,'MO-DOAN'])} onMoVoDai={()=>{}} onMoTienBo={()=>{}} onDong={()=>setNhat(n=>[...n,'DONG'])}/><pre data-nhat hidden>{nhat.join(',')}</pre></>}
createRoot(document.getElementById('root')!).render(<StrictMode><section className="spirit-game" style={{padding:0,borderRadius:0}}>{man==='chon'&&<ManChon/>}{man==='dao'&&<ManDao/>}{man==='tham'&&<ManTham/>}{man==='vo'&&<ManVo/>}{man==='so-tay'&&<div className="dao dao-vo"><SoTay profile={hoSo()} tenDang={TEN_DANG} danhMuc={q.has('khongdanhmuc')?null:[{key:'ES-TEN',ten:'Tên gọi ester',chuong:'ES'},{key:'ES-TP',ten:'Thuỷ phân ester',chuong:'ES'},{key:'ES-DOT',ten:'Đốt cháy ester',chuong:'ES'},{key:'ES-XP',ten:'Xà phòng hoá',chuong:'ES'},{key:'ES-CB',ten:'Chất béo',chuong:'ES'},{key:'CB-LM',ten:'Lên men',chuong:'CB'},{key:'CB-TB',ten:'Glucose tráng bạc',chuong:'CB'},{key:'CB-TBOT',ten:'Tinh bột',chuong:'CB'}]} tenChuong={{ES:'Ester – Lipid',CB:'Carbohydrate'}}/></div>}{man==='tui'&&<div className="dao dao-vo"><TuiDo profile={hoSo()} exp={{homNay:46,manhKhien:{manh:8,moiKhien:12}}} onDungKhien={async()=>{}} onMoVoDai={()=>{}} onMoTienBo={()=>{}}/></div>}</section></StrictMode>)
