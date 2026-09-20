import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { dinhDangMa } from '../lib/them-phut-api'

/** CHIẾU MÃ VÀO THI — tấm phủ toàn màn cho thầy chiếu lên máy chiếu: mã ca cỡ rất lớn (tách nhóm 3 số), địa chỉ vào thi, tên ca, và (ca có
 *  phòng chờ, chưa bắt đầu) số em đã vào chờ. TUYỆT ĐỐI KHÔNG hiện tên em, điểm hay lý do gì. Đóng: Esc hoặc nút Đóng. Không thư viện mới, không QR. */
export default function TamPhuChieuMa({ maCa, tenCa, diaChi, soEmCho, onDong }: { maCa: string; tenCa: string; diaChi: string; soEmCho: number | null; onDong: () => void }) {
  const nutDong = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const truoc = document.activeElement as HTMLElement | null
    nutDong.current?.focus()
    const phim = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onDong()
      }
    }
    window.addEventListener('keydown', phim, true)
    return () => {
      window.removeEventListener('keydown', phim, true)
      truoc?.focus?.()
    }
  }, [onDong])
  return (
    <div className="ca-chieu" role="dialog" aria-modal="true" aria-label="Chiếu mã vào thi">
      <button ref={nutDong} type="button" className="ca-chieu-dong" onClick={onDong}>
        <X size={20} aria-hidden="true" /> Đóng
      </button>
      <div className="ca-chieu-than">
        <p className="ca-chieu-nhan">MÃ VÀO THI</p>
        <div className="ca-chieu-ma" aria-label={`Mã ca ${maCa}`}>
          {dinhDangMa(maCa)}
        </div>
        {tenCa && <p className="ca-chieu-ten">{tenCa}</p>}
        <p className="ca-chieu-huong-dan">
          Mở <b>{diaChi}</b> trên điện thoại rồi nhập mã, hoặc vào thẳng địa chỉ đó.
        </p>
        {soEmCho !== null && (
          <p className="ca-chieu-cho" role="status">
            {soEmCho} em đã vào phòng chờ
          </p>
        )}
      </div>
    </div>
  )
}
