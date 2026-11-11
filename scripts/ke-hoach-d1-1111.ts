// In kế hoạch truy vấn (EXPLAIN QUERY PLAN — CHỈ ĐỌC, không chạy câu) của các câu D1 vừa viết lại 11/11 (hoá đơn Cloudflare), dùng trên D1 thật để chắc
// chỉ mục trên máy thật đúng như test. Tham số «?» thay bằng giá trị giả. Workflow: .github/workflows/ke-hoach-d1-1111.yml.
import { writeFileSync } from 'node:fs'
import { SQL_LOI_DAU_HOI, SQL_LOI_DAU_SKH } from '../server/src/chua-cau-sai-adapter'
const gia = (q: string) => q.replace(/\?/g, `'["x"]'`).replace(/\s+/g, ' ')
writeFileSync('/tmp/kh-skh.sql', `EXPLAIN QUERY PLAN ${gia(SQL_LOI_DAU_SKH)}`)
writeFileSync('/tmp/kh-hoi.sql', `EXPLAIN QUERY PLAN ${gia(SQL_LOI_DAU_HOI)}`)
