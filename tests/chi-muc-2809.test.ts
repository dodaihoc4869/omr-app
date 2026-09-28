// @vitest-environment node
// Tối ưu máy chủ 28/09 (việc 3): chỉ mục game_v2_attempt(session, sbd) — migration CHỈ-THÊM + tạo lúc chạy MỘT lần mỗi isolate.
import { describe, it, expect } from 'vitest'
import { taoD1That } from './_d1-that'
import { damBaoChiMuc, CHI_MUC_LUC_CHAY } from '../server/src/chi-muc-luc-chay'
import worker from '../server/src/index'

const keHoach = (sql: any, q: string) => (sql.prepare('EXPLAIN QUERY PLAN ' + q).all() as { detail: string }[]).map((r) => r.detail).join(' | ')
const Q_MO_DAO = `SELECT id FROM game_v2_session s WHERE s.sbd = '1' AND NOT EXISTS (SELECT 1 FROM game_v2_attempt a WHERE a.session = s.id)`
const Q_PHIEN = `SELECT json FROM game_v2_attempt WHERE session = 'x' AND sbd = '1'`

describe('chỉ mục game_v2_attempt(session, sbd)', () => {
  it('trước: quét bảng / theo sbd; sau migration: dùng game_v2_attempt_session', () => {
    const d1 = taoD1That()
    d1.sql.exec('DROP INDEX IF EXISTS game_v2_attempt_session')
    expect(keHoach(d1.sql, Q_MO_DAO)).not.toContain('game_v2_attempt_session')
    for (const s of CHI_MUC_LUC_CHAY) d1.sql.exec(s)
    expect(keHoach(d1.sql, Q_MO_DAO)).toContain('game_v2_attempt_session')
    expect(keHoach(d1.sql, Q_PHIEN)).toContain('game_v2_attempt_session')
  })
  it('lúc chạy: MỘT lần mỗi isolate (lượt 2 không tạo lại); lỗi không làm hỏng lệnh', async () => {
    let lan = 0
    const db: any = { prepare: (s: string) => ({ s }), batch: async () => { lan++; throw new Error('chưa có bảng') } }
    await damBaoChiMuc({ DB: db } as any)
    await damBaoChiMuc({ DB: db } as any)
    expect(lan).toBe(1)
  })
  it('lớp bọc fetch gọi qua ctx.waitUntil, không thêm vòng nào ở lượt sau', async () => {
    const d1 = taoD1That()
    const cho: Promise<unknown>[] = []
    const ctx: any = { waitUntil: (p: Promise<unknown>) => cho.push(p), passThroughOnException() {} }
    const env: any = { ...d1.env, MA_BI_MAT: 'm' }
    await worker.fetch(new Request('https://x.dev/khoe'), env, ctx)
    await worker.fetch(new Request('https://x.dev/khoe'), env, ctx)
    await Promise.all(cho)
    expect(cho[0]).toBe(cho[1]) // cùng một lời hứa ⇒ chỉ chạy một lần
    expect(keHoach(d1.sql, Q_PHIEN)).toContain('game_v2_attempt_session')
  })
})
