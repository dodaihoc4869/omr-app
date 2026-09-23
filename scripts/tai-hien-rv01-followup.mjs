// TÁI HIỆN RV01-followup + RV02-followup (giám sát độc lập) TRÊN BẢN ĐÃ SỬA.
//
// Bản gốc: /Volumes/SSD NGOÀI/CLINE-GIAM-SAT-CNH-2309/review-rv01-followup/repro.mjs (chạy trên snapshot WIP).
// Bản này giữ NGUYÊN các bước và phép chèn đổi chủ, nhưng nạp `server/src/giu-cho.ts` + MỌI migration hiện tại
// (gồm `..._z-donvi.sql` khoá theo đơn vị nội dung). Chạy: `node --experimental-strip-types scripts/tai-hien-rv01-followup.mjs`.
// Kỳ vọng SAU KHI SỬA: (1) hai task KHÁC NGÀY cùng đơn vị nội dung ⇒ chỉ MỘT dòng, B không dành được;
//                        (2) đổi chủ giữa hai bước ⇒ bản gia hạn KHÔNG báo thắng.
// Runtime: Node SQLite trong bộ nhớ — KHÔNG phải Cloudflare D1/workerd (giới hạn đã ghi trong bằng chứng).
import { DatabaseSync } from 'node:sqlite'
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import { giuCho } from '../server/src/giu-cho.ts'

const db = new DatabaseSync(':memory:')
for (const f of ['migration-2309-cnh1-giu-cho.sql', 'migration-2309-cnh1-giu-cho_nhom.sql', 'migration-2309-cnh1-giu-cho_z-donvi.sql']) {
  db.exec(readFileSync(new URL(`../server/${f}`, import.meta.url), 'utf8'))
}

let inject = false
const env = {
  DB: {
    prepare(sql) {
      let args = []
      return {
        bind(...v) { args = v; return this },
        async run() {
          if (inject && sql.startsWith('UPDATE giu_cho SET lease_until')) {
            inject = false
            db.prepare("UPDATE giu_cho SET task_id='OTHER-OWNER', revision=revision+1 WHERE sbd='RACE'").run()
          }
          const r = db.prepare(sql).run(...args)
          return { meta: { changes: Number(r.changes) } }
        },
        async first() { return db.prepare(sql).get(...args) ?? null },
        async all() { return { results: db.prepare(sql).all(...args) } },
      }
    },
  },
}

const base = { sbd: 'DAY', ngay: '2026-09-23', nowMs: Date.parse('2026-09-23T16:59:00Z'), taskId: 'A', qids: ['Q1'], hanTaskGiay: 24 * 3600, nhomTheoQid: new Map([['Q1', 'GROUP'], ['Q2', 'GROUP']]) }
const a = await giuCho(env, base)
const b = await giuCho(env, { ...base, ngay: '2026-09-24', nowMs: base.nowMs + 120000, taskId: 'B', qids: ['Q2'] })
const soDong = Number(db.prepare('SELECT COUNT(*) AS n FROM giu_cho').get().n)

await giuCho(env, { ...base, sbd: 'RACE' })
inject = true
const resumed = await giuCho(env, { ...base, sbd: 'RACE', nowMs: base.nowMs + 1000 })
const row = db.prepare("SELECT task_id FROM giu_cho WHERE sbd='RACE'").get()

const ketQua = {
  runtime: 'Node SQLite trong bo nho; KHONG phai Cloudflare D1/workerd',
  results: [
    { id: 'RV01-followup', aThang: a.thang.length, bThang: b.thang.length, soDong, bDangMo: b.dangMo.get('Q2') ?? null },
    { id: 'RV02-followup', resumedThang: resumed.thang.length, chuTrongDb: row.task_id, chuBaoThang: resumed.dangGiu.get('Q1') ?? null },
  ],
}

// KỲ VỌNG BẢN SỬA: không còn tái hiện.
assert.equal(a.thang.length, 1, 'A phải giữ được đơn vị')
assert.equal(b.thang.length, 0, 'B KHÔNG được giữ cùng đơn vị khi A còn hiệu lực (xuyên ngày)')
assert.equal(soDong, 1, 'một đơn vị nội dung = MỘT dòng')
assert.equal(b.dangMo.get('Q2'), 'A', 'B phải được trả lại nhiệm vụ đang mở để RESUME')
assert.equal(resumed.thang.length, 0, 'gia hạn KHÔNG được báo thắng khi chủ đã đổi')
assert.equal(row.task_id, 'OTHER-OWNER', 'không được ghi đè chủ mới')
console.log(JSON.stringify(ketQua, null, 2))
db.close()
