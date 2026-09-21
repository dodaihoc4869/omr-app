// THANH TRÊN của Bảng tin sàn: tiêu đề, chip mốc hiển thị, (chip "Dữ liệu mô phỏng" chỉ ở bản vẽ/kiểm thử), đồng hồ giây, chấm TRỰC TIẾP, nút Sáng/Tối.
// Nút Sáng/Tối dùng cơ chế giao diện SẴN CÓ của app (src/lib/giao-dien-thay.ts), không tự chế.
import { useEffect, useState } from 'react'
import { useGiaoDien } from '../../lib/giao-dien-thay'
import { chuMoc, gioGiayVN, gioPhutMs } from '../../lib/bang-tin-san/trang-thai'

/** Giao diện ĐANG HIỆU LỰC: người dùng ép sáng/tối thì theo đó; "theo máy" thì theo prefers-color-scheme. */
function useToiMay(): boolean {
  const [toiMay, setToiMay] = useState(() => typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches)
  useEffect(() => {
    if (typeof matchMedia !== 'function') return
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const doi = () => setToiMay(mq.matches)
    mq.addEventListener?.('change', doi)
    return () => mq.removeEventListener?.('change', doi)
  }, [])
  return toiMay
}

export function ThanhTren({ mocMs, nowMs, moPhong, matKetNoiLuc = null }: { mocMs: number; nowMs: number; moPhong?: boolean; matKetNoiLuc?: number | null }) {
  const [chon, datGiaoDien] = useGiaoDien()
  const toiMay = useToiMay()
  const toi = chon === 'toi' || (chon === 'may' && toiMay)
  return (
    <header className="bts-dau" data-khoi="thanh-tren">
      <h1>Bảng tin</h1>
      <span className="bts-chip">{chuMoc(mocMs)}</span>
      {moPhong && <span className="bts-chip bts-chip-mp">Dữ liệu mô phỏng</span>}
      <div className="bts-dau-phai">
        <span className="bts-dong-ho bts-so" aria-label="Giờ hiện tại">
          {gioGiayVN(nowMs)}
        </span>
        {matKetNoiLuc !== null ? (
          <span className="bts-truc-tiep bts-mat-ket-noi" role="status">
            <i />
            Mất kết nối · số lúc {gioPhutMs(matKetNoiLuc)}
          </span>
        ) : (
          <span className="bts-truc-tiep">
            <i />
            TRỰC TIẾP
          </span>
        )}
        <div className="bts-doi-mau" role="group" aria-label="Giao diện màu">
          <button type="button" aria-pressed={!toi} onClick={() => datGiaoDien('sang')}>
            Sáng
          </button>
          <button type="button" aria-pressed={toi} onClick={() => datGiaoDien('toi')}>
            Tối
          </button>
        </div>
      </div>
    </header>
  )
}
