import type { Env } from './kieu'
import { buildTeacherSourceFromKhoDe, parseKhoDeJson } from '../../src/lib/exam-kho-de-import'
import {grade} from '../../src/game/than-thu-v2/core'
import type { Evidence, PrivateQuestion, Question } from '../../src/game/than-thu-v2/core'
type Row=Record<string,unknown>
const str=(v:unknown)=>String(v??'')
export async function hash(v:unknown):Promise<string>{const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(v)));return [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('')}
export async function readJson(env:Env,key:string):Promise<Row>{const r=await env.DE.get(key);if(!r)throw new Error('Nguồn câu hỏi chưa sẵn sàng.');return await new Response(r.body).json() as Row}
export async function normalizeBank(raw:Row,maDe:string):Promise<PrivateQuestion[]> {
  let bank=raw
  if(Array.isArray(raw.cau)){
    const parsed=parseKhoDeJson(raw)
    if(!parsed.json)throw new Error('Kho đề chưa đúng cấu trúc.')
    const built=buildTeacherSourceFromKhoDe(parsed.json)
    if(built.errors.length)throw new Error('Kho đề cần kiểm tra cấu trúc trước khi đưa vào game.')
    bank=built.source as unknown as Row
  }
  if(!['phanI','phanII','phanIII'].some(k=>Array.isArray(bank[k])))throw new Error('Cấu trúc kho chưa được hỗ trợ; chưa dùng vào game.')
  const result:PrivateQuestion[]=[]
  for(const phan of ['I','II','III'] as const){
    const items=bank[`phan${phan}`];if(!Array.isArray(items))continue
    for(const c of items as Row[]){
      const qid=str(c.id??c.qid);if(!qid)continue
      const dang=c.dang as {ma?:string;ten?:string}|undefined
      const correct=Array.isArray(c.correct)?c.correct.join(''):str(c.correct)
      const cc=c.canChua as {sao?:number}|undefined
      const q:PrivateQuestion={qid,maDe,version:'',group:'',phan,text:str(c.text),choices:(c.choices??[]) as string[],ideas:(c.ideas??[]) as string[],
        table:c.table as string[][]|undefined,thanCauImg:c.thanCauImg as string|undefined,imageDataUrl:c.imageDataUrl as string|undefined,
        choiceImgs:c.choiceImgs as string[]|undefined,ideaImgs:c.ideaImgs as string[]|undefined,hinhAnh:(c.hinhAnh??[]) as Question['hinhAnh'],
        dang:dang?.ma??null,tenDang:dang?.ten??'',mucDo:c.mucDo?str(c.mucDo):null,sao:cc?.sao??null,kienThuc:Array.isArray(c.kienThuc)?c.kienThuc as string[]:[],
        correct,solution:c.loiGiai??c.explanation??null,
        reviewed:!c.canXem&&(!c.loiGiaiTrangThai||c.loiGiaiTrangThai==='khop') && (phan==='I'?/^[ABCD]$/.test(correct):phan==='II'?/^[DS]{4}$/.test(correct):correct.trim().length>0)}
      q.group=await contentGroup(q);q.version=crypto.randomUUID();result.push(q)
    }
  }
  return result
}
export async function contentGroup(q:Question):Promise<string>{return hash([q.phan,q.text.trim().replace(/\s+/g,' '),q.choices,q.ideas,q.table??null,q.thanCauImg??null,q.imageDataUrl??null,q.choiceImgs??null,q.ideaImgs??null,q.hinhAnh.filter(h=>h.viTri!=='sau_loi_giai')])}
/** Work is bounded per call; cursor/checkpoints cover the entire bank, not eight sheets. */
export async function syncIndex(env:Env):Promise<{remaining:number;indexed:number}> {
  const pending=await env.DB.prepare(`SELECT d.ma_de,d.r2_khoa,d.cap_nhat_luc FROM de_kho d LEFT JOIN game_v2_index g ON g.ma_de=d.ma_de WHERE COALESCE(d.da_xoa,0)=0 AND (g.ma_de IS NULL OR g.source_version<>d.cap_nhat_luc) ORDER BY d.ma_de LIMIT 3`).all<Row>()
  let indexed=0
  for(const d of pending.results){
    const ma=str(d.ma_de);const qs=await normalizeBank(await readJson(env,str(d.r2_khoa)||`kho/${ma}.json`),ma)
    const stmts=[env.DB.prepare('DELETE FROM game_v2_question WHERE ma_de=?').bind(ma),...qs.map(q=>env.DB.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)').bind(ma,q.qid,q.version,q.group,q.dang,JSON.stringify(q))),env.DB.prepare('INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES(?,?,?) ON CONFLICT(ma_de) DO UPDATE SET source_version=excluded.source_version,indexed_at=excluded.indexed_at').bind(ma,d.cap_nhat_luc,new Date().toISOString())]
    await env.DB.batch(stmts);indexed++
  }
  const n=await env.DB.prepare(`SELECT COUNT(*) n FROM de_kho d LEFT JOIN game_v2_index g ON g.ma_de=d.ma_de WHERE COALESCE(d.da_xoa,0)=0 AND (g.ma_de IS NULL OR g.source_version<>d.cap_nhat_luc)`).first<{n:number}>()
  return {remaining:n?.n??0,indexed}
}
const protectionCache=new Map<string,{fingerprint:string;blocked:Set<string>}>()
export async function protectedQuestions(env:Env):Promise<Set<string>> {
  const now=Date.now()
  const all=await env.DB.prepare(`SELECT ca.ma_ca,ca.bank_r2,ca.cap_nhat_luc,ca.trang_thai,ca.cong_bo,ca.het_han_vao,ca.thoi_gian_phut,ca.loai,ca.han_nop,ca.bat_dau,
    (SELECT COUNT(*) FROM luot l WHERE l.ma_ca=ca.ma_ca) entered,
    (SELECT COUNT(*) FROM luot l WHERE l.ma_ca=ca.ma_ca AND l.trang_thai='da_nop') submitted,
    (SELECT COUNT(*) FROM luot l WHERE l.ma_ca=ca.ma_ca AND l.trang_thai='dang_lam' AND (l.het_gio_luc IS NULL OR l.het_gio_luc>?)) active
    FROM ca WHERE ca.trang_thai<>'da_xoa' ORDER BY ca.ma_ca`).bind(new Date(now).toISOString()).all<Row>()
  const r={results:all.results.filter(ca=>{
    const released=ca.cong_bo==='ngay'||ca.cong_bo==='ca_lop_xong'&&(ca.trang_thai==='dong'||Number(ca.entered)>0&&Number(ca.submitted)>=Number(ca.entered))
    const entryEnd=Date.parse(str(ca.het_han_vao));const homeworkEnd=Date.parse(str(ca.han_nop))
    const end=ca.loai==='baitap'?homeworkEnd:entryEnd+Number(ca.thoi_gian_phut)*60000
    const canStillTest=ca.trang_thai==='mo'&&(!Number.isFinite(end)||end>=now||Number(ca.active)>0||Date.parse(str(ca.bat_dau))>now)
    return !released||canStillTest
  })}
  // Trả BẢN SAO ở mọi lối ra: nơi gọi (game-v2.ts `start`/`resume`/`answer`) `.add()` câu riêng của từng em vào tập này; trả thẳng tập trong đệm là ghi bẩn đệm dùng chung, câu của em A rò sang em B.
  const fingerprint=await hash(r.results);const cached=protectionCache.get('current');if(cached?.fingerprint===fingerprint)return new Set(cached.blocked)
  const blocked=new Set<string>()
  for(const ca of r.results){
    if(!ca.bank_r2)continue
    const bank=await readJson(env,str(ca.bank_r2));const qs=await normalizeBank(bank,'protected')
    if(!qs.length&&['phanI','phanII','phanIII'].some(p=>Array.isArray(bank[p])&&(bank[p] as unknown[]).length))throw new Error('Chưa kiểm tra xong phạm vi đề thi đang bảo vệ.')
    for(const q of qs){blocked.add(q.qid);blocked.add(q.group)}
  }
  protectionCache.set('current',{fingerprint,blocked:new Set(blocked)});return blocked
}
export async function readScope(env:Env,sbd:string,dangLop:readonly string[]=[]):Promise<{evidence:Evidence[];pool:PrivateQuestion[];missing:number}> {
  const rows=await env.DB.prepare(`SELECT c.qid,c.dung_sai,c.ma_ca,c.lan_thu,l.nop_luc FROM chi_tiet_cau c JOIN luot l ON l.ma_ca=c.ma_ca AND l.sbd=c.sbd AND l.lan_thu=c.lan_thu JOIN ca ON ca.ma_ca=c.ma_ca WHERE c.sbd=? AND l.nop_luc IS NOT NULL AND l.trang_thai IN ('da_nop','khoa') AND c.dung_sai IN (0,1) AND ca.trang_thai<>'da_xoa' AND (ca.cong_bo='ngay' OR (ca.cong_bo='ca_lop_xong' AND (ca.trang_thai='dong' OR (EXISTS(SELECT 1 FROM luot lc WHERE lc.ma_ca=ca.ma_ca) AND NOT EXISTS(SELECT 1 FROM luot ln WHERE ln.ma_ca=ca.ma_ca AND ln.trang_thai<>'da_nop'))))) ORDER BY l.nop_luc DESC`).bind(sbd).all<Row>()
  // Recover missing detail rows read-only, using only qids explicitly submitted by this learner.
  // Never fill an incomplete personal paper with the rest of the class bank.
  const completed=await env.DB.prepare(`SELECT l.ma_ca,l.lan_thu,l.nop_luc,l.dap_an_json,ca.bo_theo_em_json FROM luot l JOIN ca ON ca.ma_ca=l.ma_ca WHERE l.sbd=? AND l.nop_luc IS NOT NULL AND l.trang_thai IN ('da_nop','khoa') AND ca.trang_thai<>'da_xoa' AND (ca.cong_bo='ngay' OR (ca.cong_bo='ca_lop_xong' AND (ca.trang_thai='dong' OR (EXISTS(SELECT 1 FROM luot lc WHERE lc.ma_ca=ca.ma_ca) AND NOT EXISTS(SELECT 1 FROM luot ln WHERE ln.ma_ca=ca.ma_ca AND ln.trang_thai<>'da_nop'))))) ORDER BY l.nop_luc DESC`).bind(sbd).all<Row>()
  const knownRows=new Set(rows.results.map(r=>`${r.ma_ca}|${r.lan_thu}|${r.qid}`))
  for(const l of completed.results){
    let answers:Row;let assigned:string[]|null=null
    try{answers=JSON.parse(str(l.dap_an_json)||'{}');const raw=JSON.parse(str(l.bo_theo_em_json)||'null');const list=raw?.bo?.[sbd]??raw?.[sbd];if(Array.isArray(list))assigned=list}catch{continue}
    const keys=['I','II','III'].flatMap(p=>Object.keys((answers[`phan${p}`]??{}) as Row))
    if(!keys.some(qid=>!knownRows.has(`${l.ma_ca}|${l.lan_thu}|${qid}`)))continue
    let bank:PrivateQuestion[];try{bank=await normalizeBank(await readJson(env,`key/${l.ma_ca}.json`),'completed')}catch{continue}
    for(const q of bank){
      const a=(answers[`phan${q.phan}`]??{}) as Row
      if(!Object.prototype.hasOwnProperty.call(a,q.qid)||assigned&&!assigned.includes(q.qid)||!q.reviewed||knownRows.has(`${l.ma_ca}|${l.lan_thu}|${q.qid}`))continue
      const answer=Array.isArray(a[q.qid])?(a[q.qid] as unknown[]).join(''):str(a[q.qid])
      if(!answer.trim()||answer==='----')continue
      rows.results.push({qid:q.qid,ma_ca:l.ma_ca,lan_thu:l.lan_thu,nop_luc:l.nop_luc,dung_sai:grade(q,answer)?1:0})
    }
  }
  // GĐ 5 (Kênh 4): bằng chứng từ HỒ SƠ (nam_kt_cau) cho câu em đã gặp ở nguồn KHÁC ca thi và KHÁC game (BTVN, Mom, ôn lại, khắc phục…): câu sai
  // ở đó thành "weak"; câu làm đúng ở đó thành nền để mở câu cùng dạng. Loại `thi` vì đường ca thi ở trên đã lọc theo công bố (ca chưa công bố KHÔNG được lọt) — TRỪ sự kiện `thi` của ca KHÔNG CÒN trong bảng `ca` (reset toàn app xoá ca, giữ sổ): coi là đã công bố;
  // loại `game` vì game tự có `attempts`. Câu có ở cả hai nơi: HỒ SƠ quyết `wrong` (sai ở thi rồi sửa đúng ở BTVN thì không còn "weak"). Thiếu bảng thì bỏ qua.
  try{
    const rh=await env.DB.prepare(`SELECT qid,trang_thai,luc_cuoi,nguon_cuoi FROM nam_kt_cau WHERE sbd=? AND qid IN (SELECT qid FROM su_kien_hoc s WHERE s.sbd=? AND (s.nguon NOT IN ('thi','game') OR (s.nguon='thi' AND NOT EXISTS (SELECT 1 FROM ca WHERE ca.ma_ca=s.ma_nguon))))`).bind(sbd,sbd).all<Row>()
    const chuaKhacPhuc=(t:unknown)=>t==='moi_sai'||t==='dang_on'
    const hoSo=new Map(rh.results.map(h=>[str(h.qid),h]))
    for(const r of rows.results){const h=hoSo.get(str(r.qid));if(h){r.dung_sai=chuaKhacPhuc(h.trang_thai)?0:1;hoSo.delete(str(r.qid))}}
    for(const h of hoSo.values())rows.results.push({qid:h.qid,ma_ca:str(h.nguon_cuoi),lan_thu:1,nop_luc:str(h.luc_cuoi),dung_sai:chuaKhacPhuc(h.trang_thai)?0:1})
  }catch{/* lược đồ cũ/fixture chưa có bảng hồ sơ: chỉ dùng bằng chứng ca thi như trước */}
  const evidence:Evidence[]=[];let missing=0
  const qids=[...new Set(rows.results.map(r=>str(r.qid)))];const originals=new Map<string,PrivateQuestion>()
  for(let i=0;i<qids.length;i+=80){const ids=qids.slice(i,i+80);const r=await env.DB.prepare(`SELECT q.json FROM game_v2_question q JOIN de_kho d ON d.ma_de=q.ma_de JOIN game_v2_index g ON g.ma_de=d.ma_de AND g.source_version=d.cap_nhat_luc WHERE COALESCE(d.da_xoa,0)=0 AND q.qid IN (${ids.map(()=>'?').join(',')})`).bind(...ids).all<{json:string}>();for(const x of r.results){const q=JSON.parse(x.json) as PrivateQuestion;originals.set(q.qid,q)}}
  for(const r of rows.results){const q=originals.get(str(r.qid));if(!q){missing++;continue}evidence.push({qid:q.qid,group:q.group,dang:q.dang,mucDo:q.mucDo,kienThuc:q.kienThuc,wrong:r.dung_sai===0,date:str(r.nop_luc),ca:str(r.ma_ca)})}
  const types=[...new Set([...evidence.map(e=>e.dang),...dangLop].filter(Boolean))] as string[]/* ĐỢT 2: thêm các dạng LỚP đã học (bảng đệm lop_da_hoc) — kho rút không còn bó theo bằng chứng của CHÍNH em */;const pool=[...originals.values()]
  for(let i=0;i<types.length;i+=60){const ids=types.slice(i,i+60);let after='';for(;;){const r=await env.DB.prepare(`SELECT q.json,q.ma_de||'|'||q.qid cursor FROM game_v2_question q JOIN de_kho d ON d.ma_de=q.ma_de JOIN game_v2_index g ON g.ma_de=d.ma_de AND g.source_version=d.cap_nhat_luc WHERE COALESCE(d.da_xoa,0)=0 AND q.dang IN (${ids.map(()=>'?').join(',')}) AND q.ma_de||'|'||q.qid>? ORDER BY cursor LIMIT 300`).bind(...ids,after).all<{json:string;cursor:string}>();pool.push(...r.results.map(r=>JSON.parse(r.json) as PrivateQuestion));if(r.results.length<300)break;after=r.results[r.results.length-1]!.cursor}}
  return {evidence,pool:[...new Map(pool.map(q=>[q.qid,q])).values()],missing}
}
