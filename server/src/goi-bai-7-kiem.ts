import type { Env } from './kieu'
import { docGoiCuaEm7, damBaoGoi7 } from './goi-bai-7'
import { ngayVn7, diemGoi7, diemTo7, diemConDungNguon7 } from './goi-bai-7-loi'
import { docCauTheoRef, docKhoiEm, protectedQuestions, loiCauDoi } from './game-v2-bank'
import { chonBanKhacMoi } from './ban-khac-ao'
import { readGameScope } from './game-v2-reports'
import { docCauBtvnChuaNop } from './game-v2-luot'
import { grade, publicQuestion, type PrivateQuestion } from '../../src/game/than-thu-v2/core'
import { chanKhacKhoiEm } from './chan-khac-khoi'
import { ghiSuKien, type SuKien } from './su-kien-hoc'
import { khopPhanIII } from '../../src/lib/cham-so'
import { ketQuaTungY } from './omni-game'

type Row = Record<string,unknown>
interface CauKiem7 { goc: {qid:string;maDe:string;version:string}; q: PrivateQuestion; moi: boolean }
interface Kiem7 { created:number; cau:CauKiem7[]; cauMoi:number; tong:number; tra?:Record<string,string> }
const chu = (x:unknown) => String(x??'')
const doc = (x:unknown) => JSON.parse(chu(x)) as Kiem7

/** Bài tự kiểm bao phủ đúng toàn bộ tờ đã chọn. Không gọi nó là dự báo điểm thi. */
export async function kiemGoi7(env:Env,sbd:string,action:string,b:Row,now:number):Promise<Record<string,unknown>> {
  await damBaoGoi7(env)
  const gs=await docGoiCuaEm7(env,sbd,now)
  const g=gs.find(g=>g.id===b.goiId)
  if(!g)throw new Error('Bài này không thuộc lớp của em.')
  if(!g.nguonDayDu)throw new Error('Bộ bài chưa đủ nguồn của các tờ đã chọn. Thầy cần bổ sung trước khi tự kiểm.')
  const [baoVe,btvn,control,khoi]=await Promise.all([protectedQuestions(env),docCauBtvnChuaNop(env,sbd),readGameScope(env,sbd),docKhoiEm(env,sbd)])
  if(!control.enabled)throw new Error('Bài học đang tạm dừng.')
  const valid=async(c:CauKiem7)=>{
    const goc=await docCauTheoRef(env,c.goc)
    if(!goc || !goc.reviewed)throw loiCauDoi()
    if(!g.cau.some(q=>q.qid===goc.qid&&q.version===goc.version))throw loiCauDoi()
    if(!(await chanKhacKhoiEm(env,'goi7-kiem',{sbd,khoiEm:khoi},[goc])).length)throw new Error('Có câu chưa khớp khối của em. Thầy cần kiểm tra nguồn câu.')
    if(baoVe.has(goc.qid) || baoVe.has(goc.group) || baoVe.has(c.q.qid) || btvn.has(goc.qid) || control.blocked.includes(goc.qid) || control.types.length&&(!goc.dang||!control.types.includes(goc.dang)))throw new Error('Có câu đang được giữ cho ca kiểm tra. Em làm bài tự kiểm sau nhé.')
  }
  const khongXem=async(cs:CauKiem7[],tu:number)=>{
    const r=await env.DB.prepare('SELECT 1 FROM loi_giai_hoi WHERE sbd=? AND julianday(luc)>=julianday(?) AND qid IN(SELECT value FROM json_each(?)) LIMIT 1').bind(sbd,new Date(tu).toISOString(),JSON.stringify(cs.flatMap(c=>[c.goc.qid,c.q.qid]))).first()
    if(r)throw new Error('Em vừa xem phần chữa của tờ này. Hãy ôn trước và tự kiểm sau ít nhất 12 giờ để đo đúng khả năng nhớ.')
  }
  if(action==='hoc-tap-kiem-start') {
    const ma=chu(b.maDe),cs=g.cau.filter(c=>(c.maTo??c.maDe)===ma)
    if(!cs.length || cs.some(c=>c.hopLe===false))throw new Error('Tờ này chưa đủ câu đã duyệt để tự kiểm. Thầy sẽ bổ sung học liệu.')
    const old=await env.DB.prepare('SELECT * FROM goi_bai_7_kiem WHERE goi_id=? AND sbd=? AND ma_de=? ORDER BY tao_luc DESC LIMIT 1').bind(g.id,sbd,ma).first<Row>()
    if(old?.nop_luc && diemConDungNguon7(doc(old.json).cau,cs) && ngayVn7(Date.parse(chu(old.nop_luc)))===ngayVn7(now))throw new Error('Em đã tự kiểm tờ này hôm nay. Hãy sửa chỗ còn vướng rồi kiểm lại vào ngày khác.')
    if(old && !old.nop_luc && diemConDungNguon7(doc(old.json).cau,cs) && now-doc(old.json).created<2*3600000){
      const saved=doc(old.json); for(const c of saved.cau)await valid(c)
      await khongXem(saved.cau,saved.created-12*3600000)
      return congKhai(chu(old.id),saved)
    }
    const originals:PrivateQuestion[]=[]
    for(const c of cs){const q=await docCauTheoRef(env,c);if(!q)throw loiCauDoi(); originals.push(q)}
    const n=await env.DB.prepare('SELECT COUNT(*) n FROM goi_bai_7_kiem WHERE sbd=?').bind(sbd).first<{n:number}>()
    const tiep=new Map(originals.map(q=>[q.qid,{bt:(n?.n??0)*10,yd:n?.n??0}]))
    const variants=await chonBanKhacMoi(env,originals,tiep,khoi)
    const cau=originals.map(q=>({goc:{qid:q.qid,maDe:q.maDe,version:q.version},q:variants.get(q.qid)??q,moi:variants.has(q.qid)}))
    for(const c of cau)await valid(c)
    await khongXem(cau,now-12*3600000)
    const id=crypto.randomUUID(),s:Kiem7={created:now,cau,cauMoi:cau.filter(c=>c.moi).length,tong:cau.length}
    await env.DB.prepare('INSERT INTO goi_bai_7_kiem(id,goi_id,sbd,ma_de,json,tao_luc) VALUES(?,?,?,?,?,?)').bind(id,g.id,sbd,ma,JSON.stringify(s),new Date(now).toISOString()).run()
    return congKhai(id,s)
  }
  const row=await env.DB.prepare('SELECT * FROM goi_bai_7_kiem WHERE id=? AND goi_id=? AND sbd=?').bind(chu(b.id),g.id,sbd).first<Row>()
  if(!row)throw new Error('Không tìm thấy bài tự kiểm của em.')
  let s=doc(row.json)
  if(!diemConDungNguon7(s.cau,g.cau.filter(c=>(c.maTo??c.maDe)===row.ma_de)))throw new Error('Tờ đã được bổ sung hoặc sửa câu. Điểm cũ được giữ; em mở bài tự kiểm của bản mới.')
  if(!row.nop_luc){
    if(now-s.created>2*3600000)throw new Error('Bài tự kiểm đã hết hạn 2 giờ. Em mở lượt mới; bài tập đã làm vẫn được giữ.')
    for(const c of s.cau)await valid(c)
    await khongXem(s.cau,s.created-12*3600000)
    const tra=b.tra as Record<string,unknown>|undefined
    if(!tra || s.cau.some(c=>typeof tra[c.q.qid]!=='string'||!du(c.q,chu(tra[c.q.qid]))))throw new Error('Em trả lời đủ các câu trước khi nộp bài tự kiểm.')
    s={...s,tra:Object.fromEntries(s.cau.map(c=>[c.q.qid,chu(tra[c.q.qid])]))}
    const diem=cham(s)
    await env.DB.prepare('UPDATE goi_bai_7_kiem SET json=?,nop_luc=?,diem=? WHERE id=? AND sbd=? AND nop_luc IS NULL').bind(JSON.stringify(s),new Date(now).toISOString(),diem,chu(row.id),sbd).run()
    // Gửi lại/concurrent submit luôn dùng bản đã chốt đầu tiên.
    const sealed=await env.DB.prepare('SELECT * FROM goi_bai_7_kiem WHERE id=? AND sbd=?').bind(chu(row.id),sbd).first<Row>()
    if(!sealed?.nop_luc)throw new Error('Chưa xác nhận được bài nộp. Em thử lại.')
    Object.assign(row,sealed);s=doc(row.json)
  }
  // Cổng hiện hành vẫn áp khi gửi lại bài đã nộp: không mở đáp án đang giữ cho ca mới.
  for(const c of s.cau)await valid(c)
  const luc=chu(row.nop_luc),receivedAt=Date.parse(luc)
  const events:SuKien[]=s.cau.map(c=>({nguon:'game',maNguon:chu(row.id),sbd,qid:c.q.qid,cauVersion:c.goc.version,lan:1,ketQua:chamKiem(c.q,s.tra![c.q.qid]!)?1:0,luc,receivedAt,assistance:'none',purpose:'de_thu',attemptId:`g7kiem|${chu(row.id)}|${c.q.qid}`,maDang:c.q.dang,mucDo:c.q.mucDo??undefined,raw:{answer:s.tra![c.q.qid],goi7:g.id,...(c.moi?{tc:c.goc.qid,transfer:true}:{recall:true})},...(c.q.phan==='II'&&!c.moi?{subitem:ketQuaTungY(s.tra![c.q.qid]!,c.q.correct)}:{})}))
  await env.DB.prepare('INSERT OR IGNORE INTO loi_giai_hoi(sbd,qid,luc) SELECT ?,value,? FROM json_each(?)').bind(sbd,luc,JSON.stringify(s.cau.flatMap(c=>[c.goc.qid,c.q.qid]))).run()
  const wrote=await ghiSuKien(env,events)
  return {ok:true,diem:Number(row.diem),cauMoi:s.cauMoi,tong:s.tong,daNop:true,daGhiSo:wrote.ok,ketQua:s.cau.map(c=>({qid:c.q.qid,correct:chamKiem(c.q,s.tra![c.q.qid]!),answer:c.q.correct,solution:c.q.solution,solutionImages:c.q.hinhAnh.filter(h=>h.viTri==='sau_loi_giai')}))}
}
function du(q:PrivateQuestion,v:string){return q.phan==='II'?/^[DS]{4}$/.test(v):q.phan==='I'?/^[ABCD]$/.test(v):v.trim().length>0&&v.length<=100}
function cham(s:Kiem7){return diemTo7(s.cau.reduce((n,c)=>n+diemGoi7(c.q.phan,s.tra![c.q.qid]!,c.q.correct,chamKiem(c.q,s.tra![c.q.qid]!)),0),s.cau.reduce((n,c)=>n+(c.q.phan==='II'?1:0.25),0))!}
function congKhai(id:string,s:Kiem7){return {ok:true,id,cauMoi:s.cauMoi,tong:s.tong,questions:s.cau.map(c=>publicQuestion(c.q))}}

function chamKiem(q:PrivateQuestion,tra:string){return q.phan==='III'?khopPhanIII(tra,q.correct):grade(q,tra)}
