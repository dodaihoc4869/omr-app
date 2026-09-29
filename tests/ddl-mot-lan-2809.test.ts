// @vitest-environment node
// Tối ưu máy chủ 28/09 (việc 5): CREATE TABLE IF NOT EXISTS lúc chạy ⇒ MỘT batch, MỘT lần mỗi isolate; lỗi ⇒ lượt sau thử lại.
import { describe, it, expect } from 'vitest'
import { taoD1That } from './_d1-that'
import { demVongD1 } from './_dem-vong-d1'
import { chayDdlMotLan } from '../server/src/ddl-mot-lan'
import { LENH_TAO_BANG_SUA } from '../server/src/srs2-sua'
import { ghiBatDau } from '../server/src/srs2-d1'
import type { Env } from '../server/src/kieu'

describe('DDL một lần mỗi isolate', () => {
  it('srs2-sua: 4 lệnh DDL ⇒ 1 vòng lần đầu (trước: 4 vòng MỖI lượt), 0 vòng các lượt sau', async () => {
    const d = taoD1That()
    const { env, d: dem } = demVongD1(d.env as unknown as Env)
    await chayDdlMotLan(env, 'chien_dich_sua', LENH_TAO_BANG_SUA)
    expect(dem.vong).toBe(1)
    await chayDdlMotLan(env, 'chien_dich_sua', LENH_TAO_BANG_SUA)
    await chayDdlMotLan(env, 'chien_dich_sua', LENH_TAO_BANG_SUA)
    expect(dem.vong).toBe(1)
    expect(d.dem('chien_dich_em')).toBe(0) // bảng có thật
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
