import {it,expect} from 'vitest'
import worker from '../server/src/index'
import type {Env} from '../server/src/kieu'
async function assign(body:Record<string,unknown>){
 const writes:any[]=[]
 const env={MA_BI_MAT:'teacher',DE:{get:async()=>({body:JSON.stringify({cau:[{phan:'I',so:1,de:'Test'}]})})},DB:{prepare:(sql:string)=>({bind:(...args:any[])=>({sql,args,all:async()=>({results:sql.includes('FROM de_kho')?[{ma_de:'D',so_cau:1}]:sql.includes('FROM luot')?(args[0]==='A'?[{sbd:'1',ten:'One'},{sbd:'2',ten:'Two'}]:args[0]==='B'?[{sbd:'2',ten:'Two'},{sbd:'3',ten:'Three'}]:[]):sql.includes('FROM danh_sach')?args.map(sbd=>({sbd,ten:sbd})):[]})})}),batch:async(st:any[])=>{writes.push(...st);return []}}} as unknown as Env
 const r=await worker.fetch(new Request('https://app/btvvn/giao'.replace('btvvn','btvn'),{method:'POST',headers:{'content-type':'application/json','x-ma-bi-mat':'teacher'},body:JSON.stringify({dsMaDe:['D'],...body})}),env)
 return {result:await r.json(),students:writes.filter(x=>x.sql.includes('INSERT INTO btvn_em')).map(x=>x.args[2])}
}
it('keeps complete selected sessions and adds students only once',async()=>{
 const r=await assign({dsMaCa:['A','B'],dsSbdThem:['2','4','4']});expect(r.result).toMatchObject({ok:true,soEm:4});expect(r.students.sort()).toEqual(['1','2','3','4'])
})
it('empty extra selection still sends full session',async()=>{const r=await assign({dsMaCa:['A'],dsSbdThem:[]});expect(r.students).toEqual(['1','2'])})
it('supports extras without session and retains legacy selected-only requests',async()=>{expect((await assign({dsSbdThem:['4']})).students).toEqual(['4']);expect((await assign({dsMaCa:['A'],dsSbd:['2']})).students).toEqual(['2'])})
