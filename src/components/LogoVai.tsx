import './logo-ddh.css'

/** BỘ LOGO ĐỖ ĐẠI HỌC (thầy chốt 19/09/2026 — docs/logo-1909/DOC-TRUOC.md): mỗi app một hình khối + màu.
 *  Giáo viên = vuông bo xanh dương · Học sinh = bánh quy 12 múi xanh lá · Phụ huynh = ngôi nhà bo góc cam.
 *
 *  Logo là TỆP SVG TĨNH ở public/ (dùng qua <img>): không nhúng mã màu vào TSX (check:mau), hình khối đã nằm trong SVG nên
 *  KHÔNG bo góc / cắt thêm bằng CSS (cắt nữa là mất múi bánh quy, mái nhà). Tên tệp có `-v3` để phá cache của bản cũ. */
export type VaiLogo = 'gv' | 'hs' | 'ph'

export const NHAN_VAI: Record<VaiLogo, string> = { gv: 'GIÁO VIÊN', hs: 'HỌC SINH', ph: 'PHỤ HUYNH' }

/** Từ cỡ này trở xuống dùng bản NÉT ĐẬM (bỏ chi tiết phụ, đọc được ở cỡ nhỏ): thanh trên, thông báo. */
export const CO_NET_DAM_TOI_DA = 40

export function tepLogo(vai: VaiLogo, size: number): string {
  return `logo-${vai}${size <= CO_NET_DAM_TOI_DA ? '-nho' : ''}-v3.svg`
}

/** `alt` rỗng = hình trang trí (đã có chữ "ĐỖ ĐẠI HỌC" bên cạnh); logo đứng một mình thì truyền chữ thay thế. */
export function AnhLogo({ vai, size, className = '', alt = '' }: { vai: VaiLogo; size: number; className?: string; alt?: string }) {
  return <img src={`${import.meta.env.BASE_URL}${tepLogo(vai, size)}`} width={size} height={size} className={`shrink-0 ${className}`.trim()} alt={alt} draggable={false} />
}

export interface LogoNgangProps {
  vai: VaiLogo
  size?: number
  hienChu?: boolean
  className?: string
  phuDe?: string
}

/** Hình + (tuỳ chọn) chữ NGANG — thanh trên / thanh bên: "ĐỖ ĐẠI HỌC" đậm, nhãn vai trò, dòng `6,022 · 10²³`. */
export function LogoNgang({ vai, size = 36, hienChu = false, className = '', phuDe }: LogoNgangProps) {
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <AnhLogo vai={vai} size={size} />
      {hienChu && (
        <div className="flex flex-col min-w-0 text-left leading-none">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
            <span className="logo-ddh-ten" style={{ fontSize: size >= 36 ? '1.05rem' : '0.9rem' }}>
              ĐỖ ĐẠI HỌC
            </span>
            <span className="logo-ddh-vien" data-vai={vai}>
              {phuDe || NHAN_VAI[vai]}
            </span>
          </div>
          <span className="logo-ddh-hang-so mt-1">6,022 · 10²³</span>
        </div>
      )}
    </div>
  )
}

export interface LogoDocProps {
  vai: VaiLogo
  size?: number
  className?: string
  phuDe?: string
  /** Tên là tiêu đề trang (h1) — màn đăng nhập của cổng phụ huynh vốn dùng h1. */
  tieuDe?: boolean
}

/** Khối THƯƠNG HIỆU DỌC của màn đăng nhập / vào thi: hình, "ĐỖ ĐẠI HỌC", nhãn vai trò, dòng `6,022 · 10²³` — canh giữa. */
export function LogoDoc({ vai, size = 54, className = '', phuDe, tieuDe = false }: LogoDocProps) {
  const Ten = tieuDe ? 'h1' : 'div'
  return (
    <div className={`logo-ddh-doc select-none ${className}`}>
      <AnhLogo vai={vai} size={size} />
      <Ten className="logo-ddh-ten logo-ddh-ten--lon">ĐỖ ĐẠI HỌC</Ten>
      <span className="logo-ddh-vien" data-vai={vai}>
        {phuDe || NHAN_VAI[vai]}
      </span>
      <div className="logo-ddh-hang-so">6,022 · 10²³</div>
    </div>
  )
}
