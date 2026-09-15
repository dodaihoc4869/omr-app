/**
 * ỐNG NGHIỆM ĐỰNG EXP — bể thứ nhất, vẽ bằng SVG thuần.
 *
 * Thầy chốt 15-09: "hiển thị mục exp kiếm được kiểu ống nghiệm đựng chất lỏng
 * màu xanh lá cây, khi bấm nạp tinh lực thì ống này giảm xuống, kiếm được thì
 * lại đầy lên".
 *
 * Vẽ bằng SVG chứ không phải ảnh — kho cấm tệp ảnh, và SVG thì nét ở mọi màn.
 * Mặt chất lỏng gợn sóng bằng hai đường cong chạy ngược chiều nhau; khi rót thì
 * mực nước tụt xuống trong 0,85 giây đúng bằng thời gian cờ `dangRot` bật.
 *
 * Màu lấy từ token Tailwind dạng rgb — kho cấm mã màu #.
 */

export default function OngNghiemExp({
  dangCo,
  sucChua,
  dangRot = false,
  cao = 132,
}: {
  /** EXP đang có trong ống. */
  dangCo: number
  /** Trần ống. */
  sucChua: number
  /** Đang rót sang thần thú — mực tụt mượt về 0. */
  dangRot?: boolean
  cao?: number
}) {
  const ty = Math.max(0, Math.min(1, sucChua > 0 ? dangCo / sucChua : 0))
  const W = 54
  const H = cao
  // Lòng ống: chừa vành miệng và đáy bo tròn.
  const mep = 6
  const dinhLong = 16
  const dayLong = H - 10
  const caoLong = dayLong - dinhLong
  const mucNuoc = dayLong - caoLong * (dangRot ? 0 : ty)

  const idSong = 'song-exp'
  const idOng = 'khuon-ong'

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Ống nghiệm chứa ${dangCo} trên ${sucChua} EXP`}
      className="shrink-0 drop-shadow-sm"
    >
      <defs>
        {/* Khuôn cắt: chất lỏng không được tràn ra ngoài thành ống. */}
        <clipPath id={idOng}>
          <path
            d={`M ${mep} ${dinhLong}
                L ${mep} ${dayLong - 12}
                Q ${mep} ${dayLong} ${W / 2} ${dayLong}
                Q ${W - mep} ${dayLong} ${W - mep} ${dayLong - 12}
                L ${W - mep} ${dinhLong} Z`}
          />
        </clipPath>
        <linearGradient id={idSong} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(74, 222, 128)" />
          <stop offset="100%" stopColor="rgb(21, 128, 61)" />
        </linearGradient>
      </defs>

      {/* Thành ống */}
      <path
        d={`M ${mep} ${dinhLong}
            L ${mep} ${dayLong - 12}
            Q ${mep} ${dayLong} ${W / 2} ${dayLong}
            Q ${W - mep} ${dayLong} ${W - mep} ${dayLong - 12}
            L ${W - mep} ${dinhLong}`}
        fill="rgba(148, 163, 184, 0.10)"
        stroke="rgb(148, 163, 184)"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Chất lỏng */}
      <g clipPath={`url(#${idOng})`}>
        <rect
          x="0"
          y={mucNuoc}
          width={W}
          height={H}
          fill={`url(#${idSong})`}
          style={{ transition: 'y 850ms cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
        {/* Mặt sóng — hai lớp lệch pha cho có chuyển động. */}
        <path
          d={`M -10 ${mucNuoc} q 10 -4 20 0 t 20 0 t 20 0 t 20 0 v 20 h -90 z`}
          fill="rgb(134, 239, 172)"
          opacity="0.75"
          style={{ transition: 'transform 850ms cubic-bezier(0.4, 0, 0.2, 1)' }}
        >
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0 0; 20 0; 0 0"
            dur="3.2s"
            repeatCount="indefinite"
          />
        </path>
        {/* Bọt khí */}
        {ty > 0.04 && !dangRot && (
          <>
            <circle cx={W / 2 - 8} cy={dayLong - 8} r="2.2" fill="rgba(240, 253, 244, 0.85)">
              <animate attributeName="cy" values={`${dayLong - 6};${mucNuoc + 6}`} dur="2.6s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.9;0" dur="2.6s" repeatCount="indefinite" />
            </circle>
            <circle cx={W / 2 + 6} cy={dayLong - 4} r="1.6" fill="rgba(240, 253, 244, 0.8)">
              <animate attributeName="cy" values={`${dayLong - 4};${mucNuoc + 4}`} dur="3.4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.85;0" dur="3.4s" repeatCount="indefinite" />
            </circle>
          </>
        )}
      </g>

      {/* Vành miệng ống */}
      <rect x={mep - 3} y={dinhLong - 7} width={W - (mep - 3) * 2} height="7" rx="3"
        fill="rgb(203, 213, 225)" />
      {/* Vạch chia */}
      {[0.25, 0.5, 0.75].map((v) => (
        <line
          key={v}
          x1={W - mep - 9}
          x2={W - mep - 2}
          y1={dayLong - caoLong * v}
          y2={dayLong - caoLong * v}
          stroke="rgb(148, 163, 184)"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      ))}
    </svg>
  )
}
