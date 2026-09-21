// BỘ BẮN TẢI GIẢ — ĐIỀU PHỐI MỘT LƯỢT (Code 1, 21/09/2026; Boss: chạy lại sau mỗi gói của Code 3 để chứng minh giảm).
//   node scripts/ban-tai-gia/chay.mjs [--commit=HEAD|<mã>] [--cay-hien-tai] [--so-em=250] [--phut=10] [--nhanh=1] [--cong=8788] [--khong-khoi-dong]
// Việc làm: (1) dựng cây mã ĐÚNG commit (worktree tách rời — không bị phiên khác sửa giữa chừng, không đụng cây chính); (2) chép vỏ đo + cấu hình cục bộ + D1 mẫu (đã nạp từ bản sao lưu, em giả) vào đó;
// (3) `wrangler dev --local` (KHÔNG --remote, database_id giả) trên 127.0.0.1; (4) bắn tải (ban.mjs); (5) lấy sổ đo, viết `docs/do-tai-d1/ban-tai-<mã>.md` + `.json`; (6) tắt Worker, gỡ worktree.
// Điều kiện: đã chạy `node scripts/ban-tai-gia/nap-sao-luu.mjs` rồi `node scripts/ban-tai-gia/chuan-bi.mjs` (tạo .trang-thai/mau.sqlite, em-gia.json, .dev.vars).
import { execFileSync, spawn } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { banTai } from './ban.mjs'
import { lapMarkdown, gomTheoLenh } from './phan-tich.mjs'

const GOC = dirname(fileURLToPath(import.meta.url))
const REPO = join(GOC, '../..')
const TT = join(GOC, '.trang-thai')
const arg = (ten, mac) => { const a = process.argv.find((x) => x.startsWith(`--${ten}=`)); return a ? a.split('=').slice(1).join('=') : mac }
const co = (ten) => process.argv.includes(`--${ten}`)
const soEm = Number(arg('so-em', 250)), phut = Number(arg('phut', 10)), nhanh = Number(arg('nhanh', 1)), cong = Number(arg('cong', 8788))
const git = (...a) => execFileSync('git', a, { cwd: REPO, encoding: 'utf8' }).trim()
const log = (...a) => console.log(new Date().toTimeString().slice(0, 8), ...a)

for (const f of ['mau.sqlite', 'mau.json', 'em-gia.json']) if (!existsSync(join(TT, f))) { console.error(`Thiếu .trang-thai/${f} — chạy nap-sao-luu.mjs rồi chuan-bi.mjs trước.`); process.exit(1) }
const mau = JSON.parse(readFileSync(join(TT, 'mau.json'), 'utf8'))
const sha = co('cay-hien-tai') ? git('rev-parse', '--short', 'HEAD') : git('rev-parse', '--short', arg('commit', 'HEAD'))
const nhan = co('cay-hien-tai') ? `${sha}+cay-hien-tai` : sha

// (1) cây mã
let cay = REPO, laWorktree = false
if (!co('cay-hien-tai')) {
  cay = join(TT, 'cay', sha)
  try { rmSync(join(cay, 'node_modules'), { force: true }); execFileSync('git', ['worktree', 'remove', '--force', cay], { cwd: REPO, stdio: 'ignore' }) } catch { /* chưa có */ }
  rmSync(cay, { recursive: true, force: true })
  execFileSync('git', ['worktree', 'prune'], { cwd: REPO, stdio: 'ignore' })
  mkdirSync(join(TT, 'cay'), { recursive: true })
  execFileSync('git', ['worktree', 'add', '--detach', cay, sha], { cwd: REPO, stdio: 'ignore' })
  symlinkSync(join(REPO, 'node_modules'), join(cay, 'node_modules'))
  laWorktree = true
}
log(`Cây mã: ${laWorktree ? 'worktree tại commit ' + sha : 'CÂY HIỆN TẠI (có thể lẫn sửa dở của phiên khác)'}`)

// (2) vỏ đo + cấu hình + D1 mẫu
const dichGoc = join(cay, 'scripts/ban-tai-gia')
mkdirSync(dichGoc, { recursive: true })
if (dichGoc !== GOC) for (const f of ['vo-do.ts', 'wrangler.toml', '.dev.vars']) copyFileSync(join(GOC, f), join(dichGoc, f))
const chay = join(dichGoc, '.chay')
rmSync(chay, { recursive: true, force: true })
const thuMucD1 = join(chay, 'v3/d1/miniflare-D1DatabaseObject')
mkdirSync(thuMucD1, { recursive: true })
copyFileSync(join(TT, 'mau.sqlite'), join(thuMucD1, mau.tenTep))

// (3) Worker cục bộ
const nhatKy = join(TT, `dev-${sha}.log`)
const dev = spawn('npx', ['wrangler', 'dev', '--local', '--config', join(dichGoc, 'wrangler.toml'), '--persist-to', chay, '--port', String(cong), '--ip', '127.0.0.1', '--log-level', 'warn'], {
  cwd: cay, detached: true, stdio: ['ignore', 'pipe', 'pipe'],
})
const ghiLog = []
dev.stdout.on('data', (d) => ghiLog.push(String(d))); dev.stderr.on('data', (d) => ghiLog.push(String(d)))
const tat = () => { try { process.kill(-dev.pid, 'SIGTERM') } catch { /* đã tắt */ } }
process.on('exit', tat); process.on('SIGINT', () => { tat(); process.exit(130) })
const goc = `http://127.0.0.1:${cong}`
let sanSang = false
for (let i = 0; i < 90 && !sanSang; i++) {
  try { const r = await fetch(goc + '/__do/reset', { signal: AbortSignal.timeout(2000) }); sanSang = r.ok } catch { await new Promise((ok) => setTimeout(ok, 1000)) }
}
if (!sanSang) { writeFileSync(nhatKy, ghiLog.join('')); tat(); console.error('Worker cục bộ không lên — xem', nhatKy); process.exit(1) }
log(`Worker cục bộ sẵn sàng tại ${goc}`)

// (4)-(5) bắn tải, lấy sổ đo
const batDau = new Date(Date.now() + 7 * 3600_000).toISOString().replace('T', ' ').slice(0, 19) + ' (giờ VN)'
let kq
try {
  kq = await banTai({ goc, soEm, phut, nhanh, log, khoiDongKeHoach: !co('khong-khoi-dong') })
} catch (e) {
  writeFileSync(nhatKy, ghiLog.join('')); tat(); console.error('Lỗi khi bắn tải:', e?.message ?? e, '\nNhật ký Worker:', nhatKy); process.exit(1)
} finally {
  await new Promise((ok) => setTimeout(ok, 2500)) // để việc phụ sau khi trả lời (waitUntil) kịp ghi vào sổ đo
}
const dump = (await (await fetch(goc + '/__do/dump')).json()).luot
writeFileSync(nhatKy, ghiLog.join(''))
tat()

// (6) viết bản đo
const cauHinh = { soEm: kq.soEm, phut, nhanh, nhipNenGiay: 180, thoiGianThatGiay: kq.thoiGianThatGiay, saoLuu: mau.saoLuu }
const ghiChu = [...kq.ghiChu, `Cây mã: ${laWorktree ? `commit ${sha} (worktree sạch)` : 'cây hiện tại của máy (không tái lập được)'}; bộ đệm mô-đun của Worker bắt đầu TRỐNG (như vừa đẩy bản mới).`]
const ra = join(REPO, 'docs/do-tai-d1')
mkdirSync(ra, { recursive: true })
const md = lapMarkdown({ ma: nhan, batDau, cauHinh, khach: kq.khach, dump, ghiChu })
writeFileSync(join(ra, `ban-tai-${nhan}.md`), md + '\n')
writeFileSync(join(ra, `ban-tai-${nhan}.json`), JSON.stringify({ ma: nhan, batDau, cauHinh, theoLenh: gomTheoLenh(kq.khach, dump).map(({ lenh, n, loi, ms50, ms95, tvTb, tvMax, docTb, docMax, vuot }) => ({ lenh, n, loi, ms50, ms95, tvTb: +tvTb.toFixed(2), tvMax, docTb: Math.round(docTb), docMax, vuot })) }, null, 1) + '\n')
log(`Đã ghi docs/do-tai-d1/ban-tai-${nhan}.md (+ .json)`)
const vuot = gomTheoLenh(kq.khach, dump).filter((b) => b.vuot)
log(`Lệnh VƯỢT ngân sách: ${vuot.length}${vuot.length ? ' — ' + vuot.slice(0, 6).map((b) => b.lenh).join(' · ') : ''}`)

if (laWorktree) { try { rmSync(join(cay, 'node_modules'), { force: true }); execFileSync('git', ['worktree', 'remove', '--force', cay], { cwd: REPO, stdio: 'ignore' }) } catch { /* để lại cho lần sau dọn */ } }
process.exit(0)
