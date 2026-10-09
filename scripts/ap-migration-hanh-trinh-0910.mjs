// Cổng import tự kiểm ca đang mở; chỉ CREATE bảng/index đệm, không lệnh đổi điểm.
import { readFileSync } from 'node:fs'
import { query } from './kiem-phat-hanh-chua.mjs'
const ddl=readFileSync('server/migration-0910-hanh-trinh-4.sql','utf8').replace(/^--.*$/gm,'').split(';').map(s=>s.trim()).filter(Boolean)
if(ddl.length!==6 || ddl.some(s=>!/^CREATE (TABLE|INDEX) IF NOT EXISTS hanh_trinh_v4_/.test(s))) throw new Error('Schema động cơ không phải migration chỉ thêm.')
for(const sql of ddl) await query(sql)
console.log(JSON.stringify({schemaDongCo:true,soLenhChiThem:ddl.length}))
