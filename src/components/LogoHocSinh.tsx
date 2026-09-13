interface LogoHocSinhProps {
  size?: number
  hienChu?: boolean
  className?: string
  phuDe?: string
}

/**
 * LOGO APP HỌC SINH — Chuẩn Google Material 3 / Classroom.
 * Biểu tượng cuốn sách tri thức mở ra và ngôi sao tiến bộ 4 màu Google.
 * Đồng nhất hình khối với Logo Giáo viên nhưng mang bản sắc học tập rõ rệt.
 * Không chứa mã hex thô (tuân thủ check:mau).
 */
export default function LogoHocSinh({
  size = 36,
  hienChu = false,
  className = '',
  phuDe = 'HỌC SINH',
}: LogoHocSinhProps) {
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
        {/* Nền Squircle bo góc đồng nhất với logo Giáo viên */}
        <rect
          x="2"
          y="2"
          width="44"
          height="44"
          rx="12"
          className="fill-white dark:fill-slate-900 stroke-slate-200 dark:stroke-slate-800"
          strokeWidth="1.5"
        />

        {/* Ngôi sao tri thức / Tiến bộ bay lên từ trang sách (Google Vàng / Hổ phách) */}
        <path
          d="M24 8L25.8 13.2L31 15L25.8 16.8L24 22L22.2 16.8L17 15L22.2 13.2L24 8Z"
          fill="var(--gg-vang)"
        />

        {/* Tia sáng nhỏ phụ bên phải (Google Đỏ) */}
        <circle cx="34" cy="11" r="1.5" fill="var(--gg-do)" />

        {/* Cuốn sách tri thức mở ra: Trang trái (Google Lam) */}
        <path
          d="M23 25.5C18.5 24 13 24.8 10 26.5V36.5C13 34.8 18.5 34 23 35.5V25.5Z"
          fill="var(--gg-xanh)"
        />

        {/* Trang phải (Google Lục) */}
        <path
          d="M25 25.5C29.5 24 35 24.8 38 26.5V36.5C35 34.8 29.5 34 25 35.5V25.5Z"
          fill="var(--gg-luc)"
        />

        {/* Gáy sách và dải đánh dấu trang (Google Đỏ) */}
        <path
          d="M23 25.5V37.5C23 38.3 25 38.3 25 37.5V25.5"
          stroke="var(--gg-do)"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Đường gân trang sách tinh tế */}
        <path
          d="M13 29.5C16 28.5 19.5 28.8 21 29.5"
          stroke="white"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeOpacity="0.75"
        />
        <path
          d="M27 29.5C28.5 28.8 32 28.5 35 29.5"
          stroke="white"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeOpacity="0.75"
        />
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
                background: 'var(--gg-luc-nen)',
                color: 'var(--gg-luc)',
              }}
            >
              {phuDe}
            </span>
          </div>
          <span
            className="text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5"
            style={{ fontSize: '11px', fontFamily: 'var(--sans)' }}
          >
            Cổng Luyện Thi & Học Tập
          </span>
        </div>
      )}
    </div>
  )
}
