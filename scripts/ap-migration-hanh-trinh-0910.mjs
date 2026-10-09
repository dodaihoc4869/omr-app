// Cổng import tự kiểm ca đang mở; chỉ CREATE bảng/index đệm, không lệnh đổi điểm.
import { readFileSync } from 'node:fs'
import { query } from './kiem-phat-hanh-chua.mjs'
const ddl=readFileSync('server/migration-0910-hanh-trinh-4.sql','utf8').replace(/^--.*$/gm,'').split(';').map(s=>s.trim()).filter(Boolean)
if(ddl.length!==6 || ddl.some(s=>!/^CREATE (TABLE|INDEX) IF NOT EXISTS hanh_trinh_v4_/.test(s))) throw new Error('Schema động cơ không phải migration chỉ thêm.')
for(const sql of ddl) await query(sql)
console.log(JSON.stringify({schemaDongCo:true,soLenhChiThem:ddl.length}))

const ddl5=readFileSync('server/migration-0910-hanh-trinh-5.sql','utf8').replace(/^--.*$/gm,'').split(';').map(s=>s.trim()).filter(Boolean)
if(ddl5.length!==6||ddl5.some(s=>!/^CREATE (TABLE|INDEX) IF NOT EXISTS hanh_trinh_v5_/.test(s)))throw new Error('Schema Hành trình v5 không chỉ thêm.')
for(const sql of ddl5)await query(sql)
console.log(JSON.stringify({schemaHanhTrinh5:true,soLenhChiThem:ddl5.length}))

const ddl6=readFileSync('server/migration-0910-hanh-trinh-6.sql','utf8').replace(/^--.*$/gm,'').split(';').map(s=>s.trim()).filter(Boolean)
if(ddl6.length!==5||ddl6.some(s=>!/^CREATE (TABLE|INDEX) IF NOT EXISTS hanh_trinh_v6_/.test(s)))throw new Error('Schema Hành trình v6 không chỉ thêm.')
for(const sql of ddl6)await query(sql)
console.log(JSON.stringify({schemaHanhTrinh6:true,soLenhChiThem:ddl6.length}))
const nguon=readFileSync('server/migration-0910-nguon-cau.sql','utf8').replace(/^--.*$/gm,'').split(';').map(s=>s.trim()).filter(Boolean)
if(nguon.length!==1||!/^CREATE TABLE IF NOT EXISTS hanh_trinh_nguon_cau\s/.test(nguon[0]))throw new Error('Schema nguồn câu không chỉ thêm.')
for(const sql of nguon)await query(sql)
console.log(JSON.stringify({schemaNguonCau:true,soLenhChiThem:nguon.length}))
