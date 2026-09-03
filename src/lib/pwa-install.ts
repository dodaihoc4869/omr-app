// "THÊM VÀO MÀN HÌNH CHÍNH" — display:standalone trong manifest (ẩn thanh địa
// chỉ, khoá xoay dọc) CHỈ có tác dụng khi app được cài lên màn hình chính.
// Module này: (1) bắt sự kiện beforeinstallprompt của Chrome/Android NGAY từ
// lúc nạp app (sự kiện chỉ bắn 1 lần, trước khi React kịp mount — nên phải
// nghe ở main.tsx), để màn vào thi hiện nút "Cài đặt" 1 chạm; (2) cho biết
// app đang chạy trong trình duyệt thường hay đã ở chế độ standalone.

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let suKienCai: BeforeInstallPromptEvent | null = null
const nguoiNghe = new Set<() => void>()

export function batSuKienCaiApp(): void {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    suKienCai = e as BeforeInstallPromptEvent
    nguoiNghe.forEach((f) => f())
  })
  window.addEventListener('appinstalled', () => {
    suKienCai = null
    nguoiNghe.forEach((f) => f())
  })
}

/** true = đang mở trong TAB TRÌNH DUYỆT THƯỜNG (chưa thêm vào màn hình chính). */
export function dangTrongTrinhDuyet(): boolean {
  if (typeof window === 'undefined') return false
  // iOS Safari: navigator.standalone; còn lại: display-mode
  const nav = navigator as Navigator & { standalone?: boolean }
  if (nav.standalone) return false
  // jsdom (và vài webview cũ) không có matchMedia — coi như không phải tab
  // trình duyệt, để không hiện thẻ cài app sai chỗ.
  if (typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(display-mode: browser)').matches
}

export function coTheCaiMotCham(): boolean {
  return suKienCai !== null
}

/** Gọi hộp thoại cài của Chrome; trả về true nếu em bấm Cài. */
export async function caiMotCham(): Promise<boolean> {
  if (!suKienCai) return false
  const ev = suKienCai
  suKienCai = null
  await ev.prompt()
  const r = await ev.userChoice
  return r.outcome === 'accepted'
}

export function theoDoiSuKienCai(f: () => void): () => void {
  nguoiNghe.add(f)
  return () => nguoiNghe.delete(f)
}

const KHOA_BO_QUA = 'ddh.boQuaCaiApp'
/** "Để sau" chỉ im 7 ngày rồi hỏi lại — chứ không im vĩnh viễn: em/phụ huynh
 * bấm để sau lúc đang vội thì tuần sau vẫn cần lời nhắc. */
export const NGAY_IM_LANG = 7

export function daBoQuaNhacCai(now = Date.now()): boolean {
  try {
    const v = localStorage.getItem(KHOA_BO_QUA)
    if (!v) return false
    if (v === '1') return true // bản cũ: đã bỏ qua vĩnh viễn
    const moc = Number(v)
    if (!Number.isFinite(moc)) return false
    return now - moc < NGAY_IM_LANG * 86400000
  } catch {
    return false
  }
}

export function ghiNhoBoQuaNhacCai(now = Date.now()): void {
  try {
    localStorage.setItem(KHOA_BO_QUA, String(now))
  } catch {
    // trình duyệt chặn storage — lần sau hỏi lại, không sao
  }
}

/** iPhone/iPad: Safari KHÔNG có beforeinstallprompt, chỉ cài được bằng tay. */
export function laIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  // iPadOS 13+ báo là Macintosh nhưng có cảm ứng.
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && typeof document !== 'undefined' && 'ontouchend' in document)
}

/** Đổi thẻ <link rel="manifest"> theo VAI để hai bên cài ra hai app khác nhau
 * (khác tên, khác biểu tượng) — Chrome đọc manifest tại thời điểm bấm cài. */
export function datManifestTheoVai(vai: 'gv' | 'hs' | 'ph' | null): void {
  if (typeof document === 'undefined') return
  const ten = vai === 'hs' ? 'manifest-hs.json' : vai === 'ph' ? 'manifest-ph.json' : 'manifest.json'
  const href = `${import.meta.env.BASE_URL}${ten}`
  let link = document.querySelector('link[rel="manifest"]') as HTMLLinkElement | null
  if (!link) {
    link = document.createElement('link')
    link.rel = 'manifest'
    document.head.appendChild(link)
  }
  if (link.getAttribute('href') !== href) link.setAttribute('href', href)
}

/** Tên app sẽ hiện trên màn hình chính của từng vai — phải khớp `short_name`
 * trong public/manifest-hs.json và public/manifest-ph.json. */
export function tenAppCuaVai(vai: 'hs' | 'ph'): string {
  return vai === 'ph' ? 'ĐĐH Phụ huynh' : 'ĐĐH Học sinh'
}

/**
 * ĐỌC TÊN APP MÀ TRÌNH DUYỆT THẬT SỰ SẼ CÀI.
 *
 * Trình duyệt cài theo file manifest mà thẻ `<link rel="manifest">` trỏ tới,
 * đọc từ lúc phân tích HTML. Nếu máy còn giữ bản HTML cũ trong bộ nhớ (service
 * worker), thẻ đó vẫn trỏ manifest chung, và bấm Cài đặt sẽ ra app "ĐỖ ĐẠI HỌC"
 * chung dù dải cài ghi "Cài ĐĐH Học sinh" — đúng lỗi thầy quay video.
 *
 * Nên dải cài KHÔNG tự ghi tên nữa mà đọc thẳng từ manifest: nói đúng cái sắp
 * cài, và lệch thì biết ngay là máy còn bản cũ.
 */
export async function tenAppSeCai(): Promise<string> {
  if (typeof document === 'undefined') return ''
  const the = document.querySelector('link[rel="manifest"]') as HTMLLinkElement | null
  if (!the) return ''
  try {
    const res = await fetch(the.href, { cache: 'no-cache' })
    if (!res.ok) return ''
    const m = (await res.json()) as { short_name?: string; name?: string }
    return String(m.short_name || m.name || '')
  } catch {
    return ''
  }
}

/**
 * TRÌNH DUYỆT TRONG ỨNG DỤNG (Zalo, Facebook, Messenger, Instagram, Line).
 *
 * Link thầy gửi qua Zalo mở bằng trình duyệt nội bộ của Zalo, không phải
 * Chrome/Safari. Các trình duyệt này KHÔNG bắn `beforeinstallprompt`, và lệnh
 * "Thêm vào màn hình chính" của chúng thường bỏ qua hẳn file manifest — nó lấy
 * tiêu đề trang và favicon, nên ra biểu tượng chữ "A" với tên "ĐỖ ĐẠI HỌC"
 * chung thay vì "ĐĐH Học sinh". Đây là nguyên nhân thật của việc cài mãi không
 * ra đúng app.
 *
 * Không lách được: phải mở link bằng Chrome hoặc Safari rồi mới cài.
 */
export function trongTrinhDuyetTrongApp(ua = typeof navigator === 'undefined' ? '' : navigator.userAgent || ''): boolean {
  if (/Zalo/i.test(ua)) return true
  if (/FBAN|FBAV|FB_IAB|FBIOS|Instagram/i.test(ua)) return true
  if (/Line\//i.test(ua)) return true
  // iOS: mọi trình duyệt thật (Safari, Chrome iOS, Edge iOS) đều có "Safari"
  // trong chuỗi nhận dạng; thiếu nó là đang ở webview trong một app khác.
  if (/(iPhone|iPod|iPad)/.test(ua) && !/Safari/.test(ua)) return true
  return false
}

/** Cốc Cốc — trình duyệt Chromium phổ biến ở Việt Nam nhưng KHÔNG có luồng cài
 * PWA: menu không có "Thêm vào Màn hình chính" và không bắn beforeinstallprompt.
 * Thầy quay video đúng cảnh này. Nhận riêng để nói đúng tên trình duyệt. */
export function laCocCoc(ua = typeof navigator === 'undefined' ? '' : navigator.userAgent || ''): boolean {
  return /coc_coc_browser|CocCoc/i.test(ua)
}

/** Thời gian chờ beforeinstallprompt trước khi kết luận trình duyệt không cài
 * được. Chrome bắn sự kiện này ngay sau khi tải xong; quá mốc này mà im thì
 * gần như chắc chắn là trình duyệt không hỗ trợ. */
export const CHO_SU_KIEN_CAI_MS = 2500

/** Android: thử nhảy sang Chrome bằng intent. iOS không có cách tương đương. */
export function moBangChrome(ua = typeof navigator === 'undefined' ? '' : navigator.userAgent || ''): string | null {
  if (!/Android/i.test(ua)) return null
  const u = location.href.replace(/^https?:\/\//, '')
  return `intent://${u}#Intent;scheme=https;package=com.android.chrome;end`
}
