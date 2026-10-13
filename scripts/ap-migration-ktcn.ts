import { SQL_KT_CN } from '../server/src/kiem-tra-ca-nhan-schema'
import { query } from './kiem-phat-hanh-chua.mjs'
if(SQL_KT_CN.some(s=>!/^CREATE (TABLE|INDEX) IF NOT EXISTS (kiem_tra_ca_nhan|ktcn_)/.test(s)))throw new Error('Schema kiểm tra phải chỉ-thêm.')
for(const sql of SQL_KT_CN)await query(sql)
console.log(JSON.stringify({schemaKtCn:true,soLenhChiThem:SQL_KT_CN.length}))
