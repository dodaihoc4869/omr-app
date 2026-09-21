// PHÉP KIỂM SERVICE WORKER — chạy NGAY SAU `npm run build`, TRƯỚC khi đẩy.
//
// Vì sao có tệp này: 14/09 thầy báo "app học sinh không vào được", rồi "app phụ
// huynh cũng không vào được". Tái hiện được: lượt điều hướng NGAY SAU khi bản
// mới chiếm quyền ra thẳng `ERR_FAILED`. Lỗi nằm trong `dist/sw.js` — thứ mà
// không phép kiểm nào trong kho đụng tới, vì nó chỉ sinh ra lúc dựng.
//
// Bốn điều dưới đây, thiếu một là cả ba app không mở được trên máy đã cài.
// Thoát mã 1 để `DAY-TAT-CA.command` dừng, không đẩy bản hỏng lên.
import { readFileSync, existsSync, statSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const GOC = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SW = resolve(GOC, process.argv[2] || 'dist/sw.js')

if (!existsSync(SW)) {
  console.error(`Chưa có ${SW}. Chạy trước: npm run build`)
  process.exit(2)
}
const s = readFileSync(SW, 'utf8')

// CHỐT TỰ SỬA nằm trong `index.html`, không nằm trong `sw.js` — phải đọc riêng.
// Đây là đường lui CUỐI: sửa đúng nguyên nhân hôm nay không bảo đảm được
// "không lặp lại nữa", vì lần sau sẽ là nguyên nhân khác. Chốt ấy không cần
// biết nguyên nhân — nó giữ dữ liệu và cho nạp bản mới khi #root chưa dựng được.
const TRANG = resolve(dirname(SW), 'index.html')
const t = existsSync(TRANG) ? readFileSync(TRANG, 'utf8') : ''
const coChotTuSua =
  t.includes('startup-retry') && t.includes('childElementCount') && t.includes('_moi') && t.includes('u.hash') && !t.includes('caches.delete(') && !t.includes('.unregister(')

/** CÓ CHỖ NÀO XOÁ SẠCH CACHESTORAGE KHÔNG.
 *
 * Không cấm được `caches.keys()` — `cleanupOutdatedCaches()` của workbox dùng
 * nó, và đó là việc ĐÚNG: nó `.filter(...)` theo tiền tố kho của chính mình
 * rồi mới xoá. Thứ phải cấm là lấy HẾT khoá rồi xoá thẳng, không lọc — đó là
 * đoạn 14/09 đã làm app trắng màn.
 *
 * Phép đo: sau mỗi `caches.keys()`, trong 200 ký tự kế tiếp phải gặp `.filter(`
 * TRƯỚC khi gặp `.map(` hay `.delete(`. */
function xoaSachKho(ma) {
  const re = /caches\s*\.\s*keys\s*\(\s*\)/g
  let m
  while ((m = re.exec(ma)) !== null) {
    const sau = ma.slice(m.index + m[0].length, m.index + m[0].length + 200)
    const viLoc = sau.indexOf('.filter(')
    const viXoa = Math.min(
      ...['.map(', '.delete(', 'caches.delete'].map((k) => {
        const i = sau.indexOf(k)
        return i === -1 ? Number.POSITIVE_INFINITY : i
      }),
    )
    if (viLoc === -1 || viLoc > viXoa) return true
  }
  return false
}

/** PRECACHE PHẢI NHỎ (P1 21/09). Precache là TẤT-CẢ-HOẶC-KHÔNG: 245 tệp / 5,4 MB thì mạng di động yếu rớt một tệp là cả lượt cài hỏng, máy em ở lại bản cũ mãi
 * (thầy chụp iPhone vẫn chữ cũ sau 3 giờ). Đo từ chính `dist/sw.js` + kích thước tệp thật cạnh nó. */
const TOI_DA_TEP_PRECACHE = 170
const TOI_DA_KB_PRECACHE = 3000
function doPrecache(ma, thuMuc) {
  const url = [...new Set([...ma.matchAll(/"url"\s*:\s*"([^"]+)"/g)].map((m) => m[1]))]
  let byte = 0
  for (const u of url) {
    const p = resolve(thuMuc, u)
    if (existsSync(p)) byte += statSync(p).size
  }
  return { tep: url.length, kb: Math.round(byte / 1024) }
}
const pc = doPrecache(s, dirname(SW))

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
  // ── BA PHÉP DƯỚI ĐÂY THÊM 14/09 LƯỢT 11 ─────────────────────────────────
  //
  // Thầy báo "app học sinh và phụ huynh LẠI không truy cập được". Truy ra:
  // trong `dist/sw.js` đang chạy thật có một đoạn tự huỷ — thấy máy chủ có
  // bản mới thì xoá sạch cache, tự gỡ đăng ký, rồi ép mọi tab điều hướng lại
  // QUA CHÍNH NÓ khi kho precache vừa bị xoá rỗng. Điều kiện kích hoạt là
  // "máy chủ mới hơn máy em" — tức MỌI em, MỖI lần thầy phát hành.
  //
  // Ba phép này chặn đúng ba việc ấy quay lại. Chúng đọc `dist/sw.js` — bản
  // THẬT sẽ chạy trên máy em — nên không lách được bằng cách đổi cách viết
  // trong `src/sw.ts`.
  [
    'KHÔNG tự gỡ đăng ký service worker',
    !/registration\s*\.\s*unregister\s*\(/.test(s),
    'SW tự gỡ nhưng vẫn đang điều khiển tab đang mở ⇒ lượt điều hướng kế tiếp rơi vào kho rỗng ⇒ ERR_FAILED',
  ],
  [
    'KHÔNG xoá sạch CacheStorage',
    !xoaSachKho(s),
    'xoá toàn bộ kho là xoá luôn precache vừa nạp và mất sạch phần chạy offline — dọn kho cũ đã có cleanupOutdatedCaches lo',
  ],
  [
    'KHÔNG ép tab đang mở điều hướng lại',
    !/\.\s*navigate\s*\(/.test(s),
    'ép điều hướng từ trong SW thì lượt ấy đi qua chính SW đó, gặp kho chưa sẵn sàng là ra trang lỗi',
  ],
  [
    `precache nhỏ (${pc.tep} tệp / ${pc.kb} KB; trần ${TOI_DA_TEP_PRECACHE} tệp / ${TOI_DA_KB_PRECACHE} KB)`,
    pc.tep > 0 && pc.tep <= TOI_DA_TEP_PRECACHE && pc.kb <= TOI_DA_KB_PRECACHE,
    'precache phình to lại: lượt cài càng nặng càng dễ rớt một tệp trên mạng yếu ⇒ cả lượt cài hỏng ⇒ máy kẹt bản cũ. Màn thầy/game/ảnh lớn phải đi kho chạy-lúc (vite.config.ts globIgnores)',
  ],
  [
    'có kho chạy-lúc cho mảnh ngoài precache',
    s.includes('omr-manh-chay-lan') && s.includes('omr-anh-chay-lan'),
    'bỏ mảnh khỏi precache mà không có kho chạy-lúc thì màn thầy/game tải lại từ mạng mỗi lần (và không chạy được offline)',
  ],
  [
    'kho chạy-lúc KHÔNG cất trang HTML dưới tên mảnh',
    /text\\\/html/.test(s),
    'máy chủ trả index.html (200) cho mảnh đã bị xoá khi phát hành; cất nó dưới tên .js là đầu độc kho (lỗi MIME mãi tới khi xoá dữ liệu trang)',
  ],
  [
    'có chốt tự sửa khi app trắng màn',
    coChotTuSua,
    'thiếu chốt trong index.html: app trắng màn là kẹt vĩnh viễn, phải chờ thầy bảo em xoá dữ liệu trang',
  ],
]

let truot = 0
for (const [ten, dat, viSao] of phep) {
  console.log(`  ${dat ? '✓' : '✗'}  ${ten}${dat ? '' : ` — ${viSao}`}`)
  if (!dat) truot++
}
console.log(`KẾT LUẬN SERVICE WORKER: ${truot === 0 ? 'ĐẠT' : 'TRƯỢT'}  ${phep.length - truot}/${phep.length}`)
process.exit(truot === 0 ? 0 : 1)
