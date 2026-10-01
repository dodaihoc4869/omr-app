// @vitest-environment node
import { describe, it, expect, vi, afterEach } from 'vitest'
import { taoD1That } from './_d1-that'
import { docPhongChoDongThoi, xoaDemPhongCho, HAN_PHONG_CHO_MS } from '../server/src/phong-cho-dong-thoi'
import type { Env } from '../server/src/kieu'
function dung() {
  const d=taoD1That();d.sql.exec("INSERT INTO ca(ma_ca,ten_ca,trang_thai,phong_cho,cap_nhat_luc) VALUES('C1','Ca thử','mo',1,'x'),('C2','Ca khác','dong',0,'x')")
  let soDoc=0
  const DB={prepare(q:string){const st=d.env.DB.prepare(q);const w={bind(...args:unknown[]){st.bind(...args);return w},async first(){soDoc++;await Promise.resolve();return st.first()}};return w}}
  return {d,env:{...d.env,DB} as unknown as Env,soDoc:()=>soDoc}
}
afterEach(()=>vi.useRealTimers())
describe('phòng chờ: đệm giá trị đã hoàn tất, I/O riêng từng request',()=>{
  it('300 lượt lạnh đợi bằng timer riêng; 300 lượt ấm không đọc thêm và không lộ đề/đáp án',async()=>{
    const x=dung();const rs=await Promise.all(Array.from({length:300},()=>docPhongChoDongThoi(x.env,'C1')))
    expect(x.soDoc()).toBe(1);for(const r of rs)expect(r).toEqual({trang_thai:'mo',phong_cho:1,bat_dau_thi_luc:null})
    const am=await Promise.all(Array.from({length:300},()=>docPhongChoDongThoi(x.env,'C1')))
    expect(x.soDoc()).toBe(1);expect(am).toEqual(rs)
    am[0]!.trang_thai='sua-ben-ngoai';expect((await docPhongChoDongThoi(x.env,'C1'))?.trang_thai).toBe('mo')
  })
  it('thầy đổi ca: bỏ đệm ngay; isolate khác hết hạn trong 250 ms',async()=>{
    vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(10000)
    const x=dung();await docPhongChoDongThoi(x.env,'C1')
    x.d.sql.exec("UPDATE ca SET phong_cho=0,bat_dau_thi_luc='2026-10-01T00:00:00Z' WHERE ma_ca='C1'")
    vi.setSystemTime(10000+HAN_PHONG_CHO_MS)
    expect(await docPhongChoDongThoi(x.env,'C1')).toMatchObject({phong_cho:0,bat_dau_thi_luc:'2026-10-01T00:00:00Z'})
    x.d.sql.exec("UPDATE ca SET trang_thai='dong' WHERE ma_ca='C1'");xoaDemPhongCho(x.env)
    expect((await docPhongChoDongThoi(x.env,'C1'))?.trang_thai).toBe('dong')
  })
  it('ca khác, DB khác và ca vắng không lẫn dữ liệu; ca vắng không đệm',async()=>{
    const a=dung(),b=dung();b.d.sql.exec("UPDATE ca SET trang_thai='dong' WHERE ma_ca='C1'")
    const rs=await Promise.all([docPhongChoDongThoi(a.env,'C1'),docPhongChoDongThoi(a.env,'C2'),docPhongChoDongThoi(b.env,'C1'),docPhongChoDongThoi(a.env,'khong')])
    expect(rs.map(r=>r?.trang_thai??null)).toEqual(['mo','dong','dong',null])
    await docPhongChoDongThoi(a.env,'khong');expect(a.soDoc()).toBe(4)
  })
  it('lượt đọc cũ hoàn tất sau khi xoá đệm không lấp lại bản cũ',async()=>{
    let xong!:(r:unknown)=>void,lan=0
    const env={DB:{prepare:()=>({bind:()=>({first:()=>++lan===1?new Promise(r=>{xong=r}):Promise.resolve({trang_thai:'dong'})})})}} as unknown as Env
    const p=docPhongChoDongThoi(env,'C1');xoaDemPhongCho(env);xong({trang_thai:'mo'});await p
    expect(await docPhongChoDongThoi(env,'C1')).toEqual({trang_thai:'dong'});expect(lan).toBe(2)
  })
  it('lượt chủ treo: lượt khác tự đọc sau thời gian đợi hữu hạn',async()=>{
    vi.useFakeTimers();vi.setSystemTime(10000)
    let lan=0
    const env={DB:{prepare:()=>({bind:()=>({first:()=>++lan===1?new Promise(()=>{}):Promise.resolve({trang_thai:'dong'})})})}} as unknown as Env
    void docPhongChoDongThoi(env,'C1')
    const moi=docPhongChoDongThoi(env,'C1')
    await vi.advanceTimersByTimeAsync(250)
    expect(await moi).toEqual({trang_thai:'dong'});expect(lan).toBe(2)
  })
  it('lỗi D1 không đệm, lần sau đọc lại được',async()=>{
    const x=dung();const prepare=x.env.DB.prepare.bind(x.env.DB);let lan=0
    x.env.DB.prepare=((q:string)=>{const st=prepare(q);const first=st.first.bind(st);st.first=(async()=>{if(++lan===1)throw new Error('D1 thử lỗi');return first()}) as typeof st.first;return st}) as typeof x.env.DB.prepare
    await expect(docPhongChoDongThoi(x.env,'C1')).rejects.toThrow('D1 thử lỗi');expect(await docPhongChoDongThoi(x.env,'C1')).toMatchObject({trang_thai:'mo'})
  })
})
