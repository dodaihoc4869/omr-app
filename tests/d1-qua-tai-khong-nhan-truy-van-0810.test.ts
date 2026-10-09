// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { gopDocD1, xoaDemBangVang } from '../server/src/doc-d1-theo-luot'
import type { D1Database, D1PreparedStatement } from '../server/src/kieu'
function dung(message: string) {
  xoaDemBangVang()
  const all=vi.fn(async()=>({success:true,results:[{n:1}],meta:{changes:0,last_row_id:0,rows_read:1,rows_written:0}}))
  const run=vi.fn(async()=>({success:true,results:[],meta:{changes:1,last_row_id:0,rows_read:0,rows_written:1}}))
  const batch=vi.fn(async()=>{throw new Error(message)})
  const raw={prepare:()=>{const st={bind:()=>st,all,run,first:async()=>({n:1})};return st as D1PreparedStatement},batch} as unknown as D1Database
  return {db:gopDocD1(raw),raw,all,run,batch}
}
describe('không khuếch đại quá tải D1',()=>{
  it.each(['D1_ERROR: D1 DB is overloaded. Requests queued for too long.','D1_ERROR: too many requests','SQLITE_BUSY'])('một lô 20 câu bị lỗi %s không gửi lại 20 câu',async message=>{
    const {db,all,batch}=dung(message)
    const results=await Promise.allSettled(Array.from({length:20},()=>db.prepare('SELECT 1').all()))
    expect(results.every(r=>r.status==='rejected')).toBe(true)
    expect(batch).toHaveBeenCalledTimes(1)
    expect(all).not.toHaveBeenCalled()
  })
  it('không ghi kế hoạch rỗng sau khi tầng gọi bắt lỗi đọc quá tải',async()=>{
    const {db,run,batch}=dung('D1 DB is overloaded')
    await db.prepare('SELECT 1').all().catch(()=>[])
    await expect(db.prepare('INSERT INTO srs2_ke_hoach VALUES(1)').run()).rejects.toThrow('overloaded')
    await expect(db.prepare('SELECT 2').all()).rejects.toThrow('overloaded')
    expect(run).not.toHaveBeenCalled();expect(batch).toHaveBeenCalledTimes(1)
  })
  it('lỗi mạng/lỗi khác cũng không bị tách thành nhiều truy vấn',async()=>{
    const {db,all}=dung('Network connection lost')
    await expect(db.prepare('SELECT 1').all()).rejects.toThrow('Network')
    expect(all).not.toHaveBeenCalled()
  })
  it.each(['no such table: optional_table','no such column: optional_field'])('giữ đường dự phòng đúng trường hợp %s',async message=>{
    const {db,all}=dung(message)
    const r=await Promise.all([db.prepare('SELECT 1').all(),db.prepare('SELECT 2').all()])
    expect(r).toHaveLength(2);expect(all).toHaveBeenCalledTimes(2)
  })
  it('request mới được tiếp tục khi D1 đã hồi phục',async()=>{
    const {db,raw,batch}=dung('D1 DB is overloaded')
    await db.prepare('SELECT 1').all().catch(()=>null)
    batch.mockImplementationOnce(async()=>[{success:true,results:[{n:1}],meta:{changes:0,last_row_id:0,rows_read:1,rows_written:0}}] as never)
    await expect(gopDocD1(raw).prepare('SELECT 1').first()).resolves.toEqual({n:1})
  })
})
