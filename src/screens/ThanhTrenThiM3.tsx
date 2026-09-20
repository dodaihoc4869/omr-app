// THANH TRÊN MÀN THI THẬT — bản Material 3 (bản vẽ thầy chốt ThiDangLam / ThiCanhBao). CHỈ trình bày lại dữ liệu ĐÃ CÓ của màn thi:
// viên thuốc đồng hồ (đỏ khi còn ≤ 5 phút) · tên ca + số câu · "Đã làm x/y" · trạng thái lưu (chữ `dotLabel` nguyên văn của màn) · nút danh sách câu ·
// thanh tiến độ 4 px sát mép dưới. KHÔNG state, KHÔNG hiệu ứng, KHÔNG gọi gì: mọi giá trị và mọi hành động do màn thi truyền vào.
// Cao ĐÚNG 56 px (= CAO_THANH_TREN của tấm giữ-để-đọc và top của dải cảnh báo rời màn) và z-30 như thanh cũ; app giáo viên vẫn dùng thanh cũ.
import { Check, CloudOff, LayoutGrid, Timer } from 'lucide-react'
import './man-thi-m3.css'

export interface ThanhTrenThiM3Props {
  /** Chuỗi đồng hồ đã định dạng (mm:ss) — bài tập về nhà thì null. */
  dongHo: string | null
  /** Bài tập về nhà: chữ thay cho đồng hồ ("Hạn 21/09" / "Bài tập"). */
  chuThayDongHo: string
  gap: boolean
  tenCa: string
  daLam: number
  tong: number
  /** Chữ trạng thái lưu của màn thi: 'đã lưu' | 'đang lưu…' | 'mất mạng — đã lưu trên máy'. */
  nhanLuu: string
  mayNgoaiMang: boolean
  dangLuu: boolean
  onMoLuoi: () => void
}

export default function ThanhTrenThiM3({ dongHo, chuThayDongHo, gap, tenCa, daLam, tong, nhanLuu, mayNgoaiMang, dangLuu, onMoLuoi }: ThanhTrenThiM3Props) {
  const phanTram = tong ? Math.min(100, (daLam / tong) * 100) : 0
  const tieuDe = tenCa.trim() ? `${tenCa.trim()} · ${tong} câu` : `${tong} câu`
  return (
    <div className="thi-tren" data-gap={gap ? 'true' : undefined}>
      <div className="thi-tren-hang">
        <div className="thi-vien-thuoc" title={dongHo === null ? 'Bài tập về nhà — không tính giờ' : undefined}>
          <Timer size={18} aria-hidden="true" />
          <span>{dongHo ?? chuThayDongHo}</span>
        </div>
        <div className="thi-tren-chu">
          <div className="thi-tren-ten">{tieuDe}</div>
          <div className="thi-tren-da-lam">
            Đã làm {daLam}/{tong}
          </div>
        </div>
        <div className="thi-luu" data-trang-thai={mayNgoaiMang ? 'ngoai-mang' : dangLuu ? 'dang-luu' : 'da-luu'} role="status" aria-label={nhanLuu} title={nhanLuu}>
          {mayNgoaiMang ? <CloudOff size={14} aria-hidden="true" /> : <Check size={14} aria-hidden="true" />}
          <span className="thi-luu-chu">{nhanLuu}</span>
        </div>
        <button type="button" onClick={onMoLuoi} className="thi-nut-luoi" title="Danh sách câu" aria-label="Danh sách câu">
          <LayoutGrid size={22} aria-hidden="true" />
        </button>
      </div>
      <div className="thi-tien-do" role="progressbar" aria-label="Số câu đã làm" aria-valuemin={0} aria-valuemax={tong} aria-valuenow={daLam}>
        <div className="thi-tien-do-day" style={{ width: `${phanTram}%` }} />
      </div>
    </div>
  )
}
