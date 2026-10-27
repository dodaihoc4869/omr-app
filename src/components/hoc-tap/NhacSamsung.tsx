// THẺ NHẮC SAMSUNG INTERNET (27/10) — mảnh NẠP LƯỜI riêng (chỉ máy Samsung Internet mới tải), ngoài precache (vite.config.ts `globIgnores`); tải hỏng ⇒
// TrongHs vẽ null, không vỡ Lộ trình. Hiện MỘT lần (src/lib/nhac-samsung.ts): chốt lúc gắn; ghi «đã nhắc» khi thẻ THẬT SỰ vào khung nhìn (Lộ trình tự cuộn tới
// chặng đang học ⇒ thẻ đầu trang có thể nằm khuất phía trên; chưa thấy thì lần mở sau vẫn hiện) ⇒ đã thấy rồi rời Lộ trình là hết; «Đã hiểu» ẩn ngay. Không biểu tượng lucide: mọi biểu tượng mới rơi vào mảnh dùng chung `bieu-tuong-them` (app thầy / màn thi tải) ⇒ nặng đường khác. Nằm trong luồng trang (không phủ, không dính) ⇒ không che nút chặng.
import { useEffect, useRef, useState } from 'react'
import { canNhacSamsung, ghiDaNhacSamsung } from '../../lib/nhac-samsung'
import '../../styles/nhac-samsung.css'

export default function NhacSamsung() {
  const [hien, setHien] = useState(canNhacSamsung)
  const the = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = the.current
    if (!hien || !el) return
    if (typeof IntersectionObserver !== 'function') { ghiDaNhacSamsung(); return }
    const io = new IntersectionObserver(([e]) => { if (e?.isIntersecting) { ghiDaNhacSamsung(); io.disconnect() } }, { threshold: 0.6 })
    io.observe(el)
    return () => io.disconnect()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  if (!hien) return null
  return <section ref={the} className="da-nhac-ss" aria-label="Màu app trên Samsung Internet">
    <div className="giua">
      <b>Màu app trên Samsung Internet</b>
      <span>Khi bật chế độ tối, trình duyệt Samsung Internet tự đổi màu app. Để hiện đúng: Cài đặt › Labs › bật «Sử dụng chủ đề tối của trang web» (Use website dark theme), hoặc mở app bằng Chrome.</span>
    </div>
    <button type="button" className="da-nhac-ss-nut" onClick={() => setHien(false)}>Đã hiểu</button>
  </section>
}
