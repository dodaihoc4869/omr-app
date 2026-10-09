// Điểm nối ba cỗ máy: chỉ kế hoạch Hành trình, không đổi chấm điểm/EXP/ca thi.
import type { Env } from './kieu'
import type { HoSo2 } from './srs2-d1'
import { docMetaCau } from './srs2-d1'
import { docSuKienOmni, qCuaCau, damBaoBangOmni } from './omni-d1'
import { phatLaiEm, vknCaCau } from './omni-p-vkn'
import { duBaoDiem, xacSuatDungCau } from './du-bao-diem'
import { msKyVong } from './omni-toc-do'
import { chayDdlMotLan } from './ddl-mot-lan'
import { tangCuaCau } from './hanh-trinh-ngay'
import { quanSatDocLap, chuoiSaiKyNang, type QuanSatHanhTrinh } from './hanh-trinh-quan-sat'
import { fitHalfLife, henHalfLife } from './half-life'
import { dungDoThi, thieuTienQuyet, canhDangHoc, type CanhHoc } from './do-thi-tien-quyet'
import { chonBandit, type BangBandit, type CachCuu } from './bandit'
import type { QCau } from './omni-kieu'
import { SQL_DA_CONG_BO } from './cong-bo-diem'

type Row=Record<string,unknown>
export { SQL_DONG_CO_HANH_TRINH } from './hanh-trinh-dong-co-schema'
import { SQL_DONG_CO_HANH_TRINH } from './hanh-trinh-dong-co-schema'

const KHONG_CA="NOT EXISTS(SELECT 1 FROM ca WHERE trang_thai='mo')"
export interface DongCoHanhTrinh { chan:Set<string>; hen:Map<string,string>; trongSo:Record<string,number>; canThiep?:{qid:string;nhom:string;kn:string;context:string;cach:CachCuu;xacSuat:number}; soQuanSat:number; soHalfLife:number; soCanhHoc:number; p8:number }
/** Receipt dùng chỉ từ sự kiện máy chủ. Không thưởng vì chỉ đã đề nghị hoặc đúng câu can thiệp. */
export function doCanThiep(r:Row,qs:readonly QuanSatHanhTrinh[],firstSeen?:ReadonlyMap<string,number>,used:ReadonlySet<string>=new Set()):{dungLuc:number|null;doLuc:number|null;ketQua:number|null;receipt:string|null} {
  const delivered=qs.find(o=>o.qid===r.qid && o.nhom===r.nhom && o.luc>=Number(r.goi_luc))
  if(!delivered) return {dungLuc:null,doLuc:null,ketQua:null,receipt:null}
  const first=new Map(firstSeen)
  if(!firstSeen) for(const o of qs) first.set(o.nhom,Math.min(first.get(o.nhom)??Infinity,o.luc))
  const after=qs.find(o=>first.get(o.nhom)===o.luc && !used.has(`${o.nhom}|${o.luc}`) && o.luc>=delivered.luc+86400000 && o.luc<=delivered.luc+14*86400000 && o.nhom!==delivered.nhom && o.kn.includes(String(r.ky_nang)))
  const dung=after?qs.filter(o=>o.nhom===after.nhom && o.luc===after.luc && o.kn.includes(String(r.ky_nang))).every(o=>o.dung):null
  return {dungLuc:delivered.luc,doLuc:after?.luc??null,ketQua:dung===null?null:Number(dung),receipt:after?`${after.nhom}|${after.luc}`:null}
}
export function phanBoCanThiep(rs:readonly Row[],qs:readonly QuanSatHanhTrinh[],first:ReadonlyMap<string,number>,daDung:ReadonlySet<string>=new Set()) {
  const used=new Set(daDung)
  return rs.slice().sort((a,b)=>Number(b.goi_luc)-Number(a.goi_luc) || String(a.ngay).localeCompare(String(b.ngay)) || Number(b.moc)-Number(a.moc)).map(r=>{
    const d=doCanThiep(r,qs,first,used);if(d.receipt) used.add(d.receipt);return {r,d}
  }).filter(x=>x.d.dungLuc!==null)
}

export async function dongCoHanhTrinh(env:Env,sbd:string,now:number,hs:HoSo2,chan:ReadonlySet<string>=new Set(),ghi=true):Promise<DongCoHanhTrinh> {
  await chayDdlMotLan(env,'hanh_trinh_v4',SQL_DONG_CO_HANH_TRINH)
  const [so,allowed,xacNhan]=await Promise.all([docSuKienOmni(env,[sbd]),
    env.DB.prepare(`SELECT khoa FROM su_kien_hoc WHERE sbd=? AND COALESCE(visibility,'')<>'embargoed' AND (nguon<>'thi' OR EXISTS(SELECT 1 FROM ca c WHERE c.ma_ca=su_kien_hoc.ma_nguon AND c.trang_thai<>'da_xoa' AND ${SQL_DA_CONG_BO('c')})) AND (nguon<>'luyen' OR EXISTS(SELECT 1 FROM luyen_de_2026 ld WHERE ld.id=su_kien_hoc.ma_nguon AND ld.sbd=su_kien_hoc.sbd AND ld.status='submitted'))`).bind(sbd).all<{khoa:string}>(),
    env.DB.prepare('SELECT sbd,ma_dang AS maDang,ket,luc FROM omni_xac_nhan WHERE sbd=? AND luc<=?').bind(sbd,new Date(now).toISOString()).all<import('./omni-kieu').XacNhanThay>()])
  const hopLe=new Set(allowed.results.map(r=>r.khoa))
  const events=(so.get(sbd)??[]).filter(e=>hopLe.has(e.khoa) && e.receivedAt<=now)
  const ids=[...new Set([...hs.cau.map(c=>c.qid),...events.map(e=>e.qid)])]
  const [rawQ,metaCu]=await Promise.all([qCuaCau(env,ids),docMetaCau(env,ids.filter(q=>!hs.meta.has(q)))])
  const q=new Map<string,QCau>()
  for(const [id,c] of rawQ) {
    const m=hs.meta.get(id)??metaCu.get(id)
    q.set(id,{...c,mucDo:(m?.sao??0)>=2?'VDC':c.mucDo??(c.vkn.every(k=>k.startsWith('nen:'))?'NB':null)})
  }
  const qs=quanSatDocLap(sbd,events,q,now), graph=dungDoThi(qs,now), memory=fitHalfLife(qs)
  const targets=[...new Set(hs.cau.flatMap(c=>vknCaCau(q.get(c.qid)!)))]
  const [edges,offers,stats,beta,rewards]=await Promise.all([
    env.DB.prepare(`SELECT tu,den,SUM(n_co) nCo,SUM(dung_co) dungCo,SUM(n_chua) nChua,SUM(dung_chua) dungChua,COUNT(DISTINCT sbd) soEm FROM hanh_trinh_v4_canh WHERE den IN (SELECT value FROM json_each(?)) AND cap_nhat_luc>=? AND n_co+n_chua>0 GROUP BY tu,den`).bind(JSON.stringify(targets),now-7*86400000).all<CanhHoc>(),
    env.DB.prepare('SELECT * FROM hanh_trinh_v4_can_thiep WHERE sbd=? AND goi_luc>=? AND do_luc IS NULL ORDER BY goi_luc DESC,ngay DESC,moc DESC LIMIT 96').bind(sbd,now-15*86400000).all<Row>(),
    env.DB.prepare(`SELECT context,cach,SUM(CASE WHEN ket_qua=1 THEN 1 ELSE 0 END) dung,SUM(CASE WHEN ket_qua=0 THEN 1 ELSE 0 END) sai FROM hanh_trinh_v4_can_thiep WHERE do_luc>=? AND ket_qua IS NOT NULL GROUP BY context,cach`).bind(now-90*86400000).all<BangBandit>(),
    env.DB.prepare('SELECT qid,beta FROM omni_beta_cau WHERE qid IN (SELECT value FROM json_each(?))').bind(JSON.stringify(hs.cau.map(c=>c.qid))).all<{qid:string;beta:number}>(),
    env.DB.prepare('SELECT do_receipt FROM hanh_trinh_v4_can_thiep WHERE sbd=? AND do_receipt IS NOT NULL').bind(sbd).all<{do_receipt:string}>(),
  ])
  const learned=canhDangHoc(edges.results??[]), b=new Map((beta.results??[]).map(r=>[r.qid,r.beta]))
  const omni=phatLaiEm(sbd,{suKien:events,q,beta:b,homNay:new Date(now+7*3600000).toISOString().slice(0,10),xacNhan:xacNhan.results})
  const out:DongCoHanhTrinh={chan:new Set(chan),hen:new Map(),trongSo:{},soQuanSat:qs.length,soHalfLife:0,soCanhHoc:learned.length,p8:0}
  for(const c of hs.cau) {
    const qc=q.get(c.qid)!, kn=vknCaCau(qc), t=tangCuaCau(c)
    if(t===null || thieuTienQuyet(qc,t,graph,omni).length) out.chan.add(c.qid)
    const due=henHalfLife(memory,kn)
    if(due) {out.hen.set(c.qid,due);out.soHalfLife++}
    const weakest=Math.min(...kn.map(k=>omni.vkn[k]?.p??0.3)), pc=xacSuatDungCau(omni,qc,omni.sEm)
    const information=Math.exp(-(((pc-0.8)/0.2)**2))
    const soft=learned.filter(e=>kn.includes(e.den) && omni.vkn[e.tu]?.trangThai!=='vung').length
    const minute=Math.max(0.25,msKyVong(b.get(c.qid)??null,omni.tau,qc.phan,qc.mucDo)/60000)
    const point=qc.phan==='II'?1:0.25
    out.trongSo[c.qid]=((1-weakest)+information+(hs.tt.get(c.qid)?.laMoi?0.2:0)-soft*0.1)*point/minute
  }
  // Hai hành động đều là câu thật, chưa gặp, thuộc tầng đã mở. Không rút video/học liệu tưởng tượng.
  const streak=chuoiSaiKyNang(qs),mucKet=(c:typeof hs.cau[number])=>Math.max(...vknCaCau(q.get(c.qid)!).map(k=>streak.get(k)??0))
  const stuck=hs.cau.filter(c=>mucKet(c)>=2).sort((a,b)=>mucKet(b)-mucKet(a) || a.qid.localeCompare(b.qid))
  for(const c of stuck) {
    const kn=vknCaCau(q.get(c.qid)!), weak=kn.filter(k=>(streak.get(k)??0)>=2).sort((a,b)=>(omni.vkn[a]?.p??0.3)-(omni.vkn[b]?.p??0.3))[0]!
    const actions=new Map<CachCuu,typeof hs.cau>()
    for(const x of hs.cau) {
      const tx=tangCuaCau(x),t=tangCuaCau(c),qc=q.get(x.qid)!
      if(!tx || !t || tx>=t || out.chan.has(x.qid) || hs.tt.get(x.qid)?.catTia || !hs.tt.get(x.qid)?.laMoi || !vknCaCau(qc).includes(weak)) continue
      const arm:CachCuu=tx===1?'on_nen':'vi_du_de'
      actions.set(arm,[...(actions.get(arm)??[]),x])
    }
    const context=`${weak.startsWith('nen:')?'nen':'dang'}:${(omni.vkn[weak]?.p??0.3)<0.5?'yeu':'giua'}:L${tangCuaCau(c)}`
    const pick=chonBandit(context,[...actions.keys()],stats.results??[],()=>{const a=new Uint32Array(1);crypto.getRandomValues(a);return (a[0]!+0.5)/4294967296})
    if(!pick) continue
    const chosen=actions.get(pick.cach)!.slice().sort((a,b)=>out.trongSo[b.qid]!-out.trongSo[a.qid]! || a.qid.localeCompare(b.qid))[0]!
    out.canThiep={qid:chosen.qid,nhom:hs.meta.get(chosen.qid)?.group||chosen.qid,kn:weak,context,cach:pick.cach,xacSuat:pick.xacSuat};break
  }
  // Dự báo trên cửa sổ nội dung của em; ghi rõ phạm vi, không coi là xác suất đã hiệu chuẩn của đề thật.
  const scope=hs.cau.filter(c=>c.nguon==='chien_dich').map(c=>q.get(c.qid)!)
  const forecast=duBaoDiem(omni,scope), cursor=omni.cursor
  out.p8=forecast.p8
  if(!ghi) return out
  const firstSeen=new Map<string,number>()
  for(const e of events) {const g=e.contentGroup||q.get(e.qid)?.contentGroup||e.qid;firstSeen.set(g,Math.min(firstSeen.get(g)??Infinity,e.receivedAt))}
  const updates=phanBoCanThiep(offers.results??[],qs,firstSeen,new Set(rewards.results.map(r=>r.do_receipt)))
  const snapshot={halfLife:memory,canh:graph.canh,soQuanSat:qs.length,soHalfLife:out.soHalfLife,soCanhHoc:learned.length,duBao:forecast,phamVi:'ung_vien_ngay',soCau:scope.length}
  const rows=graph.canh.map(c=>({...c,sbd}))
  const old=await env.DB.prepare('SELECT cap_nhat_luc FROM hanh_trinh_v4_em WHERE sbd=?').bind(sbd).first<{cap_nhat_luc:number}>()
  const commands=[
    env.DB.prepare(`UPDATE hanh_trinh_v4_canh SET n_co=0,dung_co=0,n_chua=0,dung_chua=0,cap_nhat_luc=? WHERE sbd=? AND cap_nhat_luc<=? AND ${KHONG_CA}`).bind(now,sbd,Math.min(old?.cap_nhat_luc??now,now)),
    env.DB.prepare(`INSERT INTO hanh_trinh_v4_em SELECT ?,?,?,?,? WHERE ${KHONG_CA} ON CONFLICT(sbd) DO UPDATE SET cursor=excluded.cursor,phien_ban=excluded.phien_ban,mo_hinh_json=excluded.mo_hinh_json,cap_nhat_luc=excluded.cap_nhat_luc WHERE excluded.cap_nhat_luc>=hanh_trinh_v4_em.cap_nhat_luc`).bind(sbd,cursor,'ht4-0910-v1',JSON.stringify(snapshot),now),
    env.DB.prepare(`INSERT INTO hanh_trinh_v4_canh SELECT ?,json_extract(value,'$.tu'),json_extract(value,'$.den'),json_extract(value,'$.nCo'),json_extract(value,'$.dungCo'),json_extract(value,'$.nChua'),json_extract(value,'$.dungChua'),? FROM json_each(?) WHERE ${KHONG_CA} ON CONFLICT(sbd,tu,den) DO UPDATE SET n_co=excluded.n_co,dung_co=excluded.dung_co,n_chua=excluded.n_chua,dung_chua=excluded.dung_chua,cap_nhat_luc=excluded.cap_nhat_luc WHERE excluded.cap_nhat_luc>=hanh_trinh_v4_canh.cap_nhat_luc`).bind(sbd,now,JSON.stringify(rows)),
  ]
  // Tối đa một receipt cho mỗi chặng cũ; không tăng mẫu khi đọc lại hoặc hai thiết bị.
  commands.push(env.DB.prepare(`UPDATE hanh_trinh_v4_can_thiep SET do_receipt=(SELECT json_extract(value,'$.d.receipt') FROM json_each(?1) WHERE json_extract(value,'$.r.ngay')=hanh_trinh_v4_can_thiep.ngay AND json_extract(value,'$.r.moc')=hanh_trinh_v4_can_thiep.moc),dung_luc=(SELECT json_extract(value,'$.d.dungLuc') FROM json_each(?1) WHERE json_extract(value,'$.r.ngay')=hanh_trinh_v4_can_thiep.ngay AND json_extract(value,'$.r.moc')=hanh_trinh_v4_can_thiep.moc),do_luc=(SELECT json_extract(value,'$.d.doLuc') FROM json_each(?1) WHERE json_extract(value,'$.r.ngay')=hanh_trinh_v4_can_thiep.ngay AND json_extract(value,'$.r.moc')=hanh_trinh_v4_can_thiep.moc),ket_qua=(SELECT json_extract(value,'$.d.ketQua') FROM json_each(?1) WHERE json_extract(value,'$.r.ngay')=hanh_trinh_v4_can_thiep.ngay AND json_extract(value,'$.r.moc')=hanh_trinh_v4_can_thiep.moc) WHERE sbd=?2 AND do_luc IS NULL AND EXISTS(SELECT 1 FROM json_each(?1) WHERE json_extract(value,'$.r.ngay')=hanh_trinh_v4_can_thiep.ngay AND json_extract(value,'$.r.moc')=hanh_trinh_v4_can_thiep.moc) AND NOT EXISTS(SELECT 1 FROM hanh_trinh_v4_can_thiep claimed JOIN json_each(?1) u ON json_extract(u.value,'$.r.ngay')=hanh_trinh_v4_can_thiep.ngay AND json_extract(u.value,'$.r.moc')=hanh_trinh_v4_can_thiep.moc AND json_extract(u.value,'$.d.receipt')=claimed.do_receipt WHERE claimed.sbd=hanh_trinh_v4_can_thiep.sbd AND (claimed.ngay<>hanh_trinh_v4_can_thiep.ngay OR claimed.moc<>hanh_trinh_v4_can_thiep.moc)) AND ${KHONG_CA}`).bind(JSON.stringify(updates),sbd))
  await damBaoBangOmni(env)
  commands.push(env.DB.prepare(`INSERT INTO omni_du_bao(sbd,pham_vi,ky_vong,p8,sai_so,s_dung,con_duong,con_thieu_json,so_bang_chung,luc) SELECT ?,?,?,?,?,?,?,?,?,? WHERE ${KHONG_CA} ON CONFLICT(sbd,pham_vi) DO UPDATE SET ky_vong=excluded.ky_vong,p8=excluded.p8,sai_so=excluded.sai_so,s_dung=excluded.s_dung,con_duong=excluded.con_duong,con_thieu_json=excluded.con_thieu_json,so_bang_chung=excluded.so_bang_chung,luc=excluded.luc`).bind(sbd,`${hs.chienDich!.id}:ung_vien_ngay`,forecast.kyVong,forecast.p8,forecast.saiSo,omni.sEm,forecast.conDuong,JSON.stringify(forecast.conThieu),forecast.soBangChung,new Date(now).toISOString()))
  // Gói lớn có trần 30 lệnh; mỗi lệnh tự kiểm ca, không ghi điểm/sổ học.
  for(let i=0;i<commands.length;i+=30) await env.DB.batch(commands.slice(i,i+30))
  return out
}
export function lenhGhiCanThiep(env:Env,sbd:string,ngay:string,moc:number,now:number,d:DongCoHanhTrinh,qids:readonly string[]) {
  const c=d.canThiep
  return c && qids.includes(c.qid)?env.DB.prepare(`INSERT OR IGNORE INTO hanh_trinh_v4_can_thiep(sbd,ngay,moc,qid,nhom,ky_nang,context,cach,xac_suat,goi_luc) SELECT ?,?,?,?,?,?,?,?,?,? WHERE ${KHONG_CA} AND changes()=1`).bind(sbd,ngay,moc,c.qid,c.nhom,c.kn,c.context,c.cach,c.xacSuat,now):null
}
