// CỔNG LINT «CHỈ HẠ» (dọn mã 02/11) — cùng luật với mốc tốc độ: số lỗi / cảnh báo oxlint chỉ được GIẢM, không được tăng.
//
// Vì sao không sửa hết một lượt: ~260 lỗi + ~1 200 cảnh báo có sẵn, phần lớn là biến dùng trong closure (chạy đúng). Sửa ồ ạt = hàng chục nghìn dòng đổi,
// giẫm mọi nhánh đang mở. Thay vào đó: chốt mốc hiện tại, mã MỚI không được thêm lỗi, ai sửa bớt thì hạ mốc.
// Luật so:
//   · LỖI so TỪNG LUẬT (`docs/moc-lint.json` → loi[luật]) — sửa một luật không được «đổi chỗ» cho lỗi luật khác.
//   · CẢNH BÁO so TỔNG (canhBao) — dung sai 0.
// Cách dùng: `node scripts/kiem-moc-lint.mjs` (so mốc, đỏ ⇒ thoát 1) · `--ha` (ghi mốc mới, CHỈ khi mọi số ≤ mốc cũ) · `--in` (in số đo).
import { readFileSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const GOC = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const TEP_MOC = resolve(GOC, 'docs/moc-lint.json')

/** Chạy oxlint (cấu hình `.oxlintrc.json`) và đếm: lỗi theo luật + tổng cảnh báo. */
function doLint() {
  let ra
  try {
    ra = execFileSync('npx', ['oxlint', '-f', 'json'], { cwd: GOC, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] })
  } catch (e) {
    ra = e.stdout // oxlint thoát 1 khi có lỗi — đầu ra JSON vẫn đủ
  }
  const { diagnostics = [] } = JSON.parse(ra)
  const loi = {}
  let canhBao = 0
  for (const d of diagnostics) {
    if (d.severity === 'error') loi[d.code] = (loi[d.code] ?? 0) + 1
    else canhBao++
  }
  return { loi: Object.fromEntries(Object.entries(loi).sort(([a], [b]) => a.localeCompare(b))), canhBao }
}

const tong = (o) => Object.values(o).reduce((s, n) => s + n, 0)
const moi = doLint()

if (process.argv.includes('--in')) {
  console.log(JSON.stringify(moi, null, 2))
  process.exit(0)
}

const moc = JSON.parse(readFileSync(TEP_MOC, 'utf8'))
const vuot = []
for (const [luat, n] of Object.entries(moi.loi)) {
  const m = moc.loi[luat] ?? 0
  if (n > m) vuot.push(`  lỗi ${luat}: ${n} (mốc ${m}, +${n - m})`)
}
if (moi.canhBao > moc.canhBao) vuot.push(`  cảnh báo: ${moi.canhBao} (mốc ${moc.canhBao}, +${moi.canhBao - moc.canhBao})`)

console.log(`oxlint: ${tong(moi.loi)} lỗi (mốc ${tong(moc.loi)}) · ${moi.canhBao} cảnh báo (mốc ${moc.canhBao})`)
if (vuot.length) {
  console.log('ĐỎ — mã mới thêm lỗi/cảnh báo lint (chạy `npx oxlint` xem vị trí, sửa rồi chạy lại):')
  console.log(vuot.join('\n'))
  process.exit(1)
}

const thapHon = tong(moi.loi) < tong(moc.loi) || moi.canhBao < moc.canhBao
if (process.argv.includes('--ha')) {
  if (thapHon) {
    writeFileSync(TEP_MOC, JSON.stringify({ ghiChu: moc.ghiChu, ...moi }, null, 2) + '\n')
    console.log('Đã HẠ mốc docs/moc-lint.json.')
  } else console.log('Không có gì để hạ.')
} else if (thapHon) console.log('XANH — thấp hơn mốc: chạy `node scripts/kiem-moc-lint.mjs --ha` để hạ mốc.')
else console.log('XANH — bằng mốc.')
