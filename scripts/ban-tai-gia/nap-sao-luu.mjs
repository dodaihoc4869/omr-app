// BƯỚC 1 CỦA BỘ BẮN TẢI GIẢ (Code 1, 21/09/2026): nạp một bản sao lưu đêm (.sql) vào D1 CỤC BỘ của bộ này (scripts/ban-tai-gia/.trang-thai/).
// Vì sao không dùng `wrangler d1 execute --file`: với tệp ~100 MB nó chạy > 10 phút chưa xong; tệp D1 cục bộ của miniflare là SQLite thường (bảng nằm thẳng trong tệp + bảng `_cf_METADATA`), nên nạp trực tiếp bằng node:sqlite mất < 2 giây.
// AN TOÀN: cấu hình wrangler.toml của bộ này có database_id số 0 giả và KHÔNG có --remote ⇒ không có đường nào chạm D1 thật. Dùng: node scripts/ban-tai-gia/nap-sao-luu.mjs [tệp.sql]   (mặc định: bản MỚI NHẤT trong /Volumes/SSD NGOÀI/omr-saoluu/)
import { DatabaseSync } from 'node:sqlite'
import { readFileSync, readdirSync, statSync, existsSync, rmSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join, dirname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const GOC = dirname(fileURLToPath(import.meta.url))
const REPO = join(GOC, '../..')
const TT = join(GOC, '.trang-thai')
const SL = '/Volumes/SSD NGOÀI/omr-saoluu'
const tepSql = process.argv[2] ?? join(SL, readdirSync(SL).filter((f) => /^omr-d1-.*\.sql$/.test(f)).sort((a, b) => statSync(join(SL, b)).mtimeMs - statSync(join(SL, a)).mtimeMs)[0])
console.log(`Nạp: ${basename(tepSql)} (${Math.round(statSync(tepSql).size / 1e6)} MB) vào ${TT.replace(REPO + '/', '')} (cục bộ)`)

// 1) Tạo tệp D1 cục bộ (tên tệp do miniflare đặt theo database_id giả).
rmSync(join(TT, 'v3'), { recursive: true, force: true })
execFileSync('npx', ['wrangler', 'd1', 'execute', 'DB', '--local', '--config', 'scripts/ban-tai-gia/wrangler.toml', '--persist-to', 'scripts/ban-tai-gia/.trang-thai', '--command', 'SELECT 1'], { cwd: REPO, stdio: 'ignore' })
const thuMuc = join(TT, 'v3/d1/miniflare-D1DatabaseObject')
const tep = readdirSync(thuMuc).filter((f) => f.endsWith('.sqlite') && f !== 'metadata.sqlite').map((f) => join(thuMuc, f))[0]
if (!tep || !existsSync(tep)) throw new Error('Không thấy tệp D1 cục bộ do wrangler tạo.')

// 2) Nạp bản sao lưu.
const t0 = Date.now()
const db = new DatabaseSync(tep)
db.exec('PRAGMA journal_mode=OFF; PRAGMA synchronous=OFF;')
for (const b of db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE '\\_cf\\_%' ESCAPE '\\' AND name NOT LIKE 'sqlite_%'").all()) db.exec(`DROP TABLE IF EXISTS "${b.name}"`)
db.exec('BEGIN')
db.exec(readFileSync(tepSql, 'utf8'))
db.exec('COMMIT')
const soBang = Number(db.prepare("SELECT COUNT(*) n FROM sqlite_master WHERE type='table'").get().n)
console.log(`Nạp xong sau ${Date.now() - t0} ms: ${soBang} bảng; hoc_sinh ${db.prepare('SELECT COUNT(*) n FROM hoc_sinh').get().n} dòng.`)
db.close()
writeFileSync(join(TT, 'nap.json'), JSON.stringify({ saoLuu: basename(tepSql), napLuc: new Date().toISOString() }))
console.log('Kế: node scripts/ban-tai-gia/chuan-bi.mjs')
