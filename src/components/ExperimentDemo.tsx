import {memo,useEffect,useState} from 'react'
import {htmlMinhHoaNhe,coCanhMinhHoa,experimentCanReplaceImage,napBangCanh,bangCanhDaNap} from '../lib/experiments/nhe'
// MÁY YẾU (29/09): catalog cảnh thí nghiệm (≈ 77 KB) KHÔNG nằm trong mảnh chính nữa — chỉ khi gặp câu có cảnh mới nạp
// (một lần, rồi vẽ đồng bộ cho mọi câu sau). Hai minh hoạ đã duyệt (NO₂ / Rutherford) vẫn vẽ ngay. Câu không có minh hoạ ⇒ null như cũ.
// Gói C 15/10: bảng tra "câu nào có cảnh" (expanded.ts) cũng nạp lười — thẻ câu đầu tiên gọi nạp, các thẻ sau đọc bảng đã có.
type BoVe=(text:string)=>string
let boVeCanh:BoVe|null=null
let dangNap:Promise<BoVe>|null=null
/** Nạp bộ vẽ cảnh (catalog + scene) cùng bảng tra cảnh. Gọi nhiều lần chỉ tải một lần; lỗi mạng ⇒ lần sau thử lại. */
export function napCanhThiNghiem():Promise<BoVe>{
 if(boVeCanh&&bangCanhDaNap())return Promise.resolve(boVeCanh)
 return dangNap??=Promise.all([import('../lib/experiments/render'),napBangCanh()]).then(([m])=>(boVeCanh=m.experimentHtml)).catch(e=>{dangNap=null;throw e})
}
function CanhThiNghiem({text}:{text:string}){
 const [ve,setVe]=useState<BoVe|null>(()=>boVeCanh)
 useEffect(()=>{if(ve)return;let huy=false;napCanhThiNghiem().then(f=>{if(!huy)setVe(()=>f)},()=>{});return()=>{huy=true}},[ve])
 const html=ve?ve(text):'';return html?<div dangerouslySetInnerHTML={{__html:html}}/>:null
}
// memo (máy yếu 29/09): prop duy nhất là chuỗi đề ⇒ thẻ câu vẽ lại (chọn đáp án, lưu tạm) mà đề không đổi thì khỏi băm lại đề.
export default memo(function ExperimentDemo({text}:{text?:string}){
 const t=text??''
 const [bang,setBang]=useState(bangCanhDaNap)
 useEffect(()=>{if(bang)return;let huy=false;napBangCanh().then(b=>{if(!huy)setBang(()=>b)},()=>{});return()=>{huy=true}},[bang])
 if(coCanhMinhHoa(t,bang))return <CanhThiNghiem text={t}/>
 const html=htmlMinhHoaNhe(t);return html?<div dangerouslySetInnerHTML={{__html:html}}/>:null
})
export function ExperimentOriginal({text,children,hasImages=true}:{text?:string;hasImages?:boolean;children:import('react').ReactNode}){return hasImages&&experimentCanReplaceImage(text??'')?<details className="ex-original"><summary>Xem hình gốc của đề</summary>{children}</details>:<>{children}</>}
