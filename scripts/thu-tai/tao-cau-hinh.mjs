// THỬ TẢI 28/10 — dựng cấu hình Worker SAO `omr-thu-tai` từ server/wrangler.toml (KHÔNG sửa tệp thật).
// Đổi: tên Worker, D1 (sang bản sao), R2 (sang thùng riêng), cron chỉ giữ «mỗi phút» (tải nền giống bản thật). Không route, không tên miền riêng.
// Chặn cứng: tệp ra mà còn tên / mã D1 / thùng R2 của bản thật ⇒ dừng.
import fs from 'node:fs'
const [, , dbId, ra, tuy] = process.argv
if (!/^[0-9a-f-]{36}$/.test(dbId || '')) { console.error('Thiếu mã D1 sao'); process.exit(1) }
const goc = fs.readFileSync(new URL('../../server/wrangler.toml', import.meta.url), 'utf8')
const MA_THAT = 'd2e6d322-374a-45d7-83a3-9fac486b23f1'
let t = goc
  .replace(/^name = "omr"$/m, 'name = "omr-thu-tai"')
  .replace(/^database_name = "omr"$/m, 'database_name = "omr-thu-tai"')
  .replace(`database_id = "${MA_THAT}"`, `database_id = "${dbId}"`)
  .replace(/^bucket_name = "omr-de"$/m, 'bucket_name = "omr-thu-tai-de"')
  .replace(/^crons = \[.*\]$/m, 'crons = ["* * * * *"]')
// Khoá Cloudflare không có quyền R2 (lượt 40615721475: tạo thùng sao bị từ chối) ⇒ `khong-r2`: bỏ hẳn khối R2. Bốn lệnh nóng không đọc R2
// (đo bằng test đường nóng có bọc R2: 0 lượt), các lệnh khác đọc R2 sẽ báo lỗi trên bản sao — không ảnh hưởng số đo.
if (tuy === 'khong-r2') t = t.replace(/\[\[r2_buckets\]\]\nbinding = "DE"\nbucket_name = "omr-thu-tai-de"\n/, '')
// NƠI CHẠY: Worker mới với «smart» KHÔNG được dời về sát D1 sau 20 phút (lượt 40617819248: 100% `local-PDX/SEA`, D1 ở APAC ⇒ mỗi lượt D1 đi
// Mỹ–châu Á). Bản thật đã được dời sát D1 (Hồng Kông). NOI_DAT=aws:ap-east-1 ⇒ ghim Worker sao ở Hồng Kông (placement «targeted») cho giống bản thật.
if (process.env.NOI_DAT) t = t.replace(/^\[placement\]\nmode = "smart"$/m, `[placement]\nmode = "targeted"\nregion = "${process.env.NOI_DAT}"`)
const loi = []
if (process.env.NOI_DAT && !/mode = "targeted"/.test(t)) loi.push('chưa đổi được nơi chạy')
if (tuy === 'khong-r2' && /^\[\[r2_buckets\]\]/m.test(t)) loi.push('chưa bỏ được khối R2')
if (!/^name = "omr-thu-tai"$/m.test(t)) loi.push('tên')
if (t.includes(MA_THAT)) loi.push('mã D1 thật')
if (/^database_name = "omr"$/m.test(t)) loi.push('tên D1 thật')
if (/bucket_name = "omr-de"/.test(t)) loi.push('thùng R2 thật')
if (/^\s*(routes?|route)\s*=/m.test(t) || /custom_domain/.test(t)) loi.push('có route')
if (loi.length) { console.error('DỪNG: cấu hình sao còn ' + loi.join(', ')); process.exit(1) }
fs.writeFileSync(ra, t)
console.log('Đã dựng cấu hình sao:', ra)
