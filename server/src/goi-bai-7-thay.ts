import type { Env } from './kieu'
import { coGoi7, damBaoGoi7, dongBoGoi7, SQL_LUOT_GOI7, duNguonGoi7, mang7, sqlTenLopHs } from './goi-bai-7'
import { lyDoChua7, diemConDungNguon7, ngayVn7, type CauGoi7 } from './goi-bai-7-loi'
import { docCauTheoRef, loiCauDoi } from './game-v2-bank'
import { tongHopGoi7 } from './goi-bai-7-tong-hop'
type Row = Record<string,unknown>
const s = (x: unknown) => String(x ?? '')

/** Được gọi SAU cổng mật khẩu giáo viên ở index; không dùng lại SBD từ khách làm danh tính. */
export async function gvGoi7(env: Env,b: Row): Promise<Record<string,unknown>> {
  const co = await coGoi7(env)
  if(!co.bat&&['sua_han','sua_han_hang_loat'].includes(s(b.action)))throw new Error('Giao bài đang tạm dừng. Thầy cập nhật rồi sửa hạn sau.')
  if (!co.bat) return {ok:true,bat:false,goi:[],thongKe:{}}
  await damBaoGoi7(env)
  if(b.action==='sua_han')return suaHan(env,b,Date.now())
  if(b.action==='sua_han_hang_loat')return suaHanHangLoat(env,b,Date.now())
  if(b.action==='tong_hop')return tongHopGoi7(env,s(b.lop),b.caCu===true)
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
  const goi=await env.DB.prepare(`SELECT g.*,b.ma_to_json FROM goi_bai_7 g JOIN bai_da_day b ON b.id=g.tick_id AND b.bo_tick_luc IS NULL WHERE (?='' OR g.lop=?) ORDER BY g.bat_dau DESC,g.ten`).bind(s(b.lop),s(b.lop)).all<Row>()
  const id=goi.results.some(g=>g.id===b.goiId)?s(b.goiId):s(goi.results[0]?.id)
  if (!id || !goi.results.some(g=>g.id===id)) return {ok:true,bat:true,goi:goi.results,cau:[],em:[]}
  const [cauRows,emRows,gap,events,chua,pv,kiem]=await Promise.all([
    env.DB.prepare('SELECT * FROM goi_bai_7_cau WHERE goi_id=?').bind(id).all<Row>(),
    env.DB.prepare(`SELECT e.sbd,h.ho_ten,e.bat_dau,e.han FROM goi_bai_7_em e JOIN hoc_sinh h ON h.sbd=e.sbd JOIN goi_bai_7 g ON g.id=e.goi_id AND g.lop=${sqlTenLopHs('h')} WHERE e.goi_id=?`).bind(id).all<Row>(),
    env.DB.prepare('SELECT sbd,qid,version,kieu FROM goi_bai_7_gap WHERE goi_id=?').bind(id).all<Row>(),
    env.DB.prepare(`SELECT sbd,qid,json_extract(raw_json,'$.ht_cau_version') cau_version,ket_qua,assistance,luc,received_at,EXISTS(SELECT 1 FROM loi_giai_hoi l WHERE l.sbd=su_kien_hoc.sbd AND l.qid=su_kien_hoc.qid AND julianday(l.luc)<julianday(su_kien_hoc.luc) AND julianday(l.luc)>=julianday(su_kien_hoc.luc)-0.5) da_xem FROM su_kien_hoc WHERE sbd IN (SELECT sbd FROM goi_bai_7_em WHERE goi_id=?)
      AND qid IN (SELECT qid FROM goi_bai_7_cau WHERE goi_id=?) AND ${SQL_LUOT_GOI7} ORDER BY received_at,khoa`).bind(id,id).all<Row>(),
    env.DB.prepare('SELECT qid,version,loi_go,luc FROM goi_bai_7_chua WHERE goi_id=?').bind(id).all<Row>(),
    env.DB.prepare('SELECT sbd,vkn_id,trang_thai FROM omni_p_vkn WHERE sbd IN (SELECT sbd FROM goi_bai_7_em WHERE goi_id=?)').bind(id).all<Row>(),
    env.DB.prepare('SELECT sbd,ma_de,diem,nop_luc,json FROM goi_bai_7_kiem WHERE goi_id=? AND nop_luc IS NOT NULL ORDER BY nop_luc').bind(id).all<Row>(),
  ])
  const ds=cauRows.results.map(r=>JSON.parse(s(r.meta_json)) as CauGoi7),ver=new Map(ds.map(q=>[q.qid,q.version]))
  const nguonDayDu=ds.length>0&&await duNguonGoi7(env,mang7(goi.results.find(g=>g.id===id)?.ma_to_json))
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
    const sbd=s(e.sbd),daGap=nhan.get(sbd)?.size??0,dat=kyNang.filter(k=>states.get(`${sbd}|${k}`)==='vung').length
    const diem=new Map<string,Row>();for(const k of kiem.results)if(nguonDayDu&&k.sbd===sbd&&diemConDungNguon7((JSON.parse(s(k.json)) as Row).cau,ds.filter(c=>(c.maTo??c.maDe)===k.ma_de)))diem.set(s(k.ma_de),k)
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
  return {ok:true,bat:true,nguonDayDu,goi:goi.results,goiId:id,cau,em,canChua:cau.filter(c=>(c.lyDo.length||c.choChua.length)&&!c.daChua).length,
    canGap:em.filter(e=>e.con>0).length,soCau:ds.length,soEm:em.length}
}

/** Chỉ thay hạn/kế hoạch, không sửa sổ gặp, điểm, phiên làm dở hay lịch kiểm tra đã công bố. */
async function suaHan(env:Env,b:Row,now:number):Promise<Row>{
  const rs=await suaHanCacGoi(env,[{goiId:s(b.goiId),hanCu:s(b.hanCu)}],s(b.han),now)
  return {ok:true,goiId:s(b.goiId),han:s(b.han),...rs}
}

async function suaHanHangLoat(env:Env,b:Row,now:number):Promise<Row>{
  if(!Array.isArray(b.goi)||!b.goi.length||b.goi.length>100)throw new Error('Thầy chọn từ 1 đến 100 bài cần sửa hạn.')
  const goi=b.goi.map((g:unknown)=>{const r=g&&typeof g==='object'?g as Row:{};return {goiId:s(r.goiId),hanCu:s(r.hanCu)}})
  const rs=await suaHanCacGoi(env,goi,s(b.han),now)
  return {ok:true,...rs,ketQua:goi.map(g=>({ok:true,goiId:g.goiId,han:s(b.han)}))}
}

/** Một giao dịch cho mọi lớp: chỉ giành biên nhận khi toàn bộ hạn cũ/tick còn đúng ở chính thời điểm ghi. */
async function suaHanCacGoi(env:Env,goi:{goiId:string;hanCu:string}[],han:string,now:number):Promise<Row>{
  const ngay=ngayVn7(now)
  if(!/^\d{4}-\d{2}-\d{2}$/.test(han)||!Number.isFinite(Date.parse(han))||new Date(han).toISOString().slice(0,10)!==han)throw new Error('Hạn nộp phải là ngày hợp lệ.')
  if(han<ngay)throw new Error('Thầy chọn hạn từ hôm nay trở đi.')
  if(goi.some(g=>!g.goiId||!/^\d{4}-\d{2}-\d{2}$/.test(g.hanCu))||new Set(goi.map(g=>g.goiId)).size!==goi.length)throw new Error('Danh sách bài cần sửa hạn không hợp lệ. Thầy cập nhật lại danh sách.')
  const payload=JSON.stringify(goi),gs=await env.DB.prepare(`SELECT g.id,g.han,g.bat_dau,EXISTS(SELECT 1 FROM ca WHERE trang_thai='mo') ca_mo
    FROM goi_bai_7 g JOIN bai_da_day b ON b.id=g.tick_id AND b.bo_tick_luc IS NULL WHERE g.id IN(SELECT json_extract(value,'$.goiId') FROM json_each(?))`).bind(payload).all<Row>()
  if(gs.results.length!==goi.length)throw new Error('Bài không còn được tick. Thầy cập nhật lại danh sách.')
  const theoId=new Map(gs.results.map(g=>[s(g.id),g]))
  if(goi.some(g=>g.hanCu!==s(theoId.get(g.goiId)?.han)))throw new Error('Hạn đã được sửa ở máy khác. Thầy cập nhật lại danh sách.')
  if(gs.results.some(g=>han<s(g.bat_dau)))throw new Error('Hạn nộp phải từ ngày bắt đầu bài trở đi.')
  if(gs.results.some(g=>g.ca_mo))throw new Error('Đang có ca kiểm tra mở. Thầy sửa hạn sau khi ca kết thúc.')
  const doi=goi.filter(g=>han!==g.hanCu)
  if(!doi.length)return {daDoi:false}
  const receipt=crypto.randomUUID(),luc=new Date(now).toISOString(),ids=JSON.stringify(doi.map(g=>`${receipt}:${g.goiId}`))
  const daChot='SELECT goi_id FROM goi_bai_7_sua_han WHERE id IN(SELECT value FROM json_each(?))'
  // Kiểm mọi bài (kể cả bài giữ nguyên hạn) trong INSERT đầu. Ca mở hoặc một CAS sai ⇒ không bài nào nhận receipt, các UPDATE/DELETE đều rỗng.
  const rs=await env.DB.batch([
    env.DB.prepare(`INSERT INTO goi_bai_7_sua_han(id,goi_id,han_cu,han_moi,luc)
      SELECT ?||':'||g.id,g.id,g.han,?,? FROM goi_bai_7 g JOIN json_each(?) r ON g.id=json_extract(r.value,'$.goiId') WHERE g.han<>?
      AND NOT EXISTS(SELECT 1 FROM ca WHERE trang_thai='mo') AND NOT EXISTS(
        SELECT 1 FROM json_each(?) v LEFT JOIN goi_bai_7 n ON n.id=json_extract(v.value,'$.goiId')
        LEFT JOIN bai_da_day b ON b.id=n.tick_id AND b.bo_tick_luc IS NULL
        WHERE n.id IS NULL OR b.id IS NULL OR n.han<>json_extract(v.value,'$.hanCu') OR n.bat_dau>?)`).bind(receipt,han,luc,payload,han,payload,han),
    env.DB.prepare(`UPDATE goi_bai_7 SET han=? WHERE id IN(${daChot})`).bind(han,ids),
    env.DB.prepare(`UPDATE goi_bai_7_em SET han=? WHERE goi_id IN(${daChot})`).bind(han,ids),
    // Đây là số kế hoạch tính sẵn, không phải bài đã làm. Lượt đọc tiếp theo tính lại theo từng em và lịch kiểm tra thực tế.
    env.DB.prepare(`DELETE FROM goi_bai_7_ngay WHERE ngay>=? AND goi_id IN(${daChot})`).bind(ngay,ids),
    env.DB.prepare(`DELETE FROM goi_bai_7_muc_ngay WHERE ngay>=? AND sbd IN(SELECT sbd FROM goi_bai_7_em WHERE goi_id IN(${daChot}))`).bind(ngay,ids),
  ])
  if(Number(rs[0]?.meta.changes)!==doi.length)throw new Error('Hạn vừa thay đổi hoặc có ca kiểm tra mở. Thầy cập nhật rồi thử lại.')
  return {daDoi:true,tuDongTinhLai:true}
}
