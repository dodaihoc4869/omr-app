// XEM LẠI LIVE 11/11: áp migration CHỈ-THÊM server/migration-z-1011-live-xem-lai.sql qua API từng câu — không --file, D1 không ngừng phục vụ
// (chạy được cả giờ cao điểm 19:00–23:59 VN). PHẢI chạy trước bước đẩy Worker để bảng có sẵn khi mã chạy; mã vẫn chịu được lúc bảng chưa có
// (server/src/live-xem-lai.ts tự `CREATE … IF NOT EXISTS` lười và bọc bắt lỗi — live không hỏng). Chạy lại bao nhiêu lần cũng được.
import { readFileSync } from 'node:fs'
import { tachCauLive } from './tach-cau-live-xem-lai.mjs'
// Import này tự chạy cổng ca thường trước khi trả hàm query (có ca thi đang mở ⇒ dừng phát hành).
import { query } from './kiem-phat-hanh-chua.mjs'

const CHI_THEM = /^(CREATE (UNIQUE )?INDEX IF NOT EXISTS|CREATE TABLE IF NOT EXISTS)\s/i
const ds = tachCauLive(readFileSync('server/migration-z-1011-live-xem-lai.sql', 'utf8'))
const sai = ds.find((s) => !CHI_THEM.test(s))
if (sai) throw new Error(`Migration Xem lại Live phải chỉ-thêm, gặp: ${sai.slice(0, 80)}`)
for (const sql of ds) await query(sql)
console.log(JSON.stringify({ schemaLiveXemLai: true, soLenhChiThem: ds.length }))
