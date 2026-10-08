// Sửa thiếu bảng phụ khiến lô đọc Sảnh phải chạy lại. Chỉ CREATE IF NOT EXISTS.
// Không INSERT/UPDATE/DELETE, không thay đổi ngày bắt đầu của chiến dịch nào.
import { readFileSync } from 'node:fs'
const sql = 'CREATE TABLE IF NOT EXISTS chien_dich_bat_dau (id TEXT PRIMARY KEY, bat_dau TEXT NOT NULL)'
if (!readFileSync('server/src/srs2-d1.ts', 'utf8').includes(`LENH_TAO_BANG_BAT_DAU = '${sql}'`)) throw new Error('Schema khác mã nguồn; dừng.')
async function query(sql) {
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/d1/database/d2e6d322-374a-45d7-83a3-9fac486b23f1/query`, { method: 'POST', headers: { authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`, 'content-type': 'application/json' }, body: JSON.stringify({sql}), signal: AbortSignal.timeout(20000) })
  const data = await response.json()
  if (!response.ok || !data.success || data.result?.some(x => !x.success)) throw new Error(`D1 chưa sẵn sàng (${response.status}); dừng.`)
  return data.result.flatMap(x => x.results ?? [])
}
const exam = (await query(readFileSync('scripts/kiem-ca-mo.sql', 'utf8')))[0]
if (exam.so_ca_mo || exam.so_luot_dang_lam) throw new Error('Có ca thi mở; không đổi schema.')
const exists = (await query("SELECT COUNT(*) AS n FROM sqlite_master WHERE type='table' AND name='chien_dich_bat_dau'"))[0].n
if (!exists) await query(sql)
const columns = await query("SELECT name,type,pk FROM pragma_table_info('chien_dich_bat_dau')")
if (columns.length !== 2 || !columns.some(x => x.name === 'id' && x.pk === 1) || !columns.some(x => x.name === 'bat_dau' && x.type === 'TEXT')) throw new Error('Schema bảng chưa khớp.')
console.log(JSON.stringify({bangBatDauSanSang:true,vuaBoSung:!exists,khongDoiDuLieuHocSinh:true}))
