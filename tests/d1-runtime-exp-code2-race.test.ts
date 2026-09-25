// Local workerd + actual D1 sessions/batches. Synthetic data; no serialiseD1, no production.
import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import type { Env } from '../server/src/kieu'
import { phatAnhChup, type AnhChupNhiemVu } from '../server/src/cnh-exp-task'
import { capDieuKhienNopBai, nopBaiCore, ngayHocVN } from '../server/src/cnh-exp-submit'
import { quyetToanQuyenCore } from '../server/src/cnh-exp-ledger'
const ENV=env as unknown as Env, DB=ENV.DB, DAY=ngayHocVN(1500)
beforeAll(async()=>{
 const all=(env as unknown as {LUOC_DO_SQL:string[]}).LUOC_DO_SQL
 for(const table of ['cnh_exp_account','cnh_exp_task','cnh_exp_attempt_control']){
  const found=all.filter(s=>new RegExp(`CREATE TABLE IF NOT EXISTS\\s+${table}\\s*\\(`,'i').test(s));expect(found).toHaveLength(1)
  const sql=found[0].replace(/\/\*[\s\S]*?\*\//g,'\n').split('\n').filter(l=>!/^\s*--/.test(l)).map(l=>l.replace(/\s--.*$/,'')).join('\n')
  const parts=sql.split(/;\s*(?:\n|$)/).map(s=>s.trim()).filter(s=>/[A-Za-z]/.test(s))
  await DB.batch(parts.map(s=>DB.prepare(s)))
 }
})
async function setup(achieved=0){
 const studentId=`M08-${crypto.randomUUID()}`
 await DB.batch([
  DB.prepare('INSERT INTO cnh_exp_account(student_id,wallet_exp,earned_exp,revision) VALUES(?,0,0,0)').bind(studentId),
  DB.prepare('INSERT INTO cnh_exp_day(student_id,learning_day,policy_version,raw_core,achieved,core_paid,compensation_paid,revision) VALUES(?,?,?,0,?,0,0,0)').bind(studentId,DAY,'CNH-1.0',achieved),
 ])
 const issue=async(attemptId:string)=>{
  const s:AnhChupNhiemVu={studentId,taskId:attemptId,attemptId,qid:attemptId,questionVersion:'v1',contentGroup:attemptId,familyId:null,skillIds:['SK'],difficulty:1,part:'I',purpose:'maintenance',bucket:'core',planId:'P',planRevision:1,policy:{version:'CNH-1.0',curriculumRevision:1,bankRevision:1,protectionRevision:1,learnerRevision:1},issuedAt:1000,expiresAt:100000,expectedSeconds:60,grading:{key:'C',orderMapping:{A:'A',B:'B',C:'C',D:'D'},gradingPolicy:{kind:'part-i-option-id-v1'}}}
  await phatAnhChup(DB,s,900)
  await capDieuKhienNopBai(DB,{studentId,attemptId,assistance:'none',released:true,active:true})
 }
 const submit=(attemptId:string,requestId:string,rawAnswer='C')=>nopBaiCore(ENV,{studentId,attemptId,requestId,rawAnswer,receivedAt:1500})
 const settle=(requestId:string)=>quyetToanQuyenCore(ENV,{studentId,learningDay:DAY,requestId,requestHash:`settle:${DAY}`})
 const state=async()=>({
  account:await DB.prepare('SELECT wallet_exp,earned_exp,revision FROM cnh_exp_account WHERE student_id=?').bind(studentId).first(),
  day:await DB.prepare('SELECT raw_core,core_paid,revision FROM cnh_exp_day WHERE student_id=?').bind(studentId).first(),
  ledger:await DB.prepare('SELECT COUNT(*) AS n,COALESCE(SUM(amount),0) AS amount FROM cnh_exp_grant_ledger WHERE student_id=?').bind(studentId).first(),
  accepted:(await DB.prepare('SELECT attempt_id,raw FROM cnh_exp_accepted WHERE student_id=? ORDER BY attempt_id').bind(studentId).all()).results,
 })
 return {studentId,issue,submit,settle,state}
}
describe('Code2 M08 P07 cross-command concurrent retry audit',()=>{
 it('submit and settle retries share the day cap and wallet transaction without lost increments',async()=>{
  const s=await setup(1);await s.issue('A');await s.issue('B')
  const all=await Promise.all([s.submit('A','submit-A'),s.submit('A','submit-A'),s.submit('B','submit-B'),s.submit('B','submit-B'),s.settle('settle'),s.settle('settle')])
  expect(all[0]).toEqual(all[1]);expect(all[2]).toEqual(all[3]);expect(all[4]).toEqual(all[5])
  const st=await s.state();expect(st.account).toMatchObject({wallet_exp:220,earned_exp:220,revision:3});expect(st.day).toMatchObject({raw_core:6,core_paid:220,revision:3});expect(st.ledger).toEqual({n:3,amount:220});expect(st.accepted).toHaveLength(2)
  expect(await s.submit('A','submit-A')).toEqual(all[0]);expect(await s.settle('settle')).toEqual(all[4]);expect(await s.state()).toEqual(st)
 },30000)
 it('same request key with different concurrent answers has exactly one receipt and one accepted price',async()=>{
  const s=await setup();await s.issue('A')
  const all=await Promise.allSettled([s.submit('A','R','C'),s.submit('A','R','A')])
  const ok=all.filter(r=>r.status==='fulfilled');const bad=all.filter(r=>r.status==='rejected');expect(ok).toHaveLength(1);expect(bad).toHaveLength(1)
  expect((bad[0] as PromiseRejectedResult).reason).toMatchObject({ma:'IDEMPOTENCY_CONFLICT'})
  const receipt=(ok[0] as PromiseFulfilledResult<Awaited<ReturnType<typeof s.submit>>>).value
  const st=await s.state();expect(st.account).toMatchObject({wallet_exp:receipt.grant,earned_exp:receipt.grant,revision:1});expect(st.ledger).toEqual({n:1,amount:receipt.grant});expect(st.accepted).toHaveLength(1)
  expect(await s.submit('A','new-key',receipt.correct?'C':'A')).toEqual(receipt);expect(await s.state()).toEqual(st)
 },30000)
 it('accepted-attempt alias racing a fresh attempt on the same key cannot steal or double a grant',async()=>{
  const s=await setup();await s.issue('A');await s.issue('B');const original=await s.submit('A','original')
  const all=await Promise.allSettled([s.submit('A','shared'),s.submit('B','shared')])
  expect(all.filter(r=>r.status==='fulfilled')).toHaveLength(1)
  const rejected=all.find(r=>r.status==='rejected') as PromiseRejectedResult;expect(rejected.reason).toMatchObject({ma:'IDEMPOTENCY_CONFLICT'})
  expect(await s.submit('A','alias')).toEqual(original)
  const b=await s.submit('B','repair-B');expect(b.raw).toBe(3)
  const st=await s.state();expect(st.account).toMatchObject({wallet_exp:6,earned_exp:6,revision:2});expect(st.day).toMatchObject({raw_core:6,core_paid:6,revision:2});expect(st.ledger).toEqual({n:2,amount:6});expect(st.accepted).toHaveLength(2)
  expect(await s.submit('B','repair-B')).toEqual(b);expect(await s.state()).toEqual(st)
 },30000)
 it('lost-response submit replays its original receipt while a concurrent settlement pays newly achieved entitlement once',async()=>{
  const s=await setup();await s.issue('A');const original=await s.submit('A','lost-response')
  await DB.prepare('UPDATE cnh_exp_day SET achieved=1,revision=revision+1 WHERE student_id=?').bind(s.studentId).run()
  const all=await Promise.all([s.submit('A','lost-response'),s.submit('A','new-retry'),s.settle('achieved'),s.settle('achieved')])
  expect(all[0]).toEqual(original);expect(all[1]).toEqual(original);expect(all[2]).toEqual(all[3]);expect(all[2].grant).toBe(217)
  const st=await s.state();expect(st.account).toMatchObject({wallet_exp:220,earned_exp:220,revision:2});expect(st.day).toMatchObject({raw_core:3,core_paid:220,revision:3});expect(st.ledger).toEqual({n:2,amount:220});expect(st.accepted).toHaveLength(1)
 },30000)
})
