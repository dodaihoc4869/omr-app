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
export function daBoQuaNhacCai(): boolean {
  try {
    return localStorage.getItem(KHOA_BO_QUA) === '1'
  } catch {
    return false
  }
}
export function ghiNhoBoQuaNhacCai(): void {
  try {
    localStorage.setItem(KHOA_BO_QUA, '1')
  } catch {
    // trình duyệt chặn storage — lần sau hỏi lại, không sao
  }
}
