// SERVICE WORKER KHÔNG ĐƯỢC TỰ HUỶ — 14/09 lượt 11.
//
// Thầy báo: "app học sinh và phụ huynh lại không truy cập được. Bạn phải tìm
// cách để hiện tượng này không lặp lại nữa."
//
// ĐO ĐƯỢC TRÊN BẢN ĐANG CHẠY THẬT (`https://omr-app-b3u.pages.dev/sw.js`,
// 14/09): tệp ấy chứa `registration.unregister()`, xoá toàn bộ CacheStorage,
// rồi gọi `client.navigate(...)` cho mọi tab đang mở.
//
// NGUYÊN NHÂN GỐC: nhánh ấy chạy khi `serverTs > SW_BUILT_AT` — tức là MỌI em
// quay lại sau MỖI lần thầy phát hành, chứ không phải ca hiếm. Nó xoá kho
// precache mà workbox vừa nạp trong chính lượt activate ấy, tự gỡ đăng ký
// nhưng VẪN đang điều khiển tab, rồi ép tab điều hướng lại QUA CHÍNH NÓ. Lượt
// điều hướng ấy rơi vào kho rỗng ⇒ ERR_FAILED. Đó là lý do lỗi LẶP LẠI.
//
// Tệp này chốt ba việc không được quay lại, và chốt luôn đường lui cuối.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const GOC = process.cwd()
const doc = (p: string) => fs.readFileSync(path.join(GOC, p), 'utf8')
/** Bỏ dòng chú thích trước khi soi.
 *
 * Chính tệp `src/sw.ts` GIẢI THÍCH đoạn tự huỷ đã bị gỡ, nên chữ
 * `registration.unregister()` còn nằm trong chú thích — và phải còn, để lần
 * sau ai đọc còn biết vì sao không được viết lại. Phép kiểm đo MÃ CHẠY, nên
 * cắt chú thích đi rồi mới soi. (`scripts/kiem-sw.mjs` đọc bản đã dựng, vốn
 * không còn chú thích, nên cửa thật không vướng chuyện này.) */
const boChuThich = (ma: string) => ma.replace(/^\s*\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')

const SW = boChuThich(doc('src/sw.ts'))
const TRANG = doc('index.html')

describe('src/sw.ts — ba việc tự huỷ không được quay lại', () => {
  it('KHÔNG tự gỡ đăng ký', () => {
    expect(SW).not.toMatch(/registration\s*\.\s*unregister\s*\(/)
  })

  it('KHÔNG xoá sạch CacheStorage', () => {
    // `cleanupOutdatedCaches()` của workbox lọc theo tiền tố kho của chính nó
    // rồi mới xoá — đó là việc đúng. Thứ bị cấm là tự tay gom hết khoá.
    expect(SW).not.toMatch(/caches\s*\.\s*keys\s*\(/)
    expect(SW).toContain('cleanupOutdatedCaches()')
  })

  it('KHÔNG ép tab đang mở điều hướng lại', () => {
    expect(SW).not.toMatch(/\.\s*navigate\s*\(/)
  })

  it('thấy bản mới thì GỌI VỀ, không tự huỷ', () => {
    expect(SW).toContain('self.registration.update()')
    expect(SW).toContain("postMessage({ kieu: 'ddh:co-ban-moi'")
  })

  it('precache trượt thì gọi bản mới về ngay, nhưng vẫn trả trang cho em', () => {
    expect(SW).toContain('void self.registration.update().catch(() => undefined)')
    // Ba tầng đường lui phải còn nguyên.
    expect(SW).toContain('const r = await fetch(tuyChon.request)')
    expect(SW).toContain('caches.match(khoa, { ignoreSearch: true })')
  })

  it('đường `_moi=` vẫn nằm ngoài tầm service worker', () => {
    // Chốt tự sửa nạp lại kèm `_moi=`. Nếu service worker đụng vào đường ấy
    // thì lượt nạp cứu hộ lại đi qua đúng thứ đang hỏng.
    expect(SW).toContain('/[?&]_moi=/')
  })
})

describe('index.html — phục hồi không hủy dữ liệu trên máy yếu', () => {
  it('không thay màn đã mở thành công', () => {
    expect(TRANG).toContain("root.childElementCount && !root.querySelector('[data-startup-status]')")
  })
  it('không xóa cache hay gỡ service worker vì tải chậm', () => {
    expect(TRANG).not.toContain('caches.delete(')
    expect(TRANG).not.toContain('.unregister(')
  })
  it('nạp lại do người dùng bấm, giữ vai và dữ liệu trong hash', () => {
    expect(TRANG).toContain("document.getElementById('startup-retry').onclick")
    expect(TRANG).toContain('u.pathname + u.search + u.hash')
  })
  it('có chẩn đoán lỗi đồng bộ và bất đồng bộ', () => {
    expect(TRANG).toContain("window.addEventListener('error'")
    expect(TRANG).toContain("window.addEventListener('unhandledrejection'")
  })
})

describe('scripts/kiem-sw.mjs — cửa này PHẢI bắt được bản hỏng', () => {
  // Ba cổng có đủ entry đã dựng và helper nhập tĩnh; AppHocSinh còn nhập
  // StudentPortalScreen nên fixture giữ cả lớp vỏ học sinh và màn bên trong.
  const TEP_KHOI_DONG = {
    'App-aaaaaaaa.js': 'import "./gv-helper-11111111.js";',
    'AppHocSinh-bbbbbbbb.js': 'import { StudentPortalScreen } from "./StudentPortalScreen-cccccccc.js";',
    'StudentPortalScreen-cccccccc.js': 'import "./hs-helper-22222222.js"; export const StudentPortalScreen = {};',
    'ParentPortalScreen-dddddddd.js': 'import "./ph-helper-33333333.js";',
    'gv-helper-11111111.js': 'export { chung } from "./chung-helper-44444444.js";',
    'hs-helper-22222222.js': 'import "./chung-helper-44444444.js";',
    'ph-helper-33333333.js': 'import "./chung-helper-44444444.js";',
    'chung-helper-44444444.js': 'export const chung = 1;',
  }
  const MANIFEST_LANH = JSON.stringify(['index.html', ...Object.keys(TEP_KHOI_DONG).map(ten => 'assets/' + ten)].map(url => ({ revision: null, url })))
  const chay = (ma: string, trang: string, boTep = ''): number => {
    const thu = fs.mkdtempSync(path.join(os.tmpdir(), 'kiem-sw-'))
    fs.writeFileSync(path.join(thu, 'sw.js'), ma)
    fs.writeFileSync(path.join(thu, 'index.html'), trang)
    fs.mkdirSync(path.join(thu, 'assets'))
    for (const [ten, noiDung] of Object.entries(TEP_KHOI_DONG)) if (ten !== boTep) fs.writeFileSync(path.join(thu, 'assets', ten), noiDung)
    try {
      execFileSync('node', ['scripts/kiem-sw.mjs', path.join(thu, 'sw.js')], { cwd: GOC, stdio: 'pipe' })
      return 0
    } catch (e) {
      return (e as { status?: number }).status ?? -1
    } finally {
      fs.rmSync(thu, { recursive: true, force: true })
    }
  }

  // Bản LÀNH tối thiểu: đủ mọi thứ cửa đòi, và dọn kho theo kiểu workbox (lọc
  // trước, xoá sau).
  const LANH = `(function(){
    ${'revision'.repeat(60)}
    // Thêm 21/09 (P1 máy kẹt bản cũ): cửa nay còn đòi precache NHỎ (đếm theo "url") + kho chạy-lúc + chốt không cất HTML.
    const manifest = ${MANIFEST_LANH};
    const kho = ["omr-manh-chay-lan", "omr-anh-chay-lan"]; const chot = /text\\/html/i;
    self.skipWaiting();
    const x = "index.html";
    (async()=>{ (await caches.keys()).filter(n=>n.includes("workbox")).map(n=>caches.delete(n)) })();
    try { await f() } catch (e) { console.warn("[sw] đi ra mạng", e) }
    caches.match(x); Response.error();
  })()`
  const TRANG_LANH = `<script>'startup-retry'; root.childElementCount; '_moi'; u.hash</script>`

  it('bản lành thì ĐẠT — cửa không kêu oan', () => {
    expect(chay(LANH, TRANG_LANH)).toBe(0)
  })

  it('bắt được: helper tĩnh của mỗi cổng thiếu khỏi precache, kể cả helper bắc cầu', () => {
    for (const ten of ['gv-helper-11111111.js', 'hs-helper-22222222.js', 'ph-helper-33333333.js', 'chung-helper-44444444.js']) {
      const thieu = LANH.replace(`"url":"assets/${ten}"`, '"url":"assets/khac-55555555.js"')
      expect(chay(thieu, TRANG_LANH), ten).toBe(1)
    }
  })

  it('bắt được: helper có trong manifest nhưng tệp đã dựng không tồn tại', () => {
    expect(chay(LANH, TRANG_LANH, 'chung-helper-44444444.js')).toBe(1)
  })

  // P1 21/09 (máy học sinh kẹt bản cũ): ba điều mới cửa phải bắt.
  it('bắt được: precache phình to lại (200 tệp > trần 170) — tất-cả-hoặc-không nên mạng yếu rớt một tệp là cả lượt cài hỏng', () => {
    const nhieu = Array.from({ length: 200 }, (_, i) => `{"revision":null,"url":"assets/x${i}.js"}`).join(',')
    expect(chay(LANH.replace(MANIFEST_LANH, `[${nhieu}]`), TRANG_LANH)).toBe(1)
  })

  it('bắt được: bỏ mảnh khỏi precache mà không có kho chạy-lúc', () => {
    expect(chay(LANH.replace('omr-manh-chay-lan', 'x'), TRANG_LANH)).toBe(1)
    expect(chay(LANH.replace('omr-anh-chay-lan', 'x'), TRANG_LANH)).toBe(1)
  })

  it('bắt được: kho chạy-lúc cất cả trang HTML dưới tên mảnh (đầu độc kho)', () => {
    expect(chay(LANH.replace('const chot = /text\\/html/i;', 'const chot = 1;'), TRANG_LANH)).toBe(1)
  })

  it('bắt được BẢN THẬT đang chạy 14/09: tự gỡ đăng ký', () => {
    expect(chay(LANH.replace('self.skipWaiting();', 'self.skipWaiting(); await self.registration.unregister();'), TRANG_LANH)).toBe(1)
  })

  it('bắt được: gom hết khoá rồi xoá sạch kho', () => {
    expect(
      chay(LANH.replace('self.skipWaiting();', 'self.skipWaiting(); const k=await caches.keys(); await Promise.all(k.map(n=>caches.delete(n)));'), TRANG_LANH),
    ).toBe(1)
  })

  it('bắt được: ép tab đang mở điều hướng lại', () => {
    expect(chay(LANH.replace('self.skipWaiting();', 'self.skipWaiting(); for (const c of cs) c.navigate(c.url);'), TRANG_LANH)).toBe(1)
  })

  it('bắt được: thiếu chốt tự sửa trong index.html', () => {
    expect(chay(LANH, '<script>không có gì</script>')).toBe(1)
  })
})
