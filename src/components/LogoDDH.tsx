import { AnhLogo } from './LogoVai'

/** Logo trần của thương hiệu (giáo viên) — chỉ hình, có chữ thay thế cho trình đọc màn hình. */
export default function LogoDDH({ size = 48, className = '' }: { size?: number; className?: string }) {
  return <AnhLogo vai="gv" size={size} className={className} alt="Đỗ Đại Học" />
}
