// Bát Linh: painted island with live progress overlays. Scenery is decorative;
// fog, earned temples, stage outcomes and companion position use server data.
// No canvas, device-orientation listener or permanent animation loop.
import {useId, type CSSProperties} from 'react'
import type {BattleAnswer} from '../learning-battle'
import {docVai} from './dao2-core'
import type {CauDao2,Vung} from './dao2-core'

type Diem=readonly [number,number]
export const VB={x:0,y:0,w:400,h:500} as const
export const pt=(x:number,y:number):CSSProperties=>({left:`${(x-VB.x)/VB.w*100}%`,top:`${(y-VB.y)/VB.h*100}%`})
// Centres of the six stone terraces in public/bat-linh/ban-do-dao.webp.
export const NUT:readonly Diem[]=[[124,282],[184,243],[232,282],[266,204],[282,150],[326,99]]
const DAU_DUONG:Diem=[122,388]
const VUNG:readonly {c:readonly [number,number,number,number];n:readonly [number,number,'trai'|'phai']}[]=[
 {c:[90,110,85,70],n:[14,86,'trai']},{c:[316,88,78,65],n:[386,53,'phai']},
 {c:[80,238,72,82],n:[14,211,'trai']},{c:[328,276,74,80],n:[386,325,'phai']},
 {c:[114,388,85,75],n:[14,451,'trai']},{c:[306,390,85,70],n:[386,471,'phai']}]
const DEN:readonly Diem[]=[[137,147],[366,133],[57,266],[343,335],[161,416],[302,426]]
export const doDucSuong=(tiLe:number)=>Math.max(0,Math.min(1,1-tiLe*1.08))

export interface CanhDao3DProps{
 vung:readonly Vung[]
 coXat:number;tong:number;thanhThao:number;damSuong:number
 cau:readonly CauDao2[]|null;ketQua:readonly BattleAnswer[]
 anhThu:string;tenThu:string
}

export default function CanhDao3D({vung,coXat,tong,thanhThao,damSuong,cau,ketQua,anhThu,tenThu}:CanhDao3DProps){
 const id=useId(),suong=`${id}-suong`,ngoc=`${id}-ngoc`
 const tiLeChung=tong>0?Math.max(0,Math.min(1,coXat/tong)):0
 const soDen=thanhThao>0&&tong>0?Math.min(DEN.length,Math.ceil(DEN.length*thanhThao/tong)):0
 const thuTu=VUNG.map((_,i)=>i).sort((a,b)=>(vung[b]?.tiLe??-1)-(vung[a]?.tiLe??-1)||a-b)
 const nut=(cau??[]).slice(0,NUT.length)
 const viTri=(i:number):Diem=>i===nut.length-1&&docVai(nut[i]?.vai)==='trum'?NUT[5]!:NUT[i]!
 const hien=nut.length?Math.min(ketQua.length,nut.length-1):-1
 const choThu=hien>=0?viTri(hien):DAU_DUONG
 const duong=NUT.map(([x,y],i)=>`${i?'L':'M'}${x} ${y}`).join(' ')
 return <div className="dao2-3d-dao bl-dao-son-thuy">
  <picture className="bl-dao-tranh" aria-hidden="true">
   <source media="(max-width:600px)" srcSet="/bat-linh/ban-do-dao-nho.webp"/>
   <img src="/bat-linh/ban-do-dao.webp" width="1122" height="1402" alt="" decoding="async"/>
  </picture>
  <svg className="dao2-bd-svg" viewBox="0 0 400 500" aria-hidden="true">
   <defs>
    <radialGradient id={suong}><stop offset="0" stopColor="rgb(243,249,235)" stopOpacity=".82"/><stop offset=".55" stopColor="rgb(226,243,228)" stopOpacity=".6"/><stop offset="1" stopColor="rgb(226,243,228)" stopOpacity="0"/></radialGradient>
    <linearGradient id={ngoc} x1="0" y1="0" x2="1" y2="1"><stop stopColor="rgb(69,164,138)"/><stop offset="1" stopColor="rgb(17,75,65)"/></linearGradient>
   </defs>
   <g className="dao2-bd-suong" data-so={damSuong}>
    {[...VUNG.map(v=>v.c),[200,255,120,110] as const].map(([cx,cy,rx,ry],i)=>{
     const loi=i===VUNG.length,tl=!loi&&vung[i]?vung[i]!.tiLe/100:tiLeChung,op=doDucSuong(tl)
     return <g key={i} className="dao2-bd-suong-vung" data-vung={loi?'loi':i} data-duc={op.toFixed(2)} opacity={op.toFixed(2)}>
      {op>0&&<><ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#${suong})`}/><ellipse cx={cx-12} cy={cy+10} rx={rx*.75} ry={ry*.6} fill={`url(#${suong})`}/></>}
     </g>
    })}
   </g>
   {/* Earned miniature temples, separate from the decorative gateway in the art. */}
   {thuTu.slice(0,soDen).map(i=>{const [x,y]=DEN[i]!;return <g key={i} className="dao2-bd-den" data-vung={i} transform={`translate(${x} ${y})`}>
    <ellipse cy="4" rx="16" ry="5" fill="rgb(14 64 52 / .35)"/>
    <rect x="-12" y="-2" width="24" height="6" rx="2" fill="rgb(235 217 171)"/>
    <path d="M-8 -3v-13M0 -3v-13M8 -3v-13" stroke="rgb(255 242 203)" strokeWidth="3"/>
    <path d="M-17 -15Q-10 -12 0 -24Q10 -12 17 -15L12 -10H-12Z" fill={`url(#${ngoc})`} stroke="rgb(247 209 112)" strokeWidth="1.5"/>
    <path d="M0 -25v-12l13 4-13 4" fill="rgb(252 203 83)" stroke="rgb(141 97 30)"/>
   </g>})}
   <path d={duong} className="bl-dao-duong-bong" fill="none" stroke="rgb(71 69 35 / .45)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/>
   <path d={duong} className="bl-dao-duong" fill="none" stroke="rgb(255 237 176)" strokeWidth="3" strokeDasharray="2 6" strokeLinecap="round" strokeLinejoin="round"/>
   {nut.map((c,i)=>{const vai=docVai(c.vai),[x,y]=viTri(i),kq=ketQua.find(k=>k.qid===c.qid),trang=kq?(kq.correct?'dung':'sai'):'cho',hienTai=i===hien&&!kq,trum=vai==='trum',r=trum?19:14
    return <g key={c.qid} className="dao2-bd-nut" data-vai={vai??undefined} data-trang={trang} data-hien={hienTai?'':undefined}>
     <ellipse cx={x} cy={y+9} rx={r+4} ry="6" fill="rgb(19 52 37 / .4)"/>
     {hienTai&&<circle cx={x} cy={y} r={r+7} className="bl-dao-hien" fill="rgb(255 233 159 / .25)" stroke="rgb(255 242 191)" strokeWidth="1.5"/>}
     <circle cx={x} cy={y} r={r} className="dao2-bd-nut-tron"/>
     <circle cx={x} cy={y} r={r-3} fill="none" stroke="rgb(255 235 183 / .6)" strokeWidth=".8"/>
     {trang==='dung'?<path d={`M${x-5} ${y}l3.5 4 7-8`} className="dao2-bd-nut-ky" fill="none"/>
     :trang==='sai'?<path d={`M${x-4} ${y-4}l8 8M${x+4} ${y-4}l-8 8`} className="dao2-bd-nut-ky" fill="none"/>
     :trum?<path d={`M${x-9} ${y+5}l2-10 4.5 4.5 2.5-7 2.5 7 4.5-4.5 2 10z`} className="dao2-bd-vuong-mien"/>
     :<text x={x} y={y+.5} className="bl-dao-so-ai" textAnchor="middle" dominantBaseline="middle">{i+1}</text>}
    </g>
   })}
  </svg>
  <img className="dao2-bd-thu" src={anhThu} alt={`Thần thú của em: ${tenThu}`} width="96" height="96" decoding="async" draggable={false} style={pt(choThu[0],choThu[1])}/>
  {vung.length>0&&<ul className="dao2-bd-vung" aria-label="Vùng đất theo dạng bài">{vung.slice(0,VUNG.length).map((v,i)=>{const [x,y,neo]=VUNG[i]!.n
   const viTriNhan:CSSProperties=neo==='trai'?pt(x,y):{right:`${(VB.w-x)/VB.w*100}%`,top:`${y/VB.h*100}%`}
   return <li key={v.ten} className="dao2-kinh" data-sang={v.tiLe>=60?'':undefined} style={viTriNhan} aria-label={`Vùng ${v.ten}: ${v.tiLe}% câu làm đúng ở lần gần nhất (${v.dung}/${v.daLam} câu)`}>{v.ten} · <b>{v.tiLe}%</b></li>
  })}</ul>}
 </div>
}
