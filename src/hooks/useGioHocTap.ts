import { useEffect, useState } from 'react'
import { gioMayChu } from '../lib/gio-may-chu'

// Cập nhật hạn khi màn đang mở và khi quay lại app sau lúc khóa điện thoại.
export function useGioHocTap() {
  const [now, setNow] = useState(gioMayChu)
  useEffect(() => {
    const update = () => setNow(gioMayChu())
    const timer = setInterval(update, 15_000)
    window.addEventListener('focus', update)
    document.addEventListener('visibilitychange', update)
    return () => {
      clearInterval(timer)
      window.removeEventListener('focus', update)
      document.removeEventListener('visibilitychange', update)
    }
  }, [])
  return now
}
