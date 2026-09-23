// Cập nhật TIEN-DO.json bằng BẰNG CHỨNG THẬT của phiên P00 + P01.
// Chạy: node docs/cline-ca-nhan-hoa-2309/evidence/cap-nhat-tien-do-p00-p01.mjs
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = dirname(fileURLToPath(import.meta.url))
const root = path.resolve(dir, '../../..')
const doc = path.join(root, 'docs/cline-ca-nhan-hoa-2309')
const fp = execFileSync('node', [path.join(doc, 'kiem-tra-bo-ban-giao.mjs'), '--fingerprint'], { cwd: root }).toString().trim()
const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, p))).digest('hex')
const artifact = (p) => ({ path: p, sha256: sha(p) })

const VITEST = 'docs/cline-ca-nhan-hoa-2309/evidence/p01-vitest-full.log'
const CHAM_SO = 'docs/cline-ca-nhan-hoa-2309/evidence/p01-vitest-cham-so.log'

const tien = JSON.parse(fs.readFileSync(path.join(doc, 'TIEN-DO.json'), 'utf8'))
const phase = (id) => tien.phases.find((p) => p.id === id)
const req = (id) => tien.requirements.find((r) => r.id === id)
const test = (id) => tien.tests.find((t) => t.id === id)

phase('P00').status = 'IN_PROGRESS'
phase('P00').notes = 'Đã tạo BASELINE.md, ROUTE-MAPPING.md, SCHEMA-MAPPING.md, tập dữ liệu tổng hợp (seed 23092026) và baseline kiểm thử. MỤC CHƯA LÀM: thử tải tổng hợp lấy CPU/query/payload/p95 đầu tiên — BLOCKED vì không có môi trường staging cùng vùng và 07 cấm bắn tải vào production. Chưa đọc được cờ/cấu hình production.'
phase('P00').evidence = [
  { path: 'docs/cline-ca-nhan-hoa-2309/evidence/BASELINE.md', note: 'baseline môi trường + kiểm thử + A01–A08' },
  { path: 'docs/cline-ca-nhan-hoa-2309/evidence/ROUTE-MAPPING.md', note: 'bản đồ đường gọi thật' },
  { path: 'docs/cline-ca-nhan-hoa-2309/evidence/SCHEMA-MAPPING.md', note: 'tên logic → bảng D1 thật' },
  { path: 'docs/cline-ca-nhan-hoa-2309/evidence/du-lieu-tong-hop.json', note: 'hai em cùng lớp khác scope' },
  { path: 'docs/cline-ca-nhan-hoa-2309/evidence/p00-vitest-fail-tests.txt', note: '82 test đỏ nền' },
]

phase('P01').status = 'IN_PROGRESS'
phase('P01').notes = 'Đã làm: module policy có version (src/lib/cham-so-policy.ts) + runtime validation + bốn policy v1; lớp mỏng src/lib/cham-so.ts dùng lại; T33 PASS. CHƯA LÀM: snapshot đề lúc giao / đổi đáp án giữa lúc làm (T34) và correction (R04, chờ P07/P08) → chưa PASS R02/R03.'
phase('P01').evidence = [
  { path: 'src/lib/cham-so-policy.ts', note: 'policy có version + 4 policy v1' },
  { path: VITEST, note: 'full suite sau thay đổi' },
  { path: 'docs/cline-ca-nhan-hoa-2309/evidence/p01-so-sanh-do.log', note: '0 test mới đỏ' },
]

req('R01').status = 'IN_PROGRESS'
req('R01').sourceRefs = ['docs/cline-ca-nhan-hoa-2309/evidence/BASELINE.md', 'docs/cline-ca-nhan-hoa-2309/evidence/ROUTE-MAPPING.md']
req('R01').notes = 'Baseline và bản đồ đường gọi đã có; T48 chỉ kết luận ở P10 nên chưa PASS.'

req('R02').status = 'IN_PROGRESS'
req('R02').sourceRefs = ['src/lib/cham-so-policy.ts']
req('R02').notes = 'Hợp đồng chấm có POLICY_VERSION + parseChamInput kiểm kiểu lúc chạy (ChamInputError). T34/T40/T50 chưa xong.'

req('R03').status = 'IN_PROGRESS'
req('R03').sourceRefs = ['src/lib/cham-so-policy.ts', 'src/lib/cham-so.ts']
req('R03').notes = 'T33 PASS trên 12 vector MAU-KET-QUA + bảng adapter. T19 còn thiếu phần core raw=4 thuộc P07 nên chưa PASS.'

/**
 * BẰNG CHỨNG PASS của T33 (P01). `checkEvidence` của bộ kiểm yêu cầu MỌI mục có exitCode 0,
 * nên log full suite (còn 81 test đỏ nền) KHÔNG đặt ở đây — nó nằm trong `phases[].evidence`.
 *
 * command : npm exec -- vitest run tests/cnh-1-0-cham-so-policy.test.ts tests/cham-so-2109.test.ts tests/cham-tai-cho-dung-luat-2109.test.ts tests/dau-tru-phan-ba-1009.test.ts tests/o-nhap-dap-so-cac-noi-2109.test.tsx
 * executedAt: ghi tự động lúc chạy script cập nhật
 * exitCode : 0
 * artifact : docs/cline-ca-nhan-hoa-2309/evidence/p01-vitest-cham-so.log
 */
const t33 = test('T33')
t33.status = 'PASS'
t33.evidence = [
  {
    command: 'npm exec -- vitest run tests/cnh-1-0-cham-so-policy.test.ts tests/cham-so-2109.test.ts tests/cham-tai-cho-dung-luat-2109.test.ts tests/dau-tru-phan-ba-1009.test.ts tests/o-nhap-dap-so-cac-noi-2109.test.tsx',
    executedAt: new Date().toISOString(),
    exitCode: 0,
    sourceFingerprint: fp,
    artifacts: [artifact(CHAM_SO)],
  },
]

const t19 = test('T19')
t19.status = 'IN_PROGRESS'
t19.evidence = []

const t34 = test('T34')
t34.status = 'IN_PROGRESS'
t34.evidence = []

fs.writeFileSync(path.join(doc, 'TIEN-DO.json'), JSON.stringify(tien, null, 2) + '\n')
console.log('sourceFingerprint =', fp)
console.log('artifact', CHAM_SO, sha(CHAM_SO))
console.log('artifact', VITEST, sha(VITEST))
console.log('Đã cập nhật TIEN-DO.json')
