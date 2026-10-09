// Bằng chứng chung cho ba máy mới: không học từ hỗ trợ/đọc đáp án/lặp nội dung.
import type { QCau, SuKienOmni } from './omni-kieu'
import { vknCaCau, vknCuaY } from './omni-p-vkn'
export interface QuanSatHanhTrinh { id: string; qid: string; nhom: string; luc: number; ngay: string; dung: boolean; kn: string[]; laY: boolean; mucDo: string | null; ms: number | null }
export function quanSatDocLap(sbd: string, suKien: readonly SuKienOmni[], q: ReadonlyMap<string, QCau>, now: number): QuanSatHanhTrinh[] {
  const da = new Set<string>(), doc = new Map<string, number>(), ra: QuanSatHanhTrinh[] = []
  const ds = suKien.filter(e => e.sbd === sbd && Number.isFinite(e.receivedAt) && e.receivedAt <= now)
    .slice().sort((a,b) => a.receivedAt-b.receivedAt || a.khoa.localeCompare(b.khoa))
  for (const e of ds) {
    const c = q.get(e.qid), nhom = e.contentGroup || c?.contentGroup || e.qid
    if (e.purpose === 'xem_loi_giai' || e.assistance !== 'none') doc.set(nhom, e.receivedAt)
    if (e.purpose === 'xem_loi_giai') continue
    if (!c || (e.ketQua !== 0 && e.ketQua !== 1)) continue
    const key = `${nhom}|${e.ngayVn}`
    if (da.has(key)) continue
    da.add(key) // Đầu ngày có hỗ trợ vẫn ngăn lần làm lại trở thành bằng chứng.
    if (e.assistance !== 'none' || e.tuTin === 'chua_chac' || (doc.has(nhom) && e.receivedAt-doc.get(nhom)! <= 12*3600000)) continue
    if (e.purpose && ['luot','chua_buoc','luyen_nen','shadow','xem_loi_giai'].includes(e.purpose)) continue
    const them = (kn: string[], dung: boolean, laY: boolean, y='') => ra.push({id:e.khoa+y,qid:e.qid,nhom,luc:e.receivedAt,ngay:e.ngayVn,dung,kn:[...new Set(kn)],laY,mucDo:c.mucDo,ms:e.msLam ?? null})
    if (c.phan==='II' && e.y?.length===4) e.y.forEach((v,i) => { if(v===0 || v===1) them(vknCuaY(c,i),v===1,true,`|${i}`) })
    else them(vknCaCau(c),e.ketQua===1,false)
  }
  return ra
}
/** Chuỗi sai của kỹ năng, gộp các ý cùng lượt (một ý sai => kỹ năng ấy sai). */
export function chuoiSaiKyNang(qs:readonly QuanSatHanhTrinh[]):Map<string,number> {
  const luot=new Map<string,Map<string,boolean>>()
  for(const o of qs) {const key=`${o.nhom}|${o.luc}`,kn=luot.get(key)??new Map<string,boolean>();for(const k of o.kn) kn.set(k,(kn.get(k)??true)&&o.dung);luot.set(key,kn)}
  const streak=new Map<string,number>()
  for(const kn of luot.values()) for(const [k,dung] of kn) streak.set(k,dung?0:(streak.get(k)??0)+1)
  return streak
}
