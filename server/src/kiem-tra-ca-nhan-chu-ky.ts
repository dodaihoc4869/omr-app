import { bamKt,congNgayKt,type MucKt } from './kiem-tra-ca-nhan-loi'
import type { CauNguonKt } from './kiem-tra-ca-nhan-nguon'

/** Chặng tối đa 6 câu, đúng thứ tự ba phần; tổng thời gian được chốt đúng 50 phút. */
export function changDe2026(cau:readonly CauNguonKt[]){
 const chang:{qids:string[];giay:number}[]=[],trongSo:number[]=[]
 for(const phan of ['I','II','III']){const ds=cau.filter(c=>c.q.phan===phan);for(let i=0;i<ds.length;i+=6){const cs=ds.slice(i,i+6);chang.push({qids:cs.map(c=>c.q.qid),giay:0});trongSo.push(cs.reduce((n,c)=>n+c.phut,0))}}
 const tong=trongSo.reduce((a,b)=>a+b,0)
 if(!tong)return chang
 let da=0
 chang.forEach((c,i)=>{c.giay=i===chang.length-1?3000-da:Math.max(1,Math.floor(3000*trongSo[i]!/tong));da+=c.giay})
 return chang
}
export function dongGoiDe2026(a:{ngay:string;qids:string[];nguon:readonly CauNguonKt[];muc:readonly MucKt[];viKyNang:readonly MucKt[];anhXa:ReadonlyMap<string,string>;bai:{khoa:string;ten:string}[];thieu:string[];soDe:number;lan:number;chuKyPhu:number;seed:string;lyDo:string}){
 const kho=new Map(a.nguon.map(c=>[c.q.qid,c])),cau=a.qids.map(id=>{const c=kho.get(id);if(!c)throw new Error('Thiếu nguồn câu khi chốt đề.');return {...c,muc:[...new Set(c.muc.map(id=>a.anhXa.get(id)??id))],y:Object.fromEntries(Object.entries(c.y).map(([y,ms])=>[y,[...new Set(ms.map(id=>a.anhXa.get(id)??id))]]))}}).sort((c,d)=>c.q.phan.localeCompare(d.q.phan)||bamKt(a.seed+c.q.qid)-bamKt(a.seed+d.q.qid))
 const ids=new Set(cau.flatMap(c=>c.muc)),kn=a.muc.filter(m=>m.loai!=='bai'),ngay=congNgayKt(a.ngay,(a.lan-1)*(a.soDe===3?2:3))
 return {ngay,de:{phienBan:3 as const,baiNgayToiThieu:12,lyDo:a.soDe>1?`${a.lyDo} · Bài kiểm tra ${a.lan}/${a.soDe} trong tuần`:a.lyDo,bai:a.bai,muc:[...a.muc],viKyNang:[...a.viKyNang],cau,soPhu:cau.length,phut:50,thieu:a.thieu,chang:changDe2026(cau),chuKyNgay:a.ngay,lanTrongChuKy:a.lan,soLanTuan:a.soDe,phuKienThuc:kn.filter(m=>ids.has(m.id)).length,phuChuKy:a.chuKyPhu,khung:'hoa-2026-phan-tich-v1'}}
}
