import { describe, it, expect } from 'vitest'
import { DatabaseSync } from 'node:sqlite'
import { noiThamSo, taoDbVanHanh } from '../scripts/chua-d1-van-hanh'
describe('Kết nối D1 vận hành vòng chữa', () => {
  it('giữ nguyên dữ liệu chứa dấu hỏi/dấu nháy và chặn thừa/thiếu tham số', () => {
    const k = new DatabaseSync(':memory:')
    const sql = noiThamSo("SELECT ? AS answer,'?' AS marker", ["A?'; DROP TABLE x; --"])
    expect(k.prepare(sql).get()).toMatchObject({ answer: "A?'; DROP TABLE x; --", marker: '?' })
    expect(() => noiThamSo('SELECT ?', [])).toThrow()
    expect(() => noiThamSo("SELECT '?'", [1])).toThrow()
    k.close()
  })
  it('receipt và cờ được ghi cùng batch; retry không bật lại cờ đã được thầy tắt', async () => {
    const k = new DatabaseSync(':memory:')
    k.exec('CREATE TABLE cau_hinh(khoa TEXT PRIMARY KEY,gia_tri TEXT)')
    let calls = 0
    const db = taoDbVanHanh(async sql => {
      calls++
      k.exec('BEGIN')
      try { k.exec(sql); k.exec('COMMIT') } catch (e) { k.exec('ROLLBACK'); throw e }
      return [1,2].map(() => ({ success: true, results: [], meta: {} }))
    })
    const run = () => db.batch([
      db.prepare('INSERT OR IGNORE INTO cau_hinh VALUES(?,?)').bind('receipt','done'),
      db.prepare("INSERT INTO cau_hinh SELECT 'flag',? WHERE changes()=1 ON CONFLICT(khoa) DO UPDATE SET gia_tri=excluded.gia_tri").bind('bat'),
    ])
    await run()
    expect(calls).toBe(1)
    expect(k.prepare("SELECT gia_tri FROM cau_hinh WHERE khoa='flag'").get()?.gia_tri).toBe('bat')
    k.exec("UPDATE cau_hinh SET gia_tri='tat' WHERE khoa='flag'")
    await run()
    expect(k.prepare("SELECT gia_tri FROM cau_hinh WHERE khoa='flag'").get()?.gia_tri).toBe('tat')
    k.close()
  })
  it('không cho công cụ vận hành sửa điểm, xoá bảng hoặc ghi game', async () => {
    let calls = 0
    const db = taoDbVanHanh(async () => { calls++; return [] })
    for (const sql of ['UPDATE luot SET diem=10','DELETE FROM chua_loi_dot','DROP TABLE hoc_sinh','INSERT INTO game_v2_session VALUES(1)']) {
      await expect(db.prepare(sql).run()).rejects.toThrow('ngoài phạm vi')
    }
    expect(calls).toBe(0)
  })
  it('kết quả D1 thiếu một lệnh không được tính đã hoàn thành', async () => {
    const db = taoDbVanHanh(async () => [{ success: true, results: [], meta: {} }])
    await expect(db.batch([db.prepare('SELECT 1'),db.prepare('SELECT 2')])).rejects.toThrow('không hoàn tất')
  })
})
