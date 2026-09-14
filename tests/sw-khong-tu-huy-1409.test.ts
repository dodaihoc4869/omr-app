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

describe('index.html — chốt tự sửa khi app trắng màn', () => {
  it('chỉ chạy khi #root RỖNG, không đụng app đã vẽ ra', () => {
    expect(TRANG).toContain('if (goc && goc.childElementCount > 0) return')
  })

  it('CHỈ MỘT LẦN mỗi tab — không có vòng lặp nạp lại', () => {
    expect(TRANG).toContain("var KHOA = 'ddh.daTuSua'")
    expect(TRANG).toContain('if (daThu()) return')
    expect(TRANG).toContain('ghiDaThu()')
    // Ghi cờ TRƯỚC khi làm bất cứ việc gì khác: hỏng giữa chừng cũng không lặp.
    expect(TRANG.indexOf('ghiDaThu()')).toBeLessThan(TRANG.indexOf('unregister()'))
  })

  it('sessionStorage chặn thì coi như ĐÃ THỬ — thà không sửa còn hơn lặp vô hạn', () => {
    expect(TRANG).toMatch(/function daThu\(\)[\s\S]{0,200}catch \(e\) \{\s*return true/)
  })

  it('gỡ service worker, xoá kho, rồi nạp lại thẳng từ mạng', () => {
    expect(TRANG).toContain('navigator.serviceWorker.getRegistrations()')
    expect(TRANG).toContain('caches.delete(k)')
    expect(TRANG).toContain("'_moi=' + Date.now()")
    expect(TRANG).toContain('location.replace(d)')
  })

  it('dọn dẹp treo quá 3 giây thì vẫn nạp lại, không kẹt', () => {
    expect(TRANG).toContain('setTimeout(xong, 3000)')
  })
})

describe('scripts/kiem-sw.mjs — cửa này PHẢI bắt được bản hỏng', () => {
  const chay = (ma: string, trang: string): number => {
    const thu = fs.mkdtempSync(path.join(os.tmpdir(), 'kiem-sw-'))
    fs.writeFileSync(path.join(thu, 'sw.js'), ma)
    fs.writeFileSync(path.join(thu, 'index.html'), trang)
    try {
      execFileSync('node', ['scripts/kiem-sw.mjs', path.join(thu, 'sw.js')], { cwd: GOC, stdio: 'pipe' })
      return 0
    } catch (e) {
      return (e as { status?: number }).status ?? -1
    }
  }

  // Bản LÀNH tối thiểu: đủ mọi thứ cửa đòi, và dọn kho theo kiểu workbox (lọc
  // trước, xoá sau).
  const LANH = `(function(){
    ${'revision'.repeat(60)}
    self.skipWaiting();
    const x = "index.html";
    (async()=>{ (await caches.keys()).filter(n=>n.includes("workbox")).map(n=>caches.delete(n)) })();
    try { await f() } catch (e) { console.warn("[sw] đi ra mạng", e) }
    caches.match(x); Response.error();
  })()`
  const TRANG_LANH = `<script>var KHOA='ddh.daTuSua'; goc.childElementCount; '_moi='; r.unregister()</script>`

  it('bản lành thì ĐẠT — cửa không kêu oan', () => {
    expect(chay(LANH, TRANG_LANH)).toBe(0)
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
