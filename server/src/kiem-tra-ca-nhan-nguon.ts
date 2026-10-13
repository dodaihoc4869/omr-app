// Nguồn tương đương đã duyệt: chỉ kiến thức nằm trong phạm vi đã dạy, giữ cổng khối/ca/BTVN/công tắc.
import type { Env } from './kieu'
import type { PrivateQuestion } from '../../src/game/than-thu-v2/core'
import { laCauTuLuan } from '../../src/lib/cau-tu-luan'
import { chanKhacKhoiEm } from './chan-khac-khoi'
import { chuanMucDo } from './lich-su-lam-cau'
import type { Khoi } from '../../src/lib/khoi-cau'
import { nhomKienThucKt } from './kiem-tra-ca-nhan-ma-tran'
import { phutCauKt,type MucKt } from './kiem-tra-ca-nhan-loi'
export interface CauNguonKt {q:PrivateQuestion;muc:string[];y:Record<string,string[]>;phut:number}
export async function nguonTuongDuongKt(env:Env,a:{sbd:string;khoi:Khoi|null;muc:readonly MucKt[];can:string[];baoVe:ReadonlySet<string>;btvn:ReadonlySet<string>;blocked:readonly string[];types:readonly string[]}){
  if(!a.can.length)return [] as CauNguonKt[]
  const rows=await env.DB.prepare(`SELECT q.json,q.qid,o.y,o.vkn_json FROM game_v2_question q
    JOIN de_kho d ON d.ma_de=q.ma_de JOIN game_v2_index i ON i.ma_de=d.ma_de AND i.source_version=d.cap_nhat_luc
    JOIN omni_q o ON o.qid=q.qid
    WHERE COALESCE(d.da_xoa,0)=0 AND json_extract(q.json,'$.reviewed')=1
    AND EXISTS(SELECT 1 FROM omni_q p,json_each(p.vkn_json) v WHERE p.qid=q.qid AND v.value IN(SELECT value FROM json_each(?)))
    ORDER BY q.qid,o.y LIMIT 1200`).bind(JSON.stringify(a.can)).all<{json:string;qid:string;y:number;vkn_json:string}>()
  const qs=new Map<string,{q:PrivateQuestion;y:Record<string,string[]>}>()
  for(const r of rows.results){const q=JSON.parse(r.json) as PrivateQuestion;if(!q.reviewed||laCauTuLuan(q)||a.baoVe.has(q.qid)||a.baoVe.has(q.group)||a.btvn.has(q.qid)||a.blocked.includes(q.qid)||(a.types.length&&(!q.dang||!a.types.includes(q.dang))))continue
    const v=qs.get(q.qid)??{q,y:{}};v.y[String(r.y)]=JSON.parse(r.vkn_json) as string[];qs.set(q.qid,v)
  }
  const trongKhoi=new Set((await chanKhacKhoiEm(env,'ktcn-tuong-duong',{sbd:a.sbd,khoiEm:a.khoi},[...qs.values()].map(v=>v.q))).map(q=>q.qid))
  const can=new Set(a.muc.map(m=>m.id)),ra:CauNguonKt[]=[]
  for(const {q,y} of qs.values()){
    if(!trongKhoi.has(q.qid)||!chuanMucDo(q.mucDo))continue
    const raw=[...new Set(Object.values(y).flat())],ms=raw.map(kn=>({id:`kn:${kn}`,kyNang:kn,bai:'',tenBai:'',mucDo:''})),nk=nhomKienThucKt(ms,[],new Map())
    // Không thêm bất kỳ kiến thức chưa học nào để làm đủ đề; mã không hiểu cũng bị chặn.
    if(!nk.muc.length||nk.muc.some(m=>!can.has(m.id)))continue
    ra.push({q,muc:nk.muc.map(m=>m.id),y:Object.fromEntries(Object.entries(y).map(([k,v])=>[k,[...new Set(v.map(kn=>nk.anhXa.get(`kn:${kn}`)!))]])),phut:phutCauKt(q.phan,[])})
  }
  return ra
}
