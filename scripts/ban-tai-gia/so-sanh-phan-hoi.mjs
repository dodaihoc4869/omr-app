// SO PHẢN HỒI TỪNG LỆNH GIỮA HAI MỐC (Code 1, 22/09/2026; Boss lệnh sau 79bf9ec). Dùng:
//   node scripts/ban-tai-gia/so-sanh-phan-hoi.mjs <mã cũ> <mã mới>
// Đọc docs/do-tai-d1/ban-tai-<mã>-phan-hoi.json (chay.mjs ghi khi bắn tải), so khớp theo cặp (em, lệnh), ghi docs/do-tai-d1/so-sanh-phan-hoi-<cũ>-<mới>.md.
import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { kiemLoDapAn, lapMarkdownPhanHoi, soPhanHoi } from './phan-hoi.mjs'

const REPO = join(dirname(fileURLToPath(import.meta.url)), '../..')
const [cu, moi] = process.argv.slice(2)
if (!cu || !moi) { console.error('Dùng: node scripts/ban-tai-gia/so-sanh-phan-hoi.mjs <mã cũ> <mã mới>'); process.exit(1) }
const doc = (ma) => JSON.parse(readFileSync(join(REPO, `docs/do-tai-d1/ban-tai-${ma}-phan-hoi.json`), 'utf8'))
const a = doc(cu), b = doc(moi)
const ketQua = soPhanHoi(a, b)
const canhCu = kiemLoDapAn(a), canhMoi = kiemLoDapAn(b)
const md = lapMarkdownPhanHoi({ cu, moi, ketQua, canhBaoDapAnCu: canhCu, canhBaoDapAnMoi: canhMoi })
writeFileSync(join(REPO, `docs/do-tai-d1/so-sanh-phan-hoi-${cu}-${moi}.md`), md)
console.log(`Đã ghi docs/do-tai-d1/so-sanh-phan-hoi-${cu}-${moi}.md — khớp ${ketQua.khopY}/${ketQua.tongChung}, khác ${ketQua.khacNhau.length}, lộ đáp án: cũ ${canhCu.length} · mới ${canhMoi.length}`)
if (canhCu.length || canhMoi.length) process.exitCode = 1
