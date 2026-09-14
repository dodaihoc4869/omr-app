// PHÉP KIỂM SERVICE WORKER — chạy NGAY SAU `npm run build`, TRƯỚC khi đẩy.
//
// Vì sao có tệp này: 14/09 thầy báo "app học sinh không vào được", rồi "app phụ
// huynh cũng không vào được". Tái hiện được: lượt điều hướng NGAY SAU khi bản
// mới chiếm quyền ra thẳng `ERR_FAILED`. Lỗi nằm trong `dist/sw.js` — thứ mà
// không phép kiểm nào trong kho đụng tới, vì nó chỉ sinh ra lúc dựng.
//
// Bốn điều dưới đây, thiếu một là cả ba app không mở được trên máy đã cài.
// Thoát mã 1 để `DAY-TAT-CA.command` dừng, không đẩy bản hỏng lên.
import { readFileSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const GOC = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SW = resolve(GOC, process.argv[2] || 'dist/sw.js')

if (!existsSync(SW)) {
  console.error(`Chưa có ${SW}. Chạy trước: npm run build`)
  process.exit(2)
}
const s = readFileSync(SW, 'utf8')

const phep = [
  [
    'danh sách tệp đã được chèn',
    !s.includes('__WB_MANIFEST') && (s.match(/revision/g) || []).length > 50,
    'còn nguyên `self.__WB_MANIFEST` hoặc danh sách rỗng — máy mất sạch phần chạy offline',
  ],
  [
    'dạng IIFE, không phải ES module',
    s.trimStart().startsWith('(function') || s.trimStart().startsWith('!function') || s.trimStart().startsWith('(()=>'),
    'service worker dạng ES module thì Safari trên iPhone không đăng ký được',
  ],
  [
    'có đường lui ra mạng cho lượt điều hướng',
    s.includes('đi ra mạng') && /catch\s*\(/.test(s),
    'thiếu try/catch quanh handler điều hướng ⇒ ERR_FAILED khi bản mới vừa chiếm quyền',
  ],
  [
    'có đường lui cuối vào CacheStorage',
    s.includes('caches.match') && s.includes('Response.error'),
    'mất mạng và precache hỏng là không còn gì để trả',
  ],
  [
    'trang app là index.html',
    s.includes('index.html'),
    'không có trang nào để trả cho /hs, /ph, /t/<mã ca>',
  ],
  [
    'chiếm quyền ngay',
    s.includes('skipWaiting'),
    'bản mới nằm chờ vô hạn trên app đã cài vào màn hình chính',
  ],
]

let truot = 0
for (const [ten, dat, viSao] of phep) {
  console.log(`  ${dat ? '✓' : '✗'}  ${ten}${dat ? '' : ` — ${viSao}`}`)
  if (!dat) truot++
}
console.log(`KẾT LUẬN SERVICE WORKER: ${truot === 0 ? 'ĐẠT' : 'TRƯỢT'}  ${phep.length - truot}/${phep.length}`)
process.exit(truot === 0 ? 0 : 1)
