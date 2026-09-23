// @vitest-environment node
import { DatabaseSync } from 'node:sqlite'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { syncNotices } from '../server/src/notifications'

type Task = { sbd: string; id: string; title: string; body: string; target: string; created_at: string; deadline: string | null }
const moDau = Date.now()

function fixture() {
  const db = new DatabaseSync(':memory:')
  db.exec(readFileSync('server/migration-1609-notifications.sql', 'utf8'))
  db.exec(`CREATE TABLE btvn(ma_btvn TEXT PRIMARY KEY, ma_de TEXT, giao_luc TEXT, han_nop TEXT, da_xoa INTEGER);
    CREATE TABLE btvn_em(khoa TEXT PRIMARY KEY, sbd TEXT, ma_btvn TEXT, thu_hoi INTEGER, nop_luc TEXT);
    CREATE INDEX idx_btvn_em ON btvn_em(sbd);
    CREATE TABLE mom_bai(id TEXT PRIMARY KEY, sbd TEXT, title TEXT, created_at TEXT, submitted_at TEXT);
    CREATE INDEX mom_bai_student_date ON mom_bai(sbd, created_at DESC);`)
  const now = new Date(moDau).toISOString()
  const due = new Date(moDau + 20 * 60_000).toISOString()
  const later = new Date(moDau + 2 * 3_600_000).toISOString()
  for (const [i, sbd] of ['alice', 'bob'].entries()) {
    for (let j = 0; j < 40; j++) {
      const id = `${i}-${j}`
      db.prepare('INSERT INTO btvn VALUES(?,?,?,?,0)').run(id, `Đề ${id}`, now, j < 20 ? due : later)
      db.prepare('INSERT INTO btvn_em VALUES(?,?,?,0,NULL)').run(`khoa-${id}`, sbd, id)
    }
    for (let j = 0; j < 10; j++) db.prepare('INSERT INTO mom_bai VALUES(?,?,?,?,NULL)').run(`mom-${i}-${j}`, sbd, `Bài ${j}`, now)
  }
  let queries = 0
  const wrap = (sql: string, args: unknown[] = []) => ({
    bind: (...v: unknown[]) => wrap(sql, v),
    all: async () => { queries++; return { results: db.prepare(sql).all(...args as never[]) } },
    run: async () => { queries++; return { meta: db.prepare(sql).run(...args as never[]) } },
  })
  const env = { DB: { prepare: wrap, batch: async (list: { run: () => Promise<unknown> }[]) => Promise.all(list.map((x) => x.run())) } } as any
  return { db, env, count: () => queries, rows: () => db.prepare('SELECT id,sbd,title,body,target,read_at FROM student_notice ORDER BY id').all() }
}

// Mã đối chứng tương ứng với vòng SELECT + N INSERT trước thay đổi; dùng cùng SQLite fixture.
async function oldSync(d: ReturnType<typeof fixture>, sbd?: string) {
  const q = sbd
    ? `SELECT e.sbd,'btvn:'||e.khoa id,'Bài tập mới từ Thầy' title,b.ma_de body,'btvn' target,b.giao_luc created_at,b.han_nop deadline FROM btvn_em e JOIN btvn b ON b.ma_btvn=e.ma_btvn WHERE b.da_xoa=0 AND e.thu_hoi=0 AND e.nop_luc IS NULL AND b.han_nop>strftime('%Y-%m-%dT%H:%M:%fZ','now') AND e.sbd=?
       UNION ALL SELECT sbd,'mom:'||sbd||':'||id,'Bài luyện mới',title,'mom',created_at,NULL FROM mom_bai WHERE submitted_at IS NULL AND sbd=?`
    : `SELECT e.sbd,'btvn:'||e.khoa id,'Bài tập mới từ Thầy' title,b.ma_de body,'btvn' target,b.giao_luc created_at,b.han_nop deadline FROM btvn_em e JOIN btvn b ON b.ma_btvn=e.ma_btvn WHERE b.da_xoa=0 AND e.thu_hoi=0 AND e.nop_luc IS NULL AND b.han_nop>strftime('%Y-%m-%dT%H:%M:%fZ','now')
       UNION ALL SELECT sbd,'mom:'||sbd||':'||id,'Bài luyện mới',title,'mom',created_at,NULL FROM mom_bai WHERE submitted_at IS NULL`
  const tasks = (await d.env.DB.prepare(q).bind(...(sbd ? [sbd, sbd] : [])).all()).results as Task[]
  const writes = []
  for (const t of tasks) {
    writes.push(d.env.DB.prepare('INSERT OR IGNORE INTO student_notice(id,sbd,title,body,target,created_at) VALUES(?,?,?,?,?,?)').bind(t.id,t.sbd,t.title,t.body,t.target,t.created_at))
    const remaining = Date.parse(t.deadline ?? '') - Date.now()
    if (remaining > 0 && remaining <= 3_600_000) writes.push(d.env.DB.prepare('INSERT OR IGNORE INTO student_notice(id,sbd,title,body,target,created_at) VALUES(?,?,?,?,?,?)').bind(`due:${t.id}:${t.deadline}`,t.sbd,'Bài tập sắp hết hạn','Còn dưới 1 giờ. Em mở bài để kiểm tra hạn nộp.',t.target,new Date().toISOString()))
  }
  for (let i = 0; i < writes.length; i += 50) await d.env.DB.batch(writes.slice(i, i + 50))
}

describe('syncNotices: đo truy vấn thật trên SQLite cục bộ', () => {
  it('một học sinh: 71 → 1 lệnh, nội dung và quyền xem giữ nguyên', async () => {
    const old = fixture(), next = fixture()
    await oldSync(old, 'alice')
    await syncNotices(next.env, 'alice')
    expect(old.count()).toBe(71)
    expect(next.count()).toBe(1)
    expect(next.rows()).toEqual(old.rows())
    expect(next.rows()).toHaveLength(70)
    expect(next.rows().every((r: any) => r.sbd === 'alice')).toBe(true)
    next.db.prepare("UPDATE student_notice SET read_at='read' WHERE id='btvn:khoa-0-0'").run()
    await syncNotices(next.env, 'alice')
    expect(next.rows()).toHaveLength(70)
    expect(next.db.prepare("SELECT read_at FROM student_notice WHERE id='btvn:khoa-0-0'").get()).toEqual({ read_at: 'read' })
  })
  it('cron cả trường: 141 → 1 lệnh, không mất thông báo của em khác', async () => {
    const old = fixture(), next = fixture()
    await oldSync(old)
    await syncNotices(next.env)
    expect(old.count()).toBe(141)
    expect(next.count()).toBe(1)
    expect(next.rows()).toEqual(old.rows())
    expect(next.rows()).toHaveLength(140)
  })
})
