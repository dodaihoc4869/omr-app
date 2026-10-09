// Đồ thị tầng của vi kỹ năng. Cạnh curriculum từ nhãn Q; cạnh học từ dữ liệu chỉ dùng xếp ưu tiên.
import type { HoSoOmniEm, QCau } from './omni-kieu'
import { vknCaCau } from './omni-p-vkn'
import { buocSprtPhatLai, trangThaiSprt } from './omni-sprt'
import type { QuanSatHanhTrinh } from './hanh-trinh-quan-sat'
export const tangViKyNang=(m:string|null):number => ({NB:1,biet:1,TH:2,hieu:2,VD:3,van_dung:3,VDC:4}[m??''] ?? 0)
export interface CanhHoc { tu:string; den:string; nCo:number; dungCo:number; nChua:number; dungChua:number; soEm?:number }
export interface DoThiHanhTrinh { diem:Map<string,number>; canh:CanhHoc[] }
const node=(k:string,t:number)=>`${k}@L${t}`
export function dungDoThi(qs:readonly QuanSatHanhTrinh[], now:number):DoThiHanhTrinh {
  const diem=new Map<string,number>(), canh=new Map<string,CanhHoc>(), da=new Set<string>()
  for(const o of qs) {
    const t=tangViKyNang(o.mucDo)
    if(!t) continue
    // Chỉ cạnh có quan hệ nền → kỹ năng ngay trong câu, không all-pairs/bịa kiến thức.
    if(o.luc>=now-60*86400000) for(const tu of o.kn.filter(k=>k.startsWith('nen:'))) for(const den of o.kn.filter(k=>!k.startsWith('nen:'))) {
      const key=`${tu}|${den}`, demKey=`${key}|${o.nhom}|${o.ngay}`
      if(da.has(demKey)) continue
      da.add(demKey)
      const c=canh.get(key) ?? {tu,den,nCo:0,dungCo:0,nChua:0,dungChua:0}
      const vung=trangThaiSprt(diem.get(node(tu,1))??0)==='vung'
      if(vung) {c.nCo++; c.dungCo+=Number(o.dung)} else {c.nChua++;c.dungChua+=Number(o.dung)}
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
