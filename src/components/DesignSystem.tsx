// SÁU THÀNH PHẦN DÙNG CHUNG — bước 2 trong HETHIETKETOANAPP.md. Chỉ dùng
// biến từ src/styles/tokens.css (KHÔNG hard-code màu/cỡ chữ ở đây, đúng
// nguyên tắc "một nguồn sự thật"). CHƯA áp vào màn hình nào — đó là bước 3,
// làm sau khi thầy duyệt bộ khung này.
import type { ButtonHTMLAttributes, ReactNode } from 'react'

// ---------------------------------------------------------------------------
// <TheNoiDung> — thẻ trắng bo góc. Dùng cho: câu hỏi, thẻ kết quả, ô cài
// đặt, thẻ học sinh. KHÔNG tự đặt margin ngoài — màn hình cha xếp cách nhau
// --k5 bằng chính layout của nó (vd space-y, gap).
// ---------------------------------------------------------------------------
export function TheNoiDung({
  children,
  className = '',
  style,
  noPadding = false,
  id,
}: {
  children: ReactNode
  className?: string
  style?: React.CSSProperties
  /** true khi thẻ chứa sẵn <DauThe> full-bleed ở trên — đệm trong chỉ áp
   * cho phần nội dung bên dưới đầu thẻ, không đệm quanh đầu thẻ. */
  noPadding?: boolean
  /** id DOM để cuộn tới (scrollIntoView) — vd "cau-12". */
  id?: string
}) {
  return (
    <div
      id={id}
      className={className}
      style={{
        background: 'var(--the)',
        borderRadius: 'var(--bo-3)',
        boxShadow: 'var(--bong-1)',
        overflow: 'hidden',
        ...(noPadding ? {} : { padding: 'var(--k5)' }),
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// <DauThe> — dải gradient đầu thẻ, cao 56px. Trái: ô vuông chứa số/icon.
// Phải: tiêu đề serif đậm màu trắng. Gradient xoay --g1..--g4 theo index
// modulo 4 — hoặc `tone` cố định (không xoay) cho các màn dùng màu theo
// TRẠNG THÁI thay vì theo thứ tự (vd Duyệt câu: xanh/cam/đỏ theo chắc chắn/
// cần xem/thiếu đáp án). `solid` = nền --muc đặc, không gradient (trang kết
// quả gửi phụ huynh — trang trọng hơn).
// ---------------------------------------------------------------------------
const DAU_THE_GRADIENTS = ['var(--g1)', 'var(--g2)', 'var(--g3)', 'var(--g4)']
const DAU_THE_TONE_BG: Record<'xanh' | 'cam' | 'do' | 'tim', string> = {
  xanh: 'var(--xanh)',
  cam: 'var(--cam)',
  do: 'var(--do)',
  tim: 'var(--tim)',
}

export function DauThe({
  index = 0,
  tone,
  solid = false,
  badge,
  title,
}: {
  /** Thứ tự câu/thẻ — quyết định màu gradient xoay vòng (index % 4). Bỏ qua
   * nếu `tone` hoặc `solid` được truyền. */
  index?: number
  /** Màu CỐ ĐỊNH theo trạng thái thay vì xoay vòng theo index. */
  tone?: 'xanh' | 'cam' | 'do' | 'tim'
  /** Nền --muc đặc, không gradient. */
  solid?: boolean
  badge: ReactNode
  title: ReactNode
}) {
  const background = solid ? 'var(--muc)' : tone ? DAU_THE_TONE_BG[tone] : DAU_THE_GRADIENTS[((index % 4) + 4) % 4]
  return (
    <div
      className="flex items-center gap-3"
      style={{
        height: 56,
        borderTopLeftRadius: 'var(--bo-3)',
        borderTopRightRadius: 'var(--bo-3)',
        paddingInline: 'var(--k4)',
        background,
      }}
    >
      <div
        className="shrink-0 flex items-center justify-center text-white font-bold"
        style={{ width: 32, height: 32, borderRadius: 'var(--bo-1)', background: 'rgba(255,255,255,.2)', fontFamily: 'var(--serif)' }}
      >
        {badge}
      </div>
      <div className="flex-1 min-w-0 truncate text-white font-bold" style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-3)' }}>
        {title}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// <Hang> — hàng chạm được, cao tối thiểu 56px. Dùng cho: phương án A/B/C/D,
// danh sách lớp, danh sách học sinh, mục cài đặt. `selected` tô nền xanh +
// viền xanh (nguyên tắc DÙNG CHUNG: ở màn thi, xanh = ĐANG CHỌN; ở màn xem
// lại, xanh = ĐÚNG — ý nghĩa do màn gọi quyết định, component chỉ vẽ đúng
// 1 kiểu "được chọn/đang bật", xem GIAO-DIEN-LAM-BAI.md).
// ---------------------------------------------------------------------------
export function Hang({
  children,
  selected = false,
  tone = 'xanh',
  onClick,
  className = '',
  style,
  ...rest
}: {
  children: ReactNode
  selected?: boolean
  /** Màu trạng thái "được chọn": xanh (mặc định — đang chọn/đúng), đỏ (CHỈ
   * chế độ xem lại: phương án em chọn sai). */
  tone?: 'xanh' | 'do'
  onClick?: () => void
  className?: string
  style?: React.CSSProperties
  'data-trang-thai'?: string
}) {
  const Comp = onClick ? 'button' : 'div'
  const mau = tone === 'do' ? { nen: 'var(--do-nen)', vien: 'var(--do)' } : { nen: 'var(--xanh-nen)', vien: 'var(--xanh)' }
  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`tap-target w-full text-left flex items-center gap-2 ${className}`}
      style={{
        minHeight: 56,
        borderRadius: 'var(--bo-1)',
        padding: 'var(--k3) var(--k4)',
        background: selected ? mau.nen : 'var(--the-2)',
        border: selected ? `1.5px solid ${mau.vien}` : '1.5px solid transparent',
        transitionProperty: 'background-color, border-color',
        transitionDuration: 'var(--nhanh)',
        ...style,
      }}
      {...rest}
    >
      {children}
    </Comp>
  )
}

// ---------------------------------------------------------------------------
// <Nhan> — nhãn trạng thái nhỏ, bo tròn. xanh=xong · cam=cần xem · đỏ=lỗi ·
// tím=đang chạy · xám=chưa bắt đầu.
// ---------------------------------------------------------------------------
const NHAN_TONE: Record<'xanh' | 'cam' | 'do' | 'tim' | 'xam', { bg: string; fg: string }> = {
  xanh: { bg: 'var(--xanh-nen)', fg: 'var(--xanh)' },
  cam: { bg: 'var(--cam-nen)', fg: 'var(--cam)' },
  do: { bg: 'var(--do-nen)', fg: 'var(--do)' },
  tim: { bg: 'var(--tim-nen)', fg: 'var(--tim)' },
  xam: { bg: 'var(--the-2)', fg: 'var(--nhat)' },
}

export function Nhan({ tone, children, className = '' }: { tone: keyof typeof NHAN_TONE; children: ReactNode; className?: string }) {
  const t = NHAN_TONE[tone]
  return (
    <span
      className={`inline-flex items-center font-bold whitespace-nowrap ${className}`}
      style={{
        borderRadius: 'var(--bo-tron)',
        padding: '2px 10px',
        background: t.bg,
        color: t.fg,
        fontFamily: 'var(--sans)',
        fontSize: 'var(--cx-1)',
      }}
    >
      {children}
    </span>
  )
}

// ---------------------------------------------------------------------------
// <OThongBao> — ô ghi chú viền trái. Dùng cho: giải thích lời giải, cảnh
// báo, hướng dẫn. Mặc định cam; xanh=thành công, đỏ=lỗi.
// ---------------------------------------------------------------------------
const OTHONGBAO_TONE: Record<'cam' | 'xanh' | 'do', { bg: string; border: string }> = {
  cam: { bg: 'var(--cam-nen)', border: 'var(--cam)' },
  xanh: { bg: 'var(--xanh-nen)', border: 'var(--xanh)' },
  do: { bg: 'var(--do-nen)', border: 'var(--do)' },
}

export function OThongBao({ tone = 'cam', children, className = '' }: { tone?: 'cam' | 'xanh' | 'do'; children: ReactNode; className?: string }) {
  const t = OTHONGBAO_TONE[tone]
  return (
    <div
      className={`italic ${className}`}
      style={{
        borderRadius: 'var(--bo-1)',
        borderLeft: `3px solid ${t.border}`,
        padding: 'var(--k3) var(--k4)',
        background: t.bg,
        fontFamily: 'var(--serif)',
        fontSize: 'var(--cx-2)',
        color: 'var(--muc)',
      }}
    >
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// <NutChinh> — nút hành động cao 56px, rộng hết bề ngang. chinh=nền --muc
// đặc; phu=viền, nền trong suốt; nguyhiem=chữ/viền đỏ.
// ---------------------------------------------------------------------------
const NUT_CHINH_STYLE: Record<'chinh' | 'phu' | 'nguyhiem', React.CSSProperties> = {
  chinh: { background: 'var(--muc)', color: '#fff', border: '1px solid var(--muc)' },
  phu: { background: 'transparent', color: 'var(--muc)', border: '1px solid var(--vien-dam)' },
  nguyhiem: { background: 'transparent', color: 'var(--do)', border: '1px solid var(--do)' },
}

export function NutChinh({
  children,
  onClick,
  variant = 'chinh',
  disabled,
  type = 'button',
  className = '',
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'chinh' | 'phu' | 'nguyhiem'
  disabled?: boolean
  type?: ButtonHTMLAttributes<HTMLButtonElement>['type']
  className?: string
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`tap-target w-full font-bold disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
      style={{
        height: 56,
        borderRadius: 'var(--bo-1)',
        fontFamily: 'var(--serif)',
        fontSize: 'var(--cx-3)',
        transitionProperty: 'background-color, opacity',
        transitionDuration: 'var(--nhanh)',
        ...NUT_CHINH_STYLE[variant],
      }}
    >
      {children}
    </button>
  )
}
