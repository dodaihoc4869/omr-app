// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { taoD1That } from './_d1-that'
import { docPhongChoDongThoi } from '../server/src/phong-cho-dong-thoi'
import type { Env } from '../server/src/kieu'

function dung() {
  const d=taoD1That();d.sql.exec("INSERT INTO ca(ma_ca,ten_ca,trang_thai,phong_cho,cap_nhat_luc) VALUES('C1','Ca thử','mo',1,'x'),('C2','Ca khác','dong',0,'x')")
  let soDoc=0
  const DB={prepare(q:string){const st=d.env.DB.prepare(q);const w={bind(...args:unknown[]){st.bind(...args);return w},async first(){soDoc++;await Promise.resolve();return st.first()}};return w}}
  return {d,env:{...d.env,DB} as unknown as Env,soDoc:()=>soDoc}
}
describe('phòng chờ đông học sinh: chia sẻ truy vấn đang bay, bỏ ngay khi xong',()=>{
  it('300 lượt đồng thời cùng ca/cùng isolate chỉ một SELECT, kết quả từng lượt đầy đủ',async()=>{
    const x=dung();const rs=await Promise.all(Array.from({length:300},()=>docPhongChoDongThoi(x.env,'C1')))
    expect(x.soDoc()).toBe(1);expect(rs).toHaveLength(300);for(const r of rs)expect(r).toMatchObject({trang_thai:'mo',phong_cho:1,bat_dau_thi_luc:null})
    // Xong lượt đọc trước, thầy bắt đầu ⇒ lượt tiếp phải thấy ngay, không TTL.
    x.d.sql.exec("UPDATE ca SET bat_dau_thi_luc='2026-10-01T00:00:00Z',phong_cho=0 WHERE ma_ca='C1'")
    expect(await docPhongChoDongThoi(x.env,'C1')).toMatchObject({phong_cho:0,bat_dau_thi_luc:'2026-10-01T00:00:00Z'});expect(x.soDoc()).toBe(2)
  })
  it('ca khác, DB/isolate khác và ca không tồn tại không lẫn dữ liệu',async()=>{
    const a=dung(),b=dung();b.d.sql.exec("UPDATE ca SET trang_thai='dong' WHERE ma_ca='C1'")
    const rs=await Promise.all([docPhongChoDongThoi(a.env,'C1'),docPhongChoDongThoi(a.env,'C2'),docPhongChoDongThoi(b.env,'C1'),docPhongChoDongThoi(a.env,'khong')])
    expect(rs.map(r=>r?.trang_thai??null)).toEqual(['mo','dong','dong',null]);expect(a.soDoc()).toBe(3);expect(b.soDoc()).toBe(1)
  })
  it('5.000 lượt chia 10 isolate dùng 10 SELECT; đợt kế tiếp vẫn đọc mới',async()=>{
    const ds=Array.from({length:10},()=>dung())
    const rs=await Promise.all(Array.from({length:5000},(_,i)=>docPhongChoDongThoi(ds[i%10].env,'C1')))
    expect(rs).toHaveLength(5000);expect(rs.every(r=>r?.phong_cho===1)).toBe(true)
    expect(ds.reduce((n,x)=>n+x.soDoc(),0)).toBe(10)
    for(const x of ds)x.d.sql.exec("UPDATE ca SET phong_cho=0 WHERE ma_ca='C1'")
    const moi=await Promise.all(ds.map(x=>docPhongChoDongThoi(x.env,'C1')))
    expect(moi.every(r=>r?.phong_cho===0)).toBe(true);expect(ds.reduce((n,x)=>n+x.soDoc(),0)).toBe(20)
  })
  it('lỗi D1 không lưu promise hỏng; lần sau đọc lại được',async()=>{
    const x=dung();const prepare=x.env.DB.prepare.bind(x.env.DB);let lan=0
    x.env.DB.prepare=((q:string)=>{const st=prepare(q);const first=st.first.bind(st);st.first=(async()=>{if(++lan===1)throw new Error('D1 thử lỗi');return first()}) as typeof st.first;return st}) as typeof x.env.DB.prepare
    await expect(docPhongChoDongThoi(x.env,'C1')).rejects.toThrow('D1 thử lỗi');expect(await docPhongChoDongThoi(x.env,'C1')).toMatchObject({trang_thai:'mo'})
  })
})
