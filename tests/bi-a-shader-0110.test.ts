// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { taoBong, toBiLan, huongKhoiTao, CHU_T } from '../src/game/bi-a/ve-bi'
import { toBiLan as goc } from '../scripts/preview-bat-linh/ve-bi-baseline'

describe('tô bi tối ưu giữ nguyên điểm ảnh và hướng lăn', () => {
  it('bốn loại bi × ba cỡ × hai hướng bàn × 24 góc quay, mặt nạ chữ có tô và viền', () => {
    const chu = { to: Uint8Array.from({length:CHU_T*CHU_T},(_,i)=>(i*17)%256), vien:Uint8Array.from({length:CHU_T*CHU_T},(_,i)=>(i*31)%256) }
    for (const n of [14,30,48]) for (const k of ['ta','dich','chot','cai'] as const) for (const xoay of [false,true]) {
      const B = taoBong(n), truoc = new Uint8ClampedArray(n*n*4), sau = new Uint8ClampedArray(n*n*4)
      for(let i=0;i<24;i++) { const q=huongKhoiTao(`test-${i}`);goc(B,k,k==='cai'?null:chu,q,xoay,truoc);toBiLan(B,k,k==='cai'?null:chu,q,xoay,sau);expect(Buffer.compare(Buffer.from(sau.buffer),Buffer.from(truoc.buffer)),`${n}/${k}/${xoay}/${i}`).toBe(0) }
    }
  })
  it('đổi màu/kí hiệu trên cùng bộ bóng không giữ màu hoặc chữ cũ', () => {
    const B=taoBong(30), truoc=new Uint8ClampedArray(3600),sau=new Uint8ClampedArray(3600)
    for(const k of ['ta','chot','dich','cai','ta'] as const) { const q=huongKhoiTao(k);goc(B,k,null,q,false,truoc);toBiLan(B,k,null,q,false,sau);expect(sau).toEqual(truoc) }
  })
})
