// @vitest-environment node
// Tối ưu máy chủ 28/09 (việc 5): CREATE TABLE IF NOT EXISTS lúc chạy ⇒ MỘT batch, MỘT lần mỗi isolate; lỗi ⇒ lượt sau thử lại.
// 14/10: gỡ Sửa chiến dịch cũ (srs2-sua.ts) — ca 4 lệnh DDL dùng bộ lệnh dựng tại chỗ, giữ nguyên khẳng định.
import { describe, it, expect } from 'vitest'
import { taoD1That } from './_d1-that'
import { demVongD1 } from './_dem-vong-d1'
import { chayDdlMotLan } from '../server/src/ddl-mot-lan'
import { ghiBatDau } from '../server/src/srs2-d1'
import type { Env } from '../server/src/kieu'

const LENH_4 = [
  'CREATE TABLE IF NOT EXISTS ddl_thu_a (id TEXT PRIMARY KEY, sbd TEXT NOT NULL)',
  'CREATE INDEX IF NOT EXISTS idx_ddl_thu_a_sbd ON ddl_thu_a(sbd)',
  'CREATE TABLE IF NOT EXISTS ddl_thu_b (id INTEGER PRIMARY KEY AUTOINCREMENT, a_id TEXT NOT NULL, luc TEXT NOT NULL)',
  'CREATE INDEX IF NOT EXISTS idx_ddl_thu_b_a ON ddl_thu_b(a_id, luc)',
]

describe('DDL một lần mỗi isolate', () => {
  // 31/10: isolate đọc MỘT lần tên đối tượng (sqlite_master) ⇒ bảng chưa có: đọc + một lô tạo (2 vòng, chỉ lần đầu trên D1 trống); bảng ĐÃ có (D1 thật):
  // 1 vòng ĐỌC, KHÔNG lô ghi nào (trước: 1 vòng GHI mỗi isolate mới).
  it('4 lệnh DDL ⇒ lần đầu trên D1 trống: đọc tên + 1 lô; các lượt sau 0 vòng; isolate mới khi bảng đã có: 1 vòng đọc, không lô ghi', async () => {
    const d = taoD1That()
    const { env, d: dem } = demVongD1(d.env as unknown as Env)
    await chayDdlMotLan(env, 'ddl_thu', LENH_4)
    expect(dem.vong).toBe(2)
    await chayDdlMotLan(env, 'ddl_thu', LENH_4)
    await chayDdlMotLan(env, 'ddl_thu', LENH_4)
    expect(dem.vong).toBe(2)
    expect(d.dem('ddl_thu_a')).toBe(0) // bảng có thật
    // isolate mới (D1 gốc khác, cùng dữ liệu): bảng đã có ⇒ không gửi lô DDL nào
    let lo = 0
    const goc = d.env.DB as unknown as { prepare(q: string): unknown; batch(x: unknown[]): unknown }
    const env2 = { ...d.env, DB: { prepare: (q: string) => goc.prepare(q), batch: (x: unknown[]) => { lo++; return goc.batch(x) } } } as unknown as Env
    await chayDdlMotLan(env2, 'ddl_thu', LENH_4)
    expect(lo).toBe(0)
    // một tên thiếu ⇒ chạy lô như cũ
    d.sql.exec('DROP INDEX idx_ddl_thu_b_a')
    const env3 = { ...d.env, DB: { prepare: (q: string) => goc.prepare(q), batch: (x: unknown[]) => { lo++; return goc.batch(x) } } } as unknown as Env
    await chayDdlMotLan(env3, 'ddl_thu', LENH_4)
    expect(lo).toBe(1)
    expect(d.sql.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE name = 'idx_ddl_thu_b_a'").get()).toEqual({ n: 1 })
  })
  it('ghiBatDau: lượt 2 chỉ còn câu INSERT (trước: DDL + INSERT mỗi lượt)', async () => {
    const d = taoD1That()
    const { env, d: dem } = demVongD1(d.env as unknown as Env)
    await ghiBatDau(env, 'CD1', '2026-10-01')
    const sau1 = dem.vong
    await ghiBatDau(env, 'CD1', '2026-10-02')
    expect(dem.vong - sau1).toBe(1)
    expect(d.sql.prepare("SELECT bat_dau FROM chien_dich_bat_dau WHERE id='CD1'").get()).toEqual({ bat_dau: '2026-10-02' })
  })
  it('lỗi ⇒ ném như cũ và lượt sau thử lại', async () => {
    let lan = 0
    const db: any = { prepare: (s: string) => ({ s }), batch: async () => { lan++; if (lan === 1) throw new Error('D1 bận') } }
    await expect(chayDdlMotLan({ DB: db } as any, 'x', ['CREATE TABLE IF NOT EXISTS x (a)'])).rejects.toThrow('D1 bận')
    await chayDdlMotLan({ DB: db } as any, 'x', ['CREATE TABLE IF NOT EXISTS x (a)'])
    await chayDdlMotLan({ DB: db } as any, 'x', ['CREATE TABLE IF NOT EXISTS x (a)'])
    expect(lan).toBe(2)
  })
})
