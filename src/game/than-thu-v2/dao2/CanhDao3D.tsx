// ĐẢO 2.0 · CẢNH BẢN ĐỒ 3D (bản vẽ docs/ban-ve-dao-3d-2809/Dao3D.html) — cùng ngôn ngữ hình với Sảnh 3D (CanhSanh3D):
// trời hoàng hôn (SÁNG) / đêm có sao + trăng (TỐI), biển có sóng + lấp lánh, mây, đảo 2.5D (vách đá nhiều lớp, bóng xuống nước,
// viền sáng, bọt sóng), 6 mảng đất theo dạng (ranh mềm) + nhãn kính "Tên · x%", sương mù cuộn tan theo % THẬT từng vùng
// (lõi đảo theo Cọ xát chung), đền + cờ mọc ở vùng % cao nhất theo Thành thạo, đường ải phát sáng 6 mốc (Trùm to + vương miện),
// thần thú (ảnh thật anhThu) đứng ở mốc hiện tại, nhún nhẹ.
// Chỉ vẽ — mọi số do BanDo truyền vào (máy chủ). Hình ngẫu nhiên dùng hạt giống cố định. Màu đi qua biến --d2-* (dao2.css).
// Chuyển động: chỉ transform/opacity (CSS); thị sai rAF chỉ chạy khi có chuột / nghiêng máy, dừng khi tab ẩn, dọn khi unmount;
// prefers-reduced-motion ⇒ không thị sai, CSS tắt mọi hoạt ảnh.
import {useEffect,useRef,type CSSProperties,type RefObject} from 'react'
import type {BattleAnswer} from '../learning-battle'
import {docVai} from './dao2-core'
import type {CauDao2,Vung} from './dao2-core'

type Diem=readonly [number,number]
/** Hệ toạ độ bản đồ (bản vẽ): khung giữ đúng tỉ lệ này nên vị trí % của ảnh/nhãn khớp SVG. */
export const VB={x:22,y:52,w:356,h:396} as const
/** Lề SVG ngoài khung (CSS `.dao2-3d-dao>.dao2-bd-svg{inset:-15%}`) — cùng tỉ lệ nên vị trí % vẫn khớp. */
const LE=.15
export const pt=(x:number,y:number):CSSProperties=>({left:`${(x-VB.x)/VB.w*100}%`,top:`${(y-VB.y)/VB.h*100}%`})
const DAO='M44 190 C34 124 104 74 196 70 C262 68 300 88 330 104 C368 126 372 176 360 210 C352 234 330 238 334 262 C340 290 372 300 350 334 C318 378 236 386 176 380 C132 376 110 392 78 376 C44 358 30 318 38 280 C44 250 52 226 44 190 Z'
/** 6 vùng: mảng đất (cx, cy, rx, ry) + chỗ neo nhãn (x, y, bám mép trái/phải khung để không tràn). */
const VUNG:readonly {c:readonly [number,number,number,number];n:readonly [number,number,'trai'|'phai']}[]=[
 {c:[118,138,92,62],n:[44,112,'trai']},{c:[288,132,90,60],n:[352,106,'phai']},{c:[82,246,64,70],n:[28,212,'trai']},
 {c:[322,236,60,72],n:[372,318,'phai']},{c:[140,338,90,52],n:[62,356,'trai']},{c:[274,334,90,54],n:[346,372,'phai']}]
/** Lõi đảo (không thuộc vùng nào) — sương theo Cọ xát chung. */
const LOI=[206,250,96,84] as const
const TONE=['--d2-co-1','--d2-co-2','--d2-co-1','--d2-co-3','--d2-co-2','--d2-co-1'] as const
const TONE_OP=[.55,.45,.35,.35,.6,.25] as const
/** Chỗ mọc đền của từng vùng (tránh nhãn + đường ải). */
const DEN:readonly Diem[]=[[176,166],[336,178],[64,300],[300,252],[204,346],[236,346]]
/** 6 mốc ải (mốc cuối = Trùm ải). */
export const NUT:readonly Diem[]=[[122,300],[172,272],[222,292],[262,248],[222,198],[270,160]]
/** Chỗ thần thú đứng khi chưa có chuyến (đầu đường). */
const DAU_DUONG:Diem=[96,318]

function duongMuot(p:readonly Diem[]):string{let d=`M${p[0]![0]} ${p[0]![1]}`
 for(let i=0;i<p.length-1;i++){const a=p[i-1]??p[i]!,b=p[i]!,c=p[i+1]!,e=p[i+2]??c
  d+=` C${(b[0]+(c[0]-a[0])/6).toFixed(1)} ${(b[1]+(c[1]-a[1])/6).toFixed(1)} ${(c[0]-(e[0]-b[0])/6).toFixed(1)} ${(c[1]-(e[1]-b[1])/6).toFixed(1)} ${c[0]} ${c[1]}`}
 return d}
const DUONG=duongMuot(NUT)
/** Hạt giống cố định ⇒ ảnh chụp lặp lại được. */
function hatGiong(s:number){return ()=>(s=(s*9301+49297)%233280)/233280}
const CAY=(()=>{const r=hatGiong(11),ra:[number,number,number][]=[]
 for(let i=0;i<30;i++){const x=50+r()*300,y=90+r()*280,k=r()
  if(NUT.some(([a,b])=>Math.hypot(a-x,b-y)<34)||DEN.some(([a,b])=>Math.hypot(a-x,b-y+14)<26)||VUNG.some(v=>Math.hypot(v.n[0]-x,v.n[1]-y)<30))continue
  ra.push([Math.round(x),Math.round(y),k])}
 return ra.sort((a,b)=>a[1]-b[1])})()
const SUONG=(()=>{const r=hatGiong(21);return [...VUNG.map(v=>v.c),LOI].map(([cx,cy,rx,ry])=>Array.from({length:5},()=>({
 cx:Math.round(cx+(r()-.5)*rx*1.2),cy:Math.round(cy+(r()-.5)*ry*1.2),rx:Math.round(rx*.7+r()*22),ry:Math.round(ry*.66+r()*16),t:(10+r()*8).toFixed(1),d:(-r()*10).toFixed(1)})))})()
const SONG=(()=>{const r=hatGiong(3);return Array.from({length:12},(_,i)=>{let d='';const y=20+i*34;for(let x=-120;x<560;x+=40)d+=`M${x} ${y} q10 -5 20 0 `
 return {d,o:(.12+r()*.18).toFixed(2),t:(8+r()*8).toFixed(1)}})})()
const LAP=(()=>{const r=hatGiong(5);return Array.from({length:26},()=>({x:Math.round(r()*400),y:Math.round(r()*400),rx:(3+r()*6).toFixed(1),t:(2+r()*3).toFixed(1),d:(-r()*3).toFixed(1)}))})()
const SAO=(()=>{const r=hatGiong(9);return Array.from({length:36},()=>({l:(r()*100).toFixed(1),t:(r()*40).toFixed(1),dt:(2+r()*3).toFixed(1),dd:(-r()*3).toFixed(1)}))})()
/** Độ đục sương theo tỉ lệ khai phá 0..1 (80% ⇒ gần tan hết). */
export const doDucSuong=(tiLe:number)=>Math.max(0,Math.min(1,1-tiLe*1.08))

const kieu=(o:Record<string,string|number>)=>o as CSSProperties

export interface CanhDao3DProps{
 vung:readonly Vung[]
 /** Cọ xát / Thành thạo của chiến dịch; null ⇒ sương phủ kín, không đền. */
 coXat:number;tong:number;thanhThao:number
 /** Số đám sương cũ (soDamSuong) — giữ làm dấu `data-so` cho máy đo. */
 damSuong:number
 cau:readonly CauDao2[]|null;ketQua:readonly BattleAnswer[]
 anhThu:string;tenThu:string
}

export default function CanhDao3D({vung,coXat,tong,thanhThao,damSuong,cau,ketQua,anhThu,tenThu}:CanhDao3DProps){
 const nen=useRef<HTMLDivElement>(null),may=useRef<HTMLDivElement>(null),dao=useRef<HTMLDivElement>(null)
 // thị sai: chỉ khi có chuột / nghiêng máy; rAF dừng khi hội tụ hoặc tab ẩn; tắt khi xin giảm chuyển động
 useEffect(()=>{
  if(typeof window==='undefined'||!window.matchMedia||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return
  let mx=0,my=0,cx=0,cy=0,raf=0
  const lop:[RefObject<HTMLDivElement|null>,number][]=[[nen,.25],[may,.45],[dao,.6]]
  const buoc=()=>{cx+=(mx-cx)*.08;cy+=(my-cy)*.08
   for(const [r,k] of lop)if(r.current)r.current.style.transform=`translate3d(${(cx*k*14).toFixed(2)}px,${(cy*k*8).toFixed(2)}px,0)`
   raf=Math.abs(mx-cx)+Math.abs(my-cy)>.002&&!document.hidden?requestAnimationFrame(buoc):0}
  const day=(x:number,y:number)=>{mx=x;my=y;if(!raf&&!document.hidden)raf=requestAnimationFrame(buoc)}
  const chuot=(e:PointerEvent)=>day(e.clientX/window.innerWidth-.5,e.clientY/window.innerHeight-.5)
  const nghieng=(e:DeviceOrientationEvent)=>{if(e.gamma!=null&&e.beta!=null)day(Math.max(-1,Math.min(1,e.gamma/30))*.5,Math.max(-1,Math.min(1,(e.beta-40)/30))*.5)}
  const an=()=>{if(document.hidden&&raf){cancelAnimationFrame(raf);raf=0}}
  window.addEventListener('pointermove',chuot,{passive:true});window.addEventListener('deviceorientation',nghieng,{passive:true});document.addEventListener('visibilitychange',an)
  return ()=>{window.removeEventListener('pointermove',chuot);window.removeEventListener('deviceorientation',nghieng);document.removeEventListener('visibilitychange',an);if(raf)cancelAnimationFrame(raf)}
 },[])

 const tiLeChung=tong>0?Math.max(0,Math.min(1,coXat/tong)):0
 const soDen=thanhThao>0&&tong>0?Math.min(DEN.length,Math.ceil(DEN.length*thanhThao/tong)):0
 const thuTu=VUNG.map((_,i)=>i).sort((a,b)=>(vung[b]?.tiLe??-1)-(vung[a]?.tiLe??-1)||a-b)
 const nut=(cau??[]).slice(0,NUT.length)
 const viTri=(i:number):Diem=>i===nut.length-1&&docVai(nut[i]?.vai)==='trum'?NUT[5]!:NUT[i]!
 const hien=nut.length?Math.min(ketQua.length,nut.length-1):-1
 const choThu=hien>=0?viTri(hien):DAU_DUONG

 return <>
  <div className="dao2-3d-nen" ref={nen} aria-hidden="true">
   <i className="dao2-3d-tia"/><i className="dao2-3d-mat-troi"/><i className="dao2-3d-trang"/>
   <span className="dao2-3d-sao">{SAO.map((s,i)=><i key={i} style={kieu({left:`${s.l}%`,top:`${s.t}%`,'--t':`${s.dt}s`,'--d':`${s.dd}s`})}/>)}</span>
   <svg className="dao2-3d-bien" viewBox="0 0 400 400" preserveAspectRatio="none">
    {SONG.map((s,i)=><path key={i} className={i%2?'dao2-3d-song dao2-3d-nguoc':'dao2-3d-song'} d={s.d} style={kieu({'--t':`${s.t}s`,stroke:`rgba(255,255,255,${s.o})`})}/>)}
    {LAP.map((l,i)=><ellipse key={i} className="dao2-3d-lap" cx={l.x} cy={l.y} rx={l.rx} ry="1.2" style={kieu({'--t':`${l.t}s`,'--d':`${l.d}s`})}/>)}
   </svg>
  </div>
  <div className="dao2-3d-may-lop" ref={may} aria-hidden="true">
   <i className="dao2-3d-may" style={kieu({left:'4%',top:'4%',width:'30%','--t':'46s'})}/>
   <i className="dao2-3d-may" style={kieu({left:'70%',top:'10%',width:'34%','--t':'52s','--d':'-20s'})}/>
  </div>
  <div className="dao2-3d-dao" ref={dao}>
   <svg className="dao2-bd-svg" viewBox={`${VB.x-LE*VB.w} ${VB.y-LE*VB.h} ${VB.w*(1+2*LE)} ${VB.h*(1+2*LE)}`} aria-hidden="true">
    <defs>
     <linearGradient id="d2-co" x1="0" y1="0" x2=".4" y2="1"><stop offset="0" style={{stopColor:'var(--d2-co-1)'}}/><stop offset=".55" style={{stopColor:'var(--d2-co-2)'}}/><stop offset="1" style={{stopColor:'var(--d2-co-3)'}}/></linearGradient>
     <linearGradient id="d2-vach" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style={{stopColor:'var(--d2-vach-1)'}}/><stop offset="1" style={{stopColor:'var(--d2-vach-3)'}}/></linearGradient>
     <linearGradient id="d2-vien" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style={{stopColor:'var(--d2-vien-sang)',stopOpacity:1}}/><stop offset=".5" style={{stopColor:'var(--d2-vien-sang)',stopOpacity:.25}}/><stop offset="1" style={{stopColor:'var(--d2-vien-sang)',stopOpacity:0}}/></linearGradient>
     <radialGradient id="d2-hao" cx="30%" cy="25%" r="70%"><stop offset="0" stopColor="rgb(255,255,230)" stopOpacity=".45"/><stop offset="1" stopColor="rgb(255,255,230)" stopOpacity="0"/></radialGradient>
     <radialGradient id="d2-suong-g"><stop offset="0" style={{stopColor:'var(--d2-suong)',stopOpacity:.97}}/><stop offset=".55" style={{stopColor:'var(--d2-suong-2)',stopOpacity:.85}}/><stop offset="1" style={{stopColor:'var(--d2-suong-2)',stopOpacity:0}}/></radialGradient>
     <filter id="d2-mo" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="9"/></filter>
     <filter id="d2-bong" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="10"/></filter>
     <filter id="d2-sang" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="3.5"/></filter>
     <clipPath id="d2-cat"><path d={DAO}/></clipPath>
    </defs>
    {/* bóng xuống nước · bọt sóng · vách đá nhiều lớp + vân · mặt cỏ */}
    <path d={DAO} className="dao2-3d-bong" transform="translate(16 54)" filter="url(#d2-bong)"/>
    <path d={DAO} className="dao2-3d-bot" transform="translate(0 44)"/>
    <path d={DAO} className="dao2-3d-bot dao2-3d-bot-2" transform="translate(0 50) scale(1.02) translate(-4 -4)"/>
    <path d={DAO} style={{fill:'var(--d2-vach-3)'}} transform="translate(0 40)"/>
    <path d={DAO} style={{fill:'var(--d2-vach-2)'}} transform="translate(0 31)"/>
    <path d={DAO} fill="url(#d2-vach)" transform="translate(0 22)"/>
    <path d={DAO} style={{fill:'var(--d2-vach-1)'}} transform="translate(0 12)"/>
    <path d={DAO} style={{fill:'var(--d2-vach-1)'}} transform="translate(0 5)"/>
    {[[10,.35],[18,.3],[27,.28],[36,.25]].map(([dy,o])=><path key={dy} d={DAO} fill="none" stroke={`rgba(50,26,30,${o})`} strokeWidth="1.4" transform={`translate(0 ${dy})`}/>)}
    <path d={DAO} fill="none" stroke="rgba(255,236,200,.35)" strokeWidth="1" transform="translate(0 13)"/>
    <path d={DAO} fill="url(#d2-co)"/>
    <g clipPath="url(#d2-cat)">
     <g filter="url(#d2-mo)">{VUNG.map((v,i)=>{const [cx,cy,rx,ry]=v.c;return <ellipse key={i} cx={cx} cy={cy} rx={rx} ry={ry} style={{fill:`var(${TONE[i]})`}} opacity={i<vung.length?TONE_OP[i]:TONE_OP[i]!*.5}/>})}</g>
     <path d="M204 76 C198 150 214 200 200 250 C188 300 206 350 200 390 M36 248 C110 236 160 262 200 250 C250 238 300 256 368 244" fill="none" stroke="rgba(255,255,240,.28)" strokeWidth="1.5" strokeDasharray="2 6" strokeLinecap="round"/>
     <path d={DAO} fill="url(#d2-hao)"/>
     {CAY.map(([x,y,k])=>k<.72
      ?<g key={`${x}-${y}`} className="dao2-3d-cay" style={kieu({'--d':`${(-k*4).toFixed(1)}s`})}><ellipse cx={x+3} cy={y+2} rx="7" ry="2.6" fill="rgba(20,50,30,.3)"/><rect x={x-1.2} y={y-6} width="2.4" height="7" style={{fill:'var(--d2-vach-2)'}}/><circle cx={x} cy={y-10} r={6+k*3} style={{fill:'var(--d2-co-3)'}}/><circle cx={x-2} cy={y-12} r={3.4+k*2} style={{fill:'var(--d2-co-2)'}}/></g>
      :<g key={`${x}-${y}`}><ellipse cx={x} cy={y} rx="6" ry="4" style={{fill:'var(--d2-vach-1)'}}/><ellipse cx={x-1} cy={y-1.4} rx="3.5" ry="1.8" fill="rgba(255,255,255,.35)"/></g>)}
    </g>
    <path d={DAO} fill="none" stroke="url(#d2-vien)" strokeWidth="3"/>
    {/* đền + cờ ở vùng thành thạo (vùng % cao nhất trước) */}
    {thuTu.slice(0,soDen).map(i=>{const [x,y]=DEN[i]!;return <g key={i} className="dao2-bd-den" data-vung={i}>
     <ellipse cx={x+3} cy={y+3} rx="15" ry="4" fill="rgba(20,40,30,.35)"/>
     <rect x={x-11} y={y-4} width="22" height="6" rx="1" fill="rgb(240,226,200)"/><rect x={x-11} y={y+1} width="22" height="3" fill="rgb(190,160,120)"/>
     {[-7,0,7].map(o=><rect key={o} x={x+o-1.3} y={y-15} width="2.6" height="11" fill="rgb(255,248,230)"/>)}
     <path d={`M${x-14} ${y-15} L${x} ${y-25} L${x+14} ${y-15} Z`} fill="rgb(214,70,60)"/><path d={`M${x-14} ${y-15} L${x} ${y-25} L${x} ${y-15} Z`} fill="rgb(240,110,90)"/>
     <rect x={x-.8} y={y-44} width="1.6" height="20" fill="rgb(120,80,50)"/><path className="dao2-3d-co" d={`M${x+.8} ${y-44} l14 4 -14 5 z`} fill="rgb(255,196,46)"/></g>})}
    {/* sương mù: mỗi vùng đục theo % THẬT của vùng; vùng chưa có số + lõi đảo theo Cọ xát chung */}
    <g className="dao2-bd-suong" clipPath="url(#d2-cat)" data-so={damSuong}>
     {SUONG.map((dam,i)=>{const la=i===VUNG.length,tl=!la&&vung[i]?vung[i]!.tiLe/100:tiLeChung,op=doDucSuong(tl)
      return <g key={i} className="dao2-bd-suong-vung" data-vung={la?'loi':i} data-duc={op.toFixed(2)} opacity={op.toFixed(2)}>
       {op>0&&dam.map((e,k)=><ellipse key={k} className="dao2-3d-cuon" cx={e.cx} cy={e.cy} rx={e.rx} ry={e.ry} fill="url(#d2-suong-g)" style={kieu({'--t':`${e.t}s`,'--d':`${e.d}s`})}/>)}</g>})}
    </g>
    {/* đường ải phát sáng + 6 mốc */}
    <path d={DUONG} fill="none" stroke="rgba(90,60,20,.35)" strokeWidth="9" strokeLinecap="round" transform="translate(0 2)"/>
    <path d={DUONG} fill="none" stroke="rgb(240,214,160)" strokeWidth="7" strokeLinecap="round"/>
    <path d={DUONG} fill="none" style={{stroke:'var(--d2-duong-sang)'}} strokeWidth="6" strokeLinecap="round" filter="url(#d2-sang)" opacity={nut.length?.8:.35}/>
    <path d={DUONG} className="dao2-3d-duong" fill="none" stroke="rgb(255,255,240)" strokeWidth="2.2" strokeLinecap="round" opacity={nut.length?1:.4}/>
    {nut.map((c,i)=>{const vai=docVai(c.vai),[x,y]=viTri(i),kq=ketQua.find(k=>k.qid===c.qid)
     return <NutDuong key={c.qid} vai={vai} x={x} y={y} trang={kq?(kq.correct?'dung':'sai'):'cho'} hien={i===hien&&!kq}/>})}
   </svg>
   <img className="dao2-bd-thu" src={anhThu} alt={`Thần thú của em: ${tenThu}`} width="70" height="70" decoding="async" draggable={false} style={pt(choThu[0],choThu[1])}/>
   {vung.length>0&&<ul className="dao2-bd-vung" aria-label="Vùng đất theo dạng bài">{vung.slice(0,VUNG.length).map((v,i)=>{const [x,y,neo]=VUNG[i]!.n
    const viTriNhan:CSSProperties=neo==='trai'?{left:`${(x-VB.x)/VB.w*100}%`,top:`${(y-VB.y)/VB.h*100}%`}:{right:`${(VB.x+VB.w-x)/VB.w*100}%`,top:`${(y-VB.y)/VB.h*100}%`}
    return <li key={v.ten} className="dao2-kinh" data-sang={v.tiLe>=60?'':undefined} style={viTriNhan} aria-label={`Vùng ${v.ten}: ${v.tiLe}% câu làm đúng ở lần gần nhất (${v.dung}/${v.daLam} câu)`}>{v.ten} · <b>{v.tiLe}%</b></li>})}</ul>}
  </div>
 </>
}

function NutDuong({vai,x,y,trang,hien}:{vai:ReturnType<typeof docVai>;x:number;y:number;trang:string;hien:boolean}){
 const trum=vai==='trum',r=trum?17:11
 return <g className="dao2-bd-nut" data-vai={vai??undefined} data-trang={trang} data-hien={hien?'':undefined}>
  <ellipse cx={x} cy={y+r*.55} rx={r*1.05} ry={r*.42} fill="rgba(40,20,10,.35)"/>
  {hien&&<circle cx={x} cy={y} r={r+4} className="dao2-bd-nhip"/>}
  {trum&&<circle cx={x} cy={y} r={r+6} className="dao2-bd-hao-trum" filter="url(#d2-sang)"/>}
  <circle cx={x} cy={y+2.5} r={r} fill="rgba(60,30,30,.45)"/>
  <circle cx={x} cy={y} r={r} className="dao2-bd-nut-tron"/>
  <ellipse cx={x-r*.3} cy={y-r*.4} rx={r*.45} ry={r*.25} fill="rgba(255,255,255,.45)"/>
  {trang==='dung'?<path d={`M${x-4.5} ${y} l3 3.5 6 -7`} className="dao2-bd-nut-ky" fill="none"/>
  :trang==='sai'?<path d={`M${x-3.5} ${y-3.5} l7 7 M${x+3.5} ${y-3.5} l-7 7`} className="dao2-bd-nut-ky" fill="none"/>
  :null}
  {trum?<path d={`M${x-9} ${y+5} l2 -10 4.5 4.5 2.5 -7 2.5 7 4.5 -4.5 2 10 z`} className="dao2-bd-vuong-mien" opacity={trang==='cho'?1:.35}/>
  :trang!=='cho'?null:vai==='on_lai'?<path d={`M${x-4.5} ${y} a4.5 4.5 0 1 1 4.5 4.5`} className="dao2-bd-nut-ky" fill="none"/>
  :<path d={`M${x} ${y-5.5} l3.2 5.5 -3.2 5.5 -3.2 -5.5 z`} className="dao2-bd-nut-kim"/>}
 </g>
}
