// NÚT "CHẮC / CHƯA CHẮC" của thẻ câu màn Đoàn (OMNI 3; thầy 06/10: "Nút chưa chắc với chắc đổi màu dễ nhìn hơn nhé, và bấm nó chưa phản hồi").
// Gốc lỗi: MỘT chip "Chưa chắc" dùng lớp `dh-xin` (vẽ cho nền TỐI: chữ hồng nhạt, nền hồng 14 %) nhưng nằm TRONG thẻ câu nền giấy sáng ⇒ chữ gần như tàng hình, bấm bật/tắt gần như
// không đổi màu ⇒ em tưởng "bấm không ăn". Nay: HAI nút cạnh nhau — Chắc (mặc định) / Chưa chắc — màu đặc tương phản (doan2.css, `.dh-cuoi-tin`); mỗi lần bấm: nút đổi MÀU + dấu ✓,
// nảy nhẹ, rung ngắn (máy có hỗ trợ) và bóng báo "Đã chọn: …" khoảng 2 giây (không đổi chiều cao thẻ: bóng nổi lên trên, không ăn chỗ).
// Giữ NGUYÊN hợp đồng cũ: "Chưa chắc" vẫn là `button.dh-xin[data-vung="chua-chac"]` có `aria-pressed`; bấm lần nữa ⇒ tắt (về Chắc); cờ gửi `tuTin:'chua_chac'` do nơi gọi (`onChuaChac`).
import { useEffect, useState } from 'react'
import { BONG_CHAC, BONG_CHUA_CHAC, CHIP_CHAC, CHIP_CHUA_CHAC, GOI_Y_CHIP_CHUA_CHAC, HOI_CHAC } from '../../lib/omni-chu'

/** Bóng báo hiện bao lâu (ms). */
export const BONG_TU_TIN_MS = 2200

/** Rung ngắn khi chọn (Android/Chrome có `navigator.vibrate`; nơi khác bỏ qua). Chưa chắc rung hai nhịp để phân biệt với Chắc. */
function rung(chuaChac: boolean) {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate(chuaChac ? [14, 40, 14] : 10)
  } catch {
    /* chỉ là tiện: bị chặn ⇒ bỏ qua */
  }
}

export default function NutTuTin({ chuaChac, onChuaChac }: { chuaChac: boolean; onChuaChac: (v: boolean) => void }) {
  // Bóng báo: `lan` tăng mỗi lần bấm để hẹn giờ ẩn chạy lại từ đầu, kể cả bấm lại đúng nút đang chọn.
  const [bong, setBong] = useState<{ chua: boolean; lan: number } | null>(null)
  useEffect(() => {
    if (!bong) return
    const hen = setTimeout(() => setBong(null), BONG_TU_TIN_MS)
    return () => clearTimeout(hen)
  }, [bong])
  const chon = (v: boolean) => {
    if (v !== chuaChac) {
      onChuaChac(v)
      rung(v)
    }
    setBong((b) => ({ chua: v, lan: (b?.lan ?? 0) + 1 }))
  }
  return (
    <div className="dh-chac" role="group" aria-label={HOI_CHAC} data-vung="tu-tin">
      <button type="button" className="dh-xin" data-vung="chac" aria-pressed={!chuaChac} onClick={() => chon(false)}>
        {CHIP_CHAC}
      </button>
      <button type="button" className="dh-xin" data-vung="chua-chac" aria-pressed={chuaChac} title={GOI_Y_CHIP_CHUA_CHAC} onClick={() => chon(!chuaChac)}>
        {CHIP_CHUA_CHAC}
      </button>
      {bong && (
        <span key={bong.lan} className="dh-chac-bong" role="status" data-vung="tu-tin-bong">
          {bong.chua ? BONG_CHUA_CHAC : BONG_CHAC}
        </span>
      )}
    </div>
  )
}
