// ĐẢO 2.0 · BẢN ĐỒ BÁT LINH ĐẢO (bản vẽ Moi-DaoBanDo.dc.html): đảo lục giác, sương mù tan theo CỌ XÁT, vùng theo dạng có %,
// đường 6 nút của chuyến hôm nay (nút Trùm có vương miện), thần thú đứng ở đầu đường; tấm dưới: "Chuyến thám hiểm k/n", 6 ô vai,
// Rương Bát Linh, nút LÊN ĐƯỜNG. Mọi số lấy từ `hoa2-sanh` / câu `start` trả — thiếu thì ẩn, không bịa.
import type {ReactNode} from 'react'
import type {BattleAnswer} from '../learning-battle'
import {anhThu} from '../dao/anh'
import {chiSoThu,tenThu} from '../dao/dao-core'
import type {DaoProfile} from '../dao/kieu'
import {NHAN_O_VAI,TEN_VAI,chuNgay,docVai,soDamSuong} from './dao2-core'
import type {CauDao2,Sanh2,Vung} from './dao2-core'
import './dao2.css'

/** Hệ toạ độ bản đồ = bản vẽ (390 × 480, cắt từ y = 20). */
const VB={x:0,y:20,w:390,h:480}
const pt=(x:number,y:number)=>({left:`${(x-VB.x)/VB.w*100}%`,top:`${(y-VB.y)/VB.h*100}%`})
const DAO='M40,160 C30,90 110,40 200,46 C290,52 360,100 352,190 C346,260 372,330 330,400 C290,466 200,480 130,452 C60,424 26,360 34,290 C38,240 46,210 40,160 Z'
const DUONG='M120 250 C150 240 176 236 196 226 C218 214 238 206 258 214 C280 222 290 246 300 268 C310 292 316 316 300 346'
/** 6 nút trên đường; nút cuối (Trùm ải) ở cuối đường. */
const NUT:readonly [number,number][]=[[160,238],[200,224],[244,208],[280,232],[302,282],[300,346]]
/** Đám sương theo thứ tự TAN TRƯỚC → tan sau (gần đầu đường tan trước). Hiện `soDamSuong` đám cuối danh sách. */
const SUONG:readonly [number,number,number][]=[[120,160,30],[220,110,32],[80,320,30],[110,400,36],[250,300,30],[300,160,34],[170,420,40],[250,400,50],[320,340,54],[300,260,58]]
/** Chỗ mọc đền (Thành thạo). */
const DEN:readonly [number,number][]=[[96,150],[150,110],[90,300],[160,280],[236,140],[140,380]]
/** 6 chỗ đặt nhãn vùng (toạ độ bản vẽ). */
const VUNG:readonly [number,number][]=[[70,80],[222,80],[56,290],[244,310],[76,430],[240,440]]

function NutDuong({vai,x,y,trang}:{vai:ReturnType<typeof docVai>;x:number;y:number;trang:string}){
 if(vai==='trum')return <g className="dao2-bd-nut" data-vai="trum" data-trang={trang}><circle cx={x} cy={y} r="20" className="dao2-bd-hao-trum" filter="url(#d2-sang)"/><circle cx={x} cy={y} r="15" className="dao2-bd-nut-tron"/><path d={`M${x-8} ${y+4} l2 -9 4 4 2 -6 2 6 4 -4 2 9 z`} className="dao2-bd-vuong-mien"/></g>
 return <g className="dao2-bd-nut" data-vai={vai??undefined} data-trang={trang}><circle cx={x} cy={y} r="11" className="dao2-bd-nut-tron"/>
  {vai==='on_lai'?<path d={`M${x-5} ${y} a5 5 0 1 1 5 5`} className="dao2-bd-nut-ky" fill="none"/>:<path d={`M${x} ${y-6} l3 6 -3 6 -3 -6 z`} className="dao2-bd-nut-kim"/>}</g>
}

export interface BanDoProps{
 profile:DaoProfile;sanh:Sanh2|null;dangTai:boolean;loiSanh?:string
 /** Câu của chuyến sắp đi / đang đi dở (máy chủ `start`/`resume` trả) — null khi chưa soạn xong. */
 cau:readonly CauDao2[]|null;ketQua:readonly BattleAnswer[]
 soan?:string;het?:string;soChuyen:{k:number;n:number}|null;vung:readonly Vung[]
 busy?:boolean;loi?:string;ruongVua?:number|null
 onLenDuong:()=>void;onThuLai:()=>void;onVe:()=>void;onMoRuong?:()=>void
 thanhDuoi?:ReactNode
}
export default function BanDo({profile,sanh,dangTai,loiSanh='',cau,ketQua,soan='',het='',soChuyen,vung,busy=false,loi='',ruongVua=null,onLenDuong,onThuLai,onVe,onMoRuong,thanhDuoi}:BanDoProps){
 const thu=chiSoThu(profile.pet),ten=tenThu(profile),cd=sanh?.chienDich??null,ru=sanh?.ruong??null
 const damSuong=cd?soDamSuong(cd.coXat,cd.tong):SUONG.length,soDen=cd&&cd.thanhThao>0&&cd.tong>0?Math.min(DEN.length,Math.ceil(DEN.length*cd.thanhThao/cd.tong)):0
 const nut=(cau??[]).slice(0,NUT.length),dangDo=ketQua.length>0&&!!cau?.length
 const oVai=cau?cau.slice(0,6):null
 return <div className="dao2-bd">
  <header className="dao2-bd-dau">
   <button type="button" className="dao2-nut-tron dao2-nut-tron-lon" onClick={onVe} aria-label="Về app học sinh" title="Về app học sinh"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>
   <h2><small>BÁT LINH ĐẢO</small>{cd?.ten?`Đảo ${cd.ten}`:'Bát Linh Đảo'}</h2>
   {sanh?.theLuc&&<p className="dao2-kinh dao2-the-luc" aria-label={`Thể lực hôm nay: còn ${sanh.theLuc.con} trên ${sanh.theLuc.tong} câu`}><svg viewBox="0 0 14 16" width="14" height="16" aria-hidden="true"><polygon points="7,0 14,5 11,16 3,16 0,5"/></svg><span><small>Thể lực</small>{sanh.theLuc.con}/{sanh.theLuc.tong}</span></p>}
  </header>

  <div className="dao2-bd-khung">
   <svg className="dao2-bd-svg" viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`} aria-hidden="true">
    <defs>
     <linearGradient id="d2-bien" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="rgb(13,42,94)"/><stop offset="1" stopColor="rgb(7,18,41)"/></linearGradient>
     <radialGradient id="d2-dat" cx="35%" cy="30%"><stop offset="0" stopColor="rgb(91,224,168)"/><stop offset=".55" stopColor="rgb(34,148,107)"/><stop offset="1" stopColor="rgb(17,88,63)"/></radialGradient>
     <pattern id="d2-luc" width="18" height="15.6" patternUnits="userSpaceOnUse"><path d="M4.5 0 L13.5 0 L18 7.8 L13.5 15.6 L4.5 15.6 L0 7.8 Z" fill="none" stroke="rgba(255,255,255,.22)" strokeWidth=".9"/></pattern>
     <clipPath id="d2-cat"><path d={DAO}/></clipPath>
     <filter id="d2-suong" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="12"/></filter>
     <filter id="d2-sang" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="4"/></filter>
    </defs>
    <rect x={VB.x} y={VB.y} width={VB.w} height={VB.h} fill="url(#d2-bien)"/>
    <path d="M0 40 q20 -6 40 0 t40 0 t40 0 M250 490 q20 -6 40 0 t40 0 t40 0 M0 470 q20 -6 40 0 t40 0" stroke="rgba(140,200,255,.14)" strokeWidth="2" fill="none"/>
    <path d={DAO} fill="none" stroke="rgb(233,207,148)" strokeWidth="12"/>
    <path d={DAO} fill="url(#d2-dat)"/>
    <g clipPath="url(#d2-cat)">
     <rect x="20" y="40" width="360" height="450" fill="url(#d2-luc)"/>
     <path d="M196 46 L196 470 M30 200 L360 210 M30 340 L360 330" stroke="rgba(10,40,30,.55)" strokeWidth="2" strokeDasharray="6 6"/>
     <ellipse cx="110" cy="120" rx="40" ry="18" fill="rgb(45,176,127)" opacity=".7"/>
     <ellipse cx="120" cy="270" rx="46" ry="20" fill="rgb(26,122,88)" opacity=".7"/>
     <g fill="rgb(14,79,57)"><circle cx="80" cy="150" r="6"/><circle cx="150" cy="96" r="5"/><circle cx="96" cy="300" r="6"/><circle cx="160" cy="240" r="5"/><circle cx="240" cy="120" r="5"/></g>
     {DEN.slice(0,soDen).map(([x,y])=><g key={`${x}-${y}`} className="dao2-bd-den"><rect x={x-7} y={y-3} width="14" height="9" rx="1"/><path d={`M${x-9} ${y-3} L${x} ${y-10} L${x+9} ${y-3} Z`}/></g>)}
     <g className="dao2-bd-suong" filter="url(#d2-suong)" data-so={damSuong}>{SUONG.slice(SUONG.length-damSuong).map(([x,y,r])=><circle key={`${x}-${y}`} cx={x} cy={y} r={r}/>)}</g>
    </g>
    <path d={DUONG} stroke="rgb(255,214,107)" strokeWidth="3" strokeDasharray="3 7" strokeLinecap="round" fill="none"/>
    {nut.map((c,i)=>{const vai=docVai(c.vai),[x,y]=i===nut.length-1&&vai==='trum'?NUT[5]!:NUT[i]!,kq=ketQua.find(k=>k.qid===c.qid)
     return <NutDuong key={c.qid} vai={vai} x={x} y={y} trang={kq?(kq.correct?'dung':'sai'):'cho'}/>})}
   </svg>
   <img className="dao2-bd-thu" src={anhThu(thu,profile.cap,true)} alt={`Thần thú của em: ${ten}`} width="70" height="70" decoding="async" draggable={false} style={pt(88,202)}/>
   {vung.length>0&&<ul className="dao2-bd-vung" aria-label="Vùng đất theo dạng bài">{vung.slice(0,VUNG.length).map((v,i)=><li key={v.ten} data-sang={v.tiLe>=60?'':undefined} style={pt(...VUNG[i]!)} aria-label={`Vùng ${v.ten}: ${v.tiLe}% câu làm đúng ở lần gần nhất (${v.dung}/${v.daLam} câu)`}>{v.ten} · {v.tiLe}%</li>)}</ul>}
  </div>

  {cd&&<div className="dao2-bd-so">
   <p className="dao2-kinh"><small>Sương đã tan · Cọ xát</small><b className="dao2-so-xanh">{cd.coXat}/{cd.tong} ô</b></p>
   <p className="dao2-kinh"><small>Đền đã dựng · Thành thạo</small><b className="dao2-so-vang">{cd.thanhThao}/{cd.tong} ô</b>{cd.thanhThao===0&&cd.thanhThaoTangTu&&chuNgay(cd.thanhThaoTangTu)?<small>Đền mọc từ {chuNgay(cd.thanhThaoTangTu)}</small>:null}</p>
   {vung.length>0&&<p className="dao2-bd-chu-thich">1 ô = 1 câu của chiến dịch · % ở mỗi vùng = câu em làm đúng ở lần gần nhất</p>}
  </div>}

  <section className="dao2-kinh dao2-bd-tam" aria-label="Chuyến thám hiểm hôm nay">
   {dangTai&&!sanh?<p className="dao2-bd-cho" role="status" aria-busy="true">Đang mở bản đồ đảo…</p>
   :loiSanh&&!sanh?<div className="dao2-bd-loi" role="alert"><p>{loiSanh}</p><button type="button" className="dao2-nut-vien" onClick={onThuLai}>Thử lại</button></div>
   :<>
    <div className="dao2-bd-tam-dau">
     <h3>{soChuyen?`Chuyến thám hiểm ${soChuyen.k}/${soChuyen.n}`:'Chuyến thám hiểm'}</h3>
     {oVai&&oVai.length>0&&<span>{oVai.length} ải · {oVai.length}–{oVai.length+2} phút</span>}
    </div>
    {het?<p className="dao2-bd-het" role="status">{het}</p>
    :<ol className="dao2-bd-vai" aria-label="Vai của từng ải" aria-busy={!oVai||undefined}>
     {(oVai??Array.from({length:6},()=>null)).map((c,i)=>{const vai=c?docVai(c.vai):null,kq=c?ketQua.find(k=>k.qid===c.qid):undefined
      return <li key={c?.qid??`cho-${i}`} data-vai={vai??undefined} data-trang={kq?(kq.correct?'dung':'sai'):undefined} data-cho={c?undefined:''} aria-label={c?`Ải ${i+1}: ${vai?TEN_VAI[vai]:'chưa rõ vai'}${kq?(kq.correct?' · đã qua, đúng':' · đã qua, chưa đúng'):''}`:`Ải ${i+1}: đang soạn`}>{c?(vai?NHAN_O_VAI[vai]:`Ải ${i+1}`):''}</li>})}
    </ol>}
    {ru&&ru.tong>0&&<div className="dao2-ruong">
     <svg viewBox="0 0 28 24" width="28" height="24" aria-hidden="true"><rect x="2" y="9" width="24" height="13" rx="2" className="dao2-ruong-than"/><path d="M2 11 C2 4 26 4 26 11 Z" className="dao2-ruong-nap"/><rect x="12" y="9" width="4" height="7" rx="1" className="dao2-ruong-khoa"/></svg>
     <span className="dao2-ruong-chu"><b>{ru.daMo?`Rương Bát Linh · đã mở hôm nay${(ruongVua??ru.vang)?` · +${ruongVua??ru.vang} vàng`:''}`:`Rương Bát Linh · xong ${ru.tong}/${ru.tong} câu hôm nay để mở`}</b>
      <span className="dao2-vach dao2-vach-vang" role="progressbar" aria-label="Câu đã làm hôm nay" aria-valuemin={0} aria-valuemax={ru.tong} aria-valuenow={Math.min(ru.daLam,ru.tong)}><i style={{width:`${Math.min(100,ru.daLam/ru.tong*100)}%`}}/></span></span>
     <span className="dao2-ruong-so">{Math.min(ru.daLam,ru.tong)}/{ru.tong}</span>
     {ru.moDuoc&&!ru.daMo&&onMoRuong&&<button type="button" className="dao2-nut-vien dao2-nut-ruong" disabled={busy} onClick={onMoRuong}>Mở rương</button>}
    </div>}
    {(soan||loi)&&<p className={loi?'dao2-loi':'dao2-bd-cho'} role={loi?'alert':'status'}>{loi||soan}</p>}
    {dangDo&&!het&&<p className="dao2-bd-cho">Em đang đi dở chuyến — bấm LÊN ĐƯỜNG để đi tiếp từ ải {ketQua.length+1}.</p>}
    {!het&&<button type="button" className="dao2-nut-vang" disabled={busy||!!sanh?.khoaDao} onClick={onLenDuong}><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>{busy&&soan?'ĐANG SOẠN HÀNH TRANG…':'LÊN ĐƯỜNG · XUA SƯƠNG MÙ'}</button>}
   </>}
  </section>
  {thanhDuoi}
 </div>
}
