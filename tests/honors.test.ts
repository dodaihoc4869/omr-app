import {it,expect} from 'vitest'
import {rankHonors,honorDay} from '../server/src/honors'
const q=(sbd:string,score:number,seconds:number)=>({sbd,ho_ten:sbd,tong:score,vao_luc:'2026-09-16T10:00:00Z',nop_luc:new Date(Date.parse('2026-09-16T10:00:00Z')+seconds*1000).toISOString()})
it('điểm cao trước, bằng điểm chọn thời gian nhanh hơn',()=>{const r=rankHonors([q('A',9,300),q('B',10,400),q('C',9,200),q('D',8,100)]);expect(r.map(x=>x.name)).toEqual(['B','C','A'])})
it('mỗi em một vị trí, không công khai SBD',()=>{const r=rankHonors([q('A',8,100),q('A',10,200),q('B',9,300)]);expect(r).toHaveLength(2);expect(r[0].score).toBe(10);expect(r[0]).not.toHaveProperty('key');expect(r[0]).not.toHaveProperty('sbd')})
it('mốc 00:01 mới chốt ngày hôm trước',()=>{expect(honorDay(Date.parse('2026-09-16T17:00:59Z'))).toBe('2026-09-15');expect(honorDay(Date.parse('2026-09-16T17:01:00Z'))).toBe('2026-09-16')})
it('không coi thiếu thời gian là nhanh nhất, không bịa đủ 3 người',()=>{expect(rankHonors([{...q('A',9,100),vao_luc:null},q('B',9,200)]).map(x=>x.name)).toEqual(['B','A']);expect(rankHonors([])).toEqual([])})
