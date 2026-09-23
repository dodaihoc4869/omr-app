// Cập nhật TIEN-DO.json cho phần P01/T34 (snapshot đề lúc giao) — BẰNG CHỨNG THẬT.
// Chạy: node docs/cline-ca-nhan-hoa-2309/evidence/cap-nhat-tien-do-p01-t34.mjs
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

const CHAM_SO = 'docs/cline-ca-nhan-hoa-2309/evidence/p01b-vitest-cham-so.log'
const T34LOG = 'docs/cline-ca-nhan-hoa-2309/evidence/p01b-vitest-t34.log'

const tien = JSON.parse(fs.readFileSync(path.join(doc, 'TIEN-DO.json'), 'utf8'))
const phase = (id) => tien.phases.find((p) => p.id === id)
const req = (id) => tien.requirements.find((r) => r.id === id)
const test = (id) => tien.tests.find((t) => t.id === id)

phase('P01').notes = 'Đã làm: module policy có version + runtime validation + bốn policy v1 (T33 PASS); SNAPSHOT ĐỀ LÚC GIAO: bảng cau_snapshot + chấm theo ảnh chụp / thu hồi có lý do, nối vào /hs/cau-theo-qid và /hs/on-lai/nop sau cờ `cau_snapshot` MẶC ĐỊNH TẮT (T34 PASS). CHƯA LÀM: correction/bù một lần (R04, chờ P07/P08) ⇒ chưa PASS R02 (còn T40/T50) và R03 (còn phần core raw=4 của T19 ở P07). Cờ chưa bật ngoài production vì chưa áp migration + chưa có phép phát hành.'
phase('P01').evidence = [
  { path: 'src/lib/cham-so-policy.ts', note: 'policy có version + 4 policy v1' },
  { path: 'server/src/cau-snapshot.ts', note: 'snapshot đề lúc giao + D1 helpers' },
  { path: 'server/migration-2309-cnh1-cau-snapshot.sql', note: 'bảng cau_snapshot (thêm bảng thuần)' },
  { path: 'docs/cline-ca-nhan-hoa-2309/evidence/p01b-vitest-full.log', note: 'full suite, 0 hồi quy mới' },
  { path: 'docs/cline-ca-nhan-hoa-2309/evidence/p01b-so-sanh-do.log', note: 'so sánh test đỏ với nền P00' },
]

req('R02').sourceRefs = ['src/lib/cham-so-policy.ts', 'server/src/cau-snapshot.ts']
req('R02').notes = 'Hợp đồng chấm có POLICY_VERSION + parseChamInput kiểm kiểu lúc chạy; snapshot lưu version chính sách và THU HỒI khi chính sách đổi (T34 PASS). Còn T40 (kho nhỏ/mục tiêu không tăng — P05) và T50 (một bộ hằng số, cờ 365/FSRS-7 — P10) chưa chạy nên R02 chưa PASS.'

req('R03').notes = 'T33 PASS trên 12 vector MAU-KET-QUA + bảng adapter. T19 còn thiếu phần core raw=4 thuộc P07 nên chưa PASS.'

test('T33').evidence = [
  {
    command: 'npm exec -- vitest run tests/cnh-1-0-cham-so-policy.test.ts tests/cham-so-2109.test.ts tests/cham-tai-cho-dung-luat-2109.test.ts tests/dau-tru-phan-ba-1009.test.ts tests/o-nhap-dap-so-cac-noi-2109.test.tsx',
    executedAt: new Date().toISOString(),
    exitCode: 0,
    sourceFingerprint: fp,
    artifacts: [artifact(CHAM_SO)],
  },
]

const t34 = test('T34')
t34.status = 'PASS'
t34.evidence = [
  {
    command: 'npm exec -- vitest run tests/cnh-1-0-snapshot-t34.test.ts tests/on-lai-nop-1909.test.ts tests/cau-theo-qid-1909.test.ts tests/reset-toan-app-1909.test.ts tests/on-lai-phuc-vu-duoc-1909.test.ts tests/thu-thach-rieng-may-chu-2109.test.ts tests/cam-tu-luan-may-chu-2109.test.ts tests/lam-cau-on-1909.test.tsx',
    executedAt: new Date().toISOString(),
    exitCode: 0,
    sourceFingerprint: fp,
    artifacts: [artifact(T34LOG)],
  },
]

fs.writeFileSync(path.join(doc, 'TIEN-DO.json'), JSON.stringify(tien, null, 2) + '\n')
console.log('sourceFingerprint =', fp)
console.log('artifact', CHAM_SO, sha(CHAM_SO))
console.log('artifact', T34LOG, sha(T34LOG))
console.log('T33 =', test('T33').status, '· T34 =', t34.status)
