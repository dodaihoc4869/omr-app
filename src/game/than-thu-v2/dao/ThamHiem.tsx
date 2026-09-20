import {useEffect,useState} from 'react'
import {learningBattle} from '../learning-battle'
import type {BattleAnswer} from '../learning-battle'
import {battleMuted,playBattleSound,setBattleMuted,unlockBattleAudio} from '../battle-audio'
import {evolutionStage} from '../evolution'
import TheCau from '../../../components/TheCau'
import type {TheCauProps} from '../../../components/TheCau'
import {LoiGiaiCauSai} from '../../../components/KhoiCauSai'
import {HinhTaiViTri,ManHinhAnh} from '../../../components/QuestionMedia'
import type {HinhAnh} from '../../../data/examContent'
import {anhThe,anhThu} from './anh'
import {chiSoThu,tenNhomAi,tenThu} from './dao-core'
import type {CauDao,DaoProfile,LyDoThuong} from './kieu'
import './dao.css'

export interface PhanHoiAi{correct:boolean;answer:string;solution:unknown;solutionImages:HinhAnh[];lyDo:LyDoThuong}
export interface TongKetChuyen{dung:number;tong:number;exp:number;sao:number}
export interface ThamHiemProps{
 profile:DaoProfile;cau:readonly CauDao[];viTri:number
 /** Kết quả các ải đã nộp (máy chủ chấm) — trận chỉ là CÁCH KỂ, tính bằng `learningBattle` như cũ. */
 ketQua:readonly BattleAnswer[]
 traLoi:string;assisted:boolean;phanHoi:PhanHoiAi|null;xong:boolean;tongKet?:TongKetChuyen
 busy?:boolean;loi?:string;thongBao?:string
 onTraLoi:(v:string)=>void;onAssisted:(v:boolean)=>void;onNop:()=>void;onTiep:()=>void;onVeDao:()=>void;onChuyenMoi?:()=>void;onMoSoTay?:()=>void
}
export const TEN_QUAI='Quái Sương Mù'
const MUC_DO:Record<string,string>={biet:'Nhận biết',hieu:'Thông hiểu',van_dung:'Vận dụng'}

/** Dải ải trên cùng: xong-đúng · xong-sai · đang làm · chưa tới; ải thử thách là ô trám vàng (Trùm ải). */
export function DaiAi({cau,viTri,ketQua,xong}:{cau:readonly CauDao[];viTri:number;ketQua:readonly BattleAnswer[];xong:boolean}){
 const daQua=xong?cau.length:viTri,tiLe=cau.length>1?Math.min(1,daQua/(cau.length-1)):1
 return <ol className="dao-dai" aria-label={`Chuyến thám hiểm ${cau.length} ải`} style={{'--dai-tile':tiLe} as React.CSSProperties}>{cau.map((c,i)=>{
  const kq=ketQua.find(k=>k.qid===c.qid),trang=kq?(kq.correct?'dung':'sai'):i===viTri&&!xong?'dang':'cho',dauNhom=i===0||(cau[i-1]!.role??'lap')!==(c.role??'lap')
  return <li key={c.qid} data-trang={trang} data-vai={c.role??'lap'} aria-current={trang==='dang'?'step':undefined} aria-label={`Ải ${i+1} · ${tenNhomAi(c.role)} · ${trang==='dung'?'đã qua, đúng':trang==='sai'?'đã qua, chưa đúng':trang==='dang'?'đang làm':'chưa tới'}`}><i/>{dauNhom&&<small>{tenNhomAi(c.role)}</small>}</li>})}</ol>
}

/** Sân đấu: giữ công thức `learning-battle.ts` (HP, 3 đúng liền → cuồng nộ ×2); Cuồng nộ hiện bằng TRANH cuồng nộ thật. */
export function SanDau({profile,ketQua,tong,suKien,xong}:{profile:DaoProfile;ketQua:readonly BattleAnswer[];tong:number;suKien:number;xong:boolean}){
 const thu=chiSoThu(profile.pet),ten=tenThu(profile),tran=learningBattle([...ketQua],tong),[tat,setTat]=useState(battleMuted)
 const vuaNop=suKien>0&&tran.count>0
 useEffect(()=>{if(vuaNop)playBattleSound(thu,evolutionStage(profile.cap),!!tran.correct,tran.rage)},[suKien]) // eslint-disable-line react-hooks/exhaustive-deps
 // sắp đủ 3 câu đúng liền ⇒ nạp trước tranh cuồng nộ (~70 KB) để lúc bùng nổ hiện ngay
 useEffect(()=>{if(tran.streak%3===2){const i=new Image();i.src=anhThe(thu,'cuong-no')}},[tran.streak,thu])
 const no=vuaNop&&tran.rage
 return <section className="dao-san" data-thu={thu} data-no={no?'':undefined} aria-label="Trận đấu">
  {no&&<div className="dao-san-tia" aria-hidden="true"/>}
  {no?<div className="dao-san-tranh" key={`no-${suKien}`}><img src={anhThe(thu,'cuong-no')} alt="" width="512" height="512" decoding="async" draggable={false}/></div>
   :<img key={`thu-${suKien}`} className="dao-san-thu" data-dong={vuaNop?(tran.correct?'danh':'dau'):undefined} src={anhThu(thu,profile.cap)} alt="" width="288" height="288" decoding="async" draggable={false}/>}
  {no?<p className="dao-san-no">CUỒNG NỘ ×2 · 3 câu đúng liền</p>:tran.streak>0&&!xong&&<p className="dao-san-chuoi">Đúng liền {tran.streak%3}/3 · đủ 3 là CUỒNG NỘ</p>}
  <div className="dao-san-quai" key={`quai-${suKien}`} data-trung={vuaNop&&tran.correct?'':undefined} data-ha={tran.enemy===0?'':undefined}>
   <p>{tran.enemy===0?`Đã hạ ${TEN_QUAI}`:`${TEN_QUAI} · ${tran.enemy}/100`}</p>
   <div className="dao-san-mau dao-san-mau-quai" role="progressbar" aria-label={`Máu ${TEN_QUAI}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={tran.enemy}><i style={{width:`${tran.enemy}%`}}/></div>
   <svg viewBox="0 0 120 104" width="104" height="90" aria-hidden="true"><ellipse className="dao-quai-bong" cx="60" cy="96" rx="40" ry="7"/><path className="dao-quai-than" d="M60 8C28 8 12 40 12 66c0 20 16 30 48 30s48-10 48-30C108 40 92 8 60 8Z"/><path className="dao-quai-sang" d="M36 30c6-10 16-14 26-14" /><circle className="dao-quai-mat" cx="44" cy="58" r="7"/><circle className="dao-quai-mat" cx="76" cy="58" r="7"/><path className="dao-quai-mieng" d="M46 76q14 10 28 0"/></svg>
  </div>
  {vuaNop&&<p className="dao-san-so" key={`so-${suKien}`} data-phia={tran.correct?'quai':'thu'}>−{tran.damage}</p>}
  {vuaNop&&tran.heal>0&&<p className="dao-san-hoi" key={`hoi-${suKien}`}>+{tran.heal}</p>}
  <div className="dao-san-ta"><div className="dao-san-mau" role="progressbar" aria-label={`Máu của ${ten}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={tran.hp}><i style={{width:`${tran.hp}%`}}/></div><span>{ten} {tran.hp}</span></div>
  <button type="button" className="dao-san-tieng" aria-pressed={!tat} aria-label={tat?'Bật tiếng trận đấu':'Tắt tiếng trận đấu'} onClick={()=>{setBattleMuted(!tat);setTat(!tat)}}><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4z"/>{tat?<path d="m22 9-6 6M16 9l6 6"/>:<path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>}</svg></button>
 </section>
}

export default function ThamHiem({profile,cau,viTri,ketQua,traLoi,assisted,phanHoi,xong,tongKet,busy=false,loi='',thongBao='',onTraLoi,onAssisted,onNop,onTiep,onVeDao,onChuyenMoi,onMoSoTay}:ThamHiemProps){
 const [zoom,setZoom]=useState(''),[hinhLoi,setHinhLoi]=useState(false),q=cau[viTri]
 useEffect(()=>{setHinhLoi(false)},[viTri])
 const khoa=!!phanHoi||busy
 const propCau=():TheCauProps|null=>{
  if(!q)return null;const chung={stt:viTri+1,onZoom:setZoom,text:q.text,table:q.table,thanCauImg:q.thanCauImg,imageDataUrl:q.imageDataUrl,hinhAnh:q.hinhAnh as HinhAnh[],tieuDe:q.tenDang||'Câu trong bài em đã học',cheDo:'thi' as const}
  if(q.phan==='I')return {...chung,phan:'I',choices:q.choices as [string,string,string,string],choiceImgs:q.choiceImgs as [string?,string?,string?,string?],choicePerm:[0,1,2,3],selected:(traLoi||null) as 'A'|'B'|'C'|'D'|null,onSelect:v=>{if(!khoa)onTraLoi(v)}}
  if(q.phan==='II')return {...chung,phan:'II',ideas:q.ideas as [string,string,string,string],ideaImgs:q.ideaImgs as [string?,string?,string?,string?],selected:Array.from({length:4},(_,i)=>(traLoi[i]==='D'||traLoi[i]==='S'?traLoi[i]:null) as 'D'|'S'|null),onSelect:(i,v)=>{if(!khoa){const a=(traLoi||'----').split('');a[i]=v;onTraLoi(a.join(''))}}}
  return {...chung,phan:'III',selected:traLoi,onChange:v=>{if(!khoa)onTraLoi(v)}}
 }
 const pc=propCau(),thieu=!traLoi||(q?.phan==='II'&&(traLoi.length<4||traLoi.includes('-'))),cuoi=viTri+1>=cau.length
 return <div className="dao-tham" data-thu={chiSoThu(profile.pet)}>
  {zoom&&<ManHinhAnh src={zoom} alt="Ảnh câu hỏi / lời giải" onClose={()=>setZoom('')}/>}
  <div className="dao-tham-dau"><button type="button" className="dao-tham-ve" onClick={onVeDao} aria-label="Về đảo (lượt đang làm được giữ lại)"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg></button><DaiAi cau={cau} viTri={viTri} ketQua={ketQua} xong={xong}/></div>
  <SanDau profile={profile} ketQua={ketQua} tong={cau.length} suKien={ketQua.length} xong={xong}/>
  {thongBao&&<p className="dao-chuyen-bao" role="status">{thongBao}</p>}
  {loi&&<p className="dao-loi" role="alert">{loi}</p>}
  {xong?<section className="dao-kinh dao-tham-xong" aria-live="polite"><h3>Xong chuyến thám hiểm</h3>
    {tongKet&&<ul><li><b>{tongKet.dung}/{tongKet.tong}</b><span>ải đúng</span></li><li><b>+{tongKet.exp}</b><span>EXP thành thạo</span></li><li><b>{tongKet.sao}</b><span>sao mới</span></li></ul>}
    <p>Đã lưu. Dạng cần ôn và ngày ôn lại nằm trong Sổ tay.</p>
    <button type="button" className="dao-nut-vang" onClick={onVeDao}><span>VỀ ĐẢO</span></button>
    <div className="dao-tham-phu">{onMoSoTay&&<button type="button" className="dao-nut-nho dao-nut-nho-mo" onClick={onMoSoTay}>Xem Sổ tay</button>}{onChuyenMoi&&<button type="button" className="dao-nut-nho dao-nut-nho-mo" disabled={busy} onClick={onChuyenMoi}>Đi chuyến nữa</button>}</div></section>
  :q&&pc&&<>
   {phanHoi&&<div className="dao-thuong" data-moc={phanHoi.lyDo.moc} data-dung={phanHoi.correct?'':undefined} role="status"><b>{phanHoi.lyDo.exp>0?`+${phanHoi.lyDo.exp}`:phanHoi.correct?'Đúng':'Ôn lại'}</b><p>{phanHoi.lyDo.chu.replace(/^\+\d+\s*·\s*/,'')}</p></div>}
   <section className="dao-cau" aria-label={`Ải ${viTri+1}`}>
    <p className="dao-cau-nhan"><b data-vai={q.role??'lap'}>ẢI {viTri+1} · {tenNhomAi(q.role).toLocaleUpperCase('vi')}</b><span>{[q.tenDang,q.mucDo?MUC_DO[q.mucDo]:''].filter(Boolean).join(' · ')}</span></p>
    <div onErrorCapture={e=>{if((e.target as HTMLElement).tagName==='IMG')setHinhLoi(true)}}><TheCau {...pc}/></div>
    {hinhLoi&&<p role="alert" className="dao-cau-loi">Hình của câu chưa tải được. Em về đảo rồi bấm LÊN ĐƯỜNG để mở lại; câu này chưa bị tính sai.</p>}
    {phanHoi&&<div className="dao-cau-giai"><LoiGiaiCauSai hoaHoc c={{text:q.text,phan:q.phan,dapAnDung:phanHoi.answer,loiGiai:phanHoi.solution}}/><HinhTaiViTri hinhAnh={phanHoi.solutionImages} viTri="sau_loi_giai" nhan="lời giải" onZoom={setZoom}/></div>}
   </section>
   {!phanHoi&&<label className="dao-tham-tro"><input type="checkbox" checked={assisted} disabled={busy} onChange={e=>onAssisted(e.target.checked)}/> Em có dùng tài liệu hoặc được trợ giúp ở câu này</label>}
   {/* Nút nổi ở đáy màn hình CHỈ khi em đã chọn xong (chưa chọn thì nằm cuối trang, không che phương án); không tự cuộn trang. */}
   <div className="dao-tham-chan" data-noi={phanHoi||!thieu?'':undefined}>{!phanHoi?<button type="button" className="dao-nut-xanh" disabled={busy||hinhLoi||thieu} onClick={()=>{unlockBattleAudio();onNop()}}>{busy?'Đang chấm…':thieu?'Chọn đáp án để tung chưởng':'Trả lời · tung chưởng'}</button>
    :<button type="button" className="dao-nut-xanh" disabled={busy} onClick={onTiep}>{cuoi?'Đã đọc lời giải · hoàn thành chuyến':`Đã đọc lời giải · sang ải ${viTri+2}`}</button>}</div>
  </>}
 </div>
}
