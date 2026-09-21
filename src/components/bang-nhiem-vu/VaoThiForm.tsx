// FORM "VÀO PHÒNG THI TRỰC TUYẾN" của cổng học sinh (việc C · C5) — bản Material 3. StudentPortalScreen giữ nguyên `vaoThi` (kiểm mã,
// đưa danh tính đã xác thực vào màn thi); ở đây chỉ là VẺ NGOÀI: ô nhập viền nổi, nút chính primary (bản cũ dùng tím cứng), thẻ tonal.
import type { FormEventHandler } from 'react'
import { AlertCircle, LogIn } from 'lucide-react'
import '../m3'
import './vao-thi-form.css'

export default function VaoThiForm({
  maCa,
  onMaCa,
  matKhau,
  onMatKhau,
  loi,
  onSubmit,
  sbd,
  hoTen,
}: {
  maCa: string
  onMaCa: (v: string) => void
  matKhau: string
  onMatKhau: (v: string) => void
  loi: string
  onSubmit: FormEventHandler<HTMLFormElement>
  sbd: string
  hoTen?: string
}) {
  return (
    <div className="vtf">
      <div className="vtf-dau">
        <span className="vtf-bt" aria-hidden="true">
          <LogIn size={26} />
        </span>
        <h2 className="vtf-h">Vào ca kiểm tra trực tuyến</h2>
        <p className="vtf-phu">Nhập mã ca kiểm tra từ Thầy và mật khẩu ca (nếu có) để bắt đầu làm bài</p>
      </div>

      {loi && (
        <div className="vtf-loi" role="alert">
          <AlertCircle size={20} aria-hidden="true" />
          <span>{loi}</span>
        </div>
      )}

      <form onSubmit={onSubmit} className="vtf-form">
        <label className="vtf-truong">
          <span className="vtf-nhan">Mã ca kiểm tra (thường 6 chữ số)</span>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={maCa}
            onChange={(e) => onMaCa(e.target.value.replace(/\D/g, ''))}
            placeholder="Ví dụ: 543998"
            maxLength={8}
            className="vtf-nhap vtf-nhap--ma"
            required
            autoFocus
          />
        </label>

        <label className="vtf-truong">
          <span className="vtf-nhan">Mật khẩu ca kiểm tra (nếu ca có yêu cầu)</span>
          <input
            type="password"
            autoComplete="off"
            value={matKhau}
            onChange={(e) => onMatKhau(e.target.value)}
            placeholder="Để trống nếu không có"
            className="vtf-nhap"
          />
        </label>

        <p className="vtf-sbd">
          Số báo danh đăng nhập của em: <strong>{sbd}</strong>
          {hoTen ? ` (${hoTen})` : ''}
        </p>

        <button type="submit" className="m3-nut-chinh vtf-nut">
          <LogIn size={20} aria-hidden="true" />
          <span>Vào ca kiểm tra</span>
        </button>
      </form>
    </div>
  )
}
