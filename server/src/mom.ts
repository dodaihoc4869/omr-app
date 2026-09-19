import type {Env} from './kieu'
import {gameIdentity} from './game-v2-auth'
import {ghiSuKien,suKienChamBai,type CauChamBai} from './su-kien-hoc'

type Question = Record<string, unknown>
type Row = {sbd:string;id:string;title:string;created_at:string;question_count:number;bank_key:string;started_at:string|null;submitted_at:string|null;answers:string;result:string|null}
export function gradeMom(q:Question[], answers:Record<string,string>) {
  // Giữ quy tắc bài khắc phục cũ: mỗi câu đúng trọn vẹn có cùng trọng số.
  const norm=(v:unknown)=>String(v??'').trim().toUpperCase()
  const soCauDung=q.filter((c,i)=>norm(answers[String(c.id||`cau_${i+1}`)])===norm(c.dapAn||c.dapAnDung||'A')).length
  return {soCauDung,diem:Math.round(soCauDung/Math.max(1,q.length)*1000)/100}
}
/** Mã câu THẬT của một bài: `id`/`qid` không rỗng, bỏ `cau_N` (app tự đánh số, không định danh câu nào), khử trùng, giữ thứ tự. */
export function qidCuaBai(q:Question[]):string[]{
  const ra:string[]=[]
  for(const c of q){const v=c?.id??c?.qid;const qid=typeof v==='string'?v.trim():'';if(qid&&!/^cau_\d+$/.test(qid)&&!ra.includes(qid))ra.push(qid)}
  return ra
}
function item(r:Row){return {id:r.id,sbd:r.sbd,tieuDe:r.title,taoLuc:r.created_at,ngayGiao:r.created_at,soCau:r.question_count,thoiGianPhut:120,batDauLuc:r.started_at,nopLuc:r.submitted_at,trangThai:r.submitted_at?'da_nop':r.started_at?'dang_lam':'chua_lam',...(r.result?JSON.parse(r.result):{})}}
async function questions(env:Env,r:Row):Promise<Question[]>{const o=await env.DE.get(r.bank_key);if(!o)throw new Error('Chưa tải được nội dung bài. Vui lòng thử lại.');return await new Response(o.body).json() as Question[]}
export async function mom(env:Env,action:string,b:Record<string,unknown>):Promise<Record<string,unknown>> {
  // Cổng phụ huynh hiện dùng SBD; giữ đúng cơ chế truy cập hiện hành.
  // Mọi thao tác làm/nộp bài bắt buộc phiên học sinh và lấy SBD từ chữ ký.
  const parent=action==='parent-list'||action==='create'
  const sbd=parent?String(b.sbd??'').trim():await gameIdentity(env,b)
  if(parent&&!await env.DB.prepare('SELECT sbd FROM hoc_sinh WHERE sbd=?').bind(sbd).first())throw new Error('Không tìm thấy số báo danh của con.')
  if(action==='parent-list'||action==='list'){
    const r=await env.DB.prepare('SELECT * FROM mom_bai WHERE sbd=? ORDER BY created_at DESC').bind(sbd).all<Row>()
    return {ok:true,items:r.results.map(item),serverNow:Date.now()}
  }
  const id=String(b.id??'');if(!/^[\w-]{1,100}$/.test(id))throw new Error('Mã bài không hợp lệ.')
  let r=await env.DB.prepare('SELECT * FROM mom_bai WHERE sbd=? AND id=?').bind(sbd,id).first<Row>()
  if(action==='create'){
    if(r)return {ok:true,item:item(r)} // Gửi lại sau mất mạng không tạo trùng hoặc ghi đè bài đã làm.
    const q=(Array.isArray(b.dsCau)?b.dsCau:[]) as Question[]
    if(!q.length||q.length>2000||q.some(c=>!c||typeof c!=='object'))throw new Error('Nội dung bài không hợp lệ.')
    const json=JSON.stringify(q);if(json.length>8_000_000)throw new Error('Bài quá lớn. Vui lòng chia thành các bài nhỏ hơn.')
    const key=`mom/${encodeURIComponent(sbd)}/${id}/${crypto.randomUUID()}.json`
    await env.DE.put(key,json)
    const created=typeof b.taoLuc==='string'&&Number.isFinite(Date.parse(b.taoLuc))?new Date(b.taoLuc).toISOString():new Date().toISOString()
    // `qid_json`: các mã câu THẬT của bài — kế hoạch ngày dùng để không giao lại chúng ở việc "ôn lại". Chưa chạy migration thì ghi như cũ.
    const tieuDe=String(b.tieuDe||'Bài của Mom giao').slice(0,300)
    try{await env.DB.prepare('INSERT OR IGNORE INTO mom_bai(sbd,id,title,created_at,question_count,bank_key,qid_json) VALUES(?,?,?,?,?,?,?)').bind(sbd,id,tieuDe,created,q.length,key,JSON.stringify(qidCuaBai(q))).run()}
    catch(e){if(!/no such column|has no column/i.test(e instanceof Error?e.message:String(e)))throw e
      await env.DB.prepare('INSERT OR IGNORE INTO mom_bai(sbd,id,title,created_at,question_count,bank_key) VALUES(?,?,?,?,?,?)').bind(sbd,id,tieuDe,created,q.length,key).run()}
    r=await env.DB.prepare('SELECT * FROM mom_bai WHERE sbd=? AND id=?').bind(sbd,id).first<Row>()
    if(!r)throw new Error('Chưa lưu được bài. Vui lòng thử lại.')
    return {ok:true,item:item(r)}
  }
  if(!r)throw new Error('Bài chưa được gửi lên máy chủ. Phụ huynh vui lòng mở lại app để đồng bộ bài cũ.')
  if(action==='start'){
    await env.DB.prepare('UPDATE mom_bai SET started_at=COALESCE(started_at,?) WHERE sbd=? AND id=? AND submitted_at IS NULL').bind(new Date().toISOString(),sbd,id).run()
    r=(await env.DB.prepare('SELECT * FROM mom_bai WHERE sbd=? AND id=?').bind(sbd,id).first<Row>())!
    return {ok:true,item:{...item(r),dsCau:await questions(env,r),dapAnDaNop:JSON.parse(r.answers)},serverNow:Date.now()}
  }
  if(action==='save'||action==='submit'){
    if(r.submitted_at)return {ok:true,item:{...item(r),dapAnDaNop:JSON.parse(r.answers)}}
    if(!r.started_at)throw new Error('Em cần bắt đầu bài trước khi nộp.')
    const q=await questions(env,r)
    const raw=b.answers&&typeof b.answers==='object'?b.answers as Record<string,unknown>:{}
    const answers:Record<string,string>={}
    for(let i=0;i<q.length;i++){const k=String(q[i].id||`cau_${i+1}`);if(typeof raw[k]==='string')answers[k]=String(raw[k]).slice(0,1000)}
    const expired=Date.now()>Date.parse(r.started_at)+7200_000
    if(action==='save'){
      if(expired)throw new Error('Đã hết giờ. Em bấm Nộp bài để hoàn tất.')
      await env.DB.prepare('UPDATE mom_bai SET answers=? WHERE sbd=? AND id=? AND submitted_at IS NULL').bind(JSON.stringify(answers),sbd,id).run()
      return {ok:true}
    }
    // Cho phép lượt nộp tự động tới trong 30 giây để không mất đáp án cuối do độ trễ mạng.
    const final=Date.now()>Date.parse(r.started_at)+7230_000?JSON.parse(r.answers):answers
    const result={...gradeMom(q,final),questionOutcomes:q.map((c,i)=>({qid:String(c.id||`cau_${i+1}`),correct:String(final[String(c.id||`cau_${i+1}`)]??'').trim().toUpperCase()===String(c.dapAn||c.dapAnDung||'A').trim().toUpperCase()}))}
    const nopLuc=new Date().toISOString()
    const nop=await env.DB.prepare('UPDATE mom_bai SET answers=?,result=?,submitted_at=? WHERE sbd=? AND id=? AND submitted_at IS NULL').bind(JSON.stringify(final),JSON.stringify(result),nopLuc,sbd,id).run()
    // SỔ SỰ KIỆN HỌC (GĐ 0): sổ chấm bằng luật chung `isAnswerCorrect`, điểm bài Mom vẫn là `gradeMom`.
    // Câu không có mã thật (`cau_N` do app tự đánh số) không định danh được câu nào → không ghi.
    if(nop?.meta?.changes){
      const cau:CauChamBai[]=q.flatMap(c=>{const qid=String(c.id??'').trim();return qid&&!/^cau_\d+$/.test(qid)?[{qid,dapAnDung:String(c.dapAn||c.dapAnDung||'A'),chuyenDe:String(c.chuyenDe??''),mucDo:String(c.mucDo??''),phan:typeof c.phan==='string'?c.phan:undefined}]:[]})
      await ghiSuKien(env,suKienChamBai('mom',id,sbd,1,nopLuc,cau,final))
    }
    r=(await env.DB.prepare('SELECT * FROM mom_bai WHERE sbd=? AND id=?').bind(sbd,id).first<Row>())!
    return {ok:true,item:{...item(r),dapAnDaNop:JSON.parse(r.answers)}}
  }
  if(action==='review')return {ok:true,item:{...item(r),dsCau:await questions(env,r),dapAnDaNop:JSON.parse(r.answers)}}
  throw new Error('Thao tác không hợp lệ.')
}
