/**
 * kiem-phu-sau-nap-0710.mjs — kiểm độ phủ 36 nguồn sau khi nạp D1
 * Dùng: CLOUDFLARE_API_TOKEN=... CLOUDFLARE_ACCOUNT_ID=... node scripts/kiem-phu-sau-nap-0710.mjs
 * (wrangler d1 execute đọc từ biến môi trường)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const noiDungDir = path.join(__dirname, '..', '.may-soan', 'ban-giao-sau-ban', 'noi-dung');
const bams = fs.readdirSync(noiDungDir).sort();
const bamIn = bams.map(b => `'${b}'`).join(',');

console.log(`Kiểm ${bams.length} bam từ D1...`);

const sql = `SELECT l.qid, b.bam, json_array_length(b.song_sinh_json) as so_ban FROM cau_bo_tro b JOIN loi_giai_cau l ON l.bam = b.bam WHERE b.bam IN (${bamIn}) ORDER BY l.qid`;

const outFile = '/tmp/kiem-phu-sau-nap.json';
execSync(`npx -y wrangler@latest d1 execute omr --remote --command "${sql}" --json > ${outFile}`, { stdio: 'inherit' });

const raw = JSON.parse(fs.readFileSync(outFile, 'utf8'));
const rows = raw[0]?.results ?? [];
const du = rows.filter(r => r.so_ban >= 6);
const thieu = rows.filter(r => r.so_ban < 6);
const chuaCo = bams.filter(b => !rows.find(r => r.bam === b));

console.log(`\n===== KẾT QUẢ =====`);
console.log(`Tổng bam cần kiểm: ${bams.length}`);
console.log(`Đã có trong D1: ${rows.length}`);
console.log(`Đủ ≥6 bản: ${du.length}`);
console.log(`Thiếu bản: ${thieu.length}`);
console.log(`Chưa có trong D1: ${chuaCo.length}`);

if (thieu.length > 0) {
  console.log('\nNGUỒN THIẾU BẢN:');
  thieu.forEach(r => console.log(`  ${r.qid} (bam:${r.bam}): ${r.so_ban} bản`));
}
if (chuaCo.length > 0) {
  console.log('\nBAM CHƯA CÓ TRONG D1:');
  chuaCo.forEach(b => console.log(`  ${b}`));
}

if (thieu.length > 0 || chuaCo.length > 0) {
  process.exit(1);
} else {
  console.log(`\nHOÀN TẤT ✓ — ${du.length}/${bams.length} nguồn đủ 6 bản.`);
}
