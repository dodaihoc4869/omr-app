/**
 * nap-song-sinh-0710.mjs — nạp 216 ứng viên / 36 nguồn vào D1
 * Phân biệt lỗi thật với "thừa"/"đã đủ"; bỏ qua nguồn đã xong; idempotent.
 * Dùng: OMR_MA_BI_MAT=<mã> node scripts/nap-song-sinh-0710.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..', '.may-soan', 'ban-giao-sau-ban');
const key = process.env.OMR_MA_BI_MAT;
if (!key) throw new Error('Thiếu OMR_MA_BI_MAT trong environment');

const URL_WORKER = process.env.OMR_WORKER_URL || 'https://omr.ttadodaihoc.workers.dev';
const CHECKPOINT_FILE = path.join(root, 'ket-qua-nap-D1.json');
const CAN_BAN = 6;

const checkpoint = fs.existsSync(CHECKPOINT_FILE)
  ? JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf8'))
  : [];
const daXong = new Set(
  checkpoint
    .filter(r => r.ketLuan === 'xong' || (r.result?.ok && (r.result?.banKhac?.giu ?? 0) >= CAN_BAN))
    .map(r => r.qid)
);
console.log(`Checkpoint: ${checkpoint.length} đã chạy, ${daXong.size} đã đủ ${CAN_BAN} bản → skip`);

const noiDungDir = path.join(root, 'noi-dung');
const tatCaBam = fs.readdirSync(noiDungDir).sort();
const results = [...checkpoint];

let soMoi = 0, soSkip = 0, soLoi = 0, soThieu = 0;

for (const bam of tatCaBam) {
  const u = JSON.parse(fs.readFileSync(path.join(noiDungDir, bam, 'ung-vien.json')));
  const qid = u.qid;

  if (daXong.has(qid)) {
    soSkip++;
    process.stdout.write(`SKIP ${qid}\n`);
    continue;
  }

  let response, result;
  try {
    response = await fetch(`${URL_WORKER}/kho/may-soan/nop-bo-tro`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-ma-bi-mat': key.trim() },
      body: JSON.stringify({ qid: u.qid, bam: u.bam, songSinh: u.songSinh }),
    });
    result = await response.json();
  } catch (e) {
    const entry = { qid, bam, ketLuan: 'loi-mang', loi: e.message };
    const idx = results.findIndex(r => r.qid === qid);
    if (idx >= 0) results[idx] = entry; else results.push(entry);
    fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(results, null, 2));
    console.error(`LỖI MẠNG ${qid}: ${e.message}`);
    soLoi++;
    continue;
  }

  const boLyDo = result?.banKhac?.bo ?? [];
  const boLoiThat = boLyDo.filter(b => {
    const ly = b?.lyDo ?? '';
    return !ly.includes('thừa') && !ly.includes('đã đủ') && !ly.includes('đã có đủ');
  });
  const soGiu = result?.banKhac?.giu ?? 0;
  const coLoiThat = !response.ok || !result?.ok || boLoiThat.length > 0;
  const daDu = soGiu >= CAN_BAN;
  const ketLuan = coLoiThat ? 'loi' : daDu ? 'xong' : 'thieu-ban';

  const entry = { qid, bam, ketLuan, result };
  const idx = results.findIndex(r => r.qid === qid);
  if (idx >= 0) results[idx] = entry; else results.push(entry);
  fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(results, null, 2));

  if (coLoiThat) {
    soLoi++;
    console.error(`LỖI THẬT ${qid}: ok=${result?.ok} bo=${JSON.stringify(boLoiThat)}`);
  } else if (daDu) {
    soMoi++;
    const boNote = boLyDo.length ? ` (bo: ${boLyDo.map(b=>b.lyDo).join('; ')})` : '';
    process.stdout.write(`OK   ${qid}: giu=${soGiu}${boNote}\n`);
  } else {
    soThieu++;
    process.stdout.write(`???  ${qid}: giu=${soGiu}/${CAN_BAN}\n`);
  }
}

const xong = results.filter(r => r.ketLuan === 'xong').length;
const thieu = results.filter(r => r.ketLuan === 'thieu-ban').length;
const loi = results.filter(r => r.ketLuan?.startsWith('loi')).length;

console.log('\n===== TÓM TẮT =====');
console.log(`Tổng: ${tatCaBam.length} nguồn`);
console.log(`Đã đủ ${CAN_BAN} bản: ${xong}`);
console.log(`Thiếu bản: ${thieu}`);
console.log(`Lỗi thật: ${loi}`);
console.log(`Skip: ${soSkip}`);

if (loi > 0) {
  console.error('\nCÁC NGUỒN LỖI:');
  results.filter(r => r.ketLuan?.startsWith('loi')).forEach(r => {
    console.error(`  ${r.qid}: ${r.loi || JSON.stringify(r.result?.banKhac?.bo)}`);
  });
  process.exit(1);
}
if (thieu > 0) {
  console.warn(`\n${thieu} nguồn thiếu bản — kiểm Worker.`);
  process.exit(2);
}
console.log('\nHOÀN TẤT — 36/36 nguồn đủ 6 bản.');
