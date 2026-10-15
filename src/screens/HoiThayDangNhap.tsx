// THẺ ĐĂNG NHẬP CỦA ĐƯỜNG /hoi-thay (HoiThayScreen.tsx): chính màn đăng nhập học sinh của app (DangNhapHocSinh, cả lối đặt mật khẩu lần đầu)
// + nút đóng (về trang bài làm) + một dòng nói vì sao phải đăng nhập. Mảnh riêng: em đã có phiên thì không tải phần này.
// Đăng nhập THƯỜNG (hsDangNhapApi), không xin kèm Sảnh như cổng /hs: ở đây em chỉ hỏi một câu, không vào Sảnh.
import { LogoDoc } from '../components/LogoVai'
import DangNhapHocSinh, { type ApiDangNhapHs } from './DangNhapHocSinh'
import { hsDangNhapApi, hsDatMatKhauApi } from '../lib/hs-dang-nhap-api'
import type { ThongTinHs } from '../lib/phien-hoc-sinh'

const API: ApiDangNhapHs = { dangNhap: hsDangNhapApi, datMatKhau: hsDatMatKhauApi }

export default function HoiThayDangNhap({ onDangNhap, onDong }: { onDangNhap: (t: ThongTinHs) => void | Promise<void>; onDong: () => void }) {
  return (
    <div className="htt-dang-nhap">
      <button type="button" className="htt-dong m3" onClick={onDong} aria-label="Đóng, quay lại bài làm">
        {/* dấu X vẽ thẳng (không nhập lucide: thêm một tên xuất vào khối biểu tượng chung của ba app) */}
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
      </button>
      <p className="htt-vi-sao m3">Em đăng nhập một lần để hỏi Thầy câu này.</p>
      <DangNhapHocSinh api={API} onDangNhap={onDangNhap} logo={<LogoDoc vai="hs" size={48} />} />
    </div>
  )
}
