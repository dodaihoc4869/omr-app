// TẢI NGẦM KHO MẢNH APP HỌC SINH (02/11, thầy: «Hiệu ứng ko tải sẵn xuống máy hs à mà chậm»). Mảnh nạp lười của app học sinh (hiệu ứng ăn mừng, Mol, giám thị,
// «Trong», thưởng phạt, làm câu / sửa câu / kiểm tra…) không nằm trong gói cài sẵn (precache giữ 170) ⇒ sau mỗi lần phát hành máy em tải từng mảnh đúng lúc mở màn.
// Ở đây: lúc máy RẢNH (≥ 5 s sau khi cổng học sinh hiện), đọc danh sách `kho-hs.json` (plugin khoNapTruocHs trong vite.config.ts) và tải TỪNG mảnh máy chưa có
// (đi qua service worker ⇒ cất ở kho chạy-lúc `omr-manh-chay-lan`, CacheFirst) — lần sau cần là có ngay, kể cả mất mạng. Không chạy: không có service worker,
// em bật tiết kiệm dữ liệu, mạng 2G. Mỗi mảnh một lượt (ưu tiên thấp), tab ẩn thì chờ, lỗi thì bỏ qua — không ảnh hưởng thao tác của em.
let daChay = false

type MayRanh = Window & { requestIdleCallback?: (f: () => void, o?: { timeout: number }) => number }
const ranh = (ms: number) => new Promise<void>((ok) => {
  const w = window as MayRanh
  if (typeof w.requestIdleCallback === 'function') w.requestIdleCallback(() => ok(), { timeout: ms })
  else window.setTimeout(ok, Math.min(ms, 300))
})
const hien = () => new Promise<void>((ok) => {
  if (!document.hidden) { ok(); return }
  const f = () => { if (!document.hidden) { document.removeEventListener('visibilitychange', f); ok() } }
  document.addEventListener('visibilitychange', f)
})

/** Có nên tải ngầm không (có service worker điều khiển trang, có Cache API, không tiết kiệm dữ liệu / 2G). */
export function nenTaiNgam(nav: Navigator = navigator): boolean {
  if (typeof window === 'undefined' || !('caches' in window) || !nav.serviceWorker?.controller) return false
  const c = (nav as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection
  return !(c?.saveData || /(^|-)2g$/.test(c?.effectiveType ?? ''))
}

export function napTruocKhoHs(): void {
  if (daChay || !nenTaiNgam()) return
  daChay = true
  void (async () => {
    await new Promise((ok) => window.setTimeout(ok, 5000))
    await ranh(8000)
    const goc = import.meta.env.BASE_URL || '/'
    let ds: string[] = []
    try {
      const r = await fetch(goc + 'kho-hs.json', { cache: 'no-store' })
      if (!r.ok) return
      const j = (await r.json()) as { ds?: unknown }
      ds = Array.isArray(j.ds) ? j.ds.filter((x): x is string => typeof x === 'string' && /^assets\/[\w.-]+\.(?:js|css)$/.test(x)) : []
    } catch { return }
    for (const t of ds) {
      const url = goc + t
      try {
        if (await caches.match(url)) continue
        await hien(); await ranh(2000)
        await fetch(url, { priority: 'low' } as RequestInit)
      } catch { /* mất mạng / lỗi: bỏ qua, lần sau thử lại */ }
    }
  })()
}
