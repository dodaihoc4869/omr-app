// Tìm trên toàn kho đã phân trước khi dựng meta/trạng thái; không bỏ các cổng phát câu chung.
import type { Env } from './kieu'
import { docMetaCau,docHoSo2 } from './srs2-d1'
import type { ChienDich,HoSo2 } from './srs2-d1'
import type { MucKyNang } from './hanh-trinh-v5-loi'
import { danhMuc } from './hanh-trinh-v5-d1'
import { timUngVienToanKho } from './hanh-trinh-v6-loi'
import { SQL_HANH_TRINH_V5 } from './hanh-trinh-v5-schema'
import { protectedQuestions } from './game-v2-bank'
import { docCauNghiDem,chanMetaKhacKhoi,docKhoiEmCong } from './chan-khac-khoi'
import { SQL_TC } from './lam-lai-so'
import { tachSongSinh } from './loi-hoc-luat'
import { chayDdlMotLan } from './ddl-mot-lan'
export async function ungVienV6(env:Env,cd:ChienDich,sbd:string,ngay:string,phamVi:HoSo2['phamVi'],cu:readonly string[]):Promise<string[]> {
  await chayDdlMotLan(env,'hanh_trinh_v5',SQL_HANH_TRINH_V5)
  const [ds,saved,history,protectedIds,suspect]=await Promise.all([
    danhMuc(env,{chienDich:cd,phamVi},Date.now()),
    // Kèm nguồn đang giao vào lần đọc hồ sơ có sẵn; không thêm vòng D1 khi mở lại.
    env.DB.prepare(`SELECT m.muc_json,p.dao_json,p.doan_json,n.du_phong_json FROM (SELECT 1) seed
     LEFT JOIN (SELECT muc_json FROM hanh_trinh_v5_muc WHERE sbd=? ORDER BY cap_nhat_luc DESC LIMIT 1) m ON 1=1
     LEFT JOIN srs2_ke_hoach p ON p.sbd=? AND p.ngay=?
     LEFT JOIN hanh_trinh_nguon_cau n ON n.sbd=? AND n.ngay=?`).bind(sbd,sbd,ngay,sbd,ngay)
     .first<{muc_json:string;dao_json:string;doan_json:string;du_phong_json:string}>()
     .catch(()=>env.DB.prepare('SELECT muc_json FROM hanh_trinh_v5_muc WHERE sbd=? ORDER BY cap_nhat_luc DESC LIMIT 1').bind(sbd).first<{muc_json:string;dao_json?:string;doan_json?:string;du_phong_json?:string}>()),
    env.DB.prepare(`SELECT DISTINCT qid,${SQL_TC} tc FROM su_kien_hoc WHERE sbd=?`).bind(sbd).all<{qid:string;tc:string}>(),
    protectedQuestions(env),docCauNghiDem(env),
  ])
  let rows:MucKyNang[]=[];try{const raw=JSON.parse(saved?.muc_json??'[]') as unknown;if(Array.isArray(raw))rows=raw.filter((r):r is MucKyNang=>!!r&&typeof r.vkn==='string'&&Number.isInteger(r.tang)&&['vung','chua_vung','chua_du'].includes(r.trangThai))}catch{/* Học sinh mới: tìm nền và chẩn đoán. */}
  const seen=new Set(history.results.map(r=>tachSongSinh(r.tc||r.qid).goc)),groups=new Set([...seen,...ds.filter(c=>seen.has(c.qid)).map(c=>c.q.contentGroup||c.qid)])
  const allowed=new Set(cd.qids)
  let roots:string[]=[];try{roots=[...JSON.parse(saved?.dao_json??'[]'),...JSON.parse(saved?.doan_json??'[]'),...JSON.parse(saved?.du_phong_json??'[]')].filter((id):id is string=>typeof id==='string').map(id=>tachSongSinh(id.replace(/#\d+$/,'')).goc)}catch{/* kế hoạch hỏng không mở rộng quyền */}
  return timUngVienToanKho(ds.filter(c=>allowed.has(c.qid)),new Map(rows.map(r=>[`${r.vkn}@L${r.tang}`,r])),[...cu,...roots].filter(id=>allowed.has(id)),ngay,sbd,groups,new Set([...protectedIds,...suspect]))
}

/** Chỉ khi shortlist thiếu: dùng quyền hiện tại trên toàn kho, nạp metadata theo trang.
 * Câu đã gặp cũng đi qua bộ dựng trạng thái chuẩn để xét lịch ôn, không tự suy rằng đã gặp là đã thạo.
 */
export async function boSungV6(env:Env,sbd:string,ngay:string,hs:HoSo2,ds:readonly {qid:string;nhom:string;moi:boolean;hoc:boolean}[],chan:ReadonlySet<string>):Promise<HoSo2|null>{
  const khoi=await docKhoiEmCong(env,sbd),ids=new Set(hs.chienDich!.qids),groups=new Set(hs.cau.map(c=>hs.meta.get(c.qid)?.group||c.qid));let added=0
  const candidates=ds.filter(c=>!chan.has(c.qid)&&!chan.has(c.nhom))
  for(let i=0;i<candidates.length;i+=384){
    const page=candidates.slice(i,i+384),meta=await docMetaCau(env,page.map(c=>c.qid),hs.chienDich!.maDe)
    await chanMetaKhacKhoi(env,'hanh_trinh_v6_bo_sung',khoi,meta)
    for(const c of page){if(!meta.has(c.qid)||meta.get(c.qid)!.tuLuan||groups.has(c.nhom))continue;groups.add(c.nhom);ids.add(c.qid);added++}
  }
  if(!added)return null
  return docHoSo2(env,sbd,ngay,undefined,undefined,undefined,[...ids])
}
