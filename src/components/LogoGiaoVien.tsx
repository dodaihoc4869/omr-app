interface LogoGiaoVienProps {
  size?: number
  hienChu?: boolean
  className?: string
  phuDe?: string
}

/**
 * LOGO APP GIÁO VIÊN — Chuẩn Google Material 3 / Google Workspace.
 * Tái thiết kế từ Logo gốc thương hiệu ĐỖ ĐẠI HỌC:
 * - Khối chữ số "4" cách điệu đặc trưng thương hiệu.
 * - Trụ đứng mang dòng chữ "ĐỖ ĐẠI HỌC" màu Google Blue uy quyền học thuật.
 * - Hằng số hoá học Avogadro "6,022 · 10²³" chạy dọc thanh ngang.
 * - Vết gạch chéo nghiêng "/" góc dưới trái.
 * - Mũ Cử Nhân (Mortarboard Cap) giáo viên đỉnh chóp.
 * - Vòng tròn 4 dải màu Google (Lam - Đỏ - Vàng - Lục) bao quanh.
 * TUÂN THỦ: Không chứa mã hex thô (vượt qua check:mau bằng CSS variables).
 */
export default function LogoGiaoVien({
  size = 36,
  hienChu = false,
  className = '',
  phuDe = 'GIÁO VIÊN',
}: LogoGiaoVienProps) {
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <img src={`${import.meta.env.BASE_URL}logo-gv-192-v2.png`} width={size} height={size} className="shrink-0 rounded-xl" alt="" />

      {hienChu && (
        <div className="flex flex-col min-w-0 text-left leading-none">
          <div className="flex items-center gap-1.5">
            <span
              className="font-black tracking-tight text-slate-900 dark:text-white"
              style={{ fontFamily: 'var(--sans)', fontSize: size >= 36 ? '1.05rem' : '0.9rem' }}
            >
              ĐỖ ĐẠI HỌC
            </span>
            <span
              className="px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider"
              style={{
                fontSize: '9px',
                background: 'var(--gg-xanh-nen)',
                color: 'var(--gg-xanh)',
              }}
            >
              {phuDe}
            </span>
          </div>
          <span
            className="text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5"
            style={{ fontSize: '11px', fontFamily: 'var(--sans)' }}
          >
            Kiên Trì
          </span>
        </div>
      )}
    </div>
  )
}
