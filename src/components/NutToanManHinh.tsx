// Nút TOÀN MÀN HÌNH của game (thầy 28/09: "bỏ chế độ tự full màn hình khi vào game, có nút toàn màn hình tinh tế đẹp mắt").
// 28/09 (lần 2, thầy: "nút toàn màn hình hiển thị ở vị trí chưa phù hợp"): KHÔNG còn nút nổi `fixed` đè lên thẻ câu — mỗi màn game tự đặt nút
// biểu tượng nhỏ 40 px này VÀO thanh đầu sẵn có (cạnh nút quay lại / chip Thể lực), truyền `className` để chỉnh chỗ. Kính mảnh theo màu chữ
// của thanh đầu (currentColor) ⇒ tự hợp nền sáng/tối. Máy không có API (iPhone Safari) ⇒ không hiện.
import { useEffect, useState } from 'react'
import { batTatToanManHinh, coTheToanManHinh, dangToanManHinh } from '../lib/toan-man-hinh-game'
import './nut-toan-man-hinh.css'

export default function NutToanManHinh({ className = '' }: { className?: string }) {
  const [dang, setDang] = useState(dangToanManHinh)
  useEffect(() => {
    const doi = () => setDang(dangToanManHinh())
    document.addEventListener('fullscreenchange', doi)
    document.addEventListener('webkitfullscreenchange', doi)
    return () => {
      document.removeEventListener('fullscreenchange', doi)
      document.removeEventListener('webkitfullscreenchange', doi)
    }
  }, [])
  if (!coTheToanManHinh()) return null
  const nhan = dang ? 'Thoát toàn màn hình' : 'Mở toàn màn hình'
  return (
    <button type="button" className={`nut-toan-man${className ? ` ${className}` : ''}`} data-dang={dang ? '' : undefined} aria-label={nhan} title={nhan} onClick={batTatToanManHinh}>
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {dang
          ? <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
          : <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />}
      </svg>
    </button>
  )
}
