import type { Env } from './kieu'
import { coGoi7, damBaoGoi7, dongBoGoi7, SQL_LUOT_GOI7 } from './goi-bai-7'
import { lyDoChua7, diemConDungNguon7, type CauGoi7 } from './goi-bai-7-loi'
import { docCauTheoRef, loiCauDoi } from './game-v2-bank'
type Row = Record<string,unknown>
const s = (x: unknown) => String(x ?? '')

/** Được gọi SAU cổng mật khẩu giáo viên ở index; không dùng lại SBD từ khách làm danh tính. */
export async function gvGoi7(env: Env,b: Row): Promise<Record<string,unknown>> {
  const co = await coGoi7(env)
  if (!co.bat) return {ok:true,bat:false,goi:[]}
  await damBaoGoi7(env)
  if(!b.action)await dongBoGoi7(env,Date.now(),100,s(b.lop))
  if (b.action==='dong_bo') return {ok:true,...await dongBoGoi7(env,Date.now(),100)}
  if(b.action==='chi_tiet') {
    const r=await env.DB.prepare('SELECT meta_json FROM goi_bai_7_cau WHERE goi_id=? AND qid=?').bind(s(b.goiId),s(b.qid)).first<{meta_json:string}>()
    const q=r?await docCauTheoRef(env,JSON.parse(r.meta_json) as CauGoi7):null
    if(!q)throw loiCauDoi()
    return {ok:true,cau:q}
  }
  if (b.action==='chua') {
    let loiGo=s(b.loiGo).trim()
    const goi=s(b.goiId),qid=s(b.qid),version=s(b.version)
    const c=await env.DB.prepare('SELECT version,meta_json FROM goi_bai_7_cau WHERE goi_id=? AND qid=?').bind(goi,qid).first<{version:string;meta_json:string}>()
    if (!c || c.version!==version) throw new Error('Câu đã thay đổi. Thầy cập nhật lại danh sách.')
    const q=await docCauTheoRef(env,JSON.parse(c.meta_json) as CauGoi7)
    if(!q)throw loiCauDoi()
    if(b.dungLoiGiaiSan===true) {
      if(!q.solution)throw new Error('Câu chưa có lời giải. Thầy bổ sung phần chữa.')
      loiGo='@loi-giai-goc'
    }else if (loiGo.length<10 || loiGo.length>20000) throw new Error('Thầy ghi phần giải thích cách làm trước khi lưu bài chữa.')
    await env.DB.prepare(`INSERT INTO goi_bai_7_chua(goi_id,qid,version,loi_go,luc) VALUES(?,?,?,?,?)
      ON CONFLICT(goi_id,qid,version) DO UPDATE SET loi_go=excluded.loi_go,luc=excluded.luc`).bind(goi,qid,version,loiGo,new Date().toISOString()).run()
    return {ok:true,daLuu:true}
  }
  const goi=await env.DB.prepare(`SELECT g.* FROM goi_bai_7 g JOIN bai_da_day b ON b.id=g.tick_id AND b.bo_tick_luc IS NULL WHERE (?='' OR g.lop=?) ORDER BY g.bat_dau DESC,g.ten`).bind(s(b.lop),s(b.lop)).all<Row>()
  const id=goi.results.some(g=>g.id===b.goiId)?s(b.goiId):s(goi.results[0]?.id)
  if (!id || !goi.results.some(g=>g.id===id)) return {ok:true,bat:true,goi:goi.results,cau:[],em:[]}
  const [cauRows,emRows,gap,events,chua,pv,kiem]=await Promise.all([
    env.DB.prepare('SELECT * FROM goi_bai_7_cau WHERE goi_id=?').bind(id).all<Row>(),
    env.DB.prepare(`SELECT e.sbd,h.ho_ten,e.bat_dau,e.han FROM goi_bai_7_em e JOIN hoc_sinh h ON h.sbd=e.sbd JOIN goi_bai_7 g ON g.id=e.goi_id AND g.lop=h.lop WHERE e.goi_id=?`).bind(id).all<Row>(),
    env.DB.prepare('SELECT sbd,qid,version,kieu FROM goi_bai_7_gap WHERE goi_id=?').bind(id).all<Row>(),
    env.DB.prepare(`SELECT sbd,qid,json_extract(raw_json,'$.ht_cau_version') cau_version,ket_qua,assistance,luc,received_at,EXISTS(SELECT 1 FROM loi_giai_hoi l WHERE l.sbd=su_kien_hoc.sbd AND l.qid=su_kien_hoc.qid AND julianday(l.luc)<julianday(su_kien_hoc.luc) AND julianday(l.luc)>=julianday(su_kien_hoc.luc)-0.5) da_xem FROM su_kien_hoc WHERE sbd IN (SELECT sbd FROM goi_bai_7_em WHERE goi_id=?)
      AND qid IN (SELECT qid FROM goi_bai_7_cau WHERE goi_id=?) AND ${SQL_LUOT_GOI7} ORDER BY received_at,khoa`).bind(id,id).all<Row>(),
    env.DB.prepare('SELECT qid,version,loi_go,luc FROM goi_bai_7_chua WHERE goi_id=?').bind(id).all<Row>(),
    env.DB.prepare('SELECT sbd,vkn_id,trang_thai FROM omni_p_vkn WHERE sbd IN (SELECT sbd FROM goi_bai_7_em WHERE goi_id=?)').bind(id).all<Row>(),
    env.DB.prepare('SELECT sbd,ma_de,diem,nop_luc,json FROM goi_bai_7_kiem WHERE goi_id=? AND nop_luc IS NOT NULL ORDER BY nop_luc').bind(id).all<Row>(),
  ])
  const ds=cauRows.results.map(r=>JSON.parse(s(r.meta_json)) as CauGoi7),ver=new Map(ds.map(q=>[q.qid,q.version]))
  const nhan=new Map<string,Set<string>>(),tuLam=new Map<string,Set<string>>(),first=new Map<string,Row>(),last=new Map<string,Row>()
  const add=(map:Map<string,Set<string>>,sbd:string,qid:string)=>{const set=map.get(sbd)??new Set<string>();set.add(qid);map.set(sbd,set)}
  for(const e of events.results){
    if(s(e.cau_version)!==ver.get(s(e.qid)) || e.ket_qua===null)continue
    add(nhan,s(e.sbd),s(e.qid))
    if(e.da_xem || e.assistance && e.assistance!=='none')continue
    add(tuLam,s(e.sbd),s(e.qid));const k=`${s(e.sbd)}|${s(e.qid)}`
    if(!first.has(k))first.set(k,e);last.set(k,e)
  }
  for(const e of gap.results)if(s(e.version)===ver.get(s(e.qid)))add(nhan,s(e.sbd),s(e.qid))
  const kyNang=[...new Set(ds.flatMap(q=>q.kyNang))],states=new Map(pv.results.map(r=>[`${s(r.sbd)}|${s(r.vkn_id)}`,r.trang_thai]))
  const em=emRows.results.map(e=>{
    const sbd=s(e.sbd),daGap=nhan.get(sbd)?.size??0,dat=kyNang.filter(k=>states.get(`${sbd}|${k}`)==='dat').length
    const diem=new Map<string,Row>();for(const k of kiem.results)if(k.sbd===sbd&&diemConDungNguon7((JSON.parse(s(k.json)) as Row).cau,ds.filter(c=>(c.maTo??c.maDe)===k.ma_de)))diem.set(s(k.ma_de),k)
    return {sbd,ten:s(e.ho_ten),han:s(e.han),tong:ds.length,daGap,tuLam:tuLam.get(sbd)?.size??0,con:ds.length-daGap,
      kyNang:{tong:kyNang.length,dat,tyLe:kyNang.length?Math.round(1000*dat/kyNang.length)/10:null},
      diem:[...diem.values()].map(k=>({maDe:s(k.ma_de),diem:Number(k.diem),luc:s(k.nop_luc)}))}
  })
  const cau=ds.map(q=>{
    const doan=[...first.values()].filter(e=>e.qid===q.qid),sai=doan.filter(e=>e.ket_qua===0).length
    const daChua=chua.results.find(c=>c.qid===q.qid&&c.version===q.version)
    const chuaGap=em.filter(e=>!nhan.get(e.sbd)?.has(q.qid)).map(e=>({sbd:e.sbd,ten:e.ten}))
    const canKiem=em.filter(e=>last.get(`${e.sbd}|${q.qid}`)?.ket_qua!==1).map(e=>({sbd:e.sbd,ten:e.ten}))
    const choChua=em.filter(e=>gap.results.some(r=>r.sbd===e.sbd&&r.qid===q.qid&&r.version===q.version&&r.kieu==='cho_thay')&&!gap.results.some(r=>r.sbd===e.sbd&&r.qid===q.qid&&r.version===q.version&&r.kieu==='co_ho_tro')).map(e=>({sbd:e.sbd,ten:e.ten}))
    return {...q,lyDo:lyDoChua7(q,doan.length,sai),daDo:doan.length,sai,daChua:!!daChua,loiGo:s(daChua?.loi_go),chuaGap,canKiem,choChua}
  }).sort((a,b)=>Number(b.choChua.length>0&&!b.daChua)-Number(a.choChua.length>0&&!a.daChua)||Number(b.lyDo.length>0)-Number(a.lyDo.length>0)||Number(a.daChua)-Number(b.daChua)||b.sai-a.sai||a.qid.localeCompare(b.qid))
  return {ok:true,bat:true,goi:goi.results,goiId:id,cau,em,canChua:cau.filter(c=>(c.lyDo.length||c.choChua.length)&&!c.daChua).length,
    canGap:em.filter(e=>e.con>0).length,soCau:ds.length,soEm:em.length}
}
