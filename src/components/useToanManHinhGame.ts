// Cổng học sinh: tab GAME mở ⇒ (1) theo dõi toàn màn hình, (2) lần chạm ĐẦU TIÊN trong game xin toàn màn hình nếu cú chạm mở game chưa xin được
// (link/tải lại/lazy-load), đúng một lần; (3) rời game ⇒ thoát toàn màn hình. Xem src/lib/toan-man-hinh-game.ts (luật + lý do).
import { useEffect } from 'react'
import { ketThucLuotToanManHinh, theoDoiToanManHinh, xinToanManHinh } from '../lib/toan-man-hinh-game'

export function useToanManHinhGame(dangMoGame: boolean): void {
  useEffect(() => {
    if (!dangMoGame) return
    const goTheoDoi = theoDoiToanManHinh()
    const chamDau = () => xinToanManHinh('cham-dau')
    // `pointerup` (không phải pointerdown): với cảm ứng, chính pointerup/touchend mới cấp "cử chỉ người dùng" cho requestFullscreen; với chuột,
    // cử chỉ cấp từ lúc nhấn vẫn còn hiệu lực vài giây. capture: chạm ở BẤT KỲ đâu trong game (kể cả nút) đều tính là lần chạm đầu; "đúng một lần mỗi lượt" do `xinToanManHinh('cham-dau')` giữ.
    document.addEventListener('pointerup', chamDau, { capture: true })
    return () => {
      document.removeEventListener('pointerup', chamDau, { capture: true })
      goTheoDoi()
      ketThucLuotToanManHinh()
    }
  }, [dangMoGame])
}
