// "THÊM VÀO MÀN HÌNH CHÍNH" — display:standalone trong manifest (ẩn thanh địa
// chỉ, khoá xoay dọc) CHỈ có tác dụng khi app được cài lên màn hình chính.
// Module này: (1) bắt sự kiện beforeinstallprompt của Chrome/Android NGAY từ
// lúc nạp app (sự kiện chỉ bắn 1 lần, trước khi React kịp mount — nên phải
// nghe ở main.tsx), để màn vào thi hiện nút "Cài đặt" 1 chạm; (2) cho biết
// app đang chạy trong trình duyệt thường hay đã ở chế độ standalone.

import { nhoVaiDaDung } from './vai-tro'

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

/** Đánh dấu máy đang mở APP HỌC SINH: nhớ vai, manifest + tên app khi cài (iOS đọc thẻ meta) — đúng việc StudentPortalScreen làm lúc dựng.
 *  Gọi ở màn đầu của cổng (vỏ AppHocSinh — màn đăng nhập nay đứng trước cổng, 05/10); gọi lại vô hại. */
export function danhDauAppHocSinh(): void {
  nhoVaiDaDung('hs')
  try {
    datManifestTheoVai('hs')
    document.title = 'ĐĐH Học Sinh'
    const meta = document.querySelector('meta[name="apple-mobile-web-app-title"]')
    if (meta) meta.setAttribute('content', 'ĐĐH Học Sinh')
  } catch {
    // ignore
  }
}
