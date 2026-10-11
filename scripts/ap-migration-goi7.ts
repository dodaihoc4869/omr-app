import { SQL_GOI7 } from '../server/src/goi-bai-7-schema'
import { query } from './kiem-phat-hanh-chua.mjs'
// Import cổng kiểm CHỈ ĐỌC ở trên dừng nếu ca/lượt thi còn mở.
if(SQL_GOI7.some(s=>!/^CREATE (TABLE|INDEX) IF NOT EXISTS goi_bai_7(?:\b|_)/.test(s)))throw new Error('Migration gói bài phải chỉ thêm.')
for(const sql of SQL_GOI7)await query(sql)
console.log(JSON.stringify({schemaGoi7:true,soLenhChiThem:SQL_GOI7.length}))
