// @vitest-environment node
// C2: real Worker route, SQLite schema, synthetic R2; no production/runtime claim.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { taoD1That } from './_d1-that'
const NOW='2026-09-24T04:00:00Z', MA='C2-PH', I='FIX-I-1', II='FIX-II-1', Q='FIX-III-1'
const valid={ [I]:'A', [II]:'DSDS', [Q]:'12' }
beforeEach(()=>{vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(new Date(NOW))})
afterEach(()=>vi.useRealTimers())
function setup(stored=true) {
 const d=taoD1That()
 const bank:{cau:Record<string,unknown>[]}={cau:[
  {phan:'I',so:1,de:'Chọn đáp án.',pa:{A:'a',B:'b',C:'c',D:'d'},dap_an:'A'},
  {phan:'II',so:1,de:'Đúng sai.',y:{a:'a',b:'b',c:'c',d:'d'},dap_an:'DSDS'},
  {phan:'III',so:1,de:'Tính số mol.',dap_an:'12'},
 ]}
 const sheet={maCa:'CA',phieu:{cau:[{id:I,dapAn:'A'},{id:II,dapAn:'DSDS'},{id:Q,dapAn:'12'}] as Record<string,unknown>[]}}
 const save=()=>{d.objects.set('kho/FIX.json',structuredClone(bank));if(stored)d.objects.set(`phieu/${MA}.json`,structuredClone(sheet))}
 save()
 d.sql.prepare('INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES(?,?,?,?,?)').run('S1','Synthetic','12','mk',NOW)
 d.sql.prepare('INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES(?,?,?)').run('exp_moi','{"tu":"2020-01-01T00:00:00Z","toanBo":true}',NOW)
 const effects=()=>Object.fromEntries(['nop_khac_phuc','su_kien_hoc','nam_kt_cau','nam_kt_dang','exp_so','manh_khien_so','ke_hoach_ngay','game_v2_profile'].map(t=>[t,d.chup(t)]))
 const post=async(dapAn:Record<string,unknown>=valid)=>{
  const pending:Promise<unknown>[]=[]
  const r=await worker.fetch(new Request('https://local/goi',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'nopKhacPhuc',ma:MA,sbd:'S1',dapAn})}),d.env,{waitUntil(p){pending.push(p)}})
  const body=await r.json() as Record<string,any>;await Promise.all(pending)
  return {status:r.status,body}
 }
 const row=()=>d.sql.prepare('SELECT * FROM nop_khac_phuc WHERE khoa=?').get(`${MA}|S1`)
 const events=()=>d.sql.prepare('SELECT qid,ket_qua,lan FROM su_kien_hoc ORDER BY lan,qid').all()
 return {d,bank,sheet,save,effects,post,row,events}
}
function reject(r:{status:number;body:Record<string,any>},status=422){
 expect(r.status).toBe(status)
 expect(r.body).toMatchObject({ok:false,ma:status===422?'BTVN_GRADING_INPUT_INVALID':'BTVN_GRADING_MATERIAL_INVALID'})
 expect(r.body.expNhan).toBeUndefined()
}

describe('C2 independent remediation validates before all writes',()=>{
 it.each([true,false].flatMap(stored=>['12abc','sqrt(4)','1/2'].map(answer=>[stored,answer] as const)))('stored=%s invalid numeric answer=%s has no effects; corrected retry uses first history',async(stored,answer)=>{
  const s=setup(stored),before=s.effects()
  reject(await s.post({...valid,[Q]:answer}));expect(s.effects()).toEqual(before)
  expect((await s.post()).body).toMatchObject({ok:true,lanThu:1,soDung:stored?3:0,soCau:stored?3:0})
  expect(s.d.dem('su_kien_hoc')).toBe(3);expect(s.d.dem('exp_so')).toBeGreaterThan(0)
  expect(s.events().every(e=>e.lan===1&&e.ket_qua===1)).toBe(true)
  const after=s.effects();expect((await s.post()).body.ok).toBe(true);expect(s.effects()).toEqual(after)
 })
 it.each([true,false].flatMap(stored=>['12abc','sqrt(4)','missing','empty','whitespace'].map(kind=>[stored,kind] as const)))('stored=%s invalid/missing numeric key=%s rejects and restore permits retry',async(stored,kind)=>{
  const s=setup(stored),c=stored?s.sheet.phieu.cau[2]:s.bank.cau[2],key=stored?'dapAn':'dap_an'
  if(kind==='missing')delete c[key];else c[key]=kind==='empty'?'':kind==='whitespace'?'  ':kind
  s.save();const before=s.effects()
  for(const answer of [kind,'']){reject(await s.post({...valid,[Q]:answer}),500);expect(s.effects()).toEqual(before)}
  c[key]='12';s.save();expect((await s.post()).body.ok).toBe(true);expect(s.d.dem('su_kien_hoc')).toBe(3)
 })
 it.each([0,1])('stored I/II question %s with missing key rejects without dropping it from score',async index=>{
  const s=setup();delete s.sheet.phieu.cau[index].dapAn;s.save();const before=s.effects()
  reject(await s.post(),500);expect(s.effects()).toEqual(before)
 })
 it.each(['broken-json','missing-list','empty-list','missing-id','duplicate-id'])('present stored worksheet %s is invalid material, never a fallback to bank',async kind=>{
  const s=setup()
  if(kind==='broken-json')s.d.objects.set(`phieu/${MA}.json`,'{')
  else if(kind==='missing-list')s.d.objects.set(`phieu/${MA}.json`,{phieu:{}})
  else {if(kind==='empty-list')s.sheet.phieu.cau=[];if(kind==='missing-id')delete s.sheet.phieu.cau[2].id;if(kind==='duplicate-id')s.sheet.phieu.cau.push({...s.sheet.phieu.cau[2],dapAn:'13'});s.save()}
  const before=s.effects();reject(await s.post(),500);expect(s.effects()).toEqual(before)
 })
 it.each(['missing-bank','removed-question','partial-source'])('fallback %s cannot commit partial or empty success',async kind=>{
  const s=setup(false);let answers:Record<string,unknown>=valid
  if(kind==='missing-bank')s.d.objects.delete('kho/FIX.json')
  else if(kind==='removed-question'){s.bank.cau.pop();s.save()}
  else answers={...valid,'OTHER-III-1':'4'}
  const before=s.effects();reject(await s.post(answers),500);expect(s.effects()).toEqual(before)
  if(kind==='removed-question')s.bank.cau.push({phan:'III',so:1,de:'Tính số mol.',dap_an:'12'})
  if(kind==='partial-source')s.d.objects.set('kho/OTHER.json',{cau:[{phan:'III',so:1,de:'Tính x.',dap_an:'4'}]})
  s.save();expect((await s.post(answers)).body.ok).toBe(true);expect(s.d.dem('su_kien_hoc')).toBe(kind==='partial-source'?4:3)
 })
 it.each([true,false])('stored=%s invalid resubmission keeps existing row/history/EXP; valid changed retry remains allowed',async stored=>{
  const s=setup(stored);expect((await s.post()).body.ok).toBe(true);const before=s.effects()
  vi.setSystemTime(new Date('2026-09-24T04:01:00Z'))
  reject(await s.post({...valid,[Q]:'12abc'}));expect(s.effects()).toEqual(before)
  expect((await s.post({...valid,[Q]:'13'})).body.ok).toBe(true)
  expect(s.d.dem('su_kien_hoc')).toBe(6)
  expect(s.events().find(e=>e.qid===Q&&e.lan===2)?.ket_qua).toBe(0)
 })
 it.each([true,false])('stored=%s learner blanks and valid wrong numbers keep their meanings',async stored=>{
  for(const answer of ['', '---','13']){
   const s=setup(stored);expect((await s.post({...valid,[Q]:answer})).body.ok).toBe(true)
   expect(s.events().find(e=>e.qid===Q)?.ket_qua).toBe(answer==='13'?0:null)
   expect(s.row()).toMatchObject({so_cau:stored?3:0,so_dung:stored?2:0})
  }
 })
 it('stored worksheet authority ignores outside input and does not reload source bank',async()=>{
  const s=setup();s.d.objects.delete('kho/FIX.json')
  expect((await s.post({...valid,'OUTSIDE-III-9':'12abc'})).body).toMatchObject({ok:true,soDung:3,soCau:3})
  expect(s.d.dem('su_kien_hoc')).toBe(3)
 })
 it('fallback unrelated bank key missing is outside requested scope and remains irrelevant',async()=>{
  const s=setup(false);s.bank.cau.push({phan:'III',so:99,de:'Tính x.',dap_an:''});s.save()
  expect((await s.post()).body).toMatchObject({ok:true,soDung:0,soCau:0});expect(s.d.dem('su_kien_hoc')).toBe(3)
 })
 it('fallback empty request cannot create a successful empty submission',async()=>{
  const s=setup(false),before=s.effects();reject(await s.post({}));expect(s.effects()).toEqual(before)
 })
 it.each([true,false])('stored=%s unexpected R2 error stays generic500 with no writes',async stored=>{
  const s=setup(stored),get=s.d.env.DE.get,before=s.effects()
  s.d.env.DE.get=async key=>{if(key===(stored?`phieu/${MA}.json`:'kho/FIX.json'))throw new Error('synthetic R2 outage');return get(key)}
  const r=await s.post();expect(r.status).toBe(500);expect(r.body.ma).toBeUndefined();expect(s.effects()).toEqual(before)
 })
 it('fallback material is prepared once before UPSERT and the same result supplies events',async()=>{
  const s=setup(false),get=s.d.env.DE.get,prepare=s.d.env.DB.prepare.bind(s.d.env.DB);let reads=0,readsAtWrite=-1
  s.d.env.DE.get=async key=>{if(key==='kho/FIX.json')reads++;return get(key)}
  s.d.env.DB.prepare=sql=>{const st=prepare(sql);if(sql.includes('INSERT INTO nop_khac_phuc')){const run=st.run.bind(st);st.run=async()=>{readsAtWrite=reads;s.bank.cau[2].dap_an='13';s.save();return run()}}return st}
  expect((await s.post()).body.ok).toBe(true);expect(readsAtWrite).toBe(1);expect(reads).toBe(1)
  expect(s.events().find(e=>e.qid===Q)?.ket_qua).toBe(1)
 })
})
