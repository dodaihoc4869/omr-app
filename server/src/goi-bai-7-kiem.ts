import type { Env } from './kieu'
import { docGoiCuaEm7, damBaoGoi7, mang7, duNguonGoi7 } from './goi-bai-7'
import { sqlCacGoiConNhan7 } from './goi-bai-7-quyen'
import { sqlTenLopHs } from './goi-bai-7'
import { ngayVn7, diemGoi7, diemTo7, diemConDungNguon7, type CauGoi7 } from './goi-bai-7-loi'
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
/** `cau` luôn là ĐỦ tờ (ảnh chụp nguồn — diemConDungNguon7); câu tạm giữ lúc nộp không có trong `tra` (không chấm). */
interface Kiem7 { created:number; cau:CauKiem7[]; cauMoi:number; tong:number; tra?:Record<string,string> }
const chu = (x:unknown) => String(x??'')
const doc = (x:unknown) => JSON.parse(chu(x)) as Kiem7

/** Bài tự kiểm bao phủ đúng toàn bộ tờ đã chọn. Không gọi nó là dự báo điểm thi. */
export async function kiemGoi7(env:Env,sbd:string,action:string,b:Row,now:number):Promise<Record<string,unknown>> {
  await damBaoGoi7(env)
  const goiId=chu(b.goiId),start=action==='hoc-tap-kiem-start'
  const [gs,phien]=await Promise.all([
    docGoiCuaEm7(env,sbd,now),
    (start?env.DB.prepare('SELECT * FROM goi_bai_7_kiem WHERE goi_id=? AND sbd=? AND ma_de=? ORDER BY tao_luc DESC LIMIT 1').bind(goiId,sbd,chu(b.maDe)):
      env.DB.prepare('SELECT * FROM goi_bai_7_kiem WHERE id=? AND goi_id=? AND sbd=?').bind(chu(b.id),goiId,sbd)).first<Row>(),
  ])
  let g:Pick<Awaited<ReturnType<typeof docGoiCuaEm7>>[number],'id'|'cau'|'nguonDayDu'>|undefined=gs.find(g=>g.id===goiId)
  const dangNhan=!!g
  if(!g&&phien&&(!start||!phien.nop_luc&&now-doc(phien.json).created<2*3600000)) {
    // Quyền phiên gốc theo SBD×gói đã cấp: bớt membership không làm mất bài đang tự kiểm hoặc điểm đã nộp.
    const [meta,cs]=await Promise.all([
      env.DB.prepare('SELECT b.ma_to_json FROM goi_bai_7 g JOIN bai_da_day b ON b.id=g.tick_id WHERE g.id=?').bind(goiId).first<Row>(),
      env.DB.prepare('SELECT meta_json FROM goi_bai_7_cau WHERE goi_id=?').bind(goiId).all<Row>(),
    ])
    const cau=cs.results.map(r=>JSON.parse(chu(r.meta_json)) as CauGoi7)
    if(meta)g={id:goiId,cau,nguonDayDu:cau.length>0&&await duNguonGoi7(env,mang7(meta.ma_to_json))}
  }
  if(!g)throw new Error('Bài này không thuộc lớp của em hoặc đã ngừng nhận. Bài đã làm vẫn được giữ.')
  if(!g.nguonDayDu)throw new Error('Bộ bài chưa đủ nguồn của các tờ đã chọn. Thầy cần bổ sung trước khi tự kiểm.')
  const [baoVe,btvn,control,khoi]=await Promise.all([protectedQuestions(env),docCauBtvnChuaNop(env,sbd),readGameScope(env,sbd),docKhoiEm(env,sbd)])
  if(!control.enabled)throw new Error('Bài học đang tạm dừng.')
  // CÂU TẠM GIỮ (thầy 03/11 «bỏ hẳn lỗi kiểu này», cùng gốc lỗi Kiểm tra ôn tập #822): trước đây MỘT câu đang giữ cho ca thi / đổi nguồn / lệch khối / bị chặn
  // là ném lỗi khoá cả tờ tự kiểm. Nay câu ấy BỊ BỎ khỏi lượt (không xuống máy, không chấm, không hiện lời giải); em làm các câu còn lại. Hết câu mới báo.
  const giu=async(c:CauKiem7):Promise<boolean>=>{
    const goc=await docCauTheoRef(env,c.goc)
    if(!goc || !goc.reviewed || !g!.cau.some(q=>q.qid===goc.qid&&q.version===goc.version))return true
    if(baoVe.has(goc.qid) || baoVe.has(goc.group) || baoVe.has(c.q.qid) || btvn.has(goc.qid) || control.blocked.includes(goc.qid) || control.types.length&&(!goc.dang||!control.types.includes(goc.dang)))return true
    return !(await chanKhacKhoiEm(env,'goi7-kiem',{sbd,khoiEm:khoi},[goc])).length
  }
  const loc=async(cs:CauKiem7[])=>{const h=await Promise.all(cs.map(giu));return cs.filter((_,i)=>!h[i])}
  const HET='Các câu của tờ này đang được giữ cho ca kiểm tra hoặc đang đổi nguồn. Em tự kiểm tờ khác trước nhé; bài đã làm vẫn được giữ.'
  const khongXem=async(cs:CauKiem7[],tu:number)=>{
    const r=await env.DB.prepare('SELECT 1 FROM loi_giai_hoi WHERE sbd=? AND julianday(luc)>=julianday(?) AND qid IN(SELECT value FROM json_each(?)) LIMIT 1').bind(sbd,new Date(tu).toISOString(),JSON.stringify(cs.flatMap(c=>[c.goc.qid,c.q.qid]))).first()
    if(r)throw new Error('Em vừa xem phần chữa của tờ này. Hãy ôn trước và tự kiểm sau ít nhất 12 giờ để đo đúng khả năng nhớ.')
  }
  if(action==='hoc-tap-kiem-start') {
    const ma=chu(b.maDe),cs=g.cau.filter(c=>(c.maTo??c.maDe)===ma)
    if(!cs.length || cs.some(c=>c.hopLe===false))throw new Error('Tờ này chưa đủ câu đã duyệt để tự kiểm. Thầy sẽ bổ sung học liệu.')
    const old=phien
    if(old?.nop_luc && diemConDungNguon7(doc(old.json).cau,cs) && ngayVn7(Date.parse(chu(old.nop_luc)))===ngayVn7(now))throw new Error('Em đã tự kiểm tờ này hôm nay. Hãy sửa chỗ còn vướng rồi kiểm lại vào ngày khác.')
    if(old && !old.nop_luc && diemConDungNguon7(doc(old.json).cau,cs) && now-doc(old.json).created<2*3600000){
      const saved=doc(old.json), con=await loc(saved.cau)
      if(!con.length)throw new Error(HET)
      await khongXem(con,saved.created-12*3600000)
      return congKhai(chu(old.id),{...saved,cau:con,tong:con.length})
    }
    if(!dangNhan)throw new Error('Em đã ngừng nhận bài này. Bài đã làm vẫn được giữ.')
    const originals:PrivateQuestion[]=[]
    for(const q of await Promise.all(cs.map(c=>docCauTheoRef(env,c)))){if(!q)throw loiCauDoi(); originals.push(q)} // ảnh chụp phải đủ tờ; tờ đổi câu tự đồng bộ lại
    const n=await env.DB.prepare('SELECT COUNT(*) n FROM goi_bai_7_kiem WHERE sbd=?').bind(sbd).first<{n:number}>()
    const tiep=new Map(originals.map(q=>[q.qid,{bt:(n?.n??0)*10,yd:n?.n??0}]))
    const variants=await chonBanKhacMoi(env,originals,tiep,khoi)
    const cau=originals.map(q=>({goc:{qid:q.qid,maDe:q.maDe,version:q.version},q:variants.get(q.qid)??q,moi:variants.has(q.qid)})), con=await loc(cau)
    if(!con.length)throw new Error(HET)
    await khongXem(con,now-12*3600000)
    const id=crypto.randomUUID(),s:Kiem7={created:now,cau,cauMoi:cau.filter(c=>c.moi).length,tong:cau.length}
    const rs=await env.DB.prepare(`INSERT INTO goi_bai_7_kiem(id,goi_id,sbd,ma_de,json,tao_luc) SELECT ?,?,?,?,?,? WHERE ${sqlCacGoiConNhan7('?','?',sqlTenLopHs('h'))}`).bind(id,g.id,sbd,ma,JSON.stringify(s),new Date(now).toISOString(),JSON.stringify([g.id]),sbd).run()
    if(!Number(rs.meta.changes))throw new Error('Danh sách bài vừa thay đổi. Em cập nhật lại trước khi tự kiểm; bài đã làm vẫn được giữ.')
    return congKhai(id,{...s,cau:con,tong:con.length})
  }
  const row=phien
  if(!row)throw new Error('Không tìm thấy bài tự kiểm của em.')
  let s=doc(row.json)
  if(!diemConDungNguon7(s.cau,g.cau.filter(c=>(c.maTo??c.maDe)===row.ma_de)))throw new Error('Tờ đã được bổ sung hoặc sửa câu. Điểm cũ được giữ; em mở bài tự kiểm của bản mới.')
  if(!row.nop_luc){
    if(now-s.created>2*3600000)throw new Error('Bài tự kiểm đã hết hạn 2 giờ. Em mở lượt mới; bài tập đã làm vẫn được giữ.')
    const lam=await loc(s.cau) // câu đang giữ (kể cả vừa bị giữ giữa lượt) ⇒ không đòi, không chấm
    if(!lam.length)throw new Error(HET)
    await khongXem(lam,s.created-12*3600000)
    const tra=b.tra as Record<string,unknown>|undefined
    if(!tra || lam.some(c=>typeof tra[c.q.qid]!=='string'||!du(c.q,chu(tra[c.q.qid]))))throw new Error('Em trả lời đủ các câu trước khi nộp bài tự kiểm.')
    s={...s,tra:Object.fromEntries(lam.map(c=>[c.q.qid,chu(tra[c.q.qid])]))}
    const diem=cham(s)
    await env.DB.prepare('UPDATE goi_bai_7_kiem SET json=?,nop_luc=?,diem=? WHERE id=? AND sbd=? AND nop_luc IS NULL').bind(JSON.stringify(s),new Date(now).toISOString(),diem,chu(row.id),sbd).run()
    // Gửi lại/concurrent submit luôn dùng bản đã chốt đầu tiên.
    const sealed=await env.DB.prepare('SELECT * FROM goi_bai_7_kiem WHERE id=? AND sbd=?').bind(chu(row.id),sbd).first<Row>()
    if(!sealed?.nop_luc)throw new Error('Chưa xác nhận được bài nộp. Em thử lại.')
    Object.assign(row,sealed);s=doc(row.json)
  }
  // Cổng hiện hành vẫn áp khi gửi lại bài đã nộp: câu đang giữ cho ca mới KHÔNG hiện đáp án / lời giải (bỏ khỏi phần kết quả), câu khác vẫn xem được.
  const hien=new Set((await loc(s.cau)).map(c=>c.q.qid)), daLam=s.cau.filter(c=>typeof s.tra?.[c.q.qid]==='string')
  const luc=chu(row.nop_luc),receivedAt=Date.parse(luc)
  const events:SuKien[]=daLam.map(c=>({nguon:'game',maNguon:chu(row.id),sbd,qid:c.q.qid,cauVersion:c.goc.version,lan:1,ketQua:chamKiem(c.q,s.tra![c.q.qid]!)?1:0,luc,receivedAt,assistance:'none',purpose:'de_thu',attemptId:`g7kiem|${chu(row.id)}|${c.q.qid}`,maDang:c.q.dang,mucDo:c.q.mucDo??undefined,raw:{answer:s.tra![c.q.qid],goi7:g.id,...(c.moi?{tc:c.goc.qid,transfer:true}:{recall:true})},...(c.q.phan==='II'&&!c.moi?{subitem:ketQuaTungY(s.tra![c.q.qid]!,c.q.correct)}:{})}))
  await env.DB.prepare('INSERT OR IGNORE INTO loi_giai_hoi(sbd,qid,luc) SELECT ?,value,? FROM json_each(?)').bind(sbd,luc,JSON.stringify(daLam.filter(c=>hien.has(c.q.qid)).flatMap(c=>[c.goc.qid,c.q.qid]))).run()
  const wrote=await ghiSuKien(env,events)
  return {ok:true,diem:Number(row.diem),cauMoi:s.cauMoi,tong:daLam.length,daNop:true,daGhiSo:wrote.ok,ketQua:daLam.filter(c=>hien.has(c.q.qid)).map(c=>({qid:c.q.qid,correct:chamKiem(c.q,s.tra![c.q.qid]!),answer:c.q.correct,solution:c.q.solution,solutionImages:c.q.hinhAnh.filter(h=>h.viTri==='sau_loi_giai')}))}
}
function du(q:PrivateQuestion,v:string){return q.phan==='II'?/^[DS]{4}$/.test(v):q.phan==='I'?/^[ABCD]$/.test(v):v.trim().length>0&&v.length<=100}
function cham(s:Kiem7){const cs=s.cau.filter(c=>typeof s.tra?.[c.q.qid]==='string');return diemTo7(cs.reduce((n,c)=>n+diemGoi7(c.q.phan,s.tra![c.q.qid]!,c.q.correct,chamKiem(c.q,s.tra![c.q.qid]!)),0),cs.reduce((n,c)=>n+(c.q.phan==='II'?1:0.25),0))!}
function congKhai(id:string,s:Kiem7){return {ok:true,id,cauMoi:s.cauMoi,tong:s.tong,questions:s.cau.map(c=>publicQuestion(c.q))}}

function chamKiem(q:PrivateQuestion,tra:string){return q.phan==='III'?khopPhanIII(tra,q.correct):grade(q,tra)}
