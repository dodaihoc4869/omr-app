// Đề đo không dùng năng lực hay nhóm A/B để đổi độ khó. Câu neo/độ khó còn ít mẫu được ghi chưa hiệu chuẩn.
import { HANG_MUC_DO } from './srs2-loi'
import {khoaDoKhoV6,type MoHinhV6} from './hanh-trinh-v6-mo-hinh'
import { maTranDo } from './hanh-trinh-do-luong'
type Cau={qid:string;version?:string;phan:string;mucDo:string|null;sao?:number}
const tier=(c:Cau)=>((c.sao??0)>=2?3:HANG_MUC_DO[c.mucDo??'']??({biet:0,hieu:1,van_dung:2} as Record<string,number>)[c.mucDo??'']??0)+1
const hash=(s:string)=>{let h=2166136261;for(const c of s)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0}
/** Trộn cùng khung bốn mức theo từng phần, muối chỉ phân xử câu tương đương. */
export function xepDeV6<T extends Cau>(ds:readonly T[],muoi:string,model:MoHinhV6|null):T[]{
  const out:T[]=[],left=new Map(ds.map(c=>[c.qid,c]))
  for(let i=0;left.size&&i<32;i++){
    const target=i%4+1
    let best:T|null=null,bestDist=Infinity,bestTie=Infinity
    for(const c of left.values()){
      const fit=model?.cau[khoaDoKhoV6(c.qid,c.version)],b=fit?.tot?fit.b:0,dist=Math.abs(tier(c)+b-target),tie=hash(`${muoi}|${c.qid}`)
      if(dist<bestDist||dist===bestDist&&tie<bestTie){best=c;bestDist=dist;bestTie=tie}
    }
    if(!best)break;out.push(best);left.delete(best.qid)
  }
  return [...out,...left.values()]
}
export function maTranV6(ds:readonly Cau[],model:MoHinhV6|null):string{
  const verified=ds.every(c=>model?.cau[khoaDoKhoV6(c.qid,c.version)]?.tot)
  if(!verified)return maTranDo(ds)
  const bins=new Map<string,number>()
  for(const c of ds){const key=`${c.phan}:${Math.round((tier(c)+model!.cau[khoaDoKhoV6(c.qid,c.version)]!.b)*2)/2}`;bins.set(key,(bins.get(key)??0)+1)}
  return JSON.stringify({loai:'do_kho_da_kiem',muc:maTranDo(ds),bins:[...bins].sort(([a],[b])=>a.localeCompare(b))})
}
