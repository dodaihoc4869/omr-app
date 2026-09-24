import {soKhopSo} from '../../src/lib/cham-so'
import {normalizeNumericAnswer} from '../../src/engine/score'
import {answerText} from './btvn-grading'
import {emCoGhi} from './dem-ke-hoach'
import type {Env} from './kieu'
import {gameIdentity} from './game-v2-auth'
import {ghiSuKien,suKienChamBai,type CauChamBai} from './su-kien-hoc'
import {expNhanSauNop} from './exp-d1'
import {maDaDung} from './reset-toan-app'
import {sbdCuaPhuHuynh} from './ph-truy-cap'
import {chiGiuCauRutDuoc} from './cam-tu-luan'
import {readScope, doDayDu, protectedQuestions} from './game-v2-bank'
import {learnedQuestionFilter} from '../../src/game/than-thu-v2/core'
import {cauChoMom} from './parent-news-nguon-cau'
import {chamTheoPolicy, ChamInputError, ChamMaterialError, POLICY_MAC_DINH_PHAN_III} from '../../src/lib/cham-so-policy'

/** Submit validation only: callers map input to 422, server material to 500. */
export class LoiChamMom extends Error {
  constructor(readonly ma:'MOM_GRADING_INPUT_INVALID'|'MOM_GRADING_MATERIAL_INVALID', message:string){super(message)}
}

type Question = Record<string, unknown>
type Row = {sbd:string;id:string;title:string;created_at:string;question_count:number;bank_key:string;started_at:string|null;submitted_at:string|null;answers:string;result:string|null}
const SO_HOP_LE = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/
function phanMom(c:Question):string {
  const p=String(c.phan??'').trim().toUpperCase()
  if(p==='I'||p==='II'||p==='III')return p
  return String(c.id??c.qid??'').match(/-(III|II|I)-\d+$/)?.[1]??''
}
/** Khóa thiếu/sai khuôn thì rỗng, tuyệt đối không đoán phương án A. */
function khoaMom(c:Question):string {
  const raw=c.dapAn??c.dapAnDung??c.correct
  const d=answerText(raw)
  const p=phanMom(c)
  if(!d)return ''
  if(p==='I'&&!/^[ABCD]$/.test(d))return ''
  if(p==='II'&&!/^[DS]{4}$/.test(d))return ''
  if(p==='III'){
    const n=normalizeNumericAnswer(d)
    if(!SO_HOP_LE.test(n)||!Number.isFinite(Number(n)))return ''
  }
  return d
}
function dungMom(c:Question,e:unknown):boolean {
  const d=khoaMom(c)
  if(!d)return false
  return phanMom(c)==='III'?soKhopSo(e,d,'so_hoc'):answerText(e)===d
}
export function gradeMom(q:Question[], answers:Record<string,string>) {
  // Giữ quy tắc bài khắc phục cũ: mỗi câu đúng trọn vẹn có cùng trọng số.
  // Phần III (đáp án số): MỘT bộ chuẩn hoá số dùng chung (src/lib/cham-so.ts, chính sách số học như bài về nhà) — trước đây chỉ so chuỗi in hoa nên "0,54" ≠ "0.54"; Phần I/II giữ nguyên.
  const soCauDung=q.filter((c,i)=>dungMom(c,answers[String(c.id||`cau_${i+1}`)])).length
  return {soCauDung,diem:Math.round(soCauDung/Math.max(1,q.length)*1000)/100}
}
/** Mã câu THẬT của một bài: `id`/`qid` không rỗng, bỏ `cau_N` (app tự đánh số, không định danh câu nào), khử trùng, giữ thứ tự. */
export function qidCuaBai(q:Question[]):string[]{
  const ra:string[]=[]
  for(const c of q){const v=c?.id??c?.qid;const qid=typeof v==='string'?v.trim():'';if(qid&&!/^cau_\d+$/.test(qid)&&!ra.includes(qid))ra.push(qid)}
  return ra
}
/** Chỉ trả đề; không trả khóa/giải/ảnh giải khi em còn đang làm. */
function deMomCongKhai(q:Question):Question {
  const fields = ['id','qid','maDe','phan','text','noiDung','choices','ideas','table','thanCauImg','imageDataUrl','choiceImgs','ideaImgs','chuyenDe','dang','mucDo','sao']
  const out:Question={}
  for(const key of fields)if(q[key]!==undefined)out[key]=q[key]
  if(Array.isArray(q.hinhAnh))out.hinhAnh=q.hinhAnh.filter(h=>h&&typeof h==='object'&&(h as Record<string,unknown>).viTri!=='sau_loi_giai')
  return out
}
/** Nội dung và khóa do máy chủ tra, không tin khóa/metadata do phụ huynh gửi. */
async function xacMinhCauMom(env:Env,sbd:string,ds:Question[]):Promise<Question[]> {
  const ids=qidCuaBai(ds)
  if(ids.length!==ds.length)throw new Error('Mã câu thiếu hoặc trùng. Anh/chị chọn lại bài từ kho của em.')
  const [scope,blocked]=await Promise.all([readScope(env,sbd),protectedQuestions(env)])
  const xin=new Set(ids)
  const daHoc=learnedQuestionFilter(scope.evidence,blocked)
  const candidates=scope.pool.filter(q=>q.reviewed&&xin.has(q.qid)&&daHoc(q))
  if(new Set(candidates.map(q=>q.qid)).size!==candidates.length)throw new Error('Mã câu trùng giữa các đề. Anh/chị chọn lại bài sau khi Thầy kiểm tra kho.')
  const full=await doDayDu(env,candidates)
  const byId=new Map(full.map(q=>[q.qid,q]))
  if(ids.some(id=>!byId.has(id)))throw new Error('Có câu chưa thuộc phần em đã học hoặc chưa dùng được. Anh/chị chọn lại bài từ kho của em.')
  return ids.map(id=>({...cauChoMom(byId.get(id)!),_khoaXacMinh:1}))
}
function item(r:Row){return {id:r.id,sbd:r.sbd,tieuDe:r.title,taoLuc:r.created_at,ngayGiao:r.created_at,soCau:r.question_count,thoiGianPhut:120,batDauLuc:r.started_at,nopLuc:r.submitted_at,trangThai:r.submitted_at?'da_nop':r.started_at?'dang_lam':'chua_lam',...(r.result?JSON.parse(r.result):{})}}
async function questions(env:Env,r:Row):Promise<Question[]>{const o=await env.DE.get(r.bank_key);if(!o)throw new Error('Chưa tải được nội dung bài. Vui lòng thử lại.');return await new Response(o.body).json() as Question[]}
/** Dùng đáp án đã chốt, cho phép khôi phục sổ học nếu request trước dừng sau khi lưu bài. */
async function ghiHocMom(env:Env,r:Row,q:Question[]):Promise<Record<string,unknown>>{
  if(!r.submitted_at||q.some(c=>c._khoaXacMinh!==1||!khoaMom(c)))return {}
  const cau:CauChamBai[]=q.flatMap(c=>{const qid=String(c.id??'').trim();return qid&&!/^cau_\d+$/.test(qid)?[{qid,dapAnDung:khoaMom(c),chuyenDe:String(c.chuyenDe??''),mucDo:String(c.mucDo??''),phan:typeof c.phan==='string'?c.phan:undefined}]:[]})
  const ghi=await ghiSuKien(env,suKienChamBai('mom',r.id,r.sbd,1,r.submitted_at,cau,JSON.parse(r.answers)))
  if(!ghi.ok)throw new Error('Bài nộp đã lưu. Em bấm Nộp lại để đồng bộ tiến bộ và EXP.')
  return expNhanSauNop(env,r.sbd,Date.parse(r.submitted_at))
}
export async function mom(env:Env,action:string,b:Record<string,unknown>,opts:{noiBo?:boolean}={}):Promise<Record<string,unknown>> {
  // Cổng phụ huynh: token `pass` hoặc SBD trần (giai đoạn mềm, có đếm truy cập, xem ph-truy-cap.ts). `noiBo` = lệnh gọi từ chính máy chủ (bài hằng ngày), SBD đã xác thực.
  // Mọi thao tác làm/nộp bài bắt buộc phiên học sinh và lấy SBD từ chữ ký.
  const parent=action==='parent-list'||action==='create'
  const sbd=parent?(opts.noiBo?String(b.sbd??'').trim():(await sbdCuaPhuHuynh(env,b,'mom')).sbd):await gameIdentity(env,b)
  if(action==='create'||action==='start'||action==='save'||action==='submit')emCoGhi(sbd) // bài Mom đổi ⇒ đệm kế hoạch ngày của em hết hiệu lực (dem-ke-hoach.ts); nộp còn ghi sổ nên xoá thêm ở ghiSuKien
  if(parent&&opts.noiBo&&!await env.DB.prepare('SELECT sbd FROM hoc_sinh WHERE sbd=?').bind(sbd).first())throw new Error('Không tìm thấy số báo danh của con.')
  if(action==='parent-list'||action==='list'){
    const r=await env.DB.prepare('SELECT * FROM mom_bai WHERE sbd=? ORDER BY created_at DESC').bind(sbd).all<Row>()
    return {ok:true,items:r.results.map(item),serverNow:Date.now()}
  }
  const id=String(b.id??'');if(!/^[\w-]{1,100}$/.test(id))throw new Error('Mã bài không hợp lệ.')
  let r=await env.DB.prepare('SELECT * FROM mom_bai WHERE sbd=? AND id=?').bind(sbd,id).first<Row>()
  if(action==='create'){
    if(r)return {ok:true,item:item(r)} // Gửi lại sau mất mạng không tạo trùng hoặc ghi đè bài đã làm.
    if(await maDaDung(env,'mom',id))throw new Error('Mã bài đã từng dùng. Tạo lại bài với mã khác.') // tập mã nạp lúc reset 21/09: nháp trong máy em khoá theo mã bài
    const tho=(Array.isArray(b.dsCau)?b.dsCau:[]) as Question[]
    if(!tho.length||tho.length>2000||tho.some(c=>!c||typeof c!=='object'))throw new Error('Nội dung bài không hợp lệ.')
    // CẤM RÚT TỰ LUẬN (21/09): máy phụ huynh tự chọn câu rồi gửi lên — máy chủ là lớp chặn cuối. Chỉ giữ câu trắc nghiệm / đúng sai / trả lời ngắn.
    const {giu:loc,soBo:soBoTuLuan}=chiGiuCauRutDuoc(tho)
    if(!loc.length)throw new Error('Bài này chỉ có câu tự luận nên chưa tạo được. Thầy chỉ giao câu trắc nghiệm, đúng sai và trả lời ngắn.')
    const q=opts.noiBo?loc.map(c=>({...c,_khoaXacMinh:1})):await xacMinhCauMom(env,sbd,loc)
    if(!q.length)throw new Error('Bài này chỉ có câu tự luận nên chưa tạo được. Thầy chỉ giao câu trắc nghiệm, đúng sai và trả lời ngắn.')
    const loiKhoa=q.findIndex((c)=>!khoaMom(c))
    if(loiKhoa>=0)throw new Error('Câu '+(loiKhoa+1)+' chưa có đáp án hợp lệ. Anh/chị kiểm tra lại câu này rồi gửi bài.')
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
    return {ok:true,item:item(r),...(soBoTuLuan?{soBoTuLuan}:{})}
  }
  if(!r)throw new Error('Bài chưa được gửi lên máy chủ. Phụ huynh vui lòng mở lại app để đồng bộ bài cũ.')
  if(action==='start'){
    await env.DB.prepare('UPDATE mom_bai SET started_at=COALESCE(started_at,?) WHERE sbd=? AND id=? AND submitted_at IS NULL').bind(new Date().toISOString(),sbd,id).run()
    r=(await env.DB.prepare('SELECT * FROM mom_bai WHERE sbd=? AND id=?').bind(sbd,id).first<Row>())!
    return {ok:true,item:{...item(r),dsCau:(await questions(env,r)).map(deMomCongKhai),dapAnDaNop:JSON.parse(r.answers)},serverNow:Date.now()}
  }
  if(action==='save'||action==='submit'){
    if(r.submitted_at)return {ok:true,item:{...item(r),dapAnDaNop:JSON.parse(r.answers)},...(action==='submit'?await ghiHocMom(env,r,await questions(env,r)):{})}
    if(!r.started_at)throw new Error('Em cần bắt đầu bài trước khi nộp.')
    let q=await questions(env,r)
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
    if(q.some(c=>c._khoaXacMinh!==1)){
      await env.DB.prepare('UPDATE mom_bai SET answers=? WHERE sbd=? AND id=? AND submitted_at IS NULL').bind(JSON.stringify(final),sbd,id).run()
      q=await xacMinhCauMom(env,sbd,q)
      // Bài cũ phải xem lại đúng khóa vừa dùng chấm, không trả khóa máy khách cũ.
      if(q.every(c=>!!khoaMom(c)))await env.DE.put(r.bank_key,JSON.stringify(q))
    }
    const loiKhoa=q.findIndex((c)=>!khoaMom(c))
    if(loiKhoa>=0){
      // Giữ đáp án em vừa gửi, nhưng không chốt nộp khi đề thiếu khóa.
      await env.DB.prepare('UPDATE mom_bai SET answers=? WHERE sbd=? AND id=? AND submitted_at IS NULL').bind(JSON.stringify(final),sbd,id).run()
      throw new LoiChamMom('MOM_GRADING_MATERIAL_INVALID','Câu '+(loiKhoa+1)+' thiếu đáp án đúng. Bài làm của em đã lưu, em báo Thầy kiểm tra.')
    }
    // Validate the whole final payload before submitted_at/result, learning events or EXP.
    // Saving a draft is separate from accepting an attempt; retain it on validation failure.
    // `final` already applies the existing timeout/grace rule, and blanks keep their old behavior.
    for(let i=0;i<q.length;i++){
      const c=q[i], answer=final[String(c.id||`cau_${i+1}`)]
      if(phanMom(c)!=='III'||typeof answer!=='string'||!answer.trim())continue
      let error:LoiChamMom|undefined
      try{
        const graded=chamTheoPolicy({policy:POLICY_MAC_DINH_PHAN_III,key:khoaMom(c),answer})
        if(graded.error)error=new LoiChamMom('MOM_GRADING_INPUT_INVALID','Câu '+(i+1)+' chưa đọc được câu trả lời. Bài làm đã lưu, em sửa cách nhập rồi nộp lại.')
      }catch(e){
        if(!(e instanceof ChamMaterialError)&&!(e instanceof ChamInputError))throw e
        error=new LoiChamMom('MOM_GRADING_MATERIAL_INVALID','Câu '+(i+1)+' thiếu đáp án đúng. Bài làm của em đã lưu, em báo Thầy kiểm tra.')
      }
      if(error){
        await env.DB.prepare('UPDATE mom_bai SET answers=? WHERE sbd=? AND id=? AND submitted_at IS NULL').bind(JSON.stringify(final),sbd,id).run()
        throw error
      }
    }
    const result={...gradeMom(q,final),questionOutcomes:q.map((c,i)=>({qid:String(c.id||`cau_${i+1}`),correct:dungMom(c,final[String(c.id||`cau_${i+1}`)])}))}
    const nopLuc=new Date().toISOString()
    await env.DB.prepare('UPDATE mom_bai SET answers=?,result=?,submitted_at=? WHERE sbd=? AND id=? AND submitted_at IS NULL').bind(JSON.stringify(final),JSON.stringify(result),nopLuc,sbd,id).run()
    r=(await env.DB.prepare('SELECT * FROM mom_bai WHERE sbd=? AND id=?').bind(sbd,id).first<Row>())!
    const exp=await ghiHocMom(env,r,q)
    return {ok:true,item:{...item(r),dapAnDaNop:JSON.parse(r.answers)},...exp}
  }
  if(action==='review'&&!r.submitted_at)throw new Error('Em nộp bài trước khi xem đáp án.')
  if(action==='review')return {ok:true,item:{...item(r),dsCau:await questions(env,r),dapAnDaNop:JSON.parse(r.answers)}}
  throw new Error('Thao tác không hợp lệ.')
}
