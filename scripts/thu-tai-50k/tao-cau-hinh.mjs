// SINH CẤU HÌNH WRANGLER CHO WORKER THỬ `omr-thu` từ server/wrangler.toml (31/10) — KHÔNG BAO GIỜ trỏ vào D1 / R2 / Worker thật.
//   node scripts/thu-tai-50k/tao-cau-hinh.mjs <wrangler.toml gốc> <tệp ra> <id D1 omr-thu> [tên R2 thử | -]
// Đổi: name → omr-thu · D1 binding DB → omr-thu (id truyền vào) · R2 DE → bucket thử (hoặc bỏ hẳn khi '-') · BỎ [triggers] (không cron) · BỎ [ai].
// Giữ: durable_objects bindings + migrations (ngăn riêng học sinh NGAN_HS …), placement smart, observability.
// Chốt an toàn: id D1 thật / tên Worker thật / bucket thật còn sót trong tệp ra ⇒ thoát lỗi, không ghi gì.
import { readFileSync, writeFileSync } from 'node:fs'

const [goc, ra, idD1, r2 = '-'] = process.argv.slice(2)
const ID_THAT = 'd2e6d322-374a-45d7-83a3-9fac486b23f1'
if (!goc || !ra || !/^[0-9a-f-]{36}$/.test(idD1 ?? '')) { console.error('Dùng: tao-cau-hinh.mjs <goc> <ra> <id-d1-omr-thu> [r2|-]'); process.exit(2) }
if (idD1 === ID_THAT) { console.error('CHẶN: id D1 truyền vào là D1 THẬT omr'); process.exit(3) }

// Tách theo khối TOML (dòng bắt đầu bằng [ … ]); bỏ khối không muốn, sửa khối cần đổi.
const dong = readFileSync(goc, 'utf8').split('\n')
const khoi = [] // {dau: string|null, dong: string[]}
for (const d of dong) {
  if (/^\s*\[/.test(d)) khoi.push({ dau: d.trim(), dong: [d] })
  else if (khoi.length) khoi[khoi.length - 1].dong.push(d)
  else khoi.push({ dau: null, dong: [d] })
}
const out = []
for (const k of khoi) {
  const dau = k.dau ?? ''
  if (dau === '[triggers]' || dau === '[ai]') continue
  let l = k.dong.filter((x) => !/^\s*#/.test(x))
  if (k.dau === null) l = l.map((x) => (/^name\s*=/.test(x) ? 'name = "omr-thu"' : x))
  if (dau === '[[d1_databases]]') {
    l = l.map((x) => (/^database_name\s*=/.test(x) ? 'database_name = "omr-thu"' : /^database_id\s*=/.test(x) ? `database_id = "${idD1}"` : x))
  }
  if (dau === '[[r2_buckets]]') {
    if (r2 === '-') continue
    l = l.map((x) => (/^bucket_name\s*=/.test(x) ? `bucket_name = "${r2}"` : x))
  }
  out.push(...l)
}
// Biến riêng cho Worker THỬ (31/10): VARS_THU="TEN=gia,TEN2=gia" ⇒ khối [vars] (vd. bật ngăn gom D1 liên isolate trên máy thử trước bản sống).
const varsThu = (process.env.VARS_THU ?? '').split(',').map((x) => x.trim()).filter((x) => /^[A-Z][A-Z0-9_]*=[\w.-]*$/.test(x))
if (varsThu.length) out.push('', '[vars]', ...varsThu.map((x) => { const [k, v] = x.split('='); return `${k} = "${v}"` }))
const chu = out.join('\n').replace(/\n{3,}/g, '\n\n')
const loi = []
if (chu.includes(ID_THAT)) loi.push('còn id D1 thật')
if (/^name\s*=\s*"omr"\s*$/m.test(chu)) loi.push('còn tên Worker thật')
if (!/^name\s*=\s*"omr-thu"\s*$/m.test(chu)) loi.push('thiếu name = "omr-thu"')
if (/bucket_name\s*=\s*"omr-de"/.test(chu)) loi.push('còn bucket R2 thật omr-de')
if (/^\[triggers\]/m.test(chu)) loi.push('còn [triggers]')
if (!/database_name\s*=\s*"omr-thu"/.test(chu)) loi.push('thiếu D1 omr-thu')
if (!/class_name\s*=\s*"NganHocSinh"/.test(chu)) loi.push('thiếu Durable Object NganHocSinh')
if (loi.length) { console.error('CHẶN cấu hình thử:', loi.join(' · ')); process.exit(4) }
writeFileSync(ra, chu)
console.log(`Đã sinh ${ra}: Worker omr-thu · D1 omr-thu · R2 ${r2 === '-' ? '(bỏ)' : r2} · không cron · ${(chu.match(/class_name/g) ?? []).length} lớp Durable Object · biến thử: ${varsThu.join(' ') || '(không)'}`)
