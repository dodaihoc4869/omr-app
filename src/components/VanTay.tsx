// VÂN TAY IN LÊN MÀN THI — BAOMATCATHI.md mục 4.4.
//
// Không đo được MÀN HÌNH, nhưng ẢNH CHỤP thì luôn chứa đủ bốn góc. Nên thay vì
// cố nhìn thấy ảnh nhỏ (web không đọc được lớp phủ của hệ điều hành), in danh
// tính em lên chính khung hình: ảnh trôi ra ngoài thì truy được ngay em nào.
//
// Em cắt góc trái dưới để giấu ảnh nhỏ vừa chụp thì vẫn còn ba góc và lớp chéo
// ở giữa; cắt hết bốn góc thì mất luôn phần đề.
//
// MỘT thẻ `<svg>` duy nhất dùng `<pattern>` cho lớp chéo — cấm dựng hàng chục
// thẻ chữ trong DOM, vân tay không được làm giảm tốc độ cuộn.
import { useId } from 'react'

/** Độ mờ lớp chéo và bốn khối góc. Đọc đề vẫn thoải mái ở cả nền sáng và tối. */
export const MO_VAN_TAY = 0.07
export const MO_VAN_TAY_GOC = 0.1
/** Chéo — cắt cúp không bỏ được hết. */
export const GOC_VAN_TAY = -28

export interface VanTayProps {
  sbd: string
  hoTen: string
  maCa: string
  /** Giờ hiện trên vân tay. Truyền vào để test dựng được chuỗi cố định. */
  gio?: string
}

/** Chuỗi in trên lớp chéo. CHỈ bốn thứ này — cấm thêm số điện thoại hay gì khác. */
export function chuVanTay(sbd: string, hoTen: string, maCa: string, gio: string): string {
  return [sbd, hoTen, maCa, gio].filter(Boolean).join(' · ')
}

/** Chuỗi in ở bốn góc: ngắn hơn, để góc ảnh nào còn lại cũng đọc ra em nào. */
export function chuGoc(sbd: string, hoTen: string): string {
  return [sbd, hoTen].filter(Boolean).join(' · ')
}

export default function VanTay({ sbd, hoTen, maCa, gio }: VanTayProps) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '')
  const luc = gio ?? new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  const chu = chuVanTay(sbd, hoTen, maCa, luc)
  const goc = chuGoc(sbd, hoTen)

  const O_GOC: React.CSSProperties = {
    position: 'fixed',
    fontFamily: 'var(--sans)',
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--muc)',
    opacity: MO_VAN_TAY_GOC,
    pointerEvents: 'none',
    zIndex: 'var(--z-van-tay)' as unknown as number,
    whiteSpace: 'nowrap',
  }

  return (
    <>
      {/* LỚP CHÉO — một thẻ svg, một pattern, lặp khắp màn. */}
      <svg
        aria-hidden
        data-van-tay="cheo"
        style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 'var(--z-van-tay)' as unknown as number, opacity: MO_VAN_TAY }}
      >
        <defs>
          <pattern id={`vt${id}`} width={320} height={140} patternUnits="userSpaceOnUse" patternTransform={`rotate(${GOC_VAN_TAY})`}>
            <text x={0} y={70} fill="var(--muc)" style={{ fontFamily: 'var(--sans)', fontSize: 12, fontWeight: 700 }}>
              {chu}
            </text>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#vt${id})`} />
      </svg>

      {/* BỐN GÓC — đậm hơn lớp chéo, để một góc ảnh còn lại cũng truy ra em nào. */}
      <div aria-hidden data-van-tay="goc" style={{ ...O_GOC, top: 6, left: 8 }}>
        {goc}
      </div>
      <div aria-hidden data-van-tay="goc" style={{ ...O_GOC, top: 6, right: 8 }}>
        {goc}
      </div>
      <div aria-hidden data-van-tay="goc" style={{ ...O_GOC, bottom: 6, left: 8 }}>
        {goc}
      </div>
      <div aria-hidden data-van-tay="goc" style={{ ...O_GOC, bottom: 6, right: 8 }}>
        {goc}
      </div>
    </>
  )
}
