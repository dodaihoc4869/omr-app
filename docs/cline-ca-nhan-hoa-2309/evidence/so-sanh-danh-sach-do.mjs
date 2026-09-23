// So sánh danh sách test đỏ giữa hai log vitest (log có mã màu ANSI nên phải bóc trước).
// Dùng: node docs/cline-ca-nhan-hoa-2309/evidence/so-sanh-danh-sach-do.mjs p00 p01
import fs from 'node:fs'
import path from 'node:path'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = dirname(fileURLToPath(import.meta.url))
const strip = (s) => s.replace(/\u001b\[[0-9;]*m/g, '')
const doc = (f) => strip(fs.readFileSync(path.join(dir, `${f}-vitest-full.log`), 'utf8'))
const tach = (t) => [...new Set(t.split('\n').filter((l) => /^\s*FAIL\s/.test(l)).map((l) => l.replace(/^\s*FAIL\s+/, '').trim()))]

const [a, b] = [process.argv[2] ?? 'p00', process.argv[3] ?? 'p01']
const A = tach(doc(a))
const B = tach(doc(b))
fs.writeFileSync(path.join(dir, `${a}-vitest-fail-tests.txt`), A.join('\n') + '\n')
fs.writeFileSync(path.join(dir, `${b}-vitest-fail-tests.txt`), B.join('\n') + '\n')
const fileCua = (x) => new Set(x.map((l) => l.split(' > ')[0]))
const fa = fileCua(A)
const fb = fileCua(B)
const moi = [...fb].filter((x) => fa.has(x) === false)
const het = [...fa].filter((x) => fb.has(x) === false)
const testMoi = B.filter((l) => A.includes(l) === false)
console.log(`${a}: ${A.length} test đỏ / ${fa.size} file · ${b}: ${B.length} test đỏ / ${fb.size} file`)
console.log('FILE MỚI ĐỎ (hồi quy):', JSON.stringify(moi))
console.log('FILE HẾT ĐỎ:', JSON.stringify(het))
console.log('TEST MỚI ĐỎ:', JSON.stringify(testMoi, null, 1))
console.log('TEST HẾT ĐỎ:', JSON.stringify(A.filter((l) => B.includes(l) === false), null, 1))
