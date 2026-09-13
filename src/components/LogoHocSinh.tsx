interface LogoHocSinhProps {
  size?: number
  hienChu?: boolean
  className?: string
  phuDe?: string
}

/**
 * LOGO APP HỌC SINH — Chuẩn Google Material 3 / Google Classroom.
 * Tái thiết kế từ Logo gốc thương hiệu ĐỖ ĐẠI HỌC:
 * - Khối chữ số "4" cách điệu đặc trưng thương hiệu.
 * - Trụ đứng mang dòng chữ "ĐỖ ĐẠI HỌC" màu Google Green biểu trưng cho sự tiến bộ và sức trẻ.
 * - Hằng số hoá học Avogadro "6,022 · 10²³" chạy dọc thanh ngang màu Google Green.
 * - Vết gạch chéo nghiêng "/" góc dưới trái màu Google Red năng động.
 * - Ngôi Sao Tiến Bộ 4 cánh (Google Sparkle Star) đỉnh chóp.
 * - Vòng tròn 4 dải màu Google (Vàng - Lục - Lam - Đỏ) bao quanh.
 * TUÂN THỦ: Không chứa mã hex thô (vượt qua check:mau bằng CSS variables).
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
        viewBox="0 0 512 512"
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
          x="16"
          y="16"
          width="480"
          height="480"
          rx="112"
          className="fill-white dark:fill-slate-900 stroke-slate-200 dark:stroke-slate-800"
          strokeWidth="3"
        />

        {/* Vòng tròn 4 màu Google chuẩn nhận diện (xoay màu chủ đạo Lục cho Học sinh) */}
        <g transform="translate(256, 256) rotate(45)">
          <circle
            cx="0"
            cy="0"
            r="216"
            fill="none"
            stroke="var(--gg-luc)"
            strokeWidth="9"
            strokeDasharray="320 1050"
            strokeLinecap="round"
          />
          <circle
            cx="0"
            cy="0"
            r="216"
            fill="none"
            stroke="var(--gg-xanh)"
            strokeWidth="9"
            strokeDasharray="320 1050"
            strokeDashoffset="-340"
            strokeLinecap="round"
          />
          <circle
            cx="0"
            cy="0"
            r="216"
            fill="none"
            stroke="var(--gg-do)"
            strokeWidth="9"
            strokeDasharray="320 1050"
            strokeDashoffset="-680"
            strokeLinecap="round"
          />
          <circle
            cx="0"
            cy="0"
            r="216"
            fill="none"
            stroke="var(--gg-vang)"
            strokeWidth="9"
            strokeDasharray="320 1050"
            strokeDashoffset="-1020"
            strokeLinecap="round"
          />
        </g>

        {/* Cốt lõi thương hiệu: Chữ "4" cách điệu chuẩn Google */}
        {/* 1. Cánh chéo đỉnh: Google Lam */}
        <path d="M336 92 L336 142 L198 280 L154 240 Z" fill="var(--gg-xanh)" />

        {/* 2. Thanh ngang liên kết: Google Vàng */}
        <path d="M154 240 L198 280 L300 326 L300 274 Z" fill="var(--gg-vang)" />

        {/* 3. Trụ đứng ĐỖ ĐẠI HỌC: Google Lục (Học sinh) */}
        <path d="M300 128 L336 92 L344 92 L344 456 L300 440 Z" fill="var(--gg-luc)" />

        {/* Dòng chữ dọc ĐỖ ĐẠI HỌC khắc trên trụ đứng */}
        <g
          fill="white"
          fontFamily="var(--sans)"
          fontWeight="900"
          fontSize="16.5"
          textAnchor="middle"
        >
          <text x="322" y="156">Đ</text>
          <text x="322" y="186">Ỗ</text>
          <text x="322" y="224">Đ</text>
          <text x="322" y="254">Ạ</text>
          <text x="322" y="282">I</text>
          <text x="322" y="320">H</text>
          <text x="322" y="350">Ọ</text>
          <text x="322" y="378">C</text>
        </g>

        {/* 4. Hằng số Avogadro Hoá học 6,022 · 10²³ dưới thanh ngang */}
        <g transform="translate(68, 252) rotate(20.5)">
          <text
            x="22"
            y="34"
            fontFamily="var(--sans)"
            fontWeight="800"
            fontSize="24"
            fill="var(--gg-luc)"
            letterSpacing="0.5"
          >
            6,022 · 10<tspan dy="-10" fontSize="16" fontWeight="900">23</tspan>
          </text>
        </g>

        {/* 5. Dấu gạch chéo thương hiệu góc dưới trái: Google Đỏ */}
        <path d="M106 324 L126 344 L80 390 L60 370 Z" fill="var(--gg-do)" rx="5" />

        {/* 6. Biểu tượng vai trò Học Sinh: Ngôi sao 4 cánh tiến bộ đỉnh chóp */}
        <g transform="translate(336, 72)">
          <path
            d="M0 -34 C1 -12 12 -1 34 0 C12 1 1 12 0 34 C-1 12 -12 1 -34 0 C-12 -1 -1 -12 0 -34 Z"
            fill="var(--gg-vang)"
          />
          <circle cx="0" cy="0" r="6" fill="var(--gg-do)" />
          <circle cx="20" cy="-18" r="4" fill="var(--gg-luc)" />
          <circle cx="-18" cy="18" r="3" fill="var(--gg-xanh)" />
        </g>
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
