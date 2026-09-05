// LOGO "A – AVOGADRO" của trung tâm, dựng lại thành vector: thân đứng dày, chân
// trái chéo bị NGẮT một đoạn (chỗ số 6,022·10²³ trong logo gốc) rồi nối tiếp
// bằng nét rời màu --xanh.
//
// THIẾT KẾ LẠI 05/09: nét chéo dày 24,7 lên 40 cho CÂN với thân đứng (dày 41,8)
// và cho đọc được ở cỡ nhỏ. Nét 24,7 vẽ ở biểu tượng 48 px chỉ còn hơn 1,6 px,
// nhìn ra một vệt mờ chứ không ra chữ A. Đầu nét bo tròn, khớp với bộ biểu
// tượng trong public/ (cùng một hình, cùng độ dày).
//
// Chữ A lấy `currentColor` nên tự hợp cả nền sáng lẫn nền tối; chỉ nét rời cố
// định màu --xanh. Không hard-code mã màu (check:mau).
export default function LogoDDH({ size = 48, className = '' }: { size?: number; className?: string }) {
  return (
    <svg viewBox="74 38 334 416" width={size} height={Math.round((size * 416) / 334)} className={className} aria-hidden="true" focusable="false">
      <polygon points="364,101 405.8,60.3 405.8,451.7 364,421.3" fill="currentColor" />
      <polyline points="405.8,60.3 219.6,240.8 364,305.4" fill="none" stroke="currentColor" strokeWidth="40" strokeLinejoin="round" strokeLinecap="round" />
      <line x1="170" y1="292" x2="96" y2="364" stroke="var(--xanh)" strokeWidth="40" strokeLinecap="round" />
    </svg>
  )
}
