import {Suspense,useCallback,useEffect,useRef,useState} from 'react'
import {boNap,lazyNapTruoc,taoGoiSom} from '../../components/hoa2/nap-truoc-man'
import {PETS} from './core'
import type {Arena,Mastery,Mode,Question} from './core'
import LearningBattle from './LearningBattle'
import type {BattleAnswer} from './learning-battle'
import {unlockBattleAudio} from './battle-audio'
import EscortRoom from './EscortRoom'
import {chanPhanHoiCau} from '../../lib/cau-tu-luan-may-hs'
import {CHU_CAU_DOI,CHU_HET_TRAN_GAME,laLoiCauDoi,laLoiHetTran,loiCuaKetQua,maCuaLoi} from './loi-het-tran'
import {batNhipBenVung} from '../../lib/nhip-ben-vung'
// Lối chơi chính mới (19/09): nạp riêng để không làm nặng đảo thần thú.
// Nạp lười kiểu `lazyNapTruoc` (05/10, components/hoa2/nap-truoc-man.ts): Sảnh 2.0 nạp trước lúc rảnh ⇒ mảnh đã có thì vẽ thẳng, không treo màn chờ.
const DoanHoTong=lazyNapTruoc(boNap(()=>import('./DoanHoTong')))
// Đảo thần thú bản mới: MỘT vỏ của Code 6, nạp lazy.
const DaoThanThu=lazyNapTruoc(boNap(()=>import('./dao/DaoThanThu')))
/** Sảnh 2.0 nạp trước lúc rảnh (components/hoa2/man-sanh-luoi.ts): mảnh Đảo (vỏ Đảo + Đảo 2.0) / mảnh Đoàn Hộ Tống. */
export const napTruocDao=()=>DaoThanThu.napTruoc().then(m=>m.napTruocDao2())
export const napTruocDoan=()=>DoanHoTong.napTruoc()
/** Võ đài 2 đấu 2 cũ giữ nguyên mã, chỉ đổi cửa vào: sự kiện tuần, mở thứ Bảy (giờ Việt Nam). */
export const laThuBayVn=(now=Date.now())=>new Date(now+7*3600000).getUTCDay()===6
/** CỬA VÀO TỪ NGOÀI (Bảng nhiệm vụ, Sảnh bản đồ 2.0…): truyền prop `manDau="doan"`, hoặc đặt sessionStorage `game-v2:man-dau`=`doan` trước khi mở tab thần thú.
 *  Giá trị: `doan` (Đoàn Hộ Tống) · `shop` (Cửa hàng phụ kiện, khi máy chủ báo shopBat) · `tui-do` (Túi đồ trong Đảo thần thú). */
export const KHOA_MAN_DAU='game-v2:man-dau'
type Tab='home'|'doan'|'learn'|'arena'|'progress'|'coming'
/** CỜ MỞ GAME (`doanMo` do máy chủ trả ở lệnh profile). TẮT ⇒ các mục game Y HỆT trước khi có Đoàn: không tab Đoàn, Võ đài cũ mở mọi ngày, tên tab cũ.
 *  GAME HÓA 2.0 (`cheDo2`, cờ `game_hoa_2` — `hoa2-sanh` trả `cheDo2:true`): thanh chọn chỉ còn Đảo thần thú (+ Đoàn Hộ Tống khi `doanMo`) — bỏ Võ đài, Tiến bộ, Sắp ra mắt. Cờ tắt ⇒ như cũ. */
export function cuaGame(doanMo:boolean,now=Date.now(),cheDo2=false):{nav:readonly (readonly [Tab,string])[];voDaiMo:boolean}{
 if(cheDo2)return {nav:[['home','Bát Linh Đảo'],...(doanMo?[['doan','Đoàn Hộ Tống'] as const]:[])],voDaiMo:false}
 return doanMo?{nav:[['home','Bát Linh Đảo'],['doan','Đoàn Hộ Tống'],['arena','Võ đài thứ Bảy'],['progress','Tiến bộ của em'],['coming','Game mới · Sắp ra mắt']],voDaiMo:laThuBayVn(now)}
  :{nav:[['home','Bát Linh Đảo'],['arena','Hộ Tống Linh Tâm'],['progress','Tiến bộ của em'],['coming','Game mới · Sắp ra mắt']],voDaiMo:true}
}
function docManDau(prop:unknown):{tab:Tab;shop:boolean;tuiDo:boolean;thanThu:boolean}{let luu='';try{luu=sessionStorage.getItem(KHOA_MAN_DAU)??'';sessionStorage.removeItem(KHOA_MAN_DAU)}catch{/* Storage may be disabled. */}return {tab:prop==='doan'||luu==='doan'?'doan':'home',shop:prop==='shop'||luu==='shop',tuiDo:prop==='tui-do'||luu==='tui-do',thanThu:prop==='than-thu'||luu==='than-thu'}} // 'shop' = mở thẳng Cửa hàng phụ kiện (chỉ khi máy chủ báo shopBat)
import ProgressChart from './ProgressChart'
import TheCau from '../../components/TheCau'
import type {TheCauProps} from '../../components/TheCau'
import {LoiGiaiCauSai} from '../../components/KhoiCauSai'
import {HinhTaiViTri,ManHinhAnh} from '../../components/QuestionMedia'
import {layDiaChiMayChu} from '../../lib/dia-chi-may-chu'
import {hsDangNhapApi} from '../../lib/exam-api'
import type {HinhAnh} from '../../data/examContent'
import './game.css'
import type {ShieldState} from './shields'
interface Profile {nickname?:string;academic?:{total:number;today:number;lastGain:number;dailyLimit:number};shields?:ShieldState;pet:string;choice:boolean;cap:number;exp:number;wallet:number;earned:number;tower:number;mastery:Mastery[];arena:Arena|null}
interface Feedback {correct:boolean;answer:string;solution:unknown;reward:number;stage:number;solutionImages:HinhAnh[]}
interface Result {ok:boolean;doanMo?:boolean;dailyUsed?:number;suggestions?:{title:string;source:string;part:string}[];history?:{day:string;total:number;correct:number}[];mode?:Mode;answered?:{attempt:{qid:string;correct:boolean};correct:boolean;answer:string;solution:unknown;reward:number;stage:number;solutionImages:HinhAnh[]}[];pass?:string;tasks?:{id:string;dang:string}[];error?:string;profile?:Profile;revision?:number;remaining?:number;questions?:Question[];id?:string;message?:string;missing?:number;correct?:boolean;answer?:string;solution?:unknown;reward?:number;stage?:number;solutionImages?:HinhAnh[]}
interface Props {sbd:string;token?:string;manDau?:'home'|'doan'|'shop'|'tui-do'|'than-thu';onDong:()=>void;/** Đăng xuất (cổng học sinh) — chỉ đưa xuống màn "Thần thú của em" V2. */onDangXuat?:()=>void;[key:string]:unknown}
/** MỘT lệnh `game-v2/<action>` qua mạng — dùng cho `request` của Game và cho lệnh GỌI SỚM (dưới).
 *  HẠN 25 GIÂY (quét ổn định 30/09): trước đây fetch không hạn ⇒ mạng treo là nút bận MÃI (`running` khoá mọi lệnh sau) tới khi em tải lại trang.
 *  Lệnh answer/complete có biên nhận (session|qid) ở máy chủ nên bấm lại sau khi hết hạn không chấm hai lần. */
async function goiGame(action:string,data:Record<string,unknown>,sessionToken:string):Promise<Result>{
 const base=await layDiaChiMayChu('');const hetHan=new AbortController();const hen=setTimeout(()=>hetHan.abort(),25_000)
 try{const response=await fetch(`${base}/game-v2/${action}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...data,token:sessionToken}),signal:hetHan.signal});return await response.json() as Result}
 catch{throw new Error(hetHan.signal.aborted?'Máy chủ trả lời chậm. Em bấm lại nhé.':'Chưa kết nối được máy chủ. Em kiểm tra mạng rồi thử lại.')}
 finally{clearTimeout(hen)}
}
// GỌI SỚM (chuyển màn nhanh 05/10, components/hoa2/man-sanh-luoi.ts · moManGameNhanh): em chạm cửa game ở Sảnh 2.0 ⇒ bắn NGAY các lệnh đọc
// mà Game CHẮC CHẮN gọi đầu tiên (đúng lệnh, đúng thân `{token}`), song song với lúc vẽ màn; lượt `request` ĐẦU của lệnh ấy (không dữ liệu, cùng
// phiên, còn hạn, chưa hỏng) nhận lại lời hứa thay vì gọi lần hai — số lệnh tới máy chủ không đổi, chỉ đi sớm hơn. Hỏng trước lúc nhận ⇒ gọi như cũ.
const goiSom=taoGoiSom<Result>()
const khoaSom=(action:string,sessionToken:string)=>action+'\u0000'+sessionToken
const nhanLenhGame=(action:string,data:Record<string,unknown>,sessionToken:string)=>Object.keys(data).length?null:goiSom.nhan(khoaSom(action,sessionToken))
/** Phiên game của em — y như trạng thái `token` lúc Game mở (sessionStorage `game-v2:<sbd>`, không có thì phiên app). */
const phienGame=(sbd:string,initialToken?:string)=>{try{return sessionStorage.getItem(`game-v2:${sbd}`)||initialToken||''}catch{return initialToken||''}}
/** Sảnh gọi lúc em chạm cửa game (mảnh game đã có): `profile` + `hoa2-sanh` (Game mở là gọi); mở thẳng Đoàn Hộ Tống thì thêm `doan-sanh` (lệnh đầu của Đoàn). */
export function goiSomGame(sbd:string,initialToken:string|undefined,manDau:''|'doan'|'shop'|'tui-do'|'than-thu'=''):void{
 const sessionToken=phienGame(sbd,initialToken);if(!sessionToken)return
 for(const action of manDau==='doan'?['profile','hoa2-sanh','doan-sanh']:['profile','hoa2-sanh'])goiSom.ban(khoaSom(action,sessionToken),()=>goiGame(action,{},sessionToken))
}
export default function Game({sbd,token:initialToken,manDau,onDong,onDangXuat}:Props){
 const [doanMo,setDoanMo]=useState(false)
 // GAME HÓA 2.0: null = chưa biết (đang hỏi `hoa2-sanh`), true/false = đã biết. `sanh2` = phản hồi ấy, đưa cho Đảo dùng lần vẽ đầu.
 const [cheDo2,setCheDo2]=useState<boolean|null>(null),[sanh2,setSanh2]=useState<unknown>(null)
 const [,setExpPending]=useState(0)
 const latestRevision=useRef(0)
 useEffect(()=>{latestRevision.current=0},[sbd])
 const [zoom,setZoom]=useState('')
 const [tasks,setTasks]=useState<{id:string;dang:string}[]>([])
 const [token,setToken]=useState(()=>phienGame(sbd,initialToken));const [password,setPassword]=useState('')
 const [profile,setProfile]=useState<Profile|null>(null);const [,setRevision]=useState(0);const [manDauDoc]=useState(()=>docManDau(manDau));const [tab,setTab]=useState<Tab>(manDauDoc.tab)
 const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [maLoi,setMaLoi]=useState('');const [notice,setNotice]=useState('');const [syncLeft,setSyncLeft]=useState<number|null>(null)
 const [mediaFailed,setMediaFailed]=useState(false)
 const [battleAnswers,setBattleAnswers]=useState<BattleAnswer[]>([]);const [battleEvent,setBattleEvent]=useState(0)
 const [session,setSession]=useState('');const [questions,setQuestions]=useState<Question[]>([]);const [position,setPosition]=useState(0);const [mode,setMode]=useState<Mode>('adventure');const [answer,setAnswer]=useState('');const [assisted,setAssisted]=useState(false);const [feedback,setFeedback]=useState<Feedback|null>(null);const [done,setDone]=useState(false)
 // Cửa vào từ ngoài xin mở thẳng Đoàn nhưng máy chủ báo em chưa được mở → về Đảo thần thú như cũ, không để màn trống.
 useEffect(()=>{if(profile&&!doanMo&&tab==='doan')setTab('home')},[profile,doanMo,tab])
 // 2.0 không còn Võ đài / Tiến bộ / Sắp ra mắt ⇒ lỡ đứng ở các mục ấy thì về Đảo.
 useEffect(()=>{if(cheDo2&&(tab==='arena'||tab==='progress'||tab==='coming'))setTab('home')},[cheDo2,tab])
 // Rời tab Đảo ⇒ bỏ số bản đồ đã đọc (quay lại thì Đảo tự đọc mới — vd vừa phá xong ổ phục kích ở Đoàn).
 useEffect(()=>{if(tab!=='home')setSanh2(null)},[tab])
 const mounted=useRef(true);const running=useRef(false)
 useEffect(()=>()=>{mounted.current=false},[])
 useEffect(()=>()=>goiSom.xoa(),[]) // rời game ⇒ bỏ lệnh sớm chưa ai nhận (vd. `doan-sanh` khi Đoàn không mở)
 // `hoa2-sanh` ĐI SỚM cùng lúc với `profile` (05/10, xem hiệu ứng nạp hồ sơ dưới): lời hứa giữ riêng cho hiệu ứng hỏi chế độ 2.0 của chính thể hiện này.
 const [hoa2Som]=useState(()=>taoGoiSom<Result>())
 const request=useCallback(async(action:string,data:Record<string,unknown>={},sessionToken=token,som?:Promise<Result>|null):Promise<Result>=>{
  // Hạn 25 giây + lời lỗi mạng: xem goiGame. Lệnh đọc đã bắn sớm (lúc em chạm cửa ở Sảnh / lúc mở game — cùng lệnh, cùng thân) ⇒ nhận lại lời hứa ấy.
  const tho=await(som??nhanLenhGame(action,data,sessionToken)??goiGame(action,data,sessionToken))
  const r=chanPhanHoiCau(tho,`game-v2/${action}`) // chốt chặn cuối: bỏ câu tự luận (thầy lệnh 21/09)
  if(!r.ok){const loi=loiCuaKetQua(r) // `error` hoặc `loi` (lệnh Game Hóa 2.0) ⇒ hiện đúng lời máy chủ
   if(/Phiên game|Mật khẩu đã đổi|nhập lại mật khẩu/.test(loi)){setToken('');setProfile(null);try{sessionStorage.removeItem(`game-v2:${sbd}`)}catch{/* Storage may be disabled. */}}throw Object.assign(new Error(loi||'Chưa kết nối được game. Em thử lại.'),{ma:String((r as {ma?:unknown}).ma??'')})}
  if(mounted.current){if(typeof r.doanMo==='boolean')setDoanMo(r.doanMo);if(r.tasks)setTasks(r.tasks);if(r.profile&&(r.revision??0)>=latestRevision.current){setProfile(r.profile);latestRevision.current=r.revision??0;if(r.revision!==undefined)setRevision(r.revision)}}return r
 },[token,sbd])
 useEffect(()=>{const update=(event:Event)=>{const d=(event as CustomEvent).detail;if(d.sbd===sbd&&d.profile&&d.revision>=latestRevision.current){latestRevision.current=d.revision;setExpPending(d.pending??0);setProfile(d.profile);setRevision(d.revision)}};window.addEventListener('spirit-academic-synced',update);return()=>window.removeEventListener('spirit-academic-synced',update)},[sbd])
 const run=async(fn:()=>Promise<unknown>)=>{if(running.current)return;running.current=true;setBusy(true);setError('');setMaLoi('');try{await fn()}catch(e){setError(e instanceof Error?e.message:'Không kết nối được. Em thử lại.');setMaLoi(maCuaLoi(e))}finally{running.current=false;if(mounted.current)setBusy(false)}}
 // Hỏi MỘT lần mỗi phiên game: chế độ 2.0 bật cho em này chưa. Máy chủ cũ / lỗi ⇒ false (Đảo cũ nguyên vẹn).
 const coHoSo=!!profile
 useEffect(()=>{if(!token||!coHoSo)return;let huy=false
  request('hoa2-sanh',{},token,hoa2Som.nhan(token)).then(r=>{if(huy)return;const bat=(r as {cheDo2?:unknown}).cheDo2===true;setCheDo2(bat);setSanh2(bat?r:null)}).catch(()=>{if(!huy)setCheDo2(false)})
  return()=>{huy=true}},[token,coHoSo,request,hoa2Som])
 // `hoa2-sanh` (hiệu ứng trên hỏi khi hồ sơ về) BẮN SỚM cùng lúc với `profile` (05/10): hai lệnh đọc song song thay vì nối tiếp — bớt trọn một vòng mạng
 // trước khi thấy bản đồ. Lệnh sớm hỏng trước lúc hồ sơ về ⇒ hiệu ứng trên gọi lại như cũ. Sảnh đã bắn lúc em chạm cửa ⇒ nhận lại lệnh ấy, không gọi thêm.
 useEffect(()=>{mounted.current=true;if(!token){setBusy(false);return}let cancelled=false;setBusy(true);hoa2Som.ban(token,()=>nhanLenhGame('hoa2-sanh',{},token)??goiGame('hoa2-sanh',{},token));request('profile').catch(e=>{if(!cancelled)setError(String(e.message))}).finally(()=>{if(!cancelled)setBusy(false)});return()=>{cancelled=true}},[token,request,hoa2Som])
 useEffect(()=>{if(!token)return;let pending=false;const refresh=async():Promise<boolean>=>{if(document.hidden||pending||running.current)return true;pending=true;try{await request('profile');return true}catch{/* The next user action reports authentication errors. */return false}finally{pending=false}};
 // Nhịp nền CHẬM (180 s ± 30 s, không chồng, lỗi ⇒ lùi 30→60→120 s; sự cố D1 21/09: 20 giây × mọi máy em); vào game đã nạp hồ sơ nên KHÔNG gọi ngay; quay lại tab vẫn nạp nhưng dội ≥ 20 giây.
 const nhip=batNhipBenVung(refresh,{chayNgay:false});const kich=()=>nhip.kich();window.addEventListener('focus',kich);return()=>{nhip.dung();window.removeEventListener('focus',kich)}},[token,request])
 const login=()=>run(async()=>{const r=await hsDangNhapApi('',sbd,password);if(!r.ok||!r.token)throw new Error(r.error||(r.chuaCoMatKhau?'Em đặt mật khẩu ở app học sinh trước khi mở game.':'Máy chủ chưa cấp được phiên game. Mật khẩu chưa được xác định là sai; em thử lại sau.'));await request('profile',{},r.token);try{sessionStorage.setItem(`game-v2:${sbd}`,r.token)}catch{/* Login still works without local storage. */}setPassword('');setToken(r.token)})
 const start=(next:Mode,dang?:string,guardian?:string)=>run(async()=>{
  setNotice('Đang đối chiếu kho bài tập và phần em đã học.');let result=await request('sync');setSyncLeft(result.remaining??0)
  while((result.remaining??0)>0&&mounted.current){result=await request('sync');setSyncLeft(result.remaining??0)}
  const r=await request('start',{mode:next,dang,guardian});setSyncLeft(null);setBattleAnswers([]);setBattleEvent(0);setMode(next);setSession(r.id??'');setQuestions(r.questions??[]);setPosition(0);setAnswer('');setMediaFailed(false);setFeedback(null);setAssisted(false);setDone(false);setTab('learn');setNotice(r.message||(r.missing?`${r.missing} dòng kết quả chưa nối được với kho, chưa dùng để phân bài.`:''))
 })
 // Câu vừa được thầy sửa đề/đáp án (mã `cau_doi`, 29/09) ⇒ tự sang câu kế (không tính sai), hết câu thì kết thúc lượt — em không kẹt.
 const submit=()=>run(async()=>{const q=questions[position];if(!q)return;let r:Awaited<ReturnType<typeof request>>;try{r=await request('answer',{session,qid:q.qid,answer,assisted})}catch(e){if(!laLoiCauDoi(e))throw e;await sangCauKe();if(mounted.current)setNotice(CHU_CAU_DOI);return};setBattleAnswers(previous=>previous.some(a=>a.qid===q.qid)?previous:[...previous,{qid:q.qid,correct:!!r.correct}]);setBattleEvent(e=>e+1);setFeedback({correct:!!r.correct,answer:r.answer??'',solution:r.solution,reward:r.reward??0,stage:r.stage??0,solutionImages:r.solutionImages??[]})})
 const next=()=>run(sangCauKe)
 async function sangCauKe(){if(position+1>=questions.length){await request('complete',{session});setDone(true)}else{setPosition(position+1);setAnswer('');setMediaFailed(false);setFeedback(null);setAssisted(false)}}
 const petIndex=Math.max(0,PETS.findIndex(p=>p.id===profile?.pet))
 const q=questions[position]
 const questionProps=():TheCauProps|null=>{
  if(!q)return null;const base={stt:position+1,onZoom:setZoom,text:q.text,table:q.table,thanCauImg:q.thanCauImg,imageDataUrl:q.imageDataUrl,hinhAnh:q.hinhAnh as HinhAnh[],tieuDe:q.tenDang||'Câu trong bài em đã học',cheDo:'thi' as const}
  if(q.phan==='I')return {...base,phan:'I',choices:q.choices as [string,string,string,string],choiceImgs:q.choiceImgs as [string?,string?,string?,string?],choicePerm:[0,1,2,3],selected:(answer||null) as 'A'|'B'|'C'|'D'|null,onSelect:v=>{if(!feedback&&!busy)setAnswer(v)}}
  if(q.phan==='II')return {...base,phan:'II',ideas:q.ideas as [string,string,string,string],ideaImgs:q.ideaImgs as [string?,string?,string?,string?],selected:Array.from({length:4},(_,i)=>(answer[i]==='D'||answer[i]==='S'?answer[i]:null) as 'D'|'S'|null),onSelect:(i,v)=>{if(!feedback&&!busy){const a=(answer||'----').split('');a[i]=v;setAnswer(a.join(''))}}}
  return {...base,phan:'III',selected:answer,onChange:v=>{if(!feedback&&!busy)setAnswer(v)}}
 }
 const qp=questionProps()
 // Lỗi của lệnh nộp hiện NGAY TRÊN nút nộp (em đang ở cuối màn); hết trần câu trong ngày ⇒ thẻ rõ ràng thay nút nộp (thầy 20:28 "không nộp được bài").
 const loiOCuoi=!!error&&tab==='learn'&&!!qp&&!feedback,hetTran=loiOCuoi&&laLoiHetTran(error,maLoi),loiNutRef=useRef<HTMLDivElement>(null)
 useEffect(()=>{if(loiOCuoi)loiNutRef.current?.scrollIntoView?.({block:'nearest'})},[loiOCuoi,error])
 const voDao=!!profile&&(profile.choice||tab==='home')
 return <section className={voDao?'spirit-game spirit-game-dao':'spirit-game'} aria-label="Thần Thú Hoá Học">
  {zoom&&<ManHinhAnh src={zoom} alt="Ảnh câu hỏi / lời giải" onClose={()=>setZoom('')}/>}
  {/* Đảo bản mới có đầu trang riêng ("BÁT LINH ĐẢO" + tên thú) → ẩn đầu trang cũ ở tab Đảo và ở màn chọn thú; các tab khác giữ nguyên. Thanh mục GIỮ tới khi vỏ Đảo của Code 6 có thanh dưới. */}
  {!voDao&&<header className="spirit-header"><div><small>HỌC HOÁ · NUÔI THẦN THÚ</small><h1>Bát Linh Đảo</h1></div><button onClick={onDong}>Về app học sinh</button></header>}
  {error&&!loiOCuoi&&<div role="alert" className="spirit-error">{error}<button onClick={()=>void run(()=>request('profile'))}>Tải lại hồ sơ</button></div>}
  {!token||(!profile&&!busy)?<div className="spirit-panel"><h2>Mở hồ sơ game của em</h2><p>Nhập mật khẩu học sinh để giữ tiến độ giữa các thiết bị.</p><input type="password" autoComplete="current-password" aria-label="Mật khẩu học sinh" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')void login()}}/><button disabled={busy||!password} onClick={()=>void login()}>Mở game</button></div>:null}
  {busy&&!voDao&&<p role="status" className="spirit-status">{syncLeft!==null?`Đang nối kho bài tập, còn ${syncLeft} tờ đề…`:'Đang lưu và kiểm tra…'}</p>}
  {profile&&<>
   {!voDao&&<nav className="spirit-nav" aria-label="Mục game">{cuaGame(doanMo,Date.now(),!!cheDo2).nav.map(([id,label])=><button key={id} aria-current={tab===id?'page':undefined} onClick={()=>setTab(id)}>{label}</button>)}</nav>}
   {!profile.choice&&<>
   {tab==='learn'&&<div className="spirit-panel">
    <header className="spirit-row"><h2>{mode==='arena'?'Luyện Hoá tiếp sức đội':'Nhiệm vụ của em'}</h2><span>{questions.length?`${Math.min(position+1,questions.length)} / ${questions.length} câu`:''}</span></header>
    {notice&&<p>{notice}</p>}
    {!!questions.length&&<LearningBattle key={session} pet={petIndex} nickname={profile.nickname} level={profile.cap} answers={battleAnswers} total={questions.length} event={battleEvent} finished={done}/>}
    {!questions.length?<button className="spirit-start-button" disabled={busy} onClick={()=>void start('adventure')}>Bắt đầu làm nhiệm vụ mới</button>:done?<div className="spirit-finish"><h3>Đã lưu lượt học</h3><p>Em xem dạng cần ôn và ngày kiểm tra lại trong “Tiến bộ của em”.</p><button onClick={()=>setTab(mode==='arena'?'arena':'progress')}>{mode==='arena'?'Về Linh Tâm':'Xem tiến bộ'}</button>{mode!=='arena'&&<button disabled={busy} onClick={()=>void start('adventure')}>Bắt đầu làm nhiệm vụ mới</button>}</div>:<>
     <div className="spirit-nodes" aria-label="Các câu trong lượt">{questions.map((x,i)=><span key={x.qid} className={i===position?'current':i<position?'completed':''}>{i+1}</span>)}</div>
     {q&&<p className="spirit-source">Nguồn: {q.maDe} · {q.qid} · {q.mucDo==='biet'?'Nhận biết':q.mucDo==='hieu'?'Thông hiểu':q.mucDo==='van_dung'?'Vận dụng':'Chưa gắn mức độ'} · {q.sao===null?'Chưa gắn sao':`${q.sao} sao`}</p>}
     {qp&&<div onErrorCapture={e=>{if((e.target as HTMLElement).tagName==='IMG')setMediaFailed(true)}}><TheCau {...qp}/></div>}{mediaFailed&&<p role="alert">Hình của câu chưa tải được. Em mở lại lượt học; câu này chưa bị tính sai.</p>}
     {!feedback?<>{/* Hỏi thầy chỉ hiện trong hộp lời giải sau khi trả lời (thầy lệnh 30/09). */}<label className="spirit-help"><input type="checkbox" checked={assisted} onChange={e=>setAssisted(e.target.checked)}/> Em có dùng tài liệu hoặc được trợ giúp ở câu này</label>{loiOCuoi&&<div role="alert" className="spirit-error spirit-error-nut" ref={loiNutRef}>{hetTran?CHU_HET_TRAN_GAME:error}</div>}{!hetTran&&<button className="spirit-primary" disabled={busy||mediaFailed||!answer||answer.includes('-')&&q?.phan==='II'} onClick={()=>{unlockBattleAudio();void submit()}}>Trả lời · tung chưởng</button>}</>:<div className="spirit-feedback" aria-live="polite"><h3>{feedback.correct?'Em đã trả lời đúng':'Em xem lại bước làm ở dưới'}</h3>{feedback.reward>0&&<p className="spirit-reward">+{feedback.reward} EXP</p>}<div className="spirit-bank-solution"><LoiGiaiCauSai hoaHoc c={{text:q?.text,phan:q?.phan,dapAnDung:feedback.answer,loiGiai:feedback.solution}} qid={q?.qid} nguon="game"/><HinhTaiViTri hinhAnh={feedback.solutionImages} viTri="sau_loi_giai" nhan="lời giải" onZoom={setZoom}/></div>{mode==='arena'&&<button onClick={()=>setTab('arena')}>Về Linh Tâm · chốt hành động</button>}<button className="spirit-primary" disabled={busy} onClick={()=>void next()}>{position+1===questions.length?'Hoàn thành lượt':'Đã đọc, sang câu tiếp'}</button></div>}
    </>}
   </div>}
   </>}
   {/* ĐẢO THẦN THÚ bản mới (Code 6, docs/hop-dong-dao-than-thu-prop-2109.md): MỘT vỏ lo trọn chọn thú → đảo → thám hiểm → sổ tay → túi đồ + thanh dưới. Vỏ tự gọi choose/rename/recommendations/so-tay/resume/sync/start/answer/complete/shield-use/invest qua `request`. Lượt Võ đài (arena) vẫn ở tab learn cũ. */}
   {(profile.choice||tab==='home')&&(cheDo2===null?<p role="status" className="spirit-status">Đang mở đảo…</p>:<Suspense fallback={<p role="status" className="spirit-status">Đang mở đảo…</p>}><DaoThanThu sbd={sbd} token={token} moShopLucDau={manDauDoc.shop} moTuiDoLucDau={manDauDoc.tuiDo} moThanThuLucDau={manDauDoc.thanThu} profile={profile} doanMo={doanMo} call={request} tasks={tasks} moiDoan={doanMo&&tab==='doan'} onMoDoan={()=>setTab('doan')} onMoVoDai={cheDo2?undefined:()=>setTab('arena')} onMoTienBo={cheDo2?undefined:()=>setTab('progress')} onDong={onDong} onDangXuat={onDangXuat} cheDo2={cheDo2} sanh2={sanh2}/></Suspense>)}
   {!profile.choice&&<>
   {doanMo&&tab==='doan'&&<Suspense fallback={<p role="status" className="spirit-status">Đang mở đường cho Đoàn Hộ Tống…</p>}><DoanHoTong call={request} sbd={sbd} pet={petIndex} cap={profile.cap} token={token} onDong={()=>setTab('home')} onVeBangNhiemVu={onDong}/></Suspense>}
   {cheDo2===false&&cuaGame(doanMo).voDaiMo?<div hidden={tab!=='arena'}><EscortRoom storageKey={sbd} call={request} active={tab==='arena'}/></div>:tab==='arena'&&<div className="spirit-panel"><small>SỰ KIỆN TUẦN</small><h2>Võ đài thứ Bảy</h2><p>Đấu đội 2 đấu 2 mở vào <strong>thứ Bảy hằng tuần</strong>. Các ngày còn lại, cả lớp cùng đi <strong>Đoàn Hộ Tống</strong>: mỗi ngày một chặng 5–6 phút, làm đúng câu vừa sức của mình là góp sức cho cả đoàn.</p><button className="spirit-primary" onClick={()=>setTab('doan')}>Vào Đoàn Hộ Tống</button></div>}
   {tab==='coming'&&<div className="spirit-panel mission-coming"><span aria-hidden="true">✦</span><small>CHUẨN BỊ PHÁT HÀNH</small><h2>Một hành trình mới đang đến</h2><p>Game mới đang được chuẩn bị. Em tiếp tục làm nhiệm vụ để nuôi thần thú nhé.</p></div>}
   {tab==='progress'&&<ProgressChart request={request}/>}
   </>}
  </>}
 </section>
}
