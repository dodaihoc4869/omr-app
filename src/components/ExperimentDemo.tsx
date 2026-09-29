import {useEffect,useState} from 'react'
import {htmlMinhHoaNhe,coCanhMinhHoa,experimentCanReplaceImage} from '../lib/experiments/nhe'
// MÁY YẾU (29/09): catalog cảnh thí nghiệm (≈ 77 KB) KHÔNG nằm trong mảnh chính nữa — chỉ khi gặp câu có cảnh mới nạp
// (một lần, rồi vẽ đồng bộ cho mọi câu sau). Hai minh hoạ đã duyệt (NO₂ / Rutherford) vẫn vẽ ngay. Câu không có minh hoạ ⇒ null như cũ.
type BoVe=(text:string)=>string
let boVeCanh:BoVe|null=null
let dangNap:Promise<BoVe>|null=null
/** Nạp bộ vẽ cảnh (catalog + scene). Gọi nhiều lần chỉ tải một lần; lỗi mạng ⇒ lần sau thử lại. */
export function napCanhThiNghiem():Promise<BoVe>{
 if(boVeCanh)return Promise.resolve(boVeCanh)
 return dangNap??=import('../lib/experiments/render').then(m=>(boVeCanh=m.experimentHtml)).catch(e=>{dangNap=null;throw e})
}
function CanhThiNghiem({text}:{text:string}){
 const [ve,setVe]=useState<BoVe|null>(()=>boVeCanh)
 useEffect(()=>{if(ve)return;let huy=false;napCanhThiNghiem().then(f=>{if(!huy)setVe(()=>f)},()=>{});return()=>{huy=true}},[ve])
 const html=ve?ve(text):'';return html?<div dangerouslySetInnerHTML={{__html:html}}/>:null
}
export default function ExperimentDemo({text}:{text?:string}){const t=text??'';if(coCanhMinhHoa(t))return <CanhThiNghiem text={t}/>;const html=htmlMinhHoaNhe(t);return html?<div dangerouslySetInnerHTML={{__html:html}}/>:null}
export function ExperimentOriginal({text,children,hasImages=true}:{text?:string;hasImages?:boolean;children:import('react').ReactNode}){return hasImages&&experimentCanReplaceImage(text??'')?<details className="ex-original"><summary>Xem hình gốc của đề</summary>{children}</details>:<>{children}</>}
