// ĐIỂM DANH BUỔI HỌC — lối vào trên app học sinh (bảng Dạy học của thầy, 28/09).
//  · Có buổi học ĐANG MỞ của lớp em mà em chưa điểm danh ⇒ thẻ nhỏ nổi trên Sảnh / Bảng nhiệm vụ: "Điểm danh buổi học" + ô nhập mã 6 số.
//  · Em quét QR trên máy chiếu bằng máy ảnh điện thoại ⇒ app mở với `?diem-danh=<mã>` ⇒ tự điểm danh, không phải gõ.
//  · Em chỉ điểm danh cho CHÍNH MÌNH (máy chủ lấy SBD từ token). Mã đổi mỗi phút — mã cũ bị từ chối bằng lời dễ hiểu.
//  · Hỏi máy chủ MỘT lần khi mở app + khi em quay lại tab (không vòng hỏi nền). Máy chủ chưa có lệnh ⇒ không hiện gì.
import { ngayGon, useDiemDanhHs } from './diem-danh-hs'
import './diem-danh-hs.css'
// Phần dùng chung (hook, định dạng ngày, kiểu trạng thái) ở diem-danh-hs.ts — xuất lại cho nơi gọi cũ.
export { ngayGon, useDiemDanhHs, type TrangThaiDiemDanh } from './diem-danh-hs'

export default function TheDiemDanhHs({ token }: { token: string }) {
  const { tt, setTt, mo, setMo, ma, setMa, loi, setLoi, dangGui, gui, oNhap } = useDiemDanhHs(token)

  if (tt.loai === 'an') return null

  if (tt.loai === 'xong')
    return (
      <div className="dd-hs dd-hs--xong" role="status" data-khoi="diem-danh-hs">
        <span className="dd-hs-dau" aria-hidden="true">
          ✓
        </span>
        <span className="dd-hs-chu">
          <b>Em đã điểm danh</b>
          <span>{tt.buoi.ten}</span>
        </span>
        <button type="button" className="dd-hs-an" onClick={() => setTt({ loai: 'an' })} aria-label="Ẩn thông báo điểm danh">
          Ẩn
        </button>
      </div>
    )

  return (
    <section className={`dd-hs${mo ? ' dd-hs--mo' : ' dd-hs--gon'}`} aria-label="Điểm danh buổi học" data-khoi="diem-danh-hs">
      {!mo ? (
        // GỌN (29/09, thầy: "gọn và tinh tế"): một viên thuốc nhỏ giữa mép trên — chấm nhịp + "Điểm danh" + ngày buổi; bấm mở ô nhập mã.
        <button type="button" className="dd-hs-mo" onClick={() => setMo(true)} aria-label={`Điểm danh buổi học${tt.buoi ? ` · ${tt.buoi.ten}` : ''}`}>
          <span className="dd-hs-cham" aria-hidden="true" />
          <b className="dd-hs-gon-chu">Điểm danh</b>
          {tt.buoi && <span className="dd-hs-gon-phu">{ngayGon(tt.buoi.ten)}</span>}
          <span className="dd-hs-gon-mui" aria-hidden="true">›</span>
        </button>
      ) : (
        <form
          className="dd-hs-form"
          onSubmit={(e) => {
            e.preventDefault()
            void gui(ma)
          }}
        >
          <div className="dd-hs-dong">
            <h2>Điểm danh buổi học</h2>
            <button type="button" className="dd-hs-an" onClick={() => setMo(false)}>
              Thu gọn
            </button>
          </div>
          {tt.buoi && <p className="dd-hs-ten">{tt.buoi.ten}</p>}
          <label htmlFor="dd-hs-ma">Mã 6 số trên máy chiếu (hoặc quét mã QR bằng máy ảnh)</label>
          <div className="dd-hs-nhap">
            <input
              id="dd-hs-ma"
              ref={oNhap}
              value={ma}
              onChange={(e) => {
                setMa(e.target.value.replace(/\D/g, '').slice(0, 6))
                setLoi('')
              }}
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={7}
              placeholder="000 000"
              aria-invalid={!!loi}
              aria-describedby={loi ? 'dd-hs-loi' : undefined}
              autoFocus
            />
            <button type="submit" className="dd-hs-gui" disabled={dangGui || ma.length !== 6}>
              {dangGui ? 'Đang gửi…' : 'Điểm danh'}
            </button>
          </div>
          {loi && (
            <p id="dd-hs-loi" className="dd-hs-loi" role="alert">
              {loi}
            </p>
          )}
          <p className="dd-hs-phu">Mã đổi mỗi phút. Em chỉ điểm danh được cho chính mình.</p>
        </form>
      )}
    </section>
  )
}
