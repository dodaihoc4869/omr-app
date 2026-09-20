import {Suspense,lazy,useCallback,useEffect,useRef,useState} from 'react'
import {PETS} from './core'
import type {Arena,Mastery,Mode,Question} from './core'
import LearningBattle from './LearningBattle'
import type {BattleAnswer} from './learning-battle'
import {unlockBattleAudio} from './battle-audio'
import EscortRoom from './EscortRoom'
// Lối chơi chính mới (19/09): nạp riêng để không làm nặng đảo thần thú.
const DoanHoTong=lazy(()=>import('./DoanHoTong'))
// Màn ĐẦU TIÊN cả trường thấy sau reset (Code 6 dựng, docs/hop-dong-dao-than-thu-prop-2109.md). Phần còn lại của Đảo mới sẽ nối khi vỏ `dao/DaoThanThu` lên main.
const ChonBanDongHanh=lazy(()=>import('./dao/ChonBanDongHanh'))
const DaoCuaEm=lazy(()=>import('./dao/DaoCuaEm'))
/** Thẻ mở đầu khác nhau cho từng em — cùng công thức `theMoDau` của dao/ChonBanDongHanh (chép lại để không kéo cả gói lazy vào gói chính). */
const theMoDauCua=(sbd:string)=>{let h=2166136261;for(const c of sbd)h=Math.imul(h^c.charCodeAt(0),16777619);return 1+((h>>>0)%6)}
/** Võ đài 2 đấu 2 cũ giữ nguyên mã, chỉ đổi cửa vào: sự kiện tuần, mở thứ Bảy (giờ Việt Nam). */
export const laThuBayVn=(now=Date.now())=>new Date(now+7*3600000).getUTCDay()===6
/** CỬA VÀO TỪ NGOÀI (Bảng nhiệm vụ…): truyền prop `manDau="doan"`, hoặc đặt sessionStorage `game-v2:man-dau`=`doan` trước khi mở tab thần thú. */
export const KHOA_MAN_DAU='game-v2:man-dau'
type Tab='home'|'doan'|'learn'|'arena'|'progress'|'coming'
/** CỜ MỞ GAME (`doanMo` do máy chủ trả ở lệnh profile). TẮT ⇒ các mục game Y HỆT trước khi có Đoàn: không tab Đoàn, Võ đài cũ mở mọi ngày, tên tab cũ. */
export function cuaGame(doanMo:boolean,now=Date.now()):{nav:readonly (readonly [Tab,string])[];voDaiMo:boolean}{
 return doanMo?{nav:[['home','Đảo thần thú'],['doan','Đoàn Hộ Tống'],['arena','Võ đài thứ Bảy'],['progress','Tiến bộ của em'],['coming','Game mới · Sắp ra mắt']],voDaiMo:laThuBayVn(now)}
  :{nav:[['home','Đảo thần thú'],['arena','Hộ Tống Linh Tâm'],['progress','Tiến bộ của em'],['coming','Game mới · Sắp ra mắt']],voDaiMo:true}
}
function manDauTu(prop:unknown):Tab{let luu='';try{luu=sessionStorage.getItem(KHOA_MAN_DAU)??'';sessionStorage.removeItem(KHOA_MAN_DAU)}catch{/* Storage may be disabled. */}return prop==='doan'||luu==='doan'?'doan':'home'}
import ProgressChart from './ProgressChart'
import TheCau from '../../components/TheCau'
import type {TheCauProps} from '../../components/TheCau'
import {LoiGiaiCauSai} from '../../components/KhoiCauSai'
import {HinhTaiViTri,ManHinhAnh} from '../../components/QuestionMedia'
import {layDiaChiMayChu} from '../../lib/dia-chi-may-chu'
import {hsDangNhapApi} from '../../lib/exam-api'
import type {HinhAnh} from '../../data/examContent'
import './game.css'
import ImmortalShield from './ImmortalShield'
import type {ShieldState} from './shields'
interface Profile {nickname?:string;academic?:{total:number;today:number;lastGain:number;dailyLimit:number};shields?:ShieldState;pet:string;choice:boolean;cap:number;exp:number;wallet:number;earned:number;tower:number;mastery:Mastery[];arena:Arena|null}
interface Feedback {correct:boolean;answer:string;solution:unknown;reward:number;stage:number;solutionImages:HinhAnh[]}
interface Result {ok:boolean;doanMo?:boolean;dailyUsed?:number;suggestions?:{title:string;source:string;part:string}[];history?:{day:string;total:number;correct:number}[];mode?:Mode;answered?:{attempt:{qid:string;correct:boolean};correct:boolean;answer:string;solution:unknown;reward:number;stage:number;solutionImages:HinhAnh[]}[];pass?:string;tasks?:{id:string;dang:string}[];error?:string;profile?:Profile;revision?:number;remaining?:number;questions?:Question[];id?:string;message?:string;missing?:number;correct?:boolean;answer?:string;solution?:unknown;reward?:number;stage?:number;solutionImages?:HinhAnh[]}
interface Props {sbd:string;token?:string;manDau?:'home'|'doan';onDong:()=>void;[key:string]:unknown}
export default function Game({sbd,token:initialToken,manDau,onDong}:Props){
 const [recommendation,setRecommendation]=useState<Result|null>(null)
 const [doanMo,setDoanMo]=useState(false)
 const [,setExpPending]=useState(0)
 const latestRevision=useRef(0)
 useEffect(()=>{latestRevision.current=0},[sbd])
 const [zoom,setZoom]=useState('')
 const [tasks,setTasks]=useState<{id:string;dang:string}[]>([])
 const [token,setToken]=useState(()=>{try{return sessionStorage.getItem(`game-v2:${sbd}`)||initialToken||''}catch{return initialToken||''}});const [password,setPassword]=useState('')
 const [profile,setProfile]=useState<Profile|null>(null);const [,setRevision]=useState(0);const [tab,setTab]=useState<Tab>(()=>manDauTu(manDau))
 const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [notice,setNotice]=useState('');const [syncLeft,setSyncLeft]=useState<number|null>(null)
 const [mediaFailed,setMediaFailed]=useState(false)
 const [battleAnswers,setBattleAnswers]=useState<BattleAnswer[]>([]);const [battleEvent,setBattleEvent]=useState(0)
 const [session,setSession]=useState('');const [questions,setQuestions]=useState<Question[]>([]);const [position,setPosition]=useState(0);const [mode,setMode]=useState<Mode>('adventure');const [answer,setAnswer]=useState('');const [assisted,setAssisted]=useState(false);const [feedback,setFeedback]=useState<Feedback|null>(null);const [done,setDone]=useState(false)
 // Cửa vào từ ngoài xin mở thẳng Đoàn nhưng máy chủ báo em chưa được mở → về Đảo thần thú như cũ, không để màn trống.
 useEffect(()=>{if(profile&&!doanMo&&tab==='doan')setTab('home')},[profile,doanMo,tab])
 const mounted=useRef(true);const running=useRef(false)
 useEffect(()=>()=>{mounted.current=false},[])
 const request=useCallback(async(action:string,data:Record<string,unknown>={},sessionToken=token):Promise<Result>=>{
  const base=await layDiaChiMayChu('');const response=await fetch(`${base}/game-v2/${action}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...data,token:sessionToken})});const r=await response.json() as Result
  if(!r.ok){if(/Phiên game|Mật khẩu đã đổi|nhập lại mật khẩu/.test(r.error??'')){setToken('');setProfile(null);try{sessionStorage.removeItem(`game-v2:${sbd}`)}catch{/* Storage may be disabled. */}}throw new Error(r.error||'Chưa kết nối được game. Em thử lại.')}
  if(mounted.current){if(typeof r.doanMo==='boolean')setDoanMo(r.doanMo);if(r.tasks)setTasks(r.tasks);if(r.profile&&(r.revision??0)>=latestRevision.current){setProfile(r.profile);latestRevision.current=r.revision??0;if(r.revision!==undefined)setRevision(r.revision)}}return r
 },[token,sbd])
 useEffect(()=>{const update=(event:Event)=>{const d=(event as CustomEvent).detail;if(d.sbd===sbd&&d.profile&&d.revision>=latestRevision.current){latestRevision.current=d.revision;setExpPending(d.pending??0);setProfile(d.profile);setRevision(d.revision)}};window.addEventListener('spirit-academic-synced',update);return()=>window.removeEventListener('spirit-academic-synced',update)},[sbd])
 const run=async(fn:()=>Promise<unknown>)=>{if(running.current)return;running.current=true;setBusy(true);setError('');try{await fn()}catch(e){setError(e instanceof Error?e.message:'Không kết nối được. Em thử lại.')}finally{running.current=false;if(mounted.current)setBusy(false)}}
 useEffect(()=>{mounted.current=true;if(!token){setBusy(false);return}let cancelled=false;setBusy(true);request('profile').catch(e=>{if(!cancelled)setError(String(e.message))}).finally(()=>{if(!cancelled)setBusy(false)});return()=>{cancelled=true}},[token,request])
 useEffect(()=>{if(!token)return;let pending=false;const refresh=async()=>{if(document.hidden||pending||running.current)return;pending=true;try{await request('profile')}catch{/* The next user action reports authentication errors. */}finally{pending=false}};const timer=setInterval(()=>void refresh(),20000);window.addEventListener('focus',refresh);return()=>{clearInterval(timer);window.removeEventListener('focus',refresh)}},[token,request])
 useEffect(()=>{if(!token||!profile||profile.choice)return;let active=true;const refresh=()=>{if(!document.hidden)void request('recommendations').then(r=>{if(active)setRecommendation(r)}).catch(()=>{})};refresh();const timer=setInterval(refresh,30000);return()=>{active=false;clearInterval(timer)}},[token,request,profile?.earned,profile?.mastery,profile?.choice])
 const login=()=>run(async()=>{const r=await hsDangNhapApi('',sbd,password);if(!r.ok||!r.token)throw new Error(r.error||(r.chuaCoMatKhau?'Em đặt mật khẩu ở app học sinh trước khi mở game.':'Máy chủ chưa cấp được phiên game. Mật khẩu chưa được xác định là sai; em thử lại sau.'));await request('profile',{},r.token);try{sessionStorage.setItem(`game-v2:${sbd}`,r.token)}catch{/* Login still works without local storage. */}setPassword('');setToken(r.token)})
 const start=(next:Mode,dang?:string,guardian?:string)=>run(async()=>{
  setNotice('Đang đối chiếu kho bài tập và phần em đã học.');let result=await request('sync');setSyncLeft(result.remaining??0)
  while((result.remaining??0)>0&&mounted.current){result=await request('sync');setSyncLeft(result.remaining??0)}
  const r=await request('start',{mode:next,dang,guardian});setSyncLeft(null);setBattleAnswers([]);setBattleEvent(0);setMode(next);setSession(r.id??'');setQuestions(r.questions??[]);setPosition(0);setAnswer('');setMediaFailed(false);setFeedback(null);setAssisted(false);setDone(false);setTab('learn');setNotice(r.message||(r.missing?`${r.missing} dòng kết quả chưa nối được với kho, chưa dùng để phân bài.`:''))
 })
 const resume=()=>run(async()=>{const r=await request('resume');if(!r.id||!r.questions?.length){setNotice('Chưa có lượt đang học để tiếp tục.');return}setSession(r.id);setQuestions(r.questions);setMode(r.mode??'adventure');const answered=r.answered??[];setBattleAnswers(answered.map(a=>a.attempt));setBattleEvent(0);const first=r.questions.findIndex(q=>!answered.some(a=>a.attempt.qid===q.qid));setPosition(first<0?r.questions.length-1:first);setAnswer('');setMediaFailed(false);setFeedback(null);setAssisted(false);if(first<0)await request('complete',{session:r.id});setDone(first<0);setTab('learn')})
 const submit=()=>run(async()=>{const q=questions[position];if(!q)return;const r=await request('answer',{session,qid:q.qid,answer,assisted});setBattleAnswers(previous=>previous.some(a=>a.qid===q.qid)?previous:[...previous,{qid:q.qid,correct:!!r.correct}]);setBattleEvent(e=>e+1);setFeedback({correct:!!r.correct,answer:r.answer??'',solution:r.solution,reward:r.reward??0,stage:r.stage??0,solutionImages:r.solutionImages??[]})})
 const next=()=>run(async()=>{if(position+1>=questions.length){await request('complete',{session});setDone(true)}else{setPosition(position+1);setAnswer('');setMediaFailed(false);setFeedback(null);setAssisted(false)}})
 const petIndex=Math.max(0,PETS.findIndex(p=>p.id===profile?.pet))
 const q=questions[position]
 const questionProps=():TheCauProps|null=>{
  if(!q)return null;const base={stt:position+1,onZoom:setZoom,text:q.text,table:q.table,thanCauImg:q.thanCauImg,imageDataUrl:q.imageDataUrl,hinhAnh:q.hinhAnh as HinhAnh[],tieuDe:q.tenDang||'Câu trong bài em đã học',cheDo:'thi' as const}
  if(q.phan==='I')return {...base,phan:'I',choices:q.choices as [string,string,string,string],choiceImgs:q.choiceImgs as [string?,string?,string?,string?],choicePerm:[0,1,2,3],selected:(answer||null) as 'A'|'B'|'C'|'D'|null,onSelect:v=>{if(!feedback&&!busy)setAnswer(v)}}
  if(q.phan==='II')return {...base,phan:'II',ideas:q.ideas as [string,string,string,string],ideaImgs:q.ideaImgs as [string?,string?,string?,string?],selected:Array.from({length:4},(_,i)=>(answer[i]==='D'||answer[i]==='S'?answer[i]:null) as 'D'|'S'|null),onSelect:(i,v)=>{if(!feedback&&!busy){const a=(answer||'----').split('');a[i]=v;setAnswer(a.join(''))}}}
  return {...base,phan:'III',selected:answer,onChange:v=>{if(!feedback&&!busy)setAnswer(v)}}
 }
 const qp=questionProps()
 return <section className="spirit-game" aria-label="Thần Thú Hoá Học">
  {zoom&&<ManHinhAnh src={zoom} alt="Ảnh câu hỏi / lời giải" onClose={()=>setZoom('')}/>}
  {/* Đảo bản mới có đầu trang riêng ("BÁT LINH ĐẢO" + tên thú) → ẩn đầu trang cũ ở tab Đảo và ở màn chọn thú; các tab khác giữ nguyên. Thanh mục GIỮ tới khi vỏ Đảo của Code 6 có thanh dưới. */}
  {!(profile&&(profile.choice||tab==='home'))&&<header className="spirit-header"><div><small>HỌC HOÁ · NUÔI THẦN THÚ</small><h1>Bát Linh Đảo</h1></div><button onClick={onDong}>Về app học sinh</button></header>}
  {error&&<div role="alert" className="spirit-error">{error}<button onClick={()=>void run(()=>request('profile'))}>Tải lại hồ sơ</button></div>}
  {!token||(!profile&&!busy)?<div className="spirit-panel"><h2>Mở hồ sơ game của em</h2><p>Nhập mật khẩu học sinh để giữ tiến độ giữa các thiết bị.</p><input type="password" autoComplete="current-password" aria-label="Mật khẩu học sinh" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')void login()}}/><button disabled={busy||!password} onClick={()=>void login()}>Mở game</button></div>:null}
  {busy&&<p role="status" className="spirit-status">{syncLeft!==null?`Đang nối kho bài tập, còn ${syncLeft} tờ đề…`:'Đang lưu và kiểm tra…'}</p>}
  {profile&&<>
   <nav className="spirit-nav" aria-label="Mục game">{cuaGame(doanMo).nav.map(([id,label])=><button key={id} aria-current={tab===id?'page':undefined} onClick={()=>setTab(id)}>{label}</button>)}</nav>
   {!profile.choice&&<>
   {tab==='learn'&&<div className="spirit-panel">
    <header className="spirit-row"><h2>{mode==='arena'?'Luyện Hoá tiếp sức đội':'Nhiệm vụ của em'}</h2><span>{questions.length?`${Math.min(position+1,questions.length)} / ${questions.length} câu`:''}</span></header>
    {notice&&<p>{notice}</p>}
    {!!questions.length&&<LearningBattle key={session} pet={petIndex} nickname={profile.nickname} level={profile.cap} answers={battleAnswers} total={questions.length} event={battleEvent} finished={done}/>}
    {!questions.length?<button className="spirit-start-button" disabled={busy} onClick={()=>void start('adventure')}>Bắt đầu làm nhiệm vụ mới</button>:done?<div className="spirit-finish"><h3>Đã lưu lượt học</h3><p>Em xem dạng cần ôn và ngày kiểm tra lại trong “Tiến bộ của em”.</p><button onClick={()=>setTab(mode==='arena'?'arena':'progress')}>{mode==='arena'?'Về Linh Tâm':'Xem tiến bộ'}</button>{mode!=='arena'&&<button disabled={busy} onClick={()=>void start('adventure')}>Bắt đầu làm nhiệm vụ mới</button>}</div>:<>
     <div className="spirit-nodes" aria-label="Các câu trong lượt">{questions.map((x,i)=><span key={x.qid} className={i===position?'current':i<position?'completed':''}>{i+1}</span>)}</div>
     {q&&<p className="spirit-source">Nguồn: {q.maDe} · {q.qid} · {q.mucDo==='biet'?'Nhận biết':q.mucDo==='hieu'?'Thông hiểu':q.mucDo==='van_dung'?'Vận dụng':'Chưa gắn mức độ'} · {q.sao===null?'Chưa gắn sao':`${q.sao} sao`}</p>}
     {qp&&<div onErrorCapture={e=>{if((e.target as HTMLElement).tagName==='IMG')setMediaFailed(true)}}><TheCau {...qp}/></div>}{mediaFailed&&<p role="alert">Hình của câu chưa tải được. Em mở lại lượt học; câu này chưa bị tính sai.</p>}
     {!feedback?<><label className="spirit-help"><input type="checkbox" checked={assisted} onChange={e=>setAssisted(e.target.checked)}/> Em có dùng tài liệu hoặc được trợ giúp ở câu này</label><button className="spirit-primary" disabled={busy||mediaFailed||!answer||answer.includes('-')&&q?.phan==='II'} onClick={()=>{unlockBattleAudio();void submit()}}>Trả lời · tung chưởng</button></>:<div className="spirit-feedback" aria-live="polite"><h3>{feedback.correct?'Em đã trả lời đúng':'Em xem lại bước làm ở dưới'}</h3>{feedback.reward>0&&<p className="spirit-reward">+{feedback.reward} EXP</p>}<div className="spirit-bank-solution"><LoiGiaiCauSai hoaHoc c={{text:q?.text,phan:q?.phan,dapAnDung:feedback.answer,loiGiai:feedback.solution}}/><HinhTaiViTri hinhAnh={feedback.solutionImages} viTri="sau_loi_giai" nhan="lời giải" onZoom={setZoom}/></div>{mode==='arena'&&<button onClick={()=>setTab('arena')}>Về Linh Tâm · chốt hành động</button>}<button className="spirit-primary" disabled={busy} onClick={()=>void next()}>{position+1===questions.length?'Hoàn thành lượt':'Đã đọc, sang câu tiếp'}</button></div>}
    </>}
   </div>}
   </>}
   {/* ĐẢO THẦN THÚ bản mới — màn "Hòn đảo của em" của Code 6 (dao/DaoCuaEm): thú thật + vòng EXP + MỘT thẻ chuyến thám hiểm + MỘT nút LÊN ĐƯỜNG. Thuật toán chọn câu/chấm/thưởng giữ nguyên. */}
   {!profile.choice&&tab==='home'&&<><Suspense fallback={<p role="status" className="spirit-status">Đang mở đảo…</p>}><div className="dao"><DaoCuaEm profile={profile} goiY={recommendation?.suggestions??null} conLai={recommendation?.remaining??null} tasks={tasks} busy={busy} thongBao={notice} loi={error} onLenDuong={()=>void start('adventure')} onOnTheoNhac={dang=>void start('repair',dang)} onNap={()=>void run(()=>request('invest'))} onDoiTen={ten=>void run(()=>request('rename',{name:ten}))}/></div></Suspense>
    <div className="spirit-row"><button disabled={busy} onClick={()=>void resume()}>Tiếp tục lượt học gần nhất</button></div>
    <ImmortalShield level={profile.cap} state={profile.shields} busy={busy} onUse={id=>run(()=>request('shield-use',{useId:id}))}/></>}
   {profile.choice?<Suspense fallback={<p role="status" className="spirit-status">Đang gọi tám thần thú…</p>}><ChonBanDongHanh batDau={theMoDauCua(sbd)} busy={busy} loi={error} moiDoan={doanMo&&tab==='doan'} onChon={(petId,ten)=>void run(async()=>{await request('choose',{pet:petId});if(ten)await request('rename',{name:ten})})}/></Suspense>:<>
   {doanMo&&tab==='doan'&&<Suspense fallback={<p role="status" className="spirit-status">Đang mở đường cho Đoàn Hộ Tống…</p>}><DoanHoTong call={request} sbd={sbd} pet={petIndex} cap={profile.cap} onDong={()=>setTab('home')} onVeBangNhiemVu={onDong}/></Suspense>}
   {cuaGame(doanMo).voDaiMo?<div hidden={tab!=='arena'}><EscortRoom storageKey={sbd} call={request} active={tab==='arena'}/></div>:tab==='arena'&&<div className="spirit-panel"><small>SỰ KIỆN TUẦN</small><h2>Võ đài thứ Bảy</h2><p>Đấu đội 2 đấu 2 mở vào <strong>thứ Bảy hằng tuần</strong>. Các ngày còn lại, cả lớp cùng đi <strong>Đoàn Hộ Tống</strong>: mỗi ngày một chặng 5–6 phút, làm đúng câu vừa sức của mình là góp sức cho cả đoàn.</p><button className="spirit-primary" onClick={()=>setTab('doan')}>Vào Đoàn Hộ Tống</button></div>}
   {tab==='coming'&&<div className="spirit-panel mission-coming"><span aria-hidden="true">✦</span><small>CHUẨN BỊ PHÁT HÀNH</small><h2>Một hành trình mới đang đến</h2><p>Game mới đang được chuẩn bị. Em tiếp tục làm nhiệm vụ để nuôi thần thú nhé.</p></div>}
   {tab==='progress'&&<ProgressChart request={request}/>}
   </>}
  </>}
 </section>
}
