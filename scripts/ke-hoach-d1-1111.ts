// Sinh câu EXPLAIN QUERY PLAN (CHỈ ĐỌC) của các câu D1 viết lại 11/11 (hoá đơn Cloudflare) vào scripts/ke-hoach-d1-1111/*.sql — chạy TẠI MÁY rồi commit;
// workflow .github/workflows/ke-hoach-d1-1111.yml đọc các tệp ấy và hỏi D1 thật (không chạy câu thật, không ghi). Tham số «?» thay bằng giá trị giả.
import { writeFileSync } from 'node:fs'
import { SQL_LOI_DAU_HOI, SQL_LOI_DAU_SKH } from '../server/src/chua-cau-sai-adapter'
const gia = (q: string) => `EXPLAIN QUERY PLAN ${q.replace(/\?/g, `'["x"]'`).replace(/\s+/g, ' ')}`
writeFileSync('scripts/ke-hoach-d1-1111/1-skh.sql', gia(SQL_LOI_DAU_SKH))
writeFileSync('scripts/ke-hoach-d1-1111/2-hoi.sql', gia(SQL_LOI_DAU_HOI))
