// Đồ thị tầng của vi kỹ năng. Cạnh curriculum từ nhãn Q; cạnh học từ dữ liệu chỉ dùng xếp ưu tiên.
import type { HoSoOmniEm, QCau } from './omni-kieu'
import { HANG_MUC_DO } from './srs2-loi'
import { vknCaCau } from './omni-p-vkn'
import { buocSprtPhatLai, trangThaiSprt } from './omni-sprt'
import type { QuanSatHanhTrinh } from './hanh-trinh-quan-sat'
export const tangViKyNang=(m:string|null):number => {const t=HANG_MUC_DO[m?.trim()??''];return t===undefined?0:t+1}
export interface CanhHoc { tu:string; den:string; nCo:number; dungCo:number; nChua:number; dungChua:number; soEm?:number }
export interface DoThiHanhTrinh { diem:Map<string,number>; canh:CanhHoc[] }
const node=(k:string,t:number)=>`${k}@L${t}`
export function dungDoThi(qs:readonly QuanSatHanhTrinh[], now:number):DoThiHanhTrinh {
  const diem=new Map<string,number>(), canh=new Map<string,CanhHoc>(), da=new Set<string>()
  const nhom=new Map<string,Map<string,boolean>>(),truoc=new Map<string,Map<string,boolean>>()
  for(const o of qs) {const key=`${o.nhom}|${o.ngay}`,r=nhom.get(key)??new Map<string,boolean>();for(const k of o.kn) r.set(k,(r.get(k)??true)&&o.dung);nhom.set(key,r)}
  for(const o of qs) {
    const groupKey=`${o.nhom}|${o.ngay}`
    if(!truoc.has(groupKey)) truoc.set(groupKey,new Map([...nhom.get(groupKey)!.keys()].filter(k=>k.startsWith('nen:')).map(k=>[k,trangThaiSprt(diem.get(node(k,1))??0)==='vung'])))
    const t=tangViKyNang(o.mucDo)
    if(!t) continue
    // Chỉ cạnh có quan hệ nền → kỹ năng ngay trong câu, không all-pairs/bịa kiến thức.
    if(o.luc>=now-60*86400000) for(const tu of o.kn.filter(k=>k.startsWith('nen:'))) for(const den of o.kn.filter(k=>!k.startsWith('nen:'))) {
      const key=`${tu}|${den}`, demKey=`${key}|${o.nhom}|${o.ngay}`
      if(da.has(demKey)) continue
      da.add(demKey)
      const c=canh.get(key) ?? {tu,den,nCo:0,dungCo:0,nChua:0,dungChua:0}
      const vung=truoc.get(groupKey)!.get(tu)??false,dung=nhom.get(groupKey)!.get(den)??false
      if(vung) {c.nCo++; c.dungCo+=Number(dung)} else {c.nChua++;c.dungChua+=Number(dung)}
      canh.set(key,c)
    }
    for(const k of o.kn) {
      const key=node(k,k.startsWith('nen:')?1:t)
      diem.set(key,buocSprtPhatLai(diem.get(key)??0,o.dung,o.laY))
    }
  }
  return {diem,canh:[...canh.values()]}
}
/** Mọi kỹ năng tiên quyết phải qua SPRT. L1 mở; xác nhận thầy chỉ cho nền, không tự chứng minh mọi tầng. */
export function thieuTienQuyet(q:QCau,tang:number,g:DoThiHanhTrinh,hs:HoSoOmniEm):string[] {
  if(tang<=1) return []
  return vknCaCau(q).filter(k=> {
    if(k.startsWith('nen:')) return hs.vkn[k]?.trangThai!=='vung' || hs.vkn[k]?.dayLai===true
    for(let t=1;t<tang;t++) if(trangThaiSprt(g.diem.get(node(k,t))??0)!=='vung') return true
    return false
  })
}
// Khoảng Wilson: tránh bật cạnh vì 1–2 em; hai cohort có chênh rõ mới dùng.
function wilson(n:number,y:number):[number,number] {
  if(n<=0) return [0,1]
  const z=1.96,p=y/n,d=1+z*z/n,a=(p+z*z/(2*n))/d,b=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/d
  return [a-b,a+b]
}
export function canhDangHoc(ds:readonly CanhHoc[]):CanhHoc[] {
  return ds.filter(c=>c.tu.startsWith('nen:') && !c.den.startsWith('nen:') && (c.soEm??1)>=20 && c.nCo>=30 && c.nChua>=30 && wilson(c.nCo,c.dungCo)[0]>wilson(c.nChua,c.dungChua)[1])
}
