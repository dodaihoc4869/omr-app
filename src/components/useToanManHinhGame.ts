// Cổng học sinh: tab GAME mở ⇒ theo dõi toàn màn hình; rời game ⇒ thoát toàn màn hình. 28/09 thầy bỏ chế độ TỰ vào toàn màn hình:
// em bật/tắt bằng nút `NutToanManHinh`. Xem src/lib/toan-man-hinh-game.ts.
import { useEffect } from 'react'
import { ketThucLuotToanManHinh, theoDoiToanManHinh } from '../lib/toan-man-hinh-game'

export function useToanManHinhGame(dangMoGame: boolean): void {
  useEffect(() => {
    if (!dangMoGame) return
    const goTheoDoi = theoDoiToanManHinh()
    return () => {
      goTheoDoi()
      ketThucLuotToanManHinh()
    }
  }, [dangMoGame])
}
