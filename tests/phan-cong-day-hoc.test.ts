import {it,expect} from 'vitest'
import {phanCongDayHoc} from '../src/lib/phan-cong-day-hoc'
import type {CauChua,EmGoi} from '../src/lib/phan-cong'
const qs=Array.from({length:31},(_,i)=>({id:String(i),mucDo:'biet'} as CauChua))
const es=[0,0,0,9].map((n,i)=>({sbd:String(i),hoTen:String(i),coMat:true,soLanLenBang:n} as EmGoi))
it('phân toàn bộ câu, không trùng em trong một cặp, cân bằng lượt và ưu tiên ít lượt',()=>{
 const r=phanCongDayHoc(qs,es,()=>0.5)
 expect(r.phanCong.map(p=>p.cau.id)).toEqual(qs.map(q=>q.id))
 for(let i=0;i<30;i+=2)expect(r.phanCong[i].sbd).not.toBe(r.phanCong[i+1].sbd)
 expect(r.phanCong.slice(0,20).every(p=>p.sbd!=='3')).toBe(true)
 expect(r.chuaPhan).toHaveLength(0)
})
it('bốc ngẫu nhiên khi ngang lượt và loại học sinh vắng',()=>{
 expect(phanCongDayHoc(qs,es,()=>0).phanCong[0].sbd).not.toBe(phanCongDayHoc(qs,es,()=>0.99).phanCong[0].sbd)
 expect(phanCongDayHoc(qs,es.map((e,i)=>({...e,coMat:i!==0}))).phanCong.every(p=>p.sbd!=='0')).toBe(true)
 expect(()=>phanCongDayHoc(qs,es.slice(0,1))).toThrow()
})
