// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { chonBoCuaEm, type CauGiao, type HoSoEmRut } from '../src/lib/btvn-nang-do'
import { chuanHoaCauGiao, docBaiNangDo, docHoSoRut } from '../server/src/btvn-nang-do-d1'
import { dung, giao, gio, BAY_GIO, maBtvn, mo, boCuaEm } from './_btvn-nang-do-mau'
import { goiWorker } from './_d1-that'

afterEach(() => vi.useRealTimers())
const q = (qid: string, skill: string, mucDo: 0|2 = 0): CauGiao => ({ qid, dang:'D1', chuyenDe:'C1', mucDo, sao:0, phan:'I', kienThuc:[skill] })
const wrong = { trangThai:'moi_sai' as const, ngayDungKhacNhau:0, lanSai:1 }
const recovered = { trangThai:'da_khac_phuc' as const, ngayDungKhacNhau:2, lanSai:1 }
const ns = { soNgay:1, cauMoiNgay:1, onLaiMoiNgay:0 }
const pool = [q('A','A'),q('B','B'),...Array.from({length:4},(_,i)=>q(`wrong${i}`,'A',2))]
const profile: HoSoEmRut = { dang:{}, cau:Object.fromEntries(pool.slice(2).map(c=>[c.qid,wrong])) }
const chosen = (c: CauGiao[], h:HoSoEmRut, seed='boss') => chonBoCuaEm(c,[],h,ns,seed).chang.flat()

it('existing labels transfer wrong-question evidence to a new eligible question, with same history and seed',()=>{
  // The wrong source questions are above the allowed difficulty and cannot be chosen directly.
  expect(chosen(pool,profile)).toEqual(['A'])
  const reverse = pool.map(c=>({...c,kienThuc:c.kienThuc?.map(k=>k==='A'?'B':'A')}))
  const h:HoSoEmRut={dang:{},cau:{...profile.cau}}
  // Change labels on only the two eligible candidates: evidence remains skill A.
  reverse.slice(2).forEach(c=>{c.kienThuc=['A']})
  expect(chosen(reverse,h)).toEqual(['B'])
  expect(chosen([...pool].reverse(),profile)).toEqual(['A'])
})

it('normalization is consistent, duplicates do not inflate scores, input is not mutated',()=>{
  const dirty=pool.map(c=>({...c,kienThuc:[` ${c.kienThuc![0]} `,c.kienThuc![0],'',null,{}] as any}))
  const before=JSON.stringify(dirty)
  expect(chosen(dirty,profile)).toEqual(chosen(pool,profile))
  expect(JSON.stringify(dirty)).toBe(before)
  const clean=chuanHoaCauGiao([{qid:'A',phan:'I',pa:{A:'a',B:'b',C:'c',D:'d'},dap_an:'A',kienThuc:[' A ','A','',{},null]}],[])
  expect(clean.cau[0].kienThuc).toEqual(['A'])
})

it('mastered optional questions cannot be revived by skill bonus; teacher mandatory remains',()=>{
  const h:HoSoEmRut={dang:{},cau:{...profile.cau,A:recovered}}
  expect(chosen(pool,h)).toEqual(['B'])
  const pinned=pool.map(c=>({...c,ghim:c.qid==='A'}))
  expect(chonBoCuaEm(pinned,['A'],h,ns,'boss').chang.flat()).toContain('A')
})

it('same-skill diversity does not remove eligible work, or duplicate questions',()=>{
  const many=Array.from({length:12},(_,i)=>q(`new${i}`,'same'))
  const b=chonBoCuaEm([...many,many[0]],[],{dang:{},cau:{}},{...ns,cauMoiNgay:6},'boss')
  expect(b.chang.flat()).toHaveLength(6)
  expect(new Set(b.chang.flat()).size).toBe(6)
})

it('real assignment route keeps labels, student history isolation, preview equality and resume after history changes',async()=>{
  gio(BAY_GIO)
  const d=dung(2)
  const raw=Array.from({length:68},(_,i)=>({phan:'I',so:i+1,de:`Q${i+1}`,pa:{A:'a',B:'b',C:'c',D:'d'},dap_an:'A',chuyen_de:'C1',muc_do:i<8?'van_dung':'biet',dang:{ma:'D1',ten:'D1'},kienThuc:[i<4?'A':i<8?'B':i%2?'A':'B'],can_chua:{sao:0}}))
  d.objects.set('kho/DE1.json',{cau:raw})
  for(const [sbd,start] of [['S1',1],['S2',5]] as const){
    for(let i=start;i<start+4;i++)d.sql.prepare("INSERT INTO nam_kt_cau(khoa,sbd,qid,chuyen_de,lan_gap,lan_sai,lan_trong,dung_lien_tiep,ngay_dung_khac_nhau,nguon_cuoi,luc_cuoi,trang_thai,can_day_lai,cap_nhat_luc) VALUES(?,?,?,'C1',1,1,0,0,0,'game','2026-09-21','moi_sai',0,'2026-09-21')").run(`${sbd}|DE1-I-${i}`,sbd,`DE1-I-${i}`)
  }
  const g=await giao(d,{cau:[],hatGiong:'boss-route',hanNop:'2026-09-23T03:00:00Z'})
  expect(g.ok).toBe(true)
  const id=maBtvn(d)
  const b=await docBaiNangDo(d.env,id,'DE1',true)
  expect(b).not.toBeNull()
  expect(b!.cau.find(c=>c.qid==='DE1-I-1')!.kienThuc).toEqual(['A'])
  const h=await docHoSoRut(d.env,['S1','S2'],b!.cau,Date.now())
  expect(Object.keys(h.get('S1')!.hoSo.cau).sort()).toEqual([1,2,3,4].map(i=>`DE1-I-${i}`))
  expect(Object.keys(h.get('S2')!.hoSo.cau).sort()).toEqual([5,6,7,8].map(i=>`DE1-I-${i}`))
  for(const sbd of ['S1','S2']){
    const prev=await goiWorker(worker,d.env,'/btvn/xem-truoc',{maBtvn:id,dsSbd:[sbd],sbdChiTiet:sbd},true)
    expect(prev.ok).toBe(true)
    const issue=await mo(d,sbd)
    expect(issue.ok).toBe(true)
    const rows=boCuaEm(d,sbd)
    const actual=rows.filter(c=>c.chang>=0).map(c=>c.qid)
    expect(actual.length).toBeGreaterThan(0)
    expect(prev.chiTiet.chang.flat()).toEqual(actual)
    expect(actual.every(id=>b!.cau.some(c=>c.qid===id))).toBe(true)
    expect(new Set(actual).size).toBe(actual.length)
    d.sql.prepare("UPDATE nam_kt_cau SET trang_thai='da_khac_phuc',ngay_dung_khac_nhau=5 WHERE sbd=?").run(sbd)
    const resume=await mo(d,sbd)
    expect(resume.ok).toBe(true)
    expect(boCuaEm(d,sbd)).toEqual(rows)
    expect(resume.chang).toEqual(issue.chang)
  }
})
