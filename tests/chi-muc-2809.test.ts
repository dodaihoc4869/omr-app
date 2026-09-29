// @vitest-environment node
// Tối ưu máy chủ 28/09 (việc 3): chỉ mục game_v2_attempt(session, sbd) — migration CHỈ-THÊM + tạo lúc chạy MỘT lần mỗi isolate.
import { describe, it, expect, vi, afterEach } from 'vitest'
import { taoD1That } from './_d1-that'
import { damBaoChiMuc, CHI_MUC_LUC_CHAY, CHI_MUC_CRON_DEM } from '../server/src/chi-muc-luc-chay'
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
  afterEach(() => { vi.useRealTimers() })
  it('cron tạo chỉ mục (không nằm trên đường lệnh fetch); lượt cron sau không tạo lại', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(Date.parse('2026-09-30T10:00:00+07:00')) // ngoài khung cao điểm 20h–24h (khung ấy cron không chạy DDL — test dưới)
    const d1 = taoD1That()
    d1.sql.exec('DROP INDEX IF EXISTS game_v2_attempt_session')
    let lanBatch = 0
    const batchGoc = d1.env.DB.batch.bind(d1.env.DB)
    const env: any = { ...d1.env, DB: { ...d1.env.DB, prepare: d1.env.DB.prepare, batch: (ds: any[]) => { if (ds.length === 1) lanBatch++; return batchGoc(ds) } } }
    await worker.fetch(new Request('https://x.dev/khoe'), env)
    expect(keHoach(d1.sql, Q_PHIEN)).not.toContain('game_v2_attempt_session') // fetch không đụng DDL
    await worker.scheduled({ cron: '* * * * *' } as any, env).catch(() => undefined)
    expect(keHoach(d1.sql, Q_PHIEN)).toContain('game_v2_attempt_session')
    const truoc = lanBatch
    await worker.scheduled({ cron: '* * * * *' } as any, env).catch(() => undefined)
    expect(lanBatch).toBeLessThanOrEqual(truoc) // không tạo lại (không thêm batch chỉ mục)
  })
  it('CAO ĐIỂM 20:00–23:59 giờ VN: cron KHÔNG chạy DDL chỉ mục (29/09) — để isolate cron ngoài khung làm', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(Date.parse('2026-09-30T21:30:00+07:00'))
    const d1 = taoD1That()
    d1.sql.exec('DROP INDEX IF EXISTS game_v2_attempt_session')
    await worker.scheduled({ cron: '* * * * *' } as any, d1.env).catch(() => undefined)
    expect(keHoach(d1.sql, Q_PHIEN)).not.toContain('game_v2_attempt_session')
  })
  it('cron ĐÊM 17:01 UTC dựng idx_luot_ca_tt (IF NOT EXISTS, một câu riêng); cron mỗi phút và lệnh fetch KHÔNG dựng (29/09)', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(Date.parse('2026-09-30T00:01:00+07:00'))
    const d1 = taoD1That()
    d1.sql.exec('DROP INDEX IF EXISTS idx_luot_ca_tt')
    const cau: string[] = []
    const prepGoc = d1.env.DB.prepare.bind(d1.env.DB)
    const env: any = { ...d1.env, DB: { ...d1.env.DB, batch: d1.env.DB.batch.bind(d1.env.DB), prepare: (q: string) => { cau.push(q); return prepGoc(q) } } }
    expect(CHI_MUC_CRON_DEM).toEqual(['CREATE INDEX IF NOT EXISTS idx_luot_ca_tt ON luot(ma_ca, trang_thai, het_gio_luc)'])
    await worker.fetch(new Request('https://x.dev/khoe'), env)
    await worker.scheduled({ cron: '* * * * *' } as any, env).catch(() => undefined)
    expect(cau.filter((q) => q.includes('idx_luot_ca_tt'))).toEqual([])
    await worker.scheduled({ cron: '1 17 * * *' } as any, env).catch(() => undefined)
    expect(cau.filter((q) => q.includes('idx_luot_ca_tt'))).toEqual([CHI_MUC_CRON_DEM[0]])
    const ke = d1.sql.prepare("EXPLAIN QUERY PLAN SELECT COUNT(*) FROM luot l WHERE l.ma_ca='C' AND l.trang_thai='dang_lam' AND (l.het_gio_luc IS NULL OR l.het_gio_luc>'x')").all() as { detail: string }[]
    expect(ke.map((x) => x.detail).join(' ')).toContain('idx_luot_ca_tt')
  })
})
