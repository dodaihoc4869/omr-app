// ĐẢO 2.0 · TRONG ẢI (bản vẽ Moi-DaoAi.dc.html) + SAU KHI CHỐT (Moi-DaoLoiGiai.dc.html).
// Trận GIỮ công thức `learning-battle.ts` (máu, 3 câu đúng liền ⇒ Cuồng nộ ×2); điểm/EXP do máy chủ chấm. Thẻ câu = TheCau (không sửa TheCau):
// chế độ `thi` khi làm, chế độ `xem_lai` + khối LỜI GIẢI chuẩn (chuan-hoa-loi-giai) khi đã chốt. Gợi ý M3 CHỈ lấy từ `goiY` máy chủ gửi —
// đáp án không bao giờ có trên máy trước khi em chốt.
import {SoExpCau,useCheDoHieuUng} from '../../../components/exp-cau/ExpCau'
import {expCauGame} from '../../../lib/hieu-ung-exp-cau'
import {useEffect,useLayoutEffect,useRef,useState} from 'react'
import TheCau from '../../../components/TheCau'
import NutToanManHinh from '../../../components/NutToanManHinh'
import type {TheCauProps} from '../../../components/TheCau'
import {HinhTaiViTri,ManHinhAnh} from '../../../components/QuestionMedia'
import {ChemText} from '../../../lib/chem-format'
import type {HinhAnh} from '../../../data/examContent'
import {learningBattle} from '../learning-battle'
import type {BattleAnswer} from '../learning-battle'
import {battleMuted,playBattleSound,setBattleMuted,unlockBattleAudio} from '../battle-audio'
import {evolutionStage} from '../evolution'
import {CHU_HET_TRAN_DAO,laLoiHetTran} from '../loi-het-tran'
import {anhThu} from '../dao/anh'
import {chiSoThu,tenThu} from '../dao/dao-core'
import type {DaoProfile,LyDoThuong} from '../dao/kieu'
import {NHAN_O_VAI,TEN_VAI,chuGach,dapAnDungSai,docGoiY,docVai,loiGiaiChoTheCau} from './dao2-core'
import type {CauDao2} from './dao2-core'
import '../../../components/bang-nhiem-vu/m3-theme.css'
import '../../../components/m3/m3.css'
import {useNgang} from './ngang'
import './dao2.css'
import ChuongTranDau,{giamChuyenDong,thuocTinhCanh} from './ChuongTranDau'
import NutHoiThay from '../../../components/loi-giai/NutHoiThay'

export const TEN_QUAI='Quái Sương Mù'
const MUC_DO:Record<string,string>={biet:'Nhận biết',hieu:'Thông hiểu',van_dung:'Vận dụng'}
export interface PhanHoi2{correct:boolean;answer:string;traLoi:string;solution:unknown;solutionImages:HinhAnh[];reward:number;lyDo:LyDoThuong
 /** Luật v4 (chỉ-thêm): EXP câu thử thách máy chủ trả; `coTroGiup` = câu có trợ giúp / Bùa / Hỏi thầy ⇒ không hiệu ứng. */
 expThuThach?:number;coTroGiup?:boolean
 /** Luật 29/09: EXP thật máy chủ ghi cho câu này (dùng nguyên số). */
 expCau?:number}

// ───────────── thanh 6 nút của chuyến ─────────────
/** Nút đã qua: xanh (đúng) / hồng (chưa đúng); nút đang làm sáng; nút Trùm ải là ô trám tím viền vàng. */
export function ThanhAi({cau,viTri,ketQua,xong=false}:{cau:readonly CauDao2[];viTri:number;ketQua:readonly BattleAnswer[];xong?:boolean}){
 return <ol className="dao2-thanh" aria-label={`Chuyến thám hiểm ${cau.length} ải`}>{cau.map((c,i)=>{
  const kq=ketQua.find(k=>k.qid===c.qid),trang=kq?(kq.correct?'dung':'sai'):i===viTri&&!xong?'dang':'cho',vai=docVai(c.vai)
  return <li key={c.qid} data-trang={trang} data-vai={vai??undefined} aria-current={trang==='dang'?'step':undefined}
   aria-label={`Ải ${i+1}${vai?` · ${TEN_VAI[vai]}`:''} · ${trang==='dung'?'đã qua, đúng':trang==='sai'?'đã qua, chưa đúng':trang==='dang'?'đang làm':'chưa tới'}`}><i/></li>})}</ol>
}

/** Bố cục NGANG: thẻ tiến độ chuyến dưới cảnh trận (bản vẽ Ngang-DaoAi) — 6 nút ải có nhãn vai (Mới / Ôn lại / Trùm) + số ải đúng / chưa đúng. */
export function TienDoChuyen({cau,viTri,ketQua}:{cau:readonly CauDao2[];viTri:number;ketQua:readonly BattleAnswer[]}){
 const dung=ketQua.filter(k=>k.correct).length,sai=ketQua.length-dung
 return <section className="dao2-kinh dao2-tien-do" aria-label="Tiến độ chuyến thám hiểm">
  <p><b>CHUYẾN THÁM HIỂM · {cau.length} ẢI</b><span>Đúng {dung} ải · Chưa đúng {sai} ải</span></p>
  <ThanhAi cau={cau} viTri={viTri} ketQua={ketQua}/>
  <ol className="dao2-tien-do-nhan" aria-hidden="true">{cau.map((c,i)=>{const vai=docVai(c.vai);return <li key={c.qid} data-vai={vai??undefined}>{vai?NHAN_O_VAI[vai]:`Ải ${i+1}`}</li>})}</ol>
 </section>
}

// ───────────── cảnh rừng sương + quái + thần thú ─────────────
/** Cảnh giữ lại đòn gần nhất (số máu, Cuồng nộ) như sân đấu cũ; tiếng đòn phát ở `DaiKetQua` — lúc máy chủ vừa chấm. */
/** `chuong` = chiếu hoạt cảnh bắn chưởng cho đòn `suKien` (chỉ lúc máy chủ VỪA chấm; dựng lại cảnh khi sang câu sau thì không chiếu lại). */
export function CanhRung({profile,ketQua,tong,suKien,chuong=false}:{profile:DaoProfile;ketQua:readonly BattleAnswer[];tong:number;suKien:number;chuong?:boolean}){
 const thu=chiSoThu(profile.pet),ten=tenThu(profile),tran=learningBattle([...ketQua],tong),[tat,setTat]=useState(battleMuted)
 const vuaNop=suKien>0&&tran.count>0,no=vuaNop&&tran.rage
 return <section className="dao2-canh" data-no={no?'':undefined} aria-label="Trận đấu" {...(chuong?thuocTinhCanh(ketQua,tong,suKien):{})}>
  <svg className="dao2-canh-nen" viewBox="0 0 390 260" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
   <defs>
    <linearGradient id="d2-rung" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="rgb(14,42,74)"/><stop offset="1" stopColor="rgb(18,59,58)"/></linearGradient>
    <filter id="d2-suong-a" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter>
   </defs>
   <rect width="390" height="260" fill="url(#d2-rung)"/>
   <path d="M0 200 L20 130 L40 200 Z M30 200 L56 110 L82 200 Z M320 200 L346 120 L372 200 Z M350 200 L372 140 L394 200 Z" fill="rgb(11,34,54)"/>
   <path d="M0 200 C100 186 290 186 390 200 L390 260 L0 260 Z" fill="rgb(15,58,52)"/>
   <g filter="url(#d2-suong-a)" fill="rgb(207,230,242)" opacity=".5"><circle cx="300" cy="150" r="70"/><circle cx="220" cy="70" r="50"/><circle cx="360" cy="60" r="50"/></g>
   <g fill="rgb(255,255,255)" opacity=".8"><circle cx="120" cy="46" r="2"/><circle cx="170" cy="100" r="1.6"/><circle cx="80" cy="80" r="1.4"/></g>
  </svg>
  <div className="dao2-quai" key={`quai-${suKien}`} data-trung={vuaNop&&tran.correct?'':undefined} data-ha={tran.enemy===0?'':undefined}>
   <svg viewBox="0 0 120 120" width="120" height="120" aria-hidden="true">
    <defs>
     <radialGradient id="d2-quai" cx="38%" cy="28%"><stop offset="0" stopColor="rgb(217,255,244)"/><stop offset=".55" stopColor="rgb(95,211,180)"/><stop offset="1" stopColor="rgb(30,111,92)"/></radialGradient>
     <filter id="d2-toa" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="6"/></filter>
    </defs>
    <circle cx="60" cy="58" r="54" fill="rgb(95,211,180)" opacity=".3" filter="url(#d2-toa)"/>
    <ellipse cx="60" cy="112" rx="52" ry="7" fill="rgba(0,0,0,.4)"/>
    <path d="M14 106 C0 54 30 8 60 8 C94 8 122 54 108 106 C102 122 20 122 14 106Z" fill="url(#d2-quai)"/>
    <path d="M32 40 C38 28 48 22 58 22" stroke="rgba(255,255,255,.6)" strokeWidth="5" strokeLinecap="round" fill="none"/>
    <ellipse cx="46" cy="64" rx="8" ry="9" fill="rgb(255,255,255)"/><ellipse cx="74" cy="64" rx="8" ry="9" fill="rgb(255,255,255)"/>
    <circle cx="47" cy="66" r="4" fill="rgb(14,59,49)"/><circle cx="73" cy="66" r="4" fill="rgb(14,59,49)"/>
    <path d="M46 88 Q60 80 74 88" stroke="rgb(14,59,49)" strokeWidth="4" strokeLinecap="round" fill="none"/>
   </svg>
  </div>
  <img className="dao2-canh-thu" key={`thu-${suKien}`} data-dong={vuaNop?(tran.correct?'danh':'dau'):undefined} src={anhThu(thu,profile.cap)} alt={`Thần thú của em: ${ten}`} width="140" height="140" decoding="async" draggable={false}/>
  {chuong&&<ChuongTranDau key={`chuong-${suKien}`} thu={thu} ketQua={ketQua} tong={tong} suKien={suKien}/>}
  {no?<p className="dao2-cuong-no">CUỒNG NỘ ×2 · 3 câu đúng liền</p>:tran.streak>0&&<p className="dao2-chuoi">Đúng liền {tran.streak%3}/3 · đủ 3 là CUỒNG NỘ</p>}
  <div className="dao2-kinh dao2-mau-quai"><span>{tran.enemy===0?`Đã hạ ${TEN_QUAI}`:`${TEN_QUAI} · Máu ${tran.enemy}/100`}</span>
   <span className="dao2-vach" role="progressbar" aria-label={`Máu ${TEN_QUAI}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={tran.enemy}><i style={{width:`${tran.enemy}%`}}/></span></div>
  <div className="dao2-kinh dao2-mau-thu"><span className="dao2-vach dao2-vach-thu" role="progressbar" aria-label={`Máu của ${ten}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={tran.hp}><i style={{width:`${tran.hp}%`}}/></span><span>{ten} · Máu {tran.hp}/100</span></div>
  {vuaNop&&<p className="dao2-so" key={`so-${suKien}`} data-phia={tran.correct?'quai':'thu'} aria-hidden="true">−{tran.damage}</p>}
  <button type="button" className="dao2-tieng" aria-pressed={!tat} aria-label={tat?'Bật tiếng trận đấu':'Tắt tiếng trận đấu'} onClick={()=>{setBattleMuted(!tat);setTat(!tat)}}><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4z"/>{tat?<path d="m22 9-6 6M16 9l6 6"/>:<path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>}</svg></button>
 </section>
}

// ───────────── thẻ câu giấy da (chế độ làm) ─────────────
const BUA=<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l1.8 4.6L18 9l-4.2 1.4L12 15l-1.8-4.6L6 9l4.2-1.4z"/><path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/></svg>
/** Hai phương án bị Bùa gạch: TheCau (không sửa) vẽ mỗi phương án là một nút `.pa-hang` theo thứ tự A→D (không xáo) — sau mỗi lần vẽ, đánh dấu
 *  nút bị gạch (`data-gach`, `disabled`, `aria-disabled`) để chữ gạch ngang, ô tối "cháy thành tro", bấm/Tab không tới. Lối chọn còn chặn thêm ở `onSelect`. */
function useGachPhuongAn(goc:{current:HTMLElement|null},gach:readonly string[]){
 useLayoutEffect(()=>{
  const hang=goc.current?[...goc.current.querySelectorAll<HTMLElement>('.pa-hang')]:[]
  hang.forEach((h,i)=>{const chu='ABCD'[i]??'',bi=gach.includes(chu)
   if(bi){h.setAttribute('data-gach','');h.setAttribute('aria-disabled','true');h.title=`Phương án ${chu} đã cháy thành tro (Bùa Trợ giảng)`}
   else if(h.hasAttribute('data-gach')){h.removeAttribute('data-gach');h.removeAttribute('aria-disabled');h.removeAttribute('title')}
   if(h instanceof HTMLButtonElement)h.disabled=bi})
 })
}
export interface TheCauAiProps{cau:CauDao2;stt:number;traLoi:string;khoa:boolean;onTraLoi:(v:string)=>void;onZoom?:(src:string)=>void;onHinhLoi?:()=>void}
export function TheCauAi({cau:q,stt,traLoi,khoa,onTraLoi,onZoom,onHinhLoi}:TheCauAiProps){
 const goiY=docGoiY(q.goiY,q.phan),gach=goiY?.gach??[],goc=useRef<HTMLDivElement>(null)
 useGachPhuongAn(goc,gach)
 const chung={stt,onZoom,text:q.text,table:q.table,thanCauImg:q.thanCauImg,imageDataUrl:q.imageDataUrl,hinhAnh:q.hinhAnh as HinhAnh[],tieuDe:q.tenDang||'',cheDo:'thi' as const}
 const pc:TheCauProps=q.phan==='I'?{...chung,phan:'I',choices:q.choices as [string,string,string,string],choiceImgs:q.choiceImgs as [string?,string?,string?,string?],choicePerm:[0,1,2,3],
   selected:(/^[ABCD]$/.test(traLoi)?traLoi:null) as 'A'|'B'|'C'|'D'|null,onSelect:v=>{if(!khoa&&!gach.includes(v))onTraLoi(v)}}
  :q.phan==='II'?{...chung,phan:'II',ideas:q.ideas as [string,string,string,string],ideaImgs:q.ideaImgs as [string?,string?,string?,string?],
   selected:Array.from({length:4},(_,i)=>(traLoi[i]==='D'||traLoi[i]==='S'?traLoi[i]:null) as 'D'|'S'|null),onSelect:(i,v)=>{if(!khoa){const a=(traLoi||'----').padEnd(4,'-').split('');a[i]=v;onTraLoi(a.join(''))}}}
  :{...chung,phan:'III',selected:traLoi,onChange:v=>{if(!khoa)onTraLoi(v)}}
 return <section className="dao2-giay m3" aria-label={`Ải ${stt}`}>
  {typeof q.nhanNo==='string'&&q.nhanNo&&<p className="dao2-nhan-no" data-khoi="nhan-no">{q.nhanNo}</p>}
  {goiY&&<p className="dao2-bua">{BUA}<span><b>Bùa Trợ giảng:</b> {goiY.gach?`${chuGach(goiY.gach)} đã cháy thành tro.`:'mở trước Kiến thức cốt lõi của câu này.'}<small>Đúng nhờ Bùa chưa tính Thành thạo — câu sẽ quay lại để em tự làm.</small></span></p>}
  {goiY?.cotLoi&&<div className="loi-giai-chot lg-chot dao2-cot-loi" data-cot-loi=""><div className="loi-giai-nhan-nho">Kiến thức cốt lõi</div><ChemText text={goiY.cotLoi}/></div>}
  <div ref={goc} className="dao2-giay-cau" data-gach={gach.join('')||undefined} onErrorCapture={e=>{if((e.target as HTMLElement).tagName==='IMG')onHinhLoi?.()}}><TheCau {...pc}/></div>
 </section>
}

// ───────────── sau khi chốt: kết quả + LỜI GIẢI chuẩn ─────────────
export interface KhoiLoiGiaiProps{cau:CauDao2;stt:number;phanHoi:PhanHoi2;traLoiMay:string;onZoom?:(src:string)=>void;/** nơi em bấm Hỏi thầy (thống kê) */nguon?:string}
/** Thẻ trắng M3: đầu thẻ "ẢI k · CÂU MỚI" + dạng · mức độ; TheCau `xem_lai` (phương án ✓ ✗ + khối LỜI GIẢI → KIẾN THỨC CỐT LÕI → từng phương án/ý) + hình sau lời giải. */
export function KhoiLoiGiai({cau:q,stt,phanHoi,traLoiMay,onZoom,nguon='dao'}:KhoiLoiGiaiProps){
 // Ngang: thẻ lời giải là cột tự cuộn, khối LỜI GIẢI nằm dưới 4 ý ⇒ em không thấy (thầy báo 28/09). Vừa chốt xong thì tự cuộn tới khối LỜI GIẢI.
 const ngang=useNgang(),goc=useRef<HTMLElement>(null)
 useEffect(()=>{if(ngang)goc.current?.querySelector('.loi-giai')?.scrollIntoView?.({block:'start',behavior:'smooth'})},[ngang,stt])
 const em=(phanHoi.traLoi||traLoiMay).trim(),dap=phanHoi.answer.trim(),vai=docVai(q.vai)
 const chung={stt,onZoom,text:q.text,table:q.table,thanCauImg:q.thanCauImg,imageDataUrl:q.imageDataUrl,hinhAnh:q.hinhAnh as HinhAnh[],tieuDe:q.tenDang||'',cheDo:'xem_lai' as const,loiGiai:loiGiaiChoTheCau(phanHoi.solution,q.phan,dap)}
 const pc:TheCauProps=q.phan==='I'?{...chung,phan:'I',choices:q.choices as [string,string,string,string],choiceImgs:q.choiceImgs as [string?,string?,string?,string?],choicePerm:[0,1,2,3],
   selected:(/^[ABCD]$/.test(em)?em:null) as 'A'|'B'|'C'|'D'|null,correct:(/^[ABCD]$/.test(dap)?dap:undefined) as 'A'|'B'|'C'|'D'|undefined}
  :q.phan==='II'?{...chung,phan:'II',ideas:q.ideas as [string,string,string,string],ideaImgs:q.ideaImgs as [string?,string?,string?,string?],
   selected:Array.from({length:4},(_,i)=>(em[i]==='D'||em[i]==='S'?em[i]:null) as 'D'|'S'|null),correct:dapAnDungSai(dap)}
  :{...chung,phan:'III',selected:em||null,correct:dap}
 return <section ref={goc} className="dao2-the-giai m3" aria-label={`Lời giải ải ${stt}`}>
  <p className="dao2-giai-dau"><b data-vai={vai??undefined}>ẢI {stt}{vai?` · ${TEN_VAI[vai].toLocaleUpperCase('vi')}`:''}</b><span>{[q.tenDang,q.mucDo?MUC_DO[q.mucDo]:''].filter(Boolean).join(' · ')}</span></p>
  <TheCau {...pc}/>
  <HinhTaiViTri hinhAnh={phanHoi.solutionImages} viTri="sau_loi_giai" nhan="lời giải" onZoom={onZoom}/>
  <NutHoiThay qid={q.qid} nguon={nguon} gon/>
 </section>
}
/** "+N EXP" bay từ nút dưới (chỗ vừa bấm CHỐT, nay là nút đọc xong lời giải) lên ảnh thần thú. Hằng ngoài component để không đổi mỗi lần vẽ. */
const TU_NUT_DAO2=['.dao2-nut-chot','.dao2-ai .dao2-nut-xanh'] as const
/** Dải kết quả trên thẻ lời giải: đúng ⇒ quái trúng đòn; chưa đúng ⇒ quái phản đòn (số máu đúng `learningBattle`). Chữ thưởng lấy nguyên lời máy chủ. */
export function DaiKetQua({profile,cau:q,phanHoi,ketQua,tong}:{profile:DaoProfile;cau:CauDao2;phanHoi:PhanHoi2;ketQua:readonly BattleAnswer[];tong:number}){
 const cheDo=useCheDoHieuUng(),expBay=expCauGame({correct:phanHoi.correct,coTroGiup:phanHoi.coTroGiup,reward:phanHoi.reward,expThuThach:phanHoi.expThuThach,expCau:phanHoi.expCau})
 const tran=learningBattle([...ketQua],tong),thu=chiSoThu(profile.pet),lyDo=phanHoi.lyDo.chu.replace(/^\+\d+\s*(EXP)?\s*·\s*/,'').trim()
 // tiếng đòn: MỘT lần mỗi lần chấm (dải này dựng mới mỗi ải); tắt tiếng / chưa mở âm thanh ⇒ im lặng
 useEffect(()=>{playBattleSound(thu,evolutionStage(profile.cap),phanHoi.correct,tran.rage)},[]) // eslint-disable-line react-hooks/exhaustive-deps
 return <div className="dao2-kinh dao2-ket-qua" data-dung={phanHoi.correct?'':undefined} role="status">
  <img src={anhThu(thu,profile.cap,true)} alt="" width="88" height="88" decoding="async" draggable={false} data-dich-exp=""/>
  <b className="dao2-ket-qua-so" aria-label={phanHoi.correct?`${TEN_QUAI} mất ${tran.damage} máu`:`Thần thú của em mất ${tran.damage} máu`}>−{tran.damage}</b>
  <span><strong>{phanHoi.correct?'Đúng rồi · quái trúng đòn':'Chưa đúng · quái phản đòn'}</strong>
   {phanHoi.correct&&tran.rage&&<em className="dao2-ket-qua-no">CUỒNG NỘ ×2 · 3 câu đúng liền</em>}
   {/* Luật v4: "+N EXP" bay sang ảnh thú nhỏ (số máy chủ); câu có trợ giúp vẫn hiện số thưởng tĩnh như cũ */}
   {expBay>0?<SoExpCau exp={expBay} cheDo={cheDo} vaoThu="dong" tu={TU_NUT_DAO2}/>:phanHoi.reward>0&&<em>+{phanHoi.reward} EXP</em>}
   <small>{[lyDo,!phanHoi.correct&&docVai(q.vai)==='moi'?'Ô đất vẫn được khai phá.':'',!phanHoi.correct?'Câu này sẽ quay lại theo lịch ôn lại.':''].filter(Boolean).join(' ')}</small></span>
 </div>
}

// ───────────── màn trong ải (làm + lời giải) ─────────────
// 28/09 lần 2 (thầy: "chỗ hiển thị đề phải có diện tích lớn nhất"): mặc định cột TRẬN 40 % ⇒ cột đề 60 %; khoá lưu mới (…2) để máy đã lưu 58 cũng nhận mặc định mới.
const KHOA_TI='ddh.dao2.tiCot2',TI_MIN=30,TI_MAX=75,TI_MAC_DINH=40
function docTi():number{try{const v=Number(localStorage.getItem(KHOA_TI));return v>=TI_MIN&&v<=TI_MAX?v:TI_MAC_DINH}catch{return TI_MAC_DINH}}
export interface TrongAiProps{
 profile:DaoProfile;cau:readonly CauDao2[];viTri:number;ketQua:readonly BattleAnswer[]
 traLoi:string;assisted:boolean;phanHoi:PhanHoi2|null;busy?:boolean;loi?:string;maLoi?:string
 onTraLoi:(v:string)=>void;onAssisted:(v:boolean)=>void;onNop:()=>void;onTiep:()=>void;onRoi:()=>void
}
export default function TrongAi({profile,cau,viTri,ketQua,traLoi,assisted,phanHoi:phanHoiMay,busy=false,loi='',maLoi='',onTraLoi,onAssisted,onNop,onTiep,onRoi}:TrongAiProps){
 const khung=useRef<HTMLDivElement>(null),[ti,setTi]=useState(docTi)
 // BẮN CHƯỞNG TRƯỚC LỜI GIẢI (thầy 28/09: "cho chưởng chạy ngay lúc em chốt đáp án"): máy chủ vừa trả kết quả (phanHoi null → có) ⇒ GIỮ cảnh trận
 // ~1,1 s (giảm chuyển động: 0,45 s) cho chưởng chạy trọn rồi mới mở lời giải; em bấm vào màn (click, không pointerdown: tránh cú chạm rơi trúng nút SANG ẢI vừa hiện) ⇒ bỏ qua. `chuongSk` = đòn được chiếu —
 // sang câu sau thì xoá ⇒ cảnh dựng lại không chiếu lần hai. Máu/EXP/lời giải vẫn là số máy chủ, chỉ trễ lúc HIỆN.
 const suKien=ketQua.length,[phTruoc,setPhTruoc]=useState(phanHoiMay),[cho,setCho]=useState(false),[chuongSk,setChuongSk]=useState(-1)
 if(phanHoiMay!==phTruoc){setPhTruoc(phanHoiMay);if(phanHoiMay&&!phTruoc){setCho(true);setChuongSk(suKien)}else if(!phanHoiMay){setCho(false);setChuongSk(-1)}}
 const phanHoi=cho?null:phanHoiMay,boQua=()=>{if(cho)setCho(false)}
 useEffect(()=>{if(!cho)return
  khung.current?.querySelector('.dao2-canh')?.scrollIntoView?.({block:'nearest',behavior:'smooth'})
  const h=setTimeout(()=>setCho(false),giamChuyenDong()?450:1100);return()=>clearTimeout(h)},[cho])
 // Ngang: thanh kéo giữa hai cột (thầy 28/09) — tỉ lệ cột trái % lưu trên máy em.
  const datTi=(v:number)=>{const x=Math.min(TI_MAX,Math.max(TI_MIN,v));setTi(x);try{localStorage.setItem(KHOA_TI,String(Math.round(x)))}catch{/* máy chặn lưu: bỏ qua */}}
 const keoTi=(x:number)=>{const r=khung.current?.getBoundingClientRect();if(r&&r.width>0)datTi((x-r.left)/r.width*100)}
 const ngang=useNgang(),[zoom,setZoom]=useState(''),[hinhLoi,setHinhLoi]=useState(false),q=cau[viTri],hetTran=!!loi&&laLoiHetTran(loi,maLoi),loiRef=useRef<HTMLParagraphElement>(null)
 useEffect(()=>{setHinhLoi(false)},[viTri])
 useEffect(()=>{if(loi)loiRef.current?.scrollIntoView?.({block:'nearest'})},[loi])
 if(!q)return null
 const vai=docVai(q.vai),goiY=docGoiY(q.goiY,q.phan),cuoi=viTri+1>=cau.length
 const nhan=<p className="dao2-ai-nhan">ẢI {viTri+1}/{cau.length}{vai?` · ${TEN_VAI[vai].toLocaleUpperCase('vi')}`:''}{q.tenDang?<span> · {q.tenDang}</span>:null}</p>
 const thieu=!traLoi.trim()||(q.phan==='II'&&!/^[DS]{4}$/.test(traLoi))
 const chuNutThieu=q.phan==='I'?'Chọn một phương án để tung chiêu':q.phan==='II'?'Chọn đủ 4 ý để tung chiêu':'Nhập đáp án để tung chiêu'
 // Dọc: một cột như cũ (hai lớp bọc `display:contents`). Ngang: cột TRÁI = thế giới game (thanh ải, cảnh trận, dải kết quả) · cột PHẢI = phần học
 // (đề + phương án tự cuộn trong cột, lời giải, nút chính ở đáy). Lúc đọc lời giải bố cục ngang GIỮ cảnh trận (đòn vừa đánh) ở cột trái.
 return <div className="dao2-ai" data-pha={phanHoi?'giai':'lam'} data-chuong={cho?'':undefined} ref={khung} onClickCapture={boQua} style={ngang?{gridTemplateColumns:`minmax(0,${ti}fr) 20px minmax(0,${100-ti}fr)`}:undefined}>
  {zoom&&<ManHinhAnh src={zoom} alt="Ảnh câu hỏi / lời giải" onClose={()=>setZoom('')}/>}
  <div className="dao2-ai-trai">
   <div className="dao2-ai-dau">
    <button type="button" className="dao2-nut-tron" onClick={onRoi} aria-label="Rời chuyến về bản đồ (chuyến đang làm được giữ lại)"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>
    {ngang?nhan:<div className="dao2-kinh dao2-thanh-khung"><ThanhAi cau={cau} viTri={viTri} ketQua={ketQua}/></div>}
    <NutToanManHinh/>
   </div>
   {!ngang&&!phanHoi&&nhan}
   {(!phanHoi||ngang)&&<CanhRung profile={profile} ketQua={ketQua} tong={cau.length} suKien={suKien} chuong={chuongSk===suKien}/>}
   {phanHoi&&<DaiKetQua profile={profile} cau={q} phanHoi={phanHoi} ketQua={ketQua} tong={cau.length}/>}
   {ngang&&<TienDoChuyen cau={cau} viTri={viTri} ketQua={ketQua}/>}
  </div>
  {ngang&&<div className="dao2-keo" role="separator" aria-orientation="vertical" aria-label="Kéo để đổi độ rộng hai cột" aria-valuemin={TI_MIN} aria-valuemax={TI_MAX} aria-valuenow={Math.round(ti)} tabIndex={0}
   onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId)}} onPointerMove={e=>{if(e.currentTarget.hasPointerCapture(e.pointerId))keoTi(e.clientX)}}
   onKeyDown={e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();datTi(ti+(e.key==='ArrowLeft'?-5:5))}}}><i/></div>}
  <div className="dao2-ai-phai">
  {!phanHoi?<>
   <TheCauAi cau={q} stt={viTri+1} traLoi={traLoi} khoa={busy||cho} onTraLoi={onTraLoi} onZoom={setZoom} onHinhLoi={()=>setHinhLoi(true)}/>
   {hinhLoi&&<p role="alert" className="dao2-loi">Hình của câu chưa tải được. Em về bản đồ rồi bấm LÊN ĐƯỜNG để mở lại; câu này chưa bị tính sai.</p>}
  </>:<KhoiLoiGiai cau={q} stt={viTri+1} phanHoi={phanHoi} traLoiMay={traLoi} onZoom={setZoom}/>}
  <div className="dao2-chan" data-noi={phanHoi||!thieu||loi?'':undefined}>
   {cho?<button type="button" className="dao2-nut-xanh" onClick={boQua}>XEM LỜI GIẢI</button>
   :hetTran&&!phanHoi?<div className="dao2-kinh dao2-het-tran" role="alert"><p ref={loiRef}>{CHU_HET_TRAN_DAO}</p><button type="button" className="dao2-nut-vang" onClick={onRoi}>VỀ BẢN ĐỒ</button></div>
   :<>{loi&&<p className="dao2-loi" role="alert" ref={loiRef}>{loi}</p>}
    {/* Ô "có trợ giúp" (thầy 28/09 lần 2: thu thành chip mảnh CẠNH nút chốt, không chiếm dòng riêng — nhường chỗ cho đề): bật ⇒ máy chủ ghi `assisted`,
        câu chưa tính Thành thạo và quay lại sớm; lời giải thích nằm ở `title` và hiện một dòng nhỏ khi đã bật. */}
    {!phanHoi?<><div className="dao2-chan-hang">
     {!goiY&&<label className="dao2-tro" data-bat={assisted?'':undefined} title="Xem tài liệu hoặc được chỉ bài thì bật lên · câu sẽ quay lại để em tự làm">
      <input type="checkbox" role="switch" className="dao2-tro-gat" aria-label="Câu này em có trợ giúp" checked={assisted} disabled={busy} onChange={e=>onAssisted(e.target.checked)}/>
      <span className="dao2-tro-chu" aria-hidden="true">Trợ giúp</span>
     </label>}
     {/* Hỏi thầy trước khi chốt (thầy lệnh 29/09) ⇒ bật "Trợ giúp": câu chưa tính Thành thạo, quay lại sớm cho em tự làm. */}
     <NutHoiThay qid={q?.qid} nguon="dao" gon onHoi={()=>{if(!goiY)onAssisted(true)}}/>
     <button type="button" className="dao2-nut-chot" disabled={busy||hinhLoi||thieu} onClick={()=>{unlockBattleAudio();onNop()}}>{busy?'Đang chấm…':thieu?chuNutThieu:'CHỐT ĐÁP ÁN · TUNG CHIÊU'}</button>
    </div>
    {assisted&&!goiY&&<small className="dao2-tro-ghi">Có trợ giúp · câu này sẽ quay lại để em tự làm.</small>}</>
    :<button type="button" className="dao2-nut-xanh" disabled={busy} onClick={onTiep}>{cuoi?'ĐÃ ĐỌC LỜI GIẢI · HOÀN THÀNH CHUYẾN':`ĐÃ ĐỌC LỜI GIẢI · SANG ẢI ${viTri+2}`}</button>}</>}
  </div>
  </div>
 </div>
}
