// Hành trình v6: chưa đo khác đã yếu; chẩn đoán có ngân sách riêng trong sàn ngày.
import type { QCau, HoSoOmniEm } from './omni-kieu'
import type { MucKyNang, NhanHanhTrinh, TienQuyetCau } from './hanh-trinh-v5-loi'
import { thieuTheoCau, daDatMuc } from './hanh-trinh-v5-loi'
import { vknCaCau } from './omni-p-vkn'
export const PHIEN_BAN_HT6='ht6-0910-v1'
export type QuyenCau='hoc'|'chan_doan'|'sua_nen'
export function quyenCau(q:QCau,t:number,m:ReadonlyMap<string,MucKyNang>,hs:HoSoOmniEm,nhan:NhanHanhTrinh|null):{quyen:QuyenCau;thieu:TienQuyetCau[]} {
  const thieu=thieuTheoCau(q,t,m,hs,nhan)
  if(!thieu.length)return {quyen:'hoc',thieu}
  const yeu=thieu.some(p=>p.vkn.startsWith('nen:')
    ?hs.vkn[p.vkn]?.trangThai==='chua_vung'||hs.vkn[p.vkn]?.dayLai===true
    :m.get(`${p.vkn}@L${p.tang}`)?.trangThai==='chua_vung')
  // Chỉ thử khi thiếu bằng chứng; nền đã yếu hoặc câu tổng hợp quá nhiều đích phải sửa trước.
  const dich=nhan?.dich??vknCaCau(q).filter(k=>!k.startsWith('nen:'))
  return {quyen:yeu||new Set(dich).size>2?'sua_nen':'chan_doan',thieu}
}
export interface UngVienToanKho { qid:string;q:QCau;tang:number;nhan:NhanHanhTrinh|null }
/** Quét toàn danh mục nhẹ, ưu tiên đúng nền đang mở đường; chỉ nạp nội dung của tập ngắn cuối.
 * Hồ sơ lưu chỉ định hướng tìm kiếm, quyết định giao vẫn dùng hồ sơ mới trong động cơ.
 */
export function timUngVienToanKho(ds:readonly UngVienToanKho[],m:ReadonlyMap<string,MucKyNang>,da:readonly string[],ngay:string,sbd:string,daGap:ReadonlySet<string>=new Set(),chan:ReadonlySet<string>=new Set()):string[] {
  const need=new Map<string,Set<string>>()
  for(const c of ds)if(c.tang>1){const ps=c.nhan?.tienQuyet??vknCaCau(c.q).flatMap(vkn=>Array.from({length:vkn.startsWith('nen:')?1:c.tang-1},(_,i)=>({vkn,tang:i+1})));for(const p of ps)if(!daDatMuc(p.vkn,p.tang,m)){const set=need.get(p.vkn)??new Set<string>();for(const k of c.nhan?.dich??vknCaCau(c.q))set.add(`${k}@L${c.tang}`);need.set(p.vkn,set)}}
  const rank=(c:UngVienToanKho)=>{
    const kn=c.nhan?.dich??vknCaCau(c.q),parents=c.nhan?.tienQuyet??(c.tang>1?kn.flatMap(vkn=>Array.from({length:vkn.startsWith('nen:')?1:c.tang-1},(_,i)=>({vkn,tang:i+1}))):[])
    const ready=parents.every(p=>daDatMuc(p.vkn,p.tang,m))
    const weak=parents.some(p=>m.get(`${p.vkn}@L${p.tang}`)?.trangThai==='chua_vung')
    return (daGap.has(c.q.contentGroup||c.qid)||daGap.has(c.qid)?-100:0)+(ready?10:weak?-10:0)+Math.max(0,...kn.map(k=>Math.log1p(need.get(k)?.size??0)))*(c.tang===1?3:1)
  }
  const ranks=new Map(ds.map(c=>[c.qid,rank(c)]))
  const seed=(id:string)=>{let h=2166136261;for(const x of `${sbd}|${ngay}|${id}`)h=Math.imul(h^x.charCodeAt(0),16777619);return h>>>0}
  const out=new Set(da),used=new Set<string>()
  for(const t of [1,2,3,4]){
    let n=0
    for(const c of ds.filter(c=>c.tang===t).sort((a,b)=>ranks.get(b.qid)!-ranks.get(a.qid)!||seed(a.qid)-seed(b.qid)||a.qid.localeCompare(b.qid))){
      const g=c.q.contentGroup||c.qid;if(used.has(g)||chan.has(c.qid)||chan.has(g))continue;used.add(g);out.add(c.qid);if(++n>=96)break
    }
  }
  return [...out]
}
/** Phần mới/ôn/sửa nằm trong tổng còn lại, thích ứng theo số lỗi có thể phục vụ. */
export function phanBoV6(n:number,tang:number,no:number,on:number):{moi:number;on:number;sua:number;chanDoan:number} {
  const sua=Math.min(no,Math.ceil(n*(no>n/2?0.5:0.25)))
  const review=Math.min(on,n-sua,Math.ceil(n*(tang===4?1/6:0.25)))
  return {sua,on:review,moi:Math.max(0,n-sua-review),chanDoan:Math.min(2,Math.floor(n/6)+Number(n>0))}
}
