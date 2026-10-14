// Kiểm cổng thuần túy với SQL_GOI7 thật; không import preflight, đọc bí mật hay kết nối dữ liệu.
import { strict as assert } from 'node:assert'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { execFileSync } from 'node:child_process'
import { chiThemGoi7 } from './cong-migration-goi7.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const scratch = mkdtempSync(join(tmpdir(), 'cong-migration-goi7-'))
try {
  const bundle = join(scratch, 'schema.mjs')
  execFileSync(join(root, 'node_modules/.bin/esbuild'), [join(root, 'server/src/goi-bai-7-schema.ts'), '--bundle', '--platform=node', '--format=esm', '--target=node24', `--outfile=${bundle}`, '--log-level=warning'], { stdio: 'pipe' })
  const { SQL_GOI7 } = await import(pathToFileURL(bundle).href)
  assert.ok(SQL_GOI7.length > 0)
  for (const sql of SQL_GOI7) assert.equal(chiThemGoi7(sql), true, sql)
  const index = 'CREATE INDEX IF NOT EXISTS game_v2_attempt_sbd_qid ON game_v2_attempt(sbd,qid,session)'
  assert.ok(SQL_GOI7.includes(index), 'Phải kiểm đúng chỉ mục thật làm cổng phát hành dừng.')
  const sai = [
    'DROP TABLE goi_bai_7', 'ALTER TABLE goi_bai_7 ADD COLUMN x TEXT',
    'DELETE FROM goi_bai_7', 'UPDATE goi_bai_7 SET ten=ten',
    'INSERT INTO goi_bai_7(id) VALUES(1)', 'REPLACE INTO goi_bai_7(id) VALUES(1)',
    index.replace('game_v2_attempt_sbd_qid', 'game_v2_attempt_khac'),
    index.replace(' ON game_v2_attempt(', ' ON hoc_sinh('),
    index.replace('sbd,qid,session)', 'sbd,qid,session,created_at)'),
    index.replace('INDEX IF NOT EXISTS', 'UNIQUE INDEX IF NOT EXISTS'),
    index.replace(' IF NOT EXISTS', ''),
    'CREATE INDEX IF NOT EXISTS goi_bai_7_x ON hoc_sinh(sbd)',
    'CREATE INDEX IF NOT EXISTS goi_bai_7_x ON goi_bai_70(sbd)',
    'CREATE TABLE IF NOT EXISTS goi_bai_70 (id TEXT)',
    'CREATE TABLE IF NOT EXISTS game_v2_attempt_x (id TEXT)',
    'CREATE TABLE IF NOT EXISTS goi_bai_7_x AS SELECT * FROM hoc_sinh',
    'CREATE TABLE IF NOT EXISTS goi_bai_7_x (id TEXT); DROP TABLE hoc_sinh',
    'CREATE TABLE IF NOT EXISTS goi_bai_7_x (id TEXT) STRICT',
    'CREATE TABLE IF NOT EXISTS goi_bai_7_x (id TEXT,PRIMARY KEY(id)) SELECT 1',
    'CREATE TABLE IF NOT EXISTS goi_bai_7_x (id TEXT, CHECK(id IN(0,1))))',
    '', null, undefined,
  ]
  for (const sql of SQL_GOI7) {
    sai.push(`${sql}; DROP TABLE hoc_sinh`, `${sql} DELETE FROM hoc_sinh`, `${sql} -- suffix`)
  }
  for (const sql of sai) assert.equal(chiThemGoi7(sql), false, String(sql))
  console.log(JSON.stringify({ ok: true, ddlThatDaChapNhan: SQL_GOI7.length, truongHopTuChoi: sai.length, ngoaiLe: 'duy nhất DDL nguyên văn game_v2_attempt_sbd_qid', ketNoiDuLieu: false }))
} finally {
  rmSync(scratch, { recursive: true, force: true })
}
