// Hiệu chuẩn từ dự đoán TRƯỚC khi giao câu; hold-out theo học sinh, không học từ điểm sau rồi giả làm điểm trước.
export interface MauV6 { sbd:string;qid:string;version?:string;lop:string;tang:number;phan:string;p:number;y:number;luc:number;features:number[];transfer:number|null;prop:number }
export interface DoKhoV6 { b:number;n:number;kiem:Record<string,{sum:number;n:number}>;tot:boolean }
export interface MoHinhV6 { cau:Record<string,DoKhoV6>;nhom:Record<string,DoKhoV6>;w:number[];nHoc:number;kiemHoc:Record<string,{sum:number;n:number}>;hocTot:boolean;soMau:number }
const kep=(x:number,a:number,b:number)=>Math.max(a,Math.min(b,x))
export const logitV6=(p:number)=>Math.log(kep(p,0.01,0.99)/(1-kep(p,0.01,0.99)))
export const sigmoidV6=(z:number)=>1/(1+Math.exp(-kep(z,-20,20)))
const loss=(p:number,y:number)=>-y*Math.log(kep(p,0.001,0.999))-(1-y)*Math.log(1-kep(p,0.001,0.999))
const hash=(s:string)=>{let h=2166136261;for(const c of s)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0}
export const khoaDoKhoV6=(qid:string,version?:string)=>version?`${qid}|${version}`:qid
const moi=():DoKhoV6=>({b:0,n:0,kiem:{},tot:false})
const PRIOR=[1,0.6,0.2,0.15,0.25,0.1,-0.1]
export function featuresV6(p:number,weak:number,review:number,unlock:number,unknown:boolean,fresh:boolean,support:number):number[]{return [logitV6(p),Math.exp(-(((p-0.8)/0.22)**2))*weak,review,Math.min(1,unlock/8),Number(unknown),Number(fresh),Math.min(1,support/4)]}
function val(ds:Record<string,{sum:number;n:number}>,sbd:string,d:number){const v=ds[sbd]??{sum:0,n:0};v.sum+=d;v.n++;ds[sbd]=v}
/** Sai số theo EM (cluster), tối thiểu 8 em hold-out; không gọi vài lượt cùng em là đủ mẫu. */
export function vuotCongV6(ds:Record<string,{sum:number;n:number}>):boolean {
  const a=Object.values(ds).filter(x=>x.n>0).map(x=>x.sum/x.n);if(a.length<8)return false
  const mean=a.reduce((s,v)=>s+v,0)/a.length,se=Math.sqrt(a.reduce((s,v)=>s+(v-mean)**2,0)/(a.length-1)/a.length)
  return mean>0&&mean>1.645*se
}
const dot=(w:readonly number[],x:readonly number[])=>w.reduce((s,v,i)=>s+v*(x[i]??0),0)
export function fitV6(samples:readonly MauV6[]):MoHinhV6 {
  const m:MoHinhV6={cau:{},nhom:{},w:[...PRIOR],nHoc:0,kiemHoc:{},hocTot:false,soMau:samples.length}
  for(const r of samples.slice().sort((a,b)=>a.luc-b.luc||a.sbd.localeCompare(b.sbd)||a.qid.localeCompare(b.qid))){
    if(!Number.isFinite(r.p)||!Number.isFinite(r.y)||r.y<0||r.y>1)continue
    const hold=hash(r.sbd)%5===0,key=`${r.lop}|${r.tang}|${r.phan}`,bucket=m.nhom[key]??moi(),item=m.cau[khoaDoKhoV6(r.qid,r.version)]??moi();m.nhom[key]=bucket;m.cau[khoaDoKhoV6(r.qid,r.version)]=item
    for(const model of [bucket,item]){
      const p=sigmoidV6(logitV6(r.p)-model.b)
      if(hold){val(model.kiem,r.sbd,loss(r.p,r.y)-loss(p,r.y));continue}
      const shrink=model===item?0.12:0.03,rate=0.08/Math.sqrt(1+model.n/30)
      model.b=kep(model.b-rate*((r.y-p)+shrink*model.b),-2,2);model.n++
    }
    if(r.transfer===null||!Number.isFinite(r.transfer)||r.features.length!==PRIOR.length||r.prop<=0)continue
    const p=sigmoidV6(dot(m.w,r.features)),base=sigmoidV6(dot(PRIOR,r.features))
    if(hold){val(m.kiemHoc,r.sbd,loss(base,r.transfer)-loss(p,r.transfer));continue}
    // Propensity được ghi từ nhánh khám phá thật. Kẹp trọng số để một lượt hiếm không chi phối.
    const importance=Math.min(5,1/Math.max(0.01,r.prop)),rate=0.02/Math.sqrt(1+m.nHoc/100)
    m.w=m.w.map((w,i)=>kep(w-rate*(importance*(p-r.transfer!)*r.features[i]!+0.05*(w-PRIOR[i]!)),-3,3));m.nHoc++
  }
  for(const x of [...Object.values(m.cau),...Object.values(m.nhom)])x.tot=x.n>=20&&vuotCongV6(x.kiem)
  // Chỉ lưu item đã vượt cổng; item ít mẫu được fit lại từ ledger đêm sau, tránh hàng JSON vượt trần D1.
  m.cau=Object.fromEntries(Object.entries(m.cau).filter(([,x])=>x.tot))
  m.hocTot=m.nHoc>=100&&vuotCongV6(m.kiemHoc);return m
}
export function pDoKhoV6(m:MoHinhV6|null,qid:string,lop:string,tang:number,phan:string,p:number,version?:string):number {
  const item=m?.cau[khoaDoKhoV6(qid,version)],bucket=m?.nhom[`${lop}|${tang}|${phan}`],b=item?.tot?item.b:bucket?.tot?bucket.b:0
  return sigmoidV6(logitV6(p)-b)
}
export function giaTriV6(m:MoHinhV6|null,x:number[],p:number,phut:number,point:number,fatigue=0):number {
  const after=sigmoidV6(dot(m?.hocTot?m.w:PRIOR,x)),gain=Math.max(0,after-p)
  return (point*gain+0.05*x[2]!+0.04*x[3]!+0.03*x[4]!)/Math.max(0.25,phut)-Math.max(0,fatigue)*0.03
}
