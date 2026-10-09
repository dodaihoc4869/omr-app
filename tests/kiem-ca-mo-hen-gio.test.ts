// @vitest-environment node
import { readFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import { expect, it } from 'vitest'
const sql = readFileSync('scripts/kiem-ca-mo.sql', 'utf8')
it.each([
  ['2999-01-01T17:30:00+07:00', 'mo', '', 0, 0],
  ['2000-01-01T17:30:00+07:00', 'mo', '', 1, 0],
  [null, 'mo', '', 1, 0],
  ['hong', 'mo', '', 1, 0],
  ['2999-01-01T17:30:00+07:00', 'mo', 'dang_lam', 0, 1],
  ['2000-01-01T17:30:00+07:00', 'dong', '', 0, 0],
])('cổng chỉ đọc mốc %s, trạng thái %s, lượt %s', (moc, trangThai, luot, soCa, soLuot) => {
  const db = new DatabaseSync(':memory:')
  try {
    db.exec('CREATE TABLE ca(ma_ca TEXT,trang_thai TEXT,bat_dau TEXT); CREATE TABLE luot(ma_ca TEXT,trang_thai TEXT)')
    db.prepare('INSERT INTO ca VALUES(?,?,?)').run('gia', trangThai, moc)
    if (luot) db.prepare('INSERT INTO luot VALUES(?,?)').run('gia', luot)
    expect(db.prepare(sql).get()).toMatchObject({so_ca_mo:soCa,so_luot_dang_lam:soLuot})
  } finally { db.close() }
})
