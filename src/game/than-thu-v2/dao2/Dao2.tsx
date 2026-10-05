// ĐẢO THẦN THÚ · GAME HÓA 2.0 — khung điều khiển 4 màn mới (bản đồ → trong ải → lời giải → xong chuyến) + màn Đảo khoá.
// Chỉ chạy khi `hoa2-sanh` trả `cheDo2:true` (Game.tsx hỏi một lần, `DaoThanThu` chuyển vào đây). Cờ tắt ⇒ Đảo cũ nguyên vẹn.
// LUẬT CHƠI GIỮ NGUYÊN: cùng lệnh máy chủ như Đảo cũ — resume → sync → start (mode adventure) → answer → complete; máu/Cuồng nộ tính bằng
// `learningBattle`, EXP và lý do thưởng do máy chủ trả. Chỉ thêm các lệnh đọc `hoa2-sanh`, `hoa2-cau-da-lam` và mở rương `hoa2-ruong-mo`.
// OMNI 3 (05/10, docs/hop-dong-omni-3.md mục A) — CHỈ khi `hoa2-sanh` có `omni`: `answer` thêm `msLam` (+ `tuTin` khi chip "Chưa chắc" bật);
// kết quả có `omni` ⇒ một dòng nhỏ, "chắc mà sai" mở lời giải, lướt / vé thử thách không trừ Máu, Trạm hồi phục (`hoa2-omni-tram-xong`);
// cửa vào từ Sảnh (khoá `game-v2:omni-dao`): vé ⇒ `start` kèm `ve:'auto'`, đề thử ⇒ màn DeThu. Vắng `omni` ⇒ không gọi lệnh mới nào.
import {useCallback,useEffect,useRef,useState} from 'react'
import {giuTrangKhongTaiLai} from '../../../lib/cap-nhat-app'
import type {ReactNode} from 'react'
import {learningBattle} from '../learning-battle'
import type {BattleAnswer} from '../learning-battle'
import {chiSoThu,lyDoThuongTuKetQua,lyDoTranExpGame,tenThu} from '../dao/dao-core'
import {CHU_CAU_DOI,laLoiCauDoi,maCuaLoi} from '../loi-het-tran'
import {anhThu} from '../dao/anh'
import type {DaoCall,DaoKetQua,DaoProfile} from '../dao/kieu'
import BanDo from './BanDo'
import TrongAi from './TrongAi'
import type {PhanHoi2} from './TrongAi'
import XongChuyen from './XongChuyen'
import KhoaDao from './KhoaDao'
import TheTram from './TramHoiPhuc'
import DeThu from './DeThu'
import {docKetQuaOmni,lanDauChamChip,layViecOmniDao,thanOmniTraLoi} from '../../../lib/omni-hs'
import {omniTramXong} from '../../../components/hoa2/api'
import type {TramHoiPhuc} from '../../../../server/src/omni-kieu'
import {LOI_KHOA_DAO_MAC_DINH,SO_AI_CHUYEN,THONG_BAO_TRONG_2,docGoiY,docGoiYPhien,docSanh2,docSoChuyenXong,ghepGoiY,ghiSoChuyenXong,gopTomTat,henOnCua,nhoGoiYPhien,soChuyen,vungTheoDang} from './dao2-core'
import type {CauDao2,Sanh2} from './dao2-core'
import './dao2.css'

interface Luot2{id:string;cau:CauDao2[];luc:number;/** OMNI 3: chuyến của vé thử thách (chốt lúc soạn, câu thay ở Trạm không làm đổi). */ve?:boolean}
/** OMNI 3: vai câu của chuyến vé thử thách (máy chủ `start` kèm `ve`). Cả chuyến mang vai này ⇒ câu chưa đúng không trừ Máu. */
const VAI_VE='thu_thach'
const laChuyenVe=(cau:readonly CauDao2[])=>cau.length>0&&cau.every(c=>c.vai===VAI_VE)
interface Tram2{du:TramHoiPhuc;qid:string;session:string;xong:boolean}
type Answered=NonNullable<DaoKetQua['answered']>
/** Lượt máy chủ giữ 2 giờ (`answer` từ chối lượt cũ hơn) ⇒ lượt soạn sẵn quá hạn thì soạn lại. */
const HAN_LUOT=2*3600_000-5*60_000
const LOI_BAN_DO='Chưa mở được bản đồ đảo. Em kiểm tra mạng rồi thử lại.'

export interface Dao2Props{
 sbd:string;profile:DaoProfile;call:DaoCall;doanMo:boolean
 /** Phản hồi `hoa2-sanh` Game.tsx vừa đọc (để khỏi gọi lại lúc mở); vắng ⇒ tự đọc. */
 sanhDau?:unknown
 /** Thanh dưới của vỏ Đảo (Đảo · Sổ tay · Túi đồ · Cửa hàng) — chỉ hiện ở bản đồ và màn khoá. */
 thanhDuoi?:ReactNode
 /** Vỏ đang mở Sổ tay/Túi đồ: giữ nguyên trạng thái chuyến, chỉ ẩn. */
 an?:boolean
 onMoDoan:()=>void;onMoSoTay:()=>void;onDong:()=>void
}
export default function Dao2({sbd,profile,call:callProp,doanMo,sanhDau,thanhDuoi,an=false,onMoDoan,onMoSoTay,onDong}:Dao2Props){
 const callRef=useRef(callProp);callRef.current=callProp
 const call=useCallback<DaoCall>((action,data)=>callRef.current(action,data),[])
 const [sanh,setSanh]=useState<Sanh2|null>(()=>docSanh2(sanhDau)),[dangTai,setDangTai]=useState(false),[loiSanh,setLoiSanh]=useState('')
 const [daLam,setDaLam]=useState<unknown>(null)
 /** OMNI 3 · cửa vào từ Sảnh (đọc MỘT lần rồi tự xoá, như `game-v2:man-dau`): đề thử ⇒ mở thẳng màn đề thử; vé ⇒ chờ dùng cho lệnh `start` kế tiếp. */
 const [viecOmni]=useState(()=>layViecOmniDao()),veCho=useRef(false)
 const [luot,setLuot]=useState<Luot2|null>(null),[pha,setPha]=useState<'ban-do'|'ai'|'xong'|'de-thu'>(()=>viecOmni==='de-thu'&&docSanh2(sanhDau)?.omni?.deThu.duoc?'de-thu':'ban-do')
 // Đang trong ải/chặng/bài ⇒ app KHÔNG tự tải lại vì bản mới (quét ổn định 30/09, như Bi-a #95): bản mới chờ tới lúc em rời màn.
 useEffect(()=>pha==='ai'||pha==='de-thu'?giuTrangKhongTaiLai():undefined,[pha])
 // OMNI 3: bật khi `hoa2-sanh` có `omni` (cờ áp cho em). Tắt ⇒ mọi phần dưới đây nằm im: không chip, không trường thân mới, không lệnh mới.
 const omniBat=!!sanh?.omni
 const [chuaChac,setChuaChac]=useState(false),[goiYChip,setGoiYChip]=useState(false),[tram,setTram]=useState<Tram2|null>(null)
 /** Mốc câu hiện (performance.now) ⇒ `msLam` lúc gửi. */
 const mocCau=useRef(0)
 const [khoa,setKhoa]=useState(''),[het,setHet]=useState(''),[soan,setSoan]=useState('')
 const [viTri,setViTri]=useState(0),[ketQua,setKetQua]=useState<BattleAnswer[]>([]),[traLoi,setTraLoi]=useState(''),[assisted,setAssisted]=useState(false),[phanHoi,setPhanHoi]=useState<PhanHoi2|null>(null),[exp,setExp]=useState(0)
 const [busy,setBusy]=useState(false),[loi,setLoi]=useState(''),[maLoi,setMaLoi]=useState(''),[baoCau,setBaoCau]=useState('')
 const [xongHomNay,setXongHomNay]=useState(0),[coXatTruoc,setCoXatTruoc]=useState<number|null>(null),[ruongVua,setRuongVua]=useState<number|null>(null)
 const [ketThuc,setKetThuc]=useState<{dung:number;tong:number;exp:number;enemy:number;sai:{ai:number;qid:string}[]}|null>(null)
 const dangChay=useRef(false),conSong=useRef(true)
 useEffect(()=>{conSong.current=true;return()=>{conSong.current=false}},[])
 const chay=useCallback(async(viec:()=>Promise<void>)=>{if(dangChay.current)return;dangChay.current=true;setBusy(true);setLoi('');setMaLoi('')
  try{await viec()}catch(e){if(conSong.current){setLoi(e instanceof Error?e.message:'Không kết nối được. Em thử lại.');setMaLoi(maCuaLoi(e))}}finally{dangChay.current=false;if(conSong.current)setBusy(false)}},[])
 useEffect(()=>{if(sanh?.ngay)setXongHomNay(docSoChuyenXong(sbd,sanh.ngay))},[sbd,sanh?.ngay])

 useEffect(()=>{if(pha==='ai')mocCau.current=performance.now()},[pha,luot?.id,viTri])
 const napSanh=useCallback(async()=>{const s=docSanh2(await call('hoa2-sanh'));if(conSong.current&&s){setSanh(s);setLoiSanh('')}return s},[call])
 const napDaLam=useCallback(()=>{void call('hoa2-cau-da-lam').then(r=>{if(conSong.current)setDaLam(r)}).catch(()=>{})},[call])
 const datLuot=(l:Omit<Luot2,'luc'|'ve'>,da:Answered=[])=>{const dau=l.cau.findIndex(c=>!da.some(a=>a.attempt.qid===c.qid))
  setLuot({...l,luc:Date.now(),ve:laChuyenVe(l.cau)});setKetQua(da.map(a=>a.attempt));setExp(da.reduce((s,a)=>s+(a.reward||0),0));setViTri(Math.max(0,dau));setTraLoi('');setAssisted(false);setPhanHoi(null);setChuaChac(false);setGoiYChip(false);setTram(null)
  return {...l,luc:Date.now(),ve:laChuyenVe(l.cau)}}

 /** Soạn chuyến: chuyến dở (resume) → không thì sync tới hết → start. Khoá / hết câu ⇒ null (màn tự đổi). */
 const soanChuyen=useCallback(async(s:Sanh2|null):Promise<Luot2|null>=>{
  setHet('');setKhoa('')
  if(s?.khoaDao){setKhoa(s.loiKhoaDao||LOI_KHOA_DAO_MAC_DINH);return null}
  setSoan('Đang soạn hành trang…')
  try{
   const cu=await call('resume').catch(()=>null)
   if(cu?.id&&cu.questions?.length&&(cu.mode==='adventure'||cu.mode==='repair')){const da=cu.answered??[]
    if(cu.questions.some(c=>!da.some(a=>a.attempt.qid===c.qid)))return datLuot({id:cu.id,cau:ghepGoiY(cu.questions as CauDao2[],docGoiYPhien(cu.id))},da)
    await call('complete',{session:cu.id}).catch(()=>{})}
   let r=await call('sync')
   for(let i=0;i<400&&(r.remaining??0)>0&&conSong.current;i++){setSoan(`Đang soạn hành trang… còn ${r.remaining} bài cần xem lại`);r=await call('sync')}
   // OMNI 3 · vé thử thách: dùng MỘT lần cho lệnh start kế tiếp (lỗi như hết vé ⇒ "Thử lại" soạn chuyến thường).
   const dungVe=veCho.current;veCho.current=false
   const st=await call('start',dungVe?{mode:'adventure',ve:'auto'}:{mode:'adventure'}) as DaoKetQua&{lyDo?:string;khoaDao?:boolean}
   if(conSong.current)setSanh(x=>gopTomTat(x,st))
   if(st.lyDo==='khoa_cho_doan'||st.khoaDao===true){setKhoa(st.message||LOI_KHOA_DAO_MAC_DINH);return null}
   const cau=((st.questions??[]) as CauDao2[]).map(c=>dungVe&&!c.vai?{...c,vai:VAI_VE}:c)
   if(!cau.length||!st.id){setHet(st.message||THONG_BAO_TRONG_2);return null}
   nhoGoiYPhien(st.id,cau);return datLuot({id:st.id,cau})
  }finally{if(conSong.current)setSoan('')}
 },[call]) // eslint-disable-line react-hooks/exhaustive-deps

 // MỞ ĐẢO: đọc bản đồ (nếu Game.tsx chưa đọc sẵn) rồi soạn sẵn chuyến kế tiếp để bản đồ vẽ đúng 6 ô vai + nút Trùm.
 useEffect(()=>{void chay(async()=>{let s=sanh
  if(!s||s.canChonThu){setDangTai(true);try{s=await napSanh()}catch(e){if(conSong.current)setLoiSanh(e instanceof Error&&e.message?e.message:LOI_BAN_DO);return}finally{if(conSong.current)setDangTai(false)}}
  if(!s){setLoiSanh(LOI_BAN_DO);return}
  if(viecOmni==='de-thu'&&s.omni?.deThu.duoc){setPha('de-thu');return}
  if(viecOmni==='ve'&&s.omni&&s.omni.ve.con>0)veCho.current=true
  await soanChuyen(s)});napDaLam()},[]) // eslint-disable-line react-hooks/exhaustive-deps

 const moChuyen=async()=>{let l=luot&&Date.now()-luot.luc<HAN_LUOT?luot:null
  if(!l){setLuot(null);l=await soanChuyen(sanh)}
  if(l){setCoXatTruoc(sanh?.chienDich?.coXat??null);setKetThuc(null);setPha('ai')}else setPha('ban-do')}
 const lenDuong=()=>chay(moChuyen)
 const thuLai=()=>chay(async()=>{setDangTai(true);try{const s=await napSanh();if(!s){setLoiSanh(LOI_BAN_DO);return}await soanChuyen(s)}catch(e){setLoiSanh(e instanceof Error&&e.message?e.message:LOI_BAN_DO)}finally{if(conSong.current)setDangTai(false)}})
 const nop=()=>chay(async()=>{const q=luot?.cau[viTri];if(!luot||!q)return
  setBaoCau('')
  // Câu vừa được thầy sửa đề/đáp án (mã `cau_doi`, 29/09) ⇒ không để em kẹt: tự sang ải kế (câu không bị tính sai), hết ải thì kết thúc chuyến.
  // OMNI 3: `msLam` = từ lúc câu hiện tới lúc gửi; `tuTin:'chua_chac'` khi chip bật. Cờ tắt ⇒ thân y hệt cũ.
  const than={session:luot.id,qid:q.qid,answer:traLoi,assisted,...thanOmniTraLoi(omniBat,performance.now()-mocCau.current,chuaChac)}
  let r:Awaited<ReturnType<DaoCall>>;try{r=await call('answer',than)}catch(e){if(!laLoiCauDoi(e))throw e;await sangAiKe();if(conSong.current)setBaoCau(CHU_CAU_DOI);return}
  const correct=!!r.correct,reward=r.reward??0,coBua=!!docGoiY(q.goiY,q.phan)
  // OMNI 3: lướt (máy chủ chưa tính câu) hoặc câu của vé thử thách ⇒ câu chưa đúng KHÔNG trừ Máu (`mien` trong learningBattle).
  const om=omniBat?docKetQuaOmni((r as {omni?:unknown}).omni):null
  const mien:'luot'|'ve'|undefined=correct?undefined:om?.luot?'luot':omniBat&&luot.ve?'ve':undefined
  const lyDo=lyDoTranExpGame(reward,r.thuongGoc,tenThu(profile))??r.lyDoThuong??lyDoThuongTuKetQua({correct,assisted:assisted||coBua,reward,stage:r.stage??0})
  const emGui=(r as {traLoi?:unknown}).traLoi
  setKetQua(cu=>cu.some(a=>a.qid===q.qid)?cu:[...cu,{qid:q.qid,correct,...(mien?{mien:true}:{})}]);setExp(t=>t+(typeof r.expCau==='number'?Math.max(0,r.expCau):reward))
  setPhanHoi({correct,answer:r.answer??'',traLoi:typeof emGui==='string'?emGui:traLoi,solution:r.solution,solutionImages:r.solutionImages??[],reward,lyDo,expThuThach:typeof r.expThuThach==='number'?r.expThuThach:0,...(typeof r.expCau==='number'?{expCau:r.expCau}:{}),coTroGiup:assisted||coBua,
   ...(om?{omni:{loiNhan:om.loiNhan,chacMaSai:om.chacMaSai}}:{}),...(mien?{mien}:{})})
  // OMNI 3 · Trạm hồi phục (3 câu sai liền): thẻ trạm hiện sau kết quả; không có câu nền ⇒ báo chữ + đổi ải kế ngay (Máu không đổi).
  if(om?.tram&&!tram){const t:Tram2={du:om.tram,qid:q.qid,session:luot.id,xong:false};setTram(t);if(!om.tram.coCauNen)await xongTram(t)}})
 /** Trạm xong (đóng hộp câu nền, không có câu nền, hoặc em sang ải luôn): MỘT lần `hoa2-omni-tram-xong`; có câu ⇒ thay đúng vị trí trong chuyến đang chơi. */
 async function xongTram(t:Tram2|null){if(!t||t.xong)return
  setTram(x=>x&&x.session===t.session?{...x,xong:true}:x)
  let kq:Awaited<ReturnType<typeof omniTramXong>>
  try{kq=await omniTramXong(call,t.session)}catch{return} // không đổi được ải: chuyến đi tiếp như cũ, không chặn em
  const c=kq.cau as unknown as CauDao2|null,vt=kq.viTri,dangO=viTri
  if(!c||vt===null||!conSong.current)return
  setLuot(l=>{if(!l||l.id!==t.session||vt<=dangO||vt>=l.cau.length)return l
   const cau=l.cau.map((x,i)=>i===vt?c:x);nhoGoiYPhien(l.id,cau);return {...l,cau}})}
 /** Chip "Chưa chắc": bật/tắt; chạm lần đầu trong ngày ⇒ một dòng gợi ý nhỏ (một lần). */
 const chamChip=(v:boolean)=>{setChuaChac(v);if(lanDauChamChip(sbd))setGoiYChip(true)}
 const tiep=()=>chay(async()=>{setBaoCau('');if(tram&&!tram.xong)await xongTram(tram);await sangAiKe()})
 async function sangAiKe(){if(!luot)return
  setChuaChac(false);setGoiYChip(false);setTram(null)
  if(viTri+1<luot.cau.length){setViTri(viTri+1);setTraLoi('');setAssisted(false);setPhanHoi(null);return}
  await call('complete',{session:luot.id})
  const tran=learningBattle([...ketQua],luot.cau.length),xong=xongHomNay+1
  setXongHomNay(xong);ghiSoChuyenXong(sbd,sanh?.ngay??'',xong)
  setKetThuc({dung:ketQua.filter(k=>k.correct).length,tong:luot.cau.length,exp,enemy:tran.enemy,sai:luot.cau.map((c,i)=>({ai:i+1,qid:c.qid})).filter(x=>ketQua.find(k=>k.qid===x.qid)?.correct===false)})
  setLuot(null);setPhanHoi(null);setPha('xong')
  await napSanh().catch(()=>null);napDaLam()}
 /** Rời chuyến về bản đồ: chuyến giữ lại. Vừa có lỗi (lượt hết hạn, câu vừa rút…) ⇒ bỏ bản trên máy, soạn lại từ máy chủ (resume trả đúng chỗ em đang làm nếu lượt còn hạn). */
 const roi=()=>{setPha('ban-do');if(!loi){setLoi('');return}setLuot(null);void chay(async()=>{await soanChuyen(sanh)})}
 const veBanDo=()=>{setPha('ban-do');setKetThuc(null);if(!luot)void chay(async()=>{await soanChuyen(sanh)})}
 const moRuong=()=>chay(async()=>{const r=await call('hoa2-ruong-mo') as DaoKetQua&{qua?:{vang?:unknown}};const v=Number(r.qua?.vang);setRuongVua(Number.isFinite(v)&&v>0?v:null);await napSanh().catch(()=>null)})

 const vo=(con:ReactNode,tham=false)=><div className={`dao dao-vo dao-v2 dao2${tham?' dao-vo-tham':''}`} data-thu={chiSoThu(profile.pet)} data-pha={pha} hidden={an||undefined}>{con}</div>
 if(pha==='ai'&&luot)return vo(<TrongAi profile={profile} cau={luot.cau} viTri={viTri} ketQua={ketQua} traLoi={traLoi} assisted={assisted} phanHoi={phanHoi} busy={busy} loi={loi} maLoi={maLoi} baoCau={baoCau}
  onTraLoi={setTraLoi} onAssisted={setAssisted} onNop={()=>void nop()} onTiep={()=>void tiep()} onRoi={roi}
  {...(omniBat?{chuaChac,onChuaChac:chamChip,goiYChip}:{})} tram={tram?<TheTram tram={tram.du} qid={tram.qid} xong={tram.xong} onXong={()=>void xongTram(tram)}/>:undefined}/>,true)
 if(pha==='de-thu')return vo(<DeThu sbd={sbd} call={call} onVe={onDong}/>,true)
 if(pha==='xong'&&ketThuc){const con=sanh?.dao?.con??null,coThem=con!==null&&con>0&&!sanh?.khoaDao,cd=sanh?.chienDich,hen=henOnCua(daLam,ketThuc.sai.map(s=>s.qid))
  return vo(<XongChuyen soChuyen={con!==null?{k:xongHomNay,n:xongHomNay+Math.ceil(con/SO_AI_CHUYEN)}:null} conCau={con} tongKet={ketThuc} enemy={ketThuc.enemy}
   oMoi={cd&&coXatTruoc!==null?Math.max(0,cd.coXat-coXatTruoc):null} coXat={cd?{co:cd.coXat,tong:cd.tong}:null} aiSai={ketThuc.sai.map(s=>({ai:s.ai,hen:hen[s.qid]}))}
   ruong={sanh?.ruong??null} ruongVua={ruongVua} busy={busy} loi={loi} anhThu={anhThu(chiSoThu(profile.pet),profile.cap)} thu={chiSoThu(profile.pet)} onDiTiep={coThem?()=>void chay(moChuyen):undefined} onVeBanDo={veBanDo} onMoSoTay={onMoSoTay} onMoRuong={()=>void moRuong()}/>,true)}
 if(khoa)return vo(<><KhoaDao message={khoa} doanCon={sanh?.doan?.con??null} onVeSanh={onDong} onMoDoan={doanMo?onMoDoan:undefined}/>{thanhDuoi}</>)
 return vo(<BanDo profile={profile} sanh={sanh} dangTai={dangTai} loiSanh={loiSanh} cau={luot?.cau??null} ketQua={luot?ketQua:[]} soan={soan} het={het} soChuyen={soChuyen(sanh?.dao?.con,xongHomNay)}
  vung={vungTheoDang(daLam,sanh?.chienDich?.id)} busy={busy} loi={loi} ruongVua={ruongVua} onLenDuong={()=>void lenDuong()} onThuLai={()=>void thuLai()} onVe={onDong} onMoRuong={()=>void moRuong()} thanhDuoi={thanhDuoi}/>)
}
