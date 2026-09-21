import type { Env } from './kieu'
import { gameIdentity } from './game-v2-auth'
import { protectedQuestions, contentGroup } from './game-v2-bank'
import { ghiSuKien, suKienLuyenDe } from './su-kien-hoc'
import { expNhanSauNop } from './exp-d1'
import { parseKhoDeJson, buildTeacherSourceFromKhoDe } from '../../src/lib/exam-kho-de-import'
import { mergeAndStrip, type TeacherExamSource } from '../../src/data/examContent'
import { rutDeChuan2026, SO_CAU_CHUAN_2026, laBoDe12, MA_TRAN_HOA_2026 } from '../../src/lib/ma-tran-hoa-2026'
import { normalizeNumericAnswer } from '../../src/engine/score'
import { laCauTuLuan } from './cam-tu-luan'
import { docKhoiEm } from './game-v2-bank'

type Row = { id:string;sbd:string;created_at:number;deadline:number;status:string;bank_key:string;answers:string;result:string|null }
const read = async(env:Env,key:string):Promise<TeacherExamSource[]> => {
  const o=await env.DE.get(key);if(!o)throw new Error('Chưa đọc được đề đã lưu. Em thử lại.');return await new Response(o.body).json() as TeacherExamSource[]
}
export function chamDeChuan(sources:TeacherExamSource[], a:Record<string,string>) {
  let cents=0
  const detail:Record<string,{correct:unknown;points:number}>={}
  for(const s of sources) {
    for(const q of s.phanI){const p=a[q.id]===q.correct?25:0;cents+=p;detail[q.id]={correct:q.correct,points:p/100}}
    for(const q of s.phanII){const n=q.correct.filter((v,i)=>v===(a[q.id]||'')[i]).length;const p=[0,10,25,50,100][n];cents+=p;detail[q.id]={correct:q.correct,points:p/100}}
    for(const q of s.phanIII){const val=(a[q.id]||'').trim();const p=val&&normalizeNumericAnswer(val)===normalizeNumericAnswer(q.correct)?25:0;cents+=p;detail[q.id]={correct:q.correct,points:p/100}}
  }
  return { score:cents/100, detail }
}
function cleanAnswers(b:unknown,sources:TeacherExamSource[]):Record<string,string>{
  const raw=b&&typeof b==='object'?b as Record<string,unknown>:{}
  const a:Record<string,string>={}
  for(const s of sources)for(const phan of ['I','II','III'] as const)for(const q of s[`phan${phan}`]){
    const v=String(raw[q.id]??'').trim().slice(0,32)
    if(phan==='I'&&/^[ABCD]$/.test(v)||phan==='II'&&/^[DS-]{4}$/.test(v)||phan==='III'&&/^-?\d+(?:[.,]\d+)?$/.test(v))a[q.id]=v
  }
  return a
}
export async function luyenDe(env:Env, action:string,b:Record<string,unknown>):Promise<Record<string,unknown>>{
  const sbd=await gameIdentity(env,b)
  if(action==='history'){
    const r=await env.DB.prepare('SELECT id,created_at,deadline,status,result FROM luyen_de_2026 WHERE sbd=? ORDER BY created_at DESC LIMIT 30').bind(sbd).all<Row>()
    return {ok:true,items:r.results.map(r=>({id:r.id,createdAt:r.created_at,status:r.status,score:r.result?JSON.parse(r.result).score:null}))}
  }
  let row:Row|null=null
  if(action==='start') {
    if(b.daHocXong!==true)throw new Error('Mục này chỉ dành cho học sinh đã học xong toàn bộ chương trình Hóa THPT.')
    // LUẬT KHỐI (Boss 21/09): Bộ đề là đề khối 12; cờ `daHocXong` do MÁY EM tự gửi nên máy chủ tự kiểm khối — em khối 10/11 không mở được. Không rõ khối ⇒ giữ cổng cũ.
    const khoiEm=await docKhoiEm(env,sbd);if(khoiEm!==null&&khoiEm<12)throw new Error('Mục này chỉ dành cho học sinh khối 12.')
    row=await env.DB.prepare("SELECT * FROM luyen_de_2026 WHERE sbd=? AND status='active'").bind(sbd).first<Row>()
    if(!row){
      const r=await env.DB.prepare("SELECT ma_de,r2_khoa FROM de_kho WHERE da_xoa=0 AND lop='12' AND (lower(ten_de) LIKE '%bộ đề%' OR ten_de LIKE '%BỘ ĐỀ%' OR ten_de LIKE '%Bộ đề%') ORDER BY ma_de").all<{ma_de:string;r2_khoa:string}>()
      const sources:TeacherExamSource[]=[]
      const blocked=await protectedQuestions(env)
      for(const d of r.results){
        const o=await env.DE.get(d.r2_khoa||`kho/${d.ma_de}.json`);if(!o)continue
        const parsed=parseKhoDeJson(await new Response(o.body).json());if(!parsed.ok||!parsed.json)continue
        const built=buildTeacherSourceFromKhoDe(parsed.json);if(built.errors.length||!laBoDe12(built.source))continue
        const s=built.source
        // Cấm dùng nguồn đang giữ kín cho ca thi. Cùng quy tắc nhận diện nội dung của game.
        for(const phan of ['I','II','III'] as const){
          const kept=[]
          for(const q of s[`phan${phan}`]){
            const group=await contentGroup({phan,text:q.text,choices:'choices' in q?q.choices:[],ideas:'ideas' in q?q.ideas:[],table:q.table,thanCauImg:q.thanCauImg,imageDataUrl:q.imageDataUrl,choiceImgs:'choiceImgs' in q?q.choiceImgs:undefined,ideaImgs:'ideaImgs' in q?q.ideaImgs:undefined,hinhAnh:q.hinhAnh||[]} as unknown as Parameters<typeof contentGroup>[0])
            // CẤM RÚT TỰ LUẬN (21/09): đề luyện chỉ ghép câu trắc nghiệm / đúng sai / trả lời ngắn.
            if(!blocked.has(group)&&!blocked.has(q.id)&&!laCauTuLuan(q,phan))kept.push(q)
          }
          ;(s[`phan${phan}`] as unknown[])=kept
        }
        sources.push(s)
      }
      const id=crypto.randomUUID(), now=Date.now(), key=`luyen-de-2026/${sbd}/${id}.json`
      const picked=rutDeChuan2026(sources,id)
      await env.DE.put(key,JSON.stringify(picked))
      await env.DB.prepare("INSERT OR IGNORE INTO luyen_de_2026(id,sbd,created_at,deadline,bank_key,updated_at) VALUES(?,?,?,?,?,?)").bind(id,sbd,now,now+50*60000,key,now).run()
      row=await env.DB.prepare("SELECT * FROM luyen_de_2026 WHERE sbd=? AND status='active'").bind(sbd).first<Row>()
    }
  }else row=await env.DB.prepare('SELECT * FROM luyen_de_2026 WHERE id=? AND sbd=?').bind(String(b.id||''),sbd).first<Row>()
  if(!row)throw new Error('Không tìm thấy bài luyện của em.')
  const sources=await read(env,row.bank_key)
  const now=Date.now()
  if(action==='save'&&row.status==='active'&&now<row.deadline){
    const answers=cleanAnswers(b.answers,sources)
    await env.DB.prepare("UPDATE luyen_de_2026 SET answers=?,updated_at=? WHERE id=? AND sbd=? AND status='active' AND deadline>?").bind(JSON.stringify(answers),now,row.id,sbd,now).run()
    return {ok:true,serverNow:now}
  }
  let expMoi:Record<string,unknown>={}
  if(row.status==='active'&&(action==='submit'||now>=row.deadline)){
    // Bài gửi sau hạn chỉ chấm các đáp án đã lưu trước hạn, không nhận thêm.
    const answers=now<row.deadline?cleanAnswers(b.answers,sources):JSON.parse(row.answers)
    const result=chamDeChuan(sources,answers)
    const nop=await env.DB.prepare("UPDATE luyen_de_2026 SET answers=?,result=?,status='submitted',updated_at=? WHERE id=? AND sbd=? AND status='active'").bind(JSON.stringify(answers),JSON.stringify(result),now,row.id,sbd).run()
    // SỔ SỰ KIỆN HỌC (GĐ 0): kết quả từng câu lấy đúng từ `chamDeChuan` vừa chấm.
    if(nop?.meta?.changes){await ghiSuKien(env,suKienLuyenDe(sbd,row.id,new Date(now).toISOString(),sources,answers,result.detail));expMoi=await expNhanSauNop(env,sbd,now)} // EXP HỌC TẬP MỚI: cờ tắt thì {}
    row=(await env.DB.prepare('SELECT * FROM luyen_de_2026 WHERE id=? AND sbd=?').bind(row.id,sbd).first<Row>())!
  }
  const bank=mergeAndStrip(sources,SO_CAU_CHUAN_2026)
  for(const qs of [bank.phanI,bank.phanII,bank.phanIII])for(const q of qs)q.hinhAnh=q.hinhAnh?.filter(h=>h.viTri!=='sau_loi_giai')
  return {ok:true,id:row.id,deadline:row.deadline,serverNow:now,status:row.status,answers:JSON.parse(row.answers),bank,matrix:MA_TRAN_HOA_2026.id,...(row.status==='submitted'?{result:JSON.parse(row.result||'{}'),solutions:sources}:{}),...expMoi}
}
