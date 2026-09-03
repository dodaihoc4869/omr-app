import { useEffect } from 'react'
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'
import { useAppStore } from '../store/appStore'

// THÔNG BÁO PHẢI TRÔNG NHƯ THÔNG BÁO, KHÔNG NHƯ NÚT BẤM.
// Bản cũ là một khối bo tròn, nền màu đặc, chữ đậm — nằm ngay dưới nút "Đăng ký"
// thì nhìn hệt nút thứ hai, phụ huynh dễ bấm vào. Nay dùng nền mực đậm + biểu
// tượng màu bên trái: khác hẳn nút chính (nền tím) nên không lẫn được.
const BIEU_TUONG = {
  success: { Icon: CheckCircle2, mau: 'var(--xanh)' },
  warn: { Icon: AlertTriangle, mau: 'var(--cam)' },
  error: { Icon: XCircle, mau: 'var(--do)' },
} as const

export default function Toast() {
  const toast = useAppStore((s) => s.toast)
  const clearToast = useAppStore((s) => s.clearToast)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(clearToast, 2600)
    return () => clearTimeout(t)
  }, [toast, clearToast])

  if (!toast) return null

  const { Icon, mau } = BIEU_TUONG[toast.kind] ?? BIEU_TUONG.success

  return (
    // Đặt Ở ĐÁY màn, trên thanh menu: hiện ở đầu trang thì đè mất tiêu đề và
    // dòng hướng dẫn ngay dưới nó (thầy đã gặp: dải vàng che mất chữ).
    <div
      className="fixed inset-x-0 z-50 flex justify-center px-4 pointer-events-none"
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 88px)' }}
      role="status"
      aria-live="polite"
    >
      <div
        className="pointer-events-auto flex items-center shadow-lg"
        style={{
          gap: 'var(--k3)',
          maxWidth: 460,
          background: 'var(--muc)',
          color: 'var(--muc-nguoc)',
          borderRadius: 'var(--bo-2)',
          padding: 'var(--k3) var(--k4)',
          fontFamily: 'var(--sans)',
          fontSize: 'var(--cx-1)',
          lineHeight: 1.5,
        }}
      >
        <Icon size={18} style={{ color: mau, flex: 'none' }} aria-hidden="true" />
        <span>{toast.text}</span>
      </div>
    </div>
  )
}
