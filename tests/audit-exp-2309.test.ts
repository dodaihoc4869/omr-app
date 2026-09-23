// @vitest-environment node
// Regression: reward receipts, daily caps, verified assignments and earnings.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { docChuoiTruoc, docExpHomNay, ghiKhoanExpGame, ghiTiepSuc } from '../server/src/exp-d1'
import { nhanExpGame } from '../server/src/game-v2-hap-thu'
import { mom } from '../server/src/mom'
import { tinhExp, type VaoTinhExp } from '../server/src/exp-hoc-tap'
import type { Profile } from '../server/src/game-v2'
import { taoD1That, serialiseD1 } from './_d1-that'
vi.mock('../server/src/game-v2-auth', async orig => ({ ...(await orig<typeof import('../server/src/game-v2-auth')>()), gameIdentity: async () => 'S1' }))
const now = Date.parse('2026-09-23T05:00:00Z')
const ngay = '2026-09-23'
function fixture() {
  const d = taoD1That()
  serialiseD1(d.env)
  d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,cap_nhat_luc) VALUES('S1','Fixture','x')").run()
  d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('exp_moi',?,'x')").run(JSON.stringify({tu:'2026-09-01T00:00:00Z',toanBo:true}))
  d.sql.prepare("INSERT INTO game_v2_profile(sbd,revision,json,created_at) VALUES('S1',0,?,'x')").run(JSON.stringify({pet:'dat_quy',choice:false,legacy:null,cap:1,exp:0,wallet:0,earned:0,tower:1,mastery:[],arena:null,cutover:'2026-09-01T00:00:00Z',luatCap:2}))
  return d
}
const profile = (d:ReturnType<typeof fixture>):Profile => JSON.parse((d.sql.prepare("SELECT json FROM game_v2_profile WHERE sbd='S1'").get() as {json:string}).json)
const input = ():VaoTinhExp => ({ngay,suKien:[],metaCau:{},mucTieuCau:8,lenBac:[],khacPhuc:[],loXong:[],baiBtvnNop:[],momXong:[],diemCa:[],datNgay:null,dangRoiYeu:[],daCoKhoa:new Set()})
afterEach(()=>vi.useRealTimers())
describe('EXP audit 23/09: executable observed behavior',()=>{
  it('REGRESSION same game reward concurrent retry credits and consumes the cap once',async()=>{
    const d=fixture(), k={khoa:'audit|one',loai:'thu_thach',exp:10,ngay,luc:new Date(now).toISOString(),ghiChu:'fixture'}
    await Promise.all([ghiKhoanExpGame(d.env,'S1',k,now),ghiKhoanExpGame(d.env,'S1',k,now)])
    expect(d.dem('exp_so')).toBe(1)
    expect(profile(d).wallet).toBe(10)
    expect(profile(d).expGame?.da).toBe(10)
  })
  it('REGRESSION concurrent identical support has one reservation and receipt',async()=>{
    const d=fixture()
    await Promise.all([ghiTiepSuc(d.env,'S1',now,'one-support'),ghiTiepSuc(d.env,'S1',now,'one-support')])
    expect(d.dem('exp_so')).toBe(1)
    expect(profile(d).wallet).toBe(5)
    expect(profile(d).expGame?.da).toBe(5)
  })
  it('REGRESSION late prior-day reward preserves current-day cap',()=>{
    const p={expGame:{ngay,da:120}} as Profile
    expect(nhanExpGame(p,'2026-09-22',3)).toBe(3)
    expect(nhanExpGame(p,ngay,120)).toBe(0)
    expect(p.expGame).toMatchObject({ngay,da:120})
  })
  it('REGRESSION 10 prior achieved days receive the full streak award',async()=>{
    const d=fixture()
    for(let n=1;n<=10;n++){
      const day=new Date(now-n*86400000).toISOString().slice(0,10)
      d.sql.prepare("INSERT INTO ke_hoach_ngay(khoa,sbd,ngay,phien_ban,seed,ngan_sach_json,viec_json,canh_bao_json,ket_qua,la_ngay_nghi,so_su_kien,cap_nhat_luc) VALUES(?,'S1',?,1,1,'{}','{}','[]','dat',0,0,'x')").run('S1|'+day,day)
    }
    const streak=await docChuoiTruoc(d.env,'S1',ngay)
    expect(streak).toBe(10)
    const v=input(); v.datNgay={chuoi:streak+1,luc:new Date(now).toISOString()}
    expect(tinhExp(v).khoan.find(k=>k.loai==='chuoi')?.exp).toBe(20)
  })
  it('REGRESSION Mom start withholds key and review requires submission',async()=>{
    vi.useFakeTimers();vi.setSystemTime(now)
    const d=fixture()
    await mom(d.env,'create',{sbd:'S1',id:'audit_mom',dsCau:[{id:'CUSTOM-I-1',phan:'I',noiDung:'Fixture',dapAn:'A'}]}, {noiBo:true})
    const r=await mom(d.env,'start',{token:'fixture',id:'audit_mom'})
    expect((r.item as {dsCau:{dapAn:string}[]}).dsCau[0]?.dapAn).toBeUndefined()
    await expect(mom(d.env,'review',{token:'fixture',id:'audit_mom'})).rejects.toThrow('nộp bài')
  })
  it('REGRESSION invented qid cannot mint verified learning EXP',async()=>{
    vi.useFakeTimers();vi.setSystemTime(now)
    const d=fixture()
    await expect(mom(d.env,'create',{sbd:'S1',id:'audit_mom_credit',dsCau:[{id:'INVENTED-I-1',phan:'I',noiDung:'Fixture',dapAn:'A'}]})).rejects.toThrow()
    expect(d.dem('mom_bai')).toBe(0)
    expect(d.dem('su_kien_hoc')).toBe(0)
    expect(profile(d).wallet).toBe(0)
  })
  it('REGRESSION daily earnings include mastery EXP without recrediting wallet',async()=>{
    const d=fixture()
    d.sql.prepare("UPDATE game_v2_profile SET json=json_set(json,'$.wallet',10,'$.earned',10,'$.expGame',json(?)) WHERE sbd='S1'").run(JSON.stringify({ngay,da:10}))
    d.sql.prepare("INSERT INTO game_v2_reward(id,sbd,amount,created_at) VALUES('S1|dang|1','S1',10,?)").run(new Date(now).toISOString())
    expect((await docExpHomNay(d.env,'S1',now)).homNay).toBe(10)
    expect(profile(d).wallet).toBe(10)
  })
  it('question reward is daily by qid and mastery-independent: 16 full I0 questions then 25 percent',()=>{
    const v=input()
    v.suKien=Array.from({length:17},(_,i)=>({khoa:String(i).padStart(2,'0'),nguon:'btvn',maNguon:'B',qid:'Q-I-'+i,lan:1,ketQua:1 as const,luc:new Date(now+i*1000).toISOString()}))
    const r=tinhExp(v)
    expect(r.khoan.filter(k=>k.loai==='cau').reduce((a,k)=>a+k.exp,0)).toBe(33)
    expect(r.khoan.find(k=>k.loai==='dau_ngay')?.exp).toBe(10)
  })
})

it('different rewards concurrently share one 120 EXP daily allowance',async()=>{
  const d=fixture()
  const k={loai:'thu_thach',exp:80,ngay,luc:new Date(now).toISOString(),ghiChu:'fixture'}
  await Promise.all(['one','two'].map(khoa=>ghiKhoanExpGame(d.env,'S1',{...k,khoa},now)))
  expect(d.dem('exp_so')).toBe(2)
  expect(profile(d).wallet).toBe(120)
  expect(profile(d).expGame?.da).toBe(120)
})
it('a learning challenge is credited even before the first game profile exists',async()=>{
  const d=fixture()
  d.sql.exec("DELETE FROM game_v2_profile WHERE sbd='S1'")
  expect(await ghiKhoanExpGame(d.env,'S1',{khoa:'first-challenge',loai:'thu_thach',exp:10,ngay,luc:new Date(now).toISOString(),ghiChu:'fixture'},now)).toMatchObject({bat:true,exp:10})
  expect(profile(d).wallet).toBe(10)
  expect(profile(d).expGame?.da).toBe(10)
  expect(d.dem('exp_so')).toBe(1)
})
it('canonical MOM key overrides forged client key and knowledge metadata',async()=>{
  vi.useFakeTimers();vi.setSystemTime(now)
  const d=fixture()
  d.sql.exec("INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES('DE','Đề','12',1,'k',0,'v'); INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DE','v','x')")
  const q={qid:'DE-I-1',maDe:'DE',version:'v',group:'g1',phan:'I',text:'Đề thật',choices:['a','b','c','d'],ideas:[],hinhAnh:[],dang:'ES.A',tenDang:'Ester',mucDo:'biet',sao:0,kienThuc:['K'],correct:'B',solution:'Lời giải riêng',reviewed:true}
  d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)').run('DE',q.qid,'v','g1','ES.A',JSON.stringify(q))
  d.sql.prepare("INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,luc,ngay_vn) VALUES('before','S1',?,'btvn','B',1,1,'2026-09-01T05:00:00Z','2026-09-01')").run(q.qid)
  await mom(d.env,'create',{sbd:'S1',id:'canonical',dsCau:[{id:q.qid,dapAn:'A',dang:'FAKE',_khoaXacMinh:1}]})
  const start=await mom(d.env,'start',{id:'canonical'})
  const shown=(start.item as {dsCau:Record<string,unknown>[]}).dsCau[0]!
  expect(shown.text).toBe('Đề thật');expect(shown.dapAn).toBeUndefined();expect(shown.loiGiai).toBeUndefined()
  const submit=await mom(d.env,'submit',{id:'canonical',answers:{[q.qid]:'B'}})
  expect(submit.item).toMatchObject({diem:10,soCauDung:1})
  const review=await mom(d.env,'review',{id:'canonical'})
  expect((review.item as {dsCau:Record<string,unknown>[]}).dsCau[0]!.dapAn).toBe('B')
  d.sql.exec("DELETE FROM su_kien_hoc WHERE nguon='mom' AND ma_nguon='canonical'")
  expect((await mom(d.env,'submit',{id:'canonical',answers:{[q.qid]:'A'}})).item).toMatchObject({diem:10})
  expect(d.sql.prepare("SELECT ket_qua FROM su_kien_hoc WHERE nguon='mom' AND ma_nguon='canonical'").get()).toEqual({ket_qua:1})
  // Simulate an assignment stored before server-side key verification existed.
  await mom(d.env,'create',{sbd:'S1',id:'legacy-key',dsCau:[{id:q.qid,dapAn:'A'}]})
  const bank=(d.sql.prepare("SELECT bank_key FROM mom_bai WHERE id='legacy-key'").get() as {bank_key:string}).bank_key
  d.objects.set(bank,JSON.stringify([{id:q.qid,phan:'I',dapAn:'A',text:'Bản cũ'}]))
  await mom(d.env,'start',{id:'legacy-key'})
  expect((await mom(d.env,'submit',{id:'legacy-key',answers:{[q.qid]:'B'}})).item).toMatchObject({diem:10})
  expect(((await mom(d.env,'review',{id:'legacy-key'})).item as {dsCau:Record<string,unknown>[]}).dsCau[0]!.dapAn).toBe('B')
})
