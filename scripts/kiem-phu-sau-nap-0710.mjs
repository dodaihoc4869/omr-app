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

// Query trực tiếp cau_bo_tro theo bam — không JOIN để tránh đếm trùng khi 1 bam có nhiều qid
const sql = `SELECT bam, json_array_length(song_sinh_json) as so_ban FROM cau_bo_tro WHERE bam IN (${bamIn}) ORDER BY bam`;

const outFile = '/tmp/kiem-phu-sau-nap.json';
execSync(`npx -y wrangler@latest d1 execute omr --remote --command "${sql}" --json > ${outFile}`, { stdio: 'inherit' });

const raw = JSON.parse(fs.readFileSync(outFile, 'utf8'));
const rows = raw[0]?.results ?? [];

// Gộp theo bam duy nhất (lấy max so_ban nếu có nhiều dòng cùng bam)
const bamMap = new Map();
for (const r of rows) {
  const cur = bamMap.get(r.bam) ?? 0;
  if (r.so_ban > cur) bamMap.set(r.bam, r.so_ban);
}

const du = bams.filter(b => (bamMap.get(b) ?? 0) >= 6);
const thieu = bams.filter(b => bamMap.has(b) && bamMap.get(b) < 6);
const chuaCo = bams.filter(b => !bamMap.has(b));

console.log(`\n===== KẾT QUẢ =====`);
console.log(`Tổng bam duy nhất cần kiểm: ${bams.length}`);
console.log(`Đã có trong D1: ${bamMap.size}`);
console.log(`Đủ ≥6 bản: ${du.length}`);
console.log(`Thiếu bản: ${thieu.length}`);
console.log(`Chưa có trong D1: ${chuaCo.length}`);

if (thieu.length > 0) {
  console.log('\nNGUỒN THIẾU BẢN:');
  thieu.forEach(b => console.log(`  bam:${b} — ${bamMap.get(b)} bản`));
}
if (chuaCo.length > 0) {
  console.log('\nBAM CHƯA CÓ TRONG D1:');
  chuaCo.forEach(b => console.log(`  ${b}`));
}

// Ghi kết quả ra file để upload artifact
fs.writeFileSync(outFile, JSON.stringify({ tong: bams.length, du: du.length, thieu: thieu.length, chuaCo: chuaCo.length, chiTietThieu: thieu.map(b => ({ bam: b, soBan: bamMap.get(b) })), chiTietChuaCo: chuaCo }, null, 2));

if (thieu.length > 0 || chuaCo.length > 0) {
  process.exit(1);
} else {
  console.log(`\nHOÀN TẤT ✓ — ${du.length}/${bams.length} bam duy nhất đủ 6 bản.`);
}
