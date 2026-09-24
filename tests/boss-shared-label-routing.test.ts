// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { gomDiemNhan, thuongNhan } from '../src/lib/uu-tien-nhan-kho'
import { chonCauChoPhuHuynh, type ChonCauVao } from '../server/src/parent-news-chon-cau'
const wrong = { sai: true, dung: false, daDungLai: false }
const good = { sai: false, dung: true, daDungLai: true }
const base = (): ChonCauVao => ({ soCan: 1, seed: 7, toiHan: [], dangYeu: [{ maDang: 'D.A.X', bac: 1 }], suKienGanDay: new Set(['eA', 'eB']), ungVien: [
 { qid:'eA', dang:'D.A.X', mucDo:'hieu', kienThuc:['A'] },
 { qid:'eB', dang:'D.A.X', mucDo:'hieu', kienThuc:['B'] },
 { qid:'a', dang:'D.A.X', mucDo:'hieu', kienThuc:[' A ', 'A'] },
 { qid:'b', dang:'D.A.X', mucDo:'hieu', kienThuc:['B'] },
] })
describe('Boss independent shared label routing', () => {
 it('selects a different unseen question for different learners with same difficulty/type', () => {
   const v = base()
   expect(chonCauChoPhuHuynh({...v, lichSuNhan:new Map([['eA',wrong]])})[0].qid).toBe('a')
   expect(chonCauChoPhuHuynh({...v, lichSuNhan:new Map([['eB',wrong]])})[0].qid).toBe('b')
 })
 it('cannot override recent group exclusion or difficulty ceiling', () => {
   const v = base(); v.ungVien.find(q=>q.qid==='a')!.group='recent'
   expect(chonCauChoPhuHuynh({...v,nhomGanDay:new Set(['recent']),lichSuNhan:new Map([['eA',wrong]])})[0].qid).toBe('b')
   v.ungVien.find(q=>q.qid==='a')!.mucDo='van_dung'
   expect(chonCauChoPhuHuynh({...v,lichSuNhan:new Map([['eA',wrong]])})[0].qid).toBe('b')
 })
 it('does not displace an earlier scheduled review', () => {
   const v=base();v.toiHan=[{qid:'a',mocOnKe:'2026-09-23',lanSai:1},{qid:'b',mocOnKe:'2026-09-20',lanSai:1}]
   expect(chonCauChoPhuHuynh({...v,lichSuNhan:new Map([['eA',wrong]])})[0].qid).toBe('b')
 })
 it('normalizes labels, subtracts successful evidence order independently and suppresses mastered bonus', () => {
   const qs=[{qid:'a',kienThuc:[' A ','A',null]},{qid:'b',kienThuc:['A']},{qid:'c',kienThuc:['A']}]
   const h=new Map([['a',wrong],['b',wrong],['c',good]])
   expect(gomDiemNhan(qs,h).get('A')).toBe(0)
   expect([...gomDiemNhan([...qs].reverse(),h)]).toEqual([...gomDiemNhan(qs,h)])
   expect(thuongNhan(qs[0],new Map([['A',9]]))).toBe(4)
   expect(thuongNhan(qs[0],new Map([['A',9]]),true)).toBe(0)
 })
 it('missing metadata gives exact legacy order for every seed', () => {
   for(let seed=0;seed<30;seed++){
     const v=base(); v.seed=seed; v.ungVien=v.ungVien.map(({kienThuc,...q})=>q)
     expect(chonCauChoPhuHuynh({...v,lichSuNhan:new Map([['eA',wrong]])})).toEqual(chonCauChoPhuHuynh(v))
   }
 })
})

import { chooseSessionWithRoles, chooseLuotMoi, type PrivateQuestion, type Evidence, type Attempt } from '../src/game/than-thu-v2/core'
const now = Date.parse('2026-09-24T06:00:00Z')
const pool = (): PrivateQuestion[] => Array.from({length:12},(_,i)=>({qid:`q${i}`,maDe:'D',version:'v',group:`g${i}`,phan:'I',text:'test',choices:['A','B','C','D'],ideas:[],hinhAnh:[],dang:'D.A.X',tenDang:'D',mucDo:'biet',sao:1,kienThuc:[i<6?'A':'B'],correct:'A',solution:'',reviewed:true}))
const ev = (label:string,wrong=true): Evidence => ({qid:'historical',group:'historical',dang:'D.A.X',mucDo:'biet',kienThuc:[label],wrong,date:'2026-09-01',ca:'C'})
describe('Boss independent all personal game selectors',()=>{
 it('no history is not wrong evidence: metadata alone must not change ranking',()=>{
   const p=pool();p[0].kienThuc=['UNIQUE'];for(let i=1;i<p.length;i++)p[i].kienThuc=['COMMON']
   for(let k=0;k<8;k++){
    const t=now+k*3600000
    const a=chooseSessionWithRoles(p,[],[],[],'adventure',t).map(x=>x.q.qid)
    const b=chooseSessionWithRoles(p.map(q=>({...q,kienThuc:[]})),[],[],[],'adventure',t).map(x=>x.q.qid)
    expect(a).toEqual(b)
   }
 })
 it('uses actual historical labels even when the old question is absent from eligible pool',()=>{
   for(const label of ['A','B']){
    const e=[ev(label)]
    expect(chooseSessionWithRoles(pool(),e,[],[],'adventure',now)[0].q.kienThuc).toEqual([label])
    expect(chooseLuotMoi(pool(),e,[],[],{loai:'khoi_dong',cap:1,now})[0].q.kienThuc).toEqual([label])
   }
 })
 it('latest wrong after a correct answer restores weakness; latest correction removes it',()=>{
   const at:Attempt={id:'1',session:'1',qid:'historical',group:'historical',dang:'D.A.X',mucDo:'biet',correct:false,assisted:false,at:Date.parse('2026-09-22T01:00:00Z'),novel:false}
   expect(chooseSessionWithRoles(pool(),[ev('A',false)],[at],[],'adventure',now)[0].q.kienThuc).toEqual(['A'])
   const p=pool(), fixed={...at,correct:true}
   expect(chooseSessionWithRoles(p,[ev('A')],[fixed],[],'adventure',now).map(x=>x.q.qid)).toEqual(chooseSessionWithRoles(p.map(q=>({...q,kienThuc:[]})),[ev('A')],[fixed],[],'adventure',now).map(x=>x.q.qid))
 })
 it('label priority never bypasses blocked qid or group',()=>{
   const p=pool(),block=new Set(p.filter(q=>q.kienThuc[0]==='A').map(q=>q.group))
   const r=chooseLuotMoi(p,[ev('A')],[],[],{loai:'khoi_dong',cap:1,now,blocked:block})
   expect(r.length).toBeGreaterThan(0);expect(r.every(x=>x.q.kienThuc[0]==='B')).toBe(true)
 })
})
