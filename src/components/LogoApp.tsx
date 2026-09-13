import LogoGiaoVien from './LogoGiaoVien'
import LogoHocSinh from './LogoHocSinh'

export { LogoGiaoVien, LogoHocSinh }

interface LogoAppProps {
  vai?: 'giaovien' | 'hocsinh'
  size?: number
  hienChu?: boolean
  className?: string
  phuDe?: string
}

/**
 * LOGO HỆ THỐNG ĐỖ ĐẠI HỌC — Tự động chuyển đổi theo vai trò Giáo viên / Học sinh.
 * Chuẩn phong cách thiết kế Google Material 3 / Google Workspace.
 */
export default function LogoApp({
  vai = 'giaovien',
  size = 36,
  hienChu = false,
  className = '',
  phuDe,
}: LogoAppProps) {
  if (vai === 'hocsinh') {
    return <LogoHocSinh size={size} hienChu={hienChu} className={className} phuDe={phuDe} />
  }
  return <LogoGiaoVien size={size} hienChu={hienChu} className={className} phuDe={phuDe} />
}
