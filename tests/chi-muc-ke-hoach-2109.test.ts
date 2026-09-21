// @vitest-environment node
// CHỈ MỤC ĐÚNG cho truy vấn nóng (Code 1 đo bằng EXPLAIN trên bản sao lưu thật, 21/09): không có ANALYZE, SQLite ưu tiên idx_skh_nguon(nguon, ma_nguon) cho `nguon = 'btvn_lo' / 'on_lai'`
// và đọc MỌI dòng của cả trường (~2,4 nghìn dòng mỗi lượt profile / recommendations). Dấu `+nguon` buộc đi idx_skh_em_ngay(sbd, ngay_vn). Test khoá KẾ HOẠCH TRUY VẤN bằng EXPLAIN QUERY PLAN thật.
import { describe, expect, it } from 'vitest'
import { docDauVaoLuot } from '../server/src/game-v2-luot'
import { taoD1That, type D1That } from './_d1-that'

/** Chạy `f` và trả các (câu SQL, tham số) đã gửi tới D1 giả. */
async function batCau(d: D1That, f: () => Promise<unknown>): Promise<{ sql: string; args: unknown[] }[]> {
  const ra: { sql: string; args: unknown[] }[] = []; const goc = d.env.DB.prepare.bind(d.env.DB)
  d.env.DB.prepare = ((q: string) => { const st = goc(q) as any; const bind = st.bind.bind(st); st.bind = (...a: unknown[]) => { ra.push({ sql: q, args: a }); return bind(...a) }; return st }) as typeof d.env.DB.prepare
  await f(); return ra
}
const kePlan = (d: D1That, c: { sql: string; args: unknown[] }): string => (d.sql.prepare(`EXPLAIN QUERY PLAN ${c.sql}`).all(...(c.args as never[])) as { detail: string }[]).map((r) => r.detail).join('\n')

describe('docDauVaoLuot · kế hoạch truy vấn', () => {
  it('hai truy vấn con trên su_kien_hoc (btvn_lo, on_lai) KHÔNG dùng idx_skh_nguon mà dùng chỉ mục theo em + ngày', async () => {
    const d = taoD1That(); d.sql.prepare("INSERT OR IGNORE INTO hoc_sinh(sbd,ho_ten,cap_nhat_luc) VALUES('S1','x','x')").run()
    const cau = await batCau(d, () => docDauVaoLuot(d.env, 'S1', '2026-09-22', Date.parse('2026-09-22T10:00:00+07:00'), false))
    const c = cau.find((x) => /chang_xong_hom_nay/.test(x.sql))!; expect(c).toBeDefined()
    const plan = kePlan(d, c)
    expect(plan).not.toMatch(/idx_skh_nguon/); expect(plan).toMatch(/idx_skh_em_ngay/)
    expect((plan.match(/idx_skh_em_ngay/g) ?? []).length).toBeGreaterThanOrEqual(2)          // cả nhánh btvn_lo lẫn nhánh on_lai
  })
  it('đối chứng: bỏ dấu + thì planner quay lại idx_skh_nguon (test này chứng minh test trên đo đúng cái cần đo)', async () => {
    const d = taoD1That(); d.sql.prepare("INSERT OR IGNORE INTO hoc_sinh(sbd,ho_ten,cap_nhat_luc) VALUES('S1','x','x')").run()
    const cau = await batCau(d, () => docDauVaoLuot(d.env, 'S1', '2026-09-22', Date.parse('2026-09-22T10:00:00+07:00'), false))
    const c = cau.find((x) => /chang_xong_hom_nay/.test(x.sql))!
    const bo = { ...c, sql: c.sql.replace(/\+s\.nguon/g, 's.nguon').replace(/\+nguon/g, 'nguon') }
    expect(kePlan(d, bo)).toMatch(/idx_skh_nguon/)
  })
})

import { gameV2 } from '../server/src/game-v2'
import { gameToken } from '../server/src/game-v2-auth'
import { LUAT_CAP_MOI } from '../src/lib/hap-thu-ngay'

describe('academic-sync · luot theo em dùng chỉ mục idx_luot_sbd_nop (migration-2109-chi-muc-luot.sql)', () => {
  it('truy vấn `luot l JOIN ca c ... WHERE l.sbd = ?` tìm theo (sbd, trang_thai, nop_luc) — không quét cả bảng luot', async () => {
    const d = taoD1That(); d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','x','12','mk','x')").run()
    d.sql.prepare('INSERT INTO game_v2_profile(sbd,json,created_at) VALUES(?,?,?)').run('S1', JSON.stringify({ pet: 'lua_phuong', choice: false, legacy: null, cap: 5, exp: 0, wallet: 0, earned: 0, tower: 1, mastery: [], arena: null, cutover: '2020-01-01T00:00:00.000Z', luatCap: LUAT_CAP_MOI }), 'x')
    const cau = await batCau(d, async () => gameV2(d.env, 'academic-sync', { token: await gameToken(d.env, 'S1') }))
    const c = cau.find((x) => /FROM luot l JOIN ca c/.test(x.sql))!; expect(c).toBeDefined()
    const plan = kePlan(d, c)
    expect(plan).toMatch(/SEARCH l USING (COVERING )?INDEX idx_luot_sbd_nop/); expect(plan).not.toMatch(/SCAN l\b/)
  })
  it('migration chỉ-thêm, chạy lại được, có tệp lùi; không có DROP/ALTER/DELETE/UPDATE trong tệp chạy', async () => {
    const { readFileSync } = await import('node:fs')
    const sql = readFileSync('server/migration-2109-chi-muc-luot.sql', 'utf8'); const lui = readFileSync('server/lui-2109-chi-muc-luot.sql', 'utf8')
    expect(sql.replace(/--.*$/gm, '')).not.toMatch(/\b(DROP|ALTER|DELETE|UPDATE|INSERT)\b/i); expect(sql).toContain('IF NOT EXISTS idx_luot_sbd_nop'); expect(lui).toContain('DROP INDEX IF EXISTS idx_luot_sbd_nop')
    const d = taoD1That(); d.sql.exec(sql); d.sql.exec(sql)                                        // chạy lại lần nữa không lỗi
    expect((d.sql.prepare("SELECT COUNT(*) n FROM sqlite_master WHERE type='index' AND name='idx_luot_sbd_nop'").get() as { n: number }).n).toBe(1)
  })
})
