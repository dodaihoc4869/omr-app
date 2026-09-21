import {useCallback,useEffect,useRef,useState} from 'react'
import type {ReactNode} from 'react'
import type {BattleAnswer} from '../learning-battle'
import ChonBanDongHanh,{theMoDau} from './ChonBanDongHanh'
import DaoCuaEm from './DaoCuaEm'
import ThamHiem from './ThamHiem'
import type {PhanHoiAi} from './ThamHiem'
import SoTay from './SoTay'
import TuiDo from './TuiDo'
import {chiSoThu,docLuotNgay,docMaiCho,lyDoThuongTuKetQua,lyDoTranExpGame,tenThu} from './dao-core'
import type {LuotNgay,MaiCho} from './dao-core'
import type {CauDao,DaoKetQua,DaoThanThuProps,ManDao} from './kieu'
import {docLuotCauNgay,type LuotCauNgay} from '../chu-het-luot'
import './dao.css'

interface Luot{id:string;cau:CauDao[]}
const THONG_BAO_TRONG='Đảo chưa có câu hợp với phần em đã học. Em làm Bài tập về nhà trước, rồi quay lại lên đường nhé.'
const ICON:Record<ManDao|'doan',ReactNode>={
 dao:<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M12 3 3 10v11h6v-6h6v6h6V10z"/></svg>,
 doan:<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
 'so-tay':<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>,
 'tui-do':<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18M16 10a4 4 0 0 1-8 0"/></svg>,
}

/**
 * VỎ của Đảo thần thú bản mới — component DUY NHẤT `Game.tsx` cần nạp (docs/hop-dong-dao-than-thu-prop-2109.md).
 * Chỉ đổi cách kể: mọi lệnh máy chủ (choose, rename, sync, start, resume, answer, complete, invest, shield-use) GIỮ NGUYÊN.
 */
export default function DaoThanThu({sbd,profile,doanMo,call:callProp,exp,chuoiNgay,tasks,moiDoan,onMoDoan,onMoVoDai,onMoTienBo,onDong}:DaoThanThuProps){
 // `call` của nơi nối có thể đổi danh tính mỗi lần vẽ ⇒ giữ qua ref, hiệu ứng nạp dữ liệu KHÔNG phụ thuộc vào nó (tránh vòng lặp vẽ lại)
 const callRef=useRef(callProp);callRef.current=callProp
 const call=useCallback<DaoThanThuProps['call']>((action,data)=>callRef.current(action,data),[])
 const [man,setMan]=useState<ManDao>('dao'),[dangTham,setDangTham]=useState(false)
 const [busy,setBusy]=useState(false),[loi,setLoi]=useState(''),[bao,setBao]=useState('')
 const [goiY,setGoiY]=useState<{title:string}[]|null>(null),[conLai,setConLai]=useState<number|null>(null),[luotCau,setLuotCau]=useState<LuotCauNgay|null>(null)
 // Đợt 2: lượt trong ngày (recommendations/start) + "Mai thú chờ em" (start khi hết lượt) — đọc chặt; máy chủ cũ không gửi ⇒ null ⇒ không dải lượt.
 const [luotNgay,setLuotNgay]=useState<LuotNgay|null>(null),[maiCho,setMaiCho]=useState<MaiCho|null>(null)
 const [danhMuc,setDanhMuc]=useState<{key:string;ten:string;chuong:string}[]|null>(null),[tenDang,setTenDang]=useState<Record<string,string>>({})
 const [luot,setLuot]=useState<Luot|null>(null),[viTri,setViTri]=useState(0),[ketQua,setKetQua]=useState<BattleAnswer[]>([]),[traLoi,setTraLoi]=useState(''),[assisted,setAssisted]=useState(false),[phanHoi,setPhanHoi]=useState<PhanHoiAi|null>(null),[xong,setXong]=useState(false),[thuong,setThuong]=useState({exp:0,sao:0})
 const dangChay=useRef(false),conSong=useRef(true)
 useEffect(()=>{conSong.current=true;return()=>{conSong.current=false}},[])
 const chay=useCallback(async(viec:()=>Promise<void>)=>{if(dangChay.current)return;dangChay.current=true;setBusy(true);setLoi('');try{await viec()}catch(e){if(conSong.current)setLoi(e instanceof Error?e.message:'Không kết nối được. Em thử lại.')}finally{dangChay.current=false;if(conSong.current)setBusy(false)}},[])
 const hocTen=(cau:readonly CauDao[])=>setTenDang(cu=>{const moi={...cu};for(const c of cau)if(c.tenDang)moi[c.dang??c.group]=c.tenDang;return moi})

 // gợi ý hôm nay + danh mục sổ tay: đọc-chỉ, hỏng thì màn vẫn chạy (Worker cũ chưa có `so-tay`)
 const napGoiY=useCallback(()=>{void call('recommendations').then(r=>{if(conSong.current){setGoiY(r.suggestions??[]);setConLai(typeof r.remaining==='number'?r.remaining:null);setLuotCau(docLuotCauNgay(r));if(r.luot!==undefined)setLuotNgay(docLuotNgay(r.luot))}}).catch(()=>{})},[call])
 const daChon=!profile.choice
 useEffect(()=>{if(!daChon)return;napGoiY();void call('so-tay').then(r=>{if(conSong.current&&Array.isArray(r.dang)){setDanhMuc(r.dang);setTenDang(cu=>({...Object.fromEntries(r.dang!.filter(d=>d.ten).map(d=>[d.key,d.ten])),...cu}))}}).catch(()=>{})},[daChon,call,napGoiY])

 const moLuot=(r:DaoKetQua,tiep:boolean)=>{const cau=r.questions??[],da=r.answered??[];hocTen(cau)
  const dau=tiep?cau.findIndex(c=>!da.some(a=>a.attempt.qid===c.qid)):0
  setLuot({id:r.id??'',cau});setKetQua(tiep?da.map(a=>a.attempt):[]);setThuong(tiep?{exp:da.reduce((s,a)=>s+(a.reward||0),0),sao:da.filter(a=>a.reward>0).length}:{exp:0,sao:0})
  setViTri(Math.max(0,dau));setTraLoi('');setAssisted(false);setPhanHoi(null);setXong(false);setDangTham(true)}
 /** MỘT nút LÊN ĐƯỜNG = đi tiếp chuyến dở (nếu có) → không thì `sync` cho tới hết → `start`. */
 const lenDuong=(mode:'adventure'|'repair'='adventure',dang?:string)=>chay(async()=>{
  if(luot&&!xong&&mode==='adventure'){setDangTham(true);return}
  setBao('Đang xem lại những bài em đã học…')
  if(mode==='adventure'){const cu=await call('resume').catch(()=>null)
   if(cu?.id&&cu.questions?.length&&(cu.mode==='adventure'||cu.mode==='repair')){
    if(cu.questions.some(c=>!(cu.answered??[]).some(a=>a.attempt.qid===c.qid))){setBao('');moLuot(cu,true);return}
    await call('complete',{session:cu.id}).catch(()=>{})}}
  let r=await call('sync')
  for(let i=0;i<400&&(r.remaining??0)>0&&conSong.current;i++){setBao(`Đang soạn hành trang… còn ${r.remaining} bài cần xem lại`);r=await call('sync')}
  const s=await call('start',{mode,dang})
  if(s.luot!==undefined)setLuotNgay(docLuotNgay(s.luot));if(s.maiCho!==undefined)setMaiCho(docMaiCho(s.maiCho))
  if(!s.questions?.length){setBao(s.message||THONG_BAO_TRONG);napGoiY();return}
  setBao(s.message||'');moLuot(s,false)})
 const nop=()=>chay(async()=>{const q=luot?.cau[viTri];if(!luot||!q)return
  const r=await call('answer',{session:luot.id,qid:q.qid,answer:traLoi,assisted}),correct=!!r.correct,reward=r.reward??0
  const lyDo=lyDoTranExpGame(reward,r.thuongGoc,tenThu(profile))??r.lyDoThuong??lyDoThuongTuKetQua({correct,assisted,reward,stage:r.stage??0})
  setKetQua(cu=>cu.some(a=>a.qid===q.qid)?cu:[...cu,{qid:q.qid,correct}]);setThuong(t=>({exp:t.exp+reward,sao:t.sao+(reward>0?1:0)}))
  setPhanHoi({correct,answer:r.answer??'',solution:r.solution,solutionImages:r.solutionImages??[],lyDo})})
 const tiep=()=>chay(async()=>{if(!luot)return
  if(viTri+1>=luot.cau.length){await call('complete',{session:luot.id});setXong(true);setPhanHoi(null);napGoiY()}
  else{setViTri(viTri+1);setTraLoi('');setAssisted(false);setPhanHoi(null)}})
 const veDao=()=>{setDangTham(false);setMan('dao');setBao('');if(xong)setLuot(null)}

 const [loiChon,setLoiChon]=useState('')
 if(profile.choice)return <ChonBanDongHanh batDau={theMoDau(sbd)} busy={busy} loi={loi||loiChon} moiDoan={moiDoan} onChon={(pet,ten)=>void chay(async()=>{setLoiChon('');await call('choose',{pet});if(ten)await call('rename',{name:ten}).catch(e=>{if(conSong.current)setLoiChon(`Đã chọn xong. Tên chưa lưu được (${e instanceof Error?e.message:'lỗi mạng'}) — em đặt lại bằng cây bút cạnh tên trên đảo.`)})})}/>

 if(dangTham&&luot)return <div className="dao dao-vo dao-vo-tham" data-thu={chiSoThu(profile.pet)}><ThamHiem profile={profile} cau={luot.cau} viTri={viTri} ketQua={ketQua} traLoi={traLoi} assisted={assisted} phanHoi={phanHoi} xong={xong} tongKet={{dung:ketQua.filter(k=>k.correct).length,tong:luot.cau.length,...thuong}}
  busy={busy} loi={loi} thongBao={bao} onTraLoi={setTraLoi} onAssisted={setAssisted} onNop={()=>void nop()} onTiep={()=>void tiep()} onVeDao={veDao} onChuyenMoi={conLai===0?undefined:()=>{setLuot(null);void lenDuong()}} onMoSoTay={()=>{veDao();setMan('so-tay')}}/></div>

 const muc:[ManDao|'doan',string][]=[['dao','Đảo'],...(doanMo?[['doan','Đoàn Hộ Tống']] as [ManDao|'doan',string][]:[]),['so-tay','Sổ tay'],['tui-do','Túi đồ']]
 return <div className="dao dao-vo" data-thu={chiSoThu(profile.pet)}>
  {man==='dao'&&<DaoCuaEm profile={profile} exp={exp} chuoiNgay={chuoiNgay} goiY={goiY} conLai={conLai} luotCau={luotCau} luotNgay={luotNgay} maiCho={maiCho} tenDang={tenDang} tasks={tasks} busy={busy} loi={loi||loiChon} thongBao={bao||(luot&&!xong?'Em đang đi dở một chuyến — bấm LÊN ĐƯỜNG để đi tiếp.':'')}
   onLenDuong={()=>void lenDuong()} onOnTheoNhac={dang=>void lenDuong('repair',dang)} onNap={()=>void chay(async()=>{await call('invest')})} onDoiTen={ten=>void chay(async()=>{await call('rename',{name:ten});setLoiChon('')})}/>}
  {man==='so-tay'&&<SoTay profile={profile} danhMuc={danhMuc} tenDang={tenDang}/>}
  {man==='tui-do'&&<TuiDo profile={profile} exp={exp} busy={busy} loi={loi} onDungKhien={id=>chay(async()=>{await call('shield-use',{useId:id})})} onMoVoDai={onMoVoDai} onMoTienBo={onMoTienBo}/>}
  <button type="button" className="dao-ve-app" onClick={onDong}>Về app học sinh</button>
  <nav className="dao-nav" aria-label="Mục của đảo">{muc.map(([id,nhan])=><button type="button" key={id} aria-current={id===man?'page':undefined} onClick={()=>{if(id==='doan')onMoDoan();else setMan(id)}}><span>{ICON[id]}</span>{nhan}</button>)}</nav>
 </div>
}
