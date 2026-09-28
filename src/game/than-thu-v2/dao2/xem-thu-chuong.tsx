// TRANG XEM THỬ (chỉ `npm run dev`, KHÔNG vào bản build): /src/game/than-thu-v2/dao2/xem-thu-chuong.html[?thu=6&cap=7&rong=520]
// Cảnh trận THẬT (CanhRung) + hoạt cảnh bắn chưởng; nút giả kết quả máy chủ: Đúng · Sai · Đúng x3 (chuỗi 3 câu đúng liền ⇒ Cuồng nộ, "Combo x3").
import {StrictMode,useState} from 'react'
import {createRoot} from 'react-dom/client'
import '@fontsource/be-vietnam-pro/vietnamese-700.css'
import '@fontsource/be-vietnam-pro/latin-700.css'
import '../../../styles/tokens.css'
import '../../../index.css'
import '../game.css'
import '../dao/dao.css'
import {CanhRung} from './TrongAi'
import {unlockBattleAudio} from '../battle-audio'
import type {BattleAnswer} from '../learning-battle'
import type {DaoProfile} from '../dao/kieu'

const q=new URLSearchParams(location.search)
const PET=['dat_quy','nuoc_long','lua_phuong','khi_lang','ductin_lan','tinhyeu_ho','bieton_huou','sangy_cu']
const hoSo:DaoProfile={nickname:'Đỗ Đại Học',pet:PET[Number(q.get('thu')??6)]!,choice:false,cap:Number(q.get('cap')??7),exp:0,wallet:0,mastery:[]}
const TONG=12
function XemThu(){
 const [kq,setKq]=useState<BattleAnswer[]>([])
 // hết 12 câu ⇒ bắt đầu trận mới. "Đúng x3": một câu sai (xoá chuỗi) + ba câu đúng liền ⇒ đòn cuối là Combo x3 / Cuồng nộ.
 const them=(...dung:boolean[])=>{unlockBattleAudio();setKq(k=>{const n=k.length+dung.length>TONG?[]:k;return [...n,...dung.map((correct,i)=>({qid:`q${n.length+i}`,correct}))]})}
 const nut={padding:'10px 16px',borderRadius:12,border:0,fontWeight:700,fontSize:15,cursor:'pointer'}
 return <div className="dao dao-vo dao-v2 dao2" style={{maxWidth:Number(q.get('rong')??520),margin:'0 auto',padding:16}}>
  <CanhRung profile={hoSo} ketQua={kq} tong={TONG} suKien={kq.length} chuong/>
  <div style={{display:'flex',gap:10,marginTop:14,flexWrap:'wrap'}}>
   <button type="button" id="dung" style={{...nut,background:'rgb(91,240,165)'}} onClick={()=>them(true)}>Đúng</button>
   <button type="button" id="sai" style={{...nut,background:'rgb(255,122,156)'}} onClick={()=>them(false)}>Sai</button>
   <button type="button" id="dung3" style={{...nut,background:'rgb(255,201,64)'}} onClick={()=>them(false,true,true,true)}>Đúng x3</button>
   <button type="button" id="lai" style={{...nut,background:'rgb(200,210,230)'}} onClick={()=>setKq([])}>Làm lại</button>
  </div>
 </div>
}
createRoot(document.getElementById('root')!).render(<StrictMode><section className="spirit-game spirit-game-dao"><XemThu/></section></StrictMode>)
