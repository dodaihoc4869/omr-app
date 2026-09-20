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
createRoot(document.getElementById('root')!).render(<StrictMode><section className="spirit-game" style={{padding:0,borderRadius:0}}>{man==='chon'&&<ManChon/>}{man==='dao'&&<ManDao/>}{man==='tui'&&<div className="dao dao-vo"><TuiDo profile={hoSo()} exp={{homNay:46,manhKhien:{manh:8,moiKhien:12}}} onDungKhien={async()=>{}} onMoVoDai={()=>{}} onMoTienBo={()=>{}}/></div>}</section></StrictMode>)
