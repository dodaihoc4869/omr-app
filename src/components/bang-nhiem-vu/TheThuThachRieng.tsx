// THẺ "THỬ THÁCH RIÊNG HÔM NAY" — lời mời của "Bộ não A.I hỗ trợ riêng em <họ tên>" ở ĐẦU Bảng nhiệm vụ học sinh (ngay dưới thanh tiến độ).
// MỘT nút chính "Làm mấy câu này" (mở màn ôn câu với đúng câu máy chủ đã chốt) + nút chữ "Để sau" (ẩn tới ngày mai, không hỏi lại).
// KHÔNG bắt buộc, không hạn, không tính vào bài tập về nhà — thẻ nói thẳng điều đó. Lời mời NGUYÊN VĂN của Bộ não (chỉ vẽ như chữ); số về thần thú
// (cấp, EXP còn thiếu, mảnh khiên, chuỗi ngày) là SỐ THẬT máy chủ trả — thiếu số nào thì bỏ dòng đó. Không thử thách hợp lệ ⇒ màn cha KHÔNG dựng thẻ.
// Không emoji. Màu chỉ đọc biến --m3-* (thu-thach-rieng.css).
import { CheckCircle2, Shield, Sparkles } from 'lucide-react'
import { CHU_KHONG_BAT_BUOC, chuDaXong, chuDangLam, chuSoCau, dongThanThu, soCauConLai, type ThuThachRieng } from '../../lib/thu-thach-rieng'
import './m3-theme.css'
import './thu-thach-rieng.css'

export default function TheThuThachRieng({
  thuThach,
  hoTen,
  onLam,
  onDeSau,
}: {
  thuThach: ThuThachRieng
  hoTen: string
  onLam: (t: ThuThachRieng) => void
  onDeSau: (t: ThuThachRieng) => void
}) {
  const nhan = `Bộ não A.I hỗ trợ riêng em ${hoTen}`.trim()
  const xong = thuThach.trangThai === 'xong'
  const dangLam = thuThach.trangThai === 'dang_lam'
  const dong = dongThanThu(thuThach)
  const th = thuThach.thanThu
  const coThanhKhien = !!th && th.manhKhien !== null && th.manhKhienTong !== null
  const conLai = soCauConLai(thuThach)
  return (
    <section className="bnv-tt" data-vung="thu-thach-rieng" data-trang-thai={thuThach.trangThai} aria-labelledby="bnv-tt-ten">
      <div className="bnv-tt-dau">
        <span className="bnv-tt-o" aria-hidden="true">
          {xong ? <CheckCircle2 size={22} /> : <Sparkles size={22} />}
        </span>
        <div className="bnv-tt-tieu">
          <span className="bnv-tt-nhan">{nhan}</span>
          <h2 id="bnv-tt-ten">Thử thách riêng hôm nay</h2>
        </div>
      </div>
      {xong ? (
        <p className="bnv-tt-loi" data-vung="thu-thach-xong">
          {chuDaXong(thuThach)}
        </p>
      ) : (
        <p className="bnv-tt-loi">{thuThach.loiMoi}</p>
      )}

      {dong.length > 0 && (
        <ul className="bnv-tt-so" aria-label={`Số thật của ${th?.ten ?? 'thần thú'}`} data-vung="thu-thach-than-thu">
          {dong.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      )}
      {coThanhKhien && (
        <div
          className="bnv-tt-thanh"
          role="progressbar"
          aria-label="Mảnh khiên đã có"
          aria-valuemin={0}
          aria-valuemax={th!.manhKhienTong!}
          aria-valuenow={th!.manhKhien!}
        >
          <Shield size={16} aria-hidden="true" />
          <span className="bnv-tt-thanh-nen">
            <i style={{ width: `${Math.round((th!.manhKhien! / th!.manhKhienTong!) * 100)}%` }} />
          </span>
        </div>
      )}

      {!xong && (
        <>
          {dangLam && <p className="bnv-tt-phu">{chuDangLam(thuThach)}</p>}
          <ul className="bnv-tt-chip" aria-label="Về thử thách này">
            <li>{chuSoCau(thuThach.soCau)}</li>
            <li>{CHU_KHONG_BAT_BUOC}</li>
          </ul>
          {thuThach.thieu && thuThach.thieu.lyDo && <p className="bnv-tt-phu">{thuThach.thieu.lyDo}</p>}
          <div className="bnv-tt-chan">
            <button type="button" className="bnv-nut-tonal" data-vai-tro="tertiary" onClick={() => onLam(thuThach)}>
              <Sparkles size={20} aria-hidden="true" />
              <span>{dangLam ? `Làm tiếp ${conLai} câu` : 'Làm mấy câu này'}</span>
            </button>
            <button type="button" className="bnv-tt-de-sau" onClick={() => onDeSau(thuThach)}>
              Để sau
            </button>
          </div>
        </>
      )}
    </section>
  )
}
