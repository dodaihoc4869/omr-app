interface LogoGiaoVienProps {
  size?: number
  hienChu?: boolean
  className?: string
  phuDe?: string
}

/**
 * LOGO APP GIÁO VIÊN — Chuẩn Google Material 3 / Workspace.
 * Biểu tượng bảng giảng dạy & mũ cử nhân điều phối lớp học phối 4 màu đặc trưng Google.
 * Không chứa mã hex thô (tuân thủ check:mau).
 */
export default function LogoGiaoVien({
  size = 36,
  hienChu = false,
  className = '',
  phuDe = 'GIÁO VIÊN',
}: LogoGiaoVienProps) {
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <svg
        viewBox="0 0 48 48"
        width={size}
        height={size}
        className="shrink-0 drop-shadow-sm"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
      >
        {/* Nền Squircle bo góc chuẩn Google */}
        <rect
          x="2"
          y="2"
          width="44"
          height="44"
          rx="12"
          className="fill-white dark:fill-slate-900 stroke-slate-200 dark:stroke-slate-800"
          strokeWidth="1.5"
        />

        {/* 4 dải màu Google xếp hình bảng quản lý & chấm thi OMR */}
        {/* Dải xanh dương: Bảng / Đế bục giảng */}
        <path
          d="M10 32C10 29.7909 11.7909 28 14 28H34C36.2091 28 38 29.7909 38 32V34C38 36.2091 36.2091 38 34 38H14C11.7909 38 10 36.2091 10 34V32Z"
          fill="var(--gg-xanh)"
        />

        {/* Mũ cử nhân - Cánh trái (Google Lục) */}
        <path
          d="M10 20L24 13L24 23L13 23C11.3431 23 10 21.6569 10 20Z"
          fill="var(--gg-luc)"
        />

        {/* Mũ cử nhân - Cánh phải (Google Đỏ) */}
        <path
          d="M24 13L38 20C38 21.6569 36.6569 23 35 23L24 23L24 13Z"
          fill="var(--gg-do)"
        />

        {/* Đỉnh chóp & Tua mũ (Google Vàng / Hổ phách) */}
        <circle cx="24" cy="13" r="2.5" fill="var(--gg-vang)" />
        <path
          d="M24 13.5V22C24 22 25.5 23 27 23"
          stroke="var(--gg-vang)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 3 chấm OMR tượng trưng cho quét phiếu trắc nghiệm */}
        <circle cx="17" cy="33" r="1.8" fill="white" />
        <circle cx="24" cy="33" r="1.8" fill="white" />
        <circle cx="31" cy="33" r="1.8" fill="white" />
      </svg>

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
            Quản Lý & Chấm Thi OMR
          </span>
        </div>
      )}
    </div>
  )
}
