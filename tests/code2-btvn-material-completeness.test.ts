// @vitest-environment node
// C1: server-assigned qids or declared source/part authority, never client keys/counts.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { taoD1That } from './_d1-that'
const NOW = '2026-09-24T04:00:00Z', B = 'C1-B'
const I = 'MAT-I-1', II = 'MAT-II-1', Q = 'MAT-III-1', R = 'MAT-III-2', BONUS = 'MAT-III-3'
const first = { [I]: 'A', [II]: 'DSDS', [Q]: '12' }, full = { ...first, [R]: '13' }
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date(NOW)) })
afterEach(() => vi.useRealTimers())
function setup(personal = false) {
  const d = taoD1That()
  const bank: {cau: Record<string, unknown>[]} = { cau: [
    { phan: 'I', so: 1, de: 'Chọn đáp án.', pa: { A: 'a', B: 'b', C: 'c', D: 'd' }, dap_an: 'A' },
    { phan: 'II', so: 1, de: 'Đúng sai.', y: { a: 'a', b: 'b', c: 'c', d: 'd' }, dap_an: 'DSDS' },
    { phan: 'III', so: 1, de: 'Tính số mol.', dap_an: '12' },
    { phan: 'III', so: 2, de: 'Tính khối lượng.', dap_an: '13' },
    { phan: 'III', so: 3, de: 'Tính thể tích.', dap_an: '14' },
  ] }
  const original = structuredClone(bank)
  const store = () => d.objects.set('kho/MAT.json', structuredClone(bank))
  store()
  d.sql.prepare('INSERT INTO btvn(ma_btvn,ma_ca,ma_de,so_cau,giao_luc,han_nop,da_xoa,cap_nhat_luc,ca_nhan) VALUES(?,?,?,?,?,?,0,?,?)').run(B, 'CA', 'MAT', 5, NOW, '2099-01-01T00:00:00Z', NOW, personal ? 1 : 0)
  d.sql.prepare('INSERT INTO btvn_em(khoa,ma_btvn,sbd,ho_ten) VALUES(?,?,?,?)').run(`${B}|S1`, B, 'S1', 'Synthetic')
  d.sql.prepare('INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES(?,?,?,?,?)').run('S1', 'Synthetic', '12', 'mk', NOW)
  d.sql.prepare('INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES(?,?,?)').run('exp_moi', '{"tu":"2020-01-01T00:00:00Z","toanBo":true}', NOW)
  d.sql.prepare('INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES(?,?,?)').run('btvn_ca_nhan', '{"thichNghi":false}', NOW)
  if (personal) {
    d.sql.prepare('UPDATE btvn_em SET so_chang=2,so_cau_em=4,chot_luc=?,lo_da_xong=0').run('2026-09-20T04:00:00Z')
    for (const [n, [qid, chang]] of ([[I, 0], [II, 0], [Q, 0], [R, 1], [BONUS, -1]] as [string, number][]).entries()) {
      d.sql.prepare('INSERT INTO btvn_em_cau(khoa,ma_btvn,sbd,qid,chang,nhan,thu_tu) VALUES(?,?,?,?,?,?,?)').run(`${B}|S1|${qid}`, B, 'S1', qid, chang, chang < 0 ? 'loi_cao' : 'loi', n)
      d.sql.prepare('INSERT INTO btvn_cau(ma_btvn,qid,thu_tu,phan,loi) VALUES(?,?,?,?,1)').run(B, qid, n, qid === I ? 'I' : qid === II ? 'II' : 'III')
    }
  }
  const mutate = (qid: string, kind: string) => {
    const index = bank.cau.findIndex(c => `MAT-${c.phan}-${c.so}` === qid)
    if (kind === 'removed') bank.cau.splice(index, 1)
    else if (kind === 'missing') delete bank.cau[index].dap_an
    else bank.cau[index].dap_an = kind === 'empty' ? '' : '   '
    store()
  }
  const restore = () => { bank.cau = structuredClone(original.cau); store() }
  const post = async (path: string, dapAn: Record<string, string> = {}, chiSo = 0) => {
    const pending: Promise<unknown>[] = []
    const res = await worker.fetch(new Request(`https://local${path}`, {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({maBtvn:B,ma:B,sbd:'S1',chiSo,dapAn,...(path === '/goi' ? {action:'nopKhacPhuc'} : {})})}), d.env, {waitUntil(p){pending.push(p)}})
    const body = await res.json() as Record<string, any>
    await Promise.all(pending)
    return {status:res.status,body}
  }
  const effects = () => Object.fromEntries(['btvn_em','btvn_em_cau','su_kien_hoc','nam_kt_cau','nam_kt_dang','exp_so','manh_khien_so','ke_hoach_ngay','game_v2_profile'].map(t=>[t,d.chup(t)]))
  return { d, bank, store, mutate, restore, post, effects }
}
function material(r: {status:number;body:Record<string,any>}) {
  expect(r.status).toBe(500)
  expect(r.body).toMatchObject({ok:false,ma:'BTVN_GRADING_MATERIAL_INVALID'})
  expect(r.body.ketQua).toBeUndefined()
  expect(r.body.nop).toBeUndefined()
}

describe('C1 BTVN material completeness before consumption', () => {
  it.each(['/btvn/nop','/goi','/btvn/xong-lo'].flatMap(path=>['missing','empty','whitespace'].map(kind=>[path,kind])))('normal %s rejects declared %s numeric key before writes; restore then retry', async(path,kind)=>{
    const s=setup();s.mutate(Q,kind);const before=s.effects()
    material(await s.post(path,full));expect(s.effects()).toEqual(before)
    s.restore();expect((await s.post(path,full)).body.ok).toBe(true)
    expect(s.d.dem('su_kien_hoc')).toBeGreaterThan(0)
    const after=s.effects();expect((await s.post(path,full)).body.ok).toBe(true);expect(s.effects()).toEqual(after)
  })
  it.each([I,II])('normal declared %s missing key is material failure, not silently excluded',async q=>{
    const s=setup();s.mutate(q,'missing');const before=s.effects()
    material(await s.post('/btvn/nop',full));expect(s.effects()).toEqual(before)
  })
  it.each(['stage','final','bonus'].flatMap(mode=>['missing','empty','removed'].map(kind=>[mode,kind])))('personal %s rejects %s assigned material; no lock/score/events/EXP',async(mode,kind)=>{
    const s=setup(true),q=mode==='bonus'?BONUS:Q;s.mutate(q,kind);const before=s.effects()
    const submit=()=>s.post(mode==='final'?'/btvn/nop':'/btvn/xong-lo',mode==='bonus'?{[BONUS]:'14'}:full,mode==='bonus'?2:0)
    material(await submit());expect(s.effects()).toEqual(before)
    s.restore();expect((await submit()).body.ok).toBe(true)
    expect(s.d.dem('su_kien_hoc')).toBeGreaterThan(0)
  })
  it.each(['normal','personal'])('%s missing R2 source is typed material failure before any mutation',async mode=>{
    for(const path of ['/btvn/nop','/goi','/btvn/xong-lo']) {
      const s=setup(mode==='personal');s.d.objects.delete('kho/MAT.json');const before=s.effects()
      material(await s.post(path,full));expect(s.effects()).toEqual(before)
      s.restore();expect((await s.post(path,full)).body.ok).toBe(true)
      expect(s.d.dem('su_kien_hoc')).toBeGreaterThan(0)
    }
  })
  it('last-stage finalization checks missing earlier assigned question before CAS and events',async()=>{
    const s=setup(true);expect((await s.post('/btvn/xong-lo',first)).body.ok).toBe(true)
    s.mutate(Q,'removed');const before=s.effects()
    material(await s.post('/btvn/xong-lo',{[R]:'13'},1));expect(s.effects()).toEqual(before)
    s.restore();expect((await s.post('/btvn/xong-lo',{[R]:'13'},1)).body.nop).toMatchObject({daNop:true,soDung:4,soCau:4})
  })
  it('saved optional question missing material blocks finalization, while unattempted optional stays optional',async()=>{
    const s=setup(true);s.mutate(BONUS,'removed')
    expect((await s.post('/btvn/nop',full)).body).toMatchObject({ok:true,soDung:4,soCau:4})
    const t=setup(true);t.d.sql.prepare('UPDATE btvn_em SET dap_an_json=?').run(JSON.stringify({[BONUS]:'14'}));t.mutate(BONUS,'removed');const before=t.effects()
    material(await t.post('/btvn/nop',full));expect(t.effects()).toEqual(before)
  })
  it('exact personal authority rejects assigned question that became essay; outside source errors do not block stage',async()=>{
    const s=setup(true)
    s.bank.cau.find(c=>c.phan==='III'&&c.so===1)!.type='essay';s.store();const before=s.effects()
    material(await s.post('/btvn/xong-lo',first));expect(s.effects()).toEqual(before)
    s.restore();s.bank.cau.push({phan:'III',so:99,de:'Tính x.',dap_an:''});s.store()
    expect((await s.post('/btvn/xong-lo',first)).body.ok).toBe(true)
  })
  it('normal source part filters, explicit/open essay exclusion and stale assignment counts remain valid',async()=>{
    const s=setup();s.d.sql.prepare('UPDATE btvn SET ma_de=?,so_cau=999').run('MAT-TN,MAT-TLN')
    s.mutate(II,'missing') // not in the server-assigned parts
    s.bank.cau.push({phan:'III',so:80,type:'essay',de:'Tính x.',dap_an:''})
    s.bank.cau.push({phan:'III',so:81,de:'Nêu ưu điểm của phương pháp chưng cất.',dap_an:''})
    s.bank.cau.push({phan:'III',so:82,de:'Theo em, dùng phương pháp nào?',dap_an:'kết tinh lại'})
    s.store()
    const r=await s.post('/btvn/nop',{[I]:'A',[Q]:'12',[R]:'13',[BONUS]:'14','OUTSIDE-III-1':'12abc'})
    expect(r.body).toMatchObject({ok:true,soCau:4,soDung:4})
  })
  it('normal aliases still resolve and correct student blanks are not server material errors',async()=>{
    const s=setup();const ma='MAT-TN,MAT-DS,MAT-TLN';s.d.sql.prepare('UPDATE btvn SET ma_de=?').run(ma)
    const r=await s.post('/btvn/nop',{[`${ma}-I-1`]:'A',[`${ma}-II-1`]:'DSDS',[`${ma}-III-1`]:''})
    expect(r.body).toMatchObject({ok:true,soCau:5,soDung:2})
  })
  it('no-payload lot and personal status do not newly load or reject missing material',async()=>{
    for(const personal of [false,true]){
      const s=setup(personal);s.d.objects.delete('kho/MAT.json')
      expect((await s.post('/btvn/xong-lo',{})).body.ok).toBe(true)
      expect(s.d.dem('su_kien_hoc')).toBe(0)
    }
  })
  it('normal deleted whole question without immutable manifest is not inferred from stale count or client qids',async()=>{
    const s=setup();s.mutate(Q,'removed')
    const r=await s.post('/btvn/nop',{[I]:'A',[II]:'DSDS',[R]:'13',[BONUS]:'14','MAT-III-999':'12'})
    expect(r.body).toMatchObject({ok:true,soCau:4,soDung:4}) // explicit legacy authority limitation, not claimed fixed
  })
})
