// Hồi quy half-life phân cấp theo em × kỹ năng; kiểm prequential trên lượt CHƯA học.
import { fsrs, createEmptyCard, type Card } from 'ts-fsrs'
import { CAU_HINH_FSRS } from './lich-on-fsrs'
import type { QuanSatHanhTrinh } from './hanh-trinh-quan-sat'
const NGAY = 86400000, LN2 = Math.LN2
const kep = (x:number,a:number,b:number) => Math.max(a,Math.min(b,x))
export interface TriNhoHalfLife { doLech: number; n: number; nDo: number; loss: number; lossFsrs: number; lucCuoi: number; dung: number; sai: number; card: Card }
export interface MoHinhHalfLife { em: number; kyNang: Record<string,TriNhoHalfLife> }
export const xacSuatNho = (ngay:number,h:number) => 2 ** (-Math.max(0,ngay)/Math.max(0.125,h))
export function halfLife(m:MoHinhHalfLife,k:string):number { return 2**kep(1+m.em+(m.kyNang[k]?.doLech ?? 0),-3,10) }
const logLoss = (p:number,y:boolean) => -Math.log(y?kep(p,0.001,0.999):1-kep(p,0.001,0.999))
export function fitHalfLife(qs:readonly QuanSatHanhTrinh[]):MoHinhHalfLife {
  const m:MoHinhHalfLife={em:0,kyNang:{}}, scheduler=fsrs(CAU_HINH_FSRS)
  const cau=new Map<string,QuanSatHanhTrinh>()
  for(const o of qs) { const key=`${o.nhom}|${o.luc}`,cu=cau.get(key); cau.set(key,cu?{...cu,dung:cu.dung && o.dung,kn:[...new Set([...cu.kn,...o.kn])]}:o) }
  for(const o of cau.values()) for(const k of o.kn) {
    let c=m.kyNang[k]
    if(c && o.luc<=c.lucCuoi) continue // Cùng lượt/ý không tăng trí nhớ của một kỹ năng lần nữa.
    if(!c) { c={doLech:0,n:0,nDo:0,loss:0,lossFsrs:0,lucCuoi:o.luc,dung:0,sai:0,card:createEmptyCard(new Date(o.luc))}; m.kyNang[k]=c }
    const dt=(o.luc-c.lucCuoi)/NGAY
    if(dt>=0.5) {
      const h=halfLife(m,k), p=xacSuatNho(dt,h)
      // Chấm dự đoán TRƯỚC cập nhật; đủ quan sát mới so với FSRS cùng sổ.
      if(c.n>=4) { c.nDo++; c.loss+=logLoss(p,o.dung); c.lossFsrs+=logLoss(scheduler.get_retrievability(c.card,new Date(o.luc),false),o.dung) }
      const grad=kep((p-Number(o.dung))*LN2*LN2*dt/h/Math.max(0.01,1-p),-2,2)
      const rate=0.15/Math.sqrt(1+c.n/10)
      m.em=kep(m.em-rate*grad/o.kn.length-0.001*m.em,-2,4)
      c.doLech=kep(c.doLech-rate*grad-0.002*c.doLech,-3,6)
    }
    c.card=scheduler.next(c.card,new Date(o.luc),o.dung?3:1).card
    c.n++; c.lucCuoi=o.luc; if(o.dung) c.dung++; else c.sai++
  }
  return m
}
/** Dữ liệu ít/mô hình chưa thắng thì vẫn dùng lịch FSRS; không thay bằng đường quên chưa kiểm. */
export function henHalfLife(m:MoHinhHalfLife,kn:readonly string[], retention=0.9):string|null {
  if(!kn.length) return null
  const ds=kn.map(k=>m.kyNang[k])
  if(ds.some(c=>!c || c.nDo<8 || c.loss>c.lossFsrs)) return null
  const luc=Math.min(...kn.map(k=>m.kyNang[k]!.lucCuoi+(-Math.log2(retention))*halfLife(m,k)*NGAY))
  return new Date(luc+7*3600000).toISOString().slice(0,10)
}
