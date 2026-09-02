// LOGO "A – AVOGADRO" của trung tâm (docs/logo-goc.png) dựng lại thành vector:
// thân đứng dày, chân trái chéo bị NGẮT một đoạn (chỗ số 6,022·10²³ trong
// logo gốc) rồi nối tiếp bằng nét rời màu --xanh. Chữ A lấy màu currentColor
// nên tự hợp nền sáng/tối; cùng hình với icon app (public/icon-*.png).
export default function LogoDDH({ size = 48, className = '' }: { size?: number; className?: string }) {
  return (
    <svg viewBox="78 44 344 424" width={size} height={Math.round((size * 424) / 344)} className={className} aria-hidden="true" focusable="false">
      <polygon points="364,101 405.8,60.3 405.8,451.7 364,421.3" fill="currentColor" />
      <polyline points="405.8,60.3 219.6,240.8 364,305.4" fill="none" stroke="currentColor" strokeWidth="24.7" strokeLinejoin="miter" strokeMiterlimit="8" />
      <line x1="158.8" y1="299.7" x2="94.2" y2="362.4" stroke="var(--xanh)" strokeWidth="24.7" />
    </svg>
  )
}
