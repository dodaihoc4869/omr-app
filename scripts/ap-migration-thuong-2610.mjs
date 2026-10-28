// THƯỞNG PHẠT 26/10: áp hai migration CHỈ-THÊM (server/migration-2610-thuong-phat.sql rồi -giai-ban.sql) qua API từng câu — không --file, D1 không ngừng phục vụ.
// Câu lệnh nộp câu ghi vào các bảng này trong cùng lô ⇒ PHẢI chạy trước bước đẩy Worker. Chạy lại bao nhiêu lần cũng được (IF NOT EXISTS / OR IGNORE).
import { readFileSync } from 'node:fs'
// Import này tự chạy cổng ca thường trước khi trả hàm query (có ca thi đang mở ⇒ dừng phát hành).
import { query } from './kiem-phat-hanh-chua.mjs'

export function tachCau(sql) {
  const ds = []
  let cur = []
  for (const dong of sql.split('\n')) {
    if (/^\s*--/.test(dong) || (!cur.length && !dong.trim())) continue
    cur.push(dong)
    const dau = cur[0].trim()
    const het = /^CREATE TRIGGER/i.test(dau) ? /^\s*END;\s*$/i.test(dong) : /;\s*$/.test(dong)
    if (het) { ds.push(cur.join('\n').trim()); cur = [] }
  }
  if (cur.join('').trim()) throw new Error('Migration thưởng phạt: câu cuối thiếu dấu «;».')
  return ds
}

const CHI_THEM = /^(CREATE (UNIQUE )?INDEX IF NOT EXISTS|CREATE TABLE IF NOT EXISTS|CREATE TRIGGER IF NOT EXISTS|INSERT OR IGNORE INTO)\s/i
// 28/10: + bảng việc hôm nay của Tự sửa lỗi (tu-sua-viec-ngay.ts) — cùng đường áp chỉ-thêm từng câu, trước bước đẩy Worker.
// 28/10: + bảng khoá chặng sau Tự sửa lỗi (tu_sua_khoa_ngay) — «sửa phải xong mới hiện chặng sau».
const ds = ['server/migration-2610-thuong-phat.sql', 'server/migration-2610-giai-ban.sql', 'server/migration-2810-tu-sua-viec-ngay.sql', 'server/migration-2810-tu-sua-khoa.sql'].flatMap((t) => tachCau(readFileSync(t, 'utf8')))
const sai = ds.find((s) => !CHI_THEM.test(s))
if (sai) throw new Error(`Migration thưởng phạt phải chỉ-thêm, gặp: ${sai.slice(0, 80)}`)
for (const sql of ds) await query(sql)
console.log(JSON.stringify({ schemaThuongPhat: true, soLenhChiThem: ds.length }))
