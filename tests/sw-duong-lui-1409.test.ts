// SERVICE WORKER PHẢI CÓ ĐƯỜNG LUI — thầy báo 14/09: "app học sinh không vào
// được", rồi "app phụ huynh cũng không vào được".
//
// Tái hiện được trong Chrome trên chính bản đã phát hành: mở `/hs` xong mở tiếp
// `/ph` ra thẳng trang lỗi `ERR_FAILED`, mở lại lần nữa thì vào bình thường.
// Đúng MỘT lượt — lượt ngay sau khi service worker bản mới chiếm quyền.
//
// Nguyên nhân gốc: `generateSW` sinh ra
//   registerRoute(new NavigationRoute(createHandlerBoundToURL("index.html")))
// và KHÔNG có gì bọc quanh. Handler ấy hỏng ở đúng khoảnh khắc bản mới vừa
// `skipWaiting` + `clientsClaim` thì service worker đã nhận xử lý rồi từ chối —
// trình duyệt không tự đi ra mạng nữa, ra thẳng ERR_FAILED.
//
// Bản tự sinh không cho chèn try/catch, nên chuyển sang service worker viết tay.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const doc = (p: string) => readFileSync(resolve(__dirname, '..', p), 'utf8')
const SW = doc('src/sw.ts')
const VITE = doc('vite.config.ts')

describe('service worker viết tay', () => {
  it('vite dựng từ src/sw.ts, không dùng bản tự sinh nữa', () => {
    expect(VITE).toContain("strategies: 'injectManifest'")
    expect(VITE).toContain("filename: 'sw.ts'")
    // Hai tuỳ chọn này chỉ có ở generateSW — còn sót là cấu hình mâu thuẫn.
    expect(VITE).not.toContain('skipWaiting: true')
    expect(VITE).not.toContain("navigateFallback: 'index.html'")
  })

  it('dựng dạng IIFE — Safari trên iPhone không chạy được service worker ES module', () => {
    expect(VITE).toContain("rollupFormat: 'iife'")
  })

  it('BA TẦNG đường lui, xếp đúng thứ tự: precache → mạng → CacheStorage', () => {
    const iPrecache = SW.indexOf('TU_PRECACHE(tuyChon)')
    const iMang = SW.indexOf('fetch(tuyChon.request)')
    const iCache = SW.indexOf('caches.match(')
    const iLoi = SW.indexOf('Response.error()')
    expect(iPrecache).toBeGreaterThan(-1)
    expect(iMang).toBeGreaterThan(iPrecache)
    expect(iCache).toBeGreaterThan(iMang)
    expect(iLoi).toBeGreaterThan(iCache)
  })

  it('mỗi tầng đều bọc try/catch — hỏng một tầng KHÔNG được làm chết cả lượt', () => {
    expect((SW.match(/try \{/g) || []).length).toBeGreaterThanOrEqual(2)
    // Không nuốt im: hỏng thì vẫn ghi ra console rồi mới đi tiếp.
    expect(SW).toContain('console.warn')
  })

  it('giữ nguyên các chốt cũ: chiếm quyền ngay, dọn kho cũ, trừ đường của Pages', () => {
    expect(SW).toContain('self.skipWaiting()')
    expect(SW).toContain('clientsClaim()')
    expect(SW).toContain('cleanupOutdatedCaches()')
    expect(SW).toContain('/^\\/cdn-cgi\\//')
    expect(SW).toContain('/[?&]_moi=/')
  })

  it('vẫn precache đủ tệp, vẫn bỏ 404.html', () => {
    expect(SW).toContain('precacheAndRoute(self.__WB_MANIFEST)')
    expect(VITE).toMatch(/globIgnores:\s*\[[^\]]*'\*\*\/404\.html'/)
    expect(VITE).toContain("'**/than-thu-v2/**'")
    // SỬA CÓ CHỦ Ý 21/09 (P1 máy kẹt bản cũ — Boss): precache thu nhỏ 245 tệp/5,3 MB → ~123 tệp/2,5 MB, bỏ phông trùng woff/ttf (mọi trình duyệt của em nạp woff2 trước).
    // Khoá chi tiết ở tests/bao-hiem-ban-moi-2109.test.tsx.
    expect(VITE).toContain("globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm,data,woff2}']")
  })
})

describe('chặn bản hỏng ngay lúc phát hành', () => {
  it('có phép kiểm chạy trên chính dist/sw.js đã dựng', () => {
    const k = doc('scripts/kiem-sw.mjs')
    expect(k).toContain('__WB_MANIFEST')
    expect(k).toContain('KẾT LUẬN SERVICE WORKER')
    expect(k).toContain('process.exit(truot === 0 ? 0 : 1)')
  })

  it('lệnh phát hành DỪNG khi phép kiểm trượt, không đẩy bản hỏng', () => {
    const c = doc('DAY-TAT-CA.command')
    expect(c).toContain('node scripts/kiem-sw.mjs')
    expect(c).toContain('SERVICE WORKER HỎNG — KHÔNG ĐẨY')
    // Phải đứng TRƯỚC bước đẩy Pages.
    expect(c.indexOf('kiem-sw.mjs')).toBeLessThan(c.indexOf('pages deploy'))
  })
})
