#!/usr/bin/env node
// Cổng «test đỏ chỉ hạ, so theo TÊN» (02/11, dọn mã). Đọc kết quả `vitest run --reporter=json --outputFile=<tệp>` và so với docs/nen-vitest-do.json.
// - Test đỏ có tên CHƯA nằm trong nền ⇒ đỏ (lỗi mới, sửa trước khi đẩy).
// - Test trong nền đã xanh / đã xoá ⇒ chạy lại với `--ha` để bỏ khỏi nền. Nền CHỈ HẠ, không bao giờ thêm tay.
// - `--chay-lai`: test đỏ mới được chạy lại MỘT lần riêng tệp của nó (chạy cả bộ máy quá tải ⇒ vài test hẹn giờ đỏ chập chờn); vẫn đỏ mới tính.
// Dùng: node scripts/kiem-test-do.mjs <vitest.json> [--ha] [--chay-lai]
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'

const NEN = 'docs/nen-vitest-do.json'
const tepKq = process.argv.slice(2).find(a => !a.startsWith('--'))
const ha = process.argv.includes('--ha')
if (!tepKq) { console.error('Dùng: node scripts/kiem-test-do.mjs <vitest.json> [--ha]'); process.exit(2) }

const ten = (tep, t) => `${relative(process.cwd(), tep)} > ${[...(t.ancestorTitles ?? []), t.title].join(' > ')}`
const docDo = (tep) => {
  const kq = JSON.parse(readFileSync(tep, 'utf8')), s = new Set()
  for (const f of kq.testResults ?? []) {
    const loiTep = f.status === 'failed' && !(f.assertionResults ?? []).some(t => t.status === 'failed')
    if (loiTep) s.add(`${relative(process.cwd(), f.name)} > (lỗi nạp tệp)`)
    for (const t of f.assertionResults ?? []) if (t.status === 'failed') s.add(ten(f.name, t))
  }
  return s
}
const do_ = docDo(tepKq)

const nen = JSON.parse(readFileSync(NEN, 'utf8'))
const cu = new Set(nen.ten ?? [])
let moi = [...do_].filter(t => !cu.has(t)).sort()
if (moi.length && process.argv.includes('--chay-lai')) {
  const tep = [...new Set(moi.map(t => t.split(' > ')[0]))]
  const ra = join(mkdtempSync(join(tmpdir(), 'test-do-')), 'lai.json')
  try { execFileSync('npx', ['vitest', 'run', ...tep, '--reporter=json', `--outputFile=${ra}`], { stdio: 'ignore' }) } catch { /* đỏ thì vitest thoát 1 — đọc tệp kết quả */ }
  const lai = docDo(ra)
  const chapChon = moi.filter(t => !lai.has(t))
  if (chapChon.length) console.log(`(chạy lại ${tep.length} tệp: ${chapChon.length} test đỏ chập chờn, lượt hai xanh)`)
  moi = moi.filter(t => lai.has(t))
}
const daXanh = [...cu].filter(t => !do_.has(t))

if (ha && daXanh.length) {
  nen.ten = [...cu].filter(t => do_.has(t)).sort()
  writeFileSync(NEN, JSON.stringify(nen, null, 2) + '\n')
  console.log(`Đã HẠ nền: bỏ ${daXanh.length} test đã xanh / đã xoá.`)
}
if (moi.length) {
  console.error(`✗ ${moi.length} test đỏ MỚI (không có trong nền):\n` + moi.map(t => '  - ' + t).join('\n'))
  process.exit(1)
}
console.log(`kiem-test-do: 0 test đỏ mới · ${do_.size} đỏ đều có trong nền (${cu.size} tên)${daXanh.length && !ha ? ` · ${daXanh.length} tên nền đã xanh — chạy --ha để hạ` : ''}.`)
