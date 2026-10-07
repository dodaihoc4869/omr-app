// @vitest-environment node
// Wrangler/D1 cục bộ: nâng từ năm bảng PR189, chạy lại không lỗi và giữ receipt cũ.
import { it, expect } from 'vitest'
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { taoD1That } from './_d1-that'
it('migration vòng chữa áp hai lần trên D1 cục bộ, giữ nguyên dữ liệu đã có', () => {
  const d = taoD1That(),
    temp = mkdtempSync(join(tmpdir(), 'chua-migration-test-')),
    persist = join(temp, 'd1')
  const env = { ...process.env, WRANGLER_SEND_METRICS: 'false' }
  const run = (args: string[]) =>
    execFileSync(
      'npx',
      [
        'wrangler',
        'd1',
        'execute',
        'omr',
        '--local',
        '--persist-to',
        persist,
        '--config',
        'server/wrangler.toml',
        ...args,
      ],
      { env, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 },
    )
  try {
    // Dump schema ngoài chữa của SQLite fixture; năm bảng chữa dùng nguyên SQL PR189 chưa thêm cột.
    const rows = d.sql
      .prepare(
        "SELECT sql FROM sqlite_master WHERE sql IS NOT NULL AND type IN ('table','index') AND name NOT LIKE 'sqlite_%' AND tbl_name NOT LIKE 'chua_loi_%' ORDER BY CASE type WHEN 'table' THEN 0 ELSE 1 END,name",
      )
      .all() as { sql: string }[]
    const path = join(temp, 'truoc.sql')
    writeFileSync(
      path,
      rows.map((x) => x.sql + ';').join('\n') +
        '\n' +
        readFileSync('server/migration-0710-chua-cau-sai.sql', 'utf8') +
        "\nINSERT INTO chua_loi_dot(id,sbd,qid_chuan,mo_luc,tao_luc,cap_nhat_luc) VALUES('cu','HS-cu','Q-cu',123,123,123);\n",
    )
    run(['--file', path, '--yes'])
    for (let i = 0; i < 2; i++)
      expect(
        execFileSync(
          process.execPath,
          ['scripts/ap-migration-chua.mjs', '--local', '--persist-to', persist],
          { env, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 },
        ),
      ).toContain('2 trigger có mặt')
    const result = JSON.parse(
      run([
        '--json',
        '--command',
        "SELECT id,sbd,qid_chuan,mo_luc,tao_luc,cap_nhat_luc FROM chua_loi_dot WHERE id='cu'",
      ]),
    )
    expect(result[0].results).toEqual([
      {
        id: 'cu',
        sbd: 'HS-cu',
        qid_chuan: 'Q-cu',
        mo_luc: 123,
        tao_luc: 123,
        cap_nhat_luc: 123,
      },
    ])
  } finally {
    rmSync(temp, { recursive: true, force: true })
    d.sql.close()
  }
}, 60000)
