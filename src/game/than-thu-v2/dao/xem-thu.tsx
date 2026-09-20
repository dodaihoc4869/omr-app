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

const q=new URLSearchParams(location.search),man=q.get('man')??'chon'
function ManChon(){const [busy,setBusy]=useState(false),[da,setDa]=useState('')
 return <>{da&&<p data-da-chon>{da}</p>}<ChonBanDongHanh batDau={q.has('dau')?Number(q.get('dau')):theMoDau(q.get('sbd')??'12121212')} busy={busy} loi={q.get('loi')??''} moiDoan={q.has('doan')} onChon={(pet,ten)=>{setBusy(true);setTimeout(()=>{setBusy(false);setDa(`${pet}|${ten}`)},400)}}/></>}
createRoot(document.getElementById('root')!).render(<StrictMode><section className="spirit-game" style={{padding:0,borderRadius:0}}>{man==='chon'&&<ManChon/>}</section></StrictMode>)
