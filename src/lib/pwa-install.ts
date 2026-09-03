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
