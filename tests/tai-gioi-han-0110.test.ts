// @vitest-environment node
import { it, expect } from 'vitest'
import { taiGioiHan } from '../src/lib/tai-gioi-han'
it('20 chiến dịch, tối đa 4 yêu cầu cùng lúc, kết quả đúng thứ tự dù trả ngược',async()=>{
 let dang=0,max=0
 const r=await taiGioiHan(Array.from({length:20},(_,i)=>i),async i=>{dang++;max=Math.max(max,dang);await new Promise(ok=>setTimeout(ok,20-i));dang--;return i*3})
 expect(max).toBe(4);expect(r).toEqual(Array.from({length:20},(_,i)=>i*3));expect(dang).toBe(0)
})
it('mảng rỗng không gọi API; giới hạn không hợp lệ vẫn có đường hoàn thành',async()=>{
 expect(await taiGioiHan([],async()=>{throw Error('không được gọi')})).toEqual([])
 expect(await taiGioiHan([1,2],async x=>x,0)).toEqual([1,2])
})
