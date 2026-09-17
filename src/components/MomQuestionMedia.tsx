import ExperimentDemo from './ExperimentDemo'
import {ChemText} from '../lib/chem-format'
import {BangSoLieu,CauHinh} from './QuestionMedia'
import {tachDongTheoY} from '../lib/tach-dong-cau'

type Q=Record<string,any>
/** Kho dùng src, bản game cũ dùng url, phiếu dùng hinh: đọc cả ba, không đổi đề gốc. */
export function momImages(q:Q):{src:string;viTri:string;alt?:string}[]{
 const raw=Array.isArray(q.hinhAnh)?q.hinhAnh:Array.isArray(q.hinh)?q.hinh:Array.isArray(q.soDo)?q.soDo:Array.isArray(q.so_do)?q.so_do:Array.isArray(q.anh)?q.anh:[]
 const ketQua = raw.map((h:any)=>({src:String(h?.src||h?.url||(typeof h==='string'?h:'')||''),viTri:String(h?.viTri||'sau_de'),alt:h?.alt})).filter(h=>h.src.trim())
 if (typeof q.soDo === 'string' && q.soDo.trim() && !ketQua.some(h => h.src === q.soDo)) {
   ketQua.push({ src: q.soDo.trim(), viTri: 'sau_de', alt: 'Sơ đồ thí nghiệm' })
 }
 if (typeof q.so_do === 'string' && q.so_do.trim() && !ketQua.some(h => h.src === q.so_do)) {
   ketQua.push({ src: q.so_do.trim(), viTri: 'sau_de', alt: 'Sơ đồ thí nghiệm' })
 }
 return ketQua
}
export function MomImagesAt({q,position}:{q:Q;position:string}){
 return <>{momImages(q).filter(h=>h.viTri===position).map((h,i)=><CauHinh key={i} src={h.src} alt={h.alt||`Hình ${position} ${i+1}`}/>)}</>
}
export function MomQuestionStem({q}:{q:Q}){
 const crop=q.thanCauImg||q.anhThanCau
 const attachment=q.imageDataUrl
 const formattedText = tachDongTheoY(q.text||q.cau||q.de||'')
 return <div className="min-w-0 space-y-2 break-words">
 {crop?<CauHinh src={crop} alt="Đề bài gốc"/>:<div style={{ whiteSpace: 'pre-line' }}><ChemText text={formattedText}/></div>}
 <ExperimentDemo text={formattedText}/>
 {(q.table||q.bang)?.length>0&&<BangSoLieu table={q.table||q.bang}/>}
 {attachment&&attachment!==crop&&<CauHinh src={attachment} alt="Hình đề bài"/>}
 <MomImagesAt q={q} position="sau_de"/>
 <MomImagesAt q={q} position="cuoi_cau"/>
 </div>
}
export function MomOption({q,index,text,tf=false}:{q:Q;index:number;text:string;tf?:boolean}){
 const src=(tf?q.ideaImgs:q.choiceImgs)?.[index]||q.anhLuaChon?.[index]
 return <span className="block min-w-0 space-y-1 break-words">{src&&<img src={src} alt={`Hình phương án ${index+1}`} className="max-w-full max-h-48 rounded-lg bg-white"/>}<ChemText text={text}/><MomImagesAt q={q} position={tf?`sau_y_${String.fromCharCode(97+index)}`:`sau_pa_${String.fromCharCode(65+index)}`}/></span>
}
