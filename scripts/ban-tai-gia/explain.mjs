// EXPLAIN CÁC TRUY VẤN TỐN NHẤT (Code 1, 21/09/2026; kế hoạch máy chủ M2: "với mỗi truy vấn top 10: EXPLAIN, chỉ mục thiếu, hoặc đệm"). Dùng:
//   node scripts/ban-tai-gia/explain.mjs <mã>     (đọc docs/do-tai-d1/ban-tai-<mã>-truy-van.json do chay.mjs ghi; chạy EXPLAIN QUERY PLAN trên .trang-thai/mau.sqlite — bản sao lưu THẬT đã nạp; ghi docs/do-tai-d1/explain-<mã>.md)
// EXPLAIN không chạy truy vấn nên giá trị tham số không quan trọng (bind '[]' cho json_each, '' cho phần còn lại). Chỉ mục trong bản sao lưu = chỉ mục trên D1 thật (dump có CREATE INDEX).
// Cách đọc: "SCAN <bảng>" không kèm "USING INDEX" = quét TOÀN bảng (số dòng đọc = cỡ bảng) — ứng viên chỉ mục hoặc đệm; "SEARCH … USING INDEX/PRIMARY KEY" = tra theo chỉ mục.
import { DatabaseSync } from 'node:sqlite'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const GOC = dirname(fileURLToPath(import.meta.url))
const REPO = join(GOC, '../..')
const ma = process.argv[2]
if (!ma) { console.error('Dùng: node scripts/ban-tai-gia/explain.mjs <mã>'); process.exit(1) }
const ds = JSON.parse(readFileSync(join(REPO, `docs/do-tai-d1/ban-tai-${ma}-truy-van.json`), 'utf8')).truyVan
const db = new DatabaseSync(join(GOC, '.trang-thai/mau.sqlite'), { readOnly: true })
const soBang = (b) => { try { return Number(db.prepare(`SELECT COUNT(*) n FROM "${b}"`).get().n) } catch { return null } }
const cat = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s)
const dong = []
const P = (s = '') => dong.push(s)
P(`# EXPLAIN các truy vấn tốn nhất — ${ma}`)
P()
P('Nguồn: sổ đo của lượt bắn tải giả (`ban-tai-' + ma + '.md`), EXPLAIN QUERY PLAN trên bản sao lưu THẬT nạp cục bộ. **SCAN không kèm INDEX = quét cả bảng.**')
P()
ds.forEach((q, i) => {
  const so = (q.sql.match(/\?/g) ?? []).length
  const bind = Array.from({ length: so }, () => (/json_each\(\s*\?\s*\)/i.test(q.sql) ? '[]' : ''))
  let kehoach = []
  try { kehoach = db.prepare('EXPLAIN QUERY PLAN ' + q.sql).all(...bind).map((r) => String(r.detail)) } catch (e) { try { kehoach = db.prepare('EXPLAIN QUERY PLAN ' + q.sql).all(...bind.map(() => '[]')).map((r) => String(r.detail)) } catch (e2) { kehoach = [`(không EXPLAIN được: ${String(e2.message).slice(0, 80)})`] } }
  const quet = kehoach.filter((d) => /^SCAN /.test(d) && !/USING (COVERING )?INDEX/.test(d) && !/json_each/i.test(d))
  P(`## ${i + 1}. ${q.doc.toLocaleString('vi-VN')} dòng đọc · ${q.lan.toLocaleString('vi-VN')} lần · ${Math.round(q.doc / q.lan).toLocaleString('vi-VN')} dòng/lần · lệnh: ${q.lenhChinh}`)
  P()
  P('```sql'); P(cat(q.sql.replace(/\s+/g, ' ').trim(), 700)); P('```')
  P()
  if (quet.length) {
    P(`**Quét toàn bảng:** ${quet.map((d) => { const b = /^SCAN (?:TABLE )?"?([A-Za-z0-9_]+)"?/.exec(d)?.[1]; const n = b ? soBang(b) : null; return `\`${d.replace(/^SCAN /, '')}\`${n !== null ? ` (${n.toLocaleString('vi-VN')} dòng)` : ''}` }).join(' · ')}`)
    P()
  }
  P('Kế hoạch: ' + kehoach.map((d) => `\`${d}\``).join(' → '))
  P()
})
writeFileSync(join(REPO, `docs/do-tai-d1/explain-${ma}.md`), dong.join('\n') + '\n')
console.log(`Đã ghi docs/do-tai-d1/explain-${ma}.md (${ds.length} truy vấn)`)
