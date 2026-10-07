// Ba tệp cố định; áp chỉ phần schema còn thiếu. Không sửa/xoá dữ liệu học sinh hoặc bật tính năng.
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
const args = process.argv.slice(2)
if (!args.includes('--remote') && !args.includes('--local'))
  throw new Error('Cần ghi rõ --local hoặc --remote.')
const target = args.includes('--remote') ? '--remote' : '--local'
const base = [
  'wrangler',
  'd1',
  'execute',
  'omr',
  target,
  '--config',
  'server/wrangler.toml',
]
const pos = args.indexOf('--persist-to')
if (pos >= 0) {
  if (target !== '--local' || !args[pos + 1])
    throw new Error('--persist-to chỉ dùng cho kiểm cục bộ.')
  base.push('--persist-to', args[pos + 1])
}
const run = (du) =>
  execFileSync('npx', [...base, ...du], {
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
  })
const query = (sql) => {
  const text = run(['--command', sql, '--json'])
  const rs = JSON.parse(text)
  return rs.flatMap((x) => x.results ?? [])
}
const file = (path) => run(['--file', path, '--yes'])
const initial = 'server/migration-0710-chua-cau-sai.sql'
const extra = 'server/migration-0710-vong-chua-chat-luong.sql'
const trigger = 'server/migration-z-0710-chua-giao-tu-so.sql'
const temp = mkdtempSync(join(tmpdir(), 'chua-schema-'))
try {
  file(initial) // IF NOT EXISTS; có thể chạy lại với bản D1 đã áp PR189.
  const columns = new Map()
  const pending = []
  for (const sql of readFileSync(extra, 'utf8')
    .replace(/^\s*--.*$/gm, '')
    .split(';')
    .map((x) => x.trim())
    .filter(Boolean)) {
    const match = /^ALTER TABLE (\w+) ADD COLUMN (\w+)\b/i.exec(sql)
    if (match) {
      const [, table, col] = match
      if (!columns.has(table))
        columns.set(
          table,
          new Set(
            query(`SELECT name FROM pragma_table_info('${table}')`).map(
              (x) => x.name,
            ),
          ),
        )
      if (columns.get(table).has(col)) continue
      columns.get(table).add(col)
    } else if (!/^CREATE (TABLE|INDEX) IF NOT EXISTS\b/i.test(sql))
      throw new Error('Migration mở rộng có câu lệnh ngoài CREATE/ADD COLUMN.')
    pending.push(sql)
  }
  const generated = readFileSync(trigger, 'utf8')
  if (
    /\b(DROP|DELETE|RENAME|TRUNCATE)\b/i.test(generated) ||
    !generated.includes('CREATE TRIGGER IF NOT EXISTS chua_giao_sai_sau_ghi')
  )
    throw new Error('Tệp trigger không đúng phạm vi đã soát.')
  if (pending.length) {
    const path = join(temp, 'them.sql')
    writeFileSync(path, pending.join(';\n') + ';\n')
    file(path)
  }
  // Trigger chứa UPDATE có điều kiện cho đợt chữa cũ khi SỰ KIỆN SAI MỚI được ghi;
  // tạo trigger không chạy UPDATE trên dữ liệu cũ. Vì vậy dùng workflow riêng đã soát.
  file(trigger)
  const rs = query(
    "SELECT name FROM sqlite_master WHERE type='trigger' AND name IN ('chua_giao_sai_sau_ghi','chua_giao_sai_sau_cong_bo')",
  )
  if (rs.length !== 2) throw new Error('Thiếu trigger giao câu sai.')
  console.log(
    `Đã kiểm schema vòng chữa (${target}); ${pending.length} câu schema được áp; 2 trigger có mặt. Cờ tính năng chưa thay đổi.`,
  )
} finally {
  rmSync(temp, { recursive: true, force: true })
}
